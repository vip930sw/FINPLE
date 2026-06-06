/* =========================================================
   Step 111-9G - MY PAGE Account Status safe display patch
   - document-wide MutationObserver를 사용하지 않습니다.
   - /mypage Account Status 영역만 제한적으로 보정합니다.
   - 같은 내용이면 다시 렌더링하지 않아 반복 갱신/렉을 방지합니다.
========================================================= */

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const MY_PAGE_LABEL_STYLE_ID = "finple-mypage-mini-label-blue-style";
