import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Admin Console mounts the private Shadow panel only inside the Trading Lab", async () => {
  const group = await read("src/components/TradingAiMlPanelGroup.jsx");
  const panel = await read("src/components/TradingScalpingShadowPanel.jsx");
  assert.match(group, /import TradingScalpingShadowPanel/);
  assert.match(group, /<TradingScalpingShadowPanel \/>/);
  assert.match(panel, /Private Shadow Runtime/);
  assert.match(panel, /가상 초기자산/);
  assert.match(panel, /Shadow 승격 게이트/);
  assert.doesNotMatch(panel, /\/simulator|\/pricing|\/mypage/);
});

test("Admin routes expose status, start, and stop but no market-data ingestion or order route", async () => {
  const route = await read("server/src/routes/adminTradingScalpingRoutes.js");
  assert.match(route, /router\.get\("\/scalping-shadow"/);
  assert.match(route, /router\.post\("\/scalping-shadow\/start"/);
  assert.match(route, /router\.post\("\/scalping-shadow\/stop"/);
  assert.doesNotMatch(route, /scalping-shadow\/cycle|ingestScalpingShadowCycle/);
  assert.doesNotMatch(route, /submitOrder|placeOrder|orderAdapter|KIS_TRADING_APP_SECRET/);
});

test("Shadow worker is virtual-only and uses the existing strategy, coordinator, and fill model", async () => {
  const worker = await read("server/src/services/tradingLeveragedEtfShadowWorker.js");
  assert.match(worker, /buildLeveragedEtfScalpingDecision/);
  assert.match(worker, /coordinateLeveragedEtfScalpingDecisions/);
  assert.match(worker, /simulateMarketableLimitFill/);
  assert.match(worker, /assessScalpingShadowPromotion/);
  assert.match(worker, /brokerOrderAdapterPresent: false/);
  assert.match(worker, /orderSubmissionAllowed: false/);
  assert.doesNotMatch(worker, /fetch\(|WebSocket|axios|appSecret|accountNumber/);
});

test("Promotion contract treats 20-session 3 percent as stretch target and requires longer evidence", async () => {
  const policy = await read("server/src/services/tradingScalpingPromotionPolicy.js");
  assert.match(policy, /minimumObservationSessions: 60/);
  assert.match(policy, /minimumCompletedTrades: 100/);
  assert.match(policy, /rollingWindowCount: 3/);
  assert.match(policy, /referenceTargetNetReturnPct: 3/);
  assert.match(policy, /stretch_target_not_live_promotion_requirement/);
  assert.match(policy, /automaticLiveActivationAllowed: false/);
});

test("Shadow migration is additive and stores sanitized JSON snapshots only", async () => {
  const migration = await read("server/migrations/20260805_trading_shadow_runtime.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trading_shadow_runs/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trading_shadow_snapshots/);
  assert.match(migration, /promotion_assessment JSONB/);
  assert.match(migration, /snapshot_checksum TEXT NOT NULL/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/);
  assert.doesNotMatch(migration, /app_key|app_secret|account_id|raw_payload/i);
});

test("Runtime cycle ingestion remains an internal service contract", async () => {
  const runtime = await read("server/src/services/tradingScalpingShadowRuntimeService.js");
  assert.match(runtime, /export async function ingestScalpingShadowCycle/);
  assert.match(runtime, /APPROVED_SCALPING_VERSION_REQUIRED/);
  assert.match(runtime, /providerConnectionStarted: false/);
  assert.match(runtime, /brokerOrderAdapterPresent: false/);
  assert.match(runtime, /orderSubmissionAllowed: false/);
});
