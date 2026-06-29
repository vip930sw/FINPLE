const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-manual-order-permission.cjs");
const NOW = "2026-06-29T00:00:00.000Z";

function validPermission(overrides = {}) {
  return {
    permissionId: "permission_live_001",
    mode: "live_guarded",
    approvedByHash: "hmac-sha256:approved_by_hash_123456",
    approvedAt: "2026-06-29T00:00:00.000Z",
    expiresAt: "2026-06-29T01:00:00.000Z",
    operatorAccessHash: "hmac-sha256:operator_access_hash_123456",
    manualApprovalPolicyHash: "hmac-sha256:manual_policy_hash_123456",
    orderAdapterDesignReviewHash: "hmac-sha256:adapter_review_hash_123456",
    killSwitchClearanceHash: "hmac-sha256:kill_switch_clear_hash_123456",
    riskGateClearanceHash: "hmac-sha256:risk_gate_clear_hash_123456",
    orderCredentialBoundaryHash: "hmac-sha256:credential_boundary_hash_123456",
    dryRunReplayHash: "hmac-sha256:dry_run_replay_hash_123456",
    shadowHistoryReviewHash: "hmac-sha256:shadow_history_hash_123456",
    auditLoggerReadinessHash: "hmac-sha256:audit_logger_hash_123456",
    allowedSymbolHashes: ["hmac-sha256:allowed_symbol_hash_123456"],
    maxOrderNotional: 100000,
    dailyLossLimit: 10000,
    orderAttemptLimit: 3,
    revocationPlanHash: "hmac-sha256:revocation_plan_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makePermissionFile(permission) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-manual-order-permission-"));
  const filePath = path.join(dir, "manual-order-permission.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(permission, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates hash-only manual order permission without enabling runtime effects", () => {
  const result = runValidator(["--permission", makePermissionFile(validPermission()), "--now", NOW]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit permission path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /permission_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const permission = validPermission({ unexpected: "redacted_value" });
  delete permission.publicUiAllowed;
  const result = runValidator(["--permission", makePermissionFile(permission), "--now", NOW]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects non-live permission mode and any enabled allow flag", () => {
  const result = runValidator([
    "--permission",
    makePermissionFile(
      validPermission({
        mode: "shadow",
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
        runtimeRouteAllowed: true,
        publicUiAllowed: true,
      }),
    ),
    "--now",
    NOW,
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_mode/);
  assert.match(codes, /allow_flag_enabled/);
});

test("rejects malformed hashes, empty symbols, and malformed timestamps", () => {
  const result = runValidator([
    "--permission",
    makePermissionFile(
      validPermission({
        approvedByHash: "raw_operator",
        operatorAccessHash: "not-a-hash",
        allowedSymbolHashes: [],
        approvedAt: "2026-06-29",
      }),
    ),
    "--now",
    NOW,
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /hash_array_empty/);
  assert.match(codes, /malformed_timestamp/);
});

test("rejects expired, reversed, and overlong permission windows", () => {
  const expired = runValidator([
    "--permission",
    makePermissionFile(
      validPermission({
        approvedAt: "2026-06-28T00:00:00.000Z",
        expiresAt: "2026-06-28T01:00:00.000Z",
      }),
    ),
    "--now",
    NOW,
  ]);
  assert.equal(expired.status, 1);
  assert.match(JSON.parse(expired.stdout).errors.map((error) => error.code).join("|"), /expired_permission/);

  const reversed = runValidator([
    "--permission",
    makePermissionFile(
      validPermission({
        approvedAt: "2026-06-29T01:00:00.000Z",
        expiresAt: "2026-06-29T00:30:00.000Z",
      }),
    ),
    "--now",
    NOW,
  ]);
  assert.equal(reversed.status, 1);
  assert.match(JSON.parse(reversed.stdout).errors.map((error) => error.code).join("|"), /invalid_time_window/);

  const overlong = runValidator([
    "--permission",
    makePermissionFile(
      validPermission({
        approvedAt: "2026-06-29T00:00:00.000Z",
        expiresAt: "2026-06-30T01:00:00.000Z",
      }),
    ),
    "--now",
    NOW,
  ]);
  assert.equal(overlong.status, 1);
  assert.match(JSON.parse(overlong.stdout).errors.map((error) => error.code).join("|"), /permission_window_too_long/);
});

test("rejects unsafe numeric caps", () => {
  const result = runValidator([
    "--permission",
    makePermissionFile(
      validPermission({
        maxOrderNotional: 100000001,
        dailyLossLimit: -1,
        orderAttemptLimit: 21,
      }),
    ),
    "--now",
    NOW,
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /numeric_limit_too_high/);
  assert.match(codes, /invalid_numeric_limit/);
  assert.match(codes, /order_attempt_limit_too_high/);
});

test("rejects raw tokens, private paths, and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--permission",
    makePermissionFile({
      ...validPermission(),
      app_secret: "raw_session_token",
      revocationPlanHash: "data/private/trading/manual-order-revocation.redacted.json",
    }),
    "--now",
    NOW,
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_field/);
  assert.match(codes, /secret_value_present|malformed_hash_field/);
  assert.doesNotMatch(result.stdout, /raw_session_token|app_secret/);
  assert.doesNotMatch(result.stdout, /manual-order-revocation|data\/private/);
});
