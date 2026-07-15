from __future__ import annotations

import csv
import hashlib
import json
import tempfile
import unittest
from calendar import monthrange
from pathlib import Path
from zipfile import ZipFile

from scripts.metrics_pipeline import run_finple_monthly_metrics_pipeline, run_finple_production_candidate_package, verify_candidate_package
from scripts.metrics_pipeline.candidate_package import (
    SOURCE_DECLARATION_CONTRACT_VERSION,
    SUBMISSION_MANIFEST_CONTRACT_VERSION,
)
from scripts.metrics_pipeline.config import CALCULATION_POLICY_VERSION, PIPELINE_VERSION
from scripts.metrics_pipeline.schemas import CANDIDATE_COLUMNS, RAW_DAILY_PRICE_COLUMNS
from scripts.metrics_pipeline.tests.test_pipeline import FIXTURE_DIR, build_config
from scripts.metrics_pipeline.timeseries import NORMALIZATION_VERSION


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_csv(path: Path, columns: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def month_end(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}-{monthrange(year, month)[1]:02d}"


def add_month(year: int, month: int, offset: int) -> tuple[int, int]:
    zero_based = (year * 12 + month - 1) + offset
    return zero_based // 12, zero_based % 12 + 1


def candidate_rows() -> list[dict[str, str]]:
    return [
        {
            "ticker": "005930",
            "nameKr": "삼성전자",
            "nameEn": "Samsung Electronics",
            "market": "KR",
            "assetType": "stock",
            "exchange": "KRX",
            "sector": "Technology",
            "industry": "Semiconductors",
            "strategy": "core",
            "riskLevel": "medium",
            "goals": "growth",
            "beginnerFit": "true",
            "tags": "kr,large",
            "listingDate": "1975-06-11",
            "benchmarkKey": "KOSPI200",
            "proxyTicker": "",
            "hedged": "false",
            "isActive": "true",
        }
    ]


def benchmark_rows() -> list[dict[str, str]]:
    return [{"benchmarkKey": "KOSPI200", "benchmarkMarket": "KR", "benchmarkTicker": "069500"}]


def raw_daily_rows(**overrides) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for ticker, base in [("005930", 70000), ("069500", 30000)]:
        for index in range(37):
            year, month = add_month(2023, 6, index)
            close = base + index * (600 if ticker == "005930" else 150)
            row = {
                "market": "KR",
                "ticker": ticker,
                "date": month_end(year, month),
                "currency": "KRW",
                "close": str(close),
                "splitAdjustedClose": str(close),
                "totalReturnAdjustedClose": "",
                "volume": str(100000 + index),
                "splitFactor": "1",
                "cashDividend": "",
                "sourceId": "manual_candidate_upload",
                "retrievedAt": "2026-06-30T10:00:00+09:00",
                "priceAdjustmentBasis": "split_adjusted",
                "publicationEligibility": "approved",
                "providerOrInstitution": "Manual Operator Source",
                "licenseStatus": "approved",
                "internalUseAllowed": "true",
                "publicationAllowed": "true",
                "redistributionAllowed": "false",
            }
            row.update(overrides)
            rows.append(row)
    return rows


def build_candidate_input(root: Path, **overrides) -> Path:
    input_dir = root / "input"
    input_dir.mkdir()
    write_csv(input_dir / "candidate_asset_master.csv", CANDIDATE_COLUMNS, overrides.get("candidate_rows", candidate_rows()))
    write_csv(input_dir / "benchmark_map.csv", ["benchmarkKey", "benchmarkMarket", "benchmarkTicker"], overrides.get("benchmark_rows", benchmark_rows()))
    write_csv(input_dir / "raw_daily_prices.csv", RAW_DAILY_PRICE_COLUMNS, overrides.get("raw_rows", raw_daily_rows()))

    source = {
        "contractVersion": SOURCE_DECLARATION_CONTRACT_VERSION,
        "sourceKind": "manual_operator_upload",
        "sourceName": "Manual Operator Candidate Source",
        "sourceReference": "operator-reviewed-contract-2026-06",
        "acquiredAt": "2026-06-30T10:00:00+09:00",
        "asOfDate": "2026-06-30",
        "marketScope": ["KR"],
        "timezone": "Asia/Seoul",
        "currencyMode": "KRW",
        "returnBasis": "price_return",
        "priceAdjustmentBasis": "split_adjusted",
        "redistributionReviewStatus": "approved",
        "appUseReviewStatus": "approved",
        "sourceFileSha256": sha256(input_dir / "raw_daily_prices.csv"),
        "rowCount": len(overrides.get("raw_rows", raw_daily_rows())),
        "operatorId": "operator-reviewed",
        "fixtureOnly": False,
        "testOnly": False,
    }
    source.update(overrides.get("source_patch", {}))
    (input_dir / "source_declaration.json").write_text(json.dumps(source, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    inventory = []
    for role, file_name in [
        ("candidate_asset_master", "candidate_asset_master.csv"),
        ("benchmark_map", "benchmark_map.csv"),
        ("raw_daily_price", "raw_daily_prices.csv"),
        ("source_declaration", "source_declaration.json"),
    ]:
        path = input_dir / file_name
        inventory.append(
            {
                "logicalRole": role,
                "path": file_name,
                "sha256": sha256(path),
                "byteSize": path.stat().st_size,
            }
        )
    manifest = {
        "contractVersion": SUBMISSION_MANIFEST_CONTRACT_VERSION,
        "submissionId": "submission-2026-06-30-001",
        "submittedAt": "2026-06-30T11:00:00+09:00",
        "submittedBy": "operator-reviewed",
        "intendedMetricBaseDate": "2026-06-30",
        "expectedMarketScope": ["KR"],
        "fileInventory": inventory,
        "expectedPipelineVersion": PIPELINE_VERSION,
        "expectedNormalizationVersion": NORMALIZATION_VERSION,
        "expectedCalculationPolicyVersion": CALCULATION_POLICY_VERSION,
        "notProductionApproval": True,
    }
    manifest.update(overrides.get("manifest_patch", {}))
    (input_dir / "operator_submission_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return input_dir


def run_candidate(input_dir: Path, output_dir: Path, **overrides):
    config = {
        "input_mode": "manual_upload_candidate",
        "input_dir": str(input_dir),
        "output_dir": str(output_dir),
        "metric_base_date": "2026-06-30",
        "market_scope": ["KR"],
        "output_version": "2026_06_candidate",
        "validation_date": "2026-07-15",
    }
    config.update(overrides)
    return run_finple_production_candidate_package(
        config
    )


class ProductionCandidatePackageTests(unittest.TestCase):
    def test_no_input_returns_idle_and_fixture_default_remains_unchanged(self):
        self.assertEqual(run_finple_production_candidate_package()["status"], "idle")
        with tempfile.TemporaryDirectory() as temp_dir:
            fixture_result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            self.assertTrue(fixture_result["fixturePackageReady"])
            self.assertFalse(fixture_result["productionPublishReady"])
            self.assertFalse(fixture_result["appExportApproved"])

    def test_valid_offline_candidate_package_is_ready_and_deterministic(self):
        with tempfile.TemporaryDirectory() as left_dir, tempfile.TemporaryDirectory() as right_dir:
            left_input = build_candidate_input(Path(left_dir))
            right_input = build_candidate_input(Path(right_dir))
            left = run_candidate(left_input, Path(left_dir) / "out")
            right = run_candidate(right_input, Path(right_dir) / "out")

            self.assertTrue(left["candidatePackageReady"])
            self.assertFalse(left["fixturePackageReady"])
            self.assertFalse(left["productionPublishReady"])
            self.assertFalse(left["appExportApproved"])
            self.assertEqual(left["candidatePackageHash"], right["candidatePackageHash"])
            self.assertEqual(left["zipPackageSha256"], right["zipPackageSha256"])
            self.assertTrue(verify_candidate_package(left["outputs"]["zipPackage"])["ok"])

            outputs = {name: Path(path) for name, path in left["outputs"].items()}
            with outputs["manifestJson"].open("r", encoding="utf-8") as handle:
                manifest = json.load(handle)
            self.assertEqual(left["candidatePackageHash"], manifest["candidatePackageHash"])
            self.assertTrue(manifest["candidatePackageReady"])
            self.assertFalse(manifest["fixturePackageReady"])
            self.assertFalse(manifest["productionPublishReady"])
            self.assertFalse(manifest["appExportApproved"])
            self.assertEqual(manifest["blockingIssueCount"], 0)
            self.assertEqual(manifest["pipelineVersion"], PIPELINE_VERSION)
            self.assertEqual(manifest["normalizationVersion"], NORMALIZATION_VERSION)
            self.assertEqual(manifest["calculationPolicyVersion"], CALCULATION_POLICY_VERSION)
            self.assertIn("KR:005930", manifest["marketTickerDateCoverage"])
            self.assertEqual(manifest["outputHashes"]["finple_candidate_metrics_output_2026_06_candidate.csv"], sha256(outputs["metricsOutputCsv"]))
            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                metrics = list(csv.DictReader(handle))
            self.assertEqual(metrics[0]["ticker"], "005930")
            self.assertEqual(metrics[0]["betaPolicy"], "candidate_aligned_monthly_returns")
            with outputs["monthlyReturnsCsv"].open("r", encoding="utf-8", newline="") as handle:
                monthly_returns = list(csv.DictReader(handle))
            self.assertTrue(monthly_returns)
            self.assertTrue(all("fixture" not in row["dataStatus"] for row in monthly_returns))
            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                normalized = list(csv.DictReader(handle))
            self.assertIn("069500", {row["ticker"] for row in normalized})
            with ZipFile(outputs["zipPackage"]) as package:
                names = set(package.namelist())
            self.assertIn("finple_candidate_manifest_2026_06_candidate.json", names)
            self.assertIn("finple_candidate_hash_inventory_2026_06_candidate.csv", names)
            self.assertIn("finple_candidate_package_index_2026_06_candidate.json", names)

    def test_candidate_fail_closed_validation_cases(self):
        cases = [
            {"source_patch": {"fixtureOnly": True}, "issue": "fixture_marker_blocked"},
            {"source_patch": {"testOnly": True}, "issue": "test_only_marker_blocked"},
            {"source_patch": {"sourceName": "Synthetic test source"}, "issue": "synthetic_or_fixture_marker_blocked"},
            {"source_patch": {"sourceFileSha256": "0" * 64}, "issue": "source_file_sha256_mismatch"},
            {"source_patch": {"rowCount": 1}, "issue": "source_row_count_mismatch"},
            {"source_patch": {"asOfDate": "2026-08-01"}, "issue": "as_of_date_future"},
            {"source_patch": {"asOfDate": "2026-05-31"}, "issue": "source_data_stale"},
            {"manifest_patch": {"expectedPipelineVersion": "wrong"}, "issue": "pipeline_version_mismatch"},
            {"manifest_patch": {"fileInventory": [{"logicalRole": "raw_daily_price", "path": "../raw.csv", "sha256": "x", "byteSize": 1}]}, "issue": "unsafe_archive_path"},
        ]
        for case in cases:
            with self.subTest(case=case["issue"]), tempfile.TemporaryDirectory() as temp_dir:
                input_dir = build_candidate_input(Path(temp_dir), **{key: value for key, value in case.items() if key != "issue"})
                result = run_candidate(input_dir, Path(temp_dir) / "out")
                self.assertFalse(result["candidatePackageReady"])
                self.assertFalse(result["productionPublishReady"])
                self.assertFalse(result["appExportApproved"])
                self.assertIn(case["issue"], {issue["issueType"] for issue in result["issues"]})

    def test_raw_csv_identity_and_quality_blocks(self):
        invalid_rows = raw_daily_rows()
        invalid_rows.append(dict(invalid_rows[0]))
        invalid_price_rows = raw_daily_rows()
        invalid_price_rows[0]["close"] = "0"
        invalid_ticker_rows = raw_daily_rows()
        invalid_ticker_rows[0]["ticker"] = "69500"
        invalid_date_rows = raw_daily_rows()
        invalid_date_rows[0]["date"] = "2026-99-99"
        for rows, expected_issue in [
            (invalid_rows, "duplicate_market_ticker_date"),
            (invalid_price_rows, "price_invalid"),
            (invalid_ticker_rows, "ticker_identity_invalid"),
            (invalid_date_rows, "date_invalid"),
        ]:
            with self.subTest(expected_issue=expected_issue), tempfile.TemporaryDirectory() as temp_dir:
                input_dir = build_candidate_input(Path(temp_dir), raw_rows=rows)
                result = run_candidate(input_dir, Path(temp_dir) / "out")
                self.assertFalse(result["candidatePackageReady"])
                self.assertIn(expected_issue, {issue["issueType"] for issue in result["issues"]})

    def test_unknown_duplicate_role_size_mismatch_and_output_inventory(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            manifest_path = input_dir / "operator_submission_manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["fileInventory"].append(dict(manifest["fileInventory"][0]))
            manifest["fileInventory"].append({"logicalRole": "unknown_role", "path": "unknown.csv", "sha256": "x", "byteSize": 1})
            manifest["fileInventory"][0]["byteSize"] += 1
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
            result = run_candidate(input_dir, Path(temp_dir) / "out")
            issues = {issue["issueType"] for issue in result["issues"]}
            self.assertIn("duplicate_logical_role", issues)
            self.assertIn("unknown_file_role", issues)
            self.assertIn("file_byte_size_mismatch", issues)

        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            result = run_candidate(input_dir, Path(temp_dir) / "out")
            inventory_path = Path(result["outputs"]["hashInventoryCsv"])
            with inventory_path.open("r", encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            output_rows = [row for row in rows if row["artifactType"] == "output"]
            self.assertTrue(output_rows)
            for row in output_rows:
                artifact = inventory_path.parent / row["path"]
                self.assertEqual(row["sha256"], sha256(artifact))

    def test_validation_date_injection_and_future_logic(self):
        cases = [
            ("2026-06-30", "2026-06-30", True),
            ("2026-06-30", "2026-07-15", True),
            ("2026-07-16", "2026-07-15", False),
            ("2026-07-16", "2026-07-16", True),
        ]
        for as_of, validation_date, expected_ready in cases:
            with self.subTest(as_of=as_of, validation_date=validation_date), tempfile.TemporaryDirectory() as temp_dir:
                input_dir = build_candidate_input(
                    Path(temp_dir),
                    source_patch={"asOfDate": as_of},
                    manifest_patch={"intendedMetricBaseDate": as_of},
                )
                result = run_candidate(input_dir, Path(temp_dir) / "out", metric_base_date=as_of, validation_date=validation_date)
                self.assertEqual(result["candidatePackageReady"], expected_ready)
                manifest = json.loads(Path(result["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
                self.assertEqual(manifest["validationDate"], validation_date)
                self.assertFalse(result["productionPublishReady"])
                self.assertFalse(result["appExportApproved"])

    def test_malformed_inputs_return_blocked_without_exception_or_helper_crash(self):
        cases = []
        missing_benchmark_key = [dict(row) for row in candidate_rows()]
        missing_benchmark_key[0].pop("benchmarkKey")
        cases.append({"candidate_rows": missing_benchmark_key, "issue": "candidate_asset_master_invalid"})
        cases.append({"benchmark_rows": [{"benchmarkKey": "KOSPI200", "benchmarkTicker": "069500"}], "issue": "benchmark_market_invalid"})
        for case in cases:
            with self.subTest(case=case["issue"]), tempfile.TemporaryDirectory() as temp_dir:
                input_dir = build_candidate_input(Path(temp_dir), **{key: value for key, value in case.items() if key != "issue"})
                result = run_candidate(input_dir, Path(temp_dir) / "out")
                self.assertFalse(result["candidatePackageReady"])
                self.assertIn(case["issue"], {issue["issueType"] for issue in result["issues"]})
                self.assertTrue(Path(result["outputs"]["sourceAuditCsv"]).exists())

        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            (input_dir / "source_declaration.json").write_text("[1,2,3]\n", encoding="utf-8")
            result = run_candidate(input_dir, Path(temp_dir) / "out")
            self.assertFalse(result["candidatePackageReady"])
            self.assertIn("malformed_json_type", {issue["issueType"] for issue in result["issues"]})

        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            with (input_dir / "benchmark_map.csv").open("a", encoding="utf-8", newline="") as handle:
                handle.write("too,many,columns,here\n")
            result = run_candidate(input_dir, Path(temp_dir) / "out")
            self.assertFalse(result["candidatePackageReady"])
            self.assertIn("malformed_csv", {issue["issueType"] for issue in result["issues"]})

    def test_market_ticker_identity_separates_same_ticker_in_us_and_kr(self):
        candidates = candidate_rows() + [
            {
                **candidate_rows()[0],
                "market": "US",
                "ticker": "069500",
                "nameKr": "US Numeric Ticker",
                "nameEn": "US Numeric Ticker",
                "exchange": "NYSE",
                "benchmarkKey": "SPY_BENCH",
            }
        ]
        benchmarks = [
            {"benchmarkKey": "KOSPI200", "benchmarkMarket": "KR", "benchmarkTicker": "069500"},
            {"benchmarkKey": "SPY_BENCH", "benchmarkMarket": "US", "benchmarkTicker": "069500"},
        ]
        rows = raw_daily_rows()
        for index in range(37):
            year, month = add_month(2023, 6, index)
            close = 100 + index
            rows.append(
                {
                    **raw_daily_rows()[0],
                    "market": "US",
                    "ticker": "069500",
                    "date": month_end(year, month),
                    "currency": "USD",
                    "close": str(close),
                    "splitAdjustedClose": str(close),
                    "volume": str(1000 + index),
                }
            )
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(
                Path(temp_dir),
                candidate_rows=candidates,
                benchmark_rows=benchmarks,
                raw_rows=rows,
                source_patch={"marketScope": ["KR", "US"], "currencyMode": "mixed"},
                manifest_patch={"expectedMarketScope": ["KR", "US"]},
            )
            result = run_candidate(input_dir, Path(temp_dir) / "out", market_scope=["KR", "US"])
            self.assertTrue(result["candidatePackageReady"])
            with Path(result["outputs"]["metricsOutputCsv"]).open("r", encoding="utf-8", newline="") as handle:
                metrics = list(csv.DictReader(handle))
            hashes = {(row["market"], row["ticker"]): row["sourceHash"] for row in metrics}
            self.assertIn(("KR", "005930"), hashes)
            self.assertIn(("US", "069500"), hashes)
            self.assertNotEqual(hashes[("KR", "005930")], hashes[("US", "069500")])
            with Path(result["outputs"]["normalizedMonthEndCsv"]).open("r", encoding="utf-8", newline="") as handle:
                normalized = list(csv.DictReader(handle))
            self.assertEqual({"KR", "US"}, {row["market"] for row in normalized if row["ticker"] == "069500"})

    def test_scope_currency_timestamp_operator_and_legal_reconciliation(self):
        cases = [
            {"source_patch": {"marketScope": ["US"]}, "issue": "market_scope_mismatch"},
            {"manifest_patch": {"expectedMarketScope": ["US"]}, "issue": "market_scope_mismatch"},
            {"raw_rows": raw_daily_rows(market="US"), "issue": "raw_market_scope_mismatch"},
            {"raw_rows": raw_daily_rows(currency="USD"), "issue": "currency_mismatch"},
            {"source_patch": {"acquiredAt": "not-a-time"}, "issue": "acquired_at_invalid"},
            {"manifest_patch": {"submittedAt": "not-a-time"}, "issue": "submitted_at_invalid"},
            {"manifest_patch": {"submittedBy": "different-operator"}, "issue": "operator_identity_mismatch"},
            {"raw_rows": raw_daily_rows(licenseStatus="pending"), "issue": "license_status_invalid"},
            {"raw_rows": raw_daily_rows(internalUseAllowed="false"), "issue": "internal_use_not_allowed"},
            {"raw_rows": raw_daily_rows(publicationAllowed="false"), "issue": "publication_not_allowed"},
        ]
        for case in cases:
            with self.subTest(case=case["issue"]), tempfile.TemporaryDirectory() as temp_dir:
                input_dir = build_candidate_input(Path(temp_dir), **{key: value for key, value in case.items() if key != "issue"})
                result = run_candidate(input_dir, Path(temp_dir) / "out")
                self.assertFalse(result["candidatePackageReady"])
                self.assertIn(case["issue"], {issue["issueType"] for issue in result["issues"]})

    def test_path_safety_and_input_set_blocks(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            (input_dir / "extra.csv").write_text("x\n", encoding="utf-8")
            result = run_candidate(input_dir, Path(temp_dir) / "out")
            self.assertFalse(result["candidatePackageReady"])
            self.assertIn("extra_physical_input_file", {issue["issueType"] for issue in result["issues"]})

        path_cases = [
            {"candidate_asset_master_file": "../candidate_asset_master.csv", "issue": "unsafe_config_filename"},
            {"candidate_asset_master_file": "bad\\candidate_asset_master.csv", "issue": "unsafe_config_filename"},
            {"output_version": "../bad", "issue": "unsafe_output_version"},
        ]
        for case in path_cases:
            with self.subTest(case=case["issue"]), tempfile.TemporaryDirectory() as temp_dir:
                input_dir = build_candidate_input(Path(temp_dir))
                result = run_candidate(input_dir, Path(temp_dir) / "out", **{key: value for key, value in case.items() if key != "issue"})
                self.assertFalse(result["candidatePackageReady"])
                self.assertIn(case["issue"], {issue["issueType"] for issue in result["issues"]})

        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            result = run_candidate(input_dir, input_dir)
            self.assertFalse(result["candidatePackageReady"])
            self.assertIn("input_output_overlap", {issue["issueType"] for issue in result["issues"]})

    def test_package_member_hash_verification_detects_missing_extra_and_mutation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir))
            result = run_candidate(input_dir, Path(temp_dir) / "out")
            zip_path = Path(result["outputs"]["zipPackage"])
            self.assertTrue(verify_candidate_package(zip_path)["ok"])
            with ZipFile(zip_path) as package:
                names = package.namelist()
                payloads = {name: package.read(name) for name in names}
            mutated = Path(temp_dir) / "mutated.zip"
            with ZipFile(mutated, "w") as package:
                for name, data in payloads.items():
                    if name.endswith(".csv"):
                        data = data + b"# mutation\n"
                    package.writestr(name, data)
            self.assertFalse(verify_candidate_package(mutated)["ok"])
            missing = Path(temp_dir) / "missing.zip"
            with ZipFile(missing, "w") as package:
                for name, data in payloads.items():
                    if "monthly_returns" not in name:
                        package.writestr(name, data)
            self.assertFalse(verify_candidate_package(missing)["ok"])
            extra = Path(temp_dir) / "extra.zip"
            with ZipFile(extra, "w") as package:
                for name, data in payloads.items():
                    package.writestr(name, data)
                package.writestr("extra.txt", b"extra")
            self.assertFalse(verify_candidate_package(extra)["ok"])

    def test_no_network_and_approval_false_for_ready_blocked_idle(self):
        import socket
        import urllib.request
        from unittest import mock

        def blocked_network(*_args, **_kwargs):
            raise AssertionError("network should not be used")

        with tempfile.TemporaryDirectory() as temp_dir, mock.patch.object(socket, "socket", side_effect=blocked_network), mock.patch.object(urllib.request, "urlopen", side_effect=blocked_network):
            input_dir = build_candidate_input(Path(temp_dir))
            ready = run_candidate(input_dir, Path(temp_dir) / "out")
            self.assertTrue(ready["candidatePackageReady"])
        idle = run_finple_production_candidate_package()
        self.assertFalse(idle["productionPublishReady"])
        self.assertFalse(idle["appExportApproved"])
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = build_candidate_input(Path(temp_dir), raw_rows=raw_daily_rows(close="0"))
            blocked = run_candidate(input_dir, Path(temp_dir) / "out")
            self.assertFalse(blocked["productionPublishReady"])
            self.assertFalse(blocked["appExportApproved"])

    def test_candidate_outputs_not_connected_to_ai_or_production_loader(self):
        repo_root = Path(__file__).resolve().parents[3]
        forbidden_files = [
            repo_root / "src" / "components" / "portfolio" / "services" / "aiAnalysisService.js",
            repo_root / "src" / "data" / "tickerMetricsLoader.js",
        ]
        for path in forbidden_files:
            if path.exists():
                self.assertNotIn("run_finple_production_candidate_package", path.read_text(encoding="utf-8"))

    def test_committed_fixture_cannot_be_reclassified_as_candidate(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_production_candidate_package(
                {
                    "input_mode": "manual_upload_candidate",
                    "input_dir": str(FIXTURE_DIR),
                    "output_dir": str(Path(temp_dir) / "out"),
                    "metric_base_date": "2026-06-30",
                    "market_scope": ["KR"],
                    "output_version": "fixture_reclass",
                    "candidate_asset_master_file": "candidates.csv",
                    "benchmark_map_file": "benchmark_map.csv",
                    "raw_daily_price_file": "raw_daily_prices.csv",
                    "source_declaration_file": "missing_source_declaration.json",
                    "operator_submission_manifest_file": "missing_submission_manifest.json",
                }
            )
            self.assertFalse(result["candidatePackageReady"])
            self.assertIn("fixture_file_reclassified", {issue["issueType"] for issue in result["issues"]})


if __name__ == "__main__":
    unittest.main()
