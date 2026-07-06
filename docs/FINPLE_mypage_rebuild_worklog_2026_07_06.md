# FINPLE MY PAGE Rebuild Worklog

작성일: 2026-07-06

이 문서는 MY PAGE 안정화, React 재구축, 구독/결제 표시 동기화, 투자 MBTI 결과 표시 보정 작업을 후속 작업자가 이어받을 수 있도록 정리한 작업 기록입니다.

## 작업 범위

- `/mypage`를 정적 패치 의존 방식에서 React 패널 중심 화면으로 정리했습니다.
- MY PAGE 기본 shell 렌더링과 패널별 API 데이터 로딩을 분리했습니다.
- 계정, 투자성향, 구독/플랜, 결제수단, 결제내역, 문의내역, 저장내역 패널을 같은 화면 리듬으로 정리했습니다.
- 만료된 유료 권한, 결제수단 안전 표시, 투자 MBTI 서버 저장 결과, 저장 기능 상태 표시를 MY PAGE에서 확인할 수 있도록 보정했습니다.
- 각 패널의 카드 여백, 카드 높이, 1행/2행 grid 간격을 결제수단/결제내역/저장내역 기준에 맞춰 통일했습니다.

## 주요 작업 내역

### MY PAGE 렌더링 안정화

- 기본 shell, 좌측 메뉴, 첫 화면 카드가 API 일부 실패와 무관하게 먼저 표시되도록 정리했습니다.
- 구독, 결제수단, 결제내역, 문의내역, 저장내역 등은 패널별로 로딩/실패 상태를 처리합니다.
- 전체 복구 overlay는 root 렌더링 실패에 가까운 상황에서만 사용하고, 개별 API 지연만으로 MY PAGE 전체 진입이 막히지 않도록 했습니다.
- `/mypage` 진입 중 불필요한 외부 데이터 조회가 자동 실행되지 않도록 점검했습니다.

### 계정 패널

- 로그인 방식, 사용자명, 현재 플랜/요금제, 로그인 이메일을 명확히 분리해 표시했습니다.
- 일반 계정과 소셜 로그인 계정의 비밀번호 변경 버튼 노출 기준을 구분했습니다.
- 회원탈퇴는 즉시 삭제가 아니라 신청/비활성화 흐름을 전제로 안내 문구를 정리했습니다.
- 로그인 이메일 카드는 다른 카드와 같은 높이를 유지하되 가로 폭은 넓게 표시하도록 조정했습니다.

### 구독/플랜 패널

- 화면 표시 기준을 `users.plan` 또는 브라우저 저장값보다 서버의 구독/권한 상태에 우선하도록 정리했습니다.
- Personal 권한이 만료되었거나 서버 기준 유효 권한이 확인되지 않으면 Free 기준으로 표시하도록 했습니다.
- 이용 종료 예정일, 다음 결제일, 서버 저장 가능 여부를 같은 effective plan 기준으로 표시하도록 맞췄습니다.

### 결제수단 패널

- 결제수단은 카드번호 원문이 아니라 서버에 저장된 안전 필드만 표시하도록 정리했습니다.
- 표시 우선순위는 `display_label`, `card_company` + `card_last4`, `masked_card_number` 순서로 사용합니다.
- 카드사명은 사용자 화면에서 불필요한 접미 표현을 줄이고, 끝 4자리가 있으면 `우리카드 - **** 9121`처럼 식별 가능한 범위에서 표시합니다.
- 결제수단 새로고침 버튼을 두어 등록 후 서버 반영 상태를 다시 확인할 수 있게 했습니다.

### 결제내역 패널

- 결제 건수, 최근 결제일, 최근 금액을 요약 카드로 표시했습니다.
- 결제내역은 최신순으로 보여주고, 영수증 링크는 결제 row에 연결된 안전 URL이 있을 때만 표시합니다.
- 결제내역 API 실패는 패널 내부 안내로 처리합니다.

### 투자성향 패널

- 서버에 저장된 투자 MBTI 결과를 우선 복원하고, 브라우저 저장값은 캐시/보조 값으로만 사용하도록 정리했습니다.
- 검사 미실시 또는 미저장 상태에서는 검사 후 결과를 저장해 보라는 맥락의 안내를 표시합니다.
- 검사 실시 및 저장 상태에서는 검사 결과가 저장되어 있다는 맥락의 안내를 표시합니다.
- MY PAGE의 상세 결과 화면에서 `/mbti` 원본과 유사한 성향 축 및 예시 포트폴리오 비중 차트를 제공하도록 보정했습니다.
- 결과 요약 카드는 제거하고, 차트와 안내 박스 사이의 여백만 유지했습니다.

### 문의내역/저장내역 패널

- 문의내역은 최근 문의와 상태를 패널 내부에서 확인할 수 있게 정리했습니다.
- 저장내역은 브라우저 저장 포트폴리오와 서버 저장 가능 상태를 분리해서 표시했습니다.
- 서버 저장 기능은 유효 플랜 기준으로 표시하고, 서버 상태 조회 실패는 패널 내부 fallback으로 안내합니다.

### 레이아웃 정리

- 모든 MY PAGE 패널의 본문 설명과 첫 번째 카드열 사이 여백을 통일했습니다.
- 카드 폭과 높이는 결제수단/결제내역/저장내역의 카드 규격을 기준으로 맞췄습니다.
- 내 계정의 1행/2행 카드 간격은 구독/플랜 grid 간격과 동일하게 조정했습니다.
- 투자성향 상세 화면의 소제목은 MY PAGE 패널 eyebrow 스타일과 같은 파란색 작은 대문자 스타일로 맞췄습니다.

## MY PAGE 작업 지침

- 실제 저장소 소스 기준으로 작업하고, 첨부 이미지 기반 정적 시안으로 대체하지 않습니다.
- MY PAGE shell 렌더링과 API 데이터 로딩은 분리합니다.
- 한 패널의 API timeout이나 실패가 전체 `/mypage` 진입 실패로 이어지지 않게 합니다.
- 보이지 않는 패널 데이터는 가능한 한 lazy load하고, 패널 최초 표시 1회 또는 사용자가 누른 새로고침 1회를 기준으로 호출합니다.
- DOM 감시나 패치성 코드가 DOM 변경마다 API를 반복 호출하지 않게 합니다.
- 구독/플랜 표시는 서버 subscription/entitlement의 effective plan을 우선합니다.
- `users.plan`, 브라우저 저장값, 과거 선택 플랜은 서버 기준 유효 권한보다 우선하지 않습니다.
- 결제수단은 `display_label`, `card_company`, `card_last4`, `masked_card_number` 같은 안전 필드만 사용합니다.
- 카드번호 원문, 결제사 원문 응답, 결제 인증 원문 값은 화면, 로그, 문서, 테스트 fixture에 저장하지 않습니다.
- 투자 MBTI 결과는 서버 저장값을 우선 사용하고, localStorage는 캐시 또는 복구 보조값으로만 사용합니다.
- 사용자 화면에는 디버그 문구, DB 내부 설명, 패치 파일명, 내부 구현명을 노출하지 않습니다.
- MY PAGE 진입 시 화면 표시와 무관한 외부 데이터 조회를 자동 실행하지 않습니다.
- UI 보정은 공통 카드 grid와 패널 spacing 기준을 우선해 메뉴별 편차를 만들지 않습니다.
- 운영 DB migration, 직접 write/delete, 기존 결제 row 삭제 없이 조회/표시 기준을 먼저 보정합니다.

## 주요 관련 파일

- `src/components/mypage/MyPageReactRebuild.jsx`
- `src/components/mypage/MyPageReactRebuild.css`
- `src/components/mypage/panels/MyPageAccountPanel.jsx`
- `src/components/mypage/panels/MyPageBillingPanel.jsx`
- `src/components/mypage/panels/MyPagePaymentMethodPanel.jsx`
- `src/components/mypage/panels/MyPagePaymentHistoryPanel.jsx`
- `src/components/mypage/panels/MyPageInvestmentProfilePanel.jsx`
- `src/components/mypage/panels/MyPageInvestmentMbtiDetail.jsx`
- `src/components/mypage/panels/MyPageInquiriesPanel.jsx`
- `src/components/mypage/panels/MyPageStoragePanel.jsx`
- `src/components/portfolio/utils/subscriptionPlanStatus.js`
- `src/components/portfolio/services/serverPortfolioService.js`
- `server/src/routes/investmentMbtiRoutes.js`
- `server/src/routes/paymentGuardRoutes.js`
- `src/MyPageReactRouteRebuild.test.js`

## 검증 기준

작업 완료 전 아래 검증을 기본으로 실행합니다.

```text
node --test
git diff --check
npm.cmd run build
npm.cmd run check:ai-production
```

필요 시 `/mypage` 직접 접근, 결제수단 새로고침, 투자 MBTI 상세 보기, 문의/저장내역 패널 전환을 수동으로 확인합니다.
