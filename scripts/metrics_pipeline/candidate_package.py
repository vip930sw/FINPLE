from __future__ import annotations

import csv
import hashlib
import html
import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any, Iterable, Mapping

from .config import CALCULATION_POLICY_VERSION, PIPELINE_VERSION
from .package import write_deterministic_zip
from .pipeline import (
    _build_candidate_outputs,
    _group_prices,
    _hash_price_rows,
    _normalized_metric_rows,
    _read_benchmark_map,
    _read_csv,
    _sha256,
    _validate_candidates,
    _validate_metric_output_rows,
    _write_csv,
)
from .schemas import (
    CANDIDATE_COLUMNS,
    FULL_METRICS_COLUMNS,
    MONTHLY_RETURNS_COLUMNS,
    NORMALIZED_MONTH_END_COLUMNS,
    RAW_DAILY_PRICE_COLUMNS,
    REVIEW_REQUIRED_COLUMNS,
    TIMESERIES_AUDIT_COLUMNS,
)
from .timeseries import NORMALIZATION_VERSION, normalize_daily_price_rows


CANDIDATE_PACKAGE_CONTRACT_VERSION = "production-candidate-package-v1-step114-2m"
CANDIDATE_PACKAGE_VERSION = "candidate-package-v1-step114-2m"
SOURCE_DECLARATION_CONTRACT_VERSION = "source-declaration-v1-step114-2m"
SUBMISSION_MANIFEST_CONTRACT_VERSION = "operator-submission-manifest-v1-step114-2m"
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
HASH_INVENTORY_COLUMNS = [
    "artifactType",
    "logicalRole",
    "path",
    "sha256",
    "byteSize",
    "rowCount",
]


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
    returns productionPublishReady/appExportApproved=true.
    """
    if not config:
        return _idle_result(["candidate inputs missing"])
    package_config = _load_candidate_config(config)
    if package_config.input_mode != "manual_upload_candidate":
        return _idle_result(["candidate mode not explicitly selected"])

    package_config.output_dir.mkdir(parents=True, exist_ok=True)
    paths = _input_paths(package_config)
    issues: list[dict[str, str]] = []
    missing_roles = [role for role, path in paths.items() if not path.exists()]
    for role in missing_roles:
        _add_issue(issues, "missing_input", "critical", True, role, paths[role].name, "Required candidate input is missing.")
    _validate_fixture_reclassification(paths, issues)
    if missing_roles:
        return _blocked_result(package_config, paths, issues)

    source_declaration = _read_json(paths["source_declaration"], issues, "source_declaration")
    submission_manifest = _read_json(paths["operator_submission_manifest"], issues, "operator_submission_manifest")
    _validate_source_declaration(source_declaration, paths, package_config, issues)
    _validate_submission_manifest(submission_manifest, paths, package_config, issues)

    candidates = _safe_read_csv(paths["candidate_asset_master"], issues, "candidate_asset_master")
    benchmark_map = _safe_read_benchmark_map(paths["benchmark_map"], issues)
    raw_daily_rows = _safe_read_csv(paths["raw_daily_price"], issues, "raw_daily_price")
    _validate_candidate_csv(candidates, package_config, issues)
    _validate_raw_daily_candidate_rows(raw_daily_rows, package_config, source_declaration, issues)

    source_sha = _sha256(paths["raw_daily_price"])
    normalized = normalize_daily_price_rows(
        raw_daily_rows,
        source_file_name=paths["raw_daily_price"].name,
        source_sha256=source_sha,
    )
    normalized_rows = list(normalized["normalizedRows"])
    timeseries_audit_rows = list(normalized["auditRows"])
    for row in timeseries_audit_rows:
        if row.get("blocksPublication") == "true":
            _add_issue(
                issues,
                row.get("issueType", "timeseries_block"),
                row.get("severity", "critical"),
                True,
                "raw_daily_price",
                paths["raw_daily_price"].name,
                row.get("reviewReason", "Time-series normalization blocked this candidate."),
            )

    normalized_metric_rows = _normalized_metric_rows(normalized_rows)
    normalized_hash_by_ticker = _hash_price_rows(normalized_metric_rows)
    prices_by_ticker = _group_prices(normalized_metric_rows)
    full_rows: list[dict[str, str]] = []
    review_rows: list[dict[str, str]] = []
    monthly_return_rows: list[dict[str, str]] = []
    for candidate in sorted(candidates, key=lambda row: (row.get("market", ""), row.get("ticker", ""))):
        if candidate.get("market", "") not in package_config.market_scope:
            continue
        metrics_row, candidate_review_rows, candidate_returns = _build_candidate_outputs(
            candidate=candidate,
            config=package_config,
            prices=prices_by_ticker.get(candidate["ticker"], []),
            benchmark_ticker=benchmark_map.get(candidate["benchmarkKey"], ""),
            benchmark_prices=prices_by_ticker.get(benchmark_map.get(candidate["benchmarkKey"], ""), []),
            source_hash=normalized_hash_by_ticker.get(candidate["ticker"], ""),
            raw_source_sha256=source_sha,
        )
        metrics_row["sourcePolicy"] = "manual_operator_upload_candidate_review_only"
        if metrics_row.get("betaPolicy") == "fixture_aligned_monthly_returns":
            metrics_row["betaPolicy"] = "candidate_aligned_monthly_returns"
        metrics_row["notes"] = "Step 114-2M offline production data candidate; review-only and not app-export-approved."
        for return_row in candidate_returns:
            return_row["dataStatus"] = return_row.get("dataStatus", "").replace("fixture", "candidate")
        full_rows.append(metrics_row)
        review_rows.extend(candidate_review_rows)
        monthly_return_rows.extend(candidate_returns)

    for error in _validate_metric_output_rows(full_rows):
        _add_issue(issues, "metrics_output_invalid", "critical", True, "metrics_output", "", error)

    blocking_issues = [issue for issue in issues if issue["blocksCandidate"] == "true"]
    output_paths = _output_paths(package_config)
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

    package_hash = _sha256(output_paths["zipPackage"])
    readiness = _read_json(output_paths["readinessJson"], [], "readiness")
    candidate_package_hash = readiness.get("candidatePackageHash", "")
    return {
        "ok": not blocking_issues,
        "status": "ready" if not blocking_issues else "blocked",
        "fixturePackageReady": False,
        "candidatePackageReady": not blocking_issues,
        "productionPublishReady": False,
        "appExportApproved": False,
        "blockingIssueCount": len(blocking_issues),
        "warningIssueCount": len(issues) - len(blocking_issues),
        "candidatePackageHash": candidate_package_hash,
        "zipPackageSha256": package_hash,
        "candidatePackageId": readiness.get("candidatePackageId", ""),
        "outputs": {key: str(path) for key, path in output_paths.items()},
        "issues": issues,
    }


def _load_candidate_config(config: Mapping[str, Any]) -> CandidatePackageConfig:
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
        "blockingIssueCount": len([issue for issue in issues if issue["blocksCandidate"] == "true"]),
        "warningIssueCount": 0,
        "issues": issues,
        "outputs": {role: str(path) for role, path in sorted(paths.items())},
        "metricBaseDate": config.metric_base_date,
    }


def _input_paths(config: CandidatePackageConfig) -> dict[str, Path]:
    return {
        "candidate_asset_master": config.input_dir / config.candidate_asset_master_file,
        "benchmark_map": config.input_dir / config.benchmark_map_file,
        "raw_daily_price": config.input_dir / config.raw_daily_price_file,
        "source_declaration": config.input_dir / config.source_declaration_file,
        "operator_submission_manifest": config.input_dir / config.operator_submission_manifest_file,
    }


def _output_paths(config: CandidatePackageConfig) -> dict[str, Path]:
    version = config.output_version
    return {
        "manifestJson": config.output_dir / f"finple_candidate_manifest_{version}.json",
        "readinessJson": config.output_dir / f"finple_candidate_readiness_{version}.json",
        "normalizedMonthEndCsv": config.output_dir / f"finple_candidate_normalized_month_end_{version}.csv",
        "monthlyReturnsCsv": config.output_dir / f"finple_candidate_monthly_returns_{version}.csv",
        "metricsOutputCsv": config.output_dir / f"finple_candidate_metrics_output_{version}.csv",
        "reviewRequiredCsv": config.output_dir / f"finple_candidate_review_required_{version}.csv",
        "sourceAuditCsv": config.output_dir / f"finple_candidate_source_audit_{version}.csv",
        "timeseriesAuditCsv": config.output_dir / f"finple_candidate_timeseries_audit_{version}.csv",
        "auditHtml": config.output_dir / f"finple_candidate_audit_{version}.html",
        "hashInventoryCsv": config.output_dir / f"finple_candidate_hash_inventory_{version}.csv",
        "zipPackage": config.output_dir / f"finple_production_candidate_{version}.zip",
    }


def _read_json(path: Path, issues: list[dict[str, str]], role: str) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - fail-closed parser boundary.
        _add_issue(issues, "malformed_json", "critical", True, role, path.name, str(exc))
        return {}


def _safe_read_csv(path: Path, issues: list[dict[str, str]], role: str) -> list[dict[str, str]]:
    try:
        return _read_csv(path)
    except Exception as exc:  # noqa: BLE001 - fail-closed parser boundary.
        _add_issue(issues, "malformed_csv", "critical", True, role, path.name, str(exc))
        return []


def _safe_read_benchmark_map(path: Path, issues: list[dict[str, str]]) -> dict[str, str]:
    try:
        return _read_benchmark_map(path)
    except Exception as exc:  # noqa: BLE001
        _add_issue(issues, "malformed_csv", "critical", True, "benchmark_map", path.name, str(exc))
        return {}


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
        _add_issue(issues, "redistribution_review_not_approved", "critical", True, "source_declaration", "source_declaration.json", "Redistribution review is not approved.")
    if source.get("appUseReviewStatus") not in {"approved", "allowed", "reviewed_approved"}:
        _add_issue(issues, "app_use_review_not_approved", "critical", True, "source_declaration", "source_declaration.json", "App-use review is not approved.")
    if source.get("timezone") not in {"Asia/Seoul", "America/New_York", "UTC"}:
        _add_issue(issues, "timezone_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported timezone.")
    if source.get("currencyMode") not in {"KRW", "USD", "mixed"}:
        _add_issue(issues, "currency_mode_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported currencyMode.")
    if source.get("returnBasis") not in {"price_return", "total_return"}:
        _add_issue(issues, "return_basis_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported returnBasis.")
    if source.get("priceAdjustmentBasis") not in {"raw_close", "split_adjusted", "split_and_dividend_adjusted", "total_return_adjusted"}:
        _add_issue(issues, "price_adjustment_basis_unsupported", "critical", True, "source_declaration", "source_declaration.json", "Unsupported priceAdjustmentBasis.")
    as_of = _parse_date(source.get("asOfDate", ""))
    metric_base = _parse_date(config.metric_base_date)
    today = date(2026, 7, 15)
    if as_of is None:
        _add_issue(issues, "as_of_date_invalid", "critical", True, "source_declaration", "source_declaration.json", "asOfDate must be YYYY-MM-DD.")
    elif as_of > today:
        _add_issue(issues, "as_of_date_future", "critical", True, "source_declaration", "source_declaration.json", "asOfDate is in the future.")
    elif metric_base and as_of < metric_base:
        _add_issue(issues, "source_data_stale", "critical", True, "source_declaration", "source_declaration.json", "asOfDate is older than metric base date.")


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
    if manifest.get("contractVersion") not in {None, SUBMISSION_MANIFEST_CONTRACT_VERSION}:
        _add_issue(issues, "submission_contract_version_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Unsupported submission manifest contract.")
    if manifest.get("intendedMetricBaseDate") != config.metric_base_date:
        _add_issue(issues, "metric_base_date_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Metric base date mismatch.")
    if tuple(manifest.get("expectedMarketScope", [])) != config.market_scope:
        _add_issue(issues, "market_scope_mismatch", "critical", True, "operator_submission_manifest", "operator_submission_manifest.json", "Market scope mismatch.")
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
        if not _safe_relative_path(path_text):
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
        if market == "KR" and not (len(ticker) == 6 and ticker.isdigit()):
            _add_issue(issues, "ticker_identity_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"KR ticker must preserve leading zeros: {ticker}.")
        if not ticker or ticker.strip() != ticker:
            _add_issue(issues, "ticker_identity_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, "Ticker must be non-empty and trimmed.")
        if _parse_date(date_text) is None:
            _add_issue(issues, "date_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, f"Invalid date {date_text}.")
        try:
            if float(row.get("close", "")) <= 0:
                raise ValueError
        except ValueError:
            _add_issue(issues, "price_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, "close must be positive.")
        if row.get("priceAdjustmentBasis") != source.get("priceAdjustmentBasis"):
            _add_issue(issues, "price_adjustment_basis_mismatch", "critical", True, "raw_daily_price", config.raw_daily_price_file, "Row priceAdjustmentBasis must match source declaration.")
        if row.get("publicationEligibility") != "approved":
            _add_issue(issues, "publication_eligibility_invalid", "critical", True, "raw_daily_price", config.raw_daily_price_file, "publicationEligibility must be approved.")


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
    _write_csv(output_paths["normalizedMonthEndCsv"], NORMALIZED_MONTH_END_COLUMNS, normalized_rows)
    _write_csv(output_paths["monthlyReturnsCsv"], MONTHLY_RETURNS_COLUMNS, monthly_return_rows)
    _write_csv(output_paths["metricsOutputCsv"], FULL_METRICS_COLUMNS, full_rows)
    _write_csv(output_paths["reviewRequiredCsv"], REVIEW_REQUIRED_COLUMNS, review_rows)
    _write_csv(output_paths["sourceAuditCsv"], SOURCE_AUDIT_COLUMNS, source_audit_rows)
    _write_csv(output_paths["timeseriesAuditCsv"], TIMESERIES_AUDIT_COLUMNS, timeseries_audit_rows)
    _write_audit_html(output_paths["auditHtml"], source_audit_rows, candidate_package_ready)

    input_inventory = [
        {
            "artifactType": "input",
            "logicalRole": role,
            "path": path.name,
            "sha256": _sha256(path),
            "byteSize": str(_byte_size(path)),
            "rowCount": str(_row_count_for_role(role, path)),
        }
        for role, path in sorted(input_paths.items())
    ]
    output_inventory_paths = [
        output_paths["normalizedMonthEndCsv"],
        output_paths["monthlyReturnsCsv"],
        output_paths["metricsOutputCsv"],
        output_paths["reviewRequiredCsv"],
        output_paths["sourceAuditCsv"],
        output_paths["timeseriesAuditCsv"],
        output_paths["auditHtml"],
    ]
    output_inventory = [
        {
            "artifactType": "output",
            "logicalRole": path.stem,
            "path": path.name,
            "sha256": _sha256(path),
            "byteSize": str(_byte_size(path)),
            "rowCount": str(_row_count_csv(path) if path.suffix == ".csv" else ""),
        }
        for path in output_inventory_paths
    ]
    _write_csv(output_paths["hashInventoryCsv"], HASH_INVENTORY_COLUMNS, input_inventory + output_inventory)

    blocking_count = len([issue for issue in source_audit_rows if issue["blocksCandidate"] == "true"])
    warning_count = len(source_audit_rows) - blocking_count
    base_manifest = {
        "candidatePackageId": _candidate_package_id(source_declaration, submission_manifest, package_config),
        "candidatePackageHash": "",
        "contractVersion": CANDIDATE_PACKAGE_CONTRACT_VERSION,
        "candidatePackageVersion": CANDIDATE_PACKAGE_VERSION,
        "metricBaseDate": package_config.metric_base_date,
        "pipelineVersion": PIPELINE_VERSION,
        "normalizationVersion": NORMALIZATION_VERSION,
        "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
        "sourceDeclarationHash": _sha256(input_paths["source_declaration"]),
        "submissionManifestHash": _sha256(input_paths["operator_submission_manifest"]),
        "inputHashes": {item["logicalRole"]: item["sha256"] for item in input_inventory},
        "outputHashes": {item["path"]: item["sha256"] for item in output_inventory},
        "inputRowReconciliation": {
            "candidateAssetRows": len(candidates),
            "rawDailyRows": _row_count_csv(input_paths["raw_daily_price"]),
            "normalizedMonthEndRows": len(normalized_rows),
            "monthlyReturnRows": len(monthly_return_rows),
            "metricsOutputRows": len(full_rows),
        },
        "marketTickerDateCoverage": _coverage(normalized_rows),
        "blockingIssueCount": blocking_count,
        "warningIssueCount": warning_count,
        "fixturePackageReady": False,
        "candidatePackageReady": candidate_package_ready,
        "productionPublishReady": False,
        "appExportApproved": False,
        "externalProviderCalls": False,
        "sourceKind": source_declaration.get("sourceKind", ""),
        "sourceName": source_declaration.get("sourceName", ""),
        "sourceDeclaration": {
            "marketScope": source_declaration.get("marketScope", []),
            "timezone": source_declaration.get("timezone", ""),
            "currencyMode": source_declaration.get("currencyMode", ""),
            "returnBasis": source_declaration.get("returnBasis", ""),
            "priceAdjustmentBasis": source_declaration.get("priceAdjustmentBasis", ""),
            "redistributionReviewStatus": source_declaration.get("redistributionReviewStatus", ""),
            "appUseReviewStatus": source_declaration.get("appUseReviewStatus", ""),
            "fixtureOnly": source_declaration.get("fixtureOnly", None),
            "testOnly": source_declaration.get("testOnly", None),
        },
    }
    base_manifest["candidatePackageHash"] = _stable_hash({key: value for key, value in base_manifest.items() if key != "candidatePackageHash"})
    output_paths["manifestJson"].write_text(json.dumps(base_manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    readiness = {
        "candidatePackageId": base_manifest["candidatePackageId"],
        "candidatePackageHash": base_manifest["candidatePackageHash"],
        "fixturePackageReady": False,
        "candidatePackageReady": candidate_package_ready,
        "productionPublishReady": False,
        "appExportApproved": False,
        "blockingIssueCount": blocking_count,
        "warningIssueCount": warning_count,
        "notProductionApproval": True,
    }
    output_paths["readinessJson"].write_text(json.dumps(readiness, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    write_deterministic_zip(
        output_paths["zipPackage"],
        [
            output_paths["manifestJson"],
            output_paths["readinessJson"],
            output_paths["normalizedMonthEndCsv"],
            output_paths["monthlyReturnsCsv"],
            output_paths["metricsOutputCsv"],
            output_paths["reviewRequiredCsv"],
            output_paths["sourceAuditCsv"],
            output_paths["timeseriesAuditCsv"],
            output_paths["auditHtml"],
            output_paths["hashInventoryCsv"],
        ],
    )


def _write_audit_html(path: Path, issues: list[dict[str, str]], candidate_ready: bool) -> None:
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
        "<p>productionPublishReady=false; appExportApproved=false</p>"
        "<table><thead><tr><th>Issue</th><th>Severity</th><th>Blocks</th><th>Role</th><th>Reason</th></tr></thead>"
        f"<tbody>{rows}</tbody></table></body></html>\n"
    )
    path.write_text(content, encoding="utf-8")


def _candidate_package_id(source: Mapping[str, Any], submission: Mapping[str, Any], config: CandidatePackageConfig) -> str:
    seed = {
        "submissionId": submission.get("submissionId", ""),
        "sourceName": source.get("sourceName", ""),
        "metricBaseDate": config.metric_base_date,
        "version": CANDIDATE_PACKAGE_VERSION,
    }
    return f"finple-candidate-{_stable_hash(seed)[:16]}"


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


def _parse_date(value: Any) -> date | None:
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
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
