const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-approval-intake-validation.cjs");
const FIXTURE_FILES = [
  "scenario_p0_approval_intake_template.csv",
  "scenario_p0_approval_intake_template_summary.json",
  "scenario_p0_approval_intake_validation.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-approval-validation-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runValidation(workspace, args = ["--check"]) {
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

function fillSyntheticReadyTemplate(workspace) {
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
}

test("passes with current approval intake validation", () => {
  const workspace = makeWorkspace();
  const result = runValidation(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_approval_intake_validation\.json/);
});

test("classifies current committed template as ready without allowing provider calls", () => {
  const workspace = makeWorkspace();
  const result = runValidation(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const validation = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_validation.json"));
  assert.equal(validation.rowCounts.providerGroups, 5);
  assert.equal(validation.rowCounts.pendingRows, 0);
  assert.equal(validation.rowCounts.readyRows, 5);
  assert.equal(validation.readiness.allRowsReadyForSourcePolicyReview, true);
  assert.equal(validation.readiness.providerCallsAllowed, false);
  assert.equal(validation.readiness.monthlyDataFileWritten, false);
  assert.equal(validation.readiness.bootstrapStillBlocked, true);
});

test("accepts synthetic ready intake rows without allowing provider calls", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyTemplate(workspace);

  const result = runValidation(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const validation = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_validation.json"));
  assert.equal(validation.rowCounts.readyRows, 5);
  assert.equal(validation.readiness.allRowsReadyForSourcePolicyReview, true);
  assert.equal(validation.readiness.providerCallsAllowed, false);
  assert.equal(validation.readiness.monthlyDataFileWritten, false);
});

test("rejects ready intake rows with missing reviewer fields", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyTemplate(workspace);
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "US_price_total_return_dividend_provider" ? { ...row, selectedProvider: "" } : row,
  );

  const result = runValidation(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /US_price_total_return_dividend_provider cannot be ready_for_source_policy_review: missing_selectedProvider/);
});

test("rejects ready intake rows with invalid evidence URL", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyTemplate(workspace);
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "USD_KRW_fx_provider" ? { ...row, evidenceUrl: "not-a-url" } : row,
  );

  const result = runValidation(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /USD_KRW_fx_provider cannot be ready_for_source_policy_review: invalid_evidence_url/);
});

test("rejects ready intake rows with invalid selected endpoint URL", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyTemplate(workspace);
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "KR_price_total_return_dividend_provider" ? { ...row, selectedEndpoint: "provider-api-v1" } : row,
  );

  const result = runValidation(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /KR_price_total_return_dividend_provider cannot be ready_for_source_policy_review: invalid_selectedEndpoint/,
  );
});

test("rejects ready intake rows with invalid reviewer identities", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyTemplate(workspace);
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "KOSPI200_TR_primary_or_kospi200_etf_proxy"
      ? {
          ...row,
          reviewOwner: "data owner",
          decisionOwner: "product owner",
          legalReviewer: "legal reviewer",
        }
      : row,
  );

  const result = runValidation(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /KOSPI200_TR_primary_or_kospi200_etf_proxy cannot be ready_for_source_policy_review: invalid_reviewOwner\|invalid_decisionOwner\|invalid_legalReviewer/,
  );
});

test("rejects ready intake rows with generic approval decision values", () => {
  const workspace = makeWorkspace();
  fillSyntheticReadyTemplate(workspace);
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "SP500_TR_primary_or_SPY_adjusted_close_proxy"
      ? {
          ...row,
          licenseDecision: "approved",
          rawPayloadPolicy: "store_raw",
          redistributionDecision: "ok",
        }
      : row,
  );

  const result = runValidation(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /SP500_TR_primary_or_SPY_adjusted_close_proxy cannot be ready_for_source_policy_review: invalid_licenseDecision\|invalid_rawPayloadPolicy\|invalid_redistributionDecision/,
  );
});

test("rejects duplicate provider candidates", () => {
  const workspace = makeWorkspace();
  updateTemplate(workspace, (row) =>
    row.providerCandidate === "USD_KRW_fx_provider"
      ? { ...row, providerCandidate: "US_price_total_return_dividend_provider" }
      : row,
  );

  const result = runValidation(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /duplicate providerCandidate: US_price_total_return_dividend_provider/);
});
