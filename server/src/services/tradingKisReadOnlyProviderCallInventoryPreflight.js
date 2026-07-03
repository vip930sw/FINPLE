import { STEP125_CLEARANCE_REVIEW_RESULT_FLAGS } from "./tradingManualApprovalClearanceReviewResultGate.js";

export const STEP126_KIS_READ_ONLY_PROVIDER_CALL_FLAGS = Object.freeze({
  ...STEP125_CLEARANCE_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const KIS_READ_ONLY_PROVIDER_CALL_SAFETY_REQUIREMENT_SCHEMA = Object.freeze({
  requiredEnvPresenceStatus: "redacted_boolean_only",
  appKeyConfigured: "redacted_boolean_only",
  appSecretConfigured: "redacted_boolean_only",
  baseUrlConfigured: "redacted_boolean_only",
  accountIdentifierConfigured: "redacted_boolean_only",
  tokenIssuancePolicyStatus: "blocked | pending | opt_in_required",
  quoteOnlyScopeStatus: "blocked | pending | inventory_only",
  providerCallKillSwitchDependency: "blocked | pending",
  providerCallRiskGateDependency: "blocked | pending",
  allowedSymbolsDependency: "blocked | pending",
  shadowDryRunDependency: "blocked | pending",
});

export const KIS_READ_ONLY_CACHE_RATE_LIMIT_AUDIT_REQUIREMENT_SCHEMA = Object.freeze({
  cachePolicyStatus: "blocked | pending | not_ready",
  rateLimitPolicyStatus: "blocked | pending | not_ready",
  auditEventPolicyStatus: "blocked | pending | not_ready",
  persistentStorageUsed: false,
  dbWriteUsed: false,
});

export const REDACTED_KIS_PROVIDER_CALL_INVENTORY_RESULT_SCHEMA = Object.freeze({
  inventoryId: "string",
  inventoryType: "kis_read_only_provider_call_inventory",
  sourceStep: "step126",
  status: "inventory_only",
  provider: "KIS",
  mode: "read_only_quote_preflight_only",
  env: "redacted_boolean_status_only",
  safetyRequirements: KIS_READ_ONLY_PROVIDER_CALL_SAFETY_REQUIREMENT_SCHEMA,
  cacheRateLimitAuditRequirements: KIS_READ_ONLY_CACHE_RATE_LIMIT_AUDIT_REQUIREMENT_SCHEMA,
  flags: "all_false",
  redaction: "metadata_only_no_private_values",
});

const REQUIRED_ENV_KEYS = Object.freeze([
  "kisAppKey",
  "kisAppSecret",
  "kisBaseUrl",
  "accountIdentifier",
]);

function makeRedaction() {
  return {
    schema: "step126_redacted_kis_read_only_provider_call_inventory_v1",
    metadataOnly: true,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    containsPrivatePath: false,
    containsRawReceipt: false,
    containsHashValue: false,
    containsDigestValue: false,
    containsRawEnvValue: false,
  };
}

function configuredBoolean(value) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function redactedEnvStatus(env = {}) {
  return {
    kisAppKeyConfigured: configuredBoolean(env.kisAppKey),
    kisAppSecretConfigured: configuredBoolean(env.kisAppSecret),
    kisBaseUrlConfigured: configuredBoolean(env.kisBaseUrl),
    accountIdentifierConfigured: configuredBoolean(env.accountIdentifier),
  };
}

function dependencyStatus(value) {
  return value === true ? "pending" : "blocked";
}

function policyStatus(value) {
  return value === true ? "pending" : "blocked";
}

function collectBlockers(envStatus, dependencies, policies) {
  const blockers = [];

  if (!envStatus.kisAppKeyConfigured) blockers.push("kis_app_key_not_configured_redacted");
  if (!envStatus.kisAppSecretConfigured) blockers.push("kis_app_secret_not_configured_redacted");
  if (!envStatus.kisBaseUrlConfigured) blockers.push("kis_base_url_not_configured_redacted");
  if (!envStatus.accountIdentifierConfigured) blockers.push("account_identifier_not_configured_redacted");
  if (dependencies.killSwitchCleared !== true) blockers.push("provider_call_kill_switch_not_cleared");
  if (dependencies.riskGateCleared !== true) blockers.push("provider_call_risk_gate_not_cleared");
  if (dependencies.allowedSymbolsReady !== true) blockers.push("allowed_symbols_dependency_not_ready");
  if (dependencies.shadowDryRunReady !== true) blockers.push("shadow_dry_run_dependency_not_ready");
  if (policies.cachePolicyReady !== true) blockers.push("cache_policy_not_ready");
  if (policies.rateLimitPolicyReady !== true) blockers.push("rate_limit_policy_not_ready");
  if (policies.auditEventPolicyReady !== true) blockers.push("audit_event_policy_not_ready");

  blockers.push("explicit_read_only_provider_call_opt_in_required");
  return blockers;
}

function sanitizeBlockers(blockers) {
  return blockers.map((_, index) => `redacted_kis_read_only_inventory_blocker_${index + 1}`);
}

export function buildKisReadOnlyProviderCallInventory(input = {}, options = {}) {
  const envStatus = redactedEnvStatus(input.env || {});
  const dependencies = input.dependencies || {};
  const policies = input.policies || {};
  const blockers = collectBlockers(envStatus, dependencies, policies);

  return {
    inventoryId: options.inventoryId || "step126_kis_read_only_provider_call_inventory_redacted",
    inventoryType: "kis_read_only_provider_call_inventory",
    sourceStep: "step126",
    status: "inventory_only",
    provider: "KIS",
    mode: "read_only_quote_preflight_only",
    requiredEnvPresenceStatus: REQUIRED_ENV_KEYS.every((key) => configuredBoolean(input.env?.[key]))
      ? "configured_redacted"
      : "missing_redacted",
    env: envStatus,
    safetyRequirements: {
      tokenIssuancePolicyStatus: "opt_in_required",
      quoteOnlyScopeStatus: "inventory_only",
      providerCallKillSwitchDependency: dependencyStatus(dependencies.killSwitchCleared),
      providerCallRiskGateDependency: dependencyStatus(dependencies.riskGateCleared),
      allowedSymbolsDependency: dependencyStatus(dependencies.allowedSymbolsReady),
      shadowDryRunDependency: dependencyStatus(dependencies.shadowDryRunReady),
    },
    cacheRateLimitAuditRequirements: {
      cachePolicyStatus: policyStatus(policies.cachePolicyReady),
      rateLimitPolicyStatus: policyStatus(policies.rateLimitPolicyReady),
      auditEventPolicyStatus: policyStatus(policies.auditEventPolicyReady),
      persistentStorageUsed: false,
      dbWriteUsed: false,
    },
    blockerCount: blockers.length,
    blockerCodes: sanitizeBlockers(blockers),
    flags: { ...STEP126_KIS_READ_ONLY_PROVIDER_CALL_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildKisReadOnlyProviderCallOptInPreflight(input = {}, options = {}) {
  const inventory = input.inventory || buildKisReadOnlyProviderCallInventory(input, options);
  const blocked = Number(inventory.blockerCount || 0) > 0;

  return {
    preflightId: options.preflightId || "step126_kis_read_only_provider_call_opt_in_preflight_redacted",
    preflightType: "kis_read_only_provider_call_opt_in_preflight",
    sourceStep: "step126",
    status: blocked ? "opt_in_required" : "pending",
    readinessStatus: "not_ready",
    inventory,
    blockerCount: Number(inventory.blockerCount || 0),
    blockerCodes: Array.isArray(inventory.blockerCodes) ? inventory.blockerCodes.slice() : [],
    flags: { ...STEP126_KIS_READ_ONLY_PROVIDER_CALL_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminKisReadOnlyProviderCallInventoryPreflightStatus(input = {}, options = {}) {
  const inventory = buildKisReadOnlyProviderCallInventory(input, options);
  const preflight = buildKisReadOnlyProviderCallOptInPreflight({ inventory }, options);

  return {
    ok: true,
    step: "Step 126: Add KIS read-only provider-call inventory preflight",
    status: "admin_only_kis_read_only_provider_call_inventory_preflight_fail_closed",
    inventorySchema: REDACTED_KIS_PROVIDER_CALL_INVENTORY_RESULT_SCHEMA,
    safetyRequirementSchema: KIS_READ_ONLY_PROVIDER_CALL_SAFETY_REQUIREMENT_SCHEMA,
    cacheRateLimitAuditRequirementSchema: KIS_READ_ONLY_CACHE_RATE_LIMIT_AUDIT_REQUIREMENT_SCHEMA,
    inventory,
    preflight,
    flags: { ...STEP126_KIS_READ_ONLY_PROVIDER_CALL_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialExposed: false,
      accountIdentifierExposed: false,
      providerOrderPayloadExposed: false,
      privatePathExposed: false,
      rawReceiptExposed: false,
      hashValueExposed: false,
      digestValueExposed: false,
      rawEnvValueExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
