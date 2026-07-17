# FINPLE Step 114-2X-A guarded cutover executor audit

Date: 2026-07-17

Issue: #275

Baseline: `e58fad4679107f56c751d4b8f637ff2dfa3ce55a`

Branch: `codex/step114-2x-a-guarded-cutover-executor`

## Scope and outcome

Step 114-2X-A adds the first write-capable metrics cutover executor, but deliberately limits execution to committed, test-owned temporary Git repositories. The executor proves the exact write sequence required for a later production cutover without changing FINPLE's operating selector or any current or target production overlay CSV.

The stage introduces:

- an exclusive, file-synced test claim for a Step 114-2W `verified_unconsumed` invocation receipt, with explicit parent-directory durability status;
- exactly two ordered, exclusive `create_only` target writes;
- immediate target byte, SHA-256, size, row-count, role, market, schema, and write-mode verification;
- independent target CSV UTF-8, exact-header, market-only, ticker-identity, duplicate-row, and numeric-field verification;
- an exact two-import selector postimage replacement;
- final changed-path and no-delete verification;
- deterministic `consumed_success` and `consumed_failed_manual_review` claim states;
- a deterministic post-write receipt containing safe identities and hashes only;
- a test-only CLI that rejects the real checkout, `main`, missing markers, dirty fixtures, and claim directories inside the repository.

This stage does not authorize or perform a production cutover. It does not commit the generated fixture changes, push or merge them, deploy, publish, activate app export, mutate a pointer or loader, execute rollback, call a provider, access a database, or change trading behavior.

## Contracts

The new versioned contracts are:

```text
metrics-cutover-test-fixture-v1-step114-2x-a
metrics-cutover-receipt-claim-v1-step114-2x-a
metrics-cutover-post-write-verification-v1-step114-2x-a
metrics-cutover-post-write-receipt-v1-step114-2x-a
metrics-cutover-execution-summary-v1-step114-2x-a
```

All canonical hashes use recursively sorted object keys and preserved array order. Sparse arrays, unsupported canonical values, malformed base64, unsafe identities, unsafe repository paths, and non-finite numbers fail closed.

## Test-only execution boundary

The executor requires all of the following before it can acquire a claim:

1. the repository, implementation checkout, and claim directory must resolve to pairwise disjoint canonical filesystem trees; equality and either-direction containment are blocked;
2. `.finple-step114-2x-a-test-fixture.json` must be a committed, stable-identity regular non-symlink file and contain the exact test-only marker contract;
3. the branch must begin with `test/step114-2x-a-` and must not be `main`;
4. the fixture worktree must be clean;
5. the claim directory must already exist outside the target repository;
6. Step 114-2W must return `execution_invocation_verified` with a valid `verified_unconsumed` receipt;
7. the Step 114-2S/2Q execution package must be rebuilt twice, be canonically identical, contain the exact 2Q field set, and pass an independent self-hash recomputation;
8. repository HEAD, tree, tracked-path inventory hash, target-absence evidence, execution-package hash, selector hashes, ordered targets, and planned counts must match the receipt;
9. the target files must still be absent and untracked;
10. the selector bytes must still equal the sealed preimage.

The CLI accepts exactly:

```text
--repo
--claim-dir
--input
--response
--allowlist
--invocation
--invoker-allowlist
```

There is no stdin fallback, environment-secret fallback, alternate target byte input, alternate selector postimage input, output-path option, signing option, or authority override.

## Single-use claim

The claim filename is derived only from the Step 114-2W receipt ID and receipt hash. It is created with exclusive filesystem creation semantics and descriptor `fsync`. Status transitions keep the exclusive claim file continuously present and update it through the same read/write descriptor with identity checks and `fsync`, avoiding replace-over-existing differences between Windows and POSIX.

After a new claim file is synced, the implementation attempts to sync the parent claim directory. POSIX-like platforms report `synced` only after a successful directory `fsync`. Windows reports `unsupported_platform` because Node and Windows do not provide the same portable directory-sync guarantee. Unexpected supported-platform failures report `sync_failed` and force `consumed_failed_manual_review`.

Every claim and public result keeps `productionClaimEligible=false`. A claim with `unsupported_platform` or any environment without a complete durability guarantee cannot be used as a production claim. Step 114-2X-A remains a test-owned claim demonstration, not a production durable claim store.

Claim states are:

```text
claim_in_progress
consumed_success
consumed_failed_manual_review
```

A second attempt using the same receipt blocks before any repository write. The claim is stored outside the target repository and contains only safe contract data: claim and invocation-receipt identities, status, sanitized failure code, execution stage, actual write count, selector-updated state, parent-directory durability state, fixed-false production eligibility, and claim hash.

After the claim is acquired, any failure is terminal for that receipt. It becomes `consumed_failed_manual_review`; the implementation does not delete a created target, restore the selector, release the claim for retry, or automatically invoke a rollback bundle.

## Exact write sequence

The test-only executor performs one non-retrying sequence:

```text
Step 114-2W verification
→ captured execution package A/B reconstruction
→ receipt/package binding
→ pre-claim repository recheck
→ exclusive claim
→ final repository recheck
→ US target exclusive create and immediate verification
→ KR target exclusive create and immediate verification
→ final selector-preimage check
→ exact sealed selector-postimage replacement
→ complete post-write verification
→ consumed claim and post-write receipt
```

The target bytes come only from the sealed execution package. The executor does not regenerate CSV content or recalculate the selector transformation.

After the final selector-preimage observation, the executor prepares and syncs the temporary postimage, then immediately re-observes the selected file before rename. The rename is allowed only when selector bytes, mode, and canonical file identity still match the final preimage observation. A mutation in the `before_selector_write` interval is preserved for forensic review and is never overwritten by the sealed postimage.

The selector transformation is independently constrained to replacing exactly these two sources:

```text
./us_price_metrics_overlay_20260528_app_ready.csv?raw
./kr_price_metrics_overlay_20260528_app_ready.csv?raw
```

with the two sealed target basenames. The resulting postimage must otherwise equal the original selector byte-for-byte. This preserves the other four selector imports and all non-import content.

## Post-write verification

A successful fixture execution requires exactly three Git working-tree changes:

```text
M  src/data/tickers/screenerCandidateOverlay.js
?? <sealed US target path>
?? <sealed KR target path>
```

No fourth path, deletion, rename, type change, target overwrite, symlink, junction/reparse parent escape, directory, selector drift, selector mode drift, target drift, or row-count mismatch is accepted. Git status is read with NUL-delimited porcelain output so path quoting is not platform-dependent. HEAD, tree, branch, and tracked inventory are re-read after the writes and must still match the sealed preimage.

The post-write verification hash binds:

- repository HEAD and tree;
- tracked-path inventory hash;
- execution-package hash;
- selector postimage hash;
- ordered target summaries;
- the exact three changed paths;
- actual write count `2`;
- actual delete count `0`.

The post-write receipt binds that verification hash to the Step 114-2W receipt, authority package, repository identity, target-absence evidence, selector hashes, claim identity, and planned/actual counts.

## Failure semantics

Before claim acquisition, validation failures return `blocked` and leave the receipt unconsumed.

After claim acquisition, failures return:

```text
consumed_failed_manual_review
```

This includes:

- a target appearing between preflight and exclusive create;
- failure after the first target;
- failure after the second target;
- selector preimage drift;
- selector bytes, mode, or file identity changing immediately before rename;
- selector replacement failure;
- target or selector tampering after write;
- an unexpected fourth repository path;
- post-write receipt or claim persistence failure.

The manual-review claim and result retain only safe forensic progress: `executionStage`, `actualWriteCount`, `selectorUpdated`, and the directory-durability state. Failure after the first target records one actual write; failure after the second target records two. The result remains sanitized and does not expose raw nonce, signatures, public keys, private keys, target bytes, selector bytes, operator bundle contents, approval contents, absolute repository paths, file identities, credentials, tokens, commands, or rollback content.

## Fixed-false boundary

Every public result keeps these values false:

```text
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

The executor modifies only a test-owned working tree after all test-only gates pass. It does not create a Git commit and does not activate any runtime consumer.

## Focused validation

The focused suite contains 24 passing tests covering:

- successful exact two-target creation and selector replacement;
- deterministic consumed claim and post-write receipt behavior;
- duplicate receipt claim blocking;
- pre-existing target blocking before claim;
- target appearance after claim and before exclusive create;
- failure after the first and second target writes;
- selector preimage drift;
- selector write failure;
- non-throwing selector mutation immediately before rename without sealed-postimage overwrite;
- post-write target tampering;
- post-write selector tampering;
- unexpected fourth changed path;
- missing test marker;
- symlink and directory marker rejection;
- `main` branch rejection;
- implementation checkout, test repository, and claim directory overlap/containment rejection;
- claim directory inside repository rejection;
- tracked inventory drift;
- unrelated selector postimage edit rejection;
- real Step 114-2W standalone receipt validation and forged 2Q execution-package self-hash rejection;
- exact CLI flag parsing and one-line sanitized output.

The suite runs entirely with synthetic target data, temporary directories, temporary Git repositories, and external claim directories. No FINPLE production target or selector was used or modified.

Verified on 2026-07-17:

```text
node --test scripts/run-metrics-cutover-guarded-executor.test.cjs
24 passed

node --test scripts/verify-metrics-cutover-execution-invocation.test.cjs scripts/run-metrics-cutover-guarded-executor.test.cjs
92 passed

Step 114-2Q through Step 114-2X-A combined suite
471 passed

python -m unittest discover -s scripts/metrics_pipeline/tests
48 passed (bundled Python runtime)

npm.cmd run check:scenario-metrics
80 passed

npm.cmd run build
passed

npm.cmd run check:ai-production
passed

repository-wide node --test
bounded attempt timed out after 120 seconds; no failure was reported before timeout
```

## Production boundary and next step

Step 114-2X-A is not production approval. A later production-execution stage must be separately authorized and must, at minimum:

1. start from the then-current `main`;
2. regenerate the operator bundle, signed approval, authority package, signed invocation, and verified-unconsumed receipt;
3. configure an approved durable claim store outside the repository;
4. remove the test-only marker and branch restriction only through a separately reviewed production policy;
5. preserve the exact create-only and no-automatic-rollback semantics;
6. execute the production cutover once;
7. stop before commit, push, PR, merge, deployment, pointer, or loader activation unless those later actions receive separate approval.

Until that separate Step 114-2X-B preparation is approved, the guarded executor remains limited to test-owned temporary repositories.

## Known limitations and rollback policy

- Step 114-2X-A does not provide a production policy, production claim store, deployment integration, or permission to run against the FINPLE checkout.
- Windows parent-directory durability is explicitly `unsupported_platform`; even a POSIX `synced` result does not convert this test-only filesystem claim into an approved production durable claim store.
- The executor intentionally has no retry-after-claim path and no automatic deletion or rollback. Any post-claim failure requires manual review.
- Repository history is not created by the executor. Reverting this feature branch or its eventual merge must be done only with a normal Git revert; history rewrite and force-push are outside this stage.
- Step 114-2X-B must separately prepare and review any production-execution boundary. It cannot infer production authority from this test-only validation.
