# FINPLE 교육계정 인수인계

갱신일: 2026-06-14 KST

이 문서는 교육계정 구현과 후속 수정이 `main`에 반영된 이후의 인수인계 기록입니다. 전체 작업내역과 새 채팅용 요약은 `docs/FINPLE_education_account_worklog_2026_06_14.md`를 함께 확인합니다.

## 저장소 상태

- 저장소: `vip930sw/FINPLE`
- 기준 브랜치: `main`
- 구현 PR: #189 `Add education account management`
- 후속 수정 PR: #190 `Fix education account admin setup`
- 후속 수정 PR: #192 `Simplify education bulk account creation`
- 후속 수정 PR: #193 `Refine education account admin and mypage`
- 후속 수정 PR: #197 `Increase education login helper gap`
- 후속 수정 PR: #198 `Exclude education accounts from member stats and add password change`
- 대체 대상 문서 PR: #187 `Document education account plan and handoff`

## 구현 완료 내용

교육계정은 결제 없이 오프라인 수업/세미나 수강생에게 Personal 수준 권한을 제공하는 용도입니다.

구현된 기능:

- 관리자 일괄 교육계정 생성
- 교육계정 총수, 활성 계정, 7일 내 만료, 최근 로그인 지표 조회
- 개별 삭제
- 교육계정 CSV 출력
- 교육계정 일괄 삭제
- 일괄 생성 시 자동 초기 비밀번호 생성
- 교육계정 목록 표와 CSV에 교육용 ID/초기 비밀번호 표시
- 로그인 화면의 교육용 계정 모드
- 교육 로그인 시 Personal 권한 부여
- 요금제/MY PAGE의 `교육용 Personal` 표시
- 교육계정 MY PAGE에서 결제수단/결제내역 메뉴 숨김
- 교육계정 최초 로그인 시 브라우저 로컬 투자성향/포트폴리오 임시 데이터 초기화
- 결제/구독/매출 흐름과 교육계정 분리
- `/admin/members` 일반 회원 관리 집계와 목록에서 교육계정 제외
- 일반 이메일/비밀번호 로그인 계정 전용 비밀번호 변경 버튼과 API

## 주요 코드 위치

백엔드:

- `server/src/db/educationAccountSchema.js`
- `server/src/db/educationAccountRepository.js`
- `server/src/db/authRepository.js`
- `server/src/routes/adminRoutes.js`
- `server/src/routes/authRoutes.js`

프론트엔드:

- `src/components/AuthPages.jsx`
- `src/components/AdminInquiriesPage.jsx`
- `src/components/AccountPages.jsx`
- `src/components/authClientService.js`
- `src/components/portfolio/services/serverPortfolioService.js`
- `src/MyPage*Patch.js`
- `src/MyPageAccountStatusDisplayPatch.js`

마이그레이션:

- `server/db/migrations/005_education_accounts.sql`

## 운영 흐름

1. 관리자가 `/admin`에 접속합니다.
2. 관리자 모드로 진입합니다.
3. `교육 계정 관리`를 선택합니다.
4. 일괄 생성을 실행합니다.
5. 교육계정 목록 표와 CSV에서 초기 비밀번호를 확인하고 복사/저장합니다.
6. 수강생은 `/login`에 접속합니다.
7. `교육용 계정`을 선택합니다.
8. 교육용 ID와 비밀번호로 로그인합니다.
9. 유효 기간 동안 `/start`, MY PAGE, 서버 저장, Personal 기준 기능을 사용합니다.

## 첫 배포 확인 중 수정된 문제

관리자 콘솔에서 아래 오류가 확인되었습니다.

```text
relation "education_accounts" does not exist
```

PR #190에서 교육계정 관리자 API와 교육 로그인 경로가 사용 전에 테이블/인덱스를 확인하도록 수정했습니다. 수동 마이그레이션 누락이 있어도 첫 호출에서 테이블 생성이 시도됩니다.

## 배포 후 확인 체크리스트

다음 배포 후 아래 순서로 확인합니다.

1. `/admin` 접속
2. `교육 계정 관리` 선택
3. relation 오류가 사라졌는지 확인
4. 테스트 계정 2~3개 일괄 생성
5. 비밀번호가 `qwerasdf` 무작위 대소문자 + 3자리 번호 규칙으로 생성되는지 확인
6. 전달용 패널과 CSV에 교육용 ID/초기 비밀번호가 함께 표시되는지 확인
7. 로그아웃 후 `/login` 접속
8. `교육용 계정` 선택
9. 생성된 교육용 ID로 로그인
10. `/start` 접근 확인
11. `/pricing`에서 `교육용 Personal` 표시와 요금제 변경 비활성화 확인
12. MY PAGE에서 `교육용 Personal` 표시 확인
13. `/admin/members`에서 교육계정이 일반 회원 목록과 구독률 계산에 포함되지 않는지 확인
14. 일반 이메일/비밀번호 계정으로 `/mypage` 접속 후 My Account 안내 박스의 `비밀번호 변경` 버튼 확인
15. 관리자에서 테스트 계정을 삭제
16. 재로그인이 차단되는지 확인

## 주의사항

### 2026-06-14 후속 반영

- 교육 계정 관리는 단일 생성 없이 일괄 생성 중심으로 운영합니다.
- 일괄 생성 폼은 `ID`, `시작번호`, `끝번호`, `수업/세미나명`, `만료일`을 입력합니다.
- 기존 수강생 이후 추가 생성이 필요하면 시작번호와 끝번호를 지정합니다. 예: 11~20.
- 자동 비밀번호는 `qwerasdf` 무작위 대소문자 + 3자리 번호입니다.
- 관리자 교육 계정 표는 비밀번호 열을 항상 포함하며, 별도 최근 생성 표는 사용하지 않습니다.
- 계정별 상태/만료 버튼은 `삭제` 버튼으로 단순화했습니다. 삭제 시 해당 교육 로그인 계정과 권한이 함께 제거됩니다.
- 전체 삭제 버튼은 위험 동작임을 드러내도록 MY PAGE `회원탈퇴`와 같은 경고형 스타일을 사용합니다.
- 날짜만 입력한 만료일은 KST 기준 당일 23:59:59.999까지 유효합니다. `2026-06-14`는 `2026-06-15 00:00 KST`부터 로그인 차단으로 해석합니다.
- 기존에 자정 UTC로 저장된 날짜형 만료값도 같은 날짜의 KST 23:59:59.999까지 유효하게 보정합니다.
- 만료일이 지나도 계정은 자동 삭제되지 않습니다. 로그인만 차단되며, 관리자가 개별 삭제 또는 선택 삭제로 정리합니다.
- 선택 체크박스를 통해 여러 교육 계정을 골라 `선택한 교육 계정 삭제`를 실행할 수 있습니다.
- 시작번호가 끝번호보다 크면 일괄 생성 요청 전에 경고 문구를 표시합니다.
- 교육 계정 카드 PDF/이미지 생성은 가능하며, 1차 구현은 인쇄/PDF용 카드 레이아웃을 권장합니다.
- 수강생별 번호/링크 기반 디지털 계정 지급도 가능합니다. 구현 전 링크 토큰 만료, 1회 조회 제한, 조회 로그, 비밀번호 재노출 정책을 먼저 정해야 합니다.
- `/admin/members` 회원 수, 구독자 수, 구독률, 플랜 분포, 최근 회원 목록에는 교육계정을 포함하지 않습니다.
- 일반 이메일/비밀번호 계정만 MY PAGE에서 비밀번호 변경을 사용할 수 있습니다. OAuth 계정과 교육계정에는 표시하지 않습니다.

- 교육계정은 유료 구독자/매출/환불 후보에 포함하지 않습니다.
- 교육 권한은 결제 증빙이 아닙니다.
- 초기 비밀번호는 관리자 교육계정 목록 표/CSV에서 재확인할 수 있도록 저장됩니다.
- 기존에 생성되어 초기 비밀번호가 저장되지 않은 계정은 비밀번호를 복구할 수 없으므로 필요 시 일괄 삭제 후 재생성합니다.
- 런타임 테이블 생성 권한이 없으면 `server/db/migrations/005_education_accounts.sql`을 수동 적용합니다.
- `work-npm-cache/` 같은 생성물은 커밋하지 않습니다.

## #187 처리 권고

PR #187은 구현 전 계획 문서이므로 현재 상태와 맞지 않습니다. 이 문서가 담긴 최신 문서 PR이 병합되면 #187은 폐기해도 됩니다.

## 새 채팅 시작 문구

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

후속 후보:
1. 교육 계정 카드 PDF/인쇄 레이아웃
2. 수강생별 번호/링크 기반 디지털 계정 지급
3. 교육계정 감사 로그 또는 다운로드 로그
4. 관리자 CSV/PDF 재다운로드 권한 제한
```
