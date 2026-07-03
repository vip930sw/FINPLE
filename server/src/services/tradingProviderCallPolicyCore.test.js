import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminProviderCallPolicyStatus,
  buildProviderCallAuditDryRunPolicyCore,
  buildProviderCallCachePolicyCore,
  buildProviderCallRateLimitPolicyCore,
} from "./tradingProviderCallPolicyCore.js";

test("cache policy core does not call provider, issue token, or query quote", () => {
  let providerCalls = 0;
  let tokenCalls = 0;
  let quoteCalls = 0;
  const policy = buildProviderCallCachePolicyCore({
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
  assert.equal(policy.providerCallsAllowed, false);
  assert.equal(policy.tokenIssuanceAttempted, false);
  assert.equal(policy.quoteRequestAttempted, false);
  assert.equal(policy.networkCallAttempted, false);
  assert.equal(policy.cacheDbWriteUsed, false);
  assert.equal(policy.persistentStorageUsed, false);
  assert.equal(policy.dbWriteUsed, false);
});

test("rate-limit policy core does not call provider or issue token", () => {
  let providerCalls = 0;
  let tokenCalls = 0;
  const policy = buildProviderCallRateLimitPolicyCore({
    callProvider: () => {
      providerCalls += 1;
    },
    issueToken: () => {
      tokenCalls += 1;
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(tokenCalls, 0);
  assert.equal(policy.enforcementMode, "dry_run_only");
  assert.equal(policy.providerCallsAllowed, false);
  assert.equal(policy.tokenIssuanceAttempted, false);
  assert.equal(policy.networkCallAttempted, false);
  assert.equal(policy.readyForReadOnlyProviderCalls, false);
});

test("audit dry-run policy core does not call provider, submit order, or persist DB write", () => {
  let providerCalls = 0;
  let orderCalls = 0;
  let dbWrites = 0;
  const policy = buildProviderCallAuditDryRunPolicyCore({
    callProvider: () => {
      providerCalls += 1;
    },
    submitOrder: () => {
      orderCalls += 1;
    },
    writeAudit: () => {
      dbWrites += 1;
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(orderCalls, 0);
  assert.equal(dbWrites, 0);
  assert.equal(policy.status, "audit_policy_only");
  assert.equal(policy.auditDbWriteUsed, false);
  assert.equal(policy.persistentStorageUsed, false);
  assert.equal(policy.dbWriteUsed, false);
  assert.equal(policy.orderSubmissionAllowed, false);
  assert.equal(policy.orderSubmissionAttempted, false);
});

test("policy result is redacted and contains no raw or private values", () => {
  const status = buildAdminProviderCallPolicyStatus({
    credential: "secret-app-key",
    accountIdentifier: "50195326-01",
    providerPayload: "provider-payload-value",
    orderPayload: "order-payload-value",
    rawProviderResponse: "raw-provider-response-value",
    privatePath: "C:/private/provider-call-policy.json",
    rawReceipt: "raw-receipt-value",
    hashValue: "hash-value",
    digestValue: "digest-value",
  });
  const text = JSON.stringify(status);

  assert.equal(status.boundaries.credentialExposed, false);
  assert.equal(status.boundaries.accountIdentifierExposed, false);
  assert.equal(status.boundaries.providerOrderPayloadExposed, false);
  assert.equal(status.boundaries.privatePathExposed, false);
  assert.equal(status.boundaries.rawReceiptExposed, false);
  assert.equal(status.boundaries.hashValueExposed, false);
  assert.equal(status.boundaries.digestValueExposed, false);
  assert.equal(status.boundaries.rawProviderResponseExposed, false);
  assert.equal(status.cachePolicy.redaction.containsCredential, false);
  assert.equal(status.rateLimitPolicy.redaction.containsAccountIdentifier, false);
  assert.equal(status.auditPolicy.redaction.containsRawProviderResponse, false);
  assert.equal(text.includes("secret-app-key"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("provider-payload-value"), false);
  assert.equal(text.includes("order-payload-value"), false);
  assert.equal(text.includes("raw-provider-response-value"), false);
  assert.equal(text.includes("C:/private/provider-call-policy.json"), false);
  assert.equal(text.includes("raw-receipt-value"), false);
  assert.equal(text.includes("hash-value"), false);
  assert.equal(text.includes("digest-value"), false);
});

test("admin provider-call policy status keeps all readiness flags false", () => {
  const status = buildAdminProviderCallPolicyStatus();

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.tokenIssuanceAllowed, false);
  assert.equal(status.boundaries.quoteRequestAllowed, false);
  assert.equal(status.boundaries.orderSubmissionAllowed, false);
  assert.equal(status.boundaries.cacheDbWriteRequired, false);
  assert.equal(status.boundaries.auditDbWriteRequired, false);
  assert.equal(status.boundaries.persistentDbWriteRequired, false);
  assert.equal(status.flags.providerCallsAllowed, false);
  assert.equal(status.flags.orderSubmissionAllowed, false);
  assert.equal(status.flags.runtimeRouteAllowed, false);
  assert.equal(status.flags.publicUiAllowed, false);
  assert.equal(status.flags.dbMigrationAllowed, false);
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
});
