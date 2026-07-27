from __future__ import annotations

import statistics
import unittest

from scripts.metrics_pipeline.review_approval_policy import (
    GAP_RECONCILIATION_MODE,
    GAPPED_HISTORY_POLICY_VERSION,
    LEVERAGED_POLICY_VERSION,
    _beta,
    _rolling_cagrs,
    evaluate_initial_history_gap_review,
    evaluate_leveraged_inverse_review,
    evaluate_review_approval,
)

SOURCE_HASH = "a" * 64
RAW_SOURCE_HASH = "b" * 64


def add_month(start: str, offset: int) -> str:
    year, month = (int(part) for part in start.split("-"))
    index = year * 12 + month - 1 + offset
    next_year, month_zero = divmod(index, 12)
    return f"{next_year:04d}-{month_zero + 1:02d}-28"


def monthly_rows(
    count: int,
    *,
    start: str = "2006-01",
    multiplier: float = 1.0,
) -> list[list[object]]:
    rows = []
    for index in range(count):
        benchmark_return = 0.008 + ((index % 7) - 3) * 0.004
        rows.append(
            [
                add_month(start, index),
                round(benchmark_return * multiplier, 8),
                round(benchmark_return * multiplier, 8),
                0.0,
                "USD",
                "US_SPY",
                "candidate",
                False,
                "",
            ]
        )
    return rows


def metric_row(
    rows: list[list[object]],
    benchmark: list[list[object]],
    *,
    identity: str = "US:GEARED",
    review_reason: str = (
        "selectedCagr outside automatic publish threshold; "
        "selectedMdd outside automatic publish threshold; "
        "selectedBeta outside automatic publish threshold"
    ),
) -> dict[str, object]:
    cagrs = _rolling_cagrs(rows, 120)
    selected_cagr = round(statistics.median(cagrs), 2)
    selected_beta = round(_beta(rows, benchmark), 4)
    return {
        "identity": identity,
        "ticker": identity.split(":", 1)[1],
        "assetType": "ETF",
        "rawPriceCoverageStatus": "covered",
        "dataStatus": "ready",
        "reviewFlag": "review_required",
        "reviewReason": review_reason,
        "cagrPolicy": "rolling_10y_median",
        "validRollingWindowCount10y": len(cagrs),
        "rollingCagr10yMedian": selected_cagr,
        "rollingCagr10yP25": selected_cagr - 2,
        "rollingCagr10yP75": selected_cagr + 2,
        "selectedCagr": selected_cagr,
        "selectedBeta": selected_beta,
        "selectedMdd": -85,
        "mddPolicy": "full_period_actual",
        "dataEndDate": rows[-1][0],
        "sourceHash": SOURCE_HASH,
        "normalizedSeriesHash": SOURCE_HASH,
        "rawSourceSha256": RAW_SOURCE_HASH,
    }


def product_metadata(
    *,
    identity: str = "US:GEARED",
    exposure_type: str = "leveraged_etf",
    leverage_multiple: float = 3,
    direction: str = "long",
) -> dict[str, object]:
    return {
        "identity": identity,
        "assetType": "ETF",
        "exposureType": exposure_type,
        "leverageMultiple": leverage_multiple,
        "direction": direction,
        "resetFrequency": "daily",
        "underlyingTicker": "INDEX",
        "inceptionDate": "2005-01-01",
        "sourceId": "issuer:fixture",
        "officialSourceUrl": "https://issuer.example/fund",
        "sourceCheckedAt": "2026-07-27",
    }


class LeveragedInverseReviewPolicyTest(unittest.TestCase):
    def test_long_daily_geared_metrics_are_reproduced_and_approved(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        decision = evaluate_leveraged_inverse_review(
            metric_row(asset, benchmark),
            asset,
            benchmark,
            product_metadata(),
        )

        self.assertTrue(decision.approved)
        self.assertEqual(decision.status, "ready")
        self.assertEqual(decision.policyVersion, LEVERAGED_POLICY_VERSION)
        self.assertEqual(decision.reasonCodes, ())
        self.assertEqual(decision.audit["validRollingWindowCount10y"], 101)
        self.assertEqual(
            decision.audit["highMetricExplanation"],
            "daily_reset_geared_product_characteristic",
        )
        self.assertEqual(decision.audit["selectedCagr"], metric_row(asset, benchmark)["selectedCagr"])
        self.assertEqual(decision.audit["selectedBeta"], metric_row(asset, benchmark)["selectedBeta"])
        self.assertEqual(decision.audit["selectedMdd"], -85)
        self.assertEqual(
            decision.audit["mddValidationMethod"],
            "source_overlay_full_period_actual_binding",
        )
        self.assertEqual(decision.audit["mddPolicy"], "full_period_actual")
        self.assertTrue(
            decision.audit["monthlyReturnProxyLineage"]["nonProxyProven"]
        )

    def test_proxy_lineage_contract_is_fail_closed(self) -> None:
        benchmark = monthly_rows(220)
        cases = []

        proxy = monthly_rows(220, multiplier=3)
        for row in proxy:
            row[7], row[8] = True, "QQQ"
        cases.append(("proxy_present", proxy, "unsupported_product_policy:proxy_monthly_return"))

        proxy_without_ticker = monthly_rows(220, multiplier=3)
        proxy_without_ticker[0][7] = True
        cases.append(
            (
                "proxy_without_ticker",
                proxy_without_ticker,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        ticker_without_proxy = monthly_rows(220, multiplier=3)
        ticker_without_proxy[0][8] = "QQQ"
        cases.append(
            (
                "ticker_without_proxy",
                ticker_without_proxy,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        missing_flag = monthly_rows(220, multiplier=3)
        missing_flag[0][7] = None
        cases.append(
            (
                "missing_proxy_flag",
                missing_flag,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        null_ticker = monthly_rows(220, multiplier=3)
        null_ticker[0][8] = None
        cases.append(
            (
                "null_proxy_ticker",
                null_ticker,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        string_flag = monthly_rows(220, multiplier=3)
        string_flag[0][7] = "false"
        cases.append(
            (
                "string_proxy_flag",
                string_flag,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        numeric_flag = monthly_rows(220, multiplier=3)
        numeric_flag[0][7] = 0
        cases.append(
            (
                "numeric_proxy_flag",
                numeric_flag,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        missing_lineage = [row[:7] for row in monthly_rows(220, multiplier=3)]
        cases.append(
            (
                "legacy_seven_field",
                missing_lineage,
                "missing_metric_lineage:monthly_return_proxy_status",
            )
        )

        partially_proxy = monthly_rows(220, multiplier=3)
        partially_proxy[-1][7], partially_proxy[-1][8] = True, "QQQ"
        cases.append(
            (
                "partially_proxy",
                partially_proxy,
                "unsupported_product_policy:proxy_monthly_return",
            )
        )

        mixed_proxy_ticker = monthly_rows(220, multiplier=3)
        mixed_proxy_ticker[0][7], mixed_proxy_ticker[0][8] = True, "QQQ"
        mixed_proxy_ticker[1][7], mixed_proxy_ticker[1][8] = True, "SPY"
        cases.append(
            (
                "mixed_proxy_ticker",
                mixed_proxy_ticker,
                "unsupported_product_policy:proxy_monthly_return",
            )
        )

        for label, asset, expected_reason in cases:
            with self.subTest(label=label):
                row = metric_row(asset, benchmark)
                decision = evaluate_leveraged_inverse_review(
                    row,
                    asset,
                    benchmark,
                    product_metadata(),
                )
                self.assertFalse(decision.approved)
                self.assertIn(expected_reason, decision.reasonCodes)
                if label == "proxy_present":
                    self.assertNotIn(
                        "missing_metric_lineage:monthly_return_proxy_status",
                        decision.reasonCodes,
                    )

    def test_non_proxy_tqqq_and_soxl_remain_approvable(self) -> None:
        benchmark = monthly_rows(220)
        for ticker in ("TQQQ", "SOXL"):
            with self.subTest(ticker=ticker):
                asset = monthly_rows(220, multiplier=3)
                decision = evaluate_leveraged_inverse_review(
                    metric_row(asset, benchmark, identity=f"US:{ticker}"),
                    asset,
                    benchmark,
                    product_metadata(identity=f"US:{ticker}"),
                )
                self.assertTrue(decision.approved)

    def test_inverse_direction_and_beta_sign_are_supported(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=-2)
        decision = evaluate_leveraged_inverse_review(
            metric_row(asset, benchmark),
            asset,
            benchmark,
            product_metadata(
                exposure_type="inverse_etf",
                leverage_multiple=2,
                direction="inverse",
            ),
        )

        self.assertTrue(decision.approved)
        self.assertLess(decision.audit["reproducedBeta"], 0)

    def test_invalid_metadata_remains_fail_closed(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        metadata = product_metadata()
        metadata["resetFrequency"] = "monthly"
        decision = evaluate_leveraged_inverse_review(
            metric_row(asset, benchmark),
            asset,
            benchmark,
            metadata,
        )

        self.assertFalse(decision.approved)
        self.assertEqual(decision.status, "invalid_metadata")
        self.assertIn("invalid_metadata:reset_frequency", decision.reasonCodes)

    def test_unrelated_manual_reason_is_not_cleared(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        row = metric_row(
            asset,
            benchmark,
            review_reason="selectedCagr outside automatic publish threshold; dividendYield outside automatic publish threshold",
        )
        decision = evaluate_leveraged_inverse_review(
            row,
            asset,
            benchmark,
            product_metadata(),
        )

        self.assertFalse(decision.approved)
        self.assertIn(
            "manual_review_required:reason_outside_product_policy",
            decision.reasonCodes,
        )

    def test_unexpected_review_flags_remain_fail_closed(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        for review_flag in ("error", "blocked", "pending", "unknown", "none", ""):
            with self.subTest(review_flag=review_flag):
                row = metric_row(asset, benchmark)
                row["reviewFlag"] = review_flag
                decision = evaluate_leveraged_inverse_review(
                    row,
                    asset,
                    benchmark,
                    product_metadata(),
                )
                self.assertFalse(decision.approved)
                self.assertIn(
                    "unsupported_metric_status:review_flag",
                    decision.reasonCodes,
                )

    def test_blank_review_reason_remains_fail_closed(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        decision = evaluate_leveraged_inverse_review(
            metric_row(asset, benchmark, review_reason=""),
            asset,
            benchmark,
            product_metadata(),
        )

        self.assertFalse(decision.approved)
        self.assertIn(
            "manual_review_required:reason_outside_product_policy",
            decision.reasonCodes,
        )

    def test_ready_none_row_is_not_reapproved(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        row = metric_row(asset, benchmark)
        row["reviewFlag"] = "none"
        decision = evaluate_leveraged_inverse_review(
            row,
            asset,
            benchmark,
            product_metadata(),
        )

        self.assertFalse(decision.approved)
        self.assertIn("unsupported_metric_status:review_flag", decision.reasonCodes)

    def test_metadata_contract_is_exact_and_fail_closed(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        cases = [
            ("identity", "US:OTHER", "invalid_metadata:identity_mismatch"),
            ("assetType", "STOCK", "invalid_metadata:metric_asset_type_mismatch"),
            ("sourceCheckedAt", "2026/07/27", "invalid_metadata:source_checked_at"),
            ("officialSourceUrl", "http://issuer.example/fund", "invalid_metadata:official_source_url"),
            ("inceptionDate", "2005/01/01", "invalid_metadata:inception_date"),
        ]
        for field, value, reason in cases:
            with self.subTest(field=field):
                metadata = product_metadata()
                metadata[field] = value
                decision = evaluate_leveraged_inverse_review(
                    metric_row(asset, benchmark),
                    asset,
                    benchmark,
                    metadata,
                )
                self.assertFalse(decision.approved)
                self.assertIn(reason, decision.reasonCodes)

    def test_mdd_requires_source_binding_without_claiming_reproduction(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        row = metric_row(asset, benchmark)
        row["mddPolicy"] = "unknown"
        row["sourceHash"] = "not-a-sha"
        decision = evaluate_leveraged_inverse_review(
            row,
            asset,
            benchmark,
            product_metadata(),
        )

        self.assertFalse(decision.approved)
        self.assertIn("unsupported_metric_status:mdd_policy", decision.reasonCodes)
        self.assertIn("missing_metric_lineage:sourceHash", decision.reasonCodes)
        self.assertNotIn("reproducedMdd", decision.audit)

    def test_dividend_zero_state_is_outside_metric_approval(self) -> None:
        benchmark = monthly_rows(220)
        asset = monthly_rows(220, multiplier=3)
        row = metric_row(asset, benchmark)
        row.update({"dividendYield": 0, "dividendStatus": "confirmed_value"})
        decision = evaluate_leveraged_inverse_review(
            row,
            asset,
            benchmark,
            product_metadata(),
        )

        self.assertTrue(decision.approved)
        self.assertEqual(row["dividendStatus"], "confirmed_value")
        self.assertEqual(row["dividendYield"], 0)


class InitialHistoryGapReviewPolicyTest(unittest.TestCase):
    def make_gap_fixture(
        self,
        *,
        prefix_count: int = 1,
        missing_count: int = 24,
        tail_count: int = 205,
        actual_return_gap_extra: int = 0,
        actual_return_gap_start_offset: int = 0,
    ) -> tuple[dict[str, object], list[list[object]], list[list[object]]]:
        actual_return_gap_count = missing_count + 1 + actual_return_gap_extra
        actual_gap_start = prefix_count + actual_return_gap_start_offset
        benchmark = monthly_rows(actual_gap_start + actual_return_gap_count + tail_count)
        asset = (
            benchmark[:actual_gap_start]
            + benchmark[
                actual_gap_start
                + actual_return_gap_count : actual_gap_start
                + actual_return_gap_count
                + tail_count
            ]
        )
        row = metric_row(
            asset,
            benchmark,
            identity="KR:GAPPED",
            review_reason=(
                f"KR:GAPPED has {missing_count} missing calendar month(s) "
                "(2006-02, ... 2008-01); observed rows are preserved, "
                "no forward fill is applied, and rolling CAGR/monthly returns "
                "crossing a gap are excluded."
            ),
        )
        gap_start = add_month("2006-01", prefix_count)[:7]
        gap_end = add_month("2006-01", prefix_count + missing_count - 1)[:7]
        row["dataStatus"] = "review_required"
        row["reviewReason"] = (
            f"KR:GAPPED has {missing_count} missing calendar month(s) "
            f"({gap_start}, ... {gap_end}); observed rows are preserved, "
            "no forward fill is applied, and rolling CAGR/monthly returns "
            "crossing a gap are excluded."
        )
        row["selectedMdd"] = -35
        return row, asset, benchmark

    def test_bounded_initial_gap_is_approved_with_audit(self) -> None:
        row, asset, benchmark = self.make_gap_fixture()
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertTrue(decision.approved)
        self.assertEqual(decision.policyVersion, GAPPED_HISTORY_POLICY_VERSION)
        self.assertEqual(decision.audit["sourceReportedPriceGapCount"], 24)
        self.assertEqual(decision.audit["expectedMonthlyReturnGapCount"], 25)
        self.assertEqual(decision.audit["actualMonthlyReturnGapCount"], 25)
        self.assertEqual(
            decision.audit["expectedMonthlyReturnGapEnd"],
            decision.audit["actualMonthlyReturnGapEnd"],
        )
        self.assertEqual(
            decision.audit["gapReconciliationMode"],
            GAP_RECONCILIATION_MODE,
        )
        self.assertEqual(decision.audit["continuousPostGapMonthCount"], 205)
        self.assertTrue(decision.audit["noForwardFillVerified"])
        self.assertTrue(decision.audit["windowsCrossingGapExcluded"])
        self.assertEqual(decision.audit["selectedMdd"], -35)
        self.assertEqual(
            decision.audit["mddValidationMethod"],
            "source_overlay_full_period_actual_binding",
        )

    def test_twenty_five_month_price_gap_maps_to_twenty_six_return_months(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(missing_count=25)
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertTrue(decision.approved)
        self.assertEqual(decision.audit["sourceReportedPriceGapCount"], 25)
        self.assertEqual(decision.audit["expectedMonthlyReturnGapCount"], 26)
        self.assertEqual(decision.audit["actualMonthlyReturnGapCount"], 26)

    def test_more_severe_initial_gap_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(missing_count=48)
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "unsupported_product_policy:initial_gap_too_large",
            decision.reasonCodes,
        )

    def test_mid_history_gap_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(prefix_count=24)
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "unsupported_product_policy:mid_history_gap",
            decision.reasonCodes,
        )

    def test_insufficient_contiguous_tail_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(tail_count=150)
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "insufficient_history:continuous_post_gap_months",
            decision.reasonCodes,
        )

    def test_return_gap_larger_than_expected_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(actual_return_gap_extra=1)
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertEqual(decision.audit["expectedMonthlyReturnGapCount"], 25)
        self.assertEqual(decision.audit["actualMonthlyReturnGapCount"], 26)
        self.assertIn(
            "inconsistent_metric:reported_gap_metadata",
            decision.reasonCodes,
        )

    def test_return_gap_start_mismatch_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(
            actual_return_gap_start_offset=1,
        )
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertNotEqual(
            decision.audit["expectedMonthlyReturnGapStart"],
            decision.audit["actualMonthlyReturnGapStart"],
        )
        self.assertIn(
            "inconsistent_metric:reported_gap_metadata",
            decision.reasonCodes,
        )

    def test_return_gap_end_mismatch_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture(
            prefix_count=2,
            actual_return_gap_start_offset=-1,
        )
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertNotEqual(
            decision.audit["expectedMonthlyReturnGapEnd"],
            decision.audit["actualMonthlyReturnGapEnd"],
        )
        self.assertIn(
            "inconsistent_metric:reported_gap_metadata",
            decision.reasonCodes,
        )

    def test_malformed_gap_months_are_held_without_parser_error(self) -> None:
        row, asset, benchmark = self.make_gap_fixture()
        row["reviewReason"] = str(row["reviewReason"]).replace(
            "(2006-02, ... 2008-01)",
            "(200602, ... 200801)",
        )
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "manual_review_required:reason_outside_gap_policy",
            decision.reasonCodes,
        )

    def test_multiple_monthly_return_gaps_are_held(self) -> None:
        benchmark = monthly_rows(260)
        asset = benchmark[:1] + benchmark[26:100] + benchmark[102:]
        row = metric_row(
            asset,
            benchmark,
            identity="KR:GAPPED",
            review_reason=(
                "KR:GAPPED has 24 missing calendar month(s) "
                "(2006-02, ... 2008-01); observed rows are preserved, "
                "no forward fill is applied, and rolling CAGR/monthly returns "
                "crossing a gap are excluded."
            ),
        )
        row["dataStatus"] = "review_required"
        row["selectedMdd"] = -35

        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "unsupported_product_policy:gap_count",
            decision.reasonCodes,
        )

    def test_forward_filled_monthly_return_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture()
        asset[-1][6] = "forward_fill"
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "unsupported_product_policy:forward_fill_detected",
            decision.reasonCodes,
        )

    def test_gap_reason_with_unrelated_reason_is_held(self) -> None:
        row, asset, benchmark = self.make_gap_fixture()
        row["reviewReason"] = f"{row['reviewReason']}; unrelated review reason"
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn(
            "manual_review_required:reason_outside_gap_policy",
            decision.reasonCodes,
        )

    def test_gap_review_requires_exact_state(self) -> None:
        row, asset, benchmark = self.make_gap_fixture()
        row["reviewFlag"] = "error"
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertFalse(decision.approved)
        self.assertIn("unsupported_metric_status:review_flag", decision.reasonCodes)

    def test_general_ready_asset_is_not_applicable(self) -> None:
        benchmark = monthly_rows(220)
        row = metric_row(benchmark, benchmark, identity="US:QQQ", review_reason="")
        row["reviewFlag"] = "none"
        decision = evaluate_review_approval(row, benchmark, benchmark)

        self.assertFalse(decision.applicable)
        self.assertEqual(decision.status, "not_applicable")


if __name__ == "__main__":
    unittest.main()
