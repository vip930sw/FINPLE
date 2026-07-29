"""Price-return-only asset metric calculations."""

from __future__ import annotations

import math
import statistics
from dataclasses import asdict, dataclass
from datetime import date

from .config import PipelineConfig
from .market_data import (
    DIVIDEND_CONFIRMED_VALUE,
    DIVIDEND_CONFIRMED_ZERO,
    MarketDataBundle,
    MarketDataError,
    SPLIT_ADJUSTED_CLOSE,
    price_series,
)


class MetricCalculationError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass(frozen=True)
class AssetMetrics:
    rawPriceCagr: float
    rollingCagrMedian: float
    rollingCagrWindowYears: int
    rollingCagrWindowCount: int
    priceHistoryStartDate: str
    usablePriceHistoryYears: float
    expectedCagr: float
    beta: float
    mdd: float
    annualizedVolatility: float
    volatilityObservationCount: int
    priceDataEndDate: str
    priceBasis: str

    def to_row(self) -> dict[str, object]:
        return asdict(self)


def _finite_positive(value: float, label: str) -> float:
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise MetricCalculationError("invalid_price", f"{label} must be positive")
    return number


def calculate_cagr(points: list[tuple[date, float]]) -> float:
    if len(points) < 2:
        raise MetricCalculationError(
            "insufficient_price_history",
            "at least two price observations are required",
        )
    start_date, start_value = points[0]
    end_date, end_value = points[-1]
    elapsed_days = (end_date - start_date).days
    if elapsed_days <= 0:
        raise MetricCalculationError(
            "insufficient_price_history",
            "price history must span more than one day",
        )
    start = _finite_positive(start_value, "start price")
    end = _finite_positive(end_value, "end price")
    years = elapsed_days / 365.2425
    return ((end / start) ** (1.0 / years) - 1.0) * 100.0


def month_end_points(points: list[tuple[date, float]]) -> list[tuple[date, float]]:
    by_month: dict[tuple[int, int], tuple[date, float]] = {}
    for observed_on, value in points:
        by_month[(observed_on.year, observed_on.month)] = (observed_on, value)
    return [by_month[key] for key in sorted(by_month)]


def rolling_cagr_values(
    monthly_points: list[tuple[date, float]],
    window_years: int,
) -> list[float]:
    by_ordinal = {
        observed_on.year * 12 + observed_on.month: (observed_on, value)
        for observed_on, value in monthly_points
    }
    window_months = int(window_years) * 12
    values: list[float] = []
    for end_ordinal in sorted(by_ordinal):
        start = by_ordinal.get(end_ordinal - window_months)
        if start is None:
            continue
        end = by_ordinal[end_ordinal]
        try:
            values.append(calculate_cagr([start, end]))
        except MetricCalculationError:
            continue
    return values


def select_rolling_cagr(
    monthly_points: list[tuple[date, float]],
    window_years: tuple[int, ...],
    min_windows: int,
) -> tuple[float, int, int]:
    for years in window_years:
        values = rolling_cagr_values(monthly_points, years)
        if len(values) >= min_windows:
            return statistics.median(values), years, len(values)
    raise MetricCalculationError(
        "insufficient_rolling_history",
        f"no rolling CAGR window has at least {min_windows} observations",
    )


def calculate_mdd(points: list[tuple[date, float]]) -> float:
    if len(points) < 2:
        raise MetricCalculationError(
            "insufficient_price_history",
            "MDD requires at least two observations",
        )
    peak = -math.inf
    mdd = 0.0
    for _, value in points:
        price = _finite_positive(value, "price")
        peak = max(peak, price)
        mdd = min(mdd, price / peak - 1.0)
    return mdd * 100.0


def _aligned_returns(
    asset_points: list[tuple[date, float]],
    benchmark_points: list[tuple[date, float]],
    lookback: int,
) -> tuple[list[float], list[float]]:
    asset_by_date = dict(asset_points)
    benchmark_by_date = dict(benchmark_points)
    common_dates = sorted(set(asset_by_date).intersection(benchmark_by_date))
    if len(common_dates) < 2:
        return [], []
    common_dates = common_dates[-(lookback + 1) :]
    asset_returns: list[float] = []
    benchmark_returns: list[float] = []
    for previous, current in zip(common_dates, common_dates[1:]):
        asset_returns.append(asset_by_date[current] / asset_by_date[previous] - 1.0)
        benchmark_returns.append(
            benchmark_by_date[current] / benchmark_by_date[previous] - 1.0
        )
    return asset_returns, benchmark_returns


def calculate_beta(
    asset_points: list[tuple[date, float]],
    benchmark_points: list[tuple[date, float]],
    *,
    lookback: int,
    min_observations: int,
) -> float:
    asset_returns, benchmark_returns = _aligned_returns(
        asset_points,
        benchmark_points,
        lookback,
    )
    count = len(asset_returns)
    if count < min_observations:
        raise MetricCalculationError(
            "insufficient_beta_observations",
            f"beta requires {min_observations} common returns, got {count}",
        )
    benchmark_mean = statistics.fmean(benchmark_returns)
    asset_mean = statistics.fmean(asset_returns)
    variance = sum(
        (value - benchmark_mean) ** 2 for value in benchmark_returns
    ) / (count - 1)
    if not math.isfinite(variance) or variance == 0:
        raise MetricCalculationError(
            "zero_benchmark_variance",
            "benchmark return variance is zero",
        )
    covariance = sum(
        (asset_value - asset_mean) * (benchmark_value - benchmark_mean)
        for asset_value, benchmark_value in zip(asset_returns, benchmark_returns)
    ) / (count - 1)
    return covariance / variance


def calculate_annualized_volatility(
    points: list[tuple[date, float]],
    *,
    lookback: int,
    min_observations: int,
) -> tuple[float, int]:
    selected = points[-(lookback + 1) :]
    returns = [
        current[1] / previous[1] - 1.0
        for previous, current in zip(selected, selected[1:])
    ]
    if len(returns) < min_observations:
        raise MetricCalculationError(
            "insufficient_volatility_observations",
            f"volatility requires {min_observations} returns, got {len(returns)}",
        )
    return statistics.stdev(returns) * math.sqrt(252.0) * 100.0, len(returns)


def calculate_cash_yield(
    bundle: MarketDataBundle,
    latest_price: float,
) -> float:
    if bundle.dividend.status == DIVIDEND_CONFIRMED_ZERO:
        return 0.0
    if bundle.dividend.status != DIVIDEND_CONFIRMED_VALUE:
        raise MetricCalculationError(
            "dividend_data_unavailable",
            "dividend lookup was not confirmed",
        )
    cash = bundle.dividend.trailing_twelve_month_cash
    if cash is None or not math.isfinite(float(cash)) or float(cash) < 0:
        raise MetricCalculationError(
            "invalid_dividend_data",
            "confirmed dividend cash must be finite and non-negative",
        )
    return float(cash) / _finite_positive(latest_price, "latest price") * 100.0


# Compatibility name for callers that explicitly use ordinary dividends.
calculate_dividend_yield = calculate_cash_yield


def calculate_asset_metrics(
    asset_bundle: MarketDataBundle,
    benchmark_bundle: MarketDataBundle,
    config: PipelineConfig,
) -> AssetMetrics:
    try:
        asset_points = price_series(asset_bundle, config.as_of_date)
        benchmark_points = price_series(benchmark_bundle, config.as_of_date)
    except MarketDataError as error:
        raise MetricCalculationError("market_data_invalid", str(error)) from error
    raw_cagr = calculate_cagr(asset_points)
    rolling_median, rolling_years, rolling_count = select_rolling_cagr(
        month_end_points(asset_points),
        config.rolling_cagr_window_years,
        config.min_rolling_windows,
    )
    beta = calculate_beta(
        asset_points,
        benchmark_points,
        lookback=config.beta_lookback_observations,
        min_observations=config.min_beta_observations,
    )
    volatility, volatility_count = calculate_annualized_volatility(
        asset_points,
        lookback=config.volatility_lookback_observations,
        min_observations=config.min_volatility_observations,
    )
    return AssetMetrics(
        rawPriceCagr=round(raw_cagr, 8),
        rollingCagrMedian=round(rolling_median, 8),
        rollingCagrWindowYears=rolling_years,
        rollingCagrWindowCount=rolling_count,
        priceHistoryStartDate=asset_points[0][0].isoformat(),
        usablePriceHistoryYears=round(
            (asset_points[-1][0] - asset_points[0][0]).days / 365.2425,
            8,
        ),
        expectedCagr=round(rolling_median, 8),
        beta=round(beta, 8),
        mdd=round(calculate_mdd(asset_points), 8),
        annualizedVolatility=round(volatility, 8),
        volatilityObservationCount=volatility_count,
        priceDataEndDate=asset_points[-1][0].isoformat(),
        priceBasis=SPLIT_ADJUSTED_CLOSE,
    )
