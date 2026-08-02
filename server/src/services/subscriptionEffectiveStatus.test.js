import assert from "node:assert/strict";
import test from "node:test";

import { getEffectiveSubscriptionState, normalizePlan } from "./subscriptionEffectiveStatus.js";

const now = new Date("2026-08-01T00:00:00.000Z");
const future = "2026-12-31T00:00:00.000Z";
const past = "2026-01-01T00:00:00.000Z";
const entitlement = (plan = "personal", validUntil = future, validFrom = null) => ({
  plan,
  source: "education",
  valid_from: validFrom,
  valid_until: validUntil,
});
const subscription = (plan = "personal", status = "active", periodEnd = future) => ({
  plan,
  status,
  current_period_end: periodEnd,
});
const resolve = (records = {}) => getEffectiveSubscriptionState({ ...records, now });

[
  ["1. free normalizes to free", () => assert.equal(normalizePlan("free"), "free")],
  ["2. personal normalizes to personal", () => assert.equal(normalizePlan("personal"), "personal")],
  ["3. pro normalizes to pro", () => assert.equal(normalizePlan("pro"), "pro")],
  ["4. unknown plan fails closed to free", () => assert.equal(normalizePlan("enterprise"), "free")],
  ["5. plan normalization trims whitespace and ignores case", () => {
    assert.equal(normalizePlan(" Personal "), "personal");
    assert.equal(normalizePlan(" PRO "), "pro");
  }],
  ["6. authoritative user Pro remains Pro without other records", () => {
    assert.deepEqual(resolve({ user: { plan: "pro" } }).effectivePlan, "pro");
  }],
  ["7. valid Pro entitlement grants Pro", () => {
    assert.equal(resolve({ entitlement: entitlement("pro") }).effectivePlan, "pro");
  }],
  ["8. active Pro subscription with a future period grants Pro", () => {
    assert.equal(resolve({ subscription: subscription("pro") }).effectivePlan, "pro");
  }],
  ["9. authoritative Pro outranks an old canceled Personal subscription", () => {
    assert.equal(resolve({ user: { plan: "pro" }, subscription: subscription("personal", "canceled", past) }).effectivePlan, "pro");
  }],
  ["10. authoritative Pro survives an expired unrelated subscription", () => {
    assert.equal(resolve({ user: { plan: "pro" }, subscription: subscription("personal", "expired", past) }).effectivePlan, "pro");
  }],
  ["11. valid Personal entitlement survives a canceled subscription", () => {
    const result = resolve({ entitlement: entitlement(), subscription: subscription("personal", "canceled", past) });
    assert.equal(result.effectivePlan, "personal");
    assert.equal(result.effectiveSource, "entitlement");
  }],
  ["12. valid Personal entitlement survives an expired subscription", () => {
    assert.equal(resolve({ entitlement: entitlement(), subscription: subscription("personal", "expired", past) }).effectivePlan, "personal");
  }],
  ["13. valid Personal entitlement survives a past-due subscription", () => {
    assert.equal(resolve({ entitlement: entitlement(), subscription: subscription("personal", "past_due", future) }).effectivePlan, "personal");
  }],
  ["14. valid Personal entitlement survives an active past-period subscription", () => {
    assert.equal(resolve({ entitlement: entitlement(), subscription: subscription("personal", "active", past) }).effectivePlan, "personal");
  }],
  ["15. valid Pro entitlement survives a canceled subscription", () => {
    assert.equal(resolve({ entitlement: entitlement("pro"), subscription: subscription("personal", "canceled", past) }).effectivePlan, "pro");
  }],
  ["16. valid entitlement alone grants its paid plan", () => {
    assert.equal(resolve({ entitlement: entitlement("personal") }).effectivePlan, "personal");
  }],
  ["17. expired entitlement and canceled subscription stay Free", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", past), subscription: subscription("personal", "canceled", past) }).effectivePlan, "free");
  }],
  ["18. expired entitlement and expired subscription stay Free", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", past), subscription: subscription("personal", "expired", past) }).effectivePlan, "free");
  }],
  ["19. active subscription with a past period and no valid entitlement stays Free", () => {
    assert.equal(resolve({ subscription: subscription("personal", "active", past) }).effectivePlan, "free");
  }],
  ["20. unknown subscription status fails closed to Free", () => {
    assert.equal(resolve({ subscription: subscription("personal", "pending", future) }).effectivePlan, "free");
  }],
  ["21. active Personal subscription with a future period grants Personal", () => {
    assert.equal(resolve({ subscription: subscription("personal", "active", future) }).effectivePlan, "personal");
  }],
  ["22. trialing Personal subscription with a future period grants Personal", () => {
    assert.equal(resolve({ subscription: subscription("personal", "trialing", future) }).effectivePlan, "personal");
  }],
  ["23. cancel-at-period-end Personal with a future period remains Personal", () => {
    assert.equal(resolve({ subscription: subscription("personal", "cancel_at_period_end", future) }).effectivePlan, "personal");
  }],
  ["24. cancel-at-period-end Personal with a past period becomes Free", () => {
    assert.equal(resolve({ subscription: subscription("personal", "cancel_at_period_end", past) }).effectivePlan, "free");
  }],
  ["25. valid Pro entitlement outranks an active Personal subscription", () => {
    assert.equal(resolve({ entitlement: entitlement("pro"), subscription: subscription() }).effectivePlan, "pro");
  }],
  ["26. authoritative Pro outranks a valid Personal entitlement", () => {
    assert.equal(resolve({ user: { plan: "pro" }, entitlement: entitlement("personal") }).effectivePlan, "pro");
  }],
  ["27. expired Pro entitlement falls back to an active Personal subscription", () => {
    assert.equal(resolve({ entitlement: entitlement("pro", past), subscription: subscription() }).effectivePlan, "personal");
  }],
  ["28. stale user Personal alone cannot bypass paid-source validation", () => {
    assert.equal(resolve({ user: { plan: "personal" } }).effectivePlan, "free");
  }],
  ["29. active subscription without a valid future period fails closed", () => {
    assert.equal(resolve({ subscription: subscription("personal", "active", null) }).effectivePlan, "free");
  }],
  ["30. Personal entitlement without an expiry remains Personal", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", null) }).effectivePlan, "personal");
  }],
  ["31. Pro entitlement without an expiry remains Pro", () => {
    assert.equal(resolve({ entitlement: entitlement("pro", null) }).effectivePlan, "pro");
  }],
  ["32. past valid-from with no expiry is active", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", null, past) }).effectivePlan, "personal");
  }],
  ["33. future valid-from with no expiry is not active", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", null, future) }).effectivePlan, "free");
  }],
  ["34. invalid valid-from fails closed", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", null, "not-a-date") }).effectivePlan, "free");
  }],
  ["35. invalid valid-until fails closed", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", "not-a-date") }).effectivePlan, "free");
  }],
  ["36. indefinite Personal entitlement survives an old canceled subscription", () => {
    const result = resolve({ entitlement: entitlement("personal", null), subscription: subscription("personal", "canceled", past) });
    assert.equal(result.effectivePlan, "personal");
    assert.equal(result.effectiveSource, "entitlement");
  }],
  ["37. indefinite Pro entitlement survives an old expired subscription", () => {
    const result = resolve({ entitlement: entitlement("pro", null), subscription: subscription("personal", "expired", past) });
    assert.equal(result.effectivePlan, "pro");
    assert.equal(result.effectiveSource, "entitlement");
  }],
  ["38. active Personal subscription wins a same-plan payment entitlement", () => {
    const result = resolve({ entitlement: entitlement("personal"), subscription: subscription("personal") });
    assert.equal(result.effectivePlan, "personal");
    assert.equal(result.effectiveSource, "subscription");
  }],
  ["39. active Pro subscription wins a same-plan Pro entitlement", () => {
    const result = resolve({ entitlement: entitlement("pro"), subscription: subscription("pro") });
    assert.equal(result.effectivePlan, "pro");
    assert.equal(result.effectiveSource, "subscription");
  }],
  ["40. higher Pro entitlement wins a lower Personal subscription", () => {
    const result = resolve({ entitlement: entitlement("pro"), subscription: subscription("personal") });
    assert.equal(result.effectivePlan, "pro");
    assert.equal(result.effectiveSource, "entitlement");
  }],
  ["41. valid Personal entitlement wins an invalid same-plan subscription", () => {
    const result = resolve({ entitlement: entitlement("personal"), subscription: subscription("personal", "canceled", past) });
    assert.equal(result.effectivePlan, "personal");
    assert.equal(result.effectiveSource, "entitlement");
  }],
  ["42. authoritative user Pro remains the source when it is the only candidate", () => {
    const result = resolve({ user: { plan: "pro" } });
    assert.equal(result.effectivePlan, "pro");
    assert.equal(result.effectiveSource, "user");
  }],
  ["43. subscription winner supplies its current period as access-until", () => {
    const result = resolve({ entitlement: entitlement("personal"), subscription: subscription("personal") });
    assert.equal(result.accessUntil, future);
  }],
  ["44. empty date strings fail closed instead of granting indefinite access", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", "") }).effectivePlan, "free");
  }],
  ["45. current start is active, current expiry is expired, and undefined expiry is indefinite", () => {
    assert.equal(resolve({ entitlement: entitlement("personal", null, now.toISOString()) }).effectivePlan, "personal");
    assert.equal(resolve({ entitlement: entitlement("personal", now.toISOString()) }).effectivePlan, "free");
    assert.equal(resolve({ entitlement: { plan: "personal" } }).effectivePlan, "personal");
  }],
].forEach(([name, assertion]) => test(name, assertion));
