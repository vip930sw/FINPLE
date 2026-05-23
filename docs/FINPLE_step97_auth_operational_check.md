# FINPLE Step 97 — 로그인 / 회원가입 운영 점검

## 1. 현재 코드 기준 결론

Step 97은 신규 화면을 처음부터 만드는 단계가 아닙니다. 현재 저장소에는 이미 다음 구현이 들어가 있습니다.

- 프론트엔드: 로그인 / 회원가입 화면
- 프론트엔드: 체험 계정 시작 흐름 유지
- 백엔드: `/api/auth/check-email`
- 백엔드: `/api/auth/signup`
- 백엔드: `/api/auth/login`
- 백엔드: `/api/auth/logout`
- 백엔드: `/api/auth/me`
- 백엔드: 세션 토큰 기반 인증 저장
- 결제: Toss 준비 / 승인 / Webhook / 구독 종료 예약 라우트 존재

따라서 이번 단계의 성격은 **기존 구현 검수 + DB 스키마 보강 + 운영 전 체크리스트 정리**입니다.

## 2. 이번 PR에서 한 일

### 2.1 추가 파일

```text
server/db/migrations/002_auth_payment_operational_schema.sql
docs/FINPLE_step97_auth_operational_check.md
```

### 2.2 의도

`server/src/db/authRepository.js`와 결제 라우트들이 참조하는 테이블·컬럼이 초기 `001_init.sql`에 모두 반영되어 있지 않을 수 있어, 운영 DB와 대조 가능한 보강 SQL을 추가했습니다.

추가 SQL은 아래 영역을 다룹니다.

```text
1. users 인증 관련 컬럼 보강
2. auth_credentials
3. user_sessions
4. plan_entitlements
5. user_entitlements
6. subscriptions Toss 운영 컬럼 보강
7. payments Toss 운영 컬럼 보강
8. payment_events
9. recurring_payment_methods
10. 기존 사용자 기본 free 권한 부여
```

## 3. 직접 체크해야 할 내용

### 3.1 Supabase DB에서 확인

Supabase SQL Editor에서 바로 실행하기 전, 아래 테이블이 이미 있는지 먼저 확인하세요.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'auth_credentials',
    'user_sessions',
    'plan_entitlements',
    'user_entitlements',
    'subscriptions',
    'payments',
    'payment_events',
    'recurring_payment_methods'
  )
ORDER BY table_name;
```

이미 운영 데이터가 있는 경우 `002_auth_payment_operational_schema.sql`을 그대로 실행하기 전에 반드시 현재 컬럼과 충돌 여부를 확인하세요.

### 3.2 실행 순서

```text
1. 현재 Supabase DB 백업 또는 스냅샷 확인
2. 002_auth_payment_operational_schema.sql 내용 검토
3. Supabase SQL Editor에서 실행
4. Render 백엔드 재시작
5. 로그인 / 회원가입 / 체험 계정 / MY PAGE 테스트
6. 서버 저장 / 불러오기 테스트
7. 결제 health endpoint 테스트
```

## 4. 환경변수 체크

### 4.1 Render 서버 환경변수

```env
DATABASE_URL=...
DATABASE_SSL=true
FINPLE_SESSION_DAYS=30
FINPLE_PASSWORD_HASH_ITERATIONS=210000
FINPLE_PAYMENT_MODE=stub 또는 test
TOSS_SECRET_KEY=...
TOSS_WEBHOOK_SECRET=...
FINPLE_BILLING_KEY_ENCRYPTION_SECRET=...
FINPLE_SITE_URL=https://finple.co.kr
CORS_ORIGIN=https://finple.co.kr,https://www.finple.co.kr
```

### 4.2 Vercel 프론트 환경변수

```env
VITE_FINPLE_API_BASE_URL=https://<render-backend-url>/api
VITE_TOSS_CLIENT_KEY=...
```

주의: `TOSS_SECRET_KEY`, `DATABASE_URL`, `FINPLE_ADMIN_TOKEN`, `FINPLE_BILLING_KEY_ENCRYPTION_SECRET`는 Vercel의 `VITE_` 변수로 넣지 않습니다.

## 5. 테스트 체크리스트

### 5.1 인증

```text
□ 회원가입 페이지 진입
□ 이메일 도메인 선택 / 직접입력 정상
□ 이메일 중복확인 정상
□ 8자 미만 비밀번호 차단
□ 비밀번호 확인 불일치 차단
□ 이용약관 / 개인정보 필수 동의 체크
□ 회원가입 성공 후 MY PAGE 이동
□ 로그아웃 정상
□ 로그인 성공 후 MY PAGE 이동
□ 잘못된 비밀번호 5회 시 잠금 처리 확인
□ 체험 계정 시작 흐름 유지
```

### 5.2 기존 기능 회귀 테스트

```text
□ 홈 화면 접속
□ 분석 시작 버튼
□ 투자 MBTI 진입
□ 시뮬레이터 진입
□ 포트폴리오 입력
□ 서버 저장
□ 서버 불러오기
□ 문의사항 작성
□ 관리자 문의 조회
□ 모바일 STEP 탭 줄바꿈 유지
□ 주요 CSS 깨짐 없음
```

### 5.3 결제 / 웹훅 운영 전 테스트

토스 심사 중에는 live 전환을 하지 않고 아래만 확인합니다.

```text
□ /api/payments/health 응답 확인
□ FINPLE_PAYMENT_MODE가 stub 또는 test인지 확인
□ TOSS_SECRET_KEY가 Render에만 있는지 확인
□ TOSS_WEBHOOK_SECRET이 Render에만 있는지 확인
□ Webhook URL이 운영 백엔드 주소 기준인지 확인
□ Personal 활성 구독 중복 결제 방지 응답 확인
□ 구독 종료 예약 API 응답 확인
```

## 6. 보류 항목

```text
1. Google 로그인 실제 연결
2. Kakao 로그인 실제 연결
3. Toss live 결제 전환
4. Pro 플랜 고급 기능
5. Sharpe / 표준편차 / 상관계수
6. 한국주식 / 한국 ETF 데이터 PoC
```

## 7. 다음 단계

```text
Step 98. 공지사항 / 업데이트 내역 구조 추가
Step 99. 한국주식 / 한국 ETF 데이터 조회 PoC
Step 100. Toss 심사 승인 후 결제 / 웹훅 운영 검증
```
