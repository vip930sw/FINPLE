# FINPLE Vercel Production 배포 제어

## 목적과 현재 상태

GitHub `main` 병합과 Vercel Production 배포를 분리한다. `main`은 단일 코드 기준으로 유지하고, PR과 일반 브랜치의 자동 Preview 배포는 계속 사용한다.

2026-08-02 감사 기준:

- GitHub `main`: `18626b606059d0b38d868fb74e3e1b070d535454`
- 현재 Production frontend: `dpl_DrYXqgqDed1vjTnZcpwrKXDKv8GB`
- 현재 Production frontend/backend 코드: `e0b12dc8d050332d9046d99024ccdfd76f37e8d9` (Plan-A)
- Vercel 플랜: Hobby
- Production branch: `main`
- Preview branch: Production에 배정되지 않은 모든 Git 브랜치
- Git 자동 배포: 연결됨
- 저장소 GitHub Actions에는 Vercel 배포 workflow 없음
- Ignored Build Step: 별도 override 없음
- Preview Deployment Protection: Vercel Authentication 사용

Production 환경에는 월간 artifact 설정 이름이 존재한다. 값은 이 문서에 기록하지 않는다.

- `VITE_FINPLE_MONTHLY_SCENARIO_ARTIFACT_ENABLED`
- `VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL`
- `VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256`
- `VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256`

## 사고 요약과 원인

PR #411 병합으로 `main`이 갱신되자 Vercel Git 연동이 새 Production deployment를 자동 생성하고 Production 도메인을 할당했다. 이는 Vercel이 Production branch로 지정된 브랜치의 push/merge를 자동 Production 배포하는 기본 계약과 일치한다.

검증된 Plan-A로 복구할 때 Hobby Instant Rollback은 바로 이전 Production까지만 허용되어 오래된 exact deployment 선택이 HTTP 402로 거부됐다. 별도 승인을 받아 `vercel promote dpl_DrYXqgqDed1vjTnZcpwrKXDKv8GB`로 복구했다. `vercel promote`는 현재 deployment를 바꾸는 명령이며, rollback 상태였다면 Production 도메인 자동 할당도 다시 활성화한다. 따라서 현재 `main`을 다시 push/merge하면 새 Production 배포가 생성될 수 있다.

## 대안 A-E

| 대안 | Preview 자동 배포 | `main` 병합과 Production 분리 | Hobby 적합성 | 운영 복잡도 | 판단 |
| --- | --- | --- | --- | --- | --- |
| A안: cutover 직전까지 `main` 병합 금지 | 유지 | 불완전 | 가능 | 낮음 | 병합 병목이 남아 비권장 |
| B안: 별도 `production` 브랜치 | 유지 | 명확 | 가능 | 낮음 | **권장** |
| C안: Git Production 자동 배포 비활성 + 수동 CLI deploy/promote | 설정·구현에 따라 유지 | 명확 | 가능 | 중간 | 환경 재현·권한 관리 부담 |
| D안: branch-aware Ignored Build Step | 유지 가능 | 우회적 | 가능 | 중간 | exit code 실수와 shallow clone 의존으로 비권장 |
| E안: GitHub Actions `workflow_dispatch` 배포 | 유지 가능 | 명확 | 가능 | 높음 | 토큰·secret·workflow 운영이 필요한 경우에만 검토 |

## 권장 모델: fast-forward-only `production` 브랜치

`production`은 개발 브랜치가 아니라 배포 포인터다. 독립 커밋, cherry-pick, force-push를 금지하고 승인된 `main` SHA로만 fast-forward한다.

이 모델은 다음을 동시에 만족한다.

- `main`은 단일 코드 source of truth다.
- PR 및 `main`을 포함한 비-Production 브랜치는 자동 protected Preview를 유지한다.
- main 병합과 Production 배포는 서로 다른 승인 단계다.
- backend-first 검증 후에만 frontend Production을 진행한다.
- Hobby에서도 추가 유료 기능이나 새 배포 도구 없이 동작한다.
- rollback target은 exact deployment ID와 40자리 commit SHA로 고정한다.

## 1회 설정 적용 기록

2026-08-02 별도 명시 승인에 따라 다음 설정을 적용했다.

1. Plan-A Production SHA `e0b12dc8d050332d9046d99024ccdfd76f37e8d9`에서 GitHub `production` 브랜치 생성
2. Vercel Production environment의 Branch Tracking을 `main`에서 `production`으로 변경
3. GitHub `production` 브랜치에 관리자 포함 linear history, force-push 금지, 삭제 금지 적용

승인된 SHA 포인터를 직접 fast-forward하는 운영을 유지하므로, GitHub 설정만으로 독립 fast-forward commit까지 완전히 차단하지 않는다. 독립 commit, cherry-pick, merge commit은 운영 절차로 금지하고 다음 non-force 명령만 사용한다.

```text
git push origin <APPROVED_MAIN_SHA>:refs/heads/production
```

이후 Branch Tracking, 보호 규칙 또는 `production` 이동은 다시 별도 승인을 받는다.

설정 중에도 다음 경계를 지킨다.

- 환경변수 scope 변경은 별도 승인
- Git integration 변경은 별도 승인
- wildcard CORS 금지 (`*`, `*.vercel.app` 모두 금지)
- alias/domain 변경 금지
- rollback deployment 삭제 금지

설정 직후 현재 Production deployment와 SHA가 유지됐고 새 Production deployment가 생성되지 않음을 확인했다. 이후 `main`의 새 commit이 Production을 바꾸지 않고 Preview만 만드는지도 첫 병합 때 재확인한다. 예상과 다르면 즉시 중단하고 기존 Branch Tracking으로 원복한다.

## 승인된 Production cutover 절차

### 1. 배포 대상 고정

- 배포할 `main`의 40자리 SHA를 기록한다.
- 해당 SHA의 protected Preview가 Ready인지 확인한다.
- Preview의 artifact/API/build 검사와 필요한 인증 QA를 완료한다.
- Production/Preview 환경변수 이름과 scope를 비교한다. 값을 문서나 로그에 복사하지 않는다.
- 직전 Production deployment ID와 SHA를 rollback target으로 기록한다.

### 2. Backend-first

1. 승인된 SHA의 backend를 Render에 먼저 배포한다.
2. API liveness, DB readiness, auth, subscription/payment, plan entitlement를 확인한다.
3. frontend가 요구하는 API와 artifact 계약이 준비됐는지 확인한다.
4. 오류가 있으면 frontend를 배포하지 않고 backend rollback을 수행한다.

### 3. Frontend 승인 및 배포

1. frontend Production promote 또는 `production` fast-forward는 별도 승인을 받는다.
2. 승인된 `main` SHA와 배포 후보 SHA가 exact match인지 재확인한다.
3. `production`을 승인 SHA로 fast-forward한다.
4. Vercel Production deployment가 Ready가 될 때까지 기다린다.
5. deployment ID, Git SHA, build environment를 확인한 뒤 도메인 응답을 검사한다.

merge와 promote를 한 명령, 한 workflow step, 한 승인으로 묶지 않는다.

## Postdeploy QA

- `finple.co.kr`과 `www.finple.co.kr` HTTP 200
- frontend/backend commit SHA가 승인값과 일치
- API/DB health 정상
- 로그인, 인증 유지, 구독·결제 상태 조회 정상
- Free/Personal 권한과 가격표 계약 일치
- Production monthly manifest/index/필요 shard JSON 정상
- missing artifact path가 SPA HTML 200이 아니라 404
- console error/warning 0, unexpected 4xx/5xx 0, CORS error 0
- 필요한 shard만 요청되고 중복 요청 없음
- Preview protection 유지
- alias/domain과 Production 환경변수 scope에 승인 밖 변경 없음

## Rollback

1. frontend 이상이면 기록한 exact rollback deployment를 `vercel promote <dpl_...>` 대상으로 사용한다.
2. Hobby Instant Rollback은 바로 이전 deployment만 지원하므로 오래된 target은 rollback 명령이 아니라 promote 경로가 필요할 수 있다.
3. frontend rollback 후 Production deployment ID와 SHA를 다시 확인한다.
4. backend가 함께 변경됐다면 기록한 직전 Render deployment로 원복하고 health를 재검증한다.
5. 원인 분석 전까지 `production` 브랜치를 추가로 이동하지 않는다.

rollback deployment 삭제 금지. rollback target의 deployment ID, SHA, frontend/backend 호환성을 cutover 전에 확인한다.

## 다음 `main` 병합 전 체크리스트

- [ ] 현재 Vercel Production Branch가 무엇인지 확인
- [ ] 이번 병합이 Production을 자동 생성하는지 확인
- [ ] Production 변경이 필요하면 별도 cutover 승인 존재
- [ ] Production 변경이 불필요하면 `main`이 Production Branch가 아님을 확인
- [ ] Preview exact SHA Ready 및 보호 상태 확인
- [ ] Production/Preview 환경변수 scope diff 확인
- [ ] rollback deployment ID/SHA/보존 상태 확인
- [ ] backend-first 순서와 health 검사 담당 확인
- [ ] frontend promote 또는 `production` fast-forward 별도 승인 확인
- [ ] alias/domain, CORS, 환경변수 변경 승인 범위 확인
- [ ] postdeploy 및 rollback 명령을 실행 전에 peer-check

## 정적 검사

```powershell
npm.cmd run check:production-deployment-control
```

이 검사는 저장소 파일만 읽는다. Vercel/Render/GitHub API 호출, Production 변경, 배포, promote, rollback을 수행하지 않는다.
