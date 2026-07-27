from __future__ import annotations

import statistics
import unittest

from scripts.metrics_pipeline.review_approval_policy import (
    GAPPED_HISTORY_POLICY_VERSION,
    LEVERAGED_POLICY_VERSION,
    _beta,
    _rolling_cagrs,
    evaluate_initial_history_gap_review,
    evaluate_leveraged_inverse_review,
    evaluate_review_approval,
)


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
        "dataEndDate": rows[-1][0],
        "sourceHash": "source",
        "normalizedSeriesHash": "normalized",
        "rawSourceSha256": "raw",
    }


def product_metadata(
    *,
    exposure_type: str = "leveraged_etf",
    leverage_multiple: float = 3,
    direction: str = "long",
) -> dict[str, object]:
    return {
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
    ) -> tuple[dict[str, object], list[list[object]], list[list[object]]]:
        benchmark = monthly_rows(prefix_count + missing_count + tail_count)
        asset = (
            benchmark[:prefix_count]
            + benchmark[prefix_count + missing_count : prefix_count + missing_count + tail_count]
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
        row["selectedMdd"] = -35
        return row, asset, benchmark

    def test_bounded_initial_gap_is_approved_with_audit(self) -> None:
        row, asset, benchmark = self.make_gap_fixture()
        decision = evaluate_initial_history_gap_review(row, asset, benchmark)

        self.assertTrue(decision.approved)
        self.assertEqual(decision.policyVersion, GAPPED_HISTORY_POLICY_VERSION)
        self.assertEqual(decision.audit["excludedMonthlyReturnGapCount"], 24)
        self.assertEqual(decision.audit["continuousPostGapMonthCount"], 205)
        self.assertTrue(decision.audit["noForwardFillVerified"])
        self.assertTrue(decision.audit["windowsCrossingGapExcluded"])

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

    def test_general_ready_asset_is_not_applicable(self) -> None:
        benchmark = monthly_rows(220)
        row = metric_row(benchmark, benchmark, identity="US:QQQ", review_reason="")
        row["reviewFlag"] = "none"
        decision = evaluate_review_approval(row, benchmark, benchmark)

        self.assertFalse(decision.applicable)
        self.assertEqual(decision.status, "not_applicable")


if __name__ == "__main__":
    unittest.main()
