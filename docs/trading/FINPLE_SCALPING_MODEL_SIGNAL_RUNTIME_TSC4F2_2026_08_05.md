# FINPLE TSC-4F2 — Model Signal Runtime Wiring

Date: 2026-08-05  
Scope: representative-only private Trading Lab  
Status: implementation and validation only; no external model or Production activation

## 1. Purpose

TSC-4F2 connects the typed TSC-4F model-signal adapter to the private KIS completed-bar Shadow path and exposes sanitized model health in `/ADMIN`.

Runtime path:

```text
completed KIS one-minute bar
→ private process model provider
→ approved model identity and scope
→ typed model-signal adapter
→ causal/freshness/ordering validation
→ valid signal attached to Shadow bar
→ TSC-1 strategy evaluation
```

A missing or invalid signal returns `null`. It is not converted to bearish, neutral, or heuristic input.

## 2. Private provider registration

The model provider cannot be registered through HTTP.

The only registration boundary is the server-internal function:

```text
registerScalpingModelSignalProvider(provider, metadata)
```

The Admin API may read sanitized status and acknowledge a tripped circuit breaker. It cannot upload code, credentials, a model response, or a model identity.

No external model implementation is included in this stage.

## 3. Approved model metadata

The runtime reads reviewed, non-secret metadata only:

```text
FINPLE_TRADING_SCALPING_MODEL_SIGNAL_ENABLED
FINPLE_TRADING_SCALPING_MODEL_ID
FINPLE_TRADING_SCALPING_MODEL_VERSION
FINPLE_TRADING_SCALPING_MODEL_CHECKSUM
FINPLE_TRADING_SCALPING_MODEL_SIGNAL_SCHEMA_VERSION
FINPLE_TRADING_SCALPING_MODEL_APPROVAL_ID
FINPLE_TRADING_SCALPING_MODEL_APPROVED_BY
FINPLE_TRADING_SCALPING_MODEL_APPROVED_AT
FINPLE_TRADING_SCALPING_MODEL_EXPIRES_AT
FINPLE_TRADING_SCALPING_MODEL_ALLOWED_SYMBOLS
FINPLE_TRADING_SCALPING_MODEL_MAX_LATENCY_MS
FINPLE_TRADING_SCALPING_MODEL_MAX_AGE_MS
FINPLE_TRADING_SCALPING_MODEL_MAX_FAILURES
```

This PR does not set or modify any value.

Runtime readiness requires:

- feature enabled;
- an internally registered provider;
- complete model ID, version, and checksum;
- schema `scalping-model-signal-v1`;
- active, unexpired approval metadata;
- approved symbol scope containing every selected strategy symbol.

## 4. Fail-closed behavior

The KIS market-data feed may run without a model provider so that connectivity and completed-bar quality can be observed.

When the approved strategy has `requireModelSignal=true` and the model runtime is not ready:

```text
KIS trade and quote collection may continue
completed one-minute cycles may continue
Shadow accounting may continue
new entry signals remain blocked
risk-reducing exits remain available under the strategy contract
```

The feed runner receives only the validated runtime wrapper. It no longer receives a raw provider callback directly.

## 5. Model circuit breaker

The adapter tracks:

- missing signals;
- provider exceptions;
- invalid schema;
- stale or late signals;
- future-data and causal violations;
- symbol and timestamp mismatch;
- model identity mismatch;
- duplicate and out-of-order requests.

The default threshold is five consecutive failures.

Trip behavior:

```text
model failure threshold reached
→ model runtime state = tripped
→ subsequent model requests return null
→ new entries remain blocked
→ KIS market-data runner is not automatically restarted or promoted
→ Admin acknowledgement is required
```

Acknowledgement clears only the model adapter trip state. It does not activate a model, start KIS, approve a strategy, or authorize an order.

## 6. Admin Console

Adds `모델 신호 상태·진입 차단` to the private AI Trading Admin area.

Displayed fields:

- runtime and provider registration state;
- entry-signal availability;
- approved model ID, version, checksum, and schema;
- approval ID and expiry;
- requests, accepted signals, and latest latency;
- missing, invalid, stale, causal, identity, and ordering counters;
- per-symbol accepted and rejected counts;
- current blocking reasons;
- circuit-breaker trip;
- recent bounded alerts;
- manual acknowledgement control.

Polling interval is five seconds.

Admin-only routes:

```text
GET  /api/admin/trading-readiness/scalping-model-signal
POST /api/admin/trading-readiness/scalping-model-signal/acknowledge
```

There is no model registration, model payload ingestion, account, balance, order, cancellation, modification, or public route.

## 7. Safety invariants

Always false or prohibited:

```text
missingSignalSubstitutionAllowed
heuristicFallbackAllowed
futureLeakageAllowed
rawProviderPayloadStored
credentialsPersisted
accountCallsAllowed
brokerOrderAdapterPresent
orderSubmissionAllowed
automaticLiveActivationAllowed
```

## 8. Not performed

- no external model API call;
- no OpenAI API call;
- no KIS connection or approval-key request;
- no environment or secret mutation;
- no database migration;
- no account or order operation;
- no Production deployment or promotion;
- no background worker scheduling.

## 9. Next stage

After this PR is reviewed and merged, the next separately approved work is:

1. implement or select the actual deterministic short-horizon prediction model;
2. pin its training data revision, feature contract, model checksum, and approval receipt;
3. create immutable historical one-minute model-signal fixtures;
4. run walk-forward replay with actual licensed data;
5. prepare a bounded read-only KIS Shadow pilot;
6. collect at least 60 trading sessions and 100 completed virtual trades before any Live-guarded review.
