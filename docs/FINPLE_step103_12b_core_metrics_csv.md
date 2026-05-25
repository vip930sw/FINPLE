# FINPLE Step 103-12B — Core Metrics CSV Import

## 작업 개요

Colab v2.1 산출본을 기준으로 미국 핵심 후보 40개에 가격 기반 지표를 우선 반영했습니다.

## 반영 기준

```text
expectedCagr: Close 기준 10Y CAGR
mdd: Close 기준 10Y MDD
beta: 미국 자산은 SPY 기준
배당률: yfinance 기준 최근 12개월 배당률
```

## 반영 파일

```text
src/data/tickers/us_screener_candidates.csv
```

## 의도

PR #72에서 배당률 빈값을 `확인 중`으로 표시하도록 정리한 뒤, 기존 미국 핵심 후보 CSV에 지표값이 비어 있어 상단 카드가 미완성처럼 보이는 문제가 있었습니다.

이번 작업은 화면 상단에 우선 노출되는 미국 핵심 후보 40개를 먼저 정상화하는 1차 CSV 반영입니다.

## 후속 작업

```text
Step 103-12C. US extra 후보 전체 지표 반영
Step 103-12D. KR ETF / KR stock 가격 기반 지표 반영
Step 103-12E. 한국 배당/분배금 별도 보강
```
