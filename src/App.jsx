import { useEffect, useState } from "react";
import "./App.css";

import TradingViewTicker from "./components/TradingViewTicker";
import EconomicCalendarSection from "./components/EconomicCalendarSection";
import DemoCalculator from "./components/DemoCalculator";
import PersonalPage from "./components/PersonalPage";
import { getStoredFinpleAuthUser } from "./components/portfolio/services/serverPortfolioService";
import { logoutFinpleAuth } from "./components/authClientService";
import { LoginPage, SignupPage } from "./components/AuthPages";
import { BillingResultPage } from "./components/BillingResultPages";
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
  personal: "/simulator",
  login: "/login",
  signup: "/signup",
  mypage: "/mypage",
  pricing: "/pricing",
  support: "/support",
  "admin-login": "/admin",
  privacy: "/privacy",
  terms: "/terms",
  "investment-disclaimer": "/disclaimer",
  "billing-success": "/billing/success",
  "billing-fail": "/billing/fail",
  "billing-cancel": "/billing/cancel",
};

function normalizePathname(pathname) {
  return String(pathname || "/").replace(/\/+$/, "") || "/";
}

function getPathForPage(page) {
  return ROUTE_PATHS[page] || "/";
}

function getPageForPath(pathname, hash = "") {
  const normalizedPath = normalizePathname(pathname);
  const normalizedHash = String(hash || "").replace("#", "");

  if (normalizedPath === "/simulator" || normalizedHash === "simulator") return "personal";
  if (normalizedPath === "/login" || normalizedHash === "login") return "login";
  if (normalizedPath === "/signup" || normalizedHash === "signup") return "signup";
  if (normalizedPath === "/mypage" || normalizedHash === "mypage") return "mypage";
  if (normalizedPath === "/pricing" || normalizedHash === "pricing") return "pricing";
  if (normalizedPath === "/support" || normalizedHash === "support") return "support";
  if (normalizedPath === "/admin" || normalizedHash === "admin") return "admin-login";
  if (normalizedPath === "/privacy" || normalizedHash === "privacy") return "privacy";
  if (normalizedPath === "/terms" || normalizedHash === "terms") return "terms";
  if (normalizedPath === "/disclaimer" || normalizedHash === "disclaimer") return "investment-disclaimer";
  if (normalizedPath === "/billing/success" || normalizedHash === "billing-success") return "billing-success";
  if (normalizedPath === "/billing/fail" || normalizedHash === "billing-fail") return "billing-fail";
  if (normalizedPath === "/billing/cancel" || normalizedHash === "billing-cancel") return "billing-cancel";

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

  function goHome() {
    setCurrentPage("home");
  }

  function goPersonal() {
    setCurrentPage("personal");
  }

  function scrollHomeToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function isFinpleUserLoggedIn() {
    return Boolean(getStoredFinpleAuthUser()?.id);
  }

  function goMyPageOrLogin() {
    setCurrentPage(isFinpleUserLoggedIn() ? "mypage" : "login");
  }

  async function handleHeaderLoginLogout() {
    if (isFinpleUserLoggedIn()) {
      await logoutFinpleAuth();
      setCurrentPage("home");
      return;
    }

    setCurrentPage("login");
  }

  function scrollHomeToSection(sectionId) {
    if (currentPage !== "home") {
      setCurrentPage("home");
    }

    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  if (currentPage === "personal") {
    return <PersonalPage onBack={goHome} />;
  }

  if (currentPage === "admin-login") {
    return <AdminLoginPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "login") {
    return <LoginPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "signup") {
    return <SignupPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "mypage") {
    return <MyPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "pricing") {
    return <PricingPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "billing-success") {
    return <BillingResultPage type="success" onNavigate={setCurrentPage} />;
  }

  if (currentPage === "billing-fail") {
    return <BillingResultPage type="fail" onNavigate={setCurrentPage} />;
  }

  if (currentPage === "billing-cancel") {
    return <BillingResultPage type="cancel" onNavigate={setCurrentPage} />;
  }

  if (currentPage === "support") {
    return <SupportPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "privacy") {
    return (
      <>
        <PrivacyPage onNavigate={setCurrentPage} />
        <LegalPolicyFooter onNavigate={setCurrentPage} />
      </>
    );
  }

  if (currentPage === "terms") {
    return (
      <>
        <TermsPage onNavigate={setCurrentPage} />
        <LegalPolicyFooter onNavigate={setCurrentPage} />
      </>
    );
  }

  if (currentPage === "investment-disclaimer") {
    return (
      <>
        <InvestmentDisclaimerPage onNavigate={setCurrentPage} />
        <LegalPolicyFooter onNavigate={setCurrentPage} />
      </>
    );
  }

  return (
    <main className="page">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={goHome}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>

          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Portfolio Lab</span>
          </div>
        </button>

        <nav>
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("index")}>인덱스</button>
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("intro")}>소개</button>
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("pricing")}>요금제</button>
        </nav>

        <div className="headerActions">
          <button className="secondaryHeaderButton supportHeaderButton" onClick={() => setCurrentPage("support")}>문의사항</button>
          <button className="secondaryHeaderButton" onClick={goMyPageOrLogin}>MY PAGE</button>
          <button className="secondaryHeaderButton" onClick={handleHeaderLoginLogout}>
            {isFinpleUserLoggedIn() ? "로그아웃" : "로그인"}
          </button>
          <button className="headerButton" onClick={goPersonal}>분석 시작</button>
        </div>
      </header>

      <div className="tickerArea">
        <TradingViewTicker symbols={[...stockIndexSymbols, ...currencyCryptoSymbols]} />
      </div>

      <section className="hero">
        <div className="heroText">
          <p className="badge">투자 포트폴리오 분석 웹앱</p>
          <div className="betaNoticeBanner" role="note">
            <strong>Beta</strong>
            <span>FINPLE은 현재 베타 운영 중입니다. 일부 기능과 데이터는 테스트 단계이며, 투자 판단 전 공식 자료를 함께 확인해 주세요.</span>
          </div>
          <h1>
            내 포트폴리오의
            <br />
            수익과 위험을
            <br />
            한눈에 분석하세요
          </h1>
          <p className="description">
            투자 MBTI로 성향을 확인하고, 자산 스크리너로 후보를 탐색한 뒤,
            포트폴리오 시뮬레이터에서 장기 수익·위험·배당·실질가치를 함께 점검합니다.
          </p>
          <div className="heroButtons">
            <button className="primaryButton" onClick={goPersonal}>무료로 시작하기</button>
            <a className="secondaryButton" href="#features">흐름 살펴보기</a>
          </div>
        </div>

        <div className="dashboardCard">
          <div className="cardHeader">
            <div>
              <p>예상 포트폴리오</p>
              <h2>중립 성장형</h2>
            </div>
            <span className="status">안정적</span>
          </div>

          <div className="metrics">
            <Metric label="예상 연수익률" value="7.8%" />
            <Metric label="예상 변동성" value="14.2%" />
            <Metric label="예상 MDD" value="-28.5%" />
            <Metric label="리밸런싱" value="필요" />
          </div>

          <div className="bars">
            <Bar label="성장주" value={55} />
            <Bar label="가치주" value={25} />
            <Bar label="채권" value={15} />
            <Bar label="금" value={5} />
          </div>
        </div>
      </section>

      <div id="index" className="homeAnchor">
        <EconomicCalendarSection />
      </div>

      <section id="intro" className="section white whySection">
        <p className="sectionLabel">Why</p>
        <div className="sectionTopRow whyTopRow">
          <h2>수익률보다 먼저, 오래 버틸 수 있는 구조가 필요합니다.</h2>
          <p className="sectionSideText">
            FINPLE은 “무엇을 살까”보다 먼저 “내 포트폴리오가 어느 정도의 하락과 변동을 감당할 수 있는가”를 확인하도록 돕습니다.
          </p>
        </div>

        <div className="whyNarrativeGrid">
          <article className="whyLeadCard">
            <span>WHY WE BUILT THIS</span>
            <h3>높은 기대수익률만으로는 좋은 포트폴리오를 판단하기 어렵습니다.</h3>
            <p>
              장기 투자는 CAGR 하나를 고르는 문제가 아닙니다.
              같은 수익률이라도 최대낙폭, 변동성, 배당, 물가상승률, 추가 투자금에 따라 실제 체감 결과는 크게 달라질 수 있습니다.
            </p>
            <p>
              FINPLE은 성향 확인, 자산 후보 탐색, 시뮬레이션을 하나의 흐름으로 연결해 사용자가 스스로 감당 가능한 투자 구조를 점검할 수 있도록 설계되었습니다.
            </p>
          </article>

          <div className="whyVisualPanel" aria-label="장기 포트폴리오 이미지">
            <div className="marketCycleVisual">
              <span className="cycleDot growth">성장</span>
              <span className="cycleDot defense">방어</span>
              <span className="cycleDot income">배당</span>
              <span className="cycleDot real">실질가치</span>
              <div className="cycleOrbit one" />
              <div className="cycleOrbit two" />
              <div className="cycleCenter">Long-term<br />Portfolio</div>
            </div>
            <p>경기 흐름이 바뀌어도 한쪽 자산에만 의존하지 않는 구조를 시각적으로 점검합니다.</p>
          </div>
        </div>

        <div className="whyEvidenceGrid">
          <article className="sourceCard">
            <strong>분산과 자산배분</strong>
            <p>자산군을 나누고 정기적으로 리밸런싱하는 것은 투자 위험을 관리하는 핵심 도구입니다.</p>
            <a href="https://www.finra.org/investors/investing/investing-basics/asset-allocation-diversification" target="_blank" rel="noreferrer">출처: FINRA Investor Education</a>