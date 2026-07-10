const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "check-trading-step129-provider-call-cache-rate-limit-audit-policy-core.cjs");

function copyFileTo(workspace, filePath) {
  const target = path.join(workspace, filePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step129-check-"));
  [
    "server/src/services/tradingProviderCallPolicyCore.js",
    "server/src/services/tradingProviderCallPolicyCore.test.js",
    "server/src/routes/adminTradingReadinessRoutes.js",
    "server/src/routes/adminTradingReadinessRoutes.test.js",
    "src/components/TradingReadinessPanel.jsx",
    "src/components/AccountPages.jsx",
    "src/App.jsx",
    "src/components/portfolio/services/serverPortfolioService.js",
    "scripts/check-trading-step129-provider-call-cache-rate-limit-audit-policy-core.cjs",
    "scripts/check-trading-step129-provider-call-cache-rate-limit-audit-policy-core.test.cjs",
    "package.json",
  ].forEach((filePath) => copyFileTo(workspace, filePath));
  return workspace;
}

function runCheck(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], { cwd: workspace, encoding: "utf8", timeout: 30000 });
}

test("passes with current Step 129 provider-call cache rate-limit audit policy core", () => {
  const workspace = makeWorkspace();
  const result = runCheck(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /step129-provider-call-cache-rate-limit-audit-policy-core/);
});

test("blocks if provider-call policy UI appears in mypage source", () => {
  const workspace = makeWorkspace();
  const accountPagePath = path.join(workspace, "src", "components", "AccountPages.jsx");
  fs.appendFileSync(accountPagePath, "\n<TradingReadinessPanel providerCallPolicyStatus />\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /mypage/);
});

test("blocks if provider-call policy endpoint loses the admin guard", () => {
  const workspace = makeWorkspace();
  const routePath = path.join(workspace, "server", "src", "routes", "adminTradingReadinessRoutes.js");
  fs.writeFileSync(routePath, fs.readFileSync(routePath, "utf8").replace(/requireAdminAccess/g, "missingGuard"));
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets/);
});

test("blocks if forbidden provider-call runtime artifacts appear", () => {
  const workspace = makeWorkspace();
  const forbiddenFile = path.join(workspace, "server", "src", "services", "trading", "providerCallRuntime.js");
  fs.mkdirSync(path.dirname(forbiddenFile), { recursive: true });
  fs.writeFileSync(forbiddenFile, "{}\n");
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /forbidden trading artifacts present/);
});

test("blocks if provider-call or readiness flags are promoted", () => {
  const workspace = makeWorkspace();
  const servicePath = path.join(workspace, "server", "src", "services", "tradingProviderCallPolicyCore.js");
  fs.writeFileSync(
    servicePath,
    fs.readFileSync(servicePath, "utf8").replace("providerCallsAllowed: false", "providerCallsAllowed: true")
  );
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets|forbidden implementation terms present/);
});

test("blocks if policy core starts writing cache or audit DB state", () => {
  const workspace = makeWorkspace();
  const servicePath = path.join(workspace, "server", "src", "services", "tradingProviderCallPolicyCore.js");
  fs.writeFileSync(
    servicePath,
    fs.readFileSync(servicePath, "utf8").replace("auditDbWriteUsed: false", "auditDbWriteUsed: true")
  );
  const result = runCheck(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing required snippets|forbidden implementation terms present/);
});
