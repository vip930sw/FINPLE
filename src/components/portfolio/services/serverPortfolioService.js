import {
  readStoredMbtiProfile,
  restoreMbtiProfileFromPortfolios,
} from "../utils/mbtiProfileStorage";

const DEFAULT_API_BASE_URL = "http://localhost:5050/api";
const PORTFOLIO_LIST_STORAGE_KEY = "finple-portfolio-list";
const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const ACCOUNT_PLAN_STORAGE_KEY = "finple-selected-plan";

function getBuildTimeEnv() {
  return import.meta?.env || {};
}

export function getFinpleApiBaseUrl() {
  const runtimeConfig = typeof window !== "undefined" ? window.FINPLE_ASSET_DATA_CONFIG || {} : {};
  const buildEnv = getBuildTimeEnv();

  return runtimeConfig.apiBaseUrl || buildEnv.VITE_FINPLE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

function buildApiUrl(path) {
  const baseUrl = String(getFinpleApiBaseUrl() || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const apiBaseUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

  return `${apiBaseUrl}${normalizedPath}`;
}

export function getFinpleAdminToken() {
  const runtimeConfig = typeof window !== "undefined" ? window.FINPLE_ASSET_DATA_CONFIG || {} : {};
  const buildEnv = getBuildTimeEnv();
  const storedToken = typeof window !== "undefined"
    ? window.localStorage.getItem("finple-admin-token") || ""
    : "";

  return runtimeConfig.adminToken || buildEnv.VITE_FINPLE_ADMIN_TOKEN || storedToken;
}

export function getStoredFinpleAuthUser() {
  return readJson(AUTH_USER_STORAGE_KEY, null);
}

export function setStoredFinpleAuthUser(user) {
  if (typeof window === "undefined") return null;

  const previousUser = readJson(AUTH_USER_STORAGE_KEY, null);
  const previousEmail = previousUser?.id && previousUser.id === user?.id ? previousUser.email : "";
  const stableEmail = user?.email || previousEmail;
  const displayEmail = stableEmail === "trial@finple.local"
    ? "trial@finple.local"
    : stableEmail || "trial@finple.local";
  const displayName = user?.name === "FINPLE 체험 사용자"
    ? "FINPLE 체험 사용자"
    : user?.name || user?.nickname || "FINPLE 체험 사용자";

  const normalizedUser = user
    ? {
        id: user.id,
        email: displayEmail,
        name: displayName,
        nickname: user.nickname === "trial" ? "trial" : user.nickname || "trial",
        plan: user.plan || "free",
        authMode: user.authMode || "trial-user",
        entitlementSource: user.entitlementSource || null,
        educationAccount: user.educationAccount || null,
        connectedAt: user.connectedAt || new Date().toISOString(),
      }
    : null;

  if (normalizedUser) {
    window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(normalizedUser));
  } else {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  window.dispatchEvent(new Event("finple-auth-updated"));
  return normalizedUser;
}

export function clearStoredFinpleAuthUser() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    window.localStorage.removeItem(ACCOUNT_PLAN_STORAGE_KEY);
    window.dispatchEvent(new Event("finple-auth-updated"));
    window.dispatchEvent(new Event("finple-plan-updated"));
    window.dispatchEvent(new Event("finple-local-storage-updated"));
  }

  return null;
}

export async function createOrLoadDemoUser() {
  const payload = await requestJson("/db/dev-user", { method: "POST" }, { skipAuthHeader: true });
  const user = payload?.user;

  if (!user?.id) {
    throw new Error("체험 사용자 정보를 불러오지 못했습니다.");
  }

  return setStoredFinpleAuthUser({
    ...user,
    authMode: "trial-user",
    connectedAt: new Date().toISOString(),
  });
}

export async function fetchCurrentServerUser() {
  const payload = await requestJson("/db/me");
  return payload?.user || null;
}

export function getLocalPortfolioSnapshot() {
  const portfolioList = readJson(PORTFOLIO_LIST_STORAGE_KEY, []);
  const activePortfolioId = window.localStorage.getItem(ACTIVE_PORTFOLIO_STORAGE_KEY) || portfolioList?.[0]?.id || null;
  const globalSettings = readJson(GLOBAL_SETTINGS_STORAGE_KEY, null);
  const activePortfolio = Array.isArray(portfolioList)
    ? portfolioList.find((portfolio) => portfolio.id === activePortfolioId) || portfolioList[0]
    : null;

  return {
    source: "browser-local-storage",
    portfolioList: Array.isArray(portfolioList) ? portfolioList : [],
    portfolioCount: Array.isArray(portfolioList) ? portfolioList.length : 0,
    activePortfolioId,
    activePortfolioName: activePortfolio?.name || "",
    globalSettings,
    mbtiProfile: readStoredMbtiProfile(),
    capturedAt: new Date().toISOString(),
  };
}

export async function checkServerDatabaseHealth() {
  return requestJson("/db/health");
}

export async function listServerPortfolios() {
  return requestJson("/account/portfolios");
}

export async function syncLocalPortfoliosToServer(snapshot = getLocalPortfolioSnapshot()) {
  const portfolioList = Array.isArray(snapshot.portfolioList) ? snapshot.portfolioList : [];

  if (portfolioList.length === 0) {
    throw new Error("동기화할 브라우저 포트폴리오가 없습니다.");
  }

  return requestJson("/account/portfolios/sync-local", {
    method: "POST",
    body: JSON.stringify({
      portfolioList,
      activePortfolioId: snapshot.activePortfolioId,
      globalSettings: snapshot.globalSettings,
      mbtiProfile: snapshot.mbtiProfile || readStoredMbtiProfile(),
      importedFrom: snapshot.source || "browser-local-storage",
      importedAt: new Date().toISOString(),
    }),
  });
}

export async function fetchServerPortfolios() {
  const response = await listServerPortfolios();
  return Array.isArray(response?.portfolios) ? response.portfolios : [];
}

export async function fetchInvestmentMbtiProfile() {
  const payload = await requestJson("/account/investment-mbti");
  return payload?.profile || null;
}

export async function upsertInvestmentMbtiProfile(profile) {
  const payload = await requestJson("/account/investment-mbti", {
    method: "PUT",
    body: JSON.stringify({ profile }),
  });

  return payload?.profile || profile || null;
}

export async function submitSupportInquiry(inquiry) {
  const attachments = Array.isArray(inquiry?.attachments) ? inquiry.attachments : [];
  const formData = new FormData();
  formData.append("category", inquiry?.category || "feature");
  formData.append("email", inquiry?.email || "");
  formData.append("title", inquiry?.title || "FINPLE 문의사항");
  formData.append("message", inquiry?.message || "");
  formData.append("pageUrl", typeof window !== "undefined" ? window.location.href : "");
  formData.append("userAgent", typeof navigator !== "undefined" ? navigator.userAgent : "");
  attachments.forEach((file) => formData.append("attachments", file));

  return requestJson("/inquiries", {
    method: "POST",
    body: formData,
  }, { timeoutMs: 90000 });
}

export async function fetchMySupportInquiries() {
  const payload = await requestJson("/inquiries");
  return Array.isArray(payload?.inquiries) ? payload.inquiries : [];
}

export async function fetchInquiryAdminSecurityStatus() {
  const payload = await requestJson("/inquiries/admin-status", {}, { skipAuthHeader: true });
  return payload?.admin || null;
}

export async function fetchSupportInquiries(options = {}) {
  const scope = options.scope === "all" ? "all" : "mine";
  const payload = await requestJson(
    `/inquiries?scope=${encodeURIComponent(scope)}`,
    {},
    scope === "all" ? { includeAdminToken: true } : {}
  );
  return Array.isArray(payload?.inquiries) ? payload.inquiries : [];
}

export async function fetchSupportInquiryAttachments(inquiryId) {
  const payload = await requestJson(
    `/inquiries/${encodeURIComponent(inquiryId)}/attachments`,
    {},
    { includeAdminToken: true }
  );
  return Array.isArray(payload?.attachments) ? payload.attachments : [];
}

export async function fetchSupportInquiryReplies(inquiryId) {
  const payload = await requestJson(
    `/inquiries/${encodeURIComponent(inquiryId)}/replies`,
    {},
    { includeAdminToken: true }
  );
  return Array.isArray(payload?.replies) ? payload.replies : [];
}

export async function sendSupportInquiryReply(inquiryId, body) {
  if (!inquiryId) {
    throw new Error("답변을 등록할 문의 ID가 없습니다.");
  }

  return requestJson(
    `/inquiries/${encodeURIComponent(inquiryId)}/replies`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
    { includeAdminToken: true, timeoutMs: 45000 }
  );
}

export async function fetchInquiryAttachmentStatus() {
  const payload = await requestJson("/inquiries/notification-status", {}, { skipAuthHeader: true });
  return payload?.attachments || null;
}

export async function updateSupportInquiryStatus(inquiryId, status) {
  if (!inquiryId) {
    throw new Error("상태를 변경할 문의 ID가 없습니다.");
  }

  return requestJson(
    `/inquiries/${encodeURIComponent(inquiryId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
    { includeAdminToken: true }
  );
}

export async function fetchAdminMembersSummary() {
  return requestJson("/admin/members", {}, { includeAdminToken: true });
}

export async function fetchAdminSubscriptionsSummary() {
  return requestJson("/admin/subscriptions", {}, { includeAdminToken: true });
}

export async function deleteAdminMember(userId, input = {}) {
  return requestJson(
    `/admin/members/${encodeURIComponent(userId)}`,
    {
      method: "DELETE",
      body: JSON.stringify(input),
    },
    { includeAdminToken: true }
  );
}

export async function fetchAdminAiAnalysisUsageSummary() {
  return requestJson("/admin/ai-analysis-usage", {}, { includeAdminToken: true });
}

export async function fetchAdminEducationAccounts() {
  return requestJson("/admin/education-accounts", {}, { includeAdminToken: true });
}

export async function fetchTradingReadinessStatus() {
  return requestJson("/admin/trading-readiness/readiness", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingShadowStatus() {
  return requestJson("/admin/trading-readiness/shadow-status", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingShadowReviewStatus() {
  return requestJson("/admin/trading-readiness/shadow-review", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingRiskKillSwitchStatus() {
  return requestJson("/admin/trading-readiness/risk-kill-switch", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingRiskKillSwitchReviewResultStatus() {
  return requestJson("/admin/trading-readiness/risk-kill-switch-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingManualApprovalOrderDraftPreflightStatus() {
  return requestJson("/admin/trading-readiness/manual-approval-order-draft-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingManualApprovalOrderDraftReviewResultStatus() {
  return requestJson("/admin/trading-readiness/manual-approval-order-draft-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingManualApprovalOrderDraftClearancePreflightStatus() {
  return requestJson("/admin/trading-readiness/manual-approval-order-draft-clearance-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingManualApprovalClearanceReviewResultStatus() {
  return requestJson("/admin/trading-readiness/manual-approval-clearance-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingKisReadOnlyProviderCallInventoryPreflightStatus() {
  return requestJson("/admin/trading-readiness/kis-read-only-provider-call-inventory-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingProviderResponseEnvelopeValidationStatus() {
  return requestJson("/admin/trading-readiness/provider-response-envelope-validation", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingProviderResponseValidationReviewResultStatus() {
  return requestJson("/admin/trading-readiness/provider-response-validation-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingProviderCallPolicyStatus() {
  return requestJson("/admin/trading-readiness/provider-call-policy", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingKisReadOnlyQuoteAdapterOptInPreflightStatus() {
  return requestJson("/admin/trading-readiness/kis-read-only-quote-adapter-opt-in-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabDashboardStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-dashboard", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabStrategyDraftStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-strategy-draft", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabStrategyDraftReviewStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-strategy-draft-review", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabStrategyDraftReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-strategy-draft-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabStrategyDraftClearancePreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-strategy-draft-clearance-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabStrategyDraftClearanceReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-strategy-draft-clearance-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockRunCandidatePreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-run-candidate-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockOrderGenerationPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-order-generation-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockOrderGenerationReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-order-generation-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockExecutionPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-execution-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockExecutionReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-execution-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockFillSimulationPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-fill-simulation-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockFillSimulationReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-fill-simulation-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockFillSimulationCorePreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-fill-simulation-core-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockFillSimulationCoreReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-fill-simulation-core-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockFillSimulationCoreStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-fill-simulation-core", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-core-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-core-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioLedgerUpdateCoreStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-ledger-update-core", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-core-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-core-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-portfolio-performance-recalculation-core", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockTradingRunSummaryPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-trading-run-summary-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockTradingRunSummaryReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-trading-run-summary-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockTradingRunSummaryCoreStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-trading-run-summary-core", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockDashboardCleanupPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-preflight", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockDashboardCleanupReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockDashboardCleanupCoreStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-core", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabMockDashboardCleanupCoreReviewResultStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-mock-dashboard-cleanup-core-review-result", {}, { includeAdminToken: true });
}

export async function fetchAdminTradingLabDashboardUxPolishPreflightStatus() {
  return requestJson("/admin/trading-readiness/trading-lab-dashboard-ux-polish-preflight", {}, { includeAdminToken: true });
}

export async function bulkCreateAdminEducationAccounts(input = {}) {
  return requestJson(
    "/admin/education-accounts/bulk",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { includeAdminToken: true }
  );
}

export async function updateAdminEducationAccount(accountId, input = {}) {
  return requestJson(
    `/admin/education-accounts/${encodeURIComponent(accountId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    { includeAdminToken: true }
  );
}

export async function deleteAdminEducationAccounts(accountIds = []) {
  const options = { method: "DELETE" };
  if (Array.isArray(accountIds) && accountIds.length > 0) {
    options.body = JSON.stringify({ accountIds });
  }

  return requestJson(
    "/admin/education-accounts",
    options,
    { includeAdminToken: true }
  );
}

export async function deleteExpiredAdminEducationAccounts() {
  return requestJson(
    "/admin/education-accounts/expired",
    { method: "DELETE" },
    { includeAdminToken: true }
  );
}

export async function deleteAdminEducationAccount(accountId) {
  return requestJson(
    `/admin/education-accounts/${encodeURIComponent(accountId)}`,
    { method: "DELETE" },
    { includeAdminToken: true }
  );
}

export function importServerPortfoliosToBrowser(serverPortfolios = [], options = {}) {
  const mode = options.mode || "merge";
  const normalizedServerPortfolios = Array.isArray(serverPortfolios)
    ? serverPortfolios.map((portfolio, index) => normalizeServerPortfolioForLocal(portfolio, index))
    : [];

  if (normalizedServerPortfolios.length === 0) {
    throw new Error("불러올 서버 포트폴리오가 없습니다.");
  }

  const currentPortfolios = readJson(PORTFOLIO_LIST_STORAGE_KEY, []);
  const currentList = Array.isArray(currentPortfolios) ? currentPortfolios : [];

  let nextList;

  if (mode === "replace") {
    nextList = normalizedServerPortfolios.map((portfolio, index) => ({
      ...portfolio,
      sortOrder: index,
    }));
  } else {
    const existingIdSet = new Set(currentList.map((portfolio) => String(portfolio?.id || "")));
    const existingNameSet = new Set(currentList.map((portfolio) => String(portfolio?.name || "")));
    const imported = [];

    for (const portfolio of normalizedServerPortfolios) {
      const shouldDuplicateId = existingIdSet.has(String(portfolio.id));
      const nextId = shouldDuplicateId ? `${portfolio.id}-server-${Date.now()}-${imported.length}` : portfolio.id;
      const nextName = makeUniquePortfolioName(portfolio.name || "서버 포트폴리오", existingNameSet);

      existingIdSet.add(String(nextId));
      existingNameSet.add(nextName);

      imported.push({
        ...portfolio,
        id: nextId,
        name: nextName,
        sortOrder: currentList.length + imported.length,
      });
    }

    nextList = [...currentList, ...imported];
  }

  window.localStorage.setItem(PORTFOLIO_LIST_STORAGE_KEY, JSON.stringify(nextList));
  window.localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, nextList[0]?.id || "");
  restoreMbtiProfileFromPortfolios(nextList, {
    activePortfolioId: nextList[0]?.id || "",
    source: "server-portfolio-import",
  });

  if (normalizedServerPortfolios[0]) {
    const first = normalizedServerPortfolios[0];
    const currentSettings = readJson(GLOBAL_SETTINGS_STORAGE_KEY, {});
    const nextSettings = {
      ...currentSettings,
      monthlyCashFlow: currentSettings?.monthlyCashFlow ?? first.monthlyInvestment ?? 1000000,
      years: currentSettings?.years ?? first.investmentYears ?? 10,
      inflationRate: currentSettings?.inflationRate ?? first.inflationRate ?? 2.5,
      dividendReinvest: currentSettings?.dividendReinvest ?? first.dividendReinvest ?? true,
    };
    window.localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings));
  }

  window.dispatchEvent(new Event("finple-local-storage-updated"));

  return {
    mode,
    importedCount: normalizedServerPortfolios.length,
    totalCount: nextList.length,
    activePortfolioId: nextList[0]?.id || null,
  };
}

function normalizeServerPortfolioForLocal(portfolio, index = 0) {
  const assets = Array.isArray(portfolio?.assets)
    ? portfolio.assets.map((asset, assetIndex) => ({
        id: asset.id || `${portfolio.id || "server"}-asset-${assetIndex}`,
        ticker: asset.ticker || "",
        name: asset.name || "",
        quantity: Number(asset.quantity || 0),
        price: Number(asset.price || 0),
        currency: asset.currency || "KRW",
        cagr: Number(asset.cagr || 0),
        beta: Number(asset.beta || 0),
        mdd: Number(asset.mdd || 0),
        dividendYield: Number(asset.dividendYield ?? asset.dividend_yield ?? 0),
        dataSource: asset.dataSource || asset.data_source || "server-db",
        fetchedAt: asset.fetchedAt || asset.fetched_at || null,
        sortOrder: Number(asset.sortOrder ?? asset.sort_order ?? assetIndex),
      }))
    : [];

  return {
    id: portfolio.id || `server-portfolio-${index + 1}`,
    name: portfolio.name || `서버 포트폴리오 ${index + 1}`,
    title: portfolio.name || `서버 포트폴리오 ${index + 1}`,
    description: portfolio.description || "",
    monthlyInvestment: Number(portfolio.monthlyInvestment ?? portfolio.monthly_investment ?? 1000000),
    investmentYears: Number(portfolio.investmentYears ?? portfolio.investment_years ?? 10),
    inflationRate: Number(portfolio.inflationRate ?? portfolio.inflation_rate ?? 2.5),
    dividendReinvest: Boolean(portfolio.dividendReinvest ?? portfolio.dividend_reinvest ?? true),
    assets,
    mbti: portfolio.mbti || null,
    source: "server-db",
    serverId: portfolio.id || null,
    createdAt: portfolio.createdAt || portfolio.created_at || null,
    updatedAt: portfolio.updatedAt || portfolio.updated_at || null,
    sortOrder: Number(portfolio.sortOrder ?? portfolio.sort_order ?? index),
  };
}

function makeUniquePortfolioName(baseName, existingNameSet) {
  if (!existingNameSet.has(baseName)) return baseName;

  const serverName = `${baseName} (서버)`;
  if (!existingNameSet.has(serverName)) return serverName;

  let index = 2;
  while (existingNameSet.has(`${serverName} ${index}`)) {
    index += 1;
  }

  return `${serverName} ${index}`;
}

async function requestJson(path, options = {}, config = {}) {
  const authUser = getStoredFinpleAuthUser();
  const authHeaders = authUser?.id && !config.skipAuthHeader
    ? { "x-finple-user-id": authUser.id }
    : {};
  const adminToken = config.includeAdminToken ? getFinpleAdminToken() : "";
  const adminHeaders = adminToken ? { "x-finple-admin-token": adminToken } : {};
  const requestUrl = buildApiUrl(path);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const timeoutMs = Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 30000;
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);

  if (externalSignal?.aborted) {
    abortFromExternalSignal();
  } else {
    externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });
  }

  let response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...authHeaders,
        ...adminHeaders,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
  } catch {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new Error(
        config.timeoutMessage ||
          (isFormData
            ? "문의 저장 시간이 초과되었습니다. 사진 용량이나 네트워크 상태를 확인한 뒤 다시 시도해 주세요."
            : "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.")
      );
    }
    throw new Error(
      `API 요청에 실패했습니다. 호출 주소: ${requestUrl}. VITE_FINPLE_API_BASE_URL 또는 백엔드 CORS_ORIGIN 설정을 확인해 주세요.`
    );
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }

  const payload = await readResponseJson(response);

  if (!response.ok || payload?.ok === false) {
    const resultErrors = Array.isArray(payload?.results)
      ? payload.results
          .filter((result) => result?.status === "error")
          .map((result) => `${result.name || result.id || "항목"}: ${result.message || "실패"}`)
      : [];

    throw new Error(
      payload?.message ||
        resultErrors.slice(0, 3).join(" / ") ||
        "서버 요청에 실패했습니다. 서버가 잠시 대기 상태이거나 네트워크 연결이 불안정할 수 있습니다. 잠시 후 다시 시도해 주세요."
    );
  }

  return payload;
}

async function readResponseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return fallback;
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}
