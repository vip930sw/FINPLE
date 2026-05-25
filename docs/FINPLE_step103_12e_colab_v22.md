# FINPLE Step 103-12E — Colab v2.2 보정 기준

## 목적

Colab v1에서 한국 ETF CAGR이 과도하게 높게 산출되는 문제가 확인되었습니다. 특히 KODEX 200 등 국내 대표지수 ETF는 상장 기간이 충분한데도 20%대 CAGR이 나오므로, 단순히 `short_history` 문제로 처리하지 않고 상장일·유효 데이터 시작일·벤치마크·동종 ETF 비교를 함께 검토합니다.

## 핵심 원칙

```text
1. expectedCagr는 단순 종가 기준 10년 CAGR을 기본 후보로 사용
2. totalReturnCagr는 adjusted close 기준 참고값으로만 보관
3. 한국 CAGR은 벤치마크/동종 ETF 검증을 통과한 값만 앱에 반영
4. 배당률은 값이 있으면 표시, 없으면 확인 중, 0.00은 실제 무배당일 때만 사용
5. review_required는 앱 반영 보류가 아니라 대체 기준을 선택하기 위한 상태값
```

## review_required 발생 시 해결 기준

### 1. KOSPI200 ETF CAGR이 비정상적으로 높은 경우

예: KODEX 200, TIGER 200, RISE 200 등 국내 대표지수 ETF가 20%대 CAGR로 산출되는 경우

```text
판단:
- 상장일은 충분히 오래되었으므로 단순 데이터 부족으로 보지 않음
- Colab에서 불러온 유효 시작일과 종료일을 확인
- benchmarkCagr10y와 peerMedianCagr10y를 비교

대안:
1순위: 동일 기간 KOSPI200 벤치마크 CAGR로 대체
2순위: KOSPI200 ETF peer median CAGR로 대체
3순위: 둘 다 불안정하면 expectedCagr 공란 유지 + review_required
```

### 2. 한국 상장 해외지수 ETF CAGR이 미국 원 ETF와 크게 다른 경우

예: TIGER 미국S&P500이 VOO/SPY보다 지나치게 높게 나오는 경우

```text
판단:
- 원화 기준 수익률에는 USD/KRW 환율 효과가 포함될 수 있음
- 환헤지형과 비환헤지형을 구분해야 함
- 상장 후 데이터 기간이 10년에 못 미치면 since inception CAGR로 분리

대안:
1순위: 같은 기간 원화 환산 벤치마크 CAGR 사용
2순위: 미국 원 ETF CAGR + USD/KRW 환율 CAGR을 별도 계산하여 비교
3순위: 검증 전 expectedCagr 공란 유지 + review_required
```

### 3. 상장 기간이 짧은 ETF

```text
3년 미만: expectedCagr 반영 보류
5년 미만: short_history_under_5y
10년 미만: sinceInceptionCagr는 보관, expectedCagr는 검토 후 제한 반영
```

## 산출 컬럼

```text
priceCagr10y
- 단순 종가 기준 10년 CAGR
- FINPLE expectedCagr 기본 후보

totalReturnCagr10y
- adjusted close 기준 총수익률 성격 CAGR
- 배당 재투자 옵션과 중복될 수 있으므로 앱 기본 expectedCagr로 사용하지 않음

mdd10y
- 단순 종가 기준 MDD

beta10y
- 미국: SPY 기준
- 한국: KS200 기준

dataYears
- 실제 계산에 사용된 유효 가격 데이터 기간

effectiveStartDate / effectiveEndDate
- 계산에 사용된 실제 시작일/종료일

cagrStatus
- ok
- pending
- hold
- review_required

yieldStatus
- ok
- pending
- manual
```

## 배당률 보강 방향

```text
1순위: 배당형 한국 ETF / 리츠 / 금융주
2순위: 미국 extra 배당 ETF / 배당주
3순위: 전체 후보
```

한국 배당률은 Colab 자동 수집만으로는 안정성이 부족하므로 `kr_dividend_yield_override.csv`를 허용합니다.

```csv
ticker,dividendYield,yieldStatus,yieldSource
458730,3.45,manual,issuer_or_verified_source
161510,5.20,manual,issuer_or_verified_source
```

## 다음 작업

```text
1. v1 417개 후보를 v2.2 스크립트로 재산출
2. review_required.csv 확인
3. KOSPI200 / S&P500 / NASDAQ100 계열 ETF부터 대체 기준 선택
4. 배당형 후보부터 dividendYield 수동 보강
5. 검수 통과 항목만 앱 CSV 반영
```
