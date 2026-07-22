from __future__ import annotations

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import pandas as pd

from scripts import build_us_price_metrics_overlay_chunked as us_builder
from scripts.prepare_monthly_metrics_candidate_inputs import build_candidate_rows
from scripts.raw_daily_price_chunks import (
    combine_raw_daily_chunks,
    extract_raw_daily_rows,
    read_raw_daily_rows,
    write_raw_daily_rows,
)


def fake_history(*, split: bool = False) -> pd.DataFrame:
    index = pd.to_datetime(["2025-01-02", "2025-01-03", "2025-01-06"])
    return pd.DataFrame(
        {
            "Close": [100.0, 52.0 if split else 101.0, 53.0 if split else 102.0],
            "Adj Close": [50.0 if split else 99.0, 51.5 if split else 100.0, 52.5 if split else 101.0],
            "Volume": [1000, 1100, 1200],
            "Dividends": [0.0, 0.25, 0.0],
            "Stock Splits": [0.0, 2.0 if split else 0.0, 0.0],
        },
        index=index,
    )


class RawDailyCollectionTests(unittest.TestCase):
    def test_twenty_asset_smoke_preserves_fields_and_unique_identity(self):
        rows = []
        for index in range(20):
            rows.extend(
                extract_raw_daily_rows(
                    fake_history(split=index == 0),
                    market="US",
                    ticker=f"T{index:03d}",
                    currency="USD",
                    retrieved_at="2026-07-23T00:00:00+00:00",
                )
            )
        self.assertEqual(len(rows), 60)
        self.assertEqual(len({(row["market"], row["ticker"]) for row in rows}), 20)
        self.assertEqual(len({(row["market"], row["ticker"], row["date"]) for row in rows}), 60)
        self.assertEqual(rows[0]["priceAdjustmentBasis"], "total_return_adjusted")
        self.assertTrue(rows[0]["splitAdjustedClose"])
        self.assertTrue(rows[0]["totalReturnAdjustedClose"])
        self.assertEqual(rows[1]["cashDividend"], "0.25")
        self.assertEqual(rows[1]["splitFactor"], "2")
        self.assertEqual(rows[0]["licenseStatus"], "review_required")
        self.assertEqual(rows[0]["publicationAllowed"], "false")

    def test_split_adjusted_close_requires_explicit_split_evidence(self):
        data = fake_history(split=False).drop(columns=["Adj Close"])
        rows = extract_raw_daily_rows(
            data,
            market="KR",
            ticker="5930",
            currency="KRW",
            retrieved_at="2026-07-23T00:00:00+00:00",
        )
        self.assertEqual({row["ticker"] for row in rows}, {"005930"})
        self.assertEqual({row["priceAdjustmentBasis"] for row in rows}, {"raw_close"})
        self.assertEqual({row["splitAdjustedClose"] for row in rows}, {""})
        self.assertEqual({row["totalReturnAdjustedClose"] for row in rows}, {""})

    def test_us_100_asset_checkpoint_and_resume_uses_mock_provider(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            input_path = root / "universe.csv"
            with input_path.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["market", "ticker", "providerSymbol", "assetType", "nameKr"])
                writer.writeheader()
                for index in range(100):
                    writer.writerow(
                        {
                            "market": "US",
                            "ticker": f"T{index:03d}",
                            "providerSymbol": f"T{index:03d}",
                            "assetType": "stock",
                            "nameKr": "",
                        }
                    )
            runtime = root / "runtime.csv"
            audit = root / "audit.csv"
            summary = root / "summary.json"
            raw = root / "raw.csv"
            argv = [
                "build_us_price_metrics_overlay_chunked.py",
                "--input", str(input_path),
                "--out-runtime", str(runtime),
                "--out-audit", str(audit),
                "--out-summary", str(summary),
                "--out-raw", str(raw),
                "--as-of", "2026-07-23",
                "--start", "0",
                "--limit", "100",
                "--checkpoint-every", "25",
                "--retrieved-at", "2026-07-23T00:00:00+00:00",
            ]
            with mock.patch.object(us_builder, "pd", pd), mock.patch.object(us_builder, "yf", object()), mock.patch.object(us_builder, "download_history", side_effect=lambda *_args, **_kwargs: fake_history()), mock.patch.object(sys, "argv", argv):
                us_builder.main()
            self.assertEqual(len(read_raw_daily_rows(raw)), 300)
            self.assertEqual(json.loads(summary.read_text(encoding="utf-8"))["processed_count"], 100)

            resumed_calls = []

            def resume_download(symbol, *_args, **_kwargs):
                resumed_calls.append(symbol)
                if symbol != "SPY":
                    raise AssertionError(f"resume unexpectedly downloaded {symbol}")
                return fake_history()

            with mock.patch.object(us_builder, "pd", pd), mock.patch.object(us_builder, "yf", object()), mock.patch.object(us_builder, "download_history", side_effect=resume_download), mock.patch.object(sys, "argv", [*argv, "--resume"]):
                us_builder.main()
            self.assertEqual(resumed_calls, ["SPY"])
            self.assertEqual(len(read_raw_daily_rows(raw)), 300)

    def test_market_chunk_combine_and_canonical_6000_reconciliation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            for market, ticker, prefix in [("US", "AAA", "us"), ("KR", "005930", "kr")]:
                rows = extract_raw_daily_rows(
                    fake_history(),
                    market=market,
                    ticker=ticker,
                    currency="USD" if market == "US" else "KRW",
                    retrieved_at="2026-07-23T00:00:00+00:00",
                )
                write_raw_daily_rows(root / f"{prefix}_part0000.csv", rows)
                summary = combine_raw_daily_chunks(
                    str(root / f"{prefix}_part*.csv"),
                    root / f"{prefix}_combined.csv",
                    market,
                )
                self.assertEqual(summary["rawDailyAssetCount"], 1)
                self.assertEqual(summary["rawDailyRowCount"], 3)

        repo_root = Path(__file__).resolve().parents[3]
        universe_path = repo_root / "src" / "data" / "tickers" / "finple_app_candidates_6000_balanced_v1.csv"
        with universe_path.open("r", encoding="utf-8-sig", newline="") as handle:
            universe = list(csv.DictReader(handle))
        kr_mapping = {
            str(row["ticker"]).zfill(6): "KR_KOSPI"
            for row in universe
            if row["market"] == "KR"
        }
        candidates, review = build_candidate_rows(universe, kr_mapping)
        self.assertEqual(len(candidates), 6000)
        self.assertEqual(sum(row["market"] == "US" for row in candidates), 3000)
        self.assertEqual(sum(row["market"] == "KR" for row in candidates), 3000)
        self.assertEqual(len({(row["market"], row["ticker"]) for row in candidates}), 6000)
        self.assertEqual(review, [])
        self.assertEqual({row["isActive"] for row in candidates}, {""})


if __name__ == "__main__":
    unittest.main()
