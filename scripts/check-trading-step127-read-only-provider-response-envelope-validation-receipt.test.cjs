const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "check-trading-step127-read-only-provider-response-envelope-validation-receipt.cjs");

function copyFileTo(workspace, filePath) {
  const target = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step127-check-"));
  [
    "server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js",
    "server/src/services/tradingProviderResponseEnvelopeValidationReceipt.test.js",
    "server/src/routes/adminTradingReadinessRoutes.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/AccountPages.jsx",
    "src/App.jsx",
    "src/components/portfolio/services/serverPortfolioService.js",
    "scripts/check-trading-step127-read-only-provider-response-envelope-validation-receipt.cjs",
    "scripts/check-trading-step127-read-only-provider-response-envelope-validation-receipt.test.cjs",
    "package.json",
  ].forEach((filePath) => copyFileTo(workspace, filePath));
  return workspace;
}

function runCheck(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: "utf8" });
}

test("passes with current Step 127 provider response envelope validation receipt core", () => {
  const workspace = makeWorkspace();
  const result = runCheck(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /step127-read-only-provider-response-envelope-validation-receipt/);
});

test("blocks if provider response validation UI appears in mypage source", () => {
  const workspace = makeWorkspace();
  const accountPagePath = path.join(workspace, "src", "components", "AccountPages.jsx");
  fs.appendFileSync(accountPagePath, "\n<TradingReadinessPanel providerResponseEnvelopeValidationStatus />\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mypage/);
});

test("blocks if provider response validation endpoint loses the admin guard", () => {
  const workspace = makeWorkspace();
  const routePath = path.join(workspace, "server", "src", "routes", "adminTradingReadinessRoutes.js");
  fs.writeFileSync(routePath, fs.readFileSync(routePath, "utf8").replace(/requireAdminAccess/g, "missingGuard"));
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets/);
});

test("blocks if forbidden provider response runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  const forbiddenFile = path.join(workspace, "server", "src", "services", "trading", "kisQuoteAdapter.js");
  fs.mkdirSync(path.dirname(forbiddenFile), { recursive: true });
  fs.writeFileSync(forbiddenFile, "{}\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden trading artifacts present/);
});
