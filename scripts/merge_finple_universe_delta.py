#!/usr/bin/env python3
"""Bounded-memory merge of sorted canonical raw data and a small universe delta."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import shutil
from pathlib import Path
from typing import Any, Iterator

from scripts.metrics_pipeline.schemas import RAW_DAILY_PRICE_COLUMNS


class StreamingMergeError(RuntimeError):
    pass


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def row_key(row: dict[str, str]) -> tuple[str, str, str]:
    key = (row.get("market", ""), row.get("ticker", ""), row.get("date", ""))
    if not all(key):
        raise StreamingMergeError("market, ticker, and date are required")
    return key


def iter_sorted(path: Path) -> tuple[list[str], Iterator[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as header_handle:
        fields = list(csv.DictReader(header_handle).fieldnames or [])

    def iterator() -> Iterator[dict[str, str]]:
        previous: tuple[str, str, str] | None = None
        with path.open(encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                key = row_key(row)
                if previous is not None and key <= previous:
                    relation = "duplicate" if key == previous else "out of order"
                    raise StreamingMergeError(f"{path.name} is {relation} at {key}")
                previous = key
                yield row

    return fields, iterator()


def streaming_merge(source: Path, delta: Path, output: Path) -> dict[str, Any]:
    if output.exists() or output.with_suffix(output.suffix + ".tmp").exists():
        raise StreamingMergeError("output or atomic temporary output already exists")
    source_fields, source_rows = iter_sorted(source)
    delta_fields, delta_rows = iter_sorted(delta)
    try:
        if source_fields != RAW_DAILY_PRICE_COLUMNS or delta_fields != RAW_DAILY_PRICE_COLUMNS:
            raise StreamingMergeError("source and delta must both use the canonical raw-daily schema")
        estimated_bytes = source.stat().st_size + delta.stat().st_size
        free_bytes = shutil.disk_usage(output.parent).free
        required_bytes = max(estimated_bytes * 2, 64 * 1024 * 1024)
        if free_bytes < required_bytes:
            raise StreamingMergeError(
                f"insufficient local disk: required={required_bytes}, free={free_bytes}"
            )
    except Exception:
        source_rows.close()  # type: ignore[attr-defined]
        delta_rows.close()  # type: ignore[attr-defined]
        raise

    temp = output.with_suffix(output.suffix + ".tmp")
    source_next = next(source_rows, None)
    delta_next = next(delta_rows, None)
    count = 0
    identity_digest = hashlib.sha256()
    try:
        with temp.open("x", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=source_fields, lineterminator="\n")
            writer.writeheader()
            while source_next is not None or delta_next is not None:
                if source_next is None:
                    selected, delta_next = delta_next, next(delta_rows, None)
                elif delta_next is None:
                    selected, source_next = source_next, next(source_rows, None)
                else:
                    source_key = row_key(source_next)
                    delta_key = row_key(delta_next)
                    if source_key == delta_key:
                        raise StreamingMergeError(f"cross-input duplicate: {source_key}")
                    if source_key < delta_key:
                        selected, source_next = source_next, next(source_rows, None)
                    else:
                        selected, delta_next = delta_next, next(delta_rows, None)
                assert selected is not None
                writer.writerow(selected)
                identity_digest.update(":".join(row_key(selected)).encode("utf-8"))
                identity_digest.update(b"\n")
                count += 1
        os.replace(temp, output)
    except Exception:
        temp.unlink(missing_ok=True)
        source_rows.close()  # type: ignore[attr-defined]
        delta_rows.close()  # type: ignore[attr-defined]
        raise
    return {
        "schemaVersion": "finple-universe-streaming-merge-v1",
        "sourceRawSha256": sha256_file(source),
        "deltaRawSha256": sha256_file(delta),
        "mergedRawSha256": sha256_file(output),
        "mergedLogicalIdentityHash": identity_digest.hexdigest(),
        "mergedRowCount": count,
        "estimatedOutputBytes": estimated_bytes,
        "requiredFreeBytes": required_bytes,
        "boundedMemory": True,
        "atomicRename": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--delta", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--reconciliation", type=Path, required=True)
    args = parser.parse_args()
    result = streaming_merge(args.source, args.delta, args.output)
    args.reconciliation.write_text(
        json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
