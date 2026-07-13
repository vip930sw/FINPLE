import {
  STEP229_OFFLINE_DATASET_QUALITY_PROFILE_SCHEMA_VERSION,
  buildStep229OfflineDatasetQualityFixture,
  buildStep229OfflineDatasetQualityProfile,
} from "./tradingAiMlDatasetQualityProfile.js";

export const STEP230_OFFLINE_DATASET_QUALITY_BATCH_SCHEMA_VERSION = "1.0.0";
export const STEP230_OFFLINE_DATASET_QUALITY_BATCH_MODE = "offline_fixture_batch";

const TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "summaryMode",
  "sourceProfileSchemaVersion",
  "fixtureCounts",
  "recordCounts",
  "issueCounts",
  "fixtureResults",
  "overallStatus",
]);

const FIXTURE_COUNT_KEYS = Object.freeze(["total", "pass", "reviewRequired", "blocked"]);
const RECORD_COUNT_KEYS = Object.freeze(["total", "train", "validation", "test"]);
const ISSUE_COUNT_KEYS = Object.freeze([
  "missingRequiredFields",
  "duplicateRecordIds",
  "crossSplitDuplicates",
  "temporalOverlap",
  "futureLeakage",
  "invalidWalkForward",
  "metadataIncomplete",
  "sensitivePayload",
  "thresholdTypeViolation",
  "labelImbalance",
]);
const FIXTURE_RESULT_KEYS = Object.freeze(["fixtureKey", "status"]);
const STATUS_VALUES = Object.freeze(["pass", "review_required", "blocked"]);

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

function baseFixture() {
  return clonePlain(buildStep229OfflineDatasetQualityFixture());
}

function withFixture(mutator) {
  const fixture = baseFixture();
  mutator(fixture);
  return fixture;
}

function assertFixtureBatchInput(fixtures) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    throw new TypeError("Step230 batch summary requires at least one fixture");
  }

  const keys = new Set();
  for (const fixture of fixtures) {
    if (!fixture || typeof fixture !== "object") {
      throw new TypeError("Step230 fixture entry must be an object");
    }
    if (typeof fixture.fixtureKey !== "string" || fixture.fixtureKey.trim() === "") {
      throw new TypeError("Step230 fixtureKey must be a non-empty string");
    }
    if (keys.has(fixture.fixtureKey)) {
      throw new TypeError("Step230 duplicate fixtureKey is not allowed");
    }
    keys.add(fixture.fixtureKey);
    if (!fixture.dataset || typeof fixture.dataset !== "object") {
      throw new TypeError("Step230 fixture dataset must be an object");
    }
  }
}

function canonicalFixtures(fixtures) {
  return clonePlain(fixtures).sort((left, right) => left.fixtureKey.localeCompare(right.fixtureKey));
}

function buildEmptyFixtureCounts() {
  return { total: 0, pass: 0, reviewRequired: 0, blocked: 0 };
}

function buildEmptyRecordCounts() {
  return { total: 0, train: 0, validation: 0, test: 0 };
}

function buildEmptyIssueCounts() {
  return {
    missingRequiredFields: 0,
    duplicateRecordIds: 0,
    crossSplitDuplicates: 0,
    temporalOverlap: 0,
    futureLeakage: 0,
    invalidWalkForward: 0,
    metadataIncomplete: 0,
    sensitivePayload: 0,
    thresholdTypeViolation: 0,
    labelImbalance: 0,
  };
}

function addRecordCounts(target, source) {
  target.total += source.total;
  target.train += source.train;
  target.validation += source.validation;
  target.test += source.test;
}

function addIssueCounts(target, profile) {
  target.missingRequiredFields += profile.qualityChecks.missingRequiredFields;
  target.duplicateRecordIds += profile.qualityChecks.duplicateRecordIds;
  target.crossSplitDuplicates += profile.qualityChecks.crossSplitDuplicates;
  target.temporalOverlap += profile.qualityChecks.temporalOverlapDetected ? 1 : 0;
  target.futureLeakage += profile.qualityChecks.futureLeakageDetected ? 1 : 0;
  target.invalidWalkForward += profile.qualityChecks.invalidWalkForwardWindows;
  target.metadataIncomplete += profile.qualityChecks.metadataComplete ? 0 : 1;
  target.sensitivePayload += profile.qualityChecks.sensitivePayloadDetected ? 1 : 0;
  target.thresholdTypeViolation += (
    profile.thresholdPolicy.numericThresholdZeroPreserved &&
    profile.thresholdPolicy.stringThresholdTypePreserved
  ) ? 0 : 1;
  target.labelImbalance += profile.qualityChecks.labelImbalanceDetected ? 1 : 0;
}

function addFixtureStatus(target, status) {
  if (status === "pass") {
    target.pass += 1;
  } else if (status === "review_required") {
    target.reviewRequired += 1;
  } else if (status === "blocked") {
    target.blocked += 1;
  }
}

function overallStatusFromFixtureCounts(fixtureCounts) {
  if (fixtureCounts.blocked > 0) return "blocked";
  if (fixtureCounts.reviewRequired > 0) return "review_required";
  return "pass";
}

export function buildStep230OfflineDatasetQualityFixtureCatalog() {
  const catalog = [
    {
      fixtureKey: "balanced_valid",
      dataset: baseFixture(),
    },
    {
      fixtureKey: "label_imbalance",
      dataset: withFixture((fixture) => {
        for (const record of fixture.records) record.label = "downside";
      }),
    },
    {
      fixtureKey: "missing_required_field",
      dataset: withFixture((fixture) => {
        delete fixture.records[0].label;
      }),
    },
    {
      fixtureKey: "duplicate_record_id",
      dataset: withFixture((fixture) => {
        fixture.records[1].recordId = fixture.records[0].recordId;
      }),
    },
    {
      fixtureKey: "cross_split_duplicate",
      dataset: withFixture((fixture) => {
        fixture.records[5].recordId = fixture.records[0].recordId;
      }),
    },
    {
      fixtureKey: "temporal_overlap",
      dataset: withFixture((fixture) => {
        fixture.records[3].featureTimestamp = "2024-03-15T00:00:00.000Z";
      }),
    },
    {
      fixtureKey: "future_leakage",
      dataset: withFixture((fixture) => {
        fixture.records[5].featureTimestamp = "2024-08-31T00:00:00.000Z";
        fixture.records[5].labelTimestamp = "2024-07-31T00:00:00.000Z";
      }),
    },
    {
      fixtureKey: "invalid_walk_forward",
      dataset: withFixture((fixture) => {
        fixture.walkForwardWindows[0].validationStart = "2024-03-15T00:00:00.000Z";
      }),
    },
    {
      fixtureKey: "sensitive_payload",
      dataset: withFixture((fixture) => {
        fixture.records[0].rawProviderPayload = { value: "secret token value" };
      }),
    },
    {
      fixtureKey: "numeric_threshold_zero",
      dataset: baseFixture(),
    },
    {
      fixtureKey: "string_threshold",
      dataset: baseFixture(),
    },
    {
      fixtureKey: "threshold_type_violation",
      dataset: withFixture((fixture) => {
        fixture.records[0].threshold = "0";
        fixture.records[1].stringThreshold = 0;
      }),
    },
  ];

  return deepFreeze(catalog);
}

export function buildStep230OfflineDatasetQualityBatchSummary(fixtures = buildStep230OfflineDatasetQualityFixtureCatalog()) {
  assertFixtureBatchInput(fixtures);

  const fixtureCounts = buildEmptyFixtureCounts();
  const recordCounts = buildEmptyRecordCounts();
  const issueCounts = buildEmptyIssueCounts();
  const fixtureResults = [];

  for (const fixture of canonicalFixtures(fixtures)) {
    const profile = buildStep229OfflineDatasetQualityProfile(fixture.dataset);
    if (!STATUS_VALUES.includes(profile.status)) {
      throw new TypeError("Step230 received an unknown Step229 profile status");
    }

    fixtureCounts.total += 1;
    addFixtureStatus(fixtureCounts, profile.status);
    addRecordCounts(recordCounts, profile.recordCounts);
    addIssueCounts(issueCounts, profile);
    fixtureResults.push({
      fixtureKey: fixture.fixtureKey,
      status: profile.status,
    });
  }

  const summary = {
    schemaVersion: STEP230_OFFLINE_DATASET_QUALITY_BATCH_SCHEMA_VERSION,
    summaryMode: STEP230_OFFLINE_DATASET_QUALITY_BATCH_MODE,
    sourceProfileSchemaVersion: STEP229_OFFLINE_DATASET_QUALITY_PROFILE_SCHEMA_VERSION,
    fixtureCounts,
    recordCounts,
    issueCounts,
    fixtureResults,
    overallStatus: overallStatusFromFixtureCounts(fixtureCounts),
  };

  return deepFreeze(summary);
}

export const STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  fixtureCountKeys: FIXTURE_COUNT_KEYS,
  recordCountKeys: RECORD_COUNT_KEYS,
  issueCountKeys: ISSUE_COUNT_KEYS,
  fixtureResultKeys: FIXTURE_RESULT_KEYS,
  statusValues: STATUS_VALUES,
  sourceProfileSchemaVersion: STEP229_OFFLINE_DATASET_QUALITY_PROFILE_SCHEMA_VERSION,
  redacted: true,
});
