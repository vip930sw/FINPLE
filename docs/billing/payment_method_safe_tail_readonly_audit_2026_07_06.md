# Payment Method Safe Tail Read-only Audit

Date: 2026-07-06

Purpose: confirm whether a trusted safe card tail such as `9121` exists in production billing rows before any manual safe-display-field backfill. Do not use this document to expose raw card numbers, billing keys, customer keys, or provider credentials.

## Why `33 **2912` Was Not Enough

`33` is the Woori card issuer code. A previous display such as `33 **2912` likely came from interpreting a Toss billing authorization response field such as `card.number` as if it were the real card last four digits.

That value is not safe enough to treat as the customer-facing last four digits when the user-confirmed card ending is `9121`. Showing only `우리카드` is safer than showing a wrong or ambiguous card tail.

## Read-only Audit SQL

Set the target email and expected safe tail in the `params` CTE, then run each query in Supabase SQL editor or another read-only SQL console.

```sql
WITH params AS (
  SELECT
    LOWER('vip930sw@gmail.com') AS target_email,
    '9121'::text AS expected_tail,
    '2912'::text AS legacy_tail
),
target_user AS (
  SELECT u.id, u.email, u.name, u.plan, u.created_at, u.updated_at
  FROM users u
  JOIN params p ON LOWER(u.email) = p.target_email
)
SELECT *
FROM target_user;
```

### Stored Payment Method Safe Fields

```sql
WITH params AS (
  SELECT LOWER('vip930sw@gmail.com') AS target_email, '9121'::text AS expected_tail, '2912'::text AS legacy_tail
),
target_user AS (
  SELECT id, email FROM users WHERE LOWER(email) = (SELECT target_email FROM params)
)
SELECT
  rpm.id,
  tu.email,
  rpm.provider,
  rpm.method_type,
  rpm.status,
  rpm.is_default,
  rpm.display_label,
  rpm.card_company,
  rpm.card_last4,
  RIGHT(REGEXP_REPLACE(COALESCE(rpm.masked_card_number, ''), '\D', '', 'g'), 4) AS masked_tail,
  rpm.issued_at,
  rpm.updated_at,
  CASE
    WHEN rpm.card_last4 = (SELECT expected_tail FROM params)
      OR RIGHT(REGEXP_REPLACE(COALESCE(rpm.masked_card_number, ''), '\D', '', 'g'), 4) = (SELECT expected_tail FROM params)
      OR rpm.display_label LIKE '%' || (SELECT expected_tail FROM params)
    THEN 'expected_tail_found'
    WHEN rpm.card_last4 = (SELECT legacy_tail FROM params)
      OR RIGHT(REGEXP_REPLACE(COALESCE(rpm.masked_card_number, ''), '\D', '', 'g'), 4) = (SELECT legacy_tail FROM params)
      OR rpm.display_label LIKE '%' || (SELECT legacy_tail FROM params)
    THEN 'legacy_tail_only'
    ELSE 'tail_missing'
  END AS safe_tail_status
FROM recurring_payment_methods rpm
JOIN target_user tu ON tu.id = rpm.user_id
ORDER BY rpm.is_default DESC, rpm.issued_at DESC NULLS LAST, rpm.updated_at DESC NULLS LAST;
```

### Confirmed Payments Safe Metadata Candidates

This query extracts only safe tail candidates. It does not return raw metadata.

```sql
WITH params AS (
  SELECT LOWER('vip930sw@gmail.com') AS target_email, '9121'::text AS expected_tail, '2912'::text AS legacy_tail
),
target_user AS (
  SELECT id, email FROM users WHERE LOWER(email) = (SELECT target_email FROM params)
),
payment_candidates AS (
  SELECT
    p.id,
    p.user_id,
    p.status,
    p.provider,
    p.provider_payment_id IS NOT NULL AS has_provider_payment_id,
    p.provider_order_id IS NOT NULL AS has_provider_order_id,
    p.amount,
    p.currency,
    COALESCE(p.paid_at, p.requested_at, p.created_at) AS payment_at,
    p.metadata #>> '{card,issuerCode}' AS card_issuer_code,
    p.metadata #>> '{card,company}' AS card_company,
    RIGHT(REGEXP_REPLACE(COALESCE(p.metadata #>> '{card,last4}', ''), '\D', '', 'g'), 4) AS card_last4_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(p.metadata #>> '{card,lastFourDigits}', ''), '\D', '', 'g'), 4) AS card_last_four_digits_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(p.metadata #>> '{card,number}', ''), '\D', '', 'g'), 4) AS card_number_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(p.metadata #>> '{payment,card,number}', ''), '\D', '', 'g'), 4) AS payment_card_number_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(p.metadata #>> '{providerResponse,card,number}', ''), '\D', '', 'g'), 4) AS provider_response_card_number_tail
  FROM payments p
  JOIN target_user tu ON tu.id = p.user_id
  WHERE p.provider = 'toss-payments'
    AND p.status = 'confirmed'
)
SELECT
  pc.*,
  CASE
    WHEN (SELECT expected_tail FROM params) IN (
      pc.card_last4_tail,
      pc.card_last_four_digits_tail,
      pc.card_number_tail,
      pc.payment_card_number_tail,
      pc.provider_response_card_number_tail
    ) THEN 'expected_tail_found'
    WHEN (SELECT legacy_tail FROM params) IN (
      pc.card_last4_tail,
      pc.card_last_four_digits_tail,
      pc.card_number_tail,
      pc.payment_card_number_tail,
      pc.provider_response_card_number_tail
    ) THEN 'legacy_tail_only'
    ELSE 'tail_missing'
  END AS safe_tail_status
FROM payment_candidates pc
ORDER BY pc.payment_at DESC NULLS LAST
LIMIT 20;
```

### Payment Events Safe Payload Candidates

This query extracts only safe tail candidates from event payloads. It does not return raw payload, billing keys, or customer keys.

```sql
WITH params AS (
  SELECT LOWER('vip930sw@gmail.com') AS target_email, '9121'::text AS expected_tail, '2912'::text AS legacy_tail
),
target_user AS (
  SELECT id, email FROM users WHERE LOWER(email) = (SELECT target_email FROM params)
),
event_candidates AS (
  SELECT
    pe.id,
    pe.user_id,
    pe.event_type,
    pe.processing_status,
    pe.processed_at,
    pe.payload #>> '{providerResponse,card,issuerCode}' AS provider_response_issuer_code,
    pe.payload #>> '{providerResponse,card,company}' AS provider_response_card_company,
    RIGHT(REGEXP_REPLACE(COALESCE(pe.payload #>> '{providerResponse,card,last4}', ''), '\D', '', 'g'), 4) AS provider_response_last4_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(pe.payload #>> '{providerResponse,card,lastFourDigits}', ''), '\D', '', 'g'), 4) AS provider_response_last_four_digits_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(pe.payload #>> '{providerResponse,card,number}', ''), '\D', '', 'g'), 4) AS provider_response_number_tail,
    RIGHT(REGEXP_REPLACE(COALESCE(pe.payload #>> '{card,number}', ''), '\D', '', 'g'), 4) AS card_number_tail
  FROM payment_events pe
  JOIN target_user tu ON tu.id = pe.user_id
  WHERE pe.provider = 'toss-payments'
    AND pe.processing_status IN ('confirmed', 'processed')
)
SELECT
  ec.*,
  CASE
    WHEN (SELECT expected_tail FROM params) IN (
      ec.provider_response_last4_tail,
      ec.provider_response_last_four_digits_tail,
      ec.provider_response_number_tail,
      ec.card_number_tail
    ) THEN 'expected_tail_found'
    WHEN (SELECT legacy_tail FROM params) IN (
      ec.provider_response_last4_tail,
      ec.provider_response_last_four_digits_tail,
      ec.provider_response_number_tail,
      ec.card_number_tail
    ) THEN 'legacy_tail_only'
    ELSE 'tail_missing'
  END AS safe_tail_status
FROM event_candidates ec
ORDER BY ec.processed_at DESC NULLS LAST
LIMIT 30;
```

## Decision Rule

- If `expected_tail_found` appears for `9121`, use that row as evidence for a manual safe-field backfill.
- If only `legacy_tail_only` appears for `2912`, do not display `2912` as the customer's card last four digits.
- If all queries return `tail_missing`, the production DB does not currently contain a trusted `9121` candidate in the checked safe fields.

## Manual Safe-field Backfill Template

Do not run this from Codex. Run only after a human confirms `expected_tail_found` from the read-only audit and records the evidence row id internally.

```sql
BEGIN;

WITH params AS (
  SELECT
    LOWER('vip930sw@gmail.com') AS target_email,
    '9121'::text AS expected_tail,
    '우리카드'::text AS card_company,
    '우리카드 · **** 9121'::text AS display_label,
    '****-****-****-9121'::text AS masked_card_number
),
target_user AS (
  SELECT id FROM users WHERE LOWER(email) = (SELECT target_email FROM params)
),
updated_method AS (
  UPDATE recurring_payment_methods rpm
     SET card_company = (SELECT card_company FROM params),
         card_last4 = (SELECT expected_tail FROM params),
         masked_card_number = (SELECT masked_card_number FROM params),
         display_label = (SELECT display_label FROM params),
         updated_at = NOW()
   WHERE rpm.provider = 'toss-payments'
     AND rpm.user_id = (SELECT id FROM target_user)
     AND rpm.status = 'active'
     AND rpm.is_default = TRUE
  RETURNING rpm.id, rpm.display_label, rpm.card_company, rpm.card_last4, rpm.masked_card_number, rpm.updated_at
)
SELECT * FROM updated_method;

-- Review returned row first.
-- COMMIT;
-- ROLLBACK;
```

Default action: keep the transaction uncommitted until the returned row is reviewed. If there is any mismatch, run `ROLLBACK`.
