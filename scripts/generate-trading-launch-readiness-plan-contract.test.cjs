const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-launch-readiness-plan-contract.cjs");
const CONTRACT = "trading_lab_step116_launch_readiness_plan_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_progress_summary.json",
  "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-launch-readiness-plan-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
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

test("passes with current trading launch readiness plan", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_launch_readiness_plan_contract\.json/);
});

test("records launch phases while keeping routes, UI, provider calls, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.planReady, true);
  assert.equal(report.readiness.estimatedExecutionProgressPercent, 12);
  assert.equal(report.launchReadinessPlan.phases.length, 9);
  assert.equal(report.launchReadinessPlan.homepageRouterPolicy.mayPlanFutureHomepageRouter, true);
  assert.equal(report.launchReadinessPlan.homepageRouterPolicy.mayChangeHomepageRouterNow, false);
  assert.equal(report.launchReadinessPlan.homepageRouterPolicy.mayExposePublicTradingDashboardNow, false);
  assert.equal(report.launchReadinessPlan.homepageRouterPolicy.mayExposePrivateOperatorDashboardNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("rejects stale plan when public UI is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.publicUiAllowed = true;
  report.readiness.publicUiAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_launch_readiness_plan_contract\.json is out of date/);
});

test("blocks if progress summary starts allowing read-only provider calls", () => {
  const workspace = makeWorkspace();
  const summary = readJson(workspace, "trading_lab_step116_progress_summary.json");
  summary.readiness.readyForReadOnlyProviderCalls = true;
  writeJson(workspace, "trading_lab_step116_progress_summary.json", summary);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.planReady, false);
  assert.match(report.readiness.blockers.join("|"), /progress_summary_not_fail_closed/);
});

test("blocks if private route preflight unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_private_runtime_route_implementation_preflight.json");
  preflight.readiness.readyForFuturePrivateRuntimeRouteImplementationReview = true;
  preflight.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, "trading_lab_step116_private_runtime_route_implementation_preflight.json", preflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.planReady, false);
  assert.match(report.readiness.blockers.join("|"), /private_runtime_route_not_blocked/);
});

test("blocks if homepage trading UI appears before launch review", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "components", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.planReady, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
