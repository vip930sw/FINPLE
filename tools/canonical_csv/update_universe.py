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
    }
)

LEVERAGE_REGISTRY_MANAGED_FIELDS = frozenset(
    {
        "metadataVerificationStatus",
        "metadataVerificationSource",
        "metadataVerifiedBy",
        "metadataVerifiedAt",
        "metadataVerificationReason",
        "exposureScope",
        "diversificationTier",
        "leverageRiskTier",
        "longTermSuitability",
        "portfolioWarningSeverity",
        "confirmationMode",
        "leverageWarningLabelKo",
        "officialSourceUrl",
        "referenceSourceUrl",
    }
)
_LEVERAGE_REGISTRY_CORE_FIELDS = frozenset(
    {
        "exposureType",
        "underlyingTicker",
        "leverageMultiple",
        "direction",
        "resetFrequency",
    }
)
_LEVERAGE_REGISTRY_VALUE_FIELDS = (
    LEVERAGE_REGISTRY_MANAGED_FIELDS | _LEVERAGE_REGISTRY_CORE_FIELDS
)
_LEVERAGE_REGISTRY_AUDIT_FIELDS = frozenset(
    {
        "leverageMetadataRegistryActive",
        "leverageMetadataRegistryApplied",
        "leverageMetadataRegistryValues",
        "leverageMetadataRegistryFingerprint",
    }
)

_DISTRIBUTION_OVERRIDE_VALUE_FIELDS = frozenset(
    {
        "cashEventBasis",
        "cashEventNormalizationStatus",
        "cashEventNormalizationMethod",
        "distributionDataQualityStatus",
        "distributionDataQualityReason",
    }
)

_DISTRIBUTION_OVERRIDE_AUDIT_FIELDS = frozenset(
    {
        "distributionDataQualityOverrideAsOfDate",
        "distributionDataQualityOverrideSourceUrl",
        "distributionDataQualityOverrideAppliedBy",
        "distributionDataQualityOverrideAppliedAt",
        "distributionDataQualityOverrideActive",
        "distributionDataQualityOverrideApplied",
        "distributionDataQualityOverrideValues",
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


def _override_provenance_present(row: dict[str, str]) -> bool:
    return (
        str(
            row.get("distributionDataQualityOverrideApplied") or ""
        ).strip().lower()
        == "true"
        or (
            str(
                row.get("distributionDataQualityOverrideActive") or ""
            ).strip().lower()
            == "true"
            and bool(
                str(
                    row.get(
                        "distributionDataQualityOverrideAppliedAt"
                    )
                    or ""
                ).strip()
            )
        )
    )


def _override_values(row: dict[str, str]) -> dict[str, str]:
    try:
        values = json.loads(
            row.get("distributionDataQualityOverrideValues") or "{}"
        )
    except (TypeError, ValueError):
        return {}
    return {
        field: str(value or "")
        for field, value in values.items()
        if field in _DISTRIBUTION_OVERRIDE_VALUE_FIELDS
    }


def _leverage_registry_values(row: dict[str, str]) -> dict[str, str]:
    try:
        values = json.loads(
            row.get("leverageMetadataRegistryValues") or "{}"
        )
    except (TypeError, ValueError):
        return {}
    return {
        field: str(value or "")
        for field, value in values.items()
        if field in _LEVERAGE_REGISTRY_VALUE_FIELDS
    }


def _leverage_registry_provenance_present(
    row: dict[str, str],
    values: dict[str, str],
    fingerprint: str,
) -> bool:
    if (
        str(row.get("leverageMetadataRegistryApplied") or "")
        .strip()
        .lower()
        == "true"
    ):
        return True
    if (
        fingerprint
        and str(
            row.get("leverageMetadataRegistryFingerprint") or ""
        ).strip()
        == fingerprint
    ):
        return True
    signatures = [
        field
        for field in (
            "metadataVerificationStatus",
            "metadataVerificationSource",
            "metadataVerifiedBy",
            "metadataVerifiedAt",
        )
        if values.get(field, "")
    ]
    return len(signatures) >= 3 and all(
        str(row.get(field) or "") == values[field]
        for field in signatures
    )


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
            source_registry_values = _leverage_registry_values(source)
            source_registry_fingerprint = str(
                source.get("leverageMetadataRegistryFingerprint") or ""
            ).strip()
            source_registry_contract = bool(
                source_registry_values
                or source_registry_fingerprint
                or str(
                    source.get("leverageMetadataRegistryActive") or ""
                ).strip()
            )
            if source_registry_contract:
                source_applies_registry = str(
                    source.get("leverageMetadataRegistryApplied") or ""
                ).strip().lower() == "true"
                existing_registry_values = _leverage_registry_values(
                    existing
                )
                registry_provenance_present = (
                    _leverage_registry_provenance_present(
                        existing,
                        source_registry_values,
                        source_registry_fingerprint,
                    )
                )
                for field in _LEVERAGE_REGISTRY_VALUE_FIELDS:
                    manual_rejected_core_value = (
                        source.get("metadataVerificationStatus")
                        == "rejected"
                        and field in _LEVERAGE_REGISTRY_CORE_FIELDS
                        and str(
                            existing.get(
                                "leverageMetadataRegistryApplied"
                            ) or ""
                        ).strip().lower() == "true"
                        and field in existing_registry_values
                        and str(existing.get(field) or "")
                        != existing_registry_values[field]
                    )
                    if manual_rejected_core_value:
                        row[field] = existing.get(field, "")
                        continue
                    if source_applies_registry and field in source_registry_values:
                        row[field] = source.get(field, "")
                    elif (
                        registry_provenance_present
                        and field in source_registry_values
                        and str(existing.get(field) or "")
                        == source_registry_values[field]
                    ):
                        row[field] = source.get(field, "")
                    elif field not in row:
                        row[field] = source.get(field, "")
                for field in _LEVERAGE_REGISTRY_AUDIT_FIELDS:
                    row[field] = source.get(field, "")
            else:
                for field in LEVERAGE_REGISTRY_MANAGED_FIELDS:
                    row[field] = source.get(field, "")
                if source.get("metadataVerificationStatus") == "verified":
                    for field in _LEVERAGE_REGISTRY_CORE_FIELDS:
                        row[field] = source.get(field, "")
            provenance_present = _override_provenance_present(existing)
            expected_values = (
                _override_values(existing) or _override_values(source)
            )
            legacy_override_derived = (
                provenance_present
                and not expected_values
                and str(
                    existing.get("distributionDataQualityStatus") or ""
                ).strip().lower()
                == "provider_event_error"
            )
            source_applies_override = str(
                source.get(
                    "distributionDataQualityOverrideApplied"
                )
                or ""
            ).strip().lower() == "true"
            for field in _DISTRIBUTION_OVERRIDE_VALUE_FIELDS:
                field_was_overridden = (
                    legacy_override_derived
                    or (
                        provenance_present
                        and field in expected_values
                        and str(existing.get(field) or "")
                        == expected_values[field]
                    )
                )
                if field_was_overridden or (
                    source_applies_override
                    and not str(existing.get(field) or "").strip()
                ):
                    row[field] = source.get(field, "")
            for field in _DISTRIBUTION_OVERRIDE_AUDIT_FIELDS:
                row[field] = source.get(field, "")
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
