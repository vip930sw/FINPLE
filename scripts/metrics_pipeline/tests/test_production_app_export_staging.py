from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest import mock
import zipfile

from scripts.metrics_pipeline.tests.test_app_preview_vercel_staging import (
    _write_json,
    make_export,
)
from scripts.stage_app_preview_vercel import StagingError, sha256_file
from scripts.stage_production_app_export_vercel import (
    CANDIDATE_PACKAGE_HASH,
    CANDIDATE_ZIP_SHA256,
    RELEASE_MANIFEST_NAME,
    RELEASE_CONTRACT_VERSION,
    SOURCE_GIT_MAIN_SHA,
    UNIVERSE_VERSION,
    build_parser,
    normalize_production_api_base_url,
    run_production_build,
    stage_production_app_export,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
TARGET_SEGMENT = "finple-universe-v2-2026-07-24"
PRODUCTION_API_BASE_URL = "https://finple-api.example.com/api"


def _record(path: Path, root: Path) -> dict[str, object]:
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": sha256_file(path),
        "sizeBytes": path.stat().st_size,
    }


def _distribute(total: int, buckets: int) -> list[int]:
    base, remainder = divmod(total, buckets)
    return [base + (1 if index < remainder else 0) for index in range(buckets)]


def make_production_export(root: Path) -> Path:
    export = make_export(root)
    overlay_path = export / "metrics-overlay.json"
    overlay = json.loads(overlay_path.read_text(encoding="utf-8"))
    for row in overlay["rows"]:
        row.update(
            {
                "internalPreviewReviewOnly": True,
                "productionPublishReady": False,
                "appExportApproved": False,
                "rawPriceCoverageStatus": "covered",
            }
        )
    for index in range(29):
        ticker = f"ZADD{index:02d}"
        overlay["rows"].append(
            {
                "identity": f"US:{ticker}",
                "market": "US",
                "ticker": ticker,
                "selectedCagr": 8,
                "rawPriceCagr10y": 8,
                "rollingCagr10yMedian": 8,
                "rollingCagr10yP25": 7,
                "rollingCagr10yP75": 9,
                "validRollingWindowCount10y": 24,
                "cagrPolicy": "rolling_10y_median",
                "selectedMdd": -20,
                "mddPolicy": "full_period_actual",
                "selectedBeta": 1,
                "betaPolicy": "aligned_monthly_return_beta",
                "dividendYield": None,
                "dividendStatus": "missing",
                "dataStatus": "ready",
                "reviewFlag": "none",
                "reviewReason": "",
                "metricBaseDate": "2026-07-24",
                "rawPriceCoverageStatus": "covered",
                "internalPreviewReviewOnly": True,
                "productionPublishReady": False,
                "appExportApproved": False,
            }
        )
    _write_json(overlay_path, overlay)

    index_path = export / "monthly-returns-index.json"
    monthly_index = json.loads(index_path.read_text(encoding="utf-8"))
    shard_records = monthly_index["shards"]
    asset_counts = _distribute(5347, len(shard_records))
    row_counts = _distribute(701485, len(shard_records))
    for index, shard in enumerate(shard_records):
        shard["assetCount"] = asset_counts[index]
        shard["rowCount"] = row_counts[index]
    for index in range(29):
        ticker = f"ZADD{index:02d}"
        shard = shard_records[index % len(shard_records)]
        monthly_index["assets"][f"US:{ticker}"] = {
            "market": "US",
            "ticker": ticker,
            "shard": shard["path"],
            "rowCount": 0,
        }
    monthly_index["assetCount"] = 5347
    monthly_index["rowCount"] = 701485
    monthly_index["shards"] = shard_records
    _write_json(index_path, monthly_index)

    manifest_path = export / "app-preview-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest.update(
        {
            "sourceCandidatePackageHash": CANDIDATE_PACKAGE_HASH,
            "metricBaseDate": "2026-07-24",
            "assetCount": 6029,
            "marketAssetCounts": {"KR": 3000, "US": 3029},
            "rawMissingAssetCount": 16,
            "monthlyReturnAssetCount": 5347,
            "monthlyReturnRowCount": 701485,
            "shards": shard_records,
            "shardInventory": shard_records,
            "shardCount": len(shard_records),
            "metricsOverlay": _record(overlay_path, export),
            "monthlyReturnsIndex": _record(index_path, export),
        }
    )
    content_files = sorted(
        path for path in export.rglob("*")
        if path.is_file() and path != manifest_path
    )
    manifest["files"] = [_record(path, export) for path in content_files]
    _write_json(manifest_path, manifest)
    return export


def make_zip(export: Path, output: Path) -> Path:
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(export.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(export).as_posix())
    return output


def make_release(
    export: Path,
    archive: Path,
    output: Path,
    *,
    overrides: dict[str, object] | None = None,
) -> Path:
    source_manifest_path = export / "app-preview-manifest.json"
    source_manifest = json.loads(source_manifest_path.read_text(encoding="utf-8"))
    release = {
        "schemaVersion": 1,
        "contractVersion": RELEASE_CONTRACT_VERSION,
        "universeVersion": UNIVERSE_VERSION,
        "candidateZipSha256": CANDIDATE_ZIP_SHA256,
        "candidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "sourceAppExportSha256": sha256_file(archive),
        "sourceManifest": _record(source_manifest_path, export),
        "assetCount": 6029,
        "marketAssetCounts": {"KR": 3000, "US": 3029},
        "priceCoveredAssetCount": 6013,
        "monthlyReturnAssetCount": 5347,
        "monthlyReturnRowCount": 701485,
        "metricDataThroughMonth": "2026-06",
        "metricsOverlay": source_manifest["metricsOverlay"],
        "monthlyReturnsIndex": source_manifest["monthlyReturnsIndex"],
        "shardCount": source_manifest["shardCount"],
        "shardInventory": source_manifest["shardInventory"],
        "productionPublishReady": True,
        "appExportApproved": True,
        "approvedAt": "2026-07-26T00:00:00Z",
        "approvedBy": "fixture-release-approver",
        "sourceGitMainSha": SOURCE_GIT_MAIN_SHA,
    }
    release.update(overrides or {})
    _write_json(output, release)
    return output


def fake_build(
    project_dir: Path,
    static_output_dir: Path,
    target_base_url: str,
    release_manifest_sha256: str,
    source_app_export_sha256: str,
    api_base_url: str,
) -> None:
    if project_dir != REPOSITORY_ROOT:
        raise AssertionError("build did not use repository root")
    if target_base_url != f"/app-data/{TARGET_SEGMENT}":
        raise AssertionError("build did not use the versioned Production path")
    if len(release_manifest_sha256) != 64 or len(source_app_export_sha256) != 64:
        raise AssertionError("build did not receive exact SHA bindings")
    if api_base_url != PRODUCTION_API_BASE_URL:
        raise AssertionError("build did not receive the explicit Production API base")
    (static_output_dir / "assets").mkdir(parents=True, exist_ok=True)
    (static_output_dir / "index.html").write_text("<html>production</html>", encoding="utf-8")
    (static_output_dir / "assets" / "index-fixture.js").write_text(
        "\n".join(
            (
                f'const apiBase="{api_base_url}";',
                f'const dataBase="{target_base_url}";',
                f'const manifest="{RELEASE_MANIFEST_NAME}";',
                f'const releaseSha="{release_manifest_sha256}";',
                f'const sourceSha="{source_app_export_sha256}";',
            )
        ),
        encoding="utf-8",
    )


class ProductionAppExportStagingTests(unittest.TestCase):
    def _fixture(self, root: Path, *, release_overrides=None):
        export = make_production_export(root)
        archive = make_zip(export, root / "app-export.zip")
        release = make_release(
            export,
            archive,
            root / "production-app-export-release.json",
            overrides=release_overrides,
        )
        return export, archive, release

    def _stage(self, archive: Path, release: Path, stage: Path):
        return stage_production_app_export(
            input_export_zip=archive,
            release_manifest=release,
            staging_dir=stage,
            target_segment=TARGET_SEGMENT,
            expected_app_export_sha256=sha256_file(archive),
            expected_release_manifest_sha256=sha256_file(release),
            api_base_url=PRODUCTION_API_BASE_URL,
            project_dir=REPOSITORY_ROOT,
            build_runner=fake_build,
        )

    def test_stages_versioned_production_output_without_preview_routes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, archive, release = self._fixture(root)
            stage = root / "stage"
            summary = self._stage(archive, release, stage)
            self.assertEqual(summary["assetCount"], 6029)
            self.assertEqual(summary["monthlyReturnAssetCount"], 5347)
            self.assertEqual(summary["monthlyReturnRowCount"], 701485)
            self.assertFalse(summary["previewApiRewriteIncluded"])
            self.assertFalse(summary["previewProtectionCopied"])
            self.assertFalse(summary["productionDeployPromoteExecuted"])
            self.assertEqual(summary["productionApiBaseUrl"], PRODUCTION_API_BASE_URL)
            self.assertEqual(
                summary["productionApiOrigin"],
                "https://finple-api.example.com",
            )
            self.assertEqual(
                summary["productionApiConfiguration"],
                "explicit_required_https_api_base",
            )
            output = stage / ".vercel" / "output"
            config = json.loads((output / "config.json").read_text(encoding="utf-8"))
            self.assertEqual(
                config["routes"],
                [{"handle": "filesystem"}, {"src": "/.*", "dest": "/index.html"}],
            )
            self.assertNotIn("/preview-api", json.dumps(config))
            data_root = output / "static" / "app-data" / TARGET_SEGMENT
            self.assertTrue((data_root / "app-preview-manifest.json").is_file())
            self.assertTrue((data_root / "production-app-export-release.json").is_file())
            inventory = json.loads(
                (stage / "production-build-output-inventory.json").read_text(encoding="utf-8")
            )
            self.assertEqual(inventory["fileCount"], len(inventory["files"]))
            qa = json.loads(
                (stage / "production-cutover-qa-template.json").read_text(encoding="utf-8")
            )
            self.assertEqual(qa["rollbackDeploymentId"], "")
            self.assertFalse(qa["productionDeployPromoteExecuted"])
            self.assertEqual(qa["productionApiBaseUrl"], PRODUCTION_API_BASE_URL)
            self.assertEqual(
                qa["productionApiOrigin"],
                "https://finple-api.example.com",
            )
            self.assertEqual(
                qa["previousProductionSettings"]["VITE_FINPLE_API_BASE_URL"],
                "",
            )
            self.assertIn("VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256", qa["previousProductionSettings"])

    def test_wrong_app_export_hash_preserves_existing_atomic_stage(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, archive, release = self._fixture(root)
            stage = root / "stage"
            stage.mkdir()
            marker = stage / "existing.txt"
            marker.write_text("keep", encoding="utf-8")
            with self.assertRaisesRegex(StagingError, "app-export SHA-256"):
                stage_production_app_export(
                    input_export_zip=archive,
                    release_manifest=release,
                    staging_dir=stage,
                    target_segment=TARGET_SEGMENT,
                    expected_app_export_sha256="0" * 64,
                    expected_release_manifest_sha256=sha256_file(release),
                    api_base_url=PRODUCTION_API_BASE_URL,
                    project_dir=REPOSITORY_ROOT,
                    build_runner=fake_build,
                )
            self.assertEqual(marker.read_text(encoding="utf-8"), "keep")

    def test_wrong_candidate_hash_and_missing_or_extra_shards_fail_closed(self) -> None:
        scenarios = (
            {"candidateZipSha256": "0" * 64},
            {"shardInventory": []},
        )
        for overrides in scenarios:
            with self.subTest(overrides=overrides), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                _, archive, release = self._fixture(root, release_overrides=overrides)
                with self.assertRaises(StagingError):
                    self._stage(archive, release, root / "stage")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export, archive, release = self._fixture(root)
            payload = json.loads(release.read_text(encoding="utf-8"))
            payload["shardInventory"] = [
                *payload["shardInventory"],
                payload["shardInventory"][0],
            ]
            _write_json(release, payload)
            with self.assertRaises(StagingError):
                self._stage(archive, release, root / "stage")

    def test_source_manifest_binding_tamper_fails_before_replacement(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, archive, release = self._fixture(root)
            payload = json.loads(release.read_text(encoding="utf-8"))
            payload["sourceManifest"]["sha256"] = "0" * 64
            _write_json(release, payload)
            with self.assertRaisesRegex(StagingError, "source manifest binding"):
                self._stage(archive, release, root / "stage")

    def test_staging_must_remain_outside_repository(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, archive, release = self._fixture(root)
            with self.assertRaisesRegex(StagingError, "must be outside"):
                self._stage(
                    archive,
                    release,
                    REPOSITORY_ROOT / "generated-production-stage",
                )

    def test_api_base_url_contract_and_trailing_slash_normalization(self) -> None:
        self.assertEqual(
            normalize_production_api_base_url(PRODUCTION_API_BASE_URL),
            PRODUCTION_API_BASE_URL,
        )
        self.assertEqual(
            normalize_production_api_base_url(f"{PRODUCTION_API_BASE_URL}/"),
            PRODUCTION_API_BASE_URL,
        )
        invalid_values = (
            "",
            " https://finple-api.example.com/api",
            "https://finple-api.example.com/api ",
            "http://finple-api.example.com/api",
            "https://localhost/api",
            "https://service.localhost/api",
            "https://127.0.0.1/api",
            "https://[::1]/api",
            "https://user:password@finple-api.example.com/api",
            "https://finple-api.example.com/api?mode=production",
            "https://finple-api.example.com/api#production",
            "https://finple-api.example.com/v1",
        )
        for value in invalid_values:
            with self.subTest(value=value), self.assertRaises(StagingError):
                normalize_production_api_base_url(value)

    def test_cli_requires_explicit_api_base_url(self) -> None:
        required_args = [
            "--input-export-zip",
            "input.zip",
            "--release-manifest",
            "release.json",
            "--staging-dir",
            "stage",
            "--target-segment",
            TARGET_SEGMENT,
            "--expected-app-export-sha256",
            "a" * 64,
            "--expected-release-manifest-sha256",
            "b" * 64,
        ]
        with self.assertRaises(SystemExit) as raised:
            build_parser().parse_args(required_args)
        self.assertEqual(raised.exception.code, 2)

    def test_build_environment_forces_explicit_api_over_ambient_localhost(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "dist"
            with (
                mock.patch.dict(
                    os.environ,
                    {"VITE_FINPLE_API_BASE_URL": "http://localhost:5050/api"},
                ),
                mock.patch(
                    "scripts.stage_production_app_export_vercel.subprocess.run"
                ) as run,
            ):
                run_production_build(
                    REPOSITORY_ROOT,
                    output,
                    f"/app-data/{TARGET_SEGMENT}",
                    "a" * 64,
                    "b" * 64,
                    PRODUCTION_API_BASE_URL,
                    extra_env={
                        "VITE_FINPLE_API_BASE_URL": "http://localhost:5050/api"
                    },
                )
            run.assert_called_once()
            invocation = run.call_args
            self.assertEqual(
                invocation.kwargs["env"]["VITE_FINPLE_API_BASE_URL"],
                PRODUCTION_API_BASE_URL,
            )
            self.assertEqual(
                invocation.kwargs["env"]["VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED"],
                "true",
            )

    def test_bundle_missing_api_or_containing_localhost_fails_closed(self) -> None:
        def make_invalid_build(mode: str):
            def invalid_build(
                project_dir: Path,
                static_output_dir: Path,
                target_base_url: str,
                release_manifest_sha256: str,
                source_app_export_sha256: str,
                api_base_url: str,
            ) -> None:
                (static_output_dir / "assets").mkdir(parents=True, exist_ok=True)
                (static_output_dir / "index.html").write_text(
                    "<html>production</html>",
                    encoding="utf-8",
                )
                required_api = "" if mode == "missing" else api_base_url
                localhost = (
                    ""
                    if mode == "missing"
                    else 'const legacy="http://localhost:5050/api";'
                )
                (static_output_dir / "assets" / "index-fixture.js").write_text(
                    "\n".join(
                        (
                            f'const apiBase="{required_api}";',
                            f'const dataBase="{target_base_url}";',
                            f'const manifest="{RELEASE_MANIFEST_NAME}";',
                            f'const releaseSha="{release_manifest_sha256}";',
                            f'const sourceSha="{source_app_export_sha256}";',
                            localhost,
                        )
                    ),
                    encoding="utf-8",
                )

            return invalid_build

        for mode, message in (
            ("missing", "API base URL is missing"),
            ("localhost", "forbidden runtime string"),
        ):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                _, archive, release = self._fixture(root)
                stage = root / "stage"
                with self.assertRaisesRegex(StagingError, message):
                    stage_production_app_export(
                        input_export_zip=archive,
                        release_manifest=release,
                        staging_dir=stage,
                        target_segment=TARGET_SEGMENT,
                        expected_app_export_sha256=sha256_file(archive),
                        expected_release_manifest_sha256=sha256_file(release),
                        api_base_url=PRODUCTION_API_BASE_URL,
                        project_dir=REPOSITORY_ROOT,
                        build_runner=make_invalid_build(mode),
                    )
                self.assertFalse(stage.exists())


if __name__ == "__main__":
    unittest.main()
