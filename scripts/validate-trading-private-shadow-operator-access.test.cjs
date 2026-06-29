const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-private-shadow-operator-access.cjs");

function validAccess(overrides = {}) {
  return {
    operatorAccessScopeId: "access_shadow_001",
    mode: "shadow",
    operatorIdHash: "hmac-sha256:operator_hash_123456",
    roleHash: "hmac-sha256:role_hash_123456",
    authContextHash: "hmac-sha256:auth_context_hash_123456",
    sessionIdHash: "hmac-sha256:session_hash_123456",
    sessionIssuedAt: "2026-06-29T00:00:00.000Z",
    sessionExpiresAt: "2026-06-29T00:30:00.000Z",
    allowedActionHashes: ["hmac-sha256:allowed_action_hash_123456"],
    deniedActionHashes: ["hmac-sha256:denied_order_submit_hash_123456"],
    approvalPolicyHash: "hmac-sha256:approval_policy_hash_123456",
    runtimeReviewPacketHash: "hmac-sha256:runtime_review_packet_hash_123456",
    intentAuditEventHash: "hmac-sha256:intent_audit_hash_123456",
    killSwitchStateHash: "hmac-sha256:kill_switch_hash_123456",
    privateNetworkBoundaryHash: "hmac-sha256:private_network_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makeAccessFile(access) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-operator-access-"));
  const filePath = path.join(dir, "private-shadow-operator-access.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(access, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates hash-only private shadow operator access without runtime enablement", () => {
  const result = runValidator(["--access", makeAccessFile(validAccess())]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit access path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /access_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const access = validAccess({ unexpected: "redacted_value" });
  delete access.publicUiAllowed;
  const result = runValidator(["--access", makeAccessFile(access)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects live mode and any enabled allow flag", () => {
  const result = runValidator([
    "--access",
    makeAccessFile(
      validAccess({
        mode: "live_guarded",
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
        runtimeRouteAllowed: true,
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

test("rejects malformed hashes, empty action arrays, and malformed timestamps", () => {
  const result = runValidator([
    "--access",
    makeAccessFile(
      validAccess({
        operatorIdHash: "raw_operator",
        authContextHash: "not-a-hash",
        allowedActionHashes: [],
        deniedActionHashes: ["plain-denied-action"],
        sessionIssuedAt: "2026-06-29",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /hash_array_empty/);
  assert.match(codes, /malformed_timestamp/);
});

test("rejects non-timeboxed or overlong sessions", () => {
  const result = runValidator([
    "--access",
    makeAccessFile(
      validAccess({
        sessionIssuedAt: "2026-06-29T00:00:00.000Z",
        sessionExpiresAt: "2026-06-29T02:00:00.000Z",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /session_too_long/);

  const reversed = runValidator([
    "--access",
    makeAccessFile(
      validAccess({
        sessionIssuedAt: "2026-06-29T01:00:00.000Z",
        sessionExpiresAt: "2026-06-29T00:30:00.000Z",
      }),
    ),
  ]);
  assert.equal(reversed.status, 1);
  assert.match(JSON.parse(reversed.stdout).errors.map((error) => error.code).join("|"), /session_not_timeboxed/);
});

test("rejects raw tokens, private paths, and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--access",
    makeAccessFile({
      ...validAccess(),
      app_secret: "raw_session_token",
      approvalPolicyHash: "data/private/trading/approval-policy.redacted.json",
    }),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_field/);
  assert.match(codes, /secret_value_present|malformed_hash_field/);
  assert.doesNotMatch(result.stdout, /raw_session_token|app_secret/);
  assert.doesNotMatch(result.stdout, /approval-policy|data\/private/);
});
