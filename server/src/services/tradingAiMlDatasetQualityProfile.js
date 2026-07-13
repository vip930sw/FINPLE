import { STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS } from "./tradingAiMlDatasetArchitecture.js";

export const STEP229_OFFLINE_DATASET_QUALITY_PROFILE_SCHEMA_VERSION = "1.0.0";
export const STEP229_OFFLINE_DATASET_QUALITY_PROFILE_MODE = "offline_fixture";

export const STEP229_OFFLINE_DATASET_QUALITY_SPLITS = Object.freeze([
  "train",
  "validation",
  "test",
]);

export const STEP229_OFFLINE_DATASET_QUALITY_REQUIRED_RECORD_FIELDS = Object.freeze([
  "recordId",
  "split",
  "label",
  "featureTimestamp",
  "labelTimestamp",
  "versioning",
  "lineage",
  "retentionPolicy",
  "threshold",
  "stringThreshold",
]);

const QUALITY_PROFILE_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "profileMode",
  "sourceContract",
  "recordCounts",
  "labelDistribution",
  "qualityChecks",
  "thresholdPolicy",
  "status",
]);

const SOURCE_CONTRACT_KEYS = Object.freeze([
  "sourceStep",
  "fixtureType",
  "runtimePayloadUnchanged",
  "readinessUnchanged",
  "redacted",
]);

const RECORD_COUNT_KEYS = Object.freeze(["total", "train", "validation", "test"]);

const QUALITY_CHECK_KEYS = Object.freeze([
  "missingRequiredFields",
  "duplicateRecordIds",
  "crossSplitDuplicates",
  "temporalOverlapDetected",
  "invalidWalkForwardWindows",
  "futureLeakageDetected",
  "metadataComplete",
  "retentionPolicyPresent",
  "labelImbalanceDetected",
  "sensitivePayloadDetected",
]);

const THRESHOLD_POLICY_KEYS = Object.freeze([
  "numericThresholdZeroPreserved",
  "numericThresholdType",
  "stringThresholdTypePreserved",
  "stringThresholdType",
]);

const LABEL_IMBALANCE_RATIO = 0.7;
const SPLIT_ORDER = Object.freeze(new Map(STEP229_OFFLINE_DATASET_QUALITY_SPLITS.map((split, index) => [split, index])));

const SENSITIVE_KEY_PATTERNS = Object.freeze([
  /credential/i,
  /secret/i,
  /token/i,
  /account/i,
  /raw.*payload/i,
  /payload.*raw/i,
  /provider.*payload/i,
  /order.*payload/i,
  /raw.*response/i,
  /private.*path/i,
  /packet.*path/i,
]);

const SENSITIVE_STRING_PATTERNS = Object.freeze([
  /credential/i,
  /secret/i,
  /token/i,
  /account\s*identifier/i,
  /raw\s+provider/i,
  /provider\s+payload/i,
  /order\s+payload/i,
  /private\s+path/i,
  /packet\s+path/i,
]);

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

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function compareRecord(a, b) {
  const splitDelta = (SPLIT_ORDER.get(a.split) ?? 99) - (SPLIT_ORDER.get(b.split) ?? 99);
  if (splitDelta !== 0) return splitDelta;
  const timeDelta = String(a.featureTimestamp ?? "").localeCompare(String(b.featureTimestamp ?? ""));
  if (timeDelta !== 0) return timeDelta;
  return String(a.recordId ?? "").localeCompare(String(b.recordId ?? ""));
}

function toTimestamp(value) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function countMissingRequiredFields(records) {
  let missing = 0;
  for (const record of records) {
    for (const field of STEP229_OFFLINE_DATASET_QUALITY_REQUIRED_RECORD_FIELDS) {
      if (isMissing(record[field])) missing += 1;
    }
  }
  return missing;
}

function countDuplicateRecordIds(records) {
  const seen = new Set();
  const duplicates = new Set();
  for (const record of records) {
    if (isMissing(record.recordId)) continue;
    if (seen.has(record.recordId)) duplicates.add(record.recordId);
    seen.add(record.recordId);
  }
  return duplicates.size;
}

function countCrossSplitDuplicates(records) {
  const splitsById = new Map();
  for (const record of records) {
    if (isMissing(record.recordId) || isMissing(record.split)) continue;
    const current = splitsById.get(record.recordId) ?? new Set();
    current.add(record.split);
    splitsById.set(record.recordId, current);
  }
  return [...splitsById.values()].filter((splits) => splits.size > 1).length;
}

function buildRecordCounts(records) {
  const counts = { total: records.length, train: 0, validation: 0, test: 0 };
  for (const record of records) {
    if (STEP229_OFFLINE_DATASET_QUALITY_SPLITS.includes(record.split)) {
      counts[record.split] += 1;
    }
  }
  return {
    total: counts.total,
    train: counts.train,
    validation: counts.validation,
    test: counts.test,
  };
}

function buildLabelDistribution(records) {
  const counts = new Map();
  for (const record of records) {
    if (isMissing(record.label)) continue;
    counts.set(record.label, (counts.get(record.label) ?? 0) + 1);
  }
  const total = records.length || 1;
  return [...counts.entries()]
    .sort(([left], [right]) => String(left).localeCompare(String(right)))
    .map(([label, count]) => ({
      label,
      count,
      ratio: Number((count / total).toFixed(6)),
    }));
}

function hasLabelImbalance(labelDistribution) {
  return labelDistribution.some((entry) => entry.ratio >= LABEL_IMBALANCE_RATIO);
}

function hasTemporalOverlap(records) {
  const ranges = new Map();
  for (const split of STEP229_OFFLINE_DATASET_QUALITY_SPLITS) {
    const timestamps = records
      .filter((record) => record.split === split)
      .map((record) => toTimestamp(record.featureTimestamp))
      .filter((value) => value !== null)
      .sort((a, b) => a - b);
    if (timestamps.length > 0) {
      ranges.set(split, {
        start: timestamps[0],
        end: timestamps[timestamps.length - 1],
      });
    }
  }

  let previous = null;
  for (const split of STEP229_OFFLINE_DATASET_QUALITY_SPLITS) {
    const current = ranges.get(split);
    if (!current) continue;
    if (previous && current.start <= previous.end) return true;
    previous = current;
  }
  return false;
}

function countInvalidWalkForwardWindows(windows) {
  let invalid = 0;
  const sorted = [...(windows ?? [])].sort((a, b) => String(a.windowId ?? "").localeCompare(String(b.windowId ?? "")));
  for (const window of sorted) {
    const trainStart = toTimestamp(window.trainStart);
    const trainEnd = toTimestamp(window.trainEnd);
    const validationStart = toTimestamp(window.validationStart);
    const validationEnd = toTimestamp(window.validationEnd);
    const testStart = toTimestamp(window.testStart);
    const testEnd = toTimestamp(window.testEnd);
    const values = [trainStart, trainEnd, validationStart, validationEnd, testStart, testEnd];
    if (values.some((value) => value === null)) {
      invalid += 1;
      continue;
    }
    if (!(trainStart <= trainEnd && trainEnd < validationStart && validationStart <= validationEnd && validationEnd < testStart && testStart <= testEnd)) {
      invalid += 1;
    }
  }
  return invalid;
}

function hasFutureLeakage(records, windows) {
  if (records.some((record) => {
    const featureTimestamp = toTimestamp(record.featureTimestamp);
    const labelTimestamp = toTimestamp(record.labelTimestamp);
    return featureTimestamp !== null && labelTimestamp !== null && featureTimestamp > labelTimestamp;
  })) {
    return true;
  }
  return countInvalidWalkForwardWindows(windows) > 0;
}

function isMetadataComplete(records, fixtureMetadata) {
  const recordMetadataComplete = records.every((record) => (
    record.versioning?.datasetVersion &&
    record.versioning?.schemaVersion &&
    record.lineage?.sourceType &&
    record.lineage?.sourceContract &&
    record.retentionPolicy?.policyId
  ));
  const fixtureMetadataComplete = Boolean(
    fixtureMetadata?.versioning?.datasetVersion &&
    fixtureMetadata?.versioning?.schemaVersion &&
    fixtureMetadata?.lineage?.sourceType &&
    fixtureMetadata?.lineage?.sourceContract &&
    fixtureMetadata?.retentionPolicy?.policyId,
  );
  return recordMetadataComplete && fixtureMetadataComplete;
}

function isRetentionPolicyPresent(records, fixtureMetadata) {
  return Boolean(fixtureMetadata?.retentionPolicy?.policyId) && records.every((record) => Boolean(record.retentionPolicy?.policyId));
}

function hasSensitivePayload(value) {
  const stack = [{ key: "", value }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(current.key))) return true;
    if (typeof current.value === "string" && SENSITIVE_STRING_PATTERNS.some((pattern) => pattern.test(current.value))) return true;
    if (current.value && typeof current.value === "object") {
      for (const [key, nested] of Object.entries(current.value)) {
        stack.push({ key, value: nested });
      }
    }
  }
  return false;
}

function buildThresholdPolicy(records) {
  const numericThresholdZeroPreserved = records.some((record) => record.threshold === 0);
  const numericThresholdTypePreserved = records
    .filter((record) => record.threshold === 0)
    .every((record) => typeof record.threshold === "number");
  const stringThresholdTypePreserved = records.every((record) => typeof record.stringThreshold === "string");
  return {
    numericThresholdZeroPreserved: numericThresholdZeroPreserved && numericThresholdTypePreserved,
    numericThresholdType: numericThresholdZeroPreserved && numericThresholdTypePreserved ? "number" : "invalid",
    stringThresholdTypePreserved,
    stringThresholdType: stringThresholdTypePreserved ? "string" : "invalid",
  };
}

function buildStatus(qualityChecks, thresholdPolicy) {
  const blocked = (
    qualityChecks.missingRequiredFields > 0 ||
    qualityChecks.duplicateRecordIds > 0 ||
    qualityChecks.crossSplitDuplicates > 0 ||
    qualityChecks.temporalOverlapDetected ||
    qualityChecks.invalidWalkForwardWindows > 0 ||
    qualityChecks.futureLeakageDetected ||
    qualityChecks.sensitivePayloadDetected ||
    !thresholdPolicy.numericThresholdZeroPreserved ||
    !thresholdPolicy.stringThresholdTypePreserved
  );
  if (blocked) return "blocked";
  if (qualityChecks.labelImbalanceDetected || !qualityChecks.metadataComplete || !qualityChecks.retentionPolicyPresent) {
    return "review_required";
  }
  return "pass";
}

export function buildStep229OfflineDatasetQualityFixture() {
  return deepFreeze({
    fixtureId: "step229_offline_dataset_quality_fixture_v1",
    fixtureType: "static_synthetic_step192_architecture",
    records: [
      {
        recordId: "step229-record-001",
        split: "train",
        label: "downside",
        featureTimestamp: "2024-01-31T00:00:00.000Z",
        labelTimestamp: "2024-02-29T00:00:00.000Z",
        threshold: 0,
        stringThreshold: "minus_5pct",
        versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
        lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
        retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
      },
      {
        recordId: "step229-record-002",
        split: "train",
        label: "stable",
        featureTimestamp: "2024-02-29T00:00:00.000Z",
        labelTimestamp: "2024-03-31T00:00:00.000Z",
        threshold: 0,
        stringThreshold: "minus_5pct",
        versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
        lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
        retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
      },
      {
        recordId: "step229-record-003",
        split: "train",
        label: "upside",
        featureTimestamp: "2024-03-31T00:00:00.000Z",
        labelTimestamp: "2024-04-30T00:00:00.000Z",
        threshold: 0,
        stringThreshold: "minus_5pct",
        versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
        lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
        retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
      },
      {
        recordId: "step229-record-004",
        split: "validation",
        label: "downside",
        featureTimestamp: "2024-04-30T00:00:00.000Z",
        labelTimestamp: "2024-05-31T00:00:00.000Z",
        threshold: 0,
        stringThreshold: "minus_5pct",
        versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
        lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
        retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
      },
      {
        recordId: "step229-record-005",
        split: "validation",
        label: "stable",
        featureTimestamp: "2024-05-31T00:00:00.000Z",
        labelTimestamp: "2024-06-30T00:00:00.000Z",
        threshold: 0,
        stringThreshold: "minus_5pct",
        versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
        lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
        retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
      },
      {
        recordId: "step229-record-006",
        split: "test",
        label: "upside",
        featureTimestamp: "2024-06-30T00:00:00.000Z",
        labelTimestamp: "2024-07-31T00:00:00.000Z",
        threshold: 0,
        stringThreshold: "minus_5pct",
        versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
        lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
        retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
      },
    ],
    walkForwardWindows: [
      {
        windowId: "step229-window-001",
        trainStart: "2024-01-31T00:00:00.000Z",
        trainEnd: "2024-03-31T00:00:00.000Z",
        validationStart: "2024-04-30T00:00:00.000Z",
        validationEnd: "2024-05-31T00:00:00.000Z",
        testStart: "2024-06-30T00:00:00.000Z",
        testEnd: "2024-07-31T00:00:00.000Z",
      },
    ],
    metadata: {
      versioning: { datasetVersion: "offline-fixture-v1", schemaVersion: "step192-compatible" },
      lineage: { sourceType: "synthetic_fixture", sourceContract: "step192_dataset_architecture" },
      retentionPolicy: { policyId: "step192-redacted-retention", rawValueStorageAllowed: false },
    },
  });
}

export function buildStep229OfflineDatasetQualityProfile(fixture = buildStep229OfflineDatasetQualityFixture()) {
  const input = clonePlain(fixture);
  const records = [...(input.records ?? [])].sort(compareRecord);
  const walkForwardWindows = [...(input.walkForwardWindows ?? [])].sort((a, b) => String(a.windowId ?? "").localeCompare(String(b.windowId ?? "")));
  const labelDistribution = buildLabelDistribution(records);
  const thresholdPolicy = buildThresholdPolicy(records);
  const invalidWalkForwardWindows = countInvalidWalkForwardWindows(walkForwardWindows);
  const qualityChecks = {
    missingRequiredFields: countMissingRequiredFields(records),
    duplicateRecordIds: countDuplicateRecordIds(records),
    crossSplitDuplicates: countCrossSplitDuplicates(records),
    temporalOverlapDetected: hasTemporalOverlap(records),
    invalidWalkForwardWindows,
    futureLeakageDetected: hasFutureLeakage(records, walkForwardWindows),
    metadataComplete: isMetadataComplete(records, input.metadata),
    retentionPolicyPresent: isRetentionPolicyPresent(records, input.metadata),
    labelImbalanceDetected: hasLabelImbalance(labelDistribution),
    sensitivePayloadDetected: hasSensitivePayload(input),
  };

  const profile = {
    schemaVersion: STEP229_OFFLINE_DATASET_QUALITY_PROFILE_SCHEMA_VERSION,
    profileMode: STEP229_OFFLINE_DATASET_QUALITY_PROFILE_MODE,
    sourceContract: {
      sourceStep: "Step192",
      fixtureType: "static_synthetic_step192_architecture",
      runtimePayloadUnchanged: true,
      readinessUnchanged: STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.providerCallsAllowed === false &&
        STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.orderSubmissionAllowed === false &&
        STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.runtimeRouteAllowed === false &&
        STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.publicUiAllowed === false &&
        STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.readyForLiveGuardedTrading === false,
      redacted: true,
    },
    recordCounts: buildRecordCounts(records),
    labelDistribution,
    qualityChecks,
    thresholdPolicy,
    status: buildStatus(qualityChecks, thresholdPolicy),
  };

  return deepFreeze(profile);
}

export const STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT = deepFreeze({
  topLevelKeys: QUALITY_PROFILE_TOP_LEVEL_KEYS,
  sourceContractKeys: SOURCE_CONTRACT_KEYS,
  recordCountKeys: RECORD_COUNT_KEYS,
  qualityCheckKeys: QUALITY_CHECK_KEYS,
  thresholdPolicyKeys: THRESHOLD_POLICY_KEYS,
  statusValues: ["pass", "review_required", "blocked"],
  readinessFlags: STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  redacted: true,
});
