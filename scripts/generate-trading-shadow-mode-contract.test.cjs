const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-shadow-mode-contract.cjs");
const CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const STORE_SCHEMA = "trading_lab_step116_store_schema_draft.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-shadow-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, POLICY, PREFLIGHT, STORE_SCHEMA]) {
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

test("passes with current shadow-mode contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_shadow_mode_contract\.json/);
});

test("keeps shadow contract read-only and runtime-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.manualReadOnlyApprovalRecorded, false);
  assert.equal(report.readiness.readyForFutureReadOnlyIntegrationReview, true);
  assert.equal(report.readiness.readOnlyRuntimeIntegrationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("captures required future read scopes and forbidden actions", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.deepEqual(report.futureReadOnlyBoundary.allowedReadScopes, [
    "account_cash_balance",
    "account_positions",
    "orderable_cash",
    "current_quotes",
    "fx_rate",
    "market_session_state",
    "provider_rate_limit_state",
  ]);
  assert.match(report.futureReadOnlyBoundary.forbiddenActions.join("|"), /order_submission/);
  assert.match(report.futureReadOnlyBoundary.forbiddenActions.join("|"), /scenario_monthly_cache_write/);
});

test("rejects stale contract when runtime integration is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.readOnlyRuntimeIntegrationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_shadow_mode_contract\.json is out of date/);
});

test("blocks contract review if shadow policy starts allowing external order calls", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  const shadow = policy.modes.find((mode) => mode.mode === "shadow");
  shadow.externalOrderCall = true;
  writeJson(workspace, POLICY, policy);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.shadowModePolicyReady, false);
  assert.equal(report.readiness.readyForFutureReadOnlyIntegrationReview, false);
  assert.match(report.readiness.blockers.join("|"), /shadow_mode_policy_not_ready/);
});

test("blocks contract review if runtime shadow artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureReadOnlyIntegrationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
