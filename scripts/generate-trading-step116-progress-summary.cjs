const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const PACKAGE_JSON_PATH = "package.json";
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);
const CONTRACT_VERSION = "trading-lab-step116-progress-summary-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";

const TRACKED_READINESS_CONTRACTS = [
  ["step1160Preflight", "Step 116-0 preflight", "trading_lab_step1160_preflight.json"],
  ["storeSchemaDraft", "Trading store schema draft", "trading_lab_step116_store_schema_draft.json"],
  ["shadowMode", "Shadow-mode read-only contract", "trading_lab_step116_shadow_mode_contract.json"],
  ["orderAdapterDesignReview", "KIS order adapter design review", "trading_lab_step116_kis_order_adapter_design_review.json"],
  ["envReadiness", "Trading env readiness", "trading_lab_step116_env_readiness_contract.json"],
  ["envRiskGate", "Trading env risk gate", "trading_lab_step116_env_risk_gate_contract.json"],
  ["dryRunReplay", "Dry-run replay contract", "trading_lab_step116_dry_run_replay_contract.json"],
  ["shadowHistoryReview", "Shadow history review contract", "trading_lab_step116_shadow_history_review_contract.json"],
  ["auditLoggerReadiness", "Audit logger readiness", "trading_lab_step116_audit_logger_readiness_contract.json"],
  ["manualOperatorApproval", "Manual operator approval", "trading_lab_step116_manual_operator_approval_contract.json"],
  ["killSwitchClearance", "Kill-switch clearance", "trading_lab_step116_kill_switch_clearance_contract.json"],
  ["orderCredentialBoundary", "Order credential boundary", "trading_lab_step116_order_credential_boundary_contract.json"],
  ["riskGateClearance", "Risk-gate clearance", "trading_lab_step116_risk_gate_clearance_contract.json"],
  ["privateShadowRuntimePreflight", "Private shadow runtime preflight", "trading_lab_step116_private_shadow_runtime_preflight.json"],
  ["readOnlyApprovalIntake", "Read-only approval intake", "trading_lab_step116_read_only_approval_intake_contract.json"],
  ["readOnlyApprovalImportPreflight", "Read-only approval import preflight", "trading_lab_step116_read_only_approval_import_preflight.json"],
  ["readOnlyProviderRequestEnvelope", "Read-only provider request envelope", "trading_lab_step116_read_only_provider_request_envelope_contract.json"],
  [
    "readOnlyProviderRequestEnvelopeValidation",
    "Read-only provider request envelope validation",
    "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json",
  ],
  [
    "readOnlyProviderRequestEnvelopeValidationPreflight",
    "Read-only provider request envelope validation preflight",
    "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
  ],
  ["readOnlyProviderResponseEnvelope", "Read-only provider response envelope", "trading_lab_step116_read_only_provider_response_envelope_contract.json"],
  ["readOnlySnapshotNormalization", "Read-only snapshot normalization", "trading_lab_step116_read_only_snapshot_normalization_contract.json"],
  ["readOnlySnapshotRiskInput", "Read-only snapshot risk input", "trading_lab_step116_read_only_snapshot_risk_input_contract.json"],
  ["privateShadowOrderIntent", "Private shadow order intent", "trading_lab_step116_private_shadow_order_intent_contract.json"],
  ["privateShadowIntentAuditEvent", "Private shadow intent audit event", "trading_lab_step116_private_shadow_intent_audit_event_contract.json"],
  ["privateShadowRuntimeReviewPacket", "Private shadow runtime review packet", "trading_lab_step116_private_shadow_runtime_review_packet_contract.json"],
  ["privateShadowOperatorAccess", "Private shadow operator access", "trading_lab_step116_private_shadow_operator_access_contract.json"],
  ["manualOrderPermissionPreflight", "Manual order permission preflight", "trading_lab_step116_manual_order_permission_preflight.json"],
  ["mockApprovalEvidenceReceipt", "Mock approval evidence receipt", "trading_lab_step116_mock_approval_evidence_receipt.json"],
  ["redactedReadOnlyApprovalTemplate", "Redacted read-only approval template", "trading_lab_step116_redacted_read_only_approval_template.json"],
  ["redactedApprovalHashHelper", "Redacted approval hash helper", "trading_lab_step116_redacted_approval_hash_helper_contract.json"],
  ["redactedApprovalHashHelperPreflight", "Redacted approval hash helper preflight", "trading_lab_step116_redacted_approval_hash_helper_preflight.json"],
  ["redactedApprovalPacketValidation", "Redacted approval packet validation", "trading_lab_step116_redacted_approval_packet_validation_contract.json"],
  ["redactedApprovalPacketValidationPreflight", "Redacted approval packet validation preflight", "trading_lab_step116_redacted_approval_packet_validation_preflight.json"],
  ["redactedApprovalPacketValidatorFixtures", "Redacted approval packet validator fixtures", "trading_lab_step116_redacted_approval_packet_validator_fixtures.json"],
  [
    "privateReadOnlyProviderImplementationPreflight",
    "Private read-only provider implementation preflight",
    "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
  ],
  [
    "privateDbStorageImplementationPreflight",
    "Private DB storage implementation preflight",
    "trading_lab_step116_private_db_storage_implementation_preflight.json",
  ],
  [
    "privateRuntimeRouteImplementationPreflight",
    "Private runtime route implementation preflight",
    "trading_lab_step116_private_runtime_route_implementation_preflight.json",
  ],
  [
    "privateOperatorAccessImplementationPreflight",
    "Private operator access implementation preflight",
    "trading_lab_step116_private_operator_access_implementation_preflight.json",
  ],
  [
    "privateShadowRuntimeImplementationPreflight",
    "Private shadow runtime implementation preflight",
    "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  ],
];

const REQUIRED_NPM_SCRIPTS = [
  "check:trading-lab-step1160",
  "check:trading-lab-policy",
  "check:trading-paper-ledger",
  "check:trading-risk-engine",
  "check:trading-store-schema-draft",
  "check:trading-shadow-mode-contract",
  "check:trading-kis-order-adapter-design",
  "check:trading-env-readiness",
  "check:trading-env-values",
  "check:trading-env-risk-gate",
  "check:trading-dry-run-replay",
  "check:trading-shadow-history-review",
  "check:trading-audit-logger-readiness",
  "check:trading-manual-operator-approval",
  "check:trading-kill-switch-clearance",
  "check:trading-order-credential-boundary",
  "check:trading-risk-gate-clearance",
  "check:trading-private-shadow-runtime-preflight",
  "check:trading-read-only-approval-intake",
  "check:trading-read-only-approval-import-preflight",
  "check:trading-read-only-provider-request-envelope",
  "check:trading-read-only-provider-request-envelope-validation",
  "check:trading-read-only-provider-request-envelope-validation-preflight",
  "check:trading-read-only-provider-request-envelope-validator",
  "check:trading-read-only-provider-response-envelope",
  "check:trading-read-only-snapshot-normalization",
  "check:trading-read-only-snapshot-risk-input",
  "check:trading-read-only-snapshot-risk-input-validator",
  "check:trading-private-shadow-order-intent",
  "check:trading-private-shadow-order-intent-validator",
  "check:trading-private-shadow-intent-audit-event",
  "check:trading-private-shadow-intent-audit-event-validator",
  "check:trading-private-shadow-runtime-review-packet",
  "check:trading-private-shadow-runtime-review-packet-validator",
  "check:trading-private-shadow-operator-access",
  "check:trading-private-shadow-operator-access-validator",
  "check:trading-manual-order-permission",
  "check:trading-manual-order-permission-validator",
  "check:trading-mock-approval-evidence",
  "check:trading-mock-approval-evidence-validator",
  "check:trading-redacted-read-only-approval-template",
  "check:trading-redacted-read-only-approval-template-validator",
  "check:trading-redacted-approval-hash-helper",
  "check:trading-redacted-approval-hash-helper-validator",
  "check:trading-redacted-approval-hash-helper-preflight",
  "check:trading-redacted-approval-hash-helper-preflight-validator",
  "check:trading-redacted-approval-packet-validation",
  "check:trading-redacted-approval-packet-validation-preflight",
  "check:trading-redacted-approval-packet-validator",
  "check:trading-redacted-approval-packet-validator-fixtures",
  "check:trading-private-read-only-provider-implementation-preflight",
  "check:trading-private-db-storage-implementation-preflight",
  "check:trading-private-runtime-route-implementation-preflight",
  "check:trading-private-operator-access-implementation-preflight",
  "check:trading-private-shadow-runtime-implementation-preflight",
];

const FORBIDDEN_ALLOW_FLAGS = [
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "dbMigrationAllowed",
  "publicUiAllowed",
  "runtimeRouteAllowed",
  "liveTradingAllowed",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "tradingShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "shadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateOperatorAccess.js"),
  path.join("server", "src", "services", "tradingReadOnlyProvider.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
];
const FORBIDDEN_SCENARIO_ARTIFACT = path.join("data", "processed", "scenario_monthly_returns.csv");
const REMAINING_TRADING_GATES = [
  "owner_redacted_read_only_approval_packet_not_imported",
  "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
  "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
  "private_operator_access_implementation_review_blocked_pending_private_runtime_review",
  "db_storage_review_blocked_pending_private_runtime_review",
  "runtime_route_review_blocked_pending_private_runtime_review",
  "manual_order_permission_packet_not_imported",
  "kill_switch_clearance_not_recorded_for_order_submission",
  "risk_gate_clearance_not_recorded_for_order_submission",
  "live_guarded_order_adapter_implementation_review_not_started",
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
  return [...FORBIDDEN_RUNTIME_ARTIFACTS, FORBIDDEN_SCENARIO_ARTIFACT].filter((filePath) => fs.existsSync(filePath));
}

function getAllowFlagViolations(report) {
  const containers = [report.readiness, report.currentState].filter(Boolean);
  return containers.flatMap((container) =>
    FORBIDDEN_ALLOW_FLAGS.filter((flag) => container[flag] === true).map((flag) => `${flag}=true`),
  );
}

function summarizeContract([id, title, fileName]) {
  const filePath = path.join("data", "processed", fileName);
  const report = readJson(filePath);
  const readiness = report.readiness ?? {};
  const blockers = Array.isArray(readiness.blockers) ? readiness.blockers : [];
  const allowFlagViolations = getAllowFlagViolations(report);
  const ready =
    typeof readiness.status === "string" &&
    !readiness.status.startsWith("blocked") &&
    blockers.length === 0 &&
    allowFlagViolations.length === 0;

  return {
    id,
    title,
    filePath,
    status: readiness.status ?? null,
    ready,
    blockers,
    allowFlagViolations,
  };
}

function buildContract() {
  const packageJson = readJson(PACKAGE_JSON_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const milestones = TRACKED_READINESS_CONTRACTS.map(summarizeContract);
  const readyMilestones = milestones.filter((milestone) => milestone.ready);
  const missingNpmScripts = missingValues(Object.keys(packageJson.scripts ?? {}), REQUIRED_NPM_SCRIPTS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    summaryOnly: true,
    trackedContractsReady: readyMilestones.length === milestones.length,
    npmScriptsReady: missingNpmScripts.length === 0,
    architectureDocMentionsProgressSummary:
      architectureDoc.includes("Trading Step 116 Progress Summary") &&
      architectureDoc.includes("trading_lab_step116_progress_summary"),
    scenarioMonthlyReturnsCsvAbsent: !fs.existsSync(FORBIDDEN_SCENARIO_ARTIFACT),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const contractStackReady =
    checks.trackedContractsReady &&
    checks.npmScriptsReady &&
    checks.architectureDocMentionsProgressSummary &&
    checks.scenarioMonthlyReturnsCsvAbsent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2L",
    scope: "trading_step116_progress_summary",
    sourceFiles: {
      packageJson: PACKAGE_JSON_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
      trackedContracts: Object.fromEntries(
        TRACKED_READINESS_CONTRACTS.map(([id, , fileName]) => [id, path.join("data", "processed", fileName)]),
      ),
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      summaryOnly: true,
      contractStackReady,
      readyForReadOnlyProviderCalls: false,
      readyForPrivateShadowRuntime: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    progress: {
      trackedContractsTotal: milestones.length,
      trackedContractsReady: readyMilestones.length,
      trackedContractsRemaining: milestones.length - readyMilestones.length,
      requiredNpmScriptsTotal: REQUIRED_NPM_SCRIPTS.length,
      requiredNpmScriptsMissing: missingNpmScripts.length,
      completionRatio: Number((readyMilestones.length / milestones.length).toFixed(4)),
      phase: contractStackReady
        ? "private_paper_shadow_contract_stack_ready_pending_private_evidence_and_implementation_reviews"
        : "private_paper_shadow_contract_stack_incomplete",
    },
    milestones,
    remainingTradingGates: REMAINING_TRADING_GATES,
    checks,
    evidence: {
      missingNpmScripts,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      scenarioMonthlyReturnsCsvPath: FORBIDDEN_SCENARIO_ARTIFACT,
      failedMilestones: milestones.filter((milestone) => !milestone.ready).map((milestone) => milestone.id),
    },
    readiness: {
      status: contractStackReady
        ? "summary_ready_contract_stack_fail_closed_pending_private_trading_reviews"
        : "blocked_before_step116_progress_summary",
      contractStackReady,
      readyForReadOnlyProviderCalls: false,
      readyForPrivateShadowRuntime: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.trackedContractsReady ? [] : ["tracked_contracts_not_ready"]),
        ...(checks.npmScriptsReady ? [] : ["required_npm_scripts_missing"]),
        ...(checks.architectureDocMentionsProgressSummary ? [] : ["architecture_doc_missing_progress_summary"]),
        ...(checks.scenarioMonthlyReturnsCsvAbsent ? [] : ["scenario_monthly_returns_csv_present"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: REMAINING_TRADING_GATES,
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-progress-summary.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-progress-summary.cjs`);
    }
    console.log("[generate-trading-step116-progress-summary] ok");
    console.log(`[generate-trading-step116-progress-summary] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-step116-progress-summary] wrote contract");
  console.log(`[generate-trading-step116-progress-summary] contractStackReady=${parsed.readiness.contractStackReady}`);
}

main();
