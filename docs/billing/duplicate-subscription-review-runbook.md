# Duplicate Subscription Review Runbook

This runbook is for operator review only. Do not run production writes from this document.

## Policy

- Do not hard delete users, subscriptions, payments, or payment methods.
- Do not auto-refund or auto-cancel duplicated payments from the app patch.
- Treat subscription cancellation as stopping the next renewal while keeping the already-paid access period available until period end.
- Treat duplicate or error payments as support cases that require operator review before refund or cancellation decisions.

## User-Facing Guidance

- Subscription cancellation stops automatic renewal from the next billing cycle.
- The already-paid access period remains available until the current period end.
- Refunds for duplicated payments or system errors should be handled through payment support after operator review.
- Refunds for simple change of mind, non-use, or partial use may be limited after digital features are activated.

## Read-Only SQL

Replace the email value with the target account. These queries are read-only.

```sql
WITH target_user AS (
  SELECT id, email, name, nickname, plan, created_at, updated_at, last_login_at
  FROM users
  WHERE email = 'vip930sw@gmail.com'
)
SELECT * FROM target_user;
```

```sql
WITH target_user AS (
  SELECT id
  FROM users
  WHERE email = 'vip930sw@gmail.com'
)
SELECT s.*
FROM subscriptions s
JOIN target_user tu ON tu.id = s.user_id
ORDER BY COALESCE(s.current_period_end, s.started_at, s.created_at) DESC NULLS LAST;
```

```sql
WITH target_user AS (
  SELECT id
  FROM users
  WHERE email = 'vip930sw@gmail.com'
)
SELECT p.*
FROM payments p
JOIN target_user tu ON tu.id = p.user_id
ORDER BY COALESCE(p.paid_at, p.requested_at, p.created_at) DESC NULLS LAST;
```

```sql
WITH target_user AS (
  SELECT id
  FROM users
  WHERE email = 'vip930sw@gmail.com'
)
SELECT rpm.id,
       rpm.user_id,
       rpm.provider,
       rpm.method_type,
       rpm.display_label,
       rpm.card_company,
       rpm.card_last4,
       rpm.is_default,
       rpm.status,
       rpm.issued_at,
       rpm.disabled_at,
       rpm.created_at,
       rpm.updated_at
FROM recurring_payment_methods rpm
JOIN target_user tu ON tu.id = rpm.user_id
ORDER BY rpm.is_default DESC, rpm.issued_at DESC NULLS LAST, rpm.updated_at DESC NULLS LAST;
```

## Review Steps

1. Confirm the user id and email in `users`.
2. Compare active or `cancel_at_period_end` subscriptions with future `current_period_end`.
3. Compare confirmed payments by `provider_payment_id`, `provider_order_id`, amount, and payment timestamp.
4. Confirm whether payment rows map to duplicated subscription periods.
5. Decide refund or cancellation outside the app patch through the approved payment operations procedure.
6. Record the operator decision and support ticket reference outside source code.
