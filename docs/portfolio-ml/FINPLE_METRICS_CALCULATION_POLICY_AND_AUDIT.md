# FINPLE Metrics Calculation Policy and Audit

작성일: 2026-06-26  
대상 저장소: `vip930sw/FINPLE`  
연결 문서: `FINPLE_SCENARIO_ANALYSIS_*`  
상태: 정책·감사 문서, 런타임 미변경

## 1. 문서 목적

이 문서는 FINPLE에서 화면과 시뮬레이터에 사용하는 주요 지표의 산정방식, 현재 데이터 적용 구조, 확인된 정책 불일치, Rolling CAGR 정상화 원칙, 시나리오 분석과의 연결기준을 정리한다.

대상 지표:

```text
CAGR
MDD
BETA
배당률
Calmar Ratio
명목·실질 평가금액
Rolling 손실확률
시나리오 MDD와 회복기간
```

핵심 목적은 다음 두 계산 계층을 분리하는 것이다.

```text
자산 기본지표
= 자산별 가격 이력에서 산출한 요약값

시나리오 위험지표
= 월간 수익률 경로와 포트폴리오 구성에서 직접 산출한 확률·분포값
```

---

## 2. 현재 저장소의 기준 문서와 코드

### 데이터 정책 문서

```text
docs/data-sources/FINPLE_DATA_PIPELINE_PLAYBOOK.md
docs/data-sources/FINPLE_colab_archive_inventory_20260526.md
notebooks/FINPLE_metrics_colab_v2_2_3_archived_reference.ipynb
```

### 현재 런타임 데이터

```text
src/data/tickers/finple_app_candidates_2000_final_v1.csv
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv
```

### 현재 overlay 적용 코드

```text
src/data/tickers/screenerCandidateOverlay.js
```

### 현재 포트폴리오 계산 코드

```text
src/components/portfolio/utils/portfolioCalculations.js
```

현재 보관 노트북은 실제 계산 스크립트를 호출하는 경량 wrapper이며, 당시 사용한 `finple_metrics_colab_v2_2_3.py` 전체 원본은 main 저장소에 보존돼 있지 않다. 따라서 향후 지표 재산출은 새로운 재현 가능 스크립트와 테스트를 기준으로 복구해야 한다.

---

## 3. 수익률 기준 구분

## 3.1 가격수익률

일반 종가 또는 가격지수만 이용한다.

```text
Price Return
= 종료 가격 / 시작 가격 - 1
```

배당과 분배금은 포함하지 않는다.

## 3.2 총수익률

배당 또는 분배금을 재투자한 수익률이다.

```text
Total Return
= 가격변화 + 배당 재투자 효과
```

Adjusted Close 또는 Total Return Index를 사용할 수 있다.

## 3.3 FINPLE 기본 정책

현재 FINPLE 시뮬레이터는 CAGR과 배당률을 별도로 다루므로 기본 `expectedCagr`는 가격수익 기준으로 유지한다.

```text
expectedCagr
= price-close CAGR 또는 정책상 정규화한 price CAGR

dividendYield
= 별도 현금흐름 또는 재투자 입력값

totalReturnCagr
= 참고값
```

Total Return CAGR을 기본 CAGR로 사용하면서 배당률을 다시 더하면 배당효과가 중복될 수 있으므로 금지한다.

---

## 4. CAGR 산정방식

## 4.1 Raw CAGR

기간이 `Y`년일 때:

```text
CAGR
= (endPrice / startPrice)^(1 / Y) - 1
```

일수 기준 권장식:

```text
Y = (endDate - startDate).days / 365.25
```

화면에서는 백분율로 변환한다.

```text
cagrPct = CAGR × 100
```

## 4.2 최근 10년 CAGR

월말 또는 거래일 종가에서 종료일 기준 약 10년 전 가격을 찾는다.

```text
priceCagr10y
= (P_end / P_start_10y)^(1 / effectiveYears) - 1
```

데이터가 정확히 10년이 아니면 실제 `effectiveYears`를 사용하고, 시작일·종료일을 함께 보관한다.

## 4.3 Rolling 10년 CAGR

월말 가격 시계열을 만든 뒤 각 월마다 직전 120개월 CAGR을 계산한다.

```text
rollingCagr10y(t)
= (P_t / P_(t-120))^(1/10) - 1
```

전체 유효 구간에서 다음 통계를 보관한다.

```text
rollingCagr10yMedian
rollingCagr10yP25
rollingCagr10yP75
rollingWindowCount
```

Rolling 구간은 중첩되므로 독립 표본 수처럼 해석하지 않는다.

## 4.4 Rolling Median의 목적

Rolling Median은 최근 10년 원시 CAGR의 종점 편향을 완화한다.

```text
최근 저점 시작 + 최근 고점 종료
→ Raw 10년 CAGR 과대평가 가능

다양한 시작·종료월의 10년 CAGR 중앙값
→ 장기 기준전망의 안정성 개선
```

이는 미래수익률 예측값이 아니라 장기 비교를 위한 정책 기준값이다.

---

## 5. 자산군별 CAGR 적용정책

## 5.1 한국 대표지수 ETF

대상 예시:

```text
069500 KODEX 200
102110 TIGER 200
148020 RISE 200
105190 ACE 200
152100 PLUS 200
278530 KODEX 200TR
```

정책:

```text
rawPriceCagr10y 보관
rollingPriceCagr10yMedian 보관
expectedCagr에는 Rolling Median 우선 적용
appliedCagrPolicy = rolling_10y_median
```

단, KODEX 200TR처럼 기존 보정값이 동종 ETF 대비 비정상적으로 낮은 사례는 일괄 원복하지 않고 동일 공식으로 재산출한다.

## 5.2 미국 대표지수 ETF

대상 예시:

```text
SPY / VOO / IVV
VTI / ITOT / SCHB
QQQ / QQQM
```

기존 런타임은 최근 10년 원시 가격 CAGR을 사용한다. 시나리오와 시장 비교선 고도화 후에는 대표지수군에 대해 Rolling 10년 중앙값을 함께 산출한다.

권장 정책:

```text
앱 기본 장기 기준선
= 지수군 Rolling 10년 가격 CAGR 중앙값

검수 표시
= 최근 10년 Raw 가격 CAGR

총수익 참고
= Rolling 10년 Total Return CAGR 중앙값
```

QQQM처럼 상장기간이 10년 미만인 ETF는 추종지수 또는 QQQ를 proxy로 사용할 수 있으나 반드시 proxy 정보를 표시한다.

## 5.3 개별주와 섹터 ETF

Rolling Median을 자동으로 기본값으로 사용하지 않는다.

다음 조건을 함께 검토한다.

```text
데이터기간
기업 구조변화
분할·합병
레버리지·인버스 여부
지수 proxy 적합성
Raw와 Rolling의 차이
```

## 5.4 채권·원자재·레버리지 상품

단일 10년 CAGR만으로 장기 기대수익을 대표하기 어렵다.

```text
채권: 금리국면과 듀레이션
원자재: 롤오버와 선물곡선
레버리지·인버스: 일일 재조정과 변동성 손실
```

이 자산군은 CAGR 정책과 별도로 상품구조 경고와 데이터 상태를 제공한다.

---

## 6. 현재 확인된 Rolling 보정 유실

## 6.1 기존 final 2,000 데이터

기존 `finple_app_candidates_2000_final_v1.csv`에는 한국 대표 ETF의 Rolling 정상화 값이 보존돼 있었다.

| 자산 | 기존 expectedCagr | 기록된 raw CAGR |
|---|---:|---:|
| KODEX 200 | 5.84% | 약 19.78% |
| TIGER 200 | 5.98% | 약 19.92% |
| RISE 200 | 5.97% | 약 19.89% |
| ACE 200 | 5.89% | 약 19.79% |
| PLUS 200 | 6.01% | 약 19.92% |

notes에는 `KR CAGR normalized override restored from v2.2.3`가 기록돼 있었다.

## 6.2 현재 가격 overlay

`kr_price_metrics_overlay_20260528_app_ready.csv`에는 Rolling 관련 컬럼이 없고 `expectedCagr`가 Raw 10년 CAGR과 동일하게 저장돼 있다.

예시:

| 자산 | 현재 expectedCagr | 현재 priceCagr10y |
|---|---:|---:|
| KODEX 200 | 18.43% | 18.43% |
| TIGER 200 | 18.41% | 18.41% |
| RISE 200 | 18.47% | 18.47% |
| ACE 200 | 18.45% | 18.45% |
| PLUS 200 | 18.50% | 18.50% |
| KODEX 200TR | 19.91% | 19.91% |

## 6.3 원인

현재 overlay 병합순서는 다음과 같다.

```text
final 2,000 overlay
→ 배당 overlay
→ US price metrics overlay
→ KR price metrics overlay
```

마지막 가격지표 overlay가 `expectedCagr`를 포함하므로 기존 Rolling 정상화 값을 뒤에서 덮어쓴다.

판정:

```text
Rolling 계산기능이 시뮬레이터에서 해제됨
X

Rolling 정상화 expectedCagr가 Raw overlay에 의해 덮어써짐
O
```

## 6.4 수정원칙

단순히 overlay 순서를 뒤집지 않는다. 가격지표 파일 자체에 Raw와 Rolling 및 적용정책을 모두 저장한다.

권장 컬럼:

```text
rawPriceCagr10y
rollingPriceCagr10yMedian
rollingPriceCagr10yP25
rollingPriceCagr10yP75
expectedCagr
appliedCagrPolicy
cagrStatus
rollingWindowCount
effectiveStartDate
effectiveEndDate
returnBasis
proxyTicker
metricsSource
```

---

## 7. 미국 대표자산 Rolling 예비검토

다음 값은 저장소의 최종 적용값이 아니다. 월말 120개월 원시 시계열을 다시 수집하기 전의 정책 검토용 잠정치다.

| 대표군 | 현재 화면 대략값 | Rolling 10년 가격 CAGR 중앙값 예비치 |
|---|---:|---:|
| S&P 500 ETF | 약 13.6% | 약 9.3% |
| 미국 전체시장 ETF | 약 13.2% | 약 9.8% |
| Nasdaq-100 ETF | 약 17.6~20.8% | 약 14.9% |

해석:

```text
최근 10년 Raw CAGR
→ 현재의 강한 상승종점 반영

Rolling 10년 중앙값
→ 여러 장기 구간의 중심값
```

정식 적용 전 조건:

```text
1. 월말 가격시계열 수집
2. 동일 종가·통화 기준 통일
3. 120개월 Rolling 계산
4. 지수와 ETF 추적오차 비교
5. proxy 정책 기록
6. Raw / Rolling / Total Return 값 동시 보관
```

---

## 8. MDD 산정방식

## 8.1 자산 과거 MDD

가격 또는 NAV 시계열에서 누적 최고값을 계산한다.

```text
runningPeak(t) = max(P_0 ... P_t)
Drawdown(t) = P_t / runningPeak(t) - 1
MDD = min(Drawdown(t))
```

백분율 표시:

```text
mddPct = MDD × 100
```

## 8.2 데이터 기준

MDD는 CAGR과 동일한 다음 기준을 함께 보관해야 한다.

```text
returnBasis: price / total_return
currency
startDate
endDate
frequency
source
```

## 8.3 Rolling MDD

기본 자산카드의 과거 MDD를 Rolling Median으로 교체하지 않는다.

추가 지표로 분리한다.

```text
mddFullPeriod
rollingMdd10yMedian
rollingMdd10yP10
rollingMdd10yWorst
```

## 8.4 포트폴리오 MDD

현재 `calculatePortfolioResult()`의 `simpleMdd`는 자산별 MDD 비중가중평균이다.

```text
simpleMdd = Σ weight × assetMdd
```

이 값은 화면용 근사치이며 실제 포트폴리오 MDD가 아니다.

시나리오 분석에서는 동일 날짜의 자산수익률로 포트폴리오 NAV를 만든 뒤 MDD를 직접 계산한다.

```text
portfolioReturn(t) = Σ weight(t-1) × assetReturn(t)
portfolioNAV(t) = portfolioNAV(t-1) × (1 + portfolioReturn(t))
```

추가 납입금은 포트폴리오 MDD 계산에서 제외한다.

---

## 9. BETA 산정방식

## 9.1 기본식

동일 기간의 자산과 벤치마크 수익률을 사용한다.

```text
BETA
= Cov(assetReturn, benchmarkReturn)
  / Var(benchmarkReturn)
```

월간 수익률 사용을 기본으로 한다.

## 9.2 벤치마크

권장 기준:

| 자산 | 벤치마크 |
|---|---|
| 미국 대형·전체시장 | S&P 500 또는 SPY |
| Nasdaq-100 ETF | Nasdaq-100 또는 QQQ |
| 한국 KOSPI 200 ETF | KOSPI 200 |
| 한국 KOSPI 개별주 | KOSPI |
| 한국 KOSDAQ 개별주 | KOSDAQ |
| 해외 ETF | 현지 지수 + 필요 시 환율 |

현재 한국 price overlay는 `^KS11`을 사용하고 있어 과거 문서의 KS200 우선정책과 불일치한다. 대표지수 ETF와 개별주의 BETA 벤치마크를 분리해야 한다.

## 9.3 시장 비교선

시장지수를 자기 자신과 비교하면 BETA는 정의상 1이다.

```text
S&P 500 vs S&P 500 = 1.00
KOSPI 200 vs KOSPI 200 = 1.00
```

## 9.4 포트폴리오 BETA

현재 화면 근사값:

```text
portfolioBetaApprox = Σ weight × assetBeta
```

정식 시계열 기반 값:

```text
portfolioBeta
= Cov(portfolioReturn, benchmarkReturn)
  / Var(benchmarkReturn)
```

## 9.5 시나리오와 BETA

```text
과거 수익률 또는 공동 Block Bootstrap
→ BETA 추가 적용 금지

시장 Factor Stress
→ BETA 명시 적용
```

응답 메타데이터에 다음을 기록한다.

```json
{
  "method": "joint_block_bootstrap",
  "betaApplied": false
}
```

또는:

```json
{
  "method": "factor_stress",
  "betaApplied": true
}
```

---

## 10. 배당률 산정·표시

배당률은 다음 세 상태를 구분한다.

```text
blank = 미확인
0.00 = 무배당 확인
0보다 큼 = 배당·분배금 확인
```

공란을 자동으로 0으로 변환하지 않는다.

시뮬레이터에서 배당재투자를 적용할 때:

```text
Price CAGR 사용
→ 별도 dividendYield 재투자 가능

Total Return CAGR 사용
→ dividendYield 재추가 금지
```

---

## 11. Calmar Ratio

기본식:

```text
Calmar = CAGR / abs(MDD)
```

현재 포트폴리오의 Calmar는 비중가중 CAGR과 비중가중 `simpleMdd`로 계산하므로 근사치다.

정식 시나리오 또는 시계열 분석에서는 포트폴리오 직접 CAGR과 직접 MDD를 사용한다.

```text
calmarHistorical
= portfolioCagr / abs(portfolioHistoricalMdd)
```

확률 시나리오에서는 단일 Calmar보다 경로별 Calmar 분포를 제공할 수 있으나 MVP 범위에서는 제외한다.

---

## 12. 평가금액 산정

현재 기준 전망의 연간 계산 개념:

```text
연간 납입금 = 월 납입금 × 12
배당 = 전기 평가금액 × 배당률
성장 기준금액 = 전기 평가금액 + 연간 납입금 + 재투자 배당
연간 수익 = 성장 기준금액 × expectedCagr
기말 평가금액 = 성장 기준금액 + 연간 수익
```

실질가치:

```text
realValue(year)
= nominalValue(year)
  / (1 + inflationRate)^year
```

향후 월별 시나리오에서는 납입시점을 명시한다.

```text
MVP 권장: 월초 납입 후 해당 월 수익률 적용
```

---

## 13. 손실확률과 시나리오 지표

## 13.1 12개월 손실확률

```text
rolling12mReturn(t)
= NAV(t) / NAV(t-12) - 1

lossProbability12m
= count(rolling12mReturn < 0)
  / validWindowCount
```

## 13.2 손실규모

```text
averageLossWhenNegative
medianLossWhenNegative
worstRolling12m
P(return ≤ -10%)
P(return ≤ -20%)
P(return ≤ -30%)
```

## 13.3 시나리오 MDD

각 생성경로에서 MDD를 직접 계산하고 분포를 집계한다.

```text
simulatedMddP50
P(MDD ≤ -20%)
P(MDD ≤ -30%)
recoveryMonthsMedian
```

기본 자산 MDD와 시나리오 MDD를 혼합하지 않는다.

---

## 14. 데이터 신뢰도와 표시정책

| 데이터기간 | 처리 |
|---|---|
| 3년 미만 | 장기 확률·Rolling 제공 보류 |
| 3~5년 | 낮은 신뢰도 |
| 5~10년 | 참고용 |
| 10~20년 | 기본 분석 가능 |
| 20년 이상 | 장기 구간 비교에 유리 |

필수 표시:

```text
dataStart
dataEnd
dataYears
returnBasis
currency
benchmarkTicker
metricsSource
isProxy
proxyTicker
appliedCagrPolicy
rollingWindowCount
analysisVersion
```

---

## 15. 신규 overlay 권장 스키마

```csv
market,ticker,expectedCagr,rawPriceCagr10y,rollingPriceCagr10yMedian,rollingPriceCagr10yP25,rollingPriceCagr10yP75,totalReturnCagr10y,rollingTotalReturnCagr10yMedian,mddFullPeriod,rollingMdd10yMedian,beta,dataYears,effectiveStartDate,effectiveEndDate,benchmarkTicker,returnBasis,currency,isProxy,proxyTicker,appliedCagrPolicy,cagrStatus,metricsStatus,metricsSource,reviewReason
```

기존 `priceCagr10y` 컬럼은 호환을 위해 유지할 수 있으나 의미를 `rawPriceCagr10y`로 명확히 한다.

---

## 16. 재산출 및 수정 순서

### Step 1. 계산 원본 복구

```text
월말 가격수집
배당·총수익 수집
벤치마크 수집
환율 수집
```

### Step 2. 재현 가능한 지표 엔진

```text
Raw CAGR
Rolling CAGR
MDD
Rolling MDD
BETA
데이터기간
proxy 메타데이터
```

### Step 3. 대표자산 검수

```text
SPY / VOO / IVV
VTI / ITOT / SCHB
QQQ / QQQM
069500 / 102110 / 148020 / 105190 / 152100 / 278530
```

### Step 4. 새 overlay 생성

Raw와 Rolling을 동시에 보존하고 `expectedCagr` 적용정책을 명시한다.

### Step 5. loader 수정

Rolling 정상화값이 후속 Raw overlay로 덮이지 않도록 단일 정책결과를 전달한다.

### Step 6. 화면 검증

```text
대표지수 카드
포트폴리오 expectedCagr
장기 평가금액
MDD
BETA
배당 재투자
```

### Step 7. 시나리오 분석 연결

월간 시계열 감사 후 Rolling 손실확률, 포트폴리오 직접 MDD, Bootstrap을 연결한다.

---

## 17. 테스트 기준

## 17.1 CAGR

```text
시작 100, 종료 200, 10년
→ CAGR 약 7.177%
```

## 17.2 MDD

```text
NAV 100 → 120 → 90
→ MDD = -25%
```

## 17.3 BETA

```text
자산수익률이 시장수익률과 동일
→ BETA = 1
```

## 17.4 실질가치

```text
물가 0%
→ 명목값 = 실질값
```

## 17.5 Rolling 정책

```text
Raw CAGR과 Rolling Median이 모두 존재
→ appliedCagrPolicy에 따라 expectedCagr 일치
```

## 17.6 Overlay 회귀

```text
기존 Rolling 정상화 값이 새 Raw overlay에 의해 덮이지 않음
```

## 17.7 BETA 중복

```text
bootstrap method + betaApplied true
→ validator 오류
```

---

## 18. 즉시 금지사항

```text
Raw 10년 CAGR만 저장하고 적용정책을 숨김
Rolling Median을 미래 예측수익률로 표현
가격 CAGR과 배당률을 이중 반영
자산별 MDD 가중값을 실제 포트폴리오 MDD로 표현
한국 대표 ETF BETA를 무조건 KOSPI 기준으로 계산
시계열 Bootstrap에 BETA를 다시 곱함
짧은 상장기간 자산에 근거 없는 10년 proxy 적용
기존 보정값을 검증 없이 일괄 원복
```

---

## 19. 완료 기준

```text
1. CAGR·MDD·BETA·배당의 공식이 문서화됨
2. 가격수익과 총수익 기준이 분리됨
3. Raw와 Rolling CAGR이 동시에 보존됨
4. expectedCagr 적용정책이 데이터에 기록됨
5. 한국 대표 ETF Rolling 유실 원인이 기록됨
6. 미국 대표지수 Rolling 재산출 기준이 정의됨
7. 자산 MDD와 포트폴리오 직접 MDD가 구분됨
8. BETA 벤치마크와 중복적용 방지기준이 있음
9. overlay 신규 스키마와 재산출 순서가 있음
10. 시나리오 분석 문서와 계산정책이 연결됨
```
