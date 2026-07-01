# FINPLE One-Click Colab Workflow

This document defines the operating workflow for generating FINPLE monthly long-term metrics CSV files with a simple Colab process.

The goal is:

```text
Upload once
Run once
Download once
Review once
Create PR
```

The Colab notebook should be easy for any operator to run, while preventing accidental changes to source files and calculation policy.

---

## 1. Target notebook

Notebook name:

```text
notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb
```

The notebook must expose only five visible sections to the operator.

```text
1. Check settings
2. Upload files
3. Run pipeline
4. Review summary
5. Download output ZIP
```

The operator should not edit calculation functions.

---

## 2. Editable area

Only the `CONFIG` block should be editable.

Example:

```python
CONFIG = {
    "metric_base_date": "2026-06-30",
    "market_scope": ["US", "KR"],
    "selected_cagr_policy": "rolling_median_all_markets",
    "min_years_for_10y": 9.5,
    "min_years_for_5y": 4.5,
    "min_years_for_inception": 3.0,
    "current_price_display": False,
    "total_return_cagr_mode": "reference_only",
    "output_version": "2026_06"
}
```

Required fixed policies:

```text
selected_cagr_policy = rolling_median_all_markets
current_price_display = False
total_return_cagr_mode = reference_only
```

---

## 3. Required input files

The Colab should request only a small number of files.

Required:

```text
finple_app_candidates_6000_balanced_v1.csv
benchmark_map.csv
```

Optional:

```text
dividend_overlay_manual.csv
source_manifest.json
```

The notebook should validate that the uploaded candidate universe contains required columns before running the pipeline.

---

## 4. Pipeline command

The notebook should run one function only:

```python
run_finple_monthly_metrics_pipeline(CONFIG)
```

Internal flow:

```text
1. Validate input files
2. Load candidate universe
3. Load or collect price data
4. Load benchmark data
5. Load dividend override data
6. Calculate raw CAGR
7. Calculate rolling CAGR
8. Calculate MDD
9. Calculate rolling BETA
10. Decide selectedCagr / selectedMdd / selectedBeta
11. Split review_required assets
12. Generate full metrics CSV
13. Generate app export CSV
14. Generate audit report
15. Generate manifest JSON
16. Generate output ZIP
```

---

## 5. Expected output ZIP

Output file name:

```text
finple_monthly_metrics_YYYY_MM_package.zip
```

Required files inside ZIP:

```text
finple_metrics_output_YYYY_MM.csv
finple_metrics_selected_YYYY_MM.csv
finple_metrics_review_required_YYYY_MM.csv
finple_metrics_audit_report_YYYY_MM.html
finple_metrics_manifest_YYYY_MM.json
```

Optional files:

```text
finple_dividend_overlay_YYYY_MM.csv
finple_metrics_debug_log_YYYY_MM.txt
```

---

## 6. One-click operator flow

The operator should follow this process.

```text
1. Open FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb
2. Confirm CONFIG only
3. Upload required input files
4. Click Runtime > Run all
5. Wait for completion
6. Read result summary
7. Download output ZIP
8. Open audit report
9. If acceptable, upload selected CSV via PR
```

---

## 7. Result summary requirements

After the pipeline runs, the notebook must print a compact summary.

Example:

```text
FINPLE Monthly Metrics Pipeline Complete

Base date: 2026-06-30
Pipeline version: metrics-v3.0
Universe count: 6000
App-ready count: 5641
Review-required count: 359
US app-ready: 2973
KR app-ready: 2668
Missing selectedCagr: 0
Missing selectedMdd: 0
Missing selectedBeta: 0
Dividend unconfirmed: 168
Output ZIP: finple_monthly_metrics_2026_06_package.zip
```

If critical errors exist, the notebook should stop and not create app export.

---

## 8. Critical stop conditions

Stop pipeline and show an error if any of the following occurs:

```text
candidate universe missing
required columns missing
market values other than US/KR without policy
Korean ticker not preserved as six-character string
benchmark_map missing required benchmark
source file hash cannot be calculated
selected_cagr_policy is not rolling_median_all_markets
current_price_display is not False
```

---

## 9. Source integrity rules

### 9.1 Do not edit raw files

Forbidden:

```text
editing raw CSV directly
opening raw KR ticker CSV in Excel and saving it again
overwriting source files
renaming files to final.csv or latest.csv
```

Allowed:

```text
adding a new monthly raw folder
generating processed outputs
creating a new monthly selected CSV
```

### 9.2 Record source hashes

The pipeline must calculate SHA256 for each input file and write the value to manifest JSON.

Reason:

```text
If the source file changes, the hash changes.
If the source file is identical, a reproducible pipeline should produce identical or explainably different results.
```

---

## 10. Automation path

### Phase 1: Manual Colab

```text
Colab Run All
-> Download ZIP
-> Manual audit
-> Manual PR
```

Recommended during early adoption.

### Phase 2: Semi-automated GitHub Actions

```text
Monthly GitHub Actions schedule
-> run Python pipeline
-> generate output package
-> create PR
-> human review and merge
```

Recommended target state.

### Phase 3: Automated merge

```text
Monthly pipeline
-> audit passes
-> auto PR
-> auto merge
-> deploy
```

Not recommended yet.

---

## 11. GitHub PR workflow

When monthly metrics are generated, create a PR with the following changes:

```text
Add data/processed/monthly/YYYY-MM/finple_metrics_manifest_YYYY_MM.json
Add data/processed/monthly/YYYY-MM/finple_metrics_review_required_YYYY_MM.csv
Add data/processed/monthly/YYYY-MM/finple_metrics_audit_report_YYYY_MM.html
Add or update src/data/tickers/finple_metrics_selected_YYYY_MM.csv
Update loader pointer only if needed
```

Do not modify unrelated UI, CSS, payment, auth, or simulator logic in the same PR.

---

## 12. Operator checklist

Before merge:

```md
- [ ] Output ZIP downloaded
- [ ] Audit report opened
- [ ] selectedCagr uses rolling median for both US and KR assets
- [ ] current price is not included in app export
- [ ] Korean tickers keep six digits
- [ ] SPY / QQQ / VOO / SCHD / TLT / GLD checked
- [ ] 005930 / 000660 / 069500 / 102110 / 133690 checked
- [ ] review_required assets excluded from app export
- [ ] metricBaseDate is visible in selected CSV
- [ ] manifest JSON includes source hashes
- [ ] Vercel Preview checked
```

---

## 13. Codex implementation stages

Implement the Colab and pipeline in small PRs.

```text
Step 114-1A: Add metrics CSV policy docs
Step 114-1B: Add schema docs
Step 114-1C: Add Colab workflow docs
Step 114-2A: Add one-click Colab notebook skeleton
Step 114-2B: Add monthly metrics pipeline script
Step 114-2C: Add audit report generator
Step 114-2D: Add GitHub Actions monthly workflow draft
Step 114-2E: Update loader to use selectedCagr only
```

The first PR should be documentation only.
