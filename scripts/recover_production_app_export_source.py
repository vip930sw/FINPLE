#!/usr/bin/env python3
"""Recover one deterministic FINPLE Production source app-export.

The operator must supply an already detached, clean source worktree at the
fixed source commit and the fixed Candidate ZIP. The script runs the existing
review-only exporter exactly once for Run A and once for Run B, compares every
output fail-closed, and writes only an external untracked receipt.

It never calls a provider, Colab, Google Drive, Candidate calculation,
Production staging, deployment, promotion, or release-manifest generator.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
from typing import Callable, Mapping
import zipfile

from scripts.metrics_pipeline.candidate_package import verify_candidate_package
from scripts.stage_app_preview_vercel import (
    MANIFEST_NAME,
    StagingError,
    _inside,
    _is_link_or_junction,
    _validate_relative_path,
    load_json_strict,
    sha256_file,
    validate_export,
)


SOURCE_GIT_MAIN_SHA = "18c6bcc552ce20a6a1c27a0543040fdaec8c7bef"
CANDIDATE_ZIP_SHA256 = "9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e"
CANDIDATE_PACKAGE_HASH = "6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276"
EXPORTER_VERSION = "finple-app-preview-export-v1-step114-2z"
EXPORTER_COMMAND = (
    "python -B -m scripts.export_finple_app_preview "
    "--input-package <candidate-zip> --output-dir <empty-output> "
    "--shard-count 64 --max-rows-per-shard 12000 "
    "--target-shard-bytes 1048576"
)
EXPECTED_COUNTS = {
    "assetCount": 6029,
    "marketAssetCounts": {"KR": 3000, "US": 3029},
    "priceCoveredAssetCount": 6013,
    "rawMissingAssetCount": 16,
    "monthlyReturnAssetCount": 5347,
    "monthlyReturnRowCount": 701485,
    "metricDataThroughMonth": "2026-06",
    "shardCount": 64,
}
REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
RECEIPT_SCHEMA_PATH = (
    REPOSITORY_ROOT
    / "docs"
    / "portfolio-ml"
    / "contracts"
    / "finple-production-source-artifact-receipt.schema.json"
)
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
OPERATOR_ID_RE = re.compile(r"^[A-Za-z0-9._@-]{1,128}$")
SAFE_REASON_RE = re.compile(r"^[a-z0-9_]+$")
RECEIPT_FIELDS = {
    "schemaVersion",
    "sourceGitMainSha",
    "candidateZipSha256",
    "candidatePackageHash",
    "exporterCommand",
    "exporterVersion",
    "runAZipSha256",
    "runBZipSha256",
    "sourceManifestSha256",
    "metricsOverlaySha256",
    "monthlyIndexSha256",
    "completeShardInventory",
    "completeFileInventoryHash",
    "generatedAt",
    "operatorId",
    "deterministicMatch",
}
SHARD_FIELDS = {
    "shardId",
    "path",
    "assetCount",
    "rowCount",
    "sha256",
    "sizeBytes",
}


class RecoveryError(ValueError):
    """A fail-closed operator error with a non-sensitive reason code."""

    def __init__(self, code: str):
        safe_code = str(code or "")
        if not SAFE_REASON_RE.fullmatch(safe_code):
            safe_code = "operator_recovery_failed"
        super().__init__(safe_code)
        self.code = safe_code


@dataclass(frozen=True)
class GitState:
    head: str
    detached: bool
    status: str


@dataclass(frozen=True)
class ArtifactSnapshot:
    zip_path: Path
    bundle_root: Path
    manifest_path: Path
    overlay_path: Path
    monthly_index_path: Path
    manifest: dict[str, object]
    complete_file_inventory: tuple[dict[str, object], ...]
    complete_file_inventory_hash: str


GitStateReader = Callable[[Path], GitState]
CandidateVerifier = Callable[[Path], dict[str, object]]
CandidateHashReader = Callable[[Path], str]
ExporterRunner = Callable[[str, Path, Path, Path, Mapping[str, str]], dict[str, object]]
Clock = Callable[[], datetime]


@dataclass(frozen=True)
class RecoveryDependencies:
    git_state_reader: GitStateReader
    candidate_verifier: CandidateVerifier
    candidate_hash_reader: CandidateHashReader
    exporter_runner: ExporterRunner
    clock: Clock
    current_checkout: Path


def _default_dependencies() -> RecoveryDependencies:
    return RecoveryDependencies(
        git_state_reader=read_git_state,
        candidate_verifier=verify_candidate_package,
        candidate_hash_reader=sha256_file,
        exporter_runner=run_exporter_once,
        clock=lambda: datetime.now(timezone.utc),
        current_checkout=REPOSITORY_ROOT,
    )


def _is_reparse_boundary(path: Path) -> bool:
    if _is_link_or_junction(path):
        return True
    try:
        attributes = path.lstat().st_file_attributes
    except (AttributeError, OSError):
        return False
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    return bool(attributes & reparse_flag)


def _assert_no_link_boundary(path: Path, code: str) -> None:
    absolute = Path(os.path.abspath(path))
    chain = [absolute, *absolute.parents]
    for component in reversed(chain):
        if not os.path.lexists(component):
            continue
        if _is_reparse_boundary(component):
            raise RecoveryError(code)


def _assert_tree_has_no_links(root: Path) -> None:
    for current_root, directory_names, file_names in os.walk(root, followlinks=False):
        current = Path(current_root)
        for name in [*directory_names, *file_names]:
            candidate = current / name
            if _is_reparse_boundary(candidate):
                raise RecoveryError("source_worktree_link_boundary_invalid")


def _resolved_missing_ok(path: Path) -> Path:
    absolute = Path(os.path.abspath(path))
    existing = absolute
    while not os.path.lexists(existing):
        if existing == existing.parent:
            raise RecoveryError("path_parent_missing")
        existing = existing.parent
    resolved_existing = existing.resolve(strict=True)
    relative = absolute.relative_to(existing)
    return resolved_existing.joinpath(relative)


def _paths_overlap(first: Path, second: Path) -> bool:
    return _inside(first, second) or _inside(second, first)


def _assert_disjoint_paths(paths: list[tuple[str, Path]]) -> None:
    for index, (left_label, left) in enumerate(paths):
        for right_label, right in paths[index + 1 :]:
            if _paths_overlap(left, right):
                raise RecoveryError(f"{left_label}_{right_label}_path_overlap")
            if left.exists() and right.exists():
                try:
                    if os.path.samefile(left, right):
                        raise RecoveryError(f"{left_label}_{right_label}_path_alias")
                except OSError as exc:
                    raise RecoveryError("path_alias_check_failed") from exc


def _prepare_empty_output_path(path: Path, label: str) -> Path:
    _assert_no_link_boundary(path, f"{label}_link_boundary_invalid")
    normalized = _resolved_missing_ok(path)
    if normalized.exists():
        if not normalized.is_dir() or _is_reparse_boundary(normalized):
            raise RecoveryError(f"{label}_not_directory")
        try:
            if next(normalized.iterdir(), None) is not None:
                raise RecoveryError(f"{label}_not_empty")
        except OSError as exc:
            raise RecoveryError(f"{label}_not_readable") from exc
    else:
        parent = normalized.parent
        if not parent.is_dir() or _is_reparse_boundary(parent):
            raise RecoveryError(f"{label}_parent_invalid")
    return normalized


def _prepare_receipt_path(path: Path) -> Path:
    _assert_no_link_boundary(path, "receipt_link_boundary_invalid")
    normalized = _resolved_missing_ok(path)
    if os.path.lexists(normalized):
        raise RecoveryError("receipt_output_exists")
    if not normalized.parent.is_dir() or _is_reparse_boundary(normalized.parent):
        raise RecoveryError("receipt_parent_invalid")
    return normalized


def read_git_state(source_worktree: Path) -> GitState:
    def run_git(*arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["git", "-C", str(source_worktree), *arguments],
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )

    head_result = run_git("rev-parse", "HEAD")
    if head_result.returncode != 0:
        raise RecoveryError("source_worktree_git_unavailable")
    symbolic_result = run_git("symbolic-ref", "-q", "HEAD")
    if symbolic_result.returncode not in (0, 1):
        raise RecoveryError("source_worktree_git_unavailable")
    status_result = run_git("status", "--porcelain=v1", "--untracked-files=all")
    if status_result.returncode != 0:
        raise RecoveryError("source_worktree_git_unavailable")
    return GitState(
        head=head_result.stdout.strip().lower(),
        detached=symbolic_result.returncode == 1,
        status=status_result.stdout,
    )


def _assert_git_state(state: GitState, expected_source_git_sha: str) -> None:
    if state.head != expected_source_git_sha:
        raise RecoveryError("source_worktree_head_mismatch")
    if not state.detached:
        raise RecoveryError("source_worktree_not_detached")
    if state.status:
        raise RecoveryError("source_worktree_dirty")


def _build_export_environment() -> dict[str, str]:
    allowed = (
        "PATH",
        "PATHEXT",
        "SYSTEMROOT",
        "WINDIR",
        "TEMP",
        "TMP",
        "TMPDIR",
        "LANG",
        "LC_ALL",
    )
    environment = {
        key: value
        for key, value in os.environ.items()
        if key.upper() in allowed
    }
    environment.update(
        {
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONHASHSEED": "0",
            "PYTHONIOENCODING": "utf-8",
            "TZ": "UTC",
        }
    )
    return environment


def exporter_argv(candidate_zip: Path, output_dir: Path) -> list[str]:
    return [
        sys.executable,
        "-B",
        "-m",
        "scripts.export_finple_app_preview",
        "--input-package",
        str(candidate_zip),
        "--output-dir",
        str(output_dir),
        "--shard-count",
        "64",
        "--max-rows-per-shard",
        "12000",
        "--target-shard-bytes",
        "1048576",
    ]


def run_exporter_once(
    run_label: str,
    source_worktree: Path,
    candidate_zip: Path,
    output_dir: Path,
    environment: Mapping[str, str],
) -> dict[str, object]:
    del run_label
    completed = subprocess.run(
        exporter_argv(candidate_zip, output_dir),
        cwd=source_worktree,
        env=dict(environment),
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if completed.returncode != 0:
        raise RecoveryError("exporter_failed")
    try:
        result = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise RecoveryError("exporter_result_invalid") from exc
    if not isinstance(result, dict) or result.get("status") != "ok":
        raise RecoveryError("exporter_result_invalid")
    return result


def _run_one_export(
    run_label: str,
    source_worktree: Path,
    candidate_zip: Path,
    output_dir: Path,
    environment: Mapping[str, str],
    dependencies: RecoveryDependencies,
    expected_source_git_sha: str,
) -> dict[str, object]:
    try:
        result = dependencies.exporter_runner(
            run_label,
            source_worktree,
            candidate_zip,
            output_dir,
            environment,
        )
    except Exception as exc:
        post_state = dependencies.git_state_reader(source_worktree)
        _assert_git_state(post_state, expected_source_git_sha)
        raise RecoveryError(f"exporter_run_{run_label.lower()}_failed") from exc
    post_state = dependencies.git_state_reader(source_worktree)
    _assert_git_state(post_state, expected_source_git_sha)
    if not isinstance(result, dict) or result.get("status") != "ok":
        raise RecoveryError(f"exporter_run_{run_label.lower()}_failed")
    return result


def _assert_regular_tree(root: Path, code: str) -> None:
    resolved_root = root.resolve(strict=True)
    for path in root.rglob("*"):
        if _is_reparse_boundary(path):
            raise RecoveryError(code)
        resolved = path.resolve(strict=True)
        if not _inside(resolved, resolved_root):
            raise RecoveryError(code)
        if not path.is_dir() and not path.is_file():
            raise RecoveryError(code)


def _locate_export(output_dir: Path, run_label: str) -> tuple[Path, Path]:
    _assert_regular_tree(output_dir, f"run_{run_label}_output_boundary_invalid")
    children = sorted(output_dir.iterdir(), key=lambda item: item.name)
    zip_files = [path for path in children if path.is_file() and path.suffix.lower() == ".zip"]
    bundle_dirs = [path for path in children if path.is_dir()]
    if len(children) != 2 or len(zip_files) != 1 or len(bundle_dirs) != 1:
        raise RecoveryError(f"run_{run_label}_output_contract_invalid")
    archive = zip_files[0]
    bundle = bundle_dirs[0]
    if archive.stem != bundle.name:
        raise RecoveryError(f"run_{run_label}_output_contract_invalid")
    return archive, bundle


def _safe_manifest_child(root: Path, raw_path: object, code: str) -> Path:
    try:
        relative = _validate_relative_path(str(raw_path or ""))
    except StagingError as exc:
        raise RecoveryError(code) from exc
    path = root.joinpath(*relative.parts)
    if not path.is_file() or _is_reparse_boundary(path):
        raise RecoveryError(code)
    resolved = path.resolve(strict=True)
    if not _inside(resolved, root.resolve(strict=True)):
        raise RecoveryError(code)
    return path


def _canonical_json_bytes(value: object) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def _complete_file_inventory(root: Path) -> tuple[tuple[dict[str, object], ...], str]:
    files = sorted(
        (path for path in root.rglob("*") if path.is_file()),
        key=lambda path: path.relative_to(root).as_posix(),
    )
    records = tuple(
        {
            "path": path.relative_to(root).as_posix(),
            "sha256": sha256_file(path),
            "sizeBytes": path.stat().st_size,
        }
        for path in files
    )
    return records, hashlib.sha256(_canonical_json_bytes(records)).hexdigest()


def _validate_zip_matches_bundle(
    archive_path: Path,
    bundle_root: Path,
    inventory: tuple[dict[str, object], ...],
) -> None:
    expected = {str(record["path"]): record for record in inventory}
    try:
        archive = zipfile.ZipFile(archive_path)
    except (OSError, zipfile.BadZipFile) as exc:
        raise RecoveryError("export_zip_bundle_mismatch") from exc
    with archive:
        infos = archive.infolist()
        names = [info.filename for info in infos]
        if len(names) != len(set(names)) or sorted(names) != sorted(expected):
            raise RecoveryError("export_zip_bundle_mismatch")
        for info in infos:
            try:
                relative = _validate_relative_path(info.filename)
            except StagingError as exc:
                raise RecoveryError("export_zip_bundle_mismatch") from exc
            unix_mode = (info.external_attr >> 16) & 0xFFFF
            file_type = stat.S_IFMT(unix_mode)
            if info.is_dir() or file_type not in (0, stat.S_IFREG):
                raise RecoveryError("export_zip_bundle_mismatch")
            record = expected[relative.as_posix()]
            if info.file_size != record["sizeBytes"]:
                raise RecoveryError("export_zip_bundle_mismatch")
            bundle_path = bundle_root.joinpath(*relative.parts)
            member_digest = hashlib.sha256()
            try:
                with archive.open(info, "r") as member, bundle_path.open("rb") as bundle:
                    while True:
                        member_block = member.read(1024 * 1024)
                        bundle_block = bundle.read(1024 * 1024)
                        if member_block != bundle_block:
                            raise RecoveryError("export_zip_bundle_mismatch")
                        if not member_block:
                            break
                        member_digest.update(member_block)
            except (KeyError, OSError, zipfile.BadZipFile) as exc:
                raise RecoveryError("export_zip_bundle_mismatch") from exc
            if member_digest.hexdigest() != record["sha256"]:
                raise RecoveryError("export_zip_bundle_mismatch")


def _validate_fixed_bindings(manifest: dict[str, object]) -> None:
    expected = {
        "sourceCandidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "assetCount": EXPECTED_COUNTS["assetCount"],
        "marketAssetCounts": EXPECTED_COUNTS["marketAssetCounts"],
        "rawMissingAssetCount": EXPECTED_COUNTS["rawMissingAssetCount"],
        "monthlyReturnAssetCount": EXPECTED_COUNTS["monthlyReturnAssetCount"],
        "monthlyReturnRowCount": EXPECTED_COUNTS["monthlyReturnRowCount"],
        "metricDataThroughMonth": EXPECTED_COUNTS["metricDataThroughMonth"],
        "shardCount": EXPECTED_COUNTS["shardCount"],
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
    }
    for field, value in expected.items():
        if manifest.get(field) != value:
            raise RecoveryError("source_artifact_count_or_binding_mismatch")
    if (
        int(manifest["assetCount"]) - int(manifest["rawMissingAssetCount"])
        != EXPECTED_COUNTS["priceCoveredAssetCount"]
    ):
        raise RecoveryError("source_artifact_count_or_binding_mismatch")
    shards = manifest.get("shardInventory")
    if not isinstance(shards, list) or len(shards) != EXPECTED_COUNTS["shardCount"]:
        raise RecoveryError("source_artifact_count_or_binding_mismatch")


def inspect_artifact(output_dir: Path, run_label: str) -> ArtifactSnapshot:
    archive, bundle = _locate_export(output_dir, run_label)
    try:
        validation = validate_export(bundle)
    except (OSError, StagingError) as exc:
        raise RecoveryError(f"run_{run_label}_artifact_invalid") from exc
    manifest = validation.get("manifest")
    if not isinstance(manifest, dict):
        raise RecoveryError(f"run_{run_label}_artifact_invalid")
    _validate_fixed_bindings(manifest)
    manifest_path = bundle / MANIFEST_NAME
    overlay_record = manifest.get("metricsOverlay")
    index_record = manifest.get("monthlyReturnsIndex")
    if not isinstance(overlay_record, dict) or not isinstance(index_record, dict):
        raise RecoveryError(f"run_{run_label}_artifact_invalid")
    overlay_path = _safe_manifest_child(
        bundle,
        overlay_record.get("path"),
        f"run_{run_label}_artifact_invalid",
    )
    monthly_index_path = _safe_manifest_child(
        bundle,
        index_record.get("path"),
        f"run_{run_label}_artifact_invalid",
    )
    inventory, inventory_hash = _complete_file_inventory(bundle)
    _validate_zip_matches_bundle(archive, bundle, inventory)
    return ArtifactSnapshot(
        zip_path=archive,
        bundle_root=bundle,
        manifest_path=manifest_path,
        overlay_path=overlay_path,
        monthly_index_path=monthly_index_path,
        manifest=manifest,
        complete_file_inventory=inventory,
        complete_file_inventory_hash=inventory_hash,
    )


def _files_equal(left: Path, right: Path) -> bool:
    if left.stat().st_size != right.stat().st_size:
        return False
    with left.open("rb") as left_handle, right.open("rb") as right_handle:
        while True:
            left_block = left_handle.read(1024 * 1024)
            right_block = right_handle.read(1024 * 1024)
            if left_block != right_block:
                return False
            if not left_block:
                return True


def _assert_file_match(left: Path, right: Path, code: str) -> None:
    if (
        sha256_file(left) != sha256_file(right)
        or not _files_equal(left, right)
    ):
        raise RecoveryError(code)


def compare_artifacts(run_a: ArtifactSnapshot, run_b: ArtifactSnapshot) -> None:
    _assert_file_match(run_a.zip_path, run_b.zip_path, "export_zip_mismatch")
    _assert_file_match(
        run_a.manifest_path,
        run_b.manifest_path,
        "source_manifest_mismatch",
    )
    _assert_file_match(
        run_a.overlay_path,
        run_b.overlay_path,
        "metrics_overlay_mismatch",
    )
    _assert_file_match(
        run_a.monthly_index_path,
        run_b.monthly_index_path,
        "monthly_index_mismatch",
    )
    shards_a = run_a.manifest.get("shardInventory")
    shards_b = run_b.manifest.get("shardInventory")
    if (
        run_a.manifest.get("shardCount") != run_b.manifest.get("shardCount")
        or shards_a != shards_b
    ):
        raise RecoveryError("shard_inventory_mismatch")
    if not isinstance(shards_a, list) or not isinstance(shards_b, list):
        raise RecoveryError("shard_inventory_mismatch")
    for shard_a, shard_b in zip(shards_a, shards_b, strict=True):
        if not isinstance(shard_a, dict) or not isinstance(shard_b, dict):
            raise RecoveryError("shard_inventory_mismatch")
        shard_path_a = _safe_manifest_child(
            run_a.bundle_root,
            shard_a.get("path"),
            "shard_inventory_mismatch",
        )
        shard_path_b = _safe_manifest_child(
            run_b.bundle_root,
            shard_b.get("path"),
            "shard_inventory_mismatch",
        )
        _assert_file_match(shard_path_a, shard_path_b, "shard_bytes_mismatch")
    if run_a.complete_file_inventory != run_b.complete_file_inventory:
        raise RecoveryError("complete_file_inventory_mismatch")
    if run_a.complete_file_inventory_hash != run_b.complete_file_inventory_hash:
        raise RecoveryError("complete_file_inventory_hash_mismatch")
    for record in run_a.complete_file_inventory:
        relative = _validate_relative_path(str(record["path"]))
        _assert_file_match(
            run_a.bundle_root.joinpath(*relative.parts),
            run_b.bundle_root.joinpath(*relative.parts),
            "complete_file_bytes_mismatch",
        )


def _validate_sha256(value: object, code: str) -> str:
    normalized = str(value or "")
    if not SHA256_RE.fullmatch(normalized):
        raise RecoveryError(code)
    return normalized


def validate_receipt_contract(receipt: dict[str, object]) -> None:
    schema = load_json_strict(RECEIPT_SCHEMA_PATH)
    if not isinstance(schema, dict) or set(receipt) != RECEIPT_FIELDS:
        raise RecoveryError("receipt_schema_invalid")
    if set(schema.get("required", [])) != RECEIPT_FIELDS:
        raise RecoveryError("receipt_schema_invalid")
    constants = {
        "schemaVersion": 1,
        "sourceGitMainSha": SOURCE_GIT_MAIN_SHA,
        "candidateZipSha256": CANDIDATE_ZIP_SHA256,
        "candidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "exporterCommand": EXPORTER_COMMAND,
        "exporterVersion": EXPORTER_VERSION,
        "deterministicMatch": True,
    }
    for field, value in constants.items():
        if receipt.get(field) != value:
            raise RecoveryError("receipt_schema_invalid")
    for field in (
        "runAZipSha256",
        "runBZipSha256",
        "sourceManifestSha256",
        "metricsOverlaySha256",
        "monthlyIndexSha256",
        "completeFileInventoryHash",
    ):
        _validate_sha256(receipt.get(field), "receipt_schema_invalid")
    if receipt["runAZipSha256"] != receipt["runBZipSha256"]:
        raise RecoveryError("receipt_schema_invalid")
    if not OPERATOR_ID_RE.fullmatch(str(receipt.get("operatorId") or "")):
        raise RecoveryError("receipt_schema_invalid")
    generated_at = str(receipt.get("generatedAt") or "")
    try:
        parsed_generated_at = datetime.fromisoformat(generated_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise RecoveryError("receipt_schema_invalid") from exc
    if not generated_at.endswith("Z") or parsed_generated_at.tzinfo is None:
        raise RecoveryError("receipt_schema_invalid")
    shards = receipt.get("completeShardInventory")
    if not isinstance(shards, list) or len(shards) != EXPECTED_COUNTS["shardCount"]:
        raise RecoveryError("receipt_schema_invalid")
    for record in shards:
        if not isinstance(record, dict) or set(record) != SHARD_FIELDS:
            raise RecoveryError("receipt_schema_invalid")
        try:
            _validate_relative_path(str(record.get("path") or ""))
        except StagingError as exc:
            raise RecoveryError("receipt_schema_invalid") from exc
        _validate_sha256(record.get("sha256"), "receipt_schema_invalid")
        if (
            not str(record.get("shardId") or "")
            or not isinstance(record.get("assetCount"), int)
            or int(record["assetCount"]) < 0
            or not isinstance(record.get("rowCount"), int)
            or int(record["rowCount"]) < 0
            or not isinstance(record.get("sizeBytes"), int)
            or int(record["sizeBytes"]) <= 0
        ):
            raise RecoveryError("receipt_schema_invalid")
    if (
        sum(int(record["assetCount"]) for record in shards)
        != EXPECTED_COUNTS["monthlyReturnAssetCount"]
        or sum(int(record["rowCount"]) for record in shards)
        != EXPECTED_COUNTS["monthlyReturnRowCount"]
    ):
        raise RecoveryError("receipt_schema_invalid")


def atomic_write_receipt(receipt_output: Path, receipt: dict[str, object]) -> None:
    payload = json.dumps(
        receipt,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        indent=2,
    ).encode("utf-8") + b"\n"
    lock_path = receipt_output.with_name(f".{receipt_output.name}.lock")
    temporary_path: Path | None = None
    lock_descriptor: int | None = None
    try:
        lock_descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        if os.path.lexists(receipt_output):
            raise RecoveryError("receipt_output_exists")
        descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{receipt_output.name}.",
            suffix=".tmp",
            dir=receipt_output.parent,
        )
        temporary_path = Path(temporary_name)
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        if os.path.lexists(receipt_output):
            raise RecoveryError("receipt_output_exists")
        os.replace(temporary_path, receipt_output)
        temporary_path = None
    except FileExistsError as exc:
        raise RecoveryError("receipt_write_lock_exists") from exc
    finally:
        if lock_descriptor is not None:
            os.close(lock_descriptor)
            lock_path.unlink(missing_ok=True)
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def _iso_utc(instant: datetime) -> str:
    if instant.tzinfo is None:
        raise RecoveryError("generated_at_invalid")
    utc = instant.astimezone(timezone.utc)
    return utc.isoformat(timespec="seconds").replace("+00:00", "Z")


def recover_production_app_export_source(
    *,
    source_worktree: Path,
    candidate_zip: Path,
    run_a_dir: Path,
    run_b_dir: Path,
    receipt_output: Path,
    operator_id: str,
    expected_source_git_sha: str,
    expected_candidate_zip_sha256: str,
    expected_candidate_package_hash: str,
    dependencies: RecoveryDependencies | None = None,
) -> dict[str, object]:
    deps = dependencies or _default_dependencies()
    if expected_source_git_sha != SOURCE_GIT_MAIN_SHA:
        raise RecoveryError("expected_source_git_sha_not_pinned")
    if expected_candidate_zip_sha256 != CANDIDATE_ZIP_SHA256:
        raise RecoveryError("expected_candidate_zip_sha256_not_pinned")
    if expected_candidate_package_hash != CANDIDATE_PACKAGE_HASH:
        raise RecoveryError("expected_candidate_package_hash_not_pinned")
    if not OPERATOR_ID_RE.fullmatch(str(operator_id or "")):
        raise RecoveryError("operator_id_invalid")

    _assert_no_link_boundary(source_worktree, "source_worktree_link_boundary_invalid")
    source = source_worktree.resolve(strict=True)
    if not source.is_dir() or _is_reparse_boundary(source):
        raise RecoveryError("source_worktree_invalid")
    _assert_tree_has_no_links(source)

    current_checkout = deps.current_checkout.resolve(strict=True)
    _assert_no_link_boundary(candidate_zip, "candidate_zip_link_boundary_invalid")
    if not os.path.lexists(candidate_zip):
        raise RecoveryError("candidate_zip_missing")
    candidate_lstat = candidate_zip.lstat()
    if (
        _is_reparse_boundary(candidate_zip)
        or not stat.S_ISREG(candidate_lstat.st_mode)
        or candidate_zip.suffix.lower() != ".zip"
    ):
        raise RecoveryError("candidate_zip_not_regular")
    candidate = candidate_zip.resolve(strict=True)

    run_a = _prepare_empty_output_path(run_a_dir, "run_a")
    run_b = _prepare_empty_output_path(run_b_dir, "run_b")
    receipt = _prepare_receipt_path(receipt_output)
    _assert_disjoint_paths(
        [
            ("current_checkout", current_checkout),
            ("source_worktree", source),
            ("candidate_zip", candidate),
            ("run_a", run_a),
            ("run_b", run_b),
            ("receipt", receipt),
        ]
    )

    initial_git_state = deps.git_state_reader(source)
    _assert_git_state(initial_git_state, expected_source_git_sha)
    if deps.candidate_hash_reader(candidate) != expected_candidate_zip_sha256:
        raise RecoveryError("candidate_zip_sha256_mismatch")
    try:
        candidate_evidence = deps.candidate_verifier(candidate)
    except Exception as exc:
        raise RecoveryError("candidate_package_verification_failed") from exc
    if (
        candidate_evidence.get("ok") is not True
        or candidate_evidence.get("zipPackageSha256") != expected_candidate_zip_sha256
        or candidate_evidence.get("candidatePackageHash")
        != expected_candidate_package_hash
    ):
        raise RecoveryError("candidate_package_binding_mismatch")

    run_a.mkdir(parents=False, exist_ok=True)
    run_b.mkdir(parents=False, exist_ok=True)
    environment = _build_export_environment()
    result_a = _run_one_export(
        "a",
        source,
        candidate,
        run_a,
        environment,
        deps,
        expected_source_git_sha,
    )
    result_b = _run_one_export(
        "b",
        source,
        candidate,
        run_b,
        environment,
        deps,
        expected_source_git_sha,
    )
    final_git_state = deps.git_state_reader(source)
    if final_git_state != initial_git_state:
        raise RecoveryError("source_worktree_changed")

    artifact_a = inspect_artifact(run_a, "a")
    artifact_b = inspect_artifact(run_b, "b")
    if result_a.get("zipSha256") != sha256_file(artifact_a.zip_path):
        raise RecoveryError("run_a_reported_zip_sha256_mismatch")
    if result_b.get("zipSha256") != sha256_file(artifact_b.zip_path):
        raise RecoveryError("run_b_reported_zip_sha256_mismatch")
    compare_artifacts(artifact_a, artifact_b)
    shard_inventory = artifact_a.manifest.get("shardInventory")
    if not isinstance(shard_inventory, list):
        raise RecoveryError("shard_inventory_mismatch")
    receipt_payload = {
        "schemaVersion": 1,
        "sourceGitMainSha": SOURCE_GIT_MAIN_SHA,
        "candidateZipSha256": CANDIDATE_ZIP_SHA256,
        "candidatePackageHash": CANDIDATE_PACKAGE_HASH,
        "exporterCommand": EXPORTER_COMMAND,
        "exporterVersion": EXPORTER_VERSION,
        "runAZipSha256": sha256_file(artifact_a.zip_path),
        "runBZipSha256": sha256_file(artifact_b.zip_path),
        "sourceManifestSha256": sha256_file(artifact_a.manifest_path),
        "metricsOverlaySha256": sha256_file(artifact_a.overlay_path),
        "monthlyIndexSha256": sha256_file(artifact_a.monthly_index_path),
        "completeShardInventory": shard_inventory,
        "completeFileInventoryHash": artifact_a.complete_file_inventory_hash,
        "generatedAt": _iso_utc(deps.clock()),
        "operatorId": operator_id,
        "deterministicMatch": True,
    }
    validate_receipt_contract(receipt_payload)
    atomic_write_receipt(receipt, receipt_payload)
    return {
        "status": "source_artifact_recovered",
        "reasonCode": "deterministic_match",
        "deterministicMatch": True,
        "receiptCreated": True,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Run the pinned FINPLE app-export twice and atomically issue an "
            "external receipt only after an exact deterministic match."
        )
    )
    parser.add_argument("--source-worktree", required=True, type=Path)
    parser.add_argument("--candidate-zip", required=True, type=Path)
    parser.add_argument("--run-a-dir", required=True, type=Path)
    parser.add_argument("--run-b-dir", required=True, type=Path)
    parser.add_argument("--receipt-output", required=True, type=Path)
    parser.add_argument("--operator-id", required=True)
    parser.add_argument("--expected-source-git-sha", required=True)
    parser.add_argument("--expected-candidate-zip-sha256", required=True)
    parser.add_argument("--expected-candidate-package-hash", required=True)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = recover_production_app_export_source(
            source_worktree=args.source_worktree,
            candidate_zip=args.candidate_zip,
            run_a_dir=args.run_a_dir,
            run_b_dir=args.run_b_dir,
            receipt_output=args.receipt_output,
            operator_id=args.operator_id,
            expected_source_git_sha=args.expected_source_git_sha,
            expected_candidate_zip_sha256=args.expected_candidate_zip_sha256,
            expected_candidate_package_hash=args.expected_candidate_package_hash,
        )
    except RecoveryError as exc:
        print(
            json.dumps(
                {
                    "status": "blocked",
                    "reasonCode": exc.code,
                    "receiptCreated": False,
                },
                sort_keys=True,
            )
        )
        return 1
    except Exception:
        print(
            json.dumps(
                {
                    "status": "blocked",
                    "reasonCode": "operator_runtime_error",
                    "receiptCreated": False,
                },
                sort_keys=True,
            )
        )
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
