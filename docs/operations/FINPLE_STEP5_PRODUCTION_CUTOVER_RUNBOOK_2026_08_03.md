# FINPLE Step 5 Production Cutover Runbook

기준일: 2026-08-03

## 1. 배포 대상

```text
Repository: vip930sw/FINPLE
Approved main candidate: d274f5015f9451fa9ad522bc1735464035e2c45c
Current production branch: 444b7e11a80c18bcb6d417ebe24f04ec92323762
Commit distance: main is 3 commits ahead; production is 0 commits ahead
```

포함 커밋:

```text
84744611a34c7d7b195af9220faae5c1b9af731c
Docs: Prepare Step 5 Production external-shock handoff (#421)

48bb8f3282aa08fe6b9fe5520a8b09a30058bfd2
Step 5A: Connect Production external-shock core (#422)

d274f5015f9451fa9ad522bc1735464035e2c45c
Step 5B: Wire Production external-shock UI (#425)
```

PR #424 문서 handoff는 closed/unmerged이며 배포 대상에 포함되지 않는다.

## 2. 운영 원칙

- `main`과 Production 배포는 별도 승인 단계다.
- `production`은 배포 포인터이며 독립 커밋, merge commit, cherry-pick, force-push를 금지한다.
- 승인 SHA로 non-force fast-forward만 수행한다.
- Production 환경변수, Branch Tracking, alias/domain, CORS는 변경하지 않는다.
- rollback deployment는 삭제하지 않는다.
- Gate 1 실패 시 즉시 중단하고 추가 변경을 하지 않는다.

## 3. Gate 0 — 실행 전 read-only 확인

다음을 모두 확인한다.

```text
local main = origin/main = GitHub main = d274f5015f9451fa9ad522bc1735464035e2c45c
GitHub production = 444b7e11a80c18bcb6d417ebe24f04ec92323762
production..main = ahead 3 / behind 0
working tree clean
PR #425 merged
Issue #423 completed
PR #424 closed/unmerged
Vercel candidate deployment for d274f501 is Ready
Vercel Production branch tracking = production
current Production deployment ID and SHA recorded
rollback deployment ID and SHA recorded
Production environment variable names/scopes unchanged
```

현재 운영 도메인은 read-only로 HTTP 200을 확인한다.

## 4. Backend 영향 판정

Step 5A는 `server/src/services/scenario/externalShockEngine.js`를 변경했지만 Step 5 public UI는 브라우저 번들에서 이 모듈을 사용한다.

실행 전에 다음을 확인한다.

```text
1. Render runtime route/service가 변경된 externalShockEngine을 import하는가?
2. API route, DB schema, auth, payment, subscription, order/trading 계약 변경이 있는가?
```

판정:

- Render runtime import 또는 API 계약 변경이 있으면 Render를 먼저 승인 SHA로 배포하고 health 검증 후 frontend를 진행한다.
- Render runtime import가 없고 API 계약이 완전히 불변이면 `backend deployment: no-op / Render unchanged`로 기록한다.
- 불확실하면 frontend cutover를 중단한다.

## 5. Candidate 검증

아래 검사를 실행하고 모두 통과해야 한다.

```powershell
node --test src/components/portfolio/utils/externalShockScenarioAdapter.test.js
node --test src/components/portfolio/utils/step5ProductionScenarioService.test.js
node --test server/src/services/scenario/externalShockEngine.test.js
npm.cmd run check:scenario-metrics
npm.cmd run check:p3-step4-monthly-artifact
npm.cmd run check:step2-step3-integrated-qa
npm.cmd run check:plan-b-advanced-analysis-entitlements
npm.cmd run check:simulator-locked-step-personal-badge
npm.cmd run check:production-deployment-control
npm.cmd run build
npm.cmd run check:ai-production
git diff --check
```

보호 확인:

```text
canonical/public CSV diff 0
pinned monthly artifact 69 exact files
monthly pointer/index/shards diff 0
package/lock diff 0
Step 4/6/7 diff 없음
DB/auth/payment/subscription/trading diff 없음
```

## 6. Preview Gate

승인 SHA의 protected Preview에서 다음을 확인한다.

### Free

- Step 5 잠금 패널 유지
- Personal 배지와 가격표 계약 유지
- Step navigation과 mobile dropdown 정상

### Personal/Pro

- Step 5 진입 시 loading → ready 전환
- `주식시장 급락 · 중간 / 시장 충격 -20%`
- `주식시장 급락 · 강함 / 시장 충격 -35%`
- 기준/충격 경로 차트 표시
- 최종가치, MDD, 회복기간, 자산별 영향 표시
- high-Beta partial scenario에서 ready 결과 유지, blocked preset disabled
- raw error/status/hash/provenance 문구 비노출
- 과거 월간수익률 기반 결정론적 스트레스 테스트 고지 표시

### Viewport

```text
1440
1024
768
390
375
```

### Network/console

- 필요한 monthly shard만 요청
- duplicate shard request 없음
- missing artifact path 404
- unexpected 4xx/5xx 없음
- CORS 오류 없음
- 신규 console error 없음

기존 TradingView/`allowTransparency` 경고가 있다면 이번 diff와 무관한 기존 항목인지 분리 기록한다.

## 7. Production 승인 지점

Gate 0과 Preview Gate가 모두 통과한 후에만 사용자에게 다음 exact 변경을 승인받는다.

```text
Move GitHub production branch
from 444b7e11a80c18bcb6d417ebe24f04ec92323762
to   d274f5015f9451fa9ad522bc1735464035e2c45c
using one non-force fast-forward push.
```

승인 전에는 `production` ref를 이동하지 않는다.

## 8. Cutover 실행

승인 후 exact 명령:

```powershell
git fetch origin --prune
git push origin d274f5015f9451fa9ad522bc1735464035e2c45c:refs/heads/production
```

금지:

```text
--force
--force-with-lease
production checkout 후 merge
cherry-pick
merge commit
독립 commit
환경변수 변경
alias/domain 수동 변경
```

push 직후 다음을 확인한다.

```text
GitHub production SHA = d274f5015f9451fa9ad522bc1735464035e2c45c
Vercel 새 Production deployment 생성
Target = Production
Branch = production
Git SHA = d274f5015f9451fa9ad522bc1735464035e2c45c
Status = Ready / Current
```

## 9. Gate 1 — Postdeploy 필수 검사

다음을 모두 통과해야 한다.

```text
finple.co.kr HTTP 200
www.finple.co.kr HTTP 200 또는 기존 정상 redirect 계약
Vercel Current deployment SHA = d274f5015f9451fa9ad522bc1735464035e2c45c
API health 정상
DB readiness 정상
로그인/세션 유지 정상
구독 상태 조회 정상
Free Step 5 잠금 정상
Personal Step 5 Production 결과 정상
monthly manifest/index/필요 shard 정상
missing artifact path 404
unexpected 4xx/5xx 없음
CORS 오류 없음
신규 console error 없음
alias/domain/env scope 변경 없음
```

Gate 1 전부 통과하면 rollback을 실행하지 않는다.

## 10. Gate 2 — 기능 QA

최소 두 포트폴리오를 확인한다.

```text
일반 Beta 포트폴리오: moderate/severe 모두 ready
고 Beta 포트폴리오: partial scenario disabled 처리 또는 정책상 정상 blocked
```

확인:

- 선택 시나리오 전환
- 차트·요약 카드·비교표·가정표·자산 영향표
- 데이터 시작/종료 월
- 발생확률 미적용
- 모바일 selector/table/chart
- floating portfolio dropdown으로 포트폴리오 전환 시 재계산
- stale/raw error 노출 없음

## 11. Rollback

Cutover 전 기록한 exact Vercel rollback deployment ID를 사용한다.

Frontend 이상:

```text
vercel promote <ROLLBACK_DEPLOYMENT_ID>
```

그 후 확인:

```text
Production Current deployment = rollback target
Production domain HTTP 200
rollback SHA 일치
API/DB 정상
```

`production` 브랜치를 추가로 움직이지 않는다. 브랜치 포인터 원복이 별도로 필요하면 원인 분석과 별도 승인을 먼저 받는다.

Backend가 함께 배포됐고 문제가 있으면 직전 Render deployment로 원복한 뒤 health를 재검증한다.

## 12. 완료 보고

```text
main SHA
production SHA before/after
push 방식
Vercel deployment ID / Target / Branch / SHA / Ready / Current
Render deployment 여부와 SHA
API/DB 상태
Free/Personal QA
desktop/mobile QA
monthly artifact/network 검사
Gate 1/2 결과
rollback 실행 여부
환경변수/alias/domain 변경 여부
```
