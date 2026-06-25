from __future__ import annotations

import unittest
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from run_asset_anomaly_experiment import build_feature_stats, score_asset_row, read_json  # noqa: E402


CONFIG = read_json(SCRIPT_DIR / "config" / "asset_anomaly_experiment.json")


def row(ticker, expected_cagr, beta, mdd, data_years, dividend_yield, market="US", asset_type="ETF"):
    return {
        "market": market,
        "ticker": ticker,
        "nameKr": ticker,
        "assetType": asset_type,
        "expectedCagr": str(expected_cagr),
        "beta": str(beta),
        "mdd": str(mdd),
        "dataYears": str(data_years),
        "dividendYield": str(dividend_yield),
    }


class AssetAnomalyExperimentTests(unittest.TestCase):
    def test_outlier_scores_higher_than_baseline_asset(self):
        rows = [
            row("AAA", 5, 1.0, -20, 9, 2),
            row("BBB", 6, 1.1, -21, 8, 2.2),
            row("CCC", 4.8, 0.9, -19, 10, 1.8),
            row("DDD", 5.2, 1.0, -22, 9, 2.1),
            row("OUT", 80, 4.5, -95, 2, 40),
        ]
        config = dict(CONFIG)
        config["minimum_group_size"] = 1
        stats = build_feature_stats(rows, config)

        normal = score_asset_row(rows[0], stats, config)
        outlier = score_asset_row(rows[-1], stats, config)

        self.assertGreater(outlier["mlAnomalyScore"], normal["mlAnomalyScore"])
        self.assertEqual(outlier["mlAnomalyStatus"], "ml_review")

    def test_missing_features_are_imputed_and_reported(self):
        rows = [
            row("AAA", 5, 1.0, -20, 9, 2),
            row("BBB", 6, 1.1, -21, 8, 2.2),
            row("MISS", 5.5, 1.0, -20, 9, ""),
        ]
        config = dict(CONFIG)
        config["minimum_group_size"] = 1
        stats = build_feature_stats(rows, config)

        scored = score_asset_row(rows[-1], stats, config)

        self.assertIn("dividendYield", scored["mlImputedFields"])
        self.assertIn("dividendYield", scored["mlFeatureZScores"])


if __name__ == "__main__":
    unittest.main()
