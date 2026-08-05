# FINPLE Trading Lab TSC-4F — External Model Signal Contract and Health Boundary

Date: 2026-08-05  
Scope: representative-only private Trading Lab  
Status: adapter contract and deterministic validation only; no external model, KIS, account, order, or Production activation

## 1. Purpose

TSC-1 defaults to `requireModelSignal=true`. The existing KIS completed-bar Shadow feed may collect market data and create synchronized one-minute cycles, but it must not create a new entry when a valid external model signal is absent.

TSC-4F defines the strict boundary between a future model provider and the existing deterministic strategy:

```text
completed one-minute bar
→ typed model-signal request
→ external provider
→ schema, identity, timestamp, causal-cutoff, latency, freshness validation
→ valid signal or null
→ TSC-1 entry gate
```

A missing or invalid signal is not bearish, neutral, or a deterministic substitute. It is `signal unavailable`, and new entry remains blocked.

## 2. Typed signal schema

Schema version:

```text
scalping-model-signal-v1
```

Required fields:

```json
{
  "signalVersion": "scalping-model-signal-v1",
  "symbol": "TQQQ",
  "timestamp": "2026-08-05T13:35:00.000Z",
  "probabilityUp": 0.67,
  "expectedReturnBps": 18,
  "confidence": 0.74,
  "horizonMinutes": 5,
  "regime": "intraday_bull",
  "modelId": "finple-scalping-model",
  "modelVersion": "model-v1",
  "modelChecksum": "sha256:model-v1",
  "generatedAt": "2026-08-05T13:36:01.000Z",
  "dataCutoff": "2026-08-05T13:36:00.000Z",
  "provenanceId": "signal-receipt-1"
}
```

The adapter returns only the normalized allowlisted fields. It does not retain unrestricted provider responses.

## 3. Causal and timestamp contract

For a one-minute bar beginning at `T` and ending at `T+1m`:

- `symbol` must match the requested symbol;
- `timestamp` must match the bar start exactly;
- `dataCutoff <= bar.minuteEnd`;
- `generatedAt >= dataCutoff`;
- `generatedAt` may not materially predate completed-bar availability;
- default signal latency is at most 5 seconds after bar completion;
- default wall-clock signal age is at most 20 seconds;
- duplicate and out-of-order requests are rejected per symbol.

Fail-closed reason examples:

```text
future_data_cutoff
signal_latency_exceeded
signal_stale
signal_symbol_mismatch
signal_timestamp_mismatch
model_id_mismatch
model_version_mismatch
model_checksum_mismatch
duplicate_model_signal_request
out_of_order_model_signal_request
```

## 4. Model identity

A future approved strategy or private worker may pin:

- `modelId`;
- `modelVersion`;
- `modelChecksum`.

A provider response that does not match the pinned identity is rejected. A model deployment change therefore requires a new reviewed identity rather than silently replacing the active model.

## 5. Health and circuit breaker

Adapter states:

```text
unavailable
standby
healthy
degraded
tripped
```

Tracked counters:

- requests;
- accepted signals;
- missing signals;
- provider errors;
- invalid signals;
- stale or excessive-latency signals;
- causal violations;
- symbol and timestamp mismatches;
- model-identity mismatches;
- duplicate or out-of-order requests;
- circuit-breaker blocks.

Default circuit-breaker threshold:

```text
5 consecutive failures
```

After a trip:

- subsequent model requests return `null`;
- new entries remain blocked by the existing TSC-1 model requirement;
- no heuristic signal is substituted;
- no automatic reset is performed;
- an operator-controlled acknowledgement/reset is required in the owning private runtime.

Risk-reducing position exits remain a separate strategy path and are not converted into new entries by this adapter.

## 6. Replay fixture contract

Historical model signals use:

```text
scalping-model-signal-replay-fixture-v1
```

Required provenance:

- dataset ID;
- source revision;
- model checksum;
- fixture checksum;
- `immutable=true`.

Replay validation disables only wall-clock freshness. Symbol matching, timestamp matching, model identity, and causal data cutoff remain mandatory. Future leakage and missing-signal substitution remain forbidden.

A deterministic fixture provider is included for unit tests and later historical replay integration. It is not an external production model.

## 7. Safety invariants

Always enforced:

```text
entrySignalFailClosed = true
missingSignalSubstitutionAllowed = false
heuristicFallbackAllowed = false
automaticLiveActivationAllowed = false
orderSubmissionAllowed = false
credentialsPersisted = false
rawProviderPayloadStored = false
futureLeakageAllowed = false
```

This stage performs:

- no external model API call;
- no OpenAI API call;
- no KIS activation;
- no environment or secret mutation;
- no database migration;
- no account or balance access;
- no order, cancellation, or modification;
- no automatic Live activation;
- no Production deployment or promotion.

## 8. Integration boundary

The existing KIS completed-bar runner already accepts an injected `modelSignalProvider`. This adapter is the validation and health wrapper that a later private runtime wiring step must place between that provider and the runner.

The current PR intentionally does not configure a real provider endpoint or credentials. Until a separately approved provider is wired through this adapter, `requireModelSignal=true` continues to block new entries.

## 9. Next steps

1. wire the adapter into the private Shadow runner and expose sanitized model health in `/ADMIN`;
2. define the approved model identity and credential boundary;
3. run immutable historical signal replay without future leakage;
4. perform a bounded live-market Shadow pilot with no orders;
5. collect at least 60 trading sessions and 100 completed virtual trades;
6. only after manual evidence review, begin separate TSC-5 Live guarded design and TSC-6 Private Worker implementation.
