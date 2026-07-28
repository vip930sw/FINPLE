"""Initial one-time editable-universe bootstrap from the runtime canonical."""

from __future__ import annotations

import argparse
import csv
import json
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
    "benchmarkProviderSymbol",
    "assetType",
    "listingStatus",
    "exposureType",
    "distributionType",
    "distributionFrequency",
    "sourcePresent",
    "providerSymbolStatus",
    "benchmarkStatus",
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


def _infer_kr_provider_symbol(row: dict[str, str]) -> str:
    ticker = str(row.get("ticker") or "").strip().upper()
    evidence = " ".join(
        str(row.get(field) or "")
        for field in ("sourceUniverse", "tags", "notes", "officialSourceUrl")
    ).upper()
    if "KOSDAQ" in evidence:
        return f"{ticker}.KQ"
    if "KOSPI" in evidence:
        return f"{ticker}.KS"
    return ""


def build_universe_rows(
    source: CanonicalSource,
    benchmark_policy: dict[str, tuple[str, str]],
) -> tuple[list[dict[str, str]], dict[str, object]]:
    rows: list[dict[str, str]] = []
    provider_unresolved = 0
    benchmark_unresolved = 0
    market_counts: dict[str, int] = {}
    for source_row in source.rows:
        market, ticker = row_identity(source_row).split(":", 1)
        market_counts[market] = market_counts.get(market, 0) + 1
        provider_symbol = str(
            source_row.get("providerSymbol") or ""
        ).strip()
        if not provider_symbol:
            if market == "US":
                provider_symbol = ticker
            elif market == "KR":
                provider_symbol = _infer_kr_provider_symbol(source_row)
        provider_status = "resolved" if provider_symbol else "unresolved"
        if not provider_symbol:
            provider_unresolved += 1

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
                "providerSymbol": provider_symbol,
                "benchmarkProviderSymbol": benchmark_symbol,
                "assetType": str(
                    source_row.get("assetType") or ""
                ).strip(),
                "listingStatus": str(
                    source_row.get("listingStatus") or ""
                ).strip(),
                "exposureType": str(
                    source_row.get("exposureType") or ""
                ).strip(),
                "distributionType": str(
                    source_row.get("distributionType") or "unknown"
                ).strip(),
                "distributionFrequency": str(
                    source_row.get("distributionFrequency") or "unknown"
                ).strip(),
                "sourcePresent": "true",
                "providerSymbolStatus": provider_status,
                "benchmarkStatus": benchmark_status,
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
        "providerSymbolUnresolvedCount": provider_unresolved,
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
