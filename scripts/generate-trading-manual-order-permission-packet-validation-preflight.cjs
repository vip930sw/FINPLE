const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
);
const TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const PACKET_VALIDATOR_FIXTURES_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ENV_RISK_GATE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_env_risk_gate_contract.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-packet-validation-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_PREFLIGHT_GATES = [
  "redacted_manual_order_permission_template_ready",
  "manual_order_permission_packet_validator_fixtures_ready",
  "local_packet_validator_present",
  "owner_private_permission_packet_absent_now",
  "manual_order_permission_import_implementation_review_still_blocked",
  "live_guarded_order_adapter_review_still_blocked",
  "env_risk_gate_fail_closed",
];
const REQUIRED_VALIDATION_RULES = [
  "explicit_owner_packet_path_required_later",
  "no_default_private_packet_path_read",
  "no_packet_write_now",
  "no_packet_import_now",
  "no_hash_generation_now",
  "no_provider_call",
  "no_order_submission",
  "no_order_adapter_implementation_now",
  "no_runtime_route",
  "no_public_ui",
  "no_database_write_now",
  "redacted_error_messages_only",
  "validation_success_does_not_import_packet",
  "validation_success_does_not_approve_live_guarded_orders",
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
  FUTURE_PERMISSION_PACKET_PATH,
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
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
  const template = readJson(TEMPLATE_PATH);
  const packetValidatorFixtures = readJson(PACKET_VALIDATOR_FIXTURES_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const liveGuardedOrderAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const envRiskGateContract = readJson(ENV_RISK_GATE_CONTRACT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const preflightGates = [...REQUIRED_PREFLIGHT_GATES];
  const validationRules = [...REQUIRED_VALIDATION_RULES];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingPreflightGates = missingValues(preflightGates, REQUIRED_PREFLIGHT_GATES);
  const missingValidationRules = missingValues(validationRules, REQUIRED_VALIDATION_RULES);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    ownerPrivatePermissionPacketAbsentNow: !fs.existsSync(FUTURE_PERMISSION_PACKET_PATH),
    templateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false,
    packetValidatorFixturesReady:
      packetValidatorFixtures.readiness?.readyForManualOrderPermissionPacketValidatorRegression === true &&
      packetValidatorFixtures.readiness?.permissionPacketCreatedNow === false &&
      packetValidatorFixtures.readiness?.permissionPacketImportedNow === false &&
      packetValidatorFixtures.readiness?.providerCallsAllowed === false &&
      packetValidatorFixtures.readiness?.orderSubmissionAllowed === false,
    localPacketValidatorPresent:
      validatorSource.includes("validateManualOrderPermissionPacket") &&
      validatorSource.includes("packet_path_required") &&
      validatorSource.includes("--packet"),
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationPreflight.readiness?.importImplementationAllowedNow === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.permissionPacketImportedNow === false &&
      importImplementationPreflight.readiness?.providerCallsAllowed === false &&
      importImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    liveGuardedOrderAdapterReviewStillBlocked:
      liveGuardedOrderAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedOrderAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedOrderAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    envRiskGateStillFailClosed:
      envRiskGateContract.readiness?.status === "contract_ready_risk_gate_env_input_mapping_fail_closed" &&
      envRiskGateContract.readiness?.providerCallsAllowed === false &&
      envRiskGateContract.readiness?.orderSubmissionAllowed === false,
    preflightGatesReady: missingPreflightGates.length === 0,
    validationRulesReady: missingValidationRules.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsPacketValidationPreflight:
      architectureDoc.includes("Trading Manual Order Permission Packet Validation Preflight") &&
      architectureDoc.includes("manual_order_permission_packet_validation_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepRunsValidator: false,
    ownerPacketReadAllowedNow: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    importImplementationAllowedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    orderAdapterImplementationAllowedNow: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedManualOrderPermissionPacketValidation =
    checks.ownerPrivatePermissionPacketAbsentNow &&
    checks.templateReady &&
    checks.packetValidatorFixturesReady &&
    checks.localPacketValidatorPresent &&
    checks.importImplementationPreflightStillBlocked &&
    checks.liveGuardedOrderAdapterReviewStillBlocked &&
    checks.envRiskGateStillFailClosed &&
    checks.preflightGatesReady &&
    checks.validationRulesReady &&
    checks.forbiddenPreflightContentReady &&
    checks.architectureDocMentionsPacketValidationPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-4J",
    scope: "manual_order_permission_packet_validation_preflight",
    sourceFiles: {
      redactedManualOrderPermissionTemplate: TEMPLATE_PATH,
      manualOrderPermissionPacketValidatorFixtures: PACKET_VALIDATOR_FIXTURES_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      envRiskGateContract: ENV_RISK_GATE_CONTRACT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      preflightOnly: true,
      currentStepRunsValidator: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      orderAdapterImplementationAllowedNow: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedValidationBoundary: {
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      futureValidatorPath: VALIDATOR_PATH,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepImportsPacket: false,
      preflightGates,
      validationRules,
      forbiddenPreflightContent,
      promotionRules: [
        "preflight success only records readiness for a later owner-assisted local packet validation",
        "owner must provide an explicit local packet path later; no default private packet path is read",
        "validation success still does not import the permission packet",
        "validation success still does not implement order adapter, runtime route, DB write, UI, provider call, or order submission",
      ],
    },
    checks,
    evidence: {
      templateStatus: template.readiness?.status,
      packetValidatorFixturesStatus: packetValidatorFixtures.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedOrderAdapterPreflight.readiness?.status,
      envRiskGateContractStatus: envRiskGateContract.readiness?.status,
      missingPreflightGates,
      missingValidationRules,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
    },
    readiness: {
      status: readyForOwnerAssistedManualOrderPermissionPacketValidation
        ? "preflight_ready_for_owner_assisted_manual_order_permission_packet_validation"
        : "blocked_before_manual_order_permission_packet_validation_preflight",
      readyForOwnerAssistedManualOrderPermissionPacketValidation,
      currentStepRunsValidator: false,
      ownerPacketReadAllowedNow: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      importImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.ownerPrivatePermissionPacketAbsentNow ? [] : ["owner_private_permission_packet_present_too_early"]),
        ...(checks.templateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.packetValidatorFixturesReady ? [] : ["manual_order_permission_packet_validator_fixtures_not_ready"]),
        ...(checks.localPacketValidatorPresent ? [] : ["local_packet_validator_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_implementation_preflight_not_blocked"]),
        ...(checks.liveGuardedOrderAdapterReviewStillBlocked
          ? []
          : ["live_guarded_order_adapter_review_not_blocked"]),
        ...(checks.envRiskGateStillFailClosed ? [] : ["env_risk_gate_contract_not_fail_closed"]),
        ...missingPreflightGates.map((gate) => `missing_preflight_gate_${gate}`),
        ...missingValidationRules.map((rule) => `missing_validation_rule_${rule}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsPacketValidationPreflight
          ? []
          : ["architecture_doc_missing_manual_order_permission_packet_validation_preflight"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingExternalGates: [
        "owner_redacted_manual_order_permission_packet_not_supplied",
        "owner_packet_validation_not_run",
        "owner_packet_import_not_reviewed",
        "live_guarded_order_adapter_review_blocked_pending_manual_permission_and_runtime_clearance",
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-packet-validation-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-packet-validation-preflight.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-packet-validation-preflight] ok");
    console.log(`[generate-trading-manual-order-permission-packet-validation-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-packet-validation-preflight] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-packet-validation-preflight] readyForOwnerAssistedManualOrderPermissionPacketValidation=${parsed.readiness.readyForOwnerAssistedManualOrderPermissionPacketValidation}`,
  );
}

main();
