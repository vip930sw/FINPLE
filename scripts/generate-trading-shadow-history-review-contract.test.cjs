const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-shadow-history-review-contract.cjs");
const CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const SHADOW_CONTRACT = "trading_lab_step116_shadow_mode_contract.json";
const STORE_SCHEMA = "trading_lab_step116_store_schema_draft.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-shadow-history-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [CONTRACT, POLICY, PREFLIGHT, SHADOW_CONTRACT, STORE_SCHEMA, DRY_RUN_REPLAY_CONTRACT]) {
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

test("passes with current trading shadow history review contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_shadow_history_review_contract\.json/);
});

test("keeps shadow history review contract implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1L");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.historyExistsNow, false);
  assert.equal(report.readiness.readyForFutureShadowHistoryReviewImplementation, true);
  assert.equal(report.readiness.shadowHistoryReviewImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("records required shadow history evidence and assertions", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.futureShadowHistoryBoundary.requiredHistoryEvidence.join("|"), /shadow_order_intent_log/);
  assert.match(report.futureShadowHistoryBoundary.requiredHistoryEvidence.join("|"), /dry_run_replay_summary/);
  assert.match(report.futureShadowHistoryBoundary.requiredReviewAssertions.join("|"), /no_order_submission_attempted/);
  assert.match(report.futureShadowHistoryBoundary.requiredReviewAssertions.join("|"), /live_guarded_remains_blocked/);
  assert.equal(report.futureShadowHistoryBoundary.storageBoundary.currentStepWritesDatabase, false);
});

test("rejects stale contract when shadow history review implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.shadowHistoryReviewImplementationAllowed = true;
  report.readiness.shadowHistoryReviewImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_shadow_history_review_contract\.json is out of date/);
});

test("blocks readiness if dry-run replay contract is not ready", () => {
  const workspace = makeWorkspace();
  const dryRunReplay = readJson(workspace, DRY_RUN_REPLAY_CONTRACT);
  dryRunReplay.readiness.readyForFutureDryRunReplayImplementationReview = false;
  dryRunReplay.readiness.dryRunReplayImplementationAllowed = true;
  writeJson(workspace, DRY_RUN_REPLAY_CONTRACT, dryRunReplay);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.dryRunReplayContractReady, false);
  assert.equal(report.readiness.readyForFutureShadowHistoryReviewImplementation, false);
  assert.match(report.readiness.blockers.join("|"), /dry_run_replay_contract_not_ready/);
});

test("blocks readiness if shadow history runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "tradingShadowHistoryReviewService.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureShadowHistoryReviewImplementation, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
