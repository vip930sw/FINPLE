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

export async function readScalpingStrategyAdminDashboard(options = {}, dependencies = {}) {
  const snapshot = await getTradingStrategyRegistrySnapshot(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );
  const draft = snapshot.draft
    ? replaceScalpingAdminDraftForRegistry(snapshot.draft)
    : readScalpingAdminDraft();
  return buildTradingScalpingAdminDashboard({
    draft,
    performanceSnapshot: options.performanceSnapshot,
    registry: registryEnvelope(snapshot),
    checkedAt: options.checkedAt,
  });
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
