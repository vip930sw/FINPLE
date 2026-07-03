const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_owner_evidence_receipt_placeholder_bundle_contract.json",
);
const SCHEMA_PATH = path.join("data", "processed", "trading_lab_step116_owner_evidence_receipt_schema_contract.json");
const INTAKE_KIT_PATH = path.join("data", "processed", "trading_lab_step116_owner_evidence_intake_kit_contract.json");

const CONTRACT_VERSION = "trading-lab-step116-owner-evidence-receipt-placeholder-bundle-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const RECEIPT_PLACEHOLDERS = [
  ["read_only_approval_packet_import_evidence", "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet"],
  ["read_only_provider_call_authorization_review_result", "read_only_provider_call_authorization_review_result_not_owner_supplied"],
  ["manual_order_permission_packet_validation_import_evidence", "manual_order_permission_packet_not_imported"],
  ["kill_switch_clearance_review_result", "kill_switch_clearance_not_recorded_for_order_submission"],
  ["risk_gate_clearance_review_result", "risk_gate_clearance_not_recorded_for_order_submission"],
  ["live_guarded_clearance_review_result_bundle", "live_guarded_clearance_review_result_bundle_not_owner_supplied"],
];

const PRIVATE_MATERIAL_PROHIBITED = [
  "actual_local_file_path",
  "raw_value",
  "hash_value",
  "credential",
  "account_identifier",
  "provider_payload",
  "order_payload",
  "private_packet_content",
];

const FORBIDDEN_ARTIFACTS = [
  path.join("data", "processed", "scenario_monthly_returns.csv"),
  path.join("server", "src", "routes", "trading"),
  path.join("server", "src", "services", "trading", "kisOrderAdapter.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
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

function buildPlaceholder([itemLabel, nextGateName]) {
  return {
    itemLabel,
    ownerConfirmationStatus: "prepared_outside_repo_pending_receipt_review",
    redactionStatus: "owner_local_redacted_not_recorded_in_repo",
    reviewerRole: "owner",
    checkedDate: "2026-07-03",
    nextGateName,
    noPrivateMaterialRecorded: true,
    privateMaterialProhibited: PRIVATE_MATERIAL_PROHIBITED,
  };
}

function hasForbiddenField(receipt, forbiddenFields) {
  return Object.keys(receipt).some((field) => forbiddenFields.includes(field));
}

function buildContract() {
  const schema = readJson(SCHEMA_PATH);
  const intakeKit = readJson(INTAKE_KIT_PATH);
  const receipts = RECEIPT_PLACEHOLDERS.map(buildPlaceholder);
  const forbidden = forbiddenArtifacts();
  const schemaForbiddenFields = schema.receiptSchema?.forbiddenFields ?? [];
  const checks = {
    contractOnly: true,
    receiptSchemaReady: schema.readiness?.readyForRepoSafeReceiptPlaceholders === true,
    intakeKitReady: intakeKit.readiness?.readyForOwnerEvidenceIntake === true,
    placeholderCount: receipts.length,
    placeholderCountMatchesOwnerItems: receipts.length === (intakeKit.ownerLocalOnlyIntakeItems ?? []).length,
    allReceiptsDeclareNoPrivateMaterialRecorded: receipts.every((receipt) => receipt.noPrivateMaterialRecorded === true),
    allReceiptsAvoidForbiddenSchemaFields: receipts.every((receipt) => !hasForbiddenField(receipt, schemaForbiddenFields)),
    allReceiptsRemainPlaceholders: receipts.every(
      (receipt) => receipt.ownerConfirmationStatus === "prepared_outside_repo_pending_receipt_review",
    ),
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };
  const blockers = [
    ...(checks.receiptSchemaReady ? [] : ["owner_evidence_receipt_schema_not_ready"]),
    ...(checks.intakeKitReady ? [] : ["owner_evidence_intake_kit_not_ready"]),
    ...(checks.placeholderCountMatchesOwnerItems ? [] : ["owner_evidence_receipt_placeholder_count_mismatch"]),
    ...(checks.allReceiptsDeclareNoPrivateMaterialRecorded ? [] : ["owner_evidence_receipt_private_material_recorded"]),
    ...(checks.allReceiptsAvoidForbiddenSchemaFields ? [] : ["owner_evidence_receipt_forbidden_field_present"]),
    ...(checks.allReceiptsRemainPlaceholders ? [] : ["owner_evidence_receipt_not_placeholder_status"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 owner evidence receipt placeholder bundle",
    scope: "repo_safe_owner_evidence_receipt_placeholders",
    sourceFiles: {
      ownerEvidenceReceiptSchema: SCHEMA_PATH,
      ownerEvidenceIntakeKit: INTAKE_KIT_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      ownerLocalEvidencePreparedOutsideRepo: true,
      repoSafeReceiptPlaceholdersRecorded: blockers.length === 0,
      actualPrivateEvidenceImported: false,
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
    receipts,
    checks,
    evidence: {
      forbiddenArtifacts: forbidden,
    },
    readiness: {
      status:
        blockers.length === 0
          ? "owner_evidence_receipt_placeholders_ready_fail_closed_pending_receipt_review"
          : "blocked_before_owner_evidence_receipt_placeholders",
      readyForOwnerEvidenceReceiptReview: blockers.length === 0,
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-owner-evidence-receipt-placeholder-bundle-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-owner-evidence-receipt-placeholder-bundle-contract.cjs`);
    }
    console.log("[generate-trading-step116-owner-evidence-receipt-placeholder-bundle-contract] ok");
    console.log(`[generate-trading-step116-owner-evidence-receipt-placeholder-bundle-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-owner-evidence-receipt-placeholder-bundle-contract] wrote contract");
}

main();
