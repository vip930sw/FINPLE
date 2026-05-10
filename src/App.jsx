import { useEffect, useState } from "react";
import "./App.css";

import TradingViewTicker from "./components/TradingViewTicker";
import EconomicCalendarSection from "./components/EconomicCalendarSection";
import DemoCalculator from "./components/DemoCalculator";
import PersonalPage from "./components/PersonalPage";
import {
  clearStoredFinpleAuthUser,
  getStoredFinpleAuthUser,
} from "./components/portfolio/services/serverPortfolioService";
import {
  LoginPage,
  AdminLoginPage,
  SignupPage,
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

  function handleHeaderLoginLogout() {
    if (isFinpleUserLoggedIn()) {
      clearStoredFinpleAuthUser();
      window.dispatchEvent(new Event("finple-local-storage-updated"));
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
    return <PrivacyPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "terms") {
    return <TermsPage onNavigate={setCurrentPage} />;
  }

  if (currentPage === "investment-disclaimer") {
    return <InvestmentDisclaimerPage onNavigate={setCurrentPage} />;
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
          <button className="headerButton" onClick={goPersonal}>시작하기</button>
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
            자산 비중, 기대수익률, 변동성, 최대낙폭을 함께 확인하여
            장기 투자 구조를 점검할 수 있도록 돕습니다. 분석 결과는
            투자 판단을 돕기 위한 참고자료입니다.
          </p>
          <div className="heroButtons">
            <button className="primaryButton" onClick={goPersonal}>무료로 시작하기</button>
            <a className="secondaryButton" href="#features">기능 살펴보기</a>
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
          <h2>시장은 예측보다 오래 버티는 구조를 요구합니다.</h2>
          <p className="sectionSideText">
            FINPLE은 “무엇을 살까”보다 먼저 “내가 감당할 수 있는 구조인가”를 점검하도록 돕습니다.
          </p>
        </div>

        <div className="whyNarrativeGrid">
          <article className="whyLeadCard">
            <span>WHY WE BUILT THIS</span>
            <h3>수익률만 보는 투자는 오래가기 어렵습니다.</h3>
            <p>
              장기 투자는 단순히 높은 CAGR을 고르는 문제가 아닙니다.
              시장 하락을 견딜 수 있는지, 물가를 반영해도 실질가치가 남는지,
              배당과 추가 투자금이 시간이 지날수록 어떤 역할을 하는지 함께 봐야 합니다.
            </p>
            <p>
              FINPLE은 포트폴리오를 숫자 하나로 평가하지 않고, 성장·방어·현금흐름·실질가치의 균형을 함께 확인하는 것을 목표로 합니다.
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
            <p>경기 국면이 바뀌어도 한쪽 자산에만 의존하지 않는 구조를 시각적으로 점검합니다.</p>
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
        <h2>포트폴리오 시뮬레이터를 통해 성장과 위험에 대응합니다.</h2>
        <p>
          단순 수익률 계산기와 달리, 현재 보유 자산의 평가금액에서 출발해 추가 투자금,
          자산별 기대지표, 최대낙폭, 배당률, 물가상승률을 하나의 흐름으로 연결합니다.
        </p>

        <div className="howDifferentiatorGrid">
          <Feature title="가정값을 직접 조정" text="CAGR, BETA, MDD, 배당률을 직접 조정해 여러 시나리오를 비교합니다." />
          <Feature title="실질가치까지 확인" text="명목 평가금액과 물가상승률 반영 실질가치를 함께 확인합니다." />
          <Feature title="위험을 먼저 보는 구조" text="최대낙폭과 변동성 지표로 하락장 대응력을 함께 점검합니다." />
          <Feature title="서버 저장과 재확인" text="브라우저 저장과 서버 저장을 함께 활용해 분석을 다시 확인합니다." />
          <Feature title="경제지표와 함께 판단" text="금리, 물가, 고용, 환율 등 주요 경제지표와 함께 판단합니다." />
          <Feature title="리포트형 결과물" text="차트, 표, 요약 문구, PDF 저장으로 결과를 다시 읽을 수 있습니다." />
        </div>
      </section>

      <section id="how" className="section white whatSection">
        <p className="sectionLabel">What</p>
        <h2>FINPLE은 다양한 투자 의사결정과 대안을 제시합니다.</h2>
        <p>
          FINPLE의 결과물은 “몇 년 뒤 얼마”에 그치지 않습니다.
          투자금, 수익금, 배당금, 실질가치, 위험지표를 함께 보며
          내 포트폴리오가 어떤 성격인지 이해할 수 있게 돕습니다.
        </p>

        <div className="whatPreviewGrid">
          <article className="whatPreviewCard visualPreviewCard">
            <span>Simulator</span>
            <h3>내 자산을 기준으로 시작</h3>
            <div className="whatIllustration portfolioInputIllustration" aria-hidden="true">
              <div className="illustrationHeader">
                <i />
                <i />
                <i />
              </div>
              <div className="inputSceneRow wide" />
              <div className="inputSceneRow" />
              <div className="inputSceneRow short" />
              <div className="allocationChips">
                <b>성장</b>
                <b>배당</b>
                <b>채권</b>
                <b>금</b>
              </div>
            </div>
            <p>보유 자산과 월 투자금, 투자기간, 기대지표를 입력해 포트폴리오의 출발점을 만듭니다.</p>
          </article>

          <article className="whatPreviewCard visualPreviewCard">
            <span>Growth Chart</span>
            <h3>자산흐름을 시각화</h3>
            <div className="whatIllustration growthFlowIllustration" aria-hidden="true">
              <div className="growthGridLine one" />
              <div className="growthGridLine two" />
              <div className="growthArea" />
              <svg viewBox="0 0 240 120" preserveAspectRatio="none">
                <path d="M4 104 C38 94, 56 83, 82 75 C118 64, 126 51, 160 42 C190 34, 204 21, 236 12" />
              </svg>
              <div className="growthBars">
                <b style={{ height: "30%" }} />
                <b style={{ height: "44%" }} />
                <b style={{ height: "58%" }} />
                <b style={{ height: "76%" }} />
              </div>
            </div>
            <p>누적 납입금, 수익금, 배당금, 실질 평가금액을 한 화면에서 비교합니다.</p>
          </article>

          <article className="whatPreviewCard visualPreviewCard">
            <span>Report</span>
            <h3>결과를 다시 읽는 리포트</h3>
            <div className="whatIllustration decisionReportIllustration" aria-hidden="true">
              <div className="reportSheet">
                <strong />
                <em />
                <em />
                <em className="short" />
              </div>
              <div className="decisionBadge">Check</div>
              <div className="riskMeter">
                <i />
                <i />
                <i />
              </div>
            </div>
            <p>요약 해석과 PDF 저장 기능으로 투자 아이디어를 정리하고 다시 검토할 수 있습니다.</p>
          </article>
        </div>

        <div className="stepGrid whatStepGrid">
          <Step number="01" title="입력" text="보유 자산, 월 투자금, 투자기간, 기대지표를 입력합니다." />
          <Step number="02" title="분석" text="장기 성과, 실질가치, 배당금, 위험지표를 함께 계산합니다." />
          <Step number="03" title="결과물" text="차트와 리포트를 통해 내 포트폴리오의 성격을 확인합니다." />
        </div>

        <article className="investmentMbtiTeaser" aria-label="투자 성향 테스트 준비 중">
          <div>
            <p className="sectionLabel">Coming Soon</p>
            <h3>투자 MBTI 테스트</h3>
            <span>간단한 질문으로 나의 투자 성향을 파악하고, 시뮬레이터의 기본 가정값과 포트폴리오 유형을 추천하는 기능을 준비 중입니다.</span>
          </div>
          <button type="button" onClick={goPersonal}>시뮬레이터 먼저 사용하기</button>
        </article>
      </section>

      <DemoCalculator />

      <section id="pricing" className="section">
        <p className="sectionLabel">Pricing</p>
        <h2>처음에는 가볍게, 필요할 때 더 깊게 분석하세요.</h2>

        <div className="priceGrid">
          <Price
            title="Free"
            price="0원"
            items={["브라우저 자동 저장", "기본 시뮬레이션", "제한된 자산 조회", "요약 리포트 확인"]}
            onSelect={() => setCurrentPage("signup")}
          />
          <Price
            title="Personal"
            price="월 9,900원"
            featured
            items={["서버 포트폴리오 저장", "여러 포트폴리오 관리", "API 조회량 확대", "PDF 리포트 저장", "문의 지원"]}
            onSelect={() => setCurrentPage("pricing")}
          />
          <Price
            title="Pro"
            price="준비 중"
            items={["고급 백테스트", "리밸런싱 분석", "고급 위험 지표", "장기 성과 비교", "업무용 확장 기능"]}
            onSelect={() => setCurrentPage("support")}
          />
        </div>
      </section>

      <footer className="footer">
        <div className="footerLegalLinks" aria-label="서비스 정책 문서">
          <button type="button" onClick={() => setCurrentPage("privacy")}>개인정보처리방침</button>
          <button type="button" onClick={() => setCurrentPage("terms")}>이용약관</button>
          <button type="button" onClick={() => setCurrentPage("investment-disclaimer")}>투자 유의사항</button>
        </div>
        <p>© 2026 Portfolio Lab. All rights reserved.</p>
        <p>본 서비스는 투자 판단을 돕는 분석 도구이며, 특정 금융상품의 매수·매도 추천이나 수익을 보장하지 않습니다.</p>
      </footer>

      <button type="button" className="floatingTopButton homeTopButton" onClick={scrollHomeToTop} aria-label="메인 페이지 상단으로 이동">
        ↑ TOP
      </button>
    </main>
  );
}

function Metric({ label, value }) {
  return <div className="metric"><p>{label}</p><strong>{value}</strong></div>;
}

function Bar({ label, value }) {
  return (
    <div className="barItem">
      <div className="barLabel"><span>{label}</span><span>{value}%</span></div>
      <div className="barTrack"><div className="barFill" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function Feature({ title, text }) {
  return <div className="featureCard"><h3>{title}</h3><p>{text}</p></div>;
}

function Step({ number, title, text }) {
  return <div className="stepCard"><strong>{number}</strong><h3>{title}</h3><p>{text}</p></div>;
}

function Price({ title, price, items, featured, onSelect }) {
  return (
    <div className={featured ? "priceCard featured" : "priceCard"}>
      <h3>{title}</h3>
      <strong>{price}</strong>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
      <button type="button" onClick={onSelect}>선택하기</button>
    </div>
  );
}

export default App;
