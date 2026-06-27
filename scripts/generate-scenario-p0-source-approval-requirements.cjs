const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const WRITER_GATE_PATH = path.join("data", "processed", "scenario_p0_cache_writer_gate.json");
const REQUIREMENTS_PATH = path.join("data", "processed", "scenario_p0_source_approval_requirements.json");

const REQUIREMENTS_VERSION = "scenario-p0-source-approval-requirements-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";
const APPROVED_STATUS = "approved_source_policy";

const REQUIRED_POLICY_FIELDS = [
  "endpointPolicy",
  "licensePolicy",
  "rawPayloadStorage",
  "redistributionPolicy",
  "requiredApproval",
  "status",
  "blocker",
];

const APPROVAL_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: APPROVED_STATUS,
  blocker: "",
};

const GROUP_REQUIREMENTS = {
  US_price_total_return_dividend_provider: {
    sourceScope: "US ETF adjusted close, cash dividend, split, and corporate-action time series",
    minimumEvidence: [
      "provider endpoint selected with documented rate limits and backfill window",
      "adjusted close or total-return reconstruction method documented",
      "dividend and split handling documented",
      "raw payload hash or retention policy approved",
      "monthly derived return redistribution approved for internal cache only",
    ],
  },
  KR_price_total_return_dividend_provider: {
    sourceScope: "KR ETF close price, distribution, split, and corporate-action time series",
    minimumEvidence: [
      "provider endpoint selected with KR ticker normalization policy",
      "distribution and split handling documented",
      "KRW return basis documented",
      "raw payload hash or retention policy approved",
      "monthly derived return redistribution approved for internal cache only",
    ],
  },
  SP500_TR_primary_or_SPY_adjusted_close_proxy: {
    sourceScope: "S&P 500 total-return benchmark or controlled SPY adjusted-close proxy",
    minimumEvidence: [
      "primary total-return benchmark endpoint or proxy rule selected",
      "proxy limitations documented if SPY adjusted close is used",
      "benchmark return currency and calendar alignment documented",
      "raw payload hash or retention policy approved",
      "monthly derived benchmark redistribution approved for internal cache only",
    ],
  },
  KOSPI200_TR_primary_or_kospi200_etf_proxy: {
    sourceScope: "KOSPI 200 total-return benchmark or controlled ETF proxy",
    minimumEvidence: [
      "primary total-return benchmark endpoint or proxy rule selected",
      "proxy limitations documented if an ETF proxy is used",
      "benchmark return currency and calendar alignment documented",
      "raw payload hash or retention policy approved",
      "monthly derived benchmark redistribution approved for internal cache only",
    ],
  },
  USD_KRW_fx_provider: {
    sourceScope: "USD/KRW monthly FX return time series",
    minimumEvidence: [
      "FX endpoint selected with fixing convention documented",
      "month-end calendar and missing-day fallback documented",
      "return direction documented as USDKRW return",
      "raw payload hash or retention policy approved",
      "monthly derived FX return redistribution approved for internal cache only",
    ],
  },
};

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

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function buildRequirements() {
  if (!fs.existsSync(SOURCE_POLICY_CSV_PATH)) {
    fail(`${SOURCE_POLICY_CSV_PATH} not found`);
  }
  if (!fs.existsSync(WRITER_GATE_PATH)) {
    fail(`${WRITER_GATE_PATH} not found`);
  }

  const matrix = parseCsv(fs.readFileSync(SOURCE_POLICY_CSV_PATH, "utf8"), SOURCE_POLICY_CSV_PATH);
  const gate = JSON.parse(fs.readFileSync(WRITER_GATE_PATH, "utf8"));
  const rows = matrix.rows;
  if (rows.length !== 17) {
    fail(`${SOURCE_POLICY_CSV_PATH} must contain 17 P0 rows, got ${rows.length}`);
  }

  for (const field of REQUIRED_POLICY_FIELDS) {
    if (!matrix.headers.includes(field)) {
      fail(`${SOURCE_POLICY_CSV_PATH} missing required field ${field}`);
    }
  }

  const unknownProviders = uniqueSorted(rows.map((row) => row.providerCandidate)).filter(
    (providerCandidate) => !GROUP_REQUIREMENTS[providerCandidate],
  );
  if (unknownProviders.length > 0) {
    fail(`${SOURCE_POLICY_CSV_PATH} has providers without approval requirements: ${unknownProviders.join(", ")}`);
  }

  const approvedRows = rows.filter((row) => row.status === APPROVED_STATUS);
  const pendingRows = rows.filter((row) => row.status !== APPROVED_STATUS);
  const providerGroups = {};
  for (const providerCandidate of uniqueSorted(rows.map((row) => row.providerCandidate))) {
    const groupRows = rows.filter((row) => row.providerCandidate === providerCandidate);
    const requirement = GROUP_REQUIREMENTS[providerCandidate];
    providerGroups[providerCandidate] = {
      providerCandidate,
      sourceScope: requirement.sourceScope,
      rowCount: groupRows.length,
      tickers: uniqueSorted(groupRows.map((row) => row.ticker)),
      markets: uniqueSorted(groupRows.map((row) => row.market)),
      currentStatuses: countBy(groupRows, "status"),
      minimumEvidence: requirement.minimumEvidence,
    };
  }

  return {
    requirementsVersion: REQUIREMENTS_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      writerGate: WRITER_GATE_PATH,
    },
    outputFiles: {
      requirements: REQUIREMENTS_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    approvalRules: APPROVAL_RULES,
    rowCounts: {
      totalRows: rows.length,
      approvedRows: approvedRows.length,
      pendingRows: pendingRows.length,
      providerGroups: Object.keys(providerGroups).length,
    },
    counts: {
      byManifestType: countBy(rows, "manifestType"),
      byProviderCandidate: countBy(rows, "providerCandidate"),
      byStatus: countBy(rows, "status"),
      byRequiredApproval: countBy(rows, "requiredApproval"),
    },
    providerGroups,
    readiness: {
      status: pendingRows.length === 0 ? "ready_for_source_policy_approval_sync" : "blocked_source_policy_review",
      canApproveWriterGate: pendingRows.length === 0 && gate.readiness?.canWriteMonthlyData === true,
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep:
        pendingRows.length === 0
          ? "sync_approved_source_policy_matrix_with_writer_gate"
          : "review_and_record_p0_source_license_refresh_policy",
    },
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const output = stableJson(buildRequirements());

  if (checkOnly) {
    if (!fs.existsSync(REQUIREMENTS_PATH)) {
      fail(`${REQUIREMENTS_PATH} not found; run node scripts/generate-scenario-p0-source-approval-requirements.cjs`);
    }
    const current = fs.readFileSync(REQUIREMENTS_PATH, "utf8");
    if (current !== output) {
      fail(`${REQUIREMENTS_PATH} is out of date; run node scripts/generate-scenario-p0-source-approval-requirements.cjs`);
    }
    console.log("[generate-scenario-p0-source-approval-requirements] ok");
    console.log(`[generate-scenario-p0-source-approval-requirements] requirements=${REQUIREMENTS_PATH}`);
    return;
  }

  fs.writeFileSync(REQUIREMENTS_PATH, output);
  console.log("[generate-scenario-p0-source-approval-requirements] wrote requirements");
  console.log(`[generate-scenario-p0-source-approval-requirements] requirements=${REQUIREMENTS_PATH}`);
}

main();
