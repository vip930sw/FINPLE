const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-env-readiness-contract.cjs");
const CONTRACT = "trading_lab_step116_env_readiness_contract.json";
const PROCESSED_FILES = [
  CONTRACT,
  "trading_lab_step1160_policy.json",
  "trading_lab_step116_shadow_mode_contract.json",
  "trading_lab_step116_kis_order_adapter_design_review.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-env-contract-"));
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

function runContract(workspace, args = ["--check"], env = {}) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current trading env readiness contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_env_readiness_contract\.json/);
});

test("keeps current step secret-free and runtime-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.productionSecretsRequiredNow, false);
  assert.equal(report.currentState.valuesStoredInContract, false);
  assert.equal(report.readiness.readyForCurrentStep, true);
  assert.equal(report.readiness.readOnlyRuntimeIntegrationAllowed, false);
  assert.equal(report.readiness.adapterImplementationAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("records required future env names without secret values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.deepEqual(report.envGroups.readOnlyTrading, [
    "KIS_TRADING_APP_KEY",
    "KIS_TRADING_APP_SECRET",
    "KIS_TRADING_ACCOUNT_ID",
    "KIS_TRADING_BASE_URL",
  ]);
  assert.equal(report.currentProcessPresence.KIS_TRADING_APP_KEY.valueStored, false);
  assert.equal(report.currentProcessPresence.KIS_TRADING_APP_SECRET.valueStored, false);
});

test("reports readiness when read-only env is supplied to current process", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, [], {
    KIS_TRADING_APP_KEY: "test-key",
    KIS_TRADING_APP_SECRET: "test-secret",
    KIS_TRADING_ACCOUNT_ID: "test-account",
    KIS_TRADING_BASE_URL: "https://example.invalid",
  });

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForShadowReadOnlyRuntimeInCurrentProcess, true);
  assert.equal(report.readiness.readOnlyRuntimeIntegrationAllowed, false);
  assert.equal(report.currentProcessPresence.KIS_TRADING_APP_SECRET.valueStored, false);
});

test("rejects stale contract if an env secret value is manually persisted", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentProcessPresence.KIS_TRADING_APP_SECRET.value = "should-not-be-stored";
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_env_readiness_contract\.json is out of date/);
});

test("blocks readiness if upstream order adapter review is prematurely enabled", () => {
  const workspace = makeWorkspace();
  const review = readJson(workspace, "trading_lab_step116_kis_order_adapter_design_review.json");
  review.readiness.adapterImplementationAllowed = true;
  writeJson(workspace, "trading_lab_step116_kis_order_adapter_design_review.json", review);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.orderAdapterStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /order_adapter_unblocked_too_early/);
});
