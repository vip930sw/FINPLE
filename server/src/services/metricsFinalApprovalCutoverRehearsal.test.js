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
  METRICS_CUTOVER_REHEARSAL_CONTRACT_VERSION,
  METRICS_FINAL_APPROVAL_BUNDLE_CONTRACT_VERSION,
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
  evaluateMetricsFinalApprovalCutoverRehearsal,
  getMetricsCurrentPointerSnapshot,
  hashMetricsEligibilityEvidence,
  hashMetricsPointerSnapshot,
} from "./metricsFinalApprovalCutoverRehearsal.js";

const NOW = new Date("2026-07-16T01:00:00.000Z");
const ELIGIBILITY_EVALUATED_AT = "2026-07-16T00:05:00.000Z";
const VERSION = "2026_07_candidate";
const SELF_EXCLUSION_REASON =
  "candidatePackageHash and package index identity are self-referential; index hash excludes candidatePackageHash and ZIP member set excludes the index hash from itself.";

function stableJsonValue(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJsonValue).join(",")}]`;
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
      signerKeyId: "finple-step114-2p-preflight-key",
      signerId: "finple-step114-2p-preflight-owner",
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: [METRICS_CANDIDATE_APPROVAL_SCOPE],
      roles: [METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE],
      revoked: false,
    },
  };
}

function baseManifest(overrides = {}) {
  return {
    candidatePackageId: "candidate-step114-2p-synthetic",
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
    ...overrides,
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

function buildPreflightReceipt(privateKey, manifest, overrides = {}) {
  const unsigned = {
    contractVersion: METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: "approval-step114-2p-preflight-001",
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
    signerKeyId: "finple-step114-2p-preflight-key",
    signerId: "finple-step114-2p-preflight-owner",
    signatureAlgorithm: "Ed25519",
    attestations: {
      ownerApproved: true,
      sourceUseApproved: true,
      dataQualityApproved: true,
      investmentAdviceNotProvided: true,
      productionActivationNotAuthorized: true,
    },
    ...overrides,
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

function buildEligibilityFixture(
  eligibilityNow = new Date(ELIGIBILITY_EVALUATED_AT),
) {
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
      now: eligibilityNow,
      productionAllowlistJson: JSON.stringify([keyContext.allowlistEntry]),
    },
  };
}

function buildFinalSigner({
  signerKeyId,
  signerId,
  scopes,
  roles,
}) {
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

function approvalPolicy(overrides = {}) {
  return {
    policyVersion: METRICS_FINAL_APPROVAL_POLICY_CONTRACT_VERSION,
    maxApprovalAgeHours: 4,
    maxEligibilityEvidenceAgeHours: 4,
    requireDistinctReceiptIds: true,
    requireDistinctSignerIds: true,
    requireDistinctSignerKeyIds: true,
    requiredProductionScope: METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE,
    requiredAppExportScope: METRICS_APP_EXPORT_APPROVAL_SCOPE,
    ...overrides,
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

function replaceTargetExportCsv(
  target,
  csv,
  { rowCount, preserveSha256 = false, preserveByteSize = false } = {},
) {
  const bytes = Buffer.from(csv, "utf8");
  target.contentBase64 = bytes.toString("base64");
  if (!preserveSha256) target.sha256 = sha256(bytes);
  if (!preserveByteSize) target.byteSize = bytes.length;
  if (rowCount !== undefined) target.rowCount = rowCount;
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
      path: "src/data/tickers/us_price_metrics_overlay_step114_2p_candidate.csv",
      market: "US",
      ticker: "AAPL",
    }),
    krTarget: buildTargetExport({
      role: "kr_price_metrics",
      importName: "krPriceMetricsOverlayCsv",
      path: "src/data/tickers/kr_price_metrics_overlay_step114_2p_candidate.csv",
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
  {
    kind,
    context,
    receiptId,
    signerKeyId,
    signerId,
    overrides = {},
  },
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
    ...overrides,
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

function recalculateSnapshot(snapshot) {
  snapshot.pointerIdentityHash = hashMetricsPointerSnapshot(snapshot);
}

function buildFixture({
  eligibilityMutator,
  currentMutator,
  targetEvidenceMutator,
  targetMutator,
  rollbackMutator,
  policyOverrides = {},
  productionReceiptOverrides = {},
  appReceiptOverrides = {},
  allowlistMutator,
  sameSigner = false,
  sameSignerId = false,
  keyAlias = false,
  eligibilityEvaluatedAt = ELIGIBILITY_EVALUATED_AT,
  eligibilityOptionsNow,
  clockSkewMs,
  eligibilityEvidenceHashOverride,
  afterBuild,
} = {}) {
  const eligibility = buildEligibilityFixture(
    eligibilityOptionsNow || new Date(eligibilityEvaluatedAt),
  );
  if (eligibilityMutator) eligibilityMutator(eligibility);
  const eligibilityResult = evaluateMetricsLoaderActivationEligibility(
    eligibility.input,
    eligibility.options,
  );
  const computedEvidenceHash = hashMetricsEligibilityEvidence(eligibilityResult);
  const manifest = eligibility.input.candidateManifest;
  const packageIndexFile =
    eligibility.input.packageIndex.selfExcludedIndexFile;
  const baseContext = {
    candidatePackageId: manifest.candidatePackageId,
    candidatePackageHash: manifest.candidatePackageHash,
    zipPackageSha256: eligibility.input.zipPackageSha256,
    packageIndexFile,
    eligibilityEvidenceHash: computedEvidenceHash,
    eligibilityEvaluatedAt,
  };

  const current = getMetricsCurrentPointerSnapshot();
  if (currentMutator) currentMutator(current, baseContext);
  recalculateSnapshot(current);
  const targetExportVerificationEvidence = buildTargetExportEvidence(
    baseContext,
    eligibility.input.packageIndex,
  );
  if (targetEvidenceMutator) {
    targetEvidenceMutator(
      targetExportVerificationEvidence,
      baseContext,
      eligibility,
    );
  }
  const target = buildTargetSnapshot(
    baseContext,
    targetExportVerificationEvidence,
  );
  if (targetMutator) targetMutator(target, baseContext, current);
  recalculateSnapshot(target);
  const rollback = buildRollbackSnapshot(current);
  if (rollbackMutator) rollbackMutator(rollback, baseContext, current);
  recalculateSnapshot(rollback);

  const receiptContext = {
    ...baseContext,
    currentPointerIdentityHash: current.pointerIdentityHash,
    targetPointerIdentityHash: target.pointerIdentityHash,
    rollbackPointerIdentityHash: rollback.pointerIdentityHash,
  };

  const sharedSigner = sameSigner
    ? buildFinalSigner({
        signerKeyId: "finple-step114-2p-shared-key",
        signerId: "finple-step114-2p-shared-signer",
        scopes: [
          METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE,
          METRICS_APP_EXPORT_APPROVAL_SCOPE,
        ],
        roles: [
          METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE,
          METRICS_APP_EXPORT_APPROVER_ROLE,
        ],
      })
    : null;
  const productionSigner =
    sharedSigner ||
    buildFinalSigner({
      signerKeyId: "finple-step114-2p-production-key",
      signerId: "finple-step114-2p-production-signer",
      scopes: [METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE],
      roles: [METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE],
    });
  let appSigner =
    sharedSigner ||
    buildFinalSigner({
      signerKeyId: "finple-step114-2p-app-key",
      signerId: "finple-step114-2p-app-signer",
      scopes: [METRICS_APP_EXPORT_APPROVAL_SCOPE],
      roles: [METRICS_APP_EXPORT_APPROVER_ROLE],
    });
  if (!sharedSigner && sameSignerId) {
    appSigner.allowlistEntry.signerId =
      productionSigner.allowlistEntry.signerId;
  }
  if (!sharedSigner && keyAlias) {
    appSigner = {
      privateKey: productionSigner.privateKey,
      allowlistEntry: {
        ...appSigner.allowlistEntry,
        publicKeyPem: productionSigner.allowlistEntry.publicKeyPem,
      },
    };
  }

  const productionApprovalReceipt = signFinalReceipt(
    productionSigner.privateKey,
    {
      kind: "production",
      context: receiptContext,
      receiptId: "final-production-step114-2p-001",
      signerKeyId: productionSigner.allowlistEntry.signerKeyId,
      signerId: productionSigner.allowlistEntry.signerId,
      overrides: productionReceiptOverrides,
    },
  );
  const appExportApprovalReceipt = signFinalReceipt(appSigner.privateKey, {
    kind: "app",
    context: receiptContext,
    receiptId: "final-app-export-step114-2p-001",
    signerKeyId: appSigner.allowlistEntry.signerKeyId,
    signerId: appSigner.allowlistEntry.signerId,
    overrides: appReceiptOverrides,
  });

  const allowlistEntries = sharedSigner
    ? [sharedSigner.allowlistEntry]
    : [productionSigner.allowlistEntry, appSigner.allowlistEntry];
  if (allowlistMutator) allowlistMutator(allowlistEntries);

  const fixture = {
    input: {
      eligibilityInput: eligibility.input,
      eligibilityEvidenceHash:
        eligibilityEvidenceHashOverride || computedEvidenceHash,
      eligibilityEvaluatedAt,
      productionApprovalReceipt,
      appExportApprovalReceipt,
      approvalPolicy: approvalPolicy(policyOverrides),
      currentPointerSnapshot: current,
      targetExportVerificationEvidence,
      targetPointerSnapshot: target,
      rollbackPointerSnapshot: rollback,
    },
    options: {
      now: NOW,
      eligibilityOptions: eligibility.options,
      finalApprovalAllowlistJson: JSON.stringify(allowlistEntries),
      ...(clockSkewMs === undefined ? {} : { clockSkewMs }),
    },
  };
  if (afterBuild) afterBuild(fixture, receiptContext);
  return fixture;
}

function evaluate(fixture) {
  return evaluateMetricsFinalApprovalCutoverRehearsal(
    fixture.input,
    fixture.options,
  );
}

function assertFixedSafetyOutputs(result) {
  assert.equal(result.executionApprovalRequired, true);
  assert.equal(result.productionPublishReady, false);
  assert.equal(result.appExportActivated, false);
  assert.equal(result.pointerMutationAuthorized, false);
  assert.equal(result.pointerMutationExecuted, false);
  assert.equal(result.rollbackExecuted, false);
  assert.equal(result.loaderActivated, false);
}

test("valid synthetic final approvals and snapshots return ready rehearsal only", () => {
  const fixture = buildFixture();
  const result = evaluate(fixture);

  assert.equal(result.status, "ready");
  assert.equal(result.ok, true);
  assert.equal(
    result.contractVersion,
    METRICS_FINAL_APPROVAL_BUNDLE_CONTRACT_VERSION,
  );
  assert.equal(
    result.cutoverRehearsalContractVersion,
    METRICS_CUTOVER_REHEARSAL_CONTRACT_VERSION,
  );
  assert.equal(result.eligibilityReverified, true);
  assert.equal(result.productionApprovalVerified, true);
  assert.equal(result.appExportApprovalVerified, true);
  assert.equal(result.approvalPolicySatisfied, true);
  assert.equal(result.currentPointerSnapshotVerified, true);
  assert.equal(result.targetExportVerificationEvidenceVerified, true);
  assert.equal(result.targetPointerSnapshotVerified, true);
  assert.equal(result.rollbackSnapshotVerified, true);
  assert.equal(result.cutoverPlanReady, true);
  assert.equal(result.rollbackPlanReady, true);
  assert.equal(result.cutoverRehearsalReady, true);
  assert.equal(result.cutoverPlan.every((step) => step.rehearsalOnly), true);
  assert.equal(result.rollbackPlan.every((step) => step.rehearsalOnly), true);
  assert.deepEqual(result.blockingIssues, []);
  assertFixedSafetyOutputs(result);
});

test("result is deterministic and input remains immutable", () => {
  const fixture = buildFixture();
  const before = structuredClone(fixture.input);
  const first = evaluate(fixture);
  const second = evaluate(fixture);

  assert.deepEqual(first, second);
  assert.deepEqual(fixture.input, before);
});

test("idle result includes every required field with safe defaults", () => {
  const result = evaluateMetricsFinalApprovalCutoverRehearsal(
    {},
    { now: NOW },
  );
  const requiredFields = [
    "ok",
    "status",
    "contractVersion",
    "candidatePackageId",
    "candidatePackageHash",
    "zipPackageSha256",
    "eligibilityContractVersion",
    "eligibilityEvidenceHash",
    "eligibilityReverified",
    "productionApprovalVerified",
    "appExportApprovalVerified",
    "approvalPolicySatisfied",
    "currentPointerSnapshotVerified",
    "targetExportVerificationEvidenceVerified",
    "targetPointerSnapshotVerified",
    "rollbackSnapshotVerified",
    "cutoverPlanReady",
    "rollbackPlanReady",
    "cutoverRehearsalReady",
    "executionApprovalRequired",
    "productionPublishReady",
    "appExportActivated",
    "pointerMutationAuthorized",
    "pointerMutationExecuted",
    "rollbackExecuted",
    "loaderActivated",
    "blockingIssues",
    "warningIssues",
  ];
  assert.equal(result.status, "idle");
  for (const field of requiredFields) {
    assert.equal(Object.hasOwn(result, field), true, field);
  }
  assertFixedSafetyOutputs(result);
});

test("caller activationDryRunEligible is not trusted and blocked 2O propagates", () => {
  const fixture = buildFixture({
    eligibilityMutator: ({ input }) => {
      input.candidateManifest.candidatePackageReady = false;
    },
  });
  fixture.input.activationDryRunEligible = true;
  const result = evaluate(fixture);

  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /caller_activation_dry_run_eligible_not_trusted/);
  assert.match(result.blockingIssues.join("\n"), /step114_2o_eligibility_not_eligible/);
  assertFixedSafetyOutputs(result);
});

test("eligibility evidence hash mismatch blocks", () => {
  const result = evaluate(
    buildFixture({ eligibilityEvidenceHashOverride: "9".repeat(64) }),
  );
  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /eligibility_evidence_hash_mismatch/);
  assertFixedSafetyOutputs(result);
});

test("eligibilityOptions.now must equal the signed eligibility evaluation time", () => {
  const fixture = buildFixture();
  fixture.options.eligibilityOptions.now = NOW;
  const result = evaluate(fixture);

  assert.equal(result.status, "blocked");
  assert.equal(result.eligibilityReverified, false);
  assert.match(result.blockingIssues.join("\n"), /eligibility_options_now_mismatch/);
  assertFixedSafetyOutputs(result);
});

test("a fabricated recent eligibilityEvaluatedAt cannot replace the actual 2O time", () => {
  const result = evaluate(
    buildFixture({
      eligibilityEvaluatedAt: "2026-07-16T00:55:00.000Z",
      eligibilityOptionsNow: new Date("2026-07-16T00:05:00.000Z"),
      productionReceiptOverrides: {
        issuedAt: "2026-07-16T00:56:00.000Z",
      },
      appReceiptOverrides: {
        issuedAt: "2026-07-16T00:56:00.000Z",
      },
    }),
  );

  assert.equal(result.status, "blocked");
  assert.equal(result.eligibilityReverified, false);
  assert.match(result.blockingIssues.join("\n"), /eligibility_options_now_mismatch/);
  assertFixedSafetyOutputs(result);
});

test("final approval receipt issued before eligibility evaluation blocks beyond clock skew", () => {
  const result = evaluate(
    buildFixture({
      productionReceiptOverrides: {
        issuedAt: "2026-07-15T23:58:00.000Z",
      },
    }),
  );

  assert.equal(result.status, "blocked");
  assert.match(
    result.blockingIssues.join("\n"),
    /production_approval_receipt_issued_before_eligibility_evaluation/,
  );
  assertFixedSafetyOutputs(result);
});

test("valid eligibility, receipt, and final evaluation time ordering is ready", () => {
  const result = evaluate(
    buildFixture({
      eligibilityEvaluatedAt: "2026-07-16T00:05:00.000Z",
      eligibilityOptionsNow: new Date("2026-07-16T00:05:00.000Z"),
      productionReceiptOverrides: {
        issuedAt: "2026-07-16T00:10:00.000Z",
      },
      appReceiptOverrides: {
        issuedAt: "2026-07-16T00:11:00.000Z",
      },
    }),
  );

  assert.equal(result.status, "ready");
  assert.equal(result.eligibilityReverified, true);
  assertFixedSafetyOutputs(result);
});

test("production and app receipt tampering blocks", async (t) => {
  for (const kind of ["production", "app"]) {
    await t.test(kind, () => {
      const fixture = buildFixture({
        afterBuild: ({ input }) => {
          const receipt =
            kind === "production"
              ? input.productionApprovalReceipt
              : input.appExportApprovalReceipt;
          receipt.targetPointerIdentityHash = "8".repeat(64);
        },
      });
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /signature_invalid|targetPointerIdentityHash_mismatch/);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("expired and future final approvals block", async (t) => {
  const cases = [
    [
      "expired",
      {
        issuedAt: "2026-07-15T20:00:00.000Z",
        expiresAt: "2026-07-15T23:00:00.000Z",
      },
      /expired|too_old/,
    ],
    [
      "future",
      {
        issuedAt: "2026-07-16T03:00:00.000Z",
        expiresAt: "2026-07-16T04:00:00.000Z",
      },
      /issued_at_in_future/,
    ],
  ];
  for (const [name, overrides, issue] of cases) {
    await t.test(name, () => {
      const result = evaluate(
        buildFixture({ productionReceiptOverrides: overrides }),
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), issue);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("missing and duplicate receipt IDs block", async (t) => {
  await t.test("missing", () => {
    const result = evaluate(
      buildFixture({ productionReceiptOverrides: { receiptId: "" } }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /missing_or_invalid_receiptId/);
  });
  await t.test("duplicate", () => {
    const result = evaluate(
      buildFixture({
        appReceiptOverrides: {
          receiptId: "final-production-step114-2p-001",
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /receipt_ids_not_distinct/);
  });
});

test("wrong scopes, roles, signers, revoked keys, and non-Ed25519 keys block", async (t) => {
  await t.test("wrong scope", () => {
    const result = evaluate(
      buildFixture({
        productionReceiptOverrides: {
          approvalScope: METRICS_APP_EXPORT_APPROVAL_SCOPE,
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /scope_mismatch|scope_not_allowed/);
  });
  await t.test("wrong role", () => {
    const result = evaluate(
      buildFixture({
        allowlistMutator: (entries) => {
          entries[0].roles = ["wrong_role"];
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /role_not_allowed/);
  });
  await t.test("wrong signer id", () => {
    const result = evaluate(
      buildFixture({
        productionReceiptOverrides: {
          signerId: "wrong-production-signer",
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /signer_id_mismatch/);
  });
  await t.test("unknown signer key", () => {
    const result = evaluate(
      buildFixture({
        productionReceiptOverrides: {
          signerKeyId: "unknown-production-key",
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /signer_unknown/);
  });
  await t.test("revoked", () => {
    const result = evaluate(
      buildFixture({
        allowlistMutator: (entries) => {
          entries[0].revoked = true;
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /revoked/);
  });
  await t.test("non-Ed25519", () => {
    const result = evaluate(
      buildFixture({
        allowlistMutator: (entries) => {
          const { publicKey } = generateKeyPairSync("rsa", {
            modulusLength: 2048,
          });
          entries[0].publicKeyPem = publicKey.export({
            type: "spki",
            format: "pem",
          });
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /public_key_not_ed25519/);
  });
});

test("distinct signer and key policy blocks shared signer", () => {
  const result = evaluate(buildFixture({ sameSigner: true }));
  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /signer_ids_not_distinct/);
  assert.match(result.blockingIssues.join("\n"), /signer_key_ids_not_distinct/);
});

test("different key IDs using the same Ed25519 public key are aliases and block", () => {
  const result = evaluate(buildFixture({ keyAlias: true }));

  assert.equal(result.status, "blocked");
  assert.match(
    result.blockingIssues.join("\n"),
    /duplicate_public_key_fingerprint|public_key_fingerprints_not_distinct/,
  );
  assert.equal(Object.hasOwn(result, "publicKeyPem"), false);
  assert.equal(Object.hasOwn(result, "publicKeyFingerprint"), false);
  const serializedResult = JSON.stringify(result);
  assert.equal(serializedResult.includes("BEGIN PUBLIC KEY"), false);
  assert.equal(serializedResult.includes("__publicKeyFingerprint"), false);
  assert.equal(serializedResult.includes("publicKeyPem"), false);
  assertFixedSafetyOutputs(result);
});

test("genuinely different signer key material satisfies distinct-key policy", () => {
  const result = evaluate(buildFixture());

  assert.equal(result.status, "ready");
  assert.equal(result.approvalPolicySatisfied, true);
  assertFixedSafetyOutputs(result);
});

test("same signer policy permits distinct key material when explicitly configured", () => {
  const result = evaluate(
    buildFixture({
      sameSignerId: true,
      policyOverrides: {
        requireDistinctSignerIds: false,
        requireDistinctSignerKeyIds: true,
      },
    }),
  );

  assert.equal(result.status, "ready");
  assert.equal(result.approvalPolicySatisfied, true);
  assertFixedSafetyOutputs(result);
});

test("same signer policy still rejects shared key material under aliased key IDs", () => {
  const result = evaluate(
    buildFixture({
      sameSignerId: true,
      keyAlias: true,
      policyOverrides: {
        requireDistinctSignerIds: false,
        requireDistinctSignerKeyIds: true,
      },
    }),
  );

  assert.equal(result.status, "blocked");
  assert.match(
    result.blockingIssues.join("\n"),
    /duplicate_public_key_fingerprint|public_key_fingerprints_not_distinct/,
  );
  assertFixedSafetyOutputs(result);
});

test("same signer and key are allowed only by explicit policy", () => {
  const result = evaluate(
    buildFixture({
      sameSigner: true,
      policyOverrides: {
        requireDistinctSignerIds: false,
        requireDistinctSignerKeyIds: false,
      },
    }),
  );
  assert.equal(result.status, "ready");
  assert.equal(result.approvalPolicySatisfied, true);
  assertFixedSafetyOutputs(result);
});

test("malformed approval policy blocks without hidden signer defaults", () => {
  const result = evaluate(
    buildFixture({
      policyOverrides: {
        requireDistinctSignerIds: undefined,
        requireDistinctSignerKeyIds: undefined,
      },
    }),
  );
  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /must_be_boolean/);
});

test("current pointer mismatch blocks", () => {
  const result = evaluate(
    buildFixture({
      currentMutator: (current) => {
        current.components[0].sha256 = "a".repeat(64);
      },
    }),
  );
  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /operating_selection_mismatch/);
});

test("candidate, ZIP, package index, and target binding mismatches block", async (t) => {
  const cases = [
    ["candidate", "candidatePackageId", "wrong-candidate"],
    ["ZIP", "zipPackageSha256", "a".repeat(64)],
    ["index", "packageIndexFile", "wrong-package-index.json"],
  ];
  for (const [name, field, value] of cases) {
    await t.test(name, () => {
      const result = evaluate(
        buildFixture({
          targetMutator: (target) => {
            target[field] = value;
          },
        }),
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), new RegExp(`${field}_mismatch`));
    });
  }
});

test("target export evidence binds snapshot hashes to actual in-memory bytes", async (t) => {
  await t.test("missing evidence", () => {
    const fixture = buildFixture();
    delete fixture.input.targetExportVerificationEvidence;
    const result = evaluate(fixture);
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_export_verification_evidence_not_object|export_evidence_not_verified/,
    );
  });
  await t.test("arbitrary hash without bytes", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.usTarget.contentBase64 = "";
          evidence.usTarget.sha256 = "a".repeat(64);
          evidence.usTarget.byteSize = 64;
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /content_base64_invalid/);
  });
  await t.test("declared hash mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.usTarget.sha256 = "a".repeat(64);
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_us_sha256_mismatch/);
  });
  await t.test("declared byte size mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.krTarget.byteSize += 1;
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_kr_byte_size_mismatch/);
  });
  await t.test("declared row count mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.usTarget.rowCount = 2;
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_us_row_count_mismatch/);
  });
  await t.test("schema version mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.krTarget.schemaVersion = "wrong-schema";
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_kr_schema_version_mismatch/);
  });
  await t.test("snapshot component hash mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetMutator: (target) => {
          const component = target.components.find(
            (item) => item.role === "us_price_metrics",
          );
          component.sha256 = "b".repeat(64);
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_pointer_snapshot_component_export_bytes_mismatch/,
    );
  });
});

test("target export CSV market, schema, row, and identity validation fails closed", async (t) => {
  await t.test("US target containing KR row", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          replaceTargetExportCsv(
            evidence.usTarget,
            targetExportCsv("KR", "005930"),
            { rowCount: 1 },
          );
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_us_csv_market_mismatch/);
  });
  await t.test("KR target containing US row", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          replaceTargetExportCsv(
            evidence.krTarget,
            targetExportCsv("US", "AAPL"),
            { rowCount: 1 },
          );
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_kr_csv_market_mismatch/);
  });
  await t.test("missing required header", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          replaceTargetExportCsv(
            evidence.usTarget,
            [
              "market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource",
              "US,AAPL,10.5,9.5,-20,1,10,SPY,ready,memory",
              "",
            ].join("\n"),
            { rowCount: 1 },
          );
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /csv_schema_mismatch/);
  });
  await t.test("duplicate market ticker row", () => {
    const csv = [
      "market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason",
      "US,AAPL,10.5,9.5,-20,1,10,SPY,ready,memory,",
      "US,AAPL,11.0,10.0,-19,1,10,SPY,ready,memory,",
      "",
    ].join("\n");
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          replaceTargetExportCsv(evidence.usTarget, csv, { rowCount: 2 });
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /csv_duplicate_market_ticker/);
  });
  await t.test("malformed row", () => {
    const csv = [
      "market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason",
      "US,AAPL,10.5",
      "",
    ].join("\n");
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          replaceTargetExportCsv(evidence.usTarget, csv, { rowCount: 1 });
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /csv_row_column_count_invalid/);
  });
});

test("target export evidence binds source member and exact import identities", async (t) => {
  await t.test("candidate binding mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.candidatePackageHash = "d".repeat(64);
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_export_verification_evidence_candidatePackageHash_mismatch/,
    );
  });
  await t.test("source metrics-output hash mismatch", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.sourceMetricsOutputMember.sha256 = "c".repeat(64);
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(
      result.blockingIssues.join("\n"),
      /target_export_source_metrics_output_hash_mismatch/,
    );
  });
  await t.test("US import alias", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.usTarget.importName = "aliasedUsPriceMetricsOverlayCsv";
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_us_import_name_mismatch/);
  });
  await t.test("KR import alias", () => {
    const result = evaluate(
      buildFixture({
        targetEvidenceMutator: (evidence) => {
          evidence.krTarget.importName = "aliasedKrPriceMetricsOverlayCsv";
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_export_kr_import_name_mismatch/);
  });
});

test("rollback snapshot mismatch blocks", () => {
  const result = evaluate(
    buildFixture({
      rollbackMutator: (rollback) => {
        rollback.components[0].sha256 = "b".repeat(64);
      },
    }),
  );
  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /rollback_pointer_snapshot_not_equal_to_current/);
});

test("no-op target selection blocks", () => {
  const result = evaluate(
    buildFixture({
      targetMutator: (target, _context, current) => {
        target.selector = structuredClone(current.selector);
        target.components = structuredClone(current.components);
      },
    }),
  );
  assert.equal(result.status, "blocked");
  assert.match(result.blockingIssues.join("\n"), /noop_selection|selector_not_changed/);
});

test("fixture, test, review-only, and partial targets block", async (t) => {
  for (const flag of ["fixtureOnly", "testOnly", "reviewOnly"]) {
    await t.test(flag, () => {
      const result = evaluate(
        buildFixture({
          targetMutator: (target) => {
            target[flag] = true;
          },
        }),
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), new RegExp(flag));
    });
  }
  await t.test("partial target", () => {
    const result = evaluate(
      buildFixture({
        targetMutator: (target, _context, current) => {
          const currentUs = current.components.find(
            (component) => component.role === "us_price_metrics",
          );
          const index = target.components.findIndex(
            (component) => component.role === "us_price_metrics",
          );
          target.components[index] = structuredClone(currentUs);
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /partial_or_unchanged_component/);
  });
  await t.test("fixture marker in target path", () => {
    const result = evaluate(
      buildFixture({
        targetMutator: (target) => {
          const component = target.components.find(
            (item) => item.role === "us_price_metrics",
          );
          component.path =
            "src/data/tickers/us_price_metrics_fixture_candidate.csv";
        },
      }),
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /review_marker_blocked/);
  });
});

test("execution, pointer, activation, deployment, and rollback authorization attempts block", async (t) => {
  for (const field of [
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
    "deploymentAuthorized",
  ]) {
    await t.test(field, () => {
      const fixture = buildFixture();
      fixture.input[field] = true;
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /execution_authorization_forbidden/);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("malformed truthy execution authorization representations block", async (t) => {
  for (const value of ["true", 1]) {
    await t.test(JSON.stringify(value), () => {
      const fixture = buildFixture();
      fixture.input.pointerMutationAuthorized = value;
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /execution_authorization_malformed/);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("service performs no network, DB, filesystem, deployment, or pointer mutation", () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network must not be used");
  };
  try {
    const result = evaluate(buildFixture());
    assert.equal(result.status, "ready");
  } finally {
    globalThis.fetch = originalFetch;
  }

  const source = readFileSync(
    new URL("./metricsFinalApprovalCutoverRehearsal.js", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    'from "node:fs"',
    "fetch(",
    "node:http",
    "node:https",
    "child_process",
    "writeFile",
    "rename(",
    "unlink(",
    "database",
    "render.com",
    "vercel.com",
    "api.github.com",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assertFixedSafetyOutputs(evaluate(buildFixture()));
});
