const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
);
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const MANUAL_ORDER_PERMISSION_RECEIPT_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const RISK_GATE_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_risk_gate_clearance_contract.json",
);
const DRY_RUN_REPLAY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_dry_run_replay_contract.json",
);
const SHADOW_HISTORY_REVIEW_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_shadow_history_review_contract.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-live-guarded-clearance-review-result-bundle-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const FUTURE_RESULT_BUNDLE_PATH = path.join(
  "data",
  "private",
  "trading",
  "live_guarded_clearance_review_result_bundle.redacted.json",
);
const REQUIRED_REVIEW_RESULT_PARTS = [
  "manual_order_permission_packet_preparation_validation_receipt_review_result",
  "kill_switch_clearance_review_result",
  "risk_gate_clearance_review_result",
  "dry_run_replay_execution_result",
  "shadow_history_review_result",
];
const REQUIRED_REVIEW_RESULT_FIELDS = [
  "bundleReviewId",
  "reviewStatus",
  "reviewedAt",
  "reviewerHash",
  "manualPermissionReceiptReviewHash",
  "killSwitchClearanceReviewHash",
  "riskGateClearanceReviewHash",
  "dryRunReplayExecutionHash",
  "shadowHistoryReviewHash",
  "redactionVersion",
  "sourcePathsRecorded",
  "rawValuesRecorded",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
];
const REQUIRED_REVIEW_RESULT_ASSERTIONS = [
  "bundle_result_is_redacted_only",
  "bundle_result_records_hashes_not_paths",
  "manual_permission_receipt_review_is_present",
  "kill_switch_clearance_review_is_present",
  "risk_gate_clearance_review_is_present",
  "dry_run_replay_execution_result_is_present",
  "shadow_history_review_result_is_present",
  "bundle_result_does_not_import_manual_permission_packet",
  "bundle_result_does_not_enable_provider_calls",
  "bundle_result_does_not_enable_order_submission",
  "bundle_result_does_not_create_runtime_route",
  "bundle_result_does_not_create_public_ui",
  "bundle_result_does_not_write_database",
  "bundle_result_requires_separate_live_guarded_adapter_review",
];
const FORBIDDEN_BUNDLE_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "private_packet_path",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_RESULT_BUNDLE_PATH,
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const preflight = readJson(PREFLIGHT_PATH);
  const manualPermissionReceiptReviewResult = readJson(MANUAL_ORDER_PERMISSION_RECEIPT_REVIEW_RESULT_PATH);
  const killSwitchClearanceContract = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const dryRunReplayContract = readJson(DRY_RUN_REPLAY_CONTRACT_PATH);
  const shadowHistoryReviewContract = readJson(SHADOW_HISTORY_REVIEW_CONTRACT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewResultParts = [...REQUIRED_REVIEW_RESULT_PARTS];
  const reviewResultFields = [...REQUIRED_REVIEW_RESULT_FIELDS];
  const reviewResultAssertions = [...REQUIRED_REVIEW_RESULT_ASSERTIONS];
  const forbiddenBundleContent = [...FORBIDDEN_BUNDLE_CONTENT];
  const missingReviewResultParts = missingValues(reviewResultParts, REQUIRED_REVIEW_RESULT_PARTS);
  const missingReviewResultFields = missingValues(reviewResultFields, REQUIRED_REVIEW_RESULT_FIELDS);
  const missingReviewResultAssertions = missingValues(reviewResultAssertions, REQUIRED_REVIEW_RESULT_ASSERTIONS);
  const missingForbiddenBundleContent = missingValues(forbiddenBundleContent, FORBIDDEN_BUNDLE_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    bundleContractOnly: true,
    manualPermissionReceiptReviewResultReady:
      manualPermissionReceiptReviewResult.readiness
        ?.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult === true &&
      manualPermissionReceiptReviewResult.readiness?.permissionPacketImportedNow === false &&
      manualPermissionReceiptReviewResult.readiness?.providerCallsAllowed === false &&
      manualPermissionReceiptReviewResult.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearanceContract.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearanceContract.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearanceContract.readiness?.providerCallsAllowed === false &&
      killSwitchClearanceContract.readiness?.orderSubmissionAllowed === false,
    riskGateClearanceContractReady:
      riskGateClearanceContract.readiness?.readyForFutureRiskGateClearanceImplementationReview === true &&
      riskGateClearanceContract.readiness?.riskGateClearanceImplementationAllowed === false &&
      riskGateClearanceContract.readiness?.providerCallsAllowed === false &&
      riskGateClearanceContract.readiness?.orderSubmissionAllowed === false,
    dryRunReplayContractReady:
      dryRunReplayContract.readiness?.readyForFutureDryRunReplayImplementationReview === true &&
      dryRunReplayContract.readiness?.dryRunReplayImplementationAllowed === false &&
      dryRunReplayContract.readiness?.providerCallsAllowed === false &&
      dryRunReplayContract.readiness?.orderSubmissionAllowed === false,
    shadowHistoryReviewContractReady:
      shadowHistoryReviewContract.readiness?.readyForFutureShadowHistoryReviewImplementation === true &&
      shadowHistoryReviewContract.readiness?.shadowHistoryReviewImplementationAllowed === false &&
      shadowHistoryReviewContract.readiness?.providerCallsAllowed === false &&
      shadowHistoryReviewContract.readiness?.orderSubmissionAllowed === false,
    liveGuardedOrderAdapterReviewStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesRuntimeRoute: preflight.readiness?.runtimeRouteAllowed !== true,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    reviewResultPartsReady: missingReviewResultParts.length === 0,
    reviewResultFieldsReady: missingReviewResultFields.length === 0,
    reviewResultAssertionsReady: missingReviewResultAssertions.length === 0,
    forbiddenBundleContentReady: missingForbiddenBundleContent.length === 0,
    architectureDocMentionsLiveGuardedClearanceBundle:
      architectureDoc.includes("Trading Live-Guarded Clearance Review Result Bundle") &&
      architectureDoc.includes("live_guarded_clearance_review_result_bundle"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRecordsBundleResult: false,
    currentStepReadsPrivateEvidence: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureLiveGuardedClearanceReviewResultBundle =
    checks.manualPermissionReceiptReviewResultReady &&
    checks.killSwitchClearanceContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.dryRunReplayContractReady &&
    checks.shadowHistoryReviewContractReady &&
    checks.liveGuardedOrderAdapterReviewStillBlocked &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesRuntimeRoute &&
    checks.preflightStillDisablesDbMigration &&
    checks.reviewResultPartsReady &&
    checks.reviewResultFieldsReady &&
    checks.reviewResultAssertionsReady &&
    checks.forbiddenBundleContentReady &&
    checks.architectureDocMentionsLiveGuardedClearanceBundle &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5U",
    scope: "live_guarded_clearance_review_result_bundle",
    sourceFiles: {
      preflight: PREFLIGHT_PATH,
      manualOrderPermissionValidationResultReceiptReviewResult: MANUAL_ORDER_PERMISSION_RECEIPT_REVIEW_RESULT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      dryRunReplayContract: DRY_RUN_REPLAY_CONTRACT_PATH,
      shadowHistoryReviewContract: SHADOW_HISTORY_REVIEW_CONTRACT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      bundleContractOnly: true,
      currentStepRecordsBundleResult: false,
      currentStepReadsPrivateEvidence: false,
      currentStepRunsDryRunReplay: false,
      currentStepRunsShadowHistoryReview: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureBundleBoundary: {
      futureResultBundlePath: FUTURE_RESULT_BUNDLE_PATH,
      currentStepRecordsBundleResult: false,
      currentStepReadsPrivateEvidence: false,
      currentStepImportsManualPermissionPacket: false,
      requiredReviewResultParts: reviewResultParts,
      requiredReviewResultFields: reviewResultFields,
      requiredReviewResultAssertions: reviewResultAssertions,
      forbiddenBundleContent,
      sampleRedactedShape: {
        bundleReviewId: "live_guarded_clearance_bundle_<opaque_id>",
        reviewStatus: "blocked_pending_owner_supplied_results",
        reviewedAt: "2026-07-01T00:00:00Z",
        reviewerHash: "sha256:<reviewer_hash>",
        manualPermissionReceiptReviewHash: "sha256:<manual_permission_receipt_review_hash>",
        killSwitchClearanceReviewHash: "sha256:<kill_switch_clearance_review_hash>",
        riskGateClearanceReviewHash: "sha256:<risk_gate_clearance_review_hash>",
        dryRunReplayExecutionHash: "sha256:<dry_run_replay_execution_hash>",
        shadowHistoryReviewHash: "sha256:<shadow_history_review_hash>",
        redactionVersion: "v1",
        sourcePathsRecorded: false,
        rawValuesRecorded: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
        dbMigrationAllowed: false,
      },
      promotionRules: [
        "manual permission packet preparation and validation receipt review must remain hash-only",
        "kill-switch clearance review result cannot enable orders without risk-gate and replay evidence",
        "risk-gate clearance review result cannot override kill-switch or manual operator stop",
        "dry-run replay execution result must stay fixture/local until a separate runtime review",
        "shadow-history review result must stay redacted and cannot approve live order submission",
        "bundle success still requires a separate live-guarded order adapter implementation review",
      ],
    },
    checks,
    evidence: {
      missingReviewResultParts,
      missingReviewResultFields,
      missingReviewResultAssertions,
      missingForbiddenBundleContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualPermissionReceiptReviewResultStatus: manualPermissionReceiptReviewResult.readiness?.status,
      killSwitchClearanceStatus: killSwitchClearanceContract.readiness?.status,
      riskGateClearanceStatus: riskGateClearanceContract.readiness?.status,
      dryRunReplayStatus: dryRunReplayContract.readiness?.status,
      shadowHistoryReviewStatus: shadowHistoryReviewContract.readiness?.status,
      liveGuardedOrderAdapterPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureLiveGuardedClearanceReviewResultBundle
        ? "contract_ready_pending_owner_supplied_live_guarded_clearance_review_results"
        : "blocked_before_live_guarded_clearance_review_result_bundle",
      readyForFutureLiveGuardedClearanceReviewResultBundle,
      currentStepRecordsBundleResult: false,
      currentStepReadsPrivateEvidence: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.manualPermissionReceiptReviewResultReady ? [] : ["manual_permission_receipt_review_result_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.dryRunReplayContractReady ? [] : ["dry_run_replay_contract_not_ready"]),
        ...(checks.shadowHistoryReviewContractReady ? [] : ["shadow_history_review_contract_not_ready"]),
        ...(checks.liveGuardedOrderAdapterReviewStillBlocked ? [] : ["live_guarded_order_adapter_review_opened_too_early"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesRuntimeRoute ? [] : ["preflight_allows_runtime_route"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...missingReviewResultParts.map((part) => `missing_review_result_part_${part}`),
        ...missingReviewResultFields.map((field) => `missing_review_result_field_${field}`),
        ...missingReviewResultAssertions.map((assertion) => `missing_review_result_assertion_${assertion}`),
        ...missingForbiddenBundleContent.map((item) => `missing_forbidden_bundle_content_${item}`),
        ...(checks.architectureDocMentionsLiveGuardedClearanceBundle
          ? []
          : ["architecture_doc_missing_live_guarded_clearance_review_result_bundle"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-live-guarded-clearance-review-result-bundle-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-live-guarded-clearance-review-result-bundle-contract.cjs`);
    }
    console.log("[generate-trading-live-guarded-clearance-review-result-bundle-contract] ok");
    console.log(`[generate-trading-live-guarded-clearance-review-result-bundle-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-live-guarded-clearance-review-result-bundle-contract] wrote contract");
  console.log(
    `[generate-trading-live-guarded-clearance-review-result-bundle-contract] readyForFutureLiveGuardedClearanceReviewResultBundle=${parsed.readiness.readyForFutureLiveGuardedClearanceReviewResultBundle}`,
  );
}

main();
