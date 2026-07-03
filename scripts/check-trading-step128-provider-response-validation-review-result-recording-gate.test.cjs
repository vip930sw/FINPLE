const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "check-trading-step128-provider-response-validation-review-result-recording-gate.cjs");

function copyFileTo(workspace, filePath) {
  const target = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step128-check-"));
  [
    "server/src/services/tradingProviderResponseValidationReviewResultGate.js",
    "server/src/services/tradingProviderResponseValidationReviewResultGate.test.js",
    "server/src/services/tradingProviderResponseEnvelopeValidationReceipt.js",
    "server/src/routes/adminTradingReadinessRoutes.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/AccountPages.jsx",
    "src/App.jsx",
    "src/components/portfolio/services/serverPortfolioService.js",
    "scripts/check-trading-step128-provider-response-validation-review-result-recording-gate.cjs",
    "scripts/check-trading-step128-provider-response-validation-review-result-recording-gate.test.cjs",
    "package.json",
  ].forEach((filePath) => copyFileTo(workspace, filePath));
  return workspace;
}

function runCheck(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: "utf8" });
}

test("passes with current Step 128 provider response validation review result recording gate", () => {
  const workspace = makeWorkspace();
  const result = runCheck(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /step128-provider-response-validation-review-result-recording-gate/);
});

test("blocks if provider response validation review UI appears in mypage source", () => {
  const workspace = makeWorkspace();
  const accountPagePath = path.join(workspace, "src", "components", "AccountPages.jsx");
  fs.appendFileSync(accountPagePath, "\n<TradingReadinessPanel providerResponseValidationReviewResultStatus />\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mypage/);
});

test("blocks if provider response validation review endpoint loses the admin guard", () => {
  const workspace = makeWorkspace();
  const routePath = path.join(workspace, "server", "src", "routes", "adminTradingReadinessRoutes.js");
  fs.writeFileSync(routePath, fs.readFileSync(routePath, "utf8").replace(/requireAdminAccess/g, "missingGuard"));
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets/);
});

test("blocks if forbidden provider response review runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  const forbiddenFile = path.join(workspace, "server", "src", "services", "trading", "providerResponseReviewRuntime.js");
  fs.mkdirSync(path.dirname(forbiddenFile), { recursive: true });
  fs.writeFileSync(forbiddenFile, "{}\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden trading artifacts present/);
});

test("blocks if readiness flags are promoted", () => {
  const workspace = makeWorkspace();
  const servicePath = path.join(workspace, "server", "src", "services", "tradingProviderResponseValidationReviewResultGate.js");
  fs.writeFileSync(
    servicePath,
    fs.readFileSync(servicePath, "utf8").replace("readyForReadOnlyProviderCalls: false", "readyForReadOnlyProviderCalls: true")
  );
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden implementation terms present/);
});
