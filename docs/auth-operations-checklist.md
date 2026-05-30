# FINPLE Auth Operations Checklist

_Last updated: 2026-05-30_

Use this checklist after changes to login, signup, MY PAGE, admin, or social OAuth.

## 1. Frontend smoke test

Routes to open:

```text
/
/login
/signup
/verify-email
/mypage
/pricing
/support
/updates
/privacy
/terms
/disclaimer
/admin
/admin/inquiries
/start
```

Check:

- Home opens.
- Login card appears.
- Header and footer appear on all expected routes.
- `소개 / 인덱스 / 요금제` appears only on `/`.
- Login page social buttons order is Kakao / Naver / Google.
- Login headline has the intended line break.

## 2. Email signup and verification

Flow:

1. Open `/signup`.
2. Enter name, nickname/ID, email, password.
3. Run email availability check.
4. Submit signup.
5. Confirm email verification notice is shown.
6. Open verification email.
7. Click verification link.
8. Confirm `/verify-email` shows success.
9. Return to `/login` and log in.
10. Confirm MY PAGE opens.

Expected:

- Unverified users cannot use MY PAGE/server save.
- Verified users can log in.
- Header changes to `로그오프`.

## 3. Google login

Flow:

1. Open `/login`.
2. Click Google icon.
3. Complete Google login.
4. Confirm redirect to FINPLE.
5. Confirm MY PAGE opens.

Expected:

```text
/login#finpleOAuth=...
```

is consumed by the frontend and then cleared back to `/login` or navigated to MY PAGE.

## 4. Naver login review state

Until Naver approves the application:

- Naver button should not redirect general users to Naver OAuth.
- It should show review/pending message.

After Naver approval:

1. Re-enable `startNaverOAuthLogin()` on the Naver button.
2. Redeploy frontend.
3. Test `/api/auth/naver/start`.
4. Test full login flow.

## 5. Kakao login

Preconditions:

- Kakao Login: ON.
- Kakao redirect URI registered.
- Render has Kakao environment variables.
- Backend is redeployed after merge.
- Kakao email permission is available.

Test route:

```text
https://finple-api.onrender.com/api/auth/kakao/start
```

Expected:

- Redirects to Kakao login/consent.
- Does not return `Cannot GET`.

Full flow:

1. Open `/login`.
2. Click Kakao icon.
3. Complete Kakao login.
4. Confirm FINPLE redirect.
5. Confirm MY PAGE opens.
6. Confirm header shows `로그오프`.

If failing at user information step, check Kakao account email permission / Biz App status.

## 6. MY PAGE guard

Unauthenticated test:

1. Clear local storage.
2. Open `/mypage`.
3. Confirm login page appears.

Authenticated test:

1. Log in.
2. Open `/mypage`.
3. Confirm MY PAGE appears.
4. Click side menu items.
5. Confirm no disruptive hash scrolling.

Logout test:

1. Click `로그오프`.
2. Confirm local session/user data cleared.
3. Open `/mypage`.
4. Confirm login page appears.

## 7. Admin inquiries

Admin route:

```text
/admin
/admin/inquiries
```

Check:

- `/admin` shows admin login.
- Admin token enables admin mode.
- `/admin/inquiries` shows inquiry management.
- Normal MY PAGE remains separate from admin inquiries.
- Header shows `관리자` when admin token exists and normal user is not logged in.

## 8. Backend health and auth route check

Open:

```text
https://finple-api.onrender.com/api/health
```

Expected:

- JSON response.
- `ok: true` or equivalent healthy status.

Social auth start routes:

```text
https://finple-api.onrender.com/api/auth/google/start
https://finple-api.onrender.com/api/auth/naver/start
https://finple-api.onrender.com/api/auth/kakao/start
```

Provider-specific expectations:

- Google: active redirect.
- Naver: route may exist, but frontend should be pending until approval.
- Kakao: active redirect after deployment.

## 9. Environment variables to check on Render

```text
RESEND_API_KEY
FINPLE_APP_BASE_URL
FINPLE_EMAIL_FROM
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
NAVER_CLIENT_ID
NAVER_CLIENT_SECRET
NAVER_OAUTH_REDIRECT_URI
KAKAO_REST_API_KEY
KAKAO_OAUTH_REDIRECT_URI
KAKAO_CLIENT_SECRET
DATABASE_URL
DATABASE_SSL
FINPLE_ADMIN_TOKEN
CORS_ORIGIN
```

## 10. Environment variables to check on Vercel

```text
VITE_FINPLE_API_BASE_URL=https://finple-api.onrender.com/api
```

Do not put secrets in `VITE_` variables.

## 11. Rollback note

If social login breaks after deployment:

1. Confirm GitHub main commit.
2. Confirm Vercel production deployment commit.
3. Confirm Render latest deployment.
4. Check provider redirect URI exact match.
5. Disable only the broken provider button if needed.
6. Keep email/password login available.
