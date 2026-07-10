const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

test("Step176 checker is wired to safety assessment layout polish and guardrails", () => {
  const checkText = read("scripts/check-trading-step176-admin-trading-safety-assessment-layout-polish.cjs");
  const packageText = read("package.json");
  const panelText = read("src/components/TradingReadinessPanel.jsx");
  const cssText = read("src/App.css");
  const routeText = read("server/src/routes/adminTradingReadinessRoutes.js");
  const clientText = read("src/components/portfolio/services/serverPortfolioService.js");

  assert.match(checkText, /tradingSafetyAssessmentShell/);
  assert.match(checkText, /tradingSafetyDetailChainShell/);
  assert.match(checkText, /PUBLIC_SURFACE_FILES/);
  assert.match(checkText, /FORBIDDEN_SOURCE_SNIPPETS/);
  assert.match(checkText, /FORBIDDEN_PATHS/);
  assert.match(checkText, /word-break: keep-all/);
  assert.match(checkText, /overflow-wrap: break-word/);
  assert.match(checkText, /trading-safety-assessment-layout-polish/);

  assert.match(packageText, /check:trading-step176-admin-trading-safety-assessment-layout-polish/);

  assert.match(panelText, /trading-safety-assessment-layout-polish/);
  assert.match(panelText, /tradingSafetyAssessmentShell/);
  assert.match(panelText, /tradingSafetyNoticeChips/);
  assert.match(panelText, /tradingSafetyStatusCards/);
  assert.match(panelText, /tradingSafetyFlagBadgeGrid/);
  assert.match(panelText, /tradingSafetyAuditEmptyState/);
  assert.match(panelText, /tradingSafetyDetailChainShell/);
  assert.match(panelText, /data-default-collapsed="true"/);
  assert.match(panelText, /실제 거래 감사 이벤트는 아직 발생하지 않았습니다\./);
  assert.match(panelText, /상세 검증 이력 펼쳐보기/);
  assert.ok(panelText.indexOf("tradingSafetyAssessmentShell") < panelText.indexOf("tradingLabDashboardPanel"));
  assert.ok(panelText.indexOf("tradingLabDashboardPanel") < panelText.indexOf("tradingSafetyDetailChainShell"));

  assert.match(cssText, /\.tradingSafetyAssessmentShell/);
  assert.match(cssText, /\.tradingSafetyNoticeChips/);
  assert.match(cssText, /\.tradingSafetyStatusCards/);
  assert.match(cssText, /\.tradingSafetyFlagBadgeGrid/);
  assert.match(cssText, /\.tradingSafetyAuditEmptyState/);
  assert.match(cssText, /\.tradingSafetyDetailChainShell/);
  assert.match(cssText, /word-break: keep-all/);
  assert.match(cssText, /overflow-wrap: break-word/);

  assert.doesNotMatch(routeText, /trading-safety-assessment-layout-polish/);
  assert.doesNotMatch(clientText, /trading-safety-assessment-layout-polish/);
  assert.doesNotMatch(clientText, /fetchAdminTradingSafetyAssessmentLayoutPolishStatus/);
});
