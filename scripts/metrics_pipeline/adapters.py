from __future__ import annotations

import csv
import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping

from .schemas import RAW_DAILY_PRICE_COLUMNS


ADAPTER_VERSION = "source-adapter-contract-v1-step114-2c"
SUPPORTED_INPUT_MODES = {"fixture", "manual_upload", "public_source_fixture"}
UNKNOWN_LICENSE_STATUSES = {"", "unknown", "unconfirmed", "review_required"}
PUBLIC_SOURCE_FIXTURE_COLUMNS = [
    "pageNumber",
    "recordId",
    "sourceShape",
    "krMarketCode",
    "krIssueCode",
    "krTradeDate",
    "krClosePrice",
    "krCurrency",
    "krVolume",
    "krSplitFactor",
    "krCashDividend",
    "krProductMarketCode",
    "krProductCode",
    "krProductBaseDate",
    "krProductClosePrice",
    "krProductTotalReturnAdjustedClose",
    "krProductCurrency",
    "krProductVolume",
    "krProductCashDistribution",
    "retrievedAt",
    "licenseStatus",
    "internalUseAllowed",
    "publicationAllowed",
    "redistributionAllowed",
    "providerOrInstitution",
    "priceAdjustmentBasis",
    "publicationEligibility",
]
PROVIDER_SOURCE_SHAPES = {"kr_public_daily_price", "kr_securities_product"}


@dataclass(frozen=True)
class SourceAdapterResult:
    adapterId: str
    adapterVersion: str
    mode: str
    sourceId: str
    sourceFileName: str
    providerOrInstitution: str
    retrievedAt: str
    marketScope: tuple[str, ...]
    inputFormat: str
    rowCount: int
    rawSourceSha256: str
    licenseStatus: str
    internalUseAllowed: bool
    publicationAllowed: bool
    redistributionAllowed: bool
    priceAdjustmentBasis: str
    checkpointId: str
    resumeSupported: bool
    warnings: tuple[str, ...]
    rows: tuple[dict[str, str], ...]
    sourcePath: Path
    rejectedRowCount: int = 0
    retryCount: int = 0
    maxRetryCount: int = 0
    lastStatus: str = "success"
    checkpoint: Mapping[str, Any] | None = None
    sanitizationStatus: str = "passed"

    def public_summary(self) -> dict[str, Any]:
        return {
            "adapterId": self.adapterId,
            "adapterVersion": self.adapterVersion,
            "mode": self.mode,
            "sourceId": self.sourceId,
            "sourceFileName": self.sourceFileName,
            "providerOrInstitution": self.providerOrInstitution,
            "retrievedAt": self.retrievedAt,
            "marketScope": list(self.marketScope),
            "inputFormat": self.inputFormat,
            "rowCount": self.rowCount,
            "acceptedRowCount": len(self.rows),
            "rejectedRowCount": self.rejectedRowCount,
            "rawSourceSha256": self.rawSourceSha256,
            "licenseStatus": self.licenseStatus,
            "internalUseAllowed": self.internalUseAllowed,
            "publicationAllowed": self.publicationAllowed,
            "redistributionAllowed": self.redistributionAllowed,
            "priceAdjustmentBasis": self.priceAdjustmentBasis,
            "checkpointId": self.checkpointId,
            "resumeSupported": self.resumeSupported,
            "retryCount": self.retryCount,
            "maxRetryCount": self.maxRetryCount,
            "lastStatus": self.lastStatus,
            "sanitizationStatus": self.sanitizationStatus,
            "warnings": list(self.warnings),
        }


def run_source_adapter(config: Any) -> SourceAdapterResult:
    mode = str(config.input_mode)
    if mode == "fixture":
        return _run_raw_daily_fixture_adapter(config)
    if mode == "manual_upload":
        return _run_manual_upload_adapter(config)
    if mode == "public_source_fixture":
        return _run_public_source_fixture_adapter(config)
    raise ValueError(f"Unsupported source adapter input_mode: {mode}")


def write_adapter_artifacts(output_dir: Path, output_version: str, result: SourceAdapterResult) -> tuple[Path, Path]:
    summary_path = output_dir / f"finple_source_adapter_summary_{output_version}.json"
    checkpoint_path = output_dir / f"finple_source_adapter_checkpoint_{output_version}.json"
    summary_path.write_text(
        json.dumps(result.public_summary(), ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    checkpoint = result.checkpoint or _default_checkpoint(result)
    checkpoint_path.write_text(
        json.dumps(_sanitize_payload(checkpoint), ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return summary_path, checkpoint_path


def validate_adapter_result(result: SourceAdapterResult) -> list[str]:
    errors: list[str] = []
    if result.inputFormat != "csv":
        errors.append("source adapter inputFormat must be csv")
    if result.internalUseAllowed is not True:
        errors.append("source adapter internalUseAllowed must be true")
    if result.sanitizationStatus != "passed":
        errors.append("source adapter sanitizationStatus must be passed")
    if not result.rows:
        errors.append("source adapter produced no accepted rows")
    if result.licenseStatus in UNKNOWN_LICENSE_STATUSES:
        errors.append(f"source adapter licenseStatus blocks normalization: {result.licenseStatus or 'blank'}")
    missing_columns = sorted(set(RAW_DAILY_PRICE_COLUMNS).difference(result.rows[0] if result.rows else {}))
    if missing_columns:
        errors.append(f"source adapter rows missing required columns: {', '.join(missing_columns)}")
    return errors


def _run_raw_daily_fixture_adapter(config: Any) -> SourceAdapterResult:
    source_path = config.input_dir / config.raw_daily_prices_file
    rows, header_warnings = _read_csv_with_exact_header(source_path, RAW_DAILY_PRICE_COLUMNS)
    return _build_result(
        adapter_id="finple.raw_daily_fixture.v1",
        mode="fixture",
        source_path=source_path,
        rows=rows if not header_warnings else [],
        row_count=len(rows),
        market_scope=config.market_scope,
        checkpoint_id="fixture:raw_daily_prices:complete",
        source_id=f"fixture_{source_path.name}",
        provider_or_institution="FINPLE synthetic fixture",
        retrieved_at=config.created_at,
        license_status="approved",
        internal_use_allowed=True,
        publication_allowed=False,
        redistribution_allowed=False,
        price_adjustment_basis="fixture_contract",
        warnings=tuple(header_warnings),
    )


def _run_manual_upload_adapter(config: Any) -> SourceAdapterResult:
    source_path = config.input_dir / config.manual_upload_file
    rows, warnings = _read_csv_with_exact_header(source_path, RAW_DAILY_PRICE_COLUMNS)
    accepted_rows, rejected_count, gate_warnings, policy = _apply_license_gate(rows)
    return _build_result(
        adapter_id="finple.manual_upload_csv.v1",
        mode="manual_upload",
        source_path=source_path,
        rows=accepted_rows if not warnings else [],
        row_count=len(rows),
        market_scope=config.market_scope,
        checkpoint_id=f"manual_upload:{_sha256(source_path)[:12]}:complete" if source_path.exists() else "manual_upload:missing",
        source_id=_single_or_mixed(rows, "sourceId", default=f"manual_upload_{source_path.name}"),
        provider_or_institution=_single_or_mixed(rows, "providerOrInstitution", default="manual upload"),
        retrieved_at=_single_or_mixed(rows, "retrievedAt", default=config.created_at),
        license_status=policy["licenseStatus"],
        internal_use_allowed=policy["internalUseAllowed"],
        publication_allowed=policy["publicationAllowed"],
        redistribution_allowed=policy["redistributionAllowed"],
        price_adjustment_basis=_single_or_mixed(rows, "priceAdjustmentBasis", default="mixed_or_review_required"),
        warnings=tuple(warnings + gate_warnings),
        rejected_row_count=rejected_count + (len(rows) if warnings else 0),
    )


def _run_public_source_fixture_adapter(config: Any) -> SourceAdapterResult:
    source_path = config.input_dir / config.public_source_fixture_file
    provider_rows, warnings = _read_csv_with_exact_header(source_path, PUBLIC_SOURCE_FIXTURE_COLUMNS)
    retry_count, last_status = _bounded_retry_status(
        config.public_source_fixture_failure_mode,
        config.source_adapter_max_retry_count,
    )
    if config.public_source_fixture_failure_mode == "permanent_failure":
        warnings.append("public_source_fixture permanent_failure blocked after bounded retry")
        provider_rows = []
    elif config.public_source_fixture_failure_mode == "transient_then_success" and config.source_adapter_max_retry_count == 0:
        warnings.append("public_source_fixture transient failure blocked because max retry is zero")
        provider_rows = []

    mapped_rows: list[dict[str, str]] = []
    mapping_warnings: list[str] = []
    for row in provider_rows:
        mapped_row, row_warnings = _map_public_source_fixture_row(row)
        mapping_warnings.extend(row_warnings)
        if not row_warnings:
            mapped_rows.append(mapped_row)
    warnings.extend(sorted(set(mapping_warnings)))

    accepted_by_record_id: dict[str, dict[str, str]] = {}
    accepted_record_ids = _load_accepted_record_ids(config.public_source_resume_checkpoint_file)
    previous_completed_pages = _load_completed_page_numbers(config.public_source_resume_checkpoint_file)
    skipped_previously_accepted = 0
    for row in sorted(provider_rows, key=lambda item: (int(item.get("pageNumber") or "0"), item.get("recordId", ""))):
        record_id = row.get("recordId", "")
        if record_id in accepted_record_ids:
            skipped_previously_accepted += 1
            continue
        mapped_row, row_warnings = _map_public_source_fixture_row(row)
        if not row_warnings:
            accepted_by_record_id[record_id] = mapped_row

    accepted_rows, gated_count, gate_warnings, policy = _apply_license_gate(list(accepted_by_record_id.values()))
    cumulative_accepted_ids = sorted(accepted_record_ids.union(accepted_by_record_id))
    completed_pages = sorted(previous_completed_pages.union({int(row.get("pageNumber") or "0") for row in provider_rows}))
    checkpoint = {
        "checkpointId": f"public_source_fixture:{_sha256(source_path)[:12]}:complete" if source_path.exists() else "public_source_fixture:missing",
        "adapterId": "finple.synthetic_public_source_fixture.v1",
        "adapterVersion": ADAPTER_VERSION,
        "mode": "public_source_fixture",
        "resumeSupported": True,
        "retryCount": retry_count,
        "maxRetryCount": config.source_adapter_max_retry_count,
        "lastStatus": last_status,
        "acceptedRecordIds": cumulative_accepted_ids,
        "completedPageNumbers": completed_pages,
        "previousAcceptedRecordCount": len(accepted_record_ids),
        "newlyAcceptedRecordCount": len(accepted_by_record_id),
        "cumulativeAcceptedRecordCount": len(cumulative_accepted_ids),
        "skippedPreviouslyAcceptedCount": skipped_previously_accepted,
        "duplicateAcceptedRecordCount": 0,
        "rejectedRecordCount": gated_count + len(mapping_warnings),
        "nextCursor": "",
        "sourceFileName": source_path.name,
        "rawSourceSha256": _sha256(source_path) if source_path.exists() else "",
    }
    return _build_result(
        adapter_id="finple.synthetic_public_source_fixture.v1",
        mode="public_source_fixture",
        source_path=source_path,
        rows=accepted_rows if not warnings else [],
        row_count=len(provider_rows),
        market_scope=config.market_scope,
        checkpoint_id=str(checkpoint["checkpointId"]),
        source_id=_single_or_mixed(mapped_rows, "sourceId", default=f"public_source_fixture_{source_path.name}"),
        provider_or_institution=_single_or_mixed(mapped_rows, "providerOrInstitution", default="FINPLE synthetic public-source fixture"),
        retrieved_at=_single_or_mixed(mapped_rows, "retrievedAt", default=config.created_at),
        license_status=policy["licenseStatus"],
        internal_use_allowed=policy["internalUseAllowed"],
        publication_allowed=policy["publicationAllowed"],
        redistribution_allowed=policy["redistributionAllowed"],
        price_adjustment_basis=_single_or_mixed(mapped_rows, "priceAdjustmentBasis", default="mixed_or_review_required"),
        warnings=tuple(warnings + gate_warnings),
        rejected_row_count=gated_count + len(mapping_warnings),
        retry_count=retry_count,
        max_retry_count=config.source_adapter_max_retry_count,
        last_status=last_status,
        checkpoint=checkpoint,
    )


def _build_result(
    *,
    adapter_id: str,
    mode: str,
    source_path: Path,
    rows: list[dict[str, str]],
    row_count: int,
    market_scope: tuple[str, ...],
    checkpoint_id: str,
    source_id: str,
    provider_or_institution: str,
    retrieved_at: str,
    license_status: str,
    internal_use_allowed: bool,
    publication_allowed: bool,
    redistribution_allowed: bool,
    price_adjustment_basis: str,
    warnings: tuple[str, ...],
    rejected_row_count: int = 0,
    retry_count: int = 0,
    max_retry_count: int = 0,
    last_status: str = "success",
    checkpoint: Mapping[str, Any] | None = None,
) -> SourceAdapterResult:
    public_values = _sanitize_payload(
        {
            "sourceId": source_id,
            "providerOrInstitution": provider_or_institution,
            "retrievedAt": retrieved_at,
            "warnings": list(warnings),
            "checkpointId": checkpoint_id,
        }
    )
    sanitized_rows = [_sanitize_row(row) for row in rows]
    return SourceAdapterResult(
        adapterId=adapter_id,
        adapterVersion=ADAPTER_VERSION,
        mode=mode,
        sourceId=str(public_values["sourceId"]),
        sourceFileName=source_path.name,
        providerOrInstitution=str(public_values["providerOrInstitution"]),
        retrievedAt=str(public_values["retrievedAt"]),
        marketScope=tuple(market_scope),
        inputFormat="csv",
        rowCount=row_count,
        rawSourceSha256=_sha256(source_path) if source_path.exists() else "",
        licenseStatus=license_status or "unknown",
        internalUseAllowed=internal_use_allowed,
        publicationAllowed=publication_allowed,
        redistributionAllowed=redistribution_allowed,
        priceAdjustmentBasis=price_adjustment_basis or "mixed_or_review_required",
        checkpointId=str(public_values["checkpointId"]),
        resumeSupported=mode == "public_source_fixture",
        warnings=tuple(str(item) for item in public_values["warnings"]),
        rows=tuple(sanitized_rows),
        sourcePath=source_path,
        rejectedRowCount=rejected_row_count,
        retryCount=retry_count,
        maxRetryCount=max_retry_count,
        lastStatus=last_status,
        checkpoint=checkpoint,
    )


def _read_csv_with_exact_header(path: Path, expected_columns: list[str]) -> tuple[list[dict[str, str]], list[str]]:
    if not path.exists():
        return [], [f"source adapter input missing: {path.name}"]
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.reader(handle, strict=True)
            try:
                header = next(reader)
            except StopIteration:
                return [], [f"source adapter input is empty: {path.name}"]
            warnings: list[str] = []
            rows: list[dict[str, str]] = []
            for row_number, record in enumerate(reader, start=2):
                if len(record) != len(header):
                    warnings.append(
                        f"source adapter row field count mismatch blocked: {path.name}:{row_number} expected={len(header)} actual={len(record)}"
                    )
                    continue
                rows.append({key: (value or "") for key, value in zip(header, record)})
    except UnicodeDecodeError:
        return [], [f"source adapter invalid encoding blocked: {path.name}"]
    except csv.Error as error:
        return [], [f"source adapter malformed csv blocked: {path.name}: {error}"]

    if not header:
        return [], [f"source adapter header missing: {path.name}"]
    warnings = list(warnings)
    duplicate_headers = sorted({column for column in header if header.count(column) > 1})
    if duplicate_headers:
        warnings.append(f"source adapter duplicate header blocked: {', '.join(duplicate_headers)}")
    if header != expected_columns:
        missing = sorted(set(expected_columns).difference(header))
        extra = sorted(set(header).difference(expected_columns))
        warnings.append(
            "source adapter header mismatch blocked"
            + (f"; missing={','.join(missing)}" if missing else "")
            + (f"; extra={','.join(extra)}" if extra else "")
        )
    return rows, warnings


def _map_public_source_fixture_row(row: Mapping[str, str]) -> tuple[dict[str, str], list[str]]:
    source_shape = row.get("sourceShape", "")
    if source_shape not in PROVIDER_SOURCE_SHAPES:
        return {}, [f"source adapter unsupported provider shape blocked: {source_shape or 'blank'}"]
    if source_shape == "kr_public_daily_price":
        return _map_kr_public_daily_price_row(row), []
    return _map_kr_securities_product_row(row), []


def _map_kr_public_daily_price_row(row: Mapping[str, str]) -> dict[str, str]:
    ticker = row.get("krIssueCode", "")
    return {
        "market": "KR",
        "ticker": ticker,
        "date": row.get("krTradeDate", ""),
        "currency": row.get("krCurrency", "KRW"),
        "close": row.get("krClosePrice", ""),
        "splitAdjustedClose": row.get("krClosePrice", ""),
        "totalReturnAdjustedClose": "",
        "volume": row.get("krVolume", ""),
        "splitFactor": row.get("krSplitFactor", "1.0") or "1.0",
        "cashDividend": row.get("krCashDividend", "0.00") or "0.00",
        "sourceId": f"public_fixture:{row.get('sourceShape', '')}:{row.get('recordId', '')}",
        "retrievedAt": row.get("retrievedAt", ""),
        "priceAdjustmentBasis": row.get("priceAdjustmentBasis", "split_adjusted") or "split_adjusted",
        "publicationEligibility": row.get("publicationEligibility", "approved"),
        "providerOrInstitution": row.get("providerOrInstitution", "FINPLE synthetic public-source fixture"),
        "licenseStatus": row.get("licenseStatus", ""),
        "internalUseAllowed": row.get("internalUseAllowed", ""),
        "publicationAllowed": row.get("publicationAllowed", ""),
        "redistributionAllowed": row.get("redistributionAllowed", ""),
    }


def _map_kr_securities_product_row(row: Mapping[str, str]) -> dict[str, str]:
    ticker = row.get("krProductCode", "")
    return {
        "market": "KR",
        "ticker": ticker,
        "date": row.get("krProductBaseDate", ""),
        "currency": row.get("krProductCurrency", "KRW"),
        "close": row.get("krProductClosePrice", ""),
        "splitAdjustedClose": row.get("krProductClosePrice", ""),
        "totalReturnAdjustedClose": row.get("krProductTotalReturnAdjustedClose", ""),
        "volume": row.get("krProductVolume", ""),
        "splitFactor": "1.0",
        "cashDividend": row.get("krProductCashDistribution", "0.00") or "0.00",
        "sourceId": f"public_fixture:{row.get('sourceShape', '')}:{row.get('recordId', '')}",
        "retrievedAt": row.get("retrievedAt", ""),
        "priceAdjustmentBasis": row.get("priceAdjustmentBasis", "total_return_adjusted") or "total_return_adjusted",
        "publicationEligibility": row.get("publicationEligibility", "approved"),
        "providerOrInstitution": row.get("providerOrInstitution", "FINPLE synthetic public-source fixture"),
        "licenseStatus": row.get("licenseStatus", ""),
        "internalUseAllowed": row.get("internalUseAllowed", ""),
        "publicationAllowed": row.get("publicationAllowed", ""),
        "redistributionAllowed": row.get("redistributionAllowed", ""),
    }


def _apply_license_gate(rows: list[dict[str, str]]) -> tuple[list[dict[str, str]], int, list[str], dict[str, Any]]:
    if not rows:
        return [], 0, [], _policy_from_rows(rows)
    accepted: list[dict[str, str]] = []
    rejected = 0
    warnings: list[str] = []
    for row in rows:
        internal_allowed = _bool_cell(row.get("internalUseAllowed", ""))
        license_status = row.get("licenseStatus", "")
        if internal_allowed is not True or license_status in UNKNOWN_LICENSE_STATUSES:
            rejected += 1
            warnings.append(f"source adapter row blocked by license gate: {row.get('sourceId', 'unknown')}")
            continue
        accepted.append(row)
    policy = _policy_from_rows(accepted if accepted else rows)
    if policy["publicationAllowed"] is not True or policy["redistributionAllowed"] is not True:
        warnings.append("source adapter publish/app export gate remains fail-closed")
    return accepted, rejected, sorted(set(warnings)), policy


def _policy_from_rows(rows: list[dict[str, str]]) -> dict[str, Any]:
    return {
        "licenseStatus": _single_or_mixed(rows, "licenseStatus", default="unknown"),
        "internalUseAllowed": all(_bool_cell(row.get("internalUseAllowed", "")) is True for row in rows) if rows else False,
        "publicationAllowed": all(_bool_cell(row.get("publicationAllowed", "")) is True for row in rows) if rows else False,
        "redistributionAllowed": all(_bool_cell(row.get("redistributionAllowed", "")) is True for row in rows) if rows else False,
    }


def _single_or_mixed(rows: list[dict[str, str]], column: str, default: str) -> str:
    values = sorted({row.get(column, "") for row in rows if row.get(column, "")})
    if not values:
        return default
    if len(values) == 1:
        return _sanitize_string(values[0])
    return "mixed"


def _load_accepted_record_ids(path_value: str) -> set[str]:
    if not path_value:
        return set()
    path = Path(path_value)
    if not path.exists():
        return set()
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {str(item) for item in payload.get("acceptedRecordIds", [])}


def _load_completed_page_numbers(path_value: str) -> set[int]:
    if not path_value:
        return set()
    path = Path(path_value)
    if not path.exists():
        return set()
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {int(item) for item in payload.get("completedPageNumbers", [])}


def _bounded_retry_status(failure_mode: str, max_retry_count: int) -> tuple[int, str]:
    if failure_mode == "transient_then_success":
        if max_retry_count < 1:
            return 0, "retry_exhausted"
        return 1, "success_after_retry"
    if failure_mode == "permanent_failure":
        return max_retry_count, "retry_exhausted"
    return 0, "success"


def _default_checkpoint(result: SourceAdapterResult) -> dict[str, Any]:
    return {
        "checkpointId": result.checkpointId,
        "adapterId": result.adapterId,
        "adapterVersion": result.adapterVersion,
        "mode": result.mode,
        "resumeSupported": result.resumeSupported,
        "retryCount": result.retryCount,
        "maxRetryCount": result.maxRetryCount,
        "lastStatus": result.lastStatus,
        "acceptedRecordIds": [],
        "completedPageNumbers": [],
        "previousAcceptedRecordCount": 0,
        "newlyAcceptedRecordCount": len(result.rows),
        "cumulativeAcceptedRecordCount": len(result.rows),
        "skippedPreviouslyAcceptedCount": 0,
        "duplicateAcceptedRecordCount": 0,
        "rejectedRecordCount": result.rejectedRowCount,
        "nextCursor": "",
        "sourceFileName": result.sourceFileName,
        "rawSourceSha256": result.rawSourceSha256,
    }


def _sanitize_row(row: Mapping[str, str]) -> dict[str, str]:
    return {column: _sanitize_string(str(row.get(column, ""))) for column in RAW_DAILY_PRICE_COLUMNS}


def _sanitize_payload(payload: Any) -> Any:
    if isinstance(payload, dict):
        sanitized = {}
        for key, value in payload.items():
            key_text = str(key)
            if key_text in {"rawSourceSha256", "sourceSha256", "sha256"}:
                sanitized[key_text] = value
            else:
                sanitized[key_text] = _sanitize_payload(value)
        return sanitized
    if isinstance(payload, list):
        return [_sanitize_payload(item) for item in payload]
    if isinstance(payload, tuple):
        return tuple(_sanitize_payload(item) for item in payload)
    if isinstance(payload, str):
        return _sanitize_string(payload)
    return payload


def _sanitize_string(value: str) -> str:
    if _looks_like_local_absolute_path(value):
        return "[REDACTED_LOCAL_PATH]"
    if _looks_like_secret(value):
        return "[REDACTED_SECRET]"
    return value


def _looks_like_local_absolute_path(value: str) -> bool:
    return bool(re.search(r"([A-Za-z]:\\|/Users/|/home/|/content/drive/)", value))


def _looks_like_secret(value: str) -> bool:
    lowered = value.lower()
    if any(token in lowered for token in ["api_key=", "apikey=", "servicekey=", "authorization:", "bearer "]):
        return True
    if not re.fullmatch(r"[A-Za-z0-9_\-]{32,}", value):
        return False
    has_digit = bool(re.search(r"\d", value))
    has_upper = bool(re.search(r"[A-Z]", value))
    has_lower = bool(re.search(r"[a-z]", value))
    return has_digit and has_upper and has_lower


def _sha256(path: Path) -> str:
    if not path.exists():
        return ""
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _bool_cell(value: str) -> bool | None:
    normalized = str(value).strip().lower()
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    return None
