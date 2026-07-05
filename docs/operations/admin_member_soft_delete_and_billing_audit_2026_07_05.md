# Admin member soft-delete and billing audit SQL

This note is for verification only. Do not run production write queries from this patch.

## Account status audit

```sql
WITH target_users AS (
  SELECT id, email, name, nickname, plan, auth_status, created_at, updated_at, last_login_at
    FROM users
   WHERE LOWER(email) IN (LOWER('lsw_28@naver.com'), LOWER('lsw@naver.com'))
)
SELECT * FROM target_users ORDER BY email;

SELECT u.email,
       s.id,
       s.plan,
       s.status,
       s.current_period_start,
       s.current_period_end,
       s.cancel_at_period_end,
       s.canceled_at,
       s.ended_at,
       s.created_at,
       s.updated_at
  FROM subscriptions s
  JOIN users u ON u.id = s.user_id
 WHERE LOWER(u.email) IN (LOWER('lsw_28@naver.com'), LOWER('lsw@naver.com'))
 ORDER BY u.email, s.current_period_end DESC NULLS LAST, s.created_at DESC;

SELECT u.email,
       ue.user_id,
       ue.plan,
       ue.source,
       ue.valid_from,
       ue.valid_until,
       ue.updated_at
  FROM user_entitlements ue
  JOIN users u ON u.id = ue.user_id
 WHERE LOWER(u.email) IN (LOWER('lsw_28@naver.com'), LOWER('lsw@naver.com'))
 ORDER BY u.email, ue.updated_at DESC NULLS LAST;

SELECT u.email,
       p.id,
       p.provider,
       p.status,
       p.amount,
       p.currency,
       p.paid_at,
       p.requested_at,
       p.created_at
  FROM payments p
  JOIN users u ON u.id = p.user_id
 WHERE LOWER(u.email) IN (LOWER('lsw_28@naver.com'), LOWER('lsw@naver.com'))
 ORDER BY u.email, COALESCE(p.paid_at, p.requested_at, p.created_at) DESC NULLS LAST;

SELECT u.email,
       rpm.id,
       rpm.provider,
       rpm.method_type,
       rpm.display_label,
       rpm.card_company,
       rpm.card_last4,
       rpm.masked_card_number,
       rpm.status,
       rpm.is_default,
       rpm.issued_at,
       rpm.disabled_at,
       rpm.updated_at
  FROM recurring_payment_methods rpm
  JOIN users u ON u.id = rpm.user_id
 WHERE LOWER(u.email) IN (LOWER('lsw_28@naver.com'), LOWER('lsw@naver.com'))
 ORDER BY u.email, rpm.is_default DESC, rpm.issued_at DESC NULLS LAST;
```

## Soft-delete procedure

Use the admin UI delete action only after confirming the target email or user id. The API must mark `users.auth_status = 'admin_deleted'`, set `users.plan = 'free'`, cancel subscriptions, disable recurring payment methods, expire paid entitlements, and revoke sessions. It must not delete rows from `users`, `payments`, `payment_events`, `inquiries`, or usage logs.

`lsw_28@naver.com` is an audit target to keep. `lsw@naver.com` is a deletion-request target, but hard delete is prohibited in this patch.
