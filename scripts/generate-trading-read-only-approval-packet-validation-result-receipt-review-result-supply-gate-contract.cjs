const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_supply_gate_contract.json",
);
const REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_contract.json",
);
const REVIEW_RESULT_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures.json",
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
  "trading-lab-step116-read-only-approval-packet-validation-result-receipt-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-02T00:00:00Z";
const REQUIRED_SUPPLY_GATES = [
  "approval_validation_receipt_review_result_contract_ready",
  "approval_validation_receipt_review_result_validator_fixtures_ready",
  "owner_redacted_approval_validation_receipt_review_result_required_later",
  "current_step_does_not_read_validation_receipt",
  "current_step_does_not_read_review_result",
  "current_step_does_not_record_review_result",
  "current_step_does_not_record_receipt_path",
  "current_step_does_not_record_raw_values",
  "current_step_does_not_import_approval_packet",
  "approval_import_implementation_preflight_still_blocked",
  "provider_call_authorization_preflight_still_blocked",
  "progress_summary_still_fail_closed",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_SUPPLY_CONTENT = [
  "actual_owner_local_approval_packet_path",
  "actual_owner_local_validation_receipt_path",
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
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "read_only_approval_validation_result_receipt.redacted.json"),
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
  const reviewResult = readJson(REVIEW_RESULT_PATH);
  const reviewResultValidatorFixtures = readJson(REVIEW_RESULT_VALIDATOR_FIXTURES_PATH);
  const approvalImportImplementationPreflight = readJson(APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const providerCallAuthorizationPreflight = readJson(PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH);
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
    reviewResultReady:
      reviewResult.readiness?.readyForFutureReadOnlyApprovalValidationResultReceiptReviewResult === true &&
      reviewResult.readiness?.validationReceiptReviewRecordedNow === false &&
      reviewResult.readiness?.validationReceiptReadAllowedNow === false &&
      reviewResult.readiness?.receiptPathRecorded === false &&
      reviewResult.readiness?.rawValuesRecorded === false &&
      reviewResult.readiness?.approvalPayloadRecorded === false &&
      reviewResult.readiness?.providerCallsAllowed === false,
    reviewResultValidatorFixturesReady:
      reviewResultValidatorFixtures.readiness?.readyForReadOnlyApprovalReviewResultValidatorFixtureRegression === true &&
      reviewResultValidatorFixtures.readiness?.currentStepReadsReceipt === false &&
      reviewResultValidatorFixtures.readiness?.currentStepRecordsReviewResult === false &&
      reviewResultValidatorFixtures.readiness?.approvalPayloadRecorded === false &&
      reviewResultValidatorFixtures.readiness?.providerCallsAllowed === false,
    approvalImportImplementationStillBlocked:
      approvalImportImplementationPreflight.readiness?.readyForFutureReadOnlyApprovalImportImplementationReview === false &&
      approvalImportImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      approvalImportImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      approvalImportImplementationPreflight.readiness?.approvalPacketImportedNow === false &&
      approvalImportImplementationPreflight.readiness?.providerCallsAllowed === false,
    providerCallAuthorizationStillBlocked:
      providerCallAuthorizationPreflight.readiness?.readyForFutureReadOnlyProviderCallAuthorizationReview === false &&
      providerCallAuthorizationPreflight.readiness?.providerCallAuthorizationAllowedNow === false &&
      providerCallAuthorizationPreflight.readiness?.providerCallsAllowed === false &&
      providerCallAuthorizationPreflight.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.providerCallsAllowed === false &&
      progressSummary.readiness?.readyForOrderSubmission === false,
    supplyGatesReady: missingSupplyGates.length === 0,
    forbiddenSupplyContentReady: missingForbiddenSupplyContent.length === 0,
    architectureDocMentionsSupplyGate:
      architectureDoc.includes("Trading Read-Only Approval Packet Validation Result Receipt Review Result Supply Gate") &&
      architectureDoc.includes("read_only_approval_packet_validation_result_receipt_review_result_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerRedactedApprovalValidationReceiptReviewResultSuppliedNow: false,
    currentStepReadsValidationReceipt: false,
    currentStepReadsReviewResult: false,
    currentStepRecordsReviewResult: false,
    receiptPathRecorded: false,
    rawValuesRecorded: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForReadOnlyApprovalValidationReceiptReviewResultSupply =
    checks.reviewResultReady &&
    checks.reviewResultValidatorFixturesReady &&
    checks.approvalImportImplementationStillBlocked &&
    checks.providerCallAuthorizationStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.supplyGatesReady &&
    checks.forbiddenSupplyContentReady &&
    checks.architectureDocMentionsSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5Q-J",
    scope: "read_only_approval_packet_validation_result_receipt_review_result_supply_gate",
    sourceFiles: {
      validationReceiptReviewResult: REVIEW_RESULT_PATH,
      validationReceiptReviewResultValidatorFixtures: REVIEW_RESULT_VALIDATOR_FIXTURES_PATH,
      readOnlyApprovalImportImplementationPreflight: APPROVAL_IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      readOnlyProviderCallAuthorizationPreflight: PROVIDER_CALL_AUTHORIZATION_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      supplyGateOnly: true,
      ownerRedactedApprovalValidationReceiptReviewResultSuppliedNow: false,
      currentStepReadsValidationReceipt: false,
      currentStepReadsReviewResult: false,
      currentStepRecordsReviewResult: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    reviewResultSupplyGate: {
      ownerRedactedApprovalValidationReceiptReviewResultRequiredLater: true,
      currentStepMayReadValidationReceipt: false,
      currentStepMayReadReviewResult: false,
      currentStepMayRecordReviewResult: false,
      currentStepMayRecordReceiptPath: false,
      currentStepMayRecordRawValues: false,
      currentStepMayImportApprovalPacket: false,
      currentStepMayAuthorizeProviderCalls: false,
      nextAllowedAction:
        "after the owner supplies a redacted approval validation receipt review result outside repo commits, record a separate import review boundary without importing approval evidence",
      supplyGates,
      forbiddenSupplyContent,
    },
    checks,
    evidence: {
      missingSupplyGates,
      missingForbiddenSupplyContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      reviewResultStatus: statusOf(reviewResult),
      reviewResultValidatorFixturesStatus: statusOf(reviewResultValidatorFixtures),
      approvalImportImplementationPreflightStatus: statusOf(approvalImportImplementationPreflight),
      providerCallAuthorizationPreflightStatus: statusOf(providerCallAuthorizationPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForReadOnlyApprovalValidationReceiptReviewResultSupply
        ? "approval_validation_receipt_review_result_supply_gate_ready_pending_owner_review_result"
        : "blocked_before_read_only_approval_validation_receipt_review_result_supply_gate",
      readyForReadOnlyApprovalValidationReceiptReviewResultSupply,
      readyForReadOnlyApprovalImportReviewAfterReviewResult: false,
      ownerRedactedApprovalValidationReceiptReviewResultSuppliedNow: false,
      currentStepReadsValidationReceipt: false,
      currentStepReadsReviewResult: false,
      currentStepRecordsReviewResult: false,
      receiptPathRecorded: false,
      rawValuesRecorded: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: [
        "owner_explicit_local_redacted_approval_packet_path",
        "owner_local_approval_validation_execution_result",
        "owner_explicit_local_redacted_validation_receipt_path",
        "owner_redacted_approval_validation_receipt_review_result",
      ],
      blockers: [
        ...(checks.reviewResultReady ? [] : ["approval_validation_receipt_review_result_not_ready"]),
        ...(checks.reviewResultValidatorFixturesReady
          ? []
          : ["approval_validation_receipt_review_result_validator_fixtures_not_ready"]),
        ...(checks.approvalImportImplementationStillBlocked
          ? []
          : ["read_only_approval_import_implementation_preflight_no_longer_blocked"]),
        ...(checks.providerCallAuthorizationStillBlocked
          ? []
          : ["read_only_provider_call_authorization_preflight_no_longer_blocked"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingSupplyGates.map((gate) => `missing_supply_gate_${gate}`),
        ...missingForbiddenSupplyContent.map((content) => `missing_forbidden_supply_content_${content}`),
        ...(checks.architectureDocMentionsSupplyGate
          ? []
          : ["architecture_doc_missing_read_only_approval_validation_receipt_review_result_supply_gate"]),
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
    console.log("[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-supply-gate-contract] ok");
    console.log(
      `[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-supply-gate-contract] wrote contract",
  );
  console.log(
    `[generate-trading-read-only-approval-packet-validation-result-receipt-review-result-supply-gate-contract] readyForReadOnlyApprovalValidationReceiptReviewResultSupply=${parsed.readiness.readyForReadOnlyApprovalValidationReceiptReviewResultSupply}`,
  );
}

main();
