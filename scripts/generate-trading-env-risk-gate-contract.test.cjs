const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-env-risk-gate-contract.cjs");
const CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const PROCESSED_FILES = [
  CONTRACT,
  "trading_lab_step116_env_readiness_contract.json",
  "trading_lab_step1160_policy.json",
];
const SERVICE_FILES = ["tradingEnvConfig.js", "tradingRiskEngine.js", "tradingLabPolicy.js"];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-env-risk-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of PROCESSED_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const serviceDir = path.join(workspace, "server", "src", "services");
  fs.mkdirSync(serviceDir, { recursive: true });
  for (const fileName of SERVICE_FILES) {
    fs.copyFileSync(path.join("server", "src", "services", fileName), path.join(serviceDir, fileName));
  }
  fs.copyFileSync("package.json", path.join(workspace, "package.json"));
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

test("passes with current env-to-risk-gate contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_env_risk_gate_contract\.json/);
});

test("maps parser output into fail-closed risk gate inputs", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1I");
  assert.equal(report.parserResult.validShape, true);
  assert.equal(report.parserResult.mode, "shadow");
  assert.equal(report.riskGateInputContract.fixtureInputs.runtime.mode, "shadow");
  assert.equal(report.riskGateInputContract.fixtureInputs.runtime.globalTradingDisabled, true);
  assert.equal(report.riskGateEvaluation.status, "blocked");
  assert.match(report.riskGateEvaluation.reasons.join("|"), /kill_switch_global_trading_disabled/);
  assert.equal(report.riskGateEvaluation.orderSubmissionAllowed, false);
  assert.equal(report.riskGateEvaluation.providerCallsAllowed, false);
  assert.equal(report.readiness.readyForRuntimeRoute, false);
});

test("keeps wildcard env symbols from becoming a risk gate allowlist", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.parserResult.normalized.wildcardAllowedSymbols, true);
  assert.deepEqual(report.riskGateInputContract.fixtureInputs.limits.allowedSymbols, []);
  assert.equal(report.riskGateInputContract.fixtureInputs.runtime.symbolAllowlisted, false);
  assert.equal(report.checks.wildcardSymbolsFailClosed, true);
  assert.match(report.riskGateEvaluation.reasons.join("|"), /kill_switch_symbol_not_allowlisted/);
});

test("rejects stale contract if a risk gate result is manually unblocked", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.riskGateEvaluation.orderSubmissionAllowed = true;
  report.riskGateEvaluation.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_env_risk_gate_contract\.json is out of date/);
});

test("blocks readiness if upstream env readiness enables runtime too early", () => {
  const workspace = makeWorkspace();
  const envReadiness = readJson(workspace, "trading_lab_step116_env_readiness_contract.json");
  envReadiness.readiness.readOnlyRuntimeIntegrationAllowed = true;
  writeJson(workspace, "trading_lab_step116_env_readiness_contract.json", envReadiness);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForCurrentStep, false);
  assert.match(report.readiness.blockers.join("|"), /env_readiness_unblocked_runtime_too_early/);
});
