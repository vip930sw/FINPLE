import {
  STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS,
  buildReadOnlyProviderResponseEnvelope,
  buildRedactedProviderResponseValidationReceipt,
  validateProviderResponseEnvelopeFields,
} from "./tradingProviderResponseEnvelopeValidationReceipt.js";

export const STEP128_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_FLAGS = Object.freeze({
  ...STEP127_PROVIDER_RESPONSE_VALIDATION_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const PROVIDER_RESPONSE_VALIDATION_REVIEW_SCHEMA = Object.freeze({
  reviewId: "string",
  reviewType: "provider_response_validation_review",
  sourceStep: "step128",
  status: "validation_pending | blocked | not_ready",
  sourceReceipt: "redacted_step127_receipt_only",
  redaction: "metadata_only_no_private_values",
  flags: "all_false",
});

export const PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_SCHEMA = Object.freeze({
  resultId: "string",
  resultType: "provider_response_validation_review_result",
  sourceStep: "step128",
  status: "review_recorded",
  decision: "validation_pending | blocked | not_ready",
  recordingMode: "in_memory_static_placeholder_only",
  redaction: "boolean_status_only_no_raw_values",
  flags: "all_false",
});

export const REDACTED_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_SCHEMA = Object.freeze({
  schemaId: "step128_redacted_provider_response_validation_review_result_v1",
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

function makeReviewRedaction(overrides = {}) {
  return {
    schema: "step128_redacted_provider_response_validation_review_result_v1",
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

function buildReviewChecks(receipt = {}) {
  return [
    {
      name: "source_receipt_is_redacted",
      status: receipt?.redaction?.containsRawProviderResponse === false ? "review_recorded" : "blocked",
    },
    {
      name: "provider_calls_remain_blocked",
      status: receipt?.providerCallsAllowed === false ? "review_recorded" : "blocked",
    },
    {
      name: "order_submission_remains_blocked",
      status: receipt?.orderSubmissionAllowed === false ? "review_recorded" : "blocked",
    },
    {
      name: "readiness_not_promoted",
      status: receipt?.readinessPromoted === false ? "review_recorded" : "blocked",
    },
  ];
}

function blockedFromChecks(checks) {
  return checks.some((check) => check.status === "blocked");
}

export function buildProviderResponseValidationReview(input = {}, options = {}) {
  const envelope = input.envelope || buildReadOnlyProviderResponseEnvelope(input, options);
  const validation = input.validation || validateProviderResponseEnvelopeFields({ envelope }, options);
  const receipt = input.receipt || buildRedactedProviderResponseValidationReceipt({ envelope, validation }, options);
  const checks = buildReviewChecks(receipt);
  const blocked = blockedFromChecks(checks);

  return {
    reviewId: options.reviewId || "step128_provider_response_validation_review_redacted",
    reviewType: "provider_response_validation_review",
    sourceStep: "step128",
    status: blocked ? "blocked" : "validation_pending",
    readinessStatus: "not_ready",
    sourceReceiptStatus: receipt.status || "validation_pending",
    sourceReceiptType: receipt.receiptType || "provider_response_validation_receipt",
    checks,
    checkCount: checks.length,
    blockerCount: checks.filter((check) => check.status === "blocked").length,
    flags: { ...STEP128_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_FLAGS },
    redaction: makeReviewRedaction(),
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
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function recordProviderResponseValidationReviewResult(input = {}, options = {}) {
  const review = input.review || buildProviderResponseValidationReview(input, options);

  return {
    resultId: options.resultId || "step128_provider_response_validation_review_result_redacted",
    resultType: "provider_response_validation_review_result",
    sourceStep: "step128",
    status: "review_recorded",
    decision: review.status === "blocked" ? "blocked" : "validation_pending",
    readinessStatus: "not_ready",
    recordingMode: "in_memory_static_placeholder_only",
    recordingScope: "admin_only_read_only_status",
    reviewStatus: review.status,
    reviewCheckCount: Number(review.checkCount || 0),
    reviewBlockerCount: Number(review.blockerCount || 0),
    flags: { ...STEP128_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_FLAGS },
    redaction: makeReviewRedaction({
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
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    tokenIssuanceAttempted: false,
    quoteRequestAttempted: false,
    networkCallAttempted: false,
    orderSubmissionAttempted: false,
    readinessPromoted: false,
    rawProviderResponseStored: false,
    providerPayloadStored: false,
    orderPayloadStored: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
  };
}

export function buildAdminProviderResponseValidationReviewResultStatus(input = {}, options = {}) {
  const envelope = buildReadOnlyProviderResponseEnvelope(input, options);
  const validation = validateProviderResponseEnvelopeFields({ envelope }, options);
  const receipt = buildRedactedProviderResponseValidationReceipt({ envelope, validation }, options);
  const review = buildProviderResponseValidationReview({ envelope, validation, receipt }, options);
  const reviewResult = recordProviderResponseValidationReviewResult({ review }, options);

  return {
    ok: true,
    step: "Step 128: Add provider response validation review result recording gate",
    status: "admin_only_provider_response_validation_review_result_gate_fail_closed",
    reviewSchema: PROVIDER_RESPONSE_VALIDATION_REVIEW_SCHEMA,
    reviewResultSchema: PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_SCHEMA,
    redactedReviewResultSchema: REDACTED_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_SCHEMA,
    review,
    reviewResult,
    flags: { ...STEP128_PROVIDER_RESPONSE_VALIDATION_REVIEW_RESULT_FLAGS },
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
      dbMigrationRequired: false,
      persistentDbWriteRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
