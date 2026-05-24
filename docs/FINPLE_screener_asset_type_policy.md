# FINPLE Screener Asset Type Policy

## 1. 목적

자산 스크리너에서 ETF와 개별주를 명확히 구분하기 위한 정책입니다.

QQQ 같은 ETF와 NVDA, TSLA, AAPL, MSFT 같은 개별주는 모두 기술주 노출을 만들 수 있지만 포트폴리오의 의미가 다릅니다.

```text
QQQ 편입
- 나스닥100에 분산 노출
- ETF 내부 구성종목을 통한 간접 노출
- 개별 기업 리스크는 상대적으로 분산

NVDA / TSLA / AAPL / MSFT 편입
- 특정 기업에 직접 노출
- 집중도 상승
- 개별 기업 이벤트와 실적 리스크가 직접 반영
```

따라서 스크리너는 단순히 성장, 배당, 방어 같은 전략만 구분하지 않고 ETF / 개별주 구분을 우선적으로 표시해야 합니다.

## 2. 핵심 필드

### assetType

현재 candidates CSV에 이미 들어간 기본 자산 유형입니다.

```text
ETF
stock
```

### exposureType

후보군 확장 시 추가할 권장 컬럼입니다.

```text
broad_index       대표지수 / 광범위 분산 ETF
sector            섹터 ETF
growth_index      성장지수 ETF
dividend          배당 / 인컴형 ETF 또는 주식
bond              채권형 ETF
commodity         금 / 원자재 / 헤지형 ETF
reit              리츠 / 부동산
leveraged         레버리지
inverse           인버스
single_stock      개별 기업 주식
cash_like         현금성 / 단기금리형
```

### sector

후보군 확장 시 추가할 권장 컬럼입니다.

```text
technology
semiconductor
healthcare
financials
consumer
energy
bond
real_estate
commodity
broad_market
```

### isBroadMarket

대표지수 / 광범위 분산형인지 여부입니다.

```text
true
false
```

## 3. 스크리너 UI 기준

1차 UI에서는 아래 필터를 먼저 제공합니다.

```text
전체
ETF
개별주
```

이후 후보군이 충분히 확장되면 exposureType 필터를 추가합니다.

```text
대표지수
섹터
배당
채권
원자재/헤지
리츠
레버리지/인버스
개별주
```

## 4. 후보군 편입 기준

### ETF 후보군

ETF는 아래 기준을 우선합니다.

```text
- 대표지수 ETF
- 거래량과 운용규모가 충분한 ETF
- 장기 데이터 확보가 가능한 ETF
- 초보자가 이해하기 쉬운 ETF
- 배당 / 채권 / 금 / 리츠 등 포트폴리오 분산에 필요한 ETF
```

### 개별주 후보군

개별주는 아래 기준을 우선합니다.

```text
- 시가총액 상위 대형주
- 거래량이 충분한 종목
- 장기 가격 데이터 확보가 가능한 종목
- 섹터 대표성이 있는 종목
- 포트폴리오 집중도 설명이 가능한 종목
```

초기에는 개별주를 초보자 기본 추천에 과도하게 포함하지 않습니다.

## 5. 시뮬레이터 확장 기준

스크리너에서 구분한 assetType과 exposureType은 향후 시뮬레이터에서 아래 분석으로 이어질 수 있습니다.

```text
- ETF 비중
- 개별주 비중
- 상위 3개 자산 집중도
- 섹터 노출
- QQQ와 AAPL/MSFT/NVDA 같은 중복 노출 안내
- 레버리지/인버스 비중 경고
```

## 6. candidates.csv 확장 권장 컬럼

향후 `us_screener_candidates.csv`, `kr_screener_candidates.csv`는 아래 컬럼을 추가하는 방향을 권장합니다.

```text
exposureType
sector
industry
region
isBroadMarket
isLeveraged
isInverse
isHedged
```

우선순위는 아래와 같습니다.

```text
1. exposureType
2. sector
3. isBroadMarket
4. isLeveraged / isInverse
5. region / industry / isHedged
```

## 7. 운영 기준

후보군은 마스터와 다릅니다.

```text
master CSV
- 전체 종목 사전
- 검색 / 자동완성 / API 심볼 매칭

screener candidates CSV
- FINPLE 스크리너에 노출할 품질 관리 후보군
- ETF / 개별주 / 전략 / 위험도 / 노출유형 기준으로 선별
```

따라서 전체 마스터를 그대로 스크리너 후보군으로 사용하지 않습니다.
