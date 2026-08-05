import { createHash } from "node:crypto";

export const SCALPING_HISTORICAL_DATA_INTAKE_VERSION = "scalping-historical-data-intake-v1";
export const SCALPING_HISTORICAL_RAW_REVISION_VERSION = "scalping-historical-raw-revision-v1";
export const SCALPING_HISTORICAL_LICENSE_RECEIPT_VERSION = "scalping-historical-license-receipt-v1";

export const SCALPING_HISTORICAL_SYMBOLS = Object.freeze([
  "TQQQ",
  "SQQQ",
  "SOXL",
  "SOXS",
  "UPRO",
  "SPXU",
  "TNA",
  "TZA",
]);

export const SCALPING_HISTORICAL_PROVIDER_POLICY = Object.freeze({
  policyVersion: "scalping-historical-provider-policy-2026-08-05-v1",
  reviewedAt: "2026-08-05T00:00:00.000Z",
  primaryCandidate: {
    providerId: "databento",
    datasetId: "EQUS.MINI",
    requiredSchemas: ["ohlcv-1m", "bbo-1m"],
    optionalSchemas: ["trades", "mbp-1", "definition"],
    rationale: [
      "usage_based_historical_pricing",
      "minute_ohlcv_and_top_of_book_available",
      "self_service_licensing",
      "suitable_for_bounded_eight_symbol_research",
    ],
  },
  secondaryCandidates: [
    {
      providerId: "massive",
      datasetId: "us_stocks_sip",
      requiredSchemas: ["minute_aggregates"],
      optionalSchemas: ["trades", "quotes"],
      rationale: ["consolidated_us_market_coverage", "fixed_plan_historical_access", "cross_check_candidate"],
    },
    {
      providerId: "alpaca",
      datasetId: "stocks_sip",
      requiredSchemas: ["bars_1min"],
      optionalSchemas: ["quotes", "trades"],
      rationale: ["sip_feed_candidate", "simple_rest_pagination", "subscription_fallback"],
    },
  ],
  decisionStatus: "candidate_selected_purchase_not_authorized",
  purchaseAuthorized: false,
  providerCallsAllowed: false,
});

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function iso(value) {
  const parsed = Date.parse(clean(value));
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function canonical(value) {
  return JSON.stringify(stable(value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSymbols(values) {
  return unique((Array.isArray(values) ? values : []).map((value) => clean(value).toUpperCase())).sort();
}

function normalizeSchemas(values) {
  return unique((Array.isArray(values) ? values : []).map((value) => clean(value).toLowerCase())).sort();
}

function normalizeProviderId(value) {
  return clean(value).toLowerCase();
}

function providerPolicy(providerId) {
  const normalized = normalizeProviderId(providerId);
  if (SCALPING_HISTORICAL_PROVIDER_POLICY.primaryCandidate.providerId === normalized) {
    return SCALPING_HISTORICAL_PROVIDER_POLICY.primaryCandidate;
  }
  return SCALPING_HISTORICAL_PROVIDER_POLICY.secondaryCandidates.find((candidate) => candidate.providerId === normalized) || null;
}

export function buildScalpingHistoricalAcquisitionPlan(input = {}) {
  const providerId = normalizeProviderId(input.providerId || SCALPING_HISTORICAL_PROVIDER_POLICY.primaryCandidate.providerId);
  const provider = providerPolicy(providerId);
  const symbols = normalizeSymbols(input.symbols?.length ? input.symbols : SCALPING_HISTORICAL_SYMBOLS);
  const start = iso(input.start);
  const end = iso(input.end);
  const requestedSchemas = normalizeSchemas(input.schemas?.length ? input.schemas : provider?.requiredSchemas || []);

  const reasons = unique([
    provider ? null : "provider_not_reviewed",
    symbols.length > 0 ? null : "symbols_required",
    symbols.length <= SCALPING_HISTORICAL_SYMBOLS.length ? null : "symbol_limit_exceeded",
    ...symbols.map((symbol) => SCALPING_HISTORICAL_SYMBOLS.includes(symbol) ? null : `symbol_not_allowed:${symbol}`),
    start ? null : "start_invalid",
    end ? null : "end_invalid",
    start && end && Date.parse(start) < Date.parse(end) ? null : "date_range_invalid",
    requestedSchemas.length > 0 ? null : "schemas_required",
    ...(provider?.requiredSchemas || []).map((schema) => requestedSchemas.includes(schema) ? null : `required_schema_missing:${schema}`),
  ]);

  const valid = reasons.length === 0;
  const planCore = {
    intakeVersion: SCALPING_HISTORICAL_DATA_INTAKE_VERSION,
    providerPolicyVersion: SCALPING_HISTORICAL_PROVIDER_POLICY.policyVersion,
    providerId,
    datasetId: provider?.datasetId || null,
    symbols,
    schemas: requestedSchemas,
    start,
    end,
    deliveryMode: clean(input.deliveryMode) || "historical_batch",
    encoding: clean(input.encoding) || "csv_or_dbn",
    adjustmentPolicy: clean(input.adjustmentPolicy) || "split_adjusted_with_raw_receipt",
    sessionPolicy: "us_equity_regular_session_only",
    quotePolicy: requestedSchemas.some((schema) => schema.includes("bbo") || schema.includes("quote"))
      ? "historical_quote_required"
      : "quote_absent_requires_separate_execution_calibration",
    requestedBy: clean(input.requestedBy) || "admin_research",
    requestedAt: iso(input.requestedAt) || null,
  };

  return {
    valid,
    reasons,
    plan: valid ? {
      ...planCore,
      planChecksum: sha256(canonical(planCore)),
      purchaseAuthorized: false,
      providerCallsAllowed: false,
      secretsIncluded: false,
    } : null,
    safety: {
      purchaseAuthorized: false,
      providerCallsAllowed: false,
      apiKeyAccepted: false,
      credentialsPersisted: false,
      orderSubmissionAllowed: false,
    },
  };
}

export function validateScalpingHistoricalLicenseReceipt(receipt = {}, options = {}) {
  const providerId = normalizeProviderId(receipt.providerId);
  const provider = providerPolicy(providerId);
  const acquiredAt = iso(receipt.acquiredAt);
  const termsCheckedAt = iso(receipt.termsCheckedAt);
  const validUntil = receipt.validUntil ? iso(receipt.validUntil) : null;
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const receiptChecksum = clean(receipt.receiptChecksum);

  const receiptCore = {
    receiptVersion: clean(receipt.receiptVersion),
    providerId,
    datasetId: clean(receipt.datasetId),
    licensePolicyId: clean(receipt.licensePolicyId),
    quoteOrInvoiceId: clean(receipt.quoteOrInvoiceId),
    acquiredAt,
    termsCheckedAt,
    validUntil,
    useCase: clean(receipt.useCase),
    displayUse: clean(receipt.displayUse),
    redistributionPolicy: clean(receipt.redistributionPolicy),
    retentionPolicy: clean(receipt.retentionPolicy),
    legalUserType: clean(receipt.legalUserType),
    reviewedBy: clean(receipt.reviewedBy),
    immutable: receipt.immutable === true,
  };

  const reasons = unique([
    receiptCore.receiptVersion === SCALPING_HISTORICAL_LICENSE_RECEIPT_VERSION ? null : "license_receipt_version_invalid",
    provider ? null : "license_provider_not_reviewed",
    receiptCore.datasetId && receiptCore.datasetId === provider?.datasetId ? null : "license_dataset_mismatch",
    receiptCore.licensePolicyId ? null : "license_policy_id_missing",
    receiptCore.quoteOrInvoiceId ? null : "quote_or_invoice_id_missing",
    acquiredAt ? null : "license_acquired_at_invalid",
    termsCheckedAt ? null : "license_terms_checked_at_invalid",
    receiptCore.useCase === "internal_non_display_research" ? null : "license_use_case_not_approved",
    receiptCore.displayUse === "private_admin_only" ? null : "license_display_scope_not_approved",
    receiptCore.redistributionPolicy === "no_external_redistribution" ? null : "license_redistribution_not_blocked",
    receiptCore.retentionPolicy ? null : "license_retention_policy_missing",
    receiptCore.legalUserType ? null : "license_user_type_missing",
    receiptCore.reviewedBy ? null : "license_reviewer_missing",
    receiptCore.immutable ? null : "license_receipt_not_immutable",
    validUntil && Date.parse(validUntil) <= nowMs ? "license_receipt_expired" : null,
    receiptChecksum ? null : "license_receipt_checksum_missing",
    receiptChecksum && receiptChecksum === sha256(canonical(receiptCore)) ? null : "license_receipt_checksum_mismatch",
  ]);

  return {
    valid: reasons.length === 0,
    reasons,
    receipt: reasons.length === 0 ? { ...receiptCore, receiptChecksum } : null,
    safety: {
      secretsIncluded: false,
      apiKeyStored: false,
      redistributionAllowed: false,
      providerCallsAllowed: false,
    },
  };
}

function normalizeQuote(quote = {}) {
  const bid = finite(quote.bid);
  const ask = finite(quote.ask);
  const bidSize = finite(quote.bidSize);
  const askSize = finite(quote.askSize);
  const valid = bid !== null && ask !== null && bid > 0 && ask >= bid;
  return {
    valid,
    bid,
    ask,
    bidSize: bidSize !== null && bidSize >= 0 ? bidSize : null,
    askSize: askSize !== null && askSize >= 0 ? askSize : null,
    spreadBps: valid ? ((ask - bid) / ((ask + bid) / 2)) * 10_000 : null,
  };
}

function normalizeRow(row = {}, index = 0) {
  const symbol = clean(row.symbol).toUpperCase();
  const timestamp = iso(row.timestamp);
  const open = finite(row.open);
  const high = finite(row.high);
  const low = finite(row.low);
  const close = finite(row.close);
  const volume = finite(row.volume);
  const quote = normalizeQuote(row.quote);
  const sessionDate = clean(row.sessionDate);
  const sessionName = clean(row.session?.name || row.sessionName).toUpperCase();
  const sourceSchema = clean(row.sourceSchema).toLowerCase();
  const sourceSequence = clean(row.sourceSequence || row.sequence);

  const reasons = unique([
    SCALPING_HISTORICAL_SYMBOLS.includes(symbol) ? null : `row_${index}_symbol_not_allowed`,
    timestamp ? null : `row_${index}_timestamp_invalid`,
    sessionDate ? null : `row_${index}_session_date_missing`,
    sessionName === "REGULAR" ? null : `row_${index}_regular_session_required`,
    open !== null && open > 0 ? null : `row_${index}_open_invalid`,
    high !== null && high > 0 ? null : `row_${index}_high_invalid`,
    low !== null && low > 0 ? null : `row_${index}_low_invalid`,
    close !== null && close > 0 ? null : `row_${index}_close_invalid`,
    volume !== null && volume >= 0 ? null : `row_${index}_volume_invalid`,
    high !== null && low !== null && high >= low ? null : `row_${index}_high_below_low`,
    high !== null && open !== null && high >= open ? null : `row_${index}_high_below_open`,
    high !== null && close !== null && high >= close ? null : `row_${index}_high_below_close`,
    low !== null && open !== null && low <= open ? null : `row_${index}_low_above_open`,
    low !== null && close !== null && low <= close ? null : `row_${index}_low_above_close`,
    quote.valid ? null : `row_${index}_quote_invalid`,
    sourceSchema ? null : `row_${index}_source_schema_missing`,
    sourceSequence ? null : `row_${index}_source_sequence_missing`,
  ]);

  return {
    valid: reasons.length === 0,
    reasons,
    row: {
      symbol,
      timestamp,
      sessionDate,
      open,
      high,
      low,
      close,
      volume,
      quote: {
        bid: quote.bid,
        ask: quote.ask,
        bidSize: quote.bidSize,
        askSize: quote.askSize,
        spreadBps: quote.spreadBps,
      },
      session: { name: sessionName },
      sourceSchema,
      sourceSequence,
    },
  };
}

function coverageSummary(rows) {
  const bySymbol = {};
  const bySession = {};
  for (const row of rows) {
    bySymbol[row.symbol] = (bySymbol[row.symbol] || 0) + 1;
    bySession[row.sessionDate] = (bySession[row.sessionDate] || 0) + 1;
  }
  return {
    symbols: Object.fromEntries(Object.entries(bySymbol).sort(([left], [right]) => left.localeCompare(right))),
    sessions: Object.fromEntries(Object.entries(bySession).sort(([left], [right]) => left.localeCompare(right))),
    symbolCount: Object.keys(bySymbol).length,
    sessionCount: Object.keys(bySession).length,
  };
}

export function buildImmutableScalpingHistoricalRawRevision(input = {}, options = {}) {
  const planResult = buildScalpingHistoricalAcquisitionPlan(input.plan || {});
  const licenseResult = validateScalpingHistoricalLicenseReceipt(input.licenseReceipt || {}, options);
  const rawRows = Array.isArray(input.rows) ? input.rows : [];
  const normalized = rawRows.map((row, index) => normalizeRow(row, index));
  const rowReasons = normalized.flatMap((result) => result.reasons);
  const rows = normalized.filter((result) => result.valid).map((result) => result.row)
    .sort((left, right) => left.timestamp.localeCompare(right.timestamp) || left.symbol.localeCompare(right.symbol));

  const seen = new Set();
  const duplicateReasons = [];
  for (const row of rows) {
    const key = `${row.symbol}|${row.timestamp}`;
    if (seen.has(key)) duplicateReasons.push(`duplicate_row:${key}`);
    seen.add(key);
  }

  const expectedSymbols = planResult.plan?.symbols || [];
  const actualSymbols = normalizeSymbols(rows.map((row) => row.symbol));
  const missingSymbols = expectedSymbols.filter((symbol) => !actualSymbols.includes(symbol));
  const sourceRevision = clean(input.sourceRevision);
  const exportJobId = clean(input.exportJobId);
  const providerFileChecksum = clean(input.providerFileChecksum);
  const calendarVersion = clean(input.calendarVersion);
  const immutable = input.immutable === true;

  const reasons = unique([
    ...planResult.reasons,
    ...licenseResult.reasons,
    ...rowReasons,
    ...duplicateReasons,
    rawRows.length > 0 ? null : "raw_rows_required",
    rows.length === rawRows.length ? null : "raw_rows_rejected",
    missingSymbols.length === 0 ? null : `planned_symbols_missing:${missingSymbols.join(",")}`,
    sourceRevision ? null : "source_revision_missing",
    exportJobId ? null : "export_job_id_missing",
    providerFileChecksum ? null : "provider_file_checksum_missing",
    calendarVersion ? null : "calendar_version_missing",
    immutable ? null : "raw_revision_not_immutable",
  ]);

  const coverage = coverageSummary(rows);
  const revisionCore = {
    revisionVersion: SCALPING_HISTORICAL_RAW_REVISION_VERSION,
    intakeVersion: SCALPING_HISTORICAL_DATA_INTAKE_VERSION,
    sourceRevision,
    exportJobId,
    providerId: planResult.plan?.providerId || null,
    datasetId: planResult.plan?.datasetId || null,
    providerFileChecksum,
    planChecksum: planResult.plan?.planChecksum || null,
    licenseReceiptChecksum: licenseResult.receipt?.receiptChecksum || null,
    calendarVersion,
    symbols: expectedSymbols,
    schemas: planResult.plan?.schemas || [],
    rowCount: rows.length,
    coverage,
    rows,
    immutable,
  };
  const rawDataChecksum = sha256(canonical(revisionCore));

  return {
    valid: reasons.length === 0,
    reasons,
    revision: reasons.length === 0 ? {
      ...revisionCore,
      rawDataChecksum,
      datasetId: `scalping-1m-${sourceRevision}`,
      status: "immutable_intake_candidate",
      readyForModelResearch: true,
      readyForRuntime: false,
      persistedByThisFunction: false,
    } : null,
    quality: {
      inputRows: rawRows.length,
      acceptedRows: rows.length,
      rejectedRows: rawRows.length - rows.length,
      duplicateRows: duplicateReasons.length,
      missingSymbols,
      forwardFillUsed: false,
      quoteRequired: true,
    },
    safety: {
      providerCallsAllowed: false,
      externalDownloadPerformed: false,
      apiKeyAccepted: false,
      credentialsPersisted: false,
      rawPayloadPersisted: false,
      automaticModelApprovalAllowed: false,
      runtimeRegistrationAllowed: false,
      orderSubmissionAllowed: false,
    },
  };
}

export function compareScalpingHistoricalSourceSamples(primaryRevision, secondaryRevision, options = {}) {
  const maximumCloseDifferenceBps = finite(options.maximumCloseDifferenceBps) ?? 5;
  const maximumSpreadDifferenceBps = finite(options.maximumSpreadDifferenceBps) ?? 10;
  const primaryRows = Array.isArray(primaryRevision?.rows) ? primaryRevision.rows : [];
  const secondaryRows = Array.isArray(secondaryRevision?.rows) ? secondaryRevision.rows : [];
  const secondaryByKey = new Map(secondaryRows.map((row) => [`${row.symbol}|${row.timestamp}`, row]));
  const comparisons = [];

  for (const row of primaryRows) {
    const counterpart = secondaryByKey.get(`${row.symbol}|${row.timestamp}`);
    if (!counterpart) continue;
    const closeDifferenceBps = Math.abs(row.close / counterpart.close - 1) * 10_000;
    const spreadDifferenceBps = Math.abs((row.quote?.spreadBps ?? 0) - (counterpart.quote?.spreadBps ?? 0));
    comparisons.push({
      symbol: row.symbol,
      timestamp: row.timestamp,
      closeDifferenceBps,
      spreadDifferenceBps,
      accepted: closeDifferenceBps <= maximumCloseDifferenceBps && spreadDifferenceBps <= maximumSpreadDifferenceBps,
    });
  }

  return {
    valid: comparisons.length > 0 && comparisons.every((row) => row.accepted),
    comparisons,
    thresholds: { maximumCloseDifferenceBps, maximumSpreadDifferenceBps },
    matchedRows: comparisons.length,
    safety: {
      sourceAutoReplacementAllowed: false,
      modelAutoApprovalAllowed: false,
      orderSubmissionAllowed: false,
    },
  };
}
