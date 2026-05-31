import { useEffect } from "react";

function InvestmentMbtiMarketChoiceBridge({ onOpenKrSimulator }) {
  useEffect(() => {
    const timerId = window.setInterval(() => {
      const actionBox = document.querySelector(".investmentMbtiResultActions.horizontal");
      if (!actionBox || actionBox.dataset.finpleMarketChoice === "ready") return;

      const buttons = Array.from(actionBox.querySelectorAll("button"));
      const usButton = buttons.find((button) => button.textContent?.includes("시뮬레이터") || button.textContent?.includes("미국"));
      if (!usButton) return;

      usButton.textContent = "미국 주식으로 포트폴리오 반영";

      const krButton = document.createElement("button");
      krButton.type = "button";
      krButton.className = "secondaryMbtiButton";
      krButton.textContent = "한국 주식으로 포트폴리오 반영";
      krButton.onclick = () => onOpenKrSimulator?.();

      actionBox.insertBefore(krButton, usButton.nextSibling);
      actionBox.dataset.finpleMarketChoice = "ready";
    }, 400);

    return () => window.clearInterval(timerId);
  }, [onOpenKrSimulator]);

  return null;
}

export default InvestmentMbtiMarketChoiceBridge;
