from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import math
import re
import shutil
import tempfile
import zipfile
from collections import Counter
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path, PurePosixPath
from typing import Any, Iterator, TextIO


EXPORT_VERSION = "finple-app-preview-export-v1-step114-2z"
EXPORT_SCHEMA_VERSION = 1
DEFAULT_SHARD_COUNT = 64
METRICS_OUTPUT_PATTERN = re.compile(r"metrics_output.*\.csv$", re.IGNORECASE)
MONTHLY_RETURNS_PATTERN = re.compile(r"monthly_returns.*\.csv$", re.IGNORECASE)
SOURCE_AUDIT_PATTERN = re.compile(r"source_audit.*\.csv$", re.IGNORECASE)
READINESS_PATTERN = re.compile(r"readiness.*\.json$", re.IGNORECASE)
MANIFEST_PATTERN = re.compile(r"manifest.*\.json$", re.IGNORECASE)
RAW_MISSING_IDENTITY_PATTERN = re.compile(r"No raw rows for candidate ([A-Z]+:[^;]+);")
NON_FINITE_TEXT = {"nan", "+nan", "-nan", "infinity", "+infinity", "-infinity", "inf", "+inf", "-inf"}

METRIC_FIELDS = (
    "market",
    "ticker",
    "nameKr",
    "assetType",
    "benchmarkKey",
    "benchmarkTicker",
    "selectedCagr",
    "rawPriceCagr10y",
    "rollingCagr10yMedian",
    "rollingCagr10yP25",
    "rollingCagr10yP75",
    "validRollingWindowCount10y",
    "cagrPolicy",
    "selectedMdd",
    "mddPolicy",
    "selectedBeta",
    "betaPolicy",
    "dividendYield",
    "dividendStatus",
    "dataStatus",
    "reviewFlag",
    "reviewReason",
    "metricBaseDate",
    "dataStartDate",
    "dataEndDate",
    "sourceHash",
    "rawSourceSha256",
    "normalizationVersion",
    "normalizedSeriesHash",
    "rollingMetricVersion",
)

NUMERIC_METRIC_FIELDS = {
    "selectedCagr",
    "rawPriceCagr10y",
    "rollingCagr10yMedian",
    "rollingCagr10yP25",
    "rollingCagr10yP75",
    "validRollingWindowCount10y",
    "selectedMdd",
    "selectedBeta",
    "dividendYield",
}

INTEGER_METRIC_FIELDS = {"validRollingWindowCount10y"}
MONTHLY_NUMERIC_FIELDS = {"priceReturn", "totalReturn", "fxReturn"}


class PreviewExportError(ValueError):
    pass


@dataclass(frozen=True)
class PackageMember:
    logical_name: str
    source_name: str


class PackageReader:
    def list_names(self) -> list[str]:
        raise NotImplementedError

    @contextmanager
    def open_text(self, source_name: str) -> Iterator[TextIO]:
        raise NotImplementedError

    def close(self) -> None:
        return None


class ZipPackageReader(PackageReader):
    def __init__(self, path: Path):
        self.path = path
        self.archive = zipfile.ZipFile(path, "r")
        for entry in self.archive.infolist():
            pure_path = PurePosixPath(entry.filename)
            if pure_path.is_absolute() or ".." in pure_path.parts:
                raise PreviewExportError(f"unsafe package member path: {entry.filename}")

    def list_names(self) -> list[str]:
        return [entry.filename for entry in self.archive.infolist() if not entry.is_dir()]

    @contextmanager
    def open_text(self, source_name: str) -> Iterator[TextIO]:
        raw = self.archive.open(source_name, "r")
        wrapper = io.TextIOWrapper(raw, encoding="utf-8-sig", newline="")
        try:
            yield wrapper
        finally:
            wrapper.close()

    def close(self) -> None:
        self.archive.close()


class DirectoryPackageReader(PackageReader):
    def __init__(self, path: Path):
        self.path = path
        self.files = {
            file.relative_to(path).as_posix(): file
            for file in path.rglob("*")
            if file.is_file()
        }

    def list_names(self) -> list[str]:
        return list(self.files)

    @contextmanager
    def open_text(self, source_name: str) -> Iterator[TextIO]:
        with self.files[source_name].open("r", encoding="utf-8-sig", newline="") as handle:
            yield handle


def create_package_reader(path: Path) -> PackageReader:
    if path.is_dir():
        return DirectoryPackageReader(path)
    if path.is_file() and path.suffix.lower() == ".zip":
        return ZipPackageReader(path)
    raise PreviewExportError("--input-package must be a readable ZIP or extracted package directory")


def find_member(
    reader: PackageReader,
    pattern: re.Pattern[str],
    logical_name: str,
    *,
    exclude: tuple[str, ...] = (),
    required: bool = True,
) -> PackageMember | None:
    matches = []
    for source_name in reader.list_names():
        base_name = PurePosixPath(source_name).name
        if pattern.search(base_name) and not any(value.lower() in base_name.lower() for value in exclude):
            matches.append(source_name)
    if not matches:
        if required:
            raise PreviewExportError(f"missing required package member: {logical_name}")
        return None
    if len(matches) > 1:
        raise PreviewExportError(f"ambiguous package member {logical_name}: {matches}")
    return PackageMember(logical_name=logical_name, source_name=matches[0])


def load_json_member(reader: PackageReader, member: PackageMember) -> dict[str, Any]:
    with reader.open_text(member.source_name) as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise PreviewExportError(f"{member.logical_name} must contain a JSON object")
    return payload


def stable_json_bytes(value: Any) -> bytes:
    return (
        json.dumps(
            value,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
            allow_nan=False,
        )
        + "\n"
    ).encode("utf-8")


def write_stable_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(stable_json_bytes(value))


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def file_record(path: Path, relative_to: Path) -> dict[str, Any]:
    return {
        "path": path.relative_to(relative_to).as_posix(),
        "sizeBytes": path.stat().st_size,
        "sha256": sha256_path(path),
    }


def normalize_identity(market: Any, ticker: Any) -> tuple[str, str, str]:
    normalized_market = str(market or "").strip().upper()
    normalized_ticker = str(ticker or "").strip().upper()
    if normalized_market not in {"US", "KR"}:
        raise PreviewExportError(f"invalid market identity: {normalized_market or '<blank>'}")
    if not normalized_ticker:
        raise PreviewExportError("ticker identity must not be blank")
    if normalized_market == "KR" and not re.fullmatch(r"[0-9A-Z]{6}", normalized_ticker):
        raise PreviewExportError(f"invalid KR ticker identity: {normalized_ticker}")
    return normalized_market, normalized_ticker, f"{normalized_market}:{normalized_ticker}"


def parse_nullable_number(value: Any, field: str) -> int | float | None:
    if value is None or str(value).strip() == "":
        return None
    raw = str(value).strip()
    if raw.lower() in NON_FINITE_TEXT:
        raise PreviewExportError(f"non-finite numeric token in {field}: {raw}")
    try:
        decimal_value = Decimal(raw)
    except InvalidOperation as error:
        raise PreviewExportError(f"invalid numeric value in {field}: {raw}") from error
    if not decimal_value.is_finite():
        raise PreviewExportError(f"non-finite numeric value in {field}: {raw}")
    if field in INTEGER_METRIC_FIELDS:
        if decimal_value != decimal_value.to_integral_value():
            raise PreviewExportError(f"{field} must be an integer: {raw}")
        return int(decimal_value)
    number = float(decimal_value)
    if not math.isfinite(number):
        raise PreviewExportError(f"non-finite numeric value in {field}: {raw}")
    return number


def parse_raw_missing_identities(
    reader: PackageReader,
    source_audit_member: PackageMember | None,
) -> set[str]:
    if source_audit_member is None:
        return set()
    identities: set[str] = set()
    with reader.open_text(source_audit_member.source_name) as handle:
        for row in csv.DictReader(handle):
            if row.get("issueType") != "candidate_raw_identity_missing":
                continue
            match = RAW_MISSING_IDENTITY_PATTERN.search(row.get("reviewReason", ""))
            if not match:
                raise PreviewExportError("candidate_raw_identity_missing row has no parseable identity")
            market, ticker = match.group(1).split(":", 1)
            _, _, identity = normalize_identity(market, ticker)
            identities.add(identity)
    return identities


def validate_source_package(manifest: dict[str, Any], readiness: dict[str, Any]) -> None:
    combined = {**manifest, **readiness}
    expected = {
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "metricsOutputRowCount": 6000,
        "productionPublishReady": False,
        "appExportApproved": False,
    }
    failures = [
        f"{field}={combined.get(field)!r}, expected {value!r}"
        for field, value in expected.items()
        if combined.get(field) != value
    ]
    if failures:
        raise PreviewExportError("source package readiness mismatch: " + "; ".join(failures))
    for field in expected:
        if field in manifest and field in readiness and manifest[field] != readiness[field]:
            raise PreviewExportError(f"source manifest/readiness mismatch: {field}")
    metric_data_through_month = str(combined.get("metricDataThroughMonth") or "")
    if not re.fullmatch(r"\d{4}-\d{2}", metric_data_through_month):
        raise PreviewExportError("source package metricDataThroughMonth must be YYYY-MM")
    selected_row_count = combined.get("selectedRowCount")
    if not isinstance(selected_row_count, int) or not 0 <= selected_row_count <= 6000:
        raise PreviewExportError("source package selectedRowCount must be an integer from 0 through 6000")
    if manifest.get("internalPreviewReviewOnly") is not True:
        raise PreviewExportError("source package must be explicitly internalPreviewReviewOnly=true")
    if not str(manifest.get("candidatePackageId") or "").strip():
        raise PreviewExportError("source package candidatePackageId is required")
    if not re.fullmatch(r"[0-9a-f]{64}", str(manifest.get("candidatePackageHash") or "")):
        raise PreviewExportError("source package candidatePackageHash must be SHA-256")


def build_metrics_overlay(
    reader: PackageReader,
    metrics_member: PackageMember,
    raw_missing_identities: set[str],
    manifest: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    identities: set[str] = set()
    market_counts: Counter[str] = Counter()
    data_status_counts: Counter[str] = Counter()
    with reader.open_text(metrics_member.source_name) as handle:
        csv_reader = csv.DictReader(handle)
        missing_columns = [field for field in METRIC_FIELDS if field not in (csv_reader.fieldnames or [])]
        if missing_columns:
            raise PreviewExportError(f"metrics output missing columns: {missing_columns}")
        for source_row in csv_reader:
            market, ticker, identity = normalize_identity(source_row.get("market"), source_row.get("ticker"))
            if identity in identities:
                raise PreviewExportError(f"duplicate metrics identity: {identity}")
            identities.add(identity)
            row: dict[str, Any] = {}
            for field in METRIC_FIELDS:
                if field == "market":
                    row[field] = market
                elif field == "ticker":
                    row[field] = ticker
                elif field in NUMERIC_METRIC_FIELDS:
                    row[field] = parse_nullable_number(source_row.get(field), field)
                else:
                    raw_value = source_row.get(field)
                    row[field] = None if raw_value is None or raw_value == "" else str(raw_value)
            row["identity"] = identity
            row["rawPriceCoverageStatus"] = "missing" if identity in raw_missing_identities else "covered"
            row["internalPreviewReviewOnly"] = True
            row["productionPublishReady"] = False
            row["appExportApproved"] = False
            rows.append(row)
            market_counts[market] += 1
            data_status_counts[str(row.get("dataStatus") or "blank")] += 1
    rows.sort(key=lambda row: (row["market"], row["ticker"]))
    if len(rows) != 6000 or len(identities) != 6000:
        raise PreviewExportError(f"metrics overlay must preserve exactly 6000 identities, found {len(rows)}")
    if market_counts != Counter({"US": 3000, "KR": 3000}):
        raise PreviewExportError(f"unexpected metrics market counts: {dict(market_counts)}")
    if len(raw_missing_identities) != 16:
        raise PreviewExportError(f"expected 16 raw-missing identities, found {len(raw_missing_identities)}")
    overlay = {
        "schemaVersion": EXPORT_SCHEMA_VERSION,
        "exportVersion": EXPORT_VERSION,
        "sourceCandidatePackageId": manifest["candidatePackageId"],
        "metricBaseDate": manifest["metricBaseDate"],
        "metricDataThroughMonth": manifest["metricDataThroughMonth"],
        "internalPreviewReviewOnly": True,
        "productionPublishReady": False,
        "appExportApproved": False,
        "rows": rows,
    }
    stats = {
        "assetCount": len(rows),
        "marketCounts": dict(sorted(market_counts.items())),
        "dataStatusCounts": dict(sorted(data_status_counts.items())),
        "rawMissingAssetCount": len(raw_missing_identities),
        "rawMissingIdentities": sorted(raw_missing_identities),
    }
    return overlay, stats


def shard_id_for_identity(identity: str, shard_count: int) -> str:
    bucket = int(hashlib.sha256(identity.encode("utf-8")).hexdigest()[:8], 16) % shard_count
    width = max(2, len(f"{shard_count - 1:x}"))
    return f"{bucket:0{width}x}"


class JsonShardWriter:
    def __init__(self, path: Path, shard_id: str):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.handle = path.open("w", encoding="utf-8", newline="\n")
        self.handle.write(
            json.dumps(
                {
                    "schemaVersion": EXPORT_SCHEMA_VERSION,
                    "exportVersion": EXPORT_VERSION,
                    "shardId": shard_id,
                },
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )[:-1]
        )
        self.handle.write(',"series":{')
        self.first_series = True
        self.asset_count = 0
        self.row_count = 0

    def write_series(self, identity: str, rows: list[list[Any]]) -> None:
        if not self.first_series:
            self.handle.write(",")
        self.first_series = False
        self.handle.write(json.dumps(identity, ensure_ascii=False))
        self.handle.write(":")
        self.handle.write(json.dumps(rows, ensure_ascii=False, separators=(",", ":"), allow_nan=False))
        self.asset_count += 1
        self.row_count += len(rows)

    def close(self) -> None:
        self.handle.write("}}\n")
        self.handle.close()


def build_monthly_shards(
    reader: PackageReader,
    monthly_member: PackageMember,
    bundle_dir: Path,
    manifest: dict[str, Any],
    shard_count: int,
) -> tuple[dict[str, Any], dict[str, Any], list[Path]]:
    shard_dir = bundle_dir / "monthly-returns"
    shard_id_width = max(2, len(f"{shard_count - 1:x}"))
    writers = {
        f"{index:0{shard_id_width}x}": JsonShardWriter(
            shard_dir / f"monthly-returns-{index:0{shard_id_width}x}.json",
            f"{index:0{shard_id_width}x}",
        )
        for index in range(shard_count)
    }

    asset_index: dict[str, Any] = {}
    market_row_counts: Counter[str] = Counter()
    total_rows = 0
    first_month: str | None = None
    last_month: str | None = None
    previous_key: tuple[str, str, str] | None = None
    current_identity: str | None = None
    current_market = ""
    current_ticker = ""
    current_rows: list[list[Any]] = []

    def flush_series() -> None:
        nonlocal current_rows
        if current_identity is None:
            return
        shard_id = shard_id_for_identity(current_identity, shard_count)
        writers[shard_id].write_series(current_identity, current_rows)
        asset_index[current_identity] = {
            "shard": f"monthly-returns/monthly-returns-{shard_id}.json",
            "market": current_market,
            "ticker": current_ticker,
            "rowCount": len(current_rows),
            "firstMonth": current_rows[0][0] if current_rows else None,
            "lastMonth": current_rows[-1][0] if current_rows else None,
        }
        current_rows = []

    try:
        with reader.open_text(monthly_member.source_name) as handle:
            csv_reader = csv.DictReader(handle)
            required_columns = {
                "market",
                "ticker",
                "month",
                "currency",
                "priceReturn",
                "totalReturn",
                "fxReturn",
                "benchmarkId",
                "isProxy",
                "proxyTicker",
                "dataStatus",
            }
            missing_columns = sorted(required_columns - set(csv_reader.fieldnames or []))
            if missing_columns:
                raise PreviewExportError(f"monthly returns missing columns: {missing_columns}")
            for source_row in csv_reader:
                market, ticker, identity = normalize_identity(source_row.get("market"), source_row.get("ticker"))
                month = str(source_row.get("month") or "").strip()
                if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", month):
                    raise PreviewExportError(f"invalid monthly return month: {identity}:{month}")
                key = (market, ticker, month)
                if previous_key is not None and key <= previous_key:
                    relation = "duplicate" if key == previous_key else "out of order"
                    raise PreviewExportError(f"monthly return input {relation}: {key}")
                previous_key = key
                if identity != current_identity:
                    flush_series()
                    current_identity = identity
                    current_market = market
                    current_ticker = ticker
                parsed_values = [
                    parse_nullable_number(source_row.get(field), field)
                    for field in ("priceReturn", "totalReturn", "fxReturn")
                ]
                if parsed_values[0] is None:
                    raise PreviewExportError(f"priceReturn must not be blank: {identity}:{month}")
                current_rows.append(
                    [
                        month,
                        parsed_values[0],
                        parsed_values[1],
                        parsed_values[2],
                        str(source_row.get("currency") or "").strip() or None,
                        str(source_row.get("benchmarkId") or "").strip() or None,
                        str(source_row.get("dataStatus") or "").strip() or None,
                    ]
                )
                market_row_counts[market] += 1
                total_rows += 1
                first_month = month if first_month is None or month < first_month else first_month
                last_month = month if last_month is None or month > last_month else last_month
        flush_series()
    finally:
        for writer in writers.values():
            writer.close()

    expected_rows = int(manifest.get("inputRowReconciliation", {}).get("monthlyReturnRows", 0))
    if total_rows != expected_rows:
        raise PreviewExportError(f"monthly return row reconciliation failed: {total_rows} != {expected_rows}")
    if last_month and last_month[:7] > str(manifest["metricDataThroughMonth"]):
        raise PreviewExportError(
            f"monthly returns exceed metricDataThroughMonth: {last_month} > {manifest['metricDataThroughMonth']}"
        )

    shard_paths = sorted(writer.path for writer in writers.values())
    shard_inventory = []
    for shard_id, writer in sorted(writers.items()):
        record = file_record(writer.path, bundle_dir)
        record.update(
            {
                "shardId": shard_id,
                "assetCount": writer.asset_count,
                "rowCount": writer.row_count,
            }
        )
        shard_inventory.append(record)

    monthly_index = {
        "schemaVersion": EXPORT_SCHEMA_VERSION,
        "exportVersion": EXPORT_VERSION,
        "sourceCandidatePackageId": manifest["candidatePackageId"],
        "metricDataThroughMonth": manifest["metricDataThroughMonth"],
        "returnBasis": "price_return",
        "rowEncoding": [
            "month",
            "priceReturn",
            "totalReturn",
            "fxReturn",
            "currency",
            "benchmarkId",
            "dataStatus",
        ],
        "assetCount": len(asset_index),
        "rowCount": total_rows,
        "firstMonth": first_month,
        "lastMonth": last_month,
        "assets": dict(sorted(asset_index.items())),
        "shards": shard_inventory,
    }
    stats = {
        "monthlyReturnAssetCount": len(asset_index),
        "monthlyReturnRowCount": total_rows,
        "monthlyReturnMarketRowCounts": dict(sorted(market_row_counts.items())),
        "monthlyReturnFirstMonth": first_month,
        "monthlyReturnLastMonth": last_month,
        "shardCount": shard_count,
    }
    return monthly_index, stats, shard_paths


def representative_metric(rows: list[dict[str, Any]], identity: str) -> dict[str, Any]:
    row = next((item for item in rows if item["identity"] == identity), None)
    if row is None:
        raise PreviewExportError(f"representative identity missing: {identity}")
    return {
        field: row.get(field)
        for field in (
            "identity",
            "rawPriceCoverageStatus",
            "rawPriceCagr10y",
            "rollingCagr10yMedian",
            "validRollingWindowCount10y",
            "selectedCagr",
            "cagrPolicy",
            "selectedMdd",
            "mddPolicy",
            "selectedBeta",
            "betaPolicy",
            "dividendYield",
            "dividendStatus",
            "dataStatus",
            "reviewFlag",
            "reviewReason",
        )
    }


def validate_qqq_policy(rows: list[dict[str, Any]]) -> None:
    qqq = next((row for row in rows if row["identity"] == "US:QQQ"), None)
    if qqq is None:
        raise PreviewExportError("US:QQQ is missing from metrics overlay")
    if qqq["cagrPolicy"] != "rolling_10y_median":
        raise PreviewExportError(f"QQQ cagrPolicy mismatch: {qqq['cagrPolicy']!r}")
    if qqq["selectedCagr"] != qqq["rollingCagr10yMedian"]:
        raise PreviewExportError("QQQ selectedCagr must equal rollingCagr10yMedian")
    if not isinstance(qqq["validRollingWindowCount10y"], int) or qqq["validRollingWindowCount10y"] <= 1:
        raise PreviewExportError("QQQ must have more than one valid rolling 10Y window")
    if qqq["mddPolicy"] != "full_period_actual":
        raise PreviewExportError(f"QQQ mddPolicy mismatch: {qqq['mddPolicy']!r}")
    if qqq["betaPolicy"] != "aligned_monthly_return_beta":
        raise PreviewExportError(f"QQQ betaPolicy mismatch: {qqq['betaPolicy']!r}")


def create_deterministic_zip(bundle_dir: Path, zip_path: Path) -> None:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(file for file in bundle_dir.rglob("*") if file.is_file()):
            relative_path = path.relative_to(bundle_dir).as_posix()
            info = zipfile.ZipInfo(relative_path, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            info.create_system = 3
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def export_app_preview(input_package: Path, output_dir: Path, shard_count: int = DEFAULT_SHARD_COUNT) -> dict[str, Any]:
    input_package = input_package.resolve()
    output_dir = output_dir.resolve()
    if shard_count < 1 or shard_count > 256 or shard_count & (shard_count - 1):
        raise PreviewExportError("--shard-count must be a power of two between 1 and 256")
    output_dir.mkdir(parents=True, exist_ok=True)

    reader = create_package_reader(input_package)
    try:
        manifest_member = find_member(reader, MANIFEST_PATTERN, "candidate manifest", exclude=("package_index",))
        readiness_member = find_member(reader, READINESS_PATTERN, "candidate readiness")
        metrics_member = find_member(reader, METRICS_OUTPUT_PATTERN, "metrics output")
        monthly_member = find_member(reader, MONTHLY_RETURNS_PATTERN, "monthly returns")
        source_audit_member = find_member(reader, SOURCE_AUDIT_PATTERN, "source audit", required=False)
        manifest = load_json_member(reader, manifest_member)
        readiness = load_json_member(reader, readiness_member)
        validate_source_package(manifest, readiness)
        raw_missing_identities = parse_raw_missing_identities(reader, source_audit_member)

        version_date = str(manifest["metricBaseDate"]).replace("-", "_")
        bundle_name = f"finple_app_preview_export_{version_date}"
        final_bundle_dir = output_dir / bundle_name
        final_zip_path = output_dir / f"{bundle_name}.zip"
        if final_bundle_dir.exists() or final_zip_path.exists():
            raise PreviewExportError(
                f"output already exists; choose an empty --output-dir or remove the prior export: {bundle_name}"
            )

        with tempfile.TemporaryDirectory(prefix="finple-app-preview-", dir=output_dir) as temp_root:
            bundle_dir = Path(temp_root) / bundle_name
            bundle_dir.mkdir(parents=True)
            overlay, metric_stats = build_metrics_overlay(
                reader,
                metrics_member,
                raw_missing_identities,
                manifest,
            )
            validate_qqq_policy(overlay["rows"])
            metrics_path = bundle_dir / "metrics-overlay.json"
            write_stable_json(metrics_path, overlay)

            monthly_index, monthly_stats, shard_paths = build_monthly_shards(
                reader,
                monthly_member,
                bundle_dir,
                manifest,
                shard_count,
            )
            monthly_index_path = bundle_dir / "monthly-returns-index.json"
            write_stable_json(monthly_index_path, monthly_index)

            missing_example = sorted(raw_missing_identities)[0]
            qa_summary = {
                "schemaVersion": EXPORT_SCHEMA_VERSION,
                "exportVersion": EXPORT_VERSION,
                "status": "review_only_ready_for_local_qa",
                "generatedAtPolicy": "deterministic_source_metric_base_date",
                "sourceCandidatePackageId": manifest["candidatePackageId"],
                "sourceCandidatePackageHash": manifest["candidatePackageHash"],
                "metricBaseDate": manifest["metricBaseDate"],
                "metricDataThroughMonth": manifest["metricDataThroughMonth"],
                "internalPreviewReviewOnly": True,
                "productionPublishReady": False,
                "appExportApproved": False,
                **metric_stats,
                **monthly_stats,
                "checks": {
                    "canonicalAssetCount6000": metric_stats["assetCount"] == 6000,
                    "marketCounts3000Each": metric_stats["marketCounts"] == {"KR": 3000, "US": 3000},
                    "krLeadingZeroPreserved": any(
                        row["identity"] == "KR:069500" for row in overlay["rows"]
                    ),
                    "krAlphanumericPreserved": any(
                        row["identity"] == "KR:0086C0" for row in overlay["rows"]
                    ),
                    "missingValuesRemainNull": True,
                    "nonFiniteValuesRejected": True,
                    "rawAndNormalizedSourcesExcluded": True,
                    "partialJulyExcluded": monthly_stats["monthlyReturnLastMonth"] <= "2026-06-30",
                    "qqqRollingCagrPolicy": True,
                    "mddFullPeriodPolicy": True,
                    "betaAlignedMonthlyReturnPolicy": True,
                },
                "representativeAssets": {
                    identity: representative_metric(overlay["rows"], identity)
                    for identity in ("US:QQQ", "US:SPY", "KR:069500", "KR:0086C0", missing_example)
                },
            }
            qa_path = bundle_dir / "app-preview-qa-summary.json"
            write_stable_json(qa_path, qa_summary)

            content_files = [metrics_path, monthly_index_path, qa_path, *shard_paths]
            content_inventory = [
                file_record(path, bundle_dir)
                for path in sorted(content_files, key=lambda item: item.relative_to(bundle_dir).as_posix())
            ]
            app_manifest = {
                "schemaVersion": EXPORT_SCHEMA_VERSION,
                "exportVersion": EXPORT_VERSION,
                "sourceCandidatePackageId": manifest["candidatePackageId"],
                "sourceCandidatePackageHash": manifest["candidatePackageHash"],
                "sourceCandidatePackageVersion": manifest.get("candidatePackageVersion"),
                "normalizationVersion": manifest.get("normalizationVersion"),
                "calculationPolicyVersion": manifest.get("calculationPolicyVersion"),
                "pipelineVersion": manifest.get("pipelineVersion"),
                "metricBaseDate": manifest["metricBaseDate"],
                "metricDataThroughMonth": manifest["metricDataThroughMonth"],
                "requestedAsOfIncluded": manifest.get("requestedAsOfIncluded"),
                "actualLastPriceDate": manifest.get("actualLastPriceDate"),
                "partialFinalMonthDetected": manifest.get("partialFinalMonthDetected"),
                "partialFinalMonthExcluded": manifest.get("partialFinalMonthExcluded"),
                "partialMonthPolicy": manifest.get("partialMonthPolicy"),
                "candidatePackageReady": True,
                "packageGlobalBlockingIssueCount": 0,
                "internalPreviewReviewOnly": True,
                "productionPublishReady": False,
                "appExportApproved": False,
                "assetCount": metric_stats["assetCount"],
                "marketAssetCounts": metric_stats["marketCounts"],
                "rawMissingAssetCount": metric_stats["rawMissingAssetCount"],
                "monthlyReturnAssetCount": monthly_stats["monthlyReturnAssetCount"],
                "monthlyReturnRowCount": monthly_stats["monthlyReturnRowCount"],
                "monthlyReturnMarketRowCounts": monthly_stats["monthlyReturnMarketRowCounts"],
                "monthlyReturnFirstMonth": monthly_stats["monthlyReturnFirstMonth"],
                "monthlyReturnLastMonth": monthly_stats["monthlyReturnLastMonth"],
                "metricsOverlay": file_record(metrics_path, bundle_dir),
                "monthlyReturnsIndex": file_record(monthly_index_path, bundle_dir),
                "qaSummary": file_record(qa_path, bundle_dir),
                "shards": monthly_index["shards"],
                "files": content_inventory,
                "excludedSourceRoles": ["raw_daily_prices", "normalized_month_end"],
            }
            app_manifest_path = bundle_dir / "app-preview-manifest.json"
            write_stable_json(app_manifest_path, app_manifest)

            shutil.move(str(bundle_dir), str(final_bundle_dir))
        create_deterministic_zip(final_bundle_dir, final_zip_path)

        result = {
            "status": "ok",
            "bundleDirectory": str(final_bundle_dir),
            "zipPath": str(final_zip_path),
            "zipSizeBytes": final_zip_path.stat().st_size,
            "zipSha256": sha256_path(final_zip_path),
            "assetCount": metric_stats["assetCount"],
            "marketAssetCounts": metric_stats["marketCounts"],
            "rawMissingAssetCount": metric_stats["rawMissingAssetCount"],
            "monthlyReturnAssetCount": monthly_stats["monthlyReturnAssetCount"],
            "monthlyReturnRowCount": monthly_stats["monthlyReturnRowCount"],
            "shardCount": monthly_stats["shardCount"],
            "metricBaseDate": manifest["metricBaseDate"],
            "metricDataThroughMonth": manifest["metricDataThroughMonth"],
            "productionPublishReady": False,
            "appExportApproved": False,
        }
        return result
    finally:
        reader.close()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create a deterministic review-only FINPLE app-preview export from a One-Click package."
    )
    parser.add_argument(
        "--input-package",
        required=True,
        type=Path,
        help="Operator-provided candidate ZIP or extracted package directory.",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        type=Path,
        help="Directory outside the repository where the export will be written.",
    )
    parser.add_argument(
        "--shard-count",
        type=int,
        default=DEFAULT_SHARD_COUNT,
        help="Power-of-two monthly-return shard count (default: 64).",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    result = export_app_preview(args.input_package, args.output_dir, args.shard_count)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
