# FINPLE Step 114-2T Unsigned Cutover Execution Approval-Request Audit

Date: 2026-07-17
Issue: #267

## 1. Scope

Step 114-2T prepares one deterministic unsigned approval request from a
stable local Step 114-2S operator bundle and a production-default Step 114-2S
dry-run result.

`approvalRequestReady=true` means only that the request is ready to be
presented to a separately authorized approval step. It does not mean approval
was granted, a signature was applied or verified, or execution was authorized.

## 2. Contracts

Step 114-2T implements:

- `metrics-cutover-execution-approval-request-v1-step114-2t`
- `metrics-cutover-execution-approval-request-policy-v1-step114-2t`
- `metrics-cutover-execution-approval-request-summary-v1-step114-2t`

It directly reuses:

- `metrics-cutover-post-merge-dry-run-input-v1-step114-2s`
- `metrics-cutover-post-merge-dry-run-v1-step114-2s`
- `metrics-cutover-post-merge-dry-run-summary-v1-step114-2s`
- the merged Step 114-2S bundle parser and coordinator
- the shared NFC/case-folded metrics target-path identity helper

## 3. Stage boundary

The exact non-retrying flow is:

```text
operator bundle observation A
production-default Step 114-2S dry-run with captured observation S
operator bundle observation B
A/S/B bundle byte/path/identity stability verification
sanitized Step 114-2S summary validation
canonical unsigned approval request
sanitized public result
```

Observation S is produced only by injecting the production
`readMetricsCutoverPostMergeBundleObservation` reader through the internal
Step 114-2S `readBundle` boundary. It is not accepted from the operator bundle,
CLI, or public input. No request is constructed before observation B and all
three observations pass the stability checks.

## 4. CLI boundary

The CLI accepts exactly:

```text
--repo <repository path>
--input <Step 114-2S operator bundle path>
```

It rejects target paths, approval or readiness flags, signatures, private-key
paths, output paths, execution-package hashes, duplicated flags, and all
unexpected options.

There is no stdin fallback, environment-secret fallback, or output file.

Exit codes:

```text
0 request_ready
1 blocked
2 invocation or runtime error
```

Standard output contains exactly one sanitized JSON document.

## 5. Operator-bundle observations

The merged Step 114-2S input module now exposes a reusable raw observation
helper. Each observation performs:

- pre-read `lstat` and canonical `realpath`
- regular non-symlink validation
- existing 64 MiB size enforcement
- read-only descriptor open on the canonical path
- descriptor pre-`fstat`
- one raw `Buffer` read through that descriptor
- descriptor post-`fstat` and close
- post-read `lstat` and canonical `realpath`
- exact byte-size comparison across path metadata, descriptor metadata, and
  the actual Buffer
- SHA-256 of the raw bytes
- BigInt `dev:ino` identity when supported, with safe-integer enforcement for
  Number stat adapters
- strict UTF-8 and exact Step 114-2S JSON parsing

Within one observation, the canonical path, pre/post path identity,
pre/post descriptor identity, path-to-descriptor identity, and size must all
remain stable. Both path observations must remain regular non-symlinks.
Unsupported identity is accepted only when its unsupported state is stable
across every comparison.

Observation A occurs before Step 114-2S. Observation S contains the exact
bytes parsed by Step 114-2S. Observation B occurs after Step 114-2S.

The coordinator requires:

- the same canonical path across A/S/B
- identical raw bytes across A/S/B
- identical SHA-256 across A/S/B
- identical byte size across A/S/B
- unchanged file-identity support state across A/S/B
- identical stable file identity across A/S/B when supported

The transient sequence A=original, S=different valid bundle, B=original is
therefore blocked even though A equals B. Concurrent mutation blocks without
retry. Raw bytes, absolute canonical paths, and file identities are never
copied into the public result.

## 6. Direct Step 114-2S invocation

The coordinator calls `runMetricsCutoverPostMergeDryRun` with the same
repository and operator-bundle path. Caller input cannot supply a dry-run
result or execution-package hash.

The Step 114-2S result must have its exact field allowlist and:

```text
status=dry_run_ready
ok=true
dryRunReady=true
repositoryStateStableAcrossDryRun=true
targetFileCount=2
plannedWriteCount=2
plannedDeleteCount=0
```

Repository HEAD/tree, tracked inventory, target-absence evidence, candidate,
ZIP, rehearsal, execution-package, and selector hashes must have their exact
lowercase formats. Every inherited authorization output must be exactly
`false`.

## 7. Target-summary validation

Exactly two target summaries are accepted, in canonical US then KR order.

Each target has exactly:

```text
role
path
sha256
byteSize
rowCount
market
schemaVersion
writeMode
```

The targets must be:

- `us_price_metrics` / `US`
- `kr_price_metrics` / `KR`
- safe repository-relative CSV paths under `src/data/tickers/`
- distinct under NFC and conservative case-fold identity
- positive byte and row counts
- valid lowercase SHA-256 identities
- `metrics-price-overlay-csv-schema-v1-step114-2p`
- `writeMode=create_only`

Missing, extra, malformed, duplicate, or colliding target fields block.

## 8. Canonical unsigned request

The request contains exactly:

```text
contractVersion
policyVersion
requestId
requestScope
requestStatus
operatorBundleSha256
operatorBundleByteSize
repositoryHeadSha
repositoryTreeSha
branchName
trackedPathsSha256
targetPathAbsenceEvidenceHash
candidatePackageId
candidatePackageHash
zipPackageSha256
cutoverRehearsalEvidenceHash
executionPackageHash
selectorPreimageSha256
selectorPostimageSha256
targets
plannedWriteCount
plannedDeleteCount
approvalRequirements
requestHash
```

Fixed values:

```text
requestScope=metrics_exact_cutover_execution
requestStatus=unsigned_request
```

The approval requirements are exactly:

```text
requiresSeparateSignedApproval=true
requiresFreshRepositoryRecheck=true
requiresExactExecutionPackageHash=true
requiresCreateOnlyWrites=true
requiresExactTwoSelectorReplacements=true
allowTargetDeletion=false
allowAutomaticRollback=false
```

There are no timestamps, UUIDs, hostnames, usernames, absolute paths, process
IDs, or random request values.

## 9. Canonicalization and validation

The exported pure helpers are:

```text
canonicalizeMetricsCutoverExecutionApprovalRequest
hashMetricsCutoverExecutionApprovalRequest
validateMetricsCutoverExecutionApprovalRequest
```

Canonicalization recursively sorts object keys and preserves array order. It
rejects:

- missing or extra request, target, or requirements keys
- `undefined`
- `NaN` and Infinity
- sparse arrays
- `Date`
- `Buffer`
- function, symbol, and bigint
- custom or prototype-bearing objects

The validator recomputes and verifies both the deterministic request ID and
the request hash.

Before request construction, the pure builder independently requires:

```text
operatorBundleObservation.byteSize === operatorBundleObservation.bytes.length
operatorBundleObservation.sha256 === sha256(operatorBundleObservation.bytes)
```

Forged observation hash or size metadata is rejected with safe issue codes.
The request's operator-bundle hash and size therefore come only from bytes
proven equal across A/S/B and reverified by the builder.

## 10. Deterministic request ID and hash

The request ID uses:

```text
FINPLE_STEP114_2T_REQUEST_ID\0
```

followed by the canonical identity payload containing:

- operator-bundle SHA-256
- repository HEAD
- repository tree
- execution-package hash
- target-path absence evidence hash

The result is:

```text
metrics-cutover-request-<64 lowercase hex>
```

The request hash is SHA-256 over the complete canonical request excluding
only `requestHash`. Mutating any bound identity changes both `requestId` and
`requestHash`.

## 11. Public redaction

The public result is built from an explicit allowlist. Neither the request nor
the outer result exposes:

- raw operator-bundle bytes or absolute input path
- `finalApprovalInput` or `finalApprovalOptions`
- execution-package objects
- target or selector base64
- rollback bundles or exact diffs
- approval receipts or receipt IDs
- signatures or public keys
- allowlist JSON
- private keys, credentials, tokens, or passwords

For blocked and idle results:

```text
approvalRequestReady=false
approvalRequestHash=""
approvalRequest={}
executionPackageHash=""
targetFileCount=0
plannedWriteCount=0
plannedDeleteCount=0
```

## 12. Fixed false outputs

Every request-ready, blocked, and idle result preserves:

```text
approvalGranted=false
executionAuthorized=false
signatureApplied=false
signatureVerified=false
fileWriteAuthorized=false
commitAuthorized=false
pushAuthorized=false
mergeAuthorized=false
deploymentAuthorized=false
productionPublicationAuthorized=false
appExportActivated=false
pointerMutationExecuted=false
rollbackExecuted=false
loaderActivated=false
```

## 13. No-side-effect boundary

Production Step 114-2T code contains no:

- file-write API
- Git subprocess or mutation
- signing or signature verification
- network call
- DB or provider access
- deployment or publication action
- selector, pointer, or rollback mutation

The real integration fixture creates only test-owned temporary repositories,
bundles, keys, receipts, and target bytes. These artifacts are removed by the
test cleanup and are never committed.

## 14. Validation

The implementation passed:

- Step 114-2T focused suite: 86 tests
- real production-default Step 114-2S integration and actual Step 114-2T CLI
- Step 114-2S and 2T compatibility suite: 153 tests
- Step 114-2Q through 2T combined suite: 294 tests
- Step 114-2N through 2T combined suite: 498 tests
- Step 114-2M Python candidate-package suite: 16 tests
- Python metrics discovery suite: 48 tests
- `npm.cmd run check:scenario-metrics`: 80 tests
- `npm.cmd run build`
- `npm.cmd run check:ai-production`
- `git diff --check`
- `git diff --cached --check`

The repository-wide `node --test` command was attempted for 120 seconds. It
continued producing passing results until the timeout; no failure appeared in
the captured output.

## 15. Protected scope

Step 114-2T does not modify or create:

- `src/data/tickers/screenerCandidateOverlay.js`
- current or target overlay CSVs
- production loader or pointer
- `data/processed/scenario_monthly_returns.csv`
- Step 4/5/6 calculation paths or AI context
- DB, auth, payment, subscription, or MY PAGE
- trading readiness, order, authority, or kill switch
- provider, KRX, KIS, or data.go.kr ingestion
- deployment workflows
- real operator bundles or signed execution approvals
- real keys, credentials, secrets, ZIPs, or target data

A later, separately authorized step must accept and verify an external signed
approval, recheck the repository, reproduce the exact package identity, and
still preserve create-only writes with no automatic deletes.
