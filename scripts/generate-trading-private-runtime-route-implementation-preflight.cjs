const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
);
const PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_preflight.json",
);
const PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
);
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
);
const PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_db_storage_implementation_preflight.json",
);
const PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-private-runtime-route-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_ROUTE_PATH = path.join("server", "src", "routes", "trading", "privateShadowRuntime.js");
const REQUIRED_REVIEW_GATES = [
  "private_operator_access_contract_ready",
  "private_shadow_runtime_preflight_ready",
  "private_shadow_runtime_review_packet_contract_ready",
  "private_db_storage_review_still_blocked",
  "private_read_only_provider_review_still_blocked",
  "manual_order_permission_still_not_imported",
  "public_ui_not_allowed",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_operator_only",
  "server_side_only",
  "no_public_ui",
  "no_provider_call",
  "no_order_submission",
  "no_order_cancellation",
  "no_database_write_now",
  "no_default_private_packet_read",
  "no_raw_session_token_logging",
  "redacted_error_messages_only",
  "fail_closed_without_operator_access_hash",
  "fail_closed_without_runtime_review_packet_hash",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_provider_payload",
  "raw_order_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_ROUTE_PATH,
  path.join("server", "src", "routes", "trading.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "trading", "privateTradingStore.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
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
  const privateShadowRuntimePreflight = readJson(PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH);
  const privateShadowRuntimeReviewPacketContract = readJson(PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH);
  const privateShadowOperatorAccessContract = readJson(PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH);
  const privateDbStorageImplementationPreflight = readJson(PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH);
  const privateReadOnlyProviderImplementationPreflight = readJson(
    PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const reviewGates = [...REQUIRED_REVIEW_GATES];
  const implementationRules = [...REQUIRED_IMPLEMENTATION_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingReviewGates = missingValues(reviewGates, REQUIRED_REVIEW_GATES);
  const missingImplementationRules = missingValues(implementationRules, REQUIRED_IMPLEMENTATION_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    privateShadowRuntimePreflightReady:
      privateShadowRuntimePreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview === true &&
      privateShadowRuntimePreflight.readiness?.privateShadowRuntimeImplementationAllowed === false &&
      privateShadowRuntimePreflight.readiness?.runtimeRouteAllowed === false &&
      privateShadowRuntimePreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimePreflight.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimeReviewPacketContractReady:
      privateShadowRuntimeReviewPacketContract.readiness
        ?.readyForFuturePrivateShadowRuntimeReviewPacketImplementationReview === true &&
      privateShadowRuntimeReviewPacketContract.readiness?.privateShadowRuntimeReviewPacketImplementationAllowed ===
        false &&
      privateShadowRuntimeReviewPacketContract.readiness?.runtimeRouteAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeReviewPacketContract.readiness?.orderSubmissionAllowed === false,
    privateShadowOperatorAccessContractReady:
      privateShadowOperatorAccessContract.readiness
        ?.readyForFuturePrivateShadowOperatorAccessImplementationReview === true &&
      privateShadowOperatorAccessContract.readiness?.privateShadowOperatorAccessImplementationAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.runtimeRouteAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.publicUiAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.providerCallsAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.orderSubmissionAllowed === false,
    privateDbStorageImplementationStillBlocked:
      privateDbStorageImplementationPreflight.readiness?.readyForFuturePrivateDbStorageImplementationReview === false &&
      privateDbStorageImplementationPreflight.readiness?.dbStorageImplementationAllowedNow === false &&
      privateDbStorageImplementationPreflight.readiness?.databaseConnectionAllowedNow === false &&
      privateDbStorageImplementationPreflight.readiness?.dbMigrationAllowed === false &&
      privateDbStorageImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    privateReadOnlyProviderImplementationStillBlocked:
      privateReadOnlyProviderImplementationPreflight.readiness?.ownerPacketGateStillClosed === true &&
      privateReadOnlyProviderImplementationPreflight.readiness?.readyForFuturePrivateReadOnlyProviderImplementationReview ===
        false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerImplementationAllowedNow === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateReadOnlyProviderImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    manualOrderPermissionStillNotImported:
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportImplementationAllowed === false &&
      manualOrderPermissionPreflight.readiness?.runtimeRouteAllowed === false &&
      manualOrderPermissionPreflight.readiness?.providerCallsAllowed === false &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPrivateRuntimeRoutePreflight:
      architectureDoc.includes("Trading Private Runtime Route Implementation Preflight") &&
      architectureDoc.includes("private_runtime_route_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    runtimeRouteImplementationAllowedNow: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFuturePrivateRuntimeRouteImplementationReview = false;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3B",
    scope: "private_runtime_route_implementation_preflight",
    sourceFiles: {
      privateShadowRuntimePreflight: PRIVATE_SHADOW_RUNTIME_PREFLIGHT_PATH,
      privateShadowRuntimeReviewPacketContract: PRIVATE_SHADOW_RUNTIME_REVIEW_PACKET_CONTRACT_PATH,
      privateShadowOperatorAccessContract: PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH,
      privateDbStorageImplementationPreflight: PRIVATE_DB_STORAGE_IMPLEMENTATION_PREFLIGHT_PATH,
      privateReadOnlyProviderImplementationPreflight: PRIVATE_READ_ONLY_PROVIDER_IMPLEMENTATION_PREFLIGHT_PATH,
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      runtimeRouteImplementationAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futurePrivateRuntimeRouteImplementationBoundary: {
      scope: "private_runtime_route_implementation_preflight",
      futureRoutePath: FUTURE_ROUTE_PATH,
      currentStepImplementsRoute: false,
      currentStepExposesPublicUi: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrders: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start runtime route implementation review",
        "private route review must remain operator-only and server-side",
        "private route review cannot call providers, write DB rows, or submit orders in this step",
        "private route review cannot create public UI",
        "runtime route success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      privateShadowRuntimePreflightStatus: privateShadowRuntimePreflight.readiness?.status,
      privateShadowRuntimeReviewPacketContractStatus: privateShadowRuntimeReviewPacketContract.readiness?.status,
      privateShadowOperatorAccessContractStatus: privateShadowOperatorAccessContract.readiness?.status,
      privateDbStorageImplementationPreflightStatus: privateDbStorageImplementationPreflight.readiness?.status,
      privateReadOnlyProviderImplementationPreflightStatus:
        privateReadOnlyProviderImplementationPreflight.readiness?.status,
      manualOrderPermissionPreflightStatus: manualOrderPermissionPreflight.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_runtime_route_review_blocked_pending_private_runtime_review",
      readyForFuturePrivateRuntimeRouteImplementationReview,
      runtimeRouteImplementationAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.privateShadowRuntimePreflightReady ? [] : ["private_shadow_runtime_preflight_not_ready"]),
        ...(checks.privateShadowRuntimeReviewPacketContractReady
          ? []
          : ["private_shadow_runtime_review_packet_contract_not_ready"]),
        ...(checks.privateShadowOperatorAccessContractReady ? [] : ["private_shadow_operator_access_contract_not_ready"]),
        ...(checks.privateDbStorageImplementationStillBlocked
          ? []
          : ["private_db_storage_implementation_not_blocked"]),
        ...(checks.privateReadOnlyProviderImplementationStillBlocked
          ? []
          : ["private_read_only_provider_implementation_not_blocked"]),
        ...(checks.manualOrderPermissionStillNotImported ? [] : ["manual_order_permission_not_closed"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsPrivateRuntimeRoutePreflight
          ? []
          : ["architecture_doc_missing_private_runtime_route_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "private_shadow_runtime_implementation_review_not_started",
        "private_runtime_route_implementation_review_not_started",
        "public_ui_review_not_started",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-private-runtime-route-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-private-runtime-route-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-private-runtime-route-implementation-preflight] ok");
    console.log(`[generate-trading-private-runtime-route-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-private-runtime-route-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-private-runtime-route-implementation-preflight] runtimeRouteImplementationAllowedNow=${parsed.readiness.runtimeRouteImplementationAllowedNow}`,
  );
}

main();
