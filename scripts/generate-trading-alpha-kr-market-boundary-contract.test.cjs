const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-alpha-kr-market-boundary-contract.cjs");
const CONTRACT = "trading_lab_step116_alpha_kr_market_boundary_contract.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const FIXTURE_FILES = [
  "trading_lab_step116_progress_summary.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
  CONTRACT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-alpha-kr-market-boundary-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  for (const filePath of [
    path.join("server", "src", "services", "assetDataProvider.js"),
    path.join("server", "src", "index.js"),
    DOC_PATH,
  ]) {
    const target = path.join(workspace, filePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(filePath, target);
  }
  return workspace;
}

function runContract(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current Alpha KR market boundary contract", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_alpha_kr_market_boundary_contract\.json/);
});

test("records that Alpha asset proxy cannot unlock KR trading provider calls", () => {
  const workspace = makeWorkspace();
  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureAlphaKrMarketBoundaryReview, true);
  assert.equal(report.currentState.alphaKrStockCallValidationAllowedNow, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.alphaKrMarketBoundary.currentFinpleAssetProxyObservation.assetProxyIsTradingProvider, false);
  assert.equal(
    report.alphaKrMarketBoundary.currentFinpleAssetProxyObservation.assetProxySupportedTickersAreTradingAllowlist,
    false,
  );
  assert.match(
    report.alphaKrMarketBoundary.requiredBoundaryAssertions.join("|"),
    /alpha_vantage_korean_symbol_support_is_not_assumed/,
  );
  assert.match(report.alphaKrMarketBoundary.blockedShortcuts.join("|"), /using_alpha_symbol_search_to_unblock_kr_trading/);
});

test("rejects stale contract when provider calls are manually enabled", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.alphaKrStockCallValidationAllowedNow = true;
  report.readiness.providerCallsAllowed = true;
  writeJson(workspace, CONTRACT, report);

  const result = runContract(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_alpha_kr_market_boundary_contract\.json is out of date/);
});

test("blocks readiness if endpoint allowlist starts recording provider-specific paths", () => {
  const workspace = makeWorkspace();
  const allowlist = readJson(workspace, "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json");
  allowlist.currentState.providerSpecificEndpointPathsRecordedNow = true;
  allowlist.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json", allowlist);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureAlphaKrMarketBoundaryReview, false);
  assert.match(report.readiness.blockers.join("|"), /endpoint_allowlist_not_provider_agnostic/);
});

test("blocks readiness if asset provider no longer separates KIS and Alpha paths", () => {
  const workspace = makeWorkspace();
  const providerPath = path.join(workspace, "server", "src", "services", "assetDataProvider.js");
  const provider = fs.readFileSync(providerPath, "utf8").replace(
    'if (provider === "alpha_vantage")',
    'if (provider === "alpha_kr_trading")',
  );
  fs.writeFileSync(providerPath, provider);

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureAlphaKrMarketBoundaryReview, false);
  assert.match(report.readiness.blockers.join("|"), /asset_data_provider_no_longer_separates_kis_alpha/);
});

test("blocks if a premature Alpha trading provider runtime artifact appears", () => {
  const workspace = makeWorkspace();
  const artifact = path.join(workspace, "server", "src", "services", "trading", "alphaKrMarketProvider.js");
  fs.mkdirSync(path.dirname(artifact), { recursive: true });
  fs.writeFileSync(artifact, "module.exports = {};\n");

  const result = runContract(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.readiness.readyForFutureAlphaKrMarketBoundaryReview, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});
