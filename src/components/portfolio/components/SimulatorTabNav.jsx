const TAB_ITEMS = [
  { key: "settings", step: "STEP 1", title: "시뮬레이터" },
  { key: "compare", step: "STEP 2", title: "포트폴리오" },
  { key: "detail", step: "STEP 3", title: "상세분석" },
  { key: "ai", step: "STEP 4", title: "AI 분석" },
];

export default function SimulatorTabNav({ activeSimulatorTab, changeSimulatorTab }) {
  return (
    <div className="simulatorTabNav fourStepNav">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className={activeSimulatorTab === item.key ? "simulatorTabButton active" : "simulatorTabButton"}
          onClick={() => changeSimulatorTab(item.key)}
        >
          <span>{item.step}</span>
          <strong>{item.title}</strong>
        </button>
      ))}
    </div>
  );
}
