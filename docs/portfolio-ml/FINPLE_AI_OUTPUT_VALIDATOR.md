# FINPLE AI Output Validator

작성일: 2026-06-25
작업 단계: Step 113-3B

## 요약

Step 113-3B에서는 `POST /api/ai/portfolio-analysis`가 반환하는 AI 분석 JSON의 출력 계약을 강화했다. 목적은 STEP 4 UI 연결 전에 응답 구조, 금지 표현, 숫자 환각, ticker 언급 범위를 서버에서 먼저 차단하는 것이다.

## 구현 파일

- `server/src/services/aiOutputValidator.js`
- `server/src/services/aiPortfolioAnalysis.test.js`

## Output Contract

contract version:

```text
ai-analysis-output-contract-v2
```

허용 top-level field:

```text
analysisVersion
portfolioId
generatedAt
mode
provider
inputHash
dataQuality
portfolioProfile
diversification
diagnosticSections
riskFactors
assetRoles
limitations
disclaimer
```

extra top-level field는 허용하지 않는다.

## 강화된 검증 항목

- 필수 top-level field 존재 여부
- mode/provider enum
- dataQuality level enum
- diversification level enum
- diagnostic section key enum
- risk severity enum
- asset role enum
- 문자열 최대 길이
- 전체 텍스트 최대 길이
- 배열 최대 개수
- 필수 disclaimer 포함
- 입력에 없는 ticker-like token 언급 차단
- 입력에 없는 numeric field 차단
- 설명 텍스트 안의 미입력 숫자 차단
- assetRoles가 입력 자산을 모두 포함하는지 검증
- assetRoles weight가 입력 weight와 일치하는지 검증
- diagnosticSections는 구조, 위험 균형, 현금흐름, 데이터 맥락 등 허용된 key만 사용하도록 검증

## 금지 표현

validator는 다음 계열 표현을 차단한다.

- 매수 추천
- 매도 추천
- 보유 추천
- 종목 추천
- 비중 추천
- 목표 비중
- 수익 보장
- 원금 보장
- 상승 확률
- 적정 매수가
- 목표 수익
- buy / sell / hold / recommendation
- guaranteed
- price target
- target allocation

## Numeric Hallucination Policy

AI 분석은 CAGR, beta, MDD, Calmar, 배당률, 미래가치, 자산 비중을 재계산하지 않는다. 출력 JSON의 숫자값과 설명 텍스트에 포함된 숫자는 입력 payload에 있는 값 또는 허용된 파생값이어야 한다.

현재 허용된 파생값:

- 입력 자산 수와 같은 `nominalAssetCount`

metadata 숫자는 이 검증에서 제외한다.

- `generatedAt`
- `inputHash`
- `analysisVersion`
- `portfolioId`

## Regression Tests

Node 내장 test runner로 다음 회귀 테스트를 고정했다.

- deterministic mock output
- invalid numeric request reject
- forbidden language reject
- generated numeric field reject
- output contract snapshot
- unexpected top-level field reject
- out-of-input ticker mention reject
- long text reject
- text numeric hallucination reject
- incomplete asset role coverage reject
- `ai-analysis-regression-fixtures-v3` request/mock validation
- fixture coverage for US/KR, data status, risk focus, and live sample alignment

## 다음 단계

다음 작업은 `Step 113-4A STEP 4 UI shell`이다. UI는 아직 mock API를 자동 호출하지 않고, 사용자가 명시적으로 요청했을 때만 backend endpoint를 호출하도록 설계해야 한다.
