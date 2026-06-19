# FINPLE 문의 사진 첨부 운영 설정

## 저장 구조

- 원본 사진: 비공개 Supabase Storage 버킷 `finple-inquiry-attachments`
- PostgreSQL: 파일명, Storage 경로, MIME 타입, 용량, 만료일만 저장
- 관리자 조회: `/admin` 문의 상세에서 10분간 유효한 Signed URL 사용

## Render 환경변수

`finple-api` 서비스에 아래 값을 설정합니다.

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase service_role key>
SUPABASE_INQUIRY_BUCKET=finple-inquiry-attachments
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 비밀값입니다. Vercel 또는 프런트엔드 환경변수에 넣지 않습니다.

## 제한과 보관

- JPG, PNG, WebP
- 문의당 최대 3장
- 장당 최대 5MB
- 사진 첨부 문의는 IP당 시간당 최대 5회
- 문의 처리 중 사진은 최대 180일 보관
- 문의 상태가 `처리 완료` 또는 `종료`로 바뀌면 만료일을 90일 후로 갱신
- 만료 사진은 신규 업로드 또는 관리자 조회 시 Storage API를 통해 삭제

## 데이터베이스

서버가 최초 사용 시 `inquiry_attachments` 테이블을 자동 준비합니다. 수동 반영이 필요한 경우:

```text
server/db/migrations/006_inquiry_attachments.sql
```

## 운영 확인

```text
GET https://finple-api.onrender.com/api/inquiries/notification-status
```

응답의 `attachments.enabled`가 `true`이면 사진 첨부가 활성화된 상태입니다.
