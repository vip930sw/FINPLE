const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-snapshot-risk-input-contract.cjs");
const CONTRACT = "trading_lab_step116_read_only_snapshot_risk_input_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const RISK_GATE_CLEARANCE_CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT =
  "trading_lab_step116_read_only_snapshot_normalization_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-snapshot-risk-input-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    RISK_GATE_CLEARANCE_CONTRACT,
    READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
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

test("passes with current read-only snapshot risk input contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_snapshot_risk_input_contract\.json/);
});

test("keeps snapshot risk input implementation and order submission blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1X");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotRiskInputImplementationReview, true);
  assert.equal(report.readiness.snapshotRiskInputImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("records risk input fields, freshness assertions, and forbidden content", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureReadOnlySnapshotRiskInputBoundary;

  assert.match(boundary.requiredRiskInputFields.join("|"), /quoteSnapshotHash/);
  assert.match(boundary.requiredRiskInputFields.join("|"), /orderableCashSnapshotHash/);
  assert.match(boundary.requiredRiskInputAssertions.join("|"), /stale_snapshot_blocks_live_review/);
  assert.match(boundary.requiredRiskInputAssertions.join("|"), /scenario_monthly_rows_rejected/);
  assert.match(boundary.forbiddenRiskInputContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.freshnessRules.join("|"), /missing snapshots block/);
});

test("rejects stale contract when snapshot risk input implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.snapshotRiskInputImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_read_only_snapshot_risk_input_contract\.json is out of date/);
});

test("blocks readiness if snapshot normalization contract is not ready", () => {
  const workspace = makeWorkspace();
  const snapshotNormalization = readJson(workspace, READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT);
  snapshotNormalization.readiness.readyForFutureReadOnlySnapshotNormalizationImplementationReview = false;
  snapshotNormalization.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_SNAPSHOT_NORMALIZATION_CONTRACT, snapshotNormalization);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlySnapshotNormalizationContractReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotRiskInputImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_snapshot_normalization_contract_not_ready/);
});

test("blocks readiness if risk gate clearance contract is not ready", () => {
  const workspace = makeWorkspace();
  const riskGateClearance = readJson(workspace, RISK_GATE_CLEARANCE_CONTRACT);
  riskGateClearance.readiness.readyForFutureRiskGateClearanceImplementationReview = false;
  riskGateClearance.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, RISK_GATE_CLEARANCE_CONTRACT, riskGateClearance);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.riskGateClearanceContractReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotRiskInputImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /risk_gate_clearance_contract_not_ready/);
});

test("blocks readiness if snapshot risk input runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "readOnlySnapshotRiskInput.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureReadOnlySnapshotRiskInputImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
