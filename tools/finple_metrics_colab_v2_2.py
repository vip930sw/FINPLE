"""
FINPLE Metrics Colab v2.2

Purpose
- Recalculate candidate metrics with safer validation.
- Keep price CAGR separate from total-return CAGR.
- Do not blindly import KR CAGR when the value conflicts with benchmark/peer checks.
- Treat old-listed KR ETFs with short fetched history as data-source or ticker-mapping issues, not as simple listing-age issues.
- Attach a concrete fallback candidate and review action whenever cagrStatus becomes review_required.
- Prepare manual override hooks for KR dividend yield.

Recommended Colab install cell
    !pip -q install yfinance finance-datareader pandas numpy openpyxl tqdm

Input files
- finple_candidates_v1.csv or .xlsx
- Optional: kr_dividend_yield_override.csv

Expected candidate columns
- ticker, nameKr, market, quoteCurrency, assetType, strategy, riskLevel, tags
- Optional listing date columns: listingDate, listedDate, 상장일, 상장일자, ipoDate

Main output files
- finple_metrics_output_v2_2.csv
- finple_app_csv_export_v2_2.csv
- finple_review_required_v2_2.csv
"""

from __future__ import annotations

import math
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd

try:
    import yfinance as yf
except Exception:  # pragma: no cover - Colab dependency
    yf = None

try:
    import FinanceDataReader as fdr
except Exception:  # pragma: no cover - Colab dependency
    fdr = None

AS_OF_DATE = pd.Timestamp.today().normalize()
LOOKBACK_YEARS = 10
MIN_DATA_YEARS_FOR_CAGR = 7.0
MIN_DATA_YEARS_FOR_APP_CAGR = 9.5
SHORT_HISTORY_YEARS = 5.0
OLD_LISTING_BUFFER_DAYS = 180
PEER_GAP_LIMIT_PP = 6.0
BENCHMARK_GAP_LIMIT_PP = 7.5
KOSPI200_CAGR_SOFT_CAP = 15.0

US_BETA_BENCHMARK = "SPY"
KR_BETA_BENCHMARK = "KS200"

KR_MARKET_SUFFIX_RE = re.compile(r"^\d{6}[A-Z]?$")
LISTING_DATE_COLUMNS = ["listingDate", "listedDate", "listDate", "상장일", "상장일자", "ipoDate", "IPO Date"]

BENCHMARK_ALIASES = {
    "KOSPI200": ["KOSPI200", "KS200", "코스피200", "국내지수", "코스피"],
    "KOSDAQ150": ["KOSDAQ150", "코스닥150", "코스닥"],
    "S&P500_USD": ["S&P500", "S&P 500", "미국S&P500", "S&P500"],
    "NASDAQ100_USD": ["NASDAQ100", "나스닥100", "미국나스닥100"],
}

BENCHMARK_TICKERS = {
    # FinanceDataReader index symbols can differ by environment.
    # The script tries these in order and uses the first valid one.
    "KOSPI200": ["KS200", "KOSPI200"],
    "KOSDAQ150": ["KQ150", "KOSDAQ150"],
    # US ETF proxies.
    "S&P500_USD": ["SPY"],
    "NASDAQ100_USD": ["QQQ"],
}


def norm_str(value) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return str(value).strip()


def norm_ticker(value) -> str:
    return norm_str(value).upper().replace(".KS", "").replace(".KQ", "")


def is_kr_ticker(ticker: str, market: str = "") -> bool:
    return norm_str(market).upper() == "KR" or bool(KR_MARKET_SUFFIX_RE.match(norm_ticker(ticker)))


def parse_listing_date(row: pd.Series) -> pd.Timestamp:
    for col in LISTING_DATE_COLUMNS:
        if col in row.index and norm_str(row.get(col)):
            value = norm_str(row.get(col))
            parsed = pd.to_datetime(value, errors="coerce")
            if pd.notna(parsed):
                return parsed.normalize()
    return pd.NaT


def is_old_listing(listing_date: pd.Timestamp, as_of: pd.Timestamp = AS_OF_DATE) -> bool:
    if pd.isna(listing_date):
        return False
    cutoff = as_of - pd.DateOffset(years=LOOKBACK_YEARS) - pd.Timedelta(days=OLD_LISTING_BUFFER_DAYS)
    return listing_date <= cutoff


def split_tags(row: pd.Series) -> str:
    values = []
    for col in ["tags", "goals", "strategy", "nameKr"]:
        values.append(norm_str(row.get(col)))
    return "|".join(values).lower().replace(" ", "")


def infer_benchmark_key(row: pd.Series) -> str:
    text = split_tags(row)
    for key, aliases in BENCHMARK_ALIASES.items():
        if any(alias.lower().replace(" ", "") in text for alias in aliases):
            return key
    if is_kr_ticker(row.get("ticker"), row.get("market")):
        return "KOSPI200"
    return "S&P500_USD"


def read_candidates(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    if path.suffix.lower() in [".xlsx", ".xls"]:
        df = pd.read_excel(path, sheet_name=0)
    else:
        df = pd.read_csv(path, dtype={"ticker": str}, encoding="utf-8-sig")
    df.columns = [norm_str(c).replace("\ufeff", "") for c in df.columns]
    df["ticker"] = df["ticker"].map(norm_ticker)
    return df


def clean_price_frame(df: pd.DataFrame) -> pd.DataFrame:
    if df is None or len(df) == 0:
        return pd.DataFrame(columns=["date", "close", "adjustedClose"])
    out = df.copy()
    if isinstance(out.index, pd.DatetimeIndex):
        out = out.reset_index().rename(columns={"Date": "date", "index": "date"})
    out.columns = [str(c).strip() for c in out.columns]
    date_col = "date" if "date" in out.columns else out.columns[0]
    out["date"] = pd.to_datetime(out[date_col], errors="coerce")
    close_col = "Close" if "Close" in out.columns else "close" if "close" in out.columns else None
    adj_col = "Adj Close" if "Adj Close" in out.columns else "adjustedClose" if "adjustedClose" in out.columns else None
    if close_col is None:
        return pd.DataFrame(columns=["date", "close", "adjustedClose"])
    out["close"] = pd.to_numeric(out[close_col], errors="coerce")
    out["adjustedClose"] = pd.to_numeric(out[adj_col], errors="coerce") if adj_col else out["close"]
    out = out[["date", "close", "adjustedClose"]].dropna(subset=["date", "close"])
    out = out.sort_values("date").drop_duplicates("date")
    return out


def download_us_history(ticker: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    if yf is None:
        raise RuntimeError("yfinance is not installed")
    raw = yf.download(
        ticker,
        start=start.strftime("%Y-%m-%d"),
        end=(end + timedelta(days=1)).strftime("%Y-%m-%d"),
        auto_adjust=False,
        actions=True,
        progress=False,
        threads=True,
    )
    return clean_price_frame(raw)


def download_kr_history(ticker: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    if fdr is None:
        raise RuntimeError("finance-datareader is not installed")
    raw = fdr.DataReader(norm_ticker(ticker), start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    return clean_price_frame(raw)


def download_history(row: pd.Series, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    ticker = norm_ticker(row.get("ticker"))
    market = norm_str(row.get("market")).upper()
    if is_kr_ticker(ticker, market):
        return download_kr_history(ticker, start, end)
    return download_us_history(ticker, start, end)


def closest_window(df: pd.DataFrame, years: int = LOOKBACK_YEARS, as_of: pd.Timestamp = AS_OF_DATE) -> pd.DataFrame:
    if df.empty:
        return df
    start_cutoff = as_of - pd.DateOffset(years=years)
    return df[(df["date"] >= start_cutoff) & (df["date"] <= as_of)].copy()


def calc_years(start_date: pd.Timestamp, end_date: pd.Timestamp) -> float:
    if pd.isna(start_date) or pd.isna(end_date):
        return 0.0
    return max(0.0, (end_date - start_date).days / 365.25)


def calc_cagr(series: pd.Series, dates: pd.Series) -> Optional[float]:
    values = pd.to_numeric(series, errors="coerce").dropna()
    if len(values) < 2:
        return None
    first_idx = values.index[0]
    last_idx = values.index[-1]
    start_value = float(values.loc[first_idx])
    end_value = float(values.loc[last_idx])
    if start_value <= 0 or end_value <= 0:
        return None
    years = calc_years(pd.to_datetime(dates.loc[first_idx]), pd.to_datetime(dates.loc[last_idx]))
    if years <= 0:
        return None
    return ((end_value / start_value) ** (1 / years) - 1) * 100


def calc_mdd(series: pd.Series) -> Optional[float]:
    values = pd.to_numeric(series, errors="coerce").dropna()
    if len(values) < 2:
        return None
    running_peak = values.cummax()
    drawdown = values / running_peak - 1
    return float(drawdown.min() * 100)


def monthly_returns(df: pd.DataFrame, price_col: str = "close") -> pd.Series:
    if df.empty:
        return pd.Series(dtype=float)
    temp = df.set_index("date").sort_index()[price_col].astype(float)
    monthly = temp.resample("M").last().pct_change().dropna()
    monthly.name = "return"
    return monthly


def calc_beta(asset_df: pd.DataFrame, benchmark_df: pd.DataFrame) -> Optional[float]:
    ar = monthly_returns(asset_df, "close")
    br = monthly_returns(benchmark_df, "close")
    joined = pd.concat([ar.rename("asset"), br.rename("benchmark")], axis=1).dropna()
    if len(joined) < 12:
        return None
    variance = joined["benchmark"].var()
    if variance == 0 or pd.isna(variance):
        return None
    return float(joined[["asset", "benchmark"]].cov().loc["asset", "benchmark"] / variance)


def download_benchmark(key: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
    tickers = BENCHMARK_TICKERS.get(key, [US_BETA_BENCHMARK])
    for ticker in tickers:
        try:
            if key in ["KOSPI200", "KOSDAQ150"]:
                df = download_kr_history(ticker, start, end)
            else:
                df = download_us_history(ticker, start, end)
            if len(df) > 100:
                return df
        except Exception:
            continue
    return pd.DataFrame(columns=["date", "close", "adjustedClose"])


def classify_history_status(data_years: float, old_listing: bool = False) -> str:
    if data_years < 3:
        return "insufficient_history"
    if data_years < SHORT_HISTORY_YEARS:
        return "source_history_gap_old_listing" if old_listing else "short_history_under_5y"
    if data_years < MIN_DATA_YEARS_FOR_APP_CAGR:
        return "source_history_gap_old_listing" if old_listing else "short_history_under_10y"
    return "ok"


def build_peer_groups(metrics: pd.DataFrame) -> pd.DataFrame:
    out = metrics.copy()
    group_cols = ["market", "assetType", "benchmarkKey", "strategy"]
    out["peerMedianCagr10y"] = out.groupby(group_cols)["priceCagr10y"].transform("median")
    out["peerMedianMdd10y"] = out.groupby(group_cols)["mdd10y"].transform("median")
    return out


def pick_cagr_alternative(row: pd.Series) -> Tuple[Optional[float], str, str]:
    benchmark_cagr = row.get("benchmarkCagr10y")
    peer_median = row.get("peerMedianCagr10y")
    benchmark_key = norm_str(row.get("benchmarkKey"))

    if pd.notna(benchmark_cagr):
        return round(float(benchmark_cagr), 2), "benchmarkCagr10y", f"동일 기간 {benchmark_key} 벤치마크 CAGR 대체 검토"
    if pd.notna(peer_median):
        return round(float(peer_median), 2), "peerMedianCagr10y", "동종 ETF peer median CAGR 대체 검토"
    return None, "manual_review", "가격 데이터 원천, 티커 매핑, 상장일, 액면분할/분배금 조정 여부 수동 확인"


def build_review_action(row: pd.Series, reasons: list[str], alternative_source: str) -> str:
    benchmark_key = norm_str(row.get("benchmarkKey"))
    old_listing = bool(row.get("oldListingFor10y"))
    actions: list[str] = []

    if old_listing and "source_history_gap_despite_old_listing" in reasons:
        actions.append("상장일은 10년 이상으로 보이므로 상장기간 부족이 아니라 데이터 소스/티커 매핑 오류 가능성을 먼저 확인")
    if "kospi200_cagr_soft_cap_exceeded" in reasons:
        actions.append("KOSPI200 계열 ETF는 20%대 CAGR을 그대로 쓰지 말고 동일 기간 KOSPI200 벤치마크 CAGR 또는 peer median으로 대체 검토")
    if "benchmark_gap_exceeded" in reasons:
        actions.append("벤치마크 대비 괴리가 커서 가격 기준, 수정주가, 분배금 조정, 액면분할 반영 여부 확인")
    if "peer_gap_exceeded" in reasons:
        actions.append("동종 ETF 중앙값과 괴리가 커서 동일지수 추종 ETF와 비교 검증")
    if benchmark_key in ["S&P500_USD", "NASDAQ100_USD"] and norm_str(row.get("market")).upper() == "KR":
        actions.append("국내상장 해외지수 ETF는 원화 기준/달러 기준/환헤지 여부를 분리하고 원화환산 벤치마크와 비교")

    if alternative_source == "manual_review":
        actions.append("대체값도 불안정하므로 expectedCagr 공란 유지")
    else:
        actions.append(f"대체 후보: {alternative_source} 사용 여부 검토")

    return " / ".join(dict.fromkeys(actions))


def decide_cagr_status(row: pd.Series) -> Tuple[Optional[float], str, str, Optional[float], str, str]:
    cagr = row.get("priceCagr10y")
    data_years = row.get("dataYears", 0)
    market = norm_str(row.get("market")).upper()
    benchmark_key = norm_str(row.get("benchmarkKey"))
    peer_median = row.get("peerMedianCagr10y")
    benchmark_cagr = row.get("benchmarkCagr10y")
    old_listing = bool(row.get("oldListingFor10y"))

    if pd.isna(cagr):
        return None, "pending", "cagr_missing", None, "", "가격 데이터 확보 후 재계산"

    reasons: list[str] = []
    final_cagr = float(cagr)

    if data_years < MIN_DATA_YEARS_FOR_CAGR:
        if old_listing:
            alt, alt_source, alt_action = pick_cagr_alternative(row)
            reasons.append("source_history_gap_despite_old_listing")
            return None, "review_required", ";".join(reasons), alt, alt_source, alt_action
        return None, "hold", "insufficient_history_for_10y_cagr", None, "", "상장/가격 데이터 기간이 짧아 since-inception CAGR로 별도 관리"

    if old_listing and data_years < MIN_DATA_YEARS_FOR_APP_CAGR:
        reasons.append("source_history_gap_despite_old_listing")

    if market == "KR" and benchmark_key == "KOSPI200" and final_cagr > KOSPI200_CAGR_SOFT_CAP:
        reasons.append("kospi200_cagr_soft_cap_exceeded")

    if pd.notna(peer_median) and abs(final_cagr - float(peer_median)) > PEER_GAP_LIMIT_PP:
        reasons.append("peer_gap_exceeded")

    if pd.notna(benchmark_cagr) and abs(final_cagr - float(benchmark_cagr)) > BENCHMARK_GAP_LIMIT_PP:
        reasons.append("benchmark_gap_exceeded")

    if reasons:
        alternative_cagr, alternative_source, _ = pick_cagr_alternative(row)
        review_action = build_review_action(row, reasons, alternative_source)
        return None, "review_required", ";".join(reasons), alternative_cagr, alternative_source, review_action

    return final_cagr, "ok", "", None, "", ""


def load_dividend_override(path: Optional[str | Path]) -> pd.DataFrame:
    if not path:
        return pd.DataFrame(columns=["ticker", "dividendYield", "yieldStatus", "yieldSource"])
    p = Path(path)
    if not p.exists():
        return pd.DataFrame(columns=["ticker", "dividendYield", "yieldStatus", "yieldSource"])
    df = pd.read_csv(p, dtype={"ticker": str}, encoding="utf-8-sig")
    df["ticker"] = df["ticker"].map(norm_ticker)
    if "yieldStatus" not in df.columns:
        df["yieldStatus"] = "manual"
    if "yieldSource" not in df.columns:
        df["yieldSource"] = "manual_override"
    return df[["ticker", "dividendYield", "yieldStatus", "yieldSource"]]


def fetch_us_ttm_dividend_yield(ticker: str, latest_close: Optional[float]) -> Optional[float]:
    if yf is None or latest_close is None or latest_close <= 0:
        return None
    try:
        stock = yf.Ticker(ticker)
        dividends = stock.dividends
        if dividends is None or len(dividends) == 0:
            return 0.0
        cutoff = pd.Timestamp.today(tz=dividends.index.tz) - pd.DateOffset(months=12)
        ttm = dividends[dividends.index >= cutoff].sum()
        return float(ttm / latest_close * 100)
    except Exception:
        return None


def calculate_metrics(candidates: pd.DataFrame, dividend_override_path: Optional[str | Path] = None) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    start = AS_OF_DATE - pd.DateOffset(years=LOOKBACK_YEARS + 1)
    end = AS_OF_DATE
    histories: Dict[str, pd.DataFrame] = {}
    benchmark_histories: Dict[str, pd.DataFrame] = {}
    rows = []

    for _, row in candidates.iterrows():
        ticker = norm_ticker(row.get("ticker"))
        market = norm_str(row.get("market")).upper() or ("KR" if is_kr_ticker(ticker) else "US")
        benchmark_key = infer_benchmark_key(row)
        listing_date = parse_listing_date(row)
        old_listing = is_old_listing(listing_date, end)
        try:
            hist = download_history(row, start, end)
            win = closest_window(hist, LOOKBACK_YEARS, end)
        except Exception as exc:
            rows.append({
                **row.to_dict(),
                "ticker": ticker,
                "market": market,
                "benchmarkKey": benchmark_key,
                "listingDate": listing_date.date().isoformat() if pd.notna(listing_date) else "",
                "oldListingFor10y": old_listing,
                "dataStatus": "download_error",
                "reviewReason": str(exc),
                "reviewAction": "가격 데이터 다운로드 실패: 데이터 소스, 티커 매핑, 거래소 구분 확인",
            })
            continue

        histories[ticker] = win
        first_date = win["date"].min() if not win.empty else pd.NaT
        last_date = win["date"].max() if not win.empty else pd.NaT
        data_years = calc_years(first_date, last_date)
        latest_close = float(win["close"].dropna().iloc[-1]) if not win.empty and len(win["close"].dropna()) else None

        if benchmark_key not in benchmark_histories:
            benchmark_histories[benchmark_key] = closest_window(download_benchmark(benchmark_key, start, end), LOOKBACK_YEARS, end)
        benchmark_df = benchmark_histories[benchmark_key]

        price_cagr = calc_cagr(win["close"], win["date"]) if not win.empty else None
        total_return_cagr = calc_cagr(win["adjustedClose"], win["date"]) if not win.empty else None
        mdd = calc_mdd(win["close"]) if not win.empty else None
        beta = calc_beta(win, benchmark_df) if not win.empty and not benchmark_df.empty else None
        benchmark_cagr = calc_cagr(benchmark_df["close"], benchmark_df["date"]) if not benchmark_df.empty else None

        dividend_yield = None
        yield_status = "pending"
        yield_source = ""
        if market == "US":
            dividend_yield = fetch_us_ttm_dividend_yield(ticker, latest_close)
            yield_status = "ok" if dividend_yield is not None else "pending"
            yield_source = "yfinance_ttm" if dividend_yield is not None else ""

        rows.append({
            **row.to_dict(),
            "ticker": ticker,
            "market": market,
            "benchmarkKey": benchmark_key,
            "listingDate": listing_date.date().isoformat() if pd.notna(listing_date) else "",
            "oldListingFor10y": old_listing,
            "effectiveStartDate": first_date.date().isoformat() if pd.notna(first_date) else "",
            "effectiveEndDate": last_date.date().isoformat() if pd.notna(last_date) else "",
            "dataYears": round(data_years, 2),
            "priceCagr10y": None if price_cagr is None else round(price_cagr, 2),
            "totalReturnCagr10y": None if total_return_cagr is None else round(total_return_cagr, 2),
            "benchmarkCagr10y": None if benchmark_cagr is None else round(benchmark_cagr, 2),
            "mdd10y": None if mdd is None else round(mdd, 2),
            "beta10y": None if beta is None else round(beta, 3),
            "dividendYield": None if dividend_yield is None else round(dividend_yield, 2),
            "yieldStatus": yield_status,
            "yieldSource": yield_source,
            "dataStatus": classify_history_status(data_years, old_listing),
            "reviewReason": "",
            "reviewAction": "",
            "cagrAlternativeValue": None,
            "cagrAlternativeSource": "",
        })
        time.sleep(0.05)

    metrics = pd.DataFrame(rows)
    metrics = build_peer_groups(metrics)

    decisions = metrics.apply(decide_cagr_status, axis=1, result_type="expand")
    metrics["expectedCagr"] = decisions[0]
    metrics["cagrStatus"] = decisions[1]
    metrics["reviewReason"] = metrics["reviewReason"].fillna("") + decisions[2].fillna("").map(lambda x: f";{x}" if x else "")
    metrics["reviewReason"] = metrics["reviewReason"].str.strip(";")
    metrics["cagrAlternativeValue"] = decisions[3]
    metrics["cagrAlternativeSource"] = decisions[4]
    metrics["reviewAction"] = decisions[5]

    override = load_dividend_override(dividend_override_path)
    if not override.empty:
        metrics = metrics.merge(override, on="ticker", how="left", suffixes=("", "_override"))
        has_override = metrics["dividendYield_override"].notna()
        metrics.loc[has_override, "dividendYield"] = pd.to_numeric(metrics.loc[has_override, "dividendYield_override"], errors="coerce")
        metrics.loc[has_override, "yieldStatus"] = metrics.loc[has_override, "yieldStatus_override"].fillna("manual")
        metrics.loc[has_override, "yieldSource"] = metrics.loc[has_override, "yieldSource_override"].fillna("manual_override")
        metrics = metrics.drop(columns=[c for c in metrics.columns if c.endswith("_override")])

    app = metrics.copy()
    app["expectedCagr"] = app["expectedCagr"].round(2)
    app["beta"] = app["beta10y"].round(3)
    app["mdd"] = app["mdd10y"].round(2)
    app["notes"] = app.apply(
        lambda r: "; ".join(filter(None, [
            norm_str(r.get("notes")),
            f"listingDate {r.get('listingDate')}" if norm_str(r.get("listingDate")) else "",
            f"dataYears {r.get('dataYears')}",
            f"cagrStatus {r.get('cagrStatus')}",
            f"yieldStatus {r.get('yieldStatus')}",
            f"altCagr {r.get('cagrAlternativeValue')} from {r.get('cagrAlternativeSource')}" if pd.notna(r.get("cagrAlternativeValue")) else "",
            f"review {r.get('reviewReason')}" if norm_str(r.get("reviewReason")) else "",
        ])),
        axis=1,
    )

    base_cols = ["ticker", "nameKr", "market", "currency", "quoteCurrency", "assetType", "strategy", "riskLevel", "expectedCagr", "beta", "mdd", "dividendYield", "goals", "beginnerFit", "tags", "notes"]
    for col in base_cols:
        if col not in app.columns:
            app[col] = ""
    app_export = app[base_cols]

    review = metrics[
        (metrics["cagrStatus"] == "review_required")
        | (metrics["dataStatus"].isin(["download_error", "insufficient_history", "source_history_gap_old_listing"]))
        | (metrics["yieldStatus"] == "pending")
    ].copy()
    return metrics, app_export, review


def save_outputs(metrics: pd.DataFrame, app_export: pd.DataFrame, review: pd.DataFrame, output_dir: str | Path = ".") -> None:
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    metrics.to_csv(out / "finple_metrics_output_v2_2.csv", index=False, encoding="utf-8-sig")
    app_export.to_csv(out / "finple_app_csv_export_v2_2.csv", index=False, encoding="utf-8-sig")
    review.to_csv(out / "finple_review_required_v2_2.csv", index=False, encoding="utf-8-sig")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("candidates", help="candidate csv/xlsx path")
    parser.add_argument("--dividend-override", default=None, help="optional KR dividend yield override csv")
    parser.add_argument("--output-dir", default=".")
    args = parser.parse_args()

    candidates_df = read_candidates(args.candidates)
    metrics_df, app_export_df, review_df = calculate_metrics(candidates_df, args.dividend_override)
    save_outputs(metrics_df, app_export_df, review_df, args.output_dir)
    print("Saved finple_metrics_output_v2_2.csv")
    print("Saved finple_app_csv_export_v2_2.csv")
    print("Saved finple_review_required_v2_2.csv")
