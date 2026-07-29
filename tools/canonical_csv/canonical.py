"""Full-schema canonical CSV loading and deterministic field ordering."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from .universe import normalize_market, normalize_ticker


APPENDED_CANONICAL_FIELDS = (
    "name",
    "benchmark",
    "marketDataProvider",
    "marketDataProviderSymbol",
    "benchmarkProviderSymbol",
    "includeInSimulator",
    "simulatorReady",
    "rawPriceCagr",
    "rollingCagrMedian",
    "rollingCagrWindowYears",
    "rollingCagrWindowCount",
    "annualizedVolatility",
    "volatilityObservationCount",
    "priceDataEndDate",
    "priceBasis",
    "priceMetricsStatus",
    "dividendStatus",
    "cashDistributionYieldTtm",
    "trailingDistributionYield",
    "distributionCalculationStatus",
    "reinvestmentCashYield",
    "reasonCode",
    "reasonMessage",
)

REQUIRED_METRIC_FIELDS = (
    "expectedCagr",
    "beta",
    "mdd",
    "dividendYield",
)

CANDIDATE_REQUIRED_COLUMNS = (
    "market",
    "ticker",
    *REQUIRED_METRIC_FIELDS,
    *APPENDED_CANONICAL_FIELDS,
)

CALCULATED_OR_OPERATIONAL_FIELDS = frozenset(
    {
        "active",
        "expectedCagr",
        "beta",
        "mdd",
        "dividendYield",
        "benchmark",
        "marketDataProvider",
        "marketDataProviderSymbol",
        "benchmarkProviderSymbol",
        "includeInSimulator",
        "simulatorReady",
        "rawPriceCagr",
        "rollingCagrMedian",
        "rollingCagrWindowYears",
        "rollingCagrWindowCount",
        "annualizedVolatility",
        "volatilityObservationCount",
        "priceDataEndDate",
        "priceBasis",
        "priceMetricsStatus",
        "dividendStatus",
        "cashDistributionYieldTtm",
        "trailingDistributionYield",
        "distributionCalculationStatus",
        "reinvestmentCashYield",
        "reasonCode",
        "reasonMessage",
    }
)


class CanonicalSourceError(ValueError):
    """Raised when the source canonical CSV is not safe to merge."""


@dataclass(frozen=True)
class CanonicalSource:
    headers: tuple[str, ...]
    rows: tuple[dict[str, str], ...]

    @property
    def identities(self) -> tuple[str, ...]:
        return tuple(row_identity(row) for row in self.rows)


def row_identity(row: dict[str, object]) -> str:
    market = normalize_market(row.get("market"))
    ticker = normalize_ticker(row.get("ticker"), market)
    return f"{market}:{ticker}"


def load_canonical_source(path: Path | str) -> CanonicalSource:
    source_path = Path(path)
    with source_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = tuple(reader.fieldnames or ())
        if "market" not in headers or "ticker" not in headers:
            raise CanonicalSourceError(
                f"{source_path} must contain market and ticker"
            )
        rows = tuple(
            {
                str(key): str(value or "")
                for key, value in row.items()
                if key is not None
            }
            for row in reader
        )
    seen: set[str] = set()
    for row_number, row in enumerate(rows, start=2):
        try:
            identity = row_identity(row)
        except ValueError as error:
            raise CanonicalSourceError(
                f"{source_path}:{row_number}: {error}"
            ) from error
        if identity in seen:
            raise CanonicalSourceError(
                f"{source_path}:{row_number}: duplicate {identity}"
            )
        seen.add(identity)
    return CanonicalSource(headers, rows)


def candidate_headers(source_headers: tuple[str, ...]) -> tuple[str, ...]:
    ordered = list(source_headers)
    for field in APPENDED_CANONICAL_FIELDS:
        if field not in ordered:
            ordered.append(field)
    for field in REQUIRED_METRIC_FIELDS:
        if field not in ordered:
            ordered.append(field)
    return tuple(ordered)
