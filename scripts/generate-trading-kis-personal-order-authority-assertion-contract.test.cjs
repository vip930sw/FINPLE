const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-kis-personal-order-authority-assertion-contract.cjs",
);
const CONTRACT = "trading_lab_step116_kis_personal_order_authority_assertion_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_owner_order_path_assertion_contract.json",
  "trading_lab_step116_kis_order_adapter_design_review.json",
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  "trading_lab_step116_progress_summary.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-order-authority-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const targetDocPath = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(targetDocPath), { recursive: true });
  fs.copyFileSync(DOC_PATH, targetDocPath);
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

test("passes with current KIS personal order authority assertion contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_kis_personal_order_authority_assertion_contract\.json/);
});

test("records KIS personal account order authority while keeping orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.authorityRecordedWithOrdersBlocked, true);
  assert.equal(report.readiness.orderAuthorityExternalBlockerCleared, true);
  assert.equal(report.currentState.authorityAssertionIsOperationalOrderApproval, false);
  assert.equal(report.readiness.readyForManualOrderPermissionPacketPreparation, true);
  assert.equal(report.readiness.readyForOrderSubmission, false);
  assert.equal(report.readiness.readyForLiveGuardedTrading, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.match(
    report.kisPersonalOrderAuthorityAssertion.acceptedBoundaries.join("|"),
    /authority_assertion_does_not_submit_orders/,
  );
});

test("rejects stale contract if order submission is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.authorityAssertionIsOperationalOrderApproval = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_kis_personal_order_authority_assertion_contract\.json is out of date/);
});

test("blocks readiness if owner order path assertion no longer keeps orders blocked", () => {
  const workspace = makeWorkspace();
  const ownerAssertion = readJson(workspace, "trading_lab_step116_owner_order_path_assertion_contract.json");
  ownerAssertion.readiness.assertionRecordedWithOrdersBlocked = false;
  ownerAssertion.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_owner_order_path_assertion_contract.json", ownerAssertion);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.authorityRecordedWithOrdersBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /owner_order_path_assertion_not_recorded_with_orders_blocked/);
});

test("blocks readiness if KIS order adapter design is no longer review-only", () => {
  const workspace = makeWorkspace();
  const design = readJson(workspace, "trading_lab_step116_kis_order_adapter_design_review.json");
  design.currentState.designReviewOnly = false;
  design.readiness.adapterImplementationAllowed = true;
  writeJson(workspace, "trading_lab_step116_kis_order_adapter_design_review.json", design);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.authorityRecordedWithOrdersBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /kis_order_adapter_design_not_review_only/);
});

test("blocks if a premature runtime route appears", () => {
  const workspace = makeWorkspace();
  const artifact = path.join(workspace, "server", "src", "routes", "trading");
  fs.mkdirSync(artifact, { recursive: true });
  fs.writeFileSync(path.join(artifact, "orders.js"), "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.authorityRecordedWithOrdersBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
