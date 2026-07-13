const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

const STEP232_SCRIPT = "check:trading-step232-offline-data-quality-gate-readiness";
const STEP232_DOC = "docs/trading-ai-ml/FINPLE_OFFLINE_DATA_QUALITY_GATE_OPERATIONAL_READINESS.md";
const STEP232_SERVICE = "server/src/services/tradingAiMlDatasetQualityGateReadiness.js";
const STEP232_TEST = "server/src/services/tradingAiMlDatasetQualityGateReadiness.test.js";
const STEP232_CHECKER = "scripts/check-trading-step232-offline-data-quality-gate-readiness.cjs";
const STEP232_CHECKER_TEST = "scripts/check-trading-step232-offline-data-quality-gate-readiness.test.cjs";
const STEP231_SERVICE = "server/src/services/tradingAiMlDatasetQualityGate.js";
const STEP231_CHECKER = "scripts/check-trading-step231-offline-data-quality-gate.cjs";
const STEP230_SERVICE = "server/src/services/tradingAiMlDatasetQualityBatchSummary.js";
const STEP229_SERVICE = "server/src/services/tradingAiMlDatasetQualityProfile.js";

const REQUIRED_FILES = [
  "package.json",
  STEP232_DOC,
  STEP232_SERVICE,
  STEP232_TEST,
  STEP232_CHECKER,
  STEP232_CHECKER_TEST,
  STEP231_SERVICE,
  STEP231_CHECKER,
  STEP230_SERVICE,
  STEP229_SERVICE,
  SNAPSHOT_PATH,
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP232_DOC,
  STEP232_SERVICE,
  STEP232_TEST,
  STEP232_CHECKER,
  STEP232_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  STEP231_SERVICE,
  STEP231_CHECKER,
  "server/src/services/tradingAiMlDatasetQualityGate.test.js",
  STEP230_SERVICE,
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.test.js",
  STEP229_SERVICE,
  "server/src/services/tradingAiMlDatasetQualityProfile.test.js",
  "scripts/check-trading-step230-offline-dataset-quality-batch-summary.cjs",
  "scripts/check-trading-step229-offline-dataset-quality-profile.cjs",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "scripts/snapshot-trading-step192-contract-hardening-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/report-trading-ai-ml-audit-summary.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
  "scripts/check-trading-step228-contract-hardening-handoff.cjs",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/index.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  ".github/workflows",
];

const FORBIDDEN_RUNTIME_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "createWriteStream",
  "spawn(",
  "exec(",
  "runPython(",
  "python.exe",
  "pandas",
  "numpy",
  "scikit-learn",
  "torch",
  "tensorflow",
  "xgboost",
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
  "providerClient",
  "blockingCiGate: true",
  "serverStartupGate: true",
  "runtimeServingGate: true",
  "modelTrainingGate: true",
  "providerGate: true",
  "orderGate: true",
  "liveTradingGate: true",
  "actualLiveTradingReady: true",
];

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "readinessMode",
  "sourceGateSchemaVersion",
  "policyVersion",
  "status",
  "checks",
  "missingRequirements",
  "allowedIntegrationTargets",
  "readiness",
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function assertNotIncludes(source, snippet, label) {
  assert(!source.includes(snippet), `${label} must not include: ${snippet}`);
}

function getStatus() {
  return execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .sort();
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  return [...new Set([...tracked, ...getStatus()])].map((file) => file.replace(/\\/g, "/")).sort();
}

function assertStep228SnapshotUnchanged() {
  const snapshot = JSON.parse(read(SNAPSHOT_PATH));
  assertStrict.deepEqual(Object.keys(snapshot), SNAPSHOT_TOP_LEVEL_KEYS);
  assert(snapshot.baselineCommit === BASELINE_COMMIT, "Step228 baselineCommit changed");
  assertStrict.deepEqual(snapshot.coveredSteps, [223, 224, 225, 226, 227]);
  assert(snapshot.coreAudit.expectedStageCount === 9, "Step228 core stage count changed");
  assert(snapshot.coreAudit.counts.sourceCheckerCount === 13, "Step228 source checker count changed");
  assert(snapshot.coreAudit.counts.uniqueTestFileCount === 35, "Step228 unique test file count changed");
  assert(snapshot.supplementalGuards.count === 1, "Step228 supplemental count changed");
  assert(snapshot.totals.totalSourceCheckerCount === 14, "Step228 total source checker count changed");
  assert(snapshot.totals.totalUniqueCheckerTestCount === 26, "Step228 checker test count changed");
  assert(snapshot.totals.totalUniqueTestFileCount === 37, "Step228 total test file count changed");
  assert(snapshot.duplicates.duplicateFileCount === 0, "Step228 duplicate file count changed");
  assert(snapshot.readiness.actualLiveTradingReady === false, "Step228 readiness changed");
  assert(snapshot.readiness.state === "blocked", "Step228 readiness state changed");
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const doc = read(STEP232_DOC);
  const service = read(STEP232_SERVICE);
  const serviceTest = read(STEP232_TEST);

  assertIncludes(packageJson, `"${STEP232_SCRIPT}"`, "package Step232 script");
  assertIncludes(packageJson, STEP232_CHECKER, "package Step232 checker link");
  assertIncludes(packageJson, STEP232_CHECKER_TEST, "package Step232 checker test link");
  assertIncludes(packageJson, STEP232_TEST, "package Step232 service test link");
  assertIncludes(packageJson, `"check:trading-step231-offline-data-quality-gate"`, "package Step231 standalone checker");

  for (const snippet of [
    "Purpose And Non-Goals",
    "Step229 Through Step231 Relationship",
    "Operating Roles",
    "Review Evidence",
    "Approval TTL And Reapproval Triggers",
    "Blocked Override Prohibition",
    "Audit Record Minimum Schema",
    "Standalone Dry-Run Readiness",
    "Non-Blocking CI Evaluation Readiness",
    "Blocking CI Requires A Later Approval",
    "Separation From Model Runtime And Live Trading",
  ]) {
    assertIncludes(doc, snippet, "Step232 readiness document");
  }

  for (const snippet of [
    "buildStep231OfflineDataQualityGateDecision",
    "buildStep232OfflineDataQualityGateReadiness",
    "ready_for_standalone_dry_run",
    "ready_for_non_blocking_ci_evaluation",
    "not_ready",
    "OWNER_ROLE_MISSING",
    "REVIEWER_CHECKLIST_MISSING",
    "standaloneDryRun",
    "nonBlockingCiReport",
    "blockingCiGate: false",
    "modelTrainingGate: false",
    "providerGate: false",
    "orderGate: false",
    "liveTradingGate: false",
    "actualLiveTradingReady: false",
    "state: \"blocked\"",
  ]) {
    assertIncludes(service, snippet, "Step232 service source");
  }

  for (const forbidden of FORBIDDEN_RUNTIME_CODE) {
    assertNotIncludes(service, forbidden, "Step232 service runtime code");
  }

  for (const snippet of [
    "missing owner role is not ready",
    "missing reviewer role is not ready",
    "enabled blocked override is not ready",
    "missing rollback and incident procedures are not ready",
    "minimum conditions allow standalone dry run only",
    "full evidence allows non-blocking CI evaluation only",
    "one missing evidence item prevents non-blocking CI readiness",
    "missing requirements are unique and canonical",
    "does not mutate operating model evidence or Step231 gate decision",
    "keeps forbidden integration targets false and live readiness blocked",
  ]) {
    assertIncludes(serviceTest, snippet, "Step232 test source");
  }

  const moduleUrl = pathToFileURL(`${process.cwd()}/${STEP232_SERVICE}`).href;
  const step232 = await import(`${moduleUrl}?check=${Date.now()}`);
  const readiness = step232.buildStep232OfflineDataQualityGateReadiness({
    gateDecision: (await import(`${pathToFileURL(`${process.cwd()}/${STEP231_SERVICE}`).href}?check=${Date.now()}`)).buildStep231OfflineDataQualityGateDecision(),
    operatingModel: {
      ownerRole: "data_quality_owner",
      reviewerRoles: ["data_quality_reviewer", "ml_validation_reviewer"],
      evidencePolicyVersion: "1.0.0",
      approvalTtlHours: 168,
      blockedOverrideAllowed: false,
      immutableAuditRecordRequired: true,
      rollbackProcedureDefined: true,
      incidentProcedureDefined: true,
    },
    evidenceAvailability: {
      batchSummaryAvailable: true,
      gateDecisionAvailable: true,
      reasonCodeReviewAvailable: true,
      reviewerChecklistAvailable: true,
      approvalRecordTemplateAvailable: true,
      rollbackChecklistAvailable: true,
      incidentResponseChecklistAvailable: true,
    },
  });

  assertStrict.deepEqual(Object.keys(readiness), EXPECTED_TOP_LEVEL_KEYS);
  assert(readiness.schemaVersion === "1.0.0", "schema version mismatch");
  assert(readiness.readinessMode === "offline_data_quality_gate_operational", "readiness mode mismatch");
  assert(readiness.sourceGateSchemaVersion === "1.0.0", "source gate schema mismatch");
  assert(readiness.policyVersion === "1.0.0", "policy version mismatch");
  assert(readiness.status === "ready_for_non_blocking_ci_evaluation", "full readiness status mismatch");
  assert(readiness.allowedIntegrationTargets.standaloneDryRun === true, "standalone target not ready");
  assert(readiness.allowedIntegrationTargets.nonBlockingCiReport === true, "non-blocking CI target not ready");
  assert(readiness.allowedIntegrationTargets.blockingCiGate === false, "blocking CI target opened");
  assert(readiness.allowedIntegrationTargets.serverStartupGate === false, "server startup target opened");
  assert(readiness.allowedIntegrationTargets.runtimeServingGate === false, "runtime serving target opened");
  assert(readiness.allowedIntegrationTargets.modelTrainingGate === false, "model training target opened");
  assert(readiness.allowedIntegrationTargets.providerGate === false, "provider target opened");
  assert(readiness.allowedIntegrationTargets.orderGate === false, "order target opened");
  assert(readiness.allowedIntegrationTargets.liveTradingGate === false, "live trading target opened");
  assert(readiness.readiness.actualLiveTradingReady === false, "actual live trading readiness opened");
  assert(readiness.readiness.state === "blocked", "readiness state changed");
  assertStrict.deepEqual(readiness.missingRequirements, []);

  const serialized = JSON.stringify(readiness);
  for (const forbidden of [
    "secret token value",
    "provider payload",
    "account information",
    "order information",
    "raw record ID",
    "hash digest fingerprint",
    "personal email",
    "credential material",
  ]) {
    assert(!serialized.includes(forbidden), `readiness output leaks forbidden material: ${forbidden}`);
  }

  assertStep228SnapshotUnchanged();

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step232 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step232 touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step232 check modified the working tree");

  console.log("[check-trading-step232-offline-data-quality-gate-readiness] ok");
  console.log(JSON.stringify({
    schemaVersion: readiness.schemaVersion,
    readinessMode: readiness.readinessMode,
    sourceGateSchemaVersion: readiness.sourceGateSchemaVersion,
    policyVersion: readiness.policyVersion,
    status: readiness.status,
    allowedIntegrationTargets: readiness.allowedIntegrationTargets,
    readiness: readiness.readiness,
    step228BaselineCommit: BASELINE_COMMIT,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
