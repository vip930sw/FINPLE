import { useEffect, useState } from "react";
import "./App.css";

import TradingViewTicker from "./components/TradingViewTicker";
import EconomicCalendarSection from "./components/EconomicCalendarSection";
import DemoCalculator from "./components/DemoCalculator";
import PersonalPage from "./components/PersonalPage";
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
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("problem")}>Problem</button>
          <button type="button" className="navTextButton" onClick={() => scrollHomeToSection("pricing")}>요금제</button>
          <button type="button" className="navTextButton" onClick={() => setCurrentPage("support")}>문의사항</button>
        </nav>

        <div className="headerActions">
          <button className="secondaryHeaderButton" onClick={() => setCurrentPage("login")}>로그인</button>
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

      <section id="problem" className="section white goldenSection whySection">
        <p className="sectionLabel">Why</p>
        <div className="sectionTopRow">
          <h2>왜 포트폴리오는 수익률보다 지속 가능성이 먼저일까요?</h2>
          <p className="sectionSideText">
            투자는 높은 수익률 하나를 맞히는 일이 아니라, 하락장과 변동성 속에서도 계획을 유지할 수 있는 구조를 만드는 일입니다.
            FINPLE은 내 자산의 위험, 현금흐름, 실질가치를 함께 보며 오래 버틸 수 있는 투자 결정을 돕습니다.
          </p>
        </div>
      </section>

      <section id="features" className="section goldenSection">
        <p className="sectionLabel">How</p>
        <h2>어떻게 장기 투자 구조를 점검하나요?</h2>
        <p>
          FINPLE은 자산별 기대수익률만 보여주지 않습니다. 거시경제 환경, 자산배분, 최대낙폭, 배당, 물가 반영 실질가치를 함께 계산해
          포트폴리오가 실제로 견딜 수 있는 구조인지 확인합니다.
        </p>

        <div className="featureGrid">
          <Feature title="시장 환경을 함께 보기" text="금리, 물가, 고용, 환율 등 주요 지표를 함께 확인해 투자 판단의 배경을 점검합니다." />
          <Feature title="가정값을 직접 조정" text="월 투자금, 투자기간, CAGR, MDD, 배당률을 직접 조정해 여러 시나리오를 비교합니다." />
          <Feature title="하락 위험 먼저 확인" text="최대낙폭과 변동성을 기준으로 하락장에서 감당 가능한 포트폴리오인지 점검합니다." />
          <Feature title="자산배분 균형 점검" text="성장주, 가치주, 채권, 금 등 자산군 비중을 보며 편중된 구조를 조정합니다." />
          <Feature title="실질가치와 배당 확인" text="물가상승률을 반영한 실질 평가금액과 예상 배당금을 함께 확인합니다." />
          <Feature title="리포트로 판단 근거 정리" text="계산 결과를 차트와 리포트로 정리해 투자 구조를 반복적으로 검토합니다." />
        </div>
      </section>

      <section id="how" className="section white goldenSection">
        <p className="sectionLabel">What</p>
        <h2>무엇을 입력하고 무엇을 확인하나요?</h2>
        <p>
          자산을 찾고, 수량과 기대지표를 입력한 뒤, 장기 성과·위험·실질가치·배당 흐름을 확인합니다.
          결과는 포트폴리오 비교와 상세분석 리포트로 이어집니다.
        </p>

        <div className="stepGrid">
          <Step number="01" title="자산 후보 선택" text="스크리너에서 ETF·주식 후보를 찾고 포트폴리오에 추가합니다." />
          <Step number="02" title="조건 입력" text="보유 수량, 월 투자금, 투자기간, CAGR, MDD, 배당률을 입력합니다." />
          <Step number="03" title="결과 확인" text="예상 성과, 실질가치, 배당금, 위험 지표와 리포트를 확인합니다." />
        </div>
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
