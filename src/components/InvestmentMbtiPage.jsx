import { useEffect, useMemo, useState } from "react";
import { hydrateAssetFromScreenerCandidate } from "../data/tickers/screenerCandidateLoader";
import {
  MBTI_PRESET_MAP,
  buildMbtiProfileFromResult,
  storeMbtiProfileFromResult,
} from "./portfolio/utils/mbtiProfileStorage";
import { upsertInvestmentMbtiProfile } from "./portfolio/services/serverPortfolioService";
import "./InvestmentMbtiPage.css";
import "./InvestmentMbtiPage.step111.css";

const PORTFOLIO_STORAGE_KEY = "finple-portfolio-list";
const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
const LEGACY_STORAGE_KEY = "finple-portfolio-simulator";

const ASSET_LABELS = {
  growthStock: "성장주",
  valueStock: "가치·배당",
  bond: "종합채권",
  longBond: "장기국채",
  reit: "리츠",
  gold: "금",
  crypto: "블록체인 테마",
  cash: "현금",
};

const AXIS_DISPLAY_LABELS = {
  자동: "추종",
};

const AXIS_TOOLTIP_TEXTS = {
  안정: "손실과 변동성을 줄이는 것을 우선하며, 채권·배당·현금 같은 완충자산을 중시하는 성향입니다.",
  성장: "변동성을 감수하더라도 장기 수익률과 자산 증식을 더 중시하는 성향입니다.",
  장기: "단기 시세보다 긴 투자기간과 복리 효과를 중요하게 보는 성향입니다.",
  기회: "시장 국면, 가격 변동, 테마 변화에 맞춰 비중 조정 여지를 두는 성향입니다.",
  추종: "기본 배분과 예시 프리셋을 중심으로 과도한 판단 개입을 줄이고 일관되게 운용하려는 성향입니다.",
  주도: "사용자가 직접 비중과 자산을 조정하며 능동적으로 관리하려는 성향입니다.",
  분산: "여러 자산에 나누어 특정 자산의 충격을 줄이려는 성향입니다.",
  확신: "상대적으로 더 신뢰하는 핵심 자산이나 테마에 높은 비중을 두려는 성향입니다.",
};

const US_ASSET_TEMPLATES = {
  growthStock: { ticker: "QQQ", name: "Invesco QQQ Trust ETF", price: 430000, market: "US" },
  valueStock: { ticker: "SCHD", name: "Schwab U.S. Dividend Equity ETF", price: 110000, market: "US" },
  bond: { ticker: "BND", name: "Vanguard Total Bond Market ETF", price: 110000, market: "US" },
  longBond: { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", price: 125000, market: "US" },
  reit: { ticker: "VNQ", name: "Vanguard Real Estate ETF", price: 120000, market: "US" },
  gold: { ticker: "GLD", name: "SPDR Gold Shares ETF", price: 300000, market: "US" },
  crypto: { ticker: "BLOK", name: "Amplify Transformational Data Sharing ETF", price: 45000, market: "US", cagr: 9.0, beta: 1.4, mdd: -65, dividendYield: 1.0 },
  cash: { ticker: "CASH", name: "현금 / 대기자금", price: 10000, market: "CASH", cagr: 2.5, beta: 0, mdd: 0, dividendYield: 2.0 },
};

const KR_ASSET_TEMPLATES = {
  growthStock: { ticker: "069500", name: "KODEX 200", price: 35000, market: "KR" },
  valueStock: { ticker: "161510", name: "국내 고배당 ETF", price: 15000, market: "KR" },
  bond: { ticker: "273130", name: "KODEX 종합채권(AA-이상)액티브", price: 100000, market: "KR" },
  longBond: { ticker: "148070", name: "KOSEF 국고채10년", price: 120000, market: "KR" },
  reit: { ticker: "329200", name: "TIGER 리츠부동산인프라", price: 5000, market: "KR" },
  gold: { ticker: "132030", name: "KODEX 골드선물(H)", price: 15000, market: "KR" },
  crypto: { ticker: "305720", name: "KODEX 2차전지산업", price: 15000, market: "KR", cagr: 8.0, beta: 1.4, mdd: -45, dividendYield: 0 },
  cash: { ticker: "CASH", name: "현금 / 대기자금", price: 10000, market: "CASH", cagr: 2.5, beta: 0, mdd: 0, dividendYield: 2.0 },
};

const MBTI_DISPLAY_NAMES = {
  "안정-장기-자동-분산": "차분한 수호자형",
  "안정-장기-자동-확신": "신중한 코어빌더형",
  "안정-장기-주도-분산": "용의주도한 설계자형",
  "안정-장기-주도-확신": "철저한 전략가형",
  "안정-기회-자동-분산": "침착한 관찰자형",
  "안정-기회-자동-확신": "현명한 선별가형",
  "안정-기회-주도-분산": "민첩한 리스크매니저형",
  "안정-기회-주도-확신": "대담한 수비수형",
  "성장-장기-자동-분산": "꾸준한 개척자형",
  "성장-장기-자동-확신": "믿음직한 항해자형",
  "성장-장기-주도-분산": "균형 잡힌 건축가형",
  "성장-장기-주도-확신": "장기 성장 전략가형",
  "성장-기회-자동-분산": "열린 탐험가형",
  "성장-기회-자동-확신": "예리한 선구자형",
  "성장-기회-주도-분산": "능동적인 지휘관형",
  "성장-기회-주도-확신": "용감한 승부사형",
};

const TYPE_COPY = {
  "안정-장기-자동-분산": {
    check: "물가상승률을 이길 수 있는 최소 성장주 비중이 확보되어 있는지 점검하세요. 채권과 장기국채가 함께 들어가므로 금리 상승기에는 듀레이션 위험을 함께 확인하고, 리츠·금·현금이 과도하게 겹치지 않는지도 보시면 좋습니다.",
    strength: "포트폴리오가 여러 완충자산으로 나뉘어 있어 급락장에서 심리적으로 버티기 쉽습니다. 추종 운용 성향과 잘 맞아 잦은 매매 없이 장기 투자 규칙을 유지하기 좋습니다.",
    caution: "방어자산이 많은 만큼 강한 상승장에서는 상대적으로 느리게 움직일 수 있습니다. 장기 자금 일부는 성장자산으로 실질 구매력 방어를 보완해야 합니다.",
  },
  "안정-장기-자동-확신": {
    check: "SCHD와 TLT가 성과의 중심이 되므로 배당성장 지속성과 금리 방향을 함께 보세요. 자산 수가 적어 관리가 쉽지만, 주식 상승장에서 성장주 비중이 지나치게 낮지 않은지 확인이 필요합니다.",
    strength: "투자 구조가 단순하고 핵심 자산이 명확합니다. 안정형 투자자에게 필요한 방어 논리와 현금흐름을 한눈에 이해하기 쉬운 포트폴리오입니다.",
    caution: "확신 자산이 안전자산이라는 뜻은 아닙니다. 장기국채는 금리 상승기에 손실이 커질 수 있고, 배당 ETF도 주식형 자산인 만큼 하락 가능성이 있습니다.",
  },
  "안정-장기-주도-분산": {
    check: "직접 운용 성향이 있으므로 리밸런싱 기준을 숫자로 정해두세요. QQQ·SCHD·BND·TLT·VNQ가 함께 들어가므로 중복 노출보다는 역할 분담이 명확한지 확인하는 것이 중요합니다.",
    strength: "안정형이지만 성장주와 리츠까지 포함해 방어와 기회 노출의 균형이 좋습니다. 직접 조정 능력을 활용하면 시장 변화에 맞춰 위험을 세밀하게 관리할 수 있습니다.",
    caution: "너무 자주 조정하면 장기형의 장점이 약해질 수 있습니다. 기준 없는 조정보다는 목표비중 이탈폭을 정해두는 방식이 적합합니다.",
  },
  "안정-장기-주도-확신": {
    check: "SCHD 40%와 TLT 28%가 핵심이므로 배당주 사이클과 장기금리 변동을 동시에 점검하세요. 성장주 비중은 낮지만 12%는 유지되므로 시장 회복기에 너무 소극적으로 바뀌지 않는지도 보시면 좋습니다.",
    strength: "자산 수를 줄이면서도 배당·국채·금·현금이라는 방어축이 뚜렷합니다. 직접 운용 성향이 있어 방어형 포트폴리오 안에서도 세밀한 판단을 반영하기 좋습니다.",
    caution: "확신이 강하면 특정 방어 논리에 오래 머물 수 있습니다. 금리 하락·상승, 배당주 부진, 성장주 랠리 등 환경 변화에 따라 핵심 가정이 바뀌는지 점검해야 합니다.",
  },
  "안정-기회-자동-분산": {
    check: "금 15%와 현금 20%가 기회 대응 여력을 만듭니다. 다만 실제 매수 기준이 없으면 현금이 오래 놀 수 있으므로, 하락 시 분할투입 기준을 미리 정해주세요.",
    strength: "위험을 낮추면서도 시장 급락 후 재진입할 여지가 있습니다. 추종 운용과 분산을 유지하기 쉬우며, 금과 현금이 심리적 완충 역할을 합니다.",
    caution: "현금과 금 비중이 높은 구조는 상승장에서 뒤처질 수 있습니다. 관망이 습관화되지 않도록 언제 성장자산을 늘릴지 기준이 필요합니다.",
  },
  "안정-기회-자동-확신": {
    check: "금 25%, 장기국채 25%, 현금 20%가 핵심입니다. 위기 방어에는 강하지만 회복장 대응이 늦을 수 있으므로 QQQ 5%가 너무 낮지 않은지 검토해보세요.",
    strength: "위험자산 노출을 크게 낮추고 대기자금을 확보하는 데 강점이 있습니다. 시장 불확실성이 높을 때 원칙을 지키며 기다리기 좋은 구조입니다.",
    caution: "금과 장기국채가 항상 동시에 방어해주는 것은 아닙니다. 인플레이션·금리 상승 구간에서는 두 자산 모두 기대와 다르게 움직일 수 있습니다.",
  },
  "안정-기회-주도-분산": {
    check: "분산이 넓고 직접 운용 의지가 있으므로 자산별 역할표가 필요합니다. 금과 리츠는 시장 국면별 성격이 다르므로 단순 방어자산으로만 보지 않는 것이 좋습니다.",
    strength: "방어자산을 유지하면서도 QQQ와 리츠를 통해 회복장과 기회를 일부 따라갈 수 있습니다. 직접 조정 능력을 활용해 기회 대응과 안정성의 균형을 맞추기 좋습니다.",
    caution: "자산 수가 많아질수록 판단 피로가 커질 수 있습니다. 매번 시장을 맞히려 하기보다 분기별 점검 규칙을 두는 편이 안전합니다.",
  },
  "안정-기회-주도-확신": {
    check: "GLD 25%와 TLT 20%가 방어 중심이고 BLOK 5%가 위성 기회입니다. 테마 자산은 손실 허용 범위를 정하고, 금·국채의 방어 논리도 정기적으로 재검토하세요.",
    strength: "안정형 중에서는 기회 포착 능력이 가장 강합니다. 방어축을 유지하면서도 테마 자산을 작게 넣어 성과 동인을 분명히 만들 수 있습니다.",
    caution: "방어형이라는 이름과 달리 금·장기국채·블록체인 테마가 모두 변동성을 가질 수 있습니다. 특히 BLOK은 보조 비중을 넘지 않도록 관리해야 합니다.",
  },
  "성장-장기-자동-분산": {
    check: "QQQ 35%가 성과 중심이지만 SCHD와 채권이 완충합니다. 장기 추종형이므로 월 투자금 지속 가능성, 하락장 추가 납입 가능성, 배당 재투자 여부를 함께 점검하세요.",
    strength: "성장과 방어가 모두 들어간 가장 표준적인 장기 성장형 구조입니다. 추종 운용과 잘 맞아 장기 적립식 투자에 적용하기 쉽습니다.",
    caution: "분산되어 있어도 성장주 비중이 낮지 않습니다. 나스닥 장기 조정기에는 기대수익보다 투자 지속력이 더 중요한 핵심 지표가 됩니다.",
  },
  "성장-장기-자동-확신": {
    check: "QQQ 50%가 포트폴리오의 성과 대부분을 좌우합니다. 장기 추종 운용이라도 MDD, 기술주 밸류에이션, 환율 영향을 주기적으로 확인하세요.",
    strength: "핵심 성장자산이 명확해 운용이 단순합니다. 장기적으로 성장 산업에 노출되면서 SCHD·채권·금이 일부 완충 역할을 합니다.",
    caution: "확신형이지만 BLOK은 없고 QQQ 집중도가 높은 구조입니다. 기술주 장기 부진기에는 성과가 크게 흔들릴 수 있습니다.",
  },
  "성장-장기-주도-분산": {
    check: "QQQ 45%와 SCHD 22%가 중심입니다. 직접 조정 성향이 있으므로 기술주 조정, 리츠 금리 민감도, 채권 비중 축소 여부를 함께 검토하세요.",
    strength: "성장 기회를 충분히 반영하면서도 배당·리츠·채권·금이 분산 역할을 합니다. 스스로 가정값을 조정하고 비교 분석하기 좋은 구조입니다.",
    caution: "분산형이지만 실제 성과는 QQQ와 주식형 자산에 크게 좌우됩니다. 과도한 매매와 중복 섹터 노출을 주의해야 합니다.",
  },
  "성장-장기-주도-확신": {
    check: "QQQ 60%와 BLOK 5%가 성장 확신을 나타냅니다. 장기형이라도 최대낙폭, 기술주 편중, 테마 ETF의 변동성은 반드시 확인하세요.",
    strength: "장기 성과 목표가 뚜렷하고 포트폴리오의 핵심 동인이 명확합니다. 직접 운용 성향이 있어 성장 시나리오를 점검하고 조정하기 좋습니다.",
    caution: "상승장에서는 강하지만 하락장에서 심리적 부담이 클 수 있습니다. TLT·GLD·CASH 비중이 작기 때문에 방어 규칙을 사전에 정해야 합니다.",
  },
  "성장-기회-자동-분산": {
    check: "QQQ 35%, GLD 15%, CASH 10%가 함께 있어 공격과 방어가 섞인 구조입니다. 기회형이지만 추종 운용 성향이므로 테마 자산 확대 기준은 보수적으로 정하세요.",
    strength: "성장자산과 대체자산이 함께 있어 특정 시장 국면에 덜 의존합니다. 초보자도 비교적 관리 가능한 범위에서 기회 회피 성향을 반영할 수 있습니다.",
    caution: "여러 자산이 섞여 있어 방향성이 모호해질 수 있습니다. 금·리츠·BLOK이 왜 필요한지 목적을 정리하지 않으면 단순히 복잡한 포트폴리오가 될 수 있습니다.",
  },
  "성장-기회-자동-확신": {
    check: "QQQ 45%, BLOK 10%, GLD 15%가 핵심입니다. 테마와 금의 비중이 커서 시장 국면에 따라 성과 차이가 크게 날 수 있으므로 리밸런싱 기준이 필요합니다.",
    strength: "성장·테마·대체자산을 단순한 구조로 담아 기회 포착력이 좋습니다. 추종형이라 매번 세부 판단을 하지 않아도 핵심 방향성을 유지할 수 있습니다.",
    caution: "확신형이지만 추종형이라 시장 변화에 둔감해질 수 있습니다. BLOK과 QQQ가 동시에 흔들릴 때 감내 가능한 손실 범위를 미리 정해야 합니다.",
  },
  "성장-기회-주도-분산": {
    check: "QQQ 45%, VNQ 8%, GLD 12%, BLOK 5%로 기회 자산이 다양합니다. 직접 운용 시 자산별 매수·매도 기준과 중복 위험을 명확히 나누세요.",
    strength: "기회 포착 범위가 넓고, 직접 조정 능력을 활용해 시장 변화에 빠르게 대응할 수 있습니다. 분산형이라 단일 테마에 전부 의존하지 않습니다.",
    caution: "기회 자산이 많아질수록 회전율과 판단 피로가 높아질 수 있습니다. 명확한 기준 없이 자주 바꾸면 장기 성과가 흔들릴 수 있습니다.",
  },
  "성장-기회-주도-확신": {
    check: "QQQ 70%와 BLOK 15%가 대부분의 성과와 위험을 결정합니다. 최대낙폭, 손실 허용선, 현금 재투입 기준을 반드시 사전에 정해주세요.",
    strength: "방향성이 가장 명확하고 상승장에서 성과 탄력이 큽니다. 확신 있는 성장 테마에 집중하고 싶은 투자자에게는 이해하기 쉬운 구조입니다.",
    caution: "16개 유형 중 변동성 부담이 가장 클 수 있습니다. 단기 급락 시 포트폴리오를 유지할 수 있는지, 금·현금 10%가 충분한지 검토해야 합니다.",
  },
};

const AXIS_CHART_ITEMS = [
  { scoreKey: "returnStyle", left: "안정", right: "성장" },
  { scoreKey: "timeStyle", left: "장기", right: "기회" },
  { scoreKey: "controlStyle", left: "자동", right: "주도" },
  { scoreKey: "concentrationStyle", left: "분산", right: "확신" },
];

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

function displayAxisLabel(value) {
  return AXIS_DISPLAY_LABELS[value] || value;
}

function displayAxisValues(axes = {}) {
  return Object.values(axes).map(displayAxisLabel);
}

function riskProfileFromScore(score) {
  if (score <= -9) return "초안정형";
  if (score <= -3) return "안정추구형";
  if (score <= 4) return "위험중립형";
  if (score <= 11) return "적극투자형";
  return "공격투자형";
}

function getTypeKey(axes) {
  return [axes.returnStyle, axes.timeStyle, axes.controlStyle, axes.concentrationStyle].join("-");
}

function getPreset(axes) {
  return MBTI_PRESET_MAP[getTypeKey(axes)] || MBTI_PRESET_MAP["성장-장기-주도-분산"];
}

function getTypeName(axes) {
  return MBTI_DISPLAY_NAMES[getTypeKey(axes)] || `${axes.returnStyle} ${axes.timeStyle} ${axes.controlStyle} ${axes.concentrationStyle}형`;
}

function getTopAssetLabels(preset = {}, count = 2) {
  return Object.entries(preset).filter(([, weight]) => Number(weight || 0) > 0).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0)).slice(0, count).map(([key, weight]) => `${ASSET_LABELS[key] || key} ${weight}%`);
}

function getBufferAssetLabels(preset = {}) {
  return ["bond", "longBond", "gold", "cash", "reit"].filter((key) => Number(preset[key] || 0) > 0).map((key) => `${ASSET_LABELS[key]} ${preset[key]}%`);
}

function buildTypeDetails(axes, preset, riskProfile, nickname) {
  const copy = TYPE_COPY[getTypeKey(axes)] || {};
  const axisText = displayAxisValues(axes).join(" · ");
  const coreAssets = getTopAssetLabels(preset, 2);
  const bufferAssets = getBufferAssetLabels(preset);
  const isGrowth = axes.returnStyle === "성장";
  const isOpportunity = axes.timeStyle === "기회";
  const isPassive = axes.controlStyle === "자동";
  const isConcentrated = axes.concentrationStyle === "확신";
  const overview = `“${nickname}”은 ${axisText} 성향을 가진 투자자입니다. ${isGrowth ? "장기 성장성과 자산 증식 가능성을 중시합니다." : "손실 관리와 투자 지속 가능성을 우선합니다."} ${isOpportunity ? "시장 국면에 따른 기회 대응 여지도 함께 둡니다." : "단기 판단보다 긴 투자기간과 복리 효과를 더 중요하게 봅니다."} ${isPassive ? "운용 방식은 기본 배분을 크게 흔들지 않는 추종형에 가깝습니다." : "운용 방식은 직접 비중을 조정하는 주도형에 가깝습니다."}`;
  const designReason = `이 유형의 핵심 자산은 ${coreAssets.join(" · ") || "산정 중"}입니다. 완충 자산은 ${bufferAssets.join(" · ") || "낮은 편"}이며, ${isConcentrated ? "확신 자산의 성과 기여도를 높이는 대신 변동성 관리가 중요합니다." : "여러 자산으로 충격을 나누는 구조입니다."}`;
  return {
    overview,
    designReason,
    coreAssets,
    bufferAssets,
    strength: copy.strength || "성향과 자산비중의 방향이 비교적 명확해 포트폴리오의 역할을 이해하기 쉽습니다.",
    caution: copy.caution || "시장 상황에 따라 기대수익과 실제 변동성이 달라질 수 있으므로 정기 점검이 필요합니다.",
    checks: [
      copy.check || "실제 투자 전 목표수익률, 최대낙폭, 리밸런싱 기준을 함께 확인하세요.",
      `${riskProfile}에 해당하더라도 실제 투자 가능 금액, 투자기간, 생활자금 여부에 따라 적정 비중은 달라질 수 있습니다.`,
      "본 프리셋은 성향 이해용 예시이므로 투자 전 본인의 재무상황과 위험 감내 수준을 별도로 점검하세요.",
    ],
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
  const nickname = getTypeName(axes);
  const details = buildTypeDetails(axes, preset, calculatedRiskProfile, nickname);
  const axisDisplayText = displayAxisValues(axes).join(" · ");
  const type = {
    typeId: Object.values(axes).join("-"),
    nickname,
    finpleType: displayAxisValues(axes).join(" "),
    riskProfile: calculatedRiskProfile,
    summary: `${axisDisplayText} 성향을 기반으로 한 참고용 투자 성향입니다.`,
    strengths: details.strength,
    cautions: details.caution,
    preset,
    actions: details.checks,
    details,
    defaults: { years: axes.timeStyle === "장기" ? 15 : 10, monthlyContribution: axes.returnStyle === "성장" ? 800000 : 500000, inflationRate: 2.5 },
  };
  return { answeredCount, totalCount: QUESTIONS.length, isComplete: answeredCount === QUESTIONS.length, axisScores, axes, type, calculatedRiskProfile, riskScore };
}

function formatWon(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

async function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true; } catch (error) { console.warn("클립보드 API 복사 실패", error); }
  }
  if (typeof document === "undefined") return false;
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch (error) { console.warn("대체 복사 방식 실패", error); return false; }
}

function buildAssetsFromPreset(preset = {}, initialAmount = 50000000, marketMode = "US") {
  const templates = marketMode === "KR" ? KR_ASSET_TEMPLATES : US_ASSET_TEMPLATES;
  return Object.entries(preset).filter(([, weight]) => Number(weight || 0) > 0).map(([assetKey, weight], index) => {
    const template = templates[assetKey] || templates.cash;
    const isCash = template.ticker === "CASH";
    const isKoreanStock = marketMode === "KR" && template.market === "KR" && !isCash;
    const baseAsset = hydrateAssetFromScreenerCandidate({
      ...template,
      quantity: 0,
      currency: "KRW",
      quoteCurrency: "KRW",
      priceMode: "manual",
      metricMode: isKoreanStock ? "kis_kr_price_pending" : (template.market === "US" ? "final_csv_v1_price_close" : "manual"),
      dataSource: isKoreanStock ? "investment-mbti+kr-template" : (template.market === "US" ? "investment-mbti+final-csv" : "investment-mbti"),
    });
    const price = isCash ? Number(template.price || 10000) : Number(baseAsset.price || template.price || 1);
    const assetValue = Number(initialAmount || 0) * Number(weight || 0) / 100;
    return {
      ...baseAsset,
      id: `mbti-${marketMode.toLowerCase()}-asset-${assetKey}-${Date.now()}-${index}`,
      quantity: Number((assetValue / price).toFixed(4)),
      price,
      targetEvaluationAmount: Number(assetValue.toFixed(0)),
      priceMode: "manual",
      metricMode: isCash ? "manual" : (baseAsset.metricMode || (isKoreanStock ? "kis_kr_price_pending" : (template.market === "US" ? "final_csv_v1_price_close" : "manual"))),
      dataSource: isCash ? "investment-mbti-cash" : (baseAsset.dataSource || (isKoreanStock ? "investment-mbti+kr-template" : (template.market === "US" ? "investment-mbti+final-csv" : "investment-mbti"))),
      lookupDisabled: isCash,
      shouldAutoLookup: !isCash,
    };
  });
}

function scheduleSimulatorAutoLookup() {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    const bulkLookupButton = Array.from(document.querySelectorAll("button")).find((button) => String(button.textContent || "").trim() === "전체 조회");
    bulkLookupButton?.click?.();
  }, 900);
}

function saveMbtiProfileToServer(profile) {
  if (!profile?.typeId) return Promise.resolve(null);
  return upsertInvestmentMbtiProfile(profile).catch((error) => {
    if (typeof window !== "undefined") {
      window.__finpleMbtiServerSavePending = {
        profile,
        error: error?.message || "투자 MBTI 결과 서버 저장에 실패했습니다.",
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  });
}

function saveResultToSimulator(result, marketMode = "US") {
  if (!result?.type) return false;
  const now = new Date().toISOString();
  const id = `mbti-${marketMode.toLowerCase()}-${Date.now()}`;
  const type = result.type;
  const settings = { monthlyCashFlow: type.defaults.monthlyContribution, years: type.defaults.years, dividendReinvest: true, inflationRate: type.defaults.inflationRate };
  const assets = buildAssetsFromPreset(type.preset, 50000000, marketMode);
  const portfolio = { id, name: type.nickname, settings, assets, updatedAt: now, source: marketMode === "KR" ? "investment-mbti-kr" : "investment-mbti", mbti: { typeId: type.typeId, nickname: type.nickname, finpleType: type.finpleType, riskProfile: result.calculatedRiskProfile, marketMode } };
  try {
    const currentList = JSON.parse(localStorage.getItem(PORTFOLIO_STORAGE_KEY) || "[]");
    const nextList = [portfolio, ...(Array.isArray(currentList) ? currentList.filter((item) => item?.id !== id) : [])];
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(nextList));
    localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, id);
    localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ portfolioList: nextList, activePortfolioId: id, activePortfolio: portfolio, assets, settings, globalSettings: settings, updatedAt: now }));
    const profile = buildMbtiProfileFromResult(result, {
      marketMode,
      createdAt: now,
      source: "investment-mbti-simulator",
    });
    storeMbtiProfileFromResult(result, {
      marketMode,
      createdAt: now,
      source: "investment-mbti-simulator",
    });
    saveMbtiProfileToServer(profile);
    return true;
  } catch (error) { console.error("투자 MBTI 프리셋 저장 실패", error); return false; }
}

function InvestmentMbtiPage({ onBack, onNavigate }) {
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const result = useMemo(() => calculateResult(answers), [answers]);
  const question = QUESTIONS[currentIndex];
  const selectedOptionId = answers[question.id];
  const progress = Math.round((result.answeredCount / result.totalCount) * 100);
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;
  function handleSelect(optionId) { setAnswers((previous) => ({ ...previous, [question.id]: optionId })); }
  function goNext() { if (!selectedOptionId) return; setCurrentIndex((index) => Math.min(index + 1, QUESTIONS.length - 1)); }
  function goPrev() { setCurrentIndex((index) => Math.max(index - 1, 0)); }
  function resetTest() { setAnswers({}); setCurrentIndex(0); }
  function applyToSimulator(marketMode = "US") { const saved = saveResultToSimulator(result, marketMode); onNavigate?.("personal"); if (saved) scheduleSimulatorAutoLookup(); }
  if (result.isComplete && isLastQuestion) {
    return <main className="page investmentMbtiPage"><MbtiResult result={result} onReset={resetTest} onApplyUs={() => applyToSimulator("US")} onApplyKr={() => applyToSimulator("KR")} /></main>;
  }
  return (
    <main className="page investmentMbtiPage">
      <section className="investmentMbtiHero"><p className="badge">Beta Feature</p><h1>나의 투자 성향을 12문항으로 확인해보세요.</h1><p>안정/성장, 장기/기회, 추종/주도, 분산/확신 4개 축을 기준으로 투자 성향을 도출하는 참고용 진단입니다.</p></section>
      <section className="investmentMbtiSingleCard"><div className="investmentMbtiProgress"><span>{currentIndex + 1} / {QUESTIONS.length}</span><strong>{progress}%</strong></div><div className="investmentMbtiProgressTrack"><i style={{ width: `${progress}%` }} /></div><article className="investmentMbtiQuestionCard focused"><strong>Q{currentIndex + 1}</strong><h2>{question.title}</h2><div className="investmentMbtiOptionGrid">{question.options.map((option) => <button key={option.id} type="button" className={selectedOptionId === option.id ? "selected" : ""} onClick={() => handleSelect(option.id)}><span>{option.id.toUpperCase()}</span>{option.label}</button>)}</div><div className="investmentMbtiActions"><button type="button" className="secondaryButton" onClick={goPrev} disabled={currentIndex === 0}>이전</button><button type="button" className="primaryButton" onClick={goNext} disabled={!selectedOptionId || isLastQuestion}>다음</button></div>{isLastQuestion ? <div className="investmentMbtiFinishBox"><strong>마지막 문항입니다.</strong><p>답변을 선택하면 결과가 자동으로 표시됩니다.</p></div> : null}</article></section>
      <section className="investmentMbtiNotice" role="note"><strong>유의사항</strong><p>본 결과는 사용자의 투자 성향 이해를 돕기 위한 참고자료입니다. 특정 금융상품의 매수·매도 추천, 투자자문, 투자일임 또는 수익 보장을 의미하지 않습니다.</p></section>
    </main>
  );
}

function AxisTooltip({ label }) {
  const tooltipText = AXIS_TOOLTIP_TEXTS[label];
  return <span className="investmentMbtiAxisTerm" data-tooltip={tooltipText}><span>{label}</span><button type="button" aria-label={`${label} 설명`}>?</button></span>;
}

function AxisScoreChart({ result }) {
  return (
    <article className="investmentMbtiPanel investmentMbtiAxisPanel">
      <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 2</p><h3>성향 차트</h3></div></div>
      <div className="investmentMbtiAxisRiskCard"><span>위험성향</span><strong>{result.calculatedRiskProfile}</strong><p>위험성향 점수 {result.riskScore}</p></div>
      <p className="investmentMbtiAxisGuide">각 축의 3개 문항 합산 점수입니다. 0 이하이면 왼쪽 성향, 0 초과이면 오른쪽 성향으로 판정됩니다.</p>
      <div className="investmentMbtiAxisRows">{AXIS_CHART_ITEMS.map(({ scoreKey, left, right }) => { const score = Math.max(-6, Math.min(6, Number(result.axisScores?.[scoreKey] || 0))); const markerPosition = Math.max(7, Math.min(93, ((score + 6) / 12) * 100)); const leftLabel = displayAxisLabel(left); const rightLabel = displayAxisLabel(right); const selectedLabel = score > 0 ? rightLabel : leftLabel; return <div key={scoreKey} className="investmentMbtiAxisRow"><div className="investmentMbtiAxisLabels"><AxisTooltip label={leftLabel} /><strong>{selectedLabel}</strong><AxisTooltip label={rightLabel} /></div><div className="investmentMbtiAxisTrack" aria-label={`${leftLabel}-${rightLabel} 점수 ${score}`}><span>-</span><i /><span>0</span><i /><span>+</span><b style={{ left: `${markerPosition}%` }}>{score > 0 ? `+${score}` : score}</b></div></div>; })}</div>
    </article>
  );
}

function TypeOverviewPanel({ type }) {
  return <article className="investmentMbtiPanel investmentMbtiStoryPanel"><div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 3</p><h3><span className="investmentMbtiInlineName">“{type.nickname}”</span> 유형 개요</h3></div></div><p>{type.details.overview}</p><div className="investmentMbtiMiniGrid"><div><strong>강점</strong><p>{type.details.strength}</p></div><div><strong>주의점</strong><p>{type.details.caution}</p></div></div></article>;
}

function PortfolioPresetPanel({ type, entries, onApplyUs, onApplyKr }) {
  return (
    <article className="investmentMbtiPanel investmentMbtiPresetPanel">
      <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 5</p><h3>포트폴리오 프리셋</h3></div></div>
      <div className="investmentMbtiDesignBox"><strong>설계 이유</strong><p>{type.details.designReason}</p><div className="investmentMbtiMiniGrid"><div><strong>핵심 자산</strong><p>{type.details.coreAssets.join(" · ") || "핵심 자산을 산정 중입니다."}</p></div><div><strong>완충 자산</strong><p>{type.details.bufferAssets.join(" · ") || "완충 자산 비중이 낮은 공격형 구조입니다."}</p></div></div></div>
      <div className="investmentMbtiPortfolioBars">{entries.map(([key, value]) => <div key={key} className="investmentMbtiPortfolioRow"><div className="investmentMbtiPortfolioLabel"><strong>{ASSET_LABELS[key] || key}</strong><span>{value}%</span></div><div className="investmentMbtiBarTrack"><i style={{ width: `${value}%` }} /></div></div>)}</div>
      <div className="investmentMbtiPresetActions" data-finple-market-choice="ready"><button type="button" onClick={onApplyUs}>미국자산으로 반영</button><button type="button" onClick={onApplyKr}>한국자산으로 반영</button></div>
    </article>
  );
}

function CheckpointsPanel({ type }) {
  return <article className="investmentMbtiPanel"><div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 6</p><h3>점검 포인트</h3></div></div><ul>{type.details.checks.map((action) => <li key={action}>{action}</li>)}</ul></article>;
}

function MbtiResult({ result, onReset, onApplyUs, onApplyKr }) {
  const [exportStatusMessage, setExportStatusMessage] = useState("");
  const type = result.type;
  const entries = Object.entries(type.preset);
  const hasCrypto = Number(type.preset.crypto || 0) > 0;

  useEffect(() => {
    const profile = buildMbtiProfileFromResult(result, { source: "investment-mbti-result" });
    storeMbtiProfileFromResult(result, { source: "investment-mbti-result" });
    saveMbtiProfileToServer(profile);
  }, [result]);

  async function handleShareResult() {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/mbti` : "https://finple.co.kr/mbti";
    const shareText = [`저의 FINPLE 투자 MBTI는 “${type.nickname}”입니다.`, "", `성향: ${displayAxisValues(result.axes).join(" · ")}`, `FINPLE 유형: ${type.finpleType}`, `위험성향: ${result.calculatedRiskProfile}`, "", "FINPLE에서 나의 투자 성향도 확인해보세요.", "본 결과는 투자 성향 이해를 돕기 위한 참고용이며, 특정 금융상품의 매수·매도 권유가 아닙니다."].join("\n");
    const copyText = `${shareText}\n${shareUrl}`;
    setExportStatusMessage("공유 문구를 복사 중입니다.");
    try { const copied = await copyTextToClipboard(copyText); if (copied) { setExportStatusMessage("공유 문구와 링크를 복사했습니다."); return; } if (typeof window !== "undefined") { window.prompt("아래 공유 문구를 복사해 주세요.", copyText); setExportStatusMessage("자동 복사가 제한되어 수동 복사 창을 열었습니다."); return; } setExportStatusMessage("이 브라우저에서는 공유 기능을 사용할 수 없습니다."); } catch (error) { if (typeof window !== "undefined") { window.prompt("아래 공유 문구를 복사해 주세요.", copyText); setExportStatusMessage("자동 복사가 제한되어 수동 복사 창을 열었습니다."); return; } setExportStatusMessage("공유 기능을 사용할 수 없어 문구 복사를 다시 시도해 주세요."); }
  }
  function handlePdfSave() { setExportStatusMessage("브라우저 인쇄 창에서 PDF로 저장할 수 있습니다."); window.setTimeout(() => window.print(), 80); }
  return (
    <section className="investmentMbtiResultPage">
      <div className="investmentMbtiResultHero"><p className="sectionLabel">Step 1 · Investment MBTI Result</p><h1>당신의 FINPLE 투자 MBTI는<br /><span className="investmentMbtiResultName">“{type.nickname}”</span>입니다.</h1></div>
      <AxisScoreChart result={result} />
      <TypeOverviewPanel type={type} />
      <PortfolioPresetPanel type={type} entries={entries} onApplyUs={onApplyUs} onApplyKr={onApplyKr} />
      <CheckpointsPanel type={type} />
      <article className="investmentMbtiPanel investmentMbtiDisclaimerPanel"><div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 7</p><h3>투자 유의사항</h3></div></div><p>{type.details.caution}</p><p>본 결과는 참고용 성향 진단과 예시 포트폴리오입니다. 특정 종목이나 ETF의 매수·매도 추천이 아니며, 실제 투자 결정과 그 결과에 대한 책임은 사용자 본인에게 있습니다.</p>{hasCrypto ? <p>블록체인 테마 등 고변동성 위성자산은 가격 변동과 손실 가능성이 매우 크므로 전체 자산 대비 제한적인 비중으로만 검토하는 것이 좋습니다.</p> : null}</article>
      <div className="investmentMbtiShareActions" aria-label="결과 공유 및 저장"><button type="button" onClick={handleShareResult}>SNS 공유</button><button type="button" onClick={handlePdfSave}>PDF 저장</button><button type="button" className="secondaryMbtiButton" onClick={onReset}>다시 검사하기</button></div>
      {exportStatusMessage ? <p className="investmentMbtiExportStatus">{exportStatusMessage}</p> : null}
    </section>
  );
}

export default InvestmentMbtiPage;
