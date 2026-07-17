const path = require("node:path");
const { pathToFileURL } = require("node:url");

const {
  CLAIM_CONTRACT_VERSION,
  EXECUTION_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  POST_WRITE_RECEIPT_CONTRACT_VERSION,
  POST_WRITE_VERIFICATION_CONTRACT_VERSION,
  TEST_FIXTURE_CONTRACT_VERSION,
  buildClaim,
  buildPostWriteReceipt,
  canonicalJson,
  decodeCanonicalBase64,
  deriveClaimId,
  derivePostWriteReceiptId,
  hasExactKeys,
  isNonEmptyString,
  isRecord,
  isSafeIdentity,
  isSha256,
  safeResult,
  sha256,
  targetSummary,
  validateClaim,
  validatePostWriteReceipt,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const {
  TARGET_FIELDS: TARGET_SUMMARY_FIELDS,
  TARGET_SCHEMA_VERSION,
} = require("./metrics-cutover-execution-approval-request.cjs");
const {
  validateMetricsCutoverTargetSummaries,
} = require("./metrics-cutover-execution-authority-package.cjs");

const EXECUTION_PACKAGE_CONTRACT_VERSION =
  "metrics-cutover-execution-package-v1-step114-2q";
const EXECUTION_TARGET_FIELDS = Object.freeze([
  ...TARGET_SUMMARY_FIELDS,
  "importName",
  "contentBase64",
]);
const EXECUTION_PACKAGE_FIELDS = Object.freeze([
  "contractVersion",
  "cutoverRehearsalEvidenceHash",
  "candidatePackageId",
  "candidatePackageHash",
  "zipPackageSha256",
  "packageIndexFile",
  "selectorProvenanceCommitSha",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "trackedPathsSha256",
  "targetPathAbsenceEvidenceHash",
  "branchName",
  "repositoryPreimage",
  "selectorPreimage",
  "targetFiles",
  "selectorPostimage",
  "exactDiff",
  "pointerIdentities",
  "rollbackBundle",
  "executionPolicy",
  "plannedWriteCount",
  "plannedDeleteCount",
  "executionPackageHash",
]);

function hashExecutionPackage(value) {
  const payload = structuredClone(value);
  delete payload.executionPackageHash;
  return sha256(Buffer.from(canonicalJson(payload), "utf8"));
}
const {
  SELECTOR_PATH,
  TEST_MARKER_FILE,
  areTargetPathsDistinct,
  countCsvDataRows,
  currentTrackedPathsSha256,
  ensureContainedPath,
  invokeFault,
  isSafeTargetPath,
  postWriteVerification,
  replaceClaim,
  replaceSelector,
  validateSelectorTransformation,
  validateTargetCsvBytes,
  validateTestEnvironment,
  verifyCurrentPreimage,
  writeClaimExclusive,
  writeExclusiveAndVerify,
} = require("./metrics-cutover-guarded-executor-filesystem.cjs");

function validateTarget(target, expectedRole, expectedMarket, receiptTarget, issues) {
  if (!isRecord(target)) {
    issues.push(`execution_target_not_object:${expectedRole}`);
    return null;
  }
  if (!hasExactKeys(target, EXECUTION_TARGET_FIELDS)) {
    issues.push(`execution_target_fields_invalid:${expectedRole}`);
  }
  if (target.role !== expectedRole) issues.push(`execution_target_role_mismatch:${expectedRole}`);
  const expectedImportName =
    expectedRole === "us_price_metrics"
      ? "usPriceMetricsOverlayCsv"
      : "krPriceMetricsOverlayCsv";
  if (target.importName !== expectedImportName) {
    issues.push(`execution_target_import_name_mismatch:${expectedRole}`);
  }
  if (target.market !== expectedMarket) issues.push(`execution_target_market_mismatch:${expectedRole}`);
  if (!isSafeTargetPath(target.path)) issues.push(`execution_target_path_invalid:${expectedRole}`);
  if (!isSha256(target.sha256)) issues.push(`execution_target_hash_invalid:${expectedRole}`);
  if (!Number.isInteger(target.byteSize) || target.byteSize <= 0) {
    issues.push(`execution_target_byte_size_invalid:${expectedRole}`);
  }
  if (!Number.isInteger(target.rowCount) || target.rowCount <= 0) {
    issues.push(`execution_target_row_count_invalid:${expectedRole}`);
  }
  if (target.schemaVersion !== TARGET_SCHEMA_VERSION) {
    issues.push(`execution_target_schema_invalid:${expectedRole}`);
  }
  if (target.writeMode !== "create_only") {
    issues.push(`execution_target_write_mode_invalid:${expectedRole}`);
  }
  const bytes = decodeCanonicalBase64(target.contentBase64);
  if (!bytes) {
    issues.push(`execution_target_content_invalid:${expectedRole}`);
    return null;
  }
  if (target.sha256 !== sha256(bytes)) {
    issues.push(`execution_target_content_hash_mismatch:${expectedRole}`);
  }
  if (target.byteSize !== bytes.length) {
    issues.push(`execution_target_content_size_mismatch:${expectedRole}`);
  }
  try {
    if (countCsvDataRows(bytes) !== target.rowCount) {
      issues.push(`execution_target_content_row_count_mismatch:${expectedRole}`);
    }
  } catch {
    issues.push(`execution_target_csv_invalid:${expectedRole}`);
  }
  for (const issue of validateTargetCsvBytes(
    bytes,
    expectedMarket,
    target.rowCount,
  )) {
    issues.push(`execution_target_${issue}:${expectedRole}`);
  }
  try {
    if (canonicalJson(targetSummary(target)) !== canonicalJson(receiptTarget)) {
      issues.push(`execution_target_receipt_mismatch:${expectedRole}`);
    }
  } catch {
    issues.push(`execution_target_receipt_mismatch:${expectedRole}`);
  }
  return { ...target, bytes };
}

function validateExecutionBinding(verification, prepared, issues) {
  if (
    !isRecord(verification) ||
    verification.status !== "execution_invocation_verified" ||
    verification.ok !== true ||
    !isRecord(verification.invocationReceipt)
  ) {
    issues.push("execution_invocation_not_verified");
    return null;
  }
  const receipt = verification.invocationReceipt;
  issues.push(
    ...validateMetricsCutoverTargetSummaries(
      receipt.targets,
      "execution_receipt",
    ),
  );
  for (const [summaryField, receiptField] of [
    ["receiptId", "receiptId"],
    ["receiptHash", "receiptHash"],
    ["executionPackageHash", "executionPackageHash"],
    ["selectorPreimageSha256", "selectorPreimageSha256"],
    ["selectorPostimageSha256", "selectorPostimageSha256"],
  ]) {
    if (
      Object.hasOwn(verification, summaryField) &&
      verification[summaryField] !== receipt[receiptField]
    ) {
      issues.push(`execution_verification_receipt_mismatch:${summaryField}`);
    }
  }
  if (!isRecord(prepared) || prepared.status !== "ready") {
    issues.push("execution_package_preparation_failed");
    return null;
  }
  if (!isRecord(prepared.packageA) || !isRecord(prepared.packageB)) {
    issues.push("execution_package_capture_missing");
    return null;
  }
  if (
    prepared.packageA.executionPackageHash !== receipt.executionPackageHash ||
    prepared.packageB.executionPackageHash !== receipt.executionPackageHash
  ) {
    issues.push("execution_package_summary_receipt_mismatch");
  }
  if (
    prepared.packageA.executionPackageHash !== prepared.packageB.executionPackageHash ||
    canonicalJson(prepared.packageA.executionPackage) !==
      canonicalJson(prepared.packageB.executionPackage)
  ) {
    issues.push("execution_package_a_b_mismatch");
    return null;
  }
  const executionPackage = prepared.packageA.executionPackage;
  if (!isRecord(executionPackage)) {
    issues.push("execution_package_missing");
    return null;
  }
  if (!hasExactKeys(executionPackage, EXECUTION_PACKAGE_FIELDS)) {
    issues.push("execution_package_fields_invalid");
  }
  if (executionPackage.contractVersion !== EXECUTION_PACKAGE_CONTRACT_VERSION) {
    issues.push("execution_package_contract_version_mismatch");
  }
  try {
    if (
      executionPackage.executionPackageHash !==
      hashExecutionPackage(executionPackage)
    ) {
      issues.push("execution_package_hash_mismatch");
    }
  } catch {
    issues.push("execution_package_hash_recomputation_failed");
  }
  for (const field of [
    "executionPackageHash",
    "repositoryHeadSha",
    "repositoryTreeSha",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
  ]) {
    if (executionPackage[field] !== receipt[field]) {
      issues.push(`execution_package_receipt_mismatch:${field}`);
    }
  }
  if (
    executionPackage.repositoryPreimage?.repositoryHeadSha !==
      receipt.repositoryHeadSha ||
    executionPackage.repositoryPreimage?.repositoryTreeSha !==
      receipt.repositoryTreeSha ||
    executionPackage.repositoryPreimage?.trackedPathsSha256 !==
      receipt.trackedPathsSha256 ||
    executionPackage.repositoryPreimage?.targetPathAbsenceEvidenceHash !==
      receipt.targetPathAbsenceEvidenceHash
  ) {
    issues.push("execution_package_repository_preimage_receipt_mismatch");
  }
  const selectorPreimage = executionPackage.selectorPreimage;
  const selectorPostimage = executionPackage.selectorPostimage;
  if (
    !isRecord(selectorPreimage) ||
    selectorPreimage.selectorPath !== SELECTOR_PATH ||
    selectorPreimage.selectorSha256 !== receipt.selectorPreimageSha256
  ) {
    issues.push("selector_preimage_binding_invalid");
  }
  if (
    !isRecord(selectorPostimage) ||
    selectorPostimage.selectorPath !== SELECTOR_PATH ||
    selectorPostimage.selectorSha256 !== receipt.selectorPostimageSha256
  ) {
    issues.push("selector_postimage_binding_invalid");
  }
  if (executionPackage.plannedWriteCount !== 2 || receipt.plannedWriteCount !== 2) {
    issues.push("planned_write_count_invalid");
  }
  if (executionPackage.plannedDeleteCount !== 0 || receipt.plannedDeleteCount !== 0) {
    issues.push("planned_delete_count_invalid");
  }
  const targetFiles = executionPackage.targetFiles;
  if (!Array.isArray(targetFiles) || targetFiles.length !== 2) {
    issues.push("execution_target_count_invalid");
    return null;
  }
  const validatedTargets = [
    validateTarget(
      targetFiles[0],
      "us_price_metrics",
      "US",
      receipt.targets?.[0],
      issues,
    ),
    validateTarget(
      targetFiles[1],
      "kr_price_metrics",
      "KR",
      receipt.targets?.[1],
      issues,
    ),
  ];
  if (
    validatedTargets[0]?.path &&
    !areTargetPathsDistinct(
      validatedTargets[0].path,
      validatedTargets[1]?.path,
    )
  ) {
    issues.push("execution_target_paths_not_distinct");
  }
  const preimageBytes = decodeCanonicalBase64(selectorPreimage?.selectorContentBase64);
  const postimageBytes = decodeCanonicalBase64(selectorPostimage?.selectorContentBase64);
  if (!preimageBytes || sha256(preimageBytes) !== receipt.selectorPreimageSha256) {
    issues.push("selector_preimage_bytes_invalid");
  }
  if (!postimageBytes || sha256(postimageBytes) !== receipt.selectorPostimageSha256) {
    issues.push("selector_postimage_bytes_invalid");
  }
  const bound = {
    receipt,
    executionPackage,
    branchName: executionPackage.branchName,
    targets: validatedTargets,
    preimageBytes,
    postimageBytes,
  };
  validateSelectorTransformation(bound, issues);
  return bound;
}

async function defaultVerifyInvocation(input) {
  const {
    runMetricsCutoverExecutionInvocationVerification,
  } = require("./metrics-cutover-execution-invocation.cjs");
  return runMetricsCutoverExecutionInvocationVerification(input);
}

function defaultValidateInvocationReceipt(receipt) {
  const {
    validateMetricsCutoverExecutionInvocationReceipt,
  } = require("./metrics-cutover-execution-invocation.cjs");
  return validateMetricsCutoverExecutionInvocationReceipt(receipt);
}

async function defaultPrepareExecutionPackage(input) {
  const {
    runMetricsCutoverPostMergeDryRun,
  } = require("./metrics-cutover-post-merge-dry-run.cjs");
  const service = await import(
    pathToFileURL(
      path.resolve(
        __dirname,
        "../../server/src/services/metricsCutoverExecutionPackagePreflight.js",
      ),
    ).href
  );
  const packages = [];
  const evaluatePackage = async (...args) => {
    const value = await service.evaluateMetricsCutoverExecutionPackagePreflight(
      ...args,
    );
    packages.push(value);
    return value;
  };
  const dryRun = await runMetricsCutoverPostMergeDryRun(
    { repo: input.repo, inputPath: input.inputPath },
    {
      buildProposedSelector:
        service.buildMetricsCutoverProposedSelectorEvidence,
      evaluatePackage,
    },
  );
  return {
    status:
      dryRun.status === "dry_run_ready" && packages.length === 2
        ? "ready"
        : "blocked",
    dryRun,
    packageA: packages[0] || {},
    packageB: packages[1] || {},
  };
}

async function runMetricsCutoverGuardedExecutor(input = {}, adapters = {}) {
  if (!isRecord(input) || (!input.repo && !input.inputPath)) {
    return safeResult("idle", {}, ["guarded_executor_input_missing"]);
  }
  const requiredPaths = [
    "repo",
    "claimDirectory",
    "inputPath",
    "responsePath",
    "allowlistPath",
    "invocationPath",
    "invokerAllowlistPath",
  ];
  if (requiredPaths.some((field) => !isNonEmptyString(input[field]))) {
    return safeResult("blocked", {}, ["guarded_executor_invocation_invalid"]);
  }
  const environment = validateTestEnvironment(
    input.repo,
    input.claimDirectory,
    path.resolve(__dirname, "../.."),
  );
  if (!environment.ok) return safeResult("blocked", {}, environment.issues);

  const verifyInvocation = adapters.verifyInvocation || defaultVerifyInvocation;
  const validateInvocationReceipt =
    adapters.validateInvocationReceipt || defaultValidateInvocationReceipt;
  const prepareExecutionPackage =
    adapters.prepareExecutionPackage || defaultPrepareExecutionPackage;

  let verification;
  let prepared;
  try {
    verification = await verifyInvocation({
      repo: environment.repoRoot,
      inputPath: input.inputPath,
      responsePath: input.responsePath,
      allowlistPath: input.allowlistPath,
      invocationPath: input.invocationPath,
      invokerAllowlistPath: input.invokerAllowlistPath,
    });
    prepared = await prepareExecutionPackage({
      repo: environment.repoRoot,
      inputPath: input.inputPath,
    });
  } catch {
    return safeResult("blocked", {}, ["guarded_executor_preparation_failed"]);
  }

  const issues = [];
  const receiptValidation = validateInvocationReceipt(
    verification?.invocationReceipt,
  );
  if (!receiptValidation?.ok) {
    issues.push(
      ...(receiptValidation?.issues || ["invocation_receipt_validation_failed"]),
    );
  }
  const bound = validateExecutionBinding(verification, prepared, issues);
  if (!bound || issues.length > 0) return safeResult("blocked", {}, issues);

  const preclaimIssues = [];
  const selectorPath = verifyCurrentPreimage(
    environment.repoRoot,
    bound,
    preclaimIssues,
  );
  if (!selectorPath || preclaimIssues.length > 0) {
    return safeResult("blocked", {}, preclaimIssues);
  }

  const initialClaim = buildClaim(bound.receipt, "claim_in_progress", "");
  const claimIssues = validateClaim(initialClaim);
  if (claimIssues.length > 0) return safeResult("blocked", {}, claimIssues);
  let claimPath = "";
  try {
    claimPath = writeClaimExclusive(environment.claimRoot, initialClaim);
  } catch (error) {
    return safeResult("blocked", {}, [
      error?.code === "EEXIST"
        ? "receipt_already_claimed"
        : "receipt_claim_acquisition_failed",
    ]);
  }

  const manualReview = (failureCode, extraIssues = []) => {
    const sanitizedFailure = isSafeIdentity(failureCode)
      ? failureCode
      : "execution_failure";
    const failedClaim = buildClaim(
      bound.receipt,
      "consumed_failed_manual_review",
      sanitizedFailure,
    );
    try {
      replaceClaim(claimPath, failedClaim);
    } catch {
      extraIssues.push("failed_claim_persistence_failed");
    }
    return safeResult(
      "consumed_failed_manual_review",
      {
        claimAcquired: true,
        claimId: failedClaim.claimId,
        claimHash: failedClaim.claimHash,
        invocationReceiptId: bound.receipt.receiptId,
        invocationReceiptHash: bound.receipt.receiptHash,
      },
      [sanitizedFailure, ...extraIssues],
    );
  };

  try {
    invokeFault(adapters, "after_claim_acquired", { claimId: initialClaim.claimId });
    const finalPrewriteIssues = [];
    verifyCurrentPreimage(environment.repoRoot, bound, finalPrewriteIssues);
    if (finalPrewriteIssues.length > 0) {
      return manualReview("final_prewrite_recheck_failed", finalPrewriteIssues);
    }

    for (let index = 0; index < bound.targets.length; index += 1) {
      const target = bound.targets[index];
      const targetPath = ensureContainedPath(
        environment.repoRoot,
        target.path,
        `target_${target.role}`,
        finalPrewriteIssues,
      );
      if (!targetPath) {
        return manualReview("target_path_resolution_failed", finalPrewriteIssues);
      }
      invokeFault(adapters, `before_target_${index}_create`, {
        role: target.role,
        path: target.path,
      });
      writeExclusiveAndVerify(environment.repoRoot, targetPath, target);
      invokeFault(adapters, `after_target_${index}_create`, {
        role: target.role,
        path: target.path,
      });
    }

    invokeFault(adapters, "before_selector_preimage_check", {
      selectorPath: SELECTOR_PATH,
    });
    const currentSelector = require("node:fs").readFileSync(selectorPath);
    if (!currentSelector.equals(bound.preimageBytes)) {
      return manualReview("selector_preimage_changed_before_write");
    }
    invokeFault(adapters, "before_selector_write", {
      selectorPath: SELECTOR_PATH,
    });
    replaceSelector(selectorPath, bound.postimageBytes, initialClaim.claimId);
    invokeFault(adapters, "after_selector_write", {
      selectorPath: SELECTOR_PATH,
    });
    invokeFault(adapters, "before_post_write_verification", {});
    const postWrite = postWriteVerification(environment.repoRoot, bound);
    if (!postWrite.ok) {
      return manualReview("post_write_verification_failed", postWrite.issues);
    }
    invokeFault(adapters, "after_post_write_verification", {});

    const { receipt: postWriteReceipt, completedClaim } = buildPostWriteReceipt(
      bound,
      initialClaim,
      postWrite,
    );
    const postWriteReceiptIssues = validatePostWriteReceipt(postWriteReceipt, {
      bound,
      completedClaim,
      postWrite,
    });
    if (postWriteReceiptIssues.length > 0) {
      return manualReview(
        "post_write_receipt_validation_failed",
        postWriteReceiptIssues,
      );
    }
    const completedClaimIssues = validateClaim(completedClaim);
    if (completedClaimIssues.length > 0) {
      return manualReview("completed_claim_validation_failed", completedClaimIssues);
    }
    replaceClaim(claimPath, completedClaim);
    return safeResult(
      "cutover_execution_completed",
      {
        claimAcquired: true,
        targetsCreated: true,
        selectorUpdated: true,
        postWriteVerified: true,
        claimId: completedClaim.claimId,
        claimHash: completedClaim.claimHash,
        invocationReceiptId: bound.receipt.receiptId,
        invocationReceiptHash: bound.receipt.receiptHash,
        postWriteReceipt,
      },
      [],
    );
  } catch (error) {
    const code = isSafeIdentity(error?.message || "")
      ? error.message
      : "guarded_execution_runtime_failure";
    return manualReview(code);
  }
}

module.exports = {
  CLAIM_CONTRACT_VERSION,
  EXECUTION_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  POST_WRITE_RECEIPT_CONTRACT_VERSION,
  POST_WRITE_VERIFICATION_CONTRACT_VERSION,
  SELECTOR_PATH,
  TEST_FIXTURE_CONTRACT_VERSION,
  TEST_MARKER_FILE,
  buildClaim,
  canonicalJson,
  countCsvDataRows,
  currentTrackedPathsSha256,
  deriveClaimId,
  derivePostWriteReceiptId,
  postWriteVerification,
  runMetricsCutoverGuardedExecutor,
  safeResult,
  validateClaim,
  validatePostWriteReceipt,
};
