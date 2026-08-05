import { useEffect, useMemo, useState } from "react";

import {
  fetchTradingScalpingAdminDashboard,
  saveTradingScalpingAdminDraft,
} from "./tradingScalpingAdminApi.js";
import "./TradingScalpingAdminPanel.css";

const SYMBOLS = ["TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA"];

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

function formatStatus(status) {
  const labels = {
    ready_replay_snapshot: "리플레이 성과 준비됨",
    unavailable_no_persisted_replay_or_shadow_snapshot: "성과 스냅샷 없음",
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
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
        <small>{points.length > 0 ? `${formatter(first)} → ${formatter(last)}` : "데이터 없음"}</small>
      </header>
      {path ? (
        <div className="scalpingAdminChartViewport">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} className="scalpingAdminChartGrid" />
            <path d={path} className="scalpingAdminChartLine" />
          </svg>
        </div>
      ) : (
        <div className="scalpingAdminEmptyChart">리플레이 또는 Shadow 성과 스냅샷이 연결되면 표시됩니다.</div>
      )}
    </article>
  );
}

function DailyPnlChart({ rows = [] }) {
  const maximum = Math.max(1, ...rows.map((row) => Math.abs(Number(row.pnl) || 0)));
  return (
    <article className="scalpingAdminChartCard">
      <header>
        <div>
          <strong>일별 손익</strong>
          <span>평가일별 리플레이 또는 Shadow 손익</span>
        </div>
        <small>{rows.length > 0 ? `${rows.length}일` : "데이터 없음"}</small>
      </header>
      {rows.length > 0 ? (
        <div className="scalpingAdminDailyBars" role="img" aria-label="일별 손익 막대 차트">
          {rows.map((row) => {
            const value = Number(row.pnl) || 0;
            return (
              <div key={row.date} className="scalpingAdminDailyBarItem" title={`${row.date}: ${formatMoney(value)}`}>
                <div className="scalpingAdminDailyBarAxis">
                  <span
                    className={`scalpingAdminDailyBar ${value >= 0 ? "isPositive" : "isNegative"}`}
                    style={{ height: `${Math.max(4, (Math.abs(value) / maximum) * 72)}px` }}
                  />
                </div>
                <small>{row.date?.slice(5)}</small>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="scalpingAdminEmptyChart">일별 성과 데이터가 아직 없습니다.</div>
      )}
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
          step={field.step}
          min={field.min === undefined ? undefined : field.min * scale}
          max={field.max === undefined ? undefined : field.max * scale}
          onChange={(event) => {
            const next = event.target.value === "" ? "" : Number(event.target.value) / scale;
            onChange(next);
          }}
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
        <thead>
          <tr>
            <th>연구 승인 기준</th>
            <th>목표</th>
            <th>현재</th>
            <th>판정</th>
          </tr>
        </thead>
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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchTradingScalpingAdminDashboard();
      setDashboard(next);
      setForm(toForm(next));
    } catch (loadError) {
      setError(loadError.message || "스캘핑 관리자 대시보드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const cards = useMemo(() => metricCards(dashboard?.performance), [dashboard]);
  const strategy = form?.strategy;
  const objectives = form?.objectives;

  const updateStrategy = (key, value) => {
    setForm((current) => ({ ...current, strategy: { ...current.strategy, [key]: value } }));
    setMessage("");
  };

  const updateObjective = (key, value) => {
    setForm((current) => ({ ...current, objectives: { ...current.objectives, [key]: value } }));
    setMessage("");
  };

  const toggleSymbol = (symbol) => {
    const current = strategy?.allowedSymbols || [];
    const next = current.includes(symbol) ? current.filter((item) => item !== symbol) : [...current, symbol];
    updateStrategy("allowedSymbols", next);
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await saveTradingScalpingAdminDraft(form);
      setDashboard(result.dashboard);
      setForm(toForm(result.dashboard));
      setMessage("전략 초안을 저장했습니다. 이 변경은 Trading Worker나 실계좌 주문에는 적용되지 않습니다.");
    } catch (saveError) {
      if (saveError.status === 409) {
        await load();
        setError("다른 초안 갱신이 감지되어 최신값을 다시 불러왔습니다.");
      } else {
        const details = saveError.reasons?.length ? ` (${saveError.reasons.join(", ")})` : "";
        setError(`${saveError.message || "전략 초안을 저장하지 못했습니다."}${details}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="scalpingAdminPanel scalpingAdminPanel--loading">스캘핑 전략 대시보드를 불러오는 중입니다.</section>;
  }

  if (!dashboard || !form) {
    return (
      <section className="scalpingAdminPanel scalpingAdminPanel--error">
        <strong>스캘핑 전략 대시보드 연결 실패</strong>
        <p>{error || "관리자 API 응답을 확인해 주세요."}</p>
        <button type="button" onClick={() => void load()}>다시 불러오기</button>
      </section>
    );
  }

  const performance = dashboard.performance;
  return (
    <section className="scalpingAdminPanel" aria-labelledby="scalping-admin-title">
      <header className="scalpingAdminHero">
        <div>
          <span className="scalpingAdminEyebrow">TSC-1 · TSC-2 · TSC-3 ADMIN CONTROL</span>
          <h2 id="scalping-admin-title">레버리지 ETF 스캘핑 전략</h2>
          <p>전략 파라미터와 연구 목표를 조정하고, 리플레이·Shadow 성과를 KPI와 차트로 검토합니다.</p>
        </div>
        <div className="scalpingAdminHeroMeta">
          <span className="scalpingAdminStatus scalpingAdminStatus--draft">초안 revision {dashboard.draft.revision}</span>
          <span className="scalpingAdminStatus scalpingAdminStatus--blocked">실주문 차단</span>
          <span className="scalpingAdminStatus scalpingAdminStatus--neutral">관리자 전용</span>
        </div>
      </header>

      <div className="scalpingAdminSafetyNotice">
        <strong>안전 경계</strong>
        <span>저장값은 서버 프로세스 메모리의 연구 초안입니다. 재시작 시 초기화되며 Trading Worker·KIS 주문·Production에는 적용되지 않습니다.</span>
      </div>

      {message ? <div className="scalpingAdminFeedback isSuccess">{message}</div> : null}
      {error ? <div className="scalpingAdminFeedback isError">{error}</div> : null}

      <div className="scalpingAdminGrid scalpingAdminGrid--editor">
        <article className="scalpingAdminCard">
          <header>
            <div>
              <strong>매매전략 초안</strong>
              <span>EMA·확률·비용·손절·포지션 한도를 조정합니다.</span>
            </div>
          </header>
          <div className="scalpingAdminSymbolGrid">
            {SYMBOLS.map((symbol) => (
              <label key={symbol} className={strategy.allowedSymbols.includes(symbol) ? "isSelected" : ""}>
                <input type="checkbox" checked={strategy.allowedSymbols.includes(symbol)} onChange={() => toggleSymbol(symbol)} />
                <span>{symbol}</span>
              </label>
            ))}
          </div>
          <div className="scalpingAdminFieldGrid">
            {STRATEGY_FIELDS.map((field) => (
              <NumericField key={field.key} field={field} value={strategy[field.key]} onChange={(value) => updateStrategy(field.key, value)} />
            ))}
          </div>
          <label className="scalpingAdminToggle">
            <input type="checkbox" checked={strategy.requireModelSignal === true} onChange={(event) => updateStrategy("requireModelSignal", event.target.checked)} />
            <span>외부 AI 모델 신호 필수</span>
          </label>
        </article>

        <article className="scalpingAdminCard">
          <header>
            <div>
              <strong>연구 목표·승인 기준</strong>
              <span>목표수익률은 수익 보장이 아니라 Shadow/Live 승격 심사 기준입니다.</span>
            </div>
          </header>
          <div className="scalpingAdminFieldGrid scalpingAdminFieldGrid--objectives">
            {OBJECTIVE_FIELDS.map((field) => (
              <NumericField key={field.key} field={field} value={objectives[field.key]} onChange={(value) => updateObjective(field.key, value)} />
            ))}
          </div>
          <div className="scalpingAdminSaveRow">
            <div>
              <small>마지막 저장</small>
              <strong>{dashboard.draft.updatedAt ? new Date(dashboard.draft.updatedAt).toLocaleString("ko-KR") : "시스템 기본값"}</strong>
            </div>
            <button type="button" onClick={() => void save()} disabled={saving || strategy.allowedSymbols.length === 0}>
              {saving ? "저장 중" : "전략 초안 저장"}
            </button>
          </div>
        </article>
      </div>

      <article className="scalpingAdminCard scalpingAdminPerformanceHeader">
        <header>
          <div>
            <strong>현재 성과</strong>
            <span>{formatStatus(performance.status)} · {performance.mode || "none"}</span>
          </div>
          <small>{performance.asOf ? new Date(performance.asOf).toLocaleString("ko-KR") : "실제 1분 데이터 리플레이 또는 Shadow 스냅샷 대기"}</small>
        </header>
        <div className="scalpingAdminMetricGrid">
          {cards.map((card) => (
            <div key={card.label} className={`scalpingAdminMetric scalpingAdminMetric--${card.tone}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </div>
      </article>

      <div className="scalpingAdminGrid scalpingAdminGrid--charts">
        <LineChart title="자산 곡선" description="현금과 평가손익을 포함한 총자산" points={performance.charts.equityCurve} valueKey="equity" formatter={formatMoney} />
        <LineChart title="낙폭 곡선" description="직전 고점 대비 손실률" points={performance.charts.drawdownCurve} valueKey="drawdownPct" formatter={(value) => `${formatNumber(value)}%`} />
        <DailyPnlChart rows={performance.charts.dailyPnl} />
      </div>

      <article className="scalpingAdminCard">
        <header>
          <div>
            <strong>목표 대비 현재 성과</strong>
            <span>성과 스냅샷이 없으면 0이 아니라 미측정으로 표시합니다.</span>
          </div>
        </header>
        <ObjectiveTable comparisons={performance.objectiveComparisons} />
      </article>

      <div className="scalpingAdminGrid scalpingAdminGrid--tables">
        <article className="scalpingAdminCard">
          <header><div><strong>최근 완결 거래</strong><span>최대 20건</span></div></header>
          <div className="scalpingAdminTableWrap">
            <table className="scalpingAdminTable">
              <thead><tr><th>종목</th><th>진입</th><th>청산</th><th>순손익</th></tr></thead>
              <tbody>
                {performance.latestTrades.length > 0 ? performance.latestTrades.map((trade, index) => (
                  <tr key={`${trade.symbol}-${trade.entryTimestamp}-${index}`}>
                    <td>{trade.symbol}</td>
                    <td>{trade.entryTimestamp ? new Date(trade.entryTimestamp).toLocaleString("ko-KR") : "—"}</td>
                    <td>{trade.exitTimestamp ? new Date(trade.exitTimestamp).toLocaleString("ko-KR") : "—"}</td>
                    <td>{formatMoney(trade.netPnl)}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="scalpingAdminEmptyCell">완결 거래 스냅샷이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="scalpingAdminCard">
          <header><div><strong>종목별 성과</strong><span>완결 거래 기준</span></div></header>
          <div className="scalpingAdminTableWrap">
            <table className="scalpingAdminTable">
              <thead><tr><th>종목</th><th>거래</th><th>승률</th><th>순손익</th></tr></thead>
              <tbody>
                {Object.entries(performance.breakdown.bySymbol || {}).length > 0 ? Object.entries(performance.breakdown.bySymbol).map(([symbol, row]) => (
                  <tr key={symbol}>
                    <td>{symbol}</td>
                    <td>{formatNumber(row.trades, 0)}건</td>
                    <td>{row.winRate === null || row.winRate === undefined ? "—" : `${formatNumber(row.winRate * 100)}%`}</td>
                    <td>{formatMoney(row.netPnl)}</td>
                  </tr>
                )) : <tr><td colSpan="4" className="scalpingAdminEmptyCell">종목별 성과 데이터가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}

export default TradingScalpingAdminPanel;
