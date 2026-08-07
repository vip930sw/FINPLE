import { getUsEquityMarketSession } from "./tradingUsEquityMarketCalendar.js";

export const KIS_FEED_OPERATIONAL_GUARD_VERSION = "kis-shadow-feed-operational-guard-v1";

export const DEFAULT_KIS_FEED_OPERATIONAL_POLICY = Object.freeze({
  initialHeartbeatGraceMs: 45_000,
  providerHeartbeatWarningMs: 8_000,
  providerHeartbeatTripMs: 15_000,
  completedCycleGraceMs: 120_000,
  completedCycleTripMs: 120_000,
  reconnectStateTripMs: 60_000,
  protocolIssueWindowMs: 60_000,
  maximumProtocolIssuesPerWindow: 5,
  staleQuoteWindowMs: 60_000,
  maximumStaleQuotesPerWindow: 5,
  incompleteCycleWindowMs: 10 * 60_000,
  maximumIncompleteCyclesPerWindow: 3,
  approvalExpiryWarningMs: 15 * 60_000,
  maximumAlerts: 50,
});

function finite(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizePolicy(input = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_KIS_FEED_OPERATIONAL_POLICY).map(([key, fallback]) => {
      const value = finite(input[key]);
      return [key, value !== null && value >= 0 ? value : fallback];
    }),
  );
}

function iso(timestampMs) {
  return Number.isFinite(timestampMs) ? new Date(timestampMs).toISOString() : null;
}

function epoch(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function trimWindow(rows, nowMs, windowMs) {
  while (rows.length > 0 && rows[0] < nowMs - windowMs) rows.shift();
}

function appendDelta(rows, delta, nowMs, maximumAppend) {
  const count = Math.max(0, Math.min(Math.floor(delta || 0), maximumAppend));
  for (let index = 0; index < count; index += 1) rows.push(nowMs);
}

export function createKisFeedOperationalGuard(options = {}, dependencies = {}) {
  const policy = normalizePolicy(options.policy);
  const now = dependencies.now ?? Date.now;
  const marketSessionResolver = dependencies.marketSessionResolver ?? getUsEquityMarketSession;
  const calendarOverrides = options.calendarOverrides || {};
  let state = "created";
  let startedAtMs = null;
  let stoppedAtMs = null;
  let approvalExpiresAtMs = null;
  let trip = null;
  let lastRunnerState = "";
  let runnerStateSinceMs = null;
  let lastEvaluationAtMs = null;
  let lastCounters = {
    protocolIssueCount: 0,
    staleQuoteBarCount: 0,
    incompleteCycleCount: 0,
  };
  const windows = {
    protocolIssues: [],
    staleQuotes: [],
    incompleteCycles: [],
  };
  const alerts = [];
  const lastAlertAtByCode = new Map();

  const addAlert = (severity, code, message, atMs, details = {}) => {
    const previousAt = lastAlertAtByCode.get(code);
    if (previousAt !== undefined && atMs - previousAt < 60_000 && severity !== "critical") return;
    lastAlertAtByCode.set(code, atMs);
    alerts.push({
      severity,
      code,
      message,
      at: iso(atMs),
      details,
    });
    if (alerts.length > policy.maximumAlerts) alerts.splice(0, alerts.length - policy.maximumAlerts);
  };

  const tripBreaker = (code, message, atMs, details = {}) => {
    if (trip) return;
    trip = { code, message, at: iso(atMs), details };
    state = "tripped";
    addAlert("critical", code, message, atMs, details);
  };

  const recordCounterDeltas = (runnerStatus, nowMs) => {
    const next = {
      protocolIssueCount: Math.max(0, Number(runnerStatus.protocolIssueCount || 0)),
      staleQuoteBarCount: Math.max(0, Number(runnerStatus.staleQuoteBarCount || 0)),
      incompleteCycleCount: Math.max(0, Number(runnerStatus.incompleteCycleCount || 0)),
    };
    appendDelta(
      windows.protocolIssues,
      Math.max(0, next.protocolIssueCount - lastCounters.protocolIssueCount),
      nowMs,
      policy.maximumProtocolIssuesPerWindow,
    );
    appendDelta(
      windows.staleQuotes,
      Math.max(0, next.staleQuoteBarCount - lastCounters.staleQuoteBarCount),
      nowMs,
      policy.maximumStaleQuotesPerWindow,
    );
    appendDelta(
      windows.incompleteCycles,
      Math.max(0, next.incompleteCycleCount - lastCounters.incompleteCycleCount),
      nowMs,
      policy.maximumIncompleteCyclesPerWindow,
    );
    lastCounters = next;
    trimWindow(windows.protocolIssues, nowMs, policy.protocolIssueWindowMs);
    trimWindow(windows.staleQuotes, nowMs, policy.staleQuoteWindowMs);
    trimWindow(windows.incompleteCycles, nowMs, policy.incompleteCycleWindowMs);
  };

  const snapshot = (runnerStatus = {}, atMs = now()) => {
    const session = marketSessionResolver(atMs, { overrideByDate: calendarOverrides });
    const lastProviderEventMs = epoch(runnerStatus.lastProviderEventAt);
    const lastCompletedMinuteMs = epoch(runnerStatus.lastCompletedMinute);
    return {
      version: KIS_FEED_OPERATIONAL_GUARD_VERSION,
      state,
      healthy: state === "healthy",
      degraded: state === "degraded",
      tripped: state === "tripped",
      manualResetRequired: Boolean(trip),
      trip,
      startedAt: iso(startedAtMs),
      stoppedAt: iso(stoppedAtMs),
      lastEvaluationAt: iso(lastEvaluationAtMs),
      approvalExpired: approvalExpiresAtMs !== null && approvalExpiresAtMs <= atMs,
      approvalExpiresWithinWarningWindow:
        approvalExpiresAtMs !== null
        && approvalExpiresAtMs > atMs
        && approvalExpiresAtMs - atMs <= policy.approvalExpiryWarningMs,
      marketSession: session,
      heartbeat: {
        lastProviderEventAt: iso(lastProviderEventMs),
        providerEventAgeMs: lastProviderEventMs === null ? null : Math.max(0, atMs - lastProviderEventMs),
        lastCompletedMinute: iso(lastCompletedMinuteMs),
        completedCycleAgeMs: lastCompletedMinuteMs === null ? null : Math.max(0, atMs - lastCompletedMinuteMs),
        runnerState: clean(runnerStatus.state),
        runnerStateSince: iso(runnerStateSinceMs),
      },
      windows: {
        protocolIssues: windows.protocolIssues.length,
        staleQuotes: windows.staleQuotes.length,
        incompleteCycles: windows.incompleteCycles.length,
      },
      policy,
      alerts: alerts.slice(-policy.maximumAlerts).reverse(),
      safety: {
        marketDataOnly: true,
        automaticRestartAllowed: false,
        automaticLiveActivationAllowed: false,
        orderSubmissionAllowed: false,
      },
    };
  };

  return {
    start(input = {}) {
      const atMs = finite(input.nowMs) ?? now();
      startedAtMs = atMs;
      stoppedAtMs = null;
      approvalExpiresAtMs = finite(input.approvalExpiresAtMs);
      state = "starting";
      trip = null;
      lastEvaluationAtMs = atMs;
      lastRunnerState = "";
      runnerStateSinceMs = atMs;
      lastCounters = { protocolIssueCount: 0, staleQuoteBarCount: 0, incompleteCycleCount: 0 };
      windows.protocolIssues.length = 0;
      windows.staleQuotes.length = 0;
      windows.incompleteCycles.length = 0;
      return snapshot(input.runnerStatus || {}, atMs);
    },

    evaluate(runnerStatus = {}, atInput) {
      const atMs = finite(atInput) ?? now();
      lastEvaluationAtMs = atMs;
      const nextRunnerState = clean(runnerStatus.state);
      if (nextRunnerState !== lastRunnerState) {
        lastRunnerState = nextRunnerState;
        runnerStateSinceMs = atMs;
      }
      recordCounterDeltas(runnerStatus, atMs);
      const session = marketSessionResolver(atMs, { overrideByDate: calendarOverrides });

      if (trip) return snapshot(runnerStatus, atMs);
      if (!session.calendarSupported) {
        tripBreaker("calendar_unsupported", "지원되지 않는 미국시장 캘린더 연도입니다.", atMs, {
          sessionDate: session.sessionDate,
        });
        return snapshot(runnerStatus, atMs);
      }
      if (approvalExpiresAtMs === null || approvalExpiresAtMs <= atMs) {
        tripBreaker("read_only_approval_expired", "읽기전용 승인 유효기간이 만료되었습니다.", atMs);
        return snapshot(runnerStatus, atMs);
      }
      if (approvalExpiresAtMs - atMs <= policy.approvalExpiryWarningMs) {
        addAlert("warning", "read_only_approval_expiring", "읽기전용 승인 만료가 임박했습니다.", atMs, {
          expiresWithinWarningWindow: true,
        });
      }

      if (session.state !== "REGULAR") {
        state = session.state === "PREOPEN" ? "standby_preopen" : "standby_market_closed";
        return snapshot(runnerStatus, atMs);
      }

      if (runnerStatus.active !== true) {
        tripBreaker("runner_inactive_during_regular_session", "정규장 중 KIS feed runner가 비활성화되었습니다.", atMs);
        return snapshot(runnerStatus, atMs);
      }

      const runnerStateAgeMs = runnerStateSinceMs === null ? 0 : atMs - runnerStateSinceMs;
      if (["connecting", "authorizing", "subscribing", "reconnecting"].includes(nextRunnerState) && runnerStateAgeMs > policy.reconnectStateTripMs) {
        tripBreaker("reconnect_state_timeout", "KIS feed 연결 또는 재연결 상태가 허용시간을 초과했습니다.", atMs, {
          runnerState: nextRunnerState,
          runnerStateAgeMs,
        });
        return snapshot(runnerStatus, atMs);
      }

      const providerEventMs = epoch(runnerStatus.lastProviderEventAt);
      const elapsedSinceStart = startedAtMs === null ? 0 : atMs - startedAtMs;
      if (providerEventMs === null && elapsedSinceStart > policy.initialHeartbeatGraceMs) {
        tripBreaker("provider_heartbeat_missing", "정규장 중 KIS provider heartbeat가 수신되지 않았습니다.", atMs);
        return snapshot(runnerStatus, atMs);
      }
      const providerAgeMs = providerEventMs === null ? null : Math.max(0, atMs - providerEventMs);
      if (providerAgeMs !== null && providerAgeMs > policy.providerHeartbeatTripMs) {
        tripBreaker("provider_heartbeat_stale", "KIS provider heartbeat가 stale 상태입니다.", atMs, { providerAgeMs });
        return snapshot(runnerStatus, atMs);
      }

      const completedMinuteMs = epoch(runnerStatus.lastCompletedMinute);
      const completedAgeMs = completedMinuteMs === null ? null : Math.max(0, atMs - completedMinuteMs);
      if (
        completedMinuteMs === null &&
        elapsedSinceStart > policy.completedCycleGraceMs &&
        Number(session.minutesSinceOpen || 0) >= 2
      ) {
        tripBreaker("completed_cycle_missing", "정규장 중 완성된 다종목 cycle이 생성되지 않았습니다.", atMs);
        return snapshot(runnerStatus, atMs);
      }
      if (completedAgeMs !== null && completedAgeMs > policy.completedCycleTripMs) {
        tripBreaker("completed_cycle_stale", "마지막 완성 cycle이 허용 지연시간을 초과했습니다.", atMs, { completedAgeMs });
        return snapshot(runnerStatus, atMs);
      }

      if (windows.protocolIssues.length >= policy.maximumProtocolIssuesPerWindow) {
        tripBreaker("protocol_issue_rate_exceeded", "KIS protocol 오류 빈도가 한도를 초과했습니다.", atMs, {
          count: windows.protocolIssues.length,
        });
        return snapshot(runnerStatus, atMs);
      }
      if (windows.staleQuotes.length >= policy.maximumStaleQuotesPerWindow) {
        tripBreaker("stale_quote_rate_exceeded", "stale quote 발생 빈도가 한도를 초과했습니다.", atMs, {
          count: windows.staleQuotes.length,
        });
        return snapshot(runnerStatus, atMs);
      }
      if (windows.incompleteCycles.length >= policy.maximumIncompleteCyclesPerWindow) {
        tripBreaker("incomplete_cycle_rate_exceeded", "불완전 다종목 cycle 발생 빈도가 한도를 초과했습니다.", atMs, {
          count: windows.incompleteCycles.length,
        });
        return snapshot(runnerStatus, atMs);
      }

      const warnings = [];
      if (providerAgeMs !== null && providerAgeMs > policy.providerHeartbeatWarningMs) warnings.push("provider_heartbeat_delayed");
      if (windows.protocolIssues.length > 0) warnings.push("recent_protocol_issue");
      if (windows.staleQuotes.length > 0) warnings.push("recent_stale_quote");
      if (windows.incompleteCycles.length > 0) warnings.push("recent_incomplete_cycle");
      if (warnings.length > 0) {
        state = "degraded";
        addAlert("warning", warnings[0], "KIS feed 운영 품질이 저하되었습니다.", atMs, { warnings });
      } else {
        state = "healthy";
      }
      return snapshot(runnerStatus, atMs);
    },

    stop(reason = "operator_stop", atInput) {
      const atMs = finite(atInput) ?? now();
      stoppedAtMs = atMs;
      if (!trip) state = "stopped";
      addAlert("info", clean(reason) || "operator_stop", "KIS feed 운영 감시가 정지되었습니다.", atMs);
      return snapshot({}, atMs);
    },

    snapshot,
  };
}
