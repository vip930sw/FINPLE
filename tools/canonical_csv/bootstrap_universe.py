"""Initial one-time editable-universe bootstrap from the runtime canonical."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

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

PROVIDER_EVENT_ERROR_IDENTITIES = frozenset(
    {"KR:381560", "US:SOXS"}
)


def _parse_bool(value: object, default: bool = False) -> bool:
    normalized = str(value or "").strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return default


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
) -> tuple[list[dict[str, str]], dict[str, object]]:
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
        provider_event_error = identity in PROVIDER_EVENT_ERROR_IDENTITIES
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
                    source_row.get("cashEventBasis")
                    or (
                        "provider_reported_cash_event"
                        if provider_event_error
                        else ""
                    )
                ).strip(),
                "cashEventNormalizationStatus": str(
                    source_row.get("cashEventNormalizationStatus")
                    or ("unresolved" if provider_event_error else "")
                ).strip(),
                "cashEventNormalizationMethod": str(
                    source_row.get("cashEventNormalizationMethod") or ""
                ).strip(),
                "distributionDataQualityStatus": str(
                    source_row.get("distributionDataQualityStatus")
                    or (
                        "provider_event_error"
                        if provider_event_error
                        else ""
                    )
                ).strip(),
                "distributionDataQualityReason": str(
                    source_row.get("distributionDataQualityReason")
                    or (
                        "provider cash event conflicts with official "
                        "distribution history"
                        if provider_event_error
                        else ""
                    )
                ).strip(),
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
