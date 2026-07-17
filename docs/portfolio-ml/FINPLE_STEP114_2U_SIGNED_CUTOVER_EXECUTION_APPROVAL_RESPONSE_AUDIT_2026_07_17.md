# FINPLE Step 114-2U signed cutover execution approval response audit

Date: 2026-07-17

Issue: #269

Baseline: `d3b5131b8195fe8d0d3c1316d52c8edbc09cb91f`

## Scope

Step 114-2U verifies a separately signed cutover execution approval response. It does not execute the cutover and does not grant file, Git, deployment, publication, export, pointer, rollback, or loader authority.

The implementation adds:

- `metrics-cutover-execution-approval-response-v1-step114-2u`
- `metrics-cutover-execution-approval-verification-policy-v1-step114-2u`
- `metrics-cutover-execution-approval-verification-summary-v1-step114-2u`
- `metrics-cutover-execution-approver-allowlist-v1-step114-2u`

## Non-retrying verification flow

The production coordinator performs one linear observation and verification sequence:

1. signed response observation A
2. execution-approver allowlist observation A
3. production-default Step 114-2T request A
4. internal operator-bundle observation for its trusted `evaluationNow` and prior signer identities
5. exact response, request binding, time policy, allowlist, and Ed25519 verification
6. production-default Step 114-2T request B
7. signed response observation B
8. execution-approver allowlist observation B
9. exact request A/B and file observation A/B comparisons
10. sanitized in-memory verification receipt

There is no retry after a concurrent mutation or identity mismatch.

## Response and allowlist observations

Both JSON files use the descriptor-atomic read boundary established by the prior cutover steps:

- pre-read `lstat` and canonical path observation
- read-only descriptor open
- descriptor `fstat` before and after reading exact bytes
- descriptor close
- post-read `lstat` and canonical path observation
- regular-file, non-symlink, canonical-path, file-identity, size, and byte-length checks
- strict UTF-8 and exact JSON contract parsing

The response limit is 1 MiB and the allowlist limit is 4 MiB. Observations A and B must have exactly equal canonical paths, raw bytes, SHA-256 values, byte sizes, identity-support states, and supported file identities.

Absolute paths, raw bytes, identities, signatures, public keys, and allowlist contents are not returned.

## Step 114-2T request binding

The coordinator invokes the real production-default `runMetricsCutoverExecutionApprovalRequest` twice using only the repository and operator-bundle paths from the exact CLI input. Both results must be `request_ready`, `ok=true`, and `approvalRequestReady=true`, with every Step 114-2T execution-related output still false.

The requests must be exactly equal for request ID/hash, bundle hash, repository HEAD/tree/branch/tracked inventory, target absence evidence, candidate/ZIP/rehearsal/execution package identities, selector hashes, targets, and planned write/delete counts. The signed response is separately bound to the request ID/hash, bundle hash, repository HEAD/tree, and execution package hash.

## Canonical response and Ed25519 verification

The response accepts only the exact contract fields and fixed approval scope, decision, signature algorithm, and eight attestations. Its deterministic ID uses the domain `FINPLE_STEP114_2U_APPROVAL_RESPONSE_ID\0` and binds request ID/hash, signer key/identity, and issuance/expiry instants.

The signature payload is the domain `FINPLE_STEP114_2U_APPROVAL_SIGNATURE\0` followed by canonical JSON for the complete response excluding only `signatureBase64`. Verification accepts canonical base64 containing exactly 64 signature bytes and uses only the single resolved Ed25519 SPKI allowlist key. The service never generates a key, reads a private key, or signs a payload.

## Time policy

Only the internally parsed operator bundle's `evaluationNow` is trusted. The implementation does not call `Date.now()`.

It requires exact millisecond ordering:

- `issuedAt <= evaluationNow`
- `evaluationNow < expiresAt`
- `expiresAt > issuedAt`
- age no greater than 30 minutes
- future skew no greater than 60 seconds, while the stricter no-future issuance rule remains authoritative

Malformed, stale, expired, future, or conflicting timestamps block.

## Approver separation and allowlist

The allowlist has exact outer and entry fields. Signer key IDs and signer IDs are unique. Each entry must contain one exact execution scope and role, `revoked=false`, and a valid Ed25519 SPKI public key. Canonical public-key fingerprints are used internally to reject aliases registered under different IDs.

The response key ID and signer ID must resolve to the same single entry. Both must differ from the production-publish and app-export signer key IDs and signer IDs parsed internally from the operator bundle. Prior signer identities and key fingerprints are never exposed.

## Verification receipt and public result

After all gates pass, the service creates a canonical in-memory receipt containing only safe request/response hashes and IDs, repository identity, branch, signer IDs, timestamps, target summaries, planned counts, and fixed policy facts. `verificationReceiptHash` hashes the receipt excluding only its own hash field. The receipt contains no executable token or command and is not written to disk.

The public ready result is allowlisted and reports `approval_verified`. Blocked and idle results suppress receipt, request, response, package, signer, timestamp, repository, and count fields. Raw response/bundle content, approvals, target content, rollback content, keys, signatures, absolute paths, file identities, credentials, and tokens are never returned.

The following remain false in every result:

- `executionAuthorized`
- `fileWriteAuthorized`
- `commitAuthorized`
- `pushAuthorized`
- `mergeAuthorized`
- `deploymentAuthorized`
- `productionPublicationAuthorized`
- `appExportActivated`
- `pointerMutationExecuted`
- `rollbackExecuted`
- `loaderActivated`

## CLI boundary

The CLI accepts exactly `--repo`, `--input`, `--response`, and `--allowlist`. It accepts no identity, signature, key, authority, output, stdin, or environment-secret substitute. It writes exactly one sanitized JSON line to stdout and no file. Exit codes are 0 for `approval_verified`, 1 for a blocked verification, and 2 for invocation/runtime failure.

## Protected scope

No selector, overlay CSV, target CSV, loader, pointer, scenario monthly return, Step 4/5/6 calculation, database, auth, payment, subscription, MY PAGE, trading/provider, or deployment workflow is modified. No real bundle, response, allowlist, key, credential, ZIP, secret, or target data is committed.

## Validation record

The implementation passed:

- Step 114-2U focused suite: 32 tests
- real production-default Step 114-2T A/B integration and actual Step 114-2U CLI
- Step 114-2T and 2U compatibility suite: 118 tests
- Step 114-2Q through 2U combined suite: 326 tests
- Step 114-2N through 2U combined suite: 530 tests
- Step 114-2M Python candidate-package suite: 16 tests
- Python metrics discovery suite: 48 tests
- `npm.cmd run check:scenario-metrics`: 80 tests
- `npm.cmd run build`
- `npm.cmd run check:ai-production`
- `git diff --check`
- `git diff --cached --check`

The repository-wide `node --test` command was attempted for 120 seconds. It continued producing passing results until the timeout; no failure appeared in the captured output.
