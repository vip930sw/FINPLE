import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

export const METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION =
  "metrics-candidate-approval-receipt-v1-step114-2n";
export const METRICS_CANDIDATE_APPROVAL_SCOPE = "candidate_review_to_loader_preflight";
export const METRICS_CANDIDATE_APPROVAL_SIGNATURE_ALGORITHM = "Ed25519";
export const METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE = "metrics_candidate_approval_signer";

const REQUIRED_RECEIPT_STRING_FIELDS = Object.freeze([
  "contractVersion",
  "receiptId",
  "approvalScope",
  "candidatePackageId",
  "candidatePackageHash",
  "zipPackageSha256",
  "metricBaseDate",
  "pipelineVersion",
  "normalizationVersion",
  "calculationPolicyVersion",
  "sourceDeclarationHash",
  "submissionManifestHash",
  "issuedAt",
  "signerKeyId",
  "signerId",
  "signatureAlgorithm",
  "signatureBase64",
]);

const REQUIRED_BINDING_FIELDS = Object.freeze([
  "candidatePackageId",
  "candidatePackageHash",
  "metricBaseDate",
  "pipelineVersion",
  "normalizationVersion",
  "calculationPolicyVersion",
  "sourceDeclarationHash",
  "submissionManifestHash",
]);

const REQUIRED_TRUE_ATTESTATIONS = Object.freeze([
  "ownerApproved",
  "sourceUseApproved",
  "dataQualityApproved",
  "investmentAdviceNotProvided",
  "productionActivationNotAuthorized",
]);

const REQUIRED_CANDIDATE_FLAGS = Object.freeze({
  fixturePackageReady: false,
  candidatePackageReady: true,
  productionPublishReady: false,
  appExportApproved: false,
  externalProviderCalls: false,
  blockingIssueCount: 0,
});

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0;
}

function isNonBlankString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function stableJsonValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => stableJsonValue(item)).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonValue(value[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("unsupported_json_value");
}

export function canonicalizeApprovalReceiptPayload(receipt = {}) {
  if (!isPlainObject(receipt)) throw new TypeError("receipt_payload_must_be_object");
  const payload = { ...receipt };
  delete payload.signatureBase64;
  return stableJsonValue(payload);
}

export function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function createInMemoryApprovalReceiptReplayRegistry(seedReceiptIds = []) {
  const usedReceiptIds = new Set(seedReceiptIds.filter((receiptId) => typeof receiptId === "string"));
  return {
    has(receiptId) {
      return usedReceiptIds.has(receiptId);
    },
    mark(receiptId) {
      if (typeof receiptId === "string" && receiptId) usedReceiptIds.add(receiptId);
    },
    snapshot() {
      return {
        storage: "memory",
        persistentStorageUsed: false,
        receiptCount: usedReceiptIds.size,
      };
    },
  };
}

function result(status, fields = {}, blockingIssues = [], warningIssues = []) {
  return {
    ok: status === "ready",
    status,
    receiptContractVersion:
      fields.receiptContractVersion || METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: fields.receiptId || "",
    candidatePackageId: fields.candidatePackageId || "",
    candidatePackageHash: fields.candidatePackageHash || "",
    candidatePackageReady: fields.candidatePackageReady === true,
    approvalReceiptVerified: fields.approvalReceiptVerified === true,
    signerAllowed: fields.signerAllowed === true,
    candidateIdentityBound: fields.candidateIdentityBound === true,
    loaderPreflightReady: status === "ready",
    productionPublishReady: false,
    appExportApproved: false,
    loaderActivated: false,
    blockingIssues: [...new Set(blockingIssues)].sort(),
    warningIssues: [...new Set(warningIssues)].sort(),
  };
}

function parseJsonAllowlist(allowlistJson) {
  if (!isNonEmptyString(allowlistJson)) {
    return { entries: [], issues: ["approval_allowlist_missing"] };
  }
  try {
    const parsed = JSON.parse(allowlistJson);
    return { entries: parsed, issues: [] };
  } catch {
    return { entries: [], issues: ["approval_allowlist_malformed_json"] };
  }
}

function normalizeAllowlist(input = {}) {
  const source = Array.isArray(input.allowlistEntries)
    ? { entries: input.allowlistEntries, issues: [] }
    : parseJsonAllowlist(
        input.allowlistJson ?? process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON,
      );
  const issues = source.issues.slice();
  const entries = Array.isArray(source.entries) ? source.entries : [];

  if (!Array.isArray(source.entries)) issues.push("approval_allowlist_not_array");
  if (entries.length === 0) issues.push("approval_allowlist_empty");

  const seen = new Set();
  for (const entry of entries) {
    if (!isPlainObject(entry)) {
      issues.push("approval_allowlist_entry_not_object");
      continue;
    }
    if (!isNonEmptyString(entry.signerKeyId)) issues.push("approval_allowlist_entry_missing_signer_key_id");
    else if (seen.has(entry.signerKeyId)) issues.push("approval_allowlist_duplicate_signer_key_id");
    else seen.add(entry.signerKeyId);
    if (!isNonEmptyString(entry.signerId)) issues.push("approval_allowlist_entry_missing_signer_id");
    if (!isNonBlankString(entry.publicKeyPem)) issues.push("approval_allowlist_entry_missing_public_key");
    if (!Array.isArray(entry.allowedScopes)) issues.push("approval_allowlist_entry_missing_allowed_scopes");
    if (!Array.isArray(entry.roles)) issues.push("approval_allowlist_entry_missing_roles");
    if (entry.revoked !== false && entry.revoked !== true) {
      issues.push("approval_allowlist_entry_invalid_revocation_state");
    }
  }

  return { entries, issues };
}

function parseInstant(value) {
  if (!isNonEmptyString(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function validateReceiptShape(receipt, issues) {
  if (!isPlainObject(receipt)) {
    issues.push("receipt_not_object");
    return false;
  }
  for (const field of REQUIRED_RECEIPT_STRING_FIELDS) {
    if (!isNonEmptyString(receipt[field])) issues.push(`receipt_missing_or_invalid_${field}`);
  }
  if (receipt.contractVersion !== METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION) {
    issues.push("receipt_unknown_contract_version");
  }
  if (receipt.approvalScope !== METRICS_CANDIDATE_APPROVAL_SCOPE) {
    issues.push("receipt_scope_mismatch");
  }
  if (receipt.signatureAlgorithm !== METRICS_CANDIDATE_APPROVAL_SIGNATURE_ALGORITHM) {
    issues.push("receipt_unsupported_signature_algorithm");
  }
  if (!isPlainObject(receipt.attestations)) {
    issues.push("receipt_attestations_missing");
  } else {
    for (const key of REQUIRED_TRUE_ATTESTATIONS) {
      if (receipt.attestations[key] !== true) issues.push(`receipt_attestation_${key}_not_true`);
    }
  }
  if (receipt.expiresAt !== undefined && !isNonEmptyString(receipt.expiresAt)) {
    issues.push("receipt_invalid_expiresAt");
  }
  return true;
}

function validateTimestamps(receipt, options, issues) {
  const issuedAt = parseInstant(receipt.issuedAt);
  const expiresAt = receipt.expiresAt === undefined ? null : parseInstant(receipt.expiresAt);
  const now = options.now instanceof Date ? options.now.getTime() : Date.now();
  const skewMs = Number.isInteger(options.clockSkewMs) && options.clockSkewMs >= 0 ? options.clockSkewMs : 5 * 60 * 1000;

  if (issuedAt === null) issues.push("receipt_issued_at_invalid");
  else if (issuedAt > now + skewMs) issues.push("receipt_issued_at_in_future");

  if (receipt.expiresAt !== undefined) {
    if (expiresAt === null) issues.push("receipt_expires_at_invalid");
    else {
      if (issuedAt !== null && expiresAt <= issuedAt) issues.push("receipt_expires_at_not_after_issued_at");
      if (expiresAt < now - skewMs) issues.push("receipt_expired");
    }
  }
}

function validateCandidatePackageReady(candidateManifest, issues) {
  if (!isPlainObject(candidateManifest)) {
    issues.push("candidate_manifest_not_object");
    return false;
  }
  let candidatePackageReady = true;
  for (const [field, expected] of Object.entries(REQUIRED_CANDIDATE_FLAGS)) {
    if (candidateManifest[field] !== expected) {
      issues.push(`candidate_manifest_${field}_invalid`);
      candidatePackageReady = false;
    }
  }
  return candidatePackageReady;
}

function validateCandidateBinding(candidateManifest, receipt, zipPackageSha256, issues) {
  if (!isPlainObject(candidateManifest)) return false;
  let bound = true;
  for (const field of REQUIRED_BINDING_FIELDS) {
    if (!isNonEmptyString(candidateManifest[field])) {
      issues.push(`candidate_manifest_missing_${field}`);
      bound = false;
    } else if (candidateManifest[field] !== receipt[field]) {
      issues.push(`candidate_manifest_${field}_mismatch`);
      bound = false;
    }
  }
  if (!isNonEmptyString(zipPackageSha256)) {
    issues.push("zip_package_sha256_missing");
    bound = false;
  } else if (zipPackageSha256 !== receipt.zipPackageSha256) {
    issues.push("zip_package_sha256_mismatch");
    bound = false;
  }
  return bound;
}

function decodeSignature(signatureBase64, issues) {
  if (!isNonEmptyString(signatureBase64)) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signatureBase64)) {
    issues.push("receipt_signature_base64_invalid");
    return null;
  }
  try {
    const signature = Buffer.from(signatureBase64, "base64");
    if (signature.length !== 64 || signature.toString("base64") !== signatureBase64) {
      issues.push("receipt_signature_base64_invalid");
      return null;
    }
    return signature;
  } catch {
    issues.push("receipt_signature_base64_invalid");
    return null;
  }
}

function parseAllowedPublicKey(entry, issues) {
  try {
    const publicKey = createPublicKey(entry.publicKeyPem);
    if (publicKey.asymmetricKeyType !== "ed25519") {
      issues.push("approval_public_key_not_ed25519");
      return null;
    }
    return publicKey;
  } catch {
    issues.push("approval_public_key_invalid");
    return null;
  }
}

function findAllowedSigner(receipt, allowlistEntries, issues) {
  const entry = allowlistEntries.find((item) => isPlainObject(item) && item.signerKeyId === receipt.signerKeyId);
  if (!entry) {
    issues.push("approval_signer_unknown");
    return null;
  }
  if (entry.signerId !== receipt.signerId) issues.push("approval_signer_id_mismatch");
  if (entry.revoked === true) issues.push("approval_signer_key_revoked");
  if (entry.revoked !== false && entry.revoked !== true) {
    issues.push("approval_allowlist_entry_invalid_revocation_state");
  }
  if (!Array.isArray(entry.allowedScopes) || !entry.allowedScopes.includes(receipt.approvalScope)) {
    issues.push("approval_signer_scope_not_allowed");
  }
  if (!Array.isArray(entry.roles) || !entry.roles.includes(METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE)) {
    issues.push("approval_signer_role_not_allowed");
  }
  const publicKey = isNonBlankString(entry.publicKeyPem) ? parseAllowedPublicKey(entry, issues) : null;
  return { entry, publicKey };
}

function verifyReceiptSignature(receipt, signer, issues) {
  const signature = decodeSignature(receipt.signatureBase64, issues);
  if (!signature || !signer?.publicKey) {
    return false;
  }
  try {
    const canonicalPayload = canonicalizeApprovalReceiptPayload(receipt);
    const verified = verifySignature(
      null,
      Buffer.from(canonicalPayload, "utf8"),
      signer.publicKey,
      signature,
    );
    if (!verified) issues.push("receipt_signature_invalid");
    return verified;
  } catch {
    issues.push("receipt_canonical_payload_invalid");
    return false;
  }
}

export function verifyMetricsCandidateApprovalReceipt(input = {}, options = {}) {
  const receipt = input.receipt ?? input.approvalReceipt ?? null;
  const candidateManifest = input.candidateManifest ?? null;
  const zipPackageSha256 = input.zipPackageSha256 ?? "";
  const blockingIssues = [];

  if (receipt === null && candidateManifest === null && !zipPackageSha256) {
    return result("idle", {}, ["approval_receipt_preflight_input_missing"]);
  }

  const fields = {
    receiptContractVersion:
      isPlainObject(receipt) && isNonEmptyString(receipt.contractVersion)
        ? receipt.contractVersion
        : METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: isPlainObject(receipt) && isNonEmptyString(receipt.receiptId) ? receipt.receiptId : "",
    candidatePackageId:
      isPlainObject(receipt) && isNonEmptyString(receipt.candidatePackageId) ? receipt.candidatePackageId : "",
    candidatePackageHash:
      isPlainObject(receipt) && isNonEmptyString(receipt.candidatePackageHash)
        ? receipt.candidatePackageHash
        : "",
  };

  validateReceiptShape(receipt, blockingIssues);
  if (isPlainObject(receipt)) validateTimestamps(receipt, options, blockingIssues);

  const allowlist = normalizeAllowlist(input);
  blockingIssues.push(...allowlist.issues);

  const candidatePackageReady = validateCandidatePackageReady(candidateManifest, blockingIssues);
  const candidateIdentityBound =
    isPlainObject(receipt) &&
    candidatePackageReady &&
    validateCandidateBinding(candidateManifest, receipt, zipPackageSha256, blockingIssues);

  let signerAllowed = false;
  let approvalReceiptVerified = false;
  const signerEntry = isPlainObject(receipt)
    ? findAllowedSigner(receipt, allowlist.entries, blockingIssues)
    : null;

  if (signerEntry) {
    const allowlistIssueCount = blockingIssues.filter((issue) => issue.startsWith("approval_")).length;
    signerAllowed = allowlistIssueCount === 0;
    approvalReceiptVerified = signerAllowed && verifyReceiptSignature(receipt, signerEntry, blockingIssues);
  }

  if (isPlainObject(receipt) && options.replayRegistry) {
    const registry = options.replayRegistry;
    if (typeof registry.has !== "function" || typeof registry.mark !== "function") {
      blockingIssues.push("receipt_replay_registry_invalid");
    } else if (registry.has(receipt.receiptId)) {
      blockingIssues.push("receipt_id_replayed");
    }
  }

  const ready =
    blockingIssues.length === 0 && signerAllowed && approvalReceiptVerified && candidateIdentityBound;

  if (ready && options.replayRegistry) options.replayRegistry.mark(receipt.receiptId);

  return result(
    ready ? "ready" : "blocked",
    {
      ...fields,
      candidatePackageReady,
      approvalReceiptVerified,
      signerAllowed,
      candidateIdentityBound,
    },
    blockingIssues,
  );
}
