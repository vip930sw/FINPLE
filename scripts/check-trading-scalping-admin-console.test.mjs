import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Admin Console mounts the dedicated multi-asset scalping dashboard without public exposure", async () => {
  const group = await read("src/components/TradingAiMlPanelGroup.jsx");
  const panel = await read("src/components/TradingScalpingAdminPanel.jsx");
  assert.match(group, /import TradingScalpingAdminPanel/);
  assert.match(group, /TradingScalpingRegistryPanel\.css/);
  assert.match(group, /groupKey === "ai-ml-milestone-overview"/);
  assert.match(group, /<TradingScalpingAdminPanel \/>/);
  assert.match(panel, /레버리지 ETF 스캘핑 전략/);
  assert.match(panel, /거래대상 복수 선택/);
  assert.match(panel, /계좌 단위 다자산 한도/);
  assert.match(panel, /목표수익률은 수익 보장이 아니라 Shadow\/Live 승격 심사 기준/);
  assert.doesNotMatch(panel, /\/simulator|\/pricing|\/mypage/);
});

test("Admin registry API stays admin-only and never exposes an order route", async () => {
  const route = await read("server/src/routes/adminTradingScalpingRoutes.js");
  const index = await read("server/src/index.js");
  assert.match(route, /requireAdminAccess/);
  assert.match(route, /router\.get\("\/scalping-dashboard"/);
  assert.match(route, /router\.put\("\/scalping-strategy-draft"/);
  assert.match(route, /router\.post\("\/scalping-strategy-draft\/review-request"/);
  assert.match(route, /router\.post\("\/scalping-strategy-draft\/approve"/);
  assert.match(route, /router\.post\("\/scalping-strategy-versions\/:versionId\/retire"/);
  assert.match(route, /appliesToTradingRuntime: false/);
  assert.match(route, /orderSubmissionAllowed: false/);
  const newMount = index.indexOf("adminTradingScalpingRoutes");
  const legacyMount = index.lastIndexOf("adminTradingReadinessRoutes");
  assert.ok(newMount >= 0);
  assert.ok(legacyMount > newMount);
  assert.doesNotMatch(route, /KIS_TRADING_APP_SECRET|appSecret|submitOrder|placeOrder|orderAdapter|\/orders?|\/executions?|\/fills?/);
});

test("Dashboard contract supports multi-select, portfolio constraints, registry metadata, and null performance", async () => {
  const service = await read("server/src/services/tradingScalpingAdminDashboard.js");
  assert.match(service, /DEFAULT_LEVERAGED_ETF_SCALPING_CONFIG/);
  assert.match(service, /DEFAULT_LEVERAGED_ETF_SCALPING_UNIVERSE/);
  assert.match(service, /DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS/);
  assert.match(service, /multiSelectSupported: true/);
  assert.match(service, /independent_per_symbol_then_portfolio_coordination/);
  assert.match(service, /postgres_registry/);
  assert.match(service, /process_memory_draft/);
  assert.match(service, /appliesToTradingRuntime: false/);
  assert.match(service, /unavailable_no_persisted_replay_or_shadow_snapshot/);
  assert.match(service, /netPnl: null/);
  assert.match(service, /research_acceptance_threshold_not_return_guarantee/);
});

test("Durable registry migration separates mutable drafts, immutable versions, and audit events", async () => {
  const migration = await read("server/migrations/20260805_trading_strategy_registry.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trading_strategy_drafts/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trading_strategy_versions/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trading_strategy_audit_events/);
  assert.match(migration, /portfolio_constraints JSONB NOT NULL/);
  assert.match(migration, /UNIQUE \(strategy_key, version_number\)/);
  assert.match(migration, /UNIQUE \(strategy_key, payload_checksum\)/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/);
});

test("Dashboard includes strategy, portfolio, objective, KPI, chart, lifecycle, trade, and breakdown surfaces", async () => {
  const panel = await read("src/components/TradingScalpingAdminPanel.jsx");
  for (const required of [
    "STRATEGY_FIELDS",
    "PORTFOLIO_FIELDS",
    "OBJECTIVE_FIELDS",
    "metricCards",
    "LineChart",
    "DailyPnlChart",
    "ObjectiveTable",
    "검토 요청",
    "불변 승인본 생성",
    "승인 전략 버전",
    "최근 완결 거래",
    "종목별 성과",
  ]) {
    assert.match(panel, new RegExp(required));
  }
  for (const symbol of ["TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA"]) {
    assert.match(panel, new RegExp(symbol));
  }
});
