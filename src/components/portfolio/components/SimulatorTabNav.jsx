import { SIMULATOR_TAB_ITEMS } from "../utils/simulatorNavigation";

export default function SimulatorTabNav({ activeSimulatorTab, changeSimulatorTab }) {
  return (
    <div className="simulatorTabNav fourStepNav" role="tablist" aria-label="포트폴리오 시뮬레이터 단계">
      {SIMULATOR_TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className={activeSimulatorTab === item.key ? "simulatorTabButton active" : "simulatorTabButton"}
          type="button"
          role="tab"
          id={`simulator-tab-${item.key}`}
          aria-controls={item.anchorId}
          aria-selected={activeSimulatorTab === item.key}
          aria-current={activeSimulatorTab === item.key ? "step" : undefined}
          onClick={() => changeSimulatorTab(item.key)}
        >
          <span>{item.step}</span>
          <strong>{item.title}</strong>
        </button>
      ))}
    </div>
  );
}
