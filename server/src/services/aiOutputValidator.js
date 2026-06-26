import { collectAllowedTickers, collectInputNumbers, createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";

const REQUIRED_TOP_LEVEL_FIELDS = [
  "analysisVersion",
  "portfolioId",
  "generatedAt",
  "mode",
  "provider",
  "inputHash",
  "dataQuality",
  "portfolioProfile",
  "diversification",
  "diagnosticSections",
  "riskFactors",
  "assetRoles",
  "limitations",
  "disclaimer",
];

const FORBIDDEN_PATTERNS = [
  /매수\s*추천/i,
  /매도\s*추천/i,
  /종목\s*추천/i,
  /보유\s*추천/i,
  /비중\s*추천/i,
  /목표\s*비중/i,
  /수익\s*보장/i,
  /원금\s*보장/i,
  /상승\s*확률/i,
  /적정\s*매수가/i,
  /목표\s*수익/i,
  /\bbuy\b/i,
  /\bsell\b/i,
  /\bhold\b/i,
  /\brecommend(?:ed|ation)?\b/i,
  /\bguarantee(?:d)?\b/i,
  /\bprice\s*target\b/i,
  /\btarget\s*allocation\b/i,
];

const OUTPUT_CONTRACT = {
  version: "ai-analysis-output-contract-v2",
  maxTotalTextLength: 8500,
  diagnosticSectionCount: 3,
  maxStringLength: 700,
  maxArrayItems: {
    diagnosticSections: 6,
    observations: 5,
    riskFactors: 8,
    assetRoles: 20,
    limitations: 8,
    warnings: 8,
    evidence: 5,
  },
  enums: {
    mode: ["mock", "live"],
    provider: ["none", "openai"],
    dataQualityLevel: ["good", "review", "limited"],
    diversificationLevel: ["low", "medium", "high"],
    diagnosticSectionKey: ["structure", "risk_balance", "cashflow", "data_context"],
    severity: ["low", "medium", "high"],
    assetRole: ["core", "growth", "income", "stability"],
    market: ["US", "KR"],
  },
  topLevelFields: REQUIRED_TOP_LEVEL_FIELDS,
};

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

function clean(value) {
  return String(value ?? "").trim();
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

function collectTextNumericValues(value, path = "output", output = [], allowedTickers = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectTextNumericValues(item, `${path}[${index}]`, output, allowedTickers));
    return output;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) => (
      collectTextNumericValues(item, `${path}.${key}`, output, allowedTickers)
    ));
    return output;
  }

  if (typeof value !== "string") return output;
  if (
    path === "output.generatedAt" ||
    path === "output.inputHash" ||
    path === "output.analysisVersion" ||
    path === "output.portfolioId" ||
    path.endsWith(".ticker")
  ) {
    return output;
  }

  const matches = value.match(/(?<![A-Za-z0-9])-?\d+(?:\.\d+)?%?/g) || [];
  matches.forEach((match) => {
    if (allowedTickers.has(match.replace("%", "").toUpperCase())) return;
    const number = Number(match.replace("%", ""));
    if (Number.isFinite(number)) {
      output.push({ path, number });
    }
  });
  return output;
}

function collectStrings(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output));
    return output;
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((item) => collectStrings(item, output));
    return output;
  }

  if (typeof value === "string") {
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

function validateEnum(value, allowedValues, path, errors) {
  if (!allowedValues.includes(value)) {
    errors.push(`${path} must be one of: ${allowedValues.join(", ")}.`);
  }
}

function validateString(value, path, errors, { required = true } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) errors.push(`${path} is required.`);
    return;
  }
  if (typeof value !== "string") {
    errors.push(`${path} must be a string.`);
    return;
  }
  if (value.length > OUTPUT_CONTRACT.maxStringLength) {
    errors.push(`${path} exceeds ${OUTPUT_CONTRACT.maxStringLength} characters.`);
  }
}

function validateStringArray(value, path, errors, maxItems) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return;
  }
  if (value.length > maxItems) {
    errors.push(`${path} cannot contain more than ${maxItems} items.`);
  }
  value.forEach((item, index) => validateString(item, `${path}[${index}]`, errors));
}

function validateTopLevelShape(output, errors) {
  if (!isPlainObject(output)) {
    errors.push("output must be an object.");
    return;
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!(field in output)) errors.push(`output.${field} is required.`);
  }

  for (const field of Object.keys(output)) {
    if (!REQUIRED_TOP_LEVEL_FIELDS.includes(field)) {
      errors.push(`output.${field} is not allowed by the response contract.`);
    }
  }

  validateString(output.analysisVersion, "output.analysisVersion", errors);
  validateString(output.portfolioId, "output.portfolioId", errors);
  validateString(output.generatedAt, "output.generatedAt", errors);
  validateString(output.inputHash, "output.inputHash", errors);
  validateEnum(output.mode, OUTPUT_CONTRACT.enums.mode, "output.mode", errors);
  validateEnum(output.provider, OUTPUT_CONTRACT.enums.provider, "output.provider", errors);

  if (output.generatedAt && Number.isNaN(Date.parse(output.generatedAt))) {
    errors.push("output.generatedAt must be a valid ISO date string.");
  }
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

function validateTextLength(output, errors) {
  const strings = collectStrings(output);
  const totalLength = strings.reduce((sum, value) => sum + value.length, 0);
  if (totalLength > OUTPUT_CONTRACT.maxTotalTextLength) {
    errors.push(`output text exceeds ${OUTPUT_CONTRACT.maxTotalTextLength} characters.`);
  }
  strings.forEach((value, index) => {
    if (value.length > OUTPUT_CONTRACT.maxStringLength) {
      errors.push(`output string at index ${index} exceeds ${OUTPUT_CONTRACT.maxStringLength} characters.`);
    }
  });
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
  const allowedTickers = collectAllowedTickers(inputPayload);
  const numbers = collectNumericValues(output);

  for (const number of numbers) {
    if (!numberIsAllowed(number, allowedNumbers)) {
      errors.push(`output contains numeric value not present in input or allowed derivations: ${number}`);
    }
  }

  for (const item of collectTextNumericValues(output, "output", [], allowedTickers)) {
    if (!numberIsAllowed(item.number, allowedNumbers)) {
      errors.push(`output text contains numeric value not present in input: ${item.number} at ${item.path}`);
    }
  }
}

function validateDataQuality(output, errors) {
  const dataQuality = output?.dataQuality;
  if (!isPlainObject(dataQuality)) {
    errors.push("output.dataQuality must be an object.");
    return;
  }
  validateEnum(dataQuality.level, OUTPUT_CONTRACT.enums.dataQualityLevel, "output.dataQuality.level", errors);
  validateString(dataQuality.summary, "output.dataQuality.summary", errors);
  validateStringArray(dataQuality.warnings, "output.dataQuality.warnings", errors, OUTPUT_CONTRACT.maxArrayItems.warnings);
}

function validatePortfolioProfile(output, errors) {
  const profile = output?.portfolioProfile;
  if (!isPlainObject(profile)) {
    errors.push("output.portfolioProfile must be an object.");
    return;
  }
  validateString(profile.title, "output.portfolioProfile.title", errors);
  validateString(profile.summary, "output.portfolioProfile.summary", errors);
}

function validateDiversification(output, inputPayload, errors) {
  const diversification = output?.diversification;
  if (!isPlainObject(diversification)) {
    errors.push("output.diversification must be an object.");
    return;
  }
  if (diversification.nominalAssetCount !== inputPayload.assets.length) {
    errors.push("output.diversification.nominalAssetCount must match input asset count.");
  }
  validateEnum(
    diversification.effectiveDiversificationLevel,
    OUTPUT_CONTRACT.enums.diversificationLevel,
    "output.diversification.effectiveDiversificationLevel",
    errors
  );
  validateString(diversification.summary, "output.diversification.summary", errors);
}

function validateDiagnosticSections(output, errors) {
  if (!Array.isArray(output.diagnosticSections)) {
    errors.push("output.diagnosticSections must be an array.");
    return;
  }
  if (output.diagnosticSections.length !== OUTPUT_CONTRACT.diagnosticSectionCount) {
    errors.push(
      `output.diagnosticSections must contain exactly ${OUTPUT_CONTRACT.diagnosticSectionCount} items.`
    );
  }
  if (output.diagnosticSections.length > OUTPUT_CONTRACT.maxArrayItems.diagnosticSections) {
    errors.push(
      `output.diagnosticSections cannot contain more than ${OUTPUT_CONTRACT.maxArrayItems.diagnosticSections} items.`
    );
  }
  const seenKeys = new Set();
  output.diagnosticSections.forEach((section, index) => {
    if (!isPlainObject(section)) {
      errors.push(`output.diagnosticSections[${index}] must be an object.`);
      return;
    }
    validateEnum(
      section.key,
      OUTPUT_CONTRACT.enums.diagnosticSectionKey,
      `output.diagnosticSections[${index}].key`,
      errors
    );
    if (seenKeys.has(section.key)) {
      errors.push(`output.diagnosticSections[${index}].key must be unique.`);
    }
    seenKeys.add(section.key);
    validateString(section.title, `output.diagnosticSections[${index}].title`, errors);
    validateString(section.summary, `output.diagnosticSections[${index}].summary`, errors);
    validateStringArray(
      section.observations,
      `output.diagnosticSections[${index}].observations`,
      errors,
      OUTPUT_CONTRACT.maxArrayItems.observations
    );
  });
}

function validateRiskFactors(output, errors) {
  if (!Array.isArray(output.riskFactors)) {
    errors.push("output.riskFactors must be an array.");
    return;
  }
  if (output.riskFactors.length > OUTPUT_CONTRACT.maxArrayItems.riskFactors) {
    errors.push(`output.riskFactors cannot contain more than ${OUTPUT_CONTRACT.maxArrayItems.riskFactors} items.`);
  }
  output.riskFactors.forEach((factor, index) => {
    if (!isPlainObject(factor)) {
      errors.push(`output.riskFactors[${index}] must be an object.`);
      return;
    }
    validateString(factor.code, `output.riskFactors[${index}].code`, errors);
    validateString(factor.label, `output.riskFactors[${index}].label`, errors);
    validateEnum(factor.severity, OUTPUT_CONTRACT.enums.severity, `output.riskFactors[${index}].severity`, errors);
    validateStringArray(
      factor.evidence,
      `output.riskFactors[${index}].evidence`,
      errors,
      OUTPUT_CONTRACT.maxArrayItems.evidence
    );
  });
}

function validateAssetRoles(output, inputPayload, errors) {
  if (!Array.isArray(output.assetRoles)) {
    errors.push("output.assetRoles must be an array.");
    return;
  }
  if (output.assetRoles.length > OUTPUT_CONTRACT.maxArrayItems.assetRoles) {
    errors.push(`output.assetRoles cannot contain more than ${OUTPUT_CONTRACT.maxArrayItems.assetRoles} items.`);
  }

  const inputAssetsByTicker = new Map(inputPayload.assets.map((asset) => [asset.ticker, asset]));
  const seenTickers = new Set();
  output.assetRoles.forEach((role, index) => {
    if (!isPlainObject(role)) {
      errors.push(`output.assetRoles[${index}] must be an object.`);
      return;
    }

    const ticker = clean(role.ticker).toUpperCase();
    const inputAsset = inputAssetsByTicker.get(ticker);
    if (!inputAsset) {
      errors.push(`output.assetRoles[${index}].ticker must reference an input asset.`);
    } else {
      seenTickers.add(ticker);
      if (role.weight !== inputAsset.weight) {
        errors.push(`output.assetRoles[${index}].weight must match input weight for ${ticker}.`);
      }
    }

    validateString(role.ticker, `output.assetRoles[${index}].ticker`, errors);
    validateEnum(role.market, OUTPUT_CONTRACT.enums.market, `output.assetRoles[${index}].market`, errors);
    validateEnum(role.role, OUTPUT_CONTRACT.enums.assetRole, `output.assetRoles[${index}].role`, errors);
    validateString(role.rationale, `output.assetRoles[${index}].rationale`, errors);
  });

  for (const asset of inputPayload.assets) {
    if (!seenTickers.has(asset.ticker)) {
      errors.push(`output.assetRoles must include input asset ${asset.ticker}.`);
    }
  }
}

function validateLimitations(output, errors) {
  validateStringArray(
    output.limitations,
    "output.limitations",
    errors,
    OUTPUT_CONTRACT.maxArrayItems.limitations
  );
}

function validateSchemaContract(output, inputPayload, errors) {
  validateTopLevelShape(output, errors);
  validateDataQuality(output, errors);
  validatePortfolioProfile(output, errors);
  validateDiversification(output, inputPayload, errors);
  validateDiagnosticSections(output, errors);
  validateRiskFactors(output, errors);
  validateAssetRoles(output, inputPayload, errors);
  validateLimitations(output, errors);
}

export function validateAiPortfolioAnalysisOutput(output, inputPayload) {
  const errors = [];
  validateSchemaContract(output, inputPayload, errors);
  validateTextLength(output, errors);
  validateForbiddenLanguage(output, errors);
  validateTickerMentions(output, collectAllowedTickers(inputPayload), errors);
  validateNumericValues(output, inputPayload, errors);

  const disclaimer = String(output?.disclaimer || "");
  if (!disclaimer.includes("투자 권유가 아닌 참고자료")) {
    errors.push("output.disclaimer must include the required disclaimer.");
  }

  if (errors.length > 0) {
    throw createHttpError(422, "AI 분석 출력 검증에 실패했습니다.", errors);
  }

  return output;
}

export function getAiPortfolioAnalysisOutputContract() {
  return {
    ...OUTPUT_CONTRACT,
    maxArrayItems: { ...OUTPUT_CONTRACT.maxArrayItems },
    enums: Object.fromEntries(
      Object.entries(OUTPUT_CONTRACT.enums).map(([key, values]) => [key, [...values]])
    ),
    topLevelFields: [...OUTPUT_CONTRACT.topLevelFields],
  };
}
