import assert from "node:assert/strict";
import test from "node:test";

import { getAdminPaginationState, normalizeAdminPageSize } from "./adminPagination.js";

test("admin pagination supports 20 50 100 page sizes", () => {
  assert.equal(normalizeAdminPageSize(20), 20);
  assert.equal(normalizeAdminPageSize("50"), 50);
  assert.equal(normalizeAdminPageSize(100), 100);
  assert.equal(normalizeAdminPageSize(10), 20);
});

test("admin pagination clamps page and returns visible items", () => {
  const items = Array.from({ length: 55 }, (_, index) => ({ id: index + 1 }));
  const page = getAdminPaginationState(items, { page: 3, pageSize: 20 });

  assert.equal(page.currentPage, 3);
  assert.equal(page.totalPages, 3);
  assert.equal(page.totalItems, 55);
  assert.equal(page.visibleItems.length, 15);
  assert.equal(page.visibleItems[0].id, 41);
  assert.equal(page.hasPreviousPage, true);
  assert.equal(page.hasNextPage, false);
});
