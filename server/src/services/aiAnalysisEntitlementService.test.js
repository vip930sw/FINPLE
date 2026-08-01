import assert from "node:assert/strict";
import test from "node:test";

import { applyAiAnalysisEntitlement } from "./aiAnalysisEntitlementService.js";

test("applyAiAnalysisEntitlement promotes active Personal entitlement for AI access", () => {
  const user = { id: "user-a", plan: "free" };
  const enriched = applyAiAnalysisEntitlement(user, {
    plan: "personal",
    source: "education",
    valid_until: "2026-12-31T00:00:00.000Z",
  });

  assert.equal(enriched.plan, "personal");
  assert.equal(enriched.aiPlanSource, "education");
  assert.deepEqual(enriched.aiEntitlement, {
    plan: "personal",
    source: "education",
    validUntil: "2026-12-31T00:00:00.000Z",
  });
});

test("applyAiAnalysisEntitlement leaves free users unchanged without paid entitlement", () => {
  const user = { id: "user-a", plan: "free" };
  const enriched = applyAiAnalysisEntitlement(user, { plan: "free", source: "manual" });

  assert.equal(enriched.plan, "free");
  assert.equal(enriched.aiPlanSource, "user");
  assert.equal(enriched.aiEntitlement, undefined);
});

test("applyAiAnalysisEntitlement blocks expired Personal access", () => {
  const enriched = applyAiAnalysisEntitlement(
    { id: "user-a", plan: "personal" },
    { plan: "personal", source: "payment", valid_until: "2026-01-01T00:00:00.000Z" },
    { plan: "personal", status: "active", current_period_end: "2026-01-01T00:00:00.000Z" },
    new Date("2026-08-01T00:00:00.000Z"),
  );

  assert.equal(enriched.plan, "free");
  assert.equal(enriched.aiEntitlement, undefined);
});

test("applyAiAnalysisEntitlement accepts an active authoritative subscription", () => {
  const enriched = applyAiAnalysisEntitlement(
    { id: "user-a", plan: "free" },
    null,
    { plan: "personal", status: "active", current_period_end: "2026-12-31T00:00:00.000Z" },
    new Date("2026-08-01T00:00:00.000Z"),
  );

  assert.equal(enriched.plan, "personal");
});
