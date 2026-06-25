# FINPLE Portfolio ML Documentation

작성일: 2026-06-23

이 폴더는 FINPLE 포트폴리오 머신러닝과 사용자용 AI 분석 개발의 기준 문서를 보관한다.

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

## 확정된 방향

```text
사용자 메뉴명: AI 분석
배치 위치: 포트폴리오 시뮬레이터 STEP 4
초기 라우터: /simulator 유지
기존 STEP 3 상세분석: 유지
첫 개발 작업: Step 113-1A 데이터 인벤토리
```

## 현재 진행 위치

2026-06-25 기준 `Step 113-2B 모델 카드·평가`까지 완료했다.

- Step 113 작업 순서 기준: 약 50%
- 전체 장기 로드맵 기준: 약 25%
- 다음 작업: `Step 113-3A mock AI backend`

## 첫 개발 명령

Codex 새 스레드에서 `FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md`의 `첫 Codex 작업 지시문`을 사용한다.

## 개발 우선순위

```text
AI/ML 작업계획 문서화
→ Data Inventory
→ Rule-based Data Sentinel
→ ML anomaly detection
→ Mock AI Analysis backend
→ AI Analysis STEP 4 UI
→ 저장·사용량 정책
→ Asset DNA
→ 운영 안정화
```
