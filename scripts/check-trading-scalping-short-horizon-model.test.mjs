import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("feature contract is point-in-time and excludes future labels", async () => {
  const model = await source("server/src/services/tradingScalpingShortHorizonModel.js");
  assert.match(model, /SCALPING_SHORT_HORIZON_FEATURE_CONTRACT_VERSION/);
  assert.match(model, /usesOnlyBarsAtOrBeforePrediction: true/);
  assert.match(model, /futureLabelUsedAsFeature: false/);
  assert.match(model, /labelEnd/);
  assert.match(model, /dataCutoff/);
});

test("dataset and training remain chronological with train-only scaling", async () => {
  const model = await source("server/src/services/tradingScalpingShortHorizonModel.js");
  assert.match(model, /randomSplitAllowed: false/);
  assert.match(model, /fitScope: "train_only"/);
  assert.match(model, /embargoSessions/);
  assert.match(model, /splitChronologically/);
  assert.doesNotMatch(model, /Math\.random|shuffle\s*\(/);
});

test("artifact is research-only and cannot self-approve or register", async () => {
  const model = await source("server/src/services/tradingScalpingShortHorizonModel.js");
  assert.match(model, /researchOnly: true/);
  assert.match(model, /runtimeApproved: false/);
  assert.match(model, /automaticApprovalAllowed: false/);
  assert.match(model, /runtimeRegistrationAllowed: false/);
  assert.match(model, /orderSubmissionAllowed: false/);
  assert.match(model, /liveActivationAllowed: false/);
});

test("immutable fixtures reuse the typed TSC-4F signal contract", async () => {
  const model = await source("server/src/services/tradingScalpingShortHorizonModel.js");
  assert.match(model, /scalping-model-signal-v1/);
  assert.match(model, /scalping-model-signal-replay-fixture-v1/);
  assert.match(model, /fixtureChecksum/);
  assert.match(model, /immutable: true/);
  assert.match(model, /modelChecksum/);
});

test("research pipeline performs no provider, environment, database, or order operation", async () => {
  const model = await source("server/src/services/tradingScalpingShortHorizonModel.js");
  assert.doesNotMatch(model, /fetch\s*\(|WebSocket|process\.env|DATABASE_URL|databaseQuery|submitOrder|cancelOrder|modifyOrder|placeOrder/);
  assert.match(model, /externalDataDownloadPerformed: false/);
  assert.match(model, /datasetPersisted: false/);
});

test("existing general AI ML dataset architecture remains design-only", async () => {
  const architecture = await source("server/src/services/tradingAiMlDatasetArchitecture.js");
  assert.match(architecture, /status: "design_only"/);
  assert.match(architecture, /modelTrainingAllowed: false/);
  assert.match(architecture, /modelArtifactCreationAllowed: false/);
});
