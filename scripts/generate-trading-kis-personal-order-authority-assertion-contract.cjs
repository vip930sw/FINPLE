const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_personal_order_authority_assertion_contract.json",
);
const OWNER_ORDER_PATH_ASSERTION_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_order_path_assertion_contract.json",
);
const KIS_ORDER_ADAPTER_DESIGN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_order_adapter_design_review.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
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
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-kis-personal-order-authority-assertion-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const OWNER_ASSERTED_AT = "2026-07-01T16:25:00+09:00";
const OWNER_ASSERTION_SUMMARY =
  "owner stated that KIS explicitly allows personal-account trading, so order-submission authority should not remain an external-permission blocker";

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
  const ownerOrderPathAssertion = readJson(OWNER_ORDER_PATH_ASSERTION_PATH);
  const kisOrderAdapterDesign = readJson(KIS_ORDER_ADAPTER_DESIGN_PATH);
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const killSwitchClearance = readJson(KILL_SWITCH_CLEARANCE_PATH);
  const riskGateClearance = readJson(RISK_GATE_CLEARANCE_PATH);
  const envRiskGate = readJson(ENV_RISK_GATE_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    kisPersonalOrderAuthorityAssertionRecorded: true,
    authorityAssertionIsOperationalOrderApproval: false,
    ownerOrderPathAssertionRecordedWithOrdersBlocked:
      ownerOrderPathAssertion.readiness?.assertionRecordedWithOrdersBlocked === true &&
      ownerOrderPathAssertion.readiness?.orderSubmissionAllowed === false,
    kisOrderAdapterDesignStillReviewOnly:
      kisOrderAdapterDesign.currentState?.designReviewOnly === true &&
      kisOrderAdapterDesign.readiness?.readyForFutureOrderAdapterImplementationReview === true &&
      kisOrderAdapterDesign.readiness?.adapterImplementationAllowed === false &&
      kisOrderAdapterDesign.readiness?.orderSubmissionAllowed === false,
    manualOrderPermissionPreflightReady:
      manualOrderPermissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false,
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
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    architectureDocMentionsKisPersonalOrderAuthority:
      architectureDoc.includes("Trading KIS Personal Order Authority Assertion") &&
      architectureDoc.includes("trading_lab_step116_kis_personal_order_authority_assertion_contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const authorityRecordedWithOrdersBlocked =
    checks.kisPersonalOrderAuthorityAssertionRecorded &&
    checks.authorityAssertionIsOperationalOrderApproval === false &&
    checks.ownerOrderPathAssertionRecordedWithOrdersBlocked &&
    checks.kisOrderAdapterDesignStillReviewOnly &&
    checks.manualOrderPermissionPreflightReady &&
    checks.liveGuardedOrderAdapterStillBlocked &&
    checks.killSwitchClearanceStillRequiresImplementationReview &&
    checks.riskGateClearanceStillRequiresImplementationReview &&
    checks.envRiskGateFailClosed &&
    checks.progressSummaryStillFailClosed &&
    checks.architectureDocMentionsKisPersonalOrderAuthority &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5T",
    scope: "kis_personal_order_authority_assertion",
    sourceFiles: {
      ownerOrderPathAssertion: OWNER_ORDER_PATH_ASSERTION_PATH,
      kisOrderAdapterDesignReview: KIS_ORDER_ADAPTER_DESIGN_PATH,
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_PATH,
      envRiskGateContract: ENV_RISK_GATE_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      kisPersonalOrderAuthorityAssertionRecordedNow: true,
      authorityAssertionIsOperationalOrderApproval: false,
      manualOrderPermissionImportedNow: false,
      orderAdapterImplementedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    kisPersonalOrderAuthorityAssertion: {
      assertedAt: OWNER_ASSERTED_AT,
      assertionSummary: OWNER_ASSERTION_SUMMARY,
      interpretation:
        "remove KIS personal-account order authority as an external blocker, while keeping FINPLE operational submission gates closed",
      acceptedBoundaries: [
        "kis_personal_account_order_authority_not_external_blocker",
        "authority_assertion_does_not_submit_orders",
        "authority_assertion_does_not_call_kis",
        "authority_assertion_does_not_create_order_adapter",
        "authority_assertion_does_not_create_runtime_route",
        "authority_assertion_does_not_override_kill_switch",
        "authority_assertion_does_not_override_risk_gate",
        "authority_assertion_does_not_replace_manual_order_permission_packet",
      ],
      nextEligibleWork: [
        "manual_order_permission_packet_preparation",
        "kill_switch_clearance_review",
        "risk_gate_clearance_review",
        "dry_run_replay_execution_contract",
        "shadow_history_review_result_contract",
        "live_guarded_order_adapter_implementation_review_after_clearance",
      ],
    },
    checks,
    evidence: {
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerOrderPathAssertionStatus: statusOf(ownerOrderPathAssertion),
      kisOrderAdapterDesignStatus: statusOf(kisOrderAdapterDesign),
      manualOrderPermissionPreflightStatus: statusOf(manualOrderPermissionPreflight),
      liveGuardedOrderAdapterPreflightStatus: statusOf(liveGuardedOrderAdapterPreflight),
      killSwitchClearanceStatus: statusOf(killSwitchClearance),
      riskGateClearanceStatus: statusOf(riskGateClearance),
      envRiskGateStatus: statusOf(envRiskGate),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: authorityRecordedWithOrdersBlocked
        ? "kis_personal_order_authority_recorded_orders_still_blocked"
        : "kis_personal_order_authority_assertion_blocked",
      authorityRecordedWithOrdersBlocked,
      kisPersonalOrderAuthorityAssertionRecordedNow: true,
      authorityAssertionIsOperationalOrderApproval: false,
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
        ...(checks.kisOrderAdapterDesignStillReviewOnly ? [] : ["kis_order_adapter_design_not_review_only"]),
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.liveGuardedOrderAdapterStillBlocked ? [] : ["live_guarded_order_adapter_no_longer_blocked"]),
        ...(checks.killSwitchClearanceStillRequiresImplementationReview
          ? []
          : ["kill_switch_clearance_no_longer_requires_review"]),
        ...(checks.riskGateClearanceStillRequiresImplementationReview
          ? []
          : ["risk_gate_clearance_no_longer_requires_review"]),
        ...(checks.envRiskGateFailClosed ? [] : ["env_risk_gate_no_longer_fail_closed"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...(checks.architectureDocMentionsKisPersonalOrderAuthority
          ? []
          : ["architecture_doc_missing_kis_personal_order_authority"]),
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
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-kis-personal-order-authority-assertion-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-kis-personal-order-authority-assertion-contract.cjs`,
      );
    }
    console.log("[generate-trading-kis-personal-order-authority-assertion-contract] ok");
    console.log(`[generate-trading-kis-personal-order-authority-assertion-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-kis-personal-order-authority-assertion-contract] wrote contract");
  console.log(
    `[generate-trading-kis-personal-order-authority-assertion-contract] authorityRecordedWithOrdersBlocked=${parsed.readiness.authorityRecordedWithOrdersBlocked}`,
  );
}

main();
