# FINPLE AI Analysis Handoff - 2026-06-27

작성일: 2026-06-27
대상 저장소: `vip930sw/FINPLE`
기준 브랜치: `main`

이 문서는 이전 Codex 채팅 `AI 분석 문서 읽기`와 현재 채팅 `FINPLE main AI step`에서 진행한 STEP 4 AI 분석 작업을 새 채팅으로 넘기기 위한 인수인계 기록입니다.

## 현재 결론

- STEP 4 AI 분석은 live OpenAI provider, 결과 저장, 진단 요약 UI, 한국 자산 반영, DB 기반 사용량 기록, 사용량 상태 표시까지 연결되었습니다.
- 운영 백엔드 Render는 최신 커밋 반영 여부를 `/api/health`의 deployment commit으로 확인할 수 있습니다.
- 운영 AI 상태는 `/api/ai/portfolio-analysis/status`에서 확인합니다.
- 현재 status 응답은 `usage.storage = "postgres"`와 남은 사용량을 내려주도록 구성되어 있습니다.
- 남은 큰 작업은 관리자 대시보드 UI, AI 품질 평가셋, Personal 전용 운영 전환, 비용 상한 정책의 실제 운영값 확정입니다.

## 이전 채팅: AI 분석 문서 읽기

이전 채팅 제목은 `AI 분석 문서 읽기`였고, 작업 기준은 GitHub 저장소 `vip930sw/FINPLE`의 `main` 브랜치였습니다.

주요 흐름:

1. 기존 AI/ML 문서와 STEP 113 계획을 읽고 STEP 4 AI 분석 개발 흐름을 정리했습니다.
2. mock backend와 output validator를 기반으로 STEP 4 UI를 연결했습니다.
3. live provider adapter를 추가했습니다.
   - 커밋: `22bced4 Add AI analysis live provider adapter`
   - OpenAI Responses API용 서버 provider 모듈 추가
   - 기본 운영은 mock 유지, `FINPLE_AI_ANALYSIS_MODE=live`와 `FINPLE_AI_ANALYSIS_PROVIDER=openai`일 때만 live 호출
   - OpenAI key는 Render backend에만 설정하고 Vercel에는 두지 않는 원칙을 문서화
4. OpenAI quota/billing 429를 확인했고, 사용자가 결제/credit을 반영한 뒤 live smoke test를 다시 수행했습니다.
5. live 응답이 validator를 통과하도록 프롬프트와 validator feedback을 조정했습니다.
   - 커밋: `29d9361 Tighten live AI analysis validation feedback`
   - 텍스트 필드의 숫자/퍼센트 hallucination 억제
   - validator 실패를 더 명확하게 확인할 수 있도록 조정
6. 결과 저장과 stale 상태 처리를 붙였습니다.
   - `b073799 Persist AI analysis results locally`
   - `c4f4619 Refine AI analysis result hierarchy`
7. 진단 요약 계약과 UI를 추가했습니다.
   - `138a26e Add AI analysis diagnostic sections`
   - `diagnosticSections`를 output contract, OpenAI JSON schema, mock output, STEP 4 결과 UI에 반영
8. OpenAI JSON 안정화와 v1 캐시 무효화를 처리했습니다.
   - `70b54d0 Stabilize AI analysis OpenAI JSON output`
   - `daec1dc Invalidate saved AI analysis v1 cache`
   - 응답 길이 부족으로 JSON이 잘리는 문제를 줄이고, 구버전 cache가 새 UI처럼 보이지 않는 문제를 방지

## 현재 채팅에서 진행한 작업

현재 채팅은 `daec1dc` 이후 `main`에서 이어서 진행했습니다.

주요 커밋:

- `d0e7d18 Stabilize AI analysis UX and usage limits`
  - 로딩 스피너와 상태 UX 보강
  - 사용량 제한의 기본 틀 추가
  - 화면 회색 공백 문제 개선
- `5f64cc6 Improve AI analysis reliability controls`
  - live 응답 성공률을 높이기 위한 retry/validation 흐름 보강
- `f59b8fb Expose AI analysis deployment status`
  - Render 배포 commit metadata 확인용 health/status 보강
- `41fe3ab Support Korean assets in AI analysis refresh`
  - 한국 숫자 ticker 검증 허용
  - stale cache가 기존 미국 자산 결과를 계속 보여주는 문제 방지
- `0c24a39 Persist AI analysis usage controls`
  - `ai_analysis_usage_events` 테이블과 DB 기반 사용량 기록 추가
  - `user_entitlements` 기반 Personal/pro 권한을 AI 분석 접근 정책에 연결
- `a3ef043 Expose AI usage persistence status`
  - status API에서 usage persistence 준비 상태를 확인 가능하게 함
- `39a00a9 Auto-ensure AI usage storage schema`
  - 운영 DB에서 usage table이 없으면 안전하게 자동 생성
  - status에서 `persistence.available = true`까지 확인 가능
- `7144cc0 Strengthen AI analysis output quality`
  - `diagnosticSections`를 정확히 세 개로 고정
  - 중복 진단 key 방지
  - `assetRoleHints`, `cashflow`, `riskSignals`를 OpenAI 입력에 추가
- `c538b95 Surface AI analysis usage controls`
  - status API가 현재 사용자/IP 기준 `used`, `remaining`, `resetAt`, `storage`를 내려줌
  - STEP 4 화면이 분석 전에도 남은 횟수를 표시
  - 관리자 API `/api/admin/ai-analysis-usage` 추가

이번 문서 작성 직전 마지막 추가 작업:

- Personal 전용 운영 전환을 대비해 access 상태 계산을 `aiAnalysisAccessControl` 서비스로 분리했습니다.
- status API에 `access` 객체를 내려주도록 연결했습니다.
- 403 응답에도 `access` 정보를 포함하도록 보강했습니다.
- STEP 4 화면은 `access.allowed === false`일 때 분석 버튼을 막고 Personal 안내 문구를 보여줍니다.

## 이후 추가 진행

커밋 `cf81704 Connect AI usage admin summary`:

- 관리자 콘솔에 `/admin/ai-usage` 메뉴와 AI 사용량 요약 패널을 연결했습니다.
- `/api/admin/ai-analysis-usage` 응답을 frontend admin UI에서 표시합니다.
- 403/429 응답의 `access`와 `usage` payload를 STEP 4 frontend service가 보존하도록 보강했습니다.
- AI 품질 평가셋 v1 fixture를 추가하고 mock output/validator 회귀 테스트에 연결했습니다.

이번 후속 단계:

- Personal 전용 모드에서 guest/free 차단, personal/pro 허용, education entitlement 허용 테스트를 보강했습니다.
- 비용/사용량 운영 정책을 `FINPLE_AI_ANALYSIS_OPERATIONS_POLICY_2026_06_27.md`로 문서화했습니다.
- 2026-06-27 기준 STEP 4 AI 분석 운영 안정화 진행률은 약 92%입니다.

## 현재 운영 확인 포인트

Render backend:

```text
GET https://finple-api.onrender.com/api/health
```

확인할 값:

```text
deployment.branch = main
deployment.commitShortSha = 최신 main 커밋
```

AI analysis status:

```text
GET https://finple-api.onrender.com/api/ai/portfolio-analysis/status
```

확인할 값:

```text
mode = live
provider = openai
usagePolicy.persistence.available = true
usage.storage = postgres
usage.remaining = number
access.allowed = true 또는 false
```

Vercel frontend:

```text
GET https://finple.co.kr/
```

확인할 값:

```text
production JS bundle 안에 /ai/portfolio-analysis/status 문자열 존재
```

## 환경변수 기준

Render backend에만 설정:

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

Personal 전용으로 전환할 때:

```env
FINPLE_AI_ANALYSIS_ACCESS_MODE=personal
FINPLE_AI_ANALYSIS_ALLOWED_PLANS=personal,pro
```

주의:

- `OPENAI_API_KEY`는 Vercel frontend에 절대 넣지 않습니다.
- 현재 status API는 access 상태를 내려주므로 Personal 전용 모드 전환 전에 UI 차단 상태를 확인할 수 있습니다.

## 검증 이력

반복 검증:

```powershell
node --test server\src\services\aiPortfolioAnalysis.test.js server\src\services\aiAnalysisUsageControl.test.js server\src\services\aiAnalysisUsageRepository.test.js server\src\services\aiAnalysisEntitlementService.test.js
npm.cmd run build
```

현재 추가된 access control 테스트:

```powershell
node --test server\src\services\aiAnalysisAccessControl.test.js
```

운영 확인:

```powershell
curl.exe -sS https://finple-api.onrender.com/api/health
curl.exe -sS https://finple-api.onrender.com/api/ai/portfolio-analysis/status
```

## 다음 채팅에서 우선 진행할 작업

1. Personal 전용 환경변수 실제 적용 후 운영 smoke QA
   - guest/free 사용자 차단
   - personal/pro 사용자 허용
   - education entitlement 사용자 허용
2. 관리자 토큰으로 `/admin/ai-usage` 실데이터 화면 확인
3. live provider 품질 평가셋의 실제 OpenAI 응답 샘플 축적
   - 미국 ETF-only
   - 한국 numeric ticker 포함
   - 배당/현금흐름형
   - 장기채/금/리츠 방어형
   - 데이터 결측/제한 케이스
4. 비용 추이를 본 뒤 public/personal limit 조정 여부 결정

## 새 채팅 첫 메시지

아래 메시지를 새 Codex 채팅 첫 메시지로 사용하세요.

```text
FINPLE 저장소 vip930sw/FINPLE의 main 브랜치에서 이어서 작업해주세요.

이전 작업은 STEP 4 AI 분석 고급화와 운영 안정화입니다.
반드시 실제 GitHub 저장소 소스 기준으로 작업하고, 시작 시 로컬/원격 main 및 Render/Vercel 배포 상태를 확인해주세요.

먼저 아래 문서를 읽어 현재 상태를 파악해주세요.
- docs/portfolio-ml/FINPLE_AI_ANALYSIS_HANDOFF_2026_06_27.md
- docs/portfolio-ml/FINPLE_AI_ANALYSIS_LIVE_PROVIDER_ADAPTER.md
- docs/portfolio-ml/FINPLE_AI_ANALYSIS_DIAGNOSTIC_SECTIONS.md
- docs/portfolio-ml/FINPLE_AI_OUTPUT_VALIDATOR.md

현재 완료된 큰 축:
- live OpenAI provider 연결
- 진단 요약 diagnosticSections UI/contract
- AI 분석 결과 local cache schema v2
- 한국 숫자 ticker 반영
- DB 기반 usage persistence
- status API의 usage snapshot
- 관리자 usage summary API
- Personal/pro entitlement 기반 access control 초안

다음 우선순위:
1. 최신 main과 운영 배포 commit 확인
2. status API에서 usage/access가 정상 노출되는지 확인
3. Personal 전용 모드 전환 QA 및 프론트 안내 UX 보강
4. 관리자 AI 사용량 요약 UI 연결
5. AI 품질 평가셋 및 regression fixture 설계
6. 비용/사용량 운영 정책 확정

작업 후에는 테스트와 build를 실행하고, 커밋/푸시 및 Render/Vercel 반영 여부까지 확인해주세요.
```

## 새 채팅에서 피해야 할 것

- OpenAI key를 frontend/Vercel에 넣지 않습니다.
- 사용자가 명시하지 않는 한 live OpenAI 호출을 반복적으로 수행하지 않습니다. 비용이 발생할 수 있습니다.
- 기존 사용자 변경이나 unrelated dirty worktree를 되돌리지 않습니다.
- AI 분석 결과를 투자 추천/매수/매도/목표비중으로 표현하지 않습니다.
