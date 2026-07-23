from __future__ import annotations

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

import pandas as pd

from scripts import build_us_price_metrics_overlay_chunked as us_builder
from scripts import build_kr_price_metrics_overlay_chunked as kr_builder
from scripts import combine_kr_price_metrics_chunks as kr_combiner
from scripts.prepare_monthly_metrics_candidate_inputs import (
    build_candidate_rows,
    combine_market_raw_files,
    prepare_inputs,
)
from scripts.raw_daily_price_chunks import (
    actual_last_price_date,
    collection_date_window,
    combine_raw_daily_chunks,
    ensure_operating_run_paths,
    extract_raw_daily_rows,
    read_raw_daily_rows,
    write_raw_daily_rows,
)


def fake_history(*, split: bool = False) -> pd.DataFrame:
    index = pd.to_datetime(["2025-01-02", "2025-01-03", "2025-01-06"])
    return pd.DataFrame(
        {
            # Yahoo Close is already on one split-adjusted scale even when the
            # history also contains explicit Stock Splits evidence.
            "Close": [50.0, 51.5, 53.0] if split else [100.0, 101.0, 102.0],
            "Adj Close": [49.0, 50.75, 52.25] if split else [99.0, 100.0, 101.0],
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
        self.assertEqual(rows[0]["priceAdjustmentBasis"], "split_adjusted")
        self.assertEqual(rows[0]["splitAdjustedClose"], rows[0]["close"])
        self.assertEqual(rows[0]["totalReturnAdjustedClose"], "49")
        self.assertEqual(rows[1]["cashDividend"], "0.25")
        self.assertEqual(rows[1]["splitFactor"], "2")
        self.assertEqual(rows[0]["licenseStatus"], "review_required")
        self.assertEqual(rows[0]["publicationAllowed"], "false")

    def test_close_is_split_adjusted_even_without_adj_close_or_split_event(self):
        data = fake_history(split=False).drop(columns=["Adj Close"])
        rows = extract_raw_daily_rows(
            data,
            market="KR",
            ticker="005930",
            currency="KRW",
            retrieved_at="2026-07-23T00:00:00+00:00",
        )
        self.assertEqual({row["ticker"] for row in rows}, {"005930"})
        self.assertEqual({row["priceAdjustmentBasis"] for row in rows}, {"split_adjusted"})
        self.assertTrue(all(row["splitAdjustedClose"] == row["close"] for row in rows))
        self.assertEqual({row["totalReturnAdjustedClose"] for row in rows}, {""})

    def test_split_evidence_never_double_adjusts_yahoo_close(self):
        rows = extract_raw_daily_rows(
            fake_history(split=True),
            market="US",
            ticker="SPLT",
            currency="USD",
            retrieved_at="2026-07-23T00:00:00+00:00",
        )
        self.assertEqual([row["close"] for row in rows], ["50", "51.5", "53"])
        self.assertEqual([row["splitAdjustedClose"] for row in rows], ["50", "51.5", "53"])
        self.assertEqual([row["splitFactor"] for row in rows], ["1", "2", "1"])
        self.assertEqual([row["totalReturnAdjustedClose"] for row in rows], ["49", "50.75", "52.25"])

    def test_incomplete_adj_close_is_not_partially_preserved(self):
        data = fake_history(split=False)
        data.loc[data.index[1], "Adj Close"] = float("nan")
        rows = extract_raw_daily_rows(
            data,
            market="US",
            ticker="NOADJ",
            currency="USD",
            retrieved_at="2026-07-23T00:00:00+00:00",
        )
        self.assertTrue(all(row["splitAdjustedClose"] == row["close"] for row in rows))
        self.assertEqual({row["totalReturnAdjustedClose"] for row in rows}, {""})
        self.assertEqual({row["priceAdjustmentBasis"] for row in rows}, {"split_adjusted"})

    def test_mock_us_and_kr_twenty_asset_builder_smoke(self):
        cases = [(us_builder, "US"), (kr_builder, "KR")]
        for builder, market in cases:
            with self.subTest(market=market), tempfile.TemporaryDirectory() as temp_dir:
                provider_calls: list[tuple[str, str, str]] = []
                root = Path(temp_dir)
                input_path = root / "universe.csv"
                with input_path.open("w", encoding="utf-8-sig", newline="") as handle:
                    writer = csv.DictWriter(
                        handle,
                        fieldnames=["market", "ticker", "providerSymbol", "assetType", "nameKr"],
                    )
                    writer.writeheader()
                    for index in range(20):
                        ticker = "0086C0" if market == "KR" and index == 18 else (f"{index + 1:06d}" if market == "KR" else f"T{index:03d}")
                        writer.writerow(
                            {
                                "market": market,
                                "ticker": ticker,
                                "providerSymbol": ticker,
                                "assetType": "stock",
                                "nameKr": "",
                            }
                        )
                runtime = root / "runtime.csv"
                audit = root / "audit.csv"
                summary = root / "summary.json"
                raw = root / "raw.csv"
                argv = [
                    builder.__name__.split(".")[-1],
                    "--input", str(input_path),
                    "--out-runtime", str(runtime),
                    "--out-audit", str(audit),
                    "--out-summary", str(summary),
                    "--out-raw", str(raw),
                    "--as-of", "2026-07-23",
                    "--start", "0",
                    "--limit", "20",
                    "--checkpoint-every", "5",
                    "--retrieved-at", "2026-07-23T00:00:00+00:00",
                ]
                def fake_download(symbol, start, end, **_kwargs):
                    provider_calls.append((symbol, start, end))
                    if symbol == "0086C0.KS":
                        return None
                    return fake_history()

                with mock.patch.object(builder, "pd", pd), mock.patch.object(builder, "yf", object()), mock.patch.object(
                    builder, "download_history", side_effect=fake_download
                ), mock.patch.object(sys, "argv", argv):
                    builder.main()
                result = json.loads(summary.read_text(encoding="utf-8"))
                self.assertEqual(result["processed_count"], 20)
                self.assertEqual(result["raw_daily_asset_count"], 20)
                self.assertEqual(result["requestedAsOfIncluded"], "2026-07-23")
                self.assertEqual(result["providerDownloadEndExclusive"], "2026-07-24")
                self.assertEqual(result["actualLastPriceDate"], "2025-01-06")
                self.assertEqual(result["metricBaseDate"], "2026-07-23")
                self.assertEqual(result["metricDataThroughMonth"], "2025-01")
                self.assertTrue(result["partialFinalMonthDetected"])
                self.assertTrue(result["partialFinalMonthExcluded"])
                self.assertEqual(result["partialMonthPolicy"], "exclude_from_metrics")
                self.assertTrue(all(start == "2006-07-23" and end == "2026-07-24" for _, start, end in provider_calls))
                raw_rows = read_raw_daily_rows(raw)
                self.assertEqual(len({(row["market"], row["ticker"]) for row in raw_rows}), 20)
                if market == "KR":
                    called_symbols = [symbol for symbol, _start, _end in provider_calls]
                    self.assertIn("0086C0.KS", called_symbols)
                    self.assertIn("0086C0.KQ", called_symbols)
                    self.assertIn("0086C0", {row["ticker"] for row in raw_rows})

    def test_as_of_is_inclusive_and_operating_paths_support_drive_or_local(self):
        self.assertEqual(collection_date_window("2026-06-30", 20), ("2006-06-30", "2026-07-01"))
        self.assertEqual(collection_date_window("2026-07-01", 20), ("2006-07-01", "2026-07-02"))
        self.assertEqual(
            actual_last_price_date([{"date": "2026-06-30"}, {"date": "2026-07-01"}]),
            "2026-07-01",
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            drive_paths = ensure_operating_run_paths(
                "2026-07-22",
                use_google_drive=True,
                drive_root=str(root / "drive"),
            )
            local_paths = ensure_operating_run_paths(
                "2026-07-22",
                use_google_drive=False,
                drive_root=str(root / "unused-drive"),
                local_root=str(root / "local"),
            )
            for paths, expected_root in [
                (drive_paths, root / "drive" / "2026-07-22"),
                (local_paths, root / "local" / "2026-07-22"),
            ]:
                self.assertEqual(paths["root"], expected_root)
                for name in ["smoke", "chunks", "combined", "validation", "one_click"]:
                    self.assertTrue(paths[name].is_dir())

    def test_kr_candidate_symbols_preserve_numeric_and_alphanumeric_identity(self):
        self.assertEqual(
            kr_builder.candidate_symbols({"ticker": "005930", "providerSymbol": ""}),
            ["005930.KS", "005930.KQ"],
        )
        self.assertEqual(
            kr_builder.candidate_symbols({"ticker": "0086C0", "providerSymbol": "0086C0"}),
            ["0086C0.KS", "0086C0.KQ"],
        )
        self.assertEqual(
            kr_builder.candidate_symbols({"ticker": "005930", "providerSymbol": "005930.KQ"}),
            ["005930.KQ", "005930.KS"],
        )

    def test_kr_raw_identity_is_exact_and_invalid_lengths_or_characters_are_rejected(self):
        for ticker in ["005930", "0086C0"]:
            with self.subTest(ticker=ticker):
                rows = extract_raw_daily_rows(
                    fake_history(),
                    market="KR",
                    ticker=ticker,
                    currency="KRW",
                    retrieved_at="2026-07-23T00:00:00+00:00",
                )
                self.assertEqual({row["ticker"] for row in rows}, {ticker})

        for ticker in ["05930", "0005930", "00-930"]:
            with self.subTest(ticker=ticker), self.assertRaisesRegex(ValueError, "invalid KR ticker identity"):
                extract_raw_daily_rows(
                    fake_history(),
                    market="KR",
                    ticker=ticker,
                    currency="KRW",
                    retrieved_at="2026-07-23T00:00:00+00:00",
                )

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
            for market, ticker, prefix in [("US", "AAA", "us"), ("KR", "0086C0", "kr")]:
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
            str(row["ticker"]): "KR_KOSPI"
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

    def test_three_sorted_chunks_are_streamed_through_global_k_way_merge(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            chunks = [
                ("us_part0000.csv", "ZZZZ", ["2025-01-02", "2025-01-03"]),
                ("us_part0001.csv", "APCB", ["2023-05-03", "2023-05-04"]),
                ("us_part0002.csv", "MMMM", ["2024-02-01", "2024-02-02"]),
            ]
            for file_name, ticker, dates in chunks:
                rows = []
                for index, date_text in enumerate(dates):
                    row = extract_raw_daily_rows(
                        fake_history(),
                        market="US",
                        ticker=ticker,
                        currency="USD",
                        retrieved_at="2026-07-23T00:00:00+00:00",
                    )[index]
                    row["date"] = date_text
                    rows.append(row)
                write_raw_daily_rows(root / file_name, rows)

            output = root / "us_combined.csv"
            summary = combine_raw_daily_chunks(str(root / "us_part*.csv"), output, "US")
            with output.open("r", encoding="utf-8-sig", newline="") as handle:
                combined = list(csv.DictReader(handle))
            keys = [(row["market"], row["ticker"], row["date"]) for row in combined]
            self.assertEqual(keys, sorted(keys))
            self.assertEqual([row["ticker"] for row in combined], ["APCB", "APCB", "MMMM", "MMMM", "ZZZZ", "ZZZZ"])
            self.assertEqual(summary["rawDailyAssetCount"], 3)
            self.assertEqual(summary["rawDailyRowCount"], 6)

    def test_k_way_merge_rejects_real_duplicate_key_across_streams(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            row = extract_raw_daily_rows(
                fake_history(),
                market="US",
                ticker="APCB",
                currency="USD",
                retrieved_at="2026-07-23T00:00:00+00:00",
            )[0]
            write_raw_daily_rows(root / "us_part0000.csv", [row])
            write_raw_daily_rows(root / "us_part0001.csv", [row])
            with self.assertRaisesRegex(ValueError, "duplicate raw key across chunks"):
                combine_raw_daily_chunks(str(root / "us_part*.csv"), root / "combined.csv", "US")

    def test_k_way_merge_rejects_one_asset_split_across_chunks(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            rows = extract_raw_daily_rows(
                fake_history(),
                market="US",
                ticker="APCB",
                currency="USD",
                retrieved_at="2026-07-23T00:00:00+00:00",
            )
            write_raw_daily_rows(root / "us_part0000.csv", [rows[0]])
            write_raw_daily_rows(root / "us_part0001.csv", [rows[1]])
            with self.assertRaisesRegex(ValueError, "asset appears in multiple raw chunks"):
                combine_raw_daily_chunks(str(root / "us_part*.csv"), root / "combined.csv", "US")

    def test_k_way_merge_preserves_kr_alphanumeric_identity(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            for index, ticker in enumerate(["0086C0", "005930", "229200"]):
                rows = extract_raw_daily_rows(
                    fake_history(),
                    market="KR",
                    ticker=ticker,
                    currency="KRW",
                    retrieved_at="2026-07-23T00:00:00+00:00",
                )
                write_raw_daily_rows(root / f"kr_part{index:04d}.csv", rows)
            output = root / "kr_combined.csv"
            combine_raw_daily_chunks(str(root / "kr_part*.csv"), output, "KR")
            with output.open("r", encoding="utf-8-sig", newline="") as handle:
                combined = list(csv.DictReader(handle))
            self.assertIn("0086C0", {row["ticker"] for row in combined})
            self.assertEqual(
                [(row["ticker"], row["date"]) for row in combined],
                sorted((row["ticker"], row["date"]) for row in combined),
            )

    def test_prepare_raw_order_and_duplicate_errors_are_distinct(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            candidate_identities = {("US", "AAA"), ("US", "BBB"), ("KR", "0086C0")}
            template = extract_raw_daily_rows(
                fake_history(),
                market="US",
                ticker="AAA",
                currency="USD",
                retrieved_at="2026-07-23T00:00:00+00:00",
            )[0]
            kr_row = {
                **template,
                "market": "KR",
                "ticker": "0086C0",
                "currency": "KRW",
            }
            kr_path = root / "kr.csv"
            write_raw_daily_rows(kr_path, [kr_row])

            duplicate_path = root / "us_duplicate.csv"
            duplicate_row = {**template, "ticker": "AAA"}
            with duplicate_path.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(duplicate_row))
                writer.writeheader()
                writer.writerows([duplicate_row, duplicate_row])
            with self.assertRaisesRegex(ValueError, "duplicate raw key"):
                combine_market_raw_files(
                    [(duplicate_path, "US"), (kr_path, "KR")],
                    root / "duplicate_out.csv",
                    candidate_identities,
                )

            out_of_order_path = root / "us_out_of_order.csv"
            with out_of_order_path.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(template))
                writer.writeheader()
                writer.writerows([{**template, "ticker": "BBB"}, {**template, "ticker": "AAA"}])
            with self.assertRaisesRegex(ValueError, "raw input out of order"):
                combine_market_raw_files(
                    [(out_of_order_path, "US"), (kr_path, "KR")],
                    root / "order_out.csv",
                    candidate_identities,
                )

    def test_kr_runtime_chunk_combine_preserves_alphanumeric_identity(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            chunk = root / "kr_part0000.csv"
            with chunk.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=kr_combiner.RUNTIME_COLUMNS)
                writer.writeheader()
                for ticker, benchmark in [("0086C0", "069500"), ("005930", "229200"), ("000660", "")]:
                    writer.writerow({
                        "market": "KR",
                        "ticker": ticker,
                        "expectedCagr": "",
                        "priceCagr10y": "",
                        "mdd": "",
                        "beta": "",
                        "dataYears": "",
                        "benchmarkTicker": benchmark,
                        "metricsStatus": "review_required",
                        "metricsSource": "mock",
                        "reviewReason": "mock",
                    })
            output = root / "combined.csv"
            summary = root / "summary.json"
            argv = [
                "combine_kr_price_metrics_chunks.py",
                "--pattern", str(root / "kr_part*.csv"),
                "--out-runtime", str(output),
                "--out-summary", str(summary),
                "--requested-as-of-included", "2026-07-22",
                "--provider-download-end-exclusive", "2026-07-23",
                "--metric-base-date", "2026-07-22",
            ]
            with mock.patch.object(sys, "argv", argv):
                kr_combiner.main()
            with output.open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual([row["ticker"] for row in rows], ["0086C0", "005930", "000660"])
            self.assertEqual({row["benchmarkTicker"] for row in rows}, {"", "069500", "229200"})
            combined_summary = json.loads(summary.read_text(encoding="utf-8"))
            self.assertEqual(combined_summary["requestedAsOfIncluded"], "2026-07-22")
            self.assertEqual(combined_summary["providerDownloadEndExclusive"], "2026-07-23")
            self.assertEqual(combined_summary["metricBaseDate"], "2026-07-22")
            self.assertTrue(combined_summary["partialFinalMonthDetected"])
            self.assertTrue(combined_summary["partialFinalMonthExcluded"])
            self.assertEqual(combined_summary["partialMonthPolicy"], "exclude_from_metrics")

    def test_kr_runtime_chunk_combine_rejects_numeric_coercion_artifacts(self):
        for invalid in ["69500", "69500.0", "229200.0"]:
            with self.subTest(invalid=invalid), tempfile.TemporaryDirectory() as temp_dir:
                root = Path(temp_dir)
                chunk = root / "kr_part0000.csv"
                with chunk.open("w", encoding="utf-8-sig", newline="") as handle:
                    writer = csv.DictWriter(handle, fieldnames=kr_combiner.RUNTIME_COLUMNS)
                    writer.writeheader()
                    writer.writerow({
                        "market": "KR", "ticker": "0086C0", "expectedCagr": "", "priceCagr10y": "",
                        "mdd": "", "beta": "", "dataYears": "", "benchmarkTicker": invalid,
                        "metricsStatus": "review_required", "metricsSource": "mock", "reviewReason": "mock",
                    })
                with mock.patch.object(sys, "argv", [
                    "combine_kr_price_metrics_chunks.py", "--pattern", str(chunk),
                    "--out-runtime", str(root / "combined.csv"), "--out-summary", str(root / "summary.json"),
                ]), self.assertRaises(SystemExit):
                    kr_combiner.main()

    def test_prepared_source_declares_split_adjusted_price_return(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            universe_path = root / "universe.csv"
            with universe_path.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["market", "ticker", "nameKr", "assetType"])
                writer.writeheader()
                writer.writerows(
                    [
                        {"market": "US", "ticker": "AAA", "nameKr": "", "assetType": "stock"},
                        {"market": "KR", "ticker": "005930", "nameKr": "", "assetType": "stock"},
                    ]
                )
            us_raw = root / "us_raw.csv"
            kr_raw = root / "kr_raw.csv"
            write_raw_daily_rows(
                us_raw,
                extract_raw_daily_rows(
                    fake_history(), market="US", ticker="AAA", currency="USD", retrieved_at="2026-07-23T00:00:00+00:00"
                ),
            )
            write_raw_daily_rows(
                kr_raw,
                extract_raw_daily_rows(
                    fake_history(), market="KR", ticker="005930", currency="KRW", retrieved_at="2026-07-23T00:00:00+00:00"
                ),
            )
            kr_metrics = root / "kr_metrics.csv"
            with kr_metrics.open("w", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["ticker", "benchmarkTicker"])
                writer.writeheader()
                writer.writerow({"ticker": "005930", "benchmarkTicker": "069500"})

            output_dir = root / "candidate_input"
            summary = prepare_inputs(
                SimpleNamespace(
                    universe=str(universe_path),
                    us_raw=str(us_raw),
                    kr_raw=str(kr_raw),
                    kr_metrics=str(kr_metrics),
                    output_dir=str(output_dir),
                    report=str(root / "report.json"),
                    metric_base_date="2026-07-23",
                    as_of_included="2026-07-23",
                    acquired_at="",
                    operator_id="colab-operator",
                    submission_id="test-price-return",
                )
            )
            source = json.loads((output_dir / "source_declaration.json").read_text(encoding="utf-8"))
            self.assertEqual(source["returnBasis"], "price_return")
            self.assertEqual(source["priceAdjustmentBasis"], "split_adjusted")
            self.assertEqual(source["requestedAsOfIncluded"], "2026-07-23")
            self.assertEqual(source["providerDownloadEndExclusive"], "2026-07-24")
            self.assertEqual(source["actualLastPriceDate"], "2025-01-06")
            self.assertEqual(source["metricBaseDate"], "2026-07-23")
            self.assertEqual(source["metricDataThroughMonth"], "2025-01")
            self.assertTrue(source["partialFinalMonthDetected"])
            self.assertTrue(source["partialFinalMonthExcluded"])
            self.assertEqual(source["partialMonthPolicy"], "exclude_from_metrics")
            self.assertEqual(source["assetCoverageCount"], 2)
            self.assertEqual(source["firstDateByMarket"], {"US": "2025-01-02", "KR": "2025-01-02"})
            self.assertEqual(source["lastDateByMarket"], {"US": "2025-01-06", "KR": "2025-01-06"})
            operator_manifest = json.loads((output_dir / "operator_submission_manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(operator_manifest["requestedAsOfIncluded"], "2026-07-23")
            self.assertEqual(operator_manifest["providerDownloadEndExclusive"], "2026-07-24")
            self.assertEqual(operator_manifest["actualLastPriceDate"], "2025-01-06")
            self.assertEqual(operator_manifest["metricBaseDate"], "2026-07-23")
            self.assertEqual(operator_manifest["metricDataThroughMonth"], "2025-01")
            self.assertTrue(operator_manifest["partialFinalMonthDetected"])
            self.assertTrue(operator_manifest["partialFinalMonthExcluded"])
            self.assertEqual(operator_manifest["partialMonthPolicy"], "exclude_from_metrics")
            self.assertFalse(summary["productionPublishReady"])
            self.assertFalse(summary["appExportApproved"])


if __name__ == "__main__":
    unittest.main()
