import { useEffect, useMemo, useState } from "react";

import {
  approveTradingScalpingStrategyDraft,
  fetchTradingScalpingAdminDashboard,
  requestTradingScalpingStrategyReview,
  retireTradingScalpingStrategyVersion,
  saveTradingScalpingAdminDraft,
} from "./tradingScalpingAdminApi.js";
import "./TradingScalpingAdminPanel.css";

const SYMBOLS = ["TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA"];
const PAIR_LABELS = [
  ["나스닥100", "TQQQ", "SQQQ"],
  ["반도체", "SOXL", "SOXS"],
  ["S&P 500", "UPRO", "SPXU"],
  ["Russell 2000", "TNA", "TZA"],
];

const STRATEGY_FIELDS = [
  { key: "minimumBars", label: "최소 분봉 수", step: 1, min: 20 },
  { key: "fastEmaPeriod", label: "빠른 EMA", step: 1, min: 1 },
  { key: "slowEmaPeriod", label: "느린 EMA", step: 1, min: 2 },
  { key: "minEntryProbability", label: "최소 진입확률", step: 0.01, min: 0, max: 1 },
  { key: "maxExitProbability", label: "최대 청산확률", step: 0.01, min: 0, max: 1 },
  { key: "minExpectedNetEdgeBps", label: "최소 순기대수익", step: 1, suffix: "bp" },
  { key: "maxSpreadBps", label: "최대 스프레드", step: 0.5, suffix: "bp" },
  { key: "minMomentumBps", label: "최소 모멘텀", step: 1, suffix: "bp" },
  { key: "minVolumeZScore", label: "최소 거래량 Z", step: 0.1 },
  { key: "maximumHoldBars", label: "최대 보유시간", step: 1, suffix: "분" },
  { key: "riskPerTradeFraction", label: "거래당 위험비율", step: 0.001, min: 0.001, max: 0.1, displayScale: 100, suffix: "%" },
  { key: "maximumPositionFraction", label: "종목당 최대비중", step: 0.01, min: 0.01, max: 1, displayScale: 100, suffix: "%" },
  { key: "minStopBps", label: "최소 손절폭", step: 1, suffix: "bp" },
  { key: "stopAtrMultiple", label: "초기 손절 ATR", step: 0.1 },
  { key: "trailingAtrMultiple", label: "트레일링 ATR", step: 0.1 },
  { key: "takeProfitRiskMultiple", label: "목표수익 R배수", step: 0.1 },
  { key: "marketOpenBufferMinutes", label: "개장 후 대기", step: 1, suffix: "분" },
  { key: "marketCloseBufferMinutes", label: "마감 전 진입차단", step: 1, suffix: "분" },
  { key: "commissionRoundTripBps", label: "왕복 수수료", step: 0.1, suffix: "bp" },
  { key: "slippageRoundTripBps", label: "왕복 슬리피지", step: 0.1, suffix: "bp" },
  { key: "costSafetyMultiple", label: "비용 안전배수", step: 0.1 },
];

const PORTFOLIO_FIELDS = [
  { key: "maxConcurrentPositions", label: "최대 동시 보유", step: 1, min: 1, max: 8, suffix: "종목" },
  { key: "maximumNewIntentsPerCycle", label: "주기당 신규진입", step: 1, min: 1, max: 8, suffix: "건" },
  { key: "maxGrossExposureFraction", label: "계좌 총노출 한도", step: 0.01, min: 0.01, max: 1, displayScale: 100, suffix: "%" },
  { key: "maxAggregateRiskFraction", label: "계좌 총위험 한도", step: 0.001, min: 0.001, max: 0.2, displayScale: 100, suffix: "%" },
];

const OBJECTIVE_FIELDS = [
  { key: "evaluationWindowSessions", label: "평가 거래일", step: 1, suffix: "일" },
  { key: "targetNetReturnPct", label: "목표 순수익률", step: 0.1, suffix: "%" },
  { key: "maximumDrawdownPct", label: "허용 최대 낙폭", step: 0.1, suffix: "%" },
  { key: "minimumProfitFactor", label: "최소 Profit Factor", step: 0.1 },
  { key: "minimumFillRatePct", label: "최소 체결률", step: 1, suffix: "%" },
  { key: "maximumAverageSlippageBps", label: "최대 평균 슬리피지", step: 0.1, suffix: "bp" },
  { key: "minimumTrades", label: "최소 완결거래", step: 1, suffix: "건" },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toForm(dashboard) {
  if (!dashboard?.draft) return null;
  return {
    strategy: clone(dashboard.draft.strategy),
    objectives: clone(dashboard.draft.objectives),
    portfolioConstraints: clone(dashboard.draft.portfolioConstraints),
    expectedRevision: dashboard.draft.revision,
  };
}

function formatNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return `$${number.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ko-KR");
}

function formatStatus(status) {
  const labels = {
    ready_replay_snapshot: "리플레이 성과 준비됨",
    unavailable_no_persisted_replay_or_shadow_snapshot: "성과 스냅샷 없음",
    postgres_registry: "PostgreSQL 영구 레지스트리",
    memory_fallback: "메모리 초안",
    registry_schema_missing: "DB migration 필요",
    draft: "초안",
    review_requested: "검토 요청됨",
    changes_requested: "수정 요청",
    approved_snapshot_created: "승인본 생성됨",
    approved: "승인",
    retired: "폐기",
    met: "달성",
    missed: "미달",
    unavailable: "미측정",
  };
  return labels[status] || status || "미확인";
}

function metricCards(performance) {
  const metrics = performance?.metrics || {};
  return [
    { label: "순손익", value: formatMoney(metrics.netPnl), tone: metrics.netPnl > 0 ? "positive" : metrics.netPnl < 0 ? "negative" : "neutral" },
    { label: "순수익률", value: metrics.totalReturnPct === null ? "—" : `${formatNumber(metrics.totalReturnPct)}%`, tone: metrics.totalReturnPct > 0 ? "positive" : metrics.totalReturnPct < 0 ? "negative" : "neutral" },
    { label: "최대 낙폭", value: metrics.maxDrawdownPct === null ? "—" : `${formatNumber(metrics.maxDrawdownPct)}%`, tone: "risk" },
    { label: "Profit Factor", value: formatNumber(metrics.profitFactor), tone: metrics.profitFactor >= 1.2 ? "positive" : "neutral" },
    { label: "체결률", value: metrics.fillRatePct === null ? "—" : `${formatNumber(metrics.fillRatePct)}%`, tone: "neutral" },
    { label: "평균 슬리피지", value: metrics.averageSlippageBps === null ? "—" : `${formatNumber(metrics.averageSlippageBps)}bp`, tone: "neutral" },
    { label: "완결 거래", value: metrics.trades === null ? "—" : `${formatNumber(metrics.trades, 0)}건`, tone: "neutral" },
    { label: "총 비용", value: formatMoney(metrics.totalFees), tone: "neutral" },
  ];
}

function linePath(points, width, height, valueKey) {
  const values = points.map((point) => Number(point[valueKey])).filter(Number.isFinite);
  if (values.length < 2) return "";
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = maximum - minimum || 1;
  return points.map((point, index) => {
    const value = Number(point[valueKey]);
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((value - minimum) / range) * height;
    return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

function LineChart({ title, description, points, valueKey, formatter = formatNumber }) {
  const width = 720;
  const height = 190;
  const path = linePath(points, width, height, valueKey);
  const first = points?.[0]?.[valueKey];
  const last = points?.at(-1)?.[valueKey];
  return (
    <article className="scalpingAdminChartCard">
      <header>
        <div><strong>{title}</strong><span>{description}</span></div>
        <small>{points.length > 0 ? `${formatter(first)} → ${formatter(last)}` : "데이터 없음"}</small>
      </header>
      {path ? (
        <div className="scalpingAdminChartViewport">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} className="scalpingAdminChartGrid" />
            <path d={path} className="scalpingAdminChartLine" />
          </svg>
        </div>
      ) : <div className="scalpingAdminEmptyChart">리플레이 또는 Shadow 성과 스냅샷이 연결되면 표시됩니다.</div>}
    </article>
  );
}

function DailyPnlChart({ rows = [] }) {
  const maximum = Math.max(1, ...rows.map((row) => Math.abs(Number(row.pnl) || 0)));
  return (
    <article className="scalpingAdminChartCard">
      <header><div><strong>일별 손익</strong><span>평가일별 리플레이 또는 Shadow 손익</span></div><small>{rows.length > 0 ? `${rows.length}일` : "데이터 없음"}</small></header>
      {rows.length > 0 ? (
        <div className="scalpingAdminDailyBars" role="img" aria-label="일별 손익 막대 차트">
          {rows.map((row) => {
            const value = Number(row.pnl) || 0;
            return (
              <div key={row.date} className="scalpingAdminDailyBarItem" title={`${row.date}: ${formatMoney(value)}`}>
                <div className="scalpingAdminDailyBarAxis">
                  <span className={`scalpingAdminDailyBar ${value >= 0 ? "isPositive" : "isNegative"}`} style={{ height: `${Math.max(4, (Math.abs(value) / maximum) * 72)}px` }} />
                </div>
                <small>{row.date?.slice(5)}</small>
              </div>
            );
          })}
        </div>
      ) : <div className="scalpingAdminEmptyChart">일별 성과 데이터가 아직 없습니다.</div>}
    </article>
  );
}

function NumericField({ field, value, onChange }) {
  const scale = field.displayScale || 1;
  const displayed = Number.isFinite(Number(value)) ? Number(value) * scale : "";
  return (
    <label className="scalpingAdminField">
      <span>{field.label}</span>
      <div>
        <input
          type="number"
          value={displayed}
          step={field.step * scale}
          min={field.min === undefined ? undefined : field.min * scale}
          max={field.max === undefined ? undefined : field.max * scale}
          onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value) / scale)}
        />
        {field.suffix ? <small>{field.suffix}</small> : null}
      </div>
    </label>
  );
}

function ObjectiveTable({ comparisons = [] }) {
  return (
    <div className="scalpingAdminTableWrap">
      <table className="scalpingAdminTable">
        <thead><tr><th>연구 승인 기준</th><th>목표</th><th>현재</th><th>판정</th></tr></thead>
        <tbody>
          {comparisons.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{formatNumber(row.target)}{row.unit}</td>
              <td>{row.actual === null ? "—" : `${formatNumber(row.actual)}${row.unit}`}</td>
              <td><span className={`scalpingAdminStatus scalpingAdminStatus--${row.status}`}>{formatStatus(row.status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TradingScalpingAdminPanel() {
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retireReason, setRetireReason] = useState("연구 전략 교체");

  const applyDashboard = (next) => {
    if (!next) return;
    setDashboard(next);
    setForm(toForm(next));
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      applyDashboard(await fetchTradingScalpingAdminDashboard());
    } catch (loadError) {
      setError(loadError.message || "스캘핑 관리자 대시보드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const cards = useMemo(() => metricCards(dashboard?.performance), [dashboard]);
  const strategy = form?.strategy;
  const objectives = form?.objectives;
  const portfolioConstraints = form?.portfolioConstraints;
  const registryStatus = dashboard?.registry?.status || {};
  const versions = dashboard?.registry?.versions || [];
  const auditEvents = dashboard?.registry?.auditEvents || [];
  const lifecycleStatus = dashboard?.draft?.lifecycleStatus || "draft";
  const persistentRegistryReady = registryStatus.schemaReady === true;

  const updateStrategy = (key, value) => {
    setForm((current) => ({ ...current, strategy: { ...current.strategy, [key]: value } }));
    setMessage("");
  };

  const updateObjective = (key, value) => {
    setForm((current) => ({ ...current, objectives: { ...current.objectives, [key]: value } }));
    setMessage("");
  };

  const updatePortfolioConstraint = (key, value) => {
    setForm((current) => ({ ...current, portfolioConstraints: { ...current.portfolioConstraints, [key]: value } }));
    setMessage("");
  };

  const toggleSymbol = (symbol) => {
    const current = strategy?.allowedSymbols || [];
    const next = current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol];
    setForm((currentForm) => {
      const maxConcurrentPositions = Math.min(currentForm.portfolioConstraints.maxConcurrentPositions, Math.max(next.length, 1));
      const maximumNewIntentsPerCycle = Math.min(currentForm.portfolioConstraints.maximumNewIntentsPerCycle, maxConcurrentPositions);
      return {
        ...currentForm,
        strategy: { ...currentForm.strategy, allowedSymbols: next },
        portfolioConstraints: {
          ...currentForm.portfolioConstraints,
          maxConcurrentPositions,
          maximumNewIntentsPerCycle,
        },
      };
    });
    setMessage("");
  };

  const executeLifecycleAction = async (action, successMessage) => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      applyDashboard(result.dashboard);
      setMessage(successMessage);
    } catch (actionError) {
      if (actionError.status === 409) await load();
      const details = actionError.reasons?.length ? ` (${actionError.reasons.join(", ")})` : "";
      setError(`${actionError.message || "전략 상태를 변경하지 못했습니다."}${details}`);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!form) return;
    await executeLifecycleAction(
      () => saveTradingScalpingAdminDraft(form),
      persistentRegistryReady
        ? "전략 초안을 PostgreSQL 레지스트리에 저장했습니다. 실거래에는 적용되지 않습니다."
        : "전략 초안을 서버 메모리에 저장했습니다. DB migration 적용 전에는 재시작 시 초기화됩니다.",
    );
  };

  const requestReview = () => executeLifecycleAction(
    () => requestTradingScalpingStrategyReview(dashboard.draft.revision),
    "전략 검토를 요청했습니다. 아직 실행 승인이나 주문 권한은 없습니다.",
  );

  const approve = () => executeLifecycleAction(
    () => approveTradingScalpingStrategyDraft(dashboard.draft.revision),
    "불변 승인본을 생성했습니다. 승인본 생성만으로 Trading Worker나 실주문은 활성화되지 않습니다.",
  );

  const retire = (versionId) => executeLifecycleAction(
    () => retireTradingScalpingStrategyVersion(versionId, retireReason),
    "전략 승인본을 폐기 상태로 변경했습니다.",
  );

  if (loading) return <section className="scalpingAdminPanel scalpingAdminPanel--loading">스캘핑 전략 대시보드를 불러오는 중입니다.</section>;
  if (!dashboard || !form) {
    return (
      <section className="scalpingAdminPanel scalpingAdminPanel--error">
        <strong>스캘핑 전략 대시보드 연결 실패</strong><p>{error || "관리자 API 응답을 확인해 주세요."}</p>
        <button type="button" onClick={() => void load()}>다시 불러오기</button>
      </section>
    );
  }

  const performance = dashboard.performance;
  return (
    <section className="scalpingAdminPanel" aria-labelledby="scalping-admin-title">
      <header className="scalpingAdminHero">
        <div>
          <span className="scalpingAdminEyebrow">TSC-4B · MULTI-ASSET STRATEGY REGISTRY</span>
          <h2 id="scalping-admin-title">레버리지 ETF 스캘핑 전략</h2>
          <p>복수 종목을 감시·평가하고, 계좌 전체 위험한도 안에서 우선순위가 높은 신규진입만 승인 후보로 남깁니다.</p>
        </div>
        <div className="scalpingAdminHeroMeta">
          <span className="scalpingAdminStatus scalpingAdminStatus--draft">revision {dashboard.draft.revision}</span>
          <span className="scalpingAdminStatus scalpingAdminStatus--neutral">{formatStatus(lifecycleStatus)}</span>
          <span className="scalpingAdminStatus scalpingAdminStatus--blocked">실주문 차단</span>
        </div>
      </header>

      <div className="scalpingAdminSafetyNotice">
        <strong>복수 지정 원칙</strong>
        <span>{strategy.allowedSymbols.length}/8개 감시 · 최대 {portfolioConstraints.maxConcurrentPositions}개 동시보유 · 평가주기당 신규진입 {portfolioConstraints.maximumNewIntentsPerCycle}건 · 상반 ETF 동시보유 {portfolioConstraints.allowOpposingPairSimultaneously ? "허용" : "차단"}</span>
      </div>

      {message ? <div className="scalpingAdminFeedback isSuccess">{message}</div> : null}
      {error ? <div className="scalpingAdminFeedback isError">{error}</div> : null}

      <article className="scalpingAdminCard scalpingAdminRegistryCard">
        <header>
          <div><strong>전략 레지스트리</strong><span>초안·검토요청·승인본·폐기 이력을 분리합니다.</span></div>
          <span className={`scalpingAdminStatus ${persistentRegistryReady ? "scalpingAdminStatus--met" : "scalpingAdminStatus--unavailable"}`}>{formatStatus(registryStatus.mode)}</span>
        </header>
        <div className="scalpingAdminMetricGrid">
          <div className="scalpingAdminMetric"><span>DB 설정</span><strong>{registryStatus.databaseConfigured ? "연결" : "미설정"}</strong></div>
          <div className="scalpingAdminMetric"><span>기능 플래그</span><strong>{registryStatus.featureEnabled ? "활성" : "비활성"}</strong></div>
          <div className="scalpingAdminMetric"><span>Schema</span><strong>{registryStatus.schemaReady ? "준비됨" : "미적용"}</strong></div>
          <div className="scalpingAdminMetric"><span>승인본</span><strong>{versions.filter((version) => version.status === "approved").length}개</strong></div>
        </div>
        {!persistentRegistryReady ? <p className="scalpingAdminRegistryNotice">`20260805_trading_strategy_registry.sql` migration과 `FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED=true` 적용 전에는 메모리 초안으로 동작합니다.</p> : null}
      </article>

      <div className="scalpingAdminGrid scalpingAdminGrid--editor">
        <article className="scalpingAdminCard">
          <header><div><strong>거래대상 복수 선택</strong><span>선택 종목은 각각 독립 평가되며, 이후 포트폴리오 조정기가 진입 수를 제한합니다.</span></div><small>{strategy.allowedSymbols.length}/8 선택</small></header>
          <div className="scalpingAdminSymbolGrid">
            {SYMBOLS.map((symbol) => (
              <label key={symbol} className={strategy.allowedSymbols.includes(symbol) ? "isSelected" : ""}>
                <input type="checkbox" checked={strategy.allowedSymbols.includes(symbol)} onChange={() => toggleSymbol(symbol)} /><span>{symbol}</span>
              </label>
            ))}
          </div>
          <div className="scalpingAdminPairGrid">
            {PAIR_LABELS.map(([label, bull, bear]) => (
              <div key={label}><strong>{label}</strong><span>{bull} ↔ {bear}</span><small>{portfolioConstraints.allowOpposingPairSimultaneously ? "동시보유 허용" : "동시보유 차단"}</small></div>
            ))}
          </div>
          <div className="scalpingAdminFieldGrid">
            {STRATEGY_FIELDS.map((field) => <NumericField key={field.key} field={field} value={strategy[field.key]} onChange={(value) => updateStrategy(field.key, value)} />)}
          </div>
          <label className="scalpingAdminToggle"><input type="checkbox" checked={strategy.requireModelSignal === true} onChange={(event) => updateStrategy("requireModelSignal", event.target.checked)} /><span>외부 AI 모델 신호 필수</span></label>
        </article>

        <article className="scalpingAdminCard">
          <header><div><strong>계좌 단위 다자산 한도</strong><span>복수 신호가 동시에 발생해도 총노출·총위험·동시보유 한도로 조정합니다.</span></div></header>
          <div className="scalpingAdminFieldGrid scalpingAdminFieldGrid--objectives">
            {PORTFOLIO_FIELDS.map((field) => <NumericField key={field.key} field={field} value={portfolioConstraints[field.key]} onChange={(value) => updatePortfolioConstraint(field.key, value)} />)}
          </div>
          <label className="scalpingAdminToggle"><input type="checkbox" checked={portfolioConstraints.allowOpposingPairSimultaneously === true} onChange={(event) => updatePortfolioConstraint("allowOpposingPairSimultaneously", event.target.checked)} /><span>상반 ETF 동시보유 허용 — 연구 예외</span></label>
          <label className="scalpingAdminToggle"><input type="checkbox" checked={portfolioConstraints.allowDuplicatePendingSymbol === true} onChange={(event) => updatePortfolioConstraint("allowDuplicatePendingSymbol", event.target.checked)} /><span>동일 종목 미체결 주문 중복 허용 — 기본 차단 권장</span></label>
          <header className="scalpingAdminSubheader"><div><strong>연구 목표·승인 기준</strong><span>목표수익률은 수익 보장이 아니라 Shadow/Live 승격 심사 기준입니다.</span></div></header>
          <div className="scalpingAdminFieldGrid scalpingAdminFieldGrid--objectives">
            {OBJECTIVE_FIELDS.map((field) => <NumericField key={field.key} field={field} value={objectives[field.key]} onChange={(value) => updateObjective(field.key, value)} />)}
          </div>
          <div className="scalpingAdminSaveRow">
            <div><small>마지막 저장</small><strong>{formatDate(dashboard.draft.updatedAt) || "시스템 기본값"}</strong></div>
            <button type="button" onClick={() => void save()} disabled={saving || strategy.allowedSymbols.length === 0}>{saving ? "처리 중" : "전략 초안 저장"}</button>
          </div>
          <div className="scalpingAdminLifecycleActions">
            <button type="button" onClick={() => void requestReview()} disabled={saving || !persistentRegistryReady || lifecycleStatus === "review_requested"}>검토 요청</button>
            <button type="button" onClick={() => void approve()} disabled={saving || !persistentRegistryReady || lifecycleStatus !== "review_requested"}>불변 승인본 생성</button>
            <button type="button" onClick={() => void load()} disabled={saving}>최신 상태 새로고침</button>
          </div>
        </article>
      </div>

      {versions.length > 0 ? (
        <article className="scalpingAdminCard">
          <header><div><strong>승인 전략 버전</strong><span>승인본은 불변 스냅샷이며 별도 Runtime 승인이 없으면 주문에 사용되지 않습니다.</span></div></header>
          <label className="scalpingAdminRetireReason"><span>폐기 사유</span><input value={retireReason} onChange={(event) => setRetireReason(event.target.value)} /></label>
          <div className="scalpingAdminTableWrap">
            <table className="scalpingAdminTable">
              <thead><tr><th>버전</th><th>상태</th><th>승인자</th><th>승인시각</th><th>선택종목</th><th>Checksum</th><th>관리</th></tr></thead>
              <tbody>{versions.map((version) => (
                <tr key={version.id}>
                  <td>v{version.versionNumber}</td><td>{formatStatus(version.status)}</td><td>{version.approvedBy}</td><td>{formatDate(version.approvedAt)}</td>
                  <td>{version.strategy?.allowedSymbols?.join(", ") || "—"}</td><td>{version.checksum?.slice(0, 12) || "—"}</td>
                  <td>{version.status === "approved" ? <button type="button" className="scalpingAdminTableAction" onClick={() => void retire(version.id)} disabled={saving || !retireReason.trim()}>폐기</button> : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </article>
      ) : null}

      <article className="scalpingAdminCard scalpingAdminPerformanceHeader">
        <header><div><strong>현재 성과</strong><span>{formatStatus(performance.status)} · {performance.mode || "none"}</span></div><small>{performance.asOf ? formatDate(performance.asOf) : "실제 1분 데이터 리플레이 또는 Shadow 스냅샷 대기"}</small></header>
        <div className="scalpingAdminMetricGrid">{cards.map((card) => <div key={card.label} className={`scalpingAdminMetric scalpingAdminMetric--${card.tone}`}><span>{card.label}</span><strong>{card.value}</strong></div>)}</div>
      </article>

      <div className="scalpingAdminGrid scalpingAdminGrid--charts">
        <LineChart title="자산 곡선" description="현금과 평가손익을 포함한 총자산" points={performance.charts.equityCurve} valueKey="equity" formatter={formatMoney} />
        <LineChart title="낙폭 곡선" description="직전 고점 대비 손실률" points={performance.charts.drawdownCurve} valueKey="drawdownPct" formatter={(value) => `${formatNumber(value)}%`} />
        <DailyPnlChart rows={performance.charts.dailyPnl} />
      </div>

      <article className="scalpingAdminCard"><header><div><strong>목표 대비 현재 성과</strong><span>성과 스냅샷이 없으면 0이 아니라 미측정으로 표시합니다.</span></div></header><ObjectiveTable comparisons={performance.objectiveComparisons} /></article>

      <div className="scalpingAdminGrid scalpingAdminGrid--tables">
        <article className="scalpingAdminCard">
          <header><div><strong>최근 완결 거래</strong><span>최대 20건</span></div></header>
          <div className="scalpingAdminTableWrap"><table className="scalpingAdminTable"><thead><tr><th>종목</th><th>진입</th><th>청산</th><th>순손익</th></tr></thead><tbody>
            {performance.latestTrades.length > 0 ? performance.latestTrades.map((trade, index) => <tr key={`${trade.symbol}-${trade.entryTimestamp}-${index}`}><td>{trade.symbol}</td><td>{formatDate(trade.entryTimestamp)}</td><td>{formatDate(trade.exitTimestamp)}</td><td>{formatMoney(trade.netPnl)}</td></tr>) : <tr><td colSpan="4" className="scalpingAdminEmptyCell">완결 거래 스냅샷이 없습니다.</td></tr>}
          </tbody></table></div>
        </article>
        <article className="scalpingAdminCard">
          <header><div><strong>종목별 성과</strong><span>완결 거래 기준</span></div></header>
          <div className="scalpingAdminTableWrap"><table className="scalpingAdminTable"><thead><tr><th>종목</th><th>거래</th><th>승률</th><th>순손익</th></tr></thead><tbody>
            {Object.entries(performance.breakdown.bySymbol || {}).length > 0 ? Object.entries(performance.breakdown.bySymbol).map(([symbol, row]) => <tr key={symbol}><td>{symbol}</td><td>{formatNumber(row.trades, 0)}건</td><td>{row.winRate === null || row.winRate === undefined ? "—" : `${formatNumber(row.winRate * 100)}%`}</td><td>{formatMoney(row.netPnl)}</td></tr>) : <tr><td colSpan="4" className="scalpingAdminEmptyCell">종목별 성과 데이터가 없습니다.</td></tr>}
          </tbody></table></div>
        </article>
      </div>

      {auditEvents.length > 0 ? (
        <details className="scalpingAdminAuditDetails"><summary>전략 감사 이벤트 {auditEvents.length}건</summary><ul>{auditEvents.slice(0, 20).map((event) => <li key={event.id}><strong>{event.eventType}</strong><span>{event.actor} · revision {event.draftRevision ?? "—"} · {formatDate(event.createdAt)}</span></li>)}</ul></details>
      ) : null}
    </section>
  );
}

export default TradingScalpingAdminPanel;
