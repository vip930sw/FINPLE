"""FINPLE reusable CSV audit utility.

Use this script before merging any candidate, dividend, or metrics CSV.
It intentionally uses only the Python standard library so it can run in
Colab, local Python, or GitHub Codespaces without extra installs.

Examples
--------
python scripts/finple_csv_audit.py \
  --csv src/data/tickers/finple_app_candidates_6000_balanced_v1.csv \
  --key market,ticker \
  --numeric expectedCagr,beta,mdd,dividendYield \
  --required market,ticker,nameKr,assetType,dataStatus \
  --out data/processed/audit_candidate_6000.json

python scripts/finple_csv_audit.py \
  --csv data/processed/kr_dividend_yield_override_v2_2_3.csv \
  --key market,ticker \
  --numeric dividendYield \
  --required market,ticker,assetType,dividendYield \
  --out data/processed/audit_kr_dividend_override_v2_2_3.json
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path
from typing import Iterable


def clean(value: object) -> str:
    return str(value or "").strip()


def split_arg(value: str) -> list[str]:
    return [item.strip() for item in clean(value).split(",") if item.strip()]


def is_number(value: object) -> bool:
    text = clean(value).replace(",", "")
    if text == "":
        return False
    try:
        float(text)
        return True
    except ValueError:
        return False


def read_csv(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = list(reader.fieldnames or [])
        rows = [dict(row) for row in reader]
    return rows, headers


def build_key(row: dict[str, str], fields: Iterable[str]) -> str:
    parts = []
    for field in fields:
        value = clean(row.get(field))
        if field.lower() in {"market", "ticker", "providersymbol"}:
            value = value.upper()
        parts.append(value)
    return ":".join(parts)


def count_missing(rows: list[dict[str, str]], fields: Iterable[str]) -> dict[str, int]:
    return {field: sum(1 for row in rows if clean(row.get(field)) == "") for field in fields}


def numeric_summary(rows: list[dict[str, str]], fields: Iterable[str]) -> dict[str, object]:
    result: dict[str, object] = {}
    for field in fields:
        values = [clean(row.get(field)) for row in rows]
        present = [value for value in values if value != ""]
        invalid = [value for value in present if not is_number(value)]
        numeric = [float(value.replace(",", "")) for value in present if is_number(value)]
        result[field] = {
            "present": len(present),
            "missing": len(rows) - len(present),
            "invalid_numeric": len(invalid),
            "min": min(numeric) if numeric else None,
            "max": max(numeric) if numeric else None,
            "invalid_examples": invalid[:20],
        }
    return result


def duplicate_summary(rows: list[dict[str, str]], key_fields: list[str]) -> dict[str, object]:
    if not key_fields:
        return {"duplicate_count": None, "duplicate_keys": {}}
    counter = Counter(build_key(row, key_fields) for row in rows)
    duplicates = {key: count for key, count in counter.items() if key and count > 1}
    return {
        "duplicate_count": sum(count - 1 for count in duplicates.values()),
        "duplicate_keys": dict(sorted(duplicates.items())[:100]),
    }


def column_counts(rows: list[dict[str, str]], fields: Iterable[str]) -> dict[str, dict[str, int]]:
    output: dict[str, dict[str, int]] = {}
    for field in fields:
        output[field] = dict(Counter(clean(row.get(field)) or "(blank)" for row in rows).most_common(50))
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit FINPLE CSV files.")
    parser.add_argument("--csv", required=True, help="CSV file path.")
    parser.add_argument("--key", default="market,ticker", help="Comma-separated key fields for duplicate check.")
    parser.add_argument("--required", default="", help="Comma-separated required columns.")
    parser.add_argument("--numeric", default="", help="Comma-separated numeric columns.")
    parser.add_argument("--count", default="market,assetType,dataStatus,reviewTag", help="Comma-separated columns to count.")
    parser.add_argument("--out", default="", help="Optional JSON output path.")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise SystemExit(f"CSV not found: {csv_path}")

    rows, headers = read_csv(csv_path)
    required = split_arg(args.required)
    numeric = split_arg(args.numeric)
    key_fields = split_arg(args.key)
    count_fields = [field for field in split_arg(args.count) if field in headers]

    summary = {
        "csv_path": str(csv_path),
        "row_count": len(rows),
        "header_count": len(headers),
        "headers": headers,
        "missing_required_columns": [field for field in required if field not in headers],
        "missing_required_values": count_missing(rows, [field for field in required if field in headers]),
        "numeric_summary": numeric_summary(rows, [field for field in numeric if field in headers]),
        "duplicates": duplicate_summary(rows, [field for field in key_fields if field in headers]),
        "column_counts": column_counts(rows, count_fields),
    }

    text = json.dumps(summary, ensure_ascii=False, indent=2)
    print(text)

    if args.out:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(text + "\n", encoding="utf-8")
        print(f"Saved audit summary: {out_path}")


if __name__ == "__main__":
    main()
