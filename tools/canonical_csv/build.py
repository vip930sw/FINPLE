"""Build, validate, and atomically publish a full-schema candidate CSV."""

from __future__ import annotations

import argparse
import csv
import json
import os
import tempfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from .cache import PersistentCachedMarketDataProvider
from .canonical import (
    CanonicalSource,
    candidate_headers,
    load_canonical_source,
    row_identity,
)
from .config import PipelineConfig
from .market_data import (
    CsvMarketDataProvider,
    MarketDataError,
    MarketDataProvider,
    YFinanceMarketDataProvider,
    price_series,
)
from .metrics import (
    MetricCalculationError,
    calculate_asset_metrics,
    calculate_cash_yield,
)
from .universe import UniverseAsset, load_universe
from .validate import (
    NON_ORDINARY_EXPOSURE_TYPES,
    ORDINARY_DISTRIBUTION_TYPES,
    validate_candidate_file,
)


@dataclass(frozen=True)
class BuildResult:
    candidate_path: Path
    validation_report_path: Path
    failed_assets_path: Path
    run_summary_path: Path
    validation: dict[str, object]
    summary: dict[str, object]


MINIMUM_PORTFOLIO_HISTORY_YEARS = 3
ELIGIBILITY_POLICY_VERSION = "portfolio-eligibility-v1"
SPECIAL_DISTRIBUTION_TYPE = "special_or_liquidating_distribution"
REPEATED_DISTRIBUTION_TYPES = frozenset(
    {"mixed_distribution", "futures_mixed_distribution"}
)


def _parse_bool(value: object, default: bool = False) -> bool:
    normalized = str(value or "").strip().lower()
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return default


def _is_non_ordinary(
    asset: UniverseAsset,
    source_row: dict[str, str] | None,
) -> bool:
    source_row = source_row or {}
    exposure_type = (
        asset.exposure_type
        if asset.exposure_type
        else str(source_row.get("exposureType") or "").strip().lower()
    )
    distribution_type = asset.distribution_type
    if distribution_type in {"", "unknown"}:
        distribution_type = (
            str(source_row.get("distributionType") or "")
            .strip()
            .lower()
        )
    return (
        exposure_type in NON_ORDINARY_EXPOSURE_TYPES
        or distribution_type not in ORDINARY_DISTRIBUTION_TYPES
    )


def _atomic_json(path: Path, value: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w",
        encoding="utf-8",
        delete=False,
        dir=path.parent,
        prefix=f".{path.name}-",
        suffix=".tmp",
    ) as handle:
        temporary = Path(handle.name)
        json.dump(
            value,
            handle,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        handle.write("\n")
    os.replace(temporary, path)


def _write_csv(
    path: Path,
    rows: list[dict[str, object]],
    fieldnames: tuple[str, ...] | list[str],
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=fieldnames,
            extrasaction="ignore",
        )
        writer.writeheader()
        writer.writerows(rows)


def _execution_contract(config: PipelineConfig) -> dict[str, object]:
    return {
        "eligibilityPolicyVersion": ELIGIBILITY_POLICY_VERSION,
        "minimumPortfolioHistoryYears": MINIMUM_PORTFOLIO_HISTORY_YEARS,
        "rollingCagrWindowYears": list(
            config.rolling_cagr_window_years
        ),
        "minRollingWindows": config.min_rolling_windows,
        "betaLookbackObservations": config.beta_lookback_observations,
        "minBetaObservations": config.min_beta_observations,
        "volatilityLookbackObservations": (
            config.volatility_lookback_observations
        ),
        "minVolatilityObservations": (
            config.min_volatility_observations
        ),
    }


def _asset_contract(asset: UniverseAsset) -> dict[str, object]:
    return {
        "providerSymbol": asset.provider_symbol,
        "marketDataProvider": asset.market_data_provider,
        "marketDataProviderSymbol": asset.market_data_provider_symbol,
        "benchmark": asset.benchmark,
        "benchmarkProviderSymbol": asset.benchmark_provider_symbol,
        "active": asset.active,
        "includeInSimulator": asset.include_in_simulator,
        "exposureType": asset.exposure_type,
        "distributionType": asset.distribution_type,
        "distributionFrequency": asset.distribution_frequency,
        "firstListedDate": asset.row_data.get("firstListedDate", ""),
        "direction": asset.row_data.get("direction", ""),
        "leverageMultiple": asset.row_data.get("leverageMultiple", ""),
        "resetFrequency": asset.row_data.get("resetFrequency", ""),
        "distributionDataQualityStatus": asset.row_data.get(
            "distributionDataQualityStatus",
            "",
        ),
    }


def _add_years(value: date, years: int) -> date:
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        return value.replace(month=2, day=28, year=value.year + years)


def _parsed_date(value: object) -> date | None:
    try:
        return date.fromisoformat(str(value or "").strip())
    except ValueError:
        return None


def _leveraged_warning_codes(asset: UniverseAsset) -> list[str]:
    exposure = asset.exposure_type
    direction = asset.row_data.get("direction", "").strip().lower()
    reset_frequency = asset.row_data.get(
        "resetFrequency",
        "",
    ).strip().lower()
    try:
        leverage = abs(float(asset.row_data.get("leverageMultiple", "")))
    except ValueError:
        leverage = 0
    codes: list[str] = []
    if "leveraged" in exposure or leverage >= 2:
        codes.append("leveraged_exposure")
    if "inverse" in exposure or direction == "inverse":
        codes.append("inverse_exposure")
    if codes and reset_frequency == "daily":
        codes.append("daily_reset")
    return codes


def _apply_portfolio_policy(
    update: dict[str, object],
    asset: UniverseAsset,
    config: PipelineConfig,
) -> None:
    update["minimumPortfolioHistoryYears"] = MINIMUM_PORTFOLIO_HISTORY_YEARS
    warning_codes = _leveraged_warning_codes(asset)
    update["portfolioWarningCodes"] = "|".join(warning_codes)
    if not asset.active:
        status = "inactive"
        policy = "deny"
    elif not asset.include_in_simulator:
        status = "excluded_by_operator"
        policy = "deny"
    elif update.get("priceMetricsStatus") != "ready":
        status = "provider_data_unavailable"
        policy = "deny"
    else:
        usable_years = float(update.get("usablePriceHistoryYears") or 0)
        rolling_years = float(update.get("rollingCagrWindowYears") or 0)
        if (
            usable_years < MINIMUM_PORTFOLIO_HISTORY_YEARS
            or rolling_years < MINIMUM_PORTFOLIO_HISTORY_YEARS
        ):
            status = "insufficient_long_horizon_history"
            policy = "deny"
        elif warning_codes:
            status = "eligible"
            policy = "confirm"
        else:
            status = "eligible"
            policy = "allow"
    eligible = status == "eligible"
    update["portfolioEligible"] = "true" if eligible else "false"
    update["portfolioEligibilityStatus"] = status
    update["portfolioEligibilityReason"] = "" if eligible else status
    update["portfolioAddPolicy"] = policy
    usable_years = float(update.get("usablePriceHistoryYears") or 0)
    update["cagrConfidence"] = (
        "low"
        if status == "insufficient_long_horizon_history" or usable_years < 3
        else "high"
        if usable_years >= 10
        else "medium"
    )
    start_dates = [
        item
        for item in (
            _parsed_date(asset.row_data.get("firstListedDate")),
            _parsed_date(update.get("priceHistoryStartDate")),
        )
        if item is not None
    ]
    eligible_after = (
        _add_years(max(start_dates), MINIMUM_PORTFOLIO_HISTORY_YEARS)
        if start_dates
        else None
    )
    update["portfolioEligibleAfterDate"] = (
        eligible_after.isoformat()
        if status == "insufficient_long_horizon_history"
        and eligible_after
        and eligible_after > config.as_of_date
        else ""
    )


def _apply_distribution_policy(
    update: dict[str, object],
    asset: UniverseAsset,
    cash_yield: float,
) -> None:
    distribution_type = asset.distribution_type
    data_quality_status = (
        asset.row_data.get("distributionDataQualityStatus", "")
        .strip()
        .lower()
    )
    update["distributionDataQualityStatus"] = data_quality_status
    update["distributionDataQualityReason"] = asset.row_data.get(
        "distributionDataQualityReason",
        "",
    )
    update["cashEventBasis"] = asset.row_data.get("cashEventBasis", "")
    update["cashEventNormalizationStatus"] = asset.row_data.get(
        "cashEventNormalizationStatus",
        "",
    )
    update["cashEventNormalizationMethod"] = asset.row_data.get(
        "cashEventNormalizationMethod",
        "",
    )
    if data_quality_status == "provider_event_error":
        update["dividendYield"] = ""
        update["cashDistributionYieldTtm"] = cash_yield
        update["trailingDistributionYield"] = cash_yield
        update["reinvestmentCashYield"] = 0
        update["simulationCashYield"] = 0
        update["distributionSimulationPolicy"] = "blocked_data_quality"
        update["distributionCalculationStatus"] = "provider_event_error"
    elif distribution_type == SPECIAL_DISTRIBUTION_TYPE:
        update["dividendYield"] = ""
        update["cashDistributionYieldTtm"] = cash_yield
        update["trailingDistributionYield"] = cash_yield
        update["reinvestmentCashYield"] = 0
        update["simulationCashYield"] = 0
        update["distributionSimulationPolicy"] = (
            "exclude_non_recurring_distribution"
        )
        update["distributionCalculationStatus"] = (
            "non_recurring_distribution_excluded"
        )
    elif (
        distribution_type in REPEATED_DISTRIBUTION_TYPES
        or _is_non_ordinary(asset, None)
    ):
        update["dividendYield"] = ""
        update["cashDistributionYieldTtm"] = cash_yield
        update["trailingDistributionYield"] = cash_yield
        update["reinvestmentCashYield"] = cash_yield
        update["simulationCashYield"] = cash_yield
        update["distributionSimulationPolicy"] = "repeat_ttm_distribution"
    else:
        update["dividendYield"] = cash_yield
        update["cashDistributionYieldTtm"] = ""
        update["trailingDistributionYield"] = ""
        update["reinvestmentCashYield"] = cash_yield
        update["simulationCashYield"] = cash_yield
        update["distributionSimulationPolicy"] = "ordinary_cash_dividend"


def _load_checkpoint(
    config: PipelineConfig,
    assets: list[UniverseAsset],
) -> dict[str, dict[str, object]]:
    if not config.resume or not config.resolved_checkpoint_path.exists():
        return {}
    try:
        value = json.loads(
            config.resolved_checkpoint_path.read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError):
        return {}
    if value.get("asOfDate") != config.as_of_date.isoformat():
        return {}
    if value.get("executionContract") != _execution_contract(config):
        return {}
    rows = value.get("completedRows")
    contracts = value.get("assetContracts")
    if not isinstance(rows, dict) or not isinstance(contracts, dict):
        return {}
    assets_by_identity = {asset.identity: asset for asset in assets}
    return {
        str(identity): dict(update)
        for identity, update in rows.items()
        if isinstance(update, dict)
        and identity in assets_by_identity
        and contracts.get(identity)
        == _asset_contract(assets_by_identity[identity])
    }


def _write_checkpoint(
    config: PipelineConfig,
    completed_rows: dict[str, dict[str, object]],
    assets_by_identity: dict[str, UniverseAsset],
) -> None:
    _atomic_json(
        config.resolved_checkpoint_path,
        {
            "asOfDate": config.as_of_date.isoformat(),
            "executionContract": _execution_contract(config),
            "completedRows": completed_rows,
            "assetContracts": {
                identity: _asset_contract(assets_by_identity[identity])
                for identity in completed_rows
                if identity in assets_by_identity
            },
        },
    )


def _load_selected_failures(path: Path | None) -> set[str] | None:
    if path is None:
        return None
    if not path.exists():
        raise ValueError(f"failed identities file does not exist: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
    if "market" not in (reader.fieldnames or ()) or "ticker" not in (
        reader.fieldnames or ()
    ):
        raise ValueError("failed identities CSV must contain market,ticker")
    return {
        f"{str(row['market']).strip().upper()}:"
        f"{str(row['ticker']).strip().upper()}"
        for row in rows
    }


def _base_update(
    asset: UniverseAsset,
    source_row: dict[str, str] | None,
) -> dict[str, object]:
    source_row = source_row or {}
    update: dict[str, object] = {
        "market": asset.market,
        "ticker": asset.ticker,
        "name": asset.name,
        "benchmark": asset.benchmark,
        "marketDataProvider": asset.market_data_provider,
        "marketDataProviderSymbol": asset.market_data_provider_symbol,
        "benchmarkProviderSymbol": asset.benchmark_provider_symbol,
        "exposureType": asset.exposure_type,
        "distributionType": asset.distribution_type,
        "distributionFrequency": asset.distribution_frequency,
        "active": "true" if asset.active else "false",
        "includeInSimulator": (
            "true"
            if asset.active and asset.include_in_simulator
            else "false"
        ),
        "simulatorReady": "false",
        "rawPriceCagr": "",
        "rollingCagrMedian": "",
        "rollingCagrWindowYears": "",
        "rollingCagrWindowCount": "",
        "priceHistoryStartDate": "",
        "usablePriceHistoryYears": "",
        "minimumPortfolioHistoryYears": MINIMUM_PORTFOLIO_HISTORY_YEARS,
        "portfolioEligible": "false",
        "portfolioEligibilityStatus": "provider_data_unavailable",
        "portfolioEligibilityReason": "provider_data_unavailable",
        "portfolioEligibleAfterDate": "",
        "cagrConfidence": "low",
        "portfolioAddPolicy": "deny",
        "portfolioWarningCodes": "",
        "expectedCagr": "",
        "beta": "",
        "mdd": "",
        "annualizedVolatility": "",
        "volatilityObservationCount": "",
        "dividendYield": "",
        "cashDistributionYieldTtm": "",
        "trailingDistributionYield": "",
        "reinvestmentCashYield": "",
        "simulationCashYield": "",
        "distributionSimulationPolicy": "",
        "cashEventBasis": "",
        "cashEventNormalizationStatus": "",
        "cashEventNormalizationMethod": "",
        "distributionDataQualityStatus": "",
        "distributionDataQualityReason": "",
        "priceDataEndDate": "",
        "priceBasis": "",
        "priceMetricsStatus": "not_attempted",
        "dividendStatus": "",
        "distributionCalculationStatus": "not_attempted",
        "reasonCode": "",
        "reasonMessage": "",
    }
    if "providerSymbol" not in source_row:
        update["providerSymbol"] = asset.provider_symbol
    return update


def _failure(
    update: dict[str, object],
    code: str,
    message: str,
) -> tuple[dict[str, object], dict[str, object]]:
    update["simulatorReady"] = "false"
    update["reasonCode"] = code
    update["reasonMessage"] = message
    return update, {
        "market": update["market"],
        "ticker": update["ticker"],
        "reasonCode": code,
        "reasonMessage": message,
    }


def _calculate_update(
    asset: UniverseAsset,
    source_row: dict[str, str] | None,
    provider: MarketDataProvider,
    config: PipelineConfig,
) -> tuple[
    dict[str, object],
    dict[str, object] | None,
    bool,
]:
    update = _base_update(asset, source_row)
    if not asset.active:
        reason_code = (
            asset.row_data.get("reasonCode")
            or "inactive_universe_asset"
        )
        reason_message = (
            asset.row_data.get("reasonMessage")
            or "active is false in the universe"
        )
        update, failure = _failure(
            update,
            reason_code,
            reason_message,
        )
        _apply_portfolio_policy(update, asset, config)
        return update, failure, True
    if not asset.include_in_simulator:
        reason_code = (
            asset.row_data.get("reasonCode")
            or "excluded_from_simulator"
        )
        reason_message = (
            asset.row_data.get("reasonMessage")
            or "includeInSimulator is false in the universe"
        )
        update, failure = _failure(
            update,
            reason_code,
            reason_message,
        )
        _apply_portfolio_policy(update, asset, config)
        return update, failure, True

    try:
        asset_bundle = provider.load_asset(asset, config.as_of_date)
        benchmark_bundle = provider.load_benchmark(
            asset,
            config.as_of_date,
        )
        metrics = calculate_asset_metrics(
            asset_bundle,
            benchmark_bundle,
            config,
        )
    except (MetricCalculationError, MarketDataError) as error:
        code = getattr(error, "code", "price_metric_calculation_failed")
        update["priceMetricsStatus"] = "failed"
        update, failure = _failure(update, str(code), str(error))
        _apply_portfolio_policy(update, asset, config)
        return update, failure, False

    update.update(metrics.to_row())
    update["priceMetricsStatus"] = "ready"
    update["dividendStatus"] = asset_bundle.dividend.status
    update["distributionCalculationStatus"] = asset_bundle.dividend.status
    try:
        latest_price = price_series(
            asset_bundle,
            config.as_of_date,
        )[-1][1]
        cash_yield = round(
            calculate_cash_yield(asset_bundle, latest_price),
            8,
        )
    except (MetricCalculationError, MarketDataError) as error:
        code = getattr(error, "code", "cash_yield_calculation_failed")
        update, failure = _failure(update, str(code), str(error))
        _apply_portfolio_policy(update, asset, config)
        return update, failure, False

    _apply_distribution_policy(update, asset, cash_yield)
    update["simulatorReady"] = "true"
    _apply_portfolio_policy(update, asset, config)
    return update, None, True


def _calculate_updates(
    assets: list[UniverseAsset],
    source: CanonicalSource,
    provider: MarketDataProvider,
    config: PipelineConfig,
) -> tuple[
    dict[str, dict[str, object]],
    list[dict[str, object]],
    int,
    int,
]:
    source_by_identity = {
        row_identity(row): row for row in source.rows
    }
    completed_rows = _load_checkpoint(config, assets)
    assets_by_identity = {asset.identity: asset for asset in assets}
    resumed_count = len(completed_rows)
    selected_failures = _load_selected_failures(
        config.failed_identities_path
    )
    if selected_failures is not None:
        missing_checkpoint = {
            asset.identity
            for asset in assets
            if asset.identity not in selected_failures
            and asset.identity not in completed_rows
        }
        if missing_checkpoint:
            raise ValueError(
                "selective failed-identity retry requires completed checkpoint "
                "rows for all non-selected assets"
            )

    updates = dict(completed_rows)
    failures: list[dict[str, object]] = []
    processed_count = 0
    pending = [
        asset
        for asset in assets
        if asset.identity not in completed_rows
        and (
            selected_failures is None
            or asset.identity in selected_failures
        )
    ]
    for offset in range(0, len(pending), config.chunk_size):
        chunk = pending[offset : offset + config.chunk_size]
        for asset in chunk:
            update, failure, completed = _calculate_update(
                asset,
                source_by_identity.get(asset.identity),
                provider,
                config,
            )
            updates[asset.identity] = update
            processed_count += 1
            if failure is not None:
                failures.append(failure)
            if completed:
                completed_rows[asset.identity] = update
        _write_checkpoint(config, completed_rows, assets_by_identity)
    return updates, failures, processed_count, resumed_count


def _new_source_row(
    asset: UniverseAsset,
    headers: tuple[str, ...],
) -> dict[str, object]:
    row: dict[str, object] = {field: "" for field in headers}
    for field in headers:
        if field in asset.row_data:
            row[field] = asset.row_data[field]
    row["market"] = asset.market
    row["ticker"] = asset.ticker
    if "providerSymbol" in row:
        row["providerSymbol"] = asset.provider_symbol
    if "nameKr" in row and not row["nameKr"]:
        row["nameKr"] = asset.name
    return row


def _merge_full_schema_rows(
    source: CanonicalSource,
    assets: list[UniverseAsset],
    updates: dict[str, dict[str, object]],
) -> tuple[list[dict[str, object]], tuple[str, ...]]:
    headers = candidate_headers(source.headers)
    universe_by_identity = {asset.identity: asset for asset in assets}
    source_identities = set(source.identities)
    rows: list[dict[str, object]] = []
    for source_row in source.rows:
        identity = row_identity(source_row)
        row: dict[str, object] = {
            field: source_row.get(field, "") for field in headers
        }
        if identity in updates:
            update = dict(updates[identity])
            update.pop("market", None)
            update.pop("ticker", None)
            if "name" in source.headers:
                update.pop("name", None)
            row.update(update)
        elif identity not in universe_by_identity:
            row.update(
                {
                    "includeInSimulator": "false",
                    "simulatorReady": "false",
                    "reasonCode": "not_in_editable_universe",
                    "reasonMessage": (
                        "source row is preserved but absent from the universe"
                    ),
                }
            )
        rows.append(row)
    for asset in assets:
        if asset.identity in source_identities:
            continue
        row = _new_source_row(asset, headers)
        row.update(updates.get(asset.identity, _base_update(asset, None)))
        rows.append(row)
    return rows, headers


def _summary(
    *,
    config: PipelineConfig,
    source: CanonicalSource,
    assets: list[UniverseAsset],
    rows: list[dict[str, object]],
    failures: list[dict[str, object]],
    processed_count: int,
    resumed_count: int,
) -> dict[str, object]:
    source_identities = set(source.identities)
    universe_identities = {asset.identity for asset in assets}
    market_counts: dict[str, int] = {}
    rolling_counts: dict[str, int] = {}
    for row in rows:
        market = str(row.get("market") or "")
        market_counts[market] = market_counts.get(market, 0) + 1
        if _parse_bool(row.get("simulatorReady")):
            window = str(row.get("rollingCagrWindowYears") or "")
            rolling_counts[window] = rolling_counts.get(window, 0) + 1
    return {
        "asOfDate": config.as_of_date.isoformat(),
        "inputRowCount": len(assets),
        "sourceRowCount": len(source.rows),
        "outputRowCount": len(rows),
        "activeRowCount": sum(asset.active for asset in assets),
        "simulatorEligibleRowCount": sum(
            _parse_bool(row.get("simulatorReady")) for row in rows
        ),
        "completeRowCount": sum(
            _parse_bool(row.get("simulatorReady")) for row in rows
        ),
        "failedRowCount": len(failures),
        "excludedRowCount": sum(not asset.active for asset in assets),
        "newAssetCount": len(universe_identities - source_identities),
        "removedAssetCount": len(source_identities - universe_identities),
        "processedRowCount": processed_count,
        "resumedRowCount": resumed_count,
        "marketRowCounts": dict(sorted(market_counts.items())),
        "rollingWindowRowCounts": dict(sorted(rolling_counts.items())),
        "candidateRuntimeReplacementPerformed": False,
    }


def build_canonical_candidate(
    config: PipelineConfig,
    provider: MarketDataProvider,
) -> BuildResult:
    source = load_canonical_source(config.source_canonical_path)
    assets = load_universe(config.universe_path)
    updates, failures, processed_count, resumed_count = _calculate_updates(
        assets,
        source,
        provider,
        config,
    )
    rows, headers = _merge_full_schema_rows(source, assets, updates)
    failures = [
        {
            "market": row.get("market", ""),
            "ticker": row.get("ticker", ""),
            "reasonCode": row.get("reasonCode", ""),
            "reasonMessage": row.get("reasonMessage", ""),
            "priceMetricsStatus": row.get("priceMetricsStatus", ""),
            "distributionCalculationStatus": row.get(
                "distributionCalculationStatus",
                "",
            ),
            "expectedCagr": row.get("expectedCagr", ""),
            "beta": row.get("beta", ""),
            "mdd": row.get("mdd", ""),
            "annualizedVolatility": row.get(
                "annualizedVolatility",
                "",
            ),
            "dividendYield": row.get("dividendYield", ""),
            "cashDistributionYieldTtm": row.get(
                "cashDistributionYieldTtm",
                "",
            ),
        }
        for row in rows
        if not _parse_bool(row.get("simulatorReady"))
        and str(row.get("reasonCode") or "").strip()
    ]
    summary = _summary(
        config=config,
        source=source,
        assets=assets,
        rows=rows,
        failures=failures,
        processed_count=processed_count,
        resumed_count=resumed_count,
    )

    output_parent = config.output_candidate_path.parent
    output_parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(
        prefix="finple-canonical-candidate-",
        dir=output_parent,
    ) as temporary_directory:
        temporary = Path(temporary_directory)
        staged_candidate = temporary / config.output_candidate_path.name
        _write_csv(staged_candidate, rows, headers)
        validation = validate_candidate_file(
            staged_candidate,
            universe=assets,
            as_of_date=config.as_of_date,
            source=source,
        )

        _atomic_json(config.resolved_validation_report_path, validation)
        _write_csv(
            config.resolved_failed_assets_path,
            failures,
            [
                "market",
                "ticker",
                "reasonCode",
                "reasonMessage",
                "priceMetricsStatus",
                "distributionCalculationStatus",
                "expectedCagr",
                "beta",
                "mdd",
                "annualizedVolatility",
                "dividendYield",
                "cashDistributionYieldTtm",
            ],
        )
        _atomic_json(config.resolved_run_summary_path, summary)
        if not validation["publishable"]:
            if config.write_non_publishable_candidate:
                os.replace(staged_candidate, config.output_candidate_path)
            raise ValueError(
                "candidate is not publishable"
                + (
                    "; review artifact was written"
                    if config.write_non_publishable_candidate
                    else "; existing candidate was preserved"
                )
            )
        os.replace(staged_candidate, config.output_candidate_path)
    return BuildResult(
        candidate_path=config.output_candidate_path,
        validation_report_path=config.resolved_validation_report_path,
        failed_assets_path=config.resolved_failed_assets_path,
        run_summary_path=config.resolved_run_summary_path,
        validation=validation,
        summary=summary,
    )


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a validated full-schema FINPLE candidate CSV",
    )
    parser.add_argument("--source-canonical", required=True)
    parser.add_argument("--universe", required=True)
    parser.add_argument("--output-candidate", required=True)
    parser.add_argument("--as-of", required=True)
    parser.add_argument(
        "--provider",
        choices=("csv", "yfinance"),
        default="csv",
    )
    parser.add_argument("--market-data-csv")
    parser.add_argument("--cache-dir", default=".canonical_csv_cache")
    parser.add_argument("--chunk-size", type=int, default=100)
    parser.add_argument(
        "--resume",
        action=argparse.BooleanOptionalAction,
        default=True,
    )
    parser.add_argument("--retry-count", type=int, default=3)
    parser.add_argument("--retry-backoff-seconds", type=float, default=5.0)
    parser.add_argument("--failed-identities")
    parser.add_argument("--rolling-windows", default="10,7,5,3,1")
    parser.add_argument("--min-rolling-windows", type=int, default=6)
    parser.add_argument("--min-beta-observations", type=int, default=120)
    parser.add_argument("--min-volatility-observations", type=int, default=20)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    config = PipelineConfig.from_strings(
        source_canonical_path=args.source_canonical,
        universe_path=args.universe,
        output_candidate_path=args.output_candidate,
        as_of_date=args.as_of,
        cache_dir=Path(args.cache_dir),
        chunk_size=args.chunk_size,
        resume=args.resume,
        retry_count=args.retry_count,
        retry_backoff_seconds=args.retry_backoff_seconds,
        failed_identities_path=(
            Path(args.failed_identities)
            if args.failed_identities
            else None
        ),
        rolling_cagr_window_years=tuple(
            int(value) for value in args.rolling_windows.split(",")
        ),
        min_rolling_windows=args.min_rolling_windows,
        min_beta_observations=args.min_beta_observations,
        min_volatility_observations=args.min_volatility_observations,
    )
    if args.provider == "csv":
        if not args.market_data_csv:
            raise SystemExit("--market-data-csv is required for --provider csv")
        provider: MarketDataProvider = CsvMarketDataProvider(
            args.market_data_csv
        )
    else:
        provider = PersistentCachedMarketDataProvider(
            YFinanceMarketDataProvider(),
            config.cache_dir,
            retry_count=config.retry_count,
            retry_backoff_seconds=config.retry_backoff_seconds,
        )
    result = build_canonical_candidate(config, provider)
    print(
        json.dumps(
            {
                "candidate": str(result.candidate_path),
                "validation": result.validation,
                "summary": result.summary,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
