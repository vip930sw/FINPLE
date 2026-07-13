import {
  STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT,
  STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION,
  assertNoStep235ASensitiveMaterial,
  buildStep235AOfflineFeatureDataset,
} from "./tradingAiMlOfflineFeatureBuilder.js";
import {
  STEP235A_TRADING_FEATURE_CONTRACT,
  STEP235A_TRADING_FEATURE_CONTRACT_VERSION,
  buildStep235ATradingFeatureContract,
} from "./tradingAiMlTradingFeatureContract.js";

export const STEP235B_FEATURE_COVERAGE_REPORT_SCHEMA_VERSION = "1.0.0";
export const STEP235B_FEATURE_COVERAGE_REPORT_MODE = "offline_synthetic_feature_coverage";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "reportMode",
  "featureContractVersion",
  "recordCounts",
  "featureCoverage",
  "labelCoverage",
  "splitCoverage",
  "leakageChecks",
  "usage",
  "readiness",
]);

const RECORD_COUNT_KEYS = Object.freeze(["total", "train", "validation", "test"]);
const FEATURE_COVERAGE_KEYS = Object.freeze(["feature", "availableCount", "unavailableCount", "coverageRate"]);
const LABEL_COVERAGE_KEYS = Object.freeze([
  "labelPurpose",
  "forwardReturn1mAvailableCount",
  "forwardReturn1mUnavailableCount",
  "positiveCount",
  "neutralCount",
  "negativeCount",
]);
const SPLIT_COVERAGE_KEYS = Object.freeze([
  "recordCount",
  "fullyAvailableFeatureRecordCount",
  "partiallyUnavailableFeatureRecordCount",
  "labelAvailableCount",
]);
const LEAKAGE_CHECK_KEYS = Object.freeze([
  "featureUsesFutureData",
  "featureLabelOverlap",
  "crossSplitOverlap",
  "normalizationLeakage",
]);
const USAGE_KEYS = Object.freeze([
  "modelTrainingAllowed",
  "performanceClaimAllowed",
  "runtimeServingAllowed",
  "providerAccessAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "offlineFeatureInspectionAllowed",
]);
const READINESS_KEYS = Object.freeze(["actualLiveTradingReady", "state"]);

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

function roundCoverage(availableCount, total) {
  if (total === 0) return 0;
  return Number((availableCount / total).toFixed(6));
}

function buildRecordCounts(records) {
  return {
    total: records.length,
    train: records.filter((record) => record.split === "train").length,
    validation: records.filter((record) => record.split === "validation").length,
    test: records.filter((record) => record.split === "test").length,
  };
}

function sameKeys(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

function assertSafeDatasetShape(dataset) {
  if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) {
    throw new TypeError("Step235B dataset must be an object");
  }
  if (dataset.schemaVersion !== STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION) {
    throw new TypeError("Step235B Step235A schema version mismatch");
  }
  if (dataset.featureContractVersion !== STEP235A_TRADING_FEATURE_CONTRACT_VERSION) {
    throw new TypeError("Step235B feature contract version mismatch");
  }
  if (!Array.isArray(dataset.records)) {
    throw new TypeError("Step235B records must be an array");
  }
  if (!sameKeys(dataset.leakageChecks, LEAKAGE_CHECK_KEYS)) {
    throw new TypeError("Step235B leakage check key set mismatch");
  }
  assertNoStep235ASensitiveMaterial(dataset);
}

function assertContractShape(contract) {
  if (!contract || typeof contract !== "object" || Array.isArray(contract)) {
    throw new TypeError("Step235B feature contract must be an object");
  }
  const featureNames = contract.featureDefinitions?.map((definition) => definition.name);
  if (JSON.stringify(featureNames) !== JSON.stringify(STEP235A_TRADING_FEATURE_CONTRACT.featureNames)) {
    throw new TypeError("Step235B feature contract canonical feature list mismatch");
  }
}

function assertRecordsMatchContract(records, featureNames) {
  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new TypeError("Step235B feature record must be an object");
    }
    if (!sameKeys(record.features, featureNames)) {
      throw new TypeError("Step235B feature record key set mismatch");
    }
    if (!record.label || typeof record.label !== "object") {
      throw new TypeError("Step235B label object missing");
    }
    if (!["positive", "neutral", "negative"].includes(record.label.labelClass)) {
      throw new TypeError("Step235B label class mismatch");
    }
  }
}

function assertSplitCounts(records, splits) {
  const counts = buildRecordCounts(records);
  for (const split of ["train", "validation", "test"]) {
    if (splits?.[split]?.recordCount !== counts[split]) {
      throw new TypeError("Step235B record count and split count mismatch");
    }
  }
}

function buildFeatureCoverage(records, featureNames) {
  const total = records.length;
  return featureNames.map((feature) => {
    const availableCount = records.filter((record) => record.features[feature] !== null && record.features[feature] !== undefined).length;
    return {
      feature,
      availableCount,
      unavailableCount: total - availableCount,
      coverageRate: roundCoverage(availableCount, total),
    };
  });
}

function isFullyAvailable(record, featureNames) {
  return featureNames.every((feature) => record.features[feature] !== null && record.features[feature] !== undefined);
}

function hasLabel(record) {
  return record.label?.forwardReturn1m !== null && record.label?.forwardReturn1m !== undefined;
}

function buildSplitCoverage(records, featureNames) {
  const coverage = {};
  for (const split of ["train", "validation", "test"]) {
    const splitRecords = records.filter((record) => record.split === split);
    coverage[split] = {
      recordCount: splitRecords.length,
      fullyAvailableFeatureRecordCount: splitRecords.filter((record) => isFullyAvailable(record, featureNames)).length,
      partiallyUnavailableFeatureRecordCount: splitRecords.filter((record) => !isFullyAvailable(record, featureNames)).length,
      labelAvailableCount: splitRecords.filter(hasLabel).length,
    };
  }
  return coverage;
}

function buildLabelCoverage(records) {
  const forwardReturn1mAvailableCount = records.filter(hasLabel).length;
  const positiveCount = records.filter((record) => record.label.labelClass === "positive").length;
  const neutralCount = records.filter((record) => record.label.labelClass === "neutral").length;
  const negativeCount = records.filter((record) => record.label.labelClass === "negative").length;
  if (positiveCount + neutralCount + negativeCount !== forwardReturn1mAvailableCount) {
    throw new TypeError("Step235B label class count mismatch");
  }
  return {
    labelPurpose: "research_validation_only",
    forwardReturn1mAvailableCount,
    forwardReturn1mUnavailableCount: records.length - forwardReturn1mAvailableCount,
    positiveCount,
    neutralCount,
    negativeCount,
  };
}

function buildUsage() {
  return {
    modelTrainingAllowed: false,
    performanceClaimAllowed: false,
    runtimeServingAllowed: false,
    providerAccessAllowed: false,
    orderSubmissionAllowed: false,
    liveTradingAllowed: false,
    offlineFeatureInspectionAllowed: true,
  };
}

function buildReadiness() {
  return {
    actualLiveTradingReady: false,
    state: "blocked",
  };
}

export function buildStep235BOfflineFeatureCoverageReport(input = {}) {
  const source = clonePlain(input);
  const dataset = source.dataset ?? buildStep235AOfflineFeatureDataset();
  const contract = source.contract ?? buildStep235ATradingFeatureContract();
  assertSafeDatasetShape(dataset);
  assertContractShape(contract);
  const featureNames = STEP235A_TRADING_FEATURE_CONTRACT.featureNames;
  assertRecordsMatchContract(dataset.records, featureNames);
  assertSplitCounts(dataset.records, dataset.splits);

  const report = {
    schemaVersion: STEP235B_FEATURE_COVERAGE_REPORT_SCHEMA_VERSION,
    reportMode: STEP235B_FEATURE_COVERAGE_REPORT_MODE,
    featureContractVersion: dataset.featureContractVersion,
    recordCounts: buildRecordCounts(dataset.records),
    featureCoverage: buildFeatureCoverage(dataset.records, featureNames),
    labelCoverage: buildLabelCoverage(dataset.records),
    splitCoverage: buildSplitCoverage(dataset.records, featureNames),
    leakageChecks: {
      featureUsesFutureData: dataset.leakageChecks.featureUsesFutureData,
      featureLabelOverlap: dataset.leakageChecks.featureLabelOverlap,
      crossSplitOverlap: dataset.leakageChecks.crossSplitOverlap,
      normalizationLeakage: dataset.leakageChecks.normalizationLeakage,
    },
    usage: buildUsage(),
    readiness: buildReadiness(),
  };

  return deepFreeze(report);
}

export function formatStep235BOfflineFeatureCoverageReport(report = buildStep235BOfflineFeatureCoverageReport()) {
  const fullCoverageCount = report.featureCoverage.filter((entry) => entry.availableCount === report.recordCounts.total).length;
  const leakageDetected = Object.values(report.leakageChecks).some(Boolean);
  const lines = [
    "FINPLE OFFLINE FEATURE COVERAGE",
    "",
    `Records: ${report.recordCounts.total}`,
    `Train / Validation / Test: ${report.recordCounts.train} / ${report.recordCounts.validation} / ${report.recordCounts.test}`,
    `Feature contract: ${report.featureContractVersion}`,
    `Features fully covered: ${fullCoverageCount} / ${report.featureCoverage.length}`,
    `Label available: ${report.labelCoverage.forwardReturn1mAvailableCount} / ${report.recordCounts.total}`,
    `Leakage detected: ${leakageDetected ? "Yes" : "No"}`,
    `Model training allowed: ${report.usage.modelTrainingAllowed ? "Yes" : "No"}`,
    `Order submission allowed: ${report.usage.orderSubmissionAllowed ? "Yes" : "No"}`,
    `Live trading readiness: ${report.readiness.state === "blocked" ? "Blocked" : "Open"}`,
  ];
  return `${lines.join("\n")}\n`;
}

export function assertNoStep235BReportSensitiveMaterial(value) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const forbiddenPatterns = [
    /assetKey/i,
    /ticker/i,
    /synthetic-us-core/i,
    /synthetic-kr-core/i,
    /recordId/i,
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
    /close/i,
    /monthlyReturn/i,
    /2020-\d{2}-\d{2}T/i,
    /2021-\d{2}-\d{2}T/i,
    /C:\\/i,
    /\/Users\//i,
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(serialized)) {
      throw new TypeError(`Step235B report leaked prohibited material: ${pattern}`);
    }
  }
}

export const STEP235B_FEATURE_COVERAGE_REPORT_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  recordCountKeys: RECORD_COUNT_KEYS,
  featureCoverageKeys: FEATURE_COVERAGE_KEYS,
  labelCoverageKeys: LABEL_COVERAGE_KEYS,
  splitCoverageKeys: SPLIT_COVERAGE_KEYS,
  leakageCheckKeys: LEAKAGE_CHECK_KEYS,
  usageKeys: USAGE_KEYS,
  readinessKeys: READINESS_KEYS,
  featureOrder: STEP235A_TRADING_FEATURE_CONTRACT.featureNames,
  schemaVersion: STEP235B_FEATURE_COVERAGE_REPORT_SCHEMA_VERSION,
  reportMode: STEP235B_FEATURE_COVERAGE_REPORT_MODE,
  sourceBuilderSchemaVersion: STEP235A_OFFLINE_FEATURE_BUILDER_SCHEMA_VERSION,
  sourceBuilderFeatureKeys: STEP235A_OFFLINE_FEATURE_BUILDER_CONTRACT.featureKeys,
  redacted: true,
});
