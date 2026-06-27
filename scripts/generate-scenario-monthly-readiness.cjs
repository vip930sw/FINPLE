const fs = require("node:fs");
const path = require("node:path");

const COVERAGE_PATH = path.join("data", "processed", "scenario_data_coverage.csv");
const SCHEMA_PATH = path.join("data", "processed", "scenario_monthly_returns.schema.csv");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const REPORT_PATH = path.join("data", "processed", "scenario_monthly_input_readiness.json");

const REPORT_VERSION = "scenario-monthly-readiness-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const REQUIRED_MONTHLY_COLUMNS = [
  "market",
  "ticker",
  "month",
  "priceReturn",
  "totalReturn",
  "closePrice",
  "adjustedClose",
  "dividendAmount",
  "benchmarkId",
  "benchmarkReturn",
  "fxReturn",
  "returnBasis",
  "currency",
  "isProxy",
  "proxyTicker",
  "dataSource",
  "sourceVersion",
  "seriesQuality",
  "reasonCodes",
];

const REPRESENTATIVE_TICKERS = [
  "SPY",
  "VOO",
  "IVV",
  "VTI",
  "ITOT",
  "SCHB",
  "QQQ",
  "QQQM",
  "069500",
  "102110",
  "148020",
  "105190",
  "152100",
  "278530",
];

const STATUS_FIELDS = [
  "rawCagrRecalcStatus",
  "rollingCagr10yRecalcStatus",
  "mddRecalcStatus",
  "rollingMdd10yRecalcStatus",
  "betaRecalcStatus",
  "metricsStatus",
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

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return sortObject(counts);
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function countReasonCodes(rows) {
  const counts = {};
  for (const row of rows) {
    for (const code of String(row.reasonCodes || "").split("|").filter(Boolean)) {
      counts[code] = (counts[code] || 0) + 1;
    }
  }
  return sortObject(counts);
}

function countByMarketGrade(rows) {
  const counts = {};
  for (const row of rows) {
    const market = row.market || "(blank)";
    counts[market] = counts[market] || { A: 0, B: 0, C: 0 };
    if (Object.prototype.hasOwnProperty.call(counts[market], row.scenarioGrade)) {
      counts[market][row.scenarioGrade] += 1;
    }
  }
  return sortObject(counts);
}

function getRepresentativeRows(rows) {
  const byTicker = new Map(rows.map((row) => [row.ticker, row]));
  return REPRESENTATIVE_TICKERS.map((ticker) => {
    const row = byTicker.get(ticker);
    if (!row) {
      return { ticker, status: "missing" };
    }
    return {
      market: row.market,
      ticker: row.ticker,
      scenarioGrade: row.scenarioGrade,
      dataYears: row.dataYears,
      benchmarkId: row.benchmarkId,
      rawCagrRecalcStatus: row.rawCagrRecalcStatus,
      rollingCagr10yRecalcStatus: row.rollingCagr10yRecalcStatus,
      mddRecalcStatus: row.mddRecalcStatus,
      rollingMdd10yRecalcStatus: row.rollingMdd10yRecalcStatus,
      betaRecalcStatus: row.betaRecalcStatus,
      metricsStatus: row.metricsStatus,
      reasonCodes: row.reasonCodes,
    };
  });
}

function readSchemaStatus() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    return {
      schemaPath: SCHEMA_PATH,
      schemaFilePresent: false,
      schemaColumnsMatch: false,
      schemaColumns: [],
    };
  }
  const schema = parseCsv(fs.readFileSync(SCHEMA_PATH, "utf8"), SCHEMA_PATH);
  return {
    schemaPath: SCHEMA_PATH,
    schemaFilePresent: true,
    schemaColumnsMatch: schema.headers.join(",") === REQUIRED_MONTHLY_COLUMNS.join(","),
    schemaColumns: schema.headers,
  };
}

function readMonthlyDataStatus() {
  if (!fs.existsSync(MONTHLY_DATA_PATH)) {
    return {
      dataPath: MONTHLY_DATA_PATH,
      dataFilePresent: false,
      dataRowCount: 0,
      status: "blocked_missing_monthly_return_file",
    };
  }

  const monthly = parseCsv(fs.readFileSync(MONTHLY_DATA_PATH, "utf8"), MONTHLY_DATA_PATH);
  return {
    dataPath: MONTHLY_DATA_PATH,
    dataFilePresent: true,
    dataRowCount: monthly.rows.length,
    status: monthly.rows.length > 0 ? "present_requires_validator" : "blocked_empty_monthly_return_file",
  };
}

function buildReport() {
  if (!fs.existsSync(COVERAGE_PATH)) {
    fail(`${COVERAGE_PATH} not found`);
  }
  const coverage = parseCsv(fs.readFileSync(COVERAGE_PATH, "utf8"), COVERAGE_PATH);
  const monthlyInput = {
    ...readSchemaStatus(),
    ...readMonthlyDataStatus(),
    requiredColumns: REQUIRED_MONTHLY_COLUMNS,
  };

  const recalculationStatusCounts = {};
  for (const field of STATUS_FIELDS) {
    recalculationStatusCounts[field] = countBy(coverage.rows, field);
  }

  const scenarioGradeCounts = countBy(coverage.rows, "scenarioGrade");
  const aGradeCount = scenarioGradeCounts.A || 0;
  const readyForBootstrap = aGradeCount > 0
    && monthlyInput.dataFilePresent
    && monthlyInput.dataRowCount > 0
    && monthlyInput.schemaColumnsMatch;

  return {
    reportVersion: REPORT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      coverage: COVERAGE_PATH,
      monthlySchema: SCHEMA_PATH,
      monthlyData: MONTHLY_DATA_PATH,
    },
    monthlyInput,
    coverage: {
      rowCount: coverage.rows.length,
      scenarioGradeCounts,
      marketGradeCounts: countByMarketGrade(coverage.rows),
      metricsStatusCounts: countBy(coverage.rows, "metricsStatus"),
      reasonCodeCounts: countReasonCodes(coverage.rows),
      recalculationStatusCounts,
    },
    representativeAssets: getRepresentativeRows(coverage.rows),
    readiness: {
      readyForHistoricalRolling: false,
      readyForJointBlockBootstrap: readyForBootstrap,
      readyForScenarioApi: false,
      status: readyForBootstrap
        ? "ready_requires_downstream_review"
        : "blocked_until_monthly_series_exists",
      blockers: [
        "no_committed_scenario_monthly_returns_csv",
        "no_a_grade_total_return_series",
        "benchmark_monthly_returns_not_persisted",
        "fx_monthly_returns_not_persisted",
        "dividend_time_series_not_persisted",
      ],
      nextAllowedStep: "provider_refetch_cache_or_controlled_monthly_fixture_generation",
      blockedSteps: [
        "joint_block_bootstrap",
        "scenario_api",
        "compare_chart_scenario_bands",
        "ai_scenario_integration",
      ],
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const report = buildReport();
  const output = stableJson(report);

  if (checkOnly) {
    if (!fs.existsSync(REPORT_PATH)) {
      fail(`${REPORT_PATH} not found; run node scripts/generate-scenario-monthly-readiness.cjs`);
    }
    const current = fs.readFileSync(REPORT_PATH, "utf8");
    if (current !== output) {
      fail(`${REPORT_PATH} is out of date; run node scripts/generate-scenario-monthly-readiness.cjs`);
    }
    console.log("[generate-scenario-monthly-readiness] ok");
    console.log(`[generate-scenario-monthly-readiness] report=${REPORT_PATH}`);
    console.log(`[generate-scenario-monthly-readiness] status=${report.readiness.status}`);
    return;
  }

  fs.writeFileSync(REPORT_PATH, output);
  console.log("[generate-scenario-monthly-readiness] wrote report");
  console.log(`[generate-scenario-monthly-readiness] report=${REPORT_PATH}`);
  console.log(`[generate-scenario-monthly-readiness] status=${report.readiness.status}`);
}

main();
