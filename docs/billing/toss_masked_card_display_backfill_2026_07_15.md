# Toss masked card display backfill

이 문서는 카드사 심사용 테스트 결제수단 1건의 안전한 표시 필드만 보정하는 운영 절차다. 사용자 ID와 recurring payment method ID를 운영자가 직접 확인해 넣어야 하며, 이메일·billingKey·카드번호 원문은 사용하지 않는다.

## 1. 실행 전 조회

아래 두 자리표시자를 실제 UUID로 바꾼 뒤 대상이 정확히 1행인지 확인한다.

```sql
SELECT id, user_id, provider, status, is_default,
       display_label, card_company, card_last4, masked_card_number,
       issued_at, updated_at
FROM recurring_payment_methods
WHERE user_id = '<TARGET_USER_ID>'::uuid
  AND id = '<TARGET_PAYMENT_METHOD_ID>'::uuid
  AND provider = 'toss-payments';
```

0행 또는 2행 이상이면 중단한다. `card_company`가 우리카드 계열이고 운영 증빙의 마스킹 값이 `53872082****912*`와 일치하는지도 별도로 확인한다.

## 2. 트랜잭션 백필

```sql
BEGIN;

SELECT id, user_id, provider, status, is_default,
       display_label, card_company, card_last4, masked_card_number
FROM recurring_payment_methods
WHERE user_id = '<TARGET_USER_ID>'::uuid
  AND id = '<TARGET_PAYMENT_METHOD_ID>'::uuid
  AND provider = 'toss-payments'
FOR UPDATE;

UPDATE recurring_payment_methods
SET display_label = '우리카드 · **** 912*',
    card_company = '우리카드',
    card_last4 = NULL,
    masked_card_number = '53872082****912*',
    updated_at = NOW()
WHERE user_id = '<TARGET_USER_ID>'::uuid
  AND id = '<TARGET_PAYMENT_METHOD_ID>'::uuid
  AND provider = 'toss-payments'
RETURNING id, user_id, provider, display_label, card_company,
          card_last4, masked_card_number, updated_at;

SELECT id, user_id, provider, display_label, card_company,
       card_last4, masked_card_number, updated_at
FROM recurring_payment_methods
WHERE user_id = '<TARGET_USER_ID>'::uuid
  AND id = '<TARGET_PAYMENT_METHOD_ID>'::uuid
  AND provider = 'toss-payments';

-- 반환값이 정확히 1행이고 아래 조건을 모두 만족할 때만 실행한다.
-- display_label = '우리카드 · **** 912*'
-- masked_card_number = '53872082****912*'
-- card_last4 IS NULL
-- COMMIT;

-- 행 또는 값이 다르면 실행한다.
-- ROLLBACK;
```

## 3. 실행 후 확인

1. `COMMIT` 전에 반환 행과 사용자 ID, payment method ID를 다시 대조한다.
2. `COMMIT` 후 동일한 SELECT를 재실행한다.
3. 대상 사용자의 MY PAGE에서 `우리카드 · **** 912*`가 표시되는지 확인한다.
4. 다른 사용자의 결제수단 및 다른 recurring payment method 행이 변경되지 않았는지 확인한다.
