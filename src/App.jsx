import { useEffect, useState } from "react";
import "./App.css";
import "./components/SiteFooter.css";
import "./components/HomeSimplify.css";
import "./components/LegalPagesPolish.css";
import "./components/LoginPageFinalPolish.css";

import TradingViewTicker from "./components/TradingViewTicker";
import EconomicCalendarSection from "./components/EconomicCalendarSection";
import PersonalPage from "./components/PersonalPage";
import UpdatesPage from "./components/UpdatesPage";
import AboutPage from "./components/AboutPage";
import SiteHeader from "./components/SiteHeader";
import AdminInquiriesPage from "./components/AdminInquiriesPage";
import { getFinpleAdminToken, getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";
import { logoutFinpleAuth } from "./components/authClientService";
import { LoginPage, SignupPage, VerifyEmailPage } from "./components/AuthPages";
import {
  AdminLoginPage,
  MyPage,
  PricingPage,
  SupportPage,
} from "./components/AccountPages";
import {
  PrivacyPage,
  TermsPage,
  InvestmentDisclaimerPage,
} from "./components/LegalPolicyPages";

const ROUTE_PATHS = {
  home: "/",
  about: "/about",
  personal: "/start",
  login: "/login",
  signup: "/signup",
  "verify-email": "/verify-email",
  mypage: "/mypage",
  pricing: "/pricing",
  support: "/support",
  updates: "/updates",
  "admin-login": "/admin",
  "admin-inquiries": "/admin/inquiries",
  privacy: "/privacy",
  terms: "/terms",
  "investment-disclaimer": "/disclaimer",
};

const PERSONAL_ROUTE_PATHS = [
  "/start",
  "/tools",
  "/mbti",
  "/portfolio",
  "/simulator",
  "/market",
  "/report",
];

function getRouteFromPath(pathname) {
  if (PERSONAL_ROUTE_PATHS.includes(pathname)) return "personal";
  const entry = Object.entries(ROUTE_PATHS).find(([, path]) => path === pathname);
  return entry?.[0] || "home";
}

function AuthFooter({ onNavigate }) {
  function handleFooterClick(event, nextRoute) {
    event.preventDefault();
    onNavigate(nextRoute);
  }

  return (
    <footer className="siteFooter authPageFooter">
      <div className="siteFooterBrandBlock">
        <strong>FINPLE Portfolio Lab</strong>
        <span>© 2026 FINPLE. Beta service.</span>
      </div>
      <p className="siteFooterNotice">FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며, 특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.</p>
      <div className="siteFooterLinks">
        <a href="/updates" onClick={(event) => handleFooterClick(event, "updates")}>업데이트</a>
        <a href="/terms" onClick={(event) => handleFooterClick(event, "terms")}>이용약관</a>
        <a href="/privacy" onClick={(event) => handleFooterClick(event, "privacy")}>개인정보처리방침</a>
        <a href="/disclaimer" onClick={(event) => handleFooterClick(event, "investment-disclaimer")}>투자 유의사항</a>
      </div>
    </footer>
  );
}

function App() {
  const [route, setRoute] = useState(() => getRouteFromPath(window.location.pathname));
  const [authTick, setAuthTick] = useState(0);
  const [adminTick, setAdminTick] = useState(0);

  useEffect(() => {
    const onPopState = () => setRoute(getRouteFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const handleAuthUpdate = () => setAuthTick((tick) => tick + 1);
    const handleAdminUpdate = () => setAdminTick((tick) => tick + 1);
    window.addEventListener("finple-auth-updated", handleAuthUpdate);
    window.addEventListener("finple-local-storage-updated", handleAuthUpdate);
    window.addEventListener("finple-admin-auth-updated", handleAdminUpdate);
    window.addEventListener("finple-local-storage-updated", handleAdminUpdate);
    return () => {
      window.removeEventListener("finple-auth-updated", handleAuthUpdate);
      window.removeEventListener("finple-local-storage-updated", handleAuthUpdate);
      window.removeEventListener("finple-admin-auth-updated", handleAdminUpdate);
      window.removeEventListener("finple-local-storage-updated", handleAdminUpdate);
    };
  }, []);

  function navigate(nextRoute) {
    const nextPath = ROUTE_PATHS[nextRoute] || "/";
    window.history.pushState({ route: nextRoute }, "", nextPath);
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLogout() {
    await logoutFinpleAuth();
    navigate("home");
  }

  const authUser = getStoredFinpleAuthUser();
  const isLoggedIn = Boolean(authUser?.id);
  const isAdmin = Boolean(getFinpleAdminToken());
  const authLabel = isAdmin ? "관리자" : isLoggedIn ? "로그오프" : "로그인";

  const pageProps = {
    onNavigate: navigate,
    isLoggedIn,
    isAdmin,
    authTick,
    adminTick,
    onLogout: handleLogout,
  };

  let content = null;
  if (route === "login") content = <LoginPage onNavigate={navigate} />;
  else if (route === "signup") content = <SignupPage onNavigate={navigate} />;
  else if (route === "verify-email") content = <VerifyEmailPage onNavigate={navigate} />;
  else if (route === "mypage") content = isLoggedIn || isAdmin ? <MyPage {...pageProps} /> : <LoginPage onNavigate={navigate} />;
  else if (route === "pricing") content = <PricingPage {...pageProps} />;
  else if (route === "support") content = <SupportPage {...pageProps} />;
  else if (route === "updates") content = <UpdatesPage {...pageProps} />;
  else if (route === "about") content = <AboutPage {...pageProps} />;
  else if (route === "admin-login") content = isAdmin ? <MyPage {...pageProps} /> : <AdminLoginPage onNavigate={navigate} />;
  else if (route === "admin-inquiries") content = isAdmin ? <AdminInquiriesPage {...pageProps} /> : <AdminLoginPage onNavigate={navigate} />;
  else if (route === "privacy") content = <PrivacyPage {...pageProps} />;
  else if (route === "terms") content = <TermsPage {...pageProps} />;
  else if (route === "investment-disclaimer") content = <InvestmentDisclaimerPage {...pageProps} />;
  else if (route === "personal") content = <PersonalPage {...pageProps} />;
  else content = <PersonalPage {...pageProps} />;

  if (["login", "signup", "verify-email"].includes(route)) {
    return (
      <>
        <SiteHeader
          isLoggedIn={isLoggedIn}
          isAdminMode={isAdmin}
          authLabel={authLabel}
          onNavigate={navigate}
          onLoginLogout={isLoggedIn ? handleLogout : () => navigate("login")}
        />
        {content}
        <AuthFooter onNavigate={navigate} />
      </>
    );
  }

  return content;
}

export default App;
