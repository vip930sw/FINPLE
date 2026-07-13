import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP236C_COST_POLICY_CONTRACT,
  STEP236C_SYNTHETIC_COST_POLICY,
  buildStep236CCostModel,
  validateStep236CCostModel,
  validateStep236CCostPolicy,
} from "./tradingAiMlBacktestCostPolicy.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("Step236C cost model exposes exact synthetic research schema", () => {
  const model = buildStep236CCostModel();

  assert.deepEqual(Object.keys(model), STEP236C_COST_POLICY_CONTRACT.costModelKeys);
  assert.deepEqual(model, {
    version: "1.0.0",
    mode: "synthetic_research_cost_model",
    commissionBps: 5,
    slippageBps: 5,
    taxBps: 0,
    actualMarketCostClaimed: false,
  });
});

test("Step236C cost policy is deterministic and mutation resistant", () => {
  const input = clone(STEP236C_SYNTHETIC_COST_POLICY);
  const before = JSON.stringify(input);
  const first = buildStep236CCostModel(input);
  const second = buildStep236CCostModel(input);

  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(first, second);
  assert.throws(() => {
    first.actualMarketCostClaimed = true;
  }, /Cannot assign/);
});

test("Step236C cost policy rejects unsupported versions costs and permissions", () => {
  assert.throws(() => buildStep236CCostModel({ version: "9.9.9" }), /unknown cost model version/);
  assert.throws(() => buildStep236CCostModel({ commissionBps: -1 }), /commissionBps cannot be negative/);
  assert.throws(() => buildStep236CCostModel({ slippageBps: -1 }), /slippageBps cannot be negative/);
  assert.throws(() => buildStep236CCostModel({ taxBps: -1 }), /taxBps cannot be negative/);
  assert.throws(() => validateStep236CCostPolicy({ ...STEP236C_SYNTHETIC_COST_POLICY, fixedFeeUsed: true }), /fixed fee/);
  assert.throws(() => validateStep236CCostPolicy({ ...STEP236C_SYNTHETIC_COST_POLICY, leverageAllowed: true }), /leverage/);
  assert.throws(() => validateStep236CCostPolicy({ ...STEP236C_SYNTHETIC_COST_POLICY, shortExposureAllowed: true }), /short exposure/);
  assert.throws(() => buildStep236CCostModel({ actualMarketCostClaimed: true }), /actual market cost claim/);
});

test("Step236C public cost model validator rejects missing keys", () => {
  const model = clone(buildStep236CCostModel());
  delete model.taxBps;
  assert.throws(() => validateStep236CCostModel(model), /key set mismatch/);
});
