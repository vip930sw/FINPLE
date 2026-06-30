const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-read-only-approval-import-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_read_only_approval_import_implementation_preflight.json";
const READ_ONLY_APPROVAL_IMPORT_PREFLIGHT = "trading_lab_step116_read_only_approval_import_preflight.json";
const REDACTED_READ_ONLY_APPROVAL_TEMPLATE = "trading_lab_step116_redacted_read_only_approval_template.json";
const MOCK_APPROVAL_EVIDENCE_RECEIPT = "trading_lab_step116_mock_approval_evidence_receipt.json";
const REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT =
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json";
const REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT =
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json";
const REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES =
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json";
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json";
const ENV_RISK_GATE_CONTRACT = "trading_lab_step116_env_risk_gate_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-approval-import-implementation-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    READ_ONLY_APPROVAL_IMPORT_PREFLIGHT,
    REDACTED_READ_ONLY_APPROVAL_TEMPLATE,
    MOCK_APPROVAL_EVIDENCE_RECEIPT,
    REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT,
    REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT,
    REDACTED_APPROVAL_PACKET_VALIDATOR_FIXTURES,
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT,
    PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT,
    ENV_RISK_GATE_CONTRACT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
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

test("passes with current read-only approval import implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_read_only_approval_import_implementation_preflight\.json/);
});

test("keeps owner packet import, packet reads, provider calls, routes, UI, and orders blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFutureReadOnlyApprovalImportImplementationReview, false);
  assert.equal(report.readiness.importImplementationAllowedNow, false);
  assert.equal(report.readiness.ownerPacketReadAllowedNow, false);
  assert.equal(report.readiness.approvalPacketImportedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records explicit owner-packet rules without raw account, evidence, or secret values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futureReadOnlyApprovalImportImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /explicit_owner_packet_path_required_later/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_owner_packet_file/);
  assert.match(boundary.implementationRules.join("|"), /fail_closed_without_redacted_packet_validation/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_evidence_text/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|APP Secret|APP Key/);
});

test("rejects stale preflight if import implementation is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.importImplementationAllowedNow = true;
  report.readiness.ownerPacketReadAllowedNow = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /trading_lab_step116_read_only_approval_import_implementation_preflight\.json is out of date/,
  );
});

test("blocks if a private approval packet appears before owner import review", () => {
  const workspace = makeWorkspace();
  const packetPath = path.join(workspace, "data", "private", "trading", "read_only_approval.redacted.json");
  fs.mkdirSync(path.dirname(packetPath), { recursive: true });
  fs.writeFileSync(packetPath, "{}\n");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.ownerPrivatePacketAbsentNow, false);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /owner_private_packet_present_too_early/);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

test("blocks if hash preparation, template, or validator gates open unsafely", () => {
  const workspace = makeWorkspace();
  const hashPreflight = readJson(workspace, REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT);
  const template = readJson(workspace, REDACTED_READ_ONLY_APPROVAL_TEMPLATE);
  const validation = readJson(workspace, REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT);
  hashPreflight.readiness.hashGenerationAllowed = true;
  template.readiness.approvalPacketCreatedNow = true;
  validation.readiness.providerCallsAllowed = true;
  writeJson(workspace, REDACTED_APPROVAL_HASH_HELPER_PREFLIGHT, hashPreflight);
  writeJson(workspace, REDACTED_READ_ONLY_APPROVAL_TEMPLATE, template);
  writeJson(workspace, REDACTED_APPROVAL_PACKET_VALIDATION_PREFLIGHT, validation);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.hashPreparationStillDeferred, false);
  assert.equal(report.checks.redactedTemplateReady, false);
  assert.equal(report.checks.redactedPacketValidationPreflightReady, false);
});

test("blocks if provider or private runtime implementation gates open too early", () => {
  const workspace = makeWorkspace();
  const provider = readJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT);
  const runtime = readJson(workspace, PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT);
  provider.readiness.ownerPacketGateStillClosed = false;
  provider.readiness.providerImplementationAllowedNow = true;
  provider.readiness.providerCallsAllowed = true;
  runtime.readiness.readyForFuturePrivateShadowRuntimeImplementationReview = true;
  runtime.readiness.privateShadowRuntimeImplementationAllowedNow = true;
  runtime.readiness.runtimeRouteAllowed = true;
  writeJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT, provider);
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT, runtime);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, false);
  assert.equal(report.checks.privateShadowRuntimeImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_not_blocked/);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_runtime_implementation_not_blocked/);
});

test("blocks if import service, provider, runtime, route, UI, manual packet, or scenario artifacts appear", () => {
  const workspace = makeWorkspace();
  const files = [
    path.join(workspace, "server", "src", "services", "trading", "readOnlyApprovalImport.js"),
    path.join(workspace, "server", "src", "services", "trading", "kisReadOnlyProvider.js"),
    path.join(workspace, "server", "src", "services", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "server", "src", "routes", "trading", "privateShadowRuntime.js"),
    path.join(workspace, "src", "pages", "TradingLab.jsx"),
    path.join(workspace, "data", "private", "trading", "manual_order_permission.redacted.json"),
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
  ];
  for (const filePath of files) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "{}\n");
  }

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
