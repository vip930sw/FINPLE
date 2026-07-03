const fs = require("node:fs");
const path = require("node:path");

const SUPPLY_GATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_review_result_supply_gate_contract.json",
);
const OUTPUTS = [
  {
    id: "recordingPreflight",
    step: "Step 116 owner evidence receipt review result recording preflight",
    contractVersion: "trading-lab-step116-owner-evidence-receipt-review-result-recording-preflight-v0.1",
    contractPath: path.join(
      "data",
      "processed",
      "trading_lab_step116_owner_evidence_receipt_review_result_recording_preflight_contract.json",
    ),
    status: "owner_evidence_receipt_review_result_recording_preflight_ready_fail_closed",
    nextGateName: "owner_evidence_receipt_review_result_recording_result_supply_gate",
  },
  {
    id: "recordingResultSupplyGate",
    step: "Step 116 owner evidence receipt review result recording result supply gate",
    contractVersion: "trading-lab-step116-owner-evidence-receipt-review-result-recording-result-supply-gate-v0.1",
    contractPath: path.join(
      "data",
      "processed",
      "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_supply_gate_contract.json",
    ),
    status: "owner_evidence_receipt_review_result_recording_result_supply_gate_ready_fail_closed",
    nextGateName: "owner_evidence_receipt_review_result_recording_result",
  },
  {
    id: "recordingResult",
    step: "Step 116 owner evidence receipt review result recording result",
    contractVersion: "trading-lab-step116-owner-evidence-receipt-review-result-recording-result-v0.1",
    contractPath: path.join(
      "data",
      "processed",
      "trading_lab_step116_owner_evidence_receipt_review_result_recording_result_contract.json",
    ),
    status: "owner_evidence_receipt_review_result_recording_result_ready_fail_closed_pending_owner_result",
    nextGateName: "read_only_provider_call_authorization_review_result_supply_gate",
  },
];

const AUDITED_AT = "2026-07-03T00:00:00Z";
const ALLOWED_REDACTED_RESULT_FIELDS = [
  "reviewResultStatus",
  "reviewerRole",
  "reviewedDate",
  "receiptItemCount",
  "redactionConfirmed",
  "noPrivateMaterialRecorded",
  "nextGateName",
];
const FORBIDDEN_REDACTED_RESULT_FIELDS = [
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
const FAIL_CLOSED_FIELDS = [
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "runtimeRouteAllowed",
  "publicUiAllowed",
  "dbMigrationAllowed",
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

function buildContract(output) {
  const supplyGate = readJson(SUPPLY_GATE_PATH);
  const forbidden = forbiddenArtifacts();
  const checks = {
    bundleManaged: true,
    supplyGateReady:
      supplyGate.readiness?.status === "owner_evidence_receipt_review_result_supply_gate_ready_fail_closed",
    reviewResultNotRecorded: true,
    actualPrivateEvidenceImported: false,
    allowedRedactedResultFieldsDocumented: ALLOWED_REDACTED_RESULT_FIELDS.length === 7,
    forbiddenRedactedResultFieldsDocumented: FORBIDDEN_REDACTED_RESULT_FIELDS.length > 0,
    failClosedFlagsStayFalse: allFalse(supplyGate.readiness, FAIL_CLOSED_FIELDS),
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };
  const blockers = [
    ...(checks.supplyGateReady ? [] : ["owner_evidence_receipt_review_result_supply_gate_not_ready"]),
    ...(checks.allowedRedactedResultFieldsDocumented ? [] : ["allowed_redacted_result_fields_missing"]),
    ...(checks.forbiddenRedactedResultFieldsDocumented ? [] : ["forbidden_redacted_result_fields_missing"]),
    ...(checks.failClosedFlagsStayFalse ? [] : ["fail_closed_flags_drifted_open"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: output.contractVersion,
    auditedAt: AUDITED_AT,
    step: output.step,
    scope: "repo_safe_owner_evidence_receipt_review_result_recording_bundle",
    sourceFiles: {
      ownerEvidenceReceiptReviewResultSupplyGate: SUPPLY_GATE_PATH,
    },
    outputFiles: {
      contract: output.contractPath,
    },
    currentState: {
      bundleManaged: true,
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
    redactedReviewResultSchema: {
      allowedFields: ALLOWED_REDACTED_RESULT_FIELDS,
      forbiddenFields: FORBIDDEN_REDACTED_RESULT_FIELDS,
      allowedReviewResultStatuses: ["owner_supplied_redacted_receipts_reviewed"],
      nextGateName: output.nextGateName,
    },
    checks,
    evidence: {
      forbiddenArtifacts: forbidden,
    },
    readiness: {
      status: blockers.length === 0 ? output.status : `blocked_before_${output.id}`,
      readyForReadOnlyProviderCallAuthorizationReviewResultSupplyGate:
        output.id === "recordingResult" && blockers.length === 0 ? false : false,
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
  const contracts = OUTPUTS.map((output) => [output.contractPath, buildContract(output)]);

  if (checkOnly) {
    for (const [filePath, contract] of contracts) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-trading-step116-owner-evidence-receipt-review-result-recording-bundle-contract.cjs`);
      }
      if (fs.readFileSync(filePath, "utf8") !== contract) {
        fail(`${filePath} is out of date; run node scripts/generate-trading-step116-owner-evidence-receipt-review-result-recording-bundle-contract.cjs`);
      }
    }
    console.log("[generate-trading-step116-owner-evidence-receipt-review-result-recording-bundle-contract] ok");
    return;
  }

  for (const [filePath, contract] of contracts) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contract);
  }
  console.log("[generate-trading-step116-owner-evidence-receipt-review-result-recording-bundle-contract] wrote contracts");
}

main();
