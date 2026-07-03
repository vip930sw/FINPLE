const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_review_result_supply_gate_contract.json",
);
const REVIEW_RESULT_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
);
const OWNER_EVIDENCE_RECORDING_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_contract.json",
);
const CALL_AUTHORIZATION_PREFLIGHT_PATH = path.join(
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
  "trading-lab-step116-read-only-provider-call-authorization-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";
const REQUIRED_SUPPLY_GATES = [
  "read_only_provider_call_authorization_review_result_contract_ready",
  "owner_evidence_receipt_review_result_recording_result_ready_fail_closed",
  "owner_redacted_provider_call_authorization_review_result_required_later",
  "current_step_does_not_read_owner_result",
  "current_step_does_not_record_owner_result",
  "current_step_does_not_import_private_evidence",
  "current_step_does_not_authorize_provider_calls",
  "current_step_does_not_create_provider_requests",
  "current_step_does_not_create_provider_adapter",
  "current_step_does_not_create_runtime_route",
  "current_step_does_not_create_public_ui",
  "current_step_does_not_write_db",
  "progress_summary_still_fail_closed",
];
const FORBIDDEN_SUPPLY_CONTENT = [
  "actual_owner_local_file_path",
  "actual_private_packet_path",
  "actual_receipt_path",
  "raw_value",
  "hash_value",
  "credential",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_provider_payload",
  "raw_response_payload",
  "raw_order_payload",
  "provider_request_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_provider_call_authorization_review_result.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
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
  const reviewResult = readJson(REVIEW_RESULT_CONTRACT_PATH);
  const ownerEvidenceRecordingResult = readJson(OWNER_EVIDENCE_RECORDING_RESULT_PATH);
  const callAuthorizationPreflight = readJson(CALL_AUTHORIZATION_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const supplyGates = [...REQUIRED_SUPPLY_GATES];
  const forbiddenSupplyContent = [...FORBIDDEN_SUPPLY_CONTENT];
  const missingSupplyGates = missingValues(supplyGates, REQUIRED_SUPPLY_GATES);
  const missingForbiddenSupplyContent = missingValues(forbiddenSupplyContent, FORBIDDEN_SUPPLY_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    supplyGateOnly: true,
    reviewResultContractReady:
      reviewResult.readiness?.readyForFutureReadOnlyProviderCallAuthorizationReviewResult === true &&
      reviewResult.readiness?.providerCallAuthorizationAllowedNow === false &&
      reviewResult.readiness?.providerCallsAllowed === false &&
      reviewResult.readiness?.orderSubmissionAllowed === false &&
      reviewResult.readiness?.runtimeRouteAllowed === false &&
      reviewResult.readiness?.publicUiAllowed === false &&
      reviewResult.readiness?.dbMigrationAllowed === false,
    ownerEvidenceRecordingResultReadyFailClosed:
      ownerEvidenceRecordingResult.readiness?.status ===
        "owner_evidence_receipt_review_result_recording_result_ready_fail_closed_pending_owner_result" &&
      ownerEvidenceRecordingResult.currentState?.ownerEvidenceReceiptReviewResultRecorded === false &&
      ownerEvidenceRecordingResult.currentState?.actualPrivateEvidenceImported === false &&
      ownerEvidenceRecordingResult.readiness?.providerCallsAllowed === false &&
      ownerEvidenceRecordingResult.readiness?.orderSubmissionAllowed === false,
    callAuthorizationPreflightStillBlocked:
      callAuthorizationPreflight.readiness?.readyForFutureReadOnlyProviderCallAuthorizationReview === false &&
      callAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      callAuthorizationPreflight.readiness?.providerCallsAllowed === false &&
      callAuthorizationPreflight.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.publicUiAllowed === false &&
      progressSummary.readiness?.dbMigrationAllowed === false,
    supplyGatesReady: missingSupplyGates.length === 0,
    forbiddenSupplyContentReady: missingForbiddenSupplyContent.length === 0,
    architectureDocMentionsSupplyGate:
      architectureDoc.includes("Trading Read-Only Provider Call Authorization Review Result Supply Gate") &&
      architectureDoc.includes("read_only_provider_call_authorization_review_result_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedProviderCallAuthorizationReviewResultSuppliedNow: false,
    currentStepReadsOwnerResult: false,
    currentStepRecordsOwnerResult: false,
    currentStepImportsPrivateEvidence: false,
    currentStepAuthorizesProviderCalls: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForReadOnlyProviderCallAuthorizationReviewResultSupply =
    checks.reviewResultContractReady &&
    checks.ownerEvidenceRecordingResultReadyFailClosed &&
    checks.callAuthorizationPreflightStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.supplyGatesReady &&
    checks.forbiddenSupplyContentReady &&
    checks.architectureDocMentionsSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 read-only provider call authorization review result supply gate",
    scope: "read_only_provider_call_authorization_review_result_supply_gate",
    sourceFiles: {
      readOnlyProviderCallAuthorizationReviewResult: REVIEW_RESULT_CONTRACT_PATH,
      ownerEvidenceReceiptReviewResultRecordingResult: OWNER_EVIDENCE_RECORDING_RESULT_PATH,
      readOnlyProviderCallAuthorizationPreflight: CALL_AUTHORIZATION_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      supplyGateOnly: true,
      ownerRedactedProviderCallAuthorizationReviewResultSuppliedNow: false,
      currentStepReadsOwnerResult: false,
      currentStepRecordsOwnerResult: false,
      currentStepImportsPrivateEvidence: false,
      currentStepAuthorizesProviderCalls: false,
      currentStepCreatesProviderRequest: false,
      currentStepCreatesProviderAdapter: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepCreatesPublicUi: false,
      currentStepWritesDb: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    reviewResultSupplyGate: {
      ownerRedactedProviderCallAuthorizationReviewResultRequiredLater: true,
      currentStepMayReadOwnerResult: false,
      currentStepMayRecordOwnerResult: false,
      currentStepMayImportPrivateEvidence: false,
      currentStepMayAuthorizeProviderCalls: false,
      currentStepMayCreateProviderRequest: false,
      currentStepMayCreateProviderAdapter: false,
      currentStepMayCreateRuntimeRoute: false,
      currentStepMayCreatePublicUi: false,
      currentStepMayWriteDb: false,
      nextAllowedAction:
        "after the owner supplies a redacted provider-call authorization review result outside repo commits, record a separate authorization review-result recording preflight without provider calls",
      supplyGates,
      forbiddenSupplyContent,
    },
    checks,
    evidence: {
      missingSupplyGates,
      missingForbiddenSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      reviewResultStatus: statusOf(reviewResult),
      ownerEvidenceRecordingResultStatus: statusOf(ownerEvidenceRecordingResult),
      callAuthorizationPreflightStatus: statusOf(callAuthorizationPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForReadOnlyProviderCallAuthorizationReviewResultSupply
        ? "read_only_provider_call_authorization_review_result_supply_gate_ready_pending_owner_review_result"
        : "blocked_before_read_only_provider_call_authorization_review_result_supply_gate",
      readyForReadOnlyProviderCallAuthorizationReviewResultSupply,
      readyForReadOnlyProviderCallAuthorizationReviewResultRecordingPreflight: false,
      ownerRedactedProviderCallAuthorizationReviewResultSuppliedNow: false,
      currentStepReadsOwnerResult: false,
      currentStepRecordsOwnerResult: false,
      currentStepImportsPrivateEvidence: false,
      providerCallAuthorizationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: ["owner_redacted_provider_call_authorization_review_result"],
      blockers: [
        ...(checks.reviewResultContractReady ? [] : ["read_only_provider_call_authorization_review_result_not_ready"]),
        ...(checks.ownerEvidenceRecordingResultReadyFailClosed
          ? []
          : ["owner_evidence_receipt_review_result_recording_result_not_fail_closed"]),
        ...(checks.callAuthorizationPreflightStillBlocked
          ? []
          : ["read_only_provider_call_authorization_preflight_no_longer_blocked"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingSupplyGates.map((gate) => `missing_supply_gate_${gate}`),
        ...missingForbiddenSupplyContent.map((content) => `missing_forbidden_supply_content_${content}`),
        ...(checks.architectureDocMentionsSupplyGate
          ? []
          : ["architecture_doc_missing_read_only_provider_call_authorization_review_result_supply_gate"]),
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
    console.log("[generate-trading-read-only-provider-call-authorization-review-result-supply-gate-contract] ok");
    console.log(
      `[generate-trading-read-only-provider-call-authorization-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log("[generate-trading-read-only-provider-call-authorization-review-result-supply-gate-contract] wrote contract");
  console.log(
    `[generate-trading-read-only-provider-call-authorization-review-result-supply-gate-contract] readyForReadOnlyProviderCallAuthorizationReviewResultSupply=${parsed.readiness.readyForReadOnlyProviderCallAuthorizationReviewResultSupply}`,
  );
}

main();
