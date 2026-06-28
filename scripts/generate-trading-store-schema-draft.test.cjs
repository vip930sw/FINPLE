const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-store-schema-draft.cjs");
const SCHEMA = "trading_lab_step116_store_schema_draft.json";
const POLICY = "trading_lab_step1160_policy.json";
const PREFLIGHT = "trading_lab_step1160_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-store-schema-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [SCHEMA, POLICY, PREFLIGHT]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runSchemaDraft(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = SCHEMA) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current trading store schema draft", () => {
  const workspace = makeWorkspace();
  const result = runSchemaDraft(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_store_schema_draft\.json/);
});

test("keeps schema draft disconnected from migrations, provider calls, and order submission", () => {
  const workspace = makeWorkspace();
  const result = runSchemaDraft(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.migrationState.draftOnly, true);
  assert.equal(report.migrationState.ddlGenerated, false);
  assert.equal(report.readiness.readyForFutureMigrationReview, true);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("includes required trading store tables and risk event audit table", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const tableNames = report.tables.map((table) => table.name);

  assert.deepEqual(tableNames, [
    "trading_modes",
    "trading_strategy_versions",
    "trading_decisions",
    "trading_order_intents",
    "trading_order_attempts",
    "trading_executions",
    "trading_positions",
    "trading_risk_events",
  ]);
  assert.equal(report.tables.find((table) => table.name === "trading_risk_events").writePolicy.publicFrontendWriteAllowed, false);
});

test("rejects stale schema draft when a required table is missing", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.tables = report.tables.filter((table) => table.name !== "trading_risk_events");
  writeJson(workspace, SCHEMA, report);

  const result = runSchemaDraft(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_store_schema_draft\.json is out of date/);
});

test("blocks future migration review if policy drifts to allow DB migration", () => {
  const workspace = makeWorkspace();
  const policy = readJson(workspace, POLICY);
  policy.defaults.dbMigrationAllowed = true;
  writeJson(workspace, POLICY, policy);

  const result = runSchemaDraft(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.policyStillDisablesDbMigration, false);
  assert.equal(report.readiness.readyForFutureMigrationReview, false);
  assert.match(report.readiness.blockers.join("|"), /policy_allows_db_migration/);
});

test("blocks future migration review if migration artifacts appear", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "migrations", "trading"), { recursive: true });

  const result = runSchemaDraft(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noMigrationArtifacts, false);
  assert.equal(report.readiness.readyForFutureMigrationReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_migration_artifact/);
});
