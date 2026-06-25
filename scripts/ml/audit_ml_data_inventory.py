"""Create the FINPLE portfolio ML data inventory.

The script audits repository CSV/JSON sources used by the screener and
portfolio simulator. It does not modify runtime data. CSV values are read as
strings so Korean ticker leading zeros and missing-vs-zero distinctions remain
visible in the output.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


DEFAULT_SCAN_DIRS = ["src/data/tickers", "data/processed"]
DEFAULT_OUT = "data/processed/ml/finple_ml_data_inventory.json"
RUNTIME_MODULES = [
    "src/data/tickers/screenerCandidateLoader.js",
    "src/data/tickers/screenerCandidateOverlay.js",
]

REQUIRED_COLUMNS_BY_KIND = {
    "candidate": [
        "market",
        "ticker",
        "providerSymbol",
        "nameKr",
        "assetType",
        "dataStatus",
        "expectedCagr",
        "beta",
        "mdd",
        "dividendYield",
    ],
    "price_metrics_overlay": [
        "market",
        "ticker",
        "expectedCagr",
        "mdd",
        "beta",
        "dataYears",
        "metricsStatus",
        "metricsSource",
    ],
    "dividend_overlay": [
        "market",
        "ticker",
        "dividendYield",
    ],
}


def clean(value: object) -> str:
    return str(value or "").strip()


def normalize_key_part(value: object) -> str:
    return clean(value).upper()


def read_csv_rows(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = list(reader.fieldnames or [])
        rows = [dict(row) for row in reader]
    return rows, headers


def read_json(path: Path) -> object:
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def classify_file(path: Path, headers: list[str]) -> str:
    name = path.name.lower()
    header_set = set(headers)
    if "price_metrics_overlay" in name:
        return "price_metrics_overlay"
    if "dividend" in name and "dividendYield" in header_set:
        return "dividend_overlay"
    if "candidate" in name and {"market", "ticker"}.issubset(header_set):
        return "candidate"
    if {"market", "ticker", "assetType"}.issubset(header_set):
        return "asset_reference"
    return "csv"


def required_columns_for(kind: str) -> list[str]:
    return REQUIRED_COLUMNS_BY_KIND.get(kind, [])


def count_missing(rows: list[dict[str, str]], fields: Iterable[str]) -> dict[str, int]:
    return {
        field: sum(1 for row in rows if clean(row.get(field)) == "")
        for field in fields
    }


def duplicate_summary(rows: list[dict[str, str]], headers: list[str]) -> dict[str, object]:
    if "ticker" not in headers:
        return {"key": None, "duplicate_row_count": None, "duplicate_keys": []}

    key_fields = ["ticker"]
    if "market" in headers:
        key_fields = ["market", "ticker"]

    counter: Counter[str] = Counter()
    for row in rows:
        parts = [normalize_key_part(row.get(field)) for field in key_fields]
        if parts[-1]:
            counter[":".join(parts)] += 1

    duplicates = [
        {"key": key, "count": count}
        for key, count in sorted(counter.items())
        if count > 1
    ]
    return {
        "key": key_fields,
        "duplicate_row_count": sum(item["count"] - 1 for item in duplicates),
        "duplicate_keys": duplicates[:100],
    }


def column_counts(rows: list[dict[str, str]], fields: Iterable[str]) -> dict[str, dict[str, int]]:
    output: dict[str, dict[str, int]] = {}
    for field in fields:
        output[field] = dict(
            Counter(clean(row.get(field)) or "(blank)" for row in rows).most_common(100)
        )
    return output


def numeric_presence(rows: list[dict[str, str]], fields: Iterable[str]) -> dict[str, dict[str, object]]:
    output: dict[str, dict[str, object]] = {}
    for field in fields:
        if not rows:
            output[field] = {"present": 0, "missing": 0, "zero": 0, "invalid_numeric": 0}
            continue

        present = []
        invalid = []
        zero_count = 0
        for row in rows:
            text = clean(row.get(field)).replace(",", "")
            if text == "":
                continue
            present.append(text)
            try:
                number = float(text)
            except ValueError:
                invalid.append(text)
                continue
            if number == 0:
                zero_count += 1

        output[field] = {
            "present": len(present),
            "missing": len(rows) - len(present),
            "zero": zero_count,
            "invalid_numeric": len(invalid),
            "invalid_examples": invalid[:20],
        }
    return output


def extract_dates_from_name(path: Path) -> list[str]:
    dates = []
    for match in re.findall(r"(20\d{6})", path.name):
        dates.append(f"{match[0:4]}-{match[4:6]}-{match[6:8]}")
    return dates


def discover_runtime_imports(repo_root: Path, module_paths: Iterable[str]) -> dict[str, list[str]]:
    imports: dict[str, list[str]] = {}
    pattern = re.compile(r'import\s+\w+\s+from\s+"\.\/([^"]+\.(?:csv|json))\?raw"')

    for module_path in module_paths:
        absolute = repo_root / module_path
        if not absolute.exists():
            continue
        text = absolute.read_text(encoding="utf-8")
        for imported_name in pattern.findall(text):
            imported_path = str((Path(module_path).parent / imported_name).as_posix())
            imports.setdefault(imported_path, []).append(module_path)
    return imports


def discover_script_references(repo_root: Path, scripts_dir: str = "scripts") -> dict[str, list[str]]:
    references: dict[str, list[str]] = {}
    root = repo_root / scripts_dir
    if not root.exists():
        return references

    for script in sorted(root.glob("*.py")):
        text = script.read_text(encoding="utf-8", errors="ignore")
        for match in re.findall(r"[\w.-]+\.(?:csv|json)", text):
            references.setdefault(match, []).append(str(script.relative_to(repo_root).as_posix()))
    return references


def likely_generating_scripts(path: Path, script_references: dict[str, list[str]]) -> list[str]:
    candidates = set(script_references.get(path.name, []))
    stem = path.stem

    for referenced_name, scripts in script_references.items():
        if referenced_name in path.name or stem in referenced_name:
            candidates.update(scripts)

    return sorted(candidates)


def audit_csv(
    repo_root: Path,
    path: Path,
    runtime_imports: dict[str, list[str]],
    script_references: dict[str, list[str]],
) -> dict[str, object]:
    rows, headers = read_csv_rows(path)
    relative = path.relative_to(repo_root).as_posix()
    kind = classify_file(path, headers)
    required = required_columns_for(kind)
    present_required = [column for column in required if column in headers]

    count_fields = [
        field
        for field in ["market", "assetType", "dataStatus", "metricsStatus", "reviewTag", "dividendPolicy"]
        if field in headers
    ]

    numeric_fields = [
        field
        for field in [
            "expectedCagr",
            "priceCagr10y",
            "beta",
            "mdd",
            "dataYears",
            "dividendYield",
            "marketCap",
            "aum",
        ]
        if field in headers
    ]

    return {
        "path": relative,
        "kind": kind,
        "runtime_imported_by": runtime_imports.get(relative, []),
        "is_runtime_imported": relative in runtime_imports,
        "likely_generating_scripts": likely_generating_scripts(path, script_references),
        "file_size_bytes": path.stat().st_size,
        "data_dates_from_filename": extract_dates_from_name(path),
        "row_count": len(rows),
        "column_count": len(headers),
        "columns": headers,
        "required_columns": required,
        "missing_required_columns": [column for column in required if column not in headers],
        "missing_required_values": count_missing(rows, present_required),
        "duplicate_summary": duplicate_summary(rows, headers),
        "distribution": column_counts(rows, count_fields),
        "numeric_presence": numeric_presence(rows, numeric_fields),
    }


def audit_json(
    repo_root: Path,
    path: Path,
    runtime_imports: dict[str, list[str]],
    script_references: dict[str, list[str]],
) -> dict[str, object]:
    relative = path.relative_to(repo_root).as_posix()
    payload = read_json(path)

    summary: dict[str, object] = {
        "path": relative,
        "kind": "json",
        "runtime_imported_by": runtime_imports.get(relative, []),
        "is_runtime_imported": relative in runtime_imports,
        "likely_generating_scripts": likely_generating_scripts(path, script_references),
        "file_size_bytes": path.stat().st_size,
        "data_dates_from_filename": extract_dates_from_name(path),
        "json_type": type(payload).__name__,
    }

    if isinstance(payload, dict):
        summary["top_level_keys"] = sorted(payload.keys())
    elif isinstance(payload, list):
        summary["item_count"] = len(payload)
        summary["first_item_keys"] = sorted(payload[0].keys()) if payload and isinstance(payload[0], dict) else []

    return summary


def build_runtime_flow(repo_root: Path, runtime_imports: dict[str, list[str]]) -> dict[str, object]:
    candidate_path = repo_root / "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv"
    us_price_path = repo_root / "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv"
    kr_price_path = repo_root / "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv"

    required_paths = [candidate_path, us_price_path, kr_price_path]
    missing_paths = [str(path.relative_to(repo_root).as_posix()) for path in required_paths if not path.exists()]
    if missing_paths:
        raise SystemExit(f"Required runtime source missing: {', '.join(missing_paths)}")

    candidate_rows, _ = read_csv_rows(candidate_path)
    us_price_rows, _ = read_csv_rows(us_price_path)
    kr_price_rows, _ = read_csv_rows(kr_price_path)

    def key(row: dict[str, str]) -> str:
        market = normalize_key_part(row.get("market")) or "US"
        ticker = normalize_key_part(row.get("ticker"))
        return f"{market}:{ticker}" if ticker else ""

    app_ready_keys = {key(row) for row in us_price_rows + kr_price_rows if key(row)}
    candidate_keys = [key(row) for row in candidate_rows if key(row)]
    app_ready_candidates = [row for row in candidate_rows if key(row) in app_ready_keys]

    return {
        "description": "Current screener/simulator candidate flow inferred from screenerCandidateLoader.js and screenerCandidateOverlay.js.",
        "runtime_modules": RUNTIME_MODULES,
        "runtime_imports": runtime_imports,
        "base_candidate_file": "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv",
        "price_metrics_app_ready_files": [
            "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv",
            "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv",
        ],
        "raw_candidate_count": len(candidate_rows),
        "app_ready_price_metric_key_count": len(app_ready_keys),
        "app_ready_candidate_count": len(app_ready_candidates),
        "excluded_by_missing_price_metrics_count": len(candidate_rows) - len(app_ready_candidates),
        "app_ready_market_counts": dict(Counter(clean(row.get("market")).upper() or "UNKNOWN" for row in app_ready_candidates)),
        "candidate_duplicate_summary": {
            "market_ticker_duplicate_count": len(candidate_keys) - len(set(candidate_keys)),
        },
    }


def collect_files(repo_root: Path, scan_dirs: Iterable[str], excluded_paths: Iterable[Path]) -> list[Path]:
    output: list[Path] = []
    excluded = {path.resolve() for path in excluded_paths}
    for scan_dir in scan_dirs:
        root = repo_root / scan_dir
        if not root.exists():
            raise SystemExit(f"Scan directory not found: {scan_dir}")
        output.extend(
            sorted(
                path
                for path in root.rglob("*")
                if path.suffix.lower() in {".csv", ".json"} and path.resolve() not in excluded
            )
        )
    return output


def build_inventory(repo_root: Path, scan_dirs: list[str], out_path: Path) -> dict[str, object]:
    runtime_imports = discover_runtime_imports(repo_root, RUNTIME_MODULES)
    script_references = discover_script_references(repo_root)
    files = collect_files(repo_root, scan_dirs, [out_path])

    summaries = []
    for path in files:
        if path.suffix.lower() == ".csv":
            summaries.append(audit_csv(repo_root, path, runtime_imports, script_references))
        elif path.suffix.lower() == ".json":
            summaries.append(audit_json(repo_root, path, runtime_imports, script_references))

    csv_summaries = [summary for summary in summaries if str(summary.get("path", "")).endswith(".csv")]
    runtime_csvs = [summary for summary in csv_summaries if summary.get("is_runtime_imported")]

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "repository": "vip930sw/FINPLE",
        "scan_dirs": scan_dirs,
        "runtime_flow": build_runtime_flow(repo_root, runtime_imports),
        "summary": {
            "file_count": len(summaries),
            "csv_count": len(csv_summaries),
            "json_count": len(summaries) - len(csv_summaries),
            "runtime_imported_file_count": len(runtime_csvs),
            "runtime_imported_files": [summary["path"] for summary in runtime_csvs],
        },
        "files": summaries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit FINPLE portfolio ML data sources.")
    parser.add_argument("--repo-root", default=".", help="Repository root path.")
    parser.add_argument("--scan-dir", action="append", default=[], help="Directory to scan. Can be provided multiple times.")
    parser.add_argument("--out", default=DEFAULT_OUT, help="Output JSON path.")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    scan_dirs = args.scan_dir or DEFAULT_SCAN_DIRS
    out_path = (repo_root / args.out).resolve()
    inventory = build_inventory(repo_root, scan_dirs, out_path)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Saved ML data inventory: {out_path.relative_to(repo_root).as_posix()}")
    print(json.dumps(inventory["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
