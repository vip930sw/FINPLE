const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
);
const REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const HASH_PREPARATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
);
const HASH_PREPARATION_RUNBOOK_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_validator_fixtures.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
);
const PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-import-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_IMPORT_SERVICE_PATH = path.join(
  "server",
  "src",
  "services",
  "trading",
  "manualOrderPermissionImport.js",
);
const PRIVATE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_REVIEW_GATES = [
  "manual_order_permission_preflight_ready",
  "manual_order_permission_validator_fixtures_ready",
  "redacted_manual_order_permission_template_ready",
  "hash_preparation_runbook_ready",
  "hash_preparation_runbook_validator_fixtures_ready",
  "owner_private_permission_packet_absent_now",
  "live_guarded_order_adapter_review_still_blocked",
  "private_shadow_runtime_review_still_blocked",
  "private_operator_access_review_still_blocked",
  "env_risk_gate_fail_closed",
];
const REQUIRED_IMPLEMENTATION_RULES = [
  "private_worker_only",
  "explicit_owner_permission_packet_path_required_later",
  "no_default_private_packet_read",
  "no_permission_packet_write_now",
  "no_permission_packet_import_now",
  "no_hash_generation_now",
  "no_provider_call",
  "no_order_submission",
  "no_order_adapter_implementation_now",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "redacted_error_messages_only",
  "fail_closed_without_owner_permission_packet_file",
  "fail_closed_without_manual_order_permission_validation",
  "does_not_override_kill_switch_or_risk_gate",
];
const FORBIDDEN_PREFLIGHT_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_session_token",
  "raw_order_payload",
  "raw_provider_payload",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_IMPORT_SERVICE_PATH,
  PRIVATE_PERMISSION_PACKET_PATH,
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateTradingStore.js"),
  path.join("server", "src", "routes", "trading.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
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
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const manualOrderPermissionValidatorFixtures = readJson(MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH);
  const redactedManualOrderPermissionTemplate = readJson(REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE_PATH);
  const hashPreparationRunbook = readJson(HASH_PREPARATION_RUNBOOK_PATH);
  const hashPreparationRunbookValidatorFixtures = readJson(HASH_PREPARATION_RUNBOOK_VALIDATOR_FIXTURES_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const privateShadowRuntimeImplementationPreflight = readJson(
    PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const privateOperatorAccessImplementationPreflight = readJson(
    PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH,
  );
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
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
    ownerPrivatePermissionPacketAbsentNow: !fs.existsSync(PRIVATE_PERMISSION_PACKET_PATH),
    manualOrderPermissionPreflightReady:
      manualOrderPermissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      manualOrderPermissionPreflight.readiness?.manualOrderPermissionImportImplementationAllowed === false &&
      manualOrderPermissionPreflight.readiness?.providerCallsAllowed === false &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false,
    validatorFixturesReady:
      manualOrderPermissionValidatorFixtures.readiness?.readyForManualOrderPermissionFixtureRegression === true &&
      manualOrderPermissionValidatorFixtures.readiness?.permissionImportAllowed === false &&
      manualOrderPermissionValidatorFixtures.readiness?.providerCallsAllowed === false &&
      manualOrderPermissionValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    redactedTemplateReady:
      redactedManualOrderPermissionTemplate.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      redactedManualOrderPermissionTemplate.readiness?.permissionPacketCreatedNow === false &&
      redactedManualOrderPermissionTemplate.readiness?.permissionPacketImportedNow === false &&
      redactedManualOrderPermissionTemplate.readiness?.providerCallsAllowed === false &&
      redactedManualOrderPermissionTemplate.readiness?.orderSubmissionAllowed === false,
    hashPreparationRunbookReady:
      hashPreparationRunbook.readiness?.readyForOwnerAssistedHashPreparationRunbookReview === true &&
      hashPreparationRunbook.readiness?.helperExecutionAllowedNow === false &&
      hashPreparationRunbook.readiness?.hashGenerationAllowed === false &&
      hashPreparationRunbook.readiness?.permissionPacketCreatedNow === false &&
      hashPreparationRunbook.readiness?.permissionPacketImportedNow === false,
    hashPreparationRunbookValidatorFixturesReady:
      hashPreparationRunbookValidatorFixtures.readiness?.readyForRunbookValidatorFixtureRegression === true &&
      hashPreparationRunbookValidatorFixtures.readiness?.helperExecutionAllowedNow === false &&
      hashPreparationRunbookValidatorFixtures.readiness?.hashGenerationAllowed === false &&
      hashPreparationRunbookValidatorFixtures.readiness?.permissionPacketCreatedNow === false &&
      hashPreparationRunbookValidatorFixtures.readiness?.permissionPacketImportedNow === false,
    liveGuardedOrderAdapterReviewStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    privateShadowRuntimeImplementationStillBlocked:
      privateShadowRuntimeImplementationPreflight.readiness?.readyForFuturePrivateShadowRuntimeImplementationReview ===
        false &&
      privateShadowRuntimeImplementationPreflight.readiness?.privateShadowRuntimeImplementationAllowedNow === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateShadowRuntimeImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    privateOperatorAccessImplementationStillBlocked:
      privateOperatorAccessImplementationPreflight.readiness?.readyForFuturePrivateOperatorAccessImplementationReview ===
        false &&
      privateOperatorAccessImplementationPreflight.readiness?.operatorAccessImplementationAllowedNow === false &&
      privateOperatorAccessImplementationPreflight.readiness?.providerCallsAllowed === false &&
      privateOperatorAccessImplementationPreflight.readiness?.runtimeRouteAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    reviewGatesReady: missingReviewGates.length === 0,
    implementationRulesReady: missingImplementationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsManualOrderPermissionImportImplementationPreflight:
      architectureDoc.includes("Trading Manual Order Permission Import Implementation Preflight") &&
      architectureDoc.includes("manual_order_permission_import_implementation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    importImplementationAllowedNow: false,
    ownerPacketReadAllowedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderAdapterImplementationAllowedNow: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4E",
    scope: "manual_order_permission_import_implementation_preflight",
    sourceFiles: {
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      manualOrderPermissionValidatorFixtures: MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH,
      redactedManualOrderPermissionTemplate: REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE_PATH,
      hashPreparationRunbook: HASH_PREPARATION_RUNBOOK_PATH,
      hashPreparationRunbookValidatorFixtures: HASH_PREPARATION_RUNBOOK_VALIDATOR_FIXTURES_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      privateShadowRuntimeImplementationPreflight: PRIVATE_SHADOW_RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
      privateOperatorAccessImplementationPreflight: PRIVATE_OPERATOR_ACCESS_IMPLEMENTATION_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      ownerPrivatePermissionPacketAbsentNow: true,
      importImplementationAllowedNow: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderAdapterImplementationAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureManualOrderPermissionImportImplementationBoundary: {
      scope: "manual_order_permission_import_implementation_preflight",
      futureImportServicePath: FUTURE_IMPORT_SERVICE_PATH,
      futurePermissionPacketPath: PRIVATE_PERMISSION_PACKET_PATH,
      currentStepReadsPrivatePacket: false,
      currentStepWritesPrivatePacket: false,
      currentStepImportsPacket: false,
      currentStepGeneratesHashes: false,
      currentStepCallsProvider: false,
      currentStepSubmitsOrder: false,
      currentStepImplementsOrderAdapter: false,
      currentStepCreatesRuntimeRoute: false,
      currentStepWritesDatabase: false,
      reviewGates,
      implementationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "this preflight does not start manual order permission import implementation review",
        "owner manual order permission packet import remains blocked until the owner supplies a redacted packet through a separate local review",
        "import review cannot generate hashes, read default private packet paths, call providers, write DB rows, create routes, expose UI, implement the order adapter, or submit orders in this step",
        "permission import success still does not approve live_guarded order submission",
      ],
    },
    checks,
    evidence: {
      missingReviewGates,
      missingImplementationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      ownerPrivatePermissionPacketPath: PRIVATE_PERMISSION_PACKET_PATH,
      manualOrderPermissionPreflightStatus: manualOrderPermissionPreflight.readiness?.status,
      manualOrderPermissionValidatorFixturesStatus: manualOrderPermissionValidatorFixtures.readiness?.status,
      redactedManualOrderPermissionTemplateStatus: redactedManualOrderPermissionTemplate.readiness?.status,
      hashPreparationRunbookStatus: hashPreparationRunbook.readiness?.status,
      hashPreparationRunbookValidatorFixturesStatus: hashPreparationRunbookValidatorFixtures.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status,
      privateShadowRuntimeImplementationPreflightStatus:
        privateShadowRuntimeImplementationPreflight.readiness?.status,
      privateOperatorAccessImplementationPreflightStatus:
        privateOperatorAccessImplementationPreflight.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
    },
    readiness: {
      status: "preflight_recorded_manual_order_permission_import_review_blocked_pending_owner_packet",
      readyForFutureManualOrderPermissionImportImplementationReview: false,
      ownerPrivatePermissionPacketAbsentNow: true,
      importImplementationAllowedNow: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderAdapterImplementationAllowedNow: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerPrivatePermissionPacketAbsentNow ? [] : ["owner_private_permission_packet_present_too_early"]),
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["manual_order_permission_validator_fixtures_not_ready"]),
        ...(checks.redactedTemplateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.hashPreparationRunbookReady ? [] : ["hash_preparation_runbook_not_ready"]),
        ...(checks.hashPreparationRunbookValidatorFixturesReady
          ? []
          : ["hash_preparation_runbook_validator_fixtures_not_ready"]),
        ...(checks.liveGuardedOrderAdapterReviewStillBlocked
          ? []
          : ["live_guarded_order_adapter_review_not_blocked"]),
        ...(checks.privateShadowRuntimeImplementationStillBlocked
          ? []
          : ["private_shadow_runtime_implementation_not_blocked"]),
        ...(checks.privateOperatorAccessImplementationStillBlocked
          ? []
          : ["private_operator_access_implementation_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingReviewGates.map((gate) => `missing_review_gate_${gate}`),
        ...missingImplementationRules.map((rule) => `missing_implementation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsManualOrderPermissionImportImplementationPreflight
          ? []
          : ["architecture_doc_missing_manual_order_permission_import_implementation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_manual_order_permission_packet_not_imported",
        "owner_hash_preparation_deferred_until_owner_request",
        "live_guarded_order_adapter_review_blocked_pending_manual_permission_and_runtime_clearance",
        "private_shadow_runtime_review_blocked_pending_owner_packet_and_operator_access",
        "private_operator_access_review_blocked_pending_private_runtime_review",
        "kill_switch_clearance_not_recorded_for_order_submission",
        "risk_gate_clearance_not_recorded_for_order_submission",
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-import-implementation-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-import-implementation-preflight.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-import-implementation-preflight] ok");
    console.log(`[generate-trading-manual-order-permission-import-implementation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-import-implementation-preflight] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-import-implementation-preflight] importImplementationAllowedNow=${parsed.readiness.importImplementationAllowedNow}`,
  );
}

main();
