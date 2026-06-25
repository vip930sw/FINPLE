# FINPLE ML Data Inventory

작성일: 2026-06-25
작업: Step 113-1A 데이터 인벤토리
생성 스크립트: `scripts/ml/audit_ml_data_inventory.py`
출력 JSON: `data/processed/ml/finple_ml_data_inventory.json`

## 1. 목적

이 문서는 FINPLE 포트폴리오 ML과 AI 분석 개발을 시작하기 전에 현재 앱이 실제로 읽는 자산 데이터와 가공 산출물을 정리한다.

이 단계에서는 런타임 동작, UI, 계산식, 서버 API를 변경하지 않는다. 목표는 이후 Data Sentinel 규칙형 baseline을 만들기 위한 데이터 기준점을 확보하는 것이다.

---

## 2. 감사 범위

스캔 대상:

```text
src/data/tickers/
data/processed/
```

런타임 import 확인 파일:

```text
src/data/tickers/screenerCandidateLoader.js
src/data/tickers/screenerCandidateOverlay.js
```

감사 결과:

| 항목 | 값 |
|---|---:|
| 전체 파일 | 32 |
| CSV | 23 |
| JSON | 9 |
| 현재 앱이 직접 import하는 CSV | 7 |

---

## 3. 현재 런타임 데이터 흐름

현재 스크리너와 포트폴리오 시뮬레이터 후보 데이터는 다음 흐름으로 구성된다.

```text
finple_app_candidates_6000_balanced_v1.csv
→ price metrics app-ready overlay 존재 여부로 필터
→ final 2000 / dividend / price metrics overlay 병합
→ ALL_SCREENER_CANDIDATES
→ ScreenerPage, InvestmentMbtiPage, PortfolioSimulator asset hydration
```

현재 앱이 직접 import하는 CSV:

| 파일 | 역할 | 행 수 |
|---|---|---:|
| `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv` | 기본 6000 후보군 | 6000 |
| `src/data/tickers/finple_app_candidates_2000_final_v1.csv` | 기존 2000 후보 overlay | 2000 |
| `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv` | 미국 가격지표 app-ready overlay | 2973 |
| `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv` | 한국 가격지표 app-ready overlay | 2668 |
| `src/data/tickers/us_dividend_overlay_20260527.csv` | 미국 배당 overlay | 3000 |
| `src/data/tickers/kr_etf_dividend_overlay_20260525.csv` | 한국 ETF 배당 overlay | 922 |
| `src/data/tickers/kr_stock_dividend_overlay_20260525.csv` | 한국 개별주 배당 overlay | 1246 |

App-ready 기준:

| 항목 | 값 |
|---|---:|
| 원본 후보 | 6000 |
| 가격지표 app-ready key | 5641 |
| app-ready 후보 | 5641 |
| 가격지표 미준비 제외 후보 | 359 |
| app-ready US | 2973 |
| app-ready KR | 2668 |
| 6000 후보 market/ticker 중복 | 0 |

---

## 4. 핵심 데이터 관찰

### 4.1 기본 6000 후보 CSV

`src/data/tickers/finple_app_candidates_6000_balanced_v1.csv`는 후보군의 기본 틀이다.

핵심 지표 컬럼은 존재하지만 값은 비어 있다.

| 컬럼 | present | missing | zero | invalid |
|---|---:|---:|---:|---:|
| `expectedCagr` | 0 | 6000 | 0 | 0 |
| `beta` | 0 | 6000 | 0 | 0 |
| `mdd` | 0 | 6000 | 0 | 0 |
| `dividendYield` | 0 | 6000 | 0 | 0 |
| `marketCap` | 4383 | 1617 | 0 | 0 |
| `aum` | 0 | 6000 | 0 | 0 |

따라서 Data Sentinel은 기본 후보 CSV만 보면 핵심 지표가 모두 결측으로 보인다. 실제 앱 노출 기준은 price metrics overlay 병합 이후로 판단해야 한다.

### 4.2 가격지표 overlay

가격지표 app-ready overlay는 현재 앱 노출 가능성을 결정한다.

| 파일 | 행 수 | ready | short_history | review_required |
|---|---:|---:|---:|---:|
| `us_price_metrics_overlay_20260528_app_ready.csv` | 2973 | 2480 | 357 | 136 |
| `kr_price_metrics_overlay_20260528_app_ready.csv` | 2668 | 2322 | 346 | 0 |

주요 수치 관찰:

| 파일 | 컬럼 | present | missing | zero | invalid |
|---|---|---:|---:|---:|---:|
| US price overlay | `expectedCagr` | 2973 | 0 | 5 | 0 |
| US price overlay | `beta` | 2953 | 20 | 44 | 0 |
| US price overlay | `mdd` | 2973 | 0 | 1 | 0 |
| US price overlay | `dataYears` | 2973 | 0 | 1 | 0 |
| KR price overlay | `expectedCagr` | 2668 | 0 | 2 | 0 |
| KR price overlay | `beta` | 2668 | 0 | 57 | 0 |
| KR price overlay | `mdd` | 2668 | 0 | 0 | 0 |
| KR price overlay | `dataYears` | 2668 | 0 | 0 | 0 |

`beta` 결측과 0은 분리해서 다뤄야 한다. 특히 US overlay에는 `beta` missing 20건이 있다.

### 4.3 배당 overlay

배당률은 결측과 confirmed 0을 반드시 분리해야 한다.

| 파일 | 행 수 | dividendYield present | missing | zero |
|---|---:|---:|---:|---:|
| `us_dividend_overlay_20260527.csv` | 3000 | 2421 | 579 | 6 |
| `kr_etf_dividend_overlay_20260525.csv` | 922 | 922 | 0 | 2 |
| `kr_stock_dividend_overlay_20260525.csv` | 1246 | 1246 | 0 | 4 |

미국 배당 overlay의 `dividendPolicy` 분포:

| 정책 | 행 수 |
|---|---:|
| `dividend_confirmed` | 2285 |
| `dividend_review_required` | 711 |
| `no_dividend_confirmed` | 4 |

Data Sentinel은 `dividendYield`가 비어 있는 행을 무배당으로 해석하면 안 된다. `no_dividend_confirmed`와 결측은 별도 상태다.

---

## 5. Data Sentinel baseline에 넘길 기준

다음 단계인 Step 113-1B는 이 인벤토리를 기준으로 한다.

초기 규칙 후보:

```text
MDD_POSITIVE
MDD_OUT_OF_RANGE
BETA_MISSING
BETA_EXTREME
CAGR_EXTREME
DIVIDEND_MISSING
DIVIDEND_CONFIRMED_ZERO
DIVIDEND_REVIEW_REQUIRED
SHORT_HISTORY
PRICE_METRICS_REVIEW_REQUIRED
TICKER_FORMAT
REQUIRED_MISSING
```

첫 감사 대상은 기본 후보 CSV가 아니라 app-ready overlay 병합 후의 후보군이어야 한다.

권장 입력:

```text
base: src/data/tickers/finple_app_candidates_6000_balanced_v1.csv
price: src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
price: src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv
dividend: src/data/tickers/us_dividend_overlay_20260527.csv
dividend: src/data/tickers/kr_etf_dividend_overlay_20260525.csv
dividend: src/data/tickers/kr_stock_dividend_overlay_20260525.csv
```

---

## 6. 남은 모호성

1. `finple_app_candidates_6000_balanced_v1.csv`는 파일명에 날짜가 없고, 원천 기준일은 문서와 sourceUniverse를 함께 봐야 한다.
2. `finple_app_candidates_2000_final_v1.csv`는 overlay 역할로 남아 있으나 장기적으로는 current alias나 명확한 overlay 이름이 필요하다.
3. price metrics overlay의 `short_history`를 사용자용 경고로 바로 노출할지, 관리자 검토 항목으로만 둘지 결정이 필요하다.
4. US price overlay의 `beta` missing 20건은 Step 113-1B에서 별도 reason code로 다룬다.
5. 배당 overlay의 `dividend_review_required` 711건은 확정 배당률과 같은 정책으로 병합하면 안 된다.

---

## 7. 검증 명령

이번 인벤토리 생성에는 Codex 번들 Python을 사용했다.

```powershell
& 'C:\Users\lsw_2\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts\ml\audit_ml_data_inventory.py
```

일반 로컬 환경에서는 Python이 PATH에 있으면 다음 명령으로 실행할 수 있다.

```powershell
python scripts\ml\audit_ml_data_inventory.py
```
