/* Step 157D - keep already subscribed payment state after consent changes */

let rafId = 0;
let lastAppliedSignature = "";
let eventBound = false;

function readPayload() {
  return window.__finpleLatestPreparePayload || null;
}

function isAlreadySubscribed(payload) {
  return Boolean(payload?.alreadySubscribed || payload?.code === "ALREADY_PERSONAL_ACTIVE");
}

function setTextIfChanged(node, value) {
  if (!node) return;
  const nextValue = String(value ?? "");
  if (node.textContent !== nextValue) {
    node.textContent = nextValue;
  }
}

function setClassIfNeeded(node, className, shouldHave) {
  if (!node) return;
  const hasClass = node.classList.contains(className);
  if (shouldHave && !hasClass) node.classList.add(className);
  if (!shouldHave && hasClass) node.classList.remove(className);
}

function setDisabledIfChanged(node, disabled) {
  if (!node) return;
  const nextValue = Boolean(disabled);
  if (node.disabled !== nextValue) {
    node.disabled = nextValue;
  }
}

function applyAlreadySubscribedCopy() {
  rafId = 0;

  const payload = readPayload();
  if (!isAlreadySubscribed(payload)) {
    lastAppliedSignature = "";
    return;
  }

  const status = document.querySelector("[data-payment-consent-status]");
  const button = document.querySelector("[data-payment-consent-confirm]");
  if (!status && !button) return;

  const message = payload.message || "이미 Personal을 이용 중입니다. 현재 이용기간 종료일까지 추가 결제 없이 Personal 기능을 사용할 수 있습니다.";
  const buttonText = "이미 Personal 이용 중";
  const signature = `${message}|${buttonText}`;

  if (lastAppliedSignature === signature && status?.textContent === message && button?.textContent === buttonText && button?.disabled) {
    return;
  }

  if (status) {
    setClassIfNeeded(status, "ready", true);
    setClassIfNeeded(status, "error", false);
    setTextIfChanged(status, message);
  }

  if (button) {
    setDisabledIfChanged(button, true);
    setTextIfChanged(button, buttonText);
  }

  lastAppliedSignature = signature;
}

function scheduleAlreadySubscribedCopy() {
  if (rafId) return;
  rafId = window.requestAnimationFrame(applyAlreadySubscribedCopy);
}

function scheduleAfterConsentChange(event) {
  if (!event.target?.matches?.("[data-consent-key]")) return;
  window.setTimeout(scheduleAlreadySubscribedCopy, 0);
  window.setTimeout(scheduleAlreadySubscribedCopy, 80);
}

function bootAlreadySubscribedPatch() {
  if (eventBound) return;
  eventBound = true;

  window.addEventListener("finple:payment-prepare-updated", scheduleAlreadySubscribedCopy);
  document.addEventListener("change", scheduleAfterConsentChange, true);
  document.addEventListener("click", scheduleAfterConsentChange, true);
  window.setTimeout(scheduleAlreadySubscribedCopy, 150);
  window.setTimeout(scheduleAlreadySubscribedCopy, 600);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAlreadySubscribedPatch, { once: true });
  } else {
    bootAlreadySubscribedPatch();
  }
}