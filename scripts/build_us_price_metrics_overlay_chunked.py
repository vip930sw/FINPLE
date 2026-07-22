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
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Iterable

from scripts.raw_daily_price_chunks import (
    extract_raw_daily_rows,
    history_series,
    read_raw_daily_rows,
    write_raw_daily_rows,
)

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


def download_history(symbol: str, start: str, end: str):
    if yf is None or pd is None:
        return None
    data = yf.download(
        symbol,
        start=start,
        end=end,
        auto_adjust=False,
        actions=True,
        progress=False,
        threads=False,
    )
    if data is None or data.empty:
        return None

    return data


def download_close(symbol: str, start: str, end: str) -> "pd.Series | None":
    data = download_history(symbol, start, end)
    if data is None:
        return None

    close = history_series(data, "Close")
    if close is None:
        return None
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


def build_result(
    candidate: dict[str, str],
    source_tag: str,
    start: str,
    end: str,
    benchmark_close: "pd.Series",
    sleep_seconds: float,
    retrieved_at: str,
) -> tuple[PriceMetricsResult, list[dict[str, str]]]:
    ticker = normalize_ticker(candidate.get("ticker"))
    symbol = clean(candidate.get("yfSymbol"))
    asset_type = clean(candidate.get("assetType"))

    if not symbol or not VALID_YF_SYMBOL_RE.match(symbol):
        return blank_result(candidate, source_tag, f"invalid yfinance symbol: {symbol}"), []

    try:
        history = download_history(symbol, start=start, end=end)
    except Exception as exc:
        return blank_result(candidate, source_tag, f"yfinance exception: {type(exc).__name__}: {exc}"), []
    finally:
        if sleep_seconds > 0:
            time.sleep(sleep_seconds)

    close = history_series(history, "Close") if history is not None else None
    if close is not None:
        close = close.dropna()
    if close is None or close.empty:
        return blank_result(candidate, source_tag, "missing close price data"), []

    raw_rows = extract_raw_daily_rows(
        history,
        market="US",
        ticker=ticker,
        currency="USD",
        retrieved_at=retrieved_at,
    )

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
    ), raw_rows


def build_summary(
    results: list[PriceMetricsResult],
    start_index: int,
    limit: int,
    total_candidates: int,
    as_of: date,
    raw_rows: list[dict[str, str]] | None = None,
) -> dict[str, object]:
    raw_rows = raw_rows or []
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
        "raw_daily_row_count": len(raw_rows),
        "raw_daily_asset_count": len({(row["market"], row["ticker"]) for row in raw_rows}),
    }


def save_outputs(
    results: list[PriceMetricsResult],
    out_runtime: Path,
    out_audit: Path,
    out_summary: Path,
    summary: dict[str, object],
    *,
    out_raw: Path | None = None,
    raw_rows: list[dict[str, str]] | None = None,
) -> None:
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
    if out_raw is not None:
        write_raw_daily_rows(out_raw, raw_rows or [])


def main() -> None:
    parser = argparse.ArgumentParser(description="Build US price metrics overlay in safe chunks.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--out-runtime", required=True)
    parser.add_argument("--out-audit", required=True)
    parser.add_argument("--out-summary", required=True)
    parser.add_argument("--out-raw", help="RAW_DAILY_PRICE_COLUMNS chunk output.")
    parser.add_argument("--as-of", default=date.today().isoformat())
    parser.add_argument("--start", type=int, default=0)
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--checkpoint-every", type=int, default=25)
    parser.add_argument("--sleep", type=float, default=0.0)
    parser.add_argument("--years", type=int, default=10)
    parser.add_argument("--resume", action="store_true", help="Resume from existing audit/raw checkpoint files.")
    parser.add_argument("--retrieved-at", default="", help="ISO timestamp recorded in raw provenance rows.")
    args = parser.parse_args()

    if yf is None or pd is None:
        raise SystemExit("pandas and yfinance are required. Install with: pip install pandas yfinance")

    as_of = datetime.strptime(args.as_of, "%Y-%m-%d").date()
    start_date = date(as_of.year - args.years, as_of.month, as_of.day).isoformat()
    end_date = as_of.isoformat()
    source_tag = f"yfinance_close_price_{as_of.strftime('%Y%m%d')}"
    retrieved_at = args.retrieved_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    rows = read_csv(Path(args.input))
    all_candidates = unique_us_candidates(rows)
    selected = all_candidates[args.start : args.start + args.limit]

    print(f"Total US candidates: {len(all_candidates)}", flush=True)
    print(f"Processing chunk: start={args.start}, limit={args.limit}, selected={len(selected)}", flush=True)
    print(f"Date range: {start_date} to {end_date}, benchmark={BENCHMARK_TICKER}", flush=True)

    benchmark_close = download_close(BENCHMARK_TICKER, start=start_date, end=end_date)
    if benchmark_close is None or benchmark_close.empty:
        raise SystemExit("Unable to download benchmark close series for SPY")

    out_runtime = Path(args.out_runtime)
    out_audit = Path(args.out_audit)
    out_summary = Path(args.out_summary)
    out_raw = Path(args.out_raw) if args.out_raw else None
    results: list[PriceMetricsResult] = []
    raw_rows: list[dict[str, str]] = []
    if args.resume and out_raw is not None and out_audit.exists() != out_raw.exists():
        raise SystemExit("Resume requires matching audit and raw-daily checkpoint files.")
    if args.resume and out_audit.exists():
        for row in read_csv(out_audit):
            results.append(PriceMetricsResult(**{field: row.get(field, "") for field in PriceMetricsResult.__annotations__}))
    if args.resume and out_audit.exists() and out_raw is not None and out_raw.exists():
        raw_rows = read_raw_daily_rows(out_raw)
    result_by_ticker = {item.ticker: item for item in results}
    selected_order = [candidate["ticker"] for candidate in selected]

    for offset, candidate in enumerate(selected, start=1):
        absolute_index = args.start + offset - 1
        ticker = candidate.get("ticker", "")
        symbol = candidate.get("yfSymbol", "")
        if ticker in result_by_ticker:
            print(f"[{offset}/{len(selected)} | global {absolute_index}] {ticker} checkpoint hit", flush=True)
            continue
        print(f"[{offset}/{len(selected)} | global {absolute_index}] {ticker} -> {symbol}", flush=True)
        result, asset_raw_rows = build_result(
            candidate,
            source_tag,
            start_date,
            end_date,
            benchmark_close,
            args.sleep,
            retrieved_at,
        )
        results.append(result)
        result_by_ticker[result.ticker] = result
        raw_rows.extend(asset_raw_rows)
        if args.checkpoint_every and offset % args.checkpoint_every == 0:
            ordered_results = [result_by_ticker[ticker] for ticker in selected_order if ticker in result_by_ticker]
            summary = build_summary(ordered_results, args.start, args.limit, len(all_candidates), as_of, raw_rows)
            save_outputs(ordered_results, out_runtime, out_audit, out_summary, summary, out_raw=out_raw, raw_rows=raw_rows)
            print(f"Checkpoint saved: {offset} rows", flush=True)

    ordered_results = [result_by_ticker[ticker] for ticker in selected_order if ticker in result_by_ticker]
    summary = build_summary(ordered_results, args.start, args.limit, len(all_candidates), as_of, raw_rows)
    save_outputs(ordered_results, out_runtime, out_audit, out_summary, summary, out_raw=out_raw, raw_rows=raw_rows)
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted by user. Checkpoint files may contain partial results.", file=sys.stderr, flush=True)
        raise
