import { useEffect, useState } from "react";
import "./App.css";

import TradingViewTicker from "./components/TradingViewTicker";
import EconomicCalendarSection from "./components/EconomicCalendarSection";
import DemoCalculator from "./components/DemoCalculator";
import PersonalPage from "./components/PersonalPage";
import { getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";
import { logoutFinpleAuth } from "./components/authClientService";
import { LoginPage, SignupPage } from "./components/AuthPages";
import {
  AdminLoginPage,
  MyPage,
  PricingPage,
  SupportPage,
  PrivacyPage,
  TermsPage,
  InvestmentDisclaimerPage,
} from "./components/AccountPages";

const ROUTE_PATHS = {
  home: "/",
  personal: "/start",
  login: "/login",
  signup: "/signup",
  mypage: "/mypage",
  pricing: "/pricing",
  support: "/support",
  "admin-login": "/admin",
  privacy: "/privacy",
  terms: "/terms",
  "investment-disclaimer": "/disclaimer",
};

const PERSONAL_ROUTE_PATHS = ["/start", "/tools", "/mbti", "/simulator", "/screener"];

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
  if (normalizedPath === "/login" || normalizedHash === "login") return "login";
  if (normalizedPath === "/signup" || normalizedHash === "signup") return "signup";
  if (normalizedPath === "/mypage" || normalizedHash === "mypage") return "mypage";
  if (normalizedPath === "/pricing" || normalizedHash === "pricing") return "pricing";
  if (normalizedPath === "/support" || normalizedHash === "support") return "support";
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

  useEffect(() => {
    const nextPath = getPathForPage(currentPage);
    const currentPath = normalizePathname(window.location.pathname || "/");

    if (currentPage === "personal" && PERSONAL_ROUTE_PATHS.includes(currentPath)) {
      return;
    }

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
    function isEditableTarget(target) {
      if (!(target instanceof Element)) return false;

      return Boolean(
        target.closest(
          "input, textarea, select, button, a, [contenteditable='true'], .allowTextSelection"
        )
      );
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

  function goHome() { setCurrentPage("home"); }
  function goPersonal() { setCurrentPage("personal"); if (window.location.pathname !== "/start") window.history.pushState({ page: "personal" }, "", "/start"); }
  function isFinpleUserLoggedIn() { return Boolean(getStoredFinpleAuthUser()?.id); }
  function goMyPageOrLogin() { setCurrentPage(isFinpleUserLoggedIn() ? "mypage" : "login"); }

  async function handleHeaderLoginLogout() {
    if (isFinpleUserLoggedIn()) {
      await logoutFinpleAuth();
      setCurrentPage("home");
      return;
    }
    setCurrentPage("login");
  }

  function scrollHomeToSection(sectionId) {
    if (currentPage !== "home") setCurrentPage("home");
    window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  if (currentPage === "personal") return <PersonalPage onBack={goHome} />;
  if (currentPage === "admin-login") return <AdminLoginPage onNavigate={setCurrentPage} />;
  if (currentPage === "login") return <LoginPage onNavigate={setCurrentPage} />;
  if (currentPage === "signup") return <SignupPage onNavigate={setCurrentPage} />;
  if (currentPage === "mypage") return <MyPage onNavigate={setCurrentPage} />;
  if (currentPage === "pricing") return <PricingPage onNavigate={setCurrentPage} />;
  if (currentPage === "support") return <SupportPage onNavigate={setCurrentPage} />;

  if (currentPage === "privacy") return <><PrivacyPage onNavigate={setCurrentPage} /><LegalPolicyFooter onNavigate={setCurrentPage} /></>;
  if (currentPage === "terms") return <><TermsPage onNavigate={setCurrentPage} /><LegalPolicyFooter onNavigate={setCurrentPage} /></>;
  if (currentPage === "investment-disclaimer") return <><InvestmentDisclaimerPage onNavigate={setCurrentPage} /><LegalPolicyFooter onNavigate={setCurrentPage} /></>;

  return (
    <main className="page">
      <header className="header homeHeader">
        <button type="button" className="brandLogo resetButton" onClick={goHome}>
          <div className="brandIcon"><span>F</span><i /></div>
          <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
        </button>

        <nav className="homeSectionNav">
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("index")}>인덱스</button>
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("intro")}>소개</button>
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("pricing")}>요금제</button>
        </nav>

        <div className="headerActions">
          <button className="secondaryHeaderButton supportHeaderButton" onClick={() => setCurrentPage("support")}>문의사항</button>
          <button className="secondaryHeaderButton" onClick={goMyPageOrLogin}>MY PAGE</button>
          <button className="secondaryHeaderButton" onClick={handleHeaderLoginLogout}>{isFinpleUserLoggedIn() ? "로그아웃" : "로그인"}</button>
          <button className="headerButton" onClick={goPersonal}>분석 시작</button>
        </div>
      </header>

      <div className="tickerArea"><TradingViewTicker symbols={[...stockIndexSymbols, ...currencyCryptoSymbols]} /></div>

      <section className="hero">
        <div className="heroText">
          <p className="badge">투자 포트폴리오 분석 웹앱</p>
          <div className="betaNoticeBanner" role="note"><strong>Beta</strong><span>FINPLE은 현재 베타 운영 중입니다. 일부 기능과 데이터는 테스트 단계이며, 투자 판단 전 공식 자료를 함께 확인해 주세요.</span></div>
          <h1>내 포트폴리오의<br />수익과 위험을<br />한눈에 분석하세요</h1>
          <p className="description">투자 MBTI로 성향을 확인하고, 자산 스크리너로 후보를 탐색한 뒤, 포트폴리오 시뮬레이터에서 장기 수익·위험·배당·실질가치를 함께 점검합니다.</p>
          <div className="heroButtons"><button className="primaryButton" onClick={goPersonal}>무료로 시작하기</button><a className="secondaryButton" href="#features">흐름 살펴보기</a></div>
        </div>

        <div className="dashboardCard">
          <div className="cardHeader"><div><p>예상 포트폴리오</p><h2>중립 성장형</h2></div><span className="status">안정적</span></div>
          <div className="metrics"><Metric label="예상 연수익률" value="7.8%" /><Metric label="예상 변동성" value="14.2%" /><Metric label="예상 MDD" value="-28.5%" /><Metric label="리밸런싱" value="필요" /></div>
          <div className="bars"><Bar label="성장주" value={55} /><Bar label="가치주" value={25} /><Bar label="채권" value={15} /><Bar label="금" value={5} /></div>
        </div>
      </section>

      <div id="index" className="homeAnchor"><EconomicCalendarSection /></div>

      <section id="intro" className="section white whySection">
        <div className="sectionTopRow"><p className="sectionLabel">Why FINPLE</p><h2>흩어진 포트폴리오를 하나의 기준으로 정리합니다</h2><p className="sectionSideText">성향 진단, 후보 탐색, 시뮬레이션, 상세 리포트를 한 흐름으로 연결합니다.</p></div>
        <div className="featureGrid" id="features">
          <FeatureCard title="투자 MBTI" text="투자자의 위험 성향과 운용 방식을 참고용으로 정리합니다." />
          <FeatureCard title="자산 스크리너" text="ETF와 주요 자산 후보를 목적과 위험도 기준으로 탐색합니다." />
          <FeatureCard title="포트폴리오 시뮬레이터" text="CAGR, MDD, 배당률을 반영해 장기 성과를 비교합니다." />
        </div>
      </section>

      <section id="pricing" className="section pricingPreviewSection">
        <p className="sectionLabel">Pricing</p><h2>처음에는 무료로 시작하고, 필요한 기능만 확장합니다</h2><p>베타 기간에는 핵심 기능을 가볍게 체험할 수 있도록 구성했습니다.</p>
        <div className="priceGrid"><PriceCard name="Free" price="0원" items={["기본 시뮬레이션", "브라우저 저장", "요약 리포트"]} /><PriceCard name="Personal" price="월 9,900원" featured items={["서버 저장", "PDF 리포트", "확장 조회"]} /><PriceCard name="Pro" price="준비 중" items={["고급 백테스트", "리밸런싱", "업무용 리포트"]} /></div>
      </section>

      <section className="section demoSection"><DemoCalculator /></section>
      <footer className="footer"><strong>FINPLE Portfolio Lab</strong><span>© 2026 FINPLE. Beta service.</span></footer>
    </main>
  );
}

function Metric({ label, value }) { return <div className="metric"><p>{label}</p><strong>{value}</strong></div>; }
function Bar({ label, value }) { return <div><div className="barLabel"><span>{label}</span><strong>{value}%</strong></div><div className="barTrack"><div className="barFill" style={{ width: `${value}%` }} /></div></div>; }
function FeatureCard({ title, text }) { return <article className="featureCard"><h3>{title}</h3><p>{text}</p></article>; }
function PriceCard({ name, price, items, featured }) { return <article className={featured ? "priceCard featured" : "priceCard"}><h3>{name}</h3><strong>{price}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><button type="button" className="primaryButton">확인</button></article>; }
function LegalPolicyFooter({ onNavigate }) { return <footer className="footer"><button type="button" onClick={() => onNavigate("terms")}>이용약관</button><button type="button" onClick={() => onNavigate("privacy")}>개인정보처리방침</button><button type="button" onClick={() => onNavigate("investment-disclaimer")}>투자 유의사항</button></footer>; }

export default App;