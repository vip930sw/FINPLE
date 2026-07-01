const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_supply_gate_contract.json",
);
const RISK_GATE_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_preflight_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const KILL_SWITCH_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_receipt_contract.json",
);
const CLEARANCE_SEQUENCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-risk-gate-clearance-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_RISK_GATE_REVIEW_RESULT_SUPPLY_GATES = [
  "risk_gate_clearance_review_preflight_ready",
  "kill_switch_clearance_review_result_receipt_boundary_ready",
  "risk_gate_clearance_contract_ready",
  "owner_risk_gate_clearance_review_result_required_later",
  "current_step_does_not_accept_risk_gate_result",
  "current_step_does_not_read_private_evidence",
  "current_step_does_not_record_risk_snapshot",
  "current_step_does_not_record_risk_gate_clearance_result",
  "current_step_does_not_open_dry_run_replay",
  "current_step_does_not_submit_orders",
  "clearance_sequence_still_requires_ordered_results",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const REQUIRED_RISK_GATE_REVIEW_RESULT_FIELDS = [
  "riskGateClearanceReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "killSwitchClearanceReviewReceiptHash",
  "manualOrderPermissionImportResultHash",
  "riskLimitsPolicyHash",
  "allowedSymbolsReviewHash",
  "blockedInstrumentsReviewHash",
  "auditEventHash",
  "redactionVersion",
  "riskGateClearedNow",
  "dryRunReplayOpenedNow",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
  "liveTradingAllowed",
];
const FORBIDDEN_RISK_GATE_REVIEW_RESULT_SUPPLY_CONTENT = [
  "actual_owner_local_packet_path",
  "actual_owner_local_validation_receipt_path",
  "private_packet_path",
  "private_receipt_path",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "raw_risk_snapshot",
  "raw_broker_position",
  "raw_account_balance",
  "packet_hash_inputs",
  "kill_switch_clearance_payload",
  "risk_gate_clearance_payload",
  "risk_gate_clearance_hash_inputs",
  "dry_run_replay_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "killSwitch.js"),
  path.join("server", "src", "services", "tradingRiskGateClearance.js"),
  path.join("server", "src", "services", "trading", "riskGateClearance.js"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function statusOf(report) {
  return report.readiness?.status ?? report.status ?? null;
}

function buildContract() {
  const riskGateReviewPreflight = readJson(RISK_GATE_REVIEW_PREFLIGHT_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const killSwitchReceipt = readJson(KILL_SWITCH_RECEIPT_PATH);
  const clearanceSequence = readJson(CLEARANCE_SEQUENCE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const riskGateReviewResultSupplyGates = [...REQUIRED_RISK_GATE_REVIEW_RESULT_SUPPLY_GATES];
  const requiredRiskGateReviewResultFields = [...REQUIRED_RISK_GATE_REVIEW_RESULT_FIELDS];
  const forbiddenRiskGateReviewResultSupplyContent = [...FORBIDDEN_RISK_GATE_REVIEW_RESULT_SUPPLY_CONTENT];
  const missingRiskGateReviewResultSupplyGates = missingValues(
    riskGateReviewResultSupplyGates,
    REQUIRED_RISK_GATE_REVIEW_RESULT_SUPPLY_GATES,
  );
  const missingRiskGateReviewResultFields = missingValues(
    requiredRiskGateReviewResultFields,
    REQUIRED_RISK_GATE_REVIEW_RESULT_FIELDS,
  );
  const missingForbiddenRiskGateReviewResultSupplyContent = missingValues(
    forbiddenRiskGateReviewResultSupplyContent,
    FORBIDDEN_RISK_GATE_REVIEW_RESULT_SUPPLY_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    riskGateClearanceReviewResultSupplyGateOnly: true,
    riskGateReviewPreflightReady:
      riskGateReviewPreflight.readiness?.readyForManualOrderPermissionRiskGateClearanceReviewPreflight === true &&
      riskGateReviewPreflight.readiness?.readyForRiskGateClearanceReviewResultSupply === false &&
      riskGateReviewPreflight.readiness?.currentStepReadsPrivateEvidence === false &&
      riskGateReviewPreflight.readiness?.currentStepRecordsRiskSnapshot === false &&
      riskGateReviewPreflight.readiness?.currentStepRecordsRiskGateClearanceResult === false &&
      riskGateReviewPreflight.readiness?.currentStepOpensDryRunReplay === false &&
      riskGateReviewPreflight.readiness?.orderSubmissionAllowed === false,
    killSwitchReceiptBoundaryReady:
      killSwitchReceipt.readiness?.readyForManualOrderPermissionKillSwitchClearanceReviewResultReceipt === true &&
      killSwitchReceipt.readiness?.currentStepOpensRiskGateReview === false &&
      killSwitchReceipt.readiness?.providerCallsAllowed === false &&
      killSwitchReceipt.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearance.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearance.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearance.readiness?.providerCallsAllowed === false &&
      riskGateClearance.readiness?.orderSubmissionAllowed === false &&
      riskGateClearance.readiness?.dbMigrationAllowed === false &&
      riskGateClearance.readiness?.publicUiAllowed === false,
    clearanceSequenceStillOrdered:
      clearanceSequence.readiness?.readyForSequentialInternalGateReview === true &&
      clearanceSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      clearanceSequence.readiness?.allClearanceResultsRecorded === false &&
      clearanceSequence.readiness?.liveGuardedAdapterReviewStarted === false &&
      clearanceSequence.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    riskGateReviewResultSupplyGatesReady: missingRiskGateReviewResultSupplyGates.length === 0,
    riskGateReviewResultFieldsReady: missingRiskGateReviewResultFields.length === 0,
    forbiddenRiskGateReviewResultSupplyContentReady:
      missingForbiddenRiskGateReviewResultSupplyContent.length === 0,
    architectureDocMentionsRiskGateReviewResultSupplyGate:
      architectureDoc.includes("Trading Manual Order Permission Risk Gate Clearance Review Result Supply Gate") &&
      architectureDoc.includes("manual_order_permission_risk_gate_clearance_review_result_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRiskGateClearanceReviewResultSuppliedNow: false,
    currentStepAcceptsRiskGateResult: false,
    currentStepReadsPrivateEvidence: false,
    currentStepRecordsRiskSnapshot: false,
    currentStepRecordsRiskGateClearanceResult: false,
    currentStepOpensDryRunReplay: false,
    currentStepSubmitsOrders: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForManualOrderPermissionRiskGateClearanceReviewResultSupply =
    checks.riskGateReviewPreflightReady &&
    checks.killSwitchReceiptBoundaryReady &&
    checks.riskGateClearanceContractReady &&
    checks.clearanceSequenceStillOrdered &&
    checks.progressSummaryStillFailClosed &&
    checks.riskGateReviewResultSupplyGatesReady &&
    checks.riskGateReviewResultFieldsReady &&
    checks.forbiddenRiskGateReviewResultSupplyContentReady &&
    checks.architectureDocMentionsRiskGateReviewResultSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6X",
    scope: "manual_order_permission_risk_gate_clearance_review_result_supply_gate",
    sourceFiles: {
      manualOrderPermissionRiskGateClearanceReviewPreflight: RISK_GATE_REVIEW_PREFLIGHT_PATH,
      manualOrderPermissionKillSwitchClearanceReviewResultReceipt: KILL_SWITCH_RECEIPT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      liveGuardedInternalGateClearanceSequence: CLEARANCE_SEQUENCE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      riskGateClearanceReviewResultSupplyGateOnly: true,
      ownerRiskGateClearanceReviewResultSuppliedNow: false,
      currentStepAcceptsRiskGateResult: false,
      currentStepReadsPrivateEvidence: false,
      currentStepRecordsRiskSnapshot: false,
      currentStepRecordsRiskGateClearanceResult: false,
      currentStepOpensDryRunReplay: false,
      currentStepSubmitsOrders: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    manualOrderPermissionRiskGateClearanceReviewResultSupplyGate: {
      ownerRiskGateClearanceReviewResultRequiredLater: true,
      currentStepMayAcceptRiskGateResult: false,
      currentStepMayReadPrivateEvidence: false,
      currentStepMayRecordRiskSnapshot: false,
      currentStepMayRecordRiskGateClearanceResult: false,
      currentStepMayOpenDryRunReplay: false,
      currentStepMaySubmitOrder: false,
      nextAllowedAction:
        "after the owner supplies a redacted risk-gate clearance review result outside repo commits, record a separate risk-gate clearance review result contract without reading private evidence, opening dry-run replay, or opening order submission",
      riskGateReviewResultSupplyGates,
      requiredRiskGateReviewResultFields,
      forbiddenRiskGateReviewResultSupplyContent,
    },
    checks,
    evidence: {
      missingRiskGateReviewResultSupplyGates,
      missingRiskGateReviewResultFields,
      missingForbiddenRiskGateReviewResultSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      riskGateReviewPreflightStatus: statusOf(riskGateReviewPreflight),
      killSwitchReceiptStatus: statusOf(killSwitchReceipt),
      riskGateClearanceContractStatus: statusOf(riskGateClearance),
      clearanceSequenceStatus: statusOf(clearanceSequence),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForManualOrderPermissionRiskGateClearanceReviewResultSupply
        ? "manual_order_permission_risk_gate_clearance_review_result_supply_gate_ready_pending_owner_result"
        : "blocked_before_manual_order_permission_risk_gate_clearance_review_result_supply_gate",
      readyForManualOrderPermissionRiskGateClearanceReviewResultSupply,
      readyForRiskGateClearanceReviewResultRecording: false,
      readyForDryRunReplayAfterRiskGate: false,
      ownerRiskGateClearanceReviewResultSuppliedNow: false,
      currentStepAcceptsRiskGateResult: false,
      currentStepReadsPrivateEvidence: false,
      currentStepRecordsRiskSnapshot: false,
      currentStepRecordsRiskGateClearanceResult: false,
      currentStepOpensDryRunReplay: false,
      currentStepSubmitsOrders: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_risk_gate_clearance_review_result",
        "owner_redacted_kill_switch_clearance_review_result",
        "owner_redacted_manual_order_permission_import_result",
        "owner_redacted_manual_order_permission_packet",
      ],
      blockers: [
        ...(checks.riskGateReviewPreflightReady
          ? []
          : ["manual_order_permission_risk_gate_clearance_review_preflight_not_ready"]),
        ...(checks.killSwitchReceiptBoundaryReady
          ? []
          : ["manual_order_permission_kill_switch_clearance_review_result_receipt_boundary_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.clearanceSequenceStillOrdered ? [] : ["live_guarded_internal_gate_sequence_no_longer_ordered"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingRiskGateReviewResultSupplyGates.map(
          (gate) => `missing_risk_gate_clearance_review_result_supply_gate_${gate}`,
        ),
        ...missingRiskGateReviewResultFields.map((field) => `missing_risk_gate_clearance_review_result_field_${field}`),
        ...missingForbiddenRiskGateReviewResultSupplyContent.map(
          (content) => `missing_forbidden_risk_gate_clearance_review_result_supply_content_${content}`,
        ),
        ...(checks.architectureDocMentionsRiskGateReviewResultSupplyGate
          ? []
          : ["architecture_doc_missing_risk_gate_clearance_review_result_supply_gate"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
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
    console.log("[generate-trading-manual-order-permission-risk-gate-clearance-review-result-supply-gate-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-risk-gate-clearance-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  console.log(
    `[generate-trading-manual-order-permission-risk-gate-clearance-review-result-supply-gate-contract] wrote ${CONTRACT_PATH}`,
  );
}

main();
