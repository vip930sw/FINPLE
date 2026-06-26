# FINPLE Scenario Analysis Implementation Plan

작성일: 2026-06-26  
대상 저장소: `vip930sw/FINPLE`  
단계: Step 114 구현계획  
상태: 구현 전

## 1. 구현 목표

FINPLE의 현재 CAGR 기반 장기 전망을 유지하면서 다음 기능을 단계적으로 추가한다.

```text
1. 시장 벤치마크 기준선
2. 월간 실제 수익률 기반 포트폴리오 경로
3. 하락확률·손실규모·MDD·회복기간
4. P10/P50/P90 확률 밴드
5. 시장충격 기반 스트레스 테스트
6. AI 분석용 검증된 시나리오 요약
```

첫 구현에서 미래수익률 예측 모델이나 생성형 AI를 사용하지 않는다.

```text
통계 계산 엔진이 숫자를 생성
AI는 검증된 숫자를 해석
```

---

## 2. 현재 코드 감사 결과

## 2.1 현재 결정론적 계산

현재 핵심 계산은 다음 파일에 있다.

```text
src/components/portfolio/utils/portfolioCalculations.js
```

`calculatePortfolioResult(settings, assets)`는 다음 방식으로 동작한다.

```text
expectedCagr = 자산별 CAGR 비중가중평균
expectedBeta = 자산별 BETA 비중가중평균
simpleMdd = 자산별 MDD 비중가중평균
```

연차별 성과는 매년 동일한 `expectedCagr`을 적용한다.

```text
baseForGrowth
= 전년도 평가금액
+ 연간 납입금
+ 배당재투자액

annualProfit
= baseForGrowth × expectedCagr
```

따라서 현재 `performanceRows`는 자연스럽게 단조로운 복리 경로가 된다.

## 2.2 현재 비교차트

현재 비교차트는 다음 파일에 있다.

```text
src/components/portfolio/components/PortfolioCompareLineChart.jsx
```

현재 차트는 각 포트폴리오의 다음 값을 polyline으로 표시한다.

```text
portfolio.result.performanceRows[].inflationAdjustedValue
```

즉, 차트 자체가 수익률 시나리오를 만드는 것이 아니라 `portfolioCalculations.js`가 만든 결정론적 연차별 값을 그대로 그린다.

## 2.3 현재 연결 구조

```text
PortfolioSimulator.jsx
→ ComparePanel.jsx
→ PortfolioCompareLineChart.jsx
```

현재 `ComparePanel`은 다음 두 데이터를 받는다.

```text
insightComparisonPortfolios
chartComparisonPortfolios
```

시나리오 기능은 기존 결과 객체를 덮어쓰지 않고 별도 상태와 별도 응답 계약으로 연결한다.

---

## 3. 가장 중요한 선행조건

현재 자산별 요약 CSV의 `CAGR / BETA / MDD / 배당률`만으로는 신뢰할 수 있는 확률 시나리오를 만들 수 없다.

반드시 필요한 데이터:

```text
자산별 월말 가격 또는 월간 수익률
배당 포함 여부
벤치마크 월간 수익률
통화 또는 환율 월간 수익률
거래일 또는 월 기준 timestamp
데이터 시작일·종료일
지수 대체 여부
```

데이터 등급을 다음처럼 구분한다.

| 등급 | 데이터 | 제공 기능 |
|---|---|---|
| A | 자산별 월간 총수익 시계열 | 전체 확률 시나리오 |
| B | 자산별 가격 시계열 또는 신뢰 가능한 proxy | 제한된 확률 시나리오 |
| C | CAGR/BETA/MDD 요약값만 존재 | 기준 CAGR 전망만 제공 |

UI에서 C등급 자산을 포함한 포트폴리오에 확률값을 임의 생성하지 않는다.

---

## 4. 권장 아키텍처

## 4.1 계산 책임 분리

```text
기존 프론트 계산
calculatePortfolioResult()
→ 기준 CAGR 전망 전담

신규 시나리오 백엔드
portfolioScenarioService
→ 시계열·확률·스트레스 계산 전담

AI 분석
→ 시나리오 결과 해석 전담
```

## 4.2 권장 파일 구조

```text
server/src/routes/portfolioScenarioRoutes.js
server/src/services/scenario/
├─ scenarioInputValidator.js
├─ marketDataRepository.js
├─ benchmarkPolicy.js
├─ portfolioReturnEngine.js
├─ rollingRiskMetrics.js
├─ blockBootstrapEngine.js
├─ stressScenarioEngine.js
├─ scenarioSummaryBuilder.js
└─ scenarioResultValidator.js

src/components/portfolio/services/scenarioAnalysisService.js
src/components/portfolio/components/ScenarioModeSelector.jsx
src/components/portfolio/components/ScenarioSummaryCards.jsx
src/components/portfolio/components/ScenarioBandChart.jsx
src/components/portfolio/components/ScenarioDrawdownChart.jsx
src/components/portfolio/components/BenchmarkPolicyNote.jsx
```

MVP에서 모든 컴포넌트를 한 번에 만들지 않는다. PR 단위로 분할한다.

## 4.3 백엔드 사용 이유

- 10,000회 경로 생성 시 브라우저 메인 스레드 렉 방지
- 데이터 원본과 라이선스 보호
- 동일 입력에 동일한 정책 적용
- 분석 버전과 파라미터 기록
- 서버 캐시 적용
- 사용량 제한과 플랜 권한 적용

로컬 개발 또는 초기 실험에서는 Python notebook을 사용해도 되지만, 운영 API는 기존 Node/Render 백엔드에 맞춘다.

---

## 5. 데이터 모델

## 5.1 자산 월간 수익률 레코드

```json
{
  "ticker": "QQQ",
  "market": "US",
  "currency": "USD",
  "month": "2025-12-31",
  "priceReturn": 0.0214,
  "totalReturn": 0.0221,
  "dataSource": "provider_name",
  "isProxy": false,
  "proxyTicker": null
}
```

## 5.2 벤치마크 정책

```json
{
  "benchmarkId": "SP500_TR",
  "label": "S&P 500 Total Return",
  "market": "US",
  "currency": "USD",
  "betaReference": 1.0,
  "staticNominalCagr": 0.09,
  "staticCagrStatus": "provisional",
  "returnBasis": "total_return",
  "updatedAt": "2026-06-26"
}
```

한국 정책 예시:

```json
{
  "benchmarkId": "KOSPI200_TR",
  "label": "KOSPI 200 Total Return",
  "market": "KR",
  "currency": "KRW",
  "betaReference": 1.0,
  "staticNominalCagr": 0.065,
  "staticCagrStatus": "provisional",
  "returnBasis": "total_return"
}
```

정책값은 코드에 산재시키지 않고 한 파일 또는 DB 테이블에서 관리한다.

## 5.3 분석 실행 메타데이터

```json
{
  "analysisVersion": "scenario-v0.1",
  "method": "joint_block_bootstrap",
  "simulationCount": 10000,
  "blockMonths": 12,
  "rebalanceFrequency": "annual",
  "returnBasis": "total_return",
  "currencyMode": "KRW",
  "inflationRate": 0.02,
  "randomSeed": 20260626,
  "dataStart": "2006-01-31",
  "dataEnd": "2026-05-31"
}
```

재현 가능한 테스트를 위해 `randomSeed`를 저장한다.

---

## 6. API 계약

## 6.1 확률 시나리오 요청

```http
POST /api/portfolio/scenario-analysis
```

```json
{
  "portfolioId": "portfolio-1",
  "assets": [
    { "ticker": "QQQ", "market": "US", "weight": 0.4 },
    { "ticker": "SCHD", "market": "US", "weight": 0.3 },
    { "ticker": "TLT", "market": "US", "weight": 0.2 },
    { "ticker": "GLD", "market": "US", "weight": 0.1 }
  ],
  "settings": {
    "startValue": 10000000,
    "monthlyCashFlow": 1000000,
    "years": 10,
    "inflationRate": 0.02,
    "dividendReinvest": true,
    "currencyMode": "KRW",
    "rebalanceFrequency": "annual"
  },
  "scenario": {
    "method": "joint_block_bootstrap",
    "simulationCount": 10000,
    "blockMonths": 12,
    "percentiles": [0.1, 0.5, 0.9],
    "randomSeed": 20260626
  },
  "benchmark": {
    "mode": "auto",
    "include": true
  }
}
```

## 6.2 확률 시나리오 응답

```json
{
  "ok": true,
  "analysisVersion": "scenario-v0.1",
  "status": "ready",
  "dataQuality": {
    "grade": "B",
    "coverageRatio": 0.96,
    "dataYears": 18.4,
    "warnings": []
  },
  "benchmark": {
    "id": "SP500_TR",
    "label": "S&P 500 Total Return",
    "marketWeights": { "US": 1, "KR": 0 },
    "beta": 1
  },
  "lossMetrics": {
    "rolling12mLossProbability": 0.26,
    "loss10Probability": 0.13,
    "loss20Probability": 0.05,
    "averageLossWhenNegative": -0.118,
    "medianLossWhenNegative": -0.094,
    "worstRolling12m": -0.324
  },
  "drawdownMetrics": {
    "historicalMdd": -0.362,
    "simulatedMddP50": -0.187,
    "mdd20Probability": 0.44,
    "mdd30Probability": 0.19,
    "medianRecoveryMonths": 14
  },
  "terminalValue": {
    "p10": 260000000,
    "p50": 410000000,
    "p90": 580000000
  },
  "series": {
    "years": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "p10RealValue": [],
    "p50RealValue": [],
    "p90RealValue": [],
    "contribution": [],
    "deterministicBaseline": [],
    "benchmarkP50": []
  },
  "meta": {
    "method": "joint_block_bootstrap",
    "simulationCount": 10000,
    "blockMonths": 12,
    "returnBasis": "total_return",
    "currencyMode": "KRW",
    "dataStart": "2006-01-31",
    "dataEnd": "2026-05-31"
  }
}
```

## 6.3 제공 보류 응답

```json
{
  "ok": true,
  "status": "insufficient_data",
  "dataQuality": {
    "grade": "C",
    "coverageRatio": 0.42,
    "dataYears": 2.8,
    "warnings": ["SHORT_HISTORY", "MISSING_MONTHLY_SERIES"]
  },
  "allowedModes": ["deterministic"],
  "message": "월간 가격 이력이 부족하여 확률 시나리오를 제공하지 않습니다."
}
```

## 6.4 스트레스 테스트 요청

```http
POST /api/portfolio/stress-test
```

```json
{
  "assets": [
    { "ticker": "QQQ", "weight": 0.4, "beta": 1.2 },
    { "ticker": "SCHD", "weight": 0.3, "beta": 0.8 },
    { "ticker": "TLT", "weight": 0.2, "beta": -0.1 },
    { "ticker": "GLD", "weight": 0.1, "beta": 0.05 }
  ],
  "shock": {
    "equityMarketReturn": -0.2,
    "rateChangePctPoint": null,
    "fxReturn": null
  },
  "benchmark": "SP500_TR"
}
```

## 6.5 스트레스 테스트 응답

```json
{
  "ok": true,
  "marketShock": -0.2,
  "portfolioBeta": 0.705,
  "betaImpliedReturn": -0.141,
  "estimatedRange": {
    "low": -0.19,
    "center": -0.158,
    "high": -0.12
  },
  "limitations": [
    "금리·환율·자산 고유충격은 MVP 범위에서 제한적으로 반영됩니다."
  ]
}
```

---

## 7. 계산 엔진 상세

## 7.1 수익률 시계열 정렬

1. 모든 자산의 월말 timestamp를 통일한다.
2. 공통 관측기간을 산출한다.
3. 결측월 처리 규칙을 적용한다.
4. 동일 월 자산수익률 벡터를 만든다.
5. 비중으로 포트폴리오 월수익률을 계산한다.

결측값을 0% 수익률로 임의 대체하지 않는다.

## 7.2 리밸런싱

MVP:

```text
annual
none
```

연 1회 리밸런싱은 각 연도 첫 유효월에 목표비중으로 복원한다.

## 7.3 투자위험 NAV

```text
NAV(0) = 100
NAV(t) = NAV(t-1) × (1 + Rp(t))
```

현금 유입을 제외한다.

## 7.4 평가금액 경로

월 납입금을 반영한다.

납입 시점 정책을 명시한다.

```text
MVP 기본: 월초 납입 후 월수익률 적용
```

```text
value(t)
= (value(t-1) + monthlyContribution) × (1 + Rp(t))
```

배당재투자 여부는 수익률 데이터 기준과 일치시킨다.

- Total Return 시계열: 배당재투자 이미 포함
- Price Return 시계열: 별도 배당 처리 가능

중복 반영을 금지한다.

## 7.5 실질가치

```text
realValue(t)
= nominalValue(t) / (1 + annualInflation)^(t / 12)
```

## 7.6 Block Bootstrap

1. 공통 월간 수익률 행렬을 준비한다.
2. 12개월 연속 블록 시작점을 무작위 선택한다.
3. 모든 자산의 동일 블록을 함께 추출한다.
4. 목표 개월 수까지 블록을 연결한다.
5. 경로별 포트폴리오 NAV와 평가금액을 계산한다.
6. 10,000회 결과의 분위수를 집계한다.

## 7.7 시장 스트레스

MVP:

```text
assetShock(i)
= beta(i) × marketShock
+ residualShock(i)
```

초기 residualShock은 과거 회귀 잔차 분포의 분위수 또는 보수적 범위로 처리한다.

과거 실제 경로 기반 확률 시나리오에는 이 공식을 추가 적용하지 않는다.

---

## 8. 벤치마크 자동선택

## 8.1 시장 분류

자산별 시장 비중을 합산한다.

```text
US weight
KR weight
other weight
```

정책 예시:

```text
US ≥ 80% → SP500_TR
KR ≥ 80% → KOSPI200_TR
US와 KR 혼합 → 합성 벤치마크
기타시장 비중이 큼 → 사용자 선택 또는 제공 제한
```

## 8.2 합성 벤치마크

월별 시장수익률을 가중합산한다.

```text
Rbench(t)
= wUS × RSP500(t)
+ wKR × RKOSPI200(t)
```

정적 CAGR만 가중평균하지 않는다.

## 8.3 통화 모드

```text
local
KRW
```

`KRW` 모드에서는 미국 지수·자산 수익률에 원·달러 환율 수익률을 결합한다.

시계열의 통화 기준을 응답에 반드시 포함한다.

---

## 9. 프론트 UI 구현

## 9.1 Compare chart 확장

현재 파일:

```text
src/components/portfolio/components/PortfolioCompareLineChart.jsx
```

직접 대규모 수정하기보다 wrapper 또는 신규 chart 컴포넌트로 분리한다.

권장 구조:

```text
PortfolioCompareLineChart.jsx
→ 기존 기준 전망 전담

PortfolioCompareScenarioSection.jsx
→ 모드 선택·API 상태·차트 교체

ScenarioBandChart.jsx
→ P10/P50/P90
```

## 9.2 상태

```text
idle
loading
ready
insufficient_data
error
stale
```

포트폴리오 구성이나 설정이 변경되면 기존 결과를 즉시 삭제하기보다 `stale`로 표시하고 재분석 버튼을 제공한다.

## 9.3 토글

```text
기준 전망
시장 비교
확률 시나리오
스트레스 테스트
```

MVP에서는 다음 순서로 공개한다.

```text
기준 전망
→ 시장 비교
→ 확률 시나리오
→ 스트레스 테스트
```

## 9.4 접근성

- SVG에 의미 있는 `aria-label`
- 색상만으로 P10/P50/P90 구분하지 않음
- 툴팁 키보드 접근
- 모바일에서 표형 요약 제공
- 확률값에 소수점 과다 노출 금지

---

## 10. 캐시와 사용량

## 10.1 캐시 키

```text
hash(
  asset ticker + weight
  settings
  method
  benchmark
  currencyMode
  dataVersion
  analysisVersion
)
```

## 10.2 캐시 기간

```text
월간 데이터 변경 전: 24시간 이상 가능
데이터 버전 갱신 시: 자동 무효화
```

## 10.3 플랜 제한

Free:

```text
낮은 simulationCount
제한된 기간
기본 벤치마크
결과 저장 불가 또는 제한
```

Personal:

```text
10,000회
다중 기간
환율 기준
스트레스 강도
저장·PDF
```

플랜에 따라 확률의 품질이 달라지는 것처럼 보이지 않도록 주의한다. Free는 기능범위를 제한하고 계산 정확도를 의도적으로 낮추지 않는다.

---

## 11. 검증 기준

## 11.1 수학 단위 테스트

```text
수익률 0% 경로 → NAV 100 유지
수익률 -10% → NAV 90
고점 120, 저점 90 → MDD -25%
물가 0% → 명목값과 실질값 동일
BETA 1, 시장 -20% → betaImpliedReturn -20%
```

## 11.2 경로 테스트

```text
고정 +1% 월수익률
고정 -1% 월수익률
상승 후 급락
급락 후 완전 회복
회복하지 못한 경로
```

## 11.3 Bootstrap 테스트

- 고정 seed에서 동일 결과
- 자산 간 같은 블록 추출 확인
- 10,000회 결과 분위수 정렬 확인
- P10 ≤ P50 ≤ P90
- 확률은 0~1 범위

## 11.4 BETA 중복 방지 테스트

```text
bootstrap mode → betaMultiplier 미사용
factor mode → betaMultiplier 사용
```

시나리오 메타데이터에 `betaApplied`를 기록한다.

## 11.5 통화 테스트

- 환율 0%이면 USD와 KRW 수익률 동일
- 미국 +10%, 환율 +5%이면 KRW 약 +15.5%
- 혼합 자산의 통화 변환 순서 확인

## 11.6 회귀 테스트

기존 `calculatePortfolioResult()` 결과는 시나리오 기능 추가 전후 동일해야 한다.

```text
기존 STEP 1 입력
기존 STEP 2 카드
기존 기준 전망 차트
기존 STEP 3 지표
기존 PDF
```

---

## 12. 단계별 개발순서

## Step 114-1A 데이터 소스 감사

목표:

```text
월간 가격·총수익·벤치마크·환율 데이터 보유 여부 확인
```

산출물:

```text
docs/portfolio-ml/FINPLE_SCENARIO_DATA_INVENTORY.md
data/processed/scenario_data_coverage.csv
```

완료 기준:

- 자산별 데이터 시작일·종료일
- 가격/총수익 구분
- proxy 여부
- 환율 여부
- 시나리오 제공 가능 등급

## Step 114-1B 순수 계산 유틸리티

```text
monthly return alignment
portfolio return
NAV
MDD
recovery months
rolling loss metrics
```

UI와 API 연결 없이 단위 테스트부터 작성한다.

## Step 114-1C 벤치마크 정책

```text
SP500_TR
KOSPI200_TR
혼합 벤치마크
정적 CAGR 임시값
통화 기준
```

## Step 114-2A 과거 Rolling 분석

Bootstrap 이전에 실제 과거 시작월별 1년·3년·5년·10년 결과를 계산한다.

## Step 114-2B 공동 Block Bootstrap

```text
12개월 블록
10,000회
P10/P50/P90
MDD 분포
```

## Step 114-2C 시나리오 API

```text
POST /api/portfolio/scenario-analysis
validation
cache
usage limit
```

## Step 114-3A 시장 비교선 UI

현재 Compare chart에 시장 비교 모드를 추가한다.

- S&P 500 TR
- KOSPI 200 TR
- 혼합 벤치마크
- 기준 정책 표시

## Step 114-3B 확률 밴드 UI

- P10/P50/P90
- 누적 납입금
- 결정론적 기준선
- loading/error/insufficient 상태

## Step 114-3C 위험 카드와 Drawdown

- 손실확률
- 손실규모
- MDD 확률
- 회복기간
- NAV / Drawdown 차트

## Step 114-4A 스트레스 테스트 엔진

- 시장 -10/-20/-30%
- BETA 적용
- residual range
- 중복 반영 방지

## Step 114-4B 스트레스 UI

- 충격 선택
- 시장 vs 포트폴리오
- 결과 범위
- 한계 고지

## Step 114-5A AI 분석 연결

AI 요청 payload에 숫자 원문 대신 검증된 요약 객체를 전달한다.

```json
{
  "scenarioSummary": {
    "lossProbability12m": 0.26,
    "simulatedMddP50": -0.187,
    "mdd30Probability": 0.19,
    "medianRecoveryMonths": 14,
    "benchmark": "SP500_TR",
    "dataQualityGrade": "B"
  }
}
```

AI는 숫자를 재계산하지 않는다.

## Step 114-5B 운영 안정화

- 데이터 버전
- 캐시
- 사용량
- 오류 로그
- 분석 재현성
- 정책 문구
- PDF 저장

---

## 13. PR 분할안

```text
PR 1  문서와 데이터 인벤토리
PR 2  순수 위험 계산 유틸리티 + 테스트
PR 3  벤치마크 정책 + 시장 데이터 repository
PR 4  Rolling 분석 baseline
PR 5  Block Bootstrap engine
PR 6  Scenario API + validator + cache
PR 7  시장 비교선 UI
PR 8  확률 밴드 UI
PR 9  위험 카드·Drawdown UI
PR 10 Stress engine
PR 11 Stress UI
PR 12 AI 분석 연결
PR 13 운영 안정화·문서화
```

한 PR에서 기존 `portfolioCalculations.js`, 비교차트, 백엔드 API를 동시에 대규모 변경하지 않는다.

---

## 14. 구현 금지사항

```text
CAGR만으로 임의의 확률분포 생성
자산별 손실확률 단순 가중평균
자산별 MDD 단순 가중값을 시나리오 MDD로 표시
Bootstrap 결과에 BETA를 다시 곱함
월 납입금을 MDD 계산에 포함
가격 CAGR에 배당률을 다시 더함
단일 랜덤 경로를 미래 예측선으로 표시
한국·미국 시장에 같은 CAGR 적용
혼합 벤치마크 CAGR 단순 가중평균
데이터 3년 미만 자산에 정밀 확률 표시
```

---

## 15. 최종 완료 기준

```text
1. 기존 기준 CAGR 계산 결과가 보존됨
2. 시장 비교선이 동일 투자조건으로 표시됨
3. 확률 밴드가 재현 가능한 계산에서 생성됨
4. 손실확률·손실규모·MDD·회복기간이 분리됨
5. Bootstrap과 BETA Factor 방식이 분리됨
6. 한국·미국·혼합 벤치마크가 지원됨
7. 가격/총수익·환율 기준이 화면에 표시됨
8. 데이터 부족 시 제공 보류됨
9. 모바일·접근성·오류 상태가 검증됨
10. AI가 숫자를 재계산하지 않음
11. 테스트와 분석 버전이 남음
12. 사용자 고지가 표시됨
```
