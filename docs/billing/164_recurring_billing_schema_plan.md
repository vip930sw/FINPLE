# Step 164 - Recurring Billing Schema Plan

## Policy update

FINPLE will use a short retry policy.

```text
D-3: upcoming renewal notice
D-day: renewal attempt and success/failure notice
D+1: one retry only
D+1 retry failure: convert to Free and notify customer
```

There is no D+3 grace stage.

## Tables to add later

### recurring payment reference table

Purpose: store only a PG-issued reference for recurring payment. FINPLE must not store raw payment details.

Suggested fields:

```text
id
user_id
provider
provider_customer_reference
provider_method_reference
display_label
is_default
status
issued_at
disabled_at
metadata
created_at
updated_at
```

### recurring renewal job table

Purpose: schedule and audit renewal attempts.

Suggested fields:

```text
id
user_id
subscription_id
method_reference_id
provider
plan
amount
currency
scheduled_for
attempt_no
status
provider_order_id
provider_transaction_id
error_code
error_message
processed_at
metadata
created_at
updated_at
```

Attempt count is limited to 1 or 2.

```text
1 = billing date attempt
2 = D+1 retry attempt
```

### billing notification table

Purpose: schedule and audit notices.

Suggested fields:

```text
id
user_id
subscription_id
renewal_job_id
notification_type
channel
status
scheduled_for
sent_at
payload
created_at
updated_at
```

Notification types:

```text
upcoming_charge_d3
payment_success
payment_failed_d_day
payment_retry_d1
payment_failed_final_d1
period_end_cancel_scheduled
```

## Subscription fields to add later

```text
recurring_method_reference_id
next_billing_at
last_billing_attempt_at
billing_failure_count
```

## Status policy

```text
active: normal recurring status
cancel_at_period_end: stop next renewal, keep Personal until current_period_end
past_due: D-day failed, D+1 retry waiting
payment_failed: D+1 failed, Free conversion target
expired: period ended
```

## Implementation sequence

```text
Step 165: recurring payment setup pages
Step 166: provider recurring reference issue API
Step 167: safe storage of provider references
Step 168: renewal scheduler skeleton
Step 169: renewal success period extension
Step 170: D-day/D+1 failure handling and Free conversion
Step 171: notification channel integration
Step 172: MY PAGE next billing and payment reference display
```
