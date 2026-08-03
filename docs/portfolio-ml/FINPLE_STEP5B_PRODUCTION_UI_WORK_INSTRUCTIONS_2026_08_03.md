# FINPLE Step 5B Production UI Work Instructions

기준일: 2026-08-03  
Implementation Issue: `#423`  
작업명: `Step 5B Production external-shock public UI`

## 1. 작업 원칙

이번 작업은 Step 5A 숫자를 공개 UI에 안전하게 연결하는 작업이다.

```text
계산 변경 금지
데이터 변경 금지
UI·adapter·상태·문구 연결만 수행
```

Step 5 panel 또는 adapter에서 충격률, 경로, MDD, 회복기간, 자산별 영향을 다시 계산하지 않는다.

## 2. 작업 전 확인

Codex는 수정 전에 다음을 read-only로 확인하고 첫 보고에 기록한다.

```text
1. local main SHA
2. origin/main SHA
3. GitHub main SHA
4. 세 SHA 일치 여부
5. working tree clean 여부
6. repo-local 또는 parent AGENTS.md 존재 여부
7. Issue #423과 중복되는 open PR/branch 존재 여부
8. PR #422 merged 여부
9. Issue #420 completed 여부
10. 지정된 2026-08-03 Step 5B 문서가 main에 존재하는지
```

SHA가 다르거나 worktree가 깨끗하지 않으면 수정하지 않는다.

## 3. 필수 읽기

```text
docs/portfolio-ml/FINPLE_STEP5B_PRODUCTION_UI_DEVELOPMENT_NOTE_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP5B_PRODUCTION_UI_WORK_INSTRUCTIONS_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP5_PRODUCTION_EXTERNAL_SHOCK_DEVELOPMENT_NOTE_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP5_PRODUCTION_WORK_INSTRUCTIONS_2026_08_03.md
src/components/PortfolioSimulator.jsx
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/portfolio/utils/step5ProductionScenarioService.js
src/components/portfolio/utils/step5ProductionScenarioService.test.js
server/src/services/scenario/externalShockEngine.js
src/components/portfolio/utils/externalShockScenarioAdapter.js
src/components/portfolio/utils/externalShockScenarioAdapter.test.js
src/components/portfolio/components/ExternalShockAnalysisPanel.jsx
src/components/portfolio/components/ExternalShockPathChart.jsx
src/components/portfolio/config/planConfig.js
관련 stylesheet와 UI regression tests
package.json
```

## 4. 수정 전 inventory

다음을 표로 보고한다.

```text
Step 5A hook field
PortfolioSimulator 미연결 위치
Panel props와 local scenario selection state
Adapter v1-only gate
Provider approval/source/provenance gate
Status copy
Fixture/review-only public copy
Chart/table 재사용 가능 여부
Relevant CSS
Relevant focused tests
Plan entitlement boundary
```

## 5. 구현 순서

## 5.1 Hook field wiring

`PortfolioSimulator.jsx`에서 다음을 구조분해한다.

```text
step5ScenarioResult
step5ScenarioResults
step5ScenarioStatus
step5ScenarioError
```

`ExternalShockAnalysisPanel`에 다음 의미로 전달한다.

```text
scenarioResult
scenarioResults
scenarioLoadStatus
scenarioLoadError
```

기존 entitlement 조건은 그대로 유지한다.

## 5.2 Adapter contract 분리

`externalShockScenarioAdapter.js`의 기존 v1 fixture 계약을 무조건 삭제하지 않는다.

권장 구조:

```text
isV1FixtureResult
→ existing strict fixture validation

isV2ProductionResult
→ Step 5A numeric/result validation
```

v2 Production ready validation:

```text
scenario version/method/mode
ready status
hash format
baseline/stressed path
contribution alignment
summary/top-level alias consistency
shock event numeric integrity
asset impact reconciliation
probabilityApplied=false
```

v2 Production optional:

```text
source hashes
normalization/calculation/pipeline versions
Beta provenance
provider approval evidence
```

Optional 값이 없다는 이유로 blocked 처리하지 않는다.

## 5.3 Load-state adapter

`buildExternalShockScenarioViewModel` 또는 별도 wrapper가 다음을 입력받도록 한다.

```text
scenarioLoadStatus
scenarioLoadError
```

Result가 없더라도 loading/insufficient/blocked/stale/error view model을 만든다.

`loading`을 supported state에 포함한다.

## 5.4 Scenario partition

Candidate results를 다음으로 분리한다.

```text
readyResults
blockedResults
```

원칙:

```text
readyResults.length > 0 → 전체 ready
readyResults.length = 0 → load/result 상태에 따른 blocked/insufficient/error
```

Selector option shape 권장:

```text
scenarioId
label
assumptionLabel
enabled
disabledReason
selected
```

Blocked result의 숫자를 비교표에 표시하지 않는다.

## 5.5 Selection sync

Panel selected scenario는 다음 규칙을 따른다.

```text
현재 selection이 ready → 유지
아니면 첫 ready scenario 선택
ready 없음 → null
```

Portfolio/results가 변경될 때 동기화한다.

## 5.6 Public copy

제거:

```text
검증 데이터 연결
분석 대기
데이터 연결 필요
fixture
review-only
internal preview
provider approval
app-export approval
source hash
pipeline version
```

헤더:

> 현재 포트폴리오에 사전에 정의된 시장 급락 충격을 적용해 기준 경로와 충격 경로를 비교합니다.

Ready notice:

> 과거 월간수익률 기반 경로에 가상의 시장 충격을 한 차례 적용한 결정론적 스트레스 테스트입니다.

고지:

> 충격의 발생 확률이나 미래 수익률을 예측하지 않으며 투자 권유가 아닙니다. 실시간 시세 조회, 외부 공급자 호출, 주문 또는 AI 해석을 수행하지 않습니다.

## 5.7 Status copy

Raw status/error를 직접 출력하지 않는다.

Known reason mapping을 pure function으로 두고 테스트 가능하게 한다.

권장 공개 문구:

```text
idle → 외부충격분석을 준비합니다.
loading → 포트폴리오의 월간 데이터를 불러오고 있습니다.
insufficient_data → 선택 자산의 공통 월간 이력이 투자기간보다 짧아 분석할 수 없습니다.
blocked → 필수 분석값을 확인할 수 없어 결과를 계산하지 못했습니다.
stale → 포트폴리오가 변경되어 결과를 다시 계산하고 있습니다.
error → 외부충격분석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
```

## 5.8 Public scenario labels

```text
market_drawdown_moderate
label = 주식시장 급락 · 중간
assumption = 시장 충격 -20%

market_drawdown_severe
label = 주식시장 급락 · 강함
assumption = 시장 충격 -35%
```

엔진의 scenario label/preset 수치는 수정하지 않는다.

## 5.9 Methodology

표시:

```text
과거 월간수익률 기반 기준 경로
시장 Beta 방식
충격률
충격 시점
가격수익률
데이터 시작/종료
발생확률 미적용
```

숨김 또는 제거:

```text
hash
approval evidence
pipeline version
fixture checksum
```

## 5.10 Accessibility

```text
loading section aria-busy=true
status aria-live=polite
selector aria-pressed
blocked selector disabled
blocked reason title 또는 설명 연결
button type=button
focus visible 유지
```

## 6. 테스트 요구

## 6.1 Adapter

```text
v2 ready + empty sourceHashes accepted
v2 ready + null versions accepted
v2 ready + null Beta provenance accepted
invalid hash blocked
invalid path/summary blocked
v1 fixture test retained
load state mapping
raw error sanitization
Korean preset labels
partial ready/blocked
all blocked
selection fallback
blocked comparison numeric omission
```

## 6.2 Wiring/component

```text
4 hook fields passed
Free lock unchanged
Personal/Pro panel path unchanged
loading aria-busy
selector aria-pressed/disabled
fixture copy absent
historical-path disclaimer present
raw status/error absent
```

## 6.3 Responsive QA

```text
1440px
1024px
768px
390px
375px
```

확인:

```text
selector clipping 없음
table page overflow 없음
chart readability
floating portfolio dropdown overlap 없음
Step navigation regression 없음
```

## 6.4 Commands

```bash
node --test src/components/portfolio/utils/externalShockScenarioAdapter.test.js
node --test src/components/portfolio/utils/step5ProductionScenarioService.test.js
node --test server/src/services/scenario/externalShockEngine.test.js
npm.cmd run check:scenario-metrics
npm.cmd run check:p3-step4-monthly-artifact
npm.cmd run check:step2-step3-integrated-qa
npm.cmd run check:plan-b-advanced-analysis-entitlements
npm.cmd run check:simulator-locked-step-personal-badge
npm.cmd run build
npm.cmd run check:ai-production
git diff --check
git diff --cached --check
```

추가 focused tests를 실행한다.

Repository-wide trading validation은 이 PR의 필수 gate가 아니다. 실행 시 unrelated timeout/failure를 정확히 구분하고 이 PR에서 수정하지 않는다.

## 7. 금지사항

```text
Step 5A engine 수정
Step 5A service 계산 수정
preset/shock month 변경
사용자 임의 충격률
sector/rate/combined preset
Step 6 AI 연결
Step 5 결과 저장
canonical/monthly artifact 수정
API/DB/cache/cron/worker/provider
plan 가격·entitlement 변경
auth/payment/subscription/MY PAGE
KIS/trading/order 변경
Vercel/Render Production 변경
MutationObserver/global DOM patch
```

## 8. 예상 변경 파일

```text
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/ExternalShockAnalysisPanel.jsx
src/components/portfolio/utils/externalShockScenarioAdapter.js
src/components/portfolio/utils/externalShockScenarioAdapter.test.js
Step 5B focused UI/wiring test
관련 stylesheet 1개 이하
```

## 9. GitHub 전달

브랜치:

```text
codex/step5b-production-external-shock-ui
```

Commit / Draft PR 제목:

```text
Step 5B: Wire Production external-shock UI
```

PR 본문:

```text
Closes #423 when merged
```

완료 보고:

```text
start/end SHA
changed files
inventory
v2 adapter strategy
status contract
partial scenario behavior
public copy
accessibility/responsive QA
focused/regression tests
protected files proof
known limitations
rollback
Step 5C handoff
```

Ready 전환, merge, Production deploy/promote/alias/environment 변경을 하지 않는다.

## 10. 완료 기준

```text
Personal/Pro Production results visible
Free locked
v2 accepted without fixture gates
partial ready retained
safe status/error copy
fixture language removed
historical/non-forecast meaning clear
accessibility/mobile pass
protected scope unchanged
Draft PR open
```
