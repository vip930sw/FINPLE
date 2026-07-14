export const EXTERNAL_SHOCK_UI_VERSION = "external-shock-ui-shell-v1-step114-2h";
export const SUPPORTED_EXTERNAL_SHOCK_SCENARIO_VERSION = "external-shock-scenario-v1-step114-2h";
export const SUPPORTED_EXTERNAL_SHOCK_METHOD = "deterministic_external_shock";

const SUPPORTED_STATUSES = new Set(["idle", "ready", "insufficient_data", "blocked", "stale", "error"]);
const SUPPORTED_SHOCK_MODES = new Set(["direct_asset", "market_beta"]);
const SUPPORTED_RETURN_BASIS = new Set(["price_return", "total_return"]);
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeStatus(value) {
  const status = String(value || "idle").trim();
  return SUPPORTED_STATUSES.has(status) ? status : "blocked";
}

function normalizeTicker(asset = {}) {
  return String(asset.ticker || "").trim().toUpperCase();
}

function normalizeMarket(asset = {}) {
  return String(asset.market || "").trim().toUpperCase();
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  );
}

export function stableSerializeExternalShockFixtureValue(value) {
  return JSON.stringify(stableValue(value));
}

export function checksumExternalShockFixturePayload(value) {
  const text = stableSerializeExternalShockFixtureValue(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getExternalShockPortfolioFingerprint({ portfolioId, settings, assets }) {
  return stableSerializeExternalShockFixtureValue({
    portfolioId: String(portfolioId || ""),
    settings: {
      startValue: settings?.startValue ?? null,
      initialInvestment: settings?.initialInvestment ?? null,
      monthlyCashFlow: settings?.monthlyCashFlow ?? null,
      monthlyContribution: settings?.monthlyContribution ?? null,
      years: settings?.years ?? null,
      investmentMonths: settings?.investmentMonths ?? null,
      inflationRate: settings?.inflationRate ?? null,
      dividendReinvest: Boolean(settings?.dividendReinvest),
    },
    assets: safeArray(assets)
      .map((asset) => ({
        market: normalizeMarket(asset),
        ticker: normalizeTicker(asset),
        targetWeight: asset?.targetWeight ?? asset?.weight ?? null,
        targetEvaluationAmount: asset?.targetEvaluationAmount ?? null,
      }))
      .sort((left, right) => `${left.market}:${left.ticker}`.localeCompare(`${right.market}:${right.ticker}`)),
  });
}

export function createExternalShockFixturePayloadForIntegrity(result) {
  return {
    scenarioVersion: result?.scenarioVersion,
    engineVersion: result?.engineVersion,
    method: result?.method,
    shockMode: result?.shockMode,
    rebalanceFrequency: result?.rebalanceFrequency,
    returnBasis: result?.returnBasis,
    currencyMode: result?.currencyMode,
    dataStartDate: result?.dataStartDate,
    dataEndDate: result?.dataEndDate,
    sourceHashes: result?.sourceHashes,
    normalizationVersion: result?.normalizationVersion,
    calculationPolicyVersion: result?.calculationPolicyVersion,
    pipelineVersion: result?.pipelineVersion,
    inputHash: result?.inputHash,
    outputHash: result?.outputHash,
    shockEvents: result?.shockEvents,
    baselinePath: result?.baselinePath,
    stressedPath: result?.stressedPath,
    contributionSeries: result?.contributionSeries,
    summary: result?.summary,
    assetImpactSummary: result?.assetImpactSummary,
  };
}

function formatWon(value) {
  if (!isFiniteNumber(value)) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPercent(value, digits = 1) {
  if (!isFiniteNumber(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

function validateHash(value, label, issues) {
  if (!HASH_PATTERN.test(String(value || ""))) {
    issues.push(`${label}_malformed`);
    return false;
  }
  return true;
}

function validateContractHeader(result, issues) {
  if (!isPlainObject(result)) {
    issues.push("result_not_object");
    return;
  }
  if (result.scenarioVersion !== SUPPORTED_EXTERNAL_SHOCK_SCENARIO_VERSION) issues.push("unsupported_scenarioVersion");
  if (result.method !== SUPPORTED_EXTERNAL_SHOCK_METHOD) issues.push("unsupported_method");
  if (!SUPPORTED_SHOCK_MODES.has(result.shockMode)) issues.push("unsupported_shockMode");
  if (!SUPPORTED_RETURN_BASIS.has(result.returnBasis)) issues.push("unsupported_returnBasis");
  if (!result.currencyMode) issues.push("currencyMode_missing");
  if (result.betaApplied !== (result.shockMode === "market_beta")) issues.push("betaApplied_inconsistent");
  if (result.cagrCalibrationApplied !== false) issues.push("cagrCalibrationApplied_must_be_false");
  if (result.historicalMddApplied !== false) issues.push("historicalMddApplied_must_be_false");
  validateHash(result.inputHash, "inputHash", issues);
  validateHash(result.outputHash, "outputHash", issues);
  if (safeArray(result.sourceHashes).length === 0) issues.push("sourceHashes_missing");
  for (const field of ["normalizationVersion", "calculationPolicyVersion", "pipelineVersion"]) {
    if (!String(result[field] || "").trim()) issues.push(`${field}_missing`);
  }
}

function validatePath(path, label, issues) {
  const points = safeArray(path);
  if (points.length < 2) {
    issues.push(`${label}_missing`);
    return [];
  }
  const monthIndexes = [];
  let previousMonthIndex = -1;
  for (const [index, point] of points.entries()) {
    if (!Number.isInteger(point?.monthIndex)) {
      issues.push(`${label}_monthIndex_not_integer:${index}`);
      return monthIndexes;
    }
    if (point.monthIndex <= previousMonthIndex) {
      issues.push(`${label}_monthIndex_not_strict_ascending:${index}`);
      return monthIndexes;
    }
    previousMonthIndex = point.monthIndex;
    monthIndexes.push(point.monthIndex);
    for (const field of ["portfolioValue", "riskNav", "cumulativeContributions"]) {
      if (!isFiniteNumber(point[field])) issues.push(`${label}_${field}_invalid:${index}`);
    }
  }
  if (monthIndexes[0] !== 0) issues.push(`${label}_must_start_at_zero`);
  return monthIndexes;
}

function validateContributionSeries(series, expectedMonthIndexes, issues) {
  const points = safeArray(series);
  if (points.length !== expectedMonthIndexes.length) {
    issues.push("contributionSeries_alignment_invalid");
    return;
  }
  let previous = -Infinity;
  for (const [index, point] of points.entries()) {
    if (point?.monthIndex !== expectedMonthIndexes[index]) {
      issues.push("contributionSeries_alignment_invalid");
      return;
    }
    if (!isFiniteNumber(point.cumulativeContributions)) {
      issues.push(`contributionSeries_value_invalid:${index}`);
      return;
    }
    if (point.cumulativeContributions < previous) {
      issues.push(`contributionSeries_not_nondecreasing:${index}`);
      return;
    }
    previous = point.cumulativeContributions;
  }
}

function validateShockEvents(result, issues) {
  const events = safeArray(result.shockEvents);
  if (events.length === 0) issues.push("shockEvents_missing");
  let previous = 0;
  for (const [index, event] of events.entries()) {
    if (!Number.isInteger(event?.monthIndex) || event.monthIndex <= 0) issues.push(`shockEvent_monthIndex_invalid:${index}`);
    if (event.monthIndex <= previous) issues.push(`shockEvent_monthIndex_not_strict_ascending:${index}`);
    previous = event.monthIndex;
    if (event.shockMode !== result.shockMode) issues.push(`shockEvent_mode_mismatch:${index}`);
    const shocks = event.assetShockReturns;
    if (!isPlainObject(shocks) || Object.keys(shocks).length === 0) issues.push(`shockEvent_assetShockReturns_missing:${index}`);
    for (const value of Object.values(shocks || {})) {
      if (!isFiniteNumber(value) || value <= -1) issues.push(`shockEvent_assetShockReturn_invalid:${index}`);
    }
  }
}

function validateSummary(summary, issues) {
  if (!isPlainObject(summary)) {
    issues.push("summary_missing");
    return;
  }
  for (const field of ["baselineTerminalValue", "stressedTerminalValue", "terminalDeltaValue", "baselineMdd", "stressedMdd", "incrementalMdd"]) {
    if (!isFiniteNumber(summary[field])) issues.push(`summary_${field}_invalid`);
  }
  for (const field of ["baselineMdd", "stressedMdd"]) {
    if (isFiniteNumber(summary[field]) && (summary[field] < -1 || summary[field] > 0)) {
      issues.push(`summary_${field}_out_of_range`);
    }
  }
  if (summary.recoveryMonths !== null && summary.recoveryMonths !== undefined &&
    (!isFiniteNumber(summary.recoveryMonths) || summary.recoveryMonths < 0)) {
    issues.push("summary_recoveryMonths_invalid");
  }
  if (!isFiniteNumber(summary.longestRecoveryMonths) || summary.longestRecoveryMonths < 0) {
    issues.push("summary_longestRecoveryMonths_invalid");
  }
  if (typeof summary.unrecovered !== "boolean") issues.push("summary_unrecovered_invalid");
}

function validateAssetImpact(result, issues) {
  const impacts = safeArray(result.assetImpactSummary);
  if (impacts.length === 0) {
    issues.push("assetImpactSummary_missing");
    return;
  }
  let deltaSum = 0;
  for (const [index, impact] of impacts.entries()) {
    if (!normalizeMarket(impact) || !normalizeTicker(impact)) issues.push(`assetImpact_identity_missing:${index}`);
    for (const field of ["baselineTerminalValue", "stressedTerminalValue", "deltaValue"]) {
      if (!isFiniteNumber(impact[field])) issues.push(`assetImpact_${field}_invalid:${index}`);
    }
    deltaSum += isFiniteNumber(impact.deltaValue) ? impact.deltaValue : 0;
  }
  const expectedDelta = result.summary?.terminalDeltaValue;
  if (isFiniteNumber(expectedDelta) && Math.abs(deltaSum - expectedDelta) > 1e-5) {
    issues.push("assetImpact_delta_reconciliation_invalid");
  }
}

function validateFixtureContext({ result, fixtureContext, fingerprint, expectedInputHash, expectedOutputHash, issues }) {
  if (!isPlainObject(fixtureContext)) {
    issues.push("fixtureContext_missing");
    return;
  }
  if (fixtureContext.fixtureOnly !== true || fixtureContext.reviewOnly !== true) issues.push("fixtureContext_not_review_only");
  if (fixtureContext.portfolioFingerprint !== fingerprint) issues.push("portfolioFingerprint_mismatch");
  if (expectedInputHash && result.inputHash !== expectedInputHash) issues.push("expected_inputHash_mismatch");
  if (expectedOutputHash && result.outputHash !== expectedOutputHash) issues.push("expected_outputHash_mismatch");
  if (fixtureContext.inputHash !== result.inputHash) issues.push("fixtureContext_inputHash_mismatch");
  if (fixtureContext.outputHash !== result.outputHash) issues.push("fixtureContext_outputHash_mismatch");
  const expectedSignature = checksumExternalShockFixturePayload(createExternalShockFixturePayloadForIntegrity(result));
  if (fixtureContext.payloadSignature !== expectedSignature) issues.push("fixture_payload_signature_mismatch");
}

function validateReadyResult(result, issues) {
  if (result.dataQuality?.status !== "ready") issues.push("dataQuality_not_ready");
  const baselineIndexes = validatePath(result.baselinePath, "baselinePath", issues);
  const stressedIndexes = validatePath(result.stressedPath, "stressedPath", issues);
  if (baselineIndexes.length !== stressedIndexes.length ||
    baselineIndexes.some((monthIndex, index) => monthIndex !== stressedIndexes[index])) {
    issues.push("baseline_stressed_path_alignment_invalid");
  }
  validateContributionSeries(result.contributionSeries, baselineIndexes, issues);
  validateShockEvents(result, issues);
  validateSummary(result.summary, issues);
  validateAssetImpact(result, issues);
}

function baselineIdentityMatches({ baselineResult, result, fingerprint }) {
  const identity = baselineResult?.analysisIdentity;
  if (!isPlainObject(identity)) return false;
  return identity.portfolioFingerprint === fingerprint &&
    identity.inputHash === result.inputHash &&
    identity.outputHash === result.outputHash;
}

function normalizeBaselineReference({ baselineResult, result, fingerprint }) {
  if (!baselineIdentityMatches({ baselineResult, result, fingerprint })) return [];
  return safeArray(baselineResult?.monthlyBaselinePoints)
    .filter((point) => Number.isInteger(point?.monthIndex) && isFiniteNumber(point?.portfolioValueNominal))
    .map((point) => ({
      monthIndex: point.monthIndex,
      value: point.portfolioValueNominal,
      label: point.periodLabel || `${point.monthIndex}개월`,
    }));
}

function createStatusViewModel({ status, reasons = [], selectedPortfolioName, fixtureContext = null }) {
  const copy = {
    idle: {
      title: "외부충격분석 대기",
      message: "검증된 review-only 충격 분석 fixture가 연결된 경우에만 결과를 표시합니다.",
    },
    insufficient_data: {
      title: "데이터 기간 부족",
      message: "충격 분석 경로를 만들 수 있는 월별 기준 수익률이 부족합니다.",
    },
    blocked: {
      title: "외부충격분석 사용 불가",
      message: "검증 조건을 통과하지 못해 충격 분석 숫자를 표시하지 않습니다.",
    },
    stale: {
      title: "이전 외부충격분석 결과",
      message: "현재 포트폴리오 또는 설정과 fixture identity가 일치하지 않습니다.",
    },
    error: {
      title: "외부충격분석 오류",
      message: "결과를 안전하게 표시할 수 없습니다.",
    },
  }[status] || {
    title: "외부충격분석 사용 불가",
    message: "검증 조건을 통과하지 못해 충격 분석 숫자를 표시하지 않습니다.",
  };

  return {
    uiVersion: EXTERNAL_SHOCK_UI_VERSION,
    status,
    selectedPortfolioName,
    fixtureContext,
    title: copy.title,
    message: copy.message,
    userGuidance: copy.message,
    auditReasons: reasons,
  };
}

function createSummaryCards(result) {
  const summary = result.summary || {};
  return [
    { key: "baseline-terminal", label: "기준 최종 평가금액", value: formatWon(summary.baselineTerminalValue) },
    { key: "stressed-terminal", label: "충격 후 최종 평가금액", value: formatWon(summary.stressedTerminalValue) },
    { key: "terminal-delta", label: "충격 영향 금액", value: formatWon(summary.terminalDeltaValue) },
    { key: "terminal-delta-rate", label: "충격 영향률", value: formatPercent(summary.terminalDeltaRate) },
    { key: "baseline-mdd", label: "기준 risk NAV MDD", value: formatPercent(summary.baselineMdd) },
    { key: "stressed-mdd", label: "충격 risk NAV MDD", value: formatPercent(summary.stressedMdd) },
  ];
}

function createMethodology(result = {}) {
  return [
    { label: "shockMode", value: result.shockMode || "-" },
    { label: "returnBasis", value: result.returnBasis || "-" },
    { label: "rebalanceFrequency", value: result.rebalanceFrequency || "-" },
    { label: "currencyMode", value: result.currencyMode || "-" },
    { label: "dataStartDate", value: result.dataStartDate || "-" },
    { label: "dataEndDate", value: result.dataEndDate || "-" },
    { label: "scenarioVersion", value: result.scenarioVersion || "-" },
  ];
}

function createReadyViewModel({ result, selectedPortfolioName, assets, baselineResult, fingerprint, expectedInputHash, expectedOutputHash }) {
  return {
    uiVersion: EXTERNAL_SHOCK_UI_VERSION,
    status: "ready",
    selectedPortfolioName,
    portfolioFingerprint: fingerprint,
    expectedInputHash: expectedInputHash || result.inputHash,
    expectedOutputHash: expectedOutputHash || result.outputHash,
    resultInputHash: result.inputHash,
    resultOutputHash: result.outputHash,
    fixtureOnly: true,
    fixtureContext: result.fixtureContext,
    scenarioVersion: result.scenarioVersion,
    method: result.method,
    shockMode: result.shockMode,
    chart: {
      ariaLabel: "외부충격분석 기준 경로와 충격 경로 차트",
      baselinePath: result.baselinePath,
      stressedPath: result.stressedPath,
      contributionSeries: result.contributionSeries,
      baselineReference: normalizeBaselineReference({ baselineResult, result, fingerprint }),
      shockMarkers: result.shockEvents.map((event) => ({
        monthIndex: event.monthIndex,
        label: event.label || "shock",
        shockMode: event.shockMode,
      })),
    },
    summaryCards: createSummaryCards(result),
    methodology: createMethodology(result),
    dataQuality: result.dataQuality || {},
    assetImpactSummary: result.assetImpactSummary || [],
    displayAssets: safeArray(result.assets).length > 0
      ? result.assets.map((asset) => `${normalizeMarket(asset) || "-"}:${normalizeTicker(asset)}`)
      : safeArray(assets).filter((asset) => normalizeTicker(asset)).map((asset) => `${normalizeMarket(asset) || "-"}:${normalizeTicker(asset)}`),
    audit: {
      sourceHashCount: safeArray(result.sourceHashes).length,
      outputHash: result.outputHash,
      betaApplied: result.betaApplied,
      cagrCalibrationApplied: result.cagrCalibrationApplied,
      historicalMddApplied: result.historicalMddApplied,
    },
  };
}

export function buildExternalShockScenarioViewModel({
  result,
  activePortfolio,
  assets = [],
  settings = {},
  baselineResult = null,
  expectedInputHash = null,
  expectedOutputHash = null,
  enableFixtureReview = false,
} = {}) {
  const selectedPortfolioName = activePortfolio?.name || "선택 포트폴리오";
  const fingerprint = getExternalShockPortfolioFingerprint({
    portfolioId: activePortfolio?.id,
    settings,
    assets,
  });

  if (!enableFixtureReview || !result) {
    return createStatusViewModel({
      status: "idle",
      selectedPortfolioName,
      reasons: enableFixtureReview ? ["precomputed_result_missing"] : ["fixture_review_gate_disabled"],
    });
  }

  const status = normalizeStatus(result.status);
  const issues = [];
  validateContractHeader(result, issues);

  if (status === "ready") {
    validateFixtureContext({
      result,
      fixtureContext: result.fixtureContext,
      fingerprint,
      expectedInputHash,
      expectedOutputHash,
      issues,
    });
    validateReadyResult(result, issues);
  }

  if (issues.includes("portfolioFingerprint_mismatch") ||
    issues.includes("expected_inputHash_mismatch") ||
    issues.includes("expected_outputHash_mismatch")) {
    return {
      ...createStatusViewModel({
        status: "stale",
        selectedPortfolioName,
        reasons: issues,
        fixtureContext: result.fixtureContext || null,
      }),
      previousResult: result,
      portfolioFingerprint: fingerprint,
      expectedInputHash,
      expectedOutputHash,
      resultInputHash: result.inputHash,
      resultOutputHash: result.outputHash,
    };
  }

  if (status === "ready" && issues.length > 0) {
    return createStatusViewModel({
      status: "blocked",
      selectedPortfolioName,
      reasons: issues,
      fixtureContext: result.fixtureContext || null,
    });
  }

  if (issues.length > 0) {
    return createStatusViewModel({
      status: "blocked",
      selectedPortfolioName,
      reasons: issues,
      fixtureContext: result.fixtureContext || null,
    });
  }

  if (status !== "ready") {
    return {
      ...createStatusViewModel({
        status,
        selectedPortfolioName,
        reasons: safeArray(result?.dataQuality?.blockReasons),
        fixtureContext: result.fixtureContext || null,
      }),
      scenarioVersion: result.scenarioVersion,
      methodology: createMethodology(result),
      fixtureOnly: true,
      resultInputHash: result.inputHash,
      resultOutputHash: result.outputHash,
      audit: {
        sourceHashCount: safeArray(result.sourceHashes).length,
        outputHash: result.outputHash,
      },
    };
  }

  return createReadyViewModel({
    result,
    selectedPortfolioName: result.fixtureContext?.portfolioName || selectedPortfolioName,
    assets,
    baselineResult,
    fingerprint,
    expectedInputHash,
    expectedOutputHash,
  });
}

export function isExternalShockViewModelReady(viewModel) {
  return viewModel?.status === "ready" &&
    Array.isArray(viewModel?.chart?.baselinePath) &&
    viewModel.chart.baselinePath.length > 0 &&
    Array.isArray(viewModel?.chart?.stressedPath) &&
    viewModel.chart.stressedPath.length === viewModel.chart.baselinePath.length;
}
