import "./StartHubPage.css";

const START_MENU_ITEMS = [
  {
    key: "investment-mbti",
    icon: "🧭",
    label: "투자 MBTI",
    eyebrow: "처음 시작",
    description: "질문을 통해 투자 성향을 확인하고, 포트폴리오 적용 방향을 선택할 수 있습니다.",
    actionText: "성향 테스트 시작",
  },
  {
    key: "simulator",
    icon: "📊",
    label: "포트폴리오 시뮬레이터",
    eyebrow: "분석 도구",
    description: "미국·한국 주식과 ETF를 함께 담아 장기 수익·위험·배당·실질가치를 점검합니다.",
    actionText: "시뮬레이터 열기",
  },
  {
    key: "screener",
    icon: "🔎",
    label: "자산 파인더",
    eyebrow: "탐색 도구",
    description: "검증된 ETF와 개별주 후보를 먼저 찾아보고, 필요한 자산만 포트폴리오에 추가합니다.",
    actionText: "자산 찾기",
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
      <section className="startHubHero">
        <p className="badge">FINPLE Beta v0.3 Flow</p>
        <h1>무엇부터 시작할까요?</h1>
        <p>
          투자 MBTI로 성향을 먼저 확인하고, 보유 자산이 있다면 포트폴리오 시뮬레이터에서 점검할 수 있습니다.
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
