const assert = require("node:assert/strict");
const {
  createHash,
  generateKeyPairSync,
  sign: signPayload,
} = require("node:crypto");
const {
  mkdirSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathToFileURL } = require("node:url");

const VERSION = "2026_07_step114_2s_integration";
const EVALUATION_NOW = "2026-07-16T01:00:00.000Z";
const ELIGIBILITY_EVALUATED_AT = "2026-07-16T00:05:00.000Z";
const SELF_EXCLUSION_REASON =
  "candidatePackageHash and package index identity are self-referential; index hash excludes candidatePackageHash and ZIP member set excludes the index hash from itself.";
const US_TARGET =
  "src/data/tickers/us_price_metrics_overlay_step114_2s_integration.csv";
const KR_TARGET =
  "src/data/tickers/kr_price_metrics_overlay_step114_2s_integration.csv";

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

function runGit(repo, args) {
  const result = spawnSync("git", args, {
    cwd: repo,
    shell: false,
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
  );
  return result.stdout.trim();
}

function copyTrackedFile(sourceRoot, targetRoot, repositoryPath) {
  const target = path.join(targetRoot, ...repositoryPath.split("/"));
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(
    target,
    readFileSync(path.join(sourceRoot, ...repositoryPath.split("/"))),
  );
}

async function createIsolatedMetricsRepository(sourceRoot, repositoryRoot) {
  const rehearsal = await import(
    pathToFileURL(
      path.join(
        sourceRoot,
        "server/src/services/metricsFinalApprovalCutoverRehearsal.js",
      ),
    ).href
  );
  const current = rehearsal.getMetricsCurrentPointerSnapshot();
  mkdirSync(repositoryRoot, { recursive: true });
  for (const repositoryPath of [
    current.selector.path,
    ...current.components.map((component) => component.path),
  ]) {
    copyTrackedFile(sourceRoot, repositoryRoot, repositoryPath);
  }
  runGit(repositoryRoot, ["init", "-b", "main"]);
  runGit(repositoryRoot, ["config", "user.name", "FINPLE Step 114-2S Test"]);
  runGit(repositoryRoot, [
    "config",
    "user.email",
    "step114-2s@example.invalid",
  ]);
  runGit(repositoryRoot, ["add", "."]);
  runGit(repositoryRoot, ["commit", "-m", "Synthetic Step 114-2S preimage"]);
  return {
    branchName: runGit(repositoryRoot, ["branch", "--show-current"]),
    repositoryHeadSha: runGit(repositoryRoot, ["rev-parse", "HEAD"]),
  };
}

function baseManifest() {
  return {
    candidatePackageId: "candidate-step114-2s-real-integration",
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
    sourceName: "synthetic-in-memory-integration-source",
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
      Buffer.from("<!doctype html><p>synthetic integration audit</p>\n"),
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
    [...payloads].map(([memberPath, bytes]) => {
      const exclusions = memberPath.endsWith(".json")
        ? ["candidatePackageHash"]
        : [];
      let digest = sha256(bytes);
      if (exclusions.length > 0) {
        const parsed = JSON.parse(bytes.toString("utf8"));
        parsed.candidatePackageHash = "";
        digest = stableHash(parsed);
      }
      return {
        path: memberPath,
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
    packageMembers: [...payloads].map(([memberPath, bytes]) => ({
      path: memberPath,
      contentBase64: bytes.toString("base64"),
    })),
  };
}

function buildSigner({ signerKeyId, signerId, scopes, roles }) {
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

function targetCsv(market, ticker) {
  return [
    "market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason",
    `${market},${ticker},10.5,9.5,-20.0,1.0,10.0,${market === "US" ? "SPY" : "^KS11"},ready,synthetic_in_memory,`,
    "",
  ].join("\n");
}

function targetExport(constants, role, importName, targetPath, market, ticker) {
  const bytes = Buffer.from(targetCsv(market, ticker), "utf8");
  return {
    role,
    importName,
    path: targetPath,
    contentBase64: bytes.toString("base64"),
    sha256: sha256(bytes),
    byteSize: bytes.length,
    rowCount: 1,
    market,
    schemaVersion: constants.METRICS_TARGET_EXPORT_SCHEMA_VERSION,
  };
}

function targetSnapshot(constants, context, current, evidence) {
  const snapshot = {
    contractVersion: constants.METRICS_POINTER_SNAPSHOT_CONTRACT_VERSION,
    snapshotKind: "target",
    selector: {
      path: current.selector.path,
      sha256: "1".repeat(64),
    },
    sourceCommit: "1".repeat(40),
    components: current.components.map((component) => {
      if (component.role === "us_price_metrics") {
        return {
          role: component.role,
          importName: evidence.usTarget.importName,
          path: evidence.usTarget.path,
          sha256: evidence.usTarget.sha256,
          candidatePackageId: context.candidatePackageId,
          candidatePackageHash: context.candidatePackageHash,
          zipPackageSha256: context.zipPackageSha256,
          packageIndexFile: context.packageIndexFile,
        };
      }
      if (component.role === "kr_price_metrics") {
        return {
          role: component.role,
          importName: evidence.krTarget.importName,
          path: evidence.krTarget.path,
          sha256: evidence.krTarget.sha256,
          candidatePackageId: context.candidatePackageId,
          candidatePackageHash: context.candidatePackageHash,
          zipPackageSha256: context.zipPackageSha256,
          packageIndexFile: context.packageIndexFile,
        };
      }
      return component;
    }),
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
    pointerIdentityHash: constants.hashMetricsPointerSnapshot(snapshot),
  };
}

function rollbackSnapshot(constants, current) {
  const snapshot = {
    ...structuredClone(current),
    snapshotKind: "rollback",
  };
  return {
    ...snapshot,
    pointerIdentityHash: constants.hashMetricsPointerSnapshot(snapshot),
  };
}

function signFinalReceipt(
  constants,
  privateKey,
  { kind, context, receiptId, signerKeyId, signerId },
) {
  const production = kind === "production";
  const unsigned = {
    contractVersion: production
      ? constants.METRICS_PRODUCTION_PUBLISH_APPROVAL_CONTRACT_VERSION
      : constants.METRICS_APP_EXPORT_APPROVAL_CONTRACT_VERSION,
    receiptId,
    approvalScope: production
      ? constants.METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE
      : constants.METRICS_APP_EXPORT_APPROVAL_SCOPE,
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    eligibilityContractVersion:
      constants.METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
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
    signatureAlgorithm: constants.METRICS_FINAL_APPROVAL_SIGNATURE_ALGORITHM,
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
        constants.canonicalizeMetricsFinalApprovalReceiptPayload(unsigned),
        "utf8",
      ),
      privateKey,
    ).toString("base64"),
  };
}

async function buildRealSyntheticOperatorBundle(
  sourceRoot,
  { repositoryHeadSha, branchName },
) {
  const candidateReceipt = await import(
    pathToFileURL(
      path.join(
        sourceRoot,
        "server/src/services/metricsCandidateApprovalReceipt.js",
      ),
    ).href
  );
  const eligibility = await import(
    pathToFileURL(
      path.join(
        sourceRoot,
        "server/src/services/metricsLoaderActivationEligibility.js",
      ),
    ).href
  );
  const finalApproval = await import(
    pathToFileURL(
      path.join(
        sourceRoot,
        "server/src/services/metricsFinalApprovalCutoverRehearsal.js",
      ),
    ).href
  );
  const constants = {
    ...candidateReceipt,
    ...eligibility,
    ...finalApproval,
  };

  const candidateSigner = buildSigner({
    signerKeyId: "step114-2s-candidate-key",
    signerId: "step114-2s-candidate-owner",
    scopes: [constants.METRICS_CANDIDATE_APPROVAL_SCOPE],
    roles: [constants.METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE],
  });
  const manifest = baseManifest();
  const packageContract = buildPackage(manifest);
  const unsignedCandidateReceipt = {
    contractVersion:
      constants.METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: "step114-2s-candidate-receipt",
    approvalScope: constants.METRICS_CANDIDATE_APPROVAL_SCOPE,
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
    signerKeyId: candidateSigner.allowlistEntry.signerKeyId,
    signerId: candidateSigner.allowlistEntry.signerId,
    signatureAlgorithm: "Ed25519",
    attestations: {
      ownerApproved: true,
      sourceUseApproved: true,
      dataQualityApproved: true,
      investmentAdviceNotProvided: true,
      productionActivationNotAuthorized: true,
    },
  };
  const candidateApprovalReceipt = {
    ...unsignedCandidateReceipt,
    signatureBase64: signPayload(
      null,
      Buffer.from(
        constants.canonicalizeApprovalReceiptPayload(
          unsignedCandidateReceipt,
        ),
        "utf8",
      ),
      candidateSigner.privateKey,
    ).toString("base64"),
  };
  const eligibilityInput = {
    candidateManifest: manifest,
    receipt: candidateApprovalReceipt,
    zipPackageSha256: candidateApprovalReceipt.zipPackageSha256,
    packageIndex: packageContract.packageIndex,
    packageMembers: packageContract.packageMembers,
    packageVerification: {
      contractVersion:
        constants.CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
      ok: true,
      issues: [],
      zipPackageSha256: candidateApprovalReceipt.zipPackageSha256,
      candidatePackageHash: manifest.candidatePackageHash,
      packageIndexFile: packageContract.packageIndex.selfExcludedIndexFile,
    },
    freshnessPolicy: {
      policyVersion:
        constants.METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION,
      maxMetricAgeDays: 7,
      maxReceiptAgeHours: 24,
      requiredPipelineVersion: manifest.pipelineVersion,
      requiredNormalizationVersion: manifest.normalizationVersion,
      requiredCalculationPolicyVersion: manifest.calculationPolicyVersion,
    },
  };
  const eligibilityOptions = {
    now: new Date(ELIGIBILITY_EVALUATED_AT),
    productionAllowlistJson: JSON.stringify([
      candidateSigner.allowlistEntry,
    ]),
  };
  const eligibilityResult =
    constants.evaluateMetricsLoaderActivationEligibility(
      eligibilityInput,
      eligibilityOptions,
    );
  assert.equal(eligibilityResult.status, "eligible");
  const context = {
    candidatePackageId: manifest.candidatePackageId,
    candidatePackageHash: manifest.candidatePackageHash,
    zipPackageSha256: eligibilityInput.zipPackageSha256,
    packageIndexFile: packageContract.packageIndex.selfExcludedIndexFile,
    eligibilityEvidenceHash:
      constants.hashMetricsEligibilityEvidence(eligibilityResult),
    eligibilityEvaluatedAt: ELIGIBILITY_EVALUATED_AT,
  };
  const current = constants.getMetricsCurrentPointerSnapshot();
  const sourceMember = packageContract.packageIndex.members.find((member) =>
    member.path.startsWith("finple_candidate_metrics_output_"),
  );
  const targetEvidence = {
    contractVersion:
      constants.METRICS_TARGET_EXPORT_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
    candidatePackageId: context.candidatePackageId,
    candidatePackageHash: context.candidatePackageHash,
    zipPackageSha256: context.zipPackageSha256,
    packageIndexFile: context.packageIndexFile,
    sourceMetricsOutputMember: {
      path: sourceMember.path,
      sha256: sourceMember.sha256,
    },
    exportPolicyVersion: constants.METRICS_TARGET_EXPORT_POLICY_VERSION,
    usTarget: targetExport(
      constants,
      "us_price_metrics",
      "usPriceMetricsOverlayCsv",
      US_TARGET,
      "US",
      "AAPL",
    ),
    krTarget: targetExport(
      constants,
      "kr_price_metrics",
      "krPriceMetricsOverlayCsv",
      KR_TARGET,
      "KR",
      "005930",
    ),
  };
  const target = targetSnapshot(constants, context, current, targetEvidence);
  const rollback = rollbackSnapshot(constants, current);
  const receiptContext = {
    ...context,
    currentPointerIdentityHash: current.pointerIdentityHash,
    targetPointerIdentityHash: target.pointerIdentityHash,
    rollbackPointerIdentityHash: rollback.pointerIdentityHash,
  };
  const productionSigner = buildSigner({
    signerKeyId: "step114-2s-production-key",
    signerId: "step114-2s-production-signer",
    scopes: [constants.METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE],
    roles: [constants.METRICS_PRODUCTION_PUBLISH_APPROVER_ROLE],
  });
  const appSigner = buildSigner({
    signerKeyId: "step114-2s-app-key",
    signerId: "step114-2s-app-signer",
    scopes: [constants.METRICS_APP_EXPORT_APPROVAL_SCOPE],
    roles: [constants.METRICS_APP_EXPORT_APPROVER_ROLE],
  });
  return {
    contractVersion:
      "metrics-cutover-post-merge-dry-run-input-v1-step114-2s",
    expectedRepositoryHeadSha: repositoryHeadSha,
    requiredBranchName: branchName,
    evaluationNow: EVALUATION_NOW,
    finalApprovalInput: {
      eligibilityInput,
      eligibilityEvidenceHash: context.eligibilityEvidenceHash,
      eligibilityEvaluatedAt: ELIGIBILITY_EVALUATED_AT,
      productionApprovalReceipt: signFinalReceipt(
        constants,
        productionSigner.privateKey,
        {
          kind: "production",
          context: receiptContext,
          receiptId: "step114-2s-production-receipt",
          signerKeyId: productionSigner.allowlistEntry.signerKeyId,
          signerId: productionSigner.allowlistEntry.signerId,
        },
      ),
      appExportApprovalReceipt: signFinalReceipt(
        constants,
        appSigner.privateKey,
        {
          kind: "app",
          context: receiptContext,
          receiptId: "step114-2s-app-receipt",
          signerKeyId: appSigner.allowlistEntry.signerKeyId,
          signerId: appSigner.allowlistEntry.signerId,
        },
      ),
      approvalPolicy: {
        policyVersion:
          constants.METRICS_FINAL_APPROVAL_POLICY_CONTRACT_VERSION,
        maxApprovalAgeHours: 4,
        maxEligibilityEvidenceAgeHours: 4,
        requireDistinctReceiptIds: true,
        requireDistinctSignerIds: true,
        requireDistinctSignerKeyIds: true,
        requiredProductionScope:
          constants.METRICS_PRODUCTION_PUBLISH_APPROVAL_SCOPE,
        requiredAppExportScope:
          constants.METRICS_APP_EXPORT_APPROVAL_SCOPE,
      },
      currentPointerSnapshot: current,
      targetExportVerificationEvidence: targetEvidence,
      targetPointerSnapshot: target,
      rollbackPointerSnapshot: rollback,
    },
    finalApprovalOptions: {
      now: EVALUATION_NOW,
      eligibilityOptions: {
        now: ELIGIBILITY_EVALUATED_AT,
        productionAllowlistJson:
          eligibilityOptions.productionAllowlistJson,
      },
      finalApprovalAllowlistJson: JSON.stringify([
        productionSigner.allowlistEntry,
        appSigner.allowlistEntry,
      ]),
    },
  };
}

module.exports = {
  EVALUATION_NOW,
  KR_TARGET,
  US_TARGET,
  buildRealSyntheticOperatorBundle,
  createIsolatedMetricsRepository,
};
