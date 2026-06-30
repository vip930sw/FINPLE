const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-private-db-storage-implementation-preflight.cjs");
const CONTRACT = "trading_lab_step116_private_db_storage_implementation_preflight.json";
const STORE_SCHEMA_DRAFT = "trading_lab_step116_store_schema_draft.json";
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT = "trading_lab_step116_private_shadow_runtime_preflight.json";
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT =
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json";
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT = "trading_lab_step116_private_shadow_operator_access_contract.json";
const PRIVATE_SHADOW_ORDER_INTENT_CONTRACT = "trading_lab_step116_private_shadow_order_intent_contract.json";
const PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT =
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json";
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT =
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-private-db-storage-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [
    CONTRACT,
    STORE_SCHEMA_DRAFT,
    PRIVATE_SHADOW_RUNTIME_PREFLIGHT,
    PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT,
    PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT,
    PRIVATE_SHADOW_ORDER_INTENT_CONTRACT,
    PRIVATE_SHADOW_INTENT_AUDIT_EVENT_CONTRACT,
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT,
  ]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current private DB storage implementation preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_private_db_storage_implementation_preflight\.json/);
});

test("keeps DB storage, DDL, database connection, and migrations blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.currentState.preflightOnly, true);
  assert.equal(report.readiness.readyForFuturePrivateDbStorageImplementationReview, false);
  assert.equal(report.readiness.dbStorageImplementationAllowedNow, false);
  assert.equal(report.readiness.ddlGeneratedNow, false);
  assert.equal(report.readiness.databaseConnectionAllowedNow, false);
  assert.equal(report.readiness.dbMigrationAllowed, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.liveTradingAllowed, false);
});

test("records storage boundaries without raw provider, account, or secret values", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  const boundary = report.futurePrivateDbStorageImplementationBoundary;
  const serialized = JSON.stringify(report);

  assert.match(boundary.implementationRules.join("|"), /migration_review_required_later/);
  assert.match(boundary.implementationRules.join("|"), /no_database_connection_now/);
  assert.match(boundary.storageBoundaries.join("|"), /trading_order_intents/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /raw_provider_payload/);
  assert.match(boundary.forbiddenPreflightContent.join("|"), /scenario_monthly_return_row/);
  assert.doesNotMatch(serialized, /50195326|64408140/);
  assert.doesNotMatch(serialized, /KIS_TRADING_APP_SECRET|APP Secret|APP Key/);
});

test("rejects stale preflight if DB storage is manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.dbStorageImplementationAllowedNow = true;
  report.currentState.dbMigrationAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_private_db_storage_implementation_preflight\.json is out of date/);
});

test("blocks if store schema draft starts allowing migrations", () => {
  const workspace = makeWorkspace();
  const storeSchema = readJson(workspace, STORE_SCHEMA_DRAFT);
  storeSchema.migrationState.ddlGenerated = true;
  storeSchema.readiness.dbMigrationAllowed = true;
  writeJson(workspace, STORE_SCHEMA_DRAFT, storeSchema);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.storeSchemaDraftReady, false);
  assert.match(report.readiness.blockers.join("|"), /store_schema_draft_not_ready/);
});

test("blocks if private shadow runtime preflight starts allowing DB migration", () => {
  const workspace = makeWorkspace();
  const runtimePreflight = readJson(workspace, PRIVATE_SHADOW_RUNTIME_PREFLIGHT);
  runtimePreflight.readiness.dbMigrationAllowed = true;
  writeJson(workspace, PRIVATE_SHADOW_RUNTIME_PREFLIGHT, runtimePreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateShadowRuntimePreflightReady, false);
  assert.match(report.readiness.blockers.join("|"), /private_shadow_runtime_preflight_not_ready/);
});

test("blocks if private read-only provider implementation gate opens too early", () => {
  const workspace = makeWorkspace();
  const providerPreflight = readJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT);
  providerPreflight.readiness.ownerPacketGateStillClosed = false;
  providerPreflight.readiness.readyForFuturePrivateReadOnlyProviderImplementationReview = true;
  providerPreflight.readiness.providerCallsAllowed = true;
  writeJson(workspace, PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT, providerPreflight);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.privateReadOnlyProviderImplementationStillBlocked, false);
  assert.match(report.readiness.blockers.join("|"), /private_read_only_provider_implementation_not_blocked/);
});

test("blocks if DB storage runtime or migration artifacts appear too early", () => {
  const workspace = makeWorkspace();
  const storagePath = path.join(workspace, "server", "src", "services", "trading", "privateTradingStore.js");
  const migrationPath = path.join(workspace, "migrations", "trading", "001_create_trading.sql");
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  fs.mkdirSync(path.dirname(migrationPath), { recursive: true });
  fs.writeFileSync(storagePath, "module.exports = {};\n");
  fs.writeFileSync(migrationPath, "-- forbidden in this step\n");

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
