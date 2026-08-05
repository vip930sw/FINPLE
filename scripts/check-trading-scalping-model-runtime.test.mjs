import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("KIS Shadow feed uses only the validated model runtime provider", async () => {
  const runtime = await source("server/src/services/tradingKisShadowFeedRuntimeService.js");
  assert.match(runtime, /startScalpingModelSignalRuntime/);
  assert.match(runtime, /modelSignalProvider: modelRuntime\.provider/);
  assert.match(runtime, /modelSignal: input\.modelSignal/);
  assert.doesNotMatch(runtime, /modelSignalProvider: dependencies\.modelSignalProvider/);
});

test("model provider registration remains internal and fail-closed", async () => {
  const service = await source("server/src/services/tradingScalpingModelSignalRuntimeService.js");
  assert.match(service, /registerScalpingModelSignalProvider/);
  assert.match(service, /model_symbol_scope_mismatch/);
  assert.match(service, /model_signal_circuit_breaker_tripped/);
  assert.match(service, /missingSignalSubstitutionAllowed: false/);
  assert.match(service, /heuristicFallbackAllowed: false/);
  assert.match(service, /futureLeakageAllowed: false/);
  assert.match(service, /orderSubmissionAllowed: false/);
  assert.doesNotMatch(service, /fetch\(|axios|openai|submitOrder|cancelOrder|modifyOrder/);
});

test("Admin routes expose status and acknowledgement only", async () => {
  const routes = await source("server/src/routes/adminTradingScalpingRoutes.js");
  assert.match(routes, /router\.get\("\/scalping-model-signal"/);
  assert.match(routes, /router\.post\("\/scalping-model-signal\/acknowledge"/);
  assert.doesNotMatch(routes, /scalping-model-signal\/(register|start|payload|ingest|order)/);
  assert.match(routes, /requireAdminAccess/);
});

test("Admin panel displays model identity, counters, blocking reasons, and alerts", async () => {
  const panel = await source("src/components/TradingScalpingModelSignalPanel.jsx");
  const group = await source("src/components/TradingAiMlPanelGroup.jsx");
  const api = await source("src/components/tradingScalpingAdminApi.js");
  assert.match(panel, /모델 신호 상태·진입 차단/);
  assert.match(panel, /신규 진입 차단 사유/);
  assert.match(panel, /Causal 위반/);
  assert.match(panel, /Identity 불일치/);
  assert.match(panel, /차단 확인·상태 해제/);
  assert.match(group, /TradingScalpingModelSignalPanel/);
  assert.match(api, /fetchTradingScalpingModelSignalStatus/);
  assert.match(api, /acknowledgeTradingScalpingModelSignalCircuitBreaker/);
});

test("documentation preserves no-model, no-KIS, and no-order activation boundary", async () => {
  const document = await source("docs/trading/FINPLE_SCALPING_MODEL_SIGNAL_RUNTIME_TSC4F2_2026_08_05.md");
  assert.match(document, /no external model API call/);
  assert.match(document, /no KIS connection/);
  assert.match(document, /no account or order operation/);
  assert.match(document, /no Production deployment/);
  assert.match(document, /60 trading sessions/);
});
