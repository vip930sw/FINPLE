# FINPLE AI Analysis STEP 4 UI Shell

작성일: 2026-06-26
작업 단계: Step 113-4A

## 요약

기존 `/simulator` 안에 `STEP 4 AI 분석` 탭과 UI shell을 추가했다. 이번 단계는 화면 구조만 추가하며, 탭 진입이나 버튼 노출만으로 backend API를 호출하지 않는다.

## 구현 파일

- `src/components/PortfolioSimulator.jsx`
- `src/components/PersonalPage.jsx`
- `src/components/portfolio/components/SimulatorTabNav.jsx`
- `src/components/portfolio/components/AiAnalysisPanel.jsx`
- `src/AiAnalysisPanel.css`
- `src/main.jsx`

## 화면 구성

STEP 4 shell은 다음 블록으로 구성한다.

- 분석 대상 포트폴리오
- readiness badge
- 기존 계산값 요약
- empty/loading/ready/error 상태 슬롯
- 자산 역할 미리보기
- 표시 경계와 유의사항

## 제품 경계

- STEP 4 탭 진입만으로 API를 호출하지 않는다.
- `AI 분석 생성` 버튼은 4B 연결 전까지 비활성 상태다.
- 기존 STEP 1~3 계산, 비교, 상세분석 흐름은 변경하지 않는다.
- AI 분석은 기존 계산값을 다시 계산하지 않는다는 경계를 화면에 표시한다.
- 매수, 매도, 보유 추천과 목표 비중을 표시하지 않는다.

## Navigation

- simulator tab nav에 `STEP 4 / AI 분석` 추가
- PersonalPage 상단 단계 subnav에 `Step 4` 추가
- `ai-analysis` anchor 추가
- floating portfolio dropdown은 STEP 4에서도 분석 대상 선택용으로 유지

## 다음 단계

후속 작업 `Step 113-4B STEP 4 UI와 mock API 연결`은 2026-06-26에 완료했다.

4B에서는 다음을 구현한다.

- `buildAiAnalysisPayload`
- `aiAnalysisService`
- 생성 버튼 활성화
- loading/success/error/stale 실제 상태 전환
- mock backend 응답 렌더링

이후 live AI provider 연결 기준은 `FINPLE_AI_ANALYSIS_MOCK_API_CONNECTION.md`와 progress 문서를 따른다.
