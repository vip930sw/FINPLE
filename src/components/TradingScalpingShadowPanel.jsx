import { useEffect, useState } from "react";

import {
  fetchTradingScalpingShadowStatus,
  startTradingScalpingShadowRuntime,
  stopTradingScalpingShadowRuntime,
} from "./tradingScalpingAdminApi.js";
import "./TradingScalpingShadowPanel.css";

function number(value, digits = 2) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits })
    : "—";
}

function money(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? `$${parsed.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : "—";
}

function statusLabel(value) {
  return {
    running: "실행 중",
    stopped: "정지",
    created: "생성됨",
    shadow_candidate: "Shadow 후보",
    blocked: "승격 차단",
    insufficient_evidence: "표본 부족",
    met: "충족",
    missed: "미충족",
  }[value] || value || "미실행";
}

function TradingScalpingShadowPanel() {
  const [status, setStatus] = useState(null);
  const [initialCash, setInitialCash] = useState(100000);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      setStatus(await fetchTradingScalpingShadowStatus());
    } catch (loadError) {
      setError(loadError.message || "Shadow 상태를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      setStatus(await startTradingScalpingShadowRuntime({ initialCash: Number(initialCash) }));
    } catch (startError) {
      setError(startError.message || "Shadow runtime을 시작하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setError("");
    try {
      setStatus(await stopTradingScalpingShadowRuntime("admin_console_operator_stop"));
    } catch (stopError) {
      setError(stopError.message || "Shadow runtime을 정지하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const snapshot = status?.snapshot;
  const metrics = snapshot?.metrics || {};
  const promotion = snapshot?.promotion;
  const active = status?.active === true;

  return (
    <section className="scalpingShadowPanel" aria-labelledby="scalping-shadow-title">
      <header className="scalpingShadowHeader">
        <div>
          <span>TSC-4C PRIVATE SHADOW</span>
          <h2 id="scalping-shadow-title">Private Shadow Runtime · 가상체결·성과 검증</h2>
          <p>승인된 전략 버전으로만 신호와 가상체결을 누적합니다. 브로커 주문·실계좌·KIS 연결은 이 제어면에서 실행되지 않습니다.</p>
        </div>
        <div className="scalpingShadowBadges">
          <strong className={active ? "isRunning" : "isIdle"}>{active ? "실행 중" : "정지"}</strong>
          <span>Virtual only</span>
          <span>Order blocked</span>
        </div>
      </header>

      {error ? <div className="scalpingShadowError">{error}</div> : null}

      <div className="scalpingShadowControl">
        <label>
          <span>가상 초기자산</span>
          <div>
            <input
              type="number"
              min="1000"
              step="1000"
              value={initialCash}
              disabled={active || busy}
              onChange={(event) => setInitialCash(event.target.value)}
            />
            <small>USD</small>
          </div>
        </label>
        <button type="button" disabled={busy || active} onClick={() => void start()}>
          {busy && !active ? "시작 중" : "승인 전략으로 시작"}
        </button>
        <button type="button" className="isStop" disabled={busy || !active} onClick={() => void stop()}>
          {busy && active ? "정지 중" : "Shadow 정지"}
        </button>
        <button type="button" className="isRefresh" disabled={busy} onClick={() => void load()}>새로고침</button>
      </div>

      <div className="scalpingShadowNotice">
        <strong>현재 입력 모드</strong>
        <span>승인된 완료 1분봉 cycle을 받는 private runtime입니다. 실제 KIS WebSocket provider 호출은 아직 비활성화돼 있습니다.</span>
      </div>

      <div className="scalpingShadowMetricGrid">
        <article><span>Run</span><strong>{snapshot?.runId ? snapshot.runId.slice(0, 8) : "—"}</strong></article>
        <article><span>전략 버전</span><strong>{snapshot?.strategyVersionNumber ? `v${snapshot.strategyVersionNumber}` : "—"}</strong></article>
        <article><span>관찰 거래일</span><strong>{number(snapshot?.observationSessions, 0)}일</strong></article>
        <article><span>Cycle</span><strong>{number(snapshot?.cycleCount, 0)}</strong></article>
        <article><span>순손익</span><strong>{money(metrics.netPnl)}</strong></article>
        <article><span>순수익률</span><strong>{metrics.totalReturnPct === undefined ? "—" : `${number(metrics.totalReturnPct)}%`}</strong></article>
        <article><span>최대 낙폭</span><strong>{metrics.maxDrawdownPct === undefined ? "—" : `${number(metrics.maxDrawdownPct)}%`}</strong></article>
        <article><span>Profit Factor</span><strong>{number(metrics.profitFactor)}</strong></article>
        <article><span>완결 거래</span><strong>{number(metrics.trades, 0)}건</strong></article>
        <article><span>체결률</span><strong>{metrics.fillRatePct === undefined ? "—" : `${number(metrics.fillRatePct)}%`}</strong></article>
        <article><span>슬리피지</span><strong>{metrics.averageSlippageBps === undefined ? "—" : `${number(metrics.averageSlippageBps)}bp`}</strong></article>
        <article><span>승격 판정</span><strong>{statusLabel(promotion?.status)}</strong></article>
      </div>

      <article className="scalpingShadowGateCard">
        <header>
          <div>
            <strong>Shadow 승격 게이트</strong>
            <span>단일 목표수익률이 아니라 표본·반복성·위험·체결품질을 함께 봅니다.</span>
          </div>
          <small>{promotion ? `${promotion.summary?.met || 0}/${promotion.summary?.total || 0} 충족` : "스냅샷 대기"}</small>
        </header>
        <div className="scalpingShadowTableWrap">
          <table>
            <thead><tr><th>기준</th><th>현재</th><th>목표</th><th>판정</th></tr></thead>
            <tbody>
              {promotion?.gates?.length ? promotion.gates.map((gate) => (
                <tr key={gate.label}>
                  <td>{gate.label}{gate.blocking === false ? " · 상향목표" : ""}</td>
                  <td>{gate.actual === null ? "—" : number(gate.actual)}</td>
                  <td>{number(gate.target)}</td>
                  <td><span className={`gateStatus gateStatus--${gate.status}`}>{statusLabel(gate.status)}</span></td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="empty">Shadow 성과가 누적되면 승격 게이트를 표시합니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

export default TradingScalpingShadowPanel;
