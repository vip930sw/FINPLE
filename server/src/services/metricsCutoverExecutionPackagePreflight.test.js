import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  sign as signPayload,
} from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
  METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE,
  METRICS_CANDIDATE_APPROVAL_SCOPE,
  canonicalizeApprovalReceiptPayload,
} from "./metricsCandidateApprovalReceipt.js";
import {
  CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
  METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
  METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION,
  evaluateMetricsLoaderActivationEligibility,
} from "./metricsLoaderActivationEligibility.js";
import {
  METRICS_APP_EXPORT_APPROVAL_CONTRACT_VERSION,
  METRICS_APP_EXPORT_APPROVAL_SCOPE,
  METRICS_APP_EXPORT_APPROVER_ROLE,
  METRICS_FINAL_APPROVAL_POLICY_CONTRACT_VERSION,
  METRICS_FINAL_APPROVAL_SIGNATURE_ALGORITHM,
  METRICS_POINTER_SNAPSHOT_CONTRACT_VERSION,
  METRICS_PRODUCTION_PUBLISH_APPROVAL_CONTRACT_VERSION,
  METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE,
  METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE,
  METRICS_TARGET_EXPORT_POLICY_VERSION,
  METRICS_TARGET_EXPORT_SCHEMA_VERSION,
  METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
  canonicalizeMetricsFinalApprovalReceiptPayload,
  getMetricsCurrentPointerSnapshot,
  hashMetricsEligibilityEvidence,
  hashMetricsPointerSnapshot,
} from "./metricsFinalApprovalCutoverRehearsal.js";
import {
  METRICS_CUTOVER_EXECUTION_PACKAGE_CONTRACT_VERSION,
  METRICS_CUTOVER_EXECUTION_POLICY_CONTRACT_VERSION,
  METRICS_CUTOVER_ROLLBACK_BUNDLE_CONTRACT_VERSION,
  METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
  METRICS_SELECTOR_PROVENANCE_COMMIT_SHA,
  METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION,
  METRICS_TARGET_PATH_ABSENCE_EVIDENCE_CONTRACT_VERSION,
  buildMetricsCutoverProposedSelectorEvidence,
  evaluateMetricsCutoverExecutionPackagePreflight,
  hashMetricsCutoverExecutionPackage,
  hashMetricsTargetPathAbsenceEvidence,
  hashMetricsTrackedPaths,
} from "./metricsCutoverExecutionPackagePreflight.js";

const NOW = new Date("2026-07-16T01:00:00.000Z");
const ELIGIBILITY_EVALUATED_AT = "2026-07-16T00:05:00.000Z";
const VERSION = "2026_07_candidate";
const SELECTOR_PATH = "src/data/tickers/screenerCandidateOverlay.js";
const OLD_US_SOURCE =
  "./us_price_metrics_overlay_20260528_app_ready.csv?raw";
const OLD_KR_SOURCE =
  "./kr_price_metrics_overlay_20260528_app_ready.csv?raw";
const OLD_MAIN_BRANCH_POINT =
  "56d1f75f9b71b8694abb0c4e7dcc7a2535b69017";
const FEATURE_HEAD_SHA =
  "3aafc8ad9a2700202bd53d3adc9b40fe2a0d0b28";
const FEATURE_TREE_SHA = "7".repeat(40);
const FEATURE_BRANCH_NAME =
  "codex/step114-2q-exact-cutover-execution-package-preflight";
const SELF_EXCLUSION_REASON =
  "candidatePackageHash and package index identity are self-referential; index hash excludes candidatePackageHash and ZIP member set excludes the index hash from itself.";

function stableJsonValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonValue(item)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJsonValue(value[key])}`)
    .join(",")}}`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableHash(value) {
  return sha256(Buffer.from(stableJsonValue(value), "utf8"));
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildPreflightKeyContext() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    privateKey,
    allowlistEntry: {
      signerKeyId: "finple-step114-2q-preflight-key",
      signerId: "finple-step114-2q-preflight-owner",
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: [METRICS_CANDIDATE_APPROVAL_SCOPE],
      roles: [METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE],
      revoked: false,
    },
  };
}

function baseManifest() {
  return {
    candidatePackageId: "candidate-step114-2q-synthetic",
    candidatePackageHash: "0".repeat(64),
    contractVersion: "production-candidate-package-v1-step114-2m",
    candidatePackageVersion: "candidate-package-v1-step114-2m",
    metricBaseDate: "2026-07-15",
    validationDate: "2026-07-16",
    pipelineVersion: "finple-monthly-metrics-pipeline-v1",
    normalizationVersion: "finple-timeseries-normalization-v1",
    calculationPolicyVersion: "finple-metrics-calculation-policy-v1",
    sourceDeclarationHash: "d".repeat(64),
    submissionManifestHash: "e".repeat(64),
    inputHashes: {},
    outputHashes: {},
    inputRowReconciliation: {},
    marketTickerDateCoverage: {},
    blockingIssueCount: 0,
    warningIssueCount: 0,
    fixturePackageReady: false,
    candidatePackageReady: true,
    productionPublishReady: false,
    appExportApproved: false,
    externalProviderCalls: false,
    sourceKind: "manual_operator_upload",
    sourceName: "synthetic-test-source",
    sourceDeclaration: {
      marketScope: ["US", "KR"],
      timezone: "UTC",
      currencyMode: "source_currency",
      returnBasis: "price_return",
      priceAdjustmentBasis: "split_adjusted",
      redistributionReviewStatus: "approved",
      appUseReviewStatus: "approved",
      fixtureOnly: false,
      testOnly: false,
    },
    candidateReviewRestrictions: [],
  };
}

function baseReadiness(manifest) {
  return {
    candidatePackageId: manifest.candidatePackageId,
    candidatePackageHash: manifest.candidatePackageHash,
    fixturePackageReady: false,
    candidatePackageReady: true,
    productionPublishReady: false,
    appExportApproved: false,
    blockingIssueCount: 0,
    warningIssueCount: 0,
    notProductionApproval: true,
    validationDate: "2026-07-16",
  };
}

function packagePayloads(manifest, readiness) {
  return new Map([
    [`finple_candidate_manifest_${VERSION}.json`, jsonBytes(manifest)],
    [`finple_candidate_readiness_${VERSION}.json`, jsonBytes(readiness)],
    [
      `finple_candidate_normalized_month_end_${VERSION}.csv`,
      Buffer.from(
        "market,ticker,date,close\nUS,AAPL,2026-06-30,200\nKR,005930,2026-06-30,70000\n",
      ),
    ],
    [
      `finple_candidate_monthly_returns_${VERSION}.csv`,
      Buffer.from(
        "market,ticker,date,monthlyReturn\nUS,AAPL,2026-06-30,0.01\nKR,005930,2026-06-30,0.01\n",
      ),
    ],
    [
      `finple_candidate_metrics_output_${VERSION}.csv`,
      Buffer.from(
        "market,ticker,metricBaseDate\nUS,AAPL,2026-07-15\nKR,005930,2026-07-15\n",
      ),
    ],
    [
      `finple_candidate_review_required_${VERSION}.csv`,
      Buffer.from("market,ticker,reviewReason\n"),
    ],
    [
      `finple_candidate_source_audit_${VERSION}.csv`,
      Buffer.from("issueType,severity,blocksCandidate\n"),
    ],
    [
      `finple_candidate_timeseries_audit_${VERSION}.csv`,
      Buffer.from(
        "market,ticker,status\nUS,AAPL,ready\nKR,005930,ready\n",
      ),
    ],
    [
      `finple_candidate_audit_${VERSION}.html`,
      Buffer.from("<!doctype html><p>synthetic audit</p>\n"),
    ],
    [
      `finple_candidate_hash_inventory_${VERSION}.csv`,
      Buffer.from("artifactType,logicalRole,path,sha256\n"),
    ],
  ]);
}

function buildPackage(manifest) {
  const makeReadiness = () => baseReadiness(manifest);
  let readiness = makeReadiness();
  let payloads = packagePayloads(manifest, readiness);
  const buildMembers = () =>
    [...payloads].map(([path, bytes]) => {
      const exclusions = path.endsWith(".json")
        ? ["candidatePackageHash"]
        : [];
      let digest = sha256(bytes);
      if (exclusions.length > 0) {
        const parsed = JSON.parse(bytes.toString("utf8"));
        parsed.candidatePackageHash = "";
        digest = stableHash(parsed);
      }
      return {
        path,
        sha256: digest,
        byteSize: String(bytes.length),
        hashExcludesJsonFields: exclusions,
      };
    });

  let packageIndex = {
    contractVersion: "candidate-final-package-index-v1-step114-2m",
    candidatePackageHash: "",
    hashAlgorithm: "sha256-json-canonical",
    zipMemberHashAlgorithm:
      "sha256-file-or-json-with-explicit-field-exclusion",
    selfExcludedIndexFile: `finple_candidate_package_index_${VERSION}.json`,
    selfExclusionReason: SELF_EXCLUSION_REASON,
    members: buildMembers(),
  };
  manifest.candidatePackageHash = stableHash(
    Object.fromEntries(
      Object.entries(packageIndex).filter(
        ([key]) => key !== "candidatePackageHash",
      ),
    ),
  );
  readiness = makeReadiness();
  payloads = packagePayloads(manifest, readiness);
  packageIndex = { ...packageIndex, members: buildMembers() };
  packageIndex.candidatePackageHash = stableHash(
    Object.fromEntries(
      Object.entries(packageIndex).filter(
        ([key]) => key !== "candidatePackageHash",
      ),
    ),
  );
  assert.equal(packageIndex.candidatePackageHash, manifest.candidatePackageHash);
  return {
    packageIndex,
    packageMembers: [...payloads].map(([path, bytes]) => ({
      path,
      contentBase64: bytes.toString("base64"),
    })),
  };
}

function buildPreflightReceipt(privateKey, manifest) {
  const unsigned = {
    contractVersion: METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: "approval-step114-2q-preflight-001",
    approvalScope: METRICS_CANDIDATE_APPROVAL_SCOPE,
    candidatePackageId: manifest.candidatePackageId,
    candidatePackageHash: manifest.candidatePackageHash,
    zipPackageSha256: "f".repeat(64),
    metricBaseDate: manifest.metricBaseDate,
    pipelineVersion: manifest.pipelineVersion,
    normalizationVersion: manifest.normalizationVersion,
    calculationPolicyVersion: manifest.calculationPolicyVersion,
    sourceDeclarationHash: manifest.sourceDeclarationHash,
    submissionManifestHash: manifest.submissionManifestHash,
    issuedAt: "2026-07-15T23:00:00.000Z",
    expiresAt: "2026-07-17T00:00:00.000Z",
    signerKeyId: "finple-step114-2q-preflight-key",
    signerId: "finple-step114-2q-preflight-owner",
    signatureAlgorithm: "Ed25519",
    attestations: {
      ownerApproved: true,
      sourceUseApproved: true,
      dataQualityApproved: true,
      investmentAdviceNotProvided: true,
      productionActivationNotAuthorized: true,
    },
  };
  return {
    ...unsigned,
    signatureBase64: signPayload(
      null,
      Buffer.from(canonicalizeApprovalReceiptPayload(unsigned), "utf8"),
      privateKey,
    ).toString("base64"),
  };
}

function freshnessPolicy() {
  return {
    policyVersion: METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION,
    maxMetricAgeDays: 7,
    maxReceiptAgeHours: 24,
    requiredPipelineVersion: "finple-monthly-metrics-pipeline-v1",
    requiredNormalizationVersion: "finple-timeseries-normalization-v1",
    requiredCalculationPolicyVersion: "finple-metrics-calculation-policy-v1",
  };
}

function buildEligibilityFixture() {
  const keyContext = buildPreflightKeyContext();
  const candidateManifest = baseManifest();
  const packageContract = buildPackage(candidateManifest);
  const receipt = buildPreflightReceipt(
    keyContext.privateKey,
    candidateManifest,
  );
  return {
    input: {
      candidateManifest,
      receipt,
      zipPackageSha256: receipt.zipPackageSha256,
      packageIndex: packageContract.packageIndex,
      packageMembers: packageContract.packageMembers,
      packageVerification: {
        contractVersion:
          CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
        ok: true,
        issues: [],
        zipPackageSha256: receipt.zipPackageSha256,
        candidatePackageHash: candidateManifest.candidatePackageHash,
        packageIndexFile: packageContract.packageIndex.selfExcludedIndexFile,
      },
      freshnessPolicy: freshnessPolicy(),
    },
    options: {
      now: new Date(ELIGIBILITY_EVALUATED_AT),
      productionAllowlistJson: JSON.stringify([keyContext.allowlistEntry]),
    },
  };
}

function buildFinalSigner({ signerKeyId, signerId, scopes, roles }) {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    privateKey,
    allowlistEntry: {
      signerKeyId,
      signerId,
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: scopes,
      roles,
      revoked: false,
    },
  };
}

function approvalPolicy() {
  return {
    policyVersion: METRICS_FINAL_APPROVAL_POLICY_CONTRACT_VERSION,
    maxApprovalAgeHours: 4,
    maxEligibilityEvidenceAgeHours: 4,
    requireDistinctReceiptIds: true,
    requireDistinctSignerIds: true,
    requireDistinctSignerKeyIds: true,
    requiredProductionScope: METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE,
    requiredAppExportScope: METRICS_APP_EXPORT_APPROVAL_SCOPE,
  };
}

function targetExportCsv(market, ticker) {
  return [
    "market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason",
    `${market},${ticker},10.5,9.5,-20.0,1.0,10.0,${market === "US" ? "SPY" : "^KS11"},ready,synthetic_in_memory,`,
    "",
  ].join("\n");
}

function buildTargetExport({
  role,
  importName,
  path,
  market,
  ticker,
}) {
  const bytes = Buffer.from(targetExportCsv(market, ticker), "utf8");
  return {
    role,
    importName,
    path,
    contentBase64: bytes.toString("base64"),
    sha256: sha256(bytes),
    byteSize: bytes.length,
    rowCount: 1,
    market,
    schemaVersion: METRICS_TARGET_EXPORT_SCHEMA_VERSION,
  };
}

function buildTargetExportEvidence(context, packageIndex) {
  const sourceMember = packageIndex.members.find((member) =>
    member.path.startsWith("finple_candidate_metrics_output_"),
  );
  return {
    contractVersion:
      METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    packageIndexFile: context.packageIndexFile,
    sourceMetricsOutputMember: {
      path: sourceMember.path,
      sha256: sourceMember.sha256,
    },
    exportPolicyVersion: METRICS_TARGET_EXPORT_POLICY_VERSION,
    usTarget: buildTargetExport({
      role: "us_price_metrics",
      importName: "usPriceMetricsOverlayCsv",
      path: "src/data/tickers/us_price_metrics_overlay_step114_2q_candidate.csv",
      market: "US",
      ticker: "AAPL",
    }),
    krTarget: buildTargetExport({
      role: "kr_price_metrics",
      importName: "krPriceMetricsOverlayCsv",
      path: "src/data/tickers/kr_price_metrics_overlay_step114_2q_candidate.csv",
      market: "KR",
      ticker: "005930",
    }),
  };
}

function buildTargetSnapshot(context, targetExportEvidence) {
  const current = getMetricsCurrentPointerSnapshot();
  const components = current.components.map((component) => {
    if (component.role === "us_price_metrics") {
      return {
        role: component.role,
        importName: targetExportEvidence.usTarget.importName,
        path: targetExportEvidence.usTarget.path,
        sha256: targetExportEvidence.usTarget.sha256,
        candidatePackageId: context.candidatePackageId,
        candidatePackageHash: context.candidatePackageHash,
        zipPackageSha256: context.zipPackageSha256,
        packageIndexFile: context.packageIndexFile,
      };
    }
    if (component.role === "kr_price_metrics") {
      return {
        role: component.role,
        importName: targetExportEvidence.krTarget.importName,
        path: targetExportEvidence.krTarget.path,
        sha256: targetExportEvidence.krTarget.sha256,
        candidatePackageId: context.candidatePackageId,
        candidatePackageHash: context.candidatePackageHash,
        zipPackageSha256: context.zipPackageSha256,
        packageIndexFile: context.packageIndexFile,
      };
    }
    return component;
  });
  const snapshot = {
    contractVersion: METRICS_POINTER_SNAPSHOT_CONTRACT_VERSION,
    snapshotKind: "target",
    selector: {
      path: current.selector.path,
      sha256: "1".repeat(64),
    },
    sourceCommit: "1".repeat(40),
    components,
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    packageIndexFile: context.packageIndexFile,
    fixtureOnly: false,
    testOnly: false,
    reviewOnly: false,
  };
  return {
    ...snapshot,
    pointerIdentityHash: hashMetricsPointerSnapshot(snapshot),
  };
}

function buildRollbackSnapshot(current) {
  const snapshot = {
    ...structuredClone(current),
    snapshotKind: "rollback",
  };
  snapshot.pointerIdentityHash = hashMetricsPointerSnapshot(snapshot);
  return snapshot;
}

function signFinalReceipt(
  privateKey,
  { kind, context, receiptId, signerKeyId, signerId },
) {
  const production = kind === "production";
  const unsigned = {
    contractVersion: production
      ? METRICS_PRODUCTION_PUBLISH_APPROVAL_CONTRACT_VERSION
      : METRICS_APP_EXPORT_APPROVAL_CONTRACT_VERSION,
    receiptId,
    approvalScope: production
      ? METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE
      : METRICS_APP_EXPORT_APPROVAL_SCOPE,
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    eligibilityContractVersion:
      METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
    eligibilityEvidenceHash: context.eligibilityEvidenceHash,
    eligibilityEvaluatedAt: context.eligibilityEvaluatedAt,
    packageIndexFile: context.packageIndexFile,
    currentPointerIdentityHash: context.currentPointerIdentityHash,
    targetPointerIdentityHash: context.targetPointerIdentityHash,
    rollbackPointerIdentityHash: context.rollbackPointerIdentityHash,
    issuedAt: "2026-07-16T00:10:00.000Z",
    expiresAt: "2026-07-16T04:00:00.000Z",
    signerKeyId,
    signerId,
    signatureAlgorithm: METRICS_FINAL_APPROVAL_SIGNATURE_ALGORITHM,
    attestations: production
      ? {
          productionPublicationReviewed: true,
          sourceAndLicenseReviewed: true,
          rollbackPlanReviewed: true,
          pointerMutationNotAuthorized: true,
          cutoverExecutionNotAuthorized: true,
        }
      : {
          appExportReviewed: true,
          consumerDisclosureReviewed: true,
          scenarioAndAiBoundaryReviewed: true,
          pointerMutationNotAuthorized: true,
          cutoverExecutionNotAuthorized: true,
        },
  };
  return {
    ...unsigned,
    signatureBase64: signPayload(
      null,
      Buffer.from(
        canonicalizeMetricsFinalApprovalReceiptPayload(unsigned),
        "utf8",
      ),
      privateKey,
    ).toString("base64"),
  };
}

function buildFinalApprovalFixture() {
  const eligibility = buildEligibilityFixture();
  const eligibilityResult = evaluateMetricsLoaderActivationEligibility(
    eligibility.input,
    eligibility.options,
  );
  const eligibilityEvidenceHash =
    hashMetricsEligibilityEvidence(eligibilityResult);
  const manifest = eligibility.input.candidateManifest;
  const context = {
    candidatePackageId: manifest.candidatePackageId,
    candidatePackageHash: manifest.candidatePackageHash,
    zipPackageSha256: eligibility.input.zipPackageSha256,
    packageIndexFile:
      eligibility.input.packageIndex.selfExcludedIndexFile,
    eligibilityEvidenceHash,
    eligibilityEvaluatedAt: ELIGIBILITY_EVALUATED_AT,
  };
  const current = getMetricsCurrentPointerSnapshot();
  const targetExportVerificationEvidence = buildTargetExportEvidence(
    context,
    eligibility.input.packageIndex,
  );
  const target = buildTargetSnapshot(
    context,
    targetExportVerificationEvidence,
  );
  const rollback = buildRollbackSnapshot(current);
  const receiptContext = {
    ...context,
    currentPointerIdentityHash: current.pointerIdentityHash,
    targetPointerIdentityHash: target.pointerIdentityHash,
    rollbackPointerIdentityHash: rollback.pointerIdentityHash,
  };
  const productionSigner = buildFinalSigner({
    signerKeyId: "finple-step114-2q-production-key",
    signerId: "finple-step114-2q-production-signer",
    scopes: [METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE],
    roles: [METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE],
  });
  const appSigner = buildFinalSigner({
    signerKeyId: "finple-step114-2q-app-key",
    signerId: "finple-step114-2q-app-signer",
    scopes: [METRICS_APP_EXPORT_APPROVAL_SCOPE],
    roles: [METRICS_APP_EXPORT_APPROVER_ROLE],
  });
  return {
    input: {
      eligibilityInput: eligibility.input,
      eligibilityEvidenceHash,
      eligibilityEvaluatedAt: ELIGIBILITY_EVALUATED_AT,
      productionApprovalReceipt: signFinalReceipt(
        productionSigner.privateKey,
        {
          kind: "production",
          context: receiptContext,
          receiptId: "final-production-step114-2q-001",
          signerKeyId: productionSigner.allowlistEntry.signerKeyId,
          signerId: productionSigner.allowlistEntry.signerId,
        },
      ),
      appExportApprovalReceipt: signFinalReceipt(appSigner.privateKey, {
        kind: "app",
        context: receiptContext,
        receiptId: "final-app-export-step114-2q-001",
        signerKeyId: appSigner.allowlistEntry.signerKeyId,
        signerId: appSigner.allowlistEntry.signerId,
      }),
      approvalPolicy: approvalPolicy(),
      currentPointerSnapshot: current,
      targetExportVerificationEvidence,
      targetPointerSnapshot: target,
      rollbackPointerSnapshot: rollback,
    },
    options: {
      now: NOW,
      eligibilityOptions: eligibility.options,
      finalApprovalAllowlistJson: JSON.stringify([
        productionSigner.allowlistEntry,
        appSigner.allowlistEntry,
      ]),
    },
  };
}

function selectorBytes() {
  return readFileSync(
    new URL(
      "../../../src/data/tickers/screenerCandidateOverlay.js",
      import.meta.url,
    ),
  );
}

function buildExpectedPostimage(preimageBytes, targetEvidence) {
  const usSource = `./${targetEvidence.usTarget.path.split("/").at(-1)}?raw`;
  const krSource = `./${targetEvidence.krTarget.path.split("/").at(-1)}?raw`;
  return Buffer.from(
    preimageBytes
      .toString("utf8")
      .replace(OLD_US_SOURCE, usSource)
      .replace(OLD_KR_SOURCE, krSource),
    "utf8",
  );
}

function executionPolicy({
  repositoryHeadSha,
  repositoryTreeSha,
  trackedPathsSha256,
  targetPathAbsenceEvidenceHash,
  branchName,
}) {
  return {
    policyVersion: METRICS_CUTOVER_EXECUTION_POLICY_CONTRACT_VERSION,
    expectedSelectorProvenanceCommitSha:
      METRICS_SELECTOR_PROVENANCE_COMMIT_SHA,
    expectedRepositoryHeadSha: repositoryHeadSha,
    expectedRepositoryTreeSha: repositoryTreeSha,
    expectedTrackedPathsSha256: trackedPathsSha256,
    expectedTargetPathAbsenceEvidenceHash:
      targetPathAbsenceEvidenceHash,
    requiredBranchName: branchName,
    requireCleanWorktree: true,
    requireCreateOnlyTargets: true,
    requireExactTwoSelectorReplacements: true,
    allowTargetDeletionOnRollback: false,
  };
}

function buildTargetPathAbsenceEvidence({
  repositoryHeadSha,
  repositoryTreeSha,
  trackedPathsSha256,
  branchName,
  usPath,
  krPath,
}) {
  const payload = {
    contractVersion:
      METRICS_TARGET_PATH_ABSENCE_EVIDENCE_CONTRACT_VERSION,
    repositoryHeadSha,
    repositoryTreeSha,
    trackedPathsSha256,
    branchName,
    targets: [
      {
        role: "us_price_metrics",
        path: usPath,
        tracked: false,
        absentAtStart: true,
        absentAtEnd: true,
        symlink: false,
        directory: false,
      },
      {
        role: "kr_price_metrics",
        path: krPath,
        tracked: false,
        absentAtStart: true,
        absentAtEnd: true,
        symlink: false,
        directory: false,
      },
    ],
  };
  return {
    ...payload,
    evidenceHash: hashMetricsTargetPathAbsenceEvidence(payload),
  };
}

function buildFixture() {
  const finalApproval = buildFinalApprovalFixture();
  const preimageBytes = selectorBytes();
  const current = getMetricsCurrentPointerSnapshot();
  const targetEvidence =
    finalApproval.input.targetExportVerificationEvidence;
  const trackedPaths = [
    current.selector.path,
    ...current.components.map((component) => component.path),
  ];
  const trackedPathsSha256 = hashMetricsTrackedPaths(trackedPaths);
  const targetPathAbsenceEvidence = buildTargetPathAbsenceEvidence({
    repositoryHeadSha: FEATURE_HEAD_SHA,
    repositoryTreeSha: FEATURE_TREE_SHA,
    trackedPathsSha256,
    branchName: FEATURE_BRANCH_NAME,
    usPath: targetEvidence.usTarget.path,
    krPath: targetEvidence.krTarget.path,
  });
  const postimageBytes = buildExpectedPostimage(
    preimageBytes,
    targetEvidence,
  );
  return {
    input: {
      finalApprovalInput: finalApproval.input,
      targetPathAbsenceEvidence,
      repositoryPreimage: {
        contractVersion: METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
        selectorProvenanceCommitSha:
          METRICS_SELECTOR_PROVENANCE_COMMIT_SHA,
        repositoryHeadSha: FEATURE_HEAD_SHA,
        repositoryTreeSha: FEATURE_TREE_SHA,
        selectorPath: SELECTOR_PATH,
        selectorContentBase64: preimageBytes.toString("base64"),
        selectorSha256: sha256(preimageBytes),
        trackedPaths,
        trackedPathsSha256,
        targetPathAbsenceEvidenceHash:
          targetPathAbsenceEvidence.evidenceHash,
        worktreeClean: true,
        branchName: FEATURE_BRANCH_NAME,
      },
      executionPolicy: executionPolicy({
        repositoryHeadSha: FEATURE_HEAD_SHA,
        repositoryTreeSha: FEATURE_TREE_SHA,
        trackedPathsSha256,
        targetPathAbsenceEvidenceHash:
          targetPathAbsenceEvidence.evidenceHash,
        branchName: FEATURE_BRANCH_NAME,
      }),
      proposedSelector: {
        contractVersion: METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION,
        selectorPath: SELECTOR_PATH,
        selectorContentBase64: postimageBytes.toString("base64"),
        selectorSha256: sha256(postimageBytes),
      },
    },
    options: {
      expectedRepositoryHeadSha: FEATURE_HEAD_SHA,
      expectedRepositoryTreeSha: FEATURE_TREE_SHA,
      expectedTrackedPathsSha256: trackedPathsSha256,
      expectedTargetPathAbsenceEvidenceHash:
        targetPathAbsenceEvidence.evidenceHash,
      requiredBranchName: FEATURE_BRANCH_NAME,
      finalApprovalOptions: finalApproval.options,
    },
  };
}

function synchronizeTargetPathAbsenceEvidence(fixture) {
  const targetEvidence =
    fixture.input.finalApprovalInput.targetExportVerificationEvidence;
  const evidence = buildTargetPathAbsenceEvidence({
    repositoryHeadSha:
      fixture.input.repositoryPreimage.repositoryHeadSha,
    repositoryTreeSha:
      fixture.input.repositoryPreimage.repositoryTreeSha,
    trackedPathsSha256:
      fixture.input.repositoryPreimage.trackedPathsSha256,
    branchName: fixture.input.repositoryPreimage.branchName,
    usPath: targetEvidence.usTarget.path,
    krPath: targetEvidence.krTarget.path,
  });
  fixture.input.targetPathAbsenceEvidence = evidence;
  fixture.input.repositoryPreimage.targetPathAbsenceEvidenceHash =
    evidence.evidenceHash;
  fixture.input.executionPolicy.expectedTargetPathAbsenceEvidenceHash =
    evidence.evidenceHash;
  fixture.options.expectedTargetPathAbsenceEvidenceHash =
    evidence.evidenceHash;
}

function setTrustedTargetPathAbsenceEvidence(fixture, evidence) {
  fixture.input.targetPathAbsenceEvidence = evidence;
  fixture.input.repositoryPreimage.targetPathAbsenceEvidenceHash =
    evidence.evidenceHash;
  fixture.input.executionPolicy.expectedTargetPathAbsenceEvidenceHash =
    evidence.evidenceHash;
  fixture.options.expectedTargetPathAbsenceEvidenceHash =
    evidence.evidenceHash;
}

function synchronizeRepositoryState(
  fixture,
  {
    repositoryHeadSha,
    repositoryTreeSha,
    branchName,
    trackedPaths = fixture.input.repositoryPreimage.trackedPaths,
  },
) {
  const trackedPathsSha256 = hashMetricsTrackedPaths(trackedPaths);
  fixture.input.repositoryPreimage.repositoryHeadSha = repositoryHeadSha;
  fixture.input.repositoryPreimage.repositoryTreeSha = repositoryTreeSha;
  fixture.input.repositoryPreimage.branchName = branchName;
  fixture.input.repositoryPreimage.trackedPaths = [...trackedPaths];
  fixture.input.repositoryPreimage.trackedPathsSha256 = trackedPathsSha256;
  fixture.input.executionPolicy.expectedRepositoryHeadSha =
    repositoryHeadSha;
  fixture.input.executionPolicy.expectedRepositoryTreeSha =
    repositoryTreeSha;
  fixture.input.executionPolicy.expectedTrackedPathsSha256 =
    trackedPathsSha256;
  fixture.input.executionPolicy.requiredBranchName = branchName;
  fixture.options.expectedRepositoryHeadSha = repositoryHeadSha;
  fixture.options.expectedRepositoryTreeSha = repositoryTreeSha;
  fixture.options.expectedTrackedPathsSha256 = trackedPathsSha256;
  fixture.options.requiredBranchName = branchName;
  synchronizeTargetPathAbsenceEvidence(fixture);
}

function evaluate(fixture) {
  return evaluateMetricsCutoverExecutionPackagePreflight(
    fixture.input,
    fixture.options,
  );
}

function replaceRepositorySelector(fixture, text, preserveSha256 = false) {
  const bytes = Buffer.from(text, "utf8");
  fixture.input.repositoryPreimage.selectorContentBase64 =
    bytes.toString("base64");
  if (!preserveSha256) {
    fixture.input.repositoryPreimage.selectorSha256 = sha256(bytes);
  }
}

function replaceProposedSelector(fixture, text, preserveSha256 = false) {
  const bytes = Buffer.from(text, "utf8");
  fixture.input.proposedSelector.selectorContentBase64 =
    bytes.toString("base64");
  if (!preserveSha256) {
    fixture.input.proposedSelector.selectorSha256 = sha256(bytes);
  }
}

function assertFixedOutputs(result) {
  assert.equal(result.fileWriteAuthorized, false);
  assert.equal(result.commitAuthorized, false);
  assert.equal(result.pushAuthorized, false);
  assert.equal(result.mergeAuthorized, false);
  assert.equal(result.deploymentAuthorized, false);
  assert.equal(result.productionPublicationAuthorized, false);
  assert.equal(result.appExportActivated, false);
  assert.equal(result.pointerMutationExecuted, false);
  assert.equal(result.rollbackExecuted, false);
  assert.equal(result.loaderActivated, false);
}

function assertNoPackageExposure(result) {
  assert.equal(result.executionPackageHash, "");
  assert.deepEqual(result.executionPackage, {});
  assert.deepEqual(result.targetFiles, []);
  assert.deepEqual(result.exactDiff, {});
  assert.deepEqual(result.rollbackBundle, {});
  assert.equal(result.targetFileCount, 0);
  assert.equal(result.plannedWriteCount, 0);
  assert.equal(result.plannedDeleteCount, 0);
}

test("valid exact execution package returns package_ready only", () => {
  const fixture = buildFixture();
  const result = evaluate(fixture);

  assert.equal(result.status, "package_ready");
  assert.equal(result.ok, true);
  assert.equal(
    result.contractVersion,
    METRICS_CUTOVER_EXECUTION_PACKAGE_CONTRACT_VERSION,
  );
  assert.equal(result.cutoverRehearsalReverified, true);
  assert.equal(result.selectorProvenanceVerified, true);
  assert.equal(result.repositoryHeadVerified, true);
  assert.equal(result.repositoryTreeVerified, true);
  assert.equal(result.trackedPathsVerified, true);
  assert.equal(result.repositoryPreimageVerified, true);
  assert.equal(result.targetPathAbsenceEvidenceVerified, true);
  assert.equal(result.currentSelectorPreimageVerified, true);
  assert.equal(result.targetFilesVerified, true);
  assert.equal(result.proposedSelectorVerified, true);
  assert.equal(result.exactDiffVerified, true);
  assert.equal(result.rollbackBundleReady, true);
  assert.equal(result.executionPackageReady, true);
  assert.match(result.executionPackageHash, /^[a-f0-9]{64}$/);
  assert.equal(result.executionPackage.repositoryPreimage.worktreeClean, true);
  assert.equal(
    result.executionPackage.targetPathAbsenceEvidenceHash,
    fixture.input.targetPathAbsenceEvidence.evidenceHash,
  );
  assert.equal(
    result.executionPackage.repositoryPreimage
      .targetPathAbsenceEvidenceHash,
    fixture.input.targetPathAbsenceEvidence.evidenceHash,
  );
  assert.equal(
    result.executionPackage.repositoryPreimage.repositoryHeadSha,
    FEATURE_HEAD_SHA,
  );
  assert.notEqual(
    result.executionPackage.repositoryPreimage.repositoryHeadSha,
    OLD_MAIN_BRANCH_POINT,
  );
  assert.deepEqual(result.blockingIssues, []);
  assertFixedOutputs(result);
});

test("result is deterministic and input remains immutable", () => {
  const fixture = buildFixture();
  const inputBefore = structuredClone(fixture.input);
  const first = evaluate(fixture);
  const second = evaluate(fixture);

  assert.deepEqual(first, second);
  assert.deepEqual(fixture.input, inputBefore);
});

test("idle result is complete and fail-closed", () => {
  const result = evaluateMetricsCutoverExecutionPackagePreflight({});
  for (const field of [
    "ok",
    "status",
    "contractVersion",
    "candidatePackageId",
    "candidatePackageHash",
    "zipPackageSha256",
    "cutoverRehearsalReverified",
    "selectorProvenanceVerified",
    "repositoryHeadVerified",
    "repositoryTreeVerified",
    "trackedPathsVerified",
    "repositoryPreimageVerified",
    "currentSelectorPreimageVerified",
    "targetFilesVerified",
    "proposedSelectorVerified",
    "exactDiffVerified",
    "rollbackBundleReady",
    "executionPackageReady",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
    "targetFileCount",
    "plannedWriteCount",
    "plannedDeleteCount",
    "blockingIssues",
    "warningIssues",
  ]) {
    assert.equal(Object.hasOwn(result, field), true, field);
  }
  assert.equal(result.status, "idle");
  assert.equal(result.executionPackageReady, false);
  assertNoPackageExposure(result);
  assertFixedOutputs(result);
});

test("Step 114-2P blocked result propagates", () => {
  const fixture = buildFixture();
  fixture.input.finalApprovalInput.eligibilityInput.candidateManifest.externalProviderCalls =
    true;
  const result = evaluate(fixture);

  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /step114_2p_result_invalid/);
  assert.equal(result.cutoverRehearsalReverified, false);
  assertNoPackageExposure(result);
  assertFixedOutputs(result);
});

test("caller readiness shortcuts block", async (t) => {
  for (const field of ["cutoverRehearsalReady", "executionPackageReady"]) {
    await t.test(field, () => {
      const fixture = buildFixture();
      fixture.input[field] = true;
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /caller_.*_not_trusted/);
      assertFixedOutputs(result);
    });
  }
});

test("repository HEAD and branch are dynamically bound and separate from selector provenance", async (t) => {
  await t.test("branch head differs from old main branch-point", () => {
    const fixture = buildFixture();
    assert.notEqual(
      fixture.input.repositoryPreimage.repositoryHeadSha,
      OLD_MAIN_BRANCH_POINT,
    );
    assert.equal(evaluate(fixture).status, "package_ready");
  });
  await t.test("repository head mismatch", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.repositoryHeadSha = "a".repeat(40);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /repository_head_mismatch/);
    assertNoPackageExposure(result);
  });
  await t.test("policy head mismatch", () => {
    const fixture = buildFixture();
    fixture.input.executionPolicy.expectedRepositoryHeadSha =
      "b".repeat(40);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /execution_policy_expected_repository_head_mismatch/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("trusted head mismatch", () => {
    const fixture = buildFixture();
    fixture.options.expectedRepositoryHeadSha = "c".repeat(40);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /execution_policy_expected_repository_head_mismatch|repository_head_mismatch/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("valid dynamic head and branch", () => {
    const fixture = buildFixture();
    synchronizeRepositoryState(fixture, {
      repositoryHeadSha: "d".repeat(40),
      repositoryTreeSha: "e".repeat(40),
      branchName: "release/metrics-cutover-review",
    });
    assert.equal(evaluate(fixture).status, "package_ready");
  });
  await t.test("service remains usable after its own PR is merged", () => {
    const fixture = buildFixture();
    synchronizeRepositoryState(fixture, {
      repositoryHeadSha: "f".repeat(40),
      repositoryTreeSha: "1".repeat(40),
      branchName: "main",
    });
    const result = evaluate(fixture);
    assert.equal(result.status, "package_ready");
    assert.equal(
      result.executionPackage.repositoryPreimage.branchName,
      "main",
    );
  });
});

test("wrong selector provenance and dirty worktree evidence block", async (t) => {
  await t.test("wrong selector provenance", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.selectorProvenanceCommitSha =
      "a".repeat(40);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /selector_provenance_commit_mismatch/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("dirty worktree", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.worktreeClean = false;
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /worktree_dirty/);
    assertNoPackageExposure(result);
  });
});

test("missing, malformed, or permissive execution policy blocks", async (t) => {
  const cases = [
    ["missing policy", (fixture) => delete fixture.input.executionPolicy],
    [
      "wrong policy version",
      (fixture) => {
        fixture.input.executionPolicy.policyVersion = "wrong-policy";
      },
    ],
    [
      "unclean worktree allowed",
      (fixture) => {
        fixture.input.executionPolicy.requireCleanWorktree = false;
      },
    ],
    [
      "overwrite mode allowed",
      (fixture) => {
        fixture.input.executionPolicy.requireCreateOnlyTargets = false;
      },
    ],
    [
      "replacement count relaxed",
      (fixture) => {
        fixture.input.executionPolicy.requireExactTwoSelectorReplacements =
          false;
      },
    ],
    [
      "rollback deletion allowed",
      (fixture) => {
        fixture.input.executionPolicy.allowTargetDeletionOnRollback = true;
      },
    ],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const fixture = buildFixture();
      mutate(fixture);
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /execution_policy/);
      assertFixedOutputs(result);
    });
  }
});

test("caller authorization attempts block without changing fixed outputs", async (t) => {
  for (const value of [true, "true", 1]) {
    await t.test(JSON.stringify(value), () => {
      const fixture = buildFixture();
      fixture.input.fileWriteAuthorized = value;
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join("\n"),
        /execution_authorization_(forbidden|malformed)/,
      );
      assertFixedOutputs(result);
    });
  }
});

test("selector preimage hash mismatch blocks", () => {
  const fixture = buildFixture();
  fixture.input.repositoryPreimage.selectorSha256 = "a".repeat(64);
  const result = evaluate(fixture);

  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /selector_sha256_mismatch/);
});

test("missing or duplicate current price-metrics imports block", async (t) => {
  await t.test("missing old US import", () => {
    const fixture = buildFixture();
    replaceRepositorySelector(
      fixture,
      selectorBytes().toString("utf8").replace(OLD_US_SOURCE, "./missing.csv?raw"),
    );
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /old_import.*count_invalid/);
  });
  await t.test("duplicate old KR import", () => {
    const fixture = buildFixture();
    replaceRepositorySelector(
      fixture,
      `${selectorBytes().toString("utf8")}import duplicateKr from "${OLD_KR_SOURCE}";\n`,
    );
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /old_import.*count_invalid/);
  });
});

test("tracked paths are bound to trusted repository tree evidence", async (t) => {
  await t.test("target exists in trusted inventory but caller omits it", () => {
    const fixture = buildFixture();
    const targetPath =
      fixture.input.finalApprovalInput.targetExportVerificationEvidence
        .usTarget.path;
    const trustedInventoryHash = hashMetricsTrackedPaths([
      ...fixture.input.repositoryPreimage.trackedPaths,
      targetPath,
    ]);
    fixture.input.executionPolicy.expectedTrackedPathsSha256 =
      trustedInventoryHash;
    fixture.options.expectedTrackedPathsSha256 = trustedInventoryHash;
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /tracked_paths_not_trusted_inventory/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("tracked paths hash mismatch", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.trackedPathsSha256 = "a".repeat(64);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /tracked_paths_sha256_mismatch/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("tree SHA mismatch", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.repositoryTreeSha = "a".repeat(40);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /repository_tree_mismatch/);
    assertNoPackageExposure(result);
  });
  await t.test("duplicate path", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.trackedPaths.push(
      fixture.input.repositoryPreimage.trackedPaths[0],
    );
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /tracked_path_duplicate/);
  });
  await t.test("malformed path", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.trackedPaths.push("../outside.csv");
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /tracked_path_invalid/);
  });
  await t.test("reordered equivalent inventory", () => {
    const fixture = buildFixture();
    fixture.input.repositoryPreimage.trackedPaths.reverse();
    assert.equal(evaluate(fixture).status, "package_ready");
  });
  await t.test("valid target absence", () => {
    const fixture = buildFixture();
    const targets =
      fixture.input.finalApprovalInput.targetExportVerificationEvidence;
    assert.equal(
      fixture.input.repositoryPreimage.trackedPaths.includes(
        targets.usTarget.path,
      ),
      false,
    );
    assert.equal(
      fixture.input.repositoryPreimage.trackedPaths.includes(
        targets.krTarget.path,
      ),
      false,
    );
    assert.equal(evaluate(fixture).status, "package_ready");
  });
});

test("package contains exactly two create-only target files from Step 114-2P evidence", () => {
  const fixture = buildFixture();
  const result = evaluate(fixture);
  const evidence =
    fixture.input.finalApprovalInput.targetExportVerificationEvidence;

  assert.equal(result.targetFileCount, 2);
  assert.equal(result.plannedWriteCount, 2);
  assert.equal(result.plannedDeleteCount, 0);
  assert.deepEqual(
    result.targetFiles.map((item) => item.role),
    ["us_price_metrics", "kr_price_metrics"],
  );
  assert.equal(
    result.targetFiles.every((item) => item.writeMode === "create_only"),
    true,
  );
  assert.equal(result.targetFiles[0].contentBase64, evidence.usTarget.contentBase64);
  assert.equal(result.targetFiles[1].contentBase64, evidence.krTarget.contentBase64);
  assert.equal(Object.hasOwn(fixture.input, "targetFiles"), false);
});

test("target-path absence evidence is exact, trusted, and target-bound", async (t) => {
  await t.test("missing evidence", () => {
    const fixture = buildFixture();
    delete fixture.input.targetPathAbsenceEvidence;
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_path_absence_evidence_not_object/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("wrong evidence hash", () => {
    const fixture = buildFixture();
    fixture.input.targetPathAbsenceEvidence.evidenceHash =
      "a".repeat(64);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_path_absence_evidence_hash_mismatch/,
    );
    assertNoPackageExposure(result);
  });
  for (const [name, field, value] of [
    ["repository HEAD", "repositoryHeadSha", "a".repeat(40)],
    ["repository tree", "repositoryTreeSha", "b".repeat(40)],
    ["tracked inventory", "trackedPathsSha256", "c".repeat(64)],
    ["branch", "branchName", "review/other-branch"],
  ]) {
    await t.test(`${name} mismatch`, () => {
      const fixture = buildFixture();
      const payload = {
        ...fixture.input.targetPathAbsenceEvidence,
        [field]: value,
      };
      payload.evidenceHash =
        hashMetricsTargetPathAbsenceEvidence(payload);
      setTrustedTargetPathAbsenceEvidence(fixture, payload);
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join("\n"),
        new RegExp(`target_path_absence_evidence_${field}_mismatch`),
      );
      assertNoPackageExposure(result);
    });
  }
  await t.test("evidence for different target paths is not reusable", () => {
    const fixture = buildFixture();
    const payload = buildTargetPathAbsenceEvidence({
      repositoryHeadSha:
        fixture.input.repositoryPreimage.repositoryHeadSha,
      repositoryTreeSha:
        fixture.input.repositoryPreimage.repositoryTreeSha,
      trackedPathsSha256:
        fixture.input.repositoryPreimage.trackedPathsSha256,
      branchName: fixture.input.repositoryPreimage.branchName,
      usPath: "src/data/tickers/different_us_target.csv",
      krPath: "src/data/tickers/different_kr_target.csv",
    });
    setTrustedTargetPathAbsenceEvidence(fixture, payload);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_path_absence_evidence_path_mismatch/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("tracked or non-absent observations block", () => {
    const fixture = buildFixture();
    const payload = structuredClone(
      fixture.input.targetPathAbsenceEvidence,
    );
    payload.targets[0].tracked = true;
    payload.targets[1].absentAtEnd = false;
    payload.evidenceHash =
      hashMetricsTargetPathAbsenceEvidence(payload);
    setTrustedTargetPathAbsenceEvidence(fixture, payload);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_path_absence_evidence_(tracked|absentAtEnd)_invalid/,
    );
    assertNoPackageExposure(result);
  });
  await t.test("target list must contain exactly two contract targets", () => {
    const fixture = buildFixture();
    const payload = structuredClone(
      fixture.input.targetPathAbsenceEvidence,
    );
    payload.targets.pop();
    payload.evidenceHash =
      hashMetricsTargetPathAbsenceEvidence(payload);
    setTrustedTargetPathAbsenceEvidence(fixture, payload);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_path_absence_evidence_target_count_invalid/,
    );
    assertNoPackageExposure(result);
  });
  for (const [name, mutate] of [
    [
      "repository preimage hash",
      (fixture) => {
        fixture.input.repositoryPreimage
          .targetPathAbsenceEvidenceHash = "a".repeat(64);
      },
    ],
    [
      "execution policy hash",
      (fixture) => {
        fixture.input.executionPolicy
          .expectedTargetPathAbsenceEvidenceHash = "a".repeat(64);
      },
    ],
    [
      "trusted option hash",
      (fixture) => {
        fixture.options.expectedTargetPathAbsenceEvidenceHash =
          "a".repeat(64);
      },
    ],
  ]) {
    await t.test(`${name} mismatch blocks`, () => {
      const fixture = buildFixture();
      mutate(fixture);
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join("\n"),
        /target_path_absence_evidence|target_path_absence_evidence_hash/,
      );
      assertNoPackageExposure(result);
    });
  }
});

test("target path identities reject case and Unicode aliases", async (t) => {
  for (const [name, usPath, krPath] of [
    [
      "case-only variants",
      "src/data/tickers/Future_Target.csv",
      "src/data/tickers/future_target.csv",
    ],
    [
      "Unicode normalization variants",
      "src/data/tickers/métrics_target.csv",
      "src/data/tickers/me\u0301trics_target.csv",
    ],
  ]) {
    await t.test(name, () => {
      const fixture = buildFixture();
      const targetEvidence =
        fixture.input.finalApprovalInput
          .targetExportVerificationEvidence;
      targetEvidence.usTarget.path = usPath;
      targetEvidence.krTarget.path = krPath;
      synchronizeTargetPathAbsenceEvidence(fixture);
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join("\n"),
        /target_(file|path_absence_evidence)_paths_not_distinct/,
      );
      assertNoPackageExposure(result);
    });
  }
  await t.test("clearly distinct paths remain package-ready", () => {
    assert.equal(evaluate(buildFixture()).status, "package_ready");
  });
});

test("target byte, hash, and size mismatches block", async (t) => {
  await t.test("bytes", () => {
    const fixture = buildFixture();
    fixture.input.finalApprovalInput.targetExportVerificationEvidence.usTarget.contentBase64 =
      Buffer.from("changed", "utf8").toString("base64");
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /sha256_mismatch/);
  });
  await t.test("hash", () => {
    const fixture = buildFixture();
    fixture.input.finalApprovalInput.targetExportVerificationEvidence.krTarget.sha256 =
      "a".repeat(64);
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /sha256_mismatch/);
  });
  await t.test("size", () => {
    const fixture = buildFixture();
    fixture.input.finalApprovalInput.targetExportVerificationEvidence.usTarget.byteSize +=
      1;
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /byte_size_mismatch/);
  });
});

test("exact selector diff changes only two import sources", () => {
  const result = evaluate(buildFixture());

  assert.equal(result.exactDiff.contractVersion, METRICS_SELECTOR_EXACT_DIFF_CONTRACT_VERSION);
  assert.equal(result.exactDiff.replacementCount, 2);
  assert.equal(result.exactDiff.changedLineCount, 2);
  assert.equal(result.exactDiff.otherChangesDetected, false);
  assert.deepEqual(
    result.exactDiff.replacements.map((item) => item.importName),
    ["usPriceMetricsOverlayCsv", "krPriceMetricsOverlayCsv"],
  );
});

test("pure proposed-selector builder reuses exact transformation and suppresses failure bytes", () => {
  const fixture = buildFixture();
  const success = buildMetricsCutoverProposedSelectorEvidence(
    fixture.input.repositoryPreimage,
    fixture.input.finalApprovalInput
      .targetExportVerificationEvidence,
  );
  assert.equal(success.status, "ready");
  assert.equal(success.ok, true);
  assert.equal(
    success.selectorContentBase64,
    fixture.input.proposedSelector.selectorContentBase64,
  );
  assert.equal(
    success.selectorSha256,
    fixture.input.proposedSelector.selectorSha256,
  );

  const blocked = buildMetricsCutoverProposedSelectorEvidence(
    {
      ...fixture.input.repositoryPreimage,
      selectorSha256: "0".repeat(64),
    },
    fixture.input.finalApprovalInput
      .targetExportVerificationEvidence,
  );
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.selectorContentBase64, "");
  assert.equal(blocked.selectorSha256, "");
});

test("caller-proposed selector cannot rename, reformat, append, or add a third replacement", async (t) => {
  const mutations = [
    [
      "import variable rename",
      (text) =>
        text.replace(
          "import usPriceMetricsOverlayCsv from",
          "import renamedUsPriceMetricsOverlayCsv from",
        ),
    ],
    ["whitespace change", (text) => text.replace("const NUMERIC_FIELDS", " const NUMERIC_FIELDS")],
    ["extra line", (text) => `${text}\nconst unexpected = true;\n`],
    [
      "third replacement",
      (text) =>
        `${text}\nimport thirdPriceMetrics from "./third_price_metrics.csv?raw";\n`,
    ],
  ];
  for (const [name, mutate] of mutations) {
    await t.test(name, () => {
      const fixture = buildFixture();
      replaceProposedSelector(
        fixture,
        mutate(
          Buffer.from(
            fixture.input.proposedSelector.selectorContentBase64,
            "base64",
          ).toString("utf8"),
        ),
      );
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join("\n"),
        /not_exact_internal_postimage/,
      );
      assertNoPackageExposure(result);
      assertFixedOutputs(result);
    });
  }
});

test("selector postimage declared hash mismatch blocks", () => {
  const fixture = buildFixture();
  fixture.input.proposedSelector.selectorSha256 = "a".repeat(64);
  const result = evaluate(fixture);

  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /proposed_selector_sha256_mismatch/);
  assertNoPackageExposure(result);
});

test("rollback bundle restores the exact selector preimage without deleting targets", () => {
  const fixture = buildFixture();
  const result = evaluate(fixture);

  assert.equal(
    result.rollbackBundle.contractVersion,
    METRICS_CUTOVER_ROLLBACK_BUNDLE_CONTRACT_VERSION,
  );
  assert.equal(
    result.rollbackBundle.rollbackSelectorContentBase64,
    fixture.input.repositoryPreimage.selectorContentBase64,
  );
  assert.equal(
    result.rollbackBundle.rollbackSelectorSha256,
    fixture.input.repositoryPreimage.selectorSha256,
  );
  assert.deepEqual(result.rollbackBundle.rollbackFileDeletes, []);
  assert.equal(Object.hasOwn(result.rollbackBundle, "commands"), false);
});

test("execution-package hash is deterministic and mutation-sensitive", () => {
  const result = evaluate(buildFixture());
  assert.equal(
    hashMetricsCutoverExecutionPackage(result.executionPackage),
    result.executionPackageHash,
  );

  const mutations = [
    (value) => {
      value.candidatePackageId += "-changed";
    },
    (value) => {
      value.targetFiles[0].contentBase64 += "A";
    },
    (value) => {
      value.exactDiff.changedLineCount = 3;
    },
    (value) => {
      value.executionPolicy.requireCleanWorktree = false;
    },
    (value) => {
      value.repositoryPreimage.trackedPaths.push(
        "src/data/tickers/unexpected.csv",
      );
    },
    (value) => {
      value.targetPathAbsenceEvidenceHash = "a".repeat(64);
    },
    (value) => {
      value.rollbackBundle.rollbackSelectorContentBase64 += "A";
    },
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(result.executionPackage);
    mutate(changed);
    assert.notEqual(
      hashMetricsCutoverExecutionPackage(changed),
      result.executionPackageHash,
    );
  }
});

test("service performs no filesystem, Git, network, DB, deployment, or pointer mutation", () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network must not be used");
  };
  try {
    assert.equal(evaluate(buildFixture()).status, "package_ready");
  } finally {
    globalThis.fetch = originalFetch;
  }

  const source = readFileSync(
    new URL("./metricsCutoverExecutionPackagePreflight.js", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    'from "node:fs"',
    "node:child_process",
    "fetch(",
    "writeFile",
    "rename(",
    "unlink(",
    "git ",
    "gh ",
    "process.env",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("fixed false authorization outputs hold in package_ready, blocked, and idle states", () => {
  const ready = evaluate(buildFixture());
  const blockedFixture = buildFixture();
  blockedFixture.input.repositoryPreimage.worktreeClean = false;
  const blocked = evaluate(blockedFixture);
  const idle = evaluateMetricsCutoverExecutionPackagePreflight({});

  assertFixedOutputs(ready);
  assertFixedOutputs(blocked);
  assertFixedOutputs(idle);
  assertNoPackageExposure(blocked);
  assertNoPackageExposure(idle);
});
