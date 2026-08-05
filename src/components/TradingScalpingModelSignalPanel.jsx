import { useEffect, useState } from "react";

import {
  acknowledgeTradingScalpingModelSignalCircuitBreaker,
  fetchTradingScalpingModelSignalStatus,
} from "./tradingScalpingAdminApi.js";
import "./TradingScalpingModelSignalPanel.css";

function dateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("ko-KR");
}

function duration(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return "—";
  if (Math.abs(ms) < 1_000) return `${Math.round(ms)}ms`;
  if (Math.abs(ms) < 60_000) return `${(ms / 1_000).toFixed(1)}초`;
  return `${(ms / 60_000).toFixed(1)}분`;
}

function label(value) {
  return {
    unavailable: "미연결",
    standby: "대기",
    healthy: "정상",
    degraded: "저하",
    tripped: "차단됨",
  }[value] || value || "미확인";
}

function short(value, length = 14) {
  const text = String(value || "");
  if (!text) return "—";
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function TradingScalpingModelSignalPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setStatus(await fetchTradingScalpingModelSignalStatus());
      setError("");
    } catch (nextError) {
      setError(nextError.message || "모델 신호 상태를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const acknowledge = async () => {
    setBusy(true);
    setError("");
    try {
      setStatus(await acknowledgeTradingScalpingModelSignalCircuitBreaker());
    } catch (nextError) {
      setError(nextError.message || "모델 circuit breaker 상태를 해제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const adapter = status?.adapter || {};
  const counters = adapter.counters || {};
  const expectedModel = status?.expectedModel || {};
  const approval = status?.approval || {};
  const symbols = Object.entries(status?.perSymbol || {});
  const alerts = status?.recentAlerts || [];
  const state = status?.state || "unavailable";

  return (
    <section className="modelSignalPanel" aria-labelledby="model-signal-title">
      <header className="modelSignalHeader">
        <div>
          <span>TSC-4F2 · MODEL SIGNAL RUNTIME</span>
          <h2 id="model-signal-title">모델 신호 상태·진입 차단</h2>
          <p>승인된 모델 identity와 causal cutoff를 통과한 1분 신호만 Shadow 신규 진입에 사용합니다. 신호 누락 시 대체값을 만들지 않습니다.</p>
        </div>
        <div className="modelSignalHeaderActions">
          <strong className={`modelState modelState--${state}`}>{label(state)}</strong>
          <button type="button" onClick={() => void load()} disabled={loading || busy}>새로고침</button>
          <button
            type="button"
            className="isAcknowledge"
            onClick={() => void acknowledge()}
            disabled={busy || status?.acknowledgementRequired !== true}
          >
            {busy ? "처리 중" : "차단 확인·상태 해제"}
          </button>
        </div>
      </header>

      {error ? <div className="modelSignalError">{error}</div> : null}

      <div className="modelSignalGrid">
        <article><span>Runtime</span><strong>{status?.active ? "실행 중" : "정지"}</strong><small>{status?.entrySignalAvailable ? "신규 진입 신호 사용 가능" : "신규 진입 차단"}</small></article>
        <article><span>Provider 등록</span><strong>{status?.registration?.registered ? "등록됨" : "미등록"}</strong><small>{status?.registration?.source || "서버 내부 전용"}</small></article>
        <article><span>모델</span><strong>{expectedModel.modelId || "미승인"}</strong><small>{expectedModel.modelVersion || "—"}</small></article>
        <article><span>Model checksum</span><strong title={expectedModel.modelChecksum || ""}>{short(expectedModel.modelChecksum)}</strong><small>{expectedModel.signalSchemaVersion || "—"}</small></article>
        <article><span>승인 ID</span><strong>{approval.approvalId || "미등록"}</strong><small>{dateTime(approval.approvedAt)}</small></article>
        <article><span>승인 만료</span><strong>{duration(approval.expiresInMs)}</strong><small>{dateTime(approval.expiresAt)}</small></article>
        <article><span>요청 / 승인</span><strong>{counters.requests ?? 0} / {counters.accepted ?? 0}</strong><small>유효 신호만 승인</small></article>
        <article><span>최근 지연</span><strong>{duration(adapter.lastSignalLatencyMs)}</strong><small>{dateTime(adapter.lastAcceptedAt)}</small></article>
      </div>

      {status?.blockingReasons?.length ? (
        <div className="modelSignalBlocking">
          <strong>신규 진입 차단 사유</strong>
          <span>{status.blockingReasons.join(" · ")}</span>
        </div>
      ) : null}

      {adapter.trip ? (
        <div className="modelSignalTrip">
          <strong>Circuit breaker: {adapter.trip.code}</strong>
          <span>연속 실패 {adapter.trip.consecutiveFailures}회 · 자동 복구 금지</span>
          <small>{dateTime(adapter.trip.at)}</small>
        </div>
      ) : null}

      <div className="modelSignalCounterGrid">
        <article><span>누락</span><strong>{counters.missing ?? 0}</strong></article>
        <article><span>Provider 오류</span><strong>{counters.providerErrors ?? 0}</strong></article>
        <article><span>형식 오류</span><strong>{counters.invalidSignals ?? 0}</strong></article>
        <article><span>지연·노후</span><strong>{counters.staleOrLatency ?? 0}</strong></article>
        <article><span>Causal 위반</span><strong>{counters.causalViolations ?? 0}</strong></article>
        <article><span>Identity 불일치</span><strong>{counters.modelIdentityMismatches ?? 0}</strong></article>
        <article><span>중복·역순</span><strong>{counters.duplicateOrOutOfOrder ?? 0}</strong></article>
        <article><span>차단 후 요청</span><strong>{counters.blockedByCircuitBreaker ?? 0}</strong></article>
      </div>

      <article className="modelSignalSymbols">
        <header><strong>종목별 신호 상태</strong><span>{symbols.length}개</span></header>
        {symbols.length > 0 ? (
          <div className="modelSignalTableWrap">
            <table>
              <thead><tr><th>종목</th><th>요청</th><th>승인</th><th>거절</th><th>최근 승인</th><th>최근 실패</th></tr></thead>
              <tbody>
                {symbols.map(([symbol, row]) => (
                  <tr key={symbol}>
                    <td>{symbol}</td>
                    <td>{row.requests ?? 0}</td>
                    <td>{row.accepted ?? 0}</td>
                    <td>{row.rejected ?? 0}</td>
                    <td>{dateTime(row.lastAcceptedAt)}</td>
                    <td>{row.lastFailure?.code || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>모델 Runtime이 시작되면 승인 전략의 종목별 상태가 표시됩니다.</p>}
      </article>

      <article className="modelSignalAlerts">
        <header><strong>최근 모델 알림</strong><span>{alerts.length}건</span></header>
        {alerts.length > 0 ? (
          <ul>
            {alerts.slice(0, 12).map((alert, index) => (
              <li key={`${alert.code}-${alert.at}-${index}`} className={`severity-${alert.severity}`}>
                <strong>{alert.symbol ? `${alert.symbol} · ` : ""}{alert.code}</strong>
                <span>{alert.message}</span>
                <small>{dateTime(alert.at)}</small>
              </li>
            ))}
          </ul>
        ) : <p>현재 모델 운영 알림이 없습니다.</p>}
      </article>

      <footer className="modelSignalBoundary">
        <span>No fallback</span>
        <span>No future leakage</span>
        <span>Manual acknowledgement</span>
        <span>No orders</span>
      </footer>
    </section>
  );
}

export default TradingScalpingModelSignalPanel;
