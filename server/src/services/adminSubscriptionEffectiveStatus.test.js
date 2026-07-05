import assert from "node:assert/strict";
import test from "node:test";

import { collapseAdminSubscriptionsByUser, mapAdminMemberRow } from "./adminSubscriptionEffectiveStatus.js";

test("admin subscriptions collapse duplicate rows per user without deleting evidence", () => {
  const rows = [
    { id: "sub-new", userId: "user-1", email: "vip930sw@gmail.com", currentPeriodEnd: "2026-08-05" },
    { id: "sub-duplicate", userId: "user-1", email: "vip930sw@gmail.com", currentPeriodEnd: "2026-08-05" },
    { id: "sub-other", userId: "user-2", email: "other@example.com", currentPeriodEnd: "2026-08-05" },
  ];

  const collapsed = collapseAdminSubscriptionsByUser(rows);

  assert.equal(collapsed.length, 2);
  assert.equal(collapsed[0].id, "sub-new");
  assert.equal(collapsed[0].duplicateSubscriptionCount, 1);
  assert.deepEqual(collapsed[0].duplicateSubscriptionIds, ["sub-duplicate"]);
  assert.equal(collapsed[1].duplicateSubscriptionCount, 0);
});

test("admin member row exposes server-sourced MBTI nickname when available", () => {
  const member = mapAdminMemberRow({
    id: "user-1",
    email: "member@example.com",
    user_plan: "free",
    mbti_nickname: "균형 성장형",
    portfolio_count: 2,
    inquiry_count: 1,
  });

  assert.equal(member.mbtiNickname, "균형 성장형");
  assert.equal(member.portfolioCount, 2);
  assert.equal(member.inquiryCount, 1);
});

test("admin member row keeps MBTI missing state explicit for UI fallback", () => {
  const member = mapAdminMemberRow({
    id: "user-2",
    email: "missing@example.com",
    user_plan: "free",
  });

  assert.equal(member.mbtiNickname, null);
});
