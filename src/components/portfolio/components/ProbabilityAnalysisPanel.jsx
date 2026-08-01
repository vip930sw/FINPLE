import { AlertTriangle, BarChart3, Info, ShieldCheck } from "lucide-react";

import {
  buildProbabilityScenarioViewModel,
  isProbabilityViewModelReady,
} from "../utils/probabilityScenarioAdapter";
import { getStep4ScenarioAssets } from "../utils/portfolioFormatters.js";
import ProbabilityBandChart from "./ProbabilityBandChart";

function getScenarioLoadView(status, error) {
  if (status === "loading") {
    return { status: "월간 데이터 확인 중", message: "선택 자산에 필요한 월간 데이터만 확인합니다." };
  }
  if (status === "ready") {
    return { status: "분석 준비 완료", badge: "검증된 월간 데이터" };
  }
  if (status === "cash_only") {
    return {
      status: "현금성 자산 단독 포트폴리오입니다.",
      message: "연 2.0% 내부 기준수익률이 적용되는 확정 경로이므로",
      detail: "확률 밴드 대신 Step 3 기준전망을 확인해 주세요.",
    };
  }
  if (status === "blocked") {
    return { status: "계산 보류", message: error || "계산 보류 사유를 확인해 주세요." };
  }
  if (["unavailable", "error"].includes(status)) {
    return { status: "월간 데이터 부족", message: error || "필요한 월간 수익률 데이터가 부족합니다." };
  }
  return {
    status: "월간 데이터 연결 필요",
    message: "검증된 월간 수익률 데이터가 연결되지 않았습니다.",
  };
}

function formatAssetList(assets = []) {
  const labels = assets
    .map((asset) => `${String(asset.market || "-").toUpperCase()}:${String(asset.ticker || "").toUpperCase()}`)
    .filter((label) => !label.endsWith(":"));
  return labels.length > 0 ? labels.join(" · ") : "-";
}

function ProbabilityStatusPanel({ viewModel }) {
  const isWarning = viewModel.status === "blocked" || viewModel.status === "error" || viewModel.status === "stale";
  return (
    <section
      className={`probabilityStatusPanel probabilityStatus-${viewModel.status}`}
      aria-live="polite"
      aria-label="확률분석 상태"
    >
      <div className="probabilityStatusIcon" aria-hidden="true">
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
          <h4>데이터 범위와 방법론</h4>
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
          <div><dt>internalPreviewReviewOnly</dt><dd>{String(Boolean(viewModel.internalPreviewReviewOnly))}</dd></div>
          <div><dt>metricDataThroughMonth</dt><dd>{viewModel.internalPreviewContext?.metricDataThroughMonth || "-"}</dd></div>
          <div><dt>gapsForwardFilled</dt><dd>{String(viewModel.internalPreviewContext?.gapsForwardFilled ?? false)}</dd></div>
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
  scenarioResult = null,
  expectedInputHash = null,
  expectedOutputHash = null,
  enableFixtureReview = false,
  enableInternalPreviewReview = false,
  enableProductionAppExport = false,
  fixtureBaselineResult = null,
  scenarioLoadStatus = "idle",
  scenarioLoadError = "",
}) {
  const activeAssets = getStep4ScenarioAssets(assets);
  const viewModel = buildProbabilityScenarioViewModel({
    result: scenarioResult,
    activePortfolio,
    assets: activeAssets,
    settings,
    baselineResult: fixtureBaselineResult || result,
    expectedInputHash,
    expectedOutputHash,
    enableFixtureReview,
    enableInternalPreviewReview,
    enableProductionAppExport,
  });
  const isReady = isProbabilityViewModelReady(viewModel);
  const loadView = getScenarioLoadView(scenarioLoadStatus, scenarioLoadError);
  const showLoadStatus = scenarioLoadStatus !== "ready";
  const displayView = scenarioLoadStatus === "ready" && !isReady
    ? { status: viewModel.title }
    : loadView;

  return (
    <div className="simulatorTabPanel probabilityAnalysisPanel">
      <div className="tabSectionHeader tabSectionHeaderRow">
        <div>
          <p className="sectionLabel">Step 4. Probability</p>
          <h3>확률분석</h3>
          <p>
            검증된 월간 수익률 결과가 준비된 경우에만 과거 월간 수익률 재표본화 기반 확률 밴드를 표시합니다.
          </p>
        </div>
        <div className="probabilityFixtureBadge">
          <span>{displayView.status}</span>
          <strong>{displayView.badge || displayView.status}</strong>
        </div>
      </div>

      {showLoadStatus ? (
        <section className={`probabilityStatusPanel probabilityStatus-${scenarioLoadStatus}`} aria-live="polite">
          <div>
            <strong>{loadView.status}</strong>
            <p>{loadView.message}</p>
            {loadView.detail ? <p>{loadView.detail}</p> : null}
          </div>
        </section>
      ) : null}

      <section className="probabilityPortfolioContext" aria-label="확률분석 컨텍스트">
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
          <strong>{displayView.status}</strong>
        </div>
      </section>

      {scenarioLoadStatus === "ready" && !isReady ? <ProbabilityStatusPanel viewModel={viewModel} /> : null}

      {isReady ? (
        <>
          <section className="probabilityReadyNotice" aria-label="확률분석 검증 상태">
            <BarChart3 size={20} aria-hidden="true" />
            <div>
              <strong>검증된 월간 데이터 확률 밴드</strong>
              <p>
                P50은 중앙 경로이며 예측 또는 보장 수익률이 아닙니다. 기준전망과 누적 납입금은
                동일 analysis identity가 확인된 경우에만 함께 표시됩니다.
              </p>
            </div>
          </section>

          <ProbabilityBandChart chart={viewModel.chart} />
          <SummaryCards cards={viewModel.summaryCards} />

          <section className="probabilityMddNotice" aria-label="시나리오 MDD 안내">
            <strong>시나리오 MDD는 기존 historical MDD와 다른 지표입니다.</strong>
            <p>
              시나리오 MDD는 bootstrap 경로별 risk NAV 하락률 분포입니다. 회복 값에서는 미회복 비율과
              회복 기간을 별도 지표로 분리합니다.
            </p>
          </section>
        </>
      ) : null}

      <MethodologyPanel viewModel={viewModel} />

      <section className="probabilityDisclaimer" aria-label="확률분석 고지">
        <strong>투자 유의사항</strong>
        <p>
          이 확률분석은 과거 월간 수익률 재표본화 시뮬레이션입니다.
          미래 수익을 예측하거나 보장하지 않으며 투자 권유가 아닙니다.
        </p>
      </section>
    </div>
  );
}
