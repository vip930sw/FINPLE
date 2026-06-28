const fs = require("node:fs");
const path = require("node:path");

const BOOTSTRAP_UNLOCK_PREFLIGHT_PATH = path.join("data", "processed", "scenario_bootstrap_unlock_preflight.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_runtime_implementation_preflight.json");

const PREFLIGHT_VERSION = "scenario-runtime-implementation-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function unique(values) {
  return [...new Set(values)];
}

function buildPreflight() {
  const bootstrapUnlockPreflight = readJson(BOOTSTRAP_UNLOCK_PREFLIGHT_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);
  const monthlyValidatorPassed = bootstrapUnlockPreflight.checks?.monthlyValidatorPassed === true;
  const monthlyReadinessReady = bootstrapUnlockPreflight.checks?.monthlyReadinessReady === true;
  const monthlyWriteComplete = bootstrapUnlockPreflight.checks?.monthlyWriteComplete === true;
  const monthlyCacheWriterComplete = bootstrapUnlockPreflight.checks?.monthlyCacheWriterComplete === true;
  const bootstrapUnlockReady =
    bootstrapUnlockPreflight.checks?.safeToRunJointBlockBootstrap === true &&
    bootstrapUnlockPreflight.readiness?.safeToRunJointBlockBootstrap === true &&
    bootstrapUnlockPreflight.readiness?.bootstrapStillBlocked === false;
  const scenarioApiReviewApproved = bootstrapUnlockPreflight.readiness?.scenarioApiAllowed === true;
  const compareChartReviewApproved = bootstrapUnlockPreflight.readiness?.compareChartScenarioBandsAllowed === true;
  const calculationReviewApproved = bootstrapUnlockPreflight.readiness?.calculatePortfolioResultChangesAllowed === true;

  if (bootstrapUnlockReady && !monthlyFileExists) {
    fail(`${MONTHLY_DATA_PATH} missing while bootstrap unlock preflight reports ready`);
  }

  const runtimeScenarioImplementationAllowed =
    monthlyFileExists &&
    monthlyValidatorPassed &&
    monthlyReadinessReady &&
    monthlyWriteComplete &&
    monthlyCacheWriterComplete &&
    bootstrapUnlockReady &&
    scenarioApiReviewApproved &&
    compareChartReviewApproved &&
    calculationReviewApproved;
  const blockers = unique([
    ...(monthlyFileExists ? [] : ["scenario_monthly_returns_csv_not_written"]),
    ...(monthlyValidatorPassed ? [] : ["scenario_monthly_input_validator_not_passed"]),
    ...(monthlyReadinessReady ? [] : ["monthly_readiness_not_ready_for_joint_block_bootstrap"]),
    ...(monthlyWriteComplete ? [] : ["monthly_write_preflight_not_completed"]),
    ...(monthlyCacheWriterComplete ? [] : ["monthly_cache_writer_completion_not_recorded"]),
    ...(bootstrapUnlockReady ? [] : ["bootstrap_unlock_preflight_not_ready"]),
    ...(scenarioApiReviewApproved ? [] : ["scenario_api_runtime_review_not_approved"]),
    ...(compareChartReviewApproved ? [] : ["compare_chart_runtime_review_not_approved"]),
    ...(calculationReviewApproved ? [] : ["calculate_portfolio_result_runtime_review_not_approved"]),
    ...(bootstrapUnlockPreflight.checks?.blockers ?? []),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      bootstrapUnlockPreflight: BOOTSTRAP_UNLOCK_PREFLIGHT_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
    },
    checks: {
      monthlyFileExists,
      monthlyValidatorPassed,
      monthlyReadinessReady,
      monthlyWriteComplete,
      monthlyCacheWriterComplete,
      bootstrapUnlockReady,
      scenarioApiReviewApproved,
      compareChartReviewApproved,
      calculationReviewApproved,
      runtimeScenarioImplementationAllowed,
      blockers,
    },
    readiness: {
      status: runtimeScenarioImplementationAllowed
        ? "ready_for_runtime_scenario_implementation"
        : "blocked_before_runtime_scenario_implementation",
      safeToImplementScenarioApi: runtimeScenarioImplementationAllowed,
      safeToImplementCompareChartScenarioBands: runtimeScenarioImplementationAllowed,
      safeToModifyCalculatePortfolioResult: runtimeScenarioImplementationAllowed,
      probabilityScenarioCalculationAllowed: runtimeScenarioImplementationAllowed,
      runtimeScenarioImplementationAllowed,
      bootstrapStillBlocked: !runtimeScenarioImplementationAllowed,
      nextAllowedStep: runtimeScenarioImplementationAllowed
        ? "review_runtime_scenario_api_compare_chart_and_calculation_changes"
        : "complete_bootstrap_unlock_and_runtime_reviews_before_implementation",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-runtime-implementation-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-runtime-implementation-preflight.cjs`);
    }
    console.log("[generate-scenario-runtime-implementation-preflight] ok");
    console.log(`[generate-scenario-runtime-implementation-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-runtime-implementation-preflight] wrote preflight");
  console.log(`[generate-scenario-runtime-implementation-preflight] preflight=${PREFLIGHT_PATH}`);
  console.log(
    `[generate-scenario-runtime-implementation-preflight] runtimeScenarioImplementationAllowed=${parsed.checks.runtimeScenarioImplementationAllowed}`,
  );
}

main();
