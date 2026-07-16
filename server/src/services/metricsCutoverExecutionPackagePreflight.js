import { createHash } from "node:crypto";

import metricsTargetPathIdentity from "../../../scripts/lib/metrics-target-path-identity.cjs";
import {
  METRICS_TARGET_EXPORT_SCHEMA_VERSION,
  METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
  evaluateMetricsFinalApprovalCutoverRehearsal,
  getMetricsCurrentPointerSnapshot,
} from "./metricsFinalApprovalCutoverRehearsal.js";

export const METRICS_CUTOVER_EXECUTION_PACKAGE_CONTRACT_VERSION =
  "metrics-cutover-execution-package-v1-step114-2q";
export const METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION =
  "metrics-selector-exact-diff-v1-step114-2q";
export const METRICS_CUTOVER_EXECUTION_POLICY_CONTRACT_VERSION =
  "metrics-cutover-execution-policy-v1-step114-2q";
export const METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION =
  "metrics-repository-preimage-v1-step114-2q";
export const METRICS_CUTOVER_ROLLBACK_BUNDLE_CONTRACT_VERSION =
  "metrics-cutover-rollback-bundle-v1-step114-2q";
export const METRICS_TARGET_PATH_ABSENCE_EVIDENCE_CONTRACT_VERSION =
  "metrics-cutover-target-path-absence-evidence-v1-step114-2r";

const { areMetricsTargetPathsDistinct } = metricsTargetPathIdentity;

const SELECTOR_PATH = "src/data/tickers/screenerCandidateOverlay.js";
const TRUSTED_CURRENT_POINTER_SNAPSHOT = getMetricsCurrentPointerSnapshot();
export const METRICS_SELECTOR_PROVENANCE_COMMIT_SHA =
  TRUSTED_CURRENT_POINTER_SNAPSHOT.sourceCommit;
const OLD_IMPORTS = Object.freeze([
  {
    role: "us_price_metrics",
    importName: "usPriceMetricsOverlayCsv",
    market: "US",
    source: "./us_price_metrics_overlay_20260528_app_ready.csv?raw",
  },
  {
    role: "kr_price_metrics",
    importName: "krPriceMetricsOverlayCsv",
    market: "KR",
    source: "./kr_price_metrics_overlay_20260528_app_ready.csv?raw",
  },
]);

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
  "automaticRollbackAuthorized",
  "targetDeletionAuthorized",
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() === value && value.length > 0;
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isCommitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function isSafeRepositoryPath(value) {
  return (
    isNonEmptyString(value) &&
    !/[\0\r\n]/.test(value) &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.split("/").includes("..")
  );
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
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
  throw new TypeError("unsupported_canonical_json_value");
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJsonHash(value) {
  return sha256Hex(Buffer.from(stableJsonValue(value), "utf8"));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasExactKeys(value, expectedKeys) {
  if (!isPlainObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

export function canonicalizeMetricsCutoverExecutionPackage(value = {}) {
  if (!isPlainObject(value)) {
    throw new TypeError("execution_package_must_be_object");
  }
  const payload = cloneJson(value);
  delete payload.executionPackageHash;
  return stableJsonValue(payload);
}

export function hashMetricsCutoverExecutionPackage(value = {}) {
  return sha256Hex(
    Buffer.from(canonicalizeMetricsCutoverExecutionPackage(value), "utf8"),
  );
}

export function canonicalizeMetricsTargetPathAbsenceEvidence(value = {}) {
  if (!isPlainObject(value)) {
    throw new TypeError("target_path_absence_evidence_must_be_object");
  }
  const payload = cloneJson(value);
  delete payload.evidenceHash;
  return stableJsonValue(payload);
}

export function hashMetricsTargetPathAbsenceEvidence(value = {}) {
  return sha256Hex(
    Buffer.from(
      canonicalizeMetricsTargetPathAbsenceEvidence(value),
      "utf8",
    ),
  );
}

export function canonicalizeMetricsTrackedPaths(paths = []) {
  if (!Array.isArray(paths)) {
    throw new TypeError("tracked_paths_must_be_array");
  }
  return [...new Set(paths)].sort().join("\0");
}

export function hashMetricsTrackedPaths(paths = []) {
  return sha256Hex(
    Buffer.from(canonicalizeMetricsTrackedPaths(paths), "utf8"),
  );
}

function decodeCanonicalBase64(value, issuePrefix, issues) {
  if (
    !isNonEmptyString(value) ||
    value.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
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

function countOccurrences(value, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while (offset <= value.length) {
    const index = value.indexOf(needle, offset);
    if (index === -1) break;
    count += 1;
    offset = index + needle.length;
  }
  return count;
}

function componentByRole(snapshot, role) {
  return Array.isArray(snapshot?.components)
    ? snapshot.components.find((component) => component?.role === role)
    : null;
}

function basename(path) {
  return typeof path === "string" ? path.split("/").at(-1) || "" : "";
}

function sourceLine(importName, source) {
  return `import ${importName} from "${source}";`;
}

function result(status, fields = {}, blockingIssues = [], warningIssues = []) {
  const packageReady = status === "package_ready";
  return {
    ok: packageReady,
    status,
    contractVersion: METRICS_CUTOVER_EXECUTION_PACKAGE_CONTRACT_VERSION,
    candidatePackageId: fields.candidatePackageId || "",
    candidatePackageHash: fields.candidatePackageHash || "",
    zipPackageSha256: fields.zipPackageSha256 || "",
    cutoverRehearsalEvidenceHash:
      fields.cutoverRehearsalEvidenceHash || "",
    cutoverRehearsalReverified:
      fields.cutoverRehearsalReverified === true,
    selectorProvenanceVerified:
      fields.selectorProvenanceVerified === true,
    repositoryHeadVerified: fields.repositoryHeadVerified === true,
    repositoryTreeVerified: fields.repositoryTreeVerified === true,
    trackedPathsVerified: fields.trackedPathsVerified === true,
    repositoryPreimageVerified:
      fields.repositoryPreimageVerified === true,
    targetPathAbsenceEvidenceVerified:
      fields.targetPathAbsenceEvidenceVerified === true,
    currentSelectorPreimageVerified:
      fields.currentSelectorPreimageVerified === true,
    targetFilesVerified: fields.targetFilesVerified === true,
    proposedSelectorVerified: fields.proposedSelectorVerified === true,
    exactDiffVerified: fields.exactDiffVerified === true,
    rollbackBundleReady: fields.rollbackBundleReady === true,
    executionPackageReady: packageReady,
    executionPackageHash:
      packageReady ? fields.executionPackageHash || "" : "",
    selectorPreimageSha256: fields.selectorPreimageSha256 || "",
    selectorPostimageSha256: fields.selectorPostimageSha256 || "",
    targetFileCount:
      packageReady && Number.isInteger(fields.targetFileCount)
        ? fields.targetFileCount
        : 0,
    plannedWriteCount:
      packageReady && Number.isInteger(fields.plannedWriteCount)
        ? fields.plannedWriteCount
        : 0,
    plannedDeleteCount:
      packageReady && Number.isInteger(fields.plannedDeleteCount)
        ? fields.plannedDeleteCount
        : 0,
    targetFiles: packageReady && Array.isArray(fields.targetFiles)
      ? cloneJson(fields.targetFiles)
      : [],
    exactDiff: packageReady && isPlainObject(fields.exactDiff)
      ? cloneJson(fields.exactDiff)
      : {},
    rollbackBundle: packageReady && isPlainObject(fields.rollbackBundle)
      ? cloneJson(fields.rollbackBundle)
      : {},
    executionPackage: packageReady && isPlainObject(fields.executionPackage)
      ? cloneJson(fields.executionPackage)
      : {},
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
    blockingIssues: uniqueSorted(blockingIssues),
    warningIssues: uniqueSorted(warningIssues),
  };
}

function detectAuthorizationAttempt(source, sourceName, issues) {
  if (!isPlainObject(source)) return;
  for (const field of AUTHORIZATION_FIELDS) {
    if (!Object.hasOwn(source, field) || source[field] === false) continue;
    issues.push(
      source[field] === true
        ? `execution_authorization_forbidden:${sourceName}:${field}`
        : `execution_authorization_malformed:${sourceName}:${field}`,
    );
  }
}

function collectAuthorizationAttempts(input, issues) {
  for (const [sourceName, source] of [
    ["input", input],
    ["repository_preimage", input.repositoryPreimage],
    ["execution_policy", input.executionPolicy],
    ["proposed_selector", input.proposedSelector],
  ]) {
    detectAuthorizationAttempt(source, sourceName, issues);
  }
}

function isIdleInput(input) {
  return (
    !isPlainObject(input.finalApprovalInput) &&
    !isPlainObject(input.repositoryPreimage) &&
    !isPlainObject(input.targetPathAbsenceEvidence) &&
    !isPlainObject(input.executionPolicy) &&
    !isPlainObject(input.proposedSelector) &&
    !Object.hasOwn(input, "cutoverRehearsalReady") &&
    !Object.hasOwn(input, "executionPackageReady")
  );
}

function validateTrustedRepositoryOptions(options, issues) {
  const trusted = {
    selectorProvenanceCommitSha:
      options.expectedSelectorProvenanceCommitSha ??
      METRICS_SELECTOR_PROVENANCE_COMMIT_SHA,
    repositoryHeadSha: options.expectedRepositoryHeadSha,
    repositoryTreeSha: options.expectedRepositoryTreeSha,
    trackedPathsSha256: options.expectedTrackedPathsSha256,
    targetPathAbsenceEvidenceHash:
      options.expectedTargetPathAbsenceEvidenceHash,
    branchName: options.requiredBranchName,
  };
  if (!isCommitSha(trusted.selectorProvenanceCommitSha)) {
    issues.push("trusted_selector_provenance_commit_invalid");
  }
  if (
    trusted.selectorProvenanceCommitSha !==
    METRICS_SELECTOR_PROVENANCE_COMMIT_SHA
  ) {
    issues.push("trusted_selector_provenance_commit_mismatch");
  }
  if (!isCommitSha(trusted.repositoryHeadSha)) {
    issues.push("trusted_repository_head_sha_invalid");
  }
  if (!isCommitSha(trusted.repositoryTreeSha)) {
    issues.push("trusted_repository_tree_sha_invalid");
  }
  if (!isSha256(trusted.trackedPathsSha256)) {
    issues.push("trusted_tracked_paths_sha256_invalid");
  }
  if (!isSha256(trusted.targetPathAbsenceEvidenceHash)) {
    issues.push("trusted_target_path_absence_evidence_hash_invalid");
  }
  if (!isNonEmptyString(trusted.branchName)) {
    issues.push("trusted_required_branch_name_invalid");
  }
  return trusted;
}

function validateExecutionPolicy(policy, trusted, issues) {
  const beforeCount = issues.length;
  if (!isPlainObject(policy)) {
    issues.push("execution_policy_not_object");
    return false;
  }
  if (
    policy.policyVersion !==
    METRICS_CUTOVER_EXECUTION_POLICY_CONTRACT_VERSION
  ) {
    issues.push("execution_policy_version_mismatch");
  }
  if (
    policy.expectedSelectorProvenanceCommitSha !==
      trusted.selectorProvenanceCommitSha ||
    !isCommitSha(policy.expectedSelectorProvenanceCommitSha)
  ) {
    issues.push(
      "execution_policy_expected_selector_provenance_commit_mismatch",
    );
  }
  if (
    policy.expectedRepositoryHeadSha !== trusted.repositoryHeadSha ||
    !isCommitSha(policy.expectedRepositoryHeadSha)
  ) {
    issues.push("execution_policy_expected_repository_head_mismatch");
  }
  if (
    policy.expectedRepositoryTreeSha !== trusted.repositoryTreeSha ||
    !isCommitSha(policy.expectedRepositoryTreeSha)
  ) {
    issues.push("execution_policy_expected_repository_tree_mismatch");
  }
  if (
    policy.expectedTrackedPathsSha256 !== trusted.trackedPathsSha256 ||
    !isSha256(policy.expectedTrackedPathsSha256)
  ) {
    issues.push("execution_policy_expected_tracked_paths_hash_mismatch");
  }
  if (
    policy.expectedTargetPathAbsenceEvidenceHash !==
      trusted.targetPathAbsenceEvidenceHash ||
    !isSha256(policy.expectedTargetPathAbsenceEvidenceHash)
  ) {
    issues.push(
      "execution_policy_expected_target_path_absence_evidence_hash_mismatch",
    );
  }
  if (policy.requiredBranchName !== trusted.branchName) {
    issues.push("execution_policy_required_branch_mismatch");
  }
  for (const field of [
    "requireCleanWorktree",
    "requireCreateOnlyTargets",
    "requireExactTwoSelectorReplacements",
  ]) {
    if (policy[field] !== true) {
      issues.push(`execution_policy_${field}_must_be_true`);
    }
  }
  if (policy.allowTargetDeletionOnRollback !== false) {
    issues.push(
      "execution_policy_allowTargetDeletionOnRollback_must_be_false",
    );
  }
  return issues.length === beforeCount;
}

function validateRepositoryPreimage(
  preimage,
  policy,
  trusted,
  targetPaths,
  issues,
) {
  const beforeCount = issues.length;
  const trustedCurrent = getMetricsCurrentPointerSnapshot();
  if (!isPlainObject(preimage)) {
    issues.push("repository_preimage_not_object");
    return {
      verified: false,
      selectorVerified: false,
      bytes: null,
      text: "",
      trackedPaths: new Set(),
      trackedPathsSha256: "",
      selectorProvenanceVerified: false,
      repositoryHeadVerified: false,
      repositoryTreeVerified: false,
      trackedPathsVerified: false,
      targetPathAbsenceEvidenceHash: "",
    };
  }
  if (
    preimage.contractVersion !==
    METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION
  ) {
    issues.push("repository_preimage_contract_version_mismatch");
  }
  const selectorProvenanceVerified =
    preimage.selectorProvenanceCommitSha ===
      policy?.expectedSelectorProvenanceCommitSha &&
    preimage.selectorProvenanceCommitSha ===
      trusted.selectorProvenanceCommitSha &&
    isCommitSha(preimage.selectorProvenanceCommitSha);
  if (!selectorProvenanceVerified) {
    issues.push("repository_preimage_selector_provenance_commit_mismatch");
  }
  const repositoryHeadVerified =
    preimage.repositoryHeadSha === policy?.expectedRepositoryHeadSha &&
    preimage.repositoryHeadSha === trusted.repositoryHeadSha &&
    isCommitSha(preimage.repositoryHeadSha);
  if (!repositoryHeadVerified) {
    issues.push("repository_preimage_repository_head_mismatch");
  }
  const repositoryTreeVerified =
    preimage.repositoryTreeSha === policy?.expectedRepositoryTreeSha &&
    preimage.repositoryTreeSha === trusted.repositoryTreeSha &&
    isCommitSha(preimage.repositoryTreeSha);
  if (!repositoryTreeVerified) {
    issues.push("repository_preimage_repository_tree_mismatch");
  }
  if (preimage.selectorPath !== SELECTOR_PATH) {
    issues.push("repository_preimage_selector_path_mismatch");
  }
  if (
    preimage.branchName !== policy?.requiredBranchName ||
    preimage.branchName !== trusted.branchName
  ) {
    issues.push("repository_preimage_branch_name_mismatch");
  }
  if (preimage.worktreeClean !== true) {
    issues.push(
      preimage.worktreeClean === false
        ? "repository_preimage_worktree_dirty"
        : "repository_preimage_worktree_clean_malformed",
    );
  }

  const trackedPaths = new Set();
  if (!Array.isArray(preimage.trackedPaths)) {
    issues.push("repository_preimage_tracked_paths_not_array");
  } else {
    for (const path of preimage.trackedPaths) {
      if (!isSafeRepositoryPath(path)) {
        issues.push("repository_preimage_tracked_path_invalid");
      } else if (trackedPaths.has(path)) {
        issues.push(`repository_preimage_tracked_path_duplicate:${path}`);
      } else {
        trackedPaths.add(path);
      }
    }
  }
  const computedTrackedPathsSha256 = hashMetricsTrackedPaths([
    ...trackedPaths,
  ]);
  const trackedPathsVerified =
    isSha256(preimage.trackedPathsSha256) &&
    preimage.trackedPathsSha256 === computedTrackedPathsSha256 &&
    preimage.trackedPathsSha256 ===
      policy?.expectedTrackedPathsSha256 &&
    preimage.trackedPathsSha256 === trusted.trackedPathsSha256;
  if (!isSha256(preimage.trackedPathsSha256)) {
    issues.push("repository_preimage_tracked_paths_sha256_invalid");
  } else if (preimage.trackedPathsSha256 !== computedTrackedPathsSha256) {
    issues.push("repository_preimage_tracked_paths_sha256_mismatch");
  }
  if (
    preimage.trackedPathsSha256 !==
      policy?.expectedTrackedPathsSha256 ||
    preimage.trackedPathsSha256 !== trusted.trackedPathsSha256
  ) {
    issues.push("repository_preimage_tracked_paths_not_trusted_inventory");
  }
  if (!isSha256(preimage.targetPathAbsenceEvidenceHash)) {
    issues.push(
      "repository_preimage_target_path_absence_evidence_hash_invalid",
    );
  } else if (
    preimage.targetPathAbsenceEvidenceHash !==
      policy?.expectedTargetPathAbsenceEvidenceHash ||
    preimage.targetPathAbsenceEvidenceHash !==
      trusted.targetPathAbsenceEvidenceHash
  ) {
    issues.push(
      "repository_preimage_target_path_absence_evidence_hash_mismatch",
    );
  }
  for (const path of [
    trustedCurrent.selector.path,
    ...trustedCurrent.components.map((component) => component.path),
  ]) {
    if (!trackedPaths.has(path)) {
      issues.push(`repository_preimage_required_tracked_path_missing:${path}`);
    }
  }
  for (const path of targetPaths) {
    if (trackedPaths.has(path)) {
      issues.push(`repository_preimage_target_path_already_tracked:${path}`);
    }
  }

  const selectorIssuesBefore = issues.length;
  const bytes = decodeCanonicalBase64(
    preimage.selectorContentBase64,
    "repository_preimage_selector",
    issues,
  );
  const recomputedSha256 = bytes ? sha256Hex(bytes) : "";
  if (!isSha256(preimage.selectorSha256)) {
    issues.push("repository_preimage_selector_sha256_invalid");
  } else if (preimage.selectorSha256 !== recomputedSha256) {
    issues.push("repository_preimage_selector_sha256_mismatch");
  }
  if (
    recomputedSha256 !== trustedCurrent.selector.sha256 ||
    preimage.selectorSha256 !== trustedCurrent.selector.sha256
  ) {
    issues.push("repository_preimage_selector_not_trusted_preimage");
  }

  let text = "";
  if (bytes) {
    text = bytes.toString("utf8");
    if (!Buffer.from(text, "utf8").equals(bytes)) {
      issues.push("repository_preimage_selector_utf8_invalid");
    }
  }
  for (const currentImport of OLD_IMPORTS) {
    const statement = sourceLine(
      currentImport.importName,
      currentImport.source,
    );
    const sourceCount = countOccurrences(text, currentImport.source);
    const statementCount = countOccurrences(text, statement);
    if (sourceCount !== 1) {
      issues.push(
        `repository_preimage_old_import_source_count_invalid:${currentImport.role}:${sourceCount}`,
      );
    }
    if (statementCount !== 1) {
      issues.push(
        `repository_preimage_old_import_statement_count_invalid:${currentImport.role}:${statementCount}`,
      );
    }
  }
  return {
    verified: issues.length === beforeCount,
    selectorVerified: issues.length === selectorIssuesBefore,
    bytes,
    text,
    trackedPaths,
    trackedPathsSha256: computedTrackedPathsSha256,
    selectorProvenanceVerified,
    repositoryHeadVerified,
    repositoryTreeVerified,
    trackedPathsVerified,
    targetPathAbsenceEvidenceHash:
      preimage.targetPathAbsenceEvidenceHash || "",
    sha256: recomputedSha256,
  };
}

function validateTargetPathAbsenceEvidence(
  evidence,
  repositoryPreimage,
  executionPolicy,
  trusted,
  targetExportEvidence,
  issues,
) {
  const beforeCount = issues.length;
  if (!isPlainObject(evidence)) {
    issues.push("target_path_absence_evidence_not_object");
    return { verified: false, evidenceHash: "" };
  }
  if (
    !hasExactKeys(evidence, [
      "contractVersion",
      "repositoryHeadSha",
      "repositoryTreeSha",
      "trackedPathsSha256",
      "branchName",
      "targets",
      "evidenceHash",
    ])
  ) {
    issues.push("target_path_absence_evidence_fields_invalid");
  }
  if (
    evidence.contractVersion !==
    METRICS_TARGET_PATH_ABSENCE_EVIDENCE_CONTRACT_VERSION
  ) {
    issues.push("target_path_absence_evidence_contract_version_mismatch");
  }
  let computedHash = "";
  try {
    computedHash = hashMetricsTargetPathAbsenceEvidence(evidence);
  } catch {
    issues.push("target_path_absence_evidence_canonicalization_failed");
  }
  if (!isSha256(evidence.evidenceHash)) {
    issues.push("target_path_absence_evidence_hash_invalid");
  } else if (evidence.evidenceHash !== computedHash) {
    issues.push("target_path_absence_evidence_hash_mismatch");
  }
  for (const [field, expected] of [
    ["repositoryHeadSha", repositoryPreimage?.repositoryHeadSha],
    ["repositoryTreeSha", repositoryPreimage?.repositoryTreeSha],
    ["trackedPathsSha256", repositoryPreimage?.trackedPathsSha256],
    ["branchName", repositoryPreimage?.branchName],
  ]) {
    if (evidence[field] !== expected) {
      issues.push(`target_path_absence_evidence_${field}_mismatch`);
    }
  }
  if (
    evidence.evidenceHash !==
      repositoryPreimage?.targetPathAbsenceEvidenceHash ||
    evidence.evidenceHash !==
      executionPolicy?.expectedTargetPathAbsenceEvidenceHash ||
    evidence.evidenceHash !== trusted.targetPathAbsenceEvidenceHash
  ) {
    issues.push("target_path_absence_evidence_not_trusted");
  }

  const expectedTargets = [
    {
      role: "us_price_metrics",
      path: targetExportEvidence?.usTarget?.path,
    },
    {
      role: "kr_price_metrics",
      path: targetExportEvidence?.krTarget?.path,
    },
  ];
  if (!Array.isArray(evidence.targets) || evidence.targets.length !== 2) {
    issues.push("target_path_absence_evidence_target_count_invalid");
  } else {
    evidence.targets.forEach((target, index) => {
      const expected = expectedTargets[index];
      if (
        !hasExactKeys(target, [
          "role",
          "path",
          "tracked",
          "absentAtStart",
          "absentAtEnd",
          "symlink",
          "directory",
        ])
      ) {
        issues.push(
          `target_path_absence_evidence_target_fields_invalid:${expected.role}`,
        );
        return;
      }
      if (target.role !== expected.role) {
        issues.push(
          `target_path_absence_evidence_role_mismatch:${expected.role}`,
        );
      }
      if (target.path !== expected.path) {
        issues.push(
          `target_path_absence_evidence_path_mismatch:${expected.role}`,
        );
      }
      for (const [field, expectedValue] of [
        ["tracked", false],
        ["absentAtStart", true],
        ["absentAtEnd", true],
        ["symlink", false],
        ["directory", false],
      ]) {
        if (target[field] !== expectedValue) {
          issues.push(
            `target_path_absence_evidence_${field}_invalid:${expected.role}`,
          );
        }
      }
    });
    if (
      !areMetricsTargetPathsDistinct(
        evidence.targets[0]?.path,
        evidence.targets[1]?.path,
      )
    ) {
      issues.push("target_path_absence_evidence_paths_not_distinct");
    }
  }
  return {
    verified: issues.length === beforeCount,
    evidenceHash: computedHash,
  };
}

function validateTargetFile(
  target,
  expected,
  targetSnapshot,
  trackedPaths,
  issues,
) {
  const beforeCount = issues.length;
  const issuePrefix = `target_file_${expected.role}`;
  if (!isPlainObject(target)) {
    issues.push(`${issuePrefix}_not_object`);
    return null;
  }
  if (target.role !== expected.role) {
    issues.push(`${issuePrefix}_role_mismatch`);
  }
  if (target.importName !== expected.importName) {
    issues.push(`${issuePrefix}_import_name_mismatch`);
  }
  if (target.market !== expected.market) {
    issues.push(`${issuePrefix}_market_mismatch`);
  }
  if (target.schemaVersion !== METRICS_TARGET_EXPORT_SCHEMA_VERSION) {
    issues.push(`${issuePrefix}_schema_version_mismatch`);
  }
  if (
    !isSafeRepositoryPath(target.path) ||
    !target.path.startsWith("src/data/tickers/") ||
    !target.path.endsWith(".csv")
  ) {
    issues.push(`${issuePrefix}_path_invalid`);
  }
  if (trackedPaths.has(target.path)) {
    issues.push(`${issuePrefix}_path_already_tracked`);
  }
  const bytes = decodeCanonicalBase64(
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
  if (!Number.isInteger(target.rowCount) || target.rowCount <= 0) {
    issues.push(`${issuePrefix}_row_count_invalid`);
  }
  const snapshotComponent = componentByRole(targetSnapshot, expected.role);
  if (
    !snapshotComponent ||
    snapshotComponent.path !== target.path ||
    snapshotComponent.sha256 !== recomputedSha256 ||
    snapshotComponent.importName !== expected.importName
  ) {
    issues.push(`${issuePrefix}_pointer_snapshot_mismatch`);
  }
  if (issues.length !== beforeCount || !bytes) return null;
  return {
    role: expected.role,
    path: target.path,
    contentBase64: target.contentBase64,
    sha256: recomputedSha256,
    byteSize: bytes.length,
    rowCount: target.rowCount,
    market: expected.market,
    schemaVersion: target.schemaVersion,
    importName: expected.importName,
    writeMode: "create_only",
  };
}

function buildTargetFiles(finalApprovalInput, trackedPaths, issues) {
  const beforeCount = issues.length;
  const evidence = finalApprovalInput?.targetExportVerificationEvidence;
  if (!isPlainObject(evidence)) {
    issues.push("target_export_verification_evidence_not_object");
    return [];
  }
  if (
    evidence.contractVersion !==
    METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION
  ) {
    issues.push("target_export_verification_evidence_contract_mismatch");
  }
  if (
    !areMetricsTargetPathsDistinct(
      evidence.usTarget?.path,
      evidence.krTarget?.path,
    )
  ) {
    issues.push("target_file_paths_not_distinct");
  }
  const targetSnapshot = finalApprovalInput?.targetPointerSnapshot;
  const targets = [
    validateTargetFile(
      evidence.usTarget,
      OLD_IMPORTS[0],
      targetSnapshot,
      trackedPaths,
      issues,
    ),
    validateTargetFile(
      evidence.krTarget,
      OLD_IMPORTS[1],
      targetSnapshot,
      trackedPaths,
      issues,
    ),
  ].filter(Boolean);
  if (targets.length !== 2) {
    issues.push("target_file_count_not_exactly_two");
  }
  if (issues.length !== beforeCount) return [];
  return targets;
}

function findLine(text, statement) {
  return text.split(/\r\n|\n|\r/).find((line) => line === statement) || "";
}

function buildExactSelectorTransformation(preimageText, targetFiles, issues) {
  const beforeCount = issues.length;
  if (targetFiles.length !== 2) {
    issues.push("selector_transformation_target_file_count_invalid");
    return null;
  }
  let postimageText = preimageText;
  const replacements = [];
  for (const oldImport of OLD_IMPORTS) {
    const target = targetFiles.find((item) => item.role === oldImport.role);
    if (!target) {
      issues.push(`selector_transformation_target_missing:${oldImport.role}`);
      continue;
    }
    const newSource = `./${basename(target.path)}?raw`;
    if (countOccurrences(postimageText, oldImport.source) !== 1) {
      issues.push(
        `selector_transformation_old_source_count_invalid:${oldImport.role}`,
      );
      continue;
    }
    const oldLine = sourceLine(oldImport.importName, oldImport.source);
    const newLine = sourceLine(oldImport.importName, newSource);
    if (findLine(postimageText, oldLine) !== oldLine) {
      issues.push(
        `selector_transformation_old_import_line_mismatch:${oldImport.role}`,
      );
      continue;
    }
    postimageText = postimageText.replace(oldImport.source, newSource);
    if (
      countOccurrences(postimageText, newSource) !== 1 ||
      findLine(postimageText, newLine) !== newLine
    ) {
      issues.push(
        `selector_transformation_new_import_line_mismatch:${oldImport.role}`,
      );
      continue;
    }
    replacements.push({
      importName: oldImport.importName,
      oldSource: oldImport.source,
      newSource,
      oldLineHash: sha256Hex(Buffer.from(oldLine, "utf8")),
      newLineHash: sha256Hex(Buffer.from(newLine, "utf8")),
    });
  }
  if (replacements.length !== 2) {
    issues.push("selector_transformation_replacement_count_invalid");
  }
  const postimageBytes = Buffer.from(postimageText, "utf8");
  return issues.length === beforeCount
    ? {
        bytes: postimageBytes,
        text: postimageText,
        sha256: sha256Hex(postimageBytes),
        exactDiff: {
          contractVersion: METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION,
          selectorPath: SELECTOR_PATH,
          preimageSha256: sha256Hex(Buffer.from(preimageText, "utf8")),
          postimageSha256: sha256Hex(postimageBytes),
          replacementCount: 2,
          replacements,
          changedLineCount: 2,
          otherChangesDetected: false,
        },
      }
    : null;
}

export function buildMetricsCutoverProposedSelectorEvidence(
  repositoryPreimage = {},
  targetExportVerificationEvidence = {},
) {
  const issues = [];
  let preimageText = "";
  if (!isPlainObject(repositoryPreimage)) {
    issues.push("proposed_selector_builder_repository_preimage_not_object");
  } else {
    if (
      repositoryPreimage.contractVersion !==
      METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION
    ) {
      issues.push(
        "proposed_selector_builder_repository_preimage_contract_mismatch",
      );
    }
    if (repositoryPreimage.selectorPath !== SELECTOR_PATH) {
      issues.push("proposed_selector_builder_selector_path_mismatch");
    }
    const bytes = decodeCanonicalBase64(
      repositoryPreimage.selectorContentBase64,
      "proposed_selector_builder_selector",
      issues,
    );
    const recomputedSha256 = bytes ? sha256Hex(bytes) : "";
    if (
      !isSha256(repositoryPreimage.selectorSha256) ||
      repositoryPreimage.selectorSha256 !== recomputedSha256
    ) {
      issues.push("proposed_selector_builder_selector_sha256_mismatch");
    }
    if (
      recomputedSha256 !== TRUSTED_CURRENT_POINTER_SNAPSHOT.selector.sha256
    ) {
      issues.push("proposed_selector_builder_selector_not_trusted");
    }
    if (bytes) {
      preimageText = bytes.toString("utf8");
      if (!Buffer.from(preimageText, "utf8").equals(bytes)) {
        issues.push("proposed_selector_builder_selector_utf8_invalid");
      }
    }
  }

  const usPath = targetExportVerificationEvidence?.usTarget?.path;
  const krPath = targetExportVerificationEvidence?.krTarget?.path;
  for (const [role, targetPath] of [
    ["us_price_metrics", usPath],
    ["kr_price_metrics", krPath],
  ]) {
    if (
      !isSafeRepositoryPath(targetPath) ||
      !targetPath.startsWith("src/data/tickers/") ||
      !targetPath.endsWith(".csv")
    ) {
      issues.push(`proposed_selector_builder_target_path_invalid:${role}`);
    }
  }
  if (!areMetricsTargetPathsDistinct(usPath, krPath)) {
    issues.push("proposed_selector_builder_target_paths_not_distinct");
  }

  const transformation =
    issues.length === 0
      ? buildExactSelectorTransformation(
          preimageText,
          [
            { role: "us_price_metrics", path: usPath },
            { role: "kr_price_metrics", path: krPath },
          ],
          issues,
        )
      : null;
  const ready = issues.length === 0 && transformation;
  return {
    ok: Boolean(ready),
    status: ready ? "ready" : "blocked",
    contractVersion: METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION,
    selectorPath: SELECTOR_PATH,
    selectorContentBase64: ready
      ? transformation.bytes.toString("base64")
      : "",
    selectorSha256: ready ? transformation.sha256 : "",
    blockingIssues: uniqueSorted(issues),
    warningIssues: [],
  };
}

function validateProposedSelector(
  proposedSelector,
  expectedTransformation,
  issues,
) {
  const beforeCount = issues.length;
  if (!isPlainObject(proposedSelector)) {
    issues.push("proposed_selector_not_object");
    return false;
  }
  if (
    proposedSelector.contractVersion !==
    METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION
  ) {
    issues.push("proposed_selector_contract_version_mismatch");
  }
  if (proposedSelector.selectorPath !== SELECTOR_PATH) {
    issues.push("proposed_selector_path_mismatch");
  }
  const bytes = decodeCanonicalBase64(
    proposedSelector.selectorContentBase64,
    "proposed_selector",
    issues,
  );
  const recomputedSha256 = bytes ? sha256Hex(bytes) : "";
  if (!isSha256(proposedSelector.selectorSha256)) {
    issues.push("proposed_selector_sha256_invalid");
  } else if (proposedSelector.selectorSha256 !== recomputedSha256) {
    issues.push("proposed_selector_sha256_mismatch");
  }
  if (
    bytes &&
    expectedTransformation &&
    !bytes.equals(expectedTransformation.bytes)
  ) {
    issues.push("proposed_selector_content_not_exact_internal_postimage");
  }
  if (
    expectedTransformation &&
    proposedSelector.selectorSha256 !== expectedTransformation.sha256
  ) {
    issues.push("proposed_selector_hash_not_exact_internal_postimage");
  }
  return issues.length === beforeCount;
}

function buildRollbackBundle(
  repositoryPreimage,
  selectorPreimageSha256,
  selectorPostimageSha256,
  currentPointerIdentityHash,
) {
  return {
    contractVersion: METRICS_CUTOVER_ROLLBACK_BUNDLE_CONTRACT_VERSION,
    selectorPath: SELECTOR_PATH,
    rollbackSelectorContentBase64: repositoryPreimage.selectorContentBase64,
    rollbackSelectorSha256: selectorPreimageSha256,
    expectedPostCutoverSelectorSha256: selectorPostimageSha256,
    restoresCurrentPointerIdentityHash: currentPointerIdentityHash,
    rollbackFileDeletes: [],
  };
}

export function evaluateMetricsCutoverExecutionPackagePreflight(
  input = {},
  options = {},
) {
  if (!isPlainObject(input)) {
    return result("blocked", {}, ["cutover_execution_input_not_object"]);
  }
  const blockingIssues = [];
  collectAuthorizationAttempts(input, blockingIssues);
  if (Object.hasOwn(input, "cutoverRehearsalReady")) {
    blockingIssues.push("caller_cutover_rehearsal_ready_not_trusted");
  }
  if (Object.hasOwn(input, "executionPackageReady")) {
    blockingIssues.push("caller_execution_package_ready_not_trusted");
  }
  if (isIdleInput(input)) {
    if (blockingIssues.length > 0) {
      return result("blocked", {}, blockingIssues);
    }
    return result("idle", {}, [
      "cutover_execution_package_preflight_input_missing",
    ]);
  }

  const trustedRepositoryIssues = [];
  const trustedRepository = validateTrustedRepositoryOptions(
    isPlainObject(options) ? options : {},
    trustedRepositoryIssues,
  );
  blockingIssues.push(...trustedRepositoryIssues);
  const policyIssues = [];
  const executionPolicyVerified = validateExecutionPolicy(
    input.executionPolicy,
    trustedRepository,
    policyIssues,
  );
  blockingIssues.push(...policyIssues);

  const finalApprovalResult = evaluateMetricsFinalApprovalCutoverRehearsal(
    input.finalApprovalInput ?? {},
    isPlainObject(options.finalApprovalOptions)
      ? options.finalApprovalOptions
      : {},
  );
  const cutoverRehearsalEvidenceHash = stableJsonHash(finalApprovalResult);
  let cutoverRehearsalReverified = true;
  for (const [field, expected] of Object.entries({
    status: "ready",
    ok: true,
    cutoverRehearsalReady: true,
    productionPublishReady: false,
    appExportActivated: false,
    pointerMutationAuthorized: false,
    pointerMutationExecuted: false,
    rollbackExecuted: false,
    loaderActivated: false,
  })) {
    if (finalApprovalResult[field] !== expected) {
      blockingIssues.push(`step114_2p_result_invalid:${field}`);
      cutoverRehearsalReverified = false;
    }
  }

  const targetEvidence =
    input.finalApprovalInput?.targetExportVerificationEvidence;
  const targetPaths = [
    targetEvidence?.usTarget?.path,
    targetEvidence?.krTarget?.path,
  ].filter((path) => typeof path === "string");
  const repositoryVerification = validateRepositoryPreimage(
    input.repositoryPreimage,
    isPlainObject(input.executionPolicy) ? input.executionPolicy : {},
    trustedRepository,
    targetPaths,
    blockingIssues,
  );
  const targetPathAbsenceVerification =
    validateTargetPathAbsenceEvidence(
      input.targetPathAbsenceEvidence,
      input.repositoryPreimage,
      input.executionPolicy,
      trustedRepository,
      targetEvidence,
      blockingIssues,
    );
  const targetFiles = buildTargetFiles(
    input.finalApprovalInput,
    repositoryVerification.trackedPaths,
    blockingIssues,
  );
  const targetFilesVerified = targetFiles.length === 2;

  const transformation = buildExactSelectorTransformation(
    repositoryVerification.text,
    targetFiles,
    blockingIssues,
  );
  const proposedSelectorVerified = validateProposedSelector(
    input.proposedSelector,
    transformation,
    blockingIssues,
  );
  const exactDiffVerified =
    transformation?.exactDiff?.replacementCount === 2 &&
    transformation.exactDiff.changedLineCount === 2 &&
    transformation.exactDiff.otherChangesDetected === false;

  const currentPointerIdentityHash =
    input.finalApprovalInput?.currentPointerSnapshot?.pointerIdentityHash || "";
  const targetPointerIdentityHash =
    input.finalApprovalInput?.targetPointerSnapshot?.pointerIdentityHash || "";
  const rollbackPointerIdentityHash =
    input.finalApprovalInput?.rollbackPointerSnapshot?.pointerIdentityHash || "";
  const rollbackBundle = transformation
    ? buildRollbackBundle(
        input.repositoryPreimage ?? {},
        repositoryVerification.sha256,
        transformation.sha256,
        currentPointerIdentityHash,
      )
    : {};
  const rollbackBundleReady =
    isPlainObject(rollbackBundle) &&
    rollbackBundle.rollbackSelectorContentBase64 ===
      input.repositoryPreimage?.selectorContentBase64 &&
    rollbackBundle.rollbackSelectorSha256 ===
      repositoryVerification.sha256 &&
    Array.isArray(rollbackBundle.rollbackFileDeletes) &&
    rollbackBundle.rollbackFileDeletes.length === 0;
  if (!rollbackBundleReady) {
    blockingIssues.push("rollback_bundle_not_exact_preimage");
  }

  const nonPackageGatesPass =
    uniqueSorted(blockingIssues).length === 0 &&
    cutoverRehearsalReverified &&
    executionPolicyVerified &&
    repositoryVerification.verified &&
    repositoryVerification.selectorVerified &&
    repositoryVerification.selectorProvenanceVerified &&
    repositoryVerification.repositoryHeadVerified &&
    repositoryVerification.repositoryTreeVerified &&
    repositoryVerification.trackedPathsVerified &&
    targetPathAbsenceVerification.verified &&
    targetFilesVerified &&
    proposedSelectorVerified &&
    exactDiffVerified &&
    rollbackBundleReady;
  const packagePayload = nonPackageGatesPass
    ? {
          contractVersion:
            METRICS_CUTOVER_EXECUTION_PACKAGE_CONTRACT_VERSION,
          cutoverRehearsalEvidenceHash,
          candidatePackageId: finalApprovalResult.candidatePackageId || "",
          candidatePackageHash:
            finalApprovalResult.candidatePackageHash || "",
          zipPackageSha256: finalApprovalResult.zipPackageSha256 || "",
          packageIndexFile:
            input.finalApprovalInput?.eligibilityInput?.packageIndex
              ?.selfExcludedIndexFile || "",
          selectorProvenanceCommitSha:
            input.repositoryPreimage?.selectorProvenanceCommitSha || "",
          repositoryHeadSha:
            input.repositoryPreimage?.repositoryHeadSha || "",
          repositoryTreeSha:
            input.repositoryPreimage?.repositoryTreeSha || "",
          trackedPathsSha256:
            repositoryVerification.trackedPathsSha256,
          targetPathAbsenceEvidenceHash:
            targetPathAbsenceVerification.evidenceHash,
          branchName: input.repositoryPreimage?.branchName || "",
          repositoryPreimage: {
            contractVersion:
              METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
            selectorProvenanceCommitSha:
              input.repositoryPreimage?.selectorProvenanceCommitSha || "",
            repositoryHeadSha:
              input.repositoryPreimage?.repositoryHeadSha || "",
            repositoryTreeSha:
              input.repositoryPreimage?.repositoryTreeSha || "",
            selectorPath: SELECTOR_PATH,
            selectorContentBase64:
              input.repositoryPreimage?.selectorContentBase64 || "",
            selectorSha256: repositoryVerification.sha256,
            trackedPaths: [...repositoryVerification.trackedPaths].sort(),
            trackedPathsSha256:
              repositoryVerification.trackedPathsSha256,
            targetPathAbsenceEvidenceHash:
              targetPathAbsenceVerification.evidenceHash,
            worktreeClean: input.repositoryPreimage?.worktreeClean,
            branchName: input.repositoryPreimage?.branchName || "",
          },
          selectorPreimage: {
            contractVersion: METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
            selectorPath: SELECTOR_PATH,
            selectorContentBase64:
              input.repositoryPreimage?.selectorContentBase64 || "",
            selectorSha256: repositoryVerification.sha256,
          },
          targetFiles,
          selectorPostimage: {
            selectorPath: SELECTOR_PATH,
            selectorContentBase64:
              transformation.bytes.toString("base64"),
            selectorSha256: transformation.sha256,
          },
          exactDiff: transformation.exactDiff,
          pointerIdentities: {
            currentPointerIdentityHash,
            targetPointerIdentityHash,
            rollbackPointerIdentityHash,
          },
          rollbackBundle,
          executionPolicy: cloneJson(input.executionPolicy ?? {}),
          plannedWriteCount: 2,
          plannedDeleteCount: 0,
        }
    : null;
  const executionPackage = packagePayload
    ? {
        ...packagePayload,
        executionPackageHash:
          hashMetricsCutoverExecutionPackage(packagePayload),
      }
    : {};
  const executionPackageHash =
    executionPackage.executionPackageHash || "";

  const ready = nonPackageGatesPass && isSha256(executionPackageHash);

  return result(
    ready ? "package_ready" : "blocked",
    {
      candidatePackageId: finalApprovalResult.candidatePackageId,
      candidatePackageHash: finalApprovalResult.candidatePackageHash,
      zipPackageSha256: finalApprovalResult.zipPackageSha256,
      cutoverRehearsalEvidenceHash,
      cutoverRehearsalReverified,
      selectorProvenanceVerified:
        repositoryVerification.selectorProvenanceVerified,
      repositoryHeadVerified:
        repositoryVerification.repositoryHeadVerified,
      repositoryTreeVerified:
        repositoryVerification.repositoryTreeVerified,
      trackedPathsVerified:
        repositoryVerification.trackedPathsVerified,
      repositoryPreimageVerified: repositoryVerification.verified,
      targetPathAbsenceEvidenceVerified:
        targetPathAbsenceVerification.verified,
      currentSelectorPreimageVerified:
        repositoryVerification.selectorVerified,
      targetFilesVerified,
      proposedSelectorVerified,
      exactDiffVerified,
      rollbackBundleReady,
      executionPackageHash,
      selectorPreimageSha256: repositoryVerification.sha256,
      selectorPostimageSha256: transformation?.sha256 || "",
      targetFileCount: targetFiles.length,
      plannedWriteCount: targetFiles.length,
      plannedDeleteCount: 0,
      targetFiles,
      exactDiff: transformation?.exactDiff || {},
      rollbackBundle,
      executionPackage,
    },
    blockingIssues,
  );
}
