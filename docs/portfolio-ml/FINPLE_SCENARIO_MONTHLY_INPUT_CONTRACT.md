# FINPLE Scenario Monthly Input Contract

Date: 2026-06-27
Issue: #221
Step: 114-1D

## Purpose

Step 114-1D adds a strict monthly time-series input contract before any joint block Bootstrap, scenario API, UI, AI, DB, or `calculatePortfolioResult()` integration work.

This step does not add real monthly return data. It adds the schema and validator that future monthly data must pass before scenario calculations can treat it as input.

## Current Data Quality Progress

| Area | Progress | Evidence |
| --- | --- | --- |
| Rule-based asset quality audit | Implemented | 5,641 audited rows in `data/processed/ml/asset_quality_audit_latest.csv` |
| ML anomaly baseline | Implemented as offline support | `data/processed/ml/asset_anomaly_experiment_latest.csv` |
| Scenario coverage audit | Implemented | 6,000 rows in `data/processed/scenario_data_coverage.csv`; A=0, B=5,757, C=243 |
| Scenario monthly time series | Not populated | No committed `scenario_monthly_returns.csv` yet |
| Monthly input quality gate | Implemented | `npm.cmd run check:scenario-monthly-input` |
| Monthly input validator regressions | Implemented in Step 114-1E | Good/bad temporary CSV cases in `scripts/verify-scenario-monthly-input.test.cjs` |

The data quality framework is now in place, but production-grade scenario inputs are still blocked until real monthly asset, benchmark, total-return, dividend, and FX series are persisted or a controlled provider-refetch cache is added.

## Schema File

The header-only contract lives at:

```text
data/processed/scenario_monthly_returns.schema.csv
```

Required columns:

```csv
market,ticker,month,priceReturn,totalReturn,closePrice,adjustedClose,dividendAmount,benchmarkId,benchmarkReturn,fxReturn,returnBasis,currency,isProxy,proxyTicker,dataSource,sourceVersion,seriesQuality,reasonCodes
```

The schema file must remain header-only. It is not sample data and must not be used as a calculation fixture.

## Future Data File

The future validated input path is:

```text
data/processed/scenario_monthly_returns.csv
```

If this file is absent, the validator passes with an explicit "not present yet" message. If the file exists, it must satisfy the schema and row-level quality checks.

## Validator Rules

`scripts/verify-scenario-monthly-input.cjs` checks:

- exact header order and required columns
- duplicate `market:ticker:month` keys
- valid US/KR market values
- valid `YYYY-MM` or `YYYY-MM-DD` month values
- finite `priceReturn` and positive `closePrice`
- optional numeric fields are blank or finite numbers
- `returnBasis` is `price` or `total_return`
- `currency` is `USD` or `KRW`
- `isProxy` is `yes` or `no`
- `seriesQuality` is `A`, `B`, or `C`
- A-grade rows include `totalReturn`, `benchmarkId`, and `benchmarkReturn`
- non-A rows include `reasonCodes`
- fields marked missing through reason codes are not filled with `0`

`scripts/verify-scenario-monthly-input.test.cjs` keeps the validator behavior pinned with temporary fixture workspaces. It verifies that the gate accepts the current header-only state, accepts a valid A-grade fixture, rejects duplicate rows, rejects A-grade rows without benchmark returns, rejects zero-filled missing total returns, and rejects schema header drift.

## Command

```powershell
npm.cmd run check:scenario-monthly-input
```

## Non-Goals

This step does not:

- fetch provider data
- persist price series
- backfill dividends
- infer total returns from dividend yield
- infer benchmark returns from BETA
- fill missing FX, benchmark, or total-return data with zero
- run Bootstrap
- add or modify API/UI/DB/runtime routes

## Next Boundary

The safe next data-quality step is a provider-refetch cache or controlled monthly fixture generator that writes `data/processed/scenario_monthly_returns.csv` with source metadata. `Step 114-2B` Bootstrap should remain blocked until that file exists and passes this validator.
