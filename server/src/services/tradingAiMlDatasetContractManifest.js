import {
  STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  buildAiMlDatasetArchitecture,
} from "./tradingAiMlDatasetArchitecture.js";

const MANIFEST_VERSION = "step225_step192_dataset_contract_manifest_v1";

const TOP_LEVEL_KEYS = Object.freeze([
  "manifestVersion",
  "sourceContract",
  "compatibility",
  "surfaces",
  "redacted",
]);

const SOURCE_CONTRACT_KEYS = Object.freeze([
  "step",
  "sourceStep",
  "service",
  "runtimePayloadUnchanged",
  "redacted",
]);

const COMPATIBILITY_KEYS = Object.freeze([
  "legacyExactKeySet",
  "numericThresholdPreserved",
  "stringThresholdPreserved",
  "sensitiveStringPolicy",
]);

const SURFACE_NAMES = Object.freeze([
  "label",
  "split",
  "walkForward",
  "versioningPolicy",
  "lineagePolicy",
  "retentionPolicy",
]);

const SURFACE_KEYS = Object.freeze(["keys"]);

function freezeArray(values) {
  return Object.freeze([...values]);
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function keysOf(value) {
  return freezeArray(Object.keys(value || {}));
}

function buildSurface(keys) {
  return Object.freeze({
    keys: freezeArray(keys),
  });
}

export function buildStep192DatasetContractManifest() {
  const architecture = buildAiMlDatasetArchitecture();
  const manifest = {
    manifestVersion: MANIFEST_VERSION,
    sourceContract: {
      step: "Step 192",
      sourceStep: "step192",
      service: "tradingAiMlDatasetArchitecture",
      runtimePayloadUnchanged: true,
      redacted: true,
    },
    compatibility: {
      legacyExactKeySet: true,
      numericThresholdPreserved: true,
      stringThresholdPreserved: true,
      sensitiveStringPolicy: "redacted_metadata",
    },
    surfaces: {
      label: buildSurface(keysOf(architecture.labelDefinitions[0])),
      split: buildSurface(keysOf(architecture.splitPolicies[0])),
      walkForward: buildSurface(keysOf(architecture.walkForwardPolicies[0])),
      versioningPolicy: buildSurface(keysOf(architecture.versioningPolicy)),
      lineagePolicy: buildSurface(keysOf(architecture.lineagePolicy)),
      retentionPolicy: buildSurface(keysOf(architecture.retentionPolicy)),
    },
    redacted: true,
  };

  return deepFreeze(manifest);
}

export const STEP225_DATASET_CONTRACT_MANIFEST_CONTRACT = deepFreeze({
  topLevelKeys: TOP_LEVEL_KEYS,
  sourceContractKeys: SOURCE_CONTRACT_KEYS,
  compatibilityKeys: COMPATIBILITY_KEYS,
  surfaceNames: SURFACE_NAMES,
  surfaceKeys: SURFACE_KEYS,
  protectedRuntimeFlags: STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS,
  redacted: true,
});
