import PanelShell from "./PanelShell";

export default function MyInvestmentProfilePanel({ mbti, onNavigate }) {
  const profile = mbti.profile;
  function openMbtiResult() {
    if (typeof window !== "undefined") {
      window.history.pushState({ page: "personal", path: "/mbti", view: "investment-mbti-result" }, "", "/mbti?view=result");
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("finple-open-personal-view", { detail: { view: "investment-mbti", resultView: true } }));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
    onNavigate?.("personal", { scrollTop: false });
  }

  function restartMbti() {
    if (typeof window !== "undefined") {
      window.history.pushState({ page: "personal", path: "/mbti", view: "investment-mbti" }, "", "/mbti");
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("finple-open-personal-view", { detail: { view: "investment-mbti" } }));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
    onNavigate?.("personal", { scrollTop: false });
  }

  return (
    <PanelShell
      eyebrow="MY INVESTMENT PROFILE"
      title="내 투자성향"
      description="최근 투자 MBTI 결과와 예시 포트폴리오 프리셋을 다시 확인합니다."
      badge={profile ? "저장됨" : "미저장"}
      actions={(
        <>
          <button type="button" className="primaryButton" onClick={openMbtiResult}>결과 자세히 보기</button>
          <button type="button" className="secondaryButton" onClick={restartMbti}>투자 MBTI 다시 하기</button>
        </>
      )}
    >
      <div className="accountStatusGrid myPageSummaryGrid myPageSummaryGrid--three">
        <div><span>투자 MBTI</span><strong>{profile?.nickname || "저장된 결과 없음"}</strong></div>
        <div><span>투자성향</span><strong>{profile?.finpleType || "확인 필요"}</strong></div>
        <div><span>위험성향</span><strong>{profile?.riskProfile || "확인 필요"}</strong></div>
      </div>
      <p className="serverStorageMessage compact">
        {mbti.error || (profile ? "서버 DB 값을 우선 복원하고 localStorage는 캐시로만 사용합니다." : "투자 MBTI 결과를 저장하면 이 영역에 표시됩니다.")}
      </p>
    </PanelShell>
  );
}
