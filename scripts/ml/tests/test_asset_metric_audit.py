from __future__ import annotations

import unittest
from pathlib import Path
import sys


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from audit_asset_metrics import evaluate_asset_row, read_json  # noqa: E402


CONFIG = read_json(SCRIPT_DIR / "config" / "asset_quality_rules.json")


def base_row(**overrides):
    row = {
        "market": "US",
        "ticker": "QQQ",
        "nameKr": "Invesco QQQ Trust",
        "assetType": "ETF",
        "expectedCagr": "12.5",
        "priceCagr10y": "12.5",
        "beta": "1.1",
        "mdd": "-35.0",
        "dataYears": "9.99",
        "dividendYield": "0.65",
        "metricsStatus": "ready",
        "dividendPolicy": "dividend_confirmed",
    }
    row.update(overrides)
    return row


class AssetMetricAuditTests(unittest.TestCase):
    def codes_for(self, row):
        result = evaluate_asset_row(row, CONFIG)
        return set(result["reasonCodes"].split("|")) if result["reasonCodes"] else set()

    def test_valid_asset_passes_without_reasons(self):
        result = evaluate_asset_row(base_row(), CONFIG)

        self.assertEqual(result["status"], "valid")
        self.assertEqual(result["qualityScore"], 100)
        self.assertEqual(result["reasonCodes"], "")

    def test_short_history_is_warning(self):
        result = evaluate_asset_row(base_row(dataYears="2.4", metricsStatus="short_history"), CONFIG)

        self.assertEqual(result["status"], "warning")
        self.assertIn("SHORT_HISTORY", result["reasonCodes"])
        self.assertEqual(result["warningCount"], 1)

    def test_review_asset_collects_missing_beta_and_dividend_review(self):
        codes = self.codes_for(
            base_row(beta="", dividendYield="", dividendPolicy="dividend_review_required")
        )

        self.assertIn("BETA_MISSING", codes)
        self.assertIn("DIVIDEND_REVIEW_REQUIRED", codes)
        self.assertIn("DIVIDEND_MISSING", codes)

    def test_invalid_mdd_positive_and_kr_ticker_format(self):
        result = evaluate_asset_row(
            base_row(market="KR", ticker="1234", mdd="5.0"),
            CONFIG,
        )

        self.assertEqual(result["status"], "invalid")
        self.assertIn("TICKER_FORMAT", result["reasonCodes"])
        self.assertIn("MDD_POSITIVE", result["reasonCodes"])
        self.assertGreaterEqual(result["errorCount"], 2)

    def test_confirmed_zero_dividend_is_not_missing(self):
        codes = self.codes_for(
            base_row(dividendYield="0", dividendPolicy="no_dividend_confirmed")
        )

        self.assertIn("DIVIDEND_CONFIRMED_ZERO", codes)
        self.assertNotIn("DIVIDEND_MISSING", codes)

    def test_extreme_numeric_values_are_reviewed(self):
        codes = self.codes_for(
            base_row(expectedCagr="120", beta="5.2", dividendYield="30")
        )

        self.assertIn("CAGR_EXTREME", codes)
        self.assertIn("BETA_EXTREME", codes)
        self.assertIn("DIVIDEND_EXTREME", codes)


if __name__ == "__main__":
    unittest.main()
