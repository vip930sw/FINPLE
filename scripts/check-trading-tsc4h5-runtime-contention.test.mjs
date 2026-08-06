import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin trading loads one aggregate lab snapshot and mounts one drawer operation", async () => {
  const [readiness, drawer] = await Promise.all([
    source("src/components/TradingReadinessPanel.jsx"),
    source("src/components/TradingAiMlPanelGroup.jsx"),
  ]);

  assert.match(readiness, /activeTradingPanelTab === "lab"[\s\S]*fetchAdminTradingLabDashboardStatus\(\)/);
  assert.doesNotMatch(readiness, /fetchAdminTradingLabMockExecutionPreflightStatus/);
  assert.match(drawer, /const \[activeOperation, setActiveOperation\]/);
  assert.match(drawer, /activeOperation === "#trading-scalping-kis-capture"/);
  assert.match(drawer, /activeOperation === "#trading-scalping-shadow"/);
  assert.match(drawer, /document\.addEventListener\("visibilitychange", handleVisibilityChange\)/);
  assert.match(drawer, /if \(!document\.hidden && !disposed && !polling\) void poll\(\)/);
});

test("capture status reuses persistence sequentially and exposes pool counts", async () => {
  const [runtime, repository, database] = await Promise.all([
    source("server/src/services/tradingKisHistoricalCaptureRuntimeService.js"),
    source("server/src/db/tradingKisHistoricalCaptureRepository.js"),
    source("server/src/db/database.js"),
  ]);

  assert.doesNotMatch(runtime, /\[persistence, summary\] = await Promise\.all/);
  assert.match(runtime, /readLatestKisHistoricalCaptureSummary\)\(\{ env, persistence \}/);
  assert.match(repository, /options\.persistence \?\? await persistenceStatus/);
  assert.match(database, /totalCount: pool\?\.totalCount \|\| 0/);
  assert.match(database, /waitingCount: pool\?\.waitingCount \|\| 0/);
});
