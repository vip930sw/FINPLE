# FINPLE Step 114-2P Final Approval And Cutover Rehearsal Audit

Date: 2026-07-16

## Scope

Step 114-2P adds a pure, fail-closed verifier for two independent final approvals and a deterministic in-memory loader-selection cutover/rollback rehearsal.

This step does not publish metrics, activate app export, mutate `screenerCandidateOverlay.js`, replace an overlay CSV, execute a loader pointer change, deploy, write a database, call a provider, or execute rollback.

`cutoverRehearsalReady=true` means only that the exact Step 114-2O eligibility result, approval receipts, policy, current selection, target selection, and rollback selection are internally consistent. A later separately authorized execution step is still required.

## Stage Separation

The responsibilities remain separate:

1. **Step 114-2M candidate package** creates and verifies an offline non-fixture candidate package.
2. **Step 114-2N preflight receipt** verifies owner, source-use, and data-quality evidence. Its `productionActivationNotAuthorized=true` attestation explicitly denies final activation authority.
3. **Step 114-2O eligibility dry-run** re-verifies the 2M package/index/ZIP evidence, the 2N receipt and production allowlist, freshness, versions, and non-fixture source boundary.
4. **Step 114-2P final approvals and rehearsal** independently verifies production-publication and app-export approvals, then rehearses current/target/rollback loader selection entirely in memory.
5. **Later pointer-execution step** must separately authorize and execute any real file, import, deployment, publication, app-export, pointer, loader, or rollback change.

## Contracts

Step 114-2P uses:

```text
metrics-final-approval-bundle-v1-step114-2p
metrics-cutover-rehearsal-v1-step114-2p
metrics-final-approval-policy-v1-step114-2p
metrics-production-publish-approval-v1-step114-2p
metrics-app-export-approval-v1-step114-2p
metrics-pointer-snapshot-v1-step114-2p
```

The implementation directly reuses:

```text
metrics-loader-activation-eligibility-v1-step114-2o
```

## Step 114-2O Direct Reuse

The service accepts the complete raw Step 114-2O input as `eligibilityInput` and calls:

```text
evaluateMetricsLoaderActivationEligibility
```

Caller-supplied `activationDryRunEligible=true` is never trusted and blocks as an attempted shortcut.

The re-evaluated result must have:

```text
status=eligible
ok=true
activationDryRunEligible=true
productionPublishReady=false
appExportApproved=false
loaderPointerMutationPlanned=false
loaderActivated=false
```

The complete returned Step 114-2O result is canonicalized with recursively sorted JSON object keys and hashed with SHA-256 as:

```text
eligibilityEvidenceHash
```

The caller-provided evidence hash and both independently signed final approval receipts must equal the computed hash. Both receipts also sign `eligibilityEvaluatedAt`; the explicit final approval policy limits evidence age.

## Separate Final Approval Receipts

The production-publication receipt uses:

```text
contractVersion=metrics-production-publish-approval-v1-step114-2p
approvalScope=metrics_production_publish_approval
requiredRole=metrics_production_publish_approver
```

The app-export receipt uses:

```text
contractVersion=metrics-app-export-approval-v1-step114-2p
approvalScope=metrics_app_export_approval
requiredRole=metrics_app_export_approver
```

Both receipts are canonical JSON signed with Ed25519 and bind:

```text
receiptId
candidatePackageId
candidatePackageHash
zipPackageSha256
eligibilityContractVersion
eligibilityEvidenceHash
eligibilityEvaluatedAt
packageIndexFile
currentPointerIdentityHash
targetPointerIdentityHash
rollbackPointerIdentityHash
issuedAt
expiresAt
signerKeyId
signerId
signatureAlgorithm
attestations
```

Receipt IDs must be different. Contract versions and scopes are inherently different. A receipt cannot reuse the Step 114-2N contract as final approval.

Required production attestations are:

```text
productionPublicationReviewed=true
sourceAndLicenseReviewed=true
rollbackPlanReviewed=true
pointerMutationNotAuthorized=true
cutoverExecutionNotAuthorized=true
```

Required app-export attestations are:

```text
appExportReviewed=true
consumerDisclosureReviewed=true
scenarioAndAiBoundaryReviewed=true
pointerMutationNotAuthorized=true
cutoverExecutionNotAuthorized=true
```

Any execution, publication, app activation, pointer mutation, deployment, loader activation, or rollback authorization field blocks. Non-boolean truthy representations such as `"true"` or `1` also block.

## Approval Policy And Allowlist

The explicit policy contract requires:

```text
policyVersion=metrics-final-approval-policy-v1-step114-2p
maxApprovalAgeHours
maxEligibilityEvidenceAgeHours
requireDistinctReceiptIds=true
requireDistinctSignerIds
requireDistinctSignerKeyIds
requiredProductionScope
requiredAppExportScope
```

Both signer-separation fields must be explicit booleans. There is no hidden default that permits a shared signer or shared key.

When the policy requires distinct signer IDs or key IDs, equality blocks. A shared signer/key is permitted only when both corresponding policy fields explicitly use `false`, and the allowlist entry explicitly carries both scopes and roles.

Production allowlist configuration is read only from the trusted service option or:

```text
FINPLE_METRICS_FINAL_APPROVAL_PUBLIC_KEYS_JSON
```

Each allowlist entry requires:

```text
signerKeyId
signerId
publicKeyPem
allowedScopes[]
roles[]
revoked=false
```

Duplicate key identities, malformed entries, missing scopes/roles, revoked or unspecified revocation state, unknown signers, signer mismatch, disallowed scope/role, invalid public keys, and non-Ed25519 keys block.

No private key, real public-key allowlist, real final receipt, secret, credential, or account identifier is committed or logged.

## Actual Current Loader Selection Inventory

The operating selector is:

```text
src/data/tickers/screenerCandidateOverlay.js
```

It uses static raw CSV imports rather than a generic pointer file. The Step 114-2P trusted current snapshot therefore models the actual selector file and all six import identities:

| Role | Import identity | Selected file |
| --- | --- | --- |
| base candidates | `finpleAppCandidates2000Csv` | `src/data/tickers/finple_app_candidates_2000_final_v1.csv` |
| KR ETF dividend | `krEtfDividendOverlayCsv` | `src/data/tickers/kr_etf_dividend_overlay_20260525.csv` |
| KR stock dividend | `krStockDividendOverlayCsv` | `src/data/tickers/kr_stock_dividend_overlay_20260525.csv` |
| US dividend | `usDividendOverlayCsv` | `src/data/tickers/us_dividend_overlay_20260527.csv` |
| US price metrics | `usPriceMetricsOverlayCsv` | `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv` |
| KR price metrics | `krPriceMetricsOverlayCsv` | `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv` |

The trusted inventory is bound to source commit:

```text
89067915d6365fb92bdcc93a4b908206b9cbdacd
```

The service contains the verified repository SHA-256 identities for the selector and all six current files. It does not read or modify those files at runtime.

## Pointer Snapshot Contract

Each untrusted current, target, and rollback snapshot contains:

```text
contractVersion
snapshotKind=current|target|rollback
selector.path
selector.sha256
sourceCommit
components[]
candidatePackageId
candidatePackageHash
zipPackageSha256
packageIndexFile
fixtureOnly=false
testOnly=false
reviewOnly=false
pointerIdentityHash
```

Each component contains its actual loader role, JavaScript import identity, repository-relative path, and SHA-256. Candidate-target price-metrics components also bind the candidate ID, candidate hash, ZIP SHA, and package-index filename.

`pointerIdentityHash` is the canonical SHA-256 of the selector, source commit, normalized role-sorted components, candidate bindings, and safety flags. `snapshotKind` is excluded from this identity so the rollback snapshot can represent the exact same operating selection as current.

## Current, Target, And Rollback Rules

The current snapshot must exactly equal the embedded trusted inventory from the required main baseline.

The target snapshot must:

- retain the same selector path but represent a changed reviewed selector identity;
- use a different source commit identity;
- retain all four non-price-metrics imports unchanged;
- replace both US and KR price-metrics components;
- include all six loader roles with unique identities;
- bind both new price-metrics components to the approved candidate, ZIP, and package index;
- differ from current in actual selected paths/hashes, not only candidate metadata;
- keep fixture, test, and review-only flags false.

A one-market-only replacement is a partial target and blocks.

The rollback snapshot must reproduce the complete current pointer identity exactly:

```text
rollbackPointerIdentityHash === currentPointerIdentityHash
```

Rollback remains independent of the target candidate package.

## Deterministic Rehearsal Plans

When all gates pass, the service returns deterministic in-memory review plans for:

- confirming the exact Step 114-2O eligibility evidence;
- confirming the two independent final approvals;
- comparing current and target selection identities;
- confirming rollback restores the current identity;
- retaining the verified current snapshot;
- reviewing rollback triggers;
- requesting separate rollback execution approval if needed.

Every plan item contains `rehearsalOnly=true`. Plans contain review actions and identity hashes only. They contain no shell command, filesystem command, deployment call, API call, automatic mutation instruction, or executable rollback action.

## Result Contract

Every `ready`, `blocked`, and `idle` result includes:

```text
ok
status
contractVersion
candidatePackageId
candidatePackageHash
zipPackageSha256
eligibilityContractVersion
eligibilityEvidenceHash
eligibilityReverified
productionApprovalVerified
appExportApprovalVerified
approvalPolicySatisfied
currentPointerSnapshotVerified
targetPointerSnapshotVerified
rollbackSnapshotVerified
cutoverPlanReady
rollbackPlanReady
cutoverRehearsalReady
executionApprovalRequired
productionPublishReady
appExportActivated
pointerMutationAuthorized
pointerMutationExecuted
rollbackExecuted
loaderActivated
blockingIssues
warningIssues
```

The following outputs are fixed in every state:

```text
executionApprovalRequired=true
productionPublishReady=false
appExportActivated=false
pointerMutationAuthorized=false
pointerMutationExecuted=false
rollbackExecuted=false
loaderActivated=false
```

`cutoverRehearsalReady=true` means rehearsal passed only. It is not publication, app-export, pointer, loader, deployment, execution, or rollback authority.

## Fail-Closed Coverage

Focused synthetic tests cover:

- valid ready rehearsal;
- deterministic output and input immutability;
- complete safe idle result;
- caller eligibility shortcut rejection and Step 114-2O blocked propagation;
- eligibility evidence hash mismatch;
- production/app receipt tampering;
- expired and future receipts;
- missing and duplicate receipt IDs;
- wrong scopes, roles, signer IDs, unknown keys, revoked keys, and non-Ed25519 keys;
- required distinct signers/keys;
- explicitly permitted shared signer/key policy;
- malformed policy;
- current operating selection mismatch;
- target candidate, ZIP, and package-index mismatch;
- rollback mismatch;
- no-op target;
- fixture, test, review-only, and partial targets;
- execution, deployment, pointer, loader, and rollback authorization attempts;
- malformed truthy authorization representations;
- absence of network, database, filesystem, deployment, and pointer mutation.

## Protected Scope

Step 114-2P does not modify:

- `src/data/tickers/screenerCandidateOverlay.js`;
- either current US/KR app-ready overlay CSV;
- any current overlay CSV;
- any production loader or pointer;
- `data/processed/scenario_monthly_returns.csv`;
- Step 4 probability calculations;
- Step 5 external-shock calculations;
- Step 6 AI provider payload/context;
- DB, auth, payment, subscription, MY PAGE, or trading code;
- provider, KRX, KIS, or data.go.kr ingestion;
- any endpoint, UI, deployment action, or persistent storage.

## Rollback

Code rollback consists only of removing:

- `server/src/services/metricsFinalApprovalCutoverRehearsal.js`;
- `server/src/services/metricsFinalApprovalCutoverRehearsal.test.js`;
- this audit document.

There is no operating data, loader, pointer, application, database, provider, deployment, or trading rollback because this step performs no mutation.

## Handoff

A later separately approved pointer-execution step may consume a `ready` Step 114-2P result as review evidence. That later step must re-verify freshness and authority and separately authorize every real file/import, publication, app-export, deployment, pointer, loader, or rollback action.
