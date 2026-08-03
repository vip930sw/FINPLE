# FINPLE Step 4·5 Eligibility and Coverage Specification

Date: 2026-08-04  
Execution issue: #430  
Parent program: #429

## 1. Purpose

Define a reproducible, read-only inventory that measures actual Step 4 Probability Analysis and Step 5 External Shock Analysis availability across the 6,029-asset runtime catalog.

This specification exists to prevent three reporting errors:

1. counting an `expected_blocked` test as numeric-analysis availability;
2. treating all blocked assets as the same technical problem;
3. using total asset count alone to estimate Personal-plan value.

## 2. Inputs

Codex must discover and report the exact repository paths and binding identifiers before implementation. Expected input classes include:

- the current runtime canonical catalog;
- the pinned Production monthly-return release manifest;
- monthly identity index and shards;
- catalog policy by identity;
- Step 3 eligibility/calculation path;
- shared Step 4/5 monthly lineage validator;
- Step 5 Beta source and validation path;
- official preset definitions;
- US/KR Investment MBTI preset definitions;
- a canonical popularity/high-use source, only if one already exists.

The inventory must use repository-pinned inputs. It must not call external providers or regenerate source market data.

## 3. Unit of analysis

The primary unit is one normalized identity:

```text
MARKET:TICKER
```

Every runtime identity must appear exactly once in the machine-readable output.

Portfolio-level coverage is derived from identity-level states and target weights. Portfolio-level reporting must not silently remove or reweight blocked identities.

## 4. Primary state taxonomy

Each identity receives exactly one primary state. Secondary evidence flags may be recorded separately.

### `ready`

Step 4 and Step 5 required monthly-data policy is satisfied, history is adequate, and Step 5 Beta is valid.

### `missing_monthly_identity`

The monthly artifact does not contain the normalized identity or the identity cannot be resolved to a monthly series.

### `short_history_lt_60`

A valid direct series exists but the usable contiguous history is below the current 60-month Step 4/5 floor.

### `proxy_marked`

Rows or policy evidence indicate proxy use. This remains blocked under the current direct-data Production policy.

### `legacy_unproven`

Legacy rows exist, but direct/non-proxy lineage is not proven under the pinned Production binding and catalog policy.

### `review_required`

Catalog or review state has not reached the approved ready/no-review state.

### `identity_mismatch`

Catalog, monthly rows, or mapped market/ticker identity disagree.

### `missing_or_invalid_beta`

Step 4 monthly analysis may otherwise be eligible, but Step 5 cannot produce a valid market-Beta shock because Beta is missing or invalid.

### `missing_or_invalid_metrics`

Step 3 or required identity metadata is missing or invalid in a way that prevents a stable portfolio contract.

### `other_policy_block`

A fail-closed state not represented above. The output must retain a safe reason category and a non-public diagnostic code for checker use only; raw diagnostics must not appear in the human-readable report.

## 5. Classification precedence

Classification order must be deterministic and documented. Recommended precedence:

1. invalid/duplicate/identity mismatch;
2. missing monthly identity;
3. proxy-marked;
4. legacy-unproven or review-required;
5. short history;
6. missing/invalid Step 3 metrics;
7. missing/invalid Beta;
8. ready;
9. other policy block.

The implementation may refine this order if existing canonical validators impose a different fail-closed priority. Any difference must be reported before coding and locked by tests.

## 6. Per-asset output schema

Required safe fields:

```text
identity
market
ticker
displayName
assetType
productType
step3State
monthlyIdentityPresent
availableHistoryMonths
contiguousHistoryMonths
dataStartMonth
dataEndMonth
monthlyRowContract
proxyState
lineageState
catalogDataStatus
catalogMetricsStatus
catalogReviewState
betaValid
step4State
step4ReasonCategory
step5State
step5ReasonCategory
primaryEligibilityState
secondaryFlags
officialPresetUsage
usMbtiUsage
krMbtiUsage
highUseCohortMembership
recommendedRemediationClass
```

Optional safe fields may be added when needed for reconciliation. Do not include:

- source hashes;
- approval identities;
- credentials or environment values;
- raw provider payloads;
- user IDs or portfolio contents;
- raw internal exception messages in the Markdown report.

## 7. Remediation classes

Each blocked asset should be assigned one recommended class:

- `direct_lineage_metadata_repair`
- `review_completion`
- `identity_mapping_repair`
- `beta_repair`
- `direct_monthly_data_missing`
- `direct_history_too_short`
- `proxy_only_currently`
- `unsupported_product_policy`
- `needs_manual_audit`

`KR:069500` must receive an explicit evidence-based audit row; it must not be forced into `ready`.

## 8. Coverage dimensions

## 8.1 Overall catalog

Report counts and percentages for all primary states:

- total exactly 6,029;
- KR and US totals;
- Step 3 available;
- Step 4 numeric ready;
- Step 5 numeric ready;
- Step 4 ready but Step 5 blocked by Beta;
- each blocked category.

## 8.2 Official presets

For every runtime official preset, report:

- asset identities and weights;
- blocked identities;
- blocked weight share;
- Step 3 state;
- Step 4 state;
- Step 5 moderate/severe state;
- primary user-safe reason;
- whether remediation is direct-lineage feasible.

## 8.3 Investment MBTI

Report every 16 US and 16 KR type:

- type ID and display name;
- identities and weights;
- blocked identities and weight share;
- Step 3/4/5 states;
- common-history months where policy allows calculation;
- remediation dependency.

The report must state explicitly that an expected policy block is not advanced-analysis availability.

## 8.4 High-use/popular cohort

Use only an existing canonical source, such as approved aggregate usage telemetry or a maintained product list. Do not infer popularity from catalog ordering, names, market cap assumptions, or model knowledge.

If no source exists, output:

```text
highUseCoverageStatus: unavailable_no_canonical_source
```

and propose a separate privacy-safe telemetry plan.

## 8.5 Saved-portfolio aggregate

Use only an existing privacy-safe aggregate. Do not query or publish user-level holdings. If no aggregate exists, mark the dimension unavailable.

## 9. Required reports

Recommended non-runtime output paths:

```text
reports/portfolio-analysis/step4-step5-eligibility-inventory.json
reports/portfolio-analysis/step4-step5-eligibility-summary.md
```

Alternative paths are allowed if repository conventions require them. Generated output must be deterministic and sorted by normalized identity.

The Markdown summary must include:

1. input binding and generation timestamp;
2. total reconciliation table;
3. state distribution overall and by market;
4. official preset coverage;
5. US/KR MBTI coverage;
6. high-use and saved-portfolio availability status;
7. top high-impact blocked identities;
8. remediation ranking;
9. explicit audit for `KR:069500`, `US:VNQ`, and `US:BLOK`;
10. Personal-plan product implications;
11. limitations and privacy statement.

## 10. Impact ranking

Raw blocked count is insufficient. The ranking score should be transparent and built from available evidence, such as:

- number of official presets affected;
- number of MBTI types affected;
- blocked target-weight share;
- high-use cohort membership;
- direct monthly rows present;
- metadata/review-only repair feasibility;
- artifact/release operational risk.

Do not fabricate weights when a dimension is unavailable. Report the scoring formula and unavailable dimensions.

## 11. Checker contract

Suggested command:

```text
npm.cmd run check:step4-step5-eligibility-coverage
```

The checker must fail on:

- runtime asset count not equal to 6,029;
- duplicate normalized identity;
- identity missing a primary state;
- unknown taxonomy value;
- state counts not reconciling;
- market totals not reconciling;
- official preset or MBTI matrix omission;
- blocked portfolio weight outside 0–100%;
- `expected_blocked` included in numeric-ready count;
- nondeterministic output ordering;
- accidental secret, source hash, approval identity, or user-level data in the public report.

## 12. Characterization tests

At minimum include cases for:

- direct proxy-aware ready identity;
- missing monthly identity;
- 59-month direct history;
- proxy-marked rows;
- legacy-unproven allowed and denied cases;
- review-required catalog record;
- identity mismatch;
- valid Step 4 but missing Beta for Step 5;
- `KR:069500`, `US:VNQ`, and `US:BLOK` current pinned states;
- official preset blocked-weight calculation;
- MBTI matrix completeness;
- unavailable popularity source;
- no user-level saved-portfolio source.

## 13. Privacy and safety

This task is read-only with respect to runtime data and user data.

Prohibited:

- external data calls;
- provider credentials;
- DB writes or migrations;
- user-level holdings export;
- canonical/public CSV changes;
- pinned monthly artifact changes;
- Production environment or ref changes;
- proxy enablement;
- lineage relaxation;
- automatic asset exclusion or reweighting.

## 14. Acceptance gate

The inventory Draft PR can be reviewed when:

- all 6,029 assets reconcile;
- reports are deterministic;
- current pinned states are reproduced;
- official and MBTI matrices are complete;
- privacy boundaries are confirmed;
- no runtime code behavior changes;
- no Production mutation occurs;
- the report recommends evidence-based P0C priorities without implementing them.
