import assert from "node:assert/strict";
import test from "node:test";

import { getSubscriptionPlanDecision } from "./subscriptionPlanStatus.js";

const future = new Date(Date.now() + 86400000).toISOString();
const past = new Date(Date.now() - 86400000).toISOString();

test("active personal subscription with past current_period_end falls back to free", () => {
  const decision = getSubscriptionPlanDecision({
    authenticated: true,
    plan: "personal",
    status: "active",
    subscription: { plan: "personal", status: "active", current_period_end: past },
  });

  assert.equal(decision.plan, "free");
  assert.equal(decision.status, "expired");
});

test("active personal subscription with future current_period_end remains personal", () => {
  const decision = getSubscriptionPlanDecision({
    authenticated: true,
    plan: "personal",
    status: "active",
    subscription: { plan: "personal", status: "active", current_period_end: future },
  });

  assert.equal(decision.plan, "personal");
  assert.equal(decision.status, "active");
});

test("cancel_at_period_end with future current_period_end remains personal", () => {
  const decision = getSubscriptionPlanDecision({
    authenticated: true,
    plan: "personal",
    status: "cancel_at_period_end",
    subscription: { plan: "personal", status: "cancel_at_period_end", current_period_end: future },
  });

  assert.equal(decision.plan, "personal");
  assert.equal(decision.status, "cancel_at_period_end");
});

test("cancel_at_period_end with past current_period_end falls back to free", () => {
  const decision = getSubscriptionPlanDecision({
    authenticated: true,
    plan: "personal",
    status: "cancel_at_period_end",
    subscription: { plan: "personal", status: "cancel_at_period_end", current_period_end: past },
  });

  assert.equal(decision.plan, "free");
  assert.equal(decision.status, "expired");
});

test("blocked personal payment statuses fall back to free", () => {
  for (const status of ["expired", "payment_failed", "past_due"]) {
    const decision = getSubscriptionPlanDecision({
      authenticated: true,
      plan: "personal",
      status,
      subscription: { plan: "personal", status, current_period_end: future },
    });

    assert.equal(decision.plan, "free");
    assert.equal(decision.status, status);
  }
});

test("personal payload with expired entitlement falls back to free", () => {
  const decision = getSubscriptionPlanDecision({
    authenticated: true,
    plan: "personal",
    status: "active",
    entitlement: { plan: "personal", valid_until: past },
  });

  assert.equal(decision.plan, "free");
  assert.equal(decision.status, "expired");
});
