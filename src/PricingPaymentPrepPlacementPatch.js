/* =========================================================
   Step 148 - Pricing Payment Prep placement patch
   - 요금제 카드 3종을 먼저 보여주고, Personal 선택 후 Payment Prep을 카드 아래에 배치합니다.
   Step 149 - Load payment mode status patch
========================================================= */

import "./PaymentModeStatusPatch.js";

function isPricingPage() {
  return window.location.pathname === "/pricing";
}

function getPlanGrid() {
  return document.querySelector(".accountPlanGrid");
}

function getBillingPrepBanner() {
  return document.querySelector(".billingPrepBanner");
}

function getPricingNoticeBox() {
  return document.querySelector(".pricingNoticeBox");
}

function placeBillingPrepAfterPlanGrid() {
  if (!isPricingPage()) return;

  const planGrid = getPlanGrid();
  const banner = getBillingPrepBanner();
  if (!planGrid || !banner) return;

  const nextElement = planGrid.nextElementSibling;
  if (nextElement === banner) return;

  const noticeBox = getPricingNoticeBox();
  if (noticeBox?.parentNode) {
    noticeBox.parentNode.insertBefore(banner, noticeBox);
    return;
  }

  planGrid.insertAdjacentElement("afterend", banner);
}

function bootPricingPaymentPrepPlacement() {
  const observer = new MutationObserver(() => placeBillingPrepAfterPlanGrid());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.setTimeout(placeBillingPrepAfterPlanGrid, 80);
  window.setTimeout(placeBillingPrepAfterPlanGrid, 300);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPricingPaymentPrepPlacement, { once: true });
  } else {
    bootPricingPaymentPrepPlacement();
  }
}