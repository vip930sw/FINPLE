const fs = require("node:fs");
const path = require("node:path");

const MANIFEST_CSV_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_manifest.csv");
const MONTHLY_SCHEMA_PATH = path.join("data", "processed", "scenario_monthly_returns.schema.csv");
const DRY_RUN_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_dry_run.json");
const MONTHLY_DATA_TARGET = path.join("data", "processed", "scenario_monthly_returns.csv");

const DRY_RUN_VERSION = "scenario-p0-monthly-cache-dry-run-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const REQUIRED_MANIFEST_COLUMNS = [
  "manifestType",
  "market",
  "ticker",
  "assetType",
  "priority",
  "targetBenchmarkId",
  "requiredSeries",
  "blockedSeries",
  "sourceHint",
  "outputPath",
  "status",
  "reasonCodes",
];

function fail(message) {
  throw new Error(message);
}

function parseCsv(text, filePath) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length === 0 || lines[0].trim() === "") {
    fail(`${filePath} must contain a header`);
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

function assertExactHeader(headers, expectedHeaders, filePath) {
  const actual = headers.join(",");
  const expected = expectedHeaders.join(",");
  if (actual !== expected) {
    fail(`${filePath} header mismatch\nexpected: ${expected}\nactual:   ${actual}`);
  }
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

function splitPipe(value) {
  return String(value || "").split("|").filter(Boolean);
}

function validateManifestRows(rows) {
  const errors = [];
  const seenKeys = new Set();
  for (const [index, row] of rows.entries()) {
    const line = index + 2;
    const key = `${row.manifestType}:${row.market}:${row.ticker}`;
    if (seenKeys.has(key)) {
      errors.push(`${MANIFEST_CSV_PATH}:${line} duplicate manifest key ${key}`);
    }
    seenKeys.add(key);
    if (row.outputPath !== MONTHLY_DATA_TARGET.replace(/\\/g, "/")) {
      errors.push(`${MANIFEST_CSV_PATH}:${line} outputPath must remain ${MONTHLY_DATA_TARGET.replace(/\\/g, "/")}`);
    }
    if (!row.requiredSeries) {
      errors.push(`${MANIFEST_CSV_PATH}:${line} requiredSeries must not be empty`);
    }
    if (!row.sourceHint) {
      errors.push(`${MANIFEST_CSV_PATH}:${line} sourceHint must not be empty`);
    }
  }

  for (const requiredKey of ["benchmark:KR:KOSPI200_TR", "benchmark:US:SP500_TR", "fx:FX:USD_KRW"]) {
    if (!seenKeys.has(requiredKey)) {
      errors.push(`${MANIFEST_CSV_PATH} missing required P0 row ${requiredKey}`);
    }
  }
  if (rows.length !== 17) {
    errors.push(`${MANIFEST_CSV_PATH} must contain exactly 17 P0 rows, got ${rows.length}`);
  }

  if (errors.length > 0) {
    fail(errors.join("\n"));
  }
}

function buildProviderTasks(rows) {
  return rows.map((row) => ({
    manifestType: row.manifestType,
    market: row.market,
    ticker: row.ticker,
    priority: row.priority,
    targetBenchmarkId: row.targetBenchmarkId,
    requiredSeries: splitPipe(row.requiredSeries),
    blockedSeries: splitPipe(row.blockedSeries),
    sourceHint: splitPipe(row.sourceHint),
    status: row.status,
    action: "dry_run_only_no_provider_call",
    monthlyDataOutput: MONTHLY_DATA_TARGET.replace(/\\/g, "/"),
    sourceMetadataRequired: [
      "providerName",
      "providerEndpoint",
      "requestedAt",
      "rawPayloadHash",
      "licensePolicy",
      "sourceVersion",
    ],
  }));
}

function buildDryRun() {
  if (!fs.existsSync(MANIFEST_CSV_PATH)) {
    fail(`${MANIFEST_CSV_PATH} not found`);
  }
  if (!fs.existsSync(MONTHLY_SCHEMA_PATH)) {
    fail(`${MONTHLY_SCHEMA_PATH} not found`);
  }

  const manifest = parseCsv(fs.readFileSync(MANIFEST_CSV_PATH, "utf8"), MANIFEST_CSV_PATH);
  assertExactHeader(manifest.headers, REQUIRED_MANIFEST_COLUMNS, MANIFEST_CSV_PATH);
  validateManifestRows(manifest.rows);

  const monthlySchema = parseCsv(fs.readFileSync(MONTHLY_SCHEMA_PATH, "utf8"), MONTHLY_SCHEMA_PATH);
  if (monthlySchema.rows.length !== 0) {
    fail(`${MONTHLY_SCHEMA_PATH} must remain header-only`);
  }

  const providerTasks = buildProviderTasks(manifest.rows);
  return {
    dryRunVersion: DRY_RUN_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      manifest: MANIFEST_CSV_PATH,
      monthlySchema: MONTHLY_SCHEMA_PATH,
    },
    outputFiles: {
      dryRun: DRY_RUN_PATH,
      monthlyDataTarget: MONTHLY_DATA_TARGET.replace(/\\/g, "/"),
    },
    rowCounts: {
      totalTasks: providerTasks.length,
      assetTasks: providerTasks.filter((task) => task.manifestType === "asset").length,
      benchmarkTasks: providerTasks.filter((task) => task.manifestType === "benchmark").length,
      fxTasks: providerTasks.filter((task) => task.manifestType === "fx").length,
    },
    counts: {
      byManifestType: countBy(providerTasks, "manifestType"),
      byPriority: countBy(providerTasks, "priority"),
      byStatus: countBy(providerTasks, "status"),
      byTargetBenchmarkId: countBy(providerTasks, "targetBenchmarkId"),
    },
    monthlySchemaColumns: monthlySchema.headers,
    providerTasks,
    readiness: {
      status: "dry_run_only_no_provider_call",
      providerCallsMade: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "replace_dry_run_tasks_with_provider_adapter_after_source_policy_review",
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const output = stableJson(buildDryRun());

  if (checkOnly) {
    if (!fs.existsSync(DRY_RUN_PATH)) {
      fail(`${DRY_RUN_PATH} not found; run node scripts/generate-scenario-p0-cache-dry-run.cjs`);
    }
    const current = fs.readFileSync(DRY_RUN_PATH, "utf8");
    if (current !== output) {
      fail(`${DRY_RUN_PATH} is out of date; run node scripts/generate-scenario-p0-cache-dry-run.cjs`);
    }
    console.log("[generate-scenario-p0-cache-dry-run] ok");
    console.log(`[generate-scenario-p0-cache-dry-run] dryRun=${DRY_RUN_PATH}`);
    return;
  }

  fs.writeFileSync(DRY_RUN_PATH, output);
  console.log("[generate-scenario-p0-cache-dry-run] wrote dry run");
  console.log(`[generate-scenario-p0-cache-dry-run] dryRun=${DRY_RUN_PATH}`);
}

main();
