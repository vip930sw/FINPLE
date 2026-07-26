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

export function canCreatePortfolio(portfolioCount, portfolioLimit) {
  const count = Math.max(0, Number(portfolioCount) || 0);
  if (!Number.isFinite(portfolioLimit)) return true;
  return count < Math.max(1, Number(portfolioLimit) || 1);
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
