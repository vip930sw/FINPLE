const TAB_ITEMS = [
  { key: "screener", step: "STEP 1", title: "스크리너", description: "자산 찾기" },
  { key: "settings", step: "STEP 2", title: "시뮬레이터", description: "조건 입력" },
  { key: "compare", step: "STEP 3", title: "포트폴리오", description: "저장/비교" },
  { key: "detail", step: "STEP 4", title: "상세분석", description: "리포트" },
];

export default function SimulatorTabNav({ activeSimulatorTab, changeSimulatorTab }) {
  return (
    <div className="simulatorTabNav fourStepNav">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className={
            activeSimulatorTab === item.key
              ? "simulatorTabButton active"
              : "simulatorTabButton"
          }
          onClick={() => changeSimulatorTab(item.key)}
        >
          <span>{item.step}</span>
          <strong>{item.title}</strong>
          <small>{item.description}</small>
        </button>
      ))}
    </div>
  );
}
