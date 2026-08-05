import { getLatestTradingShadowSnapshot } from "../db/tradingShadowSnapshotRepository.js";
import {
  approveTradingStrategyDraft,
  getTradingStrategyRegistrySnapshot,
  requestTradingStrategyReview,
  retireTradingStrategyVersion,
  saveTradingStrategyDraft,
  SCALPING_STRATEGY_REGISTRY_KEY,
} from "../db/tradingStrategyRegistryRepository.js";
import {
  buildTradingScalpingAdminDashboard,
  readScalpingAdminDraft,
  replaceScalpingAdminDraftForRegistry,
  updateScalpingAdminDraft,
} from "./tradingScalpingAdminDashboard.js";

function clean(value) {
  return String(value ?? "").trim();
}

function registryEnvelope(snapshot) {
  return {
    status: snapshot.status,
    versions: snapshot.versions || [],
    auditEvents: snapshot.auditEvents || [],
  };
}

function actor(options = {}) {
  return clean(options.actor) || "admin_console";
}

function shadowToPerformanceSnapshot(snapshot) {
  if (!snapshot?.ok || snapshot.mode !== "shadow" || !snapshot.metrics || !snapshot.ledger) return null;
  const metrics = snapshot.metrics;
  return {
    ok: true,
    mode: "shadow",
    asOf: snapshot.asOf,
    version: snapshot.version || "leveraged-etf-shadow-worker-v1",
    metrics: {
      initialEquity: metrics.initialEquity,
      endingEquity: metrics.endingEquity,
      netPnl: metrics.netPnl,
      totalReturn: metrics.totalReturnPct === null ? null : Number(metrics.totalReturnPct) / 100,
      maxDrawdown: metrics.maxDrawdownPct === null ? null : -Math.abs(Number(metrics.maxDrawdownPct)) / 100,
      profitFactor: metrics.profitFactor,
      fillRate: metrics.fillRatePct === null ? null : Number(metrics.fillRatePct) / 100,
      averageSlippageBps: metrics.averageSlippageBps,
      trades: metrics.trades,
      wins: metrics.wins,
      losses: metrics.losses,
      totalFees: metrics.totalFees,
      turnover: null,
      breakdown: snapshot.ledger.breakdown || { bySymbol: {}, byRegime: {}, byEntryHour: {} },
    },
    ledger: {
      equityCurve: snapshot.ledger.equityCurve || [],
      trades: snapshot.ledger.trades || [],
    },
    promotion: snapshot.promotion || null,
    observationSessions: snapshot.observationSessions || 0,
    runId: snapshot.runId || null,
  };
}

export async function readScalpingStrategyAdminDashboard(options = {}, dependencies = {}) {
  const snapshot = await getTradingStrategyRegistrySnapshot(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );
  const draft = snapshot.draft
    ? replaceScalpingAdminDraftForRegistry(snapshot.draft)
    : readScalpingAdminDraft();
  let performanceSnapshot = options.performanceSnapshot;
  let shadow = null;
  if (performanceSnapshot === undefined) {
    const latestShadow = await (dependencies.getLatestShadowSnapshot ?? getLatestTradingShadowSnapshot)({}, dependencies);
    shadow = latestShadow;
    performanceSnapshot = shadowToPerformanceSnapshot(latestShadow.snapshot);
  }
  const dashboard = buildTradingScalpingAdminDashboard({
    draft,
    performanceSnapshot,
    registry: registryEnvelope(snapshot),
    checkedAt: options.checkedAt,
  });
  return {
    ...dashboard,
    shadow: {
      status: shadow?.persistence || null,
      latestSnapshot: shadow?.snapshot || null,
      promotion: shadow?.snapshot?.promotion || null,
      observationSessions: shadow?.snapshot?.observationSessions || 0,
      orderSubmissionAllowed: false,
      providerCallsAllowed: false,
    },
  };
}

export async function saveScalpingStrategyAdminDraft(input = {}, options = {}, dependencies = {}) {
  const snapshot = await getTradingStrategyRegistrySnapshot(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );

  if (snapshot.status.schemaReady) {
    const draft = await saveTradingStrategyDraft(
      input,
      { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY, actor: actor(options) },
      dependencies,
    );
    replaceScalpingAdminDraftForRegistry(draft);
    const nextSnapshot = await getTradingStrategyRegistrySnapshot(
      { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
      dependencies,
    );
    return {
      ok: true,
      code: "SCALPING_DRAFT_PERSISTED",
      persistenceMode: "postgres_registry",
      draft,
      dashboard: buildTradingScalpingAdminDashboard({
        draft,
        registry: registryEnvelope(nextSnapshot),
      }),
    };
  }

  const memoryResult = updateScalpingAdminDraft(input, { updatedBy: actor(options) });
  return {
    ...memoryResult,
    persistenceMode: "process_memory_draft",
    dashboard: buildTradingScalpingAdminDashboard({
      draft: memoryResult.draft,
      registry: registryEnvelope(snapshot),
    }),
  };
}

export async function requestScalpingStrategyAdminReview(input = {}, options = {}, dependencies = {}) {
  const draft = await requestTradingStrategyReview(
    input,
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY, actor: actor(options) },
    dependencies,
  );
  replaceScalpingAdminDraftForRegistry(draft);
  const snapshot = await getTradingStrategyRegistrySnapshot(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );
  return {
    ok: true,
    code: "SCALPING_REVIEW_REQUESTED",
    draft,
    dashboard: buildTradingScalpingAdminDashboard({
      draft,
      registry: registryEnvelope(snapshot),
    }),
  };
}

export async function approveScalpingStrategyAdminDraft(input = {}, options = {}, dependencies = {}) {
  const result = await approveTradingStrategyDraft(
    input,
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY, actor: actor(options) },
    dependencies,
  );
  replaceScalpingAdminDraftForRegistry(result.draft);
  const snapshot = await getTradingStrategyRegistrySnapshot(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );
  return {
    ok: true,
    code: "SCALPING_APPROVED_SNAPSHOT_CREATED",
    draft: result.draft,
    version: result.version,
    runtimeActivationAllowed: false,
    orderSubmissionAllowed: false,
    dashboard: buildTradingScalpingAdminDashboard({
      draft: result.draft,
      registry: registryEnvelope(snapshot),
    }),
  };
}

export async function retireScalpingStrategyAdminVersion(versionId, input = {}, options = {}, dependencies = {}) {
  const version = await retireTradingStrategyVersion(
    versionId,
    input,
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY, actor: actor(options) },
    dependencies,
  );
  const snapshot = await getTradingStrategyRegistrySnapshot(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );
  return {
    ok: true,
    code: "SCALPING_STRATEGY_VERSION_RETIRED",
    version,
    runtimeActivationAllowed: false,
    orderSubmissionAllowed: false,
    dashboard: buildTradingScalpingAdminDashboard({
      draft: snapshot.draft || readScalpingAdminDraft(),
      registry: registryEnvelope(snapshot),
    }),
  };
}
