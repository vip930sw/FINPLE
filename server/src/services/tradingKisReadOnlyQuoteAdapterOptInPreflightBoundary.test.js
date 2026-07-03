import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus,
  buildKisQuoteAdapterReadinessPreflight,
  buildRedactedKisAdapterConfigStatus,
} from "./tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js";

test("KIS quote adapter opt-in preflight stays fail-closed and does not attempt provider work", () => {
  const status = buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus();

  assert.equal(status.ok, true);
  assert.equal(status.status, "admin_only_kis_read_only_quote_adapter_opt_in_preflight_fail_closed");
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.tokenIssuanceAttempted, false);
  assert.equal(status.quoteRequestAttempted, false);
  assert.equal(status.networkCallAttempted, false);
  assert.equal(status.orderSubmissionAttempted, false);
  assert.equal(status.readinessPromoted, false);
  assert.equal(status.persistentStorageUsed, false);
  assert.equal(status.dbWriteUsed, false);
  assert.equal(status.boundaries.adminOnly, true);
  assert.equal(status.boundaries.publicDashboardExposed, false);
  assert.equal(status.boundaries.myPageDashboardExposed, false);
  assert.equal(status.boundaries.homepageDashboardExposed, false);
  assert.equal(status.boundaries.tokenIssuanceAllowed, false);
  assert.equal(status.boundaries.quoteRequestAllowed, false);
  assert.equal(status.boundaries.providerCallAllowed, false);
});

test("redacted KIS adapter config status never returns raw private values", () => {
  const privateValues = {
    appKey: "APP_KEY_SHOULD_NOT_LEAK",
    appSecret: "APP_SECRET_SHOULD_NOT_LEAK",
    accountIdentifier: "ACCOUNT_ID_SHOULD_NOT_LEAK",
    baseUrl: "https://kis.example.invalid/private",
  };
  const status = buildRedactedKisAdapterConfigStatus(privateValues);
  const serialized = JSON.stringify(status);

  assert.equal(status.appKeyStatus, "configured_redacted");
  assert.equal(status.appSecretStatus, "configured_redacted");
  assert.equal(status.accountIdentifierStatus, "configured_redacted");
  assert.equal(status.baseUrlStatus, "configured_redacted");
  assert.equal(status.credentialExposed, false);
  assert.equal(status.accountIdentifierExposed, false);
  assert.equal(status.baseUrlRawValueExposed, false);
  assert.equal(status.rawConfigValueReturned, false);
  for (const value of Object.values(privateValues)) {
    assert.equal(serialized.includes(value), false);
  }
});

test("missing dependency policies, kill-switch, risk gate, and unsafe symbols block preflight", () => {
  const preflight = buildKisQuoteAdapterReadinessPreflight({
    dependencies: {
      cachePolicyStatus: "policy_pending",
      rateLimitPolicyStatus: "blocked",
      auditPolicyStatus: "policy_pending",
      providerResponseValidationStatus: "validation_pending",
    },
    killSwitchBlocking: true,
    riskGateBlocking: true,
    allowedSymbolsSafe: false,
    optInGranted: false,
  });

  assert.equal(preflight.status, "adapter_blocked");
  assert.equal(preflight.dependencyStatus, "pending");
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.orderSubmissionAllowed, false);
  assert.equal(preflight.readyForReadOnlyProviderCalls, false);
  assert.ok(preflight.blockerCount >= 7);
  assert.ok(preflight.checks.some((check) => check.name === "provider_call_cache_policy" && check.status === "pending"));
  assert.ok(preflight.checks.some((check) => check.name === "provider_call_rate_limit_policy" && check.status === "pending"));
  assert.ok(preflight.checks.some((check) => check.name === "provider_call_audit_policy" && check.status === "pending"));
  assert.ok(preflight.checks.some((check) => check.name === "provider_response_validation_review" && check.status === "pending"));
  assert.ok(preflight.checks.some((check) => check.name === "kill_switch" && check.status === "blocked"));
  assert.ok(preflight.checks.some((check) => check.name === "risk_gate" && check.status === "blocked"));
  assert.ok(preflight.checks.some((check) => check.name === "allowed_symbols" && check.status === "blocked"));
});

test("boundary readiness never promotes provider readiness even when opt-in inputs are optimistic", () => {
  const status = buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus({
    optInGranted: true,
    killSwitchBlocking: false,
    riskGateBlocking: false,
    allowedSymbolsSafe: true,
    dependencies: {
      cachePolicyStatus: "policy_ready",
      rateLimitPolicyStatus: "policy_ready",
      auditPolicyStatus: "audit_policy_only",
      providerResponseValidationStatus: "review_recorded",
    },
  });

  assert.equal(status.boundary.status, "adapter_boundary_ready");
  assert.equal(status.preflight.status, "not_ready");
  assert.equal(status.flags.readyForReadOnlyProviderCalls, false);
  assert.equal(status.flags.readyForOrderSubmission, false);
  assert.equal(status.flags.readyForLiveGuardedTrading, false);
  assert.equal(status.boundary.adapterCallEnabled, false);
  assert.equal(status.boundary.liveAdapterImplemented, false);
  assert.equal(status.preflight.adapterCallEnabled, false);
  assert.equal(status.preflight.liveAdapterImplemented, false);
});
