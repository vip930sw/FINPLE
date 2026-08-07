# FINPLE TSC-4H2 — KIS Historical Capture and Immutable Research Dataset

Date: 2026-08-05  
Scope: representative-only private Trading Lab  
Status: KIS capture implementation; no Production activation, migration execution, account call, order capability, or model approval

## 1. Decision

The Databento path is retired.

Removed direction:

```text
Databento account
→ paid historical batch
→ external license receipt
→ external raw-file intake
```

New direction:

```text
existing KIS overseas realtime trade + quote feed
→ completed one-minute aggregation
→ complete eight-symbol minute cycle
→ durable normalized PostgreSQL storage
→ manual session sealing
→ immutable KIS raw-data revision
→ TSC-4G model research
```

No Databento, Massive, or Alpaca account, API key, purchase, download, or provider adapter is required by this path.

## 2. Existing KIS foundation reused

The implementation reuses the merged Trading Lab contracts:

- `tradingKisOverseasRealtimeAdapter.js`
- `tradingMinuteBarAggregator.js`
- official US market calendar
- existing read-only KIS approval receipt
- market-data-only credentials
- trade and top-of-book subscriptions
- no raw provider payload persistence
- no account or order endpoints

This is not a new broker connection design. It adds durable research capture to the existing read-only market-data connection.

## 3. Capture-only runtime

A separate Admin runtime starts KIS in `capture_only` mode.

It does not require:

- an active Shadow run;
- an approved strategy version;
- a model provider;
- a model signal;
- a paper order ledger.

It requires:

- explicit Admin start;
- the existing KIS read-only approval receipt;
- `KIS_TRADING_APP_KEY`;
- `KIS_TRADING_APP_SECRET`;
- `KIS_TRADING_BASE_URL` matching the receipt environment;
- `FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT=paper|live` matching the receipt environment;
- `FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED=true`;
- `FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED=true`;
- durable PostgreSQL schema.

`virtual_shadow` uses only the paper REST endpoint `https://openapivts.koreainvestment.com:29443`. `production_live` uses only the live REST endpoint `https://openapi.koreainvestment.com:9443`. The credential marker, receipt base URL, and runtime base URL must all select the same environment; arbitrary endpoints fail closed.

The capture runtime and Shadow runtime must not own the KIS WebSocket at the same time. The process-level KIS connection lease blocks concurrent ownership.

## 4. Universe

Initial symbols:

```text
TQQQ
SQQQ
SOXL
SOXS
UPRO
SPXU
TNA
TZA
```

A complete minute cycle contains exactly one completed one-minute bar for every selected symbol.

No symbol is forward-filled.

If one symbol is missing after the allowed lag, the entire minute is marked incomplete and excluded from the immutable research revision.

## 5. Captured row

Each stored row contains:

```text
provider = KIS
symbol
minute start / end
US session date
OHLCV
trade count
bid / ask
optional bid / ask size
spread in basis points
source
calendar version
row checksum
capture timestamp
```

Not stored:

```text
raw WebSocket frame
approval key
app key
app secret
account identifier
balance
position
order payload
```

## 6. Durable storage

Migration:

```text
server/migrations/20260805_trading_kis_historical_capture.sql
```

Tables:

```text
trading_kis_market_data_minutes
trading_kis_market_data_revisions
```

Minute rows are immutable by provider, symbol, and minute start.

An identical duplicate is idempotent.

A different checksum for an existing minute fails with:

```text
KIS_CAPTURE_IMMUTABILITY_CONFLICT
```

Memory fallback is permitted for tests and preview inspection only. It is explicitly marked `memory_ephemeral` and cannot become model-research ready.

## 7. Manual session sealing

The operator manually seals a completed session after capture has stopped or the market session is complete.

The revision includes:

```text
provider = KIS
datasetId
sourceRevision
rawDataChecksum
calendarVersion
licensePolicyId
selectedSymbols
row count
expected rows
complete minute count
coverage ratio
immutable = true
```

TSC-4G-compatible provenance:

```text
datasetId
sourceRevision
rawDataChecksum
calendarVersion
licensePolicyId
immutable
```

A session is `readyForModelResearch=true` only when:

- PostgreSQL persistence is durable;
- every stored minute contains all selected symbols;
- no duplicate conflict exists;
- one calendar version is used;
- actual coverage meets the configured threshold;
- the session revision is sealed manually.

It always remains:

```text
readyForRuntime = false
automaticModelApprovalAllowed = false
runtimeRegistrationAllowed = false
```

## 8. Admin API

```text
GET  /api/admin/trading-readiness/scalping-kis-capture
POST /api/admin/trading-readiness/scalping-kis-capture/start
POST /api/admin/trading-readiness/scalping-kis-capture/stop
POST /api/admin/trading-readiness/scalping-kis-capture/seal
```

The API never accepts KIS credentials. Credentials remain server-side environment values.

Start input may contain only bounded operational controls such as selected symbols and quote/cycle timing.

Seal input contains the session date and expected session length.

## 9. Admin panel

The `/ADMIN` panel displays:

- active or stopped;
- capture eligibility;
- persistence mode and schema readiness;
- selected symbols;
- provider event count;
- completed and captured cycles;
- incomplete cycles;
- stale quote count;
- total persisted rows;
- latest captured minute;
- latest immutable revision;
- model-research readiness;
- blocking reasons.

Buttons:

```text
Start KIS capture
Stop KIS capture
Seal session
Refresh
```

No automatic start is introduced.

## 10. Operational limits

This PR does not create a scheduled worker.

A manually started Render Web Service process may restart or sleep and is not sufficient for long-term evidence collection.

After this contract is merged and the migration is deliberately applied, the recommended operational follow-up is a dedicated private worker with:

- one KIS connection lease;
- explicit operator activation;
- restart checkpoint;
- durable minute writes;
- market-calendar start and stop controls;
- no account or order scopes.

## 11. Research timeline consequence

KIS capture avoids paid historical data but begins collecting from activation onward.

It does not provide the previous 24 months immediately.

Expected research progression:

```text
first 5–20 sessions
→ plumbing and data-quality validation

20–60 sessions
→ early model diagnostics only

60+ sessions
→ initial walk-forward evidence

multiple regimes
→ stronger promotion evidence
```

This is slower but aligns the research source with the intended live Shadow provider.

## 12. Safety invariants

Always false:

```text
accountCallsAllowed
brokerOrderAdapterPresent
orderSubmissionAllowed
automaticLiveActivationAllowed
rawProviderPayloadStored
credentialsPersisted
forwardFillUsed
automaticModelApprovalAllowed
runtimeRegistrationAllowed
```

## 13. Not performed

- no KIS connection;
- no approval-key request;
- no environment mutation;
- no migration execution;
- no background worker schedule;
- no account, balance, position, order, cancellation, or modification call;
- no model training;
- no model approval;
- no Runtime provider registration;
- no Production deployment or promotion.

## 14. Next

After review and merge:

1. inspect the migration;
2. explicitly approve and apply the migration;
3. add or confirm `FINPLE_TRADING_KIS_HISTORICAL_CAPTURE_ENABLED=true`;
4. deploy the backend intentionally;
5. run a bounded 30-minute capture pilot during the regular US session;
6. verify stored rows, duplicates, quote freshness, and session dates;
7. stop capture;
8. seal the pilot session with a low pilot-specific coverage expectation;
9. inspect the immutable revision;
10. only after the pilot, move capture to a dedicated private worker.
