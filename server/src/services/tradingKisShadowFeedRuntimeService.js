import {
  getTradingStrategyRegistrySnapshot,
  SCALPING_STRATEGY_REGISTRY_KEY,
} from "../db/tradingStrategyRegistryRepository.js";
import { createKisCompletedBarFeedRunner } from "./tradingKisCompletedBarFeedRunner.js";
import { assessKisShadowFeedApproval } from "./tradingKisReadOnlyApproval.js";
import {
  ingestScalpingShadowCycle,
  readScalpingShadowRuntimeStatus,
} from "./tradingScalpingShadowRuntimeService.js";

let activeFeedRuntime = null;

function clean(value) {
  return String(value ?? "").trim();
}

function runtimeError(code, message, statusCode = 409, details = []) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function resolveApprovedVersion(registry, strategyVersionId) {
  return (registry.versions || []).find(
    (version) => version.id === strategyVersionId && version.status === "approved",
  ) || null;
}

function publicEnvelope(input = {}) {
  return {
    ok: true,
    active: input.active === true,
    runner: input.runner || null,
    preflight: input.preflight,
    shadow: input.shadow,
    strategy: input.strategy || null,
    safety: {
      adminOnly: true,
      marketDataOnly: true,
      providerConnectionStarted: input.active === true,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      credentialsExposed: false,
      credentialsPersisted: false,
      rawProviderPayloadStored: false,
    },
  };
}

export function resetKisShadowFeedRuntimeForTest() {
  activeFeedRuntime = null;
}

export async function readKisShadowFeedRuntimeStatus(options = {}, dependencies = {}) {
  const env = options.env ?? dependencies.env ?? process.env;
  const readShadowStatus = dependencies.readShadowStatus ?? readScalpingShadowRuntimeStatus;
  const getRegistry = dependencies.getRegistrySnapshot ?? getTradingStrategyRegistrySnapshot;
  const shadow = await readShadowStatus({}, dependencies);
  const registry = await getRegistry({ strategyKey: SCALPING_STRATEGY_REGISTRY_KEY }, dependencies);
  const strategyVersionId = activeFeedRuntime?.strategyVersionId || shadow.snapshot?.strategyVersionId || null;
  const approvedVersion = strategyVersionId ? resolveApprovedVersion(registry, strategyVersionId) : null;
  const preflight = assessKisShadowFeedApproval(
    {
      receipt: options.receipt,
      explicitStartRequested: options.explicitStartRequested === true,
    },
    {
      env,
      nowMs: options.nowMs,
      appKey: dependencies.appKey,
      appSecret: dependencies.appSecret,
    },
  );
  const nonStartReasons = preflight.reasons.filter((reason) => reason !== "explicit_admin_start_required");
  const strategy = approvedVersion ? {
    id: approvedVersion.id,
    versionNumber: approvedVersion.versionNumber,
    checksum: approvedVersion.checksum,
    selectedSymbols: approvedVersion.strategy?.allowedSymbols || [],
    requireModelSignal: approvedVersion.strategy?.requireModelSignal === true,
    externalModelSignalAvailable: typeof dependencies.modelSignalProvider === "function",
    tradeSignalGenerationExpected:
      approvedVersion.strategy?.requireModelSignal !== true || typeof dependencies.modelSignalProvider === "function",
  } : null;
  return publicEnvelope({
    active: Boolean(activeFeedRuntime),
    runner: activeFeedRuntime?.runner.status() || null,
    preflight: {
      ...preflight,
      startEligible:
        nonStartReasons.length === 0 &&
        shadow.active === true &&
        Boolean(approvedVersion),
      blockingReasons: [
        ...nonStartReasons,
        shadow.active === true ? null : "active_shadow_run_required",
        approvedVersion ? null : "active_shadow_strategy_version_not_approved",
      ].filter(Boolean),
    },
    shadow: {
      active: shadow.active === true,
      runId: shadow.snapshot?.runId || null,
      strategyVersionId: shadow.snapshot?.strategyVersionId || null,
      strategyVersionNumber: shadow.snapshot?.strategyVersionNumber || null,
    },
    strategy,
  });
}

export async function startKisShadowFeedRuntime(input = {}, options = {}, dependencies = {}) {
  if (activeFeedRuntime) {
    throw runtimeError("KIS_SHADOW_FEED_ALREADY_ACTIVE", "이미 실행 중인 KIS Shadow feed가 있습니다.");
  }
  const env = options.env ?? dependencies.env ?? process.env;
  const readShadowStatus = dependencies.readShadowStatus ?? readScalpingShadowRuntimeStatus;
  const getRegistry = dependencies.getRegistrySnapshot ?? getTradingStrategyRegistrySnapshot;
  const shadow = await readShadowStatus({}, dependencies);
  if (!shadow.active || !shadow.snapshot?.strategyVersionId) {
    throw runtimeError("ACTIVE_SHADOW_RUN_REQUIRED", "KIS feed 시작 전에 승인 전략 기반 Shadow run이 실행 중이어야 합니다.");
  }
  const registry = await getRegistry({ strategyKey: SCALPING_STRATEGY_REGISTRY_KEY }, dependencies);
  const approvedVersion = resolveApprovedVersion(registry, shadow.snapshot.strategyVersionId);
  if (!approvedVersion) {
    throw runtimeError("APPROVED_SHADOW_STRATEGY_REQUIRED", "실행 중인 Shadow run의 승인 전략 버전을 찾지 못했습니다.");
  }
  const appKey = dependencies.appKey ?? env.KIS_TRADING_APP_KEY;
  const appSecret = dependencies.appSecret ?? env.KIS_TRADING_APP_SECRET;
  const approval = assessKisShadowFeedApproval(
    { receipt: input.receipt, explicitStartRequested: true },
    { env, nowMs: options.nowMs, appKey, appSecret },
  );
  if (!approval.ready) {
    throw runtimeError(
      "KIS_SHADOW_FEED_APPROVAL_BLOCKED",
      "KIS 읽기전용 Shadow feed 승인이 준비되지 않았습니다.",
      409,
      approval.reasons,
    );
  }

  const runnerFactory = dependencies.runnerFactory ?? createKisCompletedBarFeedRunner;
  const runner = runnerFactory(
    {
      selectedSymbols: approvedVersion.strategy.allowedSymbols,
      approval,
      activeShadowRun: true,
      maximumCycleLagMs: input.maximumCycleLagMs,
      maximumQuoteAgeMs: input.maximumQuoteAgeMs,
      flushIntervalMs: input.flushIntervalMs,
    },
    {
      fetchImpl: dependencies.fetchImpl,
      webSocketFactory: dependencies.webSocketFactory,
      setTimeoutImpl: dependencies.setTimeoutImpl,
      clearTimeoutImpl: dependencies.clearTimeoutImpl,
      setIntervalImpl: dependencies.setIntervalImpl,
      clearIntervalImpl: dependencies.clearIntervalImpl,
      now: dependencies.now,
      feedFactory: dependencies.feedFactory,
      aggregatorFactory: dependencies.aggregatorFactory,
      ingestShadowCycle: dependencies.ingestShadowCycle ?? ingestScalpingShadowCycle,
      modelSignalProvider: dependencies.modelSignalProvider,
    },
  );
  const runnerStatus = await runner.start({
    appKey,
    appSecret,
    maxReconnectAttempts: input.maxReconnectAttempts,
    reconnectPolicy: input.reconnectPolicy,
  });
  if (["blocked", "closed"].includes(runnerStatus.state) && runnerStatus.active !== true) {
    throw runtimeError(
      "KIS_SHADOW_FEED_CONNECTION_BLOCKED",
      "KIS Shadow feed 연결이 차단되었습니다.",
      503,
      [runnerStatus.lastError?.code || runnerStatus.state],
    );
  }
  activeFeedRuntime = {
    runner,
    strategyVersionId: approvedVersion.id,
    startedBy: clean(options.actor) || "admin_console",
  };
  return readKisShadowFeedRuntimeStatus(
    { env, receipt: input.receipt, explicitStartRequested: true, nowMs: options.nowMs },
    dependencies,
  );
}

export async function stopKisShadowFeedRuntime(input = {}, options = {}, dependencies = {}) {
  if (!activeFeedRuntime) {
    throw runtimeError("KIS_SHADOW_FEED_NOT_ACTIVE", "실행 중인 KIS Shadow feed가 없습니다.");
  }
  const current = activeFeedRuntime;
  const runnerStatus = await current.runner.stop(clean(input.reason) || "admin_console_operator_stop");
  activeFeedRuntime = null;
  const status = await readKisShadowFeedRuntimeStatus(
    { env: options.env ?? dependencies.env ?? process.env, nowMs: options.nowMs },
    dependencies,
  );
  return {
    ...status,
    runner: runnerStatus,
    active: false,
  };
}
