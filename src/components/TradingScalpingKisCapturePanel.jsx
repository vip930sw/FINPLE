import { useEffect, useMemo, useState } from "react";

import {
  fetchTradingScalpingKisCaptureStatus,
  sealTradingScalpingKisCaptureSession,
  startTradingScalpingKisCapture,
  stopTradingScalpingKisCapture,
} from "./tradingScalpingAdminApi.js";
import "./TradingScalpingKisCapturePanel.css";

const DEFAULT_SYMBOLS = ["TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA"];

function dateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("ko-KR");
}

function percent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(1)}%` : "—";
}

function label(value) {
  return {
    memory_ephemeral: "메모리 임시",
    postgres_durable: "PostgreSQL 내구성",
    capture_schema_missing: "스키마 미적용",
    created: "생성됨",
    connecting: "연결 중",
    connected: "연결됨",
    closed: "정지",
    blocked: "차단",
  }[value] || value || "미확인";
}

function todayNy() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function TradingScalpingKisCapturePanel() {
  const [status, setStatus] = useState(null);
  const [selectedSymbols, setSelectedSymbols] = useState(DEFAULT_SYMBOLS);
  const [sessionDate, setSessionDate] = useState(todayNy());
  const [expectedMinutes, setExpectedMinutes] = useState(390);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try {
      setStatus(await fetchTradingScalpingKisCaptureStatus());
      setError("");
    } catch (nextError) {
      setError(nextError.message || "KIS 데이터 축적 상태를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5_000);
    return () => window.clearInterval(timer);
  }, []);

  const toggleSymbol = (symbol) => {
    setSelectedSymbols((current) => current.includes(symbol)
      ? current.filter((item) => item !== symbol)
      : [...current, symbol].sort());
  };

  const start = async () => {
    setBusy("start");
    setNotice("");
    try {
      await startTradingScalpingKisCapture({ selectedSymbols });
      setNotice("KIS 완료 1분봉 축적을 시작했습니다.");
      await load();
    } catch (nextError) {
      setError(nextError.message || "KIS 데이터 축적을 시작하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const stop = async () => {
    setBusy("stop");
    setNotice("");
    try {
      await stopTradingScalpingKisCapture("admin_console_operator_stop");
      setNotice("KIS 데이터 축적을 정지했습니다.");
      await load();
    } catch (nextError) {
      setError(nextError.message || "KIS 데이터 축적을 정지하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const seal = async () => {
    setBusy("seal");
    setNotice("");
    try {
      const result = await sealTradingScalpingKisCaptureSession({
        sessionDate,
        expectedMinutes: Number(expectedMinutes),
        minimumCoverageRatio: 0.95,
        selectedSymbols,
      });
      setNotice(result?.revision?.readyForModelResearch
        ? "불변 데이터 revision을 발급했고 모델 연구 준비가 완료됐습니다."
        : "불변 revision을 발급했지만 내구성 또는 coverage 기준이 부족합니다.");
      await load();
    } catch (nextError) {
      setError(nextError.message || "KIS 세션 revision을 발급하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const runner = status?.runner || {};
  const summary = status?.summary || {};
  const latestRevision = summary.latestRevision || {};
  const coverage = latestRevision.coverage || {};
  const blockingReasons = status?.blockingReasons || [];
  const activeSymbols = useMemo(
    () => status?.selectedSymbols?.length ? status.selectedSymbols : selectedSymbols,
    [status, selectedSymbols],
  );

  return (
    <section className="kisCapturePanel" aria-labelledby="kis-capture-title">
      <header className="kisCaptureHeader">
        <div>
          <span>TSC-4H2 · KIS DATASET</span>
          <h2 id="kis-capture-title">KIS 완료 1분봉·호가 축적</h2>
          <p>기존 KIS 해외 실시간 체결·호가를 정규장 완료 1분봉으로 축적합니다. Databento 구매 경로는 사용하지 않습니다.</p>
        </div>
        <div className="kisCaptureHeaderActions">
          <strong className={status?.active ? "is-active" : "is-stopped"}>
            {status?.active ? "축적 중" : "정지"}
          </strong>
          <button type="button" onClick={() => void load()}>새로고침</button>
        </div>
      </header>

      {error ? <div className="kisCaptureMessage is-error">{error}</div> : null}
      {notice ? <div className="kisCaptureMessage is-notice">{notice}</div> : null}

      <div className="kisCaptureSummary">
        <article><span>저장 방식</span><strong>{label(status?.persistence?.mode)}</strong><small>{status?.persistence?.reason || "스키마 준비"}</small></article>
        <article><span>누적 분봉 행</span><strong>{summary.totalRows ?? 0}</strong><small>정규화 행만 저장</small></article>
        <article><span>최근 축적 분</span><strong>{dateTime(summary.latestCapturedMinute)}</strong><small>{runner.capturedCycleCount ?? 0} complete cycles</small></article>
        <article><span>불완전 cycle</span><strong>{runner.incompleteCycleCount ?? 0}</strong><small>forward fill 없음</small></article>
        <article><span>Stale quote</span><strong>{runner.staleQuoteCount ?? 0}</strong><small>오래된 호가 제외</small></article>
        <article><span>최신 revision</span><strong>{latestRevision.sessionDate || "—"}</strong><small>{latestRevision.readyForModelResearch ? "모델 연구 가능" : "미완료"}</small></article>
        <article><span>Coverage</span><strong>{percent(coverage.coverageRatio)}</strong><small>{coverage.completeMinuteCount ?? 0} / {coverage.expectedMinutes ?? 0}분</small></article>
        <article><span>KIS 연결 소유권</span><strong>{status?.lease?.owner || "비어 있음"}</strong><small>Shadow와 동시 연결 차단</small></article>
      </div>

      <div className="kisCaptureControls">
        <article>
          <header>
            <strong>축적 종목</strong>
            <span>{activeSymbols.length}개</span>
          </header>
          <div className="kisCaptureSymbols">
            {DEFAULT_SYMBOLS.map((symbol) => (
              <label key={symbol}>
                <input
                  type="checkbox"
                  checked={selectedSymbols.includes(symbol)}
                  disabled={status?.active}
                  onChange={() => toggleSymbol(symbol)}
                />
                <span>{symbol}</span>
              </label>
            ))}
          </div>
          <div className="kisCaptureButtons">
            <button type="button" onClick={start} disabled={status?.active || busy || !status?.startEligible || selectedSymbols.length === 0}>
              {busy === "start" ? "시작 중…" : "KIS 축적 시작"}
            </button>
            <button type="button" onClick={stop} disabled={!status?.active || busy}>
              {busy === "stop" ? "정지 중…" : "축적 정지"}
            </button>
          </div>
        </article>

        <article>
          <header><strong>세션 불변화</strong><span>관리자 수동</span></header>
          <label>
            <span>미국 거래일</span>
            <input type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} />
          </label>
          <label>
            <span>예상 정규장 분</span>
            <select value={expectedMinutes} onChange={(event) => setExpectedMinutes(Number(event.target.value))}>
              <option value={390}>390분 · 정규장</option>
              <option value={210}>210분 · 조기폐장</option>
              <option value={30}>30분 · Pilot</option>
            </select>
          </label>
          <button type="button" onClick={seal} disabled={status?.active || busy || !sessionDate}>
            {busy === "seal" ? "발급 중…" : "불변 revision 발급"}
          </button>
        </article>
      </div>

      {blockingReasons.length > 0 ? (
        <article className="kisCaptureBlocking">
          <header><strong>현재 차단 사유</strong><span>{blockingReasons.length}건</span></header>
          <ul>{blockingReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </article>
      ) : null}

      <footer className="kisCaptureBoundary">
        <span>KIS only</span>
        <span>Capture only</span>
        <span>No raw payload</span>
        <span>No account calls</span>
        <span>No orders</span>
        <span>Manual seal</span>
      </footer>
    </section>
  );
}

export default TradingScalpingKisCapturePanel;
