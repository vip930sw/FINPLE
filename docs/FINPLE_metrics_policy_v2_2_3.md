# FINPLE Metrics Policy v2.2.3

## 목적

FINPLE 스크리너와 시뮬레이터에 반영하는 자산별 지표의 기준을 고정합니다. 현재 시뮬레이터는 자산별 CAGR, MDD, BETA, 배당률을 받아 포트폴리오 비중으로 가중평균하는 구조이므로, 자산별 입력 지표 품질이 결과 품질을 결정합니다.

## 확정 기준

```text
1. expectedCagr는 price-close CAGR 기준으로 관리한다.
2. totalReturnCagr는 앱 반영값으로 사용하지 않는다.
3. 배당률은 dividendYield로 별도 관리한다.
4. 상장 10년 미만 자산도 확보 가능한 기간의 price CAGR을 반영한다.
5. 데이터 기간 부족은 공란 처리 사유가 아니라 notes/dataStatus로 설명한다.
6. 한국 대표지수 ETF는 최근 급등장이 포함된 raw CAGR을 그대로 쓰지 않고 rolling 10년 CAGR 중앙값을 우선 사용한다.
7. 한국 ETF/개별주 배당률은 외부 검증 CSV 값을 우선한다.
```

## 미국 자산 기준

미국 ETF와 개별주는 다음 기준을 사용합니다.

```text
expectedCagr = priceCagr10y
mdd = mdd10y
beta = beta10y
배당률 = dividendYield
```

상장 10년 미만인 QQQM, JEPI, SNOW 등도 산출값을 공란으로 두지 않습니다. 다만 사용 기간이 짧다는 사실은 notes 또는 dataStatus에서 추적합니다.

## 한국 자산 기준

한국 자산도 기본적으로 price-close CAGR을 사용합니다.

```text
한국 일반 ETF / 개별주:
expectedCagr = priceCagr10y 또는 확보 가능한 기간의 price CAGR

한국 대표지수 ETF:
expectedCagr = rollingCagr10yMedian 우선
```

KODEX 200, TIGER 200, RISE 200, ACE 200, PLUS 200 등 KOSPI200 대표 ETF는 2026년 급등장이 포함된 raw 10년 CAGR이 20%대까지 튀는 문제가 있으므로, 앱 반영값은 rolling 10년 CAGR 중앙값을 기본으로 합니다.

## KODEX 200 예시

v2.2.3 산출 결과 기준 KODEX 200은 다음처럼 해석합니다.

```text
raw priceCagr10y: 약 20%대
rollingCagr10yMedian: 약 5.84%
앱 expectedCagr: 5.84%
dividendYield: 별도 표시
```

이는 계산 오류를 숨기는 것이 아니라, 현재 고점/급등장에 민감한 단일 10년 CAGR 대신 여러 10년 구간의 중앙값을 사용해 장기 기대값에 가깝게 보정하는 방식입니다.

## Total Return 미사용 사유

FINPLE은 배당률을 별도 표시하고, 향후 배당금 흐름을 따로 계산합니다. 따라서 adjusted close 또는 total return CAGR을 expectedCagr로 사용한 뒤 dividendYield를 다시 더하면 배당 효과가 중복 반영될 수 있습니다.

```text
totalReturnCagr + dividendYield
→ 배당 재투자 효과 중복 가능

priceCagr + dividendYield 별도 표시
→ FINPLE 현재 구조에 적합
```

## 0.00과 공란의 의미

```text
0.00 = 실제 무배당 또는 무분배로 확인된 값
공란 = 미확인 또는 아직 검증되지 않은 값
```

배당률은 특히 0.00과 공란을 구분해야 합니다.

## 앱 반영 방식

현재 앱에는 기존 CSV를 전부 대체하는 대신, `metricsOverridesV223.js`를 통해 v2.2.3 산출값을 덮어씁니다.

이 방식의 장점은 다음과 같습니다.

```text
1. 기존 후보군 태그/분류 구조를 유지한다.
2. v2.2.3 산출 지표만 안전하게 덮어쓴다.
3. 한국 대표지수 ETF의 rolling median 반영값을 중앙에서 관리한다.
4. 추후 v2.2.4 산출값이 나오면 override 파일만 교체할 수 있다.
```

## 검수 체크리스트

```text
1. QQQM, JEPI, SNOW의 CAGR이 공란이 아닌지 확인
2. KODEX 200, TIGER 200, RISE 200이 5~6%대 CAGR로 표시되는지 확인
3. 한국 대표지수 ETF가 20%대 CAGR로 노출되지 않는지 확인
4. 한국 ETF/개별주 배당률 공란이 기존보다 줄었는지 확인
5. dividendYield 0.00과 공란이 혼동되지 않는지 확인
6. 스크리너 필터가 기존처럼 작동하는지 확인
7. 포트폴리오 추가 후 시뮬레이터에 CAGR/MDD/BETA/배당률이 반영되는지 확인
```
