export const EXTERNAL_SHOCK_UI_VERSION = "external-shock-ui-v2-step5b";
export const SUPPORTED_EXTERNAL_SHOCK_SCENARIO_VERSION = "external-shock-scenario-v1-step114-2h";
export const SUPPORTED_PRODUCTION_EXTERNAL_SHOCK_SCENARIO_VERSION = "external-shock-scenario-v2-step5a";
export const SUPPORTED_EXTERNAL_SHOCK_METHOD = "deterministic_external_shock";

const SUPPORTED_STATUSES = new Set(["idle", "loading", "ready", "insufficient_data", "blocked", "stale", "error"]);
const SUPPORTED_SHOCK_MODES = new Set(["direct_asset", "market_beta"]);
const SUPPORTED_RETURN_BASIS = new Set(["price_return", "total_return"]);
const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const APPROVAL_EVIDENCE_VERSION = "scenario-provider-approval-evidence-v1-step114-2j";
const PUBLIC_STATUS_COPY = Object.freeze({
  idle: {
    title: "분석 준비 중",
    message: "외부충격분석을 준비합니다.",
  },
  loading: {
    title: "월간 데이터 확인 중",
    message: "포트폴리오의 월간 데이터를 불러오고 있습니다.",
  },
  ready: {
    title: "분석 완료",
    message: "외부충격분석 결과를 확인할 수 있습니다.",
  },
  insufficient_data: {
    title: "공통 이력 부족",
    message: "선택 자산의 공통 월간 이력이 60개월 미만이라 분석할 수 없습니다.",
  },
  blocked: {
    title: "필수값 확인 필요",
    message: "필수 분석값을 확인할 수 없어 결과를 계산하지 못했습니다.",
  },
  stale: {
    title: "다시 계산 중",
    message: "포트폴리오가 변경되어 결과를 다시 계산하고 있습니다.",
  },
  error: {
    title: "분석 오류",
    message: "외부충격분석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
});

const PRODUCTION_SCENARIO_COPY = Object.freeze({
  market_drawdown_moderate: {
    label: "주식시장 급락 · 중간",
    assumptionLabel: "시장 충격 -20%",
  },
  market_drawdown_severe: {
    label: "주식시장 급락 · 강함",
    assumptionLabel: "시장 충격 -35%",
  },
});

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeProviderApprovalEvidence(evidence, result, fingerprint) {
  if (!isPlainObject(evidence)) return null;
  const candidate = {
    evidenceVersion: String(evidence.evidenceVersion || "").trim(),
    fixtureOnly: evidence.fixtureOnly,
    productionPublishReady: evidence.productionPublishReady,
    appExportApproved: evidence.appExportApproved,
    sourceKind: String(evidence.sourceKind || "").trim(),
    portfolioFingerprint: String(evidence.portfolioFingerprint || "").trim(),
    inputHash: String(evidence.inputHash || "").trim(),
    outputHash: String(evidence.outputHash || "").trim(),
    sourceHashes: safeArray(evidence.sourceHashes).map((item) => String(item || "").trim()).filter(Boolean).sort(),
    normalizationVersion: String(evidence.normalizationVersion || "").trim(),
    calculationPolicyVersion: String(evidence.calculationPolicyVersion || "").trim(),
    pipelineVersion: String(evidence.pipelineVersion || "").trim(),
    approvalSource: String(evidence.approvalSource || "").trim(),
  };
  if (result?.fixtureContext?.fixtureOnly === true || result?.fixtureContext?.reviewOnly === true) return null;
  const valid = candidate.evidenceVersion === APPROVAL_EVIDENCE_VERSION &&
    candidate.fixtureOnly === false &&
    candidate.productionPublishReady === true &&
    candidate.appExportApproved === true &&
    candidate.sourceKind === "synthetic_non_fixture_contract" &&
    candidate.portfolioFingerprint === fingerprint &&
    candidate.inputHash === result?.inputHash &&
    candidate.outputHash === result?.outputHash &&
    candidate.sourceHashes.length > 0 &&
    candidate.sourceHashes.join("|") === safeArray(result?.sourceHashes).map((hash) => String(hash || "").trim()).filter(Boolean).sort().join("|") &&
    candidate.normalizationVersion === result?.normalizationVersion &&
    candidate.calculationPolicyVersion === result?.calculationPolicyVersion &&
    candidate.pipelineVersion === result?.pipelineVersion &&
    candidate.approvalSource.length > 0;
  return valid ? candidate : null;
}

function normalizeStatus(value) {
  const status = String(value || "idle").trim();
  return SUPPORTED_STATUSES.has(status) ? status : "blocked";
}

function isV1FixtureResult(result) {
  return result?.scenarioVersion === SUPPORTED_EXTERNAL_SHOCK_SCENARIO_VERSION;
}

function isV2ProductionResult(result) {
  return result?.scenarioVersion === SUPPORTED_PRODUCTION_EXTERNAL_SHOCK_SCENARIO_VERSION;
}

export function getExternalShockStatusCopy(status) {
  return PUBLIC_STATUS_COPY[normalizeStatus(status)] || PUBLIC_STATUS_COPY.blocked;
}

export function formatExternalShockBlockReason(reason = "") {
  const value = String(reason || "");
  if (/unsupported_product_policy:proxy_monthly_return/i.test(value)) {
    return "프록시 월수익률이 포함된 자산은 외부충격분석을 제공할 수 없습니다.";
  }
  if (/missing_metric_lineage:monthly_return_proxy_status/i.test(value)) {
    return "월수익률 출처 또는 정책 적격성을 확인할 수 없어 외부충격분석을 제공할 수 없습니다.";
  }
  if (/market_beta_coverage_invalid|assetBetas.*must_be_finite_number|beta.*must_be_finite_number/i.test(value)) {
    return "일부 자산의 Beta를 확인할 수 없습니다.";
  }
  if (/insufficient_data|missing_asset_month|missing_monthly_identity|baselineReturnMatrix:must_be_non_empty_array/i.test(value)) {
    return "선택 자산의 공통 월간 이력이 부족합니다.";
  }
  if (/asset_weight_sum_invalid/i.test(value)) return "자산 목표비중 합계를 100%로 맞춰 주세요.";
  if (/settings\.initialInvestment/i.test(value)) return "시작 평가금액을 0원보다 크게 입력해 주세요.";
  if (/settings\.monthlyContribution/i.test(value)) return "월 납입금 값을 확인해 주세요.";
  if (/settings\.investmentMonths|shock_month_out_of_range/i.test(value)) return "투자기간을 확인해 주세요.";
  if (/settings\.inflationRate/i.test(value)) return "물가상승률을 확인해 주세요.";
  if (/duplicate_asset|portfolio_identity_mismatch/i.test(value)) return "현재 포트폴리오 자산 구성을 다시 확인해 주세요.";
  if (/less_than_or_equal_minus_100/i.test(value)) {
    return "해당 충격에서는 일부 자산의 계산 수익률이 -100% 이하가 되어 분석할 수 없습니다.";
  }
  return PUBLIC_STATUS_COPY.blocked.message;
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
    sourceHistoryMonths: result?.sourceHistoryMonths,
    pathMonths: result?.pathMonths,
    pathReplayApplied: result?.pathReplayApplied,
    sourceDataStartMonth: result?.sourceDataStartMonth,
    sourceDataEndMonth: result?.sourceDataEndMonth,
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

function validateContractHeader(result, issues, { strictAudit = false } = {}) {
  if (!isPlainObject(result)) {
    issues.push("result_not_object");
    return;
  }
  if (!String(result.scenarioId || "").trim()) issues.push("scenarioId_missing");
  if (!String(result.scenarioLabel || "").trim()) issues.push("scenarioLabel_missing");
  if (!isV1FixtureResult(result) && !isV2ProductionResult(result)) issues.push("unsupported_scenarioVersion");
  if (result.method !== SUPPORTED_EXTERNAL_SHOCK_METHOD) issues.push("unsupported_method");
  if (!SUPPORTED_SHOCK_MODES.has(result.shockMode)) issues.push("unsupported_shockMode");
  if (isV2ProductionResult(result) && result.shockMode !== "market_beta") issues.push("production_shockMode_must_be_market_beta");
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
  if (strictAudit) {
    if (safeArray(result.sourceHashes).length === 0) issues.push("sourceHashes_missing");
    for (const field of ["normalizationVersion", "calculationPolicyVersion", "pipelineVersion"]) {
      if (!String(result[field] || "").trim()) issues.push(`${field}_missing`);
    }
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

function validatePathContributionAlignment(paths, series, issues) {
  for (const [pathLabel, path] of paths) {
    for (const [index, point] of safeArray(path).entries()) {
      if (point?.cumulativeContributions !== series?.[index]?.cumulativeContributions) {
        issues.push(`${pathLabel}_contribution_alignment_invalid:${index}`);
      }
    }
  }
}

function validateShockEvents(result, issues, { requireBetaProvenance = false, pathMonthIndexes = [] } = {}) {
  const events = safeArray(result.shockEvents);
  if (events.length === 0) issues.push("shockEvents_missing");
  if (isV2ProductionResult(result) && events.length !== 1) issues.push("production_shockEvent_count_invalid");
  let previous = 0;
  for (const [index, event] of events.entries()) {
    if (!Number.isInteger(event?.monthIndex) || event.monthIndex <= 0) issues.push(`shockEvent_monthIndex_invalid:${index}`);
    if (event.monthIndex <= previous) issues.push(`shockEvent_monthIndex_not_strict_ascending:${index}`);
    if (isV2ProductionResult(result) && !pathMonthIndexes.includes(event.monthIndex)) {
      issues.push(`shockEvent_monthIndex_out_of_path:${index}`);
    }
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
      const expectedFactor = result.scenarioId === "market_drawdown_moderate"
        ? -0.2
        : result.scenarioId === "market_drawdown_severe" ? -0.35 : null;
      if (isV2ProductionResult(result) && expectedFactor === null) issues.push("production_scenarioId_unsupported");
      if (expectedFactor !== null && event.marketFactorShock !== expectedFactor) {
        issues.push(`production_marketFactorShock_mismatch:${index}`);
      }
      const expectedMonth = Math.min(12, pathMonthIndexes.at(-1) || 0);
      if (isV2ProductionResult(result) && event.monthIndex !== expectedMonth) {
        issues.push(`production_shockMonth_mismatch:${index}`);
      }
      const betas = event.assetBetas;
      const provenance = event.betaProvenance;
      if (!isPlainObject(betas) || Object.keys(betas).length === 0) issues.push(`shockEvent_assetBetas_missing:${index}`);
      if (requireBetaProvenance && (!isPlainObject(provenance) || Object.keys(provenance).length === 0)) {
        issues.push(`shockEvent_betaProvenance_missing:${index}`);
      }
      const betaKeys = Object.keys(betas || {}).sort();
      const shockKeys = Object.keys(shocks || {}).sort();
      if (!sameStableValue(betaKeys, shockKeys)) issues.push(`shockEvent_beta_shock_coverage_invalid:${index}`);
      for (const key of Object.keys(betas || {})) {
        if (!isFiniteNumber(betas[key])) issues.push(`shockEvent_beta_invalid:${index}:${key}`);
        if (isFiniteNumber(betas[key]) && isFiniteNumber(event.marketFactorShock) && isFiniteNumber(shocks?.[key]) &&
          Math.abs(betas[key] * event.marketFactorShock - shocks[key]) > 1e-9) {
          issues.push(`shockEvent_market_beta_reconciliation_invalid:${index}:${key}`);
        }
        if (requireBetaProvenance) {
          const row = provenance?.[key];
          for (const field of ["sourceHash", "sourceName", "asOfDate", "betaWindow", "methodVersion"]) {
            if (!String(row?.[field] || "").trim()) issues.push(`shockEvent_betaProvenance_${field}_missing:${index}:${key}`);
          }
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
  for (const field of ["baselineTerminalValue", "stressedTerminalValue", "terminalDeltaValue", "terminalDeltaRate", "baselineMdd", "stressedMdd", "incrementalMdd"]) {
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
    for (const field of ["baselineTerminalValue", "stressedTerminalValue", "deltaValue", "deltaRate"]) {
      if (!isFiniteNumber(impact[field])) issues.push(`assetImpact_${field}_invalid:${index}`);
    }
    if (isFiniteNumber(impact.baselineTerminalValue) && isFiniteNumber(impact.stressedTerminalValue) &&
      isFiniteNumber(impact.deltaValue) &&
      Math.abs(impact.stressedTerminalValue - impact.baselineTerminalValue - impact.deltaValue) > 1e-5) {
      issues.push(`assetImpact_delta_invalid:${index}`);
    }
    if (impact.baselineTerminalValue > 0 && isFiniteNumber(impact.deltaValue) && isFiniteNumber(impact.deltaRate) &&
      Math.abs(impact.deltaValue / impact.baselineTerminalValue - impact.deltaRate) > 1e-9) {
      issues.push(`assetImpact_deltaRate_invalid:${index}`);
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

function validateReadyResult(result, issues, { strictAudit = false } = {}) {
  if (result.dataQuality?.status !== "ready") issues.push("dataQuality_not_ready");
  const baselineIndexes = validatePath(result.baselinePath, "baselinePath", issues);
  const stressedIndexes = validatePath(result.stressedPath, "stressedPath", issues);
  if (baselineIndexes.length !== stressedIndexes.length ||
    baselineIndexes.some((monthIndex, index) => monthIndex !== stressedIndexes[index])) {
    issues.push("baseline_stressed_path_alignment_invalid");
  }
  validateContributionSeries(result.contributionSeries, baselineIndexes, issues);
  validatePathContributionAlignment([
    ["baselinePath", result.baselinePath],
    ["stressedPath", result.stressedPath],
  ], result.contributionSeries, issues);
  validateShockEvents(result, issues, {
    requireBetaProvenance: strictAudit,
    pathMonthIndexes: baselineIndexes,
  });
  validateSummary(result.summary, issues);
  validateTopLevelSummaryAliases(result, issues);
  validateAssetImpact(result, issues);
  if (safeArray(result.rowSourceLineage).length !== baselineIndexes.length - 1) {
    issues.push("rowSourceLineage_alignment_invalid");
  }
  if (isV2ProductionResult(result)) {
    if (!Number.isInteger(result.sourceHistoryMonths) || result.sourceHistoryMonths < 60) {
      issues.push("sourceHistoryMonths_invalid");
    }
    if (result.pathMonths !== baselineIndexes.length - 1) issues.push("pathMonths_invalid");
    if (typeof result.pathReplayApplied !== "boolean") issues.push("pathReplayApplied_invalid");
    if (!MONTH_PATTERN.test(String(result.sourceDataStartMonth || ""))) issues.push("sourceDataStartMonth_invalid");
    if (!MONTH_PATTERN.test(String(result.sourceDataEndMonth || ""))) issues.push("sourceDataEndMonth_invalid");
    if (result.dataStartDate !== result.sourceDataStartMonth) issues.push("dataStartDate_source_mismatch");
    if (result.dataEndDate !== result.sourceDataEndMonth) issues.push("dataEndDate_source_mismatch");
    for (const [index, row] of safeArray(result.rowSourceLineage).entries()) {
      if (row?.monthIndex !== index + 1 || !MONTH_PATTERN.test(String(row?.month || ""))) {
        issues.push(`rowSourceLineage_path_invalid:${index}`);
      }
      if (!MONTH_PATTERN.test(String(row?.sourceMonth || ""))) {
        issues.push(`rowSourceLineage_sourceMonth_invalid:${index}`);
      }
    }
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
  const normalizedStatus = normalizeStatus(status);
  const copy = getExternalShockStatusCopy(normalizedStatus);
  const publicReason = normalizedStatus === "blocked"
    ? formatExternalShockBlockReason(reasons[0])
    : copy.message;

  return {
    uiVersion: EXTERNAL_SHOCK_UI_VERSION,
    status: normalizedStatus,
    selectedPortfolioName,
    fixtureContext,
    title: copy.title,
    message: copy.message,
    userGuidance: publicReason,
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
    label: formatScenarioLabel(result),
    mode: formatShockMode(result.shockMode),
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

function formatShockMode(value) {
  if (value === "market_beta") return "시장 민감도";
  if (value === "direct_asset") return "자산별 충격";
  return "확인 필요";
}

function formatScenarioLabel(result = {}) {
  const productionCopy = PRODUCTION_SCENARIO_COPY[result.scenarioId];
  if (productionCopy) return productionCopy.label;
  const label = String(result.scenarioLabel || "").trim();
  if (label && !/fixture|synthetic|review-only|internal|hash/i.test(label)) return label;
  return result.shockMode === "market_beta" ? "시장 민감도 충격" : "자산별 직접 충격";
}

function formatScenarioAssumption(result = {}) {
  const productionCopy = PRODUCTION_SCENARIO_COPY[result.scenarioId];
  if (productionCopy) return productionCopy.assumptionLabel;
  const factor = result.shockEvents?.[0]?.marketFactorShock;
  return result.shockMode === "market_beta" && isFiniteNumber(factor)
    ? `시장 충격 ${formatPercent(factor)}`
    : formatShockMode(result.shockMode);
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
          label: event.label && !/fixture|synthetic|review-only|internal|hash/i.test(event.label)
            ? event.label
            : formatScenarioLabel(result),
          asset: key,
          mode: formatShockMode("market_beta"),
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
      label: event.label && !/fixture|synthetic|review-only|internal|hash/i.test(event.label)
        ? event.label
        : formatScenarioLabel(result),
      asset: key,
      mode: formatShockMode("direct_asset"),
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
      "sourceHistoryMonths",
      "pathMonths",
      "pathReplayApplied",
      "sourceDataStartMonth",
      "sourceDataEndMonth",
      "normalizationVersion",
      "calculationPolicyVersion",
      "pipelineVersion",
    ]) {
      if (first[field] !== result[field]) issues.push("scenario_baseline_identity_mismatch");
    }
  }
}

function createMethodology(result = {}) {
  const shockEvent = result.shockEvents?.[0] || {};
  return [
    { label: "시나리오", value: formatScenarioLabel(result) },
    { label: "충격 방식", value: formatShockMode(result.shockMode) },
    { label: "시장 충격률", value: isFiniteNumber(shockEvent.marketFactorShock) ? formatPercent(shockEvent.marketFactorShock) : "-" },
    { label: "충격 시점", value: Number.isInteger(shockEvent.monthIndex) ? `${shockEvent.monthIndex}개월` : "-" },
    { label: "기준 경로", value: "과거 월간수익률 기반" },
    { label: "수익률 기준", value: result.returnBasis === "total_return" ? "총수익률" : result.returnBasis === "price_return" ? "가격수익률" : "-" },
    { label: "비중 조정 주기", value: result.rebalanceFrequency === "monthly" ? "월간" : result.rebalanceFrequency || "-" },
    { label: "물가상승률", value: result.inflationRate === null || result.inflationRate === undefined ? "-" : String(result.inflationRate) },
    { label: "통화 기준", value: result.currencyMode || "-" },
    { label: "데이터 시작", value: result.sourceDataStartMonth || result.dataStartDate || "-" },
    { label: "데이터 종료", value: result.sourceDataEndMonth || result.dataEndDate || "-" },
    { label: "원본 공통 이력", value: Number.isInteger(result.sourceHistoryMonths) ? `${result.sourceHistoryMonths}개월` : "-" },
    { label: "계산 경로", value: Number.isInteger(result.pathMonths) ? `${result.pathMonths}개월` : "-" },
    { label: "경로 반복", value: result.pathReplayApplied === true ? "적용" : result.pathReplayApplied === false ? "미적용" : "-" },
    { label: "발생확률", value: "미적용" },
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
  scenarioCandidates = null,
  providerApprovalEvidence = null,
}) {
  const comparisonResults = validatedResults || [result];
  const candidates = scenarioCandidates || comparisonResults;
  const productionResult = isV2ProductionResult(result);
  const approvalEvidence = productionResult
    ? null
    : normalizeProviderApprovalEvidence(providerApprovalEvidence, result, fingerprint);
  const readyCopy = getExternalShockStatusCopy("ready");
  return {
    uiVersion: EXTERNAL_SHOCK_UI_VERSION,
    status: "ready",
    title: readyCopy.title,
    message: readyCopy.message,
    userGuidance: readyCopy.message,
    selectedPortfolioName,
    portfolioFingerprint: fingerprint,
    expectedInputHash: expectedInputHash || result.inputHash,
    expectedOutputHash: expectedOutputHash || result.outputHash,
    resultInputHash: result.inputHash,
    baselineIdentityHash: result.baselineIdentityHash,
    resultOutputHash: result.outputHash,
    fixtureOnly: productionResult ? false : !approvalEvidence,
    productionPublishReady: productionResult || Boolean(approvalEvidence?.productionPublishReady),
    appExportApproved: Boolean(approvalEvidence?.appExportApproved),
    providerApprovalEvidence: approvalEvidence,
    fixtureContext: result.fixtureContext,
    scenarioVersion: result.scenarioVersion,
    method: result.method,
    occurrenceProbabilityEstimated: false,
    scenarioId: result.scenarioId,
    scenarioLabel: result.scenarioLabel,
    shockMode: result.shockMode,
    scenarioOptions: candidates.map((item) => ({
      scenarioId: item.scenarioId,
      label: formatScenarioLabel(item),
      mode: formatShockMode(item.shockMode),
      assumptionLabel: formatScenarioAssumption(item),
      enabled: item.status === "ready",
      disabledReason: item.status === "ready"
        ? null
        : formatExternalShockBlockReason(safeArray(item.dataQuality?.blockReasons)[0]),
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
        label: event.label && !/fixture|synthetic|review-only|internal|hash/i.test(event.label)
          ? event.label
          : formatScenarioLabel(result),
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
  scenarioLoadStatus = null,
  scenarioLoadError = null,
  selectedScenarioId = null,
  activePortfolio,
  assets = [],
  settings = {},
  baselineResult = null,
  expectedInputHash = null,
  expectedOutputHash = null,
  enableFixtureReview = false,
  providerApprovalEvidence = null,
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

  if (candidateResults.length === 0) {
    const status = scenarioLoadStatus === "ready"
      ? "error"
      : normalizeStatus(scenarioLoadStatus || "idle");
    return createStatusViewModel({
      status,
      selectedPortfolioName,
      reasons: [scenarioLoadError || "precomputed_result_missing"],
    });
  }

  const issues = [];
  const validatedResults = [];
  const optionResults = [];
  const seenScenarioIds = new Set();
  for (const candidate of candidateResults) {
    const status = normalizeStatus(candidate.status);
    const v1Fixture = isV1FixtureResult(candidate);
    const v2Production = isV2ProductionResult(candidate);
    const hasFixtureContext = isPlainObject(candidate.fixtureContext);
    const approvalEvidence = v1Fixture
      ? normalizeProviderApprovalEvidence(providerApprovalEvidence, candidate, fingerprint)
      : null;
    if (seenScenarioIds.has(candidate.scenarioId)) issues.push(`duplicate_scenarioId:${candidate.scenarioId}`);
    seenScenarioIds.add(candidate.scenarioId);
    if (status !== "ready") {
      if (v2Production) {
        optionResults.push(candidate);
        continue;
      }
      validateContractHeader(candidate, issues, { strictAudit: true });
      if (!hasFixtureContext || !enableFixtureReview) {
        return createStatusViewModel({
          status: "blocked",
          selectedPortfolioName,
          reasons: ["providerApprovalEvidence_invalid"],
          fixtureContext: candidate.fixtureContext || null,
        });
      }
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
          productionPublishReady: false,
          appExportApproved: false,
          providerApprovalEvidence: null,
          occurrenceProbabilityEstimated: false,
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

    const candidateIssues = [];
    validateContractHeader(candidate, candidateIssues, { strictAudit: v1Fixture });
    if (v1Fixture && hasFixtureContext) {
      if (!enableFixtureReview) {
        return createStatusViewModel({
          status: "idle",
          selectedPortfolioName,
          reasons: ["fixture_review_gate_disabled"],
          fixtureContext: candidate.fixtureContext || null,
        });
      }
      validateFixtureContext({
        result: candidate,
        fixtureContext: candidate.fixtureContext,
        fingerprint,
        expectedInputHash,
        expectedOutputHash,
        issues: candidateIssues,
      });
    } else if (v1Fixture && !approvalEvidence) {
      candidateIssues.push("providerApprovalEvidence_invalid");
    }
    validateReadyResult(candidate, candidateIssues, { strictAudit: v1Fixture });
    if (v2Production && candidateIssues.length > 0) {
      optionResults.push({
        ...candidate,
        status: "blocked",
        dataQuality: { status: "blocked", blockReasons: candidateIssues },
      });
      continue;
    }
    issues.push(...candidateIssues);
    validatedResults.push(candidate);
    optionResults.push(candidate);
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

  if (validatedResults.length === 0) {
    const blockReasons = optionResults.flatMap((candidate) => safeArray(candidate?.dataQuality?.blockReasons));
    const loadStatus = normalizeStatus(scenarioLoadStatus || "blocked");
    const insufficient = blockReasons.some((reason) =>
      /insufficient_data|missing_asset_month|missing_monthly_identity|baselineReturnMatrix:must_be_non_empty_array/i.test(String(reason || ""))
    );
    return createStatusViewModel({
      status: ["idle", "loading", "error", "stale", "insufficient_data"].includes(loadStatus)
        ? loadStatus
        : insufficient ? "insufficient_data" : "blocked",
      selectedPortfolioName,
      reasons: blockReasons.length > 0 ? blockReasons : [scenarioLoadError || "scenario_result_not_ready"],
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
    selectedPortfolioName,
    assets,
    baselineResult,
    fingerprint,
    expectedInputHash,
    expectedOutputHash,
    validatedResults,
    scenarioCandidates: optionResults,
    providerApprovalEvidence: selectedResult.fixtureContext ? null : providerApprovalEvidence,
  });
}

export function isExternalShockViewModelReady(viewModel) {
  return viewModel?.status === "ready" &&
    Array.isArray(viewModel?.chart?.baselinePath) &&
    viewModel.chart.baselinePath.length > 0 &&
    Array.isArray(viewModel?.chart?.stressedPath) &&
    viewModel.chart.stressedPath.length === viewModel.chart.baselinePath.length;
}
