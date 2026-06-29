const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_order_credential_boundary_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const ENV_READINESS_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_env_readiness_contract.json");
const PREFLIGHT_PATH = path.join("data", "processed", "trading_lab_step1160_preflight.json");
const MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_manual_operator_approval_contract.json",
);
const KILL_SWITCH_CLEARANCE_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_kill_switch_clearance_contract.json",
);
const ENV_CONFIG_SOURCE_PATH = path.join("server", "src", "services", "tradingEnvConfig.js");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-order-credential-boundary-contract-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const TRADING_CREDENTIAL_ENV = [
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "KIS_TRADING_ACCOUNT_ID",
  "KIS_TRADING_BASE_URL",
];
const ORDER_PERMISSION_ENV = [
  "FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT",
  "FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY",
];
const WEB_DATA_PROXY_ENV = ["KIS_APP_KEY", "KIS_APP_SECRET", "KIS_BASE_URL"];
const REQUIRED_CREDENTIAL_ASSERTIONS = [
  "trading_credentials_use_trading_prefixed_env_names",
  "web_data_proxy_credentials_do_not_imply_order_permission",
  "app_secret_and_account_id_are_never_logged",
  "secret_presence_only_is_recorded",
  "virtual_trading_base_url_is_not_live_order_permission",
  "production_trading_base_url_requires_separate_live_review",
  "manual_operator_approval_metadata_required",
  "kill_switch_clearance_required",
];
const REQUIRED_FORBIDDEN_ACTIONS = [
  "runtime_provider_call",
  "order_submission",
  "order_cancellation",
  "production_secret_usage",
  "raw_provider_response_persistence",
  "db_migration",
  "public_ui",
  "scenario_monthly_cache_write",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("server", "src", "services", "tradingCredentialStore.js"),
  path.join("server", "src", "services", "trading", "credentialStore.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
];
const VIRTUAL_FIXTURE = Object.freeze({
  FINPLE_TRADING_MODE: "shadow",
  FINPLE_TRADING_KILL_SWITCH: "true",
  FINPLE_TRADING_ALLOWED_MARKETS: "US",
  FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET: "US:ETF",
  FINPLE_TRADING_ALLOWED_SYMBOLS: "SPY",
  FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT: "2026-06-29T00:00:00+09:00",
  FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY: "SANG_WON",
  KIS_TRADING_APP_KEY: "present-placeholder",
  KIS_TRADING_APP_SECRET: "present-placeholder",
  KIS_TRADING_ACCOUNT_ID: "50195326-01",
  KIS_TRADING_BASE_URL: "https://openapivts.koreainvestment.com:29443",
});
const PRODUCTION_SHAPE_FIXTURE = Object.freeze({
  ...VIRTUAL_FIXTURE,
  FINPLE_TRADING_MODE: "live_guarded",
  KIS_TRADING_BASE_URL: "https://openapi.koreainvestment.com:9443",
});

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function redactedFixturePresence(env) {
  return Object.fromEntries(
    Object.entries(env).map(([name, value]) => [
      name,
      {
        present: String(value ?? "").trim().length > 0,
        valueStored: false,
        secret: name.includes("SECRET") || name.includes("APP_KEY") || name.includes("ACCOUNT_ID"),
      },
    ]),
  );
}

async function importService(filePath) {
  return import(pathToFileURL(path.resolve(filePath)).href);
}

async function buildContract() {
  const policy = readJson(POLICY_PATH);
  const envReadiness = readJson(ENV_READINESS_CONTRACT_PATH);
  const preflight = readJson(PREFLIGHT_PATH);
  const manualOperatorApprovalContract = readJson(MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH);
  const killSwitchClearanceContract = readJson(KILL_SWITCH_CLEARANCE_CONTRACT_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const { validateTradingEnvConfig } = await importService(ENV_CONFIG_SOURCE_PATH);
  const virtualReport = validateTradingEnvConfig(VIRTUAL_FIXTURE);
  const productionShapeReport = validateTradingEnvConfig(PRODUCTION_SHAPE_FIXTURE);
  const credentialAssertions = [...REQUIRED_CREDENTIAL_ASSERTIONS];
  const forbiddenActions = [...REQUIRED_FORBIDDEN_ACTIONS];
  const tradingWorkerEnv = policy.secretBoundary?.tradingWorkerEnv ?? [];
  const webDataProxyEnv = policy.secretBoundary?.webDataProxyEnv ?? [];
  const missingCredentialAssertions = missingValues(credentialAssertions, REQUIRED_CREDENTIAL_ASSERTIONS);
  const missingForbiddenActions = missingValues(forbiddenActions, REQUIRED_FORBIDDEN_ACTIONS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    contractOnly: true,
    tradingCredentialNamesSeparate:
      TRADING_CREDENTIAL_ENV.every((name) => tradingWorkerEnv.includes(name)) &&
      WEB_DATA_PROXY_ENV.every((name) => !tradingWorkerEnv.includes(name)) &&
      WEB_DATA_PROXY_ENV.filter((name) => name !== "KIS_BASE_URL").every((name) => webDataProxyEnv.includes(name)),
    envReadinessStillRequiresNoSecretsNow:
      envReadiness.currentState?.productionSecretsRequiredNow === false &&
      envReadiness.currentState?.valuesStoredInContract === false,
    virtualTradingFixtureIsNotOrderCapable:
      virtualReport.validShape === true &&
      virtualReport.normalized?.kisTradingBaseUrlMode === "virtual_trading" &&
      virtualReport.currentState?.orderSubmissionAllowed === false &&
      virtualReport.currentState?.providerCallsAllowed === false,
    productionShapeRequiresSeparateReview:
      productionShapeReport.validShape === true &&
      productionShapeReport.normalized?.kisTradingBaseUrlMode === "production_trading" &&
      productionShapeReport.warnings.includes("production_trading_base_url_requires_separate_live_review") &&
      productionShapeReport.currentState?.orderSubmissionAllowed === false,
    manualOperatorApprovalContractReady:
      manualOperatorApprovalContract.readiness?.readyForFutureManualApprovalImplementationReview === true &&
      manualOperatorApprovalContract.readiness?.manualApprovalImplementationAllowed === false &&
      manualOperatorApprovalContract.readiness?.orderSubmissionAllowed === false,
    killSwitchClearanceContractReady:
      killSwitchClearanceContract.readiness?.readyForFutureKillSwitchClearanceImplementationReview === true &&
      killSwitchClearanceContract.readiness?.killSwitchRuntimeImplementationAllowed === false &&
      killSwitchClearanceContract.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesOrderSubmission: preflight.readiness?.orderSubmissionAllowed === false,
    preflightStillDisablesProviderCalls: preflight.readiness?.providerCallsAllowed === false,
    credentialAssertionsReady: missingCredentialAssertions.length === 0,
    forbiddenActionsReady: missingForbiddenActions.length === 0,
    architectureDocMentionsCredentialBoundary:
      architectureDoc.includes("Trading Order Credential Boundary Contract") &&
      architectureDoc.includes("separate_order_capable_credentials_present"),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    credentialStoreImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };
  const readyForFutureOrderCredentialImplementationReview =
    checks.tradingCredentialNamesSeparate &&
    checks.envReadinessStillRequiresNoSecretsNow &&
    checks.virtualTradingFixtureIsNotOrderCapable &&
    checks.productionShapeRequiresSeparateReview &&
    checks.manualOperatorApprovalContractReady &&
    checks.killSwitchClearanceContractReady &&
    checks.preflightStillDisablesOrderSubmission &&
    checks.preflightStillDisablesProviderCalls &&
    checks.credentialAssertionsReady &&
    checks.forbiddenActionsReady &&
    checks.architectureDocMentionsCredentialBoundary &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1P",
    scope: "trading_order_credential_boundary_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      envReadinessContract: ENV_READINESS_CONTRACT_PATH,
      preflight: PREFLIGHT_PATH,
      manualOperatorApprovalContract: MANUAL_OPERATOR_APPROVAL_CONTRACT_PATH,
      killSwitchClearanceContract: KILL_SWITCH_CLEARANCE_CONTRACT_PATH,
      envParser: ENV_CONFIG_SOURCE_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      contractOnly: true,
      credentialValuesStored: false,
      credentialStoreImplementationAllowed: false,
      orderCapableCredentialsAcceptedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      productionSecretsRequiredNow: false,
    },
    credentialBoundary: {
      tradingCredentialEnv: TRADING_CREDENTIAL_ENV,
      orderPermissionEnv: ORDER_PERMISSION_ENV,
      webDataProxyEnv: WEB_DATA_PROXY_ENV,
      requiredAssertions: credentialAssertions,
      forbiddenActions,
      redactionRules: [
        "record secret presence only",
        "never log KIS_TRADING_APP_SECRET",
        "never log KIS_TRADING_ACCOUNT_ID in full",
        "never persist access tokens",
        "never reuse KIS_APP_KEY or KIS_APP_SECRET as order-capable credentials",
      ],
      promotionRules: [
        "virtual_trading base URL supports shadow or paper evidence only",
        "production_trading base URL requires separate live review",
        "order-capable credentials do not approve order submission without manual approval and kill switch clearance",
        "credential readiness does not approve provider calls or DB migration",
      ],
    },
    fixtureEvidence: {
      virtualTrading: {
        presence: redactedFixturePresence(VIRTUAL_FIXTURE),
        validShape: virtualReport.validShape,
        mode: virtualReport.mode,
        baseUrlMode: virtualReport.normalized?.kisTradingBaseUrlMode,
        warnings: virtualReport.warnings,
        runtimeBlockers: virtualReport.runtimeBlockers,
        orderSubmissionAllowed: virtualReport.currentState?.orderSubmissionAllowed,
        providerCallsAllowed: virtualReport.currentState?.providerCallsAllowed,
      },
      productionShape: {
        presence: redactedFixturePresence(PRODUCTION_SHAPE_FIXTURE),
        validShape: productionShapeReport.validShape,
        mode: productionShapeReport.mode,
        baseUrlMode: productionShapeReport.normalized?.kisTradingBaseUrlMode,
        warnings: productionShapeReport.warnings,
        runtimeBlockers: productionShapeReport.runtimeBlockers,
        orderSubmissionAllowed: productionShapeReport.currentState?.orderSubmissionAllowed,
        providerCallsAllowed: productionShapeReport.currentState?.providerCallsAllowed,
      },
    },
    checks,
    evidence: {
      tradingWorkerEnv,
      webDataProxyEnv,
      missingCredentialAssertions,
      missingForbiddenActions,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      envReadinessStatus: envReadiness.readiness?.status,
      manualOperatorApprovalContractStatus: manualOperatorApprovalContract.readiness?.status,
      killSwitchClearanceContractStatus: killSwitchClearanceContract.readiness?.status,
      preflightStatus: preflight.readiness?.status,
    },
    readiness: {
      status: readyForFutureOrderCredentialImplementationReview
        ? "contract_ready_pending_order_credential_implementation_review"
        : "blocked_before_order_credential_boundary_contract",
      readyForFutureOrderCredentialImplementationReview,
      credentialStoreImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.tradingCredentialNamesSeparate ? [] : ["trading_credential_names_not_separate"]),
        ...(checks.envReadinessStillRequiresNoSecretsNow ? [] : ["env_readiness_requires_secrets_too_early"]),
        ...(checks.virtualTradingFixtureIsNotOrderCapable ? [] : ["virtual_trading_fixture_order_capable_too_early"]),
        ...(checks.productionShapeRequiresSeparateReview ? [] : ["production_shape_missing_separate_review_warning"]),
        ...(checks.manualOperatorApprovalContractReady ? [] : ["manual_operator_approval_contract_not_ready"]),
        ...(checks.killSwitchClearanceContractReady ? [] : ["kill_switch_clearance_contract_not_ready"]),
        ...(checks.preflightStillDisablesOrderSubmission ? [] : ["preflight_allows_order_submission"]),
        ...(checks.preflightStillDisablesProviderCalls ? [] : ["preflight_allows_provider_calls"]),
        ...missingCredentialAssertions.map((assertion) => `missing_credential_assertion_${assertion}`),
        ...missingForbiddenActions.map((action) => `missing_forbidden_action_${action}`),
        ...(checks.architectureDocMentionsCredentialBoundary
          ? []
          : ["architecture_doc_missing_order_credential_boundary"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = await buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-order-credential-boundary-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-order-credential-boundary-contract.cjs`);
    }
    console.log("[generate-trading-order-credential-boundary-contract] ok");
    console.log(`[generate-trading-order-credential-boundary-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-order-credential-boundary-contract] wrote contract");
  console.log(
    `[generate-trading-order-credential-boundary-contract] readyForFutureOrderCredentialImplementationReview=${parsed.readiness.readyForFutureOrderCredentialImplementationReview}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
