# FINPLE Data Sentinel ML Anomaly Experiment

작성일: 2026-06-25
작업 단계: Step 113-2A

이 문서는 Step 113-1B/1C의 규칙 기반 Data Sentinel 결과 위에 추가한 ML 이상치 실험 레이어를 기록한다. 이번 단계는 운영 모델 배포가 아니라 오프라인 실험이며, 사용자 화면과 런타임 데이터 로딩 경로를 변경하지 않는다.

## 목적

- 규칙 기반 감사 결과를 대체하지 않고 수동 리뷰 우선순위를 보조한다.
- CAGR, beta, MDD, 데이터 기간, 배당률이 같은 자산군 안에서 얼마나 튀는지 별도 점수로 기록한다.
- 향후 Isolation Forest, robust scaler, rule+ML ensemble을 비교하기 전 기준선을 만든다.

## 구현 범위

- 설정: `scripts/ml/config/asset_anomaly_experiment.json`
- 실행 스크립트: `scripts/ml/run_asset_anomaly_experiment.py`
- 테스트: `scripts/ml/tests/test_asset_anomaly_experiment.py`
- 입력: `data/processed/ml/asset_quality_audit_latest.csv`
- 출력:
  - `data/processed/ml/asset_anomaly_experiment_latest.csv`
  - `data/processed/ml/asset_anomaly_experiment_summary_latest.json`
  - `data/processed/ml/asset_anomaly_review_sample.csv`

## 알고리즘

초기 실험은 외부 ML 의존성을 추가하지 않는 `robust_mad_baseline`이다.

1. `market`, `assetType`으로 그룹을 나눈다.
2. `expectedCagr`, `beta`, `mdd`, `dataYears`, `dividendYield`에 대해 그룹별 median과 MAD를 계산한다.
3. 그룹 표본이 부족하면 전체 분포 통계를 사용한다.
4. 결측값은 점수 계산에만 그룹 median으로 대체하고 `mlImputedFields`에 기록한다.
5. 각 feature의 robust z-score를 계산하고 상위 3개 평균을 `mlAnomalyScore`로 둔다.
6. score와 top feature z-score 기준으로 `ml_normal`, `ml_watch`, `ml_review`를 분류한다.

## 2026-06-25 실행 결과

입력 행 수: 5,641

| status | count |
| --- | ---: |
| `ml_normal` | 4,385 |
| `ml_watch` | 79 |
| `ml_review` | 1,177 |

시장별 결과:

| market | ml_normal | ml_watch | ml_review |
| --- | ---: | ---: | ---: |
| US | 2,424 | 62 | 487 |
| KR | 1,961 | 17 | 690 |

가장 자주 top feature가 된 항목:

| feature | count |
| --- | ---: |
| `dataYears` | 1,585 |
| `expectedCagr` | 1,198 |
| `dividendYield` | 983 |
| `mdd` | 964 |
| `beta` | 911 |

상위 이상치 샘플은 `asset_anomaly_review_sample.csv`에 저장했다. 상단 후보는 레버리지 ETF, 옵션 인컴 ETF, 짧은 히스토리, 극단 배당률, 극단 CAGR/Beta가 많은 편이다.

## 해석 기준

- `ml_review`: 자동 제외가 아니라 수동 리뷰 큐 상단 후보이다.
- `ml_watch`: 규칙상 통과해도 다음 threshold 조정 때 재확인할 후보이다.
- `ml_normal`: 이상치 점수가 낮다는 뜻이며 품질 보증을 의미하지 않는다. 최종 상태는 여전히 규칙 기반 `status`와 reason code를 함께 봐야 한다.

## 운영 주의점

- 이번 단계는 모델 학습/서빙을 추가하지 않는다.
- 모델 바이너리, 사용자별 예측값, 개인정보 파생값을 저장하지 않는다.
- ML 점수는 자산 import 품질 관리용 내부 지표이며 투자 추천 신호가 아니다.
- 규칙 결과와 ML 결과를 같은 필드로 덮어쓰지 않는다.
- Vercel 프론트 배포에는 산출물과 문서가 포함되지만, 화면 UI 변화는 없다.

## 다음 단계 제안

1. `ml_review`와 기존 `review` reason code가 겹치지 않는 후보를 따로 추려 false positive를 점검한다.
2. `ml_review` 비율이 20% 수준이므로 threshold를 한 번 더 보수적으로 조정할지 검토한다.
3. scikit-learn 의존성 추가 정책이 정해지면 Isolation Forest 결과와 이번 MAD 기준선을 비교한다.
4. 수동 검수 결과를 라벨로 남길 수 있으면 이후 supervised ranking 또는 rule weight calibration으로 확장한다.
