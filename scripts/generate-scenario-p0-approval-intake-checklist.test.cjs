const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-approval-intake-checklist.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_source_approval_decision_record.csv",
  "scenario_p0_external_provider_terms_review.csv",
  "scenario_p0_owner_legal_decision_packet.csv",
  "scenario_p0_approval_intake_checklist.json",
];
const APPROVED_SOURCE_POLICY_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: "approved_source_policy",
  blocker: "",
};

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-approval-intake-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runChecklist(workspace, args = ["--check"]) {
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

function updateWorkspaceCsv(workspace, fileName, updateRow) {
  const parsed = parseCsv(readWorkspaceFile(workspace, fileName));
  writeWorkspaceFile(workspace, fileName, toCsv(parsed.headers, parsed.rows.map((row) => updateRow({ ...row }))));
}

function approveSyntheticIntake(workspace) {
  updateWorkspaceCsv(workspace, "scenario_p0_source_policy_matrix.csv", (row) => ({
    ...row,
    ...APPROVED_SOURCE_POLICY_RULES,
  }));
  updateWorkspaceCsv(workspace, "scenario_p0_source_approval_decision_record.csv", (row) => ({
    ...row,
    decisionStatus: "approved_source_policy",
    selectedProvider: `synthetic_provider_for_${row.providerCandidate}`,
    selectedEndpoint: `https://example.test/${row.providerCandidate}`,
    licenseDecision: "approved_internal_monthly_derived_return_cache",
    rawPayloadPolicy: "approved_hash_or_raw_retention_policy",
    redistributionDecision: "approved_no_raw_redistribution_monthly_derived_only",
    reviewOwner: "data-owner@example.test",
    reviewedAt: "2026-06-28T00:00:00Z",
    approvalEvidence: "synthetic_fixture_only",
    blocker: "",
    nextAction: "sync_source_policy_matrix_and_run_approval_readiness",
  }));
  updateWorkspaceCsv(workspace, "scenario_p0_external_provider_terms_review.csv", (row) => ({
    ...row,
    approvalStatus: "approved",
    blocker: "",
    nextAction: "terms_approved_in_synthetic_fixture",
  }));
  updateWorkspaceCsv(workspace, "scenario_p0_owner_legal_decision_packet.csv", (row) => ({
    ...row,
    adapterApprovalStatus: "approved_for_adapter",
    monthlyWriteApprovalStatus: "approved_for_monthly_write",
    decisionOwner: "product-owner@example.test",
    legalReviewer: "legal-reviewer@example.test",
    reviewedAt: "2026-06-28T00:00:00Z",
    evidenceUrl: `https://example.test/legal/${row.providerCandidate}`,
    blocker: "",
    nextAction: "owner_legal_approved_in_synthetic_fixture",
  }));
}

test("passes with current blocked approval intake checklist", () => {
  const workspace = makeWorkspace();
  const result = runChecklist(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_approval_intake_checklist\.json/);
});

test("reports all current provider groups as blocked with zero intake completion", () => {
  const workspace = makeWorkspace();
  const result = runChecklist(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const checklist = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_checklist.json"));
  assert.equal(checklist.rowCounts.providerGroups, 5);
  assert.equal(checklist.rowCounts.readyProviderGroups, 0);
  assert.equal(checklist.completion.intakeCompletionPercent, 0);
  assert.equal(checklist.completion.readyForProviderAdapter, false);
});

test("accepts complete synthetic approval intake without touching real files", () => {
  const workspace = makeWorkspace();
  approveSyntheticIntake(workspace);
  const result = runChecklist(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const checklist = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_checklist.json"));
  assert.equal(checklist.rowCounts.readyProviderGroups, 5);
  assert.equal(checklist.completion.intakeCompletionPercent, 100);
  assert.equal(checklist.completion.readyForProviderAdapter, true);
  assert.equal(checklist.completion.monthlyDataFileWritten, false);
});

test("rejects stale committed approval intake checklist", () => {
  const workspace = makeWorkspace();
  const checklist = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_checklist.json"));
  checklist.rowCounts.readyProviderGroups = 999;
  writeWorkspaceFile(workspace, "scenario_p0_approval_intake_checklist.json", `${JSON.stringify(checklist, null, 2)}\n`);

  const result = runChecklist(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_approval_intake_checklist\.json is out of date/);
});
