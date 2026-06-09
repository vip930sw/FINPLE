# FINPLE login to start route loader

## Purpose

When a logged-out user enters `/start`, FINPLE redirects the user to `/login`.
After login succeeds, that user should return to `/start` and see the same full-screen route loading spinner used by the existing MY PAGE transition flow.

## Shared loader

- Implementation: `src/MyPageRenderStabilizationPatch.js`
- Message source: `src/loadingMessages.js`
- Visual style: full-screen light overlay with the blue 12-bar spinner and rotating FINPLE loading messages
- Default duration: `2200ms`

The route loader intentionally reuses the MY PAGE loader implementation so that `/login -> /start` and `/login -> /mypage` transitions keep the same spinner shape, timing, and copy.

## Public trigger

Use the generic route trigger for non-MY PAGE route transitions:

```js
window.__finpleShowRouteTransitionLoader?.(2200);
window.dispatchEvent(new Event("finple-route-transition-start"));
```

The MY PAGE-specific trigger remains available for MY PAGE transitions:

```js
window.__finpleShowMyPageLoader?.(2200);
window.dispatchEvent(new Event("finple-mypage-transition-start"));
```

## Current login flow

- Direct login menu access: `/login` -> login success -> `/mypage`
- Logged-out start access: `/start` -> `/login` -> login success -> loader -> `/start`
- Logged-in start access: `/start`

`src/App.jsx` stores the pending start intent in `sessionStorage` with `finple-post-login-redirect-page`.
`src/components/AuthPages.jsx` consumes that value after email or social login and triggers the generic route loader before navigating to `/start`.
