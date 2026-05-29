# FINPLE Step 109-8 — Google OAuth 준비

## 1. 작업 목적

이메일 인증이 정상 동작한 이후, 첫 번째 소셜 로그인으로 Google OAuth를 붙이기 위한 준비 단계입니다.

이번 단계에서는 Google/Kakao/Naver 등 여러 소셜 로그인 제공자를 확장할 수 있도록 `oauth_accounts` 저장 구조를 먼저 추가합니다.

```text
1차: Google 로그인
2차: Kakao 로그인
3차: Naver 로그인
```

## 2. 이번 PR의 범위

```text
반영:
- oauth_accounts 테이블 추가
- provider별 외부 계정 ID 저장 구조 추가
- users 테이블과 1:N 연결 구조 준비

미반영:
- Google Cloud OAuth Client 생성
- GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET 환경변수 등록
- 실제 Google 로그인 버튼 동작
- Google callback API
```

실제 Google 로그인 기능은 Google Cloud Console에서 OAuth Client ID와 Redirect URI를 만든 뒤 다음 PR에서 연결합니다.

## 3. Supabase SQL 실행

아래 파일을 Supabase SQL Editor에서 실행합니다.

```text
server/db/migrations/004_oauth_accounts.sql
```

성공하면 `oauth_accounts` 테이블이 생성됩니다.

## 4. oauth_accounts 테이블 역할

```text
oauth_accounts.provider
= google, kakao, naver 등 로그인 제공자

oauth_accounts.provider_user_id
= 제공자가 내려주는 고유 사용자 ID

oauth_accounts.user_id
= FINPLE users.id와 연결

oauth_accounts.email
= 제공자가 내려준 이메일

oauth_accounts.profile
= 제공자 프로필 원본 일부를 JSON으로 보관
```

## 5. Google Cloud Console에서 필요한 설정

Google Cloud Console에서 OAuth 2.0 Client를 생성할 때 다음 값이 필요합니다.

### Authorized JavaScript origins

프론트 도메인을 넣습니다.

```text
https://finple.co.kr
https://운영-Vercel-도메인
```

### Authorized redirect URIs

백엔드 callback 주소를 넣습니다.

```text
https://백엔드-Render-도메인/api/auth/google/callback
```

로컬 테스트를 할 경우에는 아래도 추가합니다.

```text
http://localhost:5050/api/auth/google/callback
```

## 6. Render 백엔드 환경변수 예정

다음 PR에서 실제 Google OAuth를 붙일 때 Render 백엔드에 아래 환경변수가 필요합니다.

```text
GOOGLE_CLIENT_ID=Google OAuth Client ID
GOOGLE_CLIENT_SECRET=Google OAuth Client Secret
GOOGLE_OAUTH_REDIRECT_URI=https://백엔드-Render-도메인/api/auth/google/callback
FINPLE_APP_BASE_URL=https://프론트-운영-도메인
```

`FINPLE_APP_BASE_URL`은 OAuth 성공 후 사용자를 돌려보낼 프론트 주소입니다.

## 7. OAuth 로그인 처리 원칙

```text
1. Google에서 email_verified=true인 계정만 FINPLE 계정으로 허용
2. 같은 이메일의 FINPLE 계정이 있으면 해당 users.id에 연결
3. 같은 이메일이 없으면 신규 users 생성
4. Google 로그인 사용자는 email_verified_at을 즉시 채움
5. provider_user_id 기준으로 중복 연결을 방지
6. 로그인 성공 시 user_sessions를 생성
```

## 8. 주의 사항

OAuth는 이메일 인증보다 설정 실수가 많습니다. 특히 Redirect URI가 한 글자라도 다르면 로그인 실패가 발생합니다.

따라서 실제 기능 연결은 아래 순서로 진행합니다.

```text
1. oauth_accounts 테이블 생성
2. Google Cloud OAuth Client 생성
3. Render 환경변수 등록
4. /auth/google/start API 추가
5. /auth/google/callback API 추가
6. 로그인 화면에 Google 로그인 버튼 연결
7. Preview 테스트
8. Production 반영
```
