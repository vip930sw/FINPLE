const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract.cjs",
);
const CONTRACT =
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-import-review-result-supply-gate-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of REQUIRED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  if (fs.existsSync(path.join("data", "processed", CONTRACT))) {
    fs.copyFileSync(path.join("data", "processed", CONTRACT), path.join(processedDir, CONTRACT));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runContract(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current read-only approval import review-result supply gate", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /recording_result_review_result_supply_gate_contract\.json/);
});

test("keeps supply gate closed to private material, provider calls, orders, routes, UI, and DB", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate,
    true,
  );
  assert.equal(report.currentState.ownerRedactedReviewResultSuppliedNow, false);
  assert.equal(report.currentState.ownerRedactedReviewResultReadNow, false);
  assert.equal(report.currentState.ownerRedactedReviewResultRecordedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if review preflight or provider authorization opens too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(
    workspace,
    "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  );
  preflight.readiness.providerCallsAllowed = true;
  writeJson(
    workspace,
    "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
    preflight,
  );
  const providerAuth = readJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_preflight.json");
  providerAuth.readiness.providerCallAuthorizationAllowedNow = true;
  providerAuth.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_preflight.json", providerAuth);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(
    report.readiness.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate,
    false,
  );
  assert.match(report.readiness.blockers.join("|"), /review_preflight_not_ready/);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_call_authorization_preflight_no_longer_blocked/);
});

test("blocks if private review result, importer, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "read_only_approval_import_review_recording_result_review_result_recording_result_review_result.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "readOnlyApprovalImport.js"),
    path.join(workspace, "server", "src", "routes", "trading", "read-only.js"),
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
  assert.equal(
    report.readiness.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate,
    false,
  );
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
