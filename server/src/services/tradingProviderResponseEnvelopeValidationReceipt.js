import { STEP126_KIS_READ_ONLY_PROVIDER_CALL_FLAGS } from "./tradingKisReadOnlyProviderCallInventoryPreflight.js";

export const STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS = Object.freeze({
  ...STEP126_KIS_READ_ONLY_PROVIDER_CALL_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_SCHEMA = Object.freeze({
  envelopeId: "string",
  envelopeType: "read_only_provider_response_envelope",
  sourceStep: "step127",
  status: "envelope_only",
  mode: "mock_only",
  provider: "KIS",
  responseShape: "redacted_field_status_only",
  redaction: "metadata_only_no_private_values",
  flags: "all_false",
});

export const PROVIDER_RESPONSE_VALIDATION_RECEIPT_SCHEMA = Object.freeze({
  receiptId: "string",
  receiptType: "provider_response_validation_receipt",
  sourceStep: "step127",
  status: "validation_pending",
  envelopeStatus: "envelope_only",
  validationStatus: "blocked | validation_pending | not_ready",
  redaction: "boolean_status_only_no_raw_values",
  flags: "all_false",
});

export const PROVIDER_RESPONSE_FIELD_VALIDATION_CORE_SCHEMA = Object.freeze({
  validationId: "string",
  validationType: "provider_response_field_validation_core",
  sourceStep: "step127",
  status: "validation_pending",
  validatedSource: "mock_static_placeholder_only",
  providerCallsAllowed: false,
  readyForReadOnlyProviderCalls: false,
});

function makeRedaction(overrides = {}) {
  return {
    schema: "step127_redacted_provider_response_validation_v1",
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

function clean(value) {
  return String(value ?? "").trim();
}

function statusForPresence(value) {
  return clean(value).length > 0 ? "present_redacted" : "missing_redacted";
}

function buildRedactedFieldStatus(input = {}) {
  return {
    providerStatus: statusForPresence(input.providerStatus || "mock_static"),
    quoteStatus: statusForPresence(input.quoteStatus || "mock_static"),
    symbolStatus: statusForPresence(input.symbol || "REDACTED_SYMBOL"),
    currencyStatus: statusForPresence(input.currency || "REDACTED_CURRENCY"),
    priceFieldStatus: statusForPresence(input.priceField || "mock_static_price_field"),
    freshnessFieldStatus: statusForPresence(input.freshnessField || "mock_static_freshness_field"),
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
  };
}

function collectEnvelopeBlockers(input = {}) {
  const blockers = [
    "actual_provider_response_not_supplied",
    "provider_call_opt_in_not_granted",
    "token_issuance_not_allowed",
    "quote_query_not_allowed",
    "validation_receipt_review_pending",
  ];

  if (input.allowProviderCall === true) blockers.push("provider_call_request_rejected");
  if (input.allowTokenIssuance === true) blockers.push("token_issuance_request_rejected");
  if (input.allowQuoteQuery === true) blockers.push("quote_query_request_rejected");
  if (input.allowOrderSubmission === true) blockers.push("order_submission_request_rejected");

  return blockers;
}

function redactBlockers(blockers) {
  return blockers.map((_, index) => `redacted_provider_response_validation_blocker_${index + 1}`);
}

export function buildReadOnlyProviderResponseEnvelope(input = {}, options = {}) {
  const blockers = collectEnvelopeBlockers(input);

  return {
    envelopeId: options.envelopeId || "step127_read_only_provider_response_envelope_redacted",
    envelopeType: "read_only_provider_response_envelope",
    sourceStep: "step127",
    status: "envelope_only",
    readinessStatus: "not_ready",
    provider: "KIS",
    mode: "mock_only",
    responseShape: buildRedactedFieldStatus(input.mockResponse || {}),
    blockerCount: blockers.length,
    blockerCodes: redactBlockers(blockers),
    flags: { ...STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function validateProviderResponseEnvelopeFields(input = {}, options = {}) {
  const envelope = input.envelope || buildReadOnlyProviderResponseEnvelope(input, options);
  const validationChecks = [
    {
      name: "envelope_is_mock_only",
      status: envelope.mode === "mock_only" ? "validation_pending" : "blocked",
    },
    {
      name: "provider_calls_remain_blocked",
      status: envelope.providerCallsAllowed === false ? "validation_pending" : "blocked",
    },
    {
      name: "raw_provider_response_absent",
      status: envelope.rawProviderResponseStored === false ? "validation_pending" : "blocked",
    },
    {
      name: "redaction_boundaries_clear",
      status: envelope.redaction?.containsCredential === false &&
        envelope.redaction?.containsAccountIdentifier === false &&
        envelope.redaction?.containsProviderPayload === false &&
        envelope.redaction?.containsOrderPayload === false &&
        envelope.redaction?.containsRawProviderResponse === false
        ? "validation_pending"
        : "blocked",
    },
  ];
  const blocked = validationChecks.some((check) => check.status === "blocked");

  return {
    validationId: options.validationId || "step127_provider_response_field_validation_redacted",
    validationType: "provider_response_field_validation_core",
    sourceStep: "step127",
    status: blocked ? "blocked" : "validation_pending",
    readinessStatus: "not_ready",
    validatedSource: "mock_static_placeholder_only",
    checks: validationChecks,
    blockerCount: blocked ? 1 : 0,
    flags: { ...STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS },
    redaction: makeRedaction(),
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    rawProviderResponseStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildRedactedProviderResponseValidationReceipt(input = {}, options = {}) {
  const envelope = input.envelope || buildReadOnlyProviderResponseEnvelope(input, options);
  const validation = input.validation || validateProviderResponseEnvelopeFields({ envelope }, options);

  return {
    receiptId: options.receiptId || "step127_provider_response_validation_receipt_redacted",
    receiptType: "provider_response_validation_receipt",
    sourceStep: "step127",
    status: validation.status === "blocked" ? "blocked" : "validation_pending",
    readinessStatus: "not_ready",
    envelopeStatus: envelope.status,
    validationStatus: validation.status,
    validationCheckCount: Array.isArray(validation.checks) ? validation.checks.length : 0,
    flags: { ...STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS },
    redaction: makeRedaction({
      rawProviderResponseStored: false,
      hashValueStored: false,
      digestValueStored: false,
    }),
    sensitivePresence: {
      credentialPresent: false,
      accountIdentifierPresent: false,
      providerPayloadPresent: false,
      orderPayloadPresent: false,
      privatePathPresent: false,
      rawReceiptPresent: false,
      hashValuePresent: false,
      digestValuePresent: false,
      rawProviderResponsePresent: false,
    },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    readinessPromoted: false,
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminProviderResponseEnvelopeValidationStatus(input = {}, options = {}) {
  const envelope = buildReadOnlyProviderResponseEnvelope(input, options);
  const validation = validateProviderResponseEnvelopeFields({ envelope }, options);
  const receipt = buildRedactedProviderResponseValidationReceipt({ envelope, validation }, options);

  return {
    ok: true,
    step: "Step 127: Add read-only provider response envelope and validation receipt core",
    status: "admin_only_provider_response_envelope_validation_receipt_fail_closed",
    envelopeSchema: READ_ONLY_PROVIDER_RESPONSE_ENVELOPE_SCHEMA,
    validationReceiptSchema: PROVIDER_RESPONSE_VALIDATION_RECEIPT_SCHEMA,
    fieldValidationCoreSchema: PROVIDER_RESPONSE_FIELD_VALIDATION_CORE_SCHEMA,
    envelope,
    validation,
    receipt,
    flags: { ...STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
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
      rawProviderResponseExposed: false,
      tokenIssuanceAllowed: false,
      quoteRequestAllowed: false,
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
