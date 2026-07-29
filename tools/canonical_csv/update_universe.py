"""Monthly source reconciliation that preserves manual universe settings."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

from .bootstrap_universe import (
    UNIVERSE_OUTPUT_FIELDS,
    build_universe_rows,
    load_benchmark_policy,
    write_universe,
)
from .canonical import load_canonical_source
from .universe import normalize_market, normalize_ticker


OPERATOR_MANAGED_FIELDS = frozenset(
    {
        "active",
        "includeInSimulator",
        "marketDataProvider",
        "marketDataProviderSymbol",
        "providerSymbol",
        "benchmark",
        "benchmarkProviderSymbol",
        "exposureType",
        "leverageMultiple",
        "direction",
        "resetFrequency",
        "distributionType",
        "distributionFrequency",
        "cashEventBasis",
        "cashEventNormalizationStatus",
        "cashEventNormalizationMethod",
        "distributionDataQualityStatus",
        "distributionDataQualityReason",
        "distributionDataQualityOverrideAsOfDate",
        "distributionDataQualityOverrideSourceUrl",
        "distributionDataQualityOverrideAppliedBy",
        "distributionDataQualityOverrideAppliedAt",
        "distributionDataQualityOverrideActive",
    }
)

SOURCE_MANAGED_FIELDS = frozenset(
    {
        "name",
        "underlyingTicker",
        "assetType",
        "sourceUniverse",
        "listingStatus",
        "tags",
        "marketCap",
        "aum",
        "sizeSource",
        "issuer",
        "inceptionDate",
        "firstListedDate",
        "lastTradingDate",
    }
)

SYSTEM_STATUS_FIELDS = frozenset(
    {
        "providerSymbolStatus",
        "marketDataProviderSymbolStatus",
        "benchmarkStatus",
    }
)


def _identity(row: dict[str, str]) -> str:
    market = normalize_market(row.get("market"))
    ticker = normalize_ticker(row.get("ticker"), market)
    return f"{market}:{ticker}"


def load_editable_universe(
    path: Path | str,
) -> tuple[tuple[str, ...], list[dict[str, str]]]:
    with Path(path).open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        reader = csv.DictReader(handle)
        return tuple(reader.fieldnames or ()), [
            {str(key): str(value or "") for key, value in row.items()}
            for row in reader
        ]


def update_universe_rows(
    existing_rows: list[dict[str, str]],
    source_rows: list[dict[str, str]],
) -> tuple[list[dict[str, str]], dict[str, object]]:
    existing_by_identity = {_identity(row): row for row in existing_rows}
    source_by_identity = {_identity(row): row for row in source_rows}
    output: list[dict[str, str]] = []
    changed_count = 0
    excluded_count = 0
    for existing in existing_rows:
        identity = _identity(existing)
        row = dict(existing)
        source = source_by_identity.get(identity)
        if source is None:
            row["active"] = "false"
            row["includeInSimulator"] = "false"
            row["sourcePresent"] = "false"
            row["reasonCode"] = "source_asset_removed"
            row["reasonMessage"] = (
                "asset is absent from the latest canonical source"
            )
            excluded_count += 1
        else:
            for field in SOURCE_MANAGED_FIELDS:
                if field in source:
                    value = source[field]
                    row[field] = value
            for field in OPERATOR_MANAGED_FIELDS | SYSTEM_STATUS_FIELDS:
                if field not in row and field in source:
                    row[field] = source[field]
            row["sourcePresent"] = "true"
        if row != existing:
            changed_count += 1
        output.append(row)
    new_identities = [
        identity
        for identity in source_by_identity
        if identity not in existing_by_identity
    ]
    for identity in new_identities:
        row = dict(source_by_identity[identity])
        row["active"] = "true"
        row["includeInSimulator"] = "false"
        row["sourcePresent"] = "true"
        row["reasonCode"] = "new_asset_pending_metrics"
        row["reasonMessage"] = (
            "new asset requires metrics and operator activation"
        )
        output.append(row)
    return output, {
        "existingRowCount": len(existing_rows),
        "outputRowCount": len(output),
        "newAssetCount": len(new_identities),
        "excludedAssetCount": excluded_count,
        "changedAssetCount": changed_count,
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update an editable universe without replacing manual settings",
    )
    parser.add_argument("--existing-universe", required=True)
    parser.add_argument("--source-canonical", required=True)
    parser.add_argument("--benchmark-policy", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--diff-report", required=True)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    existing_headers, existing_rows = load_editable_universe(
        args.existing_universe
    )
    source_rows, _ = build_universe_rows(
        load_canonical_source(args.source_canonical),
        load_benchmark_policy(args.benchmark_policy),
    )
    output, report = update_universe_rows(existing_rows, source_rows)
    output_fields = tuple(
        dict.fromkeys([*existing_headers, *UNIVERSE_OUTPUT_FIELDS])
    )
    output_path = Path(args.output)
    if output_fields == UNIVERSE_OUTPUT_FIELDS:
        write_universe(output_path, output)
    else:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open(
            "w",
            encoding="utf-8",
            newline="",
        ) as handle:
            writer = csv.DictWriter(
                handle,
                fieldnames=output_fields,
                extrasaction="ignore",
            )
            writer.writeheader()
            writer.writerows(output)
    Path(args.diff_report).write_text(
        f"{json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True)}\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
