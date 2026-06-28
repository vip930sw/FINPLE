const fs = require("node:fs");
const path = require("node:path");

const KIS_WRITTEN_RESPONSE_INTAKE_PATH = path.join("data", "processed", "scenario_p0_kis_written_response_intake.csv");
const KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_kis_written_response_preflight.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const PREFLIGHT_VERSION = "scenario-p0-kis-written-response-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const REQUIRED_RESPONSE_ID = "kis_openapi_written_confirmation";
const REQUIRED_SENT_TO = "openapi@koreainvestment.com";
const READY_RESPONSE_STATUS = "approved";
const READY_STATUS = "ready_for_runtime_preflight";
const APPROVED_REQUIRED_AGREEMENT_VALUES = new Set([
  "customer_terms_confirmed",
  "agency_terms_confirmed",
  "paid_or_partner_agreement_required",
  "no_additional_agreement_required",
]);

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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function isYes(value) {
  return String(value ?? "").trim().toLowerCase() === "yes";
}

function isIsoTimestamp(value) {
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(text) && !Number.isNaN(Date.parse(text));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function hasEvidence(value) {
  const text = String(value ?? "").trim();
  return text.startsWith("https://") || text.startsWith("docs/") || text.startsWith("evidence/");
}

function indexRows(rows) {
  const indexed = new Map();
  for (const row of rows) {
    if (!row.responseId) {
      fail(`${KIS_WRITTEN_RESPONSE_INTAKE_PATH} has a row without responseId`);
    }
    if (indexed.has(row.responseId)) {
      fail(`${KIS_WRITTEN_RESPONSE_INTAKE_PATH} has duplicate responseId=${row.responseId}`);
    }
    indexed.set(row.responseId, row);
  }
  return indexed;
}

function buildPreflight() {
  const intake = readCsv(KIS_WRITTEN_RESPONSE_INTAKE_PATH);
  const rowsById = indexRows(intake.rows);
  const row = rowsById.get(REQUIRED_RESPONSE_ID);
  if (!row) {
    fail(`${KIS_WRITTEN_RESPONSE_INTAKE_PATH} missing responseId=${REQUIRED_RESPONSE_ID}`);
  }

  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);
  const sentToKis = String(row.sentTo ?? "").trim().toLowerCase() === REQUIRED_SENT_TO;
  const sentAtValid = isIsoTimestamp(row.sentAt);
  const responseReceived = String(row.responseReceivedAt ?? "").trim() !== "" || String(row.responseStatus ?? "") !== "pending_response";
  const responseStatusApproved = row.responseStatus === READY_RESPONSE_STATUS;
  const responseEvidenceValid = hasEvidence(row.responseEvidence);
  const reviewerFieldsPresent = isEmail(row.reviewOwner) && isIsoTimestamp(row.reviewedAt);
  const termsReviewed = isYes(row.termsReviewed);
  const rawRedistributionReviewed = isYes(row.rawRedistributionReviewed);
  const approvedUseScopePresent = String(row.approvedUseScope ?? "").trim() !== "";
  const requiredAgreementValid = APPROVED_REQUIRED_AGREEMENT_VALUES.has(String(row.requiredAgreement ?? "").trim());
  const statusReady = row.status === READY_STATUS;

  const responseReady =
    sentToKis &&
    sentAtValid &&
    responseReceived &&
    responseStatusApproved &&
    responseEvidenceValid &&
    termsReviewed &&
    rawRedistributionReviewed &&
    approvedUseScopePresent &&
    requiredAgreementValid &&
    reviewerFieldsPresent &&
    statusReady &&
    !monthlyFileExists;

  const blockers = [
    ...(sentToKis ? [] : ["kis_confirmation_not_sent_to_required_address"]),
    ...(sentAtValid ? [] : ["kis_confirmation_sent_at_invalid_or_missing"]),
    ...(responseReceived ? [] : ["kis_written_response_pending"]),
    ...(responseStatusApproved ? [] : [`kis_written_response_status_${row.responseStatus || "missing"}`]),
    ...(responseEvidenceValid ? [] : ["kis_written_response_evidence_missing"]),
    ...(termsReviewed ? [] : ["kis_terms_not_approved"]),
    ...(rawRedistributionReviewed ? [] : ["kis_raw_redistribution_not_approved"]),
    ...(approvedUseScopePresent ? [] : ["kis_approved_use_scope_missing"]),
    ...(requiredAgreementValid ? [] : ["kis_required_agreement_unclassified"]),
    ...(reviewerFieldsPresent ? [] : ["kis_response_review_owner_or_reviewed_at_missing"]),
    ...(statusReady ? [] : [`kis_response_status_${row.status || "missing"}`]),
    ...(monthlyFileExists ? ["scenario_monthly_returns_csv_already_exists"] : []),
  ];

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      kisWrittenResponseIntake: KIS_WRITTEN_RESPONSE_INTAKE_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH,
    },
    checks: {
      providerCallsMade: false,
      monthlyFileExists,
      sentToKis,
      sentAtValid,
      responseReceived,
      responseStatusApproved,
      responseEvidenceValid,
      termsReviewed,
      rawRedistributionReviewed,
      approvedUseScopePresent,
      requiredAgreementValid,
      reviewerFieldsPresent,
      statusReady,
      responseReady,
      blockers: [...new Set(blockers)],
    },
    response: {
      responseId: row.responseId,
      providerCandidate: row.providerCandidate,
      sentTo: row.sentTo,
      sentAt: row.sentAt,
      responseStatus: row.responseStatus,
      responseReceivedAt: row.responseReceivedAt,
      respondent: row.respondent,
      responseEvidence: row.responseEvidence,
      approvedUseScope: row.approvedUseScope,
      requiredAgreement: row.requiredAgreement,
      reviewOwner: row.reviewOwner,
      reviewedAt: row.reviewedAt,
      status: row.status,
      blocker: row.blocker,
      nextAction: row.nextAction,
    },
    readiness: {
      status: responseReady ? "ready_for_runtime_provider_preflight" : "blocked_pending_kis_written_response",
      responseReady,
      providerCallsAllowed: false,
      monthlyDataFileWritten: monthlyFileExists,
      bootstrapStillBlocked: true,
      nextAllowedStep: responseReady
        ? "rerun_provider_runtime_preflight_with_kis_written_confirmation"
        : "wait_for_kis_written_response_before_runtime_provider_calls",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH)) {
      fail(`${KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-kis-written-response-preflight.cjs`);
    }
    const current = fs.readFileSync(KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-kis-written-response-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-kis-written-response-preflight] ok");
    console.log(`[generate-scenario-p0-kis-written-response-preflight] preflight=${KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(KIS_WRITTEN_RESPONSE_PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-kis-written-response-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-kis-written-response-preflight] responseReady=${parsed.checks.responseReady}`);
}

main();
