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
  assert.equal(report.currentState.ownerRedactedReviewResultSuppliedNow, false);
  assert.equal(report.currentState.ownerRedactedReviewResultReadNow, false);
  assert.equal(report.currentState.ownerRedactedReviewResultRecordedNow, false);
  assert.equal(report.currentState.currentStepReadsReviewResult, false);
  assert.equal(report.currentState.currentStepRecordsReviewResult, false);
  assert.equal(report.currentState.currentStepRecordsPrivatePath, false);
  assert.equal(report.currentState.currentStepRecordsRawValues, false);
  assert.equal(report.currentState.currentStepRecordsHashInputs, false);
  assert.equal(report.currentState.currentStepReadsPrivateApprovalPacket, false);
  assert.equal(report.currentState.currentStepImplementsApprovalImport, false);
  assert.equal(report.currentState.currentStepImportsApprovalEvidence, false);
  assert.equal(report.currentState.currentStepAuthorizesProviderCalls, false);
  assert.equal(report.currentState.currentStepCallsProvider, false);
  assert.equal(report.currentState.currentStepSubmitsOrders, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
}

function exerciseGate(config) {
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

    const blockedWorkspace = makeWorkspace(config);
    workspaces.push(blockedWorkspace);
    const previous = readJson(blockedWorkspace, config.previousContract);
    previous.readiness[config.previousReadyField] = false;
    previous.readiness.providerCallsAllowed = true;
    writeJson(blockedWorkspace, config.previousContract, previous);
    const blockedResult = runContract(config, blockedWorkspace, []);
    assert.equal(blockedResult.status, 0, blockedResult.stderr);
    const blockedReport = readJson(blockedWorkspace, config.contract);
    assert.equal(blockedReport.readiness[config.readyField], false);
    assert.match(blockedReport.readiness.blockers.join("|"), new RegExp(`${config.previousKey}_not_ready`));

    const progressWorkspace = makeWorkspace(config);
    workspaces.push(progressWorkspace);
    const progress = readJson(progressWorkspace, PROGRESS_SUMMARY);
    progress.readiness.readyForReadOnlyProviderCalls = true;
    progress.readiness.providerCallsAllowed = true;
    writeJson(progressWorkspace, PROGRESS_SUMMARY, progress);
    const progressResult = runContract(config, progressWorkspace, []);
    assert.equal(progressResult.status, 0, progressResult.stderr);
    const progressReport = readJson(progressWorkspace, config.contract);
    assert.equal(progressReport.readiness[config.readyField], false);
    assert.match(progressReport.readiness.blockers.join("|"), /progress_summary_no_longer_fail_closed/);

    const artifactWorkspace = makeWorkspace(config);
    workspaces.push(artifactWorkspace);
    const artifact = path.join(artifactWorkspace, "data", "processed", "scenario_monthly_returns.csv");
    fs.writeFileSync(artifact, "month,return\n");
    const artifactResult = runContract(config, artifactWorkspace, []);
    assert.equal(artifactResult.status, 0, artifactResult.stderr);
    const artifactReport = readJson(artifactWorkspace, config.contract);
    assert.equal(artifactReport.readiness[config.readyField], false);
    assert.match(artifactReport.readiness.blockers.join("|"), /forbidden_runtime_artifacts_present/);
  } finally {
    for (const workspace of workspaces.reverse()) {
      removeWorkspace(workspace);
    }
  }
}

module.exports = { exerciseGate };
