const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_broker_contingency_review_contract.json",
);
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ALPHA_BOUNDARY_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_alpha_kr_market_boundary_contract.json",
);
const LAUNCH_READINESS_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_launch_readiness_plan_contract.json",
);
const ORDER_ADAPTER_DESIGN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_order_adapter_design_review.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-broker-contingency-review-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const REQUIRED_CANDIDATES = ["kis", "kiwoom_rest", "ls_open_api", "alpha_vantage", "krx_data_marketplace"];
const REQUIRED_DECISION_RULES = [
  "do_not_replace_kis_with_alpha_for_order_submission",
  "prefer_rest_or_https_broker_api_for_server_runtime",
  "require_mock_trading_or_testbed_before_private_shadow_review",
  "require_account_owner_credential_boundary_before_any_adapter_review",
  "require_terms_and_data_policy_review_before_market_data_write",
  "require_new_adapter_design_review_before_any_non_kis_runtime_work",
  "do_not_create_provider_adapter_or_runtime_route_from_this_contract",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "trading", "kiwoomOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "lsOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "alphaOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "brokerProviderAdapter.js"),
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

function buildCandidates() {
  return [
    {
      id: "kis",
      role: "primary_current_path",
      observedOfficialSurface:
        "KIS Developers exposes REST and Websocket Open API surfaces, API application flow, testbed, and partner process",
      canSupportOrderSubmissionInPrinciple: true,
      canReplaceCurrentEnvWithoutNewOwnerReview: false,
      serverRuntimeFit: "strong",
      currentDecision: "keep_primary_pending_reply",
      blockers: ["written_terms_reply_pending", "owner_redacted_approval_packet_not_imported"],
    },
    {
      id: "kiwoom_rest",
      role: "broker_order_api_contingency",
      observedOfficialSurface:
        "Kiwoom REST API advertises account status, quote information, and order services with allowed-IP security",
      canSupportOrderSubmissionInPrinciple: true,
      canReplaceCurrentEnvWithoutNewOwnerReview: false,
      serverRuntimeFit: "candidate",
      currentDecision: "research_only_no_adapter",
      blockers: ["new_account_and_api_application_review_required", "new_terms_review_required"],
    },
    {
      id: "ls_open_api",
      role: "broker_order_api_contingency",
      observedOfficialSurface:
        "LS Securities OPEN API lists stock quotes and stock account order API categories with a testbed menu",
      canSupportOrderSubmissionInPrinciple: true,
      canReplaceCurrentEnvWithoutNewOwnerReview: false,
      serverRuntimeFit: "candidate",
      currentDecision: "research_only_no_adapter",
      blockers: ["new_account_and_api_application_review_required", "new_terms_review_required"],
    },
    {
      id: "alpha_vantage",
      role: "market_data_only_candidate",
      observedOfficialSurface:
        "Alpha Vantage provides global equity market data APIs but is not a personal brokerage order endpoint",
      canSupportOrderSubmissionInPrinciple: false,
      canReplaceCurrentEnvWithoutNewOwnerReview: false,
      serverRuntimeFit: "data_only",
      currentDecision: "do_not_use_as_order_broker",
      blockers: ["no_account_order_submission_surface", "kr_symbol_and_terms_review_required_for_data"],
    },
    {
      id: "krx_data_marketplace",
      role: "licensed_market_data_candidate",
      observedOfficialSurface:
        "KRX Data Marketplace exposes market statistics and data products, not a personal account order API",
      canSupportOrderSubmissionInPrinciple: false,
      canReplaceCurrentEnvWithoutNewOwnerReview: false,
      serverRuntimeFit: "data_only",
      currentDecision: "data_source_review_only",
      blockers: ["license_and_distribution_review_required", "no_account_order_submission_surface"],
    },
  ];
}

function missingCandidateIds(candidates) {
  const actual = new Set(candidates.map((candidate) => candidate.id));
  return REQUIRED_CANDIDATES.filter((candidateId) => !actual.has(candidateId));
}

function missingDecisionRules(rules) {
  const actual = new Set(rules);
  return REQUIRED_DECISION_RULES.filter((rule) => !actual.has(rule));
}

function buildContract() {
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const alphaBoundary = readJson(ALPHA_BOUNDARY_PATH);
  const launchReadinessPlan = readJson(LAUNCH_READINESS_PLAN_PATH);
  const orderAdapterDesign = readJson(ORDER_ADAPTER_DESIGN_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const candidates = buildCandidates();
  const missingCandidates = missingCandidateIds(candidates);
  const missingRules = missingDecisionRules(REQUIRED_DECISION_RULES);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    candidatesComplete: missingCandidates.length === 0,
    decisionRulesComplete: missingRules.length === 0,
    progressSummaryFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForReadOnlyProviderCalls === false &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.readyForLiveGuardedTrading === false,
    alphaBoundaryStillDataOnly:
      alphaBoundary.currentState?.alphaKrStockCallValidationAllowedNow === false &&
      alphaBoundary.readiness?.providerCallsAllowed === false &&
      alphaBoundary.readiness?.orderSubmissionAllowed === false,
    launchPlanStillBlocksRuntime:
      launchReadinessPlan.readiness?.providerCallsAllowed === false &&
      launchReadinessPlan.readiness?.orderSubmissionAllowed === false &&
      launchReadinessPlan.readiness?.runtimeRouteAllowed === false &&
      launchReadinessPlan.readiness?.publicUiAllowed === false,
    kisOrderAdapterDesignStillReviewOnly:
      orderAdapterDesign.currentState?.designReviewOnly === true &&
      orderAdapterDesign.readiness?.orderSubmissionAllowed === false &&
      orderAdapterDesign.readiness?.providerCallsAllowed === false,
    noCandidatePreselectedForRuntime:
      candidates.every((candidate) => candidate.canReplaceCurrentEnvWithoutNewOwnerReview === false),
    alphaNotClassifiedAsOrderBroker:
      candidates.find((candidate) => candidate.id === "alpha_vantage")?.canSupportOrderSubmissionInPrinciple === false,
    architectureDocMentionsBrokerContingency:
      architectureDoc.includes("Trading Broker Contingency Review") &&
      architectureDoc.includes("trading_lab_step116_broker_contingency_review_contract"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureBrokerContingencyDecision =
    checks.candidatesComplete &&
    checks.decisionRulesComplete &&
    checks.progressSummaryFailClosed &&
    checks.alphaBoundaryStillDataOnly &&
    checks.launchPlanStillBlocksRuntime &&
    checks.kisOrderAdapterDesignStillReviewOnly &&
    checks.noCandidatePreselectedForRuntime &&
    checks.alphaNotClassifiedAsOrderBroker &&
    checks.architectureDocMentionsBrokerContingency &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5R",
    scope: "broker_contingency_review",
    sourceFiles: {
      progressSummary: PROGRESS_SUMMARY_PATH,
      alphaKrMarketBoundary: ALPHA_BOUNDARY_PATH,
      launchReadinessPlan: LAUNCH_READINESS_PLAN_PATH,
      kisOrderAdapterDesignReview: ORDER_ADAPTER_DESIGN_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      brokerSwitchoverAllowedNow: false,
      candidateAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    brokerContingencyReview: {
      recommendation: "keep_kis_primary_while_preparing_broker_contingency_review",
      contingencyCandidates: candidates,
      decisionRules: REQUIRED_DECISION_RULES,
      immediateOwnerAction:
        "send KIS follow-up email; do not rotate Render trading env to a different broker until a new owner-reviewed credential boundary exists",
    },
    checks,
    evidence: {
      missingCandidates,
      missingRules,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      progressSummaryStatus: progressSummary.readiness?.status ?? null,
      alphaBoundaryStatus: alphaBoundary.readiness?.status ?? null,
      launchReadinessStatus: launchReadinessPlan.readiness?.status ?? null,
      kisOrderAdapterDesignStatus: orderAdapterDesign.readiness?.status ?? null,
    },
    readiness: {
      status: readyForFutureBrokerContingencyDecision
        ? "broker_contingency_review_ready_no_runtime_switch"
        : "broker_contingency_review_blocked",
      readyForFutureBrokerContingencyDecision,
      brokerSwitchoverAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.candidatesComplete ? [] : ["broker_contingency_candidates_missing"]),
        ...(checks.decisionRulesComplete ? [] : ["broker_contingency_decision_rules_missing"]),
        ...(checks.progressSummaryFailClosed ? [] : ["progress_summary_not_fail_closed"]),
        ...(checks.alphaBoundaryStillDataOnly ? [] : ["alpha_boundary_no_longer_data_only"]),
        ...(checks.launchPlanStillBlocksRuntime ? [] : ["launch_plan_runtime_not_blocked"]),
        ...(checks.kisOrderAdapterDesignStillReviewOnly ? [] : ["kis_order_adapter_design_not_review_only"]),
        ...(checks.noCandidatePreselectedForRuntime ? [] : ["candidate_preselected_for_runtime_without_owner_review"]),
        ...(checks.alphaNotClassifiedAsOrderBroker ? [] : ["alpha_misclassified_as_order_broker"]),
        ...(checks.architectureDocMentionsBrokerContingency ? [] : ["architecture_doc_missing_broker_contingency"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: [
        "kis_written_reply_or_broker_contingency_owner_decision_pending",
        "new_broker_terms_review_pending_if_switching",
        "new_broker_credential_boundary_pending_if_switching",
        "new_adapter_design_review_pending_if_switching",
        "provider_calls_blocked_until_private_authorization",
        "order_submission_blocked_until_manual_permission_and_risk_clearance",
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-broker-contingency-review-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-broker-contingency-review-contract.cjs`);
    }
    console.log("[generate-trading-broker-contingency-review-contract] ok");
    console.log(`[generate-trading-broker-contingency-review-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-broker-contingency-review-contract] wrote contract");
  console.log(
    `[generate-trading-broker-contingency-review-contract] readyForFutureBrokerContingencyDecision=${parsed.readiness.readyForFutureBrokerContingencyDecision}`,
  );
}

main();
