import { useEffect, useRef, useState } from "react";
import "./App.css";
import "./components/SiteFooter.css";
import "./components/HomeSimplify.css";
import "./components/HomeHeroMbtiCarousel.css";
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
  RefundPolicyPage,
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
  "admin-members": "/admin/members",
  "admin-subscriptions": "/admin/subscriptions",
  "admin-ai-usage": "/admin/ai-usage",
  "admin-education": "/admin/education",
  "admin-clear": "/admin/clear",
  privacy: "/privacy",
  terms: "/terms",
  refund: "/refund",
  "investment-disclaimer": "/disclaimer",
};

const PERSONAL_ROUTE_PATHS = [
  "/start",
  "/tools",
  "/mbti",
  "/simulator",
  "/simulator/us",
  "/simulator/kr",
  "/screener",
];

const POST_LOGIN_REDIRECT_STORAGE_KEY = "finple-post-login-redirect-page";

const HERO_MBTI_ROTATION_MS = 2400;
const HERO_MBTI_TEXT_TRANSITION_MS = 520;
const HERO_MBTI_NUMBER_TRANSITION_MS = 900;

const HERO_MBTI_PRESETS = [
  {
    name: "차분한 수호자형",
    status: "안정추구형",
    metrics: [
      { label: "성향", value: "안정 · 장기" },
      { label: "운용", value: "자동 · 분산" },
      { label: "중심 자산", value: "배당·종합채권" },
    ],
    allocations: [
      { label: "성장주", value: 10 },
      { label: "가치·배당", value: 28 },
      { label: "종합채권", value: 24 },
      { label: "장기국채", value: 8 },
      { label: "리츠", value: 6 },
      { label: "금", value: 8 },
      { label: "현금", value: 16 },
    ],
  },
  {
    name: "균형 잡힌 건축가형",
    status: "적극투자형",
    metrics: [
      { label: "성향", value: "성장 · 장기" },
      { label: "운용", value: "주도 · 분산" },
      { label: "중심 자산", value: "성장·분산" },
    ],
    allocations: [
      { label: "성장주", value: 45 },
      { label: "가치·배당", value: 22 },
      { label: "종합채권", value: 8 },
      { label: "장기국채", value: 4 },
      { label: "리츠", value: 7 },
      { label: "금", value: 8 },
      { label: "현금", value: 6 },
    ],
  },
  {
    name: "장기 성장 전략가형",
    status: "적극투자형",
    metrics: [
      { label: "성향", value: "성장 · 장기" },
      { label: "운용", value: "주도 · 확신" },
      { label: "중심 자산", value: "성장·블록체인" },
    ],
    allocations: [
      { label: "성장주", value: 65 },
      { label: "가치·배당", value: 18 },
      { label: "종합채권", value: 0 },
      { label: "장기국채", value: 8 },
      { label: "리츠", value: 0 },
      { label: "금", value: 4 },
      { label: "현금", value: 5 },
    ],
  },
  {
    name: "용감한 승부사형",
    status: "공격투자형",
    metrics: [
      { label: "성향", value: "성장 · 기회" },
      { label: "운용", value: "주도 · 확신" },
      { label: "중심 자산", value: "성장·블록체인" },
    ],
    allocations: [
      { label: "성장주", value: 85 },
      { label: "가치·배당", value: 5 },
      { label: "종합채권", value: 0 },
      { label: "장기국채", value: 0 },
      { label: "리츠", value: 0 },
      { label: "금", value: 5 },
      { label: "현금", value: 5 },
    ],
  },
];

function normalizePathname(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
}

function getPathForPage(page) {
  return ROUTE_PATHS[page] || "/";
}

function getPageForPath(pathname, hash = "") {
  const normalizedPath = normalizePathname(pathname);
  const normalizedHash = String(hash || "").replace("#", "");

  if (PERSONAL_ROUTE_PATHS.includes(normalizedPath) || normalizedHash === "simulator") return "personal";
  if (normalizedPath === "/about" || normalizedHash === "about") return "about";
  if (normalizedPath === "/login" || normalizedHash === "login") return "login";
  if (normalizedPath === "/signup" || normalizedHash === "signup") return "signup";
  if (normalizedPath === "/verify-email" || normalizedHash === "verify-email") return "verify-email";
  if (normalizedPath === "/mypage" || normalizedHash === "mypage") return "mypage";
  if (normalizedPath === "/pricing" || normalizedHash === "pricing") return "pricing";
  if (normalizedPath === "/support" || normalizedHash === "support") return "support";
  if (normalizedPath === "/updates" || normalizedHash === "updates" || normalizedHash === "notice" || normalizedHash === "changelog") return "updates";
  if (normalizedPath === "/admin/inquiries" || normalizedHash === "admin-inquiries") return "admin-inquiries";
  if (normalizedPath === "/admin/members" || normalizedHash === "admin-members") return "admin-members";
  if (normalizedPath === "/admin/subscriptions" || normalizedHash === "admin-subscriptions") return "admin-subscriptions";
  if (normalizedPath === "/admin/ai-usage" || normalizedHash === "admin-ai-usage") return "admin-ai-usage";
  if (normalizedPath === "/admin/education" || normalizedHash === "admin-education") return "admin-education";
  if (normalizedPath === "/admin/clear" || normalizedHash === "admin-clear") return "admin-clear";
  if (normalizedPath === "/admin" || normalizedHash === "admin") return "admin-login";
  if (normalizedPath === "/privacy" || normalizedHash === "privacy") return "privacy";
  if (normalizedPath === "/terms" || normalizedHash === "terms") return "terms";
  if (normalizedPath === "/refund" || normalizedHash === "refund") return "refund";
  if (normalizedPath === "/disclaimer" || normalizedHash === "disclaimer") return "investment-disclaimer";

  return "home";
}

function getInitialPage() {
  if (typeof window === "undefined") return "home";
  return getPageForPath(window.location.pathname, window.location.hash);
}

function schedulePageTopScroll(delay = 70) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), delay);
}

function rememberPostLoginRedirectPage(page) {
  if (typeof window === "undefined") return;
  if (page !== "personal") return;
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_STORAGE_KEY, page);
}

function clearPostLoginRedirectPage() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_STORAGE_KEY);
}

function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [adminTokenVersion, setAdminTokenVersion] = useState(0);
  const [personalHeaderSubNav, setPersonalHeaderSubNav] = useState(null);

  useEffect(() => {
    document.body?.setAttribute("data-finple-spa-active", "true");
    return () => document.body?.removeAttribute("data-finple-spa-active");
  }, []);

  function isFinpleUserLoggedIn() {
    return Boolean(getStoredFinpleAuthUser()?.id);
  }

  function hasFinpleAdminToken() {
    return Boolean(getFinpleAdminToken());
  }

  function navigateToPage(page, options = {}) {
    if (page === "personal" && !isFinpleUserLoggedIn()) {
      rememberPostLoginRedirectPage(page);
      setCurrentPage("login");
      if (options.scrollTop !== false) schedulePageTopScroll();
      return;
    }

    if (page === "login" && !options.preserveLoginRedirect) {
      clearPostLoginRedirectPage();
    }

    setCurrentPage(page);
    if (options.scrollTop !== false) schedulePageTopScroll();
  }

  useEffect(() => {
    function handleAdminTokenUpdate() {
      setAdminTokenVersion((version) => version + 1);
    }

    window.addEventListener("finple-admin-token-updated", handleAdminTokenUpdate);
    window.addEventListener("storage", handleAdminTokenUpdate);
    return () => {
      window.removeEventListener("finple-admin-token-updated", handleAdminTokenUpdate);
      window.removeEventListener("storage", handleAdminTokenUpdate);
    };
  }, []);

  useEffect(() => {
    let redirectPage = null;

    if (currentPage === "mypage" && !isFinpleUserLoggedIn()) {
      redirectPage = "login";
    }

    if (currentPage === "personal" && !isFinpleUserLoggedIn()) {
      rememberPostLoginRedirectPage("personal");
      redirectPage = "login";
    }

    if (["admin-inquiries", "admin-members", "admin-subscriptions", "admin-ai-usage", "admin-education", "admin-clear"].includes(currentPage) && !hasFinpleAdminToken()) {
      redirectPage = "admin-login";
    }

    if (!redirectPage) return undefined;

    const redirectTimer = window.setTimeout(() => setCurrentPage(redirectPage), 0);
    return () => window.clearTimeout(redirectTimer);
  }, [currentPage, adminTokenVersion]);

  useEffect(() => {
    const nextPath = getPathForPage(currentPage);
    const currentPath = normalizePathname(window.location.pathname || "/");

    if (currentPage === "personal" && PERSONAL_ROUTE_PATHS.includes(currentPath)) return;

    if (currentPage === "verify-email" && currentPath === "/verify-email") return;

    if (currentPath !== nextPath) {
      window.history.pushState({ page: currentPage }, "", nextPath);
    }
  }, [currentPage]);

  useEffect(() => {
    function handlePopState() {
      setCurrentPage(getPageForPath(window.location.pathname, window.location.hash));
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (currentPage !== "mypage") return undefined;

    const sideMenuSelector = [
      ".accountSidebar a",
      ".accountSidebar button",
      ".accountSideNav a",
      ".accountSideNav button",
      ".accountSideMenu a",
      ".accountSideMenu button",
      ".accountMenu a",
      ".accountMenu button",
      ".accountTabList a",
      ".accountTabList button",
      ".myPageSidebar a",
      ".myPageSidebar button",
      ".myPageSidePanel a",
      ".myPageSidePanel button",
      ".myPageMenu a",
      ".myPageMenu button",
      ".myPageNav a",
      ".myPageNav button",
      ".mypageSidebar a",
      ".mypageSidebar button",
      ".mypageSideNav a",
      ".mypageSideNav button",
      ".mypageMenu a",
      ".mypageMenu button",
      ".mypageNav a",
      ".mypageNav button",
      "a[href^='#']",
      "a[href^='/mypage#']",
    ].join(", ");

    function scheduleShortScrollRestore() {
      const lockedX = window.scrollX;
      const lockedY = window.scrollY;

      function restoreScroll() {
        window.scrollTo({ left: lockedX, top: lockedY, behavior: "auto" });
      }

      window.requestAnimationFrame(restoreScroll);
      window.setTimeout(restoreScroll, 0);
      window.setTimeout(restoreScroll, 80);
    }

    function preventMyPageMenuScroll(event) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const menuTarget = target.closest(sideMenuSelector);
      if (!menuTarget) return;

      if (menuTarget.matches("a[href^='#'], a[href^='/mypage#']")) {
        event.preventDefault();
        event.stopPropagation();
        window.history.replaceState({ page: "mypage" }, "", "/mypage");
      }

      scheduleShortScrollRestore();
    }

    document.addEventListener("click", preventMyPageMenuScroll, true);
    return () => document.removeEventListener("click", preventMyPageMenuScroll, true);
  }, [currentPage]);

  useEffect(() => {
    function isEditableTarget(target) {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true'], .allowTextSelection"));
    }

    function preventCopyInteraction(event) {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    }

    document.body.classList.add("finpleCopyGuard");
    document.addEventListener("contextmenu", preventCopyInteraction);
    document.addEventListener("dragstart", preventCopyInteraction);
    document.addEventListener("selectstart", preventCopyInteraction);
    document.addEventListener("copy", preventCopyInteraction);

    return () => {
      document.body.classList.remove("finpleCopyGuard");
      document.removeEventListener("contextmenu", preventCopyInteraction);
      document.removeEventListener("dragstart", preventCopyInteraction);
      document.removeEventListener("selectstart", preventCopyInteraction);
      document.removeEventListener("copy", preventCopyInteraction);
    };
  }, []);

  const stockIndexSymbols = [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { description: "Nasdaq 100", proName: "CAPITALCOM:US100" },
    { description: "Dow Jones 30", proName: "BLACKBULL:US30" },
    { description: "Russell 2000", proName: "CAPITALCOM:RTY" },
  ];

  const currencyCryptoSymbols = [
    { description: "USD/KRW", proName: "PEPPERSTONE:USDKRW" },
    { proName: "FX_IDC:JPYKRW", title: "JPY/KRW" },
    { description: "BTC/KRW", proName: "UPBIT:BTCKRW" },
    { proName: "BITHUMB:ETHKRW", title: "ETH/KRW" },
  ];

  function goHome() {
    navigateToPage("home", { scrollTop: false });
    schedulePageTopScroll(40);
  }

  function goPersonal() {
    if (!isFinpleUserLoggedIn()) {
      navigateToPage("personal");
      return;
    }

    setCurrentPage("personal");
    if (window.location.pathname !== "/start") window.history.pushState({ page: "personal" }, "", "/start");
    window.dispatchEvent(new CustomEvent("finple-open-personal-view", { detail: { view: "hub" } }));
    schedulePageTopScroll();
  }

  async function handleHeaderLoginLogout() {
    if (isFinpleUserLoggedIn()) {
      await logoutFinpleAuth();
      navigateToPage("home");
      return;
    }

    navigateToPage("login");
  }

  function getHeaderAuthLabel() {
    return isFinpleUserLoggedIn() ? "로그아웃" : "로그인";
  }

  function scrollHomeToSection(sectionId) {
    if (currentPage !== "home") setCurrentPage("home");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function renderShell(pageContent, { includeHeader = true, subNav = null } = {}) {
    return (
      <>
        {includeHeader ? (
          <SiteHeader
            isLoggedIn={isFinpleUserLoggedIn()}
            authLabel={getHeaderAuthLabel()}
            activePage={currentPage}
            onHome={goHome}
            onStart={goPersonal}
            onNavigate={navigateToPage}
            onLoginLogout={handleHeaderLoginLogout}
            localNav={subNav}
          />
        ) : null}
        {pageContent}
        <SiteFooter onNavigate={navigateToPage} />
      </>
    );
  }

  function handleAdminNavigate(page) {
    setCurrentPage(page === "mypage" ? "admin-inquiries" : page);
  }

  if (currentPage === "personal" && !isFinpleUserLoggedIn()) return renderShell(<LoginPage onNavigate={navigateToPage} />);
  if (currentPage === "personal") {
    return renderShell(
      <PersonalPage
        onBack={goHome}
        onNavigate={navigateToPage}
        onHeaderSubNavChange={setPersonalHeaderSubNav}
      />,
      { subNav: personalHeaderSubNav }
    );
  }
  if (currentPage === "about") return renderShell(<AboutPage onNavigate={navigateToPage} />);
  if (currentPage === "admin-login") return renderShell(<AdminLoginPage onNavigate={handleAdminNavigate} />);
  if (currentPage === "admin-inquiries") return renderShell(<AdminInquiriesPage onNavigate={navigateToPage} initialSection="inquiries" />);
  if (currentPage === "admin-members") return renderShell(<AdminInquiriesPage onNavigate={navigateToPage} initialSection="members" />);
  if (currentPage === "admin-subscriptions") return renderShell(<AdminInquiriesPage onNavigate={navigateToPage} initialSection="subscriptions" />);
  if (currentPage === "admin-ai-usage") return renderShell(<AdminInquiriesPage onNavigate={navigateToPage} initialSection="ai-usage" />);
  if (currentPage === "admin-education") return renderShell(<AdminInquiriesPage onNavigate={navigateToPage} initialSection="education" />);
  if (currentPage === "admin-clear") return renderShell(<AdminInquiriesPage onNavigate={navigateToPage} initialSection="clear" />);
  if (currentPage === "login") return renderShell(<LoginPage onNavigate={navigateToPage} />);
  if (currentPage === "signup") return renderShell(<SignupPage onNavigate={navigateToPage} />);
  if (currentPage === "verify-email") return renderShell(<VerifyEmailPage onNavigate={navigateToPage} />);
  if (currentPage === "mypage" && !isFinpleUserLoggedIn()) return renderShell(<LoginPage onNavigate={navigateToPage} />);
  if (currentPage === "mypage") return renderShell(<MyPage onNavigate={navigateToPage} />);
  if (currentPage === "pricing") return renderShell(<PricingPage onNavigate={navigateToPage} />);
  if (currentPage === "support") return renderShell(<SupportPage onNavigate={navigateToPage} />);
  if (currentPage === "updates") return renderShell(<UpdatesPage onNavigate={navigateToPage} />);
  if (currentPage === "privacy") return renderShell(<PrivacyPage onNavigate={navigateToPage} />);
  if (currentPage === "terms") return renderShell(<TermsPage onNavigate={navigateToPage} />);
  if (currentPage === "refund") return renderShell(<RefundPolicyPage onNavigate={navigateToPage} />);
  if (currentPage === "investment-disclaimer") return renderShell(<InvestmentDisclaimerPage onNavigate={navigateToPage} />);

  return renderShell(
    <main className="page">
      <div className="tickerArea"><TradingViewTicker symbols={[...stockIndexSymbols, ...currencyCryptoSymbols]} /></div>

      <section id="hero" className="hero">
        <div className="heroText">
          <p className="badge">투자 포트폴리오 분석 웹앱</p>
          <h1>투자 성향부터<br />포트폴리오까지<br />한 번에 점검하세요</h1>
          <p className="description">FINPLE은 투자 성향, 자산 비중, 장기 예상 성과를 연결해, 내 포트폴리오의 수익률·위험·배당·실질가치를 함께 점검하는 투자 분석 도구입니다.</p>
          <div className="heroButtons">
            <button className="primaryButton" onClick={goPersonal}>무료로 시작하기</button>
            <button type="button" className="secondaryButton" onClick={() => navigateToPage("about")}>FINPLE 알아보기</button>
          </div>
        </div>

        <HeroMbtiPresetCard />
      </section>

      <div id="index" className="homeLegacyAnchor" aria-hidden="true" />
      <div id="calendar" className="homeAnchor"><EconomicCalendarSection /></div>

      <section id="pricing" className="section pricingPreviewSection">
        <p className="sectionLabel">Pricing</p><h2>처음에는 무료로 시작하고, 필요한 기능만 확장합니다</h2><p>베타 기간에는 핵심 기능을 가볍게 체험할 수 있도록 구성했습니다.</p>
        <div className="priceGrid"><PriceCard name="Free" price="0원" items={["기본 시뮬레이션", "브라우저 저장", "AI 분석 제한"]} onConfirm={() => navigateToPage("pricing")} /><PriceCard name="Personal" price="월 9,900원" featured items={["서버 저장", "PDF 리포트", "AI 분석 20회/일"]} onConfirm={() => navigateToPage("pricing")} /><PriceCard name="Pro" price="준비 중" items={["고급 백테스트", "리밸런싱", "AI 운영 한도 확장"]} onConfirm={() => navigateToPage("pricing")} /></div>
      </section>
    </main>,
    {
      subNav: (
        <nav className="routeSubNav homeRouteSubNav" aria-label="홈 섹션 이동">
          <button type="button" onClick={() => scrollHomeToSection("hero")}>소개</button>
          <button type="button" onClick={() => scrollHomeToSection("calendar")}>캘린더</button>
          <button type="button" onClick={() => scrollHomeToSection("pricing")}>요금제</button>
        </nav>
      ),
    }
  );
}

function HeroMbtiPresetCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const preset = HERO_MBTI_PRESETS[activeIndex % HERO_MBTI_PRESETS.length];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % HERO_MBTI_PRESETS.length);
    }, HERO_MBTI_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="dashboardCard heroMbtiCard" aria-live="polite">
      <div className="cardHeader heroMbtiHeader">
        <div>
          <h2><CrossfadeText value={preset.name} /></h2>
        </div>
        <span className="status heroMbtiStatus"><CrossfadeText value={preset.status} /></span>
      </div>

      <div className="metrics heroMbtiMetrics">
        {preset.metrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} animated />
        ))}
      </div>

      <div className="bars heroMbtiBars">
        {preset.allocations.map((item) => <Bar key={item.label} label={item.label} value={item.value} />)}
      </div>

      <div className="heroMbtiPager" aria-label="투자 MBTI 포트폴리오 예시 선택">
        {HERO_MBTI_PRESETS.map((item, index) => (
          <button
            key={item.name}
            type="button"
            className={index === activeIndex ? "active" : ""}
            onClick={() => setActiveIndex(index)}
            aria-label={`${item.name} 보기`}
          />
        ))}
      </div>
    </div>
  );
}

function CrossfadeText({ value }) {
  const nextValue = String(value ?? "");
  const currentValueRef = useRef(nextValue);
  const timeoutRef = useRef(null);
  const [textState, setTextState] = useState({ current: nextValue, previous: null });

  useEffect(() => {
    if (nextValue === currentValueRef.current) return undefined;

    const previous = currentValueRef.current;
    currentValueRef.current = nextValue;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    setTextState({ current: nextValue, previous });
    timeoutRef.current = window.setTimeout(() => {
      setTextState(({ current }) => ({ current, previous: null }));
      timeoutRef.current = null;
    }, HERO_MBTI_TEXT_TRANSITION_MS);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [nextValue]);

  return (
    <span className={textState.previous ? "heroMbtiCrossfadeText isTransitioning" : "heroMbtiCrossfadeText"}>
      <span className="heroMbtiTextCurrent">{textState.current}</span>
      {textState.previous ? <span className="heroMbtiTextPrevious">{textState.previous}</span> : null}
    </span>
  );
}

function useAnimatedNumber(value, duration = HERO_MBTI_NUMBER_TRANSITION_MS) {
  const targetValue = Number(value) || 0;
  const frameRef = useRef(null);
  const displayedValueRef = useRef(targetValue);
  const [displayedValue, setDisplayedValue] = useState(targetValue);

  useEffect(() => {
    const startValue = displayedValueRef.current;
    const difference = targetValue - startValue;

    if (difference === 0) {
      setDisplayedValue(targetValue);
      return undefined;
    }

    let startTime = null;

    function animate(timestamp) {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextDisplayedValue = startValue + difference * easedProgress;

      displayedValueRef.current = nextDisplayedValue;
      setDisplayedValue(nextDisplayedValue);

      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(animate);
      } else {
        displayedValueRef.current = targetValue;
        setDisplayedValue(targetValue);
        frameRef.current = null;
      }
    }

    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [targetValue, duration]);

  return Math.round(displayedValue);
}

function AnimatedPercent({ value }) {
  const animatedValue = useAnimatedNumber(value);
  return <span className="heroMbtiPercentText">{animatedValue}%</span>;
}

function Metric({ label, value, animated = false }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{animated ? <CrossfadeText value={value} /> : value}</strong>
    </div>
  );
}
function Bar({ label, value }) { return <div><div className="barLabel"><span>{label}</span><strong><AnimatedPercent value={value} /></strong></div><div className="barTrack"><div className="barFill" style={{ width: `${value}%` }} /></div></div>; }
function PriceCard({ name, price, items, featured, onConfirm }) { return <article className={featured ? "priceCard featured" : "priceCard"}><h3>{name}</h3><strong>{price}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><button type="button" className="primaryButton" onClick={onConfirm}>확인</button></article>; }
function SiteFooter({ onNavigate }) {
  function handleFooterLink(event, page) {
    event.preventDefault();
    onNavigate(page);
  }

  return (
    <footer className="footer siteFooter">
      <div className="siteFooterBrandBlock">
        <strong>FINPLE Portfolio Lab</strong>
        <span>© 2026 FINPLE.</span>
      </div>
      <p className="siteFooterNotice">
        FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며,<span className="siteFooterNoticeMobileSpace"> </span><br className="siteFooterNoticeBreak" />
        특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.
      </p>
      <div className="siteFooterActions">
        <select
          className="siteFooterMobileMenu"
          defaultValue=""
          aria-label="푸터 메뉴"
          onChange={(event) => {
            const page = event.target.value;
            if (!page) return;
            onNavigate(page);
            event.target.value = "";
          }}
        >
          <option value="" disabled>메뉴 선택</option>
          <option value="updates">업데이트</option>
          <option value="terms">이용약관</option>
          <option value="privacy">개인정보처리방침</option>
          <option value="refund">환불정책</option>
          <option value="investment-disclaimer">투자 유의사항</option>
        </select>
        <nav className="siteFooterLinks" aria-label="FINPLE 정책 및 업데이트 링크">
          <a href="/updates" onClick={(event) => handleFooterLink(event, "updates")}>업데이트</a>
          <a href="/terms" onClick={(event) => handleFooterLink(event, "terms")}>이용약관</a>
          <a href="/privacy" onClick={(event) => handleFooterLink(event, "privacy")}>개인정보처리방침</a>
          <a href="/refund" onClick={(event) => handleFooterLink(event, "refund")}>환불정책</a>
          <a href="/disclaimer" onClick={(event) => handleFooterLink(event, "investment-disclaimer")}>투자 유의사항</a>
        </nav>
        <div className="siteFooterSocials" aria-label="FINPLE 소셜 미디어">
          <a
            href="https://www.instagram.com/finple_lab/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="FINPLE Instagram 새 창에서 열기"
            title="Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4.25" />
              <circle className="siteFooterSocialDot" cx="17.4" cy="6.7" r="1" />
            </svg>
          </a>
          <span
            className="siteFooterSocialPlaceholder"
            role="img"
            aria-label="FINPLE YouTube 준비 중"
            title="YouTube 준비 중"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21.2 7.1a2.7 2.7 0 0 0-1.9-1.9C17.7 4.8 12 4.8 12 4.8s-5.7 0-7.3.4a2.7 2.7 0 0 0-1.9 1.9A28 28 0 0 0 2.4 12a28 28 0 0 0 .4 4.9 2.7 2.7 0 0 0 1.9 1.9c1.6.4 7.3.4 7.3.4s5.7 0 7.3-.4a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .4-4.9 28 28 0 0 0-.4-4.9Z" />
              <path className="siteFooterSocialPlay" d="m10 15.2 5-3.2-5-3.2v6.4Z" />
            </svg>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default App;
