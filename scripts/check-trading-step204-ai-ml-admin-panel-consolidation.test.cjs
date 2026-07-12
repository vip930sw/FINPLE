const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");

const panel = () => fs.readFileSync("src/components/TradingReadinessPanel.jsx", "utf8");
const groupComponent = () => fs.readFileSync("src/components/TradingAiMlPanelGroup.jsx", "utf8");
const checker = () => fs.readFileSync("scripts/check-trading-step204-ai-ml-admin-panel-consolidation.cjs", "utf8");

test("Scenario A: Step204 checker passes against repository source", () => {
  const output = execFileSync(process.execPath, ["scripts/check-trading-step204-ai-ml-admin-panel-consolidation.cjs"], {
    encoding: "utf8",
  });
  assert.match(output, /\[check-trading-step204-ai-ml-admin-panel-consolidation\] ok/);
});

test("Scenario B: Step200 overview stays first and all existing panel keys are unique", () => {
  const source = panel();
  const requiredKeys = [
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
  ];
  assert.ok(source.indexOf("groupKey=\"ai-ml-milestone-overview\"") < source.indexOf("ai-ml-architecture-milestone-review"));
  assert.ok(source.indexOf("ai-ml-architecture-milestone-review") < source.indexOf("ai-ml-readiness-gate-summary"));
  for (const key of requiredKeys) {
    assert.equal(source.split(`data-admin-panel-key="${key}"`).length - 1, 1, key);
  }
});

test("Scenario C: milestone group is open while detail groups default collapsed", () => {
  const source = panel();
  const milestone = source.slice(source.indexOf("groupKey=\"ai-ml-milestone-overview\""), source.indexOf("</TradingAiMlPanelGroup>", source.indexOf("groupKey=\"ai-ml-milestone-overview\"")));
  const current = source.slice(source.indexOf("groupKey=\"ai-ml-current-gates-and-handoff\""), source.indexOf("</TradingAiMlPanelGroup>", source.indexOf("groupKey=\"ai-ml-current-gates-and-handoff\"")));
  const foundation = source.slice(source.indexOf("groupKey=\"ai-ml-architecture-foundation\""), source.indexOf("</TradingAiMlPanelGroup>", source.indexOf("groupKey=\"ai-ml-architecture-foundation\"")));
  assert.match(milestone, /defaultOpen/);
  assert.doesNotMatch(current, /defaultOpen/);
  assert.doesNotMatch(foundation, /defaultOpen/);
  assert.match(groupComponent(), /open=\{defaultOpen \? true : undefined\}/);
});

test("Scenario D: Step195 through Step199 panels are in current gates and handoff group", () => {
  const source = panel();
  const current = source.slice(source.indexOf("groupKey=\"ai-ml-current-gates-and-handoff\""), source.indexOf("</TradingAiMlPanelGroup>", source.indexOf("groupKey=\"ai-ml-current-gates-and-handoff\"")));
  for (const key of [
    "ai-ml-readiness-gate-summary",
    "ai-ml-batch-contract-review",
    "ai-ml-dataset-build-dry-run-manifest",
    "ai-ml-manifest-validation-report",
    "ai-ml-manifest-handoff-eligibility",
  ]) {
    assert.match(current, new RegExp(key));
  }
  for (const summary of ["execution blocked", "approval not granted", "materialization blocked", "handoff execution blocked", "target preflight blocked"]) {
    assert.match(source, new RegExp(summary));
  }
});

test("Scenario E: Step191 through Step194 panels are in architecture foundation group", () => {
  const source = panel();
  const foundation = source.slice(source.indexOf("groupKey=\"ai-ml-architecture-foundation\""), source.indexOf("</TradingAiMlPanelGroup>", source.indexOf("groupKey=\"ai-ml-architecture-foundation\"")));
  for (const key of [
    "ai-ml-strategy-management-console",
    "ai-ml-dataset-labeling-architecture",
    "ai-ml-feature-pipeline-architecture",
    "ai-ml-feature-pipeline-preflight",
  ]) {
    assert.match(foundation, new RegExp(key));
  }
  for (const summary of ["strategy governance", "dataset and labeling contract", "feature pipeline contract", "metadata preflight"]) {
    assert.match(source, new RegExp(summary));
  }
});

test("Scenario F: Step204 UI adds no action controls, provider calls, endpoints, or public route exposure", () => {
  const component = groupComponent();
  const app = fs.readFileSync("src/App.jsx", "utf8");
  for (const snippet of ["<button", "<input", "onClick=", "href=", "fetch(", "localStorage", "querySelector", "scrollIntoView", ".focus("]) {
    assert.doesNotMatch(component, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(app, /TradingAiMlPanelGroup/);
  assert.doesNotMatch(app, /ai-ml-current-gates-and-handoff/);
});

test("Scenario G: Step204 CSS classes and responsive rules are present", () => {
  const css = fs.readFileSync("src/App.css", "utf8");
  for (const className of [
    ".tradingAiMlConsolidatedOverview",
    ".tradingAiMlOperatingBoundary",
    ".tradingAiMlPanelGroup",
    ".tradingAiMlPanelGroupSummary",
    ".tradingAiMlPanelGroupStatus",
    ".tradingAiMlPanelGroupBody",
  ]) {
    assert.match(css, new RegExp(className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(css, /@media \(max-width: 820px\)/);
});

test("Scenario H: package script links Step204 checker and Step203 grouped regression checker test", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");
  assert.match(packageJson, /check:trading-step204-ai-ml-admin-panel-consolidation/);
  assert.match(packageJson, /scripts\/check-trading-step204-ai-ml-admin-panel-consolidation\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step203-ai-ml-grouped-regression\.test\.cjs/);
});

test("Scenario I: checker covers duplicate keys, native details, warnings, and service boundary", () => {
  const source = checker();
  for (const snippet of [
    "panel key must appear exactly once",
    "native details",
    "native summary",
    "REQUIRED_WARNING_TEXT",
    "UNTOUCHED_SERVICE_FILES",
    "FORBIDDEN_RUNTIME_SNIPPETS",
  ]) {
    assert.match(source, new RegExp(snippet));
  }
});
