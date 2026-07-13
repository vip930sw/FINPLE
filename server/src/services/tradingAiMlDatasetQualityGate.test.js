import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT,
  buildStep231OfflineDataQualityGateDecision,
} from "./tradingAiMlDatasetQualityGate.js";
import {
  buildStep230OfflineDatasetQualityBatchSummary,
  buildStep230OfflineDatasetQualityFixtureCatalog,
} from "./tradingAiMlDatasetQualityBatchSummary.js";

const EXPECTED_TOP_LEVEL_KEYS = [
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
];

const EXPECTED_APPROVAL_KEYS = ["required", "accepted", "scope"];
const EXPECTED_ALLOWED_ACTION_KEYS = [
  "offlineDatasetPromotion",
  "modelTraining",
  "runtimeServing",
  "providerAccess",
  "orderSubmission",
  "liveTrading",
];
const EXPECTED_READINESS_KEYS = ["actualLiveTradingReady", "state"];

const VALID_APPROVAL = Object.freeze({
  approved: true,
  scope: "offline_dataset_promotion",
  approvedByRole: "data_quality_reviewer",
  approvedAt: "2026-07-13T00:00:00.000Z",
  rationaleCode: "LABEL_IMBALANCE_REVIEWED",
});

function mutableCatalog() {
  return JSON.parse(JSON.stringify(buildStep230OfflineDatasetQualityFixtureCatalog()));
}

function summaryByKeys(keys) {
  const catalog = mutableCatalog();
  const entries = new Map(catalog.map((entry) => [entry.fixtureKey, entry]));
  return buildStep230OfflineDatasetQualityBatchSummary(keys.map((key) => entries.get(key)));
}

function reorderedSummary(summary) {
  return {
    fixtureResults: summary.fixtureResults,
    issueCounts: summary.issueCounts,
    summaryMode: summary.summaryMode,
    schemaVersion: summary.schemaVersion,
    recordCounts: summary.recordCounts,
    overallStatus: summary.overallStatus,
    sourceProfileSchemaVersion: summary.sourceProfileSchemaVersion,
    fixtureCounts: summary.fixtureCounts,
  };
}

test("Step231 gate output exposes exact top-level and nested key sets", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryByKeys(["balanced_valid"]),
  });

  assert.deepEqual(Object.keys(decision), EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(Object.keys(decision.approval), EXPECTED_APPROVAL_KEYS);
  assert.deepEqual(Object.keys(decision.allowedActions), EXPECTED_ALLOWED_ACTION_KEYS);
  assert.deepEqual(Object.keys(decision.readiness), EXPECTED_READINESS_KEYS);
});

test("Step231 pass summary allows only offline promotion", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryByKeys(["balanced_valid", "numeric_threshold_zero", "string_threshold"]),
  });

  assert.equal(decision.observedStatus, "pass");
  assert.equal(decision.decision, "allow_offline_promotion");
  assert.deepEqual(decision.approval, {
    required: false,
    accepted: false,
    scope: "offline_dataset_promotion",
  });
  assert.deepEqual(decision.reasonCodes, []);
  assert.deepEqual(decision.allowedActions, {
    offlineDatasetPromotion: true,
    modelTraining: false,
    runtimeServing: false,
    providerAccess: false,
    orderSubmission: false,
    liveTrading: false,
  });
});

test("Step231 review_required without approval requires manual review", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryByKeys(["balanced_valid", "label_imbalance"]),
  });

  assert.equal(decision.observedStatus, "review_required");
  assert.equal(decision.decision, "manual_review_required");
  assert.deepEqual(decision.approval, {
    required: true,
    accepted: false,
    scope: "offline_dataset_promotion",
  });
  assert.deepEqual(decision.reasonCodes, ["LABEL_IMBALANCE"]);
  assert.equal(decision.allowedActions.offlineDatasetPromotion, false);
});

test("Step231 review_required with valid approval allows offline promotion only", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryByKeys(["balanced_valid", "label_imbalance"]),
    approval: VALID_APPROVAL,
  });

  assert.equal(decision.decision, "allow_offline_promotion");
  assert.deepEqual(decision.approval, {
    required: true,
    accepted: true,
    scope: "offline_dataset_promotion",
  });
  assert.equal(decision.allowedActions.offlineDatasetPromotion, true);
  assert.equal(decision.allowedActions.modelTraining, false);
  assert.equal(decision.allowedActions.runtimeServing, false);
  assert.equal(decision.allowedActions.providerAccess, false);
  assert.equal(decision.allowedActions.orderSubmission, false);
  assert.equal(decision.allowedActions.liveTrading, false);
});

test("Step231 review_required rejects invalid approval scope, missing fields, and disallowed roles", () => {
  const batchSummary = summaryByKeys(["balanced_valid", "label_imbalance"]);
  const invalidScope = { ...VALID_APPROVAL, scope: "model_training" };
  const missingField = { ...VALID_APPROVAL };
  delete missingField.rationaleCode;
  const invalidRole = { ...VALID_APPROVAL, approvedByRole: "portfolio_owner" };
  const invalidRationale = { ...VALID_APPROVAL, rationaleCode: "AUTO_APPROVED" };

  for (const approval of [invalidScope, missingField, invalidRole, invalidRationale]) {
    const decision = buildStep231OfflineDataQualityGateDecision({ batchSummary, approval });
    assert.equal(decision.decision, "manual_review_required");
    assert.equal(decision.approval.required, true);
    assert.equal(decision.approval.accepted, false);
    assert.equal(decision.allowedActions.offlineDatasetPromotion, false);
  }
});

test("Step231 blocked summary remains blocked even with approval input", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryByKeys(["balanced_valid", "future_leakage"]),
    approval: VALID_APPROVAL,
  });

  assert.equal(decision.observedStatus, "blocked");
  assert.equal(decision.decision, "block_offline_promotion");
  assert.deepEqual(decision.approval, {
    required: false,
    accepted: false,
    scope: "offline_dataset_promotion",
  });
  assert.equal(decision.allowedActions.offlineDatasetPromotion, false);
  assert.deepEqual(decision.reasonCodes, ["FUTURE_LEAKAGE"]);
});

test("Step231 rejects empty or malformed batch summaries", () => {
  const passSummary = summaryByKeys(["balanced_valid"]);
  const emptySummary = {
    ...passSummary,
    fixtureCounts: { total: 0, pass: 0, reviewRequired: 0, blocked: 0 },
    fixtureResults: [],
  };
  const malformedSummary = { ...passSummary };
  delete malformedSummary.issueCounts;

  assert.throws(() => buildStep231OfflineDataQualityGateDecision({ batchSummary: emptySummary }), /total mismatch/);
  assert.throws(() => buildStep231OfflineDataQualityGateDecision({ batchSummary: malformedSummary }), /key set mismatch/);
});

test("Step231 reason codes are unique and canonical", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: buildStep230OfflineDatasetQualityBatchSummary(),
  });

  assert.equal(new Set(decision.reasonCodes).size, decision.reasonCodes.length);
  assert.deepEqual(decision.reasonCodes, [
    "MISSING_REQUIRED_FIELDS",
    "DUPLICATE_RECORD_IDS",
    "CROSS_SPLIT_DUPLICATES",
    "TEMPORAL_OVERLAP",
    "FUTURE_LEAKAGE",
    "INVALID_WALK_FORWARD",
    "SENSITIVE_PAYLOAD",
    "THRESHOLD_TYPE_VIOLATION",
    "LABEL_IMBALANCE",
  ]);
});

test("Step231 is deterministic and ignores batch summary key order", () => {
  const batchSummary = summaryByKeys(["balanced_valid", "label_imbalance"]);
  const first = buildStep231OfflineDataQualityGateDecision({ batchSummary, approval: VALID_APPROVAL });
  const second = buildStep231OfflineDataQualityGateDecision({ batchSummary, approval: VALID_APPROVAL });
  const reordered = buildStep231OfflineDataQualityGateDecision({
    batchSummary: reorderedSummary(batchSummary),
    approval: VALID_APPROVAL,
  });

  assert.deepEqual(second, first);
  assert.deepEqual(reordered, first);
});

test("Step231 does not mutate batch summary, approval input, or Step230 summary output", () => {
  const batchSummary = summaryByKeys(["balanced_valid", "label_imbalance"]);
  const approval = JSON.parse(JSON.stringify(VALID_APPROVAL));
  const beforeSummary = JSON.stringify(batchSummary);
  const beforeApproval = JSON.stringify(approval);

  const decision = buildStep231OfflineDataQualityGateDecision({ batchSummary, approval });

  assert.equal(JSON.stringify(batchSummary), beforeSummary);
  assert.equal(JSON.stringify(approval), beforeApproval);
  assert.equal(Object.isFrozen(decision), true);
  assert.throws(() => {
    decision.allowedActions.modelTraining = true;
  });
});

test("Step231 output excludes sensitive values and raw payload material", () => {
  const decision = buildStep231OfflineDataQualityGateDecision({
    batchSummary: buildStep230OfflineDatasetQualityBatchSummary(),
    approval: VALID_APPROVAL,
  });
  const serialized = JSON.stringify(decision);

  for (const forbidden of [
    "step229-record-001",
    "downside",
    "stable",
    "upside",
    "secret token value",
    "rawProviderPayload",
    "provider payload",
    "raw metadata",
    "account identifier",
    "order payload",
    "hash",
    "digest",
    "fingerprint",
    "credential",
    "token",
    "data_quality_reviewer",
    "2026-07-13T00:00:00.000Z",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("Step231 keeps all non-offline actions false and live readiness blocked", () => {
  const approvedReview = buildStep231OfflineDataQualityGateDecision({
    batchSummary: summaryByKeys(["balanced_valid", "label_imbalance"]),
    approval: VALID_APPROVAL,
  });

  assert.equal(approvedReview.allowedActions.offlineDatasetPromotion, true);
  assert.equal(approvedReview.allowedActions.modelTraining, false);
  assert.equal(approvedReview.allowedActions.runtimeServing, false);
  assert.equal(approvedReview.allowedActions.providerAccess, false);
  assert.equal(approvedReview.allowedActions.orderSubmission, false);
  assert.equal(approvedReview.allowedActions.liveTrading, false);
  assert.deepEqual(approvedReview.readiness, {
    actualLiveTradingReady: false,
    state: "blocked",
  });
});

test("Step231 contract exposes exact gate policy metadata", () => {
  assert.deepEqual(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.topLevelKeys, EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.approvalKeys, EXPECTED_APPROVAL_KEYS);
  assert.deepEqual(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.allowedActionKeys, EXPECTED_ALLOWED_ACTION_KEYS);
  assert.deepEqual(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.readinessKeys, EXPECTED_READINESS_KEYS);
  assert.deepEqual(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.decisionValues, [
    "allow_offline_promotion",
    "manual_review_required",
    "block_offline_promotion",
  ]);
  assert.equal(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.approvalScope, "offline_dataset_promotion");
  assert.equal(STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT.sourceSummarySchemaVersion, "1.0.0");
});
