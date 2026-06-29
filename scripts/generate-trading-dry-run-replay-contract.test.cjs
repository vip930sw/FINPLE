const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-dry-run-replay-contract.cjs");
const CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const STORE_SCHEMA = "trading_lab_step116_store_schema_draft.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-dry-run-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, POLICY, PREFLIGHT, STORE_SCHEMA, ENV_RISK_GATE_CONTRACT]) {
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

test("passes with current trading dry-run replay contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_dry_run_replay_contract\.json/);
});

test("keeps dry-run replay contract fixture-only and runtime-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1K");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.fixtureOnly, true);
  assert.equal(report.readiness.readyForFutureDryRunReplayImplementationReview, true);
  assert.equal(report.readiness.dryRunReplayImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("records deterministic replay inputs and assertions", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futureReplayBoundary.requiredReplayInputs.join("|"), /order_intent_fixture/);
  assert.match(report.futureReplayBoundary.requiredReplayInputs.join("|"), /paper_ledger_expected_snapshot/);
  assert.match(report.futureReplayBoundary.requiredReplayAssertions.join("|"), /risk_gate_recomputed_before_fill/);
  assert.match(report.futureReplayBoundary.requiredReplayAssertions.join("|"), /no_order_submission_attempted/);
  assert.match(report.futureReplayBoundary.forbiddenActions.join("|"), /runtime_provider_call/);
  assert.equal(report.futureReplayBoundary.storageBoundary.currentStepWritesDatabase, false);
});

test("rejects stale contract when dry-run replay implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.dryRunReplayImplementationAllowed = true;
  report.readiness.dryRunReplayImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_dry_run_replay_contract\.json is out of date/);
});

test("blocks readiness if env risk gate contract stops failing closed", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, ENV_RISK_GATE_CONTRACT);
  envRiskGate.readiness.readyForRuntimeRoute = true;
  envRiskGate.readiness.orderSubmissionAllowed = true;
  envRiskGate.checks.riskGateStillDisablesOrderSubmission = false;
  writeJson(workspace, ENV_RISK_GATE_CONTRACT, envRiskGate);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.envRiskGateContractStillFailClosed, false);
  assert.equal(report.readiness.readyForFutureDryRunReplayImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /env_risk_gate_contract_not_fail_closed/);
});

test("blocks readiness if dry-run runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "tradingDryRunReplayService.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureDryRunReplayImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
