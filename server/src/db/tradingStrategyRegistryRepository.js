import { createHash, randomUUID } from "node:crypto";

import {
  isDatabaseConfigured,
  query as databaseQuery,
  withTransaction as databaseWithTransaction,
} from "./database.js";
import { validateScalpingAdminDraft } from "../services/tradingScalpingAdminDashboard.js";

export const SCALPING_STRATEGY_REGISTRY_KEY = "leveraged-etf-scalping-v1";

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function clean(value) {
  return String(value ?? "").trim();
}

function integer(value) {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function buildStrategyPayloadChecksum(payload = {}) {
  const canonical = JSON.stringify(stableValue({
    draftVersion: payload.draftVersion,
    strategyVersion: payload.strategyVersion,
    strategy: payload.strategy,
    objectives: payload.objectives,
    portfolioConstraints: payload.portfolioConstraints,
  }));
  return createHash("sha256").update(canonical).digest("hex");
}

function registryEnabled() {
  return isDatabaseConfigured() && normalizeBoolean(process.env.FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED, false);
}

function registryError(code, message, statusCode = 503, details = []) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function mapDraft(row) {
  if (!row) return null;
  return {
    id: row.id,
    strategyKey: row.strategy_key,
    draftVersion: row.draft_version,
    strategyVersion: row.strategy_version,
    revision: Number(row.revision),
    lifecycleStatus: row.lifecycle_status,
    strategy: row.strategy_config,
    objectives: row.research_objectives,
    portfolioConstraints: row.portfolio_constraints,
    checksum: row.payload_checksum,
    updatedBy: row.updated_by,
    reviewRequestedBy: row.review_requested_by,
    reviewRequestedAt: row.review_requested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row) {
  if (!row) return null;
  return {
    id: row.id,
    strategyKey: row.strategy_key,
    versionNumber: Number(row.version_number),
    sourceDraftId: row.source_draft_id,
    sourceDraftRevision: Number(row.source_draft_revision),
    status: row.status,
    draftVersion: row.draft_version,
    strategyVersion: row.strategy_version,
    strategy: row.strategy_config,
    objectives: row.research_objectives,
    portfolioConstraints: row.portfolio_constraints,
    checksum: row.payload_checksum,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    retiredBy: row.retired_by,
    retiredAt: row.retired_at,
    retirementReason: row.retirement_reason,
    createdAt: row.created_at,
  };
}

function mapAuditEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    strategyKey: row.strategy_key,
    eventType: row.event_type,
    actor: row.actor,
    draftId: row.draft_id,
    draftRevision: row.draft_revision === null ? null : Number(row.draft_revision),
    strategyVersionId: row.strategy_version_id,
    eventPayload: row.event_payload,
    createdAt: row.created_at,
  };
}

async function checkSchema(queryFn = databaseQuery) {
  if (!registryEnabled()) {
    return {
      databaseConfigured: isDatabaseConfigured(),
      featureEnabled: false,
      schemaReady: false,
      mode: "memory_fallback",
      reason: isDatabaseConfigured() ? "registry_feature_flag_disabled" : "database_not_configured",
    };
  }

  const result = await queryFn(
    `SELECT
       to_regclass('public.trading_strategy_drafts') AS drafts,
       to_regclass('public.trading_strategy_versions') AS versions,
       to_regclass('public.trading_strategy_audit_events') AS audit_events`,
  );
  const row = result.rows?.[0] || {};
  const schemaReady = Boolean(row.drafts && row.versions && row.audit_events);
  return {
    databaseConfigured: true,
    featureEnabled: true,
    schemaReady,
    mode: schemaReady ? "postgres_registry" : "registry_schema_missing",
    reason: schemaReady ? null : "apply_20260805_trading_strategy_registry_migration",
  };
}

async function requireSchema(queryFn = databaseQuery) {
  const status = await checkSchema(queryFn);
  if (!status.featureEnabled) {
    throw registryError("TRADING_STRATEGY_REGISTRY_DISABLED", "전략 레지스트리가 비활성화되어 있습니다.", 503, [status.reason]);
  }
  if (!status.schemaReady) {
    throw registryError("TRADING_STRATEGY_REGISTRY_SCHEMA_MISSING", "전략 레지스트리 DB migration이 적용되지 않았습니다.", 503, [status.reason]);
  }
  return status;
}

async function insertAudit(tx, input) {
  const eventId = randomUUID();
  await tx(
    `INSERT INTO trading_strategy_audit_events (
       id, strategy_key, event_type, actor, draft_id, draft_revision,
       strategy_version_id, event_payload
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [
      eventId,
      input.strategyKey,
      input.eventType,
      clean(input.actor) || "admin_console",
      input.draftId || null,
      input.draftRevision ?? null,
      input.strategyVersionId || null,
      JSON.stringify(input.eventPayload || {}),
    ],
  );
  return eventId;
}

export async function getTradingStrategyRegistryStatus(dependencies = {}) {
  return checkSchema(dependencies.query ?? databaseQuery);
}

export async function getTradingStrategyRegistrySnapshot(options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const status = await checkSchema(queryFn);
  if (!status.schemaReady) {
    return {
      status,
      draft: null,
      versions: [],
      auditEvents: [],
    };
  }
  const strategyKey = clean(options.strategyKey) || SCALPING_STRATEGY_REGISTRY_KEY;
  const [draftResult, versionResult, auditResult] = await Promise.all([
    queryFn(
      `SELECT * FROM trading_strategy_drafts WHERE strategy_key = $1`,
      [strategyKey],
    ),
    queryFn(
      `SELECT * FROM trading_strategy_versions
       WHERE strategy_key = $1
       ORDER BY version_number DESC
       LIMIT 25`,
      [strategyKey],
    ),
    queryFn(
      `SELECT * FROM trading_strategy_audit_events
       WHERE strategy_key = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [strategyKey],
    ),
  ]);
  return {
    status,
    draft: mapDraft(draftResult.rows?.[0]),
    versions: (versionResult.rows || []).map(mapVersion),
    auditEvents: (auditResult.rows || []).map(mapAuditEvent),
  };
}

export async function saveTradingStrategyDraft(input = {}, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const withTransactionFn = dependencies.withTransaction ?? databaseWithTransaction;
  await requireSchema(queryFn);
  const strategyKey = clean(options.strategyKey) || SCALPING_STRATEGY_REGISTRY_KEY;
  const actor = clean(options.actor) || "admin_console";
  const expectedRevision = integer(input.expectedRevision);
  if (expectedRevision === null || expectedRevision < 1) {
    throw registryError("SCALPING_DRAFT_REVISION_REQUIRED", "전략 초안 revision이 필요합니다.", 400);
  }
  const validation = validateScalpingAdminDraft(input);
  if (!validation.valid) {
    throw registryError("INVALID_SCALPING_DRAFT", "전략 초안 검증에 실패했습니다.", 400, validation.reasons);
  }
  const payload = validation.draft;
  const checksum = buildStrategyPayloadChecksum(payload);

  return withTransactionFn(async (tx) => {
    const currentResult = await tx(
      `SELECT * FROM trading_strategy_drafts
       WHERE strategy_key = $1
       FOR UPDATE`,
      [strategyKey],
    );
    const current = currentResult.rows?.[0] || null;
    if (current && Number(current.revision) !== expectedRevision) {
      throw registryError("SCALPING_DRAFT_REVISION_CONFLICT", "전략 초안이 다른 세션에서 변경되었습니다.", 409, ["revision_conflict"]);
    }
    if (!current && expectedRevision !== 1) {
      throw registryError("SCALPING_DRAFT_REVISION_CONFLICT", "영구 레지스트리의 최초 revision은 1이어야 합니다.", 409, ["initial_revision_conflict"]);
    }

    const draftId = current?.id || randomUUID();
    const nextRevision = expectedRevision + 1;
    const eventType = current ? "draft_updated" : "draft_created";
    const result = current
      ? await tx(
          `UPDATE trading_strategy_drafts
           SET draft_version = $3,
               strategy_version = $4,
               revision = $5,
               lifecycle_status = 'draft',
               strategy_config = $6::jsonb,
               research_objectives = $7::jsonb,
               portfolio_constraints = $8::jsonb,
               payload_checksum = $9,
               updated_by = $10,
               review_requested_by = NULL,
               review_requested_at = NULL,
               updated_at = NOW()
           WHERE strategy_key = $1 AND id = $2
           RETURNING *`,
          [
            strategyKey,
            draftId,
            payload.draftVersion,
            payload.strategyVersion,
            nextRevision,
            JSON.stringify(payload.strategy),
            JSON.stringify(payload.objectives),
            JSON.stringify(payload.portfolioConstraints),
            checksum,
            actor,
          ],
        )
      : await tx(
          `INSERT INTO trading_strategy_drafts (
             id, strategy_key, draft_version, strategy_version, revision,
             lifecycle_status, strategy_config, research_objectives,
             portfolio_constraints, payload_checksum, updated_by
           ) VALUES ($1, $2, $3, $4, $5, 'draft', $6::jsonb, $7::jsonb, $8::jsonb, $9, $10)
           RETURNING *`,
          [
            draftId,
            strategyKey,
            payload.draftVersion,
            payload.strategyVersion,
            nextRevision,
            JSON.stringify(payload.strategy),
            JSON.stringify(payload.objectives),
            JSON.stringify(payload.portfolioConstraints),
            checksum,
            actor,
          ],
        );
    const draft = mapDraft(result.rows?.[0]);
    await insertAudit(tx, {
      strategyKey,
      eventType,
      actor,
      draftId,
      draftRevision: draft.revision,
      eventPayload: {
        checksum,
        selectedSymbols: draft.strategy.allowedSymbols,
        lifecycleStatus: draft.lifecycleStatus,
      },
    });
    return draft;
  });
}

export async function requestTradingStrategyReview(input = {}, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const withTransactionFn = dependencies.withTransaction ?? databaseWithTransaction;
  await requireSchema(queryFn);
  const strategyKey = clean(options.strategyKey) || SCALPING_STRATEGY_REGISTRY_KEY;
  const actor = clean(options.actor) || "admin_console";
  const expectedRevision = integer(input.expectedRevision);
  if (expectedRevision === null) throw registryError("SCALPING_DRAFT_REVISION_REQUIRED", "전략 초안 revision이 필요합니다.", 400);

  return withTransactionFn(async (tx) => {
    const result = await tx(
      `UPDATE trading_strategy_drafts
       SET revision = revision + 1,
           lifecycle_status = 'review_requested',
           review_requested_by = $3,
           review_requested_at = NOW(),
           updated_by = $3,
           updated_at = NOW()
       WHERE strategy_key = $1 AND revision = $2
       RETURNING *`,
      [strategyKey, expectedRevision, actor],
    );
    if (result.rowCount === 0) {
      throw registryError("SCALPING_DRAFT_REVISION_CONFLICT", "검토 요청 전 최신 전략 초안을 다시 불러와야 합니다.", 409, ["revision_conflict"]);
    }
    const draft = mapDraft(result.rows[0]);
    await insertAudit(tx, {
      strategyKey,
      eventType: "review_requested",
      actor,
      draftId: draft.id,
      draftRevision: draft.revision,
      eventPayload: { checksum: draft.checksum },
    });
    return draft;
  });
}

export async function approveTradingStrategyDraft(input = {}, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const withTransactionFn = dependencies.withTransaction ?? databaseWithTransaction;
  await requireSchema(queryFn);
  const strategyKey = clean(options.strategyKey) || SCALPING_STRATEGY_REGISTRY_KEY;
  const actor = clean(options.actor) || "admin_console";
  const expectedRevision = integer(input.expectedRevision);
  if (expectedRevision === null) throw registryError("SCALPING_DRAFT_REVISION_REQUIRED", "전략 초안 revision이 필요합니다.", 400);

  return withTransactionFn(async (tx) => {
    const draftResult = await tx(
      `SELECT * FROM trading_strategy_drafts
       WHERE strategy_key = $1
       FOR UPDATE`,
      [strategyKey],
    );
    const row = draftResult.rows?.[0];
    if (!row || Number(row.revision) !== expectedRevision) {
      throw registryError("SCALPING_DRAFT_REVISION_CONFLICT", "승인 전 최신 전략 초안을 다시 불러와야 합니다.", 409, ["revision_conflict"]);
    }
    if (row.lifecycle_status !== "review_requested") {
      throw registryError("SCALPING_REVIEW_REQUIRED", "검토 요청 상태의 전략만 승인할 수 있습니다.", 409, ["review_request_required"]);
    }
    const versionResult = await tx(
      `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
       FROM trading_strategy_versions
       WHERE strategy_key = $1`,
      [strategyKey],
    );
    const versionNumber = Number(versionResult.rows?.[0]?.next_version || 1);
    const versionId = randomUUID();
    const insertedVersion = await tx(
      `INSERT INTO trading_strategy_versions (
         id, strategy_key, version_number, source_draft_id, source_draft_revision,
         status, draft_version, strategy_version, strategy_config,
         research_objectives, portfolio_constraints, payload_checksum, approved_by
       ) VALUES ($1, $2, $3, $4, $5, 'approved', $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12)
       RETURNING *`,
      [
        versionId,
        strategyKey,
        versionNumber,
        row.id,
        row.revision,
        row.draft_version,
        row.strategy_version,
        JSON.stringify(row.strategy_config),
        JSON.stringify(row.research_objectives),
        JSON.stringify(row.portfolio_constraints),
        row.payload_checksum,
        actor,
      ],
    );
    const updatedDraft = await tx(
      `UPDATE trading_strategy_drafts
       SET revision = revision + 1,
           lifecycle_status = 'approved_snapshot_created',
           updated_by = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [row.id, actor],
    );
    const version = mapVersion(insertedVersion.rows[0]);
    const draft = mapDraft(updatedDraft.rows[0]);
    await insertAudit(tx, {
      strategyKey,
      eventType: "approval_created",
      actor,
      draftId: draft.id,
      draftRevision: draft.revision,
      strategyVersionId: version.id,
      eventPayload: {
        versionNumber,
        checksum: version.checksum,
        runtimeActivationAllowed: false,
      },
    });
    return { draft, version };
  });
}

export async function retireTradingStrategyVersion(versionId, input = {}, options = {}, dependencies = {}) {
  const queryFn = dependencies.query ?? databaseQuery;
  const withTransactionFn = dependencies.withTransaction ?? databaseWithTransaction;
  await requireSchema(queryFn);
  const strategyKey = clean(options.strategyKey) || SCALPING_STRATEGY_REGISTRY_KEY;
  const actor = clean(options.actor) || "admin_console";
  const reason = clean(input.reason);
  if (!reason) throw registryError("RETIREMENT_REASON_REQUIRED", "전략 버전 폐기 사유가 필요합니다.", 400);

  return withTransactionFn(async (tx) => {
    const result = await tx(
      `UPDATE trading_strategy_versions
       SET status = 'retired',
           retired_by = $3,
           retired_at = NOW(),
           retirement_reason = $4
       WHERE id = $1 AND strategy_key = $2 AND status = 'approved'
       RETURNING *`,
      [versionId, strategyKey, actor, reason],
    );
    if (result.rowCount === 0) {
      throw registryError("STRATEGY_VERSION_NOT_RETIRABLE", "승인 상태의 전략 버전을 찾지 못했습니다.", 404);
    }
    const version = mapVersion(result.rows[0]);
    await insertAudit(tx, {
      strategyKey,
      eventType: "version_retired",
      actor,
      draftId: version.sourceDraftId,
      draftRevision: version.sourceDraftRevision,
      strategyVersionId: version.id,
      eventPayload: { reason },
    });
    return version;
  });
}
