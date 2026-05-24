# FINPLE Step 103-8A — KR Stock Candidates Expansion

## 1. 작업 개요

한국 스크리너 Beta의 `개별주` 필터가 비어 보이지 않도록 한국 개별주 후보군을 1차 확장했습니다.

기존 `kr_screener_candidates.csv`는 ETF 중심 후보군으로 유지하고, 이번 단계에서는 개별주 후보를 별도 파일로 분리했습니다.

```text
src/data/tickers/kr_screener_candidates.csv  → 한국 ETF 후보
src/data/tickers/kr_stock_candidates.csv     → 한국 개별주 후보
```

화면에서는 두 파일을 합쳐 한국 스크리너 후보로 표시합니다.

## 2. 추가 범위

이번 단계에서 한국 개별주 후보 53개를 추가했습니다.

구성은 아래와 같습니다.

```text
- 코스피 대형주 / 섹터 대표주
- 반도체
- 2차전지
- 자동차
- 플랫폼 / 인터넷
- 바이오 / 헬스케어
- 금융 / 배당
- 통신 / 소비재 / 방어주
- 조선 / 방산 / 산업재
- 코스닥 대표 성장주 일부
```

## 3. 지표 처리

아래 지표는 아직 공란으로 유지했습니다.

```text
expectedCagr
beta
mdd
dividendYield
```

현재 후보군은 장기 가격 데이터와 배당 데이터가 확보되기 전의 스크리너 표시용 초안입니다.

## 4. beginnerFit 기준

개별주는 ETF보다 종목 집중도가 높으므로 대부분 `beginnerFit=false`로 설정했습니다.

일부 금융, 통신, 소비재, 보험 등 상대적으로 방어적이거나 배당 성격이 강한 종목만 제한적으로 `true` 처리했습니다.

## 5. 다음 단계

```text
Step 103-8B. 한국 ETF 후보군 추가 확장
Step 103-8C. 미국 후보군 100~150개로 확장
Step 103-9. 한국 후보 포트폴리오 추가 기능 연결
Step 103-10. 장기 가격 데이터 / 배당 데이터 확보 방식 확정
```
