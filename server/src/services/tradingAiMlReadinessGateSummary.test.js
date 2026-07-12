import assert from "node:assert/strict";
import test from "node:test";

import {
  STEP195_ADDITIONAL_FALSE_FLAGS,
  STEP195_AI_ML_READINESS_GATE_FLAGS,
  STEP195_METADATA_ONLY_ALLOWED_FLAGS,
  TRADING_AI_ML_READINESS_GATE_MODEL,
  buildAdminTradingAiMlReadinessGateStatus,
  buildAiMlReadinessGateResults,
  buildAiMlReadinessGateSummary,
  collectAiMlReadinessSourceStatuses,
  deriveAiMlReadinessOverallStatus,
  evaluateAiMlReadinessGates,
} from "./tradingAiMlReadinessGateSummary.js";
import { buildAdminTradingAiMlFeaturePipelinePreflightStatus } from "./tradingAiMlFeaturePipelinePreflight.js";
import {
  AI_ML_CONTRACT_STATUS,
  buildAiMlFailClosedFlags,
  cloneAiMlMetadata,
} from "./tradingAiMlContractPrimitives.js";

const REQUIRED_SOURCE_IDS = [
  "step191_ai_ml_strategy_management",
  "step192_ai_ml_dataset_architecture",
  "step193_ai_ml_feature_pipeline_architecture",
  "step194_ai_ml_feature_pipeline_preflight",
];

const REQUIRED_GATE_CATEGORIES = [
  "strategy_management_contract",
  "dataset_labeling_contract",
  "feature_pipeline_contract",
  "feature_pipeline_preflight",
  "data_access_permission",
  "feature_generation_permission",
  "dataset_build_permission",
  "model_training_permission",
  "model_deployment_permission",
  "provider_connectivity_permission",
  "order_authority",
  "live_trading_permission",
  "public_exposure_permission",
];

const FORBIDDEN_TRUE_KEYS = [
  "actualDataDownloadAllowed",
  "featureGenerationAllowed",
  "featureFileCreationAllowed",
  "datasetBuildAllowed",
  "datasetFileCreationAllowed",
  "pythonFeatureJobAllowed",
  "modelTrainingAllowed",
  "modelArtifactCreationAllowed",
  "modelDeploymentAllowed",
  "modelAutoApprovalAllowed",
  "dbMigrationAllowed",
  "dbReadAllowed",
  "dbWriteAllowed",
  "persistentStorageAllowed",
  "providerCallsAllowed",
  "quoteCallsAllowed",
  "kisCallsAllowed",
  "kisTokenIssuanceAllowed",
  "orderSubmissionAllowed",
  "liveTradingAllowed",
  "publicUiExposureAllowed",
  "myPageExposureAllowed",
  "readyForActualDataDownload",
  "readyForFeatureGeneration",
  "readyForDatasetBuild",
  "readyForModelTraining",
  "readyForModelDeployment",
  "readyForReadOnlyProviderCalls",
  "readyForOrderSubmission",
  "readyForLiveGuardedTrading",
];

test("Step195 aggregates Step191-194 source statuses from existing exports", () => {
  const sourceRegistry = collectAiMlReadinessSourceStatuses();
  assert.deepEqual(sourceRegistry.sourceStatuses.map((source) => source.sourceStepId), REQUIRED_SOURCE_IDS);
  assert.equal(sourceRegistry.missingSourceStepIds.length, 0);
  for (const source of sourceRegistry.sourceStatuses) {
    assert.equal(source.adminOnly, true);
    assert.equal(source.executionAllowed, false);
    assert.equal(source.critical, true);
    assert.equal(source.contractPresent, true);
    assert.equal(source.contractValid, true);
    assert.equal(source.sourceStatus, "valid");
  }
});

test("Step195 current valid internal contract scenario stays execution blocked", () => {
  const summary = buildAiMlReadinessGateSummary();
  assert.equal(summary.capabilityStage, "contract_preflight_only");
  assert.equal(summary.internalContractStatus, "documented_and_validated");
  assert.equal(summary.metadataPreflightStatus, "valid");
  assert.equal(summary.executionPermissionStatus, "blocked");
  assert.equal(summary.externalAuthorityStatus, "blocked");
  assert.equal(summary.orderAuthorityStatus, "external_blocker");
  assert.equal(summary.liveTradingStatus, "blocked");
  assert.equal(summary.overallStatus, "internal_contracts_valid_execution_blocked");
  assert.equal(summary.passCount, 4);
  assert.equal(summary.blockedCount, 8);
  assert.equal(summary.externalBlockerCount, 1);
});

test("Step195 gate output is deterministic and stable ordered", () => {
  const first = buildAiMlReadinessGateSummary();
  const second = buildAiMlReadinessGateSummary();
  assert.deepEqual(first, second);
  assert.deepEqual(first.gateCategories, REQUIRED_GATE_CATEGORIES);
  assert.deepEqual(first.gateResults.map((gate) => gate.gateId), [...first.gateResults.map((gate) => gate.gateId)].sort());
  assert.deepEqual(first.sourceRegistry.sources.map((source) => source.sourceStepId), REQUIRED_SOURCE_IDS);
  assert.deepEqual(first.scenarioCatalog, [
    "scenario_a_current_valid_internal_contracts",
    "scenario_b_missing_source_contract",
    "scenario_c_invalid_preflight",
    "scenario_d_prohibited_permission_conflict",
    "scenario_e_public_exposure_conflict",
    "scenario_f_external_order_authority_blocker",
    "scenario_g_deterministic_ordering",
    "scenario_h_mutation_resistance",
    "scenario_i_shared_flag_compatibility",
    "scenario_j_inherited_execution_conflict",
    "scenario_k_explicit_metadata_allowlist",
    "scenario_l_shared_helper_compatibility",
    "scenario_m_full_default_output_compatibility",
    "scenario_n_mutation_resistance",
  ]);
});

test("Step195 missing source scenario remains incomplete, not ready", () => {
  const summary = buildAiMlReadinessGateSummary({
    omitSourceStepIds: ["step193_ai_ml_feature_pipeline_architecture"],
  });
  assert.equal(summary.internalContractStatus, "incomplete");
  assert.equal(summary.overallStatus, "internal_contracts_incomplete");
  assert.deepEqual(summary.sourceRegistry.missingSourceStepIds, ["step193_ai_ml_feature_pipeline_architecture"]);
});

test("Step195 invalid preflight scenario is invalid internal contract", () => {
  const invalidPreflight = buildAdminTradingAiMlFeaturePipelinePreflightStatus({
    requestOverrides: {
      executionIntent: {
        intentType: "metadata_only",
        requestedActions: ["train_model"],
      },
    },
  });
  const summary = buildAiMlReadinessGateSummary({
    aiMlFeaturePipelinePreflightStatus: invalidPreflight,
  });
  assert.equal(summary.metadataPreflightStatus, "invalid");
  assert.equal(summary.internalContractStatus, "invalid");
  assert.equal(summary.overallStatus, "invalid_internal_contract");
});

test("Step195 prohibited permission conflict is blocked by safety policy", () => {
  const summary = buildAiMlReadinessGateSummary({
    sourceStatusOverrides: {
      step193_ai_ml_feature_pipeline_architecture: {
        executionAllowed: true,
        evidence: ["providerCallsAllowed=true"],
      },
    },
  });
  assert.equal(summary.overallStatus, "blocked_by_safety_policy");
  assert.ok(summary.gateResults.some((gate) => gate.severity === "critical" && gate.evidence.includes("step193_ai_ml_feature_pipeline_architecture")));
});

test("Step195 public exposure conflict is blocked by safety policy", () => {
  const summary = buildAiMlReadinessGateSummary({
    sourceStatusOverrides: {
      step191_ai_ml_strategy_management: {
        publicExposureConflict: true,
        evidence: ["publicUiExposureAllowed=true"],
      },
    },
  });
  assert.equal(summary.overallStatus, "blocked_by_safety_policy");
  assert.ok(summary.gateResults.some((gate) => gate.category === "public_exposure_permission" && gate.severity === "critical"));
});

test("Step195 external order authority blocker is separate from internal contracts", () => {
  const summary = evaluateAiMlReadinessGates();
  assert.equal(summary.internalContractStatus, "documented_and_validated");
  assert.equal(summary.orderAuthorityStatus, "external_blocker");
  assert.equal(summary.gateResults.find((gate) => gate.category === "order_authority").status, "external_blocker");
  assert.equal(summary.overallStatus, "internal_contracts_valid_execution_blocked");
});

test("Step195 does not mutate source override objects", () => {
  const sourceStatusOverrides = {
    step194_ai_ml_feature_pipeline_preflight: {
      sourceVersion: "step194_feature_pipeline_preflight_contract_v1",
      evidence: ["stable_input"],
    },
  };
  const before = JSON.stringify(sourceStatusOverrides);
  buildAiMlReadinessGateSummary({ sourceStatusOverrides });
  assert.equal(JSON.stringify(sourceStatusOverrides), before);
});

test("Step195 all execution and live readiness permissions remain false", () => {
  const status = buildAdminTradingAiMlReadinessGateStatus();
  for (const key of FORBIDDEN_TRUE_KEYS) {
    assert.equal(status[key], false, `${key} must remain false`);
    assert.equal(status.flags[key], false, `flags.${key} must remain false`);
  }
  assert.equal(status.adminReadOnlyReadinessAggregationAllowed, true);
  assert.equal(status.deterministicStatusCompositionAllowed, true);
});

test("Step195 admin summary preserves existing detailed panel statuses", () => {
  const status = buildAdminTradingAiMlReadinessGateStatus();
  assert.equal(status.summary.sourceRegistry.sourceCount, 4);
  assert.deepEqual(status.summary.sourceRegistry.sources.map((source) => source.sourceStepId), REQUIRED_SOURCE_IDS);
  assert.equal(status.readinessGateModel, TRADING_AI_ML_READINESS_GATE_MODEL);
  assert.equal(STEP195_AI_ML_READINESS_GATE_FLAGS.orderSubmissionAllowed, false);
});

test("Step195 exports helper functions for deterministic gate composition", () => {
  const sourceRegistry = collectAiMlReadinessSourceStatuses();
  const gateResults = buildAiMlReadinessGateResults(sourceRegistry);
  assert.equal(deriveAiMlReadinessOverallStatus({ sourceRegistry, gateResults }), "internal_contracts_valid_execution_blocked");
  assert.equal(gateResults.length, REQUIRED_GATE_CATEGORIES.length);
});

test("Step195 status excludes sensitive raw values and readiness labels", () => {
  const serialized = JSON.stringify(buildAdminTradingAiMlReadinessGateStatus()).toLowerCase();
  for (const forbidden of ["api key", "secret", "token value", "account id", "raw provider response", "private path", "digest value", "model artifact path", "dataset file path"]) {
    assert.equal(serialized.includes(forbidden), false, `${forbidden} must stay out of summary`);
  }
  for (const forbiddenReadiness of ["production_ready", "live_ready", "trading_ready", "operational_ready"]) {
    assert.equal(serialized.includes(forbiddenReadiness), false, `${forbiddenReadiness} must not appear`);
  }
});

test("Step195 scenario I shared flag compatibility preserves metadata true and protected false flags", () => {
  const status = buildAdminTradingAiMlReadinessGateStatus();
  for (const key of Object.keys(STEP195_METADATA_ONLY_ALLOWED_FLAGS)) {
    assert.equal(STEP195_AI_ML_READINESS_GATE_FLAGS[key], true, key);
    assert.equal(status.flags[key], true, key);
  }
  for (const key of FORBIDDEN_TRUE_KEYS) {
    assert.equal(STEP195_AI_ML_READINESS_GATE_FLAGS[key], false, key);
    assert.equal(status.flags[key], false, key);
  }
});

test("Step195 scenario J inherited execution conflict is forced false", () => {
  const inheritedConflict = {
    metadataOnlyPreflightEvaluationAllowed: true,
    adminReadOnlyReadinessAggregationAllowed: true,
    actualDataDownloadAllowed: true,
    featureGenerationAllowed: true,
    datasetBuildAllowed: true,
    dbReadAllowed: true,
    providerCallsAllowed: true,
    kisCallsAllowed: true,
    modelTrainingAllowed: true,
    orderSubmissionAllowed: true,
    liveTradingAllowed: true,
    readyForOrderSubmission: true,
    readyForLiveGuardedTrading: true,
    unknownRuntimePermissionAllowed: true,
  };
  const flags = buildAiMlFailClosedFlags({
    inheritedFlags: inheritedConflict,
    allowedMetadataFlags: STEP195_METADATA_ONLY_ALLOWED_FLAGS,
    additionalFalseFlags: STEP195_ADDITIONAL_FALSE_FLAGS,
  });
  assert.equal(flags.metadataOnlyPreflightEvaluationAllowed, true);
  assert.equal(flags.adminReadOnlyReadinessAggregationAllowed, true);
  for (const key of [
    "actualDataDownloadAllowed",
    "featureGenerationAllowed",
    "datasetBuildAllowed",
    "dbReadAllowed",
    "providerCallsAllowed",
    "kisCallsAllowed",
    "modelTrainingAllowed",
    "orderSubmissionAllowed",
    "liveTradingAllowed",
    "readyForOrderSubmission",
    "readyForLiveGuardedTrading",
  ]) {
    assert.equal(flags[key], false, key);
  }
  assert.equal(Object.hasOwn(flags, "unknownRuntimePermissionAllowed"), false);
});

test("Step195 scenario K explicit metadata allowlist exactly matches true flags", () => {
  const actualTrueFlags = Object.entries(STEP195_AI_ML_READINESS_GATE_FLAGS)
    .filter(([, value]) => value === true)
    .map(([key]) => key)
    .sort();
  assert.deepEqual(actualTrueFlags, Object.keys(STEP195_METADATA_ONLY_ALLOWED_FLAGS).sort());
});

test("Step195 scenario L shared helper compatibility keeps ordering and redaction deterministic", () => {
  const sourceRegistry = collectAiMlReadinessSourceStatuses({
    sourceStatusOverrides: {
      step192_ai_ml_dataset_architecture: {
        evidence: ["private path", "normal_source_id", "api key value"],
      },
    },
  });
  const summary = buildAiMlReadinessGateSummary({
    sourceStatusOverrides: {
      step192_ai_ml_dataset_architecture: {
        evidence: ["private path", "normal_source_id", "api key value"],
      },
    },
  });
  assert.deepEqual(sourceRegistry.sourceStatuses.map((source) => source.sourceStepId), REQUIRED_SOURCE_IDS);
  assert.deepEqual(summary.gateResults.map((gate) => gate.gateId), [...summary.gateResults.map((gate) => gate.gateId)].sort());
  assert.equal(JSON.stringify(summary).includes("normal_source_id"), true);
  assert.equal(JSON.stringify(summary).includes("private path"), false);
  assert.equal(JSON.stringify(summary).includes("api key value"), false);
  assert.match(JSON.stringify(summary), /redacted_metadata/);
});

test("Step195 scenario M full default output remains compatible", () => {
  const summary = buildAiMlReadinessGateSummary();
  assert.equal(summary.summaryId, "step195_ai_ml_readiness_gate_summary");
  assert.equal(summary.capabilityStage, "contract_preflight_only");
  assert.equal(summary.internalContractStatus, "documented_and_validated");
  assert.equal(summary.metadataPreflightStatus, "valid");
  assert.equal(summary.executionPermissionStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(summary.orderAuthorityStatus, AI_ML_CONTRACT_STATUS.EXTERNAL_BLOCKER);
  assert.equal(summary.liveTradingStatus, AI_ML_CONTRACT_STATUS.BLOCKED);
  assert.equal(summary.overallStatus, "internal_contracts_valid_execution_blocked");
  assert.equal(summary.sourceRegistry.sourceCount, 4);
  assert.equal(summary.sourceRegistry.requiredSourceCount, 4);
  assert.equal(summary.gateResults.length, REQUIRED_GATE_CATEGORIES.length);
  assert.equal(summary.passCount, 4);
  assert.equal(summary.blockedCount, 8);
  assert.equal(summary.externalBlockerCount, 1);
  assert.equal(summary.scenarioCatalog.length, 14);
});

test("Step195 scenario N shared clone use prevents source, overrides, and options mutation", () => {
  const upstreamStatus = buildAdminTradingAiMlFeaturePipelinePreflightStatus();
  const input = {
    omitSourceStepIds: ["step193_ai_ml_feature_pipeline_architecture"],
    sourceStatusOverrides: {
      step194_ai_ml_feature_pipeline_preflight: {
        evidence: ["stable_input"],
      },
    },
    aiMlFeaturePipelinePreflightStatus: upstreamStatus,
  };
  const options = {
    sourceStatusOverrides: {
      unused: true,
    },
  };
  const before = cloneAiMlMetadata({ input, options });
  const summary = buildAiMlReadinessGateSummary(input, options);
  assert.equal(summary.overallStatus, "internal_contracts_incomplete");
  assert.deepEqual({ input, options }, before);
});
