import assert from "node:assert/strict";
import test from "node:test";

import {
  canCreatePortfolio,
  deletePortfolioState,
  deletePortfolioWithServerSync,
} from "./portfolioLifecycle.js";
import { normalizePortfolioPersistenceSnapshot } from "./portfolioPersistenceContract.js";
import { createPortfolioApiSnapshot } from "../../../../server/src/services/portfolioPersistenceModel.js";

const GLOBAL_SETTINGS = Object.freeze({
  startValue: 73500000,
  monthlyCashFlow: 1350000,
  years: 17,
  inflationRate: 3.1,
  dividendReinvest: false,
});

function portfolio(id, ticker = "QQQ") {
  return {
    id,
    name: id,
    assets: [{ id: `${id}-${ticker}`, market: "US", ticker }],
  };
}

test("Free lifecycle supports one to zero and zero to one without default recreation", () => {
  const original = [{ id: "qa-aipi-lifecycle", name: "QA AIPI lifecycle", assets: [] }];
  const deleted = deletePortfolioState(original, "qa-aipi-lifecycle");

  assert.deepEqual(deleted.portfolioList, []);
  assert.equal(deleted.activePortfolioId, null);
  assert.equal(deleted.activePortfolio, null);
  assert.equal(canCreatePortfolio(0, 1), true);
  assert.equal(canCreatePortfolio(1, 1), false);
});

test("failed server deletion preserves the original local state unchanged", async () => {
  const original = [{ id: "qa-aipi-lifecycle", assets: [{ ticker: "AIPI" }] }];
  const before = JSON.stringify(original);
  await assert.rejects(
    deletePortfolioWithServerSync({
      portfolioList: original,
      portfolioId: "qa-aipi-lifecycle",
      syncSnapshot: async () => {
        throw new Error("server delete failed");
      },
    }),
    /server delete failed/,
  );
  assert.equal(JSON.stringify(original), before);
});

test("successful server empty sync returns local zero state only after success", async () => {
  const calls = [];
  const result = await deletePortfolioWithServerSync({
    portfolioList: [{ id: "qa-aipi-lifecycle", assets: [] }],
    portfolioId: "qa-aipi-lifecycle",
    snapshot: { globalSettings: GLOBAL_SETTINGS },
    syncSnapshot: async (nextSnapshot) => {
      calls.push(nextSnapshot);
      return { ok: true };
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].portfolios, []);
  assert.equal(Object.hasOwn(calls[0], "portfolioList"), false);
  assert.equal(calls[0].activePortfolioId, null);
  assert.deepEqual(calls[0].globalSettings, GLOBAL_SETTINGS);
  assert.deepEqual(result.portfolioList, []);
});

test("stale portfolios alias cannot resurrect the last deleted portfolio", async () => {
  const stalePortfolio = portfolio("qa-aipi-lifecycle", "AIPI");
  const snapshot = {
    schemaVersion: 3,
    portfolios: [stalePortfolio],
    portfolioList: [stalePortfolio],
    activePortfolioId: stalePortfolio.id,
    globalSettings: GLOBAL_SETTINGS,
    source: "browser-local-storage",
  };
  let serverPortfolios = [stalePortfolio];
  let archivedStaleCount = 0;
  let syncPayload = null;

  const result = await deletePortfolioWithServerSync({
    portfolioList: snapshot.portfolioList,
    portfolioId: stalePortfolio.id,
    snapshot,
    syncSnapshot: async (payload) => {
      syncPayload = payload;
      const canonical = normalizePortfolioPersistenceSnapshot(payload);
      if (canonical.portfolios.length === 0) {
        archivedStaleCount = serverPortfolios.length;
        serverPortfolios = [];
      }
      return {
        ok: true,
        archivedStaleCount,
        ...createPortfolioApiSnapshot(serverPortfolios),
      };
    },
  });

  assert.deepEqual(syncPayload.portfolios, []);
  assert.equal(Object.hasOwn(syncPayload, "portfolioList"), false);
  assert.equal(syncPayload.activePortfolioId, null);
  assert.deepEqual(syncPayload.globalSettings, GLOBAL_SETTINGS);
  assert.deepEqual(normalizePortfolioPersistenceSnapshot(syncPayload).portfolios, []);
  assert.equal(archivedStaleCount, 1);
  assert.deepEqual(createPortfolioApiSnapshot(serverPortfolios).portfolios, []);
  assert.deepEqual(result.portfolioList, []);
});

test("two to one deletion emits one canonical portfolio and preserves the next active id", async () => {
  const first = portfolio("first", "QQQ");
  const second = portfolio("second", "SPY");
  let syncPayload = null;

  const result = await deletePortfolioWithServerSync({
    portfolioList: [first, second],
    portfolioId: first.id,
    snapshot: {
      portfolios: [first, second],
      portfolioList: [first, second],
      activePortfolioId: first.id,
      globalSettings: GLOBAL_SETTINGS,
    },
    syncSnapshot: async (payload) => {
      syncPayload = payload;
      return { ok: true };
    },
  });

  assert.deepEqual(syncPayload.portfolios, [second]);
  assert.equal(Object.hasOwn(syncPayload, "portfolioList"), false);
  assert.equal(syncPayload.activePortfolioId, second.id);
  assert.deepEqual(result.portfolioList, [second]);
});

test("zero to zero repeated deletion remains an authoritative canonical empty snapshot", async () => {
  const calls = [];
  const result = await deletePortfolioWithServerSync({
    portfolioList: [],
    portfolioId: "already-deleted",
    snapshot: {
      portfolios: [],
      portfolioList: [],
      activePortfolioId: null,
      globalSettings: GLOBAL_SETTINGS,
    },
    syncSnapshot: async (payload) => {
      calls.push(payload);
      return { ok: true, archivedStaleCount: 0 };
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].portfolios, []);
  assert.equal(Object.hasOwn(calls[0], "portfolioList"), false);
  assert.equal(calls[0].activePortfolioId, null);
  assert.deepEqual(result.portfolioList, []);
});
