# FINPLE TSC-4E — KIS Shadow Feed Operations Safety

Date: 2026-08-05  
Scope: representative-only private Trading Lab  
Status: implementation and validation only; no Production activation

## 1. Purpose

TSC-4E adds the operational safety layer around the TSC-4D read-only KIS completed-bar feed.

It covers:

- official US equity-session calendar enforcement;
- provider heartbeat and completed-cycle watchdogs;
- stale quote, protocol issue, and incomplete-cycle rate limits;
- circuit-breaker stop behavior;
- sanitized restart checkpoints;
- manual-resume-only recovery;
- Admin Console operational alerts;
- bounded read-only activation and rollback procedure.

It does not add an order adapter, account access, balance access, position mutation, live activation, or automatic restart.

## 2. Market calendar contract

The calendar is explicit and fail-closed.

Supported years:

- 2026
- 2027
- 2028

Source of truth used for the explicit dates:

- NYSE Holidays & Trading Hours: `https://www.nyse.com/trade/hours-calendars`

Core session:

- 09:30–16:00 America/New_York

Explicit early closes use 13:00 America/New_York. The implementation includes only the dates published by NYSE for the supported years.

Rules:

1. weekend or listed exchange holiday → `CLOSED`;
2. published early-close date after 13:00 ET → `POSTCLOSE`;
3. unsupported year → `UNSUPPORTED_CALENDAR` and provider start blocked;
4. an out-of-range date may be enabled only through an explicit reviewed override supplied to the private runtime;
5. no weekday inference may override a listed holiday.

## 3. Operational states

| State | Meaning | Provider action |
|---|---|---|
| `standby_preopen` | within the approved pre-open window | connection may remain active |
| `standby_market_closed` | weekend, holiday, or outside the core session | no stale-feed trip |
| `healthy` | heartbeat, cycle, and error-rate checks pass | continue read-only feed |
| `degraded` | isolated recent quality issue | continue and alert |
| `tripped` | a circuit-breaker threshold was exceeded | stop feed; manual resume required |
| `stopped` | operator-controlled stop | remain stopped |

## 4. Default watchdog policy

| Check | Default |
|---|---:|
| initial provider-heartbeat grace | 45 seconds |
| provider-heartbeat warning | 8 seconds |
| provider-heartbeat trip | 15 seconds |
| completed-cycle initial grace | 120 seconds |
| completed-cycle trip age | 120 seconds |
| connecting/reconnecting state timeout | 60 seconds |
| protocol issues | 5 per 60 seconds |
| stale completed-bar quotes | 5 per 60 seconds |
| incomplete multi-symbol cycles | 3 per 10 minutes |
| approval-expiry warning | 15 minutes |
| checkpoint interval | 30 seconds |

The policy is a fail-closed operational default, not a profitability setting.

## 5. Circuit-breaker behavior

A trip may be caused by:

- unsupported market-calendar year;
- expired read-only approval;
- inactive runner during the regular session;
- provider heartbeat missing or stale;
- completed multi-symbol cycle missing or stale;
- prolonged connect or reconnect state;
- protocol issue rate exceeded;
- stale quote rate exceeded;
- incomplete cycle rate exceeded.

Trip sequence:

```text
watchdog detects threshold breach
→ mark guard as tripped
→ stop KIS market-data runner
→ do not stop or liquidate Shadow positions automatically
→ write sanitized checkpoint
→ expose critical Admin Console alert
→ require operator stop acknowledgement and a fresh manual start
```

Automatic restart is prohibited.

## 6. Checkpoint contract

Optional PostgreSQL migration:

```text
server/migrations/20260805_trading_kis_shadow_feed_checkpoints.sql
```

Persistent mode requires:

- `DATABASE_URL`;
- `FINPLE_TRADING_KIS_FEED_CHECKPOINT_ENABLED=true`;
- migration applied.

Otherwise checkpoints use bounded process memory.

Stored fields may include:

- Shadow run ID;
- approved strategy version ID and version number;
- selected symbols;
- sanitized runner counters;
- guard state and alerts;
- read-only approval ID, scope, environment, and expiry;
- stop reason;
- checkpoint timestamp.

Forbidden checkpoint content:

- KIS App Key or Secret;
- approval key or access token;
- account number or account identifier;
- raw provider request or response;
- raw market-data payload;
- order payload.

Every restored checkpoint has:

```text
manualResumeRequired = true
automaticResumeAllowed = false
```

## 7. Bounded activation runbook

This section defines a future operator procedure. This PR does not execute it.

### Gate A — code and dependency order

Required merge order:

1. PR #443
2. PR #444
3. PR #446
4. PR #449
5. TSC-4E PR

All focused and repository checks must pass after retargeting to `main`.

### Gate B — database preparation

Apply only through an explicitly approved change window:

1. strategy registry migration;
2. Shadow runtime migration;
3. KIS feed checkpoint migration.

Verify the schema without creating or altering order-capable tables.

### Gate C — environment preparation

Required read-only values:

```text
KIS_TRADING_APP_KEY
KIS_TRADING_APP_SECRET
FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED=true
FINPLE_TRADING_KIS_FEED_CHECKPOINT_ENABLED=true
```

Do not reuse public-web proxy credentials if they are not explicitly approved for the private Trading Lab.

Do not configure order approval fields for this stage.

### Gate D — approval receipt

The receipt must be active, time-boxed, revocable, and limited to:

```text
scope=trading_read_only_market_data
environment=virtual_shadow
```

It must explicitly forbid:

- order submission;
- order cancellation;
- position mutation;
- live trading endpoints;
- raw provider response persistence.

### Gate E — market-time validation

Before provider start:

1. confirm the calendar year is supported;
2. confirm the date is not a weekend or exchange holiday;
3. confirm normal or early close;
4. start only during the regular session or within 15 minutes before open;
5. confirm the approval remains valid beyond the planned observation window.

### Gate F — bounded pilot

Recommended first activation boundary:

- one explicitly approved Shadow strategy version;
- selected symbols fixed by that version;
- no strategy-edit operation during the run;
- no model substitution;
- no account or order endpoint;
- operator present throughout the pilot;
- initial observation window limited to 30 minutes;
- stop immediately on a critical alert;
- retain sanitized checkpoint and metrics only.

A strategy requiring an external model remains entry-blocked until a separately approved model-signal provider is connected.

### Gate G — pilot acceptance

Minimum operational acceptance, separate from strategy profitability:

- no circuit-breaker trip;
- provider heartbeat within policy;
- completed cycles arriving within policy;
- no unsupported calendar state;
- no credential or raw-payload persistence;
- no account or order call;
- incomplete and stale-quote rates below limits;
- checkpoint write successful;
- manual stop and recovery state verified.

## 8. Rollback procedure

Rollback order:

```text
1. stop KIS Feed
2. verify provider connection closed
3. preserve final sanitized checkpoint
4. disable FINPLE_TRADING_KIS_SHADOW_FEED_ENABLED
5. keep Shadow run stopped or isolated according to operator decision
6. do not delete audit or checkpoint evidence
7. investigate trip or degradation reason
```

If the feed is active, Shadow cannot be stopped first.

## 9. Alert handling

| Severity | Example | Operator action |
|---|---|---|
| info | operator stop | record and close |
| warning | approval expiring, isolated incomplete cycle | observe and prepare stop |
| critical | heartbeat stale, cycle stale, calendar unsupported | feed is stopped; investigate before manual restart |

Alerts are displayed in the private Admin Console only. External notification delivery is outside TSC-4E.

## 10. Safety invariants

Always false:

```text
accountCallsAllowed
brokerOrderAdapterPresent
orderSubmissionAllowed
liveActivationAllowed
automaticRestartAllowed
automaticLiveActivationAllowed
credentialsPersisted
rawProviderPayloadStored
forwardFillUsed
```

## 11. Next stage

TSC-4F should address a separately approved external model-signal adapter and model-health monitoring, or a longer bounded read-only observation campaign. Neither stage should introduce broker orders.
