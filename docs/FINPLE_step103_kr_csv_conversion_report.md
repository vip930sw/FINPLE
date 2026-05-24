# FINPLE Step 103-6 — KR CSV Draft Conversion Report

## 1. 작업 개요

업로드된 한국 XLSX 자료 2개를 FINPLE 데이터 구조에 맞춘 CSV 초안으로 변환했습니다.

이번 단계는 화면 연결 단계가 아니며, 한국주식/ETF 검색·스크리너 확장을 위한 데이터 초안 생성 단계입니다.

## 2. 원본 파일

```text
data_0432_20260524.xlsx — 한국 주식 현재 시세 자료
data_0338_20260524.xlsx — 한국 ETF/ETN 계열 현재 시세/NAV/기초지수 자료
```

## 3. 생성 대상 파일

```text
src/data/tickers/kr_stock_master.csv
src/data/tickers/kr_etf_master.csv
src/data/tickers/kr_ticker_master.csv
src/data/tickers/kr_market_snapshot_20260524.csv
src/data/tickers/kr_screener_candidates.csv
src/data/tickers/kr_csv_quality_report.json
```

## 4. 변환 결과

| 항목 | 건수 |
|---|---:|
| 한국 주식 원본 행 | 2,878 |
| 한국 주식 마스터 | 2,878 |
| 한국 ETF/ETN 원본 행 | 1,115 |
| 한국 ETF/ETN 마스터 | 1,115 |
| 한국 통합 티커 마스터 | 3,993 |
| 현재가 snapshot | 3,993 |
| 한국 스크리너 후보 초안 | 190 |

## 5. 종목코드 처리

한국 주식의 일반 6자리 숫자 종목코드는 문자열로 보존했습니다.

```text
005930
000660
035420
```

다만 우선주, 스팩, 일부 신종증권에는 아래처럼 영문 혼합 코드가 존재합니다. 이 값들도 숫자로 강제 변환하지 않고 문자열 그대로 보존했습니다.

```text
00104K, 37550L, 37550K, 0099X0, 0037T0, 0072Z0, 38380K, 03473K
```

ETF/ETN 계열에도 아래처럼 영문 혼합 코드가 존재합니다. 이 값들 역시 문자열 그대로 보존했습니다.

```text
0184E0, 0182R0, 0182S0, 0103T0, 0131W0, 0026S0, 0052S0, 0069M0
```

## 6. 이번 단계에서 의도적으로 비워둔 값

`kr_screener_candidates.csv`의 아래 지표는 아직 비워두었습니다.

```text
expectedCagr
beta
mdd
dividendYield
```

이유는 현재 XLSX 자료가 현재가·거래량·시총·NAV 중심의 단면 자료이기 때문입니다. CAGR, BETA, MDD는 장기 가격 시계열이 필요하고, Yield는 최근 12개월 배당/분배금 데이터가 필요합니다.

## 7. 데이터 품질 메모

```text
- 한국 주식 일반 6자리 숫자 코드는 정상 보존
- 우선주/스팩/일부 상품의 영문 혼합 코드는 문자열로 보존
- ETF/ETN의 영문 혼합 코드는 문자열로 보존
- 현재 snapshot은 장기 성과 계산용 데이터가 아님
- 스크리너 후보는 시총 상위 주식 + 주요 ETF를 기반으로 한 초안
- strategy/riskLevel/tags는 휴리스틱 분류이며 추후 수동 검토 필요
```

## 8. 다음 단계

```text
Step 103-7. CSV 로더 유틸 추가
Step 103-8. 한국 스크리너 Beta에 CSV 후보 일부 표시
Step 103-9. 한국 장기 가격 데이터 / 배당 데이터 확보 방법 확정
```
