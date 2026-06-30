const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
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
const ORDER_ADAPTER_DESIGN_REVIEW_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kis_order_adapter_design_review.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-redacted-manual-order-permission-template-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_TEMPLATE_FIELDS = [
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
const REQUIRED_TEMPLATE_ASSERTIONS = [
  "template_is_redacted_only",
  "template_does_not_create_private_packet",
  "template_requires_live_guarded_mode",
  "template_requires_time_box",
  "template_requires_operator_access_hash",
  "template_requires_manual_approval_policy_hash",
  "template_requires_kill_switch_clearance_hash",
  "template_requires_risk_gate_clearance_hash",
  "template_requires_order_credential_boundary_hash",
  "template_requires_dry_run_replay_hash",
  "template_requires_shadow_history_review_hash",
  "template_requires_audit_logger_readiness_hash",
  "template_forbids_secret_values",
  "template_forbids_raw_order_payloads",
  "template_does_not_enable_provider_calls",
  "template_does_not_enable_order_submission",
  "template_does_not_create_runtime_route",
];
const FORBIDDEN_TEMPLATE_CONTENT = [
  "access_token",
  "app_secret",
  "app_key",
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
  const permissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const validatorFixtures = readJson(MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH);
  const liveGuardedAdapterPreflight = readJson(LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH);
  const orderAdapterDesignReview = readJson(ORDER_ADAPTER_DESIGN_REVIEW_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const templateFields = [...REQUIRED_TEMPLATE_FIELDS];
  const templateAssertions = [...REQUIRED_TEMPLATE_ASSERTIONS];
  const forbiddenTemplateContent = [...FORBIDDEN_TEMPLATE_CONTENT];
  const requiredPermissionFields = permissionPreflight.futureManualOrderPermissionBoundary?.requiredPermissionFields ?? [];
  const missingTemplateFields = missingValues(templateFields, REQUIRED_TEMPLATE_FIELDS);
  const missingPreflightFields = missingValues(templateFields, requiredPermissionFields);
  const missingTemplateAssertions = missingValues(templateAssertions, REQUIRED_TEMPLATE_ASSERTIONS);
  const missingForbiddenTemplateContent = missingValues(forbiddenTemplateContent, FORBIDDEN_TEMPLATE_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    templateOnly: true,
    permissionPreflightReady:
      permissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      permissionPreflight.readiness?.manualOrderPermissionImportedNow === false &&
      permissionPreflight.readiness?.manualOrderPermissionImportImplementationAllowed === false &&
      permissionPreflight.readiness?.providerCallsAllowed === false &&
      permissionPreflight.readiness?.orderSubmissionAllowed === false &&
      permissionPreflight.readiness?.runtimeRouteAllowed === false,
    validatorFixturesReady:
      validatorFixtures.readiness?.readyForManualOrderPermissionFixtureRegression === true &&
      validatorFixtures.readiness?.providerCallsAllowed === false &&
      validatorFixtures.readiness?.orderSubmissionAllowed === false &&
      validatorFixtures.readiness?.permissionImportAllowed === false,
    liveGuardedAdapterPreflightStillBlocked:
      liveGuardedAdapterPreflight.readiness?.readyForFutureLiveGuardedOrderAdapterImplementationReview === false &&
      liveGuardedAdapterPreflight.readiness?.orderAdapterImplementationAllowedNow === false &&
      liveGuardedAdapterPreflight.readiness?.providerCallsAllowed === false &&
      liveGuardedAdapterPreflight.readiness?.orderSubmissionAllowed === false &&
      liveGuardedAdapterPreflight.readiness?.runtimeRouteAllowed === false,
    orderAdapterDesignReviewReady:
      orderAdapterDesignReview.readiness?.readyForFutureOrderAdapterImplementationReview === true &&
      orderAdapterDesignReview.readiness?.adapterImplementationAllowed === false &&
      orderAdapterDesignReview.readiness?.providerCallsAllowed === false &&
      orderAdapterDesignReview.readiness?.orderSubmissionAllowed === false,
    templateFieldsReady: missingTemplateFields.length === 0,
    matchesManualOrderPermissionPreflightFields: missingPreflightFields.length === 0,
    templateAssertionsReady: missingTemplateAssertions.length === 0,
    forbiddenTemplateContentReady: missingForbiddenTemplateContent.length === 0,
    architectureDocMentionsManualOrderPermissionTemplate:
      architectureDoc.includes("Trading Redacted Manual Order Permission Template") &&
      architectureDoc.includes("redacted_manual_order_permission_template"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    permissionPacketCreatedNow: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerRedactedManualOrderPermissionPreparation =
    checks.permissionPreflightReady &&
    checks.validatorFixturesReady &&
    checks.liveGuardedAdapterPreflightStillBlocked &&
    checks.orderAdapterDesignReviewReady &&
    checks.templateFieldsReady &&
    checks.matchesManualOrderPermissionPreflightFields &&
    checks.templateAssertionsReady &&
    checks.forbiddenTemplateContentReady &&
    checks.architectureDocMentionsManualOrderPermissionTemplate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-3V",
    scope: "redacted_manual_order_permission_template",
    sourceFiles: {
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      manualOrderPermissionValidatorFixtures: MANUAL_ORDER_PERMISSION_VALIDATOR_FIXTURES_PATH,
      liveGuardedOrderAdapterImplementationPreflight: LIVE_GUARDED_ORDER_ADAPTER_PREFLIGHT_PATH,
      orderAdapterDesignReview: ORDER_ADAPTER_DESIGN_REVIEW_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      templateOnly: true,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      orderAdapterImplementationAllowedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    futureRedactedManualOrderPermissionTemplate: {
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepCreatesPacket: false,
      currentStepImportsPacket: false,
      requiredTemplateFields: templateFields,
      requiredTemplateAssertions: templateAssertions,
      forbiddenTemplateContent,
      placeholderRules: [
        "approvedByHash must be a labelled hash, never a real operator name",
        "operatorAccessHash must reference separately reviewed private operator access evidence",
        "allowedSymbolHashes must contain labelled hashes, not raw account holdings or ticker lists with source context",
        "maxOrderNotional, dailyLossLimit, and orderAttemptLimit must be reviewed caps, not recommendations",
        "permission success cannot override kill switch, risk gate, or manual approval",
        "provider/order/runtime/UI allow flags must remain false in this template",
      ],
      sampleRedactedShape: {
        permissionId: "permission_<opaque_id>",
        mode: "live_guarded",
        approvedByHash: "hmac-sha256:<operator_hash>",
        approvedAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
        expiresAt: "YYYY-MM-DDTHH:mm:ss.sssZ",
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
        maxOrderNotional: 100000,
        dailyLossLimit: 10000,
        orderAttemptLimit: 3,
        revocationPlanHash: "hmac-sha256:<revocation_plan_hash>",
        redactionVersion: "v1",
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        runtimeRouteAllowed: false,
        publicUiAllowed: false,
      },
    },
    checks,
    evidence: {
      missingTemplateFields,
      missingPreflightFields,
      missingTemplateAssertions,
      missingForbiddenTemplateContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOrderPermissionPreflightStatus: permissionPreflight.readiness?.status,
      manualOrderPermissionValidatorFixturesStatus: validatorFixtures.readiness?.status,
      liveGuardedOrderAdapterImplementationPreflightStatus: liveGuardedAdapterPreflight.readiness?.status,
      orderAdapterDesignReviewStatus: orderAdapterDesignReview.readiness?.status,
    },
    readiness: {
      status: readyForOwnerRedactedManualOrderPermissionPreparation
        ? "template_ready_for_owner_redacted_manual_order_permission_preparation"
        : "blocked_before_redacted_manual_order_permission_template",
      readyForOwnerRedactedManualOrderPermissionPreparation,
      permissionPacketCreatedNow: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.permissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.validatorFixturesReady ? [] : ["manual_order_permission_validator_fixtures_not_ready"]),
        ...(checks.liveGuardedAdapterPreflightStillBlocked
          ? []
          : ["live_guarded_order_adapter_preflight_not_blocked"]),
        ...(checks.orderAdapterDesignReviewReady ? [] : ["order_adapter_design_review_not_ready"]),
        ...missingTemplateFields.map((field) => `missing_template_field_${field}`),
        ...missingPreflightFields.map((field) => `missing_preflight_field_${field}`),
        ...missingTemplateAssertions.map((assertion) => `missing_template_assertion_${assertion}`),
        ...missingForbiddenTemplateContent.map((content) => `missing_forbidden_template_content_${content}`),
        ...(checks.architectureDocMentionsManualOrderPermissionTemplate
          ? []
          : ["architecture_doc_missing_redacted_manual_order_permission_template"]),
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
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-manual-order-permission-template.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-manual-order-permission-template.cjs`,
      );
    }
    console.log("[generate-trading-redacted-manual-order-permission-template] ok");
    console.log(`[generate-trading-redacted-manual-order-permission-template] contract=${CONTRACT_PATH}`);
    return;
  }
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-manual-order-permission-template] wrote contract");
  console.log(
    `[generate-trading-redacted-manual-order-permission-template] readyForOwnerRedactedManualOrderPermissionPreparation=${parsed.readiness.readyForOwnerRedactedManualOrderPermissionPreparation}`,
  );
}

main();
