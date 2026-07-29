from __future__ import annotations

import csv
import tempfile
import unittest
from datetime import date
from pathlib import Path

from tools.canonical_csv.bootstrap_universe import (
    build_universe_rows,
    write_universe,
)
from tools.canonical_csv.build import build_canonical_candidate
from tools.canonical_csv.canonical import load_canonical_source
from tools.canonical_csv.config import PipelineConfig
from tools.canonical_csv.update_universe import update_universe_rows


SOURCE_HEADERS = (
    "market",
    "ticker",
    "providerSymbol",
    "nameKr",
    "assetType",
    "sourceUniverse",
    "active",
    "listingStatus",
    "exposureType",
    "distributionType",
    "distributionFrequency",
    "notes",
)
REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


def _write_source(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=SOURCE_HEADERS)
        writer.writeheader()
        writer.writerows(rows)


def _source_row(
    market: str,
    ticker: str,
    provider_symbol: str,
    *,
    listing_market: str = "",
) -> dict[str, str]:
    return {
        "market": market,
        "ticker": ticker,
        "providerSymbol": provider_symbol,
        "nameKr": ticker,
        "assetType": "etf",
        "sourceUniverse": "",
        "active": "True",
        "listingStatus": "active",
        "exposureType": "broad_market",
        "distributionType": "ordinary_cash_dividend",
        "distributionFrequency": "quarterly",
        "notes": (
            f"market={listing_market}"
            if market == "KR" and listing_market
            else ""
        ),
    }


class BootstrapUniverseTests(unittest.TestCase):
    def test_bootstrap_preserves_counts_identity_and_provider_symbols(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source_path = Path(temporary) / "source.csv"
            _write_source(
                source_path,
                [
                    _source_row(
                        "KR",
                        "005930",
                        "005930",
                        listing_market="KOSPI",
                    ),
                    {
                        **_source_row("KR", "0000D0", "0000D0"),
                        "assetType": "ETF",
                        "sourceUniverse": (
                            "kr_etf_market_snapshot_20260524"
                        ),
                    },
                    _source_row("US", "SPY", "SPY"),
                ],
            )
            source = load_canonical_source(source_path)
            rows, report = build_universe_rows(
                source,
                {
                    "KR": ("KR:069500", "069500.KS"),
                    "US": ("US:SPY", "SPY"),
                },
            )
            self.assertEqual(report["inputRowCount"], 3)
            self.assertEqual(report["outputRowCount"], 3)
            self.assertEqual(report["marketRowCounts"], {"KR": 2, "US": 1})
            self.assertTrue(report["identityMatch"])
            self.assertEqual(report["canonicalProviderSymbolCount"], 3)
            self.assertEqual(report["adapterReadySymbolCount"], 3)
            self.assertEqual(report["derivedAdapterSymbolCount"], 2)
            self.assertEqual(report["unresolvedAdapterSymbolCount"], 0)
            self.assertEqual(
                [row["ticker"] for row in rows],
                ["005930", "0000D0", "SPY"],
            )
            self.assertEqual(rows[0]["providerSymbol"], "005930")
            self.assertEqual(
                rows[0]["marketDataProviderSymbol"],
                "005930.KS",
            )
            self.assertEqual(rows[1]["providerSymbol"], "0000D0")
            self.assertEqual(
                rows[1]["marketDataProviderSymbol"],
                "0000D0.KS",
            )

    def test_provider_adapter_resolution_requires_evidence_and_maps_class_share(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source_path = Path(temporary) / "source.csv"
            _write_source(
                source_path,
                [
                    _source_row("KR", "005930", "005930"),
                    _source_row("US", "BRK.B", "BRK.B"),
                ],
            )
            rows, report = build_universe_rows(
                load_canonical_source(source_path),
                {
                    "KR": ("KR:069500", "069500.KS"),
                    "US": ("US:SPY", "SPY"),
                },
            )
        self.assertEqual(rows[0]["providerSymbol"], "005930")
        self.assertEqual(rows[0]["marketDataProviderSymbol"], "")
        self.assertEqual(
            rows[0]["marketDataProviderSymbolStatus"],
            "unresolved",
        )
        self.assertEqual(rows[1]["providerSymbol"], "BRK.B")
        self.assertEqual(rows[1]["marketDataProviderSymbol"], "BRK-B")
        self.assertEqual(report["unresolvedAdapterSymbolCount"], 1)
        self.assertEqual(
            report["adapterSymbolUnresolvedByMarket"],
            {"KR": 1, "US": 0},
        )

    def test_runtime_provider_resolution_uses_listing_evidence(self) -> None:
        runtime_path = (
            REPOSITORY_ROOT
            / "src"
            / "data"
            / "tickers"
            / "finple_app_candidates_v2.csv"
        )
        rows, report = build_universe_rows(
            load_canonical_source(runtime_path),
            {
                "KR": ("KR:069500", "069500.KS"),
                "US": ("US:SPY", "SPY"),
            },
        )
        by_identity = {
            f"{row['market']}:{row['ticker']}": row for row in rows
        }
        self.assertEqual(
            by_identity["KR:005930"]["marketDataProviderSymbol"],
            "005930.KS",
        )
        self.assertEqual(
            by_identity["KR:060310"]["marketDataProviderSymbol"],
            "060310.KQ",
        )
        self.assertEqual(report["canonicalProviderSymbolCount"], 6029)
        self.assertEqual(report["adapterReadySymbolCount"], 6008)
        self.assertEqual(report["derivedAdapterSymbolCount"], 2979)
        self.assertEqual(report["unresolvedAdapterSymbolCount"], 21)
        self.assertEqual(
            report["adapterSymbolUnresolvedByMarket"],
            {"KR": 21, "US": 0},
        )
        self.assertEqual(
            report["adapterReadySymbolCount"]
            + report["unresolvedAdapterSymbolCount"],
            6029,
        )

    def test_monthly_update_preserves_manual_provider_and_benchmark(self) -> None:
        existing = [
            {
                "market": "US",
                "ticker": "SPY",
                "name": "old",
                "providerSymbol": "MANUAL-SPY",
                "marketDataProvider": "manual-provider",
                "marketDataProviderSymbol": "MANUAL-SPY-LIVE",
                "benchmark": "US:MANUAL",
                "benchmarkProviderSymbol": "MANUAL",
                "active": "true",
                "includeInSimulator": "true",
                "exposureType": "manual-exposure",
                "distributionType": "index_covered_call",
                "distributionFrequency": "monthly",
            },
            {
                "market": "US",
                "ticker": "OLD",
                "providerSymbol": "OLD",
                "marketDataProvider": "yfinance",
                "marketDataProviderSymbol": "OLD",
                "benchmark": "US:SPY",
                "benchmarkProviderSymbol": "SPY",
                "active": "true",
                "includeInSimulator": "true",
            },
        ]
        source = [
            {
                "market": "US",
                "ticker": "SPY",
                "name": "new source name",
                "providerSymbol": "SPY",
                "marketDataProvider": "yfinance",
                "marketDataProviderSymbol": "SPY",
                "benchmark": "US:SPY",
                "benchmarkProviderSymbol": "SPY",
                "active": "false",
                "includeInSimulator": "false",
                "exposureType": "source-exposure",
                "distributionType": "ordinary_cash_dividend",
                "distributionFrequency": "quarterly",
            },
            {
                "market": "US",
                "ticker": "QQQ",
                "name": "QQQ",
                "providerSymbol": "QQQ",
                "marketDataProvider": "yfinance",
                "marketDataProviderSymbol": "QQQ",
                "benchmark": "US:SPY",
                "benchmarkProviderSymbol": "SPY",
                "active": "true",
                "includeInSimulator": "true",
            },
        ]
        rows, report = update_universe_rows(existing, source)
        self.assertEqual(rows[0]["providerSymbol"], "MANUAL-SPY")
        self.assertEqual(rows[0]["marketDataProvider"], "manual-provider")
        self.assertEqual(
            rows[0]["marketDataProviderSymbol"],
            "MANUAL-SPY-LIVE",
        )
        self.assertEqual(rows[0]["benchmark"], "US:MANUAL")
        self.assertEqual(rows[0]["active"], "true")
        self.assertEqual(rows[0]["includeInSimulator"], "true")
        self.assertEqual(rows[0]["exposureType"], "manual-exposure")
        self.assertEqual(rows[0]["distributionType"], "index_covered_call")
        self.assertEqual(rows[0]["distributionFrequency"], "monthly")
        self.assertEqual(rows[0]["name"], "new source name")
        self.assertEqual(rows[1]["active"], "false")
        self.assertEqual(rows[1]["includeInSimulator"], "false")
        self.assertEqual(rows[1]["reasonCode"], "source_asset_removed")
        self.assertEqual(rows[2]["ticker"], "QQQ")
        self.assertEqual(rows[2]["active"], "true")
        self.assertEqual(rows[2]["includeInSimulator"], "false")
        self.assertEqual(
            rows[2]["reasonCode"],
            "new_asset_pending_metrics",
        )
        self.assertEqual(report["newAssetCount"], 1)
        self.assertEqual(report["excludedAssetCount"], 1)

    def test_monthly_update_initializes_new_adapter_columns_only_when_absent(
        self,
    ) -> None:
        existing = [
            {
                "market": "KR",
                "ticker": "005930",
                "name": "old",
                "providerSymbol": "005930",
                "benchmark": "KR:069500",
                "benchmarkProviderSymbol": "069500.KS",
                "active": "true",
                "includeInSimulator": "true",
                "exposureType": "ordinary_equity",
                "distributionType": "ordinary_cash_dividend",
                "distributionFrequency": "quarterly",
            }
        ]
        source = [
            {
                **existing[0],
                "name": "new",
                "marketDataProvider": "yfinance",
                "marketDataProviderSymbol": "005930.KS",
                "marketDataProviderSymbolStatus": "derived",
            }
        ]
        rows, _ = update_universe_rows(existing, source)
        self.assertEqual(rows[0]["marketDataProvider"], "yfinance")
        self.assertEqual(
            rows[0]["marketDataProviderSymbol"],
            "005930.KS",
        )
        self.assertEqual(
            rows[0]["marketDataProviderSymbolStatus"],
            "derived",
        )

    def test_runtime_6029_full_schema_reconciliation_without_provider(self) -> None:
        runtime_path = (
            REPOSITORY_ROOT
            / "src"
            / "data"
            / "tickers"
            / "finple_app_candidates_v2.csv"
        )
        source = load_canonical_source(runtime_path)
        rows, bootstrap_report = build_universe_rows(
            source,
            {
                "KR": ("KR:069500", "069500.KS"),
                "US": ("US:SPY", "SPY"),
            },
        )
        for row in rows:
            row["includeInSimulator"] = "false"

        class NoProvider:
            def load_asset(self, asset, as_of_date):
                raise AssertionError("provider must not be called")

            def load_benchmark(self, asset, as_of_date):
                raise AssertionError("provider must not be called")

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            universe = root / "universe.csv"
            candidate = root / "candidate.csv"
            write_universe(universe, rows)
            result = build_canonical_candidate(
                PipelineConfig(
                    source_canonical_path=runtime_path,
                    universe_path=universe,
                    output_candidate_path=candidate,
                    as_of_date=date(2026, 7, 29),
                ),
                NoProvider(),
            )
            with candidate.open(
                encoding="utf-8",
                newline="",
            ) as handle:
                reader = csv.DictReader(handle)
                candidate_rows = list(reader)
                headers = tuple(reader.fieldnames or ())
        self.assertEqual(bootstrap_report["inputRowCount"], 6029)
        self.assertEqual(
            bootstrap_report["canonicalProviderSymbolCount"],
            6029,
        )
        self.assertEqual(len(candidate_rows), 6029)
        self.assertEqual(
            headers[: len(source.headers)],
            source.headers,
        )
        self.assertTrue(result.validation["structuralValid"])
        self.assertTrue(result.validation["publishable"])
        candidate_by_identity = {
            f"{row['market']}:{row['ticker']}": row
            for row in candidate_rows
        }
        self.assertEqual(
            candidate_by_identity["KR:005930"]["providerSymbol"],
            "005930",
        )
        self.assertEqual(
            candidate_by_identity["KR:005930"][
                "marketDataProviderSymbol"
            ],
            "005930.KS",
        )


if __name__ == "__main__":
    unittest.main()
