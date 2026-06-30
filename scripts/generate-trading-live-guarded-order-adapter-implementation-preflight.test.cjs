const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-live-guarded-order-adapter-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json";
const DEPENDENCY_CONTRACTS = [
  "trading_lab_step116_kis_order_adapter_design_review.json",
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_order_credential_boundary_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_audit_logger_readiness_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-live-guarded-adapter-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, ...DEPENDENCY_CONTRACTS]) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
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

test("passes with current live-guarded order adapter implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_live_guarded_order_adapter_implementation_preflight\.json/);
});

test("records adapter implementation review as blocked while keeping runtime effects disabled", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview, false);
  assert.equal(report.readiness.orderAdapterImplementationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records review gates and implementation rules without raw secrets or order payloads", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureLiveGuardedOrderAdapterBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.reviewGates.join("|"), /manual_order_permission_packet_imported_later/);
  assert.match(boundary.reviewGates.join("|"), /private_shadow_runtime_review_recorded_later/);
  assert.match(boundary.implementationRules.join("|"), /kill_switch_before_request_signing/);
  assert.match(boundary.implementationRules.join("|"), /risk_gate_before_request_signing/);
  assert.match(boundary.implementationRules.join("|"), /no_runtime_route/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_order_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale preflight if order submission is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.orderAdapterImplementationAllowedNow = true;
  report.currentState.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_live_guarded_order_adapter_implementation_preflight\.json is out of date/,
  );
});

test("blocks if manual permission preflight starts importing permission too early", () => {
  const workspace = makeWorkspace();
  const permissionPreflight = readJson(workspace, "trading_lab_step116_manual_order_permission_preflight.json");
  permissionPreflight.readiness.manualOrderPermissionImportedNow = true;
  permissionPreflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_preflight.json", permissionPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOrderPermissionPreflightReady, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_preflight_not_ready/);
});

test("blocks if runtime or operator access review unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const runtimePreflight = readJson(workspace, "trading_lab_step116_private_shadow_runtime_implementation_preflight.json");
  const operatorPreflight = readJson(workspace, "trading_lab_step116_private_operator_access_implementation_preflight.json");
  runtimePreflight.readiness.readyForFuturePrivateShadowRuntimeImplementationReview = true;
  operatorPreflight.readiness.readyForFuturePrivateOperatorAccessImplementationReview = true;
  writeJson(workspace, "trading_lab_step116_private_shadow_runtime_implementation_preflight.json", runtimePreflight);
  writeJson(workspace, "trading_lab_step116_private_operator_access_implementation_preflight.json", operatorPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowRuntimeReviewStillBlocked, false);
  assert.equal(report.checks.privateOperatorAccessReviewStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_runtime_review_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_operator_access_review_not_blocked/);
});

test("blocks if order adapter, route, UI, private packet, migration, or scenario artifact appears", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermission.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "migrations", "trading", "001.sql"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
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
