# FINPLE Step 114-2X-Z atomic replacement, rollback, and closeout

## Atomic replacement semantics

The executor passes candidate bytes and identities only to the injected `atomicProductionCsvReplacer`. The exact contract requires staging/rename atomicity, create-only target preimages, a two-replacement limit, and US-before-KR ordering. After each successful or reconciled-committed replacement, `cutoverPreimageReader` must independently return the exact bound content hash, schema identity, dataset identity, row count, and byte count.

The selector coordinator receives the exact bound selector preimage and expected postimage and has a mutation limit of one. The post-cutover reader must then prove the exact two CSV results, selector postimage, unchanged repository head/tree identities, exactly three changed paths, and zero loader/deployment counts.

## Claim and replay behavior

One atomic claim is required before reading the immediate preimages. `already_consumed`, stale, expired, invalid, or ambiguous claims cannot reach a CSV or selector capability. The executor never deletes a claim, never steals a lease, never retries claim acquisition, and never issues a second cutover attempt.

A successful claim is terminalized at most once. Earlier definitive failures terminalize as `blocked_before_mutation` or `rolled_back`. A completed claim binds the sanitized cutover receipt. A timeout or crash is reconciled once with the original operation identity; ambiguous acquisition or terminalization requires manual review.

## Rollback matrix

| Failure stage | Required restoration | Completed closeout |
| --- | --- | --- |
| US replacement or verification | exact US/KR absence and selector preimage | forbidden |
| KR replacement or verification | exact US/KR absence and selector preimage | forbidden |
| selector mutation or post-state verification | exact US/KR absence and selector preimage | forbidden |
| receipt persistence | exact US/KR absence and selector preimage | forbidden |
| claim terminalization | exact US/KR absence and selector preimage | forbidden |

Rollback is one injected operation followed by an independent exact-preimage read. It is not an execution retry. Failed, timed-out, unreconciled, or mismatched restoration sets `manualReviewRequired=true`. Claim-terminalization ambiguity also requires manual review even when restoration is confirmed. No ambiguous path produces `single_use_production_cutover_execution_completed` or an execution closeout.

## Receipt and closeout identities

The sanitized cutover receipt binds:

- the Step Y envelope and approval IDs/hashes;
- the Step X reconciled evidence ID/hash;
- claim hash and repository preimage/head/tree identities;
- exact US/KR result identities and selector preimage/postimage hashes;
- the sanitized execution trace and trace hash;
- exact mutation counts and all fixed-false safety flags.

The completed closeout additionally binds the receipt-store hash and claim-terminalization hash. IDs and hashes are domain separated under Step Z. Raw CSV/selector material is not included.

## Explicit non-actions

This PR does not modify a real production/current/target CSV, selector, loader, or pointer. It does not perform a cutover, provider/network/database/credential operation, SQL or migration, scenario execution, deployment, route, cron, worker, or trigger. Merge, CI, Vercel, repository ownership, and readiness cannot imply execution authority.
