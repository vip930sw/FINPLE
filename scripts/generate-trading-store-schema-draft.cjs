const fs = require("node:fs");
const path = require("node:path");

const SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_store_schema_draft.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const SCHEMA_VERSION = "trading-lab-step116-store-schema-draft-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const FORBIDDEN_MIGRATION_ARTIFACTS = [
  path.join("migrations", "trading"),
  path.join("migrations", "step116_trading_store.sql"),
  path.join("server", "src", "db", "tradingStore.js"),
  path.join("server", "src", "db", "tradingStoreMigration.js"),
];

const TABLES = [
  {
    name: "trading_modes",
    dataClass: "execution_data",
    purpose: "mode transition history and default blocked-state audit",
    fields: [
      ["id", "uuid", true],
      ["mode", "text", true],
      ["reason", "text", true],
      ["changedBy", "text", true],
      ["changedAt", "timestamp", true],
    ],
  },
  {
    name: "trading_strategy_versions",
    dataClass: "execution_data",
    purpose: "reviewed strategy version registry",
    fields: [
      ["id", "uuid", true],
      ["strategyName", "text", true],
      ["version", "text", true],
      ["status", "text", true],
      ["approvedBy", "text", false],
      ["approvedAt", "timestamp", false],
      ["configHash", "text", true],
    ],
  },
  {
    name: "trading_decisions",
    dataClass: "execution_data",
    purpose: "strategy decisions before any order-intent promotion",
    fields: [
      ["id", "uuid", true],
      ["mode", "text", true],
      ["strategyVersionId", "uuid", true],
      ["symbol", "text", true],
      ["market", "text", true],
      ["decision", "text", true],
      ["confidence", "decimal", false],
      ["inputsHash", "text", true],
      ["createdAt", "timestamp", true],
    ],
  },
  {
    name: "trading_order_intents",
    dataClass: "execution_data",
    purpose: "risk-gated intended orders before any provider submission",
    fields: [
      ["id", "uuid", true],
      ["decisionId", "uuid", true],
      ["symbol", "text", true],
      ["side", "text", true],
      ["quantity", "decimal", true],
      ["estimatedPrice", "decimal", true],
      ["estimatedFxRate", "decimal", true],
      ["notional", "decimal", true],
      ["riskStatus", "text", true],
      ["blockedReason", "text", false],
      ["createdAt", "timestamp", true],
    ],
  },
  {
    name: "trading_order_attempts",
    dataClass: "execution_data",
    purpose: "future order-provider attempt audit; unavailable in current step",
    fields: [
      ["id", "uuid", true],
      ["intentId", "uuid", true],
      ["provider", "text", true],
      ["requestHash", "text", true],
      ["responseHash", "text", false],
      ["providerOrderId", "text", false],
      ["status", "text", true],
      ["attemptedAt", "timestamp", true],
    ],
  },
  {
    name: "trading_executions",
    dataClass: "execution_data",
    purpose: "future fill reconciliation audit; unavailable in current step",
    fields: [
      ["id", "uuid", true],
      ["attemptId", "uuid", true],
      ["providerOrderId", "text", false],
      ["fillPrice", "decimal", true],
      ["fillQuantity", "decimal", true],
      ["fees", "decimal", true],
      ["taxes", "decimal", true],
      ["fxRate", "decimal", true],
      ["filledAt", "timestamp", true],
    ],
  },
  {
    name: "trading_positions",
    dataClass: "execution_data",
    purpose: "paper/shadow/live position snapshots after reconciliation",
    fields: [
      ["id", "uuid", true],
      ["symbol", "text", true],
      ["quantity", "decimal", true],
      ["averageCost", "decimal", true],
      ["marketValue", "decimal", false],
      ["source", "text", true],
      ["reconciledAt", "timestamp", true],
    ],
  },
  {
    name: "trading_risk_events",
    dataClass: "execution_data",
    purpose: "blocked or informational risk gate events",
    fields: [
      ["id", "uuid", true],
      ["severity", "text", true],
      ["eventType", "text", true],
      ["reason", "text", true],
      ["relatedIntentId", "uuid", false],
      ["createdAt", "timestamp", true],
    ],
  },
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function tableWithObjects(table) {
  return {
    ...table,
    fields: table.fields.map(([name, type, required]) => ({ name, type, required })),
    writePolicy: {
      currentStep: "draft_only",
      futureOwner: "private_trading_worker",
      publicFrontendWriteAllowed: false,
      webBackendWriteAllowed: false,
    },
  };
}

function missingTables(tables) {
  const tableNames = new Set(tables.map((table) => table.name));
  return TABLES.map((table) => table.name).filter((tableName) => !tableNames.has(tableName));
}

function missingFields(tables) {
  const tableMap = new Map(tables.map((table) => [table.name, table]));
  return TABLES.flatMap((expectedTable) => {
    const actual = tableMap.get(expectedTable.name);
    if (!actual) return expectedTable.fields.map(([field]) => `${expectedTable.name}.${field}`);
    const fieldNames = new Set((actual.fields ?? []).map((field) => field.name));
    return expectedTable.fields
      .map(([field]) => field)
      .filter((field) => !fieldNames.has(field))
      .map((field) => `${expectedTable.name}.${field}`);
  });
}

function forbiddenMigrationArtifacts() {
  return FORBIDDEN_MIGRATION_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildSchemaDraft() {
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const tables = TABLES.map(tableWithObjects);
  const missingRequiredTables = missingTables(tables);
  const missingRequiredFields = missingFields(tables);
  const forbiddenArtifacts = forbiddenMigrationArtifacts();
  const checks = {
    draftOnly: true,
    requiredTablesReady: missingRequiredTables.length === 0,
    requiredFieldsReady: missingRequiredFields.length === 0,
    policyStillDisablesDbMigration: policy.defaults?.dbMigrationAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    noMigrationArtifacts: forbiddenArtifacts.length === 0,
    architectureDocStillDraftOnly:
      architectureDoc.includes("This is a logical schema draft, not a migration.") &&
      architectureDoc.includes("no database migration"),
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
  };
  const readyForFutureMigrationReview =
    checks.requiredTablesReady &&
    checks.requiredFieldsReady &&
    checks.policyStillDisablesDbMigration &&
    checks.preflightStillDisablesDbMigration &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.noMigrationArtifacts &&
    checks.architectureDocStillDraftOnly;

  return stableJson({
    schemaVersion: SCHEMA_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1D",
    scope: "trading_store_schema_draft_only",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      schemaDraft: SCHEMA_PATH,
    },
    migrationState: {
      draftOnly: true,
      ddlGenerated: false,
      dbMigrationAllowed: false,
      tableCreationAllowed: false,
      productionDbTouched: false,
    },
    tables,
    constraintsDraft: [
      "mode must be one of paper, shadow, live_guarded, live_blocked",
      "order attempts and executions are future-only and unavailable before manual approval",
      "requestHash and responseHash store hashes only, not raw provider secrets or tokens",
      "risk events must be recorded before any future provider submission",
      "public frontend cannot write trading store rows",
    ],
    checks,
    evidence: {
      requiredTables: TABLES.map((table) => table.name),
      missingRequiredTables,
      missingRequiredFields,
      forbiddenMigrationArtifacts: forbiddenArtifacts,
      scenarioRuntimeStillIndependent: preflight.checks?.scenarioGatesStillBlocked === true,
    },
    readiness: {
      status: readyForFutureMigrationReview
        ? "draft_ready_for_future_manual_migration_review"
        : "blocked_before_future_migration_review",
      readyForFutureMigrationReview,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      publicUiAllowed: false,
      blockers: [
        ...(checks.requiredTablesReady ? [] : missingRequiredTables.map((table) => `missing_table_${table}`)),
        ...(checks.requiredFieldsReady ? [] : missingRequiredFields.map((field) => `missing_field_${field}`)),
        ...(checks.policyStillDisablesDbMigration ? [] : ["policy_allows_db_migration"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_migration_artifact_${filePath}`),
        ...(checks.architectureDocStillDraftOnly ? [] : ["architecture_doc_missing_draft_only_boundary"]),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const schemaDraft = buildSchemaDraft();

  if (checkOnly) {
    if (!fs.existsSync(SCHEMA_PATH)) {
      fail(`${SCHEMA_PATH} not found; run node scripts/generate-trading-store-schema-draft.cjs`);
    }
    const current = fs.readFileSync(SCHEMA_PATH, "utf8");
    if (current !== schemaDraft) {
      fail(`${SCHEMA_PATH} is out of date; run node scripts/generate-trading-store-schema-draft.cjs`);
    }
    console.log("[generate-trading-store-schema-draft] ok");
    console.log(`[generate-trading-store-schema-draft] schemaDraft=${SCHEMA_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(SCHEMA_PATH), { recursive: true });
  fs.writeFileSync(SCHEMA_PATH, schemaDraft);
  const parsed = JSON.parse(schemaDraft);
  console.log("[generate-trading-store-schema-draft] wrote schema draft");
  console.log(`[generate-trading-store-schema-draft] readyForFutureMigrationReview=${parsed.readiness.readyForFutureMigrationReview}`);
}

main();
