from __future__ import annotations

import csv
import hashlib
import html
import json
import re
import zipfile
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping

from .config import CALCULATION_POLICY_VERSION, PIPELINE_VERSION
from .package import write_deterministic_zip
from .pipeline import (
    _build_candidate_outputs,
    _normalized_metric_rows,
    _read_csv,
    _sha256,
    _validate_candidates,
    _validate_metric_output_rows,
)
from .schemas import (
    CANDIDATE_COLUMNS,
    FULL_METRICS_COLUMNS,
    MONTHLY_RETURNS_COLUMNS,
    NORMALIZED_MONTH_END_COLUMNS,
    RAW_DAILY_PRICE_COLUMNS,
    REVIEW_OVERLAY_COLUMNS,
    REVIEW_REQUIRED_COLUMNS,
    SELECTED_COLUMNS,
    TIMESERIES_AUDIT_COLUMNS,
    is_valid_kr_benchmark_ticker,
    is_valid_kr_candidate_ticker,
)
from .timeseries import NORMALIZATION_VERSION, normalize_daily_price_rows


CANDIDATE_PACKAGE_CONTRACT_VERSION = "production-candidate-package-v1-step114-2m"
CANDIDATE_PACKAGE_VERSION = "candidate-package-v1-step114-2m"
SOURCE_DECLARATION_CONTRACT_VERSION = "source-declaration-v1-step114-2m"
SUBMISSION_MANIFEST_CONTRACT_VERSION = "operator-submission-manifest-v1-step114-2m"
FINAL_PACKAGE_INDEX_CONTRACT_VERSION = "candidate-final-package-index-v1-step114-2m"
CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION = "candidate-package-verification-evidence-v1-step114-2o"
REQUIRED_INPUT_ROLES = {
    "candidate_asset_master",
    "benchmark_map",
    "raw_daily_price",
    "source_declaration",
    "operator_submission_manifest",
}
REQUIRED_FILE_INVENTORY_ROLES = REQUIRED_INPUT_ROLES.difference({"operator_submission_manifest"})
DEFAULT_FILENAMES = {
    "candidate_asset_master": "candidate_asset_master.csv",
    "benchmark_map": "benchmark_map.csv",
    "raw_daily_price": "raw_daily_prices.csv",
    "source_declaration": "source_declaration.json",
    "operator_submission_manifest": "operator_submission_manifest.json",
}
SOURCE_AUDIT_COLUMNS = [
    "issueType",
    "severity",
    "blocksCandidate",
    "logicalRole",
    "path",
    "reviewReason",
]
BENCHMARK_MAP_COLUMNS = ["benchmarkKey", "benchmarkMarket", "benchmarkTicker"]
HASH_INVENTORY_COLUMNS = [
    "artifactType",
    "logicalRole",
    "path",
    "exists",
    "sha256",
    "byteSize",
    "rowCount",
]
SAFE_BASENAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
SAFE_OUTPUT_VERSION_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]*$")


@dataclass(frozen=True)
class CandidatePackageConfig:
    input_dir: Path
    output_dir: Path
    metric_base_date: str
    output_version: str = "candidate"
    market_scope: tuple[str, ...] = ("US", "KR")
    input_mode: str = "manual_upload_candidate"
    candidate_asset_master_file: str = DEFAULT_FILENAMES["candidate_asset_master"]
    benchmark_map_file: str = DEFAULT_FILENAMES["benchmark_map"]
    raw_daily_price_file: str = DEFAULT_FILENAMES["raw_daily_price"]
    source_declaration_file: str = DEFAULT_FILENAMES["source_declaration"]
    operator_submission_manifest_file: str = DEFAULT_FILENAMES["operator_submission_manifest"]
    validation_date: date = date.today()
    internal_preview_review_only: bool = False

    @property
    def selected_cagr_policy(self) -> str:
        return "rolling_median_all_markets"

    @property
    def current_price_display(self) -> bool:
        return False

    @property
    def total_return_cagr_mode(self) -> str:
        return "reference_only"

    @property
    def min_years_for_inception(self) -> float:
        return 3.0


def run_finple_production_candidate_package(config: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """Build an offline review-only production data candidate package.

    This entry point intentionally does not call external providers and never
    never enables productionPublishReady or appExportApproved.
    """
    if not config:
        return _idle_result(["candidate inputs missing"])
    try:
        package_config = _load_candidate_config(config)
    except Exception as exc:  # noqa: BLE001 - public entrypoint must fail closed.
        return _idle_result([f"candidate config invalid: {exc}"])
    if package_config.input_mode != "manual_upload_candidate":
        return _idle_result(["candidate mode not explicitly selected"])

    issues: list[dict[str, str]] = []
    _validate_config_paths(package_config, issues)
    paths = _input_paths(package_config)
    output_paths = _output_paths(package_config)
    _validate_output_paths(package_config, output_paths, issues)
    if _has_blocking_issues(issues):
        return _blocked_no_write_result(package_config, output_paths, issues)

    package_config.output_dir.mkdir(parents=True, exist_ok=True)
    _validate_actual_input_file_set(package_config, paths, issues)
    missing_roles = [role for role, path in paths.items() if not path.exists()]
    for role in missing_roles:
        _add_issue(issues, "missing_input", "critical", True, role, paths[role].name, "Required candidate input is missing.")
    _validate_fixture_reclassification(paths, issues)
    if missing_roles:
        _write_candidate_outputs(
            package_config=package_config,
            output_paths=output_paths,
            input_paths=paths,
            source_declaration={},
            submission_manifest={},
            candidates=[],
            normalized_rows=[],
            monthly_return_rows=[],
            full_rows=[],
            review_rows=[],
            source_audit_rows=issues,
            timeseries_audit_rows=[],
            candidate_package_ready=False,
        )
        return _candidate_result(package_config, output_paths, issues, False)

    source_declaration = _read_json(paths["source_declaration"], issues, "source_declaration")
    submission_manifest = _read_json(paths["operator_submission_manifest"], issues, "operator_submission_manifest")
    _validate_source_declaration(source_declaration, paths, package_config, issues)
    _validate_submission_manifest(submission_manifest, paths, package_config, issues)

    candidates = _safe_read_csv(paths["candidate_asset_master"], issues, "candidate_asset_master")
    benchmark_map = _safe_read_candidate_benchmark_map(paths["benchmark_map"], issues)
    raw_daily_rows = _safe_read_csv(paths["raw_daily_price"], issues, "raw_daily_price")
    _validate_candidate_csv(candidates, package_config, issues)
    _validate_benchmark_contract(candidates, benchmark_map, package_config, issues)
    _validate_raw_daily_candidate_rows(raw_daily_rows, package_config, source_declaration, issues)
    _validate_scope_reconciliation(package_config, source_declaration, submission_manifest, candidates, raw_daily_rows, issues)

    if _has_blocking_issues(issues):
        _write_candidate_outputs(
            package_config=package_config,
            output_paths=output_paths,
            input_paths=paths,
            source_declaration=source_declaration,
            submission_manifest=submission_manifest,
            candidates=[],
            normalized_rows=[],
            monthly_return_rows=[],
            full_rows=[],
            review_rows=[],
            source_audit_rows=issues,
            timeseries_audit_rows=[],
            candidate_package_ready=False,
        )
        return _candidate_result(package_config, output_paths, issues, False)

    source_sha = _sha256(paths["raw_daily_price"])
    try:
        normalized = normalize_daily_price_rows(
            raw_daily_rows,
            source_file_name=paths["raw_daily_price"].name,
            source_sha256=source_sha,
            allow_review_only_provenance=package_config.internal_preview_review_only,
            normalized_data_status=(
                "normalized_candidate_review"
                if package_config.internal_preview_review_only
                else "normalized_fixture"
            ),
        )
    except Exception as exc:  # noqa: BLE001 - normalization remains fail-closed for operator input.
        _add_issue(issues, "normalization_failed", "critical", True, "raw_daily_price", paths["raw_daily_price"].name, str(exc))
        normalized = {"normalizedRows": [], "auditRows": []}
    normalized_rows = list(normalized["normalizedRows"])
    timeseries_audit_rows = list(normalized["auditRows"])
    for row in timeseries_audit_rows:
        if row.get("blocksPublication") == "true":
            review_only_provenance = (
                package_config.internal_preview_review_only
                and row.get("issueType") == "invalid_provenance_publication_policy"
            )
            _add_issue(
                issues,
                row.get("issueType", "timeseries_block"),
                "warning" if review_only_provenance else row.get("severity", "critical"),
                not review_only_provenance,
                "raw_daily_price",
                paths["raw_daily_price"].name,
                row.get("reviewReason", "Time-series normalization blocked this candidate."),
            )

    if _has_blocking_issues(issues):
        _write_candidate_outputs(
            package_config=package_config,
            output_paths=output_paths,
            input_paths=paths,
            source_declaration=source_declaration,
            submission_manifest=submission_manifest,
            candidates=[],
            normalized_rows=normalized_rows,
            monthly_return_rows=[],
            full_rows=[],
            review_rows=[],
            source_audit_rows=issues,
            timeseries_audit_rows=timeseries_audit_rows,
            candidate_package_ready=False,
        )
        return _candidate_result(package_config, output_paths, issues, False)

    normalized_metric_rows = _normalized_metric_rows(normalized_rows)
    normalized_hash_by_identity = _hash_price_rows_by_identity(normalized_metric_rows)
    prices_by_identity = _group_prices_by_identity(normalized_metric_rows)
    full_rows: list[dict[str, str]] = []
    review_rows: list[dict[str, str]] = []
    monthly_return_rows: list[dict[str, str]] = []
    for candidate in sorted(candidates, key=lambda row: (row.get("market", ""), row.get("ticker", ""))):
        identity = (candidate.get("market", ""), candidate.get("ticker", ""))
        benchmark_identity = benchmark_map.get(candidate.get("benchmarkKey", ""), ("", ""))
        metrics_row, candidate_review_rows, candidate_returns = _build_candidate_outputs(
            candidate=candidate,
            config=package_config,
            prices=prices_by_identity.get(identity, []),
            benchmark_ticker=benchmark_identity[1],
            benchmark_prices=prices_by_identity.get(benchmark_identity, []),
            source_hash=normalized_hash_by_identity.get(identity, ""),
            raw_source_sha256=source_sha,
        )
        metrics_row["sourcePolicy"] = (
            "internal_preview_review_only_unapproved_provenance"
            if package_config.internal_preview_review_only
            else "manual_operator_upload_candidate_review_only"
        )
        metrics_row["notes"] = (
            "Step 114-2Y internal Preview candidate; license/publication review required; not production-publish-ready or app-export-approved."
            if package_config.internal_preview_review_only
            else "Step 114-2M offline production data candidate; review-only and not app-export-approved."
        )
        for return_row in candidate_returns:
            return_row["dataStatus"] = return_row.get("dataStatus", "").replace("fixture", "candidate")
        full_rows.append(metrics_row)
        review_rows.extend(candidate_review_rows)
        monthly_return_rows.extend(candidate_returns)

    for error in _validate_metric_output_rows(full_rows):
        _add_issue(issues, "metrics_output_invalid", "critical", True, "metrics_output", "", error)

    blocking_issues = [issue for issue in issues if issue["blocksCandidate"] == "true"]
    _write_candidate_outputs(
        package_config=package_config,
        output_paths=output_paths,
        input_paths=paths,
        source_declaration=source_declaration,
        submission_manifest=submission_manifest,
        candidates=candidates,
        normalized_rows=normalized_rows,
        monthly_return_rows=monthly_return_rows,
        full_rows=full_rows,
        review_rows=review_rows,
        source_audit_rows=issues,
        timeseries_audit_rows=timeseries_audit_rows,
        candidate_package_ready=not blocking_issues,
    )

    return _candidate_result(package_config, output_paths, issues, not blocking_issues)


def _load_candidate_config(config: Mapping[str, Any]) -> CandidatePackageConfig:
    validation_date = config.get("validation_date")
    if validation_date is None:
        parsed_validation_date = date.today()
    elif isinstance(validation_date, date):
        parsed_validation_date = validation_date
    else:
        parsed_validation_date = _parse_date(validation_date)
        if parsed_validation_date is None:
            raise ValueError("validation_date must be YYYY-MM-DD")
    return CandidatePackageConfig(
        input_dir=Path(config["input_dir"]),
        output_dir=Path(config["output_dir"]),
        metric_base_date=str(config["metric_base_date"]),
        output_version=str(config.get("output_version", "candidate")),
        market_scope=tuple(str(market).upper() for market in config.get("market_scope", ("US", "KR"))),
        input_mode=str(config.get("input_mode", "manual_upload_candidate")),
        candidate_asset_master_file=str(config.get("candidate_asset_master_file", DEFAULT_FILENAMES["candidate_asset_master"])),
        benchmark_map_file=str(config.get("benchmark_map_file", DEFAULT_FILENAMES["benchmark_map"])),
        raw_daily_price_file=str(config.get("raw_daily_price_file", DEFAULT_FILENAMES["raw_daily_price"])),
        source_declaration_file=str(config.get("source_declaration_file", DEFAULT_FILENAMES["source_declaration"])),
        operator_submission_manifest_file=str(config.get("operator_submission_manifest_file", DEFAULT_FILENAMES["operator_submission_manifest"])),
        validation_date=parsed_validation_date,
        internal_preview_review_only=bool(config.get("internal_preview_review_only", False)),
    )


def _idle_result(reasons: list[str]) -> dict[str, Any]:
    return {
        "ok": False,
        "status": "idle",
        "fixturePackageReady": False,
        "candidatePackageReady": False,
        "productionPublishReady": False,
        "appExportApproved": False,
        "blockingIssueCount": len(reasons),
        "warningIssueCount": 0,
        "issues": [
            {
                "issueType": "missing_input",
                "severity": "critical",
                "blocksCandidate": "true",
                "logicalRole": "candidate_package",
                "path": "",
                "reviewReason": reason,
            }
            for reason in reasons
        ],
        "outputs": {},
    }


def _blocked_result(config: CandidatePackageConfig, paths: Mapping[str, Path], issues: list[dict[str, str]]) -> dict[str, Any]:
    return {
        "ok": False,
        "status": "blocked",
        "fixturePackageReady": False,
        "candidatePackageReady": False,
        "productionPublishReady": False,
        "appExportApproved": False,
        "internalPreviewReviewOnly": config.internal_preview_review_only,
        "blockingIssueCount": len([issue for issue in issues if issue["blocksCandidate"] == "true"]),
        "warningIssueCount": 0,
        "issues": issues,
        "outputs": {role: str(path) for role, path in sorted(paths.items())},
        "metricBaseDate": config.metric_base_date,
    }


def _blocked_no_write_result(
    config: CandidatePackageConfig,
    output_paths: Mapping[str, Path],
    issues: list[dict[str, str]],
) -> dict[str, Any]:
    return {
        "ok": False,
        "status": "blocked",
        "fixturePackageReady": False,
        "candidatePackageReady": False,
        "productionPublishReady": False,
        "appExportApproved": False,
        "internalPreviewReviewOnly": config.internal_preview_review_only,
        "blockingIssueCount": len([issue for issue in issues if issue["blocksCandidate"] == "true"]),
        "warningIssueCount": len([issue for issue in issues if issue["blocksCandidate"] == "false"]),
        "candidatePackageHash": "",
        "zipPackageSha256": "",
        "candidatePackageId": "",
        "validationDate": config.validation_date.isoformat(),
        "outputs": {key: str(path) for key, path in output_paths.items()},
        "issues": issues,
    }


def _candidate_result(
    config: CandidatePackageConfig,
    output_paths: Mapping[str, Path],
    issues: list[dict[str, str]],
    ready: bool,
) -> dict[str, Any]:
    readiness = _read_json(output_paths["readinessJson"], [], "readiness") if output_paths["readinessJson"].exists() else {}
    zip_sha = _sha256(output_paths["zipPackage"]) if output_paths["zipPackage"].exists() else ""
    return {
        "ok": ready,
        "status": "ready" if ready else "blocked",
        "fixturePackageReady": False,
        "candidatePackageReady": ready,
        "productionPublishReady": False,
        "appExportApproved": False,
        "internalPreviewReviewOnly": config.internal_preview_review_only,
        "blockingIssueCount": len([issue for issue in issues if issue["blocksCandidate"] == "true"]),
        "warningIssueCount": len([issue for issue in issues if issue["blocksCandidate"] == "false"]),
        "candidatePackageHash": readiness.get("candidatePackageHash", ""),
        "zipPackageSha256": zip_sha,
        "candidatePackageId": readiness.get("candidatePackageId", ""),
        "validationDate": config.validation_date.isoformat(),
        "outputs": {key: str(path) for key, path in output_paths.items()},
        "issues": issues,
    }


def _input_paths(config: CandidatePackageConfig) -> dict[str, Path]:
    return {
        "candidate_asset_master": config.input_dir / _safe_file_name_or_placeholder(config.candidate_asset_master_file, "candidate_asset_master"),
        "benchmark_map": config.input_dir / _safe_file_name_or_placeholder(config.benchmark_map_file, "benchmark_map"),
        "raw_daily_price": config.input_dir / _safe_file_name_or_placeholder(config.raw_daily_price_file, "raw_daily_price"),
        "source_declaration": config.input_dir / _safe_file_name_or_placeholder(config.source_declaration_file, "source_declaration"),
        "operator_submission_manifest": config.input_dir / _safe_file_name_or_placeholder(config.operator_submission_manifest_file, "operator_submission_manifest"),
    }


def _output_paths(config: CandidatePackageConfig) -> dict[str, Path]:
    version = _safe_output_version_or_placeholder(config.output_version)
    return {
        "manifestJson": config.output_dir / f"finple_candidate_manifest_{version}.json",
        "readinessJson": config.output_dir / f"finple_candidate_readiness_{version}.json",
        "normalizedMonthEndCsv": config.output_dir / f"finple_candidate_normalized_month_end_{version}.csv",
        "monthlyReturnsCsv": config.output_dir / f"finple_candidate_monthly_returns_{version}.csv",
        "metricsOutputCsv": config.output_dir / f"finple_candidate_metrics_output_{version}.csv",
        "selectedMetricsCsv": config.output_dir / f"finple_candidate_selected_metrics_{version}.csv",
        "reviewRequiredCsv": config.output_dir / f"finple_candidate_review_required_{version}.csv",
        "usReviewOverlayCsv": config.output_dir / f"finple_candidate_review_overlay_us_{version}.csv",
        "krReviewOverlayCsv": config.output_dir / f"finple_candidate_review_overlay_kr_{version}.csv",
        "sourceAuditCsv": config.output_dir / f"finple_candidate_source_audit_{version}.csv",
        "timeseriesAuditCsv": config.output_dir / f"finple_candidate_timeseries_audit_{version}.csv",
        "auditHtml": config.output_dir / f"finple_candidate_audit_{version}.html",
        "hashInventoryCsv": config.output_dir / f"finple_candidate_hash_inventory_{version}.csv",
        "packageIndexJson": config.output_dir / f"finple_candidate_package_index_{version}.json",
        "zipPackage": config.output_dir / f"finple_production_candidate_{version}.zip",
    }


def _read_json(path: Path, issues: list[dict[str, str]], role: str) -> dict[str, Any]:
    try:
        parsed = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - fail-closed parser boundary.
        _add_issue(issues, "malformed_json", "critical", True, role, path.name, str(exc))
        return {}
    if not isinstance(parsed, dict):
        _add_issue(issues, "malformed_json_type", "critical", True, role, path.name, "JSON root must be an object.")
        return {}
    return parsed


def _safe_read_csv(path: Path, issues: list[dict[str, str]], role: str) -> list[dict[str, str]]:
    try:
        rows = _read_csv(path)
    except Exception as exc:  # noqa: BLE001 - fail-closed parser boundary.
        _add_issue(issues, "malformed_csv", "critical", True, role, path.name, str(exc))
        return []
    for row in rows:
        if None in row:
            _add_issue(issues, "malformed_csv", "critical", True, role, path.name, "CSV row has more fields than the header.")
            return []
    return rows


def _safe_read_candidate_benchmark_map(path: Path, issues: list[dict[str, str]]) -> dict[str, tuple[str, str]]:
    try:
        rows = _read_csv(path)
    except Exception as exc:  # noqa: BLE001
        _add_issue(issues, "malformed_csv", "critical", True, "benchmark_map", path.name, str(exc))
        return {}
    for row in rows:
        if None in row:
            _add_issue(issues, "malformed_csv", "critical", True, "benchmark_map", path.name, "CSV row has more fields than the header.")
            return {}
    if not rows:
        _add_issue(issues, "benchmark_map_missing", "critical", True, "benchmark_map", path.name, "Benchmark map is empty.")
        return {}
    missing = sorted(set(BENCHMARK_MAP_COLUMNS).difference(rows[0]))
    for column in missing:
        _add_issue(issues, "benchmark_map_schema_invalid", "critical", True, "benchmark_map", path.name, f"Missing column {column}.")
    if missing:
        return {}
    output: dict[str, tuple[str, str]] = {}
    for row in rows:
        key = row.get("benchmarkKey", "")
        market = row.get("benchmarkMarket", "")
        ticker = row.get("benchmarkTicker", "")
        if not key or key.strip() != key:
            _add_issue(issues, "benchmark_key_invalid", "critical", True, "benchmark_map", path.name, "benchmarkKey must be non-empty and trimmed.")
            continue
        if key in output:
            _add_issue(issues, "duplicate_benchmark_key", "critical", True, "benchmark_map", path.name, f"Duplicate benchmarkKey {key}.")
            continue
        if market not in {"US", "KR"}:
            _add_issue(issues, "benchmark_market_invalid", "critical", True, "benchmark_map", path.name, f"Unsupported benchmarkMarket {market}.")
            continue
        if market == "KR" and not is_valid_kr_benchmark_ticker(ticker):
            _add_issue(issues, "benchmark_ticker_identity_invalid", "critical", True, "benchmark_map", path.name, "KR benchmarkTicker must preserve six digits.")
            continue
        if not ticker or ticker.strip() != ticker:
            _add_issue(issues, "benchmark_ticker_identity_invalid", "critical", True, "benchmark_map", path.name, "benchmarkTicker must be non-empty and trimmed.")
            continue
        output[key] = (market, ticker)
    return output


def _validate_config_paths(config: CandidatePackageConfig, issues: list[dict[str, str]]) -> None:
    file_names = {
        "candidate_asset_master": config.candidate_asset_master_file,
        "benchmark_map": config.benchmark_map_file,
        "raw_daily_price": config.raw_daily_price_file,
        "source_declaration": config.source_declaration_file,
        "operator_submission_manifest": config.operator_submission_manifest_file,
    }
    for role, file_name in file_names.items():
        if not _safe_basename(file_name):
            _add_issue(issues, "unsafe_config_filename", "critical", True, role, str(file_name), "Configured input filename must be a safe basename.")
    if not SAFE_OUTPUT_VERSION_PATTERN.fullmatch(config.output_version):
        _add_issue(issues, "unsafe_output_version", "critical", True, "candidate_package", config.output_version, "output_version must be path-safe.")
    try:
        input_dir = config.input_dir.resolve()
        output_dir = config.output_dir.resolve()
        if input_dir == output_dir or input_dir in output_dir.parents or output_dir in input_dir.parents:
            _add_issue(issues, "input_output_overlap", "critical", True, "candidate_package", str(output_dir), "input_dir and output_dir must be distinct and non-overlapping.")
    except OSError as exc:
        _add_issue(issues, "path_resolution_failed", "critical", True, "candidate_package", "", str(exc))


def _validate_output_paths(config: CandidatePackageConfig, output_paths: Mapping[str, Path], issues: list[dict[str, str]]) -> None:
    try:
        output_dir = config.output_dir.resolve()
    except OSError as exc:
        _add_issue(issues, "path_resolution_failed", "critical", True, "candidate_package", str(config.output_dir), str(exc))
        return
    for role, path in output_paths.items():
        try:
            resolved = path.resolve()
        except OSError as exc:
            _add_issue(issues, "path_resolution_failed", "critical", True, role, str(path), str(exc))
            continue
        if resolved.parent != output_dir:
            _add_issue(issues, "output_path_escape", "critical", True, role, str(path), "Output path must stay directly inside output_dir.")


def _validate_actual_input_file_set(config: CandidatePackageConfig, paths: Mapping[str, Path], issues: list[dict[str, str]]) -> None:
    if not config.input_dir.exists():
        return
    expected = {path.name for path in paths.values()}
    actual = {item.name for item in config.input_dir.iterdir() if item.is_file()}
    for name in sorted(actual.difference(expected)):
        _add_issue(issues, "extra_physical_input_file", "critical", True, "candidate_package", name, "Input directory contains an unexpected file.")
    for name in sorted(expected.difference(actual)):
        _add_issue(issues, "missing_physical_input_file", "critical", True, "candidate_package", name, "Input directory is missing an expected file.")


def _validate_source_declaration(source: Mapping[str, Any], paths: Mapping[str, Path], config: CandidatePackageConfig, issues: list[dict[str, str]]) -> None:
    required = [
        "contractVersion",
        "sourceKind",
        "sourceName",
        "acquiredAt",
        "asOfDate",
        "marketScope",
        "timezone",
        "currencyMode",
        "returnBasis",
        "priceAdjustmentBasis",
        "redistributionReviewStatus",
        "appUseReviewStatus",
        "sourceFileSha256",
        "rowCount",
        "operatorId",
        "fixtureOnly",
        "testOnly",
    ]
    for field in required:
        if field not in source:
            _add_issue(issues, "source_declaration_missing_field", "critical", True, "source_declaration", "source_declaration.json", field)
    for field in ["sourceName", "sourceReference", "operatorId"]:
        if not _non_empty_string(source.get(field)):
            _add_issue(issues, "source_declaration_empty_field", "critical", True, "source_declaration", "source_declaration.json", f"{field} must be non-empty.")
    if not (source.get("sourceUrl") or source.get("sourceReference")):
        _add_issue(issues, "source_reference_missing", "critical", True, "source_declaration", "source_declaration.json", "sourceUrl or sourceReference is required.")
    if source.get("contractVersion") != SOURCE_DECLARATION_CONTRACT_VERSION:
        _add_issue(issues, "source_contract_version_mismatch", "critical", True, "source_declaration", "source_declaration.json", "Unsupported source declaration contract.")
    if source.get("sourceKind") != "manual_operator_upload":
        _add_issue(issues, "source_kind_invalid", "critical", True, "source_declaration", "source_declaration.json", "sourceKind must be manual_operator_upload.")
    if source.get("fixtureOnly") is not False:
        _add_issue(issues, "fixture_marker_blocked", "critical", True, "source_declaration", "source_declaration.json", "fixtureOnly must be false.")
    if source.get("testOnly") is not False:
        _add_issue(issues, "test_only_marker_blocked", "critical", True, "source_declaration", "source_declaration.json", "testOnly must be false.")
    if _source_text_contains_marker(source, {"fixture", "synthetic", "testonly", "test_only"}):
        _add_issue(issues, "synthetic_or_fixture_marker_blocked", "critical", True, "source_declaration", "source_declaration.json", "Fixture/synthetic/test markers are not allowed in candidate mode.")
    if source.get("sourceFileSha256") != _sha256(paths["raw_daily_price"]):
        _add_issue(issues, "source_file_sha256_mismatch", "critical", True, "raw_daily_price", paths["raw_daily_price"].name, "sourceFileSha256 does not match raw daily CSV.")
    raw_rows = _safe_read_csv(paths["raw_daily_price"], issues, "raw_daily_price") if paths["raw_daily_price"].exists() else []
    if source.get("rowCount") != len(raw_rows):
        _add_issue(issues, "source_row_count_mismatch", "critical", True, "raw_daily_price", paths["raw_daily_price"].name, "source declaration rowCount mismatch.")
    if source.get("redistributionReviewStatus") not in {"approved", "allowed", "reviewed_approved"}:
        _add_issue(
            issues,
            "redistribution_review_not_approved",
            "warning" if config.internal_preview_review_only else "critical",
            not config.internal_preview_review_only,
            "source_declaration",
            "source_declaration.json",
            "Redistribution review is not approved; internal Preview remains review-only.",
        )
    if source.get("appUseReviewStatus") not in {"approved", "allowed", "reviewed_approved"}:
        _add_issue(
            issues,
            "app_use_review_not_approved",
            "warning" if config.internal_preview_review_only else "critical",
            not config.internal_preview_review_only,
            "source_declaration",
            "source_declaration.json",
            "App-use review is not approved; internal Preview remains review-only.",
        )
    if source.get("timezone") not in {"Asia/Seoul", "America/New_York", "UTC"}:
        _add_issue(issues, "timezone_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported timezone.")
    if tuple(_normalize_market_scope(source.get("marketScope"))) != config.market_scope:
        _add_issue(issues, "market_scope_mismatch", "critical", True, "source_declaration", "source_declaration.json", "Source marketScope must match config.market_scope exactly.")
    if source.get("currencyMode") not in {"KRW", "USD", "mixed"}:
        _add_issue(issues, "currency_mode_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported currencyMode.")
    allowed_return_bases = {"price_return", "total_return"}
    if config.internal_preview_review_only:
        allowed_return_bases.add("mixed_reference")
    if source.get("returnBasis") not in allowed_return_bases:
        _add_issue(issues, "return_basis_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported returnBasis.")
    allowed_adjustment_bases = {"raw_close", "split_adjusted", "split_and_dividend_adjusted", "total_return_adjusted"}
    if config.internal_preview_review_only:
        allowed_adjustment_bases.add("mixed_explicit")
    if source.get("priceAdjustmentBasis") not in allowed_adjustment_bases:
        _add_issue(issues, "price_adjustment_basis_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported priceAdjustmentBasis.")
    if source.get("returnBasis") == "price_return" and source.get("priceAdjustmentBasis") == "total_return_adjusted":
        _add_issue(issues, "return_basis_adjustment_incompatible", "critical", True, "source_declaration", "source_declaration.json", "price_return cannot use total_return_adjusted price basis.")
    if source.get("returnBasis") == "total_return" and source.get("priceAdjustmentBasis") not in {"split_and_dividend_adjusted", "total_return_adjusted"}:
        _add_issue(issues, "return_basis_adjustment_incompatible", "critical", True, "source_declaration", "source_declaration.json", "total_return requires dividend-adjusted or total-return-adjusted basis.")
    if _parse_timestamp(source.get("acquiredAt")) is None:
        _add_issue(issues, "acquired_at_invalid", "critical", True, "source_declaration", "source_declaration.json", "acquiredAt must be a valid timestamp.")
    as_of = _parse_date(source.get("asOfDate", ""))
    metric_base = _parse_date(config.metric_base_date)
    if as_of is None:
        _add_issue(issues, "as_of_date_invalid", "critical", True, "source_declaration", "source_declaration.json", "asOfDate must be YYYY-MM-DD.")
    elif as_of > config.validation_date:
        _add_issue(issues, "as_of_date_future", "critical", True, "source_declaration", "source_declaration.json", "asOfDate is in the future.")
    elif metric_base and as_of < metric_base:
        _add_issue(issues, "source_data_stale", "critical", True, "source_declaration", "source_declaration.json", "asOfDate is older than metric base date.")
    requested_as_of = _parse_date(str(source.get("requestedAsOfIncluded", "")))
    provider_end = _parse_date(str(source.get("providerDownloadEndExclusive", "")))
    actual_last = _parse_date(str(source.get("actualLastPriceDate", "")))
    source_metric_base = _parse_date(str(source.get("metricBaseDate", "")))
    if any(field in source for field in ["requestedAsOfIncluded", "providerDownloadEndExclusive", "actualLastPriceDate", "metricBaseDate"]):
        if requested_as_of is None or requested_as_of != as_of or requested_as_of != metric_base:
            _add_issue(issues, "requested_as_of_mismatch", "critical", True, "source_declaration", "source_declaration.json", "requestedAsOfIncluded, asOfDate, and metricBaseDate must match.")
        if requested_as_of is None or provider_end != requested_as_of + timedelta(days=1):
            _add_issue(issues, "provider_end_exclusive_invalid", "critical", True, "source_declaration", "source_declaration.json", "providerDownloadEndExclusive must be requestedAsOfIncluded plus one day.")
        if actual_last is None or (requested_as_of is not None and actual_last > requested_as_of):
            _add_issue(issues, "actual_last_price_date_invalid", "critical", True, "source_declaration", "source_declaration.json", "actualLastPriceDate must be present and not later than requestedAsOfIncluded.")
        if source_metric_base != metric_base:
            _add_issue(issues, "metric_base_date_mismatch", "critical", True, "source_declaration", "source_declaration.json", "Source metricBaseDate must match candidate config.")


def _validate_submission_manifest(manifest: Mapping[str, Any], paths: Mapping[str, Path], config: CandidatePackageConfig, issues: list[dict[str, str]]) -> None:
    required = [
        "submissionId",
        "submittedAt",
        "submittedBy",
        "intendedMetricBaseDate",
        "expectedMarketScope",
        "fileInventory",
        "expectedPipelineVersion",
        "expectedNormalizationVersion",
        "expectedCalculationPolicyVersion",
        "notProductionApproval",
    ]
    for field in required:
        if field not in manifest:
            _add_issue(issues, "submission_manifest_missing_field", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", field)
    for field in ["submissionId", "submittedBy"]:
        if not _non_empty_string(manifest.get(field)):
            _add_issue(issues, "submission_manifest_empty_field", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", f"{field} must be non-empty.")
    if manifest.get("contractVersion") not in {None, SUBMISSION_MANIFEST_CONTRACT_VERSION}:
        _add_issue(issues, "submission_contract_version_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Unsupported submission manifest contract.")
    if manifest.get("intendedMetricBaseDate") != config.metric_base_date:
        _add_issue(issues, "metric_base_date_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Metric base date mismatch.")
    if tuple(_normalize_market_scope(manifest.get("expectedMarketScope"))) != config.market_scope:
        _add_issue(issues, "market_scope_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Market scope mismatch.")
    if _parse_timestamp(manifest.get("submittedAt")) is None:
        _add_issue(issues, "submitted_at_invalid", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "submittedAt must be a valid timestamp.")
    if manifest.get("expectedPipelineVersion") != PIPELINE_VERSION:
        _add_issue(issues, "pipeline_version_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Pipeline version mismatch.")
    if manifest.get("expectedNormalizationVersion") != NORMALIZATION_VERSION:
        _add_issue(issues, "normalization_version_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Normalization version mismatch.")
    if manifest.get("expectedCalculationPolicyVersion") != CALCULATION_POLICY_VERSION:
        _add_issue(issues, "calculation_policy_version_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Calculation policy version mismatch.")
    if manifest.get("notProductionApproval") is not True:
        _add_issue(issues, "production_approval_not_allowed", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "notProductionApproval must be true.")

    inventory = manifest.get("fileInventory", [])
    if not isinstance(inventory, list):
        _add_issue(issues, "file_inventory_invalid", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "fileInventory must be a list.")
        return
    seen_roles: set[str] = set()
    for item in inventory:
        role = str(item.get("logicalRole", ""))
        path_text = str(item.get("path", ""))
        if role in seen_roles:
            _add_issue(issues, "duplicate_logical_role", "critical", True, role, path_text, "Duplicate logical role.")
        seen_roles.add(role)
        if role not in REQUIRED_FILE_INVENTORY_ROLES:
            _add_issue(issues, "unknown_file_role", "critical", True, role, path_text, "Unknown logical role.")
            continue
        if not _safe_basename(path_text):
            _add_issue(issues, "unsafe_archive_path", "critical", True, role, path_text, "Unsafe or absolute path.")
            continue
        expected_path = paths[role]
        if Path(path_text).as_posix() != expected_path.name:
            _add_issue(issues, "file_path_mismatch", "critical", True, role, path_text, "Inventory path must match configured candidate file name.")
        if item.get("sha256") != _sha256(expected_path):
            _add_issue(issues, "file_sha256_mismatch", "critical", True, role, path_text, "Inventory SHA-256 mismatch.")
        if item.get("byteSize") != _byte_size(expected_path):
            _add_issue(issues, "file_byte_size_mismatch", "critical", True, role, path_text, "Inventory byte size mismatch.")
    missing_roles = sorted(REQUIRED_FILE_INVENTORY_ROLES.difference(seen_roles))
    for role in missing_roles:
        _add_issue(issues, "missing_file_inventory_role", "critical", True, role, "", "Required logical role missing from fileInventory.")


def _validate_fixture_reclassification(paths: Mapping[str, Path], issues: list[dict[str, str]]) -> None:
    repo_root = Path(__file__).resolve().parents[2]
    fixture_dir = repo_root / "data" / "fixtures" / "monthly-metrics"
    for role, path in paths.items():
        try:
            resolved = path.resolve()
            if fixture_dir in resolved.parents:
                _add_issue(issues, "fixture_file_reclassified", "critical", True, role, path.name, "Committed fixture files cannot be candidate inputs.")
        except OSError:
            pass
        fixture_path = fixture_dir / path.name
        if fixture_path.exists() and path.exists() and _sha256(fixture_path) == _sha256(path):
            _add_issue(issues, "fixture_file_reclassified", "critical", True, role, path.name, "Committed fixture file hash cannot be reclassified as candidate input.")


def _validate_candidate_csv(rows: list[dict[str, str]], config: CandidatePackageConfig, issues: list[dict[str, str]]) -> None:
    if rows:
        for error in _validate_candidates(rows, config):
            _add_issue(issues, "candidate_asset_master_invalid", "critical", True, "candidate_asset_master", config.candidate_asset_master_file, error)
    elif not any(issue["logicalRole"] == "candidate_asset_master" for issue in issues):
        _add_issue(issues, "candidate_asset_master_missing", "critical", True, "candidate_asset_master", config.candidate_asset_master_file, "Candidate asset master is empty.")
    if rows and sorted(set(CANDIDATE_COLUMNS).difference(rows[0])):
        return
    seen: set[tuple[str, str]] = set()
    for row in rows:
        key = (row.get("market", ""), row.get("ticker", ""))
        if key in seen:
            _add_issue(issues, "duplicate_market_ticker", "critical", True, "candidate_asset_master", config.candidate_asset_master_file, f"Duplicate asset {key}.")
        seen.add(key)
        if row.get("market", "") not in config.market_scope:
            _add_issue(issues, "candidate_market_scope_mismatch", "critical", True, "candidate_asset_master", config.candidate_asset_master_file, f"Candidate market outside configured scope: {row.get('market', '')}.")
        if not row.get("benchmarkKey"):
            _add_issue(
                issues,
                "candidate_asset_master_invalid",
                "warning" if config.internal_preview_review_only else "critical",
                not config.internal_preview_review_only,
                "candidate_asset_master",
                config.candidate_asset_master_file,
                "Missing benchmarkKey; asset remains in internal Preview review output.",
            )


def _validate_benchmark_contract(
    candidates: list[dict[str, str]],
    benchmark_map: Mapping[str, tuple[str, str]],
    config: CandidatePackageConfig,
    issues: list[dict[str, str]],
) -> None:
    for candidate in candidates:
        benchmark_key = candidate.get("benchmarkKey", "")
        if not benchmark_key:
            continue
        if benchmark_key not in benchmark_map:
            _add_issue(issues, "benchmark_key_missing", "critical", True, "benchmark_map", config.benchmark_map_file, f"Missing benchmarkKey {benchmark_key}.")
            continue
        benchmark_market, benchmark_ticker = benchmark_map[benchmark_key]
        if benchmark_market not in config.market_scope:
            _add_issue(issues, "benchmark_market_scope_mismatch", "critical", True, "benchmark_map", config.benchmark_map_file, f"Benchmark market outside configured scope: {benchmark_market}.")
        if not benchmark_ticker:
            _add_issue(issues, "benchmark_ticker_identity_invalid", "critical", True, "benchmark_map", config.benchmark_map_file, "Benchmark ticker is empty.")


def _validate_raw_daily_candidate_rows(rows: list[dict[str, str]], config: CandidatePackageConfig, source: Mapping[str, Any], issues: list[dict[str, str]]) -> None:
    if not rows:
        _add_issue(issues, "raw_daily_missing", "critical", True, "raw_daily_price", config.raw_daily_price_file, "Raw daily price CSV is empty.")
        return
    missing = sorted(set(RAW_DAILY_PRICE_COLUMNS).difference(rows[0]))
    for column in missing:
        _add_issue(issues, "raw_daily_schema_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"Missing column {column}.")
    if missing:
        return
    seen: set[tuple[str, str, str]] = set()
    for row in rows:
        market = row.get("market", "")
        ticker = row.get("ticker", "")
        date_text = row.get("date", "")
        key = (market, ticker, date_text)
        if key in seen:
            _add_issue(issues, "duplicate_market_ticker_date", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"Duplicate {key}.")
        seen.add(key)
        if market not in {"US", "KR"}:
            _add_issue(issues, "market_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"Unsupported market {market}.")
        if market not in config.market_scope:
            _add_issue(issues, "raw_market_scope_mismatch", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"Raw row market outside configured scope: {market}.")
        if market == "KR" and not is_valid_kr_candidate_ticker(ticker):
            _add_issue(issues, "ticker_identity_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"KR ticker must preserve six-character uppercase alphanumeric identity: {ticker}.")
        if not ticker or ticker.strip() != ticker:
            _add_issue(issues, "ticker_identity_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, "Ticker must be non-empty and trimmed.")
        if _parse_date(date_text) is None:
            _add_issue(issues, "date_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"Invalid date {date_text}.")
        try:
            if float(row.get("close", "")) <= 0:
                raise ValueError
        except ValueError:
            _add_issue(issues, "price_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, "close must be positive.")
        source_basis = source.get("priceAdjustmentBasis")
        row_basis = row.get("priceAdjustmentBasis")
        mixed_explicit = config.internal_preview_review_only and source_basis == "mixed_explicit"
        if (mixed_explicit and row_basis not in {"raw_close", "split_adjusted", "split_and_dividend_adjusted", "total_return_adjusted"}) or (
            not mixed_explicit and row_basis != source_basis
        ):
            _add_issue(issues, "price_adjustment_basis_mismatch", "critical", True, "raw_daily_price", config.raw_daily_price_file, "Row priceAdjustmentBasis must match source declaration.")
        if source.get("currencyMode") in {"KRW", "USD"} and row.get("currency") != source.get("currencyMode"):
            _add_issue(issues, "currency_mismatch", "critical", True, "raw_daily_price", config.raw_daily_price_file, "Row currency must match source currencyMode.")
        if row.get("licenseStatus") != "approved":
            _add_issue(issues, "license_status_invalid", "warning" if config.internal_preview_review_only else "critical", not config.internal_preview_review_only, "raw_daily_price", config.raw_daily_price_file, "licenseStatus is not approved; internal Preview remains review-only.")
        if row.get("internalUseAllowed") != "true":
            _add_issue(issues, "internal_use_not_allowed", "warning" if config.internal_preview_review_only else "critical", not config.internal_preview_review_only, "raw_daily_price", config.raw_daily_price_file, "internalUseAllowed is not approved; internal Preview remains review-only.")
        if row.get("publicationAllowed") != "true":
            _add_issue(issues, "publication_not_allowed", "warning" if config.internal_preview_review_only else "critical", not config.internal_preview_review_only, "raw_daily_price", config.raw_daily_price_file, "publicationAllowed is false; production publication remains blocked.")
        if row.get("publicationEligibility") != "approved":
            _add_issue(issues, "publication_eligibility_invalid", "warning" if config.internal_preview_review_only else "critical", not config.internal_preview_review_only, "raw_daily_price", config.raw_daily_price_file, "publicationEligibility requires review; production publication remains blocked.")
        if row.get("redistributionAllowed") != "true":
            _add_issue(issues, "redistribution_restricted_review_only", "warning", False, "raw_daily_price", config.raw_daily_price_file, "Redistribution is restricted; package remains candidate review-only.")


def _validate_scope_reconciliation(
    config: CandidatePackageConfig,
    source: Mapping[str, Any],
    manifest: Mapping[str, Any],
    candidates: list[dict[str, str]],
    raw_rows: list[dict[str, str]],
    issues: list[dict[str, str]],
) -> None:
    source_scope = tuple(_normalize_market_scope(source.get("marketScope")))
    manifest_scope = tuple(_normalize_market_scope(manifest.get("expectedMarketScope")))
    candidate_scope = tuple(sorted({row.get("market", "") for row in candidates if row.get("market", "")}))
    raw_scope = tuple(sorted({row.get("market", "") for row in raw_rows if row.get("market", "")}))
    expected_sorted = tuple(sorted(config.market_scope))
    for label, scope in [
        ("source_declaration", tuple(sorted(source_scope))),
        ("operator_submission_manifest", tuple(sorted(manifest_scope))),
        ("candidate_asset_master", candidate_scope),
        ("raw_daily_price", raw_scope),
    ]:
        if scope != expected_sorted:
            _add_issue(issues, "market_scope_reconciliation_mismatch", "critical", True, label, "", f"{label} scope {scope} does not match config scope {expected_sorted}.")
    if source.get("operatorId") != manifest.get("submittedBy"):
        _add_issue(issues, "operator_identity_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "submittedBy must match source operatorId.")
    for field in ["requestedAsOfIncluded", "providerDownloadEndExclusive", "actualLastPriceDate", "metricBaseDate"]:
        if field in source and manifest.get(field) != source.get(field):
            _add_issue(issues, "collection_metadata_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", f"{field} must match source declaration.")
    candidate_identities = {(row.get("market", ""), row.get("ticker", "")) for row in candidates}
    raw_identities = {(row.get("market", ""), row.get("ticker", "")) for row in raw_rows}
    missing_candidate_prices = candidate_identities.difference(raw_identities)
    for identity in sorted(missing_candidate_prices):
        _add_issue(
            issues,
            "candidate_raw_identity_missing",
            "warning" if config.internal_preview_review_only else "critical",
            not config.internal_preview_review_only,
            "raw_daily_price",
            "",
            f"No raw rows for candidate {identity[0]}:{identity[1]}; asset remains review-required.",
        )


def _write_candidate_outputs(
    *,
    package_config: CandidatePackageConfig,
    output_paths: Mapping[str, Path],
    input_paths: Mapping[str, Path],
    source_declaration: Mapping[str, Any],
    submission_manifest: Mapping[str, Any],
    candidates: list[dict[str, str]],
    normalized_rows: list[dict[str, str]],
    monthly_return_rows: list[dict[str, str]],
    full_rows: list[dict[str, str]],
    review_rows: list[dict[str, str]],
    source_audit_rows: list[dict[str, str]],
    timeseries_audit_rows: list[dict[str, str]],
    candidate_package_ready: bool,
) -> None:
    _write_candidate_csv(output_paths["normalizedMonthEndCsv"], NORMALIZED_MONTH_END_COLUMNS, normalized_rows)
    _write_candidate_csv(output_paths["monthlyReturnsCsv"], MONTHLY_RETURNS_COLUMNS, monthly_return_rows)
    _write_candidate_csv(output_paths["metricsOutputCsv"], FULL_METRICS_COLUMNS, full_rows)
    selected_rows = [{column: row.get(column, "") for column in SELECTED_COLUMNS} for row in full_rows]
    _write_candidate_csv(output_paths["selectedMetricsCsv"], SELECTED_COLUMNS, selected_rows)
    _write_candidate_csv(output_paths["reviewRequiredCsv"], REVIEW_REQUIRED_COLUMNS, review_rows)
    overlay_rows = _candidate_review_overlay_rows(full_rows, package_config)
    _write_candidate_csv(
        output_paths["usReviewOverlayCsv"],
        REVIEW_OVERLAY_COLUMNS,
        [row for row in overlay_rows if row.get("market") == "US"],
    )
    _write_candidate_csv(
        output_paths["krReviewOverlayCsv"],
        REVIEW_OVERLAY_COLUMNS,
        [row for row in overlay_rows if row.get("market") == "KR"],
    )
    _write_candidate_csv(output_paths["sourceAuditCsv"], SOURCE_AUDIT_COLUMNS, source_audit_rows)
    _write_candidate_csv(output_paths["timeseriesAuditCsv"], TIMESERIES_AUDIT_COLUMNS, timeseries_audit_rows)
    _write_audit_html(output_paths["auditHtml"], source_audit_rows, candidate_package_ready, package_config.validation_date)

    input_inventory = [
        _input_inventory_item(role, path)
        for role, path in sorted(input_paths.items())
    ]
    output_inventory_paths = [
        output_paths["normalizedMonthEndCsv"],
        output_paths["monthlyReturnsCsv"],
        output_paths["metricsOutputCsv"],
        output_paths["selectedMetricsCsv"],
        output_paths["reviewRequiredCsv"],
        output_paths["usReviewOverlayCsv"],
        output_paths["krReviewOverlayCsv"],
        output_paths["sourceAuditCsv"],
        output_paths["timeseriesAuditCsv"],
        output_paths["auditHtml"],
    ]
    output_inventory = [
        {
            "artifactType": "output",
            "logicalRole": path.stem,
            "path": path.name,
            "exists": "true",
            "sha256": _sha256(path),
            "byteSize": str(_byte_size(path)),
            "rowCount": str(_row_count_csv(path) if path.suffix == ".csv" else ""),
        }
        for path in output_inventory_paths
    ]
    _write_candidate_csv(output_paths["hashInventoryCsv"], HASH_INVENTORY_COLUMNS, input_inventory + output_inventory)

    blocking_count = len([issue for issue in source_audit_rows if issue["blocksCandidate"] == "true"])
    warning_count = len(source_audit_rows) - blocking_count
    base_manifest = {
        "candidatePackageId": _candidate_package_id(source_declaration, submission_manifest, package_config),
        "candidatePackageHash": "",
        "contractVersion": CANDIDATE_PACKAGE_CONTRACT_VERSION,
        "candidatePackageVersion": CANDIDATE_PACKAGE_VERSION,
        "metricBaseDate": package_config.metric_base_date,
        "requestedAsOfIncluded": source_declaration.get("requestedAsOfIncluded", package_config.metric_base_date),
        "providerDownloadEndExclusive": source_declaration.get("providerDownloadEndExclusive", ""),
        "actualLastPriceDate": source_declaration.get("actualLastPriceDate", ""),
        "validationDate": package_config.validation_date.isoformat(),
        "pipelineVersion": PIPELINE_VERSION,
        "normalizationVersion": NORMALIZATION_VERSION,
        "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
        "sourceDeclarationHash": _sha256_if_exists(input_paths["source_declaration"]),
        "submissionManifestHash": _sha256_if_exists(input_paths["operator_submission_manifest"]),
        "inputHashes": {item["logicalRole"]: item["sha256"] for item in input_inventory},
        "outputHashes": {item["path"]: item["sha256"] for item in output_inventory},
        "inputRowReconciliation": {
            "candidateAssetRows": len(candidates),
            "rawDailyRows": _row_count_csv(input_paths["raw_daily_price"]),
            "normalizedMonthEndRows": len(normalized_rows),
            "monthlyReturnRows": len(monthly_return_rows),
            "metricsOutputRows": len(full_rows),
            "marketTickerIdentityCount": len({(row.get("market", ""), row.get("ticker", "")) for row in normalized_rows}),
        },
        "marketTickerDateCoverage": _coverage(normalized_rows),
        "blockingIssueCount": blocking_count,
        "warningIssueCount": warning_count,
        "fixturePackageReady": False,
        "candidatePackageReady": candidate_package_ready,
        "productionPublishReady": False,
        "appExportApproved": False,
        "internalPreviewReviewOnly": package_config.internal_preview_review_only,
        "externalProviderCalls": False,
        "sourceKind": source_declaration.get("sourceKind", ""),
        "sourceName": source_declaration.get("sourceName", ""),
        "sourceDeclaration": {
            "marketScope": source_declaration.get("marketScope", []),
            "timezone": source_declaration.get("timezone", ""),
            "currencyMode": source_declaration.get("currencyMode", ""),
            "returnBasis": source_declaration.get("returnBasis", ""),
            "priceAdjustmentBasis": source_declaration.get("priceAdjustmentBasis", ""),
            "requestedAsOfIncluded": source_declaration.get("requestedAsOfIncluded", ""),
            "providerDownloadEndExclusive": source_declaration.get("providerDownloadEndExclusive", ""),
            "actualLastPriceDate": source_declaration.get("actualLastPriceDate", ""),
            "metricBaseDate": source_declaration.get("metricBaseDate", ""),
            "redistributionReviewStatus": source_declaration.get("redistributionReviewStatus", ""),
            "appUseReviewStatus": source_declaration.get("appUseReviewStatus", ""),
            "fixtureOnly": source_declaration.get("fixtureOnly", None),
            "testOnly": source_declaration.get("testOnly", None),
        },
        "candidateReviewRestrictions": _candidate_review_restrictions(source_audit_rows),
    }
    output_paths["manifestJson"].write_text(json.dumps(base_manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    readiness = {
        "candidatePackageId": base_manifest["candidatePackageId"],
        "candidatePackageHash": "",
        "fixturePackageReady": False,
        "candidatePackageReady": candidate_package_ready,
        "productionPublishReady": False,
        "appExportApproved": False,
        "internalPreviewReviewOnly": package_config.internal_preview_review_only,
        "blockingIssueCount": blocking_count,
        "warningIssueCount": warning_count,
        "notProductionApproval": True,
        "validationDate": package_config.validation_date.isoformat(),
    }
    output_paths["readinessJson"].write_text(json.dumps(readiness, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    package_index = _build_package_index(output_paths)
    package_hash = _stable_hash({key: value for key, value in package_index.items() if key != "candidatePackageHash"})
    base_manifest["candidatePackageHash"] = package_hash
    readiness["candidatePackageHash"] = package_hash
    output_paths["manifestJson"].write_text(json.dumps(base_manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    output_paths["readinessJson"].write_text(json.dumps(readiness, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    package_index = _build_package_index(output_paths)
    package_hash = _stable_hash({key: value for key, value in package_index.items() if key != "candidatePackageHash"})
    base_manifest["candidatePackageHash"] = package_hash
    readiness["candidatePackageHash"] = package_hash
    output_paths["manifestJson"].write_text(json.dumps(base_manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    output_paths["readinessJson"].write_text(json.dumps(readiness, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    package_index = _build_package_index(output_paths)
    package_index["candidatePackageHash"] = package_hash
    output_paths["packageIndexJson"].write_text(json.dumps(package_index, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    write_deterministic_zip(
        output_paths["zipPackage"],
        [
            output_paths["manifestJson"],
            output_paths["readinessJson"],
            output_paths["normalizedMonthEndCsv"],
            output_paths["monthlyReturnsCsv"],
            output_paths["metricsOutputCsv"],
            output_paths["selectedMetricsCsv"],
            output_paths["reviewRequiredCsv"],
            output_paths["usReviewOverlayCsv"],
            output_paths["krReviewOverlayCsv"],
            output_paths["sourceAuditCsv"],
            output_paths["timeseriesAuditCsv"],
            output_paths["auditHtml"],
            output_paths["hashInventoryCsv"],
            output_paths["packageIndexJson"],
        ],
    )


def _candidate_review_overlay_rows(
    full_rows: list[dict[str, str]],
    config: CandidatePackageConfig,
) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in sorted(full_rows, key=lambda item: (item.get("market", ""), item.get("ticker", ""))):
        review_reason = row.get("reviewReason", "")
        candidate_note = "Step 114-2Y internal Preview candidate; production publication and app export remain blocked."
        review_reason = f"{review_reason}; {candidate_note}" if review_reason else candidate_note
        rows.append(
            {
                "market": row.get("market", ""),
                "ticker": row.get("ticker", ""),
                "expectedCagr": row.get("selectedCagr", ""),
                "priceCagr10y": row.get("rawPriceCagr10y", ""),
                "mdd": row.get("selectedMdd", ""),
                "beta": row.get("selectedBeta", ""),
                "dataYears": row.get("dataYears", ""),
                "benchmarkTicker": row.get("benchmarkTicker", ""),
                "metricsStatus": "review_only",
                "metricsSource": f"step114-2y_candidate:{PIPELINE_VERSION}",
                "reviewReason": review_reason,
                "metricBaseDate": config.metric_base_date,
                "reviewOverlayDate": config.validation_date.isoformat(),
                "overlayStatus": "internal_preview_review_only",
                "fixturePackageReady": "false",
                "productionPublishReady": "false",
                "appExportApproved": "false",
                "selectedCagr": row.get("selectedCagr", ""),
                "rawPriceCagr10y": row.get("rawPriceCagr10y", ""),
                "rollingCagr10yMedian": row.get("rollingCagr10yMedian", ""),
                "rollingCagr10yP25": row.get("rollingCagr10yP25", ""),
                "rollingCagr10yP75": row.get("rollingCagr10yP75", ""),
                "validRollingWindowCount10y": row.get("validRollingWindowCount10y", ""),
                "rollingCagr5yMedian": row.get("rollingCagr5yMedian", ""),
                "rollingCagr5yP25": row.get("rollingCagr5yP25", ""),
                "rollingCagr5yP75": row.get("rollingCagr5yP75", ""),
                "validRollingWindowCount5y": row.get("validRollingWindowCount5y", ""),
                "selectedMdd": row.get("selectedMdd", ""),
                "mddFullPeriod": row.get("mddFullPeriod", ""),
                "selectedBeta": row.get("selectedBeta", ""),
                "dividendYield": row.get("dividendYield", ""),
                "dividendStatus": row.get("dividendStatus", ""),
                "dataStatus": row.get("dataStatus", ""),
                "reviewFlag": "review_required",
                "cagrPolicy": row.get("cagrPolicy", ""),
                "normalizationPolicy": row.get("normalizationPolicy", ""),
                "sourcePolicy": row.get("sourcePolicy", ""),
                "sourceHash": row.get("sourceHash", ""),
                "rawSourceSha256": row.get("rawSourceSha256", ""),
                "normalizationVersion": row.get("normalizationVersion", ""),
                "normalizedSeriesHash": row.get("normalizedSeriesHash", ""),
                "rollingMetricVersion": row.get("rollingMetricVersion", ""),
                "notes": row.get("notes", ""),
            }
        )
    return rows


def _write_audit_html(path: Path, issues: list[dict[str, str]], candidate_ready: bool, validation_date: date) -> None:
    rows = "\n".join(
        "<tr>"
        f"<td>{html.escape(issue['issueType'])}</td>"
        f"<td>{html.escape(issue['severity'])}</td>"
        f"<td>{html.escape(issue['blocksCandidate'])}</td>"
        f"<td>{html.escape(issue['logicalRole'])}</td>"
        f"<td>{html.escape(issue['reviewReason'])}</td>"
        "</tr>"
        for issue in issues
    )
    content = (
        "<!doctype html><html><head><meta charset=\"utf-8\"><title>FINPLE Step 114-2M Candidate Audit</title></head>"
        "<body><h1>FINPLE Step 114-2M Candidate Audit</h1>"
        f"<p>candidatePackageReady={str(candidate_ready).lower()}</p>"
        f"<p>validationDate={html.escape(validation_date.isoformat())}</p>"
        "<p>productionPublishReady=false; appExportApproved=false</p>"
        "<table><thead><tr><th>Issue</th><th>Severity</th><th>Blocks</th><th>Role</th><th>Reason</th></tr></thead>"
        f"<tbody>{rows}</tbody></table></body></html>\n"
    )
    path.write_text(content, encoding="utf-8")


def _write_candidate_csv(path: Path, columns: list[str], rows: Iterable[Mapping[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def _input_inventory_item(role: str, path: Path) -> dict[str, str]:
    exists = path.exists()
    return {
        "artifactType": "input",
        "logicalRole": role,
        "path": path.name,
        "exists": "true" if exists else "false",
        "sha256": _sha256(path) if exists else "",
        "byteSize": str(_byte_size(path) if exists else -1),
        "rowCount": str(_row_count_for_role(role, path) if exists else 0),
    }


def _sha256_if_exists(path: Path) -> str:
    return _sha256(path) if path.exists() else ""


def _build_package_index(output_paths: Mapping[str, Path]) -> dict[str, Any]:
    member_paths = [
        output_paths["manifestJson"],
        output_paths["readinessJson"],
        output_paths["normalizedMonthEndCsv"],
        output_paths["monthlyReturnsCsv"],
        output_paths["metricsOutputCsv"],
        output_paths["selectedMetricsCsv"],
        output_paths["reviewRequiredCsv"],
        output_paths["usReviewOverlayCsv"],
        output_paths["krReviewOverlayCsv"],
        output_paths["sourceAuditCsv"],
        output_paths["timeseriesAuditCsv"],
        output_paths["auditHtml"],
        output_paths["hashInventoryCsv"],
    ]
    exclusions = {
        output_paths["manifestJson"].name: ["candidatePackageHash"],
        output_paths["readinessJson"].name: ["candidatePackageHash"],
    }
    members = []
    for path in member_paths:
        excluded_fields = exclusions.get(path.name, [])
        members.append(
            {
                "path": path.name,
                "sha256": _artifact_hash_for_index(path, excluded_fields),
                "byteSize": str(_byte_size(path)),
                "hashExcludesJsonFields": excluded_fields,
            }
        )
    return {
        "contractVersion": FINAL_PACKAGE_INDEX_CONTRACT_VERSION,
        "candidatePackageHash": "",
        "hashAlgorithm": "sha256-json-canonical",
        "zipMemberHashAlgorithm": "sha256-file-or-json-with-explicit-field-exclusion",
        "selfExcludedIndexFile": output_paths["packageIndexJson"].name,
        "selfExclusionReason": "candidatePackageHash and package index identity are self-referential; index hash excludes candidatePackageHash and ZIP member set excludes the index hash from itself.",
        "members": members,
    }


def _artifact_hash_for_index(path: Path, excluded_fields: list[str]) -> str:
    if not excluded_fields:
        return _sha256(path)
    payload = json.loads(path.read_text(encoding="utf-8"))
    for field in excluded_fields:
        if isinstance(payload, dict) and field in payload:
            payload[field] = ""
    return _stable_hash(payload)


def _candidate_package_verification_evidence(
    *,
    ok: bool,
    issues: list[str],
    zip_package_sha256: str = "",
    candidate_package_hash: str = "",
    package_index_file: str = "",
) -> dict[str, Any]:
    return {
        "contractVersion": CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
        "ok": ok,
        "issues": issues,
        "zipPackageSha256": zip_package_sha256,
        "candidatePackageHash": candidate_package_hash,
        "packageIndexFile": package_index_file,
    }


def verify_candidate_package(zip_path: str | Path) -> dict[str, Any]:
    """Verify exact ZIP member set and final package index hashes."""
    package_path = Path(zip_path)
    issues: list[str] = []
    zip_package_sha256 = ""
    candidate_package_hash = ""
    package_index_file = ""
    try:
        zip_package_sha256 = _sha256(package_path)
        with zipfile.ZipFile(package_path) as archive:
            names = sorted(archive.namelist())
            index_names = [name for name in names if name.startswith("finple_candidate_package_index_") and name.endswith(".json")]
            if len(index_names) != 1:
                return _candidate_package_verification_evidence(
                    ok=False,
                    issues=["package_index_missing_or_duplicate"],
                    zip_package_sha256=zip_package_sha256,
                )
            index_name = index_names[0]
            package_index_file = index_name
            package_index = json.loads(archive.read(index_name).decode("utf-8"))
            index_for_hash = dict(package_index)
            expected_hash = index_for_hash.pop("candidatePackageHash", "")
            candidate_package_hash = expected_hash
            actual_hash = _stable_hash(index_for_hash)
            if expected_hash != actual_hash:
                issues.append("candidate_package_hash_mismatch")
            expected_members = sorted([member["path"] for member in package_index.get("members", [])] + [index_name])
            if names != expected_members:
                issues.append("zip_member_set_mismatch")
            for member in package_index.get("members", []):
                member_name = member.get("path", "")
                if member_name not in names:
                    issues.append(f"zip_member_missing:{member_name}")
                    continue
                data = archive.read(member_name)
                excluded_fields = member.get("hashExcludesJsonFields", [])
                if excluded_fields:
                    payload = json.loads(data.decode("utf-8"))
                    for field in excluded_fields:
                        if isinstance(payload, dict) and field in payload:
                            payload[field] = ""
                    digest = _stable_hash(payload)
                else:
                    digest = hashlib.sha256(data).hexdigest()
                if digest != member.get("sha256"):
                    issues.append(f"zip_member_hash_mismatch:{member_name}")
    except Exception as exc:  # noqa: BLE001 - verifier reports deterministic failure.
        return _candidate_package_verification_evidence(
            ok=False,
            issues=[f"package_verification_failed:{exc}"],
            zip_package_sha256=zip_package_sha256,
        )
    return _candidate_package_verification_evidence(
        ok=not issues,
        issues=issues,
        zip_package_sha256=zip_package_sha256,
        candidate_package_hash=candidate_package_hash,
        package_index_file=package_index_file,
    )


def _candidate_package_id(source: Mapping[str, Any], submission: Mapping[str, Any], config: CandidatePackageConfig) -> str:
    seed = {
        "submissionId": submission.get("submissionId", ""),
        "sourceName": source.get("sourceName", ""),
        "metricBaseDate": config.metric_base_date,
        "version": CANDIDATE_PACKAGE_VERSION,
    }
    return f"finple-candidate-{_stable_hash(seed)[:16]}"


def _group_prices_by_identity(rows: list[dict[str, str]]) -> dict[tuple[str, str], list[dict[str, str]]]:
    grouped: dict[tuple[str, str], list[dict[str, str]]] = {}
    for row in rows:
        grouped.setdefault((row["market"], row["ticker"]), []).append(row)
    for identity in grouped:
        grouped[identity].sort(key=lambda row: row["month"])
    return grouped


def _hash_price_rows_by_identity(rows: list[dict[str, str]]) -> dict[tuple[str, str], str]:
    grouped = _group_prices_by_identity(rows)
    hashes: dict[tuple[str, str], str] = {}
    for identity, identity_rows in grouped.items():
        payload = json.dumps(identity_rows, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        hashes[identity] = hashlib.sha256(payload).hexdigest()
    return hashes


def _coverage(rows: list[dict[str, str]]) -> dict[str, Any]:
    by_series: dict[str, list[str]] = {}
    for row in rows:
        by_series.setdefault(f"{row.get('market')}:{row.get('ticker')}", []).append(row.get("month", ""))
    return {
        key: {
            "start": min(months) if months else "",
            "end": max(months) if months else "",
            "monthCount": len(months),
        }
        for key, months in sorted(by_series.items())
    }


def _candidate_review_restrictions(issues: list[dict[str, str]]) -> list[dict[str, str]]:
    return [
        {
            "issueType": issue["issueType"],
            "logicalRole": issue["logicalRole"],
            "reviewReason": issue["reviewReason"],
        }
        for issue in issues
        if issue["blocksCandidate"] == "false" and "restricted" in issue["issueType"]
    ]


def _add_issue(
    issues: list[dict[str, str]],
    issue_type: str,
    severity: str,
    blocks: bool,
    logical_role: str,
    path: str,
    reason: str,
) -> None:
    issue = {
        "issueType": issue_type,
        "severity": severity,
        "blocksCandidate": "true" if blocks else "false",
        "logicalRole": logical_role,
        "path": path,
        "reviewReason": reason,
    }
    if issue not in issues:
        issues.append(issue)


def _has_blocking_issues(issues: Iterable[Mapping[str, str]]) -> bool:
    return any(issue.get("blocksCandidate") == "true" for issue in issues)


def _safe_basename(value: str) -> bool:
    if not value or "\\" in value or "/" in value:
        return False
    path = Path(value)
    return not path.is_absolute() and ".." not in path.parts and path.name == value and bool(SAFE_BASENAME_PATTERN.fullmatch(value))


def _safe_file_name_or_placeholder(value: str, role: str) -> str:
    return value if _safe_basename(value) else f"invalid_{role}"


def _safe_output_version_or_placeholder(value: str) -> str:
    return value if SAFE_OUTPUT_VERSION_PATTERN.fullmatch(value) else "invalid_output_version"


def _safe_relative_path(value: str) -> bool:
    if not value or "\\" in value:
        return False
    path = Path(value)
    return not path.is_absolute() and ".." not in path.parts and value == path.as_posix()


def _source_text_contains_marker(source: Mapping[str, Any], markers: set[str]) -> bool:
    values = [
        source.get("sourceName", ""),
        source.get("sourceUrl", ""),
        source.get("sourceReference", ""),
        source.get("operatorId", ""),
    ]
    lowered = " ".join(str(value).lower() for value in values)
    return any(marker in lowered for marker in markers)


def _non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip()) and value == value.strip()


def _normalize_market_scope(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(market).upper() for market in value]


def _parse_date(value: Any) -> date | None:
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except ValueError:
        return None


def _parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        text = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(text)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def _stable_hash(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _byte_size(path: Path) -> int:
    return path.stat().st_size if path.exists() else -1


def _row_count_csv(path: Path) -> int:
    if not path.exists() or path.suffix.lower() != ".csv":
        return 0
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return sum(1 for _ in csv.DictReader(handle))


def _row_count_for_role(role: str, path: Path) -> int:
    if role in {"candidate_asset_master", "benchmark_map", "raw_daily_price"}:
        return _row_count_csv(path)
    return 1 if path.exists() else 0
