const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-read-only-provider-request-envelope.cjs");

function validEnvelope(overrides = {}) {
  return {
    requestId: "req_readonly_001",
    mode: "shadow",
    approvalIdHash: "hmac-sha256:approval_hash_123456",
    baseUrl: "https://openapivts.koreainvestment.com:29443",
    method: "GET",
    pathTemplate: "/uapi/domestic-stock/v1/quotations/inquire-price",
    endpointCategory: "current_quotes_read",
    queryShape: {
      market: "string_shape",
      symbolHash: "redacted_hash_shape",
    },
    headerNames: ["content_type", "tr_id_hash", "approval_hash"],
    bodyShape: {},
    timestamp: "2026-06-29T00:00:00.000Z",
    idempotencyKey: "idem_readonly_001",
    requestHash: "hmac-sha256:request_hash_123456",
    responseHash: "pending_hash",
    redactionVersion: "v1",
    providerCallAllowed: false,
    ...overrides,
  };
}

function makeEnvelopeFile(envelope) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-read-only-provider-envelope-"));
  const filePath = path.join(dir, "request-envelope.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(envelope, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates a read-only provider request envelope without provider calls", () => {
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
  delete envelope.providerCallAllowed;
  const result = runValidator(["--envelope", makeEnvelopeFile(envelope)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects non-shadow mode, live base URL, non-GET method, and unsafe path templates", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        mode: "live_guarded",
        baseUrl: "https://openapi.koreainvestment.com:9443",
        method: "POST",
        pathTemplate: "/uapi/domestic-stock/v1/trading/order-cash",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_mode/);
  assert.match(codes, /invalid_base_url/);
  assert.match(codes, /invalid_method/);
  assert.match(codes, /unsafe_path_template/);
});

test("rejects unknown endpoint categories, enabled provider calls, and malformed hashes", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        approvalIdHash: "approval_raw_value",
        endpointCategory: "order_submission",
        providerCallAllowed: true,
        requestHash: "not-a-hash",
        responseHash: "not-a-hash",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_hash_field/);
  assert.match(codes, /unknown_endpoint_category/);
  assert.match(codes, /provider_call_flag_enabled/);
});

test("rejects secret-like values, raw provider payload labels, and unsafe query/body/header shapes", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        queryShape: {
          app_secret: "string_shape",
          account: "50195326",
        },
        headerNames: ["APP_KEY"],
        bodyShape: {
          raw_provider_payload: "string_shape",
        },
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /secret_value_present/);
  assert.match(codes, /unsafe_shape_value/);
  assert.doesNotMatch(result.stdout, /50195326/);
  assert.doesNotMatch(result.stdout, /APP_KEY|app_secret|raw_provider_payload/);
});

test("rejects malformed timestamps and idempotency keys", () => {
  const result = runValidator([
    "--envelope",
    makeEnvelopeFile(
      validEnvelope({
        timestamp: "2026-06-29",
        idempotencyKey: "plain-key",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /malformed_timestamp/);
  assert.match(codes, /invalid_idempotency_key/);
});
