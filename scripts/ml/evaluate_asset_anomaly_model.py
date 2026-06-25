"""Evaluate FINPLE asset anomaly experiment outputs.

This Step 113-2B script creates a reproducible proxy evaluation for the
offline anomaly experiment. It compares ML anomaly statuses against the current
rule-based Data Sentinel statuses, but does not treat rule status as a final
human label.
"""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from pathlib import Path


DEFAULT_INPUT = "data/processed/ml/asset_anomaly_experiment_latest.csv"
DEFAULT_OUT_SUMMARY = "data/processed/ml/asset_anomaly_evaluation_latest.json"
DEFAULT_OUT_DISAGREEMENTS = "data/processed/ml/asset_anomaly_disagreement_sample.csv"

DISAGREEMENT_COLUMNS = [
    "disagreementType",
    "market",
    "ticker",
    "nameKr",
    "assetType",
    "mlAnomalyScore",
    "mlAnomalyStatus",
    "mlTopFeature",
    "mlTopFeatureZ",
    "ruleStatus",
    "reasonCodes",
    "expectedCagr",
    "beta",
    "mdd",
    "dataYears",
    "dividendYield",
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


def to_float(value: object) -> float:
    try:
        return float(clean(value).replace(",", ""))
    except ValueError:
        return 0.0


def is_rule_actionable(row: dict[str, str]) -> bool:
    return clean(row.get("status")) in {"review", "invalid"}


def is_ml_review(row: dict[str, str]) -> bool:
    return clean(row.get("mlAnomalyStatus")) == "ml_review"


def is_ml_watch_or_review(row: dict[str, str]) -> bool:
    return clean(row.get("mlAnomalyStatus")) in {"ml_watch", "ml_review"}


def pct(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


def count_by(rows: list[dict[str, str]], field: str) -> dict[str, int]:
    return dict(Counter(clean(row.get(field)) or "(blank)" for row in rows))


def crosstab(rows: list[dict[str, str]], left_field: str, right_field: str) -> dict[str, dict[str, int]]:
    table: dict[str, dict[str, int]] = {}
    for row in rows:
        left = clean(row.get(left_field)) or "(blank)"
        right = clean(row.get(right_field)) or "(blank)"
        table.setdefault(left, {})
        table[left][right] = table[left].get(right, 0) + 1
    return table


def summarize_segment(rows: list[dict[str, str]], segment_field: str) -> dict[str, dict[str, int]]:
    output: dict[str, dict[str, int]] = {}
    for row in rows:
        segment = clean(row.get(segment_field)) or "(blank)"
        output.setdefault(segment, {"rowCount": 0, "ruleActionable": 0, "mlReview": 0, "mlWatchOrReview": 0})
        output[segment]["rowCount"] += 1
        if is_rule_actionable(row):
            output[segment]["ruleActionable"] += 1
        if is_ml_review(row):
            output[segment]["mlReview"] += 1
        if is_ml_watch_or_review(row):
            output[segment]["mlWatchOrReview"] += 1
    return output


def build_disagreement_sample(rows: list[dict[str, str]], limit: int = 80) -> list[dict[str, object]]:
    disagreements: list[dict[str, object]] = []
    for row in rows:
        disagreement_type = ""
        if is_ml_watch_or_review(row) and not is_rule_actionable(row):
            disagreement_type = "ml_flagged_rule_non_actionable"
        elif is_rule_actionable(row) and not is_ml_watch_or_review(row):
            disagreement_type = "rule_actionable_ml_normal"

        if not disagreement_type:
            continue

        disagreements.append({
            "disagreementType": disagreement_type,
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
            "expectedCagr": row.get("expectedCagr", ""),
            "beta": row.get("beta", ""),
            "mdd": row.get("mdd", ""),
            "dataYears": row.get("dataYears", ""),
            "dividendYield": row.get("dividendYield", ""),
        })

    return sorted(disagreements, key=lambda row: to_float(row.get("mlAnomalyScore")), reverse=True)[:limit]


def build_evaluation(rows: list[dict[str, str]], source_file: str) -> dict[str, object]:
    rule_actionable = sum(1 for row in rows if is_rule_actionable(row))
    ml_review = sum(1 for row in rows if is_ml_review(row))
    ml_watch_or_review = sum(1 for row in rows if is_ml_watch_or_review(row))
    review_overlap = sum(1 for row in rows if is_rule_actionable(row) and is_ml_review(row))
    watch_review_overlap = sum(1 for row in rows if is_rule_actionable(row) and is_ml_watch_or_review(row))
    ml_new_candidates = sum(1 for row in rows if is_ml_watch_or_review(row) and not is_rule_actionable(row))
    rule_missed_by_ml = sum(1 for row in rows if is_rule_actionable(row) and not is_ml_watch_or_review(row))

    return {
        "evaluationVersion": "step113-2b-20260625",
        "sourceFile": source_file,
        "rowCount": len(rows),
        "labelPolicy": "proxy_rule_status_not_human_label",
        "ruleActionableStatuses": ["review", "invalid"],
        "mlActionableStatuses": ["ml_watch", "ml_review"],
        "counts": {
            "ruleActionable": rule_actionable,
            "mlReview": ml_review,
            "mlWatchOrReview": ml_watch_or_review,
            "ruleAndMlReviewOverlap": review_overlap,
            "ruleAndMlWatchOrReviewOverlap": watch_review_overlap,
            "mlFlaggedRuleNonActionable": ml_new_candidates,
            "ruleActionableMlNormal": rule_missed_by_ml,
        },
        "proxyMetrics": {
            "mlReviewProxyPrecisionVsRuleActionable": pct(review_overlap, ml_review),
            "mlReviewProxyRecallVsRuleActionable": pct(review_overlap, rule_actionable),
            "mlWatchOrReviewProxyPrecisionVsRuleActionable": pct(watch_review_overlap, ml_watch_or_review),
            "mlWatchOrReviewProxyRecallVsRuleActionable": pct(watch_review_overlap, rule_actionable),
        },
        "statusCounts": {
            "ruleStatus": count_by(rows, "status"),
            "mlAnomalyStatus": count_by(rows, "mlAnomalyStatus"),
        },
        "crosstabs": {
            "ruleStatusByMlAnomalyStatus": crosstab(rows, "status", "mlAnomalyStatus"),
            "marketByMlAnomalyStatus": crosstab(rows, "market", "mlAnomalyStatus"),
            "assetTypeByMlAnomalyStatus": crosstab(rows, "assetType", "mlAnomalyStatus"),
        },
        "segments": {
            "market": summarize_segment(rows, "market"),
            "assetType": summarize_segment(rows, "assetType"),
        },
        "notes": [
            "This evaluation uses rule status as a proxy, not a human-reviewed ground truth label.",
            "mlFlaggedRuleNonActionable rows are discovery candidates, not false positives by default.",
            "ruleActionableMlNormal rows should be inspected before using ML output in any blocking workflow.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate FINPLE asset anomaly experiment.")
    parser.add_argument("--input-csv", default=DEFAULT_INPUT)
    parser.add_argument("--out-summary", default=DEFAULT_OUT_SUMMARY)
    parser.add_argument("--out-disagreements", default=DEFAULT_OUT_DISAGREEMENTS)
    args = parser.parse_args()

    rows = read_csv_rows(Path(args.input_csv))
    summary = build_evaluation(rows, args.input_csv)
    disagreements = build_disagreement_sample(rows)

    summary_path = Path(args.out_summary)
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_csv(Path(args.out_disagreements), disagreements, DISAGREEMENT_COLUMNS)

    print(f"Saved asset anomaly evaluation summary: {args.out_summary}")
    print(f"Saved asset anomaly disagreement sample: {args.out_disagreements}")
    print(json.dumps({
        "rowCount": summary["rowCount"],
        "counts": summary["counts"],
        "proxyMetrics": summary["proxyMetrics"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
