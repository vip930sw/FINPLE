# FINPLE Portfolio ML Documentation

작성일: 2026-06-26

이 폴더는 FINPLE 포트폴리오 머신러닝, 사용자용 AI 분석, 시나리오 분석 및 핵심 지표 산정정책의 기준 문서를 보관한다.

## 문서 순서

1. `FINPLE_AI_ML_WORK_PLAN.md`
   - AI 분석/ML 전체 작업계획
   - 난이도와 예상 구현 기간
   - PR 분할과 Step 113-1A 시작점
   - 제품·기술·규제 주의사항

2. `FINPLE_PORTFOLIO_ML_AI_ANALYSIS_DEVELOPMENT_NOTE.md`
   - 제품 방향
   - 기능 경계
   - 화면·라우터 결정
   - 데이터·API·DB 초안
   - 보안·규제 원칙

3. `FINPLE_PORTFOLIO_ML_IMPLEMENTATION_PLAN.md`
   - 단계별 개발순서
   - 예상기간
   - PR 분할
   - 완료 기준
   - 첫 구현 작업 정의

4. `FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md`
   - Codex 작업 규칙
   - 현재 코드 주의사항
   - 첫 작업 프롬프트
   - Data Sentinel, AI Backend, STEP 4 UI 작업 지시문
   - PR·테스트·인수인계 기준

5. `FINPLE_ML_DATA_INVENTORY.md`
   - Step 113-1A 데이터 인벤토리 결과
   - 현재 앱 import CSV 목록
   - app-ready 후보 수와 주요 결측
   - 다음 Data Sentinel 규칙 기준

6. `FINPLE_DATA_SENTINEL_RULES.md`
   - Step 113-1B 규칙형 Data Sentinel baseline
   - reason code와 severity
   - 감사 결과 요약
   - 수동 검수와 다음 threshold 조정 기준

7. `FINPLE_DATA_SENTINEL_MANUAL_REVIEW_2026_06_25.md`
   - Step 113-1C 수동 검수 기록
   - `DATA_PERIOD_MISMATCH` severity 조정 근거
   - 배당 결측과 무배당 확정 분리 기준
   - 다음 threshold 세분화 과제

8. `FINPLE_DATA_SENTINEL_ANOMALY_EXPERIMENT.md`
   - Step 113-2A 비지도 이상치 실험
   - `robust_mad_baseline` scoring logic
   - `ml_normal` / `ml_watch` / `ml_review` 결과 요약
   - 규칙 결과와 ML 결과 분리 기준

9. `FINPLE_DATA_SENTINEL_MODEL_CARD.md`
   - Step 113-2B 모델 카드와 proxy 평가
   - feature schema와 threshold
   - 운영 사용 가능/금지 범위
   - 다음 실험 기준

10. `FINPLE_AI_ML_PROGRESS_2026_06_25.md`
    - 현재 진행 위치
    - Step 113 기준 진행률
    - 전체 장기 로드맵 기준 진행률
    - 다음 작업 시작점

11. `FINPLE_AI_ANALYSIS_MOCK_BACKEND.md`
    - Step 113-3A mock AI backend
    - `/api/ai/portfolio-analysis` endpoint
    - request schema와 output validator
    - 외부 AI API 연결 전 제품 경계

12. `FINPLE_AI_OUTPUT_VALIDATOR.md`
    - Step 113-3B output validator
    - response contract snapshot
    - 금지 표현, ticker mention, numeric hallucination 차단
    - STEP 4 UI 연결 전 API 계약 기준

13. `FINPLE_AI_ANALYSIS_STEP4_UI_SHELL.md`
    - Step 113-4A STEP 4 AI 분석 UI shell
    - simulator tab nav와 route subnav 연결
    - API 자동 호출 없는 empty/ready 상태 화면
    - 다음 mock API 연결 기준

14. `FINPLE_AI_ANALYSIS_MOCK_API_CONNECTION.md`
    - Step 113-4B STEP 4 UI와 mock API 연결
    - payload builder와 frontend service
    - loading, success, error, stale 상태 전환
    - Vercel/Render 환경변수 확인 기준

15. `FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md`
    - 기준 CAGR 전망과 확률 시나리오의 역할 구분
    - 하락확률·손실규모·MDD·회복기간 정의
    - BETA 중복 반영 방지 원칙
    - 미국·한국·혼합 시장 벤치마크 정책
    - 차트·UI·고지·플랜 범위

16. `FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md`
    - 현재 결정론적 계산과 비교차트 감사 결과
    - 시계열 데이터 요구사항과 등급
    - 시나리오 백엔드·API·프론트 구조
    - Rolling 분석, Block Bootstrap, 스트레스 테스트
    - Step 114 개발순서·PR 분할·검증 기준

17. `FINPLE_SCENARIO_ANALYSIS_CODEX_HANDOFF.md`
    - Step 114 Codex 작업 규칙
    - 첫 작업인 시나리오 데이터 소스 감사 지시문
    - 순수 위험계산 함수 계약
    - BETA 중복 방지 메타데이터
    - 테스트·PR·AI 연결 기준

18. `FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md`
    - CAGR·MDD·BETA·배당·Calmar 산식과 표시기준
    - 가격수익과 총수익의 분리
    - Raw 10년 CAGR과 Rolling 10년 CAGR 정책
    - 한국 대표 ETF Rolling 보정값 덮어쓰기 원인
    - 미국 대표지수 Rolling 재산출 방향과 잠정 범위
    - 포트폴리오 근사 MDD와 시계열 직접 MDD의 구분
    - 신규 overlay 스키마·재산출·회귀테스트 기준

## 확정된 방향

```text
사용자 메뉴명: AI 분석
배치 위치: 포트폴리오 시뮬레이터 STEP 4
초기 라우터: /simulator 유지
기존 STEP 3 상세분석: 유지
첫 개발 작업: Step 113-1A 데이터 인벤토리
```

## Recent AI Analysis Handoff

- `FINPLE_AI_ANALYSIS_HANDOFF_2026_06_27.md`
  - STEP 4 AI 분석 고급화 인수인계
  - 이전 `AI 분석 문서 읽기` 채팅 작업 이력
  - live OpenAI, diagnosticSections, usage persistence, access control 현황
  - 다음 새 채팅 첫 메시지

## 현재 진행 위치

2026-06-26 기준 `Step 113-4B mock API 연결`까지 완료했다.

- Step 113 작업 순서 기준: 약 90%
- 전체 장기 로드맵 기준: 약 45%
- 다음 작업: `Step 113-4C live provider adapter`

## 시나리오 분석·지표 작업선

2026-06-26 기준 Step 114는 제품·통계·지표·구현 준비문서까지 작성된 상태다.

```text
완료
- 제품 정의
- 통계지표 정의
- CAGR·MDD·BETA·배당 산정정책
- Raw와 Rolling CAGR의 역할 구분
- 한국 대표 ETF Rolling 보정 유실 원인 감사
- 미국 대표지수 Rolling 재산출 기준
- BETA 적용 원칙
- 시장 벤치마크 정책 초안
- API·UI·테스트 구조 초안
- Codex 첫 작업 지시문

미착수
- 월간 시계열 데이터 감사
- 재현 가능한 지표 재산출 스크립트
- 신규 가격지표 overlay
- 위험계산 유틸리티
- Rolling 분석
- Block Bootstrap
- 시장 비교선 UI
- 확률 밴드 UI
- 스트레스 테스트
```

시나리오 분석 첫 구현은 다음으로 시작한다.

```text
Step 114-1A Scenario data source audit
```

지표 정상화 작업은 시나리오 데이터 감사와 함께 다음 항목을 확인한다.

```text
Raw CAGR
Rolling CAGR
MDD
Rolling MDD
BETA benchmark
가격수익 / 총수익
통화·환율
proxy 여부
```

## 첫 개발 명령

Codex 새 스레드에서 해당 작업선에 맞는 인수인계 문서를 사용한다.

```text
AI/ML 작업:
FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md

시나리오 분석 작업:
FINPLE_SCENARIO_ANALYSIS_CODEX_HANDOFF.md

지표 산정정책:
FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md
```

## 개발 우선순위

```text
AI/ML 작업계획 문서화
→ Data Inventory
→ Rule-based Data Sentinel
→ ML anomaly detection
→ Mock AI Analysis backend
→ AI Analysis STEP 4 UI
→ AI Analysis mock API connection
→ 저장·사용량 정책
→ Asset DNA
→ 운영 안정화
```

시나리오·지표 작업은 별도 작업선으로 진행한다.

```text
Scenario and metric data audit
→ Reproducible CAGR/MDD/BETA engine
→ Raw and Rolling overlay regeneration
→ Risk metric utilities
→ Rolling historical baseline
→ Joint block bootstrap
→ Scenario API
→ Market benchmark UI
→ Probability band and drawdown UI
→ BETA factor stress test
→ AI analysis connection
→ 운영 안정화
```
