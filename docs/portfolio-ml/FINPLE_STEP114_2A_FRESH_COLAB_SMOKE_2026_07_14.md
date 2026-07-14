# FINPLE Step 114-2A / 114-2B Fresh Colab Smoke

Date: 2026-07-14
Scope: `Step 114-2A` fixture-only monthly metrics pipeline plus `Step 114-2B` raw daily normalization contract

## Purpose

This smoke procedure verifies that `notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb` can run in a fresh Google Colab runtime without assuming the FINPLE repository already exists on the Colab filesystem.

## Preferred Bootstrap

Use an uploaded execution package ZIP. Do not hardcode a private GitHub token in the notebook.

The execution package must contain these repository-relative paths:

```text
scripts/metrics_pipeline/
data/fixtures/monthly-metrics/
```

For Step 114-2B, `data/fixtures/monthly-metrics/raw_daily_prices.csv` must be included in the same fixture folder.

One simple local packaging method is to create a ZIP from the PR branch that preserves those paths plus the notebook:

```text
notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb
scripts/metrics_pipeline/
data/fixtures/monthly-metrics/
docs/portfolio-ml/FINPLE_STEP114_2A_FRESH_COLAB_SMOKE_2026_07_14.md
```

The notebook bootstrap checks the current working tree first. If those paths are not found, it asks the Colab operator to upload the execution package ZIP, extracts it under `/content/finple_step114_2b_execution_package`, locates the package root, and adds that root to `sys.path`.

## Fresh Colab Run All Procedure

1. Open a new Google Colab runtime.
2. Upload or open `notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb`.
3. Choose `Runtime > Run all`.
4. When prompted, upload the Step 114-2B execution package ZIP.
5. Confirm section 1 prints the resolved repository root.
6. Confirm section 2 prints `OK` for:
   - `candidates.csv`
   - `benchmark_map.csv`
   - `monthly_prices.csv`
   - `raw_daily_prices.csv`
7. Confirm section 4 prints:
   - `Fixture package ready: True`
   - `Production publish ready: False`
   - `App export approved: False`
8. Confirm section 5 offers the generated fixture output ZIP for download.

## Expected Output Package

The generated ZIP is a fixture package only. It is not production app approval.

Expected files:

```text
finple_metrics_output_2026_06.csv
finple_metrics_selected_2026_06.csv
finple_metrics_review_required_2026_06.csv
finple_metrics_audit_report_2026_06.html
finple_metrics_manifest_2026_06.json
finple_monthly_returns_2026_06.csv
finple_normalized_month_end_2026_06.csv
finple_timeseries_audit_2026_06.csv
```

## Guardrails

- No external API call.
- No real market-data provider call.
- No private GitHub token.
- No operating overlay or loader update.
- No simulator UI, STEP navigation, AI, auth, payment, DB, or trading change.
- `productionPublishReady` remains `false`.
- `appExportApproved` remains `false`.
