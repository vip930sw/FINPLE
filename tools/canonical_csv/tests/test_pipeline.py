from __future__ import annotations

import csv
import json
import tempfile
import unittest
from dataclasses import replace
from datetime import date
from pathlib import Path

from tools.canonical_csv.build import build_canonical_candidate
from tools.canonical_csv.canonical import (
    CANDIDATE_REQUIRED_COLUMNS,
    candidate_headers,
    load_canonical_source,
)
from tools.canonical_csv.config import PipelineConfig
from tools.canonical_csv.market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    DIVIDEND_CONFIRMED_ZERO,
    DIVIDEND_UNAVAILABLE,
    SPLIT_ADJUSTED_CLOSE,
    DailyObservation,
    DividendData,
    InMemoryMarketDataProvider,
    MarketDataBundle,
    MarketDataError,
)
from tools.canonical_csv.universe import UniverseError, load_universe
from tools.canonical_csv.validate import validate_candidate_rows


UNIVERSE_HEADERS = (
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
    "exposureType",
    "distributionType",
    "distributionFrequency",
    "firstListedDate",
    "direction",
    "leverageMultiple",
    "resetFrequency",
    "distributionDataQualityStatus",
    "distributionDataQualityReason",
    "reasonCode",
    "reasonMessage",
)
SOURCE_HEADERS = (
    "market",
    "ticker",
    "providerSymbol",
    "nameKr",
    "assetType",
    "tier",
    "tags",
    "expectedCagr",
    "beta",
    "mdd",
    "dividendYield",
    "exposureType",
    "distributionType",
    "distributionFrequency",
    "active",
)


def _write_csv(
    path: Path,
    headers: tuple[str, ...],
    rows: list[dict[str, str]],
) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def _asset_row(
    ticker: str,
    *,
    market: str = "US",
    benchmark: str = "US:SPY",
    active: str = "true",
    include: str = "true",
    exposure_type: str = "broad_market",
    distribution_type: str = "ordinary_cash_dividend",
    distribution_frequency: str = "monthly",
    first_listed_date: str = "",
    direction: str = "long",
    leverage_multiple: str = "1",
    reset_frequency: str = "not_applicable",
    distribution_data_quality_status: str = "",
    distribution_data_quality_reason: str = "",
    reason_code: str = "",
    reason_message: str = "",
) -> dict[str, str]:
    provider_symbol = ticker
    adapter_symbol = f"{ticker}.KS" if market == "KR" else ticker
    benchmark_symbol = "069500.KS" if market == "KR" else "SPY"
    return {
        "market": market,
        "ticker": ticker,
        "name": ticker,
        "benchmark": benchmark,
        "active": active,
        "includeInSimulator": include,
        "providerSymbol": provider_symbol,
        "marketDataProvider": "yfinance",
        "marketDataProviderSymbol": adapter_symbol,
        "benchmarkProviderSymbol": benchmark_symbol,
        "exposureType": exposure_type,
        "distributionType": distribution_type,
        "distributionFrequency": distribution_frequency,
        "firstListedDate": first_listed_date,
        "direction": direction,
        "leverageMultiple": leverage_multiple,
        "resetFrequency": reset_frequency,
        "distributionDataQualityStatus": distribution_data_quality_status,
        "distributionDataQualityReason": distribution_data_quality_reason,
        "reasonCode": reason_code,
        "reasonMessage": reason_message,
    }


def _source_row(
    ticker: str,
    *,
    exposure_type: str = "broad_market",
    distribution_type: str = "ordinary_cash_dividend",
    distribution_frequency: str = "monthly",
    active: str = "True",
) -> dict[str, str]:
    return {
        "market": "US",
        "ticker": ticker,
        "providerSymbol": ticker,
        "nameKr": f"{ticker} 표시 이름",
        "assetType": "etf",
        "tier": "standard",
        "tags": "preserve-me",
        "expectedCagr": "",
        "beta": "",
        "mdd": "",
        "dividendYield": "",
        "exposureType": exposure_type,
        "distributionType": distribution_type,
        "distributionFrequency": distribution_frequency,
        "active": active,
    }


def _bundle(
    growth: float,
    *,
    cash: float = 0.0,
    cash_status: str = DIVIDEND_CONFIRMED_ZERO,
    months: int = 25,
    start_year: int = 2022,
) -> MarketDataBundle:
    observations: list[DailyObservation] = []
    for offset in range(months):
        year = start_year + offset // 12
        month = offset % 12 + 1
        observations.append(
            DailyObservation(
                date(year, month, 1),
                100.0
                * (1.0 + growth) ** (offset / 12.0)
                * (1.0 + (offset % 3) * 0.001),
                dividend_cash=cash if offset == months - 1 else 0.0,
            )
        )
    return MarketDataBundle(
        tuple(observations),
        DividendData(
            cash_status,
            cash if cash_status == DIVIDEND_CONFIRMED_VALUE else 0.0,
        ),
        SPLIT_ADJUSTED_CLOSE,
    )


def _paths(
    root: Path,
    source_rows: list[dict[str, str]],
    universe_rows: list[dict[str, str]],
) -> tuple[Path, Path, Path]:
    source = root / "source.csv"
    universe = root / "universe.csv"
    candidate = root / "candidate.csv"
    _write_csv(source, SOURCE_HEADERS, source_rows)
    _write_csv(universe, UNIVERSE_HEADERS, universe_rows)
    return source, universe, candidate


def _config(source: Path, universe: Path, candidate: Path) -> PipelineConfig:
    return PipelineConfig(
        source_canonical_path=source,
        universe_path=universe,
        output_candidate_path=candidate,
        as_of_date=date(2024, 1, 1),
        cache_dir=candidate.parent / "cache",
        rolling_cagr_window_years=(1,),
        min_rolling_windows=6,
        beta_lookback_observations=24,
        min_beta_observations=2,
        volatility_lookback_observations=24,
        min_volatility_observations=2,
    )


class CountingProvider(InMemoryMarketDataProvider):
    def __init__(
        self,
        bundles: dict[str, MarketDataBundle],
        fail_identity: str | None = None,
    ):
        super().__init__(bundles)
        self.fail_identity = fail_identity
        self.asset_calls: list[str] = []

    def load_asset(self, asset, as_of_date):
        self.asset_calls.append(asset.identity)
        if asset.identity == self.fail_identity:
            raise MarketDataError(f"forced_failure:{asset.identity}")
        return super().load_asset(asset, as_of_date)


class FullSchemaBuildTests(unittest.TestCase):
    def test_source_schema_values_and_row_order_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SPY"), _source_row("QQQ")],
                [_asset_row("SPY"), _asset_row("QQQ")],
            )
            result = build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {"US:SPY": _bundle(0.08), "US:QQQ": _bundle(0.12)}
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                rows = list(reader)
                headers = tuple(reader.fieldnames or ())
            self.assertTrue(result.validation["structuralValid"])
            self.assertTrue(result.validation["publishable"])
            self.assertEqual(headers[: len(SOURCE_HEADERS)], SOURCE_HEADERS)
            self.assertEqual([row["ticker"] for row in rows], ["SPY", "QQQ"])
            self.assertEqual(rows[1]["nameKr"], "QQQ 표시 이름")
            self.assertEqual(rows[1]["tags"], "preserve-me")

    def test_new_universe_asset_is_appended_after_source_rows(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SPY")],
                [_asset_row("SPY"), _asset_row("QQQ")],
            )
            build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {"US:SPY": _bundle(0.08), "US:QQQ": _bundle(0.12)}
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual([row["ticker"] for row in rows], ["SPY", "QQQ"])
            self.assertEqual(rows[1]["providerSymbol"], "QQQ")

    def test_operator_exclusion_reason_is_preserved_in_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SPY")],
                [
                    _asset_row(
                        "SPY",
                        include="false",
                        reason_code="new_asset_pending_metrics",
                        reason_message=(
                            "new asset requires metrics and operator activation"
                        ),
                    )
                ],
            )

            class NoProvider:
                def load_asset(self, asset, as_of_date):
                    raise AssertionError("provider must not be called")

                def load_benchmark(self, asset, as_of_date):
                    raise AssertionError("provider must not be called")

            build_canonical_candidate(
                _config(source, universe, candidate),
                NoProvider(),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = next(csv.DictReader(handle))
            self.assertEqual(
                row["reasonCode"],
                "new_asset_pending_metrics",
            )

    def test_nonordinary_asset_keeps_price_metrics_and_cash_distribution(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [
                    _source_row("SPY"),
                    _source_row(
                        "NVDY",
                        exposure_type="single_stock_option_income",
                        distribution_type="single_stock_weekly_income",
                    ),
                ],
                [
                    _asset_row("SPY"),
                    _asset_row(
                        "NVDY",
                        exposure_type="single_stock_option_income",
                        distribution_type="single_stock_weekly_income",
                    ),
                ],
            )
            build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(0.08),
                        "US:NVDY": _bundle(
                            0.15,
                            cash=12.0,
                            cash_status=DIVIDEND_CONFIRMED_VALUE,
                        ),
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = list(csv.DictReader(handle))[1]
            for field in (
                "rawPriceCagr",
                "rollingCagrMedian",
                "expectedCagr",
                "beta",
                "mdd",
                "annualizedVolatility",
            ):
                self.assertNotEqual(row[field], "", field)
            self.assertEqual(row["priceMetricsStatus"], "ready")
            self.assertEqual(row["dividendYield"], "")
            self.assertNotEqual(row["cashDistributionYieldTtm"], "")
            self.assertEqual(
                row["trailingDistributionYield"],
                row["cashDistributionYieldTtm"],
            )
            self.assertEqual(
                row["reinvestmentCashYield"],
                row["cashDistributionYieldTtm"],
            )

    def test_operator_distribution_fields_drive_candidate_and_cash_yield(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [
                    _source_row(
                        "NVDY",
                        exposure_type="ordinary_etf",
                        distribution_type="unknown",
                        distribution_frequency="unknown",
                    )
                ],
                [
                    _asset_row(
                        "NVDY",
                        exposure_type="ordinary_etf",
                        distribution_type="mixed_distribution",
                        distribution_frequency="weekly",
                    )
                ],
            )
            result = build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(0.08),
                        "US:NVDY": _bundle(
                            0.15,
                            cash=12.0,
                            cash_status=DIVIDEND_CONFIRMED_VALUE,
                        ),
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = next(csv.DictReader(handle))
            self.assertTrue(result.validation["publishable"])
            self.assertEqual(row["exposureType"], "ordinary_etf")
            self.assertEqual(row["distributionType"], "mixed_distribution")
            self.assertEqual(row["distributionFrequency"], "weekly")
            self.assertEqual(row["dividendYield"], "")
            self.assertNotEqual(row["cashDistributionYieldTtm"], "")
            self.assertEqual(
                row["trailingDistributionYield"],
                row["cashDistributionYieldTtm"],
            )
            self.assertEqual(
                row["reinvestmentCashYield"],
                row["cashDistributionYieldTtm"],
            )
            self.assertEqual(
                row["simulationCashYield"],
                row["cashDistributionYieldTtm"],
            )
            self.assertEqual(
                row["distributionSimulationPolicy"],
                "repeat_ttm_distribution",
            )
            self.assertEqual(row["tags"], "preserve-me")

    def test_distribution_contract_changes_invalidate_checkpoint(self) -> None:
        for field, value in (
            ("distributionType", "mixed_distribution"),
            ("distributionFrequency", "weekly"),
            ("firstListedDate", "2010-01-01"),
            ("direction", "inverse"),
            ("leverageMultiple", "-3"),
            ("resetFrequency", "daily"),
            ("distributionDataQualityStatus", "provider_event_error"),
        ):
            with self.subTest(field=field):
                with tempfile.TemporaryDirectory() as temporary:
                    root = Path(temporary)
                    source, universe, candidate = _paths(
                        root,
                        [_source_row("SPY"), _source_row("QQQ")],
                        [_asset_row("SPY"), _asset_row("QQQ")],
                    )
                    config = _config(source, universe, candidate)
                    build_canonical_candidate(
                        config,
                        InMemoryMarketDataProvider(
                            {
                                "US:SPY": _bundle(0.08),
                                "US:QQQ": _bundle(0.12),
                            }
                        ),
                    )
                    with universe.open(
                        encoding="utf-8",
                        newline="",
                    ) as handle:
                        rows = list(csv.DictReader(handle))
                    rows[0][field] = value
                    _write_csv(universe, UNIVERSE_HEADERS, rows)
                    provider = CountingProvider(
                        {
                            "US:SPY": _bundle(0.08),
                            "US:QQQ": _bundle(0.12),
                        }
                    )
                    result = build_canonical_candidate(config, provider)
                    self.assertEqual(provider.asset_calls, ["US:SPY"])
                    self.assertEqual(result.summary["resumedRowCount"], 1)

    def test_ordinary_distribution_uses_dividend_only(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SPY")],
                [_asset_row("SPY")],
            )
            build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(
                            0.08,
                            cash=2.0,
                            cash_status=DIVIDEND_CONFIRMED_VALUE,
                        )
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = next(csv.DictReader(handle))
            self.assertNotEqual(row["dividendYield"], "")
            self.assertEqual(row["cashDistributionYieldTtm"], "")
            self.assertEqual(row["simulationCashYield"], row["dividendYield"])
            self.assertEqual(
                row["reinvestmentCashYield"],
                row["dividendYield"],
            )

    def test_partial_failure_preserves_candidate_and_checkpoint_resumes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SPY"), _source_row("QQQ")],
                [_asset_row("SPY"), _asset_row("QQQ")],
            )
            candidate.write_bytes(b"known-good-candidate\n")
            config = _config(source, universe, candidate)
            first = CountingProvider(
                {"US:SPY": _bundle(0.08), "US:QQQ": _bundle(0.12)},
                fail_identity="US:QQQ",
            )
            with self.assertRaisesRegex(ValueError, "not publishable"):
                build_canonical_candidate(config, first)
            self.assertEqual(candidate.read_bytes(), b"known-good-candidate\n")
            self.assertEqual(first.asset_calls, ["US:SPY", "US:QQQ"])
            report = json.loads(
                config.resolved_validation_report_path.read_text(
                    encoding="utf-8"
                )
            )
            self.assertTrue(report["structuralValid"])
            self.assertFalse(report["publishable"])
            with config.resolved_failed_assets_path.open(
                encoding="utf-8",
                newline="",
            ) as handle:
                failed_rows = list(csv.DictReader(handle))
            self.assertEqual(failed_rows[0]["ticker"], "QQQ")
            self.assertEqual(
                failed_rows[0]["priceMetricsStatus"],
                "failed",
            )

            second = CountingProvider(
                {"US:SPY": _bundle(0.08), "US:QQQ": _bundle(0.12)}
            )
            result = build_canonical_candidate(
                replace(
                    config,
                    failed_identities_path=config.resolved_failed_assets_path,
                ),
                second,
            )
            self.assertTrue(result.validation["publishable"])
            self.assertEqual(second.asset_calls, ["US:QQQ"])

    def test_nonpublishable_review_candidate_can_be_retained(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SPY")],
                [_asset_row("SPY")],
            )
            candidate.write_bytes(b"known-good-candidate\n")
            config = replace(
                _config(source, universe, candidate),
                write_non_publishable_candidate=True,
            )
            with self.assertRaisesRegex(ValueError, "review artifact"):
                build_canonical_candidate(
                    config,
                    CountingProvider(
                        {"US:SPY": _bundle(0.08)},
                        fail_identity="US:SPY",
                    ),
                )
            self.assertNotEqual(
                candidate.read_bytes(),
                b"known-good-candidate\n",
            )

    def test_cash_failure_retains_successful_nonordinary_price_metrics(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [
                    _source_row("SPY"),
                    _source_row(
                        "NVDY",
                        exposure_type="single_stock_option_income",
                        distribution_type="single_stock_weekly_income",
                    ),
                ],
                [
                    _asset_row("SPY"),
                    _asset_row(
                        "NVDY",
                        exposure_type="single_stock_option_income",
                        distribution_type="single_stock_weekly_income",
                    ),
                ],
            )
            config = _config(source, universe, candidate)
            with self.assertRaisesRegex(ValueError, "not publishable"):
                build_canonical_candidate(
                    config,
                    InMemoryMarketDataProvider(
                        {
                            "US:SPY": _bundle(0.08),
                            "US:NVDY": _bundle(
                                0.15,
                                cash_status=DIVIDEND_UNAVAILABLE,
                            ),
                        }
                    ),
                )
            with config.resolved_failed_assets_path.open(
                encoding="utf-8",
                newline="",
            ) as handle:
                failed = {
                    row["ticker"]: row for row in csv.DictReader(handle)
                }["NVDY"]
            self.assertEqual(failed["priceMetricsStatus"], "ready")
            self.assertNotEqual(failed["expectedCagr"], "")
            self.assertEqual(
                failed["distributionCalculationStatus"],
                DIVIDEND_UNAVAILABLE,
            )
            self.assertEqual(failed["cashDistributionYieldTtm"], "")


class UniverseTests(unittest.TestCase):
    def test_korean_numeric_and_alphanumeric_tickers_are_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / "universe.csv"
            _write_csv(
                path,
                UNIVERSE_HEADERS,
                [
                    _asset_row(
                        "069500",
                        market="KR",
                        benchmark="KR:069500",
                    ),
                    _asset_row(
                        "0000D0",
                        market="KR",
                        benchmark="KR:069500",
                    ),
                ],
            )
            assets = load_universe(path)
            self.assertEqual(
                [asset.ticker for asset in assets],
                ["069500", "0000D0"],
            )

    def test_canonical_kr_symbol_is_not_a_live_adapter_fallback(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "universe.csv"
            row = _asset_row(
                "005930",
                market="KR",
                benchmark="KR:069500",
            )
            row["providerSymbol"] = "005930"
            row["marketDataProviderSymbol"] = ""
            _write_csv(path, UNIVERSE_HEADERS, [row])
            asset = load_universe(path)[0]
        self.assertEqual(asset.provider_symbol, "005930")
        self.assertEqual(asset.market_data_provider_symbol, "")

    def test_short_korean_ticker_is_rejected_instead_of_zfilled(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / "universe.csv"
            _write_csv(
                path,
                UNIVERSE_HEADERS,
                [
                    _asset_row(
                        "69500",
                        market="KR",
                        benchmark="KR:069500",
                    )
                ],
            )
            with self.assertRaisesRegex(UniverseError, "six characters"):
                load_universe(path)

    def test_as_of_date_none_is_not_supported(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaisesRegex(ValueError, "explicit date"):
                PipelineConfig(
                    source_canonical_path=root / "source.csv",
                    universe_path=root / "universe.csv",
                    output_candidate_path=root / "candidate.csv",
                    as_of_date=None,  # type: ignore[arg-type]
                )

    def test_duplicate_market_ticker_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "universe.csv"
            _write_csv(
                path,
                UNIVERSE_HEADERS,
                [_asset_row("SPY"), _asset_row("SPY")],
            )
            with self.assertRaisesRegex(UniverseError, "duplicate"):
                load_universe(path)

    def test_short_history_remains_metric_ready_but_portfolio_denied(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("PLUS200TR")],
                [
                    _asset_row(
                        "PLUS200TR",
                        first_listed_date="2022-01-01",
                    )
                ],
            )
            result = build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(0.08),
                        "US:PLUS200TR": _bundle(0.12),
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = next(csv.DictReader(handle))
            self.assertTrue(result.validation["publishable"])
            self.assertEqual(row["priceMetricsStatus"], "ready")
            self.assertEqual(row["simulatorReady"], "true")
            self.assertEqual(row["portfolioEligible"], "false")
            self.assertEqual(
                row["portfolioEligibilityStatus"],
                "insufficient_long_horizon_history",
            )
            self.assertEqual(row["portfolioAddPolicy"], "deny")
            self.assertEqual(row["cagrConfidence"], "low")
            self.assertEqual(row["portfolioEligibleAfterDate"], "2025-01-01")
            self.assertNotEqual(row["rawPriceCagr"], "")

    def test_long_history_leveraged_asset_requires_confirmation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("SQQQ")],
                [
                    _asset_row(
                        "SQQQ",
                        exposure_type="leveraged_inverse",
                        first_listed_date="2019-01-01",
                        direction="inverse",
                        leverage_multiple="-3",
                        reset_frequency="daily",
                    )
                ],
            )
            config = replace(
                _config(source, universe, candidate),
                rolling_cagr_window_years=(3, 1),
            )
            result = build_canonical_candidate(
                config,
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(
                            0.08,
                            months=61,
                            start_year=2019,
                        ),
                        "US:SQQQ": _bundle(
                            -0.08,
                            months=61,
                            start_year=2019,
                        ),
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = next(csv.DictReader(handle))
            self.assertTrue(result.validation["publishable"])
            self.assertEqual(row["portfolioEligible"], "true")
            self.assertEqual(row["portfolioEligibilityStatus"], "eligible")
            self.assertEqual(row["portfolioAddPolicy"], "confirm")
            self.assertIn("inverse_exposure", row["portfolioWarningCodes"])
            self.assertIn("daily_reset", row["portfolioWarningCodes"])

    def test_one_year_rolling_window_denies_long_listing_history(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [_source_row("LONG1Y")],
                [
                    _asset_row(
                        "LONG1Y",
                        first_listed_date="2010-01-01",
                    )
                ],
            )
            config = replace(
                _config(source, universe, candidate),
                rolling_cagr_window_years=(1,),
            )
            result = build_canonical_candidate(
                config,
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(
                            0.08,
                            months=61,
                            start_year=2019,
                        ),
                        "US:LONG1Y": _bundle(
                            0.1,
                            months=61,
                            start_year=2019,
                        ),
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                row = next(csv.DictReader(handle))
            self.assertTrue(result.validation["publishable"])
            self.assertGreaterEqual(float(row["usablePriceHistoryYears"]), 3)
            self.assertEqual(row["rollingCagrWindowYears"], "1")
            self.assertEqual(row["portfolioAddPolicy"], "deny")
            self.assertEqual(row["cagrConfidence"], "low")

    def test_special_and_provider_error_distribution_yields_do_not_repeat(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source, universe, candidate = _paths(
                root,
                [
                    _source_row("AIV"),
                    _source_row("BETH"),
                    _source_row("SOXS"),
                ],
                [
                    _asset_row(
                        "AIV",
                        distribution_type=(
                            "special_or_liquidating_distribution"
                        ),
                    ),
                    _asset_row(
                        "BETH",
                        distribution_type="futures_mixed_distribution",
                    ),
                    _asset_row(
                        "SOXS",
                        exposure_type="leveraged_inverse",
                        distribution_type="ordinary_cash_dividend",
                        distribution_data_quality_status=(
                            "provider_event_error"
                        ),
                        distribution_data_quality_reason=(
                            "provider cash events require review"
                        ),
                    ),
                ],
            )
            result = build_canonical_candidate(
                _config(source, universe, candidate),
                InMemoryMarketDataProvider(
                    {
                        "US:SPY": _bundle(0.08),
                        "US:AIV": _bundle(
                            0.04,
                            cash=5,
                            cash_status=DIVIDEND_CONFIRMED_VALUE,
                        ),
                        "US:BETH": _bundle(
                            0.06,
                            cash=8,
                            cash_status=DIVIDEND_CONFIRMED_VALUE,
                        ),
                        "US:SOXS": _bundle(
                            -0.05,
                            cash=30,
                            cash_status=DIVIDEND_CONFIRMED_VALUE,
                        ),
                    }
                ),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                rows = {row["ticker"]: row for row in csv.DictReader(handle)}
            self.assertTrue(result.validation["publishable"])
            for ticker in ("AIV", "SOXS"):
                self.assertNotEqual(
                    rows[ticker]["cashDistributionYieldTtm"],
                    "",
                )
                self.assertEqual(rows[ticker]["simulationCashYield"], "0")
                self.assertEqual(rows[ticker]["reinvestmentCashYield"], "0")
            self.assertEqual(
                rows["AIV"]["distributionSimulationPolicy"],
                "exclude_non_recurring_distribution",
            )
            self.assertEqual(
                rows["AIV"]["distributionCalculationStatus"],
                "non_recurring_distribution_excluded",
            )
            self.assertEqual(rows["BETH"]["dividendYield"], "")
            self.assertEqual(
                rows["BETH"]["simulationCashYield"],
                rows["BETH"]["cashDistributionYieldTtm"],
            )
            self.assertEqual(
                rows["BETH"]["reinvestmentCashYield"],
                rows["BETH"]["cashDistributionYieldTtm"],
            )
            self.assertEqual(
                rows["BETH"]["distributionSimulationPolicy"],
                "repeat_ttm_distribution",
            )
            self.assertEqual(
                rows["SOXS"]["distributionSimulationPolicy"],
                "blocked_data_quality",
            )
            self.assertEqual(
                rows["SOXS"]["distributionCalculationStatus"],
                "provider_event_error",
            )


class PublishabilityTests(unittest.TestCase):
    def _context(
        self,
        root: Path,
        *,
        nonordinary: bool = False,
        include: str = "true",
    ):
        exposure = (
            "index_covered_call" if nonordinary else "broad_market"
        )
        distribution = (
            "index_covered_call"
            if nonordinary
            else "ordinary_cash_dividend"
        )
        source, universe, _ = _paths(
            root,
            [
                _source_row(
                    "SPY",
                    exposure_type=exposure,
                    distribution_type=distribution,
                )
            ],
            [
                _asset_row(
                    "SPY",
                    include=include,
                    exposure_type=exposure,
                    distribution_type=distribution,
                )
            ],
        )
        source_data = load_canonical_source(source)
        asset = load_universe(universe)[0]
        headers = candidate_headers(source_data.headers)
        row: dict[str, object] = {field: "" for field in headers}
        row.update(source_data.rows[0])
        row.update(
            {
                "includeInSimulator": include,
                "simulatorReady": "true",
                "rawPriceCagr": "8",
                "rollingCagrMedian": "8",
                "rollingCagrWindowYears": "1",
                "rollingCagrWindowCount": "12",
                "priceHistoryStartDate": "2022-01-01",
                "usablePriceHistoryYears": "2",
                "minimumPortfolioHistoryYears": "3",
                "portfolioEligible": "false",
                "portfolioEligibilityStatus": (
                    "excluded_by_operator"
                    if include == "false"
                    else "insufficient_long_horizon_history"
                ),
                "portfolioEligibilityReason": (
                    "excluded_by_operator"
                    if include == "false"
                    else "insufficient_long_horizon_history"
                ),
                "portfolioEligibleAfterDate": (
                    "" if include == "false" else "2025-01-01"
                ),
                "cagrConfidence": "low",
                "portfolioAddPolicy": "deny",
                "portfolioWarningCodes": "",
                "expectedCagr": "8",
                "beta": "1",
                "mdd": "-20",
                "annualizedVolatility": "15",
                "volatilityObservationCount": "252",
                "priceDataEndDate": "2024-01-01",
                "priceBasis": SPLIT_ADJUSTED_CLOSE,
                "simulationCashYield": "",
                "distributionSimulationPolicy": (
                    "repeat_ttm_distribution"
                    if nonordinary
                    else "ordinary_cash_dividend"
                ),
                "reasonCode": "",
                "reasonMessage": "",
            }
        )
        return source_data, asset, headers, row

    def _validate(self, root: Path, **kwargs):
        source, asset, headers, row = self._context(root, **kwargs)
        report = validate_candidate_rows(
            [row],
            headers=headers,
            universe=[asset],
            as_of_date=date(2024, 1, 1),
            source=source,
        )
        return report, row, source, asset, headers

    def test_structural_valid_but_not_publishable_is_reported(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            report, row, source, asset, headers = self._validate(root)
            row["simulatorReady"] = "false"
            row["reasonCode"] = "forced"
            row["reasonMessage"] = "reason does not make it publishable"
            report = validate_candidate_rows(
                [row],
                headers=headers,
                universe=[asset],
                as_of_date=date(2024, 1, 1),
                source=source,
            )
            self.assertTrue(report["structuralValid"])
            self.assertFalse(report["publishable"])
            self.assertFalse(report["valid"])

    def test_missing_common_metric_is_not_publishable(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, row, source, asset, headers = self._validate(root)
            row["dividendYield"] = "2"
            row["beta"] = ""
            row["reasonCode"] = "beta_missing"
            row["reasonMessage"] = "reason does not bypass publishability"
            report = validate_candidate_rows(
                [row],
                headers=headers,
                universe=[asset],
                as_of_date=date(2024, 1, 1),
                source=source,
            )
            self.assertTrue(report["structuralValid"])
            self.assertFalse(report["publishable"])

    def test_source_column_row_and_value_removal_are_structural_errors(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            _, row, source, asset, headers = self._validate(root)
            row["dividendYield"] = "2"
            changed = dict(row)
            changed["tier"] = "changed"
            report = validate_candidate_rows(
                [changed],
                headers=[field for field in headers if field != "tags"],
                universe=[asset],
                as_of_date=date(2024, 1, 1),
                source=source,
            )
            codes = {issue["code"] for issue in report["issues"]}
            self.assertFalse(report["structuralValid"])
            self.assertIn("source_columns_removed", codes)
            self.assertIn("source_field_changed", codes)
            removed_report = validate_candidate_rows(
                [],
                headers=headers,
                universe=[asset],
                as_of_date=date(2024, 1, 1),
                source=source,
            )
            self.assertIn(
                "source_rows_removed",
                {issue["code"] for issue in removed_report["issues"]},
            )

    def test_ordinary_dividend_is_required(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            report, *_ = self._validate(Path(temporary))
            self.assertTrue(report["structuralValid"])
            self.assertFalse(report["publishable"])

    def test_nonordinary_requires_cash_yield_but_not_dividend(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            report, row, source, asset, headers = self._validate(
                root,
                nonordinary=True,
            )
            self.assertFalse(report["publishable"])
            row["cashDistributionYieldTtm"] = "12"
            row["trailingDistributionYield"] = "12"
            row["reinvestmentCashYield"] = "12"
            row["simulationCashYield"] = "12"
            report = validate_candidate_rows(
                [row],
                headers=headers,
                universe=[asset],
                as_of_date=date(2024, 1, 1),
                source=source,
            )
            self.assertTrue(report["publishable"])
            self.assertEqual(row["dividendYield"], "")

    def test_explicit_simulator_exclusion_is_allowed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            report, row, source, asset, headers = self._validate(
                root,
                include="false",
            )
            row["simulatorReady"] = "false"
            row["reasonCode"] = "excluded_from_simulator"
            row["reasonMessage"] = "explicit universe exclusion"
            report = validate_candidate_rows(
                [row],
                headers=headers,
                universe=[asset],
                as_of_date=date(2024, 1, 1),
                source=source,
            )
            self.assertTrue(report["structuralValid"])
            self.assertTrue(report["publishable"])


if __name__ == "__main__":
    unittest.main()
