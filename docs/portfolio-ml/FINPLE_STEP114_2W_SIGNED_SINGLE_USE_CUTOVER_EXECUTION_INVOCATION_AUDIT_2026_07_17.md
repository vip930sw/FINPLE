# FINPLE Step 114-2W signed single-use cutover execution invocation audit

Date: 2026-07-17
Issue: #273
Baseline: `485885e8113a2b016a34b46c3b537cee8417e611`
Branch: `codex/step114-2w-signed-single-use-cutover-execution-invocation`

## Scope and outcome

Step 114-2W adds a read-only verifier for a separately signed, single-use cutover execution invocation. A verified invocation produces only a deterministic `verified_unconsumed` receipt. It does not execute the cutover, write a file, consume the invocation, mutate Git, activate a loader, publish, deploy, or authorize any of those actions.

The five versioned contracts are:

- `metrics-cutover-execution-invocation-v1-step114-2w`
- `metrics-cutover-execution-invocation-policy-v1-step114-2w`
- `metrics-cutover-execution-invocation-verification-summary-v1-step114-2w`
- `metrics-cutover-execution-invoker-allowlist-v1-step114-2w`
- `metrics-cutover-execution-invocation-receipt-v1-step114-2w`

## Non-retrying A/S/B and authority reproduction

The production coordinator performs one linear, non-retrying sequence:

1. outer descriptor-atomic observations A for the operator bundle, signed approval response, execution-approver allowlist, signed invocation, and invoker allowlist;
2. real production-default Step 114-2V authority-package reproduction A, with the exact descriptor observations consumed by its nested Step 114-2T and Step 114-2U runs captured;
3. invocation and invoker-allowlist observations S used for validation and signature verification;
4. real production-default Step 114-2V authority-package reproduction B;
5. outer observations B for the same five inputs;
6. complete A/S/B, Step 114-2V A/B, identity, policy, signer-separation, signature, and receipt validation.

Each captured observation must agree on canonical path, raw bytes, SHA-256, byte size, file-identity support state, and file identity when supported. The expected nested Step 114-2V capture shape is exactly 22 bundle observations, six signed-response observations, six execution-approver-allowlist observations, and two Step 114-2U verification summaries per reproduction. Unexpected capture counts block. A transient valid-file swap in any of the five inputs blocks even if outer A and B later match.

Both real Step 114-2V results must be `authority_package_ready`, validate under the merged full package contract, preserve every inherited fixed-false output, and match canonically on package and summary identities. The signed invocation is bound to that exact reproduced authority package, approval request, approval verification receipt, operator bundle, repository HEAD/tree/tracked inventory, target-absence evidence, execution package, selector preimage/postimage, ordered targets, and planned create/delete counts.

## Invocation identity, signature, and time policy

The invocation is an exact-key object. Its `invocationId` uses SHA-256 with domain `FINPLE_STEP114_2W_EXECUTION_INVOCATION_ID\0`. The Ed25519 signature payload uses domain `FINPLE_STEP114_2W_EXECUTION_INVOCATION_SIGNATURE\0` and the canonical invocation excluding only `signatureBase64`. Canonicalization recursively sorts object keys while preserving array order and rejects sparse arrays, unsupported values, custom prototypes, missing keys, and extra keys.

The invocation must declare scope `metrics_exact_cutover_execution`, status `explicit_single_use_invocation`, exactly the required true/false attestations, canonical base64, and a 32-byte nonce. Its timestamps use strict canonical UTC millisecond form. At the exact evaluation instant:

- `invokedAt <= evaluationNow + 60 seconds`;
- `evaluationNow - invokedAt <= 10 minutes`;
- `evaluationNow < expiresAt`;
- `expiresAt > invokedAt`;
- `expiresAt - invokedAt <= 15 minutes`.

All comparisons use integer milliseconds.

## Invoker allowlist and signer separation

The invoker allowlist accepts only the exact versioned root and entry fields. Every key must parse as Ed25519 and is canonicalized to SPKI DER before a SHA-256 fingerprint is calculated internally. Key IDs and invoker IDs must be unique, and the same public-key material cannot be registered under aliases. The matching entry must be non-revoked and allow only the execution scope and `metrics_cutover_execution_invoker` role.

The execution invoker must differ from both final-approval signers by signer ID and by actual public-key fingerprint. Aliased key IDs therefore cannot satisfy signer separation. Full public keys, fingerprints, signatures, nonces, input bytes, canonical input paths, and absolute paths are not exposed in public results or failure output.

## Verified-unconsumed receipt

The receipt binds the invocation ID/hash, authority package ID/hash, request ID/hash, approval verification receipt hash, operator-bundle hash, repository and target-absence identities, execution-package hash, selector hashes, nonce hash, invoker identity, timestamps, ordered targets, and planned counts.

`receiptId` and `receiptHash` use the domains `FINPLE_STEP114_2W_INVOCATION_RECEIPT_ID\0` and `FINPLE_STEP114_2W_INVOCATION_RECEIPT_HASH\0`. Receipt requirements remain fail-closed: exact repository HEAD/tree/tracked inventory, fresh authority reproduction and approval reverification, create-only writes, exactly two selector replacements, post-write verification, and single use are required; target deletion and automatic rollback remain prohibited.

Blocked and idle results suppress the invocation identity/hash, authority and repository identities, signer identities, targets, counts, and the entire receipt.

## Fixed-false and protected scope

Every result keeps these values false:

```text
executionAuthorized
fileWriteAuthorized
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

The CLI accepts exactly six unique flags: `--repo`, `--input`, `--response`, `--allowlist`, `--invocation`, and `--invoker-allowlist`. It writes no artifact, emits one sanitized JSON line, and maps verified/blocked/invocation-or-runtime results to exit codes 0/1/2.

The implementation performs no signing, execution, filesystem write, Git mutation, network call, DB/provider/trading action, deployment, publication, pointer mutation, rollback, or loader activation. It does not change selectors, current or target CSVs, production loaders or pointers, scenario monthly returns, Step 4/5/6, DB/auth/payment/subscription/MY PAGE code, or deployment behavior. All keys, bundles, invocations, allowlists, repositories, approvals, and target bytes used by tests are synthetic and confined to test-owned temporary directories.

## Validation record

The implementation passed:

- Step 114-2W focused suite: 52 tests;
- real production-default Step 114-2V A/B reproduction and the actual Step 114-2W CLI with a runtime-generated Ed25519 invocation;
- transient A/S/B swap coverage for all five inputs;
- exact millisecond time-boundary, authority/repository/target drift, signer alias and reuse, signature, duplicate-key, malformed JSON, size-bound, ID/hash tampering, redaction, suppression, and no-side-effect tests;
- Step 114-2V plus 2W combined suite: 84 tests;
- Step 114-2T through 2W combined suite: 223 tests;
- Step 114-2Q through 2W combined suite: 431 tests;
- Step 114-2N through 2W combined suite: 635 tests;
- Step 114-2M Python candidate-package suite: 16 tests;
- Python metrics discovery suite: 48 tests;
- `npm.cmd run check:scenario-metrics`: 80 tests;
- `npm.cmd run build`;
- `npm.cmd run check:ai-production` against the production health boundary;
- `git diff --check`;
- `git diff --cached --check`.

The repository-wide `node --test` command was attempted with the requested 120-second bound. It continued producing passing results until the timeout; no failure appeared in the captured output.
