const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_SYNC_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_preflight.json");
const APPROVAL_READINESS_PATH = path.join("data", "processed", "scenario_p0_approval_readiness.json");
const WRITER_GATE_PATH = path.join("data", "processed", "scenario_p0_cache_writer_gate.json");
const ADAPTER_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_provider_adapter_preflight.json");

const PREFLIGHT_VERSION = "scenario-p0-provider-adapter-preflight-v0.1";
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
  const sourcePolicySyncPreflight = readJson(SOURCE_POLICY_SYNC_PREFLIGHT_PATH);
  const approvalReadiness = readJson(APPROVAL_READINESS_PATH);
  const writerGate = readJson(WRITER_GATE_PATH);

  const sourcePolicySyncReady = sourcePolicySyncPreflight.checks?.canSyncSourcePolicy === true;
  const sourcePolicyMatrixWritten = sourcePolicySyncPreflight.readiness?.sourcePolicyMatrixWritten === true;
  const approvalReady = approvalReadiness.readiness?.safeToImplementProviderAdapter === true;
  const writerGateReady = writerGate.readiness?.providerCallsAllowed === true && writerGate.readiness?.canWriteMonthlyData === true;
  const allSourcePolicyRowsApproved = writerGate.rowCounts?.approvedRows === writerGate.rowCounts?.totalRows;
  const providerCallsAllowed =
    sourcePolicySyncReady && sourcePolicyMatrixWritten && approvalReady && writerGateReady && allSourcePolicyRowsApproved;
  const safeToImplementProviderAdapter = providerCallsAllowed;

  const blockers = unique([
    ...(sourcePolicySyncReady ? [] : ["source_policy_sync_preflight_not_ready"]),
    ...(sourcePolicyMatrixWritten ? [] : ["source_policy_matrix_not_synced"]),
    ...(approvalReady ? [] : ["approval_readiness_not_safe_for_adapter"]),
    ...(writerGateReady ? [] : ["writer_gate_not_open_for_provider_calls"]),
    ...(allSourcePolicyRowsApproved ? [] : ["source_policy_rows_not_fully_approved"]),
    ...(approvalReadiness.readiness?.blockers ?? []),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicySyncPreflight: SOURCE_POLICY_SYNC_PREFLIGHT_PATH,
      approvalReadiness: APPROVAL_READINESS_PATH,
      writerGate: WRITER_GATE_PATH,
    },
    outputFiles: {
      preflight: ADAPTER_PREFLIGHT_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    checks: {
      sourcePolicySyncReady,
      sourcePolicyMatrixWritten,
      approvalReady,
      writerGateReady,
      allSourcePolicyRowsApproved,
      providerCallsAllowed,
      safeToImplementProviderAdapter,
      sourcePolicyRows: writerGate.rowCounts?.totalRows ?? 0,
      approvedSourcePolicyRows: writerGate.rowCounts?.approvedRows ?? 0,
      blockers,
    },
    readiness: {
      status: safeToImplementProviderAdapter ? "ready_for_provider_adapter_implementation_review" : "blocked_before_provider_adapter",
      safeToImplementProviderAdapter,
      providerCallsAllowed,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: safeToImplementProviderAdapter
        ? "implement_controlled_provider_adapter_after_manual_review"
        : "complete_source_policy_sync_and_approval_readiness_before_adapter",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(ADAPTER_PREFLIGHT_PATH)) {
      fail(`${ADAPTER_PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-provider-adapter-preflight.cjs`);
    }
    const current = fs.readFileSync(ADAPTER_PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${ADAPTER_PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-provider-adapter-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-provider-adapter-preflight] ok");
    console.log(`[generate-scenario-p0-provider-adapter-preflight] preflight=${ADAPTER_PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(ADAPTER_PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-provider-adapter-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-provider-adapter-preflight] preflight=${ADAPTER_PREFLIGHT_PATH}`);
  console.log(`[generate-scenario-p0-provider-adapter-preflight] safeToImplementProviderAdapter=${parsed.checks.safeToImplementProviderAdapter}`);
}

main();
