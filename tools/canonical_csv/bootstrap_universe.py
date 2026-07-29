"""Initial one-time editable-universe bootstrap from the runtime canonical."""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse

from .canonical import CanonicalSource, load_canonical_source, row_identity


UNIVERSE_OUTPUT_FIELDS = (
    "market",
    "ticker",
    "name",
    "benchmark",
    "active",
    "includeInSimulator",
    "providerSymbol",
    "marketDataProvider",
    "marketDataProviderSymbol",
    "benchmarkProviderSymbol",
    "assetType",
    "sourceUniverse",
    "listingStatus",
    "tags",
    "marketCap",
    "aum",
    "sizeSource",
    "exposureType",
    "underlyingTicker",
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
    "distributionDataQualityOverrideApplied",
    "distributionDataQualityOverrideValues",
    "issuer",
    "inceptionDate",
    "firstListedDate",
    "lastTradingDate",
    "sourcePresent",
    "providerSymbolStatus",
    "marketDataProviderSymbolStatus",
    "benchmarkStatus",
    "reasonCode",
    "reasonMessage",
)

DEFAULT_DISTRIBUTION_DATA_QUALITY_OVERRIDES_PATH = (
    Path(__file__).with_name("distribution_data_quality_overrides.csv")
)
ALLOWED_DISTRIBUTION_DATA_QUALITY_OVERRIDE_STATUSES = frozenset(
    {"provider_event_error"}
)
_DISTRIBUTION_OVERRIDE_AUDIT_FIELDS = {
    "distributionDataQualityOverrideAsOfDate": "asOfDate",
    "distributionDataQualityOverrideSourceUrl": "sourceUrl",
    "distributionDataQualityOverrideAppliedBy": "appliedBy",
    "distributionDataQualityOverrideAppliedAt": "appliedAt",
}
_DISTRIBUTION_OVERRIDE_VALUE_FIELDS = {
    "distributionDataQualityStatus": "distributionDataQualityStatus",
    "cashEventBasis": "cashEventBasis",
    "cashEventNormalizationStatus": "cashEventNormalizationStatus",
    "cashEventNormalizationMethod": "cashEventNormalizationMethod",
    "distributionDataQualityReason": "reason",
}


def _parse_bool(value: object, default: bool = False) -> bool:
    normalized = str(value or "").strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return default


def _valid_http_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _source_was_overridden(
    source_row: dict[str, str],
    override: dict[str, str],
) -> bool:
    if _parse_bool(
        source_row.get("distributionDataQualityOverrideApplied")
    ):
        return True
    audit_matches = (
        _parse_bool(source_row.get("distributionDataQualityOverrideActive"))
        and source_row.get("distributionDataQualityStatus", "").strip()
        == override.get("distributionDataQualityStatus", "")
        and all(
            source_row.get(output_field, "").strip()
            == override.get(input_field, "")
            for output_field, input_field
            in _DISTRIBUTION_OVERRIDE_AUDIT_FIELDS.items()
        )
    )
    values_match = all(
        source_row.get(output_field, "").strip()
        == override.get(input_field, "")
        for output_field, input_field
        in _DISTRIBUTION_OVERRIDE_VALUE_FIELDS.items()
    )
    return audit_matches or values_match


def load_distribution_data_quality_overrides(
    path: Path | str = DEFAULT_DISTRIBUTION_DATA_QUALITY_OVERRIDES_PATH,
) -> dict[str, dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {
            "market",
            "ticker",
            "distributionDataQualityStatus",
            "cashEventBasis",
            "cashEventNormalizationStatus",
            "cashEventNormalizationMethod",
            "asOfDate",
            "reason",
            "appliedBy",
            "appliedAt",
            "active",
        }
        missing = required - set(reader.fieldnames or ())
        if missing:
            raise ValueError(
                f"distribution data quality override missing: "
                f"{','.join(sorted(missing))}"
            )
        source_url_fields = {
            "sourceUrl",
            "providerSourceUrl",
            "referenceSourceUrl",
        }
        if not source_url_fields & set(reader.fieldnames or ()):
            raise ValueError(
                "distribution data quality override missing: sourceUrl"
            )
        overrides: dict[str, dict[str, str]] = {}
        seen: set[str] = set()
        for row_number, row in enumerate(reader, start=2):
            market = str(row.get("market") or "").strip().upper()
            ticker = str(row.get("ticker") or "").strip().upper()
            identity = f"{market}:{ticker}"
            if not market or not ticker:
                raise ValueError(
                    f"distribution data quality override row {row_number} "
                    "has blank identity"
                )
            if identity in seen:
                raise ValueError(
                    f"duplicate distribution data quality override: {identity}"
                )
            seen.add(identity)
            status = str(
                row.get("distributionDataQualityStatus") or ""
            ).strip().lower()
            if status not in ALLOWED_DISTRIBUTION_DATA_QUALITY_OVERRIDE_STATUSES:
                raise ValueError(
                    f"invalid distribution data quality status: {status}"
                )
            active = str(row.get("active") or "").strip().lower()
            if active not in {"true", "false"}:
                raise ValueError(
                    f"distribution data quality override active must be "
                    f"true or false: {identity}"
                )
            normalized = {
                str(key): str(value or "").strip()
                for key, value in row.items()
                if key is not None
            }
            try:
                date.fromisoformat(normalized["asOfDate"])
            except ValueError as error:
                raise ValueError(
                    f"invalid distribution override asOfDate: {identity}"
                ) from error
            try:
                applied_at = datetime.fromisoformat(
                    normalized["appliedAt"]
                )
            except ValueError as error:
                raise ValueError(
                    f"invalid distribution override appliedAt: {identity}"
                ) from error
            if applied_at.utcoffset() is None:
                raise ValueError(
                    f"distribution override appliedAt requires timezone: "
                    f"{identity}"
                )
            urls = [
                normalized.get(field, "")
                for field in source_url_fields
                if normalized.get(field, "")
            ]
            if not urls or any(not _valid_http_url(url) for url in urls):
                raise ValueError(
                    f"invalid distribution override source URL: {identity}"
                )
            if not normalized["reason"]:
                raise ValueError(
                    f"distribution override reason is required: {identity}"
                )
            if not normalized["appliedBy"]:
                raise ValueError(
                    f"distribution override appliedBy is required: {identity}"
                )
            normalized["sourceUrl"] = (
                normalized.get("providerSourceUrl")
                or normalized.get("sourceUrl")
                or normalized.get("referenceSourceUrl")
                or ""
            )
            overrides[identity] = normalized
        return overrides


def load_benchmark_policy(
    path: Path | str,
) -> dict[str, tuple[str, str]]:
    with Path(path).open(
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as handle:
        reader = csv.DictReader(handle)
        required = {
            "market",
            "benchmark",
            "benchmarkProviderSymbol",
        }
        missing = required - set(reader.fieldnames or ())
        if missing:
            raise ValueError(
                f"benchmark policy missing: {','.join(sorted(missing))}"
            )
        return {
            str(row["market"]).strip().upper(): (
                str(row["benchmark"]).strip().upper(),
                str(row["benchmarkProviderSymbol"]).strip(),
            )
            for row in reader
        }


def _resolve_kr_yfinance_symbol(row: dict[str, str]) -> str:
    ticker = str(row.get("ticker") or "").strip().upper()
    evidence = " ".join(
        str(row.get(field) or "")
        for field in (
            "sourceUniverse",
            "assetType",
            "tags",
            "notes",
            "officialSourceUrl",
        )
    ).upper()
    if "KOSDAQ" in evidence:
        return f"{ticker}.KQ"
    if "KOSPI" in evidence:
        return f"{ticker}.KS"
    if (
        str(row.get("assetType") or "").strip().upper() == "ETF"
        and "KR_ETF_MARKET_SNAPSHOT" in evidence
    ):
        return f"{ticker}.KS"
    return ""


def _resolve_us_yfinance_symbol(row: dict[str, str]) -> tuple[str, bool]:
    canonical_symbol = str(row.get("providerSymbol") or "").strip().upper()
    adapter_symbol = canonical_symbol or str(
        row.get("ticker") or ""
    ).strip().upper()
    if not adapter_symbol:
        return "", False
    if re.fullmatch(r"[A-Z0-9]+[.][A-Z]", adapter_symbol):
        return adapter_symbol.replace(".", "-"), True
    return adapter_symbol, not canonical_symbol


def _resolve_market_data_symbol(
    row: dict[str, str],
    market: str,
) -> tuple[str, str]:
    canonical_symbol = str(row.get("providerSymbol") or "").strip()
    if market == "KR":
        if canonical_symbol.endswith((".KS", ".KQ")):
            return canonical_symbol, "canonical"
        symbol = _resolve_kr_yfinance_symbol(row)
        return (symbol, "derived") if symbol else ("", "unresolved")
    if market == "US":
        symbol, transformed = _resolve_us_yfinance_symbol(row)
        if not symbol:
            return "", "unresolved"
        return symbol, "derived" if transformed else "canonical"
    return "", "unresolved"


def build_universe_rows(
    source: CanonicalSource,
    benchmark_policy: dict[str, tuple[str, str]],
    distribution_overrides: dict[str, dict[str, str]] | None = None,
) -> tuple[list[dict[str, str]], dict[str, object]]:
    if distribution_overrides is None:
        distribution_overrides = load_distribution_data_quality_overrides()
    rows: list[dict[str, str]] = []
    canonical_provider_count = 0
    adapter_ready_count = 0
    derived_adapter_count = 0
    adapter_unresolved_count = 0
    adapter_unresolved_by_market: dict[str, int] = {}
    benchmark_unresolved = 0
    market_counts: dict[str, int] = {}
    for source_row in source.rows:
        market, ticker = row_identity(source_row).split(":", 1)
        identity = f"{market}:{ticker}"
        distribution_override = distribution_overrides.get(identity, {})
        distribution_override_values = {
            output_field: distribution_override.get(input_field, "")
            for output_field, input_field
            in _DISTRIBUTION_OVERRIDE_VALUE_FIELDS.items()
        }
        override_active = _parse_bool(
            distribution_override.get("active")
        )
        source_was_overridden = bool(distribution_override) and (
            _source_was_overridden(source_row, distribution_override)
        )
        apply_distribution_override = (
            override_active
            and (
                source_was_overridden
                or not str(
                    source_row.get("distributionDataQualityStatus") or ""
                ).strip()
            )
        )
        clear_distribution_override = (
            bool(distribution_override)
            and not override_active
            and source_was_overridden
        )
        market_counts[market] = market_counts.get(market, 0) + 1
        canonical_provider_symbol = str(
            source_row.get("providerSymbol") or ""
        ).strip()
        if canonical_provider_symbol:
            canonical_provider_count += 1
        provider_status = (
            "present" if canonical_provider_symbol else "missing"
        )
        adapter_symbol, adapter_status = _resolve_market_data_symbol(
            source_row,
            market,
        )
        if adapter_symbol:
            adapter_ready_count += 1
        else:
            adapter_unresolved_count += 1
            adapter_unresolved_by_market[market] = (
                adapter_unresolved_by_market.get(market, 0) + 1
            )
        if adapter_status == "derived":
            derived_adapter_count += 1

        benchmark, benchmark_symbol = benchmark_policy.get(
            market,
            ("", ""),
        )
        benchmark_status = (
            "resolved"
            if benchmark and benchmark_symbol
            else "unresolved"
        )
        if benchmark_status == "unresolved":
            benchmark_unresolved += 1
        active = _parse_bool(source_row.get("active"), default=True)
        rows.append(
            {
                "market": market,
                "ticker": ticker,
                "name": str(
                    source_row.get("name")
                    or source_row.get("nameKr")
                    or ticker
                ).strip(),
                "benchmark": benchmark,
                "active": "true" if active else "false",
                "includeInSimulator": "true" if active else "false",
                "providerSymbol": canonical_provider_symbol,
                "marketDataProvider": "yfinance",
                "marketDataProviderSymbol": adapter_symbol,
                "benchmarkProviderSymbol": benchmark_symbol,
                "assetType": str(
                    source_row.get("assetType") or ""
                ).strip(),
                "sourceUniverse": str(
                    source_row.get("sourceUniverse") or ""
                ).strip(),
                "listingStatus": str(
                    source_row.get("listingStatus") or ""
                ).strip(),
                "tags": str(source_row.get("tags") or "").strip(),
                "marketCap": str(
                    source_row.get("marketCap") or ""
                ).strip(),
                "aum": str(source_row.get("aum") or "").strip(),
                "sizeSource": str(
                    source_row.get("sizeSource") or ""
                ).strip(),
                "exposureType": str(
                    source_row.get("exposureType") or ""
                ).strip(),
                "underlyingTicker": str(
                    source_row.get("underlyingTicker") or ""
                ).strip(),
                "leverageMultiple": str(
                    source_row.get("leverageMultiple") or ""
                ).strip(),
                "direction": str(
                    source_row.get("direction") or ""
                ).strip(),
                "resetFrequency": str(
                    source_row.get("resetFrequency") or ""
                ).strip(),
                "distributionType": str(
                    source_row.get("distributionType") or "unknown"
                ).strip(),
                "distributionFrequency": str(
                    source_row.get("distributionFrequency") or "unknown"
                ).strip(),
                "cashEventBasis": str(
                    ""
                    if clear_distribution_override
                    else distribution_override.get("cashEventBasis")
                    if apply_distribution_override
                    else source_row.get("cashEventBasis")
                    or ""
                ).strip(),
                "cashEventNormalizationStatus": str(
                    ""
                    if clear_distribution_override
                    else distribution_override.get(
                        "cashEventNormalizationStatus"
                    )
                    if apply_distribution_override
                    else source_row.get("cashEventNormalizationStatus")
                    or ""
                ).strip(),
                "cashEventNormalizationMethod": str(
                    ""
                    if clear_distribution_override
                    else distribution_override.get(
                        "cashEventNormalizationMethod"
                    )
                    if apply_distribution_override
                    else source_row.get("cashEventNormalizationMethod")
                    or ""
                ).strip(),
                "distributionDataQualityStatus": str(
                    ""
                    if clear_distribution_override
                    else distribution_override.get(
                        "distributionDataQualityStatus"
                    )
                    if apply_distribution_override
                    else source_row.get("distributionDataQualityStatus")
                    or ""
                ).strip(),
                "distributionDataQualityReason": str(
                    ""
                    if clear_distribution_override
                    else distribution_override.get("reason")
                    if apply_distribution_override
                    else source_row.get("distributionDataQualityReason")
                    or ""
                ).strip(),
                "distributionDataQualityOverrideAsOfDate": (
                    distribution_override.get("asOfDate", "")
                ),
                "distributionDataQualityOverrideSourceUrl": (
                    distribution_override.get("sourceUrl", "")
                ),
                "distributionDataQualityOverrideAppliedBy": (
                    distribution_override.get("appliedBy", "")
                ),
                "distributionDataQualityOverrideAppliedAt": (
                    distribution_override.get("appliedAt", "")
                ),
                "distributionDataQualityOverrideActive": (
                    distribution_override.get("active", "")
                ),
                "distributionDataQualityOverrideApplied": (
                    "true" if apply_distribution_override else "false"
                    if distribution_override else ""
                ),
                "distributionDataQualityOverrideValues": (
                    json.dumps(
                        distribution_override_values,
                        ensure_ascii=False,
                        separators=(",", ":"),
                        sort_keys=True,
                    )
                    if distribution_override else ""
                ),
                "issuer": str(source_row.get("issuer") or "").strip(),
                "inceptionDate": str(
                    source_row.get("inceptionDate") or ""
                ).strip(),
                "firstListedDate": str(
                    source_row.get("firstListedDate") or ""
                ).strip(),
                "lastTradingDate": str(
                    source_row.get("lastTradingDate") or ""
                ).strip(),
                "sourcePresent": "true",
                "providerSymbolStatus": provider_status,
                "marketDataProviderSymbolStatus": adapter_status,
                "benchmarkStatus": benchmark_status,
                "reasonCode": "",
                "reasonMessage": "",
            }
        )
    identities = [f"{row['market']}:{row['ticker']}" for row in rows]
    report: dict[str, object] = {
        "inputRowCount": len(source.rows),
        "outputRowCount": len(rows),
        "marketRowCounts": dict(sorted(market_counts.items())),
        "duplicateCount": len(identities) - len(set(identities)),
        "missingIdentityCount": sum(
            not row["market"] or not row["ticker"] for row in rows
        ),
        "canonicalProviderSymbolCount": canonical_provider_count,
        "adapterReadySymbolCount": adapter_ready_count,
        "derivedAdapterSymbolCount": derived_adapter_count,
        "unresolvedAdapterSymbolCount": adapter_unresolved_count,
        "adapterSymbolUnresolvedByMarket": {
            market: adapter_unresolved_by_market.get(market, 0)
            for market in sorted(market_counts)
        },
        # Compatibility alias: this now measures adapter readiness rather
        # than merely checking whether canonical providerSymbol is blank.
        "providerSymbolUnresolvedCount": adapter_unresolved_count,
        "benchmarkUnresolvedCount": benchmark_unresolved,
        "identityMatch": tuple(identities) == source.identities,
    }
    return rows, report


def write_universe(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=UNIVERSE_OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Bootstrap an editable universe from a canonical CSV",
    )
    parser.add_argument("--source-canonical", required=True)
    parser.add_argument("--benchmark-policy", required=True)
    parser.add_argument("--output")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    rows, report = build_universe_rows(
        load_canonical_source(args.source_canonical),
        load_benchmark_policy(args.benchmark_policy),
    )
    if not args.dry_run:
        if not args.output:
            raise SystemExit("--output is required unless --dry-run is used")
        write_universe(Path(args.output), rows)
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    if not report["identityMatch"] or report["duplicateCount"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
