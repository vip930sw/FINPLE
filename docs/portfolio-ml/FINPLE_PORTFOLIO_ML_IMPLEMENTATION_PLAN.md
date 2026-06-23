# FINPLE Portfolio ML / AI Analysis Implementation Plan

작성일: 2026-06-23  
상태: Codex 개발 착수용 작업계획  
기준 문서: `FINPLE_PORTFOLIO_ML_AI_ANALYSIS_DEVELOPMENT_NOTE.md`

## 1. 전체 우선순위

개발 순서는 아래와 같이 고정한다.

```text
Phase 0 현재 구조 감사
Phase 1 Data Sentinel Baseline
Phase 2 Data Sentinel ML
Phase 3 AI Analysis Backend MVP
Phase 4 AI Analysis STEP 4 UI
Phase 5 저장·사용량·Personal 연동
Phase 6 Asset DNA
Phase 7 운영 안정화
```

예상 기간은 포트폴리오 ML만 집중할 경우 약 4~6개월이다.

| 단계 | 예상기간 | 사용자 노출 |
|---|---:|---:|
| Phase 0 | 3~5일 | 없음 |
| Phase 1 | 2~3주 | 없음 또는 관리자 결과 |
| Phase 2 | 2~3주 | 데이터 신뢰도 요약 |
| Phase 3 | 2~3주 | API 테스트 |
| Phase 4 | 2~3주 | STEP 4 AI 분석 |
| Phase 5 | 2~4주 | 저장·플랜 기능 |
| Phase 6 | 4~6주 | 자산 역할·유사성 |
| Phase 7 | 3~5주 | 운영 안정화 |

---

## 2. 공통 작업 원칙

1. 한 PR에는 한 단계 또는 한 기능만 포함한다.
2. 기존 Step 3를 수정하기 전에 백업 기준 커밋을 확인한다.
3. DOM 후처리 패치보다 React 컴포넌트 직접 구현을 우선한다.
4. UI 변경 전후 `npm.cmd run build`를 실행한다.
5. 백엔드 변경 시 `cd server && npm.cmd start` 또는 최소 import 검증을 한다.
6. AI API 키와 비밀값은 Render 서버 환경변수에만 둔다.
7. 외부 AI 연동 전 규칙형 mock 응답으로 UI를 먼저 검증한다.
8. 실시간 모델 학습을 Render 요청 처리 중에 수행하지 않는다.
9. 사용자 입력 숫자는 AI가 다시 계산하지 않는다.
10. 기존 시뮬레이터가 AI 오류로 중단되지 않도록 격리한다.

---

# Phase 0. 현재 구조 감사

## 목표

개발 전에 현재 코드, 데이터, 라우팅, 계산값 전달 구조를 문서화하고 테스트 기준을 만든다.

## 작업 항목

### 0-A. 시뮬레이터 데이터 흐름 감사

확인 파일:

```text
src/components/PersonalPage.jsx
src/components/PortfolioSimulator.jsx
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/portfolio/utils/portfolioCalculations.js
src/components/portfolio/components/DetailPanel.jsx
src/components/portfolio/components/SimulatorTabNav.jsx
```

확인 내용:

```text
activePortfolio 생성 위치
settings 상태 위치
assets 상태 위치
result 계산 위치
expectedCagr 계산 위치
expectedBeta 계산 위치
simpleMdd 계산 위치
detailReport 생성 위치
탭 변경 방식
서버 저장 포트폴리오 ID 존재 여부
```

### 0-B. 데이터 파일 인벤토리

확인 대상:

```text
src/data/tickers/
data/processed/
scripts/
notebooks/
```

출력 문서 예시:

```text
docs/portfolio-ml/FINPLE_ML_DATA_INVENTORY.md
```

필수 기록:

```text
파일 경로
행 수
티커 중복 수
US/KR 분포
필수 컬럼
결측률
데이터 기준일
생성 스크립트
원천 출처
```

### 0-C. 회귀 테스트 기준

다음 포트폴리오를 고정 fixture로 만든다.

```text
US 기본: QQQ 40 / SCHD 30 / TLT 20 / GLD 10
KR 기본: 대표지수 / 배당 / 채권 / 금 조합
단일자산: QQQ 100
단기상장 포함: QQQM 또는 신규 상장 자산 포함
결측지표 포함: 배당률 미확인 자산 포함
```

## 완료 기준

- [ ] 계산값이 어디에서 생성되는지 문서화
- [ ] AI 요청에 필요한 필드를 목록화
- [ ] 데이터 인벤토리 생성
- [ ] 고정 테스트 포트폴리오 정의
- [ ] 코드 수정 없음 또는 문서만 변경

---

# Phase 1. Data Sentinel Baseline

## 목표

머신러닝 전에 재현 가능한 규칙 기반 데이터 품질 감사 엔진을 만든다.

## 권장 파일

```text
scripts/ml/audit_asset_metrics.py
scripts/ml/config/asset_quality_rules.json
scripts/ml/tests/test_asset_metric_audit.py
data/processed/ml/asset_quality_audit_latest.csv
data/processed/ml/asset_quality_summary_latest.json
docs/portfolio-ml/FINPLE_DATA_SENTINEL_RULES.md
```

## 입력 최소 컬럼

```text
ticker
market
assetType
listingDate
dataYears
expectedCagr
beta
mdd
dividendYield
dataStatus
```

## 규칙 코드 초안

| 코드 | 조건 | 기본 처리 |
|---|---|---|
| MDD_POSITIVE | MDD > 0 | error |
| MDD_OUT_OF_RANGE | MDD < -100 | error |
| BETA_EXTREME | 자산군 기준 극단값 | review |
| CAGR_EXTREME | 자산군 기준 극단값 | review |
| DIVIDEND_EXTREME | 배당률 기준 초과 | review |
| HISTORY_MISMATCH | dataYears보다 긴 기간 지표 | error |
| TICKER_FORMAT | KR 6자리 형식 오류 | error |
| REQUIRED_MISSING | 핵심지표 결측 | review 또는 excluded |
| SHORT_HISTORY | 상장기간 기준 미달 | warning |
| PEER_DEVIATION | 유사 ETF 대비 편차 | review |

## 출력 컬럼

```text
ticker
market
qualityScore
qualityLevel
status
reasonCodes
errorCount
warningCount
recommendedMetricPolicy
dataVersion
auditedAt
```

## 점수 초안

```text
100점 시작
error 1건당 -30
review 1건당 -15
warning 1건당 -5
최저 0
```

점수 기준은 초기 검수 후 조정한다.

## 완료 기준

- [ ] 동일 입력에서 동일 출력
- [ ] 오류 사유코드 복수 저장
- [ ] 전체·시장별·자산유형별 요약 JSON
- [ ] 원본 파일 수정 없음
- [ ] 자동 보정 없음
- [ ] 최소 20개 수동 검수 표본
- [ ] Python 테스트 통과

---

# Phase 2. Data Sentinel ML

## 목표

규칙형 감사 결과에 비지도 이상치 탐지를 결합한다.

## 권장 모델 순서

```text
1. RobustScaler
2. 자산유형별 그룹 분리
3. Isolation Forest
4. 필요 시 Local Outlier Factor 비교
```

딥러닝과 GPU는 사용하지 않는다.

## 권장 파일

```text
scripts/ml/train_asset_anomaly_model.py
scripts/ml/run_asset_anomaly_inference.py
scripts/ml/evaluate_asset_anomaly_model.py
models/asset-quality/.gitkeep
notebooks/ml/FINPLE_asset_quality_experiment.ipynb
docs/portfolio-ml/FINPLE_DATA_SENTINEL_MODEL_CARD.md
```

모델 바이너리는 저장소 크기와 보안을 고려해 Git LFS 또는 외부 저장소 정책을 먼저 검토한다.

## 특징값 초안

```text
expectedCagr
beta
mdd
dividendYield
dataYears
volatility
assetType encoded
market encoded
peerGroup encoded
missingCount
```

## 성능 평가

검수 라벨을 아래 세 종류로 유지한다.

```text
valid
review
invalid
```

목표:

```text
Precision >= 0.90
Recall >= 0.85
False Positive Rate <= 0.05
```

초기 데이터가 부족하면 수치 목표를 강제하지 않고 baseline 대비 개선 여부를 우선 평가한다.

## 완료 기준

- [ ] 규칙형 결과와 ML 결과를 별도 컬럼으로 유지
- [ ] 모델 버전 기록
- [ ] 특징 스키마 버전 기록
- [ ] 자산유형별 오탐 분석
- [ ] 모델 결과만으로 자동 보정하지 않음
- [ ] 모델 카드 작성

---

# Phase 3. AI Analysis Backend MVP

## 목표

구조화된 포트폴리오 요청을 받아 검증된 JSON 해석 결과를 반환한다.

## 3-A. Mock 분석 엔진

외부 AI API 전에 규칙형 mock을 구현한다.

권장 파일:

```text
server/src/routes/aiPortfolioAnalysisRoutes.js
server/src/services/aiPortfolioAnalysisService.js
server/src/services/aiPortfolioAnalysisMock.js
server/src/services/aiOutputValidator.js
server/src/schemas/aiPortfolioAnalysisSchema.js
```

환경변수:

```text
FINPLE_AI_ANALYSIS_MODE=mock
FINPLE_AI_ANALYSIS_PROVIDER=none
```

API:

```text
POST /api/ai/portfolio-analysis
```

Mock 응답은 다음 항목을 반환한다.

```text
dataQuality
portfolioProfile
diversification
riskFactors
assetRoles
limitations
disclaimer
```

## 3-B. 요청 검증

검증 항목:

```text
세션 사용자
플랜
portfolioId 형식
assets 배열
자산 수 제한
비중 합계
숫자 범위
본문 크기
```

## 3-C. 출력 검증

필수 조건:

```text
입력에 없는 숫자 금지
금지어 탐지
필수 면책문구
JSON schema
최대 길이
허용된 티커만 언급
```

## 3-D. 외부 AI Provider

Mock 완료 후에만 외부 Provider adapter를 추가한다.

```text
server/src/services/ai/providers/openAiProvider.js
```

환경변수 예시:

```text
FINPLE_AI_ANALYSIS_MODE=live
FINPLE_AI_ANALYSIS_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_AI_ANALYSIS_MODEL=...
```

모델명은 코드에 하드코딩하지 않는다.

## 완료 기준

- [ ] mock 모드 동작
- [ ] 외부 API 없이 테스트 가능
- [ ] 잘못된 요청 400 반환
- [ ] provider 실패 시 502 또는 명확한 오류
- [ ] 입력 숫자 불일치 검증
- [ ] 비밀값 프론트 노출 없음
- [ ] `server/src/index.js` 라우트 연결

---

# Phase 4. AI Analysis STEP 4 UI

## 목표

기존 `/simulator` 안에 STEP 4 `AI 분석`을 추가한다.

## 수정 파일

```text
src/components/PersonalPage.jsx
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/SimulatorTabNav.jsx
src/components/portfolio/components/AiAnalysisPanel.jsx
src/components/portfolio/services/aiAnalysisService.js
src/components/portfolio/utils/buildAiAnalysisPayload.js
src/components/portfolio/components/AiAnalysisPanel.css 또는 기존 CSS 파일
```

## 구체적 변경

### PersonalPage.jsx

```text
SIMULATOR_STEP_ITEMS에 { key: "ai", step: "Step 4" } 추가
```

### PortfolioSimulator.jsx

```text
PORTFOLIO_SIMULATOR_TABS에 "ai" 추가
AiAnalysisPanel import
anchorMap에 ai-analysis 추가
active tab ai일 때 렌더
floating dropdown 노출 여부 검토
```

### SimulatorTabNav.jsx

```text
STEP 4 / AI 분석 추가
threeStepNav 클래스 의존성 제거 또는 fourStep 대응
모바일 줄바꿈 확인
```

### AiAnalysisPanel.jsx

상태:

```text
idle
validating
generating
success
error
stale
```

버튼:

```text
AI 분석 생성
다시 생성
```

## 화면 블록

```text
AI 분석 소개
분석 대상 포트폴리오
데이터 신뢰도
포트폴리오 성격
실질 분산도
자산 역할
주요 위험요인
데이터 한계
투자 유의사항
```

## 중요 UX

1. 탭 진입만으로 API를 자동 호출하지 않는다.
2. 입력 포트폴리오가 변경되면 기존 결과를 `stale`로 표시한다.
3. API 실패 시 재시도 버튼을 제공한다.
4. Step 3로 돌아가도 결과를 현재 세션에서 유지할 수 있다.
5. 분석 중 탭 이동이 가능해야 한다.
6. 모바일에서는 카드가 1열로 표시되어야 한다.

## 완료 기준

- [ ] STEP 1~3 회귀 없음
- [ ] STEP 4 탭 정상 이동
- [ ] mock API로 전체 UI 검증
- [ ] 로딩·오류·빈 상태 구현
- [ ] 모바일 확인
- [ ] `npm.cmd run build` 성공

---

# Phase 5. 저장·사용량·Personal 연동

## 목표

분석 결과를 서버에 저장하고 플랜별 사용량을 통제한다.

## DB migration 초안

```text
server/db/migrations/00X_ai_analysis_reports.sql
```

필수 컬럼:

```text
id
user_id
portfolio_id
analysis_version
model_provider
model_name
input_hash
input_snapshot_json
output_json
validation_status
created_at
updated_at
```

## 사용량 정책

개발 초안:

```text
Free: 월 소량 또는 미리보기
Personal: 월 확대 또는 합리적 한도
Admin: 테스트 예외
```

구체적 수량은 실제 비용 측정 후 결정한다.

## API 추가

```text
GET /api/ai/portfolio-analysis?portfolioId=...
GET /api/ai/portfolio-analysis/:reportId
DELETE /api/ai/portfolio-analysis/:reportId
```

## 완료 기준

- [ ] 사용자별 데이터 분리
- [ ] 다른 사용자 reportId 접근 차단
- [ ] input hash 중복 캐시
- [ ] 사용량 집계
- [ ] 삭제 가능
- [ ] MY PAGE 연동은 별도 PR

---

# Phase 6. Asset DNA

## 목표

자산 역할·유사도·실질 노출을 계산해 AI 분석 품질을 높인다.

## 작업 흐름

```text
특징 생성
→ 표준화
→ PCA 또는 차원축소
→ 군집화
→ 사람이 군집 의미 검수
→ 역할 라벨 부여
→ 유사자산 거리 계산
```

## 권장 출력

```text
primaryRole
secondaryRoles
roleConfidence
peerGroup
similarAssets
riskTags
featureVersion
modelVersion
```

## 사용자 기능

```text
실질 분산도
유사자산 중첩
자산 역할 비중
유사 ETF 안내
```

유사자산은 추천이 아니라 특성 비교로 표시한다.

## 완료 기준

- [ ] 자산유형별 군집 검수
- [ ] 대표자산 50개 수동 점검
- [ ] 역할 라벨 설명 가능
- [ ] 분석 근거 제공
- [ ] 스크리너 연결은 별도 PR

---

# Phase 7. 운영 안정화

## 필수 항목

```text
API timeout
retry 정책
rate limit
result cache
provider 비용 로그
모델 버전
데이터 버전
금지문구 로그
validation failure 로그
분석 재생성 이력
관리자 검수
```

## 장애 원칙

```text
AI 장애 → Step 4만 오류
Data Sentinel 파일 누락 → 기존 지표로 Step 1~3 동작
외부 AI API 장애 → mock으로 자동 전환하지 않음
잘못된 JSON → 사용자에게 노출하지 않음
```

## 완료 기준

- [ ] 운영 로그
- [ ] 비용 모니터링
- [ ] 관리자 확인 수단
- [ ] 이용약관·개인정보·면책 문구 검토
- [ ] 베타 테스트 시나리오
- [ ] 업데이트 페이지용 릴리스 노트

---

# 3. 권장 PR 분할

```text
PR 1 문서·데이터 인벤토리
PR 2 Data Sentinel 규칙형 스크립트
PR 3 Data Sentinel 테스트·결과 파일
PR 4 ML 실험 코드와 모델 카드
PR 5 AI Analysis mock backend
PR 6 STEP 4 UI shell
PR 7 STEP 4 API 연결
PR 8 AI output validator
PR 9 저장 DB·조회 API
PR 10 MY PAGE 분석내역
PR 11 Asset DNA offline pipeline
PR 12 Asset DNA UI 연결
```

한 PR에서 백엔드, DB, 전체 UI를 동시에 변경하지 않는다.

---

# 4. 첫 Codex 작업 권장안

작업명:

```text
Step 113-1A: Audit current portfolio metrics and create ML data inventory
```

범위:

```text
코드 수정 최소화
현재 자산 데이터 파일 목록 조사
필수 컬럼·결측·중복·시장별 행 수 출력
감사 결과 문서 생성
기존 앱 동작 변경 금지
```

산출물:

```text
scripts/ml/audit_ml_data_inventory.py
data/processed/ml/finple_ml_data_inventory.json
docs/portfolio-ml/FINPLE_ML_DATA_INVENTORY.md
```

검증:

```text
python scripts/ml/audit_ml_data_inventory.py
npm.cmd run build
```

이 첫 작업이 끝난 뒤 Data Sentinel 규칙을 구현한다.
