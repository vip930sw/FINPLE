const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-read-only-provider-response-envelope.cjs");

function validEnvelope(overrides = {}) {
  return {
    requestId: "req_response_001",
    mode: "shadow",
    endpointCategory: "account_cash_balance_read",
    statusCodeClass: "2xx",
    providerStatus: "success",
    receivedAt: "2026-06-29T00:00:00.000Z",
    latencyBucket: "lt_500ms",
    rateLimitState: "not_limited",
    normalizedSnapshotType: "account_cash_balance_snapshot",
    normalizedSnapshotHash: "hmac-sha256:snapshot_hash_123456",
    rawResponseHash: "hmac-sha256:response_hash_123456",
    redactionVersion: "v1",
    providerCallAllowed: false,
    orderSubmissionAllowed: false,
    ...overrides,
  };
}

function makeEnvelopeFile(envelope) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-provider-response-envelope-"));
  const filePath = path.join(dir, "response-envelope.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(envelope, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a read-only provider response envelope without provider calls", () => {
  const envelopePath = makeEnvelopeFile(validEnvelope());
  const result = runValidator(["--envelope", envelopePath]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit envelope path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /envelope_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const envelope = validEnvelope({ unexpected: "redacted_value" });
  delete envelope.rawResponseHash;
  const result = runValidator(["--envelope", makeEnvelopeFile(envelope)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects non-shadow mode, unknown categories, and order categories", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        mode: "live_guarded",
        endpointCategory: "order_submission",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_mode/);
  assert.match(codes, /order_endpoint_category/);
});

test("rejects unknown snapshot types, malformed hashes, and invalid metadata buckets", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        statusCodeClass: "3xx",
        providerStatus: "filled",
        latencyBucket: "fast",
        rateLimitState: "secret_limited",
        normalizedSnapshotType: "unknown_snapshot",
        normalizedSnapshotHash: "not-a-hash",
        rawResponseHash: "not-a-hash",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_status_code_class/);
  assert.match(codes, /unknown_provider_status/);
  assert.match(codes, /unknown_latency_bucket/);
  assert.match(codes, /unknown_rate_limit_state/);
  assert.match(codes, /unknown_normalized_snapshot_type/);
  assert.match(codes, /malformed_hash_field/);
});

test("rejects enabled provider calls, order submission, and raw payload shapes", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        providerCallAllowed: true,
        orderSubmissionAllowed: true,
        rawProviderPayloadShape: "forbidden_shape_marker",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /provider_call_flag_enabled/);
  assert.match(codes, /order_submission_flag_enabled/);
  assert.match(codes, /raw_provider_payload_shape_present/);
  assert.doesNotMatch(result.stdout, /forbidden_shape_marker/);
});

test("rejects secret-like values and malformed timestamps without echoing sensitive input", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        receivedAt: "2026-06-29",
        normalizedSnapshotHash: "hmac-sha256:APP_SECRET_123456",
        rawResponseHash: "hmac-sha256:50195326abcdef",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_timestamp/);
  assert.match(codes, /secret_value_present/);
  assert.doesNotMatch(result.stdout, /APP_SECRET|50195326/);
});
