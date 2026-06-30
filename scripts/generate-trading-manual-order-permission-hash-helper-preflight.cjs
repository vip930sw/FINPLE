const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
);
const HASH_HELPER_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
);
const MANUAL_ORDER_PERMISSION_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-hash-helper-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-manual-order-permission-hashes.cjs");
const REQUIRED_PREFLIGHT_CHECKS = [
  "prior_manual_order_permission_hash_helper_contract_ready",
  "owner_hash_preparation_deferred",
  "helper_implementation_not_created_now",
  "hash_generation_not_run_now",
  "private_pepper_not_requested_now",
  "raw_inputs_not_requested_now",
  "manual_permission_packet_not_created_now",
  "manual_permission_packet_not_imported_now",
  "provider_calls_remain_disabled",
  "order_submission_remains_disabled",
  "runtime_routes_remain_disabled",
];
const REQUIRED_FUTURE_REVIEW_INPUTS = [
  "explicit_owner_request_to_prepare_manual_order_hashes",
  "local_only_execution_surface",
  "private_pepper_source_outside_repo",
  "stdin_or_interactive_raw_input_collection",
  "no_command_line_raw_secret_arguments",
  "no_raw_input_logs",
  "no_raw_input_file_persistence",
  "deterministic_labelled_hash_output",
  "manual_review_before_permission_packet_import",
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
  const hashHelperContract = readJson(HASH_HELPER_CONTRACT_PATH);
  const template = readJson(MANUAL_ORDER_PERMISSION_TEMPLATE_PATH);
  const adapterPreflight = readJson(LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const preflightChecks = [...REQUIRED_PREFLIGHT_CHECKS];
  const futureReviewInputs = [...REQUIRED_FUTURE_REVIEW_INPUTS];
  const forbiddenPreflightContent = [...FORBIDDEN_PREFLIGHT_CONTENT];
  const missingPreflightChecks = missingValues(preflightChecks, REQUIRED_PREFLIGHT_CHECKS);
  const missingFutureReviewInputs = missingValues(futureReviewInputs, REQUIRED_FUTURE_REVIEW_INPUTS);
  const missingForbiddenPreflightContent = missingValues(forbiddenPreflightContent, FORBIDDEN_PREFLIGHT_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    preflightOnly: true,
    ownerHashPreparationDeferred: true,
    hashHelperContractReady:
      hashHelperContract.readiness?.readyForFutureManualOrderPermissionHashHelperImplementationReview === true &&
      hashHelperContract.readiness?.hashHelperImplementationAllowed === false &&
      hashHelperContract.readiness?.permissionPacketCreatedNow === false &&
      hashHelperContract.readiness?.permissionPacketImportedNow === false &&
      hashHelperContract.readiness?.providerCallsAllowed === false &&
      hashHelperContract.readiness?.orderSubmissionAllowed === false,
    templateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.orderSubmissionAllowed === false,
    adapterPreflightStillBlocked:
      adapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      adapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      adapterPreflight.readiness?.orderSubmissionAllowed === false,
    preflightChecksReady: missingPreflightChecks.length === 0,
    futureReviewInputsReady: missingFutureReviewInputs.length === 0,
    forbiddenPreflightContentReady: missingForbiddenPreflightContent.length === 0,
    architectureDocMentionsManualOrderPermissionHashHelperPreflight:
      architectureDoc.includes("Trading Manual Order Permission Hash Helper Preflight") &&
      architectureDoc.includes("manual_order_permission_hash_helper_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    hashHelperImplementationAllowed: false,
    hashGenerationAllowed: false,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedManualOrderHashPreparationLater =
    checks.hashHelperContractReady &&
    checks.templateReady &&
    checks.adapterPreflightStillBlocked &&
    checks.preflightChecksReady &&
    checks.futureReviewInputsReady &&
    checks.forbiddenPreflightContentReady &&
    checks.architectureDocMentionsManualOrderPermissionHashHelperPreflight &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3X",
    scope: "manual_order_permission_hash_helper_preflight",
    sourceFiles: {
      manualOrderPermissionHashHelperContract: HASH_HELPER_CONTRACT_PATH,
      redactedManualOrderPermissionTemplate: MANUAL_ORDER_PERMISSION_TEMPLATE_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      preflightOnly: true,
      ownerHashPreparationDeferred: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedManualOrderHashPreparationBoundary: {
      futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      currentStepImplementsHashHelper: false,
      currentStepGeneratesHashes: false,
      currentStepCreatesPermissionPacket: false,
      preflightChecks,
      futureReviewInputs,
      forbiddenPreflightContent,
      ownerGuidanceRule:
        "when manual order hash preparation becomes necessary, guide the owner through a local-only helper without committing raw inputs or pepper values",
    },
    checks,
    evidence: {
      missingPreflightChecks,
      missingFutureReviewInputs,
      missingForbiddenPreflightContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOrderPermissionHashHelperContractStatus: hashHelperContract.readiness?.status,
      redactedManualOrderPermissionTemplateStatus: template.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: adapterPreflight.readiness?.status,
    },
    readiness: {
      status: readyForOwnerAssistedManualOrderHashPreparationLater
        ? "preflight_ready_manual_order_hash_preparation_deferred_until_owner_request"
        : "blocked_before_manual_order_permission_hash_helper_preflight",
      readyForOwnerAssistedManualOrderHashPreparationLater,
      ownerHashPreparationDeferred: true,
      hashHelperImplementationAllowed: false,
      hashGenerationAllowed: false,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.hashHelperContractReady ? [] : ["manual_order_permission_hash_helper_contract_not_ready"]),
        ...(checks.templateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.adapterPreflightStillBlocked ? [] : ["live_guarded_order_adapter_preflight_not_blocked"]),
        ...missingPreflightChecks.map((check) => `missing_preflight_check_${check}`),
        ...missingFutureReviewInputs.map((input) => `missing_future_review_input_${input}`),
        ...missingForbiddenPreflightContent.map((content) => `missing_forbidden_preflight_content_${content}`),
        ...(checks.architectureDocMentionsManualOrderPermissionHashHelperPreflight
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_helper_preflight"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-helper-preflight.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-helper-preflight.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-helper-preflight] ok");
    console.log(`[generate-trading-manual-order-permission-hash-helper-preflight] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-helper-preflight] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-helper-preflight] readyForOwnerAssistedManualOrderHashPreparationLater=${parsed.readiness.readyForOwnerAssistedManualOrderHashPreparationLater}`,
  );
}

main();
