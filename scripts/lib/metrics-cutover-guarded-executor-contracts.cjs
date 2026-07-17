const { createHash } = require("node:crypto");
const {
  areMetricsTargetPathsDistinct,
} = require("./metrics-target-path-identity.cjs");

const TEST_FIXTURE_CONTRACT_VERSION =
  "metrics-cutover-test-fixture-v1-step114-2x-a";
const CLAIM_CONTRACT_VERSION =
  "metrics-cutover-receipt-claim-v1-step114-2x-a";
const POST_WRITE_RECEIPT_CONTRACT_VERSION =
  "metrics-cutover-post-write-receipt-v1-step114-2x-a";
const EXECUTION_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-execution-summary-v1-step114-2x-a";
const POST_WRITE_VERIFICATION_CONTRACT_VERSION =
  "metrics-cutover-post-write-verification-v1-step114-2x-a";
const CLAIM_ID_DOMAIN = "FINPLE_STEP114_2X_A_CLAIM_ID\0";
const CLAIM_HASH_DOMAIN = "FINPLE_STEP114_2X_A_CLAIM_HASH\0";
const POST_WRITE_VERIFICATION_HASH_DOMAIN =
  "FINPLE_STEP114_2X_A_POST_WRITE_VERIFICATION_HASH\0";
const POST_WRITE_RECEIPT_ID_DOMAIN =
  "FINPLE_STEP114_2X_A_POST_WRITE_RECEIPT_ID\0";
const POST_WRITE_RECEIPT_HASH_DOMAIN =
  "FINPLE_STEP114_2X_A_POST_WRITE_RECEIPT_HASH\0";

const FIXED_FALSE_FIELDS = Object.freeze([
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
const CLAIM_FIELDS = Object.freeze([
  "contractVersion",
  "claimId",
  "invocationReceiptId",
  "invocationReceiptHash",
  "claimStatus",
  "failureCode",
  "executionStage",
  "actualWriteCount",
  "selectorUpdated",
  "parentDirectoryDurability",
  "productionClaimEligible",
  "claimHash",
]);
const POST_WRITE_RECEIPT_FIELDS = Object.freeze([
  "contractVersion",
  "receiptId",
  "receiptStatus",
  "invocationReceiptId",
  "invocationReceiptHash",
  "authorityPackageId",
  "authorityPackageHash",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "trackedPathsSha256",
  "targetPathAbsenceEvidenceHash",
  "executionPackageHash",
  "selectorPreimageSha256",
  "selectorPostimageSha256",
  "targets",
  "plannedWriteCount",
  "plannedDeleteCount",
  "actualWriteCount",
  "actualDeleteCount",
  "claimId",
  "claimHash",
  "claimParentDirectoryDurability",
  "postWriteVerificationHash",
  "receiptHash",
]);
const TARGET_SUMMARY_FIELDS = Object.freeze([
  "role",
  "path",
  "sha256",
  "byteSize",
  "rowCount",
  "market",
  "schemaVersion",
  "writeMode",
]);
const TARGET_SCHEMA_VERSION =
  "metrics-price-overlay-csv-schema-v1-step114-2p";
const EXECUTION_STAGES = Object.freeze([
  "claim_acquired",
  "final_prewrite_recheck",
  "us_target_create",
  "us_target_written",
  "kr_target_create",
  "kr_target_written",
  "selector_preimage_check",
  "selector_write_pending",
  "selector_updated",
  "post_write_verification",
  "post_write_receipt",
  "claim_completion",
  "completed",
]);
const CLAIM_DURABILITY_STATES = Object.freeze([
  "pending",
  "synced",
  "unsupported_platform",
  "sync_failed",
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

function isSafeIdentity(value) {
  return (
    isNonEmptyString(value) &&
    value.length <= 160 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) &&
    value !== "*"
  );
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isGitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function hasExactKeys(value, fields) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
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
      if (value[key] === undefined) throw new TypeError("undefined_not_supported");
      return `${JSON.stringify(key)}:${canonicalJson(value[key])}`;
    })
    .join(",")}}`;
}

function hashWithDomain(domain, value) {
  return sha256(
    Buffer.concat([
      Buffer.from(domain, "utf8"),
      Buffer.from(canonicalJson(value), "utf8"),
    ]),
  );
}

function decodeCanonicalBase64(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    return null;
  }
  const decoded = Buffer.from(value, "base64");
  return decoded.toString("base64") === value ? decoded : null;
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const completed = status === "cutover_execution_completed";
  const manualReview = status === "consumed_failed_manual_review";
  return {
    ok: completed,
    status,
    contractVersion: EXECUTION_SUMMARY_CONTRACT_VERSION,
    claimAcquired: fields.claimAcquired === true,
    receiptConsumed: completed || manualReview,
    targetsCreated: completed && fields.targetsCreated === true,
    selectorUpdated:
      (completed || manualReview) && fields.selectorUpdated === true,
    postWriteVerified: completed && fields.postWriteVerified === true,
    executionStage:
      completed || manualReview ? fields.executionStage || "" : "",
    parentDirectoryDurability:
      completed || manualReview
        ? fields.parentDirectoryDurability || ""
        : "",
    productionClaimEligible: false,
    claimId: completed || manualReview ? fields.claimId || "" : "",
    claimHash: completed || manualReview ? fields.claimHash || "" : "",
    invocationReceiptId:
      completed || manualReview ? fields.invocationReceiptId || "" : "",
    invocationReceiptHash:
      completed || manualReview ? fields.invocationReceiptHash || "" : "",
    postWriteReceipt:
      completed && isRecord(fields.postWriteReceipt)
        ? structuredClone(fields.postWriteReceipt)
        : {},
    targetFileCount: completed ? 2 : 0,
    actualWriteCount:
      completed || manualReview
        ? Number.isInteger(fields.actualWriteCount)
          ? fields.actualWriteCount
          : 0
        : 0,
    actualDeleteCount: 0,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: uniqueSorted(warnings),
  };
}

function deriveClaimId(receipt) {
  return `metrics-cutover-receipt-claim-${hashWithDomain(CLAIM_ID_DOMAIN, {
    invocationReceiptId: receipt.receiptId,
    invocationReceiptHash: receipt.receiptHash,
  })}`;
}

function buildClaim(
  receipt,
  claimStatus,
  failureCode = "",
  progress = {},
) {
  const value = {
    contractVersion: CLAIM_CONTRACT_VERSION,
    claimId: deriveClaimId(receipt),
    invocationReceiptId: receipt.receiptId,
    invocationReceiptHash: receipt.receiptHash,
    claimStatus,
    failureCode,
    executionStage: progress.executionStage || "claim_acquired",
    actualWriteCount: Number.isInteger(progress.actualWriteCount)
      ? progress.actualWriteCount
      : 0,
    selectorUpdated: progress.selectorUpdated === true,
    parentDirectoryDurability:
      progress.parentDirectoryDurability || "pending",
    productionClaimEligible: false,
    claimHash: "0".repeat(64),
  };
  const payload = { ...value };
  delete payload.claimHash;
  value.claimHash = hashWithDomain(CLAIM_HASH_DOMAIN, payload);
  return value;
}

function validateClaim(value) {
  const issues = [];
  if (!hasExactKeys(value, CLAIM_FIELDS)) return ["claim_fields_invalid"];
  if (value.contractVersion !== CLAIM_CONTRACT_VERSION) {
    issues.push("claim_contract_mismatch");
  }
  if (
    typeof value.claimId !== "string" ||
    !/^metrics-cutover-receipt-claim-[a-f0-9]{64}$/.test(value.claimId)
  ) {
    issues.push("claim_id_invalid");
  } else if (
    value.claimId !==
    deriveClaimId({
      receiptId: value.invocationReceiptId,
      receiptHash: value.invocationReceiptHash,
    })
  ) {
    issues.push("claim_id_mismatch");
  }
  if (!isSafeIdentity(value.invocationReceiptId)) {
    issues.push("claim_invocation_receipt_id_invalid");
  }
  if (!isSha256(value.invocationReceiptHash)) {
    issues.push("claim_invocation_receipt_hash_invalid");
  }
  if (
    ![
      "claim_in_progress",
      "consumed_success",
      "consumed_failed_manual_review",
    ].includes(value.claimStatus)
  ) {
    issues.push("claim_status_invalid");
  }
  if (typeof value.failureCode !== "string" || /[\0\r\n]/.test(value.failureCode)) {
    issues.push("claim_failure_code_invalid");
  }
  if (!EXECUTION_STAGES.includes(value.executionStage)) {
    issues.push("claim_execution_stage_invalid");
  }
  if (
    !Number.isInteger(value.actualWriteCount) ||
    value.actualWriteCount < 0 ||
    value.actualWriteCount > 2
  ) {
    issues.push("claim_actual_write_count_invalid");
  }
  if (typeof value.selectorUpdated !== "boolean") {
    issues.push("claim_selector_updated_invalid");
  }
  if (!CLAIM_DURABILITY_STATES.includes(value.parentDirectoryDurability)) {
    issues.push("claim_parent_directory_durability_invalid");
  }
  if (value.productionClaimEligible !== false) {
    issues.push("claim_production_eligibility_invalid");
  }
  const payload = { ...value };
  delete payload.claimHash;
  if (value.claimHash !== hashWithDomain(CLAIM_HASH_DOMAIN, payload)) {
    issues.push("claim_hash_mismatch");
  }
  return uniqueSorted(issues);
}

function targetSummary(target) {
  return {
    role: target.role,
    path: target.path,
    sha256: target.sha256,
    byteSize: target.byteSize,
    rowCount: target.rowCount,
    market: target.market,
    schemaVersion: target.schemaVersion,
    writeMode: target.writeMode,
  };
}

function derivePostWriteReceiptId(value) {
  return `metrics-cutover-post-write-receipt-${hashWithDomain(
    POST_WRITE_RECEIPT_ID_DOMAIN,
    {
      invocationReceiptId: value.invocationReceiptId,
      invocationReceiptHash: value.invocationReceiptHash,
      claimId: value.claimId,
      postWriteVerificationHash: value.postWriteVerificationHash,
    },
  )}`;
}

function buildPostWriteReceipt(bound, claim, postWrite) {
  const value = {
    contractVersion: POST_WRITE_RECEIPT_CONTRACT_VERSION,
    receiptId: "",
    receiptStatus: "consumed_success",
    invocationReceiptId: bound.receipt.receiptId,
    invocationReceiptHash: bound.receipt.receiptHash,
    authorityPackageId: bound.receipt.authorityPackageId,
    authorityPackageHash: bound.receipt.authorityPackageHash,
    repositoryHeadSha: bound.receipt.repositoryHeadSha,
    repositoryTreeSha: bound.receipt.repositoryTreeSha,
    trackedPathsSha256: bound.receipt.trackedPathsSha256,
    targetPathAbsenceEvidenceHash:
      bound.receipt.targetPathAbsenceEvidenceHash,
    executionPackageHash: bound.receipt.executionPackageHash,
    selectorPreimageSha256: bound.receipt.selectorPreimageSha256,
    selectorPostimageSha256: bound.receipt.selectorPostimageSha256,
    targets: bound.targets.map(targetSummary),
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    actualWriteCount: 2,
    actualDeleteCount: 0,
    claimId: claim.claimId,
    claimHash: "",
    claimParentDirectoryDurability:
      claim.parentDirectoryDurability,
    postWriteVerificationHash: postWrite.verificationHash,
    receiptHash: "0".repeat(64),
  };
  const completedClaim = buildClaim(
    bound.receipt,
    "consumed_success",
    "",
    {
      executionStage: "completed",
      actualWriteCount: 2,
      selectorUpdated: true,
      parentDirectoryDurability:
        claim.parentDirectoryDurability,
    },
  );
  value.claimHash = completedClaim.claimHash;
  value.receiptId = derivePostWriteReceiptId(value);
  const payload = { ...value };
  delete payload.receiptHash;
  value.receiptHash = hashWithDomain(POST_WRITE_RECEIPT_HASH_DOMAIN, payload);
  return { receipt: value, completedClaim };
}

function validatePostWriteReceipt(
  value,
  { bound, completedClaim, postWrite } = {},
) {
  const issues = [];
  if (!hasExactKeys(value, POST_WRITE_RECEIPT_FIELDS)) {
    return ["post_write_receipt_fields_invalid"];
  }
  if (value.contractVersion !== POST_WRITE_RECEIPT_CONTRACT_VERSION) {
    issues.push("post_write_receipt_contract_mismatch");
  }
  if (value.receiptStatus !== "consumed_success") {
    issues.push("post_write_receipt_status_invalid");
  }
  if (
    typeof value.receiptId !== "string" ||
    !/^metrics-cutover-post-write-receipt-[a-f0-9]{64}$/.test(value.receiptId)
  ) {
    issues.push("post_write_receipt_id_invalid");
  } else if (value.receiptId !== derivePostWriteReceiptId(value)) {
    issues.push("post_write_receipt_id_mismatch");
  }
  for (const field of [
    "invocationReceiptHash",
    "authorityPackageHash",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
    "claimHash",
    "postWriteVerificationHash",
    "receiptHash",
  ]) {
    if (!isSha256(value[field])) issues.push(`post_write_receipt_hash_invalid:${field}`);
  }
  if (!CLAIM_DURABILITY_STATES.includes(value.claimParentDirectoryDurability)) {
    issues.push("post_write_receipt_claim_durability_invalid");
  }
  if (!/^metrics-cutover-execution-invocation-receipt-[a-f0-9]{64}$/.test(value.invocationReceiptId)) {
    issues.push("post_write_receipt_identity_invalid:invocationReceiptId");
  }
  if (!/^metrics-cutover-authority-package-[a-f0-9]{64}$/.test(value.authorityPackageId)) {
    issues.push("post_write_receipt_identity_invalid:authorityPackageId");
  }
  if (!/^metrics-cutover-receipt-claim-[a-f0-9]{64}$/.test(value.claimId)) {
    issues.push("post_write_receipt_identity_invalid:claimId");
  }
  if (!Array.isArray(value.targets) || value.targets.length !== 2) {
    issues.push("post_write_receipt_target_count_invalid");
  } else {
    const expectedTargets = [
      { role: "us_price_metrics", market: "US" },
      { role: "kr_price_metrics", market: "KR" },
    ];
    value.targets.forEach((target, index) => {
      const expected = expectedTargets[index];
      if (!hasExactKeys(target, TARGET_SUMMARY_FIELDS)) {
        issues.push(`post_write_receipt_target_fields_invalid:${expected.role}`);
        return;
      }
      if (target.role !== expected.role || target.market !== expected.market) {
        issues.push(`post_write_receipt_target_identity_invalid:${expected.role}`);
      }
      if (
        !isNonEmptyString(target.path) ||
        !target.path.startsWith("src/data/tickers/") ||
        !target.path.endsWith(".csv") ||
        target.path.includes("\\") ||
        target.path.split("/").includes("..")
      ) {
        issues.push(`post_write_receipt_target_path_invalid:${expected.role}`);
      }
      if (!isSha256(target.sha256)) {
        issues.push(`post_write_receipt_target_hash_invalid:${expected.role}`);
      }
      if (!Number.isInteger(target.byteSize) || target.byteSize <= 0) {
        issues.push(`post_write_receipt_target_size_invalid:${expected.role}`);
      }
      if (!Number.isInteger(target.rowCount) || target.rowCount <= 0) {
        issues.push(`post_write_receipt_target_rows_invalid:${expected.role}`);
      }
      if (
        target.schemaVersion !== TARGET_SCHEMA_VERSION ||
        target.writeMode !== "create_only"
      ) {
        issues.push(`post_write_receipt_target_policy_invalid:${expected.role}`);
      }
    });
    if (!areMetricsTargetPathsDistinct(value.targets[0]?.path, value.targets[1]?.path)) {
      issues.push("post_write_receipt_target_paths_not_distinct");
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) issues.push(`post_write_receipt_git_sha_invalid:${field}`);
  }
  if (value.plannedWriteCount !== 2 || value.actualWriteCount !== 2) {
    issues.push("post_write_receipt_write_count_invalid");
  }
  if (value.plannedDeleteCount !== 0 || value.actualDeleteCount !== 0) {
    issues.push("post_write_receipt_delete_count_invalid");
  }
  const payload = { ...value };
  delete payload.receiptHash;
  if (value.receiptHash !== hashWithDomain(POST_WRITE_RECEIPT_HASH_DOMAIN, payload)) {
    issues.push("post_write_receipt_hash_mismatch");
  }
  const expectedClaim = buildClaim(
    {
      receiptId: value.invocationReceiptId,
      receiptHash: value.invocationReceiptHash,
    },
    "consumed_success",
    "",
    {
      executionStage: "completed",
      actualWriteCount: 2,
      selectorUpdated: true,
      parentDirectoryDurability:
        value.claimParentDirectoryDurability,
    },
  );
  if (value.claimId !== expectedClaim.claimId) {
    issues.push("post_write_receipt_claim_id_mismatch");
  }
  if (value.claimHash !== expectedClaim.claimHash) {
    issues.push("post_write_receipt_claim_hash_mismatch");
  }
  if (bound) {
    const expected = {
      invocationReceiptId: bound.receipt?.receiptId,
      invocationReceiptHash: bound.receipt?.receiptHash,
      authorityPackageId: bound.receipt?.authorityPackageId,
      authorityPackageHash: bound.receipt?.authorityPackageHash,
      repositoryHeadSha: bound.receipt?.repositoryHeadSha,
      repositoryTreeSha: bound.receipt?.repositoryTreeSha,
      trackedPathsSha256: bound.receipt?.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        bound.receipt?.targetPathAbsenceEvidenceHash,
      executionPackageHash: bound.receipt?.executionPackageHash,
      selectorPreimageSha256: bound.receipt?.selectorPreimageSha256,
      selectorPostimageSha256: bound.receipt?.selectorPostimageSha256,
    };
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (value[field] !== expectedValue) {
        issues.push(`post_write_receipt_binding_mismatch:${field}`);
      }
    }
    try {
      if (
        canonicalJson(value.targets) !==
        canonicalJson(bound.targets.map(targetSummary))
      ) {
        issues.push("post_write_receipt_binding_mismatch:targets");
      }
    } catch {
      issues.push("post_write_receipt_binding_mismatch:targets");
    }
  }
  if (completedClaim) {
    if (value.claimId !== completedClaim.claimId) {
      issues.push("post_write_receipt_binding_mismatch:claimId");
    }
    if (value.claimHash !== completedClaim.claimHash) {
      issues.push("post_write_receipt_binding_mismatch:claimHash");
    }
  }
  if (
    postWrite &&
    value.postWriteVerificationHash !== postWrite.verificationHash
  ) {
    issues.push(
      "post_write_receipt_binding_mismatch:postWriteVerificationHash",
    );
  }
  return uniqueSorted(issues);
}

module.exports = {
  CLAIM_CONTRACT_VERSION,
  CLAIM_DURABILITY_STATES,
  EXECUTION_SUMMARY_CONTRACT_VERSION,
  EXECUTION_STAGES,
  FIXED_FALSE_FIELDS,
  POST_WRITE_RECEIPT_CONTRACT_VERSION,
  POST_WRITE_RECEIPT_HASH_DOMAIN,
  POST_WRITE_VERIFICATION_CONTRACT_VERSION,
  POST_WRITE_VERIFICATION_HASH_DOMAIN,
  TEST_FIXTURE_CONTRACT_VERSION,
  buildClaim,
  buildPostWriteReceipt,
  canonicalJson,
  decodeCanonicalBase64,
  deriveClaimId,
  derivePostWriteReceiptId,
  hasExactKeys,
  hashWithDomain,
  isGitSha,
  isNonEmptyString,
  isRecord,
  isSafeIdentity,
  isSha256,
  safeResult,
  sha256,
  targetSummary,
  uniqueSorted,
  validateClaim,
  validatePostWriteReceipt,
};
