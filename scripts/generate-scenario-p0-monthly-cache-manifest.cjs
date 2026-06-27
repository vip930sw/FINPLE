const fs = require("node:fs");
const path = require("node:path");

const REFRESH_PLAN_PATH = path.join("data", "processed", "scenario_monthly_refetch_plan.csv");
const MANIFEST_CSV_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_manifest.csv");
const MANIFEST_JSON_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_manifest_summary.json");

const MANIFEST_VERSION = "scenario-p0-monthly-cache-manifest-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const CSV_COLUMNS = [
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

const P0_PRIORITIES = new Set(["P0_representative", "P0_benchmark", "P0_fx"]);
const P0_ORDER = new Map([
  ["P0_benchmark", 0],
  ["P0_fx", 1],
  ["P0_representative", 2],
]);

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

function buildManifestRows(planRows) {
  return planRows
    .filter((row) => P0_PRIORITIES.has(row.priority))
    .map((row) => ({
      manifestType: row.planType,
      market: row.market,
      ticker: row.ticker,
      assetType: row.assetType,
      priority: row.priority,
      targetBenchmarkId: row.targetBenchmarkId,
      requiredSeries: row.requiredSeries,
      blockedSeries: row.blockedSeries,
      sourceHint: row.sourceHint,
      outputPath: row.outputPath,
      status: row.status,
      reasonCodes: row.reasonCodes,
    }))
    .sort((left, right) => {
      const byPriority = (P0_ORDER.get(left.priority) ?? 99) - (P0_ORDER.get(right.priority) ?? 99);
      if (byPriority !== 0) {
        return byPriority;
      }
      const byMarket = left.market.localeCompare(right.market);
      if (byMarket !== 0) {
        return byMarket;
      }
      return left.ticker.localeCompare(right.ticker);
    });
}

function buildSummary(rows) {
  const representativeRows = rows.filter((row) => row.priority === "P0_representative");
  return {
    manifestVersion: MANIFEST_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      refetchPlan: REFRESH_PLAN_PATH,
    },
    outputFiles: {
      csv: MANIFEST_CSV_PATH,
      summary: MANIFEST_JSON_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      totalRows: rows.length,
      representativeAssetRows: representativeRows.length,
      benchmarkRows: rows.filter((row) => row.priority === "P0_benchmark").length,
      fxRows: rows.filter((row) => row.priority === "P0_fx").length,
    },
    counts: {
      byManifestType: countBy(rows, "manifestType"),
      byPriority: countBy(rows, "priority"),
      byStatus: countBy(rows, "status"),
      byTargetBenchmarkId: countBy(representativeRows, "targetBenchmarkId"),
    },
    representativeAssets: representativeRows.map((row) => ({
      market: row.market,
      ticker: row.ticker,
      targetBenchmarkId: row.targetBenchmarkId,
      status: row.status,
      requiredSeries: row.requiredSeries,
      blockedSeries: row.blockedSeries,
    })),
    readiness: {
      status: "p0_manifest_only_no_monthly_data_written",
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "implement_p0_provider_refetch_cache_writer_with_source_metadata",
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildManifest() {
  if (!fs.existsSync(REFRESH_PLAN_PATH)) {
    fail(`${REFRESH_PLAN_PATH} not found`);
  }
  const plan = parseCsv(fs.readFileSync(REFRESH_PLAN_PATH, "utf8"), REFRESH_PLAN_PATH);
  const rows = buildManifestRows(plan.rows);
  if (rows.length !== 17) {
    fail(`expected 17 P0 manifest rows, got ${rows.length}`);
  }
  return {
    csv: toCsv(rows),
    summary: stableJson(buildSummary(rows)),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const manifest = buildManifest();
  if (checkOnly) {
    for (const [filePath, expected] of [
      [MANIFEST_CSV_PATH, manifest.csv],
      [MANIFEST_JSON_PATH, manifest.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-monthly-cache-manifest.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-monthly-cache-manifest.cjs`);
      }
    }
    console.log("[generate-scenario-p0-monthly-cache-manifest] ok");
    console.log(`[generate-scenario-p0-monthly-cache-manifest] csv=${MANIFEST_CSV_PATH}`);
    console.log(`[generate-scenario-p0-monthly-cache-manifest] summary=${MANIFEST_JSON_PATH}`);
    return;
  }

  fs.writeFileSync(MANIFEST_CSV_PATH, manifest.csv);
  fs.writeFileSync(MANIFEST_JSON_PATH, manifest.summary);
  console.log("[generate-scenario-p0-monthly-cache-manifest] wrote manifest");
  console.log(`[generate-scenario-p0-monthly-cache-manifest] csv=${MANIFEST_CSV_PATH}`);
  console.log(`[generate-scenario-p0-monthly-cache-manifest] summary=${MANIFEST_JSON_PATH}`);
}

main();
