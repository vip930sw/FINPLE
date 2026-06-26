# FINPLE Asset Proxy

FINPLE 포트폴리오 앱에서 자산 데이터를 조회하기 위한 로컬 백엔드 프록시입니다.

## 실행

```bash
npm.cmd install
copy .env.example .env
npm.cmd run dev
```

## 기본 테스트

```text
http://localhost:5050/api/health
http://localhost:5050/api/assets/QQQ
```

## AI 분석 mock endpoint

Step 113-4B 기준 AI 분석은 외부 AI API를 호출하지 않는 mock 모드이며, 프론트엔드 STEP 4 화면의 버튼으로 호출됩니다.

```text
POST http://localhost:5050/api/ai/portfolio-analysis
```

필수 입력은 `assets` 배열입니다. 각 자산은 `ticker`, `market`, `weight`를 포함해야 하며 비중 합계는 100% 근처여야 합니다. 응답은 기존 FINPLE 계산값을 재계산하지 않고 포트폴리오 구조와 데이터 한계를 설명합니다.

mock 분석 운영값:

```env
FINPLE_AI_ANALYSIS_MODE=mock
FINPLE_AI_ANALYSIS_PROVIDER=none
```

외부 AI provider key는 아직 필요하지 않으며, 이후 live provider 연결 시에도 서버 전용 환경변수로만 관리합니다.

## AI 분석 live provider 준비

Step 113-4C 기준 live provider adapter는 서버에만 연결됩니다. 기본 배포값은 여전히 mock이므로 기존 화면 동작은 바뀌지 않습니다.

```env
FINPLE_AI_ANALYSIS_MODE=live
FINPLE_AI_ANALYSIS_PROVIDER=openai
OPENAI_API_KEY=sk-...
FINPLE_AI_OPENAI_MODEL=gpt-5.1
FINPLE_AI_OPENAI_TIMEOUT_MS=45000
FINPLE_AI_OPENAI_MAX_OUTPUT_TOKENS=4200
FINPLE_AI_OPENAI_RETRY_COUNT=1
FINPLE_AI_ANALYSIS_VALIDATION_RETRY_COUNT=1
FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW=20
FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW=20
FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS=86400000
```

주의:

- `OPENAI_API_KEY`는 Render backend 환경변수에만 저장합니다.
- Vercel의 `VITE_` 환경변수에는 AI provider key를 넣지 않습니다.
- live 응답도 서버 validator를 통과해야만 STEP 4 화면에 표시됩니다.
- provider 일시 실패나 validator 실패는 사용량 확정 전에 취소되어 사용자 남은 횟수를 차감하지 않습니다.
- 매수, 매도, 보유 추천이나 목표 비중, 목표가, 수익 보장 표현은 계속 차단됩니다.

운영 상태 확인:

```text
GET http://localhost:5050/api/ai/portfolio-analysis/status
```

Render 배포 커밋 확인을 위해 가능하면 backend 환경변수에 현재 커밋 SHA를 주입합니다. 값이 없으면 `/api/health`의 `deployment.commitSha`는 `null`로 내려갑니다.

```env
FINPLE_DEPLOY_COMMIT_SHA=<current git commit sha>
FINPLE_DEPLOY_BRANCH=main
FINPLE_DEPLOY_ENV=production
```

## Provider 설정

기본값은 `mock`입니다. 실제 Alpha Vantage 연결을 테스트하려면 `.env`를 아래처럼 수정합니다.

```env
ASSET_DATA_PROVIDER=alpha_vantage
ALPHA_VANTAGE_API_KEY=발급받은_API_KEY
ASSET_PRICE_CURRENCY=KRW
DEFAULT_USD_KRW_RATE=1350
```

`ALPHA_VANTAGE_FETCH_FX=true`로 설정하면 USD/KRW 환율도 Alpha Vantage에서 조회합니다. 다만 무료 호출량을 아끼기 위해 기본값은 `false`입니다.

`ALPHA_VANTAGE_FETCH_OVERVIEW=true`로 설정하면 이름, Beta, 배당률 등 일부 지표도 추가 조회합니다. ETF에 따라 일부 값은 비어 있을 수 있습니다.

## Step 45 — DB 연결 준비

서버 DB 저장 구조는 선택 사항입니다. `DATABASE_URL`이 없으면 기존 자산 조회/티커 검색 기능은 그대로 동작합니다.

DB 연결 상태 확인:

```text
http://localhost:5050/api/db/health
```

초기 스키마:

```text
server/db/migrations/001_init.sql
```
