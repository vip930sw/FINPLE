const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-mock-approval-evidence-receipt.cjs");

function validReceipt(overrides = {}) {
  return {
    ownerConfirmationAt: "2026-06-29",
    kisPortalMockApplicationConfirmed: true,
    renderEnvMockTradingValuesConfirmed: true,
    baseUrlScope: "virtual_trading_openapivts",
    tradingMode: "shadow",
    killSwitchState: "enabled",
    accountIdHashPresenceOnly: true,
    appKeyPresenceOnly: true,
    appSecretPresenceOnly: true,
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    ...overrides,
  };
}

function makeReceiptFile(receipt) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-mock-approval-receipt-"));
  const filePath = path.join(dir, "mock-approval-evidence-receipt.redacted.json");
  fs.writeFileSync(filePath, `${JSON.stringify(receipt, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates mock approval evidence receipt without enabling runtime effects", () => {
  const result = runValidator(["--receipt", makeReceiptFile(validReceipt())]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit receipt path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /receipt_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing and unknown fields", () => {
  const receipt = validReceipt({ unexpected: "redacted_value" });
  delete receipt.publicUiAllowed;
  const result = runValidator(["--receipt", makeReceiptFile(receipt)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /unknown_field/);
});

test("rejects unconfirmed mock evidence and non-shadow scope", () => {
  const result = runValidator([
    "--receipt",
    makeReceiptFile(
      validReceipt({
        kisPortalMockApplicationConfirmed: false,
        renderEnvMockTradingValuesConfirmed: false,
        baseUrlScope: "prod_trading",
        tradingMode: "live_guarded",
        killSwitchState: "disabled",
      }),
    ),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /mock_application_not_confirmed/);
  assert.match(codes, /render_env_not_confirmed/);
  assert.match(codes, /invalid_base_url_scope/);
  assert.match(codes, /invalid_trading_mode/);
  assert.match(codes, /kill_switch_not_enabled/);
});

test("rejects missing presence-only confirmations and any enabled allow flag", () => {
  const result = runValidator([
    "--receipt",
    makeReceiptFile(
      validReceipt({
        accountIdHashPresenceOnly: false,
        appKeyPresenceOnly: false,
        appSecretPresenceOnly: false,
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
  assert.match(codes, /presence_only_not_confirmed/);
  assert.match(codes, /allow_flag_enabled/);
});

test("rejects malformed confirmation dates", () => {
  const result = runValidator(["--receipt", makeReceiptFile(validReceipt({ ownerConfirmationAt: "2026-06-29T00:00:00.000Z" }))]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /invalid_confirmation_date/);
});

test("rejects raw secrets, private paths, and redacts unsafe field names from output", () => {
  const result = runValidator([
    "--receipt",
    makeReceiptFile({
      ...validReceipt(),
      app_secret: "raw_session_token",
      redactionVersion: "data/private/trading/read-only-approval.redacted.json",
    }),
  ]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /unknown_field/);
  assert.match(codes, /secret_value_present/);
  assert.doesNotMatch(result.stdout, /raw_session_token|app_secret/);
  assert.doesNotMatch(result.stdout, /read-only-approval|data\/private/);
});
