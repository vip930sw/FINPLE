const fs = require("node:fs");
const path = require("node:path");

const CANDIDATE_REVIEW_CSV_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_provider_candidate_review.csv",
);
const TERMS_REVIEW_CSV_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_external_provider_terms_review.csv",
);
const TERMS_REVIEW_SUMMARY_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_external_provider_terms_review_summary.json",
);
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const REVIEW_VERSION = "scenario-p0-external-provider-terms-review-v0.2";
const AUDITED_AT = "2026-06-27T00:00:00Z";
const EXPECTED_PROVIDER_CANDIDATES = 5;
const NOT_APPROVED_STATUS = "not_approved";

const CSV_COLUMNS = [
  "providerCandidate",
  "namedProviderCandidate",
  "officialDocsUrl",
  "officialTermsUrl",
  "candidateUse",
  "commercialTermsStatus",
  "redistributionStatus",
  "rawPayloadStorageStatus",
  "cachePolicyStatus",
  "approvalStatus",
  "blocker",
  "nextAction",
];

const TERMS_REVIEW = {
  US_price_total_return_dividend_provider: {
    namedProviderCandidate: "Korea Investment Open API overseas US ETF data",
    officialDocsUrl: "https://apiportal.koreainvestment.com/",
    officialTermsUrl: "https://apiportal.koreainvestment.com/",
    candidateUse: "US ETF monthly adjusted price, dividend, and split source candidate via KIS overseas endpoints",
    commercialTermsStatus: "blocked_pending_commercial_license_confirmation",
    redistributionStatus: "blocked_pending_derived_cache_redistribution_review",
    rawPayloadStorageStatus: "pending_hash_only_or_retention_policy",
    cachePolicyStatus: "pending_internal_monthly_derived_cache_policy",
    approvalStatus: "not_approved",
    blocker: "commercial_use_and_redistribution_terms_not_approved",
    nextAction: "confirm_paid_or_written_commercial_terms_before_adapter",
  },
  SP500_TR_primary_or_SPY_adjusted_close_proxy: {
    namedProviderCandidate: "Korea Investment Open API overseas SPY adjusted-close proxy",
    officialDocsUrl: "https://apiportal.koreainvestment.com/",
    officialTermsUrl: "https://apiportal.koreainvestment.com/",
    candidateUse: "S&P 500 total-return/index candidate or SPY adjusted-close proxy candidate via KIS overseas endpoints",
    commercialTermsStatus: "blocked_pending_premium_index_and_commercial_terms",
    redistributionStatus: "blocked_pending_index_or_proxy_labeling_review",
    rawPayloadStorageStatus: "pending_hash_only_or_retention_policy",
    cachePolicyStatus: "pending_internal_monthly_benchmark_cache_policy",
    approvalStatus: "not_approved",
    blocker: "index_or_proxy_license_terms_not_approved",
    nextAction: "confirm_index_or_proxy_terms_and_display_labeling",
  },
  KR_price_total_return_dividend_provider: {
    namedProviderCandidate: "Korea Investment Open API or licensed KR market-data provider",
    officialDocsUrl: "https://apiportal.koreainvestment.com/",
    officialTermsUrl: "https://apiportal.koreainvestment.com/",
    candidateUse: "KR ETF monthly price, distribution, and corporate-action source candidate",
    commercialTermsStatus: "blocked_pending_account_partner_or_license_review",
    redistributionStatus: "blocked_pending_derived_cache_redistribution_review",
    rawPayloadStorageStatus: "pending_hash_only_or_retention_policy",
    cachePolicyStatus: "pending_internal_monthly_derived_cache_policy",
    approvalStatus: "not_approved",
    blocker: "kr_market_data_terms_not_approved",
    nextAction: "confirm_KR_provider_terms_ticker_normalization_and_distribution_policy",
  },
  KOSPI200_TR_primary_or_kospi200_etf_proxy: {
    namedProviderCandidate: "KRX Data Marketplace or licensed KOSPI 200 ETF proxy",
    officialDocsUrl: "https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd",
    officialTermsUrl: "https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd",
    candidateUse: "KOSPI 200 total-return benchmark or representative ETF proxy candidate",
    commercialTermsStatus: "blocked_pending_KRX_data_product_or_index_license_review",
    redistributionStatus: "blocked_pending_index_license_or_proxy_labeling_review",
    rawPayloadStorageStatus: "pending_hash_only_or_retention_policy",
    cachePolicyStatus: "pending_internal_monthly_benchmark_cache_policy",
    approvalStatus: "not_approved",
    blocker: "kospi200_index_or_proxy_terms_not_approved",
    nextAction: "confirm_KRX_index_license_or_proxy_terms_and_KOSPI200_calendar",
  },
  USD_KRW_fx_provider: {
    namedProviderCandidate: "FRED DEXKOUS",
    officialDocsUrl: "https://fred.stlouisfed.org/series/DEXKOUS",
    officialTermsUrl: "https://fred.stlouisfed.org/docs/api/terms_of_use.html",
    candidateUse: "USD/KRW daily FX series candidate for monthly FX return derivation",
    commercialTermsStatus: "blocked_pending_FRED_terms_and_source_copyright_review",
    redistributionStatus: "blocked_pending_citation_and_derived_cache_review",
    rawPayloadStorageStatus: "pending_hash_only_or_retention_policy",
    cachePolicyStatus: "pending_internal_monthly_fx_return_cache_policy",
    approvalStatus: "not_approved",
    blocker: "fx_source_terms_and_citation_policy_not_approved",
    nextAction: "confirm_FRED_API_terms_citation_and_DexKous_month_end_fallback",
  },
};

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

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        current += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(text, filePath) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length < 2) {
    fail(`${filePath} must contain a header and at least one data row`);
  }

  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line, lineIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      fail(`${filePath}:${lineIndex + 2} has ${values.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function toCsv(rows) {
  return `${CSV_COLUMNS.join(",")}\n${rows
    .map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column])).join(","))
    .join("\n")}\n`;
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

function assertHttpsUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a valid HTTPS URL`);
  }
  if (parsed.protocol !== "https:") {
    fail(`${label} must be a valid HTTPS URL`);
  }
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildTermsReview() {
  if (!fs.existsSync(CANDIDATE_REVIEW_CSV_PATH)) {
    fail(`${CANDIDATE_REVIEW_CSV_PATH} not found`);
  }
  const candidateReview = parseCsv(fs.readFileSync(CANDIDATE_REVIEW_CSV_PATH, "utf8"), CANDIDATE_REVIEW_CSV_PATH);
  const rows = candidateReview.rows.map((row) => {
    const review = TERMS_REVIEW[row.providerCandidate];
    if (!review) {
      fail(`${CANDIDATE_REVIEW_CSV_PATH} has provider without external terms review: ${row.providerCandidate}`);
    }
    return {
      providerCandidate: row.providerCandidate,
      ...review,
    };
  });

  if (rows.length !== EXPECTED_PROVIDER_CANDIDATES) {
    fail(`${CANDIDATE_REVIEW_CSV_PATH} must produce ${EXPECTED_PROVIDER_CANDIDATES} external terms rows, got ${rows.length}`);
  }
  const providerCandidates = uniqueSorted(rows.map((row) => row.providerCandidate));
  const expectedProviders = uniqueSorted(Object.keys(TERMS_REVIEW));
  if (providerCandidates.join("|") !== expectedProviders.join("|")) {
    fail(`${CANDIDATE_REVIEW_CSV_PATH} provider candidates do not match expected P0 terms review set`);
  }
  for (const row of rows) {
    assertHttpsUrl(row.officialDocsUrl, `${row.providerCandidate} officialDocsUrl`);
    assertHttpsUrl(row.officialTermsUrl, `${row.providerCandidate} officialTermsUrl`);
  }
  if (rows.some((row) => row.approvalStatus !== NOT_APPROVED_STATUS)) {
    fail(`${TERMS_REVIEW_CSV_PATH} must keep all providers not_approved before owner/legal review`);
  }
  if (fs.existsSync(MONTHLY_DATA_PATH)) {
    fail(`${MONTHLY_DATA_PATH} exists before external provider terms are approved`);
  }

  return {
    csv: toCsv(rows),
    summary: stableJson({
      reviewVersion: REVIEW_VERSION,
      auditedAt: AUDITED_AT,
      sourceFiles: {
        candidateReview: CANDIDATE_REVIEW_CSV_PATH,
      },
      officialSourcesReviewed: rows.map((row) => ({
        providerCandidate: row.providerCandidate,
        namedProviderCandidate: row.namedProviderCandidate,
        officialDocsUrl: row.officialDocsUrl,
        officialTermsUrl: row.officialTermsUrl,
      })),
      outputFiles: {
        csv: TERMS_REVIEW_CSV_PATH,
        summary: TERMS_REVIEW_SUMMARY_PATH,
        monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
      },
      rowCounts: {
        providerCandidates: rows.length,
        approvedProviders: rows.filter((row) => row.approvalStatus === "approved").length,
        blockedProviders: rows.filter((row) => row.approvalStatus !== "approved").length,
      },
      counts: {
        byApprovalStatus: countBy(rows, "approvalStatus"),
        byBlocker: countBy(rows, "blocker"),
      },
      termsIntegrity: {
        expectedProviderCandidates: EXPECTED_PROVIDER_CANDIDATES,
        providerSetVerified: true,
        officialUrlsVerified: true,
        noTermsApproved: true,
        monthlyDataFileAbsent: true,
      },
      readiness: {
        status: "blocked_external_terms_review",
        providerCallsAllowed: false,
        monthlyDataFileWritten: false,
        bootstrapStillBlocked: true,
        nextAllowedStep: "legal_or_owner_review_named_provider_terms_before_source_policy_approval",
      },
    }),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const review = buildTermsReview();

  if (checkOnly) {
    for (const [filePath, expected] of [
      [TERMS_REVIEW_CSV_PATH, review.csv],
      [TERMS_REVIEW_SUMMARY_PATH, review.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-external-provider-terms-review.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-external-provider-terms-review.cjs`);
      }
    }
    console.log("[generate-scenario-p0-external-provider-terms-review] ok");
    console.log(`[generate-scenario-p0-external-provider-terms-review] csv=${TERMS_REVIEW_CSV_PATH}`);
    console.log(`[generate-scenario-p0-external-provider-terms-review] summary=${TERMS_REVIEW_SUMMARY_PATH}`);
    return;
  }

  fs.writeFileSync(TERMS_REVIEW_CSV_PATH, review.csv);
  fs.writeFileSync(TERMS_REVIEW_SUMMARY_PATH, review.summary);
  console.log("[generate-scenario-p0-external-provider-terms-review] wrote terms review");
  console.log(`[generate-scenario-p0-external-provider-terms-review] csv=${TERMS_REVIEW_CSV_PATH}`);
  console.log(`[generate-scenario-p0-external-provider-terms-review] summary=${TERMS_REVIEW_SUMMARY_PATH}`);
}

main();
