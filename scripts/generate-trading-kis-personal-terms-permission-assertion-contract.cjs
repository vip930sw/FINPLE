const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json",
);
const OWNER_ORDER_PATH_ASSERTION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_order_path_assertion_contract.json",
);
const KIS_PERSONAL_ORDER_AUTHORITY_ASSERTION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_personal_order_authority_assertion_contract.json",
);
const INTERNAL_GATE_SEQUENCE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
);
const LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-kis-personal-terms-permission-assertion-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const OWNER_ASSERTED_AT = "2026-07-01T17:25:00+09:00";
const OWNER_ASSERTION_SUMMARY =
  "owner stated that personal-account trading does not violate KIS terms and does not require a separate permit";
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

function statusOf(report) {
  return report.readiness?.status ?? report.status ?? null;
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const ownerOrderPathAssertion = readJson(OWNER_ORDER_PATH_ASSERTION_PATH);
  const kisPersonalOrderAuthorityAssertion = readJson(KIS_PERSONAL_ORDER_AUTHORITY_ASSERTION_PATH);
  const internalGateSequence = readJson(INTERNAL_GATE_SEQUENCE_PATH);
  const liveGuardedAdapterPreflight = readJson(LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    ownerTermsPermissionAssertionRecorded: true,
    independentLegalDeterminationRecorded: false,
    assertionIsOperationalOrderApproval: false,
    ownerOrderPathAssertionRecordedWithOrdersBlocked:
      ownerOrderPathAssertion.readiness?.assertionRecordedWithOrdersBlocked === true &&
      ownerOrderPathAssertion.readiness?.orderSubmissionAllowed === false,
    kisPersonalOrderAuthorityRecordedWithOrdersBlocked:
      kisPersonalOrderAuthorityAssertion.readiness?.authorityRecordedWithOrdersBlocked === true &&
      kisPersonalOrderAuthorityAssertion.readiness?.orderSubmissionAllowed === false,
    internalGateSequenceStillFailClosed:
      internalGateSequence.readiness?.readyForSequentialInternalGateReview === true &&
      internalGateSequence.readiness?.ownerLocalManualPacketPreparationUnlocked === true &&
      internalGateSequence.readiness?.validationReceiptEvidenceRecorded === false &&
      internalGateSequence.readiness?.liveGuardedAdapterReviewStarted === false &&
      internalGateSequence.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterStillBlocked:
      liveGuardedAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    architectureDocMentionsKisTermsPermissionAssertion:
      architectureDoc.includes("Trading KIS Personal Terms Permission Assertion") &&
      architectureDoc.includes("trading_lab_step116_kis_personal_terms_permission_assertion_contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const termsPermissionExternalBlockerCleared =
    checks.ownerTermsPermissionAssertionRecorded &&
    checks.independentLegalDeterminationRecorded === false &&
    checks.assertionIsOperationalOrderApproval === false &&
    checks.ownerOrderPathAssertionRecordedWithOrdersBlocked &&
    checks.kisPersonalOrderAuthorityRecordedWithOrdersBlocked &&
    checks.internalGateSequenceStillFailClosed &&
    checks.liveGuardedAdapterStillBlocked &&
    checks.progressSummaryStillFailClosed &&
    checks.architectureDocMentionsKisTermsPermissionAssertion &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5X",
    scope: "kis_personal_terms_permission_assertion",
    sourceFiles: {
      ownerOrderPathAssertion: OWNER_ORDER_PATH_ASSERTION_PATH,
      kisPersonalOrderAuthorityAssertion: KIS_PERSONAL_ORDER_AUTHORITY_ASSERTION_PATH,
      liveGuardedInternalGateClearanceSequence: INTERNAL_GATE_SEQUENCE_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      ownerTermsPermissionAssertionRecordedNow: true,
      independentLegalDeterminationRecorded: false,
      assertionIsOperationalOrderApproval: false,
      manualOrderPermissionImportedNow: false,
      validationReceiptEvidenceRecorded: false,
      orderAdapterImplementedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    kisPersonalTermsPermissionAssertion: {
      assertedAt: OWNER_ASSERTED_AT,
      assertionSummary: OWNER_ASSERTION_SUMMARY,
      interpretation:
        "record the owner's KIS personal-account terms and permit statement as an external blocker clearance only, while keeping FINPLE internal operational gates closed",
      acceptedBoundaries: [
        "kis_personal_account_terms_not_external_blocker",
        "kis_personal_account_separate_permit_not_external_blocker",
        "terms_permission_assertion_is_owner_supplied",
        "terms_permission_assertion_is_not_independent_legal_advice",
        "terms_permission_assertion_does_not_submit_orders",
        "terms_permission_assertion_does_not_call_kis",
        "terms_permission_assertion_does_not_create_order_adapter",
        "terms_permission_assertion_does_not_create_runtime_route",
        "terms_permission_assertion_does_not_override_internal_gate_sequence",
      ],
      stillRequiredInternalGates: [
        "owner_local_manual_permission_packet",
        "validation_result_receipt",
        "kill_switch_clearance_review_result",
        "risk_gate_clearance_review_result",
        "dry_run_replay_execution_result",
        "shadow_history_review_result",
        "live_guarded_order_adapter_review",
      ],
    },
    checks,
    evidence: {
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerOrderPathAssertionStatus: statusOf(ownerOrderPathAssertion),
      kisPersonalOrderAuthorityAssertionStatus: statusOf(kisPersonalOrderAuthorityAssertion),
      internalGateSequenceStatus: statusOf(internalGateSequence),
      liveGuardedAdapterPreflightStatus: statusOf(liveGuardedAdapterPreflight),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: termsPermissionExternalBlockerCleared
        ? "kis_personal_terms_permission_assertion_recorded_orders_still_blocked"
        : "kis_personal_terms_permission_assertion_blocked",
      termsPermissionExternalBlockerCleared,
      ownerTermsPermissionAssertionRecordedNow: true,
      independentLegalDeterminationRecorded: false,
      assertionIsOperationalOrderApproval: false,
      orderAuthorityExternalBlockerCleared: true,
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
        ...(checks.ownerOrderPathAssertionRecordedWithOrdersBlocked
          ? []
          : ["owner_order_path_assertion_not_recorded_with_orders_blocked"]),
        ...(checks.kisPersonalOrderAuthorityRecordedWithOrdersBlocked
          ? []
          : ["kis_personal_order_authority_not_recorded_with_orders_blocked"]),
        ...(checks.internalGateSequenceStillFailClosed ? [] : ["internal_gate_sequence_no_longer_fail_closed"]),
        ...(checks.liveGuardedAdapterStillBlocked ? [] : ["live_guarded_adapter_no_longer_blocked"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...(checks.architectureDocMentionsKisTermsPermissionAssertion
          ? []
          : ["architecture_doc_missing_kis_personal_terms_permission_assertion"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "manual_order_permission_packet_not_imported",
        "validation_result_receipt_not_owner_supplied",
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-kis-personal-terms-permission-assertion-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-kis-personal-terms-permission-assertion-contract.cjs`);
    }
    console.log("[generate-trading-kis-personal-terms-permission-assertion-contract] ok");
    console.log(`[generate-trading-kis-personal-terms-permission-assertion-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-kis-personal-terms-permission-assertion-contract] wrote contract");
  console.log(
    `[generate-trading-kis-personal-terms-permission-assertion-contract] termsPermissionExternalBlockerCleared=${parsed.readiness.termsPermissionExternalBlockerCleared}`,
  );
}

main();
