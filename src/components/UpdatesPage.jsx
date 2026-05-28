const UPDATE_ITEMS = [
  {
    version: "Beta v0.3.0",
    date: "2026.05.29",
    category: "데이터 확장 / UX 보강",
    title: "검증 후보 5,641개 기반 데이터와 화면 흐름 보강",
    impact: "검증된 가격지표를 가진 5,641개 후보를 중심으로 후보 탐색과 포트폴리오 시뮬레이션의 데이터 신뢰도와 사용 흐름을 보강했습니다.",
    details: [
      "CAGR, BETA, MDD 가격지표가 확인된 5,641개 후보를 화면과 시뮬레이터 후보군에 반영했습니다.",
      "가격지표와 배당 데이터를 보강해 후보 카드와 시뮬레이터에서 확인할 수 있는 지표 범위를 넓혔습니다.",
      "API 조회 구조, 데이터 캐시, 기존값 유지 흐름을 점검해 가격·지표 동기화와 연동 안정성을 강화했습니다.",
      "시작 화면, 후보 탐색 화면, 포트폴리오 시뮬레이터 진입 흐름을 정리해 UX를 보강했습니다.",
    ],
  },
  {
    version: "Beta v0.2.0",
    date: "2026.05.23",
    category: "기능 안정화",
    title: "로그인·구독 운영 구조 점검",
    impact: "회원가입, MY PAGE, 구독 상태, 결제 운영 전 DB 구조를 정리했습니다.",
    details: [
      "이메일 로그인·회원가입 운영 테이블을 점검했습니다.",
      "사용자 권한과 요금제 entitlement 구조를 정리했습니다.",
      "Toss 심사 후 운영 검증에 필요한 결제 이벤트 저장 구조를 보강했습니다.",
    ],
  },
  {
    version: "Beta v0.1.1",
    date: "2026.05.19",
    category: "UX 개선",
    title: "베타 피드백 기반 화면 흐름 정리",
    impact: "시작 흐름, 투자 MBTI, 시뮬레이터 진입 동선을 정리했습니다.",
    details: [
      "시작 메뉴를 투자 MBTI, 포트폴리오 시뮬레이터, 후보 탐색 도구 중심으로 재배치했습니다.",
      "모바일 STEP 탭 줄바꿈과 카드 문구 가독성을 조정했습니다.",
      "문의사항과 MY PAGE 진입 흐름을 유지했습니다.",
    ],
  },
  {
    version: "Beta v0.1.0",
    date: "2026.05.10",
    category: "베타 공개",
    title: "FINPLE Portfolio Lab 1차 베타 공개",
    impact: "미국주식·ETF 중심 포트폴리오 분석 기능을 베타로 공개했습니다.",
    details: [
      "포트폴리오 시뮬레이터, 후보 탐색 도구, 투자 MBTI 흐름을 연결했습니다.",
      "CAGR, BETA, MDD, 배당률, 실질가치 중심의 장기 분석을 제공합니다.",
      "분석 결과는 투자 판단 참고자료이며, 특정 금융상품의 매수·매도 추천이나 수익 보장을 의미하지 않습니다.",
    ],
  },
];

const UPCOMING_ITEMS = [
  "가격·배당 데이터 정기 갱신 절차 정리",
  "Toss 심사 승인 후 운영 결제·Webhook 실수신 검증",
  "공지사항 관리자 작성 기능",
  "Sharpe, 표준편차, 상관계수 등 고급 위험지표 검토",
];

function UpdatesHeader({ onNavigate }) {
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

export default function UpdatesPage({ onNavigate }) {
  return (
    <main className="accountPage legalPage">
      <UpdatesHeader onNavigate={onNavigate} />

      <section className="accountHero">
        <p className="sectionLabel">Updates</p>
        <h1>공지사항 / 업데이트 내역</h1>
        <p>
          FINPLE의 주요 변경사항, 베타 패치, 예정 기능을 투명하게 공유합니다.
          현재 버전은 Beta v0.3.0 기준입니다.
        </p>
      </section>

      <section className="accountCard legalDocumentCard">
        {UPDATE_ITEMS.map((item) => (
          <article key={`${item.version}-${item.title}`} className="legalDocumentSection">
            <p className="accountMiniLabel">{item.category} · {item.date}</p>
            <h2>{item.version} — {item.title}</h2>
            <p>{item.impact}</p>
            <ul>
              {item.details.map((detail) => <li key={detail}>{detail}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section className="accountCard legalDocumentCard">
        <article className="legalDocumentSection">
          <p className="accountMiniLabel">Roadmap</p>
          <h2>예정 작업</h2>
          <p>아래 항목은 확정 기능이 아니라 베타 운영 중 검토 중인 개발 방향입니다.</p>
          <ul>
            {UPCOMING_ITEMS.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </article>
        <article className="legalDocumentSection">
          <h2>투자 유의사항</h2>
          <p>
            FINPLE의 시뮬레이션, 차트, 리포트, 위험 지표는 투자 판단을 돕는 참고 자료입니다.
            특정 종목, ETF, 금융상품의 매수·매도 추천이나 투자 자문이 아니며, 과거 데이터와 예상값은 미래 수익을 보장하지 않습니다.
          </p>
        </article>
      </section>
    </main>
  );
}
