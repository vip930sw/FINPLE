const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-redacted-approval-packet-validation-preflight.cjs");
const PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);

function currentPreflight(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(PREFLIGHT_PATH, "utf8")),
    ...overrides,
  };
}

function makePreflightFile(preflight) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-packet-validation-preflight-"));
  const filePath = path.join(dir, "redacted-approval-packet-validation-preflight.json");
  fs.writeFileSync(filePath, `${JSON.stringify(preflight, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates the current redacted approval packet validation preflight", () => {
  const result = runValidator(["--preflight", PREFLIGHT_PATH]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit preflight path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /preflight_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing top-level fields and preflight gates", () => {
  const preflight = currentPreflight();
  delete preflight.outputFiles;
  preflight.futurePureLocalValidatorImplementationBoundary.preflightGates =
    preflight.futurePureLocalValidatorImplementationBoundary.preflightGates.filter(
      (gate) => gate !== "validator_has_no_provider_dependency",
    );

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_preflight_gate/);
});

test("rejects changed future validator and packet paths", () => {
  const preflight = currentPreflight();
  preflight.futurePureLocalValidatorImplementationBoundary.futureValidatorPath = "scripts/validate-live-order-packet.cjs";
  preflight.futurePureLocalValidatorImplementationBoundary.futureApprovalPacketPath =
    "data/private/trading/live_order_permission.json";

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_validator_path/);
  assert.match(codes, /invalid_future_approval_packet_path/);
});

test("rejects disabling the pure local validator implementation allowance", () => {
  const preflight = currentPreflight();
  preflight.futurePureLocalValidatorImplementationBoundary.currentStepImplementsValidator = false;
  preflight.currentState.validationImplementationAllowedNow = false;
  preflight.readiness.validationImplementationReviewAllowedLater = false;

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /validator_implementation_not_allowed/);
  assert.match(codes, /validation_allow_flag_disabled/);
});

test("rejects private packet reads, writes, or imports now", () => {
  const preflight = currentPreflight();
  preflight.futurePureLocalValidatorImplementationBoundary.currentStepReadsPrivatePacket = true;
  preflight.futurePureLocalValidatorImplementationBoundary.currentStepCreatesPacket = true;
  preflight.futurePureLocalValidatorImplementationBoundary.currentStepImportsPacket = true;

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /boundary_action_enabled/);
});

test("rejects incomplete implementation rules and forbidden content lists", () => {
  const preflight = currentPreflight();
  preflight.futurePureLocalValidatorImplementationBoundary.implementationReviewRules = ["pure_node_script_only"];
  preflight.futurePureLocalValidatorImplementationBoundary.forbiddenPreflightContent = ["app_key"];

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_implementation_review_rule/);
  assert.match(codes, /missing_forbidden_preflight_content/);
});

test("rejects provider, order, runtime route, public UI, or live trading allow flags", () => {
  const preflight = currentPreflight();
  preflight.currentState.providerCallsAllowed = true;
  preflight.currentState.orderSubmissionAllowed = true;
  preflight.readiness.runtimeRouteAllowed = true;
  preflight.readiness.publicUiAllowed = true;
  preflight.checks.liveTradingAllowed = true;

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /allow_flag_enabled/);
});
