const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-manual-order-permission-packet.cjs");
const NOW = "2026-06-29T00:00:00.000Z";

function validPacket(overrides = {}) {
  return {
    permissionId: "permission_fixture_valid_001",
    mode: "live_guarded",
    approvedByHash: "hmac-sha256:fixture_operator_hash_123456",
    approvedAt: "2026-06-29T00:00:00.000Z",
    expiresAt: "2026-07-29T00:00:00.000Z",
    operatorAccessHash: "hmac-sha256:fixture_operator_access_hash_123456",
    manualApprovalPolicyHash: "hmac-sha256:fixture_manual_policy_hash_123456",
    orderAdapterDesignReviewHash: "hmac-sha256:fixture_order_adapter_review_hash_123456",
    killSwitchClearanceHash: "hmac-sha256:fixture_kill_switch_hash_123456",
    riskGateClearanceHash: "hmac-sha256:fixture_risk_gate_hash_123456",
    orderCredentialBoundaryHash: "hmac-sha256:fixture_order_credential_hash_123456",
    dryRunReplayHash: "hmac-sha256:fixture_dry_run_hash_123456",
    shadowHistoryReviewHash: "hmac-sha256:fixture_shadow_history_hash_123456",
    auditLoggerReadinessHash: "hmac-sha256:fixture_audit_logger_hash_123456",
    allowedSymbolHashes: ["hmac-sha256:fixture_symbol_hash_123456"],
    maxOrderNotional: 100000,
    dailyLossLimit: 10000,
    orderAttemptLimit: 3,
    revocationPlanHash: "hmac-sha256:fixture_revocation_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makePacketFile(packet) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-packet-"));
  const filePath = path.join(dir, "manual_order_permission.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(packet, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], { encoding: "utf8" });
}

test("validates a redacted manual order permission packet", () => {
  const packetPath = makePacketFile(validPacket());
  const result = runValidator(["--packet", packetPath, "--now", NOW]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit packet path and does not use a default private packet path", () => {
  const result = runValidator(["--now", NOW]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /packet_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing fields and unknown fields", () => {
  const packet = validPacket({ unexpected: "redacted_value" });
  delete packet.revocationPlanHash;
  const result = runValidator(["--packet", makePacketFile(packet), "--now", NOW]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects malformed hashes, enabled flags, and forbidden secret-like values without echoing account ids", () => {
  const result = runValidator([
    "--packet",
    makePacketFile(
      validPacket({
        operatorAccessHash: "1234567890",
        providerCallsAllowed: true,
        revocationPlanHash: "hmac-sha256:APP_SECRET_VALUE",
      }),
    ),
    "--now",
    NOW,
  ]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /forbidden_flag_enabled/);
  assert.match(codes, /forbidden_string_value/);
  assert.doesNotMatch(result.stdout, /1234567890/);
});

test("rejects expired permissions, invalid mode, and invalid time windows", () => {
  const result = runValidator([
    "--packet",
    makePacketFile(
      validPacket({
        approvedAt: "2026-07-29T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
        mode: "paper",
      }),
    ),
    "--now",
    NOW,
  ]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /expired_permission/);
  assert.match(codes, /invalid_mode/);
  assert.match(codes, /invalid_time_window/);
});

test("rejects malformed symbol hashes and invalid numeric limits", () => {
  const result = runValidator([
    "--packet",
    makePacketFile(
      validPacket({
        allowedSymbolHashes: ["005930"],
        maxOrderNotional: 0,
        dailyLossLimit: -1,
        orderAttemptLimit: 1.5,
      }),
    ),
    "--now",
    NOW,
  ]);
  const codes = JSON.parse(result.stdout).errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_symbol_hash/);
  assert.match(codes, /invalid_numeric_limit/);
  assert.match(codes, /invalid_order_attempt_limit/);
});
