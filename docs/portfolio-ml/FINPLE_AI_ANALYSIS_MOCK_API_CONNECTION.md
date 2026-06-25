# FINPLE AI Analysis Mock API Connection

작성일: 2026-06-26
작업 단계: Step 113-4B

## 요약

`/simulator`의 `STEP 4 AI 분석` 화면을 mock backend endpoint와 연결했다. 탭 진입만으로 API를 호출하지 않고, 사용자가 `AI 분석 생성` 버튼을 눌렀을 때만 현재 포트폴리오 입력값을 backend schema에 맞춰 전송한다.

## 구현 파일

- `src/components/portfolio/utils/buildAiAnalysisPayload.js`
- `src/components/portfolio/services/aiAnalysisService.js`
- `src/components/portfolio/components/AiAnalysisPanel.jsx`
- `src/components/PortfolioSimulator.jsx`
- `src/AiAnalysisPanel.css`

## 동작 흐름

1. STEP 4 화면은 기존 계산 결과와 자산 목록을 표시한다.
2. 사용자가 `AI 분석 생성` 버튼을 누른다.
3. `buildAiAnalysisPayload`가 현재 자산 평가금액 기준으로 비중을 계산한다.
4. 비중 합계는 backend validator 기준에 맞도록 100%에 가깝게 보정한다.
5. `aiAnalysisService`가 `POST /api/ai/portfolio-analysis`를 호출한다.
6. backend validator를 통과한 mock 응답만 STEP 4 결과 영역에 렌더링한다.

## 화면 상태

- `empty`: 분석 결과가 아직 없는 상태
- `loading`: 생성 요청 진행 중
- `success`: backend validator를 통과한 응답 표시
- `error`: 요청 실패 또는 검증 실패
- `stale`: 최근 분석 이후 포트폴리오 입력값이 변경됨

## 환경변수

이번 단계는 외부 AI provider를 호출하지 않으므로 OpenAI, Anthropic 등 신규 API key가 필요 없다.

### Vercel frontend

```env
VITE_FINPLE_API_BASE_URL=https://finple-api.onrender.com/api
VITE_FINPLE_ASSET_PROVIDER=backend
VITE_FINPLE_BACKEND_TIMEOUT_MS=12000
```

주의:

- `VITE_` 값은 브라우저에 노출된다.
- API key, DB URL, 관리자 토큰, service role key는 절대 `VITE_` 변수로 넣지 않는다.
- `VITE_FINPLE_API_BASE_URL`은 `/api`까지 포함해야 STEP 4 호출 URL이 `/api/ai/portfolio-analysis`로 만들어진다.

### Render backend

`server/render.yaml` 기준 mock 분석 관련 값은 다음과 같다.

```env
FINPLE_AI_ANALYSIS_MODE=mock
FINPLE_AI_ANALYSIS_PROVIDER=none
```

운영에서 함께 확인할 값:

```env
CORS_ORIGIN=https://finple.co.kr,https://www.finple.co.kr
ASSET_DATA_PROVIDER=alpha_vantage
ALPHA_VANTAGE_API_KEY=...
DATABASE_URL=...
DATABASE_SSL=true
```

## 제품 경계

- AI 분석은 기존 FINPLE 계산값을 다시 계산하지 않는다.
- 매수, 매도, 보유 추천과 목표 비중을 표시하지 않는다.
- mock 분석은 외부 AI API를 호출하지 않는다.
- 응답에는 입력 자산 외 ticker mention, 금지 표현, 숫자 hallucination을 허용하지 않는다.

## 검증

```powershell
npm.cmd run build
node --test server\src\services\aiPortfolioAnalysis.test.js
```

## 다음 단계

다음 단계는 `Step 113-4C live provider adapter`이다. 실제 AI provider를 붙이기 전에 provider interface, secret env, timeout/retry, audit logging, prompt/output regression 기준을 먼저 고정해야 한다.
