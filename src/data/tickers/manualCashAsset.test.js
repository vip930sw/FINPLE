import assert from "node:assert/strict";
import test from "node:test";

import {
  createManualCashAsset,
  createManualCashAssetPatch,
  hydrateManualCashAsset,
  hydratePersistedManualCashAsset,
  isLegacyPersistedManualCashAsset,
  isManualCashAsset,
  MANUAL_CASH_TOTAL_RETURN_PERCENT,
} from "./manualCashAsset.js";

test("manual CASH requires ticker and an internal source; market or legacy assetType identifies CASH", () => {
  for (const dataSource of [
    "preset-cash",
    "investment-mbti-cash",
    "manual-cash",
    "finple_manual_cash_reference",
  ]) {
    assert.equal(isManualCashAsset({ ticker: "CASH", market: "CASH", dataSource }), true);
  }
  assert.equal(isManualCashAsset({
    ticker: "CASH",
    market: "US",
    assetType: "CASH",
    dataSource: "manual-cash",
  }), true);
  assert.equal(isManualCashAsset({ ticker: "CASHX", market: "CASH", dataSource: "manual-cash" }), false);
  assert.equal(isManualCashAsset({ ticker: "CASH", market: "US", dataSource: "manual-cash" }), false);
  assert.equal(isManualCashAsset({ ticker: "CASH", market: "CASH", dataSource: "user-input" }), false);
});

test("manual CASH uses one fixed 2.0% nominal total-return path", () => {
  const cash = createManualCashAsset();
  assert.equal(MANUAL_CASH_TOTAL_RETURN_PERCENT, 2.0);
  assert.equal(cash.expectedCagr, 2.0);
  assert.equal(cash.cagr, 2.0);
  assert.equal(cash.selectedCagr, 2.0);
  assert.equal(cash.dividendYield, 0);
  assert.equal(cash.simulationCashYield, 0);
  assert.equal(cash.reinvestmentCashYield, 0);
});

test("manual CASH hydration preserves user values and replaces only the calculation contract", () => {
  const hydrated = hydrateManualCashAsset({
    ticker: "CASH",
    market: "CASH",
    dataSource: "preset-cash",
    id: "cash-id",
    name: "비상금",
    quantity: 7,
    price: 12345,
    targetWeight: 10,
    targetEvaluationAmount: 86415,
    createdAt: "2026-07-01T00:00:00.000Z",
    cagr: 2.5,
    dividendYield: 2,
  });

  assert.deepEqual(
    {
      id: hydrated.id,
      name: hydrated.name,
      quantity: hydrated.quantity,
      price: hydrated.price,
      targetWeight: hydrated.targetWeight,
      targetEvaluationAmount: hydrated.targetEvaluationAmount,
      createdAt: hydrated.createdAt,
    },
    {
      id: "cash-id",
      name: "비상금",
      quantity: 7,
      price: 12345,
      targetWeight: 10,
      targetEvaluationAmount: 86415,
      createdAt: "2026-07-01T00:00:00.000Z",
    },
  );
  assert.deepEqual(
    Object.fromEntries(Object.keys(createManualCashAssetPatch()).map((field) => [field, hydrated[field]])),
    createManualCashAssetPatch(),
  );
});

test("legacy persisted official CASH migrates while unknown user-input CASH stays fail-closed", () => {
  const legacyCash = {
    ticker: "CASH",
    market: "US",
    assetType: "ETF",
    dataSource: "manual",
    name: "현금 / 대기자금",
    price: 10000,
    quantity: 5,
    targetWeight: 10,
    targetEvaluationAmount: 50000,
    userNote: "preserve",
    shouldAutoLookup: false,
    cagr: 2.5,
    dividendYield: 2,
  };
  assert.equal(isLegacyPersistedManualCashAsset(legacyCash), true);
  const migrated = hydratePersistedManualCashAsset(legacyCash);
  assert.equal(migrated.market, "CASH");
  assert.equal(migrated.assetType, "CASH");
  assert.equal(migrated.cagr, 2.0);
  assert.equal(migrated.dividendYield, 0);
  assert.equal(migrated.userNote, "preserve");

  const unknownCash = {
    ...legacyCash,
    dataSource: "user-input",
  };
  assert.equal(isLegacyPersistedManualCashAsset(unknownCash), false);
  assert.equal(hydratePersistedManualCashAsset(unknownCash), unknownCash);
});
