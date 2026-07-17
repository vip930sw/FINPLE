const assert = require("node:assert/strict");
const {
  createHash,
  generateKeyPairSync,
  sign,
} = require("node:crypto");
const {
  mkdtempSync,
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
  APPROVAL_VERIFICATION_POLICY_VERSION,
  APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
  APPROVER_ROLE,
  ATTESTATION_FACTS,
  EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  MAX_ALLOWLIST_BYTES,
  MAX_RESPONSE_BYTES,
  buildMetricsCutoverExecutionApprovalSignaturePayload,
  buildMetricsCutoverExecutionApprovalVerificationReceipt,
  hashMetricsCutoverExecutionApprovalResponse,
  normalizeExecutionApproverAllowlist,
  readMetricsCutoverExecutionApprovalResponseObservation,
  recomputeMetricsCutoverExecutionApprovalResponseId,
  runMetricsCutoverExecutionApprovalResponseVerification,
  validateMetricsCutoverExecutionApprovalResponse,
} = require("./lib/metrics-cutover-execution-approval-response.cjs");
const {
  parseArguments,
  runCli,
} = require("./verify-metrics-cutover-execution-approval-response.cjs");
const {
  buildRealSyntheticOperatorBundle,
  createIsolatedMetricsRepository,
} = require("./test-support/metrics-cutover-post-merge-real-fixture.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");
const HEAD = "a".repeat(40);
const TREE = "b".repeat(40);
const TRACKED_HASH = "c".repeat(64);
const ABSENCE_HASH = "d".repeat(64);
const PACKAGE_HASH = "e".repeat(64);
const EVALUATION_NOW = "2026-07-17T01:00:00.000Z";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function temporaryDirectory(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-step114-2u-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function fixedFalse(fields = STEP114_2T_FIXED_FALSE_FIELDS) {
  return Object.fromEntries(fields.map((field) => [field, false]));
}

function target(role) {
  const us = role === "us_price_metrics";
  return {
    role,
    path: `src/data/tickers/future_step114_2u_${us ? "us" : "kr"}.csv`,
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
    branchName: "review/step114-2u",
    trackedPathsSha256: TRACKED_HASH,
    targetPathAbsenceEvidenceHash: ABSENCE_HASH,
    candidatePackageId: "candidate-step114-2u-synthetic",
    candidatePackageHash: "1".repeat(64),
    zipPackageSha256: "2".repeat(64),
    cutoverRehearsalEvidenceHash: "3".repeat(64),
    executionPackageHash: PACKAGE_HASH,
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
      productionApprovalReceipt: {
        signerKeyId: "production-key",
        signerId: "production-signer",
      },
      appExportApprovalReceipt: {
        signerKeyId: "app-key",
        signerId: "app-signer",
      },
    },
  };
}

function bundleObservation(bytes, bundle = bundleValue()) {
  return {
    ok: true,
    bundle,
    blockingIssues: [],
    canonicalInputPath: "C:\\synthetic\\operator-bundle.json",
    bytes: Buffer.from(bytes),
    byteSize: bytes.length,
    sha256: sha256(bytes),
    fileIdentity: "7:42",
    fileIdentitySupported: true,
  };
}

async function readyStep1142TResult(bytes) {
  let observations = 0;
  return runMetricsCutoverExecutionApprovalRequest(
    { repo: "C:\\synthetic-repo", inputPath: "C:\\synthetic\\bundle.json" },
    {
      observeBundle: async () => {
        observations += 1;
        return bundleObservation(bytes);
      },
      runDryRun: async (_input, adapters) => {
        await adapters.readBundle("C:\\synthetic\\bundle.json");
        return readyDryRun();
      },
    },
  );
}

function makeApprover(overrides = {}) {
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
      ...overrides,
    },
  };
}

function signedResponse(request, approver, overrides = {}) {
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
    issuedAt: "2026-07-17T00:50:00.000Z",
    expiresAt: "2026-07-17T01:10:00.000Z",
    signerKeyId: approver.entry.signerKeyId,
    signerId: approver.entry.signerId,
    signatureAlgorithm: "Ed25519",
    attestations: { ...ATTESTATION_FACTS },
    signatureBase64: Buffer.alloc(64).toString("base64"),
    ...overrides,
  };
  response.responseId = recomputeMetricsCutoverExecutionApprovalResponseId(response);
  response.signatureBase64 = sign(
    null,
    buildMetricsCutoverExecutionApprovalSignaturePayload(response),
    approver.privateKey,
  ).toString("base64");
  return response;
}

function jsonObservation(value, kind = "response", overrides = {}) {
  const bytes = Buffer.from(JSON.stringify(value), "utf8");
  return {
    ok: true,
    value: structuredClone(value),
    blockingIssues: [],
    canonicalInputPath: `C:\\synthetic\\${kind}.json`,
    bytes,
    byteSize: bytes.length,
    sha256: sha256(bytes),
    fileIdentity: kind === "response" ? "7:50" : "7:51",
    fileIdentitySupported: true,
    ...overrides,
  };
}

async function unitSetup() {
  const bundleBytes = Buffer.from('{"synthetic":"step114-2u"}', "utf8");
  const requestResult = await readyStep1142TResult(bundleBytes);
  assert.equal(
    requestResult.status,
    "request_ready",
    requestResult.blockingIssues.join(","),
  );
  const approver = makeApprover();
  const response = signedResponse(requestResult.approvalRequest, approver);
  const allowlist = {
    contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
    entries: [approver.entry],
  };
  return { bundleBytes, requestResult, approver, response, allowlist };
}

async function runUnit(setup, changes = {}) {
  const responses = changes.responses || [
    jsonObservation(changes.response || setup.response),
    jsonObservation(changes.response || setup.response),
  ];
  const allowlists = changes.allowlists || [
    jsonObservation(changes.allowlist || setup.allowlist, "allowlist"),
    jsonObservation(changes.allowlist || setup.allowlist, "allowlist"),
  ];
  const requestResults = changes.requestResults || [
    setup.requestResult,
    setup.requestResult,
  ];
  let responseIndex = 0;
  let allowlistIndex = 0;
  let requestIndex = 0;
  return runMetricsCutoverExecutionApprovalResponseVerification(
    {
      repo: "C:\\synthetic-repo",
      inputPath: "C:\\synthetic\\bundle.json",
      responsePath: "C:\\synthetic\\response.json",
      allowlistPath: "C:\\synthetic\\allowlist.json",
    },
    {
      observeResponse: async () => responses[Math.min(responseIndex++, responses.length - 1)],
      observeAllowlist: async () => allowlists[Math.min(allowlistIndex++, allowlists.length - 1)],
      observeBundle: async () => bundleObservation(
        setup.bundleBytes,
        changes.bundle || bundleValue(),
      ),
      runApprovalRequest: async () => structuredClone(
        requestResults[Math.min(requestIndex++, requestResults.length - 1)],
      ),
    },
  );
}

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertSuppressed(result) {
  for (const field of [
    "verificationReceiptHash", "requestId", "requestHash", "responseId",
    "responseHash", "responseFileSha256", "allowlistFileSha256",
    "operatorBundleSha256", "repositoryHeadSha", "repositoryTreeSha",
    "branchName", "executionPackageHash", "signerKeyId", "signerId",
    "issuedAt", "expiresAt",
  ]) assert.equal(result[field], "", field);
  assert.equal(result.targetFileCount, 0);
  assert.equal(result.plannedWriteCount, 0);
  assert.equal(result.plannedDeleteCount, 0);
  assertFixedFalse(result);
}

test("valid response is deterministically verified and remains non-authorizing", async () => {
  const setup = await unitSetup();
  const result = await runUnit(setup);
  assert.equal(result.status, "approval_verified");
  assert.equal(result.ok, true);
  assert.equal(result.contractVersion, APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION);
  assert.equal(result.signatureVerified, true);
  assert.equal(result.responseHash, hashMetricsCutoverExecutionApprovalResponse(setup.response));
  assert.match(result.verificationReceiptHash, /^[a-f0-9]{64}$/);
  assert.equal(result.executionAuthorized, false);
  assertFixedFalse(result);
});

test("response ID, hash, signature payload, and verification receipt are deterministic", async () => {
  const setup = await unitSetup();
  const request = setup.requestResult.approvalRequest;
  assert.equal(
    recomputeMetricsCutoverExecutionApprovalResponseId(setup.response),
    setup.response.responseId,
  );
  assert.deepEqual(
    buildMetricsCutoverExecutionApprovalSignaturePayload(setup.response),
    buildMetricsCutoverExecutionApprovalSignaturePayload(structuredClone(setup.response)),
  );
  const responseHash = hashMetricsCutoverExecutionApprovalResponse(setup.response);
  const args = {
    request,
    response: setup.response,
    responseHash,
    responseFileSha256: "8".repeat(64),
    allowlistFileSha256: "9".repeat(64),
  };
  assert.deepEqual(
    buildMetricsCutoverExecutionApprovalVerificationReceipt(args),
    buildMetricsCutoverExecutionApprovalVerificationReceipt(structuredClone(args)),
  );
});

test("signature, signer resolution, scope, role, revocation, and key type fail closed", async (t) => {
  const setup = await unitSetup();
  const cases = [];
  const forged = structuredClone(setup.response);
  forged.signatureBase64 = Buffer.alloc(64, 9).toString("base64");
  cases.push(["signature", { response: forged }, "approval_response_signature_invalid"]);
  cases.push(["unknown signer", { response: signedResponse(setup.requestResult.approvalRequest, setup.approver, { signerId: "unknown" }) }, "execution_approver_resolution_failed"]);
  cases.push(["scope", { allowlist: { ...setup.allowlist, entries: [{ ...setup.approver.entry, allowedScopes: ["wrong"] }] } }, "approver_allowlist_entry_0_allowed_scopes_invalid"]);
  cases.push(["role", { allowlist: { ...setup.allowlist, entries: [{ ...setup.approver.entry, roles: ["wrong"] }] } }, "approver_allowlist_entry_0_roles_invalid"]);
  cases.push(["revoked", { allowlist: { ...setup.allowlist, entries: [{ ...setup.approver.entry, revoked: true }] } }, "approver_allowlist_entry_0_revoked"]);
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  cases.push(["key type", { allowlist: { ...setup.allowlist, entries: [{ ...setup.approver.entry, publicKeyPem: rsa.publicKey.export({ type: "spki", format: "pem" }) }] } }, "approver_allowlist_entry_0_public_key_not_ed25519"]);
  for (const [name, changes, issue] of cases) {
    await t.test(name, async () => {
      const result = await runUnit(setup, changes);
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.includes(issue), result.blockingIssues.join(","));
      assertSuppressed(result);
    });
  }
});

test("request binding and exact evaluationNow time policy fail closed", async (t) => {
  const setup = await unitSetup();
  const cases = [
    ["request hash", { requestHash: "9".repeat(64) }, "approval_response_request_identity_mismatch:requestHash"],
    ["head", { repositoryHeadSha: "9".repeat(40) }, "approval_response_request_identity_mismatch:repositoryHeadSha"],
    ["future", { issuedAt: "2026-07-17T01:00:00.001Z" }, "approval_response_issued_in_future"],
    ["expired", { expiresAt: EVALUATION_NOW }, "approval_response_expired"],
    ["stale", { issuedAt: "2026-07-17T00:29:59.999Z" }, "approval_response_stale"],
  ];
  for (const [name, overrides, issue] of cases) {
    await t.test(name, async () => {
      const response = signedResponse(setup.requestResult.approvalRequest, setup.approver, overrides);
      const result = await runUnit(setup, { response });
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.includes(issue), result.blockingIssues.join(","));
      assertSuppressed(result);
    });
  }
});

test("exact response shape, attestations, canonical signature encoding, and response ID are enforced", async (t) => {
  const setup = await unitSetup();
  const extra = { ...setup.response, extra: true };
  const badAttestation = { ...setup.response, attestations: { ...setup.response.attestations, executionNotYetAuthorized: false } };
  const badId = { ...setup.response, responseId: `metrics-cutover-approval-response-${"0".repeat(64)}` };
  const badBase64 = { ...setup.response, signatureBase64: "AA==" };
  for (const [value, issue] of [
    [extra, "approval_response_fields_invalid"],
    [badAttestation, "approval_response_attestation_mismatch:executionNotYetAuthorized"],
    [badId, "approval_response_id_mismatch"],
    [badBase64, "approval_response_signature_length_invalid"],
  ]) {
    const result = await runUnit(setup, { response: value });
    assert.equal(result.status, "blocked");
    assert.ok(result.blockingIssues.includes(issue), result.blockingIssues.join(","));
    assertSuppressed(result);
  }
});

test("allowlist rejects aliases, duplicates, malformed fields, and wildcard values", async (t) => {
  const setup = await unitSetup();
  const second = { ...setup.approver.entry, signerKeyId: "alias-key", signerId: "alias-signer" };
  const alias = { contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION, entries: [setup.approver.entry, second] };
  const duplicateId = { contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION, entries: [setup.approver.entry, { ...makeApprover().entry, signerKeyId: setup.approver.entry.signerKeyId }] };
  assert.ok(normalizeExecutionApproverAllowlist(alias).issues.includes("approver_allowlist_public_key_duplicate"));
  assert.ok(normalizeExecutionApproverAllowlist(duplicateId).issues.includes("approver_allowlist_signer_key_id_duplicate"));
  assert.equal(normalizeExecutionApproverAllowlist({ ...setup.allowlist, extra: true }).ok, false);
  assert.equal(normalizeExecutionApproverAllowlist({ ...setup.allowlist, entries: [{ ...setup.approver.entry, signerId: "*" }] }).ok, false);
});

test("execution approver signer ID and key ID must differ from both earlier approvers", async (t) => {
  const setup = await unitSetup();
  for (const [field, value, issue] of [
    ["signerKeyId", "production-key", "execution_approver_signer_key_not_distinct"],
    ["signerId", "app-signer", "execution_approver_signer_id_not_distinct"],
  ]) {
    await t.test(field, async () => {
      const approver = makeApprover({ [field]: value });
      const response = signedResponse(setup.requestResult.approvalRequest, approver);
      const allowlist = { contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION, entries: [approver.entry] };
      const result = await runUnit(setup, { response, allowlist });
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.includes(issue));
      assertSuppressed(result);
    });
  }
});

test("response and allowlist A/B bytes, path, size, hash, and file identity are stable", async (t) => {
  const setup = await unitSetup();
  const stableResponse = jsonObservation(setup.response);
  const stableAllowlist = jsonObservation(setup.allowlist, "allowlist");
  const cases = [
    ["response bytes", { responses: [stableResponse, { ...stableResponse, bytes: Buffer.from("changed") }] }, "approval_response_bytes_changed"],
    ["response path", { responses: [stableResponse, { ...stableResponse, canonicalInputPath: "C:\\other.json" }] }, "approval_response_canonical_path_changed"],
    ["response size", { responses: [stableResponse, { ...stableResponse, byteSize: stableResponse.byteSize + 1 }] }, "approval_response_byte_size_changed"],
    ["allowlist hash", { allowlists: [stableAllowlist, { ...stableAllowlist, sha256: "0".repeat(64) }] }, "approver_allowlist_sha256_changed"],
    ["allowlist identity", { allowlists: [stableAllowlist, { ...stableAllowlist, fileIdentity: "8:99" }] }, "approver_allowlist_file_identity_changed"],
  ];
  for (const [name, changes, issue] of cases) {
    await t.test(name, async () => {
      const result = await runUnit(setup, changes);
      assert.equal(result.status, "blocked");
      assert.ok(result.blockingIssues.includes(issue), result.blockingIssues.join(","));
      assertSuppressed(result);
    });
  }
});

test("Step 114-2T A/B drift or blocked results suppress every approval artifact", async (t) => {
  const setup = await unitSetup();
  const changed = structuredClone(setup.requestResult);
  changed.approvalRequest = { ...changed.approvalRequest, branchName: "other" };
  changed.branchName = "other";
  const blocked = { ...structuredClone(setup.requestResult), status: "blocked", ok: false, approvalRequestReady: false };
  for (const requestResults of [[setup.requestResult, changed], [blocked]]) {
    const result = await runUnit(setup, { requestResults });
    assert.equal(result.status, "blocked");
    assertSuppressed(result);
  }
});

function mockStat({ size, dev = 7n, ino = 42n, symlink = false, file = true }) {
  return { size, dev, ino, isSymbolicLink: () => symlink, isFile: () => file };
}

function atomicFs(bytes, { pathStats, descriptorStats, canonicalPaths } = {}) {
  let p = 0;
  let d = 0;
  let c = 0;
  const stable = mockStat({ size: BigInt(bytes.length) });
  return {
    lstatSync: () => (pathStats || [stable, stable])[Math.min(p++, (pathStats || [stable, stable]).length - 1)],
    realpathSync: () => (canonicalPaths || ["C:\\canonical\\response.json", "C:\\canonical\\response.json"])[Math.min(c++, (canonicalPaths || ["x"]).length - 1)],
    openSync: () => 17,
    fstatSync: () => (descriptorStats || [stable, stable])[Math.min(d++, (descriptorStats || [stable, stable]).length - 1)],
    readFileSync: () => Buffer.from(bytes),
    closeSync: () => {},
  };
}

test("one descriptor observation blocks path, descriptor, symlink, size, encoding, and size-limit mutation", () => {
  const bytes = Buffer.from('{"ok":true}');
  const changedIdentity = mockStat({ size: BigInt(bytes.length), ino: 99n });
  const changedSize = mockStat({ size: BigInt(bytes.length + 1) });
  const symlink = mockStat({ size: BigInt(bytes.length), symlink: true });
  const cases = [
    [atomicFs(bytes, { descriptorStats: [mockStat({ size: BigInt(bytes.length) }), changedIdentity] }), "approval_response_descriptor_identity_changed_during_read"],
    [atomicFs(bytes, { pathStats: [mockStat({ size: BigInt(bytes.length) }), symlink] }), "approval_response_symlink_during_read"],
    [atomicFs(bytes, { descriptorStats: [mockStat({ size: BigInt(bytes.length) }), changedSize] }), "approval_response_size_changed_during_read"],
    [atomicFs(bytes, { canonicalPaths: ["C:\\a.json", "C:\\b.json"] }), "approval_response_canonical_path_changed_during_read"],
  ];
  for (const [fsApi, issue] of cases) {
    const result = readMetricsCutoverExecutionApprovalResponseObservation("x", { fs: fsApi });
    assert.equal(result.ok, false);
    assert.ok(result.blockingIssues.includes(issue), result.blockingIssues.join(","));
  }
  const invalidUtf8 = readMetricsCutoverExecutionApprovalResponseObservation("x", { fs: atomicFs(Buffer.from([0xff])) });
  assert.ok(invalidUtf8.blockingIssues.includes("approval_response_invalid_utf8"));
  const oversized = readMetricsCutoverExecutionApprovalResponseObservation("x", { fs: atomicFs(Buffer.alloc(MAX_RESPONSE_BYTES + 1)) });
  assert.ok(oversized.blockingIssues.includes("approval_response_input_size_invalid"));
  assert.equal(MAX_ALLOWLIST_BYTES, 4 * 1024 * 1024);
});

test("CLI accepts exactly four flags, emits one JSON line, and maps 0/1/2", async () => {
  const args = ["--repo", "r", "--input", "i", "--response", "s", "--allowlist", "a"];
  assert.deepEqual(parseArguments(args), { repo: "r", inputPath: "i", responsePath: "s", allowlistPath: "a" });
  assert.equal(parseArguments([...args, "--extra", "x"]), null);
  let stdout = "";
  let stderr = "";
  const ready = await runCli(args, {
    runVerification: async () => ({ status: "approval_verified" }),
    stdout: (value) => { stdout += value; },
    stderr: (value) => { stderr += value; },
  });
  assert.equal(ready, 0);
  assert.equal(stdout.trim().split("\n").length, 1);
  stdout = "";
  const invalid = await runCli(["--repo", "r"], {
    stdout: (value) => { stdout += value; },
    stderr: (value) => { stderr += value; },
  });
  assert.equal(invalid, 2);
  assert.equal(JSON.parse(stdout).status, "idle");
});

test("idle and blocked results suppress identities and keep execution outputs false", async () => {
  const idle = await runMetricsCutoverExecutionApprovalResponseVerification({});
  assert.equal(idle.status, "idle");
  assertSuppressed(idle);
  const blocked = await runMetricsCutoverExecutionApprovalResponseVerification({ repo: "x" });
  assert.equal(blocked.status, "blocked");
  assertSuppressed(blocked);
});

test("real production-default Step 114-2T integration and actual 2U CLI verify a synthetic response", async (t) => {
  const root = temporaryDirectory(t);
  const repositoryRoot = path.join(root, "repository");
  const bundlePath = path.join(root, "operator-bundle.json");
  const responsePath = path.join(root, "response.json");
  const allowlistPath = path.join(root, "allowlist.json");
  const repository = await createIsolatedMetricsRepository(REPO_ROOT, repositoryRoot);
  const bundle = await buildRealSyntheticOperatorBundle(REPO_ROOT, repository);
  writeFileSync(bundlePath, JSON.stringify(bundle), "utf8");
  const requestResult = await runMetricsCutoverExecutionApprovalRequest({ repo: repositoryRoot, inputPath: bundlePath });
  assert.equal(requestResult.status, "request_ready");
  const approver = makeApprover();
  const evaluation = Date.parse(bundle.evaluationNow);
  const response = signedResponse(requestResult.approvalRequest, approver, {
    issuedAt: new Date(evaluation - 10 * 60 * 1000).toISOString(),
    expiresAt: new Date(evaluation + 10 * 60 * 1000).toISOString(),
  });
  writeFileSync(responsePath, JSON.stringify(response), "utf8");
  writeFileSync(allowlistPath, JSON.stringify({ contractVersion: EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION, entries: [approver.entry] }), "utf8");

  const direct = await runMetricsCutoverExecutionApprovalResponseVerification({ repo: repositoryRoot, inputPath: bundlePath, responsePath, allowlistPath });
  assert.equal(direct.status, "approval_verified", direct.blockingIssues.join(","));
  assertFixedFalse(direct);

  const cli = spawnSync(process.execPath, [
    path.join(REPO_ROOT, "scripts/verify-metrics-cutover-execution-approval-response.cjs"),
    "--repo", repositoryRoot, "--input", bundlePath,
    "--response", responsePath, "--allowlist", allowlistPath,
  ], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  const parsed = JSON.parse(cli.stdout);
  assert.equal(parsed.status, "approval_verified");
  assert.equal(cli.stdout.trim().split("\n").length, 1);
  assert.equal(cli.stdout.includes("PUBLIC KEY"), false);
  assert.equal(cli.stdout.includes("signatureBase64"), false);
});

test("source boundary contains no signing, write authorization, or execution action", () => {
  const source = require("node:fs").readFileSync(
    path.join(REPO_ROOT, "scripts/lib/metrics-cutover-execution-approval-response.cjs"),
    "utf8",
  );
  for (const forbidden of ["generateKeyPair", "createPrivateKey", "writeFileSync", "execSync", "spawnSync"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.equal(source.includes("Date.now"), false);
});
