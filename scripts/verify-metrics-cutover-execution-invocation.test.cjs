const assert = require("node:assert/strict");
const {
  createHash,
  generateKeyPairSync,
  sign,
} = require("node:crypto");
const {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { spawnSync } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  FIXED_FALSE_FIELDS: STEP114_2T_FIXED_FALSE_FIELDS,
  TARGET_SCHEMA_VERSION,
  runMetricsCutoverExecutionApprovalRequest,
} = require("./lib/metrics-cutover-execution-approval-request.cjs");
const {
  AUTHORIZATION_FIELDS: STEP114_2S_AUTHORIZATION_FIELDS,
} = require("./lib/metrics-cutover-post-merge-dry-run.cjs");
const {
  APPROVAL_RESPONSE_CONTRACT_VERSION,
  APPROVAL_SCOPE,
  APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
  APPROVER_ROLE,
  ATTESTATION_FACTS,
  EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS: STEP114_2U_FIXED_FALSE_FIELDS,
  buildMetricsCutoverExecutionApprovalSignaturePayload,
  recomputeMetricsCutoverExecutionApprovalResponseId,
} = require("./lib/metrics-cutover-execution-approval-response.cjs");
const {
  AUTHORITY_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS: STEP114_2V_FIXED_FALSE_FIELDS,
  buildMetricsCutoverExecutionAuthorityPackage,
  hashMetricsCutoverExecutionAuthorityPackage,
  recomputeMetricsCutoverExecutionAuthorityPackageId,
  runMetricsCutoverExecutionAuthorityPackage,
} = require("./lib/metrics-cutover-execution-authority-package.cjs");
const {
  EXECUTION_INVOCATION_CONTRACT_VERSION,
  EXECUTION_INVOCATION_POLICY_VERSION,
  EXECUTION_INVOCATION_RECEIPT_CONTRACT_VERSION,
  EXECUTION_INVOCATION_RECEIPT_HASH_DOMAIN,
  EXECUTION_INVOCATION_STATUS,
  EXECUTION_INVOCATION_SUMMARY_CONTRACT_VERSION,
  EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
  EXECUTION_INVOKER_ROLE,
  EXECUTION_SCOPE,
  FIXED_FALSE_FIELDS,
  INVOCATION_ATTESTATIONS,
  INVOCATION_RECEIPT_REQUIREMENTS,
  INVOCATION_RECEIPT_STATUS,
  SIGNATURE_ALGORITHM,
  buildMetricsCutoverExecutionInvocationReceipt,
  buildMetricsCutoverExecutionInvocationSignaturePayload,
  canonicalizeMetricsCutoverExecutionInvocation,
  canonicalizeMetricsCutoverExecutionInvocationReceipt,
  hashMetricsCutoverExecutionInvocation,
  hashMetricsCutoverExecutionInvocationReceipt,
  normalizeMetricsCutoverExecutionInvokerAllowlist,
  readMetricsCutoverExecutionInvocationObservation,
  readMetricsCutoverExecutionInvokerAllowlistObservation,
  recomputeMetricsCutoverExecutionInvocationId,
  recomputeMetricsCutoverExecutionInvocationReceiptId,
  runMetricsCutoverExecutionInvocationVerification,
  validateMetricsCutoverExecutionInvocation,
  validateMetricsCutoverExecutionInvocationReceipt,
} = require("./lib/metrics-cutover-execution-invocation.cjs");
const {
  parseArguments,
  runCli,
} = require("./verify-metrics-cutover-execution-invocation.cjs");
const {
  buildRealSyntheticOperatorBundle,
  createIsolatedMetricsRepository,
} = require("./test-support/metrics-cutover-post-merge-real-fixture.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");
const HEAD = "a".repeat(40);
const TREE = "b".repeat(40);
const EVALUATION_NOW = "2026-07-17T01:00:00.000Z";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJsonForTest(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonForTest(item)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJsonForTest(value[key])}`)
    .join(",")}}`;
}

function rehashReceiptForTest(receipt) {
  const payload = structuredClone(receipt);
  delete payload.receiptHash;
  return sha256(
    Buffer.concat([
      Buffer.from(EXECUTION_INVOCATION_RECEIPT_HASH_DOMAIN, "utf8"),
      Buffer.from(canonicalJsonForTest(payload), "utf8"),
    ]),
  );
}

function fixedFalse(fields) {
  return Object.fromEntries(fields.map((field) => [field, false]));
}

function target(role) {
  const us = role === "us_price_metrics";
  return {
    role,
    path: `src/data/tickers/future_step114_2w_${us ? "us" : "kr"}.csv`,
    sha256: (us ? "5" : "6").repeat(64),
    byteSize: us ? 120 : 130,
    rowCount: 2,
    market: us ? "US" : "KR",
    schemaVersion: TARGET_SCHEMA_VERSION,
    writeMode: "create_only",
  };
}

function readyDryRun() {
  return {
    ok: true,
    status: "dry_run_ready",
    contractVersion: "metrics-cutover-post-merge-dry-run-v1-step114-2s",
    dryRunReady: true,
    repositoryStateStableAcrossDryRun: true,
    repositoryHeadSha: HEAD,
    repositoryTreeSha: TREE,
    branchName: "review/step114-2w",
    trackedPathsSha256: "c".repeat(64),
    targetPathAbsenceEvidenceHash: "d".repeat(64),
    candidatePackageId: "candidate-step114-2w-synthetic",
    candidatePackageHash: "1".repeat(64),
    zipPackageSha256: "2".repeat(64),
    cutoverRehearsalEvidenceHash: "3".repeat(64),
    executionPackageHash: "e".repeat(64),
    selectorPreimageSha256: "4".repeat(64),
    selectorPostimageSha256: "7".repeat(64),
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    targetSummaries: [target("us_price_metrics"), target("kr_price_metrics")],
    ...fixedFalse(STEP114_2S_AUTHORIZATION_FIELDS),
    blockingIssues: [],
    warningIssues: [],
  };
}

function makeFinalSigner(role, publicKeyPem = "") {
  const pair = publicKeyPem ? null : generateKeyPairSync("ed25519");
  const production = role === "production_publish";
  return {
    signerKeyId: `${production ? "production" : "app"}-key`,
    signerId: `${production ? "production" : "app"}-signer`,
    publicKeyPem:
      publicKeyPem || pair.publicKey.export({ type: "spki", format: "pem" }),
    allowedScopes: [
      production
        ? "metrics_production_publish_approval"
        : "metrics_app_export_approval",
    ],
    roles: [
      production
        ? "metrics_production_publish_approver"
        : "metrics_app_export_approver",
    ],
    revoked: false,
  };
}

function bundleValue({ productionSigner, appSigner } = {}) {
  return {
    evaluationNow: EVALUATION_NOW,
    finalApprovalInput: {
      productionApprovalReceipt: {
        signerKeyId: productionSigner?.signerKeyId || "production-key",
        signerId: productionSigner?.signerId || "production-signer",
      },
      appExportApprovalReceipt: {
        signerKeyId: appSigner?.signerKeyId || "app-key",
        signerId: appSigner?.signerId || "app-signer",
      },
    },
    finalApprovalOptions: {
      finalApprovalAllowlistJson: JSON.stringify(
        productionSigner && appSigner ? [productionSigner, appSigner] : [],
      ),
    },
  };
}

function observation(kind, bytes, value, overrides = {}) {
  const raw = Buffer.from(bytes || `synthetic-${kind}`);
  const result = {
    ok: true,
    blockingIssues: [],
    canonicalInputPath: `C:\\synthetic\\${kind}.json`,
    bytes: raw,
    byteSize: raw.length,
    sha256: sha256(raw),
    fileIdentity: `7:${kind.length + 40}`,
    fileIdentitySupported: true,
    ...overrides,
  };
  if (kind === "bundle") result.bundle = value || bundleValue();
  else result.value = structuredClone(value);
  return result;
}

async function readyStep1142TResult(bundleBytes, bundle) {
  return runMetricsCutoverExecutionApprovalRequest(
    { repo: "C:\\synthetic-repo", inputPath: "C:\\synthetic\\bundle.json" },
    {
      observeBundle: async () => observation("bundle", bundleBytes, bundle),
      runDryRun: async (_input, adapters) => {
        await adapters.readBundle("C:\\synthetic\\bundle.json");
        return readyDryRun();
      },
    },
  );
}

function readyStep1142UResult(request, fileHashes, overrides = {}) {
  return {
    ok: true,
    status: "approval_verified",
    contractVersion: APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
    approvalResponseVerified: true,
    approvalDecisionAccepted: true,
    signatureVerified: true,
    verificationReceiptHash: "8".repeat(64),
    requestId: request.requestId,
    requestHash: request.requestHash,
    responseId: `metrics-cutover-approval-response-${"9".repeat(64)}`,
    responseHash: "a".repeat(64),
    responseFileSha256: fileHashes.response,
    allowlistFileSha256: fileHashes.allowlist,
    operatorBundleSha256: fileHashes.bundle,
    repositoryHeadSha: request.repositoryHeadSha,
    repositoryTreeSha: request.repositoryTreeSha,
    branchName: request.branchName,
    executionPackageHash: request.executionPackageHash,
    signerKeyId: "execution-approver-key",
    signerId: "execution-approver",
    issuedAt: "2026-07-17T00:50:00.000Z",
    expiresAt: "2026-07-17T01:10:00.000Z",
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    ...fixedFalse(STEP114_2U_FIXED_FALSE_FIELDS),
    blockingIssues: [],
    warningIssues: [],
    ...overrides,
  };
}

function readyAuthorityResult(authorityPackage, overrides = {}) {
  return {
    ok: true,
    status: "authority_package_ready",
    contractVersion: AUTHORITY_SUMMARY_CONTRACT_VERSION,
    authorityPackageReady: true,
    approvalResponseVerified: true,
    signatureVerified: true,
    authorityPackage: structuredClone(authorityPackage),
    authorityPackageId: authorityPackage.authorityPackageId,
    authorityPackageHash: authorityPackage.authorityPackageHash,
    verificationReceiptHash: authorityPackage.verificationReceiptHash,
    requestId: authorityPackage.requestId,
    requestHash: authorityPackage.requestHash,
    responseId: authorityPackage.responseId,
    responseHash: authorityPackage.responseHash,
    executionPackageHash: authorityPackage.executionPackageHash,
    repositoryHeadSha: authorityPackage.repositoryHeadSha,
    repositoryTreeSha: authorityPackage.repositoryTreeSha,
    branchName: authorityPackage.branchName,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    ...fixedFalse(STEP114_2V_FIXED_FALSE_FIELDS),
    blockingIssues: [],
    warningIssues: [],
    ...overrides,
  };
}

function makeInvoker(overrides = {}) {
  const pair = generateKeyPairSync("ed25519");
  return {
    privateKey: pair.privateKey,
    entry: {
      invokerKeyId: "execution-invoker-key",
      invokerId: "execution-invoker",
      publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: [EXECUTION_SCOPE],
      roles: [EXECUTION_INVOKER_ROLE],
      revoked: false,
      ...overrides,
    },
  };
}

function signedInvocation(authorityPackage, invoker, overrides = {}) {
  const value = {
    contractVersion: EXECUTION_INVOCATION_CONTRACT_VERSION,
    invocationId: "",
    authorityPackageId: authorityPackage.authorityPackageId,
    authorityPackageHash: authorityPackage.authorityPackageHash,
    requestId: authorityPackage.requestId,
    requestHash: authorityPackage.requestHash,
    verificationReceiptHash: authorityPackage.verificationReceiptHash,
    operatorBundleSha256: authorityPackage.operatorBundleSha256,
    repositoryHeadSha: authorityPackage.repositoryHeadSha,
    repositoryTreeSha: authorityPackage.repositoryTreeSha,
    trackedPathsSha256: authorityPackage.trackedPathsSha256,
    targetPathAbsenceEvidenceHash:
      authorityPackage.targetPathAbsenceEvidenceHash,
    executionPackageHash: authorityPackage.executionPackageHash,
    selectorPreimageSha256: authorityPackage.selectorPreimageSha256,
    selectorPostimageSha256: authorityPackage.selectorPostimageSha256,
    targets: authorityPackage.targets.map((item) => ({ ...item })),
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    invocationScope: EXECUTION_SCOPE,
    invocationStatus: EXECUTION_INVOCATION_STATUS,
    invokedAt: "2026-07-17T00:55:00.000Z",
    expiresAt: "2026-07-17T01:05:00.000Z",
    invocationNonce: "step114_2w_nonce_0123456789abcdef",
    invokerKeyId: invoker.entry.invokerKeyId,
    invokerId: invoker.entry.invokerId,
    signatureAlgorithm: SIGNATURE_ALGORITHM,
    attestations: { ...INVOCATION_ATTESTATIONS },
    signatureBase64: Buffer.alloc(64).toString("base64"),
    ...overrides,
  };
  value.invocationId = recomputeMetricsCutoverExecutionInvocationId(value);
  value.signatureBase64 = sign(
    null,
    buildMetricsCutoverExecutionInvocationSignaturePayload(value),
    invoker.privateKey,
  ).toString("base64");
  return value;
}

function cloneObservation(value) {
  return { ...structuredClone(value), bytes: Buffer.from(value.bytes) };
}

async function unitSetup({ reuseInvokerKeyFor = "" } = {}) {
  const bundleBytes = Buffer.from("synthetic-bundle");
  const invoker = makeInvoker();
  const productionSigner = makeFinalSigner(
    "production_publish",
    reuseInvokerKeyFor === "production_publish"
      ? invoker.entry.publicKeyPem
      : "",
  );
  const appSigner = makeFinalSigner(
    "app_export",
    reuseInvokerKeyFor === "app_export" ? invoker.entry.publicKeyPem : "",
  );
  const approver = makeApprover({
    publicKeyPem:
      reuseInvokerKeyFor === "execution_approver"
        ? invoker.entry.publicKeyPem
        : "",
  });
  const bundle = bundleValue({ productionSigner, appSigner });
  const responseValue = { synthetic: "response" };
  const approverAllowlistValue = {
    contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
    entries: [approver.entry],
  };
  const baseObservations = {
    bundle: observation("bundle", bundleBytes, bundle),
    response: observation("response", "synthetic-response", responseValue),
    allowlist: observation(
      "allowlist",
      "synthetic-approver-allowlist",
      approverAllowlistValue,
    ),
  };
  const requestResult = await readyStep1142TResult(bundleBytes, bundle);
  assert.equal(requestResult.status, "request_ready");
  const verification = readyStep1142UResult(
    requestResult.approvalRequest,
    {
      bundle: baseObservations.bundle.sha256,
      response: baseObservations.response.sha256,
      allowlist: baseObservations.allowlist.sha256,
    },
    {
      signerKeyId: approver.entry.signerKeyId,
      signerId: approver.entry.signerId,
    },
  );
  const authorityPackage = buildMetricsCutoverExecutionAuthorityPackage(
    requestResult.approvalRequest,
    verification,
  );
  const invocation = signedInvocation(authorityPackage, invoker);
  const invokerAllowlist = {
    contractVersion: EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
    entries: [invoker.entry],
  };
  const observations = {
    ...baseObservations,
    invocation: observation(
      "invocation",
      JSON.stringify(invocation),
      invocation,
    ),
    invokerAllowlist: observation(
      "invokerAllowlist",
      JSON.stringify(invokerAllowlist),
      invokerAllowlist,
    ),
  };
  return {
    authorityPackage,
    authorityResult: readyAuthorityResult(authorityPackage),
    approver,
    appSigner,
    bundle,
    invocation,
    invoker,
    invokerAllowlist,
    observations,
    productionSigner,
    verification,
  };
}

async function runUnit(setup, changes = {}) {
  const counts = {
    bundle: 0,
    response: 0,
    allowlist: 0,
    invocation: 0,
    invokerAllowlist: 0,
    authority: 0,
    verification: 0,
  };
  const read = (kind) => async () => {
    const index = counts[kind]++;
    const replacement = changes[`${kind}At`]?.[index];
    return cloneObservation(replacement || setup.observations[kind]);
  };
  const readers = {
    observeBundle: read("bundle"),
    observeResponse: read("response"),
    observeApproverAllowlist: read("allowlist"),
    observeInvocation: read("invocation"),
    observeInvokerAllowlist: read("invokerAllowlist"),
  };
  const authorityResults = changes.authorityResults || [setup.authorityResult];
  const verifications = changes.verifications || [setup.verification];
  const runVerification = async () => structuredClone(
    verifications[Math.min(counts.verification++, verifications.length - 1)],
  );
  const runAuthority = async (_input, adapters) => {
    for (let index = 0; index < 22; index += 1) {
      await adapters.observeBundle("bundle");
    }
    for (let index = 0; index < 6; index += 1) {
      await adapters.observeResponse("response");
      await adapters.observeAllowlist("allowlist");
    }
    await adapters.runVerification({}, {});
    await adapters.runVerification({}, {});
    return structuredClone(
      authorityResults[
        Math.min(counts.authority++, authorityResults.length - 1)
      ],
    );
  };
  return runMetricsCutoverExecutionInvocationVerification(
    {
      repo: "repo",
      inputPath: "bundle",
      responsePath: "response",
      allowlistPath: "allowlist",
      invocationPath: "invocation",
      invokerAllowlistPath: "invokerAllowlist",
    },
    { ...readers, runAuthority, runVerification },
  );
}

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertSuppressed(result) {
  assert.deepEqual(result.invocationReceipt, {});
  for (const field of [
    "receiptId", "receiptHash", "invocationId", "invocationHash",
    "authorityPackageId", "authorityPackageHash", "verificationReceiptHash",
    "requestId", "requestHash", "operatorBundleSha256", "repositoryHeadSha",
    "repositoryTreeSha", "branchName", "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash", "executionPackageHash",
    "selectorPreimageSha256", "selectorPostimageSha256", "invokerKeyId",
    "invokerId", "invokedAt", "expiresAt",
  ]) assert.equal(result[field], "", field);
  assert.equal(result.targetFileCount, 0);
  assert.equal(result.plannedWriteCount, 0);
  assert.equal(result.plannedDeleteCount, 0);
  assertFixedFalse(result);
}

test("valid five-file A/S/B and Step 114-2V A/B produce a verified unconsumed receipt", async () => {
  const setup = await unitSetup();
  const result = await runUnit(setup);
  assert.equal(result.status, "execution_invocation_verified", result.blockingIssues.join(","));
  assert.equal(result.contractVersion, EXECUTION_INVOCATION_SUMMARY_CONTRACT_VERSION);
  assert.equal(result.policyVersion, EXECUTION_INVOCATION_POLICY_VERSION);
  assert.equal(result.executionInvocationVerified, true);
  assert.equal(result.singleUseReceiptReady, true);
  assert.equal(result.invocationReceipt.receiptStatus, INVOCATION_RECEIPT_STATUS);
  assert.deepEqual(result.invocationReceipt.receiptRequirements, INVOCATION_RECEIPT_REQUIREMENTS);
  assert.deepEqual(
    validateMetricsCutoverExecutionInvocationReceipt(result.invocationReceipt, {
      invocation: setup.invocation,
      authorityPackage: setup.authorityPackage,
    }),
    { ok: true, issues: [] },
  );
  const serialized = JSON.stringify(result);
  for (const marker of [
    setup.invocation.invocationNonce,
    setup.invocation.signatureBase64,
    "PUBLIC KEY",
    "publicKeyPem",
    "finalApprovalInput",
    "C:\\synthetic",
    "7:46",
  ]) assert.equal(serialized.includes(marker), false, marker);
  assertFixedFalse(result);
});

test("invocation and receipt IDs, hashes, canonical bytes, and signature payload are deterministic", async () => {
  const setup = await unitSetup();
  assert.equal(
    setup.invocation.invocationId,
    recomputeMetricsCutoverExecutionInvocationId(setup.invocation),
  );
  assert.equal(
    canonicalizeMetricsCutoverExecutionInvocation(setup.invocation),
    canonicalizeMetricsCutoverExecutionInvocation(structuredClone(setup.invocation)),
  );
  assert.deepEqual(
    buildMetricsCutoverExecutionInvocationSignaturePayload(setup.invocation),
    buildMetricsCutoverExecutionInvocationSignaturePayload(structuredClone(setup.invocation)),
  );
  const first = buildMetricsCutoverExecutionInvocationReceipt(
    setup.invocation,
    setup.authorityPackage,
  );
  const second = buildMetricsCutoverExecutionInvocationReceipt(
    structuredClone(setup.invocation),
    structuredClone(setup.authorityPackage),
  );
  assert.equal(first.receiptId, second.receiptId);
  assert.equal(first.receiptHash, second.receiptHash);
  assert.equal(
    canonicalizeMetricsCutoverExecutionInvocationReceipt(first),
    canonicalizeMetricsCutoverExecutionInvocationReceipt(second),
  );
  assert.equal(first.receiptId, recomputeMetricsCutoverExecutionInvocationReceiptId(first));
  assert.equal(first.receiptHash, hashMetricsCutoverExecutionInvocationReceipt(first));
  assert.equal(first.invocationHash, hashMetricsCutoverExecutionInvocation(setup.invocation));
  assert.equal(JSON.stringify(first).includes(setup.invocation.invocationNonce), false);
});

test("invocation ID and receipt ID/hash tampering fail closed", async (t) => {
  const setup = await unitSetup();
  await t.test("invocation ID", () => {
    const value = structuredClone(setup.invocation);
    value.invocationId = `metrics-cutover-execution-invocation-${"f".repeat(64)}`;
    const validation = validateMetricsCutoverExecutionInvocation(value);
    assert.equal(validation.ok, false);
    assert.ok(validation.issues.includes("execution_invocation_id_mismatch"));
  });
  const receipt = buildMetricsCutoverExecutionInvocationReceipt(
    setup.invocation,
    setup.authorityPackage,
  );
  for (const [name, field, issue] of [
    ["receipt ID", "receiptId", "invocation_receipt_id_mismatch"],
    ["receipt hash", "receiptHash", "invocation_receipt_hash_mismatch"],
    ["invocation hash", "invocationHash", "invocation_receipt_id_mismatch"],
  ]) {
    await t.test(name, () => {
      const value = structuredClone(receipt);
      value[field] = field === "receiptId"
        ? `metrics-cutover-execution-invocation-receipt-${"f".repeat(64)}`
        : "f".repeat(64);
      const validation = validateMetricsCutoverExecutionInvocationReceipt(value);
      assert.equal(validation.ok, false);
      assert.ok(validation.issues.includes(issue), validation.issues.join(","));
    });
  }
});

test("authority, repository, selector, target, request, receipt, package, nonce, and count drift block", async (t) => {
  const setup = await unitSetup();
  const fields = [
    "authorityPackageHash", "requestHash", "verificationReceiptHash",
    "operatorBundleSha256", "repositoryHeadSha", "repositoryTreeSha",
    "trackedPathsSha256", "targetPathAbsenceEvidenceHash",
    "executionPackageHash", "selectorPreimageSha256", "selectorPostimageSha256",
  ];
  for (const field of fields) {
    await t.test(field, () => {
      const value = structuredClone(setup.invocation);
      value[field] = field.endsWith("Sha") ? "f".repeat(40) : "f".repeat(64);
      const validation = validateMetricsCutoverExecutionInvocation(value, {
        authorityPackage: setup.authorityPackage,
        evaluationNow: EVALUATION_NOW,
      });
      assert.equal(validation.ok, false);
    });
  }
  for (const mutate of [
    (value) => { value.targets[0].rowCount += 1; },
    (value) => { value.plannedWriteCount = 1; },
    (value) => { value.plannedDeleteCount = 1; },
    (value) => { value.invocationNonce = "different_nonce_0123456789abcdef"; },
  ]) {
    const value = structuredClone(setup.invocation);
    mutate(value);
    assert.equal(validateMetricsCutoverExecutionInvocation(value, {
      authorityPackage: setup.authorityPackage,
      evaluationNow: EVALUATION_NOW,
    }).ok, false);
  }
});

test("exact millisecond time policy and canonical timestamps fail closed", async (t) => {
  const setup = await unitSetup();
  const cases = [
    ["future edge", { invokedAt: "2026-07-17T01:01:00.000Z", expiresAt: "2026-07-17T01:05:00.000Z" }, true],
    ["future over", { invokedAt: "2026-07-17T01:01:00.001Z", expiresAt: "2026-07-17T01:05:00.000Z" }, false],
    ["age edge", { invokedAt: "2026-07-17T00:50:00.000Z", expiresAt: "2026-07-17T01:05:00.000Z" }, true],
    ["age over", { invokedAt: "2026-07-17T00:49:59.999Z", expiresAt: "2026-07-17T01:00:01.000Z" }, false],
    ["expired", { invokedAt: "2026-07-17T00:55:00.000Z", expiresAt: EVALUATION_NOW }, false],
    ["lifetime over", { invokedAt: "2026-07-17T00:55:00.000Z", expiresAt: "2026-07-17T01:10:00.001Z" }, false],
    ["calendar", { invokedAt: "2026-02-30T00:00:00.000Z" }, false],
    ["timezone", { invokedAt: "2026-07-17T00:55:00.000+00:00" }, false],
  ];
  for (const [name, overrides, expected] of cases) {
    await t.test(name, () => {
      const value = ["calendar", "timezone"].includes(name)
        ? Object.assign(structuredClone(setup.invocation), overrides)
        : signedInvocation(setup.authorityPackage, setup.invoker, overrides);
      assert.equal(validateMetricsCutoverExecutionInvocation(value, {
        authorityPackage: setup.authorityPackage,
        evaluationNow: EVALUATION_NOW,
      }).ok, expected);
    });
  }
});

test("operator-bundle evaluationNow preserves ISO instant compatibility", async () => {
  const setup = await unitSetup();
  const withoutFraction = validateMetricsCutoverExecutionInvocation(
    setup.invocation,
    {
      authorityPackage: setup.authorityPackage,
      evaluationNow: "2026-07-17T01:00:00Z",
    },
  );
  const offset = validateMetricsCutoverExecutionInvocation(setup.invocation, {
    authorityPackage: setup.authorityPackage,
    evaluationNow: "2026-07-17T10:00:00+09:00",
  });
  assert.deepEqual(withoutFraction, { ok: true, issues: [] });
  assert.deepEqual(offset, withoutFraction);
  const malformed = validateMetricsCutoverExecutionInvocation(
    setup.invocation,
    {
      authorityPackage: setup.authorityPackage,
      evaluationNow: "2026-07-17 01:00:00Z",
    },
  );
  assert.equal(malformed.ok, false);
  assert.ok(
    malformed.issues.includes("execution_invocation_evaluation_now_invalid"),
  );
});

test("standalone invocation and receipt validators enforce complete target semantics", async (t) => {
  const setup = await unitSetup();
  const cases = [
    ["wrong order and role", (targets) => targets.reverse()],
    ["wrong market", (targets) => { targets[0].market = "KR"; }],
    [
      "unsafe path",
      (targets) => { targets[0].path = "src/data/tickers/../unsafe.csv"; },
    ],
    [
      "case-fold collision",
      (targets) => {
        targets[0].path = "src/data/tickers/Future_Target.csv";
        targets[1].path = "src/data/tickers/future_target.csv";
      },
    ],
    [
      "NFC collision",
      (targets) => {
        targets[0].path = "src/data/tickers/future_caf\u00e9.csv";
        targets[1].path = "src/data/tickers/future_cafe\u0301.csv";
      },
    ],
    ["malformed hash", (targets) => { targets[0].sha256 = "A".repeat(64); }],
    ["zero byte size", (targets) => { targets[0].byteSize = 0; }],
    ["zero row count", (targets) => { targets[0].rowCount = 0; }],
    [
      "wrong schema version",
      (targets) => { targets[0].schemaVersion = "wrong"; },
    ],
    ["overwrite write mode", (targets) => { targets[0].writeMode = "overwrite"; }],
  ];
  const validReceipt = buildMetricsCutoverExecutionInvocationReceipt(
    setup.invocation,
    setup.authorityPackage,
  );
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const invocation = structuredClone(setup.invocation);
      mutate(invocation.targets);
      const invocationValidation =
        validateMetricsCutoverExecutionInvocation(invocation);
      assert.equal(invocationValidation.ok, false, name);
      assert.ok(
        invocationValidation.issues.some((issue) =>
          issue.startsWith("execution_invocation_")),
        invocationValidation.issues.join(","),
      );

      const receipt = structuredClone(validReceipt);
      mutate(receipt.targets);
      receipt.receiptHash = rehashReceiptForTest(receipt);
      const receiptValidation =
        validateMetricsCutoverExecutionInvocationReceipt(receipt);
      assert.equal(receiptValidation.ok, false, name);
      assert.ok(
        receiptValidation.issues.some((issue) =>
          issue.startsWith("invocation_receipt_")),
        receiptValidation.issues.join(","),
      );
      assert.equal(
        receiptValidation.issues.includes("invocation_receipt_hash_mismatch"),
        false,
      );
    });
  }
});

test("invoker allowlist key, alias, role, scope, revocation, signer reuse, and signature fail closed", async (t) => {
  const setup = await unitSetup();
  const duplicateKey = { ...setup.invoker.entry, invokerKeyId: "alias-key", invokerId: "alias-id" };
  const normalizationCases = [
    ["role", { ...setup.invoker.entry, roles: ["wrong"] }],
    ["scope", { ...setup.invoker.entry, allowedScopes: ["wrong"] }],
    ["revoked", { ...setup.invoker.entry, revoked: true }],
  ];
  for (const [name, entry] of normalizationCases) {
    await t.test(name, () => {
      assert.equal(normalizeMetricsCutoverExecutionInvokerAllowlist({
        contractVersion: EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
        entries: [entry],
      }).ok, false);
    });
  }
  assert.equal(normalizeMetricsCutoverExecutionInvokerAllowlist({
    contractVersion: EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
    entries: [setup.invoker.entry, duplicateKey],
  }).ok, false);
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  assert.equal(normalizeMetricsCutoverExecutionInvokerAllowlist({
    contractVersion: EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
    entries: [{ ...setup.invoker.entry, publicKeyPem: rsa.publicKey.export({ type: "spki", format: "pem" }) }],
  }).ok, false);

  const reused = structuredClone(setup.invocation);
  reused.invokerKeyId = "production-key";
  reused.invokerId = "production-signer";
  reused.invocationId = recomputeMetricsCutoverExecutionInvocationId(reused);
  reused.signatureBase64 = sign(null, buildMetricsCutoverExecutionInvocationSignaturePayload(reused), setup.invoker.privateKey).toString("base64");
  const reusedObservation = observation("invocation", JSON.stringify(reused), reused);
  const reusedResult = await runUnit(setup, { invocationAt: { 0: reusedObservation, 1: reusedObservation, 2: reusedObservation } });
  assert.equal(reusedResult.status, "blocked");
  assert.ok(reusedResult.blockingIssues.includes("execution_invoker_key_id_reused"));
  assertSuppressed(reusedResult);

  const forged = structuredClone(setup.invocation);
  forged.signatureBase64 = Buffer.alloc(64, 7).toString("base64");
  const forgedObservation = observation("invocation", JSON.stringify(forged), forged);
  const forgedResult = await runUnit(setup, { invocationAt: { 0: forgedObservation, 1: forgedObservation, 2: forgedObservation } });
  assert.equal(forgedResult.status, "blocked");
  assert.ok(forgedResult.blockingIssues.includes("execution_invocation_signature_verification_failed"));
  assertSuppressed(forgedResult);
});

test("invoker public-key fingerprint reuse blocks across all three prior signer roles", async (t) => {
  for (const role of [
    "production_publish",
    "app_export",
    "execution_approver",
  ]) {
    await t.test(role, async () => {
      const setup = await unitSetup({ reuseInvokerKeyFor: role });
      const result = await runUnit(setup);
      assert.equal(result.status, "blocked");
      assert.ok(
        result.blockingIssues.includes(
          `execution_invoker_public_key_reused:${role}`,
        ),
        result.blockingIssues.join(","),
      );
      assertSuppressed(result);
      const serialized = JSON.stringify(result);
      assert.equal(serialized.includes("PUBLIC KEY"), false);
      assert.equal(serialized.includes("fingerprint"), false);
    });
  }
});

test("all five input files block transient consumed swaps even when outer values match", async (t) => {
  const setup = await unitSetup();
  for (const kind of ["bundle", "response", "allowlist", "invocation", "invokerAllowlist"]) {
    await t.test(kind, async () => {
      const source = setup.observations[kind];
      const swapped = cloneObservation(source);
      swapped.bytes = Buffer.from(`different-${kind}`);
      swapped.byteSize = swapped.bytes.length;
      swapped.sha256 = sha256(swapped.bytes);
      const result = await runUnit(setup, { [`${kind}At`]: { 1: swapped } });
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.some((issue) => issue.includes("consumed_")), result.blockingIssues.join(","));
      assertSuppressed(result);
    });
  }
});

test("Step 114-2V A/B drift and inherited non-false outputs block", async (t) => {
  const setup = await unitSetup();
  const differentPackage = structuredClone(setup.authorityPackage);
  differentPackage.verificationReceiptHash = "f".repeat(64);
  differentPackage.authorityPackageId =
    recomputeMetricsCutoverExecutionAuthorityPackageId(differentPackage);
  differentPackage.authorityPackageHash =
    hashMetricsCutoverExecutionAuthorityPackage(differentPackage);
  const drift = await runUnit(setup, {
    authorityResults: [setup.authorityResult, readyAuthorityResult(differentPackage)],
  });
  assert.equal(drift.status, "blocked");
  assertSuppressed(drift);

  for (const field of ["fileWriteAuthorized", "executionAuthorized"]) {
    await t.test(field, async () => {
      const tampered = structuredClone(setup.authorityResult);
      tampered[field] = true;
      const result = await runUnit(setup, { authorityResults: [tampered] });
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.includes(`step114_2v_a_fixed_false_invalid:${field}`));
      assertSuppressed(result);
    });
  }
});

function temporaryDirectory(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-step114-2w-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test("descriptor readers reject duplicate keys, malformed JSON, and oversized files", (t) => {
  const root = temporaryDirectory(t);
  const invocationPath = path.join(root, "invocation.json");
  const allowlistPath = path.join(root, "allowlist.json");
  writeFileSync(invocationPath, '{"contractVersion":"x","contractVersion":"y"}', "utf8");
  writeFileSync(allowlistPath, '{"contractVersion":"x","entries":[],"entries":[]}', "utf8");
  const invocation = readMetricsCutoverExecutionInvocationObservation(invocationPath);
  const allowlist = readMetricsCutoverExecutionInvokerAllowlistObservation(allowlistPath);
  assert.equal(invocation.ok, false);
  assert.ok(invocation.blockingIssues.some((issue) => issue.includes("duplicate_json_object_key")));
  assert.equal(allowlist.ok, false);
  assert.ok(allowlist.blockingIssues.some((issue) => issue.includes("duplicate_json_object_key")));
  writeFileSync(invocationPath, "x".repeat(32), "utf8");
  assert.equal(readMetricsCutoverExecutionInvocationObservation(invocationPath, { maxInputBytes: 8 }).ok, false);
});

test("missing, extra, malformed, and non-canonical invocation values block", async (t) => {
  const setup = await unitSetup();
  const cases = [
    ["missing", (value) => { delete value.requestHash; }],
    ["extra", (value) => { value.extra = true; }],
    ["attestation", (value) => { value.attestations.executionNotYetPerformed = false; }],
    ["base64", (value) => { value.signatureBase64 = `${value.signatureBase64.slice(0, -2)}AB`; }],
    ["nonce", (value) => { value.invocationNonce = "short"; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const value = structuredClone(setup.invocation);
      mutate(value);
      assert.equal(validateMetricsCutoverExecutionInvocation(value).ok, false);
    });
  }
});

test("idle and blocked results suppress all identities and keep authorization false", async () => {
  assertSuppressed(await runMetricsCutoverExecutionInvocationVerification({}));
  assertSuppressed(await runMetricsCutoverExecutionInvocationVerification({ repo: "x" }));
  const setup = await unitSetup();
  const blocked = structuredClone(setup.authorityResult);
  blocked.status = "blocked";
  assertSuppressed(await runUnit(setup, { authorityResults: [blocked] }));
});

test("CLI accepts exactly six unique flags and maps ready, blocked, and runtime to 0/1/2", async () => {
  const args = [
    "--repo", "r", "--input", "i", "--response", "s",
    "--allowlist", "a", "--invocation", "v", "--invoker-allowlist", "k",
  ];
  assert.deepEqual(parseArguments(args), {
    repo: "r", inputPath: "i", responsePath: "s", allowlistPath: "a",
    invocationPath: "v", invokerAllowlistPath: "k",
  });
  assert.equal(parseArguments(args.slice(0, -2)), null);
  let stdout = "";
  assert.equal(await runCli(args, {
    runVerification: async () => ({ status: "execution_invocation_verified" }),
    stdout: (value) => { stdout += value; }, stderr: () => {},
  }), 0);
  assert.equal(stdout.trim().split("\n").length, 1);
  assert.equal(await runCli(args, {
    runVerification: async () => ({ status: "blocked" }),
    stdout: () => {}, stderr: () => {},
  }), 1);
  stdout = "";
  assert.equal(await runCli(["--repo", "r"], {
    stdout: (value) => { stdout += value; }, stderr: () => {},
  }), 2);
  assert.equal(JSON.parse(stdout).status, "idle");
});

function makeApprover({ publicKeyPem = "" } = {}) {
  const pair = generateKeyPairSync("ed25519");
  return {
    privateKey: pair.privateKey,
    entry: {
      signerKeyId: "execution-approver-key",
      signerId: "execution-approver",
      publicKeyPem:
        publicKeyPem ||
        pair.publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: [APPROVAL_SCOPE],
      roles: [APPROVER_ROLE],
      revoked: false,
    },
  };
}

function signedApprovalResponse(request, approver, issuedAt, expiresAt) {
  const response = {
    contractVersion: APPROVAL_RESPONSE_CONTRACT_VERSION,
    responseId: "",
    requestId: request.requestId,
    requestHash: request.requestHash,
    operatorBundleSha256: request.operatorBundleSha256,
    repositoryHeadSha: request.repositoryHeadSha,
    repositoryTreeSha: request.repositoryTreeSha,
    executionPackageHash: request.executionPackageHash,
    approvalScope: APPROVAL_SCOPE,
    decision: "approved",
    issuedAt,
    expiresAt,
    signerKeyId: approver.entry.signerKeyId,
    signerId: approver.entry.signerId,
    signatureAlgorithm: "Ed25519",
    attestations: { ...ATTESTATION_FACTS },
    signatureBase64: Buffer.alloc(64).toString("base64"),
  };
  response.responseId = recomputeMetricsCutoverExecutionApprovalResponseId(response);
  response.signatureBase64 = sign(
    null,
    buildMetricsCutoverExecutionApprovalSignaturePayload(response),
    approver.privateKey,
  ).toString("base64");
  return response;
}

test("real production-default Step 114-2V A/B and actual Step 114-2W CLI verify a runtime-signed invocation", { timeout: 180_000 }, async (t) => {
  const root = temporaryDirectory(t);
  const repositoryRoot = path.join(root, "repository");
  const bundlePath = path.join(root, "operator-bundle.json");
  const responsePath = path.join(root, "response.json");
  const allowlistPath = path.join(root, "approver-allowlist.json");
  const invocationPath = path.join(root, "invocation.json");
  const invokerAllowlistPath = path.join(root, "invoker-allowlist.json");
  const repository = await createIsolatedMetricsRepository(REPO_ROOT, repositoryRoot);
  const bundle = await buildRealSyntheticOperatorBundle(REPO_ROOT, repository);
  writeFileSync(bundlePath, JSON.stringify(bundle), "utf8");
  const request = await runMetricsCutoverExecutionApprovalRequest({ repo: repositoryRoot, inputPath: bundlePath });
  assert.equal(request.status, "request_ready", request.blockingIssues.join(","));
  const approver = makeApprover();
  const now = Date.parse(bundle.evaluationNow);
  const response = signedApprovalResponse(
    request.approvalRequest,
    approver,
    new Date(now - 600_000).toISOString(),
    new Date(now + 600_000).toISOString(),
  );
  writeFileSync(responsePath, JSON.stringify(response), "utf8");
  writeFileSync(allowlistPath, JSON.stringify({
    contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
    entries: [approver.entry],
  }), "utf8");
  const authority = await runMetricsCutoverExecutionAuthorityPackage({
    repo: repositoryRoot,
    inputPath: bundlePath,
    responsePath,
    allowlistPath,
  });
  assert.equal(authority.status, "authority_package_ready", authority.blockingIssues.join(","));
  const invoker = makeInvoker();
  const invocation = signedInvocation(authority.authorityPackage, invoker, {
    invokedAt: new Date(now - 5 * 60 * 1000).toISOString(),
    expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
  });
  writeFileSync(invocationPath, JSON.stringify(invocation), "utf8");
  writeFileSync(invokerAllowlistPath, JSON.stringify({
    contractVersion: EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
    entries: [invoker.entry],
  }), "utf8");

  const direct = await runMetricsCutoverExecutionInvocationVerification({
    repo: repositoryRoot,
    inputPath: bundlePath,
    responsePath,
    allowlistPath,
    invocationPath,
    invokerAllowlistPath,
  });
  assert.equal(direct.status, "execution_invocation_verified", direct.blockingIssues.join(","));
  assertFixedFalse(direct);

  const cli = spawnSync(process.execPath, [
    path.join(REPO_ROOT, "scripts/verify-metrics-cutover-execution-invocation.cjs"),
    "--repo", repositoryRoot,
    "--input", bundlePath,
    "--response", responsePath,
    "--allowlist", allowlistPath,
    "--invocation", invocationPath,
    "--invoker-allowlist", invokerAllowlistPath,
  ], { cwd: REPO_ROOT, encoding: "utf8", timeout: 180_000 });
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  assert.equal(cli.stdout.trim().split("\n").length, 1);
  const parsed = JSON.parse(cli.stdout);
  assert.equal(parsed.status, "execution_invocation_verified");
  for (const secret of [
    invocation.invocationNonce,
    invocation.signatureBase64,
    "PUBLIC KEY",
    "publicKeyPem",
    "contentBase64",
  ]) assert.equal(cli.stdout.includes(secret), false, secret);
});

test("Step 114-2W source contains no write, Git, network, signing, or execution action", () => {
  const source = readFileSync(
    path.join(REPO_ROOT, "scripts/lib/metrics-cutover-execution-invocation.cjs"),
    "utf8",
  );
  for (const forbidden of [
    "writeFileSync", "execSync", "spawnSync", "generateKeyPair",
    "createPrivateKey", "sign(", "fetch(", "Date.now",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});
