import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminProviderResponseEnvelopeValidationStatus,
  buildReadOnlyProviderResponseEnvelope,
  buildRedactedProviderResponseValidationReceipt,
  validateProviderResponseEnvelopeFields,
} from "./tradingProviderResponseEnvelopeValidationReceipt.js";

test("provider response envelope builder does not call provider, issue token, or query quote", () => {
  let providerCalls = 0;
  let tokenCalls = 0;
  let quoteCalls = 0;
  const envelope = buildReadOnlyProviderResponseEnvelope({
    callProvider: () => {
      providerCalls += 1;
    },
    issueToken: () => {
      tokenCalls += 1;
    },
    queryQuote: () => {
      quoteCalls += 1;
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(tokenCalls, 0);
  assert.equal(quoteCalls, 0);
  assert.equal(envelope.providerCallsAllowed, false);
  assert.equal(envelope.tokenIssuanceAttempted, false);
  assert.equal(envelope.quoteRequestAttempted, false);
  assert.equal(envelope.networkCallAttempted, false);
});

test("validation receipt builder does not call provider, issue token, or submit order", () => {
  let providerCalls = 0;
  let tokenCalls = 0;
  let orderCalls = 0;
  const receipt = buildRedactedProviderResponseValidationReceipt({
    callProvider: () => {
      providerCalls += 1;
    },
    issueToken: () => {
      tokenCalls += 1;
    },
    submitOrder: () => {
      orderCalls += 1;
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(tokenCalls, 0);
  assert.equal(orderCalls, 0);
  assert.equal(receipt.providerCallsAllowed, false);
  assert.equal(receipt.orderSubmissionAllowed, false);
  assert.equal(receipt.tokenIssuanceAttempted, false);
});

test("envelope result is redacted and contains no private values", () => {
  const envelope = buildReadOnlyProviderResponseEnvelope({
    credential: "secret-app-key",
    accountIdentifier: "50195326-01",
    providerPayload: { raw: "provider-payload-value" },
    orderPayload: { raw: "order-payload-value" },
    privatePath: "C:/private/provider-response.json",
    rawReceipt: "raw-receipt-value",
    hashValue: "hash-value",
    digestValue: "digest-value",
    rawProviderResponse: { price: 12345 },
  });
  const text = JSON.stringify(envelope);

  assert.equal(envelope.redaction.containsCredential, false);
  assert.equal(envelope.redaction.containsAccountIdentifier, false);
  assert.equal(envelope.redaction.containsProviderPayload, false);
  assert.equal(envelope.redaction.containsOrderPayload, false);
  assert.equal(envelope.redaction.containsPrivatePath, false);
  assert.equal(envelope.redaction.containsRawReceipt, false);
  assert.equal(envelope.redaction.containsHashValue, false);
  assert.equal(envelope.redaction.containsDigestValue, false);
  assert.equal(envelope.redaction.containsRawProviderResponse, false);
  assert.equal(text.includes("secret-app-key"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("provider-payload-value"), false);
  assert.equal(text.includes("order-payload-value"), false);
  assert.equal(text.includes("C:/private/provider-response.json"), false);
  assert.equal(text.includes("raw-receipt-value"), false);
  assert.equal(text.includes("hash-value"), false);
  assert.equal(text.includes("digest-value"), false);
  assert.equal(text.includes("12345"), false);
});

test("validation receipt is redacted and stores no raw provider response or hash value", () => {
  const receipt = buildRedactedProviderResponseValidationReceipt({
    rawProviderResponse: { quote: "raw-provider-response-value" },
    credential: "secret-app-secret",
    accountIdentifier: "50195326-01",
    providerPayload: "provider-payload-value",
    orderPayload: "order-payload-value",
    privatePath: "C:/private/receipt.json",
    rawReceipt: "raw-receipt-value",
    hashValue: "hash-value",
    digestValue: "digest-value",
  });
  const text = JSON.stringify(receipt);

  assert.equal(receipt.redaction.containsRawProviderResponse, false);
  assert.equal(receipt.redaction.containsCredential, false);
  assert.equal(receipt.redaction.containsAccountIdentifier, false);
  assert.equal(receipt.redaction.containsProviderPayload, false);
  assert.equal(receipt.redaction.containsOrderPayload, false);
  assert.equal(receipt.redaction.containsPrivatePath, false);
  assert.equal(receipt.redaction.containsRawReceipt, false);
  assert.equal(receipt.redaction.containsHashValue, false);
  assert.equal(receipt.redaction.containsDigestValue, false);
  assert.equal(receipt.sensitivePresence.rawProviderResponsePresent, false);
  assert.equal(receipt.sensitivePresence.hashValuePresent, false);
  assert.equal(receipt.sensitivePresence.digestValuePresent, false);
  assert.equal(text.includes("raw-provider-response-value"), false);
  assert.equal(text.includes("secret-app-secret"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("provider-payload-value"), false);
  assert.equal(text.includes("order-payload-value"), false);
  assert.equal(text.includes("C:/private/receipt.json"), false);
  assert.equal(text.includes("raw-receipt-value"), false);
  assert.equal(text.includes("hash-value"), false);
  assert.equal(text.includes("digest-value"), false);
});

test("field validation core only validates mock static placeholders", () => {
  const validation = validateProviderResponseEnvelopeFields({});

  assert.equal(validation.validatedSource, "mock_static_placeholder_only");
  assert.equal(validation.status, "validation_pending");
  assert.equal(validation.providerCallsAllowed, false);
  assert.equal(validation.readyForReadOnlyProviderCalls, false);
  assert.equal(validation.readyForOrderSubmission, false);
  assert.equal(validation.readyForLiveGuardedTrading, false);
  assert.equal(validation.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(validation.networkCallAttempted, false);
});

test("admin status keeps all readiness flags false and boundaries private", () => {
  const status = buildAdminProviderResponseEnvelopeValidationStatus();

  assert.equal(status.boundaries.adminOnly, true);
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
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.runtimeRouteAllowed, false);
  assert.equal(status.flags.publicUiAllowed, false);
  assert.equal(status.flags.dbMigrationAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
});
