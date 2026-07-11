import test from "node:test";
import assert from "node:assert/strict";

import { TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS } from "./tradingMockHistoryBrowser.js";
import {
  TRADING_LAB_MOCK_STRATEGY_RESTORE_CANDIDATE_MODEL,
  buildAdminTradingLabMockStrategyRestoreCandidateStatus,
  buildMockStrategyRestoreCandidate,
} from "./tradingMockStrategyRestoreCandidate.js";

const BASELINE_RUN = "mock-run-2026-07-01-balanced-growth-v3";
const ARCHIVED_RUN = "mock-run-2026-07-06-balanced-growth-archive";
const BLOCKED_RUN = "mock-run-2026-07-03-risk-cap-v1";
const FAILED_RUN = "mock-run-2026-07-05-momentum-v2";
const REVIEW_RUN = "mock-run-2026-07-08-global-balanced-v1";
const TECH_RUN = "mock-run-2026-07-10-tech-core-v5";

test("Step190 restore model is deterministic and mock-only", () => {
  const first = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });
  const second = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });

  assert.deepEqual(second, first);
  assert.equal(first.restoreCandidateId, "step190_restore_candidate_mock-run-2026-07-01-balanced-growth-v3");
  assert.equal(first.restoreEligibility, "eligible_with_warning");
  assert.equal(first.restorationStatus, "validation_required");
  assert.equal(first.redacted, true);
  assert.equal(TRADING_LAB_MOCK_STRATEGY_RESTORE_CANDIDATE_MODEL.nextStep, "strategy_draft_editor_candidate");
});

test("Step190 uses only one source run", () => {
  const candidate = buildMockStrategyRestoreCandidate({
    selectedRunIds: [BASELINE_RUN, TECH_RUN],
  });

  assert.equal(candidate.sourceRunId, BASELINE_RUN);
  assert.equal(candidate.lineage.restoredFromRunId, BASELINE_RUN);
});

test("Step190 completed and archived completed runs are eligible", () => {
  const completed = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });
  const archived = buildMockStrategyRestoreCandidate({ sourceRunId: ARCHIVED_RUN });

  assert.notEqual(completed.restoreEligibility, "blocked");
  assert.notEqual(archived.restoreEligibility, "blocked");
  assert.equal(archived.validationWarnings.includes("archived_source"), true);
});

test("Step190 blocked failed and in-review runs are ineligible", () => {
  for (const runId of [BLOCKED_RUN, FAILED_RUN, REVIEW_RUN]) {
    const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: runId });
    assert.equal(candidate.restoreEligibility, "blocked");
    assert.equal(candidate.validationBlockers.includes("source_run_status_not_eligible"), true);
  }
});

test("Step190 keeps source run and strategy version immutable", () => {
  const before = structuredClone(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS);
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });

  assert.deepEqual(TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS, before);
  assert.equal(candidate.immutableSourceConfirmed, true);
  assert.equal(candidate.validation.sourceRunImmutable, true);
  assert.equal(candidate.validation.sourceStrategyVersionImmutable, true);
  assert.equal(candidate.blockedConfirmation, undefined);
});

test("Step190 candidate gets new draft identity and draft candidate status", () => {
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });

  assert.notEqual(candidate.targetDraftId, BASELINE_RUN);
  assert.equal(candidate.targetDraftPreview.status, "draft_candidate");
  assert.equal(candidate.targetDraftPreview.persistence, "blocked");
  assert.equal(candidate.targetDraftPreview.strategyName, "Balanced Growth Mock restore draft");
});

test("Step190 copies only strategy input fields", () => {
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });
  const copiedNames = candidate.copiedFields.map((field) => field.fieldName);

  for (const fieldName of [
    "strategy_name",
    "description",
    "strategy_type",
    "asset_universe",
    "target_allocations",
    "rebalance_rule",
    "risk_limits",
    "calculation_version_reference",
    "tags",
    "mock_only_scope",
  ]) {
    assert.equal(copiedNames.includes(fieldName), true);
  }
});

test("Step190 excludes result private and live fields", () => {
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });
  const excluded = JSON.stringify(candidate.excludedFields);

  assert.match(excluded, /mock order summary excluded/);
  assert.match(excluded, /mock fill summary excluded/);
  assert.match(excluded, /mock ledger snapshot excluded/);
  assert.match(excluded, /mock performance snapshot excluded/);
  assert.match(excluded, /live account data excluded/);
  assert.match(excluded, /provider and KIS field excluded/);
  assert.match(excluded, /credential and token excluded/);
});

test("Step190 field transformations are deterministic", () => {
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: ARCHIVED_RUN });
  const statusTransform = candidate.transformedFields.find((field) => field.fieldName === "status");
  const versionTransform = candidate.transformedFields.find((field) => field.fieldName === "version");
  const archivedTransform = candidate.transformedFields.find((field) => field.fieldName === "archived");

  assert.equal(statusTransform.targetValuePreview, "draft_candidate");
  assert.equal(versionTransform.targetValuePreview, "next_version_candidate");
  assert.equal(archivedTransform.targetValuePreview, "false");
});

test("Step190 outdated calculation version produces warning", () => {
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: TECH_RUN });

  assert.equal(candidate.validationWarnings.includes("calculation_version_outdated"), true);
  assert.equal(candidate.restoreEligibility, "eligible_with_warning");
});

test("Step190 validates missing strategy data as blocked", () => {
  const records = TRADING_LAB_MOCK_HISTORY_BROWSER_RECORDS.map((record) => (
    record.runId === BASELINE_RUN ? { ...record, strategyVersion: "" } : record
  ));
  const candidate = buildMockStrategyRestoreCandidate({ records, sourceRunId: BASELINE_RUN });

  assert.equal(candidate.restoreEligibility, "blocked");
  assert.equal(candidate.validationBlockers.includes("strategy_version_missing"), true);
});

test("Step190 lineage contract is redacted and write-blocked", () => {
  const candidate = buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN });

  assert.equal(candidate.lineage.restoredFromRunId, BASELINE_RUN);
  assert.equal(candidate.lineage.restoredFromStrategyVersionId, "mock-preset-balanced-growth:v3");
  assert.equal(candidate.lineage.transformationVersion, "step190_restore_transform_v1");
  assert.equal(candidate.lineage.createdByAdminPlaceholder, "admin_placeholder");
  assert.equal(candidate.lineage.redacted, true);
  assert.equal(candidate.dbWriteStatus, "blocked");
});

test("Step190 status keeps DB provider order and live gates blocked", () => {
  const status = buildAdminTradingLabMockStrategyRestoreCandidateStatus({ sourceRunId: BASELINE_RUN });

  assert.equal(status.blockedConfirmation.endpointAdded, false);
  assert.equal(status.blockedConfirmation.dbReadAttempted, false);
  assert.equal(status.blockedConfirmation.dbWriteAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseSelectAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseInsertAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseUpdateAttempted, false);
  assert.equal(status.blockedConfirmation.supabaseDeleteAttempted, false);
  assert.equal(status.blockedConfirmation.providerCallAttempted, false);
  assert.equal(status.blockedConfirmation.orderSubmissionAttempted, false);
  assert.equal(status.blockedConfirmation.sourceRunMutated, false);
  assert.equal(status.blockedConfirmation.sourceStrategyVersionMutated, false);
  assert.equal(status.blockedConfirmation.restoreActionCreated, false);
  assert.equal(status.providerCallsAllowed, false);
  assert.equal(status.orderSubmissionAllowed, false);
  assert.equal(status.readyForReadOnlyProviderCalls, false);
  assert.equal(status.readyForOrderSubmission, false);
  assert.equal(status.readyForLiveGuardedTrading, false);
  assert.equal(status.dbReadAllowed, false);
  assert.equal(status.dbWriteAllowed, false);
});

test("Step190 restore payload excludes sensitive identifiers", () => {
  const serialized = JSON.stringify(buildMockStrategyRestoreCandidate({ sourceRunId: BASELINE_RUN }));

  for (const forbidden of [
    "account_number",
    "provider_payload",
    "order_payload",
    "raw_provider_response",
    "hash_value",
    "digest_value",
    "actual_order_id",
    "actual_fill_id",
    "actual_execution_id",
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
});
