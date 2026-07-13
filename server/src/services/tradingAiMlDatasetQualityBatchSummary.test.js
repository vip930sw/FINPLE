import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT,
  buildStep230OfflineDatasetQualityBatchSummary,
  buildStep230OfflineDatasetQualityFixtureCatalog,
} from "./tradingAiMlDatasetQualityBatchSummary.js";
import { buildStep229OfflineDatasetQualityProfile } from "./tradingAiMlDatasetQualityProfile.js";

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "summaryMode",
  "sourceProfileSchemaVersion",
  "fixtureCounts",
  "recordCounts",
  "issueCounts",
  "fixtureResults",
  "overallStatus",
];

const EXPECTED_FIXTURE_COUNT_KEYS = ["total", "pass", "reviewRequired", "blocked"];
const EXPECTED_RECORD_COUNT_KEYS = ["total", "train", "validation", "test"];
const EXPECTED_ISSUE_COUNT_KEYS = [
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
];
const EXPECTED_FIXTURE_RESULTS = [
  { fixtureKey: "balanced_valid", status: "pass" },
  { fixtureKey: "cross_split_duplicate", status: "blocked" },
  { fixtureKey: "duplicate_record_id", status: "blocked" },
  { fixtureKey: "future_leakage", status: "blocked" },
  { fixtureKey: "invalid_walk_forward", status: "blocked" },
  { fixtureKey: "label_imbalance", status: "review_required" },
  { fixtureKey: "missing_required_field", status: "blocked" },
  { fixtureKey: "numeric_threshold_zero", status: "pass" },
  { fixtureKey: "sensitive_payload", status: "blocked" },
  { fixtureKey: "string_threshold", status: "pass" },
  { fixtureKey: "temporal_overlap", status: "blocked" },
  { fixtureKey: "threshold_type_violation", status: "blocked" },
];

function mutableCatalog() {
  return JSON.parse(JSON.stringify(buildStep230OfflineDatasetQualityFixtureCatalog()));
}

function catalogByKeys(keys) {
  const catalog = mutableCatalog();
  const entries = new Map(catalog.map((entry) => [entry.fixtureKey, entry]));
  return keys.map((key) => entries.get(key));
}

test("Step230 batch summary exposes exact top-level and nested key sets", () => {
  const summary = buildStep230OfflineDatasetQualityBatchSummary();

  assert.deepEqual(Object.keys(summary), EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(Object.keys(summary.fixtureCounts), EXPECTED_FIXTURE_COUNT_KEYS);
  assert.deepEqual(Object.keys(summary.recordCounts), EXPECTED_RECORD_COUNT_KEYS);
  assert.deepEqual(Object.keys(summary.issueCounts), EXPECTED_ISSUE_COUNT_KEYS);
  for (const result of summary.fixtureResults) {
    assert.deepEqual(Object.keys(result), ["fixtureKey", "status"]);
  }
});

test("Step230 fixture counts and status counts match the required catalog", () => {
  const summary = buildStep230OfflineDatasetQualityBatchSummary();

  assert.deepEqual(summary.fixtureCounts, {
    total: 12,
    pass: 3,
    reviewRequired: 1,
    blocked: 8,
  });
  assert.equal(summary.overallStatus, "blocked");
});

test("Step230 aggregate record counts and issue counts match Step229 profiles", () => {
  const summary = buildStep230OfflineDatasetQualityBatchSummary();

  assert.deepEqual(summary.recordCounts, {
    total: 72,
    train: 36,
    validation: 24,
    test: 12,
  });
  assert.deepEqual(summary.issueCounts, {
    missingRequiredFields: 1,
    duplicateRecordIds: 2,
    crossSplitDuplicates: 1,
    temporalOverlap: 1,
    futureLeakage: 2,
    invalidWalkForward: 1,
    metadataIncomplete: 0,
    sensitivePayload: 1,
    thresholdTypeViolation: 1,
    labelImbalance: 1,
  });
});

test("Step230 fixture catalog reports expected fixture statuses only", () => {
  const summary = buildStep230OfflineDatasetQualityBatchSummary();

  assert.deepEqual(summary.fixtureResults, EXPECTED_FIXTURE_RESULTS);
});

test("Step230 overall status prioritizes blocked then review_required then pass", () => {
  const blockedSummary = buildStep230OfflineDatasetQualityBatchSummary(catalogByKeys(["balanced_valid", "future_leakage"]));
  const reviewSummary = buildStep230OfflineDatasetQualityBatchSummary(catalogByKeys(["balanced_valid", "label_imbalance"]));
  const passSummary = buildStep230OfflineDatasetQualityBatchSummary(catalogByKeys([
    "balanced_valid",
    "numeric_threshold_zero",
    "string_threshold",
  ]));

  assert.equal(blockedSummary.overallStatus, "blocked");
  assert.equal(reviewSummary.overallStatus, "review_required");
  assert.equal(passSummary.overallStatus, "pass");
  assert.deepEqual(passSummary.fixtureCounts, {
    total: 3,
    pass: 3,
    reviewRequired: 0,
    blocked: 0,
  });
});

test("Step230 rejects duplicate fixture keys and empty input", () => {
  const catalog = mutableCatalog();
  catalog[1].fixtureKey = catalog[0].fixtureKey;

  assert.throws(() => buildStep230OfflineDatasetQualityBatchSummary([]), /at least one fixture/);
  assert.throws(() => buildStep230OfflineDatasetQualityBatchSummary(catalog), /duplicate fixtureKey/);
});

test("Step230 canonical output ignores fixture input order and is repeatable", () => {
  const catalog = mutableCatalog();
  const first = buildStep230OfflineDatasetQualityBatchSummary(catalog);
  const second = buildStep230OfflineDatasetQualityBatchSummary(catalog);
  const reversed = buildStep230OfflineDatasetQualityBatchSummary([...catalog].reverse());

  assert.deepEqual(second, first);
  assert.deepEqual(reversed, first);
});

test("Step230 does not mutate fixture input or Step229 profile output", () => {
  const catalog = mutableCatalog();
  const beforeCatalog = JSON.stringify(catalog);
  const profile = buildStep229OfflineDatasetQualityProfile(catalog[0].dataset);
  const beforeProfile = JSON.stringify(profile);

  const summary = buildStep230OfflineDatasetQualityBatchSummary(catalog);

  assert.equal(JSON.stringify(catalog), beforeCatalog);
  assert.equal(JSON.stringify(profile), beforeProfile);
  assert.equal(Object.isFrozen(summary), true);
  assert.throws(() => {
    summary.fixtureCounts.total = 0;
  });
});

test("Step230 fixture results are canonically ordered by fixture key", () => {
  const summary = buildStep230OfflineDatasetQualityBatchSummary([...mutableCatalog()].reverse());
  const keys = summary.fixtureResults.map((result) => result.fixtureKey);
  const sorted = [...keys].sort((left, right) => left.localeCompare(right));

  assert.deepEqual(keys, sorted);
});

test("Step230 summary excludes raw record IDs, raw labels, provider payload, and sensitive values", () => {
  const summary = buildStep230OfflineDatasetQualityBatchSummary();
  const serialized = JSON.stringify(summary);

  for (const forbidden of [
    "step229-record-001",
    "step229-record-006",
    "downside",
    "stable",
    "upside",
    "secret token value",
    "rawProviderPayload",
    "provider payload",
    "raw metadata",
    "account",
    "order data",
    "hash",
    "digest",
    "fingerprint",
    "credential",
    "token",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("Step230 numeric and string threshold fixtures preserve Step229 policy", () => {
  const catalog = new Map(mutableCatalog().map((entry) => [entry.fixtureKey, entry]));
  const numericProfile = buildStep229OfflineDatasetQualityProfile(catalog.get("numeric_threshold_zero").dataset);
  const stringProfile = buildStep229OfflineDatasetQualityProfile(catalog.get("string_threshold").dataset);
  const violationProfile = buildStep229OfflineDatasetQualityProfile(catalog.get("threshold_type_violation").dataset);

  assert.equal(numericProfile.status, "pass");
  assert.equal(numericProfile.thresholdPolicy.numericThresholdZeroPreserved, true);
  assert.equal(numericProfile.thresholdPolicy.numericThresholdType, "number");
  assert.equal(stringProfile.status, "pass");
  assert.equal(stringProfile.thresholdPolicy.stringThresholdTypePreserved, true);
  assert.equal(stringProfile.thresholdPolicy.stringThresholdType, "string");
  assert.equal(violationProfile.status, "blocked");
});

test("Step230 contract exports exact keys and uses Step229 schema version", () => {
  assert.deepEqual(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.topLevelKeys, EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.fixtureCountKeys, EXPECTED_FIXTURE_COUNT_KEYS);
  assert.deepEqual(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.recordCountKeys, EXPECTED_RECORD_COUNT_KEYS);
  assert.deepEqual(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.issueCountKeys, EXPECTED_ISSUE_COUNT_KEYS);
  assert.deepEqual(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.fixtureResultKeys, ["fixtureKey", "status"]);
  assert.deepEqual(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.statusValues, ["pass", "review_required", "blocked"]);
  assert.equal(STEP230_OFFLINE_DATASET_QUALITY_BATCH_SUMMARY_CONTRACT.sourceProfileSchemaVersion, "1.0.0");
});
