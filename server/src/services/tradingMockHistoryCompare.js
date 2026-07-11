import {
  STEP188_MOCK_TRADING_HISTORY_BROWSER_FLAGS,
  TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS,
} from "./tradingMockHistoryBrowser.js";

export const STEP189_MOCK_TRADING_HISTORY_COMPARE_FLAGS = Object.freeze({
  ...STEP188_MOCK_TRADING_HISTORY_BROWSER_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  dbWriteAllowed: false,
  dbReadAllowed: false,
  supabaseMutationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const TRADING_LAB_MOCK_HISTORY_COMPARE_MODEL = Object.freeze({
  compareId: "string",
  source: "deterministic_mock_history",
  scope: "admin_mock_trading_lab",
  status: "mock_only | blocked | validation_required",
  redacted: true,
  selectedRunIds: "mock_run_id[]",
  selectedRuns: "redacted_mock_history_run[]",
  compareReady: "boolean",
  maxCompareCount: 3,
  compatibilityStatus: "compatible | compatible_with_warning | incompatible",
  compatibilityWarnings: "string[]",
  metricComparisons: "mock_metric_comparison[]",
  allocationComparisons: "mock_allocation_comparison[]",
  riskComparisons: "mock_risk_comparison[]",
  rankings: "mock_metric_ranking[]",
  highlightedDifferences: "mock_highlighted_difference[]",
  restoreCandidateEligibility: "mock_restore_candidate_eligibility[]",
  dbReadStatus: "blocked",
  dbWriteStatus: "blocked",
  nextStep: "mock_strategy_restore_candidate",
});

const SUPPORTED_COMPARE_STATUSES = new Set(["completed", "archived"]);
const MAX_COMPARE_COUNT = 3;
const REQUIRED_METRICS = [
  "finalMockEquity",
  "cumulativeReturn",
  "mdd",
  "volatility",
  "sharpe",
  "riskScore",
  "orderCount",
  "fillCount",
];

const METRIC_DEFINITIONS = Object.freeze([
  { key: "finalMockEquity", label: "final mock equity", direction: "higher_better", unit: "amount" },
  { key: "cumulativeReturn", label: "cumulative mock return", direction: "higher_better", unit: "percent" },
  { key: "mdd", label: "MDD defense", direction: "lower_abs_better", unit: "percent" },
  { key: "volatility", label: "volatility stability", direction: "lower_better", unit: "percent" },
  { key: "sharpe", label: "Sharpe", direction: "higher_better", unit: "ratio" },
  { key: "riskScore", label: "risk score", direction: "lower_better", unit: "score" },
  { key: "orderCount", label: "mock order count", direction: "neutral", unit: "count" },
  { key: "fillCount", label: "mock fill count", direction: "neutral", unit: "count" },
]);

const ALLOCATION_BUCKETS = Object.freeze(["equity", "income", "cash", "alternatives", "other"]);

function roundNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Number(number.toFixed(digits));
}

function getMetricValue(record, key) {
  if (key === "mdd") return roundNumber(Math.abs(Number(record.mdd || 0)));
  return roundNumber(record[key]);
}

function hasRequiredMetrics(record) {
  return REQUIRED_METRICS.every((key) => Number.isFinite(Number(record[key])));
}

function deriveAllocation(record) {
  const name = `${record.strategyName || ""} ${record.allocationSummary || ""}`.toLowerCase();
  if (name.includes("cash defense")) return { equity: 30, income: 35, cash: 35, alternatives: 0, other: 0 };
  if (name.includes("income") || name.includes("dividend")) return { equity: 25, income: 55, cash: 15, alternatives: 0, other: 5 };
  if (name.includes("low volatility")) return { equity: 45, income: 30, cash: 20, alternatives: 0, other: 5 };
  if (name.includes("tech")) return { equity: 75, income: 10, cash: 10, alternatives: 0, other: 5 };
  if (name.includes("balanced")) return { equity: 60, income: 25, cash: 10, alternatives: 0, other: 5 };
  return { equity: 50, income: 25, cash: 15, alternatives: 0, other: 10 };
}

function riskLevel(value) {
  const score = Number(value || 0);
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  return "high";
}

function sortForDefinition(records, definition) {
  const factor = definition.direction === "higher_better" ? -1 : 1;
  return [...records].sort((a, b) => {
    const left = getMetricValue(a, definition.key);
    const right = getMetricValue(b, definition.key);
    if (definition.direction === "neutral") return a.runId.localeCompare(b.runId);
    return (left - right) * factor || a.runId.localeCompare(b.runId);
  });
}

function buildMetricComparisons(selectedRuns) {
  const baseline = selectedRuns[0] || null;
  return METRIC_DEFINITIONS.map((definition) => ({
    metricKey: definition.key,
    label: definition.label,
    unit: definition.unit,
    interpretation: definition.direction,
    baselineRunId: baseline?.runId || null,
    values: selectedRuns.map((run) => {
      const value = getMetricValue(run, definition.key);
      const baselineValue = baseline ? getMetricValue(baseline, definition.key) : value;
      return {
        runId: run.runId,
        value,
        differenceFromBaseline: roundNumber(value - baselineValue),
        redacted: true,
      };
    }),
    redacted: true,
  }));
}

function buildRankings(selectedRuns, compatibilityStatus) {
  const rankingRestricted = compatibilityStatus === "incompatible";
  return METRIC_DEFINITIONS
    .filter((definition) => definition.direction !== "neutral")
    .map((definition) => ({
      metricKey: definition.key,
      label: definition.label,
      rankingStatus: rankingRestricted ? "restricted_calculation_version" : "mock_only_ranked",
      ranking: rankingRestricted ? [] : sortForDefinition(selectedRuns, definition).map((run, index) => ({
        rank: index + 1,
        runId: run.runId,
        value: getMetricValue(run, definition.key),
        redacted: true,
      })),
      redacted: true,
    }));
}

function buildAllocationComparisons(selectedRuns) {
  const allocations = selectedRuns.map((run) => ({
    runId: run.runId,
    allocation: deriveAllocation(run),
    redacted: true,
  }));

  return ALLOCATION_BUCKETS.map((bucket) => {
    const values = allocations.map((entry) => ({
      runId: entry.runId,
      weight: entry.allocation[bucket],
      redacted: true,
    }));
    const weights = values.map((entry) => entry.weight);
    const maxWeight = Math.max(...weights, 0);
    const minWeight = Math.min(...weights, 0);
    return {
      bucket,
      values,
      maxDifference: roundNumber(maxWeight - minWeight),
      rebalanceNeededCandidate: maxWeight - minWeight >= 20,
      redacted: true,
    };
  });
}

function buildRiskComparisons(selectedRuns) {
  return selectedRuns.map((run) => ({
    runId: run.runId,
    riskScore: run.riskScore,
    riskLevel: riskLevel(run.riskScore),
    mddAbs: getMetricValue(run, "mdd"),
    volatility: getMetricValue(run, "volatility"),
    warningCount: run.warningCount,
    blockerCount: run.blockerCount,
    concentrationRisk: run.riskScore > 50 ? "medium_or_high_candidate" : "low_candidate",
    liquidityRisk: run.assetCount <= 3 ? "medium_candidate" : "low_candidate",
    volatilityRisk: run.volatility >= 10 ? "high_candidate" : run.volatility >= 7 ? "medium_candidate" : "low_candidate",
    redacted: true,
  }));
}

function buildHighlightedDifferences(selectedRuns) {
  if (selectedRuns.length < 2) return [];
  const metrics = ["cumulativeReturn", "finalMockEquity", "mdd", "volatility", "sharpe", "riskScore"];
  return metrics.map((metricKey) => {
    const definition = METRIC_DEFINITIONS.find((item) => item.key === metricKey);
    const values = selectedRuns.map((run) => ({ runId: run.runId, value: getMetricValue(run, metricKey) }));
    const highest = values.reduce((best, current) => (current.value > best.value ? current : best), values[0]);
    const lowest = values.reduce((best, current) => (current.value < best.value ? current : best), values[0]);
    return {
      metricKey,
      label: definition?.label || metricKey,
      highestRunId: highest.runId,
      lowestRunId: lowest.runId,
      spread: roundNumber(highest.value - lowest.value),
      interpretation: definition?.direction || "neutral",
      note: metricKey === "mdd" ? "lower absolute MDD is more defensive in mock-only comparison" : "mock-only relative difference",
      redacted: true,
    };
  });
}

function buildRestoreEligibility(selectedRuns) {
  return selectedRuns.map((run) => {
    const eligible = SUPPORTED_COMPARE_STATUSES.has(run.runStatus)
      && Boolean(run.strategyVersion)
      && Boolean(run.inputSummary)
      && run.redacted === true
      && run.compareSupported === true;
    return {
      restoreEligible: eligible,
      restoreSourceRunId: run.runId,
      sourceStrategyVersion: run.strategyVersion,
      copiedFieldCandidates: eligible ? ["strategyPresetId", "strategyVersion", "inputSummary", "allocationSummary"] : [],
      excludedFields: ["provider packet excluded", "order packet excluded", "account reference excluded", "raw response excluded", "database key excluded"],
      reason: eligible ? "step190_restore_candidate_contract_ready" : "restore_candidate_blocked_by_mock_guard",
      dbWriteStatus: "blocked",
      redacted: true,
    };
  });
}

function selectRuns(records, selectedRunIds) {
  return selectedRunIds
    .map((runId) => records.find((record) => record.runId === runId))
    .filter(Boolean);
}

export function buildMockHistoryCompare(input = {}) {
  const records = input.records || TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS;
  const selectedRunIds = Array.isArray(input.selectedRunIds)
    ? input.selectedRunIds.slice(0, MAX_COMPARE_COUNT + 1)
    : [
        "mock-run-2026-07-01-balanced-growth-v3",
        "mock-run-2026-07-02-income-tilt-v2",
      ];
  const selectedRuns = selectRuns(records, selectedRunIds);
  const unsupportedRuns = selectedRuns.filter((run) => !SUPPORTED_COMPARE_STATUSES.has(run.runStatus) || run.compareSupported !== true);
  const missingMetrics = selectedRuns.filter((run) => !hasRequiredMetrics(run));
  const calculationVersions = [...new Set(selectedRuns.map((run) => run.calculationVersion).filter(Boolean))];
  const eligibilityReasons = [];

  if (selectedRuns.length < 2) eligibilityReasons.push("select_at_least_two_supported_mock_runs");
  if (selectedRunIds.length > MAX_COMPARE_COUNT || selectedRuns.length > MAX_COMPARE_COUNT) eligibilityReasons.push("max_three_mock_runs_allowed");
  if (unsupportedRuns.length > 0) eligibilityReasons.push("unsupported_status_selected");
  if (missingMetrics.length > 0) eligibilityReasons.push("required_mock_metric_missing");

  let compatibilityStatus = "compatible";
  if (calculationVersions.length > 1) {
    compatibilityStatus = calculationVersions.some((version) => version !== "mock_calc_v3")
      ? "incompatible"
      : "compatible_with_warning";
  }

  const compareReady = selectedRuns.length >= 2
    && selectedRuns.length <= MAX_COMPARE_COUNT
    && unsupportedRuns.length === 0
    && missingMetrics.length === 0;

  const compatibilityWarnings = [];
  if (calculationVersions.length === 1) compatibilityWarnings.push("calculation_versions_match");
  if (compatibilityStatus === "compatible_with_warning") compatibilityWarnings.push("calculation_version_warning_interpret_metrics_carefully");
  if (compatibilityStatus === "incompatible") compatibilityWarnings.push("calculation_version_mismatch_ranking_restricted");

  return {
    compareId: "step189_mock_trading_history_compare",
    source: "deterministic_mock_history",
    scope: "admin_mock_trading_lab",
    status: compareReady ? "mock_only" : "blocked",
    redacted: true,
    selectedRunIds: selectedRuns.map((run) => run.runId),
    selectedRuns: selectedRuns.map((run) => ({
      runId: run.runId,
      runLabel: run.runLabel,
      strategyName: run.strategyName,
      strategyVersion: run.strategyVersion,
      runStatus: run.runStatus,
      createdAt: run.createdAt,
      completedAt: run.completedAt,
      assetCount: run.assetCount,
      orderCount: run.orderCount,
      fillCount: run.fillCount,
      calculationVersion: run.calculationVersion,
      redacted: true,
    })),
    compareReady,
    maxCompareCount: MAX_COMPARE_COUNT,
    compatibilityStatus,
    compatibilityWarnings,
    eligibilityReasons,
    metricComparisons: compareReady ? buildMetricComparisons(selectedRuns) : [],
    allocationComparisons: compareReady ? buildAllocationComparisons(selectedRuns) : [],
    riskComparisons: compareReady ? buildRiskComparisons(selectedRuns) : [],
    rankings: compareReady ? buildRankings(selectedRuns, compatibilityStatus) : [],
    highlightedDifferences: compareReady ? buildHighlightedDifferences(selectedRuns) : [],
    restoreCandidateEligibility: compareReady ? buildRestoreEligibility(selectedRuns) : [],
    dbReadStatus: "blocked",
    dbWriteStatus: "blocked",
    supabaseMutationStatus: "blocked",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextStep: "mock_strategy_restore_candidate",
  };
}

export function buildAdminTradingLabMockHistoryCompareStatus(input = {}) {
  const compare = input.compare || buildMockHistoryCompare(input);
  return {
    ok: true,
    step: "Step 189: Add mock trading history compare UI",
    status: "admin_only_mock_trading_history_compare_read_only",
    sourceStep: "step189",
    compareModel: TRADING_LAB_MOCK_HISTORY_COMPARE_MODEL,
    compare,
    blockedConfirmation: {
      endpointAdded: false,
      dbReadAttempted: false,
      dbWriteAttempted: false,
      supabaseSelectAttempted: false,
      supabaseInsertAttempted: false,
      supabaseUpdateAttempted: false,
      supabaseDeleteAttempted: false,
      providerCallAttempted: false,
      tokenIssuanceAttempted: false,
      quoteQueryAttempted: false,
      orderSubmissionAttempted: false,
      liveAccountBalanceQueried: false,
      liveTradingRunCreated: false,
      restoreActionCreated: false,
      mypageTradingUiExposed: false,
      homepageTradingUiExposed: false,
      publicTradingUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP189_MOCK_TRADING_HISTORY_COMPARE_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    dbReadAllowed: false,
    dbWriteAllowed: false,
    dbMigrationAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
  };
}
