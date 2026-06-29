const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-private-shadow-runtime-review-packet.cjs");

function validPacket(overrides = {}) {
  return {
    reviewPacketId: "review_shadow_001",
    mode: "shadow",
    operatorScopeHash: "hmac-sha256:operator_scope_hash_123456",
    approvalImportPreflightHash: "hmac-sha256:approval_preflight_hash_123456",
    envRiskGateHash: "hmac-sha256:env_risk_gate_hash_123456",
    snapshotRiskInputHash: "hmac-sha256:snapshot_risk_input_hash_123456",
    orderIntentContractHash: "hmac-sha256:order_intent_contract_hash_123456",
    intentAuditEventContractHash: "hmac-sha256:intent_audit_event_hash_123456",
    riskGateClearanceHash: "hmac-sha256:risk_gate_clearance_hash_123456",
    dryRunReplayReferenceHash: "hmac-sha256:dry_run_replay_hash_123456",
    shadowHistoryReviewReferenceHash: "hmac-sha256:shadow_history_hash_123456",
    auditLoggerReadinessHash: "hmac-sha256:audit_logger_hash_123456",
    killSwitchStateHash: "hmac-sha256:kill_switch_hash_123456",
    manualApprovalPolicyHash: "hmac-sha256:manual_approval_policy_hash_123456",
    createdAt: "2026-06-29T00:00:00.000Z",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makePacketFile(packet) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-review-packet-"));
  const filePath = path.join(dir, "private-shadow-runtime-review-packet.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(packet, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a hash-only private shadow runtime review packet without runtime enablement", () => {
  const result = runValidator(["--packet", makePacketFile(validPacket())]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit packet path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /packet_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const packet = validPacket({ unexpected: "redacted_value" });
  delete packet.publicUiAllowed;
  const result = runValidator(["--packet", makePacketFile(packet)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects live mode and any enabled allow flag", () => {
  const result = runValidator([
    "--packet",
    makePacketFile(
      validPacket({
        mode: "live_guarded",
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
        runtimeRouteAllowed: true,
        dbMigrationAllowed: true,
        publicUiAllowed: true,
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_mode/);
  assert.match(codes, /allow_flag_enabled/);
});

test("rejects malformed timestamps and hashes", () => {
  const result = runValidator([
    "--packet",
    makePacketFile(
      validPacket({
        createdAt: "2026-06-29",
        operatorScopeHash: "raw_operator_scope",
        approvalImportPreflightHash: "not-a-hash",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_timestamp/);
  assert.match(codes, /malformed_hash_field/);
});

test("rejects raw payload labels, private paths, and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--packet",
    makePacketFile({
      ...validPacket(),
      app_secret: "raw_provider_payload",
      operatorScopeHash: "hmac-sha256:operator_scope_hash_123456",
      manualApprovalPolicyHash: "data/private/trading/manual_order_permission.redacted.json",
    }),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_field/);
  assert.match(codes, /secret_value_present|malformed_hash_field/);
  assert.doesNotMatch(result.stdout, /raw_provider_payload|app_secret/);
  assert.doesNotMatch(result.stdout, /manual_order_permission|data\/private/);
});

test("rejects non-object JSON payloads", () => {
  const result = runValidator(["--packet", makePacketFile(["not", "an", "object"])]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(parsed.valid, false);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /review_packet_must_be_object/);
});
