import { useEffect, useState } from "react";
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
  "/simulator",
  "/simulator/us",
  "/simulator/kr",
  "/screener",
];

const HERO_MBTI_ROTATION_MS = 2400;

const HERO_MBTI_PRESETS = [
  {
    name: "차분한 수호자형",
    status: "안정추구형",
    metrics: [
      { label: "성향", value: "안정 · 장기" },
      { label: "운용", value: "자동 · 분산" },
      { label: "중심 자산", value: "배당·채권" },
    ],
    allocations: [
      { label: "성장주", value: 13 },
      { label: "가치·배당", value: 30 },
      { label: "채권", value: 30 },
      { label: "리츠", value: 5 },
      { label: "금", value: 8 },
      { label: "코인", value: 0 },
      { label: "현금", value: 14 },
    ],
  },
  {
    name: "균형 잡힌 건축가형",
    status: "적극투자형",
    metrics: [
      { label: "성향", value: "성장 · 장기" },
      { label: "운용", value: "주도 · 분산" },
      { label: "중심 자산", value: "성장·배당" },
    ],
    allocations: [
      { label: "성장주", value: 45 },
      { label: "가치·배당", value: 22 },
      { label: "채권", value: 12 },
      { label: "리츠", value: 5 },
      { label: "금", value: 8 },
      { label: "코인", value: 0 },
      { label: "현금", value: 8 },
    ],
  },
  {
    name: "장기 성장 전략가형",
    status: "적극투자형",
    metrics: [
      { label: "성향", value: "성장 · 장기" },
      { label: "운용", value: "주도 · 확신" },
      { label: "중심 자산", value: "성장·코인" },
    ],
    allocations: [
      { label: "성장주", value: 43 },
      { label: "가치·배당", value: 22 },
      { label: "채권", value: 12 },
      { label: "리츠", value: 5 },
      { label: "금", value: 8 },
      { label: "코인", value: 10 },
      { label: "현금", value: 0 },
    ],
  },
  {
    name: "용감한 승부사형",
    status: "공격투자형",
    metrics: [
      { label: "성향", value: "성장 · 기회" },
      { label: "운용", value: "주도 · 확신" },
      { label: "중심 자산", value: "성장·대체" },
    ],
    allocations: [
      { label: "성장주", value: 41 },
      { label: "가치·배당", value: 22 },
      { label: "채권", value: 12 },
      { label: "리츠", value: 5 },
      { label: "금", value: 10 },
      { label: "코인", value: 10 },
      { label: "현금", value: 0 },
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
  if (normalizedPath === "/admin" || normalizedHash === "admin") return "admin-login";
  if (normalizedPath === "/privacy" || normalizedHash === "privacy") return "privacy";
  if (normalizedPath === "/terms" || normalizedHash === "terms") return "terms";
  if (normalizedPath === "/disclaimer" || normalizedHash === "disclaimer") return "investment-disclaimer";

  return "home";
}

function getInitialPage() {
  if (typeof window === "undefined") return "home";
  return getPageForPath(window.location.pathname, window.location.hash);
}

function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [adminTokenVersion, setAdminTokenVersion] = useState(0);
  const [heroPresetIndex, setHeroPresetIndex] = useState(0);

  function isFinpleUserLoggedIn() {
    return Boolean(getStoredFinpleAuthUser()?.id);
  }

  function hasFinpleAdminToken() {
    return Boolean(getFinpleAdminToken());
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
    if (currentPage === "mypage" && !isFinpleUserLoggedIn()) {
      setCurrentPage("login");
    }

    if (currentPage === "admin-inquiries" && !hasFinpleAdminToken()) {
      setCurrentPage("admin-login");
    }
  }, [currentPage, adminTokenVersion]);

  useEffect(() => {
    const nextPath = getPathForPage(currentPage);
    const currentPath = normalizePathname(window.location.pathname || "/");

    if (currentPage === "personal" && PERSONAL_ROUTE_PATHS.includes(currentPath)) return;

    if (currentPage === "verify-email" && currentPath === "/verify-email") return;

    if (currentPath !== nextPath) {
      window.history.pushState({ page: currentPage }, "", nextPath);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
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

  useEffect(() => {
    if (currentPage !== "home") return undefined;

    const timer = window.setInterval(() => {
      setHeroPresetIndex((index) => (index + 1) % HERO_MBTI_PRESETS.length);
    }, HERO_MBTI_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [currentPage]);

  const activeHeroPreset = HERO_MBTI_PRESETS[heroPresetIndex % HERO_MBTI_PRESETS.length];

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
    setCurrentPage("home");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 40);
  }

  function goPersonal() {
    setCurrentPage("personal");
    if (window.location.pathname !== "/start") window.history.pushState({ page: "personal" }, "", "/start");
  }

  async function handleHeaderLoginLogout() {
    if (isFinpleUserLoggedIn()) {
      await logoutFinpleAuth();
      setCurrentPage("home");
      return;
    }

    if (hasFinpleAdminToken()) {
      setCurrentPage("admin-inquiries");
      return;
    }

    setCurrentPage("login");
  }

  function getHeaderAuthLabel() {
    if (isFinpleUserLoggedIn()) return "로그오프";
    if (hasFinpleAdminToken()) return "관리자";
    return "로그인";
  }

  function scrollHomeToSection(sectionId) {
    if (currentPage !== "home") setCurrentPage("home");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function renderShell(pageContent, { includeHeader = true } = {}) {
    return (
      <>
        {includeHeader ? (
          <SiteHeader
            isLoggedIn={isFinpleUserLoggedIn()}
            isAdminMode={hasFinpleAdminToken() && !isFinpleUserLoggedIn()}
            authLabel={getHeaderAuthLabel()}
            onHome={goHome}
            onStart={goPersonal}
            onNavigate={setCurrentPage}
            onLoginLogout={handleHeaderLoginLogout}
            onHomeSection={scrollHomeToSection}
          />
        ) : null}
        {pageContent}
        <SiteFooter onNavigate={setCurrentPage} />
      </>
    );
  }

  function handleAdminNavigate(page) {
    setCurrentPage(page === "mypage" ? "admin-inquiries" : page);
  }

  if (currentPage === "personal") return renderShell(<PersonalPage onBack={goHome} />, { includeHeader: false });
  if (currentPage === "about") return renderShell(<AboutPage onNavigate={setCurrentPage} />);
  if (currentPage === "admin-login") return renderShell(<AdminLoginPage onNavigate={handleAdminNavigate} />);
  if (currentPage === "admin-inquiries") return renderShell(<AdminInquiriesPage onNavigate={setCurrentPage} />);
  if (currentPage === "login") return renderShell(<LoginPage onNavigate={setCurrentPage} />);
  if (currentPage === "signup") return renderShell(<SignupPage onNavigate={setCurrentPage} />);
  if (currentPage === "verify-email") return renderShell(<VerifyEmailPage onNavigate={setCurrentPage} />);
  if (currentPage === "mypage" && !isFinpleUserLoggedIn()) return renderShell(<LoginPage onNavigate={setCurrentPage} />);
  if (currentPage === "mypage") return renderShell(<MyPage onNavigate={setCurrentPage} />);
  if (currentPage === "pricing") return renderShell(<PricingPage onNavigate={setCurrentPage} />);
  if (currentPage === "support") return renderShell(<SupportPage onNavigate={setCurrentPage} />);
  if (currentPage === "updates") return renderShell(<UpdatesPage onNavigate={setCurrentPage} />);
  if (currentPage === "privacy") return renderShell(<PrivacyPage onNavigate={setCurrentPage} />);
  if (currentPage === "terms") return renderShell(<TermsPage onNavigate={setCurrentPage} />);
  if (currentPage === "investment-disclaimer") return renderShell(<InvestmentDisclaimerPage onNavigate={setCurrentPage} />);

  return (
    <main className="page">
      <SiteHeader
        isLoggedIn={isFinpleUserLoggedIn()}
        isAdminMode={hasFinpleAdminToken() && !isFinpleUserLoggedIn()}
        authLabel={getHeaderAuthLabel()}
        onHome={goHome}
        onStart={goPersonal}
        onNavigate={setCurrentPage}
        onLoginLogout={handleHeaderLoginLogout}
        onHomeSection={scrollHomeToSection}
        showHomeSectionNav
      />

      <div className="tickerArea"><TradingViewTicker symbols={[...stockIndexSymbols, ...currencyCryptoSymbols]} /></div>

      <section id="hero" className="hero">
        <div className="heroText">
          <p className="badge">투자 포트폴리오 분석 웹앱</p>
          <h1>투자 성향부터<br />포트폴리오까지<br />한 번에 점검하세요</h1>
          <p className="description">FINPLE은 투자 성향, 자산 비중, 장기 예상 성과를 연결해, 내 포트폴리오의 수익률·위험·배당·실질가치를 함께 점검하는 투자 분석 도구입니다.</p>
          <div className="heroButtons">
            <button className="primaryButton" onClick={goPersonal}>무료로 시작하기</button>
            <button type="button" className="secondaryButton" onClick={() => setCurrentPage("about")}>FINPLE 알아보기</button>
          </div>
        </div>

        <HeroMbtiPresetCard
          preset={activeHeroPreset}
          activeIndex={heroPresetIndex}
          onSelect={setHeroPresetIndex}
        />
      </section>

      <div id="index" className="homeAnchor"><EconomicCalendarSection /></div>

      <section id="pricing" className="section pricingPreviewSection">
        <p className="sectionLabel">Pricing</p><h2>처음에는 무료로 시작하고, 필요한 기능만 확장합니다</h2><p>베타 기간에는 핵심 기능을 가볍게 체험할 수 있도록 구성했습니다.</p>
        <div className="priceGrid"><PriceCard name="Free" price="0원" items={["기본 시뮬레이션", "브라우저 저장", "요약 리포트"]} /><PriceCard name="Personal" price="월 9,900원" featured items={["서버 저장", "PDF 리포트", "확장 조회"]} /><PriceCard name="Pro" price="준비 중" items={["고급 백테스트", "리밸런싱", "업무용 리포트"]} /></div>
      </section>

      <SiteFooter onNavigate={setCurrentPage} />
    </main>
  );
}

function HeroMbtiPresetCard({ preset, activeIndex, onSelect }) {
  return (
    <div className="dashboardCard heroMbtiCard" aria-live="polite">
      <div className="cardHeader heroMbtiHeader">
        <div>
          <h2><span key={preset.name} className="heroMbtiChangingText">{preset.name}</span></h2>
        </div>
        <span key={preset.status} className="status heroMbtiStatus heroMbtiChangingText">{preset.status}</span>
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
            onClick={() => onSelect(index)}
            aria-label={`${item.name} 보기`}
          />
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, animated = false }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{animated ? <span key={`${label}-${value}`} className="heroMbtiChangingText">{value}</span> : value}</strong>
    </div>
  );
}
function Bar({ label, value }) { return <div><div className="barLabel"><span>{label}</span><strong><span key={`${label}-${value}`} className="heroMbtiChangingText">{value}%</span></strong></div><div className="barTrack"><div className="barFill" style={{ width: `${value}%` }} /></div></div>; }
function PriceCard({ name, price, items, featured }) { return <article className={featured ? "priceCard featured" : "priceCard"}><h3>{name}</h3><strong>{price}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><button type="button" className="primaryButton">확인</button></article>; }
function SiteFooter({ onNavigate }) {
  function handleFooterLink(event, page) {
    event.preventDefault();
    onNavigate(page);
  }

  return (
    <footer className="footer siteFooter">
      <div className="siteFooterBrandBlock">
        <strong>FINPLE Portfolio Lab</strong>
        <span>© 2026 FINPLE. Beta service.</span>
      </div>
      <p className="siteFooterNotice">
        FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료이며,
        특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.
      </p>
      <nav className="siteFooterLinks" aria-label="FINPLE 정책 및 업데이트 링크">
        <a href="/updates" onClick={(event) => handleFooterLink(event, "updates")}>업데이트</a>
        <a href="/terms" onClick={(event) => handleFooterLink(event, "terms")}>이용약관</a>
        <a href="/privacy" onClick={(event) => handleFooterLink(event, "privacy")}>개인정보처리방침</a>
        <a href="/disclaimer" onClick={(event) => handleFooterLink(event, "investment-disclaimer")}>투자 유의사항</a>
      </nav>
    </footer>
  );
}

export default App;
