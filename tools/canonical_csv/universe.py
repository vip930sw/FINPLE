"""Editable universe CSV loading with stable market+ticker identity."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


REQUIRED_UNIVERSE_COLUMNS = (
    "market",
    "ticker",
    "name",
    "benchmark",
    "active",
    "includeInSimulator",
)


class UniverseError(ValueError):
    """Raised when the editable universe is structurally invalid."""


def parse_bool(value: object, *, field: str) -> bool:
    normalized = str(value or "").strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    raise UniverseError(f"{field} must be true or false, got {value!r}")


def normalize_market(value: object) -> str:
    market = str(value or "").strip().upper()
    if not market:
        raise UniverseError("market must not be blank")
    return market


def normalize_ticker(value: object, market: str) -> str:
    ticker = str(value or "").replace("\ufeff", "").strip().upper()
    if not ticker:
        raise UniverseError("ticker must not be blank")
    if market == "KR":
        if ticker.isdigit():
            ticker = ticker.zfill(6)
        if len(ticker) != 6:
            raise UniverseError(f"KR ticker must be six characters: {ticker}")
    return ticker


def normalize_benchmark(value: object, fallback_market: str) -> str:
    benchmark = str(value or "").strip().upper()
    if not benchmark:
        raise UniverseError("benchmark must not be blank")
    if ":" not in benchmark:
        benchmark = f"{fallback_market}:{benchmark}"
    market, ticker = benchmark.split(":", 1)
    market = normalize_market(market)
    ticker = normalize_ticker(ticker, market)
    return f"{market}:{ticker}"


@dataclass(frozen=True)
class UniverseAsset:
    market: str
    ticker: str
    name: str
    benchmark: str
    active: bool
    include_in_simulator: bool
    provider_symbol: str
    benchmark_provider_symbol: str
    exposure_type: str
    distribution_type: str

    @property
    def identity(self) -> str:
        return f"{self.market}:{self.ticker}"

    @property
    def benchmark_identity(self) -> str:
        return self.benchmark


def load_universe(path: Path | str) -> list[UniverseAsset]:
    source_path = Path(path)
    with source_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = tuple(reader.fieldnames or ())
        missing = [column for column in REQUIRED_UNIVERSE_COLUMNS if column not in headers]
        if missing:
            raise UniverseError(
                f"{source_path} missing required columns: {', '.join(missing)}"
            )
        raw_rows = list(reader)

    assets: list[UniverseAsset] = []
    seen: set[str] = set()
    for row_number, row in enumerate(raw_rows, start=2):
        try:
            market = normalize_market(row.get("market"))
            ticker = normalize_ticker(row.get("ticker"), market)
            benchmark = normalize_benchmark(row.get("benchmark"), market)
            asset = UniverseAsset(
                market=market,
                ticker=ticker,
                name=str(row.get("name") or "").strip() or ticker,
                benchmark=benchmark,
                active=parse_bool(row.get("active"), field="active"),
                include_in_simulator=parse_bool(
                    row.get("includeInSimulator"),
                    field="includeInSimulator",
                ),
                provider_symbol=str(row.get("providerSymbol") or ticker).strip(),
                benchmark_provider_symbol=str(
                    row.get("benchmarkProviderSymbol")
                    or benchmark.split(":", 1)[1]
                ).strip(),
                exposure_type=str(row.get("exposureType") or "").strip().lower(),
                distribution_type=str(
                    row.get("distributionType") or "unknown"
                ).strip().lower(),
            )
        except UniverseError as error:
            raise UniverseError(f"{source_path}:{row_number}: {error}") from error
        if asset.identity in seen:
            raise UniverseError(
                f"{source_path}:{row_number}: duplicate market+ticker {asset.identity}"
            )
        seen.add(asset.identity)
        assets.append(asset)
    return assets


def active_universe(assets: list[UniverseAsset]) -> list[UniverseAsset]:
    return [asset for asset in assets if asset.active]
