import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("provider policy selects a bounded purchase-blocked source hierarchy", async () => {
  const code = await source("server/src/services/tradingScalpingHistoricalDataIntake.js");
  assert.match(code, /primaryCandidate/);
  assert.match(code, /providerId: "databento"/);
  assert.match(code, /datasetId: "EQUS\.MINI"/);
  assert.match(code, /requiredSchemas: \["ohlcv-1m", "bbo-1m"\]/);
  assert.match(code, /purchaseAuthorized: false/);
  assert.match(code, /providerCallsAllowed: false/);
});

test("license receipt is immutable, internal-only, and excludes redistribution", async () => {
  const code = await source("server/src/services/tradingScalpingHistoricalDataIntake.js");
  assert.match(code, /internal_non_display_research/);
  assert.match(code, /private_admin_only/);
  assert.match(code, /no_external_redistribution/);
  assert.match(code, /license_receipt_checksum_mismatch/);
  assert.doesNotMatch(code, /creditCard|cardNumber|accountNumber|apiSecret/i);
});

test("raw intake enforces quotes, regular session, uniqueness, and no forward fill", async () => {
  const code = await source("server/src/services/tradingScalpingHistoricalDataIntake.js");
  assert.match(code, /regular_session_required/);
  assert.match(code, /quote_invalid/);
  assert.match(code, /duplicate_row/);
  assert.match(code, /planned_symbols_missing/);
  assert.match(code, /forwardFillUsed: false/);
  assert.match(code, /rawDataChecksum/);
});

test("intake cannot approve models, register runtime, call providers, or submit orders", async () => {
  const code = await source("server/src/services/tradingScalpingHistoricalDataIntake.js");
  assert.match(code, /automaticModelApprovalAllowed: false/);
  assert.match(code, /runtimeRegistrationAllowed: false/);
  assert.match(code, /externalDownloadPerformed: false/);
  assert.match(code, /orderSubmissionAllowed: false/);
  assert.doesNotMatch(code, /fetch\(|axios|undici|submitOrder|placeOrder|registerScalpingModelSignalProvider/);
});

test("documentation preserves purchase and Production boundaries", async () => {
  const doc = await source("docs/trading/FINPLE_SCALPING_HISTORICAL_DATA_INTAKE_TSC4H_2026_08_05.md");
  assert.match(doc, /no purchase, download, KIS activation, model approval, or order capability/);
  assert.match(doc, /purchaseAuthorized = false/);
  assert.match(doc, /internal_non_display_research/);
  assert.match(doc, /readyForRuntime = false/);
  assert.match(doc, /explicitly approve a bounded purchase/);
});
