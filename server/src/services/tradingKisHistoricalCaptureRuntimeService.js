import { getKisHistoricalCapturePersistenceStatus, readLatestKisHistoricalCaptureSummary } from "../db/tradingKisHistoricalCaptureRepository.js";
import { acquireKisConnectionLease, readKisConnectionLease, releaseKisConnectionLease } from "./tradingKisConnectionLease.js";
import { createKisHistoricalCaptureAccumulator, KIS_HISTORICAL_CAPTURE_SYMBOLS } from "./tradingKisHistoricalCapture.js";
import { createKisHistoricalCaptureRunner } from "./tradingKisHistoricalCaptureRunner.js";
import { assessKisShadowFeedApproval } from "./tradingKisReadOnlyApproval.js";
import { readKisShadowFeedRuntimeStatus } from "./tradingKisShadowFeedRuntimeService.js";

let activeRuntime = null;
const LEASE_OWNER = "kis_historical_capture";

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
  const persistence = await (dependencies.getPersistenceStatus ?? getKisHistoricalCapturePersistenceStatus)({ env }, dependencies);
  const summary = await (dependencies.readSummary ?? readLatestKisHistoricalCaptureSummary)({ env }, dependencies);
  const lease = readKisConnectionLease();
  const reasons = [
    enabled(env) ? null : "kis_historical_capture_feature_flag_disabled",
    ...approval.reasons.filter((reason) => reason !== "explicit_admin_start_required"),
    persistence.schemaReady ? null : persistence.reason,
    lease && lease.owner !== LEASE_OWNER ? `kis_connection_owned_by:${lease.owner}` : null,
  ].filter(Boolean);
  const runner = activeRuntime?.runner.status() || null;

  return {
    ok: true,
    active: runner?.active === true,
    selectedSymbols,
    startEligible: reasons.length === 0 && !activeRuntime,
    blockingReasons: reasons,
    approval,
    persistence,
    summary: {
      totalRows: summary.totalRows,
      latestCapturedMinute: summary.latestCapturedMinute,
      latestRevision: summary.latestRevision,
    },
    runner,
    lease,
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
      approval,
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
