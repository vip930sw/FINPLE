import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";
import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.1";
const DEFAULT_TIMEOUT_MS = 45000;
const MIN_MAX_OUTPUT_TOKENS = 4200;
const DEFAULT_MAX_OUTPUT_TOKENS = 4200;
const DEFAULT_RETRY_COUNT = 1;

const MODEL_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "dataQuality",
    "portfolioProfile",
    "diversification",
    "diagnosticSections",
    "riskFactors",
    "assetRoles",
    "limitations",
    "disclaimer",
  ],
  properties: {
    dataQuality: {
      type: "object",
      additionalProperties: false,
      required: ["level", "summary", "warnings"],
      properties: {
        level: { type: "string", enum: ["good", "review", "limited"] },
        summary: { type: "string" },
        warnings: { type: "array", items: { type: "string" } },
      },
    },
    portfolioProfile: {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
      },
    },
    diversification: {
      type: "object",
      additionalProperties: false,
      required: ["nominalAssetCount", "effectiveDiversificationLevel", "summary"],
      properties: {
        nominalAssetCount: { type: "number" },
        effectiveDiversificationLevel: { type: "string", enum: ["low", "medium", "high"] },
        summary: { type: "string" },
      },
    },
    diagnosticSections: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "title", "summary", "observations"],
        properties: {
          key: {
            type: "string",
            enum: ["structure", "risk_balance", "cashflow", "data_context"],
          },
          title: { type: "string" },
          summary: { type: "string" },
          observations: { type: "array", items: { type: "string" } },
        },
      },
    },
    riskFactors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "label", "severity", "evidence"],
        properties: {
          code: { type: "string" },
          label: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          evidence: { type: "array", items: { type: "string" } },
        },
      },
    },
    assetRoles: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["ticker", "market", "weight", "role", "rationale"],
        properties: {
          ticker: { type: "string" },
          market: { type: "string", enum: ["US", "KR"] },
          weight: { type: "number" },
          role: { type: "string", enum: ["core", "growth", "income", "stability"] },
          rationale: { type: "string" },
        },
      },
    },
    limitations: { type: "array", items: { type: "string" } },
    disclaimer: { type: "string" },
  },
};

function toPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function getOpenAiConfig() {
  const configuredMaxOutputTokens = toPositiveInteger(
    process.env.FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS,
    DEFAULT_MAX_OUTPUT_TOKENS
  );

  return {
    apiKey: String(process.env.OPENAI_API_KEY || "").trim(),
    model: String(process.env.FINPLE_AI_OPENAI_MODEL || DEFAULT_MODEL).trim(),
    timeoutMs: toPositiveInteger(process.env.FINPLE_AI_OPENAI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxOutputTokens: Math.max(configuredMaxOutputTokens, MIN_MAX_OUTPUT_TOKENS),
    retryCount: Math.min(
      toPositiveInteger(process.env.FINPLE_AI_OPENAI_RETRY_COUNT, DEFAULT_RETRY_COUNT),
      3
    ),
  };
}

function roundNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}

function sumWeights(assets, predicate) {
  return roundNumber(
    assets
      .filter(predicate)
      .reduce((sum, asset) => sum + Number(asset.weight || 0), 0)
  );
}

function countAssetsWithNumber(assets, field) {
  return assets.filter((asset) => Number.isFinite(asset[field])).length;
}

function inferAssetRoleHint(asset) {
  const cagr = Number(asset.cagr);
  const beta = Number(asset.beta);
  const mdd = Number(asset.mdd);
  const dividendYield = Number(asset.dividendYield);

  if (Number.isFinite(dividendYield) && dividendYield >= 3) return "income";
  if (Number.isFinite(beta) && beta <= 0.3) return "stability";
  if (Number.isFinite(mdd) && mdd >= -20) return "stability";
  if (Number.isFinite(cagr) && cagr >= 10) return "growth";
  if (Number.isFinite(beta) && beta >= 1) return "growth";
  if (Number.isFinite(dividendYield) && dividendYield >= 2) return "income";
  return "core";
}

function hasFiniteMetric(metrics, fields) {
  return fields.some((field) => Number.isFinite(metrics?.[field]));
}

function buildDataStatusCounts(assets) {
  return assets.reduce((counts, asset) => {
    const status = asset.dataStatus || "unknown";
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
}

function buildAssetRoleHints(assets) {
  return assets.map((asset) => ({
    ticker: asset.ticker,
    market: asset.market,
    weight: roundNumber(asset.weight),
    suggestedRole: inferAssetRoleHint(asset),
    signals: {
      hasCagr: Number.isFinite(asset.cagr),
      hasBeta: Number.isFinite(asset.beta),
      hasMdd: Number.isFinite(asset.mdd),
      hasDividendYield: Number.isFinite(asset.dividendYield),
    },
  }));
}

function buildCashflowFacts(payload) {
  return {
    portfolioDividendYield: roundNumber(payload.metrics?.dividendYield),
    dividendDataWeight: sumWeights(payload.assets, (asset) => Number.isFinite(asset.dividendYield)),
    incomeCandidateWeight: sumWeights(
      payload.assets,
      (asset) => Number.isFinite(asset.dividendYield) && asset.dividendYield >= 2
    ),
    missingDividendDataWeight: sumWeights(payload.assets, (asset) => !Number.isFinite(asset.dividendYield)),
  };
}

function buildRiskSignals(payload) {
  const largestMdd = payload.assets
    .filter((asset) => Number.isFinite(asset.mdd))
    .sort((left, right) => Number(left.mdd) - Number(right.mdd))[0];

  return {
    portfolioBeta: roundNumber(payload.metrics?.beta),
    portfolioMdd: roundNumber(payload.metrics?.mdd),
    deepestDrawdownAsset: largestMdd
      ? {
          ticker: largestMdd.ticker,
          market: largestMdd.market,
          mdd: roundNumber(largestMdd.mdd),
          weight: roundNumber(largestMdd.weight),
        }
      : null,
  };
}

function buildDerivedFacts(payload) {
  const assetsByWeight = [...payload.assets].sort(
    (left, right) => Number(right.weight || 0) - Number(left.weight || 0)
  );
  const topAssets = assetsByWeight.slice(0, 5).map((asset) => ({
    ticker: asset.ticker,
    market: asset.market,
    weight: roundNumber(asset.weight),
    dataStatus: asset.dataStatus,
  }));

  return {
    assetCount: payload.assets.length,
    totalWeight: roundNumber(
      payload.assets.reduce((sum, asset) => sum + Number(asset.weight || 0), 0)
    ),
    marketWeights: {
      US: sumWeights(payload.assets, (asset) => asset.market === "US"),
      KR: sumWeights(payload.assets, (asset) => asset.market === "KR"),
    },
    concentration: {
      largestAsset: topAssets[0] || null,
      topTwoWeight: roundNumber(
        assetsByWeight
          .slice(0, 2)
          .reduce((sum, asset) => sum + Number(asset.weight || 0), 0)
      ),
    },
    dataCoverage: {
      dataStatusCounts: buildDataStatusCounts(payload.assets),
      assetsWithCagr: countAssetsWithNumber(payload.assets, "cagr"),
      assetsWithBeta: countAssetsWithNumber(payload.assets, "beta"),
      assetsWithMdd: countAssetsWithNumber(payload.assets, "mdd"),
      assetsWithDividendYield: countAssetsWithNumber(payload.assets, "dividendYield"),
    },
    metricCoverage: {
      hasPortfolioCagr: hasFiniteMetric(payload.metrics, ["cagr", "expectedCagr"]),
      hasPortfolioBeta: hasFiniteMetric(payload.metrics, ["beta"]),
      hasPortfolioMdd: hasFiniteMetric(payload.metrics, ["mdd"]),
      hasPortfolioDividendYield: hasFiniteMetric(payload.metrics, ["dividendYield"]),
    },
    cashflow: buildCashflowFacts(payload),
    riskSignals: buildRiskSignals(payload),
    assetRoleHints: buildAssetRoleHints(payload.assets),
  };
}

function buildInstructions(payload) {
  const tickers = payload.assets.map((asset) => asset.ticker).join(", ");
  return [
    "You are FINPLE's portfolio analysis narrator.",
    "Return only the JSON object requested by the schema.",
    "Write all user-facing text in Korean.",
    "Use polite formal Korean honorific style. Prefer endings such as 입니다, 합니다, 보입니다, 있습니다, and 해석됩니다.",
    "Do not use casual or plain report-style endings such as 있다, 어렵다, 나타낸다, 가진다, or 못한다 in user-facing prose.",
    "Keep the analysis concrete and tied to the submitted assets, metrics, and portfolio structure.",
    "Use diagnosticSections for more detailed interpretation before riskFactors.",
    "Return exactly three diagnosticSections using the allowed keys. Prefer structure, risk_balance, and data_context. Use cashflow instead of data_context only when cashflow is clearly supported by the input.",
    "Each diagnosticSections item must include a concise title, a concise summary, and exactly two observations.",
    "Make diagnosticSections more specific than the portfolioProfile summary, but do not introduce new facts outside the input.",
    "Use derivedFacts as deterministic server-calculated context for concentration, market weights, and data coverage.",
    "Use derivedFacts.assetRoleHints to keep assetRoles consistent with each asset's submitted metrics. Prefer the suggestedRole unless another role is clearly supported by the same input.",
    "Use derivedFacts.cashflow for dividend and cashflow commentary. If dividend coverage is incomplete, state that as a limitation instead of assuming income strength.",
    "Use derivedFacts.riskSignals when explaining drawdown or beta risk, especially when one asset carries an unusually deep drawdown.",
    "When dataCoverage is incomplete, reflect that uncertainty in dataQuality and limitations instead of filling gaps with assumptions.",
    "Avoid vague coined labels. Prefer familiar portfolio language such as 성장 자산, 현금흐름 자산, 안정 자산, 장기채, 금, or 리츠 when supported by the input.",
    "Explain risk as observations and checks, not as predictions or instructions.",
    "Do not provide investment advice, buy/sell/hold recommendations, target prices, target allocations, or return guarantees.",
    "Do not write digits or percentages in any text field, including title, summary, warnings, code, label, evidence, rationale, limitations, and disclaimer.",
    "Numeric ticker strings such as Korean six-digit tickers are allowed only when copied exactly from the input tickers.",
    "Only use numeric values in nominalAssetCount and assetRoles.weight, copied exactly from the input payload.",
    "Use lowercase snake_case words without digits for riskFactors.code.",
    `Only mention these input tickers: ${tickers}.`,
    "Copy each asset role ticker, market, and weight exactly from the input assets.",
    "The disclaimer must include this exact Korean phrase: 투자 권유가 아닌 참고자료",
  ].join("\n");
}

function buildInput(payload) {
  return JSON.stringify({
    portfolioId: payload.portfolioId,
    analysisContext: payload.analysisContext,
    metrics: payload.metrics,
    assets: payload.assets,
    derivedFacts: buildDerivedFacts(payload),
    requiredOutputNotes: {
      mode: "live",
      provider: "openai",
      nominalAssetCount: payload.assets.length,
      allowedAssetRoles: ["core", "growth", "income", "stability"],
      allowedRiskSeverity: ["low", "medium", "high"],
    },
  });
}

function extractOutputText(responseBody) {
  if (typeof responseBody?.output_text === "string") return responseBody.output_text;

  for (const outputItem of responseBody?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (typeof contentItem?.text === "string") return contentItem.text;
    }
  }

  return "";
}

function extractStructuredOutput(responseBody) {
  if (responseBody?.output_parsed && typeof responseBody.output_parsed === "object") {
    return responseBody.output_parsed;
  }

  for (const outputItem of responseBody?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (contentItem?.parsed && typeof contentItem.parsed === "object") return contentItem.parsed;
      if (contentItem?.json && typeof contentItem.json === "object") return contentItem.json;
    }
  }

  return null;
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch (firstError) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        // Keep the original parse error for cleaner provider diagnostics.
      }
    }
    throw firstError;
  }
}

function parseModelJson(responseBody) {
  if (responseBody?.status === "incomplete") {
    throw createHttpError(
      502,
      "AI provider 응답 생성이 길이 제한으로 중단되었습니다. 잠시 후 다시 시도해 주세요.",
      [`openai_incomplete_reason=${responseBody?.incomplete_details?.reason || "unknown"}`]
    );
  }

  const structuredOutput = extractStructuredOutput(responseBody);
  if (structuredOutput) return structuredOutput;

  const text = extractOutputText(responseBody).trim();
  if (!text) {
    throw createHttpError(502, "AI provider 응답 본문이 비어 있습니다.", ["openai output_text missing"]);
  }

  try {
    return parseJsonText(text);
  } catch (error) {
    throw createHttpError(502, "AI provider JSON 응답을 해석하지 못했습니다.", [error.message]);
  }
}

async function requestOpenAiPortfolioAnalysisOnce(payload, config) {
  const response = await fetchWithTimeout(
    OPENAI_RESPONSES_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        instructions: buildInstructions(payload),
        input: buildInput(payload),
        max_output_tokens: config.maxOutputTokens,
        text: {
          format: {
            type: "json_schema",
            name: "finple_portfolio_analysis",
            strict: true,
            schema: MODEL_OUTPUT_SCHEMA,
          },
        },
      }),
    },
    config.timeoutMs
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw createHttpError(
      response.status >= 500 ? 502 : 400,
      "AI provider 요청에 실패했습니다.",
      [`provider_status=${response.status}`, `provider_error=${responseBody?.error?.message || "unknown"}`]
    );
  }

  return parseModelJson(responseBody);
}

function isRetryableOpenAiError(error) {
  const statusCode = Number(error?.statusCode || 0);
  if (statusCode === 502 || statusCode === 504) return true;
  return statusCode >= 500 && statusCode < 600;
}

export async function requestOpenAiPortfolioAnalysis(payload) {
  const config = getOpenAiConfig();

  if (!config.apiKey) {
    throw createHttpError(503, "OpenAI API key가 설정되지 않았습니다.", ["OPENAI_API_KEY is required"]);
  }

  let lastError = null;
  const attempts = config.retryCount + 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await requestOpenAiPortfolioAnalysisOnce(payload, config);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetryableOpenAiError(error)) break;
    }
  }

  throw lastError;
}
