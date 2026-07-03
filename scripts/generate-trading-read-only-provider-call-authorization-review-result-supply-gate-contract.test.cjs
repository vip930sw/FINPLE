const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-read-only-provider-call-authorization-review-result-supply-gate-contract.cjs",
);
const CONTRACT = "trading_lab_step116_read_only_provider_call_authorization_review_result_supply_gate_contract.json";
const REQUIRED_CONTRACTS = [
  "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
  "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  "trading_lab_step116_progress_summary.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-call-auth-review-result-supply-"));
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

test("passes with current read-only provider call authorization review result supply gate", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /read_only_provider_call_authorization_review_result_supply_gate_contract\.json/);
});

test("opens supply boundary without reading, recording, importing, or authorizing provider calls", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForReadOnlyProviderCallAuthorizationReviewResultSupply, true);
  assert.equal(report.readiness.readyForReadOnlyProviderCallAuthorizationReviewResultRecordingPreflight, false);
  assert.equal(report.currentState.ownerRedactedProviderCallAuthorizationReviewResultSuppliedNow, false);
  assert.equal(report.currentState.currentStepReadsOwnerResult, false);
  assert.equal(report.currentState.currentStepRecordsOwnerResult, false);
  assert.equal(report.currentState.currentStepImportsPrivateEvidence, false);
  assert.equal(report.currentState.currentStepAuthorizesProviderCalls, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
});

test("blocks if the review result contract starts authorizing provider calls", () => {
  const workspace = makeWorkspace();
  const reviewResult = readJson(
    workspace,
    "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
  );
  reviewResult.readiness.providerCallAuthorizationAllowedNow = true;
  reviewResult.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json", reviewResult);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForReadOnlyProviderCallAuthorizationReviewResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_provider_call_authorization_review_result_not_ready/);
});

test("blocks if owner evidence recording result starts recording or importing private material", () => {
  const workspace = makeWorkspace();
  const ownerResult = readJson(
    workspace,
    "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_contract.json",
  );
  ownerResult.currentState.ownerEvidenceReceiptReviewResultRecorded = true;
  ownerResult.currentState.actualPrivateEvidenceImported = true;
  writeJson(workspace, "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_contract.json", ownerResult);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForReadOnlyProviderCallAuthorizationReviewResultSupply, false);
  assert.match(
    report.readiness.blockers.join("|"),
    /owner_evidence_receipt_review_result_recording_result_not_fail_closed/,
  );
});

test("blocks if private result, provider implementation, route, UI, DB, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "data", "private", "trading", "read_only_provider_call_authorization_review_result.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "routes", "trading", "read-only.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "migrations", "trading", "001.sql"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForReadOnlyProviderCallAuthorizationReviewResultSupply, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
  assert.equal(report.evidence.forbiddenRuntimeArtifacts.length, 6);
});
