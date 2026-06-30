const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-read-only-snapshot-normalization.cjs");

function validSnapshot(overrides = {}) {
  return {
    snapshotId: "snap_readonly_001",
    snapshotType: "account_cash_balance_snapshot",
    sourceEnvelopeHash: "hmac-sha256:envelope_hash_123456",
    createdAt: "2026-06-29T00:00:00.000Z",
    market: "KR",
    symbol: null,
    currency: "KRW",
    accountIdHash: "hmac-sha256:account_hash_123456",
    valueHash: "hmac-sha256:value_hash_123456",
    freshnessStatus: "fresh",
    providerStatus: "success",
    redactionVersion: "v1",
    rawPayloadStored: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    ...overrides,
  };
}

function makeSnapshotFile(snapshot) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-snapshot-normalization-"));
  const filePath = path.join(dir, "normalized-snapshot.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(snapshot, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a read-only normalized snapshot without provider calls", () => {
  const snapshotPath = makeSnapshotFile(validSnapshot());
  const result = runValidator(["--snapshot", snapshotPath]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit snapshot path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /snapshot_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const snapshot = validSnapshot({ unexpected: "redacted_value" });
  delete snapshot.valueHash;
  const result = runValidator(["--snapshot", makeSnapshotFile(snapshot)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects unknown snapshot types, malformed timestamps, and malformed hashes", () => {
  const result = runValidator([
    "--snapshot",
    makeSnapshotFile(
      validSnapshot({
        snapshotType: "execution_snapshot",
        createdAt: "2026-06-29",
        sourceEnvelopeHash: "not-a-hash",
        accountIdHash: "not-a-hash",
        valueHash: "not-a-hash",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_snapshot_type/);
  assert.match(codes, /malformed_timestamp/);
  assert.match(codes, /malformed_hash_field/);
});

test("rejects invalid market, symbol, currency, freshness, and provider statuses", () => {
  const result = runValidator([
    "--snapshot",
    makeSnapshotFile(
      validSnapshot({
        market: "LIVE",
        symbol: "bad symbol",
        currency: "EUR",
        freshnessStatus: "live_fresh",
        providerStatus: "filled",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_market/);
  assert.match(codes, /invalid_symbol/);
  assert.match(codes, /invalid_currency/);
  assert.match(codes, /unknown_freshness_status/);
  assert.match(codes, /unknown_provider_status/);
});

test("rejects raw payload storage, provider calls, orders, and secret-like content", () => {
  const result = runValidator([
    "--snapshot",
    makeSnapshotFile(
      validSnapshot({
        rawPayloadStored: true,
        providerCallsAllowed: true,
        orderSubmissionAllowed: true,
        rawProviderPayload: "APP_SECRET_50195326",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /raw_payload_stored/);
  assert.match(codes, /provider_call_flag_enabled/);
  assert.match(codes, /order_submission_flag_enabled/);
  assert.match(codes, /secret_value_present/);
  assert.doesNotMatch(result.stdout, /APP_SECRET|50195326/);
});
