# FINPLE TSC-4D — Private KIS Completed-Bar Shadow Feed

Date: 2026-08-05  
Scope: representative-only Trading Lab  
Status: implementation and review only; no provider activation or Production change

## 1. Purpose

TSC-4D connects the existing KIS overseas-stock realtime trade/quote adapter and one-minute aggregator to the TSC-4C private Shadow runtime.

The runner:

1. verifies a time-boxed read-only approval receipt;
2. requires an already-running Shadow run backed by an immutable approved strategy version;
3. requests an ephemeral KIS WebSocket approval key;
4. subscribes only to the approved leveraged/inverse ETF symbols;
5. normalizes trade and best-bid/ask events without storing raw provider payloads;
6. aggregates completed one-minute bars;
7. emits a Shadow cycle only when every selected symbol has a completed regular-session bar with a sufficiently fresh quote;
8. drops incomplete cycles instead of forward filling;
9. records virtual-only performance through the existing Shadow worker.

No order, account, balance, position, cancellation, or modification call is introduced.

## 2. Read-only approval gate

Provider calls require all of the following:

- explicit Admin Console start action;
- `FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED=true`;
- configured `KIS_TRADING_APP_KEY` and `KIS_TRADING_APP_SECRET`;
- non-expired approval metadata;
- scope exactly `trading_read_only_market_data`;
- environment exactly `virtual_shadow`;
- base URL exactly `https://openapi.koreainvestment.com:9443`;
- allowed scopes containing:
  - `current_quotes`
  - `market_session_state`
  - `provider_rate_limit_state`
- forbidden actions containing:
  - `order_submission`
  - `order_cancellation`
  - `position_mutation`
  - `live_trading_endpoint`
  - `raw_provider_response_persistence`

Approval metadata is read from environment at runtime and returned only as a redacted status. Credential values and the raw approval receipt are not returned or persisted.

### Approval metadata variables

```text
FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED
FINPLE_TRADING_READ_ONLY_APPROVAL_ID
FINPLE_TRADING_READ_ONLY_APPROVED_BY
FINPLE_TRADING_READ_ONLY_APPROVED_AT
FINPLE_TRADING_READ_ONLY_EXPIRES_AT
FINPLE_TRADING_READ_ONLY_SCOPE
FINPLE_TRADING_READ_ONLY_ENVIRONMENT
FINPLE_TRADING_READ_ONLY_BASE_URL
FINPLE_TRADING_READ_ONLY_ACCOUNT_ID_HASH
FINPLE_TRADING_READ_ONLY_ALLOWED_SCOPES
FINPLE_TRADING_READ_ONLY_FORBIDDEN_ACTIONS
FINPLE_TRADING_READ_ONLY_EVIDENCE_TICKET
FINPLE_TRADING_READ_ONLY_REVOCATION_PLAN
FINPLE_TRADING_READ_ONLY_REDACTION_VERSION
```

This PR does not set or change any value.

## 3. Completed-bar contract

The runner uses the existing TSC-2 components:

- `HDFSCNT0` overseas-stock realtime trades;
- `HDFSASP0` US best bid/ask;
- one-minute aggregation by received event time;
- no raw frame persistence;
- no empty-bar forward fill.

For each selected symbol, a completed bar must contain:

- positive OHLC values;
- non-negative volume;
- a valid latest bid/ask quote;
- quote age within the configured threshold;
- New York regular-session timestamp.

A multi-symbol minute is submitted to Shadow only when all selected symbols are present. Otherwise the minute is recorded as incomplete and discarded after the lag tolerance.

## 4. Session handling

Regular-session state is derived using `America/New_York`, independent of the server timezone.

```text
regular open: 09:30 ET
regular close: 16:00 ET
```

Pre-market, after-hours, weekends, closed-session data, stale quotes, and incomplete multi-symbol minutes do not enter the Shadow performance ledger.

## 5. Model-signal boundary

TSC-4D supplies market data, not an external prediction model.

When an approved strategy has `requireModelSignal=true` and no model-signal provider is connected:

- KIS events may be received;
- one-minute bars may be completed;
- Shadow cycles may be recorded;
- new entry decisions remain blocked by the TSC-1 model-signal requirement.

The Admin Console displays this state explicitly. TSC-4D does not silently substitute a deterministic baseline for an approved external model.

## 6. Admin Console

The private Shadow panel now shows:

- Shadow run state;
- KIS feed connection state;
- read-only approval identifier and expiry;
- feature-flag and credential-presence checks;
- active approved strategy and selected symbols;
- provider event count;
- completed one-minute bar count;
- completed synchronized cycle count;
- incomplete-cycle count;
- last completed minute;
- external-model availability warning;
- start and stop controls.

The Shadow run cannot be stopped while the KIS feed is active. The feed must be stopped first.

## 7. Safety invariants

Always false:

```text
accountCallsAllowed
brokerOrderAdapterPresent
orderSubmissionAllowed
liveActivationAllowed
credentialsExposed
credentialsPersisted
rawProviderPayloadStored
forwardFillUsed
```

The Admin API exposes only:

```text
GET  /api/admin/trading-readiness/scalping-shadow-feed
POST /api/admin/trading-readiness/scalping-shadow-feed/start
POST /api/admin/trading-readiness/scalping-shadow-feed/stop
```

There is no public route, cycle-ingestion route, account route, or order route.

## 8. Activation boundary

This PR does not perform:

- KIS approval-key request;
- KIS WebSocket connection;
- environment or secret mutation;
- Production deployment or promotion;
- account or balance query;
- paper or live order submission;
- database migration;
- background worker scheduling.

A later operator-approved activation step must verify approval expiry, credential scope, Render runtime readiness, model-signal policy, market hours, and emergency stop procedures before any provider call.

## 9. Next step

TSC-4E should add operational controls around the feed runner:

- heartbeat and stale-feed watchdog;
- reconnect/circuit-breaker metrics;
- trading-day calendar and early-close handling;
- restart-safe run recovery;
- operator alerting;
- bounded read-only activation runbook.

It must remain Shadow-only and must not add order capability.
