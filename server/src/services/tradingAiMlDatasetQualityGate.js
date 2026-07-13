import {
  STEP230_OFFLINE_DATASET_QUALITY_BATCH_SCHEMA_VERSION,
  buildStep230OfflineDatasetQualityBatchSummary,
} from "./tradingAiMlDatasetQualityBatchSummary.js";

export const STEP231_OFFLINE_DATA_QUALITY_GATE_SCHEMA_VERSION = "1.0.0";
export const STEP231_OFFLINE_DATA_QUALITY_GATE_MODE = "offline_data_quality";
export const STEP231_OFFLINE_DATA_QUALITY_GATE_POLICY_VERSION = "1.0.0";
export const STEP231_OFFLINE_DATA_QUALITY_APPROVAL_SCOPE = "offline_dataset_promotion";

const TOP_LEVEL_KEYS = Object.freeze([
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

const APPROVAL_KEYS = Object.freeze(["required", "accepted", "scope"]);

const ALLOWED_ACTION_KEYS = Object.freeze([
  "offlineDatasetPromotion",
  "modelTraining",
  "runtimeServing",
  "providerAccess",
  "orderSubmission",
  "liveTrading",
]);

const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

const BATCH_SUMMARY_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "summaryMode",
  "sourceProfileSchemaVersion",
  "fixtureCounts",
  "recordCounts",
  "issueCounts",
  "fixtureResults",
  "overallStatus",
]);

const FIXTURE_COUNT_KEYS = Object.freeze(["total", "pass", "reviewRequired", "blocked"]);
const RECORD_COUNT_KEYS = Object.freeze(["total", "train", "validation", "test"]);
const ISSUE_COUNT_KEYS = Object.freeze([
  "missingRequiredFields",
  "duplicateRecordIds",
  "crossSplitDuplicates",
  "temporalOverlap",
  "futureLeakage",
  "invalidWalkForward",
  "metadataIncomplete",
  "sensitivePayload",
  "thresholdTypeViolation",
  "labelImbalance",
]);

const REASON_CODE_BY_ISSUE = Object.freeze({
  missingRequiredFields: "MISSING_REQUIRED_FIELDS",
  duplicateRecordIds: "DUPLICATE_RECORD_IDS",
  crossSplitDuplicates: "CROSS_SPLIT_DUPLICATES",
  temporalOverlap: "TEMPORAL_OVERLAP",
  futureLeakage: "FUTURE_LEAKAGE",
  invalidWalkForward: "INVALID_WALK_FORWARD",
  metadataIncomplete: "METADATA_INCOMPLETE",
  sensitivePayload: "SENSITIVE_PAYLOAD",
  thresholdTypeViolation: "THRESHOLD_TYPE_VIOLATION",
  labelImbalance: "LABEL_IMBALANCE",
});

const REASON_CODE_ORDER = Object.freeze([
  "MISSING_REQUIRED_FIELDS",
  "DUPLICATE_RECORD_IDS",
  "CROSS_SPLIT_DUPLICATES",
  "TEMPORAL_OVERLAP",
  "FUTURE_LEAKAGE",
  "INVALID_WALK_FORWARD",
  "METADATA_INCOMPLETE",
  "SENSITIVE_PAYLOAD",
  "THRESHOLD_TYPE_VIOLATION",
  "LABEL_IMBALANCE",
]);

const ALLOWED_APPROVAL_ROLES = Object.freeze([
  "data_quality_reviewer",
  "ml_validation_reviewer",
]);

const ALLOWED_RATIONALE_CODES = Object.freeze([
  "LABEL_IMBALANCE_REVIEWED",
  "NON_CRITICAL_METADATA_REVIEWED",
]);

const DECISION_VALUES = Object.freeze([
  "allow_offline_promotion",
  "manual_review_required",
  "block_offline_promotion",
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

function isNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isValidIsoTimestamp(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function assertExactObject(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`Step231 ${label} must be an object`);
  }
  if (!sameKeySet(value, expectedKeys)) {
    throw new TypeError(`Step231 ${label} key set mismatch`);
  }
}

function assertCounts(value, expectedKeys, label) {
  assertExactObject(value, expectedKeys, label);
  for (const key of expectedKeys) {
    if (!isNonNegativeNumber(value[key])) {
      throw new TypeError(`Step231 ${label}.${key} must be a non-negative number`);
    }
  }
}

function assertValidBatchSummary(summary) {
  assertExactObject(summary, BATCH_SUMMARY_TOP_LEVEL_KEYS, "batchSummary");
  if (summary.schemaVersion !== STEP230_OFFLINE_DATASET_QUALITY_BATCH_SCHEMA_VERSION) {
    throw new TypeError("Step231 batchSummary schemaVersion mismatch");
  }
  if (summary.summaryMode !== "offline_fixture_batch") {
    throw new TypeError("Step231 batchSummary summaryMode mismatch");
  }
  if (summary.sourceProfileSchemaVersion !== "1.0.0") {
    throw new TypeError("Step231 batchSummary sourceProfileSchemaVersion mismatch");
  }

  assertCounts(summary.fixtureCounts, FIXTURE_COUNT_KEYS, "fixtureCounts");
  assertCounts(summary.recordCounts, RECORD_COUNT_KEYS, "recordCounts");
  assertCounts(summary.issueCounts, ISSUE_COUNT_KEYS, "issueCounts");

  if (!Array.isArray(summary.fixtureResults) || summary.fixtureResults.length !== summary.fixtureCounts.total) {
    throw new TypeError("Step231 fixtureResults count mismatch");
  }
  for (const result of summary.fixtureResults) {
    assertExactObject(result, ["fixtureKey", "status"], "fixtureResult");
    if (typeof result.fixtureKey !== "string" || result.fixtureKey.trim() === "") {
      throw new TypeError("Step231 fixtureResult fixtureKey mismatch");
    }
    if (!["pass", "review_required", "blocked"].includes(result.status)) {
      throw new TypeError("Step231 fixtureResult status mismatch");
    }
  }

  const total = summary.fixtureCounts.pass + summary.fixtureCounts.reviewRequired + summary.fixtureCounts.blocked;
  if (summary.fixtureCounts.total <= 0 || total !== summary.fixtureCounts.total) {
    throw new TypeError("Step231 fixtureCounts total mismatch");
  }
  if (!["pass", "review_required", "blocked"].includes(summary.overallStatus)) {
    throw new TypeError("Step231 overallStatus mismatch");
  }
  if (summary.overallStatus === "pass" && (summary.fixtureCounts.reviewRequired > 0 || summary.fixtureCounts.blocked > 0)) {
    throw new TypeError("Step231 pass summary has non-pass fixtures");
  }
  if (summary.overallStatus === "review_required" && (summary.fixtureCounts.reviewRequired <= 0 || summary.fixtureCounts.blocked > 0)) {
    throw new TypeError("Step231 review summary count mismatch");
  }
  if (summary.overallStatus === "blocked" && summary.fixtureCounts.blocked <= 0) {
    throw new TypeError("Step231 blocked summary count mismatch");
  }
}

function buildReasonCodes(issueCounts) {
  const codes = [];
  for (const issueKey of ISSUE_COUNT_KEYS) {
    if (issueCounts[issueKey] > 0) {
      codes.push(REASON_CODE_BY_ISSUE[issueKey]);
    }
  }
  return codes.sort((left, right) => REASON_CODE_ORDER.indexOf(left) - REASON_CODE_ORDER.indexOf(right));
}

function isValidApproval(approval) {
  if (!approval || typeof approval !== "object" || Array.isArray(approval)) return false;
  return (
    approval.approved === true &&
    approval.scope === STEP231_OFFLINE_DATA_QUALITY_APPROVAL_SCOPE &&
    ALLOWED_APPROVAL_ROLES.includes(approval.approvedByRole) &&
    isValidIsoTimestamp(approval.approvedAt) &&
    ALLOWED_RATIONALE_CODES.includes(approval.rationaleCode)
  );
}

function buildAllowedActions(offlineDatasetPromotion) {
  return {
    offlineDatasetPromotion,
    modelTraining: false,
    runtimeServing: false,
    providerAccess: false,
    orderSubmission: false,
    liveTrading: false,
  };
}

function buildDecisionParts(summary, approval) {
  if (summary.overallStatus === "pass") {
    return {
      decision: "allow_offline_promotion",
      approvalRequired: false,
      approvalAccepted: false,
      offlineDatasetPromotion: true,
    };
  }

  if (summary.overallStatus === "blocked") {
    return {
      decision: "block_offline_promotion",
      approvalRequired: false,
      approvalAccepted: false,
      offlineDatasetPromotion: false,
    };
  }

  const accepted = isValidApproval(approval);
  return {
    decision: accepted ? "allow_offline_promotion" : "manual_review_required",
    approvalRequired: true,
    approvalAccepted: accepted,
    offlineDatasetPromotion: accepted,
  };
}

export function buildStep231OfflineDataQualityGateDecision(input = {}) {
  const source = clonePlain(input);
  const batchSummary = source.batchSummary ?? buildStep230OfflineDatasetQualityBatchSummary();
  assertValidBatchSummary(batchSummary);

  const decisionParts = buildDecisionParts(batchSummary, source.approval);
  const decision = {
    schemaVersion: STEP231_OFFLINE_DATA_QUALITY_GATE_SCHEMA_VERSION,
    gateMode: STEP231_OFFLINE_DATA_QUALITY_GATE_MODE,
    sourceSummarySchemaVersion: batchSummary.schemaVersion,
    policyVersion: STEP231_OFFLINE_DATA_QUALITY_GATE_POLICY_VERSION,
    observedStatus: batchSummary.overallStatus,
    decision: decisionParts.decision,
    approval: {
      required: decisionParts.approvalRequired,
      accepted: decisionParts.approvalAccepted,
      scope: STEP231_OFFLINE_DATA_QUALITY_APPROVAL_SCOPE,
    },
    reasonCodes: buildReasonCodes(batchSummary.issueCounts),
    allowedActions: buildAllowedActions(decisionParts.offlineDatasetPromotion),
    readiness: {
      actualLiveTradingReady: false,
      state: "blocked",
    },
  };

  return deepFreeze(decision);
}

export const STEP231_OFFLINE_DATA_QUALITY_GATE_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  approvalKeys: APPROVAL_KEYS,
  allowedActionKeys: ALLOWED_ACTION_KEYS,
  readinessKeys: READINESS_KEYS,
  reasonCodeOrder: REASON_CODE_ORDER,
  allowedApprovalRoles: ALLOWED_APPROVAL_ROLES,
  allowedRationaleCodes: ALLOWED_RATIONALE_CODES,
  decisionValues: DECISION_VALUES,
  approvalScope: STEP231_OFFLINE_DATA_QUALITY_APPROVAL_SCOPE,
  sourceSummarySchemaVersion: STEP230_OFFLINE_DATASET_QUALITY_BATCH_SCHEMA_VERSION,
  redacted: true,
});
