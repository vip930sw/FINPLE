import csv
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SCRIPTS = ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS))

import finple_universe_v2 as universe
from collect_finple_universe_delta import DeltaCollectionError, collect_delta
from merge_finple_universe_delta import StreamingMergeError, streaming_merge
from export_finple_app_preview import choose_shard_count


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

    def test_delta_existing_version_and_exact_resume_are_fail_closed(self):
        canonical = ROOT / "src/data/tickers/finple_app_candidates_v2.csv"
        reconciliation = ROOT / "src/data/tickers/finple_universe_v2_reconciliation.json"
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            fetcher = lambda ticker, start: [{
                "market": "US", "ticker": ticker, "date": "2026-07-23",
                "open": 1, "high": 1, "low": 1, "close": 1, "adjClose": 1,
                "volume": 1, "dividend": 0, "stockSplit": 0,
            }]
            first = collect_delta(
                canonical, reconciliation, root, universe.TARGET_UNIVERSE_VERSION, fetcher=fetcher
            )
            self.assertEqual(first["additionCount"], 29)
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

    def test_streaming_merge_blocks_duplicates_and_cleans_temp(self):
        fields = ["market", "ticker", "date", "close"]
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, delta, output = root / "source.csv", root / "delta.csv", root / "out.csv"
            for path, rows in (
                (source, [["US", "AAA", "2026-01-01", "1"]]),
                (delta, [["US", "BBB", "2026-01-01", "2"]]),
            ):
                with path.open("w", newline="", encoding="utf-8") as handle:
                    writer = csv.writer(handle)
                    writer.writerow(fields)
                    writer.writerows(rows)
            result = streaming_merge(source, delta, output)
            self.assertEqual(result["mergedRowCount"], 2)
            output.unlink()
            delta.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")
            with self.assertRaises(StreamingMergeError):
                streaming_merge(source, delta, output)
            self.assertFalse(output.with_suffix(".csv.tmp").exists())

    def test_dynamic_shards_cover_legacy_and_growth_volumes(self):
        self.assertEqual(choose_shard_count(100)[0], 64)
        self.assertEqual(choose_shard_count(700_375)[0], 128)
        self.assertEqual(choose_shard_count(1_500_000)[0], 256)


if __name__ == "__main__":
    unittest.main()
