from __future__ import annotations

import math
import statistics
from calendar import monthrange
from dataclasses import dataclass
from datetime import datetime
from typing import Mapping


ROLLING_METRIC_VERSION = "rolling-price-cagr-v1-step114-2d"
PERCENTILE_METHOD = "linear_interpolation_sorted_values_index_n_minus_1_times_p"
ROLLING_WINDOW_MONTHS = {"10y": 120, "5y": 60}
PRICE_CAGR_ALLOWED_BASES = {"raw_close", "split_adjusted", "split_adjusted_close"}
PRICE_CAGR_BLOCKED_BASES = {"", "ambiguous", "total_return_adjusted", "total_return_index", "split_and_dividend_adjusted"}


@dataclass(frozen=True)
class RollingMetrics:
    rawPriceCagr10y: float | None
    rollingCagr10yMedian: float | None
    rollingCagr10yP25: float | None
    rollingCagr10yP75: float | None
    validRollingWindowCount10y: int
    rollingCagr5yMedian: float | None
    rollingCagr5yP25: float | None
    rollingCagr5yP75: float | None
    validRollingWindowCount5y: int
    sinceInceptionCagr: float | None
    selectedCagr: float | None
    cagrPolicy: str
    dataStatus: str
    reviewFlag: str
    reviewReason: str
    mddFullPeriod: float | None
    priceBasisStatus: str
    percentileOrderingValid: bool


def compute_rolling_price_metrics(rows: list[dict[str, str]], *, min_years_for_inception: float = 3.0) -> RollingMetrics:
    if not rows:
        return _blocked("missing_price_data", "No monthly price rows found.")

    ordered = sorted(rows, key=lambda row: row["month"])
    basis_values = {row.get("priceAdjustmentBasis", "") for row in ordered}
    currencies = {row.get("currency", "") for row in ordered if row.get("currency", "")}
    if len(currencies) > 1:
        return _blocked("currency_mismatch", "Series mixes currencies.")
    if len(basis_values) != 1:
        return _blocked("ambiguous_adjustment_basis", "Series mixes price adjustment bases.")
    basis = next(iter(basis_values))
    if basis in PRICE_CAGR_BLOCKED_BASES or basis not in PRICE_CAGR_ALLOWED_BASES:
        return _blocked("ambiguous_adjustment_basis", f"Price CAGR blocked for adjustment basis: {basis or 'blank'}.")

    month_to_row: dict[str, dict[str, str]] = {}
    prices: list[float] = []
    for row in ordered:
        month_key = row["month"][:7]
        price = _safe_float(row.get("close"))
        if price is None or price <= 0:
            return _blocked("non_positive_selected_price", "Selected price basis contains a non-positive price.")
        if month_key in month_to_row:
            return _blocked("duplicate_market_ticker_month", f"Duplicate month in series: {month_key}.")
        month_to_row[month_key] = row
        prices.append(price)

    data_years = _interval_months(ordered[0]["month"], ordered[-1]["month"]) / 12
    since_inception = _cagr(prices[0], prices[-1], _interval_months(ordered[0]["month"], ordered[-1]["month"]))
    cagr_10y_values = _rolling_cagrs(ordered, 120)
    cagr_5y_values = _rolling_cagrs(ordered, 60)
    raw_10y = cagr_10y_values[-1] if cagr_10y_values else None

    median_10y = percentile(cagr_10y_values, 50)
    p25_10y = percentile(cagr_10y_values, 25)
    p75_10y = percentile(cagr_10y_values, 75)
    median_5y = percentile(cagr_5y_values, 50)
    p25_5y = percentile(cagr_5y_values, 25)
    p75_5y = percentile(cagr_5y_values, 75)

    selected_cagr, cagr_policy, data_status, review_flag, review_reason = _select_cagr(
        median_10y=median_10y,
        median_5y=median_5y,
        since_inception=since_inception,
        data_years=data_years,
        min_years_for_inception=min_years_for_inception,
    )
    percentile_ordering_valid = _ordered(p25_10y, median_10y, p75_10y) and _ordered(p25_5y, median_5y, p75_5y)
    if not percentile_ordering_valid and review_flag == "none":
        review_flag = "review_required"
        review_reason = "Rolling CAGR percentile ordering failed."

    if cagr_policy == "rolling_10y_median" and selected_cagr is not None and p25_10y is not None and p75_10y is not None:
        if selected_cagr < p25_10y or selected_cagr > p75_10y:
            review_flag = "review_required"
            review_reason = "Selected CAGR is outside the active rolling percentile range."

    return RollingMetrics(
        rawPriceCagr10y=raw_10y,
        rollingCagr10yMedian=median_10y,
        rollingCagr10yP25=p25_10y,
        rollingCagr10yP75=p75_10y,
        validRollingWindowCount10y=len(cagr_10y_values),
        rollingCagr5yMedian=median_5y,
        rollingCagr5yP25=p25_5y,
        rollingCagr5yP75=p75_5y,
        validRollingWindowCount5y=len(cagr_5y_values),
        sinceInceptionCagr=since_inception,
        selectedCagr=selected_cagr,
        cagrPolicy=cagr_policy,
        dataStatus=data_status,
        reviewFlag=review_flag,
        reviewReason=review_reason,
        mddFullPeriod=mdd(prices),
        priceBasisStatus=basis,
        percentileOrderingValid=percentile_ordering_valid,
    )


def rolling_cagrs_for_test(rows: list[dict[str, str]], window_months: int) -> list[float]:
    return _rolling_cagrs(sorted(rows, key=lambda row: row["month"]), window_months)


def percentile(values: list[float], percentile_value: int) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * percentile_value / 100
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return ordered[int(index)]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower)


def mdd(prices: list[float]) -> float | None:
    if not prices:
        return None
    peak = prices[0]
    worst = 0.0
    for price in prices:
        peak = max(peak, price)
        worst = min(worst, price / peak - 1)
    return worst * 100


def _rolling_cagrs(rows: list[dict[str, str]], window_months: int) -> list[float]:
    by_month = {row["month"][:7]: row for row in rows}
    month_keys = sorted(by_month)
    values: list[float] = []
    for start_month in month_keys:
        end_month = _add_months(start_month, window_months)
        if end_month not in by_month:
            continue
        expected_months = [_add_months(start_month, offset) for offset in range(window_months + 1)]
        if any(month not in by_month for month in expected_months):
            continue
        start_price = _safe_float(by_month[start_month].get("close"))
        end_price = _safe_float(by_month[end_month].get("close"))
        cagr = _cagr(start_price, end_price, window_months)
        if cagr is not None:
            values.append(cagr)
    return values


def _select_cagr(
    *,
    median_10y: float | None,
    median_5y: float | None,
    since_inception: float | None,
    data_years: float,
    min_years_for_inception: float,
) -> tuple[float | None, str, str, str, str]:
    if median_10y is not None:
        return median_10y, "rolling_10y_median", "ready", "none", ""
    if median_5y is not None:
        return median_5y, "rolling_5y_median", "short_history", "short_history", "Only 5Y rolling price-CAGR windows are available."
    if since_inception is not None and data_years >= min_years_for_inception:
        return since_inception, "since_inception", "limited_history", "review_required", "Only since-inception price CAGR is available."
    return None, "blank_review_required", "insufficient_history", "review_required", "Insufficient valid price history for selected CAGR."


def _blocked(issue_type: str, reason: str) -> RollingMetrics:
    return RollingMetrics(
        rawPriceCagr10y=None,
        rollingCagr10yMedian=None,
        rollingCagr10yP25=None,
        rollingCagr10yP75=None,
        validRollingWindowCount10y=0,
        rollingCagr5yMedian=None,
        rollingCagr5yP25=None,
        rollingCagr5yP75=None,
        validRollingWindowCount5y=0,
        sinceInceptionCagr=None,
        selectedCagr=None,
        cagrPolicy="blank_review_required",
        dataStatus="review_required",
        reviewFlag="review_required",
        reviewReason=f"{issue_type}: {reason}",
        mddFullPeriod=None,
        priceBasisStatus="blocked",
        percentileOrderingValid=False,
    )


def _cagr(start_value: float | None, end_value: float | None, interval_months: int) -> float | None:
    if start_value is None or end_value is None or start_value <= 0 or end_value <= 0 or interval_months <= 0:
        return None
    return ((end_value / start_value) ** (12 / interval_months) - 1) * 100


def _interval_months(start: str, end: str) -> int:
    start_date = _parse_month_end(start)
    end_date = _parse_month_end(end)
    return (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)


def _parse_month_end(value: str):
    parsed = datetime.strptime(value, "%Y-%m-%d").date()
    expected_day = monthrange(parsed.year, parsed.month)[1]
    if parsed.day != expected_day:
        raise ValueError(f"month is not a month-end date: {value}")
    return parsed


def _add_months(month_key: str, offset: int) -> str:
    year, month = (int(part) for part in month_key.split("-"))
    month_index = (year * 12 + month - 1) + offset
    return f"{month_index // 12:04d}-{month_index % 12 + 1:02d}"


def _ordered(p25: float | None, median: float | None, p75: float | None) -> bool:
    if p25 is None and median is None and p75 is None:
        return True
    return p25 is not None and median is not None and p75 is not None and p25 <= median <= p75


def _safe_float(value: str | None) -> float | None:
    try:
        return float(value or "")
    except ValueError:
        return None
