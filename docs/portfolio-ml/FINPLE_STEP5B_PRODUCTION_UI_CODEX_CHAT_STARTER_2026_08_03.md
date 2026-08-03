# FINPLE Step 5B Production UI Codex Chat Starter

아래 내용을 Step 5B 문서 PR이 `main`에 병합된 뒤 Codex 새 채팅에 그대로 붙여 넣는다.

---

FINPLE 프로젝트의 Step 5B Production 외부충격분석 공개 UI 연결 작업을 시작합니다.

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
#423 Step 5B: Wire Production external-shock results into public UI
```

작업 브랜치:

```text
codex/step5b-production-external-shock-ui
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
7. Issue #423과 중복되는 open PR/branch 존재 여부
8. PR #422가 merged인지
9. Issue #420이 completed인지
10. 아래 Step 5B 문서가 main에 존재하는지
```

세 SHA가 다르거나 worktree가 깨끗하지 않으면 수정하지 말고 중단해주세요.

## 2. 필수 문서와 코드

다음 순서로 읽어주세요.

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

2026-08-03 Step 5B 문서와 Issue #423이 과거 fixture-only UI 문서보다 우선합니다.

## 3. 현재 기준

Step 5A는 이미 main에 병합되어 다음 hook fields를 제공합니다.

```text
step5ScenarioResult
step5ScenarioResults
step5ScenarioStatus
step5ScenarioError
```

현재 `PortfolioSimulator.jsx`는 이 필드를 Step 5 panel에 전달하지 않습니다.

현재 UI adapter는 v1 fixture 계약만 지원하며 다음 old gates를 요구합니다.

```text
source hashes
pipeline/calculation/normalization versions
Beta provenance
provider approval evidence
```

Step 5A v2에서는 이 값들이 선택적 감사정보입니다.

## 4. 목표

```text
Step 5A hook state
→ Production v2-safe view model
→ existing ExternalShockAnalysisPanel
```

Personal/Pro 사용자는 실제 Step 5A 결과를 확인해야 합니다.

Free 사용자는 기존 locked panel을 유지해야 합니다.

## 5. Hook wiring

`PortfolioSimulator.jsx`에서 다음 필드를 구조분해하고 panel에 전달해주세요.

```text
scenarioResult = step5ScenarioResult
scenarioResults = step5ScenarioResults
scenarioLoadStatus = step5ScenarioStatus
scenarioLoadError = step5ScenarioError
```

기존 entitlement 조건은 변경하지 마세요.

## 6. Adapter v2 계약

다음을 public Production 결과로 지원해주세요.

```text
scenarioVersion = external-shock-scenario-v2-step5a
method = deterministic_external_shock
shockMode = market_beta
probabilityApplied = false
```

v2에서 검증할 것:

```text
ready status
hash format
baseline/stressed path
contribution alignment
summary/top-level alias consistency
shock event numeric integrity
asset impact reconciliation
finite numeric output
```

v2에서 필수로 만들지 말 것:

```text
sourceHashes non-empty
normalizationVersion
calculationPolicyVersion
pipelineVersion
Beta provenance
provider approval evidence
```

기존 v1 fixture compatibility가 repository-supported라면 별도 strict path로 유지해주세요.

## 7. Load state

Panel/view model이 다음을 처리해야 합니다.

```text
idle
loading
ready
insufficient_data
blocked
stale
error
```

사용자용 문구:

```text
idle: 외부충격분석을 준비합니다.
loading: 포트폴리오의 월간 데이터를 불러오고 있습니다.
insufficient_data: 선택 자산의 공통 월간 이력이 투자기간보다 짧아 분석할 수 없습니다.
blocked: 필수 분석값을 확인할 수 없어 결과를 계산하지 못했습니다.
stale: 포트폴리오가 변경되어 결과를 다시 계산하고 있습니다.
error: 외부충격분석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
```

Raw status/error code를 primary public copy로 표시하지 마세요.

## 8. 일부 시나리오 차단

다음 상태를 지원해주세요.

```text
moderate ready
severe blocked
```

원칙:

```text
ready 결과가 하나라도 있으면 panel ready
ready scenario는 선택 가능
blocked scenario는 disabled + 사용자용 사유
blocked 숫자는 생성/표시하지 않음
all blocked일 때만 전체 blocked
```

Portfolio/results 변경 시 선택된 scenario가 더 이상 ready가 아니면 첫 ready scenario로 자동 변경해주세요.

## 9. Public label과 문구

Preset mapping:

```text
market_drawdown_moderate
→ 주식시장 급락 · 중간
→ 시장 충격 -20%

market_drawdown_severe
→ 주식시장 급락 · 강함
→ 시장 충격 -35%
```

헤더:

```text
현재 포트폴리오에 사전에 정의된 시장 급락 충격을 적용해 기준 경로와 충격 경로를 비교합니다.
```

Ready 설명:

```text
과거 월간수익률 기반 경로에 가상의 시장 충격을 한 차례 적용한 결정론적 스트레스 테스트입니다.
```

고지:

```text
충격의 발생 확률이나 미래 수익률을 예측하지 않으며 투자 권유가 아닙니다.
실시간 시세 조회, 외부 공급자 호출, 주문 또는 AI 해석을 수행하지 않습니다.
```

다음을 public copy에서 제거해주세요.

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

`실제 시장 데이터를 사용하지 않는다`고 쓰지 마세요. Pinned historical monthly artifact를 사용합니다.

## 10. Ready UI

기존 컴포넌트를 재사용해주세요.

```text
ExternalShockPathChart
SummaryCards
ScenarioComparisonTable
ShockAssumptionsTable
AssetImpactTable
MethodologyPanel
```

표시 내용:

```text
포트폴리오와 자산
scenario selector
과거 월간수익률 기반 기준 경로
충격 경로
최종 평가금액과 영향
기준/충격/증분 MDD
회복/미회복
자산별 영향
충격률/Beta/충격 시점
데이터 시작/종료
발생확률 미적용
```

Panel/adapter에서 숫자를 재계산하지 마세요.

## 11. 접근성·반응형

검증:

```text
1440px
1024px
768px
390px
375px
```

필수:

```text
loading aria-busy
status aria-live
selector aria-pressed
blocked selector disabled + reason
selector clipping 없음
table horizontal scroll
chart readability
Step navigation/floating dropdown 회귀 없음
```

## 12. 보호 범위

변경하지 마세요.

```text
Step 5A engine/service calculation
-20%/-35% preset
shock month policy
MDD/recovery/CASH/monthly-history selection
Step 4 probability
Step 6 AI
Step 7 persistence
canonical/public CSV
pinned monthly artifact
plan pricing/features/limits
DB/auth/payment/subscription/MY PAGE
KIS/quote/order/trading
Vercel/Render Production settings
```

새 API, DB, cache, cron, worker, provider, MutationObserver, global DOM patch를 추가하지 마세요.

## 13. 작업 순서

```text
1. read-only inventory 보고
2. 최신 main에서 지정 branch 생성
3. four-field wiring
4. v1/v2 adapter contract 분리
5. load-state view model
6. partial scenario partition/selection
7. public copy/status mapping
8. accessibility/responsive adjustment
9. focused tests
10. regression/build checks
11. commit/push
12. Draft PR 생성
```

## 14. 검증

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

추가 Step 5B focused tests도 실행해주세요.

Unrelated trading validation 문제는 이 PR에서 수정하지 마세요.

## 15. GitHub 전달

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
responsive/accessibility QA
tests/build
protected files proof
known limitations
rollback
Step 5C handoff
```

Draft 상태로 유지하고 Ready 전환, merge, Production deploy/promote, alias/domain/environment 변경을 하지 마세요.

---
