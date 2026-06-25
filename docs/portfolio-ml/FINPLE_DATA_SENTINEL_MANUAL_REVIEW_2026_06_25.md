# FINPLE Data Sentinel Manual Review

작성일: 2026-06-25
작업: Step 113-1C 수동 검수 및 threshold 조정
입력 표본: `data/processed/ml/asset_quality_manual_review_sample.csv`
규칙 버전: `data-sentinel-rules-v1.1`

## 1. 목적

Step 113-1B의 규칙형 Data Sentinel 결과를 사람이 읽을 수 있는 운영 기준으로 한 번 조정한다.

특히 다음 세 규칙을 확인한다.

```text
DATA_PERIOD_MISMATCH
DIVIDEND_MISSING
SHORT_HISTORY
```

---

## 2. 검수 표본

`asset_quality_manual_review_sample.csv`는 reason code별 대표 행을 먼저 담고, 나머지는 review/warning 행으로 채운다.

이번 검수에서는 24개 표본을 확인했다.

표본에 포함된 유형:

```text
BETA_EXTREME
BETA_MISSING
CAGR_EXTREME
DATA_PERIOD_MISMATCH
DIVIDEND_CONFIRMED_ZERO
DIVIDEND_EXTREME
DIVIDEND_MISSING
DIVIDEND_REVIEW_REQUIRED
PRICE_METRICS_REVIEW_REQUIRED
SHORT_HISTORY
```

---

## 3. 결정 사항

### 3.1 DATA_PERIOD_MISMATCH

결정:

```text
review → warning
```

이유:

표본의 `DATA_PERIOD_MISMATCH` 단독 행은 `expectedCagr`, `beta`, `mdd`, `dividendYield`가 존재하며 `metricsStatus=ready`다. 문제는 10년 지표명과 실제 `dataYears` 간 차이이며, 사용 금지보다는 기간 한계 경고에 가깝다.

예:

```text
GSST dataYears 7.11
BSJQ dataYears 7.8
JMST dataYears 7.59
JPST dataYears 9.02
```

### 3.2 SHORT_HISTORY

결정:

```text
warning 유지
```

이유:

`SHORT_HISTORY`는 가격 지표가 존재하지만 상장 이력이 짧다는 상태다. AI 분석에서는 수익률·위험 해석에 한계가 있음을 안내하면 충분하고, 단독으로 검토 필요 상태까지 올리지는 않는다.

### 3.3 DIVIDEND_MISSING

결정:

```text
review 유지
```

이유:

배당률 결측은 무배당 확정과 다르다. 특히 `dividend_review_required`와 함께 나타나는 행은 “최근 배당 이력 없음, 무배당 확정 아님” 상태이므로 AI 분석에서 0으로 해석하면 안 된다.

### 3.4 DIVIDEND_CONFIRMED_ZERO

결정:

```text
info 유지
```

이유:

`no_dividend_confirmed`와 `dividendYield=0`은 결측이 아니라 확정된 0이다. 점수 차감 없이 별도 reason으로 남긴다.

---

## 4. 조정 결과

| 항목 | Step 113-1B | Step 113-1C |
|---|---:|---:|
| valid | 2568 | 2568 |
| warning | 439 | 1339 |
| review | 2634 | 1734 |
| invalid | 0 | 0 |

시장별 결과:

| market | valid | warning | review |
|---|---:|---:|---:|
| US | 1506 | 678 | 789 |
| KR | 1062 | 661 | 945 |

Reason code 수는 변하지 않았고, severity만 조정됐다.

---

## 5. 남은 결정

다음 단계에서 결정할 항목:

1. `DATA_PERIOD_MISMATCH`를 market/assetType별로 다르게 볼지 결정한다.
2. `DIVIDEND_MISSING`을 모든 자산에 review로 유지할지, 자산군별로 warning/review를 나눌지 검토한다.
3. `DIVIDEND_EXTREME` 기준 25%가 옵션 인컴 ETF에 과도하게 엄격한지 확인한다.
4. `BETA_EXTREME`, `CAGR_EXTREME` threshold를 레버리지/인버스 ETF와 일반 자산으로 분리할지 검토한다.

---

## 6. 검증 명령

```powershell
& 'C:\Users\lsw_2\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m unittest scripts.ml.tests.test_asset_metric_audit
& 'C:\Users\lsw_2\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\ml\audit_asset_metrics.py
npm.cmd run build
```
