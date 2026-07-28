"""Market-data adapters that preserve a price-return-only basis."""

from __future__ import annotations

import csv
import math
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Protocol

from .universe import UniverseAsset, normalize_market, normalize_ticker


PRICE_BASIS = "split_adjusted_close_ex_dividends"
DIVIDEND_CONFIRMED_VALUE = "confirmed_value"
DIVIDEND_CONFIRMED_ZERO = "confirmed_zero"
DIVIDEND_UNAVAILABLE = "unavailable"


class MarketDataError(RuntimeError):
    """Raised when price-only market data cannot be loaded safely."""


@dataclass(frozen=True)
class DailyObservation:
    observed_on: date
    raw_close: float
    split_factor: float = 1.0
    dividend_cash: float = 0.0


@dataclass(frozen=True)
class DividendData:
    status: str
    trailing_twelve_month_cash: float | None


@dataclass(frozen=True)
class MarketDataBundle:
    observations: tuple[DailyObservation, ...]
    dividend: DividendData
    price_basis: str = PRICE_BASIS


class MarketDataProvider(Protocol):
    def load_asset(self, asset: UniverseAsset, as_of_date: date) -> MarketDataBundle:
        ...

    def load_benchmark(
        self,
        asset: UniverseAsset,
        as_of_date: date,
    ) -> MarketDataBundle:
        ...


def split_adjusted_price_series(
    observations: tuple[DailyObservation, ...] | list[DailyObservation],
    as_of_date: date,
) -> list[tuple[date, float]]:
    filtered = sorted(
        (item for item in observations if item.observed_on <= as_of_date),
        key=lambda item: item.observed_on,
    )
    if not filtered:
        raise MarketDataError("price_history_missing")
    dates = [item.observed_on for item in filtered]
    if len(set(dates)) != len(dates):
        raise MarketDataError("duplicate_price_date")
    divisor = 1.0
    adjusted_reversed: list[tuple[date, float]] = []
    for item in reversed(filtered):
        close = float(item.raw_close)
        split_factor = float(item.split_factor)
        if not math.isfinite(close) or close <= 0:
            raise MarketDataError(f"invalid_close:{item.observed_on.isoformat()}")
        if not math.isfinite(split_factor) or split_factor <= 0:
            raise MarketDataError(
                f"invalid_split_factor:{item.observed_on.isoformat()}"
            )
        adjusted_reversed.append((item.observed_on, close / divisor))
        divisor *= split_factor
    return list(reversed(adjusted_reversed))


class InMemoryMarketDataProvider:
    """Deterministic provider used by unit tests and offline fixtures."""

    def __init__(self, bundles: dict[str, MarketDataBundle]):
        self._bundles = dict(bundles)

    def _load(self, identity: str) -> MarketDataBundle:
        try:
            return self._bundles[identity]
        except KeyError as error:
            raise MarketDataError(f"market_data_missing:{identity}") from error

    def load_asset(self, asset: UniverseAsset, as_of_date: date) -> MarketDataBundle:
        return self._load(asset.identity)

    def load_benchmark(
        self,
        asset: UniverseAsset,
        as_of_date: date,
    ) -> MarketDataBundle:
        return self._load(asset.benchmark_identity)


class CsvMarketDataProvider:
    """Read deterministic raw close, split, dividend, and status rows from CSV."""

    REQUIRED_COLUMNS = (
        "market",
        "ticker",
        "date",
        "close",
        "splitFactor",
        "dividendCash",
        "dividendStatus",
    )

    def __init__(self, path: Path | str):
        source_path = Path(path)
        with source_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            missing = [
                column
                for column in self.REQUIRED_COLUMNS
                if column not in (reader.fieldnames or ())
            ]
            if missing:
                raise MarketDataError(
                    f"{source_path} missing columns: {', '.join(missing)}"
                )
            raw_rows = list(reader)
        grouped: dict[str, list[DailyObservation]] = defaultdict(list)
        statuses: dict[str, str] = {}
        for row_number, row in enumerate(raw_rows, start=2):
            try:
                market = normalize_market(row.get("market"))
                ticker = normalize_ticker(row.get("ticker"), market)
                identity = f"{market}:{ticker}"
                observation = DailyObservation(
                    observed_on=date.fromisoformat(str(row.get("date") or "")),
                    raw_close=float(str(row.get("close") or "")),
                    split_factor=float(str(row.get("splitFactor") or "1")),
                    dividend_cash=float(str(row.get("dividendCash") or "0")),
                )
            except (ValueError, TypeError) as error:
                raise MarketDataError(
                    f"{source_path}:{row_number}: invalid market-data row"
                ) from error
            grouped[identity].append(observation)
            status = str(row.get("dividendStatus") or "").strip().lower()
            if status:
                statuses[identity] = status
        self._observations = {
            identity: tuple(observations)
            for identity, observations in grouped.items()
        }
        self._statuses = statuses

    def _load(self, identity: str, as_of_date: date) -> MarketDataBundle:
        try:
            observations = tuple(
                item
                for item in self._observations[identity]
                if item.observed_on <= as_of_date
            )
        except KeyError as error:
            raise MarketDataError(f"market_data_missing:{identity}") from error
        if not observations:
            raise MarketDataError(f"price_history_missing:{identity}")
        status = self._statuses.get(identity, DIVIDEND_UNAVAILABLE)
        cutoff = as_of_date - timedelta(days=365)
        trailing_cash = sum(
            item.dividend_cash
            for item in observations
            if cutoff <= item.observed_on <= as_of_date
        )
        if status == DIVIDEND_CONFIRMED_ZERO:
            ttm_value: float | None = 0.0
        elif status == DIVIDEND_CONFIRMED_VALUE:
            ttm_value = trailing_cash
        else:
            status = DIVIDEND_UNAVAILABLE
            ttm_value = None
        return MarketDataBundle(
            observations=observations,
            dividend=DividendData(status, ttm_value),
        )

    def load_asset(self, asset: UniverseAsset, as_of_date: date) -> MarketDataBundle:
        return self._load(asset.identity, as_of_date)

    def load_benchmark(
        self,
        asset: UniverseAsset,
        as_of_date: date,
    ) -> MarketDataBundle:
        return self._load(asset.benchmark_identity, as_of_date)


class YFinanceMarketDataProvider:
    """Optional live adapter using raw Close, splits, and separate dividends.

    ``Adj Close`` is deliberately ignored because it may incorporate cash
    dividends. Raw ``Close`` is converted to a split-adjusted, dividend-excluded
    price series by :func:`split_adjusted_price_series`.
    """

    def __init__(self, *, start_date: date = date(1990, 1, 1)):
        self.start_date = start_date
        self._cache: dict[tuple[str, date], MarketDataBundle] = {}

    def _download(self, symbol: str, as_of_date: date) -> MarketDataBundle:
        try:
            import yfinance as yf  # type: ignore
        except ImportError as error:  # pragma: no cover - optional live dependency
            raise MarketDataError("yfinance_not_installed") from error
        try:
            frame = yf.Ticker(symbol).history(
                start=self.start_date.isoformat(),
                end=(as_of_date + timedelta(days=1)).isoformat(),
                auto_adjust=False,
                actions=True,
            )
        except Exception as error:  # pragma: no cover - live provider
            raise MarketDataError(f"provider_download_failed:{symbol}") from error
        if frame is None or frame.empty or "Close" not in frame:
            raise MarketDataError(f"price_history_missing:{symbol}")
        has_dividends = "Dividends" in frame
        observations: list[DailyObservation] = []
        for index, row in frame.iterrows():
            observed_on = index.date()
            close = float(row["Close"])
            split = float(row.get("Stock Splits", 0) or 0)
            dividend = float(row.get("Dividends", 0) or 0)
            observations.append(
                DailyObservation(
                    observed_on=observed_on,
                    raw_close=close,
                    split_factor=split if split > 0 else 1.0,
                    dividend_cash=dividend,
                )
            )
        cutoff = as_of_date - timedelta(days=365)
        trailing_cash = sum(
            item.dividend_cash
            for item in observations
            if cutoff <= item.observed_on <= as_of_date
        )
        if not has_dividends:
            dividend = DividendData(DIVIDEND_UNAVAILABLE, None)
        elif trailing_cash == 0:
            dividend = DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0)
        else:
            dividend = DividendData(DIVIDEND_CONFIRMED_VALUE, trailing_cash)
        return MarketDataBundle(tuple(observations), dividend)

    def _load_cached(
        self,
        symbol: str,
        as_of_date: date,
    ) -> MarketDataBundle:
        key = (symbol, as_of_date)
        if key not in self._cache:
            self._cache[key] = self._download(symbol, as_of_date)
        return self._cache[key]

    def load_asset(self, asset: UniverseAsset, as_of_date: date) -> MarketDataBundle:
        return self._load_cached(asset.provider_symbol, as_of_date)

    def load_benchmark(
        self,
        asset: UniverseAsset,
        as_of_date: date,
    ) -> MarketDataBundle:
        return self._load_cached(asset.benchmark_provider_symbol, as_of_date)
