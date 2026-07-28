"""Configuration for the FINPLE canonical CSV metrics pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path


DEFAULT_ROLLING_CAGR_WINDOW_YEARS = (10, 7, 5, 3, 1)


@dataclass(frozen=True)
class PipelineConfig:
    universe_path: Path
    output_candidate_path: Path
    as_of_date: date | None = None
    validation_report_path: Path | None = None
    failed_assets_path: Path | None = None
    run_summary_path: Path | None = None
    rolling_cagr_window_years: tuple[int, ...] = DEFAULT_ROLLING_CAGR_WINDOW_YEARS
    min_rolling_windows: int = 6
    beta_lookback_observations: int = 1_260
    min_beta_observations: int = 120
    volatility_lookback_observations: int = 2_520
    min_volatility_observations: int = 20

    def __post_init__(self) -> None:
        windows = tuple(int(value) for value in self.rolling_cagr_window_years)
        if not windows or any(value <= 0 for value in windows):
            raise ValueError("rolling_cagr_window_years must contain positive years")
        if len(set(windows)) != len(windows):
            raise ValueError("rolling_cagr_window_years must not contain duplicates")
        object.__setattr__(self, "rolling_cagr_window_years", tuple(sorted(windows, reverse=True)))
        for field_name in (
            "min_rolling_windows",
            "beta_lookback_observations",
            "min_beta_observations",
            "volatility_lookback_observations",
            "min_volatility_observations",
        ):
            if int(getattr(self, field_name)) <= 0:
                raise ValueError(f"{field_name} must be positive")

    @property
    def effective_as_of_date(self) -> date:
        return self.as_of_date or date.today()

    @property
    def resolved_validation_report_path(self) -> Path:
        return self.validation_report_path or self.output_candidate_path.with_suffix(
            ".validation.json"
        )

    @property
    def resolved_failed_assets_path(self) -> Path:
        return self.failed_assets_path or self.output_candidate_path.with_name(
            f"{self.output_candidate_path.stem}.failed.csv"
        )

    @property
    def resolved_run_summary_path(self) -> Path:
        return self.run_summary_path or self.output_candidate_path.with_name(
            f"{self.output_candidate_path.stem}.summary.json"
        )

    @classmethod
    def from_strings(
        cls,
        *,
        universe_path: str,
        output_candidate_path: str,
        as_of_date: str | None = None,
        **kwargs: object,
    ) -> "PipelineConfig":
        parsed_as_of = date.fromisoformat(as_of_date) if as_of_date else None
        return cls(
            universe_path=Path(universe_path),
            output_candidate_path=Path(output_candidate_path),
            as_of_date=parsed_as_of,
            **kwargs,
        )
