-- =========================================================
-- Step 156 - FINPLE payment/subscription audit queries
-- Supabase SQL Editor에서 필요한 블록만 복사해 실행하세요.
-- 모든 쿼리는 조회용 SELECT입니다.
-- =========================================================

-- 0. 최근 결제 대상 사용자 확인
-- 특정 이메일만 보고 싶으면 WHERE u.email = 'your@email.com' 조건을 추가하세요.
SELECT
  u.id AS user_id,
  u.email,
  u.name,
  u.plan AS users_plan,
  ue.plan AS entitlement_plan,
  ue.source AS entitlement_source,
  ue.valid_from,
  ue.valid_until,
  ue.updated_at AS entitlement_updated_at
FROM users u
LEFT JOIN user_entitlements ue ON ue.user_id = u.id
ORDER BY COALESCE(ue.updated_at, u.updated_at, u.created_at) DESC
LIMIT 20;

-- 1. 최근 결제 기록 확인
-- 기대값: 테스트 결제 1건당 payments 1건, status = confirmed, amount = 9900
SELECT
  p.id AS payment_id,
  u.email,
  p.plan,
  p.amount,
  p.currency,
  p.status,
  p.provider,
  p.provider_order_id,
  p.provider_payment_id,
  p.receipt_url,
  p.requested_at,
  p.created_at
FROM payments p
LEFT JOIN users u ON u.id = p.user_id
WHERE p.provider = 'toss-payments'
ORDER BY p.created_at DESC
LIMIT 30;

-- 2. 구독 상태 확인
-- 기대값: 최신 구독 status = active, plan = personal, current_period_end가 약 1개월 뒤
SELECT
  s.id AS subscription_id,
  u.email,
  s.plan,
  s.status,
  s.provider,
  s.provider_subscription_id,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.ended_at,
  s.created_at,
  s.updated_at
FROM subscriptions s
LEFT JOIN users u ON u.id = s.user_id
WHERE s.provider = 'toss-payments'
ORDER BY s.created_at DESC
LIMIT 30;

-- 3. 사용자 권한 반영 확인
-- 기대값: 결제 완료 사용자는 users.plan = personal, user_entitlements.plan = personal
SELECT
  u.id AS user_id,
  u.email,
  u.name,
  u.plan AS users_plan,
  ue.plan AS entitlement_plan,
  ue.portfolio_limit,
  ue.assets_per_portfolio_limit,
  ue.server_storage_enabled,
  ue.api_lookup_limit_per_day,
  ue.pdf_report_enabled,
  ue.report_level,
  ue.screener_level,
  ue.support_level,
  ue.source,
  ue.valid_from,
  ue.valid_until,
  ue.updated_at
FROM users u
LEFT JOIN user_entitlements ue ON ue.user_id = u.id
ORDER BY COALESCE(ue.updated_at, u.updated_at, u.created_at) DESC
LIMIT 30;

-- 4. 결제 이벤트 로그 확인
-- 기대값: payment.confirmed 이벤트가 confirmed 상태로 기록되고 payment/subscription과 연결
SELECT
  pe.id AS event_row_id,
  u.email,
  pe.provider,
  pe.event_id,
  pe.event_type,
  pe.processing_status,
  pe.payment_id,
  pe.subscription_id,
  pe.processed_at,
  pe.created_at
FROM payment_events pe
LEFT JOIN users u ON u.id = pe.user_id
WHERE pe.provider = 'toss-payments'
ORDER BY pe.created_at DESC
LIMIT 50;

-- 5. 중복 결제/중복 승인 여부 확인
-- 기대값: duplicate_count가 2 이상인 행이 없어야 함
SELECT
  provider,
  provider_payment_id,
  provider_order_id,
  COUNT(*) AS duplicate_count,
  MIN(created_at) AS first_created_at,
  MAX(created_at) AS last_created_at
FROM payments
WHERE provider = 'toss-payments'
GROUP BY provider, provider_payment_id, provider_order_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, last_created_at DESC;

-- 6. 한 화면 요약 점검
-- 기대값: payment_status = confirmed, subscription_status = active, entitlement_plan = personal
SELECT
  u.email,
  u.name,
  u.plan AS users_plan,
  ue.plan AS entitlement_plan,
  ue.valid_until AS entitlement_valid_until,
  s.plan AS subscription_plan,
  s.status AS subscription_status,
  s.current_period_end,
  p.plan AS payment_plan,
  p.status AS payment_status,
  p.amount,
  p.provider_order_id,
  p.provider_payment_id,
  p.created_at AS payment_created_at
FROM payments p
LEFT JOIN users u ON u.id = p.user_id
LEFT JOIN subscriptions s ON s.id = p.subscription_id
LEFT JOIN user_entitlements ue ON ue.user_id = p.user_id
WHERE p.provider = 'toss-payments'
ORDER BY p.created_at DESC
LIMIT 20;
