#!/usr/bin/env python3
"""
FINPLE candidate seed CSV builder v1.

Purpose:
- Build Colab-ready candidate seed CSVs from the current FINPLE repo data.
- Use metricsOverridesV223.js as the broad ticker universe already processed in v2.2.3.
- Merge names/tags/classification from existing screener candidate CSVs when available.

Outputs:
- data/candidate-seed/finple_candidate_seed_us_v1.csv
- data/candidate-seed/finple_candidate_seed_kr_v1.csv
- data/candidate-seed/finple_candidate_seed_all_v1.csv

Run from repository root:
  python tools/finple_prepare_candidate_seed_v1.py

Colab:
  !python tools/finple_prepare_candidate_seed_v1.py
"""

from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "src" / "data" / "tickers"
OUTPUT_DIR = REPO_ROOT / "data" / "candidate-seed"

CANDIDATE_FILES = [
    DATA_DIR / "us_screener_candidates.csv",
    DATA_DIR / "us_screener_candidates_extra.csv",
    DATA_DIR / "us_screener_candidates_expansion.csv",
    DATA_DIR / "kr_screener_candidates.csv",
    DATA_DIR / "kr_stock_candidates.csv",
]

MANUAL_EXPANSION_FILE = OUTPUT_DIR / "finple_candidate_seed_manual_expansion_v1.csv"
METRICS_OVERRIDE_FILE = DATA_DIR / "metricsOverridesV223.js"

OUTPUT_COLUMNS = [
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
    "notes",
]

US_ETF_HINTS = {
    "VOO", "SPY", "IVV", "SPLG", "VTI", "ITOT", "SCHB", "IWB", "QQQ", "QQQM", "DIA", "IWM",
    "VT", "ACWI", "VUG", "IWF", "SCHG", "VTV", "IWD", "SCHV", "VB", "IJR", "IWO", "IWN",
    "QUAL", "MTUM", "VLUE", "USMV", "SPLV", "SPHQ", "SCHD", "VIG", "VYM", "DGRO", "HDV", "NOBL",
    "JEPI", "JEPQ", "DIVO", "XLF", "XLK", "XLE", "XLV", "XLY", "XLP", "XLI", "XLB", "XLU", "XLRE", "XLC",
    "SMH", "SOXX", "VGT", "FTEC", "IGV", "HACK", "CIBR", "BOTZ", "ROBO", "ARKK", "ICLN", "PBW",
    "IBB", "XBI", "IHI", "AGG", "BND", "BNDX", "TLT", "IEF", "SHY", "SGOV", "BIL", "MINT",
    "TIP", "LQD", "VCIT", "HYG", "JNK", "EMB", "GLD", "IAU", "SLV", "DBC", "PDBC", "USO", "UNG",
    "VNQ", "SCHH", "VNQI", "REET", "EFA", "IEFA", "VEA", "EEM", "IEMG", "VWO", "EWJ", "EWY", "FXI", "MCHI",
    "TQQQ", "SQQQ", "SPXL", "SPXS", "SOXL", "SOXS",
}

KR_STOCK_CODE_HINTS = {
    "005930", "000660", "373220", "207940", "005380", "000270", "005490", "051910", "006400",
    "035420", "035720", "068270", "105560", "055550", "086790", "316140", "032830", "000810",
    "024110", "003550", "034730", "066570", "012330", "028260", "009150", "010130", "003670", "247540",
}


def normalize_ticker(ticker: str) -> str:
    return str(ticker or "").strip().upper().replace(".", "-")


def make_key(market: str, ticker: str) -> str:
    return f"{str(market or '').strip().upper()}:{normalize_ticker(ticker)}"


def read_csv_rows(path: Path) -> List[dict]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def write_csv_rows(path: Path, rows: Iterable[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = list(rows)
    with path.open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in OUTPUT_COLUMNS})


def parse_metrics_rows(path: Path) -> List[dict]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"METRICS_ROWS_V2_2_3\s*=\s*`(?P<body>.*?)`;", text, re.S)
    if not match:
        raise RuntimeError(f"METRICS_ROWS_V2_2_3 block not found: {path}")

    rows = []
    for line in match.group("body").splitlines():
        line = line.strip()
        if not line:
            continue
        parts = line.split("\t")
        if len(parts) < 6:
            continue
        market, ticker, expected_cagr, beta, mdd, dividend_yield = parts[:6]
        rows.append(
            {
                "market": market.strip().upper(),
                "ticker": normalize_ticker(ticker),
                "expectedCagr": expected_cagr,
                "beta": beta,
                "mdd": mdd,
                "dividendYield": dividend_yield,
            }
        )
    return rows


def build_existing_candidate_map() -> Dict[str, dict]:
    candidate_map: Dict[str, dict] = {}
    for path in CANDIDATE_FILES:
        for row in read_csv_rows(path):
            market = str(row.get("market") or "US").strip().upper()
            ticker = normalize_ticker(row.get("ticker"))
            if not ticker:
                continue
            key = make_key(market, ticker)
            candidate_map[key] = row
    return candidate_map


def infer_asset_type(market: str, ticker: str, existing: dict | None = None) -> str:
    if existing and existing.get("assetType"):
        value = str(existing.get("assetType") or "").strip()
        return "stock" if value.lower() in {"stock", "single_stock"} else "ETF"
    if market == "US":
        return "ETF" if ticker in US_ETF_HINTS else "stock"
    if market == "KR":
        return "stock" if ticker in KR_STOCK_CODE_HINTS else "ETF"
    return "ETF"


def infer_strategy(asset_type: str, existing: dict | None = None) -> str:
    if existing and existing.get("strategy"):
        return str(existing.get("strategy") or "core").strip() or "core"
    return "growth" if asset_type == "stock" else "core"


def infer_risk(asset_type: str, existing: dict | None = None) -> str:
    if existing and existing.get("riskLevel"):
        return str(existing.get("riskLevel") or "medium").strip() or "medium"
    return "medium-high" if asset_type == "stock" else "medium"


def build_seed_rows() -> List[dict]:
    existing_map = build_existing_candidate_map()
    seed_rows: Dict[str, dict] = {}

    for metrics_row in parse_metrics_rows(METRICS_OVERRIDE_FILE):
        market = metrics_row["market"]
        ticker = metrics_row["ticker"]
        key = make_key(market, ticker)
        existing = existing_map.get(key, {})
        asset_type = infer_asset_type(market, ticker, existing)
        name_kr = existing.get("nameKr") or existing.get("koreanName") or existing.get("name") or ""
        source_status = "ready_with_metrics" if name_kr else "needs_name_review"
        notes = existing.get("notes") or "v2.2.3 metrics seed; review name/classification before app import"

        seed_rows[key] = {
            "market": market,
            "ticker": ticker,
            "providerSymbol": ticker,
            "nameKr": name_kr,
            "assetType": asset_type,
            "sourceUniverse": "v2_2_3_metrics_seed",
            "tier": "core" if existing.get("beginnerFit") == "true" else "standard",
            "strategy": infer_strategy(asset_type, existing),
            "riskLevel": infer_risk(asset_type, existing),
            "goals": existing.get("goals") or ("growth" if asset_type == "stock" else "core"),
            "beginnerFit": existing.get("beginnerFit") or ("false" if asset_type == "stock" else "true"),
            "tags": existing.get("tags") or ("개별주" if asset_type == "stock" else "ETF"),
            "dataStatus": source_status,
            "expectedCagr": metrics_row.get("expectedCagr", ""),
            "beta": metrics_row.get("beta", ""),
            "mdd": metrics_row.get("mdd", ""),
            "dividendYield": metrics_row.get("dividendYield", ""),
            "notes": notes,
        }

    for manual_row in read_csv_rows(MANUAL_EXPANSION_FILE):
        market = str(manual_row.get("market") or "").strip().upper()
        ticker = normalize_ticker(manual_row.get("ticker"))
        if not market or not ticker:
            continue
        key = make_key(market, ticker)
        asset_type = infer_asset_type(market, ticker, manual_row)
        seed_rows.setdefault(
            key,
            {
                "market": market,
                "ticker": ticker,
                "providerSymbol": manual_row.get("providerSymbol") or ticker,
                "nameKr": manual_row.get("nameKr") or "",
                "assetType": asset_type,
                "sourceUniverse": manual_row.get("sourceUniverse") or "manual_expansion_seed",
                "tier": manual_row.get("tier") or "extended",
                "strategy": infer_strategy(asset_type, manual_row),
                "riskLevel": infer_risk(asset_type, manual_row),
                "goals": manual_row.get("goals") or ("growth" if asset_type == "stock" else "core"),
                "beginnerFit": manual_row.get("beginnerFit") or "false",
                "tags": manual_row.get("tags") or ("개별주" if asset_type == "stock" else "ETF"),
                "dataStatus": manual_row.get("dataStatus") or "pending_metrics",
                "expectedCagr": manual_row.get("expectedCagr") or "",
                "beta": manual_row.get("beta") or "",
                "mdd": manual_row.get("mdd") or "",
                "dividendYield": manual_row.get("dividendYield") or "",
                "notes": manual_row.get("notes") or "manual expansion seed; metrics pending",
            },
        )

    return sorted(seed_rows.values(), key=lambda row: (row["market"], row["assetType"], row["ticker"]))


def main() -> None:
    rows = build_seed_rows()
    us_rows = [row for row in rows if row["market"] == "US"]
    kr_rows = [row for row in rows if row["market"] == "KR"]

    write_csv_rows(OUTPUT_DIR / "finple_candidate_seed_us_v1.csv", us_rows)
    write_csv_rows(OUTPUT_DIR / "finple_candidate_seed_kr_v1.csv", kr_rows)
    write_csv_rows(OUTPUT_DIR / "finple_candidate_seed_all_v1.csv", rows)

    print("FINPLE candidate seed CSV generated")
    print(f"- US:  {len(us_rows):>4} rows -> {OUTPUT_DIR / 'finple_candidate_seed_us_v1.csv'}")
    print(f"- KR:  {len(kr_rows):>4} rows -> {OUTPUT_DIR / 'finple_candidate_seed_kr_v1.csv'}")
    print(f"- ALL: {len(rows):>4} rows -> {OUTPUT_DIR / 'finple_candidate_seed_all_v1.csv'}")


if __name__ == "__main__":
    main()
