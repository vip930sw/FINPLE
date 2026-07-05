# Duplicate Subscription Review Runbook

This runbook is for operator review only. Do not run production writes from this document.

## Policy

- Do not hard delete users, subscriptions, payments, or payment methods.
- Do not auto-refund or auto-cancel duplicated payments from the app patch.
- Do not call Toss Payments cancel APIs automatically from duplicate detection.
- Treat subscription cancellation as stopping the next renewal while keeping the already-paid access period available until period end.
- Treat duplicate or error payments as support cases that require operator review before refund or cancellation decisions.

## Toss Payment Cancellation Design

- Card and recurring-payment refunds are handled as payment cancellations in Toss Payments.
- The Toss API shape is `POST /v1/payments/{paymentKey}/cancel`.
- `cancelReason` is required.
- Omit `cancelAmount` for a full cancellation, or send it for a partial cancellation.
- Send an `Idempotency-Key` header to prevent duplicate cancellation attempts.
- Successful cancellation responses include cancellation history in the Payment object's `cancels` array.
- Virtual-account refunds may require `refundReceiveAccount`; FINPLE Personal card recurring payments normally do not use that path.

Current FINPLE policy for this patch:

- `POST /api/admin/payments/:paymentId/refund-preview` is admin-only and dry-run only.
- The preview endpoint must not call Toss.
- The actual refund endpoint remains disabled or future-work only until a separate operator approval step is opened.

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

```sql
WITH target_user AS (
  SELECT id
  FROM users
  WHERE email = 'vip930sw@gmail.com'
),
candidate_payments AS (
  SELECT p.*,
         COALESCE(p.paid_at, p.requested_at, p.created_at) AS payment_at
  FROM payments p
  JOIN target_user tu ON tu.id = p.user_id
  WHERE p.status IN ('paid', 'confirmed')
)
SELECT user_id,
       plan,
       amount,
       DATE_TRUNC('day', payment_at) AS payment_day,
       COUNT(*) AS payment_count,
       ARRAY_AGG(id ORDER BY payment_at DESC) AS payment_ids,
       ARRAY_AGG(provider_payment_id ORDER BY payment_at DESC) AS provider_payment_ids,
       ARRAY_AGG(provider_order_id ORDER BY payment_at DESC) AS provider_order_ids
FROM candidate_payments
GROUP BY user_id, plan, amount, DATE_TRUNC('day', payment_at)
HAVING COUNT(*) > 1
ORDER BY payment_day DESC;
```

## Review Steps

1. Confirm the user id and email in `users`.
2. Compare active or `cancel_at_period_end` subscriptions with future `current_period_end`.
3. Compare confirmed payments by `provider_payment_id`, `provider_order_id`, amount, and payment timestamp.
4. Confirm whether payment rows map to duplicated subscription periods.
5. Decide refund or cancellation outside the app patch through the approved payment operations procedure.
6. Record the operator decision and support ticket reference outside source code.
