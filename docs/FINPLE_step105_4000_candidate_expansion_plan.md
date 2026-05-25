# FINPLE Step 105: 4,000 Candidate Expansion Plan

## 목적

Step 103에서 1,000개 후보 적용, CAGR 보정, 배당 표시 정책, 스크리너 페이지네이션, 시뮬레이터/MBTI 지표 동기화가 안정화되었습니다.

Step 105의 목적은 후보군을 다음 목표까지 확장하는 것입니다.

```text
현재: US 500 + KR 500 = 1,000개
1차 확장: US 1,000 + KR 1,000 = 2,000개
최종 확장: US 2,000 + KR 2,000 = 4,000개
```

핵심 원칙은 한 번에 4,000개를 앱에 넣지 않고, 2,000개 중간 검수 후 4,000개로 확장하는 것입니다.

---

## 1. 작업 단계

```text
Step 105-1. 원천 후보 파일 수집
Step 105-2. 2,000개 seed CSV 생성
Step 105-3. Colab 지표 산출
Step 105-4. CAGR 이상치 및 배당 정책 보정
Step 105-5. 앱 후보 CSV 교체
Step 105-6. 스크리너/시뮬레이터 검수
Step 105-7. 4,000개 반복 확장
```

---

## 2. 원천 후보 파일

### 2.1 미국 후보 원천

권장 파일:

```text
NASDAQ listed stocks CSV
NASDAQ ETF screener CSV
NYSE/NASDAQ/AMEX 전체 후보 CSV
기존 FINPLE final 1,000 CSV
수동 core 후보 리스트
```

미국 후보 우선순위:

```text
1. 기존 final CSV 후보
2. 대형 ETF / 대표 ETF
3. 시가총액 상위 개별주
4. 거래량/인지도 높은 개별주
5. 섹터·테마 ETF
6. 저유동성/특수 상품은 후순위
```

### 2.2 한국 후보 원천

권장 파일:

```text
KRX 상장법인목록
KRX ETF/ETN 목록
한국 개별주 배당 XLSX
한국 ETF 분배금/배당률 CSV
기존 FINPLE final 1,000 CSV
```

한국 후보 우선순위:

```text
1. 기존 final CSV 후보
2. KOSPI 200 / KOSDAQ 150 주요 종목
3. 대표 ETF
4. 시가총액 상위 개별주
5. 배당 확인 가능 종목
6. 우선주/스팩/저유동성/관리종목은 후순위 또는 review_required
```

---

## 3. Seed CSV 필수 컬럼

4,000개 확장 seed는 아래 컬럼을 기준으로 만듭니다.

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

seed 단계에서는 아래 값이 비어 있어도 됩니다.

```text
expectedCagr
beta
mdd
dividendYield
displayDividendYield
dividendPolicy
```

다만 앱 반영 final CSV에서는 가능하면 채워야 합니다.

---

## 4. 중복 제거 기준

중복 제거 key:

```text
market:ticker
```

예시:

```text
US:QQQ
KR:069500
KR:005930
```

주의:

```text
005930 앞자리 0 보존
BRK.B / BRK-B 표기 통일
미국 티커는 대문자 통일
한국 종목코드는 6자리 문자열 통일
```

---

## 5. 품질 기준

2,000개 중간 검수 기준:

```text
전체 후보: 2,000개
US 후보: 1,000개
KR 후보: 1,000개
ready_with_metrics: 80% 이상
review_required: 20% 이하
대표지수 ETF CAGR 이상치: 0건
무배당 표시 오류: 0건
스크리너 페이지네이션 정상
```

4,000개 최종 검수 기준:

```text
전체 후보: 4,000개
US 후보: 2,000개
KR 후보: 2,000개
ready_with_metrics: 85% 이상 목표
review_required: 15% 이하 목표
검색 속도 체감 문제 없음
20/50/100 페이지네이션 정상
시뮬레이터 추가 시 지표 전달 정상
```

---

## 6. CAGR 보정 유지 규칙

기존 Step 103 정책을 그대로 유지합니다.

```text
expectedCagr = price 기준 CAGR
배당 재투자 totalReturn CAGR 미사용
상장 10년 미만도 산출
한국 대표지수 ETF는 rolling median 보정
```

대표지수 ETF 기준값은 유지합니다.

```text
069500 KODEX 200  → 5.84
102110 TIGER 200  → 5.98
148020 RISE 200   → 5.97
105190 ACE 200    → 5.89
152100 PLUS 200   → 6.01
```

---

## 7. 배당 표시 정책 유지 규칙

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
0.00은 내부 계산값
-는 화면 표시값
빈칸은 미확인
```

---

## 8. 앱 반영 전 체크리스트

```text
1. 후보 수 확인
2. US/KR 비율 확인
3. ETF/개별주 비율 확인
4. ticker 중복 확인
5. 한국 6자리 종목코드 보존 확인
6. KODEX 200 CAGR 5.84 확인
7. TIGER 200 CAGR 5.98 확인
8. RISE 200 CAGR 5.97 확인
9. GLD 배당 '-' 확인
10. 304660 무배당 '-' 확인
11. 배당 확인 필요 종목 '확인 필요' 표시 확인
12. 스크리너 20/50/100 페이지네이션 확인
13. 시뮬레이터 추가 시 CSV 지표 전달 확인
14. MBTI 프리셋이 CSV 지표를 우선 사용하는지 확인
```

---

## 9. 파일 산출물 명명 규칙

2,000개 확장:

```text
finple_candidate_seed_2000_v1.csv
finple_candidate_metrics_2000_v1.csv
finple_app_candidates_2000_final_v1.csv
finple_app_candidates_2000_final_diagnosis_v1.json
```

4,000개 확장:

```text
finple_candidate_seed_4000_v1.csv
finple_candidate_metrics_4000_v1.csv
finple_app_candidates_4000_final_v1.csv
finple_app_candidates_4000_final_diagnosis_v1.json
```

---

## 10. 앱 교체 방식

최종 앱 CSV 파일명은 단계별로 바꿔도 되지만, 실제 loader에는 하나만 연결합니다.

권장:

```text
개발/검수 중:
finple_app_candidates_2000_final_v1.csv
finple_app_candidates_4000_final_v1.csv

앱 최종 연결:
finple_app_candidates_current.csv
```

향후 loader는 `finple_app_candidates_current.csv`만 바라보게 하면 CSV 교체 시 코드 수정이 줄어듭니다.

---

## 11. 다음 실행 작업

바로 다음 작업은 아래입니다.

```text
Step 105-1A. 2,000개 seed 생성용 Colab 준비
Step 105-1B. 원천 파일 업로드
Step 105-1C. seed 진단 결과 확인
```

필요 원천 파일:

```text
1. 현재 final 1,000 CSV
2. 미국 주식 후보 CSV
3. 미국 ETF 후보 CSV
4. 한국 상장법인목록
5. 한국 ETF/ETN 목록
6. 한국 배당 XLSX/CSV
```

---

## 현재 결론

```text
한국 현재가 API는 보류해도 됩니다.
이제 후보군 확장은 2,000개 중간 단계를 먼저 거친 후 4,000개로 확장합니다.
Step 103의 보정/표시/전달 정책은 그대로 유지합니다.
```