import assert from "node:assert/strict";
import test from "node:test";

import {
  applyPaperFill,
  createPaperLedger,
  markToMarketPaperLedger,
  simulatePaperFill,
} from "./tradingPaperLedger.js";

test("creates a normalized paper ledger without provider access", () => {
  const ledger = createPaperLedger(1000, [{ symbol: "spy", quantity: 1.23456789, averageCost: 400.123 }]);

  assert.equal(ledger.cash, 1000);
  assert.equal(ledger.positions.SPY.symbol, "SPY");
  assert.equal(ledger.positions.SPY.quantity, 1.234568);
  assert.deepEqual(ledger.events, []);
});

test("simulates fills without order submission or provider calls", () => {
  const result = simulatePaperFill(
    { symbol: "spy", side: "buy", quantity: 2, estimatedPrice: 400, estimatedFxRate: 1 },
    { fee: 1.25, tax: 0 },
  );

  assert.equal(result.valid, true);
  assert.equal(result.fill.symbol, "SPY");
  assert.equal(result.fill.totalCost, 801.25);
  assert.equal(result.fill.simulated, true);
  assert.equal(result.fill.providerCallsAllowed, false);
  assert.equal(result.fill.orderSubmissionAllowed, false);
});

test("applies buy fills to cash and weighted average cost", () => {
  const ledger = createPaperLedger(2000, [{ symbol: "SPY", quantity: 1, averageCost: 390 }]);
  const fill = simulatePaperFill(
    { symbol: "SPY", side: "buy", quantity: 2, estimatedPrice: 400, estimatedFxRate: 1 },
    { fee: 1, tax: 0 },
  ).fill;

  const result = applyPaperFill(ledger, fill);

  assert.equal(result.applied, true);
  assert.equal(result.ledger.cash, 1199);
  assert.equal(result.ledger.positions.SPY.quantity, 3);
  assert.equal(result.ledger.positions.SPY.averageCost, 397);
  assert.equal(result.ledger.events.length, 1);
});

test("rejects buy fills when cash is insufficient", () => {
  const ledger = createPaperLedger(100);
  const fill = simulatePaperFill({ symbol: "SPY", side: "buy", quantity: 1, estimatedPrice: 400 }).fill;

  const result = applyPaperFill(ledger, fill);

  assert.equal(result.applied, false);
  assert.deepEqual(result.reasons, ["insufficient_cash"]);
  assert.equal(result.ledger.cash, 100);
});

test("applies sell fills, preserves average cost, and records realized pnl", () => {
  const ledger = createPaperLedger(100, [{ symbol: "SPY", quantity: 3, averageCost: 397 }]);
  const fill = simulatePaperFill(
    { symbol: "SPY", side: "sell", quantity: 1, estimatedPrice: 410, estimatedFxRate: 1 },
    { fee: 1, tax: 0.5 },
  ).fill;

  const result = applyPaperFill(ledger, fill);

  assert.equal(result.applied, true);
  assert.equal(result.ledger.cash, 508.5);
  assert.equal(result.ledger.positions.SPY.quantity, 2);
  assert.equal(result.ledger.positions.SPY.averageCost, 397);
  assert.equal(result.ledger.positions.SPY.realizedPnl, 11.5);
  assert.equal(result.ledger.events[0].realizedPnlChange, 11.5);
  assert.equal(result.ledger.events[0].realizedPnlAfter, 11.5);
});

test("rejects sell fills when position quantity is insufficient", () => {
  const ledger = createPaperLedger(100, [{ symbol: "SPY", quantity: 1, averageCost: 397 }]);
  const fill = simulatePaperFill({ symbol: "SPY", side: "sell", quantity: 2, estimatedPrice: 410 }).fill;

  const result = applyPaperFill(ledger, fill);

  assert.equal(result.applied, false);
  assert.deepEqual(result.reasons, ["insufficient_position_quantity"]);
  assert.equal(result.ledger.positions.SPY.quantity, 1);
});

test("removes closed positions after full sell", () => {
  const ledger = createPaperLedger(100, [{ symbol: "SPY", quantity: 1, averageCost: 397 }]);
  const fill = simulatePaperFill({ symbol: "SPY", side: "sell", quantity: 1, estimatedPrice: 410 }).fill;

  const result = applyPaperFill(ledger, fill);

  assert.equal(result.applied, true);
  assert.equal(result.ledger.cash, 510);
  assert.equal(result.ledger.positions.SPY, undefined);
  assert.equal(result.ledger.events[0].realizedPnlChange, 13);
  assert.equal(result.ledger.events[0].realizedPnlAfter, 13);
});

test("marks paper ledger to market without fetching prices", () => {
  const ledger = createPaperLedger(100, [
    { symbol: "SPY", quantity: 2, averageCost: 397 },
    { symbol: "QQQ", quantity: 1, averageCost: 300 },
  ]);

  const result = markToMarketPaperLedger(ledger, { SPY: 410 });

  assert.equal(result.providerCallsAllowed, false);
  assert.equal(result.positions.SPY.marketValue, 820);
  assert.equal(result.positions.SPY.unrealizedPnl, 26);
  assert.equal(result.positions.QQQ.marketValue, null);
  assert.deepEqual(result.missingPrices, ["QQQ"]);
  assert.equal(result.totalEquity, null);
});
