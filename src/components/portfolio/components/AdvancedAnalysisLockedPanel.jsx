const LOCKED_ANALYSIS_COPY = {
  probabilityAnalysis: {
    title: "확률분석",
    description: "월간 수익률을 바탕으로 장기 결과 범위를 확인합니다.",
  },
  externalShockAnalysis: {
    title: "외부충격분석",
    description: "시장 충격 상황에서 포트폴리오의 변화를 점검합니다.",
  },
  aiAnalysis: {
    title: "AI 분석",
    description: "현재 포트폴리오의 구성과 위험 요인을 AI로 해석합니다.",
  },
};

export default function AdvancedAnalysisLockedPanel({ capability }) {
  const copy = LOCKED_ANALYSIS_COPY[capability] || LOCKED_ANALYSIS_COPY.probabilityAnalysis;
  const titleId = `advanced-analysis-lock-${capability}`;

  return (
    <section className="advancedAnalysisLockedPanel" role="region" aria-labelledby={titleId}>
      <span className="advancedAnalysisPlanBadge">Personal 플랜 기능</span>
      <h3 id={titleId}>{copy.title}</h3>
      <p>{copy.description}</p>
      <a className="primaryButton" href="/pricing">요금제 보기</a>
    </section>
  );
}
