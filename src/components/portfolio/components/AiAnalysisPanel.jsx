import { AlertTriangle, BrainCircuit, CheckCircle2, Clock3, ShieldCheck, Sparkles } from "lucide-react";

function getActiveAssets(assets = [], isEmptyAssetRow) {
  return assets.filter((asset) => {
    if (typeof isEmptyAssetRow === "function" && isEmptyAssetRow(asset)) return false;
    return Boolean(String(asset?.ticker || "").trim());
  });
}

function getTopAssets(assets = []) {
  return [...assets]
    .map((asset) => {
      const actualValue = Number(asset.quantity || 0) * Number(asset.price || 0);
      const plannedValue = Number(asset.targetEvaluationAmount || 0);
      return {
        ...asset,
        displayValue: plannedValue > 0 ? plannedValue : actualValue,
      };
    })
    .sort((left, right) => Number(right.displayValue || 0) - Number(left.displayValue || 0))
    .slice(0, 4);
}

function getReadiness(activeAssets = [], result = {}) {
  const missingMetricCount = activeAssets.filter((asset) => {
    const hasCagr = Number.isFinite(Number(asset.cagr));
    const hasBeta = Number.isFinite(Number(asset.beta));
    const hasMdd = Number.isFinite(Number(asset.mdd));
    return !hasCagr || !hasBeta || !hasMdd;
  }).length;
  const hasPortfolioMetrics = Number.isFinite(Number(result?.expectedCagr)) &&
    Number.isFinite(Number(result?.simpleMdd));

  if (activeAssets.length === 0) return { level: "empty", label: "입력 대기", tone: "muted" };
  if (missingMetricCount > 0 || !hasPortfolioMetrics) return { level: "review", label: "데이터 확인", tone: "warning" };
  return { level: "ready", label: "분석 준비", tone: "ready" };
}

function StatusItem({ icon: Icon, title, text }) {
  return (
    <div className="aiAnalysisStatusItem">
      <span className="aiAnalysisStatusIcon" aria-hidden="true"><Icon size={18} /></span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function AiAnalysisPanel({
  activePortfolio,
  assets,
  result,
  formatNumber,
  formatPercent,
  isEmptyAssetRow,
}) {
  const activeAssets = getActiveAssets(assets, isEmptyAssetRow);
  const topAssets = getTopAssets(activeAssets);
  const readiness = getReadiness(activeAssets, result);
  const portfolioName = activePortfolio?.name || "현재 포트폴리오";
  const expectedCagr = formatPercent?.(result?.expectedCagr || 0) || "-";
  const expectedBeta = Number.isFinite(Number(result?.expectedBeta))
    ? Number(result.expectedBeta).toFixed(2)
    : "-";
  const simpleMdd = formatPercent?.(result?.simpleMdd || 0) || "-";
  const futureValue = formatNumber?.(result?.futureValue || 0) || "-";

  return (
    <div className="simulatorTabPanel aiAnalysisPanel">
      <div className="tabSectionHeader aiAnalysisHeader">
        <p className="sectionLabel">AI Analysis</p>
        <div>
          <h3>STEP 4 AI 분석</h3>
          <p>
            FINPLE 계산값과 Data Sentinel 원칙을 바탕으로 포트폴리오 구조, 데이터 한계,
            주요 위험요인을 검토합니다.
          </p>
        </div>
        <span className={`aiAnalysisReadiness ${readiness.tone}`}>{readiness.label}</span>
      </div>

      <div className="aiAnalysisPrimary">
        <div className="aiAnalysisSubject">
          <div>
            <span>분석 대상</span>
            <strong>{portfolioName}</strong>
            <p>{activeAssets.length}개 자산을 기준으로 STEP 4 분석을 준비합니다.</p>
          </div>
          <button type="button" className="aiAnalysisActionButton" disabled>
            <Sparkles size={18} aria-hidden="true" />
            <span>분석 생성 준비 중</span>
          </button>
        </div>

        <div className="aiAnalysisMetricGrid" aria-label="AI 분석 입력 요약">
          <div><span>예상 CAGR</span><strong>{expectedCagr}</strong></div>
          <div><span>예상 Beta</span><strong>{expectedBeta}</strong></div>
          <div><span>MDD</span><strong>{simpleMdd}</strong></div>
          <div><span>예상 평가금액</span><strong>{futureValue}원</strong></div>
        </div>
      </div>

      <div className="aiAnalysisStatusGrid" aria-label="AI 분석 상태">
        <StatusItem
          icon={CheckCircle2}
          title="Empty"
          text="분석 결과가 없을 때 현재 포트폴리오 요약과 준비 상태를 표시합니다."
        />
        <StatusItem
          icon={Clock3}
          title="Loading"
          text="다음 연결 단계에서 생성 요청이 진행 중일 때 이 상태를 사용합니다."
        />
        <StatusItem
          icon={ShieldCheck}
          title="Ready"
          text="백엔드 validator를 통과한 응답만 STEP 4 화면에 표시합니다."
        />
        <StatusItem
          icon={AlertTriangle}
          title="Error"
          text="요청 실패나 검증 실패 시 기존 계산 화면을 유지하고 재시도 상태를 표시합니다."
        />
      </div>

      <div className="aiAnalysisContentGrid">
        <section className="aiAnalysisSection">
          <div className="aiAnalysisSectionHeader">
            <BrainCircuit size={18} aria-hidden="true" />
            <strong>자산 역할 미리보기</strong>
          </div>
          <div className="aiAnalysisAssetList">
            {topAssets.map((asset) => (
              <div key={asset.id || asset.ticker} className="aiAnalysisAssetRow">
                <span>{asset.ticker || "-"}</span>
                <strong>{asset.name || asset.ticker || "-"}</strong>
                <em>{formatNumber?.(asset.displayValue || 0) || "0"}원</em>
              </div>
            ))}
            {topAssets.length === 0 && (
              <p className="aiAnalysisEmptyText">STEP 1에서 자산을 추가하면 분석 대상이 표시됩니다.</p>
            )}
          </div>
        </section>

        <section className="aiAnalysisSection">
          <div className="aiAnalysisSectionHeader">
            <ShieldCheck size={18} aria-hidden="true" />
            <strong>표시 경계</strong>
          </div>
          <ul className="aiAnalysisBoundaryList">
            <li>AI 분석은 기존 계산값을 다시 계산하지 않습니다.</li>
            <li>매수, 매도, 보유 추천과 목표 비중을 표시하지 않습니다.</li>
            <li>탭 진입만으로 백엔드 API를 호출하지 않습니다.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
