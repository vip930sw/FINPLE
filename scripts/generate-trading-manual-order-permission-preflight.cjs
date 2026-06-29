const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const KIS_ORDER_ADAPTER_DESIGN_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_order_adapter_design_review.json",
);
const MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
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
const ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_order_credential_boundary_contract.json",
);
const PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-preflight-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const REQUIRED_PERMISSION_FIELDS = [
  "permissionId",
  "mode",
  "approvedByHash",
  "approvedAt",
  "expiresAt",
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
  "maxOrderNotional",
  "dailyLossLimit",
  "orderAttemptLimit",
  "revocationPlanHash",
  "redactionVersion",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
];
const REQUIRED_PERMISSION_ASSERTIONS = [
  "permission_is_time_boxed",
  "permission_is_operator_attributed_hash_only",
  "permission_requires_private_operator_access",
  "permission_requires_manual_approval_for_each_order",
  "permission_requires_kill_switch_clearance",
  "permission_requires_risk_gate_clearance",
  "permission_requires_order_credential_boundary",
  "permission_requires_shadow_history_review",
  "permission_requires_dry_run_replay",
  "permission_does_not_override_kill_switch",
  "permission_does_not_override_risk_gate",
  "permission_success_does_not_submit_orders",
  "permission_success_does_not_create_runtime_route",
];
const FORBIDDEN_PERMISSION_CONTENT = [
  "access_token",
  "app_secret",
  "full_account_number",
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
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "tradingManualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
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
  const policy = readJson(POLICY_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const orderAdapterDesignReview = readJson(KIS_ORDER_ADAPTER_DESIGN_REVIEW_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const killSwitchClearanceContract = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const riskGateClearanceContract = readJson(RISK_GATE_CLEARANCE_CONTRACT_PATH);
  const orderCredentialBoundaryContract = readJson(ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH);
  const privateShadowOperatorAccessContract = readJson(PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const liveGuardedMode = (policy.modes ?? []).find((mode) => mode.mode === "live_guarded") ?? {};
  const permissionFields = [...REQUIRED_PERMISSION_FIELDS];
  const permissionAssertions = [...REQUIRED_PERMISSION_ASSERTIONS];
  const forbiddenPermissionContent = [...FORBIDDEN_PERMISSION_CONTENT];
  const missingPermissionFields = missingValues(permissionFields, REQUIRED_PERMISSION_FIELDS);
  const missingPermissionAssertions = missingValues(permissionAssertions, REQUIRED_PERMISSION_ASSERTIONS);
  const missingForbiddenPermissionContent = missingValues(forbiddenPermissionContent, FORBIDDEN_PERMISSION_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    liveGuardedPolicyReady:
      liveGuardedMode.mode === "live_guarded" &&
      liveGuardedMode.externalOrderCall === true &&
      liveGuardedMode.requiresManualApproval === true &&
      liveGuardedMode.requiresKillSwitchClear === true &&
      liveGuardedMode.requiresDryRunReplay === true,
    orderAdapterDesignReviewReady:
      orderAdapterDesignReview.readiness?.readyForFutureOrderAdapterImplementationReview === true &&
      orderAdapterDesignReview.readiness?.adapterImplementationAllowed === false &&
      orderAdapterDesignReview.readiness?.providerCallsAllowed === false &&
      orderAdapterDesignReview.readiness?.orderSubmissionAllowed === false &&
      orderAdapterDesignReview.readiness?.dbMigrationAllowed === false &&
      orderAdapterDesignReview.readiness?.publicUiAllowed === false &&
      orderAdapterDesignReview.readiness?.liveTradingAllowed === false,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApprovalContract.readiness?.manualApprovalImplementationAllowed === false &&
      manualOperatorApprovalContract.readiness?.providerCallsAllowed === false &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
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
    orderCredentialBoundaryContractReady:
      orderCredentialBoundaryContract.readiness?.readyForFutureOrderCredentialImplementationReview === true &&
      orderCredentialBoundaryContract.readiness?.credentialStoreImplementationAllowed === false &&
      orderCredentialBoundaryContract.readiness?.providerCallsAllowed === false &&
      orderCredentialBoundaryContract.readiness?.orderSubmissionAllowed === false,
    privateShadowOperatorAccessContractReady:
      privateShadowOperatorAccessContract.readiness
        ?.readyForFuturePrivateShadowOperatorAccessImplementationReview === true &&
      privateShadowOperatorAccessContract.readiness?.privateShadowOperatorAccessImplementationAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.providerCallsAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.orderSubmissionAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.runtimeRouteAllowed === false &&
      privateShadowOperatorAccessContract.readiness?.publicUiAllowed === false,
    permissionFieldsReady: missingPermissionFields.length === 0,
    permissionAssertionsReady: missingPermissionAssertions.length === 0,
    forbiddenPermissionContentReady: missingForbiddenPermissionContent.length === 0,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    preflightStillDisablesDbMigration: preflight.readiness?.dbMigrationAllowed === false,
    architectureDocMentionsManualOrderPermission:
      architectureDoc.includes("Trading Manual Order Permission Preflight") &&
      architectureDoc.includes("manual_order_permission_preflight"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    manualOrderPermissionImportedNow: false,
    manualOrderPermissionImportImplementationAllowed: false,
    orderAdapterImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForFutureManualOrderPermissionImportReview =
    checks.liveGuardedPolicyReady &&
    checks.orderAdapterDesignReviewReady &&
    checks.manualOperatorApprovalContractReady &&
    checks.killSwitchClearanceContractReady &&
    checks.riskGateClearanceContractReady &&
    checks.orderCredentialBoundaryContractReady &&
    checks.privateShadowOperatorAccessContractReady &&
    checks.permissionFieldsReady &&
    checks.permissionAssertionsReady &&
    checks.forbiddenPermissionContentReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.preflightStillDisablesDbMigration &&
    checks.architectureDocMentionsManualOrderPermission &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2C",
    scope: "trading_manual_order_permission_preflight",
    sourceFiles: {
      policy: POLICY_PATH,
      preflight: PREFLIGHT_PATH,
      orderAdapterDesignReview: KIS_ORDER_ADAPTER_DESIGN_REVIEW_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      riskGateClearanceContract: RISK_GATE_CLEARANCE_CONTRACT_PATH,
      orderCredentialBoundaryContract: ORDER_CREDENTIAL_BOUNDARY_CONTRACT_PATH,
      privateShadowOperatorAccessContract: PRIVATE_SHADOW_OPERATOR_ACCESS_CONTRACT_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      manualOrderPermissionImportedNow: false,
      manualOrderPermissionImportImplementationAllowed: false,
      orderAdapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      productionSecretsRequiredNow: false,
    },
    futureManualOrderPermissionBoundary: {
      scope: "manual_order_permission_preflight",
      futurePermissionPacketPath: path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
      purpose:
        "define the redacted manual order permission evidence required before any future KIS order adapter implementation review can consider live_guarded order submission",
      requiredPermissionFields: permissionFields,
      requiredPermissionAssertions: permissionAssertions,
      forbiddenPermissionContent,
      packetRules: {
        currentStepCreatesPacket: false,
        packetMustBeRedacted: true,
        operatorIdentityMustBeHashOnly: true,
        accountIdentifierMustBeHashOnly: true,
        secretValuesAllowed: false,
        rawOrderPayloadAllowed: false,
        rawProviderPayloadAllowed: false,
        liveEndpointAllowedInCurrentStep: false,
      },
      promotionRules: [
        "manual order permission preflight success does not import permission evidence",
        "manual order permission preflight success does not implement the KIS order adapter",
        "manual order permission preflight success does not enable provider calls or order submission",
        "future permission import cannot override kill switch, risk gate, per-order manual approval, or operator access checks",
      ],
    },
    checks,
    evidence: {
      liveGuardedMode,
      missingPermissionFields,
      missingPermissionAssertions,
      missingForbiddenPermissionContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      orderAdapterDesignReviewStatus: orderAdapterDesignReview.readiness?.status,
      manualOperatorApprovalContractStatus: manualOperatorApprovalContract.readiness?.status,
      killSwitchClearanceContractStatus: killSwitchClearanceContract.readiness?.status,
      riskGateClearanceContractStatus: riskGateClearanceContract.readiness?.status,
      orderCredentialBoundaryContractStatus: orderCredentialBoundaryContract.readiness?.status,
      privateShadowOperatorAccessContractStatus: privateShadowOperatorAccessContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureManualOrderPermissionImportReview
        ? "preflight_ready_pending_manual_order_permission_evidence"
        : "blocked_before_manual_order_permission_preflight",
      readyForFutureManualOrderPermissionImportReview,
      manualOrderPermissionImportedNow: false,
      manualOrderPermissionImportImplementationAllowed: false,
      orderAdapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.liveGuardedPolicyReady ? [] : ["live_guarded_policy_not_ready"]),
        ...(checks.orderAdapterDesignReviewReady ? [] : ["order_adapter_design_review_not_ready"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.riskGateClearanceContractReady ? [] : ["risk_gate_clearance_contract_not_ready"]),
        ...(checks.orderCredentialBoundaryContractReady ? [] : ["order_credential_boundary_contract_not_ready"]),
        ...(checks.privateShadowOperatorAccessContractReady
          ? []
          : ["private_shadow_operator_access_contract_not_ready"]),
        ...missingPermissionFields.map((field) => `missing_permission_field_${field}`),
        ...missingPermissionAssertions.map((assertion) => `missing_permission_assertion_${assertion}`),
        ...missingForbiddenPermissionContent.map((content) => `missing_forbidden_permission_content_${content}`),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...(checks.preflightStillDisablesDbMigration ? [] : ["preflight_allows_db_migration"]),
        ...(checks.architectureDocMentionsManualOrderPermission
          ? []
          : ["architecture_doc_missing_manual_order_permission_boundary"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-preflight.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-preflight.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-preflight] ok");
    console.log(`[generate-trading-manual-order-permission-preflight] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-preflight] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-preflight] readyForFutureManualOrderPermissionImportReview=${parsed.readiness.readyForFutureManualOrderPermissionImportReview}`,
  );
}

main();
