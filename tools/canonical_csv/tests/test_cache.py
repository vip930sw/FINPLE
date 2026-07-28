from __future__ import annotations

import tempfile
import unittest
from datetime import date
from pathlib import Path

from tools.canonical_csv.cache import PersistentCachedMarketDataProvider
from tools.canonical_csv.market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    DIVIDEND_CONFIRMED_ZERO,
    SPLIT_ADJUSTED_CLOSE,
    CashDistributionEvent,
    DailyObservation,
    DividendData,
    MarketDataBundle,
    MarketDataError,
)
from tools.canonical_csv.universe import UniverseAsset


def _bundle(*days: int) -> MarketDataBundle:
    return MarketDataBundle(
        tuple(
            DailyObservation(
                date(2024, 1, day),
                100.0 + day,
            )
            for day in days
        ),
        DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
        SPLIT_ADJUSTED_CLOSE,
    )


def _asset(ticker: str, benchmark_symbol: str = "SPY") -> UniverseAsset:
    return UniverseAsset(
        market="US",
        ticker=ticker,
        name=ticker,
        benchmark="US:SPY",
        active=True,
        include_in_simulator=True,
        provider_symbol=ticker,
        benchmark_provider_symbol=benchmark_symbol,
        exposure_type="broad_market",
        distribution_type="ordinary_cash_dividend",
        distribution_frequency="quarterly",
        row_data={},
    )


class FakeFetcher:
    def __init__(self):
        self.requests: list[tuple[str, date, date]] = []
        self.responses: dict[str, MarketDataBundle] = {}
        self.failures_remaining = 0

    def fetch_history(
        self,
        symbol: str,
        start_date: date,
        as_of_date: date,
    ) -> MarketDataBundle:
        self.requests.append((symbol, start_date, as_of_date))
        if self.failures_remaining:
            self.failures_remaining -= 1
            raise MarketDataError("temporary_provider_failure")
        return self.responses[symbol]


class PersistentCacheTests(unittest.TestCase):
    def test_only_dates_after_cached_tail_are_requested(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            first_fetcher = FakeFetcher()
            first_fetcher.responses["QQQ"] = _bundle(1, 2)
            first = PersistentCachedMarketDataProvider(
                first_fetcher,
                root,
                history_start=date(2024, 1, 1),
                retry_count=0,
            )
            first.load_asset(_asset("QQQ"), date(2024, 1, 2))

            second_fetcher = FakeFetcher()
            second_fetcher.responses["QQQ"] = _bundle(2, 3, 4)
            second = PersistentCachedMarketDataProvider(
                second_fetcher,
                root,
                history_start=date(2024, 1, 1),
                retry_count=0,
            )
            bundle = second.load_asset(_asset("QQQ"), date(2024, 1, 4))
            self.assertEqual(
                second_fetcher.requests,
                [("QQQ", date(2024, 1, 3), date(2024, 1, 4))],
            )
            self.assertEqual(
                [item.observed_on.day for item in bundle.observations],
                [1, 2, 3, 4],
            )

    def test_as_of_cutoff_removes_future_cache_rows(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            fetcher = FakeFetcher()
            fetcher.responses["QQQ"] = _bundle(1, 2, 10)
            provider = PersistentCachedMarketDataProvider(
                fetcher,
                temporary,
                history_start=date(2024, 1, 1),
                retry_count=0,
            )
            bundle = provider.load_asset(_asset("QQQ"), date(2024, 1, 2))
            self.assertEqual(
                [item.observed_on.day for item in bundle.observations],
                [1, 2],
            )

    def test_benchmark_cache_is_shared_between_assets(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            fetcher = FakeFetcher()
            fetcher.responses["SPY"] = _bundle(1, 2)
            provider = PersistentCachedMarketDataProvider(
                fetcher,
                temporary,
                history_start=date(2024, 1, 1),
                retry_count=0,
            )
            provider.load_benchmark(_asset("QQQ"), date(2024, 1, 2))
            provider.load_benchmark(_asset("AAPL"), date(2024, 1, 2))
            self.assertEqual(
                [request[0] for request in fetcher.requests],
                ["SPY"],
            )

    def test_retry_uses_exponential_backoff(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            fetcher = FakeFetcher()
            fetcher.responses["QQQ"] = _bundle(1, 2)
            fetcher.failures_remaining = 2
            sleeps: list[float] = []
            provider = PersistentCachedMarketDataProvider(
                fetcher,
                temporary,
                history_start=date(2024, 1, 1),
                retry_count=2,
                retry_backoff_seconds=3,
                sleep_fn=sleeps.append,
            )
            provider.load_asset(_asset("QQQ"), date(2024, 1, 2))
            self.assertEqual(len(fetcher.requests), 3)
            self.assertEqual(sleeps, [3, 6])

    def test_retry_exhaustion_is_explicit(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            fetcher = FakeFetcher()
            fetcher.responses["QQQ"] = _bundle(1)
            fetcher.failures_remaining = 5
            provider = PersistentCachedMarketDataProvider(
                fetcher,
                temporary,
                history_start=date(2024, 1, 1),
                retry_count=1,
                retry_backoff_seconds=0,
                sleep_fn=lambda _: None,
            )
            with self.assertRaisesRegex(
                MarketDataError,
                "provider_retry_exhausted:QQQ",
            ):
                provider.load_asset(_asset("QQQ"), date(2024, 1, 2))

    def test_action_only_cash_event_survives_cache_round_trip(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            fetcher = FakeFetcher()
            fetcher.responses["QQQ"] = MarketDataBundle(
                _bundle(1, 3).observations,
                DividendData(DIVIDEND_CONFIRMED_VALUE, 1.25),
                SPLIT_ADJUSTED_CLOSE,
                (CashDistributionEvent(date(2024, 1, 2), 1.25),),
            )
            first = PersistentCachedMarketDataProvider(
                fetcher,
                temporary,
                history_start=date(2024, 1, 1),
                retry_count=0,
            )
            first.load_asset(_asset("QQQ"), date(2024, 1, 3))

            second = PersistentCachedMarketDataProvider(
                FakeFetcher(),
                temporary,
                history_start=date(2024, 1, 1),
                retry_count=0,
            )
            bundle = second.load_asset(_asset("QQQ"), date(2024, 1, 3))
            self.assertEqual(
                bundle.dividend.trailing_twelve_month_cash,
                1.25,
            )
            self.assertEqual(
                [(item.observed_on, item.cash) for item in bundle.cash_events],
                [(date(2024, 1, 2), 1.25)],
            )


if __name__ == "__main__":
    unittest.main()
