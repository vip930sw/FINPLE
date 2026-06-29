const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-private-shadow-intent-audit-event.cjs");

function validEvent(overrides = {}) {
  return {
    eventId: "audit_shadow_001",
    eventType: "private_shadow_order_intent_recorded",
    mode: "shadow",
    severity: "info",
    status: "recorded",
    createdAt: "2026-06-29T00:00:00.000Z",
    operatorIdHash: "hmac-sha256:operator_hash_123456",
    strategyIdHash: "hmac-sha256:strategy_hash_123456",
    intentIdHash: "hmac-sha256:intent_id_hash_123456",
    orderIntentHash: "hmac-sha256:order_intent_hash_123456",
    riskInputHash: "hmac-sha256:risk_input_hash_123456",
    riskGateStatus: "live_review_required",
    riskEventHash: "hmac-sha256:risk_event_hash_123456",
    market: "KR",
    symbol: "005930",
    side: "BUY",
    decisionStatus: "shadow_recorded",
    snapshotFreshnessStatus: "fresh",
    killSwitchStateHash: "hmac-sha256:kill_switch_hash_123456",
    manualApprovalStateHash: "hmac-sha256:manual_approval_hash_123456",
    dryRunReplayIdHash: "hmac-sha256:dry_run_hash_123456",
    shadowHistoryReferenceHash: "hmac-sha256:shadow_history_hash_123456",
    payloadHash: "hmac-sha256:payload_hash_123456",
    previousEventHash: "genesis_event",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    ...overrides,
  };
}

function makeEventFile(event) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-audit-event-"));
  const filePath = path.join(dir, "private-shadow-intent-audit-event.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(event, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a hash-only private shadow intent audit event without order submission", () => {
  const result = runValidator(["--event", makeEventFile(validEvent())]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit event path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /event_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const event = validEvent({ unexpected: "redacted_value" });
  delete event.orderSubmissionAllowed;
  const result = runValidator(["--event", makeEventFile(event)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects live mode, enabled provider calls, and order submission", () => {
  const result = runValidator([
    "--event",
    makeEventFile(
      validEvent({
        mode: "live_guarded",
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_mode/);
  assert.match(codes, /provider_call_flag_enabled/);
  assert.match(codes, /order_submission_flag_enabled/);
});

test("rejects unsupported event, severity, status, and decision values", () => {
  const result = runValidator([
    "--event",
    makeEventFile(
      validEvent({
        eventType: "order_submitted",
        severity: "critical",
        status: "submitted",
        riskGateStatus: "clear",
        decisionStatus: "approved",
        snapshotFreshnessStatus: "unknown",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_event_type/);
  assert.match(codes, /invalid_severity/);
  assert.match(codes, /invalid_status/);
  assert.match(codes, /invalid_risk_gate_status/);
  assert.match(codes, /invalid_decision_status/);
  assert.match(codes, /invalid_snapshot_freshness_status/);
});

test("rejects malformed hashes and unsafe market fields", () => {
  const result = runValidator([
    "--event",
    makeEventFile(
      validEvent({
        operatorIdHash: "raw_operator",
        orderIntentHash: "not-a-hash",
        previousEventHash: "not-a-hash",
        market: "LIVE",
        symbol: "005930;DROP",
        side: "CANCEL",
        createdAt: "2026-06-29",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /invalid_market/);
  assert.match(codes, /invalid_symbol/);
  assert.match(codes, /invalid_side/);
  assert.match(codes, /malformed_timestamp/);
});

test("rejects secret-like values and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--event",
    makeEventFile({
      ...validEvent(),
      app_secret: "raw_provider_payload",
      symbol: "APP_KEY",
    }),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_field/);
  assert.match(codes, /secret_value_present/);
  assert.doesNotMatch(result.stdout, /raw_provider_payload|app_secret/);
  assert.doesNotMatch(result.stdout, /APP_KEY/);
});
