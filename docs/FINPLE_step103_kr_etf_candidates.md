# FINPLE Step 103-8C — KR ETF Candidates Expansion

## 작업 개요

한국 스크리너 Beta의 ETF 후보군을 확장했습니다.

기존 구조는 유지합니다.

```text
src/data/tickers/kr_screener_candidates.csv  → 한국 ETF 후보
src/data/tickers/kr_stock_candidates.csv     → 한국 개별주 후보
```

## 확장 방향

이번 단계에서는 아래 ETF 유형을 보강했습니다.

```text
- 국내 대표지수
- 미국 S&P500 / 나스닥100
- 미국 배당
- 국내 배당
- 머니마켓 / CD금리 / KOFR
- 단기채 / 국고채 / 미국채
- 금 / 원유 / 구리 / 은
- 리츠 / 인프라
- 반도체 / 2차전지 / AI전력 / 로봇 / 자동차 / 은행 / 헬스케어
- 레버리지 / 인버스
- 중국 / 베트남
- TRF / 혼합형
- 달러선물
```

## 태그 기준

기존 영문 태그를 줄이고 한글 태그를 보강했습니다.

```text
핵심 / 성장 / 배당 / 방어 / 공격형
대표지수 / 국내지수 / 해외지수 / 국내섹터 / 채권 / 현금성 / 금리형 / 원자재 / 리츠 / 혼합형 / 통화
```

## 지표 처리

아래 지표는 아직 공란으로 유지했습니다.

```text
expectedCagr / beta / mdd / dividendYield
```

장기 가격 데이터와 분배금 데이터 확보 후 별도 단계에서 채우는 것이 적절합니다.

## 다음 단계

```text
Step 103-8D. 미국 후보군 확장
Step 103-9. 스크리너 필터 UX 정리
Step 103-10. 한국 후보 포트폴리오 추가 기능 연결
```
