const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "src/components/TradingReadinessPanel.jsx",
  "src/components/TradingAiMlPanelGroup.jsx",
  "src/App.css",
  "scripts/check-trading-step204-ai-ml-admin-panel-consolidation.cjs",
  "scripts/check-trading-step204-ai-ml-admin-panel-consolidation.test.cjs",
];

const REQUIRED_PANEL_KEYS = [
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

const CURRENT_GATE_KEYS = [
  "ai-ml-readiness-gate-summary",
  "ai-ml-batch-contract-review",
  "ai-ml-dataset-build-dry-run-manifest",
  "ai-ml-manifest-validation-report",
  "ai-ml-manifest-handoff-eligibility",
];

const FOUNDATION_KEYS = [
  "ai-ml-strategy-management-console",
  "ai-ml-dataset-labeling-architecture",
  "ai-ml-feature-pipeline-architecture",
  "ai-ml-feature-pipeline-preflight",
];

const REQUIRED_GROUP_KEYS = [
  "ai-ml-current-gates-and-handoff",
  "ai-ml-architecture-foundation",
];

const REQUIRED_STEP204_CLASSES = [
  ".tradingAiMlConsolidatedOverview",
  ".tradingAiMlOperatingBoundary",
  ".tradingAiMlPanelGroup",
  ".tradingAiMlPanelGroupSummary",
  ".tradingAiMlPanelGroupStatus",
  ".tradingAiMlPanelGroupBody",
];

const REQUIRED_OVERVIEW_TEXT = [
  "contract and metadata only",
  "Current capability",
  "Current execution",
  "Current external authority",
  "Current next safe step",
  "consolidation before runtime",
];

const REQUIRED_CURRENT_GATE_SUMMARY = [
  "execution blocked",
  "approval not granted",
  "materialization blocked",
  "handoff execution blocked",
  "target preflight blocked",
];

const REQUIRED_FOUNDATION_SUMMARY = [
  "strategy governance",
  "dataset and labeling contract",
  "feature pipeline contract",
  "metadata preflight",
];

const REQUIRED_WARNING_TEXT = [
  "architecture contract milestone only",
  "runtime is not implemented",
  "actual data access remains blocked",
  "feature and dataset execution remain blocked",
  "training and deployment remain blocked",
  "provider/KIS/order remain blocked",
  "consolidation required before runtime",
  "admin-only visibility",
];

const REQUIRED_CONTENT_MARKERS = [
  "AI/ML architecture milestone review",
  "AI/ML readiness gate summary",
  "AI/ML batch contract review",
  "AI/ML dataset build dry-run manifest",
  "AI/ML manifest validation report",
  "AI/ML manifest handoff eligibility",
  "AI/ML strategy management console",
  "AI/ML dataset and labeling architecture",
  "AI/ML feature pipeline architecture",
  "AI/ML feature pipeline preflight",
];

const FORBIDDEN_INTERACTIVE_SNIPPETS = [
  "<button",
  "<input",
  "<select",
  "<textarea",
  "role=\"button\"",
  "onClick=",
  "href=",
];

const FORBIDDEN_DOM_STATE_SNIPPETS = [
  "localStorage",
  "sessionStorage",
  "querySelector",
  "scrollIntoView",
  ".focus(",
  "useEffect",
  "useState",
];

const FORBIDDEN_RUNTIME_SNIPPETS = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "writeFile",
  "appendFile",
  "mkdir",
  "createWriteStream",
  "child_process",
  "spawn(",
  "exec(",
  "python.exe",
  "pandas",
  "numpy",
  "torch",
  "tensorflow",
  "xgboost",
  "lightgbm",
];

const FORBIDDEN_SCOPE_FILES = [
  "src/App.jsx",
  "src/main.jsx",
];

const UNTOUCHED_SERVICE_FILES = [
  "server/src/services/tradingAdminLabDashboardShell.js",
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function countOccurrences(source, snippet) {
  return source.split(snippet).length - 1;
}

function sliceBetween(source, startSnippet, endSnippet, label) {
  const start = source.indexOf(startSnippet);
  assert(start >= 0, `${label} start missing: ${startSnippet}`);
  const end = source.indexOf(endSnippet, start);
  assert(end > start, `${label} end missing after ${startSnippet}: ${endSnippet}`);
  return source.slice(start, end + endSnippet.length);
}

function indexOfRequired(source, snippet, label) {
  const index = source.indexOf(snippet);
  assert(index >= 0, `${label} missing: ${snippet}`);
  return index;
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const panel = read("src/components/TradingReadinessPanel.jsx");
const groupComponent = read("src/components/TradingAiMlPanelGroup.jsx");
const css = read("src/App.css");

assertIncludes(packageJson, "\"check:trading-step204-ai-ml-admin-panel-consolidation\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step204-ai-ml-admin-panel-consolidation.test.cjs", "Step204 checker test link");
assertIncludes(packageJson, "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs", "Step203 grouped regression checker test link");

assertIncludes(panel, "import TradingAiMlPanelGroup from \"./TradingAiMlPanelGroup\";", "TradingReadinessPanel import");
assertIncludes(groupComponent, "function TradingAiMlPanelGroup", "group component");
assertIncludes(groupComponent, "groupKey", "group component prop");
assertIncludes(groupComponent, "statusItems", "group component prop");
assertIncludes(groupComponent, "<details", "native details");
assertIncludes(groupComponent, "<summary", "native summary");
assertIncludes(groupComponent, "open={defaultOpen ? true : undefined}", "defaultOpen binding");

const milestoneGroup = sliceBetween(panel, "groupKey=\"ai-ml-milestone-overview\"", "</TradingAiMlPanelGroup>", "milestone group");
const currentGatesGroup = sliceBetween(panel, "groupKey=\"ai-ml-current-gates-and-handoff\"", "</TradingAiMlPanelGroup>", "current gates group");
const foundationGroup = sliceBetween(panel, "groupKey=\"ai-ml-architecture-foundation\"", "</TradingAiMlPanelGroup>", "architecture foundation group");
const aiMlPanelSection = panel.slice(panel.indexOf("groupKey=\"ai-ml-milestone-overview\""), panel.indexOf("</TradingAiMlPanelGroup>", panel.indexOf("groupKey=\"ai-ml-architecture-foundation\"")) + "</TradingAiMlPanelGroup>".length);

assert(indexOfRequired(panel, "groupKey=\"ai-ml-milestone-overview\"", "milestone group order") < indexOfRequired(panel, "data-admin-panel-key=\"ai-ml-architecture-milestone-review\"", "milestone panel order"), "Step200 overview must appear before Step200 panel");
assert(indexOfRequired(panel, "data-admin-panel-key=\"ai-ml-architecture-milestone-review\"", "Step200 panel order") < indexOfRequired(panel, "data-admin-panel-key=\"ai-ml-readiness-gate-summary\"", "Step195 panel order"), "Step200 panel must remain first AI/ML panel");

assertIncludes(milestoneGroup, "defaultOpen", "milestone group default open");
assert(!currentGatesGroup.includes("defaultOpen"), "current gates group must default collapsed");
assert(!foundationGroup.includes("defaultOpen"), "architecture foundation group must default collapsed");

for (const key of REQUIRED_PANEL_KEYS) {
  const marker = `data-admin-panel-key="${key}"`;
  assert(countOccurrences(panel, marker) === 1, `panel key must appear exactly once: ${key}`);
}
assert(new Set(REQUIRED_PANEL_KEYS).size === REQUIRED_PANEL_KEYS.length, "panel key list must not contain duplicates");

for (const key of REQUIRED_GROUP_KEYS) {
  assert(countOccurrences(panel, `groupKey="${key}"`) === 1, `group key must appear exactly once: ${key}`);
}
assertIncludes(panel, "groupKey=\"ai-ml-milestone-overview\"", "milestone overview group key");

for (const key of CURRENT_GATE_KEYS) {
  assertIncludes(currentGatesGroup, `data-admin-panel-key="${key}"`, "current gates group panel key");
}
for (const key of FOUNDATION_KEYS) {
  assertIncludes(foundationGroup, `data-admin-panel-key="${key}"`, "architecture foundation group panel key");
}
assert(!currentGatesGroup.includes("ai-ml-strategy-management-console"), "current gates group must not include Step191 panel");
assert(!foundationGroup.includes("ai-ml-readiness-gate-summary"), "architecture foundation group must not include Step195 panel");

for (const snippet of REQUIRED_OVERVIEW_TEXT) assertIncludes(panel, snippet, "operating boundary overview");
for (const snippet of REQUIRED_CURRENT_GATE_SUMMARY) assertIncludes(panel, snippet, "current gate summary");
for (const snippet of REQUIRED_FOUNDATION_SUMMARY) assertIncludes(panel, snippet, "architecture foundation summary");
for (const snippet of REQUIRED_WARNING_TEXT) assertIncludes(panel, snippet, "warning text");
for (const snippet of REQUIRED_CONTENT_MARKERS) assertIncludes(panel, snippet, "existing AI/ML content marker");

for (const snippet of FORBIDDEN_INTERACTIVE_SNIPPETS) {
  assert(!aiMlPanelSection.includes(snippet), `AI/ML consolidated section must not add action controls: ${snippet}`);
  assert(!groupComponent.includes(snippet), `group component must not add action controls: ${snippet}`);
}
for (const snippet of FORBIDDEN_DOM_STATE_SNIPPETS) {
  assert(!groupComponent.includes(snippet), `group component must not manipulate DOM state: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_SNIPPETS) {
  assert(!groupComponent.includes(snippet), `group component must not add runtime code: ${snippet}`);
}

for (const file of FORBIDDEN_SCOPE_FILES) {
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  assert(!source.includes("TradingAiMlPanelGroup"), `Step204 group component must stay off public route file: ${file}`);
  for (const key of REQUIRED_GROUP_KEYS) {
    assert(!source.includes(key), `Step204 group key must stay off public route file ${file}: ${key}`);
  }
}

for (const file of UNTOUCHED_SERVICE_FILES) {
  const source = read(file);
  assert(!source.includes("Step204"), `Step204 must not touch service marker: ${file}`);
  assert(!source.includes("ai-ml-current-gates-and-handoff"), `Step204 UI group must not touch service source: ${file}`);
  assert(!source.includes("tradingAiMlConsolidatedOverview"), `Step204 CSS/UI marker must not touch service source: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  const routeFiles = fs.readdirSync(routeDir).map((file) => path.join(routeDir, file));
  for (const routeFile of routeFiles) {
    const source = read(routeFile);
    assert(!source.includes("Step204"), `Step204 must not add endpoint marker: ${routeFile}`);
    assert(!source.includes("ai-ml-current-gates-and-handoff"), `Step204 must not expose endpoint group key: ${routeFile}`);
  }
}

for (const snippet of REQUIRED_STEP204_CLASSES) assertIncludes(css, snippet, "Step204 CSS class");
assertIncludes(css, "@media (max-width: 820px)", "Step204 responsive CSS");
assertIncludes(css, "grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));", "Step204 responsive grid");

const duplicatePanelKeys = REQUIRED_PANEL_KEYS.filter((key) => countOccurrences(panel, `data-admin-panel-key="${key}"`) !== 1);
assert(duplicatePanelKeys.length === 0, `duplicate or missing panel keys: ${duplicatePanelKeys.join(", ")}`);

console.log("[check-trading-step204-ai-ml-admin-panel-consolidation] ok");
