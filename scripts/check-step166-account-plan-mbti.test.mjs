import assert from "node:assert/strict";
import test from "node:test";

import {
  MBTI_PRESET_STORAGE_KEY,
  buildMbtiProfileFromPortfolio,
  restoreMbtiProfileFromPortfolios,
  storeMbtiProfileFromResult,
} from "../src/components/portfolio/utils/mbtiProfileStorage.js";
import {
  getPlanFromPayload,
  getSubscriptionPlanDecision,
} from "../src/components/portfolio/utils/subscriptionPlanStatus.js";
import {
  buildPlanBreakdown,
  mapAdminMemberRow,
  mapAdminSubscriptionRow,
  shouldKeepAdminSubscriptionRow,
} from "../server/src/services/adminSubscriptionEffectiveStatus.js";
import { getEffectiveSubscriptionState } from "../server/src/services/subscriptionEffectiveStatus.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("restores balanced architect MBTI profile from portfolio.mbti", () => {
  const profile = buildMbtiProfileFromPortfolio({
    id: "portfolio-1",
    name: "균형 잡힌 건축가형",
    updatedAt: "2026-07-05T00:00:00.000Z",
    mbti: {
      typeId: "성장-장기-주도-분산",
      marketMode: "US",
    },
  }, {
    now: "2026-07-05T01:00:00.000Z",
    source: "test-restore",
  });

  assert.equal(profile.typeId, "성장-장기-주도-분산");
  assert.equal(profile.nickname, "균형 잡힌 건축가형");
  assert.equal(profile.finpleType, "성장 장기 주도 분산");
  assert.equal(profile.riskProfile, "적극투자형");
  assert.equal(profile.preset.growthStock, 45);
  assert.equal(profile.preset.cash, 6);
  assert.equal(profile.createdAt, "2026-07-05T00:00:00.000Z");
  assert.equal(profile.restoredAt, "2026-07-05T01:00:00.000Z");
  assert.equal(profile.source, "test-restore");
});

test("writes finple-mbti-simulator-preset when active portfolio has mbti", () => {
  const storage = createStorage();
  storage.setItem("finple-active-portfolio-id", "active-portfolio");

  const restored = restoreMbtiProfileFromPortfolios([
    { id: "other-portfolio", mbti: { typeId: "안정-장기-자동-분산" } },
    { id: "active-portfolio", mbti: { typeId: "성장-장기-주도-분산" } },
  ], {
    storage,
    now: "2026-07-05T01:00:00.000Z",
    source: "test-active",
  });

  const stored = JSON.parse(storage.getItem(MBTI_PRESET_STORAGE_KEY));
  assert.equal(restored.typeId, "성장-장기-주도-분산");
  assert.equal(stored.typeId, "성장-장기-주도-분산");
  assert.equal(stored.source, "test-active");
});

test("stores MBTI result immediately without requiring portfolio creation", () => {
  const storage = createStorage();
  const saved = storeMbtiProfileFromResult({
    calculatedRiskProfile: "적극투자형",
    riskScore: 7,
    axes: {
      returnStyle: "성장",
      timeStyle: "장기",
      controlStyle: "주도",
      concentrationStyle: "분산",
    },
    axisScores: { returnStyle: 4 },
    type: {
      typeId: "성장-장기-주도-분산",
      nickname: "균형 잡힌 건축가형",
      finpleType: "성장 장기 주도 분산",
      preset: { growthStock: 45, valueStock: 22, cash: 6 },
    },
  }, {
    storage,
    now: "2026-07-05T01:00:00.000Z",
    source: "test-result",
  });

  const stored = JSON.parse(storage.getItem(MBTI_PRESET_STORAGE_KEY));
  assert.equal(saved, true);
  assert.equal(stored.typeId, "성장-장기-주도-분산");
  assert.equal(stored.source, "test-result");
  assert.equal(stored.portfolioPreset.growthStock, 45);
});

test("subscription payload free or failed status recovers browser plan to free", () => {
  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "free",
    status: "active",
    subscription: { plan: "personal", status: "active" },
  }), "free");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "expired",
    subscription: { plan: "personal", status: "expired" },
  }), "free");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "payment_failed",
    subscription: { plan: "personal", status: "payment_failed" },
  }), "free");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "past_due",
    subscription: { plan: "personal", status: "past_due" },
  }), "free");

  assert.equal(getPlanFromPayload({
    authenticated: false,
    plan: "personal",
    status: "active",
  }), "free");
});

test("active subscription requires future period or entitlement date", () => {
  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "active",
    subscription: {
      plan: "personal",
      status: "active",
      currentPeriodEnd: "2000-01-01T00:00:00.000Z",
    },
  }), "free");

  assert.equal(getSubscriptionPlanDecision({
    authenticated: true,
    plan: "personal",
    status: "active",
    subscription: {
      plan: "personal",
      status: "active",
      currentPeriodEnd: "2000-01-01T00:00:00.000Z",
    },
  }).status, "expired");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "active",
    subscription: {
      plan: "personal",
      status: "active",
      currentPeriodEnd: "2999-01-01T00:00:00.000Z",
    },
  }), "personal");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    entitlement: {
      plan: "personal",
      validUntil: "2999-01-01T00:00:00.000Z",
    },
  }), "personal");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    entitlement: {
      plan: "personal",
      validUntil: "2000-01-01T00:00:00.000Z",
    },
  }), "free");
});

test("cancel_at_period_end remains personal only while the entitlement is still in the future", () => {
  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "cancel_at_period_end",
    subscription: {
      plan: "personal",
      status: "cancel_at_period_end",
      currentPeriodEnd: "2999-01-01T00:00:00.000Z",
    },
  }), "personal");

  assert.equal(getPlanFromPayload({
    authenticated: true,
    plan: "personal",
    status: "cancel_at_period_end",
    subscription: {
      plan: "personal",
      status: "cancel_at_period_end",
      currentPeriodEnd: "2000-01-01T00:00:00.000Z",
    },
  }), "free");
});

test("server subscription response state expires active personal when period is in the past", () => {
  const activePast = getEffectiveSubscriptionState({
    user: { plan: "personal" },
    subscription: {
      plan: "personal",
      status: "active",
      current_period_end: "2000-01-01T00:00:00.000Z",
    },
    now: new Date("2026-07-05T00:00:00.000Z"),
  });

  assert.equal(activePast.plan, "free");
  assert.equal(activePast.status, "expired");
  assert.equal(activePast.effectiveStatus, "expired");

  const activeFuture = getEffectiveSubscriptionState({
    user: { plan: "personal" },
    subscription: {
      plan: "personal",
      status: "active",
      current_period_end: "2999-01-01T00:00:00.000Z",
    },
    now: new Date("2026-07-05T00:00:00.000Z"),
  });

  assert.equal(activeFuture.plan, "personal");
  assert.equal(activeFuture.status, "active");

  const entitlementPast = getEffectiveSubscriptionState({
    user: { plan: "personal" },
    entitlement: {
      plan: "personal",
      valid_until: "2000-01-01T00:00:00.000Z",
    },
    subscription: {
      plan: "personal",
      status: "active",
    },
    now: new Date("2026-07-05T00:00:00.000Z"),
  });

  assert.equal(entitlementPast.plan, "free");
  assert.equal(entitlementPast.effectiveStatus, "expired");

  const entitlementOnlyFuture = getEffectiveSubscriptionState({
    user: { plan: "personal" },
    entitlement: {
      plan: "personal",
      valid_until: "2999-01-01T00:00:00.000Z",
    },
    now: new Date("2026-07-05T00:00:00.000Z"),
  });

  assert.equal(entitlementOnlyFuture.plan, "personal");
  assert.equal(entitlementOnlyFuture.effectiveStatus, "active");

  const entitlementOnlyPast = getEffectiveSubscriptionState({
    user: { plan: "personal" },
    entitlement: {
      plan: "personal",
      valid_until: "2000-01-01T00:00:00.000Z",
    },
    now: new Date("2026-07-05T00:00:00.000Z"),
  });

  assert.equal(entitlementOnlyPast.plan, "free");
  assert.equal(entitlementOnlyPast.effectiveStatus, "expired");
});

test("admin member plan uses effective subscription instead of stale users.plan", () => {
  const member = mapAdminMemberRow({
    id: "user-1",
    email: "lsw_28@naver.com",
    user_plan: "personal",
    subscription_id: "sub-1",
    subscription_plan: "personal",
    subscription_status: "active",
    current_period_end: "2026-06-29T00:00:00.000Z",
    portfolio_count: 0,
    inquiry_count: 0,
  }, new Date("2026-07-05T00:00:00.000Z"));

  assert.equal(member.plan, "free");
  assert.equal(member.effectivePlan, "free");
  assert.equal(member.billingStatus, "expired");
  assert.equal(member.activeSubscriptionCount, 0);
});

test("admin subscription management removes period-ended and superseded rows", () => {
  const now = new Date("2026-07-05T00:00:00.000Z");
  const activeFutureRow = {
    subscription_id: "sub-active",
    user_id: "user-1",
    user_plan: "personal",
    subscription_plan: "personal",
    subscription_status: "active",
    current_period_start: "2026-07-01T00:00:00.000Z",
    current_period_end: "2026-07-20T00:00:00.000Z",
  };
  const activePastRow = {
    subscription_id: "sub-ended",
    user_id: "user-2",
    user_plan: "personal",
    subscription_plan: "personal",
    subscription_status: "active",
    current_period_start: "2026-05-29T00:00:00.000Z",
    current_period_end: "2026-06-29T00:00:00.000Z",
  };
  const supersededRow = {
    subscription_id: "sub-superseded",
    user_id: "user-3",
    user_plan: "personal",
    subscription_plan: "personal",
    subscription_status: "superseded",
    current_period_start: "2026-05-20T00:00:00.000Z",
    current_period_end: "2026-06-20T00:00:00.000Z",
  };

  assert.equal(shouldKeepAdminSubscriptionRow(activeFutureRow, now), true);
  assert.equal(shouldKeepAdminSubscriptionRow(activePastRow, now), false);
  assert.equal(shouldKeepAdminSubscriptionRow(supersededRow, now), false);

  const visible = [activeFutureRow, activePastRow, supersededRow]
    .filter((row) => shouldKeepAdminSubscriptionRow(row, now))
    .map((row) => mapAdminSubscriptionRow(row, now));

  assert.equal(visible.length, 1);
  assert.equal(visible[0].plan, "personal");
  assert.deepEqual(buildPlanBreakdown(visible), [
    { plan: "personal", status: "active", subscriptions: 1 },
  ]);
});
