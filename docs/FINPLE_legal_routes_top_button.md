# FINPLE 정책/업데이트 라우터 TOP 버튼

갱신일: 2026-06-18 KST

## 적용 대상

- `/updates`
- `/terms`
- `/privacy`
- `/refund`
- `/disclaimer`

## 구현 기준

- `/about`, `/simulator`, 자산 파인더에서 사용하던 기존 `floatingTopButton` 기준을 재사용합니다.
- 별도의 신규 버튼 스타일을 만들지 않고 `src/App.css`의 `.floatingTopButton`을 사용합니다.
- 버튼은 화면 오른쪽 하단에 고정되며 클릭하면 부드럽게 문서 최상단으로 이동합니다.
- 모바일에서는 기존 미디어 쿼리에 따라 오른쪽/아래 여백과 버튼 크기가 줄어듭니다.

공통 컴포넌트:

- `src/components/FloatingTopButton.jsx`

적용 파일:

- `src/components/UpdatesPage.jsx`
- `src/components/LegalPolicyPages.jsx`

## 접근성

- 각 라우터의 문서 제목에 맞는 `aria-label`을 제공합니다.
- 화면 표시는 기존과 동일하게 `↑ TOP`을 사용합니다.

## 유지보수 주의사항

- 정책 페이지가 추가되면 `LegalDocumentPage`를 사용해 TOP 버튼을 자동 적용하는 방식을 우선합니다.
- TOP 버튼 위치나 색상 변경은 개별 페이지가 아니라 `src/App.css`의 `.floatingTopButton`에서 공통 조정합니다.
