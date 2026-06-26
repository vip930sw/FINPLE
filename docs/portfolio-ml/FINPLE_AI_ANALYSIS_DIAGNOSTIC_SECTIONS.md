# FINPLE AI Analysis Diagnostic Sections

작성일: 2026-06-26
작업 단계: Step 113-6A

## 요약

STEP 4 AI 분석 결과에 `diagnosticSections`를 추가했다. 기존 결과는 프로필 요약, 위험요인, 자산 역할 중심이어서 사용자가 받는 첫 인상이 설명문에 가까웠다. 이번 변경은 투자 권유 경계를 유지하면서도 구조, 위험 균형, 현금흐름, 데이터 맥락을 별도 진단 블록으로 나누어 해석 밀도를 높이는 것이 목적이다.

## 구현 파일

- `server/src/services/aiOutputValidator.js`
- `server/src/services/aiPortfolioAnalysisOpenAi.js`
- `server/src/services/aiPortfolioAnalysisMock.js`
- `src/components/portfolio/components/AiAnalysisPanel.jsx`
- `src/AiAnalysisPanel.css`
- `server/src/services/aiPortfolioAnalysis.test.js`

## Output Contract

contract version:

```text
ai-analysis-output-contract-v2
```

새 top-level field:

```text
diagnosticSections
```

각 section 구조:

```json
{
  "key": "structure",
  "title": "구조 진단",
  "summary": "입력값에 기반한 정성 요약",
  "observations": ["구체 관찰 항목"]
}
```

허용 key:

- `structure`
- `risk_balance`
- `cashflow`
- `data_context`

## UI 배치

결과 화면은 다음 위계로 정리했다.

1. 포트폴리오 프로필과 입력 데이터 확인 사항
2. 진단 요약
3. 위험요인
4. 자산 역할
5. 분석 한계와 disclaimer

`데이터 품질`은 독립 대형 박스가 아니라 프로필 영역의 `입력 데이터`와 `확인 사항`으로 압축해 배치했다. 사용자는 먼저 실제 해석을 읽고, 데이터 한계는 보조 정보로 확인한다.

## 주의점

- `diagnosticSections`도 validator의 금지 표현, ticker 언급 범위, 숫자 환각 검증을 그대로 통과해야 한다.
- 매수, 매도, 보유 추천과 목표 비중은 계속 금지한다.
- 텍스트 필드에는 새 숫자를 만들지 않는다.
- personal plan 제공 여부는 결과 저장, 응답 시간, 분석 품질, 비용 통제가 안정화된 뒤 별도 판단한다.
