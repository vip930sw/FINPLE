# FINPLE Step 5 Production Codex Chat Starter

아래 내용을 문서 PR이 `main`에 병합된 뒤 Codex 새 채팅에 그대로 붙여 넣는다.

---

FINPLE 프로젝트의 Step 5 Production 외부충격분석 작업을 시작합니다.

Repository:

```text
vip930sw/FINPLE
```

Default branch:

```text
main
```

GitHub Issue:

```text
#420 Step 5A: Connect Production monthly returns to external-shock core
```

작업 브랜치:

```text
codex/step5a-production-external-shock-core
```

## 1. 시작 전 확인

수정 전에 read-only로 다음을 확인하고 보고해주세요.

```text
1. local main SHA
2. origin/main SHA
3. GitHub main SHA
4. 세 SHA 일치 여부
5. working tree clean 여부
6. repo-local 또는 parent AGENTS.md 존재 여부
7. Issue #420과 중복되는 open PR/branch 존재 여부
8. 아래 2026-08-03 문서가 main에 존재하는지
```

세 SHA가 다르거나 worktree가 깨끗하지 않으면 수정하지 말고 중단해주세요.

## 2. 필수 문서

아래 순서대로 읽어주세요.

```text
docs/portfolio-ml/FINPLE_STEP5_PRODUCTION_EXTERNAL_SHOCK_DEVELOPMENT_NOTE_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP5_PRODUCTION_WORK_INSTRUCTIONS_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP114_2H_EXTERNAL_SHOCK_AUDIT_2026_07_15.md
```

다음 파일도 확인해주세요.

```text
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/PortfolioSimulator.jsx
src/data/tickers/productionAppExportDataSource.js
src/components/portfolio/utils/appPreviewScenarioService.js
server/src/services/scenario/externalShockEngine.js
server/src/services/scenario/externalShockEngine.test.js
src/components/portfolio/utils/externalShockScenarioAdapter.js
src/components/portfolio/components/ExternalShockAnalysisPanel.jsx
src/components/portfolio/config/planConfig.js
package.json
```

`FINPLE_CANONICAL_CSV_EFFICIENCY_OPERATING_POLICY_2026_07_29.md`가 있으면 읽되 수정하지 마세요.

2026-08-03 Step 5 문서와 Issue #420이 과거 fixture-only 문서보다 우선합니다.

## 3. 작업 목표

Step 4와 Step 5가 Production monthly-return artifact를 하나의 lazy loader 경로로 공유하도록 정리하고, 기존 외부충격 엔진으로 다음 두 결과를 계산할 수 있게 해주세요.

```text
market_drawdown_moderate
market_drawdown_severe
```

가정:

```text
moderate market factor shock = -20%
severe market factor shock = -35%
shock month = min(12, investmentMonths)
shock mode = market_beta
```

Step 5A에서는 public Step 5 UI 활성화까지 하지 않아도 됩니다. 다음 상태를 hook에서 제공하면 됩니다.

```text
step5ScenarioResult
step5ScenarioResults
step5ScenarioStatus
step5ScenarioError
```

## 4. 구현 원칙

```text
현재 portfolio identities
→ 기존 Production monthly shard lazy loader/cache
→ shared monthly artifact state
   ├─ existing Step 4 probability result
   └─ Step 5 external-shock result
```

Step 4 effect를 복사해서 Step 5 전용 loader를 만들지 마세요.

새 API route, DB cache/table, cron, worker, provider 호출을 만들지 마세요.

기존 외부충격 엔진을 재사용하고 하나의 숫자 계산 계약으로 정리해주세요.

## 5. 계산 gate

계산에 필요한 실제 숫자만 필수조건으로 사용해주세요.

필수:

```text
market+ticker
목표비중
월간수익률
시작 평가금액
월 납입금
투자기간
물가상승률
finite Beta
충격 가정
```

다음은 사용자 계산의 필수조건으로 사용하지 마세요.

```text
승인자
source hash
pipeline version
release approval
Preview approval
app-export approval
Beta provenance packet
```

이미 존재하는 감사 메타데이터는 선택적으로 보존할 수 있지만, 부재만으로 계산을 막지 마세요.

차단 대상:

```text
필수 월간수익률 누락
숫자 파싱 실패/NaN/Infinity
Beta 누락·비정상
market+ticker 중복
목표비중 합계 오류
충격 월 오류
계산 결과 <= -100%
현재 portfolio identity 불일치
```

누락값을 0으로 바꾸거나 silent clamp하지 마세요.

## 6. 보호 범위

변경하지 마세요.

```text
canonical CSV와 public 복사본
pinned Production monthly artifact bytes/index/shards/pointer
Step 2·3 계산 계약
Step 4 확률 계산 의미
Step 6 AI payload/prompt/provider/model/quota
Step 7 저장·복원
plan 가격·entitlement
DB/auth/payment/subscription/MY PAGE
KIS/quote/order/trading/kill switch/allowed symbols
Vercel 환경변수·Production alias/domain
Render
FINPLE_CANONICAL_CSV_EFFICIENCY_OPERATING_POLICY_2026_07_29.md
```

전역 MutationObserver 또는 DOM 후처리 패치를 추가하지 마세요.

## 7. 작업 순서

```text
1. read-only inventory 보고
2. 최신 main에서 지정 브랜치 생성
3. shared monthly loader 경계 분리
4. Step 4 builder 회귀 유지
5. Step 5 Production input adapter 구현
6. externalShockEngine 숫자 중심 v2 계약 정리
7. moderate/severe preset 구현
8. Step 5 result state를 hook return에 추가
9. focused tests 추가
10. 전체 지정 검증 실행
11. commit/push
12. Draft PR 생성
```

## 8. 필수 검증

```bash
node --test server/src/services/scenario/externalShockEngine.test.js
npm.cmd run check:scenario-metrics
npm.cmd run check:p3-step4-monthly-artifact
npm.cmd run check:step2-step3-integrated-qa
npm.cmd run check:plan-b-advanced-analysis-entitlements
npm.cmd run build
npm.cmd run check:ai-production
git diff --check
git diff --cached --check
```

추가한 focused tests도 실행해주세요.

Repository-wide trading checker 문제가 있으면 정확히 보고하되 이 PR에서 수정하지 마세요.

## 9. GitHub 전달

Commit / Draft PR 제목:

```text
Step 5A: Connect Production external-shock core
```

PR 본문에 반드시 포함:

```text
Closes #420 when merged
```

완료 보고에는 다음을 포함해주세요.

```text
start/end SHA
changed files
현재 구조 inventory
shared loader 설계
engine v2 계산 계약
preset assumptions
status/result contract
Step 4 회귀 증명
protected files unchanged proof
tests/build/smoke
known limitations
rollback
Step 5B handoff
```

Draft 상태로 유지하고 Ready 전환, merge, Production deploy/promote, alias/domain/environment 변경을 하지 마세요.

---
