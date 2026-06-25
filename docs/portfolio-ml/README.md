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

## 확정된 방향

```text
사용자 메뉴명: AI 분석
배치 위치: 포트폴리오 시뮬레이터 STEP 4
초기 라우터: /simulator 유지
기존 STEP 3 상세분석: 유지
첫 개발 작업: Step 113-1A 데이터 인벤토리
```

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
