import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("read-only approval gate requires scoped, expiring, revocable evidence", async () => {
  const source = await read("server/src/services/tradingKisReadOnlyApproval.js");
  for (const token of [
    "trading_read_only_market_data",
    "virtual_shadow",
    "production_live",
    "openapivts.koreainvestment.com:29443",
    "openapi.koreainvestment.com:9443",
    "FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT",
    "KIS_TRADING_BASE_URL",
    "credentialEnvironment",
    "baseUrlEnvironment",
    "environmentCredentialMatch",
    "environmentBaseUrlMatch",
    "current_quotes",
    "market_session_state",
    "provider_rate_limit_state",
    "order_submission",
    "raw_provider_response_persistence",
    "explicit_admin_start_required",
    "approval_expired",
  ]) {
    assert.match(source, new RegExp(token));
  }
  assert.match(source, /valuesExposed: false/);
  assert.match(source, /valuesPersisted: false/);
  assert.match(source, /accountCallsAllowed: false/);
  assert.match(source, /orderSubmissionAllowed: false/);
});

test("completed-bar runner composes KIS feed, minute aggregation, and internal Shadow ingestion", async () => {
  const source = await read("server/src/services/tradingKisCompletedBarFeedRunner.js");
  const calendar = await read("server/src/services/tradingUsEquityMarketCalendar.js");
  assert.match(source, /createKisOverseasRealtimeFeed/);
  assert.match(source, /createOneMinuteMarketAggregator/);
  assert.match(source, /ingestShadowCycle/);
  assert.match(source, /getUsEquityMarketSession/);
  assert.match(calendar, /America\/New_York/);
  assert.match(source, /missingSymbols/);
  assert.match(source, /forwardFilled: false/);
  assert.match(source, /rawProviderPayloadStored: false/);
  assert.match(source, /brokerOrderAdapterPresent: false/);
  assert.doesNotMatch(source, /submitOrder\s*\(|placeOrder\s*\(|cancelOrder\s*\(|modifyOrder\s*\(/);
});

test("admin API exposes only status, start, and stop for the KIS feed", async () => {
  const route = await read("server/src/routes/adminTradingScalpingRoutes.js");
  assert.match(route, /router\.get\("\/scalping-shadow-feed"/);
  assert.match(route, /router\.post\("\/scalping-shadow-feed\/start"/);
  assert.match(route, /router\.post\("\/scalping-shadow-feed\/stop"/);
  assert.match(route, /KIS_SHADOW_FEED_ACTIVE/);
  assert.doesNotMatch(route, /scalping-shadow-feed\/cycle/);
  assert.doesNotMatch(route, /scalping-shadow-feed\/(order|account|balance|position|cancel|modify)/);
  assert.doesNotMatch(route, /request\.body\?\.receipt|request\.body\.receipt/);
});

test("Admin Console shows approval, credential, completeness, and safety states", async () => {
  const panel = await read("src/components/TradingScalpingShadowPanel.jsx");
  const api = await read("src/components/tradingScalpingAdminApi.js");
  const group = await read("src/components/TradingAiMlPanelGroup.jsx");
  assert.match(panel, /KIS 읽기전용 Completed-Bar Feed/);
  assert.match(panel, /읽기전용 승인/);
  assert.match(panel, /KIS 자격증명/);
  assert.match(panel, /불완전 Cycle/);
  assert.match(panel, /Feed 먼저 정지/);
  assert.match(api, /fetchTradingScalpingKisFeedStatus/);
  assert.match(api, /startTradingScalpingKisFeed/);
  assert.match(api, /stopTradingScalpingKisFeed/);
  assert.match(group, /TradingScalpingKisFeedPanel\.css/);
  assert.doesNotMatch(panel, /KIS_TRADING_APP_KEY|KIS_TRADING_APP_SECRET/);
});

test("feed runtime requires an active approved Shadow run and keeps provider scope separate from orders", async () => {
  const source = await read("server/src/services/tradingKisShadowFeedRuntimeService.js");
  assert.match(source, /ACTIVE_SHADOW_RUN_REQUIRED/);
  assert.match(source, /APPROVED_SHADOW_STRATEGY_REQUIRED/);
  assert.match(source, /KIS_SHADOW_FEED_APPROVAL_BLOCKED/);
  assert.match(source, /accountCallsAllowed: false/);
  assert.match(source, /brokerOrderAdapterPresent: false/);
  assert.match(source, /orderSubmissionAllowed: false/);
  assert.match(source, /credentialsExposed: false/);
  assert.match(source, /credentialsPersisted: false/);
});
