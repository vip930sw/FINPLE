const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_env_readiness_contract.json");
const POLICY_PATH = path.join("data", "processed", "trading_lab_step1160_policy.json");
const SHADOW_CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_shadow_mode_contract.json");
const ORDER_ADAPTER_REVIEW_PATH = path.join("data", "processed", "trading_lab_step116_kis_order_adapter_design_review.json");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-env-readiness-contract-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const CONTROL_ENV = ["FINPLE_TRADING_MODE", "FINPLE_TRADING_KILL_SWITCH", "FINPLE_TRADING_ALLOWED_SYMBOLS"];
const READ_ONLY_ENV = [
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "KIS_TRADING_ACCOUNT_ID",
  "KIS_TRADING_BASE_URL",
];
const ORDER_CAPABLE_ENV = [
  "KIS_TRADING_APP_KEY",
  "KIS_TRADING_APP_SECRET",
  "KIS_TRADING_ACCOUNT_ID",
  "KIS_TRADING_BASE_URL",
  "FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT",
  "FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY",
];
const WEB_DATA_PROXY_ENV = ["KIS_APP_KEY", "KIS_APP_SECRET", "KIS_BASE_URL"];
const SCENARIO_ENV = ["FINPLE_SCENARIO_ALLOW_PROVIDER_CALLS", "FINPLE_SCENARIO_PROVIDER_MODE", "FRED_API_KEY"];
const FORBIDDEN_REUSE = [
  ["KIS_APP_KEY", "KIS_TRADING_APP_KEY"],
  ["KIS_APP_SECRET", "KIS_TRADING_APP_SECRET"],
];

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

function envPresence(names) {
  return Object.fromEntries(
    names.map((name) => {
      const value = process.env[name];
      return [name, { present: Boolean(value && value.trim()), valueStored: false }];
    }),
  );
}

function allNames() {
  return [...new Set([...CONTROL_ENV, ...READ_ONLY_ENV, ...ORDER_CAPABLE_ENV, ...WEB_DATA_PROXY_ENV, ...SCENARIO_ENV])];
}

function missingEnv(presence, names) {
  return names.filter((name) => presence[name]?.present !== true);
}

function buildContract() {
  const policy = readJson(POLICY_PATH);
  const shadowContract = readJson(SHADOW_CONTRACT_PATH);
  const orderAdapterReview = readJson(ORDER_ADAPTER_REVIEW_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const presence = envPresence(allNames());
  const readOnlyMissing = missingEnv(presence, READ_ONLY_ENV);
  const orderCapableMissing = missingEnv(presence, ORDER_CAPABLE_ENV);
  const checks = {
    contractOnly: true,
    currentStepRequiresNoProductionSecrets:
      shadowContract.currentState?.productionSecretsRequiredNow === false &&
      orderAdapterReview.currentState?.productionSecretsRequiredNow === false,
    separateTradingCredentialNamesReady:
      (policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_TRADING_APP_KEY") &&
      (policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_TRADING_APP_SECRET") &&
      !(policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_APP_KEY") &&
      !(policy.secretBoundary?.tradingWorkerEnv ?? []).includes("KIS_APP_SECRET"),
    readOnlyRuntimeStillBlocked: shadowContract.readiness?.readOnlyRuntimeIntegrationAllowed === false,
    orderAdapterStillBlocked:
      orderAdapterReview.readiness?.adapterImplementationAllowed === false &&
      orderAdapterReview.readiness?.orderSubmissionAllowed === false,
    architectureDocMentionsTradingEnv:
      architectureDoc.includes("FINPLE_TRADING_MODE") &&
      architectureDoc.includes("KIS_TRADING_APP_KEY") &&
      architectureDoc.includes("KIS_TRADING_APP_SECRET"),
    valuesStoredInContract: false,
    readOnlyEnvConfiguredInCurrentProcess: readOnlyMissing.length === 0,
    orderCapableEnvConfiguredInCurrentProcess: orderCapableMissing.length === 0,
    readOnlyRuntimeIntegrationAllowed: false,
    adapterImplementationAllowed: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
  };

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-1G",
    scope: "trading_env_readiness_contract",
    sourceFiles: {
      policy: POLICY_PATH,
      shadowContract: SHADOW_CONTRACT_PATH,
      orderAdapterDesignReview: ORDER_ADAPTER_REVIEW_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    envGroups: {
      control: CONTROL_ENV,
      readOnlyTrading: READ_ONLY_ENV,
      orderCapableTrading: ORDER_CAPABLE_ENV,
      webDataProxy: WEB_DATA_PROXY_ENV,
      scenarioProvider: SCENARIO_ENV,
    },
    currentProcessPresence: presence,
    currentState: {
      contractOnly: true,
      productionSecretsRequiredNow: false,
      valuesStoredInContract: false,
      readOnlyRuntimeIntegrationAllowed: false,
      adapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
    },
    futureRules: {
      requiredBeforeShadowReadOnlyRuntime: READ_ONLY_ENV,
      requiredBeforeLiveGuardedOrderAdapter: ORDER_CAPABLE_ENV,
      forbiddenCredentialReuse: FORBIDDEN_REUSE.map(([webEnv, tradingEnv]) => ({
        webEnv,
        tradingEnv,
        rule: "do_not_reuse_web_data_proxy_credentials_as_order_capable_trading_credentials",
      })),
      rotationAndLoggingRules: [
        "never commit secret values",
        "never log secret values or full account numbers",
        "use separately named order-capable credentials",
        "record manual approval metadata before live_guarded order adapter implementation",
      ],
    },
    checks,
    evidence: {
      readOnlyMissingInCurrentProcess: readOnlyMissing,
      orderCapableMissingInCurrentProcess: orderCapableMissing,
      scenarioProviderEnvPresentInCurrentProcess: SCENARIO_ENV.filter((name) => presence[name]?.present === true),
    },
    readiness: {
      status: "contract_ready_runtime_env_not_required_yet",
      readyForCurrentStep: true,
      readyForShadowReadOnlyRuntimeInCurrentProcess: readOnlyMissing.length === 0,
      readyForLiveGuardedOrderAdapterInCurrentProcess: orderCapableMissing.length === 0,
      readOnlyRuntimeIntegrationAllowed: false,
      adapterImplementationAllowed: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      blockers: [
        ...(checks.currentStepRequiresNoProductionSecrets ? [] : ["current_step_unexpectedly_requires_production_secrets"]),
        ...(checks.separateTradingCredentialNamesReady ? [] : ["trading_credential_names_not_separate"]),
        ...(checks.readOnlyRuntimeStillBlocked ? [] : ["shadow_read_only_runtime_unblocked_too_early"]),
        ...(checks.orderAdapterStillBlocked ? [] : ["order_adapter_unblocked_too_early"]),
        ...(checks.architectureDocMentionsTradingEnv ? [] : ["architecture_doc_missing_trading_env_names"]),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-env-readiness-contract.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-env-readiness-contract.cjs`);
    }
    console.log("[generate-trading-env-readiness-contract] ok");
    console.log(`[generate-trading-env-readiness-contract] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-env-readiness-contract] wrote contract");
  console.log(`[generate-trading-env-readiness-contract] status=${parsed.readiness.status}`);
}

main();
