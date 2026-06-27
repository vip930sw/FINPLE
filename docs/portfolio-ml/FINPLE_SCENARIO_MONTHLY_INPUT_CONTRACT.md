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
| Monthly input readiness report | Implemented in Step 114-1F | `data/processed/scenario_monthly_input_readiness.json` |
| Monthly provider refetch plan | Implemented in Step 114-1G | `data/processed/scenario_monthly_refetch_plan.csv` and summary JSON |
| Rolling median policy | Implemented in Step 114-1N | US/KR representative assets share the future rolling CAGR/MDD median policy |
| P0 monthly cache manifest | Implemented in Step 114-1H | P0 representative, benchmark, and FX subset for first cache writer |
| P0 cache dry run | Implemented in Step 114-1I | Provider task contract without provider calls or monthly data writes |
| P0 source policy matrix | Implemented in Step 114-1J | Source/license approval gate before provider adapters |
| P0 source approval requirements | Implemented in Step 114-1L | Machine-readable evidence requirements before approving any P0 source row |
| P0 source approval decision record | Implemented in Step 114-1M | Pending provider/license decision register for the five P0 source groups |
| P0 provider candidate review | Implemented in Step 114-1O | Pending review checklist for endpoint/license/proxy/calendar evidence |
| P0 external provider terms review | Implemented in Step 114-1P | Official-docs-based provider terms blockers before source approval |
| P0 owner/legal decision packet | Implemented in Step 114-1Q | Owner and legal review questions before provider adapters or cache writes |
| P0 approval readiness cross-check | Implemented in Step 114-1R | Cross-checks terms, owner/legal, source policy, and writer gate before adapters |
| Monthly write preflight | Implemented in Step 114-1S | Blocks `scenario_monthly_returns.csv` before P0 approval readiness allows writes |
| P0 source approval fixture harness | Implemented in Step 114-1T | Synthetic tests prove approvals require provider, endpoint, license, raw payload, redistribution, owner/legal, reviewed-at, and evidence fields |
| P0 cache writer gate | Implemented in Step 114-1K | Blocks monthly data writes until all source-policy rows are approved |

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

## Readiness Report

The machine-readable readiness report lives at:

```text
data/processed/scenario_monthly_input_readiness.json
```

It is generated from `scenario_data_coverage.csv` and the monthly schema file. Current status:

```text
status=blocked_until_monthly_series_exists
monthlyInput=blocked_missing_monthly_return_file
readyForJointBlockBootstrap=false
scenarioGradeCounts: A=0, B=5757, C=243
```

The report intentionally keeps Bootstrap, scenario API, Compare chart scenario bands, and AI scenario integration blocked until real monthly asset, benchmark, dividend, and FX series exist.

## Provider Refetch Plan

The provider refetch plan lives at:

```text
data/processed/scenario_monthly_refetch_plan.csv
data/processed/scenario_monthly_refetch_plan_summary.json
```

It does not fetch or write monthly return data. It translates the current coverage audit into a deterministic collection plan:

```text
totalPlanRows=6003
assetRows=6000
systemRows=3
P0_representative=14
P0_benchmark=2
P0_fx=1
provider_refetch_required=5754
blocked_benchmark_policy=6
blocked_no_price_series_evidence=243
```

The three system rows are `SP500_TR`, `KOSPI200_TR`, and `USD_KRW`. The monthly data target remains `data/processed/scenario_monthly_returns.csv`.

## Rolling Median Policy

The rolling median policy lives at:

```text
data/processed/scenario_rolling_median_policy.json
```

It records that representative US and KR assets should both use rolling 10-year median treatment after validated monthly series exist:

```text
representatives=14
usRepresentatives=8
krRepresentatives=6
usRollingMedianPolicyApplied=true
krRollingMedianPolicyApplied=true
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

This policy is intentionally blocked until monthly data exists. It prevents the future overlay from applying rolling median only to KR rows while leaving US representative rows on raw endpoint-sensitive CAGR/MDD.

## P0 Cache Manifest

The first controlled cache writer should start from:

```text
data/processed/scenario_p0_monthly_cache_manifest.csv
data/processed/scenario_p0_monthly_cache_manifest_summary.json
```

The manifest is a strict subset of the refetch plan:

```text
totalRows=17
representativeAssetRows=14
benchmarkRows=2
fxRows=1
provider_refetch_required=11
blocked_benchmark_policy=6
```

This keeps the first data-writing step focused on the required representative assets, `SP500_TR`, `KOSPI200_TR`, and `USD_KRW`. It still does not write `scenario_monthly_returns.csv`; Bootstrap remains blocked.

## P0 Cache Dry Run

The dry-run task contract lives at:

```text
data/processed/scenario_p0_monthly_cache_dry_run.json
```

It validates the P0 manifest and monthly schema, then expands each P0 row into a provider task without making provider calls:

```text
totalTasks=17
assetTasks=14
benchmarkTasks=2
fxTasks=1
providerCallsMade=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

Each task records required source metadata: `providerName`, `providerEndpoint`, `requestedAt`, `rawPayloadHash`, `licensePolicy`, and `sourceVersion`. The next step can replace the `dry_run_only_no_provider_call` action with a provider adapter only after source and license policy are reviewed.

## P0 Source Policy Matrix

The source policy matrix lives at:

```text
data/processed/scenario_p0_source_policy_matrix.csv
data/processed/scenario_p0_source_policy_matrix_summary.json
```

It does not select a provider or approve data redistribution. It keeps all 17 P0 rows blocked until the source, endpoint, refresh cadence, raw-payload storage, and license policy are approved:

```text
totalRows=17
status=blocked_source_policy_review
providerEndpointSelected=false
licensePolicyReviewed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

This makes the current data-quality progress explicit: governance, schema, validation, and planning are mostly in place; production-grade monthly return data is still not populated.

## P0 Source Approval Requirements

The source approval requirements live at:

```text
data/processed/scenario_p0_source_approval_requirements.json
```

They turn the source-policy blocker into a machine-readable checklist. This file does not approve a provider, make provider calls, or write monthly returns. It defines the evidence required before any P0 row can move to `approved_source_policy`:

```text
totalRows=17
approvedRows=0
pendingRows=17
providerGroups=5
providerCallsAllowed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

The current provider groups are US asset series, KR asset series, S&P 500 total-return or proxy benchmark, KOSPI 200 total-return or proxy benchmark, and USD/KRW FX. Each group must document endpoint selection, license/redistribution policy, raw payload hash or retention policy, and the monthly derived return basis before the writer gate can be opened.

## P0 Source Approval Decision Record

The source approval decision record lives at:

```text
data/processed/scenario_p0_source_approval_decision_record.csv
data/processed/scenario_p0_source_approval_decision_record_summary.json
```

It is a five-row register for the P0 source groups. It keeps every provider group in `pending_decision` until a reviewer records selected provider, endpoint, license decision, raw payload policy, and redistribution decision:

```text
providerGroups=5
decidedGroups=0
pendingGroups=5
providerCallsAllowed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

This record is intentionally not an approval. It is the next input required before the source policy matrix can be changed from `blocked_source_policy_review` to `approved_source_policy`.

## P0 Provider Candidate Review

The provider candidate review lives at:

```text
data/processed/scenario_p0_provider_candidate_review.csv
data/processed/scenario_p0_provider_candidate_review_summary.json
```

It expands the five pending source groups into review requirements for endpoint evidence, license evidence, required data fields, quality checks, proxy rules, calendar rules, and currency rules:

```text
providerGroups=5
selectedProviders=0
pendingReviews=5
providerCallsAllowed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

This file intentionally does not name or approve a provider. A named provider, endpoint URL, license decision, raw payload policy, and redistribution policy must be reviewed before any source row can be approved.

## P0 External Provider Terms Review

The external provider terms review lives at:

```text
data/processed/scenario_p0_external_provider_terms_review.csv
data/processed/scenario_p0_external_provider_terms_review_summary.json
```

It records named provider candidates and official documentation or terms URLs for the five P0 source groups while keeping all candidates unapproved:

```text
providerCandidates=5
approvedProviders=0
blockedProviders=5
providerCallsAllowed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

The current candidates are Alpha Vantage for US asset/index/proxy review, Korea Investment Open API or licensed KR market-data provider for KR ETF series, KRX Data Marketplace or licensed KOSPI 200 ETF proxy for KR benchmark review, and FRED DEXKOUS for USD/KRW review. These are evidence rows, not approvals; source rows remain blocked until owner/legal review confirms commercial use, redistribution, raw payload, cache, citation, and display-label policy.

## P0 Owner/Legal Decision Packet

The owner/legal decision packet lives at:

```text
data/processed/scenario_p0_owner_legal_decision_packet.csv
data/processed/scenario_p0_owner_legal_decision_packet_summary.json
```

It converts the external provider terms review into explicit owner/legal questions for the five P0 source groups:

```text
providerCandidates=5
pendingOwnerLegalReview=5
approvedForAdapter=0
approvedForMonthlyWrite=0
providerCallsAllowed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

The packet asks for provider selection, commercial-use approval, redistribution policy, raw payload retention or hash policy, internal derived-cache retention, attribution/citation requirements, and display-label policy. It is intentionally a blocker, not an approval: provider adapters and `scenario_monthly_returns.csv` writes remain disallowed until the packet is reviewed and a later source-policy approval step records explicit approvals.

## P0 Approval Readiness Cross-Check

The approval readiness report lives at:

```text
data/processed/scenario_p0_approval_readiness.json
```

It cross-checks the source policy matrix, source approval decision record, external provider terms review, owner/legal decision packet, and cache writer gate before any provider adapter or monthly cache writer is allowed:

```text
providerCandidates=5
sourcePolicyRows=17
sourceDecisionRows=5
termsApproved=0
ownerAdapterApproved=0
ownerMonthlyApproved=0
sourcePolicyApproved=0
safeToImplementProviderAdapter=false
safeToWriteMonthlyData=false
bootstrapStillBlocked=true
```

The report fails if provider candidates drift across the gate files, if any `approved_source_policy` row lacks selected provider, endpoint, license, raw payload, redistribution, owner/legal, review timestamp, or evidence fields, or if the writer gate allows provider calls or monthly writes before terms, owner/legal, and source-policy approvals are complete. This keeps the next implementation boundary explicit: adapters and `scenario_monthly_returns.csv` writes remain blocked until all approval layers agree.

## Monthly Write Preflight

The monthly write preflight report lives at:

```text
data/processed/scenario_monthly_write_preflight.json
```

It checks the approval readiness report and the future monthly data target before any monthly cache writer is allowed:

```text
monthlyFileExists=false
approvalStatus=blocked_pending_p0_approvals
safeToWriteMonthlyData=false
providerCallsAllowed=false
canAttemptMonthlyWrite=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

The preflight fails if `data/processed/scenario_monthly_returns.csv` exists while P0 approval readiness is still blocked, or while provider calls are not allowed. This keeps the current repository state explicit: the schema and gates exist, but no monthly return data file should be committed until source-policy, owner/legal, and writer approvals are complete.

## P0 Cache Writer Gate

The writer gate lives at:

```text
data/processed/scenario_p0_cache_writer_gate.json
```

It reads the source policy matrix and blocks provider calls or monthly data writes unless every P0 source row is explicitly approved:

```text
totalRows=17
approvedRows=0
blockedRows=17
canWriteMonthlyData=false
providerCallsAllowed=false
monthlyDataFileWritten=false
bootstrapStillBlocked=true
```

The gate is intentionally strict. A future provider adapter should depend on this output before writing `data/processed/scenario_monthly_returns.csv`.

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
npm.cmd run check:scenario-readiness
npm.cmd run check:scenario-refetch-plan
npm.cmd run check:scenario-rolling-median-policy
npm.cmd run check:scenario-p0-manifest
npm.cmd run check:scenario-p0-dry-run
npm.cmd run check:scenario-p0-source-policy
npm.cmd run check:scenario-p0-source-approval
npm.cmd run check:scenario-p0-source-decision
npm.cmd run check:scenario-p0-provider-review
npm.cmd run check:scenario-p0-external-terms
npm.cmd run check:scenario-p0-owner-legal
npm.cmd run check:scenario-p0-approval-readiness
npm.cmd run check:scenario-monthly-write-preflight
npm.cmd run check:scenario-p0-writer-gate
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
