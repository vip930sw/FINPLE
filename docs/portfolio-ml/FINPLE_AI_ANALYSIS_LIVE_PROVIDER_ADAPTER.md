# FINPLE AI Analysis Live Provider Adapter

작성일: 2026-06-26
작업 단계: Step 113-4C

## 요약

STEP 4 AI 분석에 live provider adapter를 추가했다. 기본 배포값은 계속 mock이며, Render backend에서 아래 환경변수를 명시적으로 바꿔야 live 호출이 활성화된다.

```env
FINPLE_AI_ANALYSIS_MODE=live
FINPLE_AI_ANALYSIS_PROVIDER=openai
OPENAI_API_KEY=sk-...
FINPLE_AI_OPENAI_MODEL=gpt-5.1
FINPLE_AI_OPENAI_TIMEOUT_MS=20000
FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS=2200
```

## 구현 파일

- `server/src/services/aiPortfolioAnalysisOpenAi.js`
- `server/src/services/aiPortfolioAnalysisService.js`
- `server/src/routes/aiPortfolioAnalysisRoutes.js`
- `server/.env.example`
- `server/render.yaml`
- `server/README.md`

## 동작 원칙

1. `mock/none` 모드는 기존 deterministic mock 응답을 그대로 사용한다.
2. `live/openai` 모드에서만 OpenAI Responses API를 호출한다.
3. API key는 서버 환경변수 `OPENAI_API_KEY`로만 읽는다.
4. 모델 출력은 JSON schema 형식으로 요청한다.
5. 서버가 `analysisVersion`, `generatedAt`, `mode`, `provider`, `inputHash`를 붙인다.
6. 모든 live 응답은 기존 `validateAiPortfolioAnalysisOutput`을 통과해야 한다.

## 안전장치

- Vercel `VITE_` 변수에는 AI provider key를 넣지 않는다.
- 모델은 기존 입력값에 없는 숫자, ticker, 투자 추천 표현을 만들면 validator에서 차단된다.
- provider 오류, timeout, JSON parse 실패, validator 실패는 STEP 4 error 상태로만 노출된다.
- live provider 실패가 STEP 1~3 계산과 시뮬레이터 저장 흐름을 중단하지 않는다.

## 다음 작업

- Render staging 환경에서 `live/openai` 모드 smoke test
- provider 응답 실패율, latency, validator 실패 사유 로그 정리
- prompt regression fixture 추가
- 분석 결과 저장과 사용자별 조회 제한 설계
