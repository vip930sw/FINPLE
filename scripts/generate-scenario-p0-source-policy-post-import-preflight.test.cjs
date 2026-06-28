const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-source-policy-post-import-preflight.cjs");
const SOURCE_POLICY = "scenario_p0_source_policy_matrix.csv";
const IMPORT_PREFLIGHT = "scenario_p0_real_approval_import_preflight.json";
const SYNC_PLAN = "scenario_p0_source_policy_sync_plan.json";
const POST_IMPORT_PREFLIGHT = "scenario_p0_source_policy_post_import_preflight.json";
const MONTHLY = "scenario_monthly_returns.csv";
const APPROVED_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: "approved_source_policy",
  blocker: "",
};

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-source-policy-post-import-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [SOURCE_POLICY, IMPORT_PREFLIGHT, SYNC_PLAN, POST_IMPORT_PREFLIGHT]) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  return workspace;
}

function runPreflight(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeWorkspaceJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function mutateJson(workspace, fileName, patch) {
  const value = readWorkspaceJson(workspace, fileName);
  patch(value);
  writeWorkspaceJson(workspace, fileName, value);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        current += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current);
  return values;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function readWorkspaceCsv(workspace, fileName) {
  const [headerLine, ...lines] = fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8").trimEnd().split(/\r?\n/u);
  const headers = headerLine.split(",");
  const rows = lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function writeWorkspaceCsv(workspace, fileName, csv) {
  const content = `${csv.headers.join(",")}\n${csv.rows.map((row) => csv.headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`;
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), content);
}

function makePostImportReady(workspace) {
  mutateJson(workspace, IMPORT_PREFLIGHT, (value) => {
    value.checks.readyRows = 5;
    value.checks.pendingRows = 0;
    value.checks.readyForRealApprovalImport = true;
    value.checks.plannedSourcePolicyUpdates = 17;
    value.checks.blockers = [];
    value.readiness.status = "ready_for_manual_real_approval_import_review";
    value.readiness.safeToImportRealApprovalDecisions = true;
    value.readiness.sourcePolicyMatrixWriteAllowed = true;
  });
  mutateJson(workspace, SYNC_PLAN, (value) => {
    value.rowCounts.readyProviderGroups = 5;
    value.rowCounts.blockedProviderGroups = 0;
    value.rowCounts.plannedSourcePolicyUpdates = 17;
    value.rowCounts.blockedSourcePolicyRows = 0;
    value.readiness.status = "ready_for_manual_source_policy_sync_review";
    value.readiness.syncPlanReady = true;
  });
  const csv = readWorkspaceCsv(workspace, SOURCE_POLICY);
  csv.rows = csv.rows.map((row) => ({
    ...row,
    ...APPROVED_RULES,
  }));
  writeWorkspaceCsv(workspace, SOURCE_POLICY, csv);
}

test("passes with current blocked source-policy post-import preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_source_policy_post_import_preflight\.json/);
});

test("keeps current committed source-policy post-import preflight blocked", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, POST_IMPORT_PREFLIGHT);
  assert.equal(report.checks.approvedSourcePolicyRows, 0);
  assert.equal(report.checks.safeToUseImportedSourcePolicy, false);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.safeToImplementProviderAdapter, false);
  assert.equal(report.readiness.safeToWriteMonthlyData, false);
});

test("opens only after real approval import and all source-policy rows are approved", () => {
  const workspace = makeWorkspace();
  makePostImportReady(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, POST_IMPORT_PREFLIGHT);
  assert.equal(report.checks.approvedSourcePolicyRows, 17);
  assert.equal(report.checks.allSourcePolicyRowsApproved, true);
  assert.equal(report.checks.approvedRowsMatchPlan, true);
  assert.equal(report.checks.safeToUseImportedSourcePolicy, true);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.safeToImplementProviderAdapter, false);
  assert.equal(report.readiness.safeToWriteMonthlyData, false);
});

test("rejects approved source-policy rows before real approval import preflight is ready", () => {
  const workspace = makeWorkspace();
  const csv = readWorkspaceCsv(workspace, SOURCE_POLICY);
  csv.rows[0] = { ...csv.rows[0], ...APPROVED_RULES };
  writeWorkspaceCsv(workspace, SOURCE_POLICY, csv);

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /contains approved rows before real approval import preflight is ready/);
});

test("rejects approved source-policy policy drift", () => {
  const workspace = makeWorkspace();
  makePostImportReady(workspace);
  const csv = readWorkspaceCsv(workspace, SOURCE_POLICY);
  csv.rows[0].licensePolicy = "not_reviewed";
  writeWorkspaceCsv(workspace, SOURCE_POLICY, csv);

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /approved rows with policy drift/);
});

test("rejects monthly returns before source-policy post-import preflight has completed", () => {
  const workspace = makeWorkspace();
  fs.writeFileSync(path.join(workspace, "data", "processed", MONTHLY), "must not exist\n");

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before source-policy post-import preflight has completed/);
});

test("rejects stale committed source-policy post-import preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, POST_IMPORT_PREFLIGHT);
  report.checks.safeToUseImportedSourcePolicy = true;
  writeWorkspaceJson(workspace, POST_IMPORT_PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_policy_post_import_preflight\.json is out of date/);
});
