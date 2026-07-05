export const ADMIN_PAGE_SIZE_OPTIONS = [20, 50, 100];

export function normalizeAdminPageSize(value, fallback = 20) {
  const numeric = Number(value);
  return ADMIN_PAGE_SIZE_OPTIONS.includes(numeric) ? numeric : fallback;
}

export function getAdminPaginationState(items = [], options = {}) {
  const sourceItems = Array.isArray(items) ? items : [];
  const pageSize = normalizeAdminPageSize(options.pageSize);
  const totalItems = sourceItems.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(Math.max(Number(options.page || 1), 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    visibleItems: sourceItems.slice(startIndex, endIndex),
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };
}
