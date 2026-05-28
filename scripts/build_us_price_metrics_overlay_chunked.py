"""Chunked US price metrics overlay builder for FINPLE.

Purpose
-------
Generate US price-based metrics for FINPLE candidates without overwriting the
base 6,000 candidate CSV.

Metrics
-------
- expectedCagr: price-close CAGR, not total return CAGR
- priceCagr10y: same as expectedCagr in this first US pass
- mdd: maximum drawdown from close prices
- beta: beta versus SPY using daily returns
- dataYears: effective close-price history length

Policy
------
Dividend return must not be included in expectedCagr because FINPLE displays
and may use dividendYield separately.

Example
-------
python build_us_price_metrics_overlay_chunked.py \
  --input finple_app_candidates_6000_balanced_v1.csv \
  --out-runtime us_price_metrics_overlay_20260528_part0000_0100.csv \
  --out-audit us_price_metrics_overlay_20260528_part0000_0100_audit.csv \
  --out-summary us_price_metrics_overlay_20260528_part0000_0100_summary.json \
  --as-of 2026-05-28 \
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
from datetime import date, datetime
from pathlib import Path
from typing import Iterable

try:
    import pandas as pd
    import yfinance as yf
except Exception:  # pragma: no cover
    pd = None
    yf = None


VALID_YF_SYMBOL_RE = re.compile(r"^[A-Z0-9.\-^=]+$")
BENCHMARK_TICKER = "SPY"
MIN_READY_YEARS = 3.0
MIN_SHORT_HISTORY_YEARS = 1.0
ABNORMAL_CAGR_THRESHOLD = 100.0


@dataclass
class PriceMetricsResult:
    market: str
    ticker: str
    yfSymbol: str
    assetType: str
    expectedCagr: str
    priceCagr10y: str
    mdd: str
    beta: str
    dataYears: str
    benchmarkTicker: str
    metricsStatus: str
    metricsSource: str
    reviewReason: str
    effectiveStartDate: str = ""
    effectiveEndDate: str = ""
    firstClose: str = ""
    latestClose: str = ""
    observations: int = 0


def clean(value: object) -> str:
    return str(value or "").strip()


def safe_float(value: object) -> float | None:
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except Exception:
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
    symbol = raw.upper().replace("\ufeff", "").strip().lstrip("$")
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


def blank_result(candidate: dict[str, str], source_tag: str, reason: str) -> PriceMetricsResult:
    return PriceMetricsResult(
        market="US",
        ticker=normalize_ticker(candidate.get("ticker")),
        yfSymbol=clean(candidate.get("yfSymbol")),
        assetType=clean(candidate.get("assetType")),
        expectedCagr="",
        priceCagr10y="",
        mdd="",
        beta="",
        dataYears="",
        benchmarkTicker=BENCHMARK_TICKER,
        metricsStatus="review_required",
        metricsSource=source_tag,
        reviewReason=reason,
    )


def download_close(symbol: str, start: str, end: str) -> "pd.Series | None":
    if yf is None or pd is None:
        return None
    data = yf.download(symbol, start=start, end=end, auto_adjust=False, progress=False, threads=False)
    if data is None or data.empty:
        return None

    close = data.get("Close")
    if close is None:
        return None
    if hasattr(close, "columns"):
        # yfinance may return a DataFrame for a single symbol under newer versions.
        close = close.iloc[:, 0]
    close = close.dropna()
    return close if not close.empty else None


def calculate_cagr(close: "pd.Series") -> tuple[float | None, float | None, str, str, float | None, float | None]:
    if close is None or close.empty or len(close) < 2:
        return None, None, "", "", None, None
    first_close = safe_float(close.iloc[0])
    latest_close = safe_float(close.iloc[-1])
    if first_close is None or latest_close is None or first_close <= 0 or latest_close <= 0:
        return None, None, "", "", first_close, latest_close
    start_date = close.index[0].date().isoformat()
    end_date = close.index[-1].date().isoformat()
    days = max((close.index[-1] - close.index[0]).days, 1)
    years = days / 365.25
    if years <= 0:
        return None, years, start_date, end_date, first_close, latest_close
    cagr = ((latest_close / first_close) ** (1 / years) - 1) * 100
    return cagr, years, start_date, end_date, first_close, latest_close


def calculate_mdd(close: "pd.Series") -> float | None:
    if close is None or close.empty:
        return None
    running_max = close.cummax()
    drawdown = close / running_max - 1
    mdd = safe_float(drawdown.min())
    return mdd * 100 if mdd is not None else None


def calculate_beta(asset_close: "pd.Series", benchmark_close: "pd.Series") -> float | None:
    if asset_close is None or benchmark_close is None or asset_close.empty or benchmark_close.empty:
        return None
    asset_returns = asset_close.pct_change().dropna()
    benchmark_returns = benchmark_close.pct_change().dropna()
    joined = pd.concat([asset_returns, benchmark_returns], axis=1, join="inner").dropna()
    if joined.shape[0] < 120:
        return None
    joined.columns = ["asset", "benchmark"]
    variance = joined["benchmark"].var()
    if variance is None or variance == 0 or not math.isfinite(float(variance)):
        return None
    covariance = joined["asset"].cov(joined["benchmark"])
    beta = covariance / variance
    return safe_float(beta)


def decide_status(cagr: float | None, mdd: float | None, beta: float | None, data_years: float | None) -> tuple[str, str]:
    reasons: list[str] = []
    if cagr is None or mdd is None or data_years is None:
        return "review_required", "missing price metric"
    if data_years < MIN_SHORT_HISTORY_YEARS:
        return "review_required", "price history shorter than 1 year"
    if abs(cagr) >= ABNORMAL_CAGR_THRESHOLD:
        reasons.append("abnormal cagr")
    if mdd > 0:
        reasons.append("mdd greater than zero")
    if data_years >= MIN_READY_YEARS and beta is None:
        reasons.append("missing beta despite enough history")
    if reasons:
        return "review_required", "; ".join(reasons)
    if data_years < MIN_READY_YEARS:
        return "short_history", "price history shorter than 3 years"
    return "ready", ""


def build_result(candidate: dict[str, str], source_tag: str, start: str, end: str, benchmark_close: "pd.Series", sleep_seconds: float) -> PriceMetricsResult:
    ticker = normalize_ticker(candidate.get("ticker"))
    symbol = clean(candidate.get("yfSymbol"))
    asset_type = clean(candidate.get("assetType"))

    if not symbol or not VALID_YF_SYMBOL_RE.match(symbol):
        return blank_result(candidate, source_tag, f"invalid yfinance symbol: {symbol}")

    try:
        close = download_close(symbol, start=start, end=end)
    except Exception as exc:
        return blank_result(candidate, source_tag, f"yfinance exception: {type(exc).__name__}: {exc}")
    finally:
        if sleep_seconds > 0:
            time.sleep(sleep_seconds)

    if close is None or close.empty:
        return blank_result(candidate, source_tag, "missing close price data")

    cagr, data_years, start_date, end_date, first_close, latest_close = calculate_cagr(close)
    mdd = calculate_mdd(close)
    beta = calculate_beta(close, benchmark_close)
    status, reason = decide_status(cagr, mdd, beta, data_years)

    def fmt(value: float | None) -> str:
        return "" if value is None else f"{value:.2f}"

    return PriceMetricsResult(
        market="US",
        ticker=ticker,
        yfSymbol=symbol,
        assetType=asset_type,
        expectedCagr=fmt(cagr),
        priceCagr10y=fmt(cagr),
        mdd=fmt(mdd),
        beta=fmt(beta),
        dataYears=fmt(data_years),
        benchmarkTicker=BENCHMARK_TICKER,
        metricsStatus=status,
        metricsSource=source_tag,
        reviewReason=reason,
        effectiveStartDate=start_date,
        effectiveEndDate=end_date,
        firstClose=fmt(first_close),
        latestClose=fmt(latest_close),
        observations=int(len(close)),
    )


def build_summary(results: list[PriceMetricsResult], start_index: int, limit: int, total_candidates: int, as_of: date) -> dict[str, object]:
    return {
        "as_of": as_of.isoformat(),
        "start": start_index,
        "limit": limit,
        "processed_count": len(results),
        "total_us_candidates": total_candidates,
        "ready_count": sum(1 for item in results if item.metricsStatus == "ready"),
        "short_history_count": sum(1 for item in results if item.metricsStatus == "short_history"),
        "review_required_count": sum(1 for item in results if item.metricsStatus == "review_required"),
        "blank_cagr_count": sum(1 for item in results if item.expectedCagr == ""),
        "blank_beta_count": sum(1 for item in results if item.beta == ""),
        "benchmarkTicker": BENCHMARK_TICKER,
    }


def save_outputs(results: list[PriceMetricsResult], out_runtime: Path, out_audit: Path, out_summary: Path, summary: dict[str, object]) -> None:
    audit_rows = [asdict(item) for item in results]
    audit_fields = list(asdict(results[0]).keys()) if results else [
        "market", "ticker", "yfSymbol", "assetType", "expectedCagr", "priceCagr10y", "mdd", "beta",
        "dataYears", "benchmarkTicker", "metricsStatus", "metricsSource", "reviewReason",
        "effectiveStartDate", "effectiveEndDate", "firstClose", "latestClose", "observations"
    ]
    runtime_fields = [
        "market", "ticker", "expectedCagr", "priceCagr10y", "mdd", "beta", "dataYears",
        "benchmarkTicker", "metricsStatus", "metricsSource", "reviewReason"
    ]
    runtime_rows = [{field: getattr(item, field) for field in runtime_fields} for item in results]

    write_csv(out_runtime, runtime_rows, runtime_fields)
    write_csv(out_audit, audit_rows, audit_fields)
    out_summary.parent.mkdir(parents=True, exist_ok=True)
    out_summary.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build US price metrics overlay in safe chunks.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-runtime", required=True)
    parser.add_argument("--out-audit", required=True)
    parser.add_argument("--out-summary", required=True)
    parser.add_argument("--as-of", default=date.today().isoformat())
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--checkpoint-every", type=int, default=25)
    parser.add_argument("--sleep", type=float, default=0.0)
    parser.add_argument("--years", type=int, default=10)
    args = parser.parse_args()

    if yf is None or pd is None:
        raise SystemExit("pandas and yfinance are required. Install with: pip install pandas yfinance")

    as_of = datetime.strptime(args.as_of, "%Y-%m-%d").date()
    start_date = date(as_of.year - args.years, as_of.month, as_of.day).isoformat()
    end_date = as_of.isoformat()
    source_tag = f"yfinance_close_price_{as_of.strftime('%Y%m%d')}"

    rows = read_csv(Path(args.input))
    all_candidates = unique_us_candidates(rows)
    selected = all_candidates[args.start : args.start + args.limit]

    print(f"Total US candidates: {len(all_candidates)}", flush=True)
    print(f"Processing chunk: start={args.start}, limit={args.limit}, selected={len(selected)}", flush=True)
    print(f"Date range: {start_date} to {end_date}, benchmark={BENCHMARK_TICKER}", flush=True)

    benchmark_close = download_close(BENCHMARK_TICKER, start=start_date, end=end_date)
    if benchmark_close is None or benchmark_close.empty:
        raise SystemExit("Unable to download benchmark close series for SPY")

    results: list[PriceMetricsResult] = []
    out_runtime = Path(args.out_runtime)
    out_audit = Path(args.out_audit)
    out_summary = Path(args.out_summary)

    for offset, candidate in enumerate(selected, start=1):
        absolute_index = args.start + offset - 1
        ticker = candidate.get("ticker", "")
        symbol = candidate.get("yfSymbol", "")
        print(f"[{offset}/{len(selected)} | global {absolute_index}] {ticker} -> {symbol}", flush=True)
        result = build_result(candidate, source_tag, start_date, end_date, benchmark_close, args.sleep)
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
        print("Interrupted by user. Checkpoint files may contain partial results.", file=sys.stderr, flush=True)
        raise
