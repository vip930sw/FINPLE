# FINPLE Step 114-2X-C adapter conformance audit

Date: 2026-07-17
Baseline: GitHub `main` at `300db162b71f7a0eb8f60b2be6b2de9f7d627681`
Scope: synthetic adapter conformance only

## Outcome boundary

Step 114-2X-C validates two in-memory synthetic adapters against strict protocols and exercises their cross-adapter state machine. `adapter_conformance_ready` means only that the supplied synthetic implementations passed this deterministic harness. It is not production execution approval, production claim eligibility, real provider validation, or real repository-lock validation.

The core conformance module has no filesystem, process, network, database, Redis, object-store, Supabase, cloud-provider, or provider-SDK dependency. It does not invoke Step 114-2X-A, inspect a checkout, create a filesystem claim or lock, consume a receipt, write a target or selector, or perform Git or deployment operations. Fixtures use hashes and identities made solely for tests; no real authority bundle, invocation, key, signature, nonce, receipt, credential, endpoint, or connection string is accepted or committed.

## Versioned protocol contracts

The claim-store protocol is:

```text
metrics-cutover-claim-store-adapter-protocol-v1-step114-2x-c
```

Its exact method set is `acquireClaim`, `readClaim`, and `transitionClaimTerminal`. The synthetic implementation uses an in-memory map and atomic synchronous compare-and-commit after an optional deterministic test barrier. A successful create starts at `claim_in_progress`. Only `consumed_success` or `consumed_failed_manual_review` may be persisted, and only by matching the expected state, version, and record hash. A terminal transition succeeds once. Existing or terminal claims cannot be deleted, reset, released, reused, or replaced.

The repository-lock protocol is:

```text
metrics-cutover-repository-lock-adapter-protocol-v1-step114-2x-c
```

Its exact method set is `acquireLock`, `readLock`, and `releaseLock`. Every lock binds the synthetic repository identity hash, HEAD, tree, branch, tracked-path inventory hash, and redacted owner-liveness hash. A concurrent acquisition has one winner. Release requires the current lock state, version, and hash plus a fully valid terminal synthetic claim. A released lock persists and cannot be reacquired, deleted, overwritten, or released again. Any possibly stale existing lock produces explicit manual review; there is no lock stealing or delete-and-retry path.

Both adapters carry non-public synthetic-only attestations. The coordinator rejects an extra string method, a missing method, or an attestation that permits filesystem, process, network, provider, or real-resource access.

## Cross-adapter state machine

The coordinator validates and records exactly this sequence:

1. validate the exact Step 114-2X-B preparation summary;
2. acquire the repository lock;
3. read and verify the lock;
4. acquire the receipt claim;
5. read and verify the claim;
6. record a synthetic execution-stage observation without invoking an executor or writing files;
7. persist the terminal claim;
8. read and verify the terminal claim;
9. release the lock with the terminal claim evidence;
10. read and verify the released lock.

A failure at any stage returns `blocked` and suppresses the conformance ledger and summary. A completed scenario replay is blocked before mutation because both the released lock and terminal claim remain present. Different synthetic receipt and repository identities remain independent.

## Deterministic event ledger

The versioned event and ledger contracts are:

```text
metrics-cutover-adapter-conformance-event-v1-step114-2x-c
metrics-cutover-adapter-conformance-ledger-v1-step114-2x-c
metrics-cutover-adapter-conformance-summary-v1-step114-2x-c
```

Events start at sequence 1 and are continuous. Each event binds the scenario, adapter protocol, operation, redacted resource-identity hash, expected prior state/version hash, resulting state/version hash, canonical synthetic test instant, previous-event hash, and its own domain-separated hash. The final ledger has a separate domain-separated hash. Validators recompute the scenario, event, ledger, and summary IDs/hashes and reject changed sequence, operation, chain link, state/version evidence, payload, or ledger hash.

The ledger contains no raw receipt ID, repository path, provider identity, lock token, credential, nonce, signature, or source bytes. Concurrency tests use controlled promises that release contenders at the same compare-and-commit boundary; they do not use sleeps or wall-clock races.

## Fixed-false public boundary

Every idle, blocked, and ready result fixes all of these values to false:

```text
executionAuthorized
fileWriteAuthorized
productionClaimEligible
realProviderAdapterValidated
realRepositoryLockValidated
commitAuthorized
pushAuthorized
mergeAuthorized
deploymentAuthorized
productionPublicationAuthorized
appExportActivated
pointerMutationExecuted
rollbackExecuted
loaderActivated
```

The ready result warning explicitly states that synthetic conformance is not real-adapter validation.

## Protected-scope evidence

- no database, Redis, object-store, Supabase, cloud-provider, provider SDK, credential, or network connection;
- no real production claim and no real or filesystem repository lock;
- no Step 114-2X-A execution in the FINPLE checkout;
- no production/current/target CSV, selector, loader, pointer, scenario, Step 4/5/6, DB, auth, payment, subscription, MY PAGE, trading, provider, or deployment change;
- no receipt consumption, authority activation, write, commit, push, merge, deployment, publication, retry, rollback, claim deletion, lock stealing, or history rewrite authorization.

## Validation

Validated on 2026-07-17:

```text
Step 114-2X-C focused
29 passed

Step 114-2X-B standalone
31 passed

Step 114-2X-A standalone
24 passed

Step 114-2W standalone
68 passed

Step 114-2W + 2X-A + 2X-B + 2X-C
152 passed

Step 114-2Q through 2X-C
531 passed

Step 114-2N through 2X-C
735 passed

python -m unittest discover -s scripts/metrics_pipeline/tests
48 passed using the bundled Python runtime because `python` is not on PATH

npm.cmd run check:scenario-metrics
80 passed

npm.cmd run build
passed

npm.cmd run check:ai-production
passed

git diff --check
passed

git diff --cached --check
passed with an empty index before intentional staging

repository-wide node --test --test-reporter=dot
bounded attempt timed out after 121 seconds; 86 progress dots and no test failure were reported before timeout
```

The focused suite covers the exact method sets and extra-method rejection, valid ten-stage orchestration, concurrent single-winner claim and lock acquisition, concurrent single-winner terminal transition, stale state/version/hash rejection, terminal immutability, release-before-terminal rejection, terminal-evidence tampering, stale-lock manual review, completed-scenario replay without mutation, independent resources, Step 114-2X-B summary binding, ledger chain and payload tampering, redaction, fixed-false output, dependency boundaries, and the one-line synthetic CLI check.
