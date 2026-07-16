const { createHash } = require("node:crypto");

const {
  DRY_RUN_CONTRACT_VERSION,
  SUMMARY_CONTRACT_VERSION: STEP114_2S_SUMMARY_CONTRACT_VERSION,
  AUTHORIZATION_FIELDS: STEP114_2S_AUTHORIZATION_FIELDS,
  runMetricsCutoverPostMergeDryRun,
} = require("./metrics-cutover-post-merge-dry-run.cjs");
const {
  readMetricsCutoverPostMergeBundleObservation,
} = require("./metrics-cutover-post-merge-dry-run-input.cjs");
const {
  areMetricsTargetPathsDistinct,
} = require("./metrics-target-path-identity.cjs");

const APPROVAL_REQUEST_CONTRACT_VERSION =
  "metrics-cutover-execution-approval-request-v1-step114-2t";
const APPROVAL_REQUEST_POLICY_VERSION =
  "metrics-cutover-execution-approval-request-policy-v1-step114-2t";
const APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-execution-approval-request-summary-v1-step114-2t";
const TARGET_SCHEMA_VERSION =
  "metrics-price-overlay-csv-schema-v1-step114-2p";
const REQUEST_SCOPE = "metrics_exact_cutover_execution";
const REQUEST_STATUS = "unsigned_request";
const REQUEST_ID_DOMAIN = "FINPLE_STEP114_2T_REQUEST_ID\0";

const APPROVAL_REQUIREMENTS = Object.freeze({
  requiresSeparateSignedApproval: true,
  requiresFreshRepositoryRecheck: true,
  requiresExactExecutionPackageHash: true,
  requiresCreateOnlyWrites: true,
  requiresExactTwoSelectorReplacements: true,
  allowTargetDeletion: false,
  allowAutomaticRollback: false,
});

const REQUEST_FIELDS = Object.freeze([
  "contractVersion",
  "policyVersion",
  "requestId",
  "requestScope",
  "requestStatus",
  "operatorBundleSha256",
  "operatorBundleByteSize",
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
  "approvalRequirements",
  "requestHash",
]);

const TARGET_FIELDS = Object.freeze([
  "role",
  "path",
  "sha256",
  "byteSize",
  "rowCount",
  "market",
  "schemaVersion",
  "writeMode",
]);

const APPROVAL_REQUIREMENT_FIELDS = Object.freeze(
  Object.keys(APPROVAL_REQUIREMENTS),
);

const DRY_RUN_RESULT_FIELDS = Object.freeze([
  "ok",
  "status",
  "contractVersion",
  "dryRunReady",
  "repositoryStateStableAcrossDryRun",
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
  "targetFileCount",
  "plannedWriteCount",
  "plannedDeleteCount",
  "targetSummaries",
  ...STEP114_2S_AUTHORIZATION_FIELDS,
  "blockingIssues",
  "warningIssues",
]);

const FIXED_FALSE_FIELDS = Object.freeze([
  "approvalGranted",
  "executionAuthorized",
  "signatureApplied",
  "signatureVerified",
  ...STEP114_2S_AUTHORIZATION_FIELDS,
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
      const nested = value[key];
      if (nested === undefined) {
        throw new TypeError("undefined_not_supported");
      }
      return `${JSON.stringify(key)}:${canonicalJson(nested)}`;
    })
    .join(",")}}`;
}

function validateTarget(target, expected, issuePrefix, issues) {
  if (!hasExactKeys(target, TARGET_FIELDS)) {
    issues.push(`${issuePrefix}_fields_invalid`);
    return;
  }
  if (target.role !== expected.role) {
    issues.push(`${issuePrefix}_role_mismatch`);
  }
  if (target.market !== expected.market) {
    issues.push(`${issuePrefix}_market_mismatch`);
  }
  if (!isSafeTargetPath(target.path)) {
    issues.push(`${issuePrefix}_path_invalid`);
  }
  if (!isSha256(target.sha256)) {
    issues.push(`${issuePrefix}_sha256_invalid`);
  }
  if (!Number.isInteger(target.byteSize) || target.byteSize <= 0) {
    issues.push(`${issuePrefix}_byte_size_invalid`);
  }
  if (!Number.isInteger(target.rowCount) || target.rowCount <= 0) {
    issues.push(`${issuePrefix}_row_count_invalid`);
  }
  if (target.schemaVersion !== TARGET_SCHEMA_VERSION) {
    issues.push(`${issuePrefix}_schema_version_mismatch`);
  }
  if (target.writeMode !== "create_only") {
    issues.push(`${issuePrefix}_write_mode_mismatch`);
  }
}

function validateApprovalRequirements(value, issues) {
  if (!hasExactKeys(value, APPROVAL_REQUIREMENT_FIELDS)) {
    issues.push("approval_request_requirements_fields_invalid");
    return;
  }
  for (const [field, expected] of Object.entries(APPROVAL_REQUIREMENTS)) {
    if (value[field] !== expected) {
      issues.push(`approval_request_requirement_mismatch:${field}`);
    }
  }
}

function expectedRequestId(value) {
  const identityPayload = {
    operatorBundleSha256: value.operatorBundleSha256,
    repositoryHeadSha: value.repositoryHeadSha,
    repositoryTreeSha: value.repositoryTreeSha,
    executionPackageHash: value.executionPackageHash,
    targetPathAbsenceEvidenceHash:
      value.targetPathAbsenceEvidenceHash,
  };
  return `metrics-cutover-request-${sha256(
    Buffer.concat([
      Buffer.from(REQUEST_ID_DOMAIN, "utf8"),
      Buffer.from(canonicalJson(identityPayload), "utf8"),
    ]),
  )}`;
}

function validateRequestShape(value) {
  const issues = [];
  if (!hasExactKeys(value, REQUEST_FIELDS)) {
    return ["approval_request_fields_invalid"];
  }
  if (value.contractVersion !== APPROVAL_REQUEST_CONTRACT_VERSION) {
    issues.push("approval_request_contract_version_mismatch");
  }
  if (value.policyVersion !== APPROVAL_REQUEST_POLICY_VERSION) {
    issues.push("approval_request_policy_version_mismatch");
  }
  if (
    typeof value.requestId !== "string" ||
    !/^metrics-cutover-request-[a-f0-9]{64}$/.test(value.requestId)
  ) {
    issues.push("approval_request_id_invalid");
  }
  if (value.requestScope !== REQUEST_SCOPE) {
    issues.push("approval_request_scope_mismatch");
  }
  if (value.requestStatus !== REQUEST_STATUS) {
    issues.push("approval_request_status_mismatch");
  }
  for (const field of [
    "operatorBundleSha256",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "candidatePackageHash",
    "zipPackageSha256",
    "cutoverRehearsalEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
    "requestHash",
  ]) {
    if (!isSha256(value[field])) {
      issues.push(`approval_request_hash_field_invalid:${field}`);
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) {
      issues.push(`approval_request_git_sha_invalid:${field}`);
    }
  }
  if (!isNamedBranch(value.branchName)) {
    issues.push("approval_request_branch_invalid");
  }
  if (!isNonEmptyString(value.candidatePackageId)) {
    issues.push("approval_request_candidate_package_id_invalid");
  }
  if (
    !Number.isInteger(value.operatorBundleByteSize) ||
    value.operatorBundleByteSize <= 0
  ) {
    issues.push("approval_request_bundle_byte_size_invalid");
  }
  if (value.plannedWriteCount !== 2) {
    issues.push("approval_request_planned_write_count_invalid");
  }
  if (value.plannedDeleteCount !== 0) {
    issues.push("approval_request_planned_delete_count_invalid");
  }
  if (!Array.isArray(value.targets) || value.targets.length !== 2) {
    issues.push("approval_request_target_count_invalid");
  } else {
    validateTarget(
      value.targets[0],
      { role: "us_price_metrics", market: "US" },
      "approval_request_us_target",
      issues,
    );
    validateTarget(
      value.targets[1],
      { role: "kr_price_metrics", market: "KR" },
      "approval_request_kr_target",
      issues,
    );
    if (
      !areMetricsTargetPathsDistinct(
        value.targets[0]?.path,
        value.targets[1]?.path,
      )
    ) {
      issues.push("approval_request_target_paths_not_distinct");
    }
  }
  validateApprovalRequirements(value.approvalRequirements, issues);
  try {
    canonicalJson(value);
  } catch {
    issues.push("approval_request_canonical_value_invalid");
  }
  return uniqueSorted(issues);
}

function canonicalRequestPayload(value) {
  const payload = {};
  for (const field of REQUEST_FIELDS) {
    if (field !== "requestHash") payload[field] = value[field];
  }
  return canonicalJson(payload);
}

function canonicalizeMetricsCutoverExecutionApprovalRequest(value = {}) {
  const issues = validateRequestShape(value);
  if (issues.length > 0) {
    throw new TypeError(issues.join(","));
  }
  return canonicalRequestPayload(value);
}

function hashMetricsCutoverExecutionApprovalRequest(value = {}) {
  return sha256(
    Buffer.from(
      canonicalizeMetricsCutoverExecutionApprovalRequest(value),
      "utf8",
    ),
  );
}

function validateMetricsCutoverExecutionApprovalRequest(value = {}) {
  const issues = validateRequestShape(value);
  if (issues.length === 0 && value.requestId !== expectedRequestId(value)) {
    issues.push("approval_request_id_mismatch");
  }
  if (issues.length === 0) {
    let computedHash = "";
    try {
      computedHash = hashMetricsCutoverExecutionApprovalRequest(value);
    } catch {
      issues.push("approval_request_hash_recomputation_failed");
    }
    if (computedHash && value.requestHash !== computedHash) {
      issues.push("approval_request_hash_mismatch");
    }
  }
  return {
    ok: issues.length === 0,
    issues: uniqueSorted(issues),
  };
}

function validateIssueArray(value, field, issues) {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string")
  ) {
    issues.push(`step114_2s_${field}_invalid`);
  }
}

function validateMetricsCutoverPostMergeDryRunSummary(value = {}) {
  const issues = [];
  if (!hasExactKeys(value, DRY_RUN_RESULT_FIELDS)) {
    return {
      ok: false,
      issues: ["step114_2s_result_fields_invalid"],
      summary: null,
    };
  }
  for (const [field, expected] of Object.entries({
    status: "dry_run_ready",
    ok: true,
    contractVersion: DRY_RUN_CONTRACT_VERSION,
    dryRunReady: true,
    repositoryStateStableAcrossDryRun: true,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
  })) {
    if (value[field] !== expected) {
      issues.push(`step114_2s_result_invalid:${field}`);
    }
  }
  for (const field of STEP114_2S_AUTHORIZATION_FIELDS) {
    if (value[field] !== false) {
      issues.push(`step114_2s_authorization_output_invalid:${field}`);
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) {
      issues.push(`step114_2s_git_sha_invalid:${field}`);
    }
  }
  if (!isNamedBranch(value.branchName)) {
    issues.push("step114_2s_branch_name_invalid");
  }
  if (!isNonEmptyString(value.candidatePackageId)) {
    issues.push("step114_2s_candidate_package_id_invalid");
  }
  for (const field of [
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "candidatePackageHash",
    "zipPackageSha256",
    "cutoverRehearsalEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
  ]) {
    if (!isSha256(value[field])) {
      issues.push(`step114_2s_hash_invalid:${field}`);
    }
  }
  validateIssueArray(value.blockingIssues, "blocking_issues", issues);
  validateIssueArray(value.warningIssues, "warning_issues", issues);
  if (Array.isArray(value.blockingIssues) && value.blockingIssues.length > 0) {
    issues.push("step114_2s_blocking_issues_present");
  }
  if (!Array.isArray(value.targetSummaries) || value.targetSummaries.length !== 2) {
    issues.push("step114_2s_target_summary_count_invalid");
  } else {
    validateTarget(
      value.targetSummaries[0],
      { role: "us_price_metrics", market: "US" },
      "step114_2s_us_target",
      issues,
    );
    validateTarget(
      value.targetSummaries[1],
      { role: "kr_price_metrics", market: "KR" },
      "step114_2s_kr_target",
      issues,
    );
    if (
      !areMetricsTargetPathsDistinct(
        value.targetSummaries[0]?.path,
        value.targetSummaries[1]?.path,
      )
    ) {
      issues.push("step114_2s_target_paths_not_distinct");
    }
  }
  const valid = issues.length === 0;
  return {
    ok: valid,
    issues: uniqueSorted(issues),
    summary: valid
      ? {
          contractVersion: STEP114_2S_SUMMARY_CONTRACT_VERSION,
          repositoryHeadSha: value.repositoryHeadSha,
          repositoryTreeSha: value.repositoryTreeSha,
          branchName: value.branchName,
          trackedPathsSha256: value.trackedPathsSha256,
          targetPathAbsenceEvidenceHash:
            value.targetPathAbsenceEvidenceHash,
          candidatePackageId: value.candidatePackageId,
          candidatePackageHash: value.candidatePackageHash,
          zipPackageSha256: value.zipPackageSha256,
          cutoverRehearsalEvidenceHash:
            value.cutoverRehearsalEvidenceHash,
          executionPackageHash: value.executionPackageHash,
          selectorPreimageSha256: value.selectorPreimageSha256,
          selectorPostimageSha256: value.selectorPostimageSha256,
          targetFileCount: value.targetFileCount,
          plannedWriteCount: value.plannedWriteCount,
          plannedDeleteCount: value.plannedDeleteCount,
          targets: value.targetSummaries.map((target) => ({
            role: target.role,
            path: target.path,
            sha256: target.sha256,
            byteSize: target.byteSize,
            rowCount: target.rowCount,
            market: target.market,
            schemaVersion: target.schemaVersion,
            writeMode: target.writeMode,
          })),
          warningIssues: [...value.warningIssues],
        }
      : null,
  };
}

function compareMetricsCutoverOperatorBundleObservations(left, right) {
  const issues = [];
  if (!left?.ok) issues.push("operator_bundle_observation_a_invalid");
  if (!right?.ok) issues.push("operator_bundle_observation_b_invalid");
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  if (left.canonicalInputPath !== right.canonicalInputPath) {
    issues.push("operator_bundle_canonical_path_changed");
  }
  if (left.byteSize !== right.byteSize) {
    issues.push("operator_bundle_byte_size_changed");
  }
  if (left.sha256 !== right.sha256) {
    issues.push("operator_bundle_sha256_changed");
  }
  if (
    !Buffer.isBuffer(left.bytes) ||
    !Buffer.isBuffer(right.bytes) ||
    !left.bytes.equals(right.bytes)
  ) {
    issues.push("operator_bundle_bytes_changed");
  }
  if (
    left.fileIdentitySupported !== right.fileIdentitySupported
  ) {
    issues.push("operator_bundle_file_identity_support_changed");
  } else if (
    left.fileIdentitySupported === true &&
    left.fileIdentity !== right.fileIdentity
  ) {
    issues.push("operator_bundle_file_identity_changed");
  }
  return { ok: issues.length === 0, issues: uniqueSorted(issues) };
}

function buildMetricsCutoverExecutionApprovalRequest(
  operatorBundleObservation,
  dryRunSummary,
) {
  if (
    !operatorBundleObservation?.ok ||
    !Buffer.isBuffer(operatorBundleObservation.bytes) ||
    !isSha256(operatorBundleObservation.sha256) ||
    !Number.isInteger(operatorBundleObservation.byteSize) ||
    operatorBundleObservation.byteSize <= 0 ||
    !isRecord(dryRunSummary) ||
    dryRunSummary.contractVersion !==
      STEP114_2S_SUMMARY_CONTRACT_VERSION
  ) {
    throw new TypeError("approval_request_source_invalid");
  }
  const request = {
    contractVersion: APPROVAL_REQUEST_CONTRACT_VERSION,
    policyVersion: APPROVAL_REQUEST_POLICY_VERSION,
    requestId: "",
    requestScope: REQUEST_SCOPE,
    requestStatus: REQUEST_STATUS,
    operatorBundleSha256: operatorBundleObservation.sha256,
    operatorBundleByteSize: operatorBundleObservation.byteSize,
    repositoryHeadSha: dryRunSummary.repositoryHeadSha,
    repositoryTreeSha: dryRunSummary.repositoryTreeSha,
    branchName: dryRunSummary.branchName,
    trackedPathsSha256: dryRunSummary.trackedPathsSha256,
    targetPathAbsenceEvidenceHash:
      dryRunSummary.targetPathAbsenceEvidenceHash,
    candidatePackageId: dryRunSummary.candidatePackageId,
    candidatePackageHash: dryRunSummary.candidatePackageHash,
    zipPackageSha256: dryRunSummary.zipPackageSha256,
    cutoverRehearsalEvidenceHash:
      dryRunSummary.cutoverRehearsalEvidenceHash,
    executionPackageHash: dryRunSummary.executionPackageHash,
    selectorPreimageSha256: dryRunSummary.selectorPreimageSha256,
    selectorPostimageSha256: dryRunSummary.selectorPostimageSha256,
    targets: dryRunSummary.targets.map((target) => ({ ...target })),
    plannedWriteCount: dryRunSummary.plannedWriteCount,
    plannedDeleteCount: dryRunSummary.plannedDeleteCount,
    approvalRequirements: { ...APPROVAL_REQUIREMENTS },
    requestHash: "0".repeat(64),
  };
  request.requestId = expectedRequestId(request);
  request.requestHash = hashMetricsCutoverExecutionApprovalRequest(request);
  return request;
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const ready = status === "request_ready";
  return {
    ok: ready,
    status,
    contractVersion: APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION,
    approvalRequestReady: ready,
    approvalRequestHash: ready ? fields.approvalRequestHash || "" : "",
    approvalRequest:
      ready && isRecord(fields.approvalRequest)
        ? { ...fields.approvalRequest }
        : {},
    operatorBundleSha256:
      ready ? fields.operatorBundleSha256 || "" : "",
    repositoryHeadSha: ready ? fields.repositoryHeadSha || "" : "",
    repositoryTreeSha: ready ? fields.repositoryTreeSha || "" : "",
    branchName: ready ? fields.branchName || "" : "",
    executionPackageHash:
      ready ? fields.executionPackageHash || "" : "",
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
    approvalGranted: false,
    executionAuthorized: false,
    signatureApplied: false,
    signatureVerified: false,
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

async function runMetricsCutoverExecutionApprovalRequest(
  input = {},
  adapters = {},
) {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    return safeResult("idle", {}, [
      "metrics_cutover_execution_approval_request_input_missing",
    ]);
  }
  if (
    !hasExactKeys(input, ["repo", "inputPath"]) ||
    !isNonEmptyString(input.repo) ||
    !isNonEmptyString(input.inputPath)
  ) {
    return safeResult("blocked", {}, [
      "metrics_cutover_execution_approval_request_invocation_invalid",
    ]);
  }
  const observeBundle =
    adapters.observeBundle ||
    readMetricsCutoverPostMergeBundleObservation;
  const runDryRun =
    adapters.runDryRun || runMetricsCutoverPostMergeDryRun;
  const observationA = await observeBundle(input.inputPath);
  if (!observationA?.ok) {
    return safeResult(
      "blocked",
      {},
      observationA?.blockingIssues || [
        "operator_bundle_observation_a_failed",
      ],
    );
  }

  const dryRunResult = await runDryRun({
    repo: input.repo,
    inputPath: input.inputPath,
  });
  const observationB = await observeBundle(input.inputPath);
  const issues = [];
  if (!observationB?.ok) {
    issues.push(
      ...(observationB?.blockingIssues || [
        "operator_bundle_observation_b_failed",
      ]),
    );
  }
  const stability = compareMetricsCutoverOperatorBundleObservations(
    observationA,
    observationB,
  );
  issues.push(...stability.issues);
  const dryRunValidation =
    validateMetricsCutoverPostMergeDryRunSummary(dryRunResult);
  issues.push(...dryRunValidation.issues);
  if (issues.length > 0 || !dryRunValidation.summary) {
    return safeResult("blocked", {}, issues);
  }

  let approvalRequest;
  try {
    approvalRequest = buildMetricsCutoverExecutionApprovalRequest(
      observationA,
      dryRunValidation.summary,
    );
  } catch {
    return safeResult("blocked", {}, [
      "approval_request_construction_failed",
    ]);
  }
  const requestValidation =
    validateMetricsCutoverExecutionApprovalRequest(approvalRequest);
  if (!requestValidation.ok) {
    return safeResult("blocked", {}, requestValidation.issues);
  }
  return safeResult(
    "request_ready",
    {
      approvalRequestHash: approvalRequest.requestHash,
      approvalRequest,
      operatorBundleSha256: observationA.sha256,
      repositoryHeadSha: dryRunValidation.summary.repositoryHeadSha,
      repositoryTreeSha: dryRunValidation.summary.repositoryTreeSha,
      branchName: dryRunValidation.summary.branchName,
      executionPackageHash:
        dryRunValidation.summary.executionPackageHash,
      targetFileCount: dryRunValidation.summary.targetFileCount,
      plannedWriteCount: dryRunValidation.summary.plannedWriteCount,
      plannedDeleteCount: dryRunValidation.summary.plannedDeleteCount,
    },
    [],
    dryRunValidation.summary.warningIssues,
  );
}

module.exports = {
  APPROVAL_REQUEST_CONTRACT_VERSION,
  APPROVAL_REQUEST_POLICY_VERSION,
  APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION,
  APPROVAL_REQUIREMENTS,
  FIXED_FALSE_FIELDS,
  REQUEST_FIELDS,
  TARGET_FIELDS,
  TARGET_SCHEMA_VERSION,
  buildMetricsCutoverExecutionApprovalRequest,
  canonicalizeMetricsCutoverExecutionApprovalRequest,
  compareMetricsCutoverOperatorBundleObservations,
  hashMetricsCutoverExecutionApprovalRequest,
  runMetricsCutoverExecutionApprovalRequest,
  safeResult,
  validateMetricsCutoverExecutionApprovalRequest,
  validateMetricsCutoverPostMergeDryRunSummary,
};
