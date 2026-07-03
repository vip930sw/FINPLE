import { STEP128_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_FLAGS } from "./tradingProviderResponseValidationReviewResultGate.js";

export const STEP129_PROVIDER_CALL_POLICY_FLAGS = Object.freeze({
  ...STEP128_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const PROVIDER_CALL_CACHE_POLICY_SCHEMA = Object.freeze({
  policyId: "string",
  policyType: "provider_call_cache_policy",
  sourceStep: "step129",
  status: "policy_ready | policy_pending | blocked | not_ready",
  storageMode: "policy_only_no_cache_db_write",
  redaction: "metadata_only_no_private_values",
  flags: "all_false",
});

export const PROVIDER_CALL_RATE_LIMIT_POLICY_SCHEMA = Object.freeze({
  policyId: "string",
  policyType: "provider_call_rate_limit_policy",
  sourceStep: "step129",
  status: "policy_ready | policy_pending | blocked | not_ready",
  enforcementMode: "dry_run_only",
  providerCallsAllowed: false,
  flags: "all_false",
});

export const PROVIDER_CALL_AUDIT_DRY_RUN_POLICY_SCHEMA = Object.freeze({
  policyId: "string",
  policyType: "provider_call_audit_dry_run_policy",
  sourceStep: "step129",
  status: "audit_policy_only",
  storageMode: "dry_run_only_no_persistent_db_write",
  redaction: "boolean_status_only_no_raw_values",
  flags: "all_false",
});

export const REDACTED_PROVIDER_CALL_POLICY_STATUS_SCHEMA = Object.freeze({
  schemaId: "step129_redacted_provider_call_policy_status_v1",
  credential: false,
  accountIdentifier: false,
  providerPayload: false,
  orderPayload: false,
  rawProviderResponse: false,
  privatePath: false,
  rawReceipt: false,
  hashValue: false,
  digestValue: false,
});

function makePolicyRedaction(overrides = {}) {
  return {
    schema: "step129_redacted_provider_call_policy_status_v1",
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
    ...overrides,
  };
}

function buildPolicyBlockers(input = {}) {
  const blockers = [
    "actual_provider_call_not_allowed",
    "kis_token_issuance_not_allowed",
    "kis_quote_query_not_allowed",
    "provider_call_readiness_not_promoted",
  ];

  if (input.allowProviderCall === true) blockers.push("provider_call_request_rejected");
  if (input.allowTokenIssuance === true) blockers.push("token_issuance_request_rejected");
  if (input.allowQuoteQuery === true) blockers.push("quote_query_request_rejected");
  if (input.allowOrderSubmission === true) blockers.push("order_submission_request_rejected");
  if (input.allowDbWrite === true) blockers.push("persistent_db_write_request_rejected");

  return blockers;
}

function redactBlockers(blockers, prefix) {
  return blockers.map((_, index) => `${prefix}_${index + 1}`);
}

export function buildProviderCallCachePolicyCore(input = {}, options = {}) {
  const blockers = buildPolicyBlockers(input);

  return {
    policyId: options.cachePolicyId || "step129_provider_call_cache_policy_redacted",
    policyType: "provider_call_cache_policy",
    sourceStep: "step129",
    status: "policy_ready",
    readinessStatus: "not_ready",
    storageMode: "policy_only_no_cache_db_write",
    cacheKeyMode: "redacted_metadata_only",
    cacheTtlSeconds: Number(options.cacheTtlSeconds || 0),
    blockerCount: blockers.length,
    blockerCodes: redactBlockers(blockers, "redacted_provider_call_cache_policy_blocker"),
    flags: { ...STEP129_PROVIDER_CALL_POLICY_FLAGS },
    redaction: makePolicyRedaction(),
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
    cacheDbWriteUsed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
  };
}

export function buildProviderCallRateLimitPolicyCore(input = {}, options = {}) {
  const blockers = buildPolicyBlockers(input);

  return {
    policyId: options.rateLimitPolicyId || "step129_provider_call_rate_limit_policy_redacted",
    policyType: "provider_call_rate_limit_policy",
    sourceStep: "step129",
    status: "policy_ready",
    readinessStatus: "not_ready",
    enforcementMode: "dry_run_only",
    windowSeconds: Number(options.windowSeconds || 0),
    maxCallsPerWindow: Number(options.maxCallsPerWindow || 0),
    providerCallBudgetStatus: "not_ready",
    blockerCount: blockers.length,
    blockerCodes: redactBlockers(blockers, "redacted_provider_call_rate_limit_policy_blocker"),
    flags: { ...STEP129_PROVIDER_CALL_POLICY_FLAGS },
    redaction: makePolicyRedaction(),
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
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
  };
}

export function buildProviderCallAuditDryRunPolicyCore(input = {}, options = {}) {
  const blockers = buildPolicyBlockers(input);

  return {
    policyId: options.auditPolicyId || "step129_provider_call_audit_dry_run_policy_redacted",
    policyType: "provider_call_audit_dry_run_policy",
    sourceStep: "step129",
    status: "audit_policy_only",
    readinessStatus: "not_ready",
    storageMode: "dry_run_only_no_persistent_db_write",
    auditEventMode: "redacted_static_placeholder_only",
    auditEvent: {
      eventType: "provider_call_policy_dry_run",
      status: "dry_run_only",
      provider: "KIS",
      containsCredential: false,
      containsAccountIdentifier: false,
      containsProviderPayload: false,
      containsOrderPayload: false,
      containsRawProviderResponse: false,
    },
    blockerCount: blockers.length,
    blockerCodes: redactBlockers(blockers, "redacted_provider_call_audit_policy_blocker"),
    flags: { ...STEP129_PROVIDER_CALL_POLICY_FLAGS },
    redaction: makePolicyRedaction({
      rawProviderResponseStored: false,
      hashValueStored: false,
      digestValueStored: false,
    }),
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
    auditDbWriteUsed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
  };
}

export function buildAdminProviderCallPolicyStatus(input = {}, options = {}) {
  const cachePolicy = buildProviderCallCachePolicyCore(input, options);
  const rateLimitPolicy = buildProviderCallRateLimitPolicyCore(input, options);
  const auditPolicy = buildProviderCallAuditDryRunPolicyCore(input, options);

  return {
    ok: true,
    step: "Step 129: Add provider-call cache, rate-limit, and audit dry-run policy core",
    status: "admin_only_provider_call_policy_core_fail_closed",
    cachePolicySchema: PROVIDER_CALL_CACHE_POLICY_SCHEMA,
    rateLimitPolicySchema: PROVIDER_CALL_RATE_LIMIT_POLICY_SCHEMA,
    auditDryRunPolicySchema: PROVIDER_CALL_AUDIT_DRY_RUN_POLICY_SCHEMA,
    redactedPolicyStatusSchema: REDACTED_PROVIDER_CALL_POLICY_STATUS_SCHEMA,
    cachePolicy,
    rateLimitPolicy,
    auditPolicy,
    flags: { ...STEP129_PROVIDER_CALL_POLICY_FLAGS },
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
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      orderSubmissionAllowed: false,
      cacheDbWriteRequired: false,
      auditDbWriteRequired: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
