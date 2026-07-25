#!/usr/bin/env python3
"""Stage a verified FINPLE app export as an external Production Build Output.

This command never deploys or promotes. It requires a separately approved
Production release manifest while preserving the source review manifest.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Callable, Mapping

from scripts.stage_app_preview_vercel import (
    StagingError,
    _atomic_publish,
    _extract_zip_safely,
    _git_status,
    _inside,
    _is_link_or_junction,
    _validate_relative_path,
    load_json_strict,
    sha256_file,
    validate_export,
)


RELEASE_MANIFEST_NAME = "production-app-export-release.json"
RELEASE_CONTRACT_VERSION = "finple-production-app-export-release-v1-step114-2zc"
UNIVERSE_VERSION = "finple-universe-v2-2026-07-24"
SOURCE_GIT_MAIN_SHA = "18c6bcc552ce20a6a1c27a0543040fdaec8c7bef"
CANDIDATE_ZIP_SHA256 = "9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e"
CANDIDATE_PACKAGE_HASH = "6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276"
EXPECTED_COUNTS = {
    "assetCount": 6029,
    "marketAssetCounts": {"KR": 3000, "US": 3029},
    "priceCoveredAssetCount": 6013,
    "monthlyReturnAssetCount": 5347,
    "monthlyReturnRowCount": 701485,
    "metricDataThroughMonth": "2026-06",
}
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
SEGMENT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
RELEASE_FIELDS = {
    "appExportApproved",
    "approvedAt",
    "approvedBy",
    "assetCount",
    "candidatePackageHash",
    "candidateZipSha256",
    "contractVersion",
    "marketAssetCounts",
    "metricDataThroughMonth",
    "metricsOverlay",
    "monthlyReturnAssetCount",
    "monthlyReturnRowCount",
    "monthlyReturnsIndex",
    "priceCoveredAssetCount",
    "productionPublishReady",
    "schemaVersion",
    "shardCount",
    "shardInventory",
    "sourceAppExportSha256",
    "sourceGitMainSha",
    "sourceManifest",
    "universeVersion",
}


def _validate_sha256(value: object, label: str) -> str:
    normalized = str(value or "").strip()
    if not SHA256_RE.fullmatch(normalized):
        raise StagingError(f"{label} must be a lowercase SHA-256 digest")
    return normalized


def _require_equal(actual: object, expected: object, label: str) -> None:
    if actual != expected:
        raise StagingError(f"{label} mismatch")


def _validate_file_record(record: object, label: str) -> dict[str, object]:
    if not isinstance(record, dict) or set(record) != {"path", "sha256", "sizeBytes"}:
        raise StagingError(f"{label} must use the exact file-record contract")
    _validate_relative_path(str(record.get("path", "")))
    _validate_sha256(record.get("sha256"), f"{label}.sha256")
    if not isinstance(record.get("sizeBytes"), int) or int(record["sizeBytes"]) <= 0:
        raise StagingError(f"{label}.sizeBytes must be positive")
    return record


def _validate_shard_record(record: object, label: str) -> dict[str, object]:
    fields = {"shardId", "path", "assetCount", "rowCount", "sha256", "sizeBytes"}
    if not isinstance(record, dict) or set(record) != fields:
        raise StagingError(f"{label} must use the exact shard-record contract")
    _validate_relative_path(str(record.get("path", "")))
    _validate_sha256(record.get("sha256"), f"{label}.sha256")
    if not str(record.get("shardId") or "").strip():
        raise StagingError(f"{label}.shardId is required")
    for field in ("assetCount", "rowCount"):
        if not isinstance(record.get(field), int) or int(record[field]) < 0:
            raise StagingError(f"{label}.{field} must be a non-negative integer")
    if not isinstance(record.get("sizeBytes"), int) or int(record["sizeBytes"]) <= 0:
        raise StagingError(f"{label}.sizeBytes must be positive")
    return record


def validate_release_manifest(
    release_path: Path,
    *,
    expected_release_sha256: str,
    expected_app_export_sha256: str,
) -> dict[str, object]:
    expected_release_hash = _validate_sha256(
        expected_release_sha256, "expected release manifest SHA-256"
    )
    actual_release_hash = sha256_file(release_path)
    _require_equal(actual_release_hash, expected_release_hash, "release manifest SHA-256")
    release = load_json_strict(release_path)
    if not isinstance(release, dict) or set(release) != RELEASE_FIELDS:
        raise StagingError("Production release manifest fields are not the exact contract")
    expected = {
        "schemaVersion": 1,
        "contractVersion": RELEASE_CONTRACT_VERSION,
        "universeVersion": UNIVERSE_VERSION,
        "candidateZipSha256": CANDIDATE_ZIP_SHA256,
        "candidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "assetCount": EXPECTED_COUNTS["assetCount"],
        "marketAssetCounts": EXPECTED_COUNTS["marketAssetCounts"],
        "priceCoveredAssetCount": EXPECTED_COUNTS["priceCoveredAssetCount"],
        "monthlyReturnAssetCount": EXPECTED_COUNTS["monthlyReturnAssetCount"],
        "monthlyReturnRowCount": EXPECTED_COUNTS["monthlyReturnRowCount"],
        "metricDataThroughMonth": EXPECTED_COUNTS["metricDataThroughMonth"],
        "productionPublishReady": True,
        "appExportApproved": True,
        "sourceGitMainSha": SOURCE_GIT_MAIN_SHA,
    }
    for field, value in expected.items():
        _require_equal(release.get(field), value, f"release {field}")
    source_hash = _validate_sha256(
        release.get("sourceAppExportSha256"), "release sourceAppExportSha256"
    )
    _require_equal(
        source_hash,
        _validate_sha256(expected_app_export_sha256, "expected app-export SHA-256"),
        "source app-export SHA-256 binding",
    )
    if not str(release.get("approvedBy") or "").strip():
        raise StagingError("release approvedBy is required")
    approved_at = str(release.get("approvedAt") or "")
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z", approved_at):
        raise StagingError("release approvedAt must be an exact UTC timestamp")
    _validate_file_record(release.get("sourceManifest"), "release sourceManifest")
    _validate_file_record(release.get("metricsOverlay"), "release metricsOverlay")
    _validate_file_record(release.get("monthlyReturnsIndex"), "release monthlyReturnsIndex")
    shard_count = release.get("shardCount")
    shards = release.get("shardInventory")
    if shard_count not in (64, 128, 256) or not isinstance(shards, list):
        raise StagingError("release shard inventory is invalid")
    _require_equal(len(shards), shard_count, "release shard inventory length")
    paths: set[str] = set()
    identifiers: set[str] = set()
    for index, record in enumerate(shards):
        shard = _validate_shard_record(record, f"release shardInventory[{index}]")
        path = str(shard["path"])
        shard_id = str(shard["shardId"])
        if path in paths or shard_id in identifiers:
            raise StagingError("release shard inventory contains a duplicate")
        paths.add(path)
        identifiers.add(shard_id)
    _require_equal(
        sum(int(record["assetCount"]) for record in shards),
        EXPECTED_COUNTS["monthlyReturnAssetCount"],
        "release shard asset total",
    )
    _require_equal(
        sum(int(record["rowCount"]) for record in shards),
        EXPECTED_COUNTS["monthlyReturnRowCount"],
        "release shard row total",
    )
    return release


def validate_release_against_export(
    release: dict[str, object],
    export_root: Path,
    export_validation: dict[str, object],
) -> None:
    source_manifest = export_validation["manifest"]
    if not isinstance(source_manifest, dict):
        raise StagingError("source review manifest is invalid")
    expected_source = {
        "sourceCandidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "assetCount": EXPECTED_COUNTS["assetCount"],
        "marketAssetCounts": EXPECTED_COUNTS["marketAssetCounts"],
        "rawMissingAssetCount": 16,
        "monthlyReturnAssetCount": EXPECTED_COUNTS["monthlyReturnAssetCount"],
        "monthlyReturnRowCount": EXPECTED_COUNTS["monthlyReturnRowCount"],
        "metricDataThroughMonth": EXPECTED_COUNTS["metricDataThroughMonth"],
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
    }
    for field, value in expected_source.items():
        _require_equal(source_manifest.get(field), value, f"source review manifest {field}")
    source_manifest_path = export_root / "app-preview-manifest.json"
    actual_source_record = {
        "path": "app-preview-manifest.json",
        "sha256": sha256_file(source_manifest_path),
        "sizeBytes": source_manifest_path.stat().st_size,
    }
    _require_equal(release["sourceManifest"], actual_source_record, "source manifest binding")
    for field in ("metricsOverlay", "monthlyReturnsIndex"):
        _require_equal(release[field], source_manifest.get(field), f"{field} binding")
    _require_equal(
        release["shardInventory"],
        source_manifest.get("shardInventory"),
        "complete shard inventory binding",
    )
    _require_equal(release["shardCount"], source_manifest.get("shardCount"), "shard count binding")


def run_production_build(
    project_dir: Path,
    static_output_dir: Path,
    target_base_url: str,
    release_manifest_sha256: str,
    source_app_export_sha256: str,
    *,
    extra_env: Mapping[str, str] | None = None,
) -> None:
    environment = os.environ.copy()
    environment.update(
        {
            "VITE_FINPLE_APP_PREVIEW_ENABLED": "false",
            "VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED": "true",
            "VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL": target_base_url,
            "VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST": RELEASE_MANIFEST_NAME,
            "VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256": release_manifest_sha256,
            "VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256": source_app_export_sha256,
            "FINPLE_BUILD_OUTPUT_DIR": str(static_output_dir),
        }
    )
    if extra_env:
        environment.update(extra_env)
    command = ["npm.cmd" if os.name == "nt" else "npm", "run", "build"]
    subprocess.run(command, cwd=project_dir, env=environment, check=True)


BuildRunner = Callable[[Path, Path, str, str, str], None]


def _output_inventory(output_root: Path) -> list[dict[str, object]]:
    return [
        {
            "path": path.relative_to(output_root).as_posix(),
            "sha256": sha256_file(path),
            "sizeBytes": path.stat().st_size,
        }
        for path in sorted(output_root.rglob("*"))
        if path.is_file()
    ]


def stage_production_app_export(
    *,
    input_export_zip: Path,
    release_manifest: Path,
    staging_dir: Path,
    target_segment: str,
    expected_app_export_sha256: str,
    expected_release_manifest_sha256: str,
    project_dir: Path,
    build_runner: BuildRunner = run_production_build,
) -> dict[str, object]:
    project = project_dir.resolve(strict=True)
    if not SEGMENT_RE.fullmatch(target_segment):
        raise StagingError("target segment must be one safe URL path segment")
    source = input_export_zip.resolve(strict=True)
    if not source.is_file() or source.suffix.lower() != ".zip":
        raise StagingError("Production staging requires the verified app-export ZIP")
    release_path = release_manifest.resolve(strict=True)
    if not release_path.is_file():
        raise StagingError("Production release manifest is missing")
    expected_export_hash = _validate_sha256(
        expected_app_export_sha256, "expected app-export SHA-256"
    )
    actual_export_hash = sha256_file(source)
    _require_equal(actual_export_hash, expected_export_hash, "input app-export SHA-256")
    release = validate_release_manifest(
        release_path,
        expected_release_sha256=expected_release_manifest_sha256,
        expected_app_export_sha256=expected_export_hash,
    )

    final_argument = staging_dir.absolute()
    if final_argument.exists() and _is_link_or_junction(final_argument):
        raise StagingError("staging target must not be a link or junction")
    final_argument.parent.mkdir(parents=True, exist_ok=True)
    final = final_argument.resolve(strict=False)
    final_parent = final.parent.resolve(strict=True)
    if _is_link_or_junction(final_parent):
        raise StagingError("staging parent must not be a link or junction")
    if _inside(final, project) or _inside(project, final):
        raise StagingError("staging directory must be outside and must not contain the repository")

    status_before = _git_status(project)
    prepared = Path(tempfile.mkdtemp(prefix=f".{final.name}.prepare-", dir=final_parent))
    working = Path(tempfile.mkdtemp(prefix="finple-production-app-export-"))
    try:
        export_root = working / "export"
        _extract_zip_safely(source, export_root)
        export_validation = validate_export(export_root)
        validate_release_against_export(release, export_root, export_validation)

        output_root = prepared / ".vercel" / "output"
        static_root = output_root / "static"
        static_root.mkdir(parents=True, exist_ok=True)
        target_base_url = f"/app-data/{target_segment}"
        release_hash = sha256_file(release_path)
        build_runner(
            project,
            static_root,
            target_base_url,
            release_hash,
            actual_export_hash,
        )
        if not (static_root / "index.html").is_file():
            raise StagingError("Production build did not produce index.html")
        data_target = static_root / "app-data" / target_segment
        shutil.copytree(export_root, data_target)
        shutil.copyfile(release_path, data_target / RELEASE_MANIFEST_NAME)

        config = {
            "version": 3,
            "routes": [
                {"handle": "filesystem"},
                {"src": "/.*", "dest": "/index.html"},
            ],
        }
        (output_root / "config.json").write_text(
            json.dumps(config, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        config_text = (output_root / "config.json").read_text(encoding="utf-8")
        if "/preview-api" in config_text or "preview" in json.dumps(config["routes"]).lower():
            raise StagingError("Production Build Output contains a Preview route")

        if _git_status(project) != status_before:
            raise StagingError("repository status changed while staging Production output")

        inventory = _output_inventory(output_root)
        inventory_path = prepared / "production-build-output-inventory.json"
        inventory_path.write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "targetBaseUrl": target_base_url,
                    "fileCount": len(inventory),
                    "totalBytes": sum(int(item["sizeBytes"]) for item in inventory),
                    "files": inventory,
                },
                ensure_ascii=False,
                indent=2,
            ) + "\n",
            encoding="utf-8",
        )
        qa_template = {
            "schemaVersion": 1,
            "cutoverExecuted": False,
            "productionDeployPromoteExecuted": False,
            "rollbackDeploymentId": "",
            "previousProductionSettings": {
                "VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED": "",
                "VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL": "",
                "VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST": "",
                "VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256": "",
                "VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256": "",
            },
            "desktop1440QaPassed": False,
            "mobile375QaPassed": False,
            "pdfPrintShareQaPassed": False,
            "step3QaPassed": False,
            "step4QaPassed": False,
            "step5UnchangedConfirmed": False,
            "step6ScenarioContextExcludedConfirmed": False,
            "rollbackRehearsalPassed": False,
            "operatorNotes": "",
        }
        (prepared / "production-cutover-qa-template.json").write_text(
            json.dumps(qa_template, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        summary = {
            "schemaVersion": 1,
            "stagingMode": "vercel_production_build_output_api_v3_not_deployed",
            "targetBaseUrl": target_base_url,
            "sourceAppExportSha256": actual_export_hash,
            "releaseManifestSha256": release_hash,
            "assetCount": release["assetCount"],
            "marketAssetCounts": release["marketAssetCounts"],
            "priceCoveredAssetCount": release["priceCoveredAssetCount"],
            "monthlyReturnAssetCount": release["monthlyReturnAssetCount"],
            "monthlyReturnRowCount": release["monthlyReturnRowCount"],
            "metricDataThroughMonth": release["metricDataThroughMonth"],
            "shardCount": release["shardCount"],
            "productionPublishReady": release["productionPublishReady"],
            "appExportApproved": release["appExportApproved"],
            "productionApiConfiguration": "inherited_unmodified",
            "previewApiRewriteIncluded": False,
            "previewProtectionCopied": False,
            "repositoryStatusUnchanged": True,
            "productionDeployPromoteExecuted": False,
        }
        (prepared / "staging-summary.json").write_text(
            json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        _atomic_publish(prepared, final)
        return summary
    except Exception:
        if prepared.exists():
            shutil.rmtree(prepared, ignore_errors=True)
        raise
    finally:
        shutil.rmtree(working, ignore_errors=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Validate and stage a FINPLE Production app export outside Git. "
            "This command does not deploy or promote."
        )
    )
    parser.add_argument("--input-export-zip", required=True, type=Path)
    parser.add_argument("--release-manifest", required=True, type=Path)
    parser.add_argument("--staging-dir", required=True, type=Path)
    parser.add_argument("--target-segment", required=True)
    parser.add_argument("--expected-app-export-sha256", required=True)
    parser.add_argument("--expected-release-manifest-sha256", required=True)
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1],
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        summary = stage_production_app_export(
            input_export_zip=args.input_export_zip,
            release_manifest=args.release_manifest,
            staging_dir=args.staging_dir,
            target_segment=args.target_segment,
            expected_app_export_sha256=args.expected_app_export_sha256,
            expected_release_manifest_sha256=args.expected_release_manifest_sha256,
            project_dir=args.project_dir,
        )
    except (OSError, subprocess.CalledProcessError, StagingError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
