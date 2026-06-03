import finpleLogo from "../assets/finple-logo.svg";
import "./AboutBrandVisuals.css";

const BRAND_COLORS = [
  { name: "FINPLE Navy", value: "#0F172A", role: "신뢰감과 핵심 텍스트" },
  { name: "FINPLE Blue", value: "#2563EB", role: "주요 버튼과 강조" },
  { name: "Logo Sky Blue", value: "#38BDF8", role: "로고 포인트 컬러" },
  { name: "Pastel Blue", value: "#E0F2FE", role: "부드러운 배경과 보조 면" },
  { name: "Slate Gray", value: "#64748B", role: "설명문과 보조 정보" },
  { name: "Soft Background", value: "#F8FAFC", role: "차분한 화면 배경" },
];

function AboutHeader({ onNavigate }) {
  return (
    <header className="accountHeader">
      <button type="button" className="brandLogo resetButton" onClick={() => onNavigate("home")}>
        <div className="brandIcon"><span>F</span><i /></div>
        <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
      </button>
      <nav className="accountNav standardTopNav">
        <button type="button" onClick={() => onNavigate("home")}>홈</button>
        <button type="button" onClick={() => onNavigate("personal")}>시작하기</button>
        <button type="button" onClick={() => onNavigate("support")}>문의사항</button>
        <button type="button" onClick={() => onNavigate("mypage")}>MY PAGE</button>
        <button type="button" className="accountNavAuthButton" onClick={() => onNavigate("login")}>로그인</button>
      </nav>
    </header>
  );
}

function AboutIllustration({ type }) {
  return (
    <div className={`aboutIllustration aboutIllustration-${type}`} aria-hidden="true">
      <span className="aboutIllustrationOrb primary" />
      <span className="aboutIllustrationOrb secondary" />
      <span className="aboutIllustrationCard main" />
      <span className="aboutIllustrationCard sub" />
      <span className="aboutIllustrationLine one" />
      <span className="aboutIllustrationLine two" />
      <span className="aboutIllustrationDot one" />
      <span className="aboutIllustrationDot two" />
      <span className="aboutIllustrationDot three" />
    </div>
  );
}

function AboutSection({ eyebrow, title, visual, children }) {
  return (
    <section className="accountCard legalDocumentCard aboutSectionCard">
      <article className={visual ? "legalDocumentSection aboutVisualSection" : "legalDocumentSection"}>
        <div className="aboutSectionText">
          <p className="accountMiniLabel aboutSectionEyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          {children}
        </div>
        {visual ? <AboutIllustration type={visual} /> : null}
      </article>
    </section>
  );
}

function BrandIdentitySection() {
  return (
    <section className="accountCard legalDocumentCard aboutBrandCard">
      <article className="legalDocumentSection">
        <div className="aboutBrandIntro">
          <div>
            <p className="accountMiniLabel aboutSectionEyebrow">Brand Identity</p>
            <h2>FINPLE의 브랜드 시스템</h2>
            <p>
              FINPLE은 복잡한 투자 정보를 사용자가 직접 이해하고 점검할 수 있도록 돕는 포트폴리오 분석 브랜드입니다.
              로고, 컬러, 화면 구성은 금융 서비스에 필요한 신뢰감과 데이터 분석 도구의 명확함을 함께 전달하는 방향으로 설계했습니다.
            </p>
          </div>
          <div className="aboutBrandLogoPanel" aria-label="FINPLE 브랜드 로고 예시">
            <img src={finpleLogo} alt="FINPLE Portfolio Lab" />
          </div>
        </div>

        <div className="aboutBrandMeaningGrid">
          <div>
            <strong>Financial Planner</strong>
            <p>스스로 재무와 투자를 계획하고, 자산 비중과 장기 성과를 점검하는 도구라는 출발점입니다.</p>
          </div>
          <div>
            <strong>Finance &amp; People</strong>
            <p>금융 지식이 실제 투자자와 생활 재무를 실천하는 사람들에게 연결되는 서비스를 지향합니다.</p>
          </div>
        </div>

        <div className="aboutColorPalette" aria-label="FINPLE 컬러 팔레트">
          {BRAND_COLORS.map((color) => (
            <div key={color.name} className="aboutColorSwatch">
              <span style={{ background: color.value }} />
              <strong>{color.name}</strong>
              <em>{color.value}</em>
              <p>{color.role}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default function AboutPage({ onNavigate }) {
  return (
    <main className="accountPage legalPage aboutPage">
      <AboutHeader onNavigate={onNavigate} />

      <section className="accountHero aboutHero">
        <p className="sectionLabel">About FINPLE</p>
        <h1>FINPLE은 Financial Planner에서 시작해 Finance & People로 확장되는 재무관리 도구입니다.</h1>
        <p>
          FINPLE은 처음에는 포트폴리오를 더 쉽게 점검하기 위한 Financial Planner의 관점에서 출발했습니다.
          앞으로는 투자, 재테크, 재무 목표를 함께 다루는 Finance & People, 즉 금융과 재무를 실천하는 사람들을 위한 서비스로 확장해 나가려 합니다.
        </p>
      </section>

      <BrandIdentitySection />

      <AboutSection eyebrow="What" title="FINPLE은 무엇인가요?" visual="dashboard">
        <p>
          FINPLE은 사용자가 직접 입력한 포트폴리오 구성과 투자 조건을 바탕으로 장기 성과와 위험을 점검하는 웹 기반 분석 서비스입니다.
          특정 종목을 추천하기보다는 사용자가 자신의 자산 구조를 이해하고, 여러 시나리오를 비교할 수 있도록 돕는 데 초점을 둡니다.
        </p>
        <p>
          현재는 포트폴리오 시뮬레이터, 투자 MBTI, 자산 스크리너를 중심으로 구성되어 있으며,
          사용자는 성향 확인, 후보 탐색, 장기 시뮬레이션을 하나의 흐름 안에서 사용할 수 있습니다.
        </p>
      </AboutSection>

      <AboutSection eyebrow="Why" title="왜 만들었나요?" visual="problem">
        <p>
          많은 투자자는 증권사 앱에서 현재 평가금액은 쉽게 확인하지만, 내가 가진 자산이 장기적으로 어떤 구조인지,
          하락 위험은 어느 정도인지, 배당과 실질가치까지 고려하면 어떤 결과가 나오는지는 한눈에 보기 어렵습니다.
        </p>
        <p>
          FINPLE은 투자자가 종목 단위가 아니라 포트폴리오 단위로 생각할 수 있도록 돕기 위해 만들어졌습니다.
          단기 수익률보다 장기 구조, 위험, 배당, 물가 영향을 함께 보는 것이 목표입니다.
        </p>
      </AboutSection>

      <AboutSection eyebrow="Difference" title="증권사 앱·엑셀과 무엇이 다른가요?" visual="compare">
        <ul>
          <li>증권사 앱처럼 현재 잔고만 보여주는 것이 아니라 장기 시뮬레이션 흐름을 제공합니다.</li>
          <li>엑셀처럼 직접 수식을 만들지 않아도 포트폴리오 비중과 주요 가정값을 빠르게 조정할 수 있습니다.</li>
          <li>투자 MBTI, 자산 스크리너, 시뮬레이터를 연결해 초보자도 분석 흐름에 진입하기 쉽게 설계했습니다.</li>
          <li>앞으로는 포트폴리오 분석을 넘어 재테크와 재무 목표 관리까지 확장할 수 있는 구조를 지향합니다.</li>
        </ul>
      </AboutSection>

      <AboutSection eyebrow="Flow" title="FINPLE의 3단계 흐름" visual="flow">
        <ul>
          <li><strong>투자 MBTI</strong> — 투자 성향과 운용 방식을 간단히 확인합니다.</li>
          <li><strong>자산 스크리너</strong> — ETF와 주요 자산 후보를 목적과 위험도 기준으로 탐색합니다.</li>
          <li><strong>포트폴리오 시뮬레이터</strong> — 입력한 자산 구성을 바탕으로 장기 성과와 위험을 비교합니다.</li>
        </ul>
      </AboutSection>

      <AboutSection eyebrow="Beta" title="현재 베타 범위" visual="scope">
        <p>
          현재 베타 버전은 미국주식과 ETF 중심의 포트폴리오 분석에 초점을 둡니다.
          일부 데이터와 기능은 테스트 단계이며, 분석 결과는 투자 판단을 돕는 참고 자료입니다.
        </p>
        <p>
          결제, 구독, 한국주식·한국 ETF 데이터, 고급 위험지표, 재무 목표 관리 기능은 단계적으로 검토하고 있습니다.
        </p>
      </AboutSection>

      <AboutSection eyebrow="Roadmap" title="향후 개발 방향" visual="roadmap">
        <ul>
          <li>미국주식·ETF 중심 분석 안정화</li>
          <li>한국주식·한국 ETF 데이터 조회 가능성 검토</li>
          <li>계정 기반 저장과 구독 권한 체계 정리</li>
          <li>재테크·재무 목표 관리 기능 확장</li>
          <li>정식 오픈 전 고급 위험지표와 리포트 기능 검토</li>
        </ul>
      </AboutSection>

      <AboutSection eyebrow="Notice" title="투자 유의사항" visual="notice">
        <p>
          FINPLE은 투자 판단을 돕는 분석 도구이며, 특정 금융상품의 매수·매도 추천이나 투자 자문을 제공하지 않습니다.
          과거 데이터와 예상값은 미래 수익을 보장하지 않으며, 최종 투자 판단과 결과에 대한 책임은 이용자 본인에게 있습니다.
        </p>
      </AboutSection>
    </main>
  );
}
