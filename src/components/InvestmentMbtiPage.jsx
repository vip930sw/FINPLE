import { useMemo, useState } from "react";
import { hydrateAssetFromScreenerCandidate } from "../data/tickers/screenerCandidateLoader";
import "./InvestmentMbtiPage.css";

const PORTFOLIO_STORAGE_KEY = "finple-portfolio-list";
const ACTIVE_PORTFOLIO_STORAGE_KEY = "finple-active-portfolio-id";
const GLOBAL_SETTINGS_STORAGE_KEY = "finple-global-settings";
const LEGACY_STORAGE_KEY = "finple-portfolio-simulator";
const MBTI_PRESET_STORAGE_KEY = "finple-mbti-simulator-preset";

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

const MBTI_PRESET_MAP = {
  "안정-장기-자동-분산": { growthStock: 10, valueStock: 28, bond: 24, longBond: 8, reit: 6, gold: 8, cash: 16 },
  "안정-장기-자동-확신": { growthStock: 8, valueStock: 36, longBond: 32, gold: 8, cash: 16 },
  "안정-장기-주도-분산": { growthStock: 15, valueStock: 26, bond: 20, longBond: 8, reit: 7, gold: 8, cash: 16 },
  "안정-장기-주도-확신": { growthStock: 12, valueStock: 40, longBond: 28, gold: 8, cash: 12 },
  "안정-기회-자동-분산": { growthStock: 8, valueStock: 26, bond: 20, longBond: 6, reit: 5, gold: 15, cash: 20 },
  "안정-기회-자동-확신": { growthStock: 5, valueStock: 25, longBond: 25, gold: 25, cash: 20 },
  "안정-기회-주도-분산": { growthStock: 15, valueStock: 25, bond: 14, longBond: 8, reit: 8, gold: 15, cash: 15 },
  "안정-기회-주도-확신": { growthStock: 12, valueStock: 23, longBond: 20, gold: 25, crypto: 5, cash: 15 },
  "성장-장기-자동-분산": { growthStock: 35, valueStock: 25, bond: 10, longBond: 5, reit: 7, gold: 8, cash: 10 },
  "성장-장기-자동-확신": { growthStock: 50, valueStock: 20, bond: 8, longBond: 4, gold: 8, cash: 10 },
  "성장-장기-주도-분산": { growthStock: 45, valueStock: 22, bond: 8, longBond: 4, reit: 7, gold: 8, cash: 6 },
  "성장-장기-주도-확신": { growthStock: 60, valueStock: 18, longBond: 8, gold: 4, crypto: 5, cash: 5 },
  "성장-기회-자동-분산": { growthStock: 35, valueStock: 20, bond: 6, longBond: 4, reit: 7, gold: 15, crypto: 3, cash: 10 },
  "성장-기회-자동-확신": { growthStock: 45, valueStock: 15, longBond: 8, gold: 15, crypto: 10, cash: 7 },
  "성장-기회-주도-분산": { growthStock: 45, valueStock: 18, bond: 4, longBond: 4, reit: 8, gold: 12, crypto: 5, cash: 4 },
  "성장-기회-주도-확신": { growthStock: 70, valueStock: 5, gold: 5, crypto: 15, cash: 5 },
};

const AXIS_TOOLTIP_TEXTS = {
  안정: "손실과 변동성을 줄이는 것을 우선하며, 채권·배당·현금 같은 완충자산을 중시하는 성향입니다.",
  성장: "변동성을 감수하더라도 장기 수익률과 자산 증식을 더 중시하는 성향입니다.",
  장기: "단기 시세보다 긴 투자기간과 복리 효과를 중요하게 보는 성향입니다.",
  기회: "시장 국면, 가격 변동, 테마 변화에 맞춰 비중 조정 여지를 두는 성향입니다.",
  자동: "예시 프리셋이나 기본 배분을 중심으로 비교적 간편하게 운용하려는 성향입니다.",
  주도: "사용자가 직접 비중과 자산을 조정하며 능동적으로 관리하려는 성향입니다.",
  분산: "여러 자산에 나누어 특정 자산의 충격을 줄이려는 성향입니다.",
  확신: "상대적으로 더 신뢰하는 핵심 자산이나 테마에 높은 비중을 두려는 성향입니다.",
};

const AXIS_CHART_ITEMS = [
  { scoreKey: "returnStyle", left: "안정", right: "성장" },
  { scoreKey: "timeStyle", left: "장기", right: "기회" },
  { scoreKey: "controlStyle", left: "자동", right: "주도" },
  { scoreKey: "concentrationStyle", left: "분산", right: "확신" },
];

const TYPE_STORIES = {
  "안정-장기-자동-분산": {
    overview: "큰 변동을 피하면서 배당, 채권, 현금, 금을 고르게 활용해 장기적으로 포트폴리오를 지키는 유형입니다. 직접 자주 판단하기보다 기본 구조를 유지하며 꾸준히 점검하는 투자자에게 가깝습니다.",
    nameMeaning: "‘수호자’는 손실 방어와 지속 가능성을 우선하는 성향을, ‘차분한’은 자동·분산형의 안정적인 운용 방식을 뜻합니다.",
    designReason: "성장주 비중을 낮게 두고 가치·배당, 종합채권, 현금 비중을 높여 급락장 충격을 완화하는 구조입니다. 여러 완충자산을 함께 두어 특정 자산 하나에 의존하지 않도록 설계했습니다.",
    checks: ["성장주 비중이 너무 낮아 장기 실질수익률이 물가상승률에 밀리지 않는지 확인하세요.", "채권과 현금 비중이 높기 때문에 금리 변화와 재투자 기준을 함께 점검하세요.", "분산자산 수가 많아지면 중복 노출이 생기지 않는지 정기적으로 정리하세요."],
  },
  "안정-장기-자동-확신": {
    overview: "안정적인 장기 운용을 선호하지만, 모든 자산을 넓게 나누기보다는 배당과 장기채 같은 방어 핵심축에 더 무게를 두는 유형입니다.",
    nameMeaning: "‘코어빌더’는 포트폴리오 중심축을 크게 흔들지 않고 쌓아가는 성향을 의미합니다.",
    designReason: "SCHD 성격의 배당자산과 장기국채 비중을 높여 현금흐름과 방어력을 동시에 확보하도록 구성했습니다. 리츠나 블록체인 테마는 제외해 변동성 원인을 줄였습니다.",
    checks: ["배당자산과 장기국채에 집중된 구조이므로 금리 상승기에 가격 변동이 커질 수 있습니다.", "성장자산 최소 비중이 본인의 장기 목표수익률에 충분한지 확인하세요.", "자동 운용에 기대더라도 연 1~2회 목표비중 점검은 필요합니다."],
  },
  "안정-장기-주도-분산": {
    overview: "안정을 우선하되 직접 포트폴리오를 설계하고 조정하려는 유형입니다. 방어자산을 기반으로 하면서도 성장주와 리츠를 일부 활용해 장기 수익 기회를 남겨둡니다.",
    nameMeaning: "‘설계자’는 자산별 역할을 직접 나누고 조정하는 성향을, ‘용의주도한’은 방어 기준을 먼저 세우는 태도를 뜻합니다.",
    designReason: "가치·배당과 채권을 중심으로 하되 성장주, 리츠, 금을 고르게 배치했습니다. 안정형이지만 주도형이므로 시장 상황에 따라 소폭 조정할 여지를 둔 구조입니다.",
    checks: ["직접 조정이 잦아지면 안정형의 장점이 약해질 수 있으므로 리밸런싱 기준을 미리 정하세요.", "리츠와 장기채가 모두 금리 영향을 받을 수 있다는 점을 확인하세요.", "성장주 비중 확대 시 전체 MDD가 어디까지 커지는지 함께 점검하세요."],
  },
  "안정-장기-주도-확신": {
    overview: "손실 관리를 중시하지만 본인이 신뢰하는 방어축에는 과감하게 비중을 싣는 유형입니다. 장기 보유할 핵심 자산을 직접 고르고 관리하는 투자자에 가깝습니다.",
    nameMeaning: "‘철저한 전략가’는 방어 기준과 핵심 비중을 명확히 정한 뒤 원칙적으로 운용하는 성향을 뜻합니다.",
    designReason: "가치·배당 40%와 장기국채 28%를 중심으로 방어축을 압축했습니다. 현금과 금을 보조 완충자산으로 두되 자산 수를 줄여 의사결정 구조를 명확하게 했습니다.",
    checks: ["배당자산과 장기국채 집중도가 높아 특정 국면에서 성과가 둔화될 수 있습니다.", "확신을 둔 자산의 근거가 바뀌면 비중을 다시 점검하세요.", "현금 비중이 낮아지는 시기에는 추가 매수 여력을 별도로 관리하세요."],
  },
  "안정-기회-자동-분산": {
    overview: "시장 기회를 완전히 외면하지는 않지만 성급하게 움직이기보다 현금, 금, 채권 같은 완충자산을 확보한 뒤 관찰하는 유형입니다.",
    nameMeaning: "‘침착한’은 안정 성향과 높은 완충자산 비중을, ‘관찰자’는 기회 성향은 있지만 즉각 매매보다 관망과 대기자금 확보를 선호하는 특징을 뜻합니다.",
    designReason: "성장자산 비중을 낮게 두고 배당, 채권, 금, 현금 비중을 높였습니다. 금 15%와 현금 20%를 통해 급락장이나 시장 기회가 왔을 때 무리하게 따라가기보다 기다렸다가 대응할 수 있게 설계했습니다.",
    checks: ["현금 비중이 높으므로 시장 반등기에 너무 오래 대기하지 않도록 투입 기준을 정하세요.", "금 비중이 높은 만큼 원자재 가격 변동이 전체 성과에 미치는 영향을 확인하세요.", "기회 대응을 하더라도 자동형 기준을 유지할 수 있는 점검 주기를 정하세요."],
  },
  "안정-기회-자동-확신": {
    overview: "공격적인 매매보다는 특정 방어자산과 금을 선별해 기회를 기다리는 유형입니다. 시장이 불안할수록 강점이 드러나지만 상승장에서는 속도가 느릴 수 있습니다.",
    nameMeaning: "‘현명한 선별가’는 많은 자산을 담기보다 방어력이 크다고 보는 자산을 신중하게 고르는 성향을 뜻합니다.",
    designReason: "가치·배당, 장기국채, 금, 현금을 중심으로 단순하게 구성했습니다. 특히 금 25%와 현금 20%를 두어 위기 국면의 방어와 대기성을 강조했습니다.",
    checks: ["금과 현금 비중이 높아 장기 상승장에서는 수익률이 제한될 수 있습니다.", "기회 대응용 현금의 사용 기준과 재충전 기준을 미리 정하세요.", "장기국채와 금의 가격 변동이 동시에 커지는 구간을 확인하세요."],
  },
  "안정-기회-주도-분산": {
    overview: "방어 기준을 유지하면서도 시장 변화에 민첩하게 대응하려는 유형입니다. 여러 자산을 나누어 들고 직접 리스크를 조절하는 투자자에 가깝습니다.",
    nameMeaning: "‘리스크매니저’는 수익보다 먼저 위험 배분과 대응 여력을 점검하는 성향을 표현합니다.",
    designReason: "배당, 채권, 금, 현금, 리츠를 넓게 두고 성장주도 15% 편입했습니다. 직접 운용형이므로 각 자산의 역할을 보며 기회 국면에 비중을 조정할 수 있도록 설계했습니다.",
    checks: ["자산 수가 많아질수록 리밸런싱 기준이 모호해질 수 있으므로 목표비중 범위를 정하세요.", "성장주와 리츠를 늘릴 때 전체 변동성이 어느 정도 커지는지 확인하세요.", "금과 현금은 방어자산이지만 수익 창출 속도가 느릴 수 있습니다."],
  },
  "안정-기회-주도-확신": {
    overview: "안정형이지만 위기나 가격 왜곡 구간에서는 직접 판단으로 방어자산과 테마를 선택하려는 유형입니다. 방어와 선택적 승부가 함께 있는 투자자입니다.",
    nameMeaning: "‘대담한 수비수’는 기본적으로 수비적이지만 필요할 때는 강한 선택을 하는 성향을 뜻합니다.",
    designReason: "금 25%, 장기국채 20%, 현금 15%로 방어축을 크게 두면서 블록체인 테마 5%를 위성자산으로만 제한했습니다. 기회형·주도형의 성격은 살리되 전체 위험은 안정형 수준으로 묶었습니다.",
    checks: ["방어형 포트폴리오 안의 테마자산은 손실 허용 한도를 별도로 정하세요.", "금 비중이 높아질수록 달러, 금리, 실질금리 흐름을 함께 봐야 합니다.", "확신이 강한 자산이 흔들릴 때 감정적 추가매수로 이어지지 않도록 기준을 정하세요."],
  },
  "성장-장기-자동-분산": {
    overview: "성장 기회를 장기적으로 누리되, 자동 운용과 분산을 통해 과도한 판단 부담을 줄이는 유형입니다. 적립식 장기투자자에게 가깝습니다.",
    nameMeaning: "‘꾸준한 개척자’는 성장자산을 향해 나아가지만 속도를 무리하게 높이지 않는 성향을 뜻합니다.",
    designReason: "성장주 35%와 가치·배당 25%를 중심으로 하되 채권, 리츠, 금, 현금을 함께 두었습니다. 성장형이지만 장기 지속 가능성을 위해 완충자산을 40%가량 확보했습니다.",
    checks: ["성장자산 비중이 높아질수록 최대낙폭을 반드시 함께 확인하세요.", "자동 운용이라도 장기 적립 가능 금액과 물가상승률 가정을 점검하세요.", "리츠·금·채권이 실제로 분산 효과를 내는지 상관관계를 확인하세요."],
  },
  "성장-장기-자동-확신": {
    overview: "장기 성장자산에 분명한 믿음을 두되, 운용 방식은 비교적 단순하게 유지하려는 유형입니다. 핵심 성장 ETF 중심 장기 보유자에 가깝습니다.",
    nameMeaning: "‘믿음직한 항해자’는 장기 방향을 믿고 큰 틀을 유지하며 항해하는 투자 성향을 표현합니다.",
    designReason: "성장주 50%를 중심축으로 두고 가치·배당 20%, 채권·금·현금으로 하방을 보완했습니다. 확신형이지만 자동 운용에 맞게 테마자산은 넣지 않고 핵심 성장자산에 집중했습니다.",
    checks: ["성장주 50% 구조는 하락장에서 체감 변동성이 클 수 있습니다.", "장기 보유 전제라면 중간 하락 구간에서 매도하지 않을 기준이 필요합니다.", "채권과 현금 비중이 본인의 위험 감내 수준에 충분한지 확인하세요."],
  },
  "성장-장기-주도-분산": {
    overview: "성장성과 분석적 운용을 함께 추구하면서도 특정 자산에 과도하게 몰리지 않으려는 유형입니다. 포트폴리오를 직접 설계하는 장기 투자자에 가깝습니다.",
    nameMeaning: "‘균형 잡힌 건축가’는 성장 포트폴리오를 직접 짓되 구조적 균형을 유지하는 성향을 뜻합니다.",
    designReason: "성장주 45%와 가치·배당 22%로 수익축을 세우고, 채권·리츠·금·현금으로 보조 구조를 만들었습니다. 직접 운용자가 조정할 수 있도록 여러 자산군을 남겨두었습니다.",
    checks: ["직접 조정 과정에서 성장주 비중이 계획보다 커지지 않는지 확인하세요.", "리츠와 금은 보조 역할이므로 성과가 부진해도 역할 기준으로 평가하세요.", "장기 수익률만 보지 말고 MDD와 BETA를 함께 비교하세요."],
  },
  "성장-장기-주도-확신": {
    overview: "장기 성장에 대한 신념이 강하고 직접 비중을 관리하려는 유형입니다. 소수 성장자산과 테마자산으로 성과 방향을 명확히 만들려는 투자자입니다.",
    nameMeaning: "‘장기 성장 전략가’는 긴 투자기간을 전제로 성장축을 크게 세우고 주도적으로 관리하는 성향을 뜻합니다.",
    designReason: "성장주 60%와 블록체인 테마 5%를 성과동인으로 두고, 가치·배당 18%, 장기국채 8%, 금 4%, 현금 5%로 최소한의 방어축을 남겼습니다.",
    checks: ["성장주 60% 구조는 시장 급락 시 손실 폭이 커질 수 있습니다.", "테마자산은 장기 성장 가설이 깨졌을 때 교체 기준이 필요합니다.", "현금 비중이 낮으므로 추가 매수 여력은 별도로 관리하세요."],
  },
  "성장-기회-자동-분산": {
    overview: "성장과 시장 기회를 모두 열어두지만, 자동 운용과 분산으로 지나친 판단 부담을 낮추는 유형입니다. 여러 성장 기회를 넓게 탐색하는 투자자입니다.",
    nameMeaning: "‘열린 탐험가’는 성장·기회 성향을 가지되 특정 한 방향에만 묶이지 않는 태도를 의미합니다.",
    designReason: "성장주 35%, 가치·배당 20%에 금 15%, 현금 10%, 소량의 블록체인 테마를 더했습니다. 기회형 특성을 금과 현금으로 반영하면서도 자동 운용에 맞게 테마 비중은 낮게 제한했습니다.",
    checks: ["여러 기회를 열어두다 보면 포트폴리오 방향성이 흐려질 수 있습니다.", "금과 현금의 역할이 방어인지 기회 대응인지 미리 정하세요.", "블록체인 테마는 낮은 비중이어도 변동성이 크므로 손실 허용치를 확인하세요."],
  },
  "성장-기회-자동-확신": {
    overview: "시장 기회와 성장 테마를 선호하지만 운용은 단순하게 가져가려는 유형입니다. 핵심 성장자산과 일부 테마자산으로 기회를 반영합니다.",
    nameMeaning: "‘예리한 선구자’는 변화하는 시장 테마를 빠르게 포착하려는 성향을 표현합니다.",
    designReason: "성장주 45%, 블록체인 테마 10%, 금 15%로 성장·기회 성향을 뚜렷하게 반영했습니다. 자동형이므로 채권과 현금을 일부 남겨 급격한 변동을 완화합니다.",
    checks: ["테마자산 비중이 10%이므로 단기 급락 시 전체 성과에 미치는 영향을 확인하세요.", "자동 운용을 유지하려면 테마 교체 기준을 너무 자주 바꾸지 않는 것이 좋습니다.", "금과 장기국채가 하방 완충 역할을 충분히 하는지 점검하세요."],
  },
  "성장-기회-주도-분산": {
    overview: "성장 기회를 적극적으로 찾고 직접 운용하지만, 여러 자산으로 위험을 나누려는 유형입니다. 능동적인 포트폴리오 운용자에 가깝습니다.",
    nameMeaning: "‘능동적인 지휘관’은 시장 변화에 맞춰 자산별 역할을 직접 조정하는 성향을 뜻합니다.",
    designReason: "성장주 45%, 가치·배당 18%에 리츠, 금, 블록체인 테마를 함께 배치했습니다. 공격성과 분산을 동시에 추구하기 때문에 자산군은 넓지만 현금은 낮게 둔 구조입니다.",
    checks: ["현금 비중이 낮아 급락장 대응 여력이 제한될 수 있습니다.", "직접 운용 시 매수·매도 기준이 없으면 과잉 매매로 이어질 수 있습니다.", "테마, 리츠, 금의 역할이 겹치지 않도록 분산 목적을 확인하세요."],
  },
  "성장-기회-주도-확신": {
    overview: "높은 성장성과 시장 기회를 적극적으로 추구하며, 본인이 확신하는 소수 자산에 강하게 집중하는 유형입니다. 가장 공격적인 성향의 투자자입니다.",
    nameMeaning: "‘용감한 승부사’는 큰 변동성을 감수하고 성과동인을 명확히 가져가려는 성향을 직관적으로 표현합니다.",
    designReason: "성장주 70%와 블록체인 테마 15%를 핵심 성과축으로 두었습니다. 금과 현금은 각각 5%만 남겨 최소한의 완충 역할을 하도록 했고, 배당자산 비중은 낮게 제한했습니다.",
    checks: ["급락장에서 손실 폭이 가장 클 수 있으므로 감내 가능한 MDD를 먼저 확인하세요.", "테마자산은 수익 기회와 손실 위험이 모두 크므로 손절·리밸런싱 기준이 필요합니다.", "현금 비중이 낮아 추가 매수 여력과 생활자금은 포트폴리오 밖에서 관리하세요."],
  },
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
  const typeKey = [returnStyle, timeStyle, controlStyle, concentrationStyle].join("-");
  return MBTI_PRESET_MAP[typeKey] || MBTI_PRESET_MAP["성장-장기-주도-분산"];
}

function getTypeName(axes) {
  const typeKey = [axes.returnStyle, axes.timeStyle, axes.controlStyle, axes.concentrationStyle].join("-");
  return MBTI_DISPLAY_NAMES[typeKey] || `${axes.returnStyle} ${axes.timeStyle} ${axes.controlStyle} ${axes.concentrationStyle}형`;
}

function formatAssetWeightList(preset = {}) {
  return Object.entries(preset)
    .filter(([, weight]) => Number(weight || 0) > 0)
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .map(([key, weight]) => `${ASSET_LABELS[key] || key} ${weight}%`)
    .join(" · ");
}

function getTopAssetLabels(preset = {}, count = 2) {
  return Object.entries(preset)
    .filter(([, weight]) => Number(weight || 0) > 0)
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, count)
    .map(([key, weight]) => `${ASSET_LABELS[key] || key} ${weight}%`);
}

function getBufferAssetLabels(preset = {}) {
  return ["bond", "longBond", "gold", "cash", "reit"]
    .filter((key) => Number(preset[key] || 0) > 0)
    .map((key) => `${ASSET_LABELS[key]} ${preset[key]}%`);
}

function buildTypeDetails(axes, preset, riskProfile) {
  const typeKey = [axes.returnStyle, axes.timeStyle, axes.controlStyle, axes.concentrationStyle].join("-");
  const story = TYPE_STORIES[typeKey] || {};
  const coreAssets = getTopAssetLabels(preset, 2);
  const bufferAssets = getBufferAssetLabels(preset);
  return {
    overview: story.overview || `${Object.values(axes).join(" · ")} 성향을 기준으로 포트폴리오를 구성하는 유형입니다.`,
    nameMeaning: story.nameMeaning || "유형명은 투자 성향의 방향성과 운용 방식을 함께 표현한 별칭입니다.",
    designReason: story.designReason || `현재 비중은 ${formatAssetWeightList(preset)} 구조입니다.`,
    coreAssets,
    bufferAssets,
    checks: story.checks || ["목표수익률과 최대낙폭을 함께 확인하세요.", "리밸런싱 기준과 점검 주기를 미리 정하세요.", "본 결과는 참고용이므로 실제 투자 전 본인의 재무상황을 함께 검토하세요."],
    riskProfile,
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
  const details = buildTypeDetails(axes, preset, calculatedRiskProfile);
  const nickname = getTypeName(axes);
  const type = {
    typeId: Object.values(axes).join("-"),
    nickname,
    finpleType: `${axes.returnStyle} ${axes.timeStyle} ${axes.controlStyle} ${axes.concentrationStyle}`,
    riskProfile: calculatedRiskProfile,
    summary: `${Object.values(axes).join(" · ")} 성향을 기반으로 한 참고용 투자 성향입니다.`,
    strengths: details.overview,
    cautions: details.checks[0],
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
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("클립보드 API 복사 실패", error);
    }
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
  } catch (error) {
    console.warn("대체 복사 방식 실패", error);
    return false;
  }
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
    const quantity = Number((assetValue / price).toFixed(4));
    return {
      ...baseAsset,
      id: `mbti-${marketMode.toLowerCase()}-asset-${assetKey}-${Date.now()}-${index}`,
      quantity,
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
    const buttons = Array.from(document.querySelectorAll("button"));
    const bulkLookupButton = buttons.find((button) => String(button.textContent || "").trim() === "전체 조회");
    bulkLookupButton?.click?.();
  }, 900);
}

function saveResultToSimulator(result, marketMode = "US") {
  if (!result?.type) return false;
  const now = new Date().toISOString();
  const id = `mbti-${marketMode.toLowerCase()}-${Date.now()}`;
  const type = result.type;
  const isKrPortfolio = marketMode === "KR";
  const settings = { monthlyCashFlow: type.defaults.monthlyContribution, years: type.defaults.years, dividendReinvest: true, inflationRate: type.defaults.inflationRate };
  const assets = buildAssetsFromPreset(type.preset, 50000000, marketMode);
  const portfolioName = type.nickname;
  const portfolio = { id, name: portfolioName, settings, assets, updatedAt: now, source: isKrPortfolio ? "investment-mbti-kr" : "investment-mbti", mbti: { typeId: type.typeId, nickname: type.nickname, finpleType: type.finpleType, riskProfile: result.calculatedRiskProfile, marketMode } };

  try {
    const currentList = JSON.parse(localStorage.getItem(PORTFOLIO_STORAGE_KEY) || "[]");
    const nextList = [portfolio, ...(Array.isArray(currentList) ? currentList.filter((item) => item?.id !== id) : [])];
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(nextList));
    localStorage.setItem(ACTIVE_PORTFOLIO_STORAGE_KEY, id);
    localStorage.setItem(GLOBAL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ portfolioList: nextList, activePortfolioId: id, activePortfolio: portfolio, assets, settings, globalSettings: settings, updatedAt: now }));
    localStorage.setItem(MBTI_PRESET_STORAGE_KEY, JSON.stringify({ typeId: type.typeId, nickname: type.nickname, finpleType: type.finpleType, riskProfile: result.calculatedRiskProfile, marketMode, portfolioPreset: type.preset, preset: type.preset, summary: type.summary, strengths: type.strengths, cautions: type.cautions, actions: type.actions, details: type.details, simulatorDefaults: type.defaults, createdAt: now }));
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

  function applyToSimulator(marketMode = "US") {
    const saved = saveResultToSimulator(result, marketMode);
    onNavigate?.("personal");
    if (saved) scheduleSimulatorAutoLookup();
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
        <MbtiResult result={result} onReset={resetTest} onApplyUs={() => applyToSimulator("US")} onApplyKr={() => applyToSimulator("KR")} />
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

function AxisTooltip({ label }) {
  const tooltipText = AXIS_TOOLTIP_TEXTS[label];
  return (
    <span className="investmentMbtiAxisTerm" data-tooltip={tooltipText}>
      <span>{label}</span>
      <button type="button" aria-label={`${label} 설명`} title={tooltipText}>?</button>
    </span>
  );
}

function AxisScoreChart({ result }) {
  return (
    <article className="investmentMbtiPanel investmentMbtiAxisPanel">
      <div className="investmentMbtiPanelHeader">
        <div><p className="sectionLabel">Step 2</p><h3>성향 차트</h3></div>
        <span>-6 · 0 · +6</span>
      </div>
      <p className="investmentMbtiAxisGuide">각 축의 3개 문항 합산 점수입니다. 0 이하이면 왼쪽 성향, 0 초과이면 오른쪽 성향으로 판정됩니다.</p>
      <div className="investmentMbtiAxisRows">
        {AXIS_CHART_ITEMS.map(({ scoreKey, left, right }) => {
          const score = Math.max(-6, Math.min(6, Number(result.axisScores?.[scoreKey] || 0)));
          const markerPosition = ((score + 6) / 12) * 100;
          return (
            <div key={scoreKey} className="investmentMbtiAxisRow">
              <div className="investmentMbtiAxisLabels">
                <AxisTooltip label={left} />
                <strong>{score > 0 ? right : left}</strong>
                <AxisTooltip label={right} />
              </div>
              <div className="investmentMbtiAxisTrack" aria-label={`${left}-${right} 점수 ${score}`}>
                <span>-</span><i /><span>0</span><i /><span>+</span>
                <b style={{ left: `${markerPosition}%` }}>{score > 0 ? `+${score}` : score}</b>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function TypeOverviewPanel({ type }) {
  return (
    <article className="investmentMbtiPanel investmentMbtiStoryPanel">
      <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 3</p><h3>유형 개요</h3></div></div>
      <p>{type.details.overview}</p>
      <div className="investmentMbtiMiniGrid">
        <div><strong>왜 이런 이름인가요?</strong><p>{type.details.nameMeaning}</p></div>
        <div><strong>어떤 투자자에게 가까운가요?</strong><p>{type.finpleType} 성향이 함께 나타나며, 위험성향은 {type.riskProfile}에 가깝습니다.</p></div>
      </div>
    </article>
  );
}

function PortfolioDesignPanel({ type }) {
  return (
    <article className="investmentMbtiPanel investmentMbtiStoryPanel">
      <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 4</p><h3>포트폴리오 설계 이유</h3></div></div>
      <p>{type.details.designReason}</p>
      <div className="investmentMbtiMiniGrid">
        <div><strong>핵심 자산</strong><p>{type.details.coreAssets.join(" · ") || "핵심 자산을 산정 중입니다."}</p></div>
        <div><strong>완충 자산</strong><p>{type.details.bufferAssets.join(" · ") || "완충 자산 비중이 낮은 공격형 구조입니다."}</p></div>
      </div>
    </article>
  );
}

function PortfolioPresetPanel({ type, entries, presetTotal, onApplyUs, onApplyKr }) {
  return (
    <article className="investmentMbtiPanel">
      <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 5</p><h3>예시 포트폴리오 프리셋</h3></div><span>합계 {presetTotal}%</span></div>
      <div className="investmentMbtiPortfolioBars">
        {entries.map(([key, value]) => (
          <div key={key} className="investmentMbtiPortfolioRow"><div className="investmentMbtiPortfolioLabel"><strong>{ASSET_LABELS[key] || key}</strong><span>{value}%</span></div><div className="investmentMbtiBarTrack"><i style={{ width: `${value}%` }} /></div></div>
        ))}
      </div>
      <div className="investmentMbtiPresetActions" data-finple-market-choice="ready">
        <button type="button" onClick={onApplyUs}>미국형으로 반영</button>
        <button type="button" onClick={onApplyKr}>한국형으로 반영</button>
      </div>
    </article>
  );
}

function CheckpointsPanel({ type }) {
  return (
    <article className="investmentMbtiPanel">
      <div className="investmentMbtiPanelHeader"><div><p className="sectionLabel">Step 6</p><h3>점검 포인트</h3></div></div>
      <ul>{type.details.checks.map((action) => <li key={action}>{action}</li>)}</ul>
    </article>
  );
}

function MbtiResult({ result, onReset, onApplyUs, onApplyKr }) {
  const [exportStatusMessage, setExportStatusMessage] = useState("");
  const type = result.type;
  const entries = Object.entries(type.preset);
  const presetTotal = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const hasCrypto = Number(type.preset.crypto || 0) > 0;

  async function handleShareResult() {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/mbti` : "https://finple.co.kr/mbti";
    const shareText = [
      `저의 FINPLE 투자 MBTI는 “${type.nickname}”입니다.`,
      "",
      `성향: ${Object.values(result.axes).join(" · ")}`,
      `FINPLE 유형: ${type.finpleType}`,
      `위험성향: ${result.calculatedRiskProfile}`,
      "",
      "FINPLE에서 나의 투자 성향도 확인해보세요.",
      "본 결과는 투자 성향 이해를 돕기 위한 참고용이며, 특정 금융상품의 매수·매도 권유가 아닙니다.",
    ].join("\n");
    const copyText = `${shareText}\n${shareUrl}`;
    setExportStatusMessage("공유 문구를 복사 중입니다.");

    try {
      const copied = await copyTextToClipboard(copyText);
      if (copied) {
        setExportStatusMessage("공유 문구와 링크를 복사했습니다.");
        return;
      }

      if (typeof window !== "undefined") {
        window.prompt("아래 공유 문구를 복사해 주세요.", copyText);
        setExportStatusMessage("자동 복사가 제한되어 수동 복사 창을 열었습니다.");
        return;
      }

      setExportStatusMessage("이 브라우저에서는 공유 기능을 사용할 수 없습니다.");
    } catch (error) {
      if (typeof window !== "undefined") {
        window.prompt("아래 공유 문구를 복사해 주세요.", copyText);
        setExportStatusMessage("자동 복사가 제한되어 수동 복사 창을 열었습니다.");
        return;
      }

      setExportStatusMessage("공유 기능을 사용할 수 없어 문구 복사를 다시 시도해 주세요.");
    }
  }

  function handlePdfSave() {
    setExportStatusMessage("브라우저 인쇄 창에서 PDF로 저장할 수 있습니다.");
    window.setTimeout(() => window.print(), 80);
  }

  return (
    <section className="investmentMbtiResultPage">
      <div className="investmentMbtiResultHero"><p className="sectionLabel">Step 1 · Investment MBTI Result</p><h1>당신의 FINPLE 투자 MBTI는<br />{type.nickname}입니다.</h1><p>{type.summary}</p></div>
      <div className="investmentMbtiResultGrid">
        <article className="investmentMbtiCard primaryResultCard"><span>FINPLE 유형</span><strong>{type.finpleType}</strong><p>{Object.values(result.axes).join(" · ")}</p></article>
        <article className="investmentMbtiCard"><span>위험성향</span><strong>{result.calculatedRiskProfile}</strong><p>위험성향 점수 {result.riskScore}</p></article>
        <article className="investmentMbtiCard"><span>기본 조건</span><strong>{type.defaults.years}년</strong><p>월 투자금 {formatWon(type.defaults.monthlyContribution)}원</p></article>
      </div>
      <AxisScoreChart result={result} />
      <TypeOverviewPanel type={type} />
      <PortfolioDesignPanel type={type} />
      <PortfolioPresetPanel type={type} entries={entries} presetTotal={presetTotal} onApplyUs={onApplyUs} onApplyKr={onApplyKr} />
      <CheckpointsPanel type={type} />
      <article className="investmentMbtiNotice resultNotice"><strong>Step 7 · 투자 유의사항</strong><p>본 결과는 참고용 성향 진단과 예시 포트폴리오입니다. 특정 종목이나 ETF의 매수·매도 추천이 아니며, 실제 투자 결정과 그 결과에 대한 책임은 사용자 본인에게 있습니다.</p>{hasCrypto ? <p>블록체인 테마 등 고변동성 위성자산은 가격 변동과 손실 가능성이 매우 크므로 전체 자산 대비 제한적인 비중으로만 검토하는 것이 좋습니다.</p> : null}</article>
      <div className="investmentMbtiShareActions" aria-label="결과 공유 및 저장">
        <button type="button" onClick={handleShareResult}>SNS 공유</button>
        <button type="button" onClick={handlePdfSave}>PDF 저장</button>
        <button type="button" className="secondaryMbtiButton" onClick={onReset}>다시 검사하기</button>
      </div>
      {exportStatusMessage ? <p className="investmentMbtiExportStatus">{exportStatusMessage}</p> : null}
    </section>
  );
}

export default InvestmentMbtiPage;
