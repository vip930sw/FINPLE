from __future__ import annotations

import csv
import hashlib
import json
import tempfile
import unittest
from calendar import monthrange
from pathlib import Path
from zipfile import ZipFile

from scripts.metrics_pipeline import run_finple_monthly_metrics_pipeline, run_finple_production_candidate_package
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
    return [{"benchmarkKey": "KOSPI200", "benchmarkTicker": "069500"}]


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
    write_csv(input_dir / "benchmark_map.csv", ["benchmarkKey", "benchmarkTicker"], overrides.get("benchmark_rows", benchmark_rows()))
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


def run_candidate(input_dir: Path, output_dir: Path):
    return run_finple_production_candidate_package(
        {
            "input_mode": "manual_upload_candidate",
            "input_dir": str(input_dir),
            "output_dir": str(output_dir),
            "metric_base_date": "2026-06-30",
            "market_scope": ["KR"],
            "output_version": "2026_06_candidate",
        }
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
