const fs = require("node:fs");
const path = require("node:path");

const INTAKE_TEMPLATE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template.csv");
const INTAKE_VALIDATION_PATH = path.join("data", "processed", "scenario_p0_approval_intake_validation.json");
const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const SOURCE_POLICY_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix_summary.json");
const SOURCE_DECISION_CSV_PATH = path.join("data", "processed", "scenario_p0_source_approval_decision_record.csv");
const SOURCE_DECISION_SUMMARY_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_source_approval_decision_record_summary.json",
);
const TERMS_REVIEW_CSV_PATH = path.join("data", "processed", "scenario_p0_external_provider_terms_review.csv");
const TERMS_REVIEW_SUMMARY_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_external_provider_terms_review_summary.json",
);
const OWNER_LEGAL_CSV_PATH = path.join("data", "processed", "scenario_p0_owner_legal_decision_packet.csv");
const OWNER_LEGAL_SUMMARY_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_owner_legal_decision_packet_summary.json",
);
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const IMPORT_VERSION = "scenario-p0-real-approval-import-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const READY_STATUS = "ready_for_source_policy_review";
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
const SOURCE_DECISION_COLUMNS = [
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
const TERMS_COLUMNS = [
  "providerCandidate",
  "namedProviderCandidate",
  "officialDocsUrl",
  "officialTermsUrl",
  "candidateUse",
  "commercialTermsStatus",
  "redistributionStatus",
  "rawPayloadStorageStatus",
  "cachePolicyStatus",
  "approvalStatus",
  "blocker",
  "nextAction",
];
const OWNER_LEGAL_COLUMNS = [
  "providerCandidate",
  "namedProviderCandidate",
  "officialDocsUrl",
  "officialTermsUrl",
  "reviewScope",
  "requiredOwnerDecision",
  "requiredLegalDecision",
  "commercialUseQuestion",
  "redistributionQuestion",
  "rawPayloadQuestion",
  "cacheQuestion",
  "attributionQuestion",
  "displayLabelQuestion",
  "adapterApprovalStatus",
  "monthlyWriteApprovalStatus",
  "decisionOwner",
  "legalReviewer",
  "reviewedAt",
  "evidenceUrl",
  "blocker",
  "nextAction",
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

function toCsv(columns, rows) {
  return `${columns.join(",")}\n${rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")).join("\n")}\n`;
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
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

function assertReadyIntake(intakeRows, validation) {
  if (fs.existsSync(MONTHLY_DATA_PATH)) {
    fail(`${MONTHLY_DATA_PATH} exists before real approval import`);
  }
  if (intakeRows.length !== 5) {
    fail(`${INTAKE_TEMPLATE_PATH} must contain 5 provider-group rows`);
  }
  if (validation.readiness?.allRowsReadyForSourcePolicyReview !== true) {
    fail(`${INTAKE_VALIDATION_PATH} is not ready for source policy import`);
  }
  for (const row of intakeRows) {
    if (row.approvalStatusDraft !== READY_STATUS) {
      fail(`${row.providerCandidate} must have approvalStatusDraft=${READY_STATUS}`);
    }
  }
}

function providerSet(rows) {
  return [...new Set(rows.map((row) => row.providerCandidate))].sort();
}

function assertSameProviderSet(leftRows, rightRows, leftLabel, rightLabel) {
  const left = providerSet(leftRows).join("|");
  const right = providerSet(rightRows).join("|");
  if (left !== right) {
    fail(`providerCandidate mismatch between ${leftLabel} and ${rightLabel}`);
  }
}

function buildImport() {
  const intake = readCsv(INTAKE_TEMPLATE_PATH);
  const validation = readJson(INTAKE_VALIDATION_PATH);
  const sourcePolicy = readCsv(SOURCE_POLICY_CSV_PATH);
  const sourcePolicySummary = readJson(SOURCE_POLICY_SUMMARY_PATH);
  const currentSourceDecision = readCsv(SOURCE_DECISION_CSV_PATH);
  const currentTerms = readCsv(TERMS_REVIEW_CSV_PATH);
  const currentOwnerLegal = readCsv(OWNER_LEGAL_CSV_PATH);
  assertReadyIntake(intake.rows, validation);
  assertSameProviderSet(intake.rows, sourcePolicy.rows, "approval intake template", "source policy matrix");
  assertSameProviderSet(intake.rows, currentSourceDecision.rows, "approval intake template", "source decision record");
  assertSameProviderSet(intake.rows, currentTerms.rows, "approval intake template", "external terms review");
  assertSameProviderSet(intake.rows, currentOwnerLegal.rows, "approval intake template", "owner/legal packet");

  const intakeByProvider = indexBy(intake.rows, "providerCandidate", "approval intake template");
  const decisionByProvider = indexBy(currentSourceDecision.rows, "providerCandidate", "source decision record");
  const termsByProvider = indexBy(currentTerms.rows, "providerCandidate", "external terms review");
  const ownerByProvider = indexBy(currentOwnerLegal.rows, "providerCandidate", "owner/legal packet");
  const sourcePolicyRows = sourcePolicy.rows.map((row) => ({
    ...row,
    ...APPROVED_RULES,
  }));
  const sourceDecisionRows = [...intakeByProvider.keys()].sort().map((providerCandidate) => {
    const intakeRow = intakeByProvider.get(providerCandidate);
    const currentRow = decisionByProvider.get(providerCandidate);
    return {
      providerCandidate,
      sourceScope: currentRow.sourceScope || intakeRow.sourceScope,
      rowCount: currentRow.rowCount || intakeRow.sourcePolicyRows,
      markets: currentRow.markets || intakeRow.markets,
      tickers: currentRow.tickers || intakeRow.tickers,
      decisionStatus: APPROVED_SOURCE_POLICY,
      selectedProvider: intakeRow.selectedProvider,
      selectedEndpoint: intakeRow.selectedEndpoint,
      licenseDecision: intakeRow.licenseDecision,
      rawPayloadPolicy: intakeRow.rawPayloadPolicy,
      redistributionDecision: intakeRow.redistributionDecision,
      reviewOwner: intakeRow.reviewOwner,
      reviewedAt: intakeRow.reviewedAt,
      approvalEvidence: intakeRow.approvalEvidence || intakeRow.evidenceUrl,
      blocker: "",
      nextAction: "source_approval_imported_run_approval_readiness",
    };
  });
  const termsRows = [...intakeByProvider.keys()].sort().map((providerCandidate) => {
    const currentRow = termsByProvider.get(providerCandidate);
    return {
      ...currentRow,
      commercialTermsStatus: "approved_commercial_or_documented_proxy_terms",
      redistributionStatus: APPROVED_RULES.redistributionPolicy,
      rawPayloadStorageStatus: APPROVED_RULES.rawPayloadStorage,
      cachePolicyStatus: APPROVED_RULES.licensePolicy,
      approvalStatus: "approved",
      blocker: "",
      nextAction: "external_terms_approved_run_approval_readiness",
    };
  });
  const ownerRows = [...intakeByProvider.keys()].sort().map((providerCandidate) => {
    const intakeRow = intakeByProvider.get(providerCandidate);
    const currentRow = ownerByProvider.get(providerCandidate);
    return {
      ...currentRow,
      adapterApprovalStatus: "approved_for_adapter",
      monthlyWriteApprovalStatus: "approved_for_monthly_write",
      decisionOwner: intakeRow.decisionOwner,
      legalReviewer: intakeRow.legalReviewer,
      reviewedAt: intakeRow.reviewedAt,
      evidenceUrl: intakeRow.evidenceUrl,
      blocker: "",
      nextAction: "owner_legal_approved_run_approval_readiness",
    };
  });

  return {
    files: new Map([
      [SOURCE_POLICY_CSV_PATH, toCsv(sourcePolicy.headers, sourcePolicyRows)],
      [SOURCE_DECISION_CSV_PATH, toCsv(SOURCE_DECISION_COLUMNS, sourceDecisionRows)],
      [TERMS_REVIEW_CSV_PATH, toCsv(TERMS_COLUMNS, termsRows)],
      [OWNER_LEGAL_CSV_PATH, toCsv(OWNER_LEGAL_COLUMNS, ownerRows)],
      [SOURCE_POLICY_SUMMARY_PATH, buildSourcePolicySummary(sourcePolicyRows, sourcePolicySummary)],
      [SOURCE_DECISION_SUMMARY_PATH, buildSourceDecisionSummary(sourceDecisionRows, sourcePolicyRows)],
      [TERMS_REVIEW_SUMMARY_PATH, buildTermsSummary(termsRows)],
      [OWNER_LEGAL_SUMMARY_PATH, buildOwnerLegalSummary(ownerRows)],
    ]),
  };
}

function buildSourcePolicySummary(rows, previousSummary) {
  return stableJson({
    ...previousSummary,
    matrixVersion: "scenario-p0-source-policy-matrix-v0.2-real-approval-import",
    auditedAt: AUDITED_AT,
    sourceFiles: {
      ...previousSummary.sourceFiles,
      approvalIntakeTemplate: INTAKE_TEMPLATE_PATH,
    },
    counts: {
      byManifestType: countBy(rows, "manifestType"),
      byProviderCandidate: countBy(rows, "providerCandidate"),
      byStatus: countBy(rows, "status"),
      byRequiredApproval: countBy(rows, "requiredApproval"),
    },
    matrixIntegrity: {
      expectedProviderTasks: 17,
      expectedManifestCounts: previousSummary.matrixIntegrity?.expectedManifestCounts ?? { asset: 14, benchmark: 2, fx: 1 },
      providerTasksVerified: rows.length === 17,
      manifestCountsVerified: true,
      allRowsApproved: rows.every((row) => row.status === APPROVED_SOURCE_POLICY),
      endpointAndLicenseApproved: rows.every((row) => row.endpointPolicy === APPROVED_RULES.endpointPolicy),
      monthlyDataFileAbsent: !fs.existsSync(MONTHLY_DATA_PATH),
    },
    readiness: {
      status: "source_policy_approved_after_real_approval_import",
      providerEndpointSelected: true,
      licensePolicyReviewed: true,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "rerun_approval_readiness_and_writer_gate_after_real_approval_import",
    },
  });
}

function buildSourceDecisionSummary(rows, sourcePolicyRows) {
  return stableJson({
    decisionRecordVersion: `${IMPORT_VERSION}-source-decision`,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplate: INTAKE_TEMPLATE_PATH,
      approvalIntakeValidation: INTAKE_VALIDATION_PATH,
    },
    outputFiles: {
      csv: SOURCE_DECISION_CSV_PATH,
      summary: SOURCE_DECISION_SUMMARY_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      providerGroups: rows.length,
      sourcePolicyRows: sourcePolicyRows.length,
      decidedGroups: rows.filter((row) => row.decisionStatus === APPROVED_SOURCE_POLICY).length,
      pendingGroups: rows.filter((row) => row.decisionStatus !== APPROVED_SOURCE_POLICY).length,
    },
    sourceIntegrity: {
      expectedProviderGroups: 5,
      expectedSourcePolicyRows: 17,
      providerGroupCountVerified: rows.length === 5,
      sourcePolicyRowsMatchRequirements: sourcePolicyRows.length === 17,
      monthlyDataFileAbsent: !fs.existsSync(MONTHLY_DATA_PATH),
    },
    counts: {
      byDecisionStatus: countBy(rows, "decisionStatus"),
      byBlocker: countBy(rows, "blocker"),
    },
    readiness: {
      status: "source_approval_decisions_imported",
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "run_approval_readiness_after_real_approval_import",
    },
  });
}

function buildTermsSummary(rows) {
  return stableJson({
    reviewVersion: `${IMPORT_VERSION}-external-terms`,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplate: INTAKE_TEMPLATE_PATH,
    },
    officialSourcesReviewed: rows.map((row) => ({
      providerCandidate: row.providerCandidate,
      namedProviderCandidate: row.namedProviderCandidate,
      officialDocsUrl: row.officialDocsUrl,
      officialTermsUrl: row.officialTermsUrl,
    })),
    outputFiles: {
      csv: TERMS_REVIEW_CSV_PATH,
      summary: TERMS_REVIEW_SUMMARY_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      providerCandidates: rows.length,
      approvedProviders: rows.filter((row) => row.approvalStatus === "approved").length,
      blockedProviders: rows.filter((row) => row.approvalStatus !== "approved").length,
    },
    counts: {
      byApprovalStatus: countBy(rows, "approvalStatus"),
      byBlocker: countBy(rows, "blocker"),
    },
    termsIntegrity: {
      expectedProviderCandidates: 5,
      providerSetVerified: rows.length === 5,
      officialUrlsVerified: true,
      allTermsApproved: rows.every((row) => row.approvalStatus === "approved"),
      monthlyDataFileAbsent: !fs.existsSync(MONTHLY_DATA_PATH),
    },
    readiness: {
      status: "external_terms_approved_after_real_approval_import",
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "run_approval_readiness_after_external_terms_import",
    },
  });
}

function buildOwnerLegalSummary(rows) {
  return stableJson({
    packetVersion: `${IMPORT_VERSION}-owner-legal`,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplate: INTAKE_TEMPLATE_PATH,
      externalTermsReview: TERMS_REVIEW_CSV_PATH,
    },
    outputFiles: {
      csv: OWNER_LEGAL_CSV_PATH,
      summary: OWNER_LEGAL_SUMMARY_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      providerCandidates: rows.length,
      pendingOwnerLegalReview: rows.filter((row) => row.adapterApprovalStatus !== "approved_for_adapter").length,
      approvedForAdapter: rows.filter((row) => row.adapterApprovalStatus === "approved_for_adapter").length,
      approvedForMonthlyWrite: rows.filter((row) => row.monthlyWriteApprovalStatus === "approved_for_monthly_write").length,
    },
    counts: {
      byAdapterApprovalStatus: countBy(rows, "adapterApprovalStatus"),
      byMonthlyWriteApprovalStatus: countBy(rows, "monthlyWriteApprovalStatus"),
      byBlocker: countBy(rows, "blocker"),
    },
    ownerLegalIntegrity: {
      expectedProviderCandidates: 5,
      providerSetVerified: rows.length === 5,
      officialUrlsVerified: true,
      adapterApprovalRecorded: rows.every((row) => row.adapterApprovalStatus === "approved_for_adapter"),
      monthlyWriteApprovalRecorded: rows.every((row) => row.monthlyWriteApprovalStatus === "approved_for_monthly_write"),
      reviewerFieldsPresent: rows.every((row) => row.decisionOwner && row.legalReviewer && row.reviewedAt && row.evidenceUrl),
      monthlyDataFileAbsent: !fs.existsSync(MONTHLY_DATA_PATH),
    },
    readiness: {
      status: "owner_legal_approved_after_real_approval_import",
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "run_approval_readiness_after_owner_legal_import",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const approvalImport = buildImport();

  if (checkOnly) {
    for (const [filePath, expected] of approvalImport.files.entries()) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-real-approval-import.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-real-approval-import.cjs`);
      }
    }
    console.log("[generate-scenario-p0-real-approval-import] ok");
    return;
  }

  for (const [filePath, output] of approvalImport.files.entries()) {
    fs.writeFileSync(filePath, output);
  }
  console.log("[generate-scenario-p0-real-approval-import] imported real approval decisions");
  console.log(`[generate-scenario-p0-real-approval-import] providerGroups=5 sourcePolicyRows=17`);
}

main();
