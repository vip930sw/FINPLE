import assert from "node:assert/strict";
import test from "node:test";

import { collapseAdminSubscriptionsByUser } from "./adminSubscriptionEffectiveStatus.js";

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
