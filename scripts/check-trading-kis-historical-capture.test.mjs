import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Databento acquisition code and workflow are removed", async () => {
  const doc = await source("docs/trading/FINPLE_KIS_HISTORICAL_CAPTURE_TSC4H2_2026_08_05.md");
  const service = await source("server/src/services/tradingKisHistoricalCapture.js");
  assert.match(doc, /Databento path is retired/);
  assert.doesNotMatch(service, /databento|EQUS\.MINI|massive|alpaca/i);
});

test("capture is KIS-only, market-data-only, and has no order capability", async () => {
  const runtime = await source("server/src/services/tradingKisHistoricalCaptureRuntimeService.js");
  const runner = await source("server/src/services/tradingKisHistoricalCaptureRunner.js");
  assert.match(runtime, /KIS_TRADING_APP_KEY/);
  assert.match(runner, /createKisOverseasRealtimeFeed/);
  assert.match(runner, /captureOnly: true/);
  assert.match(runtime, /orderSubmissionAllowed: false/);
  assert.doesNotMatch(runtime, /submitOrder|placeOrder|cancelOrder|accountBalance|positionQuery/);
});

test("durable migration stores normalized minutes and sealed revisions only", async () => {
  const migration = await source("server/migrations/20260805_trading_kis_historical_capture.sql");
  assert.match(migration, /trading_kis_market_data_minutes/);
  assert.match(migration, /trading_kis_market_data_revisions/);
  assert.match(migration, /row_checksum/);
  assert.doesNotMatch(migration, /raw_payload|approval_key|app_secret|account_id/i);
});

test("capture preserves no-forward-fill and manual model approval boundaries", async () => {
  const service = await source("server/src/services/tradingKisHistoricalCapture.js");
  assert.match(service, /forwardFillUsed: false/);
  assert.match(service, /automaticModelApprovalAllowed: false/);
  assert.match(service, /runtimeRegistrationAllowed: false/);
  assert.match(service, /readyForRuntime: false/);
});

test("admin provides a persistent operations quick navigation with KIS capture first", async () => {
  const panel = await source("src/components/TradingAiMlPanelGroup.jsx");
  const styles = await source("src/components/TradingScalpingRegistryPanel.css");
  assert.match(panel, /실시간 운영 바로가기/);
  assert.match(panel, /href: "#trading-scalping-kis-capture"/);
  assert.match(panel, /id="trading-scalping-kis-capture"/);
  assert.match(panel, /id="trading-scalping-kis-operations"/);
  assert.match(panel, /id="trading-scalping-model-signal"/);
  assert.match(panel, /id="trading-scalping-shadow"/);
  assert.match(panel, /id="trading-scalping-strategy"/);
  assert.ok(panel.indexOf("<TradingScalpingKisCapturePanel />") < panel.indexOf("<TradingScalpingKisOpsPanel />"));
  assert.equal((panel.match(/<TradingScalpingKisCapturePanel \/>/g) || []).length, 1);
  assert.match(styles, /\.scalpingAdminQuickNav\s*\{[\s\S]*position:\s*fixed/);
  assert.match(styles, /scroll-margin-top/);
});
