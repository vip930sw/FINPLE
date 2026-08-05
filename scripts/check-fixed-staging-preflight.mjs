import { pathToFileURL } from "node:url";

const FRONTEND_ORIGIN = "https://staging.finple.co.kr";
const PRODUCTION_BACKEND_ORIGIN = "https://finple-api.onrender.com";
const FALSE_FLAGS = [
  "FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED",
  "FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED",
  "FINPLE_TRADING_SHADOW_RUNTIME_ENABLED",
  "FINPLE_TRADING_KIS_FEED_CHECKPOINT_ENABLED",
  "FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED",
  "FINPLE_TRADING_SCALPING_MODEL_SIGNAL_ENABLED",
  "ALPHA_VANTAGE_FETCH_FX",
  "ALPHA_VANTAGE_FETCH_OVERVIEW",
];
const FORBIDDEN_SECRETS = [
  "KIS_APP_KEY",
  "KIS_APP_SECRET",
  "KIS_BASE_URL",
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "KIS_TRADING_ACCOUNT_ID",
  "ALPHA_VANTAGE_API_KEY",
  "OPENAI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function clean(value) {
  return String(value ?? "").trim();
}

function origin(value) {
  try {
    return new URL(clean(value)).origin;
  } catch {
    return "";
  }
}

function isFullSha(value) {
  return /^[0-9a-f]{40}$/i.test(clean(value));
}

export function safeContractEnvironment() {
  return {
    FINPLE_STAGING_BRANCH: "staging",
    FINPLE_STAGING_FRONTEND_ORIGIN: FRONTEND_ORIGIN,
    FINPLE_STAGING_BACKEND_ORIGIN: "https://finple-api-staging.onrender.com",
    VITE_FINPLE_API_BASE_URL: "https://finple-api-staging.onrender.com/api",
    CORS_ORIGIN: FRONTEND_ORIGIN,
    FINPLE_STAGING_FRONTEND_SHA: "a".repeat(40),
    FINPLE_STAGING_BACKEND_SHA: "a".repeat(40),
    FINPLE_STAGING_DATABASE_ISOLATED: "true",
    FINPLE_STAGING_PRODUCTION_DATA_PRESENT: "false",
    FINPLE_STAGING_SYNTHETIC_DATA_ONLY: "true",
    DATABASE_URL: "postgresql://staging-only.invalid/finple",
    DATABASE_SSL: "true",
    FINPLE_ADMIN_TOKEN: "staging-only-placeholder",
    ASSET_DATA_PROVIDER: "mock",
    FINPLE_AI_ANALYSIS_MODE: "mock",
    FINPLE_AI_ANALYSIS_PROVIDER: "none",
    ...Object.fromEntries(FALSE_FLAGS.map((name) => [name, "false"])),
  };
}

export function validateFixedStagingEnvironment(env) {
  const frontendOrigin = origin(env.FINPLE_STAGING_FRONTEND_ORIGIN);
  const backendOrigin = origin(env.FINPLE_STAGING_BACKEND_ORIGIN);
  const frontendSha = clean(env.FINPLE_STAGING_FRONTEND_SHA);
  const backendSha = clean(env.FINPLE_STAGING_BACKEND_SHA);
  const reasons = [];

  if (clean(env.FINPLE_STAGING_BRANCH) !== "staging") reasons.push("staging_branch_required");
  if (frontendOrigin !== FRONTEND_ORIGIN || clean(env.FINPLE_STAGING_FRONTEND_ORIGIN) !== FRONTEND_ORIGIN) {
    reasons.push("fixed_frontend_origin_required");
  }
  if (!backendOrigin || clean(env.FINPLE_STAGING_BACKEND_ORIGIN).replace(/\/$/, "") !== backendOrigin || !backendOrigin.startsWith("https://") || backendOrigin === PRODUCTION_BACKEND_ORIGIN) {
    reasons.push("isolated_https_backend_origin_required");
  }
  if (clean(env.VITE_FINPLE_API_BASE_URL).replace(/\/+$/, "") !== `${backendOrigin}/api`) {
    reasons.push("frontend_api_base_mismatch");
  }
  if (clean(env.CORS_ORIGIN) !== FRONTEND_ORIGIN || clean(env.CORS_ORIGIN).includes("*") || clean(env.CORS_ORIGIN).includes(".vercel.app")) {
    reasons.push("fixed_single_origin_cors_required");
  }
  if (!isFullSha(frontendSha) || !isFullSha(backendSha) || frontendSha !== backendSha) {
    reasons.push("candidate_sha_parity_required");
  }
  if (!clean(env.DATABASE_URL)) reasons.push("staging_database_url_required");
  if (clean(env.DATABASE_SSL).toLowerCase() !== "true") reasons.push("database_ssl_required");
  if (clean(env.FINPLE_STAGING_DATABASE_ISOLATED).toLowerCase() !== "true") reasons.push("database_isolation_attestation_required");
  if (clean(env.FINPLE_STAGING_PRODUCTION_DATA_PRESENT).toLowerCase() !== "false") reasons.push("production_data_must_be_absent");
  if (clean(env.FINPLE_STAGING_SYNTHETIC_DATA_ONLY).toLowerCase() !== "true") reasons.push("synthetic_data_attestation_required");
  if (!clean(env.FINPLE_ADMIN_TOKEN)) reasons.push("staging_admin_token_required");
  if (clean(env.ASSET_DATA_PROVIDER) !== "mock") reasons.push("mock_asset_provider_required");
  if (clean(env.FINPLE_AI_ANALYSIS_MODE) !== "mock" || clean(env.FINPLE_AI_ANALYSIS_PROVIDER) !== "none") {
    reasons.push("mock_ai_provider_required");
  }
  if (FALSE_FLAGS.some((name) => clean(env[name]).toLowerCase() !== "false")) reasons.push("runtime_flags_must_be_false");
  if (FORBIDDEN_SECRETS.some((name) => clean(env[name]))) reasons.push("provider_credentials_must_be_absent");

  return {
    ok: reasons.length === 0,
    status: reasons.length === 0 ? "ready_for_manual_resource_creation" : "blocked",
    reasons,
    checks: {
      fixedFrontendOrigin: frontendOrigin === FRONTEND_ORIGIN,
      isolatedBackendOrigin: Boolean(backendOrigin) && backendOrigin !== PRODUCTION_BACKEND_ORIGIN,
      exactCorsOrigin: clean(env.CORS_ORIGIN) === FRONTEND_ORIGIN,
      candidateShaParity: isFullSha(frontendSha) && frontendSha === backendSha,
      isolatedDatabaseAttested: clean(env.FINPLE_STAGING_DATABASE_ISOLATED).toLowerCase() === "true",
      syntheticDataOnlyAttested: clean(env.FINPLE_STAGING_SYNTHETIC_DATA_ONLY).toLowerCase() === "true",
      providerCredentialsAbsent: FORBIDDEN_SECRETS.every((name) => !clean(env[name])),
      runtimeFlagsDisabled: FALSE_FLAGS.every((name) => clean(env[name]).toLowerCase() === "false"),
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.argv.includes("--contract-only") ? safeContractEnvironment() : process.env;
  const result = validateFixedStagingEnvironment(env);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
