const fs = require("node:fs");
const path = require("node:path");

const DECISION_RECORD_CSV_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_source_approval_decision_record.csv",
);
const CANDIDATE_REVIEW_CSV_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_provider_candidate_review.csv",
);
const CANDIDATE_REVIEW_SUMMARY_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_provider_candidate_review_summary.json",
);

const REVIEW_VERSION = "scenario-p0-provider-candidate-review-v0.1";
const AUDITED_AT = "2026-06-27T00:00:00Z";

const CSV_COLUMNS = [
  "providerCandidate",
  "sourceGroup",
  "candidateClass",
  "markets",
  "tickers",
  "requiredEndpointEvidence",
  "requiredLicenseEvidence",
  "requiredDataFields",
  "requiredQualityChecks",
  "proxyRuleRequired",
  "calendarRuleRequired",
  "currencyRuleRequired",
  "reviewStatus",
  "selectionStatus",
  "blocker",
  "nextAction",
];

const GROUP_REVIEW_REQUIREMENTS = {
  US_price_total_return_dividend_provider: {
    sourceGroup: "US representative ETF asset series",
    candidateClass: "licensed_or_documented_us_market_data_provider",
    requiredEndpointEvidence:
      "adjusted close endpoint|dividend endpoint|split/corporate-action endpoint|rate-limit documentation|backfill-window documentation",
    requiredLicenseEvidence:
      "internal derived monthly return cache allowed|raw redistribution prohibited or licensed|commercial use reviewed",
    requiredDataFields:
      "monthly_price_return|monthly_total_return|closePrice|adjustedClose|dividendAmount|sourceVersion|rawPayloadHash",
    requiredQualityChecks:
      "no_zero_fill|dividend_reinvestment_basis_documented|split_adjustment_documented|common_calendar_month_end",
    proxyRuleRequired: "yes_for_short_history_or_missing_primary_series",
    calendarRuleRequired: "US trading calendar to month-end observation rule",
    currencyRuleRequired: "USD base; KRW mode requires USD_KRW join",
  },
  KR_price_total_return_dividend_provider: {
    sourceGroup: "KR representative ETF asset series",
    candidateClass: "licensed_or_documented_kr_market_data_provider",
    requiredEndpointEvidence:
      "close price endpoint|distribution endpoint|split/corporate-action endpoint|KR ticker normalization|backfill-window documentation",
    requiredLicenseEvidence:
      "internal derived monthly return cache allowed|raw redistribution prohibited or licensed|commercial use reviewed",
    requiredDataFields:
      "monthly_price_return|monthly_total_return|closePrice|dividendAmount|sourceVersion|rawPayloadHash",
    requiredQualityChecks:
      "no_zero_fill|distribution_basis_documented|split_adjustment_documented|KRW_return_basis_documented",
    proxyRuleRequired: "yes_for_278530_or_missing_120m_history",
    calendarRuleRequired: "KR trading calendar to month-end observation rule",
    currencyRuleRequired: "KRW base",
  },
  SP500_TR_primary_or_SPY_adjusted_close_proxy: {
    sourceGroup: "US benchmark total-return series",
    candidateClass: "official_total_return_index_or_documented_spy_proxy",
    requiredEndpointEvidence:
      "SP500 total-return endpoint or SPY adjusted-close proxy endpoint|proxy limitation note|benchmark calendar documentation",
    requiredLicenseEvidence:
      "benchmark derived monthly return cache allowed|index/vendor redistribution policy reviewed|proxy display labeling reviewed",
    requiredDataFields:
      "monthly_benchmark_return|benchmarkId|returnBasis|sourceVersion|rawPayloadHash|isProxy|proxyTicker",
    requiredQualityChecks:
      "no_zero_fill|benchmark_alignment_to_US_assets|proxy_tracking_error_review",
    proxyRuleRequired: "yes_if_SP500_TR_primary_is_unavailable",
    calendarRuleRequired: "US benchmark month-end calendar rule",
    currencyRuleRequired: "USD base; KRW mode requires USD_KRW join",
  },
  KOSPI200_TR_primary_or_kospi200_etf_proxy: {
    sourceGroup: "KR benchmark total-return series",
    candidateClass: "official_total_return_index_or_documented_kospi200_etf_proxy",
    requiredEndpointEvidence:
      "KOSPI200 total-return endpoint or representative ETF proxy endpoint|proxy limitation note|benchmark calendar documentation",
    requiredLicenseEvidence:
      "benchmark derived monthly return cache allowed|index/vendor redistribution policy reviewed|proxy display labeling reviewed",
    requiredDataFields:
      "monthly_benchmark_return|benchmarkId|returnBasis|sourceVersion|rawPayloadHash|isProxy|proxyTicker",
    requiredQualityChecks:
      "no_zero_fill|benchmark_alignment_to_KR_representative_ETFs|KOSPI_vs_KOSPI200_policy_review",
    proxyRuleRequired: "yes_if_KOSPI200_TR_primary_is_unavailable",
    calendarRuleRequired: "KR benchmark month-end calendar rule",
    currencyRuleRequired: "KRW base",
  },
  USD_KRW_fx_provider: {
    sourceGroup: "USD/KRW FX monthly return series",
    candidateClass: "documented_fx_rate_provider",
    requiredEndpointEvidence:
      "USD_KRW endpoint|fixing convention documentation|missing-day fallback documentation|backfill-window documentation",
    requiredLicenseEvidence:
      "derived monthly FX return cache allowed|raw redistribution prohibited or licensed|commercial use reviewed",
    requiredDataFields:
      "monthly_fx_return_usd_krw|currency|sourceVersion|rawPayloadHash",
    requiredQualityChecks:
      "no_zero_fill|return_direction_USDKRW_documented|month_end_missing_day_fallback_tested",
    proxyRuleRequired: "no",
    calendarRuleRequired: "FX month-end fixing or fallback rule",
    currencyRuleRequired: "USDKRW return direction explicitly documented",
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

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildCandidateReview() {
  if (!fs.existsSync(DECISION_RECORD_CSV_PATH)) {
    fail(`${DECISION_RECORD_CSV_PATH} not found`);
  }

  const decisionRecord = parseCsv(fs.readFileSync(DECISION_RECORD_CSV_PATH, "utf8"), DECISION_RECORD_CSV_PATH);
  const rows = decisionRecord.rows.map((decisionRow) => {
    const requirement = GROUP_REVIEW_REQUIREMENTS[decisionRow.providerCandidate];
    if (!requirement) {
      fail(`${DECISION_RECORD_CSV_PATH} has provider without review requirements: ${decisionRow.providerCandidate}`);
    }
    return {
      providerCandidate: decisionRow.providerCandidate,
      sourceGroup: requirement.sourceGroup,
      candidateClass: requirement.candidateClass,
      markets: decisionRow.markets,
      tickers: decisionRow.tickers,
      requiredEndpointEvidence: requirement.requiredEndpointEvidence,
      requiredLicenseEvidence: requirement.requiredLicenseEvidence,
      requiredDataFields: requirement.requiredDataFields,
      requiredQualityChecks: requirement.requiredQualityChecks,
      proxyRuleRequired: requirement.proxyRuleRequired,
      calendarRuleRequired: requirement.calendarRuleRequired,
      currencyRuleRequired: requirement.currencyRuleRequired,
      reviewStatus: "pending_external_provider_review",
      selectionStatus: "not_selected",
      blocker: "provider_endpoint_license_and_redistribution_not_reviewed",
      nextAction: "record_named_provider_endpoint_license_and_cache_policy",
    };
  });

  if (rows.length !== 5) {
    fail(`${DECISION_RECORD_CSV_PATH} must produce 5 provider candidate rows, got ${rows.length}`);
  }

  return {
    csv: toCsv(rows),
    summary: stableJson({
      reviewVersion: REVIEW_VERSION,
      auditedAt: AUDITED_AT,
      sourceFiles: {
        decisionRecord: DECISION_RECORD_CSV_PATH,
      },
      outputFiles: {
        csv: CANDIDATE_REVIEW_CSV_PATH,
        summary: CANDIDATE_REVIEW_SUMMARY_PATH,
        monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
      },
      rowCounts: {
        providerGroups: rows.length,
        selectedProviders: rows.filter((row) => row.selectionStatus !== "not_selected").length,
        pendingReviews: rows.filter((row) => row.reviewStatus === "pending_external_provider_review").length,
      },
      counts: {
        byReviewStatus: countBy(rows, "reviewStatus"),
        bySelectionStatus: countBy(rows, "selectionStatus"),
        byBlocker: countBy(rows, "blocker"),
      },
      readiness: {
        status: "pending_external_provider_review",
        providerCallsAllowed: false,
        monthlyDataFileWritten: false,
        bootstrapStillBlocked: true,
        nextAllowedStep: "review_named_provider_terms_before_source_policy_approval",
      },
    }),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const review = buildCandidateReview();

  if (checkOnly) {
    for (const [filePath, expected] of [
      [CANDIDATE_REVIEW_CSV_PATH, review.csv],
      [CANDIDATE_REVIEW_SUMMARY_PATH, review.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-provider-candidate-review.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-provider-candidate-review.cjs`);
      }
    }
    console.log("[generate-scenario-p0-provider-candidate-review] ok");
    console.log(`[generate-scenario-p0-provider-candidate-review] csv=${CANDIDATE_REVIEW_CSV_PATH}`);
    console.log(`[generate-scenario-p0-provider-candidate-review] summary=${CANDIDATE_REVIEW_SUMMARY_PATH}`);
    return;
  }

  fs.writeFileSync(CANDIDATE_REVIEW_CSV_PATH, review.csv);
  fs.writeFileSync(CANDIDATE_REVIEW_SUMMARY_PATH, review.summary);
  console.log("[generate-scenario-p0-provider-candidate-review] wrote candidate review");
  console.log(`[generate-scenario-p0-provider-candidate-review] csv=${CANDIDATE_REVIEW_CSV_PATH}`);
  console.log(`[generate-scenario-p0-provider-candidate-review] summary=${CANDIDATE_REVIEW_SUMMARY_PATH}`);
}

main();
