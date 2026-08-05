import {
  getTradingStrategyRegistrySnapshot,
  SCALPING_STRATEGY_REGISTRY_KEY,
} from "../db/tradingStrategyRegistryRepository.js";
import { createKisCompletedBarFeedRunner } from "./tradingKisCompletedBarFeedRunner.js";
import {
  createKisFeedOperationalSupervisor,
  readKisFeedRecoveryState,
} from "./tradingKisFeedOperationalSupervisor.js";
import { assessKisShadowFeedApproval } from "./tradingKisReadOnlyApproval.js";
import { getUsEquityMarketSession } from "./tradingUsEquityMarketCalendar.js";
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

function resolveNowMs(options = {}, dependencies = {}) {
  if (Number.isFinite(Number(options.nowMs))) return Number(options.nowMs);
  if (typeof dependencies.now === "function") return Number(dependencies.now());
  return Date.now();
}

function publicEnvelope(input = {}) {
  return {
    ok: true,
    active: input.active === true,
    acknowledgementRequired: input.acknowledgementRequired === true,
    runner: input.runner || null,
    operations: input.operations || null,
    recovery: input.recovery || null,
    preflight: input.preflight,
    shadow: input.shadow,
    strategy: input.strategy || null,
    safety: {
      adminOnly: true,
      marketDataOnly: true,
      providerConnectionStarted: input.active === true,
      automaticRestartAllowed: false,
      automaticLiveActivationAllowed: false,
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
  const nowMs = resolveNowMs(options, dependencies);
  const readShadowStatus = dependencies.readShadowStatus ?? readScalpingShadowRuntimeStatus;
  const getRegistry = dependencies.getRegistrySnapshot ?? getTradingStrategyRegistrySnapshot;
  const marketSessionResolver = dependencies.marketSessionResolver ?? getUsEquityMarketSession;
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
      nowMs,
      appKey: dependencies.appKey,
      appSecret: dependencies.appSecret,
    },
  );
  const marketSession = marketSessionResolver(nowMs, {
    overrideByDate: options.calendarOverrides || {},
  });
  const allowedPreopen = marketSession.state === "PREOPEN" && Number(marketSession.minutesToOpen) <= 15;
  const marketStartEligible = marketSession.calendarSupported === true && (marketSession.state === "REGULAR" || allowedPreopen);
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
  const operations = activeFeedRuntime?.supervisor.status() || null;
  const runtimeActive = operations?.active === true;
  const acknowledgementRequired = Boolean(activeFeedRuntime) && !runtimeActive;
  const recoveryResult = operations
    ? { recovery: null, persistence: operations.checkpoint?.persistence || null }
    : await (dependencies.readRecoveryState ?? readKisFeedRecoveryState)(
        { env },
        dependencies,
      );

  return publicEnvelope({
    active: runtimeActive,
    acknowledgementRequired,
    runner: operations?.runner || null,
    operations: operations || {
      active: false,
      guard: null,
      checkpoint: {
        persistence: recoveryResult.persistence,
        manualResumeRequired: recoveryResult.recovery?.manualResumeRequired === true,
        automaticResumeAllowed: false,
      },
    },
    recovery: recoveryResult.recovery,
    preflight: {
      ...preflight,
      marketSession,
      startEligible:
        nonStartReasons.length === 0 &&
        shadow.active === true &&
        Boolean(approvedVersion) &&
        marketStartEligible &&
        !acknowledgementRequired,
      blockingReasons: [
        ...nonStartReasons,
        shadow.active === true ? null : "active_shadow_run_required",
        approvedVersion ? null : "active_shadow_strategy_version_not_approved",
        marketSession.calendarSupported ? null : "calendar_unsupported",
        marketStartEligible ? null : "market_session_not_open_for_feed_start",
        acknowledgementRequired ? "circuit_breaker_acknowledgement_required" : null,
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
    throw runtimeError("KIS_SHADOW_FEED_ALREADY_ACTIVE", "기존 KIS Shadow feed 상태를 먼저 정지 또는 확인 해제해야 합니다.");
  }
  const env = options.env ?? dependencies.env ?? process.env;
  const nowMs = resolveNowMs(options, dependencies);
  const now = dependencies.now ?? (() => nowMs);
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
    { env, nowMs, appKey, appSecret },
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
      calendarOverrides: input.calendarOverrides,
    },
    {
      fetchImpl: dependencies.fetchImpl,
      webSocketFactory: dependencies.webSocketFactory,
      setTimeoutImpl: dependencies.setTimeoutImpl,
      clearTimeoutImpl: dependencies.clearTimeoutImpl,
      setIntervalImpl: dependencies.setIntervalImpl,
      clearIntervalImpl: dependencies.clearIntervalImpl,
      now,
      feedFactory: dependencies.feedFactory,
      aggregatorFactory: dependencies.aggregatorFactory,
      marketSessionResolver: dependencies.marketSessionResolver,
      ingestShadowCycle: dependencies.ingestShadowCycle ?? ingestScalpingShadowCycle,
      modelSignalProvider: dependencies.modelSignalProvider,
    },
  );

  const supervisorFactory = dependencies.supervisorFactory ?? createKisFeedOperationalSupervisor;
  const supervisor = supervisorFactory(
    {
      runner,
      env,
      approval,
      shadowRunId: shadow.snapshot.runId,
      strategyVersionId: approvedVersion.id,
      strategyVersionNumber: approvedVersion.versionNumber,
      selectedSymbols: approvedVersion.strategy.allowedSymbols,
      startedBy: clean(options.actor) || "admin_console",
      watchdogIntervalMs: input.watchdogIntervalMs,
      checkpointIntervalMs: input.checkpointIntervalMs,
      preopenStartWindowMinutes: input.preopenStartWindowMinutes,
      guardPolicy: input.guardPolicy,
      calendarOverrides: input.calendarOverrides,
    },
    {
      ...dependencies,
      now,
      marketSessionResolver: dependencies.marketSessionResolver,
    },
  );
  const operationalStatus = await supervisor.start({
    appKey,
    appSecret,
    maxReconnectAttempts: input.maxReconnectAttempts,
    reconnectPolicy: input.reconnectPolicy,
  });
  activeFeedRuntime = {
    supervisor,
    strategyVersionId: approvedVersion.id,
    startedBy: clean(options.actor) || "admin_console",
    receipt: input.receipt,
  };
  return readKisShadowFeedRuntimeStatus(
    {
      env,
      receipt: input.receipt,
      explicitStartRequested: true,
      nowMs,
      calendarOverrides: input.calendarOverrides,
    },
    dependencies,
  ).then((status) => ({ ...status, operations: operationalStatus, runner: operationalStatus.runner }));
}

export async function stopKisShadowFeedRuntime(input = {}, options = {}, dependencies = {}) {
  if (!activeFeedRuntime) {
    throw runtimeError("KIS_SHADOW_FEED_NOT_ACTIVE", "확인 또는 정지할 KIS Shadow feed 상태가 없습니다.");
  }
  const current = activeFeedRuntime;
  const operationalStatus = await current.supervisor.stop(
    clean(input.reason) || "admin_console_operator_stop",
    clean(options.actor) || "admin_console",
  );
  activeFeedRuntime = null;
  const status = await readKisShadowFeedRuntimeStatus(
    {
      env: options.env ?? dependencies.env ?? process.env,
      nowMs: resolveNowMs(options, dependencies),
    },
    dependencies,
  );
  return {
    ...status,
    operations: operationalStatus,
    runner: operationalStatus.runner,
    active: false,
    acknowledgementRequired: false,
  };
}
