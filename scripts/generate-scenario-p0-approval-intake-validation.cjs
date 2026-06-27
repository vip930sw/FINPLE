const fs = require("node:fs");
const path = require("node:path");

const INTAKE_TEMPLATE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template.csv");
const INTAKE_TEMPLATE_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template_summary.json");
const INTAKE_VALIDATION_PATH = path.join("data", "processed", "scenario_p0_approval_intake_validation.json");

const VALIDATION_VERSION = "scenario-p0-approval-intake-validation-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const ALLOWED_STATUSES = new Set(["pending_review", "ready_for_source_policy_review", "rejected"]);
const READY_STATUS = "ready_for_source_policy_review";
const REQUIRED_REVIEWER_FIELDS = [
  "selectedProvider",
  "selectedEndpoint",
  "licenseDecision",
  "rawPayloadPolicy",
  "redistributionDecision",
  "reviewOwner",
  "decisionOwner",
  "legalReviewer",
  "reviewedAt",
  "evidenceUrl",
];
const EXPECTED_COLUMNS = [
  "providerCandidate",
  "namedProviderCandidate",
  "sourceScope",
  "markets",
  "tickers",
  "sourcePolicyRows",
  "approvalStatusDraft",
  "selectedProvider",
  "selectedEndpoint",
  "licenseDecision",
  "rawPayloadPolicy",
  "redistributionDecision",
  "reviewOwner",
  "decisionOwner",
  "legalReviewer",
  "reviewedAt",
  "evidenceUrl",
  "approvalEvidence",
  "commercialUseQuestion",
  "redistributionQuestion",
  "rawPayloadQuestion",
  "cacheQuestion",
  "attributionQuestion",
  "displayLabelQuestion",
  "missingFields",
  "blockers",
  "reviewerInstruction",
];

function fail(message) {
  throw new Error(message);
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  const normalized = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length < 2) {
    fail(`${filePath} must contain a header and at least one data row`);
  }
  const headers = lines[0].split(",");
  if (headers.join(",") !== EXPECTED_COLUMNS.join(",")) {
    fail(`${filePath} header drift detected`);
  }
  const rows = lines.slice(1).filter(Boolean).map((line, lineIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      fail(`${filePath}:${lineIndex + 2} has ${values.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isHttpUrl(value) {
  return /^https?:\/\/\S+$/u.test(String(value ?? "").trim());
}

function isIsoTimestamp(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(text) && !Number.isNaN(Date.parse(text));
}

function missingFields(row, fields) {
  return fields.filter((field) => !String(row[field] ?? "").trim());
}

function validateRows(rows, summary) {
  if (rows.length !== 5) {
    fail(`${INTAKE_TEMPLATE_PATH} must contain 5 provider-group rows, got ${rows.length}`);
  }
  if (summary.rowCounts?.providerGroups !== rows.length) {
    fail(`${INTAKE_TEMPLATE_SUMMARY_PATH} providerGroups does not match intake template rows`);
  }

  const seen = new Set();
  return rows.map((row, index) => {
    if (!row.providerCandidate) {
      fail(`${INTAKE_TEMPLATE_PATH}:${index + 2} missing providerCandidate`);
    }
    if (seen.has(row.providerCandidate)) {
      fail(`${INTAKE_TEMPLATE_PATH} has duplicate providerCandidate: ${row.providerCandidate}`);
    }
    seen.add(row.providerCandidate);

    if (!ALLOWED_STATUSES.has(row.approvalStatusDraft)) {
      fail(`${row.providerCandidate} has invalid approvalStatusDraft=${row.approvalStatusDraft}`);
    }

    const missing = missingFields(row, REQUIRED_REVIEWER_FIELDS);
    const blockers = [];
    if (missing.length > 0) {
      blockers.push(...missing.map((field) => `missing_${field}`));
    }
    if (row.evidenceUrl && !isHttpUrl(row.evidenceUrl)) {
      blockers.push("invalid_evidence_url");
    }
    if (row.reviewedAt && !isIsoTimestamp(row.reviewedAt)) {
      blockers.push("invalid_reviewed_at");
    }

    if (row.approvalStatusDraft === READY_STATUS && blockers.length > 0) {
      fail(`${row.providerCandidate} cannot be ready_for_source_policy_review: ${blockers.join("|")}`);
    }

    return {
      providerCandidate: row.providerCandidate,
      namedProviderCandidate: row.namedProviderCandidate,
      approvalStatusDraft: row.approvalStatusDraft,
      missingReviewerFields: missing,
      blockers,
      readyForSourcePolicyReview: row.approvalStatusDraft === READY_STATUS && blockers.length === 0,
    };
  });
}

function buildValidation() {
  const template = readCsv(INTAKE_TEMPLATE_PATH);
  const summary = readJson(INTAKE_TEMPLATE_SUMMARY_PATH);
  const rows = validateRows(template.rows, summary);
  const readyRows = rows.filter((row) => row.readyForSourcePolicyReview).length;
  const pendingRows = rows.filter((row) => row.approvalStatusDraft === "pending_review").length;
  const rejectedRows = rows.filter((row) => row.approvalStatusDraft === "rejected").length;
  const rowsWithMissingRequiredFields = rows.filter((row) => row.missingReviewerFields.length > 0).length;
  const allRowsReadyForSourcePolicyReview = readyRows === rows.length;

  return stableJson({
    validationVersion: VALIDATION_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplate: INTAKE_TEMPLATE_PATH,
      approvalIntakeTemplateSummary: INTAKE_TEMPLATE_SUMMARY_PATH,
    },
    outputFiles: {
      validation: INTAKE_VALIDATION_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      providerGroups: rows.length,
      pendingRows,
      readyRows,
      rejectedRows,
      rowsWithMissingRequiredFields,
    },
    readiness: {
      status: allRowsReadyForSourcePolicyReview ? "ready_for_source_policy_sync_dry_run" : "blocked_pending_real_approval_input",
      allRowsReadyForSourcePolicyReview,
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: allRowsReadyForSourcePolicyReview
        ? "sync_real_decision_files_then_run_approval_readiness_before_adapter"
        : "fill_real_approval_intake_template_before_source_policy_approval",
    },
    providerGroups: rows,
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const validation = buildValidation();

  if (checkOnly) {
    if (!fs.existsSync(INTAKE_VALIDATION_PATH)) {
      fail(`${INTAKE_VALIDATION_PATH} not found; run node scripts/generate-scenario-p0-approval-intake-validation.cjs`);
    }
    const current = fs.readFileSync(INTAKE_VALIDATION_PATH, "utf8");
    if (current !== validation) {
      fail(`${INTAKE_VALIDATION_PATH} is out of date; run node scripts/generate-scenario-p0-approval-intake-validation.cjs`);
    }
    console.log("[generate-scenario-p0-approval-intake-validation] ok");
    console.log(`[generate-scenario-p0-approval-intake-validation] validation=${INTAKE_VALIDATION_PATH}`);
    return;
  }

  fs.writeFileSync(INTAKE_VALIDATION_PATH, validation);
  const parsed = JSON.parse(validation);
  console.log("[generate-scenario-p0-approval-intake-validation] wrote validation");
  console.log(`[generate-scenario-p0-approval-intake-validation] validation=${INTAKE_VALIDATION_PATH}`);
  console.log(`[generate-scenario-p0-approval-intake-validation] readyRows=${parsed.rowCounts.readyRows}`);
}

main();
