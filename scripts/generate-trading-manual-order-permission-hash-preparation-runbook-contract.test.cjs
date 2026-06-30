const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve(
  "scripts",
  "generate-trading-manual-order-permission-hash-preparation-runbook-contract.cjs",
);
const CONTRACT = "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json";
const DEPENDENCY_CONTRACTS = [
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
];
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-hash-runbook-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, ...DEPENDENCY_CONTRACTS]) {
    const source = path.join("data", "processed", fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(processedDir, fileName));
    }
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runContract(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { cwd: workspace, encoding: "utf8" });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current manual order permission hash preparation runbook contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract\.json/);
});

test("records owner-assisted runbook while keeping helper execution and trading blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.runbookOnly, true);
  assert.equal(report.readiness.readyForOwnerAssistedHashPreparationRunbookReview, true);
  assert.equal(report.readiness.helperImplementationCreatedNow, false);
  assert.equal(report.readiness.helperExecutionAllowedNow, false);
  assert.equal(report.readiness.rawInputsRequestedNow, false);
  assert.equal(report.readiness.privatePepperRequestedNow, false);
  assert.equal(report.readiness.hashGenerationAllowed, false);
  assert.equal(report.readiness.permissionPacketCreatedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("keeps runbook local-only, hash-only, and free of raw values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const runbook = report.futureOwnerAssistedHashPreparationRunbook;
  const serialized = JSON.stringify(report);

  assert.match(runbook.runbookSteps.join("|"), /explicit_owner_request_required/);
  assert.match(runbook.runbookSteps.join("|"), /use_stdin_or_interactive_prompts_only/);
  assert.match(runbook.runbookSteps.join("|"), /copy_hashes_only_to_private_permission_packet_outside_repo/);
  assert.match(runbook.requiredOutputLabels.join("|"), /approvedByHash/);
  assert.match(runbook.requiredOutputLabels.join("|"), /revocationPlanHash/);
  assert.match(runbook.forbiddenRunbookContent.join("|"), /raw_order_payload/);
  assert.equal(runbook.currentStepCreatesHelper, false);
  assert.equal(runbook.currentStepRunsHelper, false);
  assert.equal(runbook.currentStepRequestsRawInputs, false);
  assert.equal(runbook.currentStepRequestsPrivatePepper, false);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|KIS_TRADING_APP_KEY|APP Secret|APP Key/);
});

test("rejects stale contract if helper execution or order submission is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.helperExecutionAllowedNow = true;
  report.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract\.json is out of date/,
  );
});

test("blocks if upstream review fixtures or preflight open too early", () => {
  const workspace = makeWorkspace();
  const preflight = readJson(workspace, "trading_lab_step116_manual_order_permission_hash_helper_preflight.json");
  const fixtures = readJson(
    workspace,
    "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
  );
  preflight.readiness.ownerHashPreparationDeferred = false;
  fixtures.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_manual_order_permission_hash_helper_preflight.json", preflight);
  writeJson(
    workspace,
    "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
    fixtures,
  );

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.hashHelperPreflightDeferred, false);
  assert.equal(report.checks.implementationReviewFixturesReady, false);
  assert.match(report.readiness.blockers.join("|"), /manual_order_permission_hash_helper_preflight_not_deferred/);
  assert.match(
    report.readiness.blockers.join("|"),
    /manual_order_permission_hash_helper_implementation_review_fixtures_not_ready/,
  );
});

test("blocks if helper, private packet, adapter, route, UI, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "scripts", "create-trading-manual-order-permission-hashes.cjs"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "server", "src", "services", "trading", "kisOrderAdapter.js"),
    path.join(workspace, "server", "src", "routes", "trading", "orders.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
