import { useEffect, useState } from "react";

import {
  fetchTradingScalpingAdminDashboard,
  fetchTradingScalpingKisFeedStatus,
  fetchTradingScalpingShadowStatus,
  startTradingScalpingKisFeed,
  startTradingScalpingShadowRuntime,
  stopTradingScalpingKisFeed,
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

function dateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("ko-KR");
}

function statusLabel(value) {
  return {
    running: "실행 중",
    stopped: "정지",
    created: "생성됨",
    connected: "연결됨",
    connecting: "연결 중",
    authorizing: "승인키 요청",
    subscribing: "구독 중",
    reconnecting: "재연결 중",
    closed: "종료",
    shadow_candidate: "Shadow 후보",
    blocked: "승격 차단",
    insufficient_evidence: "표본 부족",
    met: "충족",
    missed: "미충족",
  }[value] || value || "미실행";
}

function approvedVersionsFromDashboard(dashboard) {
  return (dashboard?.registry?.versions || [])
    .filter((version) => version.status === "approved")
    .sort((left, right) => Number(right.versionNumber) - Number(left.versionNumber));
}

function TradingScalpingShadowPanel() {
  const [status, setStatus] = useState(null);
  const [feedStatus, setFeedStatus] = useState(null);
  const [approvedVersions, setApprovedVersions] = useState([]);
  const [strategyVersionId, setStrategyVersionId] = useState("");
  const [initialCash, setInitialCash] = useState(100000);
  const [busy, setBusy] = useState(false);
  const [feedBusy, setFeedBusy] = useState(false);
  const [error, setError] = useState("");
  const [feedError, setFeedError] = useState("");

  const load = async () => {
    setError("");
    setFeedError("");
    try {
      const [nextStatus, nextFeedStatus, dashboard] = await Promise.all([
        fetchTradingScalpingShadowStatus(),
        fetchTradingScalpingKisFeedStatus(),
        fetchTradingScalpingAdminDashboard(),
      ]);
      const versions = approvedVersionsFromDashboard(dashboard);
      setStatus(nextStatus);
      setFeedStatus(nextFeedStatus);
      setApprovedVersions(versions);
      setStrategyVersionId((current) => {
        if (current && versions.some((version) => version.id === current)) return current;
        return versions[0]?.id || "";
      });
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
      setStatus(await startTradingScalpingShadowRuntime({
        initialCash: Number(initialCash),
        strategyVersionId,
      }));
      setFeedStatus(await fetchTradingScalpingKisFeedStatus());
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
      setFeedStatus(await fetchTradingScalpingKisFeedStatus());
    } catch (stopError) {
      setError(stopError.message || "Shadow runtime을 정지하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const startFeed = async () => {
    setFeedBusy(true);
    setFeedError("");
    try {
      setFeedStatus(await startTradingScalpingKisFeed());
    } catch (startError) {
      const details = startError.reasons?.length ? ` (${startError.reasons.join(", ")})` : "";
      setFeedError(`${startError.message || "KIS Shadow feed를 시작하지 못했습니다."}${details}`);
    } finally {
      setFeedBusy(false);
    }
  };

  const stopFeed = async () => {
    setFeedBusy(true);
    setFeedError("");
    try {
      setFeedStatus(await stopTradingScalpingKisFeed("admin_console_operator_stop"));
    } catch (stopError) {
      setFeedError(stopError.message || "KIS Shadow feed를 정지하지 못했습니다.");
    } finally {
      setFeedBusy(false);
    }
  };

  const snapshot = status?.snapshot;
  const metrics = snapshot?.metrics || {};
  const promotion = snapshot?.promotion;
  const active = status?.active === true;
  const selectedVersion = approvedVersions.find((version) => version.id === strategyVersionId);
  const feedActive = feedStatus?.active === true;
  const feedRunner = feedStatus?.runner || {};
  const feedPreflight = feedStatus?.preflight || {};
  const feedStrategy = feedStatus?.strategy || {};
  const credentialReady = feedPreflight.credentials?.appKeyConfigured && feedPreflight.credentials?.appSecretConfigured;

  return (
    <section className="scalpingShadowPanel" aria-labelledby="scalping-shadow-title">
      <header className="scalpingShadowHeader">
        <div>
          <span>TSC-4C/4D PRIVATE SHADOW</span>
          <h2 id="scalping-shadow-title">Private Shadow Runtime · 가상체결·KIS 완료봉 검증</h2>
          <p>승인 전략과 읽기전용 KIS 시세만 사용합니다. 브로커 주문·실계좌 조회·자동 Live 전환은 제공하지 않습니다.</p>
        </div>
        <div className="scalpingShadowBadges">
          <strong className={active ? "isRunning" : "isIdle"}>Shadow {active ? "실행 중" : "정지"}</strong>
          <strong className={feedActive ? "isRunning" : "isIdle"}>KIS Feed {feedActive ? "실행 중" : "정지"}</strong>
          <span>Virtual only</span>
          <span>Order blocked</span>
        </div>
      </header>

      {error ? <div className="scalpingShadowError">{error}</div> : null}

      <div className="scalpingShadowControl">
        <label>
          <span>승인 전략 버전</span>
          <div>
            <select
              value={strategyVersionId}
              disabled={active || busy}
              onChange={(event) => setStrategyVersionId(event.target.value)}
            >
              {approvedVersions.length > 0 ? approvedVersions.map((version) => (
                <option key={version.id} value={version.id}>
                  v{version.versionNumber} · {String(version.checksum || "").slice(0, 10)}
                </option>
              )) : <option value="">승인 전략 없음</option>}
            </select>
          </div>
          <small>{selectedVersion ? `승인 ${dateTime(selectedVersion.approvedAt)}` : "먼저 전략 승인본을 생성해야 합니다."}</small>
        </label>
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
        <button type="button" disabled={busy || active || !strategyVersionId} onClick={() => void start()}>
          {busy && !active ? "시작 중" : "선택 전략으로 시작"}
        </button>
        <button type="button" className="isStop" disabled={busy || !active || feedActive} onClick={() => void stop()}>
          {busy && active ? "정지 중" : feedActive ? "Feed 먼저 정지" : "Shadow 정지"}
        </button>
        <button type="button" className="isRefresh" disabled={busy || feedBusy} onClick={() => void load()}>새로고침</button>
      </div>

      <div className="scalpingShadowNotice">
        <strong>Shadow 입력 경계</strong>
        <span>완료 1분봉 cycle만 내부 서비스로 전달합니다. KIS Feed가 활성화되지 않으면 외부 provider 호출은 발생하지 않습니다.</span>
      </div>

      <article className="scalpingShadowFeedCard">
        <header>
          <div>
            <strong>KIS 읽기전용 Completed-Bar Feed</strong>
            <span>실시간 체결·호가를 1분봉으로 집계하고, 선택 종목이 모두 완성된 cycle만 Shadow에 전달합니다.</span>
          </div>
          <span className={`feedState ${feedActive ? "isRunning" : "isIdle"}`}>{statusLabel(feedRunner.state)}</span>
        </header>
        {feedError ? <div className="scalpingShadowError">{feedError}</div> : null}
        <div className="scalpingShadowFeedGateGrid">
          <article><span>기능 플래그</span><strong>{feedPreflight.featureEnabled ? "활성" : "비활성"}</strong></article>
          <article><span>읽기전용 승인</span><strong>{feedPreflight.receipt?.approvalId || "미등록"}</strong></article>
          <article><span>승인 만료</span><strong>{dateTime(feedPreflight.receipt?.expiresAt)}</strong></article>
          <article><span>KIS 자격증명</span><strong>{credentialReady ? "설정됨" : "미설정"}</strong></article>
          <article><span>활성 Shadow</span><strong>{feedStatus?.shadow?.active ? "확인" : "필요"}</strong></article>
          <article><span>시작 가능</span><strong>{feedPreflight.startEligible ? "가능" : "차단"}</strong></article>
        </div>
        {feedPreflight.blockingReasons?.length ? (
          <div className="scalpingShadowFeedReasons">
            <strong>차단 사유</strong>
            <span>{feedPreflight.blockingReasons.join(" · ")}</span>
          </div>
        ) : null}
        {feedStrategy.requireModelSignal && !feedStrategy.externalModelSignalAvailable ? (
          <div className="scalpingShadowFeedReasons isWarning">
            <strong>모델 신호 대기</strong>
            <span>시세·분봉 수집은 가능하지만 승인 전략이 외부 모델을 요구하므로 현재는 신규 진입 신호가 차단됩니다.</span>
          </div>
        ) : null}
        <div className="scalpingShadowFeedActions">
          <button type="button" disabled={feedBusy || feedActive || !feedPreflight.startEligible} onClick={() => void startFeed()}>
            {feedBusy && !feedActive ? "연결 중" : "승인된 KIS Feed 시작"}
          </button>
          <button type="button" className="isStop" disabled={feedBusy || !feedActive} onClick={() => void stopFeed()}>
            {feedBusy && feedActive ? "정지 중" : "KIS Feed 정지"}
          </button>
        </div>
        <div className="scalpingShadowMetricGrid scalpingShadowMetricGrid--feed">
          <article><span>선택 종목</span><strong>{feedRunner.selectedSymbols?.join(", ") || feedStrategy.selectedSymbols?.join(", ") || "—"}</strong></article>
          <article><span>Provider 이벤트</span><strong>{number(feedRunner.providerEventCount, 0)}</strong></article>
          <article><span>완성 1분봉</span><strong>{number(feedRunner.completedBarCount, 0)}</strong></article>
          <article><span>완성 Cycle</span><strong>{number(feedRunner.completedCycleCount, 0)}</strong></article>
          <article><span>불완전 Cycle</span><strong>{number(feedRunner.incompleteCycleCount, 0)}</strong></article>
          <article><span>마지막 완료봉</span><strong>{dateTime(feedRunner.lastCompletedMinute)}</strong></article>
        </div>
      </article>

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
