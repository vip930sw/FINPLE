const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const SOURCE_POLICY_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix_summary.json");
const WRITER_GATE_PATH = path.join("data", "processed", "scenario_p0_cache_writer_gate.json");
const MONTHLY_DATA_TARGET = path.join("data", "processed", "scenario_monthly_returns.csv");

const GATE_VERSION = "scenario-p0-cache-writer-gate-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";
const APPROVED_STATUS = "approved_source_policy";

function fail(message) {
  throw new Error(message);
}

function parseCsv(text, filePath) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length < 2) {
    fail(`${filePath} must contain a header and at least one data row`);
  }

  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line, lineIndex) => {
    const values = line.split(",");
    if (values.length !== headers.length) {
      fail(`${filePath}:${lineIndex + 2} has ${values.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
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

function buildGate() {
  if (!fs.existsSync(SOURCE_POLICY_CSV_PATH)) {
    fail(`${SOURCE_POLICY_CSV_PATH} not found`);
  }
  if (!fs.existsSync(SOURCE_POLICY_SUMMARY_PATH)) {
    fail(`${SOURCE_POLICY_SUMMARY_PATH} not found`);
  }

  const matrix = parseCsv(fs.readFileSync(SOURCE_POLICY_CSV_PATH, "utf8"), SOURCE_POLICY_CSV_PATH);
  const summary = JSON.parse(fs.readFileSync(SOURCE_POLICY_SUMMARY_PATH, "utf8"));
  const rows = matrix.rows;
  if (rows.length !== 17) {
    fail(`${SOURCE_POLICY_CSV_PATH} must contain 17 P0 rows, got ${rows.length}`);
  }

  const approvedRows = rows.filter((row) => row.status === APPROVED_STATUS);
  const blockedRows = rows.filter((row) => row.status !== APPROVED_STATUS);
  const canWriteMonthlyData = blockedRows.length === 0;

  return {
    gateVersion: GATE_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      sourcePolicySummary: SOURCE_POLICY_SUMMARY_PATH,
    },
    outputFiles: {
      gate: WRITER_GATE_PATH,
      monthlyDataTarget: MONTHLY_DATA_TARGET.replace(/\\/g, "/"),
    },
    sourcePolicyVersion: summary.matrixVersion,
    rowCounts: {
      totalRows: rows.length,
      approvedRows: approvedRows.length,
      blockedRows: blockedRows.length,
      assetRows: rows.filter((row) => row.manifestType === "asset").length,
      benchmarkRows: rows.filter((row) => row.manifestType === "benchmark").length,
      fxRows: rows.filter((row) => row.manifestType === "fx").length,
    },
    counts: {
      byManifestType: countBy(rows, "manifestType"),
      byStatus: countBy(rows, "status"),
      byBlocker: countBy(rows, "blocker"),
      byProviderCandidate: countBy(rows, "providerCandidate"),
    },
    blockedRows: blockedRows.map((row) => ({
      manifestType: row.manifestType,
      market: row.market,
      ticker: row.ticker,
      providerCandidate: row.providerCandidate,
      status: row.status,
      blocker: row.blocker,
      requiredApproval: row.requiredApproval,
    })),
    readiness: {
      status: canWriteMonthlyData ? "ready_to_write_p0_monthly_cache" : "blocked_source_policy_review",
      canWriteMonthlyData,
      monthlyDataFileWritten: false,
      providerCallsAllowed: canWriteMonthlyData,
      bootstrapStillBlocked: true,
      nextAllowedStep: canWriteMonthlyData
        ? "implement_provider_adapter_and_write_p0_monthly_cache"
        : "approve_p0_source_policy_before_provider_adapter",
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const output = stableJson(buildGate());

  if (checkOnly) {
    if (!fs.existsSync(WRITER_GATE_PATH)) {
      fail(`${WRITER_GATE_PATH} not found; run node scripts/generate-scenario-p0-cache-writer-gate.cjs`);
    }
    const current = fs.readFileSync(WRITER_GATE_PATH, "utf8");
    if (current !== output) {
      fail(`${WRITER_GATE_PATH} is out of date; run node scripts/generate-scenario-p0-cache-writer-gate.cjs`);
    }
    console.log("[generate-scenario-p0-cache-writer-gate] ok");
    console.log(`[generate-scenario-p0-cache-writer-gate] gate=${WRITER_GATE_PATH}`);
    return;
  }

  fs.writeFileSync(WRITER_GATE_PATH, output);
  console.log("[generate-scenario-p0-cache-writer-gate] wrote gate");
  console.log(`[generate-scenario-p0-cache-writer-gate] gate=${WRITER_GATE_PATH}`);
}

main();
