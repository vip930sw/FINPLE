# FINPLE Step238A Historical Replay Source Audit

## Purpose

Step238A audits repository-local, static, non-sensitive historical time-series candidates for a future provenance-gated offline replay. It keeps the Step235A through Step237B research pipeline unchanged and only documents whether an approved historical replay input exists.

This step does not transform data, build a historical replay adapter, run a model, optimize a strategy, call a provider, access a database, submit orders, expose UI, or change readiness flags.

## Source Policy Gate

Minimum gate for `eligible_for_internal_historical_replay`:

- Static file already committed in this repository.
- Source documented in a repository file.
- Usage scope documented as internal research validation only.
- License status documented at least as `internal_validation_only`.
- No provider credential, account data, order data, user data, secret, token, raw provider response, or provider packet.
- No redistribution or public exposure.
- Minimum fields available or directly adaptable without external calls: non-sensitive asset revision key, market, timestamp, close or adjustedClose, and frequency.
- Timestamp order, duplicate timestamp state, price positivity, finite value state, adjusted-price status, split/dividend status, and missing intervals must be auditable without refetching data.

If provenance or license evidence is unclear, the candidate is not used for replay.

## Candidate Status Definitions

| Status | Meaning |
|---|---|
| `eligible_for_internal_historical_replay` | Source, license, static data shape, and time-series quality are sufficient for a small internal replay. |
| `requires_provenance_review` | Data shape may be useful, but source lineage is not sufficient for replay. |
| `requires_license_review` | Source is visible, but license or internal-use permission is not documented enough for replay. |
| `requires_adapter` | Useful support structure exists, but it is not historical price/return rows and cannot be replayed directly. |
| `prohibited` | Do not use as replay input because it is a policy gate, provider acquisition plan, schema-only file, runtime surface, or forbidden boundary. |

## Candidate Inventory

| repositoryRelativePath | dataType | market | frequency | rowCount | firstTimestamp | lastTimestamp | priceFieldType | adjustedPriceKnown | sourceDocumented | licenseStatus | sensitiveDataDetected | providerPayloadDetected | recommendedStatus |
|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|
| `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv` | derived_price_metrics_overlay | US | derived summary | 2973 | unavailable | unavailable | derived close-price metrics | false | true | requires_license_review | false | false | `requires_license_review` |
| `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv` | derived_price_metrics_overlay | KR | derived summary | 2668 | unavailable | unavailable | derived close-price metrics | false | true | requires_license_review | false | false | `requires_license_review` |
| `data/processed/scenario_data_coverage.csv` | scenario_coverage_gate | mixed | coverage summary | 6000 | partially unavailable | partially unavailable | coverage status, not prices | false | true | blocked_source_policy_review | false | false | `requires_adapter` |
| `data/processed/scenario_monthly_returns.schema.csv` | monthly_return_schema_only | mixed | monthly schema | 0 | unavailable | unavailable | schema only | false | true | no_replay_rows | false | false | `prohibited` |
| `data/processed/scenario_p0_source_policy_matrix_summary.json` | source_policy_summary | mixed | policy summary | 17 policy rows | unavailable | unavailable | policy gate only | false | true | blocked_source_policy_review | false | false | `prohibited` |
| `data/processed/ml/asset_quality_audit_latest.csv` and `data/processed/ml/asset_anomaly_experiment_latest.csv` | derived_ml_quality_summary | mixed | derived summary | derived audit rows | unavailable | unavailable | derived metrics, not prices | false | true | requires_license_review | false | false | `requires_license_review` |

## Phase A Findings

- No audited candidate contains committed daily or monthly historical rows with timestamp plus close or adjustedClose values suitable for replay.
- The US and KR price overlay files contain derived metrics such as expected CAGR, price CAGR, MDD, beta, and data years. They do not contain point-in-time price rows, adjusted-price status, split/dividend adjustment evidence, or label windows.
- `scenario_data_coverage.csv` explicitly records provider refetch requirements and missing committed source series. It can support future exclusion logic, but it is not replay input.
- `scenario_monthly_returns.schema.csv` defines the intended monthly return shape, but it has zero data rows.
- `scenario_p0_source_policy_matrix_summary.json` records that all source-policy rows remain blocked pending source/license review and that the monthly data file is absent.
- The ML quality and anomaly outputs are derived summary artifacts, not historical price/return rows.

## Phase B Replay Decision

```json
{
  "schemaVersion": "1.0.0",
  "replayMode": "read_only_historical_internal_validation",
  "sourcePolicy": {
    "status": "blocked_by_source_policy",
    "eligibleCandidateCount": 0,
    "licenseStatus": "not_confirmed_for_replay",
    "externalRedistributionAllowed": false,
    "reason": "No repository-local candidate has documented internal-use license plus committed historical price rows required for replay."
  },
  "dataCoverage": {
    "assetsUsed": 0,
    "minimumMonthsSatisfied": false,
    "atLeastThreeWalkForwardFoldsAvailable": false,
    "priceReturnMixedWithTotalReturn": false
  },
  "walkForward": {
    "foldCount": 0,
    "trainValidationTestOverlapDetected": false
  },
  "featureCoverage": {
    "step235AFeatureBuilderExecuted": false,
    "reason": "Replay input blocked before adapter or feature generation."
  },
  "backtestMetrics": {
    "step236CBacktestExecuted": false,
    "metricsAvailable": false
  },
  "riskAdjustedMetrics": {
    "step237BRiskAdjustedValidationExecuted": false,
    "metricsAvailable": false
  },
  "checks": {
    "futureLeakageDetected": false,
    "crossSplitOverlapDetected": false,
    "duplicateTimestampDetected": false,
    "nonFiniteValueDetected": false,
    "sourcePolicyViolationDetected": false,
    "performanceClaimDetected": false
  },
  "overallStatus": "blocked_by_source_policy",
  "usage": {
    "internalResearchOnly": true,
    "performanceClaimAllowed": false,
    "modelTrainingAllowed": false,
    "paperTradingAllowed": false,
    "shadowTradingAllowed": false,
    "providerAccessAllowed": false,
    "orderSubmissionAllowed": false,
    "liveTradingAllowed": false
  },
  "readiness": {
    "actualLiveTradingReady": false,
    "state": "blocked"
  }
}
```

Because `eligibleCandidateCount` is `0`, Step238A does not build `tradingAiMlHistoricalReplayAdapter.js` or `tradingAiMlHistoricalReplayValidation.js`. This is intentional. Creating a replay over unsupported source data would violate the provenance gate.

## Leakage And Quality Boundaries

- No train, validation, or test split was produced.
- No feature window, label window, equity curve, exposure series, ticker list, or timestamp list is exposed.
- No Step235A feature builder, Step236A eligibility evaluator, Step236B position policy, Step236C backtest, Step237A regime validation, or Step237B risk-adjusted validation output is mutated.
- No current time, random value, environment value, provider response, or external fetch is used.
- No data is supplemented to overcome insufficient coverage.

## Sensitive And Public Exposure Review

- This document uses repository-relative paths only.
- It does not copy raw price rows, unredacted provider bodies, account identifiers, order payloads, credentials, tokens, secrets, private paths, hash values, digest values, or fingerprints.
- It does not expose asset lists, timestamp lists, individual historical rows, provider packets, or equity curves.
- It makes no investment, suitability, return, or real-account claim.

## Baseline Preservation

Step238A does not modify:

- Step192 runtime output.
- Step225 manifest.
- Step228 snapshot.
- Step229 through Step237B schema or policy files.
- AI/ML audit registry counts.
- CI workflows.
- `scenario_monthly_returns.csv`.
- Simulator calculation logic.
- UI, CSS, API routes, public routes, DB migrations, readiness flags, provider flags, order flags, or live trading flags.

## Next Step Candidate

A future Step238B can add a historical replay adapter only after a repository-local file satisfies the source policy gate. The cleanest input would be a small internal-validation fixture with documented license scope, monthly timestamps, close or adjustedClose, market, frequency, split/dividend adjustment notes, and at least 36 months per included asset.
