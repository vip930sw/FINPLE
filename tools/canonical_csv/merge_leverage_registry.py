from __future__ import annotations

import argparse
import csv
import hashlib
import tempfile
from pathlib import Path

from tools.canonical_csv.bootstrap_universe import (
    DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
    load_leverage_metadata_registry,
)


EXPECTED_KR_COUNT = 88
EXPECTED_KR_IDENTITY_HASH = (
    "1f7cc74ee27968987927da6d8451b8af9c240dec3ec26921d6e4f5de62af8345"
)
EXPECTED_TOTAL_COUNT = 102


def _read_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or ()), list(reader)


def _identities(rows: list[dict[str, str]], *, market: str) -> list[str]:
    return sorted(
        f"{row['market'].strip().upper()}:{row['ticker'].strip().upper()}"
        for row in rows
        if row.get("market", "").strip().upper() == market
    )


def _identity_hash(identities: list[str]) -> str:
    return hashlib.sha256("\n".join(identities).encode("utf-8")).hexdigest()


def merge_registry(
    worklist_path: Path,
    resolutions_path: Path,
    registry_path: Path = DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
) -> list[dict[str, str]]:
    headers, existing = _read_rows(registry_path)
    _, worklist = _read_rows(worklist_path)
    resolution_headers, resolutions = _read_rows(resolutions_path)
    kr_worklist = _identities(worklist, market="KR")
    kr_resolved = _identities(resolutions, market="KR")
    if (
        len(kr_worklist) != EXPECTED_KR_COUNT
        or _identity_hash(kr_worklist) != EXPECTED_KR_IDENTITY_HASH
    ):
        raise ValueError("Korean worklist identity contract changed")
    if kr_resolved != kr_worklist:
        raise ValueError("Korean resolution identities do not match worklist")
    if set(resolution_headers) != set(headers):
        raise ValueError("resolution schema does not match registry")

    by_identity = {
        f"{row['market'].strip().upper()}:{row['ticker'].strip().upper()}": row
        for row in existing
    }
    by_identity.update(
        {
            f"{row['market'].strip().upper()}:{row['ticker'].strip().upper()}": row
            for row in resolutions
        }
    )
    merged = [by_identity[identity] for identity in sorted(by_identity)]
    if len(merged) != EXPECTED_TOTAL_COUNT:
        raise ValueError("merged registry row count must be 102")

    with tempfile.TemporaryDirectory() as temporary:
        validation_path = Path(temporary) / "registry.csv"
        with validation_path.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=headers,
                lineterminator="\n",
            )
            writer.writeheader()
            writer.writerows(merged)
        load_leverage_metadata_registry(validation_path)
    return merged


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--worklist", type=Path, required=True)
    parser.add_argument("--resolutions", type=Path, required=True)
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
    )
    args = parser.parse_args()
    merged = merge_registry(args.worklist, args.resolutions, args.registry)
    headers, _ = _read_rows(args.registry)
    with args.registry.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=headers,
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(merged)
    print(
        f"registry_rows={len(merged)} kr_resolved={EXPECTED_KR_COUNT} "
        f"kr_identity_sha256={EXPECTED_KR_IDENTITY_HASH}"
    )


if __name__ == "__main__":
    main()
