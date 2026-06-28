const fs = require("node:fs");
const path = require("node:path");

const SOURCE_DECISION_CSV_PATH = path.join("data", "processed", "scenario_p0_source_approval_decision_record.csv");
const OWNER_LEGAL_CSV_PATH = path.join("data", "processed", "scenario_p0_owner_legal_decision_packet.csv");
const INTAKE_CHECKLIST_PATH = path.join("data", "processed", "scenario_p0_approval_intake_checklist.json");
const INTAKE_TEMPLATE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template.csv");
const INTAKE_TEMPLATE_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template_summary.json");

const TEMPLATE_VERSION = "scenario-p0-approval-intake-template-v0.2";
const AUDITED_AT = "2026-06-28T00:00:00Z";
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
const CSV_COLUMNS = [
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

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  return `${CSV_COLUMNS.join(",")}\n${rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column])).join(",")).join("\n")}\n`;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function indexBy(rows, field, label) {
  const indexed = new Map();
  for (const row of rows) {
    const key = row[field];
    if (!key) {
      fail(`${label} has a row without ${field}`);
    }
    if (indexed.has(key)) {
      fail(`${label} has duplicate ${field}: ${key}`);
    }
    indexed.set(key, row);
  }
  return indexed;
}

function assertSameKeySet(left, right, leftLabel, rightLabel) {
  const leftKeys = [...left.keys()].sort();
  const rightKeys = [...right.keys()].sort();
  if (leftKeys.join("|") !== rightKeys.join("|")) {
    fail(`${leftLabel} providerCandidate set does not match ${rightLabel}`);
  }
}

function buildTemplate() {
  const decision = readCsv(SOURCE_DECISION_CSV_PATH);
  const ownerLegal = readCsv(OWNER_LEGAL_CSV_PATH);
  const checklist = readJson(INTAKE_CHECKLIST_PATH);
  const decisionByProvider = indexBy(decision.rows, "providerCandidate", "source approval decision record");
  const ownerByProvider = indexBy(ownerLegal.rows, "providerCandidate", "owner/legal decision packet");
  const checklistByProvider = indexBy(checklist.providerGroups ?? [], "providerCandidate", "approval intake checklist");
  assertSameKeySet(decisionByProvider, ownerByProvider, "source approval decision record", "owner/legal decision packet");
  assertSameKeySet(decisionByProvider, checklistByProvider, "source approval decision record", "approval intake checklist");

  const rows = decision.rows.map((decisionRow) => {
    const ownerRow = ownerByProvider.get(decisionRow.providerCandidate);
    const checklistRow = checklistByProvider.get(decisionRow.providerCandidate);
    if (!ownerRow || !checklistRow) {
      fail(`missing template source rows for providerCandidate=${decisionRow.providerCandidate}`);
    }
    const missingFields = [
      ...(checklistRow.missingDecisionFields ?? []),
      ...(checklistRow.missingOwnerLegalFields ?? []),
    ].filter((field) => REQUIRED_REVIEWER_FIELDS.includes(field));

    return {
      providerCandidate: decisionRow.providerCandidate,
      namedProviderCandidate: ownerRow.namedProviderCandidate,
      sourceScope: decisionRow.sourceScope,
      markets: decisionRow.markets,
      tickers: decisionRow.tickers,
      sourcePolicyRows: checklistRow.sourcePolicyRows,
      approvalStatusDraft: "pending_review",
      selectedProvider: "",
      selectedEndpoint: "",
      licenseDecision: "",
      rawPayloadPolicy: "",
      redistributionDecision: "",
      reviewOwner: "",
      decisionOwner: "",
      legalReviewer: "",
      reviewedAt: "",
      evidenceUrl: "",
      approvalEvidence: decisionRow.approvalEvidence,
      commercialUseQuestion: ownerRow.commercialUseQuestion,
      redistributionQuestion: ownerRow.redistributionQuestion,
      rawPayloadQuestion: ownerRow.rawPayloadQuestion,
      cacheQuestion: ownerRow.cacheQuestion,
      attributionQuestion: ownerRow.attributionQuestion,
      displayLabelQuestion: ownerRow.displayLabelQuestion,
      missingFields: missingFields.join("|"),
      blockers: (checklistRow.blockers ?? []).join("|"),
      reviewerInstruction: "Fill all blank reviewer fields with real approvals before changing any source policy row.",
    };
  });

  if (rows.length !== 5) {
    fail(`${SOURCE_DECISION_CSV_PATH} must produce 5 approval intake template rows, got ${rows.length}`);
  }
  const sourcePolicyRows = rows.reduce((total, row) => {
    const rowCount = Number(row.sourcePolicyRows);
    if (!Number.isInteger(rowCount) || rowCount < 1) {
      fail(`invalid sourcePolicyRows for providerCandidate=${row.providerCandidate}`);
    }
    return total + rowCount;
  }, 0);
  if (sourcePolicyRows !== checklist.rowCounts?.sourcePolicyRows) {
    fail(`${INTAKE_CHECKLIST_PATH} sourcePolicyRows does not match approval intake template rows`);
  }
  for (const row of rows) {
    if (row.approvalStatusDraft !== "pending_review") {
      fail(`${INTAKE_TEMPLATE_PATH} must not pre-approve providerCandidate=${row.providerCandidate}`);
    }
  }

  return {
    csv: toCsv(rows),
    summary: stableJson({
      templateVersion: TEMPLATE_VERSION,
      auditedAt: AUDITED_AT,
      sourceFiles: {
        sourceApprovalDecisionRecord: SOURCE_DECISION_CSV_PATH,
        ownerLegalDecisionPacket: OWNER_LEGAL_CSV_PATH,
        approvalIntakeChecklist: INTAKE_CHECKLIST_PATH,
      },
      outputFiles: {
        csv: INTAKE_TEMPLATE_PATH,
        summary: INTAKE_TEMPLATE_SUMMARY_PATH,
        monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
      },
      rowCounts: {
        providerGroups: rows.length,
        sourcePolicyRows,
        pendingReviewRows: rows.filter((row) => row.approvalStatusDraft === "pending_review").length,
        approvedRows: rows.filter((row) => row.approvalStatusDraft !== "pending_review").length,
      },
      sourceIntegrity: {
        providerCandidateSetVerified: true,
        sourcePolicyRowsMatchChecklist: true,
      },
      requiredReviewerFields: REQUIRED_REVIEWER_FIELDS,
      readiness: {
        status: "pending_real_approval_input",
        providerCallsAllowed: false,
        monthlyDataFileWritten: false,
        bootstrapStillBlocked: true,
        nextAllowedStep: "reviewer_fill_approval_intake_template_before_source_policy_approval",
      },
    }),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const template = buildTemplate();

  if (checkOnly) {
    for (const [filePath, expected] of [
      [INTAKE_TEMPLATE_PATH, template.csv],
      [INTAKE_TEMPLATE_SUMMARY_PATH, template.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-approval-intake-template.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-approval-intake-template.cjs`);
      }
    }
    console.log("[generate-scenario-p0-approval-intake-template] ok");
    console.log(`[generate-scenario-p0-approval-intake-template] csv=${INTAKE_TEMPLATE_PATH}`);
    console.log(`[generate-scenario-p0-approval-intake-template] summary=${INTAKE_TEMPLATE_SUMMARY_PATH}`);
    return;
  }

  fs.writeFileSync(INTAKE_TEMPLATE_PATH, template.csv);
  fs.writeFileSync(INTAKE_TEMPLATE_SUMMARY_PATH, template.summary);
  console.log("[generate-scenario-p0-approval-intake-template] wrote template");
  console.log(`[generate-scenario-p0-approval-intake-template] csv=${INTAKE_TEMPLATE_PATH}`);
  console.log(`[generate-scenario-p0-approval-intake-template] summary=${INTAKE_TEMPLATE_SUMMARY_PATH}`);
}

main();
