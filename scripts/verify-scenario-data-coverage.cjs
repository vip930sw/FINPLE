const fs = require("node:fs");
const path = require("node:path");

const CSV_PATH = path.join("data", "processed", "scenario_data_coverage.csv");
const INVENTORY_PATH = path.join("docs", "portfolio-ml", "FINPLE_SCENARIO_DATA_INVENTORY.md");
const AUDIT_PATH = path.join("docs", "portfolio-ml", "FINPLE_METRICS_RECALCULATION_INPUT_AUDIT.md");

const REQUIRED_COLUMNS = [
  "ticker",
  "market",
  "assetType",
  "currency",
  "priceSeriesAvailable",
  "totalReturnSeriesAvailable",
  "dividendSeriesAvailable",
  "dataStart",
  "dataEnd",
  "dataYears",
  "observationFrequency",
  "benchmarkId",
  "fxSeriesRequired",
  "fxSeriesAvailable",
  "isProxy",
  "proxyTicker",
  "dataSource",
  "scenarioGrade",
  "rawCagrRecalcStatus",
  "rollingCagr10yRecalcStatus",
  "mddRecalcStatus",
  "rollingMdd10yRecalcStatus",
  "betaRecalcStatus",
  "metricsStatus",
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

const KR_KOSPI200_REPRESENTATIVES = new Set([
  "069500",
  "102110",
  "148020",
  "105190",
  "152100",
  "278530",
]);

function fail(message) {
  throw new Error(message);
}

function parseCsv(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length < 2) {
    fail(`${CSV_PATH} must contain a header and at least one data row`);
  }

  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line, lineIndex) => {
    const values = line.split(",");
    if (values.length !== headers.length) {
      fail(`${CSV_PATH}:${lineIndex + 2} has ${values.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { headers, rows };
}

function countBy(rows, field) {
  return rows.reduce((counts, row) => {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function requireDocText(filePath, expectedSnippets) {
  const text = fs.readFileSync(filePath, "utf8");
  for (const snippet of expectedSnippets) {
    if (!text.includes(snippet)) {
      fail(`${filePath} must include: ${snippet}`);
    }
  }
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    fail(`${CSV_PATH} not found`);
  }

  const { headers, rows } = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
  const errors = [];
  const warn = (message) => errors.push(message);

  if (rows.length !== 6000) {
    warn(`expected 6000 coverage rows, got ${rows.length}`);
  }

  for (const column of REQUIRED_COLUMNS) {
    if (!headers.includes(column)) {
      warn(`missing required column: ${column}`);
    }
  }

  const seenKeys = new Set();
  const representativeRows = new Map();
  const gradeCounts = { A: 0, B: 0, C: 0 };
  const marketGradeCounts = {};

  rows.forEach((row, index) => {
    const line = index + 2;
    const key = `${row.market}:${row.ticker}`;
    if (seenKeys.has(key)) {
      warn(`${CSV_PATH}:${line} duplicate market/ticker key: ${key}`);
    }
    seenKeys.add(key);

    if (!["US", "KR"].includes(row.market)) {
      warn(`${CSV_PATH}:${line} market must be US or KR: ${row.market}`);
    }

    if (!["A", "B", "C"].includes(row.scenarioGrade)) {
      warn(`${CSV_PATH}:${line} invalid scenarioGrade: ${row.scenarioGrade}`);
    } else {
      gradeCounts[row.scenarioGrade] += 1;
      const marketGradeKey = `${row.market}:${row.scenarioGrade}`;
      marketGradeCounts[marketGradeKey] = (marketGradeCounts[marketGradeKey] || 0) + 1;
    }

    if (row.scenarioGrade === "A" && row.totalReturnSeriesAvailable === "no") {
      warn(`${CSV_PATH}:${line} grade A requires total-return series evidence`);
    }

    if (row.scenarioGrade === "B" && row.priceSeriesAvailable === "no") {
      warn(`${CSV_PATH}:${line} grade B requires price/provider evidence`);
    }

    if (row.scenarioGrade === "C" && row.priceSeriesAvailable !== "no") {
      warn(`${CSV_PATH}:${line} grade C must not claim price series evidence`);
    }

    if (row.totalReturnSeriesAvailable === "0" || row.fxSeriesAvailable === "0") {
      warn(`${CSV_PATH}:${line} missing series must not be zero-filled`);
    }

    if (row.fxSeriesRequired === "yes" && row.market !== "US") {
      warn(`${CSV_PATH}:${line} only US assets should require FX in this audit`);
    }

    if (row.market === "US" && row.fxSeriesAvailable !== "no") {
      warn(`${CSV_PATH}:${line} US assets must not claim committed FX series availability`);
    }

    if (row.ticker === "QQQM" && !row.reasonCodes.includes("shorter_than_10y_no_proxy_recorded")) {
      warn(`${CSV_PATH}:${line} QQQM must retain short-history proxy warning`);
    }

    if (row.ticker === "278530" && !row.rollingCagr10yRecalcStatus.includes("insufficient")) {
      warn(`${CSV_PATH}:${line} 278530 must remain blocked for strict 120-month rolling checks`);
    }

    if (KR_KOSPI200_REPRESENTATIVES.has(row.ticker)) {
      if (row.benchmarkId !== "^KS11") {
        warn(`${CSV_PATH}:${line} KR representative ETF benchmark finding changed unexpectedly`);
      }
      if (row.betaRecalcStatus !== "blocked_policy_benchmark_should_be_kospi200") {
        warn(`${CSV_PATH}:${line} KR representative ETF BETA policy block must be preserved`);
      }
    }

    if (REPRESENTATIVE_TICKERS.includes(row.ticker)) {
      representativeRows.set(row.ticker, row);
    }
  });

  for (const ticker of REPRESENTATIVE_TICKERS) {
    if (!representativeRows.has(ticker)) {
      warn(`missing representative ticker: ${ticker}`);
    }
  }

  if (gradeCounts.A !== 0) {
    warn(`current repository audit should have A=0 until committed total-return series exists; got ${gradeCounts.A}`);
  }
  if (gradeCounts.B !== 5757 || gradeCounts.C !== 243) {
    warn(`unexpected grade counts: ${JSON.stringify(gradeCounts)}`);
  }

  requireDocText(INVENTORY_PATH, [
    "No committed asset-level daily or monthly price series",
    "A | 0 | 0 | 0",
    "Representative Asset Recalculation Table",
    "Render API",
  ]);
  requireDocText(AUDIT_PATH, [
    "Do not use `expectedCagr` alone",
    "Korean representative ETF BETA currently uses `^KS11`",
    "Required New Input Schema",
    "Representative Asset Recalculation Table",
  ]);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[verify-scenario-data-coverage] ${error}`);
    }
    process.exit(1);
  }

  console.log("[verify-scenario-data-coverage] ok");
  console.log(`[verify-scenario-data-coverage] rows=${rows.length}`);
  console.log(`[verify-scenario-data-coverage] gradeCounts=${JSON.stringify(gradeCounts)}`);
  console.log(`[verify-scenario-data-coverage] metricsStatus=${JSON.stringify(countBy(rows, "metricsStatus"))}`);
}

main();
