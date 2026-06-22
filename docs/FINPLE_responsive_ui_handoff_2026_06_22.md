# FINPLE 반응형 UI 작업 이력 및 CSS 인수인계

- 작성일: 2026-06-22
- 저장소: [vip930sw/FINPLE](https://github.com/vip930sw/FINPLE)
- 기준 브랜치: `main`
- 운영 사이트: <https://finple.co.kr>
- 작업 범위: HOME, 공통 헤더·푸터, 캘린더, 정책 페이지, 요금제, MY PAGE, 로그인, 시뮬레이터, 투자 MBTI
- 기준 커밋 범위: `8d2897e` ~ `6d54775`
- 배포 방식: PR 없이 `main` 직접 푸시 후 Vercel 자동 배포

## 1. 작업 목적

모바일 화면에서 헤더와 본문이 겹치거나, 카드가 화면 양끝에 붙거나, 같은 역할의 요소가 화면마다 다른 위치·크기로 보이는 문제를 정리했다.

핵심 원칙은 다음과 같다.

1. 모바일 수정은 모바일 미디어쿼리 안에서만 적용한다.
2. PC 수정은 PC 미디어쿼리 안에서만 적용한다.
3. 공통 문구·법적 고지·본문 데이터는 레이아웃 수정 과정에서 임의로 변경하지 않는다.
4. 화면 폭, 카드 높이, 버튼 위치는 실제 브라우저 렌더링 치수로 검증한다.
5. 페이지별 임시 규칙보다 기존 공통 클래스와 CSS 우선순위를 먼저 확인한다.

## 2. 주요 작업 이력

### 2.1 모바일 공통 헤더

- 실제 헤더 높이를 측정해 `--finple-mobile-header-offset`에 반영한다.
- 모바일에서만 헤더를 고정하고 본문 시작 위치를 보정한다.
- 로고 오른쪽에 홈, 시작하기, 요금제, MY PAGE, 로그인·로그아웃 아이콘을 배치했다.
- 문의사항 아이콘은 모바일 헤더에서 제외했다.
- 시작하기 아이콘만 파란색, 나머지는 차콜 계열을 사용한다.
- HOME의 소개·캘린더·요금제 보조 메뉴와 시뮬레이터 Step 메뉴는 두 번째 행 중앙에 배치한다.

관련 파일:

- `src/GlobalNavigationPatch.js`
- `src/GlobalNavigation.css`
- `src/GlobalHeaderOffset.css`

주의:

- 모바일 헤더 높이는 고정 숫자 하나가 아니라 `ResizeObserver`로 실제 높이를 다시 측정한다.
- 신규 라우트를 추가할 때 `GlobalNavigationPatch.js`의 SPA 경로 목록과 활성 메뉴 판정도 함께 확인한다.
- `GlobalHeaderOffset.css`는 여러 기존 모바일 규칙보다 나중에 로드되므로 최종 보정 역할을 한다.

### 2.2 모바일 HOME

- HOME 보조 메뉴를 글로벌 메뉴 아래 중앙에 배치했다.
- 히어로 배지, 제목, CTA를 가운데 정렬했다.
- CTA 크기를 모바일 터치 환경에 맞게 확대했다.
- 헤더와 본문 사이의 과도한 공백을 단계적으로 줄였다.

관련 파일:

- `src/GlobalHeaderOffset.css`
- `src/components/HomeSimplify.css`

### 2.3 공통 푸터

모바일:

- 업데이트, 이용약관, 개인정보처리방침, 환불정책, 투자 유의사항을 드롭다운으로 변경했다.
- 드롭다운은 왼쪽, SNS 아이콘은 오른쪽 같은 행에 배치했다.
- 사업자 정보는 의미 단위로 줄바꿈해 기기 폭에 따라 애매하게 끊기지 않게 했다.

PC:

- 법적 사업자 문구 자체는 변경하지 않고 정보 열의 폭만 넓혔다.
- 기존 정책 링크와 SNS 배치를 유지했다.

관련 파일:

- `src/App.jsx`
- `src/components/SiteFooter.css`

주의:

- 법적 고지 문구는 `SiteFooter.css`의 `::after` 콘텐츠로 관리된다.
- 모바일용 줄바꿈은 `@media (max-width: 900px)` 안에서만 관리한다.
- PC 법적 문구는 삭제·축약·순서 변경하지 않는다.

### 2.4 경제 캘린더

모바일:

- Investing.com 캘린더는 원본 가독성을 위해 축소하지 않는다.
- 작은 화면에서는 기존 크기와 횡스크롤 방식을 유지한다.

PC:

- 캘린더 섹션 최대 폭을 1280px로 확대했다.
- 캘린더와 경제지표 열을 정확히 `1fr 1fr`로 유지한다.
- 캘린더 박스 내부 패딩을 좌우 8px로 줄였다.
- iframe을 1.12배 확대해 내부 흰 여백을 줄였다.

관련 파일:

- `src/components/EconomicCalendarSection.jsx`
- `src/components/EconomicCalendarPolish.css`
- `src/App.css`

주의:

- iframe 내부 DOM은 외부 도메인이므로 직접 스타일링할 수 없다.
- 확대는 PC의 `transform: scale(1.12)`와 역산한 폭으로 처리한다.
- 모바일에는 transform을 적용하지 않는다.

### 2.5 정책 페이지

- `/terms`, `/privacy`, `/refund`, `/disclaimer` 카드의 모바일 좌우 여백을 `/updates`와 같은 14px로 맞췄다.
- PC 카드 폭은 기존 값을 유지한다.

관련 파일:

- `src/components/LegalPagesPolish.css`

공통 모바일 폭:

```css
width: min(calc(100% - 28px), ...);
margin-right: auto;
margin-left: auto;
```

### 2.6 요금제 페이지

모바일:

- 상태 박스, 요금제 카드, 안내 박스의 좌우 여백을 14px로 통일했다.
- Free, Personal, Pro 탭을 추가했다.
- 선택한 탭의 카드 한 개만 표시해 세로 스크롤을 줄였다.
- 세 카드 높이를 640px로 통일했다.
- 상단 라벨 22px, 기능 목록 160px, 제한 항목 188px 공간을 공통으로 확보했다.
- 탭 전환 시 카드 높이와 버튼 위치가 움직이지 않도록 선택 표시 공간을 예약했다.

PC:

- 기존 3열을 유지한다.
- 세 카드의 패딩, 테두리, 그림자, 글자 색과 굵기를 통일했다.
- Personal 라벨도 Free·Pro와 같은 파란색을 사용한다.
- 버튼 아래 `현재 선택` 뱃지는 PC에서 표시하지 않는다.

관련 파일:

- `src/components/AccountPages.jsx`
- `src/App.css`
- `src/components/LegalPagesPolish.css`

주의:

- Personal은 `.featured` 클래스를 사용하지만, 본문 글자 색·굵기를 별도로 덮어쓰면 안 된다.
- 추천 뱃지와 CTA 색상만 Personal의 강조 요소로 남긴다.
- 모바일에서 숨긴 카드는 DOM에 남아 있으므로 접근성 상태와 탭 활성 상태를 함께 유지한다.

### 2.7 MY PAGE

- 모바일 대시보드 최외곽과 내부 패널의 좌우 여백을 14px로 통일했다.
- MY PAGE는 실행 중 스크립트가 `.accountPanelStack`을 `.myPageDashboardLayout`으로 감싼다.
- 따라서 원본 React 구조뿐 아니라 런타임 래퍼에도 폭 규칙을 적용해야 한다.
- MY ACCOUNT의 회원탈퇴 안내는 모바일에서 한 줄이 되도록 축약 문구를 별도로 제공했다.
- PC에서는 기존 안내 문구를 유지한다.

관련 파일:

- `src/components/AccountPages.jsx`
- `src/components/LegalPagesPolish.css`
- `src/MyPageSidebar.css`
- `src/MyPageShellBridgePatch.js`
- `src/MyPageSidebarPatch.js`
- `src/MyPageAccountStatusDisplay.css`

주의:

- MY PAGE는 React 컴포넌트와 DOM 패치 파일이 함께 화면을 구성한다.
- `.accountPanelStack`만 수정하면 런타임 래퍼가 전체 폭으로 남을 수 있다.
- 수정 후 실제 DOM의 `.myPageDashboardLayout` 치수를 반드시 확인한다.

### 2.8 로그인

- 모바일 헤더 높이: 75px
- 모바일 헤더 오프셋: 124px
- 기존 로그인 카드 상단 마진: 100px
- 기존 화면상 실제 여백: 149px
- 변경 로그인 카드 상단 마진: 25px
- 변경 화면상 실제 여백: 74px

PC 로그인 여백은 변경하지 않았다.

관련 파일:

- `src/GlobalHeaderOffset.css`
- `src/components/LoginPageFinalPolish.css`
- `src/components/LegalPagesPolish.css`

주의:

- 로그인 카드 마진은 여러 파일에서 선언된다.
- 최종 모바일 보정은 더 구체적인 `#root > main.loginSimplePage .loginSimpleCard` 선택자로 관리한다.

### 2.9 시뮬레이터

모바일:

- 헤더의 Step 1·2·3 메뉴를 화면 중앙에 배치했다.
- 본문 위에 고정되어 있던 Step 1 시뮬레이터, Step 2 포트폴리오, Step 3 상세분석 버튼 바를 숨겼다.
- 중복 내비게이션 제거 후 본문 상단 여백을 줄였다.

PC:

- 기존 시뮬레이터 탭을 유지한다.

관련 파일:

- `src/GlobalHeaderOffset.css`
- `src/MobileUxHotfix.css`
- `src/SimulatorNavComparePolish.css`
- `src/components/PersonalPage.jsx`
- `src/components/portfolio/components/SimulatorTabNav.jsx`

### 2.10 투자 MBTI

모바일:

- 이전 버튼은 왼쪽, 다음 버튼은 오른쪽 같은 행에 배치했다.
- 각 버튼 폭은 `calc(50% - 6px)`로 동일하게 맞췄다.
- A/B/C/D 뱃지를 선택지 카드 좌측 상단에 배치했다.
- 선택지 문구는 뱃지 아래에서 시작한다.
- 선택지 최소 높이는 112px이다.

PC:

- 기존 2열 선택지와 가로형 뱃지·문구 배치를 유지한다.

관련 파일:

- `src/components/InvestmentMbtiPage.jsx`
- `src/components/InvestmentMbtiPage.css`

## 3. CSS 반응형 운영 매뉴얼

### 3.1 브레이크포인트

| 구간 | 용도 |
| --- | --- |
| `max-width: 960px` | 고정 모바일 헤더와 본문 오프셋 |
| `max-width: 900px` | 일반 모바일·태블릿 카드와 레이아웃 |
| `max-width: 768px` | 아이콘형 헤더와 HOME 모바일 배치 |
| `max-width: 640px` | 로그인, MBTI 등 작은 모바일 세부 배치 |
| `min-width: 901px` | PC 전용 캘린더·요금제 보정 |
| `min-width: 1200px` | PC 푸터 법적 고지 열 확대 |

### 3.2 모바일 콘텐츠 폭

작은 화면의 주요 카드와 탭은 특별한 사유가 없으면 좌우 14px을 기준으로 한다.

```css
width: min(calc(100% - 28px), var(--page-max-width));
margin-inline: auto;
```

카드 자체에 이미 좌우 padding이 있는 경우 외곽 grid의 padding을 중복 적용하지 않는다.

### 3.3 디바이스 범위 분리

```css
@media (max-width: 900px) {
  /* 모바일 전용 */
}

@media (min-width: 901px) {
  /* PC 전용 */
}
```

공통 규칙을 수정할 때는 PC와 모바일 양쪽에 의도한 변경인지 먼저 확인한다. 한쪽만 바꾸는 요청에 공통 선택자를 수정하지 않는다.

### 3.4 CSS 우선순위 확인 순서

1. 컴포넌트 전용 CSS
2. `App.css`의 기존 공통 규칙
3. 후행 patch CSS
4. 미디어쿼리
5. `!important` 사용 여부
6. 런타임 스크립트가 추가하는 클래스·래퍼

현재 `main.jsx`에서 `GlobalHeaderOffset.css`는 후반에 로드된다. 헤더·모바일 오프셋의 최종 값은 이 파일에서 확인한다.

### 3.5 금지 사항

- 모바일 문제를 해결하기 위해 PC 공통 폭을 임의로 변경하지 않는다.
- 법적 고지 문구를 레이아웃 문제 해결 목적으로 축약하지 않는다.
- 외부 iframe의 가독성을 무시하고 전체를 과도하게 축소하지 않는다.
- 카드별 콘텐츠 수가 다르다는 이유로 버튼 위치가 달라지게 두지 않는다.
- 기존 패치 구조를 확인하지 않고 같은 선택자를 새 파일에 반복 추가하지 않는다.

## 4. 검증 절차

```powershell
npm.cmd run build
git diff --check
```

추가 화면 검증:

1. 모바일 375px에서 대상 라우트를 연다.
2. PC 1440px 또는 실제 요청 화면 폭에서 같은 라우트를 연다.
3. `getBoundingClientRect()`로 좌우 여백, 카드 높이, 버튼 위치를 측정한다.
4. `getComputedStyle()`로 display, grid columns, transform, font-weight를 확인한다.
5. 운영 배포 후 새 CSS·JS 해시와 핵심 선택자 포함 여부를 확인한다.

실제 검증에 사용한 대표 기준:

- 모바일 주요 카드 좌우 여백: 14px
- 요금제 모바일 카드 높이: 640px
- 로그인 실제 헤더 하단 여백: 74px
- PC 캘린더·경제지표: 동일 열 폭
- MBTI 모바일 이전·다음 버튼: 같은 y 좌표

## 5. 배포 절차

현재 사용자 요청에 따른 작업 방식:

1. `main` 최신 상태 확인
2. 수정
3. 빌드 및 화면 치수 검증
4. 변경 파일만 커밋
5. `git push origin main`
6. `finple.co.kr`의 새 번들 해시와 핵심 규칙 확인

Vercel 자동 배포 훅이 시작되지 않으면 코드 변경 없이 빈 커밋으로 한 번 재호출할 수 있다.

```powershell
git commit --allow-empty -m "Trigger Vercel deployment"
git push origin main
```

빈 커밋은 배포 훅 재호출 용도이며 기능 변경 이력과 구분한다.

## 6. 회귀 테스트 체크리스트

- [ ] 모바일 헤더가 본문을 가리지 않는가
- [ ] HOME 보조 메뉴가 모바일에서 중앙 정렬되는가
- [ ] 모바일 주요 카드 좌우 여백이 14px인가
- [ ] 푸터 드롭다운과 SNS가 같은 행인가
- [ ] PC 푸터 법적 고지가 임의로 변경되지 않았는가
- [ ] 캘린더와 경제지표가 PC에서 1:1인가
- [ ] 모바일 캘린더가 과도하게 축소되지 않았는가
- [ ] 요금제 탭 전환 시 카드 외곽과 버튼 위치가 움직이지 않는가
- [ ] Personal 본문 서식이 Free·Pro와 같은가
- [ ] MY PAGE 런타임 래퍼가 모바일 화면을 꽉 채우지 않는가
- [ ] 로그인 카드의 실제 헤더 하단 여백이 약 74px인가
- [ ] 모바일 시뮬레이터에 중복 Step 버튼 바가 없는가
- [ ] 모바일 MBTI 선택지 뱃지가 좌측 상단인가
- [ ] 모바일 MBTI 이전·다음 버튼이 같은 행인가
- [ ] PC 전용 화면이 모바일 수정으로 변경되지 않았는가

## 7. 관련 커밋

- `8d2897e` 모바일 헤더 여백 조정
- `629133f` 모바일 헤더 본문 간격 축소
- `bda812e` 모바일 HOME 메뉴·히어로 정렬
- `fa1249a` 모바일 아이콘 내비게이션
- `202770d` 모바일 푸터 드롭다운과 PC 푸터·캘린더 조정
- `33e0d29` PC 캘린더 확대 및 1:1 열 복원
- `22f206f` 모바일 정책 카드 여백
- `c6d6044` 모바일 요금제 여백
- `854af10` 모바일 MY PAGE 여백
- `6314c6f` 모바일 시뮬레이터 중복 내비게이션 제거
- `8e8f031` 모바일 MY ACCOUNT 안내 문구
- `e87c833` 모바일 로그인 상단 여백 축소
- `90d87a4` 모바일 요금제 탭
- `bf7e0a6` 요금제 카드 레이아웃 안정화
- `66199fa` 요금제 카드 글자 위계 통일
- `6d54775` 모바일 MBTI 배치 개선

## 8. 다음 작업자가 먼저 볼 파일

1. `docs/FINPLE_ui_visual_rules.md`
2. `docs/FINPLE_responsive_ui_handoff_2026_06_22.md`
3. `src/GlobalHeaderOffset.css`
4. `src/components/LegalPagesPolish.css`
5. `src/App.css`
6. 대상 컴포넌트 전용 CSS

새 반응형 요청은 먼저 “모바일만인지, PC만인지, 공통인지”를 명시한 뒤 작업한다.
