import { useEffect, useState } from "react";
import { AlertTriangle, Activity, Info, ShieldCheck } from "lucide-react";

import {
  buildExternalShockScenarioViewModel,
  isExternalShockViewModelReady,
} from "../utils/externalShockScenarioAdapter";
import ExternalShockPathChart from "./ExternalShockPathChart";

function getActiveAssets(assets = [], isEmptyAssetRow) {
  return assets.filter((asset) => {
    if (typeof isEmptyAssetRow === "function" && isEmptyAssetRow(asset)) return false;
    return Boolean(String(asset?.ticker || "").trim());
  });
}

function formatAssetList(assets = []) {
  const labels = assets
    .map((asset) => `${String(asset.market || "-").toUpperCase()}:${String(asset.ticker || "").toUpperCase()}`)
    .filter((label) => !label.endsWith(":"));
  return labels.length > 0 ? labels.join(" · ") : "-";
}

function formatWon(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(1)}%`;
}

function ExternalShockStatusPanel({ viewModel }) {
  const isWarning = viewModel.status === "blocked" || viewModel.status === "error" || viewModel.status === "stale";
  return (
    <section
      className={`externalShockStatusPanel externalShockStatus-${viewModel.status}`}
      aria-live="polite"
      aria-busy={viewModel.status === "loading"}
      aria-label="외부충격분석 상태"
    >
      <div className="externalShockStatusIcon" aria-hidden="true">
        {isWarning ? <AlertTriangle size={22} /> : <Info size={22} />}
      </div>
      <div>
        <strong>{viewModel.title}</strong>
        <p>{viewModel.userGuidance || viewModel.message}</p>
      </div>
    </section>
  );
}

function SummaryCards({ cards = [] }) {
  return (
    <section className="externalShockSummaryGrid" aria-label="외부충격분석 주요 카드">
      {cards.map((card) => (
        <article key={card.key} className="externalShockSummaryCard">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}

function ScenarioSelector({ options = [], selectedScenarioId, onSelectScenario }) {
  if (!Array.isArray(options) || options.length < 2) return null;
  return (
    <section className="externalShockScenarioSelector" aria-label="외부충격 시나리오 선택">
      {options.map((option) => (
        <button
          key={option.scenarioId}
          type="button"
          className={option.scenarioId === selectedScenarioId ? "active" : ""}
          aria-pressed={option.scenarioId === selectedScenarioId}
          aria-label={`${option.label}, ${option.assumptionLabel}${option.enabled ? "" : `, 선택 불가: ${option.disabledReason}`}`}
          title={option.enabled ? undefined : option.disabledReason}
          disabled={!option.enabled}
          onClick={() => onSelectScenario(option.scenarioId)}
        >
          <span>{option.assumptionLabel}</span>
          <strong>{option.label}</strong>
          {!option.enabled ? <small>{option.disabledReason}</small> : null}
        </button>
      ))}
    </section>
  );
}

function ScenarioComparisonTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  return (
    <section className="externalShockComparisonPanel" aria-label="외부충격 시나리오 비교표">
      <div className="externalShockSectionTitle">
        <Activity size={18} aria-hidden="true" />
        <div>
          <p className="sectionLabel">Scenario Comparison</p>
          <h4>시나리오별 비교</h4>
        </div>
      </div>
      <div className="externalShockTableScroll">
      <table>
        <thead>
          <tr>
            <th>시나리오</th>
            <th>모드</th>
            <th>최종 영향률</th>
            <th>충격 MDD</th>
            <th>증분 MDD</th>
            <th>회복</th>
            <th>미회복</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.scenarioId}>
              <td>{row.label}</td>
              <td>{row.mode}</td>
              <td>{row.terminalDeltaRateLabel}</td>
              <td>{row.stressedMddLabel}</td>
              <td>{row.incrementalMddLabel}</td>
              <td>{row.recoveryLabel}</td>
              <td>{row.unrecovered ? "예" : "아니오"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}

function ShockAssumptionsTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (
    <section className="externalShockAssumptionPanel" aria-label="External shock assumptions">
      <div className="externalShockSectionTitle">
        <Info size={18} aria-hidden="true" />
        <div>
          <p className="sectionLabel">분석 조건</p>
          <h4>선택 시나리오 조건</h4>
        </div>
      </div>
      <div className="externalShockTableScroll">
        <table>
          <thead>
            <tr>
              <th>충격 시점</th>
              <th>시나리오</th>
              <th>자산</th>
              <th>방식</th>
              <th>자산 충격</th>
              <th>시장 충격</th>
              <th>Beta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowKey}>
                <td>{row.month}</td>
                <td>{row.label}</td>
                <td>{row.asset}</td>
                <td>{row.mode}</td>
                <td>{row.directShockLabel}</td>
                <td>{row.marketFactorShockLabel}</td>
                <td>{row.betaLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AssetImpactTable({ rows = [] }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return (
    <section className="externalShockImpactPanel" aria-label="자산별 충격 영향">
      <div className="externalShockSectionTitle">
        <Activity size={18} aria-hidden="true" />
        <div>
          <p className="sectionLabel">Asset Impact</p>
          <h4>자산별 최종 영향</h4>
        </div>
      </div>
      <div className="externalShockTableScroll">
      <table>
        <thead>
          <tr>
            <th>자산</th>
            <th>기준 최종</th>
            <th>충격 최종</th>
            <th>차이</th>
            <th>차이율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.market}:${row.ticker}`}>
              <td>{`${row.market}:${row.ticker}`}</td>
              <td>{formatWon(row.baselineTerminalValue)}</td>
              <td>{formatWon(row.stressedTerminalValue)}</td>
              <td>{formatWon(row.deltaValue)}</td>
              <td>{formatPercent(row.deltaRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}

function MethodologyPanel({ viewModel }) {
  const methodology = Array.isArray(viewModel.methodology) ? viewModel.methodology : [];
  return (
    <section className="externalShockMethodologyPanel" aria-label="외부충격분석 방법론 메타데이터">
      <div className="externalShockSectionTitle">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <p className="sectionLabel">Methodology</p>
          <h4>데이터 범위와 계산 정책</h4>
        </div>
      </div>

      <dl className="externalShockMethodologyGrid">
        {methodology.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

    </section>
  );
}

export default function ExternalShockAnalysisPanel({
  activePortfolio,
  assets,
  settings,
  result,
  isEmptyAssetRow,
  scenarioResult = null,
  scenarioResults = null,
  scenarioLoadStatus = "idle",
  scenarioLoadError = null,
  selectedScenarioId = null,
  expectedInputHash = null,
  expectedOutputHash = null,
  enableFixtureReview = false,
  fixtureBaselineResult = null,
}) {
  const [activeScenarioId, setActiveScenarioId] = useState(selectedScenarioId);
  const activeAssets = getActiveAssets(assets, isEmptyAssetRow);
  const viewModel = buildExternalShockScenarioViewModel({
    result: scenarioResult,
    scenarioResults,
    scenarioLoadStatus,
    scenarioLoadError,
    selectedScenarioId: activeScenarioId || selectedScenarioId,
    activePortfolio,
    assets: activeAssets,
    settings,
    baselineResult: fixtureBaselineResult || result,
    expectedInputHash,
    expectedOutputHash,
    enableFixtureReview,
  });
  const isReady = isExternalShockViewModelReady(viewModel);
  const selectedViewScenarioId = viewModel.scenarioId || activeScenarioId || selectedScenarioId;

  useEffect(() => {
    const nextScenarioId = isReady ? viewModel.scenarioId : null;
    if (activeScenarioId !== nextScenarioId) setActiveScenarioId(nextScenarioId);
  }, [activeScenarioId, isReady, viewModel.scenarioId]);

  return (
    <div className="simulatorTabPanel externalShockAnalysisPanel">
      <div className="tabSectionHeader tabSectionHeaderRow">
        <div>
          <p className="sectionLabel">Step 5. External Shock</p>
          <h3>외부충격분석</h3>
          <p>
            현재 포트폴리오에 사전에 정의된 시장 급락 충격을 적용해 기준 경로와 충격 경로를 비교합니다.
          </p>
        </div>
        <div className="externalShockStateBadge" aria-live="polite">
          <span>외부충격분석</span>
          <strong>{viewModel.title}</strong>
        </div>
      </div>

      <section className="externalShockPortfolioContext" aria-label="외부충격분석 컨텍스트">
        {isReady ? (
          <>
            <div>
              <span>선택 포트폴리오</span>
              <strong>{viewModel.selectedPortfolioName}</strong>
            </div>
            <div>
              <span>분석 자산</span>
              <strong>{viewModel.displayAssets?.join(" · ") || "-"}</strong>
            </div>
          </>
        ) : (
          <>
            <div>
              <span>현재 포트폴리오</span>
              <strong>{activePortfolio?.name || "선택 포트폴리오"}</strong>
            </div>
            <div>
              <span>현재 자산</span>
              <strong>{formatAssetList(activeAssets)}</strong>
            </div>
          </>
        )}
        <div>
          <span>상태</span>
          <strong aria-live="polite">{viewModel.title}</strong>
        </div>
      </section>

      {!isReady ? <ExternalShockStatusPanel viewModel={viewModel} /> : null}

      {isReady ? (
        <>
          <ScenarioSelector
            options={viewModel.scenarioOptions}
            selectedScenarioId={selectedViewScenarioId}
            onSelectScenario={setActiveScenarioId}
          />

          <section className="externalShockReadyNotice" aria-label="외부충격분석 설명">
            <Activity size={20} aria-hidden="true" />
            <div>
              <strong>과거 월간수익률 기반 스트레스 테스트</strong>
              <p>
                과거 월간수익률 기반 경로에 가상의 시장 충격을 한 차례 적용한 결정론적 스트레스 테스트입니다.
              </p>
            </div>
          </section>

          <ExternalShockPathChart chart={viewModel.chart} />
          <SummaryCards cards={viewModel.summaryCards} />
          <ScenarioComparisonTable rows={viewModel.scenarioComparisonRows} />
          <ShockAssumptionsTable rows={viewModel.shockAssumptionRows} />
          <AssetImpactTable rows={viewModel.assetImpactSummary} />
        </>
      ) : null}

      {isReady ? <MethodologyPanel viewModel={viewModel} /> : null}

      <section className="externalShockDisclaimer" aria-label="외부충격분석 고지">
        <strong>투자 유의사항</strong>
        <p>
          충격의 발생 확률이나 미래 수익률을 예측하지 않으며 투자 권유가 아닙니다.
          실시간 시세 조회, 외부 공급자 호출, 주문 또는 AI 해석을 수행하지 않습니다.
        </p>
      </section>
    </div>
  );
}
