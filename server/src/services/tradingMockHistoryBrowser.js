export const STEP188_MOCK_TRADING_HISTORY_BROWSER_FLAGS = Object.freeze({
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

export const TRADING_LAB_MOCK_HISTORY_BROWSER_MODEL = Object.freeze({
  browserId: "string",
  source: "deterministic_mock_history",
  scope: "admin_mock_trading_lab",
  status: "mock_only",
  redacted: true,
  records: "mock_history_record[]",
  filters: "browser_filter_contract",
  sort: "browser_sort_contract",
  pagination: "client_side_pagination_contract",
  selectedRunIds: "mock_run_id[]",
  compareCandidateLimit: 3,
  dbReadStatus: "blocked",
  dbWriteStatus: "blocked",
  nextStep: "mock_history_compare",
});

export const TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS = Object.freeze([
  {
    runId: "mock-run-2026-07-01-balanced-growth-v3",
    runLabel: "Mock balanced growth July baseline",
    strategyPresetId: "mock-preset-balanced-growth",
    strategyName: "Balanced Growth Mock",
    strategyVersion: "v3",
    runStatus: "completed",
    createdAt: "2026-07-01T09:00:00.000Z",
    completedAt: "2026-07-01T09:12:00.000Z",
    assetCount: 5,
    orderCount: 8,
    fillCount: 8,
    finalMockEquity: 12485000,
    cumulativeReturn: 4.21,
    mdd: -2.35,
    volatility: 8.42,
    sharpe: 1.18,
    riskScore: 32,
    archived: false,
    restoredFromRunId: null,
    warningCount: 1,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "QQQ 35 / SCHD 25 / CASH 10",
    inputSummary: "static mock series, 12 month window",
    outputSummary: "mock rebalance completed",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-02-income-tilt-v2",
    runLabel: "Mock income tilt review",
    strategyPresetId: "mock-preset-income-tilt",
    strategyName: "Income Tilt Mock",
    strategyVersion: "v2",
    runStatus: "completed",
    createdAt: "2026-07-02T10:00:00.000Z",
    completedAt: "2026-07-02T10:10:00.000Z",
    assetCount: 4,
    orderCount: 6,
    fillCount: 6,
    finalMockEquity: 12242000,
    cumulativeReturn: 2.14,
    mdd: -1.78,
    volatility: 6.95,
    sharpe: 0.88,
    riskScore: 27,
    archived: false,
    restoredFromRunId: null,
    warningCount: 0,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "SCHD 45 / QQQ 20 / CASH 12",
    inputSummary: "static mock series, income tilt",
    outputSummary: "mock allocation aligned",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-03-risk-cap-v1",
    runLabel: "Mock risk cap blocked sample",
    strategyPresetId: "mock-preset-risk-cap",
    strategyName: "Risk Cap Mock",
    strategyVersion: "v1",
    runStatus: "blocked",
    createdAt: "2026-07-03T08:30:00.000Z",
    completedAt: null,
    assetCount: 6,
    orderCount: 0,
    fillCount: 0,
    finalMockEquity: 12000000,
    cumulativeReturn: 0,
    mdd: 0,
    volatility: 0,
    sharpe: 0,
    riskScore: 74,
    archived: false,
    restoredFromRunId: null,
    warningCount: 2,
    blockerCount: 1,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "risk cap validation blocked",
    inputSummary: "static mock series, risk guard required",
    outputSummary: "mock-only blocked before compare",
    compareSupported: false,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-04-cash-defense-v4",
    runLabel: "Mock cash defense restored candidate",
    strategyPresetId: "mock-preset-cash-defense",
    strategyName: "Cash Defense Mock",
    strategyVersion: "v4",
    runStatus: "completed",
    createdAt: "2026-07-04T11:00:00.000Z",
    completedAt: "2026-07-04T11:09:00.000Z",
    assetCount: 3,
    orderCount: 4,
    fillCount: 4,
    finalMockEquity: 12112000,
    cumulativeReturn: 0.93,
    mdd: -0.95,
    volatility: 4.12,
    sharpe: 0.51,
    riskScore: 21,
    archived: false,
    restoredFromRunId: "mock-run-2026-07-01-balanced-growth-v3",
    warningCount: 1,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "CASH 35 / SCHD 35 / QQQ 15",
    inputSummary: "restored mock draft candidate",
    outputSummary: "mock restore candidate run",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-05-momentum-v2",
    runLabel: "Mock momentum failed sample",
    strategyPresetId: "mock-preset-momentum",
    strategyName: "Momentum Mock",
    strategyVersion: "v2",
    runStatus: "failed",
    createdAt: "2026-07-05T13:00:00.000Z",
    completedAt: "2026-07-05T13:03:00.000Z",
    assetCount: 5,
    orderCount: 2,
    fillCount: 0,
    finalMockEquity: 11960000,
    cumulativeReturn: -0.34,
    mdd: -3.12,
    volatility: 10.2,
    sharpe: -0.12,
    riskScore: 61,
    archived: false,
    restoredFromRunId: null,
    warningCount: 3,
    blockerCount: 1,
    calculationVersion: "mock_calc_v2",
    allocationSummary: "momentum validation failed",
    inputSummary: "static mock series, momentum test",
    outputSummary: "mock-only failure placeholder",
    compareSupported: false,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-06-balanced-growth-archive",
    runLabel: "Mock balanced growth archived reference",
    strategyPresetId: "mock-preset-balanced-growth",
    strategyName: "Balanced Growth Mock",
    strategyVersion: "v2",
    runStatus: "archived",
    createdAt: "2026-06-28T09:00:00.000Z",
    completedAt: "2026-06-28T09:11:00.000Z",
    assetCount: 5,
    orderCount: 7,
    fillCount: 7,
    finalMockEquity: 12310000,
    cumulativeReturn: 3.11,
    mdd: -2.64,
    volatility: 8.8,
    sharpe: 0.94,
    riskScore: 35,
    archived: true,
    restoredFromRunId: null,
    warningCount: 1,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "archived completed mock run",
    inputSummary: "static mock series, archived",
    outputSummary: "mock archive retained",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-07-low-vol-v1",
    runLabel: "Mock low volatility baseline",
    strategyPresetId: "mock-preset-low-vol",
    strategyName: "Low Volatility Mock",
    strategyVersion: "v1",
    runStatus: "completed",
    createdAt: "2026-07-07T07:45:00.000Z",
    completedAt: "2026-07-07T07:58:00.000Z",
    assetCount: 4,
    orderCount: 5,
    fillCount: 5,
    finalMockEquity: 12298000,
    cumulativeReturn: 2.48,
    mdd: -1.22,
    volatility: 5.2,
    sharpe: 0.97,
    riskScore: 24,
    archived: false,
    restoredFromRunId: null,
    warningCount: 0,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "low volatility mock allocation",
    inputSummary: "static mock series, low volatility",
    outputSummary: "mock run completed",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-08-global-balanced-v1",
    runLabel: "Mock global balanced in review",
    strategyPresetId: "mock-preset-global-balanced",
    strategyName: "Global Balanced Mock",
    strategyVersion: "v1",
    runStatus: "in_review",
    createdAt: "2026-07-08T12:20:00.000Z",
    completedAt: null,
    assetCount: 6,
    orderCount: 3,
    fillCount: 0,
    finalMockEquity: 12085000,
    cumulativeReturn: 0.71,
    mdd: -1.05,
    volatility: 7.1,
    sharpe: 0.2,
    riskScore: 43,
    archived: false,
    restoredFromRunId: null,
    warningCount: 2,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "review placeholder only",
    inputSummary: "static mock series, global mix",
    outputSummary: "mock review pending",
    compareSupported: false,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-09-dividend-defense-v2",
    runLabel: "Mock dividend defense comparison",
    strategyPresetId: "mock-preset-dividend-defense",
    strategyName: "Dividend Defense Mock",
    strategyVersion: "v2",
    runStatus: "completed",
    createdAt: "2026-07-09T09:30:00.000Z",
    completedAt: "2026-07-09T09:39:00.000Z",
    assetCount: 4,
    orderCount: 5,
    fillCount: 5,
    finalMockEquity: 12266000,
    cumulativeReturn: 2.22,
    mdd: -1.41,
    volatility: 5.8,
    sharpe: 0.82,
    riskScore: 26,
    archived: false,
    restoredFromRunId: null,
    warningCount: 1,
    blockerCount: 0,
    calculationVersion: "mock_calc_v3",
    allocationSummary: "dividend defense mock allocation",
    inputSummary: "static mock series, dividend defense",
    outputSummary: "mock comparison ready",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
  {
    runId: "mock-run-2026-07-10-tech-core-v5",
    runLabel: "Mock tech core high return sample",
    strategyPresetId: "mock-preset-tech-core",
    strategyName: "Tech Core Mock",
    strategyVersion: "v5",
    runStatus: "completed",
    createdAt: "2026-07-10T14:00:00.000Z",
    completedAt: "2026-07-10T14:12:00.000Z",
    assetCount: 5,
    orderCount: 9,
    fillCount: 9,
    finalMockEquity: 12672000,
    cumulativeReturn: 5.6,
    mdd: -4.35,
    volatility: 13.4,
    sharpe: 1.04,
    riskScore: 58,
    archived: false,
    restoredFromRunId: null,
    warningCount: 3,
    blockerCount: 0,
    calculationVersion: "mock_calc_v4",
    allocationSummary: "tech core mock allocation",
    inputSummary: "static mock series, tech core",
    outputSummary: "mock high return sample",
    compareSupported: true,
    detailSupported: true,
    redacted: true,
  },
]);

export const TRADING_LAB_MOCK_HISTORY_BROWSER_FILTERS = Object.freeze({
  dateRange: ["all", "last_7_days", "last_30_days", "last_90_days"],
  strategyPreset: ["all"],
  runStatus: ["all", "completed", "blocked", "failed", "archived", "in_review"],
  archivedMode: ["exclude_archived", "include_archived", "archived_only"],
  returnRange: ["all", "negative", "zero_to_three", "above_three"],
  mddRange: ["all", "mdd_under_two", "mdd_two_to_four", "mdd_above_four"],
  riskScoreRange: ["all", "low", "medium", "high"],
});

export const TRADING_LAB_MOCK_HISTORY_BROWSER_SORTS = Object.freeze([
  "completed_desc",
  "completed_asc",
  "return_desc",
  "return_asc",
  "mdd_asc",
  "risk_asc",
  "final_equity_desc",
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REFERENCE_NOW = Date.parse("2026-07-11T00:00:00.000Z");
const SUPPORTED_COMPARE_STATUSES = new Set(["completed", "archived"]);

function recordDateValue(record) {
  return Date.parse(record.completedAt || record.createdAt || "1970-01-01T00:00:00.000Z");
}

function matchesDateRange(record, dateRange) {
  if (!dateRange || dateRange === "all") return true;
  const days = { last_7_days: 7, last_30_days: 30, last_90_days: 90 }[dateRange];
  if (!days) return true;
  return REFERENCE_NOW - recordDateValue(record) <= days * MS_PER_DAY;
}

function matchesReturnRange(record, range) {
  if (!range || range === "all") return true;
  if (range === "negative") return record.cumulativeReturn < 0;
  if (range === "zero_to_three") return record.cumulativeReturn >= 0 && record.cumulativeReturn <= 3;
  if (range === "above_three") return record.cumulativeReturn > 3;
  return true;
}

function matchesMddRange(record, range) {
  const drawdown = Math.abs(Number(record.mdd || 0));
  if (!range || range === "all") return true;
  if (range === "mdd_under_two") return drawdown < 2;
  if (range === "mdd_two_to_four") return drawdown >= 2 && drawdown <= 4;
  if (range === "mdd_above_four") return drawdown > 4;
  return true;
}

function matchesRiskRange(record, range) {
  if (!range || range === "all") return true;
  if (range === "low") return record.riskScore <= 30;
  if (range === "medium") return record.riskScore > 30 && record.riskScore <= 60;
  if (range === "high") return record.riskScore > 60;
  return true;
}

export function filterMockHistoryRecords(records = TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, filters = {}) {
  return records.filter((record) => {
    if (!matchesDateRange(record, filters.dateRange)) return false;
    if (filters.strategyPreset && filters.strategyPreset !== "all" && record.strategyPresetId !== filters.strategyPreset) return false;
    if (filters.runStatus && filters.runStatus !== "all" && record.runStatus !== filters.runStatus) return false;
    if (filters.archivedMode === "exclude_archived" && record.archived) return false;
    if (filters.archivedMode === "archived_only" && !record.archived) return false;
    if (!matchesReturnRange(record, filters.returnRange)) return false;
    if (!matchesMddRange(record, filters.mddRange)) return false;
    if (!matchesRiskRange(record, filters.riskScoreRange)) return false;
    return true;
  });
}

export function sortMockHistoryRecords(records = [], sortKey = "completed_desc") {
  const sorted = [...records];
  const compare = {
    completed_desc: (a, b) => recordDateValue(b) - recordDateValue(a),
    completed_asc: (a, b) => recordDateValue(a) - recordDateValue(b),
    return_desc: (a, b) => b.cumulativeReturn - a.cumulativeReturn,
    return_asc: (a, b) => a.cumulativeReturn - b.cumulativeReturn,
    mdd_asc: (a, b) => Math.abs(a.mdd) - Math.abs(b.mdd),
    risk_asc: (a, b) => a.riskScore - b.riskScore,
    final_equity_desc: (a, b) => b.finalMockEquity - a.finalMockEquity,
  }[sortKey] || ((a, b) => recordDateValue(b) - recordDateValue(a));

  return sorted.sort((a, b) => compare(a, b) || a.runId.localeCompare(b.runId));
}

export function paginateMockHistoryRecords(records = [], pagination = {}) {
  const pageSize = Math.min(Math.max(Number(pagination.pageSize || 5), 1), 20);
  const totalRecords = records.length;
  const pageCount = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(Math.max(Number(pagination.page || 1), 1), pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  return {
    records: records.slice(startIndex, startIndex + pageSize),
    page: currentPage,
    pageSize,
    pageCount,
    totalRecords,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < pageCount,
    dbPaginationUsed: false,
    redacted: true,
  };
}

export function buildMockHistoryCompareCandidateSummary(records = TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, selectedRunIds = []) {
  const selectedRecords = selectedRunIds
    .map((runId) => records.find((record) => record.runId === runId))
    .filter(Boolean)
    .slice(0, 3);
  const unsupported = selectedRecords.filter((record) => !SUPPORTED_COMPARE_STATUSES.has(record.runStatus) || !record.compareSupported);
  const calculationVersions = [...new Set(selectedRecords.map((record) => record.calculationVersion))];
  const excludedReason = [];

  if (selectedRecords.length < 2) excludedReason.push("select_at_least_two_supported_mock_runs");
  if (selectedRecords.length > 3) excludedReason.push("max_three_mock_runs_allowed");
  if (unsupported.length > 0) excludedReason.push("unsupported_status_selected");
  if (calculationVersions.length > 1) excludedReason.push("calculation_version_mismatch_warning");

  return {
    selectedRunIds: selectedRecords.map((record) => record.runId),
    compareReady: selectedRecords.length >= 2 && selectedRecords.length <= 3 && unsupported.length === 0,
    compareCandidateCount: selectedRecords.length,
    maxCompareCount: 3,
    selectedRunSummaries: selectedRecords.map((record) => ({
      runId: record.runId,
      runLabel: record.runLabel,
      runStatus: record.runStatus,
      cumulativeReturn: record.cumulativeReturn,
      mdd: record.mdd,
      riskScore: record.riskScore,
      calculationVersion: record.calculationVersion,
      redacted: true,
    })),
    calculationVersionCompatibility: calculationVersions.length <= 1 ? "compatible" : "warning_mismatch",
    excludedReason,
    compareTableImplementedNow: false,
    redacted: true,
  };
}

export function buildMockHistoryDetailSummary(record) {
  if (!record) {
    return {
      status: "empty",
      readOnly: true,
      dbReadStatus: "blocked",
      redacted: true,
    };
  }
  return {
    runId: record.runId,
    strategyName: record.strategyName,
    strategyVersion: record.strategyVersion,
    runStatus: record.runStatus,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    allocationSummary: record.allocationSummary,
    inputSummary: record.inputSummary,
    outputSummary: record.outputSummary,
    cumulativeReturn: record.cumulativeReturn,
    mdd: record.mdd,
    volatility: record.volatility,
    sharpe: record.sharpe,
    riskScore: record.riskScore,
    warningCount: record.warningCount,
    blockerCount: record.blockerCount,
    restoredFromRunId: record.restoredFromRunId,
    calculationVersion: record.calculationVersion,
    readOnly: true,
    dbReadStatus: "blocked",
    dbWriteStatus: "blocked",
    redacted: true,
  };
}

export function buildMockHistoryBrowser(input = {}) {
  const filters = {
    dateRange: "all",
    strategyPreset: "all",
    runStatus: "all",
    archivedMode: "exclude_archived",
    returnRange: "all",
    mddRange: "all",
    riskScoreRange: "all",
    ...(input.filters || {}),
  };
  const sort = input.sort || "completed_desc";
  const allRecords = input.records || TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS;
  const filtered = filterMockHistoryRecords(allRecords, filters);
  const sorted = sortMockHistoryRecords(filtered, sort);
  const pagination = paginateMockHistoryRecords(sorted, input.pagination || {});
  const selectedRunIds = Array.isArray(input.selectedRunIds) ? input.selectedRunIds.slice(0, 3) : [];

  return {
    browserId: "step188_mock_trading_history_browser",
    source: "deterministic_mock_history",
    scope: "admin_mock_trading_lab",
    status: "mock_only",
    redacted: true,
    records: allRecords,
    visibleRecords: pagination.records,
    filters,
    filterOptions: TRADING_LAB_MOCK_HISTORY_BROWSER_FILTERS,
    sort,
    sortOptions: TRADING_LAB_MOCK_HISTORY_BROWSER_SORTS,
    pagination,
    selectedRunIds,
    compareCandidateLimit: 3,
    compareCandidateSummary: buildMockHistoryCompareCandidateSummary(allRecords, selectedRunIds),
    detailSummary: buildMockHistoryDetailSummary(allRecords.find((record) => record.runId === (input.selectedRunId || selectedRunIds[0]))),
    emptyState: {
      noRecordsMessage: "No deterministic mock history records are available.",
      noFilterResultsMessage: "No mock trading history records match the current filters.",
      loadingMessage: "Deterministic mock history data is local only.",
      errorMessage: "DB connection is blocked for this mock browser.",
      redacted: true,
    },
    dbReadStatus: "blocked",
    dbWriteStatus: "blocked",
    supabaseMutationStatus: "blocked",
    providerCallImpact: "blocked",
    orderSubmissionImpact: "blocked",
    liveTradingImpact: "blocked",
    nextStep: "mock_history_compare",
  };
}

export function buildAdminTradingLabMockHistoryBrowserStatus(input = {}) {
  const browser = input.browser || buildMockHistoryBrowser(input);
  return {
    ok: true,
    step: "Step 188: Add mock trading history browser UI",
    status: "admin_only_mock_trading_history_browser_read_only",
    sourceStep: "step188",
    browserModel: TRADING_LAB_MOCK_HISTORY_BROWSER_MODEL,
    browser,
    recordSummary: {
      recordCount: browser.records.length,
      visibleRecordCount: browser.visibleRecords.length,
      compareSupportedCount: browser.records.filter((record) => record.compareSupported).length,
      statuses: [...new Set(browser.records.map((record) => record.runStatus))],
      redacted: true,
    },
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
      mypageTradingUiExposed: false,
      homepageTradingUiExposed: false,
      publicTradingUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP188_MOCK_TRADING_HISTORY_BROWSER_FLAGS },
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
