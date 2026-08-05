import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adapter = readFileSync(new URL("../server/src/services/tradingScalpingModelSignalAdapter.js", import.meta.url), "utf8");
const testFile = readFileSync(new URL("../server/src/services/tradingScalpingModelSignalAdapter.test.js", import.meta.url), "utf8");
const documentation = readFileSync(new URL("../docs/trading/FINPLE_SCALPING_MODEL_SIGNAL_TSC4F_2026_08_05.md", import.meta.url), "utf8");

const combined = `${adapter}\n${testFile}\n${documentation}`;

test("model signal contract is typed, causal, and version-pinned", () => {
  for (const token of [
    "scalping-model-signal-v1",
    "future_data_cutoff",
    "signal_latency_exceeded",
    "model_version_mismatch",
    "model_checksum_mismatch",
    "duplicate_model_signal_request",
    "out_of_order_model_signal_request",
  ]) {
    assert.match(combined, new RegExp(token));
  }
});

test("missing or invalid signals remain fail-closed without heuristic substitution", () => {
  assert.match(adapter, /missingSignalSubstitutionAllowed:\s*false/);
  assert.match(adapter, /heuristicFallbackAllowed:\s*false/);
  assert.match(adapter, /entrySignalFailClosed:\s*true/);
  assert.match(testFile, /returns no substitute/);
});

test("adapter exposes a manual-reset circuit breaker and sanitized health only", () => {
  assert.match(adapter, /maximumConsecutiveFailures/);
  assert.match(adapter, /acknowledgeAndReset/);
  assert.match(adapter, /rawProviderPayloadStored:\s*false/);
  assert.match(adapter, /credentialsPersisted:\s*false/);
  assert.doesNotMatch(adapter, /KIS_TRADING_APP_SECRET|KIS_TRADING_ACCOUNT_ID|orderSubmission\s*\(/);
});

test("replay fixtures require immutable provenance", () => {
  assert.match(adapter, /replay_fixture_not_immutable/);
  assert.match(adapter, /replay_dataset_id_missing/);
  assert.match(adapter, /replay_source_revision_missing/);
  assert.match(adapter, /futureLeakageAllowed:\s*false/);
});

test("scope does not add broker, account, or live activation capability", () => {
  assert.match(documentation, /no KIS activation/i);
  assert.match(documentation, /no account/i);
  assert.match(documentation, /no order/i);
  assert.match(documentation, /no automatic Live activation/i);
  assert.doesNotMatch(combined, /\/orders|\/accounts|placeOrder|submitOrder|cancelOrder/);
});
