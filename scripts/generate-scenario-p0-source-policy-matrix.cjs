const fs = require("node:fs");
const path = require("node:path");

const DRY_RUN_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_dry_run.json");
const MATRIX_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const MATRIX_JSON_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix_summary.json");

const MATRIX_VERSION = "scenario-p0-source-policy-matrix-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const CSV_COLUMNS = [
  "manifestType",
  "market",
  "ticker",
  "providerCandidate",
  "endpointPolicy",
  "licensePolicy",
  "rawPayloadStorage",
  "redistributionPolicy",
  "requiredApproval",
  "status",
  "blocker",
  "sourceMetadataRequired",
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

function providerCandidateForTask(task) {
  if (task.manifestType === "benchmark" && task.market === "US") {
    return "SP500_TR_primary_or_SPY_adjusted_close_proxy";
  }
  if (task.manifestType === "benchmark" && task.market === "KR") {
    return "KOSPI200_TR_primary_or_kospi200_etf_proxy";
  }
  if (task.manifestType === "fx") {
    return "USD_KRW_fx_provider";
  }
  if (task.market === "US") {
    return "US_price_total_return_dividend_provider";
  }
  if (task.market === "KR") {
    return "KR_price_total_return_dividend_provider";
  }
  return "provider_policy_review_required";
}

function makeMatrixRows(dryRun) {
  return dryRun.providerTasks.map((task) => ({
    manifestType: task.manifestType,
    market: task.market,
    ticker: task.ticker,
    providerCandidate: providerCandidateForTask(task),
    endpointPolicy: "not_selected",
    licensePolicy: "not_reviewed",
    rawPayloadStorage: "hash_only_until_policy_approved",
    redistributionPolicy: "monthly_derived_returns_only_after_license_review",
    requiredApproval: "source_license_refresh_policy",
    status: "blocked_source_policy_review",
    blocker: "provider_endpoint_and_license_policy_not_approved",
    sourceMetadataRequired: task.sourceMetadataRequired.join("|"),
  }));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildMatrix() {
  if (!fs.existsSync(DRY_RUN_PATH)) {
    fail(`${DRY_RUN_PATH} not found`);
  }
  const dryRun = JSON.parse(fs.readFileSync(DRY_RUN_PATH, "utf8"));
  if (!Array.isArray(dryRun.providerTasks) || dryRun.providerTasks.length !== 17) {
    fail(`${DRY_RUN_PATH} must contain 17 providerTasks`);
  }
  const rows = makeMatrixRows(dryRun);
  return {
    csv: toCsv(rows),
    summary: stableJson({
      matrixVersion: MATRIX_VERSION,
      auditedAt: AUDITED_AT,
      sourceFiles: {
        dryRun: DRY_RUN_PATH,
      },
      outputFiles: {
        csv: MATRIX_CSV_PATH,
        summary: MATRIX_JSON_PATH,
        monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
      },
      rowCounts: {
        totalRows: rows.length,
        assetRows: rows.filter((row) => row.manifestType === "asset").length,
        benchmarkRows: rows.filter((row) => row.manifestType === "benchmark").length,
        fxRows: rows.filter((row) => row.manifestType === "fx").length,
      },
      counts: {
        byManifestType: countBy(rows, "manifestType"),
        byProviderCandidate: countBy(rows, "providerCandidate"),
        byStatus: countBy(rows, "status"),
        byRequiredApproval: countBy(rows, "requiredApproval"),
      },
      readiness: {
        status: "blocked_source_policy_review",
        providerEndpointSelected: false,
        licensePolicyReviewed: false,
        monthlyDataFileWritten: false,
        bootstrapStillBlocked: true,
        nextAllowedStep: "approve_p0_source_policy_before_provider_adapter",
      },
    }),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const matrix = buildMatrix();
  if (checkOnly) {
    for (const [filePath, expected] of [
      [MATRIX_CSV_PATH, matrix.csv],
      [MATRIX_JSON_PATH, matrix.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-source-policy-matrix.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-source-policy-matrix.cjs`);
      }
    }
    console.log("[generate-scenario-p0-source-policy-matrix] ok");
    console.log(`[generate-scenario-p0-source-policy-matrix] csv=${MATRIX_CSV_PATH}`);
    console.log(`[generate-scenario-p0-source-policy-matrix] summary=${MATRIX_JSON_PATH}`);
    return;
  }

  fs.writeFileSync(MATRIX_CSV_PATH, matrix.csv);
  fs.writeFileSync(MATRIX_JSON_PATH, matrix.summary);
  console.log("[generate-scenario-p0-source-policy-matrix] wrote matrix");
  console.log(`[generate-scenario-p0-source-policy-matrix] csv=${MATRIX_CSV_PATH}`);
  console.log(`[generate-scenario-p0-source-policy-matrix] summary=${MATRIX_JSON_PATH}`);
}

main();
