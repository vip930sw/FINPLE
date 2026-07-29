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
DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH = (
    Path(__file__).with_name("leverage_inverse_metadata_registry.csv")
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


def load_leverage_metadata_registry(
    path: Path | str = DEFAULT_LEVERAGE_METADATA_REGISTRY_PATH,
) -> dict[str, dict[str, str]]:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {
            "market", "ticker", "metadataVerificationStatus",
            "exposureType", "underlyingTicker", "leverageMultiple", "direction",
            "resetFrequency", "exposureScope", "diversificationTier",
            "leverageRiskTier", "longTermSuitability",
            "portfolioWarningSeverity", "confirmationMode",
            "leverageWarningLabelKo", "officialSourceUrl",
            "referenceSourceUrl", "verifiedBy", "verifiedAt",
            "reason", "active",
        }
        missing = required - set(reader.fieldnames or ())
        if missing:
            raise ValueError(
                f"leverage metadata registry missing: {','.join(sorted(missing))}"
            )
        registry: dict[str, dict[str, str]] = {}
        for row_number, raw in enumerate(reader, start=2):
            row = {
                str(key): str(value or "").strip()
                for key, value in raw.items()
                if key is not None
            }
            market = row["market"].upper()
            ticker = row["ticker"].upper()
            identity = f"{market}:{ticker}"
            if not market or not ticker or identity in registry:
                raise ValueError(
                    f"invalid or duplicate leverage metadata identity at row {row_number}"
                )
            if row["active"].lower() not in {"true", "false"}:
                raise ValueError(f"invalid leverage metadata active: {identity}")
            if row["metadataVerificationStatus"] != "verified":
                raise ValueError(f"invalid leverage metadata status: {identity}")
            if (
                not _valid_http_url(row["officialSourceUrl"])
                or not _valid_http_url(row["referenceSourceUrl"])
            ):
                raise ValueError(f"invalid leverage metadata URL: {identity}")
            try:
                leverage = abs(float(row["leverageMultiple"]))
                verified_at = datetime.fromisoformat(row["verifiedAt"])
            except ValueError as error:
                raise ValueError(f"invalid leverage metadata value: {identity}") from error
            if leverage <= 0 or verified_at.utcoffset() is None:
                raise ValueError(f"invalid leverage metadata value: {identity}")
            if (
                not row["verifiedBy"]
                or not row["reason"]
                or not row["underlyingTicker"]
                or not row["leverageWarningLabelKo"]
            ):
                raise ValueError(f"incomplete leverage metadata audit: {identity}")
            allowed_values = {
                "exposureScope": {
                    "single_stock", "sector_index", "thematic_index",
                    "concentrated_index", "broad_market_index",
                    "multi_asset_index", "unresolved_scope",
                },
                "diversificationTier": {
                    "none", "low", "medium", "high", "unresolved",
                },
                "leverageRiskTier": {"1", "2", "3", "4"},
                "longTermSuitability": {
                    "caution", "high_caution", "not_recommended", "unsuitable",
                },
                "portfolioWarningSeverity": {"caution", "high", "critical"},
                "confirmationMode": {"standard", "strong"},
            }
            for field, allowed in allowed_values.items():
                if row[field] not in allowed:
                    raise ValueError(
                        f"invalid leverage metadata {field}: {identity}"
                    )
            if row["direction"] == "inverse" and row["leverageRiskTier"] != "4":
                raise ValueError(f"inverse metadata must be tier4: {identity}")
            if (
                row["direction"] == "long"
                and row["exposureScope"] == "single_stock"
                and int(row["leverageRiskTier"]) < 3
            ):
                raise ValueError(
                    f"single-stock leverage metadata must be tier3+: {identity}"
                )
            if (
                row["direction"] == "long"
                and row["exposureScope"] == "broad_market_index"
                and row["leverageRiskTier"] == "4"
            ):
                raise ValueError(
                    f"broad-market long metadata cannot be tier4: {identity}"
                )
            if (
                row["direction"] == "long"
                and leverage >= 4
                and int(row["leverageRiskTier"]) < 3
            ):
                raise ValueError(
                    f"4x long leverage metadata must be tier3+: {identity}"
                )
            if not row["resetFrequency"]:
                raise ValueError(f"leverage reset frequency is required: {identity}")
            if row["direction"] not in {"long", "inverse"}:
                raise ValueError(f"invalid leverage metadata direction: {identity}")
            registry[identity] = row
        return registry


_PENDING_LEVERAGE_IDENTITIES = frozenset(
    {
        "US:AAPX", "US:AMZO", "US:AMZZ", "US:GOOX", "US:METU",
        "US:MSFX", "US:NVDU", "US:NVDX", "US:TSLT",
    }
)
_PENDING_LEVERAGE_NAME_PATTERNS = (
    re.compile(r"레버리지|인버스"),
    re.compile(r"\b(?:2X|3X)\s+(?:LONG|SHORT|LEVERAGED)\b", re.I),
    re.compile(r"\bDOUBLE SHORT\b", re.I),
    re.compile(r"\bDIREXION DAILY .+ (?:BULL|BEAR) (?:2X|3X)\b", re.I),
    re.compile(r"\bPROSHARES (?:ULTRAPRO|ULTRASHORT)\b", re.I),
    re.compile(r"\bMICROSECTORS\b.+(?:2X|3X|-2X|-3X)", re.I),
)


def _is_pending_leverage_candidate(
    identity: str,
    source_row: dict[str, str],
) -> bool:
    if identity in _PENDING_LEVERAGE_IDENTITIES:
        return True
    if str(source_row.get("exposureType") or "").strip() not in {"", "ordinary_etf"}:
        return False
    name = " ".join(
        str(source_row.get(field) or "")
        for field in ("name", "nameKr", "nameEn")
    )
    if re.search(r"\bPROSHARES SHORT\b", name, re.I) and not re.search(
        r"\bSHORT[- ](?:TERM|DURATION)\b", name, re.I
    ):
        return True
    if re.search(r"\bPROSHARES ULTRA\b", name, re.I) and not re.search(
        r"\bULTRASHORT\b|\bSHORT[- ]TERM\b", name, re.I
    ):
        return True
    return any(pattern.search(name) for pattern in _PENDING_LEVERAGE_NAME_PATTERNS)


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
    leverage_metadata_registry: dict[str, dict[str, str]] | None = None,
) -> tuple[list[dict[str, str]], dict[str, object]]:
    if distribution_overrides is None:
        distribution_overrides = load_distribution_data_quality_overrides()
    if leverage_metadata_registry is None:
        leverage_metadata_registry = load_leverage_metadata_registry()
    rows: list[dict[str, str]] = []
    canonical_provider_count = 0
    adapter_ready_count = 0
    derived_adapter_count = 0
    adapter_unresolved_count = 0
    adapter_unresolved_by_market: dict[str, int] = {}
    benchmark_unresolved = 0
    verified_leverage_count = 0
    pending_leverage_count = 0
    market_counts: dict[str, int] = {}
    for source_row in source.rows:
        market, ticker = row_identity(source_row).split(":", 1)
        identity = f"{market}:{ticker}"
        leverage_metadata = leverage_metadata_registry.get(identity, {})
        leverage_metadata_active = _parse_bool(
            leverage_metadata.get("active")
        )
        leverage_verified = bool(leverage_metadata) and leverage_metadata_active
        leverage_pending = (
            not leverage_verified
            and _is_pending_leverage_candidate(identity, source_row)
        )
        if leverage_verified:
            verified_leverage_count += 1
        elif leverage_pending:
            pending_leverage_count += 1
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
                    leverage_metadata.get("exposureType")
                    if leverage_verified
                    else source_row.get("exposureType") or ""
                ).strip(),
                "underlyingTicker": str(
                    leverage_metadata.get("underlyingTicker")
                    if leverage_verified
                    else source_row.get("underlyingTicker") or ""
                ).strip(),
                "leverageMultiple": str(
                    leverage_metadata.get("leverageMultiple")
                    if leverage_verified
                    else source_row.get("leverageMultiple") or ""
                ).strip(),
                "direction": str(
                    leverage_metadata.get("direction")
                    if leverage_verified
                    else source_row.get("direction") or ""
                ).strip(),
                "resetFrequency": str(
                    leverage_metadata.get("resetFrequency")
                    if leverage_verified
                    else source_row.get("resetFrequency") or ""
                ).strip(),
                "metadataVerificationStatus": (
                    "verified"
                    if leverage_verified
                    else "pending_official_source"
                    if leverage_pending
                    else str(source_row.get("metadataVerificationStatus") or "")
                ),
                "metadataVerificationSource": (
                    "official_registry"
                    if leverage_verified
                    else "name_pattern_candidate"
                    if leverage_pending
                    else str(source_row.get("metadataVerificationSource") or "")
                ),
                "metadataVerifiedBy": (
                    leverage_metadata.get("verifiedBy", "")
                    if leverage_verified
                    else ""
                ),
                "metadataVerifiedAt": (
                    leverage_metadata.get("verifiedAt", "")
                    if leverage_verified
                    else ""
                ),
                "metadataVerificationReason": (
                    leverage_metadata.get("reason", "")
                    if leverage_verified
                    else "official source verification pending"
                    if leverage_pending
                    else str(source_row.get("metadataVerificationReason") or "")
                ),
                "exposureScope": (
                    leverage_metadata.get("exposureScope", "")
                    if leverage_verified else "unresolved_scope"
                    if leverage_pending else str(source_row.get("exposureScope") or "")
                ),
                "diversificationTier": (
                    leverage_metadata.get("diversificationTier", "")
                    if leverage_verified else "unresolved"
                    if leverage_pending else str(source_row.get("diversificationTier") or "")
                ),
                "leverageRiskTier": (
                    leverage_metadata.get("leverageRiskTier", "")
                    if leverage_verified else "pending"
                    if leverage_pending else str(source_row.get("leverageRiskTier") or "")
                ),
                "longTermSuitability": (
                    leverage_metadata.get("longTermSuitability", "")
                    if leverage_verified else "pending"
                    if leverage_pending else str(source_row.get("longTermSuitability") or "")
                ),
                "portfolioWarningSeverity": (
                    leverage_metadata.get("portfolioWarningSeverity", "")
                    if leverage_verified else "high"
                    if leverage_pending else str(source_row.get("portfolioWarningSeverity") or "")
                ),
                "confirmationMode": (
                    leverage_metadata.get("confirmationMode", "")
                    if leverage_verified else "strong"
                    if leverage_pending else str(source_row.get("confirmationMode") or "")
                ),
                "leverageWarningLabelKo": (
                    leverage_metadata.get("leverageWarningLabelKo", "")
                    if leverage_verified else "상품 구조 확인 필요"
                    if leverage_pending else str(source_row.get("leverageWarningLabelKo") or "")
                ),
                "officialSourceUrl": (
                    leverage_metadata.get("officialSourceUrl", "")
                    if leverage_verified else str(source_row.get("officialSourceUrl") or "")
                ),
                "referenceSourceUrl": (
                    leverage_metadata.get("referenceSourceUrl", "")
                    if leverage_verified else str(source_row.get("referenceSourceUrl") or "")
                ),
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
        "verifiedLeverageMetadataCount": verified_leverage_count,
        "pendingLeverageMetadataCount": pending_leverage_count,
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
