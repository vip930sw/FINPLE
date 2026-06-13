# FINPLE education account plan

작성일: 2026-06-13

대상 기능: 오프라인 수업, 세미나, 교육 현장에서 수강생 또는 참석자에게 결제 없이 FINPLE Personal 수준의 기능을 체험하게 하는 교육용 계정

성격: 구현 전 설계 문서 / 운영 검토용 / 보안 및 개인정보 최종 검토 전 초안

---

## 1. 목적

FINPLE 교육용 계정은 수업, 세미나, 워크숍, 오프라인 안내 행사에서 참석자가 별도 결제 없이 FINPLE Personal 수준의 기능을 체험하도록 제공하는 계정이다.

운영 목적은 다음과 같다.

- 결제 없이 Personal 기능 체험 제공
- 수업 종료 후 접근 권한 회수
- 세미나 규모에 따라 다수 계정 생성 및 관리
- 유료 구독자 통계와 교육용 권한 통계 분리
- 수강생에게 계정과 비밀번호를 안전하고 편하게 전달

---

## 2. 핵심 결론

교육용 계정은 일반 회원가입 계정이나 실제 유료 구독 계정과 분리해서 관리하는 것이 좋다.

권장 구조는 다음과 같다.

```text
education_accounts 테이블
  -> 실제 users row와 연결
  -> auth_credentials / user_sessions 재사용
  -> user_entitlements에는 Personal과 동일한 권한 부여
  -> source = education으로 실제 결제 구독과 분리
```

교육용 계정의 기능 권한은 Personal과 동일하게 두되, Pro 수준 권한은 부여하지 않는다.

---

## 3. 로그인 화면 방향

`/login`에 교육용 계정 체크박스를 두는 방식도 가능하지만, 운영상으로는 다음 방식이 더 안전하다.

```text
일반 계정 | 교육용 계정
```

탭 또는 세그먼트 컨트롤을 추천한다.

이유:

- 체크박스는 일반 사용자가 실수로 누르기 쉽다.
- 교육용 계정은 이메일 인증, 소셜 로그인과 성격이 다르다.
- 입력 항목도 일반 로그인은 이메일, 교육용 로그인은 교육용 ID가 더 자연스럽다.
- 향후 교육용 계정 안내 문구, 만료 메시지, 비밀번호 재발급 안내를 독립적으로 다루기 쉽다.

교육용 로그인 화면 예시:

```text
교육용 계정

교육용 ID
[ finple-class-001 ]

비밀번호
[ ******** ]

수업 또는 세미나에서 제공받은 계정으로 로그인합니다.
교육 기간 종료 후 접근이 제한될 수 있습니다.
```

---

## 4. 권한 모델

교육용 계정은 결제 없이 Personal과 동일한 자격을 가진다.

권장 값:

```text
users.plan = personal 또는 education
user_entitlements.plan = personal
user_entitlements.source = education
subscriptions에는 실제 결제 구독으로 기록하지 않음
payments에는 기록하지 않음
```

### 중요한 코드 유의점

현재 `server/src/db/authRepository.js`의 로그인 흐름에는 `ensureDefaultEntitlement()`가 있고, 이 함수는 로그인 시 `users.plan` 기준으로 `user_entitlements`를 다시 쓴다.

따라서 교육용 권한을 안전하게 유지하려면 아래 둘 중 하나를 선택해야 한다.

1. 교육용 계정의 `users.plan`을 `personal`로 둔다.
2. `ensureDefaultEntitlement()`가 `source = education`인 권한을 덮어쓰지 않도록 수정한다.

운영상으로는 2번이 더 명확하다. `source = education`을 보존하면 교육용 권한이 실제 유료 Personal 구독과 섞이지 않는다.

---

## 5. DB 설계안

추천 테이블:

```sql
CREATE TABLE education_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL UNIQUE,
  label TEXT,
  cohort_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_education_accounts_cohort
  ON education_accounts(cohort_name, status);

CREATE INDEX idx_education_accounts_valid_until
  ON education_accounts(valid_until);
```

비밀번호는 기존 `auth_credentials`의 `password_hash`를 재사용한다. 평문 비밀번호는 저장하지 않는다.

---

## 6. 관리자 패널 방향

`/admin` 메뉴에 `교육 계정 관리`를 추가한다.

권장 메뉴 구조:

```text
문의사항 관리
회원 관리
구독 관리
교육 계정 관리
관리자 모드 해제
```

교육 계정 관리에서 제공할 기능:

- 교육 계정 단일 생성
- 교육 계정 N개 일괄 생성
- 수업명 또는 세미나명 입력
- 유효 시작일 / 종료일 설정
- 활성 / 일시중지 / 만료 처리
- 비밀번호 재발급
- 최근 로그인 확인
- 수업별 필터
- CSV 다운로드
- 인쇄용 카드 PDF 다운로드

추가로 관리자 통계는 다음처럼 분리하는 것이 좋다.

```text
유료 구독자 수
교육용 활성 계정 수
전체 Personal 권한 계정 수
만료 예정 교육 계정 수
최근 30일 교육 계정 로그인 수
```

---

## 7. 결제 및 MY PAGE 예외 처리

교육용 계정은 Personal 권한을 갖지만 실제 결제 구독은 아니다.

따라서 아래 예외 처리가 필요하다.

### /pricing

- 교육용 계정 로그인 상태에서는 결제 버튼을 숨기거나 비활성화한다.
- 문구 예시:

```text
교육용 Personal 권한 사용 중입니다.
교육 기간 동안 Personal 기능을 체험할 수 있으며, 실제 결제는 진행되지 않습니다.
```

### /mypage

- 구독/결제 메뉴에서 실제 결제 구독처럼 보이지 않게 한다.
- 문구 예시:

```text
교육용 계정으로 Personal 기능을 이용 중입니다.
교육 기간 종료 후 접근 권한이 제한될 수 있습니다.
```

### 관리자 구독 통계

교육용 계정을 유료 구독자로 집계하면 매출, 구독률, 환불 대응 지표가 왜곡된다.

따라서 `source = education` 권한은 유료 구독 통계에서 제외하거나 별도 항목으로 분리한다.

---

## 8. 접근 차단 정책

교육용 계정은 수업 종료 후 재접근을 막아야 한다.

권장 정책:

- `status = active`인 경우만 로그인 허용
- `valid_until`이 지난 계정은 로그인 차단
- 관리자가 `paused` 또는 `expired`로 변경하면 즉시 로그인 차단
- 가능하면 기존 세션도 함께 만료 또는 revoke 처리

상태값 예시:

```text
active  : 사용 가능
paused  : 일시 중지, 재활성화 가능
expired : 종료됨, 수강 종료 후 접근 차단
revoked : 회수됨, 보안상 재사용 금지
```

---

## 9. 계정 전달 방식

### 1차 권장: CSV 다운로드 + 인쇄용 꼬리표

오프라인 수업에서는 CSV 출력 후 잘라 나눠주는 방식이 가장 안정적이다.

CSV 예시:

```csv
번호,교육용 ID,초기 비밀번호,유효기간,수업명,로그인 주소
1,finple-class-001,A7K9-QP2M,2026-06-30,6월 FINPLE 세미나,https://finple.co.kr/login
2,finple-class-002,D3VN-81KL,2026-06-30,6월 FINPLE 세미나,https://finple.co.kr/login
```

장점:

- 오프라인 현장에서 가장 빠르다.
- 수강생 이메일이나 휴대폰 번호를 미리 받지 않아도 된다.
- 계정 배포 실패, 메일 미수신, 카톡 누락 이슈가 적다.
- 교재, 좌석표, 명찰, 안내지에 붙이기 쉽다.

### 2차 권장: 인쇄용 카드 PDF

관리자 패널에서 계정 생성 후 바로 인쇄용 카드 PDF를 만들 수 있으면 좋다.

카드 예시:

```text
FINPLE 교육용 계정

교육용 ID: finple-class-001
초기 비밀번호: A7K9-QP2M
접속 주소: finple.co.kr/login
유효기간: 2026.06.30까지

수업 종료 후 계정 접근은 제한됩니다.
```

### 카카오톡 전달

가능하지만 1차 방식으로는 추천하지 않는다.

주의점:

- 단체방에 계정과 비밀번호를 뿌리면 계정 공유와 유출 가능성이 크다.
- 개인 카톡으로 1:1 전달하면 운영 부담이 크다.
- 계정 수가 많아질수록 전달 누락과 오발송 위험이 커진다.

카카오톡은 소규모 세미나 또는 보조 전달 수단으로만 추천한다.

### 이메일 전달

기술적으로 가능하다. FINPLE에는 Resend 기반 알림 구조가 이미 있으므로 교육용 계정 안내 메일도 확장 가능하다.

다만 오프라인 현장에서는 다음 문제가 있다.

- 수강생 이메일을 사전에 받아야 한다.
- 스팸함, 오타, 미수신 대응이 필요하다.
- 현장에서 "메일이 안 왔다"는 운영 이슈가 생길 수 있다.

따라서 이메일은 사전 등록형 세미나에 적합하고, 현장 즉시 배포에는 CSV/PDF 방식이 더 안정적이다.

---

## 10. 작업 순서 제안

한 번에 전체 구현하기보다 단계적으로 쌓는 것이 좋다.

### 1단계: DB 및 권한 기반

- `education_accounts` 테이블 추가
- 교육용 권한 source 정책 추가
- 로그인 시 `source = education` 권한 보존 로직 정리
- 유료 구독 통계와 교육용 권한 통계 분리 기준 정의

### 2단계: 교육용 로그인

- `/login`에 `일반 계정 / 교육용 계정` 탭 추가
- 교육용 ID / 비밀번호 로그인 API 추가
- 상태, 유효기간 검사
- 기존 `user_sessions` 재사용

### 3단계: 관리자 패널

- `/admin/education` 라우터 추가
- 교육 계정 단일 생성
- 교육 계정 일괄 생성
- 만료, 중지, 재활성화
- 비밀번호 재발급
- CSV 다운로드

### 4단계: 결제 및 MY PAGE 예외 처리

- `/pricing` 교육용 권한 안내
- 결제 버튼 비활성화 또는 숨김
- `/mypage` 교육용 구독/결제 안내 문구 분리
- 관리자 회원/구독 통계 분리

### 5단계: 배포 도구 확장

- 인쇄용 카드 PDF 다운로드
- 사전 등록자 이메일 발송
- 필요 시 개인 카카오톡 전달을 위한 CSV 포맷 제공

---

## 11. 구현 전 체크리스트

- 교육용 계정 ID 형식 확정
- 초기 비밀번호 길이와 표시 방식 확정
- 교육용 계정 만료 기본 기간 확정
- 수업명, 세미나명, 기수명 필드 필요 여부 확정
- 교육용 계정의 회원탈퇴 허용 여부 확정
- 교육용 계정의 결제수단 등록 메뉴 노출 여부 확정
- 기존 Personal 권한 제한값과 동일하게 유지할지 확인
- 수업 종료 후 기존 세션 즉시 revoke할지 확인
- 관리자 CSV/PDF 다운로드에 개인정보가 포함되는지 검토

---

## 12. 권장 1차 구현 범위

첫 구현 PR은 너무 크게 잡지 않고 아래 범위로 제한하는 것이 좋다.

```text
1. DB migration
2. 교육용 로그인 API
3. /login 교육용 계정 탭
4. /admin 교육 계정 관리의 최소 CRUD
5. CSV 다운로드
```

PDF 카드 출력, 이메일 발송, 세부 통계 대시보드는 두 번째 PR 이후로 나누는 것이 안전하다.
