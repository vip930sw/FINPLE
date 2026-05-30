# FINPLE Auth / Social Login Handoff

_Last updated: 2026-05-30_

This document records the current FINPLE authentication, MY PAGE, admin inquiry, and social login implementation state so the next development session can continue without losing context.

## 1. Current status

Completed or merged work:

- Email/password signup and login.
- Email verification using Resend.
- Google OAuth login.
- Naver OAuth backend/client code connection.
- Naver Developers review request submitted; Naver button should remain in review/pending state until approval.
- Kakao OAuth backend/client code connection.
- MY PAGE login guard.
- Admin inquiry page separated from MY PAGE.
- Simplified login page UI.
- Home-only center navigation: `소개 / 인덱스 / 요금제`.
- Vercel production deployment and Render redeploy performed after the Kakao OAuth merge.

## 2. Deployment rule

Use this order for future changes:

1. Create a Git branch.
2. Open a PR.
3. Check Vercel Preview.
4. Merge to `main`.
5. Confirm Vercel Production deployment.
6. If backend changed, redeploy Render backend.

Important distinction:

- Vercel Promote: temporarily promotes a Preview deployment to production.
- GitHub Merge: permanently applies code to `main`.
- Render Redeploy: deploys the backend code and environment variables.

Avoid relying on Vercel Promote alone. If the branch is not merged to `main`, later production deployments can overwrite the promoted preview.

## 3. Main routes

Frontend route list:

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

Backend auth route list:

```text
/auth/signup
/auth/login
/auth/logout
/auth/me
/auth/verify-email
/auth/resend-verification
/auth/google/start
/auth/google/callback
/auth/naver/start
/auth/naver/callback
/auth/kakao/start
/auth/kakao/callback
```

## 4. Header behavior

The center navigation should show only on the home route `/`:

```text
소개 / 인덱스 / 요금제
```

On `/login`, `/signup`, `/mypage`, `/pricing`, `/support`, `/updates`, `/privacy`, `/terms`, `/disclaimer`, the center navigation should be hidden.

Right-side header auth display:

- Not logged in: `로그인`
- Normal user logged in: `로그오프`
- Admin token exists and no normal user login: `관리자`

## 5. MY PAGE behavior

- Unauthenticated `/mypage` access must show the login page.
- Logout must clear FINPLE auth session and stored user data.
- MY PAGE side menu clicks should not cause hash section scrolling.
- The scroll restoration policy should remain limited to:
  - `requestAnimationFrame`
  - `setTimeout 0ms`
  - `setTimeout 80ms`

## 6. Admin inquiries

Admin routing:

```text
/admin              -> Admin login page
/admin/inquiries    -> Inquiry management page
```

The inquiry management page is separated from MY PAGE.

## 7. Login page UI

The simplified login card is used.

Main login headline:

```jsx
로그인 하고 나만의 자산관리를 <br /> 시작해보세요
```

Social button order:

```text
Kakao / Naver / Google
```

Current state:

- Google: active.
- Naver: backend/client code exists, but button should stay in `review pending` mode until Naver approves the app.
- Kakao: active code is connected, but final behavior depends on Kakao email permission / Biz App state.

## 8. Email verification

Resend is used for email verification.

Expected flow:

1. User signs up.
2. Verification email is sent.
3. Signup completion is held until verification.
4. User clicks `/verify-email?token=...`.
5. Verified user can log in and use MY PAGE / server save.

Resend domain status:

- `finple.co.kr` was verified in Resend.
- Recommended sender:

```text
FINPLE <no-reply@finple.co.kr>
```

## 9. Social login account mapping

All social logins use the same table:

```text
oauth_accounts
```

Provider values:

```text
google
naver
kakao
```

Core fields:

```text
provider
provider_user_id
email
profile
last_login_at
```

The social login repositories attempt to connect an existing FINPLE account by email first, then create a new user if no matching email exists.

## 10. Important source files

Frontend:

```text
src/App.jsx
src/components/SiteHeader.jsx
src/components/AuthPages.jsx
src/components/authClientService.js
src/components/LoginPageFinalPolish.css
src/components/AccountPages.jsx
src/components/AdminInquiriesPage.jsx
```

Backend:

```text
server/src/routes/authRoutes.js
server/src/db/authRepository.js
server/src/db/googleOAuthRepository.js
server/src/db/naverOAuthRepository.js
server/src/db/kakaoOAuthRepository.js
```

DB-related tables:

```text
users
user_sessions
auth_email_tokens
oauth_accounts
user_entitlements
plan_entitlements
```

## 11. Remaining priorities

1. Confirm Kakao login end-to-end.
2. Confirm Kakao email permission / Biz App setup.
3. Wait for Naver review result.
4. After Naver approval, reactivate Naver button to start actual OAuth.
5. Polish login success/failure messages.
6. Stabilize login-to-MY PAGE transition timing and copy.

## 12. Next-session starter

Use this as the first message in the next development session:

```text
Continue FINPLE project.
Current state:
- Email signup/verification completed.
- Google login completed.
- Naver login code is connected and Naver review request is pending.
- Kakao OAuth code is connected and deployed.
- MY PAGE login guard, admin inquiry route split, and login UI polish are completed.
- Header center nav appears only on home.

Next tasks:
1. Verify Kakao login end-to-end.
2. Confirm Kakao email permission / Biz App settings.
3. Re-enable Naver OAuth after Naver review approval.
4. Stabilize login/signup UX.
```
