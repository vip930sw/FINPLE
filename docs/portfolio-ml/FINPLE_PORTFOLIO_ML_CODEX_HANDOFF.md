# FINPLE Portfolio ML / AI Analysis Codex Handoff

작성일: 2026-06-23  
저장소: `vip930sw/FINPLE`  
기준 브랜치: `main`  
문서 브랜치: `step113-portfolio-ml-ai-docs`

## 1. Codex가 먼저 읽을 문서

작업 시작 전 아래 문서를 순서대로 읽는다.

```text
1. README.md
2. docs/portfolio-ml/FINPLE_PORTFOLIO_ML_AI_ANALYSIS_DEVELOPMENT_NOTE.md
3. docs/portfolio-ml/FINPLE_PORTFOLIO_ML_IMPLEMENTATION_PLAN.md
4. docs/portfolio-ml/FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md
```

기존 배포·데이터 문서도 필요한 범위에서 확인한다.

```text
docs/data-sources/
docs/FINPLE_step97_auth_operational_check.md
```

---

## 2. 프로젝트 현황

FINPLE은 React/Vite 프론트엔드, Node/Express 백엔드, Supabase PostgreSQL, Vercel, Render 구조다.

```text
Frontend: Vercel
Backend: Render
Database: Supabase
Repository: vip930sw/FINPLE
```

주요 명령:

```powershell
npm install
npm.cmd run build

cd server
npm install
npm.cmd start
```

현재 React 라우팅은 React Router가 아니라 `App.jsx`, `PersonalPage.jsx`, History API, 내부 상태 조합이다.

---

## 3. AI 분석 UX 결정사항

AI 분석은 별도 최상위 메뉴가 아니다.

```text
STEP 1 시뮬레이터
STEP 2 포트폴리오
STEP 3 상세분석
STEP 4 AI 분석
```

초기 URL은 `/simulator`를 유지한다.

```text
탭 키: ai
앵커: ai-analysis
컴포넌트: AiAnalysisPanel.jsx
```

다음 작업은 금지한다.

```text
상단 메뉴에 독립 AI 분석 추가
/simulator와 분리된 신규 입력화면 생성
독립 라우터부터 구현
기존 DetailPanel 구조 재작성
기존 계산식을 AI 계산으로 대체
```

---

## 4. 현재 핵심 코드 위치

### 라우팅·화면

```text
src/App.jsx
src/components/PersonalPage.jsx
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/SimulatorTabNav.jsx
src/components/portfolio/components/DetailPanel.jsx
```

### 시뮬레이터 상태·계산

```text
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/portfolio/utils/portfolioCalculations.js
```

### 서버

```text
server/src/index.js
server/src/routes/
server/src/services/
server/db/migrations/
```

### 데이터

```text
src/data/tickers/
data/processed/
scripts/
notebooks/
```

---

## 5. 현재 코드에서 주의할 점

## 5.1 main.jsx import order

`src/main.jsx`에는 다수의 DOM/CSS patch import가 있다. 새 기능이 기존 화면에 영향을 주는지 확인할 때 JSX만 보지 말고 `main.jsx` import 순서와 patch 파일을 같이 확인한다.

특히 기존 화면 수정 시 다음 원칙을 지킨다.

```text
React 컴포넌트 직접 구현 우선
MutationObserver 기반 후처리 금지
innerHTML로 React 영역 재렌더링 금지
새 patch 파일 추가는 최후 수단
```

## 5.2 Step 3 안정성

`DetailPanel.jsx`는 과거 블랭크 복구 이력이 있다.

```text
기존 props 삭제 금지
format 함수 전달 누락 주의
PerformanceChart props 주의
DetailAssetTable props 주의
기존 PDF·인쇄·복사 기능 회귀 금지
```

AI 분석은 `DetailPanel` 내부에 대규모로 삽입하지 말고 독립 Step으로 만든다.

## 5.3 라우팅

`PersonalPage.jsx`의 `SIMULATOR_STEP_ITEMS`, `PortfolioSimulator.jsx`의 `PORTFOLIO_SIMULATOR_TABS`, `SimulatorTabNav.jsx`의 `TAB_ITEMS`가 서로 일치해야 한다.

향후 Step 4 구현 시 세 파일에서 동일한 키 `ai`를 사용한다.

## 5.4 비밀값

다음 값은 프론트 또는 GitHub에 저장하지 않는다.

```text
OPENAI_API_KEY
DATABASE_URL
SUPABASE password
FINPLE_ADMIN_TOKEN
TOSS_SECRET_KEY
KIS_APP_SECRET
기타 provider secret
```

`VITE_` 환경변수에는 공개 가능한 API base URL만 둔다.

---

## 6. 기능 경계

### 기존 FINPLE 계산 엔진이 소유하는 값

```text
CAGR
BETA
MDD
Calmar
배당률
예상 평가금액
실질가치
연차별 성과
자산 비중
```

### Data Sentinel이 소유하는 값

```text
qualityScore
qualityLevel
status
reasonCodes
anomalyType
confidence
dataVersion
```

### Asset DNA가 소유하는 값

```text
primaryRole
secondaryRoles
peerGroup
similarAssets
riskTags
roleConfidence
```

### AI Analysis가 소유하는 값

```text
portfolioProfile
diversificationSummary
riskFactors
assetRoleExplanation
limitations
disclaimer
```

AI Analysis는 기존 지표를 읽고 해석만 한다.

---

## 7. 작업 순서

Codex는 아래 순서를 건너뛰지 않는다.

```text
Step 113-1A 데이터 인벤토리
Step 113-1B 규칙형 Data Sentinel
Step 113-1C 감사 테스트·수동 검수
Step 113-2A 비지도 이상치 실험
Step 113-2B 모델 카드·평가
Step 113-3A mock AI backend
Step 113-3B output validator
Step 113-4A STEP 4 UI shell
Step 113-4B mock API 연결
Step 113-4C live provider adapter
```

첫 작업에서는 STEP 4 UI를 만들지 않는다.

---

## 8. 첫 Codex 작업 지시문

아래 문구를 새 Codex 스레드의 첫 작업 지시로 사용한다.

```text
Repository: vip930sw/FINPLE
Base branch: main

Read these files first:
- README.md
- docs/portfolio-ml/FINPLE_PORTFOLIO_ML_AI_ANALYSIS_DEVELOPMENT_NOTE.md
- docs/portfolio-ml/FINPLE_PORTFOLIO_ML_IMPLEMENTATION_PLAN.md
- docs/portfolio-ml/FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md

Task: Step 113-1A — Audit current portfolio metrics and create the ML data inventory.

Goals:
1. Inspect the actual asset CSV/JSON sources under src/data/tickers and data/processed.
2. Identify which files feed the current screener and simulator.
3. Produce a reproducible inventory containing file path, row count, duplicate ticker count, US/KR distribution, required columns, missing-value counts, data date/version, and likely generating script.
4. Add a Python audit script under scripts/ml that reads the real repository files and writes a JSON inventory under data/processed/ml.
5. Add docs/portfolio-ml/FINPLE_ML_DATA_INVENTORY.md summarizing the findings.

Constraints:
- Do not change runtime application behavior.
- Do not modify UI, CSS, routes, authentication, payment, portfolio calculations, or server APIs.
- Do not create AI Analysis Step 4 yet.
- Do not add large generated datasets or model binaries.
- Preserve leading zeros in Korean tickers.
- Treat missing dividendYield differently from confirmed 0.
- Make paths configurable instead of hardcoding a single filename where practical.
- Fail with a clear message if a required source file is missing.

Validation:
- Run the Python audit script.
- Inspect the generated JSON.
- Run npm.cmd run build.
- Report exact files changed, commands run, results, and remaining data ambiguities.

Git workflow:
- Create a new branch from latest main.
- Use a Step 113-1A commit message.
- Open a Draft PR.
- Do not merge automatically.
```

---

## 9. 두 번째 Codex 작업 지시문

Step 113-1A 완료 후 아래 작업을 사용한다.

```text
Task: Step 113-1B — Implement the rule-based Data Sentinel baseline.

Read the portfolio ML documents and the Step 113-1A data inventory first.

Goals:
1. Create explicit, versioned quality rules for ticker format, missing core metrics, invalid MDD, extreme CAGR, extreme beta, extreme dividend yield, short history, and data-period mismatch.
2. Run the rules against the currently app-ready asset data.
3. Produce a non-destructive audit CSV and summary JSON.
4. Add unit tests for representative valid, warning, review, and invalid rows.
5. Document each reason code and its severity.

Constraints:
- Never rewrite the source CSV automatically.
- Do not infer missing values as zero.
- Do not auto-correct metrics.
- Keep rule thresholds configurable.
- Separate rule output from future ML anomaly output.
- No UI changes.

Validation:
- Run Python tests.
- Run the audit script.
- Confirm deterministic output.
- Run npm.cmd run build.
- Open a Draft PR and do not merge automatically.
```

---

## 10. AI Backend Codex 지시문

Data Sentinel이 검증된 뒤 사용한다.

```text
Task: Step 113-3A — Add the mock Portfolio AI Analysis backend.

Goals:
1. Add POST /api/ai/portfolio-analysis.
2. Accept a validated structured portfolio payload.
3. Return a deterministic mock JSON response matching the documented AI Analysis contract.
4. Add a strict output validator and forbidden-language filter.
5. Keep the provider architecture ready for a future live LLM adapter.

Constraints:
- Default mode must be mock.
- Do not call an external LLM yet.
- Do not calculate CAGR, MDD, BETA, Calmar, dividend, or future value in the AI service.
- Reject invalid numeric input.
- Never expose secrets to the frontend.
- Do not modify payment or authentication behavior except reusing the existing session validation pattern.

Validation:
- Start the backend locally.
- Test valid and invalid payloads.
- Confirm the existing /api/health and asset endpoints still work.
- Run npm.cmd run build at repository root.
- Open a Draft PR.
```

---

## 11. STEP 4 UI Codex 지시문

Mock API가 안정화된 뒤 사용한다.

```text
Task: Step 113-4A — Add the Portfolio Simulator Step 4 AI Analysis UI shell.

Goals:
1. Add the ai tab consistently to PersonalPage, PortfolioSimulator, and SimulatorTabNav.
2. Create AiAnalysisPanel as a standalone React component.
3. Add idle, loading, success, stale, and error states.
4. Build the request payload only from the existing simulator state and calculated metrics.
5. Connect to the mock AI analysis API through a dedicated service module.

Constraints:
- Keep /simulator as the route.
- Do not create a top-level AI menu.
- Do not modify DetailPanel except shared utility extraction when absolutely necessary.
- Do not use MutationObserver or DOM patch files.
- Do not auto-generate analysis on tab entry.
- Preserve Step 1–3 behavior and mobile layout.
- AI failure must not blank the simulator.

Validation:
- Test every simulator tab.
- Test changing a portfolio after an analysis and mark the result stale.
- Test API failure and retry.
- Test mobile layout.
- Run npm.cmd run build.
- Open a Draft PR.
```

---

## 12. PR 작성 기준

PR 본문에는 다음을 포함한다.

```text
Summary
Scope
Files changed
Commands run
Test results
Screenshots if UI changed
Data assumptions
Known limitations
Rollback notes
Next step
```

PR 제목 예시:

```text
Step 113-1A: Audit portfolio ML data sources
Step 113-1B: Add Data Sentinel rule baseline
Step 113-3A: Add mock portfolio AI analysis endpoint
Step 113-4A: Add simulator AI analysis step shell
```

---

## 13. 금지사항

```text
한 PR에서 데이터·백엔드·UI·DB를 모두 구현
main에 직접 커밋
Vercel Preview 확인 없이 UI 머지
Render 환경변수를 코드에 하드코딩
AI 결과를 그대로 사용자에게 표시
규칙 없이 모델 결과로 원본 데이터 수정
기존 계산식 변경을 ML 작업에 포함
알고리즘 매매 기능을 AI 분석 PR에 혼합
뉴스 기능을 포트폴리오 ML PR에 혼합
```

---

## 14. 인수인계 체크리스트

Codex 작업 종료 시 아래를 남긴다.

- [ ] 작업 브랜치
- [ ] 커밋 SHA
- [ ] Draft PR 번호
- [ ] 변경 파일 목록
- [ ] 실행 명령
- [ ] 빌드·테스트 결과
- [ ] 생성 데이터 기준일
- [ ] 적용한 규칙 또는 모델 버전
- [ ] 미해결 항목
- [ ] 다음 작업의 정확한 시작점

---

## 15. 최종 기준

```text
기존 계산을 바꾸지 않는다.
데이터를 먼저 검증한다.
AI는 숫자를 만들지 않는다.
분석 근거를 구조화한다.
사용자에게 추천이 아닌 해석을 제공한다.
작은 PR로 검증하면서 진행한다.
```
