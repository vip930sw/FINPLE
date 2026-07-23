export const PROBABILITY_UI_VERSION = "probability-ui-shell-v1-step114-2g";
export const SUPPORTED_SCENARIO_VERSION = "probabilistic-scenario-v1-step114-2f";
export const SUPPORTED_METHOD = "joint_block_bootstrap";

const SUPPORTED_STATUSES = new Set([
  "idle",
  "ready",
  "insufficient_data",
  "blocked",
  "stale",
  "error",
]);
const REQUIRED_READY_FLAGS = [
  "betaApplied",
  "cagrCalibrationApplied",
  "historicalMddApplied",
];
const HASH_PATTERN = /^[a-f0-9]{64}$/i;
const FIXED_PERCENTILES = [0.1, 0.25, 0.5, 0.75, 0.9];
const PERCENTILE_KEYS = ["p10", "p25", "p50", "p75", "p90"];
const BAND_KEY_SETS = {
  nominal: ["p10Nominal", "p25Nominal", "p50Nominal", "p75Nominal", "p90Nominal"],
  real: ["p10Real", "p25Real", "p50Real", "p75Real", "p90Real"],
};
const APPROVAL_EVIDENCE_VERSION = "scenario-provider-approval-evidence-v1-step114-2j";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
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

export function stableSerializeProbabilityValue(value) {
  return JSON.stringify(stableValue(value));
}

export function checksumProbabilityFixturePayload(value) {
  const text = stableSerializeProbabilityValue(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getProbabilityPortfolioFingerprint({ portfolioId, settings, assets }) {
  return stableSerializeProbabilityValue({
    portfolioId: String(portfolioId || ""),
    settings: {
      startValue: settings?.startValue ?? null,
      monthlyCashFlow: settings?.monthlyCashFlow ?? null,
      years: settings?.years ?? null,
      investmentMonths: settings?.investmentMonths ?? null,
      inflationRate: settings?.inflationRate ?? null,
      dividendReinvest: Boolean(settings?.dividendReinvest),
    },
    assets: safeArray(assets)
      .map((asset) => ({
        market: normalizeMarket(asset),
        ticker: normalizeTicker(asset),
        targetWeight: asset?.targetWeight ?? null,
        targetEvaluationAmount: asset?.targetEvaluationAmount ?? null,
      }))
      .sort((left, right) => `${left.market}:${left.ticker}`.localeCompare(`${right.market}:${right.ticker}`)),
  });
}

export function createProbabilityFixturePayloadForIntegrity(result) {
  return {
    scenarioVersion: result?.scenarioVersion,
    method: result?.method,
    randomSeed: result?.randomSeed,
    simulationCount: result?.simulationCount,
    blockMonths: result?.blockMonths,
    rebalanceFrequency: result?.rebalanceFrequency,
    returnBasis: result?.returnBasis,
    currencyMode: result?.currencyMode,
    dataStartDate: result?.dataStartDate,
    dataEndDate: result?.dataEndDate,
    inputHash: result?.inputHash,
    outputHash: result?.outputHash,
    monthlyBands: result?.monthlyBands,
    terminalValue: result?.terminalValue,
    principalShortfallProbability: result?.principalShortfallProbability,
    scenarioMdd: result?.scenarioMdd,
    recovery: result?.recovery,
    contributionSeries: result?.contributionSeries,
  };
}

function formatWon(value) {
  if (!isFiniteNumber(value)) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPercent(value, digits = 1) {
  if (value === null || value === undefined) return "미확인";
  if (!isFiniteNumber(value)) return "미확인";
  return `${(value * 100).toFixed(digits)}%`;
}

function formatMddPercent(value) {
  if (!isFiniteNumber(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function formatMonths(value) {
  if (!isFiniteNumber(value)) return "-";
  const wholeMonths = Math.round(value);
  if (wholeMonths < 12) return `${wholeMonths}개월`;
  const years = Math.floor(wholeMonths / 12);
  const months = wholeMonths % 12;
  return months > 0 ? `${years}년 ${months}개월` : `${years}년`;
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
  if (result.scenarioVersion !== SUPPORTED_SCENARIO_VERSION) issues.push("unsupported_scenarioVersion");
  if (result.method !== SUPPORTED_METHOD) issues.push("unsupported_method");
  validateHash(result.inputHash, "inputHash", issues);
  validateHash(result.outputHash, "outputHash", issues);
  for (const flag of REQUIRED_READY_FLAGS) {
    if (result[flag] !== false) issues.push(`${flag}_must_be_false`);
  }
}

function validateFixedPercentiles(percentiles, issues) {
  if (!Array.isArray(percentiles) || percentiles.length !== FIXED_PERCENTILES.length) {
    issues.push("percentiles_not_fixed_contract");
    return;
  }
  for (let index = 0; index < FIXED_PERCENTILES.length; index += 1) {
    if (percentiles[index] !== FIXED_PERCENTILES[index]) {
      issues.push("percentiles_not_fixed_contract");
      return;
    }
  }
}

function areOrdered(values) {
  return values.every((value) => isFiniteNumber(value)) &&
    values.every((value, index) => index === 0 || values[index - 1] <= value);
}

function validateOrderedObject(object, keys, label, issues) {
  if (!isPlainObject(object)) {
    issues.push(`${label}_missing`);
    return;
  }
  if (!areOrdered(keys.map((key) => object[key]))) {
    issues.push(`${label}_order_invalid`);
  }
}

function validateProbability(value, label, issues) {
  if (value === null || value === undefined) return;
  if (!isFiniteNumber(value) || value < 0 || value > 1) issues.push(`${label}_out_of_range`);
}

function validateScenarioMdd(result, issues) {
  validateOrderedObject(result.scenarioMdd, PERCENTILE_KEYS, "scenarioMdd", issues);
  for (const key of PERCENTILE_KEYS) {
    const value = result.scenarioMdd?.[key];
    if (!isFiniteNumber(value) || value < -1 || value > 0) {
      issues.push(`scenarioMdd_${key}_out_of_range`);
    }
  }
}

function validateRecovery(result, issues) {
  const recovery = result.recovery;
  if (!isPlainObject(recovery)) {
    issues.push("recovery_missing");
    return;
  }
  for (const key of ["medianRecoveryMonths", "longestRecoveryMonths"]) {
    const value = recovery[key];
    if (value !== null && (!isFiniteNumber(value) || value < 0)) issues.push(`recovery_${key}_invalid`);
  }
  validateProbability(recovery.unrecoveredScenarioRatio, "recovery_unrecoveredScenarioRatio", issues);
}

function validateMonthlyBands(result, issues) {
  const bands = safeArray(result.monthlyBands);
  if (bands.length < 2) {
    issues.push("monthlyBands_missing");
    return [];
  }
  let previousMonthIndex = -1;
  const monthIndexes = [];
  for (const [index, band] of bands.entries()) {
    if (!Number.isInteger(band?.monthIndex)) {
      issues.push(`monthIndex_not_integer:${index}`);
      return monthIndexes;
    }
    if (band.monthIndex <= previousMonthIndex) {
      issues.push(`monthIndex_not_strict_ascending:${index}`);
      return monthIndexes;
    }
    previousMonthIndex = band.monthIndex;
    monthIndexes.push(band.monthIndex);
    if (!areOrdered(BAND_KEY_SETS.nominal.map((key) => band[key]))) {
      issues.push(`nominal_percentile_order_invalid:${index}`);
      return monthIndexes;
    }
    if (!areOrdered(BAND_KEY_SETS.real.map((key) => band[key]))) {
      issues.push(`real_percentile_order_invalid:${index}`);
      return monthIndexes;
    }
  }
  return monthIndexes;
}

function validateContributionSeries(result, expectedMonthIndexes, issues) {
  const series = safeArray(result.contributionSeries);
  if (series.length !== expectedMonthIndexes.length) {
    issues.push("contributionSeries_alignment_invalid");
    return;
  }
  let previousValue = -Infinity;
  for (let index = 0; index < expectedMonthIndexes.length; index += 1) {
    const point = series[index];
    if (point?.monthIndex !== expectedMonthIndexes[index]) {
      issues.push("contributionSeries_alignment_invalid");
      return;
    }
    const value = point.cumulativeContributions;
    if (!isFiniteNumber(value)) {
      issues.push("contributionSeries_value_invalid");
      return;
    }
    if (value < previousValue) {
      issues.push("contributionSeries_not_nondecreasing");
      return;
    }
    previousValue = value;
  }
}

function validateReadyResult(result, issues) {
  validateFixedPercentiles(result.percentiles, issues);
  const monthIndexes = validateMonthlyBands(result, issues);
  validateContributionSeries(result, monthIndexes, issues);
  validateOrderedObject(result.terminalValue, PERCENTILE_KEYS, "terminalValue", issues);
  const shortfall = result.principalShortfallProbability;
  if (!isPlainObject(shortfall)) {
    issues.push("principalShortfallProbability_missing");
  } else {
    for (const key of ["month12", "month36", "month60"]) {
      validateProbability(shortfall[key], `shortfall_${key}`, issues);
    }
  }
  validateScenarioMdd(result, issues);
  validateRecovery(result, issues);
  if (!Number.isInteger(result.simulationCount) || result.simulationCount <= 0) issues.push("simulationCount_invalid");
  if (![6, 12].includes(result.blockMonths)) issues.push("blockMonths_invalid");
  if (!Number.isInteger(result.randomSeed)) issues.push("randomSeed_invalid");
  if (!["price_return", "total_return"].includes(result.returnBasis)) issues.push("returnBasis_invalid");
  if (!["KRW", "USD", "mixed"].includes(result.currencyMode)) issues.push("currencyMode_invalid");
  if (!/^\d{4}-\d{2}$/.test(String(result.dataStartDate || ""))) issues.push("dataStartDate_invalid");
  if (!/^\d{4}-\d{2}$/.test(String(result.dataEndDate || ""))) issues.push("dataEndDate_invalid");
  if (result.status !== result.dataQuality?.status) issues.push("dataQuality_status_mismatch");
  for (const field of ["normalizationVersion", "calculationPolicyVersion", "pipelineVersion", "prngAlgorithm"]) {
    if (!isNonEmptyString(result[field])) issues.push(`${field}_missing`);
  }
}

function validateFixtureContext({ result, fixtureContext, fingerprint, expectedInputHash, expectedOutputHash, issues }) {
  if (!fixtureContext?.reviewOnly) {
    issues.push("fixture_review_gate_missing");
    return;
  }
  if (fixtureContext.portfolioFingerprint !== fingerprint) issues.push("portfolioFingerprint_mismatch");
  if (fixtureContext.expectedInputHash !== result.inputHash) issues.push("fixture_inputHash_mismatch");
  if (fixtureContext.expectedOutputHash !== result.outputHash) issues.push("fixture_outputHash_mismatch");
  if (expectedInputHash && expectedInputHash !== result.inputHash) issues.push("expected_inputHash_mismatch");
  if (expectedOutputHash && expectedOutputHash !== result.outputHash) issues.push("expected_outputHash_mismatch");
  const signature = checksumProbabilityFixturePayload(createProbabilityFixturePayloadForIntegrity(result));
  if (fixtureContext.payloadSignature !== signature) issues.push("fixture_payload_signature_mismatch");
}

function validateInternalPreviewContext({ result, context, activePortfolio, assets, expectedInputHash, expectedOutputHash, issues }) {
  if (context?.reviewOnly !== true) issues.push("internal_preview_review_gate_missing");
  if (context?.productionPublishReady !== false) issues.push("internal_preview_production_gate_invalid");
  if (context?.appExportApproved !== false) issues.push("internal_preview_app_export_gate_invalid");
  if (context?.gapsForwardFilled !== false) issues.push("internal_preview_forward_fill_invalid");
  if (!isNonEmptyString(context?.sourceCandidatePackageId)) issues.push("internal_preview_source_package_missing");
  if (String(context?.portfolioId || "") !== String(activePortfolio?.id || "")) {
    issues.push("portfolioFingerprint_mismatch");
  }
  const expectedIdentities = safeArray(assets)
    .map((asset) => `${normalizeMarket(asset)}:${normalizeTicker(asset)}`)
    .filter((identity) => !identity.endsWith(":") && !identity.endsWith(":CASH"))
    .sort();
  const contextIdentities = safeArray(context?.identities).map((value) => String(value || "").trim()).filter(Boolean).sort();
  if (expectedIdentities.join("|") !== contextIdentities.join("|")) {
    issues.push("internal_preview_asset_identity_mismatch");
  }
  if (expectedInputHash && expectedInputHash !== result.inputHash) issues.push("expected_inputHash_mismatch");
  if (expectedOutputHash && expectedOutputHash !== result.outputHash) issues.push("expected_outputHash_mismatch");
}

function normalizeContributionSeries(result) {
  return result.contributionSeries.map((point) => ({
    monthIndex: point.monthIndex,
    cumulativeContributions: point.cumulativeContributions,
  }));
}

function baselineIdentityMatches({ baselineResult, result, fingerprint }) {
  const identity = baselineResult?.analysisIdentity;
  if (!isPlainObject(identity)) return false;
  return identity.portfolioFingerprint === fingerprint && identity.inputHash === result.inputHash;
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
      title: "확률분석 대기",
      message: "검증된 precomputed 확률분석 결과가 연결되면 여기에 표시됩니다.",
    },
    insufficient_data: {
      title: "데이터 기간 부족",
      message: "확률 밴드를 만들 만큼 공통 월별 이력이 충분하지 않습니다.",
    },
    blocked: {
      title: "확률분석 사용 불가",
      message: "검증 조건을 통과하지 못해 확률 수치를 표시하지 않습니다.",
    },
    stale: {
      title: "이전 확률분석 결과",
      message: "현재 포트폴리오 또는 설정과 결과 identity가 일치하지 않습니다.",
    },
    error: {
      title: "확률분석 오류",
      message: "결과를 안전하게 표시할 수 없습니다.",
    },
  }[status] || {
    title: "확률분석 사용 불가",
    message: "검증 조건을 통과하지 못해 확률 수치를 표시하지 않습니다.",
  };

  return {
    status,
    selectedPortfolioName,
    fixtureContext,
    title: copy.title,
    message: copy.message,
    userGuidance: status === "blocked"
      ? "누락값이나 검증 실패를 0으로 대체하지 않고 표시를 보류합니다."
      : copy.message,
    auditReasons: reasons,
  };
}

function createSummaryCards(result) {
  const terminal = result.terminalValue;
  const shortfall = result.principalShortfallProbability;
  const scenarioMdd = result.scenarioMdd;
  const recovery = result.recovery;

  return [
    { key: "terminal-p10", label: "최종 평가금액 P10", value: formatWon(terminal.p10) },
    { key: "terminal-p50", label: "최종 평가금액 P50", value: formatWon(terminal.p50) },
    { key: "terminal-p90", label: "최종 평가금액 P90", value: formatWon(terminal.p90) },
    { key: "shortfall-12", label: "1년 원금 미달확률", value: formatPercent(shortfall.month12) },
    { key: "shortfall-36", label: "3년 원금 미달확률", value: formatPercent(shortfall.month36) },
    { key: "shortfall-60", label: "5년 원금 미달확률", value: formatPercent(shortfall.month60) },
    { key: "scenario-mdd-p50", label: "시나리오 MDD 중앙값", value: formatMddPercent(scenarioMdd.p50) },
    { key: "scenario-mdd-p10", label: "시나리오 MDD 하방값", value: formatMddPercent(scenarioMdd.p10) },
    { key: "recovery-median", label: "회복기간 중앙값", value: formatMonths(recovery.medianRecoveryMonths) },
    { key: "recovery-longest", label: "최장 회복기간", value: formatMonths(recovery.longestRecoveryMonths) },
    { key: "recovery-unrecovered", label: "미회복 시나리오 비율", value: formatPercent(recovery.unrecoveredScenarioRatio) },
  ];
}

function createMethodology(result = {}) {
  return [
    { label: "returnBasis", value: result.returnBasis || "-" },
    { label: "currencyMode", value: result.currencyMode || "-" },
    { label: "dataStartDate", value: result.dataStartDate || "-" },
    { label: "dataEndDate", value: result.dataEndDate || "-" },
    { label: "simulationCount", value: String(result.simulationCount ?? "-") },
    { label: "blockMonths", value: String(result.blockMonths ?? "-") },
    { label: "randomSeed", value: String(result.randomSeed ?? "-") },
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
  providerApprovalEvidence = null,
  internalPreviewContext = null,
}) {
  const approvalEvidence = normalizeProviderApprovalEvidence(providerApprovalEvidence, result, fingerprint);
  const isInternalPreview = isPlainObject(internalPreviewContext);
  return {
    uiVersion: PROBABILITY_UI_VERSION,
    status: "ready",
    selectedPortfolioName,
    portfolioFingerprint: fingerprint,
    expectedInputHash: expectedInputHash || result.inputHash,
    expectedOutputHash: expectedOutputHash || result.outputHash,
    resultInputHash: result.inputHash,
    resultOutputHash: result.outputHash,
    fixtureOnly: isInternalPreview ? false : approvalEvidence ? false : true,
    internalPreviewReviewOnly: isInternalPreview,
    productionPublishReady: Boolean(approvalEvidence?.productionPublishReady),
    appExportApproved: Boolean(approvalEvidence?.appExportApproved),
    providerApprovalEvidence: approvalEvidence,
    fixtureContext: result.fixtureContext,
    internalPreviewContext,
    scenarioVersion: result.scenarioVersion,
    method: result.method,
    prngAlgorithm: result.prngAlgorithm,
    chart: {
      ariaLabel: "확률분석 P10 P25 P50 P75 P90 밴드 차트",
      portfolioCount: 1,
      bands: result.monthlyBands.map((band) => ({
        monthIndex: band.monthIndex,
        p10Nominal: band.p10Nominal,
        p25Nominal: band.p25Nominal,
        p50Nominal: band.p50Nominal,
        p75Nominal: band.p75Nominal,
        p90Nominal: band.p90Nominal,
        p10Real: band.p10Real,
        p25Real: band.p25Real,
        p50Real: band.p50Real,
        p75Real: band.p75Real,
        p90Real: band.p90Real,
      })),
      contributionSeries: normalizeContributionSeries(result),
      baselineReference: normalizeBaselineReference({ baselineResult, result, fingerprint }),
      semantics: {
        outerBand: "P10-P90",
        innerBand: "P25-P75",
        medianLine: "P50",
        contributionLine: "cumulativeContributions",
      },
    },
    summaryCards: createSummaryCards(result),
    methodology: createMethodology(result),
    dataQuality: result.dataQuality || {},
    displayAssets: safeArray(result.assets).length > 0
      ? result.assets.map((asset) => `${normalizeMarket(asset) || "-"}:${normalizeTicker(asset)}`)
      : safeArray(assets).filter((asset) => normalizeTicker(asset)).map((asset) => `${normalizeMarket(asset) || "-"}:${normalizeTicker(asset)}`),
    disclaimer: "이 확률분석은 과거 월간 수익률 재표본화 시뮬레이션입니다. 미래 수익을 예측하거나 보장하지 않으며 투자 권유가 아닙니다.",
    audit: {
      sourceHashCount: safeArray(result.sourceHashes).length,
      outputHash: result.outputHash,
      betaApplied: result.betaApplied,
      cagrCalibrationApplied: result.cagrCalibrationApplied,
      historicalMddApplied: result.historicalMddApplied,
    },
  };
}

export function buildProbabilityScenarioViewModel({
  result,
  activePortfolio,
  assets = [],
  settings = {},
  baselineResult = null,
  expectedInputHash = null,
  expectedOutputHash = null,
  enableFixtureReview = false,
  enableInternalPreviewReview = false,
  providerApprovalEvidence = null,
} = {}) {
  const selectedPortfolioName = activePortfolio?.name || "선택 포트폴리오";
  const fingerprint = getProbabilityPortfolioFingerprint({
    portfolioId: activePortfolio?.id,
    settings,
    assets,
  });

  if (!result) {
    return createStatusViewModel({
      status: "idle",
      selectedPortfolioName,
      reasons: ["precomputed_result_missing"],
    });
  }

  const status = normalizeStatus(result.status);
  const issues = [];
  const hasFixtureContext = isPlainObject(result.fixtureContext);
  const hasInternalPreviewContext = isPlainObject(result.internalPreviewContext);
  const approvalEvidence = normalizeProviderApprovalEvidence(providerApprovalEvidence, result, fingerprint);
  validateContractHeader(result, issues);

  if (status === "ready") {
    if (hasInternalPreviewContext) {
      if (!enableInternalPreviewReview) {
        return createStatusViewModel({
          status: "idle",
          selectedPortfolioName,
          reasons: ["internal_preview_review_gate_disabled"],
        });
      }
      validateInternalPreviewContext({
        result,
        context: result.internalPreviewContext,
        activePortfolio,
        assets,
        expectedInputHash,
        expectedOutputHash,
        issues,
      });
    } else if (hasFixtureContext) {
      if (!enableFixtureReview) {
        return createStatusViewModel({
          status: "idle",
          selectedPortfolioName,
          reasons: ["fixture_review_gate_disabled"],
          fixtureContext: result.fixtureContext || null,
        });
      }
      validateFixtureContext({
        result,
        fixtureContext: result.fixtureContext,
        fingerprint,
        expectedInputHash,
        expectedOutputHash,
        issues,
      });
    } else if (!approvalEvidence) {
      issues.push("providerApprovalEvidence_invalid");
    }
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
    if (hasInternalPreviewContext && enableInternalPreviewReview) {
      return {
        ...createStatusViewModel({
          status,
          selectedPortfolioName,
          reasons: safeArray(result?.dataQuality?.blockReasons),
        }),
        scenarioVersion: result.scenarioVersion,
        methodology: createMethodology(result),
        fixtureOnly: false,
        internalPreviewReviewOnly: true,
        productionPublishReady: false,
        appExportApproved: false,
        internalPreviewContext: result.internalPreviewContext,
        resultInputHash: result.inputHash,
        resultOutputHash: result.outputHash,
        audit: {
          sourceHashCount: safeArray(result.sourceHashes).length,
          outputHash: result.outputHash,
        },
      };
    }
    if (!hasFixtureContext || !enableFixtureReview) {
      return createStatusViewModel({
        status: "blocked",
        selectedPortfolioName,
        reasons: ["providerApprovalEvidence_invalid"],
        fixtureContext: result.fixtureContext || null,
      });
    }
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
      productionPublishReady: false,
      appExportApproved: false,
      providerApprovalEvidence: null,
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
    selectedPortfolioName:
      result.internalPreviewContext?.portfolioName ||
      result.fixtureContext?.portfolioName ||
      selectedPortfolioName,
    assets,
    baselineResult,
    fingerprint,
    expectedInputHash,
    expectedOutputHash,
    providerApprovalEvidence: hasFixtureContext || hasInternalPreviewContext ? null : approvalEvidence,
    internalPreviewContext: hasInternalPreviewContext ? result.internalPreviewContext : null,
  });
}

export function isProbabilityViewModelReady(viewModel) {
  return viewModel?.status === "ready" &&
    Array.isArray(viewModel?.chart?.bands) &&
    viewModel.chart.bands.length > 0;
}
