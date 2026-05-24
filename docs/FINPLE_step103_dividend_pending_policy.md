# FINPLE Step 103-12A — Dividend Pending Policy

## 작업 개요

한국 자산 배당률 데이터가 아직 안정적으로 확보되지 않은 상태에서, `0.00`과 `미확인`이 혼동되지 않도록 표시 정책을 정리했습니다.

## 변경 사항

```text
- 스크리너 카드에서 dividendYield 빈값은 “확인 중”으로 표시
- 포트폴리오 입력 표에서 dividendYield 빈값은 “확인 중”으로 표시
- 자산 정규화 시 dividendYield 빈값을 0으로 강제 변환하지 않고 null로 보존
- 후보 자산 추가 시 dividendYield가 비어 있으면 null 상태 유지
- 계산 로직에서는 기존처럼 null을 0으로 안전 계산
```

## 정책 기준

```text
0.00%
- 실제 무배당 또는 최근 12개월 배당 없음으로 확인된 값

확인 중
- 데이터 미확보
- 한국 ETF 분배금/한국 주식 배당률 미반영
- 추후 별도 보강 필요
```

## v1 적용 범위

```text
사용 가능
- expectedCagr
- beta
- mdd

미반영/보강 필요
- 한국 자산 dividendYield
- 한국 ETF 분배금
- 한국 개별주 배당률
```

## 다음 단계

```text
Step 103-12B. 한국 배당/분배금 데이터 수집 방식 검토
Step 103-12C. Colab 산출 CSV를 앱 CSV로 반영
```
