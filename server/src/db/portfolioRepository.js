import { randomUUID } from "node:crypto";

import { query, withTransaction } from "./database.js";

const DEFAULT_DEV_USER_ID =
  process.env.FINPLE_DEV_USER_ID || "00000000-0000-4000-8000-000000000001";
const DEFAULT_DEV_USER_EMAIL = process.env.FINPLE_DEV_USER_EMAIL || "trial@finple.local";
const DEFAULT_DEV_USER_NAME = process.env.FINPLE_DEV_USER_NAME || "FINPLE 체험 사용자";

export function getDefaultUserId() {
  return DEFAULT_DEV_USER_ID;
}

export async function ensureDevUser(userId = DEFAULT_DEV_USER_ID) {
  await query(
    `INSERT INTO users (id, email, name, nickname, plan)
     VALUES ($1, $2, $3, $4, 'free')
     ON CONFLICT (id) DO UPDATE
     SET email = EXCLUDED.email,
         name = EXCLUDED.name,
         nickname = EXCLUDED.nickname,
         updated_at = NOW()` ,
    [userId, DEFAULT_DEV_USER_EMAIL, DEFAULT_DEV_USER_NAME, "trial"]
  );

  return getUserById(userId);
}

export async function getUserById(userId = DEFAULT_DEV_USER_ID) {
  await ensureUserExistsForRead(userId);

  const result = await query(
    `SELECT id, email, name, nickname, plan, created_at, updated_at, last_login_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return mapUser(result.rows[0]);
}

async function ensureUserExistsForRead(userId) {
  if (userId === DEFAULT_DEV_USER_ID) {
    const result = await query("SELECT id FROM users WHERE id = $1", [userId]);
    if (result.rowCount === 0) {
      await query(
        `INSERT INTO users (id, email, name, nickname, plan)
         VALUES ($1, $2, $3, $4, 'free')`,
        [userId, DEFAULT_DEV_USER_EMAIL, DEFAULT_DEV_USER_NAME, "trial"]
      );
    }
  }
}

export async function listPortfolios(userId = DEFAULT_DEV_USER_ID) {
  await ensureUserExistsForRead(userId);

  const portfolioResult = await query(
    `SELECT *
     FROM portfolios
     WHERE user_id = $1 AND is_archived = FALSE
     ORDER BY sort_order ASC, updated_at DESC`,
    [userId]
  );

  return hydratePortfolios(portfolioResult.rows);
}

export async function getPortfolio(portfolioId, userId = DEFAULT_DEV_USER_ID) {
  await ensureUserExistsForRead(userId);

  const portfolioResult = await query(
    `SELECT *
     FROM portfolios
     WHERE id = $1 AND user_id = $2 AND is_archived = FALSE`,
    [portfolioId, userId]
  );

  if (portfolioResult.rowCount === 0) {
    const error = new Error("포트폴리오를 찾지 못했습니다.");
    error.statusCode = 404;
    throw error;
  }

  const [portfolio] = await hydratePortfolios(portfolioResult.rows);
  return portfolio;
}

export async function createPortfolio(input, userId = DEFAULT_DEV_USER_ID) {
  const normalized = normalizePortfolioInput(input);

  return withTransaction(async (tx) => {
    await ensureUserExistsForTransaction(tx, userId);

    const portfolioId = normalized.id || randomUUID();

    const portfolioResult = await tx(
      `INSERT INTO portfolios (
        id, user_id, name, description, monthly_investment, investment_years,
        inflation_rate, dividend_reinvest, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        portfolioId,
        userId,
        normalized.name,
        normalized.description,
        normalized.monthlyInvestment,
        normalized.investmentYears,
        normalized.inflationRate,
        normalized.dividendReinvest,
        normalized.sortOrder,
      ]
    );

    await insertAssets(tx, portfolioId, normalized.assets);

    const [portfolio] = await hydratePortfolios(portfolioResult.rows, tx);
    return portfolio;
  });
}

export async function updatePortfolio(portfolioId, input, userId = DEFAULT_DEV_USER_ID) {
  const normalized = normalizePortfolioInput(input, { partial: true });

  return withTransaction(async (tx) => {
    await ensureUserExistsForTransaction(tx, userId);

    const existingResult = await tx(
      `SELECT * FROM portfolios
       WHERE id = $1 AND user_id = $2 AND is_archived = FALSE`,
      [portfolioId, userId]
    );

    if (existingResult.rowCount === 0) {
      const error = new Error("수정할 포트폴리오를 찾지 못했습니다.");
      error.statusCode = 404;
      throw error;
    }

    const current = existingResult.rows[0];

    const updatedResult = await tx(
      `UPDATE portfolios
       SET name = $3,
           description = $4,
           monthly_investment = $5,
           investment_years = $6,
           inflation_rate = $7,
           dividend_reinvest = $8,
           sort_order = $9,
           updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        portfolioId,
        userId,
        normalized.name ?? current.name,
        normalized.description ?? current.description,
        normalized.monthlyInvestment ?? current.monthly_investment,
        normalized.investmentYears ?? current.investment_years,
        normalized.inflationRate ?? current.inflation_rate,
        normalized.dividendReinvest ?? current.dividend_reinvest,
        normalized.sortOrder ?? current.sort_order,
      ]
    );

    if (Array.isArray(input?.assets)) {
      await tx("DELETE FROM portfolio_assets WHERE portfolio_id = $1", [portfolioId]);
      await insertAssets(tx, portfolioId, normalized.assets);
    }

    const [portfolio] = await hydratePortfolios(updatedResult.rows, tx);
    return portfolio;
  });
}

export async function archivePortfolio(portfolioId, userId = DEFAULT_DEV_USER_ID) {
  await ensureUserExistsForRead(userId);

  const result = await query(
    `UPDATE portfolios
     SET is_archived = TRUE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND is_archived = FALSE
     RETURNING id`,
    [portfolioId, userId]
  );

  if (result.rowCount === 0) {
    const error = new Error("삭제할 포트폴리오를 찾지 못했습니다.");
    error.statusCode = 404;
    throw error;
  }

  return { ok: true, id: portfolioId };
}

async function ensureUserExistsForTransaction(tx, userId) {
  if (userId !== DEFAULT_DEV_USER_ID) return;

  await tx(
    `INSERT INTO users (id, email, name, nickname, plan)
     VALUES ($1, $2, $3, $4, 'free')
     ON CONFLICT (id) DO NOTHING`,
    [userId, DEFAULT_DEV_USER_EMAIL, DEFAULT_DEV_USER_NAME, "trial"]
  );
}

async function insertAssets(tx, portfolioId, assets = []) {
  const filteredAssets = assets.filter((asset) => String(asset?.ticker || "").trim());

  for (let index = 0; index < filteredAssets.length; index += 1) {
    const asset = filteredAssets[index];
    await tx(
      `INSERT INTO portfolio_assets (
        id, portfolio_id, ticker, name, quantity, price, currency, cagr, beta, mdd,
        dividend_yield, data_source, fetched_at, sort_order
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        asset.id || randomUUID(),
        portfolioId,
        normalizeTicker(asset.ticker),
        asset.name || asset.koreanName || null,
        toNumber(asset.quantity, 0),
        toNumber(asset.price, 0),
        asset.currency || "KRW",
        toNullableNumber(asset.cagr),
        toNullableNumber(asset.beta),
        toNullableNumber(asset.mdd),
        toNullableNumber(asset.dividendYield ?? asset.dividend_yield),
        asset.dataSource || asset.data_source || "manual",
        normalizeDate(asset.fetchedAt || asset.fetched_at),
        Number(asset.sortOrder ?? asset.sort_order ?? index),
      ]
    );
  }
}

async function hydratePortfolios(portfolioRows, tx = query) {
  if (portfolioRows.length === 0) return [];

  const portfolioIds = portfolioRows.map((portfolio) => portfolio.id);
  const assetResult = await tx(
    `SELECT *
     FROM portfolio_assets
     WHERE portfolio_id = ANY($1::uuid[])
     ORDER BY sort_order ASC, created_at ASC`,
    [portfolioIds]
  );

  const assetsByPortfolio = new Map();

  for (const asset of assetResult.rows) {
    const list = assetsByPortfolio.get(asset.portfolio_id) || [];
    list.push(mapAsset(asset));
    assetsByPortfolio.set(asset.portfolio_id, list);
  }

  return portfolioRows.map((portfolio) => ({
    ...mapPortfolio(portfolio),
    assets: assetsByPortfolio.get(portfolio.id) || [],
  }));
}

function normalizePortfolioInput(input = {}, options = {}) {
  const conditions = input.commonConditions || input.conditions || {};
  const partial = Boolean(options.partial);

  return {
    id: input.id,
    name: input.name || input.title || (partial ? undefined : "새 포트폴리오"),
    description: input.description ?? null,
    monthlyInvestment: optionalNumber(
      input.monthlyInvestment ?? input.monthly_investment ?? conditions.monthlyInvestment,
      partial ? undefined : 0
    ),
    investmentYears: optionalNumber(
      input.investmentYears ?? input.investment_years ?? input.periodYears ?? conditions.investmentYears,
      partial ? undefined : 30
    ),
    inflationRate: optionalNumber(
      input.inflationRate ?? input.inflation_rate ?? conditions.inflationRate,
      partial ? undefined : 2.5
    ),
    dividendReinvest:
      input.dividendReinvest ?? input.dividend_reinvest ?? conditions.dividendReinvest ??
      (partial ? undefined : true),
    sortOrder: optionalNumber(input.sortOrder ?? input.sort_order, partial ? undefined : 0),
    assets: Array.isArray(input.assets) ? input.assets : [],
  };
}

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    nickname: row.nickname,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLoginAt: row.last_login_at,
  };
}

function mapPortfolio(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    monthlyInvestment: Number(row.monthly_investment || 0),
    investmentYears: Number(row.investment_years || 0),
    inflationRate: Number(row.inflation_rate || 0),
    dividendReinvest: Boolean(row.dividend_reinvest),
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAsset(row) {
  return {
    id: row.id,
    portfolioId: row.portfolio_id,
    ticker: row.ticker,
    name: row.name,
    quantity: Number(row.quantity || 0),
    price: Number(row.price || 0),
    currency: row.currency,
    cagr: toNumber(row.cagr, 0),
    beta: toNumber(row.beta, 0),
    mdd: toNumber(row.mdd, 0),
    dividendYield: toNumber(row.dividend_yield, 0),
    dataSource: row.data_source,
    fetchedAt: row.fetched_at,
    sortOrder: Number(row.sort_order || 0),
  };
}

function normalizeTicker(ticker) {
  return String(ticker || "").trim().toUpperCase();
}

function optionalNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return toNumber(value, fallback);
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
