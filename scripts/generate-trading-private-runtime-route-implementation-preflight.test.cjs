const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-runtime-route-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_private_runtime_route_implementation_preflight.json";
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT =
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json";
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT = "trading_lab_step116_private_shadow_operator_access_contract.json";
const PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_db_storage_implementation_preflight.json";
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const MANUAL_ORDER_PERMISSION_PREFLIGHT = "trading_lab_step116_manual_order_permission_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-runtime-route-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    PRIVATE_SHADOW_RUNTIME_PREFLIGHT,
    PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT,
    PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT,
    PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT,
    MANUAL_ORDER_PERMISSION_PREFLIGHT,
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

test("passes with current private runtime route implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_runtime_route_implementation_preflight\.json/);
});

test("keeps runtime routes, public UI, provider calls, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateRuntimeRouteImplementationReview, false);
  assert.equal(report.readiness.runtimeRouteImplementationAllowedNow, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records private operator route rules without raw session, account, or secret values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateRuntimeRouteImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /private_operator_only/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_operator_access_hash/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_session_token/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|APP Secret|APP Key/);
});

test("rejects stale preflight if runtime route is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.runtimeRouteImplementationAllowedNow = true;
  report.currentState.runtimeRouteAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_private_runtime_route_implementation_preflight\.json is out of date/);
});

test("blocks if private operator access contract starts allowing runtime routes", () => {
  const workspace = makeWorkspace();
  const operatorAccess = readJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT);
  operatorAccess.readiness.runtimeRouteAllowed = true;
  operatorAccess.readiness.publicUiAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT, operatorAccess);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowOperatorAccessContractReady, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_operator_access_contract_not_ready/);
});

test("blocks if DB storage or provider implementation gates open too early", () => {
  const workspace = makeWorkspace();
  const dbStorage = readJson(workspace, PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT);
  const provider = readJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT);
  dbStorage.readiness.readyForFuturePrivateDbStorageImplementationReview = true;
  dbStorage.readiness.dbStorageImplementationAllowedNow = true;
  provider.readiness.readyForFuturePrivateReadOnlyProviderImplementationReview = true;
  provider.readiness.providerImplementationAllowedNow = true;
  writeJson(workspace, PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT, dbStorage);
  writeJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT, provider);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateDbStorageImplementationStillBlocked, false);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /private_db_storage_implementation_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_not_blocked/);
});

test("blocks if manual order permission is imported too early", () => {
  const workspace = makeWorkspace();
  const manualPermission = readJson(workspace, MANUAL_ORDER_PERMISSION_PREFLIGHT);
  manualPermission.readiness.manualOrderPermissionImportedNow = true;
  manualPermission.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, MANUAL_ORDER_PERMISSION_PREFLIGHT, manualPermission);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOrderPermissionStillNotImported, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_not_closed/);
});

test("blocks if runtime route, UI, or scenario artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const routePath = path.join(workspace, "server", "src", "routes", "trading", "privateShadowRuntime.js");
  const uiPath = path.join(workspace, "src", "pages", "TradingLab.jsx");
  const scenarioPath = path.join(workspace, "data", "processed", "scenario_monthly_returns.csv");
  fs.mkdirSync(path.dirname(routePath), { recursive: true });
  fs.mkdirSync(path.dirname(uiPath), { recursive: true });
  fs.mkdirSync(path.dirname(scenarioPath), { recursive: true });
  fs.writeFileSync(routePath, "module.exports = {};\n");
  fs.writeFileSync(uiPath, "export default function TradingLab() { return null; }\n");
  fs.writeFileSync(scenarioPath, "symbol,date,return\n");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
