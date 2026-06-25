# FINPLE AI/ML Progress

작성일: 2026-06-25

## 현재 위치

현재 진행 위치는 `Step 113-2B 모델 카드·평가` 완료 지점이다.

권장 작업 순서 10개 기준:

| step | status |
| --- | --- |
| Step 113-1A 데이터 인벤토리 | done |
| Step 113-1B 규칙형 Data Sentinel | done |
| Step 113-1C 감사 테스트·수동 검수 | done |
| Step 113-2A 비지도 이상치 실험 | done |
| Step 113-2B 모델 카드·평가 | done |
| Step 113-3A mock AI backend | next |
| Step 113-3B output validator | pending |
| Step 113-4A STEP 4 UI shell | pending |
| Step 113-4B mock API 연결 | pending |
| Step 113-4C live provider adapter | pending |

## 진행률

Step 113 작업 순서 기준 진행률: 약 50%

```text
5 / 10 steps completed
```

전체 장기 로드맵 기준 진행률: 약 25%

장기 로드맵에는 저장·사용량·Personal 연동, 분석 내역, Asset DNA, 운영 안정화가 추가로 남아 있다. 따라서 Step 113 내부 진행률보다 전체 제품화 진행률은 낮게 보는 것이 맞다.

## 완료된 산출물

- AI/ML 작업 계획 문서
- 데이터 인벤토리
- 규칙형 Data Sentinel baseline
- 수동 검수 및 threshold 조정 기록
- 비지도 이상치 실험
- ML anomaly 평가 스크립트
- 모델 카드

## 다음 작업

다음 작업은 `Step 113-3A mock AI backend`이다.

목표:

- 외부 AI API 없이 deterministic mock 분석 응답을 만든다.
- 포트폴리오 입력 schema와 응답 contract를 고정한다.
- 이후 STEP 4 UI가 연결할 수 있는 backend endpoint를 준비한다.

주의:

- OpenAI 또는 외부 provider key를 아직 연결하지 않는다.
- 투자 조언처럼 보이는 확정적 문구를 만들지 않는다.
- mock 응답도 validator를 통과할 수 있는 JSON 구조로 만든다.
