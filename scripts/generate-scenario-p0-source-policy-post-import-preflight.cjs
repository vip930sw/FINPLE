const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const REAL_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_real_approval_import_preflight.json");
const SOURCE_POLICY_SYNC_PLAN_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_plan.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_source_policy_post_import_preflight.json");

const PREFLIGHT_VERSION = "scenario-p0-source-policy-post-import-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const APPROVED_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: "approved_source_policy",
  blocker: "",
};

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

function unique(values) {
  return [...new Set(values)];
}

function isApprovedRow(row) {
  return row.status === APPROVED_RULES.status;
}

function approvedRowPolicyBlockers(row) {
  return Object.entries(APPROVED_RULES)
    .filter(([field, expected]) => (row[field] ?? "") !== expected)
    .map(([field]) => `approved_row_${field}_mismatch`);
}

function buildPreflight() {
  const sourcePolicy = readCsv(SOURCE_POLICY_CSV_PATH);
  const importPreflight = readJson(REAL_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const syncPlan = readJson(SOURCE_POLICY_SYNC_PLAN_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);

  const totalRows = sourcePolicy.rows.length;
  const approvedRows = sourcePolicy.rows.filter(isApprovedRow);
  const approvedSourcePolicyRows = approvedRows.length;
  const blockedSourcePolicyRows = totalRows - approvedSourcePolicyRows;
  const plannedSourcePolicyUpdates = syncPlan.rowCounts?.plannedSourcePolicyUpdates ?? 0;
  const readyProviderGroups = syncPlan.rowCounts?.readyProviderGroups ?? 0;
  const realApprovalImportReady =
    importPreflight.checks?.readyForRealApprovalImport === true &&
    importPreflight.readiness?.safeToImportRealApprovalDecisions === true &&
    importPreflight.readiness?.sourcePolicyMatrixWriteAllowed === true;
  const allSourcePolicyRowsApproved = totalRows === 17 && approvedSourcePolicyRows === totalRows;
  const approvedRowsMatchPlan = approvedSourcePolicyRows === plannedSourcePolicyUpdates && plannedSourcePolicyUpdates === totalRows;
  const approvedRowBlockers = unique(approvedRows.flatMap(approvedRowPolicyBlockers));

  if (monthlyFileExists) {
    fail(`${MONTHLY_DATA_PATH} exists before source-policy post-import preflight has completed`);
  }
  if (approvedSourcePolicyRows > 0 && !realApprovalImportReady) {
    fail(`${SOURCE_POLICY_CSV_PATH} contains approved rows before real approval import preflight is ready`);
  }
  if (approvedSourcePolicyRows > plannedSourcePolicyUpdates) {
    fail(`${SOURCE_POLICY_CSV_PATH} contains more approved rows than the source-policy sync plan allows`);
  }
  if (approvedRowBlockers.length > 0) {
    fail(`${SOURCE_POLICY_CSV_PATH} contains approved rows with policy drift: ${approvedRowBlockers.join("|")}`);
  }

  const safeToUseImportedSourcePolicy =
    realApprovalImportReady &&
    readyProviderGroups === 5 &&
    allSourcePolicyRowsApproved &&
    approvedRowsMatchPlan &&
    approvedRowBlockers.length === 0 &&
    !monthlyFileExists;
  const blockers = unique([
    ...(realApprovalImportReady ? [] : ["real_approval_import_preflight_not_ready"]),
    ...(readyProviderGroups === 5 ? [] : ["source_policy_sync_plan_provider_groups_not_ready"]),
    ...(allSourcePolicyRowsApproved ? [] : ["source_policy_rows_not_fully_approved"]),
    ...(approvedRowsMatchPlan ? [] : ["approved_source_policy_rows_do_not_match_sync_plan"]),
    ...(monthlyFileExists ? ["scenario_monthly_returns_csv_written_before_source_policy_post_import"] : []),
    ...(importPreflight.checks?.blockers ?? []),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      realApprovalImportPreflight: REAL_APPROVAL_IMPORT_PREFLIGHT_PATH,
      sourcePolicySyncPlan: SOURCE_POLICY_SYNC_PLAN_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
    },
    checks: {
      totalSourcePolicyRows: totalRows,
      approvedSourcePolicyRows,
      blockedSourcePolicyRows,
      plannedSourcePolicyUpdates,
      readyProviderGroups,
      realApprovalImportReady,
      allSourcePolicyRowsApproved,
      approvedRowsMatchPlan,
      monthlyFileExists,
      safeToUseImportedSourcePolicy,
      blockers,
    },
    readiness: {
      status: safeToUseImportedSourcePolicy
        ? "ready_for_approval_readiness_recalculation_after_source_policy_import"
        : "blocked_before_source_policy_post_import_validation",
      safeToUseImportedSourcePolicy,
      providerCallsAllowed: false,
      safeToImplementProviderAdapter: false,
      safeToWriteMonthlyData: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: safeToUseImportedSourcePolicy
        ? "rerun_approval_readiness_and_writer_gate_after_manual_source_policy_import"
        : "complete_real_approval_import_and_source_policy_matrix_sync",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-source-policy-post-import-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-source-policy-post-import-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-source-policy-post-import-preflight] ok");
    console.log(`[generate-scenario-p0-source-policy-post-import-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-source-policy-post-import-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-source-policy-post-import-preflight] preflight=${PREFLIGHT_PATH}`);
  console.log(`[generate-scenario-p0-source-policy-post-import-preflight] safeToUseImportedSourcePolicy=${parsed.checks.safeToUseImportedSourcePolicy}`);
}

main();
