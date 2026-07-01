const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-broker-contingency-review-contract.cjs");
const CONTRACT = "trading_lab_step116_broker_contingency_review_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_progress_summary.json",
  "trading_lab_step116_alpha_kr_market_boundary_contract.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_kis_order_adapter_design_review.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-broker-contingency-"));
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

test("passes with current broker contingency review contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_broker_contingency_review_contract\.json/);
});

test("records KIS as primary while keeping Alpha data-only", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureBrokerContingencyDecision, true);
  assert.equal(report.currentState.brokerSwitchoverAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  const alpha = report.brokerContingencyReview.contingencyCandidates.find((candidate) => candidate.id === "alpha_vantage");
  assert.equal(alpha.canSupportOrderSubmissionInPrinciple, false);
  assert.equal(alpha.currentDecision, "do_not_use_as_order_broker");
  assert.match(report.brokerContingencyReview.decisionRules.join("|"), /do_not_replace_kis_with_alpha_for_order_submission/);
});

test("rejects stale contract if broker switchover is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.brokerSwitchoverAllowedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_broker_contingency_review_contract\.json is out of date/);
});

test("blocks readiness if Alpha boundary stops being data-only", () => {
  const workspace = makeWorkspace();
  const alphaBoundary = readJson(workspace, "trading_lab_step116_alpha_kr_market_boundary_contract.json");
  alphaBoundary.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_alpha_kr_market_boundary_contract.json", alphaBoundary);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureBrokerContingencyDecision, false);
  assert.match(report.readiness.blockers.join("|"), /alpha_boundary_no_longer_data_only/);
});

test("blocks readiness if KIS order adapter design is no longer review-only", () => {
  const workspace = makeWorkspace();
  const design = readJson(workspace, "trading_lab_step116_kis_order_adapter_design_review.json");
  design.currentState.designReviewOnly = false;
  design.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_kis_order_adapter_design_review.json", design);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureBrokerContingencyDecision, false);
  assert.match(report.readiness.blockers.join("|"), /kis_order_adapter_design_not_review_only/);
});

test("blocks if a premature alternate broker adapter appears", () => {
  const workspace = makeWorkspace();
  const artifact = path.join(workspace, "server", "src", "services", "trading", "kiwoomOrderAdapter.js");
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureBrokerContingencyDecision, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
