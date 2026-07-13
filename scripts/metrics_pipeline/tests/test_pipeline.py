from __future__ import annotations

import csv
import json
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from scripts.metrics_pipeline import PipelineCriticalError, run_finple_monthly_metrics_pipeline


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "data" / "fixtures" / "monthly-metrics"


def build_config(output_dir: Path, **overrides):
    config = {
        "metric_base_date": "2026-06-30",
        "market_scope": ["US", "KR"],
        "selected_cagr_policy": "rolling_median_all_markets",
        "current_price_display": False,
        "total_return_cagr_mode": "reference_only",
        "output_version": "2026_06",
        "input_mode": "fixture",
        "input_dir": str(FIXTURE_DIR),
        "output_dir": str(output_dir),
        "deterministic_fixture": True,
        "random_seed": 1142,
    }
    config.update(overrides)
    return config


class MetricsPipelineTests(unittest.TestCase):
    def test_fixture_pipeline_creates_required_outputs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))

            self.assertTrue(result["ok"])
            self.assertTrue(result["publishReady"])
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            for path in outputs.values():
                self.assertTrue(path.exists(), path)

            with outputs["manifestJson"].open("r", encoding="utf-8") as handle:
                manifest = json.load(handle)
            self.assertEqual(manifest["pipelineVersion"], "metrics-v3.0-step114-2a")
            self.assertEqual(manifest["schemaVersion"], "metrics-csv-schema-v3")
            self.assertFalse(manifest["externalProviderCalls"])
            self.assertEqual({item["name"] for item in manifest["sourceFiles"]}, {"benchmark_map.csv", "candidates.csv", "monthly_prices.csv"})

            with ZipFile(outputs["zipPackage"]) as package:
                names = set(package.namelist())
            self.assertIn("finple_metrics_output_2026_06.csv", names)
            self.assertIn("finple_metrics_selected_2026_06.csv", names)
            self.assertIn("finple_metrics_review_required_2026_06.csv", names)
            self.assertIn("finple_metrics_audit_report_2026_06.html", names)
            self.assertIn("finple_metrics_manifest_2026_06.json", names)
            self.assertIn("finple_monthly_returns_2026_06.csv", names)

    def test_output_schema_review_split_and_kr_ticker_preservation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_rows = list(csv.DictReader(handle))
            with outputs["selectedCsv"].open("r", encoding="utf-8", newline="") as handle:
                selected_rows = list(csv.DictReader(handle))
            with outputs["reviewRequiredCsv"].open("r", encoding="utf-8", newline="") as handle:
                review_rows = list(csv.DictReader(handle))

            full_by_ticker = {row["ticker"]: row for row in full_rows}
            self.assertIn("069500", full_by_ticker)
            self.assertIn("005930", full_by_ticker)
            self.assertEqual(full_by_ticker["069500"]["ticker"], "069500")
            self.assertEqual(full_by_ticker["005930"]["ticker"], "005930")

            selected_tickers = {row["ticker"] for row in selected_rows}
            self.assertIn("SPY", selected_tickers)
            self.assertIn("069500", selected_tickers)
            self.assertNotIn("123456", selected_tickers)
            self.assertTrue(any(row["ticker"] == "123456" and row["issueType"] == "review_required" for row in review_rows))

            required_columns = {
                "ticker",
                "metricBaseDate",
                "selectedCagr",
                "selectedMdd",
                "selectedBeta",
                "dataStatus",
                "reviewFlag",
                "sourceHash",
            }
            self.assertTrue(required_columns.issubset(full_rows[0].keys()))

    def test_same_fixture_and_config_are_reproducible(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_finple_monthly_metrics_pipeline(build_config(Path(first_dir)))
            second = run_finple_monthly_metrics_pipeline(build_config(Path(second_dir)))

            first_outputs = {name: Path(path) for name, path in first["outputs"].items()}
            second_outputs = {name: Path(path) for name, path in second["outputs"].items()}
            for key in ["metricsOutputCsv", "selectedCsv", "reviewRequiredCsv", "monthlyReturnsCsv", "manifestJson", "zipPackage"]:
                self.assertEqual(first_outputs[key].read_bytes(), second_outputs[key].read_bytes(), key)

    def test_critical_validation_blocks_publish_ready_outputs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(PipelineCriticalError):
                run_finple_monthly_metrics_pipeline(
                    build_config(Path(temp_dir), monthly_prices_file="monthly_prices_invalid.csv")
                )

            self.assertFalse((Path(temp_dir) / "finple_monthly_metrics_2026_06_package.zip").exists())
            self.assertFalse((Path(temp_dir) / "finple_metrics_selected_2026_06.csv").exists())

    def test_policy_config_is_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(PipelineCriticalError):
                run_finple_monthly_metrics_pipeline(
                    build_config(Path(temp_dir), selected_cagr_policy="raw_10y", current_price_display=True)
                )


if __name__ == "__main__":
    unittest.main()
