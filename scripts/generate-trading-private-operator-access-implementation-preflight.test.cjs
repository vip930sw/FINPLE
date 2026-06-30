const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-operator-access-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_private_operator_access_implementation_preflight.json";
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT = "trading_lab_step116_private_shadow_operator_access_contract.json";
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT =
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json";
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT =
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_runtime_route_implementation_preflight.json";
const PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_db_storage_implementation_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-operator-access-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT,
    PRIVATE_SHADOW_RUNTIME_PREFLIGHT,
    PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT,
    PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    ENV_RISK_GATE_CONTRACT,
    PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT,
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

test("passes with current private operator access implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_operator_access_implementation_preflight\.json/);
});

test("keeps operator access implementation, auth, routes, UI, providers, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateOperatorAccessImplementationReview, false);
  assert.equal(report.readiness.operatorAccessImplementationAllowedNow, false);
  assert.equal(report.readiness.authServiceAllowedNow, false);
  assert.equal(report.readiness.sessionTokenReadAllowedNow, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records hash-only operator access implementation rules without raw credentials", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateOperatorAccessImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /hash_only_operator_identity/);
  assert.match(boundary.implementationRules.join("|"), /no_auth_service_now/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_runtime_review_packet_hash/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_session_token/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|APP Secret|APP Key/);
});

test("rejects stale preflight if operator access implementation is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.operatorAccessImplementationAllowedNow = true;
  report.readiness.authServiceAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_private_operator_access_implementation_preflight\.json is out of date/,
  );
});

test("blocks if operator access contract starts allowing routes, UI, or provider calls", () => {
  const workspace = makeWorkspace();
  const operatorAccess = readJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT);
  operatorAccess.readiness.runtimeRouteAllowed = true;
  operatorAccess.readiness.publicUiAllowed = true;
  operatorAccess.readiness.providerCallsAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT, operatorAccess);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowOperatorAccessContractReady, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_operator_access_contract_not_ready/);
});

test("blocks if runtime route or DB storage gates open too early", () => {
  const workspace = makeWorkspace();
  const route = readJson(workspace, PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT);
  const dbStorage = readJson(workspace, PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT);
  route.readiness.readyForFuturePrivateRuntimeRouteImplementationReview = true;
  route.readiness.runtimeRouteImplementationAllowedNow = true;
  dbStorage.readiness.readyForFuturePrivateDbStorageImplementationReview = true;
  dbStorage.readiness.dbStorageImplementationAllowedNow = true;
  writeJson(workspace, PRIVATE_RUNTIME_ROUTE_IMPLEMENTATION_PREFLIGHT, route);
  writeJson(workspace, PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT, dbStorage);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateRuntimeRouteImplementationStillBlocked, false);
  assert.equal(report.checks.privateDbStorageImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /private_runtime_route_implementation_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_db_storage_implementation_not_blocked/);
});

test("blocks if private runtime prerequisites stop being fail-closed", () => {
  const workspace = makeWorkspace();
  const runtimePacket = readJson(workspace, PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT);
  const intentAudit = readJson(workspace, PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT);
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  runtimePacket.readiness.providerCallsAllowed = true;
  intentAudit.readiness.orderSubmissionAllowed = true;
  envRiskGate.readiness.liveTradingAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT, runtimePacket);
  writeJson(workspace, PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT, intentAudit);
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowRuntimeReviewPacketContractReady, false);
  assert.equal(report.checks.privateShadowIntentAuditEventContractReady, false);
  assert.equal(report.checks.envRiskGateContractStillFailClosed, false);
});

test("blocks if operator service, route, UI, private packet, or scenario artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const servicePath = path.join(workspace, "server", "src", "services", "trading", "privateOperatorAccess.js");
  const routePath = path.join(workspace, "server", "src", "routes", "trading", "privateShadowRuntime.js");
  const uiPath = path.join(workspace, "src", "pages", "TradingLab.jsx");
  const privatePacketPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  const scenarioPath = path.join(workspace, "data", "processed", "scenario_monthly_returns.csv");
  for (const filePath of [servicePath, routePath, uiPath, privatePacketPath, scenarioPath]) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
