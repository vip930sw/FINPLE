const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-public-dashboard-router-review-plan-contract.cjs");
const CONTRACT = "trading_lab_step116_public_dashboard_router_review_plan_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_progress_summary.json",
  "trading_lab_step116_live_guarded_manual_test_plan_contract.json",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-public-dashboard-router-review-plan-"));
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

test("passes with current public dashboard and router review plan", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_public_dashboard_router_review_plan_contract\.json/);
});

test("records future dashboard planning while keeping router and UI blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePublicDashboardRouterReviewPlan, true);
  assert.equal(report.publicDashboardAndHomepageRouterReviewPlan.mayPlanFuturePublicDashboardNow, true);
  assert.equal(report.publicDashboardAndHomepageRouterReviewPlan.mayChangeHomepageRouterNow, false);
  assert.equal(report.publicDashboardAndHomepageRouterReviewPlan.mayCreatePublicDashboardNow, false);
  assert.match(
    report.publicDashboardAndHomepageRouterReviewPlan.requiredReviewPlanItems.join("|"),
    /no_public_order_controls/,
  );
  assert.match(
    report.publicDashboardAndHomepageRouterReviewPlan.requiredAssertions.join("|"),
    /router_plan_does_not_change_homepage_route_now/,
  );
  assert.equal(report.readiness.homepageRouterChangeAllowedNow, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("rejects stale contract when public UI is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.homepageRouterChangeAllowedNow = true;
  report.currentState.publicUiAllowed = true;
  report.readiness.homepageRouterChangeAllowedNow = true;
  report.readiness.publicUiAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_public_dashboard_router_review_plan_contract\.json is out of date/);
});

test("blocks if live-guarded manual test planning starts allowing execution", () => {
  const workspace = makeWorkspace();
  const manualTestPlan = readJson(workspace, "trading_lab_step116_live_guarded_manual_test_plan_contract.json");
  manualTestPlan.readiness.manualTestExecutionAllowedNow = true;
  manualTestPlan.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, "trading_lab_step116_live_guarded_manual_test_plan_contract.json", manualTestPlan);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePublicDashboardRouterReviewPlan, false);
  assert.match(report.readiness.blockers.join("|"), /live_guarded_manual_test_plan_not_blocked/);
});

test("blocks if private route review unexpectedly opens", () => {
  const workspace = makeWorkspace();
  const routePreflight = readJson(workspace, "trading_lab_step116_private_runtime_route_implementation_preflight.json");
  routePreflight.readiness.readyForFuturePrivateRuntimeRouteImplementationReview = true;
  routePreflight.readiness.runtimeRouteImplementationAllowedNow = true;
  routePreflight.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, "trading_lab_step116_private_runtime_route_implementation_preflight.json", routePreflight);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePublicDashboardRouterReviewPlan, false);
  assert.match(report.readiness.blockers.join("|"), /private_runtime_route_not_blocked/);
});

test("blocks if public dashboard artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "src", "components", "trading"), { recursive: true });

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFuturePublicDashboardRouterReviewPlan, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
