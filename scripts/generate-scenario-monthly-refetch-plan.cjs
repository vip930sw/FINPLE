const fs = require("node:fs");
const path = require("node:path");

const COVERAGE_PATH = path.join("data", "processed", "scenario_data_coverage.csv");
const READINESS_PATH = path.join("data", "processed", "scenario_monthly_input_readiness.json");
const PLAN_CSV_PATH = path.join("data", "processed", "scenario_monthly_refetch_plan.csv");
const PLAN_JSON_PATH = path.join("data", "processed", "scenario_monthly_refetch_plan_summary.json");

const PLAN_VERSION = "scenario-monthly-refetch-plan-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const CSV_COLUMNS = [
  "planType",
  "market",
  "ticker",
  "assetType",
  "priority",
  "scenarioGrade",
  "metricsStatus",
  "targetBenchmarkId",
  "requiredSeries",
  "blockedSeries",
  "sourceHint",
  "outputPath",
  "status",
  "reasonCodes",
];

const REPRESENTATIVE_TICKERS = new Set([
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
]);

const KOSPI200_REPRESENTATIVE_TICKERS = new Set([
  "069500",
  "102110",
  "148020",
  "105190",
  "152100",
  "278530",
]);

const PRIORITY_RANK = new Map([
  ["P0_representative", 0],
  ["P1_ready_overlay", 1],
  ["P2_short_history", 2],
  ["P3_review_required", 3],
  ["blocked_no_price_series", 4],
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

function getTargetBenchmarkId(row) {
  if (row.market === "US") {
    return "SP500_TR";
  }
  if (KOSPI200_REPRESENTATIVE_TICKERS.has(row.ticker)) {
    return "KOSPI200_TR";
  }
  return "KR_BENCHMARK_POLICY_REVIEW";
}

function getPriority(row) {
  if (REPRESENTATIVE_TICKERS.has(row.ticker)) {
    return "P0_representative";
  }
  if (row.scenarioGrade === "B" && row.metricsStatus === "ready") {
    return "P1_ready_overlay";
  }
  if (row.scenarioGrade === "B" && row.metricsStatus === "short_history") {
    return "P2_short_history";
  }
  if (row.scenarioGrade === "B") {
    return "P3_review_required";
  }
  return "blocked_no_price_series";
}

function getRequiredSeries(row) {
  if (row.scenarioGrade === "C") {
    return [];
  }

  const required = ["monthly_price_return", "monthly_close_price"];
  required.push("monthly_total_return");
  required.push("monthly_dividend_amount");
  required.push("monthly_benchmark_return");
  if (row.fxSeriesRequired === "yes") {
    required.push("monthly_fx_return_usd_krw");
  }
  return required;
}

function getBlockedSeries(row) {
  const blocked = [];
  if (row.scenarioGrade === "C") {
    blocked.push("asset_price_provider_evidence");
  }
  if (row.totalReturnSeriesAvailable === "no") {
    blocked.push("monthly_total_return");
  }
  if (row.dividendSeriesAvailable === "no" || row.dividendSeriesAvailable === "yield_only") {
    blocked.push("monthly_dividend_amount");
  }
  if (row.fxSeriesRequired === "yes" && row.fxSeriesAvailable === "no") {
    blocked.push("monthly_fx_return_usd_krw");
  }
  if (row.betaRecalcStatus === "blocked_policy_benchmark_should_be_kospi200") {
    blocked.push("kospi200_benchmark_policy");
  }
  if (row.benchmarkId === "" || row.betaRecalcStatus === "blocked_missing_beta_or_benchmark") {
    blocked.push("monthly_benchmark_return");
  }
  return Array.from(new Set(blocked));
}

function getAssetStatus(row) {
  if (row.scenarioGrade === "C") {
    return "blocked_no_price_series_evidence";
  }
  if (row.betaRecalcStatus === "blocked_policy_benchmark_should_be_kospi200") {
    return "blocked_benchmark_policy";
  }
  return "provider_refetch_required";
}

function makeAssetPlanRows(coverageRows) {
  return coverageRows
    .map((row) => ({
      planType: "asset",
      market: row.market,
      ticker: row.ticker,
      assetType: row.assetType,
      priority: getPriority(row),
      scenarioGrade: row.scenarioGrade,
      metricsStatus: row.metricsStatus,
      targetBenchmarkId: getTargetBenchmarkId(row),
      requiredSeries: getRequiredSeries(row).join("|"),
      blockedSeries: getBlockedSeries(row).join("|"),
      sourceHint: row.dataSource || "no_source_hint",
      outputPath: "data/processed/scenario_monthly_returns.csv",
      status: getAssetStatus(row),
      reasonCodes: row.reasonCodes,
    }))
    .sort((left, right) => {
      const byPriority = (PRIORITY_RANK.get(left.priority) ?? 99) - (PRIORITY_RANK.get(right.priority) ?? 99);
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

function makeSystemRows() {
  return [
    {
      planType: "benchmark",
      market: "US",
      ticker: "SP500_TR",
      assetType: "benchmark",
      priority: "P0_benchmark",
      scenarioGrade: "required",
      metricsStatus: "missing",
      targetBenchmarkId: "SP500_TR",
      requiredSeries: "monthly_benchmark_return",
      blockedSeries: "benchmark_total_return_series_not_committed",
      sourceHint: "SP500_TR_or_SPY_adjusted_close_refetch_policy_required",
      outputPath: "data/processed/scenario_monthly_returns.csv",
      status: "provider_refetch_required",
      reasonCodes: "benchmark_monthly_returns_not_persisted",
    },
    {
      planType: "benchmark",
      market: "KR",
      ticker: "KOSPI200_TR",
      assetType: "benchmark",
      priority: "P0_benchmark",
      scenarioGrade: "required",
      metricsStatus: "missing",
      targetBenchmarkId: "KOSPI200_TR",
      requiredSeries: "monthly_benchmark_return",
      blockedSeries: "benchmark_total_return_series_not_committed",
      sourceHint: "KOSPI200_TR_or_representative_etf_proxy_refetch_policy_required",
      outputPath: "data/processed/scenario_monthly_returns.csv",
      status: "provider_refetch_required",
      reasonCodes: "benchmark_monthly_returns_not_persisted|kr_kospi200_policy_required",
    },
    {
      planType: "fx",
      market: "FX",
      ticker: "USD_KRW",
      assetType: "fx",
      priority: "P0_fx",
      scenarioGrade: "required",
      metricsStatus: "missing",
      targetBenchmarkId: "",
      requiredSeries: "monthly_fx_return_usd_krw",
      blockedSeries: "fx_series_not_committed",
      sourceHint: "USD_KRW_provider_refetch_policy_required",
      outputPath: "data/processed/scenario_monthly_returns.csv",
      status: "provider_refetch_required",
      reasonCodes: "fx_required_for_krw_mode_but_no_fx_series_committed",
    },
  ];
}

function buildSummary(planRows, coverageRows) {
  const assetRows = planRows.filter((row) => row.planType === "asset");
  const representativeRows = assetRows.filter((row) => REPRESENTATIVE_TICKERS.has(row.ticker));
  return {
    planVersion: PLAN_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      coverage: COVERAGE_PATH,
      readiness: READINESS_PATH,
    },
    outputFiles: {
      csv: PLAN_CSV_PATH,
      summary: PLAN_JSON_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      totalPlanRows: planRows.length,
      assetRows: assetRows.length,
      systemRows: planRows.length - assetRows.length,
      representativeAssetRows: representativeRows.length,
    },
    coverageCounts: {
      scenarioGrade: countBy(coverageRows, "scenarioGrade"),
      metricsStatus: countBy(coverageRows, "metricsStatus"),
      betaRecalcStatus: countBy(coverageRows, "betaRecalcStatus"),
    },
    planCounts: {
      byPlanType: countBy(planRows, "planType"),
      byPriority: countBy(planRows, "priority"),
      byStatus: countBy(planRows, "status"),
      byTargetBenchmarkId: countBy(assetRows, "targetBenchmarkId"),
    },
    representativeAssets: representativeRows.map((row) => ({
      market: row.market,
      ticker: row.ticker,
      priority: row.priority,
      scenarioGrade: row.scenarioGrade,
      targetBenchmarkId: row.targetBenchmarkId,
      status: row.status,
      blockedSeries: row.blockedSeries,
    })),
    readiness: {
      status: "provider_refetch_plan_only_no_data_written",
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "implement_provider_refetch_cache_writer_with_source_metadata",
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildPlan() {
  if (!fs.existsSync(COVERAGE_PATH)) {
    fail(`${COVERAGE_PATH} not found`);
  }
  if (!fs.existsSync(READINESS_PATH)) {
    fail(`${READINESS_PATH} not found`);
  }
  const coverage = parseCsv(fs.readFileSync(COVERAGE_PATH, "utf8"), COVERAGE_PATH);
  const planRows = [...makeSystemRows(), ...makeAssetPlanRows(coverage.rows)];
  return {
    csv: toCsv(planRows),
    summary: stableJson(buildSummary(planRows, coverage.rows)),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const plan = buildPlan();
  if (checkOnly) {
    for (const [filePath, expected] of [
      [PLAN_CSV_PATH, plan.csv],
      [PLAN_JSON_PATH, plan.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-monthly-refetch-plan.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-monthly-refetch-plan.cjs`);
      }
    }
    console.log("[generate-scenario-monthly-refetch-plan] ok");
    console.log(`[generate-scenario-monthly-refetch-plan] csv=${PLAN_CSV_PATH}`);
    console.log(`[generate-scenario-monthly-refetch-plan] summary=${PLAN_JSON_PATH}`);
    return;
  }

  fs.writeFileSync(PLAN_CSV_PATH, plan.csv);
  fs.writeFileSync(PLAN_JSON_PATH, plan.summary);
  console.log("[generate-scenario-monthly-refetch-plan] wrote plan");
  console.log(`[generate-scenario-monthly-refetch-plan] csv=${PLAN_CSV_PATH}`);
  console.log(`[generate-scenario-monthly-refetch-plan] summary=${PLAN_JSON_PATH}`);
}

main();
