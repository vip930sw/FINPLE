import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import {
  SCALPING_HISTORICAL_LICENSE_RECEIPT_VERSION,
  SCALPING_HISTORICAL_PROVIDER_POLICY,
  buildImmutableScalpingHistoricalRawRevision,
  buildScalpingHistoricalAcquisitionPlan,
  compareScalpingHistoricalSourceSamples,
  validateScalpingHistoricalLicenseReceipt,
} from "./tradingScalpingHistoricalDataIntake.js";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function receipt(overrides = {}) {
  const core = {
    receiptVersion: SCALPING_HISTORICAL_LICENSE_RECEIPT_VERSION,
    providerId: "databento",
    datasetId: "EQUS.MINI",
    licensePolicyId: "db-equs-mini-historical-internal-research-2026-08-05",
    quoteOrInvoiceId: "portal-estimate-001",
    acquiredAt: "2026-08-05T08:00:00.000Z",
    termsCheckedAt: "2026-08-05T08:00:00.000Z",
    validUntil: "2027-08-05T00:00:00.000Z",
    useCase: "internal_non_display_research",
    displayUse: "private_admin_only",
    redistributionPolicy: "no_external_redistribution",
    retentionPolicy: "retain_immutable_internal_copy_per_terms",
    legalUserType: "individual_non_professional_pending_provider_classification",
    reviewedBy: "representative",
    immutable: true,
    ...overrides,
  };
  return { ...core, receiptChecksum: checksum(core) };
}

function plan(overrides = {}) {
  return {
    providerId: "databento",
    symbols: ["TQQQ", "SQQQ"],
    schemas: ["ohlcv-1m", "bbo-1m"],
    start: "2026-07-01T13:30:00.000Z",
    end: "2026-07-03T20:00:00.000Z",
    requestedAt: "2026-08-05T08:00:00.000Z",
    ...overrides,
  };
}

function row(symbol, timestamp, close, sequence) {
  return {
    symbol,
    timestamp,
    sessionDate: timestamp.slice(0, 10),
    open: close - 0.05,
    high: close + 0.1,
    low: close - 0.1,
    close,
    volume: 1000,
    quote: {
      bid: close - 0.01,
      ask: close + 0.01,
      bidSize: 100,
      askSize: 120,
    },
    session: { name: "REGULAR" },
    sourceSchema: "ohlcv-1m+bbo-1m",
    sourceSequence: sequence,
  };
}

function rawInput(overrides = {}) {
  return {
    plan: plan(),
    licenseReceipt: receipt(),
    sourceRevision: "db-equs-mini-2026-07-01_2026-07-03-v1",
    exportJobId: "batch-job-001",
    providerFileChecksum: "provider-file-sha256-001",
    calendarVersion: "nyse-equity-calendar-2026-2028-v1",
    immutable: true,
    rows: [
      row("TQQQ", "2026-07-01T13:30:00.000Z", 50, "1"),
      row("SQQQ", "2026-07-01T13:30:00.000Z", 30, "2"),
      row("TQQQ", "2026-07-01T13:31:00.000Z", 50.1, "3"),
      row("SQQQ", "2026-07-01T13:31:00.000Z", 29.95, "4"),
    ],
    ...overrides,
  };
}

test("selects Databento EQUS.MINI as a purchase-blocked primary candidate", () => {
  assert.equal(SCALPING_HISTORICAL_PROVIDER_POLICY.primaryCandidate.providerId, "databento");
  assert.equal(SCALPING_HISTORICAL_PROVIDER_POLICY.primaryCandidate.datasetId, "EQUS.MINI");
  assert.deepEqual(SCALPING_HISTORICAL_PROVIDER_POLICY.primaryCandidate.requiredSchemas, ["ohlcv-1m", "bbo-1m"]);
  assert.equal(SCALPING_HISTORICAL_PROVIDER_POLICY.purchaseAuthorized, false);
  assert.equal(SCALPING_HISTORICAL_PROVIDER_POLICY.providerCallsAllowed, false);
});

test("builds a deterministic acquisition plan without provider calls or credentials", () => {
  const first = buildScalpingHistoricalAcquisitionPlan(plan());
  const second = buildScalpingHistoricalAcquisitionPlan(plan());
  assert.equal(first.valid, true);
  assert.equal(first.plan.planChecksum, second.plan.planChecksum);
  assert.equal(first.plan.datasetId, "EQUS.MINI");
  assert.equal(first.plan.purchaseAuthorized, false);
  assert.equal(first.safety.apiKeyAccepted, false);
  assert.equal(first.safety.providerCallsAllowed, false);
});

test("rejects unreviewed symbols and missing quote schema", () => {
  const result = buildScalpingHistoricalAcquisitionPlan(plan({
    symbols: ["TQQQ", "AAPL"],
    schemas: ["ohlcv-1m"],
  }));
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes("symbol_not_allowed:AAPL"));
  assert.ok(result.reasons.includes("required_schema_missing:bbo-1m"));
});

test("validates an immutable internal research license receipt", () => {
  const valid = validateScalpingHistoricalLicenseReceipt(receipt(), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  assert.equal(valid.valid, true);
  assert.equal(valid.receipt.redistributionPolicy, "no_external_redistribution");
  assert.equal(valid.safety.redistributionAllowed, false);

  const invalidCore = receipt({ redistributionPolicy: "external_distribution" });
  const invalid = validateScalpingHistoricalLicenseReceipt(invalidCore, { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.reasons.includes("license_redistribution_not_blocked"));
});

test("creates a deterministic immutable raw revision from accepted rows", () => {
  const first = buildImmutableScalpingHistoricalRawRevision(rawInput(), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  const second = buildImmutableScalpingHistoricalRawRevision(rawInput(), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  assert.equal(first.valid, true);
  assert.equal(first.revision.rawDataChecksum, second.revision.rawDataChecksum);
  assert.equal(first.revision.status, "immutable_intake_candidate");
  assert.equal(first.revision.readyForModelResearch, true);
  assert.equal(first.revision.readyForRuntime, false);
  assert.equal(first.quality.forwardFillUsed, false);
  assert.equal(first.quality.acceptedRows, 4);
  assert.equal(first.revision.coverage.symbolCount, 2);
  assert.equal(first.safety.externalDownloadPerformed, false);
  assert.equal(first.safety.orderSubmissionAllowed, false);
});

test("fails closed on duplicates, bad quotes, or missing planned symbols", () => {
  const duplicateRows = rawInput().rows;
  const duplicate = buildImmutableScalpingHistoricalRawRevision(rawInput({
    rows: [...duplicateRows, duplicateRows[0]],
  }), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  assert.equal(duplicate.valid, false);
  assert.ok(duplicate.reasons.some((reason) => reason.startsWith("duplicate_row:")));

  const badQuote = buildImmutableScalpingHistoricalRawRevision(rawInput({
    rows: [
      { ...row("TQQQ", "2026-07-01T13:30:00.000Z", 50, "1"), quote: { bid: 51, ask: 50 } },
      row("SQQQ", "2026-07-01T13:30:00.000Z", 30, "2"),
    ],
  }), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  assert.equal(badQuote.valid, false);
  assert.ok(badQuote.reasons.includes("row_0_quote_invalid"));
  assert.ok(badQuote.reasons.includes("raw_rows_rejected"));

  const missing = buildImmutableScalpingHistoricalRawRevision(rawInput({
    rows: [row("TQQQ", "2026-07-01T13:30:00.000Z", 50, "1")],
  }), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  assert.equal(missing.valid, false);
  assert.ok(missing.reasons.includes("planned_symbols_missing:SQQQ"));
});

test("compares bounded primary and secondary source samples without auto replacement", () => {
  const primary = buildImmutableScalpingHistoricalRawRevision(rawInput(), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  const secondaryRows = rawInput().rows.map((item) => ({
    ...item,
    close: item.close * 1.0001,
    open: item.open * 1.0001,
    high: item.high * 1.0001,
    low: item.low * 1.0001,
    quote: {
      ...item.quote,
      bid: item.quote.bid * 1.0001,
      ask: item.quote.ask * 1.0001,
    },
  }));
  const secondary = buildImmutableScalpingHistoricalRawRevision(rawInput({
    sourceRevision: "secondary-v1",
    exportJobId: "secondary-job",
    providerFileChecksum: "secondary-checksum",
    rows: secondaryRows,
  }), { nowMs: Date.parse("2026-08-05T09:00:00Z") });
  const comparison = compareScalpingHistoricalSourceSamples(primary.revision, secondary.revision, {
    maximumCloseDifferenceBps: 2,
    maximumSpreadDifferenceBps: 2,
  });
  assert.equal(comparison.valid, true);
  assert.equal(comparison.matchedRows, 4);
  assert.equal(comparison.safety.sourceAutoReplacementAllowed, false);
  assert.equal(comparison.safety.modelAutoApprovalAllowed, false);
});
