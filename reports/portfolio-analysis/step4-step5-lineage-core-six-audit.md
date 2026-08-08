# Step 4/5 Lineage Core-Six Audit

- Report as of: `2026-07-26`
- Result: audit only; no review flag, eligibility state, monthly data, or runtime behavior changed
- Common state: monthly identity present, Step 3 ready, Beta valid, at least 60 contiguous months, ordinary distribution, legacy_v1 pinned binding

The common state does not make these six identities one approval cohort. They require three generic review-policy decisions and retain the same legacy lineage-evidence gap as the current ready group.

## initial calendar gap

Generic policy requirement: Generic observed-row gap policy; forbid forward fill and returns crossing the gap; retain deterministic gap evidence.

| Identity | Catalog data / metrics / review | Monthly identity | Contiguous months | Step 3 | Beta | Lineage evidence | Review-policy class | Current blocker | Repository evidence | Repository-only recoverability | Colab now |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| `KR:069500` | `review_required / review_required / review_required` | true | 206 | true | true | `legacy_v1_pinned_binding_without_row_level_direct_receipt` | `initial_calendar_gap_review` | `review_required` | `pinned_binding_only_raw_receipt_not_preserved` | policy decision possible without recollection; not approved | no |

## mdd threshold

Generic policy requirement: Generic MDD review trigger and approval evidence; distinguish valid extreme drawdown from metric error.

| Identity | Catalog data / metrics / review | Monthly identity | Contiguous months | Step 3 | Beta | Lineage evidence | Review-policy class | Current blocker | Repository evidence | Repository-only recoverability | Colab now |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| `US:VNQ` | `ready / ready / review_required` | true | 239 | true | true | `legacy_v1_pinned_binding_without_row_level_direct_receipt` | `mdd_threshold_review` | `review_required` | `pinned_binding_only_raw_receipt_not_preserved` | policy decision possible without recollection; not approved | no |

## five year metric review

Generic policy requirement: Generic conditions for accepting 5Y metrics; keep metric-window review separate from the 60-month Step 4/5 floor.

| Identity | Catalog data / metrics / review | Monthly identity | Contiguous months | Step 3 | Beta | Lineage evidence | Review-policy class | Current blocker | Repository evidence | Repository-only recoverability | Colab now |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
| `KR:273130` | `short_history / short_history / short_history` | true | 108 | true | true | `legacy_v1_pinned_binding_without_row_level_direct_receipt` | `five_year_metric_review` | `review_required` | `pinned_binding_only_raw_receipt_not_preserved` | policy decision possible without recollection; not approved | no |
| `KR:305720` | `short_history / short_history / short_history` | true | 93 | true | true | `legacy_v1_pinned_binding_without_row_level_direct_receipt` | `five_year_metric_review` | `review_required` | `pinned_binding_only_raw_receipt_not_preserved` | policy decision possible without recollection; not approved | no |
| `KR:329200` | `short_history / short_history / short_history` | true | 83 | true | true | `legacy_v1_pinned_binding_without_row_level_direct_receipt` | `five_year_metric_review` | `review_required` | `pinned_binding_only_raw_receipt_not_preserved` | policy decision possible without recollection; not approved | no |
| `US:BLOK` | `short_history / short_history / short_history` | true | 101 | true | true | `legacy_v1_pinned_binding_without_row_level_direct_receipt` | `five_year_metric_review` | `review_required` | `pinned_binding_only_raw_receipt_not_preserved` | policy decision possible without recollection; not approved | no |

## Decision

All six remain `review_required` in current runtime policy. Repository-only contract and policy review is the next step. Colab remains prohibited unless later review identifies a named evidence gap that cannot be resolved from preserved evidence and receives separate bounded approval.
