# FINPLE Step 114-2Q Exact Cutover Execution-Package Preflight Audit

Date: 2026-07-16

## Scope

Step 114-2Q adds a pure, fail-closed preflight that assembles and verifies an exact in-memory cutover execution package.

It does not write target CSV files, modify the operating selector, stage or commit Git changes, push, merge, deploy, publish metrics, activate app export, mutate a loader pointer, or execute rollback.

`executionPackageReady=true` means only that the immutable package passed verification. A later separately authorized execution step must recheck repository HEAD, clean worktree state, approvals, target bytes, and selector preimage before performing any write.

## Stage Separation

The stages remain separate:

1. **Step 114-2M candidate package** builds and verifies an offline non-fixture package from an approved manual operator upload.
2. **Step 114-2N signed preflight receipt** verifies owner, source-use, and data-quality approval evidence while explicitly denying production activation authority.
3. **Step 114-2O eligibility dry-run** re-verifies the package, ZIP, receipt, freshness, versions, source boundary, and allowlist.
4. **Step 114-2P final approvals and rehearsal** verifies independent production-publication and app-export approvals and rehearses current, target, and rollback pointer identities in memory.
5. **Step 114-2Q execution-package preflight** re-runs Step 114-2P and binds exact target bytes, exact repository/selector preimage, an internally constructed two-import selector postimage, deterministic diff evidence, and rollback selector bytes.
6. **Later execution step** must separately authorize any real create-only file write, selector mutation, commit, push, deployment, publication, activation, or rollback.

## Contracts

Step 114-2Q uses:

```text
metrics-cutover-execution-package-v1-step114-2q
metrics-selector-exact-diff-v1-step114-2q
metrics-cutover-execution-policy-v1-step114-2q
metrics-repository-preimage-v1-step114-2q
metrics-cutover-rollback-bundle-v1-step114-2q
```

It directly reuses the merged Step 114-2P evaluator and the already verified target evidence contract:

```text
metrics-final-approval-bundle-v1-step114-2p
metrics-target-export-verification-evidence-v1-step114-2p
```

## Dynamic Repository State And Selector Provenance

Step 114-2Q separates two different identities:

```text
selectorProvenanceCommitSha
repositoryHeadSha
```

`selectorProvenanceCommitSha` explains which trusted source commit introduced the selector bytes represented by the merged Step 114-2P current pointer snapshot.

`repositoryHeadSha` is the actual repository HEAD inspected for the execution package. It is not the old main branch-point SHA and is not permanently hardcoded. A later read-only adapter is expected to supply it from:

```text
git rev-parse HEAD
```

The branch name is also dynamic. Repository preimage, execution policy, and trusted options must agree exactly, but the service does not permanently restrict use to the Step 114-2Q feature branch. A post-merge read-only adapter may supply `main` and the merged HEAD.

## Step 114-2P Direct Reuse

The service accepts the complete raw Step 114-2P input as:

```text
finalApprovalInput
```

It calls:

```text
evaluateMetricsFinalApprovalCutoverRehearsal
```

with trusted Step 114-2P options and requires:

```text
status=ready
ok=true
cutoverRehearsalReady=true
productionPublishReady=false
appExportActivated=false
pointerMutationAuthorized=false
pointerMutationExecuted=false
rollbackExecuted=false
loaderActivated=false
```

Caller-supplied `cutoverRehearsalReady` or `executionPackageReady` shortcuts block.

The complete re-evaluated Step 114-2P result is canonicalized with deterministic recursive object-key ordering and hashed as:

```text
cutoverRehearsalEvidenceHash
```

The final execution-package hash binds that evidence hash rather than trusting a caller-provided readiness boolean.

## Repository Preimage

The untrusted repository evidence contract contains:

```text
contractVersion
selectorProvenanceCommitSha
repositoryHeadSha
repositoryTreeSha
selectorPath
selectorContentBase64
selectorSha256
trackedPaths[]
trackedPathsSha256
worktreeClean
branchName
```

The pure service requires:

- exact repository preimage contract version;
- exact selector provenance agreement with the trusted Step 114-2P current snapshot;
- exact repository HEAD agreement across preimage, policy, and trusted options;
- exact repository tree agreement across preimage, policy, and trusted options;
- exact dynamic branch agreement across preimage, policy, and trusted options;
- `worktreeClean=true` as a real boolean;
- safe, unique repository-relative tracked paths;
- tracked paths canonicalized as a sorted unique list joined with a NUL delimiter;
- declared tracked-path SHA-256 equal to the recomputed inventory hash;
- recomputed inventory hash equal to the trusted repository-state hash;
- all current trusted selector/component paths represented in the tracked inventory;
- both target paths absent from the tracked inventory;
- canonical nonempty base64 selector bytes;
- declared selector SHA-256 equal to the recomputed actual-byte hash;
- recomputed selector hash equal to the trusted Step 114-2P current selector hash;
- valid UTF-8 bytes;
- exactly one current US import source and statement;
- exactly one current KR import source and statement.

The pure service does not call Git, GitHub, Render, Vercel, a filesystem adapter, or any network API.

## Actual Selector Preimage

The operating selector is:

```text
src/data/tickers/screenerCandidateOverlay.js
```

Its current price-metrics imports are exactly:

```text
import usPriceMetricsOverlayCsv from "./us_price_metrics_overlay_20260528_app_ready.csv?raw";
import krPriceMetricsOverlayCsv from "./kr_price_metrics_overlay_20260528_app_ready.csv?raw";
```

Step 114-2Q does not modify this file.

## Execution Policy

The required explicit policy is:

```text
policyVersion=metrics-cutover-execution-policy-v1-step114-2q
expectedSelectorProvenanceCommitSha
expectedRepositoryHeadSha
expectedRepositoryTreeSha
expectedTrackedPathsSha256
requiredBranchName
requireCleanWorktree=true
requireCreateOnlyTargets=true
requireExactTwoSelectorReplacements=true
allowTargetDeletionOnRollback=false
```

Trusted repository-state options require:

```text
expectedRepositoryHeadSha
expectedRepositoryTreeSha
expectedTrackedPathsSha256
requiredBranchName
```

Missing, malformed, stale, mismatched, or permissive values block. A caller-supplied `trackedPaths` array alone cannot prove target absence.

## Target File Package

Step 114-2Q accepts no second independent target-byte input.

It consumes only:

```text
finalApprovalInput.targetExportVerificationEvidence.usTarget
finalApprovalInput.targetExportVerificationEvidence.krTarget
```

after Step 114-2P has reverified the evidence.

The service independently decodes the exact base64 bytes and recomputes their SHA-256 and byte sizes. It verifies role, path, import identity, market, schema version, row count, current target pointer snapshot binding, and tracked-path absence.

Exactly two planned files are produced:

```text
US price-metrics CSV
KR price-metrics CSV
```

Each contains:

```text
role
path
contentBase64
sha256
byteSize
rowCount
market
schemaVersion
importName
writeMode=create_only
```

No overwrite mode and no third file write can be emitted.

## Exact Selector Transformation

The selector postimage is constructed internally from the verified selector preimage.

Only these two source literals are replaced:

```text
./us_price_metrics_overlay_20260528_app_ready.csv?raw
./kr_price_metrics_overlay_20260528_app_ready.csv?raw
```

Each becomes:

```text
./<verified target basename>.csv?raw
```

The import variable names remain:

```text
usPriceMetricsOverlayCsv
krPriceMetricsOverlayCsv
```

The service requires:

- each old source and complete import statement occurs exactly once;
- each new source and complete import statement occurs exactly once;
- replacement count is exactly two;
- changed-line count is exactly two;
- no whitespace, line-ending, formatting, declaration, parser, field-list, or other byte change;
- caller-proposed selector bytes and hash equal the internally constructed postimage exactly.

Variable renames, whitespace changes, extra lines, formatting changes, unrelated logic changes, or a third replacement block.

## Deterministic Exact-Diff Evidence

The exact-diff evidence contains:

```text
contractVersion
selectorPath
preimageSha256
postimageSha256
replacementCount=2
replacements[]
changedLineCount=2
otherChangesDetected=false
```

Each replacement binds:

```text
importName
oldSource
newSource
oldLineHash
newLineHash
```

The diff evidence is derived from actual preimage/postimage bytes. It is not accepted as caller authority.

## Rollback Bundle

The deterministic rollback bundle contains:

```text
contractVersion=metrics-cutover-rollback-bundle-v1-step114-2q
selectorPath
rollbackSelectorContentBase64
rollbackSelectorSha256
expectedPostCutoverSelectorSha256
restoresCurrentPointerIdentityHash
rollbackFileDeletes=[]
```

The rollback selector bytes and hash equal the verified original selector preimage exactly.

Newly created target CSVs may remain unreferenced after rollback. Step 114-2Q does not authorize their automatic deletion and emits no executable rollback command.

## Execution-Package Hash

The complete immutable package payload is canonicalized and hashed with SHA-256 while excluding its own `executionPackageHash` field.

The hash binds:

- complete Step 114-2P evidence hash;
- candidate package ID and hash;
- ZIP SHA;
- package-index filename;
- complete verified repository preimage evidence, including selector provenance, actual repository HEAD, tree SHA, dynamic branch, clean-worktree state, canonical tracked-path inventory/hash, selector bytes, and selector hash;
- exact selector preimage bytes and hash;
- both create-only target file bytes, hashes, sizes, row counts, markets, schemas, paths, and import identities;
- exact selector postimage bytes and hash;
- deterministic two-import diff;
- current, target, and rollback pointer identities;
- exact rollback selector bytes;
- explicit execution policy;
- planned write count of two;
- planned delete count of zero.

Any bound-field mutation changes the package hash.

## Result Contract

Every `package_ready`, `blocked`, and `idle` result contains safe defaults for:

```text
ok
status
contractVersion
candidatePackageId
candidatePackageHash
zipPackageSha256
cutoverRehearsalEvidenceHash
cutoverRehearsalReverified
selectorProvenanceVerified
repositoryHeadVerified
repositoryTreeVerified
trackedPathsVerified
repositoryPreimageVerified
currentSelectorPreimageVerified
targetFilesVerified
proposedSelectorVerified
exactDiffVerified
rollbackBundleReady
executionPackageReady
executionPackageHash
selectorPreimageSha256
selectorPostimageSha256
targetFileCount
plannedWriteCount
plannedDeleteCount
targetFiles
exactDiff
rollbackBundle
executionPackage
blockingIssues
warningIssues
```

The following outputs are fixed in every state:

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

Caller attempts to set these outputs true or to malformed truthy representations block.

Execution artifacts are emitted only for `package_ready`.

Every `blocked` and `idle` result forces:

```text
executionPackageHash=""
executionPackage={}
targetFiles=[]
exactDiff={}
rollbackBundle={}
targetFileCount=0
plannedWriteCount=0
plannedDeleteCount=0
```

The canonical execution-package payload and hash are calculated only after every non-package gate passes. Target base64 bytes, selector diff evidence, and rollback selector bytes are therefore not exposed by a blocked result.

## Fail-Closed Test Coverage

Focused synthetic tests cover:

- valid `package_ready` result;
- deterministic output and input immutability;
- complete idle result;
- Step 114-2P blocked propagation;
- caller readiness shortcuts;
- repository HEAD different from the old main branch-point;
- repository, policy, and trusted HEAD mismatches;
- valid dynamic HEAD and branch;
- post-merge `main` and merged HEAD usability;
- selector provenance mismatch;
- dirty or malformed worktree state;
- missing, malformed, stale, or permissive execution policy;
- repository tree mismatch;
- tracked inventory hash mismatch;
- target present in trusted inventory but omitted by caller evidence;
- duplicate, malformed, reordered-equivalent, and valid absent-target inventories;
- selector preimage hash mismatch;
- missing or duplicate current imports;
- target path already tracked;
- exact two create-only target entries sourced from Step 114-2P evidence;
- target byte, hash, and size mismatches;
- exact two-import diff;
- import variable rename;
- whitespace or unrelated formatting change;
- extra line or third replacement;
- selector postimage declared hash mismatch;
- rollback restoration of exact preimage with no target deletion;
- deterministic and mutation-sensitive execution-package hash;
- caller execution-authorization attempts;
- suppression of package hash, package object, target bytes, diff, rollback bundle, and counts for every blocked/idle result;
- no filesystem, Git, network, DB, deployment, publication, pointer, or rollback mutation;
- fixed false outputs in `package_ready`, `blocked`, and `idle`.

## Protected Scope

Step 114-2Q does not modify or create:

- `src/data/tickers/screenerCandidateOverlay.js`;
- either current US/KR app-ready price-metrics CSV;
- any target overlay CSV;
- any production loader or pointer;
- `data/processed/scenario_monthly_returns.csv`;
- Step 4 probability calculations;
- Step 5 external-shock calculations;
- Step 6 AI context or provider behavior;
- DB, auth, payment, subscription, or MY PAGE code;
- trading readiness, quotes, orders, authority, or kill-switch code;
- provider, KRX, KIS, or data.go.kr ingestion;
- deployment workflows;
- real candidate packages, keys, approvals, receipts, ZIPs, target data, credentials, or secrets.

## Handoff

A later explicitly authorized execution step may consume a `package_ready` result only after independently rechecking:

- repository HEAD and branch;
- clean worktree state;
- selector preimage bytes and hash;
- target paths remain absent;
- target bytes and hashes;
- approval freshness and authority;
- exact execution-package hash.

Step 114-2Q itself grants no write, commit, push, merge, deployment, publication, app-export, pointer, loader, or rollback authority.
