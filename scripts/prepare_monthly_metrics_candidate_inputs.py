"""Prepare existing One-Click candidate inputs from Colab raw-daily chunks.

The command converts the canonical FINPLE universe to CANDIDATE_COLUMNS,
combines existing US/KR RAW_DAILY_PRICE_COLUMNS files, writes the fixed
benchmark map, and creates truthful review-only source/manifest metadata.
It does not download prices or calculate monthly metrics.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Iterable, Mapping

from scripts.metrics_pipeline.candidate_package import (
    SOURCE_DECLARATION_CONTRACT_VERSION,
    SUBMISSION_MANIFEST_CONTRACT_VERSION,
)
from scripts.metrics_pipeline.config import CALCULATION_POLICY_VERSION, PIPELINE_VERSION
from scripts.metrics_pipeline.schemas import CANDIDATE_COLUMNS, RAW_DAILY_PRICE_COLUMNS, is_valid_kr_candidate_ticker
from scripts.metrics_pipeline.timeseries import NORMALIZATION_VERSION


BENCHMARK_ROWS = [
    {"benchmarkKey": "US_SPY", "benchmarkMarket": "US", "benchmarkTicker": "SPY"},
    {"benchmarkKey": "KR_KOSPI", "benchmarkMarket": "KR", "benchmarkTicker": "069500"},
    {"benchmarkKey": "KR_KOSDAQ", "benchmarkMarket": "KR", "benchmarkTicker": "229200"},
]
EXPECTED_INPUT_FILES = {
    "candidate_asset_master.csv",
    "benchmark_map.csv",
    "raw_daily_prices.csv",
    "source_declaration.json",
    "operator_submission_manifest.json",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def write_csv(path: Path, fieldnames: list[str], rows: Iterable[Mapping[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows({field: row.get(field, "") for field in fieldnames} for row in rows)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def benchmark_keys_from_kr_metrics(path: Path) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for row in read_csv(path):
        ticker = str(row.get("ticker", "")).strip()
        if not is_valid_kr_candidate_ticker(ticker):
            raise ValueError(f"invalid KR metrics ticker identity: {ticker}")
        benchmark = str(row.get("benchmarkTicker", "")).strip()
        if benchmark in {"069500", "069500.KS", "^KS11"}:
            mapping[ticker] = "KR_KOSPI"
        elif benchmark in {"229200", "229200.KS", "^KQ11"}:
            mapping[ticker] = "KR_KOSDAQ"
    return mapping


def build_candidate_rows(universe_rows: list[dict[str, str]], kr_benchmark_keys: Mapping[str, str]) -> tuple[list[dict[str, str]], list[str]]:
    candidates: list[dict[str, str]] = []
    review_tickers: list[str] = []
    seen: set[tuple[str, str]] = set()
    for source in universe_rows:
        market = str(source.get("market", "")).strip().upper()
        ticker = str(source.get("ticker", "")).strip()
        if market == "KR" and not is_valid_kr_candidate_ticker(ticker):
            raise ValueError(f"invalid canonical KR ticker identity: {ticker}")
        identity = (market, ticker)
        if identity in seen:
            raise ValueError(f"duplicate canonical market+ticker: {identity}")
        seen.add(identity)
        benchmark_key = "US_SPY" if market == "US" else kr_benchmark_keys.get(ticker, "")
        if market == "KR" and not benchmark_key:
            review_tickers.append(ticker)
        candidates.append(
            {
                "ticker": ticker,
                "nameKr": str(source.get("nameKr", "")).strip(),
                "nameEn": "",
                "market": market,
                "assetType": str(source.get("assetType", "")).strip(),
                "exchange": "",
                "sector": "",
                "industry": "",
                "strategy": str(source.get("strategy", "")).strip(),
                "riskLevel": str(source.get("riskLevel", "")).strip(),
                "goals": str(source.get("goals", "")).strip(),
                "beginnerFit": str(source.get("beginnerFit", "")).strip(),
                "tags": str(source.get("tags", "")).strip(),
                "listingDate": "",
                "benchmarkKey": benchmark_key,
                "proxyTicker": "",
                "hedged": "",
                "isActive": str(source.get("isActive", "")).strip(),
            }
        )
    return candidates, review_tickers


def combine_market_raw_files(
    sources: list[tuple[Path, str]],
    destination: Path,
    candidate_identities: set[tuple[str, str]],
) -> dict[str, object]:
    covered: set[tuple[str, str]] = set()
    row_count = 0
    first_dates: dict[str, str] = {}
    last_dates: dict[str, str] = {}
    retrieved_at_values: set[str] = set()
    seen_identities: set[tuple[str, str]] = set()
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8-sig", newline="") as output_handle:
        writer = csv.DictWriter(output_handle, fieldnames=RAW_DAILY_PRICE_COLUMNS)
        writer.writeheader()
        for source_path, expected_market in sources:
            last_key: tuple[str, str, str] | None = None
            source_identities: set[tuple[str, str]] = set()
            with source_path.open("r", encoding="utf-8-sig", newline="") as input_handle:
                reader = csv.DictReader(input_handle)
                if reader.fieldnames != RAW_DAILY_PRICE_COLUMNS:
                    raise ValueError(f"raw-daily header mismatch: {source_path}")
                for row in reader:
                    market = str(row.get("market", "")).strip().upper()
                    ticker = str(row.get("ticker", "")).strip()
                    if market == "KR" and not is_valid_kr_candidate_ticker(ticker):
                        raise ValueError(f"invalid raw KR ticker identity: {ticker}")
                    date_text = str(row.get("date", "")).strip()
                    if market != expected_market:
                        raise ValueError(f"unexpected market in {source_path}: {market}")
                    identity = (market, ticker)
                    if identity not in candidate_identities:
                        raise ValueError(f"raw identity is outside canonical universe: {identity}")
                    key = (market, ticker, date_text)
                    if last_key is not None and key <= last_key:
                        raise ValueError(f"raw inputs must be globally sorted with no duplicate key: {key}")
                    last_key = key
                    source_identities.add(identity)
                    row["market"] = market
                    row["ticker"] = ticker
                    writer.writerow({column: row.get(column, "") for column in RAW_DAILY_PRICE_COLUMNS})
                    row_count += 1
                    covered.add(identity)
                    first_dates[market] = date_text if market not in first_dates or date_text < first_dates[market] else first_dates[market]
                    last_dates[market] = date_text if market not in last_dates or date_text > last_dates[market] else last_dates[market]
                    if row.get("retrievedAt"):
                        retrieved_at_values.add(str(row["retrievedAt"]))
            overlap = seen_identities.intersection(source_identities)
            if overlap:
                raise ValueError(f"asset appears in multiple market raw files: {sorted(overlap)[:5]}")
            seen_identities.update(source_identities)
    return {
        "rawDailyRowCount": row_count,
        "coveredIdentities": covered,
        "firstDateByMarket": first_dates,
        "lastDateByMarket": last_dates,
        "latestRetrievedAt": max(retrieved_at_values) if retrieved_at_values else "",
    }


def file_inventory_item(role: str, path: Path) -> dict[str, object]:
    return {
        "logicalRole": role,
        "path": path.name,
        "sha256": sha256(path),
        "byteSize": path.stat().st_size,
    }


def prepare_inputs(args: argparse.Namespace) -> dict[str, object]:
    output_dir = Path(args.output_dir)
    if output_dir.exists():
        existing = {path.name for path in output_dir.iterdir() if path.is_file()}
        if existing:
            raise ValueError(f"candidate input directory must be empty: {sorted(existing)}")
    output_dir.mkdir(parents=True, exist_ok=True)

    universe_rows = read_csv(Path(args.universe))
    kr_mapping = benchmark_keys_from_kr_metrics(Path(args.kr_metrics))
    candidates, benchmark_review_tickers = build_candidate_rows(universe_rows, kr_mapping)
    candidate_identities = {(row["market"], row["ticker"]) for row in candidates}

    candidate_path = output_dir / "candidate_asset_master.csv"
    benchmark_path = output_dir / "benchmark_map.csv"
    raw_path = output_dir / "raw_daily_prices.csv"
    source_path = output_dir / "source_declaration.json"
    manifest_path = output_dir / "operator_submission_manifest.json"

    write_csv(candidate_path, CANDIDATE_COLUMNS, candidates)
    write_csv(benchmark_path, ["benchmarkKey", "benchmarkMarket", "benchmarkTicker"], BENCHMARK_ROWS)
    raw_summary = combine_market_raw_files(
        [(Path(args.us_raw), "US"), (Path(args.kr_raw), "KR")],
        raw_path,
        candidate_identities,
    )
    covered = raw_summary.pop("coveredIdentities")

    acquired_at = args.acquired_at or raw_summary.get("latestRetrievedAt", "")
    if not acquired_at:
        raise ValueError("acquiredAt is missing from both arguments and raw rows")
    source_declaration = {
        "contractVersion": SOURCE_DECLARATION_CONTRACT_VERSION,
        "sourceKind": "manual_operator_upload",
        "sourceName": "Yahoo Finance via existing FINPLE yfinance collectors",
        "sourceReference": "operator-colab-existing-yfinance-collection",
        "acquiredAt": acquired_at,
        "asOfDate": args.as_of,
        "marketScope": ["US", "KR"],
        "timezone": "UTC",
        "currencyMode": "mixed",
        "returnBasis": "price_return",
        "priceAdjustmentBasis": "split_adjusted",
        "redistributionReviewStatus": "review_required",
        "appUseReviewStatus": "review_required",
        "sourceFileSha256": sha256(raw_path),
        "rowCount": raw_summary["rawDailyRowCount"],
        "operatorId": args.operator_id,
        "fixtureOnly": False,
        "testOnly": False,
    }
    source_path.write_text(json.dumps(source_declaration, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    inventory = [
        file_inventory_item("candidate_asset_master", candidate_path),
        file_inventory_item("benchmark_map", benchmark_path),
        file_inventory_item("raw_daily_price", raw_path),
        file_inventory_item("source_declaration", source_path),
    ]
    manifest = {
        "contractVersion": SUBMISSION_MANIFEST_CONTRACT_VERSION,
        "submissionId": args.submission_id,
        "submittedAt": acquired_at,
        "submittedBy": args.operator_id,
        "intendedMetricBaseDate": args.metric_base_date,
        "expectedMarketScope": ["US", "KR"],
        "fileInventory": inventory,
        "expectedPipelineVersion": PIPELINE_VERSION,
        "expectedNormalizationVersion": NORMALIZATION_VERSION,
        "expectedCalculationPolicyVersion": CALCULATION_POLICY_VERSION,
        "notProductionApproval": True,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    actual_files = {path.name for path in output_dir.iterdir() if path.is_file()}
    if actual_files != EXPECTED_INPUT_FILES:
        raise ValueError(f"unexpected candidate input file set: {sorted(actual_files)}")

    missing = candidate_identities.difference(covered)
    summary = {
        "candidateCount": len(candidates),
        "candidateMarketCounts": {
            market: sum(1 for row in candidates if row["market"] == market) for market in ["US", "KR"]
        },
        "benchmarkCounts": {
            key: sum(1 for row in candidates if row["benchmarkKey"] == key)
            for key in ["US_SPY", "KR_KOSPI", "KR_KOSDAQ", ""]
        },
        "benchmarkReviewCount": len(benchmark_review_tickers),
        "benchmarkReviewTickerSample": benchmark_review_tickers[:20],
        "priceCoveredAssetCount": len(covered),
        "priceCoveredMarketCounts": {
            market: sum(1 for identity in covered if identity[0] == market) for market in ["US", "KR"]
        },
        "missingPriceAssetCount": len(missing),
        "missingPriceMarketCounts": {
            market: sum(1 for identity in missing if identity[0] == market) for market in ["US", "KR"]
        },
        "duplicateMarketTickerDateCount": 0,
        **raw_summary,
        "candidateInputDir": str(output_dir),
        "productionPublishReady": False,
        "appExportApproved": False,
    }
    Path(args.report).parent.mkdir(parents=True, exist_ok=True)
    Path(args.report).write_text(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare existing FINPLE One-Click candidate inputs.")
    parser.add_argument("--universe", required=True)
    parser.add_argument("--us-raw", required=True)
    parser.add_argument("--kr-raw", required=True)
    parser.add_argument("--kr-metrics", required=True, help="Combined KR runtime overlay with benchmarkTicker resolution.")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--report", required=True)
    parser.add_argument("--metric-base-date", required=True)
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--acquired-at", default="", help="Optional override; defaults to latest raw retrievedAt.")
    parser.add_argument("--operator-id", default="colab-operator")
    parser.add_argument("--submission-id", required=True)
    args = parser.parse_args()
    print(json.dumps(prepare_inputs(args), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
