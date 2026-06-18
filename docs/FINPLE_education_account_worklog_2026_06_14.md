# FINPLE 교육계정 작업내역 및 인수인계

갱신일: 2026-06-14 KST

이 문서는 교육계정 기능을 구현하고 운영 화면을 조정한 전체 작업 흐름을 한 곳에 정리한 기록입니다. 다음 채팅에서는 이 문서를 먼저 읽고, 최신 `main`에서 새 브랜치를 만든 뒤 후속 작업을 이어가면 됩니다.

## 현재 결론

- 교육계정 기능은 `main`에 병합되어 있습니다.
- 교육계정은 결제/구독 기록을 만들지 않고 `user_entitlements.source = 'education'` 권한으로 Personal 기능을 제공합니다.
- `/admin/education`에서 일괄 생성, 조회, CSV, 선택 삭제, 개별 삭제를 운영할 수 있습니다.
- `/admin/education` 표는 만료일을 기준으로 활성/만료 상태를 구분하며, `만료된 계정 삭제`로 만료 계정만 한 번에 정리할 수 있습니다.
- `/login`에는 일반 계정과 교육용 계정 탭이 있으며, 교육용 ID/비밀번호로 로그인합니다.
- `/mypage`와 `/pricing`은 교육계정을 `교육용 Personal`로 표시하고 결제수단/결제내역/요금제 변경 흐름을 숨기거나 차단합니다.
- `/admin/members`에서는 교육계정을 일반 회원 통계와 회원 목록에서 제외합니다.
- 일반 이메일/비밀번호 로그인 계정에는 `/mypage` My Account 안내 박스 안에 `비밀번호 변경` 버튼이 표시됩니다.

## 병합된 PR 흐름

| PR | 상태 | 역할 |
| --- | --- | --- |
| #187 | 폐기 대상 | 구현 전 계획/초안 문서. 최신 구현 문서로 대체합니다. |
| #189 | 병합 | 교육계정 DB, 백엔드, 관리자 UI, 교육 로그인 최초 구현 |
| #190 | 병합 | `education_accounts` 테이블 누락 오류 완화, 한국어 문구, 요금제/MY PAGE 표시 보정 |
| #192 | 병합 | 단일 생성을 제거하고 일괄 생성만 유지, 자동 초기 비밀번호 규칙 적용 |
| #193 | 병합 | 초기 비밀번호 저장/표시, 일괄 삭제, MY PAGE 교육계정 로컬 데이터 초기화와 결제 메뉴 숨김 |
| #197 | 병합 | `/login` 교육용 계정 안내 문구와 로그인 버튼 사이 여백 보정 |
| #198 | 병합 | `/admin/members`에서 교육계정 제외, 일반 계정 비밀번호 변경 기능 추가 |

## 구현 상세

### DB/백엔드

- `server/db/migrations/005_education_accounts.sql`
  - `education_accounts` 테이블과 운영 인덱스를 정의합니다.
- `server/src/db/educationAccountSchema.js`
  - 런타임에서 교육계정 테이블과 컬럼을 확인합니다.
- `server/src/db/educationAccountRepository.js`
  - 일괄 생성, 자동 초기 비밀번호 생성, 목록/CSV, 개별 삭제, 선택 삭제를 처리합니다.
- `server/src/db/authRepository.js`
  - 교육계정 로그인, 교육 권한 부여, 만료일 검사, 일반 계정 비밀번호 변경을 처리합니다.
  - `ensureDefaultEntitlement()`는 `source = 'education'` 권한을 덮어쓰지 않습니다.
- `server/src/routes/adminRoutes.js`
  - `/admin/education-accounts` 계열 API를 제공합니다.
  - `/admin/members` 회원 통계/목록/플랜 분포에서 교육계정을 제외합니다.
- `server/src/routes/authRoutes.js`
  - `/auth/education-login`
  - `/auth/password`

### 프론트엔드

- `src/components/AuthPages.jsx`
  - 일반 계정 / 교육용 계정 로그인 탭을 제공합니다.
- `src/components/AdminInquiriesPage.jsx`
  - `교육 계정 관리` 패널, 일괄 생성, 시작번호/끝번호, CSV, 선택 삭제, 개별 삭제를 제공합니다.
- `src/components/AccountPages.jsx`
  - 교육계정 Personal 표시, 요금제 변경 차단, 일반 계정 비밀번호 변경 모달을 제공합니다.
- `src/components/authClientService.js`
  - 교육계정 로그인 시 기존 브라우저 로컬 투자성향/포트폴리오 임시 데이터를 초기화합니다.
  - 비밀번호 변경 API 클라이언트를 제공합니다.
- `src/MyPageAccountStatusDisplayPatch.js`
  - My Account 안내 박스 안에 일반 이메일/비밀번호 계정 전용 `비밀번호 변경` 버튼을 삽입합니다.
- `src/MyPageSidebarPatch.js` 등 MY PAGE 패치 파일
  - 교육계정에서는 결제수단/결제내역 메뉴와 패널을 숨깁니다.

## 운영 기준

### 교육계정 생성

- 단일 생성은 사용하지 않습니다.
- 일괄 생성 입력값:
  - ID
  - 시작번호
  - 끝번호
  - 수업/세미나명
  - 만료일
- 추가 수강생이 생기면 시작번호/끝번호로 이어 생성합니다. 예: 기존 1~10번 이후 `11~20`.
- 시작번호가 끝번호보다 크면 생성 요청 전에 경고 문구를 표시합니다.

### 초기 비밀번호

- 규칙: `qwerasdf` 각 글자 무작위 대소문자 + 3자리 번호
- 예: `qWerASdf001`, `QwerasDf002`, `QweRaSDf003`
- 관리자 표와 CSV에는 초기 비밀번호가 표시됩니다.
- 운영 전달 목적 때문에 `education_accounts.initial_password`에 저장합니다.
- 이 값은 관리자 전용 전달 정보이므로 CSV 파일 보관/공유에 주의해야 합니다.

### 삭제와 만료

- 만료일이 지나도 계정 레코드는 자동 삭제되지 않습니다.
- 만료 계정은 로그인만 차단됩니다.
- 정리는 관리자가 개별 `삭제` 또는 체크박스 선택 후 `선택한 교육 계정 삭제`로 수행합니다.
- 만료 계정 전체 정리는 `만료된 계정 삭제` 버튼으로 수행하며, 서버가 삭제 시점에 만료 여부를 다시 검사합니다.
- 날짜만 입력한 만료일은 KST 기준 해당 날짜 23:59:59.999까지 유효합니다.
  - 예: `2026-06-14`는 `2026-06-15 00:00 KST`부터 차단됩니다.
- 기존에 UTC 자정으로 저장된 날짜형 만료값도 같은 날짜의 KST 말까지 유효하게 보정합니다.

### 결제/회원 통계 분리

- 교육계정은 유료 구독, 결제 이력, 매출, 환불 후보에 포함하지 않습니다.
- `/admin/members`의 가입 회원 수, 구독자 수, 구독률, 플랜 분포, 회원 목록에서 교육계정을 제외합니다.
- 교육계정은 `/admin/education`에서만 관리하는 것이 운영상 안전합니다.

### 일반 계정 비밀번호 변경

- 표시 조건:
  - `authMode = 'email-password'`
  - 교육계정 아님
  - Google/Kakao/Naver 같은 OAuth 계정 아님
- 위치:
  - `/mypage` My Account의 파란 안내 박스 안
- 서버 동작:
  - 현재 비밀번호 검증
  - 새 비밀번호 8자 이상 검증
  - 새 비밀번호 해시 저장
  - 교육계정 비밀번호 변경 요청은 차단

## 검증 기록

대표 검증:

- `node --check server/src/routes/adminRoutes.js`
- `node --check server/src/routes/authRoutes.js`
- `node --check server/src/db/authRepository.js`
- `npm.cmd exec -- eslint server/src/routes/adminRoutes.js server/src/routes/authRoutes.js server/src/db/authRepository.js src/components/authClientService.js src/MyPageAccountStatusDisplayPatch.js src/components/AccountPages.jsx`
- `npm.cmd run build`
- `git diff --check`

주의:

- 전체 `npm.cmd run lint`는 기존 저장소 전역 lint 이슈 때문에 실패합니다.
- 대표 원인: 서버 파일의 `process`/`Buffer` Node 전역 미정의, 기존 미사용 변수, 기존 React hook lint.
- 변경 파일만 대상으로 한 ESLint는 통과했습니다.

## 미구현/검토만 완료된 항목

- 교육 계정 카드 PDF/이미지 생성
  - 가능하지만 아직 구현하지 않았습니다.
  - 1차 권장 방식은 선택 계정 또는 CSV 기반 HTML 카드 레이아웃을 만들고 브라우저 인쇄로 PDF 저장을 제공하는 방식입니다.
  - 이미지 저장은 PDF/인쇄 레이아웃 안정화 후 2차로 추가하는 편이 안전합니다.
- 수강생별 확인 링크 지급
  - 가능합니다.
  - 예: 관리자에서 `1~N` 번호별 배포 링크를 생성하고, 수강생은 링크에서 본인 번호를 확인해 교육용 ID/초기 비밀번호를 받는 방식입니다.
  - 구현 시에는 링크 토큰 만료, 1회 조회 제한, 조회 로그, 비밀번호 노출 범위, 재조회 정책을 먼저 정해야 합니다.

## 다음 채팅 인수인계

다음 채팅에 아래 내용을 전달하면 바로 이어갈 수 있습니다.

```text
vip930sw/FINPLE에서 교육계정 후속 작업을 이어가려고 합니다.

기준 문서:
- docs/FINPLE_education_account_worklog_2026_06_14.md
- docs/FINPLE_education_account_plan.md
- docs/FINPLE_chat_handoff_2026_06_13.md

현재 상태:
- 교육계정 핵심 기능은 main에 병합됨.
- /admin/education에서 일괄 생성, CSV, 선택 삭제, 개별 삭제 가능.
- /login 교육용 계정 로그인 가능.
- /pricing, /mypage는 교육용 Personal로 표시.
- /admin/members에서는 교육계정이 일반 회원 통계/목록에서 제외됨.
- 일반 이메일/비밀번호 계정에는 /mypage My Account 안내 박스 안에 비밀번호 변경 버튼이 있음.

주의:
- 전체 npm lint는 기존 repo 전역 lint 이슈로 실패할 수 있으므로, 변경 파일 대상 eslint와 npm.cmd run build를 함께 확인할 것.
- 교육계정 초기 비밀번호는 관리자 표/CSV에 표시되므로 관리자 접근과 CSV 공유에 주의.
- work-npm-cache/ 같은 로컬 생성물은 커밋하지 말 것.

후속 후보:
1. 교육 계정 카드 PDF/인쇄 레이아웃
2. 수강생별 번호/링크 기반 디지털 계정 지급
3. 교육계정 감사 로그 또는 다운로드 로그
4. 관리자 CSV/PDF 재다운로드 권한 제한
```
