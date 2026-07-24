import csv
import hashlib
import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import finple_universe_v2 as universe
from collect_finple_universe_delta import (
    DeltaCollectionError,
    adapt_yfinance_history,
    collect_delta,
)
from merge_finple_universe_delta import StreamingMergeError, streaming_merge
from export_finple_app_preview import choose_shard_count
from scripts.metrics_pipeline.schemas import RAW_DAILY_PRICE_COLUMNS


def canonical_raw_row(ticker: str, date: str = "2026-07-23") -> dict[str, str]:
    return {
        "market": "US",
        "ticker": ticker,
        "date": date,
        "currency": "USD",
        "close": "10",
        "splitAdjustedClose": "10",
        "totalReturnAdjustedClose": "10",
        "volume": "100",
        "splitFactor": "1",
        "cashDividend": "0",
        "sourceId": "fixture",
        "retrievedAt": "2026-07-24T00:00:00+00:00",
        "priceAdjustmentBasis": "split_adjusted",
        "publicationEligibility": "review_required",
        "providerOrInstitution": "test fixture",
        "licenseStatus": "review_required",
        "internalUseAllowed": "review_required",
        "publicationAllowed": "false",
        "redistributionAllowed": "false",
    }


def rewrite_checksum(output_dir: Path, name: str) -> None:
    path = output_dir / name
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    checksum_path = output_dir / "checksums.sha256"
    lines = checksum_path.read_text(encoding="utf-8").splitlines()
    checksum_path.write_text(
        "\n".join(
            f"{digest}  {name}" if line.endswith(f"  {name}") else line
            for line in lines
        )
        + "\n",
        encoding="utf-8",
    )


class UniverseV2Tests(unittest.TestCase):
    def test_generated_universe_is_deterministic_and_preserves_v1(self):
        manifest = json.loads((ROOT / "src/data/tickers/finple_universe_v2_manifest.json").read_text())
        reconciliation = json.loads(
            (ROOT / "src/data/tickers/finple_universe_v2_reconciliation.json").read_text()
        )
        self.assertGreater(manifest["assetCount"], 6000)
        self.assertEqual(manifest["marketAssetCounts"], {"KR": 3000, "US": 3029})
        self.assertEqual(reconciliation["existingIdentityCount"], 6000)
        self.assertEqual(reconciliation["removedExistingIdentityCount"], 0)
        self.assertEqual(reconciliation["duplicateIdentityCount"], 0)
        self.assertEqual(reconciliation["newIdentityCount"], 29)
        self.assertTrue(universe.check_generated_files(
            ROOT / "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv",
            ROOT / "src/data/tickers/finple_app_candidates_v2.csv",
            ROOT / "src/data/tickers/finple_universe_v2_manifest.json",
            ROOT / "src/data/tickers/finple_universe_v2_reconciliation.json",
        ))

    def test_product_metadata_and_null_history_are_explicit(self):
        with (ROOT / "src/data/tickers/finple_app_candidates_v2.csv").open(encoding="utf-8") as handle:
            rows = {row["ticker"]: row for row in csv.DictReader(handle) if row["market"] == "US"}
        self.assertEqual(rows["TSLL"]["exposureType"], "single_stock_leveraged")
        self.assertEqual(rows["TSLZ"]["direction"], "inverse")
        self.assertEqual(rows["AAPY"]["distributionType"], "mixed_distribution")
        self.assertEqual(rows["QYLG"]["exposureType"], "index_covered_call_growth")
        self.assertEqual(rows["AIPI"]["exposureType"], "thematic_equity_premium_income")
        self.assertEqual(rows["TSLL"]["expectedCagr"], "")
        self.assertIn(rows["TSLL"]["cagrPolicy"], {"since_inception", "blank_review_required"})

    def test_official_source_validator_is_syntax_only_and_provider_free(self):
        self.assertIn("no HTTP request", universe.validate_official_source.__doc__)
        row = universe.addition_rows()[0]
        universe.validate_official_source(row)
        with self.assertRaisesRegex(ValueError, "URL syntax"):
            universe.validate_official_source({**row, "officialSourceUrl": "http://example.com"})

    def test_yfinance_adapter_emits_canonical_rows_without_inventing_missing_values(self):
        first = datetime(2026, 7, 22)
        second = datetime(2026, 7, 23)

        class Frame(dict):
            empty = False

        frame = Frame({
            "Close": {first: 10.0, second: 11.0},
            "Adj Close": {first: 9.5, second: 10.7},
            "Volume": {first: None, second: 0},
            "Dividends": {first: None, second: 0},
            "Stock Splits": {first: None, second: 0},
            "Open": {first: 999, second: 999},
        })
        rows = adapt_yfinance_history(
            "TEST",
            frame,
            retrieved_at="2026-07-24T00:00:00+00:00",
        )
        self.assertEqual([list(row) for row in rows], [RAW_DAILY_PRICE_COLUMNS] * 2)
        self.assertEqual(rows[0]["currency"], "USD")
        self.assertEqual(rows[0]["close"], rows[0]["splitAdjustedClose"])
        self.assertEqual(rows[0]["totalReturnAdjustedClose"], "9.5")
        self.assertEqual(rows[0]["volume"], "")
        self.assertEqual(rows[1]["volume"], "0")
        self.assertEqual(rows[0]["cashDividend"], "")
        self.assertEqual(rows[1]["cashDividend"], "0")
        self.assertEqual(rows[0]["splitFactor"], "1")
        self.assertNotIn("Open", rows[0])

        frame["Adj Close"] = {first: 9.5, second: None}
        incomplete = adapt_yfinance_history(
            "TEST",
            frame,
            retrieved_at="2026-07-24T00:00:00+00:00",
        )
        self.assertEqual([row["totalReturnAdjustedClose"] for row in incomplete], ["", ""])

    def test_delta_candidate_schema_evidence_and_exact_resume(self):
        canonical = ROOT / "src/data/tickers/finple_app_candidates_v2.csv"
        reconciliation = ROOT / "src/data/tickers/finple_universe_v2_reconciliation.json"
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            fetcher = lambda ticker, start: [canonical_raw_row(ticker)]
            first = collect_delta(
                canonical, reconciliation, root, universe.TARGET_UNIVERSE_VERSION, fetcher=fetcher
            )
            self.assertEqual(first["additionCount"], 29)
            output_dir = root / "universe-deltas" / universe.TARGET_UNIVERSE_VERSION
            with (output_dir / "candidate-additions.csv").open(encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                additions = list(reader)
                self.assertEqual(reader.fieldnames, universe.CANONICAL_FIELDS)
            self.assertEqual(len(additions), 29)
            identities = [(row["market"], row["ticker"]) for row in additions]
            self.assertEqual(len(identities), len(set(identities)))
            with canonical.open(encoding="utf-8", newline="") as handle:
                expected = list(csv.DictReader(handle))
            new_identities = set(json.loads(reconciliation.read_text())["newIdentities"])
            expected_additions = [
                row for row in expected
                if f"{row['market']}:{row['ticker']}" in new_identities
            ]
            self.assertEqual(additions, expected_additions)

            with canonical.open(encoding="utf-8", newline="") as handle:
                canonical_rows = {(row["market"], row["ticker"]) for row in csv.DictReader(handle)}
            self.assertIn(("KR", "0000D0"), canonical_rows)
            self.assertIn(("KR", "0001A0"), canonical_rows)

            with (output_dir / "us-new-assets-raw-daily.csv").open(
                encoding="utf-8-sig", newline=""
            ) as handle:
                self.assertEqual(csv.DictReader(handle).fieldnames, RAW_DAILY_PRICE_COLUMNS)
            evidence = json.loads((output_dir / "source-evidence.json").read_text())
            self.assertEqual(len(evidence["assets"]), 29)
            required_evidence = {
                "verificationMethod", "verifiedTicker", "verifiedPageTitle",
                "officialProductName", "officialSourceUrl", "sourceCheckedAt",
                "listingStatus", "active", "issuer", "inceptionDate",
            }
            self.assertTrue(all(required_evidence <= set(asset) for asset in evidence["assets"]))
            self.assertTrue(all(
                asset["verificationMethod"] == "manual_official_page_review"
                for asset in evidence["assets"]
            ))
            with self.assertRaises(DeltaCollectionError):
                collect_delta(
                    canonical, reconciliation, root, universe.TARGET_UNIVERSE_VERSION, fetcher=fetcher
                )
            resumed = collect_delta(
                canonical,
                reconciliation,
                root,
                universe.TARGET_UNIVERSE_VERSION,
                resume=True,
                fetcher=fetcher,
            )
            self.assertEqual(first["canonicalUniverseSha256"], resumed["canonicalUniverseSha256"])

    def test_resume_corruption_cases_fail_closed(self):
        canonical = ROOT / "src/data/tickers/finple_app_candidates_v2.csv"
        reconciliation = ROOT / "src/data/tickers/finple_universe_v2_reconciliation.json"
        cases = (
            "raw tamper",
            "raw missing",
            "source evidence tamper",
            "checksums missing",
            "checksums malformed",
            "extra file",
            "manifest count mismatch",
        )
        for case in cases:
            with self.subTest(case=case), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                fetcher = lambda ticker, start: [canonical_raw_row(ticker)]
                collect_delta(
                    canonical,
                    reconciliation,
                    root,
                    universe.TARGET_UNIVERSE_VERSION,
                    fetcher=fetcher,
                )
                output_dir = root / "universe-deltas" / universe.TARGET_UNIVERSE_VERSION
                if case == "raw tamper":
                    path = output_dir / "us-new-assets-raw-daily.csv"
                    path.write_bytes(path.read_bytes() + b"\n")
                elif case == "raw missing":
                    (output_dir / "us-new-assets-raw-daily.csv").unlink()
                elif case == "source evidence tamper":
                    path = output_dir / "source-evidence.json"
                    path.write_text(path.read_text() + " ", encoding="utf-8")
                elif case == "checksums missing":
                    (output_dir / "checksums.sha256").unlink()
                elif case == "checksums malformed":
                    (output_dir / "checksums.sha256").write_text("not-a-checksum\n")
                elif case == "extra file":
                    (output_dir / "unexpected.txt").write_text("blocked")
                elif case == "manifest count mismatch":
                    path = output_dir / "universe-delta-manifest.json"
                    manifest = json.loads(path.read_text())
                    manifest["additionCount"] = 28
                    path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
                    rewrite_checksum(output_dir, path.name)
                with self.assertRaisesRegex(DeltaCollectionError, "--resume refused"):
                    collect_delta(
                        canonical,
                        reconciliation,
                        root,
                        universe.TARGET_UNIVERSE_VERSION,
                        resume=True,
                        fetcher=fetcher,
                    )

    def test_collector_output_streams_into_canonical_merge(self):
        canonical = ROOT / "src/data/tickers/finple_app_candidates_v2.csv"
        reconciliation = ROOT / "src/data/tickers/finple_universe_v2_reconciliation.json"
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            collect_delta(
                canonical,
                reconciliation,
                root,
                universe.TARGET_UNIVERSE_VERSION,
                fetcher=lambda ticker, start: [canonical_raw_row(ticker)],
            )
            delta = (
                root / "universe-deltas" / universe.TARGET_UNIVERSE_VERSION
                / "us-new-assets-raw-daily.csv"
            )
            source, output = root / "source.csv", root / "out.csv"
            source_row = canonical_raw_row("000A", "2026-01-01")
            with source.open("w", newline="", encoding="utf-8") as handle:
                writer = csv.DictWriter(handle, fieldnames=RAW_DAILY_PRICE_COLUMNS)
                writer.writeheader()
                writer.writerow(source_row)
            result = streaming_merge(source, delta, output)
            self.assertEqual(result["mergedRowCount"], 30)
            with output.open(encoding="utf-8", newline="") as handle:
                self.assertEqual(csv.DictReader(handle).fieldnames, RAW_DAILY_PRICE_COLUMNS)

    def test_streaming_merge_blocks_duplicates_noncanonical_headers_and_cleans_temp(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, delta, output = root / "source.csv", root / "delta.csv", root / "out.csv"
            for path, row in (
                (source, canonical_raw_row("AAA")),
                (delta, canonical_raw_row("BBB")),
            ):
                with path.open("w", newline="", encoding="utf-8") as handle:
                    writer = csv.DictWriter(handle, fieldnames=RAW_DAILY_PRICE_COLUMNS)
                    writer.writeheader()
                    writer.writerow(row)
            result = streaming_merge(source, delta, output)
            self.assertEqual(result["mergedRowCount"], 2)
            output.unlink()
            delta.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
            with self.assertRaises(StreamingMergeError):
                streaming_merge(source, delta, output)
            self.assertFalse(output.with_suffix(".csv.tmp").exists())
            delta.write_text("market,ticker,date,close\nUS,BBB,2026-07-23,1\n")
            with self.assertRaisesRegex(StreamingMergeError, "canonical raw-daily schema"):
                streaming_merge(source, delta, output)

    def test_dynamic_shards_cover_legacy_and_growth_volumes(self):
        self.assertEqual(choose_shard_count(100)[0], 64)
        self.assertEqual(choose_shard_count(700_375)[0], 128)
        self.assertEqual(choose_shard_count(1_500_000)[0], 256)


if __name__ == "__main__":
    unittest.main()
