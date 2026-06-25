const MAX_ASSET_COUNT = 20;
const WEIGHT_TOLERANCE = 0.5;
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,15}$/;

const NUMERIC_LIMITS = {
  weight: { min: 0, max: 100 },
  cagr: { min: -100, max: 300 },
  expectedCagr: { min: -100, max: 300 },
  beta: { min: -5, max: 15 },
  mdd: { min: -100, max: 0 },
  dividendYield: { min: 0, max: 300 },
  dataYears: { min: 0, max: 150 },
  calmar: { min: -50, max: 50 },
  futureValue: { min: 0, max: Number.MAX_SAFE_INTEGER },
  inflationAdjustedFutureValue: { min: 0, max: Number.MAX_SAFE_INTEGER },
};

const PORTFOLIO_METRIC_FIELDS = [
  "cagr",
  "expectedCagr",
  "beta",
  "mdd",
  "calmar",
  "dividendYield",
  "futureValue",
  "inflationAdjustedFutureValue",
];

const ASSET_NUMERIC_FIELDS = [
  "weight",
  "cagr",
  "expectedCagr",
  "beta",
  "mdd",
  "dividendYield",
  "dataYears",
];

export function createHttpError(statusCode, message, details = []) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeTicker(value) {
  return clean(value).toUpperCase();
}

function normalizeMarket(value) {
  const market = clean(value).toUpperCase();
  return market || "US";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toFiniteNumber(value, path, errors) {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(clean(value).replace(/,/g, ""));
  if (!Number.isFinite(number)) {
    errors.push(`${path} must be a finite number.`);
    return null;
  }
  return number;
}

function validateNumberRange(value, field, path, errors) {
  if (value === null) return null;
  const limits = NUMERIC_LIMITS[field];
  if (!limits) return value;
  if (value < limits.min || value > limits.max) {
    errors.push(`${path} must be between ${limits.min} and ${limits.max}.`);
  }
  return value;
}

function normalizeNumericField(source, field, path, errors) {
  const value = toFiniteNumber(source?.[field], `${path}.${field}`, errors);
  return validateNumberRange(value, field, `${path}.${field}`, errors);
}

function normalizeMetrics(metrics, errors) {
  if (metrics === undefined || metrics === null) return {};
  if (!isPlainObject(metrics)) {
    errors.push("metrics must be an object when provided.");
    return {};
  }

  const normalized = {};
  for (const field of PORTFOLIO_METRIC_FIELDS) {
    const value = normalizeNumericField(metrics, field, "metrics", errors);
    if (value !== null) normalized[field] = value;
  }
  return normalized;
}

function normalizeAsset(asset, index, errors) {
  if (!isPlainObject(asset)) {
    errors.push(`assets[${index}] must be an object.`);
    return null;
  }

  const ticker = normalizeTicker(asset.ticker);
  if (!ticker || !TICKER_PATTERN.test(ticker)) {
    errors.push(`assets[${index}].ticker is invalid.`);
  }

  const market = normalizeMarket(asset.market);
  if (!["US", "KR"].includes(market)) {
    errors.push(`assets[${index}].market must be US or KR.`);
  }

  const normalized = {
    ticker,
    market,
    name: clean(asset.name || asset.nameKr || asset.koreanName || ticker),
    dataStatus: clean(asset.dataStatus || asset.metricsStatus || "unknown"),
  };

  for (const field of ASSET_NUMERIC_FIELDS) {
    const value = normalizeNumericField(asset, field, `assets[${index}]`, errors);
    if (value !== null) normalized[field] = value;
  }

  if (typeof normalized.weight !== "number") {
    errors.push(`assets[${index}].weight is required.`);
  }

  return normalized;
}

function validateWeightTotal(assets, errors) {
  const totalWeight = assets.reduce((sum, asset) => sum + Number(asset?.weight || 0), 0);
  if (Math.abs(totalWeight - 100) > WEIGHT_TOLERANCE) {
    errors.push(`assets weight total must be within ${WEIGHT_TOLERANCE}% of 100. Current total: ${totalWeight.toFixed(2)}.`);
  }
}

export function normalizePortfolioAnalysisRequest(body = {}) {
  const errors = [];

  if (!isPlainObject(body)) {
    throw createHttpError(400, "요청 본문은 JSON 객체여야 합니다.", ["body must be an object."]);
  }

  const assetsInput = Array.isArray(body.assets) ? body.assets : [];
  if (assetsInput.length === 0) {
    errors.push("assets must contain at least one asset.");
  }
  if (assetsInput.length > MAX_ASSET_COUNT) {
    errors.push(`assets cannot contain more than ${MAX_ASSET_COUNT} assets.`);
  }

  const assets = assetsInput
    .map((asset, index) => normalizeAsset(asset, index, errors))
    .filter(Boolean);

  if (assets.length > 0) validateWeightTotal(assets, errors);

  const normalized = {
    portfolioId: clean(body.portfolioId || "mock-portfolio"),
    analysisContext: clean(body.analysisContext || "simulator-step4"),
    settings: isPlainObject(body.settings) ? body.settings : {},
    metrics: normalizeMetrics(body.metrics, errors),
    assets,
  };

  if (errors.length > 0) {
    throw createHttpError(400, "AI 분석 요청값을 확인해주세요.", errors);
  }

  return normalized;
}

export function collectInputNumbers(payload) {
  const numbers = new Set([payload.assets.length]);
  for (const value of Object.values(payload.metrics || {})) {
    if (Number.isFinite(value)) numbers.add(value);
  }
  for (const asset of payload.assets) {
    for (const field of ASSET_NUMERIC_FIELDS) {
      if (Number.isFinite(asset[field])) numbers.add(asset[field]);
    }
  }
  return numbers;
}

export function collectAllowedTickers(payload) {
  return new Set(payload.assets.map((asset) => asset.ticker).filter(Boolean));
}
