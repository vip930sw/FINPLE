const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const SOURCE_POLICY_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix_summary.json");
const EXTERNAL_TERMS_CSV_PATH = path.join("data", "processed", "scenario_p0_external_provider_terms_review.csv");
const OWNER_LEGAL_CSV_PATH = path.join("data", "processed", "scenario_p0_owner_legal_decision_packet.csv");
const WRITER_GATE_PATH = path.join("data", "processed", "scenario_p0_cache_writer_gate.json");
const APPROVAL_READINESS_PATH = path.join("data", "processed", "scenario_p0_approval_readiness.json");

const REPORT_VERSION = "scenario-p0-approval-readiness-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

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

function parseCsv(text, filePath) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return parseCsv(fs.readFileSync(filePath, "utf8"), filePath);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildReport() {
  const sourcePolicy = readCsv(SOURCE_POLICY_CSV_PATH);
  const sourcePolicySummary = readJson(SOURCE_POLICY_SUMMARY_PATH);
  const externalTerms = readCsv(EXTERNAL_TERMS_CSV_PATH);
  const ownerLegal = readCsv(OWNER_LEGAL_CSV_PATH);
  const writerGate = readJson(WRITER_GATE_PATH);

  const sourceProviderCandidates = uniqueSorted(sourcePolicy.rows.map((row) => row.providerCandidate));
  const termsProviderCandidates = uniqueSorted(externalTerms.rows.map((row) => row.providerCandidate));
  const ownerLegalProviderCandidates = uniqueSorted(ownerLegal.rows.map((row) => row.providerCandidate));
  const writerGateProviderCandidates = uniqueSorted(Object.keys(writerGate.counts?.byProviderCandidate ?? {}));

  for (const [label, candidates] of [
    ["external terms", termsProviderCandidates],
    ["owner/legal packet", ownerLegalProviderCandidates],
    ["writer gate", writerGateProviderCandidates],
  ]) {
    if (!arraysEqual(sourceProviderCandidates, candidates)) {
      fail(`providerCandidate mismatch between source policy and ${label}`);
    }
  }

  const termsApproved = externalTerms.rows.filter((row) => row.approvalStatus === "approved").length;
  const ownerAdapterApproved = ownerLegal.rows.filter((row) => row.adapterApprovalStatus === "approved_for_adapter").length;
  const ownerMonthlyApproved = ownerLegal.rows.filter(
    (row) => row.monthlyWriteApprovalStatus === "approved_for_monthly_write",
  ).length;
  const sourcePolicyApproved = sourcePolicy.rows.filter((row) => row.status === "approved_source_policy").length;
  const writerCanWrite = writerGate.readiness?.canWriteMonthlyData === true;
  const writerProviderCallsAllowed = writerGate.readiness?.providerCallsAllowed === true;

  const blockers = [];
  if (termsApproved !== externalTerms.rows.length) {
    blockers.push("external_provider_terms_not_fully_approved");
  }
  if (ownerAdapterApproved !== ownerLegal.rows.length) {
    blockers.push("owner_legal_adapter_approval_not_complete");
  }
  if (ownerMonthlyApproved !== ownerLegal.rows.length) {
    blockers.push("owner_legal_monthly_write_approval_not_complete");
  }
  if (sourcePolicyApproved !== sourcePolicy.rows.length) {
    blockers.push("source_policy_rows_not_approved");
  }
  if (!writerCanWrite) {
    blockers.push("writer_gate_cannot_write_monthly_data");
  }
  if (!writerProviderCallsAllowed) {
    blockers.push("writer_gate_provider_calls_not_allowed");
  }

  const safeToImplementProviderAdapter =
    termsApproved === externalTerms.rows.length &&
    ownerAdapterApproved === ownerLegal.rows.length &&
    sourcePolicyApproved === sourcePolicy.rows.length;
  const safeToWriteMonthlyData =
    safeToImplementProviderAdapter && ownerMonthlyApproved === ownerLegal.rows.length && writerCanWrite;

  if (!safeToImplementProviderAdapter && writerProviderCallsAllowed) {
    fail("writer gate allows provider calls before terms, owner/legal, and source policy approvals are complete");
  }
  if (!safeToWriteMonthlyData && writerCanWrite) {
    fail("writer gate allows monthly data writes before all approval readiness checks are complete");
  }

  return stableJson({
    reportVersion: REPORT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      sourcePolicySummary: SOURCE_POLICY_SUMMARY_PATH,
      externalTermsReview: EXTERNAL_TERMS_CSV_PATH,
      ownerLegalDecisionPacket: OWNER_LEGAL_CSV_PATH,
      writerGate: WRITER_GATE_PATH,
    },
    outputFiles: {
      report: APPROVAL_READINESS_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    providerCandidates: sourceProviderCandidates,
    rowCounts: {
      providerCandidates: sourceProviderCandidates.length,
      sourcePolicyRows: sourcePolicy.rows.length,
      externalTermsRows: externalTerms.rows.length,
      ownerLegalRows: ownerLegal.rows.length,
      writerGateRows: writerGate.rowCounts?.totalRows ?? null,
      termsApproved,
      ownerAdapterApproved,
      ownerMonthlyApproved,
      sourcePolicyApproved,
    },
    counts: {
      sourcePolicyByStatus: countBy(sourcePolicy.rows, "status"),
      termsByApprovalStatus: countBy(externalTerms.rows, "approvalStatus"),
      ownerByAdapterApprovalStatus: countBy(ownerLegal.rows, "adapterApprovalStatus"),
      ownerByMonthlyWriteApprovalStatus: countBy(ownerLegal.rows, "monthlyWriteApprovalStatus"),
      writerGateByStatus: writerGate.counts?.byStatus ?? {},
      sourcePolicyByProviderCandidate: sourcePolicySummary.counts?.byProviderCandidate ?? {},
    },
    readiness: {
      status: safeToWriteMonthlyData ? "ready_for_p0_monthly_cache_write" : "blocked_pending_p0_approvals",
      safeToImplementProviderAdapter,
      safeToWriteMonthlyData,
      providerCallsAllowed: writerProviderCallsAllowed,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: !safeToWriteMonthlyData,
      blockers,
      nextAllowedStep: safeToWriteMonthlyData
        ? "implement_controlled_p0_provider_adapter_and_monthly_cache_writer"
        : "complete_owner_legal_terms_and_source_policy_approvals_before_adapter_or_write",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const report = buildReport();

  if (checkOnly) {
    if (!fs.existsSync(APPROVAL_READINESS_PATH)) {
      fail(`${APPROVAL_READINESS_PATH} not found; run node scripts/generate-scenario-p0-approval-readiness.cjs`);
    }
    const current = fs.readFileSync(APPROVAL_READINESS_PATH, "utf8");
    if (current !== report) {
      fail(`${APPROVAL_READINESS_PATH} is out of date; run node scripts/generate-scenario-p0-approval-readiness.cjs`);
    }
    console.log("[generate-scenario-p0-approval-readiness] ok");
    console.log(`[generate-scenario-p0-approval-readiness] report=${APPROVAL_READINESS_PATH}`);
    return;
  }

  fs.writeFileSync(APPROVAL_READINESS_PATH, report);
  console.log("[generate-scenario-p0-approval-readiness] wrote report");
  console.log(`[generate-scenario-p0-approval-readiness] report=${APPROVAL_READINESS_PATH}`);
}

main();
