const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-read-only-snapshot-risk-input.cjs");

function validRiskInput(overrides = {}) {
  return {
    evaluationId: "eval_shadow_001",
    orderIntentHash: "hmac-sha256:order_intent_hash_123456",
    mode: "shadow",
    generatedAt: "2026-06-29T00:00:00.000Z",
    market: "KR",
    symbol: "005930",
    side: "BUY",
    quantity: 1,
    estimatedNotionalHash: "hmac-sha256:notional_hash_123456",
    quoteSnapshotHash: "hmac-sha256:quote_snapshot_hash_123456",
    accountStateSnapshotHash: "hmac-sha256:account_state_hash_123456",
    orderableCashSnapshotHash: "hmac-sha256:cash_snapshot_hash_123456",
    positionsSnapshotHash: "hmac-sha256:positions_snapshot_hash_123456",
    fxRateSnapshotHash: "hmac-sha256:fx_snapshot_hash_123456",
    marketSessionSnapshotHash: "hmac-sha256:market_session_hash_123456",
    providerRateLimitSnapshotHash: "hmac-sha256:rate_limit_hash_123456",
    snapshotFreshnessStatus: "fresh",
    accountMatchStatus: "account_hash_matched",
    providerRateLimitStatus: "within_limit",
    killSwitchStateHash: "hmac-sha256:kill_switch_hash_123456",
    manualApprovalStateHash: "hmac-sha256:manual_approval_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    ...overrides,
  };
}

function makeRiskInputFile(input) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-risk-input-"));
  const filePath = path.join(dir, "snapshot-risk-input.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(input, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a hash-only read-only snapshot risk input without provider calls", () => {
  const result = runValidator(["--input", makeRiskInputFile(validRiskInput())]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit input path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /input_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const input = validRiskInput({ unexpected: "redacted_value" });
  delete input.orderSubmissionAllowed;
  const result = runValidator(["--input", makeRiskInputFile(input)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects live modes, enabled provider calls, and order submission", () => {
  const result = runValidator([
    "--input",
    makeRiskInputFile(
      validRiskInput({
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

test("rejects stale snapshots, account mismatches, and blocked rate limits", () => {
  const result = runValidator([
    "--input",
    makeRiskInputFile(
      validRiskInput({
        snapshotFreshnessStatus: "stale",
        accountMatchStatus: "account_hash_mismatch",
        providerRateLimitStatus: "blocked",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /snapshot_not_fresh/);
  assert.match(codes, /account_mismatch/);
  assert.match(codes, /provider_rate_limit_blocked/);
});

test("rejects malformed hashes and unsafe trading fields", () => {
  const result = runValidator([
    "--input",
    makeRiskInputFile(
      validRiskInput({
        orderIntentHash: "raw_order_intent",
        quoteSnapshotHash: "not-a-hash",
        market: "LIVE",
        symbol: "005930;DROP",
        side: "CANCEL",
        quantity: 0,
        generatedAt: "2026-06-29",
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
  assert.match(codes, /invalid_quantity/);
  assert.match(codes, /malformed_timestamp/);
});

test("rejects secret-like values and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--input",
    makeRiskInputFile({
      ...validRiskInput(),
      app_secret: "raw_provider_payload",
      manualApprovalStateHash: "hmac-sha256:manual_approval_hash_123456",
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
