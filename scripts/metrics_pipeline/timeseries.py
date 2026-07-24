from __future__ import annotations

import csv
from calendar import monthrange
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Callable, Iterable, Mapping

from .config import CALCULATION_POLICY_VERSION, PARTIAL_MONTH_POLICY, SCHEMA_VERSION
from .schemas import RAW_DAILY_PRICE_COLUMNS, is_valid_kr_candidate_ticker


NORMALIZATION_VERSION = "timeseries-normalization-v2-step114-2za-dividend"
PRICE_SERIES_CLASSIFICATIONS = {
    "raw_close",
    "split_adjusted",
    "split_and_dividend_adjusted",
    "total_return_adjusted",
    "ambiguous",
}
# This is an intentionally narrow allowlist. All other validation failures
# remain structural/package-global blockers unless an existing policy says otherwise.
SERIES_REVIEW_ISSUE_TYPES = {
    "implausible_split_factor",
    "missing_calendar_month",
}


def normalize_daily_price_rows(
    rows: list[dict[str, str]],
    *,
    source_file_name: str,
    source_sha256: str,
    allow_review_only_provenance: bool = False,
    normalized_data_status: str = "normalized_fixture",
    requested_as_of_included: str = "",
    partial_month_policy: str = PARTIAL_MONTH_POLICY,
) -> dict[str, object]:
    audit_rows: list[dict[str, str]] = []
    normalized_rows: list[dict[str, str]] = []
    actual_last_price_date = _actual_last_price_date(rows)
    partial_metadata = partial_month_metadata(
        requested_as_of_included,
        actual_last_price_date,
        partial_month_policy,
    )

    if not rows:
        audit_rows.append(_audit_row({}, "raw_daily_missing", "critical", True, "No raw daily fixture rows found."))
        return _result(normalized_rows, audit_rows, source_file_name, source_sha256, [], partial_metadata)

    missing_columns = sorted(set(RAW_DAILY_PRICE_COLUMNS).difference(rows[0]))
    if missing_columns:
        audit_rows.append(
            _audit_row(
                {},
                "raw_daily_schema_missing_columns",
                "critical",
                True,
                f"Missing required raw daily columns: {', '.join(missing_columns)}.",
            )
        )
        return _result(normalized_rows, audit_rows, source_file_name, source_sha256, [], partial_metadata)

    valid_rows: list[dict[str, str]] = []
    seen_dates: set[tuple[str, str, str]] = set()
    action_dates: set[tuple[str, str, str]] = set()
    previous_by_series: dict[tuple[str, str], str] = {}
    currencies_by_series: dict[tuple[str, str], set[str]] = defaultdict(set)
    basis_by_series: dict[tuple[str, str], set[str]] = defaultdict(set)
    blocked_series: set[tuple[str, str]] = set()
    provenance_review_series: set[tuple[str, str]] = set()

    for row in rows:
        series_key = (row.get("market", ""), row.get("ticker", ""))
        row_date = row.get("date", "")
        parsed_date = _parse_date(row_date)
        if parsed_date is None:
            audit_rows.append(_audit_row(row, "malformed_or_missing_date", "critical", True, "Date must be YYYY-MM-DD."))
            continue

        key = (series_key[0], series_key[1], row_date)
        if key in seen_dates:
            blocked_series.add(series_key)
            audit_rows.append(_audit_row(row, "duplicate_date", "critical", True, "Duplicate date within market/ticker."))
        seen_dates.add(key)

        previous_date = previous_by_series.get(series_key)
        if previous_date and row_date < previous_date:
            blocked_series.add(series_key)
            audit_rows.append(
                _audit_row(row, "non_monotonic_date_order", "critical", True, "Raw rows must not reverse within a series.")
            )
        previous_by_series[series_key] = row_date

        row_errors = _validate_daily_row(row, allow_review_only_provenance=allow_review_only_provenance)
        for issue_type, reason in row_errors:
            series_review = issue_type in SERIES_REVIEW_ISSUE_TYPES
            audit_rows.append(
                _audit_row(
                    row,
                    issue_type,
                    "warning" if series_review else "critical",
                    not series_review,
                    reason,
                )
            )
        if allow_review_only_provenance and _has_review_only_provenance(row) and series_key not in provenance_review_series:
            provenance_review_series.add(series_key)
            audit_rows.append(
                _audit_row(
                    row,
                    "invalid_provenance_publication_policy",
                    "warning",
                    True,
                    "Unknown or false publication licensing is retained as review-only internal Preview evidence.",
                )
            )

        if _has_corporate_action(row):
            if key in action_dates:
                blocked_series.add(series_key)
                audit_rows.append(
                    _audit_row(row, "duplicate_corporate_action_entry", "critical", True, "Duplicate corporate action date.")
                )
            action_dates.add(key)

        classification = classify_price_series(row)
        basis_by_series[series_key].add(classification)
        if classification == "ambiguous":
            audit_rows.append(
                _audit_row(
                    row,
                    "ambiguous_adjustment_basis",
                    "critical",
                    True,
                    "Adjusted-price basis is ambiguous and requires manual review.",
                )
            )

        currency = row.get("currency", "")
        if currency:
            currencies_by_series[series_key].add(currency)

        if _row_is_normalizable(row, row_errors, classification):
            valid_rows.append(row)

    for series_key, currencies in currencies_by_series.items():
        if len(currencies) > 1:
            blocked_series.add(series_key)
            audit_rows.append(
                _audit_row(
                    {"market": series_key[0], "ticker": series_key[1]},
                    "inconsistent_currency",
                    "critical",
                    True,
                    f"Series has multiple currencies: {', '.join(sorted(currencies))}.",
                )
            )

    for series_key, classifications in basis_by_series.items():
        concrete = classifications.difference({"ambiguous"})
        if len(concrete) > 1:
            blocked_series.add(series_key)
            audit_rows.append(
                _audit_row(
                    {"market": series_key[0], "ticker": series_key[1]},
                    "inconsistent_price_adjustment_basis",
                    "critical",
                    True,
                    f"Series mixes price bases: {', '.join(sorted(classifications))}.",
                )
            )

    publishable_valid_rows = [row for row in valid_rows if (row["market"], row["ticker"]) not in blocked_series]
    metric_cutoff_month = str(partial_metadata["metricDataThroughMonth"])
    metric_input_rows = [
        row for row in publishable_valid_rows
        if not metric_cutoff_month or row["date"][:7] <= metric_cutoff_month
    ]
    if partial_metadata["partialFinalMonthExcluded"]:
        excluded_series = sorted({
            (row["market"], row["ticker"])
            for row in publishable_valid_rows
            if row["date"][:7] > metric_cutoff_month
        })
        for market, ticker in excluded_series:
            audit_rows.append(
                _audit_row(
                    {"market": market, "ticker": ticker, "date": requested_as_of_included},
                    "partial_final_month_excluded",
                    "info",
                    False,
                    "Raw partial-final-month observations were preserved but excluded from monthly metrics.",
                )
            )
    normalized_rows.extend(_normalize_month_ends(metric_input_rows, audit_rows, normalized_data_status))
    action_summary = _corporate_action_summary(valid_rows)
    return _result(normalized_rows, audit_rows + action_summary, source_file_name, source_sha256, rows, partial_metadata)


def normalize_daily_price_file_streaming(
    path: Path,
    *,
    source_file_name: str,
    source_sha256: str,
    market_order: Iterable[str],
    row_observer: Callable[[Mapping[str, str]], None] | None = None,
    allow_review_only_provenance: bool = False,
    normalized_data_status: str = "normalized_fixture",
    requested_as_of_included: str = "",
    partial_month_policy: str = PARTIAL_MONTH_POLICY,
) -> dict[str, object]:
    """Normalize a sorted raw CSV while holding only one asset series in memory."""
    normalized_rows: list[dict[str, str]] = []
    audit_rows: list[dict[str, str]] = []
    current_series: list[dict[str, str]] = []
    current_identity: tuple[str, str] | None = None
    completed_identities: set[tuple[str, str]] = set()
    raw_identities: set[tuple[str, str]] = set()
    raw_markets: set[str] = set()
    first_date = ""
    last_date = ""
    first_date_by_market: dict[str, str] = {}
    last_date_by_market: dict[str, str] = {}
    row_count = 0
    previous_order_key: tuple[int, str, str] | None = None
    market_rank = {market: index for index, market in enumerate(market_order)}

    def flush_series() -> None:
        nonlocal current_series, current_identity
        if not current_series:
            return
        result = normalize_daily_price_rows(
            current_series,
            source_file_name=source_file_name,
            source_sha256=source_sha256,
            allow_review_only_provenance=allow_review_only_provenance,
            normalized_data_status=normalized_data_status,
            requested_as_of_included=requested_as_of_included,
            partial_month_policy=partial_month_policy,
        )
        normalized_rows.extend(result["normalizedRows"])
        audit_rows.extend(result["auditRows"])
        if current_identity is not None:
            completed_identities.add(current_identity)
        current_series = []
        current_identity = None

    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing_columns = sorted(set(RAW_DAILY_PRICE_COLUMNS).difference(reader.fieldnames or []))
        if missing_columns:
            audit_rows.append(
                _audit_row(
                    {},
                    "raw_daily_schema_missing_columns",
                    "critical",
                    True,
                    f"Missing required raw daily columns: {', '.join(missing_columns)}.",
                )
            )
        else:
            for raw_row in reader:
                if None in raw_row:
                    audit_rows.append(
                        _audit_row(
                            {},
                            "malformed_csv_row",
                            "critical",
                            True,
                            "CSV row has more fields than the header.",
                        )
                    )
                    continue
                row = {column: str(raw_row.get(column, "") or "") for column in RAW_DAILY_PRICE_COLUMNS}
                market = row["market"]
                ticker = row["ticker"]
                date_text = row["date"]
                identity = (market, ticker)
                raw_identities.add(identity)
                raw_markets.add(market)
                row_count += 1
                if _parse_date(date_text) is not None:
                    first_date = date_text if not first_date or date_text < first_date else first_date
                    last_date = date_text if not last_date or date_text > last_date else last_date
                    first_date_by_market[market] = (
                        date_text
                        if market not in first_date_by_market or date_text < first_date_by_market[market]
                        else first_date_by_market[market]
                    )
                    last_date_by_market[market] = (
                        date_text
                        if market not in last_date_by_market or date_text > last_date_by_market[market]
                        else last_date_by_market[market]
                    )
                if row_observer is not None:
                    row_observer(row)

                rank = market_rank.get(market, len(market_rank))
                order_key = (rank, ticker, date_text)
                if previous_order_key is not None:
                    if order_key == previous_order_key:
                        audit_rows.append(
                            _audit_row(row, "duplicate_date", "critical", True, "Duplicate market/ticker/date raw key.")
                        )
                    elif order_key < previous_order_key:
                        audit_rows.append(
                            _audit_row(
                                row,
                                "non_monotonic_series_order",
                                "critical",
                                True,
                                "Raw rows must be strictly ordered by configured market, ticker, and date.",
                            )
                        )
                previous_order_key = order_key

                if current_identity is None:
                    current_identity = identity
                elif identity != current_identity:
                    flush_series()
                    if identity in completed_identities:
                        audit_rows.append(
                            _audit_row(
                                row,
                                "non_contiguous_series",
                                "critical",
                                True,
                                "A market/ticker series reappeared after another series.",
                            )
                        )
                    current_identity = identity
                current_series.append(row)
            flush_series()

    if row_count == 0 and not any(row["issueType"] == "raw_daily_schema_missing_columns" for row in audit_rows):
        audit_rows.append(_audit_row({}, "raw_daily_missing", "critical", True, "Raw daily price CSV is empty."))

    partial_metadata = partial_month_metadata(
        requested_as_of_included,
        last_date,
        partial_month_policy,
    )
    return {
        "normalizedRows": normalized_rows,
        "auditRows": audit_rows,
        "sourceMetadata": {
            "sourceFileName": source_file_name,
            "sourceSha256": source_sha256,
            "normalizationVersion": NORMALIZATION_VERSION,
            "schemaVersion": SCHEMA_VERSION,
            "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
            **partial_metadata,
        },
        "partialMonthMetadata": partial_metadata,
        "rawStats": {
            "rowCount": row_count,
            "assetCount": len(raw_identities),
            "identities": raw_identities,
            "markets": raw_markets,
            "firstDate": first_date,
            "lastDate": last_date,
            "firstDateByMarket": first_date_by_market,
            "lastDateByMarket": last_date_by_market,
        },
        "blockingIssueCount": sum(1 for row in audit_rows if row["blocksPublication"] == "true"),
    }


def partial_month_metadata(
    requested_as_of_included: str,
    actual_last_price_date: str,
    policy: str = PARTIAL_MONTH_POLICY,
) -> dict[str, object]:
    if policy != PARTIAL_MONTH_POLICY:
        raise ValueError(f"partialMonthPolicy must be {PARTIAL_MONTH_POLICY}")
    if not requested_as_of_included:
        return {
            "requestedAsOfIncluded": "",
            "actualLastPriceDate": actual_last_price_date,
            "metricDataThroughMonth": actual_last_price_date[:7] if actual_last_price_date else "",
            "partialFinalMonthDetected": False,
            "partialFinalMonthExcluded": False,
            "partialMonthPolicy": policy,
        }

    requested = _parse_date(requested_as_of_included)
    if requested is None:
        raise ValueError("requestedAsOfIncluded must be YYYY-MM-DD")
    actual = _parse_date(actual_last_price_date) if actual_last_price_date else None
    if actual_last_price_date and actual is None:
        raise ValueError("actualLastPriceDate must be YYYY-MM-DD")
    if actual is not None and actual > requested:
        raise ValueError("actualLastPriceDate must not be later than requestedAsOfIncluded")

    requested_month_complete = requested.day == monthrange(requested.year, requested.month)[1]
    partial_detected = not requested_month_complete
    cutoff_date = requested if requested_month_complete else requested.replace(day=1) - timedelta(days=1)
    cutoff_month = cutoff_date.strftime("%Y-%m")
    actual_month = actual.strftime("%Y-%m") if actual is not None else ""
    metric_data_through_month = min(cutoff_month, actual_month) if actual_month else ""
    return {
        "requestedAsOfIncluded": requested.isoformat(),
        "actualLastPriceDate": actual.isoformat() if actual is not None else "",
        "metricDataThroughMonth": metric_data_through_month,
        "partialFinalMonthDetected": partial_detected,
        "partialFinalMonthExcluded": partial_detected,
        "partialMonthPolicy": policy,
    }


def classify_price_series(row: Mapping[str, str]) -> str:
    basis = row.get("priceAdjustmentBasis", "")
    if basis in PRICE_SERIES_CLASSIFICATIONS:
        return basis
    if basis == "split_adjusted_close":
        return "split_adjusted"
    if basis == "total_return_index":
        return "total_return_adjusted"
    return "ambiguous"


def _validate_daily_row(
    row: Mapping[str, str],
    *,
    allow_review_only_provenance: bool = False,
) -> list[tuple[str, str]]:
    errors: list[tuple[str, str]] = []
    market = row.get("market", "")
    ticker = row.get("ticker", "")
    if market not in {"US", "KR"}:
        errors.append(("inconsistent_market_ticker_identifier", "Market must be US or KR."))
    if market == "KR" and not is_valid_kr_candidate_ticker(ticker):
        errors.append(("inconsistent_market_ticker_identifier", "KR tickers must remain six-character uppercase alphanumeric strings."))
    if ticker != ticker.strip() or not ticker:
        errors.append(("inconsistent_market_ticker_identifier", "Ticker must be non-empty and trimmed."))

    close = _safe_float(row.get("close"))
    if close is None or close <= 0:
        errors.append(("non_positive_price", "close must be positive."))

    split_factor = _safe_float(row.get("splitFactor"))
    if split_factor is None or split_factor <= 0 or split_factor > 100:
        split_factor_evidence = row.get("splitFactor", "") or "<blank>"
        errors.append(
            (
                "implausible_split_factor",
                (
                    f"splitFactor={split_factor_evidence} on {row.get('date', '')} is outside "
                    "the plausible evidence range (0, 100]; Close remains the split-adjusted calculation series."
                ),
            )
        )

    cash_dividend_raw = row.get("cashDividend", "")
    cash_dividend = _safe_float(cash_dividend_raw)
    if cash_dividend_raw != "" and (cash_dividend is None or cash_dividend < 0):
        errors.append(("corporate_action_inconsistency", "cashDividend must be zero or positive."))

    basis = classify_price_series(row)
    if basis == "raw_close" and close is None:
        errors.append(("missing_required_price_basis", "raw_close basis requires close."))
    if basis == "split_adjusted" and _safe_float(row.get("splitAdjustedClose")) is None:
        errors.append(("missing_required_price_basis", "split_adjusted basis requires splitAdjustedClose."))
    if basis in {"split_and_dividend_adjusted", "total_return_adjusted"} and _safe_float(row.get("totalReturnAdjustedClose")) is None:
        errors.append(("missing_required_price_basis", "total-return basis requires totalReturnAdjustedClose."))
    if basis == "ambiguous":
        errors.append(("missing_required_price_basis", "priceAdjustmentBasis must be explicit."))

    if split_factor and split_factor != 1 and _safe_float(row.get("splitAdjustedClose")) is None:
        errors.append(("corporate_action_inconsistency", "Split rows require splitAdjustedClose evidence."))

    license_status = row.get("licenseStatus", "")
    publication_allowed = row.get("publicationAllowed", "")
    publication_eligibility = row.get("publicationEligibility", "")
    if not allow_review_only_provenance and (
        license_status != "approved" or publication_allowed != "true" or publication_eligibility != "approved"
    ):
        errors.append(
            (
                "invalid_provenance_publication_policy",
                "Unknown or false publication licensing forces review-only output.",
            )
        )

    return errors


def _row_is_normalizable(row: Mapping[str, str], errors: list[tuple[str, str]], classification: str) -> bool:
    blocking = {
        "malformed_or_missing_date",
        "duplicate_date",
        "non_monotonic_date_order",
        "non_positive_price",
        "missing_required_price_basis",
        "inconsistent_market_ticker_identifier",
        "corporate_action_inconsistency",
        "invalid_provenance_publication_policy",
    }
    return classification != "ambiguous" and not any(issue_type in blocking for issue_type, _ in errors)


def _has_review_only_provenance(row: Mapping[str, str]) -> bool:
    return (
        row.get("licenseStatus", "") != "approved"
        or row.get("publicationAllowed", "") != "true"
        or row.get("publicationEligibility", "") != "approved"
        or row.get("internalUseAllowed", "") != "true"
        or row.get("redistributionAllowed", "") != "true"
    )


def _normalize_month_ends(
    rows: Iterable[dict[str, str]],
    audit_rows: list[dict[str, str]],
    data_status: str,
) -> list[dict[str, str]]:
    by_series_month: dict[tuple[str, str, str], dict[str, str]] = {}
    dividends_by_series_month: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    dates_by_series: dict[tuple[str, str], list[str]] = defaultdict(list)
    for row in rows:
        month = row["date"][:7]
        key = (row["market"], row["ticker"], month)
        dividends_by_series_month[key].append(row.get("cashDividend", ""))
        if key not in by_series_month or row["date"] > by_series_month[key]["date"]:
            by_series_month[key] = row
        dates_by_series[(row["market"], row["ticker"])].append(row["date"])

    normalized: list[dict[str, str]] = []
    months_by_series: dict[tuple[str, str], set[str]] = defaultdict(set)
    for (market, ticker, month), row in sorted(by_series_month.items()):
        months_by_series[(market, ticker)].add(month)
        month_end = _month_end(month)
        monthly_cash_dividend, dividend_status = _monthly_dividend_evidence(
            dividends_by_series_month[(market, ticker, month)]
        )
        normalized.append(
            {
                "market": market,
                "ticker": ticker,
                "month": month_end,
                "sourceDate": row["date"],
                "currency": row["currency"],
                "close": row["close"],
                "splitAdjustedClose": row.get("splitAdjustedClose", ""),
                "totalReturnAdjustedClose": row.get("totalReturnAdjustedClose", ""),
                "volume": row.get("volume", ""),
                "splitFactor": row.get("splitFactor", ""),
                "cashDividend": monthly_cash_dividend,
                "dividendStatus": dividend_status,
                "sourceId": row.get("sourceId", ""),
                "retrievedAt": row.get("retrievedAt", ""),
                "priceAdjustmentBasis": row.get("priceAdjustmentBasis", ""),
                "priceSeriesClassification": classify_price_series(row),
                "publicationEligibility": row.get("publicationEligibility", ""),
                "dataStatus": data_status,
                "normalizationVersion": NORMALIZATION_VERSION,
            }
        )

    for series_key, months in months_by_series.items():
        for expected_month in _month_range(min(months), max(months)):
            if expected_month not in months:
                audit_rows.append(
                    _audit_row(
                        {"market": series_key[0], "ticker": series_key[1], "date": f"{expected_month}-01"},
                        "missing_calendar_month",
                        "warning",
                        False,
                        "No valid daily observation exists for this calendar month; no forward fill was applied.",
                    )
                )
    return normalized


def _monthly_dividend_evidence(values: Iterable[str]) -> tuple[str, str]:
    evidence = [str(value or "") for value in values]
    parsed: list[Decimal] = []
    for value in evidence:
        if value == "":
            continue
        try:
            parsed.append(Decimal(value))
        except InvalidOperation:
            continue

    positive_total = sum((value for value in parsed if value > 0), Decimal("0"))
    if positive_total > 0:
        return _format_decimal_evidence(positive_total), "confirmed_value"
    if evidence and len(parsed) == len(evidence) and all(value == 0 for value in parsed):
        return "0", "confirmed_zero"
    return "", "missing"


def _format_decimal_evidence(value: Decimal) -> str:
    formatted = format(value, "f").rstrip("0").rstrip(".")
    return formatted or "0"


def _corporate_action_summary(rows: Iterable[Mapping[str, str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    seen_types: set[tuple[str, str, str]] = set()
    for row in rows:
        split_factor = _safe_float(row.get("splitFactor")) or 1.0
        cash_dividend = _safe_float(row.get("cashDividend")) or 0.0
        if split_factor != 1.0 and 0 < split_factor <= 100:
            key = (row["market"], row["ticker"], "valid_stock_split")
            if key not in seen_types:
                output.append(_audit_row(row, "valid_stock_split", "info", False, "Split factor evidence is present."))
                seen_types.add(key)
        if cash_dividend > 0:
            key = (row["market"], row["ticker"], "cash_dividend")
            if key not in seen_types:
                output.append(_audit_row(row, "cash_dividend", "info", False, "Cash dividend evidence is present."))
                seen_types.add(key)
    return output


def _audit_row(
    row: Mapping[str, str],
    issue_type: str,
    severity: str,
    blocks_publication: bool,
    reason: str,
) -> dict[str, str]:
    return {
        "market": row.get("market", ""),
        "ticker": row.get("ticker", ""),
        "date": row.get("date", ""),
        "issueType": issue_type,
        "severity": severity,
        "blocksPublication": "true" if blocks_publication else "false",
        "priceSeriesClassification": classify_price_series(row) if row else "ambiguous",
        "reviewReason": reason,
        "sourceId": row.get("sourceId", ""),
        "normalizationVersion": NORMALIZATION_VERSION,
    }


def _result(
    normalized_rows: list[dict[str, str]],
    audit_rows: list[dict[str, str]],
    source_file_name: str,
    source_sha256: str,
    rows: list[dict[str, str]],
    partial_metadata: Mapping[str, object],
) -> dict[str, object]:
    source_rows = rows or []
    return {
        "normalizedRows": normalized_rows,
        "auditRows": audit_rows,
        "sourceMetadata": {
            "sourceId": _combined_value(source_rows, "sourceId", "fixture_raw_daily_prices"),
            "sourceFileName": source_file_name,
            "sourceSha256": source_sha256,
            "retrievedAt": _combined_value(source_rows, "retrievedAt", ""),
            "providerOrInstitution": _combined_value(source_rows, "providerOrInstitution", "FINPLE synthetic fixture"),
            "licenseStatus": _combined_status(source_rows, "licenseStatus"),
            "internalUseAllowed": _combined_bool(source_rows, "internalUseAllowed"),
            "publicationAllowed": _combined_bool(source_rows, "publicationAllowed"),
            "redistributionAllowed": _combined_bool(source_rows, "redistributionAllowed"),
            "priceAdjustmentBasis": "mixed_fixture_with_review_required_rows",
            "sources": _source_entries(source_rows),
            "normalizationVersion": NORMALIZATION_VERSION,
            "schemaVersion": SCHEMA_VERSION,
            "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
            **partial_metadata,
        },
        "partialMonthMetadata": dict(partial_metadata),
        "blockingIssueCount": sum(1 for row in audit_rows if row["blocksPublication"] == "true"),
    }


def _actual_last_price_date(rows: Iterable[Mapping[str, str]]) -> str:
    valid_dates = [row.get("date", "") for row in rows if _parse_date(row.get("date", "")) is not None]
    return max(valid_dates) if valid_dates else ""


def _combined_value(rows: list[Mapping[str, str]], key: str, default: str) -> str:
    values = {row.get(key, "") for row in rows if row.get(key, "")}
    if not values:
        return default
    if len(values) == 1:
        return next(iter(values))
    return "mixed_or_review_required"


def _combined_status(rows: list[Mapping[str, str]], key: str) -> str:
    values = {row.get(key, "") for row in rows}
    return values.pop() if len(values) == 1 else "mixed_or_review_required"


def _combined_bool(rows: list[Mapping[str, str]], key: str) -> bool:
    return bool(rows) and all(row.get(key) == "true" for row in rows)


def _source_entries(rows: list[Mapping[str, str]]) -> list[dict[str, object]]:
    entries: dict[tuple[str, str, str, str], dict[str, object]] = {}
    for row in rows:
        key = (
            row.get("sourceId", ""),
            row.get("retrievedAt", ""),
            row.get("providerOrInstitution", ""),
            row.get("priceAdjustmentBasis", ""),
        )
        entry = entries.setdefault(
            key,
            {
                "sourceId": row.get("sourceId", ""),
                "retrievedAt": row.get("retrievedAt", ""),
                "providerOrInstitution": row.get("providerOrInstitution", ""),
                "licenseStatus": row.get("licenseStatus", ""),
                "internalUseAllowed": row.get("internalUseAllowed", "") == "true",
                "publicationAllowed": row.get("publicationAllowed", "") == "true",
                "redistributionAllowed": row.get("redistributionAllowed", "") == "true",
                "priceAdjustmentBasis": row.get("priceAdjustmentBasis", ""),
                "rowCount": 0,
            },
        )
        entry["rowCount"] = int(entry["rowCount"]) + 1
    return [entries[key] for key in sorted(entries)]


def _has_corporate_action(row: Mapping[str, str]) -> bool:
    return (_safe_float(row.get("splitFactor")) or 1.0) != 1.0 or (_safe_float(row.get("cashDividend")) or 0.0) > 0


def _parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def _safe_float(value: str | None) -> float | None:
    try:
        return float(value or "")
    except ValueError:
        return None


def _month_end(month: str) -> str:
    year, month_number = (int(part) for part in month.split("-"))
    return f"{year:04d}-{month_number:02d}-{monthrange(year, month_number)[1]:02d}"


def _month_range(start: str, end: str) -> list[str]:
    start_year, start_month = (int(part) for part in start.split("-"))
    end_year, end_month = (int(part) for part in end.split("-"))
    months: list[str] = []
    year = start_year
    month = start_month
    while (year, month) <= (end_year, end_month):
        months.append(f"{year:04d}-{month:02d}")
        if month == 12:
            year += 1
            month = 1
        else:
            month += 1
    return months
