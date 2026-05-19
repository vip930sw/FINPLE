/* =========================================================
   Step 136 - Payment Terms Policy Patch
   - 실제 PG 연동 전 이용약관 화면에 결제/해지/환불 정책 초안을 보강합니다.
========================================================= */

function isTermsPage() {
  return window.location.pathname === "/terms" || window.location.hash === "#terms";
}

function insertPaymentTermsPolicy() {
  if (!isTermsPage()) return;
  if (document.querySelector(".termsPaymentPolicyPatch")) return;

  const legalCard = document.querySelector(".legalDocumentCard");
  if (!legalCard) return;

  const wrapper = document.createElement("article");
  wrapper.className = "legalDocumentSection termsPaymentPolicyPatch";
  wrapper.innerHTML = `
    <h2>6. 유료 구독, 해지 및 환불</h2>
    <p>FINPLE Personal은 월 단위 구독형 디지털 서비스로 제공될 예정입니다. 실제 결제 기능 도입 전까지는 베타 운영 단계이며, 결제가 발생하지 않습니다.</p>
    <p>정식 결제 도입 후 사용자는 언제든지 구독 해지를 신청할 수 있습니다. 구독을 해지하더라도 이미 결제된 이용기간 종료일까지 Personal 기능을 계속 사용할 수 있으며, 다음 결제일부터 자동 갱신이 중단됩니다.</p>
    <p>단순 변심 또는 이용 중 해지에 따른 일할 환불은 원칙적으로 제공되지 않습니다. 다만 중복 결제, 명백한 오결제, FINPLE 귀책으로 핵심 유료 기능을 장시간 제공하지 못한 경우 등은 이용 이력과 결제 내역 확인 후 환불 또는 결제 취소를 검토합니다.</p>
    <ul>
      <li>구독 해지 후 이용기간 종료일까지 Personal 기능 유지</li>
      <li>이용기간 종료 후 Free 플랜 전환</li>
      <li>단순 변심 또는 이용 중 해지에 따른 일할 환불 제한</li>
      <li>중복 결제, 오결제, 서비스 장애 등은 별도 검토</li>
    </ul>
    <h2>7. 결제정보 처리 원칙</h2>
    <p>FINPLE은 고객의 카드번호를 서비스 서버 또는 데이터베이스에 직접 저장하지 않습니다. 정기결제가 도입되는 경우 PG사가 제공하는 빌링키 또는 결제 토큰을 기반으로 처리합니다.</p>
    <p>결제 승인, 해지, 환불, 결제 실패 등 결제 관련 이벤트는 서비스 제공 및 분쟁 대응을 위해 관련 법령과 내부 기준에 따라 보관될 수 있습니다.</p>
  `;

  legalCard.appendChild(wrapper);
}

function bootTermsPaymentPolicyPatch() {
  const observer = new MutationObserver(insertPaymentTermsPolicy);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(insertPaymentTermsPolicy, 120);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootTermsPaymentPolicyPatch, { once: true });
  } else {
    bootTermsPaymentPolicyPatch();
  }
}
