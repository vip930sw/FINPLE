const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const SOURCE_DECISION_CSV_PATH = path.join("data", "processed", "scenario_p0_source_approval_decision_record.csv");
const EXTERNAL_TERMS_CSV_PATH = path.join("data", "processed", "scenario_p0_external_provider_terms_review.csv");
const OWNER_LEGAL_CSV_PATH = path.join("data", "processed", "scenario_p0_owner_legal_decision_packet.csv");
const INTAKE_CHECKLIST_PATH = path.join("data", "processed", "scenario_p0_approval_intake_checklist.json");

const CHECKLIST_VERSION = "scenario-p0-approval-intake-checklist-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const APPROVED_SOURCE_POLICY = "approved_source_policy";
const APPROVED_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: APPROVED_SOURCE_POLICY,
  blocker: "",
};
const REQUIRED_DECISION_FIELDS = [
  "selectedProvider",
  "selectedEndpoint",
  "licenseDecision",
  "rawPayloadPolicy",
  "redistributionDecision",
  "reviewOwner",
  "reviewedAt",
  "approvalEvidence",
];
const REQUIRED_OWNER_LEGAL_FIELDS = ["decisionOwner", "legalReviewer", "reviewedAt", "evidenceUrl"];

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

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
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

function missingFields(row, fields) {
  return fields.filter((field) => !String(row[field] ?? "").trim());
}

function countApprovedPolicyRows(rows) {
  return rows.filter((row) => Object.entries(APPROVED_RULES).every(([field, expected]) => (row[field] ?? "") === expected)).length;
}

function completionPercent(completed, total) {
  if (!total) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

function buildChecklist() {
  const sourcePolicy = readCsv(SOURCE_POLICY_CSV_PATH);
  const sourceDecision = readCsv(SOURCE_DECISION_CSV_PATH);
  const externalTerms = readCsv(EXTERNAL_TERMS_CSV_PATH);
  const ownerLegal = readCsv(OWNER_LEGAL_CSV_PATH);

  const providerCandidates = uniqueSorted(sourcePolicy.rows.map((row) => row.providerCandidate));
  const decisionByProvider = indexBy(sourceDecision.rows, "providerCandidate", "source approval decision record");
  const termsByProvider = indexBy(externalTerms.rows, "providerCandidate", "external terms review");
  const ownerLegalByProvider = indexBy(ownerLegal.rows, "providerCandidate", "owner/legal decision packet");

  const rows = providerCandidates.map((providerCandidate) => {
    const policyRows = sourcePolicy.rows.filter((row) => row.providerCandidate === providerCandidate);
    const decision = decisionByProvider.get(providerCandidate);
    const terms = termsByProvider.get(providerCandidate);
    const owner = ownerLegalByProvider.get(providerCandidate);
    if (!decision || !terms || !owner) {
      fail(`missing approval intake row for providerCandidate=${providerCandidate}`);
    }

    const missingDecisionFields = missingFields(decision, REQUIRED_DECISION_FIELDS);
    const missingOwnerLegalFields = missingFields(owner, REQUIRED_OWNER_LEGAL_FIELDS);
    const approvedPolicyRows = countApprovedPolicyRows(policyRows);
    const termsApproved = terms.approvalStatus === "approved";
    const adapterApproved = owner.adapterApprovalStatus === "approved_for_adapter";
    const monthlyWriteApproved = owner.monthlyWriteApprovalStatus === "approved_for_monthly_write";
    const decisionApproved = decision.decisionStatus === APPROVED_SOURCE_POLICY;
    const sourcePolicyApproved = approvedPolicyRows === policyRows.length;
    const readyForSourcePolicyApproval =
      decisionApproved &&
      termsApproved &&
      adapterApproved &&
      monthlyWriteApproved &&
      missingDecisionFields.length === 0 &&
      missingOwnerLegalFields.length === 0 &&
      sourcePolicyApproved;

    return {
      providerCandidate,
      namedProviderCandidate: terms.namedProviderCandidate,
      sourceScope: decision.sourceScope || owner.reviewScope || terms.candidateUse,
      sourcePolicyRows: policyRows.length,
      approvedSourcePolicyRows: approvedPolicyRows,
      decisionStatus: decision.decisionStatus,
      externalTermsApprovalStatus: terms.approvalStatus,
      adapterApprovalStatus: owner.adapterApprovalStatus,
      monthlyWriteApprovalStatus: owner.monthlyWriteApprovalStatus,
      missingDecisionFields,
      missingOwnerLegalFields,
      blockers: [
        ...(decisionApproved ? [] : ["source_decision_not_approved"]),
        ...(termsApproved ? [] : ["external_terms_not_approved"]),
        ...(adapterApproved ? [] : ["adapter_not_approved_by_owner_legal"]),
        ...(monthlyWriteApproved ? [] : ["monthly_write_not_approved_by_owner_legal"]),
        ...(sourcePolicyApproved ? [] : ["source_policy_rows_not_approved"]),
        ...missingDecisionFields.map((field) => `missing_decision_${field}`),
        ...missingOwnerLegalFields.map((field) => `missing_owner_legal_${field}`),
      ],
      readyForSourcePolicyApproval,
    };
  });

  const readyProviderGroups = rows.filter((row) => row.readyForSourcePolicyApproval).length;
  const completedApprovalSlots = rows.reduce((sum, row) => {
    return (
      sum +
      (row.decisionStatus === APPROVED_SOURCE_POLICY ? 1 : 0) +
      (row.externalTermsApprovalStatus === "approved" ? 1 : 0) +
      (row.adapterApprovalStatus === "approved_for_adapter" ? 1 : 0) +
      (row.monthlyWriteApprovalStatus === "approved_for_monthly_write" ? 1 : 0) +
      row.approvedSourcePolicyRows
    );
  }, 0);
  const totalApprovalSlots = rows.length * 4 + sourcePolicy.rows.length;

  return stableJson({
    checklistVersion: CHECKLIST_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      sourceApprovalDecisionRecord: SOURCE_DECISION_CSV_PATH,
      externalTermsReview: EXTERNAL_TERMS_CSV_PATH,
      ownerLegalDecisionPacket: OWNER_LEGAL_CSV_PATH,
    },
    outputFiles: {
      checklist: INTAKE_CHECKLIST_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      providerGroups: rows.length,
      readyProviderGroups,
      blockedProviderGroups: rows.length - readyProviderGroups,
      sourcePolicyRows: sourcePolicy.rows.length,
      approvedSourcePolicyRows: rows.reduce((sum, row) => sum + row.approvedSourcePolicyRows, 0),
      completedApprovalSlots,
      totalApprovalSlots,
    },
    completion: {
      intakeCompletionPercent: completionPercent(completedApprovalSlots, totalApprovalSlots),
      readyForProviderAdapter: readyProviderGroups === rows.length,
      readyForMonthlyDataWrite: readyProviderGroups === rows.length,
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
    },
    providerGroups: rows,
    nextAllowedStep:
      readyProviderGroups === rows.length
        ? "sync_source_policy_matrix_and_run_approval_readiness_before_adapter"
        : "fill_real_approval_intake_fields_before_source_policy_approval",
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const checklist = buildChecklist();

  if (checkOnly) {
    if (!fs.existsSync(INTAKE_CHECKLIST_PATH)) {
      fail(`${INTAKE_CHECKLIST_PATH} not found; run node scripts/generate-scenario-p0-approval-intake-checklist.cjs`);
    }
    const current = fs.readFileSync(INTAKE_CHECKLIST_PATH, "utf8");
    if (current !== checklist) {
      fail(`${INTAKE_CHECKLIST_PATH} is out of date; run node scripts/generate-scenario-p0-approval-intake-checklist.cjs`);
    }
    console.log("[generate-scenario-p0-approval-intake-checklist] ok");
    console.log(`[generate-scenario-p0-approval-intake-checklist] checklist=${INTAKE_CHECKLIST_PATH}`);
    return;
  }

  fs.writeFileSync(INTAKE_CHECKLIST_PATH, checklist);
  const parsed = JSON.parse(checklist);
  console.log("[generate-scenario-p0-approval-intake-checklist] wrote checklist");
  console.log(`[generate-scenario-p0-approval-intake-checklist] checklist=${INTAKE_CHECKLIST_PATH}`);
  console.log(`[generate-scenario-p0-approval-intake-checklist] intakeCompletionPercent=${parsed.completion.intakeCompletionPercent}`);
}

main();
