# FINPLE Step 103 Candidate Metrics Pipeline

## 목적

스크리너 후보군을 1,000개에서 4,000개 수준으로 확장할 때 같은 실수를 반복하지 않기 위한 작업 기준서입니다.

이번 문서는 다음을 고정합니다.

- 후보 CSV 확장 절차
- CAGR/BETA/MDD/배당률 산출 기준
- 한국 대표지수 ETF CAGR 보정 기준
- 무배당과 배당 미확인 표시 정책
- 스크리너에서 시뮬레이터로 지표를 전달하는 기준
- 작업 중 덮어쓰기 사고를 방지하는 체크리스트

---

## 1. 전체 데이터 흐름

```text
원천 후보 파일
→ seed CSV 생성
→ Colab 지표 산출
→ 배당 보정
→ 무배당/미확인 정책 적용
→ final app candidate CSV 생성
→ GitHub 업로드
→ loader 반영
→ Screener 표시 검수
→ Simulator 전달 검수
```

핵심 원칙은 다음입니다.

```text
스크리너 후보 확장 = 단순 종목 추가가 아님
스크리너 후보 확장 = 지표 산출 + 보정 + 표시 정책 + 시뮬레이터 전달 검수까지 포함
```

---

## 2. 원천 데이터 구분

### 2.1 미국 후보

권장 원천:

```text
NASDAQ screener CSV
NASDAQ ETF screener CSV
기존 FINPLE 후보 CSV
수동 core 후보 리스트
```

미국 후보는 다음 필드를 우선 확보합니다.

```text
Symbol
Name
Market Cap
Sector
Industry
ETF 여부
상장기간
```

### 2.2 한국 후보

권장 원천:

```text
상장법인목록.csv
KRX ETF/ETN CSV
한국 개별주 배당 XLSX
한국 ETF 분배금/배당률 CSV
기존 FINPLE 후보 CSV
```

한국 종목코드는 반드시 6자리 문자열로 보존합니다.

```text
5930   → 005930
660    → 000660
69500  → 069500
```

엑셀에서 CSV를 열면 앞자리 0이 날아갈 수 있으므로, 원본 CSV는 가능하면 VS Code 또는 메모장으로 확인합니다.

---

## 3. Seed CSV 생성 기준

seed CSV는 Colab 산출 전의 작업용 후보군입니다.

필수 컬럼:

```text
market
ticker
providerSymbol
nameKr
assetType
strategy
riskLevel
goals
beginnerFit
tags
sourceUniverse
```

권장 추가 컬럼:

```text
listingDate
benchmarkKey
proxyTicker
hedged
yieldCollectionMode
notes
```

후보군 확장 목표:

```text
1차 완료: US 500 + KR 500 = 1,000개
다음 목표: US 2,000 + KR 2,000 = 4,000개
```

---

## 4. CAGR 산출 정책

### 4.1 기본 원칙

FINPLE 앱의 `expectedCagr`는 price 기준 CAGR을 사용합니다.

```text
expectedCagr = priceCagr
```

배당 재투자 기준 CAGR은 앱 기본값으로 사용하지 않습니다.

```text
totalReturnCagr = 참고용
```

이유:

```text
adjustedClose 또는 totalReturn CAGR을 사용하면서 dividendYield를 별도로 표시하면 배당 효과가 중복 반영될 수 있음
```

### 4.2 상장 10년 미만

상장기간이 10년 미만이어도 산출합니다.

```text
상장 10년 이상: priceCagr10y
상장 10년 미만: sinceInception price CAGR
단, dataYears와 dataStatus를 함께 보관
```

### 4.3 한국 대표지수 ETF 보정

한국 대표지수 ETF는 최근 급등 구간 때문에 raw CAGR이 비정상적으로 높게 나올 수 있습니다.

대표 사례:

```text
KODEX 200
TIGER 200
RISE 200
ACE 200
PLUS 200
```

정책:

```text
rawPriceCagr10y가 15% 초과
→ review_required 후보

rawPriceCagr10y가 20% 전후
→ 앱 expectedCagr에 직접 반영 금지

앱 expectedCagr
→ rollingCagr10yMedian 사용
```

예시 확정값:

```text
069500 KODEX 200  → 5.84
102110 TIGER 200  → 5.98
148020 RISE 200   → 5.97
105190 ACE 200    → 5.89
152100 PLUS 200   → 6.01
```

상태값은 `review_required`보다 아래 표현을 선호합니다.

```text
adjusted_by_rolling_median
```

의미는 오류가 아니라 과열 구간 보정 완료입니다.

---

## 5. BETA 산출 정책

미국 자산의 BETA 기준은 SPY로 통일합니다.

```text
US beta benchmark = SPY
```

한국 자산의 BETA 기준은 KOSPI200 또는 KODEX 200 계열 기준으로 통일합니다.

```text
KR beta benchmark = KOSPI200 proxy
```

주의:

```text
QQQ의 beta가 1.13이면 QQQ 자체 기준이 아니라 SPY 기준임
benchmarkTicker 표기를 실제 계산 기준과 일치시켜야 함
```

---

## 6. MDD 산출 정책

현재 앱 구조에서는 자산별 MDD를 받아 포트폴리오 비중으로 가중평균합니다.

```text
portfolioMdd = Σ(assetWeight × assetMdd)
```

정밀 방식은 포트폴리오 수익률 시계열을 합성해 직접 MDD를 계산하는 것이지만, 현재 베타 단계에서는 자산별 MDD 입력값의 품질을 우선합니다.

---

## 7. 배당률 정책

### 7.1 내부값과 화면 표시 분리

배당률은 내부 계산값과 화면 표시값을 분리합니다.

```text
배당 있음:
dividendYield = 실제 수치
displayDividendYield = n.nn%
dividendPolicy = dividend_confirmed

무배당 확정:
dividendYield = 0.00
displayDividendYield = -
dividendPolicy = no_dividend

배당률 미확인:
dividendYield = 빈칸
displayDividendYield = 확인 필요
dividendPolicy = review_required
```

중요:

```text
0.00 = 실제 무배당
빈칸 = 미확인
- = 화면 표시값
```

### 7.2 한국 개별주

한국 개별주는 배당 XLSX의 종목별 현금배당률과 주당배당금을 우선합니다.

```text
현금배당_시가배당률 있음 → dividend_confirmed
현금배당_시가배당률 '-' + 주당배당금 '-' 또는 0 → no_dividend 후보
우선주/금융주/리츠/배당주는 미확인 시 review_required 유지
```

### 7.3 한국 ETF

한국 ETF는 ETF 분배금 CSV 또는 운용사/KRX/KSD 확인값을 우선합니다.

무분배/재투자형으로 확인되면:

```text
dividendYield = 0.00
displayDividendYield = -
dividendPolicy = no_dividend
```

예시:

```text
304660 KODEX 미국채울트라30년선물(H)
→ 최근 12개월 분배 0회
→ no_dividend
```

---

## 8. 앱 CSV 최종 컬럼

최종 앱 반영 CSV는 아래 컬럼을 포함합니다.

```text
market
ticker
providerSymbol
nameKr
assetType
sourceUniverse
tier
strategy
riskLevel
goals
beginnerFit
tags
dataStatus
expectedCagr
beta
mdd
dividendYield
displayDividendYield
dividendPolicy
dividendSource
metricsSource
reviewTag
reviewReason
notes
```

현재 1,000개 반영 기준:

```text
전체 후보: 1,000개
US 후보: 500개
KR 후보: 500개
ready_with_metrics: 926개
review_required: 74개
```

---

## 9. Loader 반영 원칙

`screenerCandidateLoader.js`는 최종 CSV를 단일 원천으로 읽습니다.

```text
finple_app_candidates_1000_final_v1.csv
```

후보 정규화 시 다음을 반드시 유지합니다.

```text
expectedCagr → candidate.expectedCagr
beta → candidate.beta
mdd → candidate.mdd
dividendYield → candidate.dividendYield
displayDividendYield → candidate.displayDividendYield
dividendPolicy → candidate.dividendPolicy
reviewTag → candidate.reviewTag
```

---

## 10. Screener 표시 정책

스크리너 카드는 `displayDividendYield`를 우선 사용합니다.

```text
if displayDividendYield exists → 그대로 표시
else if dividendPolicy = no_dividend → -
else if dividendPolicy = review_required → 확인 필요
else dividendYield → n.nn%
```

---

## 11. Simulator 전달 정책

스크리너에서 시뮬레이터로 자산을 추가할 때 CSV 지표가 그대로 전달되어야 합니다.

필수 전달값:

```text
expectedCagr → asset.cagr
beta → asset.beta
mdd → asset.mdd
dividendYield → asset.dividendYield
displayDividendYield → asset.displayDividendYield
dividendPolicy → asset.dividendPolicy
```

주의:

```text
MBTI 결과 또는 템플릿 포트폴리오를 적용할 때도 임의 하드코딩 값이 아니라 CSV 후보값을 우선 적용해야 함
```

정책:

```text
1순위: final candidate CSV 값
2순위: 기존 템플릿 값
3순위: 수동 입력값
```

---

## 12. 한국 현재가 조회 정책

현재 한국 자산의 실시간/현재가 조회는 아직 연결되지 않았습니다.

현재 정책:

```text
한국 자산 자동조회 차단
미국 Alpha Vantage 조회로 오조회 방지
현재가 없음 → 평가금액 기준 계산 유지
수량은 현재가 조회 후 보정
```

향후 PoC:

```text
한국투자증권 OpenAPI
KRX 보조 데이터
pykrx / FinanceDataReader 보조
```

---

## 13. 덮어쓰기 방지 체크리스트

CSV 또는 코드 반영 전 반드시 확인합니다.

```text
1. 기존 main 최신 상태 확인
2. 이전 정상 CSV 백업
3. 최종 CSV 행 수 확인
4. US/KR 후보 수 확인
5. KODEX 200 CAGR 5.84 확인
6. TIGER 200 CAGR 5.98 확인
7. RISE 200 CAGR 5.97 확인
8. GLD displayDividendYield '-' 확인
9. dividendYield 0.00과 display '-' 분리 확인
10. review_required가 화면에서 '확인 필요'로 보이는지 확인
11. MBTI/템플릿 적용 시 CSV 지표 우선 적용 여부 확인
```

대용량 CSV는 GitHub API로 직접 덮어쓰지 않는 것을 원칙으로 합니다.

```text
대용량 CSV는 사용자가 GitHub 웹에서 업로드
코드 파일은 GitHub API로 수정 가능
```

---

## 14. 4,000개 확장 절차

4,000개 후보 확장 시 순서는 다음입니다.

```text
1. 후보 seed 4,000개 생성
2. 티커 코드 정규화
3. 중복 제거
4. 미국/한국/ETF/개별주 분류
5. Colab metrics 산출
6. 한국 대표지수 rolling median 보정
7. 배당 XLSX/CSV 보정
8. 무배당/미확인 정책 적용
9. final candidate CSV 생성
10. 품질 진단 JSON 생성
11. GitHub 업로드
12. loader 및 화면 검수
13. 시뮬레이터 전달 검수
```

품질 목표:

```text
ready_with_metrics 85% 이상
review_required 15% 이하
ETF 배당 미확인 최소화
대표지수 ETF CAGR 이상치 0건
```

---

## 15. 현재 남은 이슈

```text
1. 한국 현재가 조회 미연결
2. 시뮬레이터 배당 표시가 displayDividendYield를 아직 완전히 반영하지 못함
3. MBTI 결과 적용 시 CSV 지표가 아니라 임의값이 적용되는 현상 확인 필요
4. 4,000개 후보 확장용 seed 생성 필요
```

이 문서는 위 이슈를 해결할 때 기준 문서로 사용합니다.
