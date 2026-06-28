const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-source-policy-sync-plan.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_approval_intake_template.csv",
  "scenario_p0_approval_intake_validation.json",
  "scenario_p0_source_policy_sync_plan.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-source-policy-sync-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runPlan(workspace, args = ["--check"]) {
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

function updateTemplate(workspace, updateRow) {
  const parsed = parseCsv(readWorkspaceFile(workspace, "scenario_p0_approval_intake_template.csv"));
  const rows = parsed.rows.map((row) => updateRow({ ...row }));
  writeWorkspaceFile(workspace, "scenario_p0_approval_intake_template.csv", toCsv(parsed.headers, rows));
}

function fillSyntheticReadyWorkspace(workspace) {
  updateTemplate(workspace, (row) => ({
    ...row,
    approvalStatusDraft: "ready_for_source_policy_review",
    selectedProvider: `synthetic_provider_for_${row.providerCandidate}`,
    selectedEndpoint: `https://example.test/provider/${row.providerCandidate}`,
    licenseDecision: "approved_internal_monthly_derived_return_cache",
    rawPayloadPolicy: "approved_hash_or_raw_retention_policy",
    redistributionDecision: "approved_no_raw_redistribution_monthly_derived_only",
    reviewOwner: "data-owner@example.test",
    decisionOwner: "product-owner@example.test",
    legalReviewer: "legal-reviewer@example.test",
    reviewedAt: "2026-06-28T00:00:00Z",
    evidenceUrl: `https://example.test/evidence/${row.providerCandidate}`,
  }));

  const validation = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_validation.json"));
  validation.rowCounts.pendingRows = 0;
  validation.rowCounts.readyRows = 5;
  validation.rowCounts.rowsWithMissingRequiredFields = 0;
  validation.readiness.status = "ready_for_source_policy_sync_dry_run";
  validation.readiness.allRowsReadyForSourcePolicyReview = true;
  validation.providerGroups = validation.providerGroups.map((row) => ({
    ...row,
    approvalStatusDraft: "ready_for_source_policy_review",
    missingReviewerFields: [],
    blockers: [],
    readyForSourcePolicyReview: true,
  }));
  writeWorkspaceFile(workspace, "scenario_p0_approval_intake_validation.json", `${JSON.stringify(validation, null, 2)}\n`);
}

test("passes with current source policy sync plan", () => {
  const workspace = makeWorkspace();
  const result = runPlan(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_source_policy_sync_plan\.json/);
});

test("keeps current committed source policy sync plan ready for manual sync", () => {
  const workspace = makeWorkspace();
  const result = runPlan(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_source_policy_sync_plan.json"));
  assert.equal(plan.rowCounts.providerGroups, 5);
  assert.equal(plan.rowCounts.readyProviderGroups, 5);
  assert.equal(plan.rowCounts.plannedSourcePolicyUpdates, 17);
  assert.equal(plan.readiness.syncPlanReady, true);
  assert.equal(plan.readiness.sourcePolicyMatrixWritten, false);
  assert.equal(plan.readiness.providerCallsAllowed, false);
  assert.equal(plan.readiness.monthlyDataFileWritten, false);
});

test("plans all source policy updates for synthetic ready intake without writing the matrix", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyWorkspace(workspace);

  const result = runPlan(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_source_policy_sync_plan.json"));
  assert.equal(plan.rowCounts.readyProviderGroups, 5);
  assert.equal(plan.rowCounts.plannedSourcePolicyUpdates, 17);
  assert.equal(plan.plannedRows.length, 17);
  assert.equal(plan.readiness.syncPlanReady, true);
  assert.equal(plan.readiness.sourcePolicyMatrixWritten, false);
  assert.equal(plan.readiness.providerCallsAllowed, false);
});

test("rejects ready validation when template reviewer fields are missing", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyWorkspace(workspace);
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, evidenceUrl: "" } : row,
  );

  const result = runPlan(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_source_policy_sync_plan.json"));
  const fxPlan = plan.providerGroups.find((row) => row.providerCandidate === "USD_KRW_fx_provider");
  assert.equal(plan.rowCounts.plannedSourcePolicyUpdates, 16);
  assert.equal(fxPlan.readyForSourcePolicySync, false);
  assert.deepEqual(fxPlan.blockers, ["missing_evidenceUrl"]);
});

test("rejects provider candidate drift between source policy and template", () => {
  const workspace = makeWorkspace();
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, providerCandidate: "USD_KRW_fx_provider_DRIFT" } : row,
  );

  const result = runPlan(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /providerCandidate mismatch between source policy matrix and approval intake template/);
});

test("rejects stale committed source policy sync plan", () => {
  const workspace = makeWorkspace();
  const plan = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_source_policy_sync_plan.json"));
  plan.rowCounts.plannedSourcePolicyUpdates = 999;
  writeWorkspaceFile(workspace, "scenario_p0_source_policy_sync_plan.json", `${JSON.stringify(plan, null, 2)}\n`);

  const result = runPlan(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_source_policy_sync_plan\.json is out of date/);
});
