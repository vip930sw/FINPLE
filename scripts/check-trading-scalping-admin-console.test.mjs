import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Admin Console mounts the dedicated scalping dashboard without touching public routes", async () => {
  const group = await read("src/components/TradingAiMlPanelGroup.jsx");
  const panel = await read("src/components/TradingScalpingAdminPanel.jsx");
  assert.match(group, /import TradingScalpingAdminPanel/);
  assert.match(group, /groupKey === "ai-ml-milestone-overview"/);
  assert.match(group, /<TradingScalpingAdminPanel \/>/);
  assert.match(panel, /레버리지 ETF 스캘핑 전략/);
  assert.match(panel, /목표수익률은 수익 보장이 아니라 Shadow\/Live 승격 심사 기준/);
  assert.doesNotMatch(panel, /\/simulator|\/pricing|\/mypage/);
});

test("Admin scalping API is admin-only, draft-only, and mounted before the legacy readiness router", async () => {
  const route = await read("server/src/routes/adminTradingScalpingRoutes.js");
  const index = await read("server/src/index.js");
  assert.match(route, /requireAdminAccess/);
  assert.match(route, /router\.get\("\/scalping-dashboard"/);
  assert.match(route, /router\.put\("\/scalping-strategy-draft"/);
  assert.match(route, /appliesToTradingRuntime: false/);
  assert.match(route, /orderSubmissionAllowed: false/);
  const newMount = index.indexOf("adminTradingScalpingRoutes");
  const legacyMount = index.lastIndexOf("adminTradingReadinessRoutes");
  assert.ok(newMount >= 0);
  assert.ok(legacyMount > newMount);
  assert.doesNotMatch(route, /KIS_TRADING_APP_SECRET|appSecret|submitOrder|placeOrder|orderAdapter/);
  assert.doesNotMatch(route, /router\.(post|patch|delete)\(/);
});

test("Dashboard contract exposes real TSC-1 controls and keeps missing performance null", async () => {
  const service = await read("server/src/services/tradingScalpingAdminDashboard.js");
  assert.match(service, /DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG/);
  assert.match(service, /DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE/);
  assert.match(service, /process_memory_draft/);
  assert.match(service, /survivesProcessRestart: false/);
  assert.match(service, /appliesToTradingRuntime: false/);
  assert.match(service, /unavailable_no_persisted_replay_or_shadow_snapshot/);
  assert.match(service, /netPnl: null/);
  assert.match(service, /research_acceptance_threshold_not_return_guarantee/);
});

test("Dashboard includes strategy, objective, KPI, chart, trade, and breakdown surfaces", async () => {
  const panel = await read("src/components/TradingScalpingAdminPanel.jsx");
  for (const required of [
    "STRATEGY_FIELDS",
    "OBJECTIVE_FIELDS",
    "metricCards",
    "LineChart",
    "DailyPnlChart",
    "ObjectiveTable",
    "최근 완결 거래",
    "종목별 성과",
  ]) {
    assert.match(panel, new RegExp(required));
  }
  assert.match(panel, /TQQQ/);
  assert.match(panel, /SQQQ/);
  assert.match(panel, /SOXL/);
  assert.match(panel, /SOXS/);
  assert.match(panel, /UPRO/);
  assert.match(panel, /SPXU/);
  assert.match(panel, /TNA/);
  assert.match(panel, /TZA/);
});
