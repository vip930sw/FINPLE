import {
  getLatestKisFeedCheckpoint,
  saveKisFeedCheckpoint,
} from "../db/tradingKisFeedCheckpointRepository.js";
import { createKisFeedOperationalGuard } from "./tradingKisFeedOperationalGuard.js";
import { readKisProviderAccessDecision } from "./tradingKisReadOnlyApproval.js";
import { getUsEquityMarketSession } from "./tradingUsEquityMarketCalendar.js";

export const KIS_FEED_OPERATIONAL_SUPERVISOR_VERSION = "kis-shadow-feed-operational-supervisor-v1";

const DEFAULT_WATCHDOG_INTERVAL_MS = 1_000;
const DEFAULT_CHECKPOINT_INTERVAL_MS = 30_000;
const DEFAULT_PREOPEN_START_WINDOW_MINUTES = 15;

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function supervisorError(code, message, statusCode = 409, details = []) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

export function buildKisFeedRecoveryState(checkpoint) {
  if (!checkpoint) {
    return {
      checkpointAvailable: false,
      manualResumeRequired: false,
      automaticResumeAllowed: false,
      priorOperationalState: null,
      priorStopReason: null,
      checkpointAt: null,
    };
  }
  return {
    checkpointAvailable: true,
    manualResumeRequired: checkpoint.manualResumeRequired !== false,
    automaticResumeAllowed: false,
    priorOperationalState: checkpoint.operationalState || null,
    priorStopReason: checkpoint.stopReason || checkpoint.guard?.trip?.code || null,
    checkpointAt: checkpoint.createdAt || null,
    priorShadowRunId: checkpoint.shadowRunId || null,
    priorStrategyVersionId: checkpoint.strategyVersionId || null,
    priorSelectedSymbols: checkpoint.selectedSymbols || [],
  };
}

export async function readKisFeedRecoveryState(options = {}, dependencies = {}) {
  const readLatest = dependencies.getLatestCheckpoint ?? getLatestKisFeedCheckpoint;
  const latest = await readLatest(options, dependencies);
  return {
    recovery: buildKisFeedRecoveryState(latest.checkpoint),
    persistence: latest.persistence,
  };
}

export function createKisFeedOperationalSupervisor(options = {}, dependencies = {}) {
  const runner = options.runner;
  if (!runner || typeof runner.start !== "function" || typeof runner.stop !== "function" || typeof runner.status !== "function") {
    throw supervisorError("INVALID_KIS_FEED_SUPERVISOR_RUNNER", "운영 Supervisor에 유효한 KIS feed runner가 필요합니다.", 500);
  }
  const now = dependencies.now ?? Date.now;
  const setIntervalImpl = dependencies.setIntervalImpl ?? setInterval;
  const clearIntervalImpl = dependencies.clearIntervalImpl ?? clearInterval;
  const marketSessionResolver = dependencies.marketSessionResolver ?? getUsEquityMarketSession;
  const saveCheckpoint = dependencies.saveCheckpoint ?? saveKisFeedCheckpoint;
  const guardFactory = dependencies.guardFactory ?? createKisFeedOperationalGuard;
  const providerAccess = readKisProviderAccessDecision(options.providerAccessDecision);
  const watchdogIntervalMs = finite(options.watchdogIntervalMs, DEFAULT_WATCHDOG_INTERVAL_MS);
  const checkpointIntervalMs = finite(options.checkpointIntervalMs, DEFAULT_CHECKPOINT_INTERVAL_MS);
  const preopenStartWindowMinutes = finite(
    options.preopenStartWindowMinutes,
    DEFAULT_PREOPEN_START_WINDOW_MINUTES,
  );
  const guard = guardFactory(
    {
      policy: options.guardPolicy,
      calendarOverrides: options.calendarOverrides,
    },
    {
      now,
      marketSessionResolver,
    },
  );

  let active = false;
  let watchdogTimer = null;
  let startedAt = null;
  let stoppedAt = null;
  let stoppedReason = null;
  let latestRunnerStatus = runner.status();
  let latestGuardStatus = guard.snapshot(latestRunnerStatus, now());
  let lastCheckpointAtMs = null;
  let checkpointPersistence = null;
  let lastCheckpointError = null;
  let queue = Promise.resolve();

  const checkpointPayload = () => ({
    shadowRunId: options.shadowRunId,
    strategyVersionId: options.strategyVersionId,
    strategyVersionNumber: options.strategyVersionNumber,
    operationalState: latestGuardStatus.state || latestRunnerStatus.state || "unknown",
    runner: latestRunnerStatus,
    guard: latestGuardStatus,
    approval: providerAccess?.publicApproval || null,
    selectedSymbols: options.selectedSymbols || [],
    stopReason: stoppedReason,
    manualResumeRequired: true,
  });

  const persist = async (actor = "kis_feed_supervisor") => {
    try {
      const result = await saveCheckpoint(
        checkpointPayload(),
        { actor, env: options.env, createdAt: new Date(now()).toISOString() },
        dependencies,
      );
      checkpointPersistence = result.persistence;
      lastCheckpointAtMs = now();
      lastCheckpointError = null;
      return result;
    } catch (error) {
      lastCheckpointError = {
        code: clean(error?.code || error?.name) || "checkpoint_write_failed",
        at: new Date(now()).toISOString(),
      };
      return null;
    }
  };

  const stopTimers = () => {
    if (watchdogTimer) clearIntervalImpl(watchdogTimer);
    watchdogTimer = null;
  };

  const watchdogTick = async () => {
    if (!active) return;
    latestRunnerStatus = runner.status();
    latestGuardStatus = guard.evaluate(latestRunnerStatus, now());
    if (latestGuardStatus.tripped) {
      active = false;
      stoppedAt = new Date(now()).toISOString();
      stoppedReason = `circuit_breaker:${latestGuardStatus.trip?.code || "unknown"}`;
      stopTimers();
      latestRunnerStatus = await runner.stop(stoppedReason);
      latestGuardStatus = guard.snapshot(latestRunnerStatus, now());
      await persist("kis_feed_circuit_breaker");
      return;
    }
    if (lastCheckpointAtMs === null || now() - lastCheckpointAtMs >= checkpointIntervalMs) {
      await persist("kis_feed_watchdog");
    }
  };

  const status = () => ({
    version: KIS_FEED_OPERATIONAL_SUPERVISOR_VERSION,
    active,
    startedAt,
    stoppedAt,
    stoppedReason,
    runner: latestRunnerStatus,
    guard: latestGuardStatus,
    checkpoint: {
      lastCheckpointAt: lastCheckpointAtMs === null ? null : new Date(lastCheckpointAtMs).toISOString(),
      persistence: checkpointPersistence,
      lastError: lastCheckpointError,
      manualResumeRequired: true,
      automaticResumeAllowed: false,
    },
    safety: {
      marketDataOnly: true,
      automaticRestartAllowed: false,
      automaticLiveActivationAllowed: false,
      accountCallsAllowed: false,
      orderSubmissionAllowed: false,
      credentialsPersisted: false,
      rawProviderPayloadStored: false,
    },
  });

  return {
    async start(input = {}) {
      if (active) return status();
      const startMs = now();
      const session = marketSessionResolver(startMs, { overrideByDate: options.calendarOverrides || {} });
      const allowedPreopen = session.state === "PREOPEN" && Number(session.minutesToOpen) <= preopenStartWindowMinutes;
      if (!session.calendarSupported) {
        throw supervisorError("KIS_FEED_CALENDAR_UNSUPPORTED", "지원되지 않는 미국시장 캘린더 연도입니다.", 409, [session.reason]);
      }
      if (session.state !== "REGULAR" && !allowedPreopen) {
        throw supervisorError(
          "KIS_FEED_MARKET_SESSION_CLOSED",
          "KIS Shadow feed는 정규장 또는 개장 직전 승인 구간에서만 시작할 수 있습니다.",
          409,
          [session.reason || session.state],
        );
      }

      latestGuardStatus = guard.start({
        approvalExpiresAtMs: providerAccess?.approvalExpiresAtMs,
        nowMs: startMs,
        runnerStatus: latestRunnerStatus,
      });
      latestRunnerStatus = await runner.start(input);
      active = latestRunnerStatus.active === true;
      if (!active) {
        stoppedReason = latestRunnerStatus.lastError?.code || latestRunnerStatus.state || "runner_start_blocked";
        latestGuardStatus = guard.stop(stoppedReason, now());
        await persist(clean(options.startedBy) || "admin_console");
        throw supervisorError("KIS_FEED_RUNNER_START_BLOCKED", "KIS feed runner가 시작되지 않았습니다.", 503, [stoppedReason]);
      }

      startedAt = new Date(startMs).toISOString();
      stoppedAt = null;
      stoppedReason = null;
      latestGuardStatus = guard.evaluate(latestRunnerStatus, now());
      await persist(clean(options.startedBy) || "admin_console");
      watchdogTimer = setIntervalImpl(() => {
        queue = queue.then(watchdogTick).catch(() => {});
      }, Math.max(250, watchdogIntervalMs));
      return status();
    },

    async stop(reason = "operator_stop", actor = "admin_console") {
      if (!active) return status();
      active = false;
      stopTimers();
      await queue;
      stoppedAt = new Date(now()).toISOString();
      stoppedReason = clean(reason) || "operator_stop";
      latestRunnerStatus = await runner.stop(stoppedReason);
      latestGuardStatus = guard.stop(stoppedReason, now());
      await persist(actor);
      return status();
    },

    async tick() {
      queue = queue.then(watchdogTick);
      await queue;
      return status();
    },

    status,
  };
}
