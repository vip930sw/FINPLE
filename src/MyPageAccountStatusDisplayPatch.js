/* =========================================================
   Step 112-7B - Restore MY PAGE My Account stable display
   - 이전 안정 화면 기준으로 MY ACCOUNT 표시를 복구합니다.
   - document-wide MutationObserver를 사용하지 않습니다.
   - /mypage Account Status 패널만 제한적으로 보정합니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const PATCH_FLAG =