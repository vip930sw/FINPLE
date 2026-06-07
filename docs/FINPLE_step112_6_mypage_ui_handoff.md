# FINPLE Step 112-6 — MY PAGE UI / CSS handoff

작성일: 2026-06-07

이 문서는 `/mypage` 7개 메뉴 UI 정리, Google OAuth `/mypage` blank 대응, 투자 MBTI 결과 표시 보강, 안내 박스 서식 통일 작업 이후의 인수인계 문서입니다.

목표는 다음 작업자가 새 채팅에서 이어받을 때 메뉴별/라우터별로 서식이 다시 달라지지 않도록 기준을 명확히 하는 것입니다.

---

## 1. 현재 MY PAGE 구조

현재 `/mypage`는 완전한 단일 React 컴포넌트 구조가 아니라, 기본 `AccountPages.jsx` 렌더 후 여러 patch 파일이 DOM을 보정하는 구조입니다.

핵심 파일:

| 파일 | 역할 |
| --- | --- |
| `src/components/AccountPages.jsx` | 기본 MY PAGE, account/server storage 등 기존 React 렌더 |
| `src/MyPageRenderStabilizationPatch.js` | `/mypage` 진입/새로고침 시 blank/flicker 방지 |
| `src/MyPageShellBridgePatch.js` | MY PAGE shell 안정화 |
| `src/MyPageSidebarPatch.js` | 7개 메뉴 사이드바, 투자성향/결제수단/문의내역 패널 DOM 생성 |
| `src/MyPageAccountStatusDisplayPatch.js` | 내 계정 패널 표시/요금제 뱃지/이메일 안내 박스 보정 |
| `src/MyPageBillingPlanMergePatch.js` | 구독/플랜 패널 병합 및 사용량 안내 박스 이동 |
| `src/MyPagePaymentHistoryPatch.js` | 결제내역 패널 생성 |
| `src/MyPageHistoryPaginationPatch.js` | 결제내역/문의내역 접기 및 페이지 처리 |
| `src/MyPageInvestmentProfileDisplayPatch.js` | 투자성향 상세 자산명/섹터 표시 보정 |

주의:

- `main.jsx`의 import 순서가 실제 CSS/DOM 보정 결과에 영향을 줍니다.
- MY PAGE 관련 CSS는 `App.css` 이후 `MyPage...css`들이 추가로 덮습니다.
- 서식 문제를 볼 때는 JSX만 보지 말고 최종 import 순서와 patch DOM 삽입 순서를 함께 확인해야 합니다.

---

## 2. 최종 MY PAGE 메뉴 기준

사이드바 메뉴는 아래 순서와 명칭을 기준으로 유지합니다.

| 순서 | 메뉴 | 보조 문구 | 주요 패널 |
| --- | --- | --- | --- |
| 1 | 내 계정 | 로그인·사용자 | `.accountStatusPanel` |
| 2 | 내 투자성향 | 투자 MBTI | `[data-investment-profile-panel]` |
| 3 | 내 구독/플랜 | 구독·요금제 | `[data-subscription-status-panel]` |
| 4 | 내 결제수단 | 자동결제 등록 | `[data-payment-method-panel]` |
| 5 | 내 결제내역 | 영수증·이력 | `[data-payment-history-panel]` |
| 6 | 내 문의내역 | 접수·처리 현황 | `[data-my-inquiries-panel]` |
| 7 | 내 저장내역 | 저장·불러오기 | `.serverStoragePanel` |

새 메뉴를 추가하거나 기존 메뉴를 바꿀 때는 `MyPageSidebarPatch.js`의 `MENU_ITEMS`와 관련 패널 selector를 같이 갱신해야 합니다.

---

## 3. 파란 안내 박스 서식 기준

7개 메뉴의 파란 안내 박스는 메뉴별로 다르게 보이면 안 됩니다.

기준 값:

| 항목 | 기준 |
| --- | --- |
| 글씨 크기 | `13px` |
| 글씨 색상 | `#334155` |
| 글씨 굵기 | 시각 기준 2/4/5/6/7번 공통 박스와 동일 |
| padding | `10px 12px` |
| border | `1px solid #bfdbfe` |
| border-radius | `14px` |
| background | `#eff6ff` |
| box-shadow | 없음 |
| gradient | 사용 금지 |
| line-height | 메뉴별로 별도 지정하지 않음 |

현재 7개 안내 박스 매핑:

| 번호 | 메뉴 | 문구 | 주요 class |
| --- | --- | --- | --- |
| 1 | 내 계정 | `회원 식별, 로그인 계정 확인...` | `.accountStatusPurposeBox` |
| 2 | 내 투자성향 | `최근 투자 MBTI 결과...` | `.serverStorageMessage.compact.paymentMethodEntryMessage` |
| 3 | 내 구독/플랜 | `Free 플랜은 체험판입니다...` | `.billingMergedUsageMessage.upgradePromptBox` |
| 4 | 내 결제수단 | `자동결제를 이용하려면...` | `.serverStorageMessage.compact.paymentMethodEntryMessage` |
| 5 | 내 결제내역 | `아직 결제내역이 없습니다...` | `.serverStorageMessage.compact.paymentMethodEntryMessage` |
| 6 | 내 문의내역 | `아직 접수된 문의내역이 없습니다...` | `.serverStorageMessage.compact.paymentMethodEntryMessage` |
| 7 | 내 저장내역 | `Free 체험 플랜은...` | `.serverStorageMessage.compact` |

중요한 재발 방지 기준:

- 3번은 원래 `.upgradePromptBox`에서 `gradient`, `18px border-radius`, `box-shadow`를 받기 쉬우므로 반드시 공통 안내 박스 스타일로 덮어야 합니다.
- 1번은 별도 `.accountStatusPurposeBox`를 쓰므로 공통 박스와 시각 기준을 맞춰야 합니다.
- 2/4/5/6/7번은 `.serverStorageMessage.compact`를 기준으로 삼습니다.
- `font-weight`, `line-height`, `background`, `border-radius`, `box-shadow`를 메뉴별로 임의 추가하지 않습니다.

현재 관련 CSS:

| 파일 | 확인할 selector |
| --- | --- |
| `src/App.css` | `.serverStorageMessage`, `.serverStorageMessage.compact`, `.upgradePromptBox` |
| `src/MyPageAccountStatusDisplay.css` | `.accountStatusPurposeBox` |
| `src/MyPageBillingPlanMergePatch.css` | `.billingMergedUsageMessage.upgradePromptBox`, `.billingMergedUsageMessage.upgradePromptBox p` |
| `src/MyPageSidebar.css` | `.paymentMethodEntryMessage` |

---

## 4. 내 계정 패널 정리 사항

완료된 내용:

- 현재 플랜/요금제 표기를 `PERSONAL`, `FREE`가 아니라 `Personal`, `Free`로 표시.
- `이메일 활용 목적` 라벨 제거.
- 이메일 사용 목적 문구를 파란 안내 박스에 표시.
- 우측 상단 요금제 뱃지를 추가.
- 뱃지는 다른 MY PAGE 카드와 같은 우측 상단 정렬 기준을 따라야 합니다.

주의:

- 뱃지는 카드 하단으로 내려가면 안 됩니다.
- `현재 플랜/요금제` 카드 우측 끝선과 시각적으로 맞는 위치를 유지합니다.
- 관련 파일은 `MyPageAccountStatusDisplayPatch.js`, `MyPageAccountStatusDisplay.css`입니다.

---

## 5. 내 구독/플랜 패널 정리 사항

완료된 내용:

- `Free는 체험판입니다` 문구를 본문과 합쳐 `Free 플랜은 체험판입니다. Personal 플랜부터...`로 정리.
- 파란 박스 안의 `요금제 보기` 버튼 제거.
- 하단 `요금제 변경`, `결제 문의` 버튼 유지.
- Free/Personal 뱃지 위치는 다른 MY PAGE 메뉴와 같은 우측 상단 기준.
- 안내 박스는 `.upgradePromptBox` 기반이라도 최종적으로 공통 안내 박스 스타일을 따라야 합니다.

주의:

- `.upgradePromptBox` 원래 스타일이 다시 살아나면 3번 박스만 둥글고 그라데이션/그림자가 생깁니다.
- 이 문제는 `MyPageBillingPlanMergePatch.css`에서 강하게 override해야 합니다.

---

## 6. 내 투자성향 패널 정리 사항

완료된 내용:

- `결과 자세히 보기` 클릭 시 상세 결과가 버튼 아래에 펼쳐지도록 DOM 순서 변경.
- `투자 MBTI / 투자성향 / 위험성향` 3개 카드의 하단 보조 문구 제거.
- `FINPLE 유형` 라벨을 `투자성향`으로 변경.
- 상세 결과에서 내부 키가 보이지 않도록 자산명을 한글로 보정.
  - `longBond`, `longbond` -> `장기국채`
  - `crypto`, `코인` -> `블록체인 테마`
  - `bond`, `채권` -> `종합채권`
- 관심 섹터가 저장되어 있지 않은 기존 결과도 프리셋 비중 기준으로 자동 추론.
- 성향 차트 표시 추가.
- 저장된 `axisScores`가 있으면 실제 점수를 표시.
- 기존 저장값처럼 점수가 없으면 방향값 기반 보정 점수를 표시.

투자 MBTI 저장 로직:

- `/mbti` 검사를 완료하는 것만으로는 `/mypage` 저장값이 갱신되지 않습니다.
- 결과 화면에서 `미국자산으로 반영` 또는 `한국자산으로 반영` 버튼을 눌러야 저장됩니다.
- 이때 `localStorage`의 `finple-mbti-simulator-preset`이 갱신됩니다.
- 새 저장값에는 `axes`, `axisScores`, `riskScore`, `sectors`, `createdAt`이 함께 저장됩니다.

관련 파일:

| 파일 | 역할 |
| --- | --- |
| `src/components/InvestmentMbtiPage.jsx` | 검사 결과 계산, portfolio 반영, MBTI preset 저장 |
| `src/MyPageSidebarPatch.js` | 투자성향 패널 HTML, 상세 결과, 성향 차트 표시 |
| `src/MyPageInvestmentProfileDisplayPatch.js` | 자산명/섹터 후처리 보정 |
| `src/MyPageSidebar.css` | 투자성향 상세 및 성향 차트 스타일 |

---

## 7. Google OAuth `/mypage` blank 대응

완료된 내용:

- Google 로그인 후 `/mypage` 진입 시 blank가 나타나는 문제에 대해 stabilization/failsafe 패치를 추가했습니다.
- 네이버/카카오 대비 Google OAuth 콜백 후 렌더 타이밍이 달라 `/mypage` 패치 적용 전 빈 화면처럼 보일 수 있었습니다.

관련 커밋:

- `432a666 Fix Google OAuth mypage blank transition`
- `0da599b Add mypage OAuth blank failsafe`

주의:

- `/mypage` blank 문제가 다시 발생하면 먼저 `MyPageRenderStabilizationPatch.js`, `MyPageShellBridgePatch.js`, OAuth callback 이후 navigation timing을 확인합니다.
- refresh하면 정상인데 최초 진입만 blank라면 DOM patch 준비 타이밍 문제일 가능성이 큽니다.

---

## 8. 최근 반영 커밋 요약

주요 커밋:

```text
585b360 Match mypage notice box styling
8e66eec Test inherited mypage notice weight
ac04270 Normalize mypage notice line height
0aad2a2 Show fallback MBTI axis scores
8b5f1ea Fallback mypage MBTI axis chart labels
e86183a Enhance mypage investment profile details
6f8a166 Polish mypage investment profile details
95c4a8c Unify mypage notice typography
fe51d8a Unify mypage notice boxes and badge alignment
46e977f Align mypage billing text and badge spacing
d9811e2 Simplify free billing plan notice
0da6d0f Align mypage account plan badge
1a6d6df Polish mypage account purpose and badge
bd7a6d9 Format mypage account plan label
432a666 Fix Google OAuth mypage blank transition
0da599b Add mypage OAuth blank failsafe
```

---

## 9. 검증 기준

작업 후 기본 검증:

```bash
npm run build
```

MY PAGE UI 확인:

1. `/mypage` 직접 진입
2. `/mypage` 새로고침
3. Google 로그인 후 `/mypage` 최초 진입
4. 사이드바 7개 메뉴 클릭
5. 각 메뉴의 파란 안내 박스 서식 비교
6. 내 계정 요금제 뱃지 우측 상단 위치
7. 내 구독/플랜 Free/Personal 상태
8. 내 투자성향 `결과 자세히 보기`
9. 투자성향 상세의 자산명, 관심 섹터, 성향 차트

안내 박스 QA:

- 1/3번만 두껍거나 작게 보이지 않는지 확인.
- 3번에 gradient, shadow, 과한 radius가 살아나지 않았는지 확인.
- 7개 메뉴 모두 `13px`, `#334155`, `10px 12px`, `14px radius` 기준인지 확인.

---

## 10. 다음 권장 작업

현재 patch 기반 구조는 계속 유지보수 비용이 생깁니다. 다음 큰 작업에서는 아래 순서를 권장합니다.

1. `MyPageSidebarPatch.js`의 7개 메뉴 구조를 `AccountPages.jsx` 또는 별도 React 컴포넌트로 이전.
2. `MyPageBillingPlanMergePatch.js`의 병합 로직을 React 상태 기반 컴포넌트로 이전.
3. `MyPagePaymentHistoryPatch.js`, `MyPageHistoryPaginationPatch.js`를 React 리스트/페이지 상태로 이전.
4. MY PAGE 전용 CSS를 하나의 permanent CSS 파일로 통합.
5. `MyPageRenderStabilizationPatch.js`를 제거할 수 있을 만큼 초기 렌더부터 최종 레이아웃을 직접 출력.

---

## 11. 새 채팅 / 프로젝트 소스에 저장하면 좋은 내용

새 Codex/ChatGPT 프로젝트 소스에는 아래 내용을 저장해두면 인수인계가 쉬워집니다.

```text
FINPLE / WILL repo handoff:
- Repo: vip930sw/will
- Main worktree used in this run: C:\Users\lsw_2\Documents\Codex\2026-06-07\new-chat\work\will
- Branch: main
- User expects frequent GitHub pushes after each visible UI change.
- Always run npm.cmd run build before pushing UI/code changes.
- /mypage is still patch-based: AccountPages.jsx base render + MyPage...Patch.js DOM/CSS patches.
- Do not assume JSX alone is final output; inspect main.jsx import order and patch files.
- MY PAGE menus: 내 계정, 내 투자성향, 내 구독/플랜, 내 결제수단, 내 결제내역, 내 문의내역, 내 저장내역.
- Blue notice box standard: font-size 13px, color #334155, padding 10px 12px, border 1px solid #bfdbfe, border-radius 14px, background #eff6ff, no gradient, no shadow, avoid menu-specific line-height.
- Billing/plan notice inherits from upgradePromptBox, so override gradient/radius/shadow to match common notice boxes.
- Investment MBTI mypage storage key: finple-mbti-simulator-preset.
- /mbti results update MY PAGE only when user clicks 미국자산으로 반영 or 한국자산으로 반영.
- Google OAuth /mypage blank was mitigated by stabilization/failsafe patches; if it regresses, inspect MyPageRenderStabilizationPatch.js and MyPageShellBridgePatch.js first.
```

이 블록은 ChatGPT의 프로젝트 지침/프로젝트 소스에 그대로 넣어도 됩니다.
