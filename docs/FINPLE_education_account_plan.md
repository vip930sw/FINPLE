# FINPLE 교육계정 구현 및 운영 문서

갱신일: 2026-06-14 KST

이 문서는 PR #189, PR #190, PR #192, PR #193, PR #197, PR #198이 `main`에 반영된 이후의 교육계정 구현 상태를 기록합니다. 기존 문서 초안 PR #187은 구현 전 계획 기준이므로, 최신 문서 기준에서는 폐기해도 됩니다.

## 현재 상태

- 오프라인 수업/세미나용 교육계정 기능이 구현되었습니다.
- 수강생은 로그인 화면에서 `교육용 계정` 모드를 선택하고 교육용 ID/비밀번호로 로그인합니다.
- 정상 교육계정은 `user_entitlements`에 `plan = 'personal'`, `source = 'education'` 권한을 받습니다.
- 교육계정은 유료 구독, 결제 이력, 매출, 환불 후보와 분리됩니다.
- 관리자 콘솔에서 일괄 생성, 조회, CSV 출력, 개별 삭제, 일괄 삭제를 할 수 있습니다.
- 일괄 생성 시 초기 비밀번호는 `qwerasdf` 무작위 대소문자 + 3자리 번호 형식으로 자동 생성됩니다.
- 초기 비밀번호는 관리자 교육계정 목록 표와 CSV에 표시되어 재접속 후에도 전달 정보를 확인할 수 있습니다.
- 요금제와 MY PAGE에서는 교육계정 세션을 `교육용 Personal`로 표시하며, 결제 플랜 변경은 막습니다.
- 교육계정으로 브라우저에서 처음 로그인하면 기존 로컬 투자성향/포트폴리오 임시 데이터가 초기화됩니다.
- 교육계정 MY PAGE 메뉴에서는 결제수단과 결제내역 메뉴를 숨깁니다.
- 관리자 회원 관리(`/admin/members`)에서는 교육계정을 회원 수, 구독자 수, 구독률, 플랜 분포, 최근 회원 목록에서 제외합니다.
- 일반 이메일/비밀번호 로그인 계정은 MY PAGE의 My Account 안내 박스에서 `비밀번호 변경`을 사용할 수 있습니다. 교육계정과 OAuth 계정에는 표시하지 않습니다.

## 구현된 영역

백엔드:

- `server/src/db/educationAccountSchema.js`
  - `education_accounts` 테이블과 인덱스를 런타임에 확인합니다.
  - 수동 마이그레이션 누락 시 발생한 `relation "education_accounts" does not exist` 오류를 완화합니다.
- `server/src/db/educationAccountRepository.js`
  - 일괄 교육계정 생성, 자동 비밀번호 생성, CSV 생성, 개별 삭제, 일괄 삭제, 교육 권한 적용/회수를 담당합니다.
- `server/src/db/authRepository.js`
  - 교육계정 로그인을 처리합니다.
  - 기본 권한 동기화가 `source = 'education'` 권한을 덮어쓰지 않도록 보호합니다.
  - 클라이언트에 `authMode = 'education-account'`, `entitlementSource = 'education'`, 교육계정 메타데이터를 반환합니다.
  - 일반 이메일/비밀번호 계정의 비밀번호 변경 시 현재 비밀번호 검증과 새 비밀번호 해시 저장을 처리합니다.
- `server/src/routes/adminRoutes.js`
  - 교육계정 목록, CSV, 일괄 생성, 일괄 삭제, 상태 변경 API를 제공합니다.
  - 회원 관리 통계와 목록에서 교육계정을 제외합니다.
- `server/src/routes/authRoutes.js`
  - `/auth/education-login`을 제공합니다.
  - `/auth/password`를 제공합니다.

프론트엔드:

- `src/components/AuthPages.jsx`
  - 일반 계정 / 교육용 계정 로그인 모드를 제공합니다.
- `src/components/AdminInquiriesPage.jsx`
  - 관리자 콘솔에 `교육 계정 관리` 패널을 제공합니다.
  - 교육계정 표에 교육용 ID, 비밀번호, 수업/세미나, 상태, 만료일, 최근 로그인, 관리 항목을 표시합니다.
- `src/components/AccountPages.jsx`
  - 교육계정 세션을 `교육용 Personal`로 표시합니다.
  - 교육계정에서는 요금제 변경/결제 플로우를 진행하지 않도록 합니다.
  - 일반 이메일/비밀번호 로그인 계정의 비밀번호 변경 모달을 제공합니다.
- `src/components/portfolio/services/serverPortfolioService.js`
  - 교육계정 세션 메타데이터 저장과 관리자 교육계정 API 호출을 담당합니다.
- `src/components/authClientService.js`
  - 교육계정 최초 로그인 시 이전 일반/게스트 로컬 투자성향과 포트폴리오 임시 데이터를 초기화합니다.
  - 일반 계정 비밀번호 변경 API 호출을 담당합니다.
- `src/MyPage*Patch.js`
  - 교육계정 MY PAGE에서 결제수단과 결제내역 메뉴/패널 생성을 숨깁니다.
  - My Account 안내 박스에 일반 계정 전용 비밀번호 변경 버튼을 표시합니다.

마이그레이션:

- `server/db/migrations/005_education_accounts.sql`

## 데이터 구조

`education_accounts`는 교육계정 전용 메타데이터를 저장합니다.

- `id`
- `user_id`
- `login_id`
- `initial_password`
- `label`
- `cohort_name`
- `status`
- `valid_from`
- `valid_until`
- `last_login_at`
- `memo`
- `created_at`
- `updated_at`

상태값:

- `active`: 유효 기간 안에서 로그인 가능
- `paused`: 임시 중지. 수강 중 유출, 오입력, 보류 상황에서 잠시 로그인을 막는 운영 상태입니다.
- `expired`: 만료. 수업/세미나 이용 기간이 끝나 더 이상 접근시키지 않는 종료 상태입니다.
- `revoked`: 회수

교육 권한은 `user_entitlements`에 아래 기준으로 부여합니다.

- `plan = 'personal'`
- `source = 'education'`
- `valid_from = NOW()`
- `valid_until = education_accounts.valid_until`

이 권한은 결제 또는 유료 구독 기록이 아닙니다.

## 관리자 운영 흐름

일괄 생성:

1. `/admin` 접속
2. `교육 계정 관리` 선택
3. ID 접두어, 시작번호, 끝번호, 수업/세미나명, 만료일 입력
4. `일괄 생성` 실행
5. 교육계정 목록 표에서 교육용 ID와 초기 비밀번호 확인
6. CSV를 인쇄용 명단 또는 수강생 전달 자료로 사용

비밀번호 생성 규칙:

- 접두 문자열은 `qwerasdf`입니다.
- 각 문자는 생성 시마다 무작위 대소문자로 변환됩니다.
- 뒤에는 3자리 번호가 붙습니다.
- 예: `qWerASdf001`, `QwerasDf002`, `QweRaSDf003`

권장 배포 순서:

1. CSV 출력 및 인쇄용 카드/명단
2. PDF 카드 출력
3. 이메일 발송

카카오톡 전달은 가능하지만 캡처/전달로 인한 유출 위험이 있어 1차 배포 방식으로는 권장하지 않습니다.

## 로그인 및 접근 규칙

교육계정 로그인 성공 조건:

- 교육용 ID가 존재해야 합니다.
- 비밀번호가 일치해야 합니다.
- 계정 상태가 `active`여야 합니다.
- `valid_from <= NOW()`여야 합니다.
- `valid_until`이 없거나 현재보다 미래여야 합니다.

로그인 성공 시:

- 브라우저 세션은 `authMode = 'education-account'`로 저장됩니다.
- `/start`, MY PAGE, 서버 저장 등 Personal 기준 기능을 사용할 수 있습니다.
- 요금제와 MY PAGE에는 `교육용 Personal`로 표시됩니다.
- 요금제 선택 버튼은 교육계정에서 비활성화됩니다.

계정이 `paused`, `expired`, `revoked` 상태이거나 만료일이 지난 경우:

- 교육계정 로그인이 차단됩니다.
- 관리자가 계정을 비활성 상태로 변경하면 기존 교육 세션도 회수됩니다.
- 관리자는 필요한 경우 계정을 삭제한 뒤 새 기간으로 다시 생성합니다.

## 결제/통계 분리 기준

교육계정은 아래 항목과 섞지 않습니다.

- 유료 구독자 수
- 매출 합계
- 환불 후보
- 결제 이력
- 구독 자동화 상태
- `/admin/members` 일반 회원 수와 최근 회원 목록

관리자 회원 통계는 교육계정 회원을 제외하고, 교육계정은 `/admin/education`에서만 별도로 관리하는 것이 안전합니다.

## 운영 주의사항

- 로그인 검증용 비밀번호는 해시 저장됩니다.
- 운영 전달을 위해 초기 비밀번호는 `education_accounts.initial_password`에 관리자 조회용으로 별도 저장됩니다.
- 관리자 교육계정 표와 CSV에는 초기 비밀번호가 포함됩니다. 관리자 토큰/접근 권한을 제한하고 외부 공유 파일 관리에 주의해야 합니다.
- 기존에 생성되어 초기 비밀번호가 저장되지 않은 계정은 비밀번호를 복구할 수 없으므로, 필요하면 일괄 삭제 후 재생성합니다.
- 운영 DB에서 `relation "education_accounts" does not exist`가 보이면 PR #190 이후 버전이 배포됐는지 확인합니다.
- DB 권한 정책상 런타임 테이블 생성이 막히면 `server/db/migrations/005_education_accounts.sql`을 수동 적용합니다.
- `work-npm-cache/` 같은 로컬 캐시/생성물은 커밋하지 않습니다.

## 검증 기록

### 2026-06-14 추가 운영 기준

- 교육 계정 생성은 단일 생성 없이 일괄 생성만 사용합니다.
- 일괄 생성 입력은 `ID`, `시작번호`, `끝번호`, `수업/세미나명`, `만료일` 기준입니다.
- `시작번호=11`, `끝번호=20`처럼 입력하면 기존 1~10번 이후 수강생을 이어서 만들 수 있습니다.
- 자동 비밀번호는 `qwerasdf`의 각 글자에 무작위 대소문자를 적용하고, 뒤에 3자리 번호를 붙입니다. 예: `qWerASdf011`
- 관리자 표와 목록 CSV에는 교육용 ID, 초기 비밀번호, 수업/세미나, 상태, 만료일, 최근 로그인을 함께 표시합니다.
- 계정별 `만료일 저장`, `중지`, `만료` 버튼은 제거하고 `삭제` 버튼으로 대체합니다. 삭제 시 교육 로그인 사용자, 교육 계정 메타데이터, 교육 entitlement가 함께 제거됩니다.
- `선택한 교육 계정 삭제`는 MY PAGE의 `회원탈퇴` 버튼과 같은 경고형 pill 스타일을 사용합니다.
- 날짜만 입력한 만료일은 KST 기준 해당 날짜의 끝까지 유효합니다. 예를 들어 `2026-06-14`는 `2026-06-14 23:59:59.999 KST`까지 유효하고, `2026-06-15 00:00 KST`부터 차단됩니다.
- 기존에 `2026-06-14 00:00:00 UTC`처럼 저장된 날짜형 만료값도 한국시간 기준 해당 날짜 말까지 유효하게 보정합니다.

### 2026-06-14 추가 후속 기준

- 만료일이 지나도 교육 계정 레코드는 자동으로 사라지지 않습니다. 로그인만 차단되며, 관리자가 선택 삭제 또는 개별 삭제로 정리합니다.
- 관리자 표에서 체크박스로 계정을 선택한 뒤 `선택한 교육 계정 삭제`로 여러 계정을 한 번에 삭제합니다.
- 일괄 생성 폼에서 시작번호가 끝번호보다 크면 생성 요청 전에 경고 문구를 표시합니다.
- `일괄 생성`, `교육 계정 새로고침`, `선택한 교육 계정 삭제`, `목록 CSV` 버튼은 일괄 생성 폼 하단에 같은 줄로 배치합니다.
- 교육 계정 카드 PDF/이미지 생성은 가능합니다. 권장 구현은 관리자 표의 선택 계정 또는 CSV 데이터를 카드용 HTML 레이아웃으로 만들고, 브라우저 인쇄 기능으로 PDF 저장을 지원하는 방식입니다. 이미지 저장은 카드 DOM을 캔버스로 렌더링하는 방식보다 PDF/인쇄용 레이아웃을 먼저 안정화한 뒤 2차로 추가하는 편이 안전합니다.
- `/admin/members` 회원 통계와 목록에는 교육계정을 포함하지 않습니다.
- 일반 이메일/비밀번호 로그인 계정은 `/mypage` My Account의 안내 박스에서 `비밀번호 변경`을 사용할 수 있습니다.
- Google/Kakao/Naver OAuth 계정과 교육계정에는 비밀번호 변경 버튼을 표시하지 않습니다.

## 작업내역 문서

- 전체 PR 흐름, 구현 상세, 검증 기록, 다음 채팅 인수인계는 [FINPLE 교육계정 작업내역 및 인수인계](./FINPLE_education_account_worklog_2026_06_14.md)를 기준으로 확인합니다.

PR #189에서 최초 구현이 반영되었습니다.

PR #190에서 관리자 생성 오류와 교육계정 표시 흐름을 수정했고 아래 검증을 완료했습니다.

PR #192에서 교육계정 생성을 일괄 생성 중심으로 단순화하고 자동 초기 비밀번호 규칙을 반영했습니다.

PR #193에서 초기 비밀번호 재조회, 교육계정 일괄 삭제, MY PAGE 교육계정 로컬 데이터 초기화와 결제 메뉴 숨김을 반영했습니다.

PR #197에서 교육용 로그인 버튼 하단 안내 문구 여백을 보정했습니다.

PR #198에서 `/admin/members` 교육계정 제외와 일반 계정 비밀번호 변경 기능을 반영했습니다.

- `node --check server/src/db/educationAccountSchema.js`
- `node --check server/src/db/educationAccountRepository.js`
- `node --check server/src/db/authRepository.js`
- `npx.cmd eslint src\components\AccountPages.jsx src\components\AdminInquiriesPage.jsx`
- `npm.cmd run build`
- `git diff --check`

## #187 폐기 기준

PR #187은 구현 전 계획과 인수인계 초안입니다. 이 문서가 병합되면 최신 구현 상태와 운영 주의사항이 보존되므로 #187은 `superseded`로 닫아도 됩니다.
