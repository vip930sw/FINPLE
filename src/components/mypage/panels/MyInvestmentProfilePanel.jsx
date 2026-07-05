import PanelShell from "./PanelShell";

export default function MyInvestmentProfilePanel({ mbti, onNavigate }) {
  const profile = mbti.profile;

  return (
    <PanelShell
      eyebrow="MY INVESTMENT PROFILE"
      title="내 투자성향"
      description="최근 투자 MBTI 결과와 예시 포트폴리오 프리셋을 다시 확인합니다."
      badge={profile ? "저장됨" : "미저장"}
      actions={(
        <>
          <button type="button" className="primaryButton" onClick={() => onNavigate?.("personal")}>결과 자세히 보기</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate?.("personal")}>투자 MBTI 다시 하기</button>
        </>
      )}
    >
      <div className="accountStatusGrid">
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
