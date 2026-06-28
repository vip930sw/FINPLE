const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const SOURCE_POLICY_SYNC_PLAN_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_plan.json");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_preflight.json");

const PREFLIGHT_VERSION = "scenario-p0-source-policy-sync-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const APPROVED_SOURCE_POLICY = "approved_source_policy";

function fail(message) {
  throw new Error(message);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        current += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current);
  return values;
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  const normalized = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length < 2) {
    fail(`${filePath} must contain a header and at least one data row`);
  }
  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line, lineIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      fail(`${filePath}:${lineIndex + 2} has ${values.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
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
  const sourcePolicy = readCsv(SOURCE_POLICY_CSV_PATH);
  const syncPlan = readJson(SOURCE_POLICY_SYNC_PLAN_PATH);
  const approvedRows = sourcePolicy.rows.filter((row) => row.status === APPROVED_SOURCE_POLICY).length;
  const totalRows = sourcePolicy.rows.length;
  const syncPlanReady = syncPlan.readiness?.syncPlanReady === true;
  const plannedSourcePolicyUpdates = syncPlan.rowCounts?.plannedSourcePolicyUpdates ?? 0;
  const canSyncSourcePolicy = syncPlanReady && plannedSourcePolicyUpdates === totalRows;

  if (approvedRows > plannedSourcePolicyUpdates) {
    fail(`${SOURCE_POLICY_CSV_PATH} contains more approved rows than the source policy sync plan allows`);
  }
  if (approvedRows > 0 && !canSyncSourcePolicy) {
    fail(`${SOURCE_POLICY_CSV_PATH} contains approved source policy rows before sync preflight is ready`);
  }

  const blockers = [
    ...(syncPlanReady ? [] : ["source_policy_sync_plan_not_ready"]),
    ...(plannedSourcePolicyUpdates === totalRows ? [] : ["source_policy_sync_plan_not_complete"]),
    ...(approvedRows === 0 ? [] : ["source_policy_matrix_already_contains_approved_rows"]),
  ];

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      sourcePolicySyncPlan: SOURCE_POLICY_SYNC_PLAN_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
      sourcePolicyMatrixTarget: SOURCE_POLICY_CSV_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    checks: {
      totalSourcePolicyRows: totalRows,
      approvedSourcePolicyRows: approvedRows,
      plannedSourcePolicyUpdates,
      syncPlanReady,
      canSyncSourcePolicy,
      sourcePolicyMatrixWritten: approvedRows > 0,
      blockers,
    },
    readiness: {
      status: canSyncSourcePolicy ? "ready_for_manual_source_policy_sync" : "blocked_before_source_policy_sync",
      sourcePolicyMatrixWritten: approvedRows > 0,
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: canSyncSourcePolicy
        ? "manually_sync_source_policy_matrix_then_run_approval_readiness"
        : "complete_ready_approval_intake_and_sync_plan_before_source_policy_write",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-source-policy-sync-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-source-policy-sync-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-source-policy-sync-preflight] ok");
    console.log(`[generate-scenario-p0-source-policy-sync-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-source-policy-sync-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-source-policy-sync-preflight] preflight=${PREFLIGHT_PATH}`);
  console.log(`[generate-scenario-p0-source-policy-sync-preflight] canSyncSourcePolicy=${parsed.checks.canSyncSourcePolicy}`);
}

main();
