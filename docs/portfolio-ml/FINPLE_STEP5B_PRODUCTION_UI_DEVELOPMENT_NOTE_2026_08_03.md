# FINPLE Step 5B Production UI Development Note

기준일: 2026-08-03  
Repository: `vip930sw/FINPLE`  
Preparation baseline: `48bb8f3282aa08fe6b9fe5520a8b09a30058bfd2`  
Implementation Issue: `#423 Step 5B: Wire Production external-shock results into public UI`

## 1. 목적

Step 5A에서 계산 가능한 상태로 연결한 Production 외부충격 결과를 기존 Step 5 공개 패널에 표시한다.

Step 5B는 계산 로직 개발이 아니다.

```text
Step 5A hook result
→ Production v2 view-model adapter
→ 기존 Step 5 panel/chart/table
```

사용자는 Personal 또는 Pro 플랜에서 현재 포트폴리오에 사전 정의된 시장 급락 충격을 적용한 결과를 확인한다.

Step 5는 다음 기능이 아니다.

```text
미래 수익률 예측
충격 발생 확률 예측
매수·매도 추천
비중 추천
실시간 시세 분석
AI 재계산
자동 주문
```

## 2. 선행 완료 상태

### 2.1 Step 5A

PR #422가 병합됐다.

```text
merge commit
48bb8f3282aa08fe6b9fe5520a8b09a30058bfd2
```

Issue #420은 completed 상태다.

`usePortfolioSimulator`는 다음 필드를 제공한다.

```text
step5ScenarioResult
step5ScenarioResults
step5ScenarioStatus
step5ScenarioError
```

시나리오:

```text
market_drawdown_moderate
marketFactorShock = -0.20

market_drawdown_severe
marketFactorShock = -0.35
```

공통:

```text
shockMode = market_beta
shockMonth = min(12, investmentMonths)
probabilityApplied = false
```

### 2.2 현재 공개 UI의 단절

`PortfolioSimulator.jsx`는 Step 5A 필드를 아직 구조분해하거나 `ExternalShockAnalysisPanel`에 전달하지 않는다.

현재 패널은 다음 props만 받는다.

```text
activePortfolio
assets
result
settings
isEmptyAssetRow
```

따라서 실제 결과가 계산돼도 공개 화면은 계속 idle 상태다.

### 2.3 현재 adapter의 충돌

기존 `externalShockScenarioAdapter.js`는 fixture 검토용 v1 계약을 기준으로 한다.

```text
SUPPORTED_EXTERNAL_SHOCK_SCENARIO_VERSION
= external-shock-scenario-v1-step114-2h
```

기존 adapter는 다음을 필수로 요구한다.

```text
sourceHashes
normalizationVersion
calculationPolicyVersion
pipelineVersion
Beta provenance
provider approval evidence
```

Step 5A v2 계약에서는 위 값이 선택적 감사정보다.

따라서 기존 adapter를 그대로 사용하면 유효한 Step 5A 결과가 차단된다.

### 2.4 현재 패널 문구의 충돌

현재 public panel에는 다음 fixture/review 문구가 남아 있다.

```text
분석 대기
데이터 연결 필요
검증 데이터 연결
검증된 외부충격 경로
일반 화면에서는 별도 검증 데이터와 실제 포트폴리오 값을 자동 결합하지 않습니다.
```

Step 5A가 Production monthly artifact와 현재 포트폴리오를 실제로 결합하므로 교체가 필요하다.

## 3. 핵심 설계 결정

## 3.1 Step 5A 결과를 유일한 public source로 사용

```text
step5ScenarioStatus
step5ScenarioError
step5ScenarioResults
→ view model
→ panel
```

Panel 또는 adapter에서 충격률, MDD, 회복기간, 최종가치를 다시 계산하지 않는다.

## 3.2 v1 fixture와 v2 Production 계약 분리

기존 fixture 테스트가 저장소의 검토 자산으로 남아 있다면 compatibility path를 유지한다.

권장 방식:

```text
v1 fixture contract
→ 기존 strict fixture validation

v2 Production contract
→ numeric/result integrity validation
```

v2에서 필수:

```text
scenarioId
scenarioLabel 또는 public label mapping 가능한 preset ID
scenarioVersion v2
method
shockMode
status
finite ready outputs
valid paths
valid summary aliases
valid shock assumptions
valid input/output hashes
```

v2에서 선택:

```text
sourceHashes
normalizationVersion
calculationPolicyVersion
pipelineVersion
Beta provenance
provider approval evidence
```

선택값 부재는 public 계산 차단 사유가 아니다.

## 3.3 load state를 result validation과 분리

다음 load 상태는 결과 객체가 없어도 표시해야 한다.

```text
idle
loading
insufficient_data
blocked
stale
error
```

Panel props 권장:

```text
scenarioLoadStatus
scenarioLoadError
scenarioResult
scenarioResults
```

`loading`은 adapter의 result contract validation 대상이 아니다.

## 3.4 일부 시나리오 사용 가능 상태

Step 5A는 시나리오별 결과를 반환한다.

고 Beta 자산이 있으면 다음 상태가 가능하다.

```text
moderate = ready
severe = blocked
```

Public UI 원칙:

```text
ready 결과 1개 이상 → 패널 ready
blocked 결과 → disabled selector
ready 결과 → 선택·표시 가능
all blocked → 전체 blocked
```

하나의 blocked 결과 때문에 ready 결과를 숨기지 않는다.

## 4. 사용자 화면 구조

## 4.1 헤더

권장 문구:

> 현재 포트폴리오에 사전에 정의된 시장 급락 충격을 적용해 기준 경로와 충격 경로를 비교합니다.

상태 badge 예시:

```text
loading → 분석 준비 중 / 월간 데이터 확인
ready → 분석 완료 / 결과 확인 가능
insufficient_data → 분석 불가 / 공통 이력 부족
blocked → 분석 불가 / 필수값 확인 필요
stale → 다시 계산 중 / 포트폴리오 변경
error → 분석 오류 / 다시 시도 필요
```

Raw status code는 화면에 출력하지 않는다.

## 4.2 포트폴리오 context

Ready 전후 모두 다음을 표시한다.

```text
현재 포트폴리오명
분석 대상 자산
사용자용 상태 문구
```

기존 `<strong>{viewModel.status}</strong>` 같은 raw 상태 표시를 제거한다.

## 4.3 시나리오 selector

Public label:

```text
market_drawdown_moderate
→ 주식시장 급락 · 중간
→ 시장 충격 -20%

market_drawdown_severe
→ 주식시장 급락 · 강함
→ 시장 충격 -35%
```

Selector:

```text
ready → enabled
blocked → disabled
selected → aria-pressed=true
```

Blocked reason은 사용자용 짧은 문구로 전달한다.

## 4.4 기준 경로의 의미

Step 5의 baseline은 Step 3 장기 기대수익률 전망이 아니다.

Step 5A는 현재 포트폴리오 자산의 공통 연속 월간수익률 구간을 사용한다.

따라서 다음 표현을 사용한다.

```text
과거 월간수익률 기반 기준 경로
역사적 경로에 가상 충격을 적용한 스트레스 테스트
```

금지 표현:

```text
미래 기준전망
예상 미래 경로
향후 수익률 경로
발생 가능성이 높은 시나리오
```

## 4.5 결과 영역

Ready 시 재사용:

```text
ExternalShockPathChart
SummaryCards
ScenarioComparisonTable
ShockAssumptionsTable
AssetImpactTable
MethodologyPanel
```

필수 카드:

```text
기준 최종 평가금액
충격 후 최종 평가금액
충격 영향 금액
충격 영향률
기준 MDD
충격 MDD
증분 MDD
회복 기간
미회복 여부
```

## 4.6 방법론

사용자에게 필요한 항목:

```text
시나리오명
시장 충격률
충격 적용 월
충격 방식: 시장 Beta
수익률 기준: 가격수익률
데이터 시작월
데이터 종료월
기준 경로 설명
발생확률 미적용
```

다음은 public 필수표시가 아니다.

```text
source hash
pipeline version
approval evidence
input/output hash
fixture checksum
```

## 4.7 고지

권장 문구:

> 이 분석은 과거 월간수익률 기반 경로에 가상의 시장 충격을 한 차례 적용한 결정론적 스트레스 테스트입니다. 충격의 발생 확률이나 미래 수익률을 예측하지 않으며 투자 권유가 아닙니다. 실시간 시세 조회, 외부 공급자 호출, 주문 또는 AI 해석을 수행하지 않습니다.

기존 문구 중 `실제 시장 데이터 호출을 수행하지 않습니다`는 사용하지 않는다. Pinned historical monthly artifact를 사용하기 때문이다.

## 5. 상태·오류 문구

## 5.1 상태

```text
idle
외부충격분석을 준비합니다.

loading
포트폴리오의 월간 데이터를 불러오고 있습니다.

insufficient_data
선택 자산의 공통 월간 이력이 투자기간보다 짧아 분석할 수 없습니다.

blocked
필수 분석값을 확인할 수 없어 결과를 계산하지 못했습니다.

stale
포트폴리오가 변경되어 결과를 다시 계산하고 있습니다.

error
외부충격분석을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
```

## 5.2 대표 block reason mapping

```text
market_beta_coverage_invalid
assetBetas*.must_be_finite_number
→ 일부 자산의 Beta를 확인할 수 없습니다.

insufficient_data
missing_asset_month
missing_monthly_identity
→ 선택 자산의 공통 월간 이력이 부족합니다.

asset_weight_sum_invalid
→ 자산 목표비중 합계를 100%로 맞춰 주세요.

settings.initialInvestment
→ 시작 평가금액을 0원보다 크게 입력해 주세요.

settings.monthlyContribution
→ 월 납입금 값을 확인해 주세요.

settings.investmentMonths
→ 투자기간을 확인해 주세요.

settings.inflationRate
→ 물가상승률을 확인해 주세요.

duplicate_asset
portfolio_identity_mismatch
→ 현재 포트폴리오 자산 구성을 다시 확인해 주세요.

less_than_or_equal_minus_100
→ 해당 충격에서는 일부 자산의 계산 수익률이 -100% 이하가 되어 분석할 수 없습니다.
```

Raw error는 audit/test에 보존할 수 있지만 primary public copy로 표시하지 않는다.

## 6. React 상태 처리

현재 panel의 `useState(selectedScenarioId)`는 최초값만 반영한다.

Portfolio 또는 result가 변경될 때 다음이 필요하다.

```text
현재 선택 scenario가 ready 목록에 있음 → 유지
현재 선택 scenario가 blocked/삭제됨 → 첫 ready scenario로 변경
ready scenario 없음 → 선택 해제
```

`useEffect` 또는 controlled selected scenario 방식 중 작은 변경을 선택한다.

## 7. 접근성·반응형

검증 viewport:

```text
1440
1024
768
390
375
```

필수:

```text
selector button 최소 터치영역
aria-pressed
blocked button disabled
blocked reason 전달
loading aria-busy
status aria-live
horizontal table scroll
chart overflow 없음
상단 Step navigation 회귀 없음
```

## 8. 보호 범위

Step 5B에서 변경하지 않는다.

```text
server/src/services/scenario/externalShockEngine.js
src/components/portfolio/utils/step5ProductionScenarioService.js
-20% / -35% preset
shock month policy
MDD/recovery/CASH 계산
monthly-history selection
Step 4 probability calculation
Step 6 AI payload/provider/model/quota
Step 7 persistence
canonical/public CSV
pinned monthly artifact
plan pricing/features/limits
DB/auth/payment/subscription/MY PAGE
KIS/quote/order/trading
Vercel/Render Production configuration
```

Genuine UI contract defect가 발견된 경우 Step 5A service 변경은 최소화하고 이유와 테스트를 별도 보고한다.

## 9. 예상 변경 파일

```text
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/ExternalShockAnalysisPanel.jsx
src/components/portfolio/utils/externalShockScenarioAdapter.js
src/components/portfolio/utils/externalShockScenarioAdapter.test.js
Step 5B focused component/wiring test
관련 stylesheet 1개 이하
```

## 10. 완료 정의

```text
1. Personal/Pro Step 5에 Production 결과 표시
2. Free Step 5 lock 유지
3. v2 결과가 old approval gate 없이 표시
4. partial ready/blocked 지원
5. 모든 load/error 상태가 사용자용 문구로 표시
6. fixture/review-only public copy 제거
7. 과거 경로 기반 스트레스 테스트임을 명시
8. Step 5A 계산 및 Step 4·6·7 회귀 없음
9. mobile/accessibility QA 통과
10. Draft PR 생성, merge/deploy 없음
```
