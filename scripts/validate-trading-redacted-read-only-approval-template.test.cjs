const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "validate-trading-redacted-read-only-approval-template.cjs");
const TEMPLATE_PATH = path.join("data", "processed", "trading_lab_step116_redacted_read_only_approval_template.json");

function currentTemplate(overrides = {}) {
  return {
    ...JSON.parse(fs.readFileSync(TEMPLATE_PATH, "utf8")),
    ...overrides,
  };
}

function makeTemplateFile(template) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-redacted-read-only-template-"));
  const filePath = path.join(dir, "redacted-read-only-approval-template.json");
  fs.writeFileSync(filePath, `${JSON.stringify(template, null, 2)}\n`);
  return filePath;
}

function runValidator(args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    encoding: "utf8",
  });
}

test("validates the current redacted read-only approval template contract", () => {
  const result = runValidator(["--template", TEMPLATE_PATH]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).valid, true);
});

test("requires an explicit template path and does not use private defaults", () => {
  const result = runValidator([]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /template_path_required/);
  assert.doesNotMatch(result.stderr, /data\\private|data\/private/);
});

test("rejects missing top-level and template fields", () => {
  const template = currentTemplate();
  delete template.outputFiles;
  template.futureRedactedApprovalPacketTemplate.requiredTemplateFields =
    template.futureRedactedApprovalPacketTemplate.requiredTemplateFields.filter((field) => field !== "accountIdHash");

  const result = runValidator(["--template", makeTemplateFile(template)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_required_field/);
  assert.match(codes, /missing_template_field/);
});

test("rejects packet creation or trading allow flags", () => {
  const template = currentTemplate();
  template.futureRedactedApprovalPacketTemplate.currentStepCreatesPacket = true;
  template.currentState.approvalPacketCreatedNow = true;
  template.currentState.providerCallsAllowed = true;
  template.readiness.orderSubmissionAllowed = true;
  template.checks.runtimeRouteAllowed = true;

  const result = runValidator(["--template", makeTemplateFile(template)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /packet_creation_enabled/);
  assert.match(codes, /allow_flag_enabled/);
});

test("rejects incomplete read scopes, forbidden actions, assertions, and forbidden content list", () => {
  const template = currentTemplate();
  template.futureRedactedApprovalPacketTemplate.allowedReadScopes = ["account_cash_balance"];
  template.futureRedactedApprovalPacketTemplate.forbiddenActions = ["order_submission"];
  template.futureRedactedApprovalPacketTemplate.requiredTemplateAssertions = ["template_is_redacted_only"];
  template.futureRedactedApprovalPacketTemplate.forbiddenTemplateContent = ["access_token"];

  const result = runValidator(["--template", makeTemplateFile(template)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /missing_allowed_read_scope/);
  assert.match(codes, /missing_forbidden_action/);
  assert.match(codes, /missing_template_assertion/);
  assert.match(codes, /missing_forbidden_template_content/);
});

test("rejects unsafe sample shape values", () => {
  const template = currentTemplate();
  template.futureRedactedApprovalPacketTemplate.sampleRedactedShape.accountIdHash = "50195326";
  template.futureRedactedApprovalPacketTemplate.sampleRedactedShape.providerCallsAllowed = true;
  template.futureRedactedApprovalPacketTemplate.sampleRedactedShape.baseUrlScope = "prod_trading";

  const result = runValidator(["--template", makeTemplateFile(template)]);
  const parsed = JSON.parse(result.stdout);
  const codes = parsed.errors.map((error) => error.code).join("|");

  assert.equal(result.status, 1);
  assert.match(codes, /invalid_sample_hash_placeholder/);
  assert.match(codes, /sample_allow_flag_enabled/);
  assert.match(codes, /invalid_sample_base_url_scope/);
  assert.match(codes, /sample_forbidden_value/);
});

test("rejects a changed future private packet path", () => {
  const template = currentTemplate();
  template.futureRedactedApprovalPacketTemplate.futureApprovalPacketPath = "data/private/trading/live_order_permission.json";

  const result = runValidator(["--template", makeTemplateFile(template)]);
  const parsed = JSON.parse(result.stdout);

  assert.equal(result.status, 1);
  assert.match(parsed.errors.map((error) => error.code).join("|"), /invalid_future_packet_path/);
});
