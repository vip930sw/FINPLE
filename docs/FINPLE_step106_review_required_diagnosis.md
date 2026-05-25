# FINPLE Step 106: review_required 진단 및 보강 계획

## 목적

Step 105에서 후보 2,000개 반영과 스크리너 정렬/검색 안정화가 완료되었습니다.

Step 106의 목적은 현재 `review_required`로 남아 있는 후보를 유형별로 분류하고, 앱 운영에 필요한 보강 우선순위를 정하는 것입니다.

---

## 1. 현재 2,000개 CSV 진단 요약

최종 진단 기준:

```text
전체 후보: 2,000개
미국 후보: 1,000개
한국 후보: 1,000개
중복: 0개
ETF: 1,153개
개별주: 847개
ready_with_metrics: 1,352개
review_required: 648개
```

시장/자산군 구성:

```text
KR ETF: 587개
KR stock: 413개
US ETF: 566개
US stock: 434개
```

공란 현황:

```text
expectedCagr 공란: 46개
beta 공란: 125개
mdd 공란: 46개
dividendYield 공란: 573개
displayDividendYield 공란: 40개
dividendPolicy 공란: 40개
dividendSource 공란: 573개
metricsSource 공란: 40개
```

컨트롤 체크:

```text
KODEX 200 CAGR: 5.84
TIGER 200 CAGR: 5.98
RISE 200 CAGR: 5.97
GLD 배당 표시: -
```

---

## 2. 핵심 판단

현재 `review_required` 648개는 앱 기능 장애가 아니라 데이터 신뢰도 관리 대상입니다.

특히 가장 큰 원인은 다음입니다.

```text
1. 한국 배당률/분배금 미확인
2. 일부 종목의 BETA 미산출
3. 일부 종목의 가격 이력 부족
4. 일부 종목의 metricsSource 미확인
```

현 상태에서도 앱은 정상 작동합니다. 다만 `review_required` 종목은 스크리너와 시뮬레이터에서 해석상 주의가 필요합니다.

---

## 3. 우선순위 체계

### P0. 대표/검수 핵심 종목

대상:

```text
SPY, VOO, IVV, VTI, QQQ, SCHD, GLD, TLT, VNQ
KODEX 200, TIGER 200, RISE 200, ACE 200, PLUS 200
삼성전자, SK하이닉스, 현대차, NAVER 등
```

처리 원칙:

```text
1. expectedCagr / beta / mdd / dividendYield 모두 우선 검수
2. 배당 또는 무배당 여부 수동 확인 가능
3. 앱 상단 노출 후보이므로 review_required 최소화
```

### P1. 사용자 선택 가능성이 높은 후보

대상:

```text
배당형 ETF
미국 대표 ETF
한국 대표 ETF
한국 금융주/리츠/고배당주
미국 배당주/리츠
```

처리 원칙:

```text
1. 배당률 보강 우선
2. 가격 이력 부족 종목은 후보 유지 여부 검토
3. ETF/개별주 분류 오류 재점검
```

### P2. 일반 후보

대상:

```text
일반 개별주
섹터 ETF
중소형 ETF
```

처리 원칙:

```text
1. 확인 필요 상태 유지 가능
2. 4,000개 확장 전 자동 보강 로직으로 처리
```

### P3. 저우선 후보

대상:

```text
저유동성 종목
단기 상장 종목
특수 상품
가격 이력 미흡 종목
```

처리 원칙:

```text
1. 후보 유지 여부 재검토
2. 4,000개 확장 시 제외 후보로 분류 가능
```

---

## 4. 처리 방침

### 4.1 배당률 미확인

배당률을 모를 때 `0.00`으로 확정하지 않습니다.

```text
배당 확인: dividend_confirmed + n.nn%
무배당 확정: no_dividend + display '-'
미확인: review_required + display '확인 필요'
```

이 정책은 계속 유지합니다.

### 4.2 BETA 미산출

BETA는 시장 벤치마크 대비 민감도입니다.

```text
US: SPY 기준
KR: KODEX 200 또는 KOSPI200 기준
```

BETA가 비어 있어도 CAGR/MDD/배당률이 정상이라면 앱 후보로 유지할 수 있습니다. 다만 포트폴리오 BETA 계산에서는 해당 종목의 기여도가 왜곡될 수 있으므로 `review_required` 유지가 맞습니다.

### 4.3 가격 이력 부족

가격 이력이 부족한 종목은 아래처럼 처리합니다.

```text
3년 미만: 보수적으로 review_required 유지
3~10년: sinceInception CAGR 허용, notes에 short_history 표시
10년 이상: 기본 CAGR/MDD 산출
```

---

## 5. 시총/AUM 컬럼 추가 계획

다음 CSV 확장부터 아래 컬럼을 추가합니다.

```text
marketCap      # 개별주 시가총액
aum            # ETF 순자산/AUM
liquidityScore # 거래대금, 규모 기반 유동성 점수
sortRank       # 앱 표시용 최종 정렬 점수
```

정렬 기준은 다음 순서가 적절합니다.

```text
1. exact ticker match
2. sortRank
3. 대표 후보 priority
4. AUM 또는 시가총액
5. ETF 우선
6. ready_with_metrics 우선
7. ticker 순
```

---

## 6. 스크리너 카드 표시 의견

시총/AUM은 카드에 표시할 가치가 있습니다.

다만 현재 2×3 지표 배열을 단순히 2×4로 늘리면 카드가 무거워질 수 있습니다.

권장 카드 지표:

```text
CAGR      BETA
MDD       배당률
규모      위험도
```

보조 정보는 뱃지로 이동합니다.

```text
시장
ETF/개별주
전략
초보자 적합
```

즉, 시총/AUM이 들어오면 `규모`는 핵심 지표로 올리고, 초보자 적합 여부는 뱃지로 빼는 구성이 좋습니다.

---

## 7. 다음 작업

### Step 106-2. review_required 보강 CSV 생성

다음 단계에서는 실제 `review_required` 후보 목록을 기준으로 아래 파일을 만듭니다.

```text
finple_review_required_2000_classified.csv
finple_review_required_2000_priority.csv
finple_review_required_2000_dividend_targets.csv
finple_review_required_2000_price_history_targets.csv
```

### Step 106-3. 보강 대상별 처리

```text
1. 배당형/대표 후보 우선 보강
2. 가격 이력 부족 후보 별도 분리
3. 무배당 확정 후보 '-' 처리
4. 중요하지 않은 후보는 확인 필요 유지
```

---

## 현재 결론

```text
2,000개 후보 반영은 성공
review_required 648개는 기능 문제가 아니라 데이터 보강 대상
다음 단계는 배당률/가격 이력/베타 미확인 종목을 우선순위별로 나누는 것
시총/AUM 컬럼은 4,000개 확장 전 추가하는 것이 적절
```
