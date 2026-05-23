import { useMemo, useState } from "react";
import "./InvestmentMbtiPage.css";

const PORTFOLIO_STORAGE_KEY = "finple-portfolio-list";
const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
const LEGACY_STORAGE_KEY = "finple-portfolio-simulator";
const MBTI_PRESET_STORAGE_KEY = "finple-mbti-simulator-preset";

const ASSET_LABELS = {
  growthStock: "성장주",
  valueStock: "가치·배당",
  bond: "채권",
  reit: "리츠",
  gold: "금",
  crypto: "코인",
  cash: "현금",
};

const ASSET_TEMPLATES = {
  growthStock: { ticker: "QQQ", name: "성장주 / 나스닥100 대표 ETF", price: 430000, cagr: 9.5, beta: 1.18, mdd: -35, dividendYield: 0.7 },
  valueStock: { ticker: "SCHD", name: "가치·배당 / 배당성장 대표 ETF", price: 110000, cagr: 7.0, beta: 0.85, mdd: -25, dividendYield: 3.5 },
  bond: { ticker: "TLT", name: "채권 / 미국 장기채 대표 ETF", price: 125000, cagr: 4.0, beta: 0.25, mdd: -20, dividendYield: 3.8 },
  reit: { ticker: "VNQ", name: "리츠 / 부동산 인컴 대표 ETF", price: 120000, cagr: 5.5, beta: 0.75, mdd: -30, dividendYield: 4.0 },
  gold: { ticker: "GLD", name: "금 / 금 ETF", price: 300000, cagr: 5.0, beta: 0.15, mdd: -18, dividendYield: 0 },
  crypto: { ticker: "BTC", name: "코인 / 고변동성 위성자산", price: 1000000, cagr: 12.0, beta: 2.2, mdd: -75, dividendYield: 0 },
  cash: { ticker: "CASH", name: "현금 / 대기자금", price: 10000, cagr: 2.5, beta: 0, mdd: 0, dividendYield: 2.0 },
};

const QUESTIONS = [
  { id: "q1", axis: "returnStyle", title: "투자에서 가장 우선하는 것은 무엇인가요?", options: [
    { id: "a", label: "원금 손실을 최대한 피하는 것", score: -2, risk: -2 },
    { id: "b", label: "손실을 줄이면서 안정적으로 운용하는 것", score: -1, risk: -1 },
    { id: "c", label: "변동이 있어도 수익률을 높이는 것", score: 1, risk: 1 },
    { id: "d", label: "손실 가능성이 있어도 성장 기회를 잡는 것", score: 2, risk: 2 },
  ] },
  { id: "q2", axis: "returnStyle", title: "1년 동안 평가금액이 -10% 하락했다면 가장 가까운 행동은?", options: [
    { id: "a", label: "불안해서 곧바로 줄이거나 정리한다", score: -2, risk: -2 },
    { id: "b", label: "일부 줄이고 상황을 지켜본다", score: -1, risk: -1 },
    { id: "c", label: "그대로 유지하며 회복을 기다린다", score: 1, risk: 1 },
    { id: "d", label: "추가 매수 기회로 본다", score: 2, risk: 2 },
  ] },
  { id: "q3", axis: "returnStyle", title: "다음 중 가장 선호하는 투자 방식은?", options: [
    { id: "a", label: "수익이 낮아도 덜 흔들리는 구조", score: -2, risk: -2 },
    { id: "b", label: "적당한 수익과 적당한 안정성", score: -1, risk: -1 },
    { id: "c", label: "수익률이 높다면 변동성은 감수", score: 1, risk: 1 },
    { id: "d", label: "장기적으로 크게 늘릴 수 있다면 큰 변동도 감수", score: 2, risk: 2 },
  ] },
  { id: "q4", axis: "timeStyle", title: "투자한 자금을 사용할 가능성이 가장 큰 시점은?", options: [
    { id: "a", label: "7년 이상 이후", score: -2, risk: 2 },
    { id: "b", label: "3~7년 이후", score: -1, risk: 1 },
    { id: "c", label: "1~3년 이내", score: 1, risk: -1 },
    { id: "d", label: "시장 기회에 따라 언제든 조정 가능", score: 2, risk: 0 },
  ] },
  { id: "q5", axis: "timeStyle", title: "시장 급등·급락 뉴스를 보면 보통 어떤 편인가요?", options: [
    { id: "a", label: "가급적 반응하지 않고 장기 계획을 유지한다", score: -2, risk: -2 },
    { id: "b", label: "큰 틀은 유지하되 천천히 점검한다", score: -1, risk: -1 },
    { id: "c", label: "필요하면 비중 조정을 생각한다", score: 1, risk: 1 },
    { id: "d", label: "기회가 오면 빠르게 움직이고 싶다", score: 2, risk: 2 },
  ] },
  { id: "q6", axis: "timeStyle", title: "포트폴리오를 점검하는 이상적인 주기는?", options: [
    { id: "a", label: "6개월~1년에 한 번", score: -2, risk: -2 },
    { id: "b", label: "분기별 한 번", score: -1, risk: -1 },
    { id: "c", label: "월 1회 정도", score: 1, risk: 1 },
    { id: "d", label: "시장 상황에 따라 수시로", score: 2, risk: 2 },
  ] },
  { id: "q7", axis: "controlStyle", title: "투자를 할 때 가장 편한 방식은?", options: [
    { id: "a", label: "예시 구조를 그대로 따르는 것", score: -2, risk: 0 },
    { id: "b", label: "큰 틀은 예시를 참고하는 것", score: -1, risk: 0 },
    { id: "c", label: "예시는 보되 내가 직접 조정하는 것", score: 1, risk: 0 },
    { id: "d", label: "처음부터 끝까지 내가 직접 결정하는 것", score: 2, risk: 0 },
  ] },
  { id: "q8", axis: "controlStyle", title: "새 자산을 추가할 때 나는 보통", options: [
    { id: "a", label: "기본 프리셋을 크게 벗어나지 않는다", score: -2, risk: 0 },
    { id: "b", label: "기준안을 조금씩 수정한다", score: -1, risk: 0 },
    { id: "c", label: "비교해보고 내 판단을 반영한다", score: 1, risk: 0 },
    { id: "d", label: "내 아이디어로 적극 구성한다", score: 2, risk: 0 },
  ] },
  { id: "q9", axis: "controlStyle", title: "결과 화면에서 가장 보고 싶은 것은?", options: [
    { id: "a", label: "한눈에 이해되는 요약과 예시안", score: -2, risk: 0 },
    { id: "b", label: "핵심 수치와 간단한 해석", score: -1, risk: 0 },
    { id: "c", label: "상세 지표와 비교 분석", score: 1, risk: 0 },
    { id: "d", label: "직접 수정할 수 있는 세부 입력값", score: 2, risk: 0 },
  ] },
  { id: "q10", axis: "concentrationStyle", title: "자산을 구성할 때 더 편한 방식은?", options: [
    { id: "a", label: "여러 자산에 넓게 나누기", score: -2, risk: -1 },
    { id: "b", label: "핵심 자산 중심으로 적당히 분산", score: -1, risk: 0 },
    { id: "c", label: "좋아 보이는 자산 비중을 높이기", score: 1, risk: 1 },
    { id: "d", label: "확신 있는 자산에 집중하기", score: 2, risk: 2 },
  ] },
  { id: "q11", axis: "concentrationStyle", title: "관심 있는 테마가 생기면 어떻게 하시나요?", options: [
    { id: "a", label: "전체 포트폴리오에는 거의 반영하지 않는다", score: -2, risk: -1 },
    { id: "b", label: "소액으로만 반영한다", score: -1, risk: 0 },
    { id: "c", label: "근거가 있으면 의미 있게 편입한다", score: 1, risk: 1 },
    { id: "d", label: "강한 확신이 있으면 큰 비중도 가능하다", score: 2, risk: 2 },
  ] },
  { id: "q12", axis: "concentrationStyle", title: "포트폴리오 종목 수는 어느 쪽이 좋다고 느끼나요?", options: [
    { id: "a", label: "많아도 괜찮으니 넓게 분산", score: -2, risk: -1 },
    { id: "b", label: "너무 많지 않은 적정 분산", score: -1, risk: 0 },
    { id: "c", label: "핵심 자산 몇 개면 충분", score: 1, risk: 1 },
    { id: "d", label: "가장 확신 있는 소수 자산 중심", score: 2, risk: 2 },
  ] },
];

function riskProfileFromScore(score) {
  if (score <= -9) return "초안정형";
  if (score <= -3) return "안정추구형";
  if (score <= 4) return "위험중립형";
  if (score <= 11) return "적극투자형";
  return "공격투자형";
}

function getPreset({ returnStyle, timeStyle, controlStyle, concentrationStyle }) {
  const growth = returnStyle === "성장" ? 45 : 18;
  const value = returnStyle === "성장" ? 22 : 30;
  const bond = returnStyle === "성장" ? 12 : 30;
  const gold = timeStyle === "기회" ? 10 : 8;
  const crypto = concentrationStyle === "확신" && returnStyle === "성장" ? 10 : 0;
  const reit = 5;
  let cash = 100 - growth - value - bond - gold - crypto - reit;
  if (controlStyle === "자동") cash += 5;
  const nextGrowth = Math.max(5, growth - (controlStyle === "자동" ? 5 : 0));
  return { growthStock: nextGrowth, valueStock: value, bond, reit, gold, crypto, cash: Math.max(0, cash) };
}

function getTypeName(axes) {
  const prefix = axes.returnStyle === "성장" ? "성장" : "안정";
  const suffix = axes.concentrationStyle === "확신" ? "확신형" : "분산형";
  if (axes.controlStyle === "주도") return `${prefix} 설계 ${suffix}`;
  return `${prefix} 자동 ${suffix}`;
}

function getTypeInsight(axes, riskProfile) {
  const isGrowth = axes.returnStyle === "성장";
  const isLongTerm = axes.timeStyle === "장기";
  const isSelfDirected = axes.controlStyle === "주도";
  const isConcentrated = axes.concentrationStyle === "확신";

  const cautionByRisk = {
    초안정형: "원금 방어에는 유리하지만 물가상승률을 감안하면 실질 수익률이 낮아질 수 있습니다. 장기 자금 일부는 성장자산 편입도 함께 검토해 보세요.",
    안정추구형: "손실 회피 성향이 강해 상승장에서 기대수익이 제한될 수 있습니다. 채권·현금 중심을 유지하되 성장자산의 최소 비중을 점검해 보세요.",
    위험중립형: "균형 잡힌 판단이 장점이지만 시장 상황에 따라 방향성이 흐려질 수 있습니다. 목표비중과 리밸런싱 기준을 미리 정해두는 것이 좋습니다.",
    적극투자형: "성장 기회를 적극적으로 반영하는 만큼 MDD와 변동성 관리가 중요합니다. 안전자산과 배당자산으로 하방 위험을 분산해 보세요.",
    공격투자형: "고수익 기회를 선호하지만 급락 구간의 손실 폭이 커질 수 있습니다. 위성자산 비중과 손절·리밸런싱 기준을 반드시 사전에 정해두세요.",
  };

  const strengths = [
    isGrowth ? "성장 기회를 빠르게 포착하고 장기 수익률 개선을 목표로 포트폴리오를 설계할 수 있습니다." : "변동성을 낮추고 투자 지속 가능성을 우선하는 안정적 운용 기준을 세우기 좋습니다.",
    isSelfDirected ? "직접 조정 의지가 강해 시장 변화에 맞춰 비중과 가정값을 능동적으로 점검할 수 있습니다." : "예시 프리셋을 기준으로 과도한 판단 개입을 줄이고 일관된 운용 흐름을 유지하기 좋습니다.",
    isConcentrated ? "확신 있는 자산을 중심으로 성과 동인을 명확하게 만들 수 있습니다." : "분산을 통해 특정 자산의 변동성이 전체 성과에 미치는 영향을 낮출 수 있습니다.",
  ].join(" ");

  const actions = [
    isGrowth ? "성장자산의 목표비중을 정하되 최대낙폭(MDD)을 함께 확인하세요." : "채권·배당·현금 비중을 유지하면서 최소 성장자산 비중을 점검하세요.",
    isLongTerm ? "장기 투자기간에 맞춰 월 투자금 지속 가능성과 물가상승률을 함께 검토하세요." : "시장 기회에 대응하더라도 매수·매도 기준과 점검 주기를 먼저 정하세요.",
    isConcentrated ? "확신 자산 비중이 과도해지면 금·채권·현금 등 완충자산으로 위험을 분산하세요." : "자산 수가 많아질수록 중복 노출이 생기지 않는지 정기적으로 정리하세요.",
  ];

  const sectors = isGrowth
    ? ["미국 대표지수", "테크", "AI", isConcentrated ? "위성자산" : "배당성장"]
    : ["배당", "채권형 ETF", "금", isLongTerm ? "필수소비재" : "단기채·현금성"];

  return {
    strengths,
    cautions: cautionByRisk[riskProfile] || cautionByRisk.위험중립형,
    actions,
    sectors,
  };
}

function calculateResult(answers) {
  const axisScores = { returnStyle: 0, timeStyle: 0, controlStyle: 0, concentrationStyle: 0 };
  let riskScore = 0;
  let answeredCount = 0;

  QUESTIONS.forEach((question) => {
    const selected = question.options.find((option) => option.id === answers[question.id]);
    if (!selected) return;
    answeredCount += 1;
    axisScores[question.axis] += selected.score;
    riskScore += selected.risk;
  });

  const axes = {
    returnStyle: axisScores.returnStyle <= 0 ? "안정" : "성장",
    timeStyle: axisScores.timeStyle <= 0 ? "장기" : "기회",
    controlStyle: axisScores.controlStyle <= 0 ? "자동" : "주도",
    concentrationStyle: axisScores.concentrationStyle <= 0 ? "분산" : "확신",
  };
  const preset = getPreset(axes);
  const calculatedRiskProfile = riskProfileFromScore(riskScore);
  const insight = getTypeInsight(axes, calculatedRiskProfile);
  const nickname = getTypeName(axes);
  const type = {
    typeId: Object.values(axes).join("-"),
    nickname,
    finpleType: `${axes.returnStyle} ${axes.timeStyle} ${axes.controlStyle} ${axes.concentrationStyle}`,
    riskProfile: calculatedRiskProfile,
    summary: `${Object.values(axes).join(" · ")} 성향을 기반으로 한 참고용 투자 성향입니다.`,
    strengths: insight.strengths,
    cautions: insight.cautions,
    preset,
    sectors: insight.sectors,
    actions: insight.actions,
    defaults: { years: axes.timeStyle === "장기" ? 15 : 10, monthlyContribution: axes.returnStyle === "성장" ? 800000 : 500000, inflationRate: 2.5 },
  };

  return { answeredCount, totalCount: QUESTIONS.length, isComplete: answeredCount === QUESTIONS.length, axisScores, axes, type, calculatedRiskProfile, riskScore };
}

function formatWon(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function buildAssetsFromPreset(preset = {}, initialAmount = 50000000) {
  return Object.entries(preset).filter(([, weight]) => Number(weight || 0) > 0).map(([assetKey, weight], index) => {
    const template = ASSET_TEMPLATES[assetKey] || ASSET_TEMPLATES.cash;
    const assetValue = Number(initialAmount || 0) * Number(weight || 0) / 100;
    const quantity = Number((assetValue / Number(template.price || 1)).toFixed(2));
    return {
      id: `mbti-asset-${assetKey}-${Date.now()}-${index}`,
      ticker: template.ticker,
      name: template.name,
      market: assetKey === "crypto" ? "CRYPTO" : "US",
      currency: "KRW",
      quantity,
      price: template.price,
      cagr: template.cagr,
      beta: template.beta,
      mdd: template.mdd,
      dividendYield: template.dividendYield,
      priceMode: "manual",
      metricMode: "manual",
      dataSource: "investment-mbti",
    };
  });
}

function saveResultToSimulator(result) {
  if (!result?.type) return false;
  const now = new Date().toISOString();
  const id = `mbti-${Date.now()}`;
  const type = result.type;
  const settings = { monthlyCashFlow: type.defaults.monthlyContribution, years: type.defaults.years, dividendReinvest: true, inflationRate: type.defaults.inflationRate };
  const assets = buildAssetsFromPreset(type.preset, 50000000);
  const portfolio = { id, name: `${type.nickname} 예시 포트폴리오`, settings, assets, updatedAt: now, source: "investment-mbti", mbti: { typeId: type.typeId, nickname: type.nickname, finpleType: type.finpleType, riskProfile: result.calculatedRiskProfile } };

  try {
    const currentList = JSON.parse(localStorage.getItem(PORTFOLIO_STORAGE_KEY) || "[]");
    const nextList = [portfolio, ...(Array.isArray(currentList) ? currentList.filter((item) => item?.id !== id) : [])];
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(nextList));
    localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, id);
    localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ portfolioList: nextList, activePortfolioId: id, activePortfolio: portfolio, assets, settings, globalSettings: settings, updatedAt: now }));
    localStorage.setItem(MBTI_PRESET_STORAGE_KEY, JSON.stringify({ typeId: type.typeId, nickname: type.nickname, finpleType: type.finpleType, riskProfile: result.calculatedRiskProfile, portfolioPreset: type.preset, preset: type.preset, summary: type.summary, strengths: type.strengths, cautions: type.cautions, actions: type.actions, sectors: type.sectors, simulatorDefaults: type.defaults, createdAt: now }));
    return true;
  } catch (error) {
    console.error("투자 MBTI 프리셋 저장 실패", error);
    return false;
  }
}

function InvestmentMbtiPage({ onBack, onNavigate }) {
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const result = useMemo(() => calculateResult(answers), [answers]);
  const question = QUESTIONS[currentIndex];
  const selectedOptionId = answers[question.id];
  const progress = Math.round((result.answeredCount / result.totalCount) * 100);
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  function handleSelect(optionId) {
    setAnswers((previous) => ({ ...previous, [question.id]: optionId }));
  }

  function goNext() {
    if (!selectedOptionId) return;
    setCurrentIndex((index) => Math.min(index + 1, QUESTIONS.length - 1));
  }

  function goPrev() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function resetTest() {
    setAnswers({});
    setCurrentIndex(0);
  }

  function applyToSimulator() {
    saveResultToSimulator(result);
    onNavigate?.("personal");
  }

  if (result.isComplete && isLastQuestion) {
    return (
      <main className="page investmentMbtiPage">
        <header className="header">
          <button type="button" className="brandLogo resetButton" onClick={onBack}>
            <div className="brandIcon"><span>F</span><i /></div>
            <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
          </button>
        </header>
        <MbtiResult result={result} onReset={resetTest} onApply={applyToSimulator} />
      </main>
    );
  }

  return (
    <main className="page investmentMbtiPage">
      <header className="header">
        <button type="button" className="brandLogo resetButton" onClick={onBack}>
          <div className="brandIcon"><span>F</span><i /></div>
          <div className="brandText"><strong>FINPLE</strong><span>Portfolio Lab</span></div>
        </button>
      </header>

      <section className="investmentMbtiHero">
        <p className="badge">Beta Feature</p>
        <h1>나의 투자 성향을 12문항으로 확인해보세요.</h1>
        <p>안정/성장, 장기/기회, 자동/주도, 분산/확신 4개 축을 기준으로 투자 성향을 도출하는 참고용 진단입니다.</p>
      </section>

      <section className="investmentMbtiSingleCard">
        <div className="investmentMbtiProgress"><span>{currentIndex + 1} / {QUESTIONS.length}</span><strong>{progress}%</strong></div>
        <div className="investmentMbtiProgressTrack"><i style={{ width: `${progress}%` }} /></div>
        <article className="investmentMbtiQuestionCard focused">
          <strong>Q{currentIndex + 1}</strong>
          <h2>{question.title}</h2>
          <div className="investmentMbtiOptionGrid">
            {question.options.map((option) => (
              <button key={option.id} type="button" className={selectedOptionId === option.id ? "selected" : ""} onClick={() => handleSelect(option.id)}>
                <span>{option.id.toUpperCase()}</span>{option.label}
              </button>
            ))}
          </div>
          <div className="investmentMbtiActions">
            <button type="button" className="secondaryButton" onClick={goPrev} disabled={currentIndex === 0}>이전</button>
            <button type="button" className="primaryButton" onClick={goNext} disabled={!selectedOptionId || isLastQuestion}>다음</button>
          </div>
          {isLastQuestion ? <div className="investmentMbtiFinishBox"><strong>마지막 문항입니다.</strong><p>답변을 선택하면 결과가 자동으로 표시됩니다.</p></div> : null}
        </article>
      </section>

      <section className="investmentMbtiNotice" role="note">
        <strong>유의사항</strong>
        <p>본 결과는 사용자의 투자 성향 이해를 돕기 위한 참고자료입니다. 특정 금융상품의 매수·매도 추천, 투자자문, 투자일임 또는 수익 보장을 의미하지 않습니다.</p>
      </section>
    </main>
  );
}

function MbtiResult({ result, onReset, onApply }) {
  const [exportStatusMessage, setExportStatusMessage] = useState("");
  const type = result.type;
  const entries = Object.entries(type.preset);
  const hasCrypto = Number(type.preset.crypto || 0) > 0;

  async function handleShareResult() {
    const shareText = `FINPLE 투자 MBTI: ${type.nickname}\n유형: ${type.finpleType}\n위험성향: ${result.calculatedRiskProfile}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "FINPLE 투자 MBTI 결과", text: shareText, url: window.location.origin + "/mbti" });
        setExportStatusMessage("공유 창을 열었습니다.");
        return;
      }
      await navigator.clipboard?.writeText(shareText);
      setExportStatusMessage("공유 문구를 클립보드에 복사했습니다.");
    } catch (error) {
      setExportStatusMessage("공유 기능을 사용할 수 없어 목업 상태로 표시됩니다.");
    }
  }

  function handleImageMockup() {
    setExportStatusMessage("이미지 저장은 다음 단계에서 캡처 기능으로 연결할 예정입니다.");
  }

  function handlePdfSave() {
    setExportStatusMessage("브라우저 인쇄 창에서 PDF로 저장할 수 있습니다.");
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <section className="investmentMbtiResultPage">
      <div className="investmentMbtiResultHero"><p className="sectionLabel">Investment MBTI Result</p><h1>당신의 투자 MBTI는<br />{type.nickname}입니다.</h1><p>{type.summary}</p></div>
      <div className="investmentMbtiResultGrid">
        <article className="investmentMbtiCard primaryResultCard"><span>FINPLE 유형</span><strong>{type.finpleType}</strong><p>{Object.values(result.axes).join(" · ")}</p></article>
        <article className="investmentMbtiCard"><span>위험성향</span><strong>{result.calculatedRiskProfile}</strong><p>위험성향 점수 {result.riskScore}</p></article>
        <article className="investmentMbtiCard"><span>기본 조건</span><strong>{type.defaults.years}년</strong><p>월 투자금 {formatWon(type.defaults.monthlyContribution)}원</p></article>
      </div>
      <article className="investmentMbtiPanel">
        <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Portfolio Preset</p><h3>예시 포트폴리오 프리셋</h3></div><span>합계 100%</span></div>
        <div className="investmentMbtiPortfolioBars">
          {entries.map(([key, value]) => (
            <div key={key} className="investmentMbtiPortfolioRow"><div className="investmentMbtiPortfolioLabel"><strong>{ASSET_LABELS[key] || key}</strong><span>{value}%</span></div><div className="investmentMbtiBarTrack"><i style={{ width: `${value}%` }} /></div></div>
          ))}
        </div>
      </article>
      <div className="investmentMbtiTwoColumn">
        <article className="investmentMbtiPanel"><p className="sectionLabel">Sectors</p><h3>관심 섹터 예시</h3><div className="investmentMbtiTags">{type.sectors.map((sector) => <span key={sector}>{sector}</span>)}</div></article>
        <article className="investmentMbtiPanel"><p className="sectionLabel">Actions</p><h3>점검 포인트</h3><ul>{type.actions.map((action) => <li key={action}>{action}</li>)}</ul></article>
      </div>
      <div className="investmentMbtiTwoColumn">
        <article className="investmentMbtiPanel"><p className="sectionLabel">Strength</p><h3>강점</h3><p>{type.strengths}</p></article>
        <article className="investmentMbtiPanel warning"><p className="sectionLabel">Caution</p><h3>주의점</h3><p>{type.cautions}</p></article>
      </div>
      <article className="investmentMbtiNotice resultNotice"><strong>투자 유의사항</strong><p>본 결과는 참고용 성향 진단과 예시 포트폴리오입니다. 특정 종목이나 ETF의 매수·매도 추천이 아니며, 실제 투자 결정과 그 결과에 대한 책임은 사용자 본인에게 있습니다.</p>{hasCrypto ? <p>코인 등 고변동성 자산은 가격 변동과 손실 가능성이 매우 크므로 전체 자산 대비 제한적인 비중으로만 검토하는 것이 좋습니다.</p> : null}</article>
      <div className="investmentMbtiShareActions" aria-label="결과 공유 및 저장">
        <button type="button" onClick={handleShareResult}>SNS 공유</button>
        <button type="button" onClick={handleImageMockup}>이미지 저장</button>
        <button type="button" onClick={handlePdfSave}>PDF 저장</button>
      </div>
      {exportStatusMessage ? <p className="investmentMbtiExportStatus">{exportStatusMessage}</p> : null}
      <div className="investmentMbtiResultActions horizontal"><button type="button" onClick={onApply}>이 프리셋으로 시뮬레이터 열기</button><button type="button" className="secondaryMbtiButton" onClick={onReset}>다시 검사하기</button></div>
    </section>
  );
}

export default InvestmentMbtiPage;
