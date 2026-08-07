import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("TSC-4H4 keeps one abortable capture snapshot and explicit diagnostics", async () => {
  const [api, group, panel, appStyles] = await Promise.all([
    source("src/components/tradingScalpingAdminApi.js"),
    source("src/components/TradingAiMlPanelGroup.jsx"),
    source("src/components/TradingScalpingKisCapturePanel.jsx"),
    source("src/App.css"),
  ]);

  assert.match(api, /normalizeFinpleApiBaseUrl\(getFinpleApiBaseUrl\(\)\)/);
  assert.match(api, /new AbortController\(\)/);
  assert.match(api, /REQUEST_TIMEOUT/);
  assert.match(group, /useCaptureStatusSnapshot\(open\)/);
  assert.match(group, /DEPLOYMENT_SHA_MISMATCH/);
  assert.match(group, /BACKEND_VERSION_MISMATCH/);
  assert.match(group, /if \(event\.key === "Escape"\) closeDock\(\)/);
  assert.match(group, /onClick=\{handleCloseClick\}/);
  assert.match(group, /aria-label="실시간 운영 닫기 배경"\s*onClick=\{handleCloseClick\}/);
  assert.ok(group.indexOf('aria-label="실시간 운영 닫기 배경"') < group.indexOf('role="dialog"'));
  assert.match(group, /onPointerDown=\{\(event\) => \{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\)/);
  assert.match(group, /window\.requestAnimationFrame\(\(\) => \{\s*setOpen\(false\);\s*window\.requestAnimationFrame/);
  assert.match(group, /style=\{\{ zIndex: 10000 \}\}/);
  assert.match(appStyles, /\.header\s*\{[\s\S]*?z-index:\s*9999\s*!important/);
  assert.match(group, /pointerEvents: "none"[\s\S]*aria-label="실시간 운영 닫기 배경"[\s\S]*pointerEvents: "auto"/);
  assert.match(group, /zIndex: 1,\s*pointerEvents: "auto"/);
  assert.match(group, /minWidth: 44,\s*minHeight: 44/);
  assert.match(group, /env\(safe-area-inset-top, 0px\)/);
  assert.match(group, /env\(safe-area-inset-right, 0px\)/);
  assert.match(group, /const previousOverflow = document\.body\.style\.overflow[\s\S]*document\.body\.style\.overflow = previousOverflow/);
  assert.match(group, /controller\?\.abort\(\)/);
  assert.doesNotMatch(group, /onMouseDown/);
  assert.doesNotMatch(group, /setInterval/);
  assert.doesNotMatch(panel, /fetchTradingScalpingKisCaptureStatus|setInterval/);
});

test("TSC-4H4 status response is versioned, redacted, and no-store before auth", async () => {
  const [runtime, approval, routes, vite] = await Promise.all([
    source("server/src/services/tradingKisHistoricalCaptureRuntimeService.js"),
    source("server/src/services/tradingKisReadOnlyApproval.js"),
    source("server/src/routes/adminTradingScalpingRoutes.js"),
    source("vite.config.js"),
  ]);

  assert.match(runtime, /schemaVersion: KIS_HISTORICAL_CAPTURE_STATUS_SCHEMA_VERSION/);
  assert.match(runtime, /persistenceContractVersion: KIS_HISTORICAL_CAPTURE_PERSISTENCE_CONTRACT_VERSION/);
  assert.match(runtime, /deploymentSha: deployment\.commitSha \|\| null/);
  assert.match(runtime, /approval: projectKisShadowFeedApprovalPublic\(approval\)/);
  assert.match(approval, /approvalIdPresent: Boolean\(clean\(receipt\.approvalId\)\)/);
  assert.match(approval, /rawReceiptStored: false/);
  assert.match(routes, /router\.get\("\/scalping-kis-capture"[\s\S]*setHeader\("Cache-Control", "no-store, max-age=0"\)[\s\S]*requireAdminAccess/);
  assert.match(vite, /globalThis\.__FINPLE_DEPLOYMENT_SHA__/);
});
