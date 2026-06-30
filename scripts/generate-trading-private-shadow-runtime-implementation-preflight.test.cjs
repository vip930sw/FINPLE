const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-shadow-runtime-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_private_shadow_runtime_implementation_preflight.json";
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT =
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json";
const PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_operator_access_implementation_preflight.json";
const PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_runtime_route_implementation_preflight.json";
const PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_db_storage_implementation_preflight.json";
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const MANUAL_ORDER_PERMISSION_PREFLIGHT = "trading_lab_step116_manual_order_permission_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-runtime-implementation-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    PRIVATE_SHADOW_RUNTIME_PREFLIGHT,
    PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT,
    PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    MANUAL_ORDER_PERMISSION_PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current private shadow runtime implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_runtime_implementation_preflight\.json/);
});

test("keeps runtime implementation, provider calls, routes, storage, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeImplementationReview, false);
  assert.equal(report.readiness.privateShadowRuntimeImplementationAllowedNow, false);
  assert.equal(report.readiness.privateShadowRuntimeServiceAllowedNow, false);
  assert.equal(report.readiness.readOnlyProviderCallsAllowedNow, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records runtime implementation rules without raw credentials or payloads", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateShadowRuntimeImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /private_worker_only/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_owner_read_only_approval_import/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_operator_access_hash/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|APP Secret|APP Key/);
});

test("rejects stale preflight if runtime implementation is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.privateShadowRuntimeImplementationAllowedNow = true;
  report.readiness.privateShadowRuntimeServiceAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_private_shadow_runtime_implementation_preflight\.json is out of date/,
  );
});

test("blocks if owner approval import or provider implementation opens too early", () => {
  const workspace = makeWorkspace();
  const approvalImport = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  const provider = readJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT);
  approvalImport.readiness.approvalPacketImportedNow = true;
  approvalImport.readiness.readOnlyRuntimeIntegrationAllowed = true;
  provider.readiness.ownerPacketGateStillClosed = false;
  provider.readiness.providerImplementationAllowedNow = true;
  provider.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, approvalImport);
  writeJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT, provider);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalStillDeferred, false);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /owner_read_only_approval_import_not_deferred/);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_not_blocked/);
});

test("blocks if operator access, DB storage, or runtime route gates open too early", () => {
  const workspace = makeWorkspace();
  const operatorAccess = readJson(workspace, PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT);
  const dbStorage = readJson(workspace, PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT);
  const route = readJson(workspace, PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT);
  operatorAccess.readiness.operatorAccessImplementationAllowedNow = true;
  operatorAccess.readiness.authServiceAllowedNow = true;
  dbStorage.readiness.dbStorageImplementationAllowedNow = true;
  dbStorage.readiness.databaseConnectionAllowedNow = true;
  route.readiness.runtimeRouteImplementationAllowedNow = true;
  route.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT, operatorAccess);
  writeJson(workspace, PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT, dbStorage);
  writeJson(workspace, PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT, route);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateOperatorAccessImplementationStillBlocked, false);
  assert.equal(report.checks.privateDbStorageImplementationStillBlocked, false);
  assert.equal(report.checks.privateRuntimeRouteImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /private_operator_access_implementation_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_db_storage_implementation_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_runtime_route_implementation_not_blocked/);
});

test("blocks if runtime prerequisites or manual permission stop being fail-closed", () => {
  const workspace = makeWorkspace();
  const runtimePreflight = readJson(workspace, PRIVATE_SHADOW_RUNTIME_PREFLIGHT);
  const runtimePacket = readJson(workspace, PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT);
  const manualPermission = readJson(workspace, MANUAL_ORDER_PERMISSION_PREFLIGHT);
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  runtimePreflight.readiness.privateShadowRuntimeImplementationAllowed = true;
  runtimePacket.readiness.providerCallsAllowed = true;
  manualPermission.readiness.manualOrderPermissionImportedNow = true;
  manualPermission.readiness.orderSubmissionAllowed = true;
  envRiskGate.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_PREFLIGHT, runtimePreflight);
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT, runtimePacket);
  writeJson(workspace, MANUAL_ORDER_PERMISSION_PREFLIGHT, manualPermission);
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowRuntimePreflightReady, false);
  assert.equal(report.checks.privateShadowRuntimeReviewPacketContractReady, false);
  assert.equal(report.checks.manualOrderPermissionStillNotImported, false);
  assert.equal(report.checks.envRiskGateStillFailClosed, false);
});

test("blocks if runtime service, provider, DB, route, UI, private packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateTradingStore.js"),
    path.join(workspace, "server", "src", "routes", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
