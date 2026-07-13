import {
  STEP231_OFFLINE_DATA_QUALITY_GATE_SCHEMA_VERSION,
  buildStep231OfflineDataQualityGateDecision,
} from "./tradingAiMlDatasetQualityGate.js";

export const STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_SCHEMA_VERSION = "1.0.0";
export const STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_MODE = "offline_data_quality_gate_operational";
export const STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_POLICY_VERSION = "1.0.0";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "readinessMode",
  "sourceGateSchemaVersion",
  "policyVersion",
  "status",
  "checks",
  "missingRequirements",
  "allowedIntegrationTargets",
  "readiness",
]);

const CHECK_KEYS = Object.freeze([
  "ownerRoleDefined",
  "reviewerRolesDefined",
  "evidencePolicyDefined",
  "approvalTtlDefined",
  "blockedOverrideDisabled",
  "immutableAuditRecordRequired",
  "rollbackProcedureDefined",
  "incidentProcedureDefined",
  "requiredEvidenceAvailable",
]);

const ALLOWED_INTEGRATION_TARGET_KEYS = Object.freeze([
  "standaloneDryRun",
  "nonBlockingCiReport",
  "blockingCiGate",
  "serverStartupGate",
  "runtimeServingGate",
  "modelTrainingGate",
  "providerGate",
  "orderGate",
  "liveTradingGate",
]);

const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

const GATE_DECISION_KEYS = Object.freeze([
  "schemaVersion",
  "gateMode",
  "sourceSummarySchemaVersion",
  "policyVersion",
  "observedStatus",
  "decision",
  "approval",
  "reasonCodes",
  "allowedActions",
  "readiness",
]);

const EVIDENCE_KEYS = Object.freeze([
  "batchSummaryAvailable",
  "gateDecisionAvailable",
  "reasonCodeReviewAvailable",
  "reviewerChecklistAvailable",
  "approvalRecordTemplateAvailable",
  "rollbackChecklistAvailable",
  "incidentResponseChecklistAvailable",
]);

const MISSING_REQUIREMENT_ORDER = Object.freeze([
  "OWNER_ROLE_MISSING",
  "REVIEWER_ROLE_MISSING",
  "EVIDENCE_POLICY_MISSING",
  "APPROVAL_TTL_MISSING",
  "BLOCKED_OVERRIDE_MUST_BE_DISABLED",
  "IMMUTABLE_AUDIT_RECORD_REQUIRED",
  "ROLLBACK_PROCEDURE_MISSING",
  "INCIDENT_PROCEDURE_MISSING",
  "BATCH_SUMMARY_EVIDENCE_MISSING",
  "GATE_DECISION_EVIDENCE_MISSING",
  "REASON_CODE_REVIEW_MISSING",
  "REVIEWER_CHECKLIST_MISSING",
  "APPROVAL_RECORD_TEMPLATE_MISSING",
  "ROLLBACK_CHECKLIST_MISSING",
  "INCIDENT_RESPONSE_CHECKLIST_MISSING",
  "LIVE_TRADING_READINESS_MUST_STAY_BLOCKED",
]);

const ALLOWED_OWNER_ROLES = Object.freeze(["data_quality_owner"]);
const ALLOWED_REVIEWER_ROLES = Object.freeze([
  "data_quality_reviewer",
  "ml_validation_reviewer",
  "release_audit_reviewer",
]);

const AUDIT_RECORD_FIELDS = Object.freeze([
  "gateDecision",
  "observedStatus",
  "reasonCodes",
  "approvalScope",
  "approvedByRole",
  "approvedAt",
  "expiresAt",
  "rationaleCode",
  "policyVersion",
  "sourceSummarySchemaVersion",
  "datasetRevisionKey",
]);

const REAPPROVAL_TRIGGERS = Object.freeze([
  "dataset_content_change",
  "profile_schema_change",
  "batch_summary_schema_change",
  "gate_policy_version_change",
  "reason_code_change",
  "split_or_window_change",
  "threshold_policy_change",
  "sensitive_payload_scan_result_change",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameKeySet(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isGateDecisionValid(gateDecision) {
  return Boolean(
    gateDecision &&
    typeof gateDecision === "object" &&
    !Array.isArray(gateDecision) &&
    sameKeySet(gateDecision, GATE_DECISION_KEYS) &&
    gateDecision.schemaVersion === STEP231_OFFLINE_DATA_QUALITY_GATE_SCHEMA_VERSION &&
    gateDecision.gateMode === "offline_data_quality" &&
    gateDecision.readiness?.actualLiveTradingReady === false &&
    gateDecision.readiness?.state === "blocked",
  );
}

function buildEvidenceAvailability(input = {}) {
  const evidence = {};
  for (const key of EVIDENCE_KEYS) {
    evidence[key] = input[key] === true;
  }
  return evidence;
}

function buildChecks(operatingModel = {}, evidenceAvailability = {}, gateDecision) {
  const reviewerRoles = Array.isArray(operatingModel.reviewerRoles) ? operatingModel.reviewerRoles : [];
  const evidence = buildEvidenceAvailability(evidenceAvailability);
  const gateKeepsLiveBlocked = isGateDecisionValid(gateDecision);

  return {
    ownerRoleDefined: ALLOWED_OWNER_ROLES.includes(operatingModel.ownerRole),
    reviewerRolesDefined: reviewerRoles.some((role) => ALLOWED_REVIEWER_ROLES.includes(role)),
    evidencePolicyDefined: isNonEmptyString(operatingModel.evidencePolicyVersion),
    approvalTtlDefined: isPositiveNumber(operatingModel.approvalTtlHours),
    blockedOverrideDisabled: operatingModel.blockedOverrideAllowed === false,
    immutableAuditRecordRequired: operatingModel.immutableAuditRecordRequired === true,
    rollbackProcedureDefined: operatingModel.rollbackProcedureDefined === true,
    incidentProcedureDefined: operatingModel.incidentProcedureDefined === true,
    requiredEvidenceAvailable: EVIDENCE_KEYS.every((key) => evidence[key] === true) && gateKeepsLiveBlocked,
  };
}

function buildMissingRequirements(checks, evidenceAvailability, gateDecision) {
  const evidence = buildEvidenceAvailability(evidenceAvailability);
  const missing = [];

  if (!checks.ownerRoleDefined) missing.push("OWNER_ROLE_MISSING");
  if (!checks.reviewerRolesDefined) missing.push("REVIEWER_ROLE_MISSING");
  if (!checks.evidencePolicyDefined) missing.push("EVIDENCE_POLICY_MISSING");
  if (!checks.approvalTtlDefined) missing.push("APPROVAL_TTL_MISSING");
  if (!checks.blockedOverrideDisabled) missing.push("BLOCKED_OVERRIDE_MUST_BE_DISABLED");
  if (!checks.immutableAuditRecordRequired) missing.push("IMMUTABLE_AUDIT_RECORD_REQUIRED");
  if (!checks.rollbackProcedureDefined) missing.push("ROLLBACK_PROCEDURE_MISSING");
  if (!checks.incidentProcedureDefined) missing.push("INCIDENT_PROCEDURE_MISSING");
  if (!evidence.batchSummaryAvailable) missing.push("BATCH_SUMMARY_EVIDENCE_MISSING");
  if (!evidence.gateDecisionAvailable) missing.push("GATE_DECISION_EVIDENCE_MISSING");
  if (!evidence.reasonCodeReviewAvailable) missing.push("REASON_CODE_REVIEW_MISSING");
  if (!evidence.reviewerChecklistAvailable) missing.push("REVIEWER_CHECKLIST_MISSING");
  if (!evidence.approvalRecordTemplateAvailable) missing.push("APPROVAL_RECORD_TEMPLATE_MISSING");
  if (!evidence.rollbackChecklistAvailable) missing.push("ROLLBACK_CHECKLIST_MISSING");
  if (!evidence.incidentResponseChecklistAvailable) missing.push("INCIDENT_RESPONSE_CHECKLIST_MISSING");
  if (!isGateDecisionValid(gateDecision)) missing.push("LIVE_TRADING_READINESS_MUST_STAY_BLOCKED");

  return [...new Set(missing)].sort((left, right) => MISSING_REQUIREMENT_ORDER.indexOf(left) - MISSING_REQUIREMENT_ORDER.indexOf(right));
}

function isStandaloneReady(checks, evidenceAvailability, gateDecision) {
  const evidence = buildEvidenceAvailability(evidenceAvailability);
  return Boolean(
    checks.ownerRoleDefined &&
    checks.reviewerRolesDefined &&
    checks.evidencePolicyDefined &&
    checks.blockedOverrideDisabled &&
    checks.rollbackProcedureDefined &&
    checks.incidentProcedureDefined &&
    evidence.approvalRecordTemplateAvailable &&
    isGateDecisionValid(gateDecision),
  );
}

function isNonBlockingCiReady(checks) {
  return Boolean(
    checks.ownerRoleDefined &&
    checks.reviewerRolesDefined &&
    checks.evidencePolicyDefined &&
    checks.approvalTtlDefined &&
    checks.blockedOverrideDisabled &&
    checks.immutableAuditRecordRequired &&
    checks.rollbackProcedureDefined &&
    checks.incidentProcedureDefined &&
    checks.requiredEvidenceAvailable,
  );
}

function buildStatus(checks, evidenceAvailability, gateDecision) {
  if (isNonBlockingCiReady(checks)) return "ready_for_non_blocking_ci_evaluation";
  if (isStandaloneReady(checks, evidenceAvailability, gateDecision)) return "ready_for_standalone_dry_run";
  return "not_ready";
}

function buildAllowedIntegrationTargets(status) {
  const standaloneReady = status === "ready_for_standalone_dry_run" || status === "ready_for_non_blocking_ci_evaluation";
  return {
    standaloneDryRun: standaloneReady,
    nonBlockingCiReport: status === "ready_for_non_blocking_ci_evaluation",
    blockingCiGate: false,
    serverStartupGate: false,
    runtimeServingGate: false,
    modelTrainingGate: false,
    providerGate: false,
    orderGate: false,
    liveTradingGate: false,
  };
}

export function buildStep232OfflineDataQualityGateReadiness(input = {}) {
  const source = clonePlain(input);
  const gateDecision = source.gateDecision ?? buildStep231OfflineDataQualityGateDecision();
  const operatingModel = source.operatingModel ?? {};
  const evidenceAvailability = source.evidenceAvailability ?? {};
  const checks = buildChecks(operatingModel, evidenceAvailability, gateDecision);
  const status = buildStatus(checks, evidenceAvailability, gateDecision);

  const readiness = {
    schemaVersion: STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_SCHEMA_VERSION,
    readinessMode: STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_MODE,
    sourceGateSchemaVersion: STEP231_OFFLINE_DATA_QUALITY_GATE_SCHEMA_VERSION,
    policyVersion: STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_POLICY_VERSION,
    status,
    checks,
    missingRequirements: buildMissingRequirements(checks, evidenceAvailability, gateDecision),
    allowedIntegrationTargets: buildAllowedIntegrationTargets(status),
    readiness: {
      actualLiveTradingReady: false,
      state: "blocked",
    },
  };

  return deepFreeze(readiness);
}

export const STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  checkKeys: CHECK_KEYS,
  allowedIntegrationTargetKeys: ALLOWED_INTEGRATION_TARGET_KEYS,
  readinessKeys: READINESS_KEYS,
  allowedStatuses: [
    "ready_for_standalone_dry_run",
    "ready_for_non_blocking_ci_evaluation",
    "not_ready",
  ],
  allowedOwnerRoles: ALLOWED_OWNER_ROLES,
  allowedReviewerRoles: ALLOWED_REVIEWER_ROLES,
  evidenceKeys: EVIDENCE_KEYS,
  missingRequirementOrder: MISSING_REQUIREMENT_ORDER,
  auditRecordFields: AUDIT_RECORD_FIELDS,
  reapprovalTriggers: REAPPROVAL_TRIGGERS,
  sourceGateSchemaVersion: STEP231_OFFLINE_DATA_QUALITY_GATE_SCHEMA_VERSION,
  redacted: true,
});
