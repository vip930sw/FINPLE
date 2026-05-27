"""Chunked US dividend overlay builder for FINPLE.

Why this exists
---------------
The first US dividend builder can take too long when it tries to query every US
candidate in one run. This version is safer for Colab:

- prints progress for every ticker
- supports --start and --limit for chunked runs
- writes checkpoint CSVs every N rows
- skips bad/yfinance-incompatible symbols instead of hanging the workflow
- preserves the policy that blank != 0.00

Example test run
----------------
python build_us_dividend_overlay_chunked.py \
  --input finple_app_candidates_6000_balanced_v1.csv \
  --out-runtime us_dividend_overlay_20260527_part0000_0100.csv \
  --out-audit us_dividend_overlay_20260527_part0000_0100_audit.csv \
  --out-summary us_dividend_overlay_20260527_part0000_0100_summary.json \
  --as-of 2026-05-27 \
  --start 0 \
  --limit 100 \
  --checkpoint-every 25
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
import sys
import time
from dataclasses import asdict, dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable

try:
    import yfinance as yf
except Exception:  # pragma: no cover
    yf = None


CONFIRMED_NO_DIVIDEND_TICKERS = {
    "AMZN",
    "TSLA",
    "SNOW",
    "PLTR",
}

HIGH_YIELD_REVIEW_THRESHOLD = 15.0
VALID_YF_SYMBOL_RE = re.compile(r"^[A-Z0-9.\-^=]+$")


@dataclass
class DividendResult:
    market: str
    ticker: str
    yfSymbol: str
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


def safe_float(value: object) -> float | None:
    try:
        result = float(value)
        if math.isfinite(result):
            return result
    except Exception:
        return None
    return None


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, object]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def normalize_market(value: object) -> str:
    return clean(value).upper() or "US"


def normalize_ticker(value: object) -> str:
    return clean(value).upper().replace("\ufeff", "")


def to_yfinance_symbol(row: dict[str, str]) -> str:
    raw = clean(row.get("providerSymbol")) or clean(row.get("ticker"))
    symbol = raw.upper().replace("\ufeff", "").strip()
    symbol = symbol.lstrip("$")
    # Yahoo uses BRK-B style for share classes more often than BRK.B.
    if "." in symbol and not symbol.startswith("^"):
        symbol = symbol.replace(".", "-")
    return symbol


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
            "yfSymbol": to_yfinance_symbol(row),
            "assetType": clean(row.get("assetType")),
            "nameKr": clean(row.get("nameKr")),
        })
    return output


def blank_result(candidate: dict[str, str], source_tag: str, reason: str) -> DividendResult:
    return DividendResult(
        market="US",
        ticker=normalize_ticker(candidate.get("ticker")),
        yfSymbol=clean(candidate.get("yfSymbol")),
        assetType=clean(candidate.get("assetType")),
        dividendYield="",
        dividendPolicy="dividend_review_required",
        dividendSource=source_tag,
        yieldStatus="review_required",
        reviewReason=reason,
    )


def fetch_latest_close(symbol: str) -> float | None:
    if yf is None:
        return None
    history = yf.Ticker(symbol).history(period="5d", auto_adjust=False, actions=False)
    if history is None or history.empty or "Close" not in history.columns:
        return None
    close = history["Close"].dropna()
    if close.empty:
        return None
    return safe_float(close.iloc[-1])


def fetch_ttm_dividend(symbol: str, as_of: date) -> tuple[float | None, int]:
    if yf is None:
        return None, 0
    dividends = yf.Ticker(symbol).dividends
    if dividends is None or dividends.empty:
        return 0.0, 0
    div = dividends.copy()
    try:
        div.index = div.index.tz_localize(None)
    except Exception:
        pass
    cutoff = datetime.combine(as_of - timedelta(days=365), datetime.min.time())
    recent = div[div.index >= cutoff]
    if recent.empty:
        return 0.0, 0
    total = safe_float(recent.sum())
    return total, int(recent.shape[0])


def build_result(candidate: dict[str, str], as_of: date, source_tag: str, sleep_seconds: float = 0.0) -> DividendResult:
    ticker = normalize_ticker(candidate.get("ticker"))
    symbol = clean(candidate.get("yfSymbol"))
    asset_type = clean(candidate.get("assetType"))

    if not symbol or not VALID_YF_SYMBOL_RE.match(symbol):
        return blank_result(candidate, source_tag, f"invalid yfinance symbol: {symbol}")

    try:
        latest_close = fetch_latest_close(symbol)
        ttm_dividend, dividend_count = fetch_ttm_dividend(symbol, as_of)
    except Exception as exc:
        return blank_result(candidate, source_tag, f"yfinance exception: {type(exc).__name__}: {exc}")
    finally:
        if sleep_seconds > 0:
            time.sleep(sleep_seconds)

    if latest_close is None or latest_close <= 0:
        return blank_result(candidate, source_tag, "missing latest close price")

    if ttm_dividend is None:
        result = blank_result(candidate, source_tag, "dividend fetch error")
        result.latestClose = f"{latest_close:.6f}"
        return result

    if ttm_dividend <= 0:
        if ticker in CONFIRMED_NO_DIVIDEND_TICKERS:
            return DividendResult(
                market="US",
                ticker=ticker,
                yfSymbol=symbol,
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
            yfSymbol=symbol,
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
    dividend_policy = "dividend_confirmed"
    yield_status = "ready"
    review_reason = ""

    if dividend_yield >= HIGH_YIELD_REVIEW_THRESHOLD:
        dividend_policy = "dividend_review_required"
        yield_status = "review_required"
        review_reason = "high dividend yield; verify special distribution or stale price"

    return DividendResult(
        market="US",
        ticker=ticker,
        yfSymbol=symbol,
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


def build_summary(results: list[DividendResult], start: int, limit: int, total_candidates: int, as_of: date) -> dict[str, object]:
    yields = [safe_float(item.dividendYield) for item in results if item.dividendYield != ""]
    yields = [item for item in yields if item is not None]
    return {
        "as_of": as_of.isoformat(),
        "start": start,
        "limit": limit,
        "processed_count": len(results),
        "total_us_candidates": total_candidates,
        "ready_count": sum(1 for item in results if item.yieldStatus == "ready"),
        "review_required_count": sum(1 for item in results if item.yieldStatus == "review_required"),
        "dividend_confirmed_count": sum(1 for item in results if item.dividendPolicy == "dividend_confirmed"),
        "no_dividend_confirmed_count": sum(1 for item in results if item.dividendPolicy == "no_dividend_confirmed"),
        "blank_yield_count": sum(1 for item in results if item.dividendYield == ""),
        "min_dividend_yield": min(yields) if yields else None,
        "max_dividend_yield": max(yields) if yields else None,
        "high_yield_review_threshold": HIGH_YIELD_REVIEW_THRESHOLD,
    }


def save_outputs(results: list[DividendResult], out_runtime: Path, out_audit: Path, out_summary: Path, summary: dict[str, object]) -> None:
    audit_rows = [asdict(item) for item in results]
    audit_fields = list(asdict(results[0]).keys()) if results else [
        "market", "ticker", "yfSymbol", "assetType", "dividendYield", "dividendPolicy",
        "dividendSource", "yieldStatus", "reviewReason", "latestClose", "ttmDividend", "dividendCount12m"
    ]
    runtime_fields = ["market", "ticker", "dividendYield", "dividendPolicy", "dividendSource", "yieldStatus", "reviewReason"]
    runtime_rows = [{field: getattr(item, field) for field in runtime_fields} for item in results]

    write_csv(out_runtime, runtime_rows, runtime_fields)
    write_csv(out_audit, audit_rows, audit_fields)
    out_summary.parent.mkdir(parents=True, exist_ok=True)
    out_summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build US dividend overlay in safe chunks.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-runtime", required=True)
    parser.add_argument("--out-audit", required=True)
    parser.add_argument("--out-summary", required=True)
    parser.add_argument("--as-of", default=date.today().isoformat())
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--checkpoint-every", type=int, default=25)
    parser.add_argument("--sleep", type=float, default=0.0)
    args = parser.parse_args()

    if yf is None:
        raise SystemExit("yfinance is required. Install with: pip install yfinance")

    source_rows = read_csv(Path(args.input))
    all_candidates = unique_us_candidates(source_rows)
    as_of = datetime.strptime(args.as_of, "%Y-%m-%d").date()
    selected = all_candidates[args.start : args.start + args.limit]
    source_tag = f"yfinance_ttm_dividend_{as_of.strftime('%Y%m%d')}"

    print(f"Total US candidates: {len(all_candidates)}", flush=True)
    print(f"Processing chunk: start={args.start}, limit={args.limit}, selected={len(selected)}", flush=True)

    results: list[DividendResult] = []
    out_runtime = Path(args.out_runtime)
    out_audit = Path(args.out_audit)
    out_summary = Path(args.out_summary)

    for offset, candidate in enumerate(selected, start=1):
        absolute_index = args.start + offset - 1
        ticker = candidate.get("ticker", "")
        symbol = candidate.get("yfSymbol", "")
        print(f"[{offset}/{len(selected)} | global {absolute_index}] {ticker} -> {symbol}", flush=True)
        result = build_result(candidate, as_of, source_tag, sleep_seconds=args.sleep)
        results.append(result)
        if args.checkpoint_every and offset % args.checkpoint_every == 0:
            summary = build_summary(results, args.start, args.limit, len(all_candidates), as_of)
            save_outputs(results, out_runtime, out_audit, out_summary, summary)
            print(f"Checkpoint saved: {offset} rows", flush=True)

    summary = build_summary(results, args.start, args.limit, len(all_candidates), as_of)
    save_outputs(results, out_runtime, out_audit, out_summary, summary)
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted by user. Checkpoint files may still contain partial results.", file=sys.stderr, flush=True)
        raise
