import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTradingReadinessSnapshot,
  createBlockedProviderAdapter,
  createPrivateWorkerShell,
} from "./tradingImplementationShell.js";

test("provider calls and order submission are blocked by default", async () => {
  const adapter = createBlockedProviderAdapter({ mode: "shadow" });
  const snapshot = await adapter.requestReadOnlySnapshot();
  const order = await adapter.submitOrder();

  assert.equal(snapshot.providerCallsAllowed, false);
  assert.equal(snapshot.networkCallAttempted, false);
  assert.equal(order.orderSubmissionAllowed, false);
  assert.equal(order.networkCallAttempted, false);
});

test("mock, dry-run, and shadow worker shell never calls network", () => {
  for (const mode of ["mock", "dry_run", "shadow"]) {
    const worker = createPrivateWorkerShell({ mode });
    const result = worker.runReadinessCheck({ allowNetwork: true, allowOrderSubmission: true });

    assert.equal(result.mode, mode);
    assert.equal(result.providerCallsAllowed, false);
    assert.equal(result.orderSubmissionAllowed, false);
    assert.equal(result.networkCallAttempted, false);
    assert.match(result.blockedReasons.join("|"), /network_request_not_allowed/);
  }
});

test("missing env values keep readiness fail-closed", () => {
  const snapshot = buildTradingReadinessSnapshot({
    env: {},
    checkedAt: "2026-07-03T00:00:00.000Z",
  });

  assert.equal(snapshot.flags.providerCallsAllowed, false);
  assert.equal(snapshot.flags.orderSubmissionAllowed, false);
  assert.equal(snapshot.flags.runtimeRouteAllowed, false);
  assert.equal(snapshot.flags.publicUiAllowed, false);
  assert.equal(snapshot.flags.dbMigrationAllowed, false);
  assert.equal(snapshot.flags.readyForLiveGuardedTrading, false);
  assert.equal(snapshot.killSwitch.enabled, true);
  assert.match(snapshot.environment.blockers.join("|"), /missing_trading_mode/);
});

test("readiness snapshot does not expose credentials, account identifiers, or payloads", () => {
  const snapshot = buildTradingReadinessSnapshot({
    env: {
      FINPLE_TRADING_STEP117_MODE: "dry-run",
      KIS_TRADING_APP_KEY: "secret-app-key",
      KIS_TRADING_APP_SECRET: "secret-app-secret",
      KIS_TRADING_ACCOUNT_ID: "50195326-01",
    },
    checkedAt: "2026-07-03T00:00:00.000Z",
  });
  const text = JSON.stringify(snapshot);

  assert.equal(snapshot.environment.presence.KIS_TRADING_APP_KEY.present, true);
  assert.equal(snapshot.environment.presence.KIS_TRADING_APP_KEY.valueStored, false);
  assert.equal(text.includes("secret-app-key"), false);
  assert.equal(text.includes("secret-app-secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(snapshot.boundaries.providerOrderPayloadStored, false);
});
