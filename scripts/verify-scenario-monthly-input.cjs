const fs = require("node:fs");
const path = require("node:path");

const SCHEMA_PATH = path.join("data", "processed", "scenario_monthly_returns.schema.csv");
const DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const REQUIRED_COLUMNS = [
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

const MONTH_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;
const VALID_MARKETS = new Set(["US", "KR"]);
const VALID_RETURN_BASIS = new Set(["price", "total_return"]);
const VALID_CURRENCIES = new Set(["USD", "KRW"]);
const VALID_BOOLEAN = new Set(["yes", "no"]);
const VALID_SERIES_QUALITY = new Set(["A", "B", "C"]);
const FINITE_OPTIONAL_FIELDS = new Set([
  "totalReturn",
  "adjustedClose",
  "dividendAmount",
  "benchmarkReturn",
  "fxReturn",
]);

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

function assertExactHeader(headers, filePath) {
  const actual = headers.join(",");
  const expected = REQUIRED_COLUMNS.join(",");
  if (actual !== expected) {
    fail(`${filePath} header mismatch\nexpected: ${expected}\nactual:   ${actual}`);
  }
}

function isFiniteNumberText(value) {
  if (value === "") {
    return false;
  }
  const number = Number(value);
  return Number.isFinite(number);
}

function assertFiniteNumberText(value, label, errors) {
  if (!isFiniteNumberText(value)) {
    errors.push(`${label} must be a finite number`);
    return null;
  }
  return Number(value);
}

function rejectZeroFilledMissing(row, field, line, errors) {
  const reasonCodes = row.reasonCodes || "";
  const missingFieldToken = `missing_${field}`;
  if (row[field] === "0" && reasonCodes.includes(missingFieldToken)) {
    errors.push(`${DATA_PATH}:${line} ${field} is marked missing but contains 0`);
  }
}

function validateRow(row, index, seenKeys, errors) {
  const line = index + 2;
  const ticker = String(row.ticker || "").trim().toUpperCase();
  const market = String(row.market || "").trim().toUpperCase();
  const month = String(row.month || "").trim();
  const seriesQuality = String(row.seriesQuality || "").trim().toUpperCase();

  if (!ticker) {
    errors.push(`${DATA_PATH}:${line} ticker must not be empty`);
  }
  if (!VALID_MARKETS.has(market)) {
    errors.push(`${DATA_PATH}:${line} market must be US or KR`);
  }
  if (!MONTH_PATTERN.test(month)) {
    errors.push(`${DATA_PATH}:${line} month must be YYYY-MM or YYYY-MM-DD`);
  }

  const key = `${market}:${ticker}:${month}`;
  if (seenKeys.has(key)) {
    errors.push(`${DATA_PATH}:${line} duplicate market/ticker/month key: ${key}`);
  }
  seenKeys.add(key);

  const priceReturn = assertFiniteNumberText(row.priceReturn, `${DATA_PATH}:${line} priceReturn`, errors);
  if (priceReturn !== null && priceReturn < -1) {
    errors.push(`${DATA_PATH}:${line} priceReturn must be >= -1`);
  }

  const closePrice = assertFiniteNumberText(row.closePrice, `${DATA_PATH}:${line} closePrice`, errors);
  if (closePrice !== null && closePrice <= 0) {
    errors.push(`${DATA_PATH}:${line} closePrice must be positive`);
  }

  for (const field of FINITE_OPTIONAL_FIELDS) {
    if (row[field] !== "" && !isFiniteNumberText(row[field])) {
      errors.push(`${DATA_PATH}:${line} ${field} must be blank or a finite number`);
    }
  }

  if (!VALID_RETURN_BASIS.has(row.returnBasis)) {
    errors.push(`${DATA_PATH}:${line} returnBasis must be price or total_return`);
  }
  if (!VALID_CURRENCIES.has(row.currency)) {
    errors.push(`${DATA_PATH}:${line} currency must be USD or KRW`);
  }
  if (!VALID_BOOLEAN.has(row.isProxy)) {
    errors.push(`${DATA_PATH}:${line} isProxy must be yes or no`);
  }
  if (!row.dataSource) {
    errors.push(`${DATA_PATH}:${line} dataSource must not be empty`);
  }
  if (!row.sourceVersion) {
    errors.push(`${DATA_PATH}:${line} sourceVersion must not be empty`);
  }
  if (!VALID_SERIES_QUALITY.has(seriesQuality)) {
    errors.push(`${DATA_PATH}:${line} seriesQuality must be A, B, or C`);
  }

  if (seriesQuality === "A") {
    for (const field of ["totalReturn", "benchmarkId", "benchmarkReturn"]) {
      if (row[field] === "") {
        errors.push(`${DATA_PATH}:${line} A-grade series requires ${field}`);
      }
    }
  }
  if (seriesQuality !== "A" && row.reasonCodes === "") {
    errors.push(`${DATA_PATH}:${line} non-A series requires reasonCodes`);
  }

  for (const field of ["totalReturn", "benchmarkReturn", "fxReturn"]) {
    rejectZeroFilledMissing(row, field, line, errors);
  }
}

function main() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    fail(`${SCHEMA_PATH} not found`);
  }

  const schema = parseCsv(fs.readFileSync(SCHEMA_PATH, "utf8"), SCHEMA_PATH);
  assertExactHeader(schema.headers, SCHEMA_PATH);
  if (schema.rows.length !== 0) {
    fail(`${SCHEMA_PATH} must remain header-only and must not contain sample data`);
  }

  if (!fs.existsSync(DATA_PATH)) {
    console.log("[verify-scenario-monthly-input] ok");
    console.log(`[verify-scenario-monthly-input] schema=${SCHEMA_PATH}`);
    console.log(`[verify-scenario-monthly-input] data=${DATA_PATH} not present yet`);
    return;
  }

  const data = parseCsv(fs.readFileSync(DATA_PATH, "utf8"), DATA_PATH);
  assertExactHeader(data.headers, DATA_PATH);
  const errors = [];
  const seenKeys = new Set();
  data.rows.forEach((row, index) => validateRow(row, index, seenKeys, errors));

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[verify-scenario-monthly-input] ${error}`);
    }
    process.exit(1);
  }

  console.log("[verify-scenario-monthly-input] ok");
  console.log(`[verify-scenario-monthly-input] rows=${data.rows.length}`);
}

main();
