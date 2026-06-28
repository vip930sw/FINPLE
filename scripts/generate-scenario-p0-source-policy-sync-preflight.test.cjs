const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-source-policy-sync-preflight.cjs");
const SOURCE_POLICY = "scenario_p0_source_policy_matrix.csv";
const SYNC_PLAN = "scenario_p0_source_policy_sync_plan.json";
const PREFLIGHT = "scenario_p0_source_policy_sync_preflight.json";
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
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-source-policy-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of [SOURCE_POLICY, SYNC_PLAN, PREFLIGHT]) {
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

function readWorkspaceFile(workspace, fileName) {
  return fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8");
}

function writeWorkspaceFile(workspace, fileName, content) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), content);
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

function parseCsv(content) {
  const [headerLine, ...lines] = content.trimEnd().replace(/\r\n/g, "\n").split("\n");
  const headers = headerLine.split(",");
  const rows = lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function toCsv(headers, rows) {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`;
}

function mutateSourcePolicy(workspace, updateRow) {
  const parsed = parseCsv(readWorkspaceFile(workspace, SOURCE_POLICY));
  const rows = parsed.rows.map((row) => updateRow({ ...row }));
  writeWorkspaceFile(workspace, SOURCE_POLICY, toCsv(parsed.headers, rows));
}

function mutateSyncPlan(workspace, patch) {
  const plan = JSON.parse(readWorkspaceFile(workspace, SYNC_PLAN));
  patch(plan);
  writeWorkspaceFile(workspace, SYNC_PLAN, `${JSON.stringify(plan, null, 2)}\n`);
}

function makeSyncPlanReady(workspace) {
  mutateSyncPlan(workspace, (plan) => {
    plan.rowCounts.readyProviderGroups = 5;
    plan.rowCounts.blockedProviderGroups = 0;
    plan.rowCounts.plannedSourcePolicyUpdates = 17;
    plan.rowCounts.blockedSourcePolicyRows = 0;
    plan.readiness.status = "ready_for_manual_source_policy_sync_review";
    plan.readiness.syncPlanReady = true;
    plan.providerGroups = plan.providerGroups.map((row) => ({
      ...row,
      readyForSourcePolicySync: true,
      plannedSourcePolicyUpdates: row.sourcePolicyRows,
      blockers: [],
    }));
  });
}

test("passes with current source policy sync preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_source_policy_sync_preflight\.json/);
});

test("keeps current committed source policy sync preflight ready for manual source policy sync", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const preflight = JSON.parse(readWorkspaceFile(workspace, PREFLIGHT));
  assert.equal(preflight.checks.totalSourcePolicyRows, 17);
  assert.equal(preflight.checks.approvedSourcePolicyRows, 0);
  assert.equal(preflight.checks.canSyncSourcePolicy, true);
  assert.equal(preflight.readiness.status, "ready_for_manual_source_policy_sync");
  assert.equal(preflight.readiness.sourcePolicyMatrixWritten, false);
  assert.equal(preflight.readiness.providerCallsAllowed, false);
  assert.equal(preflight.readiness.monthlyDataFileWritten, false);
});

test("reports ready preflight when sync plan is complete but source policy matrix is still untouched", () => {
  const workspace = makeWorkspace();
  makeSyncPlanReady(workspace);

  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const preflight = JSON.parse(readWorkspaceFile(workspace, PREFLIGHT));
  assert.equal(preflight.checks.canSyncSourcePolicy, true);
  assert.equal(preflight.checks.approvedSourcePolicyRows, 0);
  assert.equal(preflight.readiness.status, "ready_for_manual_source_policy_sync");
  assert.equal(preflight.readiness.sourcePolicyMatrixWritten, false);
});

test("rejects approved source policy rows before sync plan is ready", () => {
  const workspace = makeWorkspace();
  mutateSyncPlan(workspace, (plan) => {
    plan.rowCounts.plannedSourcePolicyUpdates = 17;
    plan.readiness.syncPlanReady = false;
  });
  mutateSourcePolicy(workspace, (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, ...APPROVED_RULES } : row,
  );

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_policy_matrix\.csv contains approved source policy rows before sync preflight is ready/);
});

test("rejects more approved source rows than the ready sync plan allows", () => {
  const workspace = makeWorkspace();
  makeSyncPlanReady(workspace);
  mutateSyncPlan(workspace, (plan) => {
    plan.rowCounts.plannedSourcePolicyUpdates = 1;
  });
  mutateSourcePolicy(workspace, (row) => ({ ...row, ...APPROVED_RULES }));

  const result = runPreflight(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_policy_matrix\.csv contains more approved rows than the source policy sync plan allows/);
});

test("rejects stale committed source policy sync preflight", () => {
  const workspace = makeWorkspace();
  const preflight = JSON.parse(readWorkspaceFile(workspace, PREFLIGHT));
  preflight.checks.canSyncSourcePolicy = false;
  writeWorkspaceFile(workspace, PREFLIGHT, `${JSON.stringify(preflight, null, 2)}\n`);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_policy_sync_preflight\.json is out of date/);
});
