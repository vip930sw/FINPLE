import { buildStep229OfflineDatasetQualityProfile } from "./tradingAiMlDatasetQualityProfile.js";
import { buildStep230OfflineDatasetQualityBatchSummary } from "./tradingAiMlDatasetQualityBatchSummary.js";
import { buildStep231OfflineDataQualityGateDecision } from "./tradingAiMlDatasetQualityGate.js";
import { buildStep232OfflineDataQualityGateReadiness } from "./tradingAiMlDatasetQualityGateReadiness.js";

export const STEP234B_ADAPTER_VERSION = "1.0.0";
export const STEP234B_DATASET_VERSION = "step234b-dry-run-v1";
export const STEP234B_LABEL_PURPOSE = "adapter_conformance_only";
export const STEP234B_LABEL_DISCLAIMER =
  "This label is for adapter conformance testing only and must not be used for model training, trading signals, performance claims, or investment decisions.";
export const STEP234B_TIMESTAMP_MODE = "synthetic_for_adapter_dry_run";
export const STEP234B_PROFILE_MODE = "offline_real_format_adapter_dry_run";
export const STEP234B_REPORT_MODE = "sanitized_real_format_adapter_dry_run";
export const STEP234B_USAGE_SCOPE = "internal_adapter_validation_only";

export const STEP234B_ALLOWED_SOURCE_FIELDS = Object.freeze([
  "ticker",
  "market",
  "assetType",
  "strategy",
  "riskLevel",
  "beginnerFit",
  "tags",
  "sourceRowIndex",
]);

const REQUIRED_HEADERS = Object.freeze([
  "ticker",
  "market",
  "assetType",
  "strategy",
  "riskLevel",
  "beginnerFit",
  "tags",
]);

const REPORT_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "reportMode",
  "sourceRows",
  "adaptedRecords",
  "adapter",
  "qualityProfile",
  "batchSummary",
  "gate",
  "readiness",
  "usage",
]);

const MARKET_ORDER = Object.freeze(new Map([["US", 0], ["KR", 1]]));
const SPLIT_ORDER = Object.freeze(["train", "validation", "test"]);
const SPLIT_SEQUENCE_BY_MARKET = Object.freeze(["train", "train", "train", "validation", "test"]);
const RECORD_KEYS = Object.freeze([
  "recordId",
  "split",
  "label",
  "featureTimestamp",
  "labelTimestamp",
  "threshold",
  "stringThreshold",
  "sanitizedFields",
  "versioning",
  "lineage",
  "retentionPolicy",
]);
const SANITIZED_FIELD_KEYS = Object.freeze([
  "market",
  "assetType",
  "strategy",
  "riskLevel",
  "beginnerFit",
  "tags",
  "sourceRowIndex",
]);
const BASE_FEATURE_TIMESTAMPS = Object.freeze([
  "2020-01-01T00:00:00.000Z",
  "2020-02-01T00:00:00.000Z",
  "2020-03-01T00:00:00.000Z",
  "2020-04-01T00:00:00.000Z",
  "2020-05-01T00:00:00.000Z",
  "2020-06-01T00:00:00.000Z",
  "2020-07-01T00:00:00.000Z",
  "2020-08-01T00:00:00.000Z",
  "2020-09-01T00:00:00.000Z",
  "2020-10-01T00:00:00.000Z",
]);
const BASE_LABEL_TIMESTAMPS = Object.freeze([
  "2020-01-15T00:00:00.000Z",
  "2020-02-15T00:00:00.000Z",
  "2020-03-15T00:00:00.000Z",
  "2020-04-15T00:00:00.000Z",
  "2020-05-15T00:00:00.000Z",
  "2020-06-15T00:00:00.000Z",
  "2020-07-15T00:00:00.000Z",
  "2020-08-15T00:00:00.000Z",
  "2020-09-15T00:00:00.000Z",
  "2020-10-15T00:00:00.000Z",
]);

class Step234BAdapterError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "Step234BAdapterError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const lines = String(text ?? "").split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((header, cellIndex) => {
      row[header] = cells[cellIndex] ?? "";
    });
    row.sourceRowIndex = index + 1;
    return row;
  });
  return { headers, rows };
}

function assertRequiredHeaders(headers, market) {
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Step234BAdapterError(`${market}_MISSING_REQUIRED_HEADERS`, `Step234B ${market} sample missing required headers`);
  }
}

function normalizeTicker(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizeMarket(value) {
  return String(value ?? "").trim().toUpperCase();
}

function normalizedSourceRow(row, expectedMarket) {
  return {
    ticker: normalizeTicker(row.ticker),
    market: normalizeMarket(row.market),
    assetType: String(row.assetType ?? "").trim(),
    strategy: String(row.strategy ?? "").trim(),
    riskLevel: String(row.riskLevel ?? "").trim(),
    beginnerFit: String(row.beginnerFit ?? "").trim(),
    tags: String(row.tags ?? "").trim(),
    sourceRowIndex: row.sourceRowIndex,
    expectedMarket,
  };
}

function canonicalSourceRows(rows) {
  return [...rows].sort((left, right) => {
    const marketDelta = (MARKET_ORDER.get(left.market) ?? 99) - (MARKET_ORDER.get(right.market) ?? 99);
    if (marketDelta !== 0) return marketDelta;
    const tickerDelta = left.ticker.localeCompare(right.ticker);
    if (tickerDelta !== 0) return tickerDelta;
    return left.sourceRowIndex - right.sourceRowIndex;
  });
}

function sourceRowsByMarket(sourceRows, market) {
  return canonicalSourceRows(sourceRows.filter((row) => row.market === market));
}

function buildSourceRows({ usCsv, krCsv }) {
  const us = parseCsv(usCsv);
  const kr = parseCsv(krCsv);
  assertRequiredHeaders(us.headers, "US");
  assertRequiredHeaders(kr.headers, "KR");

  const usRows = us.rows.map((row) => normalizedSourceRow(row, "US")).filter((row) => row.market === "US");
  const krRows = kr.rows.map((row) => normalizedSourceRow(row, "KR")).filter((row) => row.market === "KR");
  if (usRows.length < 5) {
    throw new Step234BAdapterError("US_SAMPLE_TOO_SMALL", "Step234B US sample requires at least five data rows");
  }
  if (krRows.length < 5) {
    throw new Step234BAdapterError("KR_SAMPLE_TOO_SMALL", "Step234B KR sample requires at least five data rows");
  }

  return canonicalSourceRows([...sourceRowsByMarket(usRows, "US").slice(0, 5), ...sourceRowsByMarket(krRows, "KR").slice(0, 5)]);
}

function splitForMarketIndex(index) {
  return SPLIT_SEQUENCE_BY_MARKET[index];
}

function assignSplits(sourceRows) {
  const assigned = [];
  for (const market of ["US", "KR"]) {
    const rows = sourceRowsByMarket(sourceRows, market);
    rows.forEach((row, index) => {
      assigned.push({ ...row, split: splitForMarketIndex(index) });
    });
  }
  return assigned.sort((left, right) => {
    const splitDelta = SPLIT_ORDER.indexOf(left.split) - SPLIT_ORDER.indexOf(right.split);
    if (splitDelta !== 0) return splitDelta;
    const marketDelta = (MARKET_ORDER.get(left.market) ?? 99) - (MARKET_ORDER.get(right.market) ?? 99);
    if (marketDelta !== 0) return marketDelta;
    const tickerDelta = left.ticker.localeCompare(right.ticker);
    if (tickerDelta !== 0) return tickerDelta;
    return left.sourceRowIndex - right.sourceRowIndex;
  });
}

function buildRecord(row, index) {
  return {
    recordId: `step234b-record-${String(index + 1).padStart(3, "0")}`,
    split: row.split,
    label: row.market,
    featureTimestamp: BASE_FEATURE_TIMESTAMPS[index],
    labelTimestamp: BASE_LABEL_TIMESTAMPS[index],
    threshold: 0,
    stringThreshold: STEP234B_LABEL_PURPOSE,
    sanitizedFields: {
      market: row.market,
      assetType: row.assetType,
      strategy: row.strategy,
      riskLevel: row.riskLevel,
      beginnerFit: row.beginnerFit,
      tags: row.tags,
      sourceRowIndex: row.sourceRowIndex,
    },
    versioning: {
      datasetVersion: STEP234B_DATASET_VERSION,
      schemaVersion: "step192-compatible",
      adapterVersion: STEP234B_ADAPTER_VERSION,
    },
    lineage: {
      sourceType: "repository_sanitized_sample",
      sourceContract: "step192",
    },
    retentionPolicy: {
      policyId: "test_fixture_only",
      rawValueStorageAllowed: false,
    },
  };
}

function buildRecordCounts(records) {
  return {
    total: records.length,
    train: records.filter((record) => record.split === "train").length,
    validation: records.filter((record) => record.split === "validation").length,
    test: records.filter((record) => record.split === "test").length,
  };
}

function buildSourceRowCounts(sourceRows) {
  return {
    total: sourceRows.length,
    us: sourceRows.filter((row) => row.market === "US").length,
    kr: sourceRows.filter((row) => row.market === "KR").length,
  };
}

function buildFixtureFromSourceRows(sourceRows) {
  const records = assignSplits(sourceRows).map(buildRecord);
  return {
    fixtureId: "step234b_sanitized_real_format_adapter_dry_run_v1",
    fixtureType: "sanitized_real_format_step192_adapter_dry_run",
    records,
    walkForwardWindows: [
      {
        windowId: "step234b-window-001",
        trainStart: "2020-01-01T00:00:00.000Z",
        trainEnd: "2020-06-01T00:00:00.000Z",
        validationStart: "2020-07-01T00:00:00.000Z",
        validationEnd: "2020-08-01T00:00:00.000Z",
        testStart: "2020-09-01T00:00:00.000Z",
        testEnd: "2020-10-01T00:00:00.000Z",
      },
    ],
    metadata: {
      sourceContract: "step192",
      adapterVersion: STEP234B_ADAPTER_VERSION,
      datasetVersion: STEP234B_DATASET_VERSION,
      profileMode: STEP234B_PROFILE_MODE,
      labelPurpose: STEP234B_LABEL_PURPOSE,
      labelDisclaimer: STEP234B_LABEL_DISCLAIMER,
      timestampMode: STEP234B_TIMESTAMP_MODE,
      versioning: {
        datasetVersion: STEP234B_DATASET_VERSION,
        schemaVersion: "step192-compatible",
      },
      lineage: {
        sourceType: "repository_sanitized_sample",
        sourceContract: "step192",
      },
      retentionPolicy: {
        policyId: "test_fixture_only",
        rawValueStorageAllowed: false,
      },
    },
  };
}

function buildStandaloneReadiness(gateDecision) {
  return buildStep232OfflineDataQualityGateReadiness({
    gateDecision,
    operatingModel: {
      ownerRole: "data_quality_owner",
      reviewerRoles: ["data_quality_reviewer"],
      evidencePolicyVersion: "1.0.0",
      blockedOverrideAllowed: false,
      rollbackProcedureDefined: true,
      incidentProcedureDefined: true,
    },
    evidenceAvailability: {
      approvalRecordTemplateAvailable: true,
    },
  });
}

function buildUsagePolicy() {
  return {
    scope: STEP234B_USAGE_SCOPE,
    allowed: [
      "adapter_development",
      "contract_validation",
      "offline_quality_dry_run",
      "unit_regression_test",
    ],
    forbidden: [
      "model_training",
      "return_prediction",
      "trading_signal_generation",
      "investment_decision",
      "internal_deployment_dataset",
      "commercial_resale",
      "full_dataset_auto_expansion",
      "provider_recollection",
      "license_confirmed_claim",
    ],
  };
}

function sameKeys(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

export function validateStep234BRealFormatDatasetFixture(fixture) {
  const blockerCodes = [];
  for (const record of fixture?.records ?? []) {
    if (!sameKeys(record, RECORD_KEYS)) blockerCodes.push("DISALLOWED_RECORD_FIELD");
    if (!sameKeys(record.sanitizedFields, SANITIZED_FIELD_KEYS)) blockerCodes.push("DISALLOWED_SANITIZED_FIELD");
    if (Date.parse(record.featureTimestamp) >= Date.parse(record.labelTimestamp)) {
      blockerCodes.push("FEATURE_TIMESTAMP_NOT_BEFORE_LABEL_TIMESTAMP");
    }
  }
  return deepFreeze({
    status: blockerCodes.length > 0 ? "blocked" : "pass",
    blockerCodes: [...new Set(blockerCodes)].sort(),
  });
}

function buildPassReport({ sourceRows, fixture, qualityProfile, batchSummary, gateDecision, readiness }) {
  return {
    schemaVersion: "1.0.0",
    reportMode: STEP234B_REPORT_MODE,
    sourceRows: buildSourceRowCounts(sourceRows),
    adaptedRecords: buildRecordCounts(fixture.records),
    adapter: {
      version: STEP234B_ADAPTER_VERSION,
      labelPurpose: STEP234B_LABEL_PURPOSE,
      labelDisclaimer: STEP234B_LABEL_DISCLAIMER,
      timestampMode: STEP234B_TIMESTAMP_MODE,
      sourceMutationDetected: false,
    },
    qualityProfile: {
      status: qualityProfile.status,
      profileMode: STEP234B_PROFILE_MODE,
      recordCounts: qualityProfile.recordCounts,
      thresholdPolicy: qualityProfile.thresholdPolicy,
    },
    batchSummary: {
      overallStatus: batchSummary.overallStatus,
      fixtureCounts: batchSummary.fixtureCounts,
      recordCounts: batchSummary.recordCounts,
    },
    gate: {
      decision: gateDecision.decision,
      offlineDatasetPromotion: gateDecision.allowedActions.offlineDatasetPromotion,
      allowedActions: gateDecision.allowedActions,
    },
    readiness: {
      status: readiness.status,
      actualLiveTradingReady: readiness.readiness.actualLiveTradingReady,
      state: readiness.readiness.state,
      allowedIntegrationTargets: readiness.allowedIntegrationTargets,
    },
    usage: buildUsagePolicy(),
  };
}

function buildBlockedReport(error) {
  return {
    schemaVersion: "1.0.0",
    reportMode: STEP234B_REPORT_MODE,
    sourceRows: { total: 0, us: 0, kr: 0 },
    adaptedRecords: { total: 0, train: 0, validation: 0, test: 0 },
    adapter: {
      version: STEP234B_ADAPTER_VERSION,
      labelPurpose: STEP234B_LABEL_PURPOSE,
      labelDisclaimer: STEP234B_LABEL_DISCLAIMER,
      timestampMode: STEP234B_TIMESTAMP_MODE,
      sourceMutationDetected: false,
    },
    qualityProfile: { status: "blocked" },
    batchSummary: { overallStatus: "blocked" },
    gate: {
      decision: "block_offline_promotion",
      offlineDatasetPromotion: false,
      allowedActions: {
        offlineDatasetPromotion: false,
        modelTraining: false,
        runtimeServing: false,
        providerAccess: false,
        orderSubmission: false,
        liveTrading: false,
      },
    },
    readiness: {
      status: "not_ready",
      actualLiveTradingReady: false,
      state: "blocked",
      allowedIntegrationTargets: {
        standaloneDryRun: false,
        nonBlockingCiReport: false,
        blockingCiGate: false,
        serverStartupGate: false,
        runtimeServingGate: false,
        modelTrainingGate: false,
        providerGate: false,
        orderGate: false,
        liveTradingGate: false,
      },
    },
    usage: buildUsagePolicy(),
    blocker: {
      code: error?.code ?? "STEP234B_ADAPTER_BLOCKED",
      message: "Step234B adapter dry-run blocked before fixture materialization",
    },
  };
}

export function buildStep234BRealFormatDatasetFixture(input = {}) {
  const source = clonePlain(input);
  const sourceRows = source.sourceRows ? canonicalSourceRows(source.sourceRows.map((row) => ({ ...row }))) : buildSourceRows(source);
  if (sourceRows.length !== 10) {
    throw new Step234BAdapterError("SOURCE_ROW_COUNT_MISMATCH", "Step234B adapter requires exactly ten selected source rows");
  }
  const fixture = buildFixtureFromSourceRows(sourceRows);
  return deepFreeze({
    sourceRows: sourceRows.map((row) => {
      const clean = {};
      for (const key of STEP234B_ALLOWED_SOURCE_FIELDS) {
        if (key === "sourceRowIndex") {
          clean.sourceRowIndex = row.sourceRowIndex;
        } else if (key in row) {
          clean[key] = row[key];
        }
      }
      return clean;
    }),
    fixture,
  });
}

export function buildStep234BRealFormatDatasetDryRun(input = {}) {
  try {
    const { sourceRows, fixture } = buildStep234BRealFormatDatasetFixture(input);
    const adapterValidation = validateStep234BRealFormatDatasetFixture(fixture);
    if (adapterValidation.status !== "pass") {
      throw new Step234BAdapterError(adapterValidation.blockerCodes[0], "Step234B adapter fixture validation blocked dry-run");
    }
    const qualityProfile = buildStep229OfflineDatasetQualityProfile(fixture);
    const batchSummary = buildStep230OfflineDatasetQualityBatchSummary([
      {
        fixtureKey: "step234b_sanitized_real_format_adapter_dry_run",
        dataset: fixture,
      },
    ]);
    const gateDecision = buildStep231OfflineDataQualityGateDecision({ batchSummary });
    const readiness = buildStandaloneReadiness(gateDecision);
    const report = buildPassReport({ sourceRows, fixture, qualityProfile, batchSummary, gateDecision, readiness });
    return deepFreeze({
      status: qualityProfile.status === "pass" &&
        batchSummary.overallStatus === "pass" &&
        gateDecision.decision === "allow_offline_promotion" &&
        readiness.status === "ready_for_standalone_dry_run" ? "pass" : "blocked",
      fixture,
      qualityProfile,
      batchSummary,
      gateDecision,
      readiness,
      report,
    });
  } catch (error) {
    if (error instanceof Step234BAdapterError) {
      return deepFreeze({
        status: "blocked",
        blocker: {
          code: error.code,
          message: error.message,
        },
        report: buildBlockedReport(error),
      });
    }
    throw error;
  }
}

export function buildStep234BRealFormatDatasetDryRunReport(input = {}) {
  const result = buildStep234BRealFormatDatasetDryRun(input);
  return deepFreeze(clonePlain(result.report));
}

export function assertNoStep234BSensitiveMaterial(value) {
  const serialized = JSON.stringify(value);
  const forbiddenPatterns = [
    /rawProviderPayload/i,
    /providerPayload/i,
    /orderPayload/i,
    /rawResponse/i,
    /credential/i,
    /secret/i,
    /token/i,
    /account/i,
    /hash/i,
    /digest/i,
    /fingerprint/i,
    /C:\\/i,
    /\/Users\//i,
    /\b(buy|sell|hold|upside|downside)\b/i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step234B sensitive or trading-signal material detected: ${pattern}`);
    }
  }
}

export const STEP234B_REAL_FORMAT_DATASET_ADAPTER_CONTRACT = deepFreeze({
  reportTopLevelKeys: REPORT_TOP_LEVEL_KEYS,
  allowedSourceFields: STEP234B_ALLOWED_SOURCE_FIELDS,
  adapterVersion: STEP234B_ADAPTER_VERSION,
  datasetVersion: STEP234B_DATASET_VERSION,
  labelPurpose: STEP234B_LABEL_PURPOSE,
  timestampMode: STEP234B_TIMESTAMP_MODE,
  profileMode: STEP234B_PROFILE_MODE,
  usageScope: STEP234B_USAGE_SCOPE,
  selectedSourceRows: { total: 10, us: 5, kr: 5 },
  adaptedRecordCounts: { total: 10, train: 6, validation: 2, test: 2 },
  readiness: { actualLiveTradingReady: false, state: "blocked" },
  redacted: true,
});
