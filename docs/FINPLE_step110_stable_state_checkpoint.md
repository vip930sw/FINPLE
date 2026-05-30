# FINPLE Step 110-1 Stable State Checkpoint

This document records the current stable checkpoint before the next simulator, logout-data, and MBTI mapping work.

## 1. Stable reference commit

Current stable commit:

```text
be8f015e4cb5bf546667f9c954cddc482185c0f8
Step 109-19L: Restore aa89 detail analysis structure safely
```

A GitHub branch has also been created from this commit for reference:

```text
stable-detail-snapshot
```

Use this commit as the first rollback/reference point if future Step 3 detail analysis changes break the simulator.

## 2. Restored Step 3 detail analysis scope

The stable Step 3 `/simulator` detail panel includes the following restored sections:

```text
Executive Summary / 핵심 요약
Portfolio profile summary / 포트폴리오 성격 요약
Asset role breakdown / 자산 역할 비중
Metric Guide / 주요 지표 설명
Question-mark metric help markers
Risk Check / 리스크 진단
Suggestions / 개선 제안
Analysis Conditions / 분석 조건
Detailed Metrics / 상세 지표
Assets / 자산 구성
Annual Performance / 연차별 예상 성과
Growth Chart
Detail asset table
Blank prevention safeguards
```

## 3. Incident summary

The Step 3 blank issue was not primarily a route-design problem. The issue was caused by broken internal props/data flow inside the existing detail panel and by restoring from a commit that was too late in the history.

Main causes identified:

```text
1. DetailAssetTable did not receive all required props such as totalAssetValue / formatDecimal.
2. PerformanceChart received an incompatible prop name instead of rows.
3. A temporary reconstruction restored a later simplified detail layout rather than the older full detail-analysis structure.
4. The `/simulator/detail` route temporarily worked as a diagnostic route, but it was not the safest long-term solution because it separated CSS, layout, footer, navigation, and simulator state flow.
```

Final recovery direction:

```text
1. Return to the existing `/simulator` Step 3 flow.
2. Use the older aa89 detail-analysis structure as the reference.
3. Restore the original section hierarchy.
4. Add defensive guards for undefined values to prevent blank screens.
```

## 4. Safety principles for future changes

Future simulator and MBTI-related work must follow these rules:

```text
1. Do not replace a broken existing screen with a newly reconstructed screen unless there is no other safe option.
2. Find the last known-good commit before rebuilding UI or logic.
3. Restore from the known-good structure and apply minimal fixes.
4. Avoid new route bypasses unless they are explicitly temporary diagnostics.
5. Do not automatically delete user portfolio, MBTI, or simulator data from localStorage.
6. Prefer separating hidden / logged-out / guest data views over destructive deletion.
7. Make one functional change per PR whenever possible.
8. Confirm `/simulator` Step 1, Step 2, and Step 3 after every simulator change.
```

## 5. Local data handling principle

FINPLE contains user-created financial inputs and portfolio states. Treat those values as user data.

Preferred policy:

```text
Logged-in user data:
- Do not delete automatically on logout.
- Hide it from logged-out views.
- Restore it only after the same user logs back in.

Logged-out / guest view:
- Show only the guest preset portfolio.
- Keep guest temporary edits separate from authenticated user data.

Manual reset:
- Allow only through explicit user action.
- Display clear confirmation before clearing data.
```

## 6. Next planned work after this checkpoint

### Step 110-2. Logout data separation

Goal:

```text
When a Personal user logs out, the logged-out simulator should show the guest preset portfolio rather than retaining the authenticated user's personal asset composition on screen.
```

Important note:

```text
This should be a display/session separation fix, not an automatic data deletion fix.
```

Likely files to inspect first:

```text
src/AuthPortfolioDataGuard.js
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/PortfolioSimulator.jsx
src/components/authClientService.js
```

### Step 110-3. MBTI 16-type mapping audit

Goal:

```text
Compare the MBTI result screen allocation with the actual simulator-applied asset allocation for all 16 types.
```

Audit table format:

```text
Type name | Result-screen allocation | Simulator-applied allocation | Connected assets | Mismatch | Required fix
```

### Step 110-4. MBTI button copy update

Planned text changes:

```text
미국 포트폴리오에 반영
→ 미국 주식으로 포트폴리오 반영

한국 포트폴리오 Beta로 이동
→ 한국 주식으로 포트폴리오 반영
```

### Step 110-5. Korea MBTI portfolio mapping

Goal:

```text
Build a separate Korean stock / ETF allocation set instead of reusing the US allocation by name only.
```

## 7. Required regression checks after simulator changes

Check the following every time simulator or MBTI application logic changes:

```text
1. `/simulator` loads without blank screen.
2. Step 1 is accessible.
3. Step 2 is accessible.
4. Step 3 is accessible.
5. Executive Summary is visible.
6. Metric Guide and question-mark help are visible.
7. Growth Chart is visible.
8. Detail asset table is visible.
9. Annual Performance table is visible.
10. Menu bar and footer remain intact.
11. Logged-out state does not expose a logged-in user's previous Personal portfolio.
12. MBTI-applied allocations match the result screen.
```
