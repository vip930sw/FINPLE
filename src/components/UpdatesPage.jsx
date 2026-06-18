import FloatingTopButton from "./FloatingTopButton";

const UPDATE_ITEMS = [
  {
    version: "Beta v0.4.3",
    date: "2026.06.14",
    category: "교육 운영",
    title: "교육용 계정 운영과 계정 관리 개선",
    impact: "오프라인 수업/세미나 수강생에게 결제 없이 Personal 권한을 제공하고, 일반 회원 통계와 계정 관리를 더 명확하게 분리했습니다.",
    details: [
      "관리자 콘솔에서 교육용 계정을 일괄 생성하고 CSV로 전달 정보를 확인할 수 있도록 개선했습니다.",
      "교육 계정 표에서 활성/만료 상태를 구분하고 만료된 계정만 일괄 삭제할 수 있도록 개선했습니다.",
      "교육용 계정은 로그인 화면의 별도 탭에서 교육용 ID와 비밀번호로 접속할 수 있습니다.",
      "교육용 계정은 요금제와 MY PAGE에서 교육용 Personal로 표시되며 결제/구독 이력과 분리됩니다.",
      "회원 관리 화면의 회원 수, 구독률, 플랜 분포, 최근 회원 목록에서 교육용 계정을 제외했습니다.",
      "일반 이메일/비밀번호 로그인 계정은 MY PAGE에서 비밀번호를 변경할 수 있습니다.",
    ],
  },
  {
    version: "Beta v0.4.2",
    date: "2026.06.03",
    category: "UX 개선",
    title: "투자 MBTI 결과 화면 및 공유 경험 개선",
    impact: "투자 MBTI 결과를 더 쉽게 이해하고 저장·공유할 수 있도록 결과 화면과 공유 흐름을 개선했습니다.",
    details: [
      "투자 MBTI 결과 화면의 버튼 배치를 정리했습니다.",
      "결과 공유, PDF 저장, 다시 검사하기, 포트폴리오 반영 흐름을 더 명확하게 개선했습니다.",
      "FINPLE 로고가 포함된 결과 이미지 저장 기능을 보강했습니다.",
      "결과 화면에 성향 차트와 각 성향 항목 설명을 추가했습니다.",
    ],
  },
  {
    version: "Beta v0.4.1",
    date: "2026.06.01",
    category: "운영 안정화",
    title: "서비스 신뢰 정보 및 소셜 로그인 검수 환경 정비",
    impact: "외부 로그인 검수와 유료 서비스 운영에 필요한 기본 신뢰 정보를 화면에서 확인할 수 있도록 정리했습니다.",
    details: [
      "하단 푸터에 사업자 정보와 연락처를 표시했습니다.",
      "환불정책 페이지와 주요 정책 링크 접근성을 개선했습니다.",
      "네이버 로그인 검수에 필요한 로그인 흐름을 보강했습니다.",
      "MY PAGE에서 로그인 이메일, 가입 방식, 이메일 활용 목적을 확인할 수 있도록 개선했습니다.",
    ],
  },
  {
    version: "Beta v0.4.0",
    date: "2026.06.01",
    category: "구독 준비",
    title: "구독 신청 및 결제 확인 흐름 보강",
    impact: "FINPLE Personal 구독 신청 전후의 안내 화면을 정리해 결제 흐름을 더 명확하게 확인할 수 있도록 했습니다.",
    details: [
      "FINPLE Personal 구독 신청 흐름을 정리했습니다.",
      "결제 전 확인, 결제 성공, 결제 실패, 결제 취소 화면을 보강했습니다.",
      "상품명, 금액, 제공 기능, 환불정책 접근 흐름을 확인할 수 있도록 정리했습니다.",
    ],
  },
  {
    version: "Beta v0.3.6",
    date: "2026.05.31",
    category: "MBTI 개선",
    title: "투자 MBTI 포트폴리오 비중 체계 개선",
    impact: "투자 MBTI 16개 유형의 자산 비중과 미국형·한국형 포트폴리오 매핑을 더 명확하게 정리했습니다.",
    details: [
      "투자 MBTI 16개 유형별 포트폴리오 비중을 고유하게 재설계했습니다.",
      "미국형 포트폴리오는 종합채권, 장기국채, 블록체인 테마 등 자산 역할을 더 세분화했습니다.",
      "한국형 포트폴리오는 국내 대표지수, 국내 채권, 리츠, 금 등 국내시장형 자산 구성을 반영하도록 개선했습니다.",
    ],
  },
  {
    version: "Beta v0.3.5",
    date: "2026.05.31",
    category: "시뮬레이터 개선",
    title: "시뮬레이터 컨셉 포트폴리오 프리셋 추가",
    impact: "사용자가 직접 비중을 모두 입력하지 않아도 여러 투자 컨셉을 빠르게 비교할 수 있도록 프리셋을 추가했습니다.",
    details: [
      "금 방어형, 리츠 인컴형, 올웨더형 등 컨셉 포트폴리오 프리셋을 추가했습니다.",
      "프리셋을 선택하면 목표비중이 정수 기준으로 정리되어 바로 비교할 수 있도록 개선했습니다.",
      "프리셋 적용 후 현재가 조회와 평가금액 계산이 더 안정적으로 이어지도록 보완했습니다.",
    ],
  },
  {
    version: "Beta v0.3.4",
    date: "2026.05.27",
    category: "데이터 보강",
    title: "한국 ETF·개별주 배당 데이터 보강",
    impact: "국내 자산 후보의 배당률 표시 품질을 높이기 위해 한국 ETF와 개별주 배당 데이터를 추가 반영했습니다.",
    details: [
      "한국 ETF와 한국 개별주의 배당률 데이터를 추가 반영했습니다.",
      "배당률이 확인된 국내 자산의 표시 품질을 개선했습니다.",
      "기존 CAGR, BETA, MDD 등 주요 가격지표는 유지하면서 배당 데이터만 보강했습니다.",
    ],
  },
  {
    version: "Beta v0.3.3",
    date: "2026.05.26",
    category: "데이터 확장",
    title: "자산 후보 약 6,000개 확장",
    impact: "자산 파인더에서 확인할 수 있는 후보군을 약 6,000개 기준으로 확장하고, 기존 핵심 후보의 주요 지표가 유지되도록 보강했습니다.",
    details: [
      "자산 탐색 후보군을 약 6,000개 기준으로 확장했습니다.",
      "기존 핵심 후보의 CAGR, BETA, MDD, 배당률 등 검증 지표가 유지되도록 보강했습니다.",
      "후보군 확장 후에도 기존 주요 ETF와 한국 대표 ETF의 지표가 유지되도록 정리했습니다.",
    ],
  },
  {
    version: "Beta v0.3.2",
    date: "2026.05.25",
    category: "탐색 UX 개선",
    title: "자산 파인더 탐색 편의성 개선",
    impact: "후보 수가 늘어나도 자산 후보를 더 빠르고 안정적으로 탐색할 수 있도록 목록 표시 방식을 개선했습니다.",
    details: [
      "자산 후보 목록을 20개, 50개, 100개 단위로 나누어 볼 수 있도록 개선했습니다.",
      "후보 수가 늘어나도 화면이 과도하게 길어지지 않도록 페이지 이동 기능을 추가했습니다.",
      "검색어와 필터를 바꾸면 첫 페이지부터 다시 확인되도록 탐색 흐름을 정리했습니다.",
    ],
  },
  {
    version: "Beta v0.3.1",
    date: "2026.05.25",
    category: "계산 안정화",
    title: "시뮬레이터 목표비중 계산 안정화",
    impact: "현재가가 아직 조회되지 않은 자산도 목표비중과 시작 평가금액 기준으로 계산할 수 있도록 안정성을 개선했습니다.",
    details: [
      "현재가가 아직 조회되지 않은 자산도 목표비중과 시작 평가금액 기준으로 계산할 수 있도록 개선했습니다.",
      "현재가 조회 후에도 의도한 시작 평가금액과 목표비중이 흔들리지 않도록 보정했습니다.",
      "자산 입력표 하단에 합계 행을 추가해 포트폴리오 비중과 평가금액을 더 쉽게 확인할 수 있도록 했습니다.",
    ],
  },
  {
    version: "Beta v0.2.0",
    date: "2026.05.19",
    category: "계정 기능",
    title: "이메일 회원가입·로그인 기반 구축",
    impact: "체험형 이용 흐름을 유지하면서도 계정 기반 저장·구독 기능으로 확장할 수 있는 로그인 기반을 마련했습니다.",
    details: [
      "이메일과 비밀번호를 이용한 회원가입·로그인 흐름을 구축했습니다.",
      "로그인 후 MY PAGE로 이동하고, 로그아웃 시 세션 정보가 정리되도록 개선했습니다.",
      "체험 계정 시작 흐름은 유지하면서, 계정 기반 저장·구독 기능으로 확장할 수 있는 기반을 마련했습니다.",
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
  "Toss 심사 승인 후 운영 결제·웹훅 실수신 검증",
  "교육 계정 카드 PDF/인쇄 레이아웃",
  "수강생별 번호/링크 기반 교육 계정 디지털 지급",
  "공지사항 관리자 작성 기능",
  "표준편차, 상관계수 등 고급 위험지표 검토",
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
          현재 버전은 Beta v0.4.3 기준입니다.
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
      <FloatingTopButton ariaLabel="업데이트 페이지 상단으로 이동" />
    </main>
  );
}
