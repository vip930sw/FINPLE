const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const PORTFOLIO_DATA_KEYS = [
  "finple-portfolio-list",
  "finple-active-portfolio-id",
  "finple-global-settings",
  "finple-free-api-usage",
];

function hasStoredAuthUser() {
  if (typeof window === "undefined") return false;

  try {
    const storedUser = JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
    return Boolean(storedUser?.id);
  } catch (error) {
    return false;
  }
}

function clearPortfolioDataWhenLoggedOut() {
  if (typeof window === "undefined") return;
  if (hasStoredAuthUser()) return;

  let didClear = false;

  PORTFOLIO_DATA_KEYS.forEach((key) => {
    if (window.localStorage.getItem(key) !== null) {
      window.localStorage.removeItem(key);
      didClear = true;
    }
  });

  if (didClear) {
    window.dispatchEvent(new Event("finple-local-storage-updated"));
  }
}

if (typeof window !== "undefined" && !window.__finpleAuthPortfolioDataGuardApplied) {
  window.__finpleAuthPortfolioDataGuardApplied = true;
  clearPortfolioDataWhenLoggedOut();
  window.addEventListener("finple-auth-updated", clearPortfolioDataWhenLoggedOut);
  window.addEventListener("storage", clearPortfolioDataWhenLoggedOut);
}
