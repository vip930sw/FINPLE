import { collectAllowedTickers, collectInputNumbers, createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";

const REQUIRED_TOP_LEVEL_FIELDS = [
  "analysisVersion",
  "portfolioId",
  "generatedAt",
  "mode",
  "provider",
  "dataQuality",
  "portfolioProfile",
  "diversification",
  "riskFactors",
  "assetRoles",
  "limitations",
  "disclaimer",
];

const FORBIDDEN_PATTERNS = [
  /매수\s*추천/i,
  /매도\s*추천/i,
  /종목\s*추천/i,
  /수익\s*보장/i,
  /상승\s*확률/i,
  /적정\s*매수가/i,
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bguarantee(?:d)?\b/i,
  /\bprice\s*target\b/i,
];

const COMMON_UPPERCASE_TOKENS = new Set([
  "AI",
  "API",
  "BETA",
  "CAGR",
  "ETF",
  "FINPLE",
  "JSON",
  "KR",
  "MDD",
  "STEP",
  "US",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenValues(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => flattenValues(item, output));
    return output;
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((item) => flattenValues(item, output));
    return output;
  }

  output.push(value);
  return output;
}

function collectNumericValues(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectNumericValues(item, output));
    return output;
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((item) => collectNumericValues(item, output));
    return output;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    output.push(value);
  }

  return output;
}

function numberIsAllowed(number, allowedNumbers) {
  for (const allowed of allowedNumbers) {
    if (Math.abs(number - allowed) < 0.000001) return true;
  }
  return false;
}

function validateRequiredShape(output, errors) {
  if (!isPlainObject(output)) {
    errors.push("output must be an object.");
    return;
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in output)) errors.push(`output.${field} is required.`);
  }

  if (!Array.isArray(output.riskFactors)) errors.push("output.riskFactors must be an array.");
  if (!Array.isArray(output.assetRoles)) errors.push("output.assetRoles must be an array.");
  if (!Array.isArray(output.limitations)) errors.push("output.limitations must be an array.");
}

function validateForbiddenLanguage(output, errors) {
  const text = flattenValues(output)
    .filter((value) => typeof value === "string")
    .join("\n");

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      errors.push(`output contains forbidden language: ${pattern}`);
    }
  }
}

function validateTickerMentions(output, allowedTickers, errors) {
  const text = flattenValues(output)
    .filter((value) => typeof value === "string")
    .join(" ");
  const candidates = text.match(/\b[A-Z][A-Z0-9.-]{1,15}\b/g) || [];

  for (const candidate of candidates) {
    if (COMMON_UPPERCASE_TOKENS.has(candidate)) continue;
    if (!allowedTickers.has(candidate)) {
      errors.push(`output mentions ticker-like token not present in input: ${candidate}`);
    }
  }
}

function validateNumericValues(output, inputPayload, errors) {
  const allowedNumbers = collectInputNumbers(inputPayload);
  const numbers = collectNumericValues(output);

  for (const number of numbers) {
    if (!numberIsAllowed(number, allowedNumbers)) {
      errors.push(`output contains numeric value not present in input or allowed derivations: ${number}`);
    }
  }
}

export function validateAiPortfolioAnalysisOutput(output, inputPayload) {
  const errors = [];
  validateRequiredShape(output, errors);
  validateForbiddenLanguage(output, errors);
  validateTickerMentions(output, collectAllowedTickers(inputPayload), errors);
  validateNumericValues(output, inputPayload, errors);

  const disclaimer = String(output?.disclaimer || "");
  if (!disclaimer.includes("투자 권유가 아닌 참고자료")) {
    errors.push("output.disclaimer must include the required disclaimer.");
  }

  if (errors.length > 0) {
    throw createHttpError(500, "AI 분석 출력 검증에 실패했습니다.", errors);
  }

  return output;
}
