const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_order_path_assertion_contract.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const MANUAL_ORDER_PERMISSION_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const MANUAL_ORDER_PERMISSION_PACKET_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const KILL_SWITCH_CLEARANCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const RISK_GATE_CLEARANCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const ENV_RISK_GATE_PATH = path.join("data", "processed", "trading_lab_step116_env_risk_gate_contract.json");
const DRY_RUN_REPLAY_PATH = path.join("data", "processed", "trading_lab_step116_dry_run_replay_contract.json");
const SHADOW_HISTORY_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
);
const AUDIT_LOGGER_READINESS_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_audit_logger_readiness_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-owner-order-path-assertion-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const OWNER_ASSERTED_AT = "2026-07-01T16:00:00+09:00";
const OWNER_ASSERTION_SUMMARY =
  "owner stated that personal-account order work is not blocked by an external permission dispute, while implementation must remain behind FINPLE risk gates";

const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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

function statusOf(report) {
  return report.readiness?.status ?? report.status ?? null;
}

function buildContract() {
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const manualOrderPermissionImportPreflight = readJson(MANUAL_ORDER_PERMISSION_IMPORT_PREFLIGHT_PATH);
  const manualOrderPermissionPacketPreflight = readJson(MANUAL_ORDER_PERMISSION_PACKET_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_PATH);
  const envRiskGate = readJson(ENV_RISK_GATE_PATH);
  const dryRunReplay = readJson(DRY_RUN_REPLAY_PATH);
  const shadowHistoryReview = readJson(SHADOW_HISTORY_REVIEW_PATH);
  const auditLoggerReadiness = readJson(AUDIT_LOGGER_READINESS_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    ownerAssertionRecorded: true,
    ownerAssertionIsOrderSubmissionApproval: false,
    manualOrderPermissionPreflightReady:
      manualOrderPermissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false &&
      manualOrderPermissionPreflight.readiness?.providerCallsAllowed === false,
    manualOrderPermissionImportStillBlocked:
      manualOrderPermissionImportPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview ===
        false &&
      manualOrderPermissionImportPreflight.readiness?.ownerPrivatePermissionPacketAbsentNow === true &&
      manualOrderPermissionImportPreflight.readiness?.permissionPacketImportedNow === false &&
      manualOrderPermissionImportPreflight.readiness?.orderSubmissionAllowed === false,
    manualOrderPermissionPacketValidationReviewOnly:
      manualOrderPermissionPacketPreflight.readiness?.readyForOwnerAssistedManualOrderPermissionPacketValidation ===
        true &&
      manualOrderPermissionPacketPreflight.readiness?.currentStepRunsValidator === false &&
      manualOrderPermissionPacketPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      manualOrderPermissionPacketPreflight.readiness?.permissionPacketImportedNow === false &&
      manualOrderPermissionPacketPreflight.readiness?.orderSubmissionAllowed === false,
    liveGuardedOrderAdapterStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceStillRequiresImplementationReview:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceStillRequiresImplementationReview:
      riskGateClearance.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearance.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearance.readiness?.orderSubmissionAllowed === false,
    envRiskGateFailClosed:
      envRiskGate.readiness?.readyForRuntimeRoute === false &&
      envRiskGate.readiness?.readyForProviderCalls === false &&
      envRiskGate.readiness?.orderSubmissionAllowed === false,
    dryRunReplayReviewReadyButNoOrder:
      dryRunReplay.currentState?.contractOnly === true &&
      dryRunReplay.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewReadyButNoOrder:
      shadowHistoryReview.currentState?.contractOnly === true &&
      shadowHistoryReview.readiness?.orderSubmissionAllowed === false,
    auditLoggerReviewReadyButNoOrder:
      auditLoggerReadiness.currentState?.contractOnly === true &&
      auditLoggerReadiness.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    architectureDocMentionsOwnerOrderPathAssertion:
      architectureDoc.includes("Trading Owner Order Path Assertion") &&
      architectureDoc.includes("trading_lab_step116_owner_order_path_assertion_contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const assertionRecordedWithOrdersBlocked =
    checks.ownerAssertionRecorded &&
    checks.ownerAssertionIsOrderSubmissionApproval === false &&
    checks.manualOrderPermissionPreflightReady &&
    checks.manualOrderPermissionImportStillBlocked &&
    checks.manualOrderPermissionPacketValidationReviewOnly &&
    checks.liveGuardedOrderAdapterStillBlocked &&
    checks.killSwitchClearanceStillRequiresImplementationReview &&
    checks.riskGateClearanceStillRequiresImplementationReview &&
    checks.envRiskGateFailClosed &&
    checks.dryRunReplayReviewReadyButNoOrder &&
    checks.shadowHistoryReviewReadyButNoOrder &&
    checks.auditLoggerReviewReadyButNoOrder &&
    checks.progressSummaryStillFailClosed &&
    checks.architectureDocMentionsOwnerOrderPathAssertion &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5S",
    scope: "owner_order_path_assertion",
    sourceFiles: {
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      manualOrderPermissionImportImplementationPreflight: MANUAL_ORDER_PERMISSION_IMPORT_PREFLIGHT_PATH,
      manualOrderPermissionPacketValidationPreflight: MANUAL_ORDER_PERMISSION_PACKET_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_PATH,
      envRiskGateContract: ENV_RISK_GATE_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_PATH,
      auditLoggerReadinessContract: AUDIT_LOGGER_READINESS_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      ownerOrderPathAssertionRecordedNow: true,
      ownerAssertionIsOrderSubmissionApproval: false,
      manualOrderPermissionImportedNow: false,
      permissionPacketReadNow: false,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    ownerOrderPathAssertion: {
      assertedAt: OWNER_ASSERTED_AT,
      assertionSummary: OWNER_ASSERTION_SUMMARY,
      interpretation:
        "record the owner's order-path statement as an internal evidence input; do not treat it as permission to submit orders or bypass FINPLE gates",
      acceptedBoundaries: [
        "personal_account_order_path_no_longer_waits_on_market_data_terms_reply",
        "order_submission_still_requires_manual_permission_packet_import",
        "order_submission_still_requires_kill_switch_clearance",
        "order_submission_still_requires_risk_gate_clearance",
        "order_submission_still_requires_dry_run_and_shadow_review",
        "order_submission_still_requires_live_guarded_order_adapter_review",
        "no_provider_call_or_order_submission_from_this_contract",
      ],
      nextEligibleWork: [
        "owner_assisted_manual_order_permission_packet_preparation",
        "kill_switch_clearance_review_for_order_submission",
        "risk_gate_clearance_review_for_order_submission",
        "private_live_guarded_adapter_review_after_packet_and_clearance",
      ],
    },
    checks,
    evidence: {
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOrderPermissionPreflightStatus: statusOf(manualOrderPermissionPreflight),
      manualOrderPermissionImportPreflightStatus: statusOf(manualOrderPermissionImportPreflight),
      manualOrderPermissionPacketValidationPreflightStatus: statusOf(manualOrderPermissionPacketPreflight),
      liveGuardedOrderAdapterPreflightStatus: statusOf(liveGuardedOrderAdapterPreflight),
      killSwitchClearanceStatus: statusOf(killSwitchClearance),
      riskGateClearanceStatus: statusOf(riskGateClearance),
      envRiskGateStatus: statusOf(envRiskGate),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: assertionRecordedWithOrdersBlocked
        ? "owner_order_path_assertion_recorded_orders_still_blocked"
        : "owner_order_path_assertion_blocked",
      assertionRecordedWithOrdersBlocked,
      ownerOrderPathAssertionRecordedNow: true,
      ownerAssertionIsOrderSubmissionApproval: false,
      readyForManualOrderPermissionPacketPreparation: true,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.manualOrderPermissionImportStillBlocked ? [] : ["manual_order_permission_import_no_longer_blocked"]),
        ...(checks.manualOrderPermissionPacketValidationReviewOnly
          ? []
          : ["manual_order_permission_packet_validation_no_longer_review_only"]),
        ...(checks.liveGuardedOrderAdapterStillBlocked ? [] : ["live_guarded_order_adapter_no_longer_blocked"]),
        ...(checks.killSwitchClearanceStillRequiresImplementationReview
          ? []
          : ["kill_switch_clearance_no_longer_requires_review"]),
        ...(checks.riskGateClearanceStillRequiresImplementationReview
          ? []
          : ["risk_gate_clearance_no_longer_requires_review"]),
        ...(checks.envRiskGateFailClosed ? [] : ["env_risk_gate_no_longer_fail_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...(checks.architectureDocMentionsOwnerOrderPathAssertion
          ? []
          : ["architecture_doc_missing_owner_order_path_assertion"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "manual_order_permission_packet_not_imported",
        "kill_switch_clearance_not_recorded_for_order_submission",
        "risk_gate_clearance_not_recorded_for_order_submission",
        "dry_run_replay_execution_not_recorded_for_live_guarded_order_submission",
        "shadow_history_review_not_recorded_for_live_guarded_order_submission",
        "live_guarded_order_adapter_implementation_review_not_started",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-owner-order-path-assertion-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-owner-order-path-assertion-contract.cjs`,
      );
    }
    console.log("[generate-trading-owner-order-path-assertion-contract] ok");
    console.log(`[generate-trading-owner-order-path-assertion-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-owner-order-path-assertion-contract] wrote contract");
  console.log(
    `[generate-trading-owner-order-path-assertion-contract] assertionRecordedWithOrdersBlocked=${parsed.readiness.assertionRecordedWithOrdersBlocked}`,
  );
}

main();
