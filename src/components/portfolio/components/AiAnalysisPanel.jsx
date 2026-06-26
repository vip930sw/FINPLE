import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BrainCircuit, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";

import {
  requestPortfolioAiAnalysisResult,
  requestPortfolioAiAnalysisStatus,
} from "../services/aiAnalysisService";
import { loadAiAnalysisCache, saveAiAnalysisCache } from "../services/aiAnalysisStorageService";
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

function getStatusCopy(analysisStatus, readiness) {
  if (analysisStatus === "loading") return "분석 생성 중";
  if (analysisStatus === "success") return "분석 완료";
  if (analysisStatus === "stale") return "입력 변경됨";
  if (analysisStatus === "error") return "재시도 필요";
  return readiness.label;
}

function getActionCopy(analysisStatus) {
  if (analysisStatus === "loading") return "분석 중";
  if (analysisStatus === "success" || analysisStatus === "stale" || analysisStatus === "error") return "새로 분석";
  return "분석 시작";
}

function getAccessRequiredPlanCopy(accessSummary) {
  const requiredPlans = Array.isArray(accessSummary?.requiredPlans)
    ? accessSummary.requiredPlans
    : ["personal", "pro"];

  return requiredPlans
    .map((plan) => String(plan || "").trim())
    .filter(Boolean)
    .map((plan) => plan.charAt(0).toUpperCase() + plan.slice(1))
    .join(" 또는 ") || "Personal";
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

function AiAnalysisAccessPanel({ accessSummary, onOpenPricing }) {
  const planCopy = getAccessRequiredPlanCopy(accessSummary);

  return (
    <section className="aiAnalysisAccessPanel" role="alert" aria-live="polite">
      <div className="aiAnalysisAccessIcon" aria-hidden="true">
        <AlertTriangle size={24} />
      </div>
      <div className="aiAnalysisAccessBody">
        <span>플랜 확인 필요</span>
        <strong>STEP 4 AI 분석은 {planCopy} 플랜에서 사용할 수 있습니다.</strong>
        <p>
          현재 Free 플랜에서는 분석 생성이 차단됩니다. 요금제 화면에서 Personal 권한을 확인한 뒤
          다시 시도해 주세요.
        </p>
        <button type="button" className="aiAnalysisAccessCta" onClick={onOpenPricing}>
          요금제 확인
        </button>
      </div>
    </section>
  );
}

function AiAnalysisLoadingState() {
  return (
    <section className="aiAnalysisLoadingState" aria-live="polite" aria-busy="true">
      <div className="aiAnalysisLoadingSpinner" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} className="aiAnalysisLoadingBar" />
        ))}
      </div>
      <div>
        <strong>AI가 포트폴리오를 분석하고 있습니다.</strong>
        <p>자산 구성, 데이터 한계, 주요 위험요인을 정리하는 중입니다. 보통 10~40초 정도 걸릴 수 있습니다.</p>
      </div>
    </section>
  );
}

function StaleAnalysisState({ activeAssets, formatNumber }) {
  const previewAssets = getTopAssets(activeAssets).slice(0, 6);

  return (
    <section className="aiAnalysisStaleState" aria-live="polite">
      <div className="aiAnalysisSectionHeader">
        <RefreshCcw size={18} aria-hidden="true" />
        <strong>새 분석이 필요합니다.</strong>
      </div>
      <p>
        포트폴리오 입력값이 최근 AI 분석 이후 변경되었습니다. 아래 최신 자산 구성을 기준으로
        다시 생성하면 한국 자산을 포함한 결과로 갱신됩니다.
      </p>
      <div className="aiAnalysisStaleAssetList">
        {previewAssets.map((asset) => (
          <div key={asset.id || `${asset.market}-${asset.ticker}`} className="aiAnalysisStaleAssetRow">
            <span>{asset.ticker || "-"}</span>
            <strong>{asset.name || asset.ticker || "-"}</strong>
            <em>{asset.market || "US"}</em>
            <small>{formatNumber?.(asset.displayValue || 0) || "0"}원</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function AnalysisResult({ analysis }) {
  if (!analysis) return null;

  const dataWarnings = Array.isArray(analysis.dataQuality?.warnings)
    ? analysis.dataQuality.warnings
    : [];
  const compactDataWarnings = dataWarnings.slice(0, 2);
  const diagnosticSections = Array.isArray(analysis.diagnosticSections)
    ? analysis.diagnosticSections
    : [];

  return (
    <div className="aiAnalysisResultGrid">
      <section className="aiAnalysisResultSection aiAnalysisResultSectionWide">
        <div className="aiAnalysisSectionHeader">
          <BrainCircuit size={18} aria-hidden="true" />
          <strong>{analysis.portfolioProfile?.title || "포트폴리오 구조 점검"}</strong>
        </div>
        <p className="aiAnalysisResultLead">{analysis.portfolioProfile?.summary}</p>
        <div className="aiAnalysisContextStrip">
          <div>
            <span>입력 데이터</span>
            <p>{analysis.dataQuality?.summary || "현재 입력값을 기준으로 분석했습니다."}</p>
          </div>
          <div>
            <span>확인 사항</span>
            {compactDataWarnings.length > 0 ? (
              <ul>
                {compactDataWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p>표시할 데이터 경고가 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      {diagnosticSections.length > 0 && (
        <section className="aiAnalysisResultSection aiAnalysisResultSectionWide">
          <div className="aiAnalysisSectionHeader">
            <BrainCircuit size={18} aria-hidden="true" />
            <strong>진단 요약</strong>
          </div>
          <div className="aiAnalysisDiagnosticList">
            {diagnosticSections.map((section) => (
              <article key={section.key || section.title} className="aiAnalysisDiagnosticItem">
                <strong>{section.title}</strong>
                <p>{section.summary}</p>
                <ul>
                  {(section.observations || []).map((observation) => (
                    <li key={observation}>{observation}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="aiAnalysisResultSection aiAnalysisResultSectionWide">
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
  const [usageSummary, setUsageSummary] = useState(null);
  const [accessSummary, setAccessSummary] = useState(null);
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
  const analysisCachePortfolioId = activePortfolio?.id || "default";
  const readiness = getReadiness(activeAssets, result);
  const portfolioName = activePortfolio?.name || "현재 포트폴리오";
  const expectedCagr = formatPercent?.(result?.expectedCagr || 0) || "-";
  const expectedBeta = Number.isFinite(Number(result?.expectedBeta))
    ? Number(result.expectedBeta).toFixed(2)
    : "-";
  const simpleMdd = formatPercent?.(result?.simpleMdd || 0) || "-";
  const futureValue = formatNumber?.(result?.futureValue || 0) || "-";
  const isLoading = analysisStatus === "loading";
  const isStale = analysisStatus === "stale";
  const isAccessBlocked = accessSummary?.allowed === false;
  const canRequestAnalysis = activeAssets.length > 0 && !isLoading && !isAccessBlocked;
  const statusCopy = getStatusCopy(analysisStatus, readiness);

  useEffect(() => {
    if (analysisStatus === "loading") return;

    const cachedRecord = loadAiAnalysisCache(analysisCachePortfolioId);
    if (!cachedRecord?.analysis) {
      lastSuccessSignatureRef.current = "";
      setAnalysis(null);
      setAnalysisStatus("empty");
      setErrorMessage("");
      setUsageSummary(null);
      return;
    }

    lastSuccessSignatureRef.current = cachedRecord.inputSignature || "";
    setAnalysis(cachedRecord.analysis);
    setErrorMessage("");
    setAnalysisStatus(cachedRecord.inputSignature === inputSignature ? "success" : "stale");
  }, [analysisCachePortfolioId, inputSignature]);

  useEffect(() => {
    if (!analysis || !lastSuccessSignatureRef.current || analysisStatus === "loading") return;
    if (lastSuccessSignatureRef.current !== inputSignature) {
      setAnalysisStatus("stale");
    }
  }, [analysis, analysisStatus, inputSignature]);

  useEffect(() => {
    let canceled = false;

    async function loadUsageStatus() {
      try {
        const status = await requestPortfolioAiAnalysisStatus();
        if (!canceled && status?.usage) setUsageSummary(status.usage);
        if (!canceled && status?.access) setAccessSummary(status.access);
      } catch {
        // Usage status is informational; analysis requests still handle their own errors.
      }
    }

    loadUsageStatus();
    return () => {
      canceled = true;
    };
  }, []);

  async function handleCreateAnalysis() {
    if (!canRequestAnalysis) return;

    try {
      setAnalysisStatus("loading");
      setErrorMessage("");
      setUsageSummary(null);

      const payload = buildAiAnalysisPayload({
        activePortfolio,
        activeAssets,
        result,
        settings,
      });
      const { analysis: nextAnalysis, usage } = await requestPortfolioAiAnalysisResult(payload);

      lastSuccessSignatureRef.current = inputSignature;
      setAnalysis(nextAnalysis);
      saveAiAnalysisCache({
        portfolioId: analysisCachePortfolioId,
        inputSignature,
        analysis: nextAnalysis,
      });
      setUsageSummary(usage);
      setAccessSummary((current) => current ? { ...current, allowed: true, reason: null } : current);
      setAnalysisStatus("success");
    } catch (error) {
      if (error?.access) setAccessSummary(error.access);
      if (error?.usage) setUsageSummary(error.usage);
      setErrorMessage(error?.message || "AI 분석 요청에 실패했습니다.");
      setAnalysisStatus("error");
    }
  }

  function handleOpenPricing() {
    if (typeof window === "undefined") return;
    window.location.href = "/pricing";
  }

  return (
    <div className="simulatorTabPanel aiAnalysisPanel">
      <div className="tabSectionHeader aiAnalysisHeader">
        <p className="sectionLabel">AI Analysis</p>
        <div>
          <h3>STEP 4 AI 분석</h3>
          <p>
            입력하신 자산 구성과 계산 결과를 바탕으로 포트폴리오 구조, 데이터 한계,
            주요 위험요인을 정리합니다.
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
            className={`aiAnalysisActionButton ${isAccessBlocked ? "upgrade" : ""}`}
            disabled={isLoading || activeAssets.length === 0}
            onClick={isAccessBlocked ? handleOpenPricing : handleCreateAnalysis}
          >
            {isLoading ? (
              <RefreshCcw className="aiAnalysisButtonSpinner" size={18} aria-hidden="true" />
            ) : (
              <Sparkles size={18} aria-hidden="true" />
            )}
            <span>{isAccessBlocked ? "요금제 확인" : getActionCopy(analysisStatus)}</span>
          </button>
        </div>

        <div className="aiAnalysisMetricGrid" aria-label="AI 분석 입력 요약">
          <div><span>예상 CAGR</span><strong>{expectedCagr}</strong></div>
          <div><span>예상 Beta</span><strong>{expectedBeta}</strong></div>
          <div><span>MDD</span><strong>{simpleMdd}</strong></div>
          <div><span>예상 평가금액</span><strong>{futureValue}원</strong></div>
        </div>
        {usageSummary && Number.isFinite(Number(usageSummary.remaining)) && (
          <p className="aiAnalysisUsageHint">
            오늘 남은 AI 분석 {usageSummary.remaining}회
          </p>
        )}
      </div>

      {isAccessBlocked && (
        <AiAnalysisAccessPanel
          accessSummary={accessSummary}
          onOpenPricing={handleOpenPricing}
        />
      )}
      {isStale && (
        <div className="aiAnalysisStateBanner">
          입력값이 최근 분석 이후 변경되었습니다. 이전 AI 분석 결과는 현재 자산 구성과 일치하지 않아 숨겼습니다.
          새로 분석하면 최신 입력값으로 갱신됩니다.
        </div>
      )}

      {isLoading && <AiAnalysisLoadingState />}

      {analysisStatus === "error" && errorMessage ? (
        <div className="aiAnalysisErrorBox" role="alert">
          <strong>분석 요청을 완료하지 못했습니다.</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {isAccessBlocked ? null : isStale ? (
        <StaleAnalysisState activeAssets={activeAssets} formatNumber={formatNumber} />
      ) : analysis ? (
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
