import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP235A_TRADING_FEATURE_CONTRACT,
  buildStep235ATradingFeatureContract,
  getStep235ATradingFeatureContractSnapshot,
} from "./tradingAiMlTradingFeatureContract.js";

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "featureContractVersion",
  "mode",
  "inputContract",
  "featureDefinitions",
  "labelContract",
  "splitPolicy",
  "leakagePolicy",
  "usage",
];

test("Step235A feature contract exposes deterministic versioned schema", () => {
  const contract = buildStep235ATradingFeatureContract();

  assert.deepEqual(Object.keys(contract), EXPECTED_TOP_LEVEL_KEYS);
  assert.equal(contract.schemaVersion, "1.0.0");
  assert.equal(contract.featureContractVersion, "1.0.0");
  assert.equal(contract.mode, "offline_synthetic_feature_pilot");
  assert.deepEqual(contract.featureDefinitions.map((definition) => definition.name), STEP235A_TRADING_FEATURE_CONTRACT.featureNames);
  assert.equal(contract.inputContract.externalProviderAllowed, false);
  assert.equal(contract.inputContract.currentTimeAllowed, false);
  assert.equal(contract.inputContract.randomAllowed, false);
});

test("Step235A feature definitions forbid future data and label windows", () => {
  const contract = buildStep235ATradingFeatureContract();

  for (const definition of contract.featureDefinitions) {
    assert.equal(definition.sourceWindowEndPolicy, "feature_window_end_lte_featureTimestamp");
    assert.equal(definition.usesFutureData, false);
    assert.equal(definition.usesLabelWindow, false);
  }
  assert.equal(contract.leakagePolicy.featureWindowEndLteFeatureTimestamp, true);
  assert.equal(contract.leakagePolicy.featureTimestampBeforeLabelWindowStart, true);
  assert.equal(contract.leakagePolicy.futureReturnInFeaturesAllowed, false);
  assert.equal(contract.leakagePolicy.normalizationMode, "none");
  assert.equal(contract.leakagePolicy.fullDatasetFitAllowed, false);
});

test("Step235A label contract is research-only and not an order instruction", () => {
  const contract = buildStep235ATradingFeatureContract();

  assert.equal(contract.labelContract.purpose, "research_validation_only");
  assert.equal(contract.labelContract.labelPolicyVersion, "1.0.0");
  assert.deepEqual(contract.labelContract.fields, [
    "forwardReturn1m",
    "labelTimestamp",
    "labelWindowStart",
    "labelWindowEnd",
    "labelClass",
  ]);
  assert.deepEqual(contract.labelContract.classPolicy, {
    positiveGte: 0.02,
    negativeLte: -0.02,
    neutralOtherwise: true,
  });
  assert.equal(contract.labelContract.investmentInstructionAllowed, false);
  assert.equal(contract.labelContract.orderInstructionAllowed, false);
});

test("Step235A usage flags keep training provider order and live paths closed", () => {
  const contract = buildStep235ATradingFeatureContract();

  assert.deepEqual(Object.keys(contract.usage), STEP235A_TRADING_FEATURE_CONTRACT.usageKeys);
  assert.deepEqual(contract.usage, {
    modelTrainingAllowed: false,
    backtestClaimAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
  });
});

test("Step235A contract is deterministic and mutation resistant", () => {
  const first = getStep235ATradingFeatureContractSnapshot();
  const second = getStep235ATradingFeatureContractSnapshot();

  assert.deepEqual(first, second);
  assert.throws(() => {
    first.usage.modelTrainingAllowed = true;
  }, /Cannot assign/);
  assert.deepEqual(getStep235ATradingFeatureContractSnapshot(), second);
});
