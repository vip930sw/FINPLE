from __future__ import annotations

import math
import statistics
import tempfile
import unittest
from datetime import date
from pathlib import Path

from tools.canonical_csv.config import PipelineConfig
from tools.canonical_csv.market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    DIVIDEND_CONFIRMED_ZERO,
    DIVIDEND_UNAVAILABLE,
    DailyObservation,
    DividendData,
    MarketDataBundle,
    RAW_UNADJUSTED_CLOSE,
    SPLIT_ADJUSTED_CLOSE,
    price_series,
    split_adjusted_price_series,
)
from tools.canonical_csv.metrics import (
    MetricCalculationError,
    calculate_annualized_volatility,
    calculate_asset_metrics,
    calculate_beta,
    calculate_cagr,
    calculate_dividend_yield,
    calculate_mdd,
    rolling_cagr_values,
    select_rolling_cagr,
)


def _month_points(
    *,
    start_year: int = 2018,
    months: int = 37,
    annual_growth: float = 0.10,
) -> list[tuple[date, float]]:
    points: list[tuple[date, float]] = []
    for offset in range(months):
        year = start_year + offset // 12
        month = offset % 12 + 1
        points.append(
            (
                date(year, month, 1),
                100.0 * (1.0 + annual_growth) ** (offset / 12.0),
            )
        )
    return points


class MetricTests(unittest.TestCase):
    def test_known_raw_price_cagr(self) -> None:
        value = calculate_cagr(
            [(date(2020, 1, 1), 100.0), (date(2024, 1, 1), 146.41)]
        )
        self.assertAlmostEqual(value, 10.0, delta=0.01)

    def test_known_rolling_cagr_median(self) -> None:
        median, years, count = select_rolling_cagr(
            _month_points(months=43),
            (3, 1),
            6,
        )
        self.assertEqual(years, 3)
        self.assertEqual(count, 7)
        self.assertAlmostEqual(median, 10.0, delta=0.02)

    def test_rolling_median_reduces_endpoint_bias(self) -> None:
        points = _month_points(months=49)
        points[-1] = (points[-1][0], points[-1][1] * 2.0)
        raw = calculate_cagr([points[0], points[-1]])
        rolling = statistics.median(rolling_cagr_values(points, 1))
        self.assertLess(abs(rolling - 10.0), abs(raw - 10.0))

    def test_known_mdd(self) -> None:
        value = calculate_mdd(
            [
                (date(2024, 1, 1), 100.0),
                (date(2024, 1, 2), 125.0),
                (date(2024, 1, 3), 75.0),
                (date(2024, 1, 4), 110.0),
            ]
        )
        self.assertAlmostEqual(value, -40.0)

    def test_known_beta(self) -> None:
        dates = [date(2024, 1, day) for day in range(1, 7)]
        benchmark_returns = [0.01, -0.005, 0.02, -0.01, 0.015]
        asset_prices = [100.0]
        benchmark_prices = [100.0]
        for benchmark_return in benchmark_returns:
            benchmark_prices.append(
                benchmark_prices[-1] * (1.0 + benchmark_return)
            )
            asset_prices.append(
                asset_prices[-1] * (1.0 + 2.0 * benchmark_return)
            )
        beta = calculate_beta(
            list(zip(dates, asset_prices)),
            list(zip(dates, benchmark_prices)),
            lookback=5,
            min_observations=5,
        )
        self.assertAlmostEqual(beta, 2.0, places=10)

    def test_known_annualized_volatility(self) -> None:
        returns = [0.01, -0.005, 0.02, -0.01]
        prices = [100.0]
        for value in returns:
            prices.append(prices[-1] * (1.0 + value))
        points = [
            (date(2024, 1, day), price)
            for day, price in enumerate(prices, start=1)
        ]
        value, count = calculate_annualized_volatility(
            points,
            lookback=4,
            min_observations=4,
        )
        expected = statistics.stdev(returns) * math.sqrt(252.0) * 100.0
        self.assertEqual(count, 4)
        self.assertAlmostEqual(value, expected, places=10)

    def test_split_adjustment_avoids_false_crash(self) -> None:
        observations = (
            DailyObservation(date(2024, 1, 1), 100.0),
            DailyObservation(date(2024, 1, 2), 102.0),
            DailyObservation(date(2024, 1, 3), 51.0, split_factor=2.0),
            DailyObservation(date(2024, 1, 4), 52.0),
        )
        points = split_adjusted_price_series(observations, date(2024, 1, 4))
        self.assertEqual([value for _, value in points], [50.0, 51.0, 51.0, 52.0])
        self.assertAlmostEqual(calculate_mdd(points), 0.0)
        volatility, _ = calculate_annualized_volatility(
            points,
            lookback=3,
            min_observations=3,
        )
        self.assertLess(volatility, 20.0)

    def test_split_adjusted_close_with_event_is_not_adjusted_twice(self) -> None:
        bundle = MarketDataBundle(
            (
                DailyObservation(date(2024, 1, 1), 50.0),
                DailyObservation(date(2024, 1, 2), 51.0),
                DailyObservation(
                    date(2024, 1, 3),
                    51.0,
                    split_factor=2.0,
                ),
                DailyObservation(date(2024, 1, 4), 52.0),
            ),
            DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
            SPLIT_ADJUSTED_CLOSE,
        )
        points = price_series(bundle, date(2024, 1, 4))
        self.assertEqual(
            [value for _, value in points],
            [50.0, 51.0, 51.0, 52.0],
        )

    def test_raw_unadjusted_close_is_adjusted_exactly_once(self) -> None:
        bundle = MarketDataBundle(
            (
                DailyObservation(date(2024, 1, 1), 100.0),
                DailyObservation(date(2024, 1, 2), 102.0),
                DailyObservation(
                    date(2024, 1, 3),
                    51.0,
                    split_factor=2.0,
                ),
            ),
            DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
            RAW_UNADJUSTED_CLOSE,
        )
        self.assertEqual(
            [value for _, value in price_series(bundle, date(2024, 1, 3))],
            [50.0, 51.0, 51.0],
        )

    def test_invalid_or_blank_price_basis_fails(self) -> None:
        for basis in ("", "ambiguous_close"):
            with self.subTest(basis=basis):
                bundle = MarketDataBundle(
                    (DailyObservation(date(2024, 1, 1), 100.0),),
                    DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
                    basis,
                )
                with self.assertRaisesRegex(
                    Exception,
                    "unsupported_or_missing_price_basis",
                ):
                    price_series(bundle, date(2024, 1, 1))

    def test_invalid_benchmark_basis_fails_under_same_contract(self) -> None:
        observations = tuple(
            DailyObservation(observed_on, value)
            for observed_on, value in _month_points(months=25)
        )
        asset = MarketDataBundle(
            observations,
            DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
            SPLIT_ADJUSTED_CLOSE,
        )
        benchmark = MarketDataBundle(
            observations,
            DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
            "",
        )
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            config = PipelineConfig(
                source_canonical_path=root / "source.csv",
                universe_path=root / "universe.csv",
                output_candidate_path=root / "candidate.csv",
                as_of_date=date(2020, 1, 1),
                rolling_cagr_window_years=(1,),
                min_rolling_windows=6,
                min_beta_observations=2,
                min_volatility_observations=2,
            )
            with self.assertRaisesRegex(
                MetricCalculationError,
                "unsupported_or_missing_price_basis",
            ):
                calculate_asset_metrics(asset, benchmark, config)

    def test_cash_dividend_is_not_reinvested_into_price_cagr(self) -> None:
        without_dividend = (
            DailyObservation(date(2023, 1, 1), 100.0),
            DailyObservation(date(2024, 1, 1), 110.0),
        )
        with_dividend = (
            DailyObservation(date(2023, 1, 1), 100.0),
            DailyObservation(date(2024, 1, 1), 110.0, dividend_cash=25.0),
        )
        plain = split_adjusted_price_series(without_dividend, date(2024, 1, 1))
        paid = split_adjusted_price_series(with_dividend, date(2024, 1, 1))
        self.assertEqual(plain, paid)
        self.assertEqual(calculate_cagr(plain), calculate_cagr(paid))

    def test_confirmed_zero_and_unavailable_dividends_are_distinct(self) -> None:
        observations = (DailyObservation(date(2024, 1, 1), 100.0),)
        confirmed_zero = MarketDataBundle(
            observations,
            DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
        )
        unavailable = MarketDataBundle(
            observations,
            DividendData(DIVIDEND_UNAVAILABLE, None),
        )
        self.assertEqual(calculate_dividend_yield(confirmed_zero, 100.0), 0.0)
        with self.assertRaisesRegex(
            MetricCalculationError,
            "dividend lookup was not confirmed",
        ):
            calculate_dividend_yield(unavailable, 100.0)

    def test_confirmed_dividend_value_uses_latest_price(self) -> None:
        bundle = MarketDataBundle(
            (DailyObservation(date(2024, 1, 1), 100.0),),
            DividendData(DIVIDEND_CONFIRMED_VALUE, 4.0),
        )
        self.assertAlmostEqual(calculate_dividend_yield(bundle, 80.0), 5.0)

    def test_as_of_date_truncates_future_prices(self) -> None:
        observations = (
            DailyObservation(date(2024, 1, 1), 100.0),
            DailyObservation(date(2024, 2, 1), 110.0),
            DailyObservation(date(2024, 3, 1), 999.0),
        )
        points = split_adjusted_price_series(observations, date(2024, 2, 15))
        self.assertEqual(points[-1], (date(2024, 2, 1), 110.0))


if __name__ == "__main__":
    unittest.main()
