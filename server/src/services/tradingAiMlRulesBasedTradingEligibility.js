import {
  STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION,
  assertNoStep235ASensitiveMaterial,
  buildStep235AOfflineFeatureDataset,
} from "./tradingAiMlOfflineFeatureBuilder.js";
import {
  STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
} from "./tradingAiMlTradingFeatureContract.js";
import {
  buildStep235BOfflineFeatureCoverageReport,
} from "./tradingAiMlTradingFeatureCoverageReport.js";

export const STEP236A_ELIGIBILITY_SCHEMA_VERSION = "1.0.0";
export const STEP236A_POLICY_VERSION = "1.0.0";
export const STEP236A_ELIGIBILITY_MODE = "offline_rules_based_research_baseline";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "policyVersion",
  "mode",
  "recordCounts",
  "decisionDistribution",
  "coverageRequirements",
  "safety",
  "readiness",
]);

const RECORD_COUNT_KEYS = Object.freeze([
  "total",
  "eligibleForResearch",
  "hold",
  "riskOff",
  "insufficientHistory",
  "blockedByDataQuality",
]);

const DECISION_DISTRIBUTION_KEYS = Object.freeze(["decision", "count", "ratio"]);
const COVERAGE_REQUIREMENT_KEYS = Object.freeze(["minimumObservationCount", "nullFeatureImputationAllowed"]);
const SAFETY_KEYS = Object.freeze([
  "modelTrainingAllowed",
  "performanceClaimAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
]);
const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

const DECISION_ORDER = Object.freeze([
  "eligible_for_research",
  "hold",
  "risk_off",
  "insufficient_history",
  "blocked_by_data_quality",
]);

const REQUIRED_FEATURE_KEYS = Object.freeze([
  "return3m",
  "return6m",
  "return12m",
  "volatility3m",
  "volatility6m",
  "drawdown12m",
  "trend3mVs12m",
  "observationCount",
  "featureTimestamp",
]);

const QUALITY_STATES = Object.freeze(["pass", "review_required", "blocked"]);

export const STEP236A_RULE_POLICY_V1 = deepFreeze({
  policyVersion: STEP236A_POLICY_VERSION,
  minimumObservationCount: 13,
  nullFeatureImputationAllowed: false,
  manualReviewRequiredForReviewStatus: true,
  positiveTrend: {
    return3mGt: 0,
    return12mGt: 0,
    trend3mVs12mGt: 0,
  },
  riskOff: {
    drawdown12mLte: -0.05,
    volatility3mGte: 0.025,
  },
});

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

function round6(value) {
  return Number(value.toFixed(6));
}

function sameKeys(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

function assertKnownPolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new TypeError("Step236A policy must be an object");
  }
  if (policy.policyVersion !== STEP236A_POLICY_VERSION) {
    throw new TypeError("Step236A unknown policy version");
  }
  if (policy.minimumObservationCount !== 13 || policy.nullFeatureImputationAllowed !== false) {
    throw new TypeError("Step236A coverage policy mismatch");
  }
}

function assertDatasetShape(dataset) {
  if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) {
    throw new TypeError("Step236A feature dataset must be an object");
  }
  if (dataset.schemaVersion !== STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION) {
    throw new TypeError("Step236A invalid feature schema");
  }
  if (dataset.featureContractVersion !== STEP235A_TRADING_FEATURE_CONTRACT_VERSION) {
    throw new TypeError("Step236A feature contract version mismatch");
  }
  if (!Array.isArray(dataset.records)) {
    throw new TypeError("Step236A records must be an array");
  }
  assertNoStep235ASensitiveMaterial(dataset);
  for (const record of dataset.records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new TypeError("Step236A feature record must be an object");
    }
    if (!record.features || typeof record.features !== "object" || Array.isArray(record.features)) {
      throw new TypeError("Step236A feature record is missing features");
    }
    for (const key of REQUIRED_FEATURE_KEYS) {
      if (!(key in record.features)) {
        throw new TypeError(`Step236A required feature missing: ${key}`);
      }
    }
  }
}

function assertQualityState(dataQualityStatus) {
  if (!QUALITY_STATES.includes(dataQualityStatus)) {
    throw new TypeError("Step236A unknown data quality state");
  }
}

function deriveDataQualityStatus(inputStatus, coverageReport) {
  if (inputStatus !== undefined) {
    assertQualityState(inputStatus);
    return inputStatus;
  }
  const leakageDetected = Object.values(coverageReport.leakageChecks ?? {}).some(Boolean);
  return leakageDetected ? "blocked" : "pass";
}

function compareRecords(left, right) {
  const splitOrder = { train: 0, validation: 1, test: 2 };
  const splitDelta = (splitOrder[left.split] ?? 99) - (splitOrder[right.split] ?? 99);
  if (splitDelta !== 0) return splitDelta;
  const timestampDelta = String(left.features.featureTimestamp).localeCompare(String(right.features.featureTimestamp));
  if (timestampDelta !== 0) return timestampDelta;
  const marketDelta = String(left.market ?? "").localeCompare(String(right.market ?? ""));
  if (marketDelta !== 0) return marketDelta;
  return String(left.recordId ?? "").localeCompare(String(right.recordId ?? ""));
}

function hasRequiredCoverage(features, policy) {
  if (features.observationCount < policy.minimumObservationCount) return false;
  return REQUIRED_FEATURE_KEYS.every((key) => features[key] !== null && features[key] !== undefined);
}

function isRiskOff(features, policy) {
  return (
    features.drawdown12m <= policy.riskOff.drawdown12mLte ||
    features.volatility3m >= policy.riskOff.volatility3mGte
  );
}

function isEligibleTrend(features, policy) {
  return (
    features.return3m > policy.positiveTrend.return3mGt &&
    features.return12m > policy.positiveTrend.return12mGt &&
    features.trend3mVs12m > policy.positiveTrend.trend3mVs12mGt
  );
}

function evaluateDecision(record, policy, dataQualityStatus, manualReviewApproved) {
  if (dataQualityStatus === "blocked") return "blocked_by_data_quality";
  if (!hasRequiredCoverage(record.features, policy)) return "insufficient_history";
  if (isRiskOff(record.features, policy)) return "risk_off";
  if (isEligibleTrend(record.features, policy)) {
    if (dataQualityStatus === "review_required" && manualReviewApproved !== true) return "hold";
    return "eligible_for_research";
  }
  return "hold";
}

function buildRecordCounts(decisions) {
  const byDecision = Object.fromEntries(DECISION_ORDER.map((decision) => [decision, 0]));
  for (const decision of decisions) {
    byDecision[decision] += 1;
  }
  return {
    total: decisions.length,
    eligibleForResearch: byDecision.eligible_for_research,
    hold: byDecision.hold,
    riskOff: byDecision.risk_off,
    insufficientHistory: byDecision.insufficient_history,
    blockedByDataQuality: byDecision.blocked_by_data_quality,
  };
}

function buildDecisionDistribution(decisions) {
  const counts = buildRecordCounts(decisions);
  const byDecision = {
    eligible_for_research: counts.eligibleForResearch,
    hold: counts.hold,
    risk_off: counts.riskOff,
    insufficient_history: counts.insufficientHistory,
    blocked_by_data_quality: counts.blockedByDataQuality,
  };
  return DECISION_ORDER.map((decision) => ({
    decision,
    count: byDecision[decision],
    ratio: counts.total === 0 ? 0 : round6(byDecision[decision] / counts.total),
  }));
}

function buildSafety() {
  return {
    modelTrainingAllowed: false,
    performanceClaimAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  };
}

function buildReadiness() {
  return {
    actualLiveTradingReady: false,
    state: "blocked",
  };
}

export function buildStep236ARulesBasedTradingEligibilityReport(input = {}) {
  const source = clonePlain(input);
  const dataset = source.dataset ?? buildStep235AOfflineFeatureDataset();
  const policy = source.policy ?? STEP236A_RULE_POLICY_V1;

  assertKnownPolicy(policy);
  assertDatasetShape(dataset);

  const coverageReport = source.coverageReport ?? buildStep235BOfflineFeatureCoverageReport({ dataset });
  const dataQualityStatus = deriveDataQualityStatus(source.dataQualityStatus, coverageReport);

  assertQualityState(dataQualityStatus);

  const records = clonePlain(dataset.records).sort(compareRecords);
  const decisions = records.map((record) => (
    evaluateDecision(record, policy, dataQualityStatus, source.manualReviewApproved)
  ));
  const report = {
    schemaVersion: STEP236A_ELIGIBILITY_SCHEMA_VERSION,
    policyVersion: policy.policyVersion,
    mode: STEP236A_ELIGIBILITY_MODE,
    recordCounts: buildRecordCounts(decisions),
    decisionDistribution: buildDecisionDistribution(decisions),
    coverageRequirements: {
      minimumObservationCount: policy.minimumObservationCount,
      nullFeatureImputationAllowed: policy.nullFeatureImputationAllowed,
    },
    safety: buildSafety(),
    readiness: buildReadiness(),
  };
  validateStep236AEligibilityReport(report);
  assertNoStep236AEligibilitySensitiveMaterial(report);
  return deepFreeze(report);
}

export function formatStep236ARulesBasedTradingEligibilityReport(report = buildStep236ARulesBasedTradingEligibilityReport()) {
  const lines = [
    "FINPLE OFFLINE RULES-BASED RESEARCH ELIGIBILITY",
    "",
    `Records: ${report.recordCounts.total}`,
    `Eligible for research: ${report.recordCounts.eligibleForResearch}`,
    `Hold: ${report.recordCounts.hold}`,
    `Risk off: ${report.recordCounts.riskOff}`,
    `Insufficient history: ${report.recordCounts.insufficientHistory}`,
    `Blocked by data quality: ${report.recordCounts.blockedByDataQuality}`,
    `Policy: ${report.policyVersion}`,
    `Minimum observations: ${report.coverageRequirements.minimumObservationCount}`,
    `Null imputation: ${report.coverageRequirements.nullFeatureImputationAllowed ? "Allowed" : "Blocked"}`,
    `Model training allowed: ${report.safety.modelTrainingAllowed ? "Yes" : "No"}`,
    `Performance claim allowed: ${report.safety.performanceClaimAllowed ? "Yes" : "No"}`,
    `Order submission allowed: ${report.safety.orderSubmissionAllowed ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Open"}`,
  ];
  return `${lines.join("\n")}\n`;
}

export function validateStep236AEligibilityReport(report) {
  if (!sameKeys(report, TOP_LEVEL_KEYS)) {
    throw new TypeError("Step236A report top-level key set mismatch");
  }
  if (!sameKeys(report.recordCounts, RECORD_COUNT_KEYS)) {
    throw new TypeError("Step236A record count key set mismatch");
  }
  if (!Array.isArray(report.decisionDistribution)) {
    throw new TypeError("Step236A decision distribution must be an array");
  }
  for (const entry of report.decisionDistribution) {
    if (!sameKeys(entry, DECISION_DISTRIBUTION_KEYS)) {
      throw new TypeError("Step236A decision distribution key set mismatch");
    }
    if (!DECISION_ORDER.includes(entry.decision)) {
      throw new TypeError("Step236A unknown decision state");
    }
  }
  if (!sameKeys(report.coverageRequirements, COVERAGE_REQUIREMENT_KEYS)) {
    throw new TypeError("Step236A coverage requirement key set mismatch");
  }
  if (!sameKeys(report.safety, SAFETY_KEYS)) {
    throw new TypeError("Step236A safety key set mismatch");
  }
  if (!sameKeys(report.readiness, READINESS_KEYS)) {
    throw new TypeError("Step236A readiness key set mismatch");
  }
  const decisionTotal = report.recordCounts.eligibleForResearch +
    report.recordCounts.hold +
    report.recordCounts.riskOff +
    report.recordCounts.insufficientHistory +
    report.recordCounts.blockedByDataQuality;
  if (decisionTotal !== report.recordCounts.total) {
    throw new TypeError("Step236A decision count total mismatch");
  }
}

export function assertNoStep236AEligibilitySensitiveMaterial(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
    /synthetic-us-core/i,
    /synthetic-kr-core/i,
    /recordId/i,
    /rawProviderPayload/i,
    /providerPayload/i,
    /orderPayload/i,
    /rawResponse/i,
    /credential/i,
    /secret/i,
    /token/i,
    /account/i,
    /hash/i,
    /digest/i,
    /fingerprint/i,
    /close/i,
    /monthlyReturn/i,
    /forwardReturn1m/i,
    /labelClass/i,
    /2020-\d{2}-\d{2}T/i,
    /2021-\d{2}-\d{2}T/i,
    /targetWeight/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step236A report leaked prohibited material: ${pattern}`);
    }
  }
}

export const STEP236A_RULES_BASED_ELIGIBILITY_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  recordCountKeys: RECORD_COUNT_KEYS,
  decisionDistributionKeys: DECISION_DISTRIBUTION_KEYS,
  coverageRequirementKeys: COVERAGE_REQUIREMENT_KEYS,
  safetyKeys: SAFETY_KEYS,
  readinessKeys: READINESS_KEYS,
  decisionOrder: DECISION_ORDER,
  requiredFeatureKeys: REQUIRED_FEATURE_KEYS,
  schemaVersion: STEP236A_ELIGIBILITY_SCHEMA_VERSION,
  policyVersion: STEP236A_POLICY_VERSION,
  mode: STEP236A_ELIGIBILITY_MODE,
  policy: STEP236A_RULE_POLICY_V1,
  redacted: true,
});
