# FINPLE Data Sentinel Rule Baseline

작성일: 2026-06-25
작업: Step 113-1B 규칙형 Data Sentinel baseline / Step 113-1C 수동 검수 조정
규칙 파일: `scripts/ml/config/asset_quality_rules.json`
감사 스크립트: `scripts/ml/audit_asset_metrics.py`

## 1. 목적

Data Sentinel baseline은 머신러닝 전에 재현 가능한 규칙형 데이터 품질 감사를 제공한다.

이 단계는 원본 CSV를 수정하지 않는다. 감사 결과만 `data/processed/ml/` 아래에 생성한다.

---

## 2. 입력 데이터

Step 113-1A 인벤토리 결과를 기준으로, 현재 앱에서 실제로 노출 가능한 app-ready 후보군만 감사한다.

입력 파일:

```text
src/data/tickers/finple_app_candidates_6000_balanced_v1.csv
src/data/tickers/finple_app_candidates_2000_final_v1.csv
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv
src/data/tickers/us_dividend_overlay_20260527.csv
src/data/tickers/kr_etf_dividend_overlay_20260525.csv
src/data/tickers/kr_stock_dividend_overlay_20260525.csv
```

감사 대상 행 수:

```text
5641 app-ready assets
US 2973
KR 2668
```

---

## 3. 산출물

```text
data/processed/ml/asset_quality_audit_latest.csv
data/processed/ml/asset_quality_summary_latest.json
data/processed/ml/asset_quality_manual_review_sample.csv
```

`asset_quality_audit_latest.csv`는 자산별 품질 점수, 상태, reason code, 원본 지표를 포함한다.

`asset_quality_summary_latest.json`은 전체/시장별 집계, reason code 분포, threshold, 표본 검수 행을 포함한다.

`asset_quality_manual_review_sample.csv`는 사람이 빠르게 확인할 수 있는 대표 reason code 표본이다.

---

## 4. 규칙 버전

| 항목 | 값 |
|---|---|
| rule version | `data-sentinel-rules-v1.1` |
| audit version | `step113-1c-20260625` |
| audited at | `2026-06-25T00:00:00Z` |

점수:

```text
100점 시작
error 1건당 -30
review 1건당 -15
warning 1건당 -5
info 1건당 -0
최저 0
```

상태:

| 조건 | status | recommendedMetricPolicy |
|---|---|---|
| error 있음 | `invalid` | `exclude_until_fixed` |
| review 있음 | `review` | `use_with_review` |
| warning만 있음 | `warning` | `use_with_warning` |
| reason 없음 | `valid` | `use` |

---

## 5. Threshold

| 항목 | 기준 |
|---|---:|
| short history | `< 5 years` |
| data period mismatch | `priceCagr10y` 존재 및 `dataYears < 9.5`, metricsStatus `ready` |
| CAGR review range | `< -80` 또는 `> 80` |
| beta review range | `< -1` 또는 `> 4` |
| MDD minimum | `< -100` |
| dividend yield review range | `> 25` |

이 기준은 baseline이며, 수동 검수 후 조정한다.

---

## 6. Reason codes

| code | severity | 설명 |
|---|---|---|
| `TICKER_FORMAT` | error | 티커가 없거나 시장별 형식에 맞지 않음 |
| `REQUIRED_MISSING` | error | market, ticker, nameKr, assetType 같은 식별 필드 결측 |
| `MDD_POSITIVE` | error | MDD가 양수 |
| `MDD_OUT_OF_RANGE` | error | MDD가 -100 미만 |
| `METRIC_INVALID_NUMERIC` | error | 숫자 필드가 숫자로 파싱되지 않음 |
| `EXPECTED_CAGR_MISSING` | review | app-ready 병합 후 expectedCagr 결측 |
| `BETA_MISSING` | review | app-ready 병합 후 beta 결측 |
| `MDD_MISSING` | review | app-ready 병합 후 mdd 결측 |
| `DATA_YEARS_MISSING` | review | app-ready 병합 후 dataYears 결측 |
| `CAGR_EXTREME` | review | CAGR이 review range 밖 |
| `BETA_EXTREME` | review | beta가 review range 밖 |
| `DIVIDEND_EXTREME` | review | dividendYield가 review range 밖 |
| `DIVIDEND_MISSING` | review | 배당률 결측이고 무배당 확정이 아님 |
| `DIVIDEND_REVIEW_REQUIRED` | review | 배당 정책이 review required |
| `PRICE_METRICS_REVIEW_REQUIRED` | review | 가격지표 상태가 review required |
| `DATA_PERIOD_MISMATCH` | warning | 10년 지표명 대비 dataYears가 부족하며 기간 한계 경고로 표시 |
| `SHORT_HISTORY` | warning | dataYears가 5년 미만 |
| `DIVIDEND_CONFIRMED_ZERO` | info | 무배당 확정 0이며 결측이 아님 |

---

## 7. 감사 결과 요약

| status | count |
|---|---:|
| valid | 2568 |
| warning | 1339 |
| review | 1734 |
| invalid | 0 |

시장별 상태:

| market | valid | warning | review |
|---|---:|---:|---:|
| US | 1506 | 678 | 789 |
| KR | 1062 | 661 | 945 |

Reason code 분포:

| code | count |
|---|---:|
| `DATA_PERIOD_MISMATCH` | 1403 |
| `DIVIDEND_MISSING` | 1397 |
| `SHORT_HISTORY` | 1346 |
| `DIVIDEND_REVIEW_REQUIRED` | 686 |
| `PRICE_METRICS_REVIEW_REQUIRED` | 136 |
| `DIVIDEND_EXTREME` | 96 |
| `BETA_EXTREME` | 71 |
| `CAGR_EXTREME` | 67 |
| `BETA_MISSING` | 20 |
| `DIVIDEND_CONFIRMED_ZERO` | 4 |

---

## 8. 해석 주의사항

1. `review`는 앱 노출 금지가 아니라 검토 필요 상태다.
2. `invalid`가 0인 것은 현재 baseline에서 형식 오류나 MDD 치명 오류가 발견되지 않았다는 뜻이다.
3. `DATA_PERIOD_MISMATCH`는 `priceCagr10y`라는 컬럼명과 실제 `dataYears` 간의 차이를 보수적으로 잡은 규칙이다. Step 113-1C에서 단독 review가 과도하다고 판단해 warning으로 낮췄다.
4. `DIVIDEND_MISSING`은 무배당 확정이 아니다. `no_dividend_confirmed`와 별도로 유지해야 한다.
5. `DIVIDEND_CONFIRMED_ZERO`는 info reason이며 점수를 깎지 않는다.
6. 극단값 threshold는 첫 baseline이므로 market/assetType별로 조정해야 한다.

---

## 9. 검증 명령

```powershell
& 'C:\Users\lsw_2\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest scripts.ml.tests.test_asset_metric_audit
& 'C:\Users\lsw_2\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\ml\audit_asset_metrics.py
npm.cmd run build
```

---

## 10. Step 113-1C 조정 사항

Step 113-1C에서 `asset_quality_manual_review_sample.csv`의 24개 표본을 확인했다.

조정 결과:

```text
DATA_PERIOD_MISMATCH: review → warning
DIVIDEND_MISSING: review 유지
DIVIDEND_REVIEW_REQUIRED: review 유지
SHORT_HISTORY: warning 유지
```

조정 전후:

| 항목 | Step 113-1B | Step 113-1C |
|---|---:|---:|
| valid | 2568 | 2568 |
| warning | 439 | 1339 |
| review | 2634 | 1734 |
| invalid | 0 | 0 |

---

## 11. 다음 단계

Step 113-2A 또는 Step 113-1C 후속 작업에서는 다음을 진행한다.

1. market/assetType별 threshold 분리를 검토한다.
2. `DIVIDEND_MISSING`과 `DIVIDEND_REVIEW_REQUIRED`를 dividend policy 문서와 맞춘다.
3. Data Sentinel 결과를 향후 ML anomaly output과 별도 컬럼으로 유지한다.
4. 비지도 이상치 실험 전, 수동 검수 라벨 형식을 확정한다.
