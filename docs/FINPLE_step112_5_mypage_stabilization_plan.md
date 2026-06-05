# FINPLE Step 112-5C — MY PAGE stabilization / integration plan

## 1. Backup point

Before stabilization work, the following rollback point was created.

- Backup branch: `backup/step112-5-before-mypage-stabilization`
- Base commit: `57e4410addeac0ef621914f8e7fc443179ab7ebb`
- Base commit message: `Step 112-4: Shorten payment method security copy`

## 2. Current symptom

When entering or refreshing `/mypage`, the user can briefly see the older MY PAGE layout before the final sidebar/menu/cards are applied.

This happens because the current page is built in two stages:

1. `AccountPages.jsx` renders the older base MY PAGE.
2. Multiple `MyPage...Patch.js` files modify the rendered DOM after a short delay.

## 3. Stabilization already applied

### Step 112-5A

Added `MyPageRenderStabilizationPatch.js`.

Purpose:
- Hide `/mypage` while patch-based final layout is being prepared.
- Reveal the page after the final sidebar, billing merge, payment history panel, and pagination controls are detected.

### Step 112-5B

Strengthened the guard at the `html` booting stage.

Purpose:
- Reduce the chance that the old MY PAGE screen appears before the body-level stabilization class is applied.

## 4. Active MY PAGE patch files

The current MY PAGE is composed by the base React page plus the following patches.

| File | Role | Future action |
| --- | --- | --- |
| `MyPageSidebarPatch.js` | Sidebar menu, single-panel navigation, investment profile, payment method, inquiry panel | Integrate into `AccountPages.jsx` first |
| `MyPagePaymentHistoryPatch.js` | Payment history panel and menu insertion | Integrate after sidebar shell is stable |
| `MyPageMenuFinalOrderPatch.js` | Final menu order and naming | Replace with static React menu config |
| `MyPageBillingPlanMergePatch.js` | Merge subscription + plan usage panels | Integrate into billing/plan React component |
| `MyPageHistoryPaginationPatch.js` | Inquiry/payment list open-close and pagination | Convert to React state in the relevant panels |
| `MyPageInquiryActionsPatch.css` | Inquiry action button polish | Merge into permanent MY PAGE CSS |
| `MyPagePaymentHistoryPatch.css` | Payment history card style | Merge into permanent MY PAGE CSS |
| `MyPageBillingPlanMergePatch.css` | Billing/plan merged panel style | Merge into permanent MY PAGE CSS |
| `MyPageHistoryPaginationPatch.css` | History pagination style | Merge into permanent MY PAGE CSS |
| `MyPageRenderStabilizationPatch.js` | Short-term flicker guard | Remove after full React integration |

## 5. Recommended integration order

### Step 112-5D — React shell integration

Move the final sidebar layout into `AccountPages.jsx`.

Target final menu:

1. 내 계정
2. 내 투자성향
3. 내 구독/플랜
4. 내 결제수단
5. 내 결제내역
6. 내 문의내역
7. 내 저장내역

Expected result:
- Sidebar no longer needs to be inserted after render.
- Menu order/naming no longer depends on DOM patches.

### Step 112-5E — Billing/plan component integration

Move the merged billing/plan view into a proper React component.

Target structure:

- Row 1: 현재 플랜 / 다음 결제일 / 이용 종료 예정일
- Row 2: 포트폴리오 / 현재 자산 / 서버 저장
- Personal badge and usage message inside the billing/plan panel

Expected result:
- `MyPageBillingPlanMergePatch.js` can be removed.

### Step 112-5F — Payment/inquiry panels integration

Move payment method, payment history, and inquiry history panels into React components.

Expected result:
- `MyPagePaymentHistoryPatch.js` and related pagination DOM patch can be removed.

### Step 112-5G — CSS consolidation and patch removal

Merge final MY PAGE styles into a permanent CSS file and remove no-longer-needed patch imports from `main.jsx`.

Expected result:
- MY PAGE loads directly in its final state.
- `MyPageRenderStabilizationPatch.js` becomes unnecessary.

## 6. Validation checklist

After each integration step, verify:

- `/mypage` direct entry
- `/mypage` refresh with F5
- Menu order and active state
- 내 구독/플랜 merged 2-row grid
- 내 결제수단 card label/security copy
- 내 결제내역 list open/close and pagination
- 내 문의내역 list open/close and pagination
- 새 문의 작성 button alignment
- Footer spacing
- Mobile breakpoint under 560px

## 7. Risk note

The stabilization guard is safe as a short-term measure, but it is not the final architecture. The final target is to render the complete MY PAGE directly from React state and remove DOM post-processing patches.
