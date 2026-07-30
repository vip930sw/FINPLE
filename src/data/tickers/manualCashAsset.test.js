import assert from "node:assert/strict";
import test from "node:test";

import {
  createManualCashAssetPatch,
  hydrateManualCashAsset,
  isManualCashAsset,
} from "./manualCashAsset.js";

test("manual CASH recognition requires the exact identity and an allowed internal source", () => {
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
