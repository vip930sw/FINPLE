# FINPLE Scenario Analysis Codex Handoff

작성일: 2026-06-26  
대상 저장소: `vip930sw/FINPLE`  
단계: Step 114 구현 인수인계  
상태: 첫 작업 시작 전

## 1. 작업 목적

FINPLE의 기존 CAGR 기반 장기 전망을 유지하면서, 별도의 `시나리오 분석` 계층을 추가한다.

이 기능은 다음을 계산한다.

```text
시장 벤치마크 비교
Rolling 손실확률
손실 발생 시 평균 하락률
포트폴리오 실제 시계열 MDD
회복기간
P10/P50/P90 평가금액 범위
시장충격 기반 스트레스 테스트
```

AI 또는 LLM이 숫자를 만들지 않는다.

```text
통계 엔진 → 숫자 계산
validator → 계약과 범위 검증
AI 분석 → 검증된 숫자 해설
```

---

## 2. 반드시 먼저 읽을 문서

```text
docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md
docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md
docs/portfolio-ml/FINPLE_PORTFOLIO_ML_AI_ANALYSIS_DEVELOPMENT_NOTE.md
docs/portfolio-ml/FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md
```

기존 AI/ML 진행상황과 충돌하지 않도록 다음 문서도 확인한다.

```text
docs/portfolio-ml/README.md
docs/portfolio-ml/FINPLE_AI_ML_PROGRESS_2026_06_25.md
docs/portfolio-ml/FINPLE_AI_ANALYSIS_MOCK_API_CONNECTION.md
```

---

## 3. 현재 코드 기준점

### 결정론적 계산

```text
src/components/portfolio/utils/portfolioCalculations.js
```

현재 `calculatePortfolioResult()`는 자산별 CAGR, BETA, MDD, 배당률을 비중가중평균하고, 매년 동일 CAGR을 적용해 `performanceRows`를 만든다.

이 함수는 기존 서비스 기준선이므로 첫 작업에서 변경하지 않는다.

### Compare 화면

```text
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/ComparePanel.jsx
src/components/portfolio/components/PortfolioCompareLineChart.jsx
```

현재 비교차트는 다음 값을 그린다.

```text
portfolio.result.performanceRows[].inflationAdjustedValue
```

첫 작업에서는 UI를 수정하지 않는다.

### STEP 3 상세분석

```text
src/components/portfolio/components/DetailPanel.jsx
```

현재 MDD는 `simpleMdd`, BETA는 `expectedBeta`로 표시된다. 시나리오 결과를 기존 값에 덮어쓰지 않는다.

### STEP 4 AI 분석

```text
src/components/portfolio/components/AiAnalysisPanel.jsx
server/src/routes 또는 AI analysis 관련 backend 파일
```

시나리오 계산 완료 전 AI payload에 임의 확률값을 추가하지 않는다.

---

## 4. 절대 지켜야 할 원칙

```text
1. 기존 calculatePortfolioResult() 결과를 바꾸지 않는다.
2. 기존 Step 2/3/4 UI를 첫 PR에서 수정하지 않는다.
3. 요약 CAGR/BETA/MDD만으로 확률을 생성하지 않는다.
4. 자산별 손실확률을 가중평균하지 않는다.
5. 자산별 MDD 가중값을 시나리오 MDD로 사용하지 않는다.
6. 과거 실제 수익률 Bootstrap에 BETA를 다시 곱하지 않는다.
7. 월 납입금을 MDD 계산에 넣지 않는다.
8. Total Return 수익률에 배당률을 다시 더하지 않는다.
9. 단일 랜덤 경로를 미래 예측선으로 표시하지 않는다.
10. 데이터 부족 상태를 숫자 0으로 대체하지 않는다.
```

---

## 5. 첫 작업: Step 114-1A 데이터 소스 감사

첫 구현은 계산 코드가 아니라 `데이터 인벤토리`다.

### 목표

현재 저장소와 기존 데이터 파이프라인에 다음 자료가 실제로 있는지 확인한다.

```text
자산별 일별 또는 월말 가격 시계열
조정가격 또는 총수익 시계열
배당 데이터
S&P 500 가격/총수익 지수
KOSPI 200 가격/총수익 지수
원·달러 환율 시계열
자산별 데이터 시작일·종료일
proxy 또는 지수 대체 표시
```

### 확인 대상

```text
data/
src/data/
scripts/
notebooks/
server/
docs/data-sources/
```

### 산출물

```text
docs/portfolio-ml/FINPLE_SCENARIO_DATA_INVENTORY.md
data/processed/scenario_data_coverage.csv
```

### CSV 권장 헤더

```csv
ticker,market,assetType,currency,priceSeriesAvailable,totalReturnSeriesAvailable,dataStart,dataEnd,dataYears,observationFrequency,benchmarkId,fxSeriesRequired,isProxy,proxyTicker,dataSource,scenarioGrade,reasonCodes
```

### 시나리오 등급

```text
A: 자산별 월간 총수익 시계열 존재
B: 가격 시계열 또는 신뢰 가능한 proxy 존재
C: 요약 CAGR/BETA/MDD만 존재
```

### 완료 기준

```text
1. 현재 앱 후보군 중 시나리오 A/B/C 등급 수 집계
2. 미국·한국·ETF·개별주별 커버리지 집계
3. 벤치마크와 환율 자료 보유 여부 확인
4. 누락 자료를 추측하지 않고 명시
5. 다음 계산 PR에 사용할 실제 파일 경로 확정
6. 런타임 코드, CSS, 라우터, DB 변경 없음
7. npm.cmd run build 통과
```

---

## 6. Codex 첫 작업 지시문

아래 문구를 새 Codex 스레드에 그대로 사용할 수 있다.

```text
Repo: vip930sw/FINPLE
Base branch: main
Work item: Step 114-1A Scenario data source audit

Read first:
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_CODEX_HANDOFF.md
- docs/portfolio-ml/README.md

Goal:
Audit the repository for historical price, adjusted price, total return, benchmark, dividend, and FX time-series data needed for scenario analysis.

Do not implement scenario calculations or UI yet.
Do not change existing simulator calculations, Step 2, Step 3, Step 4, CSS, auth, payment, DB schema, or deployment configuration.

Inspect:
- data/
- src/data/
- scripts/
- notebooks/
- server/
- docs/data-sources/

Create:
1. docs/portfolio-ml/FINPLE_SCENARIO_DATA_INVENTORY.md
2. data/processed/scenario_data_coverage.csv

The CSV should classify each eligible asset as:
- A: monthly total-return series available
- B: price series or reliable proxy available
- C: summary metrics only

Include:
- ticker
- market
- asset type
- currency
- price/total-return availability
- start/end date
- years of data
- frequency
- benchmark
- FX requirement
- proxy status
- source
- scenario grade
- reason codes

Report aggregate coverage by market and asset type.
Do not fabricate missing data.
Run npm.cmd run build before committing.
Use a focused branch and open a Draft PR.
In the PR body, list exact files inspected, row counts, limitations, and the recommended next Step 114-1B input files.
```

---

## 7. Step 114-1B 이후 작업 규칙

데이터 감사가 끝난 뒤에만 순수 계산 유틸리티를 만든다.

권장 파일:

```text
server/src/services/scenario/portfolioReturnEngine.js
server/src/services/scenario/rollingRiskMetrics.js
server/src/services/scenario/scenarioResultValidator.js
server/src/services/scenario/__tests__/
```

첫 계산 PR에는 다음만 포함한다.

```text
월간 수익률 정렬
포트폴리오 월수익률
NAV
Drawdown
MDD
Rolling 12개월 손실확률
손실기간 평균·중앙값
회복기간
```

포함하지 않는다.

```text
Bootstrap
API route
UI
BETA stress
AI 연결
DB 저장
```

---

## 8. 순수 함수 계약 예시

## 8.1 월간 포트폴리오 수익률

```js
calculatePortfolioMonthlyReturns({
  assetReturnSeries,
  targetWeights,
  rebalanceFrequency: "annual",
});
```

응답:

```js
[
  { month: "2025-01-31", return: 0.021 },
  { month: "2025-02-28", return: -0.034 },
]
```

## 8.2 NAV

```js
buildNavSeries({
  monthlyReturns,
  initialNav: 100,
});
```

## 8.3 MDD

```js
calculateDrawdownMetrics(navSeries);
```

응답:

```js
{
  mdd: -0.251,
  peakMonth: "2024-07-31",
  troughMonth: "2024-11-30",
  recoveryMonth: "2025-05-31",
  recoveryMonths: 10,
  drawdownSeries: [],
}
```

## 8.4 Rolling 손실

```js
calculateRollingLossMetrics({
  monthlyReturns,
  windowMonths: 12,
});
```

응답:

```js
{
  observationCount: 109,
  lossProbability: 0.266,
  loss10Probability: 0.128,
  loss20Probability: 0.046,
  averageNegativeReturn: -0.117,
  medianNegativeReturn: -0.093,
  worstReturn: -0.324,
}
```

---

## 9. 테스트 기준

### 필수 단위 테스트

```text
0% 수익률 경로
고정 양수 경로
고정 음수 경로
상승 후 급락
급락 후 회복
미회복 경로
결측월
중복월
비중합 100% 미달/초과
리밸런싱 없음/연 1회
```

### 기대값 예시

```text
NAV 120 → NAV 90
MDD = -25%
```

```text
시장 -20%, BETA 1
beta implied return = -20%
```

단, BETA 테스트는 stress engine 단계에서만 작성한다.

### 빌드

```text
npm.cmd run build
```

백엔드 테스트 스크립트가 있으면 함께 실행한다. 없는 테스트 명령을 임의로 만들지 않는다.

---

## 10. PR 운영 기준

브랜치 예시:

```text
step114-1a-scenario-data-audit
step114-1b-risk-metric-engine
step114-2a-rolling-scenario-baseline
step114-2b-joint-block-bootstrap
step114-3a-benchmark-compare-ui
```

커밋 예시:

```text
Step 114-1A: Audit scenario time-series data
Step 114-1B: Add portfolio risk metric utilities
Step 114-2A: Add rolling historical scenario baseline
```

PR 본문에 반드시 포함한다.

```text
작업 목적
변경 파일
변경하지 않은 영역
테스트 결과
데이터 제한
통계 해석 주의사항
다음 작업
```

UI 작업은 Vercel Preview 확인 후 merge한다. 백엔드 변경은 merge 후 Render 배포와 API smoke test를 별도로 확인한다.

---

## 11. 데이터 부족 처리

다음 상황에서 확률을 계산하지 않는다.

```text
공통 월간 데이터 36개월 미만
비중의 상당 부분이 C등급 자산
벤치마크 시계열 없음
통화 변환이 필요한데 환율 시계열 없음
배당 기준이 자산별로 혼재되고 정규화 불가
날짜 정렬 실패
```

반환 상태:

```text
insufficient_data
partial_coverage
method_not_supported
```

화면 문구 예시:

```text
월간 가격 이력이 부족하여 확률 시나리오를 제공하지 않습니다.
현재 포트폴리오는 기준 CAGR 전망만 확인할 수 있습니다.
```

---

## 12. BETA 중복 반영 방지 체크

모든 분석 응답의 `meta`에 다음 필드를 둔다.

```json
{
  "method": "joint_block_bootstrap",
  "betaApplied": false,
  "betaReason": "market sensitivity is embedded in historical joint returns"
}
```

스트레스 테스트:

```json
{
  "method": "factor_stress",
  "betaApplied": true,
  "betaReason": "explicit equity market shock propagation"
}
```

validator가 아래 조합을 차단한다.

```text
method = joint_block_bootstrap
AND betaApplied = true
```

---

## 13. UI 연결 전 체크리스트

```text
[ ] 데이터 등급 정책 확정
[ ] 월간 수익률 정렬 테스트 통과
[ ] MDD·회복기간 테스트 통과
[ ] Rolling 손실 통계 검수
[ ] Bootstrap seed 재현성 확인
[ ] 벤치마크 자동선택 검수
[ ] 통화 처리 검수
[ ] API validator 통과
[ ] 데이터 부족 상태 구현
[ ] 사용자 고지 문구 확정
```

이 체크 전에는 `PortfolioCompareLineChart.jsx`를 수정하지 않는다.

---

## 14. AI 분석 연결 규칙

AI payload는 다음처럼 계산 완료 결과만 받는다.

```json
{
  "scenarioSummary": {
    "method": "joint_block_bootstrap",
    "lossProbability12m": 0.26,
    "averageLossWhenNegative": -0.118,
    "simulatedMddP50": -0.187,
    "mdd30Probability": 0.19,
    "medianRecoveryMonths": 14,
    "benchmarkId": "SP500_TR",
    "dataQualityGrade": "B"
  }
}
```

AI 금지사항:

```text
확률 재계산
MDD 재계산
임의 숫자 추가
특정 종목 추천
목표비중 제시
미래수익 보장
```

AI 출력 예시:

```text
과거 수익률 기반 시나리오에서는 12개월 손실구간이 일부 관측됐으며,
생성된 경로의 MDD 중앙값은 기준 CAGR 전망보다 큰 변동 가능성을 보여줍니다.
이는 미래 손실을 예측하는 값이 아니라 포트폴리오 간 위험구조를 비교하기 위한 참고자료입니다.
```

---

## 15. 최종 인수인계 요약

```text
현재 구현:
- 기준 CAGR 전망
- 자산별 요약 BETA/MDD 가중값
- Step 2 실질 평가금액 비교선

Step 114 목표:
- 실제 월간 시계열 기반 위험경로
- 시장 벤치마크 비교
- 손실확률·MDD 분포·회복기간
- BETA 기반 별도 스트레스 테스트

첫 작업:
- 데이터 소스 감사

첫 작업에서 하지 않을 것:
- 계산 구현
- UI 변경
- API 추가
- DB 변경
- AI 연결
```
