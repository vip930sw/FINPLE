import assert from "node:assert/strict";
import test from "node:test";

import {
  canCreatePortfolio,
  deletePortfolioState,
  deletePortfolioWithServerSync,
} from "./portfolioLifecycle.js";

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
    snapshot: { globalSettings: { startValue: 73500000 } },
    syncSnapshot: async (nextSnapshot) => {
      calls.push(nextSnapshot);
      return { ok: true };
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].portfolioList, []);
  assert.equal(calls[0].activePortfolioId, null);
  assert.deepEqual(result.portfolioList, []);
});
