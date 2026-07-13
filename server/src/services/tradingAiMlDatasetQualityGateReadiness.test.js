import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT,
  buildStep232OfflineDataQualityGateReadiness,
} from "./tradingAiMlDatasetQualityGateReadiness.js";
import { buildStep231OfflineDataQualityGateDecision } from "./tradingAiMlDatasetQualityGate.js";
import { buildStep230OfflineDatasetQualityBatchSummary } from "./tradingAiMlDatasetQualityBatchSummary.js";

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "readinessMode",
  "sourceGateSchemaVersion",
  "policyVersion",
  "status",
  "checks",
  "missingRequirements",
  "allowedIntegrationTargets",
  "readiness",
];

const EXPECTED_CHECK_KEYS = [
  "ownerRoleDefined",
  "reviewerRolesDefined",
  "evidencePolicyDefined",
  "approvalTtlDefined",
  "blockedOverrideDisabled",
  "immutableAuditRecordRequired",
  "rollbackProcedureDefined",
  "incidentProcedureDefined",
  "requiredEvidenceAvailable",
];

const EXPECTED_TARGET_KEYS = [
  "standaloneDryRun",
  "nonBlockingCiReport",
  "blockingCiGate",
  "serverStartupGate",
  "runtimeServingGate",
  "modelTrainingGate",
  "providerGate",
  "orderGate",
  "liveTradingGate",
];

const BASE_OPERATING_MODEL = Object.freeze({
  ownerRole: "data_quality_owner",
  reviewerRoles: ["data_quality_reviewer", "ml_validation_reviewer"],
  evidencePolicyVersion: "1.0.0",
  approvalTtlHours: 168,
  blockedOverrideAllowed: false,
  immutableAuditRecordRequired: true,
  rollbackProcedureDefined: true,
  incidentProcedureDefined: true,
});

const FULL_EVIDENCE = Object.freeze({
  batchSummaryAvailable: true,
  gateDecisionAvailable: true,
  reasonCodeReviewAvailable: true,
  reviewerChecklistAvailable: true,
  approvalRecordTemplateAvailable: true,
  rollbackChecklistAvailable: true,
  incidentResponseChecklistAvailable: true,
});

function gateDecision() {
  return buildStep231OfflineDataQualityGateDecision({
    batchSummary: buildStep230OfflineDatasetQualityBatchSummary(),
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function build(overrides = {}) {
  return buildStep232OfflineDataQualityGateReadiness({
    gateDecision: overrides.gateDecision ?? gateDecision(),
    operatingModel: overrides.operatingModel ?? clone(BASE_OPERATING_MODEL),
    evidenceAvailability: overrides.evidenceAvailability ?? clone(FULL_EVIDENCE),
  });
}

test("Step232 readiness output exposes exact top-level and nested key sets", () => {
  const readiness = build();

  assert.deepEqual(Object.keys(readiness), EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(Object.keys(readiness.checks), EXPECTED_CHECK_KEYS);
  assert.deepEqual(Object.keys(readiness.allowedIntegrationTargets), EXPECTED_TARGET_KEYS);
  assert.deepEqual(Object.keys(readiness.readiness), ["actualLiveTradingReady", "state"]);
});

test("Step232 missing owner role is not ready", () => {
  const operatingModel = clone(BASE_OPERATING_MODEL);
  delete operatingModel.ownerRole;
  const readiness = build({ operatingModel });

  assert.equal(readiness.status, "not_ready");
  assert.equal(readiness.checks.ownerRoleDefined, false);
  assert(readiness.missingRequirements.includes("OWNER_ROLE_MISSING"));
});

test("Step232 missing reviewer role is not ready", () => {
  const operatingModel = clone(BASE_OPERATING_MODEL);
  operatingModel.reviewerRoles = [];
  const readiness = build({ operatingModel });

  assert.equal(readiness.status, "not_ready");
  assert.equal(readiness.checks.reviewerRolesDefined, false);
  assert(readiness.missingRequirements.includes("REVIEWER_ROLE_MISSING"));
});

test("Step232 enabled blocked override is not ready", () => {
  const operatingModel = clone(BASE_OPERATING_MODEL);
  operatingModel.blockedOverrideAllowed = true;
  const readiness = build({ operatingModel });

  assert.equal(readiness.status, "not_ready");
  assert.equal(readiness.checks.blockedOverrideDisabled, false);
  assert(readiness.missingRequirements.includes("BLOCKED_OVERRIDE_MUST_BE_DISABLED"));
});

test("Step232 missing rollback and incident procedures are not ready", () => {
  const missingRollback = clone(BASE_OPERATING_MODEL);
  missingRollback.rollbackProcedureDefined = false;
  const missingIncident = clone(BASE_OPERATING_MODEL);
  missingIncident.incidentProcedureDefined = false;

  const rollbackReadiness = build({ operatingModel: missingRollback });
  const incidentReadiness = build({ operatingModel: missingIncident });

  assert.equal(rollbackReadiness.status, "not_ready");
  assert(rollbackReadiness.missingRequirements.includes("ROLLBACK_PROCEDURE_MISSING"));
  assert.equal(incidentReadiness.status, "not_ready");
  assert(incidentReadiness.missingRequirements.includes("INCIDENT_PROCEDURE_MISSING"));
});

test("Step232 minimum conditions allow standalone dry run only", () => {
  const operatingModel = clone(BASE_OPERATING_MODEL);
  delete operatingModel.approvalTtlHours;
  operatingModel.immutableAuditRecordRequired = false;
  const evidenceAvailability = {
    approvalRecordTemplateAvailable: true,
  };
  const readiness = build({ operatingModel, evidenceAvailability });

  assert.equal(readiness.status, "ready_for_standalone_dry_run");
  assert.equal(readiness.allowedIntegrationTargets.standaloneDryRun, true);
  assert.equal(readiness.allowedIntegrationTargets.nonBlockingCiReport, false);
  assert.equal(readiness.allowedIntegrationTargets.blockingCiGate, false);
  assert.equal(readiness.allowedIntegrationTargets.modelTrainingGate, false);
});

test("Step232 full evidence allows non-blocking CI evaluation only", () => {
  const readiness = build();

  assert.equal(readiness.status, "ready_for_non_blocking_ci_evaluation");
  assert.equal(readiness.checks.requiredEvidenceAvailable, true);
  assert.deepEqual(readiness.missingRequirements, []);
  assert.equal(readiness.allowedIntegrationTargets.standaloneDryRun, true);
  assert.equal(readiness.allowedIntegrationTargets.nonBlockingCiReport, true);
  assert.equal(readiness.allowedIntegrationTargets.blockingCiGate, false);
  assert.equal(readiness.allowedIntegrationTargets.runtimeServingGate, false);
  assert.equal(readiness.allowedIntegrationTargets.providerGate, false);
  assert.equal(readiness.allowedIntegrationTargets.orderGate, false);
  assert.equal(readiness.allowedIntegrationTargets.liveTradingGate, false);
});

test("Step232 one missing evidence item prevents non-blocking CI readiness", () => {
  const evidenceAvailability = clone(FULL_EVIDENCE);
  evidenceAvailability.reviewerChecklistAvailable = false;
  const readiness = build({ evidenceAvailability });

  assert.equal(readiness.status, "ready_for_standalone_dry_run");
  assert.equal(readiness.checks.requiredEvidenceAvailable, false);
  assert.equal(readiness.allowedIntegrationTargets.nonBlockingCiReport, false);
  assert(readiness.missingRequirements.includes("REVIEWER_CHECKLIST_MISSING"));
});

test("Step232 missing requirements are unique and canonical", () => {
  const readiness = buildStep232OfflineDataQualityGateReadiness({
    gateDecision: gateDecision(),
    operatingModel: {
      blockedOverrideAllowed: true,
      rollbackProcedureDefined: false,
      incidentProcedureDefined: false,
    },
    evidenceAvailability: {},
  });

  assert.equal(new Set(readiness.missingRequirements).size, readiness.missingRequirements.length);
  assert.deepEqual(readiness.missingRequirements, [
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
  ]);
});

test("Step232 is deterministic and ignores input key order", () => {
  const input = {
    gateDecision: gateDecision(),
    operatingModel: clone(BASE_OPERATING_MODEL),
    evidenceAvailability: clone(FULL_EVIDENCE),
  };
  const reordered = {
    evidenceAvailability: input.evidenceAvailability,
    operatingModel: {
      incidentProcedureDefined: true,
      rollbackProcedureDefined: true,
      immutableAuditRecordRequired: true,
      blockedOverrideAllowed: false,
      approvalTtlHours: 168,
      evidencePolicyVersion: "1.0.0",
      reviewerRoles: ["ml_validation_reviewer", "data_quality_reviewer"],
      ownerRole: "data_quality_owner",
    },
    gateDecision: input.gateDecision,
  };

  assert.deepEqual(buildStep232OfflineDataQualityGateReadiness(input), buildStep232OfflineDataQualityGateReadiness(input));
  assert.deepEqual(buildStep232OfflineDataQualityGateReadiness(reordered), buildStep232OfflineDataQualityGateReadiness(input));
});

test("Step232 does not mutate operating model evidence or Step231 gate decision", () => {
  const gate = gateDecision();
  const operatingModel = clone(BASE_OPERATING_MODEL);
  const evidenceAvailability = clone(FULL_EVIDENCE);
  const beforeGate = JSON.stringify(gate);
  const beforeModel = JSON.stringify(operatingModel);
  const beforeEvidence = JSON.stringify(evidenceAvailability);

  const readiness = buildStep232OfflineDataQualityGateReadiness({
    gateDecision: gate,
    operatingModel,
    evidenceAvailability,
  });

  assert.equal(JSON.stringify(gate), beforeGate);
  assert.equal(JSON.stringify(operatingModel), beforeModel);
  assert.equal(JSON.stringify(evidenceAvailability), beforeEvidence);
  assert.equal(Object.isFrozen(readiness), true);
  assert.throws(() => {
    readiness.allowedIntegrationTargets.blockingCiGate = true;
  });
});

test("Step232 output excludes sensitive material", () => {
  const readiness = build();
  const serialized = JSON.stringify(readiness);

  for (const forbidden of [
    "secret token value",
    "provider payload",
    "account information",
    "order information",
    "raw record ID",
    "hash digest fingerprint",
    "personal email",
    "credential material",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("Step232 keeps forbidden integration targets false and live readiness blocked", () => {
  const readiness = build();

  assert.equal(readiness.allowedIntegrationTargets.blockingCiGate, false);
  assert.equal(readiness.allowedIntegrationTargets.serverStartupGate, false);
  assert.equal(readiness.allowedIntegrationTargets.runtimeServingGate, false);
  assert.equal(readiness.allowedIntegrationTargets.modelTrainingGate, false);
  assert.equal(readiness.allowedIntegrationTargets.providerGate, false);
  assert.equal(readiness.allowedIntegrationTargets.orderGate, false);
  assert.equal(readiness.allowedIntegrationTargets.liveTradingGate, false);
  assert.deepEqual(readiness.readiness, {
    actualLiveTradingReady: false,
    state: "blocked",
  });
});

test("Step232 contract exports readiness policy metadata", () => {
  assert.deepEqual(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.topLevelKeys, EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.checkKeys, EXPECTED_CHECK_KEYS);
  assert.deepEqual(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.allowedIntegrationTargetKeys, EXPECTED_TARGET_KEYS);
  assert.deepEqual(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.readinessKeys, ["actualLiveTradingReady", "state"]);
  assert.deepEqual(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.allowedStatuses, [
    "ready_for_standalone_dry_run",
    "ready_for_non_blocking_ci_evaluation",
    "not_ready",
  ]);
  assert(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.auditRecordFields.includes("datasetRevisionKey"));
  assert(STEP232_OFFLINE_DATA_QUALITY_GATE_READINESS_CONTRACT.reapprovalTriggers.includes("threshold_policy_change"));
});
