from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
import math
import re
import statistics
from typing import Any, Mapping, Sequence
from urllib.parse import urlsplit


LEVERAGED_POLICY_VERSION = "leveraged-inverse-review-policy-v1-step114"
GAPPED_HISTORY_POLICY_VERSION = "initial-history-gap-review-policy-v1-step114"
GAP_RECONCILIATION_MODE = (
    "price_observation_gap_plus_skipped_cross_gap_monthly_return_v1"
)

APPROVABLE_THRESHOLD_REASONS = frozenset(
    {
        "selectedCagr outside automatic publish threshold",
        "selectedMdd outside automatic publish threshold",
        "selectedBeta outside automatic publish threshold",
    }
)
PRODUCT_EXPOSURE_TYPES = frozenset({"leveraged_etf", "inverse_etf"})
PRODUCT_DIRECTIONS = frozenset({"long", "inverse"})
SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")
PROXY_STATUS_MARKER_PATTERN = re.compile(
    r"(?:^|[*:_\-\s])proxy(?:$|[*:_\-\s])",
    re.IGNORECASE,
)
GAP_REVIEW_EXACT_PATTERN = re.compile(
    r"^(?P<identity>(?:US|KR):[0-9A-Z.^-]+) has "
    r"(?P<count>\d+) missing calendar month\(s\) "
    r"\((?P<months>[0-9., -]+)\); "
    r"observed rows are preserved, no forward fill is applied, and "
    r"rolling CAGR/monthly returns crossing a gap are excluded\.$",
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
    if _looks_like_gap_review(metric_row):
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
    reasons.extend(
        _review_state_reasons(
            metric_row,
            required_data_status="ready",
            reason_outside_code="manual_review_required:reason_outside_product_policy",
        )
    )

    metadata_asset_type = _text(product_metadata.get("assetType"))
    metric_asset_type = _text(metric_row.get("assetType"))
    if metadata_asset_type.upper() != "ETF":
        reasons.append("invalid_metadata:asset_type")
    if metric_asset_type.upper() != metadata_asset_type.upper():
        reasons.append("invalid_metadata:metric_asset_type_mismatch")
    if _text(product_metadata.get("identity")).upper() != _text(
        metric_row.get("identity")
    ).upper():
        reasons.append("invalid_metadata:identity_mismatch")
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
    for field in ("underlyingTicker", "sourceId"):
        if not _text(product_metadata.get(field)):
            reasons.append(f"invalid_metadata:{field}")
    if not _valid_https_url(product_metadata.get("officialSourceUrl")):
        reasons.append("invalid_metadata:official_source_url")
    if not _valid_iso_date(product_metadata.get("sourceCheckedAt")):
        reasons.append("invalid_metadata:source_checked_at")
    if not _valid_iso_date(product_metadata.get("inceptionDate")):
        reasons.append("invalid_metadata:inception_date")

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
    reasons.extend(_monthly_proxy_lineage_reasons(monthly_rows))
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
    reasons.extend(_mdd_source_binding_reasons(metric_row))

    disallowed_review_reasons = sorted(set(review_reasons) - APPROVABLE_THRESHOLD_REASONS)
    if review_reasons and disallowed_review_reasons:
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
        "monthlyReturnProxyLineage": _monthly_proxy_lineage_audit(monthly_rows),
        "validRollingWindowCount10y": len(calculated_cagrs),
        "selectedCagr": selected_cagr,
        "reproducedCagr": _rounded(reproduced_cagr, 6),
        "selectedBeta": selected_beta,
        "reproducedBeta": _rounded(calculated_beta, 6),
        "selectedMdd": selected_mdd,
        "mddValidationMethod": "source_overlay_full_period_actual_binding",
        "mddPolicy": _text(metric_row.get("mddPolicy")),
        "highMetricExplanation": (
            "daily_reset_geared_product_characteristic" if approved else ""
        ),
        "sourceLineage": _source_lineage(metric_row),
    }
    return ReviewApprovalDecision(
        applicable=True,
        approved=approved,
        status="ready" if approved else _status_for_reasons(reasons),
        policyVersion=LEVERAGED_POLICY_VERSION,
        approvalReason=(
            "daily_reset_geared_cagr_beta_reproduced_mdd_source_bound"
            if approved
            else ""
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
    expected_return_gap = _expected_monthly_return_gap(reported_gap)
    reasons.extend(
        _review_state_reasons(
            metric_row,
            required_data_status="review_required",
            reason_outside_code="manual_review_required:reason_outside_gap_policy",
        )
    )
    if reported_gap is None:
        reasons.append("manual_review_required:reason_outside_gap_policy")

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
    if reported_gap and reported_gap["count"] > 36:
        reasons.append("unsupported_product_policy:initial_gap_too_large")
    if len(tail_rows) < 180:
        reasons.append("insufficient_history:continuous_post_gap_months")
    if len(tail_rows) < 120:
        reasons.append("insufficient_history:step4_common_months")
    if _has_non_observed_rows(monthly_rows):
        reasons.append("unsupported_product_policy:forward_fill_detected")
    reasons.extend(_monthly_proxy_lineage_reasons(monthly_rows))
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
    reasons.extend(_mdd_source_binding_reasons(metric_row))
    p25 = _finite(metric_row.get("rollingCagr10yP25"))
    median = _finite(metric_row.get("rollingCagr10yMedian"))
    p75 = _finite(metric_row.get("rollingCagr10yP75"))
    if None in (p25, median, p75) or not p25 <= median <= p75:
        reasons.append("inconsistent_metric:rolling_percentiles")
    if gap and (
        reported_gap is None
        or reported_gap["identity"].upper() != _text(metric_row.get("identity")).upper()
        or expected_return_gap is None
        or expected_return_gap["start"] != gap["start"]
        or expected_return_gap["end"] != gap["end"]
        or expected_return_gap["count"] != gap["missingMonthCount"]
    ):
        reasons.append("inconsistent_metric:reported_gap_metadata")

    reasons = _unique(reasons)
    approved = not reasons
    audit = {
        "calculationWindowStart": tail_rows[0][0] if tail_rows else "",
        "excludedMonthlyReturnGapStart": gap["start"] if gap else "",
        "excludedMonthlyReturnGapEnd": gap["end"] if gap else "",
        "excludedMonthlyReturnGapCount": gap_month_count,
        "sourceReportedPriceGapStart": reported_gap["start"] if reported_gap else "",
        "sourceReportedPriceGapEnd": reported_gap["end"] if reported_gap else "",
        "sourceReportedPriceGapCount": reported_gap["count"] if reported_gap else None,
        "expectedMonthlyReturnGapStart": (
            expected_return_gap["start"] if expected_return_gap else ""
        ),
        "expectedMonthlyReturnGapEnd": (
            expected_return_gap["end"] if expected_return_gap else ""
        ),
        "expectedMonthlyReturnGapCount": (
            expected_return_gap["count"] if expected_return_gap else None
        ),
        "actualMonthlyReturnGapStart": gap["start"] if gap else "",
        "actualMonthlyReturnGapEnd": gap["end"] if gap else "",
        "actualMonthlyReturnGapCount": gap_month_count if gap else None,
        "gapReconciliationMode": (
            GAP_RECONCILIATION_MODE
            if expected_return_gap
            else "unavailable_reported_price_gap"
        ),
        "prefixObservedMonthCount": prefix_count,
        "continuousPostGapMonthCount": len(tail_rows),
        "validRollingWindowCount10y": len(calculated_cagrs),
        "selectedCagr": selected_cagr,
        "reproducedCagr": _rounded(reproduced_cagr, 6),
        "selectedBeta": selected_beta,
        "reproducedBeta": _rounded(calculated_beta, 6),
        "selectedMdd": selected_mdd,
        "mddValidationMethod": "source_overlay_full_period_actual_binding",
        "mddPolicy": _text(metric_row.get("mddPolicy")),
        "noForwardFillVerified": not _has_non_observed_rows(monthly_rows),
        "monthlyReturnProxyLineage": _monthly_proxy_lineage_audit(monthly_rows),
        "windowsCrossingGapExcluded": bool(gap),
        "sourceLineage": _source_lineage(metric_row),
    }
    return ReviewApprovalDecision(
        applicable=True,
        approved=approved,
        status="ready" if approved else _status_for_reasons(reasons),
        policyVersion=GAPPED_HISTORY_POLICY_VERSION,
        approvalReason=(
            "bounded_initial_gap_cagr_beta_reproduced_mdd_source_bound"
            if approved
            else ""
        ),
        reasonCodes=tuple(reasons),
        audit=audit,
    )


def _looks_like_gap_review(metric_row: Mapping[str, Any]) -> bool:
    return "missing calendar month(s)" in _text(metric_row.get("reviewReason")).lower()


def _review_reason_parts(value: Any) -> set[str]:
    return {part.strip() for part in _text(value).split(";") if part.strip()}


def _reported_gap_metadata(value: Any) -> dict[str, Any] | None:
    text = _text(value)
    match = GAP_REVIEW_EXACT_PATTERN.fullmatch(text)
    if not match:
        return None
    months = re.findall(r"\b\d{4}-\d{2}\b", match.group("months"))
    if not months or any(not _valid_month_string(month) for month in months):
        return None
    count = int(match.group("count"))
    start_index = _month_index(months[0])
    end_index = _month_index(months[-1])
    if count <= 0 or end_index < start_index or end_index - start_index + 1 != count:
        return None
    return {
        "identity": match.group("identity"),
        "start": months[0],
        "end": months[-1],
        "count": count,
    }


def _expected_monthly_return_gap(
    reported_price_gap: Mapping[str, Any] | None,
) -> dict[str, Any] | None:
    if reported_price_gap is None:
        return None
    return {
        "start": reported_price_gap["start"],
        "end": _month_string(_month_index(reported_price_gap["end"]) + 1),
        "count": reported_price_gap["count"] + 1,
    }


def _review_state_reasons(
    metric_row: Mapping[str, Any],
    *,
    required_data_status: str,
    reason_outside_code: str,
) -> list[str]:
    reasons: list[str] = []
    if _text(metric_row.get("dataStatus")) != required_data_status:
        reasons.append("unsupported_metric_status:data_status")
    if _text(metric_row.get("reviewFlag")) != "review_required":
        reasons.append("unsupported_metric_status:review_flag")
    if not _text(metric_row.get("reviewReason")):
        reasons.append(reason_outside_code)
    return reasons


def _source_lineage(metric_row: Mapping[str, Any]) -> dict[str, str]:
    return {
        "identity": _text(metric_row.get("identity")),
        "sourceHash": _text(metric_row.get("sourceHash")),
        "normalizedSeriesHash": _text(metric_row.get("normalizedSeriesHash")),
        "rawSourceSha256": _text(metric_row.get("rawSourceSha256")),
    }


def _mdd_source_binding_reasons(metric_row: Mapping[str, Any]) -> list[str]:
    reasons: list[str] = []
    if _text(metric_row.get("mddPolicy")) != "full_period_actual":
        reasons.append("unsupported_metric_status:mdd_policy")
    lineage = _source_lineage(metric_row)
    for field in ("sourceHash", "normalizedSeriesHash", "rawSourceSha256"):
        if not SHA256_PATTERN.fullmatch(lineage[field]):
            reasons.append(f"missing_metric_lineage:{field}")
    if (
        SHA256_PATTERN.fullmatch(lineage["sourceHash"])
        and SHA256_PATTERN.fullmatch(lineage["normalizedSeriesHash"])
        and lineage["sourceHash"] != lineage["normalizedSeriesHash"]
    ):
        reasons.append("inconsistent_metric:source_lineage")
    return reasons


def _valid_iso_date(value: Any) -> bool:
    text = _text(value)
    try:
        return date.fromisoformat(text).isoformat() == text
    except ValueError:
        return False


def _valid_https_url(value: Any) -> bool:
    parsed = urlsplit(_text(value))
    return parsed.scheme == "https" and bool(parsed.netloc)


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
        if any(token in status for token in ("forward", "fill", "imputed")):
            return True
    return False


def _monthly_proxy_lineage_reasons(
    rows: Sequence[Sequence[Any]],
) -> list[str]:
    proxy_detected = False
    lineage_missing_or_inconsistent = False
    for row in rows:
        status_value = row[6] if len(row) > 6 else None
        status_is_string = isinstance(status_value, str)
        status_marks_proxy = (
            _status_marks_proxy(status_value) if status_is_string else False
        )
        if len(row) < 9:
            if status_marks_proxy:
                proxy_detected = True
            lineage_missing_or_inconsistent = True
            continue
        is_proxy = row[7]
        proxy_ticker_value = row[8]
        proxy_ticker_is_string = isinstance(proxy_ticker_value, str)
        proxy_ticker = proxy_ticker_value.strip() if proxy_ticker_is_string else ""
        if status_marks_proxy or is_proxy is True or proxy_ticker:
            proxy_detected = True
        if (
            not status_is_string
            or type(is_proxy) is not bool
            or not proxy_ticker_is_string
        ):
            lineage_missing_or_inconsistent = True
        if (is_proxy is True and not proxy_ticker) or (
            is_proxy is False and proxy_ticker
        ):
            lineage_missing_or_inconsistent = True
        if (
            status_marks_proxy
            and is_proxy is False
            and proxy_ticker_is_string
            and not proxy_ticker
        ):
            lineage_missing_or_inconsistent = True
    reasons = []
    if proxy_detected:
        reasons.append("unsupported_product_policy:proxy_monthly_return")
    if lineage_missing_or_inconsistent:
        reasons.append("missing_metric_lineage:monthly_return_proxy_status")
    return reasons


def _monthly_proxy_lineage_audit(
    rows: Sequence[Sequence[Any]],
) -> dict[str, Any]:
    is_proxy_values = set()
    proxy_tickers = set()
    proxy_status_values = set()
    missing_row_count = 0
    invalid_status_type_row_count = 0
    invalid_type_row_count = 0
    proxy_status_marker_count = 0
    status_lineage_contradiction_count = 0
    for row in rows:
        raw_status_value = row[6] if len(row) > 6 else None
        status_is_string = isinstance(raw_status_value, str)
        status_value = _text(raw_status_value) if status_is_string else ""
        status_marks_proxy = (
            _status_marks_proxy(status_value) if status_is_string else False
        )
        if status_marks_proxy:
            proxy_status_marker_count += 1
            proxy_status_values.add(status_value)
        if len(row) < 9:
            missing_row_count += 1
            continue
        if not status_is_string:
            invalid_status_type_row_count += 1
        is_proxy = row[7]
        proxy_ticker_value = row[8]
        if type(is_proxy) is not bool or not isinstance(proxy_ticker_value, str):
            invalid_type_row_count += 1
            continue
        proxy_ticker = proxy_ticker_value.strip()
        is_proxy_values.add(is_proxy)
        proxy_tickers.add(proxy_ticker)
        if status_marks_proxy and is_proxy is False and not proxy_ticker:
            status_lineage_contradiction_count += 1
    return {
        "rowCount": len(rows),
        "isProxyUniqueValues": sorted(
            "missing" if value is None else str(value).lower()
            for value in is_proxy_values
        ),
        "proxyTickerUniqueValues": sorted(proxy_tickers),
        "proxyStatusMarkerCount": proxy_status_marker_count,
        "proxyStatusValues": sorted(proxy_status_values),
        "statusLineageContradictionCount": status_lineage_contradiction_count,
        "missingLineageRowCount": missing_row_count,
        "invalidStatusTypeRowCount": invalid_status_type_row_count,
        "invalidLineageTypeRowCount": invalid_type_row_count,
        "nonProxyProven": (
            bool(rows)
            and missing_row_count == 0
            and invalid_status_type_row_count == 0
            and invalid_type_row_count == 0
            and proxy_status_marker_count == 0
            and status_lineage_contradiction_count == 0
            and is_proxy_values == {False}
            and proxy_tickers == {""}
        ),
    }


def _status_marks_proxy(value: Any) -> bool:
    return bool(PROXY_STATUS_MARKER_PATTERN.search(_text(value)))


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


def _valid_month_string(value: Any) -> bool:
    text = _text(value)
    if not re.fullmatch(r"\d{4}-\d{2}", text):
        return False
    year, month = (int(part) for part in text.split("-"))
    return year >= 1 and 1 <= month <= 12


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
