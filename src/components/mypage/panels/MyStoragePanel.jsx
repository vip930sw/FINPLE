import PanelShell from "./PanelShell";

export default function MyStoragePanel({ snapshot, effectivePlan }) {
  const portfolioCount = Number(snapshot?.portfolioCount || 0);
  const serverStorageEnabled = effectivePlan === "personal" || effectivePlan === "pro";

  return (
    <PanelShell
      eyebrow="MY STORAGE HISTORY"
      title="내 저장내역"
      description="브라우저 저장 포트폴리오와 서버 저장 가능 상태를 확인합니다."
      badge={serverStorageEnabled ? "지원" : "제한"}
    >
      <div className="serverStorageStats myPageSummaryGrid myPageSummaryGrid--three">
        <div><span>브라우저 포트폴리오</span><strong>{portfolioCount}건</strong></div>
        <div><span>활성 포트폴리오</span><strong>{snapshot?.activePortfolioName || "없음"}</strong></div>
        <div><span>서버 저장</span><strong>{serverStorageEnabled ? "지원" : "제한"}</strong></div>
      </div>
      <p className="serverStorageMessage compact">
        {serverStorageEnabled ? "Personal 이상 플랜은 서버 저장과 불러오기를 사용할 수 있습니다." : "Free 플랜에서는 브라우저 저장을 우선 사용합니다."}
      </p>
    </PanelShell>
  );
}
