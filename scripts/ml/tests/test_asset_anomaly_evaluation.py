from __future__ import annotations

import sys
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from evaluate_asset_anomaly_model import build_disagreement_sample, build_evaluation  # noqa: E402


def row(ticker, rule_status, ml_status, score="1.0", market="US", asset_type="ETF"):
    return {
        "market": market,
        "ticker": ticker,
        "nameKr": ticker,
        "assetType": asset_type,
        "status": rule_status,
        "reasonCodes": "TEST_REASON" if rule_status == "review" else "",
        "mlAnomalyScore": score,
        "mlAnomalyStatus": ml_status,
        "mlTopFeature": "expectedCagr",
        "mlTopFeatureZ": score,
    }


class AssetAnomalyEvaluationTests(unittest.TestCase):
    def test_evaluation_counts_rule_and_ml_overlap(self):
        rows = [
            row("A", "review", "ml_review"),
            row("B", "valid", "ml_review"),
            row("C", "review", "ml_normal"),
            row("D", "warning", "ml_watch"),
        ]

        summary = build_evaluation(rows, "test.csv")

        self.assertEqual(summary["rowCount"], 4)
        self.assertEqual(summary["counts"]["ruleActionable"], 2)
        self.assertEqual(summary["counts"]["mlReview"], 2)
        self.assertEqual(summary["counts"]["mlWatchOrReview"], 3)
        self.assertEqual(summary["counts"]["ruleAndMlReviewOverlap"], 1)
        self.assertEqual(summary["counts"]["mlFlaggedRuleNonActionable"], 2)
        self.assertEqual(summary["counts"]["ruleActionableMlNormal"], 1)
        self.assertEqual(summary["proxyMetrics"]["mlReviewProxyPrecisionVsRuleActionable"], 0.5)

    def test_disagreement_sample_prioritizes_high_scores(self):
        rows = [
            row("LOW", "valid", "ml_review", "2.0"),
            row("HIGH", "warning", "ml_review", "9.0"),
            row("MATCH", "review", "ml_review", "50.0"),
        ]

        sample = build_disagreement_sample(rows)

        self.assertEqual(sample[0]["ticker"], "HIGH")
        self.assertEqual(sample[0]["disagreementType"], "ml_flagged_rule_non_actionable")
        self.assertEqual(len(sample), 2)


if __name__ == "__main__":
    unittest.main()
