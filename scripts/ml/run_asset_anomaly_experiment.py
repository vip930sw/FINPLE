"""Run FINPLE offline asset anomaly experiment.

This Step 113-2A script reads the Data Sentinel rule audit CSV and adds a
separate unsupervised anomaly view. It does not rewrite runtime data and does
not train or save a model binary.
"""

from __future__ import annotations

import argparse
import csv
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable


DEFAULT_CONFIG = "scripts/ml/config/asset_anomaly_experiment.json"
DEFAULT_INPUT = "data/processed/ml/asset_quality_audit_latest.csv"
DEFAULT_OUT_CSV = "data/processed/ml/asset_anomaly_experiment_latest.csv"
DEFAULT_OUT_SUMMARY = "data/processed/ml/asset_anomaly_experiment_summary_latest.json"
DEFAULT_OUT_SAMPLE = "data/processed/ml/asset_anomaly_review_sample.csv"

OUTPUT_COLUMNS = [
    "market",
    "ticker",
    "nameKr",
    "assetType",
    "mlAnomalyScore",
    "mlAnomalyLevel",
    "mlAnomalyStatus",
    "mlTopFeature",
    "mlTopFeatureZ",
    "mlFeatureZScores",
    "mlImputedFields",
    "qualityScore",
    "qualityLevel",
    "status",
    "reasonCodes",
    "expectedCagr",
    "beta",
    "mdd",
    "dataYears",
    "dividendYield",
    "metricsStatus",
    "dividendPolicy",
    "experimentVersion",
    "algorithm",
]


def clean(value: object) -> str:
    return str(value or "").strip()


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Input CSV not found: {path}")
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


def to_number(value: object) -> float | None:
    text = clean(value).replace(",", "")
    if text == "":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def median(values: Iterable[float]) -> float:
    values = list(values)
    if not values:
        return 0.0
    return float(statistics.median(values))


def median_absolute_deviation(values: Iterable[float], center: float) -> float:
    values = list(values)
    if not values:
        return 0.0
    return float(statistics.median(abs(value - center) for value in values))


def group_key(row: dict[str, str], group_fields: list[str]) -> str:
    return ":".join(clean(row.get(field)) or "(blank)" for field in group_fields)


def collect_group_values(
    rows: list[dict[str, str]],
    group_fields: list[str],
    feature_fields: list[str],
) -> tuple[dict[str, dict[str, list[float]]], dict[str, list[float]]]:
    grouped: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    global_values: dict[str, list[float]] = defaultdict(list)

    for row in rows:
        key = group_key(row, group_fields)
        for feature in feature_fields:
            value = to_number(row.get(feature))
            if value is None:
                continue
            grouped[key][feature].append(value)
            global_values[feature].append(value)

    return grouped, global_values


def build_feature_stats(rows: list[dict[str, str]], config: dict[str, object]) -> dict[str, dict[str, dict[str, float]]]:
    group_fields = list(config["group_fields"])
    feature_fields = list(config["feature_fields"])
    min_group_size = int(config["minimum_group_size"])
    grouped, global_values = collect_group_values(rows, group_fields, feature_fields)

    global_stats = {
        feature: {
            "median": median(values),
            "mad": median_absolute_deviation(values, median(values)),
            "count": float(len(values)),
        }
        for feature, values in global_values.items()
    }

    stats: dict[str, dict[str, dict[str, float]]] = {"__global__": global_stats}
    for key, feature_map in grouped.items():
        stats[key] = {}
        for feature in feature_fields:
            values = feature_map.get(feature, [])
            if len(values) < min_group_size:
                stats[key][feature] = global_stats.get(feature, {"median": 0.0, "mad": 0.0, "count": 0.0})
                continue
            center = median(values)
            stats[key][feature] = {
                "median": center,
                "mad": median_absolute_deviation(values, center),
                "count": float(len(values)),
            }
    return stats


def robust_z(value: float, center: float, mad: float, config: dict[str, object]) -> float:
    if mad == 0:
        return 0.0 if value == center else float(config["mad_zero_fallback_z"])
    return abs(value - center) / (float(config["mad_scale"]) * mad)


def score_asset_row(
    row: dict[str, str],
    stats: dict[str, dict[str, dict[str, float]]],
    config: dict[str, object],
) -> dict[str, object]:
    key = group_key(row, list(config["group_fields"]))
    group_stats = stats.get(key, stats["__global__"])
    zscores: dict[str, float] = {}
    imputed_fields: list[str] = []

    for feature in list(config["feature_fields"]):
        feature_stats = group_stats.get(feature) or stats["__global__"].get(feature, {"median": 0.0, "mad": 0.0})
        value = to_number(row.get(feature))
        if value is None:
            value = float(feature_stats["median"])
            imputed_fields.append(feature)
        zscores[feature] = robust_z(value, float(feature_stats["median"]), float(feature_stats["mad"]), config)

    sorted_scores = sorted(zscores.items(), key=lambda item: item[1], reverse=True)
    top_n = max(1, int(config["score_top_n_features"]))
    anomaly_score = sum(score for _, score in sorted_scores[:top_n]) / min(top_n, len(sorted_scores))
    top_feature, top_feature_z = sorted_scores[0]
    thresholds = config["thresholds"]

    if anomaly_score >= float(thresholds["review_score"]) or top_feature_z >= float(thresholds["review_feature_z"]):
        status = "ml_review"
        level = "high"
    elif anomaly_score >= float(thresholds["watch_score"]):
        status = "ml_watch"
        level = "medium"
    else:
        status = "ml_normal"
        level = "low"

    return {
        "mlAnomalyScore": round(anomaly_score, 4),
        "mlAnomalyLevel": level,
        "mlAnomalyStatus": status,
        "mlTopFeature": top_feature,
        "mlTopFeatureZ": round(top_feature_z, 4),
        "mlFeatureZScores": json.dumps({key: round(value, 4) for key, value in zscores.items()}, ensure_ascii=False, sort_keys=True),
        "mlImputedFields": "|".join(imputed_fields),
    }


def build_experiment_rows(rows: list[dict[str, str]], config: dict[str, object]) -> list[dict[str, object]]:
    stats = build_feature_stats(rows, config)
    output: list[dict[str, object]] = []
    for row in rows:
        score = score_asset_row(row, stats, config)
        output.append({
            **{column: row.get(column, "") for column in OUTPUT_COLUMNS},
            **score,
            "experimentVersion": config["experiment_version"],
            "algorithm": config["algorithm"],
        })
    return output


def build_review_sample(rows: list[dict[str, object]], limit: int = 30) -> list[dict[str, object]]:
    sorted_rows = sorted(rows, key=lambda row: float(row.get("mlAnomalyScore") or 0), reverse=True)
    return sorted_rows[:limit]


def build_summary(rows: list[dict[str, object]], config: dict[str, object], source_file: str) -> dict[str, object]:
    def count(field: str) -> dict[str, int]:
        return dict(Counter(clean(row.get(field)) or "(blank)" for row in rows))

    by_market_status: dict[str, dict[str, int]] = {}
    for row in rows:
        market = clean(row.get("market")) or "(blank)"
        status = clean(row.get("mlAnomalyStatus")) or "(blank)"
        by_market_status.setdefault(market, {})
        by_market_status[market][status] = by_market_status[market].get(status, 0) + 1

    top_features = count("mlTopFeature")
    top_anomalies = [
        {
            "market": row.get("market", ""),
            "ticker": row.get("ticker", ""),
            "nameKr": row.get("nameKr", ""),
            "assetType": row.get("assetType", ""),
            "mlAnomalyScore": row.get("mlAnomalyScore", ""),
            "mlAnomalyStatus": row.get("mlAnomalyStatus", ""),
            "mlTopFeature": row.get("mlTopFeature", ""),
            "mlTopFeatureZ": row.get("mlTopFeatureZ", ""),
            "ruleStatus": row.get("status", ""),
            "reasonCodes": row.get("reasonCodes", ""),
        }
        for row in build_review_sample(rows, 20)
    ]

    return {
        "experimentVersion": config["experiment_version"],
        "algorithm": config["algorithm"],
        "auditedAt": config["audited_at"],
        "sourceFile": source_file,
        "rowCount": len(rows),
        "statusCounts": count("mlAnomalyStatus"),
        "levelCounts": count("mlAnomalyLevel"),
        "marketCounts": count("market"),
        "assetTypeCounts": count("assetType"),
        "byMarketStatus": by_market_status,
        "topFeatureCounts": top_features,
        "thresholds": config["thresholds"],
        "featureFields": config["feature_fields"],
        "groupFields": config["group_fields"],
        "topAnomalies": top_anomalies,
        "notes": config.get("notes", []),
    }


def run_experiment(args: argparse.Namespace) -> tuple[list[dict[str, object]], dict[str, object]]:
    config = read_json(Path(args.config))
    input_rows = read_csv_rows(Path(args.input_csv))
    experiment_rows = build_experiment_rows(input_rows, config)
    summary = build_summary(experiment_rows, config, args.input_csv)
    return experiment_rows, summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run FINPLE asset anomaly experiment.")
    parser.add_argument("--config", default=DEFAULT_CONFIG)
    parser.add_argument("--input-csv", default=DEFAULT_INPUT)
    parser.add_argument("--out-csv", default=DEFAULT_OUT_CSV)
    parser.add_argument("--out-summary", default=DEFAULT_OUT_SUMMARY)
    parser.add_argument("--out-sample", default=DEFAULT_OUT_SAMPLE)
    args = parser.parse_args()

    rows, summary = run_experiment(args)
    write_csv(Path(args.out_csv), rows, OUTPUT_COLUMNS)
    write_csv(Path(args.out_sample), build_review_sample(rows), OUTPUT_COLUMNS)

    summary_path = Path(args.out_summary)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Saved asset anomaly experiment CSV: {args.out_csv}")
    print(f"Saved asset anomaly review sample: {args.out_sample}")
    print(f"Saved asset anomaly experiment summary: {args.out_summary}")
    print(json.dumps({
        "rowCount": summary["rowCount"],
        "statusCounts": summary["statusCounts"],
        "topFeatureCounts": summary["topFeatureCounts"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
