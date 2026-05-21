# Step 163 - FINPLE Recurring Billing Policy Draft

## 1. Direction

FINPLE Personal should move from one-time monthly access to billing-key based recurring billing.

Current implementation is closer to a one-time 1-month access grant:

```text
User pays once
→ Toss payment confirmed
→ payments recorded
→ subscriptions current_period_end set about 1 month later
→ user_entitlements changed to personal
```

Target implementation:

```text
User registers a recurring payment method
→ FINPLE stores billingKey/customerKey, not card number
→ FINPLE scheduler charges every billing cycle
→ success extends current_period_end
→ failure enters retry/past_due policy
→ period-end cancellation stops the next charge
```

## 2. Customer notice policy

Before each automatic charge, FINPLE should notify the customer.

Recommended notice schedule:

```text
D-3: upcoming charge notice
D-day: payment success or failure notice
D+1: retry notice after first failure
D+3: final failure / downgrade notice if retry still fails
```

Recommended D-3 notice content:

```text
FINPLE Personal monthly payment is scheduled.
Amount: KRW 9,900
Scheduled date: YYYY-MM-DD
Plan: FINPLE Personal
You can keep using Personal after payment succeeds.
If you do not want renewal, reserve cancellation before the next billing date.
```

Channels:

```text
Phase 1: Email + in-app MY PAGE notice
Phase 2: SMS or Kakao AlimTalk
Phase 3: Kakao social/account integration if needed
```

Notes:

```text
Phone number is needed for SMS/Kakao notification.
Privacy policy and consent screens should disclose phone number collection, notification use, and notification vendor processing if used.
Billing notices should be treated separately from marketing messages.
```

## 3. Refund and cancellation policy

FINPLE's preferred policy:

```text
Monthly digital subscription.
Cancellation does not immediately refund the current paid period.
Personal remains available until current_period_end.
Next payment is stopped after cancellation is reserved.
```

Operational exceptions to keep:

```text
Duplicate payment
Clear overcharge
Service outage or material failure to provide paid function
PG/payment error
FINPLE policy exception after manual review
```

## 4. Failed recurring payment policy

Recommended policy:

```text
D-day automatic charge failed
→ subscription.status = past_due
→ notify customer
→ keep account/data accessible
→ optionally limit new paid actions during grace period

D+1 retry failed
→ notify customer again
→ allow payment method update

D+3 final retry failed
→ subscription.status = payment_failed
→ user_entitlements = free
→ users.plan = free
→ keep portfolio data, but apply Free limits to new usage
```

Recommended retry count:

```text
Attempt 1: billing date
Attempt 2: billing date + 1 day
Attempt 3: billing date + 3 days
```

Recommended abuse control:

```text
No indefinite Personal grace period.
Do not extend current_period_end unless payment succeeds.
Repeated failed billing should not create new active subscriptions.
A failed renewal should not delete user data.
Free plan limits apply after final failure.
```

## 5. Required data fields

Likely additional columns/tables:

```text
billing_methods
- id
- user_id
- provider
- customer_key
- billing_key_encrypted or billing_key_reference
- card_company
- card_last4 or masked_card_number
- is_default
- status
- created_at
- updated_at

auto_billing_jobs
- id
- user_id
- subscription_id
- scheduled_for
- attempt_no
- status
- provider_order_id
- provider_payment_id
- error_code
- error_message
- created_at
- processed_at

billing_notifications
- id
- user_id
- subscription_id
- notification_type
- channel
- status
- scheduled_for
- sent_at
- payload
```

## 6. Next implementation sequence

```text
Step 164: Billing-key DB schema draft
Step 165: Billing auth success/fail pages
Step 166: Toss billingKey issue API integration
Step 167: Store billing method safely
Step 168: Recurring billing scheduler design
Step 169: Renewal success extends subscription
Step 170: Renewal failure retry/past_due policy
Step 171: Notification channel design
Step 172: MY PAGE billing method and next billing display
```
