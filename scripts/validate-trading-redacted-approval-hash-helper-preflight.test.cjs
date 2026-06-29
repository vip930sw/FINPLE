const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-redacted-approval-hash-helper-preflight.cjs");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step116_redacted_approval_hash_helper_preflight.json");

function currentPreflight(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(PREFLIGHT_PATH, "utf8")),
    ...overrides,
  };
}

function makePreflightFile(preflight) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-hash-helper-preflight-"));
  const filePath = path.join(dir, "redacted-approval-hash-helper-preflight.json");
  fs.writeFileSync(filePath, `${JSON.stringify(preflight, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates the current redacted approval hash helper preflight", () => {
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

test("rejects missing top-level fields and preflight checks", () => {
  const preflight = currentPreflight();
  delete preflight.outputFiles;
  preflight.futureOwnerAssistedHashPreparationBoundary.preflightChecks =
    preflight.futureOwnerAssistedHashPreparationBoundary.preflightChecks.filter(
      (check) => check !== "raw_inputs_not_requested_now",
    );

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_preflight_check/);
});

test("rejects raw input, pepper, helper, hash, or packet actions enabled now", () => {
  const preflight = currentPreflight();
  preflight.futureOwnerAssistedHashPreparationBoundary.currentStepRequestsRawInputs = true;
  preflight.futureOwnerAssistedHashPreparationBoundary.currentStepRequestsPrivatePepper = true;
  preflight.futureOwnerAssistedHashPreparationBoundary.currentStepImplementsHashHelper = true;
  preflight.futureOwnerAssistedHashPreparationBoundary.currentStepGeneratesHashes = true;
  preflight.futureOwnerAssistedHashPreparationBoundary.currentStepCreatesApprovalPacket = true;

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /boundary_action_enabled/);
});

test("rejects incomplete future review inputs and forbidden content lists", () => {
  const preflight = currentPreflight();
  preflight.futureOwnerAssistedHashPreparationBoundary.futureReviewInputs = ["explicit_owner_request_to_prepare_hashes"];
  preflight.futureOwnerAssistedHashPreparationBoundary.forbiddenPreflightContent = ["app_key"];

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_future_review_input/);
  assert.match(codes, /missing_forbidden_preflight_content/);
});

test("rejects changed future helper or approval packet paths", () => {
  const preflight = currentPreflight();
  preflight.futureOwnerAssistedHashPreparationBoundary.futureHashHelperPath = "scripts/hash-live-order-secret.cjs";
  preflight.futureOwnerAssistedHashPreparationBoundary.futureApprovalPacketPath = "data/private/trading/live_order_permission.json";

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_future_hash_helper_path/);
  assert.match(codes, /invalid_future_approval_packet_path/);
});

test("rejects hash preparation readiness or trading allow flags flipped on", () => {
  const preflight = currentPreflight();
  preflight.currentState.ownerHashPreparationDeferred = false;
  preflight.currentState.hashGenerationAllowed = true;
  preflight.currentState.providerCallsAllowed = true;
  preflight.readiness.orderSubmissionAllowed = true;
  preflight.checks.runtimeRouteAllowed = true;

  const result = runValidator(["--preflight", makePreflightFile(preflight)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /owner_hash_preparation_not_deferred/);
  assert.match(codes, /allow_flag_enabled/);
});
