const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
);
const REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
);
const RECORDING_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_contract.json",
);
const APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
);
const PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";
const REQUIRED_GATES = [
  "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_ready",
  "read_only_approval_import_review_result_recording_result_review_result_recording_result_contract_ready",
  "owner_redacted_approval_import_review_recording_result_review_result_recording_result_review_result_required_later",
  "current_step_does_not_supply_review_result",
  "current_step_does_not_accept_review_result",
  "current_step_does_not_read_review_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_record_private_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_record_hash_inputs",
  "approval_import_implementation_preflight_still_blocked",
  "provider_call_authorization_preflight_still_blocked",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_CONTENT = [
  "actual_owner_local_approval_packet_path",
  "actual_owner_local_recording_result_review_result_recording_result_review_result_path",
  "private_packet_path",
  "private_receipt_path",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_approval_packet",
  "raw_provider_payload",
  "raw_order_payload",
  "review_result_payload",
  "review_result_hash_inputs",
  "recording_result_review_result_recording_result_review_result_payload",
  "recording_result_review_result_recording_result_review_result_hash_inputs",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join(
    "data",
    "private",
    "trading",
    "read_only_approval_import_review_recording_result_review_result_recording_result_review_result.redacted.json",
  ),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
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
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) fail(`${filePath} not found`);
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function statusOf(report) {
  return report.readiness?.status ?? report.status ?? null;
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const reviewPreflight = readJson(REVIEW_PREFLIGHT_PATH);
  const recordingResultContract = readJson(RECORDING_RESULT_CONTRACT_PATH);
  const approvalImportImplementationPreflight = readJson(APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const providerCallAuthorizationPreflight = readJson(PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const gates = [...REQUIRED_GATES];
  const forbiddenContent = [...FORBIDDEN_CONTENT];
  const missingGates = missingValues(gates, REQUIRED_GATES);
  const missingForbiddenContent = missingValues(forbiddenContent, FORBIDDEN_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    reviewResultSupplyGateOnly: true,
    reviewPreflightReady:
      reviewPreflight.readiness
        ?.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewPreflight === true &&
      reviewPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      reviewPreflight.readiness?.providerCallsAllowed === false,
    recordingResultContractReady:
      recordingResultContract.readiness?.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResult ===
        true &&
      recordingResultContract.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      recordingResultContract.readiness?.providerCallsAllowed === false,
    approvalImportImplementationStillBlocked:
      approvalImportImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      approvalImportImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      approvalImportImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportImplementationPreflight.readiness?.providerCallsAllowed === false &&
      approvalImportImplementationPreflight.readiness?.runtimeRouteAllowed === false &&
      approvalImportImplementationPreflight.readiness?.publicUiAllowed === false &&
      approvalImportImplementationPreflight.readiness?.dbMigrationAllowed === false,
    providerCallAuthorizationStillBlocked:
      providerCallAuthorizationPreflight.readiness?.readyForFutureReadOnlyProviderCallAuthorizationReview === false &&
      providerCallAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      providerCallAuthorizationPreflight.readiness?.providerCallsAllowed === false &&
      providerCallAuthorizationPreflight.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false,
    gatesReady: missingGates.length === 0,
    forbiddenContentReady: missingForbiddenContent.length === 0,
    architectureDocMentionsSupplyGate:
      architectureDoc.includes(
        "Trading Read-Only Approval Import Review Result Recording Result Review Result Recording Result Review Result Supply Gate",
      ) &&
      architectureDoc.includes(
        "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate",
      ),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedReviewResultSuppliedNow: false,
    ownerRedactedReviewResultAcceptedNow: false,
    ownerRedactedReviewResultReadNow: false,
    ownerRedactedReviewResultRecordedNow: false,
    currentStepRecordsPrivatePath: false,
    currentStepRecordsRawValues: false,
    currentStepRecordsHashInputs: false,
    approvalPacketImportedNow: false,
    importImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const ready =
    checks.reviewPreflightReady &&
    checks.recordingResultContractReady &&
    checks.approvalImportImplementationStillBlocked &&
    checks.providerCallAuthorizationStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.gatesReady &&
    checks.forbiddenContentReady &&
    checks.architectureDocMentionsSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5Q-W",
    scope: "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate",
    sourceFiles: {
      readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewPreflight: REVIEW_PREFLIGHT_PATH,
      readOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResult: RECORDING_RESULT_CONTRACT_PATH,
      readOnlyApprovalImportImplementationPreflight: APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      readOnlyProviderCallAuthorizationPreflight: PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      reviewResultSupplyGateOnly: true,
      ownerRedactedReviewResultSuppliedNow: false,
      ownerRedactedReviewResultAcceptedNow: false,
      ownerRedactedReviewResultReadNow: false,
      ownerRedactedReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepRecordsHashInputs: false,
      approvalPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    reviewResultSupplyGate: {
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultRequiredLater: true,
      currentStepMaySupplyReviewResult: false,
      currentStepMayAcceptReviewResult: false,
      currentStepMayReadReviewResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayRecordHashInputs: false,
      currentStepMayImportApprovalPacket: false,
      currentStepMayImplementImportService: false,
      currentStepMayAuthorizeProviderCalls: false,
      nextAllowedAction:
        "after an owner redacted review result is supplied outside repo commits, record a separate hash-only review-result contract boundary",
      gates,
      forbiddenContent,
    },
    checks,
    evidence: {
      missingGates,
      missingForbiddenContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      reviewPreflightStatus: statusOf(reviewPreflight),
      recordingResultContractStatus: statusOf(recordingResultContract),
      approvalImportImplementationPreflightStatus: statusOf(approvalImportImplementationPreflight),
      providerCallAuthorizationPreflightStatus: statusOf(providerCallAuthorizationPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: ready
        ? "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate_ready_import_still_blocked_pending_owner_review_result"
        : "blocked_before_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate",
      readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate: ready,
      readyForFutureReadOnlyApprovalImportImplementationReview: false,
      ownerRedactedReviewResultSuppliedNow: false,
      ownerRedactedReviewResultAcceptedNow: false,
      ownerRedactedReviewResultReadNow: false,
      ownerRedactedReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepRecordsHashInputs: false,
      approvalPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_approval_import_review_recording_result_review_result_recording_result_review_result",
        "owner_explicit_local_redacted_approval_packet_path",
      ],
      blockers: [
        ...(checks.reviewPreflightReady
          ? []
          : [
              "read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_not_ready",
            ]),
        ...(checks.recordingResultContractReady
          ? []
          : [
              "read_only_approval_import_review_result_recording_result_review_result_recording_result_contract_not_ready",
            ]),
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_preflight_no_longer_blocked"]),
        ...(checks.providerCallAuthorizationStillBlocked
          ? []
          : ["read_only_provider_call_authorization_preflight_no_longer_blocked"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingGates.map((gate) => `missing_review_result_supply_gate_${gate}`),
        ...missingForbiddenContent.map((content) => `missing_forbidden_review_result_supply_gate_content_${content}`),
        ...(checks.architectureDocMentionsSupplyGate
          ? []
          : [
              "architecture_doc_missing_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate",
            ]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const expected = buildContract();
  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(CONTRACT_PATH) ? fs.readFileSync(CONTRACT_PATH, "utf8") : "";
    if (actual !== expected) fail(`${CONTRACT_PATH} is out of date`);
    console.log(
      "[generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract] ok",
    );
    console.log(
      `[generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract] wrote contract",
  );
  console.log(
    `[generate-trading-read-only-approval-import-review-result-recording-result-review-result-recording-result-review-result-supply-gate-contract] readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate=${parsed.readiness.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultRecordingResultReviewResultSupplyGate}`,
  );
}

main();
