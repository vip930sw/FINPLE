const assert = require("node:assert/strict");
const { createHash, generateKeyPairSync, sign } = require("node:crypto");
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
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
  APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
  APPROVAL_SCOPE,
  APPROVER_ROLE,
  ATTESTATION_FACTS,
  EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS: STEP114_2U_FIXED_FALSE_FIELDS,
  buildMetricsCutoverExecutionApprovalSignaturePayload,
  recomputeMetricsCutoverExecutionApprovalResponseId,
} = require("./lib/metrics-cutover-execution-approval-response.cjs");
const {
  AUTHORITY_PACKAGE_CONTRACT_VERSION,
  AUTHORITY_PACKAGE_FIELDS,
  AUTHORITY_POLICY_VERSION,
  AUTHORITY_REQUIREMENTS,
  AUTHORITY_STATUS,
  FIXED_FALSE_FIELDS,
  buildMetricsCutoverExecutionAuthorityPackage,
  canonicalizeMetricsCutoverExecutionAuthorityPackage,
  hashMetricsCutoverExecutionAuthorityPackage,
  recomputeMetricsCutoverExecutionAuthorityPackageId,
  runMetricsCutoverExecutionAuthorityPackage,
  validateMetricsCutoverExecutionAuthorityPackage,
} = require("./lib/metrics-cutover-execution-authority-package.cjs");
const { parseArguments, runCli } = require("./build-metrics-cutover-execution-authority-package.cjs");
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

function fixedFalse(fields) {
  return Object.fromEntries(fields.map((field) => [field, false]));
}

function target(role) {
  const us = role === "us_price_metrics";
  return {
    role,
    path: `src/data/tickers/future_step114_2v_${us ? "us" : "kr"}.csv`,
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
    branchName: "review/step114-2v",
    trackedPathsSha256: "c".repeat(64),
    targetPathAbsenceEvidenceHash: "d".repeat(64),
    candidatePackageId: "candidate-step114-2v-synthetic",
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

function bundleValue() {
  return {
    evaluationNow: EVALUATION_NOW,
    finalApprovalInput: {
      productionApprovalReceipt: { signerKeyId: "production-key", signerId: "production-signer" },
      appExportApprovalReceipt: { signerKeyId: "app-key", signerId: "app-signer" },
    },
  };
}

function observation(kind, bytes = Buffer.from(`synthetic-${kind}`), overrides = {}) {
  const value = {
    ok: true,
    blockingIssues: [],
    canonicalInputPath: `C:\\synthetic\\${kind}.json`,
    bytes: Buffer.from(bytes),
    byteSize: bytes.length,
    sha256: sha256(bytes),
    fileIdentity: `7:${kind === "bundle" ? 42 : kind === "response" ? 50 : 51}`,
    fileIdentitySupported: true,
    ...overrides,
  };
  if (kind === "bundle") value.bundle = bundleValue();
  return value;
}

async function readyStep1142TResult(bundleBytes = Buffer.from("synthetic-bundle")) {
  return runMetricsCutoverExecutionApprovalRequest(
    { repo: "C:\\synthetic-repo", inputPath: "C:\\synthetic\\bundle.json" },
    {
      observeBundle: async () => observation("bundle", bundleBytes),
      runDryRun: async (_input, adapters) => {
        await adapters.readBundle("C:\\synthetic\\bundle.json");
        return readyDryRun();
      },
    },
  );
}

function readyStep1142UResult(request, overrides = {}) {
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
    responseFileSha256: "b".repeat(64),
    allowlistFileSha256: "c".repeat(64),
    operatorBundleSha256: request.operatorBundleSha256,
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

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertSuppressed(result) {
  assert.deepEqual(result.authorityPackage, {});
  for (const field of [
    "authorityPackageId", "authorityPackageHash", "verificationReceiptHash",
    "requestId", "requestHash", "responseId", "responseHash",
    "executionPackageHash", "repositoryHeadSha", "repositoryTreeSha", "branchName",
  ]) assert.equal(result[field], "", field);
  assert.equal(result.targetFileCount, 0);
  assert.equal(result.plannedWriteCount, 0);
  assert.equal(result.plannedDeleteCount, 0);
  assertFixedFalse(result);
}

async function unitSetup() {
  const requestResult = await readyStep1142TResult();
  assert.equal(requestResult.status, "request_ready", requestResult.blockingIssues.join(","));
  const observations = {
    bundle: observation("bundle"),
    response: observation("response"),
    allowlist: observation("allowlist"),
  };
  return {
    requestResult,
    verification: readyStep1142UResult(requestResult.approvalRequest, {
      operatorBundleSha256: observations.bundle.sha256,
      responseFileSha256: observations.response.sha256,
      allowlistFileSha256: observations.allowlist.sha256,
    }),
    observations,
  };
}

function clone(value) {
  return structuredClone(value);
}

async function runUnit(setup, changes = {}) {
  const counts = { bundle: 0, response: 0, allowlist: 0, request: 0, verification: 0 };
  const read = (kind) => async () => {
    const index = counts[kind]++;
    const replacement = changes[`${kind}At`]?.[index];
    const source = replacement || setup.observations[kind];
    return { ...clone(source), bytes: Buffer.from(source.bytes) };
  };
  const readers = {
    observeBundle: read("bundle"),
    observeResponse: read("response"),
    observeAllowlist: read("allowlist"),
  };
  const requestResults = changes.requestResults || [setup.requestResult];
  const verificationResults = changes.verificationResults || [setup.verification];
  const runApprovalRequest = async (_input, adapters = {}) => {
    const reader = adapters.observeBundle || readers.observeBundle;
    await reader("bundle");
    await reader("bundle");
    await reader("bundle");
    const result = requestResults[Math.min(counts.request++, requestResults.length - 1)];
    return clone(result);
  };
  const runVerification = async (_input, adapters = {}) => {
    await adapters.observeResponse("response");
    await adapters.observeAllowlist("allowlist");
    await adapters.runApprovalRequest({});
    await adapters.observeBundle("bundle");
    await adapters.runApprovalRequest({});
    await adapters.observeResponse("response");
    await adapters.observeAllowlist("allowlist");
    const result = verificationResults[
      Math.min(counts.verification++, verificationResults.length - 1)
    ];
    return clone(result);
  };
  return runMetricsCutoverExecutionAuthorityPackage(
    { repo: "repo", inputPath: "bundle", responsePath: "response", allowlistPath: "allowlist" },
    { ...readers, runApprovalRequest, runVerification },
  );
}

test("valid A/U/T/package/T/U/B observations produce a sealed non-executing authority package", async () => {
  const setup = await unitSetup();
  const result = await runUnit(setup);
  assert.equal(result.status, "authority_package_ready", result.blockingIssues.join(","));
  assert.equal(result.ok, true);
  assert.equal(result.authorityPackage.contractVersion, AUTHORITY_PACKAGE_CONTRACT_VERSION);
  assert.equal(result.authorityPackage.policyVersion, AUTHORITY_POLICY_VERSION);
  assert.equal(result.authorityPackage.authorityStatus, AUTHORITY_STATUS);
  assert.deepEqual(result.authorityPackage.authorityRequirements, AUTHORITY_REQUIREMENTS);
  assert.deepEqual(Object.keys(result.authorityPackage), [...AUTHORITY_PACKAGE_FIELDS]);
  assert.deepEqual(validateMetricsCutoverExecutionAuthorityPackage(result.authorityPackage), { ok: true, issues: [] });
  assert.equal(result.authorityPackageId, recomputeMetricsCutoverExecutionAuthorityPackageId(result.authorityPackage));
  assert.equal(result.authorityPackageHash, hashMetricsCutoverExecutionAuthorityPackage(result.authorityPackage));
  const serialized = JSON.stringify(result);
  for (const marker of [
    "synthetic-bundle",
    "finalApprovalInput",
    "execution-approver",
    "signatureBase64",
    "publicKeyPem",
    "contentBase64",
    "C:\\\\synthetic",
    "7:42",
  ]) {
    assert.equal(serialized.includes(marker), false, marker);
  }
  assertFixedFalse(result);
});

test("canonical package ID and hash are deterministic and mutations remain bound", async () => {
  const setup = await unitSetup();
  const first = buildMetricsCutoverExecutionAuthorityPackage(setup.requestResult.approvalRequest, setup.verification);
  const second = buildMetricsCutoverExecutionAuthorityPackage(clone(setup.requestResult.approvalRequest), clone(setup.verification));
  assert.equal(canonicalizeMetricsCutoverExecutionAuthorityPackage(first), canonicalizeMetricsCutoverExecutionAuthorityPackage(second));
  assert.equal(first.authorityPackageId, second.authorityPackageId);
  assert.equal(first.authorityPackageHash, second.authorityPackageHash);
  const mutated = clone(first);
  mutated.targets[0].sha256 = "f".repeat(64);
  assert.equal(validateMetricsCutoverExecutionAuthorityPackage(mutated).ok, false);
});

test("package schema, targets, counts, policy, and hashes fail closed", async (t) => {
  const setup = await unitSetup();
  const baseline = buildMetricsCutoverExecutionAuthorityPackage(setup.requestResult.approvalRequest, setup.verification);
  const cases = [
    ["missing field", (v) => { delete v.responseHash; }],
    ["extra field", (v) => { v.extra = true; }],
    ["policy", (v) => { v.policyVersion = "wrong"; }],
    ["authority", (v) => { v.authorityRequirements.allowTargetDeletion = true; }],
    ["target role", (v) => { v.targets[0].role = "kr_price_metrics"; }],
    ["target collision", (v) => { v.targets[1].path = v.targets[0].path.toUpperCase(); }],
    ["write mode", (v) => { v.targets[0].writeMode = "overwrite"; }],
    ["row count", (v) => { v.targets[0].rowCount = 0; }],
    ["planned write", (v) => { v.plannedWriteCount = 1; }],
    ["planned delete", (v) => { v.plannedDeleteCount = 1; }],
    ["package hash", (v) => { v.authorityPackageHash = "f".repeat(64); }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const value = clone(baseline);
      mutate(value);
      assert.equal(validateMetricsCutoverExecutionAuthorityPackage(value).ok, false);
    });
  }
});

test("transient consumed bundle, response, and allowlist swaps block even when outer A and B match", async (t) => {
  const setup = await unitSetup();
  for (const kind of ["bundle", "response", "allowlist"]) {
    await t.test(kind, async () => {
      const swapped = observation(kind, Buffer.from(`different-valid-${kind}`));
      const result = await runUnit(setup, { [`${kind}At`]: { 1: swapped } });
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.some((issue) => issue.includes(`${kind}_consumed_`)), result.blockingIssues.join(","));
      assertSuppressed(result);
    });
  }
});

test("outer A/B drift and Step 114-2T/2U source drift block with package suppression", async (t) => {
  const setup = await unitSetup();
  const changedRequest = clone(setup.requestResult);
  changedRequest.approvalRequest.targets[0].rowCount += 1;
  const changedVerification = clone(setup.verification);
  changedVerification.verificationReceiptHash = "f".repeat(64);
  const cases = [
    ["outer response", { responseAt: { 5: observation("response", Buffer.from("changed")) } }],
    ["T A/B", { requestResults: [setup.requestResult, setup.requestResult, setup.requestResult, changedRequest] }],
    ["U A/B", { verificationResults: [setup.verification, changedVerification] }],
    ["U fixed false", { verificationResults: [readyStep1142UResult(setup.requestResult.approvalRequest, { executionAuthorized: true })] }],
  ];
  for (const [name, changes] of cases) {
    await t.test(name, async () => {
      const result = await runUnit(setup, changes);
      assert.equal(result.status, "blocked");
      assertSuppressed(result);
    });
  }
});

test("idle, invalid, and blocked results suppress every package identity", async () => {
  assertSuppressed(await runMetricsCutoverExecutionAuthorityPackage({}));
  assertSuppressed(await runMetricsCutoverExecutionAuthorityPackage({ repo: "x" }));
  const setup = await unitSetup();
  const blocked = clone(setup.requestResult);
  blocked.status = "blocked";
  assertSuppressed(await runUnit(setup, { requestResults: [blocked] }));
});

test("CLI accepts exactly four unique flags and maps ready/blocked/runtime to 0/1/2", async () => {
  const args = ["--repo", "r", "--input", "i", "--response", "s", "--allowlist", "a"];
  assert.deepEqual(parseArguments(args), { repo: "r", inputPath: "i", responsePath: "s", allowlistPath: "a" });
  assert.equal(parseArguments(["--repo", "r"]), null);
  assert.equal(parseArguments([...args.slice(0, 6), "--response", "a"]), null);
  let stdout = "";
  const ready = await runCli(args, {
    runAuthorityPackage: async () => ({ status: "authority_package_ready" }),
    stdout: (value) => { stdout += value; }, stderr: () => {},
  });
  assert.equal(ready, 0);
  assert.equal(stdout.trim().split("\n").length, 1);
  stdout = "";
  assert.equal(await runCli(args, { runAuthorityPackage: async () => ({ status: "blocked" }), stdout: (v) => { stdout += v; }, stderr: () => {} }), 1);
  stdout = "";
  assert.equal(await runCli(["--repo", "r"], { stdout: (v) => { stdout += v; }, stderr: () => {} }), 2);
  assert.equal(JSON.parse(stdout).status, "idle");
});

function temporaryDirectory(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-step114-2v-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function makeApprover() {
  const pair = generateKeyPairSync("ed25519");
  return {
    privateKey: pair.privateKey,
    entry: {
      signerKeyId: "execution-approver-key",
      signerId: "execution-approver",
      publicKeyPem: pair.publicKey.export({ type: "spki", format: "pem" }),
      allowedScopes: [APPROVAL_SCOPE],
      roles: [APPROVER_ROLE],
      revoked: false,
    },
  };
}

function signedResponse(request, approver, issuedAt, expiresAt) {
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
  response.signatureBase64 = sign(null, buildMetricsCutoverExecutionApprovalSignaturePayload(response), approver.privateKey).toString("base64");
  return response;
}

test("production-default real Step 114-2T/2U integration and actual 2V CLI return one redacted ready line", { timeout: 120_000 }, async (t) => {
  const root = temporaryDirectory(t);
  const repositoryRoot = path.join(root, "repository");
  const bundlePath = path.join(root, "operator-bundle.json");
  const responsePath = path.join(root, "response.json");
  const allowlistPath = path.join(root, "allowlist.json");
  const repository = await createIsolatedMetricsRepository(REPO_ROOT, repositoryRoot);
  const bundle = await buildRealSyntheticOperatorBundle(REPO_ROOT, repository);
  writeFileSync(bundlePath, JSON.stringify(bundle), "utf8");
  const request = await runMetricsCutoverExecutionApprovalRequest({ repo: repositoryRoot, inputPath: bundlePath });
  assert.equal(request.status, "request_ready", request.blockingIssues.join(","));
  const approver = makeApprover();
  const now = Date.parse(bundle.evaluationNow);
  const response = signedResponse(request.approvalRequest, approver, new Date(now - 600_000).toISOString(), new Date(now + 600_000).toISOString());
  writeFileSync(responsePath, JSON.stringify(response), "utf8");
  writeFileSync(allowlistPath, JSON.stringify({ contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION, entries: [approver.entry] }), "utf8");

  const direct = await runMetricsCutoverExecutionAuthorityPackage({ repo: repositoryRoot, inputPath: bundlePath, responsePath, allowlistPath });
  assert.equal(direct.status, "authority_package_ready", direct.blockingIssues.join(","));
  assertFixedFalse(direct);

  const cli = spawnSync(process.execPath, [
    path.join(REPO_ROOT, "scripts/build-metrics-cutover-execution-authority-package.cjs"),
    "--repo", repositoryRoot, "--input", bundlePath,
    "--response", responsePath, "--allowlist", allowlistPath,
  ], { cwd: REPO_ROOT, encoding: "utf8", timeout: 120_000 });
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  assert.equal(cli.stdout.trim().split("\n").length, 1);
  const parsed = JSON.parse(cli.stdout);
  assert.equal(parsed.status, "authority_package_ready");
  for (const secret of ["PUBLIC KEY", "signatureBase64", "publicKeyPem", "contentBase64"]) {
    assert.equal(cli.stdout.includes(secret), false, secret);
  }
});

test("2V source boundary contains no writes, Git, signing, or execution action", () => {
  const source = readFileSync(path.join(REPO_ROOT, "scripts/lib/metrics-cutover-execution-authority-package.cjs"), "utf8");
  for (const forbidden of ["writeFileSync", "execSync", "spawnSync", "generateKeyPair", "createPrivateKey", "sign("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
