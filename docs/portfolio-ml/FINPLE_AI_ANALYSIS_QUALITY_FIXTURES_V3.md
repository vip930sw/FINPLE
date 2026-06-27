# FINPLE AI Analysis Quality Fixtures v3

작성일: 2026-06-27
대상 기능: 포트폴리오 AI 분석

## 목적

`ai-analysis-regression-fixtures-v3`는 live OpenAI 응답의 실제 화면 QA에서 반복 확인된 포트폴리오 구성을 regression fixture에 반영하기 위한 기준이다. 목표는 포트폴리오 AI 분석이 단순 설명문으로 흐르지 않고, 입력 지표와 자산 역할을 기준으로 구조, 위험 균형, 데이터 한계를 안정적으로 구분하는지 확인하는 것이다.

## 구현 파일

- `server/src/services/aiAnalysisRegressionFixtures.js`
- `server/src/services/aiPortfolioAnalysis.test.js`
- `server/src/services/aiPortfolioAnalysisMock.js`
- `server/src/services/aiOutputValidator.js`

## v3 확정 내용

- fixture version을 `ai-analysis-regression-fixtures-v3`로 올렸다.
- 최소 fixture 수를 6개로 확정했다.
- 기존 v2의 미국 ETF, 한국 숫자 ticker, 인컴, 방어형, 데이터 제한 포트폴리오를 유지한다.
- 운영 live 샘플에서 반복 확인된 `QQQ`, `SCHD`, `BND`, `TLT`, `VNQ`, `GLD`, `CASH` 구성의 균형형 성장 포트폴리오를 추가했다.
- required risk focus에 `live sample alignment`를 추가했다.
- required output checks에 `live sample fixture alignment`를 추가했다.

## v3 fixture 목록

| id | 목적 |
| --- | --- |
| `us-etf-core` | 미국 성장·배당·채권·금 혼합 기본형 |
| `kr-numeric-tickers` | 한국 숫자 ticker 검증과 한국 시장 맥락 |
| `income-cashflow` | 배당과 현금흐름 해석 |
| `defensive-bond-gold-reit` | 장기채·금·리츠 방어형 구조 |
| `missing-data-review` | 짧은 이력과 수동 입력 데이터 제한 |
| `live-balanced-growth-sample` | 실제 live 샘플 기반 성장 ETF 중심 균형형 구조 |

## 품질 판정 기준

fixture는 다음 조건을 통과해야 한다.

- request schema validation 통과
- mock output validation 통과
- `diagnosticSections` 정확히 3개 유지
- 모든 입력 자산에 대한 `assetRoles` coverage 유지
- 매수, 매도, 보유, 목표 비중, 수익 보장 표현 차단
- 입력에 없는 ticker와 숫자 언급 차단
- live 샘플 기반 fixture에서 성장 집중, 장기채 duration, 배당/현금흐름, 현금 buffer를 구분

## 운영 적용 기준

live OpenAI 응답 샘플은 비용이 발생하므로 자동 테스트에 포함하지 않는다. 대신 운영 화면에서 유의미한 반복 패턴이 확인되면 v3 fixture처럼 deterministic mock regression으로 흡수한다.

다음 v4 후보는 아래 경우에만 만든다.

- 한국+미국 혼합 실사용 포트폴리오 샘플이 3건 이상 축적됨
- 동일 구성에서 OpenAI 응답이 반복적으로 일반론으로 후퇴함
- 비용 정책 변경으로 daily limit 또는 retry count가 바뀌어 품질 편차가 커짐
- output contract 자체가 v3로 변경됨
