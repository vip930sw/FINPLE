# FINPLE Step 114-2X-Z single-use production cutover executor

## Scope

This increment implements the dependency-injected execution state machine for one exact merged Step Y envelope. It does not expose a route, trigger, worker, cron job, loader activation, deployment workflow, or ambient filesystem entry point. The zero-input programmatic API and zero-argument CLI remain `awaiting_explicit_single_use_production_cutover_execution`.

The committed tests use only the existing synthetic Step Y chain plus deterministic in-memory capability doubles. They do not target the repository's real production CSVs or selector.

## Direct validation boundary

Before the first capability call, the executor:

1. requires the Step Z merged-main binding `c9dec6491643c03d2b7a14c0c91986a1c88351e7`;
2. canonically reconstructs and compares the complete Step Y packet/result;
3. directly reruns the Step X and W/V/U/T/S validators;
4. reconstructs the signed approval and single-use envelope;
5. reconciles US then KR targets, content/schema/dataset/package identities, row and byte counts;
6. reconciles selector preimage/postimage and repository preimage/head/tree identities;
7. revalidates authority, invocation, attestation, nonce, chronology, and effective-expiry bindings;
8. requires the bound ten-operation Step Y future order;
9. requires two CSV replacements, one selector mutation, zero loader activations, zero deployments, all fixed-false flags, and `singleUse=true`.

Any failure at this boundary returns `blocked` without invoking a clock, store, reader, replacer, selector coordinator, receipt store, or rollback coordinator.

## Capability contracts

The exact injected capability names are:

- `singleUseCutoverEnvelopeStore`
- `cutoverClock`
- `cutoverPreimageReader`
- `atomicProductionCsvReplacer`
- `selectorMutationCoordinator`
- `cutoverReceiptStore`
- `rollbackCoordinator`

Every descriptor binds an exact method set, 100 ms hard timeout, AbortSignal cancellation, fixed deadline, domain-separated operation ID and idempotency key, exact namespace, sanitized output policy, and false retry/fallback/discovery/provider/database/network/loader/deployment permissions. A timed-out or thrown mutating call is never retried. It receives one read-only reconciliation using the same operation ID and idempotency key; `ambiguous` remains fail closed.

## Exact execution trace

The completed public trace is:

1. `single_use_envelope_claim_acquired`
2. `exact_preimages_re_read`
3. `bound_preimages_no_drift_verified`
4. `us_production_csv_atomically_replaced`
5. `us_production_csv_result_verified`
6. `kr_production_csv_atomically_replaced`
7. `kr_production_csv_result_verified`
8. `selector_mutated_exactly_once`
9. `selector_postimage_and_cutover_result_verified`
10. `sanitized_cutover_receipt_persisted`
11. `single_use_envelope_claim_terminalized`

The receipt is persisted before the claim is terminalized and describes terminalization as pending. Only a subsequently verified terminalization can seal the in-memory completed closeout. No retry or second execution path exists.

## Public result boundary

The only public states are:

- `awaiting_explicit_single_use_production_cutover_execution`
- `single_use_production_cutover_execution_completed`
- `blocked`

Results contain only states, counts, sanitized IDs, and hashes. Candidate bytes, selector bytes, signatures, public keys, exception messages, stacks, credentials, account identifiers, provider/DB identities, and private paths are excluded.
