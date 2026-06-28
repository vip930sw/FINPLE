const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-cache-writer-gate.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_source_policy_matrix_summary.json",
  "scenario_p0_cache_writer_gate.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-cache-writer-gate-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runGate(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readWorkspaceFile(workspace, fileName) {
  return fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8");
}

function writeWorkspaceFile(workspace, fileName, content) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), content);
}

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(readWorkspaceFile(workspace, fileName));
}

function writeWorkspaceJson(workspace, fileName, value) {
  writeWorkspaceFile(workspace, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

function parseCsv(content) {
  const [headerLine, ...lines] = content.trimEnd().replace(/\r\n/g, "\n").split("\n");
  const headers = headerLine.split(",");
  const rows = lines.filter(Boolean).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function toCsv(headers, rows) {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => row[header] ?? "").join(",")).join("\n")}\n`;
}

test("passes with current blocked P0 cache writer gate", () => {
  const workspace = makeWorkspace();
  const result = runGate(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_cache_writer_gate\.json/);
});

test("summary keeps writer gate locked before source policy approval", () => {
  const workspace = makeWorkspace();
  const result = runGate(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const gate = readWorkspaceJson(workspace, "scenario_p0_cache_writer_gate.json");
  assert.equal(gate.rowCounts.totalRows, 17);
  assert.equal(gate.rowCounts.approvedRows, 0);
  assert.equal(gate.rowCounts.blockedRows, 17);
  assert.deepEqual(gate.counts.byManifestType, { asset: 14, benchmark: 2, fx: 1 });
  assert.equal(gate.gateIntegrity.expectedSourcePolicyRows, 17);
  assert.equal(gate.gateIntegrity.sourcePolicyRowsVerified, true);
  assert.equal(gate.gateIntegrity.manifestCountsVerified, true);
  assert.equal(gate.gateIntegrity.monthlyDataFileAbsentBeforeApproval, true);
  assert.equal(gate.readiness.canWriteMonthlyData, false);
  assert.equal(gate.readiness.providerCallsAllowed, false);
  assert.equal(gate.readiness.monthlyDataFileWritten, false);
  assert.equal(gate.readiness.bootstrapStillBlocked, true);
});

test("rejects source policy manifest count drift", () => {
  const workspace = makeWorkspace();
  const parsed = parseCsv(readWorkspaceFile(workspace, "scenario_p0_source_policy_matrix.csv"));
  parsed.rows[0].manifestType = "asset";
  writeWorkspaceFile(workspace, "scenario_p0_source_policy_matrix.csv", toCsv(parsed.headers, parsed.rows));

  const result = runGate(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /source policy manifest counts expected asset=14, got 15/);
});

test("rejects premature monthly data before P0 source approval", () => {
  const workspace = makeWorkspace();
  writeWorkspaceFile(workspace, "scenario_monthly_returns.csv", "month,ticker,monthlyReturn\n");

  const result = runGate(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before P0 source policy approval is complete/);
});

test("rejects stale committed writer gate", () => {
  const workspace = makeWorkspace();
  const gate = readWorkspaceJson(workspace, "scenario_p0_cache_writer_gate.json");
  gate.readiness.canWriteMonthlyData = true;
  writeWorkspaceJson(workspace, "scenario_p0_cache_writer_gate.json", gate);

  const result = runGate(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_cache_writer_gate\.json is out of date/);
});
