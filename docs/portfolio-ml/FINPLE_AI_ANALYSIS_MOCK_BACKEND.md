# FINPLE AI Analysis Mock Backend

작성일: 2026-06-25
작업 단계: Step 113-3A

## 요약

`POST /api/ai/portfolio-analysis` mock backend를 추가했다. 이 endpoint는 외부 AI API를 호출하지 않고, 구조화된 포트폴리오 입력을 검증한 뒤 deterministic mock JSON을 반환한다.

## 구현 파일

- `server/src/routes/aiPortfolioAnalysisRoutes.js`
- `server/src/schemas/aiPortfolioAnalysisSchema.js`
- `server/src/services/aiPortfolioAnalysisService.js`
- `server/src/services/aiPortfolioAnalysisMock.js`
- `server/src/services/aiOutputValidator.js`
- `server/src/services/aiPortfolioAnalysis.test.js`

## Endpoint

```text
POST /api/ai/portfolio-analysis
```

기본 모드:

```text
FINPLE_AI_ANALYSIS_MODE=mock
FINPLE_AI_ANALYSIS_PROVIDER=none
```

## 입력 검증

요청은 JSON 객체여야 하며 최소 `assets` 배열이 필요하다.

검증 항목:

- 자산 수: 1~20개
- 필수 자산 필드: `ticker`, `market`, `weight`
- 비중 합계: 100% 기준 ±0.5%
- market: `US` 또는 `KR`
- 숫자 필드: finite number만 허용
- MDD: -100~0 범위
- CAGR/expectedCagr, beta, dividendYield, dataYears 범위 검증

잘못된 요청은 400을 반환한다.

## 출력 구조

응답의 `analysis`는 다음 필드를 포함한다.

```text
analysisVersion
portfolioId
generatedAt
mode
provider
dataQuality
portfolioProfile
diversification
riskFactors
assetRoles
limitations
disclaimer
inputHash
```

mock 응답의 `generatedAt`은 고정값이므로 같은 입력에 대해 같은 출력이 나온다.

## 출력 validator

`aiOutputValidator.js`는 다음을 검사한다.

- 필수 top-level field 존재
- `riskFactors`, `assetRoles`, `limitations` 배열 구조
- 금지 표현 탐지
- 입력에 없는 ticker-like token 차단
- 입력 숫자 또는 허용된 파생값이 아닌 numeric output 차단
- 필수 면책문구 포함

## 제품 경계

mock backend는 다음을 하지 않는다.

- 외부 LLM 호출
- CAGR, beta, MDD, Calmar, 배당률, 미래가치 재계산
- 매수/매도/종목 추천 생성
- 사용자별 목표 비중 지시
- 비밀값을 frontend에 노출

## 다음 단계

다음 작업은 `Step 113-3B output validator`이다. 3A에서 기본 validator를 넣었지만, 다음 단계에서는 UI 연결 전 금지문구 사전, 길이 제한, schema snapshot, 실패 케이스를 더 촘촘하게 확장한다.
