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
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "kisTradingService.js"),
  path.join("server", "src", "services", "kisOrderService.js"),
  path.join("server", "src", "services", "tradingOrderService.js"),
  path.join("server", "src", "services", "tradingLiveGuardedOrderAdapter.js"),
  path.join("server", "src", "workers", "tradingLiveGuardedWorker.js"),
  path.join("server", "src", "workers", "tradingPrivateWorker.js"),
  path.join("server", "src", "services", "trading", "privateWorker.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
  path.join("data", "processed", "scenario_monthly_returns.csv"),
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

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function lockedFlagsAreFalse(readiness = {}) {
  return LOCKED_FLAGS.every((field) => readiness[field] === false);
}

function sourceReady(source) {
  const report = readJson(source.path);
  const readiness = report.readiness ?? {};
  return {
    key: source.key,
    path: source.path,
    ready: readiness[source.readyField] === true && lockedFlagsAreFalse(readiness),
    readyField: source.readyField,
    status: readiness.status ?? report.status ?? null,
  };
}

function progressStillFailClosed(progressSummary) {
  const readiness = progressSummary.readiness ?? {};
  return (
    readiness.readyForReadOnlyProviderCalls === false &&
    readiness.readyForOrderSubmission === false &&
    readiness.readyForLiveGuardedTrading === false &&
    readiness.providerCallsAllowed === false &&
    readiness.orderSubmissionAllowed === false &&
    readiness.runtimeRouteAllowed === false &&
    readiness.publicUiAllowed === false &&
    readiness.dbMigrationAllowed === false
  );
}

function buildContract(config) {
  const sourceReports = config.sources.map(sourceReady);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const normalizedContractPath = config.contractPath.replaceAll("\\", "/");
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const blockers = [
    ...sourceReports.filter((source) => !source.ready).map((source) => `${source.key}_not_ready`),
    progressStillFailClosed(progressSummary) ? null : "progress_summary_no_longer_fail_closed",
    architectureDoc.includes(config.step) && architectureDoc.includes(normalizedContractPath)
      ? null
      : "architecture_doc_missing_step_boundary",
    forbiddenArtifacts.length === 0 ? null : "forbidden_runtime_artifacts_present",
  ].filter(Boolean);
  const ready = blockers.length === 0;

  return stableJson({
    contractVersion: `trading-lab-step116-${config.scope}-v0.1`,
    auditedAt: AUDITED_AT,
    step: config.step,
    scope: config.scope,
    sourceFiles: {
      ...Object.fromEntries(config.sources.map((source) => [source.key, source.path])),
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    currentState: {
      contractOnly: true,
      kisPersonalPermissionExternalBlocker: false,
      ownerReviewResultSuppliedNow: false,
      ownerReviewResultReadNow: false,
      privateReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepRecordsHashInputs: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImplementsOrderAdapter: false,
      currentStepImportsOrderAdapter: false,
      currentStepStartsWorkerRuntime: false,
      currentStepSignsProviderRequests: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      privateWorkerImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    boundary: {
      currentStepMaySupplyReviewResult: false,
      currentStepMayReadReviewResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayRecordHashInputs: false,
      currentStepMayOpenPrivateWorkerImplementation: false,
      currentStepMayCallProvider: false,
      currentStepMaySubmitOrders: false,
      currentStepMayCreateRuntimeRoute: false,
      currentStepMayCreatePublicUi: false,
      currentStepMayCreateDbMigration: false,
      currentStepMayCreateScenarioMonthlyReturns: false,
    },
    checks: {
      contractOnly: true,
      sourcesReady: sourceReports.every((source) => source.ready),
      progressSummaryStillFailClosed: progressStillFailClosed(progressSummary),
      architectureDocMentionsStep: architectureDoc.includes(config.step),
      architectureDocMentionsContract: architectureDoc.includes(normalizedContractPath),
      noRuntimeArtifacts: forbiddenArtifacts.length === 0,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      sourceReports,
    },
    readiness: {
      status: ready ? `${config.scope}_ready_pending_owner_review_result` : `blocked_before_${config.scope}`,
      [config.readyField]: ready,
      readyForPrivateWorkerImplementationAfterBoundaryReviewResult: false,
      kisPersonalPermissionExternalBlocker: false,
      ownerReviewResultSuppliedNow: false,
      ownerReviewResultReadNow: false,
      privateReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepRecordsHashInputs: false,
      currentStepOpensPrivateWorkerImplementation: false,
      currentStepImplementsPrivateWorker: false,
      currentStepImplementsOrderAdapter: false,
      currentStepImportsOrderAdapter: false,
      currentStepStartsWorkerRuntime: false,
      currentStepSignsProviderRequests: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: ["owner_redacted_live_guarded_private_worker_boundary_review_result_review_result"],
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
