import test from "node:test";
import assert from "node:assert/strict";

import {
  getLatestKisFeedCheckpoint,
  resetKisFeedCheckpointMemoryForTest,
  saveKisFeedCheckpoint,
} from "./tradingKisFeedCheckpointRepository.js";

test("memory checkpoint removes credentials, raw payloads, and account identifiers", async () => {
  resetKisFeedCheckpointMemoryForTest();
  const result = await saveKisFeedCheckpoint({
    shadowRunId: "run-1",
    strategyVersionId: "version-1",
    strategyVersionNumber: 3,
    operationalState: "healthy",
    selectedSymbols: ["TQQQ", "SQQQ"],
    runner: {
      state: "connected",
      appKey: "must-not-store",
      nested: { rawPayload: "must-not-store", providerEventCount: 20 },
    },
    guard: {
      state: "healthy",
      alerts: [{ code: "test", accountId: "must-not-store" }],
    },
    approval: {
      approvalId: "approval-1",
      expiresAt: "2026-09-01T00:00:00Z",
      scope: "trading_read_only_market_data",
      environment: "virtual_shadow",
      token: "must-not-store",
    },
  }, { env: {}, actor: "test" }, { env: {} });

  const serialized = JSON.stringify(result.checkpoint);
  assert.doesNotMatch(serialized, /must-not-store/);
  assert.equal(result.checkpoint.manualResumeRequired, true);
  assert.deepEqual(result.checkpoint.selectedSymbols, ["TQQQ", "SQQQ"]);

  const latest = await getLatestKisFeedCheckpoint({ env: {} }, { env: {} });
  assert.equal(latest.checkpoint.strategyVersionId, "version-1");
});

test("persistent checkpoint writes only sanitized JSON contracts", async () => {
  const calls = [];
  const query = async (text, params = []) => {
    calls.push({ text, params });
    if (text.includes("to_regclass")) {
      return { rows: [{ checkpoints: "trading_kis_shadow_feed_checkpoints" }] };
    }
    if (text.includes("INSERT INTO")) {
      return {
        rows: [{
          id: params[0],
          feed_key: params[1],
          shadow_run_id: params[2],
          strategy_version_id: params[3],
          strategy_version_number: params[4],
          operational_state: params[5],
          runner_state: JSON.parse(params[6]),
          guard_state: JSON.parse(params[7]),
          approval_metadata: JSON.parse(params[8]),
          selected_symbols: JSON.parse(params[9]),
          stop_reason: params[10],
          manual_resume_required: params[11],
          created_by: params[12],
          created_at: params[13],
        }],
      };
    }
    return { rows: [] };
  };

  const env = { FINPLE_TRADING_KIS_FEED_CHECKPOINT_ENABLED: "true" };
  const result = await saveKisFeedCheckpoint({
    shadowRunId: "00000000-0000-0000-0000-000000000001",
    strategyVersionId: "00000000-0000-0000-0000-000000000002",
    strategyVersionNumber: 1,
    operationalState: "tripped",
    runner: { state: "closed", appSecret: "remove-me" },
    guard: { state: "tripped", trip: { code: "provider_heartbeat_stale" } },
    approval: { approvalId: "approval-1", expiresAt: "2026-09-01T00:00:00Z" },
    selectedSymbols: ["TQQQ"],
    stopReason: "circuit_breaker",
  }, { env, actor: "watchdog" }, { env, query });

  assert.equal(result.persistence.mode, "postgres_checkpoint");
  const insert = calls.find((call) => call.text.includes("INSERT INTO"));
  assert.ok(insert);
  assert.doesNotMatch(insert.params.join("|"), /remove-me/);
  assert.equal(result.checkpoint.manualResumeRequired, true);
});
