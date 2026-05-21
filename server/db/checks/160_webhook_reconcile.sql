-- =========================================================
-- Step 160B - FINPLE webhook reconcile / audit queries
-- 목적:
--   Step 160 배포 전에 received로 저장된 Toss Webhook 이벤트를
--   기존 payments 기록과 수동 매칭해 processed 상태로 보정합니다.
--
-- 원칙:
--   payments / subscriptions / user_entitlements는 삭제하지 않습니다.
--   Webhook 이벤트의 paymentKey 또는 orderId가 기존 결제와 명확히 매칭되는 경우에만
--   payment_events.payment_id / subscription_id / user_id를 연결하고 processed로 변경합니다.
--
-- 사용 방법:
--   1) 0번으로 미처리 웹훅 확인
--   2) 1번으로 payload 안의 식별자 확인
--   3) 2번으로 매칭 가능 여부 확인
--   4) 매칭 결과가 맞으면 3번 UPDATE 실행
--   5) 4번으로 처리 결과 확인
-- =========================================================

-- 0. 미처리 Webhook 이벤트 확인
SELECT
  pe.id,
  pe.provider,
  pe.event_id,
  pe.event_type,
  pe.processing_status,
  pe.payment_id,
  pe.subscription_id,
  pe.created_at,
  pe.processed_at,
  pe.payload
FROM payment_events pe
WHERE pe.provider = 'toss-payments'
  AND pe.event_type IN ('PAYMENT_STATUS_CHANGED', 'CANCEL_STATUS_CHANGED')
  AND pe.processing_status = 'received'
ORDER BY pe.created_at DESC;

-- 1. Webhook payload에서 paymentKey / orderId / status 후보 추출
SELECT
  pe.id AS event_row_id,
  pe.event_id,
  pe.event_type,
  pe.processing_status,
  COALESCE(pe.payload #>> '{data,paymentKey}', pe.payload #>> '{paymentKey}') AS payment_key,
  COALESCE(pe.payload #>> '{data,orderId}', pe.payload #>> '{orderId}') AS order_id,
  COALESCE(pe.payload #>> '{data,status}', pe.payload #>> '{status}') AS toss_status,
  pe.created_at
FROM payment_events pe
WHERE pe.provider = 'toss-payments'
  AND pe.event_type IN ('PAYMENT_STATUS_CHANGED', 'CANCEL_STATUS_CHANGED')
ORDER BY pe.created_at DESC
LIMIT 30;

-- 2. 미처리 Webhook과 기존 payments 매칭 가능 여부 확인
WITH webhook_identifiers AS (
  SELECT
    pe.id AS event_row_id,
    pe.event_id,
    pe.event_type,
    pe.processing_status,
    COALESCE(pe.payload #>> '{data,paymentKey}', pe.payload #>> '{paymentKey}') AS payment_key,
    COALESCE(pe.payload #>> '{data,orderId}', pe.payload #>> '{orderId}') AS order_id,
    COALESCE(pe.payload #>> '{data,status}', pe.payload #>> '{status}') AS toss_status,
    pe.created_at
  FROM payment_events pe
  WHERE pe.provider = 'toss-payments'
    AND pe.event_type IN ('PAYMENT_STATUS_CHANGED', 'CANCEL_STATUS_CHANGED')
    AND pe.processing_status = 'received'
)
SELECT
  wi.event_row_id,
  wi.event_id,
  wi.event_type,
  wi.payment_key,
  wi.order_id,
  wi.toss_status,
  p.id AS matched_payment_id,
  p.subscription_id AS matched_subscription_id,
  p.user_id AS matched_user_id,
  p.status AS current_payment_status,
  p.provider_payment_id,
  p.provider_order_id,
  p.created_at AS payment_created_at
FROM webhook_identifiers wi
LEFT JOIN payments p
  ON p.provider = 'toss-payments'
 AND (
   (wi.payment_key IS NOT NULL AND wi.payment_key <> '' AND p.provider_payment_id = wi.payment_key)
   OR
   (wi.order_id IS NOT NULL AND wi.order_id <> '' AND p.provider_order_id = wi.order_id)
 )
ORDER BY wi.created_at DESC;

-- 3. 매칭 가능한 미처리 Webhook을 processed로 보정
WITH webhook_identifiers AS (
  SELECT
    pe.id AS event_row_id,
    pe.event_id,
    pe.event_type,
    COALESCE(pe.payload #>> '{data,paymentKey}', pe.payload #>> '{paymentKey}') AS payment_key,
    COALESCE(pe.payload #>> '{data,orderId}', pe.payload #>> '{orderId}') AS order_id,
    COALESCE(pe.payload #>> '{data,status}', pe.payload #>> '{status}') AS toss_status
  FROM payment_events pe
  WHERE pe.provider = 'toss-payments'
    AND pe.event_type IN ('PAYMENT_STATUS_CHANGED', 'CANCEL_STATUS_CHANGED')
    AND pe.processing_status = 'received'
), matched AS (
  SELECT DISTINCT ON (wi.event_row_id)
    wi.event_row_id,
    wi.event_type,
    wi.toss_status,
    p.id AS payment_id,
    p.subscription_id,
    p.user_id,
    CASE
      WHEN wi.event_type = 'CANCEL_STATUS_CHANGED' THEN 'canceled'
      WHEN UPPER(COALESCE(wi.toss_status, '')) IN ('CANCELED', 'CANCELLED', 'PARTIAL_CANCELED', 'PARTIAL_CANCELLED') THEN 'canceled'
      WHEN UPPER(COALESCE(wi.toss_status, '')) IN ('DONE', 'APPROVED', 'PAID') THEN 'confirmed'
      WHEN UPPER(COALESCE(wi.toss_status, '')) IN ('WAITING_FOR_DEPOSIT', 'IN_PROGRESS', 'READY') THEN 'pending'
      WHEN UPPER(COALESCE(wi.toss_status, '')) IN ('ABORTED', 'EXPIRED', 'FAILED') THEN 'failed'
      ELSE NULL
    END AS next_payment_status
  FROM webhook_identifiers wi
  JOIN payments p
    ON p.provider = 'toss-payments'
   AND (
     (wi.payment_key IS NOT NULL AND wi.payment_key <> '' AND p.provider_payment_id = wi.payment_key)
     OR
     (wi.order_id IS NOT NULL AND wi.order_id <> '' AND p.provider_order_id = wi.order_id)
   )
  ORDER BY wi.event_row_id, p.created_at DESC
), updated_events AS (
  UPDATE payment_events pe
  SET
    user_id = m.user_id,
    payment_id = m.payment_id,
    subscription_id = m.subscription_id,
    processing_status = 'processed',
    processed_at = NOW(),
    payload = COALESCE(pe.payload, '{}'::jsonb) || jsonb_build_object(
      'finpleReconcile', jsonb_build_object(
        'step', '160B',
        'matched', true,
        'matchedAt', NOW(),
        'nextPaymentStatus', m.next_payment_status
      )
    )
  FROM matched m
  WHERE pe.id = m.event_row_id
  RETURNING pe.id, pe.event_id, pe.event_type, pe.payment_id, pe.subscription_id, pe.processing_status, pe.processed_at
), updated_payments AS (
  UPDATE payments p
  SET
    status = m.next_payment_status,
    metadata = COALESCE(p.metadata, '{}'::jsonb) || jsonb_build_object(
      'lastWebhookReconcileStep', '160B',
      'lastWebhookEventType', m.event_type,
      'lastWebhookStatus', m.toss_status,
      'lastWebhookReconciledAt', NOW()
    )
  FROM matched m
  WHERE p.id = m.payment_id
    AND m.next_payment_status IS NOT NULL
  RETURNING p.id, p.status
)
SELECT * FROM updated_events;

-- 4. 보정 후 Webhook 처리 상태 확인
SELECT
  pe.provider,
  pe.event_id,
  pe.event_type,
  pe.processing_status,
  pe.payment_id,
  pe.subscription_id,
  pe.created_at,
  pe.processed_at
FROM payment_events pe
WHERE pe.provider = 'toss-payments'
  AND pe.event_type IN ('PAYMENT_STATUS_CHANGED', 'CANCEL_STATUS_CHANGED')
ORDER BY pe.created_at DESC
LIMIT 30;
