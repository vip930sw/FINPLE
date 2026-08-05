import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("calendar is explicit, early-close aware, and fail-closed outside supported years", async () => {
  const calendar = await source("server/src/services/tradingUsEquityMarketCalendar.js");
  assert.match(calendar, /nyse-equity-calendar-2026-2028-v1/);
  assert.match(calendar, /2026-11-27/);
  assert.match(calendar, /2026-12-24/);
  assert.match(calendar, /US_EQUITY_EARLY_CLOSE_MINUTE/);
  assert.match(calendar, /calendar_year_not_supported/);
  assert.match(calendar, /UNSUPPORTED_CALENDAR/);
});

test("watchdog trips on heartbeat, cycle, approval, and quality thresholds", async () => {
  const guard = await source("server/src/services/tradingKisFeedOperationalGuard.js");
  assert.match(guard, /provider_heartbeat_stale/);
  assert.match(guard, /completed_cycle_stale/);
  assert.match(guard, /read_only_approval_expired/);
  assert.match(guard, /protocol_issue_rate_exceeded/);
  assert.match(guard, /stale_quote_rate_exceeded/);
  assert.match(guard, /incomplete_cycle_rate_exceeded/);
  assert.match(guard, /automaticRestartAllowed: false/);
  assert.match(guard, /orderSubmissionAllowed: false/);
});

test("supervisor stops only the market-data runner and requires manual recovery", async () => {
  const supervisor = await source("server/src/services/tradingKisFeedOperationalSupervisor.js");
  assert.match(supervisor, /runner\.stop\(stoppedReason\)/);
  assert.match(supervisor, /manualResumeRequired: true/);
  assert.match(supervisor, /automaticResumeAllowed: false/);
  assert.match(supervisor, /KIS_FEED_MARKET_SESSION_CLOSED/);
  assert.doesNotMatch(supervisor, /submitOrder|cancelOrder|modifyOrder/);
});

test("checkpoint schema and repository store sanitized operational state only", async () => {
  const migration = await source("server/migrations/20260805_trading_kis_shadow_feed_checkpoints.sql");
  const repository = await source("server/src/db/tradingKisFeedCheckpointRepository.js");
  assert.match(migration, /trading_kis_shadow_feed_checkpoints/);
  assert.match(migration, /runner_state JSONB/);
  assert.match(migration, /guard_state JSONB/);
  assert.match(migration, /manual_resume_required BOOLEAN NOT NULL DEFAULT TRUE/);
  assert.doesNotMatch(migration, /app_secret|access_token|account_number|raw_payload/i);
  assert.match(repository, /SENSITIVE_KEY_PATTERN/);
  assert.match(repository, /credentialsPersisted|credential/i);
  assert.match(repository, /manualResumeRequired/);
});

test("completed bars enforce the exchange calendar before Shadow ingestion", async () => {
  const runner = await source("server/src/services/tradingKisCompletedBarFeedRunner.js");
  assert.match(runner, /getUsEquityMarketSession/);
  assert.match(runner, /unsupportedCalendarBarCount/);
  assert.match(runner, /session\.name !== "REGULAR"/);
  assert.match(runner, /forwardFillUsed: false/);
});

test("runtime exposes operations and recovery without adding account or order routes", async () => {
  const runtime = await source("server/src/services/tradingKisShadowFeedRuntimeService.js");
  const routes = await source("server/src/routes/adminTradingScalpingRoutes.js");
  assert.match(runtime, /createKisFeedOperationalSupervisor/);
  assert.match(runtime, /readKisFeedRecoveryState/);
  assert.match(runtime, /automaticRestartAllowed: false/);
  assert.match(routes, /scalping-shadow-feed\/start/);
  assert.match(routes, /scalping-shadow-feed\/stop/);
  assert.doesNotMatch(routes, /scalping-shadow-feed\/(cycle|order|account|balance|cancel|modify)/);
});

test("private Admin Console mounts the operational watchdog panel", async () => {
  const panel = await source("src/components/TradingScalpingKisOpsPanel.jsx");
  const group = await source("src/components/TradingAiMlPanelGroup.jsx");
  assert.match(panel, /KIS Feed 운영 감시·복구/);
  assert.match(panel, /Circuit breaker/);
  assert.match(panel, /자동 복구 금지/);
  assert.match(group, /TradingScalpingKisOpsPanel/);
});
