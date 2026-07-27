#!/usr/bin/env python3
"""Build a deterministic review-policy candidate from a review-only source app-export.

The command is deliberately post-provider: it reads an existing source
app-export created from the immutable candidate package, requires explicit
monthly-return proxy lineage, replays only generic review approval policies,
preserves every source shard byte-for-byte, and emits review-only artifacts.
It never calls a provider and never creates a Production-approved release.
"""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import stat
import zipfile
from typing import Any, Mapping

from scripts.metrics_pipeline.review_approval_policy import (
    GAPPED_HISTORY_POLICY_VERSION,
    LEVERAGED_POLICY_VERSION,
    evaluate_review_approval,
)


SOURCE_MANIFEST = "app-preview-manifest.json"
OVERLAY = "metrics-overlay.json"
MONTHLY_INDEX = "monthly-returns-index.json"
QA_SUMMARY = "app-preview-qa-summary.json"
AUDIT_REPORT = "review-approval-audit.json"
DIFF_REPORT = "review-state-diff.json"
EXCEPTION_REPORT = "review-required-exceptions.json"
RELEASE_CANDIDATE = "production-app-export-release-candidate.json"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
MONTHLY_ROW_ENCODING = [
    "month",
    "priceReturn",
    "totalReturn",
    "fxReturn",
    "currency",
    "benchmarkId",
    "dataStatus",
    "isProxy",
    "proxyTicker",
]


class ReviewArtifactError(ValueError):
    pass


def canonical_json_bytes(value: Any, *, pretty: bool = False) -> bytes:
    if pretty:
        text = json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            indent=2,
        )
    else:
        text = json.dumps(
            value,
            ensure_ascii=False,
            allow_nan=False,
            sort_keys=True,
            separators=(",", ":"),
        )
    return text.encode("utf-8") + b"\n"


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_member_name(value: str) -> str:
    if not value or "\\" in value or "\x00" in value:
        raise ReviewArtifactError("unsafe ZIP member")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("", ".", "..") for part in path.parts):
        raise ReviewArtifactError("unsafe ZIP member")
    return path.as_posix()


def read_source_zip(path: Path) -> dict[str, bytes]:
    try:
        archive = zipfile.ZipFile(path)
    except (OSError, zipfile.BadZipFile) as exc:
        raise ReviewArtifactError("source app-export ZIP is invalid") from exc
    files: dict[str, bytes] = {}
    with archive:
        for info in archive.infolist():
            name = safe_member_name(info.filename.rstrip("/"))
            mode = (info.external_attr >> 16) & 0xFFFF
            file_type = stat.S_IFMT(mode)
            if info.is_dir() or file_type not in (0, stat.S_IFREG):
                raise ReviewArtifactError("source app-export contains a non-regular member")
            if name in files:
                raise ReviewArtifactError("source app-export contains a duplicate member")
            files[name] = archive.read(info)
    return files


def load_json_bytes(files: Mapping[str, bytes], name: str) -> Any:
    if name not in files:
        raise ReviewArtifactError(f"source app-export is missing {name}")
    try:
        return json.loads(files[name].decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ReviewArtifactError(f"source app-export has invalid JSON: {name}") from exc


def validate_source_inventory(files: Mapping[str, bytes], manifest: Mapping[str, Any]) -> None:
    records = manifest.get("files")
    if not isinstance(records, list):
        raise ReviewArtifactError("source manifest file inventory is missing")
    expected_names = {SOURCE_MANIFEST}
    for record in records:
        if not isinstance(record, dict):
            raise ReviewArtifactError("source manifest file record is invalid")
        name = safe_member_name(str(record.get("path") or ""))
        expected_names.add(name)
        payload = files.get(name)
        if payload is None:
            raise ReviewArtifactError(f"source manifest member is missing: {name}")
        if len(payload) != record.get("sizeBytes") or sha256_bytes(payload) != record.get("sha256"):
            raise ReviewArtifactError(f"source manifest member binding mismatch: {name}")
    if set(files) != expected_names:
        raise ReviewArtifactError("source manifest inventory does not bind every ZIP member")
    expected = {
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
    }
    for field, value in expected.items():
        if manifest.get(field) != value:
            raise ReviewArtifactError(f"source review gate mismatch: {field}")


def load_product_metadata(path: Path) -> dict[str, dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise ReviewArtifactError("product metadata is invalid") from exc
    records = payload.get("records") if isinstance(payload, dict) else None
    if (
        not isinstance(records, list)
        or payload.get("schemaVersion") != 1
        or payload.get("policyVersion") != LEVERAGED_POLICY_VERSION
    ):
        raise ReviewArtifactError("product metadata contract mismatch")
    by_identity: dict[str, dict[str, Any]] = {}
    for record in records:
        identity = str(record.get("identity") or "").strip().upper()
        if not re.fullmatch(r"(?:US|KR):[0-9A-Z.^-]+", identity) or identity in by_identity:
            raise ReviewArtifactError("product metadata identity is invalid or duplicated")
        by_identity[identity] = dict(record)
    return by_identity


def series_for_identity(
    files: Mapping[str, bytes],
    index: Mapping[str, Any],
    identity: str,
    shard_cache: dict[str, Any],
) -> list[list[Any]]:
    record = index.get("assets", {}).get(identity)
    if not isinstance(record, dict):
        return []
    shard_path = safe_member_name(str(record.get("shard") or ""))
    if shard_path not in shard_cache:
        shard_cache[shard_path] = load_json_bytes(files, shard_path)
    rows = shard_cache[shard_path].get("series", {}).get(identity)
    if not isinstance(rows, list) or len(rows) != record.get("rowCount"):
        raise ReviewArtifactError(f"monthly-return series binding mismatch: {identity}")
    if any(not isinstance(row, list) or len(row) != len(MONTHLY_ROW_ENCODING) for row in rows):
        raise ReviewArtifactError(f"monthly-return proxy lineage is missing: {identity}")
    return rows


def validate_monthly_index_contract(index: Mapping[str, Any]) -> None:
    if index.get("rowEncoding") != MONTHLY_ROW_ENCODING:
        raise ReviewArtifactError(
            "monthly-return row encoding must preserve explicit proxy lineage"
        )


def apply_review_policies(
    files: Mapping[str, bytes],
    overlay: Mapping[str, Any],
    index: Mapping[str, Any],
    metadata: Mapping[str, Mapping[str, Any]],
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any], dict[str, Any]]:
    rows = overlay.get("rows")
    if not isinstance(rows, list):
        raise ReviewArtifactError("metrics overlay rows are missing")
    identity_counts = Counter(
        str(row.get("identity") or f"{row.get('market')}:{row.get('ticker')}").upper()
        for row in rows
        if isinstance(row, dict)
    )
    invalid_metadata_usage = sorted(
        identity
        for identity in metadata
        if identity_counts.get(identity, 0) != 1
    )
    if invalid_metadata_usage:
        raise ReviewArtifactError(
            "product metadata identity must bind exactly one overlay row: "
            + ", ".join(invalid_metadata_usage)
        )
    shard_cache: dict[str, Any] = {}
    decisions: list[dict[str, Any]] = []
    changes: list[dict[str, Any]] = []
    exceptions: list[dict[str, Any]] = []
    output_rows: list[dict[str, Any]] = []

    for source_row in rows:
        row = dict(source_row)
        identity = str(row.get("identity") or f"{row.get('market')}:{row.get('ticker')}").upper()
        monthly_rows = series_for_identity(files, index, identity, shard_cache)
        benchmark_ticker = str(row.get("benchmarkTicker") or "").strip().upper()
        benchmark_identity = (
            f"{str(row.get('market') or '').upper()}:{benchmark_ticker}"
            if benchmark_ticker
            else ""
        )
        benchmark_rows = (
            series_for_identity(files, index, benchmark_identity, shard_cache)
            if benchmark_identity
            else []
        )
        decision = evaluate_review_approval(
            row,
            monthly_rows,
            benchmark_rows,
            metadata.get(identity),
        )
        if decision.applicable:
            serialized = decision.to_dict()
            decisions.append({"identity": identity, **serialized})
            row["reviewApprovalPolicyVersion"] = decision.policyVersion
            row["reviewApprovalStatus"] = decision.status
            row["reviewApprovalReasonCodes"] = list(decision.reasonCodes)
            row["reviewApprovalAudit"] = dict(decision.audit)
            if identity in metadata:
                for field in (
                    "assetType",
                    "exposureType",
                    "leverageMultiple",
                    "direction",
                    "resetFrequency",
                    "underlyingTicker",
                    "inceptionDate",
                    "sourceId",
                    "officialSourceUrl",
                    "sourceCheckedAt",
                ):
                    row[field] = metadata[identity].get(field)
            if (
                decision.approved
                and str(row.get("reviewFlag") or "").strip() == "review_required"
            ):
                before = {
                    "dataStatus": row.get("dataStatus"),
                    "reviewFlag": row.get("reviewFlag"),
                    "reviewReason": row.get("reviewReason"),
                }
                row["dataStatus"] = "ready"
                row["reviewFlag"] = "none"
                row["reviewReason"] = None
                row["reviewApprovalReason"] = decision.approvalReason
                changes.append(
                    {
                        "identity": identity,
                        "policyVersion": decision.policyVersion,
                        "before": before,
                        "after": {
                            "dataStatus": row["dataStatus"],
                            "reviewFlag": row["reviewFlag"],
                            "reviewReason": row["reviewReason"],
                        },
                    }
                )
            elif not decision.approved:
                exceptions.append(
                    {
                        "identity": identity,
                        "policyVersion": decision.policyVersion,
                        "status": decision.status,
                        "reasonCodes": list(decision.reasonCodes),
                    }
                )
        output_rows.append(row)

    output_overlay = dict(overlay)
    output_overlay["rows"] = output_rows
    output_overlay["reviewApprovalPolicyVersions"] = [
        GAPPED_HISTORY_POLICY_VERSION,
        LEVERAGED_POLICY_VERSION,
    ]
    output_overlay["reviewApprovalSummary"] = {
        "applicableCount": len(decisions),
        "approvedCount": sum(1 for decision in decisions if decision["approved"]),
        "heldCount": sum(1 for decision in decisions if not decision["approved"]),
        "changedCount": len(changes),
    }
    audit = {
        "schemaVersion": 1,
        "reviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
        "policyVersions": [
            GAPPED_HISTORY_POLICY_VERSION,
            LEVERAGED_POLICY_VERSION,
        ],
        "summary": output_overlay["reviewApprovalSummary"],
        "decisions": decisions,
    }
    diff = {
        "schemaVersion": 1,
        "changedCount": len(changes),
        "changes": changes,
        "monthlyReturnIndexChanged": False,
        "monthlyShardBytesChanged": False,
    }
    exception_report = {
        "schemaVersion": 1,
        "exceptionCount": len(exceptions),
        "exceptions": exceptions,
    }
    return output_overlay, audit, diff, exception_report


def update_qa_summary(
    source: Mapping[str, Any],
    overlay: Mapping[str, Any],
) -> dict[str, Any]:
    qa = dict(source)
    rows = overlay["rows"]
    counts: dict[str, int] = {}
    by_identity = {}
    for row in rows:
        status = str(row.get("dataStatus") or "")
        counts[status] = counts.get(status, 0) + 1
        by_identity[str(row.get("identity") or "")] = row
    qa["dataStatusCounts"] = dict(sorted(counts.items()))
    qa["reviewApprovalPolicyVersions"] = overlay["reviewApprovalPolicyVersions"]
    qa["reviewApprovalSummary"] = overlay["reviewApprovalSummary"]
    representatives = dict(qa.get("representativeAssets") or {})
    for identity in representatives:
        row = by_identity.get(identity)
        if not row:
            continue
        for field in (
            "dataStatus",
            "reviewFlag",
            "reviewReason",
            "reviewApprovalPolicyVersion",
            "reviewApprovalStatus",
            "reviewApprovalReasonCodes",
            "reviewApprovalAudit",
        ):
            if field in row:
                representatives[identity][field] = row[field]
    qa["representativeAssets"] = representatives
    qa["status"] = "review_policy_candidate_ready_for_non_production_qa"
    return qa


def file_record(path: str, payload: bytes) -> dict[str, Any]:
    return {
        "path": path,
        "sha256": sha256_bytes(payload),
        "sizeBytes": len(payload),
    }


def update_manifest(
    source: Mapping[str, Any],
    files: Mapping[str, bytes],
    overlay: Mapping[str, Any],
) -> dict[str, Any]:
    manifest = dict(source)
    records = [
        file_record(path, payload)
        for path, payload in sorted(files.items())
        if path != SOURCE_MANIFEST
    ]
    by_path = {record["path"]: record for record in records}
    manifest["files"] = records
    manifest["metricsOverlay"] = by_path[OVERLAY]
    manifest["monthlyReturnsIndex"] = by_path[MONTHLY_INDEX]
    manifest["qaSummary"] = by_path[QA_SUMMARY]
    manifest["reviewApprovalAudit"] = by_path[AUDIT_REPORT]
    manifest["reviewStateDiff"] = by_path[DIFF_REPORT]
    manifest["reviewRequiredExceptions"] = by_path[EXCEPTION_REPORT]
    manifest["reviewApprovalPolicyVersions"] = overlay["reviewApprovalPolicyVersions"]
    manifest["reviewApprovalSummary"] = overlay["reviewApprovalSummary"]
    manifest["productionPublishReady"] = False
    manifest["appExportApproved"] = False
    manifest["internalPreviewReviewOnly"] = True
    return manifest


def write_bundle(bundle: Path, files: Mapping[str, bytes]) -> None:
    bundle.mkdir(parents=True, exist_ok=False)
    for name, payload in sorted(files.items()):
        output = bundle.joinpath(*PurePosixPath(name).parts)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(payload)


def write_deterministic_zip(path: Path, files: Mapping[str, bytes]) -> None:
    with zipfile.ZipFile(
        path,
        mode="x",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=9,
        strict_timestamps=True,
    ) as archive:
        for name, payload in sorted(files.items()):
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            archive.writestr(info, payload, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def build_release_candidate(
    manifest: Mapping[str, Any],
    source_zip_sha256: str,
    candidate_zip_sha256: str,
    source_git_sha: str,
) -> dict[str, Any]:
    return {
        "schemaVersion": 1,
        "contractVersion": "finple-production-app-export-release-candidate-v1-step114-review-policy",
        "approvalStatus": "pending_review",
        "approvedAt": None,
        "approvedBy": None,
        "productionPublishReady": False,
        "appExportApproved": False,
        "sourceGitMainSha": source_git_sha,
        "sourceAppExportSha256": source_zip_sha256,
        "candidateZipSha256": candidate_zip_sha256,
        "candidatePackageHash": manifest["sourceCandidatePackageHash"],
        "assetCount": manifest["assetCount"],
        "marketAssetCounts": manifest["marketAssetCounts"],
        "priceCoveredAssetCount": manifest["assetCount"] - manifest["rawMissingAssetCount"],
        "monthlyReturnAssetCount": manifest["monthlyReturnAssetCount"],
        "monthlyReturnRowCount": manifest["monthlyReturnRowCount"],
        "metricDataThroughMonth": manifest["metricDataThroughMonth"],
        "sourceManifest": file_record(SOURCE_MANIFEST, canonical_json_bytes(manifest, pretty=True)),
        "metricsOverlay": manifest["metricsOverlay"],
        "monthlyReturnsIndex": manifest["monthlyReturnsIndex"],
        "shardCount": manifest["shardCount"],
        "shardInventory": manifest["shardInventory"],
        "reviewApprovalSummary": manifest["reviewApprovalSummary"],
    }


def build(args: argparse.Namespace) -> dict[str, Any]:
    source_zip = args.source_export.resolve(strict=True)
    if not SHA256_RE.fullmatch(args.expected_source_sha256):
        raise ReviewArtifactError("expected source SHA-256 is invalid")
    if sha256_file(source_zip) != args.expected_source_sha256:
        raise ReviewArtifactError("source app-export SHA-256 mismatch")
    if not SHA256_RE.fullmatch(args.candidate_zip_sha256):
        raise ReviewArtifactError("candidate ZIP SHA-256 is invalid")
    if not re.fullmatch(r"[0-9a-f]{40}", args.source_git_sha):
        raise ReviewArtifactError("source Git SHA is invalid")
    output_dir = args.output_dir.resolve(strict=False)
    if output_dir.exists():
        raise ReviewArtifactError("output directory already exists")

    files = read_source_zip(source_zip)
    source_manifest = load_json_bytes(files, SOURCE_MANIFEST)
    validate_source_inventory(files, source_manifest)
    overlay = load_json_bytes(files, OVERLAY)
    index = load_json_bytes(files, MONTHLY_INDEX)
    validate_monthly_index_contract(index)
    source_qa = load_json_bytes(files, QA_SUMMARY)
    metadata = load_product_metadata(args.product_metadata.resolve(strict=True))
    new_overlay, audit, diff, exceptions = apply_review_policies(
        files,
        overlay,
        index,
        metadata,
    )

    output_files = dict(files)
    output_files[OVERLAY] = canonical_json_bytes(new_overlay)
    output_files[AUDIT_REPORT] = canonical_json_bytes(audit, pretty=True)
    output_files[DIFF_REPORT] = canonical_json_bytes(diff, pretty=True)
    output_files[EXCEPTION_REPORT] = canonical_json_bytes(exceptions, pretty=True)
    output_files[QA_SUMMARY] = canonical_json_bytes(
        update_qa_summary(source_qa, new_overlay),
        pretty=True,
    )
    new_manifest = update_manifest(source_manifest, output_files, new_overlay)
    output_files[SOURCE_MANIFEST] = canonical_json_bytes(new_manifest, pretty=True)

    output_dir.mkdir(parents=True, exist_ok=False)
    bundle = output_dir / "bundle"
    archive = output_dir / "finple_app_review_policy_candidate.zip"
    write_bundle(bundle, output_files)
    write_deterministic_zip(archive, output_files)
    archive_sha = sha256_file(archive)
    release_candidate = build_release_candidate(
        new_manifest,
        archive_sha,
        args.candidate_zip_sha256,
        args.source_git_sha,
    )
    release_path = output_dir / RELEASE_CANDIDATE
    release_path.write_bytes(canonical_json_bytes(release_candidate, pretty=True))
    inventory = [
        file_record(path, payload)
        for path, payload in sorted(output_files.items())
    ]
    result = {
        "ok": True,
        "reviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
        "sourceAppExportSha256": args.expected_source_sha256,
        "candidateAppExportSha256": archive_sha,
        "candidateReleaseManifestSha256": sha256_file(release_path),
        "fileCount": len(inventory),
        "inventorySha256": sha256_bytes(canonical_json_bytes(inventory)),
        "monthlyShardCount": new_manifest["shardCount"],
        "monthlyShardBytesChanged": False,
        "reviewApprovalSummary": new_manifest["reviewApprovalSummary"],
        "archive": str(archive),
        "bundle": str(bundle),
        "releaseCandidate": str(release_path),
    }
    (output_dir / "build-result.json").write_bytes(canonical_json_bytes(result, pretty=True))
    return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-export", required=True, type=Path)
    parser.add_argument("--expected-source-sha256", required=True)
    parser.add_argument("--candidate-zip-sha256", required=True)
    parser.add_argument("--source-git-sha", required=True)
    parser.add_argument(
        "--product-metadata",
        type=Path,
        default=Path("scripts/metrics_pipeline/review_product_metadata.json"),
    )
    parser.add_argument("--output-dir", required=True, type=Path)
    return parser.parse_args()


def main() -> int:
    try:
        result = build(parse_args())
    except (OSError, ReviewArtifactError, KeyError) as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False))
        return 1
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
