import { createCanonicalPortfolioPersistenceSyncSnapshot } from "./portfolioPersistenceContract.js";

export function deletePortfolioState(portfolioList = [], portfolioId = null) {
  const currentList = Array.isArray(portfolioList) ? portfolioList : [];
  const nextPortfolioList = currentList.filter(
    (portfolio) => portfolio?.id !== portfolioId,
  );
  const activePortfolio = nextPortfolioList[0] || null;

  return {
    portfolioList: nextPortfolioList,
    activePortfolioId: activePortfolio?.id || null,
    activePortfolio,
  };
}

export function getPortfolioCreationDecision({
  portfolioCount = 0,
  portfolioLimit = Infinity,
  requestedCount = 1,
} = {}) {
  const current = Math.max(0, Number(portfolioCount) || 0);
  const requested = Math.max(0, Number(requestedCount) || 0);
  const limit = Number.isFinite(portfolioLimit)
    ? Math.max(1, Number(portfolioLimit) || 1)
    : Infinity;

  return {
    allowed: requested === 0 || !Number.isFinite(limit) || current + requested <= limit,
    current,
    requested,
    limit,
  };
}

export function canCreatePortfolio(portfolioCount, portfolioLimit) {
  return getPortfolioCreationDecision({ portfolioCount, portfolioLimit }).allowed;
}

export async function deletePortfolioWithServerSync({
  portfolioList = [],
  portfolioId = null,
  snapshot = {},
  syncSnapshot,
}) {
  if (typeof syncSnapshot !== "function") {
    throw new Error("portfolio_delete_sync_required");
  }
  const nextState = deletePortfolioState(portfolioList, portfolioId);
  await syncSnapshot(
    createCanonicalPortfolioPersistenceSyncSnapshot(snapshot, {
      portfolios: nextState.portfolioList,
      activePortfolioId: nextState.activePortfolioId,
    }),
  );
  return nextState;
}
