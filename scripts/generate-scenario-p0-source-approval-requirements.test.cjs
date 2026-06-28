const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-source-approval-requirements.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_cache_writer_gate.json",
  "scenario_p0_source_approval_requirements.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-source-approval-requirements-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runRequirements(workspace, args = ["--check"]) {
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

test("passes with current blocked source approval requirements", () => {
  const workspace = makeWorkspace();
  const result = runRequirements(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_source_approval_requirements\.json/);
});

test("summary keeps P0 source requirements and writer gate locked", () => {
  const workspace = makeWorkspace();
  const result = runRequirements(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const requirements = readWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json");
  assert.equal(requirements.rowCounts.totalRows, 17);
  assert.equal(requirements.rowCounts.providerGroups, 5);
  assert.deepEqual(requirements.counts.byManifestType, { asset: 14, benchmark: 2, fx: 1 });
  assert.equal(requirements.sourceIntegrity.providerGroupCountVerified, true);
  assert.equal(requirements.sourceIntegrity.sourcePolicyRowsVerified, true);
  assert.equal(requirements.sourceIntegrity.manifestCountsVerified, true);
  assert.equal(requirements.sourceIntegrity.writerGateStillBlocked, true);
  assert.equal(requirements.readiness.providerCallsAllowed, false);
  assert.equal(requirements.readiness.monthlyDataFileWritten, false);
  assert.equal(requirements.readiness.bootstrapStillBlocked, true);
});

test("rejects source policy manifest count drift", () => {
  const workspace = makeWorkspace();
  const parsed = parseCsv(readWorkspaceFile(workspace, "scenario_p0_source_policy_matrix.csv"));
  parsed.rows[0].manifestType = "asset";
  writeWorkspaceFile(workspace, "scenario_p0_source_policy_matrix.csv", toCsv(parsed.headers, parsed.rows));

  const result = runRequirements(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /source policy manifest counts expected asset=14, got 15/);
});

test("rejects writer gate opening before requirements are satisfied", () => {
  const workspace = makeWorkspace();
  const gate = readWorkspaceJson(workspace, "scenario_p0_cache_writer_gate.json");
  gate.readiness.canWriteMonthlyData = true;
  writeWorkspaceJson(workspace, "scenario_p0_cache_writer_gate.json", gate);

  const result = runRequirements(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must keep canWriteMonthlyData=false/);
});

test("rejects stale committed source approval requirements", () => {
  const workspace = makeWorkspace();
  const requirements = readWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json");
  requirements.rowCounts.approvedRows = 17;
  writeWorkspaceJson(workspace, "scenario_p0_source_approval_requirements.json", requirements);

  const result = runRequirements(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_approval_requirements\.json is out of date/);
});
