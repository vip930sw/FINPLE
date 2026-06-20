# FINPLE 작업 이력 및 인수인계

- 작성일: 2026-06-20
- 저장소: [vip930sw/FINPLE](https://github.com/vip930sw/FINPLE)
- 기준 브랜치: `main`
- 근거 PR: #203~#212
- 운영 프런트: <https://finple.co.kr>
- 운영 API: <https://finple-api.onrender.com>

## 1. 작업 요약

이번 작업에서는 HOME 차트 및 푸터 UI 개선부터 문의 접수, 관리자 알림, 사진 첨부, 상태별 사용자 메일, 관리자 답변 기능까지 순차적으로 확장했다.

현재 문의 기능의 목표 흐름은 다음과 같다.

1. 사용자가 문의와 답변 이메일을 입력한다.
2. 필요한 경우 사진을 최대 3장 첨부한다.
3. 문의가 PostgreSQL에 저장되고 사진은 비공개 Supabase Storage에 저장된다.
4. 사용자에게 접수 메일, 관리자 `finple_lab@naver.com`에 신규 문의 알림이 발송된다.
5. 관리자가 상태를 `접수 → 확인 중 → 처리 완료 → 종료`로 변경한다.
6. 상태가 실제로 변경될 때 사용자가 입력한 답변 이메일로 단계별 메일이 발송된다.
7. 관리자가 문의 상세에서 답변을 작성하면 답변 이력이 DB에 저장되고 사용자에게 메일로 전달된다.

## 2. PR별 작업 이력

### PR #203 — HOME 차트 색상 조정

- PR: [#203 Lighten HOME chart blue](https://github.com/vip930sw/FINPLE/pull/203)
- HOME 투자성향 차트의 짙은 Navy 색상을 ABOUT 팔레트의 Deep Blue `#2563EB`로 변경했다.
- 차트 데이터, 레이아웃, 애니메이션은 변경하지 않았다.
- 검증: 프런트 빌드 통과.

### PR #204 — 푸터 SNS 아이콘

- PR: [#204 Add footer social icons](https://github.com/vip930sw/FINPLE/pull/204)
- Instagram 및 YouTube 아이콘 영역을 푸터에 추가했다.
- Instagram: <https://www.instagram.com/finple_lab/>
- YouTube: 채널 개설 전까지 비활성화된 자리표시로 유지한다.
- 데스크톱과 모바일 배치, 키보드 포커스, 스크린리더 설명을 반영했다.

### PR #205 — 관리자 문의·구독 알림 메일

- PR: [#205 Send admin email notifications](https://github.com/vip930sw/FINPLE/pull/205)
- 신규 문의와 신규 구독 발생 시 관리자 메일을 발송하도록 구현했다.
- 관리자 기본 수신 주소: `finple_lab@naver.com`
- 사용자 메일과 관리자 메일은 독립적으로 처리한다. 관리자 메일 실패가 문의 저장이나 결제 성공을 되돌리지 않는다.
- 일반 Toss 결제와 빌링키 기반 첫 구독 결제를 모두 포함한다.

### PR #206 — 문의 접수 성공 모달

- PR: [#206 Show inquiry success dialog](https://github.com/vip930sw/FINPLE/pull/206)
- 문의 저장 성공 시 중앙 확인 모달을 표시한다.
- 접수번호와 문의 제목을 보여준다.
- 확인 버튼, 바깥 영역 클릭, `Esc` 키로 닫을 수 있다.
- 답변 이메일 입력 여부에 따라 후속 안내 문구가 달라진다.

### PR #207 — 성공 모달 문구 정리

- PR: [#207 Shorten inquiry success copy](https://github.com/vip930sw/FINPLE/pull/207)
- 긴 안내 문구를 `담당자 확인 후 이메일로 안내드립니다.`로 줄였다.
- 기존 모달 크기 안에서 한 줄로 안정적으로 표시되도록 했다.

### PR #208 — 문의 사진 첨부

- PR: [#208 Add secure inquiry photo attachments](https://github.com/vip930sw/FINPLE/pull/208)
- JPG, PNG, WebP 사진 첨부·미리보기·삭제 기능을 추가했다.
- 제한:
  - 문의당 최대 3장
  - 장당 최대 5MB
  - MIME 형식과 실제 파일 시그니처 검증
  - 사진 첨부 문의는 IP당 시간당 5회
- 저장 구조:
  - 원본 사진: 비공개 Supabase Storage
  - PostgreSQL: 파일 경로, 파일명, MIME, 용량, 만료일
- 관리자 화면:
  - 썸네일
  - 원본 보기
  - 파일 용량
  - 만료일
- 관리자 원본 링크는 10분짜리 서명 URL이다.
- 보관정책:
  - 진행 중 문의: 최대 180일
  - 처리 완료 또는 종료 후: 90일
  - 만료된 파일은 Storage에서 삭제하고 DB에 삭제 시점을 기록한다.

### PR #209 — 사진 업로드 멈춤 및 버튼 정렬 수정

- PR: [#209 문의 사진 업로드 멈춤 및 버튼 정렬 수정](https://github.com/vip930sw/FINPLE/pull/209)
- `사진 선택` 버튼 텍스트를 수평·수직 중앙 정렬로 고정했다.
- Supabase 버킷 존재 여부를 먼저 확인하도록 변경했다.
- Storage 및 Resend 외부 요청에 15초 제한 시간을 추가했다.
- 프런트 문의 업로드 요청에 90초 제한 시간을 적용했다.
- 관리자·사용자 메일을 병렬로 발송한다.
- `/api/inquiries/notification-status`에서 실제 Storage 연결 상태를 확인할 수 있게 했다.

### PR #210 — Supabase URL 정규화

- PR: [#210 Supabase Storage URL 자동 정규화](https://github.com/vip930sw/FINPLE/pull/210)
- `SUPABASE_URL`에 `/rest/v1` 같은 API 경로가 포함되어 발생한 `Invalid path specified in request URL` 오류를 수정했다.
- 서버가 Supabase 프로젝트 origin만 추출해 `/storage/v1/...` 경로를 조합한다.
- 운영 확인에서 Storage 상태가 `connected: true`, `error: null`로 복구됐다.

### PR #211 — 문의 상태별 사용자 이메일

- PR: [#211 문의 진행 상태별 사용자 이메일 안내](https://github.com/vip930sw/FINPLE/pull/211)
- 상태별 메일 제목과 본문을 분리했다.
  - 접수
  - 확인 중
  - 처리 완료
  - 종료
- 같은 상태를 다시 선택하면 중복 메일을 보내지 않는다.
- 같은 상태 재선택으로 첨부사진 보관기간이 다시 연장되지 않게 했다.

상태 의미:

- `처리 완료`: 담당자의 답변 또는 필요한 조치는 끝났지만 추가 확인·보완 요청이 가능한 상태
- `종료`: 처리 완료 후 추가 요청이 없어 문의 이력을 최종 마감한 상태

### PR #212 — 관리자 답변 및 상태 메일 보완

- PR: [#212 관리자 문의 답변 및 상태 메일 발송 개선](https://github.com/vip930sw/FINPLE/pull/212)
- 상태 메일 수신 주소를 로그인 계정 이메일보다 문의 폼의 `답변 이메일` 우선으로 변경했다.
- 원인: 접수 메일과 상태 메일의 수신 주소 선택 기준이 달랐다.
- 관리자 화면에 상태 메일의 수신 주소와 발송 성공·실패 결과를 표시한다.
- Resend가 `429` 또는 `5xx`를 반환하면 한 번 재시도한다.
- 관리자 문의 상세에 답변 작성 기능을 추가했다.
- 답변은 DB에 저장된 뒤 사용자의 답변 이메일로 발송된다.
- 관리자 화면에서 답변 내용, 작성 시각, 수신 주소, 메일 성공·실패 상태를 확인할 수 있다.
- 기존 운영 DB에서도 첫 사용 시 `inquiry_replies` 테이블과 인덱스를 자동 생성한다.

## 3. 현재 문의 상태 흐름

| 내부 상태 | 화면 표시 | 사용자 메일 | 운영 의미 |
|---|---|---|---|
| `open` | 접수 | 문의 등록 직후 접수 메일 | 담당자 확인 전 |
| `in_progress` | 확인 중 | 상태가 변경될 때 발송 | 담당자가 내용 검토 중 |
| `resolved` | 처리 완료 | 상태가 변경될 때 발송 | 필요한 답변·조치 완료, 추가 확인 가능 |
| `closed` | 종료 | 상태가 변경될 때 발송 | 문의 이력 최종 마감 |

같은 상태를 다시 선택하면 상태 메일은 발송되지 않는다.

## 4. 관리자 답변 기능

관리자 문의 상세에는 다음 영역이 추가됐다.

- 기존 답변 이력
- 메일 발송 완료·실패 표시
- 답변 수신 주소
- 답변 작성 textarea
- `답변 저장 및 메일 발송` 버튼

답변 처리 순서:

1. 관리자 토큰 검증
2. 문의 및 답변 이메일 조회
3. `inquiry_replies`에 답변 저장
4. Resend로 사용자 메일 발송
5. 메일 ID 또는 오류를 답변 행에 기록
6. 관리자 화면에 결과 표시

메일 발송이 실패해도 작성한 답변은 DB에 남는다. 관리자 화면에서 실패 사유를 확인할 수 있다.

## 5. 주요 API

| 메서드 | 경로 | 용도 |
|---|---|---|
| `POST` | `/api/inquiries` | 문의 및 사진 접수 |
| `GET` | `/api/inquiries?scope=all` | 관리자 문의 목록 |
| `PATCH` | `/api/inquiries/:inquiryId/status` | 문의 상태 변경 및 상태 메일 |
| `GET` | `/api/inquiries/:inquiryId/attachments` | 관리자 사진 조회 |
| `GET` | `/api/inquiries/:inquiryId/replies` | 관리자 답변 이력 조회 |
| `POST` | `/api/inquiries/:inquiryId/replies` | 관리자 답변 저장 및 메일 발송 |
| `GET` | `/api/inquiries/notification-status` | 메일·Storage 설정 상태 조회 |

관리자 전용 API에는 `x-finple-admin-token` 또는 Bearer 토큰이 필요하다.

## 6. 데이터 저장 구조

### `inquiries`

- 문의 제목·내용·상태·사용자 연결 정보 저장
- 답변 이메일과 페이지 URL, User Agent는 현재 문의 본문의 메타 영역에도 포함된다.

### `inquiry_attachments`

- Supabase Storage 경로와 파일 메타데이터 저장
- 원본 바이너리는 DB가 아니라 비공개 Storage에 저장
- 만료일과 삭제 시점 관리

### `inquiry_replies`

- 관리자 답변 본문
- 수신 이메일
- 메일 발송 성공 여부
- Resend 메일 ID
- 오류 내용
- 작성 시각

운영 DB에는 답변 API를 처음 호출할 때 테이블이 자동 생성된다. 신규 환경은 `server/db/migrations/001_init.sql`에도 정의되어 있다.

## 7. 관련 주요 파일

### 프런트

- `src/components/AccountPages.jsx`
  - 사용자 문의 폼, 사진 첨부, 성공 모달
- `src/components/AdminInquiriesPage.jsx`
  - 관리자 문의 목록·상세·상태 변경·사진 조회·답변 작성 및 이력
- `src/components/portfolio/services/serverPortfolioService.js`
  - 문의, 첨부, 상태, 답변 API 클라이언트
- `src/App.css`
  - 문의 폼, 모달, 관리자 문의·답변 UI 스타일

### 백엔드

- `server/src/routes/inquiryRoutes.js`
  - 문의 접수, 상태 변경, 사진·답변 관리자 API
- `server/src/services/inquiryNotificationService.js`
  - 관리자 신규 문의 및 신규 구독 알림
- `server/src/services/userNotificationService.js`
  - 사용자 접수·상태·관리자 답변 이메일
- `server/src/services/inquiryAttachmentService.js`
  - Supabase Storage 업로드, 서명 URL, 보관·삭제
- `server/src/services/inquiryReplyService.js`
  - 답변 테이블 준비, 저장, 이력, 메일 결과 기록
- `server/src/utils/fetchWithTimeout.js`
  - Storage·Resend 외부 요청 제한 시간
- `server/db/migrations/001_init.sql`
  - 신규 DB의 문의 답변 테이블 정의

### 운영 문서

- `docs/FINPLE_inquiry_attachments_setup.md`
  - Supabase 사진 첨부 설정

## 8. 필수 운영 환경변수

### Render API

- `DATABASE_URL`
- `RESEND_API_KEY`
- `FINPLE_EMAIL_FROM` 또는 `SUPPORT_EMAIL_FROM`
- `SUPPORT_NOTIFY_EMAIL=finple_lab@naver.com`
- `FINPLE_APP_BASE_URL=https://finple.co.kr`
- `FINPLE_ADMIN_TOKEN`
- `FINPLE_ADMIN_PREVIEW_ENABLED=true`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- 선택: `SUPABASE_INQUIRY_BUCKET=finple-inquiry-attachments`

주의:

- `SUPABASE_SERVICE_ROLE_KEY`와 관리자 토큰은 브라우저 코드에 넣으면 안 된다.
- Supabase Service Role Key는 Render 서버 환경변수에서만 사용한다.
- Resend 발신 주소는 Resend에서 인증된 도메인 또는 허용된 발신 주소여야 한다.

### Vercel 프런트

- `VITE_FINPLE_API_BASE_URL`

프런트 API 주소가 Render 운영 API를 가리키는지 확인한다.

## 9. 검증 완료 사항

- PR #203~#212 모두 `main`에 병합됨
- 관련 프런트 빌드 통과
- 변경 프런트 파일 대상 ESLint 통과
- 변경 서버 파일 `node --check` 통과
- 사진 형식 및 위장 파일 검증 모의 테스트 통과
- 기존·신규 Supabase 버킷 연결 모의 테스트 통과
- 운영 Storage 연결:
  - `connected: true`
  - `error: null`
- 상태 메일 및 관리자 답변 메일 Resend 모의 발송 통과
- PR #212 병합 후 Vercel 운영 배포 성공
- Render API health 응답 정상
- 관리자 답변 API는 운영에서 관리자 토큰 없이는 `403 ADMIN_TOKEN_REQUIRED`를 반환해 접근제어가 적용됨

## 10. 인수인계 필수 확인 사항

### 10.1 실제 메일 실수신 점검

코드와 모의 Resend 호출은 검증했지만, 기존 실제 문의를 임의로 변경하거나 사용자에게 테스트 메일을 보내지는 않았다.

운영 관리자가 아래 시나리오를 실제 테스트해야 한다.

1. 테스트 문의를 새로 접수한다.
2. 접수 메일이 문의 폼의 답변 이메일로 오는지 확인한다.
3. 관리자 패널에서 `확인 중`으로 변경한다.
4. 관리자 화면에 `메일을 발송했습니다`와 실제 수신 주소가 표시되는지 확인한다.
5. `처리 완료`, `종료`도 동일하게 확인한다.
6. 관리자 답변을 작성하고 답변 메일 및 답변 이력 저장을 확인한다.
7. 스팸함과 Naver 메일 차단 여부도 확인한다.

발송 실패 시 관리자 화면에 표시되는 Resend 오류 문구를 먼저 확보한다.

### 10.2 과거 문의의 답변 이메일

현재 상태·답변 메일은 문의 본문 메타 영역에서 추출한 `답변 이메일`을 우선 사용한다. 없으면 연결된 회원 이메일을 사용한다.

오래된 문의 중 메타 형식이 다르거나 이메일이 없는 데이터는 메일 발송이 불가능할 수 있다.

장기적으로는 `inquiries` 테이블에 `reply_email` 컬럼을 별도로 추가해 본문 파싱 의존성을 제거하는 것이 권장된다.

### 10.3 답변과 상태 변경 관계

현재 관리자 답변을 보내도 문의 상태가 자동으로 `처리 완료`로 바뀌지 않는다. 상태 변경과 답변 발송은 독립 동작이다.

운영 권장 순서:

1. `확인 중`
2. 관리자 답변 작성·발송
3. 답변 또는 조치가 끝났으면 `처리 완료`
4. 추가 요청이 없으면 `종료`

향후 필요하면 `답변 발송 후 자동으로 처리 완료` 옵션을 별도로 설계할 수 있다.

### 10.4 사진 보관정책

- 진행 중 최대 180일
- 처리 완료·종료 후 90일
- 동일 상태 재선택으로 보관기간은 연장되지 않는다.

법무·운영 정책이 달라지면 화면의 개인정보 안내, 서비스 상수, 실제 삭제 로직을 함께 변경해야 한다.

### 10.5 전체 린트

저장소 전체 `npm run lint`는 이번 작업 이전부터 존재한 약 205개의 오류로 실패한다.

주요 유형:

- 서버 파일의 `process`, `Buffer` Node 전역 설정 누락
- 기존 미사용 변수
- React effect 내 동기 상태 변경 규칙

변경 파일은 대상 ESLint와 빌드로 검증했다. 후속 작업에서 전체 린트 정리는 별도 PR로 분리하는 것이 안전하다.

### 10.6 브라우저 자동 검증 제한

Windows sandbox 권한 문제로 인앱 브라우저 자동 검증이 일부 세션에서 실행되지 않았다. 빌드, 정적 검사, 운영 HTTP 응답 및 Vercel 배포 상태로 보완했다.

관리자 답변 UI는 운영 배포 후 실제 관리자 토큰으로 한 번 수동 확인하는 것이 좋다.

## 11. 권장 후속 작업

우선순위 순서:

1. 운영 환경에서 네 단계 상태 메일과 관리자 답변 메일 실수신 테스트
2. `inquiries.reply_email` 정규 컬럼 추가 및 기존 데이터 마이그레이션
3. 사용자 MY PAGE에 관리자 답변 이력 표시
4. 메일 재발송 버튼 및 실패 건 필터
5. 관리자 답변 수정·취소 정책 결정
6. 문의 상태 변경·답변 발송 감사 로그
7. 전체 저장소 ESLint 기반 정리
8. Supabase 만료 파일 삭제를 정기 스케줄 작업으로 분리

## 12. 다음 작업자용 시작 체크리스트

- [ ] `main` 최신 동기화
- [ ] Render 환경변수 확인
- [ ] Vercel `VITE_FINPLE_API_BASE_URL` 확인
- [ ] `/api/health` 확인
- [ ] `/api/inquiries/notification-status` 확인
- [ ] 테스트 문의 접수
- [ ] 접수·확인 중·처리 완료·종료 메일 실수신 확인
- [ ] 관리자 답변 저장·메일·이력 확인
- [ ] 사진 첨부 및 관리자 원본 보기 확인
- [ ] 실패 시 관리자 화면의 수신 주소와 Resend 오류 확보

## 13. 현재 결론

PR #203~#212의 코드와 배포는 완료됐다. 문의 기능은 텍스트 접수 수준에서 사진 첨부, 관리자 상태 관리, 단계별 사용자 알림, 관리자 답변 이력과 메일 발송까지 확장됐다.

가장 중요한 남은 운영 확인은 실제 메일함에서의 전체 단계 실수신 테스트다. 코드상 수신 주소 우선순위와 발송 결과 표시는 PR #212에서 보완됐으므로, 문제가 재현되면 관리자 패널에 표시되는 실제 수신 주소와 오류 문구를 기준으로 Resend 설정 또는 메일 사업자 수신 정책을 추적하면 된다.
