# Step 4/5 Lineage Cohort Summary

- Report as of: `2026-07-26` (derived from the pinned release timestamp)
- Runtime identities: 6,029
- Current ready: 1,338
- Direct candidates: 2,323
- Scope: repository-only forensics; no asset is approved or made ready by this report

## Reconciliation

| Group | Total | KR | US | ETF | Stock |
| --- | ---: | ---: | ---: | ---: | ---: |
| All runtime identities | 6029 | 3000 | 3029 | 2479 | 3550 |
| Current ready | 1338 | 280 | 1058 | 656 | 682 |
| Direct candidate | 2323 | 1120 | 1203 | 634 | 1689 |

The direct-candidate total reconciles as `1,329 + 986 + 8 = 2,323`. These identities are **not provenance-approved**. Their effective current blocker is the frozen catalog review tuple after monthly identity, Step 3, Beta, 60-month history, ordinary-distribution, and pinned-binding checks pass.

| Catalog tuple: dataStatus / metricsStatus / reviewFlag | Count |
| --- | ---: |
| `ready / ready / review_required` | 1329 |
| `review_required / review_required / review_required` | 8 |
| `short_history / short_history / short_history` | 986 |

## Collection cohorts

| Cohort | Runtime identities | Current ready | Direct candidates |
| --- | ---: | ---: | ---: |
| Existing 6,000 | 6000 | 1338 | 2321 |
| 29-US delta | 29 | 0 | 2 |

The delta direct candidates are `US:QYLG` and `US:XYLG`. The two source cohorts enter the same pinned candidate package and downstream normalization/export/release path, but the repository does not prove one shared raw Colab execution.

## Review-policy classes

| Class | Direct candidates |
| --- | ---: |
| `cagr_threshold_review` | 81 |
| `catalog_data_and_metrics_review` | 1 |
| `dividend_threshold_review` | 17 |
| `five_year_metric_review` | 986 |
| `initial_calendar_gap_review` | 7 |
| `mdd_threshold_review` | 1231 |

Lineage evidence and review-policy decisions are separate fields and separate contracts. The 1,338 ready identities also retain the same `legacy_v1` evidence gap: no explicit row-level direct/non-proxy field and no repository-preserved per-identity collector/run receipt. Their current readiness comes from the exact pinned legacy binding plus frozen `ready / ready / none` catalog fields.

## Evidence boundary and next step

Repository evidence is sufficient to reproduce the 6,029-identity comparison, cohort counts, current discriminator, evidence matrix, and core-six policy grouping. It is not sufficient to claim identical raw collection execution or modern row-level direct lineage.

Colab is not required or authorized for this phase. Continue with repository review of the proposed lineage-inheritance and generic review-policy contracts. Use bounded Colab reproduction only after separate approval if a named identity or evidence-homogeneous cohort needs new direct-source evidence.
