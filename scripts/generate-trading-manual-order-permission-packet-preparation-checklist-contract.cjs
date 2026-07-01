const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
);
const MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_preflight.json",
);
const REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
);
const HASH_PREPARATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
);
const PACKET_VALIDATION_RUNBOOK_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
);
const VALIDATION_RESULT_RECEIPT_REVIEW_RESULT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
);
const IMPORT_IMPLEMENTATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
);
const LIVE_GUARDED_CLEARANCE_BUNDLE_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
);
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-manual-order-permission-packet-preparation-checklist-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const FUTURE_PERMISSION_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "manual_order_permission.redacted.json",
);
const REQUIRED_CHECKLIST_ITEMS = [
  "explicit_owner_request_required",
  "prepare_private_packet_outside_repo",
  "use_redacted_manual_order_permission_template",
  "use_hash_preparation_runbook_for_hashes_only",
  "verify_no_raw_account_or_operator_values",
  "verify_no_api_keys_or_access_tokens",
  "verify_live_guarded_mode_only",
  "verify_time_boxed_permission",
  "verify_allowed_symbol_hashes_only",
  "verify_max_order_notional_and_daily_loss_limit_reviewed",
  "verify_kill_switch_clearance_hash_placeholder_present",
  "verify_risk_gate_clearance_hash_placeholder_present",
  "verify_dry_run_replay_hash_placeholder_present",
  "verify_shadow_history_review_hash_placeholder_present",
  "keep_provider_order_runtime_ui_flags_false",
  "run_validation_later_with_explicit_owner_local_path",
  "record_validation_result_receipt_later_without_paths_or_raw_values",
  "do_not_import_permission_packet_in_this_step",
  "do_not_call_kis_or_any_provider",
  "do_not_submit_orders",
];
const REQUIRED_PACKET_FIELD_GROUPS = [
  "identity_and_timebox",
  "operator_and_policy_hashes",
  "clearance_hashes",
  "risk_limit_caps",
  "allowed_symbol_hashes",
  "revocation_plan_hash",
  "fail_closed_flags",
];
const FORBIDDEN_CHECKLIST_CONTENT = [
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
  path.join("server", "src", "services", "trading", "manualOrderPermissionImport.js"),
  path.join("server", "src", "services", "trading", "manualOrderPermission.js"),
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
  const manualOrderPermissionPreflight = readJson(MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH);
  const redactedTemplate = readJson(REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE_PATH);
  const hashPreparationRunbook = readJson(HASH_PREPARATION_RUNBOOK_PATH);
  const packetValidationRunbook = readJson(PACKET_VALIDATION_RUNBOOK_PATH);
  const validationResultReceiptReviewResult = readJson(VALIDATION_RESULT_RECEIPT_REVIEW_RESULT_PATH);
  const importImplementationPreflight = readJson(IMPORT_IMPLEMENTATION_PREFLIGHT_PATH);
  const liveGuardedClearanceBundle = readJson(LIVE_GUARDED_CLEARANCE_BUNDLE_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const checklistItems = [...REQUIRED_CHECKLIST_ITEMS];
  const packetFieldGroups = [...REQUIRED_PACKET_FIELD_GROUPS];
  const forbiddenChecklistContent = [...FORBIDDEN_CHECKLIST_CONTENT];
  const missingChecklistItems = missingValues(checklistItems, REQUIRED_CHECKLIST_ITEMS);
  const missingPacketFieldGroups = missingValues(packetFieldGroups, REQUIRED_PACKET_FIELD_GROUPS);
  const missingForbiddenChecklistContent = missingValues(forbiddenChecklistContent, FORBIDDEN_CHECKLIST_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    checklistOnly: true,
    manualOrderPermissionPreflightReady:
      manualOrderPermissionPreflight.readiness?.readyForFutureManualOrderPermissionImportReview === true &&
      manualOrderPermissionPreflight.readiness?.orderSubmissionAllowed === false &&
      manualOrderPermissionPreflight.readiness?.providerCallsAllowed === false,
    redactedTemplateReady:
      redactedTemplate.readiness?.readyForOwnerRedactedManualOrderPermissionPreparation === true &&
      redactedTemplate.readiness?.permissionPacketCreatedNow === false &&
      redactedTemplate.readiness?.permissionPacketImportedNow === false,
    hashPreparationRunbookReady:
      hashPreparationRunbook.readiness?.readyForOwnerAssistedHashPreparationRunbookReview === true &&
      hashPreparationRunbook.readiness?.rawInputsRequestedNow === false &&
      hashPreparationRunbook.readiness?.hashGenerationAllowed === false &&
      hashPreparationRunbook.readiness?.permissionPacketCreatedNow === false,
    packetValidationRunbookReady:
      packetValidationRunbook.readiness?.readyForOwnerAssistedValidationRunbookReview === true &&
      packetValidationRunbook.readiness?.currentStepRunsValidator === false &&
      packetValidationRunbook.readiness?.currentStepReadsPrivatePacket === false &&
      packetValidationRunbook.readiness?.permissionPacketImportedNow === false,
    validationResultReceiptReviewResultReady:
      validationResultReceiptReviewResult.readiness
        ?.readyForFutureManualOrderPermissionValidationResultReceiptReviewResult === true &&
      validationResultReceiptReviewResult.readiness?.permissionPacketImportedNow === false &&
      validationResultReceiptReviewResult.readiness?.orderSubmissionAllowed === false,
    importImplementationPreflightStillBlocked:
      importImplementationPreflight.readiness?.readyForFutureManualOrderPermissionImportImplementationReview === false &&
      importImplementationPreflight.readiness?.ownerPacketReadAllowedNow === false &&
      importImplementationPreflight.readiness?.permissionPacketImportedNow === false &&
      importImplementationPreflight.readiness?.orderSubmissionAllowed === false,
    liveGuardedClearanceBundleReady:
      liveGuardedClearanceBundle.readiness?.readyForFutureLiveGuardedClearanceReviewResultBundle === true &&
      liveGuardedClearanceBundle.readiness?.currentStepReadsPrivateEvidence === false &&
      liveGuardedClearanceBundle.readiness?.orderSubmissionAllowed === false,
    checklistItemsReady: missingChecklistItems.length === 0,
    packetFieldGroupsReady: missingPacketFieldGroups.length === 0,
    forbiddenChecklistContentReady: missingForbiddenChecklistContent.length === 0,
    architectureDocMentionsPacketPreparationChecklist:
      architectureDoc.includes("Trading Manual Order Permission Packet Preparation Checklist") &&
      architectureDoc.includes("manual_order_permission_packet_preparation_checklist"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    currentStepCreatesPermissionPacket: false,
    currentStepReadsPrivatePacket: false,
    currentStepRunsValidator: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };
  const readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist =
    checks.manualOrderPermissionPreflightReady &&
    checks.redactedTemplateReady &&
    checks.hashPreparationRunbookReady &&
    checks.packetValidationRunbookReady &&
    checks.validationResultReceiptReviewResultReady &&
    checks.importImplementationPreflightStillBlocked &&
    checks.liveGuardedClearanceBundleReady &&
    checks.checklistItemsReady &&
    checks.packetFieldGroupsReady &&
    checks.forbiddenChecklistContentReady &&
    checks.architectureDocMentionsPacketPreparationChecklist &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-5V",
    scope: "manual_order_permission_packet_preparation_checklist",
    sourceFiles: {
      manualOrderPermissionPreflight: MANUAL_ORDER_PERMISSION_PREFLIGHT_PATH,
      redactedManualOrderPermissionTemplate: REDACTED_MANUAL_ORDER_PERMISSION_TEMPLATE_PATH,
      manualOrderPermissionHashPreparationRunbook: HASH_PREPARATION_RUNBOOK_PATH,
      manualOrderPermissionPacketValidationRunbook: PACKET_VALIDATION_RUNBOOK_PATH,
      manualOrderPermissionValidationResultReceiptReviewResult: VALIDATION_RESULT_RECEIPT_REVIEW_RESULT_PATH,
      manualOrderPermissionImportImplementationPreflight: IMPORT_IMPLEMENTATION_PREFLIGHT_PATH,
      liveGuardedClearanceReviewResultBundle: LIVE_GUARDED_CLEARANCE_BUNDLE_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      checklistOnly: true,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    futureOwnerAssistedPacketPreparationChecklist: {
      futurePermissionPacketPath: FUTURE_PERMISSION_PACKET_PATH,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepImportsPermissionPacket: false,
      requiredChecklistItems: checklistItems,
      requiredPacketFieldGroups: packetFieldGroups,
      forbiddenChecklistContent,
      ownerSafetyBoundary:
        "prepare the redacted manual order permission packet only after a separate owner action, outside repo commits, with hashes and caps only",
      nextEligibleReviewAfterOwnerPreparation: [
        "owner_supplied_explicit_local_packet_path",
        "manual_order_permission_packet_validation_result_receipt",
        "manual_order_permission_validation_result_receipt_review_result",
        "manual_order_permission_import_implementation_preflight_recheck",
      ],
    },
    checks,
    evidence: {
      missingChecklistItems,
      missingPacketFieldGroups,
      missingForbiddenChecklistContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      manualOrderPermissionPreflightStatus: manualOrderPermissionPreflight.readiness?.status,
      redactedTemplateStatus: redactedTemplate.readiness?.status,
      hashPreparationRunbookStatus: hashPreparationRunbook.readiness?.status,
      packetValidationRunbookStatus: packetValidationRunbook.readiness?.status,
      validationResultReceiptReviewResultStatus: validationResultReceiptReviewResult.readiness?.status,
      importImplementationPreflightStatus: importImplementationPreflight.readiness?.status,
      liveGuardedClearanceBundleStatus: liveGuardedClearanceBundle.readiness?.status,
    },
    readiness: {
      status: readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist
        ? "checklist_ready_pending_owner_assisted_manual_order_permission_packet_preparation"
        : "blocked_before_manual_order_permission_packet_preparation_checklist",
      readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist,
      currentStepCreatesPermissionPacket: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.manualOrderPermissionPreflightReady ? [] : ["manual_order_permission_preflight_not_ready"]),
        ...(checks.redactedTemplateReady ? [] : ["redacted_manual_order_permission_template_not_ready"]),
        ...(checks.hashPreparationRunbookReady ? [] : ["manual_order_permission_hash_preparation_runbook_not_ready"]),
        ...(checks.packetValidationRunbookReady ? [] : ["manual_order_permission_packet_validation_runbook_not_ready"]),
        ...(checks.validationResultReceiptReviewResultReady
          ? []
          : ["manual_order_permission_validation_result_receipt_review_result_not_ready"]),
        ...(checks.importImplementationPreflightStillBlocked
          ? []
          : ["manual_order_permission_import_preflight_opened_too_early"]),
        ...(checks.liveGuardedClearanceBundleReady ? [] : ["live_guarded_clearance_bundle_not_ready"]),
        ...missingChecklistItems.map((item) => `missing_checklist_item_${item}`),
        ...missingPacketFieldGroups.map((group) => `missing_packet_field_group_${group}`),
        ...missingForbiddenChecklistContent.map((item) => `missing_forbidden_checklist_content_${item}`),
        ...(checks.architectureDocMentionsPacketPreparationChecklist
          ? []
          : ["architecture_doc_missing_manual_order_permission_packet_preparation_checklist"]),
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
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-manual-order-permission-packet-preparation-checklist-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-manual-order-permission-packet-preparation-checklist-contract.cjs`);
    }
    console.log("[generate-trading-manual-order-permission-packet-preparation-checklist-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-packet-preparation-checklist-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-manual-order-permission-packet-preparation-checklist-contract] wrote contract");
  console.log(
    `[generate-trading-manual-order-permission-packet-preparation-checklist-contract] readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist=${parsed.readiness.readyForOwnerAssistedManualOrderPermissionPacketPreparationChecklist}`,
  );
}

main();
