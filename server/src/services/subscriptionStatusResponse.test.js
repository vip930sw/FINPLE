import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildSubscriptionStatusFields } from "./subscriptionStatusResponse.js";

const now = new Date("2026-08-01T00:00:00.000Z");
const periodEnd = "2026-12-31T00:00:00.000Z";
const user = { id: "user-a", plan: "personal" };

test("payment route uses the shared subscription response assembler", () => {
  const source = fs.readFileSync(new URL("../routes/paymentRoutes.js", import.meta.url), "utf8");
  assert.match(source, /buildSubscriptionStatusFields\(\{ user, subscription, entitlement \}\)/);
  assert.match(source, /\.\.\.subscriptionStatus/);
});

test("paid Personal response uses the active subscription billing period", () => {
  const result = buildSubscriptionStatusFields({
    user,
    entitlement: { plan: "personal", source: "payment", valid_until: periodEnd },
    subscription: { plan: "personal", status: "active", current_period_end: periodEnd },
    now,
  });

  assert.equal(result.effectivePlan, "personal");
  assert.equal(result.effectiveStatus, "active");
  assert.equal(result.accessReason, "subscription_current_period_end");
  assert.equal(result.accessUntil, periodEnd);
  assert.equal(result.nextBillingAt, periodEnd);
});

test("cancel-at-period-end response keeps access but clears the next billing date", () => {
  const result = buildSubscriptionStatusFields({
    user,
    entitlement: { plan: "personal", source: "payment", valid_until: periodEnd },
    subscription: { plan: "personal", status: "cancel_at_period_end", current_period_end: periodEnd },
    now,
  });

  assert.equal(result.effectivePlan, "personal");
  assert.equal(result.accessUntil, periodEnd);
  assert.equal(result.nextBillingAt, null);
});

test("education entitlement response has no next billing date", () => {
  const result = buildSubscriptionStatusFields({
    user,
    entitlement: { plan: "personal", source: "education", valid_until: periodEnd },
    subscription: { plan: "personal", status: "canceled", current_period_end: "2026-01-01T00:00:00.000Z" },
    now,
  });

  assert.equal(result.effectivePlan, "personal");
  assert.equal(result.accessReason, "entitlement_valid_until");
  assert.equal(result.accessUntil, periodEnd);
  assert.equal(result.nextBillingAt, null);
});

test("indefinite education entitlement response preserves access with a null expiry", () => {
  const result = buildSubscriptionStatusFields({
    user,
    entitlement: { plan: "personal", source: "education", valid_from: "2026-01-01T00:00:00.000Z", valid_until: null },
    subscription: null,
    now,
  });

  assert.equal(result.effectivePlan, "personal");
  assert.equal(result.accessReason, "entitlement_valid_until");
  assert.equal(result.accessUntil, null);
  assert.equal(result.nextBillingAt, null);
});
