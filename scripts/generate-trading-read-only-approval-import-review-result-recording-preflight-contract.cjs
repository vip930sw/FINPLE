const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_recording_preflight_contract.json",
);
const IMPORT_REVIEW_RESULT_SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_result_supply_gate_contract.json",
);
const IMPORT_REVIEW_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_import_review_preflight_contract.json",
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

const CONTRACT_VERSION = "trading-lab-step116-read-only-approval-import-review-result-recording-preflight-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_RECORDING_PREFLIGHT_GATES = [
  "read_only_approval_import_review_result_supply_gate_ready",
  "read_only_approval_import_review_preflight_ready",
  "owner_redacted_approval_import_review_result_required_later",
  "current_step_does_not_accept_import_review_result",
  "current_step_does_not_read_import_review_result",
  "current_step_does_not_record_import_review_result",
  "current_step_does_not_record_private_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_read_private_approval_packet",
  "current_step_does_not_import_approval_packet",
  "approval_import_implementation_preflight_still_blocked",
  "provider_call_authorization_preflight_still_blocked",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
  "hash_only_review_result_required_later",
];
const FORBIDDEN_RECORDING_PREFLIGHT_CONTENT = [
  "actual_owner_local_approval_packet_path",
  "actual_owner_local_import_review_result_path",
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
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval_import_review_result.redacted.json"),
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
  const importReviewResultSupplyGate = readJson(IMPORT_REVIEW_RESULT_SUPPLY_GATE_PATH);
  const importReviewPreflight = readJson(IMPORT_REVIEW_PREFLIGHT_PATH);
  const approvalImportImplementationPreflight = readJson(APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const providerCallAuthorizationPreflight = readJson(PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const recordingPreflightGates = [...REQUIRED_RECORDING_PREFLIGHT_GATES];
  const forbiddenRecordingPreflightContent = [...FORBIDDEN_RECORDING_PREFLIGHT_CONTENT];
  const missingRecordingPreflightGates = missingValues(recordingPreflightGates, REQUIRED_RECORDING_PREFLIGHT_GATES);
  const missingForbiddenRecordingPreflightContent = missingValues(
    forbiddenRecordingPreflightContent,
    FORBIDDEN_RECORDING_PREFLIGHT_CONTENT,
  );
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    recordingPreflightOnly: true,
    importReviewResultSupplyGateReady:
      importReviewResultSupplyGate.readiness?.readyForReadOnlyApprovalImportReviewResultSupply === true &&
      importReviewResultSupplyGate.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      importReviewResultSupplyGate.readiness?.ownerRedactedApprovalImportReviewResultSuppliedNow === false &&
      importReviewResultSupplyGate.readiness?.currentStepReadsImportReviewResult === false &&
      importReviewResultSupplyGate.readiness?.currentStepRecordsImportReviewResult === false &&
      importReviewResultSupplyGate.readiness?.ownerPacketReadAllowedNow === false &&
      importReviewResultSupplyGate.readiness?.approvalPacketImportedNow === false &&
      importReviewResultSupplyGate.readiness?.importImplementationAllowedNow === false &&
      importReviewResultSupplyGate.readiness?.providerCallsAllowed === false,
    importReviewPreflightStillBlocked:
      importReviewPreflight.readiness?.readyForReadOnlyApprovalImportReviewPreflight === true &&
      importReviewPreflight.readiness?.currentStepReadsReviewResult === false &&
      importReviewPreflight.readiness?.currentStepRecordsReviewResult === false &&
      importReviewPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importReviewPreflight.readiness?.approvalPacketImportedNow === false &&
      importReviewPreflight.readiness?.providerCallsAllowed === false,
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
    recordingPreflightGatesReady: missingRecordingPreflightGates.length === 0,
    forbiddenRecordingPreflightContentReady: missingForbiddenRecordingPreflightContent.length === 0,
    architectureDocMentionsRecordingPreflight:
      architectureDoc.includes("Trading Read-Only Approval Import Review Result Recording Preflight") &&
      architectureDoc.includes("read_only_approval_import_review_result_recording_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedApprovalImportReviewResultAcceptedNow: false,
    ownerRedactedApprovalImportReviewResultReadNow: false,
    ownerRedactedApprovalImportReviewResultRecordedNow: false,
    currentStepRecordsPrivatePath: false,
    currentStepRecordsRawValues: false,
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
  const readyForReadOnlyApprovalImportReviewResultRecordingPreflight =
    checks.importReviewResultSupplyGateReady &&
    checks.importReviewPreflightStillBlocked &&
    checks.approvalImportImplementationStillBlocked &&
    checks.providerCallAuthorizationStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.recordingPreflightGatesReady &&
    checks.forbiddenRecordingPreflightContentReady &&
    checks.architectureDocMentionsRecordingPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5Q-M",
    scope: "read_only_approval_import_review_result_recording_preflight",
    sourceFiles: {
      readOnlyApprovalImportReviewResultSupplyGate: IMPORT_REVIEW_RESULT_SUPPLY_GATE_PATH,
      readOnlyApprovalImportReviewPreflight: IMPORT_REVIEW_PREFLIGHT_PATH,
      readOnlyApprovalImportImplementationPreflight: APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      readOnlyProviderCallAuthorizationPreflight: PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      recordingPreflightOnly: true,
      ownerRedactedApprovalImportReviewResultAcceptedNow: false,
      ownerRedactedApprovalImportReviewResultReadNow: false,
      ownerRedactedApprovalImportReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
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
    importReviewResultRecordingPreflight: {
      ownerRedactedApprovalImportReviewResultRequiredLater: true,
      currentStepMayAcceptImportReviewResult: false,
      currentStepMayReadImportReviewResult: false,
      currentStepMayRecordImportReviewResult: false,
      currentStepMayRecordPrivatePath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayReadPrivateApprovalPacket: false,
      currentStepMayImportApprovalPacket: false,
      currentStepMayImplementImportService: false,
      currentStepMayAuthorizeProviderCalls: false,
      nextAllowedAction:
        "after the owner supplies a redacted approval import review result outside repo commits, record a separate hash-only import review result recording result boundary",
      recordingPreflightGates,
      forbiddenRecordingPreflightContent,
      futureRecordingRules: [
        "owner_supplied_redacted_import_review_result_only",
        "no_private_path_or_raw_value_in_repo",
        "hash_only_evidence",
        "recording_result_must_not_open_approval_import",
        "recording_result_must_not_open_provider_calls",
        "recording_result_must_not_open_order_submission",
        "recording_result_must_not_create_routes_ui_or_db",
      ],
    },
    checks,
    evidence: {
      missingRecordingPreflightGates,
      missingForbiddenRecordingPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      importReviewResultSupplyGateStatus: statusOf(importReviewResultSupplyGate),
      importReviewPreflightStatus: statusOf(importReviewPreflight),
      approvalImportImplementationPreflightStatus: statusOf(approvalImportImplementationPreflight),
      providerCallAuthorizationPreflightStatus: statusOf(providerCallAuthorizationPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForReadOnlyApprovalImportReviewResultRecordingPreflight
        ? "read_only_approval_import_review_result_recording_preflight_ready_import_still_blocked_pending_owner_result"
        : "blocked_before_read_only_approval_import_review_result_recording_preflight",
      readyForReadOnlyApprovalImportReviewResultRecordingPreflight,
      readyForFutureReadOnlyApprovalImportImplementationReview: false,
      ownerRedactedApprovalImportReviewResultAcceptedNow: false,
      ownerRedactedApprovalImportReviewResultReadNow: false,
      ownerRedactedApprovalImportReviewResultRecordedNow: false,
      currentStepRecordsPrivatePath: false,
      currentStepRecordsRawValues: false,
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
        "owner_explicit_local_redacted_approval_packet_path",
      ],
      blockers: [
        ...(checks.importReviewResultSupplyGateReady
          ? []
          : ["read_only_approval_import_review_result_supply_gate_not_ready"]),
        ...(checks.importReviewPreflightStillBlocked
          ? []
          : ["read_only_approval_import_review_preflight_not_fail_closed"]),
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_preflight_no_longer_blocked"]),
        ...(checks.providerCallAuthorizationStillBlocked
          ? []
          : ["read_only_provider_call_authorization_preflight_no_longer_blocked"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingRecordingPreflightGates.map((gate) => `missing_recording_preflight_gate_${gate}`),
        ...missingForbiddenRecordingPreflightContent.map(
          (content) => `missing_forbidden_recording_preflight_content_${content}`,
        ),
        ...(checks.architectureDocMentionsRecordingPreflight
          ? []
          : ["architecture_doc_missing_read_only_approval_import_review_result_recording_preflight"]),
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
    console.log("[generate-trading-read-only-approval-import-review-result-recording-preflight-contract] ok");
    console.log(
      `[generate-trading-read-only-approval-import-review-result-recording-preflight-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-read-only-approval-import-review-result-recording-preflight-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-approval-import-review-result-recording-preflight-contract] readyForReadOnlyApprovalImportReviewResultRecordingPreflight=${parsed.readiness.readyForReadOnlyApprovalImportReviewResultRecordingPreflight}`,
  );
}

main();
