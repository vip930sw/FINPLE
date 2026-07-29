"""Structural and publishability validation for full-schema candidates."""

from __future__ import annotations

import argparse
import csv
import json
import math
from datetime import date
from pathlib import Path

from .canonical import (
    CALCULATED_OR_OPERATIONAL_FIELDS,
    CANDIDATE_REQUIRED_COLUMNS,
    CanonicalSource,
    load_canonical_source,
    row_identity,
)
from .market_data import SPLIT_ADJUSTED_CLOSE, SUPPORTED_PRICE_BASES
from .universe import UniverseAsset, normalize_market, normalize_ticker


COMMON_PUBLISHABLE_METRICS = (
    "expectedCagr",
    "rollingCagrMedian",
    "beta",
    "mdd",
    "annualizedVolatility",
)
ALL_NUMERIC_FIELDS = (
    "expectedCagr",
    "rawPriceCagr",
    "rollingCagrMedian",
    "rollingCagrWindowYears",
    "rollingCagrWindowCount",
    "usablePriceHistoryYears",
    "minimumPortfolioHistoryYears",
    "beta",
    "mdd",
    "annualizedVolatility",
    "volatilityObservationCount",
    "dividendYield",
    "cashDistributionYieldTtm",
    "trailingDistributionYield",
    "reinvestmentCashYield",
    "simulationCashYield",
)
NON_ORDINARY_EXPOSURE_TYPES = frozenset(
    {
        "single_stock_option_income",
        "single_stock_weekly_income",
        "index_covered_call",
        "index_covered_call_growth",
        "thematic_equity_premium_income",
        "broad_equity_premium_income",
    }
)
ORDINARY_DISTRIBUTION_TYPES = frozenset(
    {"", "unknown", "ordinary_cash_dividend", "none"}
)
PORTFOLIO_ELIGIBILITY_STATUSES = frozenset(
    {
        "eligible",
        "insufficient_long_horizon_history",
        "provider_data_unavailable",
        "inactive",
        "excluded_by_operator",
    }
)
PORTFOLIO_ADD_POLICIES = frozenset({"allow", "confirm", "deny"})
PORTFOLIO_CAGR_CONFIDENCE = frozenset({"low", "medium", "high"})
SPECIAL_DISTRIBUTION_TYPE = "special_or_liquidating_distribution"
REPEATED_DISTRIBUTION_TYPES = frozenset(
    {"mixed_distribution", "futures_mixed_distribution"}
)

# Compatibility export retained for existing callers and fixtures.
REQUIRED_CANDIDATE_COLUMNS = CANDIDATE_REQUIRED_COLUMNS


class CandidateValidationError(ValueError):
    def __init__(self, report: dict[str, object]):
        self.report = report
        super().__init__("candidate validation failed")


def _parse_bool(value: object) -> bool | None:
    normalized = str(value or "").strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return None


def _finite_number(value: object) -> bool:
    if value is None or str(value).strip() == "":
        return False
    try:
        return math.isfinite(float(str(value).strip()))
    except (TypeError, ValueError):
        return False


def _issue(
    issues: list[dict[str, str]],
    code: str,
    message: str,
    scope: str,
) -> None:
    issues.append({"code": code, "message": message, "scope": scope})


def _is_non_ordinary(row: dict[str, object]) -> bool:
    exposure_type = str(row.get("exposureType") or "").strip().lower()
    distribution_type = (
        str(row.get("distributionType") or "").strip().lower()
    )
    return (
        str(row.get("distributionDataQualityStatus") or "")
        .strip()
        .lower()
        == "provider_event_error"
        or
        exposure_type in NON_ORDINARY_EXPOSURE_TYPES
        or distribution_type not in ORDINARY_DISTRIBUTION_TYPES
    )


def _same_number(left: object, right: object) -> bool:
    return (
        _finite_number(left)
        and _finite_number(right)
        and math.isclose(
            float(str(left)),
            float(str(right)),
            rel_tol=0,
            abs_tol=1e-8,
        )
    )


def validate_candidate_rows(
    rows: list[dict[str, object]],
    *,
    headers: list[str] | tuple[str, ...],
    universe: list[UniverseAsset],
    as_of_date: date,
    source: CanonicalSource | None = None,
) -> dict[str, object]:
    structural_issues: list[dict[str, str]] = []
    publishability_issues: list[dict[str, str]] = []
    missing_columns = [
        column
        for column in CANDIDATE_REQUIRED_COLUMNS
        if column not in headers
    ]
    if missing_columns:
        _issue(
            structural_issues,
            "missing_required_columns",
            ", ".join(missing_columns),
            "structural",
        )
    if source is not None:
        missing_source_columns = [
            column for column in source.headers if column not in headers
        ]
        if missing_source_columns:
            _issue(
                structural_issues,
                "source_columns_removed",
                ", ".join(missing_source_columns),
                "structural",
            )
    prohibited_columns = [
        column
        for column in headers
        if (
            "totalreturn" in column.replace("_", "").lower()
            or column.replace("_", "").lower() == "tr"
            or column.replace("_", "").lower().startswith("trindex")
        )
    ]
    if prohibited_columns:
        _issue(
            structural_issues,
            "total_return_columns_prohibited",
            ", ".join(prohibited_columns),
            "structural",
        )

    actual_identities: list[str] = []
    actual_by_identity: dict[str, dict[str, object]] = {}
    ready_count = 0
    target_count = 0
    market_counts: dict[str, int] = {}
    for row_number, row in enumerate(rows, start=2):
        try:
            market = normalize_market(row.get("market"))
            ticker = normalize_ticker(row.get("ticker"), market)
        except ValueError as error:
            _issue(
                structural_issues,
                "invalid_identity",
                f"row {row_number}: {error}",
                "structural",
            )
            continue
        identity = f"{market}:{ticker}"
        if identity in actual_by_identity:
            _issue(
                structural_issues,
                "duplicate_market_ticker",
                identity,
                "structural",
            )
        actual_identities.append(identity)
        actual_by_identity[identity] = row
        market_counts[market] = market_counts.get(market, 0) + 1

        active = _parse_bool(row.get("active"))
        include = _parse_bool(row.get("includeInSimulator"))
        ready = _parse_bool(row.get("simulatorReady"))
        portfolio_eligible = _parse_bool(row.get("portfolioEligible"))
        for field, parsed in (
            ("active", active),
            ("includeInSimulator", include),
            ("simulatorReady", ready),
            ("portfolioEligible", portfolio_eligible),
        ):
            if parsed is None:
                _issue(
                    structural_issues,
                    "boolean_value_invalid",
                    f"{identity}.{field}",
                    "structural",
                )

        for field in ALL_NUMERIC_FIELDS:
            value = row.get(field)
            if (
                value is not None
                and str(value).strip()
                and not _finite_number(value)
            ):
                _issue(
                    structural_issues,
                    "numeric_value_invalid",
                    f"{identity}.{field}",
                    "structural",
                )

        verification_status = str(
            row.get("metadataVerificationStatus") or ""
        ).strip()
        if verification_status not in {
            "", "verified", "pending_official_source",
            "not_applicable", "rejected",
        }:
            _issue(
                structural_issues,
                "invalid_metadata_verification_status",
                f"{identity}:{verification_status}",
                "structural",
            )
        if (
            not verification_status
            and str(row.get("metadataVerificationSource") or "").strip()
            in {"name_pattern_candidate", "official_registry"}
        ):
            _issue(
                publishability_issues,
                "leverage_metadata_verification_status_missing",
                identity,
                "publishability",
            )
        if verification_status == "verified":
            for field in (
                "leverageMultiple",
                "resetFrequency",
                "officialSourceUrl",
            ):
                if not str(row.get(field) or "").strip():
                    _issue(
                        publishability_issues,
                        "verified_leverage_metadata_incomplete",
                        f"{identity}.{field}",
                        "publishability",
                    )
            if not _finite_number(row.get("leverageMultiple")):
                _issue(
                    publishability_issues,
                    "verified_leverage_multiple_invalid",
                    identity,
                    "publishability",
                )
            if not str(row.get("officialSourceUrl") or "").strip().startswith(
                ("http://", "https://")
            ):
                _issue(
                    publishability_issues,
                    "verified_leverage_source_url_invalid",
                    identity,
                    "publishability",
                )
            if (
                str(row.get("direction") or "").strip().lower() == "inverse"
                and str(row.get("leverageRiskTier") or "").strip() != "4"
            ):
                _issue(
                    publishability_issues,
                    "inverse_leverage_risk_tier_invalid",
                    identity,
                    "publishability",
                )
        if (
            verification_status == "pending_official_source"
            and str(row.get("portfolioAddPolicy") or "").strip() == "allow"
        ):
            _issue(
                publishability_issues,
                "pending_leverage_metadata_must_confirm",
                identity,
                "publishability",
            )

        price_basis = str(row.get("priceBasis") or "").strip()
        if price_basis and price_basis not in SUPPORTED_PRICE_BASES:
            _issue(
                structural_issues,
                "invalid_price_basis",
                f"{identity}:{price_basis}",
                "structural",
            )
        end_date_text = str(row.get("priceDataEndDate") or "").strip()
        if end_date_text:
            try:
                end_date = date.fromisoformat(end_date_text)
            except ValueError:
                _issue(
                    structural_issues,
                    "price_end_date_invalid",
                    identity,
                    "structural",
                )
            else:
                if end_date > as_of_date:
                    _issue(
                        structural_issues,
                        "price_after_as_of_date",
                        f"{identity}:{end_date_text}",
                        "structural",
                    )
        for field in ("priceHistoryStartDate", "portfolioEligibleAfterDate"):
            value = str(row.get(field) or "").strip()
            if value:
                try:
                    date.fromisoformat(value)
                except ValueError:
                    _issue(
                        structural_issues,
                        "date_value_invalid",
                        f"{identity}.{field}",
                        "structural",
                    )

        eligibility_status = str(
            row.get("portfolioEligibilityStatus") or ""
        ).strip()
        add_policy = str(row.get("portfolioAddPolicy") or "").strip()
        confidence = str(row.get("cagrConfidence") or "").strip()
        if eligibility_status not in PORTFOLIO_ELIGIBILITY_STATUSES:
            _issue(
                structural_issues,
                "portfolio_eligibility_status_invalid",
                identity,
                "structural",
            )
        if add_policy not in PORTFOLIO_ADD_POLICIES:
            _issue(
                structural_issues,
                "portfolio_add_policy_invalid",
                identity,
                "structural",
            )
        if confidence not in PORTFOLIO_CAGR_CONFIDENCE:
            _issue(
                structural_issues,
                "cagr_confidence_invalid",
                identity,
                "structural",
            )
        if (portfolio_eligible is True) != (eligibility_status == "eligible"):
            _issue(
                structural_issues,
                "portfolio_eligibility_mismatch",
                identity,
                "structural",
            )
        if eligibility_status == "insufficient_long_horizon_history":
            if add_policy != "deny" or confidence != "low":
                _issue(
                    structural_issues,
                    "short_history_policy_mismatch",
                    identity,
                    "structural",
                )
        if not _same_number(row.get("minimumPortfolioHistoryYears"), 3):
            _issue(
                structural_issues,
                "minimum_portfolio_history_years_invalid",
                identity,
                "structural",
            )

        if active is True and include is False:
            if (
                not str(row.get("reasonCode") or "").strip()
                or not str(row.get("reasonMessage") or "").strip()
            ):
                _issue(
                    structural_issues,
                    "excluded_reason_missing",
                    identity,
                    "structural",
                )

        if active is True and include is True:
            target_count += 1
            if ready is not True:
                _issue(
                    publishability_issues,
                    "simulator_target_not_ready",
                    identity,
                    "publishability",
                )
            else:
                ready_count += 1
            for field in COMMON_PUBLISHABLE_METRICS:
                if not _finite_number(row.get(field)):
                    _issue(
                        publishability_issues,
                        "required_metric_not_finite",
                        f"{identity}.{field}",
                        "publishability",
                    )
            if price_basis != SPLIT_ADJUSTED_CLOSE:
                _issue(
                    publishability_issues,
                    "publishable_price_basis_invalid",
                    identity,
                    "publishability",
                )
            if _is_non_ordinary(row):
                if not _finite_number(row.get("cashDistributionYieldTtm")):
                    _issue(
                        publishability_issues,
                        "cash_distribution_yield_missing",
                        identity,
                        "publishability",
                    )
                trailing = row.get("trailingDistributionYield")
                cash_yield = row.get("cashDistributionYieldTtm")
                if _finite_number(trailing) and _finite_number(cash_yield):
                    if not _same_number(trailing, cash_yield):
                        _issue(
                            structural_issues,
                            "distribution_yield_mismatch",
                            identity,
                            "structural",
                        )
            elif not _finite_number(row.get("dividendYield")):
                _issue(
                    publishability_issues,
                    "dividend_yield_missing",
                    identity,
                    "publishability",
                )

            distribution_type = str(
                row.get("distributionType") or ""
            ).strip().lower()
            simulation_policy = str(
                row.get("distributionSimulationPolicy") or ""
            ).strip()
            simulation_yield = row.get("simulationCashYield")
            reinvestment_yield = row.get("reinvestmentCashYield")
            data_quality_status = str(
                row.get("distributionDataQualityStatus") or ""
            ).strip().lower()
            if data_quality_status == "provider_event_error":
                expected_policy = "blocked_data_quality"
                expected_yield: object = 0
            elif distribution_type == SPECIAL_DISTRIBUTION_TYPE:
                expected_policy = "exclude_non_recurring_distribution"
                expected_yield = 0
                if (
                    str(row.get("distributionCalculationStatus") or "").strip()
                    != "non_recurring_distribution_excluded"
                ):
                    _issue(
                        publishability_issues,
                        "special_distribution_status_inconsistent",
                        identity,
                        "publishability",
                    )
            elif (
                distribution_type in REPEATED_DISTRIBUTION_TYPES
                or _is_non_ordinary(row)
            ):
                expected_policy = "repeat_ttm_distribution"
                expected_yield = row.get("cashDistributionYieldTtm")
            else:
                expected_policy = "ordinary_cash_dividend"
                expected_yield = row.get("dividendYield")
            if simulation_policy != expected_policy:
                _issue(
                    publishability_issues,
                    "distribution_simulation_policy_inconsistent",
                    identity,
                    "publishability",
                )
            if not _same_number(simulation_yield, expected_yield):
                _issue(
                    publishability_issues,
                    "simulation_cash_yield_inconsistent",
                    identity,
                    "publishability",
                )
            if not _same_number(reinvestment_yield, expected_yield):
                _issue(
                    publishability_issues,
                    "reinvestment_cash_yield_inconsistent",
                    identity,
                    "publishability",
                )

    universe_identities = {asset.identity for asset in universe}
    for asset in universe:
        if asset.row_data.get("metadataVerificationStatus") != "verified":
            continue
        candidate_row = actual_by_identity.get(asset.identity)
        if candidate_row is None:
            continue
        for field in (
            "exposureType",
            "underlyingTicker",
            "leverageMultiple",
            "direction",
            "resetFrequency",
            "exposureScope",
            "diversificationTier",
            "leverageRiskTier",
            "longTermSuitability",
            "portfolioWarningSeverity",
            "confirmationMode",
            "metadataVerificationSource",
            "metadataVerifiedBy",
            "metadataVerifiedAt",
            "metadataVerificationReason",
            "leverageWarningLabelKo",
            "officialSourceUrl",
            "referenceSourceUrl",
        ):
            if str(candidate_row.get(field) or "") != asset.row_data.get(field, ""):
                _issue(
                    structural_issues,
                    "leverage_registry_candidate_mismatch",
                    f"{asset.identity}.{field}",
                    "structural",
                )
    missing_universe_rows = sorted(
        universe_identities - set(actual_identities)
    )
    if missing_universe_rows:
        _issue(
            structural_issues,
            "universe_rows_missing",
            ",".join(missing_universe_rows[:20]),
            "structural",
        )

    if source is not None:
        source_identities = list(source.identities)
        missing_source_rows = [
            identity
            for identity in source_identities
            if identity not in actual_by_identity
        ]
        if missing_source_rows:
            _issue(
                structural_issues,
                "source_rows_removed",
                ",".join(missing_source_rows[:20]),
                "structural",
            )
        candidate_source_order = [
            identity
            for identity in actual_identities
            if identity in set(source_identities)
        ]
        if candidate_source_order != source_identities:
            _issue(
                structural_issues,
                "source_row_order_changed",
                "source identities must remain in original order",
                "structural",
            )
        source_by_identity = {
            row_identity(row): row for row in source.rows
        }
        for identity, source_row in source_by_identity.items():
            candidate_row = actual_by_identity.get(identity)
            if candidate_row is None:
                continue
            for field in source.headers:
                if field in CALCULATED_OR_OPERATIONAL_FIELDS:
                    continue
                source_value = str(source_row.get(field) or "")
                candidate_value = str(candidate_row.get(field) or "")
                if candidate_value != source_value:
                    _issue(
                        structural_issues,
                        "source_field_changed",
                        f"{identity}.{field}",
                        "structural",
                    )

    structural_valid = not structural_issues
    publishable = structural_valid and not publishability_issues
    issues = [*structural_issues, *publishability_issues]
    return {
        "valid": publishable,
        "validMeaning": "publishable",
        "structuralValid": structural_valid,
        "publishable": publishable,
        "asOfDate": as_of_date.isoformat(),
        "sourceRowCount": len(source.rows) if source else None,
        "outputRowCount": len(rows),
        "simulatorTargetRowCount": target_count,
        "simulatorReadyRowCount": ready_count,
        "marketCounts": dict(sorted(market_counts.items())),
        "structuralIssueCount": len(structural_issues),
        "publishabilityIssueCount": len(publishability_issues),
        "issueCount": len(issues),
        "issues": issues,
    }


def validate_candidate_file(
    path: Path | str,
    *,
    universe: list[UniverseAsset],
    as_of_date: date,
    source: CanonicalSource | None = None,
) -> dict[str, object]:
    candidate_path = Path(path)
    with candidate_path.open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        headers = list(reader.fieldnames or ())
    return validate_candidate_rows(
        rows,
        headers=headers,
        universe=universe,
        as_of_date=as_of_date,
        source=source,
    )


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a FINPLE full-schema canonical candidate CSV",
    )
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--source-canonical", required=True)
    parser.add_argument("--universe", required=True)
    parser.add_argument("--as-of", required=True)
    return parser.parse_args()


def main() -> None:
    from .universe import load_universe

    args = _parse_args()
    report = validate_candidate_file(
        args.candidate,
        universe=load_universe(args.universe),
        as_of_date=date.fromisoformat(args.as_of),
        source=load_canonical_source(args.source_canonical),
    )
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    if not report["valid"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
