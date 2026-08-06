import { getKisHistoricalCapturePersistenceStatus, readLatestKisHistoricalCaptureSummary } from "../db/tradingKisHistoricalCaptureRepository.js";
import { getDatabasePoolStats } from "../db/database.js";
import { getDeploymentInfo } from "./deploymentInfo.js";
import { acquireKisConnectionLease, readKisConnectionLease, releaseKisConnectionLease } from "./tradingKisConnectionLease.js";
import { createKisHistoricalCaptureAccumulator, KIS_HISTORICAL_CAPTURE_SYMBOLS } from "./tradingKisHistoricalCapture.js";
import { createKisHistoricalCaptureRunner } from "./tradingKisHistoricalCaptureRunner.js";
import {
  assessKisShadowFeedApproval,
  createKisProviderAccessDecision,
  projectKisShadowFeedApprovalPublic,
} from "./tradingKisReadOnlyApproval.js";
import { readKisShadowFeedRuntimeStatus } from "./tradingKisShadowFeedRuntimeService.js";

let activeRuntime = null;
const LEASE_OWNER = "kis_historical_capture";
export const KIS_HISTORICAL_CAPTURE_STATUS_SCHEMA_VERSION = "1.0.0";
export const KIS_HISTORICAL_CAPTURE_RUNTIME_VERSION = "1.0.0";
export const KIS_HISTORICAL_CAPTURE_PERSISTENCE_CONTRACT_VERSION = "20260805";

function clean(value) {
  return String(value ?? "").trim();
}

function enabled(env = process.env) {
  return ["1", "true", "yes", "on"].includes(clean(env.FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED).toLowerCase());
}

function runtimeError(code, message, details = []) {
  const next = new Error(message);
  next.code = code;
  next.statusCode = 409;
  next.details = details;
  return next;
}

function symbols(value) {
  const source = Array.isArray(value) && value.length > 0 ? value : KIS_HISTORICAL_CAPTURE_SYMBOLS;
  return [...new Set(source.map((item) => clean(item).toUpperCase()).filter(Boolean))].sort();
}

function unavailablePersistence(env) {
  return {
    databaseConfigured: Boolean(clean(env.DATABASE_URL)),
    databaseAvailable: false,
    featureEnabled: enabled(env),
    schemaReady: false,
    durable: false,
    mode: "database_unavailable",
    reason: "database_unavailable",
  };
}

function clientDisconnectedError() {
  const error = new Error("Capture status client disconnected.");
  error.code = "CLIENT_DISCONNECTED";
  error.statusCode = 499;
  return error;
}

function isTimeoutError(error) {
  return error?.name === "AbortError"
    || error?.code === "57014"
    || /timeout|timed out/i.test(String(error?.message || ""));
}

function emitLifecycle(dependencies, event, details = {}) {
  try {
    dependencies.onLifecycleEvent?.({ event, ...details });
  } catch {
    // Logging must not change the fail-closed status contract.
  }
}

function redactedRevision(revision) {
  if (!revision) return null;
  return {
    sessionDate: revision.sessionDate,
    selectedSymbols: revision.selectedSymbols,
    coverage: revision.coverage,
    rowCount: revision.rowCount,
    immutable: revision.immutable === true,
    readyForModelResearch: revision.readyForModelResearch === true,
  };
}

export function resetKisHistoricalCaptureRuntimeForTest() {
  activeRuntime = null;
  try {
    if (readKisConnectionLease()?.owner === LEASE_OWNER) releaseKisConnectionLease(LEASE_OWNER);
  } catch {}
}

export async function readKisHistoricalCaptureRuntimeStatus(options = {}, dependencies = {}) {
  const env = options.env ?? dependencies.env ?? process.env;
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const selectedSymbols = symbols(activeRuntime?.selectedSymbols || options.selectedSymbols);
  const appKey = dependencies.appKey ?? env.KIS_TRADING_APP_KEY;
  const appSecret = dependencies.appSecret ?? env.KIS_TRADING_APP_SECRET;
  const approval = assessKisShadowFeedApproval(
    { receipt: options.receipt, explicitStartRequested: options.explicitStartRequested === true },
    { env, nowMs, appKey, appSecret },
  );
  let persistence;
  let summary;
  const monotonicNow = dependencies.monotonicNow ?? (() => performance.now());
  const serviceStartedAt = monotonicNow();
  const poolStats = dependencies.getPoolStats ?? getDatabasePoolStats;
  const poolBefore = poolStats();
  let persistenceMs;
  let summaryMs = 0;
  const lifecycleDetails = () => ({
    databaseConfigured: Boolean(clean(env.DATABASE_URL)),
    schemaReady: persistence?.schemaReady ?? null,
    persistenceMode: persistence?.mode ?? null,
    pool: poolStats(),
  });
  const failIfDisconnected = () => {
    if (dependencies.isClientDisconnected?.() === true) throw clientDisconnectedError();
  };

  try {
    failIfDisconnected();
    const persistenceStartedAt = monotonicNow();
    emitLifecycle(dependencies, "persistence_started", { stageMs: 0, ...lifecycleDetails() });
    try {
      persistence = await (dependencies.getPersistenceStatus ?? getKisHistoricalCapturePersistenceStatus)({ env }, dependencies);
      persistenceMs = monotonicNow() - persistenceStartedAt;
      persistence = {
        ...persistence,
        databaseAvailable: persistence.databaseConfigured ? true : false,
      };
      emitLifecycle(dependencies, "persistence_completed", { stageMs: persistenceMs, ...lifecycleDetails() });
    } catch (error) {
      const failedPersistenceMs = monotonicNow() - persistenceStartedAt;
      emitLifecycle(dependencies, "persistence_failed", { error, stageMs: failedPersistenceMs, ...lifecycleDetails() });
      if (dependencies.isClientDisconnected?.() === true || isTimeoutError(error)) throw error;
      persistenceMs = failedPersistenceMs;
      persistence = unavailablePersistence(env);
      summary = { totalRows: 0, latestCapturedMinute: null, latestRevision: null };
    }

    if (!summary) {
      failIfDisconnected();
      const summaryStartedAt = monotonicNow();
      emitLifecycle(dependencies, "summary_started", { stageMs: 0, ...lifecycleDetails() });
      try {
        summary = await (dependencies.readSummary ?? readLatestKisHistoricalCaptureSummary)({ env, persistence }, dependencies);
        summaryMs = monotonicNow() - summaryStartedAt;
        emitLifecycle(dependencies, "summary_completed", { stageMs: summaryMs, ...lifecycleDetails() });
        failIfDisconnected();
      } catch (error) {
        summaryMs = monotonicNow() - summaryStartedAt;
        emitLifecycle(dependencies, "summary_failed", { error, stageMs: summaryMs, ...lifecycleDetails() });
        if (dependencies.isClientDisconnected?.() === true || isTimeoutError(error)) throw error;
        persistence = unavailablePersistence(env);
        summary = { totalRows: 0, latestCapturedMinute: null, latestRevision: null };
      }
    }
  } catch (error) {
    emitLifecycle(dependencies, "service_failed", {
      error,
      stageMs: monotonicNow() - serviceStartedAt,
      ...lifecycleDetails(),
    });
    throw error;
  }
  const lease = readKisConnectionLease();
  const reasons = [
    enabled(env) ? null : "kis_historical_capture_feature_flag_disabled",
    ...approval.reasons.filter((reason) => reason !== "explicit_admin_start_required"),
    persistence.schemaReady ? null : persistence.reason,
    lease && lease.owner !== LEASE_OWNER ? `kis_connection_owned_by:${lease.owner}` : null,
  ].filter(Boolean);
  const runner = activeRuntime?.runner.status() || null;
  const deployment = (dependencies.getDeploymentInfo ?? getDeploymentInfo)();

  const status = {
    schemaVersion: KIS_HISTORICAL_CAPTURE_STATUS_SCHEMA_VERSION,
    runtimeVersion: KIS_HISTORICAL_CAPTURE_RUNTIME_VERSION,
    persistenceContractVersion: KIS_HISTORICAL_CAPTURE_PERSISTENCE_CONTRACT_VERSION,
    deploymentSha: deployment.commitSha || null,
    checkedAt: new Date(nowMs).toISOString(),
    ok: true,
    active: runner?.active === true,
    selectedSymbols,
    startEligible: reasons.length === 0 && !activeRuntime,
    blockingReasons: reasons,
    approval: projectKisShadowFeedApprovalPublic(approval),
    persistence,
    summary: {
      totalRows: summary.totalRows,
      latestCapturedMinute: summary.latestCapturedMinute,
      latestRevision: redactedRevision(summary.latestRevision),
    },
    runner,
    lease,
    diagnostics: {
      timingMs: {
        persistence: Math.round(persistenceMs),
        summary: Math.round(summaryMs),
        service: Math.round(monotonicNow() - serviceStartedAt),
      },
      pool: {
        before: poolBefore,
        after: poolStats(),
      },
    },
    safety: {
      adminOnly: true,
      captureOnly: true,
      marketDataOnly: true,
      accountCallsAllowed: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      credentialsExposed: false,
      credentialsPersisted: false,
      rawProviderPayloadStored: false,
      automaticModelApprovalAllowed: false,
      automaticRuntimeRegistrationAllowed: false,
    },
  };
  emitLifecycle(dependencies, "service_completed", {
    stageMs: monotonicNow() - serviceStartedAt,
    ...lifecycleDetails(),
  });
  return status;
}

export async function startKisHistoricalCaptureRuntime(input = {}, options = {}, dependencies = {}) {
  if (activeRuntime) throw runtimeError("KIS_HISTORICAL_CAPTURE_ALREADY_ACTIVE", "KIS historical capture is already active.");
  const env = options.env ?? dependencies.env ?? process.env;
  const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
  const selectedSymbols = symbols(input.selectedSymbols);
  const appKey = dependencies.appKey ?? env.KIS_TRADING_APP_KEY;
  const appSecret = dependencies.appSecret ?? env.KIS_TRADING_APP_SECRET;
  const approval = assessKisShadowFeedApproval(
    { receipt: input.receipt, explicitStartRequested: true },
    { env, nowMs, appKey, appSecret },
  );
  const shadowFeed = await (dependencies.readShadowFeedStatus ?? readKisShadowFeedRuntimeStatus)({ env, nowMs }, dependencies);
  const persistence = await (dependencies.getPersistenceStatus ?? getKisHistoricalCapturePersistenceStatus)({ env }, dependencies);
  const reasons = [
    enabled(env) ? null : "kis_historical_capture_feature_flag_disabled",
    ...approval.reasons,
    shadowFeed.active === true ? "kis_shadow_feed_active" : null,
    persistence.schemaReady ? null : persistence.reason,
  ].filter(Boolean);
  if (reasons.length > 0) {
    throw runtimeError("KIS_HISTORICAL_CAPTURE_START_BLOCKED", "KIS historical capture preflight is not ready.", reasons);
  }
  const providerAccessDecision = createKisProviderAccessDecision(approval);

  acquireKisConnectionLease(LEASE_OWNER, { mode: "capture_only", selectedSymbols });
  const accumulatorFactory = dependencies.accumulatorFactory ?? createKisHistoricalCaptureAccumulator;
  const runnerFactory = dependencies.runnerFactory ?? createKisHistoricalCaptureRunner;
  const accumulator = accumulatorFactory(
    { selectedSymbols, env, actor: clean(options.actor) || "admin_console" },
    dependencies,
  );
  const runner = runnerFactory(
    {
      selectedSymbols,
      providerAccessDecision,
      maximumCycleLagMs: input.maximumCycleLagMs,
      maximumQuoteAgeMs: input.maximumQuoteAgeMs,
      flushIntervalMs: input.flushIntervalMs,
      calendarOverrides: input.calendarOverrides,
    },
    {
      ...dependencies,
      accumulator,
      now: dependencies.now ?? Date.now,
    },
  );

  try {
    const runnerStatus = await runner.start({
      appKey,
      appSecret,
      maxReconnectAttempts: input.maxReconnectAttempts,
      reconnectPolicy: input.reconnectPolicy,
    });
    if (!runnerStatus.active) {
      releaseKisConnectionLease(LEASE_OWNER);
      throw runtimeError(
        "KIS_HISTORICAL_CAPTURE_CONNECTION_BLOCKED",
        "KIS historical capture provider connection did not start.",
        [runnerStatus.lastError?.code || runnerStatus.state],
      );
    }
    activeRuntime = { runner, accumulator, selectedSymbols, startedBy: clean(options.actor) || "admin_console" };
    return readKisHistoricalCaptureRuntimeStatus(
      { env, receipt: input.receipt, explicitStartRequested: true, nowMs },
      dependencies,
    );
  } catch (nextError) {
    if (readKisConnectionLease()?.owner === LEASE_OWNER) releaseKisConnectionLease(LEASE_OWNER);
    throw nextError;
  }
}

export async function stopKisHistoricalCaptureRuntime(input = {}, options = {}, dependencies = {}) {
  if (!activeRuntime) throw runtimeError("KIS_HISTORICAL_CAPTURE_NOT_ACTIVE", "KIS historical capture is not active.");
  const current = activeRuntime;
  const runner = await current.runner.stop(clean(input.reason) || "admin_console_operator_stop");
  activeRuntime = null;
  releaseKisConnectionLease(LEASE_OWNER);
  const status = await readKisHistoricalCaptureRuntimeStatus(
    { env: options.env ?? dependencies.env ?? process.env },
    dependencies,
  );
  return { ...status, runner, active: false };
}

export async function sealKisHistoricalCaptureSession(input = {}, options = {}, dependencies = {}) {
  const env = options.env ?? dependencies.env ?? process.env;
  const selectedSymbols = symbols(input.selectedSymbols || activeRuntime?.selectedSymbols);
  const accumulatorFactory = dependencies.accumulatorFactory ?? createKisHistoricalCaptureAccumulator;
  const accumulator = activeRuntime?.accumulator || accumulatorFactory(
    { selectedSymbols, env, actor: clean(options.actor) || "admin_console" },
    dependencies,
  );
  return accumulator.sealSession({
    sessionDate: input.sessionDate,
    expectedMinutes: input.expectedMinutes,
    minimumCoverageRatio: input.minimumCoverageRatio,
    sealedAt: input.sealedAt,
    actor: clean(options.actor) || "admin_console",
  });
}
