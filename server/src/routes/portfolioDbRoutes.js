import { createHash } from "node:crypto";

import express from "express";

import {
  archivePortfolio,
  createPortfolio,
  getDefaultUserId,
  getPortfolio,
  listPortfolios,
  updatePortfolio,
} from "../db/portfolioRepository.js";

const router = express.Router();

function getRequestUserId(request) {
  return request.header("x-finple-user-id") || getDefaultUserId();
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_PATTERN.test(String(value || ""));
}

function stableUuidFromString(value) {
  const hex = createHash("sha1").update(String(value)).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);

  return [
    hex.slice(0, 8).join(""),
    hex.slice(8, 12).join(""),
    hex.slice(12, 16).join(""),
    hex.slice(16, 20).join(""),
    hex.slice(20, 32).join(""),
  ].join("-");
}

function normalizeLocalPortfolioForSync(portfolio, userId, index, globalSettings = {}) {
  const localPortfolioKey =
    portfolio?.id || portfolio?.localId || portfolio?.name || portfolio?.title || `portfolio-${index}`;
  const portfolioId = isUuid(portfolio?.id)
    ? portfolio.id
    : stableUuidFromString(`finple:portfolio:${userId}:${localPortfolioKey}`);

  const assets = Array.isArray(portfolio?.assets)
    ? portfolio.assets.map((asset, assetIndex) => {
        const localAssetKey =
          asset?.id || asset?.localId || `${asset?.ticker || "asset"}-${assetIndex}`;
        return {
          ...asset,
          id: isUuid(asset?.id)
            ? asset.id
            : stableUuidFromString(`finple:asset:${portfolioId}:${localAssetKey}:${assetIndex}`),
        };
      })
    : [];

  return {
    ...portfolio,
    id: portfolioId,
    assets,
    sortOrder: Number(portfolio?.sortOrder ?? index),
    commonConditions: {
      monthlyInvestment: globalSettings.monthlyCashFlow,
      investmentYears: globalSettings.years,
      inflationRate: globalSettings.inflationRate,
      dividendReinvest: globalSettings.dividendReinvest,
    },
  };
}

router.get("/", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const portfolios = await listPortfolios(userId);

    response.json({
      ok: true,
      source: "server-db",
      userId,
      portfolios,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const portfolio = await createPortfolio(request.body, userId);

    response.status(201).json({
      ok: true,
      source: "server-db",
      portfolio,
    });
  } catch (error) {
    next(error);
  }
});


router.post("/sync-local", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const portfolioList = Array.isArray(request.body?.portfolioList)
      ? request.body.portfolioList
      : [];
    const globalSettings = request.body?.globalSettings || {};

    if (portfolioList.length === 0) {
      response.status(400).json({
        ok: false,
        message: "동기화할 포트폴리오 목록이 없습니다.",
      });
      return;
    }

    const results = [];

    for (let index = 0; index < portfolioList.length; index += 1) {
      const originalPortfolio = portfolioList[index];
      const payload = normalizeLocalPortfolioForSync(originalPortfolio, userId, index, globalSettings);

      try {
        let syncedPortfolio;

        try {
          syncedPortfolio = await updatePortfolio(payload.id, payload, userId);
        } catch (updateError) {
          if (Number(updateError.statusCode) !== 404) {
            throw updateError;
          }

          syncedPortfolio = await createPortfolio(payload, userId);
        }

        results.push({
          id: syncedPortfolio.id,
          localId: originalPortfolio?.id,
          name: syncedPortfolio.name,
          status: "synced",
          portfolio: syncedPortfolio,
        });
      } catch (error) {
        results.push({
          id: payload?.id,
          localId: originalPortfolio?.id,
          name: originalPortfolio?.name || originalPortfolio?.title || payload?.name,
          status: "error",
          message: error?.message || "동기화 실패",
        });
      }
    }

    const syncedCount = results.filter((result) => result.status === "synced").length;
    const errorCount = results.filter((result) => result.status === "error").length;

    const errorMessages = results
      .filter((result) => result.status === "error")
      .map((result) => `${result.name || result.localId || result.id}: ${result.message}`);

    response.json({
      ok: errorCount === 0,
      source: "server-db",
      syncedCount,
      errorCount,
      message: errorCount > 0
        ? `일부 포트폴리오 동기화 실패: ${errorMessages.slice(0, 3).join(" / ")}`
        : "브라우저 포트폴리오를 서버 DB에 동기화했습니다.",
      results,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:portfolioId", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const portfolio = await getPortfolio(request.params.portfolioId, userId);

    response.json({
      ok: true,
      source: "server-db",
      portfolio,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:portfolioId", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const portfolio = await updatePortfolio(request.params.portfolioId, request.body, userId);

    response.json({
      ok: true,
      source: "server-db",
      portfolio,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:portfolioId", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const result = await archivePortfolio(request.params.portfolioId, userId);

    response.json({
      ok: true,
      source: "server-db",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
