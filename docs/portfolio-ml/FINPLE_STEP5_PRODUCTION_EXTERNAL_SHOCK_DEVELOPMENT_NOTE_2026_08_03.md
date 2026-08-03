# FINPLE Step 5 Production External-Shock Development Note

기준일: 2026-08-03  
Repository: `vip930sw/FINPLE`  
Preparation baseline: `444b7e11a80c18bcb6d417ebe24f04ec92323762`  
Implementation Issue: `#420 Step 5A: Connect Production monthly returns to external-shock core`

## 1. 목적

FINPLE 시뮬레이터의 Step 5 외부충격분석을 fixture 검토용 화면에서 실제 사용자 포트폴리오 계산 기능으로 전환한다.

이 작업은 새로운 외부 데이터 공급자, API, DB, 주문 기능을 추가하는 작업이 아니다. 이미 Production에 배포된 Step 4 월간수익률 artifact를 동일한 lazy loader로 읽고, 기존 결정론적 외부충격 엔진에 전달하는 작업이다.

최종 사용자 흐름은 다음과 같다.

```text
Step 1 설정
→ Step 2 비교
→ Step 3 상세분석·기준전망
→ Step 4 확률분석
→ Step 5 외부충격분석
→ Step 6 AI 분석
→ Step 7 저장된 포트폴리오
```

Step 5는 특정 충격 가정을 현재 포트폴리오에 적용하여 기준 경로와 충격 경로의 차이를 계산한다. 충격 발생 확률, 미래 수익률 또는 투자 적합성을 예측하지 않는다.

## 2. 현재 확인 상태

### 2.1 Production 월간 데이터

Step 4는 다음 pinned monthly artifact를 Production에서 사용한다.

```text
monthly assets: 5,347
monthly rows: 701,485
shards: 64
data through: 2026-06
```

Canonical v2 CSV는 자산 검색·지표·eligibility 기준으로 유지되고, 월간 artifact는 시나리오 계산에만 사용한다.

### 2.2 Step 4 데이터 흐름

현재 `usePortfolioSimulator.js`는 active tab이 `probability`일 때만 다음 작업을 수행한다.

```text
현재 포트폴리오 자산 identity 생성
→ Production monthly-return shard lazy load
→ buildAppExportScenarioResult
→ Step 4 probability result 저장
```

월간 데이터 로딩과 Step 4 확률 계산이 하나의 Effect에 결합되어 있다.

### 2.3 Step 5 구현 상태

다음 구현은 이미 존재한다.

```text
server/src/services/scenario/externalShockEngine.js
src/components/portfolio/utils/externalShockScenarioAdapter.js
src/components/portfolio/components/ExternalShockAnalysisPanel.jsx
src/components/portfolio/components/ExternalShockPathChart.jsx
```

기존 엔진은 다음을 지원한다.

```text
direct_asset
market_beta
```

기준 경로·충격 경로, 기여금 제외 risk NAV, MDD, 증분 MDD, 회복기간, 최종가치 차이, 자산별 영향 계산도 이미 구현돼 있다.

하지만 현재 `PortfolioSimulator.jsx`는 Step 5에 Production `scenarioResult`를 전달하지 않는다. 따라서 일반 사용자 화면은 `분석 대기 / 데이터 연결 필요` 상태로 남는다.

## 3. 핵심 설계 결정

## 3.1 월간 데이터의 단일 소유권

Step 4와 Step 5가 각각 shard를 불러오는 구조를 만들지 않는다.

권장 구조는 다음과 같다.

```text
현재 portfolio identity + settings
→ shared monthly artifact loader state
   ├─ Step 4 probability builder
   └─ Step 5 external-shock builder
```

공통 loader는 기존 Production monthly-return loader와 cache를 그대로 사용한다.

다음은 금지한다.

```text
Step 5 전용 두 번째 shard loader
Step 5 진입 전 전체 64개 shard 다운로드
새로운 scenario API
새로운 DB cache/table
외부 provider 재수집
```

## 3.2 계산 조건의 단순화

FINPLE 사용자 계산의 필수조건은 실제 계산에 필요한 값이다.

필수:

```text
market+ticker
목표비중
월간수익률
시작 평가금액
월 납입금
투자기간
물가상승률
Beta (market_beta 사용 시)
충격 가정
```

다음 값은 사용자 계산의 필수조건으로 사용하지 않는다.

```text
승인자
source hash
pipeline version
release manifest 승인
Preview 승인
app export 승인
Beta provenance packet
```

이미 loader가 제공하는 감사 메타데이터는 결과의 보조 정보로 유지할 수 있다. 그러나 해당 메타데이터가 없다는 이유만으로 유효한 숫자 계산을 막지 않는다.

차단 조건은 다음으로 제한한다.

```text
필수 월간수익률 누락
숫자 파싱 실패 또는 NaN/Infinity
Beta 누락 또는 비정상값
market+ticker 중복
목표비중 합계 오류
충격 시점 범위 오류
계산된 월수익률 <= -100%
현재 portfolio identity 불일치
```

## 3.3 하나의 외부충격 엔진

fixture 엔진과 Production 엔진을 따로 만들지 않는다.

```text
하나의 normalized input contract
→ 하나의 buildExternalShockScenario
→ 하나의 output contract
```

기존 엔진의 과도한 provenance 필수조건은 v2 계약에서 선택적 audit metadata로 낮춘다. 기존 수치 계산·MDD·회복기간 의미는 유지한다.

## 3.4 Production v1 시나리오

Production v1은 현재 canonical 데이터에서 일관되게 확보 가능한 Beta를 사용하는 두 가지 일반 시장 충격으로 시작한다.

```text
market_drawdown_moderate
market_drawdown_severe
```

권장 고정 가정:

```text
moderate
- shockMode: market_beta
- marketFactorShock: -0.20
- shockMonth: min(12, investmentMonths)

severe
- shockMode: market_beta
- marketFactorShock: -0.35
- shockMonth: min(12, investmentMonths)
```

계산식은 기존 엔진 계약을 유지한다.

```text
assetShockReturn = beta × marketFactorShock
stressedReturn = (1 + baselineReturn) × (1 + assetShockReturn) - 1
```

원칙:

- 산술 덧셈이 아니라 곱셈 방식
- silent clamp 금지
- `assetShockReturn <= -1` 또는 최종 월수익률 `<= -1`이면 해당 시나리오 차단
- 충격 다음 달부터 기존 baseline monthly path 사용
- 별도 회복곡선 임의 생성 금지
- 발생 확률 추정 금지
- 투자 권유·자산 순위화 금지

기존 `direct_asset` 모드는 엔진에서 유지한다. 다만 기술주·반도체, 금리, 복합충격처럼 자산군별 직접 충격을 공용 UI에 노출하려면 먼저 안정적인 자산분류·충격정책표가 필요하므로 Production v1 공개 범위에서는 제외한다.

## 4. 구현 단계

## 4.1 Step 5A — Production core

Issue: `#420`

목표:

```text
월간 artifact 단일 loader
→ Step 4/5 파생 계산 분리
→ Step 5 moderate/severe 계산 결과 state 제공
```

주요 변경 후보:

```text
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/portfolio/utils/step5ProductionScenarioService.js (신규 후보)
server/src/services/scenario/externalShockEngine.js
server/src/services/scenario/externalShockEngine.test.js
관련 focused tests
```

완료 결과:

```text
step5ScenarioResult
step5ScenarioResults
step5ScenarioStatus
step5ScenarioError
```

Step 5A에서는 public UI 활성화를 하지 않아도 된다. 계산 결과와 상태가 hook까지 도달하면 완료한다.

## 4.2 Step 5B — Public UI wiring

Step 5A merge 후 별도 Issue·브랜치·PR로 진행한다.

목표:

```text
Step 5 result state
→ ExternalShockAnalysisPanel
→ Production 사용자 화면
```

범위:

- moderate/severe 시나리오 선택
- loading/ready/blocked/stale/error 표시
- 기준 경로·충격 경로 차트
- 최종가치·MDD·회복기간·자산별 영향
- fixture/review-only badge와 개발자 용어 제거
- 방법론 상세는 사용자에게 필요한 항목만 표시
- 모바일·접근성 검증
- Personal/Pro entitlement 유지

Step 5B에서는 계산 엔진을 재작성하지 않는다.

## 4.3 Step 5C — Step 6 해석 연결

Step 5 Production 숫자와 UI가 검증된 이후 별도 작업으로 진행한다.

AI는 Step 5 계산 결과를 설명할 수 있지만 다음은 금지한다.

```text
충격률 재계산
MDD 재계산
회복기간 재계산
외부충격 발생 확률 추론
매수·매도·비중변경 권유
```

## 5. 상태 계약

Step 5 runtime 상태는 다음으로 통일한다.

```text
idle
loading
ready
insufficient_data
blocked
stale
error
```

의미:

- `idle`: Step 5 미진입 또는 계산 미요청
- `loading`: 필요한 monthly shard 로딩 중
- `ready`: 현재 portfolio identity와 settings에 일치하는 결과
- `insufficient_data`: 실제 월간 데이터 기간/행 부족
- `blocked`: Beta, 비중, 수익률 등 필수 계산값 오류
- `stale`: 포트폴리오·비중·설정 변경으로 이전 결과가 현재와 불일치
- `error`: 사용자에게 일반 오류 문구, 개발 정보는 console/test metadata에만 보존

누락값을 0으로 바꾸지 않는다.

## 6. 화면 원칙

Step 5의 공개 문구는 다음 의미를 유지한다.

> 이 외부충격분석은 사전에 정의된 가상의 시장 충격을 현재 포트폴리오의 기준 경로에 적용한 결정론적 스트레스 테스트입니다. 충격의 발생 확률이나 미래 수익률을 예측하지 않으며 투자 권유가 아닙니다.

사용자 화면에서 제거할 표현:

```text
fixture
internal preview
production data
app export approved
source hash
pipeline version
analysis identity hash
raw ready status
```

감사정보가 필요한 경우 접힌 개발/방법론 영역에 두고 계산 조건으로 사용하지 않는다.

## 7. 보호 범위

Step 5A·5B에서 변경하지 않는다.

```text
src/data/tickers/finple_app_candidates_v2.csv
public/data/finple_app_candidates_v2.csv
pinned Production monthly artifact bytes/index/shards/pointer
FINPLE_CANONICAL_CSV_EFFICIENCY_OPERATING_POLICY_2026_07_29.md
Step 2·3 계산 계약
Step 4 확률분석 계산 의미
Step 6 AI provider/model/quota/payload
Step 7 저장 포트폴리오
요금제 가격과 entitlement 정책
Supabase DB/auth/payment/subscription/MY PAGE
KIS/quote/order/trading/kill switch/allowed symbols
Vercel Production 환경변수·alias·domain
Render deployment
```

전역 MutationObserver 또는 DOM 후처리 패치를 추가하지 않는다.

## 8. 검증 기준

### 계산

- moderate/severe 동일 입력 결과 결정론적
- Beta 적용식 정확
- 충격과 baseline return 곱셈 정확
- 기여금 제외 risk NAV로 MDD 계산
- 기여금 변경이 risk MDD를 바꾸지 않음
- baseline/stressed terminal value와 자산별 영향 합계 대조
- KR leading-zero ticker 보존
- missing/null/blank를 0으로 변환하지 않음

### 데이터 로딩

- Step 4와 Step 5가 동일 monthly loader 사용
- 초기 페이지에서 전체 shard 미다운로드
- 선택 자산에 필요한 shard만 로딩
- 동일 identity의 Step 4↔5 이동 시 기존 cache 활용
- CASH는 내부 계약으로 처리하고 monthly row를 요구하지 않음

### 회귀

- Step 4 P10/P25/P50/P75/P90, shortfall, scenario MDD, recovery 의미 불변
- Step 2·3 계산·차트 불변
- Step 6 AI payload 불변
- Step 7 저장·복원 불변
- plan gate 불변
- build와 Production smoke 통과

## 9. Rollback

Step 5A는 public UI를 활성화하지 않으므로 rollback은 해당 PR revert로 충분하다.

Step 5B 이후 문제가 생기면:

```text
Step 5 result prop wiring 비활성화
→ 기존 idle 상태 복원
```

Step 4 Production monthly artifact와 canonical CSV는 rollback 대상이 아니다.

## 10. 완료 정의

Step 5 Production v1은 다음 조건을 모두 충족할 때 완료한다.

```text
1. Step 4·5가 월간 데이터를 단일 경로로 읽음
2. moderate/severe 시장충격 계산 가능
3. 실제 필수값 오류만 차단
4. 공개 Step 5에서 현재 포트폴리오 결과 확인 가능
5. 발생확률·추천·수익보장 표현 없음
6. Step 4·6·7 및 결제·트레이딩 회귀 없음
7. Production 배포는 별도 명시적 승인 후 수행
```
