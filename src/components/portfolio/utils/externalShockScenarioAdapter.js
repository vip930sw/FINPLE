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
    scenarioId: result?.scenarioId,
    scenarioLabel: result?.scenarioLabel,
    method: result?.method,
    shockMode: result?.shockMode,
    rebalanceFrequency: result?.rebalanceFrequency,
    inflationRate: result?.inflationRate,
    returnBasis: result?.returnBasis,
    currencyMode: result?.currencyMode,
    dataStartDate: result?.dataStartDate,
    dataEndDate: result?.dataEndDate,
    sourceHashes: result?.sourceHashes,
    normalizationVersion: result?.normalizationVersion,
    calculationPolicyVersion: result?.calculationPolicyVersion,
    pipelineVersion: result?.pipelineVersion,
    inputHash: result?.inputHash,
    baselineIdentityHash: result?.baselineIdentityHash,
    outputHash: result?.outputHash,
    betaApplied: result?.betaApplied,
    bootstrapApplied: result?.bootstrapApplied,
    probabilityApplied: result?.probabilityApplied,
    cagrCalibrationApplied: result?.cagrCalibrationApplied,
    historicalMddApplied: result?.historicalMddApplied,
    shockEvents: result?.shockEvents,
    baselinePath: result?.baselinePath,
    stressedPath: result?.stressedPath,
    contributionSeries: result?.contributionSeries,
    summary: result?.summary,
    baselineTerminalValue: result?.baselineTerminalValue,
    stressedTerminalValue: result?.stressedTerminalValue,
    terminalDeltaValue: result?.terminalDeltaValue,
    terminalDeltaRate: result?.terminalDeltaRate,
    baselineMdd: result?.baselineMdd,
    stressedMdd: result?.stressedMdd,
    incrementalMdd: result?.incrementalMdd,
    recoveryMonths: result?.recoveryMonths,
    longestRecoveryMonths: result?.longestRecoveryMonths,
    unrecovered: result?.unrecovered,
    assetImpactSummary: result?.assetImpactSummary,
    rowSourceLineage: result?.rowSourceLineage,
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
  if (!String(result.scenarioId || "").trim()) issues.push("scenarioId_missing");
  if (!String(result.scenarioLabel || "").trim()) issues.push("scenarioLabel_missing");
  if (result.scenarioVersion !== SUPPORTED_EXTERNAL_SHOCK_SCENARIO_VERSION) issues.push("unsupported_scenarioVersion");
  if (result.method !== SUPPORTED_EXTERNAL_SHOCK_METHOD) issues.push("unsupported_method");
  if (!SUPPORTED_SHOCK_MODES.has(result.shockMode)) issues.push("unsupported_shockMode");
  if (!SUPPORTED_RETURN_BASIS.has(result.returnBasis)) issues.push("unsupported_returnBasis");
  if (!result.currencyMode) issues.push("currencyMode_missing");
  if (result.betaApplied !== (result.shockMode === "market_beta")) issues.push("betaApplied_inconsistent");
  if (result.bootstrapApplied !== false) issues.push("bootstrapApplied_must_be_false");
  if (result.probabilityApplied !== false) issues.push("probabilityApplied_must_be_false");
  if (result.cagrCalibrationApplied !== false) issues.push("cagrCalibrationApplied_must_be_false");
  if (result.historicalMddApplied !== false) issues.push("historicalMddApplied_must_be_false");
  validateHash(result.inputHash, "inputHash", issues);
  validateHash(result.baselineIdentityHash, "baselineIdentityHash", issues);
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
    if (result.shockMode === "market_beta") {
      if (!isFiniteNumber(event.marketFactorShock) || event.marketFactorShock <= -1) {
        issues.push(`shockEvent_marketFactorShock_invalid:${index}`);
      }
      const betas = event.assetBetas;
      const provenance = event.betaProvenance;
      if (!isPlainObject(betas) || Object.keys(betas).length === 0) issues.push(`shockEvent_assetBetas_missing:${index}`);
      if (!isPlainObject(provenance) || Object.keys(provenance).length === 0) issues.push(`shockEvent_betaProvenance_missing:${index}`);
      for (const key of Object.keys(betas || {})) {
        if (!isFiniteNumber(betas[key])) issues.push(`shockEvent_beta_invalid:${index}:${key}`);
        const row = provenance?.[key];
        for (const field of ["sourceHash", "sourceName", "asOfDate", "betaWindow", "methodVersion"]) {
          if (!String(row?.[field] || "").trim()) issues.push(`shockEvent_betaProvenance_${field}_missing:${index}:${key}`);
        }
      }
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

function validateTopLevelSummaryAliases(result, issues) {
  const summary = result.summary || {};
  for (const field of [
    "baselineTerminalValue",
    "stressedTerminalValue",
    "terminalDeltaValue",
    "terminalDeltaRate",
    "baselineMdd",
    "stressedMdd",
    "incrementalMdd",
    "longestRecoveryMonths",
  ]) {
    if (result[field] !== summary[field]) issues.push(`topLevel_${field}_summary_mismatch`);
  }
  if ((result.recoveryMonths ?? null) !== (summary.recoveryMonths ?? null)) issues.push("topLevel_recoveryMonths_summary_mismatch");
  if (result.unrecovered !== summary.unrecovered) issues.push("topLevel_unrecovered_summary_mismatch");
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
  const resolvedExpectedInputHash = isPlainObject(expectedInputHash)
    ? expectedInputHash[result.scenarioId]
    : expectedInputHash;
  const resolvedExpectedOutputHash = isPlainObject(expectedOutputHash)
    ? expectedOutputHash[result.scenarioId]
    : expectedOutputHash;
  if (resolvedExpectedInputHash && result.inputHash !== resolvedExpectedInputHash) issues.push("expected_inputHash_mismatch");
  if (resolvedExpectedOutputHash && result.outputHash !== resolvedExpectedOutputHash) issues.push("expected_outputHash_mismatch");
  if (fixtureContext.inputHash !== result.inputHash) issues.push("fixtureContext_inputHash_mismatch");
  if (fixtureContext.baselineIdentityHash !== result.baselineIdentityHash) issues.push("fixtureContext_baselineIdentityHash_mismatch");
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
  validateTopLevelSummaryAliases(result, issues);
  validateAssetImpact(result, issues);
  if (safeArray(result.rowSourceLineage).length !== baselineIndexes.length - 1) {
    issues.push("rowSourceLineage_alignment_invalid");
  }
}

function baselineIdentityMatches({ baselineResult, result, fingerprint }) {
  const identity = baselineResult?.analysisIdentity;
  if (!isPlainObject(identity)) return false;
  return identity.portfolioFingerprint === fingerprint &&
    identity.baselineIdentityHash === result.baselineIdentityHash;
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
    { key: "incremental-mdd", label: "증분 MDD", value: formatPercent(summary.incrementalMdd) },
    { key: "recovery-months", label: "회복 기간", value: formatRecovery(summary.recoveryMonths, summary.unrecovered) },
    { key: "longest-recovery", label: "최장 회복 기간", value: isFiniteNumber(summary.longestRecoveryMonths) ? `${Math.round(summary.longestRecoveryMonths)}개월` : "-" },
    { key: "unrecovered", label: "미회복 여부", value: summary.unrecovered ? "예" : "아니오" },
  ];
}

function formatRecovery(value, unrecovered) {
  if (unrecovered === true) return "미회복";
  if (!isFiniteNumber(value)) return "-";
  return `${Math.round(value)}개월`;
}

function createScenarioComparisonRows(results = []) {
  return safeArray(results).map((result) => ({
    scenarioId: result.scenarioId,
    label: result.scenarioLabel || result.scenarioId,
    mode: result.shockMode,
    terminalDeltaRate: result.summary?.terminalDeltaRate,
    terminalDeltaRateLabel: formatPercent(result.summary?.terminalDeltaRate),
    stressedMdd: result.summary?.stressedMdd,
    stressedMddLabel: formatPercent(result.summary?.stressedMdd),
    incrementalMdd: result.summary?.incrementalMdd,
    incrementalMddLabel: formatPercent(result.summary?.incrementalMdd),
    recoveryMonths: result.summary?.recoveryMonths ?? null,
    recoveryLabel: formatRecovery(result.summary?.recoveryMonths, result.summary?.unrecovered),
    longestRecoveryMonths: result.summary?.longestRecoveryMonths,
    unrecovered: result.summary?.unrecovered === true,
  }));
}

function compactSourceHash(value) {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text.length > 16 ? `${text.slice(0, 8)}...${text.slice(-6)}` : text;
}

function createShockAssumptionRows(result = {}) {
  return safeArray(result.shockEvents).flatMap((event) => {
    const monthLabel = `M${event.monthIndex}`;
    if (result.shockMode === "market_beta") {
      return Object.entries(event.assetBetas || {}).map(([key, beta]) => {
        const provenance = event.betaProvenance?.[key] || {};
        return {
          rowKey: `${event.monthIndex}:${key}:market_beta`,
          month: monthLabel,
          label: event.label || result.scenarioLabel || result.scenarioId,
          asset: key,
          mode: "market_beta",
          directShockLabel: "-",
          marketFactorShockLabel: formatPercent(event.marketFactorShock),
          betaLabel: isFiniteNumber(beta) ? beta.toFixed(3) : "-",
          sourceName: provenance.sourceName || "-",
          asOfDate: provenance.asOfDate || "-",
          betaWindow: provenance.betaWindow || "-",
          methodVersion: provenance.methodVersion || "-",
          sourceHashStatus: provenance.sourceHash ? compactSourceHash(provenance.sourceHash) : "-",
        };
      });
    }
    return Object.entries(event.assetShockReturns || {}).map(([key, shockReturn]) => ({
      rowKey: `${event.monthIndex}:${key}:direct_asset`,
      month: monthLabel,
      label: event.label || result.scenarioLabel || result.scenarioId,
      asset: key,
      mode: "direct_asset",
      directShockLabel: formatPercent(shockReturn),
      marketFactorShockLabel: "-",
      betaLabel: "-",
      sourceName: "-",
      asOfDate: "-",
      betaWindow: "-",
      methodVersion: "-",
      sourceHashStatus: "-",
    }));
  });
}

function sameStableValue(left, right) {
  return stableSerializeExternalShockFixtureValue(left) === stableSerializeExternalShockFixtureValue(right);
}

function validateScenarioComparisonBaselineIdentity(results, issues) {
  if (results.length < 2) return;
  const [first] = results;
  for (const result of results.slice(1)) {
    const firstContext = first.fixtureContext || {};
    const resultContext = result.fixtureContext || {};
    if (firstContext.portfolioFingerprint !== resultContext.portfolioFingerprint) {
      issues.push("scenario_baseline_identity_mismatch");
    }
    if (first.baselineIdentityHash !== result.baselineIdentityHash) {
      issues.push("scenario_baseline_identity_mismatch");
    }
    if (!sameStableValue(first.baselinePath, result.baselinePath)) {
      issues.push("scenario_baseline_identity_mismatch");
    }
    if (!sameStableValue(first.contributionSeries, result.contributionSeries)) {
      issues.push("scenario_baseline_identity_mismatch");
    }
    if (first.summary?.baselineTerminalValue !== result.summary?.baselineTerminalValue ||
      first.baselineTerminalValue !== result.baselineTerminalValue) {
      issues.push("scenario_baseline_identity_mismatch");
    }
    if (first.summary?.baselineMdd !== result.summary?.baselineMdd ||
      first.baselineMdd !== result.baselineMdd) {
      issues.push("scenario_baseline_identity_mismatch");
    }
    for (const field of [
      "returnBasis",
      "currencyMode",
      "dataStartDate",
      "dataEndDate",
      "normalizationVersion",
      "calculationPolicyVersion",
      "pipelineVersion",
    ]) {
      if (first[field] !== result[field]) issues.push("scenario_baseline_identity_mismatch");
    }
  }
}

function createMethodology(result = {}) {
  const betaProvenanceCount = safeArray(result.shockEvents)
    .flatMap((event) => Object.values(event.betaProvenance || {}))
    .filter(Boolean).length;
  return [
    { label: "scenarioId", value: result.scenarioId || "-" },
    { label: "scenarioLabel", value: result.scenarioLabel || "-" },
    { label: "baselineIdentityHash", value: result.baselineIdentityHash ? "available" : "-" },
    { label: "shockMode", value: result.shockMode || "-" },
    { label: "returnBasis", value: result.returnBasis || "-" },
    { label: "rebalanceFrequency", value: result.rebalanceFrequency || "-" },
    { label: "inflationRate", value: result.inflationRate === null || result.inflationRate === undefined ? "-" : String(result.inflationRate) },
    { label: "currencyMode", value: result.currencyMode || "-" },
    { label: "dataStartDate", value: result.dataStartDate || "-" },
    { label: "dataEndDate", value: result.dataEndDate || "-" },
    { label: "betaProvenanceCount", value: String(betaProvenanceCount) },
    { label: "scenarioVersion", value: result.scenarioVersion || "-" },
  ];
}

function createReadyViewModel({
  result,
  selectedPortfolioName,
  assets,
  baselineResult,
  fingerprint,
  expectedInputHash,
  expectedOutputHash,
  validatedResults = null,
}) {
  const comparisonResults = validatedResults || [result];
  return {
    uiVersion: EXTERNAL_SHOCK_UI_VERSION,
    status: "ready",
    selectedPortfolioName,
    portfolioFingerprint: fingerprint,
    expectedInputHash: expectedInputHash || result.inputHash,
    expectedOutputHash: expectedOutputHash || result.outputHash,
    resultInputHash: result.inputHash,
    baselineIdentityHash: result.baselineIdentityHash,
    resultOutputHash: result.outputHash,
    fixtureOnly: true,
    fixtureContext: result.fixtureContext,
    scenarioVersion: result.scenarioVersion,
    method: result.method,
    scenarioId: result.scenarioId,
    scenarioLabel: result.scenarioLabel,
    shockMode: result.shockMode,
    scenarioOptions: comparisonResults.map((item) => ({
      scenarioId: item.scenarioId,
      label: item.scenarioLabel || item.scenarioId,
      mode: item.shockMode,
      selected: item.scenarioId === result.scenarioId,
    })),
    scenarioComparisonRows: createScenarioComparisonRows(comparisonResults),
    shockAssumptionRows: createShockAssumptionRows(result),
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
        marketFactorShock: event.marketFactorShock ?? null,
        assetShockReturns: event.assetShockReturns || {},
        assetBetas: event.assetBetas || null,
        betaProvenance: event.betaProvenance || null,
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
      baselineIdentityHash: result.baselineIdentityHash,
      betaApplied: result.betaApplied,
      cagrCalibrationApplied: result.cagrCalibrationApplied,
      historicalMddApplied: result.historicalMddApplied,
    },
  };
}

export function buildExternalShockScenarioViewModel({
  result,
  scenarioResults = null,
  selectedScenarioId = null,
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
  const candidateResults = Array.isArray(scenarioResults) && scenarioResults.length > 0
    ? scenarioResults
    : (result ? [result] : []);

  if (!enableFixtureReview || candidateResults.length === 0) {
    return createStatusViewModel({
      status: "idle",
      selectedPortfolioName,
      reasons: enableFixtureReview ? ["precomputed_result_missing"] : ["fixture_review_gate_disabled"],
    });
  }

  const issues = [];
  const validatedResults = [];
  const seenScenarioIds = new Set();
  for (const candidate of candidateResults) {
    const status = normalizeStatus(candidate.status);
    validateContractHeader(candidate, issues);
    if (seenScenarioIds.has(candidate.scenarioId)) issues.push(`duplicate_scenarioId:${candidate.scenarioId}`);
    seenScenarioIds.add(candidate.scenarioId);
    if (status !== "ready") {
      if (candidateResults.length === 1) {
        return {
          ...createStatusViewModel({
            status,
            selectedPortfolioName,
            reasons: safeArray(candidate?.dataQuality?.blockReasons),
            fixtureContext: candidate.fixtureContext || null,
          }),
          scenarioVersion: candidate.scenarioVersion,
          methodology: createMethodology(candidate),
          fixtureOnly: true,
          resultInputHash: candidate.inputHash,
          baselineIdentityHash: candidate.baselineIdentityHash,
          resultOutputHash: candidate.outputHash,
          audit: {
            sourceHashCount: safeArray(candidate.sourceHashes).length,
            outputHash: candidate.outputHash,
          },
        };
      }
      issues.push(`scenario_not_ready:${candidate.scenarioId || "unknown"}`);
      continue;
    }
    validateFixtureContext({
      result: candidate,
      fixtureContext: candidate.fixtureContext,
      fingerprint,
      expectedInputHash,
      expectedOutputHash,
      issues,
    });
    validateReadyResult(candidate, issues);
    validatedResults.push(candidate);
  }

  if (issues.includes("portfolioFingerprint_mismatch") ||
    issues.includes("expected_inputHash_mismatch") ||
    issues.includes("expected_outputHash_mismatch")) {
    const previousResult = candidateResults[0];
    return {
      ...createStatusViewModel({
        status: "stale",
        selectedPortfolioName,
        reasons: issues,
        fixtureContext: previousResult.fixtureContext || null,
      }),
      previousResult,
      portfolioFingerprint: fingerprint,
      expectedInputHash,
      expectedOutputHash,
      resultInputHash: previousResult.inputHash,
      resultOutputHash: previousResult.outputHash,
    };
  }

  if (issues.length > 0) {
    return createStatusViewModel({
      status: "blocked",
      selectedPortfolioName,
      reasons: issues,
      fixtureContext: candidateResults[0]?.fixtureContext || null,
    });
  }

  validateScenarioComparisonBaselineIdentity(validatedResults, issues);

  if (issues.includes("scenario_baseline_identity_mismatch")) {
    return createStatusViewModel({
      status: "blocked",
      selectedPortfolioName,
      reasons: Array.from(new Set(issues)),
      fixtureContext: candidateResults[0]?.fixtureContext || null,
    });
  }

  const selectedResult = validatedResults.find((candidate) => candidate.scenarioId === selectedScenarioId) || validatedResults[0];

  return createReadyViewModel({
    result: selectedResult,
    selectedPortfolioName: selectedResult.fixtureContext?.portfolioName || selectedPortfolioName,
    assets,
    baselineResult,
    fingerprint,
    expectedInputHash,
    expectedOutputHash,
    validatedResults,
  });
}

export function isExternalShockViewModelReady(viewModel) {
  return viewModel?.status === "ready" &&
    Array.isArray(viewModel?.chart?.baselinePath) &&
    viewModel.chart.baselinePath.length > 0 &&
    Array.isArray(viewModel?.chart?.stressedPath) &&
    viewModel.chart.stressedPath.length === viewModel.chart.baselinePath.length;
}
