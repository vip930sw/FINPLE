from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
import math
import re
import statistics
from typing import Any, Mapping, Sequence


LEVERAGED_POLICY_VERSION = "leveraged-inverse-review-policy-v1-step114"
GAPPED_HISTORY_POLICY_VERSION = "initial-history-gap-review-policy-v1-step114"

APPROVABLE_THRESHOLD_REASONS = frozenset(
    {
        "selectedCagr outside automatic publish threshold",
        "selectedMdd outside automatic publish threshold",
        "selectedBeta outside automatic publish threshold",
    }
)
PRODUCT_EXPOSURE_TYPES = frozenset({"leveraged_etf", "inverse_etf"})
PRODUCT_DIRECTIONS = frozenset({"long", "inverse"})
GAP_REVIEW_PATTERN = re.compile(
    r"has \d+ missing calendar month\(s\).*no forward fill is applied.*crossing a gap are excluded",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ReviewApprovalDecision:
    applicable: bool
    approved: bool
    status: str
    policyVersion: str
    approvalReason: str
    reasonCodes: tuple[str, ...]
    audit: Mapping[str, Any]

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["reasonCodes"] = list(self.reasonCodes)
        payload["audit"] = dict(self.audit)
        return payload


def evaluate_review_approval(
    metric_row: Mapping[str, Any],
    monthly_rows: Sequence[Sequence[Any]],
    benchmark_rows: Sequence[Sequence[Any]],
    product_metadata: Mapping[str, Any] | None = None,
) -> ReviewApprovalDecision:
    if product_metadata is not None:
        return evaluate_leveraged_inverse_review(
            metric_row,
            monthly_rows,
            benchmark_rows,
            product_metadata,
        )
    if _is_gap_review(metric_row):
        return evaluate_initial_history_gap_review(
            metric_row,
            monthly_rows,
            benchmark_rows,
        )
    return ReviewApprovalDecision(
        applicable=False,
        approved=False,
        status="not_applicable",
        policyVersion="",
        approvalReason="",
        reasonCodes=(),
        audit={},
    )


def evaluate_leveraged_inverse_review(
    metric_row: Mapping[str, Any],
    monthly_rows: Sequence[Sequence[Any]],
    benchmark_rows: Sequence[Sequence[Any]],
    product_metadata: Mapping[str, Any],
) -> ReviewApprovalDecision:
    reasons: list[str] = []
    exposure_type = _text(product_metadata.get("exposureType"))
    direction = _text(product_metadata.get("direction"))
    reset_frequency = _text(product_metadata.get("resetFrequency"))
    leverage_multiple = _finite(product_metadata.get("leverageMultiple"))
    selected_cagr = _finite(metric_row.get("selectedCagr"))
    selected_beta = _finite(metric_row.get("selectedBeta"))
    selected_mdd = _finite(metric_row.get("selectedMdd"))
    rolling_window_count = _integer(metric_row.get("validRollingWindowCount10y"))
    calculated_cagrs = _rolling_cagrs(monthly_rows, 120)
    calculated_beta = _beta(monthly_rows, benchmark_rows)
    review_reasons = _review_reason_parts(metric_row.get("reviewReason"))

    if _text(product_metadata.get("assetType")).upper() != "ETF":
        reasons.append("invalid_metadata:asset_type")
    if exposure_type not in PRODUCT_EXPOSURE_TYPES:
        reasons.append("unsupported_product_policy:exposure_type")
    if direction not in PRODUCT_DIRECTIONS:
        reasons.append("invalid_metadata:direction")
    if reset_frequency != "daily":
        reasons.append("invalid_metadata:reset_frequency")
    if leverage_multiple is None or not 1.25 <= leverage_multiple <= 4:
        reasons.append("invalid_metadata:leverage_multiple")
    if exposure_type == "inverse_etf" and direction != "inverse":
        reasons.append("invalid_metadata:inverse_direction")
    if exposure_type == "leveraged_etf" and direction != "long":
        reasons.append("invalid_metadata:leveraged_direction")
    for field in ("underlyingTicker", "officialSourceUrl", "sourceId", "inceptionDate"):
        if not _text(product_metadata.get(field)):
            reasons.append(f"invalid_metadata:{field}")

    if _text(metric_row.get("rawPriceCoverageStatus")) != "covered":
        reasons.append("price_coverage_not_approved")
    if _text(metric_row.get("dataStatus")) != "ready":
        reasons.append("unsupported_metric_status:data_status")
    if _text(metric_row.get("cagrPolicy")) != "rolling_10y_median":
        reasons.append("unsupported_metric_status:cagr_policy")
    if rolling_window_count is None or rolling_window_count < 60:
        reasons.append("insufficient_history:rolling_windows")
    if len(monthly_rows) < 120:
        reasons.append("insufficient_history:monthly_returns")
    if _has_non_observed_rows(monthly_rows):
        reasons.append("unsupported_product_policy:imputed_monthly_return")
    if _month_gaps(monthly_rows):
        reasons.append("unsupported_product_policy:monthly_gap")
    if not _listing_period_is_sufficient(product_metadata, metric_row, 120):
        reasons.append("insufficient_history:listing_period")

    reasons.extend(_metric_range_reasons(selected_cagr, selected_beta, selected_mdd))
    if leverage_multiple is not None and selected_beta is not None:
        expected_sign = -1 if direction == "inverse" else 1
        if selected_beta * expected_sign <= 0:
            reasons.append("inconsistent_metric:beta_direction")
        beta_ratio = abs(selected_beta) / leverage_multiple
        if not 0.45 <= beta_ratio <= 1.75:
            reasons.append("inconsistent_metric:beta_multiple")

    reproduced_cagr = statistics.median(calculated_cagrs) if calculated_cagrs else None
    if rolling_window_count is not None and rolling_window_count != len(calculated_cagrs):
        reasons.append("inconsistent_metric:rolling_window_count")
    if not _close(selected_cagr, reproduced_cagr, 0.011):
        reasons.append("inconsistent_metric:selected_cagr")
    if not _close(selected_beta, calculated_beta, 0.00011):
        reasons.append("inconsistent_metric:selected_beta")

    disallowed_review_reasons = sorted(set(review_reasons) - APPROVABLE_THRESHOLD_REASONS)
    if disallowed_review_reasons:
        reasons.append("manual_review_required:reason_outside_product_policy")

    reasons = _unique(reasons)
    approved = not reasons
    audit = {
        "assetType": _text(product_metadata.get("assetType")),
        "exposureType": exposure_type,
        "leverageMultiple": leverage_multiple,
        "direction": direction,
        "resetFrequency": reset_frequency,
        "underlyingTicker": _text(product_metadata.get("underlyingTicker")),
        "inceptionDate": _text(product_metadata.get("inceptionDate")),
        "officialSourceUrl": _text(product_metadata.get("officialSourceUrl")),
        "sourceId": _text(product_metadata.get("sourceId")),
        "sourceCheckedAt": _text(product_metadata.get("sourceCheckedAt")),
        "monthlyReturnCount": len(monthly_rows),
        "validRollingWindowCount10y": len(calculated_cagrs),
        "reproducedCagr": _rounded(reproduced_cagr, 6),
        "reproducedBeta": _rounded(calculated_beta, 6),
        "highMetricExplanation": (
            "daily_reset_geared_product_characteristic" if approved else ""
        ),
        "sourceLineage": {
            "identity": _text(metric_row.get("identity")),
            "sourceHash": _text(metric_row.get("sourceHash")),
            "normalizedSeriesHash": _text(metric_row.get("normalizedSeriesHash")),
            "rawSourceSha256": _text(metric_row.get("rawSourceSha256")),
        },
    }
    return ReviewApprovalDecision(
        applicable=True,
        approved=approved,
        status="ready" if approved else _status_for_reasons(reasons),
        policyVersion=LEVERAGED_POLICY_VERSION,
        approvalReason=(
            "daily_reset_geared_metrics_reproduced_and_coherent" if approved else ""
        ),
        reasonCodes=tuple(reasons),
        audit=audit,
    )


def evaluate_initial_history_gap_review(
    metric_row: Mapping[str, Any],
    monthly_rows: Sequence[Sequence[Any]],
    benchmark_rows: Sequence[Sequence[Any]],
) -> ReviewApprovalDecision:
    reasons: list[str] = []
    gaps = _month_gaps(monthly_rows)
    selected_cagr = _finite(metric_row.get("selectedCagr"))
    selected_beta = _finite(metric_row.get("selectedBeta"))
    selected_mdd = _finite(metric_row.get("selectedMdd"))
    declared_window_count = _integer(metric_row.get("validRollingWindowCount10y"))
    calculated_cagrs = _rolling_cagrs(monthly_rows, 120)
    calculated_beta = _beta(monthly_rows, benchmark_rows)
    reported_gap = _reported_gap_metadata(metric_row.get("reviewReason"))

    if len(gaps) != 1:
        reasons.append("unsupported_product_policy:gap_count")
        gap = None
    else:
        gap = gaps[0]
    prefix_count = gap["beforeIndex"] + 1 if gap else len(monthly_rows)
    tail_start_index = gap["beforeIndex"] + 1 if gap else 0
    tail_rows = list(monthly_rows[tail_start_index:])
    gap_month_count = gap["missingMonthCount"] if gap else 0

    if gap and prefix_count > 12:
        reasons.append("unsupported_product_policy:mid_history_gap")
    if gap and gap_month_count > 36:
        reasons.append("unsupported_product_policy:initial_gap_too_large")
    if len(tail_rows) < 180:
        reasons.append("insufficient_history:continuous_post_gap_months")
    if len(tail_rows) < 120:
        reasons.append("insufficient_history:step4_common_months")
    if _has_non_observed_rows(monthly_rows):
        reasons.append("unsupported_product_policy:forward_fill_detected")
    if _month_gaps(tail_rows):
        reasons.append("unsupported_product_policy:post_gap_not_continuous")
    if _text(metric_row.get("rawPriceCoverageStatus")) != "covered":
        reasons.append("price_coverage_not_approved")
    if _text(metric_row.get("cagrPolicy")) != "rolling_10y_median":
        reasons.append("unsupported_metric_status:cagr_policy")
    if declared_window_count is None or declared_window_count < 60:
        reasons.append("insufficient_history:rolling_windows")
    if declared_window_count is not None and declared_window_count != len(calculated_cagrs):
        reasons.append("inconsistent_metric:rolling_window_count")
    reasons.extend(_metric_range_reasons(selected_cagr, selected_beta, selected_mdd))

    reproduced_cagr = statistics.median(calculated_cagrs) if calculated_cagrs else None
    if not _close(selected_cagr, reproduced_cagr, 0.011):
        reasons.append("inconsistent_metric:selected_cagr")
    if not _close(selected_beta, calculated_beta, 0.00011):
        reasons.append("inconsistent_metric:selected_beta")
    p25 = _finite(metric_row.get("rollingCagr10yP25"))
    median = _finite(metric_row.get("rollingCagr10yMedian"))
    p75 = _finite(metric_row.get("rollingCagr10yP75"))
    if None in (p25, median, p75) or not p25 <= median <= p75:
        reasons.append("inconsistent_metric:rolling_percentiles")

    reasons = _unique(reasons)
    approved = not reasons
    audit = {
        "calculationWindowStart": tail_rows[0][0] if tail_rows else "",
        "excludedMonthlyReturnGapStart": gap["start"] if gap else "",
        "excludedMonthlyReturnGapEnd": gap["end"] if gap else "",
        "excludedMonthlyReturnGapCount": gap_month_count,
        "sourceReportedPriceGapStart": reported_gap["start"],
        "sourceReportedPriceGapEnd": reported_gap["end"],
        "sourceReportedPriceGapCount": reported_gap["count"],
        "prefixObservedMonthCount": prefix_count,
        "continuousPostGapMonthCount": len(tail_rows),
        "validRollingWindowCount10y": len(calculated_cagrs),
        "reproducedCagr": _rounded(reproduced_cagr, 6),
        "reproducedBeta": _rounded(calculated_beta, 6),
        "noForwardFillVerified": not _has_non_observed_rows(monthly_rows),
        "windowsCrossingGapExcluded": bool(gap),
        "sourceLineage": {
            "identity": _text(metric_row.get("identity")),
            "sourceHash": _text(metric_row.get("sourceHash")),
            "normalizedSeriesHash": _text(metric_row.get("normalizedSeriesHash")),
            "rawSourceSha256": _text(metric_row.get("rawSourceSha256")),
        },
    }
    return ReviewApprovalDecision(
        applicable=True,
        approved=approved,
        status="ready" if approved else _status_for_reasons(reasons),
        policyVersion=GAPPED_HISTORY_POLICY_VERSION,
        approvalReason=(
            "bounded_initial_gap_with_reproducible_continuous_post_gap_metrics"
            if approved
            else ""
        ),
        reasonCodes=tuple(reasons),
        audit=audit,
    )


def _is_gap_review(metric_row: Mapping[str, Any]) -> bool:
    return bool(GAP_REVIEW_PATTERN.search(_text(metric_row.get("reviewReason"))))


def _review_reason_parts(value: Any) -> set[str]:
    return {part.strip() for part in _text(value).split(";") if part.strip()}


def _reported_gap_metadata(value: Any) -> dict[str, Any]:
    text = _text(value)
    count_match = re.search(r"has (\d+) missing calendar month", text, re.IGNORECASE)
    months = re.findall(r"\b\d{4}-\d{2}\b", text)
    return {
        "start": months[0] if months else "",
        "end": months[-1] if months else "",
        "count": int(count_match.group(1)) if count_match else None,
    }


def _metric_range_reasons(
    selected_cagr: float | None,
    selected_beta: float | None,
    selected_mdd: float | None,
) -> list[str]:
    reasons: list[str] = []
    if selected_cagr is None or not -100 < selected_cagr <= 200:
        reasons.append("inconsistent_metric:cagr_range")
    if selected_beta is None or not -10 <= selected_beta <= 10:
        reasons.append("inconsistent_metric:beta_range")
    if selected_mdd is None or not -100 <= selected_mdd <= 0:
        reasons.append("inconsistent_metric:mdd_range")
    return reasons


def _rolling_cagrs(rows: Sequence[Sequence[Any]], window_months: int) -> list[float]:
    values: list[float] = []
    for start in range(0, len(rows) - window_months + 1):
        window = rows[start : start + window_months]
        if (
            _month_index(window[-1][0]) - _month_index(window[0][0])
            != window_months - 1
        ):
            continue
        growth = 1.0
        valid = True
        for row in window:
            value = _finite(row[1] if len(row) > 1 else None)
            if value is None or value <= -1:
                valid = False
                break
            growth *= 1 + value
        if valid and growth > 0:
            values.append((growth ** (12 / window_months) - 1) * 100)
    return values


def _beta(
    asset_rows: Sequence[Sequence[Any]],
    benchmark_rows: Sequence[Sequence[Any]],
) -> float | None:
    asset = {
        _text(row[0]): _finite(row[1] if len(row) > 1 else None)
        for row in asset_rows
    }
    benchmark = {
        _text(row[0]): _finite(row[1] if len(row) > 1 else None)
        for row in benchmark_rows
    }
    months = sorted(
        month
        for month in set(asset) & set(benchmark)
        if asset[month] is not None and benchmark[month] is not None
    )
    if len(months) < 24:
        return None
    x = [benchmark[month] for month in months]
    y = [asset[month] for month in months]
    x_mean = sum(x) / len(x)
    y_mean = sum(y) / len(y)
    denominator = sum((value - x_mean) ** 2 for value in x)
    if denominator <= 0:
        return None
    return sum((left - x_mean) * (right - y_mean) for left, right in zip(x, y)) / denominator


def _month_gaps(rows: Sequence[Sequence[Any]]) -> list[dict[str, Any]]:
    gaps: list[dict[str, Any]] = []
    for index, (previous, current) in enumerate(zip(rows, rows[1:])):
        previous_index = _month_index(previous[0])
        current_index = _month_index(current[0])
        missing = current_index - previous_index - 1
        if missing <= 0:
            continue
        gaps.append(
            {
                "beforeIndex": index,
                "start": _month_string(previous_index + 1),
                "end": _month_string(current_index - 1),
                "missingMonthCount": missing,
            }
        )
    return gaps


def _has_non_observed_rows(rows: Sequence[Sequence[Any]]) -> bool:
    for row in rows:
        status = _text(row[6] if len(row) > 6 else "").lower()
        if any(token in status for token in ("forward", "fill", "imputed", "proxy")):
            return True
    return False


def _listing_period_is_sufficient(
    product_metadata: Mapping[str, Any],
    metric_row: Mapping[str, Any],
    minimum_months: int,
) -> bool:
    try:
        inception = date.fromisoformat(_text(product_metadata.get("inceptionDate")))
        end = date.fromisoformat(_text(metric_row.get("dataEndDate")))
    except ValueError:
        return False
    return (end.year - inception.year) * 12 + end.month - inception.month >= minimum_months


def _month_index(value: Any) -> int:
    year, month = (int(part) for part in _text(value)[:7].split("-"))
    return year * 12 + month - 1


def _month_string(index: int) -> str:
    year, month_zero = divmod(index, 12)
    return f"{year:04d}-{month_zero + 1:02d}"


def _status_for_reasons(reasons: Sequence[str]) -> str:
    if any(reason.startswith("invalid_metadata:") for reason in reasons):
        return "invalid_metadata"
    if any(reason.startswith("inconsistent_metric:") for reason in reasons):
        return "inconsistent_metric"
    if any(reason.startswith("insufficient_history:") for reason in reasons):
        return "insufficient_history"
    return "review_required"


def _finite(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def _integer(value: Any) -> int | None:
    number = _finite(value)
    if number is None or not number.is_integer():
        return None
    return int(number)


def _close(left: float | None, right: float | None, tolerance: float) -> bool:
    return left is not None and right is not None and abs(left - right) <= tolerance


def _rounded(value: float | None, digits: int) -> float | None:
    return None if value is None else round(value, digits)


def _text(value: Any) -> str:
    return str(value or "").strip()


def _unique(values: Sequence[str]) -> list[str]:
    return list(dict.fromkeys(values))
