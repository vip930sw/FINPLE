const fs = require("node:fs");
const path = require("node:path");

const APPROVAL_READINESS_PATH = path.join("data", "processed", "scenario_p0_approval_readiness.json");
const SOURCE_POLICY_POST_IMPORT_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_source_policy_post_import_preflight.json",
);
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_monthly_write_preflight.json");

const PREFLIGHT_VERSION = "scenario-monthly-write-preflight-v0.1";
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

function buildPreflight() {
  const approvalReadiness = readJson(APPROVAL_READINESS_PATH);
  const sourcePolicyPostImportPreflight = readJson(SOURCE_POLICY_POST_IMPORT_PREFLIGHT_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);
  const safeToWriteMonthlyData = approvalReadiness.readiness?.safeToWriteMonthlyData === true;
  const providerCallsAllowed = approvalReadiness.readiness?.providerCallsAllowed === true;
  const postImportPreflightReady =
    sourcePolicyPostImportPreflight.checks?.safeToUseImportedSourcePolicy === true &&
    sourcePolicyPostImportPreflight.readiness?.safeToUseImportedSourcePolicy === true;
  const approvalStatus = approvalReadiness.readiness?.status || "unknown";
  const blockers = [
    ...new Set([
      ...(postImportPreflightReady ? [] : ["source_policy_post_import_preflight_not_ready"]),
      ...(approvalReadiness.readiness?.blockers ?? []),
    ]),
  ];

  if (monthlyFileExists && !safeToWriteMonthlyData) {
    fail(`${MONTHLY_DATA_PATH} exists before P0 approval readiness allows monthly writes`);
  }
  if (monthlyFileExists && !providerCallsAllowed) {
    fail(`${MONTHLY_DATA_PATH} exists while provider calls are not allowed by P0 approval readiness`);
  }
  if (monthlyFileExists && !postImportPreflightReady) {
    fail(`${MONTHLY_DATA_PATH} exists before source-policy post-import preflight is ready`);
  }

  const canAttemptMonthlyWrite = safeToWriteMonthlyData && providerCallsAllowed && postImportPreflightReady;
  const status = monthlyFileExists
    ? "monthly_file_present_after_preflight_approval"
    : canAttemptMonthlyWrite
      ? "ready_for_monthly_write_but_file_missing"
      : "blocked_before_monthly_write";

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalReadiness: APPROVAL_READINESS_PATH,
      sourcePolicyPostImportPreflight: SOURCE_POLICY_POST_IMPORT_PREFLIGHT_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      report: PREFLIGHT_PATH,
    },
    checks: {
      monthlyFileExists,
      approvalStatus,
      safeToWriteMonthlyData,
      providerCallsAllowed,
      postImportPreflightReady,
      canAttemptMonthlyWrite,
      blockers,
    },
    readiness: {
      status,
      monthlyDataFileWritten: monthlyFileExists,
      bootstrapStillBlocked: !monthlyFileExists || !canAttemptMonthlyWrite,
      nextAllowedStep: canAttemptMonthlyWrite
        ? "write_validated_scenario_monthly_returns_with_source_metadata"
        : "complete_p0_approval_readiness_before_monthly_write",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-monthly-write-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-monthly-write-preflight.cjs`);
    }
    console.log("[generate-scenario-monthly-write-preflight] ok");
    console.log(`[generate-scenario-monthly-write-preflight] report=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  console.log("[generate-scenario-monthly-write-preflight] wrote report");
  console.log(`[generate-scenario-monthly-write-preflight] report=${PREFLIGHT_PATH}`);
}

main();
