import assert from "node:assert/strict";
import test from "node:test";

import { TRADING_ENV_NAMES, validateTradingEnvConfig } from "./tradingEnvConfig.js";

function renderVirtualShadowEnv(overrides = {}) {
  return {
    [TRADING_ENV_NAMES.allowedAssetTypesByMarket]: "KR:STOCK;US:STOCK,ETF",
    [TRADING_ENV_NAMES.allowedMarkets]: "KR,US",
    [TRADING_ENV_NAMES.allowedSymbols]: "*",
    [TRADING_ENV_NAMES.killSwitch]: "true",
    [TRADING_ENV_NAMES.mode]: "shadow",
    [TRADING_ENV_NAMES.orderPermissionApprovedAt]: "2026-06-29T00:00:00+09:00",
    [TRADING_ENV_NAMES.orderPermissionApprovedBy]: "SANG_WON",
    [TRADING_ENV_NAMES.accountId]: "50195326-01",
    [TRADING_ENV_NAMES.appKey]: "masked-app-key",
    [TRADING_ENV_NAMES.appSecret]: "masked-app-secret",
    [TRADING_ENV_NAMES.baseUrl]: "https://openapivts.koreainvestment.com:29443",
    ...overrides,
  };
}

test("validates Render virtual shadow env shape without enabling runtime", () => {
  const report = validateTradingEnvConfig(renderVirtualShadowEnv());

  assert.equal(report.validShape, true);
  assert.equal(report.mode, "shadow");
  assert.equal(report.normalized.killSwitchEnabled, true);
  assert.equal(report.normalized.kisTradingBaseUrlMode, "virtual_trading");
  assert.deepEqual(report.normalized.allowedMarkets, ["KR", "US"]);
  assert.deepEqual(report.normalized.allowedAssetTypesByMarket, { KR: ["STOCK"], US: ["STOCK", "ETF"] });
  assert.deepEqual(report.normalized.allowedSymbols, ["*"]);
  assert.equal(report.currentState.valuesStored, false);
  assert.equal(report.currentState.providerCallsAllowed, false);
  assert.equal(report.currentState.orderSubmissionAllowed, false);
  assert.equal(report.currentState.runtimeActivationAllowed, false);
  assert.equal(report.presence.KIS_TRADING_APP_SECRET.valueStored, false);
  assert.match(report.runtimeBlockers.join("|"), /kill_switch_enabled/);
  assert.match(report.warnings.join("|"), /wildcard_allowed_symbols/);
});

test("fails closed when required env values are missing or malformed", () => {
  const report = validateTradingEnvConfig({
    [TRADING_ENV_NAMES.mode]: "LIVE_NOW",
    [TRADING_ENV_NAMES.killSwitch]: "maybe",
    [TRADING_ENV_NAMES.allowedMarkets]: "KR",
    [TRADING_ENV_NAMES.allowedAssetTypesByMarket]: "KR:",
    [TRADING_ENV_NAMES.allowedSymbols]: "AAPL,$BAD",
    [TRADING_ENV_NAMES.accountId]: "50195326",
    [TRADING_ENV_NAMES.baseUrl]: "http://example.invalid",
    [TRADING_ENV_NAMES.orderPermissionApprovedAt]: "not-a-date",
  });

  assert.equal(report.validShape, false);
  assert.equal(report.mode, "live_blocked");
  assert.match(report.shapeReasons.join("|"), /unknown_trading_mode_normalized_to_live_blocked/);
  assert.match(report.shapeReasons.join("|"), /invalid_boolean_flag/);
  assert.match(report.shapeReasons.join("|"), /invalid_kis_trading_account_id_format/);
  assert.match(report.shapeReasons.join("|"), /kis_trading_base_url_must_use_https/);
  assert.equal(report.currentState.orderSubmissionAllowed, false);
});

test("blocks production trading base URL from being treated as live-ready", () => {
  const report = validateTradingEnvConfig(
    renderVirtualShadowEnv({
      [TRADING_ENV_NAMES.killSwitch]: "false",
      [TRADING_ENV_NAMES.mode]: "live_guarded",
      [TRADING_ENV_NAMES.allowedSymbols]: "AAPL,SPY",
      [TRADING_ENV_NAMES.baseUrl]: "https://openapi.koreainvestment.com:9443",
    }),
  );

  assert.equal(report.validShape, true);
  assert.equal(report.normalized.kisTradingBaseUrlMode, "production_trading");
  assert.match(report.warnings.join("|"), /production_trading_base_url_requires_separate_live_review/);
  assert.match(report.runtimeBlockers.join("|"), /runtime_integration_not_implemented/);
  assert.match(report.runtimeBlockers.join("|"), /mode_not_shadow_or_paper/);
  assert.equal(report.currentState.orderSubmissionAllowed, false);
});

test("requires asset-type mappings to match allowed markets", () => {
  const missingAssetTypes = validateTradingEnvConfig(
    renderVirtualShadowEnv({
      [TRADING_ENV_NAMES.allowedMarkets]: "KR,US,JP",
      [TRADING_ENV_NAMES.allowedAssetTypesByMarket]: "KR:STOCK;US:STOCK,ETF",
    }),
  );
  assert.equal(missingAssetTypes.validShape, false);
  assert.match(missingAssetTypes.shapeReasons.join("|"), /allowed_market_missing_asset_types_JP/);

  const extraMarket = validateTradingEnvConfig(
    renderVirtualShadowEnv({
      [TRADING_ENV_NAMES.allowedMarkets]: "KR",
      [TRADING_ENV_NAMES.allowedAssetTypesByMarket]: "KR:STOCK;US:STOCK,ETF",
    }),
  );
  assert.equal(extraMarket.validShape, false);
  assert.match(extraMarket.shapeReasons.join("|"), /asset_type_market_not_allowlisted_US/);
});
