const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

const read = (filePath) => fs.readFileSync(filePath, "utf8");

test("Scenario A: summary preview placement is inside native summary", () => {
  const component = read("src/components/TradingAiMlPanelGroup.jsx");
  assert.ok(component.indexOf("<summary") < component.indexOf("tradingAiMlPanelGroupSummaryPreview"));
  assert.ok(component.indexOf("tradingAiMlPanelGroupSummaryPreview") < component.indexOf("tradingAiMlPanelGroupBody"));
});

test("Scenario B: collapsed visibility contract does not depend on details body", () => {
  const component = read("src/components/TradingAiMlPanelGroup.jsx");
  const previewIndex = component.indexOf("tradingAiMlPanelGroupSummaryPreview");
  const bodyIndex = component.indexOf("tradingAiMlPanelGroupBody");
  assert.ok(previewIndex > 0);
  assert.ok(previewIndex < bodyIndex);
  assert.match(component, /summaryItems = \[\]/);
});

test("Scenario C: item limit is explicit and ordering remains deterministic", () => {
  const component = read("src/components/TradingAiMlPanelGroup.jsx");
  assert.match(component, /summaryItems\.slice\(0, 5\)\.map/);
  assert.match(component, /key=\{item\.label\}/);
  assert.match(component, /tone: \["blocked", "review", "external"\]\.includes\(item\.tone\) \? item\.tone : "neutral"/);
});

test("Scenario D: milestone summary shows contract chain, runtime, execution, and next phase", () => {
  const panel = read("src/components/TradingReadinessPanel.jsx");
  for (const snippet of [
    "labAiMlMilestoneSummaryItems",
    "Architecture",
    "contract_chain_complete",
    "Runtime",
    "not_implemented",
    "Execution",
    "blocked",
    "Next phase",
    "consolidate_before_runtime",
  ]) {
    assert.match(panel, new RegExp(snippet));
  }
});

test("Scenario E: current gates summary shows blocked, not_granted, and external_blocker", () => {
  const panel = read("src/components/TradingReadinessPanel.jsx");
  for (const snippet of [
    "labAiMlCurrentGatesSummaryItems",
    "Execution",
    "blocked",
    "Approval",
    "not_granted",
    "Materialization",
    "Target preflight",
    "External authority",
    "external_blocker",
  ]) {
    assert.match(panel, new RegExp(snippet));
  }
});

test("Scenario F: foundation summary stays coarse without readiness calculation", () => {
  const panel = read("src/components/TradingReadinessPanel.jsx");
  for (const snippet of [
    "labAiMlArchitectureFoundationSummaryItems",
    "Stages",
    "4",
    "Scope",
    "metadata architecture",
    "Preflight",
    "contract only",
    "Execution",
    "blocked",
  ]) {
    assert.match(panel, new RegExp(snippet));
  }
});

test("Scenario G: accessibility keeps details and summary without nested action elements", () => {
  const component = read("src/components/TradingAiMlPanelGroup.jsx");
  assert.match(component, /<details/);
  assert.match(component, /<summary/);
  for (const snippet of ["<button", "<input", "<select", "<textarea", "href=", "onClick="]) {
    assert.doesNotMatch(component, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Scenario H: panel and group keys are complete and unique", () => {
  const panel = read("src/components/TradingReadinessPanel.jsx");
  for (const key of [
    "ai-ml-architecture-milestone-review",
    "ai-ml-readiness-gate-summary",
    "ai-ml-batch-contract-review",
    "ai-ml-dataset-build-dry-run-manifest",
    "ai-ml-manifest-validation-report",
    "ai-ml-manifest-handoff-eligibility",
    "ai-ml-strategy-management-console",
    "ai-ml-dataset-labeling-architecture",
    "ai-ml-feature-pipeline-architecture",
    "ai-ml-feature-pipeline-preflight",
  ]) {
    assert.equal(panel.split(`data-admin-panel-key="${key}"`).length - 1, 1, key);
  }
  for (const key of [
    "ai-ml-milestone-overview",
    "ai-ml-current-gates-and-handoff",
    "ai-ml-architecture-foundation",
  ]) {
    assert.equal(panel.split(`groupKey="${key}"`).length - 1, 1, key);
  }
});

test("Scenario I: service files remain untouched by Step205 UI markers", () => {
  for (const file of [
    "server/src/services/tradingAdminLabDashboardShell.js",
    "server/src/services/tradingAiMlContractPrimitives.js",
    "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /Step205/);
    assert.doesNotMatch(source, /tradingAiMlPanelGroupSummaryPreview/);
  }
});

test("Scenario J: Step205 checker passes and keeps Step204 and Step203 regression linkage", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step205-ai-ml-collapsed-summary-polish.cjs"], {
    encoding: "utf8",
  });
  const packageJson = read("package.json");
  assert.match(output, /\[check-trading-step205-ai-ml-collapsed-summary-polish\] ok/);
  assert.match(packageJson, /scripts\/check-trading-step205-ai-ml-collapsed-summary-polish\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step204-ai-ml-admin-panel-consolidation\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step203-ai-ml-grouped-regression\.test\.cjs/);
});
