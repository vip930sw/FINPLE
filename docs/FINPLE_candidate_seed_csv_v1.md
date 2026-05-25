# FINPLE Candidate Seed CSV v1

## 목적

스크리너 후보군을 한/미 각각 2,000개 수준까지 확장하기 전에 Colab 가공용 seed CSV 구조를 고정합니다.

이번 단계에서는 앱에 바로 4,000개를 넣지 않고, 후보군 원천 CSV를 먼저 정리한 뒤 Colab에서 가격·CAGR·BETA·MDD·배당률을 산출하고, 검증된 결과만 앱 후보 CSV 또는 metrics override에 반영합니다.

## 추가 파일

```text
tools/finple_prepare_candidate_seed_v1.py
data/candidate-seed/finple_candidate_seed_manual_expansion_v1.csv
```

## 생성되는 파일

아래 명령을 실행하면 다음 CSV가 생성됩니다.

```bash
python tools/finple_prepare_candidate_seed_v1.py
```

```text
data/candidate-seed/finple_candidate_seed_us_v1.csv
data/candidate-seed/finple_candidate_seed_kr_v1.csv
data/candidate-seed/finple_candidate_seed_all_v1.csv
```

## CSV 컬럼

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
notes
```

## 컬럼 의미

| 컬럼 | 의미 |
|---|---|
| market | US 또는 KR |
| ticker | 앱에서 표시할 티커 |
| providerSymbol | yfinance, pykrx 등 조회용 심볼 |
| nameKr | 한국어 자산명 |
| assetType | ETF 또는 stock |
| sourceUniverse | 후보군 출처 |
| tier | core / standard / extended |
| strategy | core / growth / dividend / defensive / aggressive 등 |
| riskLevel | low-medium / medium / medium-high / high / very-high |
| goals | 앱 필터용 목표 태그. `|` 구분 |
| beginnerFit | 초보자 적합 여부 |
| tags | 화면 표시 및 검색용 태그. `|` 구분 |
| dataStatus | ready_with_metrics / needs_name_review / pending_metrics 등 |
| expectedCagr | price-close CAGR |
| beta | 기준지수 대비 베타 |
| mdd | 최대낙폭 |
| dividendYield | 배당률 |
| notes | 검수 메모 |

## 작업 흐름

```text
1. finple_candidate_seed_manual_expansion_v1.csv에 추가 후보를 붙인다.
2. python tools/finple_prepare_candidate_seed_v1.py를 실행한다.
3. 생성된 us / kr / all seed CSV를 Colab 산출 스크립트에 투입한다.
4. Colab에서 CAGR, BETA, MDD, dividendYield를 산출한다.
5. 공란 비율과 이상치를 점검한다.
6. 검증된 결과를 앱 후보 CSV 또는 metricsOverrides 파일에 반영한다.
```

## 확장 권장 순서

```text
1차: 미국 500개 + 한국 500개
2차: 미국 1,000개 + 한국 1,000개
3차: 미국 2,000개 + 한국 2,000개
```

## 주의사항

```text
1. totalReturn 기준은 사용하지 않는다.
2. expectedCagr는 close-price 기준을 유지한다.
3. dividendYield는 별도 컬럼으로 관리한다.
4. 한국 대표지수 ETF는 rolling median 보정값을 우선 검토한다.
5. 지표가 없는 후보도 검색 후보로 유지할 수 있으나 dataStatus를 pending_metrics로 표시한다.
6. 앱 최종 반영 전 nameKr, assetType, strategy, riskLevel, tags를 반드시 점검한다.
```
