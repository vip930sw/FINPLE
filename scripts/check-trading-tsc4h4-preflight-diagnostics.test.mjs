import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TSC-4H4 keeps one abortable capture snapshot and explicit diagnostics", async () => {
  const [api, group, panel] = await Promise.all([
    source("src/components/tradingScalpingAdminApi.js"),
    source("src/components/TradingAiMlPanelGroup.jsx"),
    source("src/components/TradingScalpingKisCapturePanel.jsx"),
  ]);

  assert.match(api, /normalizeFinpleApiBaseUrl\(getFinpleApiBaseUrl\(\)\)/);
  assert.match(api, /new AbortController\(\)/);
  assert.match(api, /REQUEST_TIMEOUT/);
  assert.match(group, /useCaptureStatusSnapshot\(open\)/);
  assert.match(group, /DEPLOYMENT_SHA_MISMATCH/);
  assert.match(group, /BACKEND_VERSION_MISMATCH/);
  assert.match(group, /if \(event\.key === "Escape"\) closeDock\(\)/);
  assert.match(group, /onClick=\{closeDock\}/);
  assert.match(group, /if \(event\.target === event\.currentTarget\) closeDock\(\)/);
  assert.match(group, /window\.setTimeout\(\(\) => \{\s*setOpen\(false\);\s*window\.requestAnimationFrame/);
  assert.doesNotMatch(group, /setInterval/);
  assert.doesNotMatch(panel, /fetchTradingScalpingKisCaptureStatus|setInterval/);
});

test("TSC-4H4 status response is versioned, redacted, and no-store before auth", async () => {
  const [runtime, routes, vite] = await Promise.all([
    source("server/src/services/tradingKisHistoricalCaptureRuntimeService.js"),
    source("server/src/routes/adminTradingScalpingRoutes.js"),
    source("vite.config.js"),
  ]);

  assert.match(runtime, /schemaVersion: KIS_HISTORICAL_CAPTURE_STATUS_SCHEMA_VERSION/);
  assert.match(runtime, /persistenceContractVersion: KIS_HISTORICAL_CAPTURE_PERSISTENCE_CONTRACT_VERSION/);
  assert.match(runtime, /deploymentSha: deployment\.commitSha \|\| null/);
  assert.match(runtime, /approvalIdPresent: Boolean\(receipt\.approvalId\)/);
  assert.match(runtime, /rawReceiptStored: false/);
  assert.match(routes, /router\.get\("\/scalping-kis-capture"[\s\S]*setHeader\("Cache-Control", "no-store, max-age=0"\)[\s\S]*requireAdminAccess/);
  assert.match(vite, /globalThis\.__FINPLE_DEPLOYMENT_SHA__/);
});
