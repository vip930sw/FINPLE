# FINPLE Step 114-2 작업지침 및 인수인계

작성일: 2026-07-14  
대상 저장소: `vip930sw/FINPLE`  
기준 main SHA: `c059c2a4555046b05d5bf623d44357d7b5328065`  
세이브포인트: `savepoint/pre-step114-2-scenario-colab-2026-07-14`

## 1. 목적

이 문서는 Colab 월간 데이터 파이프라인, 월간 기준전망, 확률 시나리오, 외부 충격 분석, AI 분석 STEP 이동을 여러 개의 작은 PR로 안전하게 구현하기 위한 작업 규칙이다.

대규모 일괄 PR은 금지한다. 데이터·계산·UI·AI 연결을 분리한다.

## 2. 작업 시작 규칙

모든 Codex 작업은 최신 `main`에서 시작한다.

```bash
git checkout main
git pull origin main
git status --short
git rev-parse HEAD
```

확인사항:

- 예상하지 않은 로컬 변경이 있으면 즉시 중단한다.
- 저장소 루트 및 작업 경로의 `AGENTS.md` 존재 여부를 먼저 확인한다.
- 현재 작업과 이름·범위가 겹치는 open PR/branch를 확인한다.
- 세이브포인트 브랜치에는 commit·rebase·force push하지 않는다.
- 동일 파일을 수정하는 다른 Codex 작업을 동시에 진행하지 않는다.

## 3. 필수 선행 문서

작업 전 아래 순서로 읽는다.

1. `FINPLE_STEP114_2_SCENARIO_COLAB_REARCHITECTURE_DEVELOPMENT_NOTE_2026_07_14.md`
2. `FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md`
3. `FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md`
4. `FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md`
5. `FINPLE_METRICS_CSV_POLICY_V3.md`
6. `FINPLE_METRICS_CSV_SCHEMA_V3.md`
7. `FINPLE_COLAB_ONE_CLICK_WORKFLOW.md`
8. `FINPLE_AI_OUTPUT_VALIDATOR.md`
9. `FINPLE_AI_ANALYSIS_OPERATIONS_POLICY_2026_06_27.md`

충돌 시 2026-07-14 Step 114-2 문서를 우선한다.

## 4. 구현 순서 및 PR 분할

### PR 114-2A — Colab skeleton과 fixture pipeline

목표:

- 실제 외부 데이터 호출 없이 실행 가능한 notebook skeleton
- fixture 기반 end-to-end pipeline
- 한 개의 진입함수
- ZIP·manifest·audit report 생성

권장 파일:

```text
notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb
scripts/metrics_pipeline/__init__.py
scripts/metrics_pipeline/config.py
scripts/metrics_pipeline/pipeline.py
scripts/metrics_pipeline/schemas.py
scripts/metrics_pipeline/audit.py
scripts/metrics_pipeline/tests/
data/fixtures/monthly-metrics/
```

완료 기준:

- notebook은 CONFIG와 Run all 중심이다.
- 계산 함수가 notebook cell에 중복되지 않는다.
- offline fixture만으로 실행된다.
- 동일 입력에서 manifest hash와 핵심 결과가 재현된다.
- 운영 CSV와 loader는 변경하지 않는다.

### PR 114-2B — 시계열·가격조정 정규화

목표:

- 일별 원천행과 월말 정규화 계약
- close, split-adjusted, total-return adjusted 구분
- split·cash dividend 이벤트 감사
- KR ticker 6자리 보존

완료 기준:

- adjustment basis가 불명확하면 publication 불가 상태로 분리한다.
- 날짜 중복·비양수 가격·역순·결측월 검증이 있다.
- raw 파일은 overwrite하지 않는다.
- source hash와 provenance manifest가 있다.

### PR 114-2C — 무료·공공 source adapter

목표:

- manual upload adapter
- 한국 공공데이터 adapter
- 승인 전 연구용 adapter interface
- checkpoint·retry·resume

완료 기준:

- source adapter가 공통 metadata contract를 반환한다.
- secret은 notebook 출력·manifest·Git에 남지 않는다.
- license/publication status가 자동 publish gate에 연결된다.
- 외부 응답 전체를 그대로 저장하거나 commit하지 않는다.

### PR 114-2D — rolling metrics와 신규 overlay

목표:

- US·KR rolling CAGR
- raw CAGR
- MDD와 rolling MDD
- benchmark BETA
- selectedCagr/Mdd/Beta 정책
- review_required 분리

완료 기준:

- 기존 2026-05 overlay를 overwrite하지 않고 새 월 snapshot을 생성한다.
- app export는 selected 값만 포함한다.
- 기존 KR raw CAGR override 회귀를 차단한다.
- 대표 ticker golden assertions가 있다.
- dividend double counting을 금지한다.

### PR 114-2E — STEP 2·3 월간 기준전망

목표:

- 기존 결정론적 계산의 monthly rows 생성
- STEP 2 비교선 월간 포인트
- STEP 3 월간 평가금액 선과 연간 누적구성 막대
- adaptive X-axis ticks와 월별 tooltip

완료 기준:

- 확률 시나리오는 아직 연결하지 않는다.
- 기존 최종 평가금액과 migration tolerance를 문서화한다.
- 월 성장률은 `(1 + annualCagr)^(1/12) - 1`을 사용한다.
- 월 납입 시점을 고정한다.
- 1·5·10·15·30년 차트와 모바일을 검증한다.

### PR 114-2F — 확률 엔진 fixture baseline

목표:

- synchronized monthly return matrix
- joint block bootstrap
- deterministic random seed
- value path와 NAV risk path 분리
- P10/P25/P50/P75/P90
- MDD·회복기간·손실확률

완료 기준:

- 자산별 독립 sampling이 없다.
- bootstrap에 BETA를 다시 적용하지 않는다.
- simulationCount와 blockMonths가 metadata에 기록된다.
- fixture 기반 통계 회귀 테스트가 있다.
- UI·운영 API는 아직 변경하지 않는다.

### PR 114-2G — STEP 4 확률 분석 UI

목표:

- 새 STEP 4 화면
- 단일 포트폴리오 확률 band
- 기준 CAGR 점선
- P50 중앙선
- 대표 경로 선택 기능
- 위험 카드
- 포트폴리오 탭과 요약 비교표

완료 기준:

- 다수 밴드를 한 차트에 겹치지 않는다.
- 대표 경로를 미래 예측처럼 표시하지 않는다.
- 데이터 품질 미달 시 결과를 만들지 않고 이유를 표시한다.
- loading/error/stale/unsupported 상태가 있다.
- 접근성·모바일·tooltip 검증이 있다.

### PR 114-2H — STEP 5 충격 분석 엔진·UI

목표:

- 스트레스 preset contract
- factor shock engine
- 시장충격과 BETA 전달
- 단일 포트 경로와 복수 포트 impact 비교

완료 기준:

- preset 수치에 source/policy/version이 있다.
- 역사적 bootstrap과 factor stress를 혼합하지 않는다.
- 금리·환율·유가 요인은 데이터가 검증된 범위만 공개한다.
- 사건명을 수치 근거 없이 직접 모델링하지 않는다.

### PR 114-2I — AI 분석 STEP 4 → STEP 6 이동

목표:

- 기존 AI 분석 기능을 STEP 6으로 안전하게 이동
- STEP 1~5 navigation migration
- 기존 API·사용량·플랜 권한 유지

완료 기준:

- AI backend와 validator를 재작성하지 않는다.
- 기존 AI 분석 호출·사용량 기록·에러처리가 회귀하지 않는다.
- old step state·직접 링크·저장 상태 migration을 검증한다.
- STEP 4·5 미실행 시 AI가 존재하지 않는 결과를 해석하지 않는다.

### PR 114-2J — AI 통합 해석 연결

목표:

- STEP 2~5 validated summary를 AI payload에 추가
- 계산값은 validator-approved schema로만 전달
- 데이터 품질·분석 한계 문구 추가

완료 기준:

- AI가 수치를 재계산하지 않는다.
- 허용 수치 외 숫자 환각을 차단한다.
- 결과 미실행·unsupported 상태를 구분한다.
- 투자추천·수익보장·적합성 단정 표현을 차단한다.

## 5. 병렬 작업 허용범위

허용:

- Colab/metrics pipeline과 fixture 기반 scenario engine을 서로 다른 파일에서 병렬 개발
- 문서·fixture·테스트 작업 병렬화

금지:

- 두 작업이 동시에 `portfolioCalculations.js` 수정
- 두 작업이 동시에 simulator step navigation 수정
- 두 작업이 동시에 runtime overlay/loader 수정
- 서로 다른 시계열 schema를 독립 설계
- 하나의 PR에 데이터 갱신·UI 개편·AI 이동을 모두 포함

공통 schema owner는 metrics pipeline 작업선이다. scenario engine은 해당 schema를 소비한다.

## 6. 데이터 계약 최소 필드

### 원천 가격행

```text
market
ticker
date
currency
close
splitAdjustedClose
totalReturnAdjustedClose
volume
splitFactor
cashDividend
sourceId
retrievedAt
priceAdjustmentBasis
publicationEligibility
```

### 월간 수익률행

```text
market
ticker
month
currency
priceReturn
totalReturn
fxReturn
benchmarkId
isProxy
proxyTicker
dataStatus
```

### 지표 app export

```text
ticker
market
assetType
benchmarkKey
metricBaseDate
dataYears
selectedCagr
selectedMdd
selectedBeta
dividendYield
dataStatus
reviewFlag
sourcePolicy
notes
```

## 7. 시나리오 계산 계약

필수 metadata:

```text
analysisVersion
scenarioVersion
method
simulationCount
blockMonths
rebalanceFrequency
returnBasis
currencyMode
randomSeed
dataStart
dataEnd
sourceManifestHash
```

필수 결과:

```text
percentilePaths: P10/P25/P50/P75/P90
representativePath
lossProbabilityByHorizon
goalProbability
mddDistribution
recoveryDistribution
unrecoveredRatio
dataQuality
warnings
```

평가금액 경로와 위험 NAV 경로는 별도 배열로 반환한다.

## 8. Golden Portfolio

최소 fixture:

1. US 성장형
   - QQQ/SPY 또는 이에 준하는 fixture
2. US 균형형
   - 주식/채권/금
3. KR 주식형
   - KOSPI 200 계열 fixture
4. KR/US 혼합형
   - 환율 포함
5. 상장기간 부족
   - 확률분석 unsupported 검증
6. proxy 포함
   - 경고·coverage 검증
7. 배당 포함·배당 제외
   - 중복계산 방지

각 fixture에는 기대되는 정성적 관계를 명시한다.

예:

```text
성장형의 P50 최종금액 > 균형형
성장형의 위험 MDD > 균형형
동일 seed에서 동일 결과
외부 납입금 변경은 NAV MDD를 변경하지 않음
```

특정 통계값을 지나치게 촘촘하게 고정하지 않고 tolerance를 둔다.

## 9. 테스트 명령 기준

Python:

```bash
python -m unittest discover -s scripts/metrics_pipeline/tests
python -m unittest discover -s scripts/scenario/tests
```

Node/frontend:

```bash
npm run build
npm run check:scenario-metrics
```

추가:

```bash
git diff --check
```

변경 파일 targeted lint가 가능하면 실행한다. 저장소 전체 기존 lint 오류가 있을 경우 신규 오류와 기존 오류를 분리해 보고한다.

## 10. PR 작성 규칙

PR 본문에 반드시 포함한다.

- 시작·완료 SHA
- 변경 목적
- 변경 파일
- 산식·데이터 가정
- source/provenance 상태
- 테스트 명령과 결과
- UI/CSS 변경 여부
- 운영 CSV 변경 여부
- 알려진 한계
- rollback 방법
- 다음 PR

실데이터 snapshot을 포함하는 PR은 추가로 다음을 기록한다.

- base date
- row count
- market count
- source hash
- app-ready/review-required count
- 대표 ticker 표본
- 이전 월 대비 이상 변화

## 11. 회귀 방지 경계

이번 작업선에서 임의로 변경하지 않는다.

- 인증·로그인·세션
- Toss 결제·구독
- MY PAGE 저장·계정
- 문의·메일
- Trading/KIS/order capability
- 관리자 trading readiness
- AI 사용량·플랜 권한
- 공개 업데이트 페이지

필요한 변경이 발견되면 별도 issue/PR로 분리한다.

## 12. 배포 기준

데이터·계산·UI 작업은 다음 순서를 따른다.

```text
fixture test
→ unit test
→ build
→ Vercel Preview
→ 데이터 감사보고서
→ PR review
→ main merge
→ production smoke test
```

운영 CSV pointer 변경은 마지막 독립 PR로 두는 것이 안전하다.

확률·충격 기능은 다음 조건 전까지 기본 공개하지 않는다.

- source policy 승인
- data quality gate 통과
- Golden Portfolio 회귀 통과
- 모바일·접근성 검증
- 분석 고지문 검토
- AI validator 회귀 통과

## 13. 중단·보고 조건

다음 상황에서는 임의 추정으로 진행하지 않고 중단해 보고한다.

- source 이용권한 불명확
- adjusted close 정의 불명확
- 기존 계산과 월간 계산의 최종값 차이가 tolerance 초과
- step navigation 변경이 저장 상태와 충돌
- 대표 ticker의 rolling 값이 비정상
- scenario band가 단조성 `P10 <= P25 <= P50 <= P75 <= P90`을 위반
- 동일 seed 재현 실패
- external contributions가 NAV MDD에 영향을 줌
- AI가 미실행 scenario 수치를 생성

## 14. 인수인계 완료 보고 형식

```text
1. 작업 기준
- repo / branch
- start SHA / end SHA
- AGENTS 확인
- 충돌 PR 확인

2. 구현 범위
- 완료 항목
- 보류 항목

3. 변경 파일

4. 데이터·계산 정책

5. 테스트 결과

6. 운영 영향

7. 알려진 한계

8. 다음 작업

9. commit / push / PR
```
