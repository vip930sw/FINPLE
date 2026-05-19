import "./StartHubPage.css";

const START_MENU_ITEMS = [
  {
    key: "investment-mbti",
    icon: "🧭",
    label: "투자 MBTI",
    eyebrow: "처음 시작",
    description: "질문을 통해 투자 성향을 확인하고, 예시 포트폴리오로 바로 이어집니다.",
    actionText: "성향 테스트 시작",
  },
  {
    key: "personal",
    icon: "📊",
    label: "포트폴리오 시뮬레이터",
    eyebrow: "직접 입력",
    description: "이미 보유 자산이 있거나 직접 포트폴리오를 조정하고 싶을 때 사용합니다.",
    actionText: "시뮬레이터 열기",
  },
  {
    key: "screener",
    icon: "🔎",
    label: "자산 스크리너",
    eyebrow: "별도 탐색",
    description: "ETF와 자산 후보를 먼저 찾아보고 싶을 때 별도 메뉴로 사용합니다.",
    actionText: "스크리너 열기",
  },
  {
    key: "support",
    icon: "✨",
    label: "Coming Soon",
    eyebrow: "준비 중",
    description: "리밸런싱, PDF 리포트, AI 코멘트 등 확장 기능을 순차적으로 준비합니다.",
    actionText: "의견 남기기",
  },
];

function StartHubPage({ onBack, onNavigate }) {
  return (
    <main className="page startHubPage">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon">
            <span>F</span>
            <i />
          </div>

          <div className="brandText">
            <strong>FINPLE</strong>
            <span>Start</span>
          </div>
        </button>

        <button type="button" className="headerButton" onClick={onBack}>
          홈으로
        </button>
      </header>

      <section className="startHubHero">
        <p className="badge">FINPLE Beta v0.2 Flow</p>
        <h1>무엇부터 시작할까요?</h1>
        <p>
          잘 모르겠다면 투자 MBTI로 성향을 먼저 확인하고, 보유 자산이 있다면 시뮬레이터에서 바로 점검할 수 있습니다.
        </p>
      </section>

      <section className="startHubGrid" aria-label="FINPLE 시작 메뉴">
        {START_MENU_ITEMS.map((item) => (
          <article key={item.key} className="startHubCard">
            <div className="startHubIcon" aria-hidden="true">{item.icon}</div>
            <p>{item.eyebrow}</p>
            <h2>{item.label}</h2>
            <span>{item.description}</span>
            <button type="button" onClick={() => onNavigate(item.key)}>
              {item.actionText}
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

export default StartHubPage;
