const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-cache-dry-run.cjs");
const FIXTURE_FILES = [
  "scenario_p0_monthly_cache_manifest.csv",
  "scenario_monthly_returns.schema.csv",
  "scenario_p0_monthly_cache_dry_run.json",
];
const REQUIRED_SOURCE_METADATA = [
  "providerName",
  "providerEndpoint",
  "requestedAt",
  "rawPayloadHash",
  "licensePolicy",
  "sourceVersion",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-cache-dry-run-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runDryRun(workspace, args = ["--check"]) {
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

test("passes with current dry-run-only P0 provider tasks", () => {
  const workspace = makeWorkspace();
  const result = runDryRun(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_monthly_cache_dry_run\.json/);
});

test("summary keeps provider tasks dry-run only with source metadata required", () => {
  const workspace = makeWorkspace();
  const result = runDryRun(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const dryRun = readWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json");
  assert.equal(dryRun.rowCounts.totalTasks, 17);
  assert.equal(dryRun.rowCounts.assetTasks, 14);
  assert.equal(dryRun.rowCounts.benchmarkTasks, 2);
  assert.equal(dryRun.rowCounts.fxTasks, 1);
  assert.deepEqual(dryRun.counts.byManifestType, { asset: 14, benchmark: 2, fx: 1 });
  assert.equal(dryRun.dryRunIntegrity.providerTasksVerified, true);
  assert.equal(dryRun.dryRunIntegrity.manifestCountsVerified, true);
  assert.equal(dryRun.dryRunIntegrity.providerCallsMade, false);
  assert.deepEqual(dryRun.dryRunIntegrity.sourceMetadataRequired, REQUIRED_SOURCE_METADATA);
  assert.equal(dryRun.dryRunIntegrity.monthlyDataFileAbsent, true);
  assert.equal(dryRun.readiness.providerCallsMade, false);
  assert.equal(dryRun.readiness.monthlyDataFileWritten, false);
  assert.equal(dryRun.readiness.bootstrapStillBlocked, true);
});

test("rejects manifest count drift", () => {
  const workspace = makeWorkspace();
  const parsed = parseCsv(readWorkspaceFile(workspace, "scenario_p0_monthly_cache_manifest.csv"));
  const assetRow = parsed.rows.find((row) => row.manifestType === "asset");
  assetRow.manifestType = "fx";
  writeWorkspaceFile(workspace, "scenario_p0_monthly_cache_manifest.csv", toCsv(parsed.headers, parsed.rows));

  const result = runDryRun(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /dry-run manifest counts expected asset=14, got 13/);
});

test("rejects premature monthly data before dry-run approval", () => {
  const workspace = makeWorkspace();
  writeWorkspaceFile(workspace, "scenario_monthly_returns.csv", "month,ticker,monthlyReturn\n");

  const result = runDryRun(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before dry-run provider tasks are approved/);
});

test("rejects stale committed dry-run output", () => {
  const workspace = makeWorkspace();
  const dryRun = readWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json");
  dryRun.readiness.providerCallsMade = true;
  writeWorkspaceJson(workspace, "scenario_p0_monthly_cache_dry_run.json", dryRun);

  const result = runDryRun(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_monthly_cache_dry_run\.json is out of date/);
});
