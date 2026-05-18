import "./StartHubPage.css";

const START_MENU_ITEMS = [
  {
    key: "personal",
    icon: "📊",
    label: "포트폴리오 시뮬레이터",
    eyebrow: "직접 입력",
    description: "이미 보유 자산이 있거나 직접 포트폴리오를 조정하고 싶을 때 사용합니다.",
    actionText: "시뮬레이터 열기",
  },
  {
    key: "investment-mbti",
    icon: "🧭",
    label: "투자 MBTI",
    eyebrow: "처음 시작",
    description: "질문을 통해 투자 성향을 확인하고, 시뮬레이터로 자연스럽게 이어집니다.",
    actionText: "성향 테스트 시작",
    featured: true,
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
          첫 사용자에게 정보가 한 번에 몰리지 않도록, 목적에 따라 시작 지점을 나눴습니다.
          잘 모르겠다면 투자 MBTI부터 시작하는 흐름을 추천합니다.
        </p>
      </section>

      <section className="startHubGrid" aria-label="FINPLE 시작 메뉴">
        {START_MENU_ITEMS.map((item) => (
          <article key={item.key} className={item.featured ? "startHubCard featured" : "startHubCard"}>
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

      <section className="startHubNote" role="note">
        <strong>진입 흐름 개선</strong>
        <p>
          스크리너는 후보 자산을 탐색하는 별도 메뉴로 분리하고, 시뮬레이터는 직접 입력 중심으로 정리했습니다.
          투자 MBTI는 초보 사용자가 시뮬레이터로 넘어가기 전 성향을 이해하는 가벼운入口 역할을 합니다.
        </p>
      </section>
    </main>
  );
}

export default StartHubPage;
