const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_FILES = [
  "package.json",
  "src/components/TradingAiMlPanelGroup.jsx",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/check-trading-step205-ai-ml-collapsed-summary-polish.cjs",
  "scripts/check-trading-step205-ai-ml-collapsed-summary-polish.test.cjs",
];

const PANEL_KEYS = [
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

const GROUP_KEYS = [
  "ai-ml-milestone-overview",
  "ai-ml-current-gates-and-handoff",
  "ai-ml-architecture-foundation",
];

const REQUIRED_SUMMARY_CLASSES = [
  ".tradingAiMlPanelGroupSummaryContent",
  ".tradingAiMlPanelGroupSummaryPreview",
  ".tradingAiMlPanelGroupSummaryPreviewItem",
  ".tradingAiMlPanelGroupSummaryPreviewItem--blocked",
  ".tradingAiMlPanelGroupSummaryPreviewItem--review",
  ".tradingAiMlPanelGroupSummaryPreviewItem--external",
];

const MILESTONE_PREVIEW_SNIPPETS = [
  "{ label: \"Architecture\", value: labAiMlArchitectureMilestone.architectureChainStatus || \"contract_chain_complete\", tone: \"neutral\" }",
  "{ label: \"Runtime\", value: labAiMlArchitectureMilestone.runtimeCapabilityStatus || \"not_implemented\", tone: \"blocked\" }",
  "{ label: \"Execution\", value: labAiMlArchitectureMilestone.executionReadinessStatus || \"blocked\", tone: \"blocked\" }",
  "{ label: \"Next phase\", value: labAiMlArchitectureMilestone.nextPhaseDecision || \"consolidate_before_runtime\", tone: \"review\" }",
];

const CURRENT_GATES_PREVIEW_SNIPPETS = [
  "{ label: \"Execution\", value: labAiMlReadinessGateSummary.executionPermissionStatus || \"blocked\", tone: \"blocked\" }",
  "{ label: \"Approval\", value: labAiMlBatchContractReview.approvalStatus || labAiMlManifestHandoffEligibility.handoffApprovalStatus || \"not_granted\", tone: \"review\" }",
  "{ label: \"Materialization\", value: labAiMlDatasetBuildDryRunManifest.materializationStatus || labAiMlManifestValidationReport.boundaryConfirmation?.materializationStatus || \"blocked\", tone: \"blocked\" }",
  "{ label: \"Target preflight\", value: labAiMlManifestHandoffEligibility.targetPreflightExecutionStatus || \"blocked\", tone: \"blocked\" }",
  "{ label: \"External authority\", value: labAiMlManifestHandoffEligibility.externalAuthorityContext?.externalAuthorityStatus || labAiMlManifestValidationReport.externalAuthorityContext?.externalAuthorityStatus || labAiMlReadinessGateSummary.orderAuthorityStatus || \"external_blocker\", tone: \"external\" }",
];

const FOUNDATION_PREVIEW_SNIPPETS = [
  "{ label: \"Stages\", value: \"4\", tone: \"neutral\" }",
  "{ label: \"Scope\", value: \"metadata architecture\", tone: \"neutral\" }",
  "{ label: \"Preflight\", value: \"contract only\", tone: \"review\" }",
  "{ label: \"Execution\", value: \"blocked\", tone: \"blocked\" }",
];

const FORBIDDEN_COMPONENT_SNIPPETS = [
  "<button",
  "<input",
  "<select",
  "<textarea",
  "href=",
  "onClick=",
  "useState",
  "useEffect",
  "localStorage",
  "sessionStorage",
  "querySelector",
  "scrollIntoView",
  ".focus(",
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

const SERVICE_FILES = [
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
  assert(end > start, `${label} end missing: ${endSnippet}`);
  return source.slice(start, end + endSnippet.length);
}

for (const file of REQUIRED_FILES) {
  assert(fs.existsSync(file), `missing required file: ${file}`);
}

const packageJson = read("package.json");
const component = read("src/components/TradingAiMlPanelGroup.jsx");
const panel = read("src/components/TradingReadinessPanel.jsx");
const css = read("src/App.css");

assertIncludes(packageJson, "\"check:trading-step205-ai-ml-collapsed-summary-polish\"", "package script");
assertIncludes(packageJson, "scripts/check-trading-step205-ai-ml-collapsed-summary-polish.test.cjs", "Step205 checker test link");
assertIncludes(packageJson, "scripts/check-trading-step204-ai-ml-admin-panel-consolidation.test.cjs", "Step204 checker test link");
assertIncludes(packageJson, "scripts/check-trading-step203-ai-ml-grouped-regression.test.cjs", "Step203 checker test link");

assertIncludes(component, "summaryItems = []", "summaryItems prop");
assertIncludes(component, "summaryItems.slice(0, 5)", "summary item limit");
assertIncludes(component, "tone: [\"blocked\", \"review\", \"external\"].includes(item.tone) ? item.tone : \"neutral\"", "tone fallback");
assertIncludes(component, "<details", "native details");
assertIncludes(component, "<summary", "native summary");
assertIncludes(component, "tradingAiMlPanelGroupSummaryPreview", "summary preview");
assert(component.indexOf("tradingAiMlPanelGroupSummaryPreview") > component.indexOf("<summary"), "preview must be inside summary after summary start");
assert(component.indexOf("tradingAiMlPanelGroupSummaryPreview") < component.indexOf("tradingAiMlPanelGroupBody"), "preview must be before body");

for (const snippet of FORBIDDEN_COMPONENT_SNIPPETS) {
  assert(!component.includes(snippet), `group component must not add interactive or JS state behavior: ${snippet}`);
}
for (const snippet of FORBIDDEN_RUNTIME_SNIPPETS) {
  assert(!component.includes(snippet), `group component must not add runtime behavior: ${snippet}`);
}

const milestoneGroup = sliceBetween(panel, "groupKey=\"ai-ml-milestone-overview\"", "</TradingAiMlPanelGroup>", "milestone group");
const currentGroup = sliceBetween(panel, "groupKey=\"ai-ml-current-gates-and-handoff\"", "</TradingAiMlPanelGroup>", "current gates group");
const foundationGroup = sliceBetween(panel, "groupKey=\"ai-ml-architecture-foundation\"", "</TradingAiMlPanelGroup>", "architecture foundation group");

assertIncludes(milestoneGroup, "summaryItems={labAiMlMilestoneSummaryItems}", "milestone summary prop");
assertIncludes(currentGroup, "summaryItems={labAiMlCurrentGatesSummaryItems}", "current gates summary prop");
assertIncludes(foundationGroup, "summaryItems={labAiMlArchitectureFoundationSummaryItems}", "foundation summary prop");

for (const snippet of MILESTONE_PREVIEW_SNIPPETS) assertIncludes(panel, snippet, "milestone preview item");
for (const snippet of CURRENT_GATES_PREVIEW_SNIPPETS) assertIncludes(panel, snippet, "current gates preview item");
for (const snippet of FOUNDATION_PREVIEW_SNIPPETS) assertIncludes(panel, snippet, "foundation preview item");

assertIncludes(milestoneGroup, "defaultOpen", "milestone default open");
assert(!currentGroup.includes("defaultOpen"), "current group must default collapsed");
assert(!foundationGroup.includes("defaultOpen"), "foundation group must default collapsed");

for (const key of PANEL_KEYS) {
  assert(countOccurrences(panel, `data-admin-panel-key="${key}"`) === 1, `panel key must appear exactly once: ${key}`);
}
for (const key of GROUP_KEYS) {
  assert(countOccurrences(panel, `groupKey="${key}"`) === 1, `group key must appear exactly once: ${key}`);
}

for (const className of REQUIRED_SUMMARY_CLASSES) assertIncludes(css, className, "summary CSS class");
assertIncludes(css, "pointer-events: none;", "summary preview non-interactive chips");
assertIncludes(css, "overflow-wrap: anywhere;", "long status wrapping");
assertIncludes(css, ".tradingAiMlPanelGroup[open]", "open state CSS");
assertIncludes(css, ".tradingAiMlPanelGroup:not([open])", "closed state CSS");
assertIncludes(css, "@media (max-width: 820px)", "responsive CSS");

for (const file of SERVICE_FILES) {
  const source = read(file);
  assert(!source.includes("Step205"), `Step205 must not touch service marker: ${file}`);
  assert(!source.includes("tradingAiMlPanelGroupSummaryPreview"), `Step205 UI class must not touch service source: ${file}`);
}

for (const routeDir of ["server/src/routes", "server/routes"]) {
  if (!fs.existsSync(routeDir)) continue;
  for (const entry of fs.readdirSync(routeDir)) {
    const routePath = path.join(routeDir, entry);
    if (!fs.statSync(routePath).isFile()) continue;
    const source = read(routePath);
    assert(!source.includes("Step205"), `Step205 must not add endpoint marker: ${routePath}`);
    assert(!source.includes("tradingAiMlPanelGroupSummaryPreview"), `Step205 must not expose endpoint UI marker: ${routePath}`);
  }
}

for (const file of ["src/App.jsx", "src/main.jsx"]) {
  if (!fs.existsSync(file)) continue;
  const source = read(file);
  assert(!source.includes("TradingAiMlPanelGroup"), `Step205 group component must stay out of public app shell: ${file}`);
  assert(!source.includes("tradingAiMlPanelGroupSummaryPreview"), `Step205 summary preview must stay out of public app shell: ${file}`);
}

console.log("[check-trading-step205-ai-ml-collapsed-summary-polish] ok");
