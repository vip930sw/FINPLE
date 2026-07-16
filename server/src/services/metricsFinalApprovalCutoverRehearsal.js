import {
  createHash,
  createPublicKey,
  verify as verifySignature,
} from "node:crypto";

import {
  METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
  evaluateMetricsLoaderActivationEligibility,
} from "./metricsLoaderActivationEligibility.js";

export const METRICS_FINAL_APPROVAL_BUNDLE_CONTRACT_VERSION =
  "metrics-final-approval-bundle-v1-step114-2p";
export const METRICS_CUTOVER_REHEARSAL_CONTRACT_VERSION =
  "metrics-cutover-rehearsal-v1-step114-2p";
export const METRICS_FINAL_APPROVAL_POLICY_CONTRACT_VERSION =
  "metrics-final-approval-policy-v1-step114-2p";
export const METRICS_PRODUCTION_PUBLISH_APPROVAL_CONTRACT_VERSION =
  "metrics-production-publish-approval-v1-step114-2p";
export const METRICS_APP_EXPORT_APPROVAL_CONTRACT_VERSION =
  "metrics-app-export-approval-v1-step114-2p";
export const METRICS_POINTER_SNAPSHOT_CONTRACT_VERSION =
  "metrics-pointer-snapshot-v1-step114-2p";
export const METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION =
  "metrics-target-export-verification-evidence-v1-step114-2p";
export const METRICS_TARGET_EXPORT_POLICY_VERSION =
  "metrics-target-export-policy-v1-step114-2p";
export const METRICS_TARGET_EXPORT_SCHEMA_VERSION =
  "metrics-price-overlay-csv-schema-v1-step114-2p";

export const METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE =
  "metrics_production_publish_approval";
export const METRICS_APP_EXPORT_APPROVAL_SCOPE =
  "metrics_app_export_approval";
export const METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE =
  "metrics_production_publish_approver";
export const METRICS_APP_EXPORT_APPROVER_ROLE =
  "metrics_app_export_approver";
export const METRICS_FINAL_APPROVAL_SIGNATURE_ALGORITHM = "Ed25519";
export const METRICS_CURRENT_LOADER_SOURCE_COMMIT =
  "89067915d6365fb92bdcc93a4b908206b9cbdacd";

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_CLOCK_SKEW_MS = 5 * 60 * 1000;

const REQUIRED_COMPONENTS = Object.freeze([
  {
    role: "base_candidates",
    importName: "finpleAppCandidates2000Csv",
    path: "src/data/tickers/finple_app_candidates_2000_final_v1.csv",
    sha256: "210e8b598b865251b99971429c28f92353cd21962011667be72590a5aa4aac47",
  },
  {
    role: "kr_etf_dividend",
    importName: "krEtfDividendOverlayCsv",
    path: "src/data/tickers/kr_etf_dividend_overlay_20260525.csv",
    sha256: "a16d0c20cfe8bb214ac891aff7e0bd0a1bb6203923523eb1c2536f394f368a23",
  },
  {
    role: "kr_stock_dividend",
    importName: "krStockDividendOverlayCsv",
    path: "src/data/tickers/kr_stock_dividend_overlay_20260525.csv",
    sha256: "09e6de3ed4af4227807d268e7f56314c753390fda166d56f533341f4077f8661",
  },
  {
    role: "us_dividend",
    importName: "usDividendOverlayCsv",
    path: "src/data/tickers/us_dividend_overlay_20260527.csv",
    sha256: "a05c24a9b59106f786ba5ef9f79423724af78170087e905eefcf401709e2519f",
  },
  {
    role: "us_price_metrics",
    importName: "usPriceMetricsOverlayCsv",
    path: "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv",
    sha256: "9df1ffa8f19b68f41b63699e3e8bd1d82c7720c1acc9786b48b28040ed56ceec",
  },
  {
    role: "kr_price_metrics",
    importName: "krPriceMetricsOverlayCsv",
    path: "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv",
    sha256: "4e683d29181f9deb49dbea74faea1c6af573a67e2beb0909c1ce11e66ca19002",
  },
]);

const TARGET_COMPONENT_ROLES = new Set(["us_price_metrics", "kr_price_metrics"]);
const TARGET_EXPORT_HEADERS = Object.freeze([
  "market",
  "ticker",
  "expectedCagr",
  "priceCagr10y",
  "mdd",
  "beta",
  "dataYears",
  "benchmarkTicker",
  "metricsStatus",
  "metricsSource",
  "reviewReason",
]);
const STABLE_COMPONENT_ROLES = new Set(
  REQUIRED_COMPONENTS.map((component) => component.role).filter(
    (role) => !TARGET_COMPONENT_ROLES.has(role),
  ),
);

const REQUIRED_RECEIPT_STRING_FIELDS = Object.freeze([
  "contractVersion",
  "receiptId",
  "approvalScope",
  "candidatePackageId",
  "candidatePackageHash",
  "zipPackageSha256",
  "eligibilityContractVersion",
  "eligibilityEvidenceHash",
  "eligibilityEvaluatedAt",
  "packageIndexFile",
  "currentPointerIdentityHash",
  "targetPointerIdentityHash",
  "rollbackPointerIdentityHash",
  "issuedAt",
  "expiresAt",
  "signerKeyId",
  "signerId",
  "signatureAlgorithm",
  "signatureBase64",
]);

const EXECUTION_AUTHORIZATION_FIELDS = Object.freeze([
  "productionApprovalGranted",
  "productionActivationAuthorized",
  "productionPublishReady",
  "appExportApproved",
  "appExportActivated",
  "loaderPointerMutationPlanned",
  "pointerMutationAuthorized",
  "pointerMutationExecuted",
  "rollbackAuthorized",
  "rollbackExecutionAuthorized",
  "rollbackExecuted",
  "loaderActivated",
  "cutoverExecutionAuthorized",
  "cutoverExecutionApproved",
  "executionAuthorized",
  "executionApproved",
  "deploymentAuthorized",
  "automaticMutationAllowed",
]);

const PRODUCTION_REQUIRED_ATTESTATIONS = Object.freeze([
  "productionPublicationReviewed",
  "sourceAndLicenseReviewed",
  "rollbackPlanReviewed",
  "pointerMutationNotAuthorized",
  "cutoverExecutionNotAuthorized",
]);

const APP_EXPORT_REQUIRED_ATTESTATIONS = Object.freeze([
  "appExportReviewed",
  "consumerDisclosureReviewed",
  "scenarioAndAiBoundaryReviewed",
  "pointerMutationNotAuthorized",
  "cutoverExecutionNotAuthorized",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0;
}

function isNonBlankString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isCommitIdentity(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function isSafeRepositoryPath(value) {
  return (
    isNonEmptyString(value) &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.split("/").includes("..")
  );
}

function containsBlockedReviewMarker(value) {
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase().replaceAll("-", "_");
  return [
    "fixture",
    "synthetic",
    "test_only",
    "testonly",
    "review_only",
    "reviewonly",
  ].some((marker) => normalized.includes(marker));
}

function stableJsonValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonValue(item)).join(",")}]`;
  }
  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonValue(value[key])}`)
      .join(",")}}`;
  }
  throw new TypeError("unsupported_json_value");
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJsonHash(value) {
  return sha256Hex(Buffer.from(stableJsonValue(value), "utf8"));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizedComponent(component = {}) {
  return {
    role: component.role || "",
    importName: component.importName || "",
    path: component.path || "",
    sha256: component.sha256 || "",
    candidatePackageId: component.candidatePackageId || "",
    candidatePackageHash: component.candidatePackageHash || "",
    zipPackageSha256: component.zipPackageSha256 || "",
    packageIndexFile: component.packageIndexFile || "",
  };
}

function normalizedComponents(snapshot = {}) {
  if (!Array.isArray(snapshot.components)) return [];
  return snapshot.components
    .map((component) => normalizedComponent(component))
    .sort((left, right) => left.role.localeCompare(right.role));
}

function pointerIdentityPayload(snapshot = {}) {
  return {
    selector: {
      path: snapshot.selector?.path || "",
      sha256: snapshot.selector?.sha256 || "",
    },
    sourceCommit: snapshot.sourceCommit || "",
    components: normalizedComponents(snapshot),
    candidatePackageId: snapshot.candidatePackageId || "",
    candidatePackageHash: snapshot.candidatePackageHash || "",
    zipPackageSha256: snapshot.zipPackageSha256 || "",
    packageIndexFile: snapshot.packageIndexFile || "",
    fixtureOnly: snapshot.fixtureOnly,
    testOnly: snapshot.testOnly,
    reviewOnly: snapshot.reviewOnly,
  };
}

function selectionIdentityPayload(snapshot = {}) {
  return {
    selector: {
      path: snapshot.selector?.path || "",
      sha256: snapshot.selector?.sha256 || "",
    },
    components: normalizedComponents(snapshot).map((component) => ({
      role: component.role,
      importName: component.importName,
      path: component.path,
      sha256: component.sha256,
    })),
  };
}

export function hashMetricsPointerSnapshot(snapshot = {}) {
  return stableJsonHash(pointerIdentityPayload(snapshot));
}

export function hashMetricsEligibilityEvidence(eligibilityResult = {}) {
  return stableJsonHash(eligibilityResult);
}

export function canonicalizeMetricsFinalApprovalReceiptPayload(receipt = {}) {
  if (!isPlainObject(receipt)) throw new TypeError("final_approval_receipt_must_be_object");
  const payload = { ...receipt };
  delete payload.signatureBase64;
  return stableJsonValue(payload);
}

const CURRENT_POINTER_SNAPSHOT_BASE = {
  contractVersion: METRICS_POINTER_SNAPSHOT_CONTRACT_VERSION,
  snapshotKind: "current",
  selector: {
    path: "src/data/tickers/screenerCandidateOverlay.js",
    sha256: "d9b68cd671482475eeab92828c53b581c4e1c9d604988f7dc60c5d0129766092",
  },
  sourceCommit: METRICS_CURRENT_LOADER_SOURCE_COMMIT,
  components: REQUIRED_COMPONENTS.map((component) => ({ ...component })),
  candidatePackageId: "",
  candidatePackageHash: "",
  zipPackageSha256: "",
  packageIndexFile: "",
  fixtureOnly: false,
  testOnly: false,
  reviewOnly: false,
};

const CURRENT_POINTER_SNAPSHOT = Object.freeze({
  ...CURRENT_POINTER_SNAPSHOT_BASE,
  pointerIdentityHash: hashMetricsPointerSnapshot(CURRENT_POINTER_SNAPSHOT_BASE),
});

export function getMetricsCurrentPointerSnapshot() {
  return cloneJson(CURRENT_POINTER_SNAPSHOT);
}

function result(status, fields = {}, blockingIssues = [], warningIssues = []) {
  return {
    ok: status === "ready",
    status,
    contractVersion: METRICS_FINAL_APPROVAL_BUNDLE_CONTRACT_VERSION,
    cutoverRehearsalContractVersion: METRICS_CUTOVER_REHEARSAL_CONTRACT_VERSION,
    candidatePackageId: fields.candidatePackageId || "",
    candidatePackageHash: fields.candidatePackageHash || "",
    zipPackageSha256: fields.zipPackageSha256 || "",
    eligibilityContractVersion:
      fields.eligibilityContractVersion ||
      METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
    eligibilityEvidenceHash: fields.eligibilityEvidenceHash || "",
    eligibilityReverified: fields.eligibilityReverified === true,
    productionApprovalVerified: fields.productionApprovalVerified === true,
    appExportApprovalVerified: fields.appExportApprovalVerified === true,
    approvalPolicySatisfied: fields.approvalPolicySatisfied === true,
    currentPointerSnapshotVerified: fields.currentPointerSnapshotVerified === true,
    targetExportVerificationEvidenceVerified:
      fields.targetExportVerificationEvidenceVerified === true,
    targetPointerSnapshotVerified: fields.targetPointerSnapshotVerified === true,
    rollbackSnapshotVerified: fields.rollbackSnapshotVerified === true,
    cutoverPlanReady: fields.cutoverPlanReady === true,
    rollbackPlanReady: fields.rollbackPlanReady === true,
    cutoverRehearsalReady: status === "ready",
    cutoverPlan: Array.isArray(fields.cutoverPlan) ? fields.cutoverPlan : [],
    rollbackPlan: Array.isArray(fields.rollbackPlan) ? fields.rollbackPlan : [],
    rollbackTriggers: Array.isArray(fields.rollbackTriggers) ? fields.rollbackTriggers : [],
    executionApprovalRequired: true,
    productionPublishReady: false,
    appExportActivated: false,
    pointerMutationAuthorized: false,
    pointerMutationExecuted: false,
    rollbackExecuted: false,
    loaderActivated: false,
    blockingIssues: uniqueSorted(blockingIssues),
    warningIssues: uniqueSorted(warningIssues),
  };
}

function detectExecutionAuthorization(source, sourceName, issues) {
  if (!isPlainObject(source)) return false;
  let attempted = false;
  for (const field of EXECUTION_AUTHORIZATION_FIELDS) {
    if (!Object.hasOwn(source, field) || source[field] === false) continue;
    if (source[field] === true) {
      issues.push(`execution_authorization_forbidden:${sourceName}:${field}`);
    } else {
      issues.push(`execution_authorization_malformed:${sourceName}:${field}`);
    }
    attempted = true;
  }
  return attempted;
}

function collectExecutionAuthorizationAttempts(input, issues) {
  for (const [sourceName, source] of [
    ["input", input],
    ["production_receipt", input.productionApprovalReceipt],
    ["production_attestations", input.productionApprovalReceipt?.attestations],
    ["app_export_receipt", input.appExportApprovalReceipt],
    ["app_export_attestations", input.appExportApprovalReceipt?.attestations],
    ["approval_policy", input.approvalPolicy],
    ["current_pointer_snapshot", input.currentPointerSnapshot],
    ["target_pointer_snapshot", input.targetPointerSnapshot],
    ["rollback_pointer_snapshot", input.rollbackPointerSnapshot],
  ]) {
    detectExecutionAuthorization(source, sourceName, issues);
  }
}

function isIdleInput(input) {
  return (
    !isPlainObject(input.eligibilityInput) &&
    !isPlainObject(input.productionApprovalReceipt) &&
    !isPlainObject(input.appExportApprovalReceipt) &&
    !isPlainObject(input.approvalPolicy) &&
    !isPlainObject(input.currentPointerSnapshot) &&
    !isPlainObject(input.targetPointerSnapshot) &&
    !isPlainObject(input.rollbackPointerSnapshot) &&
    !isPlainObject(input.targetExportVerificationEvidence) &&
    !input.eligibilityEvidenceHash &&
    !input.eligibilityEvaluatedAt &&
    !Object.hasOwn(input, "activationDryRunEligible")
  );
}

function validateApprovalPolicy(policy, issues) {
  const beforeCount = issues.length;
  if (!isPlainObject(policy)) {
    issues.push("approval_policy_not_object");
    return false;
  }
  if (policy.policyVersion !== METRICS_FINAL_APPROVAL_POLICY_CONTRACT_VERSION) {
    issues.push("approval_policy_version_mismatch");
  }
  for (const field of ["maxApprovalAgeHours", "maxEligibilityEvidenceAgeHours"]) {
    if (!Number.isInteger(policy[field]) || policy[field] <= 0) {
      issues.push(`approval_policy_${field}_invalid`);
    }
  }
  if (policy.requireDistinctReceiptIds !== true) {
    issues.push("approval_policy_distinct_receipt_ids_must_be_true");
  }
  for (const field of ["requireDistinctSignerIds", "requireDistinctSignerKeyIds"]) {
    if (typeof policy[field] !== "boolean") {
      issues.push(`approval_policy_${field}_must_be_boolean`);
    }
  }
  if (policy.requiredProductionScope !== METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE) {
    issues.push("approval_policy_production_scope_mismatch");
  }
  if (policy.requiredAppExportScope !== METRICS_APP_EXPORT_APPROVAL_SCOPE) {
    issues.push("approval_policy_app_export_scope_mismatch");
  }
  return issues.length === beforeCount;
}

function parseFinalApprovalAllowlist(value, issues) {
  if (!isNonEmptyString(value)) {
    issues.push("final_approval_allowlist_missing");
    return [];
  }
  let entries;
  try {
    entries = JSON.parse(value);
  } catch {
    issues.push("final_approval_allowlist_malformed_json");
    return [];
  }
  if (!Array.isArray(entries)) {
    issues.push("final_approval_allowlist_not_array");
    return [];
  }
  if (entries.length === 0) issues.push("final_approval_allowlist_empty");
  const seenKeyIds = new Set();
  const seenIdentityPairs = new Set();
  const fingerprintOwners = new Map();
  const normalizedEntries = [];
  for (const entry of entries) {
    if (!isPlainObject(entry)) {
      issues.push("final_approval_allowlist_entry_not_object");
      continue;
    }
    if (!isNonEmptyString(entry.signerKeyId)) {
      issues.push("final_approval_allowlist_entry_signer_key_id_invalid");
    } else if (seenKeyIds.has(entry.signerKeyId)) {
      issues.push("final_approval_allowlist_duplicate_signer_key_id");
    } else {
      seenKeyIds.add(entry.signerKeyId);
    }
    if (!isNonEmptyString(entry.signerId)) {
      issues.push("final_approval_allowlist_entry_signer_id_invalid");
    }
    const identityPair = `${entry.signerId || ""}\u0000${entry.signerKeyId || ""}`;
    if (seenIdentityPairs.has(identityPair)) {
      issues.push("final_approval_allowlist_duplicate_signer_identity");
    } else {
      seenIdentityPairs.add(identityPair);
    }
    if (!isNonBlankString(entry.publicKeyPem)) {
      issues.push("final_approval_allowlist_entry_public_key_invalid");
    }
    if (!Array.isArray(entry.allowedScopes)) {
      issues.push("final_approval_allowlist_entry_allowed_scopes_invalid");
    }
    if (!Array.isArray(entry.roles)) {
      issues.push("final_approval_allowlist_entry_roles_invalid");
    }
    if (entry.revoked !== false) {
      issues.push("final_approval_allowlist_entry_revoked_not_false");
    }
    let publicKey = null;
    let publicKeyFingerprint = "";
    if (isNonBlankString(entry.publicKeyPem)) {
      try {
        publicKey = createPublicKey(entry.publicKeyPem);
        if (publicKey.asymmetricKeyType !== "ed25519") {
          issues.push("final_approval_allowlist_entry_public_key_not_ed25519");
          publicKey = null;
        } else {
          const canonicalSpkiDer = publicKey.export({
            type: "spki",
            format: "der",
          });
          publicKeyFingerprint = sha256Hex(canonicalSpkiDer);
          const existingKeyId = fingerprintOwners.get(publicKeyFingerprint);
          if (existingKeyId && existingKeyId !== entry.signerKeyId) {
            issues.push(
              "final_approval_allowlist_duplicate_public_key_fingerprint",
            );
          } else if (!existingKeyId) {
            fingerprintOwners.set(publicKeyFingerprint, entry.signerKeyId);
          }
        }
      } catch {
        issues.push("final_approval_allowlist_entry_public_key_invalid");
        publicKey = null;
      }
    }
    normalizedEntries.push({
      ...entry,
      __publicKey: publicKey,
      __publicKeyFingerprint: publicKeyFingerprint,
    });
  }
  return normalizedEntries;
}

function parseInstant(value) {
  if (!isNonEmptyString(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function decodeCanonicalSignature(value, issuePrefix, issues) {
  if (!isNonEmptyString(value) || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    issues.push(`${issuePrefix}_signature_base64_invalid`);
    return null;
  }
  try {
    const signature = Buffer.from(value, "base64");
    if (signature.length !== 64 || signature.toString("base64") !== value) {
      issues.push(`${issuePrefix}_signature_base64_invalid`);
      return null;
    }
    return signature;
  } catch {
    issues.push(`${issuePrefix}_signature_base64_invalid`);
    return null;
  }
}

function findAllowedFinalSigner(receipt, allowlistEntries, expectedScope, expectedRole, issuePrefix, issues) {
  const entry = allowlistEntries.find(
    (candidate) =>
      isPlainObject(candidate) && candidate.signerKeyId === receipt?.signerKeyId,
  );
  if (!entry) {
    issues.push(`${issuePrefix}_signer_unknown`);
    return null;
  }
  if (entry.signerId !== receipt.signerId) {
    issues.push(`${issuePrefix}_signer_id_mismatch`);
  }
  if (entry.revoked !== false) {
    issues.push(`${issuePrefix}_signer_key_revoked`);
  }
  if (!Array.isArray(entry.allowedScopes) || !entry.allowedScopes.includes(expectedScope)) {
    issues.push(`${issuePrefix}_scope_not_allowed`);
  }
  if (!Array.isArray(entry.roles) || !entry.roles.includes(expectedRole)) {
    issues.push(`${issuePrefix}_role_not_allowed`);
  }
  const publicKey = entry.__publicKey || null;
  if (!publicKey) {
    issues.push(`${issuePrefix}_public_key_invalid`);
  }
  return {
    entry,
    publicKey,
    publicKeyFingerprint: entry.__publicKeyFingerprint || "",
  };
}

function verifyFinalReceiptSignature(receipt, signer, issuePrefix, issues) {
  const signature = decodeCanonicalSignature(receipt.signatureBase64, issuePrefix, issues);
  if (!signature || !signer?.publicKey) return false;
  try {
    const payload = canonicalizeMetricsFinalApprovalReceiptPayload(receipt);
    const verified = verifySignature(
      null,
      Buffer.from(payload, "utf8"),
      signer.publicKey,
      signature,
    );
    if (!verified) issues.push(`${issuePrefix}_signature_invalid`);
    return verified;
  } catch {
    issues.push(`${issuePrefix}_canonical_payload_invalid`);
    return false;
  }
}

function validateReceiptTimestamps(
  receipt,
  policy,
  now,
  eligibilityEvaluatedAtMs,
  clockSkewMs,
  issuePrefix,
  issues,
) {
  const issuedAt = parseInstant(receipt.issuedAt);
  const expiresAt = parseInstant(receipt.expiresAt);
  const nowMs = now.getTime();
  if (issuedAt === null) {
    issues.push(`${issuePrefix}_issued_at_invalid`);
  } else {
    if (issuedAt > nowMs) {
      issues.push(`${issuePrefix}_issued_at_in_future`);
    }
    if (
      Number.isFinite(eligibilityEvaluatedAtMs) &&
      issuedAt < eligibilityEvaluatedAtMs - clockSkewMs
    ) {
      issues.push(`${issuePrefix}_issued_before_eligibility_evaluation`);
    }
    if (
      Number.isInteger(policy.maxApprovalAgeHours) &&
      nowMs - issuedAt > policy.maxApprovalAgeHours * HOUR_MS + clockSkewMs
    ) {
      issues.push(`${issuePrefix}_too_old`);
    }
  }
  if (expiresAt === null) {
    issues.push(`${issuePrefix}_expires_at_invalid`);
  } else {
    if (issuedAt !== null && expiresAt <= issuedAt) {
      issues.push(`${issuePrefix}_expires_at_not_after_issued_at`);
    }
    if (expiresAt < nowMs - clockSkewMs) {
      issues.push(`${issuePrefix}_expired`);
    }
  }
}

function validateReceiptBinding(receipt, context, issuePrefix, issues) {
  const bindings = {
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    eligibilityContractVersion: context.eligibilityContractVersion,
    eligibilityEvidenceHash: context.eligibilityEvidenceHash,
    eligibilityEvaluatedAt: context.eligibilityEvaluatedAt,
    packageIndexFile: context.packageIndexFile,
    currentPointerIdentityHash: context.currentPointerIdentityHash,
    targetPointerIdentityHash: context.targetPointerIdentityHash,
    rollbackPointerIdentityHash: context.rollbackPointerIdentityHash,
  };
  for (const [field, expected] of Object.entries(bindings)) {
    if (receipt[field] !== expected) {
      issues.push(`${issuePrefix}_${field}_mismatch`);
    }
  }
}

function verifyFinalApprovalReceipt(
  receipt,
  {
    contractVersion,
    scope,
    role,
    requiredAttestations,
    issuePrefix,
  },
  context,
  allowlistEntries,
  policy,
  now,
  clockSkewMs,
  issues,
) {
  const beforeCount = issues.length;
  if (!isPlainObject(receipt)) {
    issues.push(`${issuePrefix}_not_object`);
    return false;
  }
  for (const field of REQUIRED_RECEIPT_STRING_FIELDS) {
    if (!isNonEmptyString(receipt[field])) {
      issues.push(`${issuePrefix}_missing_or_invalid_${field}`);
    }
  }
  if (receipt.contractVersion !== contractVersion) {
    issues.push(`${issuePrefix}_contract_version_mismatch`);
  }
  if (receipt.approvalScope !== scope) {
    issues.push(`${issuePrefix}_scope_mismatch`);
  }
  if (receipt.signatureAlgorithm !== METRICS_FINAL_APPROVAL_SIGNATURE_ALGORITHM) {
    issues.push(`${issuePrefix}_signature_algorithm_mismatch`);
  }
  if (!isPlainObject(receipt.attestations)) {
    issues.push(`${issuePrefix}_attestations_not_object`);
  } else {
    for (const attestation of requiredAttestations) {
      if (receipt.attestations[attestation] !== true) {
        issues.push(`${issuePrefix}_attestation_${attestation}_not_true`);
      }
    }
  }
  validateReceiptBinding(receipt, context, issuePrefix, issues);
  validateReceiptTimestamps(
    receipt,
    policy,
    now,
    context.eligibilityEvaluatedAtMs,
    clockSkewMs,
    issuePrefix,
    issues,
  );
  const signer = findAllowedFinalSigner(
    receipt,
    allowlistEntries,
    scope,
    role,
    issuePrefix,
    issues,
  );
  const signatureVerified = signer
    ? verifyFinalReceiptSignature(receipt, signer, issuePrefix, issues)
    : false;
  return issues.length === beforeCount && signatureVerified;
}

function decodeCanonicalTargetExportBytes(value, issuePrefix, issues) {
  if (!isNonEmptyString(value) || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    issues.push(`${issuePrefix}_content_base64_invalid`);
    return null;
  }
  try {
    const bytes = Buffer.from(value, "base64");
    if (bytes.length === 0 || bytes.toString("base64") !== value) {
      issues.push(`${issuePrefix}_content_base64_invalid`);
      return null;
    }
    return bytes;
  } catch {
    issues.push(`${issuePrefix}_content_base64_invalid`);
    return null;
  }
}

function parseTargetCsvLine(line, issuePrefix, issues) {
  const cells = [];
  let current = "";
  let insideQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === '"' && insideQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (character === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }
    if (character === "," && !insideQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  if (insideQuotes) {
    issues.push(`${issuePrefix}_csv_unclosed_quote`);
    return null;
  }
  cells.push(current);
  return cells;
}

function validateTargetCsvBytes(bytes, expectedMarket, declaredRowCount, issuePrefix, issues) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    issues.push(`${issuePrefix}_csv_utf8_invalid`);
    return false;
  }
  const lines = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  while (lines.length > 0 && lines.at(-1) === "") lines.pop();
  if (lines.length < 2) {
    issues.push(`${issuePrefix}_csv_rows_missing`);
    return false;
  }
  if (lines.some((line) => line.length === 0)) {
    issues.push(`${issuePrefix}_csv_blank_row`);
  }
  const headerCells = parseTargetCsvLine(lines[0], issuePrefix, issues);
  if (!headerCells) return false;
  headerCells[0] = headerCells[0].replace(/^\uFEFF/, "");
  if (stableJsonValue(headerCells) !== stableJsonValue(TARGET_EXPORT_HEADERS)) {
    issues.push(`${issuePrefix}_csv_schema_mismatch`);
  }
  const marketIndex = headerCells.indexOf("market");
  const tickerIndex = headerCells.indexOf("ticker");
  const numericFields = [
    "expectedCagr",
    "priceCagr10y",
    "mdd",
    "beta",
    "dataYears",
  ];
  const numericIndexes = numericFields.map((field) => headerCells.indexOf(field));
  const seenIdentities = new Set();
  let parsedRowCount = 0;
  for (let index = 1; index < lines.length; index += 1) {
    const cells = parseTargetCsvLine(lines[index], issuePrefix, issues);
    if (!cells) continue;
    parsedRowCount += 1;
    if (cells.length !== TARGET_EXPORT_HEADERS.length) {
      issues.push(`${issuePrefix}_csv_row_column_count_invalid:${index}`);
      continue;
    }
    const market = cells[marketIndex]?.trim().toUpperCase() || "";
    const ticker = cells[tickerIndex]?.trim().toUpperCase() || "";
    if (market !== expectedMarket) {
      issues.push(`${issuePrefix}_csv_market_mismatch:${index}`);
    }
    if (!ticker) {
      issues.push(`${issuePrefix}_csv_ticker_missing:${index}`);
    } else {
      const identity = `${market}:${ticker}`;
      if (seenIdentities.has(identity)) {
        issues.push(`${issuePrefix}_csv_duplicate_market_ticker:${identity}`);
      } else {
        seenIdentities.add(identity);
      }
    }
    for (const numericIndex of numericIndexes) {
      const value = cells[numericIndex]?.trim() || "";
      if (value && !Number.isFinite(Number(value))) {
        issues.push(`${issuePrefix}_csv_numeric_value_invalid:${index}`);
        break;
      }
    }
  }
  if (!Number.isInteger(declaredRowCount) || declaredRowCount <= 0) {
    issues.push(`${issuePrefix}_row_count_invalid`);
  } else if (declaredRowCount !== parsedRowCount) {
    issues.push(`${issuePrefix}_row_count_mismatch`);
  }
  return parsedRowCount > 0;
}

function metricsOutputSourceMember(packageIndex, issues) {
  if (!isPlainObject(packageIndex) || !Array.isArray(packageIndex.members)) {
    issues.push("target_export_source_package_index_invalid");
    return null;
  }
  const matches = packageIndex.members.filter(
    (member) =>
      isPlainObject(member) &&
      /^finple_candidate_metrics_output_[A-Za-z0-9_-]+\.csv$/.test(member.path),
  );
  if (matches.length !== 1) {
    issues.push("target_export_source_metrics_output_member_missing_or_duplicate");
    return null;
  }
  return matches[0];
}

function validateTargetExport(
  target,
  {
    expectedRole,
    expectedImportName,
    expectedMarket,
    issuePrefix,
  },
  issues,
) {
  const beforeCount = issues.length;
  if (!isPlainObject(target)) {
    issues.push(`${issuePrefix}_not_object`);
    return { verified: false, sha256: "", path: "", importName: "" };
  }
  if (target.role !== expectedRole) {
    issues.push(`${issuePrefix}_role_mismatch`);
  }
  if (target.importName !== expectedImportName) {
    issues.push(`${issuePrefix}_import_name_mismatch`);
  }
  if (
    !isSafeRepositoryPath(target.path) ||
    !target.path.startsWith("src/data/tickers/") ||
    !target.path.endsWith(".csv")
  ) {
    issues.push(`${issuePrefix}_path_invalid`);
  }
  if (target.market !== expectedMarket) {
    issues.push(`${issuePrefix}_market_mismatch`);
  }
  if (target.schemaVersion !== METRICS_TARGET_EXPORT_SCHEMA_VERSION) {
    issues.push(`${issuePrefix}_schema_version_mismatch`);
  }
  const bytes = decodeCanonicalTargetExportBytes(
    target.contentBase64,
    issuePrefix,
    issues,
  );
  const recomputedSha256 = bytes ? sha256Hex(bytes) : "";
  if (!isSha256(target.sha256)) {
    issues.push(`${issuePrefix}_sha256_invalid`);
  } else if (target.sha256 !== recomputedSha256) {
    issues.push(`${issuePrefix}_sha256_mismatch`);
  }
  if (!Number.isInteger(target.byteSize) || target.byteSize <= 0) {
    issues.push(`${issuePrefix}_byte_size_invalid`);
  } else if (bytes && target.byteSize !== bytes.length) {
    issues.push(`${issuePrefix}_byte_size_mismatch`);
  }
  if (bytes) {
    validateTargetCsvBytes(
      bytes,
      expectedMarket,
      target.rowCount,
      issuePrefix,
      issues,
    );
  }
  return {
    verified: issues.length === beforeCount,
    sha256: recomputedSha256,
    path: target.path || "",
    importName: target.importName || "",
  };
}

function validateTargetExportVerificationEvidence(
  evidence,
  context,
  packageIndex,
  issues,
) {
  const beforeCount = issues.length;
  if (!isPlainObject(evidence)) {
    issues.push("target_export_verification_evidence_not_object");
    return { verified: false, targetsByRole: new Map() };
  }
  if (
    evidence.contractVersion !==
    METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION
  ) {
    issues.push("target_export_verification_evidence_contract_version_mismatch");
  }
  for (const [field, expected] of Object.entries({
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    packageIndexFile: context.packageIndexFile,
  })) {
    if (evidence[field] !== expected) {
      issues.push(`target_export_verification_evidence_${field}_mismatch`);
    }
  }
  if (evidence.exportPolicyVersion !== METRICS_TARGET_EXPORT_POLICY_VERSION) {
    issues.push("target_export_verification_evidence_export_policy_version_mismatch");
  }
  const sourceMember = metricsOutputSourceMember(packageIndex, issues);
  if (!isPlainObject(evidence.sourceMetricsOutputMember)) {
    issues.push("target_export_source_metrics_output_evidence_not_object");
  } else if (sourceMember) {
    if (evidence.sourceMetricsOutputMember.path !== sourceMember.path) {
      issues.push("target_export_source_metrics_output_path_mismatch");
    }
    if (
      evidence.sourceMetricsOutputMember.sha256 !== sourceMember.sha256 ||
      !isSha256(evidence.sourceMetricsOutputMember.sha256)
    ) {
      issues.push("target_export_source_metrics_output_hash_mismatch");
    }
  }
  const usResult = validateTargetExport(
    evidence.usTarget,
    {
      expectedRole: "us_price_metrics",
      expectedImportName: "usPriceMetricsOverlayCsv",
      expectedMarket: "US",
      issuePrefix: "target_export_us",
    },
    issues,
  );
  const krResult = validateTargetExport(
    evidence.krTarget,
    {
      expectedRole: "kr_price_metrics",
      expectedImportName: "krPriceMetricsOverlayCsv",
      expectedMarket: "KR",
      issuePrefix: "target_export_kr",
    },
    issues,
  );
  return {
    verified:
      issues.length === beforeCount && usResult.verified && krResult.verified,
    targetsByRole: new Map([
      ["us_price_metrics", usResult],
      ["kr_price_metrics", krResult],
    ]),
  };
}

function validateSnapshotShape(snapshot, expectedKind, issuePrefix, issues) {
  const beforeCount = issues.length;
  if (!isPlainObject(snapshot)) {
    issues.push(`${issuePrefix}_not_object`);
    return false;
  }
  if (snapshot.contractVersion !== METRICS_POINTER_SNAPSHOT_CONTRACT_VERSION) {
    issues.push(`${issuePrefix}_contract_version_mismatch`);
  }
  if (snapshot.snapshotKind !== expectedKind) {
    issues.push(`${issuePrefix}_kind_mismatch`);
  }
  if (!isPlainObject(snapshot.selector)) {
    issues.push(`${issuePrefix}_selector_not_object`);
  } else {
    if (!isSafeRepositoryPath(snapshot.selector.path)) {
      issues.push(`${issuePrefix}_selector_path_invalid`);
    }
    if (!isSha256(snapshot.selector.sha256)) {
      issues.push(`${issuePrefix}_selector_sha256_invalid`);
    }
  }
  if (!isCommitIdentity(snapshot.sourceCommit)) {
    issues.push(`${issuePrefix}_source_commit_invalid`);
  }
  if (!Array.isArray(snapshot.components)) {
    issues.push(`${issuePrefix}_components_not_array`);
  } else {
    const seen = new Set();
    for (const component of snapshot.components) {
      if (!isPlainObject(component)) {
        issues.push(`${issuePrefix}_component_not_object`);
        continue;
      }
      if (!isNonEmptyString(component.role)) {
        issues.push(`${issuePrefix}_component_role_invalid`);
      } else if (seen.has(component.role)) {
        issues.push(`${issuePrefix}_component_role_duplicate:${component.role}`);
      } else {
        seen.add(component.role);
      }
      if (!isNonEmptyString(component.importName)) {
        issues.push(`${issuePrefix}_component_import_name_invalid:${component.role || ""}`);
      }
      if (!isSafeRepositoryPath(component.path)) {
        issues.push(`${issuePrefix}_component_path_invalid:${component.role || ""}`);
      }
      if (!isSha256(component.sha256)) {
        issues.push(`${issuePrefix}_component_sha256_invalid:${component.role || ""}`);
      }
      for (const field of ["fixtureOnly", "testOnly", "reviewOnly"]) {
        if (Object.hasOwn(component, field) && component[field] !== false) {
          issues.push(
            `${issuePrefix}_component_${field}_must_be_false:${component.role || ""}`,
          );
        }
      }
    }
    const expectedRoles = REQUIRED_COMPONENTS.map((component) => component.role).sort();
    const actualRoles = [...seen].sort();
    if (stableJsonValue(actualRoles) !== stableJsonValue(expectedRoles)) {
      issues.push(`${issuePrefix}_component_roles_incomplete`);
    }
  }
  for (const field of ["fixtureOnly", "testOnly", "reviewOnly"]) {
    if (snapshot[field] !== false) {
      issues.push(`${issuePrefix}_${field}_must_be_false`);
    }
  }
  if (!isSha256(snapshot.pointerIdentityHash)) {
    issues.push(`${issuePrefix}_pointer_identity_hash_invalid`);
  } else if (snapshot.pointerIdentityHash !== hashMetricsPointerSnapshot(snapshot)) {
    issues.push(`${issuePrefix}_pointer_identity_hash_mismatch`);
  }
  return issues.length === beforeCount;
}

function componentByRole(snapshot, role) {
  return Array.isArray(snapshot?.components)
    ? snapshot.components.find((component) => component?.role === role)
    : null;
}

function sameSelection(left, right) {
  return stableJsonValue(selectionIdentityPayload(left)) === stableJsonValue(selectionIdentityPayload(right));
}

function validateCurrentPointerSnapshot(snapshot, issues) {
  const beforeCount = issues.length;
  validateSnapshotShape(snapshot, "current", "current_pointer_snapshot", issues);
  if (
    isPlainObject(snapshot) &&
    stableJsonValue(pointerIdentityPayload(snapshot)) !==
      stableJsonValue(pointerIdentityPayload(CURRENT_POINTER_SNAPSHOT))
  ) {
    issues.push("current_pointer_snapshot_operating_selection_mismatch");
  }
  return issues.length === beforeCount;
}

function validateTargetPointerSnapshot(
  snapshot,
  context,
  targetExportVerification,
  issues,
) {
  const beforeCount = issues.length;
  validateSnapshotShape(snapshot, "target", "target_pointer_snapshot", issues);
  if (!isPlainObject(snapshot)) return false;
  if (targetExportVerification?.verified !== true) {
    issues.push("target_pointer_snapshot_export_evidence_not_verified");
  }
  if (snapshot.selector?.path !== CURRENT_POINTER_SNAPSHOT.selector.path) {
    issues.push("target_pointer_snapshot_selector_path_mismatch");
  }
  if (snapshot.selector?.sha256 === CURRENT_POINTER_SNAPSHOT.selector.sha256) {
    issues.push("target_pointer_snapshot_selector_not_changed");
  }
  if (snapshot.sourceCommit === CURRENT_POINTER_SNAPSHOT.sourceCommit) {
    issues.push("target_pointer_snapshot_source_commit_not_changed");
  }
  if (snapshot.pointerIdentityHash === CURRENT_POINTER_SNAPSHOT.pointerIdentityHash) {
    issues.push("target_pointer_snapshot_equals_current");
  }
  if (sameSelection(snapshot, CURRENT_POINTER_SNAPSHOT)) {
    issues.push("target_pointer_snapshot_noop_selection");
  }
  for (const [field, expected] of Object.entries({
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    packageIndexFile: context.packageIndexFile,
  })) {
    if (snapshot[field] !== expected) {
      issues.push(`target_pointer_snapshot_${field}_mismatch`);
    }
  }
  for (const role of STABLE_COMPONENT_ROLES) {
    const currentComponent = componentByRole(CURRENT_POINTER_SNAPSHOT, role);
    const targetComponent = componentByRole(snapshot, role);
    if (
      !targetComponent ||
      stableJsonValue(normalizedComponent(targetComponent)) !==
        stableJsonValue(normalizedComponent(currentComponent))
    ) {
      issues.push(`target_pointer_snapshot_stable_component_mismatch:${role}`);
    }
  }
  for (const role of TARGET_COMPONENT_ROLES) {
    const currentComponent = componentByRole(CURRENT_POINTER_SNAPSHOT, role);
    const targetComponent = componentByRole(snapshot, role);
    const verifiedTarget = targetExportVerification?.targetsByRole?.get(role);
    if (!targetComponent) continue;
    if (
      targetComponent.path === currentComponent.path ||
      targetComponent.sha256 === currentComponent.sha256
    ) {
      issues.push(`target_pointer_snapshot_partial_or_unchanged_component:${role}`);
    }
    if (
      !targetComponent.path.startsWith("src/data/tickers/") ||
      !targetComponent.path.endsWith(".csv")
    ) {
      issues.push(`target_pointer_snapshot_component_path_scope_invalid:${role}`);
    }
    if (
      containsBlockedReviewMarker(targetComponent.path) ||
      containsBlockedReviewMarker(targetComponent.importName)
    ) {
      issues.push(`target_pointer_snapshot_component_review_marker_blocked:${role}`);
    }
    if (
      !verifiedTarget ||
      targetComponent.path !== verifiedTarget.path ||
      targetComponent.importName !== verifiedTarget.importName ||
      targetComponent.sha256 !== verifiedTarget.sha256
    ) {
      issues.push(`target_pointer_snapshot_component_export_bytes_mismatch:${role}`);
    }
    for (const [field, expected] of Object.entries({
      candidatePackageId: context.candidatePackageId,
      candidatePackageHash: context.candidatePackageHash,
      zipPackageSha256: context.zipPackageSha256,
      packageIndexFile: context.packageIndexFile,
    })) {
      if (targetComponent[field] !== expected) {
        issues.push(`target_pointer_snapshot_component_${field}_mismatch:${role}`);
      }
    }
  }
  return issues.length === beforeCount;
}

function validateRollbackPointerSnapshot(snapshot, currentSnapshot, issues) {
  const beforeCount = issues.length;
  validateSnapshotShape(snapshot, "rollback", "rollback_pointer_snapshot", issues);
  if (
    isPlainObject(snapshot) &&
    isPlainObject(currentSnapshot) &&
    stableJsonValue(pointerIdentityPayload(snapshot)) !==
      stableJsonValue(pointerIdentityPayload(currentSnapshot))
  ) {
    issues.push("rollback_pointer_snapshot_not_equal_to_current");
  }
  if (
    isPlainObject(snapshot) &&
    isPlainObject(currentSnapshot) &&
    snapshot.pointerIdentityHash !== currentSnapshot.pointerIdentityHash
  ) {
    issues.push("rollback_pointer_identity_hash_mismatch");
  }
  return issues.length === beforeCount;
}

function validateEligibilityEvidenceAge(value, policy, now, clockSkewMs, issues) {
  const evaluatedAt = parseInstant(value);
  if (evaluatedAt === null) {
    issues.push("eligibility_evaluated_at_invalid");
    return false;
  }
  const nowMs = now.getTime();
  if (evaluatedAt > nowMs + clockSkewMs) {
    issues.push("eligibility_evaluated_at_in_future");
  }
  if (
    Number.isInteger(policy.maxEligibilityEvidenceAgeHours) &&
    nowMs - evaluatedAt >
      policy.maxEligibilityEvidenceAgeHours * HOUR_MS + clockSkewMs
  ) {
    issues.push("eligibility_evidence_too_old");
  }
  return !issues.includes("eligibility_evaluated_at_invalid");
}

function buildRehearsalPlans(context) {
  return {
    cutoverPlan: [
      {
        order: 1,
        reviewAction: "confirm_step114_2o_eligibility_evidence",
        evidenceHash: context.eligibilityEvidenceHash,
        rehearsalOnly: true,
      },
      {
        order: 2,
        reviewAction: "confirm_independent_final_approvals",
        rehearsalOnly: true,
      },
      {
        order: 3,
        reviewAction: "compare_current_and_target_loader_selection",
        currentPointerIdentityHash: context.currentPointerIdentityHash,
        targetPointerIdentityHash: context.targetPointerIdentityHash,
        rehearsalOnly: true,
      },
      {
        order: 4,
        reviewAction: "confirm_rollback_restores_current_selection",
        rollbackPointerIdentityHash: context.rollbackPointerIdentityHash,
        rehearsalOnly: true,
      },
    ],
    rollbackPlan: [
      {
        order: 1,
        reviewAction: "retain_verified_current_pointer_snapshot",
        pointerIdentityHash: context.currentPointerIdentityHash,
        rehearsalOnly: true,
      },
      {
        order: 2,
        reviewAction: "compare_post_cutover_observation_to_rollback_triggers",
        rehearsalOnly: true,
      },
      {
        order: 3,
        reviewAction: "request_separate_rollback_execution_approval",
        rehearsalOnly: true,
      },
    ],
    rollbackTriggers: [
      "target_component_hash_mismatch",
      "target_selection_incomplete",
      "post_cutover_validation_failure",
      "consumer_boundary_regression",
    ],
  };
}

export function evaluateMetricsFinalApprovalCutoverRehearsal(input = {}, options = {}) {
  if (!isPlainObject(input)) {
    return result("blocked", {}, ["final_approval_input_not_object"]);
  }

  const blockingIssues = [];
  collectExecutionAuthorizationAttempts(input, blockingIssues);
  if (Object.hasOwn(input, "activationDryRunEligible")) {
    blockingIssues.push("caller_activation_dry_run_eligible_not_trusted");
  }
  if (isIdleInput(input)) {
    if (blockingIssues.length > 0) return result("blocked", {}, blockingIssues);
    return result("idle", {}, ["final_approval_cutover_rehearsal_input_missing"]);
  }

  const now =
    options.now instanceof Date && Number.isFinite(options.now.getTime())
      ? options.now
      : null;
  if (!now) blockingIssues.push("evaluation_time_missing_or_invalid");
  const effectiveNow = now || new Date(0);
  const clockSkewMs =
    Number.isInteger(options.clockSkewMs) && options.clockSkewMs >= 0
      ? options.clockSkewMs
      : DEFAULT_CLOCK_SKEW_MS;

  const policyIssues = [];
  const approvalPolicySatisfied = validateApprovalPolicy(
    input.approvalPolicy,
    policyIssues,
  );
  blockingIssues.push(...policyIssues);

  const eligibilityEvaluatedAtMs = parseInstant(input.eligibilityEvaluatedAt);
  const eligibilityEvaluationDate =
    eligibilityEvaluatedAtMs === null
      ? new Date(Number.NaN)
      : new Date(eligibilityEvaluatedAtMs);
  const suppliedEligibilityOptions =
    options.eligibilityOptions === undefined
      ? {}
      : options.eligibilityOptions;
  let eligibilityOptionsNowMatches = true;
  if (!isPlainObject(suppliedEligibilityOptions)) {
    blockingIssues.push("eligibility_options_not_object");
    eligibilityOptionsNowMatches = false;
  } else if (Object.hasOwn(suppliedEligibilityOptions, "now")) {
    const suppliedEligibilityNow =
      suppliedEligibilityOptions.now instanceof Date &&
      Number.isFinite(suppliedEligibilityOptions.now.getTime())
        ? suppliedEligibilityOptions.now.getTime()
        : null;
    if (
      eligibilityEvaluatedAtMs === null ||
      suppliedEligibilityNow !== eligibilityEvaluatedAtMs
    ) {
      blockingIssues.push("eligibility_options_now_mismatch");
      eligibilityOptionsNowMatches = false;
    }
  }
  const forcedEligibilityOptions = {
    ...(isPlainObject(suppliedEligibilityOptions)
      ? suppliedEligibilityOptions
      : {}),
    now: eligibilityEvaluationDate,
  };
  const eligibilityResult = evaluateMetricsLoaderActivationEligibility(
    input.eligibilityInput ?? {},
    forcedEligibilityOptions,
  );
  const eligibilityEvidenceHash = hashMetricsEligibilityEvidence(eligibilityResult);
  const candidateManifest = input.eligibilityInput?.candidateManifest;
  const candidatePackageId =
    isPlainObject(candidateManifest) && isNonEmptyString(candidateManifest.candidatePackageId)
      ? candidateManifest.candidatePackageId
      : eligibilityResult.candidatePackageId || "";
  const candidatePackageHash =
    isPlainObject(candidateManifest) && isSha256(candidateManifest.candidatePackageHash)
      ? candidateManifest.candidatePackageHash
      : eligibilityResult.candidatePackageHash || "";
  const zipPackageSha256 = input.eligibilityInput?.zipPackageSha256 || "";
  const packageIndexFile =
    input.eligibilityInput?.packageIndex?.selfExcludedIndexFile || "";

  const step1142OEligibilityInvalid =
    eligibilityResult.status !== "eligible" ||
    eligibilityResult.ok !== true ||
    eligibilityResult.activationDryRunEligible !== true;
  if (step1142OEligibilityInvalid) {
    blockingIssues.push("step114_2o_eligibility_not_eligible");
  }
  const eligibilityContractInvalid =
    eligibilityResult.contractVersion !==
    METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION;
  if (eligibilityContractInvalid) {
    blockingIssues.push("step114_2o_contract_version_mismatch");
  }
  let eligibilityFixedOutputsValid = true;
  for (const [field, expected] of Object.entries({
    productionPublishReady: false,
    appExportApproved: false,
    loaderPointerMutationPlanned: false,
    loaderActivated: false,
  })) {
    if (eligibilityResult[field] !== expected) {
      blockingIssues.push(`step114_2o_fixed_output_invalid:${field}`);
      eligibilityFixedOutputsValid = false;
    }
  }
  const eligibilityReverified =
    !step1142OEligibilityInvalid &&
    !eligibilityContractInvalid &&
    eligibilityFixedOutputsValid &&
    eligibilityEvaluatedAtMs !== null &&
    eligibilityOptionsNowMatches;
  if (!isSha256(input.eligibilityEvidenceHash)) {
    blockingIssues.push("eligibility_evidence_hash_invalid");
  } else if (input.eligibilityEvidenceHash !== eligibilityEvidenceHash) {
    blockingIssues.push("eligibility_evidence_hash_mismatch");
  }
  validateEligibilityEvidenceAge(
    input.eligibilityEvaluatedAt,
    isPlainObject(input.approvalPolicy) ? input.approvalPolicy : {},
    effectiveNow,
    clockSkewMs,
    blockingIssues,
  );
  if (!isSha256(zipPackageSha256)) {
    blockingIssues.push("zip_package_sha256_invalid");
  }
  if (!isNonEmptyString(packageIndexFile)) {
    blockingIssues.push("package_index_file_invalid");
  }

  const currentPointerSnapshotVerified = validateCurrentPointerSnapshot(
    input.currentPointerSnapshot,
    blockingIssues,
  );

  const snapshotContext = {
    candidatePackageId,
    candidatePackageHash,
    zipPackageSha256,
    packageIndexFile,
  };
  const targetExportVerification =
    validateTargetExportVerificationEvidence(
      input.targetExportVerificationEvidence,
      snapshotContext,
      input.eligibilityInput?.packageIndex,
      blockingIssues,
    );
  const targetExportVerificationEvidenceVerified =
    targetExportVerification.verified === true;
  const targetPointerSnapshotVerified = validateTargetPointerSnapshot(
    input.targetPointerSnapshot,
    snapshotContext,
    targetExportVerification,
    blockingIssues,
  );
  const rollbackSnapshotVerified = validateRollbackPointerSnapshot(
    input.rollbackPointerSnapshot,
    input.currentPointerSnapshot,
    blockingIssues,
  );

  const currentPointerIdentityHash =
    input.currentPointerSnapshot?.pointerIdentityHash || "";
  const targetPointerIdentityHash =
    input.targetPointerSnapshot?.pointerIdentityHash || "";
  const rollbackPointerIdentityHash =
    input.rollbackPointerSnapshot?.pointerIdentityHash || "";

  const context = {
    candidatePackageId,
    candidatePackageHash,
    zipPackageSha256,
    eligibilityContractVersion:
      METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
    eligibilityEvidenceHash,
    eligibilityEvaluatedAt: input.eligibilityEvaluatedAt || "",
    eligibilityEvaluatedAtMs,
    packageIndexFile,
    currentPointerIdentityHash,
    targetPointerIdentityHash,
    rollbackPointerIdentityHash,
  };

  const allowlistIssues = [];
  const allowlistEntries = parseFinalApprovalAllowlist(
    options.finalApprovalAllowlistJson ??
      process.env.FINPLE_METRICS_FINAL_APPROVAL_PUBLIC_KEYS_JSON,
    allowlistIssues,
  );
  blockingIssues.push(...allowlistIssues);

  const productionReceiptVerified = verifyFinalApprovalReceipt(
    input.productionApprovalReceipt,
    {
      contractVersion: METRICS_PRODUCTION_PUBLISH_APPROVAL_CONTRACT_VERSION,
      scope: METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE,
      role: METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE,
      requiredAttestations: PRODUCTION_REQUIRED_ATTESTATIONS,
      issuePrefix: "production_approval_receipt",
    },
    context,
    allowlistEntries,
    isPlainObject(input.approvalPolicy) ? input.approvalPolicy : {},
    effectiveNow,
    clockSkewMs,
    blockingIssues,
  );

  const appExportReceiptVerified = verifyFinalApprovalReceipt(
    input.appExportApprovalReceipt,
    {
      contractVersion: METRICS_APP_EXPORT_APPROVAL_CONTRACT_VERSION,
      scope: METRICS_APP_EXPORT_APPROVAL_SCOPE,
      role: METRICS_APP_EXPORT_APPROVER_ROLE,
      requiredAttestations: APP_EXPORT_REQUIRED_ATTESTATIONS,
      issuePrefix: "app_export_approval_receipt",
    },
    context,
    allowlistEntries,
    isPlainObject(input.approvalPolicy) ? input.approvalPolicy : {},
    effectiveNow,
    clockSkewMs,
    blockingIssues,
  );
  const finalApprovalAllowlistValid = allowlistIssues.length === 0;
  const productionApprovalVerified =
    finalApprovalAllowlistValid && productionReceiptVerified;
  const appExportApprovalVerified =
    finalApprovalAllowlistValid && appExportReceiptVerified;

  let separationSatisfied = approvalPolicySatisfied;
  const productionReceipt = input.productionApprovalReceipt;
  const appReceipt = input.appExportApprovalReceipt;
  const productionSignerEntry = allowlistEntries.find(
    (entry) =>
      isPlainObject(entry) &&
      entry.signerKeyId === productionReceipt?.signerKeyId,
  );
  const appSignerEntry = allowlistEntries.find(
    (entry) =>
      isPlainObject(entry) &&
      entry.signerKeyId === appReceipt?.signerKeyId,
  );
  if (isPlainObject(productionReceipt) && isPlainObject(appReceipt)) {
    if (productionReceipt.receiptId === appReceipt.receiptId) {
      blockingIssues.push("final_approval_receipt_ids_not_distinct");
      separationSatisfied = false;
    }
    if (
      input.approvalPolicy?.requireDistinctSignerIds === true &&
      productionReceipt.signerId === appReceipt.signerId
    ) {
      blockingIssues.push("final_approval_signer_ids_not_distinct");
      separationSatisfied = false;
    }
    if (
      input.approvalPolicy?.requireDistinctSignerKeyIds === true &&
      productionReceipt.signerKeyId === appReceipt.signerKeyId
    ) {
      blockingIssues.push("final_approval_signer_key_ids_not_distinct");
      separationSatisfied = false;
    }
    if (
      input.approvalPolicy?.requireDistinctSignerKeyIds === true &&
      isSha256(productionSignerEntry?.__publicKeyFingerprint) &&
      productionSignerEntry.__publicKeyFingerprint ===
        appSignerEntry?.__publicKeyFingerprint
    ) {
      blockingIssues.push(
        "final_approval_public_key_fingerprints_not_distinct",
      );
      separationSatisfied = false;
    }
  }

  const approvalPolicyFullySatisfied =
    approvalPolicySatisfied && separationSatisfied;
  const ready =
    uniqueSorted(blockingIssues).length === 0 &&
    eligibilityResult.status === "eligible" &&
    eligibilityReverified &&
    productionApprovalVerified &&
    appExportApprovalVerified &&
    approvalPolicyFullySatisfied &&
    currentPointerSnapshotVerified &&
    targetExportVerificationEvidenceVerified &&
    targetPointerSnapshotVerified &&
    rollbackSnapshotVerified;

  const plans = ready ? buildRehearsalPlans(context) : {};
  return result(
    ready ? "ready" : "blocked",
    {
      candidatePackageId,
      candidatePackageHash,
      zipPackageSha256,
      eligibilityContractVersion:
        METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
      eligibilityEvidenceHash,
      eligibilityReverified,
      productionApprovalVerified,
      appExportApprovalVerified,
      approvalPolicySatisfied: approvalPolicyFullySatisfied,
      currentPointerSnapshotVerified,
      targetExportVerificationEvidenceVerified,
      targetPointerSnapshotVerified,
      rollbackSnapshotVerified,
      cutoverPlanReady: ready,
      rollbackPlanReady: ready,
      ...plans,
    },
    blockingIssues,
  );
}
