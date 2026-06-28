const fs = require("node:fs");
const path = require("node:path");

const APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template_summary.json");
const APPROVAL_INTAKE_VALIDATION_PATH = path.join("data", "processed", "scenario_p0_approval_intake_validation.json");
const SOURCE_POLICY_SYNC_PLAN_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_plan.json");
const SOURCE_POLICY_SYNC_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_preflight.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_real_approval_import_preflight.json");

const PREFLIGHT_VERSION = "scenario-p0-real-approval-import-preflight-v0.1";
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
  const templateSummary = readJson(APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH);
  const validation = readJson(APPROVAL_INTAKE_VALIDATION_PATH);
  const syncPlan = readJson(SOURCE_POLICY_SYNC_PLAN_PATH);
  const syncPreflight = readJson(SOURCE_POLICY_SYNC_PREFLIGHT_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);

  const providerGroups = validation.rowCounts?.providerGroups ?? 0;
  const templateProviderGroups = templateSummary.rowCounts?.providerGroups ?? 0;
  const readyRows = validation.rowCounts?.readyRows ?? 0;
  const pendingRows = validation.rowCounts?.pendingRows ?? 0;
  const rejectedRows = validation.rowCounts?.rejectedRows ?? 0;
  const allRowsReadyForSourcePolicyReview = validation.readiness?.allRowsReadyForSourcePolicyReview === true;
  const syncPlanReady = syncPlan.readiness?.syncPlanReady === true;
  const canSyncSourcePolicy = syncPreflight.checks?.canSyncSourcePolicy === true;
  const approvedSourcePolicyRows = syncPreflight.checks?.approvedSourcePolicyRows ?? 0;
  const plannedSourcePolicyUpdates = syncPlan.rowCounts?.plannedSourcePolicyUpdates ?? 0;
  const totalSourcePolicyRows = syncPreflight.checks?.totalSourcePolicyRows ?? 0;

  if (templateProviderGroups !== providerGroups) {
    fail(`${APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH} providerGroups does not match approval intake validation`);
  }
  if (allRowsReadyForSourcePolicyReview && readyRows !== providerGroups) {
    fail(`${APPROVAL_INTAKE_VALIDATION_PATH} reports ready but readyRows does not match providerGroups`);
  }
  if (syncPlanReady && !allRowsReadyForSourcePolicyReview) {
    fail(`${SOURCE_POLICY_SYNC_PLAN_PATH} is ready before approval intake validation is fully ready`);
  }
  if (canSyncSourcePolicy && !syncPlanReady) {
    fail(`${SOURCE_POLICY_SYNC_PREFLIGHT_PATH} can sync before source policy sync plan is ready`);
  }
  if (monthlyFileExists) {
    fail(`${MONTHLY_DATA_PATH} exists before real approval import preflight has completed`);
  }

  const readyForRealApprovalImport =
    providerGroups === 5 &&
    readyRows === providerGroups &&
    allRowsReadyForSourcePolicyReview &&
    syncPlanReady &&
    canSyncSourcePolicy &&
    plannedSourcePolicyUpdates === totalSourcePolicyRows &&
    approvedSourcePolicyRows === 0 &&
    !monthlyFileExists;
  const blockers = unique([
    ...(providerGroups === 5 ? [] : ["approval_intake_validation_provider_group_count_mismatch"]),
    ...(readyRows === providerGroups ? [] : ["approval_intake_not_fully_ready"]),
    ...(pendingRows === 0 ? [] : ["approval_intake_has_pending_rows"]),
    ...(rejectedRows === 0 ? [] : ["approval_intake_has_rejected_rows"]),
    ...(allRowsReadyForSourcePolicyReview ? [] : ["approval_intake_validation_not_ready"]),
    ...(syncPlanReady ? [] : ["source_policy_sync_plan_not_ready"]),
    ...(canSyncSourcePolicy ? [] : ["source_policy_sync_preflight_not_ready"]),
    ...(plannedSourcePolicyUpdates === totalSourcePolicyRows ? [] : ["source_policy_sync_plan_not_complete"]),
    ...(approvedSourcePolicyRows === 0 ? [] : ["source_policy_matrix_already_contains_approved_rows"]),
    ...(monthlyFileExists ? ["scenario_monthly_returns_csv_written_before_approval_import"] : []),
    ...(validation.providerGroups ?? []).flatMap((row) => row.blockers ?? []),
    ...(syncPlan.providerGroups ?? []).flatMap((row) => row.blockers ?? []),
    ...(syncPreflight.checks?.blockers ?? []),
  ]);

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplateSummary: APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH,
      approvalIntakeValidation: APPROVAL_INTAKE_VALIDATION_PATH,
      sourcePolicySyncPlan: SOURCE_POLICY_SYNC_PLAN_PATH,
      sourcePolicySyncPreflight: SOURCE_POLICY_SYNC_PREFLIGHT_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
    },
    checks: {
      providerGroups,
      readyRows,
      pendingRows,
      rejectedRows,
      allRowsReadyForSourcePolicyReview,
      syncPlanReady,
      canSyncSourcePolicy,
      plannedSourcePolicyUpdates,
      totalSourcePolicyRows,
      approvedSourcePolicyRows,
      monthlyFileExists,
      readyForRealApprovalImport,
      blockers,
    },
    readiness: {
      status: readyForRealApprovalImport ? "ready_for_manual_real_approval_import_review" : "blocked_before_real_approval_import",
      safeToImportRealApprovalDecisions: readyForRealApprovalImport,
      sourcePolicyMatrixWriteAllowed: readyForRealApprovalImport,
      providerCallsAllowed: false,
      safeToImplementProviderAdapter: false,
      safeToWriteMonthlyData: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: readyForRealApprovalImport
        ? "manually_import_real_approval_decisions_then_rerun_source_policy_and_approval_readiness"
        : "complete_real_approval_intake_validation_before_source_policy_import",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-real-approval-import-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-real-approval-import-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-real-approval-import-preflight] ok");
    console.log(`[generate-scenario-p0-real-approval-import-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-real-approval-import-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-real-approval-import-preflight] preflight=${PREFLIGHT_PATH}`);
  console.log(`[generate-scenario-p0-real-approval-import-preflight] readyForRealApprovalImport=${parsed.checks.readyForRealApprovalImport}`);
}

main();
