"""Run FINPLE Data Sentinel rule-based asset metric audits.

This script builds the current app-ready candidate set from the same runtime
CSV family used by the screener loader, applies versioned quality rules, and
writes non-destructive audit artifacts under data/processed/ml.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from pathlib import Path
from typing import Iterable


DEFAULT_CONFIG = "scripts/ml/config/asset_quality_rules.json"
DEFAULT_BASE = "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv"
DEFAULT_FINAL_OVERLAY = "src/data/tickers/finple_app_candidates_2000_final_v1.csv"
DEFAULT_US_PRICE = "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv"
DEFAULT_KR_PRICE = "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv"
DEFAULT_US_DIVIDEND = "src/data/tickers/us_dividend_overlay_20260527.csv"
DEFAULT_KR_ETF_DIVIDEND = "src/data/tickers/kr_etf_dividend_overlay_20260525.csv"
DEFAULT_KR_STOCK_DIVIDEND = "src/data/tickers/kr_stock_dividend_overlay_20260525.csv"
DEFAULT_OUT_CSV = "data/processed/ml/asset_quality_audit_latest.csv"
DEFAULT_OUT_SUMMARY = "data/processed/ml/asset_quality_summary_latest.json"
DEFAULT_OUT_SAMPLE = "data/processed/ml/asset_quality_manual_review_sample.csv"

AUDIT_COLUMNS = [
    "market",
    "ticker",
    "nameKr",
    "assetType",
    "qualityScore",
    "qualityLevel",
    "status",
    "recommendedMetricPolicy",
    "reasonCodes",
    "errorCount",
    "reviewCount",
    "warningCount",
    "infoCount",
    "expectedCagr",
    "beta",
    "mdd",
    "dataYears",
    "dividendYield",
    "metricsStatus",
    "dividendPolicy",
    "metricsSource",
    "dividendSource",
    "reviewReason",
    "dataVersion",
    "ruleVersion",
]

NUMERIC_FIELDS = [
    "expectedCagr",
    "priceCagr10y",
    "beta",
    "mdd",
    "dataYears",
    "dividendYield",
]


def clean(value: object) -> str:
    return str(value or "").strip()


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"CSV not found: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def write_csv(path: Path, rows: list[dict[str, object]], columns: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({column: row.get(column, "") for column in columns})


def read_json(path: Path) -> dict[str, object]:
    if not path.exists():
        raise SystemExit(f"Config not found: {path}")
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def normalize_market(value: object) -> str:
    return clean(value).upper() or "US"


def normalize_ticker(value: object) -> str:
    return clean(value).upper()


def row_key(row: dict[str, str]) -> str:
    ticker = normalize_ticker(row.get("ticker"))
    return f"{normalize_market(row.get('market'))}:{ticker}" if ticker else ""


def has_value(value: object) -> bool:
    return clean(value) != ""


def to_number(value: object) -> float | None:
    text = clean(value).replace(",", "")
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_numeric(value: object) -> tuple[float | None, bool]:
    text = clean(value).replace(",", "")
    if text == "":
        return None, False
    try:
        return float(text), False
    except ValueError:
        return None, True


def build_overlay_map(rows: Iterable[dict[str, str]]) -> dict[str, dict[str, str]]:
    output: dict[str, dict[str, str]] = {}
    for row in rows:
        key = row_key(row)
        if key:
            output[key] = row
    return output


def merge_non_blank(base: dict[str, str], overlay: dict[str, str] | None) -> dict[str, str]:
    if not overlay:
        return dict(base)
    merged = dict(base)
    for key, value in overlay.items():
        if has_value(value):
            merged[key] = value
    return merged


def load_app_ready_assets(args: argparse.Namespace) -> list[dict[str, str]]:
    base_rows = read_csv_rows(Path(args.base))
    final_overlay = build_overlay_map(read_csv_rows(Path(args.final_overlay)))
    us_price = build_overlay_map(read_csv_rows(Path(args.us_price)))
    kr_price = build_overlay_map(read_csv_rows(Path(args.kr_price)))
    us_dividend = build_overlay_map(read_csv_rows(Path(args.us_dividend)))
    kr_etf_dividend = build_overlay_map(read_csv_rows(Path(args.kr_etf_dividend)))
    kr_stock_dividend = build_overlay_map(read_csv_rows(Path(args.kr_stock_dividend)))

    price_keys = set(us_price) | set(kr_price)
    app_ready_rows = []
    for row in base_rows:
        key = row_key(row)
        if key not in price_keys:
            continue

        merged = merge_non_blank(row, final_overlay.get(key))
        merged = merge_non_blank(merged, kr_etf_dividend.get(key))
        merged = merge_non_blank(merged, kr_stock_dividend.get(key))
        merged = merge_non_blank(merged, us_dividend.get(key))
        merged = merge_non_blank(merged, us_price.get(key))
        merged = merge_non_blank(merged, kr_price.get(key))
        app_ready_rows.append(merged)
    return app_ready_rows


def rules_by_code(config: dict[str, object]) -> dict[str, dict[str, str]]:
    return {
        str(rule["code"]): {
            "severity": str(rule["severity"]),
            "description": str(rule.get("description", "")),
        }
        for rule in config.get("rules", [])
    }


def add_reason(reasons: list[dict[str, str]], rules: dict[str, dict[str, str]], code: str) -> None:
    rule = rules.get(code)
    if not rule:
        raise KeyError(f"Rule code missing from config: {code}")
    reasons.append({"code": code, "severity": rule["severity"]})


def validate_ticker(row: dict[str, str]) -> bool:
    market = normalize_market(row.get("market"))
    ticker = normalize_ticker(row.get("ticker"))
    if not ticker:
        return False
    if market == "KR":
        return bool(re.fullmatch(r"\d{6}", ticker))
    if market == "US":
        return bool(re.fullmatch(r"[A-Z0-9.-]{1,12}", ticker))
    return bool(re.fullmatch(r"[A-Z0-9.-]{1,16}", ticker))


def evaluate_asset_row(row: dict[str, str], config: dict[str, object]) -> dict[str, object]:
    rules = rules_by_code(config)
    thresholds = config["thresholds"]
    reasons: list[dict[str, str]] = []

    for field in ["market", "ticker", "nameKr", "assetType"]:
        if not has_value(row.get(field)):
            add_reason(reasons, rules, "REQUIRED_MISSING")
            break

    if not validate_ticker(row):
        add_reason(reasons, rules, "TICKER_FORMAT")

    numeric_values: dict[str, float | None] = {}
    for field in NUMERIC_FIELDS:
        number, invalid = parse_numeric(row.get(field))
        numeric_values[field] = number
        if invalid:
            add_reason(reasons, rules, "METRIC_INVALID_NUMERIC")

    if numeric_values["expectedCagr"] is None:
        add_reason(reasons, rules, "EXPECTED_CAGR_MISSING")
    elif numeric_values["expectedCagr"] < thresholds["cagr_min"] or numeric_values["expectedCagr"] > thresholds["cagr_max"]:
        add_reason(reasons, rules, "CAGR_EXTREME")

    if numeric_values["beta"] is None:
        add_reason(reasons, rules, "BETA_MISSING")
    elif numeric_values["beta"] < thresholds["beta_min"] or numeric_values["beta"] > thresholds["beta_max"]:
        add_reason(reasons, rules, "BETA_EXTREME")

    if numeric_values["mdd"] is None:
        add_reason(reasons, rules, "MDD_MISSING")
    else:
        if numeric_values["mdd"] > 0:
            add_reason(reasons, rules, "MDD_POSITIVE")
        if numeric_values["mdd"] < thresholds["mdd_min"]:
            add_reason(reasons, rules, "MDD_OUT_OF_RANGE")

    data_years = numeric_values["dataYears"]
    if data_years is None:
        add_reason(reasons, rules, "DATA_YEARS_MISSING")
    else:
        if data_years < thresholds["short_history_years"]:
            add_reason(reasons, rules, "SHORT_HISTORY")
        if has_value(row.get("priceCagr10y")) and data_years < thresholds["data_period_mismatch_years"] and clean(row.get("metricsStatus")) == "ready":
            add_reason(reasons, rules, "DATA_PERIOD_MISMATCH")

    dividend_yield = numeric_values["dividendYield"]
    dividend_policy = clean(row.get("dividendPolicy"))
    if clean(row.get("metricsStatus")) == "review_required":
        add_reason(reasons, rules, "PRICE_METRICS_REVIEW_REQUIRED")

    if dividend_policy == "dividend_review_required":
        add_reason(reasons, rules, "DIVIDEND_REVIEW_REQUIRED")

    if dividend_yield is None:
        if dividend_policy != "no_dividend_confirmed":
            add_reason(reasons, rules, "DIVIDEND_MISSING")
    elif dividend_yield == 0 and dividend_policy == "no_dividend_confirmed":
        add_reason(reasons, rules, "DIVIDEND_CONFIRMED_ZERO")
    elif dividend_yield > thresholds["dividend_yield_max"]:
        add_reason(reasons, rules, "DIVIDEND_EXTREME")

    severity_counts = Counter(reason["severity"] for reason in reasons)
    score_config = config["score"]
    score = int(score_config["start"])
    score -= severity_counts["error"] * int(score_config["error"])
    score -= severity_counts["review"] * int(score_config["review"])
    score -= severity_counts["warning"] * int(score_config["warning"])
    score = max(int(score_config["minimum"]), score)

    if severity_counts["error"]:
        status = "invalid"
        recommended_policy = "exclude_until_fixed"
    elif severity_counts["review"]:
        status = "review"
        recommended_policy = "use_with_review"
    elif severity_counts["warning"]:
        status = "warning"
        recommended_policy = "use_with_warning"
    else:
        status = "valid"
        recommended_policy = "use"

    if score >= 90:
        quality_level = "high"
    elif score >= 70:
        quality_level = "medium"
    else:
        quality_level = "low"

    return {
        "qualityScore": score,
        "qualityLevel": quality_level,
        "status": status,
        "recommendedMetricPolicy": recommended_policy,
        "reasonCodes": "|".join(reason["code"] for reason in reasons),
        "errorCount": severity_counts["error"],
        "reviewCount": severity_counts["review"],
        "warningCount": severity_counts["warning"],
        "infoCount": severity_counts["info"],
        "reasons": reasons,
    }


def build_audit_rows(rows: list[dict[str, str]], config: dict[str, object]) -> list[dict[str, object]]:
    output = []
    data_version = str(config.get("audit_version", ""))
    rule_version = str(config.get("version", ""))
    for row in rows:
        result = evaluate_asset_row(row, config)
        output.append({
            **{column: row.get(column, "") for column in AUDIT_COLUMNS},
            "qualityScore": result["qualityScore"],
            "qualityLevel": result["qualityLevel"],
            "status": result["status"],
            "recommendedMetricPolicy": result["recommendedMetricPolicy"],
            "reasonCodes": result["reasonCodes"],
            "errorCount": result["errorCount"],
            "reviewCount": result["reviewCount"],
            "warningCount": result["warningCount"],
            "infoCount": result["infoCount"],
            "dataVersion": data_version,
            "ruleVersion": rule_version,
        })
    return output


def build_summary(audit_rows: list[dict[str, object]], config: dict[str, object], sources: dict[str, str]) -> dict[str, object]:
    reason_counter: Counter[str] = Counter()
    for row in audit_rows:
        for code in clean(row.get("reasonCodes")).split("|"):
            if code:
                reason_counter[code] += 1

    def grouped_count(field: str) -> dict[str, int]:
        return dict(Counter(clean(row.get(field)) or "(blank)" for row in audit_rows))

    by_market_status: dict[str, dict[str, int]] = {}
    for row in audit_rows:
        market = clean(row.get("market")) or "(blank)"
        status = clean(row.get("status")) or "(blank)"
        by_market_status.setdefault(market, {})
        by_market_status[market][status] = by_market_status[market].get(status, 0) + 1

    sample_review_rows = [
        {
            "market": row.get("market", ""),
            "ticker": row.get("ticker", ""),
            "nameKr": row.get("nameKr", ""),
            "status": row.get("status", ""),
            "reasonCodes": row.get("reasonCodes", ""),
        }
        for row in audit_rows
        if clean(row.get("reasonCodes"))
    ][:50]

    return {
        "auditVersion": config.get("audit_version"),
        "ruleVersion": config.get("version"),
        "auditedAt": config.get("audited_at"),
        "sourceFiles": sources,
        "rowCount": len(audit_rows),
        "statusCounts": grouped_count("status"),
        "qualityLevelCounts": grouped_count("qualityLevel"),
        "marketCounts": grouped_count("market"),
        "assetTypeCounts": grouped_count("assetType"),
        "byMarketStatus": by_market_status,
        "reasonCodeCounts": dict(reason_counter.most_common()),
        "score": config.get("score"),
        "thresholds": config.get("thresholds"),
        "sampleReviewRows": sample_review_rows,
    }


def build_manual_review_sample(audit_rows: list[dict[str, object]], limit: int = 24) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    seen_keys: set[str] = set()
    reason_codes = sorted({
        code
        for row in audit_rows
        for code in clean(row.get("reasonCodes")).split("|")
        if code
    })

    for code in reason_codes:
        for row in audit_rows:
            key = f"{row.get('market')}:{row.get('ticker')}"
            if key in seen_keys:
                continue
            if code in clean(row.get("reasonCodes")).split("|"):
                output.append(row)
                seen_keys.add(key)
                break

    for row in audit_rows:
        if len(output) >= limit:
            break
        key = f"{row.get('market')}:{row.get('ticker')}"
        if key in seen_keys or not clean(row.get("reasonCodes")):
            continue
        output.append(row)
        seen_keys.add(key)

    return output[:limit]


def run_audit(args: argparse.Namespace) -> tuple[list[dict[str, object]], dict[str, object]]:
    config = read_json(Path(args.config))
    app_ready_rows = load_app_ready_assets(args)
    audit_rows = build_audit_rows(app_ready_rows, config)
    sources = {
        "base": args.base,
        "finalOverlay": args.final_overlay,
        "usPrice": args.us_price,
        "krPrice": args.kr_price,
        "usDividend": args.us_dividend,
        "krEtfDividend": args.kr_etf_dividend,
        "krStockDividend": args.kr_stock_dividend,
    }
    summary = build_summary(audit_rows, config, sources)
    return audit_rows, summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run FINPLE Data Sentinel rule-based metric audit.")
    parser.add_argument("--config", default=DEFAULT_CONFIG)
    parser.add_argument("--base", default=DEFAULT_BASE)
    parser.add_argument("--final-overlay", default=DEFAULT_FINAL_OVERLAY)
    parser.add_argument("--us-price", default=DEFAULT_US_PRICE)
    parser.add_argument("--kr-price", default=DEFAULT_KR_PRICE)
    parser.add_argument("--us-dividend", default=DEFAULT_US_DIVIDEND)
    parser.add_argument("--kr-etf-dividend", default=DEFAULT_KR_ETF_DIVIDEND)
    parser.add_argument("--kr-stock-dividend", default=DEFAULT_KR_STOCK_DIVIDEND)
    parser.add_argument("--out-csv", default=DEFAULT_OUT_CSV)
    parser.add_argument("--out-summary", default=DEFAULT_OUT_SUMMARY)
    parser.add_argument("--out-sample", default=DEFAULT_OUT_SAMPLE)
    args = parser.parse_args()

    audit_rows, summary = run_audit(args)
    write_csv(Path(args.out_csv), audit_rows, AUDIT_COLUMNS)
    write_csv(Path(args.out_sample), build_manual_review_sample(audit_rows), AUDIT_COLUMNS)
    summary_path = Path(args.out_summary)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Saved Data Sentinel audit CSV: {args.out_csv}")
    print(f"Saved Data Sentinel manual review sample: {args.out_sample}")
    print(f"Saved Data Sentinel summary: {args.out_summary}")
    print(json.dumps({
        "rowCount": summary["rowCount"],
        "statusCounts": summary["statusCounts"],
        "reasonCodeCounts": summary["reasonCodeCounts"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
