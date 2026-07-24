#!/usr/bin/env python3
"""Operator-only collector for a versioned FINPLE universe delta.

The command intentionally accepts additions only. It never reads or refetches the
existing 6,000-asset provider universe and never overwrites a version directory.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

from finple_universe_v2 import CANONICAL_FIELDS
from raw_daily_price_chunks import extract_raw_daily_rows, write_raw_daily_rows
from scripts.metrics_pipeline.schemas import RAW_DAILY_PRICE_COLUMNS


class DeltaCollectionError(RuntimeError):
    pass


CHECKSUM_FILE = "checksums.sha256"
CHECKSUM_COVERED_FILES = {
    "benchmark-additions.csv",
    "candidate-additions.csv",
    "collection-summary.json",
    "rejected-or-inactive-assets.csv",
    "source-evidence.json",
    "universe-delta-manifest.json",
    "us-new-assets-raw-daily.csv",
}
EXPECTED_ARTIFACT_FILES = CHECKSUM_COVERED_FILES | {CHECKSUM_FILE}
CHECKSUM_LINE = re.compile(r"^([0-9a-f]{64})  ([A-Za-z0-9][A-Za-z0-9._-]*)$")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stable_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def write_csv(path: Path, rows: Iterable[dict[str, Any]], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def load_additions(canonical_path: Path, reconciliation_path: Path) -> list[dict[str, str]]:
    reconciliation = json.loads(reconciliation_path.read_text(encoding="utf-8"))
    new_identities = set(reconciliation.get("newIdentities") or [])
    with canonical_path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != CANONICAL_FIELDS:
            raise DeltaCollectionError("canonical universe header mismatch")
        rows = [row for row in reader if f"{row['market']}:{row['ticker']}" in new_identities]
    if len(rows) != int(reconciliation.get("newIdentityCount", -1)):
        raise DeltaCollectionError("canonical additions do not match reconciliation")
    if len(rows) != 29:
        raise DeltaCollectionError("Step 114-2ZB requires exactly 29 canonical additions")
    identities = [f"{row['market']}:{row['ticker']}" for row in rows]
    if len(identities) != len(set(identities)):
        raise DeltaCollectionError("canonical additions contain duplicate identities")
    if set(identities) != new_identities:
        raise DeltaCollectionError("canonical additions identity set does not match reconciliation")
    if any(row.get("market") != "US" for row in rows):
        raise DeltaCollectionError("Step 114-2ZB permits US additions only")
    if any(row.get("active", "").lower() != "true" or row.get("listingStatus") != "active" for row in rows):
        raise DeltaCollectionError("collector accepts officially verified active additions only")
    if any(not row.get("officialSourceUrl", "").startswith("https://") for row in rows):
        raise DeltaCollectionError("official source evidence is missing")
    return rows


def adapt_yfinance_history(
    ticker: str,
    frame: Any,
    *,
    retrieved_at: str,
) -> list[dict[str, str]]:
    """Map downloaded yfinance fields to the canonical raw-daily contract.

    This adapter never serializes the provider DataFrame or its original
    payload. Yahoo ``Close`` is the split-adjusted close when
    ``auto_adjust=False``; ``Adj Close`` is used as the total-return-adjusted
    reference only when the complete valid series is available. Missing
    optional volume/dividend values remain blank while real zero values remain
    ``0``. Yahoo's zero or absent no-split event maps to canonical neutral
    ``splitFactor=1`` rather than a false split.
    """
    return extract_raw_daily_rows(
        frame,
        market="US",
        ticker=ticker,
        currency="USD",
        retrieved_at=retrieved_at,
        source_id="yfinance",
        provider_or_institution="Yahoo Finance via yfinance",
    )


def default_fetcher(ticker: str, start: str) -> list[dict[str, Any]]:
    """Credential-free operator path. Imported only when the operator runs it."""
    try:
        import yfinance as yf  # type: ignore
    except ImportError as exc:
        raise DeltaCollectionError("yfinance is required in the operator runtime") from exc
    frame = yf.download(ticker, start=start, auto_adjust=False, progress=False, actions=True)
    if frame.empty:
        return []
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return adapt_yfinance_history(ticker, frame, retrieved_at=retrieved_at)


def read_json_object(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise DeltaCollectionError(f"--resume refused: malformed {label}") from exc
    if not isinstance(value, dict):
        raise DeltaCollectionError(f"--resume refused: malformed {label}")
    return value


def read_checksum_manifest(output_dir: Path) -> dict[str, str]:
    checksum_path = output_dir / CHECKSUM_FILE
    try:
        lines = checksum_path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeError) as exc:
        raise DeltaCollectionError("--resume refused: checksums.sha256 is missing or unreadable") from exc
    checksums: dict[str, str] = {}
    if not lines:
        raise DeltaCollectionError("--resume refused: checksums.sha256 is empty")
    for line in lines:
        match = CHECKSUM_LINE.fullmatch(line)
        if not match:
            raise DeltaCollectionError("--resume refused: malformed checksums.sha256")
        digest, name = match.groups()
        if name in checksums:
            raise DeltaCollectionError("--resume refused: duplicate checksum entry")
        checksums[name] = digest
    if set(checksums) != CHECKSUM_COVERED_FILES:
        raise DeltaCollectionError("--resume refused: checksum file set mismatch")
    for name, expected_digest in checksums.items():
        path = output_dir / name
        if not path.is_file() or sha256_file(path) != expected_digest:
            raise DeltaCollectionError(f"--resume refused: checksum mismatch for {name}")
    return checksums


def read_csv_rows(path: Path, expected_fields: list[str], label: str) -> list[dict[str, str]]:
    try:
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            if reader.fieldnames != expected_fields:
                raise DeltaCollectionError(f"--resume refused: {label} header mismatch")
            rows = list(reader)
            if any(None in row or any(value is None for value in row.values()) for row in rows):
                raise DeltaCollectionError(f"--resume refused: malformed {label}")
            return rows
    except (OSError, UnicodeError, csv.Error) as exc:
        raise DeltaCollectionError(f"--resume refused: malformed {label}") from exc


def validate_resume_artifacts(
    output_dir: Path,
    *,
    canonical_path: Path,
    reconciliation_path: Path,
    target_version: str,
    canonical_sha: str,
    reconciliation_sha: str,
) -> dict[str, Any]:
    try:
        entries = list(output_dir.iterdir())
    except OSError as exc:
        raise DeltaCollectionError("--resume refused: artifact directory is unreadable") from exc
    actual_files = {entry.name for entry in entries if entry.is_file()}
    if actual_files != EXPECTED_ARTIFACT_FILES or any(not entry.is_file() for entry in entries):
        raise DeltaCollectionError("--resume refused: artifact file set mismatch")
    read_checksum_manifest(output_dir)

    manifest = read_json_object(output_dir / "universe-delta-manifest.json", "manifest")
    expected_manifest = {
        "targetUniverseVersion": target_version,
        "canonicalUniverseSha256": canonical_sha,
        "reconciliationSha256": reconciliation_sha,
    }
    if any(manifest.get(key) != value for key, value in expected_manifest.items()):
        raise DeltaCollectionError("--resume refused: target version or input SHA mismatch")

    expected_additions = load_additions(canonical_path, reconciliation_path)
    additions = read_csv_rows(
        output_dir / "candidate-additions.csv",
        CANONICAL_FIELDS,
        "candidate additions",
    )
    addition_identities = [(row["market"], row["ticker"]) for row in additions]
    if (
        len(additions) != 29
        or len(addition_identities) != len(set(addition_identities))
        or additions != expected_additions
        or manifest.get("additionCount") != len(additions)
    ):
        raise DeltaCollectionError("--resume refused: candidate additions reconciliation mismatch")

    raw_rows = read_csv_rows(
        output_dir / "us-new-assets-raw-daily.csv",
        RAW_DAILY_PRICE_COLUMNS,
        "raw daily",
    )
    raw_keys = [(row["market"], row["ticker"], row["date"]) for row in raw_rows]
    if len(raw_keys) != len(set(raw_keys)) or raw_keys != sorted(raw_keys):
        raise DeltaCollectionError("--resume refused: raw daily identities are duplicate or unsorted")

    summary = read_json_object(output_dir / "collection-summary.json", "collection summary")
    evidence = read_json_object(output_dir / "source-evidence.json", "source evidence")
    assets = evidence.get("assets")
    unavailable = summary.get("priceUnavailableTickers")
    raw_asset_count = len({(row["market"], row["ticker"]) for row in raw_rows})
    if (
        summary.get("targetUniverseVersion") != target_version
        or summary.get("requestedAssetCount") != len(additions)
        or summary.get("rawDailyRowCount") != len(raw_rows)
        or summary.get("priceCoveredAssetCount") != raw_asset_count
        or not isinstance(unavailable, list)
        or summary.get("priceUnavailableAssetCount") != len(unavailable)
        or raw_asset_count + len(unavailable) != len(additions)
        or len(unavailable) != len(set(unavailable))
        or evidence.get("targetUniverseVersion") != target_version
        or not isinstance(assets, list)
        or len(assets) != len(additions)
    ):
        raise DeltaCollectionError("--resume refused: artifact count reconciliation mismatch")
    evidence_tickers = [asset.get("verifiedTicker") for asset in assets if isinstance(asset, dict)]
    if set(evidence_tickers) != {row["ticker"] for row in additions} or len(evidence_tickers) != len(set(evidence_tickers)):
        raise DeltaCollectionError("--resume refused: source evidence identity mismatch")
    return manifest


def collect_delta(
    canonical_path: Path,
    reconciliation_path: Path,
    root: Path,
    target_version: str,
    *,
    resume: bool = False,
    fetcher: Callable[[str, str], list[dict[str, Any]]] = default_fetcher,
) -> dict[str, Any]:
    output_dir = root / "universe-deltas" / target_version
    canonical_sha = sha256_file(canonical_path)
    reconciliation_sha = sha256_file(reconciliation_path)
    manifest_path = output_dir / "universe-delta-manifest.json"
    if output_dir.exists():
        if not resume:
            raise DeltaCollectionError(f"target version already exists: {target_version}")
        return validate_resume_artifacts(
            output_dir,
            canonical_path=canonical_path,
            reconciliation_path=reconciliation_path,
            target_version=target_version,
            canonical_sha=canonical_sha,
            reconciliation_sha=reconciliation_sha,
        )

    reconciliation = json.loads(reconciliation_path.read_text(encoding="utf-8"))
    additions = load_additions(canonical_path, reconciliation_path)
    output_dir.mkdir(parents=True)
    created: list[Path] = []
    try:
        additions_path = output_dir / "candidate-additions.csv"
        write_csv(additions_path, additions, CANONICAL_FIELDS)
        created.append(additions_path)

        benchmark_rows = [
            {"market": "US", "ticker": row["ticker"], "benchmarkKey": "US:SPY"}
            for row in additions
        ]
        benchmark_path = output_dir / "benchmark-additions.csv"
        write_csv(benchmark_path, benchmark_rows, ["market", "ticker", "benchmarkKey"])
        created.append(benchmark_path)

        evidence_path = output_dir / "source-evidence.json"
        stable_json(
            evidence_path,
            {
                "schemaVersion": "finple-universe-source-evidence-v1",
                "targetUniverseVersion": target_version,
                "assets": [
                    {
                        "verificationMethod": "manual_official_page_review",
                        "verifiedTicker": row["ticker"],
                        "verifiedPageTitle": row["nameKr"],
                        "officialProductName": row["nameKr"],
                        "officialSourceUrl": row["officialSourceUrl"],
                        "sourceCheckedAt": row["sourceCheckedAt"],
                        "listingStatus": row["listingStatus"],
                        "active": row["active"].lower() == "true",
                        "issuer": row["issuer"],
                        "inceptionDate": row["inceptionDate"],
                        "sourceId": row["sourceId"],
                    }
                    for row in additions
                ],
            },
        )
        created.append(evidence_path)

        rejected_path = output_dir / "rejected-or-inactive-assets.csv"
        write_csv(rejected_path, [], ["ticker", "reason", "officialSourceUrl", "sourceCheckedAt"])
        created.append(rejected_path)

        raw_rows: list[dict[str, Any]] = []
        unavailable: list[str] = []
        for row in additions:
            rows = fetcher(row["ticker"], row["inceptionDate"] or "2000-01-01")
            if not rows:
                unavailable.append(row["ticker"])
                continue
            for raw_row in rows:
                if set(raw_row) != set(RAW_DAILY_PRICE_COLUMNS):
                    raise DeltaCollectionError(
                        f"fetcher must return the canonical raw schema for {row['ticker']}"
                    )
                if raw_row["market"] != "US" or raw_row["ticker"] != row["ticker"]:
                    raise DeltaCollectionError(
                        f"fetcher returned an unexpected identity for {row['ticker']}"
                    )
            raw_rows.extend(rows)
        raw_rows.sort(key=lambda row: (row["market"], row["ticker"], row["date"]))
        raw_path = output_dir / "us-new-assets-raw-daily.csv"
        try:
            write_raw_daily_rows(raw_path, raw_rows)
        except ValueError as exc:
            raise DeltaCollectionError(f"canonical raw output validation failed: {exc}") from exc
        created.append(raw_path)

        summary_path = output_dir / "collection-summary.json"
        stable_json(
            summary_path,
            {
                "schemaVersion": "finple-universe-delta-collection-v1",
                "targetUniverseVersion": target_version,
                "requestedAssetCount": len(additions),
                "priceCoveredAssetCount": len(additions) - len(unavailable),
                "priceUnavailableAssetCount": len(unavailable),
                "priceUnavailableTickers": unavailable,
                "rawDailyRowCount": len(raw_rows),
                "gapsForwardFilled": False,
                "collectedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
            },
        )
        created.append(summary_path)

        manifest = {
            "schemaVersion": "finple-universe-delta-manifest-v1",
            "targetUniverseVersion": target_version,
            "canonicalUniverseSha256": canonical_sha,
            "reconciliationSha256": reconciliation_sha,
            "additionCount": len(additions),
            "sourceAssetCount": int(reconciliation.get("sourceAssetCount", 0)),
            "collectionStatus": "complete" if not unavailable else "price_unavailable_review_required",
            "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        }
        stable_json(manifest_path, manifest)
        created.append(manifest_path)

        checksum_path = output_dir / "checksums.sha256"
        checksum_lines = [
            f"{sha256_file(path)}  {path.name}"
            for path in sorted(created, key=lambda item: item.name)
        ]
        checksum_path.write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")
        return manifest
    except Exception:
        for path in reversed(created):
            path.unlink(missing_ok=True)
        try:
            output_dir.rmdir()
        except OSError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--canonical", type=Path, required=True)
    parser.add_argument("--reconciliation", type=Path, required=True)
    parser.add_argument("--drive-root", type=Path, required=True)
    parser.add_argument("--target-version", required=True)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()
    manifest = collect_delta(
        args.canonical,
        args.reconciliation,
        args.drive_root,
        args.target_version,
        resume=args.resume,
    )
    print(json.dumps(manifest, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
