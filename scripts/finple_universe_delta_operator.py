"""Fail-closed helpers for the Step 114-2ZB operator-only Colab.

This module performs local filesystem validation and command construction only.
It does not mount Drive, call a provider, run the candidate package, or deploy.
"""

from __future__ import annotations

import csv
import hashlib
from pathlib import Path
import sys
from typing import Mapping

from scripts.metrics_pipeline.schemas import RAW_DAILY_PRICE_COLUMNS


class OperatorContractError(RuntimeError):
    pass


SOURCE_FILE_NAMES = {
    "usRaw": "us_raw_daily_prices.csv",
    "krRaw": "kr_raw_daily_prices.csv",
    "krOverlay": "kr_price_metrics_overlay.csv",
}
TEMPORARY_MERGED_US_NAME = "finple-universe-v2-us-merged-raw.csv"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _read_header(path: Path) -> list[str]:
    try:
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(next(csv.reader(handle)))
    except (OSError, UnicodeError, csv.Error, StopIteration) as exc:
        raise OperatorContractError(f"source file is unreadable or empty: {path.name}") from exc


def preflight_combined_sources(combined_root: Path) -> dict[str, dict[str, object]]:
    """Validate the canonical three-file combined-folder input contract."""
    root = combined_root.resolve()
    if not root.is_dir():
        raise OperatorContractError(f"combined source directory does not exist: {combined_root}")

    inventory: dict[str, dict[str, object]] = {}
    for role, name in SOURCE_FILE_NAMES.items():
        path = root / name
        if not path.is_file() or path.is_symlink() or path.stat().st_size <= 0:
            raise OperatorContractError(f"required combined source is missing or empty: {name}")
        header = _read_header(path)
        if role in {"usRaw", "krRaw"} and header != RAW_DAILY_PRICE_COLUMNS:
            raise OperatorContractError(f"canonical raw-daily header mismatch: {name}")
        if role == "krOverlay" and not {"ticker", "benchmarkTicker"}.issubset(header):
            raise OperatorContractError("KR overlay must contain ticker and benchmarkTicker")
        inventory[role] = {
            "path": path,
            "name": name,
            "sizeBytes": path.stat().st_size,
            "sha256": sha256_file(path),
        }
    return inventory


def assert_sources_unchanged(
    inventory: Mapping[str, Mapping[str, object]],
    *,
    roles: tuple[str, ...] = ("krRaw", "krOverlay"),
) -> None:
    """Prove read-only sources retain their preflight size and SHA-256."""
    for role in roles:
        record = inventory.get(role)
        if not record:
            raise OperatorContractError(f"missing source inventory role: {role}")
        path = Path(record["path"])
        if (
            not path.is_file()
            or path.stat().st_size != record.get("sizeBytes")
            or sha256_file(path) != record.get("sha256")
        ):
            raise OperatorContractError(f"read-only source changed: {role}")


def build_candidate_prepare_command(
    *,
    repository_root: Path,
    canonical_v2: Path,
    merged_us_raw: Path,
    kr_raw: Path,
    kr_overlay: Path,
    benchmark_additions: Path,
    output_dir: Path,
    report: Path,
    metric_base_date: str,
    attempt_id: str,
    python_executable: str = sys.executable,
) -> list[str]:
    """Return the exact module command for the five operator inputs."""
    if not (repository_root / "scripts" / "prepare_monthly_metrics_candidate_inputs.py").is_file():
        raise OperatorContractError("repository root does not contain the candidate preparation module")
    if not attempt_id or any(character.isspace() for character in attempt_id):
        raise OperatorContractError("ATTEMPT_ID must be non-empty and whitespace-free")
    return [
        python_executable,
        "-m",
        "scripts.prepare_monthly_metrics_candidate_inputs",
        "--universe",
        str(canonical_v2),
        "--us-raw",
        str(merged_us_raw),
        "--kr-raw",
        str(kr_raw),
        "--kr-metrics",
        str(kr_overlay),
        "--benchmark-additions",
        str(benchmark_additions),
        "--output-dir",
        str(output_dir),
        "--report",
        str(report),
        "--metric-base-date",
        metric_base_date,
        "--as-of-included",
        metric_base_date,
        "--submission-id",
        attempt_id,
        "--operator-id",
        "colab-operator",
    ]


def cleanup_temporary_merged_us(path: Path, *, local_root: Path = Path("/content")) -> None:
    """Delete only the named local merged-US artifact after package completion."""
    root = local_root.resolve()
    candidate = path.resolve()
    if candidate.parent != root or candidate.name != TEMPORARY_MERGED_US_NAME:
        raise OperatorContractError(f"unsafe temporary merged-US cleanup target: {path}")
    if not candidate.is_file() or candidate.is_symlink():
        raise OperatorContractError(f"temporary merged-US file is missing or unsafe: {path}")
    candidate.unlink()
