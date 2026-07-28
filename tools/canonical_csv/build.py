"""Build and atomically validate a FINPLE canonical candidate CSV."""

from __future__ import annotations

import argparse
import csv
import json
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

from .config import PipelineConfig
from .market_data import (
    MarketDataError,
    MarketDataProvider,
    CsvMarketDataProvider,
    YFinanceMarketDataProvider,
)
from .metrics import MetricCalculationError, calculate_asset_metrics
from .universe import UniverseAsset, active_universe, load_universe
from .validate import REQUIRED_CANDIDATE_COLUMNS, validate_candidate_file


NON_ORDINARY_EXPOSURE_TYPES = {
    "single_stock_option_income",
    "single_stock_weekly_income",
    "index_covered_call",
    "index_covered_call_growth",
    "thematic_equity_premium_income",
    "broad_equity_premium_income",
}
ORDINARY_DISTRIBUTION_TYPES = {
    "",
    "unknown",
    "ordinary_cash_dividend",
    "none",
}


@dataclass(frozen=True)
class BuildResult:
    candidate_path: Path
    validation_report_path: Path
    failed_assets_path: Path
    run_summary_path: Path
    validation: dict[str, object]
    summary: dict[str, object]


def _is_non_ordinary_distribution(asset: UniverseAsset) -> bool:
    return (
        asset.exposure_type in NON_ORDINARY_EXPOSURE_TYPES
        or asset.distribution_type not in ORDINARY_DISTRIBUTION_TYPES
    )


def _base_candidate_row(asset: UniverseAsset) -> dict[str, object]:
    return {
        "market": asset.market,
        "ticker": asset.ticker,
        "name": asset.name,
        "benchmark": asset.benchmark,
        "active": "true",
        "includeInSimulator": (
            "true" if asset.include_in_simulator else "false"
        ),
        "simulatorReady": "false",
        "rawPriceCagr": "",
        "rollingCagrMedian": "",
        "rollingCagrWindowYears": "",
        "rollingCagrWindowCount": "",
        "expectedCagr": "",
        "beta": "",
        "mdd": "",
        "annualizedVolatility": "",
        "volatilityObservationCount": "",
        "dividendYield": "",
        "priceDataEndDate": "",
        "priceBasis": "split_adjusted_close_ex_dividends",
        "reasonCode": "",
        "reasonMessage": "",
    }


def _build_rows(
    assets: list[UniverseAsset],
    provider: MarketDataProvider,
    config: PipelineConfig,
) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    candidate_rows: list[dict[str, object]] = []
    failed_rows: list[dict[str, object]] = []
    for asset in active_universe(assets):
        row = _base_candidate_row(asset)
        if not asset.include_in_simulator:
            row.update(
                {
                    "reasonCode": "excluded_from_simulator",
                    "reasonMessage": "includeInSimulator is false in the universe",
                }
            )
            candidate_rows.append(row)
            failed_rows.append(
                {
                    "market": asset.market,
                    "ticker": asset.ticker,
                    "reasonCode": row["reasonCode"],
                    "reasonMessage": row["reasonMessage"],
                }
            )
            continue
        if _is_non_ordinary_distribution(asset):
            row.update(
                {
                    "reasonCode": "non_ordinary_distribution_not_dividend",
                    "reasonMessage": (
                        "option or covered-call cash distributions are not "
                        "ordinary dividendYield"
                    ),
                }
            )
            candidate_rows.append(row)
            failed_rows.append(
                {
                    "market": asset.market,
                    "ticker": asset.ticker,
                    "reasonCode": row["reasonCode"],
                    "reasonMessage": row["reasonMessage"],
                }
            )
            continue
        try:
            asset_bundle = provider.load_asset(
                asset,
                config.effective_as_of_date,
            )
            benchmark_bundle = provider.load_benchmark(
                asset,
                config.effective_as_of_date,
            )
            metrics = calculate_asset_metrics(
                asset_bundle,
                benchmark_bundle,
                config,
            )
        except (MetricCalculationError, MarketDataError) as error:
            code = getattr(error, "code", "market_data_error")
            message = getattr(error, "message", str(error))
            row.update({"reasonCode": code, "reasonMessage": message})
            failed_rows.append(
                {
                    "market": asset.market,
                    "ticker": asset.ticker,
                    "reasonCode": code,
                    "reasonMessage": message,
                }
            )
        else:
            row.update(metrics.to_row())
            row["simulatorReady"] = "true"
        candidate_rows.append(row)
    return candidate_rows, failed_rows


def _write_csv(
    path: Path,
    rows: list[dict[str, object]],
    fieldnames: tuple[str, ...] | list[str],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _write_json(path: Path, value: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"{json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True)}\n",
        encoding="utf-8",
    )


def _atomic_replace(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    os.replace(source, destination)


def _existing_candidate_identities(path: Path) -> set[str]:
    if not path.exists():
        return set()
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
    except (OSError, csv.Error):
        return set()
    return {
        f"{str(row.get('market') or '').strip().upper()}:"
        f"{str(row.get('ticker') or '').strip().upper()}"
        for row in rows
        if str(row.get("market") or "").strip()
        and str(row.get("ticker") or "").strip()
    }


def build_canonical_candidate(
    config: PipelineConfig,
    provider: MarketDataProvider,
) -> BuildResult:
    universe = load_universe(config.universe_path)
    active_assets = active_universe(universe)
    active_identities = {asset.identity for asset in active_assets}
    previous_identities = _existing_candidate_identities(
        config.output_candidate_path
    )
    candidate_rows, failed_rows = _build_rows(universe, provider, config)
    market_counts: dict[str, int] = {}
    rolling_counts: dict[str, int] = {}
    for row in candidate_rows:
        market = str(row["market"])
        market_counts[market] = market_counts.get(market, 0) + 1
        if str(row["simulatorReady"]).lower() == "true":
            window = str(row["rollingCagrWindowYears"])
            rolling_counts[window] = rolling_counts.get(window, 0) + 1
    summary: dict[str, object] = {
        "asOfDate": config.effective_as_of_date.isoformat(),
        "inputRowCount": len(universe),
        "activeRowCount": len(active_assets),
        "simulatorEligibleRowCount": sum(
            str(row["simulatorReady"]).lower() == "true"
            for row in candidate_rows
        ),
        "completeRowCount": sum(
            str(row["simulatorReady"]).lower() == "true"
            for row in candidate_rows
        ),
        "failedRowCount": len(failed_rows),
        "ineligibleRowCount": sum(
            str(row["simulatorReady"]).lower() != "true"
            for row in candidate_rows
        ),
        "excludedRowCount": len(universe) - len(active_assets),
        "newAssetCount": len(active_identities - previous_identities),
        "removedAssetCount": len(previous_identities - active_identities),
        "marketRowCounts": dict(sorted(market_counts.items())),
        "rollingWindowRowCounts": dict(sorted(rolling_counts.items())),
        "candidateRuntimeReplacementPerformed": False,
    }

    output_parent = config.output_candidate_path.parent
    output_parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix="finple-canonical-candidate-",
        dir=output_parent,
    ) as temporary_directory:
        temporary = Path(temporary_directory)
        staged_candidate = temporary / config.output_candidate_path.name
        staged_validation = temporary / (
            config.resolved_validation_report_path.name
        )
        staged_failed = temporary / config.resolved_failed_assets_path.name
        staged_summary = temporary / config.resolved_run_summary_path.name
        _write_csv(
            staged_candidate,
            candidate_rows,
            list(REQUIRED_CANDIDATE_COLUMNS),
        )
        validation = validate_candidate_file(
            staged_candidate,
            universe=universe,
            as_of_date=config.effective_as_of_date,
        )
        _write_json(staged_validation, validation)
        _write_csv(
            staged_failed,
            failed_rows,
            ["market", "ticker", "reasonCode", "reasonMessage"],
        )
        _write_json(staged_summary, summary)
        if not validation["valid"]:
            _atomic_replace(
                staged_validation,
                config.resolved_validation_report_path,
            )
            raise ValueError(
                "candidate validation failed; existing candidate was preserved"
            )
        _atomic_replace(staged_candidate, config.output_candidate_path)
        _atomic_replace(
            staged_validation,
            config.resolved_validation_report_path,
        )
        _atomic_replace(staged_failed, config.resolved_failed_assets_path)
        _atomic_replace(staged_summary, config.resolved_run_summary_path)
    return BuildResult(
        candidate_path=config.output_candidate_path,
        validation_report_path=config.resolved_validation_report_path,
        failed_assets_path=config.resolved_failed_assets_path,
        run_summary_path=config.resolved_run_summary_path,
        validation=validation,
        summary=summary,
    )


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a validated FINPLE canonical candidate CSV",
    )
    parser.add_argument("--universe", required=True)
    parser.add_argument("--output-candidate", required=True)
    parser.add_argument("--as-of")
    parser.add_argument(
        "--provider",
        choices=("csv", "yfinance"),
        default="csv",
    )
    parser.add_argument("--market-data-csv")
    parser.add_argument(
        "--rolling-windows",
        default="10,7,5,3,1",
    )
    parser.add_argument("--min-rolling-windows", type=int, default=6)
    parser.add_argument("--min-beta-observations", type=int, default=120)
    parser.add_argument("--min-volatility-observations", type=int, default=20)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    config = PipelineConfig.from_strings(
        universe_path=args.universe,
        output_candidate_path=args.output_candidate,
        as_of_date=args.as_of,
        rolling_cagr_window_years=tuple(
            int(value) for value in args.rolling_windows.split(",")
        ),
        min_rolling_windows=args.min_rolling_windows,
        min_beta_observations=args.min_beta_observations,
        min_volatility_observations=args.min_volatility_observations,
    )
    if args.provider == "csv":
        if not args.market_data_csv:
            raise SystemExit("--market-data-csv is required for --provider csv")
        provider: MarketDataProvider = CsvMarketDataProvider(
            args.market_data_csv
        )
    else:
        provider = YFinanceMarketDataProvider()
    result = build_canonical_candidate(config, provider)
    print(
        json.dumps(
            {
                "candidate": str(result.candidate_path),
                "validation": result.validation,
                "summary": result.summary,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
