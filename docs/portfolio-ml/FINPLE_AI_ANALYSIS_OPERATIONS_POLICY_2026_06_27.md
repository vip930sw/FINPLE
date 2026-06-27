# FINPLE AI Analysis Operations Policy - 2026-06-27

작성일: 2026-06-27
대상 저장소: `vip930sw/FINPLE`
대상 기능: 포트폴리오 AI 분석

## 목적

이 문서는 포트폴리오 AI 분석을 live OpenAI provider로 운영할 때의 접근 권한, 사용량 제한, 실패 처리, 비용 상한, 배포 확인 기준을 고정한다. 실제 투자 추천이나 매수/매도 판단을 생성하지 않는 기존 output validator 정책을 전제로 한다.

## 현재 운영 기준

운영 backend는 Render의 `finple-api` 서비스이며 AI provider key는 backend에만 둔다.

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

Vercel frontend에는 `OPENAI_API_KEY`를 설정하지 않는다.

## Personal 전용 전환 정책

공개 베타에서 Personal 전용으로 전환할 때 Render backend에 아래 값을 설정한다.

```env
FINPLE_AI_ANALYSIS_ACCESS_MODE=personal
FINPLE_AI_ANALYSIS_ALLOWED_PLANS=personal,pro
```

전환 전 QA 기준:

- guest 사용자는 `access.allowed = false`, `reason = "plan_required"`여야 한다.
- free 사용자는 `403` 응답과 함께 `access.reason = "plan_required"`를 받아야 한다.
- personal 사용자는 분석 요청이 허용되어야 한다.
- pro 사용자는 분석 요청이 허용되어야 한다.
- education entitlement 사용자는 서버에서 `plan = "personal"`로 승격된 뒤 허용되어야 한다.
- 포트폴리오 AI 분석 UI는 `access.allowed === false`일 때 분석 생성 대신 요금제 확인 안내를 표시해야 한다.
- free/guest 차단 상태에서는 남은 횟수 문구를 숨겨야 한다.

## 사용량 카운트 정책

AI 분석 요청은 provider 호출 전에 usage slot을 예약한다.

```text
reserved -> succeeded
reserved -> failed
reserved -> canceled
```

운영 비용 보호 기준:

- 성공한 요청은 사용량에 포함한다.
- provider 호출 또는 validator 실패로 끝난 요청은 `failed`로 기록한다.
- 요청 정규화 또는 access check에서 막힌 요청은 provider 호출 전 단계이므로 usage slot을 만들지 않는다.
- DB persistence가 가능하면 `ai_analysis_usage_events`를 기준으로 제한한다.
- DB persistence가 불가능하면 memory fallback이 동작하지만, 운영 판단은 `usagePolicy.persistence.available`을 먼저 확인한다.

## 비용 상한 기준

초기 운영값은 하루 20회 창으로 둔다.

```text
publicLimit = 20 / 24h
personalLimit = 20 / 24h
windowMs = 86400000
validationRetryCount = 1
providerRetryCount = 1
maxOutputTokens = 4200
```

비용이 예상보다 빠르게 증가하면 우선순위는 다음과 같다.

1. `FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW`를 낮춘다.
2. Personal 전용 모드로 전환한다.
3. `FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW`를 낮춘다.
4. validation/provider retry count를 0으로 낮춘다.
5. live mode를 mock으로 되돌린다.

## 운영 확인 API

Render 배포 commit:

```text
GET https://finple-api.onrender.com/api/health
```

확인값:

```text
deployment.branch = main
deployment.commitShortSha = 최신 main commit
```

AI 상태:

```text
GET https://finple-api.onrender.com/api/ai/portfolio-analysis/status
```

확인값:

```text
mode = live
provider = openai
usagePolicy.persistence.available = true
usage.storage = postgres
usage.remaining = number
access.allowed = true 또는 false
access.requiredPlans = ["personal", "pro"]
```

반복 smoke 확인:

```powershell
npm.cmd run check:ai-production -- --commit=<최신 main short sha>
```

이 스크립트는 Render health, 포트폴리오 AI 분석 status, 관리자 usage endpoint의 토큰 없는 403 정상 응답, Vercel frontend HEAD를 함께 확인한다.

관리자 사용량 요약:

```text
GET https://finple-api.onrender.com/api/admin/ai-analysis-usage
```

관리자 토큰이 없으면 `403 ADMIN_TOKEN_REQUIRED`가 정상이다. 관리자 콘솔에서는 `/admin/ai-usage`에서 같은 데이터를 표시한다.

## 회귀 테스트 기준

비용 없는 기본 검증:

```powershell
node --test server\src\services\aiPortfolioAnalysis.test.js server\src\services\aiAnalysisUsageControl.test.js server\src\services\aiAnalysisUsageRepository.test.js server\src\services\aiAnalysisEntitlementService.test.js server\src\services\aiAnalysisAccessControl.test.js
npm.cmd run build
```

live OpenAI 호출은 비용이 발생하므로 사용자가 명시적으로 요청할 때만 수행한다.

## 현재 진행률

2026-06-27 기준:

```text
포트폴리오 AI 분석 운영 안정화: 99%
남은 작업:
- 실제 운영 계정으로 Vercel 화면에서 free/personal/education UX를 최종 육안 확인
- 관리자 토큰으로 `/admin/ai-usage` 실데이터 화면을 주기적으로 확인
- live provider 품질 평가셋의 실제 OpenAI 응답 샘플을 누적해 fixture v3 후보 선별
```
