const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-packet-validation-runbook-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json";
const INPUTS = [
  CONTRACT,
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
];
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-packet-validation-runbook-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of INPUTS) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  const validatorTarget = path.join(workspace, VALIDATOR_PATH);
  fs.mkdirSync(path.dirname(validatorTarget), { recursive: true });
  fs.copyFileSync(VALIDATOR_PATH, validatorTarget);
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runRunbook(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current manual order permission packet validation runbook contract", () => {
  const workspace = makeWorkspace();
  const result = runRunbook(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_packet_validation_runbook_contract\.json/);
});

test("records owner-assisted validation runbook while keeping validation execution, packet reads, imports, provider calls, UI, DB, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runRunbook(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.runbookOnly, true);
  assert.equal(report.readiness.readyForOwnerAssistedValidationRunbookReview, true);
  assert.equal(report.readiness.currentStepRunsValidator, false);
  assert.equal(report.readiness.currentStepReadsPrivatePacket, false);
  assert.equal(report.readiness.permissionPacketCreatedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.importImplementationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
  assert.match(report.futureOwnerAssistedValidationRunbook.commandShape, /--packet <owner-local-redacted-packet-path>/);
});

test("rejects stale runbook if validation, private packet, import, provider, or order flags are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.currentStepRunsValidator = true;
  report.currentState.currentStepReadsPrivatePacket = true;
  report.readiness.permissionPacketImportedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runRunbook(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_manual_order_permission_packet_validation_runbook_contract\.json is out of date/);
});

test("blocks if upstream validation preflight or import preflight opens too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_manual_order_permission_packet_validation_preflight.json");
  preflight.readiness.currentStepRunsValidator = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_packet_validation_preflight.json", preflight);
  const importPreflight = readJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_preflight.json");
  importPreflight.readiness.importImplementationAllowedNow = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_import_implementation_preflight.json", importPreflight);

  const result = runRunbook(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.validationPreflightReady, false);
  assert.equal(report.checks.importImplementationPreflightStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_packet_validation_preflight_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_import_implementation_preflight_not_blocked/);
});

test("blocks if private packet, importer, adapter, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "manualOrderPermissionImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runRunbook(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
