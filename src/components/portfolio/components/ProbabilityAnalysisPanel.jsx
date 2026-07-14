import { AlertTriangle, BarChart3, Info, ShieldCheck } from "lucide-react";

import {
  STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
  STEP114_2G_PROBABILITY_FIXTURE_RESULT,
} from "../fixtures/probabilityScenarioResultFixture";
import {
  buildProbabilityScenarioViewModel,
  isProbabilityViewModelReady,
} from "../utils/probabilityScenarioAdapter";
import ProbabilityBandChart from "./ProbabilityBandChart";

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

function ProbabilityStatusPanel({ viewModel }) {
  return (
    <section
      className={`probabilityStatusPanel probabilityStatus-${viewModel.status}`}
      aria-live="polite"
      aria-label="확률분석 상태"
    >
      <div className="probabilityStatusIcon" aria-hidden="true">
        {viewModel.status === "blocked" || viewModel.status === "error" ? <AlertTriangle size={22} /> : <Info size={22} />}
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
    <section className="probabilitySummaryGrid" aria-label="확률분석 주요 카드">
      {cards.map((card) => (
        <article key={card.key} className="probabilitySummaryCard">
          <span>{card.label}</span>
          <strong>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}

function MethodologyPanel({ viewModel }) {
  const methodology = Array.isArray(viewModel.methodology) ? viewModel.methodology : [];
  return (
    <section className="probabilityMethodologyPanel" aria-label="확률분석 방법론 메타데이터">
      <div className="probabilitySectionTitle">
        <ShieldCheck size={18} aria-hidden="true" />
        <div>
          <p className="sectionLabel">Methodology</p>
          <h4>데이터 품질 및 방법론</h4>
        </div>
      </div>

      <dl className="probabilityMethodologyGrid">
        {methodology.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <details className="probabilityAuditDetails">
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

export default function ProbabilityAnalysisPanel({
  activePortfolio,
  assets,
  settings,
  result,
  isEmptyAssetRow,
  scenarioResult = STEP114_2G_PROBABILITY_FIXTURE_RESULT,
  expectedInputHash = STEP114_2G_FIXTURE_EXPECTED_INPUT_HASH,
}) {
  const activeAssets = getActiveAssets(assets, isEmptyAssetRow);
  const viewModel = buildProbabilityScenarioViewModel({
    result: scenarioResult,
    activePortfolio,
    assets: activeAssets,
    settings,
    baselineResult: result,
    expectedInputHash,
  });
  const staleDisplayViewModel = viewModel.status === "stale" && viewModel.previousResult
    ? buildProbabilityScenarioViewModel({
      result: viewModel.previousResult,
      activePortfolio,
      assets: activeAssets,
      settings,
      baselineResult: result,
      expectedInputHash: null,
    })
    : null;
  const isReady = isProbabilityViewModelReady(viewModel);
  const canShowStaleChart = isProbabilityViewModelReady(staleDisplayViewModel);
  const chartViewModel = isReady ? viewModel : staleDisplayViewModel;

  return (
    <div className="simulatorTabPanel probabilityAnalysisPanel">
      <div className="tabSectionHeader tabSectionHeaderRow">
        <div>
          <p className="sectionLabel">Step 4. Probability</p>
          <h3>확률분석</h3>
          <p>
            검증된 fixture 결과를 이용해 과거 월간 수익률 재표본화 기반의 확률 밴드를 확인합니다.
          </p>
        </div>
        <div className="probabilityFixtureBadge">
          <span>fixture review</span>
          <strong>production 비활성</strong>
        </div>
      </div>

      <section className="probabilityPortfolioContext" aria-label="선택 포트폴리오 확률분석 컨텍스트">
        <div>
          <span>선택 포트폴리오</span>
          <strong>{activePortfolio?.name || "선택 포트폴리오"}</strong>
        </div>
        <div>
          <span>표시 자산</span>
          <strong>{formatAssetList(activeAssets)}</strong>
        </div>
        <div>
          <span>상태</span>
          <strong>{viewModel.status}</strong>
        </div>
      </section>

      {!isReady ? (
        <ProbabilityStatusPanel viewModel={viewModel} />
      ) : null}

      {isReady || canShowStaleChart ? (
        <>
          <section className="probabilityReadyNotice" aria-label="확률분석 검증 상태">
            <BarChart3 size={20} aria-hidden="true" />
            <div>
              <strong>{viewModel.status === "stale" ? "이전 fixture-safe 확률 밴드" : "검증된 fixture-safe 확률 밴드"}</strong>
              <p>
                P50은 중앙 경로이며 예측 또는 보장 수익률이 아닙니다. 기준전망과 누적 납입금은 별도 선으로 표시합니다.
                {viewModel.status === "stale" ? " 현재 포트폴리오와 일치하지 않는 이전 결과입니다." : ""}
              </p>
            </div>
          </section>

          <ProbabilityBandChart chart={chartViewModel.chart} />
          <SummaryCards cards={chartViewModel.summaryCards} />

          <section className="probabilityMddNotice" aria-label="시나리오 MDD 안내">
            <strong>시나리오 MDD와 기존 historical MDD는 다른 지표입니다.</strong>
            <p>
              시나리오 MDD는 bootstrap 경로별 risk NAV 하락폭 분포입니다. 음수 값에서는 더 낮은 분위수가 더 불리한 하방 위험입니다.
            </p>
          </section>
        </>
      ) : null}

      <MethodologyPanel viewModel={viewModel} />

      <section className="probabilityDisclaimer" aria-label="확률분석 고지">
        <strong>투자 유의사항</strong>
        <p>
          이 확률분석은 과거 월간 수익률을 재표본화한 시뮬레이션입니다.
          미래 수익을 예측하거나 보장하지 않으며, 투자 권유가 아닙니다.
        </p>
      </section>
    </div>
  );
}
