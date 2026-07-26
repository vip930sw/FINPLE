import { useEffect, useRef, useState } from "react";

import {
  FINPLE_PLAN_CONFIGS,
  getPlanLimitMessage,
  getStoredFinplePlan,
  getUpgradePromptText,
} from "../config/planConfig";
import { canCreatePortfolio } from "../utils/portfolioLifecycle.js";

const TEMPLATE_OPTIONS = Object.freeze([
  ["balanced", "균형형으로 시작", "성장·배당·안정 자산을 혼합"],
  ["growth", "성장형으로 시작", "나스닥 100 중심의 성장 구성"],
  ["dividend", "배당형으로 시작", "배당 현금흐름과 장기 보유 중심"],
  ["stable", "안정형으로 시작", "채권·금 비중을 높인 방어 구성"],
  ["goldDefense", "금 방어형으로 시작", "금·장기채 중심의 위기 방어 구성"],
  ["reitIncome", "리츠 인컴형으로 시작", "리츠·배당 현금흐름 중심"],
  ["growthZero", "성장주 제로형으로 시작", "성장주 없이 배당·채권·금 중심"],
  ["growthFocus", "성장주 집중형으로 시작", "나스닥 100 비중을 극대화"],
  ["allWeather", "올웨더형으로 시작", "주식·채권·금·현금 균형 배분"],
  ["highConviction", "하이컨빅션형으로 시작", "성장주와 블록체인 테마 집중"],
  ["empty", "빈 포트폴리오로 시작", "티커와 수량을 직접 입력"],
]);

function getCurrentPlanPortfolioLimit() {
  const planKey = getStoredFinplePlan();
  const currentPlan = FINPLE_PLAN_CONFIGS[planKey] || FINPLE_PLAN_CONFIGS.free;
  const portfolioLimit = currentPlan?.limits?.portfolios;
  return Number.isFinite(portfolioLimit)
    ? Math.max(1, Number(portfolioLimit))
    : Infinity;
}

function showPortfolioLimitNotice() {
  const planKey = getStoredFinplePlan();
  const message = getPlanLimitMessage(planKey, "portfolio");
  const shouldMove = window.confirm(getUpgradePromptText(planKey, "portfolio"));
  if (shouldMove) window.location.href = "/pricing";
  return message;
}

export default function NewPortfolioMenu({
  portfolioCount = 0,
  activePortfolio,
  isOpen,
  setIsOpen,
  createPortfolioFromTemplate,
  duplicateActivePortfolio,
  enableDesktopFloatingRepeat = false,
}) {
  const primaryWrapRef = useRef(null);
  const primaryTriggerRef = useRef(null);
  const floatingWrapRef = useRef(null);
  const floatingTriggerRef = useRef(null);
  const [menuSurface, setMenuSurface] = useState("primary");
  const [isPrimaryVisible, setIsPrimaryVisible] = useState(true);
  const portfolioLimit = getCurrentPlanPortfolioLimit();
  const isPortfolioLimitReached = !canCreatePortfolio(
    portfolioCount,
    portfolioLimit,
  );

  useEffect(() => {
    if (!enableDesktopFloatingRepeat || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const target = primaryWrapRef.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsPrimaryVisible(entry?.isIntersecting === true),
      { threshold: 0.25 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [enableDesktopFloatingRepeat]);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;
    const activeSurface = menuSurface;
    const activeWrapRef =
      activeSurface === "floating" ? floatingWrapRef : primaryWrapRef;
    const activeTriggerRef =
      activeSurface === "floating" ? floatingTriggerRef : primaryTriggerRef;

    function closeAndRestoreFocus() {
      setIsOpen(false);
      window.requestAnimationFrame(() => activeTriggerRef.current?.focus());
    }

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeAndRestoreFocus();
    }

    function handlePointerDown(event) {
      if (activeWrapRef.current?.contains(event.target)) return;
      closeAndRestoreFocus();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, menuSurface, setIsOpen]);

  function openMenu(surface) {
    if (isPortfolioLimitReached) {
      setIsOpen(false);
      showPortfolioLimitNotice();
      return;
    }
    setMenuSurface(surface);
    setIsOpen(isOpen && menuSurface === surface ? false : true);
  }

  function createFromTemplate(templateKey) {
    if (isPortfolioLimitReached) {
      setIsOpen(false);
      showPortfolioLimitNotice();
      return;
    }
    createPortfolioFromTemplate(templateKey);
  }

  function duplicateCurrent() {
    if (!activePortfolio) return;
    if (isPortfolioLimitReached) {
      setIsOpen(false);
      showPortfolioLimitNotice();
      return;
    }
    duplicateActivePortfolio();
  }

  function renderMenu(id) {
    return (
      <div id={id} className="newPortfolioMenu">
        {TEMPLATE_OPTIONS.map(([key, title, description]) => (
          <button
            key={key}
            type="button"
            onClick={() => createFromTemplate(key)}
          >
            <strong>{title}</strong>
            <span>{description}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={duplicateCurrent}
          disabled={!activePortfolio}
        >
          <strong>현재 포트폴리오 복제</strong>
          <span>현재 자산 구성과 설정을 그대로 복사</span>
        </button>
      </div>
    );
  }

  const primaryMenuId = "step1-new-portfolio-menu";
  const floatingMenuId = "step1-floating-new-portfolio-menu";

  return (
    <>
      <div ref={primaryWrapRef} className="newPortfolioMenuWrap step1NewPortfolioMenu">
        <button
          ref={primaryTriggerRef}
          type="button"
          className="newPortfolioButton"
          onClick={() => openMenu("primary")}
          aria-expanded={isOpen && menuSurface === "primary"}
          aria-controls={primaryMenuId}
        >
          새 포트폴리오 ▾
        </button>
        {isOpen && menuSurface === "primary" ? renderMenu(primaryMenuId) : null}
      </div>

      {enableDesktopFloatingRepeat && !isPrimaryVisible ? (
        <div ref={floatingWrapRef} className="floatingNewPortfolioMenuWrap">
          <button
            ref={floatingTriggerRef}
            type="button"
            className="floatingNewPortfolioButton"
            onClick={() => openMenu("floating")}
            aria-expanded={isOpen && menuSurface === "floating"}
            aria-controls={floatingMenuId}
          >
            + 새 포트폴리오
          </button>
          {isOpen && menuSurface === "floating"
            ? renderMenu(floatingMenuId)
            : null}
        </div>
      ) : null}
    </>
  );
}
