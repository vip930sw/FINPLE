# FINPLE Step 5 Production Work Instructions

기준일: 2026-08-03  
Implementation Issue: `#420`  
첫 구현 단계: `Step 5A Production external-shock core`

## 1. 작업 원칙

이 작업은 기존 Step 5 엔진을 폐기하거나 새 시나리오 시스템을 만드는 작업이 아니다.

```text
기존 Production monthly artifact
+ 기존 lazy loader/cache
+ 기존 externalShockEngine
= Step 5 Production v1
```

가장 단순한 정상 경로를 우선한다.

## 2. 작업 전 확인

Codex는 수정 전에 다음을 확인하고 첫 보고에 기록한다.

```text
1. local main SHA
2. origin/main SHA
3. GitHub main SHA
4. working tree clean 여부
5. repo-local 또는 parent AGENTS.md 존재 여부
6. Issue #420과 중복되는 open PR/branch 존재 여부
7. 최신 문서 PR merge 여부
```

SHA가 다르거나 worktree가 깨끗하지 않으면 수정하지 말고 중단한다.

## 3. 읽을 파일

다음 순서로 읽는다.

```text
docs/portfolio-ml/FINPLE_STEP5_PRODUCTION_EXTERNAL_SHOCK_DEVELOPMENT_NOTE_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP5_PRODUCTION_WORK_INSTRUCTIONS_2026_08_03.md
docs/portfolio-ml/FINPLE_STEP114_2H_EXTERNAL_SHOCK_AUDIT_2026_07_15.md
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

`FINPLE_CANONICAL_CSV_EFFICIENCY_OPERATING_POLICY_2026_07_29.md`가 있으면 읽되 수정하지 않는다.

## 4. Step 5A 범위

## 4.1 Read-only inventory

수정 전에 다음을 표로 보고한다.

```text
월간 loader 함수와 cache 소유 파일
Step 4 effect의 입력·출력·status
Step 5 engine 필수 입력
Step 5 engine에서 과도한 metadata gate가 발생하는 위치
Step 5 UI가 현재 result를 받지 못하는 위치
CASH 처리 위치
plan entitlement 위치
관련 focused tests
```

## 4.2 공통 월간 loader state

현재 Step 4 effect를 복사하지 않는다.

권장 구현 방식:

```text
monthlyArtifactState
- status
- rowsByIdentity
- manifest/release metadata
- error
- identity fingerprint
```

활성 조건:

```text
active tab = probability 또는 shock
AND 해당 plan feature 허용
AND baseline 계산 ready
```

Step 4·5는 이 state에서 각각 result를 생성한다.

불필요한 큰 hook 전면 리팩터링은 피한다. 다만 loader와 probability builder가 분리되지 않으면 중복이 발생하므로 그 경계만 분리한다.

## 4.3 Step 4 보호

Step 4의 다음 의미를 바꾸지 않는다.

```text
공동 월간 Block Bootstrap
P10/P25/P50/P75/P90
원금 미달확률
scenario MDD
recovery
CASH 2.0% 계약
월초 납입
연간 리밸런싱 경계
```

Step 4 결과 객체·UI·문구는 필요한 prop 이름 변경 외에는 수정하지 않는다.

## 4.4 Step 5 Production adapter

신규 pure utility/service 후보:

```text
src/components/portfolio/utils/step5ProductionScenarioService.js
```

역할:

```text
현재 portfolio/assets/settings
+ shared monthly rows
+ preset
→ buildExternalShockScenario input
→ normalized result/status
```

브라우저에서 Node 전용 `node:crypto` 엔진을 직접 import하면 안 된다.

현재 엔진이 server/offline 전용이라면 다음 중 현재 구조에 가장 작은 방법을 선택한다.

```text
A. 브라우저-safe pure engine으로 이동하고 server가 동일 함수를 재사용
B. engine 계산 코어를 공통 pure module로 분리
C. 기존 app-side pure 계산 유틸이 있으면 그것을 단일 기준으로 사용
```

선택 이유와 번들 안전성을 PR에 기록한다.

새 API route를 만드는 방식은 금지한다.

## 4.5 Engine v2 단순 계약

과거 fixture 계약의 metadata는 계산 결과의 감사정보로만 취급한다.

필수 계산 gate:

```text
finite numeric rows
complete selected-month coverage
target weights = 100%
valid settings
valid Beta in market_beta
valid shock month and factor
```

선택 audit metadata:

```text
source hashes
release metadata
pipeline/calculation version
beta provenance
```

선택 metadata가 없다는 이유로 계산을 차단하지 않는다.

단, 실제 monthly row가 없거나 Beta가 없으면 차단한다.

## 4.6 Preset contract

다음 2개만 구현한다.

```js
{
  id: "market_drawdown_moderate",
  label: "주식시장 급락 · 중간",
  shockMode: "market_beta",
  marketFactorShock: -0.20,
  shockMonthPolicy: "min_12_or_horizon"
}

{
  id: "market_drawdown_severe",
  label: "주식시장 급락 · 강함",
  shockMode: "market_beta",
  marketFactorShock: -0.35,
  shockMonthPolicy: "min_12_or_horizon"
}
```

직접 숫자 입력 UI는 만들지 않는다.

기술주·반도체, 금리, 복합 충격은 Step 5B 이후 별도 정책 작업으로 남긴다.

## 4.7 상태 분리

Step 4와 Step 5 상태를 섞지 않는다.

```text
previewScenarioResult / status / error
step5ScenarioResult / results / status / error
```

Step 5A는 hook return까지 제공한다.

`PortfolioSimulator.jsx`에서 public panel에 연결하는 작업은 Step 5B 범위다.

## 5. 금지사항

다음 작업을 하지 않는다.

```text
canonical CSV 수정
monthly artifact 재생성
monthly pointer/index/shard 수정
Colab 실행
provider/KRX/KIS/data.go.kr 호출
DB migration/table/cache
API route/cron/worker
Vercel 환경변수 변경
Production deploy/promote/alias/domain 변경
Render deploy
AI payload/prompt/provider 변경
Step 6 scenario context 연결
사용자 임의 충격률 입력
거래 신호 생성
KIS quote/order 변경
kill switch/allowed symbols 변경
결제·인증·구독·MY PAGE 변경
전역 MutationObserver/DOM patch
운영정책 문서 수정
```

## 6. 필수 테스트

### 6.1 Focused

```text
externalShockEngine v2 numeric gate
Step 5 preset builder
shared monthly loader state
Step 4 result regression
CASH behavior
KR leading-zero identity
```

### 6.2 명령

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

새 focused test 명령이 있으면 추가한다.

Repository-wide `node --test`가 과거 trading checker 문제로 실패하거나 장시간 걸리면 관련 실패를 정확히 기록하고 Step 5 PR에서 trading checker를 수정하지 않는다.

## 7. 완료 기준

```text
1. Step 4·5가 월간 데이터 loader를 공유함
2. 필요한 shard만 lazy load함
3. moderate/severe 결과가 결정론적으로 생성됨
4. metadata 승인 부재가 계산을 막지 않음
5. 필수 숫자 누락·오류는 차단함
6. Step 4 결과 의미가 동일함
7. Step 5 result state가 hook에 제공됨
8. canonical CSV/monthly artifact/AI/trading/payment 보호 확인
9. Draft PR 생성
10. merge·Production 작업 없음
```

## 8. PR 작성 규칙

브랜치:

```text
codex/step5a-production-external-shock-core
```

Commit / Draft PR 제목:

```text
Step 5A: Connect Production external-shock core
```

PR 본문:

```text
Closes #420 when merged
```

PR 본문에 반드시 포함한다.

```text
start/end SHA
변경 파일
현재 구조 inventory
공통 loader 설계
engine v2 numeric contract
preset assumptions
status contract
Step 4 회귀 증명
보호 파일 diff 없음
테스트 결과
알려진 제한
rollback
Step 5B handoff
```

자동 merge, Ready 전환, Production 배포를 하지 않는다.

## 9. Step 5B 인수인계

Step 5A 완료 후 다음 작업은 별도 Issue로 만든다.

```text
Step 5B: Wire validated Production external-shock results into public UI
```

Step 5B 범위:

```text
Step 5 props 연결
moderate/severe selector
loading/ready/blocked/stale/error UI
fixture/review 문구 제거
사용자용 방법론·고지
desktop/mobile/accessibility
Production Preview QA
```

Step 5B에서도 merge와 Production cutover는 사용자 명시적 승인 후 진행한다.
