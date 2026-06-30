const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-import-implementation-preflight.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_import_implementation_preflight.json";
const MANUAL_ORDER_PERMISSION_PREFLIGHT = "trading_lab_step116_manual_order_permission_preflight.json";
const MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES =
  "trading_lab_step116_manual_order_permission_validator_fixtures.json";
const REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE =
  "trading_lab_step116_redacted_manual_order_permission_template.json";
const HASH_PREPARATION_RUNBOOK = "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json";
const HASH_PREPARATION_RUNBOOK_VALIDATOR_FIXTURES =
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_validator_fixtures.json";
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT =
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json";
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json";
const PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_operator_access_implementation_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-import-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    MANUAL_ORDER_PERMISSION_PREFLIGHT,
    MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES,
    REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE,
    HASH_PREPARATION_RUNBOOK,
    HASH_PREPARATION_RUNBOOK_VALIDATOR_FIXTURES,
    LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT,
    PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
  ]) {
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
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current manual order permission import implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_import_implementation_preflight\.json/);
});

test("keeps permission import, packet reads, provider calls, routes, UI, adapter, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFutureManualOrderPermissionImportImplementationReview, false);
  assert.equal(report.readiness.importImplementationAllowedNow, false);
  assert.equal(report.readiness.ownerPacketReadAllowedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.orderAdapterImplementationAllowedNow, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records explicit owner-packet rules without raw account, order, provider, or secret values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureManualOrderPermissionImportImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /explicit_owner_permission_packet_path_required_later/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_owner_permission_packet_file/);
  assert.match(boundary.implementationRules.join("|"), /does_not_override_kill_switch_or_risk_gate/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_order_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|APP Secret|APP Key/);
});

test("rejects stale preflight if import implementation is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.importImplementationAllowedNow = true;
  report.readiness.ownerPacketReadAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_manual_order_permission_import_implementation_preflight\.json is out of date/,
  );
});

test("blocks if a private manual permission packet appears before owner import review", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.ownerPrivatePermissionPacketAbsentNow, false);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /owner_private_permission_packet_present_too_early/);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

test("blocks if manual permission template, validator, or hash runbook gates open unsafely", () => {
  const workspace = makeWorkspace();
  const template = readJson(workspace, REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE);
  const fixtures = readJson(workspace, MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES);
  const runbook = readJson(workspace, HASH_PREPARATION_RUNBOOK);
  template.readiness.permissionPacketCreatedNow = true;
  fixtures.readiness.orderSubmissionAllowed = true;
  runbook.readiness.hashGenerationAllowed = true;
  writeJson(workspace, REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE, template);
  writeJson(workspace, MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES, fixtures);
  writeJson(workspace, HASH_PREPARATION_RUNBOOK, runbook);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.redactedTemplateReady, false);
  assert.equal(report.checks.validatorFixturesReady, false);
  assert.equal(report.checks.hashPreparationRunbookReady, false);
});

test("blocks if adapter or private runtime implementation gates open too early", () => {
  const workspace = makeWorkspace();
  const adapter = readJson(workspace, LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT);
  const runtime = readJson(workspace, PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT);
  const operator = readJson(workspace, PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT);
  adapter.readiness.readyForFutureLiveGuardedOrderAdapterImplementationReview = true;
  adapter.readiness.orderSubmissionAllowed = true;
  runtime.readiness.readyForFuturePrivateShadowRuntimeImplementationReview = true;
  runtime.readiness.runtimeRouteAllowed = true;
  operator.readiness.readyForFuturePrivateOperatorAccessImplementationReview = true;
  operator.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT, adapter);
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT, runtime);
  writeJson(workspace, PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT, operator);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.liveGuardedOrderAdapterReviewStillBlocked, false);
  assert.equal(report.checks.privateShadowRuntimeImplementationStillBlocked, false);
  assert.equal(report.checks.privateOperatorAccessImplementationStillBlocked, false);
});

test("blocks if importer, adapter, runtime, route, UI, read-only packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
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
