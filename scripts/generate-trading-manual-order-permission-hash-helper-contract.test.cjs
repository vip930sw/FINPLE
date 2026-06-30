const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-manual-order-permission-hash-helper-contract.cjs");
const CONTRACT = "trading_lab_step116_manual_order_permission_hash_helper_contract.json";
const DEPENDENCY_CONTRACTS = [
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-hash-helper-"));
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

function runContract(workspace, args = ["--check"]) {
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

test("passes with current manual order permission hash helper contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_hash_helper_contract\.json/);
});

test("keeps helper implementation, packet creation, provider calls, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionHashHelperImplementationReview, true);
  assert.equal(report.readiness.hashHelperImplementationAllowed, false);
  assert.equal(report.readiness.permissionPacketCreatedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records hash labels and stdin-only helper rules without raw values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureLocalHashHelperBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.requiredHashInputLabels.join("|"), /approvedByHash/);
  assert.match(boundary.requiredHashInputLabels.join("|"), /operatorAccessHash/);
  assert.match(boundary.requiredHashInputLabels.join("|"), /allowedSymbolHashes/);
  assert.match(boundary.requiredHashHelperRules.join("|"), /raw_inputs_from_stdin_or_interactive_prompt_only/);
  assert.match(boundary.requiredHashHelperRules.join("|"), /symbol_inputs_must_be_normalized_before_hashing/);
  assert.equal(boundary.currentStepImplementsHelper, false);
  assert.equal(boundary.currentStepCreatesPermissionPacket, false);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale contract if helper implementation or order submission is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.hashHelperImplementationAllowed = true;
  report.currentState.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_manual_order_permission_hash_helper_contract\.json is out of date/,
  );
});

test("blocks readiness if manual permission template starts creating private packets", () => {
  const workspace = makeWorkspace();
  const template = readJson(workspace, "trading_lab_step116_redacted_manual_order_permission_template.json");
  template.readiness.permissionPacketCreatedNow = true;
  template.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_redacted_manual_order_permission_template.json", template);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOrderPermissionTemplateReady, false);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionHashHelperImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /redacted_manual_order_permission_template_not_ready/);
});

test("blocks readiness if adapter preflight unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json");
  preflight.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  preflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.liveGuardedAdapterPreflightStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_order_adapter_preflight_not_blocked/);
});

test("blocks if hash helper, private packet, adapter, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "scripts", "create-trading-manual-order-permission-hashes.cjs"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
