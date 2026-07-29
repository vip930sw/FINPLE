from __future__ import annotations

import argparse
import csv
import hashlib
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from tools.canonical_csv.bootstrap_universe import (
    DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
    load_leverage_metadata_registry,
)


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


def _assert_unique(rows: list[dict[str, str]], label: str) -> None:
    identities = [
        f"{row.get('market', '').strip().upper()}:"
        f"{row.get('ticker', '').strip().upper()}"
        for row in rows
    ]
    if len(identities) != len(set(identities)):
        raise ValueError(f"duplicate market+ticker in {label}")


def merge_registry(
    worklist_path: Path,
    resolutions_path: Path,
    registry_path: Path = DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
    *,
    market: str,
    expected_count: int,
    expected_identity_hash: str,
    expected_total_count: int,
) -> list[dict[str, str]]:
    market = market.strip().upper()
    headers, existing = _read_rows(registry_path)
    _, worklist = _read_rows(worklist_path)
    resolution_headers, resolutions = _read_rows(resolutions_path)
    _assert_unique(existing, "registry")
    _assert_unique(worklist, "worklist")
    _assert_unique(resolutions, "resolutions")
    if any(
        row.get("market", "").strip().upper() != market
        for row in resolutions
    ):
        raise ValueError(f"{market} resolution file must contain {market} rows only")
    now = datetime.now(timezone.utc)
    for row in resolutions:
        try:
            verified_at = datetime.fromisoformat(row.get("verifiedAt", ""))
        except ValueError as error:
            raise ValueError(f"invalid {market} resolution verifiedAt") from error
        if (
            verified_at.utcoffset() is None
            or verified_at.astimezone(timezone.utc) > now + timedelta(minutes=5)
        ):
            raise ValueError(
                f"{market} resolution verifiedAt must be timezone-aware "
                "and not in the future"
            )
    worklist_identities = _identities(worklist, market=market)
    resolved_identities = _identities(resolutions, market=market)
    if (
        len(worklist_identities) != expected_count
        or _identity_hash(worklist_identities) != expected_identity_hash
    ):
        raise ValueError(f"{market} worklist identity contract changed")
    if resolved_identities != worklist_identities:
        raise ValueError(f"{market} resolution identities do not match worklist")
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
    if len(merged) != expected_total_count:
        raise ValueError(
            f"merged registry row count must be {expected_total_count}"
        )

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
    parser.add_argument("--market", required=True)
    parser.add_argument("--expected-count", type=int, required=True)
    parser.add_argument("--expected-identity-hash", required=True)
    parser.add_argument("--expected-total-count", type=int, required=True)
    parser.add_argument(
        "--registry",
        type=Path,
        default=DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
    )
    args = parser.parse_args()
    merged = merge_registry(
        args.worklist,
        args.resolutions,
        args.registry,
        market=args.market,
        expected_count=args.expected_count,
        expected_identity_hash=args.expected_identity_hash,
        expected_total_count=args.expected_total_count,
    )
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
        f"registry_rows={len(merged)} market={args.market.upper()} "
        f"resolved={args.expected_count} "
        f"identity_sha256={args.expected_identity_hash}"
    )


if __name__ == "__main__":
    main()
