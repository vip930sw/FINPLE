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
    { id: "a", label: "원금 손실을 최대한 피하는 것", mbtiScore: -2, riskScore: -2 },
    { id: "b", label: "손실을 줄이면서 안정적으로 운용하는 것", mbtiScore: -1, riskScore: -1 },
    { id: "c", label: "변동이 있어도 수익률을 높이는 것", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "손실 가능성이 있어도 성장 기회를 잡는 것", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q2", axis: "returnStyle", title: "1년 동안 평가금액이 -10% 하락했다면 가장 가까운 행동은?", options: [
    { id: "a", label: "불안해서 곧바로 줄이거나 정리한다", mbtiScore: -2, riskScore: -2 },
    { id: "b", label: "일부 줄이고 상황을 지켜본다", mbtiScore: -1, riskScore: -1 },
    { id: "c", label: "그대로 유지하며 회복을 기다린다", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "추가 매수 기회로 본다", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q3", axis: "returnStyle", title: "다음 중 가장 선호하는 투자 방식은?", options: [
    { id: "a", label: "수익이 낮아도 덜 흔들리는 구조", mbtiScore: -2, riskScore: -2 },
    { id: "b", label: "적당한 수익과 적당한 안정성", mbtiScore: -1, riskScore: -1 },
    { id: "c", label: "수익률이 높다면 변동성은 감수", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "장기적으로 크게 늘릴 수 있다면 큰 변동도 감수", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q4", axis: "timeStyle", title: "투자한 자금을 사용할 가능성이 가장 큰 시점은?", options: [
    { id: "a", label: "7년 이상 이후", mbtiScore: -2, riskScore: 2 },
    { id: "b", label: "3~7년 이후", mbtiScore: -1, riskScore: 1 },
    { id: "c", label: "1~3년 이내", mbtiScore: 1, riskScore: -1 },
    { id: "d", label: "시장 기회에 따라 언제든 조정 가능", mbtiScore: 2, riskScore: 0 },
  ] },
  { id: "q5", axis: "timeStyle", title: "시장 급등·급락 뉴스를 보면 보통 어떤 편인가요?", options: [
    { id: "a", label: "가급적 반응하지 않고 장기 계획을 유지한다", mbtiScore: -2, riskScore: -2 },
    { id: "b", label: "큰 틀은 유지하되 천천히 점검한다", mbtiScore: -1, riskScore: -1 },
    { id: "c", label: "필요하면 비중 조정을 생각한다", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "기회가 오면 빠르게 움직이고 싶다", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q6", axis: "timeStyle", title: "포트폴리오를 점검하는 이상적인 주기는?", options: [
    { id: "a", label: "6개월~1년에 한 번", mbtiScore: -2, riskScore: -2 },
    { id: "b", label: "분기별 한 번", mbtiScore: -1, riskScore: -1 },
    { id: "c", label: "월 1회 정도", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "시장 상황에 따라 수시로", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q7", axis: "controlStyle", title: "투자를 할 때 가장 편한 방식은?", options: [
    { id: "a", label: "예시 구조를 그대로 따르는 것", mbtiScore: -2, riskScore: 0 },
    { id: "b", label: "큰 틀은 예시를 참고하는 것", mbtiScore: -1, riskScore: 0 },
    { id: "c", label: "예시는 보되 내가 직접 조정하는 것", mbtiScore: 1, riskScore: 0 },
    { id: "d", label: "처음부터 끝까지 내가 직접 결정하는 것", mbtiScore: 2, riskScore: 0 },
  ] },
  { id: "q8", axis: "controlStyle", title: "새 자산을 추가할 때 나는 보통", options: [
    { id: "a", label: "기본 프리셋을 크게 벗어나지 않는다", mbtiScore: -2, riskScore: 0 },
    { id: "b", label: "기준안을 조금씩 수정한다", mbtiScore: -1, riskScore: 0 },
    { id: "c", label: "비교해보고 내 판단을 반영한다", mbtiScore: 1, riskScore: 0 },
    { id: "d", label: "내 아이디어로 적극 구성한다", mbtiScore: 2, riskScore: 0 },
  ] },
  { id: "q9", axis: "controlStyle", title: "결과 화면에서 가장 보고 싶은 것은?", options: [
    { id: "a", label: "한눈에 이해되는 요약과 예시안", mbtiScore: -2, riskScore: 0 },
    { id: "b", label: "핵심 수치와 간단한 해석", mbtiScore: -1, riskScore: 0 },
    { id: "c", label: "상세 지표와 비교 분석", mbtiScore: 1, riskScore: 0 },
    { id: "d", label: "직접 수정할 수 있는 세부 입력값", mbtiScore: 2, riskScore: 0 },
  ] },
  { id: "q10", axis: "concentrationStyle", title: "자산을 구성할 때 더 편한 방식은?", options: [
    { id: "a", label: "여러 자산에 넓게 나누기", mbtiScore: -2, riskScore: -1 },
    { id: "b", label: "핵심 자산 중심으로 적당히 분산", mbtiScore: -1, riskScore: 0 },
    { id: "c", label: "좋아 보이는 자산 비중을 높이기", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "확신 있는 자산에 집중하기", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q11", axis: "concentrationStyle", title: "관심 있는 테마가 생기면 어떻게 하시나요?", options: [
    { id: "a", label: "전체 포트폴리오에는 거의 반영하지 않는다", mbtiScore: -2, riskScore: -1 },
    { id: "b", label: "소액으로만 반영한다", mbtiScore: -1, riskScore: 0 },
    { id: "c", label: "근거가 있으면 의미 있게 편입한다", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "강한 확신이 있으면 큰 비중도 가능하다", mbtiScore: 2, riskScore: 2 },
  ] },
  { id: "q12", axis: "concentrationStyle", title: "포트폴리오 종목 수는 어느 쪽이 좋다고 느끼나요?", options: [
    { id: "a", label: "많아도 괜찮으니 넓게 분산", mbtiScore: -2, riskScore: -1 },
    { id: "b", label: "너무 많지 않은 적정 분산", mbtiScore: -1, riskScore: 0 },
    { id: "c", label: "핵심 자산 몇 개면 충분", mbtiScore: 1, riskScore: 1 },
    { id: "d", label: "가장 확신 있는 소수 자산 중심", mbtiScore: 2, riskScore: 2 },
  ] },
];

const TYPE_PROFILES = {
  "안정-장기-자동-분산": { typeId: "calm-guardian", nickname: "차분한 수호자형", finpleType: "복리 수호형", riskProfile: "안정추구형", summary: "큰 수익보다 흔들리지 않는 장기 복리를 중시하는 안정형 투자자입니다.", strengths: "시장 변동에 쉽게 흔들리지 않고 꾸준히 자산을 쌓아가는 힘이 있습니다.", cautions: "너무 보수적으로 운용하면 물가상승률을 충분히 이기지 못할 수 있습니다.", preset: { growthStock: 10, valueStock: 25, bond: 40, reit: 5, gold: 10, crypto: 0, cash: 10 }, sectors: ["배당", "필수소비재", "채권형 ETF", "리츠"], actions: ["채권과 배당 자산 중심으로 안정성을 확보하세요.", "일부 성장자산으로 장기 수익률을 보완하세요.", "1년에 한 번 정도 리밸런싱을 점검하세요."], defaults: { years: 10, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-장기-자동-확신": { typeId: "careful-core-builder", nickname: "신중한 코어빌더형", finpleType: "코어 수호형", riskProfile: "안정추구형", summary: "안정성을 우선하되 믿을 수 있는 핵심 자산을 천천히 쌓아가는 투자자입니다.", strengths: "불필요한 자산을 늘리기보다 핵심 자산 위주로 단순하게 관리할 수 있습니다.", cautions: "핵심 자산에 대한 확신이 지나치면 특정 자산 의존도가 높아질 수 있습니다.", preset: { growthStock: 15, valueStock: 30, bond: 35, reit: 5, gold: 10, crypto: 0, cash: 5 }, sectors: ["배당성장", "퀄리티", "대형 우량주", "리츠"], actions: ["대형 우량주와 채권을 중심으로 안정적인 코어를 만드세요.", "리츠를 통해 인컴 성격을 보완할 수 있습니다.", "핵심 자산 비중이 과도해지지 않도록 점검하세요."], defaults: { years: 10, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-장기-주도-분산": { typeId: "strategic-architect", nickname: "용의주도한 설계자형", finpleType: "원칙 설계형", riskProfile: "위험중립형", summary: "분산과 원칙을 바탕으로 스스로 포트폴리오를 설계하는 신중한 관리자입니다.", strengths: "자산별 역할을 구분하고 장기적으로 안정적인 구조를 만들 수 있습니다.", cautions: "분석이 길어져 실행이 늦어지거나 지나치게 많은 자산으로 복잡해질 수 있습니다.", preset: { growthStock: 15, valueStock: 30, bond: 30, reit: 5, gold: 15, crypto: 0, cash: 5 }, sectors: ["퀄리티", "배당", "헬스케어", "인프라"], actions: ["자산별 역할을 명확히 나누세요.", "정기적으로 비중을 점검하는 규칙을 세우세요.", "핵심 구조를 단순하게 유지하세요."], defaults: { years: 10, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-장기-주도-확신": { typeId: "disciplined-strategist", nickname: "철저한 전략가형", finpleType: "핵심 설계형", riskProfile: "위험중립형", summary: "안정적인 큰 틀 안에서 확신 있는 핵심 자산을 전략적으로 가져가는 투자자입니다.", strengths: "흔들리지 않는 기준과 명확한 투자 논리를 갖기 쉽습니다.", cautions: "확신 자산의 비중이 높아지면 예상보다 큰 손실 구간을 경험할 수 있습니다.", preset: { growthStock: 20, valueStock: 35, bond: 25, reit: 5, gold: 10, crypto: 0, cash: 5 }, sectors: ["금융", "배당성장", "대형 가치주", "인프라"], actions: ["가치주와 배당성장 자산을 중심으로 운용하세요.", "특정 섹터 쏠림을 관리하세요.", "확신 자산의 비중 상한선을 정해두세요."], defaults: { years: 10, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-기회-자동-분산": { typeId: "calm-observer", nickname: "침착한 관찰자형", finpleType: "기회 관망형", riskProfile: "안정추구형", summary: "기회는 보고 싶지만 크게 움직이기보다는 안정적인 구조를 선호하는 투자자입니다.", strengths: "시장 변화에 관심을 가지면서도 무리한 판단을 피할 수 있습니다.", cautions: "기회를 기다리다가 현금 비중이 과도하게 높아질 수 있습니다.", preset: { growthStock: 15, valueStock: 25, bond: 30, reit: 5, gold: 15, crypto: 0, cash: 10 }, sectors: ["필수소비재", "금", "리츠", "방어주"], actions: ["현금과 방어자산을 유지하세요.", "조건이 오면 일부 성장자산을 편입하는 규칙을 만드세요.", "관망 기간이 길어지지 않도록 정기 점검하세요."], defaults: { years: 7, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-기회-자동-확신": { typeId: "wise-selector", nickname: "현명한 선별가형", finpleType: "기회 선별형", riskProfile: "위험중립형", summary: "기본은 안정적으로 가져가되 좋아 보이는 자산에는 선택적으로 비중을 두는 투자자입니다.", strengths: "큰 위험을 피하면서도 일부 성장 기회를 포트폴리오에 반영할 수 있습니다.", cautions: "선별한 자산이 기대와 다를 경우 전체 성과가 흔들릴 수 있습니다.", preset: { growthStock: 20, valueStock: 30, bond: 25, reit: 5, gold: 10, crypto: 0, cash: 10 }, sectors: ["금융", "헬스케어", "소비재", "배당주"], actions: ["관심 섹터를 넓게 추적하세요.", "편입 전 가격 부담과 비중을 함께 확인하세요.", "선별 자산의 비중이 과도해지지 않도록 관리하세요."], defaults: { years: 7, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-기회-주도-분산": { typeId: "agile-risk-manager", nickname: "민첩한 리스크매니저형", finpleType: "방어 전술형", riskProfile: "위험중립형", summary: "시장 상황을 살피며 위험을 줄이고 기회를 조절하는 방어적 운용자입니다.", strengths: "위험 신호에 민감하고 자산배분으로 손실을 관리하려는 태도가 강합니다.", cautions: "잦은 조정이 장기 성과를 방해할 수 있습니다.", preset: { growthStock: 20, valueStock: 25, bond: 25, reit: 5, gold: 15, crypto: 0, cash: 10 }, sectors: ["방어주", "금", "채권", "퀄리티"], actions: ["조정 기준을 사전에 정하세요.", "방어자산과 성장자산의 역할을 분리하세요.", "조정 후 결과를 기록하세요."], defaults: { years: 7, monthlyContribution: 500000, inflationRate: 2.5 } },
  "안정-기회-주도-확신": { typeId: "bold-defender", nickname: "대담한 수비수형", finpleType: "방어 승부형", riskProfile: "적극투자형", summary: "방어 기준을 갖고 있지만 확신 구간에서는 과감히 움직일 수 있는 투자자입니다.", strengths: "리스크를 인식하면서도 기회가 보이면 결단할 수 있습니다.", cautions: "방어적 성향과 집중 투자가 충돌하면 판단이 흔들릴 수 있습니다.", preset: { growthStock: 25, valueStock: 30, bond: 20, reit: 5, gold: 10, crypto: 0, cash: 10 }, sectors: ["대형주", "금융", "인컴", "금"], actions: ["집중 비중의 상한선을 정하세요.", "하락 시 대응 기준을 미리 세우세요.", "확신 자산도 정기적으로 재점검하세요."], defaults: { years: 7, monthlyContribution: 600000, inflationRate: 2.5 } },
  "성장-장기-자동-분산": { typeId: "steady-pioneer", nickname: "꾸준한 개척자형", finpleType: "성장 적립형", riskProfile: "적극투자형", summary: "성장 자산을 장기 적립하되 넓게 나눠 운용하려는 투자자입니다.", strengths: "장기 복리와 분산 효과를 함께 활용하기 좋습니다.", cautions: "성장 기대가 과도하면 하락장에서 심리적 부담이 커질 수 있습니다.", preset: { growthStock: 40, valueStock: 25, bond: 15, reit: 5, gold: 10, crypto: 0, cash: 5 }, sectors: ["미국 대표지수", "성장 ETF", "배당성장", "금"], actions: ["정기 적립 규칙을 유지하세요.", "하락장에도 투자 기간을 점검하세요.", "방어자산을 일부 유지하세요."], defaults: { years: 15, monthlyContribution: 700000, inflationRate: 2.5 } },
  "성장-장기-자동-확신": { typeId: "reliable-voyager", nickname: "믿음직한 항해자형", finpleType: "성장 코어형", riskProfile: "적극투자형", summary: "성장 핵심 자산을 오래 보유하며 복리 효과를 기대하는 투자자입니다.", strengths: "장기 성장 스토리를 믿고 꾸준히 유지하는 힘이 있습니다.", cautions: "핵심 성장자산의 변동성이 커질 수 있습니다.", preset: { growthStock: 50, valueStock: 25, bond: 10, reit: 5, gold: 5, crypto: 0, cash: 5 }, sectors: ["나스닥", "테크", "퀄리티 성장", "배당성장"], actions: ["핵심 성장자산의 비중을 점검하세요.", "하락장 대응 기준을 정해두세요.", "장기 보유 목적을 기록하세요."], defaults: { years: 15, monthlyContribution: 700000, inflationRate: 2.5 } },
  "성장-장기-주도-분산": { typeId: "balanced-architect", nickname: "균형 잡힌 건축가형", finpleType: "성장 설계형", riskProfile: "적극투자형", summary: "성장성을 추구하면서도 포트폴리오 구조를 직접 설계하는 투자자입니다.", strengths: "수익과 위험을 함께 보며 장기 구조를 만들 수 있습니다.", cautions: "직접 관리 항목이 많아질수록 관리 피로도가 높아질 수 있습니다.", preset: { growthStock: 45, valueStock: 25, bond: 10, reit: 5, gold: 10, crypto: 0, cash: 5 }, sectors: ["테크", "헬스케어", "배당성장", "금"], actions: ["성장·방어·인컴 역할을 분리하세요.", "반기별 리밸런싱 기준을 만드세요.", "시뮬레이터에서 MDD를 함께 확인하세요."], defaults: { years: 15, monthlyContribution: 800000, inflationRate: 2.5 } },
  "성장-장기-주도-확신": { typeId: "growth-strategist", nickname: "장기 성장 전략가형", finpleType: "성장 전략형", riskProfile: "적극투자형", summary: "장기 성장 시나리오를 직접 만들고 확신 자산을 관리하는 투자자입니다.", strengths: "장기 성장 논리를 세우고 실행하는 능력이 강합니다.", cautions: "성장주 집중도가 높아지면 큰 낙폭을 경험할 수 있습니다.", preset: { growthStock: 55, valueStock: 20, bond: 5, reit: 5, gold: 5, crypto: 5, cash: 5 }, sectors: ["테크", "AI", "반도체", "성장 ETF"], actions: ["핵심 성장자산의 상한선을 정하세요.", "낙폭 구간에서 추가 투자 기준을 세우세요.", "위성자산은 전체 비중을 제한하세요."], defaults: { years: 15, monthlyContribution: 800000, inflationRate: 2.5 } },
  "성장-기회-자동-분산": { typeId: "open-explorer", nickname: "열린 탐험가형", finpleType: "기회 확장형", riskProfile: "적극투자형", summary: "성장 기회를 넓게 탐색하면서도 간편한 운용을 선호하는 투자자입니다.", strengths: "새로운 기회를 받아들이되 분산을 통해 위험을 낮추려 합니다.", cautions: "트렌드를 따라가다 포트폴리오가 산만해질 수 있습니다.", preset: { growthStock: 45, valueStock: 20, bond: 10, reit: 5, gold: 10, crypto: 5, cash: 5 }, sectors: ["글로벌 ETF", "신성장", "금", "리츠"], actions: ["새 테마는 소액 위성자산으로 시작하세요.", "분산 기준을 유지하세요.", "정기적으로 중복 노출을 점검하세요."], defaults: { years: 10, monthlyContribution: 700000, inflationRate: 2.5 } },
  "성장-기회-자동-확신": { typeId: "sharp-pioneer", nickname: "예리한 선구자형", finpleType: "테마 집중형", riskProfile: "공격투자형", summary: "성장 테마에 민감하고 확신 있는 기회를 빠르게 받아들이는 투자자입니다.", strengths: "새로운 성장 흐름을 빠르게 포착하는 장점이 있습니다.", cautions: "테마 집중과 타이밍 판단 실패 시 변동성이 매우 커질 수 있습니다.", preset: { growthStock: 55, valueStock: 15, bond: 5, reit: 5, gold: 5, crypto: 10, cash: 5 }, sectors: ["AI", "반도체", "테크", "코인"], actions: ["테마 자산은 비중 상한을 정하세요.", "분할 매수 기준을 세우세요.", "손실 감내 범위를 먼저 정하세요."], defaults: { years: 10, monthlyContribution: 800000, inflationRate: 2.5 } },
  "성장-기회-주도-분산": { typeId: "dynamic-builder", nickname: "역동적인 빌더형", finpleType: "성장 전술형", riskProfile: "공격투자형", summary: "성장 기회를 직접 찾고 여러 아이디어를 조합하는 능동형 투자자입니다.", strengths: "포트폴리오를 직접 개선하고 다양한 성장 기회를 탐색할 수 있습니다.", cautions: "아이디어가 많아지면 관리가 어려워지고 중복 노출이 커질 수 있습니다.", preset: { growthStock: 50, valueStock: 15, bond: 5, reit: 5, gold: 5, crypto: 15, cash: 5 }, sectors: ["AI", "반도체", "바이오", "코인"], actions: ["아이디어별 비중과 역할을 기록하세요.", "중복 노출을 시뮬레이터에서 확인하세요.", "손실 구간에서도 유지할 기준을 정하세요."], defaults: { years: 10, monthlyContribution: 900000, inflationRate: 2.5 } },
  "성장-기회-주도-확신": { typeId: "bold-visionary", nickname: "대담한 비전가형", finpleType: "고성장 확신형", riskProfile: "공격투자형", summary: "강한 성장 확신을 바탕으로 과감하게 기회를 추구하는 투자자입니다.", strengths: "큰 성장 기회를 포착하고 실행하는 추진력이 강합니다.", cautions: "높은 변동성과 큰 손실 가능성을 반드시 감안해야 합니다.", preset: { growthStock: 55, valueStock: 10, bond: 0, reit: 0, gold: 5, crypto: 25, cash: 5 }, sectors: ["AI", "반도체", "레버리지", "코인"], actions: ["고위험 자산 비중을 스스로 제한하세요.", "최대 낙폭을 먼저 확인하세요.", "수익보다 손실 대응 계획을 먼저 정하세요."], defaults: { years: 10, monthlyContribution: 1000000, inflationRate: 2.5 } },
};

function pickAxis(score, negativeLabel, positiveLabel) {