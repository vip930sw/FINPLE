const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
const NOW = "2026-06-29T00:00:00.000Z";

function validPacket(overrides = {}) {
  return {
    approvalId: "approval_mockshadow_001",
    approvedByHash: "hmac-sha256:operator_hash_123456",
    approvedAt: "2026-06-29T00:00:00.000Z",
    expiresAt: "2026-07-29T00:00:00.000Z",
    scope: "read_only_shadow",
    environment: "mock",
    baseUrlScope: "virtual_trading_openapivts",
    accountIdHash: "hmac-sha256:account_hash_123456",
    allowedReadScopes: [
      "account_cash_balance",
      "account_positions",
      "orderable_cash",
      "current_quotes",
      "fx_rate",
      "market_session_state",
      "provider_rate_limit_state",
    ],
    forbiddenActions: [
      "order_submission",
      "order_cancellation",
      "position_mutation",
      "live_trading_endpoint",
      "raw_provider_response_persistence",
      "public_frontend_secret_access",
      "scenario_monthly_cache_write",
    ],
    evidenceTicketHash: "hmac-sha256:evidence_hash_123456",
    revocationPlanHash: "hmac-sha256:revocation_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makePacketFile(packet) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-approval-packet-"));
  const filePath = path.join(dir, "packet.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(packet, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a redacted read-only mock approval packet", () => {
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
  const packetPath = makePacketFile(packet);
  const result = runValidator(["--packet", packetPath, "--now", NOW]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.equal(parsed.valid, false);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /missing_required_field/);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /unknown_field/);
});

test("rejects malformed hashes, enabled flags, and forbidden secret-like values without echoing account ids", () => {
  const packetPath = makePacketFile(
    validPacket({
      accountIdHash: "50195326",
      providerCallsAllowed: true,
      evidenceTicketHash: "hmac-sha256:APP_SECRET_VALUE",
    }),
  );
  const result = runValidator(["--packet", packetPath, "--now", NOW]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /forbidden_flag_enabled/);
  assert.match(codes, /forbidden_string_value/);
  assert.doesNotMatch(result.stdout, /50195326/);
});

test("rejects expired approvals and invalid shadow boundaries", () => {
  const packetPath = makePacketFile(
    validPacket({
      expiresAt: "2026-06-28T00:00:00.000Z",
      scope: "live_guarded",
      environment: "production",
      baseUrlScope: "live_trading_endpoint",
    }),
  );
  const result = runValidator(["--packet", packetPath, "--now", NOW]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /expired_approval/);
  assert.match(codes, /invalid_scope/);
  assert.match(codes, /invalid_environment/);
  assert.match(codes, /invalid_base_url_scope/);
});

test("rejects unknown read scopes and missing required forbidden actions", () => {
  const packetPath = makePacketFile(
    validPacket({
      allowedReadScopes: ["account_cash_balance", "order_submission"],
      forbiddenActions: ["scenario_monthly_cache_write"],
    }),
  );
  const result = runValidator(["--packet", packetPath, "--now", NOW]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_array_value/);
  assert.match(codes, /missing_forbidden_action/);
});
