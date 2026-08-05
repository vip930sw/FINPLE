import { useEffect, useState } from "react";

import { fetchTradingScalpingKisFeedStatus } from "./tradingScalpingAdminApi.js";
import "./TradingScalpingKisOpsPanel.css";

function dateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("ko-KR");
}

function duration(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1_000) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}초`;
  return `${(ms / 60_000).toFixed(1)}분`;
}

function label(value) {
  return {
    created: "생성됨",
    starting: "시작 중",
    healthy: "정상",
    degraded: "저하",
    tripped: "차단됨",
    stopped: "정지",
    standby_preopen: "개장 대기",
    standby_market_closed: "장외 대기",
    REGULAR: "정규장",
    PREOPEN: "개장 전",
    POSTCLOSE: "폐장 후",
    CLOSED: "휴장",
    UNSUPPORTED_CALENDAR: "캘린더 미지원",
  }[value] || value || "미확인";
}

function TradingScalpingKisOpsPanel() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setStatus(await fetchTradingScalpingKisFeedStatus());
      setError("");
    } catch (nextError) {
      setError(nextError.message || "KIS Feed 운영 상태를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const operations = status?.operations || {};
  const guard = operations.guard || {};
  const heartbeat = guard.heartbeat || {};
  const market = guard.marketSession || status?.preflight?.marketSession || {};
  const checkpoint = operations.checkpoint || {};
  const recovery = status?.recovery || {};
  const alerts = guard.alerts || [];
  const state = guard.state || (status?.active ? "starting" : "stopped");

  return (
    <section className="kisFeedOpsPanel" aria-labelledby="kis-feed-ops-title">
      <header className="kisFeedOpsHeader">
        <div>
          <span>TSC-4E · OPERATIONS SAFETY</span>
          <h2 id="kis-feed-ops-title">KIS Feed 운영 감시·복구</h2>
          <p>Heartbeat, 완성 cycle, 오류율, 공식 미국시장 캘린더와 checkpoint를 감시합니다. 자동 재시작과 자동 Live 전환은 허용하지 않습니다.</p>
        </div>
        <div className="kisFeedOpsHeaderActions">
          <strong className={`opsState opsState--${state}`}>{label(state)}</strong>
          <button type="button" onClick={() => void load()} disabled={loading}>새로고침</button>
        </div>
      </header>

      {error ? <div className="kisFeedOpsError">{error}</div> : null}

      <div className="kisFeedOpsGrid">
        <article><span>시장 상태</span><strong>{label(market.state)}</strong><small>{market.sessionDate || "—"}{market.earlyClose ? " · 조기폐장" : ""}</small></article>
        <article><span>Provider heartbeat</span><strong>{duration(heartbeat.providerEventAgeMs)}</strong><small>{dateTime(heartbeat.lastProviderEventAt)}</small></article>
        <article><span>완성 cycle 경과</span><strong>{duration(heartbeat.completedCycleAgeMs)}</strong><small>{dateTime(heartbeat.lastCompletedMinute)}</small></article>
        <article><span>최근 Protocol 오류</span><strong>{guard.windows?.protocolIssues ?? 0}</strong><small>정책창 기준</small></article>
        <article><span>최근 Stale quote</span><strong>{guard.windows?.staleQuotes ?? 0}</strong><small>정책창 기준</small></article>
        <article><span>최근 불완전 cycle</span><strong>{guard.windows?.incompleteCycles ?? 0}</strong><small>forward fill 없음</small></article>
        <article><span>마지막 Checkpoint</span><strong>{dateTime(checkpoint.lastCheckpointAt)}</strong><small>{checkpoint.persistence?.mode || "memory_checkpoint"}</small></article>
        <article><span>승인 만료까지</span><strong>{duration(guard.approvalExpiresInMs)}</strong><small>{dateTime(guard.approvalExpiresAt)}</small></article>
      </div>

      {guard.trip ? (
        <div className="kisFeedOpsTrip">
          <strong>Circuit breaker: {guard.trip.code}</strong>
          <span>{guard.trip.message}</span>
          <small>{dateTime(guard.trip.at)} · 관리자 수동 정지 확인 후 새 승인으로 재시작해야 합니다.</small>
        </div>
      ) : null}

      {!status?.active && recovery.checkpointAvailable ? (
        <div className="kisFeedOpsRecovery">
          <strong>재시작 복구 정보</strong>
          <span>이전 상태: {label(recovery.priorOperationalState)} · 중단 사유: {recovery.priorStopReason || "미확인"}</span>
          <small>Checkpoint {dateTime(recovery.checkpointAt)} · 자동 복구 금지 · 수동 재승인 필요</small>
        </div>
      ) : null}

      <article className="kisFeedOpsAlerts">
        <header><strong>운영 알림</strong><span>{alerts.length}건</span></header>
        {alerts.length > 0 ? (
          <ul>
            {alerts.slice(0, 12).map((alert, index) => (
              <li key={`${alert.code}-${alert.at}-${index}`} className={`severity-${alert.severity}`}>
                <strong>{alert.code}</strong>
                <span>{alert.message}</span>
                <small>{dateTime(alert.at)}</small>
              </li>
            ))}
          </ul>
        ) : <p>현재 운영 알림이 없습니다.</p>}
      </article>

      <footer className="kisFeedOpsBoundary">
        <span>Market data only</span>
        <span>Manual resume</span>
        <span>No account calls</span>
        <span>No orders</span>
      </footer>
    </section>
  );
}

export default TradingScalpingKisOpsPanel;
