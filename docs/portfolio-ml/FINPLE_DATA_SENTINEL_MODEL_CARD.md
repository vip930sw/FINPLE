# FINPLE Data Sentinel ML Model Card

작성일: 2026-06-25
작업 단계: Step 113-2B
대상 실험: `step113-2a-20260625`

## 요약

`robust_mad_baseline`은 FINPLE 자산 import 품질 관리를 위한 오프라인 이상치 탐지 baseline이다. 이 모델은 사용자 포트폴리오를 평가하거나 투자 판단을 생성하지 않는다. 규칙형 Data Sentinel 결과와 함께 내부 수동 리뷰 우선순위를 정하는 보조 신호로만 사용한다.

## 사용 가능 범위

- Data Sentinel 수동 검수 큐 정렬
- 규칙형 감사가 놓칠 수 있는 분포상 특이 자산 후보 탐색
- 향후 Isolation Forest 또는 supervised ranking과 비교할 기준선
- 문서화된 offline batch 산출물 검토

## 사용 금지 범위

- 사용자에게 투자 매수/매도/보유 의견으로 표시
- `ml_review`만으로 자산을 자동 제외
- `ml_normal`을 데이터 품질 보증으로 해석
- 개인정보, 사용자 포트폴리오, 결제/플랜 데이터와 결합
- 모델 결과를 기존 rule status 필드에 덮어쓰기

## 입력 데이터

입력 파일: `data/processed/ml/asset_quality_audit_latest.csv`

입력은 Step 113-1B/1C의 규칙형 Data Sentinel 산출물이다. 현재 실험은 app-ready 후보 5,641개를 대상으로 한다.

## Feature Schema

| field | type | note |
| --- | --- | --- |
| `market` | category | `US`, `KR` |
| `assetType` | category | `ETF`, `stock` |
| `expectedCagr` | number | 기대 CAGR 또는 가격 CAGR 계열 값 |
| `beta` | number | 변동 민감도 |
| `mdd` | number | 최대 낙폭 |
| `dataYears` | number | 가격 지표 산출 기간 |
| `dividendYield` | number | 배당률 |

`market`과 `assetType`은 그룹 통계 계산에 사용한다. 숫자 feature 결측값은 scoring 시점에만 그룹 median으로 대체하고 `mlImputedFields`에 기록한다.

## 알고리즘

- 알고리즘명: `robust_mad_baseline`
- 모델 버전: `step113-2a-20260625`
- 평가 버전: `step113-2b-20260625`
- 그룹 키: `market`, `assetType`
- 주요 계산: grouped median, median absolute deviation, robust z-score
- 점수: 상위 3개 feature z-score 평균
- 상태:
  - `ml_normal`
  - `ml_watch`
  - `ml_review`

모델 바이너리는 저장하지 않는다. 외부 ML 의존성도 추가하지 않았다.

## Threshold

| threshold | value |
| --- | ---: |
| `watch_score` | 2.5 |
| `review_score` | 3.5 |
| `review_feature_z` | 6.0 |

## 2026-06-25 평가 결과

평가 파일:

- `data/processed/ml/asset_anomaly_evaluation_latest.json`
- `data/processed/ml/asset_anomaly_disagreement_sample.csv`

라벨 정책: `proxy_rule_status_not_human_label`

현재는 사람이 확정한 ground truth 라벨이 없다. 따라서 `review`/`invalid` 규칙 상태를 proxy label로만 사용한다. 이 값은 성능 보증이 아니라 비교 기준이다.

| metric | value |
| --- | ---: |
| row count | 5,641 |
| rule actionable (`review`/`invalid`) | 1,734 |
| ML review | 1,177 |
| ML watch or review | 1,256 |
| rule and ML review overlap | 756 |
| rule and ML watch/review overlap | 794 |
| ML flagged but rule non-actionable | 462 |
| rule actionable but ML normal | 940 |

Proxy metrics:

| metric | value |
| --- | ---: |
| ML review precision vs rule actionable | 0.6423 |
| ML review recall vs rule actionable | 0.4360 |
| ML watch/review precision vs rule actionable | 0.6322 |
| ML watch/review recall vs rule actionable | 0.4579 |

## 해석

- 현재 baseline은 규칙형 감사와 완전히 같은 일을 하지 않는다.
- `mlFlaggedRuleNonActionable` 462개는 false positive로 단정하지 않고 신규 리뷰 후보로 본다.
- `ruleActionableMlNormal` 940개가 있으므로 ML 결과만으로 차단하거나 통과시키면 안 된다.
- 현재 수치는 운영 자동화 모델 기준에는 부족하지만, 수동 검수 우선순위 보조와 다음 실험 비교 기준으로는 충분하다.

## Known Limitations

- 수동 ground truth 라벨이 없다.
- 배당률이 높은 커버드콜/옵션 인컴 ETF가 강하게 잡힌다.
- `dataYears`가 짧은 신규 상장 자산은 정상적인 신규 자산이어도 특이값으로 보일 수 있다.
- feature 간 상관관계와 자산 테마/전략 설명은 반영하지 않는다.
- 시장·자산유형 그룹 외 세부 peer group은 아직 없다.

## 승인 기준

다음 조건을 만족하기 전까지 운영 차단 자동화에 사용하지 않는다.

- 최소 100개 이상의 사람이 확인한 라벨 확보
- `ml_review`, `ml_watch`, `ml_normal`별 표본 검수
- US/KR, ETF/stock 세그먼트별 오탐 분석
- rule-only miss와 ML-only candidate의 원인 분류
- threshold 변경 이력과 재현 가능한 평가 산출물 저장

## 다음 실험

1. `asset_anomaly_disagreement_sample.csv`를 사람이 검토해 `humanLabel`을 추가한다.
2. high dividend covered-call ETF를 별도 peer group으로 분리할지 검토한다.
3. scikit-learn 의존성 정책 승인 후 Isolation Forest와 비교한다.
4. rule severity와 ML anomaly score를 합친 review priority score를 별도 컬럼으로 실험한다.
