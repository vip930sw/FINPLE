import { useEffect, useRef, useState } from "react";

import { SIMULATOR_TAB_ITEMS } from "../utils/simulatorNavigation";

export default function SimulatorTabNav({ activeSimulatorTab, changeSimulatorTab }) {
  const [isAllStepsOpen, setIsAllStepsOpen] = useState(false);
  const mobileStepRefs = useRef(new Map());
  const activeIndex = Math.max(
    0,
    SIMULATOR_TAB_ITEMS.findIndex((item) => item.key === activeSimulatorTab),
  );
  const activeItem = SIMULATOR_TAB_ITEMS[activeIndex];
  const previousItem = SIMULATOR_TAB_ITEMS[activeIndex - 1] || null;
  const nextItem = SIMULATOR_TAB_ITEMS[activeIndex + 1] || null;

  useEffect(() => {
    if (!isAllStepsOpen) return;
    mobileStepRefs.current.get(activeSimulatorTab)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeSimulatorTab, isAllStepsOpen]);

  function selectStep(key) {
    changeSimulatorTab(key, { userInitiated: true });
  }

  return (
    <div className="simulatorStepNavigation">
      <nav
        className="simulatorTabNav fourStepNav sevenStepNav simulatorDesktopStepNav"
        aria-label="시뮬레이터 단계"
      >
        {SIMULATOR_TAB_ITEMS.map((item) => (
          <button
            key={item.key}
            className={activeSimulatorTab === item.key ? "simulatorTabButton active" : "simulatorTabButton"}
            type="button"
            id={`simulator-tab-${item.key}`}
            aria-current={activeSimulatorTab === item.key ? "step" : undefined}
            onClick={() => selectStep(item.key)}
          >
            <span>{item.step}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </nav>

      <div className="simulatorMobileStepControls" aria-label="현재 시뮬레이터 단계">
        <div className="simulatorMobileCurrentStep" aria-live="polite">
          <span>{activeItem.step}</span>
          <strong>{activeItem.title}</strong>
        </div>
        <div className="simulatorMobileStepActions">
          <button
            type="button"
            disabled={!previousItem}
            onClick={() => previousItem && selectStep(previousItem.key)}
            aria-label={previousItem ? `${previousItem.step} ${previousItem.title}로 이동` : "이전 단계 없음"}
          >
            이전
          </button>
          <button
            type="button"
            disabled={!nextItem}
            onClick={() => nextItem && selectStep(nextItem.key)}
            aria-label={nextItem ? `${nextItem.step} ${nextItem.title}로 이동` : "다음 단계 없음"}
          >
            다음
          </button>
          <button
            type="button"
            className="simulatorMobileAllStepsToggle"
            aria-expanded={isAllStepsOpen}
            aria-controls="simulator-mobile-all-steps"
            onClick={() => setIsAllStepsOpen((current) => !current)}
          >
            전체 단계
          </button>
        </div>

        <nav
          id="simulator-mobile-all-steps"
          className={isAllStepsOpen ? "simulatorMobileAllSteps open" : "simulatorMobileAllSteps"}
          aria-label="전체 시뮬레이터 단계"
          hidden={!isAllStepsOpen}
        >
          {SIMULATOR_TAB_ITEMS.map((item) => (
            <button
              key={item.key}
              ref={(node) => {
                if (node) mobileStepRefs.current.set(item.key, node);
                else mobileStepRefs.current.delete(item.key);
              }}
              type="button"
              aria-current={activeSimulatorTab === item.key ? "step" : undefined}
              className={activeSimulatorTab === item.key ? "active" : ""}
              onClick={() => selectStep(item.key)}
            >
              <span>{item.step.replace("STEP", "Step")}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
