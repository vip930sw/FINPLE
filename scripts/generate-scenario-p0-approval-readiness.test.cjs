const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-approval-readiness.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_source_policy_matrix_summary.json",
  "scenario_p0_source_approval_decision_record.csv",
  "scenario_p0_external_provider_terms_review.csv",
  "scenario_p0_owner_legal_decision_packet.csv",
  "scenario_p0_cache_writer_gate.json",
  "scenario_p0_source_policy_post_import_preflight.json",
  "scenario_p0_approval_readiness.json",
];
const APPROVED_SOURCE_POLICY = "approved_source_policy";
const APPROVED_SOURCE_POLICY_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: APPROVED_SOURCE_POLICY,
  blocker: "",
};

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-p0-approval-readiness-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runReadiness(workspace, args = ["--check"]) {
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

function mutateWorkspaceJson(workspace, fileName, patch) {
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
  const rows = parsed.rows.map((row) => updateRow({ ...row }));
  writeWorkspaceFile(workspace, fileName, toCsv(parsed.headers, rows));
}

function makePostImportPreflightReady(workspace) {
  mutateWorkspaceJson(workspace, "scenario_p0_source_policy_post_import_preflight.json", (preflight) => {
    preflight.checks.approvedSourcePolicyRows = 17;
    preflight.checks.blockedSourcePolicyRows = 0;
    preflight.checks.plannedSourcePolicyUpdates = 17;
    preflight.checks.readyProviderGroups = 5;
    preflight.checks.realApprovalImportReady = true;
    preflight.checks.allSourcePolicyRowsApproved = true;
    preflight.checks.approvedRowsMatchPlan = true;
    preflight.checks.safeToUseImportedSourcePolicy = true;
    preflight.checks.blockers = [];
    preflight.readiness.status = "ready_for_approval_readiness_recalculation_after_source_policy_import";
    preflight.readiness.safeToUseImportedSourcePolicy = true;
    preflight.readiness.nextAllowedStep = "rerun_approval_readiness_and_writer_gate_after_manual_source_policy_import";
  });
}

function approveSyntheticFixture(workspace) {
  updateWorkspaceCsv(workspace, "scenario_p0_source_policy_matrix.csv", (row) => ({
    ...row,
    ...APPROVED_SOURCE_POLICY_RULES,
  }));

  updateWorkspaceCsv(workspace, "scenario_p0_source_approval_decision_record.csv", (row) => ({
    ...row,
    decisionStatus: APPROVED_SOURCE_POLICY,
    selectedProvider: `synthetic_provider_for_${row.providerCandidate}`,
    selectedEndpoint: `https://example.test/${row.providerCandidate}`,
    licenseDecision: "approved_internal_monthly_derived_return_cache",
    rawPayloadPolicy: "approved_hash_or_raw_retention_policy",
    redistributionDecision: "approved_no_raw_redistribution_monthly_derived_only",
    reviewOwner: "data-owner@example.test",
    reviewedAt: "2026-06-28T00:00:00Z",
    approvalEvidence: "synthetic_fixture_only",
    blocker: "",
    nextAction: "sync_approved_source_policy_matrix_with_writer_gate",
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

  mutateWorkspaceJson(workspace, "scenario_p0_cache_writer_gate.json", (writerGate) => {
    writerGate.rowCounts.approvedRows = writerGate.rowCounts.totalRows;
    writerGate.rowCounts.blockedRows = 0;
    writerGate.counts.byStatus = { approved_source_policy: writerGate.rowCounts.totalRows };
    writerGate.counts.byBlocker = {};
    writerGate.blockedRows = [];
    writerGate.readiness.status = "ready_for_p0_monthly_cache_write";
    writerGate.readiness.canWriteMonthlyData = true;
    writerGate.readiness.providerCallsAllowed = true;
    writerGate.readiness.bootstrapStillBlocked = false;
    writerGate.readiness.nextAllowedStep = "implement_controlled_p0_provider_adapter_and_monthly_cache_writer";
  });

  makePostImportPreflightReady(workspace);
}

test("passes with current blocked P0 approval fixture", () => {
  const workspace = makeWorkspace();
  const result = runReadiness(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_approval_readiness\.json/);
});

test("accepts synthetic source approval only when all approval evidence is present", () => {
  const workspace = makeWorkspace();
  approveSyntheticFixture(workspace);

  const result = runReadiness(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_readiness.json"));
  assert.equal(report.rowCounts.postImportPreflightReady, true);
  assert.equal(report.rowCounts.termsApproved, 5);
  assert.equal(report.rowCounts.ownerAdapterApproved, 5);
  assert.equal(report.rowCounts.ownerMonthlyApproved, 5);
  assert.equal(report.rowCounts.sourcePolicyApproved, 17);
  assert.equal(report.readiness.safeToImplementProviderAdapter, true);
  assert.equal(report.readiness.safeToWriteMonthlyData, true);
});

test("rejects open writer gate before source-policy post-import preflight is ready", () => {
  const workspace = makeWorkspace();
  approveSyntheticFixture(workspace);
  mutateWorkspaceJson(workspace, "scenario_p0_source_policy_post_import_preflight.json", (preflight) => {
    preflight.checks.safeToUseImportedSourcePolicy = false;
    preflight.readiness.safeToUseImportedSourcePolicy = false;
    preflight.checks.blockers = ["source_policy_post_import_preflight_not_ready"];
  });

  const result = runReadiness(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /writer gate allows provider calls before source-policy post-import preflight is ready/);
});

test("rejects approved source policy without selected provider evidence", () => {
  const workspace = makeWorkspace();
  approveSyntheticFixture(workspace);
  updateWorkspaceCsv(workspace, "scenario_p0_source_approval_decision_record.csv", (row) =>
    row.providerCandidate === "US_price_total_return_dividend_provider" ? { ...row, selectedProvider: "" } : row,
  );

  const result = runReadiness(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /approved source policy US_price_total_return_dividend_provider:ITOT decision record missing required selectedProvider/);
});

test("rejects approved source policy without owner legal evidence URL", () => {
  const workspace = makeWorkspace();
  approveSyntheticFixture(workspace);
  updateWorkspaceCsv(workspace, "scenario_p0_owner_legal_decision_packet.csv", (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, evidenceUrl: "" } : row,
  );

  const result = runReadiness(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /approved source policy USD_KRW_fx_provider:USD_KRW owner\/legal packet missing required evidenceUrl/);
});

test("rejects provider candidate drift between gate files", () => {
  const workspace = makeWorkspace();
  const ownerLegalCsv = readWorkspaceFile(workspace, "scenario_p0_owner_legal_decision_packet.csv");
  writeWorkspaceFile(
    workspace,
    "scenario_p0_owner_legal_decision_packet.csv",
    ownerLegalCsv.replace("USD_KRW_fx_provider", "USD_KRW_fx_provider_DRIFT"),
  );

  const result = runReadiness(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /providerCandidate mismatch between source policy and owner\/legal packet/);
});

test("rejects writer gate provider calls before approval layers are complete", () => {
  const workspace = makeWorkspace();
  makePostImportPreflightReady(workspace);
  updateWorkspaceCsv(workspace, "scenario_p0_source_approval_decision_record.csv", (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, decisionStatus: "pending_decision" } : row,
  );
  const writerGate = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json"));
  writerGate.readiness.providerCallsAllowed = true;
  writeWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json", `${JSON.stringify(writerGate, null, 2)}\n`);

  const result = runReadiness(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires decisionStatus=approved_source_policy/);
});

test("rejects writer gate monthly writes before all approval layers are complete", () => {
  const workspace = makeWorkspace();
  makePostImportPreflightReady(workspace);
  updateWorkspaceCsv(workspace, "scenario_p0_source_approval_decision_record.csv", (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, decisionStatus: "pending_decision" } : row,
  );
  const writerGate = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json"));
  writerGate.readiness.canWriteMonthlyData = true;
  writeWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json", `${JSON.stringify(writerGate, null, 2)}\n`);

  const result = runReadiness(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires decisionStatus=approved_source_policy/);
});
