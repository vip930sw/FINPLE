import test from "node:test";
import assert from "node:assert/strict";

import { TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS } from "./tradingMockHistoryBrowser.js";
import {
  TRADING_LAB_MOCK_HISTORY_COMPARE_MODEL,
  buildAdminTradingLabMockHistoryCompareStatus,
  buildMockHistoryCompare,
} from "./tradingMockHistoryCompare.js";

const BASELINE_RUN = "mock-run-2026-07-01-balanced-growth-v3";
const INCOME_RUN = "mock-run-2026-07-02-income-tilt-v2";
const CASH_RUN = "mock-run-2026-07-04-cash-defense-v4";
const BLOCKED_RUN = "mock-run-2026-07-03-risk-cap-v1";
const TECH_RUN = "mock-run-2026-07-10-tech-core-v5";

test("Step189 compare model is deterministic and mock-only", () => {
  const first = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });
  const second = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });

  assert.deepEqual(second, first);
  assert.equal(first.source, "deterministic_mock_history");
  assert.equal(first.scope, "admin_mock_trading_lab");
  assert.equal(first.status, "mock_only");
  assert.equal(first.redacted, true);
  assert.equal(TRADING_LAB_MOCK_HISTORY_COMPARE_MODEL.maxCompareCount, 3);
});

test("Step189 only 2 to 3 supported runs become compare-ready", () => {
  const one = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN] });
  const two = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });
  const three = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN, CASH_RUN] });
  const four = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN, CASH_RUN, TECH_RUN] });

  assert.equal(one.compareReady, false);
  assert.equal(one.eligibilityReasons.includes("select_at_least_two_supported_mock_runs"), true);
  assert.equal(two.compareReady, true);
  assert.equal(three.compareReady, true);
  assert.equal(four.compareReady, false);
  assert.equal(four.eligibilityReasons.includes("max_three_mock_runs_allowed"), true);
});

test("Step189 rejects unsupported history statuses", () => {
  const compare = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, BLOCKED_RUN] });

  assert.equal(compare.compareReady, false);
  assert.equal(compare.status, "blocked");
  assert.equal(compare.eligibilityReasons.includes("unsupported_status_selected"), true);
});

test("Step189 validates required mock metrics", () => {
  const records = TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS.map((record) => (
    record.runId === INCOME_RUN ? { ...record, sharpe: undefined } : record
  ));
  const compare = buildMockHistoryCompare({ records, selectedRunIds: [BASELINE_RUN, INCOME_RUN] });

  assert.equal(compare.compareReady, false);
  assert.equal(compare.eligibilityReasons.includes("required_mock_metric_missing"), true);
});

test("Step189 calculationVersion compatibility controls ranking", () => {
  const compatible = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });
  const incompatible = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, TECH_RUN] });

  assert.equal(compatible.compatibilityStatus, "compatible");
  assert.equal(compatible.rankings.every((ranking) => ranking.rankingStatus === "mock_only_ranked"), true);
  assert.equal(incompatible.compatibilityStatus, "incompatible");
  assert.equal(incompatible.compatibilityWarnings.includes("calculation_version_mismatch_ranking_restricted"), true);
  assert.equal(incompatible.rankings.every((ranking) => ranking.rankingStatus === "restricted_calculation_version"), true);
});

test("Step189 metric difference calculation is deterministic", () => {
  const compare = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });
  const returnComparison = compare.metricComparisons.find((metric) => metric.metricKey === "cumulativeReturn");
  const incomeValue = returnComparison.values.find((value) => value.runId === INCOME_RUN);

  assert.equal(incomeValue.differenceFromBaseline, -2.07);
});

test("Step189 ranking directions are correct", () => {
  const compare = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN, CASH_RUN] });
  const returnRanking = compare.rankings.find((ranking) => ranking.metricKey === "cumulativeReturn");
  const mddRanking = compare.rankings.find((ranking) => ranking.metricKey === "mdd");
  const riskRanking = compare.rankings.find((ranking) => ranking.metricKey === "riskScore");
  const sharpeRanking = compare.rankings.find((ranking) => ranking.metricKey === "sharpe");

  assert.equal(returnRanking.ranking[0].runId, BASELINE_RUN);
  assert.equal(mddRanking.ranking[0].runId, CASH_RUN);
  assert.equal(riskRanking.ranking[0].runId, CASH_RUN);
  assert.equal(sharpeRanking.ranking[0].runId, BASELINE_RUN);
});

test("Step189 allocation and risk comparisons are deterministic", () => {
  const compare = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN, CASH_RUN] });

  assert.equal(compare.allocationComparisons.length, 5);
  assert.equal(compare.allocationComparisons.every((bucket) => bucket.redacted === true), true);
  assert.equal(compare.riskComparisons.length, 3);
  assert.deepEqual(compare.riskComparisons.map((risk) => risk.riskLevel), ["medium", "low", "low"]);
});

test("Step189 restore eligibility contract exists but action stays blocked", () => {
  const compare = buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });

  assert.equal(compare.restoreCandidateEligibility.length, 2);
  assert.equal(compare.restoreCandidateEligibility.every((entry) => entry.restoreEligible === true), true);
  assert.equal(compare.restoreCandidateEligibility.every((entry) => entry.dbWriteStatus === "blocked"), true);
  assert.equal(JSON.stringify(compare.restoreCandidateEligibility).includes("step190_restore_candidate_contract_ready"), true);
});

test("Step189 status keeps DB provider order and live gates blocked", () => {
  const status = buildAdminTradingLabMockHistoryCompareStatus({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] });

  assert.equal(status.blockedConfirmation.endpointAdded, false);
  assert.equal(status.blockedConfirmation.dbReadAttempted, false);
  assert.equal(status.blockedConfirmation.dbWriteAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseSelectAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseInsertAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseUpdateAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseDeleteAttempted, false);
  assert.equal(status.blockedConfirmation.providerCallAttempted, false);
  assert.equal(status.blockedConfirmation.orderSubmissionAttempted, false);
  assert.equal(status.blockedConfirmation.restoreActionCreated, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.dbReadAllowed, false);
  assert.equal(status.dbWriteAllowed, false);
});

test("Step189 compare payload excludes sensitive identifiers", () => {
  const serialized = JSON.stringify(buildMockHistoryCompare({ selectedRunIds: [BASELINE_RUN, INCOME_RUN] }));

  for (const forbidden of [
    "account_number",
    "credential",
    "provider_payload",
    "order_payload",
    "raw_provider_response",
    "hash_value",
    "digest_value",
    "actual_order_id",
    "actual_fill_id",
    "actual_execution_id",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});
