const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-shadow-runtime-review-packet-contract.cjs");
const CONTRACT = "trading_lab_step116_private_shadow_runtime_review_packet_contract.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const AUDIT_LOGGER_READINESS_CONTRACT = "trading_lab_step116_audit_logger_readiness_contract.json";
const DRY_RUN_REPLAY_CONTRACT = "trading_lab_step116_dry_run_replay_contract.json";
const SHADOW_HISTORY_REVIEW_CONTRACT = "trading_lab_step116_shadow_history_review_contract.json";
const RISK_GATE_CLEARANCE_CONTRACT = "trading_lab_step116_risk_gate_clearance_contract.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT =
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json";
const PRIVATE_SHADOW_ORDER_INTENT_CONTRACT =
  "trading_lab_step116_private_shadow_order_intent_contract.json";
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT =
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-runtime-review-packet-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    POLICY,
    PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
    AUDIT_LOGGER_READINESS_CONTRACT,
    DRY_RUN_REPLAY_CONTRACT,
    SHADOW_HISTORY_REVIEW_CONTRACT,
    RISK_GATE_CLEARANCE_CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    READ_ONLY_SNAPSHOT_RISK_INPUT_CONTRACT,
    PRIVATE_SHADOW_ORDER_INTENT_CONTRACT,
    PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT,
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

test("passes with current private shadow runtime review packet contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_shadow_runtime_review_packet_contract\.json/);
});

test("keeps private shadow runtime review packet implementation and runtime blocked", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.step, "Step 116-2A");
  assert.equal(report.currentState.contractOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview, true);
  assert.equal(report.readiness.privateShadowRuntimeReviewPacketImplementationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
});

test("records review packet fields, assertions, forbidden content, and redaction rules", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateShadowRuntimeReviewPacketBoundary;

  assert.match(boundary.requiredReviewPacketFields.join("|"), /approvalImportPreflightHash/);
  assert.match(boundary.requiredReviewPacketFields.join("|"), /intentAuditEventContractHash/);
  assert.match(boundary.requiredReviewPacketAssertions.join("|"), /hash_only_review_packet/);
  assert.match(boundary.requiredReviewPacketAssertions.join("|"), /review_packet_success_does_not_enable_runtime/);
  assert.match(boundary.forbiddenReviewPacketContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.redactionRules.join("|"), /hash only/);
});

test("rejects stale contract when review packet implementation is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.privateShadowRuntimeReviewPacketImplementationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_private_shadow_runtime_review_packet_contract\.json is out of date/);
});

test("blocks readiness if private shadow intent audit event contract is not ready", () => {
  const workspace = makeWorkspace();
  const auditEvent = readJson(workspace, PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT);
  auditEvent.readiness.readyForFuturePrivateShadowIntentAuditEventImplementationReview = false;
  auditEvent.readiness.orderSubmissionAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT, auditEvent);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowIntentAuditEventContractReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_intent_audit_event_contract_not_ready/);
});

test("blocks readiness if read-only approval import preflight is not ready", () => {
  const workspace = makeWorkspace();
  const approvalImport = readJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT);
  approvalImport.readiness.readyForFutureReadOnlyApprovalImportImplementationReview = false;
  approvalImport.readiness.providerCallsAllowed = true;
  writeJson(workspace, READ_ONLY_APPROVAL_IMPORT_PREFLIGHT, approvalImport);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.readOnlyApprovalImportPreflightReady, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /read_only_approval_import_preflight_not_ready/);
});

test("blocks readiness if private shadow runtime review packet artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "services", "trading"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "server", "src", "services", "trading", "shadowRuntimeReviewPacket.js"), "");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
