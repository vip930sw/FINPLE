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

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeStatus(value) {
  const status = String(value || "idle").trim();
  return SUPPORTED_STATUSES.has(status) ? status : "blocked";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatWon(value) {
  if (!isFiniteNumber(value)) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPercent(value, digits = 1) {
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

function normalizeTicker(asset = {}) {
  return String(asset.ticker || "").trim().toUpperCase();
}

function normalizeMarket(asset = {}) {
  return String(asset.market || "").trim().toUpperCase();
}

function getPortfolioFingerprint({ portfolioId, settings, assets }) {
  return JSON.stringify({
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
      .sort((left, right) => (
        `${left.market}:${left.ticker}`.localeCompare(`${right.market}:${right.ticker}`)
      )),
  });
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

function validateBandOrdering(band = {}) {
  const values = [
    band.p10Nominal,
    band.p25Nominal,
    band.p50Nominal,
    band.p75Nominal,
    band.p90Nominal,
  ];
  if (values.some((value) => !isFiniteNumber(value))) return false;
  return values[0] <= values[1] &&
    values[1] <= values[2] &&
    values[2] <= values[3] &&
    values[3] <= values[4];
}

function validateReadyBands(result, issues) {
  const bands = safeArray(result.monthlyBands);
  if (bands.length < 2) {
    issues.push("monthlyBands_missing");
    return;
  }
  for (const [index, band] of bands.entries()) {
    if (!validateBandOrdering(band)) {
      issues.push(`percentile_order_invalid:${index}`);
      return;
    }
  }
}

function createStatusViewModel({ status, reasons = [], selectedPortfolioName }) {
  const copy = {
    idle: {
      title: "확률분석 준비",
      message: "검증된 fixture 결과가 선택되면 확률분석 요약을 표시합니다.",
    },
    insufficient_data: {
      title: "데이터 기간 부족",
      message: "확률 밴드와 확률 수치는 표시하지 않습니다. 기준전망은 별도 확인이 가능합니다.",
    },
    blocked: {
      title: "확률분석 사용 불가",
      message: "검증 조건을 통과하지 못해 확률 수치를 만들지 않습니다.",
    },
    stale: {
      title: "이전 확률분석 결과",
      message: "포트폴리오 또는 설정이 바뀌어 최신 결과가 아닙니다.",
    },
    error: {
      title: "확률분석 오류",
      message: "결과를 안전하게 표시할 수 없습니다. 잠시 후 다시 확인해 주세요.",
    },
  }[status] || {
    title: "확률분석 사용 불가",
    message: "검증 조건을 통과하지 못해 확률 수치를 만들지 않습니다.",
  };

  return {
    status,
    selectedPortfolioName,
    title: copy.title,
    message: copy.message,
    userGuidance: status === "blocked"
      ? "숫자를 0으로 대체하지 않고, 검증된 결과가 준비될 때까지 표시를 보류합니다."
      : copy.message,
    auditReasons: reasons,
  };
}

function normalizeContributionSeries(result) {
  const contributionMap = new Map(
    safeArray(result.contributionSeries)
      .filter((point) => Number.isInteger(point?.monthIndex))
      .map((point) => [point.monthIndex, point.cumulativeContributions]),
  );
  return safeArray(result.monthlyBands).map((band) => ({
    monthIndex: band.monthIndex,
    cumulativeContributions: contributionMap.get(band.monthIndex) ?? null,
  }));
}

function normalizeBaselineReference(baselineResult) {
  return safeArray(baselineResult?.monthlyBaselinePoints)
    .filter((point) => Number.isInteger(point?.monthIndex) && isFiniteNumber(point?.portfolioValueNominal))
    .map((point) => ({
      monthIndex: point.monthIndex,
      value: point.portfolioValueNominal,
      label: point.periodLabel || `${point.monthIndex}개월`,
    }));
}

function createSummaryCards(result) {
  const terminal = isPlainObject(result.terminalValue) ? result.terminalValue : {};
  const shortfall = isPlainObject(result.principalShortfallProbability)
    ? result.principalShortfallProbability
    : {};
  const scenarioMdd = isPlainObject(result.scenarioMdd) ? result.scenarioMdd : {};
  const recovery = isPlainObject(result.recovery) ? result.recovery : {};

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

function createMethodology(result) {
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

function createReadyViewModel({ result, selectedPortfolioName, assets, baselineResult, fingerprint, expectedInputHash }) {
  const contributionSeries = normalizeContributionSeries(result);
  return {
    uiVersion: PROBABILITY_UI_VERSION,
    status: "ready",
    selectedPortfolioName,
    portfolioFingerprint: fingerprint,
    expectedInputHash: expectedInputHash || result.inputHash,
    resultInputHash: result.inputHash,
    fixtureOnly: true,
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
        p10Real: band.p10Real ?? null,
        p25Real: band.p25Real ?? null,
        p50Real: band.p50Real ?? null,
        p75Real: band.p75Real ?? null,
        p90Real: band.p90Real ?? null,
      })),
      contributionSeries,
      baselineReference: normalizeBaselineReference(baselineResult),
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
    displayAssets: safeArray(assets)
      .filter((asset) => normalizeTicker(asset))
      .map((asset) => `${normalizeMarket(asset) || "-"}:${normalizeTicker(asset)}`),
    disclaimer: "이 확률분석은 과거 월간 수익률을 재표본화한 시뮬레이션입니다. 미래 수익을 예측하거나 보장하지 않으며, 투자 권유가 아닙니다.",
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
} = {}) {
  const selectedPortfolioName = activePortfolio?.name || "선택 포트폴리오";
  const fingerprint = getPortfolioFingerprint({
    portfolioId: activePortfolio?.id,
    settings,
    assets,
  });
  const status = normalizeStatus(result?.status);

  if (status === "idle") {
    return createStatusViewModel({ status: "idle", selectedPortfolioName });
  }

  const issues = [];
  validateContractHeader(result, issues);

  if (expectedInputHash && result?.inputHash && expectedInputHash !== result.inputHash) {
    return {
      ...createStatusViewModel({
        status: "stale",
        selectedPortfolioName,
        reasons: ["inputHash_mismatch"],
      }),
      previousResult: result,
      portfolioFingerprint: fingerprint,
      expectedInputHash,
      resultInputHash: result.inputHash,
    };
  }

  if (status === "ready") validateReadyBands(result, issues);

  if (issues.length > 0) {
    return createStatusViewModel({
      status: "blocked",
      selectedPortfolioName,
      reasons: issues,
    });
  }

  if (status !== "ready") {
    return {
      ...createStatusViewModel({
        status,
        selectedPortfolioName,
        reasons: safeArray(result?.dataQuality?.blockReasons),
      }),
      scenarioVersion: result.scenarioVersion,
      methodology: createMethodology(result),
      fixtureOnly: true,
      resultInputHash: result.inputHash,
      audit: {
        sourceHashCount: safeArray(result.sourceHashes).length,
        outputHash: result.outputHash,
      },
    };
  }

  return createReadyViewModel({
    result,
    selectedPortfolioName,
    assets,
    baselineResult,
    fingerprint,
    expectedInputHash,
  });
}

export function isProbabilityViewModelReady(viewModel) {
  return viewModel?.status === "ready" &&
    Array.isArray(viewModel?.chart?.bands) &&
    viewModel.chart.bands.length > 0;
}

