const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
);
const HASH_HELPER_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
);
const HASH_HELPER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
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

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-hash-helper-implementation-review-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_HASH_HELPER_PATH = path.join("scripts", "create-trading-manual-order-permission-hashes.cjs");
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);

const REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA = [
  "local_only_node_cli_surface",
  "no_network_access_or_provider_clients",
  "crypto_hmac_sha256_only",
  "private_pepper_outside_repo",
  "raw_inputs_from_stdin_or_interactive_prompt_only",
  "raw_inputs_not_allowed_in_command_args",
  "raw_inputs_not_logged",
  "raw_inputs_not_persisted",
  "synthetic_test_vectors_only",
  "deterministic_labelled_hash_output",
  "stdout_only_by_default",
  "no_permission_packet_write",
  "no_permission_packet_import",
  "no_provider_calls",
  "no_order_submission",
  "no_runtime_route",
  "no_public_ui",
];
const REQUIRED_HELPER_OUTPUT_LABELS = [
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
const FORBIDDEN_REVIEW_CONTENT = [
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
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
  FUTURE_HASH_HELPER_PATH,
  FUTURE_PERMISSION_PACKET_PATH,
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
  const hashHelperPreflight = readJson(HASH_HELPER_PREFLIGHT_PATH);
  const template = readJson(MANUAL_ORDER_PERMISSION_TEMPLATE_PATH);
  const adapterPreflight = readJson(LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const implementationReviewCriteria = [...REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA];
  const helperOutputLabels = [...REQUIRED_HELPER_OUTPUT_LABELS];
  const forbiddenReviewContent = [...FORBIDDEN_REVIEW_CONTENT];
  const missingImplementationReviewCriteria = missingValues(
    implementationReviewCriteria,
    REQUIRED_IMPLEMENTATION_REVIEW_CRITERIA,
  );
  const missingHelperOutputLabels = missingValues(helperOutputLabels, REQUIRED_HELPER_OUTPUT_LABELS);
  const missingForbiddenReviewContent = missingValues(forbiddenReviewContent, FORBIDDEN_REVIEW_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const sampleShape = template.futureRedactedManualOrderPermissionTemplate?.sampleRedactedShape ?? {};
  const checks = {
    contractOnly: true,
    hashHelperContractReady:
      hashHelperContract.readiness?.readyForFutureManualOrderPermissionHashHelperImplementationReview === true &&
      hashHelperContract.readiness?.hashHelperImplementationAllowed === false &&
      hashHelperContract.readiness?.permissionPacketCreatedNow === false &&
      hashHelperContract.readiness?.providerCallsAllowed === false &&
      hashHelperContract.readiness?.orderSubmissionAllowed === false,
    hashHelperPreflightReady:
      hashHelperPreflight.readiness?.readyForOwnerAssistedManualOrderHashPreparationLater === true &&
      hashHelperPreflight.readiness?.ownerHashPreparationDeferred === true &&
      hashHelperPreflight.readiness?.hashHelperImplementationAllowed === false &&
      hashHelperPreflight.readiness?.hashGenerationAllowed === false &&
      hashHelperPreflight.readiness?.permissionPacketCreatedNow === false &&
      hashHelperPreflight.readiness?.providerCallsAllowed === false &&
      hashHelperPreflight.readiness?.orderSubmissionAllowed === false,
    manualOrderPermissionTemplateReady:
      template.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      template.readiness?.permissionPacketCreatedNow === false &&
      template.readiness?.permissionPacketImportedNow === false &&
      template.readiness?.providerCallsAllowed === false &&
      template.readiness?.orderSubmissionAllowed === false,
    liveGuardedAdapterPreflightStillBlocked:
      adapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      adapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      adapterPreflight.readiness?.providerCallsAllowed === false &&
      adapterPreflight.readiness?.orderSubmissionAllowed === false,
    templateSampleHasOutputLabels: helperOutputLabels.every((label) => {
      const value = sampleShape[label];
      if (label === "allowedSymbolHashes") {
        return Array.isArray(value) && value.every((entry) => typeof entry === "string" && entry.includes(":"));
      }
      return typeof value === "string" && value.includes(":");
    }),
    implementationReviewCriteriaReady: missingImplementationReviewCriteria.length === 0,
    helperOutputLabelsReady: missingHelperOutputLabels.length === 0,
    forbiddenReviewContentReady: missingForbiddenReviewContent.length === 0,
    architectureDocMentionsImplementationReview:
      architectureDoc.includes("Trading Manual Order Permission Hash Helper Implementation Review Contract") &&
      architectureDoc.includes("manual_order_permission_hash_helper_implementation_review_contract"),
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
  const readyForFutureLocalHashHelperImplementationReview =
    checks.hashHelperContractReady &&
    checks.hashHelperPreflightReady &&
    checks.manualOrderPermissionTemplateReady &&
    checks.liveGuardedAdapterPreflightStillBlocked &&
    checks.templateSampleHasOutputLabels &&
    checks.implementationReviewCriteriaReady &&
    checks.helperOutputLabelsReady &&
    checks.forbiddenReviewContentReady &&
    checks.architectureDocMentionsImplementationReview &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3Y",
    scope: "manual_order_permission_hash_helper_implementation_review_contract",
    sourceFiles: {
      manualOrderPermissionHashHelperContract: HASH_HELPER_CONTRACT_PATH,
      manualOrderPermissionHashHelperPreflight: HASH_HELPER_PREFLIGHT_PATH,
      redactedManualOrderPermissionTemplate: MANUAL_ORDER_PERMISSION_TEMPLATE_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ADAPTER_PREFLIGHT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      helperImplementationCreatedNow: false,
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
    futureLocalOnlyImplementationReviewBoundary: {
      futureHashHelperPath: FUTURE_HASH_HELPER_PATH,
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepCreatesHelper: false,
      currentStepRunsHelper: false,
      currentStepRequestsRawInputs: false,
      currentStepRequestsPrivatePepper: false,
      implementationReviewCriteria,
      helperOutputLabels,
      forbiddenReviewContent,
      requiredTestBoundary: {
        syntheticFixturesOnly: true,
        realKisCredentialFixturesAllowed: false,
        rawAccountFixturesAllowed: false,
        rawOperatorFixturesAllowed: false,
        orderSubmissionFixturesAllowed: false,
      },
      requiredExecutionBoundary: {
        localOnly: true,
        networkAccessAllowed: false,
        providerClientImportsAllowed: false,
        commandLineRawSecretsAllowed: false,
        writesPermissionPacketByDefault: false,
      },
    },
    checks,
    evidence: {
      missingImplementationReviewCriteria,
      missingHelperOutputLabels,
      missingForbiddenReviewContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOrderPermissionHashHelperContractStatus: hashHelperContract.readiness?.status,
      manualOrderPermissionHashHelperPreflightStatus: hashHelperPreflight.readiness?.status,
      redactedManualOrderPermissionTemplateStatus: template.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: adapterPreflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureLocalHashHelperImplementationReview
        ? "contract_ready_pending_manual_order_permission_hash_helper_local_only_implementation_review"
        : "blocked_before_manual_order_permission_hash_helper_implementation_review_contract",
      readyForFutureLocalHashHelperImplementationReview,
      helperImplementationCreatedNow: false,
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
        ...(checks.hashHelperPreflightReady ? [] : ["manual_order_permission_hash_helper_preflight_not_ready"]),
        ...(checks.manualOrderPermissionTemplateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.liveGuardedAdapterPreflightStillBlocked
          ? []
          : ["live_guarded_order_adapter_preflight_not_blocked"]),
        ...(checks.templateSampleHasOutputLabels ? [] : ["template_sample_missing_helper_output_labels"]),
        ...missingImplementationReviewCriteria.map((criterion) => `missing_implementation_review_criterion_${criterion}`),
        ...missingHelperOutputLabels.map((label) => `missing_helper_output_label_${label}`),
        ...missingForbiddenReviewContent.map((content) => `missing_forbidden_review_content_${content}`),
        ...(checks.architectureDocMentionsImplementationReview
          ? []
          : ["architecture_doc_missing_manual_order_permission_hash_helper_implementation_review"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-hash-helper-implementation-review-contract.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-hash-helper-implementation-review-contract.cjs`,
      );
    }
    console.log("[generate-trading-manual-order-permission-hash-helper-implementation-review-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-hash-helper-implementation-review-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-hash-helper-implementation-review-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-hash-helper-implementation-review-contract] readyForFutureLocalHashHelperImplementationReview=${parsed.readiness.readyForFutureLocalHashHelperImplementationReview}`,
  );
}

main();
