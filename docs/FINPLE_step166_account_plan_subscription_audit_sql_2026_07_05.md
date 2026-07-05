# FINPLE Step 166 Account Plan / Subscription Audit SQL

작성일: 2026-07-05

목적: `lsw_28@naver.com` 계정이 만료된 Personal 상태로 표시되는지 확인하기 위한 조회 전용 SQL과 `lsw@naver.com` 삭제 요청에 대한 soft delete 운영 절차를 정리한다.

주의:

- 운영 DB 직접 수정 금지.
- 아래 SQL은 Supabase SQL Editor에서 조회용으로만 실행한다.
- `billing_key_encrypted`, provider raw payload, credential, token 값은 조회하지 않는다.
- 대상 Supabase project URL: `https://zpasmrohknjlmmbcdbrw.supabase.co`

## 1. lsw_28@naver.com 통합 상태 조회

```sql
WITH target_user AS (
  SELECT id, email, name, nickname, plan, created_at, updated_at, last_login_at
    FROM users
   WHERE email = 'lsw_28@naver.com'
)
SELECT
  u.id AS user_id,
  u.email,
  u.name,
  u.nickname,
  u.plan AS users_plan,
  u.created_at AS user_created_at,
  u.updated_at AS user_updated_at,
  u.last_login_at,
  ue.plan AS entitlement_plan,
  ue.source AS entitlement_source,
  ue.valid_from AS entitlement_valid_from,
  ue.valid_until AS entitlement_valid_until,
  ue.updated_at AS entitlement_updated_at,
  s.id AS subscription_id,
  s.plan AS subscription_plan,
  s.status AS subscription_status,
  s.provider AS subscription_provider,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.ended_at,
  s.updated_at AS subscription_updated_at
FROM target_user u
LEFT JOIN user_entitlements ue ON ue.user_id = u.id
LEFT JOIN LATERAL (
  SELECT id, plan, status, provider, current_period_start, current_period_end,
         cancel_at_period_end, ended_at, updated_at
    FROM subscriptions
   WHERE user_id = u.id
   ORDER BY current_period_start DESC NULLS LAST,
            current_period_end DESC NULLS LAST,
            updated_at DESC NULLS LAST
   LIMIT 1
) s ON TRUE;
```

## 2. subscriptions 전체 이력

```sql
SELECT
  s.id AS subscription_id,
  u.email,
  s.plan,
  s.status,
  s.provider,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.ended_at,
  s.created_at,
  s.updated_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE u.email = 'lsw_28@naver.com'
ORDER BY s.current_period_start DESC NULLS LAST,
         s.current_period_end DESC NULLS LAST,
         s.updated_at DESC NULLS LAST;
```

## 3. user_entitlements 이력

```sql
SELECT
  ue.id AS entitlement_id,
  u.email,
  ue.plan,
  ue.portfolio_limit,
  ue.assets_per_portfolio_limit,
  ue.server_storage_enabled,
  ue.pdf_report_enabled,
  ue.report_level,
  ue.screener_level,
  ue.support_level,
  ue.source,
  ue.valid_from,
  ue.valid_until,
  ue.created_at,
  ue.updated_at
FROM user_entitlements ue
JOIN users u ON u.id = ue.user_id
WHERE u.email = 'lsw_28@naver.com'
ORDER BY ue.updated_at DESC NULLS LAST,
         ue.valid_until DESC NULLS LAST;
```

## 4. payments 이력

```sql
SELECT
  p.id AS payment_id,
  u.email,
  p.plan,
  p.amount,
  p.currency,
  p.status,
  p.provider,
  p.subscription_id,
  p.requested_at,
  p.approved_at,
  p.canceled_at,
  p.created_at,
  p.updated_at
FROM payments p
JOIN users u ON u.id = p.user_id
WHERE u.email = 'lsw_28@naver.com'
ORDER BY COALESCE(p.approved_at, p.requested_at, p.created_at) DESC NULLS LAST;
```

## 5. recurring_payment_methods 상태

```sql
SELECT
  rpm.id AS payment_method_id,
  u.email,
  rpm.provider,
  rpm.method_type,
  rpm.display_label,
  rpm.card_company,
  rpm.card_last4,
  rpm.masked_card_number,
  rpm.is_default,
  rpm.status,
  rpm.issued_at,
  rpm.disabled_at,
  rpm.created_at,
  rpm.updated_at,
  (rpm.billing_key_encrypted IS NOT NULL) AS billing_key_configured
FROM recurring_payment_methods rpm
JOIN users u ON u.id = rpm.user_id
WHERE u.email = 'lsw_28@naver.com'
ORDER BY rpm.is_default DESC,
         rpm.updated_at DESC NULLS LAST;
```

## 6. lsw@naver.com soft delete 점검 절차

`lsw@naver.com`은 삭제 요청 대상이지만 hard delete를 실행하지 않는다. 운영자는 먼저 아래 조회로 범위를 확인한 뒤, 별도 승인된 soft delete 절차에서 sessions, auth credentials, subscription, payment method, entitlement 상태를 비활성화한다.

```sql
SELECT id, email, name, nickname, plan, created_at, updated_at, last_login_at
  FROM users
 WHERE email = 'lsw@naver.com';

SELECT s.id, s.plan, s.status, s.current_period_start, s.current_period_end,
       s.cancel_at_period_end, s.ended_at, s.updated_at
  FROM subscriptions s
  JOIN users u ON u.id = s.user_id
 WHERE u.email = 'lsw@naver.com'
 ORDER BY s.updated_at DESC NULLS LAST;

SELECT ue.id, ue.plan, ue.source, ue.valid_from, ue.valid_until, ue.updated_at
  FROM user_entitlements ue
  JOIN users u ON u.id = ue.user_id
 WHERE u.email = 'lsw@naver.com'
 ORDER BY ue.updated_at DESC NULLS LAST;

SELECT p.id, p.plan, p.amount, p.currency, p.status, p.subscription_id,
       p.requested_at, p.approved_at, p.canceled_at, p.created_at
  FROM payments p
  JOIN users u ON u.id = p.user_id
 WHERE u.email = 'lsw@naver.com'
 ORDER BY COALESCE(p.approved_at, p.requested_at, p.created_at) DESC NULLS LAST;

SELECT rpm.id, rpm.provider, rpm.method_type, rpm.display_label,
       rpm.card_company, rpm.card_last4, rpm.masked_card_number,
       rpm.is_default, rpm.status, rpm.issued_at, rpm.disabled_at,
       (rpm.billing_key_encrypted IS NOT NULL) AS billing_key_configured
  FROM recurring_payment_methods rpm
  JOIN users u ON u.id = rpm.user_id
 WHERE u.email = 'lsw@naver.com'
 ORDER BY rpm.updated_at DESC NULLS LAST;
```

Soft delete 승인 전 확인 항목:

- 사용자 본인/운영자 승인 기록
- 환불/구독 종료 정책 적용 여부
- 결제수단 비활성화 범위
- 세션 무효화 범위
- 문의/결제 감사 기록 보존 범위
- 개인정보 삭제와 회계/분쟁 대응 보존 데이터의 분리 기준
