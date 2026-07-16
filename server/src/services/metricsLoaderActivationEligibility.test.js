import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign as signPayload } from "node:crypto";
import test from "node:test";

import {
  METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE,
  METRICS_CANDIDATE_APPROVAL_SCOPE,
  METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
  canonicalizeApprovalReceiptPayload,
  createInMemoryApprovalReceiptReplayRegistry,
} from "./metricsCandidateApprovalReceipt.js";
import {
  CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
  METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION,
  METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION,
  evaluateMetricsLoaderActivationEligibility,
  verifyMetricsCandidatePackageIndex,
} from "./metricsLoaderActivationEligibility.js";

const NOW = new Date("2026-07-16T00:00:00.000Z");
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

function buildKeyContext() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const allowlistEntry = {
    signerKeyId: "finple-step114-2o-test-key",
    signerId: "finple-owner-test",
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }),
    allowedScopes: [METRICS_CANDIDATE_APPROVAL_SCOPE],
    roles: [METRICS_CANDIDATE_APPROVAL_REQUIRED_ROLE],
    revoked: false,
  };
  return { privateKey, allowlistEntry };
}

function baseManifest(overrides = {}) {
  return {
    candidatePackageId: "candidate-step114-2o-synthetic",
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
      marketScope: ["KR"],
      timezone: "Asia/Seoul",
      currencyMode: "KRW",
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
    [`finple_candidate_normalized_month_end_${VERSION}.csv`, Buffer.from("market,ticker,date,close\nKR,005930,2026-06-30,70000\n")],
    [`finple_candidate_monthly_returns_${VERSION}.csv`, Buffer.from("market,ticker,date,monthlyReturn\nKR,005930,2026-06-30,0.01\n")],
    [`finple_candidate_metrics_output_${VERSION}.csv`, Buffer.from("market,ticker,metricBaseDate\nKR,005930,2026-07-15\n")],
    [`finple_candidate_review_required_${VERSION}.csv`, Buffer.from("market,ticker,reviewReason\n")],
    [`finple_candidate_source_audit_${VERSION}.csv`, Buffer.from("issueType,severity,blocksCandidate\n")],
    [`finple_candidate_timeseries_audit_${VERSION}.csv`, Buffer.from("market,ticker,status\nKR,005930,ready\n")],
    [`finple_candidate_audit_${VERSION}.html`, Buffer.from("<!doctype html><p>synthetic audit</p>\n")],
    [`finple_candidate_hash_inventory_${VERSION}.csv`, Buffer.from("artifactType,logicalRole,path,sha256\n")],
  ]);
}

function buildPackage(manifest, readinessOverrides = {}) {
  const makeReadiness = () => ({ ...baseReadiness(manifest), ...readinessOverrides });
  let readiness = makeReadiness();
  let payloads = packagePayloads(manifest, readiness);

  const buildMembers = () =>
    [...payloads].map(([path, bytes]) => {
      const exclusions = path.endsWith(".json") ? ["candidatePackageHash"] : [];
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
    zipMemberHashAlgorithm: "sha256-file-or-json-with-explicit-field-exclusion",
    selfExcludedIndexFile: `finple_candidate_package_index_${VERSION}.json`,
    selfExclusionReason: SELF_EXCLUSION_REASON,
    members: buildMembers(),
  };
  manifest.candidatePackageHash = stableHash(
    Object.fromEntries(Object.entries(packageIndex).filter(([key]) => key !== "candidatePackageHash")),
  );
  readiness = makeReadiness();
  payloads = packagePayloads(manifest, readiness);
  packageIndex = { ...packageIndex, members: buildMembers() };
  packageIndex.candidatePackageHash = stableHash(
    Object.fromEntries(Object.entries(packageIndex).filter(([key]) => key !== "candidatePackageHash")),
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

function buildReceipt(privateKey, manifest, overrides = {}) {
  const unsigned = {
    contractVersion: METRICS_CANDIDATE_APPROVAL_RECEIPT_CONTRACT_VERSION,
    receiptId: "approval-step114-2o-001",
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
    signerKeyId: "finple-step114-2o-test-key",
    signerId: "finple-owner-test",
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

function freshnessPolicy(overrides = {}) {
  return {
    policyVersion: METRICS_LOADER_ACTIVATION_FRESHNESS_POLICY_VERSION,
    maxMetricAgeDays: 7,
    maxReceiptAgeHours: 24,
    requiredPipelineVersion: "finple-monthly-metrics-pipeline-v1",
    requiredNormalizationVersion: "finple-timeseries-normalization-v1",
    requiredCalculationPolicyVersion: "finple-metrics-calculation-policy-v1",
    ...overrides,
  };
}

function buildFixture({
  manifestOverrides = {},
  receiptOverrides = {},
  policyOverrides = {},
  readinessOverrides = {},
} = {}) {
  const keyContext = buildKeyContext();
  const candidateManifest = baseManifest(manifestOverrides);
  const packageContract = buildPackage(candidateManifest, readinessOverrides);
  const receipt = buildReceipt(keyContext.privateKey, candidateManifest, receiptOverrides);
  return {
    keyContext,
    input: {
      candidateManifest,
      receipt,
      zipPackageSha256: receipt.zipPackageSha256,
      packageIndex: packageContract.packageIndex,
      packageMembers: packageContract.packageMembers,
      packageVerification: {
        contractVersion: CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
        ok: true,
        issues: [],
        zipPackageSha256: receipt.zipPackageSha256,
        candidatePackageHash: candidateManifest.candidatePackageHash,
        packageIndexFile: packageContract.packageIndex.selfExcludedIndexFile,
      },
      freshnessPolicy: freshnessPolicy(policyOverrides),
    },
    options: {
      now: NOW,
      productionAllowlistJson: JSON.stringify([keyContext.allowlistEntry]),
    },
  };
}

function evaluate(fixture) {
  return evaluateMetricsLoaderActivationEligibility(fixture.input, fixture.options);
}

function assertFixedSafetyOutputs(result) {
  assert.equal(result.productionApprovalRequired, true);
  assert.equal(result.appExportApprovalRequired, true);
  assert.equal(result.productionPublishReady, false);
  assert.equal(result.appExportApproved, false);
  assert.equal(result.loaderPointerMutationPlanned, false);
  assert.equal(result.loaderActivated, false);
}

test("valid synthetic package, index, signed receipt, and policy are eligible", () => {
  const fixture = buildFixture();
  const result = evaluate(fixture);

  assert.equal(result.status, "eligible");
  assert.equal(result.ok, true);
  assert.equal(result.contractVersion, METRICS_LOADER_ACTIVATION_ELIGIBILITY_CONTRACT_VERSION);
  assert.equal(result.candidatePackageReady, true);
  assert.equal(result.approvalReceiptVerified, true);
  assert.equal(result.signerAllowed, true);
  assert.equal(result.candidateIdentityBound, true);
  assert.equal(result.packageIndexVerified, true);
  assert.equal(result.zipIdentityBound, true);
  assert.equal(result.sourceApprovalCurrent, true);
  assert.equal(result.productionAllowlistConfigured, true);
  assert.equal(result.activationDryRunEligible, true);
  assert.equal(
    fixture.input.packageVerification.contractVersion,
    CANDIDATE_PACKAGE_VERIFICATION_EVIDENCE_CONTRACT_VERSION,
  );
  assert.equal(
    fixture.input.packageVerification.zipPackageSha256,
    fixture.input.zipPackageSha256,
  );
  assert.equal(
    fixture.input.packageVerification.candidatePackageHash,
    fixture.input.packageIndex.candidatePackageHash,
  );
  assert.equal(
    fixture.input.packageVerification.packageIndexFile,
    fixture.input.packageIndex.selfExcludedIndexFile,
  );
  assert.deepEqual(result.blockingIssues, []);
  assertFixedSafetyOutputs(result);
});

test("identical input is deterministic and does not mutate supplied JSON", () => {
  const fixture = buildFixture();
  const before = structuredClone(fixture.input);
  const first = evaluate(fixture);
  const second = evaluate(fixture);

  assert.deepEqual(first, second);
  assert.deepEqual(fixture.input, before);
});

test("idle input includes every field and fixed false activation outputs", () => {
  const result = evaluateMetricsLoaderActivationEligibility({}, { now: NOW });
  const requiredFields = [
    "ok", "status", "contractVersion", "candidatePackageId", "candidatePackageHash",
    "candidatePackageReady", "approvalReceiptVerified", "signerAllowed", "candidateIdentityBound",
    "packageIndexVerified", "zipIdentityBound", "sourceApprovalCurrent",
    "productionAllowlistConfigured", "activationDryRunEligible", "productionApprovalRequired",
    "appExportApprovalRequired", "productionPublishReady", "appExportApproved",
    "loaderPointerMutationPlanned", "loaderActivated", "blockingIssues", "warningIssues",
  ];
  assert.equal(result.status, "idle");
  for (const field of requiredFields) assert.equal(Object.hasOwn(result, field), true, field);
  assert.equal(result.activationDryRunEligible, false);
  assertFixedSafetyOutputs(result);
});

test("Step 114-2N verifier failures propagate fail-closed", () => {
  const fixture = buildFixture();
  fixture.input.receipt.signatureBase64 = `${fixture.input.receipt.signatureBase64.slice(0, -4)}AAAA`;
  const result = evaluate(fixture);

  assert.equal(result.status, "blocked");
  assert.equal(result.approvalReceiptVerified, false);
  assert.match(result.blockingIssues.join(","), /receipt_signature_(base64_)?invalid/);
  assertFixedSafetyOutputs(result);
});

test("candidate, ZIP, index, member, source, and version tampering block", async (t) => {
  const cases = [
    ["candidate identity", (fixture) => { fixture.input.candidateManifest.candidatePackageId = "tampered"; }],
    ["ZIP SHA", (fixture) => { fixture.input.zipPackageSha256 = "a".repeat(64); }],
    ["index identity", (fixture) => { fixture.input.packageIndex.contractVersion = "unknown"; }],
    ["member hash", (fixture) => { fixture.input.packageIndex.members[2].sha256 = "a".repeat(64); }],
    ["source hash", (fixture) => { fixture.input.candidateManifest.sourceDeclarationHash = "a".repeat(64); }],
    ["version lineage", (fixture) => { fixture.input.freshnessPolicy.requiredPipelineVersion = "other"; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const fixture = buildFixture();
      mutate(fixture);
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.equal(result.activationDryRunEligible, false);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("missing, extra, duplicate, and mutated package member payloads block", async (t) => {
  const cases = [
    ["missing", (members) => members.pop()],
    ["extra", (members) => members.push({ path: "extra.txt", contentBase64: Buffer.from("extra").toString("base64") })],
    ["duplicate", (members) => members.push({ ...members[0] })],
    ["mutated", (members) => { members[2].contentBase64 = Buffer.from("mutated").toString("base64"); }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const fixture = buildFixture();
      mutate(fixture.input.packageMembers);
      const result = evaluate(fixture);
      assert.equal(result.packageIndexVerified, false);
      assert.equal(result.status, "blocked");
    });
  }
});

test("missing, extra, and duplicate package-index member declarations block", async (t) => {
  const cases = [
    ["missing", (members) => members.pop()],
    ["extra", (members) => members.push({ path: "extra.txt", sha256: "a".repeat(64), byteSize: "1", hashExcludesJsonFields: [] })],
    ["duplicate", (members) => members.push({ ...members[0] })],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const fixture = buildFixture();
      mutate(fixture.input.packageIndex.members);
      assert.equal(evaluate(fixture).packageIndexVerified, false);
    });
  }
});

test("fixture, blocked, provider-enabled, production-enabled, and app-enabled candidates block", async (t) => {
  const cases = [
    ["fixture", { fixturePackageReady: true }],
    ["blocked", { candidatePackageReady: false, blockingIssueCount: 1 }],
    ["provider", { externalProviderCalls: true }],
    ["production", { productionPublishReady: true }],
    ["app", { appExportApproved: true }],
  ];
  for (const [name, manifestOverrides] of cases) {
    await t.test(name, () => {
      const result = evaluate(buildFixture({ manifestOverrides }));
      assert.equal(result.status, "blocked");
      assert.equal(result.candidatePackageReady, false);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("missing production allowlist blocks and cannot be replaced by caller JSON", () => {
  const fixture = buildFixture();
  delete fixture.options.productionAllowlistJson;
  fixture.input.allowlistEntries = [fixture.keyContext.allowlistEntry];
  const previous = process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;
  try {
    delete process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;
    const result = evaluate(fixture);
    assert.equal(result.productionAllowlistConfigured, false);
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join(","), /production_allowlist_not_configured/);
  } finally {
    if (previous === undefined) delete process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON;
    else process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON = previous;
  }
});

test("missing or malformed freshness policy and evaluation time block", async (t) => {
  const cases = [
    ["missing policy", (fixture) => { delete fixture.input.freshnessPolicy; }],
    ["zero age", (fixture) => { fixture.input.freshnessPolicy.maxMetricAgeDays = 0; }],
    ["missing version", (fixture) => { delete fixture.input.freshnessPolicy.requiredNormalizationVersion; }],
    ["missing now", (fixture) => { delete fixture.options.now; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const fixture = buildFixture();
      mutate(fixture);
      assert.equal(evaluate(fixture).status, "blocked");
    });
  }
});

test("stale metric date and required version mismatch block", async (t) => {
  await t.test("stale metric", () => {
    const fixture = buildFixture({ manifestOverrides: { metricBaseDate: "2026-06-01" } });
    const result = evaluate(fixture);
    assert.match(result.blockingIssues.join(","), /metric_base_date_stale/);
    assert.equal(result.sourceApprovalCurrent, false);
  });
  await t.test("required version", () => {
    const fixture = buildFixture({
      manifestOverrides: { normalizationVersion: "old-normalization" },
    });
    const result = evaluate(fixture);
    assert.match(result.blockingIssues.join(","), /required_normalizationVersion_mismatch/);
    assert.equal(result.status, "blocked");
  });
});

test("stale, expired, and future approval receipts block", async (t) => {
  const cases = [
    ["stale", { issuedAt: "2026-07-14T00:00:00.000Z", expiresAt: "2026-07-17T00:00:00.000Z" }, /approval_receipt_stale/],
    ["expired", { issuedAt: "2026-07-14T00:00:00.000Z", expiresAt: "2026-07-15T00:00:00.000Z" }, /receipt_expired/],
    ["future", { issuedAt: "2026-07-16T01:00:00.000Z", expiresAt: "2026-07-17T00:00:00.000Z" }, /approval_receipt_issued_at_in_future/],
  ];
  for (const [name, receiptOverrides, issue] of cases) {
    await t.test(name, () => {
      const result = evaluate(buildFixture({ receiptOverrides }));
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join(","), issue);
    });
  }
});

test("replay registry blocks a duplicate receipt ID", () => {
  const fixture = buildFixture();
  const replayRegistry = createInMemoryApprovalReceiptReplayRegistry();
  fixture.options.replayRegistry = replayRegistry;
  const first = evaluate(fixture);
  const second = evaluate(fixture);

  assert.equal(first.status, "eligible");
  assert.equal(second.status, "blocked");
  assert.match(second.blockingIssues.join(","), /receipt_id_replayed/);
});

test("Python verifier evidence is bound to the exact ZIP, candidate, and package index", async (t) => {
  const cases = [
    [
      "evidence from another ZIP",
      (fixture) => { fixture.input.packageVerification.zipPackageSha256 = "a".repeat(64); },
      /candidate_package_verification_zip_sha256_mismatch/,
    ],
    [
      "wrong ZIP SHA input",
      (fixture) => { fixture.input.zipPackageSha256 = "a".repeat(64); },
      /candidate_package_verification_zip_sha256_mismatch/,
    ],
    [
      "wrong candidate package hash",
      (fixture) => { fixture.input.packageVerification.candidatePackageHash = "a".repeat(64); },
      /candidate_package_verification_(index|manifest|receipt)_hash_mismatch/,
    ],
    [
      "wrong package index file",
      (fixture) => { fixture.input.packageVerification.packageIndexFile = "finple_candidate_package_index_other.json"; },
      /candidate_package_verification_index_file_mismatch/,
    ],
    [
      "missing contract version",
      (fixture) => { delete fixture.input.packageVerification.contractVersion; },
      /candidate_package_verification_contract_version_mismatch/,
    ],
    [
      "malformed issues",
      (fixture) => { fixture.input.packageVerification.issues = "none"; },
      /candidate_package_verification_issues_not_array/,
    ],
    [
      "bare ok and issues object",
      (fixture) => { fixture.input.packageVerification = { ok: true, issues: [] }; },
      /candidate_package_verification_contract_version_mismatch/,
    ],
  ];

  for (const [name, mutate, expectedIssue] of cases) {
    await t.test(name, () => {
      const fixture = buildFixture();
      mutate(fixture);
      const indexResult = verifyMetricsCandidatePackageIndex(fixture.input);
      const result = evaluate(fixture);
      assert.equal(indexResult.ok, false);
      assert.match(indexResult.issues.join(","), expectedIssue);
      assert.equal(result.packageIndexVerified, false);
      assert.equal(result.status, "blocked");
      assertFixedSafetyOutputs(result);
    });
  }
});

test("Python verifier evidence issues still block", () => {
  const fixture = buildFixture();
  fixture.input.packageVerification.issues = ["zip_member_set_mismatch"];
  const indexResult = verifyMetricsCandidatePackageIndex(fixture.input);
  const result = evaluate(fixture);

  assert.equal(indexResult.ok, false);
  assert.match(indexResult.issues.join(","), /candidate_package_verification_issues_present/);
  assert.equal(result.packageIndexVerified, false);
  assert.equal(result.status, "blocked");
});

test("final-approval-only top-level inputs are blocked before idle classification", async (t) => {
  for (const field of [
    "productionApprovalGranted",
    "productionActivationAuthorized",
    "productionPublishReady",
    "appExportApproved",
    "loaderPointerMutationPlanned",
    "loaderActivated",
  ]) {
    await t.test(field, () => {
      const result = evaluateMetricsLoaderActivationEligibility({ [field]: true }, { now: NOW });
      assert.equal(result.status, "blocked");
      assert.notEqual(result.status, "idle");
      assert.match(result.blockingIssues.join(","), new RegExp(`final_approval_flag_forbidden:input:${field}`));
      assertFixedSafetyOutputs(result);
    });
  }
});

test("malformed truthy final-approval values block fail-closed", async (t) => {
  for (const value of ["true", 1]) {
    await t.test(JSON.stringify(value), () => {
      const result = evaluateMetricsLoaderActivationEligibility(
        { loaderActivated: value },
        { now: NOW },
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join(","), /final_approval_flag_malformed:input:loaderActivated/);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("candidate manifest final-approval fields block", async (t) => {
  for (const field of [
    "productionApprovalGranted",
    "productionActivationAuthorized",
    "productionPublishReady",
    "appExportApproved",
    "loaderPointerMutationPlanned",
    "loaderActivated",
  ]) {
    await t.test(field, () => {
      const fixture = buildFixture({ manifestOverrides: { [field]: true } });
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join(","),
        new RegExp(`final_approval_flag_forbidden:candidate_manifest:${field}`),
      );
      assertFixedSafetyOutputs(result);
    });
  }
});

test("parsed candidate readiness final-approval fields block", async (t) => {
  for (const field of [
    "productionApprovalGranted",
    "productionActivationAuthorized",
    "productionPublishReady",
    "appExportApproved",
    "loaderPointerMutationPlanned",
    "loaderActivated",
  ]) {
    await t.test(field, () => {
      const fixture = buildFixture({ readinessOverrides: { [field]: true } });
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.equal(result.packageIndexVerified, false);
      assert.match(
        result.blockingIssues.join(","),
        new RegExp(`final_approval_flag_forbidden:candidate_readiness:${field}`),
      );
      assertFixedSafetyOutputs(result);
    });
  }
});

test("malformed final-approval fields in manifest, receipt, and readiness block", async (t) => {
  const cases = [
    ["manifest", { manifestOverrides: { loaderActivated: "true" } }, /candidate_manifest:loaderActivated/],
    ["receipt", { receiptOverrides: { loaderActivated: 1 } }, /approval_receipt:loaderActivated/],
    ["readiness", { readinessOverrides: { loaderActivated: "true" } }, /candidate_readiness:loaderActivated/],
  ];
  for (const [name, overrides, issue] of cases) {
    await t.test(name, () => {
      const result = evaluate(buildFixture(overrides));
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join(","), issue);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("Step 114-2N receipt cannot encode final production, app, pointer, or activation approval", async (t) => {
  for (const field of [
    "productionApprovalGranted",
    "productionActivationAuthorized",
    "productionPublishReady",
    "appExportApproved",
    "loaderPointerMutationPlanned",
    "loaderActivated",
  ]) {
    await t.test(field, () => {
      const fixture = buildFixture({ receiptOverrides: { [field]: true } });
      const result = evaluate(fixture);
      assert.equal(result.status, "blocked");
      assert.match(
        result.blockingIssues.join(","),
        new RegExp(`final_approval_flag_forbidden:approval_receipt:${field}`),
      );
      assertFixedSafetyOutputs(result);
    });
  }
});

test("Step 114-2M non-fixture source boundary is rechecked", async (t) => {
  const approvedSource = baseManifest().sourceDeclaration;
  const cases = [
    ["source declaration object", { sourceDeclaration: null }, /source_declaration_not_object/],
    ["fixtureOnly", { sourceDeclaration: { ...approvedSource, fixtureOnly: true } }, /source_fixture_only_invalid/],
    ["testOnly", { sourceDeclaration: { ...approvedSource, testOnly: true } }, /source_test_only_invalid/],
    ["fixture source kind", { sourceKind: "fixture" }, /source_kind_invalid/],
    ["synthetic source kind", { sourceKind: "synthetic" }, /source_kind_invalid/],
    ["app use pending", { sourceDeclaration: { ...approvedSource, appUseReviewStatus: "pending" } }, /source_app_use_review_not_approved/],
    ["redistribution rejected", { sourceDeclaration: { ...approvedSource, redistributionReviewStatus: "rejected" } }, /source_redistribution_review_not_approved/],
  ];
  for (const [name, manifestOverrides, issue] of cases) {
    await t.test(name, () => {
      const result = evaluate(buildFixture({ manifestOverrides }));
      assert.equal(result.status, "blocked");
      assert.equal(result.candidatePackageReady, false);
      assert.match(result.blockingIssues.join(","), issue);
      assertFixedSafetyOutputs(result);
    });
  }
});

test("Step 114-2M alternate approved source-review values remain eligible", () => {
  const approvedSource = baseManifest().sourceDeclaration;
  const result = evaluate(buildFixture({
    manifestOverrides: {
      sourceDeclaration: {
        ...approvedSource,
        appUseReviewStatus: "allowed",
        redistributionReviewStatus: "reviewed_approved",
      },
    },
  }));
  assert.equal(result.status, "eligible");
  assert.equal(result.activationDryRunEligible, true);
  assertFixedSafetyOutputs(result);
});

test("service performs no network call and keeps blocked outputs false", () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network call attempted");
  };
  try {
    const eligible = evaluate(buildFixture());
    const blocked = evaluate(buildFixture({ manifestOverrides: { externalProviderCalls: true } }));
    assert.equal(eligible.status, "eligible");
    assert.equal(blocked.status, "blocked");
    assertFixedSafetyOutputs(eligible);
    assertFixedSafetyOutputs(blocked);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
