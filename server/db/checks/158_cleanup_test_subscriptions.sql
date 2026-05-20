-- =========================================================
-- Step 158 - FINPLE test subscription cleanup
-- 목적:
--   테스트 결제를 여러 번 진행하면서 같은 사용자에게 active subscription이 여러 건 쌓인 경우,
--   최신 1건만 active로 유지하고 이전 active subscription은 superseded로 정리합니다.
--
-- 원칙:
--   payments, payment_events는 삭제하지 않습니다.
--   결제 원장/감사 기록은 보존하고 subscription 상태만 정리합니다.
--
-- 사용 방법:
--   1) 먼저 0, 1번 SELECT로 대상 확인
--   2) 대상이 맞으면 2번 UPDATE 실행
--   3) 3, 4번 SELECT로 결과 확인
--
-- 특정 사용자만 정리하려면 아래 쿼리의 주석 조건을 해제하세요.
--   AND u.email = 'lsw@naver.com'
-- =========================================================

-- 0. 사용자별 active 구독 중복 현황 확인
SELECT
  u.email,
  s.plan,
  s.provider,
  COUNT(*) AS active_subscription_count,
  MIN(s.current_period_start) AS first_period_start,
  MAX(s.current_period_start) AS latest_period_start,
  MAX(s.current_period_end) AS latest_period_end
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.provider = 'toss-payments'
  AND s.plan = 'personal'
  AND s.status = 'active'
  -- AND u.email = 'lsw@naver.com'
GROUP BY u.email, s.plan, s.provider
HAVING COUNT(*) > 1
ORDER BY active_subscription_count DESC, latest_period_start DESC;

-- 1. 정리 대상 상세 확인
-- keep_rank = 1 이 최신 active 구독이며 유지 대상입니다.
-- keep_rank >= 2 는 superseded 처리 대상입니다.
WITH ranked AS (
  SELECT
    s.id,
    u.email,
    s.plan,
    s.status,
    s.provider,
    s.provider_subscription_id,
    s.current_period_start,
    s.current_period_end,
    ROW_NUMBER() OVER (
      PARTITION BY s.user_id, s.plan, s.provider
      ORDER BY s.current_period_start DESC NULLS LAST, s.current_period_end DESC NULLS LAST, s.id DESC
    ) AS keep_rank
  FROM subscriptions s
  JOIN users u ON u.id = s.user_id
  WHERE s.provider = 'toss-payments'
    AND s.plan = 'personal'
    AND s.status = 'active'
    -- AND u.email = 'lsw@naver.com'
)
SELECT *
FROM ranked
ORDER BY email, keep_rank;

-- 2. 이전 active 구독 정리 실행
-- 최신 active 1건만 유지하고 나머지는 superseded로 변경합니다.
-- ended_at은 정리 시각으로 기록하고, cancel_at_period_end는 TRUE로 표시합니다.
WITH ranked AS (
  SELECT
    s.id,
    ROW_NUMBER() OVER (
      PARTITION BY s.user_id, s.plan, s.provider
      ORDER BY s.current_period_start DESC NULLS LAST, s.current_period_end DESC NULLS LAST, s.id DESC
    ) AS keep_rank
  FROM subscriptions s
  JOIN users u ON u.id = s.user_id
  WHERE s.provider = 'toss-payments'
    AND s.plan = 'personal'
    AND s.status = 'active'
    -- AND u.email = 'lsw@naver.com'
), targets AS (
  SELECT id
  FROM ranked
  WHERE keep_rank >= 2
)
UPDATE subscriptions s
SET
  status = 'superseded',
  ended_at = COALESCE(s.ended_at, NOW()),
  cancel_at_period_end = TRUE,
  metadata = COALESCE(s.metadata, '{}'::jsonb) || jsonb_build_object(
    'cleanupStep', '158',
    'cleanupReason', 'test_duplicate_active_subscription',
    'cleanupAt', NOW()
  )
FROM targets t
WHERE s.id = t.id
RETURNING
  s.id,
  s.user_id,
  s.plan,
  s.status,
  s.provider_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.ended_at;

-- 3. 정리 후 active 구독 확인
-- 기대값: 사용자/플랜/provider 조합당 active 1건 이하
SELECT
  u.email,
  s.plan,
  s.status,
  s.provider,
  s.provider_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.ended_at
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.provider = 'toss-payments'
  AND s.plan = 'personal'
  -- AND u.email = 'lsw@naver.com'
ORDER BY u.email, s.status, s.current_period_start DESC NULLS LAST;

-- 4. 결제 원장 보존 확인
-- 기대값: payments는 삭제되지 않고 confirmed 상태로 남아 있어야 합니다.
SELECT
  u.email,
  p.id AS payment_id,
  p.plan,
  p.amount,
  p.status,
  p.provider_order_id,
  p.provider_payment_id,
  p.subscription_id,
  s.status AS linked_subscription_status,
  p.created_at
FROM payments p
JOIN users u ON u.id = p.user_id
LEFT JOIN subscriptions s ON s.id = p.subscription_id
WHERE p.provider = 'toss-payments'
  -- AND u.email = 'lsw@naver.com'
ORDER BY p.created_at DESC;

-- 5. 중복 active 재확인
-- 기대값: no rows returned
SELECT
  u.email,
  s.plan,
  s.provider,
  COUNT(*) AS active_subscription_count
FROM subscriptions s
JOIN users u ON u.id = s.user_id
WHERE s.provider = 'toss-payments'
  AND s.plan = 'personal'
  AND s.status = 'active'
  -- AND u.email = 'lsw@naver.com'
GROUP BY u.email, s.plan, s.provider
HAVING COUNT(*) > 1;
