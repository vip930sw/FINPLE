import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP236B_POSITION_POLICY_V1,
  STEP236B_RESEARCH_POSITION_POLICY_CONTRACT,
  assertNoStep236BPublicSensitiveMaterial,
  buildStep236BResearchPositionPolicyReport,
  buildStep236BResearchPositionTransitionLedger,
  formatStep236BResearchPositionPolicyReport,
  validateStep236BResearchPositionPolicyReport,
  validateStep236BTransitionLedger,
} from "./tradingAiMlResearchPositionPolicy.js";
import {
  buildStep236ARulesBasedTradingEligibilityReport,
} from "./tradingAiMlRulesBasedTradingEligibility.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function transitionFixture() {
  return [
    { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-01-31T00:00:00.000Z" },
    { decisionStatus: "hold", decisionTimestamp: "2024-02-29T00:00:00.000Z" },
    { decisionStatus: "risk_off", decisionTimestamp: "2024-03-31T00:00:00.000Z" },
    { decisionStatus: "hold", decisionTimestamp: "2024-04-30T00:00:00.000Z" },
    { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-05-31T00:00:00.000Z" },
    { decisionStatus: "blocked_by_data_quality", decisionTimestamp: "2024-06-30T00:00:00.000Z" },
    { decisionStatus: "insufficient_history", decisionTimestamp: "2024-07-31T00:00:00.000Z" },
    { decisionStatus: "risk_off", decisionTimestamp: "2024-08-31T00:00:00.000Z" },
    { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-09-30T00:00:00.000Z" },
  ];
}

function shuffledFixture() {
  return clone(transitionFixture()).reverse();
}

test("Step236B report exposes exact public schema and fixed fail-closed policy", () => {
  const report = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: transitionFixture() });

  assert.deepEqual(Object.keys(report), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.topLevelKeys);
  assert.deepEqual(Object.keys(report.recordCounts), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.recordCountKeys);
  assert.deepEqual(Object.keys(report.decisionCounts), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.decisionCountKeys);
  assert.deepEqual(Object.keys(report.transitionCounts), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.transitionCountKeys);
  assert.deepEqual(Object.keys(report.exposureSummary), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.exposureSummaryKeys);
  assert.deepEqual(Object.keys(report.safety), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.safetyKeys);
  assert.deepEqual(Object.keys(report.readiness), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.readinessKeys);
  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.policyVersion, "1.0.0");
  assert.equal(report.mode, "offline_research_position_policy");
  assert.deepEqual(report.safety, {
    samePeriodExecutionAllowed: false,
    leverageAllowed: false,
    shortExposureAllowed: false,
    performanceClaimAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  });
  assert.deepEqual(report.readiness, {
    actualLiveTradingReady: false,
    state: "blocked",
  });
});

test("Step236B transition fixture applies decisions from the next period only", () => {
  const ledger = buildStep236BResearchPositionTransitionLedger({ eligibilityDecisions: transitionFixture() });

  assert.deepEqual(Object.keys(ledger[0]), STEP236B_RESEARCH_POSITION_POLICY_CONTRACT.ledgerKeys);
  assert.equal(ledger[0].decisionStatus, "eligible_for_research");
  assert.equal(ledger[0].priorExposure, 0);
  assert.equal(ledger[0].targetExposure, 1);
  assert.equal(ledger[0].effectiveExposure, 1);
  assert.equal(ledger[0].effectiveFrom, ledger[1].decisionTimestamp);
  assert.equal(ledger[1].decisionStatus, "hold");
  assert.equal(ledger[1].priorExposure, 1);
  assert.equal(ledger[1].targetExposure, 1);
  assert.equal(ledger[1].effectiveExposure, 1);
  assert.equal(ledger[2].decisionStatus, "risk_off");
  assert.equal(ledger[2].priorExposure, 1);
  assert.equal(ledger[2].targetExposure, 0);
  assert.equal(ledger[2].effectiveExposure, 0);
  assert.equal(ledger[5].decisionStatus, "blocked_by_data_quality");
  assert.equal(ledger[5].targetExposure, 0);
  assert.equal(ledger[5].effectiveExposure, 0);
  assert.equal(ledger[6].decisionStatus, "insufficient_history");
  assert.equal(ledger[6].targetExposure, 0);
  assert.equal(ledger.at(-1).decisionStatus, "eligible_for_research");
  assert.equal(ledger.at(-1).targetExposure, 1);
  assert.equal(ledger.at(-1).effectiveExposure, 0);
  assert.equal(ledger.at(-1).applicationState, "unapplied_no_next_period");
  assert.equal(ledger.at(-1).effectiveFrom, null);
});

test("Step236B transition and exposure counts match the fixture ledger", () => {
  const report = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: transitionFixture() });

  assert.deepEqual(report.recordCounts, {
    totalDecisions: 9,
    appliedTransitions: 8,
    unappliedFinalDecisions: 1,
  });
  assert.deepEqual(report.decisionCounts, {
    eligibleForResearch: 3,
    hold: 2,
    riskOff: 2,
    insufficientHistory: 1,
    blockedByDataQuality: 1,
  });
  assert.deepEqual(report.transitionCounts, {
    flatToExposed: 2,
    exposedToFlat: 2,
    remainedExposed: 1,
    remainedFlat: 3,
  });
  assert.deepEqual(report.exposureSummary, {
    initialExposure: 0,
    minimumExposure: 0,
    maximumExposure: 1,
    periodsExposed: 3,
    periodsFlat: 5,
  });
});

test("Step236B uses Step236A aggregate output as the default source and keeps counts aligned", () => {
  const eligibility = buildStep236ARulesBasedTradingEligibilityReport();
  const report = buildStep236BResearchPositionPolicyReport({ eligibilityReport: eligibility });

  assert.equal(report.recordCounts.totalDecisions, eligibility.recordCounts.total);
  assert.deepEqual(report.decisionCounts, {
    eligibleForResearch: eligibility.recordCounts.eligibleForResearch,
    hold: eligibility.recordCounts.hold,
    riskOff: eligibility.recordCounts.riskOff,
    insufficientHistory: eligibility.recordCounts.insufficientHistory,
    blockedByDataQuality: eligibility.recordCounts.blockedByDataQuality,
  });
});

test("Step236B is deterministic canonical and input order independent", () => {
  const first = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: transitionFixture() });
  const second = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: transitionFixture() });
  const shuffled = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: shuffledFixture() });

  assert.deepEqual(first, second);
  assert.deepEqual(first, shuffled);
});

test("Step236B does not mutate Step236A output, decision input, policy, or ledger output", () => {
  const eligibility = buildStep236ARulesBasedTradingEligibilityReport();
  const decisions = transitionFixture();
  const policy = clone(STEP236B_POSITION_POLICY_V1);
  const beforeEligibility = JSON.stringify(eligibility);
  const beforeDecisions = JSON.stringify(decisions);
  const beforePolicy = JSON.stringify(policy);
  const ledger = buildStep236BResearchPositionTransitionLedger({ eligibilityDecisions: decisions, policy });
  const report = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: decisions, policy });

  assert.equal(JSON.stringify(eligibility), beforeEligibility);
  assert.equal(JSON.stringify(decisions), beforeDecisions);
  assert.equal(JSON.stringify(policy), beforePolicy);
  assert.throws(() => {
    ledger[0].effectiveExposure = 0;
  }, /Cannot assign/);
  assert.throws(() => {
    report.safety.liveTradingAllowed = true;
  }, /Cannot assign/);
});

test("Step236B public report and console text redact internal ledger rows and sensitive material", () => {
  const report = buildStep236BResearchPositionPolicyReport({ eligibilityDecisions: transitionFixture() });
  const text = formatStep236BResearchPositionPolicyReport(report);

  assert.doesNotThrow(() => validateStep236BResearchPositionPolicyReport(report));
  assert.doesNotThrow(() => assertNoStep236BPublicSensitiveMaterial(report));
  assert.doesNotThrow(() => assertNoStep236BPublicSensitiveMaterial(text));
  assert.equal(JSON.stringify(report).includes("decisionTimestamp"), false);
  assert.equal(JSON.stringify(report).includes("effectiveFrom"), false);
  assert.match(text, /FINPLE OFFLINE RESEARCH POSITION POLICY/);
  assert.match(text, /Same-period execution allowed: No/);
  assert.match(text, /Performance claim allowed: No/);
  assert.match(text, /Order submission allowed: No/);
  assert.match(text, /Live trading readiness: Blocked/);
});

test("Step236B failure fixtures reject invalid status policy exposure timing labels and sensitive input", () => {
  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [{ decisionStatus: "unknown", decisionTimestamp: "2024-01-31T00:00:00.000Z" }],
    }),
    /unknown eligibility status/,
  );

  const badVersion = clone(STEP236B_POSITION_POLICY_V1);
  badVersion.policyVersion = "9.9.9";
  assert.throws(() => buildStep236BResearchPositionPolicyReport({ policy: badVersion }), /unknown policy version/);

  const overMax = clone(STEP236B_POSITION_POLICY_V1);
  overMax.statusTargetExposure.eligible_for_research = 1.5;
  assert.throws(() => buildStep236BResearchPositionPolicyReport({ policy: overMax }), /invalid target exposure/);

  const negative = clone(STEP236B_POSITION_POLICY_V1);
  negative.statusTargetExposure.risk_off = -1;
  assert.throws(() => buildStep236BResearchPositionPolicyReport({ policy: negative }), /invalid target exposure/);

  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [
        {
          decisionStatus: "eligible_for_research",
          decisionTimestamp: "2024-01-31T00:00:00.000Z",
          effectiveFrom: "2024-01-31T00:00:00.000Z",
        },
      ],
    }),
    /same-period application/,
  );

  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [
        { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-01-31T00:00:00.000Z" },
        { decisionStatus: "hold", decisionTimestamp: "2024-01-31T00:00:00.000Z" },
      ],
    }),
    /strictly increasing/,
  );

  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [
        { decisionStatus: "eligible_for_research", decisionTimestamp: "2024-01-31T00:00:00.000Z" },
        {
          decisionStatus: "blocked_by_data_quality",
          decisionTimestamp: "2024-02-29T00:00:00.000Z",
          targetExposure: 1,
        },
      ],
    }),
    /blocked status cannot remain exposed/,
  );

  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [
        {
          decisionStatus: "hold",
          decisionTimestamp: "2024-01-31T00:00:00.000Z",
          targetExposure: 1,
        },
      ],
    }),
    /hold cannot create arbitrary exposure/,
  );

  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [
        {
          decisionStatus: "eligible_for_research",
          decisionTimestamp: "2024-01-31T00:00:00.000Z",
          forwardReturn1m: 0.99,
        },
      ],
    }),
    /prohibited material/,
  );

  assert.throws(
    () => buildStep236BResearchPositionPolicyReport({
      eligibilityDecisions: [
        {
          decisionStatus: "eligible_for_research",
          decisionTimestamp: "2024-01-31T00:00:00.000Z",
          rawProviderPayload: { value: "secret token" },
        },
      ],
    }),
    /prohibited material/,
  );
});

test("Step236B ledger validator rejects malformed public-like rows", () => {
  const ledger = clone(buildStep236BResearchPositionTransitionLedger({ eligibilityDecisions: transitionFixture() }));
  delete ledger[0].effectiveFrom;
  assert.throws(() => validateStep236BTransitionLedger(ledger), /key set mismatch/);
});
