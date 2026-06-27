const fs = require("node:fs");
const path = require("node:path");

const COVERAGE_CSV_PATH = path.join("data", "processed", "scenario_data_coverage.csv");
const MANIFEST_CSV_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_manifest.csv");
const POLICY_PATH = path.join("data", "processed", "scenario_rolling_median_policy.json");

const POLICY_VERSION = "scenario-rolling-median-policy-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const REQUIRED_REPRESENTATIVES = [
  ["US", "SPY"],
  ["US", "VOO"],
  ["US", "IVV"],
  ["US", "VTI"],
  ["US", "ITOT"],
  ["US", "SCHB"],
  ["US", "QQQ"],
  ["US", "QQQM"],
  ["KR", "069500"],
  ["KR", "102110"],
  ["KR", "148020"],
  ["KR", "105190"],
  ["KR", "152100"],
  ["KR", "278530"],
];

const REQUIRED_ROLLING_FIELDS = [
  "rollingPriceCagr10yMedian",
  "rollingPriceCagr10yP25",
  "rollingPriceCagr10yP75",
  "rollingTotalReturnCagr10yMedian",
  "rollingMdd10yMedian",
  "rollingMdd10yWorst",
  "rollingWindowCount",
];

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

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function buildPolicyRows(coverageRows, manifestRows) {
  const coverageByKey = new Map(coverageRows.map((row) => [`${row.market}:${row.ticker}`, row]));
  const manifestByKey = new Map(manifestRows.map((row) => [`${row.market}:${row.ticker}`, row]));

  return REQUIRED_REPRESENTATIVES.map(([market, ticker]) => {
    const key = `${market}:${ticker}`;
    const coverage = coverageByKey.get(key);
    const manifest = manifestByKey.get(key);
    if (!coverage) {
      fail(`${COVERAGE_CSV_PATH} missing representative ${key}`);
    }
    if (!manifest) {
      fail(`${MANIFEST_CSV_PATH} missing representative ${key}`);
    }

    return {
      market,
      ticker,
      targetBenchmarkId: manifest.targetBenchmarkId,
      dataYears: coverage.dataYears,
      currentScenarioGrade: coverage.scenarioGrade,
      currentRollingCagrStatus: coverage.rollingCagr10yRecalcStatus,
      currentRollingMddStatus: coverage.rollingMdd10yRecalcStatus,
      appliedCagrPolicy: "rolling_10y_median_after_monthly_series_validation",
      appliedMddPolicy: "rolling_10y_median_after_monthly_nav_validation",
      policyScope: "US_KR_representative_assets",
      currentStatus: "blocked_until_monthly_series_exists",
    };
  });
}

function buildPolicy() {
  if (!fs.existsSync(COVERAGE_CSV_PATH)) {
    fail(`${COVERAGE_CSV_PATH} not found`);
  }
  if (!fs.existsSync(MANIFEST_CSV_PATH)) {
    fail(`${MANIFEST_CSV_PATH} not found`);
  }

  const coverage = parseCsv(fs.readFileSync(COVERAGE_CSV_PATH, "utf8"), COVERAGE_CSV_PATH);
  const manifest = parseCsv(fs.readFileSync(MANIFEST_CSV_PATH, "utf8"), MANIFEST_CSV_PATH);
  const representativeRows = buildPolicyRows(coverage.rows, manifest.rows);

  const usRows = representativeRows.filter((row) => row.market === "US");
  const krRows = representativeRows.filter((row) => row.market === "KR");
  if (usRows.length !== 8 || krRows.length !== 6) {
    fail(`expected 8 US and 6 KR representative rows, got US=${usRows.length} KR=${krRows.length}`);
  }

  return {
    policyVersion: POLICY_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      coverage: COVERAGE_CSV_PATH,
      p0Manifest: MANIFEST_CSV_PATH,
    },
    outputFiles: {
      policy: POLICY_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    policy: {
      scope: "US and KR representative assets",
      appliesToMarkets: ["US", "KR"],
      representativeAssetCount: representativeRows.length,
      requiredRollingFields: REQUIRED_ROLLING_FIELDS,
      cagrRule:
        "Use rolling 10-year median CAGR for representative US and KR assets after validated monthly series exist; keep raw CAGR as a separate audit field.",
      mddRule:
        "Use rolling 10-year median MDD for representative US and KR assets after validated monthly NAV windows exist; keep full-period MDD as a separate audit field.",
      noFallbacks: [
        "do_not_use_expectedCagr_as_rolling_metric",
        "do_not_use_weighted_asset_mdd_as_portfolio_mdd",
        "do_not_zero_fill_missing_months",
        "do_not_apply_rolling_policy_without_source_metadata",
      ],
    },
    rowCounts: {
      representatives: representativeRows.length,
      usRepresentatives: usRows.length,
      krRepresentatives: krRows.length,
    },
    counts: {
      byMarket: countBy(representativeRows, "market"),
      byCurrentScenarioGrade: countBy(representativeRows, "currentScenarioGrade"),
      byCurrentStatus: countBy(representativeRows, "currentStatus"),
      byCurrentRollingCagrStatus: countBy(representativeRows, "currentRollingCagrStatus"),
      byCurrentRollingMddStatus: countBy(representativeRows, "currentRollingMddStatus"),
    },
    representatives: representativeRows,
    readiness: {
      status: "blocked_until_monthly_series_exists",
      marketsCovered: uniqueSorted(representativeRows.map((row) => row.market)),
      usRollingMedianPolicyApplied: true,
      krRollingMedianPolicyApplied: true,
      monthlyDataFileWritten: false,
      providerCallsAllowed: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: "populate_monthly_series_before_rolling_median_calculation",
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const output = stableJson(buildPolicy());

  if (checkOnly) {
    if (!fs.existsSync(POLICY_PATH)) {
      fail(`${POLICY_PATH} not found; run node scripts/generate-scenario-rolling-median-policy.cjs`);
    }
    const current = fs.readFileSync(POLICY_PATH, "utf8");
    if (current !== output) {
      fail(`${POLICY_PATH} is out of date; run node scripts/generate-scenario-rolling-median-policy.cjs`);
    }
    console.log("[generate-scenario-rolling-median-policy] ok");
    console.log(`[generate-scenario-rolling-median-policy] policy=${POLICY_PATH}`);
    return;
  }

  fs.writeFileSync(POLICY_PATH, output);
  console.log("[generate-scenario-rolling-median-policy] wrote policy");
  console.log(`[generate-scenario-rolling-median-policy] policy=${POLICY_PATH}`);
}

main();
