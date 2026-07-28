"""Structural validator for generated canonical candidate CSV files."""

from __future__ import annotations

import argparse
import csv
import json
import math
from datetime import date
from pathlib import Path

from .universe import UniverseAsset, normalize_market, normalize_ticker


REQUIRED_CANDIDATE_COLUMNS = (
    "market",
    "ticker",
    "name",
    "benchmark",
    "active",
    "includeInSimulator",
    "simulatorReady",
    "rawPriceCagr",
    "rollingCagrMedian",
    "rollingCagrWindowYears",
    "rollingCagrWindowCount",
    "expectedCagr",
    "beta",
    "mdd",
    "annualizedVolatility",
    "volatilityObservationCount",
    "dividendYield",
    "priceDataEndDate",
    "priceBasis",
    "reasonCode",
    "reasonMessage",
)
REQUIRED_READY_NUMERIC_FIELDS = (
    "expectedCagr",
    "rollingCagrMedian",
    "beta",
    "mdd",
    "annualizedVolatility",
    "dividendYield",
)
ALL_NUMERIC_FIELDS = (
    "rawPriceCagr",
    "rollingCagrMedian",
    "rollingCagrWindowYears",
    "rollingCagrWindowCount",
    "expectedCagr",
    "beta",
    "mdd",
    "annualizedVolatility",
    "volatilityObservationCount",
    "dividendYield",
)


class CandidateValidationError(ValueError):
    def __init__(self, report: dict[str, object]):
        self.report = report
        super().__init__("candidate validation failed")


def _is_true(value: object) -> bool:
    return str(value or "").strip().lower() in {"true", "1", "yes", "y"}


def _finite_number(value: object) -> bool:
    if value is None or str(value).strip() == "":
        return False
    try:
        return math.isfinite(float(str(value).strip()))
    except (TypeError, ValueError):
        return False


def validate_candidate_rows(
    rows: list[dict[str, object]],
    *,
    headers: list[str] | tuple[str, ...],
    universe: list[UniverseAsset],
    as_of_date: date,
) -> dict[str, object]:
    issues: list[dict[str, str]] = []
    missing_columns = [
        column for column in REQUIRED_CANDIDATE_COLUMNS if column not in headers
    ]
    if missing_columns:
        issues.append(
            {
                "code": "missing_required_columns",
                "message": ", ".join(missing_columns),
            }
        )
    prohibited_columns = [
        column
        for column in headers
        if (
            "totalreturn" in column.replace("_", "").lower()
            or column.replace("_", "").lower() == "tr"
            or column.replace("_", "").lower().startswith("trindex")
        )
    ]
    if prohibited_columns:
        issues.append(
            {
                "code": "total_return_columns_prohibited",
                "message": ", ".join(prohibited_columns),
            }
        )

    expected_identities = {asset.identity for asset in universe if asset.active}
    actual_identities: set[str] = set()
    duplicate_identities: set[str] = set()
    ready_count = 0
    failed_count = 0
    market_counts: dict[str, int] = {}
    for row_number, row in enumerate(rows, start=2):
        try:
            market = normalize_market(row.get("market"))
            ticker = normalize_ticker(row.get("ticker"), market)
        except ValueError as error:
            issues.append(
                {
                    "code": "invalid_identity",
                    "message": f"row {row_number}: {error}",
                }
            )
            continue
        identity = f"{market}:{ticker}"
        if identity in actual_identities:
            duplicate_identities.add(identity)
        actual_identities.add(identity)
        market_counts[market] = market_counts.get(market, 0) + 1
        simulator_ready = _is_true(row.get("simulatorReady"))
        if simulator_ready:
            ready_count += 1
            for field in REQUIRED_READY_NUMERIC_FIELDS:
                if not _finite_number(row.get(field)):
                    issues.append(
                        {
                            "code": "required_metric_not_finite",
                            "message": f"{identity}.{field}",
                        }
                    )
            if str(row.get("priceBasis") or "") != (
                "split_adjusted_close_ex_dividends"
            ):
                issues.append(
                    {
                        "code": "invalid_price_basis",
                        "message": identity,
                    }
                )
        else:
            failed_count += 1
            if _is_true(row.get("includeInSimulator")) and (
                not str(row.get("reasonCode") or "").strip()
                or not str(row.get("reasonMessage") or "").strip()
            ):
                issues.append(
                    {
                        "code": "ineligible_reason_missing",
                        "message": identity,
                    }
                )
        for field in ALL_NUMERIC_FIELDS:
            value = row.get(field)
            if value is not None and str(value).strip() and not _finite_number(value):
                issues.append(
                    {
                        "code": "numeric_value_invalid",
                        "message": f"{identity}.{field}",
                    }
                )
        end_date_text = str(row.get("priceDataEndDate") or "").strip()
        if end_date_text:
            try:
                end_date = date.fromisoformat(end_date_text)
            except ValueError:
                issues.append(
                    {
                        "code": "price_end_date_invalid",
                        "message": identity,
                    }
                )
            else:
                if end_date > as_of_date:
                    issues.append(
                        {
                            "code": "price_after_as_of_date",
                            "message": f"{identity}:{end_date_text}",
                        }
                    )
    for identity in sorted(duplicate_identities):
        issues.append(
            {
                "code": "duplicate_market_ticker",
                "message": identity,
            }
        )
    missing_identities = sorted(expected_identities - actual_identities)
    extra_identities = sorted(actual_identities - expected_identities)
    if missing_identities:
        issues.append(
            {
                "code": "active_universe_rows_missing",
                "message": ",".join(missing_identities[:20]),
            }
        )
    if extra_identities:
        issues.append(
            {
                "code": "unexpected_output_rows",
                "message": ",".join(extra_identities[:20]),
            }
        )
    return {
        "valid": not issues,
        "asOfDate": as_of_date.isoformat(),
        "inputActiveRowCount": len(expected_identities),
        "outputRowCount": len(rows),
        "simulatorReadyRowCount": ready_count,
        "ineligibleRowCount": failed_count,
        "marketCounts": dict(sorted(market_counts.items())),
        "issueCount": len(issues),
        "issues": issues,
    }


def validate_candidate_file(
    path: Path | str,
    *,
    universe: list[UniverseAsset],
    as_of_date: date,
) -> dict[str, object]:
    candidate_path = Path(path)
    with candidate_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        headers = list(reader.fieldnames or ())
    return validate_candidate_rows(
        rows,
        headers=headers,
        universe=universe,
        as_of_date=as_of_date,
    )


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a FINPLE canonical candidate CSV",
    )
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--universe", required=True)
    parser.add_argument("--as-of", required=True)
    return parser.parse_args()


def main() -> None:
    from .universe import load_universe

    args = _parse_args()
    report = validate_candidate_file(
        args.candidate,
        universe=load_universe(args.universe),
        as_of_date=date.fromisoformat(args.as_of),
    )
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    if not report["valid"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
