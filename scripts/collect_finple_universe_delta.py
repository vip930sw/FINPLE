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
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

from finple_universe_v2 import V2_FIELDS


class DeltaCollectionError(RuntimeError):
    pass


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
        rows = [
            row
            for row in csv.DictReader(handle)
            if f"{row['market']}:{row['ticker']}" in new_identities
        ]
    if len(rows) != int(reconciliation.get("newIdentityCount", -1)):
        raise DeltaCollectionError("canonical additions do not match reconciliation")
    if any(row.get("market") != "US" for row in rows):
        raise DeltaCollectionError("Step 114-2ZB permits US additions only")
    if any(row.get("active", "").lower() != "true" or row.get("listingStatus") != "active" for row in rows):
        raise DeltaCollectionError("collector accepts officially verified active additions only")
    if any(not row.get("officialSourceUrl", "").startswith("https://") for row in rows):
        raise DeltaCollectionError("official source evidence is missing")
    return rows


def default_fetcher(ticker: str, start: str) -> list[dict[str, Any]]:
    """Credential-free operator path. Imported only when the operator runs it."""
    try:
        import yfinance as yf  # type: ignore
    except ImportError as exc:
        raise DeltaCollectionError("yfinance is required in the operator runtime") from exc
    frame = yf.download(ticker, start=start, auto_adjust=False, progress=False, actions=True)
    if frame.empty:
        return []
    rows: list[dict[str, Any]] = []
    for timestamp, values in frame.iterrows():
        def scalar(name: str) -> Any:
            value = values.get(name)
            if hasattr(value, "iloc"):
                value = value.iloc[0]
            return value

        close = scalar("Close")
        if close is None:
            continue
        rows.append(
            {
                "market": "US",
                "ticker": ticker,
                "date": timestamp.strftime("%Y-%m-%d"),
                "open": scalar("Open"),
                "high": scalar("High"),
                "low": scalar("Low"),
                "close": close,
                "adjClose": scalar("Adj Close"),
                "volume": scalar("Volume"),
                "dividend": scalar("Dividends") or 0,
                "stockSplit": scalar("Stock Splits") or 0,
            }
        )
    return rows


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
        if not resume or not manifest_path.is_file():
            raise DeltaCollectionError(f"target version already exists: {target_version}")
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        expected = {
            "targetUniverseVersion": target_version,
            "canonicalUniverseSha256": canonical_sha,
            "reconciliationSha256": reconciliation_sha,
        }
        if any(manifest.get(key) != value for key, value in expected.items()):
            raise DeltaCollectionError("--resume refused: target version or input SHA mismatch")
        return manifest

    reconciliation = json.loads(reconciliation_path.read_text(encoding="utf-8"))
    additions = load_additions(canonical_path, reconciliation_path)
    output_dir.mkdir(parents=True)
    created: list[Path] = []
    try:
        additions_path = output_dir / "candidate-additions.csv"
        write_csv(additions_path, additions, V2_FIELDS)
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
                        key: row.get(key) or None
                        for key in (
                            "ticker",
                            "issuer",
                            "inceptionDate",
                            "officialSourceUrl",
                            "sourceId",
                            "sourceCheckedAt",
                            "listingStatus",
                            "active",
                        )
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
            raw_rows.extend(rows)
        raw_rows.sort(key=lambda row: (row["market"], row["ticker"], row["date"]))
        raw_path = output_dir / "us-new-assets-raw-daily.csv"
        raw_fields = [
            "market", "ticker", "date", "open", "high", "low", "close",
            "adjClose", "volume", "dividend", "stockSplit",
        ]
        write_csv(raw_path, raw_rows, raw_fields)
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
