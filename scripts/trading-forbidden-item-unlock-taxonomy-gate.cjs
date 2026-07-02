const fs = require("node:fs");
const path = require("node:path");

const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);
const AUDITED_AT = "2026-07-02T00:00:00Z";
const LOCKED_FLAGS = [
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "tradingLiveGuardedOrderAdapter.js"),
  path.join("server", "src", "workers", "tradingLiveGuardedWorker.js"),
  path.join("server", "src", "workers", "tradingPrivateWorker.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("src", "components", "trading"),
  path.join("migrations", "trading"),
  path.join("data", "processed", "scenario_monthly_returns.csv"),
];
const CURRENT_STAGE_FORBIDDEN = [
  "provider_call",
  "order_submission",
  "provider_adapter_implementation",
  "private_worker_implementation",
  "runtime_route",
  "public_ui_or_homepage_router",
  "db_migration",
  "scenario_monthly_returns_csv",
];
const SEPARATE_UNLOCK_REQUIRED = [
  "provider_call_requires_read_only_provider_call_authorization_review",
  "order_submission_requires_manual_permission_receipt_kill_switch_risk_gate_dry_run_shadow_history_and_adapter_review",
  "provider_adapter_requires_live_guarded_adapter_review_result",
  "private_worker_requires_private_worker_implementation_review_result_and_later_runtime_review",
  "runtime_route_requires_private_runtime_review",
  "public_ui_requires_public_dashboard_router_review",
  "db_migration_requires_private_storage_review",
  "scenario_monthly_returns_requires_real_source_approval_and_writer_gate",
];
const REPO_NEVER_RECORD = [
  "private_packet_path_material",
  "private_local_receipt_path_material",
  "private_source_path_material",
  "raw_provider_payload_material",
  "raw_order_payload_material",
  "raw_account_identifier_material",
  "credential_material",
  "token_material",
  "hash_input_material",
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function progressStillFailClosed(progressSummary) {
  const readiness = progressSummary.readiness ?? {};
  return LOCKED_FLAGS.every((flag) => readiness[flag] === false);
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function sourceReady(source) {
  const report = readJson(source.path);
  const readiness = report.readiness ?? {};
  return {
    key: source.key,
    path: source.path,
    readyField: source.readyField,
    ready:
      readiness[source.readyField] === true &&
      LOCKED_FLAGS.filter((flag) => flag in readiness).every((flag) => readiness[flag] === false),
    status: readiness.status ?? null,
  };
}

function buildContract(config) {
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const normalizedContractPath = config.contractPath.replaceAll("\\", "/");
  const sourceReports = (config.sources ?? []).map(sourceReady);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const currentStageForbidden = [...CURRENT_STAGE_FORBIDDEN];
  const separateUnlockRequired = [...SEPARATE_UNLOCK_REQUIRED];
  const repoNeverRecord = [...REPO_NEVER_RECORD];
  const blockers = [
    ...sourceReports.filter((source) => !source.ready).map((source) => `${source.key}_not_ready`),
    progressStillFailClosed(progressSummary) ? null : "progress_summary_no_longer_fail_closed",
    architectureDoc.includes(config.step) && architectureDoc.includes(normalizedContractPath)
      ? null
      : "architecture_doc_missing_forbidden_unlock_taxonomy",
    forbiddenArtifacts.length === 0 ? null : "forbidden_runtime_artifacts_present",
    ...missingValues(currentStageForbidden, CURRENT_STAGE_FORBIDDEN).map((item) => `missing_current_stage_${item}`),
    ...missingValues(separateUnlockRequired, SEPARATE_UNLOCK_REQUIRED).map((item) => `missing_separate_unlock_${item}`),
    ...missingValues(repoNeverRecord, REPO_NEVER_RECORD).map((item) => `missing_repo_never_record_${item}`),
  ].filter(Boolean);
  const ready = blockers.length === 0;

  return stableJson({
    contractVersion: `trading-lab-step116-${config.scope}-v0.1`,
    auditedAt: AUDITED_AT,
    step: config.step,
    scope: config.scope,
    sourceFiles: {
      ...Object.fromEntries(sourceReports.map((source) => [source.key, source.path])),
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    currentState: {
      taxonomyOnly: true,
      contractOnly: true,
      currentStepClassifiesForbiddenItems: true,
      currentStepUnlocksProviderCalls: false,
      currentStepUnlocksOrderSubmission: false,
      currentStepUnlocksProviderAdapter: false,
      currentStepUnlocksPrivateWorker: false,
      currentStepUnlocksRuntimeRoute: false,
      currentStepUnlocksPublicUi: false,
      currentStepUnlocksDbMigration: false,
      currentStepCreatesScenarioMonthlyReturns: false,
      currentStepRecordsPrivateMaterial: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    forbiddenItemTaxonomy: {
      currentStageForbidden,
      separateUnlockRequired,
      repoNeverRecord,
      explanation:
        "Current-stage forbidden items can only move through explicit later gates, while private material remains non-repo material.",
    },
    checks: {
      sourcesReady: sourceReports.every((source) => source.ready),
      progressSummaryStillFailClosed: progressStillFailClosed(progressSummary),
      architectureDocMentionsStep: architectureDoc.includes(config.step),
      architectureDocMentionsContract: architectureDoc.includes(normalizedContractPath),
      noRuntimeArtifacts: forbiddenArtifacts.length === 0,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      currentStageForbiddenComplete: missingValues(currentStageForbidden, CURRENT_STAGE_FORBIDDEN).length === 0,
      separateUnlockRequiredComplete: missingValues(separateUnlockRequired, SEPARATE_UNLOCK_REQUIRED).length === 0,
      repoNeverRecordComplete: missingValues(repoNeverRecord, REPO_NEVER_RECORD).length === 0,
      sourceReports,
    },
    readiness: {
      status: ready ? `${config.scope}_ready_fail_closed` : `blocked_before_${config.scope}`,
      [config.readyField]: ready,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers,
    },
  });
}

function runContract(config) {
  const expected = buildContract(config);
  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(config.contractPath) ? fs.readFileSync(config.contractPath, "utf8") : "";
    if (actual !== expected) {
      fail(`${config.contractPath} is out of date`);
    }
    console.log(`[${config.logName}] ok`);
    console.log(`[${config.logName}] contract=${config.contractPath}`);
    return;
  }

  fs.mkdirSync(path.dirname(config.contractPath), { recursive: true });
  fs.writeFileSync(config.contractPath, expected);
  console.log(`[${config.logName}] wrote ${config.contractPath}`);
}

module.exports = { runContract };
