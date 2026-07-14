import { useState } from "react";
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
          onClick={() => onSelectScenario(option.scenarioId)}
        >
          <span>{option.mode}</span>
          <strong>{option.label}</strong>
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

      <details className="externalShockAuditDetails">
        <summary>개발·감사용 메타데이터</summary>
        <dl>
          <div><dt>fixtureOnly</dt><dd>{String(Boolean(viewModel.fixtureOnly))}</dd></div>
          <div><dt>sourceHashCount</dt><dd>{viewModel.audit?.sourceHashCount ?? "-"}</dd></div>
          <div><dt>outputHash</dt><dd>{viewModel.audit?.outputHash ? "available" : "-"}</dd></div>
          <div><dt>betaApplied</dt><dd>{String(viewModel.audit?.betaApplied ?? false)}</dd></div>
          <div><dt>cagrCalibrationApplied</dt><dd>{String(viewModel.audit?.cagrCalibrationApplied ?? false)}</dd></div>
          <div><dt>historicalMddApplied</dt><dd>{String(viewModel.audit?.historicalMddApplied ?? false)}</dd></div>
        </dl>
      </details>
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

  return (
    <div className="simulatorTabPanel externalShockAnalysisPanel">
      <div className="tabSectionHeader tabSectionHeaderRow">
        <div>
          <p className="sectionLabel">Step 5. External Shock</p>
          <h3>외부충격분석</h3>
          <p>
            검증된 fixture review 결과가 있을 때만 기준 경로와 충격 경로를 비교합니다.
            일반 화면에서는 실제 포트폴리오 숫자와 synthetic fixture 숫자를 자동 결합하지 않습니다.
          </p>
        </div>
        <div className="externalShockFixtureBadge">
          <span>{enableFixtureReview ? "fixture review" : "idle"}</span>
          <strong>{enableFixtureReview ? "production 비활성" : "precomputed 연결 대기"}</strong>
        </div>
      </div>

      <section className="externalShockPortfolioContext" aria-label="외부충격분석 컨텍스트">
        {isReady ? (
          <>
            <div>
              <span>분석 identity</span>
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
          <strong>{viewModel.status}</strong>
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

          <section className="externalShockReadyNotice" aria-label="외부충격분석 검증 상태">
            <Activity size={20} aria-hidden="true" />
            <div>
              <strong>검증된 fixture-safe 외부충격 경로</strong>
              <p>
                충격은 offline fixture 입력으로만 계산되며, 예측·보장·투자 권유가 아닙니다.
                Step 4 확률분석의 분위수 의미와 분리된 deterministic 비교입니다.
              </p>
            </div>
          </section>

          <ExternalShockPathChart chart={viewModel.chart} />
          <SummaryCards cards={viewModel.summaryCards} />
          <ScenarioComparisonTable rows={viewModel.scenarioComparisonRows} />
          <AssetImpactTable rows={viewModel.assetImpactSummary} />
        </>
      ) : null}

      <MethodologyPanel viewModel={viewModel} />

      <section className="externalShockDisclaimer" aria-label="외부충격분석 고지">
        <strong>투자 유의사항</strong>
        <p>
          이 외부충격분석은 synthetic fixture 기반의 결정론적 비교입니다.
          충격의 발생 확률이나 미래 수익률을 예측하지 않으며 투자 권유가 아닙니다.
          실제 시장 데이터 호출, 실시간 공급자 호출, 주문 또는 AI 해석을 수행하지 않습니다.
        </p>
      </section>
    </div>
  );
}
