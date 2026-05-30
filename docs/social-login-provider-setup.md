# FINPLE Social Login Provider Setup

_Last updated: 2026-05-30_

This document records current external provider settings for Google, Naver, Kakao, and Resend. Do not commit actual secret values.

## 1. Common callback base

Production frontend:

```text
https://finple.co.kr
https://www.finple.co.kr
```

Production backend:

```text
https://finple-api.onrender.com/api
```

## 2. Google OAuth

Status:

```text
Connected and active
```

Google Cloud Console OAuth client:

```text
Application type: Web application
Name: FINPLE Production Web
Authorized JavaScript origins:
- https://finple.co.kr
- https://www.finple.co.kr

Authorized redirect URI:
- https://finple-api.onrender.com/api/auth/google/callback
```

Backend environment variables are managed on Render. Do not commit values.

Expected route:

```text
GET /api/auth/google/start
GET /api/auth/google/callback
```

## 3. Naver OAuth

Status:

```text
Code connected
Naver Developers review requested
Keep frontend button in review/pending mode until approval
```

Naver Developers application:

```text
Service URL:
https://finple.co.kr

Callback URL:
https://finple-api.onrender.com/api/auth/naver/callback

Requested profile fields:
- Email: required
- Name: optional/additional
```

Render environment variables:

```text
NAVER_CLIENT_ID=<secret>
NAVER_CLIENT_SECRET=<secret>
NAVER_OAUTH_REDIRECT_URI=https://finple-api.onrender.com/api/auth/naver/callback
```

Expected route after review approval:

```text
GET /api/auth/naver/start
GET /api/auth/naver/callback
```

Until approval, frontend button should not send general users to Naver OAuth. It should show a message such as:

```text
네이버 로그인은 현재 검수 중입니다. 검수 완료 후 다시 활성화하겠습니다.
```

## 4. Kakao OAuth

Status:

```text
Code connected and merged
Requires final end-to-end verification
Kakao email permission / Biz App state may still block final user profile step
```

Kakao Developers settings:

```text
Kakao Login: ON
OpenID Connect: ON

Web platform site domains:
- https://finple.co.kr
- https://www.finple.co.kr

Kakao login redirect URI:
- https://finple-api.onrender.com/api/auth/kakao/callback
```

Render environment variables:

```text
KAKAO_REST_API_KEY=<secret>
KAKAO_OAUTH_REDIRECT_URI=https://finple-api.onrender.com/api/auth/kakao/callback
KAKAO_CLIENT_SECRET=<secret if enabled in Kakao Developers>
```

Kakao consent item policy:

```text
Kakao account email: required or otherwise available through consent
Nickname: optional
Profile image: not required
Phone, gender, age range, birthday: do not collect
```

The current backend expects email from Kakao account. If email is not provided, login fails with an email permission error. If Kakao email permission is not available, Biz App registration may be required.

Expected route:

```text
GET /api/auth/kakao/start
GET /api/auth/kakao/callback
```

Quick test:

```text
https://finple-api.onrender.com/api/auth/kakao/start
```

Expected behavior: redirect to Kakao login/consent screen. If it returns `Cannot GET`, backend route is not deployed.

## 5. Resend email verification

Status:

```text
Domain verified
Email verification flow active
```

Recommended sender:

```text
FINPLE <no-reply@finple.co.kr>
```

Render environment variables:

```text
RESEND_API_KEY=<secret>
FINPLE_APP_BASE_URL=https://finple.co.kr
FINPLE_EMAIL_FROM=FINPLE <no-reply@finple.co.kr>
```

Expected verification route:

```text
https://finple.co.kr/verify-email?token=...
```

## 6. Post-merge deployment checklist

After auth-related PR merge:

1. Confirm Vercel production deployment points to latest `main` commit.
2. If backend code changed, redeploy Render backend.
3. Test `/api/health`.
4. Test `/login` page.
5. Test active provider button.
6. Confirm redirect returns to `/login#finpleOAuth=...`.
7. Confirm MY PAGE opens.
8. Confirm header changes from `로그인` to `로그오프`.

## 7. Security notes

Never commit:

```text
GOOGLE_CLIENT_SECRET
NAVER_CLIENT_SECRET
KAKAO_CLIENT_SECRET
KAKAO_REST_API_KEY
RESEND_API_KEY
DATABASE_URL
FINPLE_ADMIN_TOKEN
```

Only public frontend environment variables should use `VITE_`, and no secret key should be placed in `VITE_` variables.
