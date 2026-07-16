# FINPLE Step 114-2N Signed Approval Receipt Preflight Audit

Date: 2026-07-16

## Scope

Step 114-2N adds a server-verifiable signed approval receipt preflight for Step 114-2M production candidate packages.
It records whether a candidate package has owner, source-use, and data-quality approval evidence sufficient for a future loader review.

This step does not activate any production loader, publish data, export data to the app, connect Step 4/5/6 provider payloads, or create public/API runtime access.

Required fixed outputs remain:

- `productionPublishReady=false`
- `appExportApproved=false`
- `loaderActivated=false`

## Package, Receipt, Loader Activation

The candidate package is the deterministic offline artifact created by Step 114-2M.
The signed approval receipt is a separate owner/source-use/data-quality attestation bound to that package identity.
Loader activation is a future production step and is not authorized here.

`loaderPreflightReady=true` means only:

- the signed approval receipt verified;
- the signer was allowlisted for the required scope and role;
- the candidate manifest identity matched the signed payload;
- the candidate manifest still had publication/app/export flags disabled.

It does not mean the package may be loaded by production code.

## Receipt Contract

Contract version:

```text
metrics-candidate-approval-receipt-v1-step114-2n
```

Required fields:

- `contractVersion`
- `receiptId`
- `approvalScope=candidate_review_to_loader_preflight`
- `candidatePackageId`
- `candidatePackageHash`
- `zipPackageSha256`
- `metricBaseDate`
- `pipelineVersion`
- `normalizationVersion`
- `calculationPolicyVersion`
- `sourceDeclarationHash`
- `submissionManifestHash`
- `issuedAt`
- optional `expiresAt`
- `signerKeyId`
- `signerId`
- `signatureAlgorithm=Ed25519`
- `attestations`
- `signatureBase64`

Required true attestations:

- `ownerApproved`
- `sourceUseApproved`
- `dataQualityApproved`
- `investmentAdviceNotProvided`
- `productionActivationNotAuthorized`

## Canonical Signed Payload

The signature covers the receipt payload with `signatureBase64` removed.
Canonical JSON is serialized with deterministic object key ordering, stable array ordering, JSON-compatible primitive encoding, and UTF-8 bytes.
Any signature created over different bytes fails verification.

## Ed25519 Verification

Verification uses Node built-in `crypto` Ed25519 verification.
Tests generate ephemeral key pairs in memory with `crypto.generateKeyPairSync("ed25519")`.
No private key, real signed receipt, real candidate data, or raw provider payload is committed.

## Allowlist Contract

Allowlist entries are supplied through `FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON` or an explicit local non-committed source.
Each entry binds:

- `signerKeyId`
- `signerId`
- `publicKeyPem`
- `allowedScopes`
- `roles`
- `revoked=false`

The required scope is `candidate_review_to_loader_preflight`.
The required role is `metrics_candidate_approval_signer`.

Missing, malformed, empty, duplicate, unknown, revoked, scope-mismatched, role-mismatched, signer-mismatched, or invalid public-key allowlists block fail-closed.

## Candidate Identity Binding

The verifier treats the candidate manifest as untrusted input and requires exact equality for:

- `candidatePackageId`
- `candidatePackageHash`
- `metricBaseDate`
- `pipelineVersion`
- `normalizationVersion`
- `calculationPolicyVersion`
- `sourceDeclarationHash`
- `submissionManifestHash`

The separately supplied `zipPackageSha256` must exactly match the signed receipt value.
The verifier does not infer or invent a missing ZIP hash.

The candidate manifest must also keep:

- `fixturePackageReady=false`
- `candidatePackageReady=true`
- `productionPublishReady=false`
- `appExportApproved=false`
- `externalProviderCalls=false`
- `blockingIssueCount=0`

Any fixture, blocked, review-only, provider-enabled, production-enabled, app-enabled, or externally fetched candidate remains blocked.

## Replay And Expiry

Replay checks are implemented through an injected in-memory registry interface.
No DB or persistent store is introduced.
A reused `receiptId` blocks when the injected registry reports it has already been used.

`issuedAt` must be a valid timestamp and may not be in the future beyond the explicit clock-skew allowance.
`expiresAt`, when present, must be valid, later than `issuedAt`, and not expired.

## Fail-Closed States

The verifier returns:

- `idle` when no receipt/manifest/ZIP input is supplied;
- `blocked` for malformed input, invalid signatures, allowlist failures, identity mismatches, expiry/replay failures, or candidate flag violations;
- `ready` only when receipt verification, signer allowlist, candidate binding, ZIP hash binding, and candidate readiness all pass.

All states keep:

- `productionPublishReady=false`
- `appExportApproved=false`
- `loaderActivated=false`

## Offline CLI

`scripts/verify-metrics-candidate-approval-receipt.cjs` reads:

- candidate manifest JSON;
- approval receipt JSON;
- ZIP SHA-256 value or a local ZIP path;
- allowlist JSON from an explicit env var or local non-committed file.

The CLI performs no external provider, HTTP, KRX, KIS, data.go.kr, DB, payment, auth, trading, or scenario runtime call.

## Rollback

Rollback is limited to removing:

- `server/src/services/metricsCandidateApprovalReceipt.js`
- `server/src/services/metricsCandidateApprovalReceipt.test.js`
- `scripts/verify-metrics-candidate-approval-receipt.cjs`
- this audit document

No production loader pointer, app export, DB schema, or scenario runtime is changed by this step.

## Future Loader Handoff

A future production loader activation step must independently verify:

- a non-fixture candidate package is eligible for publication;
- signed receipt verification passes against production-owned allowlist configuration;
- package manifest, readiness, package index, ZIP hash, and source declarations are still current;
- production publish and app export approvals are explicitly authorized in that later step.

Step 114-2N intentionally stops at `loaderPreflightReady`.
