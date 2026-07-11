import { TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS } from "./tradingMockHistoryBrowser.js";
import { STEP189_MOCK_TRADING_HISTORY_COMPARE_FLAGS, buildMockHistoryCompare } from "./tradingMockHistoryCompare.js";

export const STEP190_MOCK_STRATEGY_RESTORE_CANDIDATE_FLAGS = Object.freeze({
  ...STEP189_MOCK_TRADING_HISTORY_COMPARE_FLAGS,
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  dbWriteAllowed: false,
  dbReadAllowed: false,
  supabaseMutationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

export const TRADING_LAB_MOCK_STRATEGY_RESTORE_CANDIDATE_MODEL = Object.freeze({
  restoreCandidateId: "string",
  sourceRunId: "mock_run_id",
  sourceStrategyPresetId: "mock_strategy_preset_id",
  sourceStrategyVersionId: "mock_strategy_version_id",
  sourceStrategyName: "string",
  sourceStrategyVersion: "string",
  restoreEligibility: "eligible | eligible_with_warning | blocked",
  restorationStatus: "candidate_only | blocked | validation_required",
  targetDraftId: "placeholder_only",
  targetDraftLabel: "string",
  copiedFields: "redacted_copied_strategy_input_field[]",
  excludedFields: "redacted_excluded_result_or_private_field[]",
  transformedFields: "redacted_transformed_field[]",
  validationWarnings: "string[]",
  validationBlockers: "string[]",
  sourceCalculationVersion: "string",
  redacted: true,
  immutableSourceConfirmed: true,
  dbReadStatus: "blocked",
  dbWriteStatus: "blocked",
  supabaseMutationStatus: "blocked",
  providerCallStatus: "blocked",
  orderSubmissionStatus: "blocked",
  nextStep: "strategy_draft_editor_candidate",
});

const RESTORE_ELIGIBLE_STATUSES = new Set(["completed", "archived"]);
const CURRENT_CALCULATION_VERSION = "mock_calc_v3";

const EXCLUDED_FIELD_LABELS = Object.freeze([
  "original preset identifier is kept only as lineage",
  "original version identifier is kept only as lineage",
  "mock run identifier is kept only as lineage",
  "mock order summary excluded",
  "mock fill summary excluded",
  "mock ledger snapshot excluded",
  "mock performance snapshot excluded",
  "mock allocation result snapshot excluded",
  "mock risk result snapshot excluded",
  "warning and blocker history excluded",
  "original timestamps excluded",
  "live account data excluded",
  "provider and KIS field excluded",
  "credential and token excluded",
  "live execution reference excluded",
]);

function slugify(value) {
  return String(value || "mock-strategy")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "mock-strategy";
}

function deriveAssetUniverse(record) {
  const text = `${record?.strategyName || ""} ${record?.allocationSummary || ""}`.toLowerCase();
  if (text.includes("cash defense")) return ["CASH", "SCHD", "QQQ"];
  if (text.includes("income") || text.includes("dividend")) return ["SCHD", "QQQ", "CASH", "BND"];
  if (text.includes("low volatility")) return ["USMV", "SCHD", "BND", "CASH"];
  if (text.includes("tech")) return ["QQQ", "XLK", "CASH", "BND"];
  return ["QQQ", "SCHD", "BND", "CASH"];
}

function deriveTargetAllocations(record) {
  const universe = deriveAssetUniverse(record);
  const weights = universe.length === 3
    ? [35, 35, 30]
    : universe.length === 4
      ? [35, 30, 25, 10]
      : [25, 25, 25, 15, 10];
  return universe.map((symbol, index) => ({
    symbol,
    targetWeight: weights[index] || 0,
    status: "draft_candidate",
    redacted: true,
  }));
}

function targetWeightTotal(allocations) {
  return allocations.reduce((sum, allocation) => sum + Number(allocation.targetWeight || 0), 0);
}

function sourceStrategyVersionId(record) {
  if (!record?.strategyPresetId || !record?.strategyVersion) return null;
  return `${record.strategyPresetId}:${record.strategyVersion}`;
}

function buildCopiedFields(record, targetAllocations) {
  return [
    { fieldName: "strategy_name", valuePreview: record.strategyName, redacted: true },
    { fieldName: "description", valuePreview: `Restored mock draft candidate from ${record.runLabel}`, redacted: true },
    { fieldName: "strategy_type", valuePreview: "admin_mock_lab_strategy", redacted: true },
    { fieldName: "asset_universe", valuePreview: deriveAssetUniverse(record).join(", "), redacted: true },
    { fieldName: "target_allocations", valuePreview: `${targetAllocations.length} draft weights`, redacted: true },
    { fieldName: "rebalance_rule", valuePreview: "manual_review threshold placeholder", redacted: true },
    { fieldName: "risk_limits", valuePreview: "conservative mock risk placeholders", redacted: true },
    { fieldName: "calculation_version_reference", valuePreview: record.calculationVersion, redacted: true },
    { fieldName: "tags", valuePreview: "restored_from_mock_history, admin_mock_lab", redacted: true },
    { fieldName: "mock_only_scope", valuePreview: "admin_mock_trading_lab", redacted: true },
  ];
}

function buildTransformedFields(record) {
  return [
    { fieldName: "strategy_name", sourceValuePreview: record.strategyName, targetValuePreview: `${record.strategyName} restore draft`, redacted: true },
    { fieldName: "status", sourceValuePreview: record.runStatus, targetValuePreview: "draft_candidate", redacted: true },
    { fieldName: "timestamps", sourceValuePreview: "source timestamps excluded", targetValuePreview: "placeholder only", redacted: true },
    { fieldName: "version", sourceValuePreview: record.strategyVersion, targetValuePreview: "next_version_candidate", redacted: true },
    { fieldName: "archived", sourceValuePreview: String(Boolean(record.archived)), targetValuePreview: "false", redacted: true },
    { fieldName: "source", sourceValuePreview: "deterministic_mock_history", targetValuePreview: "restored_from_mock_run", redacted: true },
  ];
}

function validateRestoreCandidate(record, targetAllocations) {
  const blockers = [];
  const warnings = [];
  const sourceVersionId = sourceStrategyVersionId(record);

  if (!record) blockers.push("source_run_not_selected");
  if (record && !RESTORE_ELIGIBLE_STATUSES.has(record.runStatus)) blockers.push("source_run_status_not_eligible");
  if (record && !record.compareSupported) blockers.push("source_run_not_compare_supported");
  if (record && record.redacted !== true) blockers.push("source_run_not_redacted");
  if (record && !record.strategyName) blockers.push("strategy_name_missing");
  if (record && !record.strategyVersion) blockers.push("strategy_version_missing");
  if (record && !sourceVersionId) blockers.push("strategy_version_link_missing");
  if (record && !record.inputSummary) blockers.push("input_snapshot_missing");
  if (targetAllocations.length === 0) blockers.push("target_allocation_missing");
  if (Math.abs(targetWeightTotal(targetAllocations) - 100) > 0.01) blockers.push("target_allocation_total_invalid");
  if (new Set(targetAllocations.map((allocation) => allocation.symbol)).size !== targetAllocations.length) blockers.push("asset_universe_duplicate_symbol");

  if (record?.calculationVersion && record.calculationVersion !== CURRENT_CALCULATION_VERSION) warnings.push("calculation_version_outdated");
  if (record?.archived === true) warnings.push("archived_source");
  if (record && targetAllocations.some((allocation) => !Number.isFinite(Number(allocation.targetWeight)))) warnings.push("allocation_normalization_required");
  if (record && record.warningCount > 0) warnings.push("source_warning_history_excluded");
  if (record && !record.outputSummary) warnings.push("output_summary_ignored_for_restore");

  return {
    status: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "eligible_with_warning" : "eligible",
    blockers,
    warnings,
    sourceRunImmutable: Boolean(record),
    sourceStrategyVersionImmutable: Boolean(sourceVersionId),
    dbReadBlocked: true,
    dbWriteBlocked: true,
    supabaseMutationBlocked: true,
    providerOrderLiveBlocked: true,
    redacted: true,
  };
}

function buildTargetDraftPreview(record, targetAllocations, validation) {
  if (!record) {
    return {
      targetDraftId: "placeholder_only",
      status: "blocked",
      persistence: "blocked",
      redacted: true,
    };
  }
  return {
    targetDraftId: `restore-draft-${slugify(record.runId)}`,
    draftLabel: `${record.strategyName} restore draft`,
    strategyName: `${record.strategyName} restore draft`,
    strategyType: "admin_mock_lab_strategy",
    assetUniverse: deriveAssetUniverse(record),
    targetAllocations,
    rebalanceRule: {
      interval: "manual_review",
      thresholdPct: 5,
      status: "draft_candidate",
      redacted: true,
    },
    riskLimits: {
      maxPositionWeightPct: 40,
      maxOrderAmount: "placeholder_only",
      cashReservePct: 10,
      status: "draft_candidate",
      redacted: true,
    },
    sourceRun: record.runId,
    sourceStrategyVersion: sourceStrategyVersionId(record),
    copiedFieldCount: 10,
    excludedFieldCount: EXCLUDED_FIELD_LABELS.length,
    warningCount: validation.warnings.length,
    blockerCount: validation.blockers.length,
    status: validation.blockers.length > 0 ? "blocked" : "draft_candidate",
    persistence: "blocked",
    redacted: true,
  };
}

function findSourceRun(records, sourceRunId) {
  if (!sourceRunId) return null;
  return records.find((record) => record.runId === sourceRunId) || null;
}

export function buildMockStrategyRestoreCandidate(input = {}) {
  const records = input.records || TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS;
  const compare = input.compare || buildMockHistoryCompare({ records, selectedRunIds: input.selectedRunIds });
  const sourceRunId = input.sourceRunId || compare.restoreCandidateEligibility?.find((entry) => entry.restoreEligible)?.restoreSourceRunId || null;
  const sourceRun = findSourceRun(records, sourceRunId);
  const targetAllocations = sourceRun ? deriveTargetAllocations(sourceRun) : [];
  const validation = validateRestoreCandidate(sourceRun, targetAllocations);
  const targetDraftPreview = buildTargetDraftPreview(sourceRun, targetAllocations, validation);
  const sourceVersionId = sourceStrategyVersionId(sourceRun);

  return {
    restoreCandidateId: sourceRun ? `step190_restore_candidate_${slugify(sourceRun.runId)}` : "step190_restore_candidate_unselected",
    sourceRunId: sourceRun?.runId || null,
    sourceStrategyPresetId: sourceRun?.strategyPresetId || null,
    sourceStrategyVersionId: sourceVersionId,
    sourceStrategyName: sourceRun?.strategyName || null,
    sourceStrategyVersion: sourceRun?.strategyVersion || null,
    restoreEligibility: validation.status,
    restorationStatus: validation.blockers.length > 0 ? "blocked" : validation.warnings.length > 0 ? "validation_required" : "candidate_only",
    targetDraftId: targetDraftPreview.targetDraftId,
    targetDraftLabel: targetDraftPreview.draftLabel || "select completed mock run",
    copiedFields: sourceRun ? buildCopiedFields(sourceRun, targetAllocations) : [],
    excludedFields: EXCLUDED_FIELD_LABELS.map((fieldName) => ({ fieldName, redacted: true })),
    transformedFields: sourceRun ? buildTransformedFields(sourceRun) : [],
    validationWarnings: validation.warnings,
    validationBlockers: validation.blockers,
    sourceCalculationVersion: sourceRun?.calculationVersion || null,
    lineage: {
      restoredFromRunId: sourceRun?.runId || null,
      restoredFromStrategyVersionId: sourceVersionId,
      restorationReason: "admin_mock_lab_restore_preview",
      copiedFieldNames: sourceRun ? buildCopiedFields(sourceRun, targetAllocations).map((field) => field.fieldName) : [],
      excludedFieldNames: [...EXCLUDED_FIELD_LABELS],
      transformationVersion: "step190_restore_transform_v1",
      createdByAdminPlaceholder: "admin_placeholder",
      redacted: true,
    },
    targetDraftPreview,
    validation,
    redacted: true,
    immutableSourceConfirmed: Boolean(sourceRun),
    dbReadStatus: "blocked",
    dbWriteStatus: "blocked",
    supabaseMutationStatus: "blocked",
    providerCallStatus: "blocked",
    orderSubmissionStatus: "blocked",
    liveTradingStatus: "blocked",
    nextStep: "strategy_draft_editor_candidate",
  };
}

export function buildAdminTradingLabMockStrategyRestoreCandidateStatus(input = {}) {
  const restoreCandidate = input.restoreCandidate || buildMockStrategyRestoreCandidate(input);
  return {
    ok: true,
    step: "Step 190: Add mock strategy restore candidate",
    status: "admin_only_mock_strategy_restore_candidate_read_only",
    sourceStep: "step190",
    restoreCandidateModel: TRADING_LAB_MOCK_STRATEGY_RESTORE_CANDIDATE_MODEL,
    restoreCandidate,
    blockedConfirmation: {
      endpointAdded: false,
      dbReadAttempted: false,
      dbWriteAttempted: false,
      supabaseSelectAttempted: false,
      supabaseInsertAttempted: false,
      supabaseUpdateAttempted: false,
      supabaseDeleteAttempted: false,
      providerCallAttempted: false,
      tokenIssuanceAttempted: false,
      quoteQueryAttempted: false,
      orderSubmissionAttempted: false,
      liveAccountBalanceQueried: false,
      liveTradingRunCreated: false,
      sourceRunMutated: false,
      sourceStrategyVersionMutated: false,
      restoreActionCreated: false,
      mypageTradingUiExposed: false,
      homepageTradingUiExposed: false,
      publicTradingUiExposed: false,
      redacted: true,
    },
    flags: { ...STEP190_MOCK_STRATEGY_RESTORE_CANDIDATE_FLAGS },
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
    dbReadAllowed: false,
    dbWriteAllowed: false,
    dbMigrationAllowed: false,
    persistentStorageUsed: false,
    dbWriteUsed: false,
    redacted: true,
  };
}
