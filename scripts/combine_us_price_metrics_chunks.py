"""Combine FINPLE US price metrics chunk CSVs.

Run this in Colab after chunk files are created.

Example
-------
python combine_us_price_metrics_chunks.py \
  --pattern 'us_price_metrics_overlay_20260528_part*.csv' \
  --out-runtime us_price_metrics_overlay_20260528.csv \
  --out-summary us_price_metrics_overlay_20260528_summary.json
"""

from __future__ import annotations

import argparse
import glob
import json
from pathlib import Path

import pandas as pd

from scripts.raw_daily_price_chunks import combine_raw_daily_chunks

RUNTIME_COLUMNS = [
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Combine US price metrics chunk CSVs.")
    parser.add_argument("--pattern", required=True, help="Glob pattern for runtime chunk CSVs.")
    parser.add_argument("--out-runtime", required=True)
    parser.add_argument("--out-summary", required=True)
    parser.add_argument("--raw-pattern", help="Glob for non-overlapping US RAW_DAILY_PRICE_COLUMNS chunks.")
    parser.add_argument("--out-raw", help="Combined US raw-daily CSV path.")
    args = parser.parse_args()

    files = sorted([path for path in glob.glob(args.pattern) if "_audit" not in path])
    if not files:
        raise SystemExit(f"No files found for pattern: {args.pattern}")

    frames = [pd.read_csv(path, dtype={"ticker": str}) for path in files]
    df = pd.concat(frames, ignore_index=True)
    df["market"] = df["market"].fillna("US").astype(str).str.strip().str.upper()
    df["ticker"] = df["ticker"].astype(str).str.strip().str.upper()
    df = df.drop_duplicates(["market", "ticker"], keep="last")

    for column in RUNTIME_COLUMNS:
        if column not in df.columns:
            df[column] = ""
    df = df[RUNTIME_COLUMNS]

    out_runtime = Path(args.out_runtime)
    out_runtime.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_runtime, index=False, encoding="utf-8-sig")

    summary = {
        "runtime_file": str(out_runtime),
        "chunk_files": len(files),
        "row_count": int(df.shape[0]),
        "market_counts": df["market"].value_counts(dropna=False).to_dict(),
        "metricsStatus_counts": df["metricsStatus"].fillna("(blank)").value_counts(dropna=False).to_dict(),
        "blank_cagr_count": int(df["expectedCagr"].isna().sum() + (df["expectedCagr"].astype(str).str.strip() == "").sum()),
        "blank_beta_count": int(df["beta"].isna().sum() + (df["beta"].astype(str).str.strip() == "").sum()),
    }
    if bool(args.raw_pattern) != bool(args.out_raw):
        raise SystemExit("--raw-pattern and --out-raw must be provided together")
    if args.raw_pattern and args.out_raw:
        summary.update(combine_raw_daily_chunks(args.raw_pattern, Path(args.out_raw), "US"))

    out_summary = Path(args.out_summary)
    out_summary.parent.mkdir(parents=True, exist_ok=True)
    out_summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
