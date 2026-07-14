from __future__ import annotations

import csv
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

from scripts.metrics_pipeline import PipelineCriticalError, run_finple_monthly_metrics_pipeline
from scripts.metrics_pipeline.adapters import run_source_adapter, validate_adapter_result
from scripts.metrics_pipeline.config import load_config


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
            self.assertTrue(result["fixturePackageReady"])
            self.assertFalse(result["productionPublishReady"])
            self.assertFalse(result["appExportApproved"])
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            for path in outputs.values():
                self.assertTrue(path.exists(), path)

            with outputs["manifestJson"].open("r", encoding="utf-8") as handle:
                manifest = json.load(handle)
            self.assertEqual(manifest["pipelineVersion"], "metrics-v3.0-step114-2c")
            self.assertEqual(manifest["schemaVersion"], "metrics-csv-schema-v3")
            self.assertFalse(manifest["externalProviderCalls"])
            self.assertTrue(manifest["fixturePackageReady"])
            self.assertFalse(manifest["productionPublishReady"])
            self.assertFalse(manifest["appExportApproved"])
            self.assertIn("sourceAdapter", manifest)
            self.assertEqual(manifest["sourceAdapter"]["adapterId"], "finple.raw_daily_fixture.v1")
            self.assertEqual(manifest["sourceAdapter"]["adapterVersion"], "source-adapter-contract-v1-step114-2c")
            self.assertEqual(manifest["sourceAdapter"]["mode"], "fixture")
            self.assertEqual(manifest["sourceAdapter"]["sourceFileName"], "raw_daily_prices.csv")
            self.assertTrue(manifest["sourceAdapter"]["internalUseAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["publicationAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["redistributionAllowed"])
            self.assertEqual(
                {item["name"] for item in manifest["sourceFiles"]},
                {"benchmark_map.csv", "candidates.csv", "monthly_prices.csv", "raw_daily_prices.csv"},
            )
            self.assertIn("sourceMetadata", manifest)
            self.assertEqual(manifest["sourceMetadata"][0]["sourceFileName"], "raw_daily_prices.csv")
            self.assertEqual(manifest["sourceMetadata"][0]["sourceId"], "mixed_or_review_required")
            self.assertEqual(manifest["sourceMetadata"][0]["providerOrInstitution"], "FINPLE synthetic fixture")
            self.assertGreater(len(manifest["sourceMetadata"][0]["sources"]), 1)
            self.assertFalse(manifest["sourceMetadata"][0]["publicationAllowed"])
            self.assertFalse(manifest["sourceMetadata"][0]["redistributionAllowed"])

            with ZipFile(outputs["zipPackage"]) as package:
                names = set(package.namelist())
            self.assertIn("finple_metrics_output_2026_06.csv", names)
            self.assertIn("finple_metrics_selected_2026_06.csv", names)
            self.assertIn("finple_metrics_review_required_2026_06.csv", names)
            self.assertIn("finple_metrics_audit_report_2026_06.html", names)
            self.assertIn("finple_metrics_manifest_2026_06.json", names)
            self.assertIn("finple_monthly_returns_2026_06.csv", names)
            self.assertIn("finple_normalized_month_end_2026_06.csv", names)
            self.assertIn("finple_timeseries_audit_2026_06.csv", names)
            self.assertIn("finple_source_adapter_summary_2026_06.json", names)
            self.assertIn("finple_source_adapter_checkpoint_2026_06.json", names)

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
                "rollingCagr10yWindowCount",
                "rollingCagr5yWindowCount",
                "dividendStatus",
                "dataStatus",
                "reviewFlag",
                "sourceHash",
            }
            self.assertTrue(required_columns.issubset(full_rows[0].keys()))

    def test_continuous_monthly_fixture_and_exact_rolling_window_counts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_by_ticker = {row["ticker"]: row for row in csv.DictReader(handle)}
            self.assertEqual(full_by_ticker["SPY"]["rollingCagr10yWindowCount"], "1")
            self.assertEqual(full_by_ticker["SPY"]["rollingCagr5yWindowCount"], "61")
            self.assertEqual(full_by_ticker["069500"]["rollingCagr10yWindowCount"], "1")
            self.assertEqual(full_by_ticker["123456"]["rollingCagr10yWindowCount"], "0")
            self.assertEqual(full_by_ticker["123456"]["rollingCagr5yWindowCount"], "0")

            with (FIXTURE_DIR / "monthly_prices.csv").open("r", encoding="utf-8", newline="") as handle:
                price_rows = list(csv.DictReader(handle))
            spy_months = [row["month"] for row in price_rows if row["ticker"] == "SPY"]
            short_months = [row["month"] for row in price_rows if row["ticker"] == "123456"]
            self.assertEqual(len(spy_months), 121)
            self.assertEqual(spy_months[0], "2016-06-30")
            self.assertEqual(spy_months[-1], "2026-06-30")
            self.assertEqual(len(short_months), 36)

            spy_prices = [float(row["close"]) for row in price_rows if row["ticker"] == "SPY"]
            pre_drop_peak = max(spy_prices[:42])
            trough = min(spy_prices[42:45])
            post_recovery = max(spy_prices[45:80])
            self.assertLess(trough, pre_drop_peak * 0.8)
            self.assertGreater(post_recovery, trough * 1.2)

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

    def test_ttm_dividend_status_keeps_missing_zero_and_value_distinct(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_by_ticker = {row["ticker"]: row for row in csv.DictReader(handle)}
            self.assertEqual(full_by_ticker["SPY"]["dividendStatus"], "confirmed_value")
            self.assertNotEqual(full_by_ticker["SPY"]["dividendYield"], "")
            self.assertEqual(full_by_ticker["QQQ"]["dividendStatus"], "confirmed_zero")
            self.assertEqual(full_by_ticker["QQQ"]["dividendYield"], "0.00")
            self.assertEqual(full_by_ticker["MSFT"]["dividendStatus"], "missing")
            self.assertEqual(full_by_ticker["MSFT"]["dividendYield"], "")

    def test_policy_config_is_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(PipelineCriticalError):
                run_finple_monthly_metrics_pipeline(
                    build_config(Path(temp_dir), selected_cagr_policy="raw_10y", current_price_display=True)
                )

    def test_daily_to_month_end_selects_last_valid_observation_and_preserves_kr_tickers(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))

            by_ticker_month = {(row["ticker"], row["month"]): row for row in rows}
            self.assertEqual(by_ticker_month[("SPY", "2026-01-31")]["sourceDate"], "2026-01-30")
            self.assertEqual(by_ticker_month[("SPY", "2026-02-28")]["sourceDate"], "2026-02-27")
            self.assertEqual(by_ticker_month[("005930", "2026-01-31")]["ticker"], "005930")
            self.assertEqual(by_ticker_month[("069500", "2026-01-31")]["priceSeriesClassification"], "total_return_adjusted")

    def test_timeseries_audit_blocks_bad_rows_without_forward_fill_or_app_approval(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["timeseriesAuditCsv"].open("r", encoding="utf-8", newline="") as handle:
                audit_rows = list(csv.DictReader(handle))
            issue_types = {row["issueType"] for row in audit_rows}

            for expected in [
                "missing_calendar_month",
                "duplicate_date",
                "non_positive_price",
                "non_monotonic_date_order",
                "malformed_or_missing_date",
                "missing_required_price_basis",
                "inconsistent_currency",
                "inconsistent_market_ticker_identifier",
                "implausible_split_factor",
                "corporate_action_inconsistency",
                "ambiguous_adjustment_basis",
                "invalid_provenance_publication_policy",
                "duplicate_corporate_action_entry",
            ]:
                self.assertIn(expected, issue_types)

            blocking_rows = [row for row in audit_rows if row["blocksPublication"] == "true"]
            self.assertGreaterEqual(len(blocking_rows), 10)
            self.assertTrue(result["fixturePackageReady"])
            self.assertFalse(result["productionPublishReady"])
            self.assertFalse(result["appExportApproved"])

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                normalized_rows = list(csv.DictReader(handle))
            missing_month_rows = [row for row in normalized_rows if row["ticker"] == "MISSING"]
            self.assertEqual([row["month"] for row in missing_month_rows], ["2026-01-31", "2026-03-31"])
            normalized_tickers = {row["ticker"] for row in normalized_rows}
            self.assertNotIn("DUPONLY", normalized_tickers)
            self.assertNotIn("REVONLY", normalized_tickers)
            self.assertNotIn("CORPONLY", normalized_tickers)

    def test_adjustment_basis_and_corporate_action_audit_are_explicit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                normalized = list(csv.DictReader(handle))
            classifications = {row["ticker"]: row["priceSeriesClassification"] for row in normalized}
            self.assertEqual(classifications["NOACT"], "raw_close")
            self.assertEqual(classifications["SPLT"], "split_adjusted")
            self.assertEqual(classifications["DIVD"], "split_adjusted")
            self.assertEqual(classifications["069500"], "total_return_adjusted")
            self.assertNotIn("AMBIG", classifications)

            with outputs["timeseriesAuditCsv"].open("r", encoding="utf-8", newline="") as handle:
                audit_rows = list(csv.DictReader(handle))
            self.assertTrue(any(row["ticker"] == "SPLT" and row["issueType"] == "valid_stock_split" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "DIVD" and row["issueType"] == "cash_dividend" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "AMBIG" and row["priceSeriesClassification"] == "ambiguous" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "DUPONLY" and row["issueType"] == "duplicate_date" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "REVONLY" and row["issueType"] == "non_monotonic_date_order" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "CORPONLY" and row["issueType"] == "corporate_action_inconsistency" for row in audit_rows))

    def test_provenance_hashes_are_deterministic_and_raw_fixture_is_immutable(self):
        raw_fixture = FIXTURE_DIR / "raw_daily_prices.csv"
        before = raw_fixture.read_bytes()

        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_finple_monthly_metrics_pipeline(build_config(Path(first_dir)))
            second = run_finple_monthly_metrics_pipeline(build_config(Path(second_dir)))

            first_manifest = json.loads(Path(first["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
            second_manifest = json.loads(Path(second["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
            first_raw = next(item for item in first_manifest["sourceFiles"] if item["name"] == "raw_daily_prices.csv")
            second_raw = next(item for item in second_manifest["sourceFiles"] if item["name"] == "raw_daily_prices.csv")
            self.assertEqual(first_raw["sourceSha256"], second_raw["sourceSha256"])
            self.assertEqual(first_manifest["sourceMetadata"][0]["sourceSha256"], second_manifest["sourceMetadata"][0]["sourceSha256"])
            self.assertEqual(first_manifest["sourceMetadata"][0]["sourceId"], "mixed_or_review_required")
            self.assertEqual(first_manifest["sourceMetadata"][0]["retrievedAt"], "2026-07-14T00:00:00+09:00")
            self.assertEqual(first_manifest["sourceMetadata"][0]["sources"], second_manifest["sourceMetadata"][0]["sources"])
            source_ids = [entry["sourceId"] for entry in first_manifest["sourceMetadata"][0]["sources"]]
            self.assertEqual(source_ids, sorted(source_ids))
            self.assertIn("fixture_daily_duplicate_only", source_ids)
            self.assertIn("fixture_daily_reverse_only", source_ids)
            self.assertIn("fixture_daily_corporate_action_only", source_ids)

        self.assertEqual(raw_fixture.read_bytes(), before)

    def test_manual_upload_adapter_contract_and_sanitized_artifacts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir), input_mode="manual_upload")
            )
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            manifest = json.loads(outputs["manifestJson"].read_text(encoding="utf-8"))
            self.assertEqual(manifest["sourceAdapter"]["adapterId"], "finple.manual_upload_csv.v1")
            self.assertEqual(manifest["sourceAdapter"]["mode"], "manual_upload")
            self.assertEqual(manifest["sourceAdapter"]["sourceFileName"], "manual_upload_raw_daily_prices.csv")
            self.assertTrue(manifest["sourceAdapter"]["internalUseAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["publicationAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["redistributionAllowed"])
            self.assertTrue(manifest["fixturePackageReady"])
            self.assertFalse(manifest["productionPublishReady"])
            self.assertFalse(manifest["appExportApproved"])

            artifact_text = "\n".join(
                path.read_text(encoding="utf-8")
                for path in [
                    outputs["manifestJson"],
                    outputs["sourceAdapterSummaryJson"],
                    outputs["sourceAdapterCheckpointJson"],
                    outputs["normalizedMonthEndCsv"],
                    outputs["timeseriesAuditCsv"],
                ]
            )
            self.assertNotIn("C:\\Users\\owner", artifact_text)
            self.assertNotIn("serviceKey=SHOULD_NOT_LEAK", artifact_text)
            self.assertIn("[REDACTED_LOCAL_PATH]", artifact_text)
            self.assertIn("[REDACTED_SECRET]", artifact_text)

            with ZipFile(outputs["zipPackage"]) as package:
                zip_payload = "\n".join(package.read(name).decode("utf-8") for name in package.namelist())
            self.assertNotIn("C:\\Users\\owner", zip_payload)
            self.assertNotIn("serviceKey=SHOULD_NOT_LEAK", zip_payload)

    def test_manual_upload_fail_closed_gates_block_normalization(self):
        blocked_files = [
            "manual_upload_bad_header.csv",
            "manual_upload_empty.csv",
            "manual_upload_unknown_license.csv",
            "manual_upload_internal_use_blocked.csv",
            "manual_upload_row_mismatch.csv",
            "manual_upload_malformed_csv.csv",
        ]
        for file_name in blocked_files:
            with self.subTest(file_name=file_name), tempfile.TemporaryDirectory() as temp_dir:
                with self.assertRaises(PipelineCriticalError):
                    run_finple_monthly_metrics_pipeline(
                        build_config(Path(temp_dir), input_mode="manual_upload", manual_upload_file=file_name)
                    )
                self.assertFalse((Path(temp_dir) / "finple_monthly_metrics_2026_06_package.zip").exists())

    def test_manual_upload_invalid_encoding_is_adapter_level_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = Path(temp_dir) / "inputs"
            input_dir.mkdir()
            for file_name in ["candidates.csv", "benchmark_map.csv", "monthly_prices.csv"]:
                shutil.copy2(FIXTURE_DIR / file_name, input_dir / file_name)
            (input_dir / "manual_upload_invalid_encoding.csv").write_bytes(b"\xff\xfe\x00\x00not-utf8")

            config = build_config(
                Path(temp_dir) / "outputs",
                input_mode="manual_upload",
                input_dir=str(input_dir),
                manual_upload_file="manual_upload_invalid_encoding.csv",
            )
            adapter_result = run_source_adapter(load_config(config))
            self.assertIn("source adapter invalid encoding blocked", "; ".join(adapter_result.warnings))
            with self.assertRaisesRegex(PipelineCriticalError, "source adapter produced no accepted rows"):
                run_finple_monthly_metrics_pipeline(config)

    def test_public_source_provider_shaped_mapping_preserves_kr_etf_leading_zero(self):
        config = load_config(build_config(Path("unused"), input_mode="public_source_fixture"))
        adapter_result = run_source_adapter(config)
        self.assertFalse(validate_adapter_result(adapter_result))
        self.assertEqual(adapter_result.adapterId, "finple.synthetic_public_source_fixture.v1")
        rows_by_ticker = {row["ticker"]: row for row in adapter_result.rows}

        self.assertIn("005930", rows_by_ticker)
        self.assertIn("000660", rows_by_ticker)
        self.assertIn("069500", rows_by_ticker)
        self.assertEqual(rows_by_ticker["069500"]["ticker"], "069500")
        self.assertEqual(rows_by_ticker["069500"]["totalReturnAdjustedClose"], "33100")
        self.assertEqual(rows_by_ticker["069500"]["priceAdjustmentBasis"], "total_return_adjusted")
        self.assertTrue(rows_by_ticker["069500"]["sourceId"].startswith("public_fixture:kr_securities_product:"))
        self.assertEqual(rows_by_ticker["005930"]["splitAdjustedClose"], rows_by_ticker["005930"]["close"])

    def test_public_source_unsupported_provider_shape_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaisesRegex(PipelineCriticalError, "source adapter produced no accepted rows"):
                run_finple_monthly_metrics_pipeline(
                    build_config(
                        Path(temp_dir),
                        input_mode="public_source_fixture",
                        public_source_fixture_file="public_source_fixture_unsupported_shape.csv",
                    )
                )

    def test_public_source_fixture_checkpoint_retry_resume_and_determinism(self):
        config = load_config(
            build_config(
                Path("unused"),
                input_mode="public_source_fixture",
                public_source_fixture_failure_mode="transient_then_success",
            )
        )
        adapter_result = run_source_adapter(config)
        self.assertFalse(validate_adapter_result(adapter_result))
        self.assertEqual(adapter_result.adapterId, "finple.synthetic_public_source_fixture.v1")
        self.assertEqual(adapter_result.retryCount, 1)
        self.assertTrue(adapter_result.resumeSupported)
        self.assertEqual(adapter_result.checkpoint["completedPageNumbers"], [1, 2])
        self.assertEqual(len(adapter_result.checkpoint["acceptedRecordIds"]), 3)
        self.assertEqual(adapter_result.checkpoint["newlyAcceptedRecordCount"], 3)
        self.assertEqual(adapter_result.checkpoint["cumulativeAcceptedRecordCount"], 3)
        self.assertEqual(adapter_result.checkpoint["duplicateAcceptedRecordCount"], 0)
        self.assertEqual(adapter_result.checkpoint["lastStatus"], "success_after_retry")
        self.assertEqual(adapter_result.public_summary()["lastStatus"], "success_after_retry")

        with tempfile.TemporaryDirectory() as temp_dir:
            first = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir) / "first",
                    input_mode="public_source_fixture",
                    public_source_fixture_failure_mode="transient_then_success",
                )
            )
            checkpoint_path = Path(first["outputs"]["sourceAdapterCheckpointJson"])
            second_config = load_config(
                build_config(
                    Path(temp_dir) / "second",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(checkpoint_path),
                )
            )
            resumed = run_source_adapter(second_config)
            self.assertEqual(len(resumed.rows), 0)
            self.assertEqual(resumed.rejectedRowCount, 0)
            self.assertEqual(resumed.checkpoint["previousAcceptedRecordCount"], 3)
            self.assertEqual(resumed.checkpoint["newlyAcceptedRecordCount"], 0)
            self.assertEqual(resumed.checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(len(resumed.checkpoint["acceptedRecordIds"]), 3)
            self.assertEqual(resumed.checkpoint["duplicateAcceptedRecordCount"], 0)

            second = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir) / "third",
                    input_mode="public_source_fixture",
                    public_source_fixture_failure_mode="transient_then_success",
                )
            )
            first_manifest = Path(first["outputs"]["manifestJson"]).read_bytes()
            second_manifest = Path(second["outputs"]["manifestJson"]).read_bytes()
            self.assertEqual(first_manifest, second_manifest)
            self.assertEqual(
                Path(first["outputs"]["sourceAdapterCheckpointJson"]).read_bytes(),
                Path(second["outputs"]["sourceAdapterCheckpointJson"]).read_bytes(),
            )

    def test_public_source_partial_checkpoint_page_two_resume_and_repeat_resume_are_deterministic(self):
        partial_checkpoint = FIXTURE_DIR / "public_source_fixture_page1_checkpoint.json"
        with tempfile.TemporaryDirectory() as temp_dir:
            page_two_config = load_config(
                build_config(
                    Path(temp_dir) / "page-two",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(partial_checkpoint),
                )
            )
            page_two = run_source_adapter(page_two_config)
            self.assertEqual([row["ticker"] for row in page_two.rows], ["069500"])
            self.assertEqual(page_two.checkpoint["previousAcceptedRecordCount"], 2)
            self.assertEqual(page_two.checkpoint["newlyAcceptedRecordCount"], 1)
            self.assertEqual(page_two.checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(page_two.checkpoint["acceptedRecordIds"], [
                "public-fixture-kr-etf-069500",
                "public-fixture-kr-stock-001",
                "public-fixture-kr-stock-002",
            ])
            self.assertEqual(page_two.checkpoint["completedPageNumbers"], [1, 2])
            self.assertEqual(page_two.checkpoint["duplicateAcceptedRecordCount"], 0)

            completed_checkpoint = Path(temp_dir) / "completed_checkpoint.json"
            completed_checkpoint.write_text(json.dumps(page_two.checkpoint, sort_keys=True), encoding="utf-8")
            repeat_config = load_config(
                build_config(
                    Path(temp_dir) / "repeat",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(completed_checkpoint),
                )
            )
            repeat = run_source_adapter(repeat_config)
            self.assertEqual(len(repeat.rows), 0)
            self.assertEqual(repeat.rejectedRowCount, 0)
            self.assertEqual(repeat.checkpoint["newlyAcceptedRecordCount"], 0)
            self.assertEqual(repeat.checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(repeat.checkpoint["duplicateAcceptedRecordCount"], 0)

    def test_public_source_retry_count_respects_configured_max(self):
        for max_retry in [0, 1, 2, 3]:
            with self.subTest(mode="permanent_failure", max_retry=max_retry):
                permanent = run_source_adapter(
                    load_config(
                        build_config(
                            Path("unused"),
                            input_mode="public_source_fixture",
                            public_source_fixture_failure_mode="permanent_failure",
                            source_adapter_max_retry_count=max_retry,
                        )
                    )
                )
                self.assertEqual(permanent.retryCount, max_retry)
                self.assertEqual(permanent.maxRetryCount, max_retry)
                self.assertEqual(permanent.lastStatus, "retry_exhausted")
                self.assertEqual(permanent.checkpoint["retryCount"], max_retry)
                self.assertEqual(permanent.checkpoint["maxRetryCount"], max_retry)
                self.assertEqual(permanent.checkpoint["lastStatus"], "retry_exhausted")
                self.assertFalse(permanent.rows)

            with self.subTest(mode="transient_then_success", max_retry=max_retry):
                transient = run_source_adapter(
                    load_config(
                        build_config(
                            Path("unused"),
                            input_mode="public_source_fixture",
                            public_source_fixture_failure_mode="transient_then_success",
                            source_adapter_max_retry_count=max_retry,
                        )
                    )
                )
                self.assertLessEqual(transient.retryCount, max_retry)
                self.assertEqual(transient.maxRetryCount, max_retry)
                self.assertEqual(transient.checkpoint["maxRetryCount"], max_retry)
                if max_retry == 0:
                    self.assertEqual(transient.retryCount, 0)
                    self.assertEqual(transient.lastStatus, "retry_exhausted")
                    self.assertFalse(transient.rows)
                else:
                    self.assertEqual(transient.retryCount, 1)
                    self.assertEqual(transient.lastStatus, "success_after_retry")
                    self.assertTrue(transient.rows)

    def test_public_source_fixture_license_and_permanent_retry_fail_closed(self):
        for overrides in [
            {"public_source_fixture_file": "public_source_fixture_unknown_license.csv"},
            {"public_source_fixture_failure_mode": "permanent_failure"},
            {"public_source_fixture_failure_mode": "transient_then_success", "source_adapter_max_retry_count": 0},
        ]:
            with self.subTest(overrides=overrides), tempfile.TemporaryDirectory() as temp_dir:
                with self.assertRaises(PipelineCriticalError):
                    run_finple_monthly_metrics_pipeline(
                        build_config(Path(temp_dir), input_mode="public_source_fixture", **overrides)
                    )


if __name__ == "__main__":
    unittest.main()
