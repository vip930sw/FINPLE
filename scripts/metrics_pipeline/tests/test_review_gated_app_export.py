from __future__ import annotations

import argparse
import json
from pathlib import Path
import statistics
import tempfile
import unittest
import zipfile

from scripts.build_review_gated_app_export import (
    OVERLAY,
    RELEASE_CANDIDATE,
    SOURCE_MANIFEST,
    build,
    canonical_json_bytes,
    file_record,
    sha256_file,
)
from scripts.metrics_pipeline.review_approval_policy import _beta, _rolling_cagrs


def add_month(start: str, offset: int) -> str:
    year, month = (int(part) for part in start.split("-"))
    index = year * 12 + month - 1 + offset
    next_year, month_zero = divmod(index, 12)
    return f"{next_year:04d}-{month_zero + 1:02d}-28"


def rows(count: int, multiplier: float) -> list[list[object]]:
    return [
        [
            add_month("2006-01", index),
            round((0.008 + ((index % 7) - 3) * 0.004) * multiplier, 8),
            round((0.008 + ((index % 7) - 3) * 0.004) * multiplier, 8),
            0,
            "USD",
            "US_SPY",
            "candidate",
        ]
        for index in range(count)
    ]


class ReviewGatedAppExportTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def create_source(self) -> tuple[Path, Path, bytes]:
        benchmark = rows(220, 1)
        geared = rows(220, 3)
        cagrs = _rolling_cagrs(geared, 120)
        selected_cagr = round(statistics.median(cagrs), 2)
        selected_beta = round(_beta(geared, benchmark), 4)
        overlay = {
            "exportVersion": "finple-app-preview-export-v1-step114-2z",
            "metricDataThroughMonth": "2026-06",
            "productionPublishReady": False,
            "appExportApproved": False,
            "internalPreviewReviewOnly": True,
            "rows": [
                {
                    "identity": "US:QQQ",
                    "market": "US",
                    "ticker": "QQQ",
                    "assetType": "ETF",
                    "dataStatus": "ready",
                    "reviewFlag": "none",
                    "reviewReason": None,
                    "selectedCagr": 10,
                    "selectedBeta": 1,
                    "selectedMdd": -30,
                    "rawPriceCoverageStatus": "covered",
                    "internalPreviewReviewOnly": True,
                    "productionPublishReady": False,
                    "appExportApproved": False,
                },
                {
                    "identity": "US:TQQQ",
                    "market": "US",
                    "ticker": "TQQQ",
                    "assetType": "ETF",
                    "benchmarkTicker": "SPY",
                    "dataStatus": "ready",
                    "reviewFlag": "review_required",
                    "reviewReason": (
                        "selectedCagr outside automatic publish threshold; "
                        "selectedMdd outside automatic publish threshold; "
                        "selectedBeta outside automatic publish threshold"
                    ),
                    "cagrPolicy": "rolling_10y_median",
                    "validRollingWindowCount10y": len(cagrs),
                    "rollingCagr10yMedian": selected_cagr,
                    "rollingCagr10yP25": selected_cagr - 1,
                    "rollingCagr10yP75": selected_cagr + 1,
                    "selectedCagr": selected_cagr,
                    "selectedBeta": selected_beta,
                    "selectedMdd": -85,
                    "dividendYield": 0,
                    "dividendStatus": "confirmed_value",
                    "dataEndDate": geared[-1][0],
                    "rawPriceCoverageStatus": "covered",
                    "sourceHash": "source",
                    "normalizedSeriesHash": "normalized",
                    "rawSourceSha256": "raw",
                    "internalPreviewReviewOnly": True,
                    "productionPublishReady": False,
                    "appExportApproved": False,
                },
            ],
        }
        shard = {
            "exportVersion": "finple-app-preview-export-v1-step114-2z",
            "schemaVersion": 1,
            "shardId": "00",
            "series": {
                "US:SPY": benchmark,
                "US:TQQQ": geared,
            },
        }
        shard_bytes = canonical_json_bytes(shard)
        index = {
            "exportVersion": "finple-app-preview-export-v1-step114-2z",
            "metricDataThroughMonth": "2026-06",
            "assetCount": 2,
            "rowCount": 440,
            "rowEncoding": [
                "month",
                "priceReturn",
                "totalReturn",
                "fxReturn",
                "currency",
                "benchmarkId",
                "dataStatus",
            ],
            "assets": {
                "US:SPY": {
                    "shard": "monthly-returns/monthly-returns-00.json",
                    "rowCount": 220,
                },
                "US:TQQQ": {
                    "shard": "monthly-returns/monthly-returns-00.json",
                    "rowCount": 220,
                },
            },
            "shards": [
                {
                    "shardId": "00",
                    **file_record("monthly-returns/monthly-returns-00.json", shard_bytes),
                    "assetCount": 2,
                    "rowCount": 440,
                }
            ],
        }
        qa = {
            "status": "review_only_ready_for_local_qa",
            "dataStatusCounts": {"ready": 2},
            "representativeAssets": {},
            "productionPublishReady": False,
            "appExportApproved": False,
        }
        files = {
            "app-preview-qa-summary.json": canonical_json_bytes(qa),
            OVERLAY: canonical_json_bytes(overlay),
            "monthly-returns-index.json": canonical_json_bytes(index),
            "monthly-returns/monthly-returns-00.json": shard_bytes,
        }
        manifest = {
            "exportVersion": "finple-app-preview-export-v1-step114-2z",
            "candidatePackageReady": True,
            "packageGlobalBlockingIssueCount": 0,
            "internalPreviewReviewOnly": True,
            "productionPublishReady": False,
            "appExportApproved": False,
            "assetCount": 2,
            "activeAssetCount": 2,
            "marketAssetCounts": {"US": 2},
            "rawMissingAssetCount": 0,
            "monthlyReturnAssetCount": 2,
            "monthlyReturnRowCount": 440,
            "metricDataThroughMonth": "2026-06",
            "sourceCandidatePackageHash": "f" * 64,
            "shardCount": 1,
            "shardInventory": index["shards"],
            "files": [
                file_record(name, payload)
                for name, payload in sorted(files.items())
            ],
            "metricsOverlay": file_record(OVERLAY, files[OVERLAY]),
            "monthlyReturnsIndex": file_record(
                "monthly-returns-index.json",
                files["monthly-returns-index.json"],
            ),
            "qaSummary": file_record(
                "app-preview-qa-summary.json",
                files["app-preview-qa-summary.json"],
            ),
        }
        files[SOURCE_MANIFEST] = canonical_json_bytes(manifest, pretty=True)
        source = self.root / "source.zip"
        with zipfile.ZipFile(source, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, payload in sorted(files.items()):
                archive.writestr(name, payload)

        metadata = {
            "schemaVersion": 1,
            "policyVersion": "leveraged-inverse-review-policy-v1-step114",
            "records": [
                {
                    "identity": "US:TQQQ",
                    "assetType": "ETF",
                    "exposureType": "leveraged_etf",
                    "leverageMultiple": 3,
                    "direction": "long",
                    "resetFrequency": "daily",
                    "underlyingTicker": "NDX",
                    "inceptionDate": "2005-01-01",
                    "sourceId": "issuer:TQQQ",
                    "officialSourceUrl": "https://issuer.example/tqqq",
                    "sourceCheckedAt": "2026-07-27",
                }
            ],
        }
        metadata_path = self.root / "metadata.json"
        metadata_path.write_bytes(canonical_json_bytes(metadata, pretty=True))
        return source, metadata_path, shard_bytes

    def test_candidate_is_deterministic_and_preserves_shards_and_dividend_state(self) -> None:
        source, metadata, shard_bytes = self.create_source()
        common = {
            "source_export": source,
            "expected_source_sha256": sha256_file(source),
            "candidate_zip_sha256": "e" * 64,
            "source_git_sha": "d" * 40,
            "product_metadata": metadata,
        }
        run_a = build(argparse.Namespace(**common, output_dir=self.root / "run-a"))
        run_b = build(argparse.Namespace(**common, output_dir=self.root / "run-b"))

        self.assertEqual(
            Path(run_a["archive"]).read_bytes(),
            Path(run_b["archive"]).read_bytes(),
        )
        self.assertEqual(
            run_a["candidateAppExportSha256"],
            run_b["candidateAppExportSha256"],
        )
        self.assertEqual(run_a["reviewApprovalSummary"]["changedCount"], 1)
        self.assertFalse(run_a["productionPublishReady"])
        self.assertFalse(run_a["appExportApproved"])
        self.assertEqual(
            (Path(run_a["bundle"]) / "monthly-returns/monthly-returns-00.json").read_bytes(),
            shard_bytes,
        )

        output_overlay = json.loads(
            (Path(run_a["bundle"]) / OVERLAY).read_text(encoding="utf-8")
        )
        tqqq = next(row for row in output_overlay["rows"] if row["ticker"] == "TQQQ")
        qqq = next(row for row in output_overlay["rows"] if row["ticker"] == "QQQ")
        self.assertEqual(tqqq["reviewFlag"], "none")
        self.assertEqual(tqqq["reviewApprovalStatus"], "ready")
        self.assertEqual(tqqq["dividendYield"], 0)
        self.assertEqual(tqqq["dividendStatus"], "confirmed_value")
        self.assertEqual(qqq["reviewFlag"], "none")
        self.assertNotIn("reviewApprovalPolicyVersion", qqq)

        release = json.loads(
            (self.root / "run-a" / RELEASE_CANDIDATE).read_text(encoding="utf-8")
        )
        self.assertEqual(release["approvalStatus"], "pending_review")
        self.assertFalse(release["productionPublishReady"])
        self.assertFalse(release["appExportApproved"])
        self.assertIsNone(release["approvedAt"])
        self.assertIsNone(release["approvedBy"])


if __name__ == "__main__":
    unittest.main()
