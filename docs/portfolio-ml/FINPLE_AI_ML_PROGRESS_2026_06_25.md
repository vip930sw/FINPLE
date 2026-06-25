# FINPLE AI/ML Progress

작성일: 2026-06-26

## 현재 위치

현재 진행 위치는 `Step 113-4B mock API 연결` 완료 지점이다.

권장 작업 순서 10개 기준:

| step | status |
| --- | --- |
| Step 113-1A 데이터 인벤토리 | done |
| Step 113-1B 규칙형 Data Sentinel | done |
| Step 113-1C 감사 테스트·수동 검수 | done |
| Step 113-2A 비지도 이상치 실험 | done |
| Step 113-2B 모델 카드·평가 | done |
| Step 113-3A mock AI backend | done |
| Step 113-3B output validator | done |
| Step 113-4A STEP 4 UI shell | done |
| Step 113-4B mock API 연결 | done |
| Step 113-4C live provider adapter | next |

## 진행률

Step 113 작업 순서 기준 진행률: 약 90%

```text
9 / 10 steps completed
```

전체 장기 로드맵 기준 진행률: 약 45%

장기 로드맵에는 저장·사용량·Personal 연동, 분석 내역, Asset DNA, 운영 안정화가 추가로 남아 있다. 따라서 Step 113 내부 진행률보다 전체 제품화 진행률은 낮게 보는 것이 맞다.

## 완료된 산출물

- AI/ML 작업 계획 문서
- 데이터 인벤토리
- 규칙형 Data Sentinel baseline
- 수동 검수 및 threshold 조정 기록
- 비지도 이상치 실험
- ML anomaly 평가 스크립트
- 모델 카드
- mock AI backend endpoint
- request schema와 기본 output validator
- output contract snapshot
- 금지 표현, ticker mention, numeric hallucination 회귀 테스트
- STEP 4 AI 분석 UI shell
- simulator tab nav와 route subnav의 Step 4 연결
- STEP 4 mock API 호출 서비스
- payload builder와 100% 비중 보정
- loading, success, error, stale 상태 전환
- mock 분석 결과 렌더링

## 다음 작업

다음 작업은 `Step 113-4C live provider adapter`이다.

목표:

- provider interface를 정의한다.
- 외부 AI API secret env를 서버 전용으로 연결한다.
- timeout, retry, fallback, audit logging 기준을 정한다.
- prompt와 output regression 테스트를 추가한다.

주의:

- Vercel의 `VITE_` 환경변수에는 외부 AI API key를 넣지 않는다.
- OpenAI 또는 외부 provider key는 Render backend secret으로만 연결한다.
- 투자 조언처럼 보이는 확정적 문구를 만들지 않는다.
- STEP 4 탭 진입만으로 live AI API를 자동 호출하지 않는다.
