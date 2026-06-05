# FINPLE Step 112 결제 / MY PAGE 작업 인수인계

작성일: 2026-06-05

이 문서는 FINPLE의 Personal 원웨이 자동결제 플로우와 `/mypage` 결제수단 표시 개선 이후, 다음 작업자가 바로 이어서 작업할 수 있도록 남기는 인수인계 자료입니다.

---

## 1. 현재 완료 상태

### Step 112. Personal 원웨이 자동결제 플로우

Personal 구독 시작 흐름을 기존의 `결제 준비`와 `결제수단 등록` 분리 구조에서, 하나의 구독 시작 흐름으로 정리했습니다.

현재 의도한 흐름은 다음과 같습니다.

```text
Personal 선택
→ 로그인 확인
→ /payment-method/setup 이동
→ Toss 카드 인증
→ billingKey 발급
→ 첫 달 9,900원 결제
→ Personal 활성화
→ MY PAGE에서 구독/결제수단 확인
```

관련 주요 변경:

- `server/src/routes/paymentOneWayBillingRoutes.js`
  - 빌링키 발급
  - 빌링키 암호화 저장
  - 첫 달 9,900원 자동결제 승인
  - Personal 구독 활성화
  - 결제 / 구독 / 권한 DB 반영

- `server/src/index.js`
  - 신규 원웨이 결제 라우트 연결
  - 기존 `/payments/toss/billing/issue`보다 먼저 처리되도록 배치

- `src/PaymentPrepFlowPatch.js`
  - Personal 선택 시 기존 결제 준비 배너를 거치지 않고 `/payment-method/setup?plan=personal&source=pricing`으로 이동
  - 로그인 전이면 로그인 후 자동결제 등록 화면으로 복귀
  - 기존 MutationObserver 사용 제거

- `src/PaymentMethodRoutePatch.js`
  - 결제수단 등록 중심 문구를 Personal 구독 시작 중심으로 수정
  - 카드 인증 후 첫 결제 및 Personal 활성화 안내로 변경

---

## 2. 완료된 세부 작업

### Step 112-2A. Payment Method 표시 개선

`/mypage → Payment Method`에서 카드사 코드 또는 부정확한 카드번호 일부가 실제 카드처럼 보이는 문제를 개선했습니다.

완료 내용:

- `/mypage Payment Method`에서 카드사 코드 숫자 노출 방지
- 기존 `33 **** 2912`처럼 보이던 표시 문제 개선
- 가능하면 첫 결제 승인 메타데이터 기준으로 카드사명 + 카드번호 일부 표시
- 카드번호 표시가 불확실하면 `카드 등록 완료`로 안전하게 표시
- 카드번호 원문은 FINPLE 서버에 저장하지 않음

관련 주요 변경:

- `server/src/routes/paymentBillingMethodDisplayRoutes.js`
  - 개선된 결제수단 조회 라우트 추가
  - 카드사 코드 매핑
  - 결제 승인 메타데이터 우선 확인
  - 카드사명 + 마스킹 카드번호 표시 보정

- `server/src/index.js`
  - `paymentBillingMethodDisplayRoutes`를 기존 `paymentBillingMethodRoutes`보다 먼저 mount

확인 결과:

- Render 재배포 후 `/mypage → 결제수단`에서 카드 표시 문제 해결 확인 완료

---

## 3. 현재 운영상 중요한 기준

### 3-1. 카드번호 원문 저장 금지

FINPLE 서버에는 카드번호 원문을 저장하지 않습니다.

저장 가능한 값:

```text
billingKey 암호화값
카드사명
카드번호 일부 마스킹 표시
Toss payment metadata
receipt_url
```

저장하면 안 되는 값:

```text
전체 카드번호
CVC
카드 비밀번호 앞자리
주민등록번호 전체
```

### 3-2. 결제수단 표시 라우트 우선순위 유지

`paymentBillingMethodDisplayRoutes`는 기존 `paymentBillingMethodRoutes`보다 먼저 mount되어야 합니다.

현재 의도한 구조:

```js
app.use("/api/payments", paymentBillingMethodDisplayRoutes);
app.use("/api/payments", paymentBillingMethodRoutes);
```

이 순서가 바뀌면 기존의 카드사 코드 노출 문제가 재발할 수 있습니다.

### 3-3. 백엔드 수정 시 Render 재배포 필요

아래 작업은 Vercel만으로 반영되지 않습니다. Render 재배포가 필요합니다.

```text
결제수단 API 수정
결제내역 API 추가
구독 상태 API 수정
Toss 결제 로직 수정
월 자동결제 스케줄러 추가
```

프론트 UI만 수정한 경우에는 Vercel Production 배포만 확인하면 됩니다.

---

## 4. 아직 남은 작업

### Step 112-2B. /mypage 내 문의내역 추가

작업 범위:

- 기존 inquiries API 활용
- `/mypage` 좌측 메뉴에 `내 문의내역` 추가
- 내 문의 목록 카드 추가
- 문의 제목, 유형, 상태, 작성일, 내용 일부 표시
- 상태값 한글 매핑

상태값 매핑 예시:

```text
open        → 접수됨
in_progress → 확인 중
resolved    → 답변 완료
closed      → 종료
```

우선순위:

- 결제내역보다 먼저 진행 권장
- 기존 API가 있으므로 상대적으로 안전함

### Step 112-2C. /mypage 결제내역 추가

작업 범위:

- 백엔드에 사용자별 결제내역 조회 API 신설
- 예: `GET /api/payments/history`
- `payments` 테이블에서 로그인 사용자 기준 결제내역 조회
- `/mypage` 좌측 메뉴에 `결제내역` 추가
- 결제내역 카드 추가
- 영수증 링크 연결

표시 항목 예시:

```text
상품명: FINPLE Personal
결제방식: 월 구독 자동결제
금액: 9,900원
결제일
결제 상태
영수증 링크
```

---

## 5. 아직 별도 과제로 남은 결제 운영 안정화

현재 완료된 것은 다음 흐름입니다.

```text
최초 카드 인증
→ billingKey 발급
→ 첫 달 결제
→ Personal 활성화
```

아직 별도 과제로 남은 것:

```text
매월 nextBillingAt 기준 자동결제 실행
결제 실패 처리
재시도 정책
결제 실패 시 Personal 권한 유지 / 회수 기준
사용자 알림 메일
구독 갱신 로그 / 관리자 확인 화면
```

이 작업은 추후 `Step 113` 또는 별도 `결제 운영 안정화` 단계로 분리하는 것이 안전합니다.

---

## 6. 다음 채팅 시작 문구

다음 채팅에서 바로 이어갈 때는 아래 문구를 사용합니다.

```text
FINPLE 프로젝트 이어서 진행합니다.

현재 상태:
- Step 112 Personal 원웨이 자동결제 플로우 반영 완료
- Step 112-2A Payment Method 표시 개선 완료
- /mypage 결제수단 카드에서 카드사 + 카드번호 일부 표시 문제 해결됨
- docs/FINPLE_step112_payment_mypage_handoff.md 문서화 완료

다음 작업:
Step 112-2B
/mypage 내 문의내역 추가
- 기존 inquiries API 활용
- 좌측 메뉴 추가
- 내 문의 목록 카드 추가

Step 112-2C
/mypage 결제내역 추가
- payments history API 신설
- 결제내역 카드 추가
- 영수증 링크 연결

우선 Step 112-2B부터 진행해주세요.
```
