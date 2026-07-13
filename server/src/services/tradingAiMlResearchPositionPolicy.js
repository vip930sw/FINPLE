import {
  STEP236A_POLICY_VERSION,
  buildStep236ARulesBasedTradingEligibilityReport,
  validateStep236AEligibilityReport,
} from "./tradingAiMlRulesBasedTradingEligibility.js";

export const STEP236B_POSITION_POLICY_SCHEMA_VERSION = "1.0.0";
export const STEP236B_POSITION_POLICY_VERSION = "1.0.0";
export const STEP236B_POSITION_POLICY_MODE = "offline_research_position_policy";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "policyVersion",
  "mode",
  "recordCounts",
  "decisionCounts",
  "transitionCounts",
  "exposureSummary",
  "safety",
  "readiness",
]);

const RECORD_COUNT_KEYS = Object.freeze([
  "totalDecisions",
  "appliedTransitions",
  "unappliedFinalDecisions",
]);

const DECISION_COUNT_KEYS = Object.freeze([
  "eligibleForResearch",
  "hold",
  "riskOff",
  "insufficientHistory",
  "blockedByDataQuality",
]);

const TRANSITION_COUNT_KEYS = Object.freeze([
  "flatToExposed",
  "exposedToFlat",
  "remainedExposed",
  "remainedFlat",
]);

const EXPOSURE_SUMMARY_KEYS = Object.freeze([
  "initialExposure",
  "minimumExposure",
  "maximumExposure",
  "periodsExposed",
  "periodsFlat",
]);

const SAFETY_KEYS = Object.freeze([
  "samePeriodExecutionAllowed",
  "leverageAllowed",
  "shortExposureAllowed",
  "performanceClaimAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
]);

const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

const LEDGER_KEYS = Object.freeze([
  "sequence",
  "decisionStatus",
  "priorExposure",
  "targetExposure",
  "effectiveExposure",
  "applicationState",
  "decisionTimestamp",
  "effectiveFrom",
]);

const DECISION_STATUS_ORDER = Object.freeze([
  "eligible_for_research",
  "hold",
  "risk_off",
  "insufficient_history",
  "blocked_by_data_quality",
]);

const DECISION_COUNT_MAP = Object.freeze({
  eligible_for_research: "eligibleForResearch",
  hold: "hold",
  risk_off: "riskOff",
  insufficient_history: "insufficientHistory",
  blocked_by_data_quality: "blockedByDataQuality",
});

const APPLICATION_STATES = Object.freeze(["applied_next_period", "unapplied_no_next_period"]);

export const STEP236B_POSITION_POLICY_V1 = deepFreeze({
  policyVersion: STEP236B_POSITION_POLICY_VERSION,
  sourceEligibilityPolicyVersion: STEP236A_POLICY_VERSION,
  initialExposure: 0,
  minimumExposure: 0,
  maximumExposure: 1,
  samePeriodExecutionAllowed: false,
  leverageAllowed: false,
  shortExposureAllowed: false,
  statusTargetExposure: {
    eligible_for_research: 1,
    hold: "previous_effective_exposure",
    risk_off: 0,
    insufficient_history: 0,
    blocked_by_data_quality: 0,
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

function sameKeys(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

function assertKnownPolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new TypeError("Step236B policy must be an object");
  }
  if (policy.policyVersion !== STEP236B_POSITION_POLICY_VERSION) {
    throw new TypeError("Step236B unknown policy version");
  }
  if (policy.initialExposure !== 0 || policy.minimumExposure !== 0 || policy.maximumExposure !== 1) {
    throw new TypeError("Step236B exposure bounds mismatch");
  }
  if (
    policy.samePeriodExecutionAllowed !== false ||
    policy.leverageAllowed !== false ||
    policy.shortExposureAllowed !== false
  ) {
    throw new TypeError("Step236B safety policy must remain fail closed");
  }
  for (const status of DECISION_STATUS_ORDER) {
    const target = policy.statusTargetExposure?.[status];
    if (status === "hold") {
      if (target !== "previous_effective_exposure") {
        throw new TypeError("Step236B hold policy must preserve previous exposure");
      }
    } else if (target !== 0 && target !== 1) {
      throw new TypeError("Step236B invalid target exposure");
    }
  }
}

function assertNoProhibitedInputMaterial(value) {
  const serialized = JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
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
    /targetWeight/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step236B prohibited material detected: ${pattern}`);
    }
  }
}

function assertKnownDecisionStatus(status) {
  if (!DECISION_STATUS_ORDER.includes(status)) {
    throw new TypeError("Step236B unknown eligibility status");
  }
}

function timestampValue(value) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError("Step236B invalid timestamp");
  }
  return parsed;
}

function compareDecisions(left, right) {
  const timestampDelta = String(left.decisionTimestamp).localeCompare(String(right.decisionTimestamp));
  if (timestampDelta !== 0) return timestampDelta;
  return Number(left.sequence ?? 0) - Number(right.sequence ?? 0);
}

function decisionCountsFromEligibilityReport(eligibilityReport) {
  validateStep236AEligibilityReport(eligibilityReport);
  return {
    eligible_for_research: eligibilityReport.recordCounts.eligibleForResearch,
    hold: eligibilityReport.recordCounts.hold,
    risk_off: eligibilityReport.recordCounts.riskOff,
    insufficient_history: eligibilityReport.recordCounts.insufficientHistory,
    blocked_by_data_quality: eligibilityReport.recordCounts.blockedByDataQuality,
  };
}

function defaultTimestamp(sequence) {
  const zeroBased = sequence - 1;
  const year = 2024 + Math.floor(zeroBased / 12);
  const month = String((zeroBased % 12) + 1).padStart(2, "0");
  return `${year}-${month}-28T00:00:00.000Z`;
}

function decisionsFromEligibilityReport(eligibilityReport) {
  const counts = decisionCountsFromEligibilityReport(eligibilityReport);
  const decisions = [];
  let sequence = 1;
  for (const status of DECISION_STATUS_ORDER) {
    for (let index = 0; index < counts[status]; index += 1) {
      decisions.push({
        sequence,
        decisionStatus: status,
        decisionTimestamp: defaultTimestamp(sequence),
      });
      sequence += 1;
    }
  }
  return decisions;
}

function normalizeDecisionInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Step236B decision input must be an object");
  }
  if (!("decisionStatus" in input)) {
    throw new TypeError("Step236B decision status missing");
  }
  assertKnownDecisionStatus(input.decisionStatus);
  if (!input.decisionTimestamp) {
    throw new TypeError("Step236B decision timestamp missing");
  }
  return {
    sequence: Number(input.sequence ?? 0),
    decisionStatus: input.decisionStatus,
    decisionTimestamp: String(input.decisionTimestamp),
    effectiveFrom: input.effectiveFrom === undefined ? undefined : input.effectiveFrom,
    targetExposure: input.targetExposure === undefined ? undefined : input.targetExposure,
  };
}

function normalizeDecisions(input) {
  assertNoProhibitedInputMaterial(input);
  const source = Array.isArray(input.eligibilityDecisions)
    ? input.eligibilityDecisions
    : decisionsFromEligibilityReport(input.eligibilityReport ?? buildStep236ARulesBasedTradingEligibilityReport());
  const decisions = source.map(normalizeDecisionInput).sort(compareDecisions);
  for (let index = 0; index < decisions.length; index += 1) {
    const current = decisions[index];
    const currentTs = timestampValue(current.decisionTimestamp);
    if (index > 0 && currentTs <= timestampValue(decisions[index - 1].decisionTimestamp)) {
      throw new TypeError("Step236B decision timestamps must be strictly increasing");
    }
    const next = decisions[index + 1];
    if (current.effectiveFrom !== undefined) {
      if (current.effectiveFrom === null) {
        if (next) throw new TypeError("Step236B effectiveFrom missing before final decision");
      } else {
        const effectiveTs = timestampValue(current.effectiveFrom);
        if (effectiveTs <= currentTs) {
          throw new TypeError("Step236B same-period application is not allowed");
        }
        if (next && current.effectiveFrom !== next.decisionTimestamp) {
          throw new TypeError("Step236B effectiveFrom must be the next observation period");
        }
      }
    }
  }
  return decisions.map((decision, index) => ({
    ...decision,
    sequence: index + 1,
  }));
}

function targetExposureFor(status, priorExposure, policy) {
  if (status === "hold") return priorExposure;
  return policy.statusTargetExposure[status];
}

function assertExposureWithinBounds(exposure, policy) {
  if (typeof exposure !== "number" || !Number.isFinite(exposure)) {
    throw new TypeError("Step236B exposure must be numeric");
  }
  if (exposure < policy.minimumExposure) {
    throw new TypeError("Step236B negative exposure is not allowed");
  }
  if (exposure > policy.maximumExposure) {
    throw new TypeError("Step236B target exposure exceeds maximum");
  }
}

function buildLedger(decisions, policy) {
  let currentExposure = policy.initialExposure;
  const ledger = decisions.map((decision, index) => {
    const nextDecision = decisions[index + 1];
    const priorExposure = currentExposure;
    const targetExposure = targetExposureFor(decision.decisionStatus, priorExposure, policy);
    if (decision.targetExposure !== undefined && decision.targetExposure !== targetExposure) {
      if (decision.decisionStatus === "hold") {
        throw new TypeError("Step236B hold cannot create arbitrary exposure");
      }
      if (decision.decisionStatus === "blocked_by_data_quality" && decision.targetExposure !== 0) {
        throw new TypeError("Step236B blocked status cannot remain exposed");
      }
      throw new TypeError("Step236B decision target exposure mismatch");
    }
    assertExposureWithinBounds(targetExposure, policy);
    const applied = Boolean(nextDecision);
    const effectiveExposure = applied ? targetExposure : priorExposure;
    if (applied) currentExposure = effectiveExposure;
    return {
      sequence: index + 1,
      decisionStatus: decision.decisionStatus,
      priorExposure,
      targetExposure,
      effectiveExposure,
      applicationState: applied ? "applied_next_period" : "unapplied_no_next_period",
      decisionTimestamp: decision.decisionTimestamp,
      effectiveFrom: applied ? nextDecision.decisionTimestamp : null,
    };
  });
  return ledger;
}

function buildDecisionCounts(ledger) {
  const counts = Object.fromEntries(DECISION_STATUS_ORDER.map((status) => [DECISION_COUNT_MAP[status], 0]));
  for (const entry of ledger) {
    counts[DECISION_COUNT_MAP[entry.decisionStatus]] += 1;
  }
  return counts;
}

function buildTransitionCounts(ledger) {
  const counts = {
    flatToExposed: 0,
    exposedToFlat: 0,
    remainedExposed: 0,
    remainedFlat: 0,
  };
  for (const entry of ledger.filter((item) => item.applicationState === "applied_next_period")) {
    if (entry.priorExposure === 0 && entry.effectiveExposure === 1) counts.flatToExposed += 1;
    if (entry.priorExposure === 1 && entry.effectiveExposure === 0) counts.exposedToFlat += 1;
    if (entry.priorExposure === 1 && entry.effectiveExposure === 1) counts.remainedExposed += 1;
    if (entry.priorExposure === 0 && entry.effectiveExposure === 0) counts.remainedFlat += 1;
  }
  return counts;
}

function buildExposureSummary(ledger, policy) {
  const applied = ledger.filter((entry) => entry.applicationState === "applied_next_period");
  return {
    initialExposure: policy.initialExposure,
    minimumExposure: policy.minimumExposure,
    maximumExposure: policy.maximumExposure,
    periodsExposed: applied.filter((entry) => entry.effectiveExposure === 1).length,
    periodsFlat: applied.filter((entry) => entry.effectiveExposure === 0).length,
  };
}

function buildSafety(policy) {
  return {
    samePeriodExecutionAllowed: policy.samePeriodExecutionAllowed,
    leverageAllowed: policy.leverageAllowed,
    shortExposureAllowed: policy.shortExposureAllowed,
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

export function buildStep236BResearchPositionTransitionLedger(input = {}) {
  const source = clonePlain(input);
  const policy = source.policy ?? STEP236B_POSITION_POLICY_V1;
  assertKnownPolicy(policy);
  const decisions = normalizeDecisions(source);
  const ledger = buildLedger(decisions, policy);
  validateStep236BTransitionLedger(ledger);
  return deepFreeze(ledger);
}

export function buildStep236BResearchPositionPolicyReport(input = {}) {
  const source = clonePlain(input);
  const policy = source.policy ?? STEP236B_POSITION_POLICY_V1;
  assertKnownPolicy(policy);
  const ledger = buildStep236BResearchPositionTransitionLedger(source);
  const transitionCounts = buildTransitionCounts(ledger);
  const report = {
    schemaVersion: STEP236B_POSITION_POLICY_SCHEMA_VERSION,
    policyVersion: policy.policyVersion,
    mode: STEP236B_POSITION_POLICY_MODE,
    recordCounts: {
      totalDecisions: ledger.length,
      appliedTransitions: ledger.filter((entry) => entry.applicationState === "applied_next_period").length,
      unappliedFinalDecisions: ledger.filter((entry) => entry.applicationState === "unapplied_no_next_period").length,
    },
    decisionCounts: buildDecisionCounts(ledger),
    transitionCounts,
    exposureSummary: buildExposureSummary(ledger, policy),
    safety: buildSafety(policy),
    readiness: buildReadiness(),
  };
  validateStep236BResearchPositionPolicyReport(report);
  assertNoStep236BPublicSensitiveMaterial(report);
  return deepFreeze(report);
}

export function formatStep236BResearchPositionPolicyReport(report = buildStep236BResearchPositionPolicyReport()) {
  const lines = [
    "FINPLE OFFLINE RESEARCH POSITION POLICY",
    "",
    `Decisions: ${report.recordCounts.totalDecisions}`,
    `Applied transitions: ${report.recordCounts.appliedTransitions}`,
    `Unapplied final decisions: ${report.recordCounts.unappliedFinalDecisions}`,
    `Flat to exposed: ${report.transitionCounts.flatToExposed}`,
    `Exposed to flat: ${report.transitionCounts.exposedToFlat}`,
    `Remained exposed: ${report.transitionCounts.remainedExposed}`,
    `Remained flat: ${report.transitionCounts.remainedFlat}`,
    `Periods exposed: ${report.exposureSummary.periodsExposed}`,
    `Periods flat: ${report.exposureSummary.periodsFlat}`,
    `Policy: ${report.policyVersion}`,
    `Same-period execution allowed: ${report.safety.samePeriodExecutionAllowed ? "Yes" : "No"}`,
    `Performance claim allowed: ${report.safety.performanceClaimAllowed ? "Yes" : "No"}`,
    `Order submission allowed: ${report.safety.orderSubmissionAllowed ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Open"}`,
  ];
  return `${lines.join("\n")}\n`;
}

export function validateStep236BTransitionLedger(ledger) {
  if (!Array.isArray(ledger)) {
    throw new TypeError("Step236B transition ledger must be an array");
  }
  for (const entry of ledger) {
    if (!sameKeys(entry, LEDGER_KEYS)) {
      throw new TypeError("Step236B transition ledger key set mismatch");
    }
    assertKnownDecisionStatus(entry.decisionStatus);
    assertExposureWithinBounds(entry.priorExposure, STEP236B_POSITION_POLICY_V1);
    assertExposureWithinBounds(entry.targetExposure, STEP236B_POSITION_POLICY_V1);
    assertExposureWithinBounds(entry.effectiveExposure, STEP236B_POSITION_POLICY_V1);
    if (!APPLICATION_STATES.includes(entry.applicationState)) {
      throw new TypeError("Step236B unknown application state");
    }
    if (entry.applicationState === "applied_next_period") {
      if (entry.effectiveFrom === null || timestampValue(entry.effectiveFrom) <= timestampValue(entry.decisionTimestamp)) {
        throw new TypeError("Step236B applied ledger must use next-period effectiveFrom");
      }
    }
    if (entry.applicationState === "unapplied_no_next_period" && entry.effectiveFrom !== null) {
      throw new TypeError("Step236B final decision must remain unapplied");
    }
  }
}

export function validateStep236BResearchPositionPolicyReport(report) {
  if (!sameKeys(report, TOP_LEVEL_KEYS)) {
    throw new TypeError("Step236B report top-level key set mismatch");
  }
  if (!sameKeys(report.recordCounts, RECORD_COUNT_KEYS)) {
    throw new TypeError("Step236B record count key set mismatch");
  }
  if (!sameKeys(report.decisionCounts, DECISION_COUNT_KEYS)) {
    throw new TypeError("Step236B decision count key set mismatch");
  }
  if (!sameKeys(report.transitionCounts, TRANSITION_COUNT_KEYS)) {
    throw new TypeError("Step236B transition count key set mismatch");
  }
  if (!sameKeys(report.exposureSummary, EXPOSURE_SUMMARY_KEYS)) {
    throw new TypeError("Step236B exposure summary key set mismatch");
  }
  if (!sameKeys(report.safety, SAFETY_KEYS)) {
    throw new TypeError("Step236B safety key set mismatch");
  }
  if (!sameKeys(report.readiness, READINESS_KEYS)) {
    throw new TypeError("Step236B readiness key set mismatch");
  }
  const decisionTotal = Object.values(report.decisionCounts).reduce((sum, count) => sum + count, 0);
  if (decisionTotal !== report.recordCounts.totalDecisions) {
    throw new TypeError("Step236B decision count total mismatch");
  }
  const transitionTotal = Object.values(report.transitionCounts).reduce((sum, count) => sum + count, 0);
  if (transitionTotal !== report.recordCounts.appliedTransitions) {
    throw new TypeError("Step236B transition count total mismatch");
  }
  if (report.exposureSummary.periodsExposed + report.exposureSummary.periodsFlat !== report.recordCounts.appliedTransitions) {
    throw new TypeError("Step236B exposure period total mismatch");
  }
}

export function assertNoStep236BPublicSensitiveMaterial(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
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
    /2024-\d{2}-\d{2}T/i,
    /targetWeight/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step236B public report leaked prohibited material: ${pattern}`);
    }
  }
}

export const STEP236B_RESEARCH_POSITION_POLICY_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  recordCountKeys: RECORD_COUNT_KEYS,
  decisionCountKeys: DECISION_COUNT_KEYS,
  transitionCountKeys: TRANSITION_COUNT_KEYS,
  exposureSummaryKeys: EXPOSURE_SUMMARY_KEYS,
  safetyKeys: SAFETY_KEYS,
  readinessKeys: READINESS_KEYS,
  ledgerKeys: LEDGER_KEYS,
  decisionStatuses: DECISION_STATUS_ORDER,
  applicationStates: APPLICATION_STATES,
  schemaVersion: STEP236B_POSITION_POLICY_SCHEMA_VERSION,
  policyVersion: STEP236B_POSITION_POLICY_VERSION,
  mode: STEP236B_POSITION_POLICY_MODE,
  policy: STEP236B_POSITION_POLICY_V1,
  redactedPublicReport: true,
});
