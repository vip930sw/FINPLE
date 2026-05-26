"""FINPLE Step 108-3 candidate universe builder.

Purpose
-------
This script documents the inputs and operating rules for rebuilding the
FINPLE 6,000-candidate screener CSV.

Current target
--------------
- US candidates: 3,000
- KR candidates: 3,000
- Total: 6,000

Required raw inputs
-------------------
- data/raw/2026-05-24/us_nasdaq_stock_screener_20260524.csv
- data/raw/2026-05-24/us_nasdaq_etf_screener_20260524.csv
- data/raw/2026-05-24/kr_etf_market_snapshot_20260524.xlsx
- data/raw/2026-05-24/kr_stock_market_snapshot_20260524.xlsx
- data/raw/2026-05-24/finple_portfolio_symbol_source_v25_12.csv
- data/processed/finple_app_candidates_5589_balanced_v1.csv

Policy
------
1. Existing candidates and metrics are preserved.
2. Newly added candidates are marked review_required until metrics are filled.
3. Crypto/blockchain is treated as a US-centered ETF/theme bucket.
4. Runtime CSV should be copied to src/data/tickers/ after validation.

Note
----
The full Step 108-3 workspace output is stored separately as:
FINPLE_step108_3_candidate_6000_package_v1.zip
"""

from pathlib import Path

REQUIRED_INPUTS = {
    "base_candidates": "data/processed/finple_app_candidates_5589_balanced_v1.csv",
    "us_stock_raw": "data/raw/2026-05-24/us_nasdaq_stock_screener_20260524.csv",
    "us_etf_raw": "data/raw/2026-05-24/us_nasdaq_etf_screener_20260524.csv",
    "kr_etf_raw": "data/raw/2026-05-24/kr_etf_market_snapshot_20260524.xlsx",
    "kr_stock_raw": "data/raw/2026-05-24/kr_stock_market_snapshot_20260524.xlsx",
    "priority_symbols": "data/raw/2026-05-24/finple_portfolio_symbol_source_v25_12.csv",
}

OUTPUTS = {
    "runtime_csv": "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv",
    "processed_csv": "data/processed/finple_app_candidates_6000_balanced_v1.csv",
    "category_counts": "data/processed/finple_step108_3_6000_category_counts.csv",
    "summary": "data/processed/finple_step108_3_6000_summary.json",
}


def validate_expected_paths(root: str | Path = ".") -> list[str]:
    """Return missing input paths relative to repository root."""
    root = Path(root)
    return [path for path in REQUIRED_INPUTS.values() if not (root / path).exists()]


if __name__ == "__main__":
    missing = validate_expected_paths()
    if missing:
        print("Missing raw/processed source files:")
        for path in missing:
            print(f"- {path}")
    else:
        print("All Step 108-3 inputs are present. Rebuild logic can run here.")
