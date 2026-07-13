import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT,
  STEP229_OFFLINE_DATASET_QUALITY_REQUIRED_RECORD_FIELDS,
  buildStep229OfflineDatasetQualityFixture,
  buildStep229OfflineDatasetQualityProfile,
} from "./tradingAiMlDatasetQualityProfile.js";
import {
  STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  buildAiMlDatasetArchitecture,
} from "./tradingAiMlDatasetArchitecture.js";

const EXPECTED_TOP_LEVEL_KEYS = [
  "schemaVersion",
  "profileMode",
  "sourceContract",
  "recordCounts",
  "labelDistribution",
  "qualityChecks",
  "thresholdPolicy",
  "status",
];

const EXPECTED_SOURCE_CONTRACT_KEYS = [
  "sourceStep",
  "fixtureType",
  "runtimePayloadUnchanged",
  "readinessUnchanged",
  "redacted",
];

const EXPECTED_RECORD_COUNT_KEYS = ["total", "train", "validation", "test"];

const EXPECTED_QUALITY_CHECK_KEYS = [
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
];

const EXPECTED_THRESHOLD_POLICY_KEYS = [
  "numericThresholdZeroPreserved",
  "numericThresholdType",
  "stringThresholdTypePreserved",
  "stringThresholdType",
];

function mutableFixture() {
  return JSON.parse(JSON.stringify(buildStep229OfflineDatasetQualityFixture()));
}

test("Step229 normal offline fixture produces a pass profile", () => {
  const profile = buildStep229OfflineDatasetQualityProfile();

  assert.deepEqual(Object.keys(profile), EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(Object.keys(profile.sourceContract), EXPECTED_SOURCE_CONTRACT_KEYS);
  assert.deepEqual(Object.keys(profile.recordCounts), EXPECTED_RECORD_COUNT_KEYS);
  assert.deepEqual(Object.keys(profile.qualityChecks), EXPECTED_QUALITY_CHECK_KEYS);
  assert.deepEqual(Object.keys(profile.thresholdPolicy), EXPECTED_THRESHOLD_POLICY_KEYS);
  assert.equal(profile.schemaVersion, "1.0.0");
  assert.equal(profile.profileMode, "offline_fixture");
  assert.deepEqual(profile.recordCounts, {
    total: 6,
    train: 3,
    validation: 2,
    test: 1,
  });
  assert.deepEqual(profile.labelDistribution, [
    { label: "downside", count: 2, ratio: 0.333333 },
    { label: "stable", count: 2, ratio: 0.333333 },
    { label: "upside", count: 2, ratio: 0.333333 },
  ]);
  assert.deepEqual(profile.qualityChecks, {
    missingRequiredFields: 0,
    duplicateRecordIds: 0,
    crossSplitDuplicates: 0,
    temporalOverlapDetected: false,
    invalidWalkForwardWindows: 0,
    futureLeakageDetected: false,
    metadataComplete: true,
    retentionPolicyPresent: true,
    labelImbalanceDetected: false,
    sensitivePayloadDetected: false,
  });
  assert.deepEqual(profile.thresholdPolicy, {
    numericThresholdZeroPreserved: true,
    numericThresholdType: "number",
    stringThresholdTypePreserved: true,
    stringThresholdType: "string",
  });
  assert.equal(profile.status, "pass");
});

test("Step229 blocks missing required record fields", () => {
  const fixture = mutableFixture();
  delete fixture.records[0].label;
  delete fixture.records[1].versioning;

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert.equal(profile.qualityChecks.missingRequiredFields, 2);
  assert.equal(profile.status, "blocked");
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_REQUIRED_RECORD_FIELDS.includes("label"), true);
});

test("Step229 blocks cross split duplicates", () => {
  const fixture = mutableFixture();
  fixture.records[5].recordId = fixture.records[0].recordId;

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert.equal(profile.qualityChecks.duplicateRecordIds, 1);
  assert.equal(profile.qualityChecks.crossSplitDuplicates, 1);
  assert.equal(profile.status, "blocked");
});

test("Step229 blocks temporal overlap and future leakage", () => {
  const fixture = mutableFixture();
  fixture.records[3].featureTimestamp = "2024-03-15T00:00:00.000Z";
  fixture.records[4].featureTimestamp = "2024-08-31T00:00:00.000Z";
  fixture.records[4].labelTimestamp = "2024-07-31T00:00:00.000Z";

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert.equal(profile.qualityChecks.temporalOverlapDetected, true);
  assert.equal(profile.qualityChecks.futureLeakageDetected, true);
  assert.equal(profile.status, "blocked");
});

test("Step229 blocks invalid walk-forward windows", () => {
  const fixture = mutableFixture();
  fixture.walkForwardWindows[0].validationStart = "2024-03-15T00:00:00.000Z";

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert.equal(profile.qualityChecks.invalidWalkForwardWindows, 1);
  assert.equal(profile.qualityChecks.futureLeakageDetected, true);
  assert.equal(profile.status, "blocked");
});

test("Step229 requires review for label imbalance without hard errors", () => {
  const fixture = mutableFixture();
  for (const record of fixture.records) record.label = "downside";

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert.deepEqual(profile.labelDistribution, [{ label: "downside", count: 6, ratio: 1 }]);
  assert.equal(profile.qualityChecks.labelImbalanceDetected, true);
  assert.equal(profile.status, "review_required");
});

test("Step229 is deterministic across repeated calls and shuffled input", () => {
  const fixture = mutableFixture();
  const first = buildStep229OfflineDatasetQualityProfile(fixture);
  const second = buildStep229OfflineDatasetQualityProfile(fixture);
  const shuffled = mutableFixture();
  shuffled.records = [
    shuffled.records[5],
    shuffled.records[2],
    shuffled.records[0],
    shuffled.records[4],
    shuffled.records[1],
    shuffled.records[3],
  ];
  shuffled.walkForwardWindows = [...shuffled.walkForwardWindows].reverse();

  assert.deepEqual(second, first);
  assert.deepEqual(buildStep229OfflineDatasetQualityProfile(shuffled), first);
});

test("Step229 profile creation does not mutate the input fixture or Step192 runtime output", () => {
  const fixture = mutableFixture();
  const fixtureBefore = JSON.stringify(fixture);
  const runtimeBefore = buildAiMlDatasetArchitecture();

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert.equal(JSON.stringify(fixture), fixtureBefore);
  assert.deepEqual(buildAiMlDatasetArchitecture(), runtimeBefore);
  assert.equal(Object.isFrozen(profile), true);
  assert.throws(() => {
    profile.recordCounts.total = 0;
  });
});

test("Step229 blocks sensitive strings and raw payload-like fields", () => {
  const fixture = mutableFixture();
  fixture.records[0].rawProviderPayload = { value: "secret token value" };

  const profile = buildStep229OfflineDatasetQualityProfile(fixture);
  const serializedProfile = JSON.stringify(profile);

  assert.equal(profile.qualityChecks.sensitivePayloadDetected, true);
  assert.equal(profile.status, "blocked");
  for (const forbidden of [
    "secret token value",
    "rawProviderPayload",
    "credential",
    "provider payload",
    "order payload",
    "hash",
    "digest",
    "fingerprint",
  ]) {
    assert.equal(serializedProfile.includes(forbidden), false, forbidden);
  }
});

test("Step229 preserves threshold type policy and keeps readiness false", () => {
  const profile = buildStep229OfflineDatasetQualityProfile();

  assert.equal(profile.thresholdPolicy.numericThresholdZeroPreserved, true);
  assert.equal(profile.thresholdPolicy.numericThresholdType, "number");
  assert.equal(profile.thresholdPolicy.stringThresholdTypePreserved, true);
  assert.equal(profile.thresholdPolicy.stringThresholdType, "string");
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.providerCallsAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.orderSubmissionAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.runtimeRouteAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.publicUiAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.readyForLiveGuardedTrading, false);
  assert.equal(profile.sourceContract.readinessUnchanged, true);
});

test("Step229 exported contract records exact keys and status values", () => {
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT.topLevelKeys, EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT.sourceContractKeys, EXPECTED_SOURCE_CONTRACT_KEYS);
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT.recordCountKeys, EXPECTED_RECORD_COUNT_KEYS);
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT.qualityCheckKeys, EXPECTED_QUALITY_CHECK_KEYS);
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT.thresholdPolicyKeys, EXPECTED_THRESHOLD_POLICY_KEYS);
  assert.deepEqual(STEP229_OFFLINE_DATASET_QUALITY_PROFILE_CONTRACT.statusValues, ["pass", "review_required", "blocked"]);
});
