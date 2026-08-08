# FINPLE Step 4/5 Monthly Lineage-Inheritance Contract

Status: proposal only
Issue: #432
Scope: repository contract design; no runtime or artifact mutation

## 1. Decision boundary

This contract decides whether an already accepted direct monthly-data lineage may be inherited by a later release. It does not approve a numeric review trigger, repair data, or make an asset Step 4/5 ready. Review-policy decisions belong to the separate review-policy contract.

Inheritance attaches to a stable data-generation contract, not a ticker allowlist, filename, release timestamp, or current `ready` flag.

## 2. Required identity and generation invariants

Every inherited decision must bind:

- canonical MARKET:TICKER identity;
- approved source/provider class and publication eligibility;
- collector immutable ref or an explicitly compatible collector version;
- normalization immutable ref or an explicitly compatible normalization version;
- calculation policy version;
- monthly row contract;
- benchmark identity;
- adjusted-price basis and return basis;
- explicit direct/non-proxy state;
- prior approved release binding;
- current Step 3 validity;
- current Beta validity;
- release manifest, index, shard, row, and file reconciliation;
- coverage regression visibility.

The repository must preserve enough evidence to compare the previous and current contracts without inferring source lineage from ticker names, ordering, or monthly-row presence.

## 3. Historical-series invariants

An inheritable series must satisfy:

- historical prefix integrity;
- one append-only valid month when the release advances normally;
- no unexplained backfill or revision;
- no duplicate normalized month;
- no prohibited gap or cross-gap return;
- no identity, market, benchmark, source, or proxy substitution;
- no row-contract or adjusted-price-basis drift;
- deterministic artifact reconciliation.

An allowed historical correction must be governed by a versioned generic correction policy and an explicit review result. Silence is not approval.

## 4. Deterministic decisions

| Release delta | Decision | Reason |
| --- | --- | --- |
| Same compatible contract plus one normal appended month | inherit | The generation and historical-prefix invariants remain true. |
| 59 months to 60 months | reevaluate eligibility | Crossing the Step 4/5 history floor is a new eligibility event, not inherited readiness. |
| Source/provider class changes | block and queue | Source lineage is material. |
| Canonical identity changes | block and queue | Approval cannot move between identities. |
| Proxy evidence appears | block and queue | Direct lineage is no longer established. |
| Historical prefix is rewritten | block or explicit review | Revisions require a versioned correction decision. |
| Normalization changes incompatibly | block and queue | Prior results are not comparable. |
| Only the release timestamp changes | do not require reapproval | A release timestamp is not a material lineage invariant. |

## 5. Automatic inheritance result

The checker should emit one result per canonical identity:

- `inherited_unchanged_contract`;
- `reevaluate_newly_eligible_history`;
- `review_material_contract_change`;
- `review_historical_revision`;
- `blocked_proxy_or_identity_failure`;
- `blocked_artifact_reconciliation`;
- `not_previously_approved`.

Only `inherited_unchanged_contract` carries a prior lineage decision. Every other result remains fail-closed and enters an exception queue with deterministic reason codes.

## 6. Evidence required for future implementation

Future implementation must add a versioned, machine-readable receipt that records safe contract identifiers and compatibility results. It must not store credentials, provider payloads, operator-private paths, user data, or raw source bytes in Git.

The current `legacy_v1` ready set does not yet satisfy this modern receipt contract. It remains characterized by the exact pinned legacy binding and catalog fields; this proposal does not grandfather it into future releases.

## 7. Release gate

A monthly release fails closed when any identity has an unknown contract state, an unexplained change, duplicate or invalid month, missing prior binding, proxy evidence, incompatible collector/normalization contract, invalid Step 3/Beta state, unreconciled artifact count, or hidden coverage regression.

No checker may silently exclude an asset, renormalize portfolio weights, or substitute a proxy to make the release pass.
