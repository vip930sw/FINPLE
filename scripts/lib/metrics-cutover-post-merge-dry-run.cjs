const path = require("node:path");
const { pathToFileURL } = require("node:url");

const {
  parseIsoInstant,
  readMetricsCutoverPostMergeBundle,
} = require("./metrics-cutover-post-merge-dry-run-input.cjs");
const {
  areMetricsTargetPathsDistinct,
} = require("./metrics-target-path-identity.cjs");
const {
  collectMetricsCutoverRepositoryState,
} = require("./metrics-cutover-repository-state-adapter.cjs");

const DRY_RUN_CONTRACT_VERSION =
  "metrics-cutover-post-merge-dry-run-v1-step114-2s";
const SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-post-merge-dry-run-summary-v1-step114-2s";
const TARGET_ABSENCE_CONTRACT_VERSION =
  "metrics-cutover-target-path-absence-evidence-v1-step114-2r";
const AUTHORIZATION_FIELDS = Object.freeze([
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
const SNAPSHOT_EQUALITY_FIELDS = Object.freeze([
  "repositoryHeadSha",
  "repositoryTreeSha",
  "branchName",
  "trackedPathsSha256",
  "selectorSha256",
]);
const PACKAGE_EQUALITY_FIELDS = Object.freeze([
  "executionPackageHash",
  "selectorPreimageSha256",
  "selectorPostimageSha256",
  "cutoverRehearsalEvidenceHash",
  "candidatePackageId",
  "candidatePackageHash",
  "zipPackageSha256",
  "targetFileCount",
  "plannedWriteCount",
  "plannedDeleteCount",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function isSafeTargetPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/[\0\r\n]/.test(value) &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.split("/").includes("..") &&
    value.startsWith("src/data/tickers/") &&
    value.endsWith(".csv")
  );
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const ready = status === "dry_run_ready";
  return {
    ok: ready,
    status,
    contractVersion: DRY_RUN_CONTRACT_VERSION,
    dryRunReady: ready,
    repositoryStateStableAcrossDryRun:
      fields.repositoryStateStableAcrossDryRun === true,
    repositoryHeadSha: fields.repositoryHeadSha || "",
    repositoryTreeSha: fields.repositoryTreeSha || "",
    branchName: fields.branchName || "",
    trackedPathsSha256: fields.trackedPathsSha256 || "",
    targetPathAbsenceEvidenceHash:
      fields.targetPathAbsenceEvidenceHash || "",
    candidatePackageId: ready ? fields.candidatePackageId || "" : "",
    candidatePackageHash:
      ready ? fields.candidatePackageHash || "" : "",
    zipPackageSha256: ready ? fields.zipPackageSha256 || "" : "",
    cutoverRehearsalEvidenceHash:
      ready ? fields.cutoverRehearsalEvidenceHash || "" : "",
    executionPackageHash:
      ready ? fields.executionPackageHash || "" : "",
    selectorPreimageSha256:
      ready ? fields.selectorPreimageSha256 || "" : "",
    selectorPostimageSha256:
      ready ? fields.selectorPostimageSha256 || "" : "",
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
    targetSummaries:
      ready && Array.isArray(fields.targetSummaries)
        ? fields.targetSummaries.map((target) => ({
            role: target.role,
            path: target.path,
            sha256: target.sha256,
            byteSize: target.byteSize,
            rowCount: target.rowCount,
            market: target.market,
            schemaVersion: target.schemaVersion,
            writeMode: target.writeMode,
          }))
        : [],
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

function checkFixedFalse(value, prefix, issues) {
  for (const field of AUTHORIZATION_FIELDS) {
    if (value?.[field] !== false) {
      issues.push(`${prefix}_fixed_false_output_invalid:${field}`);
    }
  }
}

function validateSnapshot(snapshot, label, bundle, issues) {
  const beforeCount = issues.length;
  if (!isPlainObject(snapshot)) {
    issues.push(`${label}_not_object`);
    return false;
  }
  for (const [field, expected] of Object.entries({
    status: "ready",
    ok: true,
    repositoryStateStable: true,
    worktreeClean: true,
    targetPathsAbsent: true,
  })) {
    if (snapshot[field] !== expected) {
      issues.push(`${label}_invalid:${field}`);
    }
  }
  if (snapshot.repositoryHeadSha !== bundle.expectedRepositoryHeadSha) {
    issues.push(`${label}_repository_head_mismatch`);
  }
  if (snapshot.branchName !== bundle.requiredBranchName) {
    issues.push(`${label}_branch_mismatch`);
  }
  const evidence = snapshot.targetPathAbsenceEvidence;
  if (
    !isPlainObject(evidence) ||
    evidence.contractVersion !== TARGET_ABSENCE_CONTRACT_VERSION ||
    !Array.isArray(evidence.targets) ||
    evidence.targets.length !== 2 ||
    typeof evidence.evidenceHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(evidence.evidenceHash)
  ) {
    issues.push(`${label}_target_absence_evidence_invalid`);
  } else {
    const expectedTargets = [
      {
        role: "us_price_metrics",
        path:
          bundle.finalApprovalInput?.targetExportVerificationEvidence
            ?.usTarget?.path,
      },
      {
        role: "kr_price_metrics",
        path:
          bundle.finalApprovalInput?.targetExportVerificationEvidence
            ?.krTarget?.path,
      },
    ];
    evidence.targets.forEach((target, index) => {
      const expected = expectedTargets[index];
      if (
        !isPlainObject(target) ||
        target.role !== expected.role ||
        target.path !== expected.path ||
        target.tracked !== false ||
        target.absentAtStart !== true ||
        target.absentAtEnd !== true ||
        target.symlink !== false ||
        target.directory !== false
      ) {
        issues.push(
          `${label}_target_absence_record_invalid:${expected.role}`,
        );
      }
    });
  }
  checkFixedFalse(snapshot, label, issues);
  return issues.length === beforeCount;
}

function proposedSelectorFromBuilder(builderResult, label, issues) {
  if (
    !isPlainObject(builderResult) ||
    builderResult.status !== "ready" ||
    builderResult.ok !== true ||
    typeof builderResult.contractVersion !== "string" ||
    typeof builderResult.selectorPath !== "string" ||
    typeof builderResult.selectorContentBase64 !== "string" ||
    builderResult.selectorContentBase64.length === 0 ||
    typeof builderResult.selectorSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(builderResult.selectorSha256)
  ) {
    issues.push(`${label}_proposed_selector_builder_blocked`);
    return null;
  }
  return {
    contractVersion: builderResult.contractVersion,
    selectorPath: builderResult.selectorPath,
    selectorContentBase64: builderResult.selectorContentBase64,
    selectorSha256: builderResult.selectorSha256,
  };
}

function validatePackage(packageResult, label, issues) {
  const beforeCount = issues.length;
  if (!isPlainObject(packageResult)) {
    issues.push(`${label}_not_object`);
    return false;
  }
  for (const [field, expected] of Object.entries({
    status: "package_ready",
    ok: true,
    executionPackageReady: true,
  })) {
    if (packageResult[field] !== expected) {
      issues.push(`${label}_invalid:${field}`);
    }
  }
  if (
    typeof packageResult.executionPackageHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(packageResult.executionPackageHash)
  ) {
    issues.push(`${label}_execution_package_hash_invalid`);
  }
  checkFixedFalse(packageResult, label, issues);
  return issues.length === beforeCount;
}

function compareSnapshots(left, right, issues) {
  for (const field of SNAPSHOT_EQUALITY_FIELDS) {
    if (left?.[field] !== right?.[field]) {
      issues.push(`repository_snapshot_changed:${field}`);
    }
  }
  for (const field of [
    "selectorContentBase64",
    "selectorSha256",
    "trackedPathsSha256",
  ]) {
    if (left?.repositoryPreimage?.[field] !== right?.repositoryPreimage?.[field]) {
      issues.push(`repository_snapshot_preimage_changed:${field}`);
    }
  }
  if (
    left?.targetPathAbsenceEvidence?.evidenceHash !==
    right?.targetPathAbsenceEvidence?.evidenceHash
  ) {
    issues.push("repository_snapshot_target_absence_evidence_changed");
  }
}

function comparePackages(left, right, issues) {
  for (const field of PACKAGE_EQUALITY_FIELDS) {
    if (left?.[field] !== right?.[field]) {
      issues.push(`execution_package_changed:${field}`);
    }
  }
}

async function loadStep114Contracts() {
  const service = await import(
    pathToFileURL(
      path.resolve(
        __dirname,
        "../../server/src/services/metricsCutoverExecutionPackagePreflight.js",
      ),
    ).href
  );
  return {
    buildProposedSelector:
      service.buildMetricsCutoverProposedSelectorEvidence,
    evaluatePackage:
      service.evaluateMetricsCutoverExecutionPackagePreflight,
  };
}

async function runMetricsCutoverPostMergeDryRun(
  input = {},
  adapters = {},
) {
  if (!isPlainObject(input) || (!input.repo && !input.inputPath)) {
    return safeResult("idle", {}, [
      "metrics_cutover_post_merge_dry_run_input_missing",
    ]);
  }
  const issues = [];
  if (
    typeof input.repo !== "string" ||
    input.repo.length === 0 ||
    typeof input.inputPath !== "string" ||
    input.inputPath.length === 0
  ) {
    return safeResult("blocked", {}, [
      "metrics_cutover_post_merge_dry_run_invocation_invalid",
    ]);
  }
  const readBundle =
    adapters.readBundle || readMetricsCutoverPostMergeBundle;
  const bundleResult = await readBundle(input.inputPath);
  if (!bundleResult?.ok || !isPlainObject(bundleResult.bundle)) {
    return safeResult(
      "blocked",
      {},
      bundleResult?.blockingIssues || ["operator_bundle_read_failed"],
    );
  }
  const bundle = bundleResult.bundle;
  const parseInstant = adapters.parseInstant || parseIsoInstant;
  const evaluationInstant = parseInstant(bundle.evaluationNow);
  if (!evaluationInstant) {
    return safeResult("blocked", {}, [
      "operator_bundle_evaluation_now_invalid",
    ]);
  }
  const targetEvidence =
    bundle.finalApprovalInput?.targetExportVerificationEvidence;
  const usTarget = targetEvidence?.usTarget?.path;
  const krTarget = targetEvidence?.krTarget?.path;
  if (
    !isSafeTargetPath(usTarget) ||
    !isSafeTargetPath(krTarget) ||
    !areMetricsTargetPathsDistinct(usTarget, krTarget)
  ) {
    return safeResult("blocked", {}, [
      "operator_bundle_target_paths_invalid",
    ]);
  }

  const contracts = adapters.contracts || (await loadStep114Contracts());
  const collectSnapshot =
    adapters.collectSnapshot || collectMetricsCutoverRepositoryState;
  const buildProposedSelector =
    adapters.buildProposedSelector || contracts.buildProposedSelector;
  const evaluatePackage =
    adapters.evaluatePackage || contracts.evaluatePackage;

  const snapshotA = await collectSnapshot({
    repo: input.repo,
    usTarget,
    krTarget,
  });
  if (!validateSnapshot(snapshotA, "snapshot_a", bundle, issues)) {
    issues.push(...(snapshotA?.blockingIssues || []));
    return safeResult("blocked", {
      repositoryHeadSha: snapshotA?.repositoryHeadSha,
      repositoryTreeSha: snapshotA?.repositoryTreeSha,
      branchName: snapshotA?.branchName,
      trackedPathsSha256: snapshotA?.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        snapshotA?.targetPathAbsenceEvidence?.evidenceHash,
    }, issues);
  }

  const proposedA = proposedSelectorFromBuilder(
    await buildProposedSelector(
      snapshotA.repositoryPreimage,
      targetEvidence,
    ),
    "package_a",
    issues,
  );
  if (!proposedA) {
    return safeResult("blocked", {
      repositoryHeadSha: snapshotA.repositoryHeadSha,
      repositoryTreeSha: snapshotA.repositoryTreeSha,
      branchName: snapshotA.branchName,
      trackedPathsSha256: snapshotA.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        snapshotA.targetPathAbsenceEvidence.evidenceHash,
    }, issues);
  }
  const finalApprovalOptions = {
    ...bundle.finalApprovalOptions,
    now: new Date(evaluationInstant.getTime()),
  };
  const makePackageInput = (snapshot, proposedSelector) => ({
    finalApprovalInput: bundle.finalApprovalInput,
    targetPathAbsenceEvidence:
      snapshot.targetPathAbsenceEvidence,
    repositoryPreimage: snapshot.repositoryPreimage,
    executionPolicy: snapshot.executionPolicy,
    proposedSelector,
  });
  const makePackageOptions = (snapshot) => ({
    ...snapshot.trustedOptions,
    finalApprovalOptions: {
      ...finalApprovalOptions,
      now: new Date(evaluationInstant.getTime()),
    },
  });
  const packageA = await evaluatePackage(
    makePackageInput(snapshotA, proposedA),
    makePackageOptions(snapshotA),
  );
  if (!validatePackage(packageA, "package_a", issues)) {
    issues.push(...(packageA?.blockingIssues || []));
    return safeResult("blocked", {
      repositoryHeadSha: snapshotA.repositoryHeadSha,
      repositoryTreeSha: snapshotA.repositoryTreeSha,
      branchName: snapshotA.branchName,
      trackedPathsSha256: snapshotA.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        snapshotA.targetPathAbsenceEvidence.evidenceHash,
    }, issues);
  }

  const snapshotB = await collectSnapshot({
    repo: input.repo,
    usTarget,
    krTarget,
  });
  validateSnapshot(snapshotB, "snapshot_b", bundle, issues);
  if (issues.length === 0) compareSnapshots(snapshotA, snapshotB, issues);
  if (issues.length > 0) {
    issues.push(...(snapshotB?.blockingIssues || []));
    return safeResult("blocked", {
      repositoryHeadSha: snapshotA.repositoryHeadSha,
      repositoryTreeSha: snapshotA.repositoryTreeSha,
      branchName: snapshotA.branchName,
      trackedPathsSha256: snapshotA.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        snapshotA.targetPathAbsenceEvidence.evidenceHash,
    }, issues);
  }

  const proposedB = proposedSelectorFromBuilder(
    await buildProposedSelector(
      snapshotB.repositoryPreimage,
      targetEvidence,
    ),
    "package_b",
    issues,
  );
  if (!proposedB) {
    return safeResult("blocked", {
      repositoryHeadSha: snapshotA.repositoryHeadSha,
      repositoryTreeSha: snapshotA.repositoryTreeSha,
      branchName: snapshotA.branchName,
      trackedPathsSha256: snapshotA.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        snapshotA.targetPathAbsenceEvidence.evidenceHash,
    }, issues);
  }
  const packageB = await evaluatePackage(
    makePackageInput(snapshotB, proposedB),
    makePackageOptions(snapshotB),
  );
  validatePackage(packageB, "package_b", issues);
  if (issues.length === 0) comparePackages(packageA, packageB, issues);
  if (issues.length > 0) {
    issues.push(...(packageB?.blockingIssues || []));
    return safeResult("blocked", {
      repositoryHeadSha: snapshotA.repositoryHeadSha,
      repositoryTreeSha: snapshotA.repositoryTreeSha,
      branchName: snapshotA.branchName,
      trackedPathsSha256: snapshotA.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        snapshotA.targetPathAbsenceEvidence.evidenceHash,
    }, issues);
  }

  const summary = {
    contractVersion: SUMMARY_CONTRACT_VERSION,
    repositoryHeadSha: snapshotA.repositoryHeadSha,
    repositoryTreeSha: snapshotA.repositoryTreeSha,
    branchName: snapshotA.branchName,
    trackedPathsSha256: snapshotA.trackedPathsSha256,
    targetPathAbsenceEvidenceHash:
      snapshotA.targetPathAbsenceEvidence.evidenceHash,
    executionPackageHash: packageA.executionPackageHash,
  };
  return safeResult("dry_run_ready", {
    repositoryStateStableAcrossDryRun:
      summary.contractVersion === SUMMARY_CONTRACT_VERSION,
    ...summary,
    candidatePackageId: packageA.candidatePackageId,
    candidatePackageHash: packageA.candidatePackageHash,
    zipPackageSha256: packageA.zipPackageSha256,
    cutoverRehearsalEvidenceHash:
      packageA.cutoverRehearsalEvidenceHash,
    selectorPreimageSha256: packageA.selectorPreimageSha256,
    selectorPostimageSha256: packageA.selectorPostimageSha256,
    targetFileCount: packageA.targetFileCount,
    plannedWriteCount: packageA.plannedWriteCount,
    plannedDeleteCount: packageA.plannedDeleteCount,
    targetSummaries: packageA.targetFiles,
  });
}

module.exports = {
  AUTHORIZATION_FIELDS,
  DRY_RUN_CONTRACT_VERSION,
  SUMMARY_CONTRACT_VERSION,
  runMetricsCutoverPostMergeDryRun,
  safeResult,
};
