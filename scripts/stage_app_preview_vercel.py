#!/usr/bin/env python3
"""Validate and stage a review-only FINPLE export for a Vercel Preview.

The generated Build Output API directory lives outside the repository. The
repository's production selector and public data files are never modified.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from typing import Callable, Mapping
from urllib.parse import urlsplit, urlunsplit
import uuid
import zipfile


EXPECTED_EXPORT_VERSION = "finple-app-preview-export-v1-step114-2z"
MANIFEST_NAME = "app-preview-manifest.json"
FORBIDDEN_SOURCE_ROLE_TOKENS = ("raw_daily_prices", "normalized_month_end")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
SEGMENT_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
PREVIEW_API_BASE_PATH = "/preview-api"
LOCAL_API_FALLBACK = "http://localhost:5050/api"


class StagingError(ValueError):
    """Raised when an input or staging invariant fails."""


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _strict_json_constant(value: str) -> None:
    raise StagingError(f"non-finite JSON value is forbidden: {value}")


def load_json_strict(path: Path) -> object:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle, parse_constant=_strict_json_constant)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise StagingError(f"invalid JSON file {path.name}: {exc}") from exc


def _is_link_or_junction(path: Path) -> bool:
    if path.is_symlink():
        return True
    is_junction = getattr(path, "is_junction", None)
    return bool(is_junction and is_junction())


def _inside(child: Path, parent: Path) -> bool:
    try:
        return os.path.commonpath((str(child), str(parent))) == str(parent)
    except ValueError:
        return False


def _validate_relative_path(raw_path: str) -> PurePosixPath:
    if not raw_path or "\\" in raw_path or "\x00" in raw_path:
        raise StagingError(f"unsafe archive or manifest path: {raw_path!r}")
    path = PurePosixPath(raw_path)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise StagingError(f"unsafe archive or manifest path: {raw_path!r}")
    if path.parts and re.match(r"^[A-Za-z]:", path.parts[0]):
        raise StagingError(f"unsafe archive or manifest path: {raw_path!r}")
    return path


def _copy_directory_safely(source: Path, destination: Path) -> None:
    source_resolved = source.resolve(strict=True)
    if not source.is_dir() or _is_link_or_junction(source):
        raise StagingError("directory input must be a real directory, not a link or junction")

    destination.mkdir(parents=True, exist_ok=False)
    for current_root, directory_names, file_names in os.walk(source, followlinks=False):
        current = Path(current_root)
        for name in list(directory_names):
            candidate = current / name
            if _is_link_or_junction(candidate):
                raise StagingError(f"directory input contains a link or junction: {name}")
            resolved = candidate.resolve(strict=True)
            if not _inside(resolved, source_resolved):
                raise StagingError(f"directory input escapes its root: {name}")
        for name in file_names:
            candidate = current / name
            if _is_link_or_junction(candidate) or not candidate.is_file():
                raise StagingError(f"directory input contains a non-regular file: {name}")
            resolved = candidate.resolve(strict=True)
            if not _inside(resolved, source_resolved):
                raise StagingError(f"directory input escapes its root: {name}")
            relative = candidate.relative_to(source)
            output = destination / relative
            output.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(candidate, output)


def _extract_zip_safely(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=False)
    root = destination.resolve(strict=True)
    try:
        archive = zipfile.ZipFile(source)
    except (OSError, zipfile.BadZipFile) as exc:
        raise StagingError(f"invalid ZIP input: {exc}") from exc

    with archive:
        seen: set[str] = set()
        for info in archive.infolist():
            relative = _validate_relative_path(info.filename.rstrip("/"))
            normalized = relative.as_posix()
            if normalized in seen:
                raise StagingError(f"duplicate ZIP member: {normalized}")
            seen.add(normalized)

            unix_mode = (info.external_attr >> 16) & 0xFFFF
            file_type = stat.S_IFMT(unix_mode)
            if file_type not in (0, stat.S_IFREG, stat.S_IFDIR):
                raise StagingError(f"ZIP member is not a regular file or directory: {normalized}")

            output = destination.joinpath(*relative.parts)
            output_resolved = output.resolve(strict=False)
            if not _inside(output_resolved, root):
                raise StagingError(f"ZIP member escapes extraction root: {normalized}")
            if info.is_dir():
                output.mkdir(parents=True, exist_ok=True)
                continue
            output.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(info, "r") as input_handle, output.open("xb") as output_handle:
                shutil.copyfileobj(input_handle, output_handle, length=1024 * 1024)


def _validate_sha256(value: object, label: str) -> str:
    normalized = str(value or "").strip().lower()
    if not SHA256_RE.fullmatch(normalized):
        raise StagingError(f"{label} must be a lowercase SHA-256 hex digest")
    return normalized


def _require_equal(actual: object, expected: object, label: str) -> None:
    if actual != expected:
        raise StagingError(f"{label} must be {expected!r}; received {actual!r}")


def normalize_api_upstream_base_url(value: str) -> str:
    raw_value = str(value or "")
    if not raw_value or raw_value != raw_value.strip():
        raise StagingError("API upstream base URL must be a non-empty HTTPS URL without surrounding whitespace")
    try:
        parsed = urlsplit(raw_value)
        parsed_port = parsed.port
    except ValueError as exc:
        raise StagingError("API upstream base URL is malformed") from exc
    if parsed.scheme.lower() != "https" or not parsed.hostname:
        raise StagingError("API upstream base URL must use HTTPS and include a hostname")
    if parsed.username is not None or parsed.password is not None:
        raise StagingError("API upstream base URL must not contain username or password")
    if parsed.query or parsed.fragment:
        raise StagingError("API upstream base URL must not contain query or fragment")
    if parsed_port is not None and not 1 <= parsed_port <= 65535:
        raise StagingError("API upstream base URL has an invalid port")
    normalized_path = parsed.path.rstrip("/")
    return urlunsplit(("https", parsed.netloc, normalized_path, "", ""))


def build_vercel_routes(api_upstream_base_url: str) -> list[dict[str, object]]:
    return [
        {
            "src": f"{PREVIEW_API_BASE_PATH}/(.*)",
            "dest": f"{api_upstream_base_url}/$1",
        },
        {"handle": "filesystem"},
        {"src": "/.*", "dest": "/index.html"},
    ]


def validate_preview_api_bundle(static_output_dir: Path, api_upstream_base_url: str) -> None:
    bundle_paths = sorted((static_output_dir / "assets").glob("index-*.js"))
    if not bundle_paths:
        raise StagingError("Preview build did not produce an index JavaScript bundle")
    bundle_bytes = b"\n".join(path.read_bytes() for path in bundle_paths)
    if PREVIEW_API_BASE_PATH.encode("utf-8") not in bundle_bytes:
        raise StagingError("Preview JavaScript bundle is missing the same-origin API base")
    if api_upstream_base_url.encode("utf-8") in bundle_bytes:
        raise StagingError("Preview JavaScript bundle exposes the direct API upstream")
    if LOCAL_API_FALLBACK.encode("utf-8") in bundle_bytes:
        raise StagingError("Preview JavaScript bundle still contains the local API fallback")


def validate_export(export_root: Path) -> dict[str, object]:
    manifest_path = export_root / MANIFEST_NAME
    if not manifest_path.is_file():
        raise StagingError(f"missing required {MANIFEST_NAME}")
    manifest = load_json_strict(manifest_path)
    if not isinstance(manifest, dict):
        raise StagingError("app preview manifest must be a JSON object")

    gates = {
        "exportVersion": EXPECTED_EXPORT_VERSION,
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
    }
    for field, expected in gates.items():
        _require_equal(manifest.get(field), expected, f"manifest {field}")
    if not re.fullmatch(r"\d{4}-\d{2}", str(manifest.get("metricDataThroughMonth") or "")):
        raise StagingError("manifest metricDataThroughMonth must be YYYY-MM")

    excluded_roles = manifest.get("excludedSourceRoles")
    if not isinstance(excluded_roles, list):
        raise StagingError("manifest excludedSourceRoles must be a list")
    for role in FORBIDDEN_SOURCE_ROLE_TOKENS:
        if role not in excluded_roles:
            raise StagingError(f"manifest must declare excluded source role: {role}")

    records = manifest.get("files")
    if not isinstance(records, list) or not records:
        raise StagingError("manifest files inventory is missing or empty")
    inventory: dict[str, dict[str, object]] = {}
    for record in records:
        if not isinstance(record, dict):
            raise StagingError("manifest files entries must be objects")
        relative = _validate_relative_path(str(record.get("path", ""))).as_posix()
        if relative == MANIFEST_NAME or relative in inventory:
            raise StagingError(f"invalid or duplicate manifest inventory path: {relative}")
        lowered = relative.lower()
        if any(token in lowered for token in FORBIDDEN_SOURCE_ROLE_TOKENS):
            raise StagingError(f"forbidden source data path in export: {relative}")
        inventory[relative] = record

    actual_files: set[str] = set()
    root_resolved = export_root.resolve(strict=True)
    for path in export_root.rglob("*"):
        if _is_link_or_junction(path):
            raise StagingError(f"export contains a link or junction: {path.name}")
        if path.is_dir():
            continue
        if not path.is_file():
            raise StagingError(f"export contains a non-regular file: {path.name}")
        resolved = path.resolve(strict=True)
        if not _inside(resolved, root_resolved):
            raise StagingError(f"export file escapes its root: {path.name}")
        actual_files.add(path.relative_to(export_root).as_posix())

    expected_files = set(inventory) | {MANIFEST_NAME}
    missing = sorted(expected_files - actual_files)
    extra = sorted(actual_files - expected_files)
    if missing or extra:
        raise StagingError(f"export inventory mismatch; missing={missing}, extra={extra}")

    for relative, record in inventory.items():
        path = export_root.joinpath(*PurePosixPath(relative).parts)
        expected_size = record.get("sizeBytes")
        if not isinstance(expected_size, int) or expected_size < 0:
            raise StagingError(f"invalid inventory size for {relative}")
        if path.stat().st_size != expected_size:
            raise StagingError(f"inventory size mismatch for {relative}")
        expected_hash = _validate_sha256(record.get("sha256"), f"inventory SHA-256 for {relative}")
        if sha256_file(path) != expected_hash:
            raise StagingError(f"inventory SHA-256 mismatch for {relative}")
        if path.suffix.lower() == ".json":
            load_json_strict(path)

    shards = manifest.get("shards")
    if not isinstance(shards, list):
        raise StagingError("manifest shards must be a list")
    asset_count = manifest.get("assetCount")
    monthly_asset_count = manifest.get("monthlyReturnAssetCount")
    monthly_row_count = manifest.get("monthlyReturnRowCount")
    shard_count = manifest.get("shardCount")
    if not isinstance(asset_count, int) or asset_count <= 0:
        raise StagingError("manifest asset count must be positive")
    if not isinstance(monthly_asset_count, int) or monthly_asset_count < 0:
        raise StagingError("manifest monthly-return asset count is invalid")
    if not isinstance(monthly_row_count, int) or monthly_row_count < 0:
        raise StagingError("manifest monthly-return row count is invalid")
    if shard_count not in (64, 128, 256):
        raise StagingError("manifest shard count must be 64, 128, or 256")
    _require_equal(len(shards), shard_count, "manifest shard count")
    if manifest.get("shardInventory") != shards:
        raise StagingError("manifest shardInventory must equal the canonical shards inventory")
    shard_paths: set[str] = set()
    for shard in shards:
        if not isinstance(shard, dict):
            raise StagingError("manifest shard entries must be objects")
        relative = _validate_relative_path(str(shard.get("path", ""))).as_posix()
        if relative in shard_paths or relative not in inventory:
            raise StagingError(f"invalid or duplicate shard path: {relative}")
        shard_paths.add(relative)
        record = inventory[relative]
        _require_equal(shard.get("sha256"), record.get("sha256"), f"shard SHA-256 {relative}")
        _require_equal(shard.get("sizeBytes"), record.get("sizeBytes"), f"shard size {relative}")
    _require_equal(
        sum(int(item.get("rowCount", -1)) for item in shards),
        monthly_row_count,
        "manifest monthlyReturnRowCount vs shard row total",
    )
    _require_equal(
        sum(int(item.get("assetCount", -1)) for item in shards),
        monthly_asset_count,
        "manifest monthlyReturnAssetCount vs shard asset total",
    )

    overlay_record = manifest.get("metricsOverlay")
    index_record = manifest.get("monthlyReturnsIndex")
    if not isinstance(overlay_record, dict) or not isinstance(index_record, dict):
        raise StagingError("manifest metricsOverlay and monthlyReturnsIndex records are required")
    overlay_path = _validate_relative_path(str(overlay_record.get("path", ""))).as_posix()
    index_path = _validate_relative_path(str(index_record.get("path", ""))).as_posix()
    if overlay_path not in inventory or index_path not in inventory:
        raise StagingError("manifest primary data files are absent from inventory")

    overlay = load_json_strict(export_root.joinpath(*PurePosixPath(overlay_path).parts))
    if not isinstance(overlay, dict) or not isinstance(overlay.get("rows"), list):
        raise StagingError("metrics overlay rows are missing")
    _require_equal(len(overlay["rows"]), asset_count, "metrics overlay row count")
    identities: set[str] = set()
    qqq_row: dict[str, object] | None = None
    for row in overlay["rows"]:
        if not isinstance(row, dict):
            raise StagingError("metrics overlay rows must be objects")
        market = row.get("market")
        ticker = row.get("ticker")
        identity = row.get("identity")
        if market not in ("US", "KR") or not isinstance(ticker, str):
            raise StagingError("metrics overlay has an invalid market+ticker identity")
        _require_equal(identity, f"{market}:{ticker}", "metrics overlay identity")
        if identity in identities:
            raise StagingError(f"duplicate metrics overlay identity: {identity}")
        identities.add(identity)
        if identity == "US:QQQ":
            qqq_row = row
    if "KR:069500" not in identities or "KR:0086C0" not in identities:
        raise StagingError("metrics overlay did not preserve required KR identities")
    if qqq_row is None:
        raise StagingError("metrics overlay is missing US:QQQ")
    _require_equal(qqq_row.get("cagrPolicy"), "rolling_10y_median", "QQQ CAGR policy")
    _require_equal(qqq_row.get("selectedCagr"), qqq_row.get("rollingCagr10yMedian"), "QQQ selected CAGR")
    if not isinstance(qqq_row.get("validRollingWindowCount10y"), int) or int(qqq_row["validRollingWindowCount10y"]) <= 1:
        raise StagingError("QQQ must have multiple valid rolling 10Y CAGR windows")
    if qqq_row.get("selectedCagr") == qqq_row.get("rawPriceCagr10y"):
        raise StagingError("QQQ selected CAGR must not reuse the latest raw 10Y CAGR")
    _require_equal(qqq_row.get("mddPolicy"), "full_period_actual", "QQQ MDD policy")
    _require_equal(qqq_row.get("betaPolicy"), "aligned_monthly_return_beta", "QQQ beta policy")
    for field in ("rollingMdd10yMedian", "rollingBeta10yMedian", "rollingBeta5yMedian"):
        if qqq_row.get(field) is not None:
            raise StagingError(f"QQQ {field} must remain blank")

    monthly_index = load_json_strict(export_root.joinpath(*PurePosixPath(index_path).parts))
    if not isinstance(monthly_index, dict):
        raise StagingError("monthly returns index must be a JSON object")
    _require_equal(monthly_index.get("assetCount"), monthly_asset_count, "monthly returns index asset count")
    _require_equal(monthly_index.get("rowCount"), monthly_row_count, "monthly returns index row count")
    index_assets = monthly_index.get("assets")
    index_shards = monthly_index.get("shards")
    if not isinstance(index_assets, dict) or not isinstance(index_shards, list):
        raise StagingError("monthly returns index assets or shards are missing")
    _require_equal(len(index_assets), monthly_asset_count, "monthly returns index identity count")
    _require_equal(len(index_shards), shard_count, "monthly returns index shard count")
    _require_equal({item.get("path") for item in index_shards if isinstance(item, dict)}, shard_paths, "monthly returns index shard paths")

    return {
        "manifest": manifest,
        "fileCount": len(actual_files),
        "contentBytes": sum((export_root / path).stat().st_size for path in actual_files),
        "assetCount": asset_count,
        "monthlyReturnAssetCount": monthly_asset_count,
        "monthlyReturnRowCount": monthly_row_count,
        "shardCount": shard_count,
    }


def _git_status(project_dir: Path) -> str:
    result = subprocess.run(
        ["git", "-c", f"safe.directory={project_dir.as_posix()}", "status", "--porcelain=v1", "--untracked-files=all"],
        cwd=project_dir,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def run_preview_build(
    project_dir: Path,
    static_output_dir: Path,
    target_base_url: str,
    preview_api_base_url: str,
    *,
    extra_env: Mapping[str, str] | None = None,
) -> None:
    environment = os.environ.copy()
    environment.update(
        {
            "VITE_FINPLE_APP_PREVIEW_ENABLED": "true",
            "VITE_FINPLE_APP_PREVIEW_BASE_URL": target_base_url,
            "VITE_FINPLE_API_BASE_URL": preview_api_base_url,
            "FINPLE_BUILD_OUTPUT_DIR": str(static_output_dir),
        }
    )
    if extra_env:
        environment.update(extra_env)
    command = ["npm.cmd" if os.name == "nt" else "npm", "run", "build"]
    subprocess.run(command, cwd=project_dir, env=environment, check=True)


BuildRunner = Callable[[Path, Path, str, str], None]


def _atomic_publish(prepared: Path, final: Path) -> None:
    backup = final.with_name(f".{final.name}.backup-{uuid.uuid4().hex}")
    had_existing = final.exists()
    if had_existing:
        if _is_link_or_junction(final):
            raise StagingError("existing staging target must not be a link or junction")
        os.replace(final, backup)
    try:
        os.replace(prepared, final)
    except Exception:
        if had_existing and backup.exists():
            os.replace(backup, final)
        raise
    if backup.exists():
        shutil.rmtree(backup)


def stage_app_preview(
    *,
    input_export: Path,
    staging_dir: Path,
    target_segment: str,
    expected_zip_sha256: str | None,
    api_upstream_base_url: str,
    project_dir: Path,
    build_runner: BuildRunner = run_preview_build,
) -> dict[str, object]:
    project = project_dir.resolve(strict=True)
    if not (project / ".git").exists():
        git_probe = subprocess.run(
            ["git", "-c", f"safe.directory={project.as_posix()}", "rev-parse", "--is-inside-work-tree"],
            cwd=project,
            check=False,
            capture_output=True,
            text=True,
        )
        if git_probe.returncode != 0 or git_probe.stdout.strip() != "true":
            raise StagingError("project directory is not a Git worktree")
    if not SEGMENT_RE.fullmatch(target_segment):
        raise StagingError("target segment must be one safe URL path segment")
    normalized_api_upstream = normalize_api_upstream_base_url(api_upstream_base_url)

    source = input_export.resolve(strict=True)
    staging_argument = staging_dir.absolute()
    if staging_argument.exists() and _is_link_or_junction(staging_argument):
        raise StagingError("staging target must not be a link or junction")
    staging_argument.parent.mkdir(parents=True, exist_ok=True)
    final = staging_argument.resolve(strict=False)
    final_parent = final.parent.resolve(strict=True)
    if _is_link_or_junction(final_parent):
        raise StagingError("staging parent must not be a link or junction")
    if _inside(final, project) or _inside(project, final):
        raise StagingError("staging directory must be outside and must not contain the repository")
    if _inside(source, final) or (source.is_dir() and _inside(final, source)):
        raise StagingError("input export and staging directory must not contain one another")

    source_zip_hash: str | None = None
    if source.is_file():
        if source.suffix.lower() != ".zip":
            raise StagingError("file input must be a ZIP archive")
        if expected_zip_sha256 is None:
            raise StagingError("--expected-zip-sha256 is required for ZIP input")
        expected_hash = _validate_sha256(expected_zip_sha256, "expected ZIP SHA-256")
        source_zip_hash = sha256_file(source)
        if source_zip_hash != expected_hash:
            raise StagingError(
                f"input ZIP SHA-256 mismatch; expected {expected_hash}, received {source_zip_hash}"
            )
    elif expected_zip_sha256:
        raise StagingError("--expected-zip-sha256 applies only to ZIP input")
    elif not source.is_dir():
        raise StagingError("input export must be a ZIP or extracted directory")

    status_before = _git_status(project)
    prepared = Path(tempfile.mkdtemp(prefix=f".{final.name}.prepare-", dir=final_parent))
    working = Path(tempfile.mkdtemp(prefix="finple-preview-input-"))
    try:
        export_root = working / "export"
        if source.is_file():
            _extract_zip_safely(source, export_root)
        else:
            _copy_directory_safely(source, export_root)
        validation = validate_export(export_root)

        output_root = prepared / ".vercel" / "output"
        static_root = output_root / "static"
        static_root.mkdir(parents=True, exist_ok=True)
        target_base_url = f"/app-preview-data/{target_segment}"
        build_runner(project, static_root, target_base_url, PREVIEW_API_BASE_PATH)
        if not (static_root / "index.html").is_file():
            raise StagingError("Preview build did not produce index.html")
        validate_preview_api_bundle(static_root, normalized_api_upstream)

        data_target = static_root / "app-preview-data" / target_segment
        shutil.copytree(export_root, data_target)
        config = {
            "version": 3,
            "routes": build_vercel_routes(normalized_api_upstream),
        }
        (output_root / "config.json").write_text(
            json.dumps(config, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

        status_after = _git_status(project)
        if status_after != status_before:
            raise StagingError("repository status changed while staging the Preview build")

        all_staged_files = [path for path in prepared.rglob("*") if path.is_file()]
        manifest = validation["manifest"]
        assert isinstance(manifest, dict)
        summary: dict[str, object] = {
            "schemaVersion": 1,
            "stagingMode": "vercel_build_output_api_v3",
            "targetBaseUrl": target_base_url,
            "previewApiBaseUrl": PREVIEW_API_BASE_PATH,
            "apiUpstreamBaseUrl": normalized_api_upstream,
            "sourceZipSha256": source_zip_hash,
            "sourceCandidatePackageId": manifest.get("sourceCandidatePackageId"),
            "sourceCandidatePackageHash": manifest.get("sourceCandidatePackageHash"),
            "exportVersion": manifest.get("exportVersion"),
            "metricBaseDate": manifest.get("metricBaseDate"),
            "metricDataThroughMonth": manifest.get("metricDataThroughMonth"),
            "assetCount": validation["assetCount"],
            "monthlyReturnAssetCount": validation["monthlyReturnAssetCount"],
            "monthlyReturnRowCount": validation["monthlyReturnRowCount"],
            "shardCount": validation["shardCount"],
            "exportFileCount": validation["fileCount"],
            "exportContentBytes": validation["contentBytes"],
            "stagedFileCount": len(all_staged_files),
            "stagedBytes": sum(path.stat().st_size for path in all_staged_files),
            "candidatePackageReady": manifest.get("candidatePackageReady"),
            "packageGlobalBlockingIssueCount": manifest.get("packageGlobalBlockingIssueCount"),
            "internalPreviewReviewOnly": manifest.get("internalPreviewReviewOnly"),
            "productionPublishReady": manifest.get("productionPublishReady"),
            "appExportApproved": manifest.get("appExportApproved"),
            "repositoryStatusUnchanged": True,
            "productionSelectorChanged": False,
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
        description="Validate and stage a FINPLE review-only export as a protected Vercel Preview build.",
    )
    parser.add_argument("--input-export", required=True, type=Path, help="One-Click app-preview ZIP or extracted directory")
    parser.add_argument("--staging-dir", required=True, type=Path, help="External final staging directory")
    parser.add_argument("--target-segment", required=True, help="Single version segment below /app-preview-data/")
    parser.add_argument("--expected-zip-sha256", help="Required SHA-256 for ZIP input")
    parser.add_argument(
        "--api-upstream-base-url",
        required=True,
        help="HTTPS API upstream used only by the generated /preview-api external rewrite",
    )
    parser.add_argument(
        "--project-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="FINPLE repository root (defaults to this script's repository)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        summary = stage_app_preview(
            input_export=args.input_export,
            staging_dir=args.staging_dir,
            target_segment=args.target_segment,
            expected_zip_sha256=args.expected_zip_sha256,
            api_upstream_base_url=args.api_upstream_base_url,
            project_dir=args.project_dir,
        )
    except (OSError, subprocess.CalledProcessError, StagingError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
