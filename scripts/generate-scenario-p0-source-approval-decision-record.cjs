const fs = require("node:fs");
const path = require("node:path");

const REQUIREMENTS_PATH = path.join("data", "processed", "scenario_p0_source_approval_requirements.json");
const DECISION_CSV_PATH = path.join("data", "processed", "scenario_p0_source_approval_decision_record.csv");
const DECISION_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_source_approval_decision_record_summary.json");

const DECISION_VERSION = "scenario-p0-source-approval-decision-record-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";
const PENDING_DECISION = "pending_decision";

const CSV_COLUMNS = [
  "providerCandidate",
  "sourceScope",
  "rowCount",
  "markets",
  "tickers",
  "decisionStatus",
  "selectedProvider",
  "selectedEndpoint",
  "licenseDecision",
  "rawPayloadPolicy",
  "redistributionDecision",
  "reviewOwner",
  "reviewedAt",
  "approvalEvidence",
  "blocker",
  "nextAction",
];

function fail(message) {
  throw new Error(message);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  return `${CSV_COLUMNS.join(",")}\n${rows
    .map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column])).join(","))
    .join("\n")}\n`;
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return sortObject(counts);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildDecisionRecord() {
  if (!fs.existsSync(REQUIREMENTS_PATH)) {
    fail(`${REQUIREMENTS_PATH} not found`);
  }

  const requirements = JSON.parse(fs.readFileSync(REQUIREMENTS_PATH, "utf8"));
  const providerGroups = requirements.providerGroups;
  if (!providerGroups || typeof providerGroups !== "object") {
    fail(`${REQUIREMENTS_PATH} missing providerGroups`);
  }

  const rows = Object.values(providerGroups)
    .sort((left, right) => left.providerCandidate.localeCompare(right.providerCandidate))
    .map((group) => ({
      providerCandidate: group.providerCandidate,
      sourceScope: group.sourceScope,
      rowCount: group.rowCount,
      markets: group.markets.join("|"),
      tickers: group.tickers.join("|"),
      decisionStatus: PENDING_DECISION,
      selectedProvider: "",
      selectedEndpoint: "",
      licenseDecision: "",
      rawPayloadPolicy: "",
      redistributionDecision: "",
      reviewOwner: "",
      reviewedAt: "",
      approvalEvidence: group.minimumEvidence.join("|"),
      blocker: "source_license_refresh_policy_not_decided",
      nextAction: "select_provider_endpoint_and_record_license_policy",
    }));

  if (rows.length !== 5) {
    fail(`${REQUIREMENTS_PATH} must produce 5 provider decision rows, got ${rows.length}`);
  }

  return {
    csv: toCsv(rows),
    summary: stableJson({
      decisionRecordVersion: DECISION_VERSION,
      auditedAt: AUDITED_AT,
      sourceFiles: {
        requirements: REQUIREMENTS_PATH,
      },
      outputFiles: {
        csv: DECISION_CSV_PATH,
        summary: DECISION_SUMMARY_PATH,
        monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
      },
      rowCounts: {
        providerGroups: rows.length,
        decidedGroups: rows.filter((row) => row.decisionStatus !== PENDING_DECISION).length,
        pendingGroups: rows.filter((row) => row.decisionStatus === PENDING_DECISION).length,
      },
      counts: {
        byDecisionStatus: countBy(rows, "decisionStatus"),
        byBlocker: countBy(rows, "blocker"),
      },
      readiness: {
        status: "pending_source_approval_decisions",
        providerCallsAllowed: false,
        monthlyDataFileWritten: false,
        bootstrapStillBlocked: true,
        nextAllowedStep: "fill_decision_record_before_source_policy_matrix_approval",
      },
    }),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const record = buildDecisionRecord();

  if (checkOnly) {
    for (const [filePath, expected] of [
      [DECISION_CSV_PATH, record.csv],
      [DECISION_SUMMARY_PATH, record.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-source-approval-decision-record.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-source-approval-decision-record.cjs`);
      }
    }
    console.log("[generate-scenario-p0-source-approval-decision-record] ok");
    console.log(`[generate-scenario-p0-source-approval-decision-record] csv=${DECISION_CSV_PATH}`);
    console.log(`[generate-scenario-p0-source-approval-decision-record] summary=${DECISION_SUMMARY_PATH}`);
    return;
  }

  fs.writeFileSync(DECISION_CSV_PATH, record.csv);
  fs.writeFileSync(DECISION_SUMMARY_PATH, record.summary);
  console.log("[generate-scenario-p0-source-approval-decision-record] wrote decision record");
  console.log(`[generate-scenario-p0-source-approval-decision-record] csv=${DECISION_CSV_PATH}`);
  console.log(`[generate-scenario-p0-source-approval-decision-record] summary=${DECISION_SUMMARY_PATH}`);
}

main();
