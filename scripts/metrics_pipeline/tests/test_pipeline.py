from __future__ import annotations

import csv
import hashlib
import json
import shutil
import tempfile
import unittest
from calendar import monthrange
from pathlib import Path, PurePosixPath, PureWindowsPath
from zipfile import ZipFile

from scripts.metrics_pipeline import PipelineCriticalError, run_finple_monthly_metrics_pipeline
from scripts.metrics_pipeline.adapters import run_source_adapter, validate_adapter_result
from scripts.metrics_pipeline.config import load_config
from scripts.metrics_pipeline.pipeline import (
    _dividend_yield,
    _monthly_return_rows,
    _normalized_metric_rows,
    _repo_relative_posix,
)
from scripts.metrics_pipeline.rolling import (
    ROLLING_METRIC_VERSION,
    compute_rolling_price_metrics,
    percentile,
    rolling_cagrs_for_test,
)
from scripts.metrics_pipeline.timeseries import NORMALIZATION_VERSION, normalize_daily_price_rows


REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_DIR = REPO_ROOT / "data" / "fixtures" / "monthly-metrics"
PUBLIC_SOURCE_ADAPTER_ID = "finple.synthetic_public_source_fixture.v1"
SOURCE_ADAPTER_VERSION = "source-adapter-contract-v1-step114-2c"


def build_config(output_dir: Path, **overrides):
    config = {
        "metric_base_date": "2026-06-30",
        "market_scope": ["US", "KR"],
        "selected_cagr_policy": "rolling_median_all_markets",
        "current_price_display": False,
        "total_return_cagr_mode": "reference_only",
        "output_version": "2026_06",
        "input_mode": "fixture",
        "input_dir": str(FIXTURE_DIR),
        "output_dir": str(output_dir),
        "deterministic_fixture": True,
        "random_seed": 1142,
    }
    config.update(overrides)
    return config


def fixture_sha256(file_name: str) -> str:
    return hashlib.sha256((FIXTURE_DIR / file_name).read_bytes()).hexdigest()


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def copy_fixture_dir(temp_dir: str) -> Path:
    fixture_copy = Path(temp_dir) / "fixtures"
    shutil.copytree(FIXTURE_DIR, fixture_copy)
    return fixture_copy


def mutate_csv_row(path: Path, predicate, updates: dict[str, str]) -> None:
    with path.open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
        fieldnames = list(rows[0].keys())
    for row in rows:
        if predicate(row):
            row.update(updates)
            break
    else:
        raise AssertionError(f"No matching row in {path}")
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def public_source_checkpoint_payload(**overrides):
    payload = {
        "checkpointId": "public_source_fixture:test-checkpoint",
        "adapterId": PUBLIC_SOURCE_ADAPTER_ID,
        "adapterVersion": SOURCE_ADAPTER_VERSION,
        "mode": "public_source_fixture",
        "sourceFileName": "public_source_fixture_prices.csv",
        "rawSourceSha256": fixture_sha256("public_source_fixture_prices.csv"),
        "acceptedRecordIds": [
            "public-fixture-kr-stock-001",
            "public-fixture-kr-stock-002",
        ],
        "completedPageNumbers": [1],
    }
    payload.update(overrides)
    return payload


class MetricsPipelineTests(unittest.TestCase):
    def test_month_end_normalization_aggregates_daily_dividends_and_preserves_status(self):
        with (FIXTURE_DIR / "raw_daily_prices.csv").open("r", encoding="utf-8", newline="") as handle:
            template = next(csv.DictReader(handle))

        def row(ticker: str, date_text: str, close: str, dividend: str) -> dict[str, str]:
            return {
                **template,
                "market": "US",
                "ticker": ticker,
                "date": date_text,
                "currency": "USD",
                "close": close,
                "splitAdjustedClose": close,
                "totalReturnAdjustedClose": "",
                "splitFactor": "1",
                "cashDividend": dividend,
                "priceAdjustmentBasis": "split_adjusted",
            }

        raw_rows = [
            row("SPY", "2026-01-10", "101", "0.25"),
            row("SPY", "2026-01-20", "103", "0.35"),
            row("SPY", "2026-01-30", "105", "0"),
            row("SPY", "2026-02-10", "106", "0"),
            row("SPY", "2026-02-27", "107", "0"),
            row("SPY", "2026-03-10", "108", ""),
            row("SPY", "2026-03-31", "109", "0"),
        ]
        normalized = normalize_daily_price_rows(
            raw_rows,
            source_file_name="raw.csv",
            source_sha256="test",
            allow_review_only_provenance=True,
            requested_as_of_included="2026-03-31",
        )["normalizedRows"]

        self.assertEqual(
            [(item["month"], item["sourceDate"], item["cashDividend"], item["dividendStatus"]) for item in normalized],
            [
                ("2026-01-31", "2026-01-30", "0.6", "confirmed_value"),
                ("2026-02-28", "2026-02-27", "0", "confirmed_zero"),
                ("2026-03-31", "2026-03-31", "", "missing"),
            ],
        )
        metric_rows = _normalized_metric_rows(normalized)
        self.assertEqual(
            [(item["cashDividend"], item["dividendStatus"]) for item in metric_rows],
            [("0.6", "confirmed_value"), ("0", "confirmed_zero"), ("", "missing")],
        )

    def test_monthly_total_return_adds_dividend_without_changing_price_return(self):
        candidate = {"market": "US", "ticker": "SPY", "benchmarkKey": "US_SPY", "proxyTicker": ""}
        prices = [
            {
                "month": "2025-12-31",
                "currency": "USD",
                "close": "100",
                "cashDividend": "0",
                "dividendStatus": "confirmed_zero",
            },
            {
                "month": "2026-01-31",
                "currency": "USD",
                "close": "105",
                "cashDividend": "0.6",
                "dividendStatus": "confirmed_value",
            },
        ]
        row = _monthly_return_rows(candidate, prices)[0]
        self.assertEqual(row["priceReturn"], "0.050000")
        self.assertEqual(row["totalReturn"], "0.056000")

    def test_trailing_twelve_month_dividend_yield_distinguishes_value_zero_and_missing(self):
        def trailing_rows(statuses: list[str], dividends: list[str]) -> list[dict[str, str]]:
            return [
                {
                    "month": f"2025-{index + 1:02d}-28",
                    "close": "100",
                    "cashDividend": dividend,
                    "dividendStatus": status,
                }
                for index, (status, dividend) in enumerate(zip(statuses, dividends))
            ]

        value_rows = trailing_rows(
            ["confirmed_zero"] * 11 + ["confirmed_value"],
            ["0"] * 11 + ["2"],
        )
        self.assertEqual(_dividend_yield(value_rows), (2.0, "confirmed_value", "confirmed_ttm_cash_dividend"))

        zero_rows = trailing_rows(["confirmed_zero"] * 12, ["0"] * 12)
        self.assertEqual(_dividend_yield(zero_rows), (0.0, "confirmed_zero", "confirmed_no_dividend"))

        missing_rows = trailing_rows(["confirmed_zero"] * 11 + ["missing"], ["0"] * 11 + [""])
        self.assertEqual(_dividend_yield(missing_rows), (None, "missing", "unconfirmed_blank"))

    def test_partial_final_month_policy_preserves_raw_and_excludes_metric_input(self):
        with (FIXTURE_DIR / "raw_daily_prices.csv").open("r", encoding="utf-8", newline="") as handle:
            template = next(csv.DictReader(handle))

        def row(date_text: str, close: str) -> dict[str, str]:
            return {
                **template,
                "market": "US",
                "ticker": "PARTIAL",
                "date": date_text,
                "currency": "USD",
                "close": close,
                "splitAdjustedClose": close,
                "totalReturnAdjustedClose": "",
                "splitFactor": "1",
                "cashDividend": "",
                "priceAdjustmentBasis": "split_adjusted",
            }

        raw_rows = [
            row("2026-05-29", "100"),
            row("2026-06-29", "101"),
            row("2026-06-30", "102"),
            row("2026-07-01", "103"),
            row("2026-07-22", "104"),
        ]
        original = [dict(item) for item in raw_rows]

        june_complete = normalize_daily_price_rows(
            raw_rows[:3],
            source_file_name="raw.csv",
            source_sha256="test",
            requested_as_of_included="2026-06-30",
        )
        self.assertEqual([item["month"] for item in june_complete["normalizedRows"]], ["2026-05-31", "2026-06-30"])
        self.assertFalse(june_complete["partialMonthMetadata"]["partialFinalMonthDetected"])
        self.assertEqual(june_complete["partialMonthMetadata"]["metricDataThroughMonth"], "2026-06")

        for as_of in ["2026-07-01", "2026-07-22"]:
            with self.subTest(as_of=as_of):
                as_of_rows = [item for item in raw_rows if item["date"] <= as_of]
                partial = normalize_daily_price_rows(
                    as_of_rows,
                    source_file_name="raw.csv",
                    source_sha256="test",
                    requested_as_of_included=as_of,
                )
                self.assertEqual([item["month"] for item in partial["normalizedRows"]], ["2026-05-31", "2026-06-30"])
                self.assertEqual(partial["partialMonthMetadata"]["metricDataThroughMonth"], "2026-06")
                self.assertTrue(partial["partialMonthMetadata"]["partialFinalMonthDetected"])
                self.assertTrue(partial["partialMonthMetadata"]["partialFinalMonthExcluded"])
                self.assertEqual(partial["partialMonthMetadata"]["partialMonthPolicy"], "exclude_from_metrics")

        non_trading_month_end = normalize_daily_price_rows(
            [row("2026-01-29", "99"), row("2026-01-30", "100")],
            source_file_name="raw.csv",
            source_sha256="test",
            requested_as_of_included="2026-01-31",
        )
        self.assertEqual(non_trading_month_end["normalizedRows"][0]["month"], "2026-01-31")
        self.assertEqual(non_trading_month_end["normalizedRows"][0]["sourceDate"], "2026-01-30")
        self.assertEqual(raw_rows, original)

    def test_fixture_pipeline_creates_required_outputs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))

            self.assertTrue(result["ok"])
            self.assertTrue(result["fixturePackageReady"])
            self.assertFalse(result["productionPublishReady"])
            self.assertFalse(result["appExportApproved"])
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            for path in outputs.values():
                self.assertTrue(path.exists(), path)

            with outputs["manifestJson"].open("r", encoding="utf-8") as handle:
                manifest = json.load(handle)
            self.assertEqual(manifest["pipelineVersion"], "metrics-v3.0-step114-2d")
            self.assertEqual(manifest["schemaVersion"], "metrics-csv-schema-v3")
            self.assertFalse(manifest["externalProviderCalls"])
            self.assertTrue(manifest["fixturePackageReady"])
            self.assertFalse(manifest["productionPublishReady"])
            self.assertFalse(manifest["appExportApproved"])
            self.assertEqual(manifest["rollingMetricVersion"], ROLLING_METRIC_VERSION)
            self.assertEqual(manifest["rollingWindowMonths"], {"10y": 120, "5y": 60})
            self.assertEqual(manifest["selectedCagrPolicy"], "rolling_median_all_markets")
            self.assertEqual(manifest["historicalOverlayProtectionStatus"], "verified_unchanged")
            self.assertEqual(
                set(manifest["reviewOverlayFiles"]),
                {"finple_review_overlay_us_2026_07_14.csv", "finple_review_overlay_kr_2026_07_14.csv"},
            )
            self.assertEqual(set(manifest["reviewOverlayHashes"]), set(manifest["reviewOverlayFiles"]))
            self.assertIn("sourceAdapter", manifest)
            self.assertEqual(manifest["sourceAdapter"]["adapterId"], "finple.raw_daily_fixture.v1")
            self.assertEqual(manifest["sourceAdapter"]["adapterVersion"], "source-adapter-contract-v1-step114-2c")
            self.assertEqual(manifest["sourceAdapter"]["mode"], "fixture")
            self.assertEqual(manifest["sourceAdapter"]["sourceFileName"], "raw_daily_prices.csv")
            self.assertTrue(manifest["sourceAdapter"]["internalUseAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["publicationAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["redistributionAllowed"])
            self.assertEqual(
                {item["name"] for item in manifest["sourceFiles"]},
                {"benchmark_map.csv", "candidates.csv", "raw_daily_prices.csv"},
            )
            self.assertEqual(manifest["rollingSourceLineage"]["rawSourceFileName"], "raw_daily_prices.csv")
            self.assertEqual(manifest["rollingSourceLineage"]["normalizationVersion"], NORMALIZATION_VERSION)
            self.assertEqual(manifest["rollingSourceLineage"]["rollingMetricVersion"], ROLLING_METRIC_VERSION)
            self.assertIn("SPY", manifest["rollingSourceLineage"]["normalizedSeriesHashes"])
            self.assertIn("sourceMetadata", manifest)
            self.assertEqual(manifest["sourceMetadata"][0]["sourceFileName"], "raw_daily_prices.csv")
            self.assertEqual(manifest["sourceMetadata"][0]["sourceId"], "mixed_or_review_required")
            self.assertEqual(manifest["sourceMetadata"][0]["providerOrInstitution"], "FINPLE synthetic fixture")
            self.assertGreater(len(manifest["sourceMetadata"][0]["sources"]), 1)
            self.assertFalse(manifest["sourceMetadata"][0]["publicationAllowed"])
            self.assertFalse(manifest["sourceMetadata"][0]["redistributionAllowed"])

            with ZipFile(outputs["zipPackage"]) as package:
                names = set(package.namelist())
            self.assertIn("finple_metrics_output_2026_06.csv", names)
            self.assertIn("finple_metrics_selected_2026_06.csv", names)
            self.assertIn("finple_metrics_review_required_2026_06.csv", names)
            self.assertIn("finple_metrics_audit_report_2026_06.html", names)
            self.assertIn("finple_metrics_manifest_2026_06.json", names)
            self.assertIn("finple_monthly_returns_2026_06.csv", names)
            self.assertIn("finple_normalized_month_end_2026_06.csv", names)
            self.assertIn("finple_timeseries_audit_2026_06.csv", names)
            self.assertIn("finple_source_adapter_summary_2026_06.json", names)
            self.assertIn("finple_source_adapter_checkpoint_2026_06.json", names)
            self.assertIn("finple_review_overlay_us_2026_07_14.csv", names)
            self.assertIn("finple_review_overlay_kr_2026_07_14.csv", names)

    def test_output_schema_review_split_and_kr_ticker_preservation(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_rows = list(csv.DictReader(handle))
            with outputs["selectedCsv"].open("r", encoding="utf-8", newline="") as handle:
                selected_rows = list(csv.DictReader(handle))
            with outputs["reviewRequiredCsv"].open("r", encoding="utf-8", newline="") as handle:
                review_rows = list(csv.DictReader(handle))

            full_by_ticker = {row["ticker"]: row for row in full_rows}
            self.assertIn("069500", full_by_ticker)
            self.assertIn("005930", full_by_ticker)
            self.assertEqual(full_by_ticker["069500"]["ticker"], "069500")
            self.assertEqual(full_by_ticker["005930"]["ticker"], "005930")

            selected_tickers = {row["ticker"] for row in selected_rows}
            self.assertIn("SPY", selected_tickers)
            self.assertIn("069500", selected_tickers)
            self.assertNotIn("123456", selected_tickers)
            self.assertNotIn("BADBLK", selected_tickers)
            self.assertTrue(any(row["ticker"] == "123456" and row["issueType"] == "review_required" for row in review_rows))
            self.assertEqual(full_by_ticker["BADBLK"]["dataStatus"], "review_required")
            self.assertEqual(full_by_ticker["BADBLK"]["reviewFlag"], "review_required")
            self.assertEqual(full_by_ticker["SPY"]["mddPolicy"], "full_period_actual")
            self.assertEqual(full_by_ticker["SPY"]["rollingMdd10yMedian"], "")
            self.assertEqual(full_by_ticker["SPY"]["betaPolicy"], "aligned_monthly_return_beta")
            self.assertEqual(full_by_ticker["SPY"]["rollingBeta10yMedian"], "")
            self.assertEqual(full_by_ticker["SPY"]["rollingBeta5yMedian"], "")
            self.assertEqual(full_by_ticker["SPY"]["selectedMdd"], full_by_ticker["SPY"]["mddFullPeriod"])

            required_columns = {
                "ticker",
                "metricBaseDate",
                "benchmarkTicker",
                "rawPriceCagr10y",
                "selectedCagr",
                "selectedMdd",
                "selectedBeta",
                "rollingCagr10yWindowCount",
                "validRollingWindowCount10y",
                "rollingCagr5yP25",
                "rollingCagr5yP75",
                "rollingCagr5yWindowCount",
                "validRollingWindowCount5y",
                "dividendStatus",
                "dataStatus",
                "reviewFlag",
                "normalizationPolicy",
                "mddFullPeriod",
                "sourceHash",
                "rawSourceSha256",
                "normalizationVersion",
                "normalizedSeriesHash",
                "rollingMetricVersion",
            }
            self.assertTrue(required_columns.issubset(full_rows[0].keys()))

    def test_continuous_monthly_fixture_and_exact_rolling_window_counts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_by_ticker = {row["ticker"]: row for row in csv.DictReader(handle)}
            self.assertEqual(full_by_ticker["SPY"]["rollingCagr10yWindowCount"], "1")
            self.assertEqual(full_by_ticker["SPY"]["rollingCagr5yWindowCount"], "61")
            self.assertEqual(full_by_ticker["069500"]["rollingCagr10yWindowCount"], "1")
            self.assertEqual(full_by_ticker["123456"]["rollingCagr10yWindowCount"], "0")
            self.assertEqual(full_by_ticker["123456"]["rollingCagr5yWindowCount"], "0")

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                normalized_rows = list(csv.DictReader(handle))
            spy_months = [row["month"] for row in normalized_rows if row["ticker"] == "SPY"]
            short_months = [row["month"] for row in normalized_rows if row["ticker"] == "123456"]
            self.assertEqual(len(spy_months), 121)
            self.assertEqual(spy_months[0], "2016-06-30")
            self.assertEqual(spy_months[-1], "2026-06-30")
            self.assertEqual(len(short_months), 36)

            spy_prices = [float(row["splitAdjustedClose"]) for row in normalized_rows if row["ticker"] == "SPY"]
            pre_drop_peak = max(spy_prices[:42])
            trough = min(spy_prices[42:45])
            post_recovery = max(spy_prices[45:80])
            self.assertLess(trough, pre_drop_peak * 0.8)
            self.assertGreater(post_recovery, trough * 1.2)

    def test_exact_rolling_cagr_interval_and_gap_rules(self):
        rows = []
        for index in range(0, 122):
            year = 2016 + (5 + index) // 12
            month = (5 + index) % 12 + 1
            day = [31, 29 if year % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
            rows.append(
                {
                    "month": f"{year:04d}-{month:02d}-{day:02d}",
                    "close": f"{100 * (1.01 ** index):.6f}",
                    "currency": "USD",
                    "priceAdjustmentBasis": "split_adjusted_close",
                }
            )

        ten_year = rolling_cagrs_for_test(rows, 120)
        five_year = rolling_cagrs_for_test(rows, 60)
        self.assertEqual(len(ten_year), 2)
        self.assertEqual(len(five_year), 62)
        self.assertAlmostEqual(ten_year[0], ((1.01 ** 120) ** (12 / 120) - 1) * 100, places=7)
        self.assertEqual(rolling_cagrs_for_test(rows[:120], 120), [])

        gap_rows = [row for row in rows if row["month"] != rows[24]["month"]]
        self.assertLess(len(rolling_cagrs_for_test(gap_rows, 60)), len(five_year))

    def test_rolling_metric_policy_price_basis_and_mdd_are_separate(self):
        with (FIXTURE_DIR / "monthly_prices.csv").open("r", encoding="utf-8", newline="") as handle:
            price_rows = list(csv.DictReader(handle))
        spy_rows = [row for row in price_rows if row["ticker"] == "SPY"]
        spy_metrics = compute_rolling_price_metrics(spy_rows)
        self.assertEqual(spy_metrics.validRollingWindowCount10y, 1)
        self.assertEqual(spy_metrics.validRollingWindowCount5y, 61)
        self.assertEqual(spy_metrics.cagrPolicy, "rolling_10y_median")
        self.assertIsNotNone(spy_metrics.mddFullPeriod)
        self.assertLess(spy_metrics.mddFullPeriod, 0)
        self.assertEqual(percentile([3.0, 1.0, 5.0, 7.0], 25), 2.5)

        total_return_rows = [dict(row, priceAdjustmentBasis="total_return_adjusted") for row in spy_rows]
        blocked = compute_rolling_price_metrics(total_return_rows)
        self.assertEqual(blocked.validRollingWindowCount10y, 0)
        self.assertEqual(blocked.cagrPolicy, "blank_review_required")
        self.assertIn("Price CAGR blocked", blocked.reviewReason)

    def test_twenty_year_history_selects_multi_window_ten_year_cagr_median(self):
        rows = []
        for index in range(242):
            zero_based = 2006 * 12 + 5 + index
            year, month_index = divmod(zero_based, 12)
            rows.append(
                {
                    "month": f"{year:04d}-{month_index + 1:02d}-{monthrange(year, month_index + 1)[1]:02d}",
                    "close": f"{100 * (1.006 ** index):.8f}",
                    "currency": "USD",
                    "priceAdjustmentBasis": "split_adjusted",
                }
            )

        metrics = compute_rolling_price_metrics(rows)
        self.assertGreater(metrics.validRollingWindowCount10y, 1)
        self.assertEqual(metrics.selectedCagr, metrics.rollingCagr10yMedian)
        self.assertEqual(metrics.cagrPolicy, "rolling_10y_median")
        self.assertIsNotNone(metrics.rollingCagr10yP25)
        self.assertIsNotNone(metrics.rollingCagr10yP75)

    def test_review_overlay_is_review_only_and_preserves_historical_loader_contract(self):
        protected_paths = [
            REPO_ROOT / "src" / "data" / "tickers" / "us_price_metrics_overlay_20260528_app_ready.csv",
            REPO_ROOT / "src" / "data" / "tickers" / "kr_price_metrics_overlay_20260528_app_ready.csv",
            REPO_ROOT / "src" / "data" / "tickers" / "screenerCandidateOverlay.js",
        ]
        before = {path: hashlib.sha256(path.read_bytes()).hexdigest() for path in protected_paths}

        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            with outputs["usReviewOverlayCsv"].open("r", encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                self.assertEqual(
                    reader.fieldnames[:11],
                    [
                        "market",
                        "ticker",
                        "expectedCagr",
                        "priceCagr10y",
                        "mdd",
                        "beta",
                        "dataYears",
                        "benchmarkTicker",
                        "metricsStatus",
                        "metricsSource",
                        "reviewReason",
                    ],
                )
                us_rows = list(reader)
            with outputs["krReviewOverlayCsv"].open("r", encoding="utf-8", newline="") as handle:
                kr_rows = list(csv.DictReader(handle))
            overlay_rows = us_rows + kr_rows

            self.assertTrue(overlay_rows)
            self.assertEqual({row["overlayStatus"] for row in overlay_rows}, {"review_only"})
            self.assertEqual({row["fixturePackageReady"] for row in overlay_rows}, {"true"})
            self.assertEqual({row["productionPublishReady"] for row in overlay_rows}, {"false"})
            self.assertEqual({row["appExportApproved"] for row in overlay_rows}, {"false"})
            self.assertEqual({row["metricsStatus"] for row in overlay_rows}, {"review_only"})
            self.assertIn("005930", {row["ticker"] for row in kr_rows})
            self.assertIn("069500", {row["ticker"] for row in kr_rows})
            self.assertTrue(all(row["reviewFlag"] == "review_required" for row in overlay_rows))

            manifest = json.loads(outputs["manifestJson"].read_text(encoding="utf-8"))
            self.assertEqual(manifest["historicalOverlayProtectionStatus"], "verified_unchanged")
            for item in manifest["historicalOverlayProtection"]["protectedFiles"]:
                self.assertTrue(item["unchanged"], item)
                self.assertNotIn("\\", item["path"])

            self.assertEqual(
                _repo_relative_posix(PureWindowsPath("src\\data\\tickers\\kr_price_metrics_overlay_20260528_app_ready.csv")),
                "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv",
            )
            self.assertEqual(
                _repo_relative_posix(PurePosixPath("src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv")),
                "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv",
            )

        after = {path: hashlib.sha256(path.read_bytes()).hexdigest() for path in protected_paths}
        self.assertEqual(before, after)

    def test_raw_daily_change_updates_normalized_rolling_and_overlay_hashes(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            fixture_copy = copy_fixture_dir(temp_dir)
            first = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir) / "first", input_dir=str(fixture_copy))
            )
            first_outputs = {name: Path(path) for name, path in first["outputs"].items()}
            first_manifest = json.loads(first_outputs["manifestJson"].read_text(encoding="utf-8"))
            with first_outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                first_spy = {row["ticker"]: row for row in csv.DictReader(handle)}["SPY"]

            mutate_csv_row(
                fixture_copy / "raw_daily_prices.csv",
                lambda row: row["ticker"] == "SPY" and row["date"] == "2026-06-30",
                {"close": "250.00", "splitAdjustedClose": "250.00", "totalReturnAdjustedClose": "250.00"},
            )

            second = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir) / "second", input_dir=str(fixture_copy))
            )
            second_outputs = {name: Path(path) for name, path in second["outputs"].items()}
            second_manifest = json.loads(second_outputs["manifestJson"].read_text(encoding="utf-8"))
            with second_outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                second_spy = {row["ticker"]: row for row in csv.DictReader(handle)}["SPY"]

            self.assertNotEqual(
                first_manifest["rollingSourceLineage"]["normalizedMonthEndSha256"],
                second_manifest["rollingSourceLineage"]["normalizedMonthEndSha256"],
            )
            self.assertNotEqual(
                first_manifest["rollingSourceLineage"]["normalizedSeriesHashes"]["SPY"],
                second_manifest["rollingSourceLineage"]["normalizedSeriesHashes"]["SPY"],
            )
            self.assertNotEqual(first_spy["selectedCagr"], second_spy["selectedCagr"])
            self.assertNotEqual(file_sha256(first_outputs["usReviewOverlayCsv"]), file_sha256(second_outputs["usReviewOverlayCsv"]))

    def test_monthly_prices_change_does_not_affect_normalized_rolling_outputs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            fixture_copy = copy_fixture_dir(temp_dir)
            first = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir) / "first", input_dir=str(fixture_copy))
            )
            mutate_csv_row(
                fixture_copy / "monthly_prices.csv",
                lambda row: row["ticker"] == "SPY" and row["month"] == "2026-06-30",
                {"close": "999999.99", "cashDividend": "999.99"},
            )
            second = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir) / "second", input_dir=str(fixture_copy))
            )

            for output_key in ["metricsOutputCsv", "selectedCsv", "monthlyReturnsCsv", "usReviewOverlayCsv", "krReviewOverlayCsv"]:
                self.assertEqual(
                    Path(first["outputs"][output_key]).read_bytes(),
                    Path(second["outputs"][output_key]).read_bytes(),
                    output_key,
                )
            first_manifest = json.loads(Path(first["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
            second_manifest = json.loads(Path(second["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
            self.assertEqual(first_manifest["rollingSourceLineage"], second_manifest["rollingSourceLineage"])
            self.assertNotIn("monthly_prices.csv", {item["name"] for item in first_manifest["sourceFiles"]})

    def test_normalization_blocked_candidate_cannot_be_selected_or_ready_overlay(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            with outputs["selectedCsv"].open("r", encoding="utf-8", newline="") as handle:
                selected_tickers = {row["ticker"] for row in csv.DictReader(handle)}
            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_by_ticker = {row["ticker"]: row for row in csv.DictReader(handle)}
            with outputs["usReviewOverlayCsv"].open("r", encoding="utf-8", newline="") as handle:
                overlay_by_ticker = {row["ticker"]: row for row in csv.DictReader(handle)}

            self.assertNotIn("BADBLK", selected_tickers)
            self.assertEqual(full_by_ticker["BADBLK"]["dataStatus"], "review_required")
            self.assertEqual(full_by_ticker["BADBLK"]["reviewReason"], "normalized_source_missing")
            self.assertEqual(overlay_by_ticker["BADBLK"]["metricsStatus"], "review_only")
            self.assertEqual(overlay_by_ticker["BADBLK"]["expectedCagr"], "")

    def test_same_fixture_and_config_are_reproducible(self):
        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_finple_monthly_metrics_pipeline(build_config(Path(first_dir)))
            second = run_finple_monthly_metrics_pipeline(build_config(Path(second_dir)))

            first_outputs = {name: Path(path) for name, path in first["outputs"].items()}
            second_outputs = {name: Path(path) for name, path in second["outputs"].items()}
            for key in [
                "metricsOutputCsv",
                "selectedCsv",
                "reviewRequiredCsv",
                "monthlyReturnsCsv",
                "manifestJson",
                "zipPackage",
                "usReviewOverlayCsv",
                "krReviewOverlayCsv",
            ]:
                self.assertEqual(first_outputs[key].read_bytes(), second_outputs[key].read_bytes(), key)

    def test_critical_validation_blocks_publish_ready_outputs(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(PipelineCriticalError):
                run_finple_monthly_metrics_pipeline(
                    build_config(Path(temp_dir), raw_daily_prices_file="missing_raw_daily_prices.csv")
                )

            self.assertFalse((Path(temp_dir) / "finple_monthly_metrics_2026_06_package.zip").exists())
            self.assertFalse((Path(temp_dir) / "finple_metrics_selected_2026_06.csv").exists())

    def test_ttm_dividend_status_keeps_missing_zero_and_value_distinct(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["metricsOutputCsv"].open("r", encoding="utf-8", newline="") as handle:
                full_by_ticker = {row["ticker"]: row for row in csv.DictReader(handle)}
            self.assertEqual(full_by_ticker["SPY"]["dividendStatus"], "confirmed_value")
            self.assertNotEqual(full_by_ticker["SPY"]["dividendYield"], "")
            self.assertEqual(full_by_ticker["QQQ"]["dividendStatus"], "confirmed_zero")
            self.assertEqual(full_by_ticker["QQQ"]["dividendYield"], "0.00")
            self.assertEqual(full_by_ticker["MSFT"]["dividendStatus"], "missing")
            self.assertEqual(full_by_ticker["MSFT"]["dividendYield"], "")

    def test_policy_config_is_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaises(PipelineCriticalError):
                run_finple_monthly_metrics_pipeline(
                    build_config(Path(temp_dir), selected_cagr_policy="raw_10y", current_price_display=True)
                )

    def test_daily_to_month_end_selects_last_valid_observation_and_preserves_kr_tickers(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))

            by_ticker_month = {(row["ticker"], row["month"]): row for row in rows}
            self.assertEqual(by_ticker_month[("SPY", "2026-01-31")]["sourceDate"], "2026-01-31")
            self.assertEqual(by_ticker_month[("SPY", "2026-02-28")]["sourceDate"], "2026-02-28")
            self.assertEqual(by_ticker_month[("005930", "2026-01-31")]["ticker"], "005930")
            self.assertEqual(by_ticker_month[("069500", "2026-01-31")]["priceSeriesClassification"], "split_adjusted")

    def test_timeseries_audit_blocks_bad_rows_without_forward_fill_or_app_approval(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["timeseriesAuditCsv"].open("r", encoding="utf-8", newline="") as handle:
                audit_rows = list(csv.DictReader(handle))
            issue_types = {row["issueType"] for row in audit_rows}

            for expected in [
                "missing_calendar_month",
                "duplicate_date",
                "non_positive_price",
                "non_monotonic_date_order",
                "malformed_or_missing_date",
                "missing_required_price_basis",
                "inconsistent_currency",
                "inconsistent_market_ticker_identifier",
                "implausible_split_factor",
                "corporate_action_inconsistency",
                "ambiguous_adjustment_basis",
                "invalid_provenance_publication_policy",
                "duplicate_corporate_action_entry",
            ]:
                self.assertIn(expected, issue_types)

            blocking_rows = [row for row in audit_rows if row["blocksPublication"] == "true"]
            self.assertGreaterEqual(len(blocking_rows), 10)
            self.assertTrue(result["fixturePackageReady"])
            self.assertFalse(result["productionPublishReady"])
            self.assertFalse(result["appExportApproved"])

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                normalized_rows = list(csv.DictReader(handle))
            missing_month_rows = [row for row in normalized_rows if row["ticker"] == "MISSING"]
            self.assertEqual([row["month"] for row in missing_month_rows], ["2026-01-31", "2026-03-31"])
            normalized_tickers = {row["ticker"] for row in normalized_rows}
            self.assertNotIn("DUPONLY", normalized_tickers)
            self.assertNotIn("REVONLY", normalized_tickers)
            self.assertNotIn("CORPONLY", normalized_tickers)

    def test_adjustment_basis_and_corporate_action_audit_are_explicit(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(build_config(Path(temp_dir)))
            outputs = {name: Path(path) for name, path in result["outputs"].items()}

            with outputs["normalizedMonthEndCsv"].open("r", encoding="utf-8", newline="") as handle:
                normalized = list(csv.DictReader(handle))
            classifications = {row["ticker"]: row["priceSeriesClassification"] for row in normalized}
            self.assertEqual(classifications["NOACT"], "raw_close")
            self.assertEqual(classifications["SPLT"], "split_adjusted")
            self.assertEqual(classifications["DIVD"], "split_adjusted")
            self.assertEqual(classifications["069500"], "split_adjusted")
            self.assertNotIn("AMBIG", classifications)

            with outputs["timeseriesAuditCsv"].open("r", encoding="utf-8", newline="") as handle:
                audit_rows = list(csv.DictReader(handle))
            self.assertTrue(any(row["ticker"] == "SPLT" and row["issueType"] == "valid_stock_split" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "DIVD" and row["issueType"] == "cash_dividend" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "AMBIG" and row["priceSeriesClassification"] == "ambiguous" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "DUPONLY" and row["issueType"] == "duplicate_date" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "REVONLY" and row["issueType"] == "non_monotonic_date_order" for row in audit_rows))
            self.assertTrue(any(row["ticker"] == "CORPONLY" and row["issueType"] == "corporate_action_inconsistency" for row in audit_rows))

    def test_provenance_hashes_are_deterministic_and_raw_fixture_is_immutable(self):
        raw_fixture = FIXTURE_DIR / "raw_daily_prices.csv"
        before = raw_fixture.read_bytes()

        with tempfile.TemporaryDirectory() as first_dir, tempfile.TemporaryDirectory() as second_dir:
            first = run_finple_monthly_metrics_pipeline(build_config(Path(first_dir)))
            second = run_finple_monthly_metrics_pipeline(build_config(Path(second_dir)))

            first_manifest = json.loads(Path(first["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
            second_manifest = json.loads(Path(second["outputs"]["manifestJson"]).read_text(encoding="utf-8"))
            first_raw = next(item for item in first_manifest["sourceFiles"] if item["name"] == "raw_daily_prices.csv")
            second_raw = next(item for item in second_manifest["sourceFiles"] if item["name"] == "raw_daily_prices.csv")
            self.assertEqual(first_raw["sourceSha256"], second_raw["sourceSha256"])
            self.assertEqual(first_manifest["sourceMetadata"][0]["sourceSha256"], second_manifest["sourceMetadata"][0]["sourceSha256"])
            self.assertEqual(first_manifest["sourceMetadata"][0]["sourceId"], "mixed_or_review_required")
            self.assertEqual(first_manifest["sourceMetadata"][0]["retrievedAt"], "2026-07-14T00:00:00+09:00")
            self.assertEqual(first_manifest["sourceMetadata"][0]["sources"], second_manifest["sourceMetadata"][0]["sources"])
            source_ids = [entry["sourceId"] for entry in first_manifest["sourceMetadata"][0]["sources"]]
            self.assertEqual(source_ids, sorted(source_ids))
            self.assertIn("fixture_daily_duplicate_only", source_ids)
            self.assertIn("fixture_daily_reverse_only", source_ids)
            self.assertIn("fixture_daily_corporate_action_only", source_ids)

        self.assertEqual(raw_fixture.read_bytes(), before)

    def test_manual_upload_adapter_contract_and_sanitized_artifacts(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            result = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir), input_mode="manual_upload")
            )
            outputs = {name: Path(path) for name, path in result["outputs"].items()}
            manifest = json.loads(outputs["manifestJson"].read_text(encoding="utf-8"))
            self.assertEqual(manifest["sourceAdapter"]["adapterId"], "finple.manual_upload_csv.v1")
            self.assertEqual(manifest["sourceAdapter"]["mode"], "manual_upload")
            self.assertEqual(manifest["sourceAdapter"]["sourceFileName"], "manual_upload_raw_daily_prices.csv")
            self.assertTrue(manifest["sourceAdapter"]["internalUseAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["publicationAllowed"])
            self.assertFalse(manifest["sourceAdapter"]["redistributionAllowed"])
            self.assertTrue(manifest["fixturePackageReady"])
            self.assertFalse(manifest["productionPublishReady"])
            self.assertFalse(manifest["appExportApproved"])

            artifact_text = "\n".join(
                path.read_text(encoding="utf-8")
                for path in [
                    outputs["manifestJson"],
                    outputs["sourceAdapterSummaryJson"],
                    outputs["sourceAdapterCheckpointJson"],
                    outputs["normalizedMonthEndCsv"],
                    outputs["timeseriesAuditCsv"],
                ]
            )
            self.assertNotIn("C:\\Users\\owner", artifact_text)
            self.assertNotIn("serviceKey=SHOULD_NOT_LEAK", artifact_text)
            self.assertIn("[REDACTED_LOCAL_PATH]", artifact_text)
            self.assertIn("[REDACTED_SECRET]", artifact_text)

            with ZipFile(outputs["zipPackage"]) as package:
                zip_payload = "\n".join(package.read(name).decode("utf-8") for name in package.namelist())
            self.assertNotIn("C:\\Users\\owner", zip_payload)
            self.assertNotIn("serviceKey=SHOULD_NOT_LEAK", zip_payload)

    def test_manual_upload_fail_closed_gates_block_normalization(self):
        blocked_files = [
            "manual_upload_bad_header.csv",
            "manual_upload_empty.csv",
            "manual_upload_unknown_license.csv",
            "manual_upload_internal_use_blocked.csv",
            "manual_upload_row_mismatch.csv",
            "manual_upload_malformed_csv.csv",
        ]
        for file_name in blocked_files:
            with self.subTest(file_name=file_name), tempfile.TemporaryDirectory() as temp_dir:
                with self.assertRaises(PipelineCriticalError):
                    run_finple_monthly_metrics_pipeline(
                        build_config(Path(temp_dir), input_mode="manual_upload", manual_upload_file=file_name)
                    )
                self.assertFalse((Path(temp_dir) / "finple_monthly_metrics_2026_06_package.zip").exists())

    def test_manual_upload_invalid_encoding_is_adapter_level_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            input_dir = Path(temp_dir) / "inputs"
            input_dir.mkdir()
            for file_name in ["candidates.csv", "benchmark_map.csv", "monthly_prices.csv"]:
                shutil.copy2(FIXTURE_DIR / file_name, input_dir / file_name)
            (input_dir / "manual_upload_invalid_encoding.csv").write_bytes(b"\xff\xfe\x00\x00not-utf8")

            config = build_config(
                Path(temp_dir) / "outputs",
                input_mode="manual_upload",
                input_dir=str(input_dir),
                manual_upload_file="manual_upload_invalid_encoding.csv",
            )
            adapter_result = run_source_adapter(load_config(config))
            self.assertIn("source adapter invalid encoding blocked", "; ".join(adapter_result.warnings))
            with self.assertRaisesRegex(PipelineCriticalError, "source adapter produced no accepted rows"):
                run_finple_monthly_metrics_pipeline(config)

    def test_public_source_provider_shaped_mapping_preserves_kr_etf_leading_zero(self):
        config = load_config(build_config(Path("unused"), input_mode="public_source_fixture"))
        adapter_result = run_source_adapter(config)
        self.assertFalse(validate_adapter_result(adapter_result))
        self.assertEqual(adapter_result.adapterId, "finple.synthetic_public_source_fixture.v1")
        rows_by_ticker = {row["ticker"]: row for row in adapter_result.rows}

        self.assertIn("005930", rows_by_ticker)
        self.assertIn("000660", rows_by_ticker)
        self.assertIn("069500", rows_by_ticker)
        self.assertEqual(rows_by_ticker["069500"]["ticker"], "069500")
        self.assertEqual(rows_by_ticker["069500"]["totalReturnAdjustedClose"], "33100")
        self.assertEqual(rows_by_ticker["069500"]["priceAdjustmentBasis"], "total_return_adjusted")
        self.assertTrue(rows_by_ticker["069500"]["sourceId"].startswith("public_fixture:kr_securities_product:"))
        self.assertEqual(rows_by_ticker["005930"]["splitAdjustedClose"], rows_by_ticker["005930"]["close"])

    def test_public_source_mixed_license_checkpoint_counts_only_accepted_rows(self):
        config = load_config(
            build_config(
                Path("unused"),
                input_mode="public_source_fixture",
                public_source_fixture_file="public_source_fixture_mixed_license.csv",
            )
        )
        adapter_result = run_source_adapter(config)

        self.assertFalse(validate_adapter_result(adapter_result))
        self.assertEqual([row["ticker"] for row in adapter_result.rows], ["005930"])
        self.assertEqual(adapter_result.rejectedRowCount, 1)
        self.assertEqual(adapter_result.checkpoint["acceptedRecordIds"], ["public-fixture-mixed-accepted"])
        self.assertNotIn("public-fixture-mixed-license-blocked", adapter_result.checkpoint["acceptedRecordIds"])
        self.assertEqual(adapter_result.checkpoint["newlyAcceptedRecordCount"], len(adapter_result.rows))
        self.assertEqual(adapter_result.checkpoint["newlyAcceptedRecordCount"], 1)
        self.assertEqual(adapter_result.checkpoint["cumulativeAcceptedRecordCount"], 1)
        self.assertEqual(adapter_result.checkpoint["rejectedRecordCount"], 1)
        self.assertIn("public-fixture-mixed-license-blocked", "; ".join(adapter_result.warnings))

        with tempfile.TemporaryDirectory() as temp_dir:
            outputs = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir),
                    input_mode="public_source_fixture",
                    public_source_fixture_file="public_source_fixture_mixed_license.csv",
                )
            )["outputs"]
            with Path(outputs["normalizedMonthEndCsv"]).open("r", encoding="utf-8", newline="") as handle:
                normalized_rows = list(csv.DictReader(handle))
            self.assertEqual([row["ticker"] for row in normalized_rows], ["005930"])
            self.assertNotIn("000660", {row["ticker"] for row in normalized_rows})

    def test_public_source_unsupported_provider_shape_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with self.assertRaisesRegex(PipelineCriticalError, "source adapter produced no accepted rows"):
                run_finple_monthly_metrics_pipeline(
                    build_config(
                        Path(temp_dir),
                        input_mode="public_source_fixture",
                        public_source_fixture_file="public_source_fixture_unsupported_shape.csv",
                    )
                )

    def test_public_source_fixture_checkpoint_retry_resume_and_determinism(self):
        config = load_config(
            build_config(
                Path("unused"),
                input_mode="public_source_fixture",
                public_source_fixture_failure_mode="transient_then_success",
            )
        )
        adapter_result = run_source_adapter(config)
        self.assertFalse(validate_adapter_result(adapter_result))
        self.assertEqual(adapter_result.adapterId, "finple.synthetic_public_source_fixture.v1")
        self.assertEqual(adapter_result.retryCount, 1)
        self.assertTrue(adapter_result.resumeSupported)
        self.assertEqual(adapter_result.checkpoint["completedPageNumbers"], [1, 2])
        self.assertEqual(len(adapter_result.checkpoint["acceptedRecordIds"]), 3)
        self.assertEqual(adapter_result.checkpoint["newlyAcceptedRecordCount"], 3)
        self.assertEqual(adapter_result.checkpoint["cumulativeAcceptedRecordCount"], 3)
        self.assertEqual(adapter_result.checkpoint["duplicateAcceptedRecordCount"], 0)
        self.assertEqual(adapter_result.checkpoint["lastStatus"], "success_after_retry")
        self.assertEqual(adapter_result.public_summary()["lastStatus"], "success_after_retry")

        with tempfile.TemporaryDirectory() as temp_dir:
            first = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir) / "first",
                    input_mode="public_source_fixture",
                    public_source_fixture_failure_mode="transient_then_success",
                )
            )
            checkpoint_path = Path(first["outputs"]["sourceAdapterCheckpointJson"])
            second_config = load_config(
                build_config(
                    Path(temp_dir) / "second",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(checkpoint_path),
                )
            )
            resumed = run_source_adapter(second_config)
            self.assertEqual(len(resumed.rows), 0)
            self.assertEqual(resumed.lastStatus, "already_complete")
            self.assertEqual(resumed.rejectedRowCount, 0)
            self.assertEqual(resumed.checkpoint["previousAcceptedRecordCount"], 3)
            self.assertEqual(resumed.checkpoint["newlyAcceptedRecordCount"], 0)
            self.assertEqual(resumed.checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(len(resumed.checkpoint["acceptedRecordIds"]), 3)
            self.assertEqual(resumed.checkpoint["duplicateAcceptedRecordCount"], 0)

            second = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir) / "third",
                    input_mode="public_source_fixture",
                    public_source_fixture_failure_mode="transient_then_success",
                )
            )
            first_manifest = Path(first["outputs"]["manifestJson"]).read_bytes()
            second_manifest = Path(second["outputs"]["manifestJson"]).read_bytes()
            self.assertEqual(first_manifest, second_manifest)
            self.assertEqual(
                Path(first["outputs"]["sourceAdapterCheckpointJson"]).read_bytes(),
                Path(second["outputs"]["sourceAdapterCheckpointJson"]).read_bytes(),
            )

    def test_public_source_partial_checkpoint_page_two_resume_and_repeat_resume_are_deterministic(self):
        partial_checkpoint = FIXTURE_DIR / "public_source_fixture_page1_checkpoint.json"
        with tempfile.TemporaryDirectory() as temp_dir:
            page_two_config = load_config(
                build_config(
                    Path(temp_dir) / "page-two",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(partial_checkpoint),
                )
            )
            page_two = run_source_adapter(page_two_config)
            self.assertEqual([row["ticker"] for row in page_two.rows], ["069500"])
            self.assertEqual(page_two.checkpoint["previousAcceptedRecordCount"], 2)
            self.assertEqual(page_two.checkpoint["newlyAcceptedRecordCount"], 1)
            self.assertEqual(page_two.checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(page_two.checkpoint["acceptedRecordIds"], [
                "public-fixture-kr-etf-069500",
                "public-fixture-kr-stock-001",
                "public-fixture-kr-stock-002",
            ])
            self.assertEqual(page_two.checkpoint["completedPageNumbers"], [1, 2])
            self.assertEqual(page_two.checkpoint["duplicateAcceptedRecordCount"], 0)

            completed_checkpoint = Path(temp_dir) / "completed_checkpoint.json"
            completed_checkpoint.write_text(json.dumps(page_two.checkpoint, sort_keys=True), encoding="utf-8")
            repeat_config = load_config(
                build_config(
                    Path(temp_dir) / "repeat",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(completed_checkpoint),
                )
            )
            repeat = run_source_adapter(repeat_config)
            self.assertEqual(len(repeat.rows), 0)
            self.assertEqual(repeat.lastStatus, "already_complete")
            self.assertEqual(repeat.rejectedRowCount, 0)
            self.assertEqual(repeat.checkpoint["newlyAcceptedRecordCount"], 0)
            self.assertEqual(repeat.checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(repeat.checkpoint["duplicateAcceptedRecordCount"], 0)

    def test_public_source_checkpoint_identity_fail_closed(self):
        checkpoint_cases = [
            ("stale_source_sha", {"rawSourceSha256": "0" * 64}, "rawSourceSha256"),
            ("wrong_adapter_id", {"adapterId": "wrong.synthetic.adapter"}, "adapterId"),
            ("wrong_adapter_version", {"adapterVersion": "source-adapter-contract-v0"}, "adapterVersion"),
            ("wrong_mode", {"mode": "manual_upload"}, "mode"),
            ("wrong_source_file", {"sourceFileName": "other_fixture.csv"}, "sourceFileName"),
            ("missing_required_field", {"rawSourceSha256": None}, "rawSourceSha256"),
            ("wrong_accepted_type", {"acceptedRecordIds": "public-fixture-kr-stock-001"}, "acceptedRecordIds"),
            ("wrong_completed_page_type", {"completedPageNumbers": ["1"]}, "completedPageNumbers"),
        ]
        for name, overrides, expected_warning in checkpoint_cases:
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temp_dir:
                checkpoint_path = Path(temp_dir) / f"{name}.json"
                payload = public_source_checkpoint_payload(**overrides)
                if overrides.get("rawSourceSha256") is None:
                    payload.pop("rawSourceSha256")
                checkpoint_path.write_text(json.dumps(payload, sort_keys=True), encoding="utf-8")
                adapter_result = run_source_adapter(
                    load_config(
                        build_config(
                            Path(temp_dir) / "outputs",
                            input_mode="public_source_fixture",
                            public_source_resume_checkpoint_file=str(checkpoint_path),
                        )
                    )
                )
                self.assertFalse(adapter_result.rows)
                self.assertIn("source adapter checkpoint", "; ".join(adapter_result.warnings))
                self.assertIn(expected_warning, "; ".join(adapter_result.warnings))
                self.assertTrue(
                    any(error.startswith("source adapter checkpoint") for error in validate_adapter_result(adapter_result))
                )

    def test_public_source_malformed_checkpoint_fail_closed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            malformed_checkpoint = Path(temp_dir) / "malformed-checkpoint.json"
            malformed_checkpoint.write_text('{"acceptedRecordIds": [', encoding="utf-8")
            adapter_result = run_source_adapter(
                load_config(
                    build_config(
                        Path(temp_dir) / "malformed-output",
                        input_mode="public_source_fixture",
                        public_source_resume_checkpoint_file=str(malformed_checkpoint),
                    )
                )
            )
            self.assertFalse(adapter_result.rows)
            self.assertIn("source adapter checkpoint malformed json blocked", "; ".join(adapter_result.warnings))

            invalid_encoding_checkpoint = Path(temp_dir) / "invalid-encoding-checkpoint.json"
            invalid_encoding_checkpoint.write_bytes(b"\xff\xfe\x00\x00not-json")
            with self.assertRaisesRegex(PipelineCriticalError, "source adapter checkpoint invalid encoding blocked"):
                run_finple_monthly_metrics_pipeline(
                    build_config(
                        Path(temp_dir) / "invalid-encoding-output",
                        input_mode="public_source_fixture",
                        public_source_resume_checkpoint_file=str(invalid_encoding_checkpoint),
                    )
                )

    def test_public_source_completed_checkpoint_pipeline_noop_is_reproducible(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            first = run_finple_monthly_metrics_pipeline(
                build_config(Path(temp_dir) / "first", input_mode="public_source_fixture")
            )
            checkpoint_path = Path(first["outputs"]["sourceAdapterCheckpointJson"])

            noop_one = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir) / "noop-one",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(checkpoint_path),
                )
            )
            noop_two = run_finple_monthly_metrics_pipeline(
                build_config(
                    Path(temp_dir) / "noop-two",
                    input_mode="public_source_fixture",
                    public_source_resume_checkpoint_file=str(checkpoint_path),
                )
            )

            checkpoint_one = Path(noop_one["outputs"]["sourceAdapterCheckpointJson"])
            checkpoint_two = Path(noop_two["outputs"]["sourceAdapterCheckpointJson"])
            manifest_one = Path(noop_one["outputs"]["manifestJson"])
            manifest_two = Path(noop_two["outputs"]["manifestJson"])
            self.assertEqual(hashlib.sha256(checkpoint_one.read_bytes()).hexdigest(), hashlib.sha256(checkpoint_two.read_bytes()).hexdigest())
            self.assertEqual(hashlib.sha256(manifest_one.read_bytes()).hexdigest(), hashlib.sha256(manifest_two.read_bytes()).hexdigest())

            checkpoint = json.loads(checkpoint_one.read_text(encoding="utf-8"))
            self.assertEqual(checkpoint["lastStatus"], "already_complete")
            self.assertEqual(checkpoint["previousAcceptedRecordCount"], 3)
            self.assertEqual(checkpoint["newlyAcceptedRecordCount"], 0)
            self.assertEqual(checkpoint["cumulativeAcceptedRecordCount"], 3)
            self.assertEqual(checkpoint["duplicateAcceptedRecordCount"], 0)

            manifest = json.loads(manifest_one.read_text(encoding="utf-8"))
            self.assertEqual(manifest["sourceAdapter"]["lastStatus"], "already_complete")
            with Path(noop_one["outputs"]["normalizedMonthEndCsv"]).open("r", encoding="utf-8", newline="") as handle:
                normalized_rows = list(csv.DictReader(handle))
            self.assertEqual(normalized_rows, [])
            self.assertEqual(len(normalized_rows), len({(row["ticker"], row["month"]) for row in normalized_rows}))

            tampered_checkpoint = Path(temp_dir) / "tampered-complete-checkpoint.json"
            tampered_payload = json.loads(checkpoint_one.read_text(encoding="utf-8"))
            tampered_payload["rawSourceSha256"] = "1" * 64
            tampered_checkpoint.write_text(json.dumps(tampered_payload, sort_keys=True), encoding="utf-8")
            with self.assertRaisesRegex(PipelineCriticalError, "source adapter checkpoint identity mismatch blocked: rawSourceSha256"):
                run_finple_monthly_metrics_pipeline(
                    build_config(
                        Path(temp_dir) / "tampered-noop",
                        input_mode="public_source_fixture",
                        public_source_resume_checkpoint_file=str(tampered_checkpoint),
                    )
                )

    def test_public_source_retry_count_respects_configured_max(self):
        for max_retry in [0, 1, 2, 3]:
            with self.subTest(mode="permanent_failure", max_retry=max_retry):
                permanent = run_source_adapter(
                    load_config(
                        build_config(
                            Path("unused"),
                            input_mode="public_source_fixture",
                            public_source_fixture_failure_mode="permanent_failure",
                            source_adapter_max_retry_count=max_retry,
                        )
                    )
                )
                self.assertEqual(permanent.retryCount, max_retry)
                self.assertEqual(permanent.maxRetryCount, max_retry)
                self.assertEqual(permanent.lastStatus, "retry_exhausted")
                self.assertEqual(permanent.checkpoint["retryCount"], max_retry)
                self.assertEqual(permanent.checkpoint["maxRetryCount"], max_retry)
                self.assertEqual(permanent.checkpoint["lastStatus"], "retry_exhausted")
                self.assertFalse(permanent.rows)

            with self.subTest(mode="transient_then_success", max_retry=max_retry):
                transient = run_source_adapter(
                    load_config(
                        build_config(
                            Path("unused"),
                            input_mode="public_source_fixture",
                            public_source_fixture_failure_mode="transient_then_success",
                            source_adapter_max_retry_count=max_retry,
                        )
                    )
                )
                self.assertLessEqual(transient.retryCount, max_retry)
                self.assertEqual(transient.maxRetryCount, max_retry)
                self.assertEqual(transient.checkpoint["maxRetryCount"], max_retry)
                if max_retry == 0:
                    self.assertEqual(transient.retryCount, 0)
                    self.assertEqual(transient.lastStatus, "retry_exhausted")
                    self.assertFalse(transient.rows)
                else:
                    self.assertEqual(transient.retryCount, 1)
                    self.assertEqual(transient.lastStatus, "success_after_retry")
                    self.assertTrue(transient.rows)

    def test_public_source_fixture_license_and_permanent_retry_fail_closed(self):
        for overrides in [
            {"public_source_fixture_file": "public_source_fixture_unknown_license.csv"},
            {"public_source_fixture_failure_mode": "permanent_failure"},
            {"public_source_fixture_failure_mode": "transient_then_success", "source_adapter_max_retry_count": 0},
        ]:
            with self.subTest(overrides=overrides), tempfile.TemporaryDirectory() as temp_dir:
                with self.assertRaises(PipelineCriticalError):
                    run_finple_monthly_metrics_pipeline(
                        build_config(Path(temp_dir), input_mode="public_source_fixture", **overrides)
                    )


if __name__ == "__main__":
    unittest.main()
