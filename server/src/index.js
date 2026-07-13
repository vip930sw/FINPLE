import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import {
  createIpRateLimiter,
  requestContextMiddleware,
  requestTimingMiddleware,
} from "./middleware/requestStability.js";
import authRoutes from "./routes/authRoutes.js";
import dbRoutes from "./routes/dbRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import paymentGuardRoutes from "./routes/paymentGuardRoutes.js";
import paymentWebhookRoutes from "./routes/paymentWebhookRoutes.js";
import paymentSubscriptionRoutes from "./routes/paymentSubscriptionRoutes.js";
import paymentOneWayBillingRoutes from "./routes/paymentOneWayBillingRoutes.js";
import paymentBillingRoutes from "./routes/paymentBillingRoutes.js";
import paymentBillingMethodDisplayRoutes from "./routes/paymentBillingMethodDisplayRoutes.js";
import paymentBillingMethodRoutes from "./routes/paymentBillingMethodRoutes.js";
import paymentHistoryRoutes from "./routes/paymentHistoryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import portfolioDbRoutes from "./routes/portfolioDbRoutes.js";
import investmentMbtiRoutes from "./routes/investmentMbtiRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import aiPortfolioAnalysisRoutes from "./routes/aiPortfolioAnalysisRoutes.js";
import adminTradingReadinessRoutes from "./routes/adminTradingReadinessRoutes.js";

import {
  getAssetDataBatch,
  getAssetDataByTicker,
  getSelectedProvider,
  getSupportedTickers,
} from "./services/assetDataProvider.js";
import { getDeploymentInfo } from "./services/deploymentInfo.js";
import {
  getTickerFilterOptions,
  getTickerMasterItem,
  screenTickerMaster,
  searchTickerMaster,
} from "./services/tickerMasterService.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5050);

function getCorsOrigin() {
  const rawOrigin = process.env.CORS_ORIGIN;
  if (!rawOrigin || rawOrigin === "true" || rawOrigin === "*") return true;
  return rawOrigin.split(",").map((origin) => origin.trim()).filter(Boolean);
}

const corsOrigin = getCorsOrigin();
const authLoginRateLimiter = createIpRateLimiter({
  windowMs: Number(process.env.FINPLE_AUTH_LOGIN_RATE_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.FINPLE_AUTH_LOGIN_RATE_MAX || 15),
  keyPrefix: "auth-login",
  message: "로그인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
});
const authGeneralRateLimiter = createIpRateLimiter({
  windowMs: Number(process.env.FINPLE_AUTH_RATE_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.FINPLE_AUTH_RATE_MAX || 120),
  keyPrefix: "auth-general",
  message: "인증 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
});

app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(requestContextMiddleware);
app.use(requestTimingMiddleware);
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/health", healthRoutes);
app.use("/api/auth/login", authLoginRateLimiter);
app.use("/api/auth/education-login", authLoginRateLimiter);
app.use("/api/auth", authGeneralRateLimiter, authRoutes);
app.use("/api/db", dbRoutes);
app.use("/api/payments", paymentGuardRoutes);
app.use("/api/payments", paymentWebhookRoutes);
app.use("/api/payments", paymentSubscriptionRoutes);
app.use("/api/payments", paymentOneWayBillingRoutes);
app.use("/api/payments", paymentBillingRoutes);
app.use("/api/payments", paymentBillingMethodDisplayRoutes);
app.use("/api/payments", paymentBillingMethodRoutes);
app.use("/api/payments", paymentHistoryRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/account/portfolios", portfolioDbRoutes);
app.use("/api/account/investment-mbti", investmentMbtiRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/trading-readiness", adminTradingReadinessRoutes);
app.use("/api/ai", aiPortfolioAnalysisRoutes);

app.get("/api/health", (request, response) => {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.json({
    ok: true,
    app: "FINPLE Asset Proxy",
    deployment: getDeploymentInfo(),
    provider: getSelectedProvider(),
    supportedTickers: getSupportedTickers(),
    requestId: request.requestId || null,
    checkedAt: new Date().toISOString(),
  });
});

app.get("/api/tickers/search", (request, response) => {
  const results = searchTickerMaster({
    query: request.query.q,
    market: request.query.market || "all",
    type: request.query.type || "all",
    category: request.query.category || "all",
    riskLevel: request.query.riskLevel || "all",
    beginnerFit: request.query.beginnerFit || "all",
    limit: request.query.limit || 20,
  });
  response.json({ results, filters: getTickerFilterOptions() });
});

app.get("/api/tickers/screener", (request, response) => {
  const results = screenTickerMaster({
    goal: request.query.goal || "all",
    riskLevel: request.query.riskLevel || "all",
    type: request.query.type || "all",
    market: request.query.market || "all",
    minDividendYield: request.query.minDividendYield,
    maxBeta: request.query.maxBeta,
    minCagr: request.query.minCagr,
    maxMdd: request.query.maxMdd,
    beginnerOnly: request.query.beginnerOnly === "true",
    limit: request.query.limit || 30,
  });
  response.json({ results, filters: getTickerFilterOptions() });
});

app.get("/api/tickers/:ticker", (request, response) => {
  const item = getTickerMasterItem(request.params.ticker);
  if (!item) {
    response.status(404).json({ ok: false, message: "티커 마스터에서 해당 티커를 찾지 못했습니다." });
    return;
  }
  response.json(item);
});

app.get("/api/assets/:ticker", async (request, response, next) => {
  try {
    const assetData = await getAssetDataByTicker(request.params.ticker);
    response.json(assetData);
  } catch (error) {
    next(error);
  }
});

app.post("/api/assets/batch", async (request, response, next) => {
  try {
    const tickers = Array.isArray(request.body?.tickers) ? request.body.tickers : [];
    const results = await getAssetDataBatch(tickers);
    response.json({ results });
  } catch (error) {
    next(error);
  }
});

app.use((error, request, response, next) => {
  void next;
  const statusCode = Number(error.statusCode || 500);
  if (error.usage?.limited) {
    response.setHeader("X-Finple-AI-Limit", String(error.usage.limit));
    response.setHeader("X-Finple-AI-Remaining", String(error.usage.remaining));
    response.setHeader("X-Finple-AI-Reset-At", new Date(error.usage.resetAt).toISOString());
    if (error.usage.storage) response.setHeader("X-Finple-AI-Usage-Storage", error.usage.storage);
  }

  if (statusCode >= 500) {
    console.error(
      JSON.stringify({
        type: "http_error",
        requestId: request.requestId || null,
        method: request.method,
        path: request.path,
        statusCode,
        message: error?.message || "Unknown server error",
      })
    );
  }

  response.status(statusCode).json({
    ok: false,
    message: error.message || "서버 오류가 발생했습니다.",
    requestId: request.requestId || null,
    ...(statusCode < 500 && Array.isArray(error.details) ? { details: error.details } : {}),
    ...(statusCode < 500 && error.usage?.limited
      ? {
          usage: {
            limit: error.usage.limit,
            remaining: error.usage.remaining,
            resetAt: new Date(error.usage.resetAt).toISOString(),
            storage: error.usage.storage || "memory",
          },
        }
      : {}),
    ...(statusCode < 500 && error.access ? { access: error.access } : {}),
  });
});

app.listen(port, () => {
  console.log(`FINPLE Asset Proxy is running on http://localhost:${port}`);
  console.log(`Provider: ${getSelectedProvider()}`);
  console.log(`CORS origin: ${Array.isArray(corsOrigin) ? corsOrigin.join(", ") : corsOrigin}`);
});
