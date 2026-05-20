/* =========================================================
   Step 146 - Pricing button scroll patch
   - /pricing에서 각 플랜 선택 버튼 클릭 후 상단 피드백 영역으로 이동합니다.
========================================================= */

function isPricingPage() {
  return window.location.pathname === "/pricing";
}

function isPricingPlanButton(target) {
  const button = target?.closest?.("button");
  if (!button) return false;

  return Boolean(button.closest(".accountPlanCard") || button.closest(".priceCard") || button.closest("#pricing"));
}

function getFeedbackTarget() {
  return (
    document.querySelector(".billingPrepBanner") ||
    document.querySelector(".pricingStatusPanel") ||
    document.querySelector(".accountHero")
  );
}

function scrollToFeedbackArea() {
  window.setTimeout(() => {
    const target = getFeedbackTarget();
    if (!target) return;

    const top = target.getBoundingClientRect().top + window.scrollY - 92;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, 180);
}

function handlePricingButtonScroll(event) {
  if (!isPricingPage()) return;
  if (!isPricingPlanButton(event.target)) return;

  scrollToFeedbackArea();
}

if (typeof window !== "undefined") {
  document.addEventListener("click", handlePricingButtonScroll, true);
}
