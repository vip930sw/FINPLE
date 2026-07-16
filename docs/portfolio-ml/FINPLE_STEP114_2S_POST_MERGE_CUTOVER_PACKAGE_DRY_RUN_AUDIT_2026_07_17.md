# FINPLE Step 114-2S Post-Merge Cutover Package Dry-Run Audit

Date: 2026-07-17
Issue: #265

## 1. Contracts

Step 114-2S implements:

- `metrics-cutover-post-merge-dry-run-input-v1-step114-2s`
- `metrics-cutover-post-merge-dry-run-v1-step114-2s`
- `metrics-cutover-post-merge-dry-run-summary-v1-step114-2s`

It directly reuses:

- `metrics-cutover-repository-state-adapter-v1-step114-2r`
- `metrics-cutover-target-path-absence-evidence-v1-step114-2r`
- `metrics-cutover-execution-package-v1-step114-2q`
- `metrics-selector-exact-diff-v1-step114-2q`

`dryRunReady=true` means only that a non-executing in-memory package assembly
was reproducible across a stable repository interval. It grants no execution
authority.

## 2. Stage boundary

The exact flow is:

```text
validated operator bundle
Step 114-2R snapshot A
internally generated proposed-selector evidence A
Step 114-2Q package A
Step 114-2R snapshot B
internally generated proposed-selector evidence B
Step 114-2Q package B
matching deterministic package summary
```

The coordinator does not create target CSVs, modify the selector, stage
runtime files, commit runtime data, deploy, publish, activate app export,
mutate a pointer, or execute rollback.

## 3. Read-only operator bundle boundary

The CLI accepts exactly:

```text
--repo <repository path>
--input <operator bundle JSON path>
```

The input path may be outside the repository. Production code uses only
`lstat`, `realpath`, and `readFile`. It requires:

- an existing regular non-symlink file
- a canonical resolved input path
- a nonempty input no larger than 64 MiB
- strict UTF-8
- valid JSON
- exact top-level keys
- no duplicate top-level JSON keys

There is no stdin fallback, environment-secret fallback, or output-file
option. The input object is not mutated.

The exact top-level fields are:

```text
contractVersion
expectedRepositoryHeadSha
requiredBranchName
evaluationNow
finalApprovalInput
finalApprovalOptions
```

The expected HEAD must be a lowercase 40-character Git SHA. The branch must
be a valid nonempty named branch. `evaluationNow` must be an ISO-8601 instant.
If `finalApprovalOptions.now` is present, it must describe the exact same
instant. Both Step 114-2Q evaluations receive fresh `Date` instances for that
one normalized instant.

If `finalApprovalOptions.eligibilityOptions.now` is present, the JSON string
must be a valid ISO-8601 instant and must equal
`finalApprovalInput.eligibilityEvaluatedAt` at exact millisecond precision.
The parser normalizes the serialized value, and the coordinator supplies
separate fresh `Date` instances with equal milliseconds to package A and
package B. A malformed or mismatched nested clock blocks before snapshot A.
If the nested clock is omitted, it remains omitted so the existing Step
114-2P forced eligibility evaluation time remains authoritative.

## 4. Sensitive-field handling

The parser recursively applies an explicit normalized field-name denylist.
Each key is normalized with Unicode NFC, lowercased, and stripped of
underscores, hyphens, periods, and spaces before exact set membership is
checked. No broad substring match is used.

The explicit set rejects private keys, client/API/app secrets, API keys,
access and refresh tokens, generic `token` and `secret` fields, passwords,
credentials, shell or command fields, and executable-command fields. This
blocks separator variants such as `private_key`, `private-key`,
`client_secret`, `access_token`, `refresh-token`, and `api_key`.

JSON-encoded object and array strings, including allowlist JSON, are also
inspected recursively. Legitimate public verification fields remain allowed,
including:

- `publicKeyPem`
- `signerKeyId`
- `signerId`
- `signatureBase64`
- `receiptId`
- `allowedScopes`

Public verification material may be consumed by Step 114-2P but is never
copied into the public Step 114-2S result. The real integration test exercises
these allowed verification fields and confirms that the CLI output remains
redacted.

## 5. Target derivation

The coordinator accepts no independent target paths. It derives only:

```text
finalApprovalInput.targetExportVerificationEvidence.usTarget.path
finalApprovalInput.targetExportVerificationEvidence.krTarget.path
```

Both must be safe repository-relative CSV paths under `src/data/tickers/` and
must be distinct under the merged NFC and conservative case-fold identity
rule. These exact two paths are passed to both Step 114-2R collections.

## 6. Snapshot A

Snapshot A calls the merged read-only Step 114-2R collector directly and
requires:

```text
status=ready
ok=true
repositoryStateStable=true
worktreeClean=true
targetPathsAbsent=true
```

It also requires exact equality with the bundle's expected repository HEAD and
required branch, plus a valid two-record Step 114-2R target-path absence
evidence object.

If snapshot A blocks, the coordinator stops before generating selector
postimage evidence or invoking Step 114-2Q.

## 7. Pure proposed-selector builder

Step 114-2Q now exports:

```text
buildMetricsCutoverProposedSelectorEvidence
```

The helper consumes only the repository preimage and the Step 114-2P target
export verification evidence. It reuses the existing exact selector
transformation implementation.

It verifies:

- repository preimage contract and selector path
- canonical selector base64 and declared SHA-256
- trusted current selector raw-byte hash
- exact current US/KR import statements
- safe and identity-distinct target paths
- exactly two import-source literal replacements
- unchanged import variable names and unrelated bytes

Success returns only the proposed-selector contract fields required by Step
114-2Q. Failure suppresses `selectorContentBase64` and `selectorSha256`.

## 8. Package A

Package A is constructed from:

- the raw bundle `finalApprovalInput`
- snapshot A target-path absence evidence
- snapshot A repository preimage
- snapshot A execution policy
- internally generated proposed-selector evidence A

Top-level Step 114-2Q repository trust comes only from snapshot A
`trustedOptions`. Caller values cannot override repository HEAD, tree,
tracked inventory, absence evidence, or branch bindings.

The normalized final approval options are supplied only through the nested
`finalApprovalOptions` field. Package A must be `package_ready`, have a valid
execution-package hash, and keep every authorization output false.

## 9. Snapshot B and stable interval

Only after package A is fully assembled in memory does the coordinator collect
snapshot B for the same repository and exact same target paths. There is no
retry.

Snapshots A and B must match for:

- repository HEAD
- repository tree
- branch
- tracked-path inventory hash
- selector hash
- target-path absence evidence hash
- repository selector base64
- repository selector hash
- repository tracked-path hash

Both snapshots must still match the operator bundle's expected HEAD and
required branch.

## 10. Package B and deterministic package comparison

Proposed-selector evidence B is regenerated from snapshot B. Step 114-2Q is
then evaluated again with the same final approval input and normalized
evaluation instant.

Packages A and B must match for:

- execution-package hash
- selector preimage hash
- selector postimage hash
- cutover rehearsal evidence hash
- candidate package ID and hash
- ZIP package hash
- target file count
- planned write count
- planned delete count

Any mismatch blocks and suppresses the public execution-package hash.

## 11. Public result allowlist

The public result is constructed from an explicit allowlist. Ready target
summaries contain only:

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

The public result never exposes:

- execution-package objects
- target `contentBase64`
- selector preimage or postimage base64
- rollback selector base64 or rollback bundle
- full exact-diff objects
- approval receipts or receipt IDs
- signatures
- public keys or allowlist JSON
- private keys, credentials, tokens, or passwords
- raw operator bundles

For blocked and idle results:

```text
executionPackageHash=""
targetSummaries=[]
targetFileCount=0
plannedWriteCount=0
plannedDeleteCount=0
```

## 12. Fixed false outputs

Every state preserves:

```text
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

## 13. Dependency injection and no-side-effect boundary

Tests can inject the bundle reader, Step 114-2R collector, proposed-selector
builder, Step 114-2Q evaluator, and instant parser. Production defaults remain
read-only. A status-only stage observer is available for integration
assertions; it receives only the stage label and status, never repository
bytes, package content, approvals, or keys.

Production Step 114-2S code contains no file-write API, Git mutation command,
network call, database access, provider access, deployment/publication API,
pointer mutation, or rollback execution.

## 14. Validation

The implementation passed:

- Step 114-2S focused suite: 67 tests
- real Step 114-2S end-to-end integration:
  - isolated temporary Git repository with a clean named `main` branch
  - exact current selector and all six trusted current component files
  - one committed synthetic repository HEAD
  - runtime-generated real Ed25519 candidate and final-approval key pairs
  - real signed receipts and verified candidate package/index/member evidence
  - valid in-memory US/KR target CSV bytes and pointer snapshots
  - serialized nested eligibility clock hydrated back to `Date`
  - two real Step 114-2R `ready` snapshots
  - two real Step 114-2Q `package_ready` evaluations
  - identical execution-package hash and two create-only planned writes
  - actual CLI exit code `0` with one sanitized JSON line
- Step 114-2Q, 2R, and 2S combined suite: 208 tests
- Step 114-2N through 2S combined suite: 412 tests
- Step 114-2M Python candidate-package suite: 16 tests
- Python metrics discovery suite: 48 tests
- `npm.cmd run check:scenario-metrics`: 80 tests
- `npm.cmd run build`
- `npm.cmd run check:ai-production`
- `git diff --check`
- `git diff --cached --check`

The repository-wide `node --test` run was attempted for 120 seconds. It
continued producing passing results until the command timeout; no failure was
present in the captured output.

## 15. Protected scope

Step 114-2S does not modify or create:

- `src/data/tickers/screenerCandidateOverlay.js`
- current or target overlay CSVs
- production loader or pointer
- `data/processed/scenario_monthly_returns.csv`
- Step 4/5/6 calculations or AI context
- DB, auth, payment, subscription, or MY PAGE
- trading readiness, orders, authority, or kill switch
- provider, KRX, KIS, or data.go.kr ingestion
- deployment workflows
- real operator bundles, candidate packages, approvals, keys, ZIPs, or target
  data

Execution remains a later, separately authorized step.
