import { createHash } from "node:crypto";

import { verifyMetricsCandidateApprovalReceipt } from "./metricsCandidateApprovalReceipt.js";

export const METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION =
  "metrics-loader-activation-eligibility-v1-step114-2o";
export const METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION =
  "metrics-loader-activation-freshness-policy-v1-step114-2o";

const CANDIDATE_PACKAGE_CONTRACT_VERSION = "production-candidate-package-v1-step114-2m";
const CANDIDATE_PACKAGE_VERSION = "candidate-package-v1-step114-2m";
const PACKAGE_INDEX_CONTRACT_VERSION = "candidate-final-package-index-v1-step114-2m";
const PACKAGE_INDEX_HASH_ALGORITHM = "sha256-json-canonical";
const PACKAGE_MEMBER_HASH_ALGORITHM =
  "sha256-file-or-json-with-explicit-field-exclusion";
const PACKAGE_INDEX_SELF_EXCLUSION_REASON =
  "candidatePackageHash and package index identity are self-referential; index hash excludes candidatePackageHash and ZIP member set excludes the index hash from itself.";

const REQUIRED_POLICY_STRING_FIELDS = Object.freeze([
  "requiredPipelineVersion",
  "requiredNormalizationVersion",
  "requiredCalculationPolicyVersion",
]);

const FINAL_APPROVAL_FIELDS = Object.freeze([
  "productionApprovalGranted",
  "productionActivationAuthorized",
  "productionPublishReady",
  "appExportApproved",
  "loaderPointerMutationPlanned",
  "loaderActivated",
]);

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isSafeMemberPath(value) {
  return (
    isNonEmptyString(value) &&
    !value.includes("/") &&
    !value.includes("\\") &&
    value !== "." &&
    value !== ".."
  );
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

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJsonHash(value) {
  return sha256Bytes(Buffer.from(stableJsonValue(value), "utf8"));
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function result(status, fields = {}, blockingIssues = [], warningIssues = []) {
  return {
    ok: status === "eligible",
    status,
    contractVersion: METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
    candidatePackageId: fields.candidatePackageId || "",
    candidatePackageHash: fields.candidatePackageHash || "",
    candidatePackageReady: fields.candidatePackageReady === true,
    approvalReceiptVerified: fields.approvalReceiptVerified === true,
    signerAllowed: fields.signerAllowed === true,
    candidateIdentityBound: fields.candidateIdentityBound === true,
    packageIndexVerified: fields.packageIndexVerified === true,
    zipIdentityBound: fields.zipIdentityBound === true,
    sourceApprovalCurrent: fields.sourceApprovalCurrent === true,
    productionAllowlistConfigured: fields.productionAllowlistConfigured === true,
    activationDryRunEligible: status === "eligible",
    productionApprovalRequired: true,
    appExportApprovalRequired: true,
    productionPublishReady: false,
    appExportApproved: false,
    loaderPointerMutationPlanned: false,
    loaderActivated: false,
    blockingIssues: uniqueSorted(blockingIssues),
    warningIssues: uniqueSorted(warningIssues),
  };
}

function decodeCanonicalBase64(value, issues, path) {
  if (!isNonEmptyString(value) || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    issues.push(`package_member_content_base64_invalid:${path}`);
    return null;
  }
  try {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === 0 || decoded.toString("base64") !== value) {
      issues.push(`package_member_content_base64_invalid:${path}`);
      return null;
    }
    return decoded;
  } catch {
    issues.push(`package_member_content_base64_invalid:${path}`);
    return null;
  }
}

function expectedPackageMemberPaths(version) {
  return [
    `finple_candidate_manifest_${version}.json`,
    `finple_candidate_readiness_${version}.json`,
    `finple_candidate_normalized_month_end_${version}.csv`,
    `finple_candidate_monthly_returns_${version}.csv`,
    `finple_candidate_metrics_output_${version}.csv`,
    `finple_candidate_review_required_${version}.csv`,
    `finple_candidate_source_audit_${version}.csv`,
    `finple_candidate_timeseries_audit_${version}.csv`,
    `finple_candidate_audit_${version}.html`,
    `finple_candidate_hash_inventory_${version}.csv`,
  ];
}

function validatePythonPackageVerification(packageVerification, issues) {
  if (!isPlainObject(packageVerification)) {
    issues.push("candidate_package_verification_result_not_object");
    return false;
  }
  if (packageVerification.ok !== true) {
    issues.push("candidate_package_verification_not_ok");
  }
  if (!Array.isArray(packageVerification.issues)) {
    issues.push("candidate_package_verification_issues_not_array");
  } else if (packageVerification.issues.length > 0) {
    issues.push("candidate_package_verification_issues_present");
  }
  return packageVerification.ok === true && Array.isArray(packageVerification.issues) && packageVerification.issues.length === 0;
}

function parseJsonMember(bytes, path, issues) {
  try {
    const parsed = JSON.parse(bytes.toString("utf8"));
    if (!isPlainObject(parsed)) {
      issues.push(`package_member_json_not_object:${path}`);
      return null;
    }
    return parsed;
  } catch {
    issues.push(`package_member_json_invalid:${path}`);
    return null;
  }
}

function validateManifestMember(candidateManifest, parsedManifest, issues) {
  if (!parsedManifest || !isPlainObject(candidateManifest)) return;
  try {
    if (stableJsonValue(parsedManifest) !== stableJsonValue(candidateManifest)) {
      issues.push("candidate_manifest_member_mismatch");
    }
  } catch {
    issues.push("candidate_manifest_member_invalid");
  }
}

function validateReadinessMember(candidateManifest, readiness, issues) {
  if (!readiness || !isPlainObject(candidateManifest)) return;
  const expected = {
    candidatePackageId: candidateManifest.candidatePackageId,
    candidatePackageHash: candidateManifest.candidatePackageHash,
    fixturePackageReady: false,
    candidatePackageReady: true,
    productionPublishReady: false,
    appExportApproved: false,
    blockingIssueCount: 0,
    notProductionApproval: true,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (readiness[field] !== value) issues.push(`candidate_readiness_${field}_mismatch`);
  }
}

export function verifyMetricsCandidatePackageIndex(input = {}) {
  const packageIndex = input.packageIndex;
  const packageMembers = input.packageMembers;
  const candidateManifest = input.candidateManifest;
  const packageVerification = input.packageVerification;
  const issues = [];

  validatePythonPackageVerification(packageVerification, issues);

  if (!isPlainObject(packageIndex)) {
    return { ok: false, candidatePackageHash: "", issues: ["package_index_not_object", ...issues].sort() };
  }

  if (packageIndex.contractVersion !== PACKAGE_INDEX_CONTRACT_VERSION) {
    issues.push("package_index_contract_version_mismatch");
  }
  if (!isSha256(packageIndex.candidatePackageHash)) {
    issues.push("package_index_candidate_package_hash_invalid");
  }
  if (packageIndex.hashAlgorithm !== PACKAGE_INDEX_HASH_ALGORITHM) {
    issues.push("package_index_hash_algorithm_mismatch");
  }
  if (packageIndex.zipMemberHashAlgorithm !== PACKAGE_MEMBER_HASH_ALGORITHM) {
    issues.push("package_index_member_hash_algorithm_mismatch");
  }
  if (packageIndex.selfExclusionReason !== PACKAGE_INDEX_SELF_EXCLUSION_REASON) {
    issues.push("package_index_self_exclusion_reason_mismatch");
  }

  const indexNameMatch = isSafeMemberPath(packageIndex.selfExcludedIndexFile)
    ? /^finple_candidate_package_index_([A-Za-z0-9._-]+)\.json$/.exec(
        packageIndex.selfExcludedIndexFile,
      )
    : null;
  if (!indexNameMatch || indexNameMatch[1].includes("..")) {
    issues.push("package_index_self_excluded_file_invalid");
  }
  const version = indexNameMatch?.[1] || "invalid";
  const expectedPaths = expectedPackageMemberPaths(version);
  const expectedPathSet = new Set(expectedPaths);

  if (!Array.isArray(packageIndex.members)) {
    issues.push("package_index_members_not_array");
  }
  const indexMembers = Array.isArray(packageIndex.members) ? packageIndex.members : [];
  if (indexMembers.length !== expectedPaths.length) {
    issues.push("package_index_member_count_mismatch");
  }

  const indexMembersByPath = new Map();
  for (const member of indexMembers) {
    if (!isPlainObject(member)) {
      issues.push("package_index_member_not_object");
      continue;
    }
    const path = member.path;
    if (!isSafeMemberPath(path)) {
      issues.push("package_index_member_path_invalid");
      continue;
    }
    if (indexMembersByPath.has(path)) issues.push(`package_index_member_duplicate:${path}`);
    else indexMembersByPath.set(path, member);
    if (!expectedPathSet.has(path)) issues.push(`package_index_member_unexpected:${path}`);
    if (!isSha256(member.sha256)) issues.push(`package_index_member_sha256_invalid:${path}`);
    if (typeof member.byteSize !== "string" || !/^(0|[1-9][0-9]*)$/.test(member.byteSize)) {
      issues.push(`package_index_member_byte_size_invalid:${path}`);
    }
    const manifestPath = `finple_candidate_manifest_${version}.json`;
    const readinessPath = `finple_candidate_readiness_${version}.json`;
    const expectedExclusions = path === manifestPath || path === readinessPath ? ["candidatePackageHash"] : [];
    if (
      !Array.isArray(member.hashExcludesJsonFields) ||
      stableJsonValue(member.hashExcludesJsonFields) !== stableJsonValue(expectedExclusions)
    ) {
      issues.push(`package_index_member_hash_exclusions_mismatch:${path}`);
    }
  }
  for (const path of expectedPaths) {
    if (!indexMembersByPath.has(path)) issues.push(`package_index_member_missing:${path}`);
  }

  if (!Array.isArray(packageMembers)) issues.push("package_members_not_array");
  const suppliedMembers = Array.isArray(packageMembers) ? packageMembers : [];
  const suppliedByPath = new Map();
  for (const member of suppliedMembers) {
    if (!isPlainObject(member) || !isSafeMemberPath(member.path)) {
      issues.push("package_member_payload_invalid");
      continue;
    }
    if (suppliedByPath.has(member.path)) issues.push(`package_member_payload_duplicate:${member.path}`);
    else suppliedByPath.set(member.path, member);
    if (!expectedPathSet.has(member.path)) issues.push(`package_member_payload_unexpected:${member.path}`);
  }
  for (const path of expectedPaths) {
    if (!suppliedByPath.has(path)) issues.push(`package_member_payload_missing:${path}`);
  }

  let parsedManifest = null;
  let parsedReadiness = null;
  for (const [path, indexedMember] of indexMembersByPath) {
    const suppliedMember = suppliedByPath.get(path);
    if (!suppliedMember) continue;
    const bytes = decodeCanonicalBase64(suppliedMember.contentBase64, issues, path);
    if (!bytes) continue;
    if (String(bytes.length) !== indexedMember.byteSize) {
      issues.push(`package_member_byte_size_mismatch:${path}`);
    }

    const exclusions = Array.isArray(indexedMember.hashExcludesJsonFields)
      ? indexedMember.hashExcludesJsonFields
      : [];
    let digest = "";
    if (exclusions.length > 0) {
      const payload = parseJsonMember(bytes, path, issues);
      if (payload) {
        for (const field of exclusions) payload[field] = "";
        try {
          digest = stableJsonHash(payload);
        } catch {
          issues.push(`package_member_json_hash_failed:${path}`);
        }
      }
    } else {
      digest = sha256Bytes(bytes);
    }
    if (digest && digest !== indexedMember.sha256) {
      issues.push(`package_member_hash_mismatch:${path}`);
    }

    if (path === `finple_candidate_manifest_${version}.json`) {
      parsedManifest = parseJsonMember(bytes, path, issues);
    }
    if (path === `finple_candidate_readiness_${version}.json`) {
      parsedReadiness = parseJsonMember(bytes, path, issues);
    }
  }

  validateManifestMember(candidateManifest, parsedManifest, issues);
  validateReadinessMember(candidateManifest, parsedReadiness, issues);

  try {
    const indexForHash = { ...packageIndex };
    delete indexForHash.candidatePackageHash;
    const actualPackageHash = stableJsonHash(indexForHash);
    if (actualPackageHash !== packageIndex.candidatePackageHash) {
      issues.push("candidate_package_hash_mismatch");
    }
  } catch {
    issues.push("candidate_package_hash_calculation_failed");
  }

  if (
    !isPlainObject(candidateManifest) ||
    packageIndex.candidatePackageHash !== candidateManifest.candidatePackageHash
  ) {
    issues.push("package_index_candidate_identity_mismatch");
  }

  return {
    ok: issues.length === 0,
    candidatePackageHash: isSha256(packageIndex.candidatePackageHash)
      ? packageIndex.candidatePackageHash
      : "",
    issues: uniqueSorted(issues),
  };
}

function validateCandidateManifest(candidateManifest, issues) {
  if (!isPlainObject(candidateManifest)) {
    issues.push("candidate_manifest_not_object");
    return false;
  }
  if (candidateManifest.contractVersion !== CANDIDATE_PACKAGE_CONTRACT_VERSION) {
    issues.push("candidate_manifest_contract_version_mismatch");
  }
  if (candidateManifest.candidatePackageVersion !== CANDIDATE_PACKAGE_VERSION) {
    issues.push("candidate_manifest_package_version_mismatch");
  }
  if (!isNonEmptyString(candidateManifest.candidatePackageId)) {
    issues.push("candidate_manifest_candidate_package_id_invalid");
  }
  for (const field of ["candidatePackageHash", "sourceDeclarationHash", "submissionManifestHash"]) {
    if (!isSha256(candidateManifest[field])) issues.push(`candidate_manifest_${field}_invalid`);
  }
  const requiredFlags = {
    fixturePackageReady: false,
    candidatePackageReady: true,
    productionPublishReady: false,
    appExportApproved: false,
    externalProviderCalls: false,
    blockingIssueCount: 0,
  };
  for (const [field, expected] of Object.entries(requiredFlags)) {
    if (candidateManifest[field] !== expected) issues.push(`candidate_manifest_${field}_invalid`);
  }
  return issues.length === 0;
}

function validateFreshnessPolicy(policy, issues) {
  if (!isPlainObject(policy)) {
    issues.push("freshness_policy_not_object");
    return false;
  }
  if (policy.policyVersion !== METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION) {
    issues.push("freshness_policy_version_mismatch");
  }
  for (const field of ["maxMetricAgeDays", "maxReceiptAgeHours"]) {
    if (!Number.isInteger(policy[field]) || policy[field] <= 0) {
      issues.push(`freshness_policy_${field}_invalid`);
    }
  }
  for (const field of REQUIRED_POLICY_STRING_FIELDS) {
    if (!isNonEmptyString(policy[field])) issues.push(`freshness_policy_${field}_invalid`);
  }
  return issues.length === 0;
}

function parseMetricDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp;
}

function validateFreshnessAndVersions(candidateManifest, receipt, policy, now, issues) {
  if (!isPlainObject(candidateManifest) || !isPlainObject(receipt) || !isPlainObject(policy) || !now) {
    return false;
  }
  const beforeCount = issues.length;
  const metricDate = parseMetricDate(candidateManifest.metricBaseDate);
  if (metricDate === null) {
    issues.push("metric_base_date_invalid");
  } else {
    const currentUtcDate = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const metricAgeDays = (currentUtcDate - metricDate) / DAY_MS;
    if (metricAgeDays < 0) issues.push("metric_base_date_in_future");
    else if (metricAgeDays > policy.maxMetricAgeDays) issues.push("metric_base_date_stale");
  }

  const issuedAt = Date.parse(receipt.issuedAt);
  if (!Number.isFinite(issuedAt)) {
    issues.push("approval_receipt_issued_at_invalid");
  } else {
    const receiptAgeHours = (now.getTime() - issuedAt) / HOUR_MS;
    if (receiptAgeHours < 0) issues.push("approval_receipt_issued_at_in_future");
    else if (receiptAgeHours > policy.maxReceiptAgeHours) issues.push("approval_receipt_stale");
  }

  const versionBindings = [
    ["pipelineVersion", "requiredPipelineVersion"],
    ["normalizationVersion", "requiredNormalizationVersion"],
    ["calculationPolicyVersion", "requiredCalculationPolicyVersion"],
  ];
  for (const [manifestField, policyField] of versionBindings) {
    if (
      candidateManifest[manifestField] !== policy[policyField] ||
      receipt[manifestField] !== policy[policyField]
    ) {
      issues.push(`required_${manifestField}_mismatch`);
    }
  }
  return issues.length === beforeCount;
}

function hasFinalApprovalAttempt(input, receipt, issues) {
  let attempted = false;
  for (const field of FINAL_APPROVAL_FIELDS) {
    if (input[field] === true || (isPlainObject(receipt) && receipt[field] === true)) {
      issues.push(`final_approval_flag_forbidden:${field}`);
      attempted = true;
    }
  }
  if (
    isPlainObject(receipt?.attestations) &&
    receipt.attestations.productionActivationNotAuthorized !== true
  ) {
    issues.push("production_activation_not_authorized_attestation_required");
    attempted = true;
  }
  return attempted;
}

function validProductionAllowlistJson(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

function isIdleInput(input) {
  return (
    !isPlainObject(input.candidateManifest) &&
    !isPlainObject(input.receipt ?? input.approvalReceipt) &&
    !isPlainObject(input.packageIndex) &&
    !Array.isArray(input.packageMembers) &&
    !isPlainObject(input.packageVerification) &&
    !isPlainObject(input.freshnessPolicy) &&
    !input.zipPackageSha256
  );
}

export function evaluateMetricsLoaderActivationEligibility(input = {}, options = {}) {
  if (!isPlainObject(input)) {
    return result("blocked", {}, ["eligibility_input_not_object"]);
  }
  if (isIdleInput(input)) {
    return result("idle", {}, ["loader_activation_eligibility_input_missing"]);
  }

  const candidateManifest = input.candidateManifest ?? null;
  const receipt = input.receipt ?? input.approvalReceipt ?? null;
  const zipPackageSha256 = input.zipPackageSha256 ?? "";
  const blockingIssues = [];
  const candidateIssues = [];
  const policyIssues = [];
  const freshnessIssues = [];

  const candidatePackageReady = validateCandidateManifest(candidateManifest, candidateIssues);
  blockingIssues.push(...candidateIssues);

  const freshnessPolicyValid = validateFreshnessPolicy(input.freshnessPolicy, policyIssues);
  blockingIssues.push(...policyIssues);

  const now = options.now instanceof Date && Number.isFinite(options.now.getTime()) ? options.now : null;
  if (!now) blockingIssues.push("evaluation_time_missing_or_invalid");

  if (!isSha256(zipPackageSha256)) blockingIssues.push("zip_package_sha256_invalid");

  const productionAllowlistJson =
    options.productionAllowlistJson ?? process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;
  const productionAllowlistConfigured = validProductionAllowlistJson(productionAllowlistJson);
  if (!productionAllowlistConfigured) blockingIssues.push("production_allowlist_not_configured");

  hasFinalApprovalAttempt(input, receipt, blockingIssues);

  const approvalResult = verifyMetricsCandidateApprovalReceipt(
    {
      candidateManifest,
      receipt,
      zipPackageSha256,
      allowlistJson: productionAllowlistJson,
    },
    {
      now: now || new Date(0),
      replayRegistry: options.replayRegistry,
      clockSkewMs: options.clockSkewMs,
    },
  );
  blockingIssues.push(...approvalResult.blockingIssues);

  const packageIndexResult = verifyMetricsCandidatePackageIndex({
    candidateManifest,
    packageIndex: input.packageIndex,
    packageMembers: input.packageMembers,
    packageVerification: input.packageVerification,
  });
  blockingIssues.push(...packageIndexResult.issues);

  const freshnessAndVersionsCurrent =
    freshnessPolicyValid &&
    validateFreshnessAndVersions(
      candidateManifest,
      receipt,
      input.freshnessPolicy,
      now,
      freshnessIssues,
    );
  blockingIssues.push(...freshnessIssues);

  const approvalReceiptVerified = approvalResult.approvalReceiptVerified === true;
  const signerAllowed = approvalResult.signerAllowed === true;
  const candidateIdentityBound = approvalResult.candidateIdentityBound === true;
  const zipIdentityBound = candidateIdentityBound && isSha256(zipPackageSha256);
  const packageIndexVerified = packageIndexResult.ok === true;
  const sourceApprovalCurrent =
    approvalResult.status === "ready" && freshnessAndVersionsCurrent && productionAllowlistConfigured;

  const activationDryRunEligible =
    uniqueSorted(blockingIssues).length === 0 &&
    candidatePackageReady &&
    approvalReceiptVerified &&
    signerAllowed &&
    candidateIdentityBound &&
    packageIndexVerified &&
    zipIdentityBound &&
    sourceApprovalCurrent &&
    productionAllowlistConfigured;

  return result(
    activationDryRunEligible ? "eligible" : "blocked",
    {
      candidatePackageId:
        isPlainObject(candidateManifest) && isNonEmptyString(candidateManifest.candidatePackageId)
          ? candidateManifest.candidatePackageId
          : approvalResult.candidatePackageId,
      candidatePackageHash:
        isPlainObject(candidateManifest) && isSha256(candidateManifest.candidatePackageHash)
          ? candidateManifest.candidatePackageHash
          : approvalResult.candidatePackageHash,
      candidatePackageReady,
      approvalReceiptVerified,
      signerAllowed,
      candidateIdentityBound,
      packageIndexVerified,
      zipIdentityBound,
      sourceApprovalCurrent,
      productionAllowlistConfigured,
    },
    blockingIssues,
  );
}
