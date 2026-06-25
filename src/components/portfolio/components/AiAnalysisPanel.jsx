import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BrainCircuit, CheckCircle2, Clock3, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";

import { requestPortfolioAiAnalysis } from "../services/aiAnalysisService";
import {
  buildAiAnalysisPayload,
  createAiAnalysisInputSignature,
} from "../utils/buildAiAnalysisPayload";

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

function getStatusItems(analysisStatus) {
  return [
    {
      key: "empty",
      icon: CheckCircle2,
      title: "Empty",
      text: "분석 결과가 없을 때 현재 포트폴리오 요약과 준비 상태를 표시합니다.",
    },
    {
      key: "loading",
      icon: Clock3,
      title: "Loading",
      text: "생성 요청이 진행 중이며 버튼을 잠시 비활성화합니다.",
    },
    {
      key: "success",
      icon: ShieldCheck,
      title: "Ready",
      text: "백엔드 validator를 통과한 응답만 STEP 4 화면에 표시합니다.",
    },
    {
      key: "error",
      icon: AlertTriangle,
      title: "Error",
      text: "요청 실패나 검증 실패 시 기존 계산 화면을 유지하고 재시도 상태를 표시합니다.",
    },
  ].map((item) => ({
    ...item,
    active: item.key === analysisStatus || (analysisStatus === "stale" && item.key === "success"),
  }));
}

function getStatusCopy(analysisStatus, readiness) {
  if (analysisStatus === "loading") return "분석 생성 중";
  if (analysisStatus === "success") return "분석 완료";
  if (analysisStatus === "stale") return "입력 변경됨";
  if (analysisStatus === "error") return "재시도 필요";
  return readiness.label;
}

function getActionCopy(analysisStatus) {
  if (analysisStatus === "loading") return "분석 생성 중";
  if (analysisStatus === "success" || analysisStatus === "stale" || analysisStatus === "error") return "다시 생성";
  return "AI 분석 생성";
}

function getRoleLabel(role) {
  const roleMap = {
    core: "핵심",
    growth: "성장",
    income: "현금흐름",
    stability: "안정",
  };
  return roleMap[role] || role || "분류";
}

function getSeverityLabel(severity) {
  const severityMap = {
    low: "낮음",
    medium: "중간",
    high: "높음",
  };
  return severityMap[severity] || severity || "점검";
}

function StatusItem({ active, icon: Icon, title, text }) {
  return (
    <div className={`aiAnalysisStatusItem ${active ? "active" : ""}`}>
      <span className="aiAnalysisStatusIcon" aria-hidden="true"><Icon size={18} /></span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function AnalysisResult({ analysis }) {
  if (!analysis) return null;

  return (
    <div className="aiAnalysisResultGrid">
      <section className="aiAnalysisResultSection aiAnalysisResultSectionWide">
        <div className="aiAnalysisSectionHeader">
          <BrainCircuit size={18} aria-hidden="true" />
          <strong>{analysis.portfolioProfile?.title || "포트폴리오 구조 점검"}</strong>
        </div>
        <p className="aiAnalysisResultLead">{analysis.portfolioProfile?.summary}</p>
        <div className="aiAnalysisResultMeta">
          <span>Mode {analysis.mode || "mock"}</span>
          <span>Version {analysis.analysisVersion || "-"}</span>
          <span>분산 {analysis.diversification?.effectiveDiversificationLevel || "-"}</span>
        </div>
      </section>

      <section className="aiAnalysisResultSection">
        <div className="aiAnalysisSectionHeader">
          <ShieldCheck size={18} aria-hidden="true" />
          <strong>데이터 품질</strong>
        </div>
        <p className="aiAnalysisResultLead">{analysis.dataQuality?.summary}</p>
        {Array.isArray(analysis.dataQuality?.warnings) && analysis.dataQuality.warnings.length > 0 ? (
          <ul className="aiAnalysisList">
            {analysis.dataQuality.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="aiAnalysisEmptyText">표시할 데이터 경고가 없습니다.</p>
        )}
      </section>

      <section className="aiAnalysisResultSection">
        <div className="aiAnalysisSectionHeader">
          <AlertTriangle size={18} aria-hidden="true" />
          <strong>위험요인</strong>
        </div>
        <div className="aiAnalysisRiskList">
          {(analysis.riskFactors || []).map((risk) => (
            <article key={risk.code || risk.label} className={`aiAnalysisRiskItem ${risk.severity || "low"}`}>
              <div>
                <strong>{risk.label}</strong>
                <span>{getSeverityLabel(risk.severity)}</span>
              </div>
              <ul>
                {(risk.evidence || []).map((evidence) => (
                  <li key={evidence}>{evidence}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="aiAnalysisResultSection">
        <div className="aiAnalysisSectionHeader">
          <BrainCircuit size={18} aria-hidden="true" />
          <strong>자산 역할</strong>
        </div>
        <div className="aiAnalysisAssetRoleList">
          {(analysis.assetRoles || []).map((assetRole) => (
            <div key={`${assetRole.ticker}-${assetRole.role}`} className="aiAnalysisAssetRoleRow">
              <span>{assetRole.ticker}</span>
              <strong>{getRoleLabel(assetRole.role)}</strong>
              <em>{Number(assetRole.weight || 0).toFixed(2)}%</em>
            </div>
          ))}
        </div>
      </section>

      <section className="aiAnalysisResultSection">
        <div className="aiAnalysisSectionHeader">
          <ShieldCheck size={18} aria-hidden="true" />
          <strong>분석 한계</strong>
        </div>
        <ul className="aiAnalysisList">
          {(analysis.limitations || []).map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>

      <section className="aiAnalysisResultSection aiAnalysisResultSectionWide">
        <p className="aiAnalysisDisclaimer">{analysis.disclaimer}</p>
      </section>
    </div>
  );
}

export default function AiAnalysisPanel({
  activePortfolio,
  assets,
  result,
  settings,
  formatNumber,
  formatPercent,
  isEmptyAssetRow,
}) {
  const [analysisStatus, setAnalysisStatus] = useState("empty");
  const [analysis, setAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const lastSuccessSignatureRef = useRef("");

  const activeAssets = useMemo(
    () => getActiveAssets(assets, isEmptyAssetRow),
    [assets, isEmptyAssetRow]
  );
  const topAssets = useMemo(() => getTopAssets(activeAssets), [activeAssets]);
  const inputSignature = useMemo(
    () => createAiAnalysisInputSignature({ activePortfolio, activeAssets, result }),
    [activePortfolio, activeAssets, result]
  );
  const readiness = getReadiness(activeAssets, result);
  const portfolioName = activePortfolio?.name || "현재 포트폴리오";
  const expectedCagr = formatPercent?.(result?.expectedCagr || 0) || "-";
  const expectedBeta = Number.isFinite(Number(result?.expectedBeta))
    ? Number(result.expectedBeta).toFixed(2)
    : "-";
  const simpleMdd = formatPercent?.(result?.simpleMdd || 0) || "-";
  const futureValue = formatNumber?.(result?.futureValue || 0) || "-";
  const isLoading = analysisStatus === "loading";
  const canRequestAnalysis = activeAssets.length > 0 && !isLoading;
  const statusCopy = getStatusCopy(analysisStatus, readiness);

  useEffect(() => {
    if (!analysis || !lastSuccessSignatureRef.current || analysisStatus === "loading") return;
    if (lastSuccessSignatureRef.current !== inputSignature) {
      setAnalysisStatus("stale");
    }
  }, [analysis, analysisStatus, inputSignature]);

  async function handleCreateAnalysis() {
    if (!canRequestAnalysis) return;

    try {
      setAnalysisStatus("loading");
      setErrorMessage("");

      const payload = buildAiAnalysisPayload({
        activePortfolio,
        activeAssets,
        result,
        settings,
      });
      const nextAnalysis = await requestPortfolioAiAnalysis(payload);

      lastSuccessSignatureRef.current = inputSignature;
      setAnalysis(nextAnalysis);
      setAnalysisStatus("success");
    } catch (error) {
      setErrorMessage(error?.message || "AI 분석 요청에 실패했습니다.");
      setAnalysisStatus("error");
    }
  }

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
        <span className={`aiAnalysisReadiness ${readiness.tone}`}>{statusCopy}</span>
      </div>

      <div className="aiAnalysisPrimary">
        <div className="aiAnalysisSubject">
          <div>
            <span>분석 대상</span>
            <strong>{portfolioName}</strong>
            <p>{activeAssets.length}개 자산을 기준으로 STEP 4 분석을 준비합니다.</p>
          </div>
          <button
            type="button"
            className="aiAnalysisActionButton"
            disabled={!canRequestAnalysis}
            onClick={handleCreateAnalysis}
          >
            {isLoading ? <RefreshCcw size={18} aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
            <span>{getActionCopy(analysisStatus)}</span>
          </button>
        </div>

        <div className="aiAnalysisMetricGrid" aria-label="AI 분석 입력 요약">
          <div><span>예상 CAGR</span><strong>{expectedCagr}</strong></div>
          <div><span>예상 Beta</span><strong>{expectedBeta}</strong></div>
          <div><span>MDD</span><strong>{simpleMdd}</strong></div>
          <div><span>예상 평가금액</span><strong>{futureValue}원</strong></div>
        </div>
      </div>

      {analysisStatus === "stale" && (
        <div className="aiAnalysisStateBanner">
          포트폴리오 입력값이 최근 분석 이후 변경되었습니다. 다시 생성하면 최신 값으로 갱신됩니다.
        </div>
      )}

      {analysisStatus === "error" && errorMessage ? (
        <div className="aiAnalysisErrorBox" role="alert">
          <strong>분석 요청을 완료하지 못했습니다.</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <div className="aiAnalysisStatusGrid" aria-label="AI 분석 상태">
        {getStatusItems(analysisStatus).map((item) => (
          <StatusItem
            key={item.key}
            active={item.active}
            icon={item.icon}
            title={item.title}
            text={item.text}
          />
        ))}
      </div>

      {analysis ? (
        <AnalysisResult analysis={analysis} />
      ) : (
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
      )}
    </div>
  );
}
