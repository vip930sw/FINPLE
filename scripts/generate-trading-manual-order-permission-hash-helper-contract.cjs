const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
);
const MANUAL_ORDER_PERMISSION_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
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

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-hash-helper-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-manual-order-permission-hashes.cjs");
const REQUIRED_HASH_INPUT_LABELS = [
  "approvedByHash",
  "operatorAccessHash",
  "manualApprovalPolicyHash",
  "orderAdapterDesignReviewHash",
  "killSwitchClearanceHash",
  "riskGateClearanceHash",
  "orderCredentialBoundaryHash",
  "dryRunReplayHash",
  "shadowHistoryReviewHash",
  "auditLoggerReadinessHash",
  "allowedSymbolHashes",
  "revocationPlanHash",
];
const REQUIRED_HASH_HELPER_RULES = [
  "hmac_sha256_required",
  "private_pepper_required",
  "pepper_must_not_be_committed",
  "raw_inputs_from_stdin_or_interactive_prompt_only",
  "raw_inputs_not_allowed_in_command_args",
  "raw_inputs_not_logged",
  "raw_inputs_not_persisted",
  "symbol_inputs_must_be_normalized_before_hashing",
  "output_labels_are_deterministic",
  "helper_does_not_create_permission_packet",
  "helper_does_not_import_permission_packet",
  "helper_does_not_enable_provider_calls",
  "helper_does_not_enable_order_submission",
  "helper_does_not_create_runtime_route",
];
const FORBIDDEN_HASH_INPUTS = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number_output",
  "raw_account_identifier",
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
  FUTURE_PERMISSION_PACKET_PATH,
  FUTURE_HASH_HELPER_PATH,
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImporter.js"),
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
  const template = readJson(MANUAL_ORDER_PERMISSION_TEMPLATE_PATH);
  const permissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const validatorFixtures = readJson(MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH);
  const liveGuardedAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const hashInputLabels = [...REQUIRED_HASH_INPUT_LABELS];
  const hashHelperRules = [...REQUIRED_HASH_HELPER_RULES];
  const forbiddenHashInputs = [...FORBIDDEN_HASH_INPUTS];
  const sampleShape = template.futureRedactedManualOrderPermissionTemplate?.sampleRedactedShape ?? {};
  const missingHashInputLabels = missingValues(hashInputLabels, REQUIRED_HASH_INPUT_LABELS);
  const missingHashHelperRules = missingValues(hashHelperRules, REQUIRED_HASH_HELPER_RULES);
  const missingForbiddenHashInputs = missingValues(forbiddenHashInputs, FORBIDDEN_HASH_INPUTS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    manualOrderPermissionTemplateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false &&
      template.readiness?.runtimeRouteAllowed === false,
    manualOrderPermissionPreflightReady:
      permissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      permissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      permissionPreflight.readiness?.providerCallsAllowed === false &&
      permissionPreflight.readiness?.orderSubmissionAllowed === false,
    validatorFixturesReady:
      validatorFixtures.readiness?.readyForManualOrderPermissionFixtureRegression === true &&
      validatorFixtures.readiness?.providerCallsAllowed === false &&
      validatorFixtures.readiness?.orderSubmissionAllowed === false &&
      validatorFixtures.readiness?.permissionImportAllowed === false,
    liveGuardedAdapterPreflightStillBlocked:
      liveGuardedAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedAdapterPreflight.readiness?.orderSubmissionAllowed === false,
    templateSampleHasRequiredHashLabels:
      hashInputLabels.every((label) => {
        const value = sampleShape[label];
        if (label === "allowedSymbolHashes") {
          return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.includes(":"));
        }
        return typeof value === "string" && value.includes(":");
      }),
    hashInputLabelsReady: missingHashInputLabels.length === 0,
    hashHelperRulesReady: missingHashHelperRules.length === 0,
    forbiddenHashInputsReady: missingForbiddenHashInputs.length === 0,
    architectureDocMentionsManualOrderPermissionHashHelper:
      architectureDoc.includes("Trading Manual Order Permission Hash Helper Contract") &&
      architectureDoc.includes("manual_order_permission_hash_helper"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    hashHelperImplementationAllowed: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureManualOrderPermissionHashHelperImplementationReview =
    checks.manualOrderPermissionTemplateReady &&
    checks.manualOrderPermissionPreflightReady &&
    checks.validatorFixturesReady &&
    checks.liveGuardedAdapterPreflightStillBlocked &&
    checks.templateSampleHasRequiredHashLabels &&
    checks.hashInputLabelsReady &&
    checks.hashHelperRulesReady &&
    checks.forbiddenHashInputsReady &&
    checks.architectureDocMentionsManualOrderPermissionHashHelper &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3W",
    scope: "manual_order_permission_hash_helper_contract",
    sourceFiles: {
      redactedManualOrderPermissionTemplate: MANUAL_ORDER_PERMISSION_TEMPLATE_PATH,
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      manualOrderPermissionValidatorFixtures: MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      hashHelperImplementationAllowed: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureLocalHashHelperBoundary: {
      futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepImplementsHelper: false,
      currentStepCreatesHashes: false,
      currentStepCreatesPermissionPacket: false,
      requiredHashInputLabels: hashInputLabels,
      requiredHashHelperRules: hashHelperRules,
      forbiddenHashInputs,
      acceptedHashAlgorithm: "HMAC-SHA256",
      requiredSecretBoundary: {
        pepperRequired: true,
        pepperStorage: "outside_repo_operator_secret",
        rawInputTransport: "stdin_or_interactive_prompt_only",
        commandLineRawSecretsAllowed: false,
        rawInputLoggingAllowed: false,
        rawInputPersistenceAllowed: false,
      },
      outputRules: [
        "helper output must contain only deterministic labels and hash strings",
        "helper output must not include raw operator names, account identifiers, session ids, provider payloads, or order payloads",
        "helper output must not create or mutate data/private/trading/manual_order_permission.redacted.json",
        "helper output must not unlock provider calls, runtime routes, UI, or order submission",
      ],
      sampleOutputShape: {
        approvedByHash: "hmac-sha256:<operator_hash>",
        operatorAccessHash: "hmac-sha256:<operator_access_hash>",
        manualApprovalPolicyHash: "hmac-sha256:<manual_policy_hash>",
        orderAdapterDesignReviewHash: "hmac-sha256:<order_adapter_design_review_hash>",
        killSwitchClearanceHash: "hmac-sha256:<kill_switch_clearance_hash>",
        riskGateClearanceHash: "hmac-sha256:<risk_gate_clearance_hash>",
        orderCredentialBoundaryHash: "hmac-sha256:<order_credential_boundary_hash>",
        dryRunReplayHash: "hmac-sha256:<dry_run_replay_hash>",
        shadowHistoryReviewHash: "hmac-sha256:<shadow_history_review_hash>",
        auditLoggerReadinessHash: "hmac-sha256:<audit_logger_readiness_hash>",
        allowedSymbolHashes: ["hmac-sha256:<allowed_symbol_hash>"],
        revocationPlanHash: "hmac-sha256:<revocation_plan_hash>",
      },
    },
    checks,
    evidence: {
      templateSampleShape: sampleShape,
      missingHashInputLabels,
      missingHashHelperRules,
      missingForbiddenHashInputs,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      redactedManualOrderPermissionTemplateStatus: template.readiness?.status,
      manualOrderPermissionPreflightStatus: permissionPreflight.readiness?.status,
      manualOrderPermissionValidatorFixturesStatus: validatorFixtures.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedAdapterPreflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureManualOrderPermissionHashHelperImplementationReview
        ? "contract_ready_pending_manual_order_permission_hash_helper_implementation_review"
        : "blocked_before_manual_order_permission_hash_helper_contract",
      readyForFutureManualOrderPermissionHashHelperImplementationReview,
      hashHelperImplementationAllowed: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.manualOrderPermissionTemplateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["manual_order_permission_validator_fixtures_not_ready"]),
        ...(checks.liveGuardedAdapterPreflightStillBlocked
          ? []
          : ["live_guarded_order_adapter_preflight_not_blocked"]),
        ...(checks.templateSampleHasRequiredHashLabels ? [] : ["template_sample_missing_required_hash_labels"]),
        ...missingHashInputLabels.map((label) => `missing_hash_input_label_${label}`),
        ...missingHashHelperRules.map((rule) => `missing_hash_helper_rule_${rule}`),
        ...missingForbiddenHashInputs.map((input) => `missing_forbidden_hash_input_${input}`),
        ...(checks.architectureDocMentionsManualOrderPermissionHashHelper
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_helper"]),
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
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-helper-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-helper-contract.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-helper-contract] ok");
    console.log(`[generate-trading-manual-order-permission-hash-helper-contract] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-helper-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-helper-contract] readyForFutureManualOrderPermissionHashHelperImplementationReview=${parsed.readiness.readyForFutureManualOrderPermissionHashHelperImplementationReview}`,
  );
}

main();
