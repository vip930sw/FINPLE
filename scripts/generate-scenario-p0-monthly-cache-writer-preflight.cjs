const fs = require("node:fs");
const path = require("node:path");

const PROVIDER_ADAPTER_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_provider_adapter_preflight.json");
const APPROVAL_READINESS_PATH = path.join("data", "processed", "scenario_p0_approval_readiness.json");
const MONTHLY_WRITE_PREFLIGHT_PATH = path.join("data", "processed", "scenario_monthly_write_preflight.json");
const WRITER_GATE_PATH = path.join("data", "processed", "scenario_p0_cache_writer_gate.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_writer_preflight.json");

const PREFLIGHT_VERSION = "scenario-p0-monthly-cache-writer-preflight-v0.1";
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
  const providerAdapterPreflight = readJson(PROVIDER_ADAPTER_PREFLIGHT_PATH);
  const approvalReadiness = readJson(APPROVAL_READINESS_PATH);
  const monthlyWritePreflight = readJson(MONTHLY_WRITE_PREFLIGHT_PATH);
  const writerGate = readJson(WRITER_GATE_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);

  const adapterReady =
    providerAdapterPreflight.checks?.safeToImplementProviderAdapter === true &&
    providerAdapterPreflight.checks?.providerCallsAllowed === true;
  const approvalReady =
    approvalReadiness.readiness?.safeToWriteMonthlyData === true && approvalReadiness.readiness?.providerCallsAllowed === true;
  const monthlyWriteReady = monthlyWritePreflight.checks?.canAttemptMonthlyWrite === true;
  const writerGateReady = writerGate.readiness?.canWriteMonthlyData === true && writerGate.readiness?.providerCallsAllowed === true;
  const allSourcePolicyRowsApproved = writerGate.rowCounts?.approvedRows === writerGate.rowCounts?.totalRows;
  const providerCallsAllowed = adapterReady && approvalReady && monthlyWriteReady && writerGateReady && allSourcePolicyRowsApproved;
  const safeToImplementMonthlyCacheWriter = providerCallsAllowed && !monthlyFileExists;

  if (monthlyFileExists && !providerCallsAllowed) {
    fail(`${MONTHLY_DATA_PATH} exists before monthly cache writer preflight is ready`);
  }
  if (monthlyFileExists && !writerGateReady) {
    fail(`${MONTHLY_DATA_PATH} exists while writer gate is not open`);
  }

  const blockers = unique([
    ...(adapterReady ? [] : ["provider_adapter_preflight_not_ready"]),
    ...(approvalReady ? [] : ["approval_readiness_not_safe_for_monthly_write"]),
    ...(monthlyWriteReady ? [] : ["monthly_write_preflight_not_ready"]),
    ...(writerGateReady ? [] : ["writer_gate_not_open_for_monthly_cache_writer"]),
    ...(allSourcePolicyRowsApproved ? [] : ["source_policy_rows_not_fully_approved"]),
    ...(monthlyFileExists ? ["scenario_monthly_returns_csv_already_exists"] : []),
    ...(providerAdapterPreflight.checks?.blockers ?? []),
    ...(approvalReadiness.readiness?.blockers ?? []),
    ...(monthlyWritePreflight.checks?.blockers ?? []),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      providerAdapterPreflight: PROVIDER_ADAPTER_PREFLIGHT_PATH,
      approvalReadiness: APPROVAL_READINESS_PATH,
      monthlyWritePreflight: MONTHLY_WRITE_PREFLIGHT_PATH,
      writerGate: WRITER_GATE_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    checks: {
      adapterReady,
      approvalReady,
      monthlyWriteReady,
      writerGateReady,
      allSourcePolicyRowsApproved,
      providerCallsAllowed,
      safeToImplementMonthlyCacheWriter,
      monthlyFileExists,
      sourcePolicyRows: writerGate.rowCounts?.totalRows ?? 0,
      approvedSourcePolicyRows: writerGate.rowCounts?.approvedRows ?? 0,
      blockers,
    },
    readiness: {
      status: safeToImplementMonthlyCacheWriter
        ? "ready_for_monthly_cache_writer_implementation_review"
        : "blocked_before_monthly_cache_writer",
      safeToImplementMonthlyCacheWriter,
      providerCallsAllowed,
      monthlyDataFileWritten: monthlyFileExists,
      bootstrapStillBlocked: true,
      nextAllowedStep: safeToImplementMonthlyCacheWriter
        ? "implement_controlled_monthly_cache_writer_after_manual_review"
        : "complete_adapter_approval_and_monthly_write_preflights_before_writer",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-monthly-cache-writer-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-monthly-cache-writer-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-monthly-cache-writer-preflight] ok");
    console.log(`[generate-scenario-p0-monthly-cache-writer-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-monthly-cache-writer-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-monthly-cache-writer-preflight] preflight=${PREFLIGHT_PATH}`);
  console.log(
    `[generate-scenario-p0-monthly-cache-writer-preflight] safeToImplementMonthlyCacheWriter=${parsed.checks.safeToImplementMonthlyCacheWriter}`,
  );
}

main();
