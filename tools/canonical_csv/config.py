"""Configuration for the FINPLE canonical CSV metrics pipeline."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path


DEFAULT_ROLLING_CAGR_WINDOW_YEARS = (10, 7, 5, 3, 1)


@dataclass(frozen=True)
class PipelineConfig:
    source_canonical_path: Path
    universe_path: Path
    output_candidate_path: Path
    as_of_date: date
    validation_report_path: Path | None = None
    failed_assets_path: Path | None = None
    run_summary_path: Path | None = None
    cache_dir: Path = Path(".canonical_csv_cache")
    checkpoint_path: Path | None = None
    failed_identities_path: Path | None = None
    chunk_size: int = 100
    resume: bool = True
    retry_count: int = 3
    retry_backoff_seconds: float = 5.0
    write_non_publishable_candidate: bool = False
    rolling_cagr_window_years: tuple[int, ...] = DEFAULT_ROLLING_CAGR_WINDOW_YEARS
    min_rolling_windows: int = 6
    beta_lookback_observations: int = 1_260
    min_beta_observations: int = 120
    volatility_lookback_observations: int = 2_520
    min_volatility_observations: int = 20

    def __post_init__(self) -> None:
        if not isinstance(self.as_of_date, date):
            raise ValueError("as_of_date must be an explicit date")
        windows = tuple(int(value) for value in self.rolling_cagr_window_years)
        if not windows or any(value <= 0 for value in windows):
            raise ValueError("rolling_cagr_window_years must contain positive years")
        if len(set(windows)) != len(windows):
            raise ValueError("rolling_cagr_window_years must not contain duplicates")
        object.__setattr__(self, "rolling_cagr_window_years", tuple(sorted(windows, reverse=True)))
        for field_name in (
            "chunk_size",
            "min_rolling_windows",
            "beta_lookback_observations",
            "min_beta_observations",
            "volatility_lookback_observations",
            "min_volatility_observations",
        ):
            if int(getattr(self, field_name)) <= 0:
                raise ValueError(f"{field_name} must be positive")
        if self.retry_count < 0:
            raise ValueError("retry_count must be zero or greater")
        if self.retry_backoff_seconds < 0:
            raise ValueError("retry_backoff_seconds must be zero or greater")
        if self.source_canonical_path.resolve() == self.output_candidate_path.resolve():
            raise ValueError(
                "output_candidate_path must not overwrite source_canonical_path"
            )

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

    @property
    def resolved_checkpoint_path(self) -> Path:
        return self.checkpoint_path or self.output_candidate_path.with_name(
            f"{self.output_candidate_path.stem}.checkpoint.json"
        )

    @classmethod
    def from_strings(
        cls,
        *,
        source_canonical_path: str,
        universe_path: str,
        output_candidate_path: str,
        as_of_date: str,
        **kwargs: object,
    ) -> "PipelineConfig":
        if not as_of_date:
            raise ValueError("as_of_date must be an explicit YYYY-MM-DD")
        return cls(
            source_canonical_path=Path(source_canonical_path),
            universe_path=Path(universe_path),
            output_candidate_path=Path(output_candidate_path),
            as_of_date=date.fromisoformat(as_of_date),
            **kwargs,
        )
