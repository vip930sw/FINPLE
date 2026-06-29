const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-shadow-operator-access-contract.cjs");
const CONTRACT = "trading_lab_step116_private_shadow_operator_access_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const MANUAL_OPERATOR_APPROVAL_CONTRACT = "trading_lab_step116_manual_operator_approval_contract.json";
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT =
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json";
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT =
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-operator-access-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    MANUAL_OPERATOR_APPROVAL_CONTRACT,
    PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT,
    PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT,
  ]) {
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

test("passes with current private shadow operator access contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_operator_access_contract\.json/);
});

test("keeps operator access implementation and runtime effects blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-2B");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview, true);
  assert.equal(report.readiness.privateShadowOperatorAccessImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("records access fields, assertions, forbidden content, and redaction rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateShadowOperatorAccessBoundary;

  assert.match(boundary.requiredAccessFields.join("|"), /operatorIdHash/);
  assert.match(boundary.requiredAccessFields.join("|"), /sessionExpiresAt/);
  assert.match(boundary.requiredAccessAssertions.join("|"), /operator_access_cannot_override_kill_switch/);
  assert.match(boundary.requiredAccessAssertions.join("|"), /operator_access_success_does_not_enable_runtime/);
  assert.match(boundary.forbiddenAccessContent.join("|"), /raw_session_token/);
  assert.match(boundary.redactionRules.join("|"), /hash-only/);
});

test("rejects stale contract when operator access implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.privateShadowOperatorAccessImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_private_shadow_operator_access_contract\.json is out of date/);
});

test("blocks readiness if runtime review packet contract is not ready", () => {
  const workspace = makeWorkspace();
  const reviewPacket = readJson(workspace, PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT);
  reviewPacket.readiness.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview = false;
  reviewPacket.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT, reviewPacket);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowRuntimeReviewPacketContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_runtime_review_packet_contract_not_ready/);
});

test("blocks readiness if manual operator approval contract is not ready", () => {
  const workspace = makeWorkspace();
  const manualApproval = readJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT);
  manualApproval.readiness.readyForFutureManualApprovalImplementationReview = false;
  manualApproval.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, MANUAL_OPERATOR_APPROVAL_CONTRACT, manualApproval);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.manualOperatorApprovalContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /manual_operator_approval_contract_not_ready/);
});

test("blocks readiness if operator access runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "privateShadowOperatorAccess.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowOperatorAccessImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
