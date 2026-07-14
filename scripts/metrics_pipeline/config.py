from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Mapping


PIPELINE_VERSION = "metrics-v3.0-step114-2b"
SCHEMA_VERSION = "metrics-csv-schema-v3"
CALCULATION_POLICY_VERSION = "metrics-calculation-policy-2026-06-26"


@dataclass(frozen=True)
class PipelineConfig:
    metric_base_date: str
    market_scope: tuple[str, ...]
    selected_cagr_policy: str
    current_price_display: bool
    total_return_cagr_mode: str
    output_version: str
    input_mode: str
    input_dir: Path
    output_dir: Path
    deterministic_fixture: bool = True
    random_seed: int = 1142
    min_years_for_10y: float = 9.5
    min_years_for_5y: float = 4.5
    min_years_for_inception: float = 3.0
    candidate_file: str = "candidates.csv"
    benchmark_map_file: str = "benchmark_map.csv"
    monthly_prices_file: str = "monthly_prices.csv"
    raw_daily_prices_file: str = "raw_daily_prices.csv"

    @property
    def created_at(self) -> str:
        return f"{self.metric_base_date}T00:00:00+09:00"


def load_config(config: Mapping[str, Any]) -> PipelineConfig:
    required = {
        "metric_base_date",
        "market_scope",
        "selected_cagr_policy",
        "current_price_display",
        "total_return_cagr_mode",
        "output_version",
        "input_mode",
        "input_dir",
        "output_dir",
    }
    missing = sorted(required.difference(config))
    if missing:
        raise ValueError(f"CONFIG missing required keys: {', '.join(missing)}")

    market_scope = tuple(str(market).upper() for market in config["market_scope"])
    return PipelineConfig(
        metric_base_date=str(config["metric_base_date"]),
        market_scope=market_scope,
        selected_cagr_policy=str(config["selected_cagr_policy"]),
        current_price_display=bool(config["current_price_display"]),
        total_return_cagr_mode=str(config["total_return_cagr_mode"]),
        output_version=str(config["output_version"]),
        input_mode=str(config["input_mode"]),
        input_dir=Path(config["input_dir"]),
        output_dir=Path(config["output_dir"]),
        deterministic_fixture=bool(config.get("deterministic_fixture", True)),
        random_seed=int(config.get("random_seed", 1142)),
        min_years_for_10y=float(config.get("min_years_for_10y", 9.5)),
        min_years_for_5y=float(config.get("min_years_for_5y", 4.5)),
        min_years_for_inception=float(config.get("min_years_for_inception", 3.0)),
        candidate_file=str(config.get("candidate_file", "candidates.csv")),
        benchmark_map_file=str(config.get("benchmark_map_file", "benchmark_map.csv")),
        monthly_prices_file=str(config.get("monthly_prices_file", "monthly_prices.csv")),
        raw_daily_prices_file=str(config.get("raw_daily_prices_file", "raw_daily_prices.csv")),
    )


def validate_config(config: PipelineConfig) -> list[str]:
    errors: list[str] = []
    if config.selected_cagr_policy != "rolling_median_all_markets":
        errors.append("selected_cagr_policy must be rolling_median_all_markets")
    if config.current_price_display is not False:
        errors.append("current_price_display must be false")
    if config.total_return_cagr_mode != "reference_only":
        errors.append("total_return_cagr_mode must be reference_only")
    if config.input_mode != "fixture":
        errors.append("Step 114-2B only supports input_mode=fixture")
    for market in config.market_scope:
        if market not in {"US", "KR"}:
            errors.append(f"Unsupported market in Step 114-2B fixture mode: {market}")
    return errors
