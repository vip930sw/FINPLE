# FINPLE Step 114-2X-B manual-review runbook

Date: 2026-07-17
Status: preparation-only; not approved for production execution

## Non-authority statement

This document does not authorize a production cutover, receipt consumption, repository or target writes, Git operations, deployment, publication, app export, or loader/pointer activation. Step 114-2X-A must never be run against the FINPLE checkout. A later execution requires a new, explicit human decision after all production capabilities and fresh authority are independently reviewed.

## Preconditions for a later separately authorized session

An operator must stop unless all of the following are true in one controlled, no-retry session:

1. A production-grade non-local claim provider has independently demonstrated atomic create-if-absent, durable acknowledgement, read-after-write consistency, immutable terminal state, retention, and least-privilege access. No local file claim qualifies.
2. A production-grade exclusive repository lock has independently demonstrated exact-realpath and HEAD/tree/branch/tracked-inventory binding, sanitized liveness evidence, manual-only stale-lock handling, and release only after terminal claim persistence.
3. The host is a dedicated trusted non-shared, non-synchronized, non-download Linux environment with the declared durability, authenticated UTC clock, supported tool versions, private temporary storage, and redacted logging controls.
4. A separate named human reviewer records an immediate go/no-go decision. Approval of this issue or PR is not that decision.
5. All authority is regenerated from the then-current `main` during the same session in this exact order:
   - operator bundle;
   - signed execution approval response;
   - execution-approver allowlist observation;
   - Step 114-2V authority package;
   - signed Step 114-2W invocation;
   - invoker allowlist observation;
   - verified-unconsumed Step 114-2W receipt;
   - sealed Step 114-2Q execution package.
6. Nothing produced for Step 114-2X-A or Step 114-2X-B is reused as production authority.

## Freshness and signer separation

At the exact evaluation instant, the approval response may be no more than 30 minutes old or 60 seconds in the future, and it must remain strictly unexpired with expiry after issuance. The invocation may be no more than 10 minutes old or 60 seconds in the future, must remain strictly unexpired, and may span at most 15 minutes from invocation to expiry. Any clock drift or freshness failure stops the session.

Production-publish, app-export, execution-approver, and invoker roles must satisfy the merged role rules. Identity, key ID, and canonical Ed25519 public-key fingerprint separation must be verified wherever the prior contracts require distinct signers. Aliases of the same key are not separate signers.

## Later execution ordering

This ordering is documentation only and is not performed by Step 114-2X-B:

1. Acquire one exclusive lock for the exact canonical repository realpath, bound to current HEAD, tree, branch, and tracked-path inventory.
2. Reverify all fresh authority and signer separation.
3. Atomically create the receipt claim in `claim_in_progress`; do not delete or replace an existing claim.
4. Recheck repository status, tracked inventory, target absence, and selector canonical path, regular-file identity, bytes, hash, and mode.
5. Create the US target with create-only semantics and verify its exact bytes, size, hash, rows, market, schema, and path.
6. Create the KR target with the same create-only verification.
7. Immediately recheck selector identity, mode, and preimage bytes, then replace it with the sealed postimage.
8. Verify exactly the intended two targets and selector changed, with no delete or unexpected fourth path, while repository HEAD, tree, and branch remain stable.
9. Conditionally persist exactly one terminal claim state.
10. Release the repository lock only after terminal claim persistence is durably acknowledged.

No step may automatically retry, roll back, delete a target, restore the selector, steal or delete a lock, delete a claim, force continuation, reset, rebase, force-push, or rewrite history.

## Terminal manual-review states

For every state below: stop immediately, prevent further writes, preserve only redacted forensic status, do not commit/push/deploy, and escalate to the named manual-review owners. Never print target bytes, selector bytes, nonce, signature, key material, credentials, raw authority, provider metadata, host identity, or absolute paths.

### Claim acquired but no target written

Record the safe execution stage and `actualWriteCount=0`. Attempt only the already-reviewed conditional transition to `consumed_failed_manual_review`. Keep the repository lock until that terminal transition is durably acknowledged. Do not reuse or delete the claim and do not start a new attempt.

### US target written only

Record `actualWriteCount=1` and selector unchanged. Do not create KR, update the selector, delete US, or retry. Persist `consumed_failed_manual_review` if the approved claim path remains available, then release the lock only after durable acknowledgement.

### Both targets written, selector unchanged

Record `actualWriteCount=2` and selector unchanged. Do not replace the selector, delete either target, or retry. Persist the manual-review terminal state and retain the lock until persistence is confirmed.

### Selector replaced but post-write verification failed

Record `actualWriteCount=2` and selector updated. Do not restore the selector, delete targets, commit, or continue. Persist the manual-review terminal state and hold the lock until the terminal record is durable.

### Terminal claim persistence failed

Treat receipt state as indeterminate and non-reusable. Keep the lock held, stop all repository actions, and escalate to claim-store and repository owners. Do not delete, overwrite, recreate, or infer the claim state.

### Repository lock remains held

Do not steal, delete, overwrite, or automatically expire the lock. Preserve sanitized liveness/status evidence and require explicit manual coordination. If ownership or terminal-claim state is uncertain, no new session may start.

### Unexpected fourth changed path

Stop with the repository untouched from that point. Record only the redacted unexpected-change count and stage. Do not revert, reset, delete, commit, or continue. Preserve the lock until the claim reaches a durable manual-review terminal state.

### Target or selector tampering

Stop before any further write. Preserve safe identity/mismatch codes without exposing bytes or paths. Do not overwrite the tampered file, restore another file, or retry. Persist the manual-review terminal state where safely possible.

### Clock or freshness drift after verification

Stop and treat the current authority as unusable. Do not refresh timestamps in place, reuse signatures, or continue. Persist the manual-review terminal state if a claim already exists; otherwise release the lock without acquiring a claim. Any future session requires a separate human decision and entirely fresh authority.

## Completion boundary

Manual review may document facts and decide how a later separately authorized recovery change should be designed. It may not silently transform this runbook into execution authority. Git history rewrite, forced continuation, automatic recovery, and production activation remain outside Step 114-2X-B.
