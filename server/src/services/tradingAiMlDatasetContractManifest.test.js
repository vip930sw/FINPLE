import test from "node:test";
import assert from "node:assert/strict";

import {
  STEP225_DATASET_CONTRACT_MANIFEST_CONTRACT,
  buildStep192DatasetContractManifest,
} from "./tradingAiMlDatasetContractManifest.js";
import {
  STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  buildAiMlDatasetArchitecture,
} from "./tradingAiMlDatasetArchitecture.js";

const EXPECTED_TOP_LEVEL_KEYS = [
  "manifestVersion",
  "sourceContract",
  "compatibility",
  "surfaces",
  "redacted",
];

const EXPECTED_SOURCE_CONTRACT_KEYS = [
  "step",
  "sourceStep",
  "service",
  "runtimePayloadUnchanged",
  "redacted",
];

const EXPECTED_COMPATIBILITY_KEYS = [
  "legacyExactKeySet",
  "numericThresholdPreserved",
  "stringThresholdPreserved",
  "sensitiveStringPolicy",
];

const EXPECTED_SURFACE_NAMES = [
  "label",
  "split",
  "walkForward",
  "versioningPolicy",
  "lineagePolicy",
  "retentionPolicy",
];

const EXPECTED_SURFACE_KEYS = ["keys"];

const EXPECTED_LABEL_KEYS = [
  "labelId",
  "modelType",
  "labelName",
  "horizon",
  "formula",
  "threshold",
  "positiveClass",
  "neutralClass",
  "missingLabelPolicy",
  "embargoPeriod",
  "redacted",
];

const EXPECTED_SPLIT_KEYS = [
  "splitPolicyId",
  "policyType",
  "randomSplitAllowed",
  "trainWindow",
  "validationWindow",
  "testWindow",
  "finalHoldoutPolicy",
  "embargoRule",
  "purgeRule",
  "imputationRule",
  "redacted",
];

const EXPECTED_WALK_FORWARD_KEYS = [
  "walkForwardPolicyId",
  "windowType",
  "trainWindowMinimum",
  "validationWindow",
  "testWindow",
  "stepSize",
  "embargoRule",
  "foldLeakageCheck",
  "redacted",
];

const EXPECTED_VERSIONING_KEYS = [
  "policyId",
  "datasetVersionFormat",
  "labelChangeCreatesNewDatasetVersion",
  "featureChangeCreatesNewDatasetVersion",
  "splitChangeCreatesNewDatasetVersion",
  "immutableAfterReview",
  "status",
  "redacted",
];

const EXPECTED_LINEAGE_KEYS = [
  "policyId",
  "lineageFields",
  "rawValueStorageAllowed",
  "privatePathStorageAllowed",
  "digestStorageAllowed",
  "status",
  "redacted",
];

const EXPECTED_RETENTION_KEYS = [
  "policyId",
  "retentionScope",
  "datasetFileRetention",
  "redactionRequired",
  "forbiddenValueClasses",
  "publicExposureAllowed",
  "mypageExposureAllowed",
  "redacted",
];

function assertUnique(values) {
  assert.equal(new Set(values).size, values.length);
}

function assertSurface(manifest, name, expectedKeys) {
  assert.deepEqual(Object.keys(manifest.surfaces[name]), EXPECTED_SURFACE_KEYS);
  assert.deepEqual(manifest.surfaces[name].keys, expectedKeys);
  assertUnique(manifest.surfaces[name].keys);
  assert.deepEqual([...manifest.surfaces[name].keys], expectedKeys);
}

test("Step225 manifest exposes exact read-only schema keys", () => {
  const manifest = buildStep192DatasetContractManifest();

  assert.deepEqual(Object.keys(manifest), EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(Object.keys(manifest.sourceContract), EXPECTED_SOURCE_CONTRACT_KEYS);
  assert.deepEqual(Object.keys(manifest.compatibility), EXPECTED_COMPATIBILITY_KEYS);
  assert.deepEqual(Object.keys(manifest.surfaces), EXPECTED_SURFACE_NAMES);
  for (const surfaceName of EXPECTED_SURFACE_NAMES) {
    assert.deepEqual(Object.keys(manifest.surfaces[surfaceName]), EXPECTED_SURFACE_KEYS);
  }
  assert.equal(manifest.redacted, true);
});

test("Step225 manifest compatibility policy is deterministic and fail-closed", () => {
  const manifest = buildStep192DatasetContractManifest();

  assert.equal(manifest.manifestVersion, "step225_step192_dataset_contract_manifest_v1");
  assert.deepEqual(manifest.sourceContract, {
    step: "Step 192",
    sourceStep: "step192",
    service: "tradingAiMlDatasetArchitecture",
    runtimePayloadUnchanged: true,
    redacted: true,
  });
  assert.deepEqual(manifest.compatibility, {
    legacyExactKeySet: true,
    numericThresholdPreserved: true,
    stringThresholdPreserved: true,
    sensitiveStringPolicy: "redacted_metadata",
  });
});

test("Step225 manifest surfaces match Step192 legacy runtime key sets", () => {
  const manifest = buildStep192DatasetContractManifest();
  const architecture = buildAiMlDatasetArchitecture();

  assertSurface(manifest, "label", EXPECTED_LABEL_KEYS);
  assertSurface(manifest, "split", EXPECTED_SPLIT_KEYS);
  assertSurface(manifest, "walkForward", EXPECTED_WALK_FORWARD_KEYS);
  assertSurface(manifest, "versioningPolicy", EXPECTED_VERSIONING_KEYS);
  assertSurface(manifest, "lineagePolicy", EXPECTED_LINEAGE_KEYS);
  assertSurface(manifest, "retentionPolicy", EXPECTED_RETENTION_KEYS);
  assert.deepEqual(manifest.surfaces.label.keys, Object.keys(architecture.labelDefinitions[0]));
  assert.deepEqual(manifest.surfaces.split.keys, Object.keys(architecture.splitPolicies[0]));
  assert.deepEqual(manifest.surfaces.walkForward.keys, Object.keys(architecture.walkForwardPolicies[0]));
  assert.deepEqual(manifest.surfaces.versioningPolicy.keys, Object.keys(architecture.versioningPolicy));
  assert.deepEqual(manifest.surfaces.lineagePolicy.keys, Object.keys(architecture.lineagePolicy));
  assert.deepEqual(manifest.surfaces.retentionPolicy.keys, Object.keys(architecture.retentionPolicy));
  assert.equal(typeof architecture.labelDefinitions[0].threshold, "number");
});

test("Step225 manifest remains value-free and excludes sensitive material", () => {
  const manifest = buildStep192DatasetContractManifest();
  const serialized = JSON.stringify(manifest);

  for (const forbidden of [
    "downside_1m_negative",
    "chronological-split-v0",
    "walk-forward-expanding-v0",
    "forward_return_1m",
    "2015-01-01",
    "credential",
    "secret",
    "token",
    "provider_payload",
    "order_payload",
    "raw_provider_response",
    "private_path",
    "hash_value",
    "digest_value",
    "fingerprint_value",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.equal(serialized.includes("redacted_metadata"), true);
});

test("Step225 manifest is deterministic and mutation-resistant", () => {
  const first = buildStep192DatasetContractManifest();
  const second = buildStep192DatasetContractManifest();
  const runtimeBefore = buildAiMlDatasetArchitecture();

  assert.deepEqual(second, first);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.surfaces.label.keys), true);
  assert.throws(() => {
    first.surfaces.label.keys.push("mutated");
  });
  assert.throws(() => {
    first.compatibility.legacyExactKeySet = false;
  });
  assert.deepEqual(buildAiMlDatasetArchitecture(), runtimeBefore);
});

test("Step225 manifest does not change Step192 readiness or execution gates", () => {
  buildStep192DatasetContractManifest();

  assert.deepEqual(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS, STEP225_DATASET_CONTRACT_MANIFEST_CONTRACT.protectedRuntimeFlags);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.providerCallsAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.orderSubmissionAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.runtimeRouteAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.publicUiAllowed, false);
  assert.equal(STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.readyForLiveGuardedTrading, false);
  assert.deepEqual(STEP225_DATASET_CONTRACT_MANIFEST_CONTRACT.topLevelKeys, EXPECTED_TOP_LEVEL_KEYS);
  assert.deepEqual(STEP225_DATASET_CONTRACT_MANIFEST_CONTRACT.compatibilityKeys, EXPECTED_COMPATIBILITY_KEYS);
  assert.deepEqual(STEP225_DATASET_CONTRACT_MANIFEST_CONTRACT.surfaceNames, EXPECTED_SURFACE_NAMES);
});
