const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_supply_gate_contract.json",
);
const REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_preflight_contract.json",
);
const RECORDING_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_contract.json",
);
const RECORDING_RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_supply_gate_contract.json",
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
  "trading-lab-step116-read-only-approval-import-review-result-recording-result-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_REVIEW_RESULT_SUPPLY_GATES = [
  "read_only_approval_import_review_result_recording_result_review_preflight_ready",
  "read_only_approval_import_review_result_recording_result_contract_ready",
  "read_only_approval_import_review_result_recording_result_supply_gate_ready",
  "owner_redacted_approval_import_review_recording_result_review_result_required_later",
  "current_step_does_not_accept_review_result",
  "current_step_does_not_read_review_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_read_recording_result",
  "current_step_does_not_record_private_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_record_hash_inputs",
  "current_step_does_not_read_private_approval_packet",
  "current_step_does_not_import_approval_packet",
  "approval_import_implementation_preflight_still_blocked",
  "provider_call_authorization_preflight_still_blocked",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_REVIEW_RESULT_SUPPLY_CONTENT = [
  "actual_owner_local_approval_packet_path",
  "actual_owner_local_import_review_result_path",
  "actual_owner_local_recording_result_path",
  "actual_owner_local_recording_result_review_path",
  "actual_owner_local_recording_result_review_result_path",
  "private_packet_path",
  "private_receipt_path",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_name",
  "raw_evidence_text",
  "raw_revocation_plan",
  "raw_approval_packet",
  "raw_approval_payload",
  "raw_provider_payload",
  "raw_order_payload",
  "validator_stdout_with_raw_values",
  "validator_stderr_with_raw_values",
  "approval_hash_inputs",
  "review_result_payload",
  "review_result_hash_inputs",
  "approval_import_payload",
  "recording_result_payload",
  "recording_result_hash_inputs",
  "recording_result_review_payload",
  "recording_result_review_hash_inputs",
  "recording_result_review_result_payload",
  "recording_result_review_result_hash_inputs",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval_import_review_result.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval_import_review_recording_result.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval_import_review_recording_result_review.redacted.json"),
  path.join(
    "data",
    "private",
    "trading",
    "read_only_approval_import_review_recording_result_review_result.redacted.json",
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
  const reviewPreflight = readJson(REVIEW_PREFLIGHT_PATH);
  const recordingResultContract = readJson(RECORDING_RESULT_CONTRACT_PATH);
  const recordingResultSupplyGate = readJson(RECORDING_RESULT_SUPPLY_GATE_PATH);
  const approvalImportImplementationPreflight = readJson(APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const providerCallAuthorizationPreflight = readJson(PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultSupplyGates = [...REQUIRED_REVIEW_RESULT_SUPPLY_GATES];
  const forbiddenReviewResultSupplyContent = [...FORBIDDEN_REVIEW_RESULT_SUPPLY_CONTENT];
  const missingReviewResultSupplyGates = missingValues(reviewResultSupplyGates, REQUIRED_REVIEW_RESULT_SUPPLY_GATES);
  const missingForbiddenReviewResultSupplyContent = missingValues(
    forbiddenReviewResultSupplyContent,
    FORBIDDEN_REVIEW_RESULT_SUPPLY_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    reviewResultSupplyGateOnly: true,
    reviewPreflightReady:
      reviewPreflight.readiness?.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewPreflight === true &&
      reviewPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      reviewPreflight.readiness?.ownerRedactedApprovalImportReviewResultRecordingResultReviewAcceptedNow === false &&
      reviewPreflight.readiness?.ownerRedactedApprovalImportReviewResultRecordingResultReviewReadNow === false &&
      reviewPreflight.readiness?.ownerRedactedApprovalImportReviewResultRecordingResultReviewRecordedNow === false &&
      reviewPreflight.readiness?.currentStepReadsRecordingResult === false &&
      reviewPreflight.readiness?.currentStepRecordsReview === false &&
      reviewPreflight.readiness?.currentStepRecordsPrivatePath === false &&
      reviewPreflight.readiness?.currentStepRecordsRawValues === false &&
      reviewPreflight.readiness?.currentStepRecordsHashInputs === false &&
      reviewPreflight.readiness?.approvalPacketImportedNow === false &&
      reviewPreflight.readiness?.providerCallsAllowed === false,
    recordingResultContractReady:
      recordingResultContract.readiness?.readyForReadOnlyApprovalImportReviewResultRecordingResult === true &&
      recordingResultContract.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      recordingResultContract.readiness?.currentStepReadsRecordingResult === false &&
      recordingResultContract.readiness?.currentStepRecordsRecordingResult === false &&
      recordingResultContract.readiness?.providerCallsAllowed === false,
    recordingResultSupplyGateReady:
      recordingResultSupplyGate.readiness?.readyForReadOnlyApprovalImportReviewResultRecordingResultSupply === true &&
      recordingResultSupplyGate.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      recordingResultSupplyGate.readiness?.currentStepReadsRecordingResult === false &&
      recordingResultSupplyGate.readiness?.currentStepRecordsRecordingResult === false &&
      recordingResultSupplyGate.readiness?.providerCallsAllowed === false,
    approvalImportImplementationStillBlocked:
      approvalImportImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      approvalImportImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      approvalImportImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
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
    reviewResultSupplyGatesReady: missingReviewResultSupplyGates.length === 0,
    forbiddenReviewResultSupplyContentReady: missingForbiddenReviewResultSupplyContent.length === 0,
    architectureDocMentionsReviewResultSupplyGate:
      architectureDoc.includes(
        "Trading Read-Only Approval Import Review Result Recording Result Review Result Supply Gate",
      ) && architectureDoc.includes("read_only_approval_import_review_result_recording_result_review_result_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedApprovalImportReviewResultRecordingResultReviewResultSuppliedNow: false,
    ownerRedactedApprovalImportReviewResultRecordingResultReviewResultReadNow: false,
    ownerRedactedApprovalImportReviewResultRecordingResultReviewResultRecordedNow: false,
    currentStepReadsReviewResult: false,
    currentStepReadsRecordingResult: false,
    currentStepRecordsReviewResult: false,
    currentStepRecordsPrivatePath: false,
    currentStepRecordsRawValues: false,
    currentStepRecordsHashInputs: false,
    ownerPacketReadAllowedNow: false,
    approvalPacketImportedNow: false,
    importImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultSupply =
    checks.reviewPreflightReady &&
    checks.recordingResultContractReady &&
    checks.recordingResultSupplyGateReady &&
    checks.approvalImportImplementationStillBlocked &&
    checks.providerCallAuthorizationStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.reviewResultSupplyGatesReady &&
    checks.forbiddenReviewResultSupplyContentReady &&
    checks.architectureDocMentionsReviewResultSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5Q-Q",
    scope: "read_only_approval_import_review_result_recording_result_review_result_supply_gate",
    sourceFiles: {
      readOnlyApprovalImportReviewResultRecordingResultReviewPreflight: REVIEW_PREFLIGHT_PATH,
      readOnlyApprovalImportReviewResultRecordingResult: RECORDING_RESULT_CONTRACT_PATH,
      readOnlyApprovalImportReviewResultRecordingResultSupplyGate: RECORDING_RESULT_SUPPLY_GATE_PATH,
      readOnlyApprovalImportImplementationPreflight: APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      readOnlyProviderCallAuthorizationPreflight: PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      reviewResultSupplyGateOnly: true,
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultSuppliedNow: false,
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultReadNow: false,
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultRecordedNow: false,
      currentStepReadsReviewResult: false,
      currentStepReadsRecordingResult: false,
      currentStepRecordsReviewResult: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepRecordsHashInputs: false,
      ownerPacketReadAllowedNow: false,
      approvalPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    importReviewResultRecordingResultReviewResultSupplyGate: {
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultRequiredLater: true,
      currentStepMayAcceptReviewResult: false,
      currentStepMayReadReviewResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayReadRecordingResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayRecordHashInputs: false,
      currentStepMayReadPrivateApprovalPacket: false,
      currentStepMayImportApprovalPacket: false,
      currentStepMayImplementImportService: false,
      currentStepMayAuthorizeProviderCalls: false,
      nextAllowedAction:
        "after the owner supplies a redacted approval import review recording-result review result outside repo commits, record a separate hash-only review-result boundary without importing approval evidence",
      reviewResultSupplyGates,
      forbiddenReviewResultSupplyContent,
    },
    checks,
    evidence: {
      missingReviewResultSupplyGates,
      missingForbiddenReviewResultSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      reviewPreflightStatus: statusOf(reviewPreflight),
      recordingResultContractStatus: statusOf(recordingResultContract),
      recordingResultSupplyGateStatus: statusOf(recordingResultSupplyGate),
      approvalImportImplementationPreflightStatus: statusOf(approvalImportImplementationPreflight),
      providerCallAuthorizationPreflightStatus: statusOf(providerCallAuthorizationPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultSupply
        ? "read_only_approval_import_review_result_recording_result_review_result_supply_gate_ready_import_still_blocked_pending_owner_review_result"
        : "blocked_before_read_only_approval_import_review_result_recording_result_review_result_supply_gate",
      readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultSupply,
      readyForFutureReadOnlyApprovalImportImplementationReview: false,
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultSuppliedNow: false,
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultReadNow: false,
      ownerRedactedApprovalImportReviewResultRecordingResultReviewResultRecordedNow: false,
      currentStepReadsReviewResult: false,
      currentStepReadsRecordingResult: false,
      currentStepRecordsReviewResult: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
      currentStepRecordsHashInputs: false,
      ownerPacketReadAllowedNow: false,
      approvalPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_redacted_approval_import_review_result",
        "owner_redacted_approval_import_review_recording_result",
        "owner_redacted_approval_import_review_recording_result_review",
        "owner_redacted_approval_import_review_recording_result_review_result",
        "owner_explicit_local_redacted_approval_packet_path",
      ],
      blockers: [
        ...(checks.reviewPreflightReady
          ? []
          : ["read_only_approval_import_review_result_recording_result_review_preflight_not_ready"]),
        ...(checks.recordingResultContractReady
          ? []
          : ["read_only_approval_import_review_result_recording_result_contract_not_ready"]),
        ...(checks.recordingResultSupplyGateReady
          ? []
          : ["read_only_approval_import_review_result_recording_result_supply_gate_not_ready"]),
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_preflight_no_longer_blocked"]),
        ...(checks.providerCallAuthorizationStillBlocked
          ? []
          : ["read_only_provider_call_authorization_preflight_no_longer_blocked"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingReviewResultSupplyGates.map((gate) => `missing_review_result_supply_gate_${gate}`),
        ...missingForbiddenReviewResultSupplyContent.map(
          (content) => `missing_forbidden_review_result_supply_content_${content}`,
        ),
        ...(checks.architectureDocMentionsReviewResultSupplyGate
          ? []
          : ["architecture_doc_missing_read_only_approval_import_review_result_recording_result_review_result_supply_gate"]),
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
    console.log(
      "[generate-trading-read-only-approval-import-review-result-recording-result-review-result-supply-gate-contract] ok",
    );
    console.log(
      `[generate-trading-read-only-approval-import-review-result-recording-result-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-read-only-approval-import-review-result-recording-result-review-result-supply-gate-contract] wrote contract",
  );
  console.log(
    `[generate-trading-read-only-approval-import-review-result-recording-result-review-result-supply-gate-contract] readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultSupply=${parsed.readiness.readyForReadOnlyApprovalImportReviewResultRecordingResultReviewResultSupply}`,
  );
}

main();
