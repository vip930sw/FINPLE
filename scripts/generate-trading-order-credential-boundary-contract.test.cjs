const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-order-credential-boundary-contract.cjs");
const CONTRACT = "trading_lab_step116_order_credential_boundary_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const ENV_READINESS_CONTRACT = "trading_lab_step116_env_readiness_contract.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const KILL_SWITCH_CLEARANCE_CONTRACT = "trading_lab_step116_kill_switch_clearance_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const ENV_CONFIG_SOURCE = path.join("server", "src", "services", "tradingEnvConfig.js");
const POLICY_SOURCE = path.join("server", "src", "services", "tradingLabPolicy.js");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-order-credential-contract-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    ENV_READINESS_CONTRACT,
    PREFLIGHT,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    KILL_SWITCH_CLEARANCE_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  for (const sourcePath of [ENV_CONFIG_SOURCE, POLICY_SOURCE]) {
    const targetPath = path.join(workspace, sourcePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
  fs.writeFileSync(path.join(workspace, "package.json"), `${JSON.stringify({ type: "module" }, null, 2)}\n`);
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

test("passes with current trading order credential boundary contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_order_credential_boundary_contract\.json/);
});

test("keeps order credential boundary contract implementation-blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-1P");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.currentState.credentialValuesStored, false);
  assert.equal(report.currentState.orderCapableCredentialsAcceptedNow, false);
  assert.equal(report.readiness.readyForFutureOrderCredentialImplementationReview, true);
  assert.equal(report.readiness.credentialStoreImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
});

test("records separated credential names and secret redaction boundary", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(report.credentialBoundary.tradingCredentialEnv.join("|"), /KIS_TRADING_APP_KEY/);
  assert.doesNotMatch(report.credentialBoundary.tradingCredentialEnv.join("|"), /KIS_APP_KEY\|KIS_APP_SECRET/);
  assert.match(report.credentialBoundary.webDataProxyEnv.join("|"), /KIS_APP_KEY/);
  assert.match(report.credentialBoundary.redactionRules.join("|"), /secret presence only/);
  assert.equal(report.fixtureEvidence.virtualTrading.presence.KIS_TRADING_APP_SECRET.valueStored, false);
  assert.equal(report.fixtureEvidence.virtualTrading.presence.KIS_TRADING_ACCOUNT_ID.valueStored, false);
});

test("records virtual trading as not order-capable and production shape as separate-review only", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.equal(report.fixtureEvidence.virtualTrading.baseUrlMode, "virtual_trading");
  assert.equal(report.fixtureEvidence.virtualTrading.orderSubmissionAllowed, false);
  assert.equal(report.fixtureEvidence.productionShape.baseUrlMode, "production_trading");
  assert.match(report.fixtureEvidence.productionShape.warnings.join("|"), /production_trading_base_url_requires_separate_live_review/);
  assert.equal(report.fixtureEvidence.productionShape.orderSubmissionAllowed, false);
});

test("rejects stale contract when credential store implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.credentialStoreImplementationAllowed = true;
  report.readiness.credentialStoreImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_order_credential_boundary_contract\.json is out of date/);
});

test("blocks readiness if manual operator approval contract is not ready", () => {
  const workspace = makeWorkspace();
  const manualApproval = readJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT);
  manualApproval.readiness.readyForFutureManualApprovalImplementationReview = false;
  manualApproval.readiness.manualApprovalImplementationAllowed = true;
  writeJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT, manualApproval);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOperatorApprovalContractReady, false);
  assert.equal(report.readiness.readyForFutureOrderCredentialImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /manual_operator_approval_contract_not_ready/);
});

test("blocks readiness if credential runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "credentialStore.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFutureOrderCredentialImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
