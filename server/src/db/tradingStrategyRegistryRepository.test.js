import test from "node:test";
import assert from "node:assert/strict";

import {
  approveTradingStrategyDraft,
  buildStrategyPayloadChecksum,
  getTradingStrategyRegistryStatus,
  saveTradingStrategyDraft,
} from "./tradingStrategyRegistryRepository.js";
import {
  readScalpingAdminDraft,
  resetScalpingAdminDraftForTest,
} from "../services/tradingScalpingAdminDashboard.js";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalRegistryFlag = process.env.FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED;

function restoreEnvironment() {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalRegistryFlag === undefined) delete process.env.FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED;
  else process.env.FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED = originalRegistryFlag;
}

function enableRegistry() {
  process.env.DATABASE_URL = "postgres://test.invalid/finple";
  process.env.FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED = "true";
}

function schemaReadyQuery(sql) {
  assert.match(sql, /to_regclass/);
  return Promise.resolve({
    rowCount: 1,
    rows: [{
      drafts: "trading_strategy_drafts",
      versions: "trading_strategy_versions",
      audit_events: "trading_strategy_audit_events",
    }],
  });
}

function draftRow(overrides = {}) {
  const draft = readScalpingAdminDraft();
  return {
    id: "11111111-1111-4111-8111-111111111111",
    strategy_key: "leveraged-etf-scalping-v1",
    draft_version: draft.draftVersion,
    strategy_version: draft.strategyVersion,
    revision: 2,
    lifecycle_status: "draft",
    strategy_config: draft.strategy,
    research_objectives: draft.objectives,
    portfolio_constraints: draft.portfolioConstraints,
    payload_checksum: buildStrategyPayloadChecksum(draft),
    updated_by: "test_admin",
    review_requested_by: null,
    review_requested_at: null,
    created_at: "2026-08-05T00:00:00.000Z",
    updated_at: "2026-08-05T00:00:00.000Z",
    ...overrides,
  };
}

function versionRow(row, overrides = {}) {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    strategy_key: row.strategy_key,
    version_number: 1,
    source_draft_id: row.id,
    source_draft_revision: row.revision,
    status: "approved",
    draft_version: row.draft_version,
    strategy_version: row.strategy_version,
    strategy_config: row.strategy_config,
    research_objectives: row.research_objectives,
    portfolio_constraints: row.portfolio_constraints,
    payload_checksum: row.payload_checksum,
    approved_by: "approver",
    approved_at: "2026-08-05T00:10:00.000Z",
    retired_by: null,
    retired_at: null,
    retirement_reason: null,
    created_at: "2026-08-05T00:10:00.000Z",
    ...overrides,
  };
}

test.beforeEach(() => {
  resetScalpingAdminDraftForTest();
});

test.afterEach(() => {
  restoreEnvironment();
});

test("checksum is stable across object key order and includes portfolio constraints", () => {
  const draft = readScalpingAdminDraft();
  const first = buildStrategyPayloadChecksum(draft);
  const reordered = {
    portfolioConstraints: { ...draft.portfolioConstraints },
    objectives: { ...draft.objectives },
    strategy: { ...draft.strategy },
    strategyVersion: draft.strategyVersion,
    draftVersion: draft.draftVersion,
  };
  const second = buildStrategyPayloadChecksum(reordered);
  assert.equal(first, second);
  const changed = buildStrategyPayloadChecksum({
    ...draft,
    portfolioConstraints: { ...draft.portfolioConstraints, maxConcurrentPositions: 3 },
  });
  assert.notEqual(first, changed);
});

test("registry remains memory fallback when feature flag is disabled", async () => {
  process.env.DATABASE_URL = "postgres://test.invalid/finple";
  process.env.FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED = "false";
  let called = false;
  const status = await getTradingStrategyRegistryStatus({
    query: async () => {
      called = true;
      throw new Error("query should not run");
    },
  });
  assert.equal(called, false);
  assert.equal(status.featureEnabled, false);
  assert.equal(status.schemaReady, false);
  assert.equal(status.mode, "memory_fallback");
});

test("persists a first multi-symbol draft with optimistic revision and audit event", async () => {
  enableRegistry();
  const current = readScalpingAdminDraft();
  const inserted = draftRow({
    revision: 2,
    strategy_config: { ...current.strategy, allowedSymbols: ["TQQQ", "SOXL", "UPRO"] },
    portfolio_constraints: { ...current.portfolioConstraints, maxConcurrentPositions: 2 },
  });
  const statements = [];
  const withTransaction = async (callback) => callback(async (sql, params = []) => {
    statements.push({ sql, params });
    if (/SELECT \* FROM trading_strategy_drafts/.test(sql)) return { rowCount: 0, rows: [] };
    if (/INSERT INTO trading_strategy_drafts/.test(sql)) return { rowCount: 1, rows: [inserted] };
    if (/INSERT INTO trading_strategy_audit_events/.test(sql)) return { rowCount: 1, rows: [] };
    throw new Error(`unexpected SQL: ${sql}`);
  });
  const result = await saveTradingStrategyDraft({
    expectedRevision: 1,
    strategy: inserted.strategy_config,
    objectives: inserted.research_objectives,
    portfolioConstraints: inserted.portfolio_constraints,
  }, { actor: "test_admin" }, { query: schemaReadyQuery, withTransaction });
  assert.equal(result.revision, 2);
  assert.deepEqual(result.strategy.allowedSymbols, ["TQQQ", "SOXL", "UPRO"]);
  assert.equal(result.portfolioConstraints.maxConcurrentPositions, 2);
  assert.ok(statements.some((entry) => /INSERT INTO trading_strategy_drafts/.test(entry.sql)));
  assert.ok(statements.some((entry) => /draft_created/.test(String(entry.params))));
});

test("rejects a stale persistent draft revision", async () => {
  enableRegistry();
  const currentRow = draftRow({ revision: 4 });
  const withTransaction = async (callback) => callback(async (sql) => {
    if (/SELECT \* FROM trading_strategy_drafts/.test(sql)) return { rowCount: 1, rows: [currentRow] };
    throw new Error(`unexpected SQL: ${sql}`);
  });
  await assert.rejects(
    () => saveTradingStrategyDraft({
      expectedRevision: 3,
      strategy: currentRow.strategy_config,
      objectives: currentRow.research_objectives,
      portfolioConstraints: currentRow.portfolio_constraints,
    }, {}, { query: schemaReadyQuery, withTransaction }),
    (error) => error.code === "SCALPING_DRAFT_REVISION_CONFLICT" && error.statusCode === 409,
  );
});

test("creates an immutable approved version only from review_requested state", async () => {
  enableRegistry();
  const reviewed = draftRow({ revision: 3, lifecycle_status: "review_requested" });
  const approvedVersion = versionRow(reviewed);
  const approvedDraft = draftRow({
    revision: 4,
    lifecycle_status: "approved_snapshot_created",
    updated_by: "approver",
  });
  const statements = [];
  const withTransaction = async (callback) => callback(async (sql, params = []) => {
    statements.push({ sql, params });
    if (/SELECT \* FROM trading_strategy_drafts/.test(sql)) return { rowCount: 1, rows: [reviewed] };
    if (/COALESCE\(MAX\(version_number\)/.test(sql)) return { rowCount: 1, rows: [{ next_version: 1 }] };
    if (/INSERT INTO trading_strategy_versions/.test(sql)) return { rowCount: 1, rows: [approvedVersion] };
    if (/UPDATE trading_strategy_drafts/.test(sql)) return { rowCount: 1, rows: [approvedDraft] };
    if (/INSERT INTO trading_strategy_audit_events/.test(sql)) return { rowCount: 1, rows: [] };
    throw new Error(`unexpected SQL: ${sql}`);
  });
  const result = await approveTradingStrategyDraft(
    { expectedRevision: 3 },
    { actor: "approver" },
    { query: schemaReadyQuery, withTransaction },
  );
  assert.equal(result.version.versionNumber, 1);
  assert.equal(result.version.status, "approved");
  assert.equal(result.draft.lifecycleStatus, "approved_snapshot_created");
  assert.ok(statements.some((entry) => /runtimeActivationAllowed/.test(String(entry.params))));
});

test("approval is blocked when review was not requested", async () => {
  enableRegistry();
  const currentRow = draftRow({ revision: 2, lifecycle_status: "draft" });
  const withTransaction = async (callback) => callback(async (sql) => {
    if (/SELECT \* FROM trading_strategy_drafts/.test(sql)) return { rowCount: 1, rows: [currentRow] };
    throw new Error(`unexpected SQL: ${sql}`);
  });
  await assert.rejects(
    () => approveTradingStrategyDraft(
      { expectedRevision: 2 },
      { actor: "approver" },
      { query: schemaReadyQuery, withTransaction },
    ),
    (error) => error.code === "SCALPING_REVIEW_REQUIRED" && error.statusCode === 409,
  );
});
