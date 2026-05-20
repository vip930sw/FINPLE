/* Step 157C - safe already subscribed payment state patch */

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

  const message = payload.message || "이미 Personal을 이용 중입니다. 추가 결제는 필요하지 않습니다.";
  const signature = `${message}|already-personal`;

  if (lastAppliedSignature === signature && status?.textContent === message && button?.textContent === "이미 Personal 이용 중") {
    return;
  }

  if (status) {
    setClassIfNeeded(status, "ready", true);
    setClassIfNeeded(status, "error", false);
    setTextIfChanged(status, message);
  }

  if (button) {
    setDisabledIfChanged(button, true);
    setTextIfChanged(button, "이미 Personal 이용 중");
  }

  lastAppliedSignature = signature;
}

function scheduleAlreadySubscribedCopy() {
  if (rafId) return;
  rafId = window.requestAnimationFrame(applyAlreadySubscribedCopy);
}

function bootAlreadySubscribedPatch() {
  if (eventBound) return;
  eventBound = true;

  window.addEventListener("finple:payment-prepare-updated", scheduleAlreadySubscribedCopy);
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