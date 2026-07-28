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
) -> dict[str, str]:
    return {
        "market": market,
        "ticker": ticker,
        "providerSymbol": provider_symbol,
        "nameKr": ticker,
        "assetType": "etf",
        "active": "True",
        "listingStatus": "active",
        "exposureType": "broad_market",
        "distributionType": "ordinary_cash_dividend",
        "distributionFrequency": "quarterly",
        "notes": "market=KOSPI" if market == "KR" else "",
    }


class BootstrapUniverseTests(unittest.TestCase):
    def test_bootstrap_preserves_counts_identity_and_provider_symbols(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            source_path = Path(temporary) / "source.csv"
            _write_source(
                source_path,
                [
                    _source_row("KR", "005930", "005930.KS"),
                    _source_row("KR", "0000D0", "0000D0.KS"),
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
            self.assertEqual(report["providerSymbolUnresolvedCount"], 0)
            self.assertEqual(
                [row["ticker"] for row in rows],
                ["005930", "0000D0", "SPY"],
            )
            self.assertEqual(rows[1]["providerSymbol"], "0000D0.KS")

    def test_monthly_update_preserves_manual_provider_and_benchmark(self) -> None:
        existing = [
            {
                "market": "US",
                "ticker": "SPY",
                "name": "old",
                "providerSymbol": "MANUAL-SPY",
                "benchmark": "US:MANUAL",
                "benchmarkProviderSymbol": "MANUAL",
                "active": "true",
                "includeInSimulator": "true",
            },
            {
                "market": "US",
                "ticker": "OLD",
                "providerSymbol": "OLD",
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
                "benchmark": "US:SPY",
                "benchmarkProviderSymbol": "SPY",
                "active": "true",
                "includeInSimulator": "true",
            },
            {
                "market": "US",
                "ticker": "QQQ",
                "name": "QQQ",
                "providerSymbol": "QQQ",
                "benchmark": "US:SPY",
                "benchmarkProviderSymbol": "SPY",
                "active": "true",
                "includeInSimulator": "true",
            },
        ]
        rows, report = update_universe_rows(existing, source)
        self.assertEqual(rows[0]["providerSymbol"], "MANUAL-SPY")
        self.assertEqual(rows[0]["benchmark"], "US:MANUAL")
        self.assertEqual(rows[0]["name"], "new source name")
        self.assertEqual(rows[1]["active"], "false")
        self.assertEqual(rows[1]["includeInSimulator"], "false")
        self.assertEqual(rows[2]["ticker"], "QQQ")
        self.assertEqual(report["newAssetCount"], 1)
        self.assertEqual(report["excludedAssetCount"], 1)

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
        self.assertEqual(len(candidate_rows), 6029)
        self.assertEqual(
            headers[: len(source.headers)],
            source.headers,
        )
        self.assertTrue(result.validation["structuralValid"])
        self.assertTrue(result.validation["publishable"])


if __name__ == "__main__":
    unittest.main()
