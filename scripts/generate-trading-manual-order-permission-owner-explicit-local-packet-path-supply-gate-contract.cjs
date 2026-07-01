const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract.json",
);
const INTAKE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
);
const VALIDATION_RESULT_RECEIPT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-packet.cjs");
const RECEIPT_VALIDATOR_PATH = path.join("scripts", "validate-trading-manual-order-permission-validation-result-receipt.cjs");
const PROGRESS_SUMMARY_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION =
  "trading-lab-step116-manual-order-permission-owner-explicit-local-packet-path-supply-gate-v0.1";
const AUDITED_AT = "2026-07-01T00:00:00Z";
const OWNER_LOCAL_PACKET_PATH_PLACEHOLDER = "<owner-local-redacted-packet-path>";
const NEXT_VALIDATION_COMMAND =
  "node scripts/validate-trading-manual-order-permission-packet.cjs --packet <owner-local-redacted-packet-path> --now <ISO-timestamp>";
const REQUIRED_PATH_HANDLING_RULES = [
  "owner_must_supply_explicit_local_path_at_execution_time",
  "repo_must_not_store_actual_owner_local_path",
  "repo_must_not_store_private_packet",
  "repo_must_not_store_validation_receipt_in_this_step",
  "logs_and_docs_use_placeholder_only",
  "validator_may_run_only_in_next_step_after_owner_path_is_supplied",
  "validation_success_may_create_redacted_receipt_later_without_packet_path",
  "provider_order_runtime_ui_db_flags_remain_false",
];
const FORBIDDEN_REPO_CONTENT = [
  "actual_owner_local_packet_path",
  "private_packet_path",
  "app_key",
  "app_secret",
  "access_token",
  "full_account_number",
  "raw_account_identifier",
  "raw_operator_identifier",
  "raw_order_payload",
  "raw_provider_payload",
  "validator_output_with_raw_values",
  "packet_hash_inputs",
  "order_confirmation",
  "execution_id",
  "fill_payload",
  "live_order_endpoint",
  "scenario_monthly_return_row",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_hash_inputs.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission_validation_result_receipt.redacted.json"),
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

function statusOf(report) {
  return report.readiness?.status ?? report.status ?? null;
}

function buildContract() {
  const intakeContract = readJson(INTAKE_CONTRACT_PATH);
  const validationResultReceipt = readJson(VALIDATION_RESULT_RECEIPT_PATH);
  const progressSummary = readJson(PROGRESS_SUMMARY_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const pathHandlingRules = [...REQUIRED_PATH_HANDLING_RULES];
  const forbiddenRepoContent = [...FORBIDDEN_REPO_CONTENT];
  const missingPathHandlingRules = missingValues(pathHandlingRules, REQUIRED_PATH_HANDLING_RULES);
  const missingForbiddenRepoContent = missingValues(forbiddenRepoContent, FORBIDDEN_REPO_CONTENT);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();

  const checks = {
    contractOnly: true,
    intakeReady:
      intakeContract.readiness?.readyForOwnerSuppliedExplicitLocalPacketValidation === true &&
      intakeContract.readiness?.readyForManualOrderPermissionValidationReceiptWithExplicitLocalPath === true &&
      intakeContract.readiness?.currentStepRecordsPacketPath === false &&
      intakeContract.readiness?.currentStepRunsValidator === false &&
      intakeContract.readiness?.currentStepRecordsValidationReceipt === false,
    validationReceiptStillFutureOnly:
      validationResultReceipt.readiness?.readyForFutureManualOrderPermissionValidationResultReceiptReview === true &&
      validationResultReceipt.readiness?.validationReceiptRecordedNow === false &&
      validationResultReceipt.readiness?.packetPathRecorded === false &&
      validationResultReceipt.readiness?.rawValuesRecorded === false &&
      validationResultReceipt.readiness?.permissionPacketImportedNow === false,
    validatorsPresent: fs.existsSync(VALIDATOR_PATH) && fs.existsSync(RECEIPT_VALIDATOR_PATH),
    progressSummaryStillFailClosed:
      progressSummary.readiness?.contractStackReady === true &&
      progressSummary.readiness?.readyForOrderSubmission === false &&
      progressSummary.readiness?.orderSubmissionAllowed === false,
    pathHandlingRulesReady: missingPathHandlingRules.length === 0,
    forbiddenRepoContentReady: missingForbiddenRepoContent.length === 0,
    architectureDocMentionsOwnerExplicitLocalPacketPathSupplyGate:
      architectureDoc.includes("Trading Manual Order Permission Owner Explicit Local Packet Path Supply Gate") &&
      architectureDoc.includes("manual_order_permission_owner_explicit_local_packet_path_supply_gate"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    ownerLocalPacketPathSuppliedNow: false,
    ownerLocalPacketPathRecordedInRepo: false,
    currentStepReadsPrivatePacket: false,
    currentStepRunsValidator: false,
    currentStepRecordsValidationReceipt: false,
    permissionPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    liveTradingAllowed: false,
  };

  const readyForOwnerExplicitLocalPacketPathSupply =
    checks.intakeReady &&
    checks.validationReceiptStillFutureOnly &&
    checks.validatorsPresent &&
    checks.progressSummaryStillFailClosed &&
    checks.pathHandlingRulesReady &&
    checks.forbiddenRepoContentReady &&
    checks.architectureDocMentionsOwnerExplicitLocalPacketPathSupplyGate &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-6C",
    scope: "manual_order_permission_owner_explicit_local_packet_path_supply_gate",
    sourceFiles: {
      explicitLocalPacketValidationReceiptIntake: INTAKE_CONTRACT_PATH,
      manualOrderPermissionValidationResultReceipt: VALIDATION_RESULT_RECEIPT_PATH,
      manualOrderPermissionPacketValidator: VALIDATOR_PATH,
      manualOrderPermissionValidationResultReceiptValidator: RECEIPT_VALIDATOR_PATH,
      progressSummary: PROGRESS_SUMMARY_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: { contract: CONTRACT_PATH },
    currentState: {
      contractOnly: true,
      ownerLocalPacketPathSuppliedNow: false,
      ownerLocalPacketPathRecordedInRepo: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
    },
    ownerExplicitLocalPacketPathSupplyGate: {
      ownerLocalPacketPathPlaceholder: OWNER_LOCAL_PACKET_PATH_PLACEHOLDER,
      nextValidationCommand: NEXT_VALIDATION_COMMAND,
      acceptedInputBoundary:
        "owner may supply an explicit local redacted packet path at execution time only; repo files must keep placeholder-only wording",
      nextAllowedAction:
        "run the local packet validator with the owner-supplied explicit local path, then convert validator output into a redacted validation result receipt without storing packet paths or raw values",
      pathHandlingRules,
      forbiddenRepoContent,
      pendingExternalInput: "owner_explicit_local_redacted_packet_path",
    },
    checks,
    evidence: {
      missingPathHandlingRules,
      missingForbiddenRepoContent,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      intakeStatus: statusOf(intakeContract),
      validationResultReceiptStatus: statusOf(validationResultReceipt),
      progressSummaryStatus: statusOf(progressSummary),
    },
    readiness: {
      status: readyForOwnerExplicitLocalPacketPathSupply
        ? "owner_explicit_local_packet_path_supply_gate_ready_pending_owner_path"
        : "blocked_before_owner_explicit_local_packet_path_supply_gate",
      readyForOwnerExplicitLocalPacketPathSupply,
      readyForManualOrderPermissionValidationReceiptAfterOwnerPath: readyForOwnerExplicitLocalPacketPathSupply,
      ownerLocalPacketPathSuppliedNow: false,
      ownerLocalPacketPathRecordedInRepo: false,
      currentStepReadsPrivatePacket: false,
      currentStepRunsValidator: false,
      currentStepRecordsValidationReceipt: false,
      permissionPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      runtimeRouteAllowed: false,
      publicUiAllowed: false,
      dbMigrationAllowed: false,
      liveTradingAllowed: false,
      pendingExternalInputs: ["owner_explicit_local_redacted_packet_path"],
      blockers: [
        ...(checks.intakeReady ? [] : ["explicit_local_packet_validation_receipt_intake_not_ready"]),
        ...(checks.validationReceiptStillFutureOnly ? [] : ["validation_result_receipt_no_longer_future_only"]),
        ...(checks.validatorsPresent ? [] : ["manual_order_permission_validators_missing"]),
        ...(checks.progressSummaryStillFailClosed ? [] : ["progress_summary_no_longer_fail_closed"]),
        ...missingPathHandlingRules.map((rule) => `missing_path_handling_rule_${rule}`),
        ...missingForbiddenRepoContent.map((content) => `missing_forbidden_repo_content_${content}`),
        ...(checks.architectureDocMentionsOwnerExplicitLocalPacketPathSupplyGate
          ? []
          : ["architecture_doc_missing_owner_explicit_local_packet_path_supply_gate"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const expected = buildContract();
  if (process.argv.includes("--check")) {
    const actual = fs.existsSync(CONTRACT_PATH) ? fs.readFileSync(CONTRACT_PATH, "utf8") : "";
    if (actual !== expected) {
      fail(`${CONTRACT_PATH} is out of date`);
    }
    console.log("[generate-trading-manual-order-permission-owner-explicit-local-packet-path-supply-gate-contract] ok");
    console.log(
      `[generate-trading-manual-order-permission-owner-explicit-local-packet-path-supply-gate-contract] contract=${CONTRACT_PATH}`,
    );
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, expected);
  const parsed = JSON.parse(expected);
  console.log(
    "[generate-trading-manual-order-permission-owner-explicit-local-packet-path-supply-gate-contract] wrote contract",
  );
  console.log(
    `[generate-trading-manual-order-permission-owner-explicit-local-packet-path-supply-gate-contract] readyForOwnerExplicitLocalPacketPathSupply=${parsed.readiness.readyForOwnerExplicitLocalPacketPathSupply}`,
  );
}

main();
