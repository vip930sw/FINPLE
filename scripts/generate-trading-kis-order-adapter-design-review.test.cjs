const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-kis-order-adapter-design-review.cjs");
const REVIEW = "trading_lab_step116_kis_order_adapter_design_review.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const STORE_SCHEMA = "trading_lab_step116_store_schema_draft.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-kis-order-adapter-review-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [REVIEW, POLICY, PREFLIGHT, SHADOW_CONTRACT, STORE_SCHEMA]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runReview(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = REVIEW) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current KIS order adapter design review", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_kis_order_adapter_design_review\.json/);
});

test("keeps KIS order adapter design review implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.designReviewOnly, true);
  assert.equal(report.currentState.adapterImplementationAllowed, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, true);
  assert.equal(report.readiness.adapterImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("requires manual approval, kill switch, risk gate, and dry-run replay before future submission", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.deepEqual(report.futureAdapterBoundary.minimumPreSubmissionGates, [
    "manual_operator_approval",
    "kill_switch_clear",
    "risk_gate_clear",
    "shadow_history_reviewed",
    "dry_run_replay_passed",
    "separate_order_capable_credentials_present",
    "audit_logger_ready",
  ]);
  assert.match(report.futureAdapterBoundary.forbiddenActions.join("|"), /order_submission/);
  assert.match(report.futureAdapterBoundary.forbiddenActions.join("|"), /runtime_provider_call/);
});

test("rejects stale review when adapter implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.adapterImplementationAllowed = true;
  writeJson(workspace, REVIEW, report);

  const result = runReview(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_kis_order_adapter_design_review\.json is out of date/);
});

test("blocks future adapter review if live_guarded stops requiring manual approval", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  const liveGuarded = policy.modes.find((mode) => mode.mode === "live_guarded");
  liveGuarded.requiresManualApproval = false;
  writeJson(workspace, POLICY, policy);

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.liveGuardedPolicyReady, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_policy_not_ready/);
});

test("blocks future adapter review if order adapter runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"), "");

  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureOrderAdapterImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
