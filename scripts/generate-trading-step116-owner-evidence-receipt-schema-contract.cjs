const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_owner_evidence_receipt_schema_contract.json");
const INTAKE_KIT_PATH = path.join("data", "processed", "trading_lab_step116_owner_evidence_intake_kit_contract.json");
const RUNBOOK_PATH = path.join("docs", "trading", "FINPLE_STEP116_OWNER_EVIDENCE_INTAKE_RUNBOOK_2026_07_03.md");

const CONTRACT_VERSION = "trading-lab-step116-owner-evidence-receipt-schema-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const OWNER_LOCAL_ITEMS = [
  "read_only_approval_packet_import_evidence",
  "read_only_provider_call_authorization_review_result",
  "manual_order_permission_packet_validation_import_evidence",
  "kill_switch_clearance_review_result",
  "risk_gate_clearance_review_result",
  "live_guarded_clearance_review_result_bundle",
];

const ALLOWED_RECEIPT_FIELDS = [
  "itemLabel",
  "ownerConfirmationStatus",
  "redactionStatus",
  "reviewerRole",
  "checkedDate",
  "nextGateName",
  "noPrivateMaterialRecorded",
  "privateMaterialProhibited",
];

const FORBIDDEN_RECEIPT_FIELDS = [
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

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function forbiddenArtifacts() {
  return FORBIDDEN_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const intakeKit = readJson(INTAKE_KIT_PATH);
  const runbook = readText(RUNBOOK_PATH);
  const forbidden = forbiddenArtifacts();
  const intakeItems = intakeKit.ownerLocalOnlyIntakeItems ?? [];
  const checks = {
    contractOnly: true,
    intakeKitReady: intakeKit.readiness?.readyForOwnerEvidenceIntake === true,
    runbookMentionsReceiptRules: runbook.includes("Repo-Safe Receipt Rules"),
    ownerLocalItemCount: intakeItems.length,
    ownerLocalItemCountStable: intakeItems.length === OWNER_LOCAL_ITEMS.length,
    allowedReceiptFieldsOnlyNonSensitive: true,
    forbiddenReceiptFieldsEnumerated: FORBIDDEN_RECEIPT_FIELDS.length >= 8,
    schemaDoesNotAcceptPrivatePath: true,
    schemaDoesNotAcceptRawValues: true,
    schemaDoesNotAcceptHashValues: true,
    schemaDoesNotAcceptCredentials: true,
    schemaDoesNotAcceptAccountIdentifiers: true,
    schemaDoesNotAcceptProviderOrOrderPayloads: true,
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };
  const blockers = [
    ...(checks.intakeKitReady ? [] : ["owner_evidence_intake_kit_not_ready"]),
    ...(checks.runbookMentionsReceiptRules ? [] : ["owner_evidence_runbook_missing_receipt_rules"]),
    ...(checks.ownerLocalItemCountStable ? [] : ["owner_local_item_count_changed"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 owner evidence receipt schema",
    scope: "repo_safe_owner_evidence_receipt_schema",
    sourceFiles: {
      ownerEvidenceIntakeKit: INTAKE_KIT_PATH,
      runbook: RUNBOOK_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      ownerLocalEvidencePreparedOutsideRepo: true,
      receiptSchemaReady: blockers.length === 0,
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
    ownerLocalOnlyIntakeItems: OWNER_LOCAL_ITEMS,
    receiptSchema: {
      allowedFields: ALLOWED_RECEIPT_FIELDS,
      forbiddenFields: FORBIDDEN_RECEIPT_FIELDS,
      requiredAssertions: [
        "owner_confirmation_status_is_present",
        "redaction_status_is_present",
        "checked_date_is_present",
        "no_private_material_recorded_is_true",
        "private_material_prohibited_list_is_present",
      ],
      allowedOwnerConfirmationStatuses: ["prepared_outside_repo_pending_receipt_review"],
      allowedRedactionStatuses: ["owner_local_redacted_not_recorded_in_repo"],
    },
    checks,
    evidence: {
      forbiddenArtifacts: forbidden,
    },
    readiness: {
      status: blockers.length === 0 ? "owner_evidence_receipt_schema_ready_fail_closed" : "blocked_before_owner_evidence_receipt_schema",
      readyForRepoSafeReceiptPlaceholders: blockers.length === 0,
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-owner-evidence-receipt-schema-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-owner-evidence-receipt-schema-contract.cjs`);
    }
    console.log("[generate-trading-step116-owner-evidence-receipt-schema-contract] ok");
    console.log(`[generate-trading-step116-owner-evidence-receipt-schema-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-owner-evidence-receipt-schema-contract] wrote contract");
}

main();
