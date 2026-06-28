const fs = require("node:fs");
const path = require("node:path");

const TERMS_REVIEW_CSV_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_external_provider_terms_review.csv",
);
const DECISION_PACKET_CSV_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_owner_legal_decision_packet.csv",
);
const DECISION_PACKET_SUMMARY_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_owner_legal_decision_packet_summary.json",
);
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const PACKET_VERSION = "scenario-p0-owner-legal-decision-packet-v0.2";
const AUDITED_AT = "2026-06-27T00:00:00Z";
const EXPECTED_PROVIDER_CANDIDATES = 5;
const PENDING_ADAPTER_STATUS = "pending_owner_legal_review";
const BLOCKED_MONTHLY_WRITE_STATUS = "blocked_pending_owner_legal_review";

const CSV_COLUMNS = [
  "providerCandidate",
  "namedProviderCandidate",
  "officialDocsUrl",
  "officialTermsUrl",
  "reviewScope",
  "requiredOwnerDecision",
  "requiredLegalDecision",
  "commercialUseQuestion",
  "redistributionQuestion",
  "rawPayloadQuestion",
  "cacheQuestion",
  "attributionQuestion",
  "displayLabelQuestion",
  "adapterApprovalStatus",
  "monthlyWriteApprovalStatus",
  "decisionOwner",
  "legalReviewer",
  "reviewedAt",
  "evidenceUrl",
  "blocker",
  "nextAction",
];

const DECISION_DETAILS = {
  US_price_total_return_dividend_provider: {
    reviewScope: "US representative ETF adjusted price dividend split and total-return reconstruction",
    requiredOwnerDecision: "select_US_price_provider_or_reject_candidate",
    requiredLegalDecision: "confirm_commercial_use_and_internal_derived_cache_allowed",
    commercialUseQuestion: "May FINPLE use this provider for production commercial portfolio analytics",
    redistributionQuestion: "May FINPLE store and serve derived monthly returns without redistributing raw data",
    rawPayloadQuestion: "Should raw responses be stored, hash-only, or discarded after derivation",
    cacheQuestion: "What retention period is allowed for internal monthly derived US asset return cache",
    attributionQuestion: "What attribution or citation is required in docs, API metadata, or UI",
    displayLabelQuestion: "How should adjusted-close reconstructed returns be labeled to avoid total-return overclaiming",
    nextAction: "owner_and_legal_review_US_provider_terms_before_adapter",
  },
  SP500_TR_primary_or_SPY_adjusted_close_proxy: {
    reviewScope: "S&P 500 total-return benchmark or SPY adjusted-close proxy",
    requiredOwnerDecision: "select_SP500_TR_provider_or_document_SPY_proxy_policy",
    requiredLegalDecision: "confirm_index_or_proxy_license_and_display_label_policy",
    commercialUseQuestion: "May FINPLE use this index or proxy benchmark in production analytics",
    redistributionQuestion: "May FINPLE store and serve derived monthly benchmark returns internally",
    rawPayloadQuestion: "Should index or proxy raw responses be stored, hash-only, or discarded",
    cacheQuestion: "What retention period is allowed for benchmark return cache",
    attributionQuestion: "What index or provider attribution is required",
    displayLabelQuestion: "If SPY is used, must UI/API label it as proxy instead of official S&P 500 TR",
    nextAction: "owner_and_legal_review_SP500_TR_or_proxy_policy_before_adapter",
  },
  KR_price_total_return_dividend_provider: {
    reviewScope: "KR ETF close distribution split and KRW total-return reconstruction",
    requiredOwnerDecision: "select_KR_market_data_provider_or_reject_candidate",
    requiredLegalDecision: "confirm_KR_market_data_commercial_terms_and_internal_cache_policy",
    commercialUseQuestion: "May FINPLE use this KR market data provider for production commercial analytics",
    redistributionQuestion: "May FINPLE store and serve derived monthly KR ETF returns without redistributing raw data",
    rawPayloadQuestion: "Should KR raw responses be stored, hash-only, or discarded after derivation",
    cacheQuestion: "What retention period is allowed for internal monthly derived KR asset return cache",
    attributionQuestion: "What attribution or citation is required for KR market data",
    displayLabelQuestion: "How should distribution-adjusted KR ETF returns be labeled",
    nextAction: "owner_and_legal_review_KR_provider_terms_before_adapter",
  },
  KOSPI200_TR_primary_or_kospi200_etf_proxy: {
    reviewScope: "KOSPI 200 total-return benchmark or licensed ETF proxy",
    requiredOwnerDecision: "select_KOSPI200_TR_provider_or_document_ETF_proxy_policy",
    requiredLegalDecision: "confirm_KRX_index_license_or_proxy_terms_and_display_label_policy",
    commercialUseQuestion: "May FINPLE use this KOSPI 200 index or proxy benchmark in production analytics",
    redistributionQuestion: "May FINPLE store and serve derived monthly KR benchmark returns internally",
    rawPayloadQuestion: "Should KRX or proxy raw responses be stored, hash-only, or discarded",
    cacheQuestion: "What retention period is allowed for KR benchmark return cache",
    attributionQuestion: "What KRX, index, or provider attribution is required",
    displayLabelQuestion: "If an ETF proxy is used, must UI/API label it as proxy instead of official KOSPI 200 TR",
    nextAction: "owner_and_legal_review_KOSPI200_TR_or_proxy_policy_before_adapter",
  },
  USD_KRW_fx_provider: {
    reviewScope: "USD/KRW daily FX source for monthly FX return derivation",
    requiredOwnerDecision: "select_USD_KRW_provider_or_reject_candidate",
    requiredLegalDecision: "confirm_FX_source_terms_citation_and_cache_policy",
    commercialUseQuestion: "May FINPLE use this FX source for production commercial analytics",
    redistributionQuestion: "May FINPLE store and serve derived monthly FX returns without redistributing raw observations",
    rawPayloadQuestion: "Should FX raw observations be stored, hash-only, or discarded after derivation",
    cacheQuestion: "What retention period is allowed for internal monthly FX return cache",
    attributionQuestion: "What source citation is required for USD/KRW derived returns",
    displayLabelQuestion: "How should USDKRW return direction and missing-day fallback be labeled",
    nextAction: "owner_and_legal_review_FX_terms_and_citation_before_adapter",
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

function buildDecisionPacket() {
  if (!fs.existsSync(TERMS_REVIEW_CSV_PATH)) {
    fail(`${TERMS_REVIEW_CSV_PATH} not found`);
  }

  const termsReview = parseCsv(fs.readFileSync(TERMS_REVIEW_CSV_PATH, "utf8"), TERMS_REVIEW_CSV_PATH);
  const rows = termsReview.rows.map((row) => {
    const details = DECISION_DETAILS[row.providerCandidate];
    if (!details) {
      fail(`${TERMS_REVIEW_CSV_PATH} has provider without owner/legal decision details: ${row.providerCandidate}`);
    }
    if (row.approvalStatus !== "not_approved") {
      fail(`${TERMS_REVIEW_CSV_PATH} has unexpected approved provider before owner/legal packet: ${row.providerCandidate}`);
    }
    return {
      providerCandidate: row.providerCandidate,
      namedProviderCandidate: row.namedProviderCandidate,
      officialDocsUrl: row.officialDocsUrl,
      officialTermsUrl: row.officialTermsUrl,
      reviewScope: details.reviewScope,
      requiredOwnerDecision: details.requiredOwnerDecision,
      requiredLegalDecision: details.requiredLegalDecision,
      commercialUseQuestion: details.commercialUseQuestion,
      redistributionQuestion: details.redistributionQuestion,
      rawPayloadQuestion: details.rawPayloadQuestion,
      cacheQuestion: details.cacheQuestion,
      attributionQuestion: details.attributionQuestion,
      displayLabelQuestion: details.displayLabelQuestion,
      adapterApprovalStatus: PENDING_ADAPTER_STATUS,
      monthlyWriteApprovalStatus: BLOCKED_MONTHLY_WRITE_STATUS,
      decisionOwner: "",
      legalReviewer: "",
      reviewedAt: "",
      evidenceUrl: "",
      blocker: row.blocker,
      nextAction: details.nextAction,
    };
  });

  if (rows.length !== EXPECTED_PROVIDER_CANDIDATES) {
    fail(`${TERMS_REVIEW_CSV_PATH} must produce ${EXPECTED_PROVIDER_CANDIDATES} owner/legal decision rows, got ${rows.length}`);
  }
  const providerCandidates = uniqueSorted(rows.map((row) => row.providerCandidate));
  const expectedProviders = uniqueSorted(Object.keys(DECISION_DETAILS));
  if (providerCandidates.join("|") !== expectedProviders.join("|")) {
    fail(`${TERMS_REVIEW_CSV_PATH} provider candidates do not match expected P0 owner/legal decision set`);
  }
  for (const row of rows) {
    assertHttpsUrl(row.officialDocsUrl, `${row.providerCandidate} officialDocsUrl`);
    assertHttpsUrl(row.officialTermsUrl, `${row.providerCandidate} officialTermsUrl`);
  }
  if (rows.some((row) => row.adapterApprovalStatus !== PENDING_ADAPTER_STATUS)) {
    fail(`${DECISION_PACKET_CSV_PATH} must keep adapterApprovalStatus=${PENDING_ADAPTER_STATUS} before real owner/legal review`);
  }
  if (rows.some((row) => row.monthlyWriteApprovalStatus !== BLOCKED_MONTHLY_WRITE_STATUS)) {
    fail(`${DECISION_PACKET_CSV_PATH} must keep monthlyWriteApprovalStatus=${BLOCKED_MONTHLY_WRITE_STATUS} before real owner/legal review`);
  }
  if (rows.some((row) => row.decisionOwner || row.legalReviewer || row.reviewedAt || row.evidenceUrl)) {
    fail(`${DECISION_PACKET_CSV_PATH} must keep owner/legal reviewer fields blank before real owner/legal review`);
  }
  if (fs.existsSync(MONTHLY_DATA_PATH)) {
    fail(`${MONTHLY_DATA_PATH} exists before owner/legal decisions are approved`);
  }

  return {
    csv: toCsv(rows),
    summary: stableJson({
      packetVersion: PACKET_VERSION,
      auditedAt: AUDITED_AT,
      sourceFiles: {
        externalTermsReview: TERMS_REVIEW_CSV_PATH,
      },
      outputFiles: {
        csv: DECISION_PACKET_CSV_PATH,
        summary: DECISION_PACKET_SUMMARY_PATH,
        monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
      },
      rowCounts: {
        providerCandidates: rows.length,
        pendingOwnerLegalReview: rows.filter(
          (row) => row.adapterApprovalStatus === PENDING_ADAPTER_STATUS,
        ).length,
        approvedForAdapter: rows.filter((row) => row.adapterApprovalStatus === "approved_for_adapter").length,
        approvedForMonthlyWrite: rows.filter((row) => row.monthlyWriteApprovalStatus === "approved_for_monthly_write")
          .length,
      },
      counts: {
        byAdapterApprovalStatus: countBy(rows, "adapterApprovalStatus"),
        byMonthlyWriteApprovalStatus: countBy(rows, "monthlyWriteApprovalStatus"),
        byBlocker: countBy(rows, "blocker"),
      },
      ownerLegalIntegrity: {
        expectedProviderCandidates: EXPECTED_PROVIDER_CANDIDATES,
        providerSetVerified: true,
        officialUrlsVerified: true,
        noAdapterApproval: true,
        noMonthlyWriteApproval: true,
        reviewerFieldsBlank: true,
        monthlyDataFileAbsent: true,
      },
      readiness: {
        status: "pending_owner_legal_decision_packet",
        providerCallsAllowed: false,
        monthlyDataFileWritten: false,
        bootstrapStillBlocked: true,
        nextAllowedStep: "owner_legal_fill_decision_packet_before_provider_adapter_or_monthly_cache_write",
      },
    }),
  };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const packet = buildDecisionPacket();

  if (checkOnly) {
    for (const [filePath, expected] of [
      [DECISION_PACKET_CSV_PATH, packet.csv],
      [DECISION_PACKET_SUMMARY_PATH, packet.summary],
    ]) {
      if (!fs.existsSync(filePath)) {
        fail(`${filePath} not found; run node scripts/generate-scenario-p0-owner-legal-decision-packet.cjs`);
      }
      const current = fs.readFileSync(filePath, "utf8");
      if (current !== expected) {
        fail(`${filePath} is out of date; run node scripts/generate-scenario-p0-owner-legal-decision-packet.cjs`);
      }
    }
    console.log("[generate-scenario-p0-owner-legal-decision-packet] ok");
    console.log(`[generate-scenario-p0-owner-legal-decision-packet] csv=${DECISION_PACKET_CSV_PATH}`);
    console.log(`[generate-scenario-p0-owner-legal-decision-packet] summary=${DECISION_PACKET_SUMMARY_PATH}`);
    return;
  }

  fs.writeFileSync(DECISION_PACKET_CSV_PATH, packet.csv);
  fs.writeFileSync(DECISION_PACKET_SUMMARY_PATH, packet.summary);
  console.log("[generate-scenario-p0-owner-legal-decision-packet] wrote decision packet");
  console.log(`[generate-scenario-p0-owner-legal-decision-packet] csv=${DECISION_PACKET_CSV_PATH}`);
  console.log(`[generate-scenario-p0-owner-legal-decision-packet] summary=${DECISION_PACKET_SUMMARY_PATH}`);
}

main();
