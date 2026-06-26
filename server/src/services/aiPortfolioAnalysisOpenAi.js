import { createHttpError } from "../schemas/aiPortfolioAnalysisSchema.js";
import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.1";
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_MAX_OUTPUT_TOKENS = 2200;

const MODEL_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "dataQuality",
    "portfolioProfile",
    "diversification",
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
  return {
    apiKey: String(process.env.OPENAI_API_KEY || "").trim(),
    model: String(process.env.FINPLE_AI_OPENAI_MODEL || DEFAULT_MODEL).trim(),
    timeoutMs: toPositiveInteger(process.env.FINPLE_AI_OPENAI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    maxOutputTokens: toPositiveInteger(process.env.FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS),
  };
}

function buildInstructions(payload) {
  const tickers = payload.assets.map((asset) => asset.ticker).join(", ");
  return [
    "You are FINPLE's portfolio analysis narrator.",
    "Return only the JSON object requested by the schema.",
    "Write all user-facing text in Korean.",
    "Use polite formal Korean honorific style. Prefer endings such as 입니다, 합니다, 보입니다, 수 있습니다, and 어렵습니다.",
    "Do not use casual or plain report-style endings such as 있다, 어렵다, 나타낸다, 가진다, or 못한다 in user-facing prose.",
    "Keep the analysis concrete and tied to the submitted assets, metrics, and portfolio structure.",
    "Avoid vague coined labels. Prefer familiar portfolio language such as 성장 자산, 현금흐름 자산, 안정 자산, 장기채, 금, or 리츠 when supported by the input.",
    "Explain risk as observations and checks, not as predictions or instructions.",
    "Do not provide investment advice, buy/sell/hold recommendations, target prices, target allocations, or return guarantees.",
    "Do not write digits or percentages in any text field, including title, summary, warnings, code, label, evidence, rationale, limitations, and disclaimer.",
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

function parseModelJson(responseBody) {
  const text = extractOutputText(responseBody).trim();
  if (!text) {
    throw createHttpError(502, "AI provider 응답 본문이 비어 있습니다.", ["openai output_text missing"]);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw createHttpError(502, "AI provider JSON 응답을 해석하지 못했습니다.", [error.message]);
  }
}

export async function requestOpenAiPortfolioAnalysis(payload) {
  const config = getOpenAiConfig();

  if (!config.apiKey) {
    throw createHttpError(503, "OpenAI API key가 설정되지 않았습니다.", ["OPENAI_API_KEY is required"]);
  }

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
