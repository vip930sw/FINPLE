# FINPLE Step 103-5 — Ticker CSV Guide

## 1. 목적

미국 / 한국 포트폴리오 시뮬레이터와 자산 스크리너를 분리 운영하기 위해 티커 마스터와 스크리너 후보군 CSV 구조를 먼저 확정합니다.

이번 단계에서는 CSV 파일을 실제 화면에 연결하지 않습니다.

## 2. 파일 위치

```text
src/data/tickers/us_ticker_master.sample.csv
src/data/tickers/kr_ticker_master.sample.csv
src/data/tickers/us_screener_candidates.sample.csv
src/data/tickers/kr_screener_candidates.sample.csv
```

## 3. 티커 마스터 CSV

티커 마스터는 검색, 자동완성, API 호출 심볼 매칭을 위한 기준 파일입니다.

### 컬럼

```text
ticker
providerSymbol
nameKr
nameEn
market
exchange
currency
quoteCurrency
assetType
sector
isEtf
isActive
notes
```

### 설명

| 컬럼 | 설명 |
|---|---|
| ticker | 화면 표시와 사용자 검색에 쓰는 기본 티커입니다. 한국주식은 005930처럼 6자리 문자열을 유지합니다. |
| providerSymbol | API 호출 시 사용하는 심볼입니다. 초기에는 ticker와 동일해도 됩니다. |
| nameKr | 한국어 종목명입니다. |
| nameEn | 영문 종목명입니다. 없으면 비워둘 수 있습니다. |
| market | US 또는 KR입니다. |
| exchange | NASDAQ, NYSE, NYSEARCA, KRX 등입니다. |
| currency | FINPLE 화면 계산 기준 통화입니다. 현재는 KRW 기준입니다. |
| quoteCurrency | 원시 시세 통화입니다. 미국은 USD, 한국은 KRW입니다. |
| assetType | stock, ETF 등을 사용합니다. |
| sector | 섹터 또는 분류입니다. |
| isEtf | true 또는 false입니다. |
| isActive | 현재 검색/표시에 사용할지 여부입니다. |
| notes | 관리용 메모입니다. |

## 4. 스크리너 후보 CSV

스크리너 후보는 추천/필터링용 품질 관리 후보군입니다. 전체 종목을 모두 넣기보다, 초기에 검증된 후보만 넣는 것이 좋습니다.

### 컬럼

```text
ticker
nameKr
market
currency
quoteCurrency
assetType
strategy
riskLevel
expectedCagr
beta
mdd
dividendYield
goals
beginnerFit
tags
notes
```

### 설명

| 컬럼 | 설명 |
|---|---|
| ticker | 티커입니다. |
| nameKr | 화면에 표시할 한글명입니다. |
| market | US 또는 KR입니다. |
| currency | FINPLE 화면 계산 기준 통화입니다. |
| quoteCurrency | 원시 시세 통화입니다. |
| assetType | stock, ETF 등을 사용합니다. |
| strategy | core, growth, dividend, defensive, aggressive 등입니다. |
| riskLevel | low-medium, medium, medium-high, high, very-high 등입니다. |
| expectedCagr | 참고용 기대 CAGR입니다. 퍼센트 숫자만 입력합니다. |
| beta | 참고용 베타입니다. |
| mdd | 참고용 최대낙폭입니다. 음수 숫자만 입력합니다. |
| dividendYield | 참고용 배당률/분배금률입니다. |
| goals | core|growth처럼 파이프 문자로 여러 값을 연결합니다. |
| beginnerFit | 초보자 적합 여부입니다. true 또는 false입니다. |
| tags | 미국|대표지수|분산처럼 파이프 문자로 연결합니다. |
| notes | 관리용 메모입니다. |

## 5. 한국 CSV 작성 기준

한국 티커는 반드시 문자열로 관리해야 합니다.

```text
005930 O
5930 X
```

엑셀에서 열면 앞자리 0이 사라질 수 있으므로, CSV 편집 시 텍스트 형식으로 관리해야 합니다.

## 6. 초기 한국 후보군 제안

처음부터 전체 상장종목을 넣기보다 아래 범위부터 시작하는 것을 권장합니다.

```text
1. 코스피 대형주 30~50개
2. 코스닥 대표 성장주 20~30개
3. KODEX / TIGER / ACE / SOL / KBSTAR 주요 ETF
4. 코스피200 ETF
5. 미국 S&P500 / 나스닥100 추종 국내 ETF
6. 배당 ETF
7. 채권 ETF
8. 금 / 리츠 / 테마 ETF 일부
```

## 7. 미국 CSV 확장 기준

미국은 전체 검색용 마스터와 추천 후보군을 분리하는 것이 좋습니다.

```text
us_ticker_master.csv
- 2,000개 이상 가능
- 검색 / 자동완성 / API 심볼 매칭용

us_screener_candidates.csv
- 100~300개 권장
- 실제 스크리너 추천 후보용
```

## 8. 다음 단계

```text
Step 103-6. CSV 로더 유틸 추가
Step 103-7. 미국 스크리너 후보를 CSV 기반 구조로 이전
Step 103-8. 한국 스크리너 Beta에 샘플 후보 표시
Step 103-9. 한국 API PoC 검토
```
