import test from "node:test";
import assert from "node:assert/strict";
import {
  safeContractEnvironment,
  validateFixedStagingEnvironment,
} from "./check-fixed-staging-preflight.mjs";

test("fixed staging contract is fail-closed and redacted", () => {
  const env = safeContractEnvironment();
  const result = validateFixedStagingEnvironment(env);

  assert.equal(result.ok, true);
  assert.equal(result.status, "ready_for_manual_resource_creation");
  assert.equal(result.checks.providerCredentialsAbsent, true);
  assert.equal(result.checks.runtimeFlagsDisabled, true);
  assert.doesNotMatch(JSON.stringify(result), /staging-only-placeholder|postgresql:\/\//);
});

test("preview wildcard CORS and production backend are rejected", () => {
  const env = {
    ...safeContractEnvironment(),
    FINPLE_STAGING_BACKEND_ORIGIN: "https://finple-api.onrender.com",
    VITE_FINPLE_API_BASE_URL: "https://finple-api.onrender.com/api",
    CORS_ORIGIN: "https://*.vercel.app",
  };
  const result = validateFixedStagingEnvironment(env);

  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("isolated_https_backend_origin_required"));
  assert.ok(result.reasons.includes("fixed_single_origin_cors_required"));
});

test("origin values with paths are rejected", () => {
  const env = {
    ...safeContractEnvironment(),
    FINPLE_STAGING_FRONTEND_ORIGIN: "https://staging.finple.co.kr/admin",
    FINPLE_STAGING_BACKEND_ORIGIN: "https://finple-api-staging.onrender.com/api",
  };
  const result = validateFixedStagingEnvironment(env);

  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("fixed_frontend_origin_required"));
  assert.ok(result.reasons.includes("isolated_https_backend_origin_required"));
});

test("SHA drift, enabled runtime, credentials, and production data stay blocked", () => {
  const env = {
    ...safeContractEnvironment(),
    FINPLE_STAGING_BACKEND_SHA: "b".repeat(40),
    FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED: "true",
    KIS_TRADING_APP_KEY: "must-not-be-reported",
    FINPLE_STAGING_PRODUCTION_DATA_PRESENT: "true",
  };
  const result = validateFixedStagingEnvironment(env);

  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("candidate_sha_parity_required"));
  assert.ok(result.reasons.includes("runtime_flags_must_be_false"));
  assert.ok(result.reasons.includes("provider_credentials_must_be_absent"));
  assert.ok(result.reasons.includes("production_data_must_be_absent"));
  assert.doesNotMatch(JSON.stringify(result), /must-not-be-reported/);
});
