from __future__ import annotations

import csv
import math
import sys
import tempfile
import types
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from tools.canonical_csv.market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    RAW_UNADJUSTED_CLOSE,
    SPLIT_ADJUSTED_CLOSE,
    CsvMarketDataProvider,
    YFinanceMarketDataProvider,
    price_series,
)
from tools.canonical_csv.metrics import (
    calculate_annualized_volatility,
    calculate_cagr,
    calculate_mdd,
)
from tools.canonical_csv.universe import UniverseAsset


def _asset() -> UniverseAsset:
    return UniverseAsset(
        market="US",
        ticker="SPLT",
        name="Split Asset",
        benchmark="US:SPY",
        active=True,
        include_in_simulator=True,
        provider_symbol="SPLT",
        market_data_provider="yfinance",
        market_data_provider_symbol="SPLT",
        benchmark_provider_symbol="SPY",
        exposure_type="broad_market",
        distribution_type="ordinary_cash_dividend",
        distribution_frequency="quarterly",
        row_data={},
    )


class _FakeIndex:
    def __init__(self, value: date):
        self._value = value

    def date(self) -> date:
        return self._value


class _FakeFrame:
    empty = False
    columns = ("Close", "Stock Splits", "Dividends", "Adj Close")

    def __contains__(self, value: str) -> bool:
        return value in self.columns

    def iterrows(self):
        rows = (
            (
                date(2020, 1, 1),
                {
                    "Close": 50.0,
                    "Stock Splits": 0.0,
                    "Dividends": 0.0,
                    "Adj Close": 40.0,
                },
            ),
            (
                date(2020, 1, 2),
                {
                    "Close": 51.0,
                    "Stock Splits": 2.0,
                    "Dividends": 1.0,
                    "Adj Close": 41.0,
                },
            ),
            (
                date(2020, 1, 3),
                {
                    "Close": 52.0,
                    "Stock Splits": 0.0,
                    "Dividends": 0.0,
                    "Adj Close": 42.0,
                },
            ),
        )
        for observed_on, row in rows:
            yield _FakeIndex(observed_on), row


class _FakeFrameWithActionOnlyRow(_FakeFrame):
    def iterrows(self):
        yield _FakeIndex(date(2020, 1, 1)), {
            "Close": 50.0,
            "Stock Splits": 0.0,
            "Dividends": 0.0,
            "Adj Close": 40.0,
        }
        yield _FakeIndex(date(2020, 1, 2)), {
            "Close": math.nan,
            "Stock Splits": 0.0,
            "Dividends": 1.25,
            "Adj Close": math.nan,
        }
        yield _FakeIndex(date(2020, 1, 3)), {
            "Close": 52.0,
            "Stock Splits": 0.0,
            "Dividends": 0.0,
            "Adj Close": 42.0,
        }


class _FakeTicker:
    history_kwargs: dict[str, object] = {}

    def __init__(self, symbol: str):
        self.symbol = symbol

    def history(self, **kwargs):
        _FakeTicker.history_kwargs = kwargs
        return _FakeFrame()


class _FakeTickerWithActionOnlyRow(_FakeTicker):
    def history(self, **kwargs):
        return _FakeFrameWithActionOnlyRow()


class MarketDataBasisTests(unittest.TestCase):
    def test_yfinance_close_is_split_adjusted_and_event_is_audit_only(self) -> None:
        fake_module = types.SimpleNamespace(Ticker=_FakeTicker)
        with patch.dict(sys.modules, {"yfinance": fake_module}):
            bundle = YFinanceMarketDataProvider().fetch_history(
                "SPLT",
                date(2020, 1, 1),
                date(2020, 1, 3),
            )
        self.assertEqual(bundle.price_basis, SPLIT_ADJUSTED_CLOSE)
        self.assertEqual(
            [value for _, value in price_series(bundle, date(2020, 1, 3))],
            [50.0, 51.0, 52.0],
        )
        self.assertEqual(bundle.observations[1].split_factor, 2.0)
        self.assertEqual(
            bundle.dividend.status,
            DIVIDEND_CONFIRMED_VALUE,
        )
        self.assertFalse(_FakeTicker.history_kwargs["auto_adjust"])
        self.assertEqual(
            _FakeTicker.history_kwargs["end"],
            "2020-01-04",
        )

    def test_yfinance_action_only_row_preserves_cash_without_nan_price(self) -> None:
        fake_module = types.SimpleNamespace(Ticker=_FakeTickerWithActionOnlyRow)
        with patch.dict(sys.modules, {"yfinance": fake_module}):
            bundle = YFinanceMarketDataProvider().fetch_history(
                "SPLT",
                date(2020, 1, 1),
                date(2020, 1, 3),
            )
        self.assertEqual(
            [value for _, value in price_series(bundle, date(2020, 1, 3))],
            [50.0, 52.0],
        )
        self.assertEqual(bundle.dividend.trailing_twelve_month_cash, 1.25)
        self.assertEqual(
            [(item.observed_on, item.cash) for item in bundle.cash_events],
            [(date(2020, 1, 2), 1.25)],
        )

    def test_csv_provider_requires_explicit_basis_and_applies_raw_once(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "market.csv"
            headers = (
                "market",
                "ticker",
                "date",
                "close",
                "splitFactor",
                "dividendCash",
                "dividendStatus",
                "priceBasis",
            )
            rows = [
                {
                    "market": "US",
                    "ticker": "SPLT",
                    "date": "2020-01-01",
                    "close": "100",
                    "splitFactor": "1",
                    "dividendCash": "0",
                    "dividendStatus": "confirmed_zero",
                    "priceBasis": RAW_UNADJUSTED_CLOSE,
                },
                {
                    "market": "US",
                    "ticker": "SPLT",
                    "date": "2020-01-02",
                    "close": "51",
                    "splitFactor": "2",
                    "dividendCash": "0",
                    "dividendStatus": "confirmed_zero",
                    "priceBasis": RAW_UNADJUSTED_CLOSE,
                },
            ]
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)
            bundle = CsvMarketDataProvider(path).load_asset(
                _asset(),
                date(2020, 1, 2),
            )
            self.assertEqual(
                [value for _, value in price_series(bundle, date(2020, 1, 2))],
                [50.0, 51.0],
            )
            rows[0]["priceBasis"] = ""
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)
            with self.assertRaisesRegex(
                Exception,
                "unsupported_or_missing_price_basis",
            ):
                CsvMarketDataProvider(path)

    def test_split_history_has_no_fake_cagr_mdd_or_volatility_shock(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "market.csv"
            headers = (
                "market",
                "ticker",
                "date",
                "close",
                "splitFactor",
                "dividendCash",
                "dividendStatus",
                "priceBasis",
            )
            raw_closes = (100.0, 102.0, 51.0, 52.0)
            rows = []
            for day, close in enumerate(raw_closes, start=1):
                rows.append(
                    {
                        "market": "US",
                        "ticker": "SPLT",
                        "date": f"2020-01-0{day}",
                        "close": close,
                        "splitFactor": "2" if day == 3 else "1",
                        "dividendCash": "0",
                        "dividendStatus": "confirmed_zero",
                        "priceBasis": RAW_UNADJUSTED_CLOSE,
                    }
                )
            with path.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=headers)
                writer.writeheader()
                writer.writerows(rows)
            points = price_series(
                CsvMarketDataProvider(path).load_asset(
                    _asset(),
                    date(2020, 1, 4),
                ),
                date(2020, 1, 4),
            )
            self.assertGreater(calculate_cagr(points), 0)
            self.assertEqual(calculate_mdd(points), 0)
            volatility, _ = calculate_annualized_volatility(
                points,
                lookback=3,
                min_observations=3,
            )
            self.assertLess(volatility, 20)


if __name__ == "__main__":
    unittest.main()
