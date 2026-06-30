const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-redacted-manual-order-permission-template.cjs");
const CONTRACT = "trading_lab_step116_redacted_manual_order_permission_template.json";
const DEPENDENCY_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_kis_order_adapter_design_review.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-manual-order-permission-template-"));
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

function runTemplate(workspace, args = ["--check"]) {
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

test("passes with current redacted manual order permission template", () => {
  const workspace = makeWorkspace();
  const result = runTemplate(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_redacted_manual_order_permission_template\.json/);
});

test("keeps permission packet creation, provider calls, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runTemplate(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.templateOnly, true);
  assert.equal(report.readiness.readyForOwnerRedactedManualOrderPermissionPreparation, true);
  assert.equal(report.readiness.permissionPacketCreatedNow, false);
  assert.equal(report.readiness.permissionPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records live_guarded hash-only manual permission fields and sample shape", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const template = report.futureRedactedManualOrderPermissionTemplate;

  assert.match(template.requiredTemplateFields.join("|"), /approvedByHash/);
  assert.match(template.requiredTemplateFields.join("|"), /operatorAccessHash/);
  assert.match(template.requiredTemplateFields.join("|"), /killSwitchClearanceHash/);
  assert.match(template.requiredTemplateFields.join("|"), /riskGateClearanceHash/);
  assert.match(template.requiredTemplateAssertions.join("|"), /template_forbids_raw_order_payloads/);
  assert.equal(template.currentStepCreatesPacket, false);
  assert.equal(template.sampleRedactedShape.mode, "live_guarded");
  assert.equal(template.sampleRedactedShape.orderSubmissionAllowed, false);
});

test("does not include raw KIS secret, account identifiers, or order payloads", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const serialized = JSON.stringify(report);

  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /APP Secret|APP Key/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY/);
  assert.doesNotMatch(serialized, /raw_order_payload_value|order_confirmation_value/);
});

test("rejects stale template if permission packet creation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.permissionPacketCreatedNow = true;
  report.currentState.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runTemplate(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_redacted_manual_order_permission_template\.json is out of date/);
});

test("blocks template readiness if manual order permission preflight opens too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_manual_order_permission_preflight.json");
  preflight.readiness.manualOrderPermissionImportedNow = true;
  preflight.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_preflight.json", preflight);

  const result = runTemplate(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.permissionPreflightReady, false);
  assert.equal(report.readiness.readyForOwnerRedactedManualOrderPermissionPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_preflight_not_ready/);
});

test("blocks template readiness if private permission packet or adapter artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const files = [
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

  const result = runTemplate(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForOwnerRedactedManualOrderPermissionPreparation, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
