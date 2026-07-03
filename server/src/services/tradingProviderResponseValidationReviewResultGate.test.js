import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminProviderResponseValidationReviewResultStatus,
  buildProviderResponseValidationReview,
  recordProviderResponseValidationReviewResult,
} from "./tradingProviderResponseValidationReviewResultGate.js";

test("provider response validation review does not call provider, issue token, query quote, or submit order", () => {
  let providerCalls = 0;
  let tokenCalls = 0;
  let quoteCalls = 0;
  let orderCalls = 0;
  const review = buildProviderResponseValidationReview({
    callProvider: () => {
      providerCalls += 1;
    },
    issueToken: () => {
      tokenCalls += 1;
    },
    queryQuote: () => {
      quoteCalls += 1;
    },
    submitOrder: () => {
      orderCalls += 1;
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(tokenCalls, 0);
  assert.equal(quoteCalls, 0);
  assert.equal(orderCalls, 0);
  assert.equal(review.providerCallsAllowed, false);
  assert.equal(review.orderSubmissionAllowed, false);
  assert.equal(review.tokenIssuanceAttempted, false);
  assert.equal(review.quoteRequestAttempted, false);
  assert.equal(review.networkCallAttempted, false);
  assert.equal(review.orderSubmissionAttempted, false);
});

test("provider response validation review result recording does not call provider, issue token, query quote, or submit order", () => {
  let providerCalls = 0;
  let tokenCalls = 0;
  let quoteCalls = 0;
  let orderCalls = 0;
  const reviewResult = recordProviderResponseValidationReviewResult({
    callProvider: () => {
      providerCalls += 1;
    },
    issueToken: () => {
      tokenCalls += 1;
    },
    queryQuote: () => {
      quoteCalls += 1;
    },
    submitOrder: () => {
      orderCalls += 1;
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(tokenCalls, 0);
  assert.equal(quoteCalls, 0);
  assert.equal(orderCalls, 0);
  assert.equal(reviewResult.status, "review_recorded");
  assert.equal(reviewResult.providerCallsAllowed, false);
  assert.equal(reviewResult.orderSubmissionAllowed, false);
  assert.equal(reviewResult.persistentStorageUsed, false);
  assert.equal(reviewResult.dbWriteUsed, false);
});

test("review result is redacted and contains no raw or private values", () => {
  const reviewResult = recordProviderResponseValidationReviewResult({
    credential: "secret-app-key",
    accountIdentifier: "50195326-01",
    providerPayload: "provider-payload-value",
    orderPayload: "order-payload-value",
    rawProviderResponse: "raw-provider-response-value",
    privatePath: "C:/private/provider-response-review.json",
    rawReceipt: "raw-receipt-value",
    hashValue: "hash-value",
    digestValue: "digest-value",
  });
  const text = JSON.stringify(reviewResult);

  assert.equal(reviewResult.redaction.containsCredential, false);
  assert.equal(reviewResult.redaction.containsAccountIdentifier, false);
  assert.equal(reviewResult.redaction.containsProviderPayload, false);
  assert.equal(reviewResult.redaction.containsOrderPayload, false);
  assert.equal(reviewResult.redaction.containsPrivatePath, false);
  assert.equal(reviewResult.redaction.containsRawReceipt, false);
  assert.equal(reviewResult.redaction.containsHashValue, false);
  assert.equal(reviewResult.redaction.containsDigestValue, false);
  assert.equal(reviewResult.redaction.containsRawProviderResponse, false);
  assert.equal(reviewResult.sensitivePresence.credentialPresent, false);
  assert.equal(reviewResult.sensitivePresence.accountIdentifierPresent, false);
  assert.equal(reviewResult.sensitivePresence.providerPayloadPresent, false);
  assert.equal(reviewResult.sensitivePresence.orderPayloadPresent, false);
  assert.equal(reviewResult.sensitivePresence.privatePathPresent, false);
  assert.equal(reviewResult.sensitivePresence.rawReceiptPresent, false);
  assert.equal(reviewResult.sensitivePresence.hashValuePresent, false);
  assert.equal(reviewResult.sensitivePresence.digestValuePresent, false);
  assert.equal(reviewResult.sensitivePresence.rawProviderResponsePresent, false);
  assert.equal(text.includes("secret-app-key"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("provider-payload-value"), false);
  assert.equal(text.includes("order-payload-value"), false);
  assert.equal(text.includes("raw-provider-response-value"), false);
  assert.equal(text.includes("C:/private/provider-response-review.json"), false);
  assert.equal(text.includes("raw-receipt-value"), false);
  assert.equal(text.includes("hash-value"), false);
  assert.equal(text.includes("digest-value"), false);
});

test("admin status keeps endpoint boundaries admin-only and all readiness flags false", () => {
  const status = buildAdminProviderResponseValidationReviewResultStatus();

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.publicDashboardExposed, false);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.credentialExposed, false);
  assert.equal(status.boundaries.accountIdentifierExposed, false);
  assert.equal(status.boundaries.providerOrderPayloadExposed, false);
  assert.equal(status.boundaries.privatePathExposed, false);
  assert.equal(status.boundaries.rawReceiptExposed, false);
  assert.equal(status.boundaries.hashValueExposed, false);
  assert.equal(status.boundaries.digestValueExposed, false);
  assert.equal(status.boundaries.rawProviderResponseExposed, false);
  assert.equal(status.boundaries.tokenIssuanceAllowed, false);
  assert.equal(status.boundaries.quoteRequestAllowed, false);
  assert.equal(status.boundaries.orderSubmissionAllowed, false);
  assert.equal(status.boundaries.persistentDbWriteRequired, false);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.runtimeRouteAllowed, false);
  assert.equal(status.flags.publicUiAllowed, false);
  assert.equal(status.flags.dbMigrationAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
});
