import { SIMULATOR_TAB_ITEMS } from "../utils/simulatorNavigation";

export default function SimulatorTabNav({ activeSimulatorTab, changeSimulatorTab }) {
  return (
    <nav className="simulatorTabNav fourStepNav" aria-label="포트폴리오 시뮬레이터 단계">
      {SIMULATOR_TAB_ITEMS.map((item) => (
        <button
          key={item.key}
          className={activeSimulatorTab === item.key ? "simulatorTabButton active" : "simulatorTabButton"}
          type="button"
          id={`simulator-tab-${item.key}`}
          aria-current={activeSimulatorTab === item.key ? "step" : undefined}
          onClick={() => changeSimulatorTab(item.key)}
        >
          <span>{item.step}</span>
          <strong>{item.title}</strong>
        </button>
      ))}
    </nav>
  );
}
