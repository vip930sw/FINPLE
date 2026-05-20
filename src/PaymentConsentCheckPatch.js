/* =========================================================
   Step 147 - Payment consent check patch
   - 실제 결제창 연결 전 결제 전 고지와 필수 동의 체크를 추가합니다.
========================================================= */

const REQUIRED_KEYS = ["terms", "privacy", "refund", "recurring", "disclaimer"];

function isPricingPage() {
  return window.location.pathname === "/pricing";
}

function navigateTo(path) {
  window.location.href = path;
}

function injectConsentStyles() {
  if (document.getElementById("finple-payment-consent-style")) return;

  const style = document.createElement("style");
  style.id = "finple-payment-consent-style";
  style.textContent = `
    .paymentConsentBox {
      max-width: 760px;
      margin-top: 18px;
      padding: 16px 18px;
      border: 1px solid #dbeafe;
      border-radius: 18px;
      background: #f8fbff;
    }

    .paymentConsentBox h3 {
      margin: 0 0 10px;
      color: #0f172a;
      font-size: 15px;
      font-weight: 900;
    }

    .paymentConsentSummary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 12px;
      margin: 0 0 14px;
      padding: 0;
      list-style: none;
    }

    .paymentConsentSummary li {
      padding: 9px 10px;
      border-radius: 12px;
      background: #eef6ff;
      color: #0f172a;
      font-size: 12px;
      font-weight: 800;
    }

    .paymentConsentChecks {
      display: grid;
      gap: 9px;
      margin-top: 12px;
    }

    .paymentConsentCheck {
      display: grid;
      grid-template-columns: 18px minmax(0, 1fr) auto;
      gap: 10px;
      align-items: center;
      color: #0f172a;
      font-size: 13px;
      font-weight: 850;
    }

    .paymentConsentCheck input {
      width: 16px;
      height: 16px;
      accent-color: #0f172a;
    }

    .paymentConsentCheck button {
      border: 0;
      background: transparent;
      color: #2563eb;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      white-space: nowrap;
    }

    .paymentConsentStatus {
      margin-top: 13px;
      padding: 11px 12px;
      border: 1px solid #bfdbfe;
      border-radius: 13px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 13px;
      font-weight: 900;
      line-height: 1.6;
    }

    .paymentConsentStatus.ready {
      border-color: #bbf7d0;
      background: #f0fdf4;
      color: #15803d;
    }

    .paymentConsentConfirmButton {
      width: 100%;
      margin-top: 12px;
      justify-content: center;
    }

    .paymentConsentConfirmButton:disabled {
      opacity: 0.48;
      cursor: not-allowed;
    }

    @media (max-width: 720px) {
      .paymentConsentSummary {
        grid-template-columns: 1fr;
      }

      .paymentConsentCheck {
        grid-template-columns: 18px minmax(0, 1fr);
      }

      .paymentConsentCheck button {
        grid-column: 2;
        justify-self: start;
      }
    }
  `;

  document.head.appendChild(style);
}

function getConsentHtml() {
  return `
    <div class="paymentConsentBox" data-payment-consent-box>
      <h3>결제 전 필수 확인</h3>
      <ul class="paymentConsentSummary">
        <li>상품명: FINPLE Personal</li>
        <li>결제금액: 월 9,900원</li>
        <li>과금방식: 월 구독 / 정기결제</li>
        <li>현재 베타 기간에는 실제 결제 미발생</li>
        <li>해지 후 이용기간 종료일까지 사용</li>
        <li>카드번호는 FINPLE 서버에 직접 저장하지 않음</li>
      </ul>
      <div class="paymentConsentChecks">
        <label class="paymentConsentCheck">
          <input type="checkbox" data-consent-key="terms" />
          <span>이용약관을 확인했습니다.</span>
          <button type="button" data-consent-nav="/terms">보기</button>
        </label>
        <label class="paymentConsentCheck">
          <input type="checkbox" data-consent-key="privacy" />
          <span>개인정보처리방침을 확인했습니다.</span>
          <button type="button" data-consent-nav="/privacy">보기</button>
        </label>
        <label class="paymentConsentCheck">
          <input type="checkbox" data-consent-key="refund" />
          <span>환불·해지 정책을 확인했습니다.</span>
          <button type="button" data-consent-nav="/terms">보기</button>
        </label>
        <label class="paymentConsentCheck">
          <input type="checkbox" data-consent-key="recurring" />
          <span>정식 결제 도입 후 월 구독 정기결제 조건을 확인했습니다.</span>
          <button type="button" data-consent-nav="/pricing">보기</button>
        </label>
        <label class="paymentConsentCheck">
          <input type="checkbox" data-consent-key="disclaimer" />
          <span>투자자문 또는 수익보장이 아니라는 점을 확인했습니다.</span>
          <button type="button" data-consent-nav="/disclaimer">보기</button>
        </label>
      </div>
      <p class="paymentConsentStatus" data-payment-consent-status>필수 확인 항목을 모두 체크하면 결제 준비 완료를 확인할 수 있습니다.</p>
      <button type="button" class="primaryButton paymentConsentConfirmButton" data-payment-consent-confirm disabled>결제 준비 완료 확인</button>
    </div>
  `;
}

function getConsentBox() {
  return document.querySelector("[data-payment-consent-box]");
}

function isReady() {
  const box = getConsentBox();
  if (!box) return false;

  return REQUIRED_KEYS.every((key) => box.querySelector(`[data-consent-key="${key}"]`)?.checked);
}

function updateConsentState() {
  const box = getConsentBox();
  if (!box) return;

  const ready = isReady();
  const button = box.querySelector("[data-payment-consent-confirm]");
  const status = box.querySelector("[data-payment-consent-status]");

  if (button) button.disabled = !ready;
  if (status) {
    status.classList.toggle("ready", ready);
    status.textContent = ready
      ? "필수 확인이 완료되었습니다. 현재는 실제 결제 없이 준비 완료 상태만 확인합니다."
      : "필수 확인 항목을 모두 체크하면 결제 준비 완료를 확인할 수 있습니다.";
  }
}

function wireConsentBox() {
  const box = getConsentBox();
  if (!box || box.dataset.wired === "true") return;

  box.dataset.wired = "true";
  box.querySelectorAll("[data-consent-key]").forEach((input) => {
    input.addEventListener("change", updateConsentState);
  });
  box.querySelectorAll("[data-consent-nav]").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.getAttribute("data-consent-nav") || "/pricing"));
  });
  box.querySelector("[data-payment-consent-confirm]")?.addEventListener("click", () => {
    const status = box.querySelector("[data-payment-consent-status]");
    if (status) {
      status.classList.add("ready");
      status.textContent = "결제 전 고지 확인이 완료되었습니다. Toss 테스트 키 연결 후 이 버튼은 결제하기로 전환됩니다.";
    }
  });

  updateConsentState();
}

function upsertConsentBox() {
  if (!isPricingPage()) return;

  const banner = document.querySelector(".billingPrepBanner");
  if (!banner || getConsentBox()) return;

  const policyBox = banner.querySelector(".billingPolicyBox");
  if (!policyBox) return;

  injectConsentStyles();
  policyBox.insertAdjacentHTML("afterend", getConsentHtml());
  wireConsentBox();
}

function bootPaymentConsentPatch() {
  const observer = new MutationObserver(() => upsertConsentBox());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(upsertConsentBox, 150);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootPaymentConsentPatch, { once: true });
  } else {
    bootPaymentConsentPatch();
  }
}
