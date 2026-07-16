import assert from "node:assert/strict";
import { generateKeyPairSync, sign as signPayload } from "node:crypto";
import test from "node:test";

import {
  METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
  METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE,
  METRICS_CANDIDATE_APPROVAL_SCOPE,
  canonicalizeApprovalReceiptPayload,
  createInMemoryApprovalReceiptReplayRegistry,
  sha256Hex,
  verifyMetricsCandidateApprovalReceipt,
} from "./metricsCandidateApprovalReceipt.js";

const NOW = new Date("2026-07-16T00:00:00.000Z");

function buildKeyContext() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKey,
    privateKey,
    allowlistEntry: {
      signerKeyId: "finple-owner-test-key-1",
      signerId: "finple-owner",
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: [METRICS_CANDIDATE_APPROVAL_SCOPE],
      roles: [METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE],
      revoked: false,
    },
  };
}

function baseCandidateManifest(overrides = {}) {
  return {
    candidatePackageId: "candidate-package-2026-07-16-kr-us",
    candidatePackageHash: "c".repeat(64),
    metricBaseDate: "2026-07-15",
    pipelineVersion: "finple-monthly-metrics-pipeline-v1",
    normalizationVersion: "finple-timeseries-normalization-v1",
    calculationPolicyVersion: "finple-metrics-calculation-policy-v1",
    sourceDeclarationHash: "d".repeat(64),
    submissionManifestHash: "e".repeat(64),
    fixturePackageReady: false,
    candidatePackageReady: true,
    productionPublishReady: false,
    appExportApproved: false,
    externalProviderCalls: false,
    blockingIssueCount: 0,
    ...overrides,
  };
}

function unsignedReceipt(candidateManifest = baseCandidateManifest(), overrides = {}) {
  return {
    contractVersion: METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: "approval-receipt-001",
    approvalScope: METRICS_CANDIDATE_APPROVAL_SCOPE,
    candidatePackageId: candidateManifest.candidatePackageId,
    candidatePackageHash: candidateManifest.candidatePackageHash,
    zipPackageSha256: "f".repeat(64),
    metricBaseDate: candidateManifest.metricBaseDate,
    pipelineVersion: candidateManifest.pipelineVersion,
    normalizationVersion: candidateManifest.normalizationVersion,
    calculationPolicyVersion: candidateManifest.calculationPolicyVersion,
    sourceDeclarationHash: candidateManifest.sourceDeclarationHash,
    submissionManifestHash: candidateManifest.submissionManifestHash,
    issuedAt: "2026-07-15T23:00:00.000Z",
    signerKeyId: "finple-owner-test-key-1",
    signerId: "finple-owner",
    signatureAlgorithm: "Ed25519",
    attestations: {
      ownerApproved: true,
      sourceUseApproved: true,
      dataQualityApproved: true,
      investmentAdviceNotProvided: true,
      productionActivationNotAuthorized: true,
    },
    ...overrides,
  };
}

function signReceipt(privateKey, receipt) {
  const payload = canonicalizeApprovalReceiptPayload(receipt);
  return {
    ...receipt,
    signatureBase64: signPayload(null, Buffer.from(payload, "utf8"), privateKey).toString("base64"),
  };
}

function buildValidInputs(overrides = {}) {
  const keyContext = buildKeyContext();
  const candidateManifest = baseCandidateManifest(overrides.candidateManifest);
  const receipt = signReceipt(
    keyContext.privateKey,
    unsignedReceipt(candidateManifest, overrides.receipt),
  );
  return {
    keyContext,
    candidateManifest,
    receipt,
    zipPackageSha256: receipt.zipPackageSha256,
    allowlistEntries: overrides.allowlistEntries || [keyContext.allowlistEntry],
  };
}

function verify(overrides = {}, options = {}) {
  const input = buildValidInputs(overrides);
  return verifyMetricsCandidateApprovalReceipt(input, { now: NOW, ...options });
}

function assertFlagsFalse(result) {
  assert.equal(result.productionPublishReady, false);
  assert.equal(result.appExportApproved, false);
  assert.equal(result.loaderActivated, false);
}

test("valid ephemeral Ed25519 receipt passes and keeps loader activation false", () => {
  const result = verify();

  assert.equal(result.ok, true);
  assert.equal(result.status, "ready");
  assert.equal(result.candidatePackageReady, true);
  assert.equal(result.approvalReceiptVerified, true);
  assert.equal(result.signerAllowed, true);
  assert.equal(result.candidateIdentityBound, true);
  assert.equal(result.loaderPreflightReady, true);
  assert.deepEqual(result.blockingIssues, []);
  assertFlagsFalse(result);
});

test("canonical payload and result are deterministic for identical input", () => {
  const input = buildValidInputs();
  const firstPayload = canonicalizeApprovalReceiptPayload(input.receipt);
  const secondPayload = canonicalizeApprovalReceiptPayload({ ...input.receipt });
  const first = verifyMetricsCandidateApprovalReceipt(input, { now: NOW });
  const second = verifyMetricsCandidateApprovalReceipt(input, { now: NOW });

  assert.equal(firstPayload, secondPayload);
  assert.equal(sha256Hex(firstPayload), sha256Hex(secondPayload));
  assert.deepEqual(first, second);
});

test("tampered signed receipt field fails Ed25519 verification", () => {
  const input = buildValidInputs();
  input.receipt.metricBaseDate = "2026-07-16";

  const result = verifyMetricsCandidateApprovalReceipt(input, { now: NOW });

  assert.equal(result.status, "blocked");
  assert.equal(result.approvalReceiptVerified, false);
  assert.match(result.blockingIssues.join(","), /candidate_manifest_metricBaseDate_mismatch/);
  assert.match(result.blockingIssues.join(","), /receipt_signature_invalid/);
  assertFlagsFalse(result);
});

test("tampered candidate manifest identity fails binding", () => {
  const input = buildValidInputs({ candidateManifest: { candidatePackageHash: "a".repeat(64) } });
  input.candidateManifest.candidatePackageHash = "b".repeat(64);

  const result = verifyMetricsCandidateApprovalReceipt(input, { now: NOW });

  assert.equal(result.status, "blocked");
  assert.equal(result.candidateIdentityBound, false);
  assert.match(result.blockingIssues.join(","), /candidate_manifest_candidatePackageHash_mismatch/);
});

test("wrong ZIP SHA fails binding and is not inferred", () => {
  const input = buildValidInputs();
  input.zipPackageSha256 = "0".repeat(64);

  const result = verifyMetricsCandidateApprovalReceipt(input, { now: NOW });

  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join(","), /zip_package_sha256_mismatch/);
});

test("unknown signer key blocks", () => {
  const input = buildValidInputs({ receipt: { signerKeyId: "unknown-key" } });

  const result = verifyMetricsCandidateApprovalReceipt(input, { now: NOW });

  assert.equal(result.status, "blocked");
  assert.equal(result.signerAllowed, false);
  assert.match(result.blockingIssues.join(","), /approval_signer_unknown/);
});

test("malformed, empty, and duplicate allowlists block fail-closed", () => {
  const input = buildValidInputs();
  const malformed = verifyMetricsCandidateApprovalReceipt(
    { ...input, allowlistEntries: undefined, allowlistJson: "{" },
    { now: NOW },
  );
  const empty = verifyMetricsCandidateApprovalReceipt(
    { ...input, allowlistEntries: [] },
    { now: NOW },
  );
  const duplicate = verifyMetricsCandidateApprovalReceipt(
    { ...input, allowlistEntries: [input.allowlistEntries[0], input.allowlistEntries[0]] },
    { now: NOW },
  );

  assert.equal(malformed.status, "blocked");
  assert.match(malformed.blockingIssues.join(","), /approval_allowlist_malformed_json/);
  assert.equal(empty.status, "blocked");
  assert.match(empty.blockingIssues.join(","), /approval_allowlist_empty/);
  assert.equal(duplicate.status, "blocked");
  assert.match(duplicate.blockingIssues.join(","), /approval_allowlist_duplicate_signer_key_id/);
});

test("wrong signer scope, role, signer id, revoked key, or public key blocks", () => {
  const input = buildValidInputs();
  const base = input.allowlistEntries[0];
  const cases = [
    [{ ...base, allowedScopes: ["other"] }, "approval_signer_scope_not_allowed"],
    [{ ...base, roles: ["viewer"] }, "approval_signer_role_not_allowed"],
    [{ ...base, signerId: "other" }, "approval_signer_id_mismatch"],
    [{ ...base, revoked: true }, "approval_signer_key_revoked"],
    [{ ...base, publicKeyPem: "not-a-pem" }, "approval_public_key_invalid"],
  ];

  for (const [entry, expectedIssue] of cases) {
    const result = verifyMetricsCandidateApprovalReceipt(
      { ...input, allowlistEntries: [entry] },
      { now: NOW },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join(","), new RegExp(expectedIssue));
  }
});

test("allowlist revocation state must be explicitly revoked false", () => {
  const input = buildValidInputs();
  const base = input.allowlistEntries[0];
  const cases = [
    [{ ...base, revoked: undefined }, "approval_allowlist_entry_invalid_revocation_state"],
    [{ ...base, revoked: null }, "approval_allowlist_entry_invalid_revocation_state"],
    [{ ...base, revoked: "false" }, "approval_allowlist_entry_invalid_revocation_state"],
    [{ ...base, revoked: true }, "approval_signer_key_revoked"],
  ];

  for (const [entry, expectedIssue] of cases) {
    const result = verifyMetricsCandidateApprovalReceipt(
      { ...input, allowlistEntries: [entry] },
      { now: NOW },
    );
    assert.equal(result.status, "blocked");
    assert.equal(result.signerAllowed, false);
    assert.match(result.blockingIssues.join(","), new RegExp(expectedIssue));
  }

  const ready = verifyMetricsCandidateApprovalReceipt(
    { ...input, allowlistEntries: [{ ...base, revoked: false }] },
    { now: NOW },
  );
  assert.equal(ready.status, "ready");
  assert.equal(ready.signerAllowed, true);
  assert.equal(ready.candidatePackageReady, true);
});

test("allowlist public key must parse as Ed25519", () => {
  const input = buildValidInputs();
  const base = input.allowlistEntries[0];
  const { publicKey: rsaPublicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const { publicKey: ecPublicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const cases = [rsaPublicKey, ecPublicKey];

  for (const publicKey of cases) {
    const result = verifyMetricsCandidateApprovalReceipt(
      {
        ...input,
        allowlistEntries: [
          {
            ...base,
            publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
          },
        ],
      },
      { now: NOW },
    );

    assert.equal(result.status, "blocked");
    assert.equal(result.signerAllowed, false);
    assert.match(result.blockingIssues.join(","), /approval_public_key_not_ed25519/);
  }
});

test("missing or false attestation blocks", () => {
  const result = verify({
    receipt: {
      attestations: {
        ownerApproved: true,
        sourceUseApproved: false,
        dataQualityApproved: true,
        investmentAdviceNotProvided: true,
        productionActivationNotAuthorized: true,
      },
    },
  });

  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join(","), /receipt_attestation_sourceUseApproved_not_true/);
});

test("unknown contract version and missing required receipt field block", () => {
  const unknownVersion = verify({ receipt: { contractVersion: "metrics-candidate-approval-receipt-v0" } });
  const missingReceiptIdInput = buildValidInputs();
  delete missingReceiptIdInput.receipt.receiptId;

  const missingReceiptId = verifyMetricsCandidateApprovalReceipt(missingReceiptIdInput, { now: NOW });

  assert.equal(unknownVersion.status, "blocked");
  assert.match(unknownVersion.blockingIssues.join(","), /receipt_unknown_contract_version/);
  assert.equal(missingReceiptId.status, "blocked");
  assert.match(missingReceiptId.blockingIssues.join(","), /receipt_missing_or_invalid_receiptId/);
});

test("invalid, future, and expired timestamps block", () => {
  const invalid = verify({ receipt: { issuedAt: "not-a-date" } });
  const future = verify({ receipt: { issuedAt: "2026-07-16T01:00:00.000Z" } });
  const expired = verify({
    receipt: {
      issuedAt: "2026-07-15T00:00:00.000Z",
      expiresAt: "2026-07-15T01:00:00.000Z",
    },
  });

  assert.match(invalid.blockingIssues.join(","), /receipt_issued_at_invalid/);
  assert.match(future.blockingIssues.join(","), /receipt_issued_at_in_future/);
  assert.match(expired.blockingIssues.join(","), /receipt_expired/);
});

test("invalid base64, unsupported algorithm, malformed receipt, and non-object receipt block", () => {
  const input = buildValidInputs();
  const invalidBase64 = verifyMetricsCandidateApprovalReceipt(
    { ...input, receipt: { ...input.receipt, signatureBase64: "not base64!" } },
    { now: NOW },
  );
  const algorithm = verify({ receipt: { signatureAlgorithm: "RSA-PSS" } });
  const malformed = verifyMetricsCandidateApprovalReceipt(
    { ...input, receipt: "raw-receipt" },
    { now: NOW },
  );

  assert.match(invalidBase64.blockingIssues.join(","), /receipt_signature_base64_invalid/);
  assert.match(algorithm.blockingIssues.join(","), /receipt_unsupported_signature_algorithm/);
  assert.match(malformed.blockingIssues.join(","), /receipt_not_object/);
});

test("fixture, blocked, or production/app-enabled candidate manifests block", () => {
  const cases = [
    { fixturePackageReady: true },
    { candidatePackageReady: false },
    { productionPublishReady: true },
    { appExportApproved: true },
    { externalProviderCalls: true },
    { blockingIssueCount: 1 },
  ];

  for (const candidateManifest of cases) {
    const result = verify({ candidateManifest });
    assert.equal(result.status, "blocked");
    assert.equal(result.candidatePackageReady, false);
    assert.equal(result.candidateIdentityBound, false);
    assertFlagsFalse(result);
  }
});

test("candidatePackageReady tracks candidate flags separately from identity and zip binding", () => {
  const wrongZip = buildValidInputs();
  wrongZip.zipPackageSha256 = "0".repeat(64);
  const wrongZipResult = verifyMetricsCandidateApprovalReceipt(wrongZip, { now: NOW });
  const missingManifest = verifyMetricsCandidateApprovalReceipt(
    { ...buildValidInputs(), candidateManifest: null },
    { now: NOW },
  );
  const idle = verifyMetricsCandidateApprovalReceipt({}, { now: NOW });

  assert.equal(wrongZipResult.status, "blocked");
  assert.equal(wrongZipResult.candidatePackageReady, true);
  assert.equal(wrongZipResult.candidateIdentityBound, false);
  assert.equal(Object.hasOwn(wrongZipResult, "candidatePackageReady"), true);

  assert.equal(missingManifest.status, "blocked");
  assert.equal(missingManifest.candidatePackageReady, false);
  assert.equal(missingManifest.candidateIdentityBound, false);
  assert.equal(Object.hasOwn(missingManifest, "candidatePackageReady"), true);

  assert.equal(idle.status, "idle");
  assert.equal(idle.candidatePackageReady, false);
  assert.equal(idle.candidateIdentityBound, false);
  assert.equal(Object.hasOwn(idle, "candidatePackageReady"), true);
});

test("replay registry blocks duplicate receipt IDs without persistent storage", () => {
  const registry = createInMemoryApprovalReceiptReplayRegistry();
  const input = buildValidInputs();
  const first = verifyMetricsCandidateApprovalReceipt(input, { now: NOW, replayRegistry: registry });
  const second = verifyMetricsCandidateApprovalReceipt(input, { now: NOW, replayRegistry: registry });

  assert.equal(first.status, "ready");
  assert.equal(second.status, "blocked");
  assert.match(second.blockingIssues.join(","), /receipt_id_replayed/);
  assert.equal(registry.snapshot().storage, "memory");
  assert.equal(registry.snapshot().persistentStorageUsed, false);
});

test("missing preflight input returns idle and missing allowlist blocks a supplied receipt", () => {
  const idle = verifyMetricsCandidateApprovalReceipt({}, { now: NOW });
  const input = buildValidInputs();
  const previousAllowlist = process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;

  try {
    delete process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;
    const blocked = verifyMetricsCandidateApprovalReceipt(
      { ...input, allowlistEntries: undefined, allowlistJson: undefined },
      { now: NOW },
    );

    assert.equal(idle.status, "idle");
    assert.equal(idle.ok, false);
    assertFlagsFalse(idle);
    assert.equal(blocked.status, "blocked");
    assert.match(blocked.blockingIssues.join(","), /approval_allowlist_missing/);
    assertFlagsFalse(blocked);
  } finally {
    if (previousAllowlist === undefined) delete process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;
    else process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON = previousAllowlist;
  }
});

test("verifier does not use network, provider calls, or global fetch", () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network call attempted");
  };
  try {
    const result = verify();
    assert.equal(result.status, "ready");
  } finally {
    if (previousFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = previousFetch;
  }
});
