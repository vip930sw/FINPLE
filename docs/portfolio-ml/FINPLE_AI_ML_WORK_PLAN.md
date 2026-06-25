# FINPLE AI Analysis / Portfolio ML Work Plan

작성일: 2026-06-25
기준 저장소: `vip930sw/FINPLE`
기준 브랜치: `main`
상태: Step 113 실행 계획 및 주의사항

## 1. 목적

이 문서는 FINPLE의 `AI 분석`과 포트폴리오 ML 작업을 실제 개발 순서로 정리한다.

핵심 목표는 다음과 같다.

1. 기존 포트폴리오 시뮬레이터의 계산 결과와 화면을 훼손하지 않는다.
2. AI 분석을 투자 추천이나 수익률 예측으로 오해하지 않도록 제품 경계를 유지한다.
3. 데이터 품질 검증을 먼저 수행한 뒤, mock 백엔드와 STEP 4 UI를 단계적으로 붙인다.
4. 각 단계는 작은 PR로 나누고, Vercel/Render 배포 위험을 낮춘다.

---

## 2. 전체 방향

FINPLE의 AI/ML 계층은 세 가지 역할로 나눈다.

```text
Data Sentinel
자산 데이터 품질, 결측, 이상치, 검토 필요 지표를 탐지한다.

Asset DNA
자산의 역할, 유사도, 실질 노출, 위험 태그를 분류한다.

AI Analysis
기존 계산값과 검증된 ML 결과를 사용자 문장으로 설명한다.
```

사용자에게 보이는 메뉴명은 `AI 분석`으로 통일한다.

초기 UI 위치는 기존 `/simulator` 내부의 `STEP 4 AI 분석`이다. 별도 최상위 메뉴나 독립 입력 화면을 먼저 만들지 않는다.

---

## 3. 예상 난이도와 기간

| 범위 | 난이도 | 예상 기간 | 설명 |
|---|---:|---:|---|
| 데이터 인벤토리와 현재 구조 감사 | 중 | 3~5일 | 런타임 데이터와 계산 흐름을 문서화 |
| Data Sentinel 규칙형 baseline | 중상 | 2~3주 | 결측, 중복, 이상 범위, 검토 사유코드 생성 |
| Data Sentinel ML 실험 | 상 | 2~3주 | Isolation Forest 등 비지도 이상치 실험 |
| mock AI 분석 백엔드 | 중상 | 2~3주 | 외부 AI 없이 deterministic JSON 응답 |
| STEP 4 AI 분석 UI | 중상 | 2~3주 | `/simulator` 내부 탭과 상태 UI |
| live AI provider 연동 | 상 | 1~2주 | OpenAI 등 외부 provider adapter |
| 저장, 조회, 사용량, Personal 연동 | 상 | 2~4주 | DB, 캐시, 플랜별 사용량 제한 |
| Asset DNA | 상~매우 상 | 4~6주 | 자산 역할, 유사자산, 위험 태그 분류 |

전체 완성형은 약 4~6개월, mock 기반 MVP는 약 6~8주, live AI API 기반 초기 베타는 약 10~14주로 본다.

---

## 4. 권장 PR 순서

```text
PR 1  Step 113-1A 데이터 인벤토리와 작업계획 문서
PR 2  Step 113-1B Data Sentinel 규칙형 baseline
PR 3  Step 113-1C 감사 테스트와 수동 검수 표본
PR 4  Step 113-2A 비지도 이상치 실험
PR 5  Step 113-2B 모델 카드와 평가 문서
PR 6  Step 113-3A mock AI 분석 백엔드
PR 7  Step 113-3B AI 출력 validator와 금지문구 필터
PR 8  Step 113-4A STEP 4 AI 분석 UI shell
PR 9  Step 113-4B STEP 4 UI와 mock API 연결
PR 10 Step 113-4C live provider adapter
PR 11 분석 결과 저장, 조회, 사용량 제한
PR 12 MY PAGE 분석내역
PR 13 Asset DNA offline pipeline
PR 14 Asset DNA UI 연결
```

한 PR에서 데이터, 백엔드, DB, UI를 모두 변경하지 않는다.

---

## 5. Step 113-1A 작업 내용

첫 작업은 `Audit current portfolio metrics and create the ML data inventory`이다.

산출물:

```text
scripts/ml/audit_ml_data_inventory.py
data/processed/ml/finple_ml_data_inventory.json
docs/portfolio-ml/FINPLE_ML_DATA_INVENTORY.md
```

확인 대상:

```text
src/data/tickers/
data/processed/
scripts/
notebooks/
src/data/tickers/screenerCandidateLoader.js
src/data/tickers/screenerCandidateOverlay.js
```

필수 기록:

```text
파일 경로
행 수
컬럼 목록
필수 컬럼 존재 여부
필수 값 결측 수
티커 중복 수
US/KR 분포
데이터 기준일 또는 파일명 날짜
현재 앱 import 여부
생성 후보 스크립트
```

제약:

```text
런타임 동작 변경 금지
UI, CSS, 라우팅, 인증, 결제, 서버 API 변경 금지
AI Analysis STEP 4 생성 금지
원본 CSV 자동 수정 금지
한국 티커 앞자리 0 보존
missing dividendYield와 confirmed 0 구분
```

---

## 6. 제품 및 규제 주의사항

AI 분석은 다음을 하면 안 된다.

```text
CAGR, MDD, BETA, Calmar, 예상 평가금액 재계산
매수 추천
매도 추천
종목 추천
수익 보장 표현
상승 확률 표시
적정 매수가 표시
사용자별 투자 비중 지시
```

AI 분석은 다음만 수행한다.

```text
기존 FINPLE 계산값 읽기
Data Sentinel 결과 요약
Asset DNA 결과 해석
포트폴리오 구조와 위험요인 설명
데이터 한계와 면책문구 표시
```

---

## 7. 기술 주의사항

1. 외부 AI API 키는 프론트엔드나 `VITE_` 환경변수에 넣지 않는다.
2. AI 요청은 Render 백엔드에서만 수행한다.
3. STEP 4 탭 진입만으로 AI API를 자동 호출하지 않는다.
4. AI 실패가 STEP 1~3 시뮬레이터를 중단시키면 안 된다.
5. `DetailPanel.jsx`는 대규모 수정하지 않는다.
6. 새 DOM patch나 `MutationObserver` 기반 구현은 피한다.
7. 기존 계산 엔진의 숫자는 단일 진실원천으로 유지한다.
8. 모델 결과만으로 원본 데이터를 자동 보정하지 않는다.
9. 데이터 버전, 모델 버전, provider 이름, 분석 버전을 기록한다.
10. 금지문구와 숫자 환각을 검증하는 validator를 백엔드에 둔다.

---

## 8. 다음 작업 시작점

이 문서가 추가된 뒤 바로 이어서 진행할 첫 작업은 다음이다.

```text
Step 113-1A: Audit current portfolio metrics and create ML data inventory.
```

Step 113-1A가 끝난 뒤에는 생성된 인벤토리를 기준으로 Data Sentinel 규칙형 baseline을 구현한다.
