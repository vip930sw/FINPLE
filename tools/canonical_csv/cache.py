"""Persistent incremental raw-history cache for monthly Colab runs."""

from __future__ import annotations

import csv
import os
import re
import tempfile
import time
from datetime import date, timedelta
from pathlib import Path
from typing import Callable, Protocol

from .market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    DIVIDEND_CONFIRMED_ZERO,
    DIVIDEND_UNAVAILABLE,
    CashDistributionEvent,
    DailyObservation,
    DividendData,
    MarketDataBundle,
    MarketDataError,
    SUPPORTED_PRICE_BASES,
)
from .universe import UniverseAsset


class HistoryFetcher(Protocol):
    def fetch_history(
        self,
        symbol: str,
        start_date: date,
        as_of_date: date,
    ) -> MarketDataBundle:
        ...


class PersistentCachedMarketDataProvider:
    """Cache histories per provider symbol and fetch only the missing tail."""

    FIELDNAMES = (
        "date",
        "close",
        "splitFactor",
        "dividendCash",
        "priceBasis",
        "dividendStatus",
    )

    def __init__(
        self,
        fetcher: HistoryFetcher,
        cache_dir: Path | str,
        *,
        history_start: date = date(1990, 1, 1),
        retry_count: int = 3,
        retry_backoff_seconds: float = 5.0,
        sleep_fn: Callable[[float], None] = time.sleep,
    ):
        self.fetcher = fetcher
        self.cache_dir = Path(cache_dir)
        self.history_start = history_start
        self.retry_count = retry_count
        self.retry_backoff_seconds = retry_backoff_seconds
        self.sleep_fn = sleep_fn
        self._memory: dict[tuple[str, date], MarketDataBundle] = {}

    def _cache_path(self, symbol: str) -> Path:
        safe_symbol = re.sub(r"[^A-Za-z0-9._-]+", "_", symbol).strip("._")
        if not safe_symbol:
            raise MarketDataError("provider_symbol_invalid")
        return self.cache_dir / f"{safe_symbol}.csv"

    def _read_cache(self, symbol: str) -> MarketDataBundle | None:
        path = self._cache_path(symbol)
        if not path.exists():
            return None
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            missing = [
                field
                for field in self.FIELDNAMES
                if field not in (reader.fieldnames or ())
            ]
            if missing:
                raise MarketDataError(
                    f"cache_schema_invalid:{symbol}:{','.join(missing)}"
                )
            rows = list(reader)
        if not rows:
            return None
        bases = {str(row["priceBasis"]).strip() for row in rows}
        if len(bases) != 1 or next(iter(bases)) not in SUPPORTED_PRICE_BASES:
            raise MarketDataError(f"cache_price_basis_invalid:{symbol}")
        statuses = {
            str(row["dividendStatus"]).strip().lower()
            for row in rows
            if str(row["dividendStatus"]).strip()
        }
        status = (
            next(iter(statuses))
            if len(statuses) == 1
            else DIVIDEND_UNAVAILABLE
        )
        try:
            observations = tuple(
                DailyObservation(
                    observed_on=date.fromisoformat(row["date"]),
                    raw_close=float(row["close"]),
                    split_factor=float(row["splitFactor"]),
                    dividend_cash=float(row["dividendCash"] or 0),
                )
                for row in rows
                if str(row["close"]).strip()
            )
            cash_events = tuple(
                CashDistributionEvent(
                    date.fromisoformat(row["date"]),
                    float(row["dividendCash"]),
                )
                for row in rows
                if str(row["dividendCash"]).strip()
                and float(row["dividendCash"]) > 0
            )
        except (TypeError, ValueError) as error:
            raise MarketDataError(f"cache_row_invalid:{symbol}") from error
        return MarketDataBundle(
            observations,
            DividendData(status, None),
            next(iter(bases)),
            cash_events,
        )

    def _write_cache(self, symbol: str, bundle: MarketDataBundle) -> None:
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        destination = self._cache_path(symbol)
        with tempfile.NamedTemporaryFile(
            "w",
            encoding="utf-8",
            newline="",
            delete=False,
            dir=self.cache_dir,
            prefix=f".{destination.stem}-",
            suffix=".tmp",
        ) as handle:
            temporary = Path(handle.name)
            writer = csv.DictWriter(handle, fieldnames=self.FIELDNAMES)
            writer.writeheader()
            observations_by_date = {
                item.observed_on: item for item in bundle.observations
            }
            cash_by_date: dict[date, float] = {}
            cash_events = bundle.cash_events or tuple(
                CashDistributionEvent(
                    item.observed_on,
                    item.dividend_cash,
                )
                for item in bundle.observations
                if item.dividend_cash
            )
            for event in cash_events:
                cash_by_date[event.observed_on] = (
                    cash_by_date.get(event.observed_on, 0.0) + event.cash
                )
            for observed_on in sorted(
                set(observations_by_date) | set(cash_by_date)
            ):
                observation = observations_by_date.get(observed_on)
                writer.writerow(
                    {
                        "date": observed_on.isoformat(),
                        "close": (
                            observation.raw_close if observation else ""
                        ),
                        "splitFactor": (
                            observation.split_factor if observation else ""
                        ),
                        "dividendCash": cash_by_date.get(observed_on, 0.0),
                        "priceBasis": bundle.price_basis,
                        "dividendStatus": bundle.dividend.status,
                    }
                )
        os.replace(temporary, destination)

    def _fetch_with_retry(
        self,
        symbol: str,
        start_date: date,
        as_of_date: date,
    ) -> MarketDataBundle:
        last_error: Exception | None = None
        for attempt in range(self.retry_count + 1):
            try:
                return self.fetcher.fetch_history(
                    symbol,
                    start_date,
                    as_of_date,
                )
            except Exception as error:
                last_error = error
                if attempt >= self.retry_count:
                    break
                self.sleep_fn(
                    self.retry_backoff_seconds * (2**attempt)
                )
        raise MarketDataError(
            f"provider_retry_exhausted:{symbol}"
        ) from last_error

    @staticmethod
    def _merge(
        cached: MarketDataBundle | None,
        fetched: MarketDataBundle | None,
        as_of_date: date,
    ) -> MarketDataBundle:
        bundles = [bundle for bundle in (cached, fetched) if bundle is not None]
        if not bundles:
            raise MarketDataError("price_history_missing")
        bases = {bundle.price_basis for bundle in bundles}
        if len(bases) != 1 or next(iter(bases)) not in SUPPORTED_PRICE_BASES:
            raise MarketDataError("cache_provider_price_basis_mismatch")
        by_date: dict[date, DailyObservation] = {}
        cash_by_date: dict[date, float] = {}
        for bundle in bundles:
            for observation in bundle.observations:
                if observation.observed_on <= as_of_date:
                    by_date[observation.observed_on] = observation
            cash_events = bundle.cash_events or tuple(
                CashDistributionEvent(
                    item.observed_on,
                    item.dividend_cash,
                )
                for item in bundle.observations
                if item.dividend_cash
            )
            for event in cash_events:
                if event.observed_on <= as_of_date:
                    cash_by_date[event.observed_on] = event.cash
        if not by_date:
            raise MarketDataError("price_history_missing")
        observations = tuple(by_date[key] for key in sorted(by_date))
        trailing_cash = sum(
            cash
            for observed_on, cash in cash_by_date.items()
            if as_of_date - timedelta(days=365)
            <= observed_on
            <= as_of_date
        )
        source_status = bundles[-1].dividend.status
        if trailing_cash > 0:
            status = DIVIDEND_CONFIRMED_VALUE
            cash: float | None = trailing_cash
        elif source_status in {
            DIVIDEND_CONFIRMED_VALUE,
            DIVIDEND_CONFIRMED_ZERO,
        }:
            status = DIVIDEND_CONFIRMED_ZERO
            cash = 0.0
        else:
            status = DIVIDEND_UNAVAILABLE
            cash = None
        return MarketDataBundle(
            observations,
            DividendData(status, cash),
            next(iter(bases)),
            tuple(
                CashDistributionEvent(observed_on, cash)
                for observed_on, cash in sorted(cash_by_date.items())
                if cash > 0
            ),
        )

    def _load_symbol(self, symbol: str, as_of_date: date) -> MarketDataBundle:
        memory_key = (symbol, as_of_date)
        if memory_key in self._memory:
            return self._memory[memory_key]
        cached = self._read_cache(symbol)
        last_cached_date = (
            max(item.observed_on for item in cached.observations)
            if cached and cached.observations
            else None
        )
        start_date = (
            last_cached_date + timedelta(days=1)
            if last_cached_date
            else self.history_start
        )
        fetched: MarketDataBundle | None = None
        if start_date <= as_of_date:
            try:
                fetched = self._fetch_with_retry(
                    symbol,
                    start_date,
                    as_of_date,
                )
            except MarketDataError as error:
                if cached is None or "price_history_missing" not in str(
                    error.__cause__
                ):
                    raise
        merged = self._merge(cached, fetched, as_of_date)
        self._write_cache(symbol, merged)
        self._memory[memory_key] = merged
        return merged

    def load_asset(
        self,
        asset: UniverseAsset,
        as_of_date: date,
    ) -> MarketDataBundle:
        if asset.market_data_provider != "yfinance":
            raise MarketDataError(
                "unsupported_market_data_provider:"
                f"{asset.market_data_provider or 'blank'}"
            )
        if not asset.market_data_provider_symbol:
            raise MarketDataError(
                f"market_data_provider_symbol_unresolved:{asset.identity}"
            )
        return self._load_symbol(
            asset.market_data_provider_symbol,
            as_of_date,
        )

    def load_benchmark(
        self,
        asset: UniverseAsset,
        as_of_date: date,
    ) -> MarketDataBundle:
        return self._load_symbol(
            asset.benchmark_provider_symbol,
            as_of_date,
        )
