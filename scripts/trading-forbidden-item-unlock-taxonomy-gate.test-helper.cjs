const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const PROGRESS_SUMMARY = "trading_lab_step116_progress_summary.json";

function makeWorkspace(config) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `${config.tmpPrefix}-`));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [...config.requiredContracts, PROGRESS_SUMMARY]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  if (fs.existsSync(path.join("data", "processed", config.contract))) {
    fs.copyFileSync(path.join("data", "processed", config.contract), path.join(processedDir, config.contract));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runContract(config, workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [path.resolve("scripts", config.script), ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function removeWorkspace(workspace) {
  const tempRoot = path.resolve(os.tmpdir());
  const resolved = path.resolve(workspace);
  if (!resolved.startsWith(`${tempRoot}${path.sep}`)) {
    return;
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function assertLocked(report, readyField) {
  assert.equal(report.readiness[readyField], true);
  assert.equal(report.currentState.taxonomyOnly, true);
  assert.equal(report.currentState.currentStepUnlocksProviderCalls, false);
  assert.equal(report.currentState.currentStepUnlocksOrderSubmission, false);
  assert.equal(report.currentState.currentStepUnlocksProviderAdapter, false);
  assert.equal(report.currentState.currentStepUnlocksPrivateWorker, false);
  assert.equal(report.currentState.currentStepUnlocksRuntimeRoute, false);
  assert.equal(report.currentState.currentStepUnlocksPublicUi, false);
  assert.equal(report.currentState.currentStepUnlocksDbMigration, false);
  assert.equal(report.currentState.currentStepCreatesScenarioMonthlyReturns, false);
  assert.equal(report.currentState.currentStepRecordsPrivateMaterial, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
  assert.ok(report.forbiddenItemTaxonomy.currentStageForbidden.includes("provider_call"));
  assert.ok(report.forbiddenItemTaxonomy.separateUnlockRequired.includes("scenario_monthly_returns_requires_real_source_approval_and_writer_gate"));
  assert.ok(report.forbiddenItemTaxonomy.repoNeverRecord.includes("credential_material"));
}

function exerciseTaxonomy(config) {
  const workspaces = [];
  try {
    const workspace = makeWorkspace(config);
    workspaces.push(workspace);
    const checkResult = runContract(config, workspace);
    assert.equal(checkResult.status, 0, checkResult.stderr);
    assert.match(checkResult.stdout, new RegExp(config.stdoutPattern));

    const writeWorkspace = makeWorkspace(config);
    workspaces.push(writeWorkspace);
    const writeResult = runContract(config, writeWorkspace, []);
    assert.equal(writeResult.status, 0, writeResult.stderr);
    assertLocked(readJson(writeWorkspace, config.contract), config.readyField);

    if (config.previousContract) {
      const sourceWorkspace = makeWorkspace(config);
      workspaces.push(sourceWorkspace);
      const previous = readJson(sourceWorkspace, config.previousContract);
      previous.readiness[config.previousReadyField] = false;
      previous.readiness.providerCallsAllowed = true;
      writeJson(sourceWorkspace, config.previousContract, previous);
      const sourceResult = runContract(config, sourceWorkspace, []);
      assert.equal(sourceResult.status, 0, sourceResult.stderr);
      const sourceReport = readJson(sourceWorkspace, config.contract);
      assert.equal(sourceReport.readiness[config.readyField], false);
      assert.match(sourceReport.readiness.blockers.join("|"), new RegExp(`${config.previousKey}_not_ready`));
    }

    const progressWorkspace = makeWorkspace(config);
    workspaces.push(progressWorkspace);
    const progress = readJson(progressWorkspace, PROGRESS_SUMMARY);
    progress.readiness.readyForLiveGuardedTrading = true;
    progress.readiness.orderSubmissionAllowed = true;
    writeJson(progressWorkspace, PROGRESS_SUMMARY, progress);
    const progressResult = runContract(config, progressWorkspace, []);
    assert.equal(progressResult.status, 0, progressResult.stderr);
    const progressReport = readJson(progressWorkspace, config.contract);
    assert.equal(progressReport.readiness[config.readyField], false);
    assert.match(progressReport.readiness.blockers.join("|"), /progress_summary_no_longer_fail_closed/);
  } finally {
    for (const workspace of workspaces.reverse()) {
      removeWorkspace(workspace);
    }
  }
}

module.exports = { exerciseTaxonomy };
