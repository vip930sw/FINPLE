import { buildAdminProviderCallPolicyStatus, STEP129_PROVIDER_CALL_POLICY_FLAGS } from "./tradingProviderCallPolicyCore.js";
import { buildAdminProviderResponseValidationReviewResultStatus } from "./tradingProviderResponseValidationReviewResultGate.js";

export const STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS = Object.freeze({
  ...STEP129_PROVIDER_CALL_POLICY_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_BOUNDARY_SCHEMA = Object.freeze({
  boundaryId: "string",
  boundaryType: "kis_read_only_quote_adapter_opt_in_boundary",
  sourceStep: "step130",
  status: "adapter_boundary_ready | opt_in_required | adapter_blocked | not_ready",
  mode: "preflight_only",
  provider: "KIS",
  redaction: "boolean_status_only_no_raw_config_values",
  flags: "all_false",
});

export const KIS_QUOTE_ADAPTER_READINESS_PREFLIGHT_SCHEMA = Object.freeze({
  preflightId: "string",
  preflightType: "kis_quote_adapter_readiness_preflight",
  sourceStep: "step130",
  status: "adapter_blocked | opt_in_required | not_ready | preflight_only",
  dependencyStatus: "blocked | pending | policy_ready",
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  readyForReadOnlyProviderCalls: false,
});

export const REDACTED_KIS_ADAPTER_CONFIG_STATUS_SCHEMA = Object.freeze({
  schemaId: "step130_redacted_kis_adapter_config_status_v1",
  credential: false,
  accountIdentifier: false,
  baseUrlRawValue: false,
  providerPayload: false,
  orderPayload: false,
  rawProviderResponse: false,
  privatePath: false,
  rawReceipt: false,
  hashValue: false,
  digestValue: false,
});

function clean(value) {
  return String(value ?? "").trim();
}

function statusForPresence(value) {
  return clean(value).length > 0 ? "configured_redacted" : "missing_redacted";
}

function makeRedaction(overrides = {}) {
  return {
    schema: "step130_redacted_kis_adapter_config_status_v1",
    metadataOnly: true,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    containsPrivatePath: false,
    containsRawReceipt: false,
    containsHashValue: false,
    containsDigestValue: false,
    containsRawProviderResponse: false,
    containsRawEnvValue: false,
    containsBaseUrlRawValue: false,
    ...overrides,
  };
}

function redactedBlockers(blockers) {
  return blockers.map((_, index) => `redacted_kis_quote_adapter_preflight_blocker_${index + 1}`);
}

function dependencyReady(status) {
  return status === "policy_ready" || status === "audit_policy_only" || status === "review_recorded";
}

function buildDependencyChecks(input = {}) {
  const providerPolicyStatus = input.providerPolicyStatus || buildAdminProviderCallPolicyStatus();
  const responseValidationReviewStatus =
    input.responseValidationReviewStatus || buildAdminProviderResponseValidationReviewResultStatus();
  const cachePolicyStatus = input.cachePolicyStatus || providerPolicyStatus?.cachePolicy?.status || "policy_pending";
  const rateLimitPolicyStatus = input.rateLimitPolicyStatus || providerPolicyStatus?.rateLimitPolicy?.status || "policy_pending";
  const auditPolicyStatus = input.auditPolicyStatus || providerPolicyStatus?.auditPolicy?.status || "policy_pending";
  const providerResponseValidationStatus =
    input.providerResponseValidationStatus ||
    responseValidationReviewStatus?.reviewResult?.decision ||
    responseValidationReviewStatus?.reviewResult?.status ||
    "validation_pending";

  return [
    {
      name: "provider_call_cache_policy",
      status: dependencyReady(cachePolicyStatus) ? "policy_ready" : "pending",
      sourceStatus: cachePolicyStatus,
    },
    {
      name: "provider_call_rate_limit_policy",
      status: dependencyReady(rateLimitPolicyStatus) ? "policy_ready" : "pending",
      sourceStatus: rateLimitPolicyStatus,
    },
    {
      name: "provider_call_audit_policy",
      status: dependencyReady(auditPolicyStatus) ? "policy_ready" : "pending",
      sourceStatus: auditPolicyStatus,
    },
    {
      name: "provider_response_validation_review",
      status: providerResponseValidationStatus === "review_recorded" ? "pending" : "pending",
      sourceStatus: providerResponseValidationStatus,
    },
  ];
}

function buildOperationalChecks(input = {}) {
  const killSwitchBlocking = input.killSwitchBlocking !== false;
  const riskGateBlocking = input.riskGateBlocking !== false;
  const allowedSymbolsSafe = input.allowedSymbolsSafe === true;
  const optInGranted = input.optInGranted === true;

  return [
    {
      name: "kis_adapter_opt_in",
      status: optInGranted ? "pending" : "opt_in_required",
    },
    {
      name: "kill_switch",
      status: killSwitchBlocking ? "blocked" : "pending",
    },
    {
      name: "risk_gate",
      status: riskGateBlocking ? "blocked" : "pending",
    },
    {
      name: "allowed_symbols",
      status: allowedSymbolsSafe ? "pending" : "blocked",
    },
  ];
}

function collectBlockers(checks) {
  return checks.filter((check) => check.status !== "policy_ready" && check.status !== "adapter_boundary_ready");
}

export function buildRedactedKisAdapterConfigStatus(input = {}, options = {}) {
  return {
    configStatusId: options.configStatusId || "step130_redacted_kis_adapter_config_status",
    sourceStep: "step130",
    status: "redacted_status_only",
    provider: "KIS",
    appKeyStatus: statusForPresence(input.appKey),
    appSecretStatus: statusForPresence(input.appSecret),
    accountIdentifierStatus: statusForPresence(input.accountIdentifier),
    baseUrlStatus: statusForPresence(input.baseUrl),
    redaction: makeRedaction(),
    sensitivePresence: {
      credentialPresent: false,
      accountIdentifierPresent: false,
      providerPayloadPresent: false,
      orderPayloadPresent: false,
      rawProviderResponsePresent: false,
      baseUrlRawValuePresent: false,
    },
    rawConfigValueReturned: false,
    credentialExposed: false,
    accountIdentifierExposed: false,
    baseUrlRawValueExposed: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    rawProviderResponseStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildKisReadOnlyQuoteAdapterOptInBoundary(input = {}, options = {}) {
  const configStatus = input.configStatus || buildRedactedKisAdapterConfigStatus(input.config || {}, options);

  return {
    boundaryId: options.boundaryId || "step130_kis_read_only_quote_adapter_opt_in_boundary",
    boundaryType: "kis_read_only_quote_adapter_opt_in_boundary",
    sourceStep: "step130",
    status: "adapter_boundary_ready",
    readinessStatus: "not_ready",
    mode: "preflight_only",
    provider: "KIS",
    adapterImplementation: "boundary_only_no_live_adapter",
    configStatus,
    flags: { ...STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    adapterCallEnabled: false,
    liveAdapterImplemented: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildKisQuoteAdapterReadinessPreflight(input = {}, options = {}) {
  const boundary = input.boundary || buildKisReadOnlyQuoteAdapterOptInBoundary(input, options);
  const checks = [
    ...buildDependencyChecks(input.dependencies || input),
    ...buildOperationalChecks(input),
    {
      name: "adapter_boundary",
      status: boundary.status === "adapter_boundary_ready" ? "adapter_boundary_ready" : "blocked",
    },
  ];
  const blockers = collectBlockers(checks);
  const hasBlocked = blockers.some((check) => check.status === "blocked");
  const hasOptInRequired = blockers.some((check) => check.status === "opt_in_required");

  return {
    preflightId: options.preflightId || "step130_kis_quote_adapter_readiness_preflight",
    preflightType: "kis_quote_adapter_readiness_preflight",
    sourceStep: "step130",
    status: hasBlocked ? "adapter_blocked" : hasOptInRequired ? "opt_in_required" : "not_ready",
    readinessStatus: "not_ready",
    dependencyStatus: blockers.length > 0 ? "pending" : "policy_ready",
    mode: "preflight_only",
    provider: "KIS",
    checks,
    blockerCount: blockers.length,
    blockerCodes: redactedBlockers(blockers),
    flags: { ...STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    adapterCallEnabled: false,
    liveAdapterImplemented: false,
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus(input = {}, options = {}) {
  const configStatus = buildRedactedKisAdapterConfigStatus(input.config || {}, options);
  const boundary = buildKisReadOnlyQuoteAdapterOptInBoundary({ ...input, configStatus }, options);
  const preflight = buildKisQuoteAdapterReadinessPreflight({ ...input, boundary }, options);

  return {
    ok: true,
    step: "Step 130: Add KIS read-only quote adapter opt-in preflight boundary",
    status: "admin_only_kis_read_only_quote_adapter_opt_in_preflight_fail_closed",
    boundarySchema: KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_BOUNDARY_SCHEMA,
    preflightSchema: KIS_QUOTE_ADAPTER_READINESS_PREFLIGHT_SCHEMA,
    redactedConfigStatusSchema: REDACTED_KIS_ADAPTER_CONFIG_STATUS_SCHEMA,
    configStatus,
    boundary,
    preflight,
    flags: { ...STEP130_KIS_READ_ONLY_QUOTE_ADAPTER_OPT_IN_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
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
      rawProviderResponseExposed: false,
      baseUrlRawValueExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      providerCallAllowed: false,
      liveAdapterImplemented: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
