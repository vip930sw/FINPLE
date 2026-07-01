const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
);
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const MANUAL_PACKET_CHECKLIST_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
);
const MANUAL_RECEIPT_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
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
const DRY_RUN_REPLAY_PATH = path.join("data", "processed", "trading_lab_step116_dry_run_replay_contract.json");
const SHADOW_HISTORY_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
);
const LIVE_GUARDED_CLEARANCE_BUNDLE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
);
const LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-live-guarded-internal-gate-clearance-sequence-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_SEQUENCE = [
  "owner_prepared_manual_permission_packet",
  "validation_result_receipt",
  "kill_switch_clearance_review_result",
  "risk_gate_clearance_review_result",
  "dry_run_replay_execution_result",
  "shadow_history_review_result",
  "live_guarded_order_adapter_review",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
  path.join("data", "private", "trading", "live_guarded_clearance_review_result_bundle.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "liveGuardedClearanceReviewResultBundle.js"),
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

function buildContract() {
  const preflight = readJson(PREFLIGHT_PATH);
  const manualPacketChecklist = readJson(MANUAL_PACKET_CHECKLIST_PATH);
  const manualReceiptReviewResult = readJson(MANUAL_RECEIPT_REVIEW_RESULT_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_PATH);
  const dryRunReplay = readJson(DRY_RUN_REPLAY_PATH);
  const shadowHistoryReview = readJson(SHADOW_HISTORY_REVIEW_PATH);
  const liveGuardedClearanceBundle = readJson(LIVE_GUARDED_CLEARANCE_BUNDLE_PATH);
  const liveGuardedAdapterPreflight = readJson(LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const clearanceSequence = [
    {
      id: "owner_prepared_manual_permission_packet",
      status: "owner_local_preparation_unlocked_packet_not_created_or_read_by_repo",
      openedForNextAction: true,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["owner_local_redacted_packet", "hash_only_fields", "time_boxed_caps"],
    },
    {
      id: "validation_result_receipt",
      status: "blocked_pending_explicit_owner_local_packet_validation",
      openedForNextAction: false,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["redacted_validation_receipt", "no_packet_path", "no_raw_values"],
    },
    {
      id: "kill_switch_clearance_review_result",
      status: "result_shape_ready_pending_owner_clearance_review",
      openedForNextAction: false,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["time_boxed_clearance", "audited_operator_hash", "kill_switch_override_absent"],
    },
    {
      id: "risk_gate_clearance_review_result",
      status: "result_shape_ready_pending_deterministic_risk_input_review",
      openedForNextAction: false,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["bounded_notional", "bounded_loss", "non_wildcard_symbols", "fresh_snapshot_hashes"],
    },
    {
      id: "dry_run_replay_execution_result",
      status: "result_shape_ready_pending_fixture_replay_execution",
      openedForNextAction: false,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["deterministic_replay_id", "risk_events", "paper_ledger_hash"],
    },
    {
      id: "shadow_history_review_result",
      status: "result_shape_ready_pending_shadow_history_review",
      openedForNextAction: false,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["shadow_intent_hashes", "risk_event_hashes", "operator_review_hash"],
    },
    {
      id: "live_guarded_order_adapter_review",
      status: "blocked_until_all_prior_review_results_are_recorded",
      openedForNextAction: false,
      evidenceRecordedNow: false,
      requiredBeforeNextStage: ["all_prior_result_hashes", "private_worker_only_review", "no_runtime_route"],
    },
  ];

  const checks = {
    preflightStillBlocksProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillBlocksOrders: preflight.readiness?.orderSubmissionAllowed === false,
    manualPacketChecklistReady:
      manualPacketChecklist.readiness?.readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist === true &&
      manualPacketChecklist.readiness?.permissionPacketImportedNow === false &&
      manualPacketChecklist.readiness?.providerCallsAllowed === false &&
      manualPacketChecklist.readiness?.orderSubmissionAllowed === false,
    manualReceiptReviewResultReady:
      manualReceiptReviewResult.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult ===
        true &&
      manualReceiptReviewResult.readiness?.validationReceiptReviewRecordedNow === false &&
      manualReceiptReviewResult.readiness?.permissionPacketImportedNow === false &&
      manualReceiptReviewResult.readiness?.providerCallsAllowed === false &&
      manualReceiptReviewResult.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceReady:
      killSwitchClearance.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearance.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearance.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceReady:
      riskGateClearance.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearance.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearance.readiness?.orderSubmissionAllowed === false,
    dryRunReplayReady:
      dryRunReplay.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplay.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplay.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewReady:
      shadowHistoryReview.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReview.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReview.readiness?.orderSubmissionAllowed === false,
    liveGuardedClearanceBundleReady:
      liveGuardedClearanceBundle.readiness?.readyForFutureLiveGuardedClearanceReviewResultBundle === true &&
      liveGuardedClearanceBundle.readiness?.currentStepReadsPrivateEvidence === false &&
      liveGuardedClearanceBundle.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterReviewStillBlocked:
      liveGuardedAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    sequenceOrderReady: clearanceSequence.map((stage) => stage.id).join("|") === REQUIRED_SEQUENCE.join("|"),
    firstStageOnlyOpened:
      clearanceSequence.filter((stage) => stage.openedForNextAction).map((stage) => stage.id).join("|") ===
      "owner_prepared_manual_permission_packet",
    noStageRecordsEvidenceNow: clearanceSequence.every((stage) => stage.evidenceRecordedNow === false),
    architectureDocMentionsSequence:
      architectureDoc.includes("Trading Live-Guarded Internal Gate Clearance Sequence") &&
      architectureDoc.includes("live_guarded_internal_gate_clearance_sequence"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
  };

  const readyForSequentialInternalGateReview = Object.values(checks).every(Boolean);

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5W",
    scope: "live_guarded_internal_gate_clearance_sequence",
    sourceFiles: {
      preflight: PREFLIGHT_PATH,
      manualOrderPermissionPacketPreparationChecklist: MANUAL_PACKET_CHECKLIST_PATH,
      manualOrderPermissionValidationResultReceiptReviewResult: MANUAL_RECEIPT_REVIEW_RESULT_PATH,
      killSwitchClearance: KILL_SWITCH_CLEARANCE_PATH,
      riskGateClearance: RISK_GATE_CLEARANCE_PATH,
      dryRunReplay: DRY_RUN_REPLAY_PATH,
      shadowHistoryReview: SHADOW_HISTORY_REVIEW_PATH,
      liveGuardedClearanceReviewResultBundle: LIVE_GUARDED_CLEARANCE_BUNDLE_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      sequenceContractOnly: true,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRecordsValidationReceipt: false,
      currentStepRecordsClearanceResult: false,
      currentStepExecutesDryRunReplay: false,
      currentStepReviewsShadowHistory: false,
      currentStepStartsAdapterReview: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    clearanceSequence,
    evidenceBoundary: {
      ownerLocalManualPacketPreparationUnlocked: true,
      validationReceiptEvidenceRecorded: false,
      killSwitchClearanceResultRecorded: false,
      riskGateClearanceResultRecorded: false,
      dryRunReplayExecutionResultRecorded: false,
      shadowHistoryReviewResultRecorded: false,
      liveGuardedAdapterReviewStarted: false,
      actualLiveTradingReadiness: false,
    },
    checks,
    evidence: {
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualPacketChecklistStatus: manualPacketChecklist.readiness?.status ?? null,
      manualReceiptReviewResultStatus: manualReceiptReviewResult.readiness?.status ?? null,
      killSwitchClearanceStatus: killSwitchClearance.readiness?.status ?? null,
      riskGateClearanceStatus: riskGateClearance.readiness?.status ?? null,
      dryRunReplayStatus: dryRunReplay.readiness?.status ?? null,
      shadowHistoryReviewStatus: shadowHistoryReview.readiness?.status ?? null,
      liveGuardedClearanceBundleStatus: liveGuardedClearanceBundle.readiness?.status ?? null,
      liveGuardedAdapterPreflightStatus: liveGuardedAdapterPreflight.readiness?.status ?? null,
    },
    readiness: {
      status: readyForSequentialInternalGateReview
        ? "sequence_contract_ready_owner_local_packet_preparation_opened_remaining_results_pending_evidence"
        : "blocked_before_live_guarded_internal_gate_clearance_sequence",
      readyForSequentialInternalGateReview,
      ownerLocalManualPacketPreparationUnlocked: readyForSequentialInternalGateReview,
      validationReceiptEvidenceRecorded: false,
      allClearanceResultsRecorded: false,
      liveGuardedAdapterReviewStarted: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.preflightStillBlocksProviderCalls ? [] : ["preflight_provider_calls_opened"]),
        ...(checks.preflightStillBlocksOrders ? [] : ["preflight_orders_opened"]),
        ...(checks.manualPacketChecklistReady ? [] : ["manual_packet_checklist_not_ready"]),
        ...(checks.manualReceiptReviewResultReady ? [] : ["manual_receipt_review_result_not_ready"]),
        ...(checks.killSwitchClearanceReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.riskGateClearanceReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.dryRunReplayReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.liveGuardedClearanceBundleReady ? [] : ["live_guarded_clearance_bundle_not_ready"]),
        ...(checks.liveGuardedAdapterReviewStillBlocked ? [] : ["live_guarded_adapter_review_opened_too_early"]),
        ...(checks.sequenceOrderReady ? [] : ["sequence_order_drift"]),
        ...(checks.firstStageOnlyOpened ? [] : ["unexpected_stage_opened"]),
        ...(checks.noStageRecordsEvidenceNow ? [] : ["stage_records_evidence_without_owner_result"]),
        ...(checks.architectureDocMentionsSequence ? [] : ["architecture_doc_missing_sequence_boundary"]),
        ...(checks.noRuntimeArtifacts ? [] : ["forbidden_runtime_artifact_present"]),
      ],
    },
  });
}

function main() {
  const expected = buildContract();
  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(CONTRACT_PATH) ? fs.readFileSync(CONTRACT_PATH, "utf8") : "";
    if (actual !== expected) {
      fail(`${CONTRACT_PATH} is out of date`);
    }
  } else {
    fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
    fs.writeFileSync(CONTRACT_PATH, expected);
  }
  console.log("[generate-trading-live-guarded-internal-gate-clearance-sequence-contract] ok");
  console.log(`[generate-trading-live-guarded-internal-gate-clearance-sequence-contract] contract=${CONTRACT_PATH}`);
}

main();
