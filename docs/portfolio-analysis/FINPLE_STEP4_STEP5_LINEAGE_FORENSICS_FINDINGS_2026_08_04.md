# FINPLE Step 4/5 Lineage Forensics Findings

Date: 2026-08-04
Parent program: #429
Execution issue: #432
Inventory baseline: #430 / PR #439
Planning PR: #440
Main baseline: `a193c13790b54bf265a4cc51f72d1adbcec3cadb`
Production baseline: `3b901468857fc3a659a0272061644ac25936c409`

## 1. Scope and decision

Phase 432-A traced the preserved repository and pinned-artifact path from collection code through Step 4/5 eligibility. The investigation was read-only: it did not run Colab or a provider, regenerate an artifact, change review state or runtime behavior, deploy, or move `main` or `production`.

The central finding is:

- the 1,338 current-ready identities and 2,323 direct single-fix candidates share the same pinned candidate package and downstream normalization/export/release path;
- their current eligibility result is distinguished by frozen catalog review fields, not by monthly-row presence or a different normalization version;
- the repository does not preserve enough execution evidence to claim that every identity came from the same raw Colab collection execution;
- neither group has complete explicit row-level direct/non-proxy lineage under the current `legacy_v1` monthly-row contract.

`Direct single-fix candidate` means only that the current eligibility graph has one catalog review gate as the effective blocker after the other checked requirements pass. It does **not** mean `provenance-approved`, `review-approved`, or Production-ready.

## 2. Evidence inspected

The findings reconcile these committed inputs:

- runtime catalog: `src/data/tickers/finple_app_candidates_v2.csv`;
- universe manifest: `src/data/tickers/finple_universe_v2_manifest.json`;
- source review manifest: `public/app-data/finple-universe-v2-2026-07-24/app-preview-manifest.json`;
- Production release manifest: `public/app-data/finple-universe-v2-2026-07-24/production-app-export-release.json`;
- metrics overlay: `public/app-data/finple-universe-v2-2026-07-24/metrics-overlay.json`;
- monthly index: `public/app-data/finple-universe-v2-2026-07-24/monthly-returns-index.json`;
- 64 monthly shards under `public/app-data/finple-universe-v2-2026-07-24/monthly-returns/`;
- Step 4/5 inventory and summary under `reports/portfolio-analysis/`;
- current catalog and monthly-lineage policies;
- US/KR collection notebooks, the 29-US-delta notebook, combine scripts, candidate-package code, exporter, audit documents, and runbooks.

The raw daily inputs, source-audit CSV, external candidate ZIP, and operator execution receipt are not preserved in the repository. Their absence limits claims about the exact collector checkout, run identity, retrieval timestamp, provider session, and per-identity raw bytes.

## 3. Ready and direct-candidate common contract

All 1,338 ready identities and all 2,323 direct candidates share:

- the same pinned candidate package;
- the same normalization version;
- the same metrics calculation and calculation-policy version;
- the same app exporter;
- the same monthly index, shards, and Production release;
- a monthly identity;
- Step 3 ready state;
- valid Beta;
- at least 60 contiguous monthly observations;
- ordinary-distribution classification;
- the `legacy_v1` monthly-row contract;
- `not_proxy_marked_legacy` proxy state;
- `legacy_unproven` lineage state;
- monthly-row `dataStatus=candidate`.

The common downstream package proves a shared normalization/export/release cohort. It does not prove that the raw observations were collected in one identical Colab execution.

Group composition is:

| Group | Total | KR | US | Stock | ETF |
| --- | ---: | ---: | ---: | ---: | ---: |
| Current ready | 1,338 | 280 | 1,058 | 682 | 656 |
| Direct single-fix candidate | 2,323 | 1,120 | 1,203 | 1,689 | 634 |

The ready group contains 276,712 pinned monthly rows and the direct-candidate group contains 376,169. Every row in both sets has the legacy row-level status `candidate`.

## 4. Exact eligibility discriminator

The fields that directly distinguish the current results are:

- `dataStatus`;
- `metricsStatus`;
- `reviewFlag`.

The 1,338 ready identities are exactly:

- `dataStatus=ready`;
- `metricsStatus=ready`;
- `reviewFlag=none`;
- no separate approval status or approval-policy version.

The 2,323 direct candidates reconcile exactly as:

| Catalog state (`dataStatus / metricsStatus / reviewFlag`) | Count |
| --- | ---: |
| `ready / ready / review_required` | 1,329 |
| `short_history / short_history / short_history` | 986 |
| `review_required / review_required / review_required` | 8 |
| **Total** | **2,323** |

The current classifier gives `review_required` precedence over `legacy_unproven`. Therefore these identities have:

- primary state: `review_required`;
- secondary flag: `legacy_unproven`;
- recommended remediation class: `review_completion`.

This is a characterization of the current graph, not evidence that one generic approval decision is already available. The existing review-policy code covers only narrow cases; it does not automatically approve all threshold, short-history, gap, or split-evidence reviews.

## 5. Evidence gap in the current ready set

The 1,338 ready identities are not a fully modernized direct-lineage cohort. They retain:

- `legacy_v1` seven-field monthly rows;
- no explicit row-level `isProxy=false` field;
- no explicit row-level direct-lineage status;
- no repository-preserved per-identity collector/run receipt;
- no repository-preserved raw source audit;
- no repository-preserved external candidate receipt.

Current readiness is allowed by the exact pinned legacy release binding plus the frozen catalog fields `ready / ready / none`. The loader treats those exact identities as `ordinaryLegacyEligible`; it does not derive direct lineage from ticker name, ordering, or monthly-row existence.

The metrics overlay contains byte-binding fields for source and normalized series, but those bindings do not identify the operator run or replace the missing raw/receipt evidence. The later runtime catalog also records provider metadata, but it is a later catalog artifact and cannot by itself prove the raw provenance of the pinned candidate package.

## 6. Collection cohorts

The collection path is not one homogeneous execution cohort.

### Existing 6,000 cohort

- collected through separate US and KR notebooks and collector/combine paths;
- normalized and exported through the common candidate-package path;
- current ready: 1,338;
- current direct candidate: 2,321.

### Separate 29-US-delta cohort

- collected through the universe-v2 delta onboarding path;
- normalized and exported into the same pinned candidate package;
- current ready: 0;
- current direct candidates: `US:QYLG`, `US:XYLG`;
- remaining 27: fewer than 60 contiguous months and therefore outside the direct-candidate set.

The count reconciliation is:

```text
2,321 existing-cohort candidates
+   2 delta-cohort candidates
= 2,323 direct single-fix candidates
```

Repository code and catalog metadata are consistent with yfinance-based collection, but the exact operator checkout and raw execution receipt are not committed. Provider class evidence and raw execution evidence must remain separate in future reports.

## 7. Core-six policy groups

The six high-impact identities are not one review-policy cohort.

| Policy group | Identity | Current review reason |
| --- | --- | --- |
| Initial calendar gap | `KR:069500` | Initial missing-calendar-month interval; observed rows preserved and cross-gap returns skipped |
| MDD threshold | `US:VNQ` | Selected MDD outside the automatic publish threshold |
| 5Y / short history | `US:BLOK` | Only 5Y rolling price-CAGR windows available |
| 5Y / short history | `KR:273130` | Only 5Y rolling price-CAGR windows available |
| 5Y / short history | `KR:329200` | Only 5Y rolling price-CAGR windows available |
| 5Y / short history | `KR:305720` | Only 5Y rolling price-CAGR windows available |

All six have a monthly identity, Step 3 ready state, valid Beta, at least 60 contiguous months, ordinary-distribution classification, and the same pinned legacy binding. These common facts do not make their review decisions interchangeable.

`KR:069500` can be evaluated against the existing initial-history-gap policy shape. `US:VNQ` needs an MDD review decision. The other four need a generic 5Y-history acceptance policy. They must not be approved through one ticker list or one broad core-six exception.

## 8. Required contract separation

Future design must keep lineage inheritance separate from review-policy normalization.

### A. Monthly lineage-inheritance contract

This contract answers whether already accepted direct lineage may carry into a later release. It must bind and compare:

- source/provider class and publication eligibility;
- canonical identity and market/ticker mapping;
- collector code reference and compatible collector contract;
- normalization and calculation versions;
- monthly row contract and price/return basis;
- explicit direct/proxy state;
- prior release and previous-history prefix;
- appended-month and historical-revision delta;
- automatic inheritance result or exception-queue reason.

Material source, identity, collector, normalization, proxy, row-contract, history, or release-binding drift must fail closed.

### B. Review-policy decision contract

This contract answers whether a numerically available series may pass a review gate. It must define generic, evidence-based decisions for:

- CAGR thresholds;
- MDD thresholds;
- Beta thresholds;
- dividend thresholds;
- conditions for accepting 5Y metrics;
- initial calendar gaps;
- split evidence;
- combinations of review reasons;
- policy version, audit fields, and held/approved result.

The contract must be based on reusable policy dimensions, not a ticker allowlist or asset-specific bypass. Passing review policy must not substitute for missing source lineage, and passing lineage inheritance must not substitute for a required numeric review decision.

## 9. Colab decision

The next phase does not require or authorize Colab.

Repository-only work can produce:

- a deterministic 1,338-versus-2,323 comparison;
- a cohort summary;
- an evidence-availability matrix;
- a core-six audit;
- a monthly lineage-inheritance proposal;
- a review-policy decision proposal;
- a previous-release delta-checker design;
- an exception-queue design.

Colab becomes relevant only if preserved external evidence cannot be found and a named identity or evidence-homogeneous cohort needs new direct-source reproduction. That work requires separate approval and a bounded identity/cohort manifest. It must not default to collecting all 2,323 candidates.

## 10. Consequences for #432

The accepted next repository step is documentation/report/checker work only. It must not:

- call the 2,323 identities provenance-approved;
- grandfather new releases solely from the current ready flag;
- merge lineage inheritance and numeric review into one status;
- infer direct lineage from row presence;
- approve the core six through one exception;
- run Colab or a provider without a separate bounded approval;
- change runtime eligibility, review values, pinned artifacts, or Production.

The theoretical `1,338 + 2,323 = 3,661` ready ceiling remains a planning ceiling. It is not an approved output count and may be reduced by lineage-evidence or review-policy exceptions.
