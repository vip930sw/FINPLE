import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminKisReadOnlyProviderCallInventoryPreflightStatus,
  buildKisReadOnlyProviderCallInventory,
  buildKisReadOnlyProviderCallOptInPreflight,
} from "./tradingKisReadOnlyProviderCallInventoryPreflight.js";

test("KIS provider-call inventory does not call provider or issue token", () => {
  let tokenCalls = 0;
  let providerCalls = 0;
  const inventory = buildKisReadOnlyProviderCallInventory(
    {
      issueToken: () => {
        tokenCalls += 1;
      },
      callProvider: () => {
        providerCalls += 1;
      },
    },
    { inventoryId: "test_inventory" },
  );

  assert.equal(tokenCalls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(inventory.providerCallsAllowed, false);
  assert.equal(inventory.tokenIssuanceAttempted, false);
  assert.equal(inventory.quoteRequestAttempted, false);
  assert.equal(inventory.networkCallAttempted, false);
});

test("KIS read-only opt-in preflight does not call provider, issue token, or submit order", () => {
  let tokenCalls = 0;
  let providerCalls = 0;
  let orderCalls = 0;
  const preflight = buildKisReadOnlyProviderCallOptInPreflight({
    issueToken: () => {
      tokenCalls += 1;
    },
    callProvider: () => {
      providerCalls += 1;
    },
    submitOrder: () => {
      orderCalls += 1;
    },
  });

  assert.equal(tokenCalls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(orderCalls, 0);
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.tokenIssuanceAttempted, false);
  assert.equal(preflight.quoteRequestAttempted, false);
  assert.equal(preflight.networkCallAttempted, false);
});

test("inventory result is redacted and contains no private values", () => {
  const inventory = buildKisReadOnlyProviderCallInventory({
    env: {
      kisAppKey: "secret-app-key",
      kisAppSecret: "secret-app-secret",
      kisBaseUrl: "https://example.invalid/private",
      accountIdentifier: "50195326-01",
    },
    credential: "raw-credential",
    providerPayload: { raw: true },
    orderPayload: { raw: true },
    privatePath: "local-private-path",
    rawReceipt: "raw-receipt-value",
    hashValue: "hash-value",
  });
  const text = JSON.stringify(inventory);

  assert.equal(inventory.env.kisAppKeyConfigured, true);
  assert.equal(inventory.env.kisAppSecretConfigured, true);
  assert.equal(inventory.env.kisBaseUrlConfigured, true);
  assert.equal(inventory.env.accountIdentifierConfigured, true);
  assert.equal(inventory.redaction.containsCredential, false);
  assert.equal(inventory.redaction.containsAccountIdentifier, false);
  assert.equal(inventory.redaction.containsProviderPayload, false);
  assert.equal(inventory.redaction.containsOrderPayload, false);
  assert.equal(inventory.redaction.containsPrivatePath, false);
  assert.equal(inventory.redaction.containsRawReceipt, false);
  assert.equal(inventory.redaction.containsHashValue, false);
  assert.equal(inventory.redaction.containsRawEnvValue, false);
  assert.equal(text.includes("secret-app-key"), false);
  assert.equal(text.includes("secret-app-secret"), false);
  assert.equal(text.includes("https://example.invalid/private"), false);
  assert.equal(text.includes("50195326-01"), false);
  assert.equal(text.includes("raw-credential"), false);
  assert.equal(text.includes("local-private-path"), false);
  assert.equal(text.includes("raw-receipt-value"), false);
  assert.equal(text.includes("hash-value"), false);
});

test("missing env and missing policies keep read-only provider preflight blocked", () => {
  const preflight = buildKisReadOnlyProviderCallOptInPreflight({});

  assert.equal(preflight.status, "opt_in_required");
  assert.equal(preflight.readinessStatus, "not_ready");
  assert.ok(preflight.blockerCount > 0);
  assert.equal(preflight.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(preflight.providerCallsAllowed, false);
});

test("cache, rate-limit, audit, kill-switch, and risk dependencies remain required", () => {
  const inventory = buildKisReadOnlyProviderCallInventory({
    env: {
      kisAppKey: "configured",
      kisAppSecret: "configured",
      kisBaseUrl: "configured",
      accountIdentifier: "configured",
    },
    dependencies: {
      killSwitchCleared: false,
      riskGateCleared: false,
      allowedSymbolsReady: false,
      shadowDryRunReady: false,
    },
    policies: {
      cachePolicyReady: false,
      rateLimitPolicyReady: false,
      auditEventPolicyReady: false,
    },
  });

  assert.equal(inventory.safetyRequirements.providerCallKillSwitchDependency, "blocked");
  assert.equal(inventory.safetyRequirements.providerCallRiskGateDependency, "blocked");
  assert.equal(inventory.safetyRequirements.allowedSymbolsDependency, "blocked");
  assert.equal(inventory.safetyRequirements.shadowDryRunDependency, "blocked");
  assert.equal(inventory.cacheRateLimitAuditRequirements.cachePolicyStatus, "blocked");
  assert.equal(inventory.cacheRateLimitAuditRequirements.rateLimitPolicyStatus, "blocked");
  assert.equal(inventory.cacheRateLimitAuditRequirements.auditEventPolicyStatus, "blocked");
});

test("admin KIS provider-call inventory status keeps readiness flags false and boundaries private", () => {
  const status = buildAdminKisReadOnlyProviderCallInventoryPreflightStatus();

  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.credentialExposed, false);
  assert.equal(status.boundaries.accountIdentifierExposed, false);
  assert.equal(status.boundaries.providerOrderPayloadExposed, false);
  assert.equal(status.boundaries.privatePathExposed, false);
  assert.equal(status.boundaries.rawReceiptExposed, false);
  assert.equal(status.boundaries.hashValueExposed, false);
  assert.equal(status.boundaries.rawEnvValueExposed, false);
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
