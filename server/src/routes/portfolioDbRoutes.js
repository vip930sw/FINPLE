import { createHash } from "node:crypto";

import express from "express";

import {
  archiveAllPortfoliosWithSnapshot,
  archivePortfolio,
  createPortfolio,
  getDefaultUserId,
  getLatestPortfolioPersistenceEnvelope,
  getPortfolio,
  listPortfolios,
  updatePortfolio,
} from "../db/portfolioRepository.js";
import { createPortfolioApiSnapshot } from "../services/portfolioPersistenceModel.js";

const router = express.Router();

function getRequestUserId(request) {
  return request.header("x-finple-user-id") || getDefaultUserId();
}

function toPublicPortfolio(portfolio) {
  if (!portfolio) return portfolio;
  const { __persistenceEnvelope, ...publicPortfolio } = portfolio;
  return publicPortfolio;
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

export function normalizeLocalPortfolioForSync(
  portfolio,
  userId,
  index,
  globalSettings = {},
  activePortfolioId = null,
) {
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
    persistencePortfolio: portfolio,
    globalSettings,
    activePortfolioId,
    assets,
    sortOrder: Number(portfolio?.sortOrder ?? index),
    commonConditions: {
      monthlyInvestment: globalSettings.monthlyCashFlow,
      investmentYears: globalSettings.years,
      inflationRate: globalSettings.inflationRate,
      dividendReinvest: globalSettings.dividendReinvest,
      startValue: globalSettings.startValue,
    },
  };
}

router.get("/", async (request, response, next) => {
  try {
    const userId = getRequestUserId(request);
    const portfolios = await listPortfolios(userId);
    const fallbackEnvelope =
      portfolios.length === 0
        ? await getLatestPortfolioPersistenceEnvelope(userId)
        : null;
    const snapshot = createPortfolioApiSnapshot(portfolios, fallbackEnvelope);

    response.json({
      ok: true,
      source: "server-db",
      userId,
      ...snapshot,
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
      portfolio: toPublicPortfolio(portfolio),
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
      const emptyResult = await archiveAllPortfoliosWithSnapshot(userId, {
        globalSettings,
      });
      response.json({
        ok: true,
        source: "server-db",
        schemaVersion: request.body?.schemaVersion || 3,
        syncedCount: 0,
        archivedStaleCount: emptyResult.archivedCount,
        errorCount: 0,
        activePortfolioId: null,
        globalSettings,
        portfolios: [],
        message: "서버 포트폴리오 목록을 빈 상태로 동기화했습니다.",
      });
      return;
    }

    const results = [];

    for (let index = 0; index < portfolioList.length; index += 1) {
      const originalPortfolio = portfolioList[index];
      const payload = normalizeLocalPortfolioForSync(
        originalPortfolio,
        userId,
        index,
        globalSettings,
        request.body?.activePortfolioId || null,
      );

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
          id: syncedPortfolio.serverId || syncedPortfolio.id,
          localId: originalPortfolio?.id,
          name: syncedPortfolio.name,
          status: "synced",
          portfolio: toPublicPortfolio(syncedPortfolio),
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

    const syncedPortfolioIds = new Set(
      results
        .filter((result) => result.status === "synced" && result.id)
        .map((result) => result.id)
    );
    const syncErrorCount = results.filter(
      (result) => result.status === "error",
    ).length;

    let archivedStaleCount = 0;

    if (syncedPortfolioIds.size > 0 && syncErrorCount === 0) {
      const currentServerPortfolios = await listPortfolios(userId);
      const stalePortfolios = currentServerPortfolios.filter(
        (portfolio) => !syncedPortfolioIds.has(portfolio.serverId || portfolio.id)
      );

      for (const stalePortfolio of stalePortfolios) {
        await archivePortfolio(stalePortfolio.serverId || stalePortfolio.id, userId);
        archivedStaleCount += 1;
      }
    }

    const syncedCount = results.filter((result) => result.status === "synced").length;
    const errorCount = syncErrorCount;

    const errorMessages = results
      .filter((result) => result.status === "error")
      .map((result) => `${result.name || result.localId || result.id}: ${result.message}`);

    response.json({
      ok: errorCount === 0,
      source: "server-db",
      syncedCount,
      archivedStaleCount,
      errorCount,
      message: errorCount > 0
        ? `일부 포트폴리오 동기화 실패: ${errorMessages.slice(0, 3).join(" / ")}`
        : archivedStaleCount > 0
          ? `브라우저 포트폴리오를 서버 DB에 동기화했습니다. 오래된 서버 포트폴리오 ${archivedStaleCount}개를 정리했습니다.`
          : "브라우저 포트폴리오를 서버 DB에 동기화했습니다.",
      results,
      schemaVersion: request.body?.schemaVersion || 3,
      activePortfolioId: request.body?.activePortfolioId || null,
      globalSettings,
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
      portfolio: toPublicPortfolio(portfolio),
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
      portfolio: toPublicPortfolio(portfolio),
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
