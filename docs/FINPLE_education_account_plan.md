# FINPLE 교육계정 구현 및 운영 문서

갱신일: 2026-06-14 KST

이 문서는 PR #189, PR #190이 `main`에 반영된 이후의 교육계정 구현 상태를 기록합니다. 기존 문서 초안 PR #187은 구현 전 계획 기준이므로, 이 문서가 병합되면 #187은 폐기해도 됩니다.

## 현재 상태

- 오프라인 수업/세미나용 교육계정 기능이 구현되었습니다.
- 수강생은 로그인 화면에서 `교육용 계정` 모드를 선택하고 교육용 ID/비밀번호로 로그인합니다.
- 정상 교육계정은 `user_entitlements`에 `plan = 'personal'`, `source = 'education'` 권한을 받습니다.
- 교육계정은 유료 구독, 결제 이력, 매출, 환불 후보와 분리됩니다.
- 관리자 콘솔에서 단일 생성, 일괄 생성, 조회, CSV 출력, 비활성화, 만료일 변경, 상태 변경을 할 수 있습니다.
- 요금제와 MY PAGE에서는 교육계정 세션을 `교육용 Personal`로 표시하며, 결제 플랜 변경은 막습니다.

## 구현된 영역

백엔드:

- `server/src/db/educationAccountSchema.js`
  - `education_accounts` 테이블과 인덱스를 런타임에 확인합니다.
  - 수동 마이그레이션 누락 시 발생한 `relation "education_accounts" does not exist` 오류를 완화합니다.
- `server/src/db/educationAccountRepository.js`
  - 단일 교육계정 생성, 일괄 생성, CSV 생성, 상태/만료일 변경, 교육 권한 적용/회수를 담당합니다.
- `server/src/db/authRepository.js`
  - 교육계정 로그인을 처리합니다.
  - 기본 권한 동기화가 `source = 'education'` 권한을 덮어쓰지 않도록 보호합니다.
  - 클라이언트에 `authMode = 'education-account'`, `entitlementSource = 'education'`, 교육계정 메타데이터를 반환합니다.
- `server/src/routes/adminRoutes.js`
  - 교육계정 목록, CSV, 단일 생성, 일괄 생성, 상태 변경 API를 제공합니다.
- `server/src/routes/authRoutes.js`
  - `/auth/education-login`을 제공합니다.

프론트엔드:

- `src/components/AuthPages.jsx`
  - 일반 계정 / 교육용 계정 로그인 모드를 제공합니다.
- `src/components/AdminInquiriesPage.jsx`
  - 관리자 콘솔에 `교육 계정 관리` 패널을 제공합니다.
- `src/components/AccountPages.jsx`
  - 교육계정 세션을 `교육용 Personal`로 표시합니다.
  - 교육계정에서는 요금제 변경/결제 플로우를 진행하지 않도록 합니다.
- `src/components/portfolio/services/serverPortfolioService.js`
  - 교육계정 세션 메타데이터 저장과 관리자 교육계정 API 호출을 담당합니다.

마이그레이션:

- `server/db/migrations/005_education_accounts.sql`

## 데이터 구조

`education_accounts`는 교육계정 전용 메타데이터를 저장합니다.

- `id`
- `user_id`
- `login_id`
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
- `paused`: 임시 중지
- `expired`: 만료
- `revoked`: 회수

교육 권한은 `user_entitlements`에 아래 기준으로 부여합니다.

- `plan = 'personal'`
- `source = 'education'`
- `valid_from = NOW()`
- `valid_until = education_accounts.valid_until`

이 권한은 결제 또는 유료 구독 기록이 아닙니다.

## 관리자 운영 흐름

단일 생성:

1. `/admin` 접속
2. `교육 계정 관리` 선택
3. 교육용 ID, 초기 비밀번호, 표시 이름, 수업/세미나명, 만료일 입력
4. 계정 생성
5. 생성 직후 CSV를 복사하거나 저장

일괄 생성:

1. `/admin` 접속
2. `교육 계정 관리` 선택
3. 접두어, 생성 개수, 수업/세미나명, 만료일 입력
4. `일괄 생성` 실행
5. 생성된 CSV를 인쇄용 명단 또는 수강생 전달 자료로 사용

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
- 관리자는 만료일과 상태를 다시 조정할 수 있습니다.

## 결제/통계 분리 기준

교육계정은 아래 항목과 섞지 않습니다.

- 유료 구독자 수
- 매출 합계
- 환불 후보
- 결제 이력
- 구독 자동화 상태

관리자 회원 통계는 교육계정 회원을 별도로 구분해야 하며, 일반 Free 전환 후보로 계산하지 않는 것이 안전합니다.

## 운영 주의사항

- 비밀번호는 해시 저장됩니다.
- 초기 비밀번호는 계정 생성 시 CSV/카드로만 제한적으로 노출합니다.
- 일반 교육계정 CSV 내보내기에는 비밀번호를 포함하지 않습니다.
- 운영 DB에서 `relation "education_accounts" does not exist`가 보이면 PR #190 이후 버전이 배포됐는지 확인합니다.
- DB 권한 정책상 런타임 테이블 생성이 막히면 `server/db/migrations/005_education_accounts.sql`을 수동 적용합니다.
- `work-npm-cache/` 같은 로컬 캐시/생성물은 커밋하지 않습니다.

## 검증 기록

PR #189에서 최초 구현이 반영되었습니다.

PR #190에서 관리자 생성 오류와 교육계정 표시 흐름을 수정했고 아래 검증을 완료했습니다.

- `node --check server/src/db/educationAccountSchema.js`
- `node --check server/src/db/educationAccountRepository.js`
- `node --check server/src/db/authRepository.js`
- `npx.cmd eslint src\components\AccountPages.jsx src\components\AdminInquiriesPage.jsx`
- `npm.cmd run build`
- `git diff --check`

## #187 폐기 기준

PR #187은 구현 전 계획과 인수인계 초안입니다. 이 문서가 병합되면 최신 구현 상태와 운영 주의사항이 보존되므로 #187은 `superseded`로 닫아도 됩니다.
