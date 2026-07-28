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
    "benchmarkProviderSymbol",
    "exposureType",
    "distributionType",
    "distributionFrequency",
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
) -> dict[str, str]:
    provider_symbol = f"{ticker}.KS" if market == "KR" else ticker
    benchmark_symbol = "069500.KS" if market == "KR" else "SPY"
    return {
        "market": market,
        "ticker": ticker,
        "name": ticker,
        "benchmark": benchmark,
        "active": active,
        "includeInSimulator": include,
        "providerSymbol": provider_symbol,
        "benchmarkProviderSymbol": benchmark_symbol,
        "exposureType": exposure_type,
        "distributionType": distribution_type,
        "distributionFrequency": "monthly",
    }


def _source_row(
    ticker: str,
    *,
    exposure_type: str = "broad_market",
    distribution_type: str = "ordinary_cash_dividend",
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
        "distributionFrequency": "monthly",
        "active": active,
    }


def _bundle(
    growth: float,
    *,
    cash: float = 0.0,
    cash_status: str = DIVIDEND_CONFIRMED_ZERO,
) -> MarketDataBundle:
    observations: list[DailyObservation] = []
    for offset in range(25):
        year = 2022 + offset // 12
        month = offset % 12 + 1
        observations.append(
            DailyObservation(
                date(year, month, 1),
                100.0
                * (1.0 + growth) ** (offset / 12.0)
                * (1.0 + (offset % 3) * 0.001),
                dividend_cash=cash if offset == 24 else 0.0,
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
                "expectedCagr": "8",
                "beta": "1",
                "mdd": "-20",
                "annualizedVolatility": "15",
                "volatilityObservationCount": "252",
                "priceDataEndDate": "2024-01-01",
                "priceBasis": SPLIT_ADJUSTED_CLOSE,
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
