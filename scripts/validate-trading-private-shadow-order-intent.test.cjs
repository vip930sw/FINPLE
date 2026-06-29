const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-private-shadow-order-intent.cjs");

function validIntent(overrides = {}) {
  return {
    intentId: "intent_shadow_001",
    mode: "shadow",
    strategyIdHash: "hmac-sha256:strategy_hash_123456",
    operatorIdHash: "hmac-sha256:operator_hash_123456",
    createdAt: "2026-06-29T00:00:00.000Z",
    market: "KR",
    symbol: "005930",
    side: "BUY",
    orderType: "MARKET",
    quantity: 1,
    limitPriceHash: "not_applicable",
    estimatedNotionalHash: "hmac-sha256:notional_hash_123456",
    currency: "KRW",
    riskInputHash: "hmac-sha256:risk_input_hash_123456",
    riskGateStatus: "live_review_required",
    quoteSnapshotHash: "hmac-sha256:quote_snapshot_hash_123456",
    accountStateSnapshotHash: "hmac-sha256:account_state_hash_123456",
    orderableCashSnapshotHash: "hmac-sha256:cash_snapshot_hash_123456",
    dryRunReplayIdHash: "hmac-sha256:dry_run_hash_123456",
    shadowHistoryReferenceHash: "hmac-sha256:shadow_history_hash_123456",
    auditEventHash: "hmac-sha256:audit_event_hash_123456",
    idempotencyKeyHash: "hmac-sha256:idempotency_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    ...overrides,
  };
}

function makeIntentFile(intent) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-shadow-intent-"));
  const filePath = path.join(dir, "private-shadow-order-intent.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(intent, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a hash-only private shadow order intent without order submission", () => {
  const result = runValidator(["--intent", makeIntentFile(validIntent())]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit intent path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /intent_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const intent = validIntent({ unexpected: "redacted_value" });
  delete intent.orderSubmissionAllowed;
  const result = runValidator(["--intent", makeIntentFile(intent)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects live mode, enabled provider calls, and order submission", () => {
  const result = runValidator([
    "--intent",
    makeIntentFile(
      validIntent({
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

test("rejects submitted or cleared risk gate states", () => {
  const result = runValidator([
    "--intent",
    makeIntentFile(
      validIntent({
        riskGateStatus: "clear",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_risk_gate_status/);
});

test("rejects malformed hashes and unsafe order fields", () => {
  const result = runValidator([
    "--intent",
    makeIntentFile(
      validIntent({
        strategyIdHash: "raw_strategy",
        riskInputHash: "not-a-hash",
        market: "LIVE",
        symbol: "005930;DROP",
        side: "CANCEL",
        orderType: "ORDER_CASH",
        quantity: 0,
        currency: "BTC",
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
  assert.match(codes, /invalid_order_type/);
  assert.match(codes, /invalid_quantity/);
  assert.match(codes, /invalid_currency/);
  assert.match(codes, /malformed_timestamp/);
});

test("rejects secret-like values and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--intent",
    makeIntentFile({
      ...validIntent(),
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
