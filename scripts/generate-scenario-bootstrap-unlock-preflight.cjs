const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const MONTHLY_READINESS_PATH = path.join("data", "processed", "scenario_monthly_input_readiness.json");
const MONTHLY_WRITE_PREFLIGHT_PATH = path.join("data", "processed", "scenario_monthly_write_preflight.json");
const MONTHLY_CACHE_WRITER_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_writer_preflight.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_bootstrap_unlock_preflight.json");
const MONTHLY_VALIDATOR_SCRIPT_PATH = path.join(__dirname, "verify-scenario-monthly-input.cjs");

const PREFLIGHT_VERSION = "scenario-bootstrap-unlock-preflight-v0.1";
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

function runMonthlyValidator() {
  const result = spawnSync(process.execPath, [MONTHLY_VALIDATOR_SCRIPT_PATH], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function buildPreflight() {
  const monthlyReadiness = readJson(MONTHLY_READINESS_PATH);
  const monthlyWritePreflight = readJson(MONTHLY_WRITE_PREFLIGHT_PATH);
  const monthlyCacheWriterPreflight = readJson(MONTHLY_CACHE_WRITER_PREFLIGHT_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);
  const monthlyValidator = monthlyFileExists ? runMonthlyValidator() : { ok: false, stdout: "", stderr: "" };

  if (monthlyFileExists && !monthlyValidator.ok) {
    fail(`${MONTHLY_DATA_PATH} exists but monthly input validator failed: ${monthlyValidator.stderr || monthlyValidator.stdout}`);
  }

  const monthlyReadinessReady =
    monthlyReadiness.monthlyInput?.dataFilePresent === true &&
    monthlyReadiness.monthlyInput?.dataRowCount > 0 &&
    monthlyReadiness.readiness?.readyForJointBlockBootstrap === true;
  const monthlyWriteComplete =
    monthlyWritePreflight.checks?.monthlyFileExists === true &&
    monthlyWritePreflight.checks?.canAttemptMonthlyWrite === true &&
    monthlyWritePreflight.readiness?.monthlyDataFileWritten === true &&
    monthlyWritePreflight.readiness?.bootstrapStillBlocked === false;
  const monthlyCacheWriterComplete =
    monthlyCacheWriterPreflight.checks?.monthlyFileExists === true &&
    monthlyCacheWriterPreflight.checks?.providerCallsAllowed === true &&
    monthlyCacheWriterPreflight.readiness?.monthlyDataFileWritten === true;

  if (monthlyFileExists && !monthlyWriteComplete) {
    fail(`${MONTHLY_DATA_PATH} exists before monthly write preflight records a completed write`);
  }
  if (monthlyFileExists && !monthlyCacheWriterComplete) {
    fail(`${MONTHLY_DATA_PATH} exists before monthly cache writer completion is recorded`);
  }

  const monthlyValidatorPassed = monthlyValidator.ok;
  const safeToRunJointBlockBootstrap =
    monthlyFileExists && monthlyValidatorPassed && monthlyReadinessReady && monthlyWriteComplete && monthlyCacheWriterComplete;
  const blockers = unique([
    ...(monthlyFileExists ? [] : ["scenario_monthly_returns_csv_not_written"]),
    ...(monthlyValidatorPassed ? [] : ["scenario_monthly_input_validator_not_passed"]),
    ...(monthlyReadinessReady ? [] : ["monthly_readiness_not_ready_for_joint_block_bootstrap"]),
    ...(monthlyWriteComplete ? [] : ["monthly_write_preflight_not_completed"]),
    ...(monthlyCacheWriterComplete ? [] : ["monthly_cache_writer_completion_not_recorded"]),
    ...(monthlyReadiness.readiness?.blockers ?? []),
    ...(monthlyWritePreflight.checks?.blockers ?? []),
    ...(monthlyCacheWriterPreflight.checks?.blockers ?? []),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      monthlyReadiness: MONTHLY_READINESS_PATH,
      monthlyWritePreflight: MONTHLY_WRITE_PREFLIGHT_PATH,
      monthlyCacheWriterPreflight: MONTHLY_CACHE_WRITER_PREFLIGHT_PATH,
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
      safeToRunJointBlockBootstrap,
      monthlyDataRows: monthlyReadiness.monthlyInput?.dataRowCount ?? 0,
      blockers,
    },
    readiness: {
      status: safeToRunJointBlockBootstrap ? "ready_for_joint_block_bootstrap_review" : "blocked_before_joint_block_bootstrap",
      safeToRunJointBlockBootstrap,
      scenarioApiAllowed: false,
      compareChartScenarioBandsAllowed: false,
      calculatePortfolioResultChangesAllowed: false,
      bootstrapStillBlocked: !safeToRunJointBlockBootstrap,
      nextAllowedStep: safeToRunJointBlockBootstrap
        ? "review_joint_block_bootstrap_implementation_boundary"
        : "complete_validated_monthly_data_write_before_bootstrap",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-bootstrap-unlock-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-bootstrap-unlock-preflight.cjs`);
    }
    console.log("[generate-scenario-bootstrap-unlock-preflight] ok");
    console.log(`[generate-scenario-bootstrap-unlock-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-bootstrap-unlock-preflight] wrote preflight");
  console.log(`[generate-scenario-bootstrap-unlock-preflight] preflight=${PREFLIGHT_PATH}`);
  console.log(`[generate-scenario-bootstrap-unlock-preflight] safeToRunJointBlockBootstrap=${parsed.checks.safeToRunJointBlockBootstrap}`);
}

main();
