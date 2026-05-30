const TAB_ITEMS = [
  { key: "settings", step: "STEP 1", title: "시뮬레이터" },
  { key: "compare", step: "STEP 2", title: "포트폴리오" },
  { key: "detail", step: "STEP 3", title: "상세분석" },
];

export default function SimulatorTabNav({ activeSimulatorTab, changeSimulatorTab }) {
  function handleTabClick(itemKey) {
    if (itemKey === "detail") {
      window.location.href = "/simulator/detail";
      return;
    }

    changeSimulatorTab(itemKey);
  }

  return (
    <div className="simulatorTabNav threeStepNav">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className={
            activeSimulatorTab === item.key
              ? "simulatorTabButton active"
              : "simulatorTabButton"
          }
          onClick={() => handleTabClick(item.key)}
        >
          <span>{item.step}</span>
          <strong>{item.title}</strong>
        </button>
      ))}
    </div>
  );
}
