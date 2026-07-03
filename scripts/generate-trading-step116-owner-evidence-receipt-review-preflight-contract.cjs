const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json",
);
const RECEIPT_SCHEMA_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_schema_contract.json",
);
const RECEIPT_PLACEHOLDER_BUNDLE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
);
const LIVE_UNBLOCK_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_trading_public_dashboard_unblock_preflight_contract.json",
);

const CONTRACT_VERSION = "trading-lab-step116-owner-evidence-receipt-review-preflight-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const REQUIRED_RECEIPT_ITEMS = [
  "read_only_approval_packet_import_evidence",
  "read_only_provider_call_authorization_review_result",
  "manual_order_permission_packet_validation_import_evidence",
  "kill_switch_clearance_review_result",
  "risk_gate_clearance_review_result",
  "live_guarded_clearance_review_result_bundle",
];

const REQUIRED_REVIEW_ASSERTIONS = [
  "review_result_must_be_owner_supplied_outside_repo",
  "review_result_must_not_include_actual_local_paths",
  "review_result_must_not_include_raw_values",
  "review_result_must_not_include_hash_values",
  "review_result_must_not_include_credentials",
  "review_result_must_not_include_account_identifiers",
  "review_result_must_not_include_provider_or_order_payloads",
  "review_result_cannot_enable_provider_calls_or_orders",
  "review_result_cannot_enable_runtime_routes_public_ui_or_db",
];

const FORBIDDEN_ARTIFACTS = [
  path.join("data", "processed", "scenario_monthly_returns.csv"),
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "tradingLiveGuardedWorker.js"),
  path.join("server", "src", "workers", "tradingLiveGuardedWorker.js"),
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function forbiddenArtifacts() {
  return FORBIDDEN_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function allFalse(object, fields) {
  return fields.every((field) => object?.[field] === false);
}

function buildContract() {
  const schema = readJson(RECEIPT_SCHEMA_PATH);
  const placeholderBundle = readJson(RECEIPT_PLACEHOLDER_BUNDLE_PATH);
  const liveUnblockPreflight = readJson(LIVE_UNBLOCK_PREFLIGHT_PATH);
  const receipts = placeholderBundle.receipts ?? [];
  const receiptItems = receipts.map((receipt) => receipt.itemLabel);
  const forbidden = forbiddenArtifacts();
  const forbiddenSchemaFields = schema.receiptSchema?.forbiddenFields ?? [];
  const failClosedFields = [
    "readyForReadOnlyProviderCalls",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
    "providerCallsAllowed",
    "orderSubmissionAllowed",
    "runtimeRouteAllowed",
    "publicUiAllowed",
    "dbMigrationAllowed",
  ];

  const checks = {
    preflightOnly: true,
    receiptSchemaReady: schema.readiness?.readyForRepoSafeReceiptPlaceholders === true,
    receiptPlaceholdersReady: placeholderBundle.readiness?.readyForOwnerEvidenceReceiptReview === true,
    liveUnblockPreflightReady:
      liveUnblockPreflight.readiness?.status === "live_trading_public_dashboard_unblock_preflight_ready_fail_closed",
    receiptItemCount: receipts.length,
    receiptItemsComplete: REQUIRED_RECEIPT_ITEMS.every((item) => receiptItems.includes(item)),
    allReceiptsArePlaceholders: receipts.every(
      (receipt) => receipt.ownerConfirmationStatus === "prepared_outside_repo_pending_receipt_review",
    ),
    allReceiptsDeclareNoPrivateMaterial: receipts.every((receipt) => receipt.noPrivateMaterialRecorded === true),
    allReceiptsAvoidForbiddenSchemaFields: receipts.every((receipt) =>
      Object.keys(receipt).every((field) => !forbiddenSchemaFields.includes(field)),
    ),
    failClosedFlagsStayFalse:
      allFalse(schema.readiness, failClosedFields) &&
      allFalse(placeholderBundle.readiness, failClosedFields) &&
      allFalse(liveUnblockPreflight.readiness, failClosedFields),
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };

  const blockers = [
    ...(checks.receiptSchemaReady ? [] : ["owner_evidence_receipt_schema_not_ready"]),
    ...(checks.receiptPlaceholdersReady ? [] : ["owner_evidence_receipt_placeholders_not_ready"]),
    ...(checks.liveUnblockPreflightReady ? [] : ["live_trading_public_dashboard_unblock_preflight_not_ready"]),
    ...(checks.receiptItemsComplete ? [] : ["owner_evidence_receipt_items_incomplete"]),
    ...(checks.allReceiptsArePlaceholders ? [] : ["owner_evidence_receipts_not_placeholder_status"]),
    ...(checks.allReceiptsDeclareNoPrivateMaterial ? [] : ["owner_evidence_receipts_private_material_recorded"]),
    ...(checks.allReceiptsAvoidForbiddenSchemaFields ? [] : ["owner_evidence_receipts_forbidden_schema_field_present"]),
    ...(checks.failClosedFlagsStayFalse ? [] : ["fail_closed_flags_drifted_open"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 owner evidence receipt review preflight",
    scope: "repo_safe_owner_evidence_receipt_review_preflight",
    sourceFiles: {
      ownerEvidenceReceiptSchema: RECEIPT_SCHEMA_PATH,
      ownerEvidenceReceiptPlaceholderBundle: RECEIPT_PLACEHOLDER_BUNDLE_PATH,
      liveTradingPublicDashboardUnblockPreflight: LIVE_UNBLOCK_PREFLIGHT_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      preflightOnly: true,
      ownerEvidenceReceiptReviewResultRecorded: false,
      actualPrivateEvidenceImported: false,
      actualTradingImplementationAllowed: false,
      publicDashboardImplementationAllowed: false,
      homepageRouterChangeAllowed: false,
      actualLiveTradingReadiness: false,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
    },
    requiredReviewAssertions: REQUIRED_REVIEW_ASSERTIONS,
    checks,
    evidence: {
      forbiddenArtifacts: forbidden,
      receiptItems,
    },
    readiness: {
      status:
        blockers.length === 0
          ? "owner_evidence_receipt_review_preflight_ready_fail_closed"
          : "blocked_before_owner_evidence_receipt_review_preflight",
      readyForOwnerEvidenceReceiptReviewResultSupplyGate: blockers.length === 0,
      readyForActualTradingImplementation: false,
      readyForPublicDashboardImplementation: false,
      readyForHomepageRouterChange: false,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      blockers,
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-owner-evidence-receipt-review-preflight-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-owner-evidence-receipt-review-preflight-contract.cjs`);
    }
    console.log("[generate-trading-step116-owner-evidence-receipt-review-preflight-contract] ok");
    console.log(`[generate-trading-step116-owner-evidence-receipt-review-preflight-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-owner-evidence-receipt-review-preflight-contract] wrote contract");
}

main();
