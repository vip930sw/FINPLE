# FINPLE Step 103-8D — US Screener Candidates Expansion

## 작업 개요

미국 스크리너 후보군을 확장했습니다.

기존 파일은 유지하고, 확장 후보 파일을 별도로 추가했습니다.

```text
src/data/tickers/us_screener_candidates.csv        → 기존 미국 후보
src/data/tickers/us_screener_candidates_extra.csv  → 확장 미국 후보
```

화면에서는 두 파일을 합쳐 미국 스크리너 후보로 표시합니다.

## 확장 방향

이번 단계에서는 아래 후보를 보강했습니다.

```text
- S&P500 / 전체시장 / 나스닥100 대표 ETF
- 성장 / 가치 / 퀄리티 / 저변동 팩터 ETF
- 배당 / 인컴 ETF
- 채권 / 현금성 ETF
- 섹터 ETF
- 원자재 / 리츠 / 테마 ETF
- 레버리지 / 인버스 ETF
- 미국 대형 개별주
- 반도체 / 빅테크 / 금융 / 헬스케어 / 소비재 / 에너지 / 산업재 / 방산 / 통신 / 유틸리티 대표주
```

## 로더 구조

```text
US_SCREENER_CANDIDATES = US_CORE_CANDIDATES + US_EXTRA_CANDIDATES
```

중복 티커는 기존 후보를 우선 유지합니다.

## 지표 처리

아래 지표는 아직 공란으로 유지했습니다.

```text
expectedCagr / beta / mdd / dividendYield
```

장기 가격 데이터와 배당 데이터 확보 후 별도 단계에서 채우는 것이 적절합니다.

## 다음 단계

```text
Step 103-9. 스크리너 필터 UX 정리
Step 103-10. 한국 후보 포트폴리오 추가 기능 연결
Step 103-11. 장기 가격 데이터 / 배당 데이터 확보 방식 확정
```
