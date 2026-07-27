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
    ReviewArtifactError,
    SOURCE_MANIFEST,
    build,
    canonical_json_bytes,
    file_record,
    sha256_file,
)
from scripts.metrics_pipeline.review_approval_policy import _beta, _rolling_cagrs

SOURCE_HASH = "a" * 64
RAW_SOURCE_HASH = "b" * 64


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
            False,
            "",
        ]
        for index in range(count)
    ]


class ReviewGatedAppExportTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def create_source(
        self,
        *,
        review_flag: str = "review_required",
        include_unused_metadata: bool = False,
        duplicate_metadata_identity_usage: bool = False,
        legacy_lineage: bool = False,
        proxy_geared: bool = False,
        invalid_lineage: tuple[object, object] | None = None,
    ) -> tuple[Path, Path, bytes]:
        benchmark = rows(220, 1)
        geared = rows(220, 3)
        cagrs = _rolling_cagrs(geared, 120)
        selected_cagr = round(statistics.median(cagrs), 2)
        selected_beta = round(_beta(geared, benchmark), 4)
        if proxy_geared:
            for monthly_row in geared:
                monthly_row[7], monthly_row[8] = True, "QQQ"
        if invalid_lineage is not None:
            geared[0][7], geared[0][8] = invalid_lineage
        if legacy_lineage:
            benchmark = [monthly_row[:7] for monthly_row in benchmark]
            geared = [monthly_row[:7] for monthly_row in geared]
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
                    "reviewFlag": review_flag,
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
                    "mddPolicy": "full_period_actual",
                    "dividendYield": 0,
                    "dividendStatus": "confirmed_value",
                    "dataEndDate": geared[-1][0],
                    "rawPriceCoverageStatus": "covered",
                    "sourceHash": SOURCE_HASH,
                    "normalizedSeriesHash": SOURCE_HASH,
                    "rawSourceSha256": RAW_SOURCE_HASH,
                    "internalPreviewReviewOnly": True,
                    "productionPublishReady": False,
                    "appExportApproved": False,
                },
            ],
        }
        if duplicate_metadata_identity_usage:
            overlay["rows"].append(dict(overlay["rows"][-1]))
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
                "isProxy",
                "proxyTicker",
            ][:7 if legacy_lineage else 9],
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

        records = [
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
        ]
        if include_unused_metadata:
            records.append(
                {
                    **records[0],
                    "identity": "US:UNUSED",
                    "sourceId": "issuer:UNUSED",
                    "officialSourceUrl": "https://issuer.example/unused",
                }
            )
        metadata = {
            "schemaVersion": 1,
            "policyVersion": "leveraged-inverse-review-policy-v1-step114",
            "records": records,
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

    def test_builder_does_not_change_already_ready_none_row(self) -> None:
        source, metadata, _ = self.create_source(review_flag="none")
        result = build(
            argparse.Namespace(
                source_export=source,
                expected_source_sha256=sha256_file(source),
                candidate_zip_sha256="e" * 64,
                source_git_sha="d" * 40,
                product_metadata=metadata,
                output_dir=self.root / "ready-none",
            )
        )

        self.assertEqual(result["reviewApprovalSummary"]["changedCount"], 0)
        self.assertEqual(result["reviewApprovalSummary"]["approvedCount"], 0)
        output_overlay = json.loads(
            (Path(result["bundle"]) / OVERLAY).read_text(encoding="utf-8")
        )
        tqqq = next(row for row in output_overlay["rows"] if row["ticker"] == "TQQQ")
        self.assertEqual(tqqq["reviewFlag"], "none")
        self.assertEqual(tqqq["reviewApprovalStatus"], "review_required")

    def test_builder_rejects_unused_product_metadata(self) -> None:
        source, metadata, _ = self.create_source(include_unused_metadata=True)

        with self.assertRaisesRegex(
            ReviewArtifactError,
            "product metadata identity must bind exactly one overlay row",
        ):
            build(
                argparse.Namespace(
                    source_export=source,
                    expected_source_sha256=sha256_file(source),
                    candidate_zip_sha256="e" * 64,
                    source_git_sha="d" * 40,
                    product_metadata=metadata,
                    output_dir=self.root / "unused-metadata",
                )
            )

    def test_builder_rejects_metadata_identity_used_more_than_once(self) -> None:
        source, metadata, _ = self.create_source(
            duplicate_metadata_identity_usage=True,
        )

        with self.assertRaisesRegex(
            ReviewArtifactError,
            "product metadata identity must bind exactly one overlay row",
        ):
            build(
                argparse.Namespace(
                    source_export=source,
                    expected_source_sha256=sha256_file(source),
                    candidate_zip_sha256="e" * 64,
                    source_git_sha="d" * 40,
                    product_metadata=metadata,
                    output_dir=self.root / "duplicate-metadata-usage",
                )
            )

    def test_builder_rejects_legacy_shard_without_proxy_lineage(self) -> None:
        source, metadata, _ = self.create_source(legacy_lineage=True)
        with self.assertRaisesRegex(
            ReviewArtifactError,
            "row encoding must preserve explicit proxy lineage",
        ):
            build(
                argparse.Namespace(
                    source_export=source,
                    expected_source_sha256=sha256_file(source),
                    candidate_zip_sha256="e" * 64,
                    source_git_sha="d" * 40,
                    product_metadata=metadata,
                    output_dir=self.root / "legacy-lineage",
                )
            )

    def test_builder_rejects_invalid_proxy_lineage_types_before_policy(self) -> None:
        for label, lineage in (
            ("null_ticker", (False, None)),
            ("string_flag", ("false", "")),
            ("numeric_flag", (0, "")),
        ):
            with self.subTest(label=label):
                source, metadata, _ = self.create_source(invalid_lineage=lineage)
                with self.assertRaisesRegex(
                    ReviewArtifactError,
                    "proxy lineage type is invalid",
                ):
                    build(
                        argparse.Namespace(
                            source_export=source,
                            expected_source_sha256=sha256_file(source),
                            candidate_zip_sha256="e" * 64,
                            source_git_sha="d" * 40,
                            product_metadata=metadata,
                            output_dir=self.root / f"invalid-lineage-{label}",
                        )
                    )

    def test_builder_keeps_proxy_geared_asset_review_required(self) -> None:
        source, metadata, _ = self.create_source(proxy_geared=True)
        result = build(
            argparse.Namespace(
                source_export=source,
                expected_source_sha256=sha256_file(source),
                candidate_zip_sha256="e" * 64,
                source_git_sha="d" * 40,
                product_metadata=metadata,
                output_dir=self.root / "proxy-geared",
            )
        )
        output_overlay = json.loads(
            (Path(result["bundle"]) / OVERLAY).read_text(encoding="utf-8")
        )
        tqqq = next(row for row in output_overlay["rows"] if row["ticker"] == "TQQQ")
        self.assertEqual(tqqq["reviewFlag"], "review_required")
        self.assertIn(
            "unsupported_product_policy:proxy_monthly_return",
            tqqq["reviewApprovalReasonCodes"],
        )


if __name__ == "__main__":
    unittest.main()
