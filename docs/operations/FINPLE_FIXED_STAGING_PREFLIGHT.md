# FINPLE 고정 Staging 설계 및 생성 전 Gate

기준일: 2026-08-06
상태: `DESIGN_AND_PREFLIGHT_ONLY` — 외부 리소스·DNS·환경변수는 아직 생성하거나 변경하지 않는다.

## 1. 브랜치 전략

- 이 사전준비는 `agent/fixed-staging-preflight`의 별도 Draft PR로 유지한다. PR #460과 `main`은 변경하지 않는다.
- 승인 후 장기 브랜치 `staging`을 현재 `main`에서 만들고, Vercel Staging과 Render Staging이 모두 이 브랜치만 추적한다.
- PR #460 candidate 배포 전 `git merge-base --is-ancestor 7401ebc2907380ba281d79adcd685a750e438d81 f48168a62f55e1ecf6fe7776baf7842654bea7bd`를 확인한다. 통과하면 `staging`만 candidate SHA로 fast-forward한다.
- frontend/backend는 플랫폼이 제공하는 `VERCEL_GIT_COMMIT_SHA`와 `RENDER_GIT_COMMIT`이 같은 40자리 candidate SHA일 때만 Gate를 연다.

## 2. Vercel Staging 프로젝트

- 별도 프로젝트 `finple-staging`을 같은 GitHub 저장소에 연결하고 Production Branch를 `staging`으로 지정한다.
- 별도 프로젝트 자체의 Production deployment를 Staging으로 사용한다. Vercel Custom Environment는 추가하지 않는다.
- 도메인은 `staging.finple.co.kr` 하나만 연결하고 Production 프로젝트의 환경변수를 복사하지 않는다.
- `VITE_FINPLE_API_BASE_URL=https://<render-staging-host>/api`만 Staging 값으로 설정한다.
- Deployment Protection을 사용할 경우 관리자 검증 계정만 허용한다. 로그인/session 검증을 막는 PR Preview 보호 흐름은 고정 Staging Gate에 사용하지 않는다.

Vercel은 한 저장소를 여러 프로젝트에 연결할 수 있고 프로젝트별 도메인·환경변수를 분리한다. 공식 근거: [Projects](https://vercel.com/docs/projects), [Custom domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## 3. Render Staging 서비스

- 별도 Web Service `finple-api-staging`, branch `staging`, root directory `server`.
- Build `npm install`, Start `npm start`, Health Check `/api/health`.
- auto-deploy는 `After CI Checks Pass`가 가능하면 사용하고, 최초 candidate는 배포 화면의 full commit SHA를 대조한 뒤 수동 승인한다.
- Free instance는 15분 유휴 후 sleep하므로 polling·timeout·session Gate에는 Starter 이상을 사용한다.
- production Render service의 환경 그룹을 연결하지 않는다.

공식 근거: [Render Web Services](https://render.com/docs/web-services), [Environment variables](https://render.com/docs/configure-environment-variables), [Free instance limitations](https://render.com/docs/free).

## 4. Supabase Staging 프로젝트

- 우선안은 별도 Supabase 프로젝트다. Production `DATABASE_URL`, project key, Auth user, Storage object, 운영 데이터는 복사하지 않는다.
- 최초 최소 schema는 `server/db/migrations/001_init.sql`, `server/db/migrations/002_auth_payment_operational_schema.sql`, `server/migrations/20260805_trading_kis_historical_capture.sql`만 순서대로 검토·적용한다.
- Shadow/feed checkpoint/runtime/strategy migration은 이 Gate에 필요하지 않으므로 적용하지 않는다.
- 관리자 로그인 검증용 계정은 승인 후 Staging에서 새로 만든 synthetic 계정 하나만 사용한다. credential이나 password hash를 repo에 넣지 않는다.
- `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Capture GET Gate에 필요하지 않으므로 미설정한다. Render에는 Staging project의 direct/pooler `DATABASE_URL`만 설정한다.
- 현재 Supabase changelog의 Management API `logs.all`, extension version pinning, `realtime` schema 제한은 위 SQL에 해당 호출·extension·schema 변경이 없어 직접 영향이 없다. 실제 생성 직전에 changelog를 다시 확인한다.

공식 근거: [Deployment and environment management](https://supabase.com/docs/guides/deployment), [Supabase pricing](https://supabase.com/pricing), [Changelog](https://supabase.com/changelog.md).

## 5. 환경변수와 안전 기본값

| 위치 | 이름 | 값/정책 |
|---|---|---|
| Vercel Staging | `VITE_FINPLE_API_BASE_URL` | `https://<render-staging-host>/api` |
| Render Staging | `CORS_ORIGIN` | 정확히 `https://staging.finple.co.kr` |
| Render Staging | `DATABASE_URL` | 별도 Supabase Staging URL, raw value 비공개 |
| Render Staging | `DATABASE_SSL` | `true` |
| Render Staging | `FINPLE_ADMIN_TOKEN` | Staging 전용 새 값, Production 값 재사용 금지 |
| Render Staging | `ASSET_DATA_PROVIDER` | `mock` |
| Render Staging | `FINPLE_AI_ANALYSIS_MODE` / `FINPLE_AI_ANALYSIS_PROVIDER` | `mock` / `none` |
| Render Staging | `FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED` | `false` |
| Render Staging | `FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED` | `false` |
| Render Staging | `FINPLE_TRADING_SHADOW_RUNTIME_ENABLED` | `false` |
| Render Staging | `FINPLE_TRADING_KIS_FEED_CHECKPOINT_ENABLED` | `false` |
| Render Staging | `FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED` | `false` |
| Render Staging | `FINPLE_TRADING_SCALPING_MODEL_SIGNAL_ENABLED` | `false` |
| Render Staging | `ALPHA_VANTAGE_FETCH_FX` / `ALPHA_VANTAGE_FETCH_OVERVIEW` | `false` / `false` |

KIS, Alpha Vantage, OpenAI, Production Supabase credential은 모두 미설정한다. API 응답 Gate에서도 `providerCallsAllowed`, `accountCallsAllowed`, `brokerOrderAdapterPresent`, `orderSubmissionAllowed`, `liveActivationAllowed`, `automaticRestartAllowed`, `automaticLiveActivationAllowed`는 모두 `false`여야 한다.

검사용 `FINPLE_STAGING_*` 값은 `npm run check:fixed-staging-preflight` 실행 시 operator shell에만 주입하는 attestation이며 배포 환경변수가 아니다. 검사 결과는 값이 아니라 boolean/reason만 출력한다.

## 6. CORS 정책

- 허용 origin은 `https://staging.finple.co.kr` 정확히 하나다.
- `*`, `true`, comma-separated Preview origin, `*.vercel.app`, 개별 PR Preview URL은 거부한다.
- `x-finple-admin-token`은 허용 header로 유지하되 Gate 보고에는 존재 여부만 기록하고 값은 기록하지 않는다.
- Production CORS 설정은 변경하지 않는다.

## 7. DNS 절차

1. 승인 후 Vercel Staging 프로젝트에 `staging.finple.co.kr`을 먼저 추가한다.
2. Vercel이 표시하는 프로젝트별 CNAME target을 확인한다.
3. 현재 `finple.co.kr` DNS provider에서 `staging` CNAME을 그 target으로 추가한다. 일반값을 추측해 입력하지 않는다.
4. Vercel Domain 화면의 verification과 TLS 발급을 확인한다.
5. DNS 전파 후 HTTPS 응답을 확인하고 그때 Render `CORS_ORIGIN`을 고정한다.

## 8. 예상 비용

2026-08-06 공식 공개가 기준이며 세금·초과 사용량은 별도다.

| 항목 | 예상 |
|---|---:|
| Vercel | Pro 팀 월 `$20`(월 `$20` usage credit 포함). 기존 Pro 팀의 별도 프로젝트면 추가 고정비 `$0` 가능 |
| Render | Web Service Starter 월 `$7`; Free는 sleep 때문에 Gate 비권장 |
| Supabase | Free active slot이 있으면 `$0`; 기존 Pro 조직의 추가 project는 월 `$10`부터; 새 Pro 조직이면 월 `$25`부터 |
| DNS | 기존 도메인의 subdomain record는 보통 추가 등록비 없음. DNS provider 정책 확인 |

따라서 예상 증분은 기존 유료 계정 여유에 따라 월 `$7`~`$37`, Vercel Pro와 Supabase Pro를 모두 새로 시작하면 약 `$52`부터다. 생성 화면의 최종 견적을 캡처해 승인받은 뒤 진행한다. 공식 근거: [Vercel pricing](https://vercel.com/pricing), [Render pricing](https://render.com/pricing), [Supabase pricing](https://supabase.com/pricing).

## 9. PR #460 candidate 배포

1. PR #460이 계속 Draft/Open/미병합이고 head가 `f48168a62f55e1ecf6fe7776baf7842654bea7bd`인지 재확인한다.
2. candidate가 기준 main `7401ebc2907380ba281d79adcd685a750e438d81`의 descendant인지 확인한다.
3. `staging` branch만 candidate SHA로 fast-forward하고 Vercel/Render 두 배포가 끝날 때까지 기다린다.
4. Vercel deployment SHA, Render deployment SHA, Capture GET의 `deploymentSha`가 모두 full SHA exact match일 때만 인증 Gate를 시작한다.

## 10. 인증 API·UI Gate

고정 origin에서 사용자가 직접 관리자 로그인한 뒤 토큰 값은 공유하지 않는다.

1. 로그인 후 새로고침·drawer reopen에도 session이 유지되는지 확인한다.
2. 브라우저 요청의 `x-finple-admin-token` header 존재 여부만 확인한다.
3. `GET /api/admin/trading-readiness/scalping-kis-capture`가 HTTP 200, `application/json`, `Cache-Control: no-store`인지 확인한다.
4. `schemaVersion`, `runtimeVersion`, `persistenceContractVersion`, `deploymentSha`를 확인한다.
5. Network timing으로 요청 single-flight, overlap 없음, 10초 timeout abort, 늦은 이전 응답의 state 반영 방지를 확인한다.
6. drawer close 즉시 in-flight abort와 다음 timer 중단, reopen 즉시 polling 재개를 확인한다.
7. Desktop 1440x900 및 Mobile 320x568, 375x667, 390x844에서 close/backdrop/ESC/focus/overflow/pathname을 재검증한다.
8. 응답·console·network·UI에 token, credential, account identifier, raw provider payload가 없는지 확인한다.

Capture·Shadow 시작 endpoint, 계좌·주문 endpoint는 호출하지 않는다.

## 11. Rollback·삭제

- 배포 문제: Vercel과 Render에서 직전 검증 deployment를 redeploy/rollback하고, `staging` branch와 `main`은 합치지 않는다.
- 환경 문제: Render service를 suspend해 트래픽을 먼저 차단한다.
- 폐기: Vercel domain 연결 제거 → DNS `staging` CNAME 제거 → Vercel project 삭제 → Render service 삭제 → synthetic fixture 확인 후 Supabase Staging project 삭제 순서로 진행한다.
- Production project/service/database에는 rollback 작업을 수행하지 않는다.

## 12. 사용자가 직접 해야 하는 설정

- 세 서비스의 plan/region/이름과 대시보드 최종 비용 승인
- GitHub repository access 승인 및 각 서비스의 `staging` branch 선택
- Staging 전용 DB URL과 관리자 token 생성·비공개 입력
- Vercel이 제시한 DNS CNAME 입력
- Supabase SQL 적용과 synthetic 관리자 계정 생성 승인
- 고정 origin에서 관리자 로그인

## 13. 자동화 가능한 설정

- `staging` branch ancestry/SHA parity 확인
- 이 문서의 환경 계약 검사: `npm run check:fixed-staging-preflight`
- CI 통과 후 두 플랫폼 candidate deploy 및 health wait
- HTTP 200/content-type/no-store/version/redaction GET Gate
- 브라우저 drawer/polling/viewport Gate의 증거 수집과 redacted 보고

## 14. 아직 실행하지 않은 작업

- Vercel/Render/Supabase 리소스 생성, plan 결제, DNS 변경
- 모든 Staging/Production 환경변수 변경
- Supabase migration 또는 fixture 적용
- `staging` remote branch 생성과 PR #460 candidate 배포
- PR #460 Ready 전환·merge, `main` 변경, Production 배포/승격
- KIS/provider 접속, token/quote, Capture/Shadow 시작, 계좌·주문 호출

외부 리소스 생성 승인 전 최종 상태는 `BLOCKED_PENDING_MANUAL_RESOURCE_APPROVAL`이다.
