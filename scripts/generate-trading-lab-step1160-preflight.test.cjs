const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-lab-step1160-preflight.cjs");
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const PROCESSED_FILES = [
  POLICY,
  PREFLIGHT,
  "scenario_p0_kis_written_response_preflight.json",
  "scenario_runtime_implementation_preflight.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-lab-step1160-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of PROCESSED_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = PREFLIGHT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current Step 116-0 trading lab preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step1160_preflight\.json/);
});

test("keeps order submission, provider calls, migrations, and public UI disabled", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForPureValidatorImplementation, true);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
  assert.equal(report.checks.scenarioGatesStillBlocked, true);
});

test("rejects unsafe default live_guarded mode", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  policy.defaults.mode = "live_guarded";
  writeJson(workspace, POLICY, policy);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.defaultSafe, false);
  assert.equal(report.readiness.readyForPureValidatorImplementation, false);
  assert.match(report.readiness.blockers.join("|"), /trading_policy_default_not_safe/);
});

test("rejects missing kill switch condition", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  policy.killSwitch.conditions = policy.killSwitch.conditions.filter((condition) => condition !== "manual_operator_stop");
  writeJson(workspace, POLICY, policy);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.killSwitchReady, false);
  assert.match(report.readiness.blockers.join("|"), /missing_kill_switch_condition_manual_operator_stop/);
});

test("rejects separate trading secret boundary drift", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  policy.secretBoundary.tradingWorkerEnv.push("KIS_APP_KEY");
  writeJson(workspace, POLICY, policy);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.secretBoundaryReady, false);
  assert.match(report.readiness.blockers.join("|"), /trading_secret_boundary_not_separate/);
});

test("rejects forbidden runtime trading artifacts", () => {
  const workspace = makeWorkspace();
  const forbiddenDir = path.join(workspace, "server", "src", "services", "trading");
  fs.mkdirSync(forbiddenDir, { recursive: true });

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.runtimeArtifactsAbsent, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

test("rejects stale committed trading lab preflight", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.readiness.readyForPureValidatorImplementation = false;
  writeJson(workspace, PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step1160_preflight\.json is out of date/);
});
