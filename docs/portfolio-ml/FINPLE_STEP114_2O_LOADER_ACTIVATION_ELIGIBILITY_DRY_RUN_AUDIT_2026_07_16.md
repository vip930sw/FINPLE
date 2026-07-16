# FINPLE Step 114-2O Loader Activation Eligibility Dry-Run Audit

Date: 2026-07-16

## Scope

Step 114-2O adds a pure, fail-closed production loader activation eligibility dry-run. It determines only whether a reviewed Step 114-2M candidate package may proceed to a later production approval and pointer-cutover review.

This step does not publish metrics, approve app export, mutate a loader or pointer, activate a loader, call an external provider, write a database, or change Step 4 probability, Step 5 external-shock, or Step 6 AI provider behavior.

## Separation Of Responsibilities

The four stages remain separate:

1. **Step 114-2M candidate package**: builds and verifies an offline review package. `candidatePackageReady=true` means internally reviewable only.
2. **Step 114-2N approval receipt**: verifies a signed owner/source-use/data-quality attestation bound to the candidate and ZIP identity. Its `productionActivationNotAuthorized=true` attestation explicitly denies final activation authority.
3. **Step 114-2O eligibility dry-run**: independently re-verifies the receipt, candidate identity, package index, ZIP binding, freshness, versions, and production allowlist configuration. `activationDryRunEligible=true` means only eligible for a later review.
4. **Later final activation step**: must separately obtain production and app-export approvals and perform a reviewed pointer cutover. It is not implemented here.

## Eligibility Contract

The service contract is:

```text
metrics-loader-activation-eligibility-v1-step114-2o
```

The freshness policy contract is:

```text
metrics-loader-activation-freshness-policy-v1-step114-2o
```

Every `eligible`, `blocked`, and `idle` result contains:

```text
ok
status
contractVersion
candidatePackageId
candidatePackageHash
candidatePackageReady
approvalReceiptVerified
signerAllowed
candidateIdentityBound
packageIndexVerified
zipIdentityBound
sourceApprovalCurrent
productionAllowlistConfigured
activationDryRunEligible
productionApprovalRequired
appExportApprovalRequired
productionPublishReady
appExportApproved
loaderPointerMutationPlanned
loaderActivated
blockingIssues
warningIssues
```

The following values are fixed in every state:

```text
productionApprovalRequired=true
appExportApprovalRequired=true
productionPublishReady=false
appExportApproved=false
loaderPointerMutationPlanned=false
loaderActivated=false
```

## Step 114-2M Verification Boundary

The reused Step 114-2M contracts are:

```text
production-candidate-package-v1-step114-2m
candidate-package-v1-step114-2m
candidate-final-package-index-v1-step114-2m
candidate-package-verification-evidence-v1-step114-2o
```

The Node service validates the actual package-index schema from `scripts/metrics_pipeline/candidate_package.py`:

- `hashAlgorithm=sha256-json-canonical`;
- `zipMemberHashAlgorithm=sha256-file-or-json-with-explicit-field-exclusion`;
- the exact ten version-bound payload member names;
- one safe, self-excluded package-index filename;
- unique member paths with no missing or extra members;
- exact byte sizes;
- exact SHA-256 member hashes;
- `candidatePackageHash` exclusions only for candidate manifest and readiness JSON;
- the canonical index hash with the index's own `candidatePackageHash` excluded;
- candidate manifest and readiness identity/flag binding;
- source declaration and submission manifest hashes carried by the signed candidate manifest.

The evaluator consumes in-memory base64 member bytes and recomputes the same per-member hash rules. Python `verify_candidate_package()` now returns versioned evidence containing `contractVersion`, `ok`, `issues`, `zipPackageSha256`, `candidatePackageHash`, and `packageIndexFile`. The ZIP SHA-256 is computed from the actual ZIP bytes, the candidate hash comes from the verified package index, and the index filename is the exact verified archive member.

Node requires the evidence ZIP SHA to equal the explicit evaluator ZIP SHA, and requires the evidence candidate hash to equal the package index, candidate manifest, and signed receipt candidate hashes. The evidence index filename must equal `packageIndex.selfExcludedIndexFile`. A bare `{ok: true, issues: []}` object is insufficient. The service does not parse or reinterpret ZIP container bytes and does not claim to replace Python `verify_candidate_package()`. Python remains authoritative for the exact ZIP member set and actual archive member bytes. `zipIdentityBound` remains a separate Step 114-2N signed ZIP SHA-256 binding.

This boundary avoids inventing a second ZIP format or silently trusting a caller-supplied `loaderPreflightReady` or package-ready boolean.

## Step 114-2N Verifier Reuse

The service directly calls:

```text
verifyMetricsCandidateApprovalReceipt
```

The reused receipt contract is:

```text
metrics-candidate-approval-receipt-v1-step114-2n
```

The call rechecks the receipt contract, Ed25519 signature, explicit `revoked=false`, signer identity, role, scope, candidate manifest fields, ZIP SHA-256, timestamps, expiry, and an injected replay registry. The service never trusts a supplied `loaderPreflightReady` value.

Receipt fields attempting to grant production activation, publication, app export, pointer mutation, or loader activation block the dry-run. The Step 114-2N `productionActivationNotAuthorized=true` attestation remains a negative boundary, not production approval.

Final-approval-only fields are inspected before idle classification. The same six fields are checked at the top-level evaluator input, candidate manifest, approval receipt, and parsed candidate readiness member:

```text
productionApprovalGranted
productionActivationAuthorized
productionPublishReady
appExportApproved
loaderPointerMutationPlanned
loaderActivated
```

Only explicit `false` or absence is safe. `true`, string `"true"`, numeric `1`, null, and other malformed representations block fail-closed. A final-flag-only request therefore returns `blocked`, never `idle`.

## Step 114-2M Source Boundary

Candidate readiness is rechecked against the merged non-fixture source contract. The candidate manifest must keep:

```text
sourceKind=manual_operator_upload
sourceDeclaration.fixtureOnly=false
sourceDeclaration.testOnly=false
```

`sourceDeclaration` must be an object. Both `appUseReviewStatus` and `redistributionReviewStatus` must use one of the Step 114-2M approved values: `approved`, `allowed`, or `reviewed_approved`. Fixture/test markers, fixture or synthetic source kinds, and unapproved source-use states block.

## Freshness And Version Policy

The evaluator requires an explicit policy object with:

```text
policyVersion
maxMetricAgeDays
maxReceiptAgeHours
requiredPipelineVersion
requiredNormalizationVersion
requiredCalculationPolicyVersion
```

Both age limits must be positive integers. All required versions must be non-empty and must match both the Step 114-2M candidate manifest and the Step 114-2N receipt. Evaluation requires an explicit valid `now` option, allowing deterministic UTC date and timestamp comparisons.

Missing or malformed policy, missing evaluation time, a future or stale metric base date, a future/stale/expired receipt, or a required version mismatch blocks.

## Production Allowlist Source

Production configuration is read from:

```text
FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON
```

Tests inject an ephemeral allowlist through the trusted service options. Caller-supplied candidate JSON cannot replace production configuration. The service passes the selected production-side JSON to the Step 114-2N verifier; missing, malformed, empty, duplicate, revoked, disallowed, non-Ed25519, or otherwise invalid entries block.

No private key, real public-key allowlist, real receipt, credential, or secret is committed or logged.

## Deterministic States

### eligible

Returned only when candidate readiness, Step 114-2N verification, signer allowlist, candidate/ZIP binding, Python package verification result, package-index/member verification, freshness, versions, and production allowlist configuration all pass.

### blocked

Returned for any supplied input that does not satisfy every gate. Issue codes are sorted and deduplicated. Important issue families include:

- `candidate_manifest_*`;
- `approval_*` and `receipt_*` from Step 114-2N;
- `candidate_package_verification_*`;
- `package_index_*` and `package_member_*`;
- `metric_base_date_*` and `approval_receipt_*`;
- `freshness_policy_*` and `required_*_mismatch`;
- `production_allowlist_not_configured`;
- `final_approval_flag_forbidden:*`.

### idle

Returned when no candidate, receipt, package index, member payload, Python verification result, ZIP SHA, or freshness policy is supplied. All readiness and activation fields use safe false or empty defaults.

## Safety Evidence

The implementation is a pure service under `server/src/services/` and imports only Node cryptography plus the Step 114-2N verifier. It contains no filesystem, HTTP, provider, KRX, KIS, data.go.kr, database, loader, pointer, app-export, or publication operation.

Focused tests cover eligible/blocked/idle results, determinism, input immutability, Ed25519 failure propagation, exact Python ZIP evidence binding, bare/fabricated evidence rejection, candidate/ZIP/index/member/source/version tampering, missing/extra/duplicate members, non-fixture source metadata, candidate safety flags, allowlist absence, policy errors, stale timestamps, expiry, replay, final-approval-only inputs across all four input surfaces, malformed truthy approval values, and fixed false output invariants.

No `/admin/trading`, `/mypage`, homepage, public route, or other UI/API surface is added.

## Rollback

Rollback consists only of removing:

- `server/src/services/metricsLoaderActivationEligibility.js`;
- `server/src/services/metricsLoaderActivationEligibility.test.js`;
- this audit document.

There is no data rollback, database rollback, provider rollback, loader rollback, or pointer rollback because Step 114-2O performs no mutation.

## Handoff

A later, separately scoped step may consume an `eligible` dry-run result only as input to a final approval review. That step must independently define production approval, app-export approval, reviewed cutover authority, rollback, and loader pointer mutation. Until that work is explicitly approved and implemented, production publication, app export, pointer mutation, and loader activation remain false.
