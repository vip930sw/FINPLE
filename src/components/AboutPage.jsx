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

function AboutSection({ eyebrow, title, children }) {
  return (
    <section className="accountCard legalDocumentCard aboutSectionCard">
      <article className="legalDocumentSection">
        <p className="accountMiniLabel">{eyebrow}</p>
        <h2>{title}</h2>
        {children}
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
        <h1>FINPLE은 포트폴리오에서 시작해 재테크와 재무관리로 확장되는 분석 도구입니다.</h1>
        <p>
          FINPLE Portfolio Lab은 현재 미국주식과 ETF 중심의 포트폴리오 분석을 먼저 제공합니다.
          앞으로는 자산배분, 현금흐름, 재무 목표 점검까지 연결되는 개인 재무 관리 도구로 확장할 예정입니다.
        </p>
      </section>

      <AboutSection eyebrow="What" title="FINPLE은 무엇인가요?">
        <p>
          FINPLE은 사용자가 직접 입력한 포트폴리오 구성과 투자 조건을 바탕으로 장기 성과와 위험을 점검하는 웹 기반 분석 서비스입니다.
          특정 종목을 추천하기보다는 사용자가 자신의 자산 구조를 이해하고, 여러 시나리오를 비교할 수 있도록 돕는 데 초점을 둡니다.
        </p>
        <p>
          현재는 포트폴리오 시뮬레이터, 투자 MBTI, 자산 스크리너를 중심으로 구성되어 있으며,
          사용자는 성향 확인, 후보 탐색, 장기 시뮬레이션을 하나의 흐름 안에서 사용할 수 있습니다.
        </p>
      </AboutSection>

      <AboutSection eyebrow="Why" title="왜 만들었나요?">
        <p>
          많은 투자자는 증권사 앱에서 현재 평가금액은 쉽게 확인하지만, 내가 가진 자산이 장기적으로 어떤 구조인지,
          하락 위험은 어느 정도인지, 배당과 실질가치까지 고려하면 어떤 결과가 나오는지는 한눈에 보기 어렵습니다.
        </p>
        <p>
          FINPLE은 투자자가 종목 단위가 아니라 포트폴리오 단위로 생각할 수 있도록 돕기 위해 만들어졌습니다.
          단기 수익률보다 장기 구조, 위험, 배당, 물가 영향을 함께 보는 것이 목표입니다.
        </p>
      </AboutSection>

      <AboutSection eyebrow="Difference" title="증권사 앱·엑셀과 무엇이 다른가요?">
        <ul>
          <li>증권사 앱처럼 현재 잔고만 보여주는 것이 아니라 장기 시뮬레이션 흐름을 제공합니다.</li>
          <li>엑셀처럼 직접 수식을 만들지 않아도 포트폴리오 비중과 주요 가정값을 빠르게 조정할 수 있습니다.</li>
          <li>투자 MBTI, 자산 스크리너, 시뮬레이터를 연결해 초보자도 분석 흐름에 진입하기 쉽게 설계했습니다.</li>
          <li>앞으로는 포트폴리오 분석을 넘어 재테크와 재무 목표 관리까지 확장할 수 있는 구조를 지향합니다.</li>
        </ul>
      </AboutSection>

      <AboutSection eyebrow="Flow" title="FINPLE의 3단계 흐름">
        <ul>
          <li><strong>투자 MBTI</strong> — 투자 성향과 운용 방식을 간단히 확인합니다.</li>
          <li><strong>자산 스크리너</strong> — ETF와 주요 자산 후보를 목적과 위험도 기준으로 탐색합니다.</li>
          <li><strong>포트폴리오 시뮬레이터</strong> — 입력한 자산 구성을 바탕으로 장기 성과와 위험을 비교합니다.</li>
        </ul>
      </AboutSection>

      <AboutSection eyebrow="Beta" title="현재 베타 범위">
        <p>
          현재 베타 버전은 미국주식과 ETF 중심의 포트폴리오 분석에 초점을 둡니다.
          일부 데이터와 기능은 테스트 단계이며, 분석 결과는 투자 판단을 돕는 참고 자료입니다.
        </p>
        <p>
          결제, 구독, 한국주식·한국 ETF 데이터, 고급 위험지표, 재무 목표 관리 기능은 단계적으로 검토하고 있습니다.
        </p>
      </AboutSection>

      <AboutSection eyebrow="Roadmap" title="향후 개발 방향">
        <ul>
          <li>미국주식·ETF 중심 분석 안정화</li>
          <li>한국주식·한국 ETF 데이터 조회 가능성 검토</li>
          <li>계정 기반 저장과 구독 권한 체계 정리</li>
          <li>재테크·재무 목표 관리 기능 확장</li>
          <li>정식 오픈 전 고급 위험지표와 리포트 기능 검토</li>
        </ul>
      </AboutSection>

      <AboutSection eyebrow="Notice" title="투자 유의사항">
        <p>
          FINPLE은 투자 판단을 돕는 분석 도구이며, 특정 금융상품의 매수·매도 추천이나 투자 자문을 제공하지 않습니다.
          과거 데이터와 예상값은 미래 수익을 보장하지 않으며, 최종 투자 판단과 결과에 대한 책임은 이용자 본인에게 있습니다.
        </p>
      </AboutSection>
    </main>
  );
}
