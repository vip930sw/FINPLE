"""Build FINPLE US dividend overlay CSV.

This script is intended for Colab or local Python with internet access.
It uses yfinance when available. It does not run in the frontend.

Purpose
-------
Create a reviewed US dividend overlay that can later be imported by the
FINPLE frontend loader.

Input
-----
A FINPLE candidate CSV containing at least:

    market,ticker,assetType

Recommended candidate source:

    src/data/tickers/finple_app_candidates_6000_balanced_v1.csv

Output
------
1. Runtime compact overlay:

    src/data/tickers/us_dividend_overlay_YYYYMMDD.csv

2. Audit CSV:

    data/processed/us_dividend_overlay_YYYYMMDD_audit.csv

3. Summary JSON:

    data/processed/us_dividend_overlay_YYYYMMDD_summary.json

Important policy
----------------
blank dividendYield = not checked / review required
0.00 dividendYield = confirmed no dividend
> 0 dividendYield = confirmed recent dividend/distribution yield

Never blindly convert missing dividend history to 0.00.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from dataclasses import dataclass, asdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

try:
    import yfinance as yf
except Exception:  # pragma: no cover - allows audit-only import without yfinance
    yf = None


CONFIRMED_NO_DIVIDEND_TICKERS = {
    # Confirm manually before expanding this list.
    "AMZN",
    "TSLA",
    "SNOW",
    "PLTR",
}

HIGH_YIELD_REVIEW_THRESHOLD = 15.0


@dataclass
class DividendResult:
    market: str
    ticker: str
    assetType: str
    dividendYield: str
    dividendPolicy: str
    dividendSource: str
    yieldStatus: str
    reviewReason: str
    latestClose: str = ""
    ttmDividend: str = ""
    dividendCount12m: int = 0


def clean(value: object) -> str:
    return str(value or "").strip()


def normalize_ticker(value: object) -> str:
    return clean(value).upper()


def normalize_market(value: object) -> str:
    return clean(value).upper() or "US"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def is_us_candidate(row: dict[str, str]) -> bool:
    return normalize_market(row.get("market")) == "US" and bool(normalize_ticker(row.get("ticker")))


def unique_us_candidates(rows: Iterable[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    output: list[dict[str, str]] = []
    for row in rows:
        if not is_us_candidate(row):
            continue
        ticker = normalize_ticker(row.get("ticker"))
        if ticker in seen:
            continue
        seen.add(ticker)
        output.append({
            "market": "US",
            "ticker": ticker,
            "assetType": clean(row.get("assetType")),
            "nameKr": clean(row.get("nameKr")),
        })
    return output


def safe_float(value: object) -> float | None:
    try:
        result = float(value)
        if math.isfinite(result):
            return result
    except Exception:
        return None
    return None


def fetch_latest_close(ticker: str) -> float | None:
    if yf is None:
        return None
    try:
        history = yf.Ticker(ticker).history(period="5d", auto_adjust=False)
        if history is None or history.empty or "Close" not in history.columns:
            return None
        close = history["Close"].dropna()
        if close.empty:
            return None
        return safe_float(close.iloc[-1])
    except Exception:
        return None


def fetch_ttm_dividend(ticker: str, as_of: date) -> tuple[float | None, int]:
    if yf is None:
        return None, 0
    try:
        dividends = yf.Ticker(ticker).dividends
        if dividends is None or dividends.empty:
            return 0.0, 0

        cutoff = datetime.combine(as_of - timedelta(days=365), datetime.min.time())
        # yfinance index can be timezone-aware. Make comparison timezone-safe.
        div = dividends.copy()
        try:
            div.index = div.index.tz_localize(None)
        except Exception:
            pass
        recent = div[div.index >= cutoff]
        if recent.empty:
            return 0.0, 0
        total = safe_float(recent.sum())
        return total if total is not None else None, int(recent.shape[0])
    except Exception:
        return None, 0


def build_result(candidate: dict[str, str], as_of: date, source_tag: str) -> DividendResult:
    ticker = normalize_ticker(candidate.get("ticker"))
    asset_type = clean(candidate.get("assetType"))

    latest_close = fetch_latest_close(ticker)
    ttm_dividend, dividend_count = fetch_ttm_dividend(ticker, as_of)

    if latest_close is None or latest_close <= 0:
        return DividendResult(
            market="US",
            ticker=ticker,
            assetType=asset_type,
            dividendYield="",
            dividendPolicy="dividend_review_required",
            dividendSource=source_tag,
            yieldStatus="review_required",
            reviewReason="missing latest close price",
        )

    if ttm_dividend is None:
        return DividendResult(
            market="US",
            ticker=ticker,
            assetType=asset_type,
            dividendYield="",
            dividendPolicy="dividend_review_required",
            dividendSource=source_tag,
            yieldStatus="review_required",
            reviewReason="yfinance dividend fetch error",
            latestClose=f"{latest_close:.6f}",
        )

    if ttm_dividend <= 0:
        if ticker in CONFIRMED_NO_DIVIDEND_TICKERS:
            return DividendResult(
                market="US",
                ticker=ticker,
                assetType=asset_type,
                dividendYield="0.00",
                dividendPolicy="no_dividend_confirmed",
                dividendSource="no_dividend_policy_manual_202605",
                yieldStatus="ready",
                reviewReason="",
                latestClose=f"{latest_close:.6f}",
                ttmDividend="0.000000",
                dividendCount12m=0,
            )
        return DividendResult(
            market="US",
            ticker=ticker,
            assetType=asset_type,
            dividendYield="",
            dividendPolicy="dividend_review_required",
            dividendSource=source_tag,
            yieldStatus="review_required",
            reviewReason="no recent dividend history; not confirmed no-dividend",
            latestClose=f"{latest_close:.6f}",
            ttmDividend="0.000000",
            dividendCount12m=0,
        )

    dividend_yield = round((ttm_dividend / latest_close) * 100, 2)
    review_reason = ""
    yield_status = "ready"
    dividend_policy = "dividend_confirmed"

    if dividend_yield >= HIGH_YIELD_REVIEW_THRESHOLD:
        yield_status = "review_required"
        dividend_policy = "dividend_review_required"
        review_reason = "high dividend yield; verify special distribution or stale price"

    return DividendResult(
        market="US",
        ticker=ticker,
        assetType=asset_type,
        dividendYield=f"{dividend_yield:.2f}",
        dividendPolicy=dividend_policy,
        dividendSource=source_tag,
        yieldStatus=yield_status,
        reviewReason=review_reason,
        latestClose=f"{latest_close:.6f}",
        ttmDividend=f"{ttm_dividend:.6f}",
        dividendCount12m=dividend_count,
    )


def build_summary(results: list[DividendResult], source_csv: Path, as_of: date) -> dict[str, object]:
    def count(predicate) -> int:
        return sum(1 for item in results if predicate(item))

    yields = [safe_float(item.dividendYield) for item in results if item.dividendYield != ""]
    yields = [item for item in yields if item is not None]

    return {
        "source_csv": str(source_csv),
        "as_of": as_of.isoformat(),
        "row_count": len(results),
        "ready_count": count(lambda item: item.yieldStatus == "ready"),
        "review_required_count": count(lambda item: item.yieldStatus == "review_required"),
        "confirmed_no_dividend_count": count(lambda item: item.dividendPolicy == "no_dividend_confirmed"),
        "dividend_confirmed_count": count(lambda item: item.dividendPolicy == "dividend_confirmed"),
        "blank_yield_count": count(lambda item: item.dividendYield == ""),
        "min_dividend_yield": min(yields) if yields else None,
        "max_dividend_yield": max(yields) if yields else None,
        "high_yield_review_threshold": HIGH_YIELD_REVIEW_THRESHOLD,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build US dividend overlay for FINPLE.")
    parser.add_argument("--input", required=True, help="Input candidate CSV path.")
    parser.add_argument("--out-runtime", required=True, help="Runtime compact overlay CSV path.")
    parser.add_argument("--out-audit", required=True, help="Full audit CSV path.")
    parser.add_argument("--out-summary", required=True, help="Summary JSON path.")
    parser.add_argument("--as-of", default=date.today().isoformat(), help="As-of date YYYY-MM-DD.")
    parser.add_argument("--limit", type=int, default=0, help="Optional limit for test runs.")
    args = parser.parse_args()

    if yf is None:
        raise SystemExit("yfinance is required. Install with: pip install yfinance")

    source_csv = Path(args.input)
    as_of = datetime.strptime(args.as_of, "%Y-%m-%d").date()
    candidates = unique_us_candidates(read_csv(source_csv))
    if args.limit and args.limit > 0:
        candidates = candidates[: args.limit]

    source_tag = f"yfinance_ttm_dividend_{as_of.strftime('%Y%m%d')}"
    results = [build_result(candidate, as_of, source_tag) for candidate in candidates]

    audit_rows = [asdict(item) for item in results]
    audit_fields = list(asdict(results[0]).keys()) if results else [
        "market", "ticker", "assetType", "dividendYield", "dividendPolicy", "dividendSource",
        "yieldStatus", "reviewReason", "latestClose", "ttmDividend", "dividendCount12m"
    ]

    runtime_rows = [
        {
            "market": item.market,
            "ticker": item.ticker,
            "dividendYield": item.dividendYield,
            "dividendPolicy": item.dividendPolicy,
            "dividendSource": item.dividendSource,
            "yieldStatus": item.yieldStatus,
            "reviewReason": item.reviewReason,
        }
        for item in results
    ]

    runtime_fields = [
        "market", "ticker", "dividendYield", "dividendPolicy", "dividendSource", "yieldStatus", "reviewReason"
    ]

    write_csv(Path(args.out_runtime), runtime_rows, runtime_fields)
    write_csv(Path(args.out_audit), audit_rows, audit_fields)

    summary = build_summary(results, source_csv, as_of)
    out_summary = Path(args.out_summary)
    out_summary.parent.mkdir(parents=True, exist_ok=True)
    out_summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
