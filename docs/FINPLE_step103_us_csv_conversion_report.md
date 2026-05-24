# FINPLE Step 103-6B — US CSV Draft Conversion Report

## 1. 작업 개요

업로드된 미국 Nasdaq Screener CSV 2개를 FINPLE 데이터 구조에 맞춘 CSV 초안으로 변환했습니다.

이번 단계는 화면 연결 단계가 아니며, 미국주식/ETF 검색 및 스크리너를 CSV 기반 구조로 옮기기 위한 데이터 초안 생성 단계입니다.

## 2. 원본 파일

```text
nasdaq_screener_1779598386546.csv
nasdaq_etf_screener_1779598693262.csv
```

## 3. 생성 대상 파일

```text
src/data/tickers/us_stock_master.csv
src/data/tickers/us_etf_master.csv
src/data/tickers/us_ticker_master.csv
src/data/tickers/us_market_snapshot_20260524.csv
src/data/tickers/us_screener_candidates.csv
src/data/tickers/us_csv_quality_report.json
```

## 4. 변환 결과

| 항목 | 건수 |
|---|---:|
| 미국 주식/상장증권 원본 행 | 7,141 |
| 미국 ETF 원본 행 | 4,553 |
| 미국 통합 티커 마스터 가능 행 | 11,694 |
| 현재가 snapshot 가능 행 | 11,694 |
| 미국 스크리너 후보 초안 | 60 |

## 5. 이번 PR 반영 기준

전체 마스터 CSV는 파일 크기와 품질 검토 필요성이 있어 이번 단계에서는 repo에 직접 반영하지 않습니다.

이번 PR에는 아래 파일만 반영합니다.

```text
src/data/tickers/us_screener_candidates.csv
src/data/tickers/us_csv_quality_report.json
docs/FINPLE_step103_us_csv_conversion_report.md
```

## 6. 아직 비워둔 지표

`us_screener_candidates.csv`의 아래 지표는 아직 비워두었습니다.

```text
expectedCagr
beta
mdd
dividendYield
```

현재 CSV가 현재가, 시가총액, 거래량 중심의 단면 자료이기 때문입니다. CAGR, BETA, MDD는 장기 가격 시계열이 필요하고, Yield는 최근 12개월 배당/분배금 데이터가 필요합니다.

## 7. 데이터 품질 메모

```text
- 미국 주식 원본에는 보통주 외 특수 상장증권이 섞여 있을 수 있음
- ETF 원본은 세부 분류가 부족하여 strategy/riskLevel/tags는 휴리스틱 분류
- 거래소 구분은 별도 보강 필요
- 현재 snapshot은 장기 성과 계산용 데이터가 아님
- 스크리너 후보는 대표 ETF + 주요 대형주 중심의 초안
```

## 8. 다음 단계

```text
Step 103-7. CSV 로더 유틸 추가
Step 103-8. 한국 스크리너 Beta에 CSV 후보 일부 표시
Step 103-9. 미국 스크리너 하드코딩 후보를 CSV 기반으로 이전
Step 103-10. 장기 가격 데이터 / 배당 데이터 확보 방식 확정
```
