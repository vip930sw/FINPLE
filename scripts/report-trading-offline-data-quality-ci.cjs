const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const REPORT_SCHEMA_VERSION = "1.0.0";
const REPORT_MODE = "non_blocking_ci";
const DEFAULT_OUTPUT_DIR = path.join("artifacts", "finple-offline-data-quality-report");
const JSON_REPORT_FILE = "offline-data-quality-report.json";
const TEXT_REPORT_FILE = "offline-data-quality-report.txt";
const ARTIFACT_NAME = "finple-offline-data-quality-report";
const ARTIFACT_RETENTION_DAYS = 14;
const REQUIRED_READINESS_STATUS = "ready_for_non_blocking_ci_evaluation";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "reportMode",
  "readinessStatus",
  "executionStatus",
  "executionErrorCode",
  "qualityStatus",
  "gateDecision",
  "fixtureCounts",
  "reasonCodes",
  "integrationEffect",
  "readiness",
]);

const INTEGRATION_EFFECT_KEYS = Object.freeze([
  "blocksMerge",
  "blocksDeployment",
  "startsModelTraining",
  "enablesProviderAccess",
  "enablesOrderSubmission",
  "enablesLiveTrading",
]);

const FIXTURE_COUNT_KEYS = Object.freeze(["total", "pass", "reviewRequired", "blocked"]);
const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

const EXECUTION_STATUSES = Object.freeze([
  "completed",
  "skipped_by_readiness_policy",
  "execution_error",
]);

const ALLOWED_EXECUTION_ERROR_CODES = Object.freeze([
  "REPORT_GENERATION_FAILED",
  "READINESS_EVALUATION_FAILED",
  "QUALITY_CHECK_EXECUTION_FAILED",
]);

const DEFAULT_OPERATING_MODEL = Object.freeze({
  ownerRole: "data_quality_owner",
  reviewerRoles: Object.freeze(["data_quality_reviewer", "ml_validation_reviewer"]),
  evidencePolicyVersion: "1.0.0",
  approvalTtlHours: 168,
  blockedOverrideAllowed: false,
  immutableAuditRecordRequired: true,
  rollbackProcedureDefined: true,
  incidentProcedureDefined: true,
});

const DEFAULT_EVIDENCE_AVAILABILITY = Object.freeze({
  batchSummaryAvailable: true,
  gateDecisionAvailable: true,
  reasonCodeReviewAvailable: true,
  reviewerChecklistAvailable: true,
  approvalRecordTemplateAvailable: true,
  rollbackChecklistAvailable: true,
  incidentResponseChecklistAvailable: true,
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

async function importService(servicePath) {
  const absolutePath = path.resolve(servicePath);
  return import(`${pathToFileURL(absolutePath).href}?step233=${Date.now()}-${Math.random()}`);
}

async function loadBuilders() {
  const [step230, step231, step232] = await Promise.all([
    importService("server/src/services/tradingAiMlDatasetQualityBatchSummary.js"),
    importService("server/src/services/tradingAiMlDatasetQualityGate.js"),
    importService("server/src/services/tradingAiMlDatasetQualityGateReadiness.js"),
  ]);
  return { step230, step231, step232 };
}

function buildIntegrationEffect() {
  return {
    blocksMerge: false,
    blocksDeployment: false,
    startsModelTraining: false,
    enablesProviderAccess: false,
    enablesOrderSubmission: false,
    enablesLiveTrading: false,
  };
}

function canonicalReasonCodes(reasonCodes, reasonCodeOrder) {
  const order = new Map(reasonCodeOrder.map((code, index) => [code, index]));
  return [...new Set(reasonCodes || [])].sort((left, right) => {
    const leftIndex = order.has(left) ? order.get(left) : Number.MAX_SAFE_INTEGER;
    const rightIndex = order.has(right) ? order.get(right) : Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return left.localeCompare(right);
  });
}

function sanitizeExecutionErrorCode(code) {
  if (code === undefined || code === null || code === "") return null;
  return ALLOWED_EXECUTION_ERROR_CODES.includes(code) ? code : "REPORT_GENERATION_FAILED";
}

function buildExecutionStatus(readinessStatus, executionErrorCode) {
  if (executionErrorCode) return "execution_error";
  if (readinessStatus !== REQUIRED_READINESS_STATUS) return "skipped_by_readiness_policy";
  return "completed";
}

function assertReportShape(report) {
  if (JSON.stringify(Object.keys(report || {})) !== JSON.stringify([...TOP_LEVEL_KEYS])) {
    throw new Error("Step233 report top-level key set mismatch");
  }
  if (JSON.stringify(Object.keys(report.integrationEffect || {})) !== JSON.stringify([...INTEGRATION_EFFECT_KEYS])) {
    throw new Error("Step233 report integrationEffect key set mismatch");
  }
  if (JSON.stringify(Object.keys(report.fixtureCounts || {})) !== JSON.stringify([...FIXTURE_COUNT_KEYS])) {
    throw new Error("Step233 report fixtureCounts key set mismatch");
  }
  if (JSON.stringify(Object.keys(report.readiness || {})) !== JSON.stringify([...READINESS_KEYS])) {
    throw new Error("Step233 report readiness key set mismatch");
  }
  if (!EXECUTION_STATUSES.includes(report.executionStatus)) {
    throw new Error("Step233 report executionStatus mismatch");
  }
  if (report.integrationEffect.blocksMerge !== false || report.integrationEffect.blocksDeployment !== false) {
    throw new Error("Step233 report must not block merge or deployment");
  }
  if (
    report.integrationEffect.startsModelTraining !== false ||
    report.integrationEffect.enablesProviderAccess !== false ||
    report.integrationEffect.enablesOrderSubmission !== false ||
    report.integrationEffect.enablesLiveTrading !== false
  ) {
    throw new Error("Step233 report must not enable model provider order or live trading");
  }
  if (report.readiness.actualLiveTradingReady !== false || report.readiness.state !== "blocked") {
    throw new Error("Step233 report live trading readiness must stay blocked");
  }
}

async function buildCurrentOfflineDataQualityCiReport(options = {}) {
  const builders = options.builders || await loadBuilders();
  const batchSummary = clonePlain(options.batchSummary ?? builders.step230.buildStep230OfflineDatasetQualityBatchSummary());
  const gateDecision = clonePlain(options.gateDecision ?? builders.step231.buildStep231OfflineDataQualityGateDecision({ batchSummary }));
  const readiness = clonePlain(options.readiness ?? builders.step232.buildStep232OfflineDataQualityGateReadiness({
    gateDecision,
    operatingModel: options.operatingModel ?? DEFAULT_OPERATING_MODEL,
    evidenceAvailability: options.evidenceAvailability ?? DEFAULT_EVIDENCE_AVAILABILITY,
  }));
  const executionErrorCode = sanitizeExecutionErrorCode(options.executionErrorCode);
  const report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    reportMode: REPORT_MODE,
    readinessStatus: readiness.status,
    executionStatus: buildExecutionStatus(readiness.status, executionErrorCode),
    executionErrorCode,
    qualityStatus: gateDecision.observedStatus,
    gateDecision: gateDecision.decision,
    fixtureCounts: {
      total: batchSummary.fixtureCounts.total,
      pass: batchSummary.fixtureCounts.pass,
      reviewRequired: batchSummary.fixtureCounts.reviewRequired,
      blocked: batchSummary.fixtureCounts.blocked,
    },
    reasonCodes: canonicalReasonCodes(gateDecision.reasonCodes, builders.step231.STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.reasonCodeOrder),
    integrationEffect: buildIntegrationEffect(),
    readiness: {
      actualLiveTradingReady: false,
      state: "blocked",
    },
  };
  assertReportShape(report);
  return deepFreeze(report);
}

function formatOfflineDataQualityCiReport(report) {
  const executionLine = report.executionErrorCode
    ? `${report.executionStatus} (${report.executionErrorCode})`
    : report.executionStatus;
  return [
    "FINPLE Offline Data-Quality Report",
    "",
    `Readiness: ${report.readinessStatus}`,
    `Execution: ${executionLine}`,
    `Quality status: ${report.qualityStatus}`,
    `Gate decision: ${report.gateDecision}`,
    `Fixtures: ${report.fixtureCounts.total}`,
    `Pass / Review / Blocked: ${report.fixtureCounts.pass} / ${report.fixtureCounts.reviewRequired} / ${report.fixtureCounts.blocked}`,
    `Merge blocking: ${report.integrationEffect.blocksMerge ? "Yes" : "No"}`,
    `Deployment blocking: ${report.integrationEffect.blocksDeployment ? "Yes" : "No"}`,
    `Model training enabled: ${report.integrationEffect.startsModelTraining ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Ready"}`,
  ].join("\n");
}

function assertNoSensitiveReportMaterial(report, textReport = "") {
  const serialized = `${JSON.stringify(report)}\n${textReport}`;
  const forbiddenPatterns = [
    /secret/i,
    /token/i,
    /credential/i,
    /provider payload/i,
    /raw metadata/i,
    /record id/i,
    /label raw/i,
    /split window/i,
    /account/i,
    /order payload/i,
    /hash/i,
    /digest/i,
    /fingerprint/i,
    /\.env/i,
  ];
  const violations = forbiddenPatterns
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => pattern.source);
  return deepFreeze({ ok: violations.length === 0, violations });
}

function parseArgs(argv) {
  const options = {
    outputDir: DEFAULT_OUTPUT_DIR,
    executionErrorCode: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output-dir" || arg === "--output") {
      options.outputDir = argv[index + 1];
      index += 1;
    } else if (arg === "--execution-error-code") {
      options.executionErrorCode = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

function writeOfflineDataQualityCiArtifact(report, outputDir) {
  const textReport = formatOfflineDataQualityCiReport(report);
  const sensitive = assertNoSensitiveReportMaterial(report, textReport);
  if (!sensitive.ok) {
    throw new Error(`Step233 report contains forbidden material: ${sensitive.violations.join(", ")}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, JSON_REPORT_FILE);
  const textPath = path.join(outputDir, TEXT_REPORT_FILE);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(textPath, `${textReport}\n`);
  return deepFreeze({
    artifactName: ARTIFACT_NAME,
    retentionDays: ARTIFACT_RETENTION_DAYS,
    outputDir,
    files: [jsonPath, textPath],
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await buildCurrentOfflineDataQualityCiReport({
    executionErrorCode: options.executionErrorCode,
  });
  const artifact = writeOfflineDataQualityCiArtifact(report, options.outputDir);
  console.log(formatOfflineDataQualityCiReport(report));
  console.log(JSON.stringify({
    ok: true,
    artifactName: artifact.artifactName,
    retentionDays: artifact.retentionDays,
    files: artifact.files.map((file) => path.basename(file)),
    executionStatus: report.executionStatus,
    qualityStatus: report.qualityStatus,
    liveTradingReadiness: report.readiness.state,
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({
      ok: false,
      executionStatus: "execution_error",
      executionErrorCode: "REPORT_GENERATION_FAILED",
      message: error?.message || "REPORT_GENERATION_FAILED",
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  REPORT_SCHEMA_VERSION,
  REPORT_MODE,
  TOP_LEVEL_KEYS,
  INTEGRATION_EFFECT_KEYS,
  JSON_REPORT_FILE,
  TEXT_REPORT_FILE,
  ARTIFACT_NAME,
  ARTIFACT_RETENTION_DAYS,
  DEFAULT_OPERATING_MODEL,
  DEFAULT_EVIDENCE_AVAILABILITY,
  buildCurrentOfflineDataQualityCiReport,
  formatOfflineDataQualityCiReport,
  writeOfflineDataQualityCiArtifact,
  assertNoSensitiveReportMaterial,
};
