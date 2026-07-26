import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  createPortfolioApiSnapshot,
  encodeEmptyPortfolioPersistenceSnapshot,
  hydratePortfolioPersistenceRow,
} from "../services/portfolioPersistenceModel.js";

test("account portfolio route accepts empty sync and returns the versioned GET envelope", () => {
  const source = fs.readFileSync("server/src/routes/portfolioDbRoutes.js", "utf8");
  assert.match(source, /archiveAllPortfoliosWithSnapshot/);
  assert.match(source, /portfolioList\.length === 0/);
  assert.match(source, /activePortfolioId:\s*null/);
  assert.match(source, /portfolios:\s*\[\]/);
  assert.match(source, /createPortfolioApiSnapshot/);
  assert.match(source, /router\.delete\("\/:portfolioId"/);
  assert.match(source, /syncedPortfolioIds\.size > 0 && syncErrorCount === 0/);
});

test("empty archived persistence marker hydrates an empty API snapshot", () => {
  const description = encodeEmptyPortfolioPersistenceSnapshot({
    globalSettings: {
      startValue: 73500000,
      monthlyCashFlow: 1350000,
      years: 17,
      inflationRate: 3.1,
      dividendReinvest: false,
    },
  });
  const marker = hydratePortfolioPersistenceRow({ description }, []);
  const snapshot = createPortfolioApiSnapshot([], marker.__persistenceEnvelope);

  assert.deepEqual(snapshot.portfolios, []);
  assert.equal(snapshot.activePortfolioId, null);
  assert.equal(snapshot.globalSettings.startValue, 73500000);
});

test("individual DELETE is idempotent for already archived records", () => {
  const repository = fs.readFileSync("server/src/db/portfolioRepository.js", "utf8");
  assert.match(repository, /is_archived = TRUE/);
  assert.match(repository, /alreadyDeleted:\s*true/);
});
