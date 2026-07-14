from __future__ import annotations

import csv
import hashlib
import json
import math
import statistics
from calendar import monthrange
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Mapping

from .audit import build_audit_summary, write_audit_report
from .config import (
    CALCULATION_POLICY_VERSION,
    PIPELINE_VERSION,
    SCHEMA_VERSION,
    PipelineConfig,
    load_config,
    validate_config,
)
from .package import write_deterministic_zip
from .schemas import (
    CANDIDATE_COLUMNS,
    FULL_METRICS_COLUMNS,
    MONTHLY_PRICE_COLUMNS,
    MONTHLY_RETURNS_COLUMNS,
    NORMALIZED_MONTH_END_COLUMNS,
    RAW_DAILY_PRICE_COLUMNS,
    REVIEW_REQUIRED_COLUMNS,
    SELECTED_COLUMNS,
    TIMESERIES_AUDIT_COLUMNS,
)
from .timeseries import NORMALIZATION_VERSION, normalize_daily_price_rows


class PipelineCriticalError(RuntimeError):
    """Raised when Step 114-2A must stop before publish-ready outputs."""


def run_finple_monthly_metrics_pipeline(config: Mapping[str, Any]) -> dict[str, Any]:
    pipeline_config = load_config(config)
    critical_errors = validate_config(pipeline_config)
    if critical_errors:
        raise PipelineCriticalError("; ".join(critical_errors))

    input_dir = pipeline_config.input_dir
    output_dir = pipeline_config.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    candidates_path = input_dir / pipeline_config.candidate_file
    benchmark_path = input_dir / pipeline_config.benchmark_map_file
    prices_path = input_dir / pipeline_config.monthly_prices_file
    raw_daily_path = input_dir / pipeline_config.raw_daily_prices_file
    source_paths = [candidates_path, benchmark_path, prices_path, raw_daily_path]
    for path in source_paths:
        if not path.exists():
            critical_errors.append(f"Required input file missing: {path.name}")
    if critical_errors:
        raise PipelineCriticalError("; ".join(critical_errors))

    candidates = _read_csv(candidates_path)
    benchmark_map = _read_benchmark_map(benchmark_path)
    price_rows = _read_csv(prices_path)
    raw_daily_rows = _read_csv(raw_daily_path)
    critical_errors.extend(_validate_candidates(candidates, pipeline_config))
    critical_errors.extend(_validate_price_rows(price_rows))
    critical_errors.extend(_validate_raw_daily_schema(raw_daily_rows))
    if critical_errors:
        raise PipelineCriticalError("; ".join(critical_errors))

    source_hashes = {path.name: _sha256(path) for path in source_paths}
    raw_daily_normalization = normalize_daily_price_rows(
        raw_daily_rows,
        source_file_name=raw_daily_path.name,
        source_sha256=source_hashes[raw_daily_path.name],
    )
    normalized_month_end_rows = list(raw_daily_normalization["normalizedRows"])
    timeseries_audit_rows = list(raw_daily_normalization["auditRows"])
    price_hash_by_ticker = _hash_price_rows(price_rows)
    prices_by_ticker = _group_prices(price_rows)

    full_rows: list[dict[str, str]] = []
    review_rows: list[dict[str, str]] = []
    monthly_return_rows: list[dict[str, str]] = []

    for candidate in sorted(candidates, key=lambda row: (row["market"], row["ticker"])):
        if candidate["market"] not in pipeline_config.market_scope:
            continue
        metrics_row, candidate_review_rows, candidate_returns = _build_candidate_outputs(
            candidate=candidate,
            config=pipeline_config,
            prices=prices_by_ticker.get(candidate["ticker"], []),
            benchmark_prices=prices_by_ticker.get(benchmark_map.get(candidate["benchmarkKey"], ""), []),
            source_hash=price_hash_by_ticker.get(candidate["ticker"], ""),
        )
        full_rows.append(metrics_row)
        review_rows.extend(candidate_review_rows)
        monthly_return_rows.extend(candidate_returns)

    selected_rows = [
        {column: row[column] for column in SELECTED_COLUMNS}
        for row in full_rows
        if row["dataStatus"] == "ready" and row["reviewFlag"] == "none"
    ]

    version = pipeline_config.output_version
    output_csv = output_dir / f"finple_metrics_output_{version}.csv"
    selected_csv = output_dir / f"finple_metrics_selected_{version}.csv"
    review_csv = output_dir / f"finple_metrics_review_required_{version}.csv"
    returns_csv = output_dir / f"finple_monthly_returns_{version}.csv"
    normalized_csv = output_dir / f"finple_normalized_month_end_{version}.csv"
    timeseries_audit_csv = output_dir / f"finple_timeseries_audit_{version}.csv"
    audit_html = output_dir / f"finple_metrics_audit_report_{version}.html"
    manifest_json = output_dir / f"finple_metrics_manifest_{version}.json"
    package_zip = output_dir / f"finple_monthly_metrics_{version}_package.zip"

    _write_csv(output_csv, FULL_METRICS_COLUMNS, full_rows)
    _write_csv(selected_csv, SELECTED_COLUMNS, selected_rows)
    _write_csv(review_csv, REVIEW_REQUIRED_COLUMNS, review_rows)
    _write_csv(returns_csv, MONTHLY_RETURNS_COLUMNS, monthly_return_rows)
    _write_csv(normalized_csv, NORMALIZED_MONTH_END_COLUMNS, normalized_month_end_rows)
    _write_csv(timeseries_audit_csv, TIMESERIES_AUDIT_COLUMNS, timeseries_audit_rows)

    audit_summary = build_audit_summary(
        full_rows,
        review_rows,
        normalized_rows=normalized_month_end_rows,
        timeseries_audit_rows=timeseries_audit_rows,
    )
    write_audit_report(audit_html, audit_summary, source_hashes)

    output_files = [output_csv, selected_csv, review_csv, audit_html, manifest_json, returns_csv, normalized_csv, timeseries_audit_csv]
    manifest = _build_manifest(
        config=pipeline_config,
        source_hashes=source_hashes,
        output_files=[output_csv, selected_csv, review_csv, audit_html, returns_csv, normalized_csv, timeseries_audit_csv],
        audit_summary=audit_summary,
        source_metadata=[raw_daily_normalization["sourceMetadata"]],
    )
    manifest_json.write_text(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    write_deterministic_zip(package_zip, output_files)

    return {
        "ok": True,
        "fixturePackageReady": True,
        "productionPublishReady": False,
        "appExportApproved": False,
        "metricBaseDate": pipeline_config.metric_base_date,
        "pipelineVersion": PIPELINE_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
        "summary": audit_summary,
        "sourceHashes": source_hashes,
        "outputs": {
            "metricsOutputCsv": str(output_csv),
            "selectedCsv": str(selected_csv),
            "reviewRequiredCsv": str(review_csv),
            "auditReportHtml": str(audit_html),
            "manifestJson": str(manifest_json),
            "monthlyReturnsCsv": str(returns_csv),
            "normalizedMonthEndCsv": str(normalized_csv),
            "timeseriesAuditCsv": str(timeseries_audit_csv),
            "zipPackage": str(package_zip),
        },
    }


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [{key: (value or "") for key, value in row.items()} for row in csv.DictReader(handle)]


def _write_csv(path: Path, columns: list[str], rows: Iterable[Mapping[str, str]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def _read_benchmark_map(path: Path) -> dict[str, str]:
    rows = _read_csv(path)
    return {row["benchmarkKey"]: row["benchmarkTicker"] for row in rows}


def _validate_candidates(rows: list[dict[str, str]], config: PipelineConfig) -> list[str]:
    errors: list[str] = []
    if not rows:
        return ["candidate universe missing"]
    missing_columns = sorted(set(CANDIDATE_COLUMNS).difference(rows[0]))
    if missing_columns:
        errors.append(f"candidate universe missing required columns: {', '.join(missing_columns)}")
    for row in rows:
        market = row.get("market", "")
        ticker = row.get("ticker", "")
        if market not in {"US", "KR"}:
            errors.append(f"Unsupported market: {market}")
        if market == "KR" and not (len(ticker) == 6 and ticker.isdigit()):
            errors.append(f"Korean ticker not preserved as six-character string: {ticker}")
    return errors


def _validate_price_rows(rows: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    if not rows:
        return ["monthly price input missing"]
    missing_columns = sorted(set(MONTHLY_PRICE_COLUMNS).difference(rows[0]))
    if missing_columns:
        errors.append(f"monthly price input missing required columns: {', '.join(missing_columns)}")

    seen: set[tuple[str, str]] = set()
    for row in rows:
        key = (row.get("ticker", ""), row.get("month", ""))
        if key in seen:
            errors.append(f"duplicate monthly price row: {key[0]} {key[1]}")
        seen.add(key)
        try:
            close = float(row.get("close", ""))
        except ValueError:
            close = 0
        if close <= 0:
            errors.append(f"non-positive close value: {key[0]} {key[1]}")
        dividend_status = row.get("dividendStatus", "")
        if dividend_status not in {"missing", "confirmed_zero", "confirmed_value"}:
            errors.append(f"unsupported dividendStatus: {key[0]} {key[1]} {dividend_status}")
        cash_dividend = row.get("cashDividend", "")
        if dividend_status == "missing" and cash_dividend != "":
            errors.append(f"missing dividendStatus must keep cashDividend blank: {key[0]} {key[1]}")
        if dividend_status == "confirmed_zero" and _safe_float(cash_dividend) != 0:
            errors.append(f"confirmed_zero dividendStatus requires zero cashDividend: {key[0]} {key[1]}")
        if dividend_status == "confirmed_value" and _safe_float(cash_dividend) <= 0:
            errors.append(f"confirmed_value dividendStatus requires positive cashDividend: {key[0]} {key[1]}")
        if row.get("publicationEligibility") != "approved":
            errors.append(f"publicationEligibility must be approved in fixture publish path: {key[0]}")
    errors.extend(_validate_continuous_month_end_rows(rows))
    return errors


def _validate_raw_daily_schema(rows: list[dict[str, str]]) -> list[str]:
    if not rows:
        return ["raw daily fixture input missing"]
    missing_columns = sorted(set(RAW_DAILY_PRICE_COLUMNS).difference(rows[0]))
    if missing_columns:
        return [f"raw daily fixture missing required columns: {', '.join(missing_columns)}"]
    return []


def _validate_continuous_month_end_rows(rows: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    for ticker, ticker_rows in _group_prices(rows).items():
        for row in ticker_rows:
            parsed = _parse_date(row["month"])
            if row["month"] != _month_end(parsed.year, parsed.month):
                errors.append(f"month is not a month-end date: {ticker} {row['month']}")
        for previous, current in zip(ticker_rows, ticker_rows[1:]):
            expected_next = _next_month_end(previous["month"])
            if current["month"] != expected_next:
                errors.append(f"non-continuous monthly series: {ticker} expected {expected_next} got {current['month']}")
    return errors


def _group_prices(rows: list[dict[str, str]]) -> dict[str, list[dict[str, str]]]:
    grouped: dict[str, list[dict[str, str]]] = {}
    for row in rows:
        grouped.setdefault(row["ticker"], []).append(row)
    for ticker in grouped:
        grouped[ticker].sort(key=lambda row: row["month"])
    return grouped


def _hash_price_rows(rows: list[dict[str, str]]) -> dict[str, str]:
    grouped = _group_prices(rows)
    hashes: dict[str, str] = {}
    for ticker, ticker_rows in grouped.items():
        payload = json.dumps(ticker_rows, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        hashes[ticker] = hashlib.sha256(payload).hexdigest()
    return hashes


def _build_candidate_outputs(
    candidate: Mapping[str, str],
    config: PipelineConfig,
    prices: list[dict[str, str]],
    benchmark_prices: list[dict[str, str]],
    source_hash: str,
) -> tuple[dict[str, str], list[dict[str, str]], list[dict[str, str]]]:
    ticker = candidate["ticker"]
    review_rows: list[dict[str, str]] = []
    if not prices:
        row = _empty_metrics_row(candidate, config, source_hash, "source_missing")
        review_rows.append(_review_row(candidate, config, "missing_price_data", "", "", "No fixture price rows found."))
        return row, review_rows, []

    data_start = prices[0]["month"]
    data_end = prices[-1]["month"]
    data_years = _years_between(data_start, data_end)
    closes = [float(row["close"]) for row in prices]
    returns = _period_returns(prices)
    monthly_return_rows = _monthly_return_rows(candidate, prices, returns)

    price_cagr = _cagr(closes[0], closes[-1], data_years) if data_years > 0 else None
    rolling_10y = _rolling_cagrs(prices, 120)
    rolling_5y = _rolling_cagrs(prices, 60)
    selected_cagr, cagr_policy, data_status, review_flag, review_reason = _select_cagr(
        config,
        data_years,
        rolling_10y,
        rolling_5y,
        price_cagr,
    )
    mdd = _mdd(closes)
    volatility = _volatility(returns)
    beta = _beta(prices, benchmark_prices)
    dividend_yield, dividend_status, dividend_policy = _dividend_yield(prices)

    policy_review_reasons = _policy_review_reasons(selected_cagr, mdd, beta, dividend_yield)
    if policy_review_reasons and review_flag == "none":
        review_flag = "review_required"
        review_reason = "; ".join(policy_review_reasons)

    if review_flag != "none":
        review_rows.append(
            _review_row(candidate, config, review_flag, _format_percent(price_cagr), _format_percent(selected_cagr), review_reason)
        )
    if beta is None:
        review_rows.append(_review_row(candidate, config, "missing_benchmark", "", "", "Benchmark fixture rows were insufficient."))

    row = {
        "ticker": ticker,
        "nameKr": candidate["nameKr"],
        "market": candidate["market"],
        "assetType": candidate["assetType"],
        "benchmarkKey": candidate["benchmarkKey"],
        "metricBaseDate": config.metric_base_date,
        "dataStartDate": data_start,
        "dataEndDate": data_end,
        "dataYears": _format_number(data_years),
        "priceCagr10yRaw": _format_percent(price_cagr),
        "rollingCagr10yMedian": _format_percent(_median(rolling_10y)),
        "rollingCagr10yP25": _format_percent(_percentile(rolling_10y, 25)),
        "rollingCagr10yP75": _format_percent(_percentile(rolling_10y, 75)),
        "rollingCagr10yWindowCount": str(len(rolling_10y)),
        "rollingCagr5yMedian": _format_percent(_median(rolling_5y)),
        "rollingCagr5yWindowCount": str(len(rolling_5y)),
        "sinceInceptionCagr": _format_percent(price_cagr),
        "selectedCagr": _format_percent(selected_cagr),
        "cagrPolicy": cagr_policy,
        "mdd10yRaw": _format_percent(mdd),
        "rollingMdd10yMedian": _format_percent(mdd),
        "selectedMdd": _format_percent(mdd if data_years >= config.min_years_for_inception else None),
        "mddPolicy": "worst_drawdown_available" if data_years >= config.min_years_for_inception else "blank_review_required",
        "beta10yRaw": _format_number(beta),
        "rollingBeta10yMedian": _format_number(beta),
        "rollingBeta5yMedian": _format_number(beta),
        "selectedBeta": _format_number(beta),
        "betaPolicy": "fixture_aligned_monthly_returns" if beta is not None else "blank_review_required",
        "volatility10y": _format_percent(volatility),
        "dividendYield": _format_percent(dividend_yield),
        "dividendStatus": dividend_status,
        "dividendPolicy": dividend_policy,
        "dataStatus": data_status,
        "reviewFlag": review_flag if beta is not None else "review_required",
        "reviewReason": review_reason if beta is not None else "Benchmark fixture rows were insufficient.",
        "sourcePolicy": "fixture_only_approved_internal",
        "sourceHash": source_hash,
        "notes": "Step 114-2A offline fixture; no external provider call.",
    }
    return row, review_rows, monthly_return_rows


def _empty_metrics_row(candidate: Mapping[str, str], config: PipelineConfig, source_hash: str, reason: str) -> dict[str, str]:
    row = {column: "" for column in FULL_METRICS_COLUMNS}
    row.update(
        {
            "ticker": candidate["ticker"],
            "nameKr": candidate["nameKr"],
            "market": candidate["market"],
            "assetType": candidate["assetType"],
            "benchmarkKey": candidate["benchmarkKey"],
            "metricBaseDate": config.metric_base_date,
            "dataStatus": "review_required",
            "reviewFlag": "review_required",
            "reviewReason": reason,
            "sourcePolicy": "fixture_only_approved_internal",
            "sourceHash": source_hash,
        }
    )
    return row


def _select_cagr(
    config: PipelineConfig,
    data_years: float,
    rolling_10y: list[float],
    rolling_5y: list[float],
    inception_cagr: float | None,
) -> tuple[float | None, str, str, str, str]:
    if data_years >= config.min_years_for_10y and rolling_10y:
        return _median(rolling_10y), "rolling_10y_median", "ready", "none", ""
    if data_years >= config.min_years_for_5y and rolling_5y:
        return _median(rolling_5y), "rolling_5y_median", "short_history", "short_history", "Only 5Y rolling fixture window is available."
    if data_years >= config.min_years_for_inception:
        return inception_cagr, "since_inception", "limited_history", "review_required", "Only since-inception fixture history is available."
    return None, "blank_review_required", "insufficient_history", "review_required", "Less than three years of fixture history."


def _monthly_return_rows(candidate: Mapping[str, str], prices: list[dict[str, str]], returns: list[float]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for row, price_return in zip(prices[1:], returns):
        dividend_component = 0.0
        if row.get("dividendStatus") == "confirmed_value":
            dividend_component = _safe_float(row.get("cashDividend")) / _safe_float(row.get("close"))
        output.append(
            {
                "market": candidate["market"],
                "ticker": candidate["ticker"],
                "month": row["month"],
                "currency": row["currency"],
                "priceReturn": _format_decimal(price_return),
                "totalReturn": _format_decimal(price_return + dividend_component),
                "fxReturn": "0.000000",
                "benchmarkId": candidate["benchmarkKey"],
                "isProxy": "false" if not candidate.get("proxyTicker") else "true",
                "proxyTicker": candidate.get("proxyTicker", ""),
                "dataStatus": "fixture" if row.get("dividendStatus") != "missing" else "fixture_dividend_missing",
            }
        )
    return output


def _review_row(
    candidate: Mapping[str, str],
    config: PipelineConfig,
    issue_type: str,
    raw_value: str,
    selected_value: str,
    reason: str,
) -> dict[str, str]:
    return {
        "ticker": candidate["ticker"],
        "nameKr": candidate["nameKr"],
        "market": candidate["market"],
        "assetType": candidate["assetType"],
        "metricBaseDate": config.metric_base_date,
        "issueType": issue_type,
        "rawValue": raw_value,
        "selectedValue": selected_value,
        "reviewReason": reason,
        "recommendedAction": "Keep out of app export until manual review passes.",
    }


def _policy_review_reasons(
    selected_cagr: float | None,
    selected_mdd: float | None,
    selected_beta: float | None,
    dividend_yield: float | None,
) -> list[str]:
    reasons: list[str] = []
    if selected_cagr is not None and (selected_cagr > 20 or selected_cagr < -20):
        reasons.append("selectedCagr outside automatic publish threshold")
    if selected_mdd is not None and selected_mdd < -70:
        reasons.append("selectedMdd outside automatic publish threshold")
    if selected_beta is not None and selected_beta > 2.5:
        reasons.append("selectedBeta outside automatic publish threshold")
    if dividend_yield is not None and dividend_yield > 10:
        reasons.append("dividendYield outside automatic publish threshold")
    return reasons


def _build_manifest(
    config: PipelineConfig,
    source_hashes: Mapping[str, str],
    output_files: list[Path],
    audit_summary: Mapping[str, int],
    source_metadata: list[Mapping[str, Any]],
) -> dict[str, Any]:
    return {
        "metricBaseDate": config.metric_base_date,
        "createdAt": config.created_at,
        "createdBy": "FINPLE Step 114-2A fixture pipeline",
        "pipelineVersion": PIPELINE_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
        "config": {
            "marketScope": list(config.market_scope),
            "selectedCagrPolicy": config.selected_cagr_policy,
            "currentPriceDisplay": config.current_price_display,
            "totalReturnCagrMode": config.total_return_cagr_mode,
            "inputMode": config.input_mode,
            "deterministicFixture": config.deterministic_fixture,
            "randomSeed": config.random_seed,
        },
        "sourceFiles": [_source_file_manifest_item(name, sha256) for name, sha256 in sorted(source_hashes.items())],
        "sourceMetadata": list(source_metadata),
        "outputs": [path.name for path in output_files],
        "outputHashes": {path.name: _sha256(path) for path in output_files},
        "policy": {
            "selectedCagr": "rolling_median_required_for_all_markets",
            "selectedMdd": "conservative_worst_drawdown",
            "selectedBeta": "fixture_aligned_monthly_returns",
            "totalReturnCagr": "reference_only",
            "currentPriceDisplay": "disabled",
        },
        "auditSummary": dict(audit_summary),
        "fixturePackageReady": True,
        "productionPublishReady": False,
        "appExportApproved": False,
        "externalProviderCalls": False,
        "normalizationVersion": NORMALIZATION_VERSION,
    }


def _source_file_manifest_item(name: str, sha256: str) -> dict[str, Any]:
    return {
        "name": name,
        "sourceFileName": name,
        "sha256": sha256,
        "sourceSha256": sha256,
        "mode": "fixture",
        "sourceId": f"fixture_{name}",
        "retrievedAt": "2026-07-14T00:00:00+09:00",
        "providerOrInstitution": "FINPLE synthetic fixture",
        "licenseStatus": "approved" if name != "raw_daily_prices.csv" else "mixed_or_review_required",
        "internalUseAllowed": True,
        "publicationAllowed": False,
        "redistributionAllowed": False,
        "priceAdjustmentBasis": "fixture_contract",
        "normalizationVersion": NORMALIZATION_VERSION,
        "schemaVersion": SCHEMA_VERSION,
        "calculationPolicyVersion": CALCULATION_POLICY_VERSION,
    }


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _years_between(start: str, end: str) -> float:
    start_date = _parse_date(start)
    end_date = _parse_date(end)
    return max((end_date - start_date).days / 365.25, 0)


def _parse_date(value: str):
    return datetime.strptime(value, "%Y-%m-%d").date()


def _month_end(year: int, month: int) -> str:
    return f"{year:04d}-{month:02d}-{monthrange(year, month)[1]:02d}"


def _next_month_end(value: str) -> str:
    parsed = _parse_date(value)
    year = parsed.year + (1 if parsed.month == 12 else 0)
    month = 1 if parsed.month == 12 else parsed.month + 1
    return _month_end(year, month)


def _period_returns(prices: list[dict[str, str]]) -> list[float]:
    returns: list[float] = []
    for previous, current in zip(prices, prices[1:]):
        previous_close = float(previous["close"])
        current_close = float(current["close"])
        returns.append((current_close / previous_close) - 1)
    return returns


def _cagr(start_value: float, end_value: float, years: float) -> float | None:
    if start_value <= 0 or end_value <= 0 or years <= 0:
        return None
    return ((end_value / start_value) ** (1 / years) - 1) * 100


def _rolling_cagrs(prices: list[dict[str, str]], window_months: int) -> list[float]:
    results: list[float] = []
    for start_index in range(0, len(prices) - window_months):
        start_row = prices[start_index]
        end_row = prices[start_index + window_months]
        cagr = _cagr(float(start_row["close"]), float(end_row["close"]), window_months / 12)
        if cagr is not None:
            results.append(cagr)
    return results


def _mdd(closes: list[float]) -> float | None:
    if not closes:
        return None
    peak = closes[0]
    worst = 0.0
    for close in closes:
        peak = max(peak, close)
        drawdown = close / peak - 1
        worst = min(worst, drawdown)
    return worst * 100


def _volatility(returns: list[float]) -> float | None:
    if len(returns) < 2:
        return None
    return statistics.pstdev(returns) * math.sqrt(12) * 100


def _beta(prices: list[dict[str, str]], benchmark_prices: list[dict[str, str]]) -> float | None:
    asset_returns = _returns_by_month(prices)
    benchmark_returns = _returns_by_month(benchmark_prices)
    common_months = sorted(set(asset_returns).intersection(benchmark_returns))
    if len(common_months) < 2:
        return 1.0 if prices and prices == benchmark_prices else None
    asset_values = [asset_returns[month] for month in common_months]
    benchmark_values = [benchmark_returns[month] for month in common_months]
    benchmark_mean = statistics.fmean(benchmark_values)
    variance = sum((value - benchmark_mean) ** 2 for value in benchmark_values)
    if variance == 0:
        return None
    asset_mean = statistics.fmean(asset_values)
    covariance = sum((asset - asset_mean) * (benchmark - benchmark_mean) for asset, benchmark in zip(asset_values, benchmark_values))
    return covariance / variance


def _returns_by_month(prices: list[dict[str, str]]) -> dict[str, float]:
    return {row["month"]: value for row, value in zip(prices[1:], _period_returns(prices))}


def _dividend_yield(prices: list[dict[str, str]]) -> tuple[float | None, str, str]:
    if not prices or len(prices) < 12:
        return None, "missing", "unconfirmed_blank"
    last_close = float(prices[-1]["close"])
    trailing_rows = prices[-12:]
    statuses = {row.get("dividendStatus", "") for row in trailing_rows}
    if "missing" in statuses:
        return None, "missing", "unconfirmed_blank"
    trailing_dividends = sum(_safe_float(row.get("cashDividend")) for row in trailing_rows)
    if trailing_dividends == 0:
        return 0.0, "confirmed_zero", "confirmed_no_dividend"
    return (trailing_dividends / last_close) * 100, "confirmed_value", "confirmed_ttm_cash_dividend"


def _safe_float(value: str | None) -> float:
    try:
        return float(value or "0")
    except ValueError:
        return 0.0


def _median(values: list[float]) -> float | None:
    return statistics.median(values) if values else None


def _percentile(values: list[float], percentile: int) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * percentile / 100
    lower = math.floor(index)
    upper = math.ceil(index)
    if lower == upper:
        return ordered[int(index)]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower)


def _format_percent(value: float | None) -> str:
    return "" if value is None else f"{value:.2f}"


def _format_number(value: float | None) -> str:
    return "" if value is None else f"{value:.4f}"


def _format_decimal(value: float | None) -> str:
    return "" if value is None else f"{value:.6f}"
