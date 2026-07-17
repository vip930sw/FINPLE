# FINPLE Step 114-2V sealed non-executing cutover authority package audit

Date: 2026-07-17
Issue: #271
Baseline: `2cbf42181922368ff99e1ef484157f2e1cdb1781`
Branch: `codex/step114-2v-sealed-non-executing-cutover-authority-package`

## Scope and outcome

Step 114-2V adds a read-only preflight that assembles a deterministic authority package only after independently reproducing the Step 114-2T request twice and independently verifying the Step 114-2U response twice. The package is a sealed statement of reviewed identities. It is not an execution token, command, write authorization, deployment authorization, or pointer-mutation capability.

The three versioned contracts are:

- `metrics-cutover-execution-authority-package-v1-step114-2v`
- `metrics-cutover-execution-authority-policy-v1-step114-2v`
- `metrics-cutover-execution-authority-summary-v1-step114-2v`

The authority status is fixed to `sealed_non_executing`.

## Non-retrying observation and coordinator order

The coordinator performs one linear observation sequence without retry:

1. outer operator-bundle, signed-response, and allowlist observation A;
2. real production-default Step 114-2U verification A, with every internal descriptor-atomic reader wrapped and captured;
3. real production-default Step 114-2T request A, with all three bundle observations captured;
4. authority package candidate A;
5. real production-default Step 114-2T request B;
6. real production-default Step 114-2U verification B;
7. outer operator-bundle, signed-response, and allowlist observation B;
8. complete consumed-file, request, verification, and candidate comparison;
9. independently built authority package candidate B.

Every consumed and outer observation must match on canonical path, raw bytes, SHA-256, byte size, file-identity support state, and file identity when supported. The expected real capture shape is seven bundle, two response, and two allowlist observations for each 2U invocation, plus three bundle observations for each direct 2T invocation. An unexpected count blocks. A temporary file swap during any consumed read blocks even if outer A and outer B later match.

The verified 2U file hashes must also equal the matching outer observation hashes. Caller data cannot substitute a response, allowlist, or bundle hash.

## Step 114-2T and Step 114-2U binding

Both Step 114-2T results must be `request_ready`, use the merged summary contract, have empty blocking issues, preserve all inherited fixed-false outputs, and pass the merged full request validator. All request fields are compared canonically between A and B.

Both Step 114-2U results must be `approval_verified`, use the merged verification summary contract, report the accepted approval decision and verified signature, have empty blocking issues, and preserve all inherited fixed-false outputs. Verification receipt, request, response, observed-file, repository, signer, timestamp, execution-package, and count identities are compared between A and B. The shared request, bundle, repository, execution-package, and count identities must also agree exactly across 2T and 2U.

## Package identity and hash

`authorityPackageId` uses SHA-256 with domain `FINPLE_STEP114_2V_AUTHORITY_PACKAGE_ID\0`. Its identity payload binds request ID/hash, verification receipt hash, response ID/hash, operator-bundle hash, repository HEAD/tree, execution-package hash, and target-path-absence evidence hash.

`authorityPackageHash` uses SHA-256 with domain `FINPLE_STEP114_2V_AUTHORITY_PACKAGE_HASH\0` over the complete canonical package excluding only `authorityPackageHash`.

Canonicalization recursively sorts object keys while preserving array order. It rejects sparse arrays, missing or extra package keys, `undefined`, non-finite numbers, `Date`, `Buffer`, functions, symbols, bigint values, and custom-prototype objects. Candidates A and B must have identical IDs, canonical bytes, and hashes.

The package contains exactly the Issue #271 allowlist of safe identity fields, two ordered target summaries, counts, fixed authority requirements, and its hash. It contains no source bytes, selector bytes, target bytes, diff, rollback bundle, approval receipt, signature, key, allowlist content, command, or absolute path.

## Target and policy checks

The targets must be ordered as `us_price_metrics`/`US` and `kr_price_metrics`/`KR`, use the existing safe Step 114-2T target schema, positive byte and row counts, valid hashes, the exact schema version, and `create_only`. Their repository paths must remain distinct under the shared NFC, conservative case-fold, and filesystem-equivalence identity rule.

Counts are fixed to two target files, two planned creates, and zero deletes. Authority requirements mandate a separate explicit execution invocation, fresh repository and approval reverification, the exact execution-package hash, create-only writes, exactly two selector replacements, and a single-use execution receipt. Target deletion and automatic rollback remain disallowed.

## Public-result and redaction boundary

Ready output may set only the package-ready, approval-response-verified, and signature-verified readiness booleans. Blocked and idle outputs suppress the package, IDs, hashes, repository identity, execution-package hash, and counts.

All states keep these values false:

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

The CLI accepts exactly `--repo`, `--input`, `--response`, and `--allowlist`, emits one sanitized JSON line, writes no artifact, and maps ready/blocked/invocation-or-runtime to exit codes 0/1/2.

## Protected-scope evidence

The implementation is limited to the 2V library, CLI, focused test, and this audit. It performs no filesystem write, Git mutation, signing, network, DB, provider, deployment, publication, pointer, rollback, or loader action. Tests generate all repositories, bundles, response files, allowlists, keys, and target content only in test-owned temporary directories.

No selector, overlay CSV, production loader or pointer, scenario monthly returns, Step 4/5/6 calculation path, DB/auth/payment/subscription/MY PAGE code, trading/provider code, or deployment workflow is changed.

## Validation record

The implementation passed:

- Step 114-2V focused suite: 27 tests;
- real production-default Step 114-2T A/B and Step 114-2U A/B integration plus the actual Step 114-2V CLI;
- Step 114-2T through 2V combined suite: 166 tests;
- Step 114-2Q through 2V combined suite: 374 tests;
- Step 114-2N through 2V combined suite: 578 tests;
- Step 114-2M Python candidate-package suite: 16 tests;
- Python metrics discovery suite: 48 tests;
- `npm.cmd run check:scenario-metrics`: 80 tests;
- `npm.cmd run build`;
- `npm.cmd run check:ai-production`;
- `git diff --check`;
- `git diff --cached --check`.

The repository-wide `node --test` command was attempted with the requested 120-second bound. It continued producing passing results until the timeout, and no failure appeared in the captured output.
