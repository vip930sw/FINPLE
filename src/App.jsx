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
} from "./components/AccountPages";

const PAGE_STORAGE_KEY = "finple-current-page";

function getInitialPage() {
  if (typeof window === "undefined") return "home";

  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const hash = window.location.hash.replace("#", "");

  if (pathname === "/admin" || hash === "admin") {
    return "admin-login";
  }

  return localStorage.getItem(PAGE_STORAGE_KEY) || "home";
}

function App() {
  const [currentPage, setCurrentPage] = useState(getInitialPage);

  useEffect(() => {
    if (currentPage !== "admin-login") {
      localStorage.setItem(PAGE_STORAGE_KEY, currentPage);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

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
            <Bar label="미국 주식" value={55} />
            <Bar label="배당주" value={25} />
            <Bar label="채권" value={15} />
            <Bar label="현금" value={5} />
          </div>
        </div>
      </section>

      <section className="section white">
        <p className="sectionLabel">Problem</p>
        <div className="sectionTopRow">
          <h2>수익률만 보고 투자하면 포트폴리오의 위험을 놓치기 쉽습니다.</h2>
          <p className="sectionSideText">
            변동성·최대낙폭·분산 효과·현금 비중·리밸런싱 기준까지 함께 고려해야 합니다.
          </p>
        </div>
      </section>

      <div id="index" className="homeAnchor">
        <EconomicCalendarSection />
      </div>

      <DemoCalculator />

      <section id="features" className="section">
        <p className="sectionLabel">Features</p>
        <h2>포트폴리오를 숫자와 시각화로 분석합니다.</h2>

        <div className="featureGrid">
          <Feature title="거시경제 지표 확인" text="금리, 물가, 고용, 환율 등 주요 경제지표를 함께 확인하여 시장 환경을 입체적으로 파악합니다." />
          <Feature title="CAGR 기반 자산평가" text="자산별 연평균 성장률을 기준으로 기대수익률을 설정하고 포트폴리오의 예상 성과를 계산합니다." />
          <Feature title="MDD 중심 리스크 관리" text="최대낙폭을 기준으로 하락장에서 견딜 수 있는 포트폴리오인지 점검하고 위험 수준을 확인합니다." />
          <Feature title="자산배분과 리밸런싱" text="현재 비중과 목표 비중을 비교하여 어떤 자산을 늘리거나 줄여야 하는지 판단할 수 있습니다." />
          <Feature title="올웨더 포트폴리오 템플릿" text="주식, 채권, 금, 원자재, 현금 등 다양한 자산군을 활용한 분산 포트폴리오 구성을 지원합니다." />
          <Feature title="복잡하지 않은 분석 리포트" text="투자 경험이 많지 않아도 이해할 수 있도록 핵심 수치와 해석을 간단한 리포트 형태로 제공합니다." />
        </div>
      </section>

      <section id="how" className="section white">
        <p className="sectionLabel">How it works</p>
        <h2>입력하고, 분석하고, 조정합니다.</h2>

        <div className="stepGrid">
          <Step number="01" title="자산 찾기" text="스크리너에서 ETF·주식 후보를 검색하고 포트폴리오에 추가합니다." />
          <Step number="02" title="조건 입력" text="수량, 월 투자금, 투자기간, 기대지표를 입력합니다." />
          <Step number="03" title="리포트 확인" text="상세분석과 PDF 리포트로 포트폴리오의 성격과 위험을 점검합니다." />
        </div>
      </section>

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
