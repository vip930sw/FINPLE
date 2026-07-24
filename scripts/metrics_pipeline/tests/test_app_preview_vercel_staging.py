from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import shutil
import tempfile
import unittest
import zipfile

from scripts.stage_app_preview_vercel import (
    EXPECTED_EXPORT_VERSION,
    StagingError,
    normalize_api_upstream_base_url,
    sha256_file,
    stage_app_preview,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
API_UPSTREAM = "https://finple-api.onrender.com/api"
EXPECTED_ASSET_COUNT = 6000
EXPECTED_MONTHLY_RETURN_ASSET_COUNT = 5318
EXPECTED_MONTHLY_RETURN_ROW_COUNT = 700375
EXPECTED_SHARD_COUNT = 64
EXPECTED_METRIC_DATA_THROUGH_MONTH = "2026-06"


def _json_bytes(value: object) -> bytes:
    return (json.dumps(value, separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")


def _write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(_json_bytes(value))


def _record(path: Path, root: Path) -> dict[str, object]:
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": sha256_file(path),
        "sizeBytes": path.stat().st_size,
    }


def _distribute(total: int, buckets: int) -> list[int]:
    base, remainder = divmod(total, buckets)
    return [base + (1 if index < remainder else 0) for index in range(buckets)]


def _metric_row(market: str, ticker: str) -> dict[str, object]:
    return {
        "identity": f"{market}:{ticker}",
        "market": market,
        "ticker": ticker,
        "selectedCagr": None,
        "rawPriceCagr10y": None,
        "rollingCagr10yMedian": None,
        "rollingCagr10yP25": None,
        "rollingCagr10yP75": None,
        "validRollingWindowCount10y": None,
        "cagrPolicy": "insufficient",
        "selectedMdd": None,
        "mddPolicy": "full_period_actual",
        "selectedBeta": None,
        "betaPolicy": "aligned_monthly_return_beta",
        "dividendYield": None,
        "dividendStatus": "unknown",
        "dataStatus": "review_required",
        "reviewFlag": "review_required",
        "reviewReason": "fixture",
        "metricBaseDate": "2026-07-22",
    }


def make_export(root: Path) -> Path:
    export = root / "export"
    export.mkdir()

    rows = [_metric_row("KR", "069500"), _metric_row("KR", "0086C0")]
    kr_index = 0
    while sum(row["market"] == "KR" for row in rows) < 3000:
        ticker = str(kr_index).zfill(6)
        kr_index += 1
        if any(row["identity"] == f"KR:{ticker}" for row in rows):
            continue
        rows.append(_metric_row("KR", ticker))
    qqq = _metric_row("US", "QQQ")
    qqq.update(
        {
            "selectedCagr": 17.11,
            "rawPriceCagr10y": 21.21,
            "rollingCagr10yMedian": 17.11,
            "rollingCagr10yP25": 15.62,
            "rollingCagr10yP75": 18.59,
            "validRollingWindowCount10y": 120,
            "cagrPolicy": "rolling_10y_median",
            "selectedMdd": -49.97,
            "selectedBeta": 1.1098,
            "dataStatus": "ready",
            "reviewFlag": "none",
            "reviewReason": None,
        }
    )
    rows.append(qqq)
    us_index = 0
    while sum(row["market"] == "US" for row in rows) < 3000:
        ticker = f"U{us_index:04d}"
        us_index += 1
        rows.append(_metric_row("US", ticker))
    self_count = len(rows)
    if self_count != EXPECTED_ASSET_COUNT:
        raise AssertionError(f"fixture asset count is {self_count}")

    overlay = {
        "exportVersion": EXPECTED_EXPORT_VERSION,
        "metricDataThroughMonth": EXPECTED_METRIC_DATA_THROUGH_MONTH,
        "rows": rows,
    }
    _write_json(export / "metrics-overlay.json", overlay)
    _write_json(export / "app-preview-qa-summary.json", {"status": "fixture"})

    asset_counts = _distribute(EXPECTED_MONTHLY_RETURN_ASSET_COUNT, EXPECTED_SHARD_COUNT)
    row_counts = _distribute(EXPECTED_MONTHLY_RETURN_ROW_COUNT, EXPECTED_SHARD_COUNT)
    shard_records: list[dict[str, object]] = []
    for index in range(EXPECTED_SHARD_COUNT):
        shard_id = f"{index:02x}"
        shard_path = export / "monthly-returns" / f"monthly-returns-{shard_id}.json"
        _write_json(
            shard_path,
            {
                "exportVersion": EXPECTED_EXPORT_VERSION,
                "shardId": shard_id,
                "series": {},
            },
        )
        shard_records.append(
            {
                "shardId": shard_id,
                "path": shard_path.relative_to(export).as_posix(),
                "assetCount": asset_counts[index],
                "rowCount": row_counts[index],
                "sha256": sha256_file(shard_path),
                "sizeBytes": shard_path.stat().st_size,
            }
        )

    index_assets: dict[str, dict[str, object]] = {}
    for index, row in enumerate(rows[:EXPECTED_MONTHLY_RETURN_ASSET_COUNT]):
        shard = shard_records[index % EXPECTED_SHARD_COUNT]
        index_assets[str(row["identity"])] = {
            "market": row["market"],
            "ticker": row["ticker"],
            "shard": shard["path"],
            "rowCount": 1,
        }
    monthly_index = {
        "exportVersion": EXPECTED_EXPORT_VERSION,
        "metricDataThroughMonth": EXPECTED_METRIC_DATA_THROUGH_MONTH,
        "assetCount": EXPECTED_MONTHLY_RETURN_ASSET_COUNT,
        "rowCount": EXPECTED_MONTHLY_RETURN_ROW_COUNT,
        "assets": index_assets,
        "shards": shard_records,
    }
    _write_json(export / "monthly-returns-index.json", monthly_index)

    content_files = sorted(
        (path for path in export.rglob("*") if path.is_file()),
        key=lambda path: path.relative_to(export).as_posix(),
    )
    inventory = [_record(path, export) for path in content_files]
    by_path = {str(record["path"]): record for record in inventory}
    manifest = {
        "schemaVersion": 1,
        "exportVersion": EXPECTED_EXPORT_VERSION,
        "sourceCandidatePackageId": "fixture-candidate-package",
        "sourceCandidatePackageHash": "a" * 64,
        "metricBaseDate": "2026-07-22",
        "metricDataThroughMonth": EXPECTED_METRIC_DATA_THROUGH_MONTH,
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
        "assetCount": EXPECTED_ASSET_COUNT,
        "monthlyReturnAssetCount": EXPECTED_MONTHLY_RETURN_ASSET_COUNT,
        "monthlyReturnRowCount": EXPECTED_MONTHLY_RETURN_ROW_COUNT,
        "shardCount": EXPECTED_SHARD_COUNT,
        "shardInventory": shard_records,
        "marketAssetCounts": {"KR": 3000, "US": 3000},
        "excludedSourceRoles": ["raw_daily_prices", "normalized_month_end"],
        "metricsOverlay": by_path["metrics-overlay.json"],
        "monthlyReturnsIndex": by_path["monthly-returns-index.json"],
        "qaSummary": by_path["app-preview-qa-summary.json"],
        "shards": shard_records,
        "files": inventory,
    }
    _write_json(export / "app-preview-manifest.json", manifest)
    return export


def make_zip(export: Path, output: Path) -> Path:
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(export.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(export).as_posix())
    return output


def fake_build(
    project_dir: Path,
    static_output_dir: Path,
    target_base_url: str,
    preview_api_base_url: str,
) -> None:
    if project_dir != REPOSITORY_ROOT:
        raise AssertionError("build did not use repository root")
    if target_base_url != "/app-preview-data/2026-07-22":
        raise AssertionError(f"unexpected Preview base URL: {target_base_url}")
    if preview_api_base_url != "/preview-api":
        raise AssertionError(f"unexpected Preview API base URL: {preview_api_base_url}")
    (static_output_dir / "assets").mkdir(parents=True, exist_ok=True)
    (static_output_dir / "index.html").write_text("<html>preview</html>", encoding="utf-8")
    (static_output_dir / "assets" / "index-fixture.js").write_text(
        'const apiBase="/preview-api";',
        encoding="utf-8",
    )


class AppPreviewVercelStagingTests(unittest.TestCase):
    def _stage(self, source: Path, stage: Path, *, expected_hash: str | None = None) -> dict[str, object]:
        return stage_app_preview(
            input_export=source,
            staging_dir=stage,
            target_segment="2026-07-22",
            expected_zip_sha256=expected_hash,
            api_upstream_base_url=API_UPSTREAM,
            project_dir=REPOSITORY_ROOT,
            build_runner=fake_build,
        )

    def test_good_zip_stages_exact_counts_root_relative_path_and_no_repo_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(root)
            archive = make_zip(export, root / "verified.zip")
            stage = root / "new-parent" / "stage"
            status_before = shutil.which("git")
            summary = self._stage(archive, stage, expected_hash=sha256_file(archive))

            self.assertIsNotNone(status_before)
            self.assertEqual(summary["assetCount"], 6000)
            self.assertEqual(summary["monthlyReturnAssetCount"], 5318)
            self.assertEqual(summary["monthlyReturnRowCount"], 700375)
            self.assertEqual(summary["shardCount"], 64)
            self.assertEqual(summary["targetBaseUrl"], "/app-preview-data/2026-07-22")
            self.assertEqual(summary["previewApiBaseUrl"], "/preview-api")
            self.assertEqual(summary["apiUpstreamBaseUrl"], API_UPSTREAM)
            self.assertTrue(summary["repositoryStatusUnchanged"])
            self.assertFalse(summary["productionSelectorChanged"])
            static = stage / ".vercel" / "output" / "static"
            self.assertTrue((static / "index.html").is_file())
            self.assertTrue(
                (static / "app-preview-data" / "2026-07-22" / "app-preview-manifest.json").is_file()
            )
            config = json.loads((stage / ".vercel" / "output" / "config.json").read_text(encoding="utf-8"))
            self.assertEqual(config["version"], 3)
            self.assertEqual(
                config["routes"],
                [
                    {
                        "src": "/preview-api/(.*)",
                        "dest": "https://finple-api.onrender.com/api/$1",
                    },
                    {"handle": "filesystem"},
                    {"src": "/.*", "dest": "/index.html"},
                ],
            )

            proxy_route = config["routes"][0]
            proxy_pattern = re.compile(proxy_route["src"])
            for method, path, expected_destination in (
                ("GET", "/preview-api/health/live", f"{API_UPSTREAM}/health/live"),
                ("POST", "/preview-api/auth/login", f"{API_UPSTREAM}/auth/login"),
                ("OPTIONS", "/preview-api/auth/login", f"{API_UPSTREAM}/auth/login"),
            ):
                with self.subTest(method=method, path=path):
                    match = proxy_pattern.fullmatch(path)
                    self.assertIsNotNone(match)
                    self.assertNotIn("methods", proxy_route)
                    self.assertEqual(
                        proxy_route["dest"].replace("$1", match.group(1)),
                        expected_destination,
                    )
            self.assertIsNone(
                proxy_pattern.fullmatch(
                    "/app-preview-data/2026-07-22/app-preview-manifest.json"
                )
            )

    def test_wrong_zip_hash_fails_before_replacing_existing_stage(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = make_zip(make_export(root), root / "verified.zip")
            stage = root / "stage"
            stage.mkdir()
            marker = stage / "existing.txt"
            marker.write_text("keep", encoding="utf-8")
            with self.assertRaisesRegex(StagingError, "ZIP SHA-256 mismatch"):
                self._stage(archive, stage, expected_hash="0" * 64)
            self.assertEqual(marker.read_text(encoding="utf-8"), "keep")

    def test_zip_traversal_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "malicious.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("../escape.json", "{}")
            with self.assertRaisesRegex(StagingError, "unsafe archive"):
                self._stage(archive, root / "stage", expected_hash=sha256_file(archive))
            self.assertFalse((root / "escape.json").exists())

    def test_missing_inventory_file_and_sha_mismatch_are_distinct_failures(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(root)
            (export / "app-preview-qa-summary.json").unlink()
            with self.assertRaisesRegex(StagingError, "inventory mismatch"):
                self._stage(export, root / "missing-stage")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(root)
            (export / "app-preview-qa-summary.json").write_text('{"tampered":true}\n', encoding="utf-8")
            with self.assertRaisesRegex(StagingError, "inventory (size|SHA-256) mismatch"):
                self._stage(export, root / "hash-stage")

    def test_manifest_gate_failure_preserves_existing_atomic_stage(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(root)
            stage = root / "stage"
            self._stage(export, stage)
            prior_summary = (stage / "staging-summary.json").read_bytes()
            manifest_path = export / "app-preview-manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["productionPublishReady"] = True
            _write_json(manifest_path, manifest)

            with self.assertRaisesRegex(StagingError, "productionPublishReady"):
                self._stage(export, stage)
            self.assertEqual((stage / "staging-summary.json").read_bytes(), prior_summary)
            self.assertTrue((stage / ".vercel" / "output" / "static" / "index.html").is_file())

    def test_shard_count_and_row_count_gates_fail_closed(self) -> None:
        for field, bad_value, message in (
            ("monthlyReturnRowCount", EXPECTED_MONTHLY_RETURN_ROW_COUNT - 1, "monthlyReturnRowCount"),
            ("monthlyReturnAssetCount", EXPECTED_MONTHLY_RETURN_ASSET_COUNT - 1, "monthlyReturnAssetCount"),
        ):
            with self.subTest(field=field), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                export = make_export(root)
                manifest_path = export / "app-preview-manifest.json"
                manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
                manifest[field] = bad_value
                _write_json(manifest_path, manifest)
                with self.assertRaisesRegex(StagingError, message):
                    self._stage(export, root / "stage")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            export = make_export(root)
            manifest_path = export / "app-preview-manifest.json"
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            manifest["shards"] = manifest["shards"][:-1]
            _write_json(manifest_path, manifest)
            with self.assertRaisesRegex(StagingError, "shard count"):
                self._stage(export, root / "stage")

    def test_staging_cannot_be_inside_or_contain_repository(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            export = make_export(Path(temporary))
            for unsafe_stage in (REPOSITORY_ROOT / "generated-preview", REPOSITORY_ROOT.parent):
                with self.subTest(stage=unsafe_stage), self.assertRaisesRegex(
                    StagingError,
                    "must be outside",
                ):
                    self._stage(export, unsafe_stage)

    def test_api_upstream_validation_is_https_credential_free_and_normalized(self) -> None:
        self.assertEqual(
            normalize_api_upstream_base_url(f"{API_UPSTREAM}/"),
            API_UPSTREAM,
        )
        invalid_values = (
            "http://finple-api.onrender.com/api",
            "https://user@finple-api.onrender.com/api",
            "https://user:password@finple-api.onrender.com/api",
            "https://finple-api.onrender.com/api?token=value",
            "https://finple-api.onrender.com/api#fragment",
            " https://finple-api.onrender.com/api",
            "https:///api",
        )
        for value in invalid_values:
            with self.subTest(value=value), self.assertRaises(StagingError):
                normalize_api_upstream_base_url(value)

    def test_runbook_keeps_vercel_curl_in_stage_without_forwarding_cwd(self) -> None:
        runbook = (
            REPOSITORY_ROOT
            / "docs"
            / "portfolio-ml"
            / "FINPLE_STEP114_2ZA_PROTECTED_PREVIEW_RUNBOOK.md"
        ).read_text(encoding="utf-8")
        self.assertIn("--api-upstream-base-url $ApiUpstream", runbook)
        self.assertIn("Push-Location -LiteralPath $Stage", runbook)
        self.assertIn(
            'curl "/preview-api/auth/login" --deployment $PreviewUrl -- --request OPTIONS',
            runbook,
        )
        self.assertNotRegex(runbook, r"vercel@56\.4\.1 curl[^\n]*--cwd")


if __name__ == "__main__":
    unittest.main()
