const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "verify-scenario-monthly-input.cjs");
const HEADER = [
  "market",
  "ticker",
  "month",
  "priceReturn",
  "totalReturn",
  "closePrice",
  "adjustedClose",
  "dividendAmount",
  "benchmarkId",
  "benchmarkReturn",
  "fxReturn",
  "returnBasis",
  "currency",
  "isProxy",
  "proxyTicker",
  "dataSource",
  "sourceVersion",
  "seriesQuality",
  "reasonCodes",
].join(",");

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-monthly-input-"));
  fs.mkdirSync(path.join(workspace, "data", "processed"), { recursive: true });
  fs.writeFileSync(path.join(workspace, "data", "processed", "scenario_monthly_returns.schema.csv"), `${HEADER}\n`);
  return workspace;
}

function writeData(workspace, rows) {
  fs.writeFileSync(
    path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"),
    `${HEADER}\n${rows.join("\n")}\n`,
  );
}

function runValidator(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH], {
    cwd: workspace,
    encoding: "utf8",
  });
}

test("passes with header-only schema and no monthly data file", () => {
  const workspace = makeWorkspace();
  const result = runValidator(workspace);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /data=data[\\/]+processed[\\/]+scenario_monthly_returns\.csv not present yet/);
});

test("passes valid A-grade monthly rows with required total-return and benchmark fields", () => {
  const workspace = makeWorkspace();
  writeData(workspace, [
    "US,SPY,2025-01,0.02,0.021,500,501,0.1,SP500_TR,0.018,,total_return,USD,no,,fixture,2026-06-27,A,",
    "KR,069500,2025-01,-0.01,-0.009,40000,40100,50,KOSPI200_TR,-0.012,,total_return,KRW,no,,fixture,2026-06-27,A,",
  ]);

  const result = runValidator(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /rows=2/);
});

test("rejects duplicate market ticker month rows", () => {
  const workspace = makeWorkspace();
  const row = "US,SPY,2025-01,0.02,0.021,500,501,0.1,SP500_TR,0.018,,total_return,USD,no,,fixture,2026-06-27,A,";
  writeData(workspace, [row, row]);

  const result = runValidator(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate market\/ticker\/month key: US:SPY:2025-01/);
});

test("rejects A-grade rows without benchmark return inputs", () => {
  const workspace = makeWorkspace();
  writeData(workspace, [
    "US,SPY,2025-01,0.02,0.021,500,501,0.1,SP500_TR,,,total_return,USD,no,,fixture,2026-06-27,A,",
  ]);

  const result = runValidator(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /A-grade series requires benchmarkReturn/);
});

test("rejects zero-filled missing total return fields", () => {
  const workspace = makeWorkspace();
  writeData(workspace, [
    "US,SPY,2025-01,0.02,0,500,501,0.1,SP500_TR,0.018,,price,USD,no,,fixture,2026-06-27,B,missing_totalReturn",
  ]);

  const result = runValidator(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /totalReturn is marked missing but contains 0/);
});

test("rejects schema header drift", () => {
  const workspace = makeWorkspace();
  fs.writeFileSync(
    path.join(workspace, "data", "processed", "scenario_monthly_returns.schema.csv"),
    `${HEADER.replace(",reasonCodes", "")}\n`,
  );

  const result = runValidator(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /header mismatch/);
});
