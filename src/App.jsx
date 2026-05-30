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

  return content;
}

export default App;
