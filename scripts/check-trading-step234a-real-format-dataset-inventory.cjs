const { execFileSync } = require("node:child_process");
const fs = require("node:fs");

const STEP234A_SCRIPT = "check:trading-step234a-real-format-dataset-inventory";
const STEP234A_DOC = "docs/trading-ai-ml/FINPLE_STEP234A_REAL_FORMAT_DATASET_INVENTORY.md";
const STEP234A_CHECKER = "scripts/check-trading-step234a-real-format-dataset-inventory.cjs";
const STEP234A_CHECKER_TEST = "scripts/check-trading-step234a-real-format-dataset-inventory.test.cjs";

const REQUIRED_FILES = [
  "package.json",
  STEP234A_DOC,
  STEP234A_CHECKER,
  STEP234A_CHECKER_TEST,
  "src/data/tickers/us_screener_candidates.sample.csv",
  "src/data/tickers/kr_screener_candidates.sample.csv",
  "src/data/tickers/us_screener_candidates.csv",
  "src/data/tickers/kr_screener_candidates.csv",
  "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv",
  "data/processed/finple_app_candidates_6000_balanced_v1.csv",
  "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv",
  "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv",
  "src/data/tickers/us_dividend_overlay_20260527.csv",
  "src/data/tickers/kr_stock_dividend_overlay_20260525.csv",
  "src/data/tickers/kr_etf_dividend_overlay_20260525.csv",
  "data/processed/scenario_data_coverage.csv",
  "data/processed/scenario_monthly_returns.schema.csv",
  "data/processed/scenario_monthly_refetch_plan.csv",
  "data/processed/scenario_p0_source_policy_matrix.csv",
];

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP234A_DOC,
  STEP234A_CHECKER,
  STEP234A_CHECKER_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  ".github/workflows/trading-offline-data-quality-report.yml",
  "scripts/report-trading-offline-data-quality-ci.cjs",
  "scripts/check-trading-step233-non-blocking-data-quality-ci-report.cjs",
  "server/src/services/tradingAiMlDatasetQualityProfile.js",
  "server/src/services/tradingAiMlDatasetQualityBatchSummary.js",
  "server/src/services/tradingAiMlDatasetQualityGate.js",
  "server/src/services/tradingAiMlDatasetQualityGateReadiness.js",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "server/src/index.js",
  "server/db/migrations",
];

const EXPECTED_LINE_COUNTS = Object.freeze({
  "src/data/tickers/us_screener_candidates.sample.csv": 6,
  "src/data/tickers/kr_screener_candidates.sample.csv": 6,
  "src/data/tickers/us_screener_candidates.csv": 41,
  "src/data/tickers/kr_screener_candidates.csv": 88,
  "src/data/tickers/finple_app_candidates_6000_balanced_v1.csv": 6001,
  "data/processed/finple_app_candidates_6000_balanced_v1.csv": 6001,
  "src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv": 2974,
  "src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv": 2669,
  "src/data/tickers/us_dividend_overlay_20260527.csv": 3001,
  "src/data/tickers/kr_stock_dividend_overlay_20260525.csv": 1247,
  "src/data/tickers/kr_etf_dividend_overlay_20260525.csv": 923,
  "data/processed/scenario_data_coverage.csv": 6001,
  "data/processed/scenario_monthly_returns.schema.csv": 1,
  "data/processed/scenario_monthly_refetch_plan.csv": 6004,
  "data/processed/scenario_p0_source_policy_matrix.csv": 18,
});

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function assertNotIncludes(source, snippet, label) {
  assert(!source.includes(snippet), `${label} must not include: ${snippet}`);
}

function lineCount(filePath) {
  return read(filePath).split(/\r?\n/).filter((line, index, lines) => line.length > 0 || index < lines.length - 1).length;
}

function getStatus() {
  return execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .sort();
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  return [...new Set([...tracked, ...getStatus()])].map((file) => file.replace(/\\/g, "/")).sort();
}

function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const doc = read(STEP234A_DOC);
  const checker = read(STEP234A_CHECKER);

  assertIncludes(packageJson, `"${STEP234A_SCRIPT}"`, "package Step234A script");
  assertIncludes(packageJson, STEP234A_CHECKER, "package Step234A checker");
  assertIncludes(packageJson, STEP234A_CHECKER_TEST, "package Step234A checker test");

  for (const [file, expected] of Object.entries(EXPECTED_LINE_COUNTS)) {
    assert(lineCount(file) === expected, `line count changed for ${file}`);
  }

  for (const snippet of [
    "Step234A audits repository-local, static, non-sensitive data",
    "eligible_for_sanitized_dry_run",
    "requires_adapter",
    "requires_manual_review",
    "prohibited",
    "src/data/tickers/us_screener_candidates.sample.csv",
    "src/data/tickers/kr_screener_candidates.sample.csv",
    "data/processed/scenario_data_coverage.csv",
    "data/processed/scenario_monthly_returns.schema.csv",
    "data/processed/scenario_monthly_refetch_plan.csv",
    "data/processed/scenario_p0_source_policy_matrix.csv",
    "No real provider, KIS, yfinance, API, token, DB, or order call.",
    "No Step192 runtime, Step225 manifest, Step228 snapshot, Step229 through Step233 schema",
    "10 total source rows before adapter materialization",
    "6 train / 2 validation / 2 test after deterministic adapter split",
    "actualLiveTradingReady = false",
    "state = blocked",
  ]) {
    assertIncludes(doc, snippet, "Step234A inventory doc");
  }

  for (const snippet of [
    "| `eligible_for_sanitized_dry_run` | 2 |",
    "| `requires_adapter` | 2 |",
    "| `requires_manual_review` | 6 |",
    "| `prohibited` | 4 |",
    "US screener sample",
    "KR screener sample",
    "Monthly refetch plan",
    "Source policy matrix",
  ]) {
    assertIncludes(doc, snippet, "Step234A classification summary");
  }

  for (const forbidden of [
    "fet" + "ch(",
    "axi" + "os",
    "create" + "Client(",
    "supabase" + ".from(",
    "write" + "File",
    "append" + "File",
    "create" + "Write" + "Stream",
    "yfinance" + ".download",
    "kis" + "Token" + "Client",
    "kis" + "Quote" + "Adapter",
    "kis" + "Order" + "Adapter",
    "order" + "Submission" + "Allowed=true",
    "actual" + "Live" + "Trading" + "Ready=true",
  ]) {
    assertNotIncludes(checker, forbidden, "Step234A checker source");
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step234A touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.some((touched) => touched === file || touched.startsWith(`${file}/`)), `forbidden Step234A touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step234A checker modified the working tree");

  console.log("[check-trading-step234a-real-format-dataset-inventory] ok");
  console.log(JSON.stringify({
    inventoryPath: STEP234A_DOC,
    statusCounts: {
      eligible_for_sanitized_dry_run: 2,
      requires_adapter: 2,
      requires_manual_review: 6,
      prohibited: 4,
    },
    recommendedStep234BInputRows: 10,
    recommendedStep234BSplit: {
      train: 6,
      validation: 2,
      test: 2,
    },
    readiness: {
      actualLiveTradingReady: false,
      state: "blocked",
    },
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
