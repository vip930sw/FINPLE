"""FINPLE candidate CSV metrics diagnostics.

This script audits a FINPLE screener candidate CSV before the runtime loader is
switched to a larger candidate universe.

It intentionally uses only the Python standard library so it can run in Colab,
GitHub Codespaces, or a local terminal without package installation.

Example
-------
python scripts/diagnose_finple_candidate_metrics.py \
  --csv src/data/tickers/finple_app_candidates_6000_balanced_v1.csv \
  --out data/processed/finple_step108_5_metrics_diagnostic_summary.json
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

METRIC_COLUMNS = ["expectedCagr", "beta", "mdd", "dividendYield"]
REQUIRED_CORE_COLUMNS = [
    "market",
    "ticker",
    "providerSymbol",
    "nameKr",
    "assetType",
    "sourceUniverse",
    "tier",
    "strategy",
    "riskLevel",
    "goals",
    "beginnerFit",
    "tags",
    "dataStatus",
    "expectedCagr",
    "beta",
    "mdd",
    "dividendYield",
    "displayDividendYield",
    "dividendPolicy",
    "dividendSource",
    "metricsSource",
    "reviewTag",
    "reviewReason",
    "notes",
    "marketCap",
    "aum",
    "sizeSource",
]

CATEGORY_RULES = {
    "crypto_blockchain": [
        "crypto",
        "bitcoin",
        "ethereum",
        "ether",
        "blockchain",
        "digital asset",
        "가상화폐",
        "비트코인",
        "이더리움",
        "블록체인",
    ],
    "leveraged_inverse": [
        "leveraged",
        "inverse",
        "2x",
        "3x",
        "bull",
        "bear",
        "ultra",
        "short",
        "레버리지",
        "인버스",
    ],
    "bond": ["bond", "treasury", "income", "채권", "국채", "회사채", "금리형", "머니마켓", "현금성"],
    "commodity": ["commodity", "gold", "silver", "oil", "원자재", "금", "은", "오일", "구리"],
    "reit": ["reit", "real estate", "부동산", "리츠"],
    "dividend_income": ["dividend", "income", "yield", "배당", "인컴", "고배당", "커버드콜"],
    "aggressive_growth": ["growth", "ai", "semiconductor", "tech", "aggressive", "성장", "공격", "AI", "반도체", "테크"],
}


def clean(value: object) -> str:
    return str(value or "").strip()


def is_blank(value: object) -> bool:
    return clean(value) == ""


def is_number(value: object) -> bool:
    text = clean(value).replace(",", "")
    if text == "":
        return False
    try:
        float(text)
        return True
    except ValueError:
        return False


def load_rows(csv_path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = list(reader.fieldnames or [])
        rows = [dict(row) for row in reader]
    return rows, headers


def join_search_text(row: dict[str, str]) -> str:
    fields = [
        row.get("ticker", ""),
        row.get("providerSymbol", ""),
        row.get("nameKr", ""),
        row.get("assetType", ""),
        row.get("strategy", ""),
        row.get("goals", ""),
        row.get("tags", ""),
        row.get("notes", ""),
    ]
    return " ".join(clean(value) for value in fields).lower()


def matches_category(row: dict[str, str], keywords: Iterable[str]) -> bool:
    text = join_search_text(row)
    return any(keyword.lower() in text for keyword in keywords)


def count_by_market(rows: list[dict[str, str]], rule_key: str) -> dict[str, int]:
    keywords = CATEGORY_RULES[rule_key]
    counter: Counter[str] = Counter()
    for row in rows:
        if matches_category(row, keywords):
            counter[clean(row.get("market", "UNKNOWN")).upper() or "UNKNOWN"] += 1
    return dict(counter)


def metric_missing_summary(rows: list[dict[str, str]]) -> dict[str, object]:
    summary: dict[str, object] = {}
    for metric in METRIC_COLUMNS:
        missing_rows = [row for row in rows if is_blank(row.get(metric))]
        invalid_rows = [row for row in rows if not is_blank(row.get(metric)) and not is_number(row.get(metric))]
        summary[metric] = {
            "missing": len(missing_rows),
            "invalid_numeric": len(invalid_rows),
            "missing_by_market": dict(Counter(clean(row.get("market", "UNKNOWN")).upper() or "UNKNOWN" for row in missing_rows)),
            "missing_by_assetType": dict(Counter(clean(row.get("assetType", "UNKNOWN")) or "UNKNOWN" for row in missing_rows)),
            "invalid_examples": [
                {
                    "market": row.get("market", ""),
                    "ticker": row.get("ticker", ""),
                    "nameKr": row.get("nameKr", ""),
                    "value": row.get(metric, ""),
                }
                for row in invalid_rows[:20]
            ],
        }
    return summary


def duplicate_summary(rows: list[dict[str, str]]) -> dict[str, object]:
    counter: Counter[str] = Counter()
    for row in rows:
        market = clean(row.get("market", "")).upper() or "UNKNOWN"
        ticker = clean(row.get("ticker", "")).upper()
        if ticker:
            counter[f"{market}:{ticker}"] += 1
    duplicates = {key: count for key, count in counter.items() if count > 1}
    return {
        "duplicate_count": sum(count - 1 for count in duplicates.values()),
        "duplicate_keys": dict(sorted(duplicates.items())[:100]),
    }


def build_summary(csv_path: Path) -> dict[str, object]:
    rows, headers = load_rows(csv_path)
    missing_core_columns = [column for column in REQUIRED_CORE_COLUMNS if column not in headers]

    category_counts = {
        rule_key: count_by_market(rows, rule_key) for rule_key in CATEGORY_RULES
    }

    by_market_asset_type: dict[str, dict[str, int]] = defaultdict(dict)
    for (market, asset_type), count in Counter(
        (clean(row.get("market", "UNKNOWN")).upper() or "UNKNOWN", clean(row.get("assetType", "UNKNOWN")) or "UNKNOWN")
        for row in rows
    ).items():
        by_market_asset_type[market][asset_type] = count

    summary = {
        "csv_path": str(csv_path),
        "row_count": len(rows),
        "header_count": len(headers),
        "missing_core_columns": missing_core_columns,
        "market_counts": dict(Counter(clean(row.get("market", "UNKNOWN")).upper() or "UNKNOWN" for row in rows)),
        "asset_type_counts": dict(Counter(clean(row.get("assetType", "UNKNOWN")) or "UNKNOWN" for row in rows)),
        "tier_counts": dict(Counter(clean(row.get("tier", "UNKNOWN")) or "UNKNOWN" for row in rows)),
        "data_status_counts": dict(Counter(clean(row.get("dataStatus", "UNKNOWN")) or "UNKNOWN" for row in rows)),
        "review_tag_counts": dict(Counter(clean(row.get("reviewTag", "UNKNOWN")) or "UNKNOWN" for row in rows)),
        "by_market_asset_type": by_market_asset_type,
        "metric_missing_summary": metric_missing_summary(rows),
        "category_counts": category_counts,
        "duplicates": duplicate_summary(rows),
    }
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit FINPLE candidate CSV metrics completeness.")
    parser.add_argument("--csv", required=True, help="Candidate CSV path to audit.")
    parser.add_argument("--out", default="", help="Optional JSON output path.")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    summary = build_summary(csv_path)
    summary_text = json.dumps(summary, ensure_ascii=False, indent=2)
    print(summary_text)

    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(summary_text + "\n", encoding="utf-8")
        print(f"\nSaved diagnostic summary: {out_path}")


if __name__ == "__main__":
    main()
