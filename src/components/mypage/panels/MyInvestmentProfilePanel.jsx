import { useMemo, useRef, useState } from "react";
import PanelShell from "./PanelShell";

const AXIS_CONFIGS = [
  { key: "returnStyle", label: "수익 성향", left: "안정", right: "성장" },
  { key: "timeStyle", label: "투자 기간", left: "장기", right: "기회" },
  { key: "controlStyle", label: "운용 방식", left: "추종", right: "주도" },
  { key: "concentrationStyle", label: "분산 성향", left: "분산", right: "확신" },
];

const ASSET_LABELS = {
  growthStock: "성장주",
  valueStock: "가치·배당",
  bond: "종합채권",
  longBond: "장기국채",
  longbond: "장기국채",
  reit: "리츠",
  gold: "금",
  cash: "현금",
  crypto: "가상자산/테마",
};

function normalizeMbtiTerm(value) {
  return String(value || "").replace(/자동/g, "추종").trim();
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, number));
}

function getTypeIdAxes(typeId) {
  const parts = String(typeId || "").split("-");
  return {
    returnStyle: parts[0] || "",
    timeStyle: parts[1] || "",
    controlStyle: parts[2] || "",
    concentrationStyle: parts[3] || "",
  };
}

function getAxisPercent(profile, config, value) {
  const fromScore = clampPercent(profile?.axisScores?.[config.key]);
  if (fromScore !== null) return fromScore;
  return value === config.right ? 78 : 22;
}

function getAxisEntries(profile) {
  if (!profile) return [];
  const typeAxes = getTypeIdAxes(profile.typeId);
  const axes = profile.axes || {};

  return AXIS_CONFIGS.map((config) => {
    const value = normalizeMbtiTerm(axes[config.key] || typeAxes[config.key] || config.left);
    return {
      ...config,
      value,
      percent: getAxisPercent(profile, config, value),
    };
  });
}

function getPresetEntries(profile) {
  const preset = profile?.presetWeights || profile?.portfolioPreset || profile?.preset || {};
  return Object.entries(preset)
    .map(([key, rawValue]) => [key, Number(rawValue)])
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .sort(([, a], [, b]) => b - a);
}

function getTextList(value, fallback) {
  if (Array.isArray(value)) return value.map(normalizeMbtiTerm).filter(Boolean);
  const text = normalizeMbtiTerm(value);
  return text ? [text] : fallback;
}

export default function MyInvestmentProfilePanel({ mbti, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const detailRef = useRef(null);
  const profile = mbti.profile;
  const axisEntries = useMemo(() => getAxisEntries(profile), [profile]);
  const presetEntries = useMemo(() => getPresetEntries(profile), [profile]);
  const summaryList = getTextList(profile?.summary, ["최근 투자 MBTI 결과와 포트폴리오 프리셋을 기준으로 표시합니다."]);
  const actionList = getTextList(profile?.actions || profile?.recommendations, ["분산 비중을 먼저 확인하고 리밸런싱 주기를 정해 보세요."]);
  const cautionList = getTextList(profile?.cautions, ["예시 비중은 투자 판단을 돕기 위한 참고 정보이며, 실제 투자 결과를 보장하지 않습니다."]);

  function toggleDetail() {
    setExpanded((current) => {
      const next = !current;
      if (!current) {
        window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 0);
      }
      return next;
    });
  }

  function restartMbti() {
    if (typeof window !== "undefined") {
      window.location.hash = "#investment-mbti";
    }
    onNavigate?.("investment");
  }

  return (
    <PanelShell
      eyebrow="MY INVESTMENT PROFILE"
      title="내 투자성향"
      description="최근 투자 MBTI 결과와 예시 포트폴리오 프리셋을 다시 확인합니다."
      badge={profile ? "저장됨" : "미완료"}
    >
      {profile ? (
        <>
          <div className="accountStatusGrid myPageSummaryGrid myPageSummaryGrid--three">
            <div><span>투자 MBTI</span><strong>{normalizeMbtiTerm(profile.nickname || profile.typeId)}</strong></div>
            <div><span>투자성향</span><strong>{normalizeMbtiTerm(profile.finpleType || profile.personality || "균형형")}</strong></div>
            <div><span>위험성향</span><strong>{normalizeMbtiTerm(profile.riskProfile || profile.riskLabel || "중립형")}</strong></div>
          </div>

          <p className="serverStorageMessage compact">
            투자 MBTI 검사 결과가 저장되어 있습니다. 결과 자세히 보기에서 포트폴리오 비율과 권장 액션을 확인할 수 있습니다.
          </p>

          <div className="serverStorageActions compactActions myPageInlineActions" data-mypage-mbti-actions>
            <button type="button" className="primaryButton" onClick={toggleDetail}>
              {expanded ? "결과 접기" : "결과 자세히 보기"}
            </button>
            <button type="button" className="secondaryButton" onClick={restartMbti}>투자 MBTI 다시 하기</button>
          </div>

          {expanded ? (
            <section ref={detailRef} className="myPageExpandableDetail myPageMbtiDetail" data-mypage-mbti-detail>
              <div className="myPageDetailHeader">
                <div>
                  <span>MY INVESTMENT MBTI</span>
                  <h3>{normalizeMbtiTerm(profile.nickname || profile.typeId)}</h3>
                </div>
                <span>{normalizeMbtiTerm(profile.typeId)}</span>
              </div>

              <div className="myPageDetailBox myPageDetailOverview" data-mypage-mbti-overview>
                <strong>결과 요약</strong>
                <ul>
                  {summaryList.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>

              <div className="myPageDetailBox" data-mypage-mbti-axis-chart>
                <strong>성향 축</strong>
                <div className="myPageAxisChart">
                  {axisEntries.map((axis) => (
                    <div className="myPageAxisRow" key={axis.key}>
                      <div className="myPageAxisHeader">
                        <span>{axis.label}</span>
                        <strong>{axis.value}</strong>
                      </div>
                      <div className="myPageAxisScale">
                        <span>{axis.left}</span>
                        <div className="myPageAxisTrack"><i style={{ left: `${axis.percent}%` }} /></div>
                        <span>{axis.right}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="myPageDetailBox" data-mypage-mbti-allocation-chart>
                <strong>예시 포트폴리오 비중</strong>
                <div className="myPagePortfolioBars">
                  {presetEntries.length > 0 ? presetEntries.map(([key, value]) => (
                    <div className="myPagePortfolioRow" key={key}>
                      <div><span>{ASSET_LABELS[key] || key}</span><strong>{value}%</strong></div>
                      <i style={{ width: `${Math.min(100, value)}%` }} />
                    </div>
                  )) : <p>저장된 프리셋 비중이 없어 기본 성향 정보만 표시합니다.</p>}
                </div>
              </div>

              <div className="myPageDetailBox" data-mypage-mbti-guidance>
                <strong>권장 액션</strong>
                <ul>
                  {actionList.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <strong className="myPageDetailSubTitle">주의할 점</strong>
                <ul>
                  {cautionList.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <>
          <div className="accountStatusGrid myPageSummaryGrid myPageSummaryGrid--three">
            <div><span>투자 MBTI</span><strong>미완료</strong></div>
            <div><span>투자성향</span><strong>결과 없음</strong></div>
            <div><span>위험성향</span><strong>결과 없음</strong></div>
          </div>
          <p className="serverStorageMessage compact">아직 저장된 투자 MBTI 결과가 없습니다. 투자 MBTI 검사를 진행하고 결과를 저장해 보세요.</p>
          <div className="serverStorageActions compactActions myPageInlineActions">
            <button type="button" className="primaryButton" onClick={restartMbti}>투자 MBTI 시작하기</button>
          </div>
        </>
      )}
    </PanelShell>
  );
}
