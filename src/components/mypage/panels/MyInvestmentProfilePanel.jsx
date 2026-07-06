import { useMemo, useState } from "react";
import PanelShell from "./PanelShell";

const AXIS_LABELS = {
  returnStyle: "수익 성향",
  timeStyle: "투자 기간",
  controlStyle: "운용 방식",
  concentrationStyle: "분산 성향",
};

const ASSET_LABELS = {
  growthStock: "성장주",
  valueStock: "가치/배당주",
  bond: "채권",
  longBond: "장기채",
  reit: "리츠",
  gold: "금",
  crypto: "가상자산",
  cash: "현금",
};

function getPresetEntries(profile) {
  const preset = profile?.portfolioPreset || profile?.preset || {};
  return Object.entries(preset)
    .map(([key, value]) => [key, Number(value || 0)])
    .filter(([, value]) => value > 0);
}

function getAxisEntries(profile) {
  const axes = profile?.axes && typeof profile.axes === "object" ? profile.axes : {};
  return Object.entries(axes).filter(([, value]) => Boolean(value));
}

export default function MyInvestmentProfilePanel({ mbti, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const profile = mbti.profile;
  const presetEntries = useMemo(() => getPresetEntries(profile), [profile]);
  const axisEntries = useMemo(() => getAxisEntries(profile), [profile]);
  const actions = Array.isArray(profile?.actions) ? profile.actions.filter(Boolean).slice(0, 3) : [];

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
          <button type="button" className="primaryButton" onClick={() => setExpanded((value) => !value)} disabled={!profile}>
            {expanded ? "결과 접기" : "결과 자세히 보기"}
          </button>
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
        {mbti.error || (profile ? "최근 투자 MBTI 결과가 저장되어 있습니다." : "투자 MBTI 결과를 저장하면 이 영역에 표시됩니다.")}
      </p>
      {expanded && profile ? (
        <section className="myPageExpandableDetail" data-mypage-mbti-detail>
          <div className="myPageDetailHeader">
            <div>
              <p className="accountMiniLabel">Investment MBTI Detail</p>
              <h3>{profile.nickname || "투자 MBTI"}</h3>
            </div>
            <span>{profile.riskProfile || "위험성향 확인 필요"}</span>
          </div>
          <div className="myPageSummaryGrid myPageSummaryGrid--three myPageDetailGrid">
            <div><span>FINPLE 유형</span><strong>{profile.finpleType || "확인 필요"}</strong></div>
            <div><span>위험성향</span><strong>{profile.riskProfile || "확인 필요"}</strong></div>
            <div><span>시장 기준</span><strong>{profile.marketMode || "US"}</strong></div>
          </div>
          {axisEntries.length ? (
            <div className="myPageDetailBlock">
              <strong>4개 축 결과</strong>
              <div className="myPageTagList">
                {axisEntries.map(([key, value]) => <span key={key}>{AXIS_LABELS[key] || key}: {value}</span>)}
              </div>
            </div>
          ) : null}
          {presetEntries.length ? (
            <div className="myPageDetailBlock">
              <strong>포트폴리오 예시 비중</strong>
              <div className="myPagePortfolioBars">
                {presetEntries.map(([key, value]) => (
                  <div className="myPagePortfolioRow" key={key}>
                    <div><span>{ASSET_LABELS[key] || key}</span><em>{value}%</em></div>
                    <i style={{ width: `${Math.min(100, value)}%` }} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="myPageDetailBlock">
            <strong>권장 액션 및 주의사항</strong>
            <p>{profile.summary || "저장된 투자성향 결과를 확인할 수 있습니다."}</p>
            {actions.length ? (
              <ul>
                {actions.map((action) => <li key={action}>{action}</li>)}
              </ul>
            ) : null}
            {profile.cautions ? <p>{profile.cautions}</p> : null}
          </div>
        </section>
      ) : null}
    </PanelShell>
  );
}
