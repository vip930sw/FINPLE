const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

test("Step 172 checker covers smoke preflight review result and no new endpoint", () => {
  const checkText = fs.readFileSync(
    "scripts/check-trading-step172-admin-trading-lab-smoke-preflight-review-result.cjs",
    "utf8",
  );
  const packageText = fs.readFileSync("package.json", "utf8");
  const panelText = fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
  const cssText = fs.readFileSync("src/App.css", "utf8");
  const headerText = fs.readFileSync("src/components/SiteHeader.jsx", "utf8");
  const routeText = fs.readFileSync("server/src/routes/adminTradingReadinessRoutes.js", "utf8");
  const clientText = fs.readFileSync("src/components/portfolio/services/serverPortfolioService.js", "utf8");

  assert.match(checkText, /TRADING_LAB_SMOKE_REVIEW_RESULT_ITEMS/);
  assert.match(checkText, /FORBIDDEN_NEW_ENDPOINT_SNIPPETS/);
  assert.match(checkText, /MY_PAGE_FILES/);
  assert.match(checkText, /scenario_monthly_returns\.csv/);
  assert.match(checkText, /providerCallsAllowed: true/);
  assert.match(checkText, /orderSubmissionAllowed: true/);
  assert.match(checkText, /readyForLiveGuardedTrading: true/);
  assert.match(packageText, /check:trading-step172-admin-trading-lab-smoke-preflight-review-result/);

  assert.match(panelText, /trading-lab-smoke-preflight-review-result/);
  assert.match(panelText, /관리자 거래 실험실 smoke 검토 결과/);
  assert.match(panelText, /새 endpoint 없이 기존 Step169\/admin readiness data와 Step171 화면 점검 결과를 재사용/);
  assert.match(panelText, /모의 운용 대시보드 정상 표시/);
  assert.match(panelText, /거래 안전평가 정상 표시/);
  assert.match(panelText, /상태 badge 정상 표시/);
  assert.match(panelText, /상세 검증 로그 접힘 유지/);
  assert.match(panelText, /내부 provider 호출 없음/);
  assert.match(panelText, /주문 제출 없음/);
  assert.match(panelText, /DB 저장 없음/);
  assert.match(panelText, /실거래 준비 상태/);
  assert.match(panelText, /My Page·homepage 미노출/);
  assert.match(panelText, /Step166 계정·구독·결제 sync/);
  assert.doesNotMatch(panelText, /<span>mock-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>admin-only<\/span>/);
  assert.doesNotMatch(panelText, /<span>blocked<\/span>/);

  assert.match(cssText, /\.tradingLabSmokeReviewResult/);
  assert.match(cssText, /\.tradingLabSmokeReviewCards/);
  assert.match(cssText, /\.tradingLabConsolidatedBadges span/);
  assert.match(cssText, /\.adminTradingHeaderActive \.brandIcon i/);
  assert.match(headerText, /adminTradingHeaderActive/);
  assert.doesNotMatch(routeText, /trading-lab-smoke-preflight-review-result/);
  assert.doesNotMatch(clientText, /fetchAdminTradingLabSmokePreflightReviewResultStatus/);
});
