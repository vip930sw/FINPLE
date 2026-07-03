const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json",
);
const PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_review_preflight_contract.json",
);
const RECEIPT_PLACEHOLDER_BUNDLE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
);

const CONTRACT_VERSION = "trading-lab-step116-owner-evidence-receipt-review-result-supply-gate-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const ALLOWED_REVIEW_RESULT_FIELDS = [
  "reviewResultStatus",
  "reviewerRole",
  "reviewedDate",
  "receiptItemCount",
  "redactionConfirmed",
  "noPrivateMaterialRecorded",
  "nextGateName",
];

const FORBIDDEN_REVIEW_RESULT_FIELDS = [
  "actualLocalFilePath",
  "rawValue",
  "hashValue",
  "credential",
  "accountIdentifier",
  "providerPayload",
  "orderPayload",
  "privatePacketContent",
  "privatePacketPath",
  "validationReceiptPath",
  "appKey",
  "appSecret",
  "accessToken",
  "accountNumber",
  "orderConfirmation",
  "executionId",
  "fillPayload",
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
  const preflight = readJson(PREFLIGHT_PATH);
  const placeholderBundle = readJson(RECEIPT_PLACEHOLDER_BUNDLE_PATH);
  const forbidden = forbiddenArtifacts();
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
    supplyGateOnly: true,
    ownerEvidenceReceiptReviewPreflightReady:
      preflight.readiness?.readyForOwnerEvidenceReceiptReviewResultSupplyGate === true,
    receiptPlaceholderBundleReady: placeholderBundle.readiness?.readyForOwnerEvidenceReceiptReview === true,
    receiptItemCount: (placeholderBundle.receipts ?? []).length,
    receiptItemCountExpected: (placeholderBundle.receipts ?? []).length === 6,
    reviewResultNotRecorded: true,
    allowedReviewResultFieldsDocumented: ALLOWED_REVIEW_RESULT_FIELDS.length === 7,
    forbiddenReviewResultFieldsDocumented: FORBIDDEN_REVIEW_RESULT_FIELDS.length > 0,
    failClosedFlagsStayFalse: allFalse(preflight.readiness, failClosedFields) && allFalse(placeholderBundle.readiness, failClosedFields),
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };

  const blockers = [
    ...(checks.ownerEvidenceReceiptReviewPreflightReady ? [] : ["owner_evidence_receipt_review_preflight_not_ready"]),
    ...(checks.receiptPlaceholderBundleReady ? [] : ["owner_evidence_receipt_placeholder_bundle_not_ready"]),
    ...(checks.receiptItemCountExpected ? [] : ["owner_evidence_receipt_item_count_unexpected"]),
    ...(checks.allowedReviewResultFieldsDocumented ? [] : ["owner_evidence_receipt_review_result_allowed_fields_missing"]),
    ...(checks.forbiddenReviewResultFieldsDocumented ? [] : ["owner_evidence_receipt_review_result_forbidden_fields_missing"]),
    ...(checks.failClosedFlagsStayFalse ? [] : ["fail_closed_flags_drifted_open"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 owner evidence receipt review result supply gate",
    scope: "repo_safe_owner_evidence_receipt_review_result_supply_gate",
    sourceFiles: {
      ownerEvidenceReceiptReviewPreflight: PREFLIGHT_PATH,
      ownerEvidenceReceiptPlaceholderBundle: RECEIPT_PLACEHOLDER_BUNDLE_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      supplyGateOnly: true,
      ownerEvidenceReceiptReviewResultSupplyGateOpen: blockers.length === 0,
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
    reviewResultSchema: {
      allowedFields: ALLOWED_REVIEW_RESULT_FIELDS,
      forbiddenFields: FORBIDDEN_REVIEW_RESULT_FIELDS,
      allowedReviewResultStatuses: ["owner_supplied_redacted_receipts_reviewed"],
      nextGateName: "read_only_provider_call_authorization_review_result_supply_gate",
    },
    checks,
    evidence: {
      forbiddenArtifacts: forbidden,
    },
    readiness: {
      status:
        blockers.length === 0
          ? "owner_evidence_receipt_review_result_supply_gate_ready_fail_closed"
          : "blocked_before_owner_evidence_receipt_review_result_supply_gate",
      readyForOwnerEvidenceReceiptReviewResultRecordingPreflight: false,
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-owner-evidence-receipt-review-result-supply-gate-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-owner-evidence-receipt-review-result-supply-gate-contract.cjs`);
    }
    console.log("[generate-trading-step116-owner-evidence-receipt-review-result-supply-gate-contract] ok");
    console.log(`[generate-trading-step116-owner-evidence-receipt-review-result-supply-gate-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-owner-evidence-receipt-review-result-supply-gate-contract] wrote contract");
}

main();
