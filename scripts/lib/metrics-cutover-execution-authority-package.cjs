const { createHash } = require("node:crypto");

const {
  APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS: STEP114_2T_FIXED_FALSE_FIELDS,
  REQUEST_FIELDS,
  TARGET_FIELDS,
  TARGET_SCHEMA_VERSION,
  runMetricsCutoverExecutionApprovalRequest,
  validateMetricsCutoverExecutionApprovalRequest,
} = require("./metrics-cutover-execution-approval-request.cjs");
const {
  APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS: STEP114_2U_FIXED_FALSE_FIELDS,
  readMetricsCutoverExecutionApprovalResponseObservation,
  readMetricsCutoverExecutionApproverAllowlistObservation,
  runMetricsCutoverExecutionApprovalResponseVerification,
} = require("./metrics-cutover-execution-approval-response.cjs");
const {
  readMetricsCutoverPostMergeBundleObservation,
} = require("./metrics-cutover-post-merge-dry-run-input.cjs");
const {
  areMetricsTargetPathsDistinct,
} = require("./metrics-target-path-identity.cjs");

const AUTHORITY_PACKAGE_CONTRACT_VERSION =
  "metrics-cutover-execution-authority-package-v1-step114-2v";
const AUTHORITY_POLICY_VERSION =
  "metrics-cutover-execution-authority-policy-v1-step114-2v";
const AUTHORITY_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-execution-authority-summary-v1-step114-2v";
const AUTHORITY_STATUS = "sealed_non_executing";
const AUTHORITY_PACKAGE_ID_DOMAIN =
  "FINPLE_STEP114_2V_AUTHORITY_PACKAGE_ID\0";
const AUTHORITY_PACKAGE_HASH_DOMAIN =
  "FINPLE_STEP114_2V_AUTHORITY_PACKAGE_HASH\0";

const AUTHORITY_REQUIREMENTS = Object.freeze({
  requiresSeparateExplicitExecutionInvocation: true,
  requiresFreshRepositoryRecheck: true,
  requiresFreshApprovalReverification: true,
  requiresExactExecutionPackageHash: true,
  requiresCreateOnlyWrites: true,
  requiresExactTwoSelectorReplacements: true,
  requiresSingleUseExecutionReceipt: true,
  allowTargetDeletion: false,
  allowAutomaticRollback: false,
});

const AUTHORITY_PACKAGE_FIELDS = Object.freeze([
  "contractVersion",
  "policyVersion",
  "authorityPackageId",
  "authorityStatus",
  "requestId",
  "requestHash",
  "verificationReceiptHash",
  "responseId",
  "responseHash",
  "responseFileSha256",
  "allowlistFileSha256",
  "operatorBundleSha256",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "branchName",
  "trackedPathsSha256",
  "targetPathAbsenceEvidenceHash",
  "candidatePackageId",
  "candidatePackageHash",
  "zipPackageSha256",
  "cutoverRehearsalEvidenceHash",
  "executionPackageHash",
  "selectorPreimageSha256",
  "selectorPostimageSha256",
  "targets",
  "plannedWriteCount",
  "plannedDeleteCount",
  "authorityRequirements",
  "authorityPackageHash",
]);

const AUTHORITY_REQUIREMENT_FIELDS = Object.freeze(
  Object.keys(AUTHORITY_REQUIREMENTS),
);

const STEP114_2U_EQUALITY_FIELDS = Object.freeze([
  "verificationReceiptHash",
  "requestId",
  "requestHash",
  "responseId",
  "responseHash",
  "responseFileSha256",
  "allowlistFileSha256",
  "operatorBundleSha256",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "branchName",
  "executionPackageHash",
  "signerKeyId",
  "signerId",
  "issuedAt",
  "expiresAt",
  "targetFileCount",
  "plannedWriteCount",
  "plannedDeleteCount",
]);

const FIXED_FALSE_FIELDS = Object.freeze([
  "executionAuthorized",
  "fileWriteAuthorized",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
  "appExportActivated",
  "pointerMutationExecuted",
  "rollbackExecuted",
  "loaderActivated",
]);

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/[\0\r\n]/.test(value)
  );
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isGitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function isNamedBranch(value) {
  return (
    isNonEmptyString(value) &&
    !value.startsWith("-") &&
    !value.startsWith(".") &&
    !value.endsWith(".") &&
    !value.endsWith("/") &&
    !value.endsWith(".lock") &&
    !value.includes("..") &&
    !value.includes("@{") &&
    !value.includes("//") &&
    !/[\x00-\x20\x7f~^:?*[\]\\]/.test(value)
  );
}

function isSafeTargetPath(value) {
  return (
    isNonEmptyString(value) &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.split("/").includes("..") &&
    value.startsWith("src/data/tickers/") &&
    value.endsWith(".csv")
  );
}

function hasExactKeys(value, expectedFields) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  return (
    actual.length === expected.length &&
    actual.every((field, index) => field === expected[index])
  );
}

function canonicalJson(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non_finite_number");
    return JSON.stringify(value);
  }
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint" ||
    value instanceof Date ||
    Buffer.isBuffer(value)
  ) {
    throw new TypeError("unsupported_canonical_value");
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new TypeError("sparse_array_not_supported");
      }
    }
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (!isRecord(value)) {
    throw new TypeError("prototype_bearing_object_not_supported");
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => {
      if (value[key] === undefined) {
        throw new TypeError("undefined_not_supported");
      }
      return `${JSON.stringify(key)}:${canonicalJson(value[key])}`;
    })
    .join(",")}}`;
}

function validateTarget(target, expected, prefix, issues) {
  if (!hasExactKeys(target, TARGET_FIELDS)) {
    issues.push(`${prefix}_fields_invalid`);
    return;
  }
  if (target.role !== expected.role) issues.push(`${prefix}_role_mismatch`);
  if (target.market !== expected.market) issues.push(`${prefix}_market_mismatch`);
  if (!isSafeTargetPath(target.path)) issues.push(`${prefix}_path_invalid`);
  if (!isSha256(target.sha256)) issues.push(`${prefix}_sha256_invalid`);
  if (!Number.isInteger(target.byteSize) || target.byteSize <= 0) {
    issues.push(`${prefix}_byte_size_invalid`);
  }
  if (!Number.isInteger(target.rowCount) || target.rowCount <= 0) {
    issues.push(`${prefix}_row_count_invalid`);
  }
  if (target.schemaVersion !== TARGET_SCHEMA_VERSION) {
    issues.push(`${prefix}_schema_version_mismatch`);
  }
  if (target.writeMode !== "create_only") {
    issues.push(`${prefix}_write_mode_mismatch`);
  }
}

function validateMetricsCutoverTargetSummaries(
  value,
  issuePrefix = "authority_package",
) {
  const issues = [];
  if (!Array.isArray(value) || value.length !== 2) {
    return [`${issuePrefix}_target_count_invalid`];
  }
  validateTarget(
    value[0],
    { role: "us_price_metrics", market: "US" },
    `${issuePrefix}_us_target`,
    issues,
  );
  validateTarget(
    value[1],
    { role: "kr_price_metrics", market: "KR" },
    `${issuePrefix}_kr_target`,
    issues,
  );
  if (!areMetricsTargetPathsDistinct(value[0]?.path, value[1]?.path)) {
    issues.push(`${issuePrefix}_target_paths_not_distinct`);
  }
  return uniqueSorted(issues);
}

function validateAuthorityRequirements(value, issues) {
  if (!hasExactKeys(value, AUTHORITY_REQUIREMENT_FIELDS)) {
    issues.push("authority_requirements_fields_invalid");
    return;
  }
  for (const [field, expected] of Object.entries(AUTHORITY_REQUIREMENTS)) {
    if (value[field] !== expected) {
      issues.push(`authority_requirement_mismatch:${field}`);
    }
  }
}

function authorityIdentityPayload(value) {
  return {
    requestId: value.requestId,
    requestHash: value.requestHash,
    verificationReceiptHash: value.verificationReceiptHash,
    responseId: value.responseId,
    responseHash: value.responseHash,
    operatorBundleSha256: value.operatorBundleSha256,
    repositoryHeadSha: value.repositoryHeadSha,
    repositoryTreeSha: value.repositoryTreeSha,
    executionPackageHash: value.executionPackageHash,
    targetPathAbsenceEvidenceHash: value.targetPathAbsenceEvidenceHash,
  };
}

function recomputeMetricsCutoverExecutionAuthorityPackageId(value = {}) {
  return `metrics-cutover-authority-package-${sha256(
    Buffer.concat([
      Buffer.from(AUTHORITY_PACKAGE_ID_DOMAIN, "utf8"),
      Buffer.from(canonicalJson(authorityIdentityPayload(value)), "utf8"),
    ]),
  )}`;
}

function validateAuthorityPackageShape(value) {
  const issues = [];
  if (!hasExactKeys(value, AUTHORITY_PACKAGE_FIELDS)) {
    return ["authority_package_fields_invalid"];
  }
  if (value.contractVersion !== AUTHORITY_PACKAGE_CONTRACT_VERSION) {
    issues.push("authority_package_contract_version_mismatch");
  }
  if (value.policyVersion !== AUTHORITY_POLICY_VERSION) {
    issues.push("authority_package_policy_version_mismatch");
  }
  if (value.authorityStatus !== AUTHORITY_STATUS) {
    issues.push("authority_package_status_mismatch");
  }
  if (
    typeof value.authorityPackageId !== "string" ||
    !/^metrics-cutover-authority-package-[a-f0-9]{64}$/.test(
      value.authorityPackageId,
    )
  ) {
    issues.push("authority_package_id_invalid");
  }
  if (
    typeof value.requestId !== "string" ||
    !/^metrics-cutover-request-[a-f0-9]{64}$/.test(value.requestId)
  ) {
    issues.push("authority_package_request_id_invalid");
  }
  if (
    typeof value.responseId !== "string" ||
    !/^metrics-cutover-approval-response-[a-f0-9]{64}$/.test(
      value.responseId,
    )
  ) {
    issues.push("authority_package_response_id_invalid");
  }
  for (const field of [
    "requestHash",
    "verificationReceiptHash",
    "responseHash",
    "responseFileSha256",
    "allowlistFileSha256",
    "operatorBundleSha256",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "candidatePackageHash",
    "zipPackageSha256",
    "cutoverRehearsalEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
    "authorityPackageHash",
  ]) {
    if (!isSha256(value[field])) {
      issues.push(`authority_package_hash_invalid:${field}`);
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) {
      issues.push(`authority_package_git_sha_invalid:${field}`);
    }
  }
  if (!isNamedBranch(value.branchName)) {
    issues.push("authority_package_branch_invalid");
  }
  if (!isNonEmptyString(value.candidatePackageId)) {
    issues.push("authority_package_candidate_id_invalid");
  }
  if (value.plannedWriteCount !== 2) {
    issues.push("authority_package_planned_write_count_invalid");
  }
  if (value.plannedDeleteCount !== 0) {
    issues.push("authority_package_planned_delete_count_invalid");
  }
  issues.push(
    ...validateMetricsCutoverTargetSummaries(
      value.targets,
      "authority_package",
    ),
  );
  validateAuthorityRequirements(value.authorityRequirements, issues);
  try {
    canonicalJson(value);
  } catch {
    issues.push("authority_package_canonical_value_invalid");
  }
  return uniqueSorted(issues);
}

function canonicalizeMetricsCutoverExecutionAuthorityPackage(value = {}) {
  const issues = validateAuthorityPackageShape(value);
  if (issues.length > 0) throw new TypeError(issues.join(","));
  const payload = {};
  for (const field of AUTHORITY_PACKAGE_FIELDS) {
    if (field !== "authorityPackageHash") payload[field] = value[field];
  }
  return canonicalJson(payload);
}

function hashMetricsCutoverExecutionAuthorityPackage(value = {}) {
  return sha256(
    Buffer.concat([
      Buffer.from(AUTHORITY_PACKAGE_HASH_DOMAIN, "utf8"),
      Buffer.from(
        canonicalizeMetricsCutoverExecutionAuthorityPackage(value),
        "utf8",
      ),
    ]),
  );
}

function validateMetricsCutoverExecutionAuthorityPackage(value = {}) {
  const issues = validateAuthorityPackageShape(value);
  if (
    issues.length === 0 &&
    value.authorityPackageId !==
      recomputeMetricsCutoverExecutionAuthorityPackageId(value)
  ) {
    issues.push("authority_package_id_mismatch");
  }
  if (issues.length === 0) {
    let computedHash = "";
    try {
      computedHash = hashMetricsCutoverExecutionAuthorityPackage(value);
    } catch {
      issues.push("authority_package_hash_recomputation_failed");
    }
    if (computedHash && value.authorityPackageHash !== computedHash) {
      issues.push("authority_package_hash_mismatch");
    }
  }
  return { ok: issues.length === 0, issues: uniqueSorted(issues) };
}

function validateStep1142TResult(result, label) {
  const issues = [];
  if (!isRecord(result)) return [`step114_2t_${label}_not_object`];
  for (const [field, expected] of Object.entries({
    contractVersion: APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION,
    status: "request_ready",
    ok: true,
    approvalRequestReady: true,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
  })) {
    if (result[field] !== expected) {
      issues.push(`step114_2t_${label}_invalid:${field}`);
    }
  }
  if (!Array.isArray(result.blockingIssues) || result.blockingIssues.length > 0) {
    issues.push(`step114_2t_${label}_blocking_issues_invalid`);
  }
  if (!Array.isArray(result.warningIssues)) {
    issues.push(`step114_2t_${label}_warning_issues_invalid`);
  }
  for (const field of STEP114_2T_FIXED_FALSE_FIELDS) {
    if (result[field] !== false) {
      issues.push(`step114_2t_${label}_fixed_false_invalid:${field}`);
    }
  }
  const validation = validateMetricsCutoverExecutionApprovalRequest(
    result.approvalRequest,
  );
  if (!validation.ok) {
    issues.push(
      ...validation.issues.map((issue) => `step114_2t_${label}:${issue}`),
    );
  } else {
    const request = result.approvalRequest;
    for (const [outerField, requestField] of [
      ["approvalRequestHash", "requestHash"],
      ["operatorBundleSha256", "operatorBundleSha256"],
      ["repositoryHeadSha", "repositoryHeadSha"],
      ["repositoryTreeSha", "repositoryTreeSha"],
      ["branchName", "branchName"],
      ["executionPackageHash", "executionPackageHash"],
    ]) {
      if (result[outerField] !== request[requestField]) {
        issues.push(`step114_2t_${label}_outer_identity_mismatch:${outerField}`);
      }
    }
  }
  return uniqueSorted(issues);
}

function validateStep1142UResult(result, label) {
  const issues = [];
  if (!isRecord(result)) return [`step114_2u_${label}_not_object`];
  for (const [field, expected] of Object.entries({
    contractVersion: APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
    status: "approval_verified",
    ok: true,
    approvalResponseVerified: true,
    approvalDecisionAccepted: true,
    signatureVerified: true,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
  })) {
    if (result[field] !== expected) {
      issues.push(`step114_2u_${label}_invalid:${field}`);
    }
  }
  if (!Array.isArray(result.blockingIssues) || result.blockingIssues.length > 0) {
    issues.push(`step114_2u_${label}_blocking_issues_invalid`);
  }
  if (!Array.isArray(result.warningIssues)) {
    issues.push(`step114_2u_${label}_warning_issues_invalid`);
  }
  for (const field of STEP114_2U_FIXED_FALSE_FIELDS) {
    if (result[field] !== false) {
      issues.push(`step114_2u_${label}_fixed_false_invalid:${field}`);
    }
  }
  for (const field of [
    "verificationReceiptHash",
    "requestHash",
    "responseHash",
    "responseFileSha256",
    "allowlistFileSha256",
    "operatorBundleSha256",
    "executionPackageHash",
  ]) {
    if (!isSha256(result[field])) {
      issues.push(`step114_2u_${label}_hash_invalid:${field}`);
    }
  }
  if (
    typeof result.requestId !== "string" ||
    !/^metrics-cutover-request-[a-f0-9]{64}$/.test(result.requestId)
  ) {
    issues.push(`step114_2u_${label}_request_id_invalid`);
  }
  if (
    typeof result.responseId !== "string" ||
    !/^metrics-cutover-approval-response-[a-f0-9]{64}$/.test(
      result.responseId,
    )
  ) {
    issues.push(`step114_2u_${label}_response_id_invalid`);
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(result[field])) {
      issues.push(`step114_2u_${label}_git_sha_invalid:${field}`);
    }
  }
  if (!isNamedBranch(result.branchName)) {
    issues.push(`step114_2u_${label}_branch_invalid`);
  }
  return uniqueSorted(issues);
}

function compareCanonicalFields(left, right, fields, prefix) {
  const issues = [];
  for (const field of fields) {
    let equal = false;
    try {
      equal = canonicalJson(left?.[field]) === canonicalJson(right?.[field]);
    } catch {
      equal = false;
    }
    if (!equal) issues.push(`${prefix}:${field}`);
  }
  return uniqueSorted(issues);
}

function compareRequestAndVerification(request, verification, label) {
  const issues = [];
  for (const field of [
    "requestId",
    "requestHash",
    "operatorBundleSha256",
    "repositoryHeadSha",
    "repositoryTreeSha",
    "branchName",
    "executionPackageHash",
  ]) {
    if (request?.[field] !== verification?.[field]) {
      issues.push(`step114_2t_2u_identity_mismatch:${label}:${field}`);
    }
  }
  if (request?.targets?.length !== verification?.targetFileCount) {
    issues.push(`step114_2t_2u_identity_mismatch:${label}:targetFileCount`);
  }
  if (request?.plannedWriteCount !== verification?.plannedWriteCount) {
    issues.push(`step114_2t_2u_identity_mismatch:${label}:plannedWriteCount`);
  }
  if (request?.plannedDeleteCount !== verification?.plannedDeleteCount) {
    issues.push(`step114_2t_2u_identity_mismatch:${label}:plannedDeleteCount`);
  }
  return uniqueSorted(issues);
}

function compareVerificationAndObservations(verification, observations, label) {
  const issues = [];
  for (const [field, kind] of [
    ["operatorBundleSha256", "bundle"],
    ["responseFileSha256", "response"],
    ["allowlistFileSha256", "allowlist"],
  ]) {
    if (verification?.[field] !== observations?.[kind]?.sha256) {
      issues.push(`step114_2u_observation_hash_mismatch:${label}:${field}`);
    }
  }
  return issues;
}

function buildMetricsCutoverExecutionAuthorityPackage(request, verification) {
  const requestValidation =
    validateMetricsCutoverExecutionApprovalRequest(request);
  const verificationIssues = validateStep1142UResult(verification, "source");
  const identityIssues = compareRequestAndVerification(
    request,
    verification,
    "source",
  );
  if (
    !requestValidation.ok ||
    verificationIssues.length > 0 ||
    identityIssues.length > 0
  ) {
    throw new TypeError("authority_package_source_invalid");
  }
  const value = {
    contractVersion: AUTHORITY_PACKAGE_CONTRACT_VERSION,
    policyVersion: AUTHORITY_POLICY_VERSION,
    authorityPackageId: "",
    authorityStatus: AUTHORITY_STATUS,
    requestId: request.requestId,
    requestHash: request.requestHash,
    verificationReceiptHash: verification.verificationReceiptHash,
    responseId: verification.responseId,
    responseHash: verification.responseHash,
    responseFileSha256: verification.responseFileSha256,
    allowlistFileSha256: verification.allowlistFileSha256,
    operatorBundleSha256: request.operatorBundleSha256,
    repositoryHeadSha: request.repositoryHeadSha,
    repositoryTreeSha: request.repositoryTreeSha,
    branchName: request.branchName,
    trackedPathsSha256: request.trackedPathsSha256,
    targetPathAbsenceEvidenceHash: request.targetPathAbsenceEvidenceHash,
    candidatePackageId: request.candidatePackageId,
    candidatePackageHash: request.candidatePackageHash,
    zipPackageSha256: request.zipPackageSha256,
    cutoverRehearsalEvidenceHash: request.cutoverRehearsalEvidenceHash,
    executionPackageHash: request.executionPackageHash,
    selectorPreimageSha256: request.selectorPreimageSha256,
    selectorPostimageSha256: request.selectorPostimageSha256,
    targets: request.targets.map((target) => ({ ...target })),
    plannedWriteCount: request.plannedWriteCount,
    plannedDeleteCount: request.plannedDeleteCount,
    authorityRequirements: { ...AUTHORITY_REQUIREMENTS },
    authorityPackageHash: "0".repeat(64),
  };
  value.authorityPackageId =
    recomputeMetricsCutoverExecutionAuthorityPackageId(value);
  value.authorityPackageHash =
    hashMetricsCutoverExecutionAuthorityPackage(value);
  const validation = validateMetricsCutoverExecutionAuthorityPackage(value);
  if (!validation.ok) throw new TypeError("authority_package_invalid");
  return value;
}

function compareObservations(reference, candidate, kind, label) {
  const issues = [];
  if (!reference?.ok) issues.push(`${kind}_outer_observation_invalid`);
  if (!candidate?.ok) issues.push(`${kind}_consumed_observation_invalid:${label}`);
  if (issues.length > 0) return issues;
  if (reference.canonicalInputPath !== candidate.canonicalInputPath) {
    issues.push(`${kind}_consumed_canonical_path_mismatch:${label}`);
  }
  if (reference.byteSize !== candidate.byteSize) {
    issues.push(`${kind}_consumed_byte_size_mismatch:${label}`);
  }
  if (reference.sha256 !== candidate.sha256) {
    issues.push(`${kind}_consumed_sha256_mismatch:${label}`);
  }
  if (
    !Buffer.isBuffer(reference.bytes) ||
    !Buffer.isBuffer(candidate.bytes) ||
    !reference.bytes.equals(candidate.bytes)
  ) {
    issues.push(`${kind}_consumed_bytes_mismatch:${label}`);
  }
  if (
    reference.fileIdentitySupported !== candidate.fileIdentitySupported
  ) {
    issues.push(`${kind}_consumed_identity_support_mismatch:${label}`);
  } else if (
    reference.fileIdentitySupported === true &&
    reference.fileIdentity !== candidate.fileIdentity
  ) {
    issues.push(`${kind}_consumed_file_identity_mismatch:${label}`);
  }
  return uniqueSorted(issues);
}

function expectedCaptureCounts(group) {
  return group.startsWith("u_")
    ? { bundle: 7, response: 2, allowlist: 2 }
    : { bundle: 3, response: 0, allowlist: 0 };
}

function validateCaptureGroup(group, captures, outerA) {
  const issues = [];
  const expected = expectedCaptureCounts(group);
  for (const kind of ["bundle", "response", "allowlist"]) {
    const values = captures[kind];
    if (!Array.isArray(values) || values.length !== expected[kind]) {
      issues.push(`consumed_observation_count_invalid:${group}:${kind}`);
      continue;
    }
    values.forEach((observation, index) => {
      issues.push(
        ...compareObservations(
          outerA[kind],
          observation,
          kind,
          `${group}_${index}`,
        ),
      );
    });
  }
  return uniqueSorted(issues);
}

function compareCaptureGroupsToOuter(captureGroups, outer) {
  const issues = [];
  for (const [group, captures] of Object.entries(captureGroups)) {
    for (const kind of ["bundle", "response", "allowlist"]) {
      captures[kind].forEach((observation, index) => {
        issues.push(
          ...compareObservations(
            outer[kind],
            observation,
            kind,
            `${group}_${index}_outer_b`,
          ),
        );
      });
    }
  }
  return uniqueSorted(issues);
}

function newCaptureGroup() {
  return { bundle: [], response: [], allowlist: [] };
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const ready = status === "authority_package_ready";
  return {
    ok: ready,
    status,
    contractVersion: AUTHORITY_SUMMARY_CONTRACT_VERSION,
    authorityPackageReady: ready,
    approvalResponseVerified: ready,
    signatureVerified: ready,
    authorityPackage:
      ready && isRecord(fields.authorityPackage)
        ? structuredClone(fields.authorityPackage)
        : {},
    authorityPackageId: ready ? fields.authorityPackageId || "" : "",
    authorityPackageHash: ready ? fields.authorityPackageHash || "" : "",
    verificationReceiptHash:
      ready ? fields.verificationReceiptHash || "" : "",
    requestId: ready ? fields.requestId || "" : "",
    requestHash: ready ? fields.requestHash || "" : "",
    responseId: ready ? fields.responseId || "" : "",
    responseHash: ready ? fields.responseHash || "" : "",
    executionPackageHash: ready ? fields.executionPackageHash || "" : "",
    repositoryHeadSha: ready ? fields.repositoryHeadSha || "" : "",
    repositoryTreeSha: ready ? fields.repositoryTreeSha || "" : "",
    branchName: ready ? fields.branchName || "" : "",
    targetFileCount:
      ready && Number.isInteger(fields.targetFileCount)
        ? fields.targetFileCount
        : 0,
    plannedWriteCount:
      ready && Number.isInteger(fields.plannedWriteCount)
        ? fields.plannedWriteCount
        : 0,
    plannedDeleteCount:
      ready && Number.isInteger(fields.plannedDeleteCount)
        ? fields.plannedDeleteCount
        : 0,
    executionAuthorized: false,
    fileWriteAuthorized: false,
    commitAuthorized: false,
    pushAuthorized: false,
    mergeAuthorized: false,
    deploymentAuthorized: false,
    productionPublicationAuthorized: false,
    appExportActivated: false,
    pointerMutationExecuted: false,
    rollbackExecuted: false,
    loaderActivated: false,
    blockingIssues: uniqueSorted(issues),
    warningIssues: uniqueSorted(warnings),
  };
}

async function runMetricsCutoverExecutionAuthorityPackage(
  input = {},
  adapters = {},
) {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    return safeResult("idle", {}, [
      "metrics_cutover_execution_authority_package_input_missing",
    ]);
  }
  const inputFields = ["repo", "inputPath", "responsePath", "allowlistPath"];
  if (
    !hasExactKeys(input, inputFields) ||
    inputFields.some((field) => !isNonEmptyString(input[field]))
  ) {
    return safeResult("blocked", {}, [
      "metrics_cutover_execution_authority_package_invocation_invalid",
    ]);
  }

  const observeBundle =
    adapters.observeBundle || readMetricsCutoverPostMergeBundleObservation;
  const observeResponse =
    adapters.observeResponse ||
    readMetricsCutoverExecutionApprovalResponseObservation;
  const observeAllowlist =
    adapters.observeAllowlist ||
    readMetricsCutoverExecutionApproverAllowlistObservation;
  const runApprovalRequest =
    adapters.runApprovalRequest || runMetricsCutoverExecutionApprovalRequest;
  const runVerification =
    adapters.runVerification ||
    runMetricsCutoverExecutionApprovalResponseVerification;

  const outerA = {
    bundle: await observeBundle(input.inputPath),
    response: await observeResponse(input.responsePath),
    allowlist: await observeAllowlist(input.allowlistPath),
  };
  const initialIssues = [];
  for (const [kind, observation] of Object.entries(outerA)) {
    if (!observation?.ok) {
      initialIssues.push(
        ...(observation?.blockingIssues || [`${kind}_outer_a_failed`]),
      );
    }
  }
  if (initialIssues.length > 0) {
    return safeResult("blocked", {}, initialIssues);
  }

  const captureGroups = {};
  const createCapturingReader = (group, kind, reader) => async (filePath) => {
    const observation = await reader(filePath);
    captureGroups[group][kind].push(observation);
    return observation;
  };
  const runCapturedApprovalRequest = async (group) => {
    captureGroups[group] = newCaptureGroup();
    return runApprovalRequest(
      { repo: input.repo, inputPath: input.inputPath },
      {
        observeBundle: createCapturingReader(
          group,
          "bundle",
          observeBundle,
        ),
      },
    );
  };
  const runCapturedVerification = async (group) => {
    captureGroups[group] = newCaptureGroup();
    return runVerification(
      {
        repo: input.repo,
        inputPath: input.inputPath,
        responsePath: input.responsePath,
        allowlistPath: input.allowlistPath,
      },
      {
        observeBundle: createCapturingReader(
          group,
          "bundle",
          observeBundle,
        ),
        observeResponse: createCapturingReader(
          group,
          "response",
          observeResponse,
        ),
        observeAllowlist: createCapturingReader(
          group,
          "allowlist",
          observeAllowlist,
        ),
        runApprovalRequest: async (requestInput) =>
          runApprovalRequest(requestInput, {
            observeBundle: createCapturingReader(
              group,
              "bundle",
              observeBundle,
            ),
          }),
      },
    );
  };

  const issues = [];
  const verificationA = await runCapturedVerification("u_a");
  issues.push(...validateStep1142UResult(verificationA, "a"));
  issues.push(...validateCaptureGroup("u_a", captureGroups.u_a, outerA));
  issues.push(...compareVerificationAndObservations(verificationA, outerA, "a"));
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const requestAResult = await runCapturedApprovalRequest("t_a");
  issues.push(...validateStep1142TResult(requestAResult, "a"));
  issues.push(...validateCaptureGroup("t_a", captureGroups.t_a, outerA));
  if (requestAResult?.approvalRequest) {
    issues.push(
      ...compareRequestAndVerification(
        requestAResult.approvalRequest,
        verificationA,
        "a",
      ),
    );
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  let candidateA;
  let canonicalA;
  try {
    candidateA = buildMetricsCutoverExecutionAuthorityPackage(
      requestAResult.approvalRequest,
      verificationA,
    );
    canonicalA = canonicalizeMetricsCutoverExecutionAuthorityPackage(
      candidateA,
    );
  } catch {
    return safeResult("blocked", {}, ["authority_package_candidate_a_failed"]);
  }

  const requestBResult = await runCapturedApprovalRequest("t_b");
  issues.push(...validateStep1142TResult(requestBResult, "b"));
  issues.push(...validateCaptureGroup("t_b", captureGroups.t_b, outerA));
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const verificationB = await runCapturedVerification("u_b");
  issues.push(...validateStep1142UResult(verificationB, "b"));
  issues.push(...validateCaptureGroup("u_b", captureGroups.u_b, outerA));
  issues.push(...compareVerificationAndObservations(verificationB, outerA, "b"));
  if (requestBResult?.approvalRequest) {
    issues.push(
      ...compareRequestAndVerification(
        requestBResult.approvalRequest,
        verificationB,
        "b",
      ),
    );
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const outerB = {
    bundle: await observeBundle(input.inputPath),
    response: await observeResponse(input.responsePath),
    allowlist: await observeAllowlist(input.allowlistPath),
  };
  for (const kind of ["bundle", "response", "allowlist"]) {
    issues.push(
      ...compareObservations(outerA[kind], outerB[kind], kind, "outer_a_b"),
    );
  }
  issues.push(...compareCaptureGroupsToOuter(captureGroups, outerB));
  issues.push(
    ...compareCanonicalFields(
      requestAResult.approvalRequest,
      requestBResult.approvalRequest,
      REQUEST_FIELDS,
      "step114_2t_request_changed",
    ),
  );
  issues.push(
    ...compareCanonicalFields(
      verificationA,
      verificationB,
      STEP114_2U_EQUALITY_FIELDS,
      "step114_2u_verification_changed",
    ),
  );
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  let candidateB;
  let canonicalB;
  try {
    candidateB = buildMetricsCutoverExecutionAuthorityPackage(
      requestBResult.approvalRequest,
      verificationB,
    );
    canonicalB = canonicalizeMetricsCutoverExecutionAuthorityPackage(
      candidateB,
    );
  } catch {
    return safeResult("blocked", {}, ["authority_package_candidate_b_failed"]);
  }
  if (candidateA.authorityPackageId !== candidateB.authorityPackageId) {
    issues.push("authority_package_candidate_id_changed");
  }
  if (canonicalA !== canonicalB) {
    issues.push("authority_package_candidate_canonical_bytes_changed");
  }
  if (candidateA.authorityPackageHash !== candidateB.authorityPackageHash) {
    issues.push("authority_package_candidate_hash_changed");
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  return safeResult(
    "authority_package_ready",
    {
      authorityPackage: candidateA,
      authorityPackageId: candidateA.authorityPackageId,
      authorityPackageHash: candidateA.authorityPackageHash,
      verificationReceiptHash: candidateA.verificationReceiptHash,
      requestId: candidateA.requestId,
      requestHash: candidateA.requestHash,
      responseId: candidateA.responseId,
      responseHash: candidateA.responseHash,
      executionPackageHash: candidateA.executionPackageHash,
      repositoryHeadSha: candidateA.repositoryHeadSha,
      repositoryTreeSha: candidateA.repositoryTreeSha,
      branchName: candidateA.branchName,
      targetFileCount: candidateA.targets.length,
      plannedWriteCount: candidateA.plannedWriteCount,
      plannedDeleteCount: candidateA.plannedDeleteCount,
    },
    [],
    [
      ...(requestAResult.warningIssues || []),
      ...(requestBResult.warningIssues || []),
      ...(verificationA.warningIssues || []),
      ...(verificationB.warningIssues || []),
    ],
  );
}

module.exports = {
  AUTHORITY_PACKAGE_CONTRACT_VERSION,
  AUTHORITY_PACKAGE_FIELDS,
  AUTHORITY_PACKAGE_HASH_DOMAIN,
  AUTHORITY_PACKAGE_ID_DOMAIN,
  AUTHORITY_POLICY_VERSION,
  AUTHORITY_REQUIREMENTS,
  AUTHORITY_REQUIREMENT_FIELDS,
  AUTHORITY_STATUS,
  AUTHORITY_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  STEP114_2U_EQUALITY_FIELDS,
  buildMetricsCutoverExecutionAuthorityPackage,
  canonicalizeMetricsCutoverExecutionAuthorityPackage,
  hashMetricsCutoverExecutionAuthorityPackage,
  recomputeMetricsCutoverExecutionAuthorityPackageId,
  runMetricsCutoverExecutionAuthorityPackage,
  safeResult,
  validateMetricsCutoverTargetSummaries,
  validateMetricsCutoverExecutionAuthorityPackage,
};
