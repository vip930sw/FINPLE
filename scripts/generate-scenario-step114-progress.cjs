const fs = require("node:fs");
const path = require("node:path");

const COVERAGE_CSV_PATH = path.join("data", "processed", "scenario_data_coverage.csv");
const MONTHLY_READINESS_PATH = path.join("data", "processed", "scenario_monthly_input_readiness.json");
const REFECTH_PLAN_SUMMARY_PATH = path.join("data", "processed", "scenario_monthly_refetch_plan_summary.json");
const P0_MANIFEST_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_manifest_summary.json");
const P0_DRY_RUN_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_dry_run.json");
const SOURCE_REQUIREMENTS_PATH = path.join("data", "processed", "scenario_p0_source_approval_requirements.json");
const SOURCE_DECISION_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_source_approval_decision_record_summary.json");
const PROVIDER_REVIEW_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_provider_candidate_review_summary.json");
const EXTERNAL_TERMS_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_external_provider_terms_review_summary.json");
const OWNER_LEGAL_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_owner_legal_decision_packet_summary.json");
const APPROVAL_INTAKE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_checklist.json");
const APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template_summary.json");
const APPROVAL_INTAKE_VALIDATION_PATH = path.join("data", "processed", "scenario_p0_approval_intake_validation.json");
const REAL_APPROVAL_IMPORT_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_real_approval_import_preflight.json");
const SOURCE_POLICY_POST_IMPORT_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_source_policy_post_import_preflight.json");
const SOURCE_POLICY_SYNC_PLAN_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_plan.json");
const SOURCE_POLICY_SYNC_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_preflight.json");
const PROVIDER_ADAPTER_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_provider_adapter_preflight.json");
const MONTHLY_CACHE_WRITER_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_monthly_cache_writer_preflight.json");
const APPROVAL_READINESS_PATH = path.join("data", "processed", "scenario_p0_approval_readiness.json");
const WRITE_PREFLIGHT_PATH = path.join("data", "processed", "scenario_monthly_write_preflight.json");
const WRITER_GATE_PATH = path.join("data", "processed", "scenario_p0_cache_writer_gate.json");
const BOOTSTRAP_UNLOCK_PREFLIGHT_PATH = path.join("data", "processed", "scenario_bootstrap_unlock_preflight.json");
const RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH = path.join("data", "processed", "scenario_runtime_implementation_preflight.json");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PROGRESS_PATH = path.join("data", "processed", "scenario_step114_progress.json");

const REPORT_VERSION = "scenario-step114-progress-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";

const WEIGHTS = {
  coverageAudit: 20,
  monthlyInputContract: 15,
  p0CollectionPlan: 15,
  governancePackets: 15,
  guardrailHarness: 15,
  realApprovalDecisions: 10,
  monthlyDataWriteAndBootstrap: 10,
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

function countBy(rows, field) {
  const counts = {};
  for (const row of rows) {
    const key = row[field] || "(blank)";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function percent(numerator, denominator) {
  if (!denominator) {
    return 0;
  }
  return Math.round((numerator / denominator) * 100);
}

function milestone(id, label, weight, progressPercent, status, evidence, blockers = []) {
  const normalizedProgress = Math.max(0, Math.min(100, progressPercent));
  return {
    id,
    label,
    weight,
    progressPercent: normalizedProgress,
    weightedPoints: Math.round((weight * normalizedProgress) / 100),
    status,
    evidence,
    blockers,
  };
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildProgress() {
  const coverage = readCsv(COVERAGE_CSV_PATH);
  const monthlyReadiness = readJson(MONTHLY_READINESS_PATH);
  const refetchPlan = readJson(REFECTH_PLAN_SUMMARY_PATH);
  const p0Manifest = readJson(P0_MANIFEST_SUMMARY_PATH);
  const p0DryRun = readJson(P0_DRY_RUN_PATH);
  const sourceRequirements = readJson(SOURCE_REQUIREMENTS_PATH);
  const sourceDecision = readJson(SOURCE_DECISION_SUMMARY_PATH);
  const providerReview = readJson(PROVIDER_REVIEW_SUMMARY_PATH);
  const externalTerms = readJson(EXTERNAL_TERMS_SUMMARY_PATH);
  const ownerLegal = readJson(OWNER_LEGAL_SUMMARY_PATH);
  const approvalIntake = readJson(APPROVAL_INTAKE_PATH);
  const approvalIntakeTemplate = readJson(APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH);
  const approvalIntakeValidation = readJson(APPROVAL_INTAKE_VALIDATION_PATH);
  const realApprovalImportPreflight = readJson(REAL_APPROVAL_IMPORT_PREFLIGHT_PATH);
  const sourcePolicyPostImportPreflight = readJson(SOURCE_POLICY_POST_IMPORT_PREFLIGHT_PATH);
  const sourcePolicySyncPlan = readJson(SOURCE_POLICY_SYNC_PLAN_PATH);
  const sourcePolicySyncPreflight = readJson(SOURCE_POLICY_SYNC_PREFLIGHT_PATH);
  const providerAdapterPreflight = readJson(PROVIDER_ADAPTER_PREFLIGHT_PATH);
  const monthlyCacheWriterPreflight = readJson(MONTHLY_CACHE_WRITER_PREFLIGHT_PATH);
  const approvalReadiness = readJson(APPROVAL_READINESS_PATH);
  const writePreflight = readJson(WRITE_PREFLIGHT_PATH);
  const writerGate = readJson(WRITER_GATE_PATH);
  const bootstrapUnlockPreflight = readJson(BOOTSTRAP_UNLOCK_PREFLIGHT_PATH);
  const runtimeImplementationPreflight = readJson(RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);

  const gradeCounts = countBy(coverage.rows, "scenarioGrade");
  const coverageComplete =
    coverage.rows.length === 6000 && (gradeCounts.A ?? 0) === 0 && gradeCounts.B === 5757 && gradeCounts.C === 243;
  const monthlyContractComplete =
    monthlyReadiness.readiness?.readyForJointBlockBootstrap === false &&
    monthlyReadiness.monthlyInput?.status === "blocked_missing_monthly_return_file";
  const p0CollectionComplete =
    refetchPlan.rowCounts?.totalPlanRows === 6003 &&
    p0Manifest.rowCounts?.totalRows === 17 &&
    p0DryRun.rowCounts?.totalTasks === 17 &&
    p0DryRun.readiness?.providerCallsMade === false;
  const governancePacketsComplete =
    sourceRequirements.rowCounts?.providerGroups === 5 &&
    sourceDecision.rowCounts?.providerGroups === 5 &&
    providerReview.rowCounts?.providerGroups === 5 &&
    externalTerms.rowCounts?.providerCandidates === 5 &&
    ownerLegal.rowCounts?.providerCandidates === 5 &&
    approvalIntake.rowCounts?.providerGroups === 5 &&
    approvalIntakeTemplate.rowCounts?.providerGroups === 5 &&
    approvalIntakeTemplate.rowCounts?.approvedRows === 0 &&
    approvalIntakeValidation.rowCounts?.providerGroups === 5 &&
    sourcePolicySyncPlan.rowCounts?.providerGroups === 5 &&
    sourcePolicySyncPreflight.checks?.totalSourcePolicyRows === 17 &&
    providerAdapterPreflight.checks?.sourcePolicyRows === 17 &&
    monthlyCacheWriterPreflight.checks?.sourcePolicyRows === 17;
  const guardrailHarnessComplete =
    approvalIntakeValidation.readiness?.providerCallsAllowed === false &&
    realApprovalImportPreflight.readiness?.safeToWriteMonthlyData === false &&
    sourcePolicyPostImportPreflight.readiness?.safeToUseImportedSourcePolicy === false &&
    sourcePolicyPostImportPreflight.readiness?.safeToWriteMonthlyData === false &&
    sourcePolicySyncPlan.readiness?.providerCallsAllowed === false &&
    sourcePolicySyncPlan.readiness?.sourcePolicyMatrixWritten === false &&
    sourcePolicySyncPreflight.readiness?.providerCallsAllowed === false &&
    sourcePolicySyncPreflight.readiness?.sourcePolicyMatrixWritten === false &&
    providerAdapterPreflight.readiness?.providerCallsAllowed === false &&
    providerAdapterPreflight.readiness?.safeToImplementProviderAdapter === false &&
    monthlyCacheWriterPreflight.readiness?.providerCallsAllowed === false &&
    monthlyCacheWriterPreflight.readiness?.safeToImplementMonthlyCacheWriter === false &&
    approvalReadiness.sourceFiles?.sourceApprovalDecisionRecord &&
    approvalReadiness.readiness?.safeToImplementProviderAdapter === false &&
    writePreflight.checks?.monthlyFileExists === false &&
    writePreflight.checks?.canAttemptMonthlyWrite === false &&
    writerGate.readiness?.canWriteMonthlyData === false &&
    bootstrapUnlockPreflight.readiness?.safeToRunJointBlockBootstrap === false &&
    runtimeImplementationPreflight.readiness?.runtimeScenarioImplementationAllowed === false &&
    runtimeImplementationPreflight.readiness?.safeToModifyCalculatePortfolioResult === false;

  const approvalCounts = approvalReadiness.rowCounts ?? {};
  const approvalProgress = approvalIntake.completion?.intakeCompletionPercent ?? 0;

  const monthlyWriteProgress =
    monthlyFileExists && writePreflight.checks?.canAttemptMonthlyWrite === true && writePreflight.readiness?.bootstrapStillBlocked === false
      ? 100
      : 0;

  const milestones = [
    milestone(
      "coverage_audit",
      "Scenario inventory, coverage CSV, and metric input audit",
      WEIGHTS.coverageAudit,
      coverageComplete ? 100 : 0,
      coverageComplete ? "complete" : "blocked",
      {
        coverageRows: coverage.rows.length,
        gradeCounts,
      },
    ),
    milestone(
      "monthly_input_contract",
      "Monthly input schema, validator, readiness report, and no-zero-fill rules",
      WEIGHTS.monthlyInputContract,
      monthlyContractComplete ? 100 : 0,
      monthlyContractComplete ? "complete" : "blocked",
      {
        monthlyInput: monthlyReadiness.monthlyInput?.status,
        readyForJointBlockBootstrap: monthlyReadiness.readiness?.readyForJointBlockBootstrap,
      },
    ),
    milestone(
      "p0_collection_plan",
      "P0 refetch plan, cache manifest, and dry-run provider task contract",
      WEIGHTS.p0CollectionPlan,
      p0CollectionComplete ? 100 : 0,
      p0CollectionComplete ? "complete" : "blocked",
      {
        refetchPlanRows: refetchPlan.rowCounts?.totalPlanRows,
        manifestRows: p0Manifest.rowCounts?.totalRows,
        dryRunTasks: p0DryRun.rowCounts?.totalTasks,
        providerCallsMade: p0DryRun.readiness?.providerCallsMade,
      },
    ),
    milestone(
      "governance_packets",
      "Source requirements, decision record, provider review, external terms, and owner/legal packets",
      WEIGHTS.governancePackets,
      governancePacketsComplete ? 100 : 0,
      governancePacketsComplete ? "complete" : "blocked",
      {
        providerGroups: sourceRequirements.rowCounts?.providerGroups,
        decisionRows: sourceDecision.rowCounts?.providerGroups,
        providerCandidates: externalTerms.rowCounts?.providerCandidates,
        approvalIntakeProviderGroups: approvalIntake.rowCounts?.providerGroups,
        approvalIntakeTemplateRows: approvalIntakeTemplate.rowCounts?.providerGroups,
        approvalIntakeValidationReadyRows: approvalIntakeValidation.rowCounts?.readyRows,
        sourcePolicySyncPlannedUpdates: sourcePolicySyncPlan.rowCounts?.plannedSourcePolicyUpdates,
        sourcePolicySyncPreflightCanSync: sourcePolicySyncPreflight.checks?.canSyncSourcePolicy,
        providerAdapterPreflightSafe: providerAdapterPreflight.checks?.safeToImplementProviderAdapter,
        monthlyCacheWriterPreflightSafe: monthlyCacheWriterPreflight.checks?.safeToImplementMonthlyCacheWriter,
      },
    ),
    milestone(
      "guardrail_harness",
      "Approval readiness, synthetic approval harness, monthly write preflight, and writer gate",
      WEIGHTS.guardrailHarness,
      guardrailHarnessComplete ? 100 : 0,
      guardrailHarnessComplete ? "complete" : "blocked",
      {
        safeToImplementProviderAdapter: approvalReadiness.readiness?.safeToImplementProviderAdapter,
        safeToWriteMonthlyData: approvalReadiness.readiness?.safeToWriteMonthlyData,
        approvalIntakeValidationProviderCallsAllowed: approvalIntakeValidation.readiness?.providerCallsAllowed,
        realApprovalImportPreflightSafe: realApprovalImportPreflight.checks?.readyForRealApprovalImport,
        sourcePolicyPostImportPreflightSafe: sourcePolicyPostImportPreflight.checks?.safeToUseImportedSourcePolicy,
        sourcePolicySyncPlanProviderCallsAllowed: sourcePolicySyncPlan.readiness?.providerCallsAllowed,
        sourcePolicyMatrixWritten: sourcePolicySyncPlan.readiness?.sourcePolicyMatrixWritten,
        sourcePolicySyncPreflightProviderCallsAllowed: sourcePolicySyncPreflight.readiness?.providerCallsAllowed,
        sourcePolicySyncPreflightCanSync: sourcePolicySyncPreflight.checks?.canSyncSourcePolicy,
        providerAdapterPreflightSafe: providerAdapterPreflight.checks?.safeToImplementProviderAdapter,
        providerAdapterPreflightProviderCallsAllowed: providerAdapterPreflight.checks?.providerCallsAllowed,
        monthlyCacheWriterPreflightSafe: monthlyCacheWriterPreflight.checks?.safeToImplementMonthlyCacheWriter,
        monthlyCacheWriterPreflightProviderCallsAllowed: monthlyCacheWriterPreflight.checks?.providerCallsAllowed,
        canAttemptMonthlyWrite: writePreflight.checks?.canAttemptMonthlyWrite,
        writerCanWriteMonthlyData: writerGate.readiness?.canWriteMonthlyData,
        bootstrapUnlockPreflightSafe: bootstrapUnlockPreflight.checks?.safeToRunJointBlockBootstrap,
        runtimeScenarioImplementationAllowed: runtimeImplementationPreflight.checks?.runtimeScenarioImplementationAllowed,
      },
    ),
    milestone(
      "real_approval_decisions",
      "Real owner/legal/source approvals for P0 provider groups",
      WEIGHTS.realApprovalDecisions,
      approvalProgress,
      approvalProgress === 100 ? "complete" : "blocked",
      {
        termsApproved: approvalCounts.termsApproved ?? 0,
        ownerAdapterApproved: approvalCounts.ownerAdapterApproved ?? 0,
        ownerMonthlyApproved: approvalCounts.ownerMonthlyApproved ?? 0,
        sourcePolicyApproved: approvalCounts.sourcePolicyApproved ?? 0,
        readyProviderGroups: approvalIntake.rowCounts?.readyProviderGroups ?? 0,
        completedApprovalSlots: approvalIntake.rowCounts?.completedApprovalSlots ?? 0,
        totalApprovalSlots: approvalIntake.rowCounts?.totalApprovalSlots ?? 0,
      },
      [
        ...(approvalReadiness.readiness?.blockers ?? []),
        ...(approvalIntake.rowCounts?.readyProviderGroups === approvalIntake.rowCounts?.providerGroups
          ? []
          : ["approval_intake_provider_groups_not_ready"]),
      ],
    ),
    milestone(
      "monthly_data_write_and_bootstrap",
      "Validated scenario_monthly_returns.csv and Bootstrap unlock",
      WEIGHTS.monthlyDataWriteAndBootstrap,
      monthlyWriteProgress,
      monthlyWriteProgress === 100 ? "complete" : "blocked",
      {
        monthlyFileExists,
        canAttemptMonthlyWrite: writePreflight.checks?.canAttemptMonthlyWrite,
        bootstrapUnlockPreflightSafe: bootstrapUnlockPreflight.checks?.safeToRunJointBlockBootstrap,
        bootstrapStillBlocked: writePreflight.readiness?.bootstrapStillBlocked,
      },
      monthlyFileExists ? [] : ["scenario_monthly_returns_csv_not_written"],
    ),
  ];

  const totalWeight = milestones.reduce((sum, item) => sum + item.weight, 0);
  const completedWeightedPoints = milestones.reduce((sum, item) => sum + item.weightedPoints, 0);
  const overallProgressPercent = percent(completedWeightedPoints, totalWeight);

  return stableJson({
    reportVersion: REPORT_VERSION,
    auditedAt: AUDITED_AT,
    issue: "#221",
    step: "Step 114 P0 scenario monthly data readiness",
    sourceFiles: {
      coverageCsv: COVERAGE_CSV_PATH,
      monthlyReadiness: MONTHLY_READINESS_PATH,
      approvalIntakeChecklist: APPROVAL_INTAKE_PATH,
      approvalIntakeTemplate: APPROVAL_INTAKE_TEMPLATE_SUMMARY_PATH,
      approvalIntakeValidation: APPROVAL_INTAKE_VALIDATION_PATH,
      realApprovalImportPreflight: REAL_APPROVAL_IMPORT_PREFLIGHT_PATH,
      sourcePolicyPostImportPreflight: SOURCE_POLICY_POST_IMPORT_PREFLIGHT_PATH,
      sourcePolicySyncPlan: SOURCE_POLICY_SYNC_PLAN_PATH,
      sourcePolicySyncPreflight: SOURCE_POLICY_SYNC_PREFLIGHT_PATH,
      providerAdapterPreflight: PROVIDER_ADAPTER_PREFLIGHT_PATH,
      monthlyCacheWriterPreflight: MONTHLY_CACHE_WRITER_PREFLIGHT_PATH,
      approvalReadiness: APPROVAL_READINESS_PATH,
      monthlyWritePreflight: WRITE_PREFLIGHT_PATH,
      writerGate: WRITER_GATE_PATH,
      bootstrapUnlockPreflight: BOOTSTRAP_UNLOCK_PREFLIGHT_PATH,
      runtimeImplementationPreflight: RUNTIME_IMPLEMENTATION_PREFLIGHT_PATH,
    },
    outputFiles: {
      progress: PROGRESS_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    overallProgressPercent,
    completedWeightedPoints,
    totalWeight,
    status: overallProgressPercent === 100 ? "complete" : "blocked_before_real_approvals_and_monthly_data",
    progressNotes: {
      auditAndGovernanceFrameworkPercent: 100,
      realApprovalDecisionsPercent: approvalProgress,
      monthlyDataAndBootstrapPercent: monthlyWriteProgress,
      runtimeScenarioImplementationPercent: 0,
    },
    milestones,
    guardrails: {
      providerCallsAllowed: approvalReadiness.readiness?.providerCallsAllowed === true,
      safeToImplementProviderAdapter: approvalReadiness.readiness?.safeToImplementProviderAdapter === true,
      safeToWriteMonthlyData: approvalReadiness.readiness?.safeToWriteMonthlyData === true,
      approvalIntakeValidationReady: approvalIntakeValidation.readiness?.allRowsReadyForSourcePolicyReview === true,
      realApprovalImportPreflightReady: realApprovalImportPreflight.checks?.readyForRealApprovalImport === true,
      sourcePolicyPostImportPreflightReady: sourcePolicyPostImportPreflight.checks?.safeToUseImportedSourcePolicy === true,
      sourcePolicySyncPlanReady: sourcePolicySyncPlan.readiness?.syncPlanReady === true,
      sourcePolicySyncPreflightReady: sourcePolicySyncPreflight.checks?.canSyncSourcePolicy === true,
      providerAdapterPreflightReady: providerAdapterPreflight.checks?.safeToImplementProviderAdapter === true,
      monthlyCacheWriterPreflightReady: monthlyCacheWriterPreflight.checks?.safeToImplementMonthlyCacheWriter === true,
      bootstrapUnlockPreflightReady: bootstrapUnlockPreflight.checks?.safeToRunJointBlockBootstrap === true,
      runtimeImplementationPreflightReady: runtimeImplementationPreflight.checks?.runtimeScenarioImplementationAllowed === true,
      sourcePolicyMatrixWritten: sourcePolicySyncPlan.readiness?.sourcePolicyMatrixWritten === true,
      monthlyDataFileWritten: monthlyFileExists,
      bootstrapStillBlocked: writePreflight.readiness?.bootstrapStillBlocked !== false,
    },
    nextAllowedStep:
      approvalProgress === 100
        ? "run_monthly_write_preflight_before_controlled_cache_writer"
        : "record_real_owner_legal_terms_and_source_policy_approvals_before_adapter_or_write",
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const progress = buildProgress();

  if (checkOnly) {
    if (!fs.existsSync(PROGRESS_PATH)) {
      fail(`${PROGRESS_PATH} not found; run node scripts/generate-scenario-step114-progress.cjs`);
    }
    const current = fs.readFileSync(PROGRESS_PATH, "utf8");
    if (current !== progress) {
      fail(`${PROGRESS_PATH} is out of date; run node scripts/generate-scenario-step114-progress.cjs`);
    }
    console.log("[generate-scenario-step114-progress] ok");
    console.log(`[generate-scenario-step114-progress] progress=${PROGRESS_PATH}`);
    return;
  }

  fs.writeFileSync(PROGRESS_PATH, progress);
  const parsed = JSON.parse(progress);
  console.log("[generate-scenario-step114-progress] wrote progress");
  console.log(`[generate-scenario-step114-progress] progress=${PROGRESS_PATH}`);
  console.log(`[generate-scenario-step114-progress] overallProgressPercent=${parsed.overallProgressPercent}`);
}

main();
