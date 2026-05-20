/* Step 157B - clarify already subscribed payment state */

function readPayload() {
  return window.__finpleLatestPreparePayload || null;
}

function isAlreadySubscribed(payload) {
  return Boolean(payload?.alreadySubscribed || payload?.code === "ALREADY_PERSONAL_ACTIVE");
}

function updateAlreadySubscribedCopy() {
  const payload = readPayload();
  if (!isAlreadySubscribed(payload)) return;

  const status = document.querySelector("[data-payment-consent-status]");
  const button = document.querySelector("[data-payment-consent-confirm]");

  if (status) {
    status.classList.add("ready");
    status.classList.remove("error");
    status.textContent = payload.message || "이미 Personal을 이용 중입니다. 추가 결제는 필요하지 않습니다.";
  }

  if (button) {
    button.disabled = true;
    button.textContent = "이미 Personal 이용 중";
  }
}

function bootAlreadySubscribedPatch() {
  const observer = new MutationObserver(updateAlreadySubscribedCopy);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("finple:payment-prepare-updated", updateAlreadySubscribedCopy);
  window.setTimeout(updateAlreadySubscribedCopy, 150);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAlreadySubscribedPatch, { once: true });
  } else {
    bootAlreadySubscribedPatch();
  }
}
