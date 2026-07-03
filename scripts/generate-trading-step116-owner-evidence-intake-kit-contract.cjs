const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_owner_evidence_intake_kit_contract.json");
const RUNBOOK_PATH = path.join("docs", "trading", "FINPLE_STEP116_OWNER_EVIDENCE_INTAKE_RUNBOOK_2026_07_03.md");
const INVENTORY_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_inventory_contract.json",
);
const BATCH_PLAN_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_remaining_operational_gate_batch_plan_contract.json",
);

const CONTRACT_VERSION = "trading-lab-step116-owner-evidence-intake-kit-v0.1";
const AUDITED_AT = "2026-07-03T00:00:00Z";

const OWNER_LOCAL_ITEMS = [
  "read_only_approval_packet_import_evidence",
  "read_only_provider_call_authorization_review_result",
  "manual_order_permission_packet_validation_import_evidence",
  "kill_switch_clearance_review_result",
  "risk_gate_clearance_review_result",
  "live_guarded_clearance_review_result_bundle",
];

const REQUIRED_RUNBOOK_PHRASES = [
  "Do not paste raw values, local file paths, hash values, credentials, account identifiers",
  "The repository may record only these non-sensitive receipt facts",
  "actual local file paths",
  "providerCallsAllowed=false",
  "orderSubmissionAllowed=false",
  "runtimeRouteAllowed=false",
  "publicUiAllowed=false",
  "dbMigrationAllowed=false",
  "Homepage or public dashboard work remains after live-guarded review",
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenArtifacts() {
  return FORBIDDEN_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function buildContract() {
  const runbook = readText(RUNBOOK_PATH);
  const inventory = readJson(INVENTORY_PATH);
  const batchPlan = readJson(BATCH_PLAN_PATH);
  const forbidden = forbiddenArtifacts();
  const missingRunbookPhrases = REQUIRED_RUNBOOK_PHRASES.filter((phrase) => !runbook.includes(phrase));
  const ownerRequired = batchPlan.batchPlan?.ownerRequiredBeforeRealUnlock ?? [];
  const checks = {
    contractOnly: true,
    runbookReady: missingRunbookPhrases.length === 0,
    remainingGateInventoryReady: inventory.readiness?.readyForRemainingOperationalGateReporting === true,
    remainingGateBatchPlanReady: batchPlan.readiness?.readyForBatchReporting === true,
    ownerLocalItemCount: OWNER_LOCAL_ITEMS.length,
    ownerRequiredGateCount: ownerRequired.length,
    ownerLocalItemCountMatchesOwnerRequiredGates: OWNER_LOCAL_ITEMS.length === ownerRequired.length,
    repoRecordsOnlyNonSensitiveReceiptFacts: true,
    repoDoesNotAcceptOwnerLocalPath: true,
    repoDoesNotRecordRawValues: true,
    repoDoesNotRecordHashValues: true,
    repoDoesNotRecordCredentials: true,
    repoDoesNotRecordAccountIdentifiers: true,
    forbiddenArtifactsAbsent: forbidden.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
  };
  const blockers = [
    ...(checks.runbookReady ? [] : ["owner_evidence_intake_runbook_missing_required_phrases"]),
    ...(checks.remainingGateInventoryReady ? [] : ["remaining_operational_gate_inventory_not_ready"]),
    ...(checks.remainingGateBatchPlanReady ? [] : ["remaining_operational_gate_batch_plan_not_ready"]),
    ...(checks.ownerLocalItemCountMatchesOwnerRequiredGates ? [] : ["owner_local_item_count_mismatch"]),
    ...forbidden.map((filePath) => `forbidden_artifact_present_${filePath}`),
  ];

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116 owner evidence intake kit",
    scope: "owner_evidence_intake_without_private_repo_artifacts",
    sourceFiles: {
      runbook: RUNBOOK_PATH,
      remainingOperationalGateInventory: INVENTORY_PATH,
      remainingOperationalGateBatchPlan: BATCH_PLAN_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      orderAuthorityExternalBlockerCleared: true,
      internalOperationalGatesRemaining: 20,
      ownerSuppliedPrivateEvidenceOrResultRequired: OWNER_LOCAL_ITEMS.length,
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
    repoSafeReceiptRules: {
      allowedReceiptFacts: [
        "item_label",
        "owner_confirmation_status",
        "redaction_status",
        "reviewer_role",
        "checked_date",
        "next_gate_name",
        "no_private_material_recorded_statement",
      ],
      forbiddenReceiptContent: [
        "actual_local_file_path",
        "raw_value",
        "hash_value",
        "credential",
        "account_identifier",
        "provider_payload",
        "order_payload",
        "private_packet_content",
      ],
    },
    checks,
    evidence: {
      missingRunbookPhrases,
      forbiddenArtifacts: forbidden,
    },
    readiness: {
      status: blockers.length === 0 ? "owner_evidence_intake_kit_ready_fail_closed" : "blocked_before_owner_evidence_intake_kit",
      readyForOwnerEvidenceIntake: blockers.length === 0,
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-owner-evidence-intake-kit-contract.cjs`);
    }
    if (fs.readFileSync(CONTRACT_PATH, "utf8") !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-owner-evidence-intake-kit-contract.cjs`);
    }
    console.log("[generate-trading-step116-owner-evidence-intake-kit-contract] ok");
    console.log(`[generate-trading-step116-owner-evidence-intake-kit-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  console.log("[generate-trading-step116-owner-evidence-intake-kit-contract] wrote contract");
}

main();
