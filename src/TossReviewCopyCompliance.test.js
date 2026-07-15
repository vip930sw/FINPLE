import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("pricing exposes the Personal commercial terms and removes pre-launch payment copy", async () => {
  const source = await readSource("./components/AccountPages.jsx");

  [
    "FINPLE Personal",
    "월 9,900원",
    "매월 자동결제",
    "결제일로부터 1개월",
    "결제 완료 즉시 Personal 활성화",
    "해지 시 다음 결제일부터 자동결제 중단",
    'href="/terms"',
    'href="/privacy"',
    'href="/refund"',
  ].forEach((copy) => assert.match(source, new RegExp(copy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));

  assert.doesNotMatch(source, /실제 결제 기능은 준비 중입니다|결제 기능은 추후 추가|이후 결제 기능 도입 단계에서 추가/);
});

test("payment method setup, success, and failure pages use review-safe copy", async () => {
  const source = await readSource("./PaymentMethodRoutePatch.js");

  assert.match(source, /결제 후 7일 이내이고 Personal 유료 기능 이용내역이 없으면 환불을 요청/);
  assert.match(source, /카드번호 원문을 서버에 직접 저장하지 않고/);
  assert.doesNotMatch(source, /미사용, 부분 사용에 따른 금액 환불은 제한|미사용도 환불 제한/);
  assert.match(source, /<span>결제금액<\/span><strong>9,900원<\/strong>/);
  assert.match(source, /<span>서비스 제공기간<\/span><strong>1개월<\/strong>/);
  assert.match(source, /<span>결제주기<\/span><strong>월 자동결제<\/strong>/);
  assert.match(source, /billingIssueResult\?\.subscriptionActivated/);
  assert.match(source, /billingIssueResult\?\.nextPaymentDate \|\| billingIssueResult\?\.storage\?\.validUntil/);
  assert.match(source, /billingIssueResult\?\.paymentDate \|\| billingIssueResult\?\.firstPayment\?\.approvedAt/);
  assert.match(source, /billingIssueResult\?\.receiptUrl \|\| billingIssueResult\?\.firstPayment\?\.receiptUrl/);
  assert.doesNotMatch(source, /setMonth|setDate|Date\.now\(\)\s*\+/);
  assert.match(source, /결제는 승인되지 않고 구독도 활성화되지 않습니다/);
  assert.match(source, /data-payment-method-nav="\/pricing">요금제로 돌아가기/);
  assert.match(source, /data-payment-method-nav="\/support">결제 문의/);
});

test("test payment notice is rendered only for the explicit test mode", async () => {
  const source = await readSource("./PaymentMethodRoutePatch.js");

  assert.match(source, /if \(getFrontendPaymentMode\(\) !== "test"\) return ""/);
  assert.match(source, /data-payment-test-notice/);
  assert.match(source, /토스페이먼츠 테스트 환경/);
});

test("server response supplies dates and receipt without frontend next-date calculation", async () => {
  const source = await readFile(new URL("../server/src/routes/paymentOneWayBillingRoutes.js", import.meta.url), "utf8");

  assert.match(source, /paymentDate: firstPayment\?\.approvedAt \|\| null/);
  assert.match(source, /nextPaymentDate: storage\.subscriptionActivated \? storage\.validUntil : null/);
  assert.match(source, /receiptUrl: firstPayment\?\.receipt\?\.url \|\| null/);
  assert.match(source, /approvedAt: firstPayment\?\.approvedAt \|\| null/);
});

test("terms and privacy reflect active auth and billing while refund policy remains directly linked", async () => {
  const [legalSource, mainSource] = await Promise.all([
    readSource("./components/LegalPolicyPages.jsx"),
    readSource("./main.jsx"),
  ]);

  assert.match(legalSource, /이메일 인증 완료 후 이용/);
  assert.match(legalSource, /Google·네이버·카카오 소셜 로그인/);
  assert.match(legalSource, /토스페이먼츠/);
  assert.match(legalSource, /카드번호 원문을 서버에 직접 저장하지 않습니다/);
  assert.match(legalSource, /결제 후 7일 이내이고 Personal 유료 기능 이용내역이 없는 경우/);
  assert.doesNotMatch(legalSource, /초안|실제 회원가입, 소셜 로그인, 결제 기능은 추후|실제 소셜 로그인, 카드 결제, 구독 갱신 기능을 도입/);
  assert.doesNotMatch(mainSource, /TermsPaymentPolicyPatch/);
});

test("all public footer renderers use identical real markup without CSS generated business copy", async () => {
  const [appSource, paymentSource, billingSource, footerCss] = await Promise.all([
    readSource("./App.jsx"),
    readSource("./PaymentMethodRoutePatch.js"),
    readSource("./BillingResultRoutePatch.js"),
    readSource("./components/SiteFooter.css"),
  ]);
  const renderers = [appSource, paymentSource, billingSource];
  const requiredBusinessCopy = [
    "상호명:</strong> 핀플Finple",
    "대표자명:</strong> 이상원",
    "사업자등록번호:</strong> 550-21-02319",
    "통신판매업 신고번호:</strong> 제2025-서울강남-02127호",
    "서울특별시 강남구 테헤란로70길 12, 4층 402-343A호(대치동, H타워)",
    "010-3354-1028",
    "finple_lab@naver.com",
  ];

  renderers.forEach((source) => {
    assert.equal((source.match(/data-site-business-info/g) || []).length, 1);
    requiredBusinessCopy.forEach((copy) => assert.ok(source.includes(copy), copy));
  });
  assert.doesNotMatch(footerCss, /\.siteFooter::after/);
});

test("payment method routes keep priority over the React shell without a new observer", async () => {
  const [mainSource, paymentSource] = await Promise.all([
    readSource("./main.jsx"),
    readSource("./PaymentMethodRoutePatch.js"),
  ]);

  assert.ok(mainSource.indexOf("isPaymentMethodPath()") < mainSource.indexOf("createRoot("));
  assert.doesNotMatch(paymentSource, /MutationObserver/);
});
