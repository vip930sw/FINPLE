"""Filter FINPLE US price metrics overlay for app upload.

Purpose
-------
The US price metrics run may generate all 3,000 rows, but rows with serious
combined data gaps should not be uploaded to the runtime price metrics overlay.

This script removes rows where two or more of the following metrics are missing:

- CAGR / expectedCagr
- BETA / beta
- MDD / mdd
- YIELD / dividendYield from the US dividend overlay

Important policy
----------------
A blank dividendYield in the dividend overlay remains blank and the app should
continue to show "배당 확인 중". This script does not fill dividend data and does
not change the dividend overlay.

Default expected result for the 2026-05-28 US run:

- input price rows: 3,000
- excluded serious-missing rows: 27
- output runtime rows: 2,973

Example
-------
python filter_us_price_metrics_app_ready.py \
  --price-input us_price_metrics_overlay_20260528.csv \
  --dividend-input us_dividend_overlay_20260527.csv \
  --out-runtime us_price_metrics_overlay_20260528_app_ready.csv \
  --out-excluded us_price_metrics_overlay_20260528_excluded_27.csv \
  --out-summary us_price_metrics_overlay_20260528_app_ready_summary.json
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any


PRICE_COLUMNS = [
    "market",
    "ticker",
    "expectedCagr",
    "priceCagr10y",
    "mdd",
    "beta",
    "dataYears",
    "benchmarkTicker",
    "metricsStatus",
    "metricsSource",
    "reviewReason",
]

EXCLUDED_COLUMNS = [
    "market",
    "ticker",
    "missingCount",
    "missingMetrics",
    "expectedCagr",
    "mdd",
    "beta",
    "dividendYield",
    "metricsStatus",
    "yieldStatus",
    "reviewReason",
]


def clean(value: Any) -> str:
    return str(value or "").replace("\ufeff", "").strip()


def normalize_market(value: Any) -> str:
    return clean(value).upper() or "US"


def normalize_ticker(value: Any) -> str:
    return clean(value).upper()


def is_blank(value: Any) -> bool:
    return clean(value) == ""


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def row_key(row: dict[str, str]) -> str:
    market = normalize_market(row.get("market"))
    ticker = normalize_ticker(row.get("ticker"))
    return f"{market}:{ticker}"


def build_dividend_map(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    output: dict[str, dict[str, str]] = {}
    for row in rows:
        key = row_key(row)
        if key.endswith(":"):
            continue
        output[key] = row
    return output


def missing_metrics(price_row: dict[str, str], dividend_row: dict[str, str] | None) -> list[str]:
    missing: list[str] = []
    if is_blank(price_row.get("expectedCagr")):
        missing.append("CAGR")
    if is_blank(price_row.get("beta")):
        missing.append("BETA")
    if is_blank(price_row.get("mdd")):
        missing.append("MDD")
    if dividend_row is None or is_blank(dividend_row.get("dividendYield")):
        missing.append("YIELD")
    return missing


def main() -> None:
    parser = argparse.ArgumentParser(description="Filter US price metrics overlay for FINPLE app upload.")
    parser.add_argument("--price-input", required=True, help="US price metrics overlay CSV, usually 3,000 rows.")
    parser.add_argument("--dividend-input", required=True, help="US dividend overlay CSV, used only to detect missing YIELD.")
    parser.add_argument("--out-runtime", required=True, help="Filtered app-ready price metrics CSV.")
    parser.add_argument("--out-excluded", required=True, help="Rows excluded due to 2+ missing metrics.")
    parser.add_argument("--out-summary", required=True, help="Summary JSON path.")
    parser.add_argument("--missing-threshold", type=int, default=2, help="Exclude rows with this many missing metrics or more.")
    args = parser.parse_args()

    price_rows = read_csv(Path(args.price_input))
    dividend_rows = read_csv(Path(args.dividend_input))
    dividend_map = build_dividend_map(dividend_rows)

    kept_rows: list[dict[str, Any]] = []
    excluded_rows: list[dict[str, Any]] = []
    missing_counts_by_metric = {"CAGR": 0, "BETA": 0, "MDD": 0, "YIELD": 0}

    for row in price_rows:
        key = row_key(row)
        dividend_row = dividend_map.get(key)
        missing = missing_metrics(row, dividend_row)
        for metric in missing:
            missing_counts_by_metric[metric] += 1

        if len(missing) >= args.missing_threshold:
            excluded_rows.append({
                "market": normalize_market(row.get("market")),
                "ticker": normalize_ticker(row.get("ticker")),
                "missingCount": len(missing),
                "missingMetrics": "+".join(missing),
                "expectedCagr": clean(row.get("expectedCagr")),
                "mdd": clean(row.get("mdd")),
                "beta": clean(row.get("beta")),
                "dividendYield": "" if dividend_row is None else clean(dividend_row.get("dividendYield")),
                "metricsStatus": clean(row.get("metricsStatus")),
                "yieldStatus": "" if dividend_row is None else clean(dividend_row.get("yieldStatus")),
                "reviewReason": clean(row.get("reviewReason")),
            })
            continue

        runtime_row = dict(row)
        runtime_row["market"] = normalize_market(runtime_row.get("market"))
        runtime_row["ticker"] = normalize_ticker(runtime_row.get("ticker"))
        kept_rows.append(runtime_row)

    for column in PRICE_COLUMNS:
        for row in kept_rows:
            row.setdefault(column, "")

    write_csv(Path(args.out_runtime), kept_rows, PRICE_COLUMNS)
    write_csv(Path(args.out_excluded), excluded_rows, EXCLUDED_COLUMNS)

    summary = {
        "price_input": args.price_input,
        "dividend_input": args.dividend_input,
        "input_price_rows": len(price_rows),
        "output_runtime_rows": len(kept_rows),
        "excluded_rows": len(excluded_rows),
        "missing_threshold": args.missing_threshold,
        "missing_counts_by_metric": missing_counts_by_metric,
        "excluded_by_missing_combo": {},
        "excluded_tickers": [row["ticker"] for row in excluded_rows],
    }

    combo_counts: dict[str, int] = {}
    for row in excluded_rows:
        combo = row["missingMetrics"]
        combo_counts[combo] = combo_counts.get(combo, 0) + 1
    summary["excluded_by_missing_combo"] = combo_counts

    out_summary = Path(args.out_summary)
    out_summary.parent.mkdir(parents=True, exist_ok=True)
    out_summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
