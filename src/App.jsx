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
          </article>
          <article className="sourceCard">
            <strong>장기 계획과 리밸런싱</strong>
            <p>시장 움직임으로 비중이 흐트러질 수 있으므로, 목표 자산배분을 유지하는 점검 과정이 필요합니다.</p>
            <a href="https://investor.vanguard.com/investor-resources-education/portfolio-management/diversifying-your-portfolio" target="_blank" rel="noreferrer">출처: Vanguard</a>
          </article>
          <article className="sourceCard">
            <strong>마켓 타이밍보다 계획</strong>
            <p>완벽한 매수 시점을 기다리기보다 계획을 세우고 시장에 머무르는 접근이 장기 투자에서 중요합니다.</p>
            <a href="https://www.schwab.com/learn/story/does-market-timing-work" target="_blank" rel="noreferrer">출처: Schwab Center for Financial Research</a>
          </article>
          <article className="sourceCard">
            <strong>목표 기간과 위험감내도</strong>
            <p>투자기간과 위험감내도에 따라 적절한 자산배분은 달라집니다. FINPLE은 이 가정을 직접 조정해보는 도구입니다.</p>
            <a href="https://www.investor.gov/introduction-investing/getting-started/asset-allocation" target="_blank" rel="noreferrer">출처: Investor.gov</a>
          </article>
        </div>
      </section>

      <section id="features" className="section howSection">
        <p className="sectionLabel">How</p>
        <h2>투자 성향 확인에서 시뮬레이션까지, 시작 흐름을 나눴습니다.</h2>
        <p>
          처음부터 많은 지표를 입력하지 않아도 됩니다. 투자 MBTI로 방향을 잡거나, 스크리너에서 후보 자산을 고른 뒤,
          시뮬레이터에서 수익률·위험·배당·물가상승률을 단계적으로 조정할 수 있습니다.
        </p>

        <div className="howDifferentiatorGrid">
          <Feature title="투자 MBTI로 시작" text="12문항 성향 진단으로 안정/성장, 장기/기회, 자동/주도, 분산/확신 축을 확인합니다." />
          <Feature title="스크리너로 후보 탐색" text="ETF와 주요 자산 후보를 목적, 위험도, 유형별로 분리해 탐색합니다." />
          <Feature title="직접 입력 시뮬레이션" text="이미 보유한 포트폴리오는 수량, 현재가, CAGR, BETA, MDD, 배당률을 직접 입력해 분석합니다." />
          <Feature title="실질가치까지 확인" text="명목 평가금액과 물가상승률 반영 실질가치를 함께 확인합니다." />
          <Feature title="위험을 먼저 보는 구조" text="최대낙폭과 변동성 지표로 하락장 대응력을 함께 점검합니다." />
          <Feature title="리포트형 결과물" text="차트, 표, 요약 문구, PDF 저장으로 분석 결과를 다시 읽을 수 있습니다." />
        </div>
      </section>

      <section id="how" className="section white whatSection">
        <p className="sectionLabel">What</p>
        <h2>FINPLE은 세 가지 출발점과 하나의 분석 결과를 제공합니다.</h2>
        <p>
          잘 모르겠다면 투자 MBTI로 시작하고, 후보 자산이 필요하면 스크리너를 사용하고,
          이미 보유한 자산이 있다면 바로 시뮬레이터에 입력할 수 있습니다.
        </p>

        <div className="whatPreviewGrid">
          <article className="whatPreviewCard visualPreviewCard">
            <span>Simulator</span>
            <h3>내 자산을 기준으로 직접 입력</h3>
            <div className="whatIllustration portfolioInputIllustration" aria-hidden="true">
              <div className="illustrationHeader"><i /><i /><i /></div>
              <div className="inputSceneRow wide" />
              <div className="inputSceneRow" />
              <div className="inputSceneRow short" />
              <div className="allocationChips"><b>성장</b><b>배당</b><b>채권</b><b>금</b></div>
            </div>
            <p>보유 자산과 월 투자금, 투자기간, 기대지표를 입력해 포트폴리오의 출발점을 만듭니다.</p>
          </article>

          <article className="whatPreviewCard visualPreviewCard">
            <span>Investment MBTI</span>
            <h3>성향 기반 예시 프리셋</h3>
            <div className="whatIllustration growthFlowIllustration" aria-hidden="true">
              <div className="growthGridLine one" />
              <div className="growthGridLine two" />
              <div className="growthArea" />
              <svg viewBox="0 0 240 120" preserveAspectRatio="none"><path d="M4 104 C38 94, 56 83, 82 75 C118 64, 126 51, 160 42 C190 34, 204 21, 236 12" /></svg>
              <div className="growthBars"><b style={{ height: "30%" }} /><b style={{ height: "44%" }} /><b style={{ height: "58%" }} /><b style={{ height: "76%" }} /></div>
            </div>
            <p>성향 결과를 바탕으로 예시 포트폴리오를 만들고, 시뮬레이터에서 가정값을 직접 조정합니다.</p>
          </article>

          <article className="whatPreviewCard visualPreviewCard">
            <span>Screener & Report</span>
            <h3>후보 탐색과 결과 리포트</h3>
            <div className="whatIllustration decisionReportIllustration" aria-hidden="true">
              <div className="reportSheet"><strong /><em /><em /><em className="short" /></div>
              <div className="decisionBadge">Check</div>
              <div className="riskMeter"><i /><i /><i /></div>
            </div>
            <p>자산 후보를 담고, 분석 결과를 차트와 리포트 형태로 다시 확인할 수 있습니다.</p>
          </article>
        </div>

        <div className="stepGrid whatStepGrid">
          <Step number="01" title="시작점 선택" text="투자 MBTI, 시뮬레이터, 스크리너 중 목적에 맞는 시작 방식을 선택합니다." />
          <Step number="02" title="조건 입력" text="보유 자산, 투자금, 기간, 기대수익률, 위험지표, 배당률을 조정합니다." />
          <Step number="03" title="결과 확인" text="장기 성과, 실질가치, 배당금, 위험지표를 차트와 리포트로 확인합니다." />
        </div>

        <article className="investmentMbtiTeaser" aria-label="투자 성향 테스트 베타">
          <div>
            <p className="sectionLabel">Live Beta</p>
            <h3>투자 MBTI 베타 공개</h3>
            <span>12문항으로 나의 투자 성향을 확인하고, 예시 포트폴리오 프리셋을 시뮬레이터에서 바로 점검할 수 있습니다.</span>
          </div>
          <button type="button" onClick={goPersonal}>시작 메뉴 열기</button>
        </article>
      </section>

      <DemoCalculator />

      <section id="pricing" className="section">
        <p className="sectionLabel">Pricing</p>
        <h2>처음에는 가볍게, 필요할 때 더 깊게 분석하세요.</h2>

        <div className="priceGrid">
          <Price title="Free" price="0원" items={["브라우저 자동 저장", "기본 시뮬레이션", "제한된 자산 조회", "요약 리포트 확인"]} onSelect={() => setCurrentPage("signup")} />
          <Price title="Personal" price="월 9,900원" featured items={["서버 포트폴리오 저장", "여러 포트폴리오 관리", "API 조회량 확대", "PDF 리포트 저장", "문의 지원"]} onSelect={() => setCurrentPage("pricing")} />
          <Price title="Pro" price="준비 중" items={["고급 백테스트", "리밸런싱 분석", "고급 위험 지표", "장기 성과 비교", "업무용 확장 기능"]} onSelect={() => setCurrentPage("support")} />
        </div>
      </section>

      <footer className="footer">
        <div className="footerLegalLinks" aria-label="서비스 정책 문서">
          <button type="button" onClick={() => setCurrentPage("privacy")}>개인정보처리방침</button>
          <button type="button" onClick={() => setCurrentPage("terms")}>이용약관</button>
          <button type="button" onClick={() => setCurrentPage("investment-disclaimer")}>투자 유의사항</button>
          <button type="button" onClick={() => setCurrentPage("support")}>문의사항</button>
        </div>
        <p>© 2026 Portfolio Lab. All rights reserved.</p>
        <p className="footerDisclaimerText">
          FINPLE은 투자 판단을 돕는 참고용 분석 도구이며, 특정 금융상품의 매수·매도 추천, 투자자문, 투자일임 또는 수익 보장을 제공하지 않습니다.
        </p>
      </footer>

      <button type="button" className="floatingTopButton homeTopButton" onClick={scrollHomeToTop} aria-label="메인 페이지 상단으로 이동">↑ TOP</button>
    </main>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><p>{label}</p><strong>{value}</strong></div>;
}

function Bar({ label, value }) {
  return <div className="barItem"><div className="barLabel"><span>{label}</span><span>{value}%</span></div><div className="barTrack"><div className="barFill" style={{ width: `${value}%` }} /></div></div>;
}

function Feature({ title, text }) {
  return <div className="featureCard"><h3>{title}</h3><p>{text}</p></div>;
}

function Step({ number, title, text }) {
  return <div className="stepCard"><strong>{number}</strong><h3>{title}</h3><p>{text}</p></div>;
}

function Price({ title, price, items, featured, onSelect }) {
  return <div className={featured ? "priceCard featured" : "priceCard"}><h3>{title}</h3><strong>{price}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><button type="button" onClick={onSelect}>선택하기</button></div>;
}

function LegalPolicyFooter({ onNavigate }) {
  return (
    <footer className="legalPolicyTextFooter" aria-label="정책 문서 바로가기">
      <button type="button" onClick={() => onNavigate("privacy")}>개인정보처리방침</button>
      <button type="button" onClick={() => onNavigate("terms")}>이용약관</button>
      <button type="button" onClick={() => onNavigate("investment-disclaimer")}>투자 유의사항</button>
      <button type="button" onClick={() => onNavigate("home")}>홈으로 이동</button>
    </footer>
  );
}

export default App;
