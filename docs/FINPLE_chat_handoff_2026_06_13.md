# FINPLE chat handoff: login, MY PAGE, admin, refund, footer

작성일: 2026-06-13

범위: 본 채팅에서 진행한 `/start`, `/login`, `/mypage`, `/admin`, 알림, 회원탈퇴, 환불정책, 푸터 관련 작업과 다음 인수인계 사항

대상 저장소: `vip930sw/FINPLE`

---

## 1. 요약

이 채팅에서는 FINPLE의 로그인 후 라우팅, MY PAGE 메뉴 구조, 관리자 콘솔 확장, Supabase 기반 관리자 데이터 조회, Resend 알림, 회원탈퇴, 환불정책, 푸터 레이아웃을 순차적으로 정리했다.

대부분의 변경은 PR 단위로 main에 병합되었고, 로컬 main도 마지막 병합 커밋 기준으로 맞춰졌다.

---

## 2. 주요 병합 커밋

최근 이 채팅에서 확인된 주요 커밋은 다음과 같다.

```text
23cc6df Tune footer notice responsiveness
6dc9fe0 Align footer notice text
518e115 Adjust footer desktop layout
830c3ad Strengthen refund policy page
b12adb3 Step 112-3: Document refund legal policy guidance
ab7fd2e Add account withdrawal flow
34119a7 Add mobile menus and user email notifications
bda721b Simplify mypage menu header
fa5614b Add admin clear menu
d16aa7a Clean admin login copy
8559242 Tighten admin section spacing
61c7eff Refine admin console layout
c602c6c Improve admin API diagnostics
f1d6fae Fix admin inquiry panel visibility
fa54127 Auto load admin management data
8b806a1 Add admin member and subscription management
```

---

## 3. `/start`와 로그인 후 복귀

요청 흐름:

```text
로그인 메뉴 접근: /login -> /mypage
로그아웃 상태에서 스타트 접근: /start -> /login -> /start
로그인 상태에서 스타트 접근: /start
```

작업 결과:

- 로그아웃 상태에서 `/start` 접근 시 `/login`으로 유도
- 로그인 완료 후 원래 목적지인 `/start`로 복귀
- `/login -> /start` 전환 시 기존 MY PAGE 전환 로딩스피너와 같은 형태와 문구를 사용
- 관련 문서: `docs/FINPLE_login_start_route_loader.md`

주의:

- 로그인 후 목적지는 `sessionStorage`의 pending redirect 값에 의존한다.
- `/login -> /mypage`와 `/login -> /start`의 로더 이벤트가 서로 충돌하지 않는지 확인해야 한다.

---

## 4. MY PAGE 메뉴와 모바일 드롭다운

작업 결과:

- `/mypage` 메뉴 헤더를 간략화
- 모바일 환경에서 사이드 메뉴가 화면을 크게 차지하지 않도록 드롭다운 형태를 적용
- `/admin`에도 같은 모바일 드롭다운 방향을 적용

주의:

- MY PAGE는 여전히 일부 patch 파일 기반 보정 구조가 남아 있다.
- 향후 MY PAGE 리팩터링 시 `AccountPages.jsx`와 `MyPage...Patch.js` 계열 파일을 함께 확인해야 한다.

관련 기존 문서:

- `docs/FINPLE_step112_5_mypage_stabilization_plan.md`
- `docs/FINPLE_step112_6_mypage_ui_handoff.md`
- `docs/FINPLE_step112_payment_mypage_handoff.md`

---

## 5. 관리자 콘솔

작업 결과:

- 기존 문의사항 관리에 더해 회원 관리, 구독 관리 추가
- `/admin` 메뉴를 `/mypage`와 유사한 구조로 정리
- 관리자 모드 해제 메뉴 추가
- 불필요한 관리자 안내 패널과 문구 제거
- 섹션 타이틀 간격, 영어 섹션 라벨 색상, 조회 가능 배지 등을 정리
- 관리자 로그인 화면의 불필요 문구 제거

관리자 라우트:

```text
/admin
/admin/inquiries
/admin/members
/admin/subscriptions
/admin/clear
```

서버 라우트:

```text
GET /api/admin/health
GET /api/admin/members
GET /api/admin/subscriptions
```

주의:

- 관리자 접근은 브라우저 localStorage의 `finple-admin-token`과 서버의 `FINPLE_ADMIN_TOKEN` 검증에 의존한다.
- `/admin`을 벗어난다고 관리자 모드가 자동 해제되는 것은 아니다.
- 저장된 관리자 토큰을 지우려면 관리자 모드 해제 메뉴를 사용한다.

---

## 6. Supabase / 관리자 데이터 조회

사용자는 Supabase 프로젝트와 Render API 환경변수를 확인했다.

작업 중 확인한 방향:

- 관리자 데이터는 Supabase PostgreSQL 연결이 필요하다.
- Render backend의 `DATABASE_URL`, `DATABASE_SSL`, `CORS_ORIGIN`, `FINPLE_ADMIN_TOKEN` 등이 중요하다.
- `/api/admin/health` 응답이 정상이고 `databaseConfigured: true`이면 백엔드 DB 연결은 기본적으로 가능하다.

주의:

- Vercel 프론트엔드 환경변수와 Render 백엔드 환경변수는 별도로 관리된다.
- Vercel의 `VITE_...` 변수는 브라우저 번들에 들어가는 값이고, `DATABASE_URL` 같은 서버 비밀값은 Render 쪽에 있어야 한다.

---

## 7. Resend 알림

작업 결과:

- Resend API 기반 사용자 알림 연결
- 문의 접수/문의 상태 변경/구독 상태 변경 등 사용자 알림 흐름 정리
- 모바일 드롭다운 작업과 함께 PR로 병합

주의:

- `RESEND_API_KEY`가 없으면 발송은 skip 또는 실패 상태로 남아야 한다.
- `FINPLE_EMAIL_FROM`, `SUPPORT_EMAIL_FROM`, `FINPLE_APP_BASE_URL` 확인이 필요하다.
- 이메일 인증과 운영 알림은 같은 Resend 인프라를 쓸 수 있지만, 템플릿과 발송 목적은 분리하는 것이 좋다.

---

## 8. 회원탈퇴

작업 결과:

- `/mypage > 내 계정` 하단에 회원탈퇴 진입점 추가
- 사이드 메뉴에는 회원탈퇴를 추가하지 않음
- 탈퇴 모달에서 3개 확인 체크와 `회원탈퇴` 직접 입력 필요
- 서버 `DELETE /auth/me` 추가
- 탈퇴 시 구독 상태는 `canceled`, 정기결제수단은 `disabled` 처리
- 클라이언트 auth/session 및 visible portfolio storage 정리

주의:

- 회원탈퇴만으로 이미 결제된 금액이 자동 환불되는 것은 아님
- 환불이 필요한 경우 탈퇴 전 문의사항을 통해 먼저 요청하도록 안내
- 결제/회계 보존 정책이 생기면 결제 관련 row 삭제 정책은 재검토해야 한다.

---

## 9. 환불정책

작업 결과:

- `docs/FINPLE_refund_legal_policy_review.md` 문서 추가
- `/refund` 페이지 문구 보강
- 7일 이내 + 유료 기능 미사용 시 환불 가능 기준 명확화
- 유료 기능 제공 개시 후 환불 제한 가능 문구 추가
- 중복결제, 오결제, 미제공, 회사 귀책 장애 등 예외 처리 기준 추가
- 구독 해지와 환불을 별도 절차로 분리

주의:

- `/refund`, `/terms`, 결제 화면 필수 동의 문구는 서로 내용이 맞아야 한다.
- “전면 환불불가”처럼 보이는 문구는 피해야 한다.
- 최종 상용화 전 법률 검토가 필요하다.

관련 문서:

- `docs/FINPLE_refund_legal_policy_review.md`

---

## 10. 푸터

작업 결과:

- PC 푸터를 2열 2행 구조로 조정

```text
로고 | 투자유의 문구
사업자정보 | 푸터메뉴
```

- `© 2026 FINPLE. Beta service.`에서 `Beta service.` 제거
- 투자유의 문구는 PC에서 `참고 자료이며,` 뒤 줄바꿈 유지
- 투자유의 문구는 PC에서 오른쪽 정렬
- 모바일에서는 투자유의 문구의 명시적 줄바꿈을 숨기고 자연스럽게 이어지도록 조정
- 동일 푸터가 쓰이는 결제 결과, 결제수단, 시뮬레이터 상세 독립 페이지도 함께 정리

관련 파일:

```text
src/App.jsx
src/components/SiteFooter.css
src/BillingResultRoutePatch.js
src/PaymentMethodRoutePatch.js
src/components/SimulatorDetailStandalonePage.jsx
```

주의:

- 푸터는 React 컴포넌트와 문자열 기반 patch 파일 양쪽에 중복 구현이 있다.
- 푸터 문구 수정 시 위 파일들을 함께 검색해야 한다.

---

## 11. 교육용 계정 후속 작업

교육용 계정은 아직 구현하지 않았고, 별도 설계 문서로 정리했다.

관련 문서:

- `docs/FINPLE_education_account_plan.md`

핵심 방향:

- `/login`에 일반 계정 / 교육용 계정 탭 추가
- `education_accounts` 테이블 도입
- 교육용 계정은 Personal 권한과 동일하되 `source = education`으로 분리
- 관리자 패널에서 생성, 일괄 생성, 만료, 비밀번호 재발급, CSV 다운로드 제공
- 유료 구독 통계와 교육용 권한 통계 분리

중요 주의:

- 현재 로그인 흐름의 `ensureDefaultEntitlement()`가 권한을 덮어쓸 수 있으므로, 교육용 권한 보존 로직을 먼저 설계해야 한다.

---

## 12. 검증 패턴

이 채팅에서 반복 사용한 검증:

```text
npm.cmd run build
npx.cmd eslint <changed files>
git diff --check
node --check <server js file>
```

주의:

- 전체 `npm.cmd run lint`는 저장소 전역 기존 lint 오류로 실패할 수 있다.
- 변경 파일 단위 ESLint와 Vite build를 우선 검증 기준으로 사용했다.
- `.jsx` 파일은 `node --check` 직접 검사가 맞지 않으므로 Vite build 또는 ESLint로 검증한다.

---

## 13. 로컬 환경 주의사항

로컬 작업트리에는 기존 untracked `work-npm-cache/` 폴더가 남아 있다.

이 폴더는 이번 작업들과 무관하므로 커밋하지 않았다.

또한 이 Windows shell에서는 `Start-Process`로 Vite dev server를 백그라운드 실행할 때 `Path/PATH` 중복 문제로 실패하는 경우가 있었다. 그래서 일부 화면 작업은 로컬 브라우저 캡처 대신 build, CSS diff, 파일 단위 ESLint로 검증했다.

---

## 14. 다음 작업자 체크리스트

- `/admin` 메뉴가 모바일/PC 모두 정상 노출되는지 확인
- `/mypage` 패치 기반 구조가 추가 변경에 영향을 주지 않는지 확인
- `/refund`, `/terms`, 결제 동의 문구의 정책 일관성 확인
- 회원탈퇴 후 구독/정기결제수단 상태가 운영 DB에서 의도대로 정리되는지 확인
- 교육용 계정 구현 전 `ensureDefaultEntitlement()` 보존 정책 결정
- 푸터 수정 시 `App.jsx`, `SiteFooter.css`, 결제 patch 파일, 시뮬레이터 상세 파일을 함께 검색
