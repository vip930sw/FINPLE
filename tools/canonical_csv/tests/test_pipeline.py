from __future__ import annotations

import csv
import json
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from tools.canonical_csv.build import build_canonical_candidate
from tools.canonical_csv.config import PipelineConfig
from tools.canonical_csv.market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    DIVIDEND_CONFIRMED_ZERO,
    CsvMarketDataProvider,
    DailyObservation,
    DividendData,
    InMemoryMarketDataProvider,
    MarketDataBundle,
)
from tools.canonical_csv.universe import UniverseError, load_universe
from tools.canonical_csv.validate import (
    REQUIRED_CANDIDATE_COLUMNS,
    validate_candidate_rows,
)


UNIVERSE_HEADERS = (
    "market",
    "ticker",
    "name",
    "benchmark",
    "active",
    "includeInSimulator",
)


def _write_universe(path: Path, rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=UNIVERSE_HEADERS)
        writer.writeheader()
        writer.writerows(rows)


def _asset_row(
    ticker: str,
    *,
    market: str = "US",
    benchmark: str = "US:SPY",
    active: str = "true",
    include: str = "true",
) -> dict[str, str]:
    return {
        "market": market,
        "ticker": ticker,
        "name": ticker,
        "benchmark": benchmark,
        "active": active,
        "includeInSimulator": include,
    }


def _bundle(growth: float) -> MarketDataBundle:
    observations: list[DailyObservation] = []
    for offset in range(25):
        year = 2022 + offset // 12
        month = offset % 12 + 1
        observations.append(
            DailyObservation(
                date(year, month, 1),
                100.0 * (1.0 + growth) ** (offset / 12.0),
            )
        )
    return MarketDataBundle(
        tuple(observations),
        DividendData(DIVIDEND_CONFIRMED_ZERO, 0.0),
    )


def _config(universe: Path, candidate: Path) -> PipelineConfig:
    return PipelineConfig(
        universe_path=universe,
        output_candidate_path=candidate,
        as_of_date=date(2024, 1, 1),
        rolling_cagr_window_years=(1,),
        min_rolling_windows=6,
        beta_lookback_observations=24,
        min_beta_observations=2,
        volatility_lookback_observations=24,
        min_volatility_observations=2,
    )


class UniverseTests(unittest.TestCase):
    def test_korean_leading_zero_is_preserved(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "universe.csv"
            _write_universe(
                path,
                [_asset_row("069500", market="KR", benchmark="KR:069500")],
            )
            asset = load_universe(path)[0]
            self.assertEqual(asset.ticker, "069500")
            self.assertEqual(asset.identity, "KR:069500")

    def test_new_universe_row_is_included_in_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            universe = root / "universe.csv"
            candidate = root / "candidate.csv"
            _write_universe(
                universe,
                [_asset_row("SPY"), _asset_row("QQQ")],
            )
            provider = InMemoryMarketDataProvider(
                {"US:SPY": _bundle(0.08), "US:QQQ": _bundle(0.12)}
            )
            result = build_canonical_candidate(
                _config(universe, candidate),
                provider,
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertTrue(result.validation["valid"])
            self.assertEqual({row["ticker"] for row in rows}, {"SPY", "QQQ"})

    def test_inactive_universe_row_is_excluded(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            universe = root / "universe.csv"
            candidate = root / "candidate.csv"
            _write_universe(
                universe,
                [
                    _asset_row("SPY"),
                    _asset_row("OLD", active="false"),
                ],
            )
            result = build_canonical_candidate(
                _config(universe, candidate),
                InMemoryMarketDataProvider({"US:SPY": _bundle(0.08)}),
            )
            with candidate.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual([row["ticker"] for row in rows], ["SPY"])
            self.assertEqual(result.summary["excludedRowCount"], 1)
            self.assertEqual(result.summary["newAssetCount"], 1)

    def test_duplicate_market_ticker_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "universe.csv"
            _write_universe(path, [_asset_row("SPY"), _asset_row("SPY")])
            with self.assertRaisesRegex(
                UniverseError,
                "duplicate market\\+ticker US:SPY",
            ):
                load_universe(path)


class ValidationTests(unittest.TestCase):
    def _universe_asset(self, root: Path):
        path = root / "universe.csv"
        _write_universe(path, [_asset_row("SPY")])
        return load_universe(path)[0]

    def _ready_row(self) -> dict[str, object]:
        row: dict[str, object] = {
            column: "" for column in REQUIRED_CANDIDATE_COLUMNS
        }
        row.update(
            {
                "market": "US",
                "ticker": "SPY",
                "name": "SPY",
                "benchmark": "US:SPY",
                "active": "true",
                "includeInSimulator": "true",
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
                "dividendYield": "2",
                "priceDataEndDate": "2024-01-01",
                "priceBasis": "split_adjusted_close_ex_dividends",
            }
        )
        return row

    def test_blank_and_nan_metrics_fail_validation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            asset = self._universe_asset(root)
            row = self._ready_row()
            row["expectedCagr"] = ""
            row["mdd"] = "NaN"
            report = validate_candidate_rows(
                [row],
                headers=list(REQUIRED_CANDIDATE_COLUMNS),
                universe=[asset],
                as_of_date=date(2024, 1, 1),
            )
            codes = {issue["code"] for issue in report["issues"]}
            self.assertFalse(report["valid"])
            self.assertIn("required_metric_not_finite", codes)
            self.assertIn("numeric_value_invalid", codes)

    def test_total_return_field_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            asset = self._universe_asset(root)
            row = self._ready_row()
            row["TR"] = "123"
            report = validate_candidate_rows(
                [row],
                headers=[*REQUIRED_CANDIDATE_COLUMNS, "TR"],
                universe=[asset],
                as_of_date=date(2024, 1, 1),
            )
            self.assertFalse(report["valid"])
            self.assertIn(
                "total_return_columns_prohibited",
                {issue["code"] for issue in report["issues"]},
            )

    def test_validation_failure_preserves_existing_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            universe = root / "universe.csv"
            candidate = root / "candidate.csv"
            _write_universe(universe, [_asset_row("SPY")])
            candidate.write_bytes(b"existing-candidate\n")
            config = _config(universe, candidate)
            invalid_report = {
                "valid": False,
                "issueCount": 1,
                "issues": [
                    {"code": "fixture_failure", "message": "forced failure"}
                ],
            }
            with patch(
                "tools.canonical_csv.build.validate_candidate_file",
                return_value=invalid_report,
            ):
                with self.assertRaisesRegex(
                    ValueError,
                    "existing candidate was preserved",
                ):
                    build_canonical_candidate(
                        config,
                        InMemoryMarketDataProvider(
                            {"US:SPY": _bundle(0.08)}
                        ),
                    )
            self.assertEqual(candidate.read_bytes(), b"existing-candidate\n")
            validation_path = candidate.with_suffix(".validation.json")
            self.assertEqual(
                json.loads(validation_path.read_text(encoding="utf-8"))[
                    "issues"
                ][0]["code"],
                "fixture_failure",
            )


class CsvProviderTests(unittest.TestCase):
    def test_future_price_and_dividend_are_excluded_by_as_of_date(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            universe_path = root / "universe.csv"
            market_data_path = root / "market-data.csv"
            _write_universe(universe_path, [_asset_row("SPY")])
            with market_data_path.open(
                "w",
                encoding="utf-8",
                newline="",
            ) as handle:
                writer = csv.DictWriter(
                    handle,
                    fieldnames=(
                        "market",
                        "ticker",
                        "date",
                        "close",
                        "splitFactor",
                        "dividendCash",
                        "dividendStatus",
                    ),
                )
                writer.writeheader()
                writer.writerows(
                    [
                        {
                            "market": "US",
                            "ticker": "SPY",
                            "date": "2024-01-01",
                            "close": "100",
                            "splitFactor": "1",
                            "dividendCash": "2",
                            "dividendStatus": DIVIDEND_CONFIRMED_VALUE,
                        },
                        {
                            "market": "US",
                            "ticker": "SPY",
                            "date": "2024-02-01",
                            "close": "110",
                            "splitFactor": "1",
                            "dividendCash": "50",
                            "dividendStatus": DIVIDEND_CONFIRMED_VALUE,
                        },
                    ]
                )
            asset = load_universe(universe_path)[0]
            bundle = CsvMarketDataProvider(market_data_path).load_asset(
                asset,
                date(2024, 1, 15),
            )
            self.assertEqual(len(bundle.observations), 1)
            self.assertEqual(bundle.observations[0].raw_close, 100.0)
            self.assertEqual(bundle.dividend.trailing_twelve_month_cash, 2.0)


if __name__ == "__main__":
    unittest.main()
