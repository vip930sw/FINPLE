const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-kis-personal-terms-permission-assertion-contract.cjs",
);
const CONTRACT = "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_owner_order_path_assertion_contract.json",
  "trading_lab_step116_kis_personal_order_authority_assertion_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-personal-terms-permission-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
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

test("passes with current KIS personal terms permission assertion", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_kis_personal_terms_permission_assertion_contract\.json/);
});

test("records owner-supplied terms permission assertion while keeping orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.termsPermissionExternalBlockerCleared, true);
  assert.equal(report.currentState.independentLegalDeterminationRecorded, false);
  assert.equal(report.currentState.assertionIsOperationalOrderApproval, false);
  assert.equal(report.readiness.readyForManualOrderPermissionPacketPreparation, true);
  assert.equal(report.readiness.readyForOrderSubmission, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.match(
    report.kisPersonalTermsPermissionAssertion.acceptedBoundaries.join("|"),
    /terms_permission_assertion_is_not_independent_legal_advice/,
  );
});

test("rejects stale contract if assertion is promoted into operational order approval", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.assertionIsOperationalOrderApproval = true;
  report.readiness.readyForOrderSubmission = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_kis_personal_terms_permission_assertion_contract\.json is out of date/);
});

test("blocks if internal gate sequence records validation evidence before owner receipt", () => {
  const workspace = makeWorkspace();
  const sequence = readJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json");
  sequence.readiness.validationReceiptEvidenceRecorded = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json", sequence);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.termsPermissionExternalBlockerCleared, false);
  assert.match(report.readiness.blockers.join("|"), /internal_gate_sequence_no_longer_fail_closed/);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("blocks if a runtime route appears before internal gate completion", () => {
  const workspace = makeWorkspace();
  const routeDir = path.join(workspace, "server", "src", "routes", "trading");
  fs.mkdirSync(routeDir, { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.termsPermissionExternalBlockerCleared, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
