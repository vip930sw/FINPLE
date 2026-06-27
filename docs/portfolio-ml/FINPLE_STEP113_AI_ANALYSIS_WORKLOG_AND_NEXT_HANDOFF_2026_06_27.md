# FINPLE STEP 113 AI Analysis Worklog and Next Handoff

작성일: 2026-06-27
대상 저장소: `vip930sw/FINPLE`
기준 브랜치: `main`
완료 범위: STEP 4 포트폴리오 AI 분석 운영 안정화
다음 작업: Issue #221, Step 114-1A 시나리오·지표 시계열 데이터 감사

## 현재 결론

STEP 4 포트폴리오 AI 분석 작업은 live provider 연결, output validator, 결과 저장, 진단 요약 UI, 사용량 기록, Personal 권한 제어, 관리자 사용량 화면, 품질 fixture v3, 비용/사용량 운영 정책까지 정리된 상태다.

운영 확인 기준은 다음과 같다.

```powershell
npm.cmd run check:ai-production
```

2026-06-27 최종 확인값:

```text
backend commit = 280f36a
AI status = live/openai/personal
usage = 0/20 used
storage = postgres
frontend HEAD = 200
```

## 주요 작업내역

### Live AI provider와 output contract

- OpenAI live provider adapter를 연결했다.
- frontend에는 OpenAI key를 두지 않고 Render backend에서만 호출한다.
- `ai-analysis-output-contract-v2`를 기준으로 top-level field, diagnosticSections, riskFactors, assetRoles, limitations를 검증한다.
- 매수, 매도, 보유, 목표 비중, 수익 보장, 입력에 없는 ticker와 숫자 생성을 차단한다.

### STEP 4 UI

- 포트폴리오 시뮬레이터 STEP 4 명칭을 `포트폴리오 AI 분석`으로 정리했다.
- 결과 화면을 프로필 요약, 입력 데이터, 진단 요약, 위험요인, 자산 역할, 분석 한계로 구성했다.
- `diagnosticSections`는 현재 정확히 3개로 고정하고, 화면도 실제 응답 3개만 3행 1열로 표시한다.
- Free 플랜은 분석 생성 대신 플랜 안내를 보여주고, Personal/Pro/교육 계정은 분석 버튼과 남은 횟수를 표시한다.

### 사용량과 접근 제어

- `ai_analysis_usage_events` 기반 DB persistence를 추가했다.
- status API가 usage snapshot과 access state를 함께 반환한다.
- 관리자 API와 관리자 UI에서 최근 24시간, 최근 7일, 성공률, 상태 분포, 플랜 분포, 최근 이벤트를 확인한다.
- 운영 env 기준:

```env
FINPLE_AI_ANALYSIS_MODE=live
FINPLE_AI_ANALYSIS_PROVIDER=openai
FINPLE_AI_ANALYSIS_ACCESS_MODE=personal
FINPLE_AI_ANALYSIS_ALLOWED_PLANS=personal,pro
FINPLE_AI_ANALYSIS_PUBLIC_LIMIT_PER_WINDOW=20
FINPLE_AI_ANALYSIS_PERSONAL_LIMIT_PER_WINDOW=20
FINPLE_AI_ANALYSIS_LIMIT_WINDOW_MS=86400000
```

### 품질 평가셋 v3

- regression fixture version을 `ai-analysis-regression-fixtures-v3`로 확정했다.
- 최소 fixture 수는 6개다.
- 필수 커버리지는 US/KR, ready/short/manual 데이터 상태, 성장 집중, 한국 숫자 ticker, 현금흐름, duration risk, 데이터 경고, live sample alignment다.
- 실제 화면 QA에서 반복 확인된 `QQQ`, `SCHD`, `BND`, `TLT`, `VNQ`, `GLD`, `CASH` 균형형 성장 포트폴리오를 deterministic fixture로 흡수했다.

## 작업 지침

- 작업 시작 시 반드시 로컬 `main`, 원격 `main`, 운영 Render/Vercel 상태를 확인한다.
- 실제 GitHub 저장소 소스 기준으로 작업한다. 이미지나 설명만 보고 별도 시안을 만들지 않는다.
- OpenAI key는 Render backend에만 둔다. Vercel/frontend에 설정하지 않는다.
- live OpenAI 호출은 비용이 발생하므로 사용자가 명시적으로 요청할 때만 수행한다.
- AI 분석 결과는 투자 추천, 매수, 매도, 보유, 목표 비중, 수익 보장으로 표현하지 않는다.
- 한국어 문서는 UTF-8 기준으로 작성하고 PowerShell 콘솔 mojibake만 보고 내용을 되돌리지 않는다.
- 변경 후 최소 검증:

```powershell
node --test server\src\services\aiPortfolioAnalysis.test.js server\src\services\aiAnalysisAccessControl.test.js server\src\services\aiAnalysisUsageControl.test.js server\src\services\aiAnalysisUsageRepository.test.js server\src\services\aiAnalysisEntitlementService.test.js
npm.cmd run build
git diff --check
npm.cmd run check:ai-production
```

## 관련 문서

- `docs/portfolio-ml/FINPLE_AI_ANALYSIS_HANDOFF_2026_06_27.md`
- `docs/portfolio-ml/FINPLE_AI_ANALYSIS_OPERATIONS_POLICY_2026_06_27.md`
- `docs/portfolio-ml/FINPLE_AI_ANALYSIS_QUALITY_FIXTURES_V3.md`
- `docs/portfolio-ml/FINPLE_AI_ANALYSIS_DIAGNOSTIC_SECTIONS.md`
- `docs/portfolio-ml/FINPLE_AI_OUTPUT_VALIDATOR.md`

## 다음 작업: Issue #221

Issue #221은 시나리오 분석과 지표 정상화 구현 전에 실제 데이터 보유 범위를 감사하는 작업이다.

목표 산출물:

1. `docs/portfolio-ml/FINPLE_SCENARIO_DATA_INVENTORY.md`
2. `data/processed/scenario_data_coverage.csv`
3. `docs/portfolio-ml/FINPLE_METRICS_RECALCULATION_INPUT_AUDIT.md`
4. 대표자산별 Raw·Rolling 재산출 가능 여부 표

금지사항:

- 확률 시나리오 계산 구현 금지
- Compare chart 수정 금지
- 기존 `calculatePortfolioResult()` 수정 금지
- 요약 CAGR/BETA/MDD만으로 임의 확률 생성 금지
- 데이터 누락을 0으로 대체 금지

## 다음 채팅 첫 대화 문구

```text
FINPLE 저장소 vip930sw/FINPLE의 main 브랜치에서 이어서 작업해주세요.

이번 작업은 Issue #221 — Step 114-1A: Audit scenario and metric time-series data 입니다.
반드시 실제 GitHub 저장소 소스 기준으로 작업하고, 시작 시 로컬/원격 main 및 Render/Vercel 운영 상태를 확인해주세요.

먼저 아래 문서를 읽어 현재 상태를 파악해주세요.
- docs/portfolio-ml/FINPLE_STEP113_AI_ANALYSIS_WORKLOG_AND_NEXT_HANDOFF_2026_06_27.md
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_CODEX_HANDOFF.md
- docs/portfolio-ml/FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md

이번 목표는 시나리오 분석 구현이 아니라, 5600여 개 자산 CSV와 기존 데이터 파이프라인에서 Raw CAGR, Rolling CAGR, MDD, Rolling MDD, BETA 재산출에 필요한 시계열 데이터가 실제로 어디까지 있는지 감사하는 것입니다.

확인 대상:
- data/
- src/data/
- scripts/
- notebooks/
- server/
- docs/data-sources/
- 자산별 일별 또는 월말 가격 시계열
- 조정가격 또는 총수익 시계열
- 배당 데이터
- S&P 500, Nasdaq-100, 미국 전체시장, KOSPI 200 기준 데이터
- KOSPI·KOSDAQ BETA 벤치마크
- 원·달러 환율 시계열
- 자산별 데이터 시작일·종료일
- proxy 또는 지수 대체 표시
- 현재 Raw CAGR·Rolling CAGR·MDD·Rolling MDD·BETA 산출 원본

산출물:
1. docs/portfolio-ml/FINPLE_SCENARIO_DATA_INVENTORY.md
2. data/processed/scenario_data_coverage.csv
3. docs/portfolio-ml/FINPLE_METRICS_RECALCULATION_INPUT_AUDIT.md
4. 대표자산별 Raw·Rolling 재산출 가능 여부 표

필수 대표자산:
US: SPY / VOO / IVV, VTI / ITOT / SCHB, QQQ / QQQM
KR: 069500 / 102110 / 148020, 105190 / 152100 / 278530

주의사항:
- 런타임 코드, CSS, 라우터, DB 변경은 하지 말아주세요.
- 확률 시나리오 계산 구현, Compare chart 수정, calculatePortfolioResult() 수정은 금지입니다.
- 누락 데이터를 추측하거나 0으로 대체하지 말고, A/B/C 등급으로 보유 범위를 명확히 구분해주세요.
- 작업 후 npm.cmd run build, 관련 데이터/문서 검증, git diff --check를 실행하고 커밋/푸시까지 진행해주세요.

진행률 퍼센티지도 중간중간 표시해주세요.
```
