# FINPLE Step 103-12E — Colab v2.2 보정 기준

## 목적

Colab v1에서 한국 ETF CAGR이 과도하게 높게 산출되는 문제가 확인되었습니다. 특히 KODEX 200 등 국내 대표지수 ETF는 상장 기간이 충분한데도 20%대 CAGR이 나오므로, 단순히 `short_history` 문제로 처리하지 않고 상장일·유효 데이터 시작일·벤치마크·동종 ETF 비교를 함께 검토합니다.

중요한 전제는 다음입니다.

```text
한국 ETF 상당수는 2000년대에 상장되어 10년치 데이터가 존재할 수 있습니다.
따라서 한국 CAGR 20%대 문제를 무조건 10년치 데이터 누락 때문이라고 판단하지 않습니다.
상장일과 실제 유효 가격 데이터 시작일을 함께 비교해야 합니다.
```

## 핵심 원칙

```text
1. expectedCagr는 단순 종가 기준 10년 CAGR을 기본 후보로 사용
2. totalReturnCagr는 adjusted close 기준 참고값으로만 보관
3. 한국 CAGR은 벤치마크/동종 ETF/원화 프록시 검증을 통과한 값만 앱에 반영
4. 배당률은 값이 있으면 표시, 없으면 확인 중, 0.00은 실제 무배당일 때만 사용
5. review_required는 앱 반영 보류가 아니라 대체 기준을 선택하기 위한 상태값
6. 상장일은 충분한데 dataYears가 짧으면 상장기간 부족이 아니라 데이터 소스/티커 매핑 문제로 분류
```

## Colab 설치 셀

```python
!pip -q install yfinance finance-datareader pykrx pandas numpy openpyxl tqdm
```

`pykrx`는 한국 주식 배당수익률과 한국 가격 데이터 보조 경로로 사용합니다. 단, 한국 ETF 분배금은 pykrx만으로 안정적으로 완성하기 어렵기 때문에 검증된 수동 보강 CSV를 병행합니다.

## 상장일 기준 점검

v2.2는 후보 CSV에 아래 컬럼 중 하나가 있으면 상장일로 인식합니다.

```text
listingDate
listedDate
listDate
상장일
상장일자
ipoDate
IPO Date
```

상장일이 10년 이상 전인데 Colab이 가져온 `dataYears`가 10년에 못 미치면 다음처럼 처리합니다.

```text
dataStatus = source_history_gap_old_listing
cagrStatus = review_required
expectedCagr = 공란 유지
```

이 경우 원인은 보통 아래 중 하나로 봅니다.

```text
1. FinanceDataReader / pykrx / yfinance 데이터 원천의 과거 구간 누락
2. ETF 티커 매핑 오류
3. 상장폐지·종목명 변경·ETF 명칭 변경 이력
4. 수정주가/분배금 조정 방식 차이
5. 액면분할 또는 병합 반영 오류
```

## review_required 발생 시 해결 기준

### 1. KOSPI200 ETF CAGR이 비정상적으로 높은 경우

예: KODEX 200, TIGER 200, RISE 200 등 국내 대표지수 ETF가 20%대 CAGR로 산출되는 경우

```text
판단:
- 상장일은 충분히 오래되었을 수 있으므로 단순 데이터 부족으로 보지 않음
- Colab에서 불러온 유효 시작일과 종료일을 확인
- benchmarkCagr10y와 peerMedianCagr10y를 비교
- priceCagr10y와 totalReturnCagr10y 괴리를 확인

대안:
1순위: 동일 기간 KOSPI200 벤치마크 CAGR로 대체 검토
2순위: KOSPI200 ETF peer median CAGR로 대체 검토
3순위: 둘 다 불안정하면 expectedCagr 공란 유지 + review_required
```

### 2. 한국 상장 해외지수 ETF CAGR이 미국 원 ETF와 크게 다른 경우

예: TIGER 미국S&P500이 VOO/SPY보다 지나치게 높게 나오는 경우

```text
판단:
- 원화 기준 수익률에는 USD/KRW 환율 효과가 포함될 수 있음
- 환헤지형과 비환헤지형을 구분해야 함
- 같은 S&P500을 추종해도 미국 ETF 가격 CAGR과 한국상장 ETF 원화 CAGR은 다를 수 있음
- 그래도 괴리가 과도하면 가격 데이터, 환율 반영, 분배금 조정, 환헤지 여부를 재검토

대안:
1순위: 미국 원 ETF CAGR + USD/KRW 환율 CAGR으로 계산한 krwProxyCagr10y 사용 검토
2순위: 환헤지형은 미국 원 ETF CAGR을 우선 비교 기준으로 사용
3순위: 동일 지수 추종 국내상장 ETF peer median과 비교
4순위: 검증 전 expectedCagr 공란 유지 + review_required
```

v2.2는 국내상장 해외지수 ETF에 아래 값을 추가합니다.

```text
krwProxyCagr10y
- 미국 원 ETF CAGR과 USD/KRW 환율 CAGR을 결합한 원화 프록시 CAGR

proxyCagrBasis
- us_proxy_price_cagr_plus_usdkrw
- us_proxy_price_cagr_hedged
- us_proxy_price_cagr_fx_missing

usProxyCagr10y
- SPY 또는 QQQ 등 미국 원 ETF 가격 CAGR

fxCagr10y
- USD/KRW 환율 CAGR
```

### 3. 상장 기간이 짧은 ETF

```text
3년 미만: expectedCagr 반영 보류
5년 미만: short_history_under_5y
10년 미만: sinceInceptionCagr는 보관, expectedCagr는 검토 후 제한 반영
```

단, 상장일이 10년 이상 전이면 위 기준이 아니라 `source_history_gap_old_listing`으로 분리합니다.

## 산출 컬럼

```text
priceCagr10y
- 단순 종가 기준 10년 CAGR
- FINPLE expectedCagr 기본 후보

totalReturnCagr10y
- adjusted close 기준 총수익률 성격 CAGR
- 배당 재투자 옵션과 중복될 수 있으므로 앱 기본 expectedCagr로 사용하지 않음

benchmarkCagr10y
- 동일 지수 또는 대표 프록시 벤치마크 CAGR

krwProxyCagr10y
- 한국상장 해외지수 ETF용 원화 프록시 CAGR

mdd10y
- 단순 종가 기준 MDD

beta10y
- 미국: SPY 기준
- 한국: KS200 기준

listingDate
- 후보 CSV에서 가져온 상장일

oldListingFor10y
- 상장일 기준 10년 이상 데이터가 있어야 하는지 여부

dataYears
- 실제 계산에 사용된 유효 가격 데이터 기간

effectiveStartDate / effectiveEndDate
- 계산에 사용된 실제 시작일/종료일

cagrStatus
- ok
- pending
- hold
- review_required

cagrAlternativeValue / cagrAlternativeSource
- review_required 발생 시 대체 후보값과 출처

reviewAction
- 검토자가 취할 해결/대안 문구

yieldStatus
- ok
- pending
- manual
```

## 배당률 / 분배금 보강 방향

한국 배당률은 다음 순서로 처리합니다.

```text
1. 한국 개별주
   - pykrx fundamental DIV를 우선 시도
   - 실패하면 pending 유지

2. 한국 ETF / 리츠 / 분배형 상품
   - 자동 수집보다 검증된 수동 보강 CSV를 우선 사용
   - KRX, KSD SEIBro, 운용사 ETF 페이지, ETF CHECK 등에서 최근 12개월 분배금을 확인
   - 최근 12개월 분배금 합계 / 기준가격 또는 최근 종가로 dividendYield 계산

3. 미국 ETF / 미국 주식
   - yfinance TTM dividends / latest close 기준
```

수동 보강 CSV는 두 가지 방식 모두 허용합니다.

### 1. 배당률 직접 입력

```csv
ticker,dividendYield,yieldStatus,yieldSource
458730,3.45,manual,issuer_or_verified_source
161510,5.20,manual,issuer_or_verified_source
```

### 2. 최근 12개월 분배금 합계로 계산

```csv
ticker,ttmDistributionAmount,basisPrice,yieldStatus,yieldSource
069500,850,36500,manual,krx_ksd_issuer_verified
360750,620,14200,manual,issuer_verified
```

계산식은 다음입니다.

```text
dividendYield = ttmDistributionAmount / basisPrice * 100
```

여기서 `basisPrice`는 기준가격 또는 최근 종가 중 하나로 통일해야 합니다. FINPLE 베타에서는 화면 설명상 “최근 종가 기준 추정 분배금률”로 관리하는 편이 안전합니다.

## 배당 데이터 대체 경로

자동 수집 우선순위는 다음처럼 봅니다.

```text
1. pykrx
   - 한국 개별주 DIV 확인용
   - ETF 분배금 자동 완성에는 한계가 있음

2. KRX 정보데이터시스템
   - ETF 가격/NAV/기초지수 및 일부 분배금 검증 보조

3. KSD SEIBro
   - ETF 분배금 지급내역 확인용 후보

4. 운용사 ETF 상세 페이지
   - KODEX, TIGER, ACE, RISE, SOL 등
   - 실제 분배금 공지와 최근 12개월 분배금 확인에 유리

5. ETF CHECK 등 민간 데이터
   - 빠른 검증용 보조 자료
```

운영 반영은 자동 수집값보다 `manual` 또는 `verified` 출처를 우선합니다.

## 다음 작업

```text
1. v1 417개 후보를 v2.2 스크립트로 재산출
2. review_required.csv 확인
3. KOSPI200 / S&P500 / NASDAQ100 계열 ETF부터 대체 기준 선택
4. 상장일은 충분한데 dataYears가 짧은 종목은 데이터 소스/티커 매핑 재확인
5. 한국상장 해외지수 ETF는 krwProxyCagr10y와 괴리 비교
6. 배당형 후보부터 dividendYield 수동 보강
7. 검수 통과 항목만 앱 CSV 반영
```
