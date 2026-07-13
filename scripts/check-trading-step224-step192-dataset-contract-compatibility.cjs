const assertStrict = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const {
  AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS,
  buildAiMlPrimitivesMigrationAudit,
  validateAiMlProtectedFlagStageRegistry,
  validateAiMlPrimitivesMigrationAudit,
} = require("./trading-ai-ml-primitives-migration-audit.cjs");
const {
  buildAiMlPrimitivesMigrationRegressionPlan,
  validateAiMlPrimitivesMigrationRegressionPlan,
} = require("./run-trading-ai-ml-primitives-migration-regression.cjs");

const STEP224_SCRIPT = "check:trading-step224-step192-dataset-contract-compatibility";
const STEP192_MODULE = "server/src/services/tradingAiMlDatasetArchitecture.js";
const STEP192_TEST = "server/src/services/tradingAiMlDatasetArchitecture.test.js";
const STEP223_CHECKER = "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs";
const STEP223_TEST = "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.test.cjs";
const STEP224_CHECKER = "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs";
const STEP224_TEST = "scripts/check-trading-step224-step192-dataset-contract-compatibility.test.cjs";

const ALLOWED_TOUCHED_FILES = new Set([
  "package.json",
  STEP192_MODULE,
  STEP192_TEST,
  STEP223_CHECKER,
  STEP223_TEST,
  STEP224_CHECKER,
  STEP224_TEST,
]);

const FORBIDDEN_TOUCHED_FILES = [
  "server/src/services/tradingAiMlStrategyManagement.js",
  "server/src/services/tradingAiMlFeaturePipelineArchitecture.js",
  "server/src/services/tradingAiMlFeaturePipelinePreflight.js",
  "server/src/services/tradingAiMlReadinessGateSummary.js",
  "server/src/services/tradingAiMlBatchContractReview.js",
  "server/src/services/tradingAiMlDatasetBuildDryRunManifest.js",
  "server/src/services/tradingAiMlManifestValidationReport.js",
  "server/src/services/tradingAiMlManifestHandoffEligibility.js",
  "server/src/services/tradingAiMlArchitectureMilestoneReview.js",
  "server/src/services/tradingAiMlContractPrimitives.js",
  "server/src/services/tradingAiMlContractPrimitives.test.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.css",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/finple-test-temp-guard.cjs",
  "scripts/check-trading-step219-windows-long-path-temp-cleanup.cjs",
  "scripts/check-trading-step220-platform-correct-temp-root-identity.cjs",
  "scripts/check-trading-step221-finple-temp-baseline-provenance.cjs",
  "scripts/check-trading-step222-finple-temp-producer-attribution.cjs",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
];

const FORBIDDEN_RUNTIME_CODE = [
  "fetch(",
  "axios",
  "createClient(",
  "supabase.from(",
  "supabase.insert(",
  "supabase.update(",
  "supabase.delete(",
  "writeFile",
  "appendFile",
  "createWriteStream",
  "spawn(",
  "exec(",
  "runPython(",
  "python.exe",
  "pandas",
  "numpy",
  "scikit-learn",
  "torch",
  "tensorflow",
  "xgboost",
  "kisTokenClient",
  "kisQuoteAdapter",
  "kisOrderAdapter",
  "providerClient",
];

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

const EXPECTED_SPLIT_POLICY_KEYS = [
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

const EXPECTED_WALK_FORWARD_POLICY_KEYS = [
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

const EXPECTED_VERSIONING_POLICY_KEYS = [
  "policyId",
  "datasetVersionFormat",
  "labelChangeCreatesNewDatasetVersion",
  "featureChangeCreatesNewDatasetVersion",
  "splitChangeCreatesNewDatasetVersion",
  "immutableAfterReview",
  "status",
  "redacted",
];

const EXPECTED_LINEAGE_POLICY_KEYS = [
  "policyId",
  "lineageFields",
  "rawValueStorageAllowed",
  "privatePathStorageAllowed",
  "digestStorageAllowed",
  "status",
  "redacted",
];

const EXPECTED_RETENTION_POLICY_KEYS = [
  "policyId",
  "retentionScope",
  "datasetFileRetention",
  "redactionRequired",
  "forbiddenValueClasses",
  "publicExposureAllowed",
  "mypageExposureAllowed",
  "redacted",
];

const EXPECTED_LABEL_DEFINITIONS = [
  {
    labelId: "downside_1m_negative",
    modelType: "downside_probability_model",
    labelName: "one month negative forward return",
    horizon: "1m",
    formula: "forward_return_1m < 0",
    threshold: 0,
    positiveClass: "negative_forward_return",
    neutralClass: "non_negative_forward_return",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "1m",
    redacted: true,
  },
  {
    labelId: "downside_3m_below_minus_5pct",
    modelType: "downside_probability_model",
    labelName: "three month downside threshold breach",
    horizon: "3m",
    formula: "forward_return_3m < -5pct",
    threshold: "-5pct",
    positiveClass: "below_threshold",
    neutralClass: "at_or_above_threshold",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "3m",
    redacted: true,
  },
  {
    labelId: "forward_volatility_20d",
    modelType: "volatility_forecast_model",
    labelName: "future realized volatility twenty day",
    horizon: "20d",
    formula: "realized_volatility_over_label_window",
    threshold: "continuous_target",
    positiveClass: "not_applicable_continuous",
    neutralClass: "not_applicable_continuous",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "20d",
    redacted: true,
  },
  {
    labelId: "future_drawdown_bucket_60d",
    modelType: "portfolio_risk_score_model",
    labelName: "future drawdown bucket sixty day",
    horizon: "60d",
    formula: "max_drawdown_over_label_window_bucket",
    threshold: "bucketed_thresholds",
    positiveClass: "high_drawdown_bucket",
    neutralClass: "low_or_medium_drawdown_bucket",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "60d",
    redacted: true,
  },
  {
    labelId: "market_regime_20d",
    modelType: "market_regime_classifier",
    labelName: "twenty day market regime",
    horizon: "20d",
    formula: "future_return_and_volatility_bucket_after_prediction_time",
    threshold: "deterministic_bucket_rules",
    positiveClass: "regime_bucket",
    neutralClass: "sideways_bucket",
    missingLabelPolicy: "exclude_until_label_end_time_available",
    embargoPeriod: "20d",
    redacted: true,
  },
];

const EXPECTED_SPLIT_POLICY = {
  splitPolicyId: "chronological-split-v0",
  policyType: "chronological",
  randomSplitAllowed: false,
  trainWindow: "2015-01-01_to_2021-12-31",
  validationWindow: "2022-01-01_to_2023-12-31",
  testWindow: "2024-01-01_to_2025-12-31",
  finalHoldoutPolicy: "preserve_unseen_holdout",
  embargoRule: "label_horizon_sized_embargo",
  purgeRule: "purge_overlapping_samples",
  imputationRule: "fit_with_train_split_only",
  redacted: true,
};

const EXPECTED_WALK_FORWARD_POLICY = {
  walkForwardPolicyId: "walk-forward-expanding-v0",
  windowType: "expanding_train_rolling_validation",
  trainWindowMinimum: "36m",
  validationWindow: "6m",
  testWindow: "6m",
  stepSize: "3m",
  embargoRule: "apply_label_horizon_embargo_each_fold",
  foldLeakageCheck: "required_before_training",
  redacted: true,
};

const EXPECTED_VERSIONING_POLICY = {
  policyId: "dataset-versioning-policy-v0",
  datasetVersionFormat: "dataset_family_id:label_version:feature_version:split_version",
  labelChangeCreatesNewDatasetVersion: true,
  featureChangeCreatesNewDatasetVersion: true,
  splitChangeCreatesNewDatasetVersion: true,
  immutableAfterReview: true,
  status: "design_only",
  redacted: true,
};

const EXPECTED_LINEAGE_POLICY = {
  policyId: "dataset-lineage-policy-v0",
  lineageFields: ["sourceRegistryId", "datasetFamilyId", "labelDefinitionId", "featureSetVersion", "splitPolicyId", "walkForwardPolicyId", "createdByAdminPlaceholder"],
  rawValueStorageAllowed: false,
  privatePathStorageAllowed: false,
  digestStorageAllowed: false,
  status: "placeholder_only",
  redacted: true,
};

const EXPECTED_RETENTION_POLICY = {
  policyId: "dataset-retention-redaction-policy-v0",
  retentionScope: "metadata_contract_only",
  datasetFileRetention: "not_applicable_no_file_created",
  redactionRequired: true,
  forbiddenValueClasses: ["redacted_metadata", "account linkage values", "provider packets", "order packets", "private filesystem references", "redacted_metadata"],
  publicExposureAllowed: false,
  mypageExposureAllowed: false,
  redacted: true,
};

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function assertNotIncludes(source, snippet, label) {
  assert(!source.includes(snippet), `${label} must not include: ${snippet}`);
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  const status = execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
  return [...new Set([...tracked, ...status])].map((file) => file.replace(/\\/g, "/"));
}

function assertNoAccidentalKeys(architecture) {
  const serialized = JSON.stringify({
    labelDefinitions: architecture.labelDefinitions,
    splitPolicies: architecture.splitPolicies,
    walkForwardPolicies: architecture.walkForwardPolicies,
    versioningPolicy: architecture.versioningPolicy,
    lineagePolicy: architecture.lineagePolicy,
    retentionPolicy: architecture.retentionPolicy,
  });
  for (const forbidden of [
    "predictionHorizon",
    "labelWindowStart",
    "labelWindowEnd",
    "targetDefinition",
    "positiveClassDefinition",
    "binningPolicy",
    "leakageControls",
    "purgeOverlapRequired",
    "leakageReviewRequired",
    "unknownPolicyKey",
  ]) {
    assert(!serialized.includes(forbidden), `accidental Step223 key leaked: ${forbidden}`);
  }
}

function assertDefaultArchitecture(architecture) {
  assertStrict.deepEqual(architecture.labelDefinitions, EXPECTED_LABEL_DEFINITIONS);
  assertStrict.equal(typeof architecture.labelDefinitions[0].threshold, "number");
  for (const label of architecture.labelDefinitions) {
    assertStrict.deepEqual(Object.keys(label), EXPECTED_LABEL_KEYS);
  }
  assertStrict.deepEqual(architecture.splitPolicies, [EXPECTED_SPLIT_POLICY]);
  assertStrict.deepEqual(Object.keys(architecture.splitPolicies[0]), EXPECTED_SPLIT_POLICY_KEYS);
  assertStrict.deepEqual(architecture.walkForwardPolicies, [EXPECTED_WALK_FORWARD_POLICY]);
  assertStrict.deepEqual(Object.keys(architecture.walkForwardPolicies[0]), EXPECTED_WALK_FORWARD_POLICY_KEYS);
  assertStrict.deepEqual(architecture.versioningPolicy, EXPECTED_VERSIONING_POLICY);
  assertStrict.deepEqual(Object.keys(architecture.versioningPolicy), EXPECTED_VERSIONING_POLICY_KEYS);
  assertStrict.deepEqual(architecture.lineagePolicy, EXPECTED_LINEAGE_POLICY);
  assertStrict.deepEqual(Object.keys(architecture.lineagePolicy), EXPECTED_LINEAGE_POLICY_KEYS);
  assertStrict.deepEqual(architecture.retentionPolicy, EXPECTED_RETENTION_POLICY);
  assertStrict.deepEqual(Object.keys(architecture.retentionPolicy), EXPECTED_RETENTION_POLICY_KEYS);
  assertNoAccidentalKeys(architecture);
}

(async function main() {
  for (const file of [STEP192_MODULE, STEP192_TEST, STEP223_CHECKER, STEP223_TEST, STEP224_CHECKER, STEP224_TEST]) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const packageJson = read("package.json");
  const service = read(STEP192_MODULE);
  const serviceTest = read(STEP192_TEST);
  const step223Checker = read(STEP223_CHECKER);
  const step223Test = read(STEP223_TEST);

  assertIncludes(packageJson, `"${STEP224_SCRIPT}"`, "package Step224 script");
  assertIncludes(packageJson, STEP224_CHECKER, "package Step224 checker link");
  assertIncludes(packageJson, STEP224_TEST, "package Step224 checker test link");
  assertIncludes(packageJson, STEP223_TEST, "package Step223 checker test link");
  assertIncludes(packageJson, STEP192_TEST, "package Step192 service test link");

  for (const snippet of [
    "function sanitizeStep192Scalar(value, fallback)",
    "if (typeof value === \"number\") return value;",
    "if (typeof value === \"boolean\") return value;",
    "threshold: sanitizeStep192Scalar(label?.threshold",
    "finalHoldoutPolicy: sanitizeAiMlMetadataValue(policy?.finalHoldoutPolicy",
    "purgeRule: sanitizeAiMlMetadataValue(policy?.purgeRule",
    "imputationRule: sanitizeAiMlMetadataValue(policy?.imputationRule",
    "foldLeakageCheck: sanitizeStep192Scalar(policy?.foldLeakageCheck",
    "function sanitizeVersioningPolicy(value)",
    "function sanitizeLineagePolicy(value)",
    "function sanitizeRetentionPolicy(value)",
    "versioningPolicy: sanitizeVersioningPolicy(sourceInput.versioningPolicy || VERSIONING_POLICY)",
    "lineagePolicy: sanitizeLineagePolicy(sourceInput.lineagePolicy || LINEAGE_POLICY)",
    "retentionPolicy: sanitizeRetentionPolicy(sourceInput.retentionPolicy || RETENTION_POLICY)",
  ]) {
    assertIncludes(service, snippet, "Step224 service compatibility source");
  }
  assertNotIncludes(service, "function sanitizePolicyMetadata", "generic policy metadata sanitizer");

  for (const snippet of [
    "EXPECTED_LABEL_DEFINITIONS",
    "EXPECTED_SPLIT_POLICY",
    "EXPECTED_WALK_FORWARD_POLICY",
    "EXPECTED_VERSIONING_POLICY",
    "Step192 custom overrides keep legacy dataset contract vocabulary",
    "Step192 sensitive strings are redacted while safe scalars keep type",
    "Object.hasOwn(architecture.labelDefinitions[0], \"predictionHorizon\"), false",
    "Object.hasOwn(architecture.splitPolicies[0], \"purgeOverlapRequired\"), false",
    "Object.hasOwn(architecture.walkForwardPolicies[0], \"leakageReviewRequired\"), false",
  ]) {
    assertIncludes(serviceTest, snippet, "Step224 Step192 service test coverage");
  }

  for (const snippet of [
    "STEP192_LABEL_KEYS",
    "STEP192_SPLIT_POLICY_KEYS",
    "STEP192_WALK_FORWARD_POLICY_KEYS",
    "typeof architecture.labelDefinitions[0].threshold === \"number\"",
    "Step192 read-only audit preserved",
  ]) {
    assertIncludes(step223Checker + step223Test, snippet, "Step223 compatibility hardening");
  }

  const serviceModule = await import(pathToFileURL(`${process.cwd()}/${STEP192_MODULE}`).href);
  assertStrict.deepEqual(serviceModule.STEP192_METADATA_ONLY_ALLOWED_FLAGS, {});
  assertStrict.equal(Object.values(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS).filter(Boolean).length, 0);
  assertStrict.equal(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.providerCallsAllowed, false);
  assertStrict.equal(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.orderSubmissionAllowed, false);
  assertStrict.equal(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.runtimeRouteAllowed, false);
  assertStrict.equal(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.publicUiAllowed, false);
  assertStrict.equal(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.readyForOrderSubmission, false);
  assertStrict.equal(serviceModule.STEP192_AI_ML_DATASET_ARCHITECTURE_FLAGS.readyForLiveGuardedTrading, false);

  assertDefaultArchitecture(serviceModule.buildAiMlDatasetArchitecture());

  const customArchitecture = serviceModule.buildAiMlDatasetArchitecture({
    labelDefinitions: [{
      labelId: "custom_legacy_label",
      modelType: "downside_probability_model",
      labelName: "custom legacy label",
      horizon: "2m",
      formula: "forward_return_2m < -3pct",
      threshold: "-3pct",
      positiveClass: "below_custom_threshold",
      neutralClass: "at_or_above_custom_threshold",
      missingLabelPolicy: "exclude_until_label_end_time_available",
      embargoPeriod: "2m",
      predictionHorizon: "should_not_survive",
      targetDefinition: "should_not_survive",
    }],
    splitPolicies: [{ ...EXPECTED_SPLIT_POLICY, splitPolicyId: "custom-split", randomSplitAllowed: true, purgeOverlapRequired: true }],
    walkForwardPolicies: [{ ...EXPECTED_WALK_FORWARD_POLICY, walkForwardPolicyId: "custom-walk", leakageReviewRequired: true }],
    versioningPolicy: { ...EXPECTED_VERSIONING_POLICY, unknownPolicyKey: "remove me" },
    lineagePolicy: {
      ...EXPECTED_LINEAGE_POLICY,
      rawValueStorageAllowed: true,
      privatePathStorageAllowed: true,
      digestStorageAllowed: true,
      unknownPolicyKey: "remove me",
    },
    retentionPolicy: {
      ...EXPECTED_RETENTION_POLICY,
      redactionRequired: false,
      publicExposureAllowed: true,
      mypageExposureAllowed: true,
      unknownPolicyKey: "remove me",
    },
  });
  assertStrict.deepEqual(Object.keys(customArchitecture.labelDefinitions[0]), EXPECTED_LABEL_KEYS);
  assertStrict.equal(customArchitecture.labelDefinitions[0].threshold, "-3pct");
  assertStrict.equal(customArchitecture.splitPolicies[0].randomSplitAllowed, false);
  assertStrict.equal(customArchitecture.lineagePolicy.rawValueStorageAllowed, false);
  assertStrict.equal(customArchitecture.lineagePolicy.privatePathStorageAllowed, false);
  assertStrict.equal(customArchitecture.lineagePolicy.digestStorageAllowed, false);
  assertStrict.equal(customArchitecture.retentionPolicy.redactionRequired, true);
  assertStrict.equal(customArchitecture.retentionPolicy.publicExposureAllowed, false);
  assertStrict.equal(customArchitecture.retentionPolicy.mypageExposureAllowed, false);
  assertNoAccidentalKeys(customArchitecture);

  const normalized = serviceModule.normalizeStep192DatasetArchitectureSnapshotForAdmin({
    labelDefinitions: [{
      labelId: "snapshot_label",
      modelType: "downside_probability_model",
      labelName: "snapshot label",
      horizon: "1m",
      formula: "forward_return_1m < 0",
      threshold: 0,
      positiveClass: "negative_forward_return",
      neutralClass: "non_negative_forward_return",
      missingLabelPolicy: "exclude_until_label_end_time_available",
      embargoPeriod: "1m",
      targetDefinition: "should_not_survive",
    }],
    splitPolicies: [{ ...EXPECTED_SPLIT_POLICY, splitPolicyId: "snapshot-split", randomSplitAllowed: true, purgeOverlapRequired: true }],
    walkForwardPolicies: [{ ...EXPECTED_WALK_FORWARD_POLICY, walkForwardPolicyId: "snapshot-walk", leakageReviewRequired: true }],
    readyForOrderSubmission: true,
    orderSubmissionAllowed: true,
  });
  assertStrict.deepEqual(Object.keys(normalized.labelDefinitions[0]), EXPECTED_LABEL_KEYS);
  assertStrict.deepEqual(Object.keys(normalized.splitPolicies[0]), EXPECTED_SPLIT_POLICY_KEYS);
  assertStrict.deepEqual(Object.keys(normalized.walkForwardPolicies[0]), EXPECTED_WALK_FORWARD_POLICY_KEYS);
  assertStrict.equal(normalized.splitPolicies[0].randomSplitAllowed, false);
  assertStrict.equal(normalized.readyForOrderSubmission, undefined);
  assertStrict.equal(normalized.orderSubmissionAllowed, undefined);
  assertNoAccidentalKeys(normalized);

  const audit = await buildAiMlPrimitivesMigrationAudit();
  const auditValidation = validateAiMlPrimitivesMigrationAudit(audit);
  assert(auditValidation.ok, `audit validation failed: ${auditValidation.errors.join(", ")}`);
  assert(validateAiMlProtectedFlagStageRegistry().ok, "protected flag registry validation failed");
  assertStrict.equal(AI_ML_PRIMITIVE_MIGRATION_PROTECTED_FLAGS.length, 39);
  assertStrict.equal(audit.scope, "step192_to_step200");
  assertStrict.equal(audit.expectedStageCount, 9);
  assertStrict.equal(audit.migratedStageCount, 9);
  assertStrict.equal(audit.unexpectedTruePermissionCount, 0);

  const regressionPlan = buildAiMlPrimitivesMigrationRegressionPlan();
  const regressionValidation = validateAiMlPrimitivesMigrationRegressionPlan(regressionPlan);
  assert(regressionValidation.ok, `regression plan invalid: ${regressionValidation.errors.join(", ")}`);
  assertStrict.equal(regressionPlan.sourceCheckerCount, 13);
  assertStrict.equal(regressionPlan.uniqueServiceTestCount, 10);
  assertStrict.equal(regressionPlan.uniqueMigrationCheckerTestCount, 14);
  assertStrict.equal(regressionPlan.uniqueSupportingTestCount, 11);
  assertStrict.equal(regressionPlan.uniqueCheckerTestCount, 25);
  assertStrict.equal(regressionPlan.uniqueTestFileCount, 35);
  assertStrict.equal(regressionPlan.duplicateFileCount, 0);

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step224 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step224 touched file: ${file}`);
  }

  const combinedChangedSource = [STEP192_MODULE, STEP192_TEST, STEP223_CHECKER, STEP223_TEST, STEP224_CHECKER, STEP224_TEST]
    .map(read)
    .join("\n")
    .replace(/const FORBIDDEN_RUNTIME_CODE = \[[\s\S]*?\];/g, "")
    .replace(/const FORBIDDEN_TOUCHED_FILES = \[[\s\S]*?\];/g, "");
  for (const snippet of FORBIDDEN_RUNTIME_CODE) {
    assert(!combinedChangedSource.includes(snippet), `forbidden runtime implementation code: ${snippet}`);
  }

  console.log("[check-trading-step224-step192-dataset-contract-compatibility] ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
