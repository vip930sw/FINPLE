# FINPLE AI Trading Lab Step 116-0 Architecture And Operations

Date: 2026-06-28
Scope: Step 116-0 - private AI Trading Lab architecture and operating policy
Status: Draft baseline, no runtime implementation

## Purpose

Step 116-0 defines the safe starting boundary for FINPLE AI Trading Lab.

This is not a public FINPLE Signal product and not a customer-facing trading recommendation service. The Trading Lab is a private system for the representative's own account operation and must remain separated from FINPLE Personal, scenario analysis, and any future paid Signal product.

This document is intentionally architecture-first. It does not implement order execution, provider adapters, trading routes, database migrations, UI, or live KIS calls.

## Current Dependency Boundary

Step 114 scenario-data work is waiting for KIS written response or an alternate licensed market-data source:

```text
Step 114 progress=90%
KIS responseReady=false
runtimeProviderCallsAllowed=false
scenario_monthly_returns.csv absent
bootstrapStillBlocked=true
```

That blocks scenario monthly data, rolling median application, Bootstrap unlock, and scenario runtime implementation.

It does not block Step 116-0 architecture work because this step does not fetch market data, write scenario monthly data, or place orders.

## Product Boundary

| Surface | Allowed In Step 116-0 | Not Allowed In Step 116-0 |
| --- | --- | --- |
| AI Trading Lab | Private architecture, operating policy, paper/shadow/live mode definitions | Live order execution |
| FINPLE Personal | No changes | Bundling trading signals into Personal |
| FINPLE Signal | Product boundary and regulatory caution only | Paid user-facing signal delivery |
| Scenario analysis | Read-only reference to existing policy docs | Runtime scenario API, chart, or calculation changes |
| KIS | Secret boundary and future integration contract | Provider calls, order calls, data cache writes |

## System Separation

AI Trading Lab should be split from the public FINPLE web backend.

```text
FINPLE Web Backend
- user auth
- subscriptions
- public portfolio AI analysis
- no order placement
- no trading worker secrets

FINPLE Trading Worker
- private deployment
- representative account only
- paper/shadow/live mode engine
- KIS trading credentials
- risk engine and kill switch
- order intent, order submission, fill reconciliation

Trading Store
- private trading schema
- decision logs
- order intents
- order attempts
- executions/fills
- positions
- risk events
- mode transition records
```

The web backend may later expose a private operator dashboard only after authentication, authorization, and audit policy are documented separately. That is not part of Step 116-0.

## Data Classes

Trading Lab must keep these data classes separate:

| Data Class | Examples | Step 116-0 Rule |
| --- | --- | --- |
| Analytics Data | portfolio analysis, scenario policy, existing metrics | Read-only reference only |
| Trading Market Data | current price, quote, FX, tradability, session state | Future worker-only source contract |
| Execution Data | order intent, order request, KIS response, fills, position | Private trading store only |
| User Product Data | FINPLE Personal subscription, portfolio inputs | Must not drive live orders |
| Signal Data | future paid user-facing signal output | Out of scope and separately reviewed |

No scenario-data approval should be reused as trading-data approval without a separate source and purpose review.

## Operating Modes

| Mode | Meaning | External Order Call | Required Before Entry |
| --- | --- | --- | --- |
| `paper` | Simulated orders and fills only | No | Backtest fixtures, accounting rules, risk config |
| `shadow` | Reads real account/market state but records intended orders without submitting | No order submission | Paper mode stability and KIS read-only approval |
| `live_guarded` | Submits real orders with strict caps and manual kill switch | Yes | Shadow history, manual approval, dry-run replay, risk limits |
| `live_blocked` | Emergency no-order mode | No | Default fallback for any uncertainty |

Default mode must be `live_blocked` or `paper`, never `live_guarded`.

## Kill Switch Policy

The Trading Worker must check a kill switch before every order-intent promotion and before every order submission.

Minimum kill switch inputs:

- global trading disabled flag
- mode is not `live_guarded`
- daily loss limit breached
- daily order count limit breached
- symbol not allowlisted
- stale quote or stale FX input
- account balance or position mismatch
- KIS auth failure or rate-limit state
- unreviewed strategy version
- missing audit logger
- manual operator stop

If any condition is true, the worker must record a blocked risk event and must not submit an order.

## Risk Limits

Step 116-0 sets policy categories only. Exact numeric limits should be reviewed before implementation.

Required limit categories:

- max account capital allocated to Trading Lab
- max cash depletion per day
- max single-symbol exposure
- max single-order notional
- max daily turnover
- max order attempts per day
- max consecutive failed order attempts
- max slippage tolerance
- allowed market sessions
- allowed symbols and exchanges
- blocked instruments

The first implementation should use conservative defaults and fail closed when a value is missing.

## Trading Store Draft Schema

This is a logical schema draft, not a migration.

```text
trading_modes
- id
- mode
- reason
- changedBy
- changedAt

trading_strategy_versions
- id
- strategyName
- version
- status
- approvedBy
- approvedAt
- configHash

trading_decisions
- id
- mode
- strategyVersionId
- symbol
- market
- decision
- confidence
- inputsHash
- createdAt

trading_order_intents
- id
- decisionId
- symbol
- side
- quantity
- estimatedPrice
- estimatedFxRate
- notional
- riskStatus
- blockedReason
- createdAt

trading_order_attempts
- id
- intentId
- provider
- requestHash
- responseHash
- providerOrderId
- status
- attemptedAt

trading_executions
- id
- attemptId
- providerOrderId
- fillPrice
- fillQuantity
- fees
- taxes
- fxRate
- filledAt

trading_positions
- id
- symbol
- quantity
- averageCost
- marketValue
- source
- reconciledAt

trading_risk_events
- id
- severity
- eventType
- reason
- relatedIntentId
- createdAt
```

## Secret And Permission Boundary

KIS trading credentials must not be available to the public frontend or general web backend.

Required secret policy:

- `KIS_APP_KEY` and `KIS_APP_SECRET` for web data proxy do not imply trading permission.
- Trading Worker must use separately named env vars for order-capable credentials.
- Read-only quote/account permissions and order permissions should be separated when the provider supports it.
- Production secrets must not be used in local tests.
- Logs must never include app secret, access token, account number, or full raw provider response.

Suggested future env names:

```text
FINPLE_TRADING_MODE=paper|shadow|live_guarded|live_blocked
FINPLE_TRADING_KILL_SWITCH=1
FINPLE_TRADING_ALLOWED_MARKETS=...
FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET=...
FINPLE_TRADING_ALLOWED_SYMBOLS=...
KIS_TRADING_APP_KEY=...
KIS_TRADING_APP_SECRET=...
KIS_TRADING_ACCOUNT_ID=...
KIS_TRADING_BASE_URL=...
```

## Implementation Order

Step 116 should be split into small commits and PR-sized phases:

1. Architecture and operations policy document - this step.
2. Trading domain types and pure validators.
3. Paper trading ledger with no provider dependency.
4. Risk engine and kill switch tests.
5. Trading store migration draft.
6. Shadow-mode read-only integration contract.
7. Read-only approval intake contract.
8. Read-only approval import preflight.
9. Read-only provider request envelope contract.
10. Read-only provider response envelope contract.
11. Read-only snapshot normalization contract.
12. Read-only snapshot risk input contract.
13. Private shadow order intent contract.
14. Private shadow intent audit event contract.
15. Private shadow runtime review packet contract.
16. Private shadow runtime preflight.
17. KIS order adapter design review.
18. Live guarded execution only after manual approval.

## Validation Expectations

Before any order-capable work:

- tests must prove default mode does not submit orders
- tests must prove kill switch blocks order submission
- tests must prove missing risk config fails closed
- tests must prove order intent can be audited without provider calls
- tests must prove live mode cannot be enabled by frontend input
- tests must prove scenario data gates and trading gates are independent

Step 116-0 now has a machine-readable policy and preflight:

```text
data/processed/trading_lab_step1160_policy.json
data/processed/trading_lab_step1160_preflight.json
scripts/generate-trading-lab-step1160-preflight.cjs
scripts/generate-trading-lab-step1160-preflight.test.cjs
npm.cmd run check:trading-lab-step1160
```

The preflight can open only for pure validator implementation. Even when it is green, the committed readiness state remains:

```text
orderSubmissionAllowed=false
providerCallsAllowed=false
dbMigrationAllowed=false
publicUiAllowed=false
liveTradingAllowed=false
```

The gate also checks that Step 114 scenario runtime remains blocked and that no committed `scenario_monthly_returns.csv` exists.

## Step 116-1A Pure Policy Validators

The first pure validator module is:

```text
server/src/services/tradingLabPolicy.js
server/src/services/tradingLabPolicy.test.js
npm.cmd run check:trading-lab-policy
```

This module is intentionally not an execution adapter. It contains only deterministic validation helpers:

- trading mode normalization with unknown modes falling back to `live_blocked`
- kill switch evaluation with fail-closed defaults
- risk-limit config validation
- order-intent validation that returns `orderSubmissionAllowed=false` and `providerCallsAllowed=false`

It does not call KIS, submit orders, write DB rows, create API routes, create frontend UI, or touch scenario monthly data.

## Step 116-1B Paper Trading Ledger

The first paper trading ledger module is:

```text
server/src/services/tradingPaperLedger.js
server/src/services/tradingPaperLedger.test.js
npm.cmd run check:trading-paper-ledger
```

This module is intentionally pure and deterministic. It can:

- create a normalized paper ledger from supplied cash and positions
- simulate fills from supplied order intents and supplied fill prices
- apply buy and sell fills to paper cash and positions
- reject insufficient cash or insufficient position quantity
- record fill events, including realized PnL changes for sell fills
- mark positions to market from caller-supplied prices only

It does not call KIS, fetch market data, submit orders, write DB rows, create API routes, create frontend UI, or touch scenario monthly data. If a market price is not supplied by the caller, mark-to-market returns `totalEquity=null` and records the missing symbol instead of fetching or guessing.

## Step 116-1C Risk Engine And Kill Switch Gate

The first risk engine module is:

```text
server/src/services/tradingRiskEngine.js
server/src/services/tradingRiskEngine.test.js
npm.cmd run check:trading-risk-engine
```

This module composes the trading policy validators into a pure risk gate. It can:

- fail closed when mode, risk config, runtime state, or intent data is missing
- allow paper-mode fill promotion only after risk checks pass
- allow shadow-mode intent recording only after risk checks pass
- mark live-guarded intents as review-eligible only, never directly executable
- derive runtime breaches for daily loss, cash depletion, turnover, order attempts, consecutive failures, symbol exposure, allocated capital, session, and slippage
- build deterministic risk-event payloads without writing them to a database

It does not call KIS, fetch market data, submit orders, write DB rows, create API routes, create frontend UI, or touch scenario monthly data. Even when the risk gate passes, `orderSubmissionAllowed=false` and `providerCallsAllowed=false` remain part of the returned contract.

## Step 116-1D Trading Store Schema Draft

The first machine-readable trading store draft is:

```text
data/processed/trading_lab_step116_store_schema_draft.json
scripts/generate-trading-store-schema-draft.cjs
scripts/generate-trading-store-schema-draft.test.cjs
npm.cmd run check:trading-store-schema-draft
```

This is a schema draft and drift check, not a migration. It records the intended logical tables from the architecture section and keeps the current state explicit:

- `draftOnly=true`
- `ddlGenerated=false`
- `dbMigrationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `publicUiAllowed=false`

The check fails if the committed schema draft drifts, if Step 116 policy/preflight starts allowing DB migration, or if migration artifacts such as `migrations/trading` appear before manual review.

## Step 116-1E Shadow-Mode Read-Only Contract

The first shadow-mode integration contract is:

```text
data/processed/trading_lab_step116_shadow_mode_contract.json
scripts/generate-trading-shadow-mode-contract.cjs
scripts/generate-trading-shadow-mode-contract.test.cjs
npm.cmd run check:trading-shadow-mode-contract
```

This is a contract and drift check, not a KIS adapter. It defines future read-only scopes for shadow mode, including account cash, positions, orderable cash, current quotes, FX, market session state, and provider rate-limit state.

Current state remains blocked for runtime integration:

- `manualReadOnlyApprovalRecorded=false`
- `readOnlyRuntimeIntegrationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`

The check fails if shadow mode starts allowing external order calls, if required read-only/forbidden-action boundaries drift, or if runtime trading artifacts appear before manual read-only approval.

## Step 116-1F KIS Order Adapter Design Review

The first KIS order adapter design review is:

```text
data/processed/trading_lab_step116_kis_order_adapter_design_review.json
scripts/generate-trading-kis-order-adapter-design-review.cjs
scripts/generate-trading-kis-order-adapter-design-review.test.cjs
npm.cmd run check:trading-kis-order-adapter-design
```

This is a design review and drift check, not a KIS order adapter. It defines the future order-adapter boundary for `live_guarded` mode and requires manual operator approval, a clear kill switch, a clear risk gate, reviewed shadow history, dry-run replay, separate order-capable credentials, and an audit logger before any future submission path can be considered.

Current state remains blocked:

- `designReviewOnly=true`
- `adapterImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `liveTradingAllowed=false`

The check fails if live-guarded policy stops requiring manual approval/kill switch/dry-run replay, if shadow/preflight/env-risk/dry-run/history gates start allowing runtime calls too early, or if order-adapter runtime artifacts appear before manual review.

## Step 116-1G Trading Environment Readiness Contract

The first trading environment readiness contract is:

```text
data/processed/trading_lab_step116_env_readiness_contract.json
scripts/generate-trading-env-readiness-contract.cjs
scripts/generate-trading-env-readiness-contract.test.cjs
npm.cmd run check:trading-env-readiness
```

This is an environment-name and readiness contract, not a secret loader. It records the env names required for future shadow read-only runtime and future live-guarded order adapter work while keeping the current step secret-free.

Current state remains:

- `productionSecretsRequiredNow=false`
- `valuesStoredInContract=false`
- `readOnlyRuntimeIntegrationAllowed=false`
- `adapterImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`

Control env names are `FINPLE_TRADING_MODE`, `FINPLE_TRADING_KILL_SWITCH`, `FINPLE_TRADING_ALLOWED_MARKETS`, `FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET`, and `FINPLE_TRADING_ALLOWED_SYMBOLS`.

Future shadow read-only runtime requires `KIS_TRADING_APP_KEY`, `KIS_TRADING_APP_SECRET`, `KIS_TRADING_ACCOUNT_ID`, and `KIS_TRADING_BASE_URL`. Future live-guarded order adapter work additionally requires manual order-permission approval metadata such as `FINPLE_TRADING_ORDER_PERMISSION_APPROVED_AT` and `FINPLE_TRADING_ORDER_PERMISSION_APPROVED_BY`.

## Step 116-1H Trading Environment Value Parser

The first trading environment value parser is:

```text
server/src/services/tradingEnvConfig.js
server/src/services/tradingEnvConfig.test.js
npm.cmd run check:trading-env-values
```

This parser validates future Trading Worker env value shapes without loading secrets into docs, generated JSON, frontend code, provider calls, or order submission. It accepts the virtual-trading `shadow` shape used for Render configuration review, including `FINPLE_TRADING_ALLOWED_MARKETS=KR,US`, `FINPLE_TRADING_ALLOWED_ASSET_TYPES_BY_MARKET=KR:STOCK;US:STOCK,ETF`, wildcard symbols for non-live review, and `https://openapivts.koreainvestment.com:29443`.

Current state remains:

- `valuesStored=false`
- `readOnlyRuntimeIntegrationAllowed=false`
- `adapterImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `runtimeActivationAllowed=false`

The parser intentionally warns that wildcard symbols must be narrowed before `live_guarded`, production trading base URLs require separate live review, and order permission metadata does not unlock order submission by itself.

## Step 116-1I Trading Environment Risk Gate Input Contract

The first Trading Environment Risk Gate Input Contract is:

```text
data/processed/trading_lab_step116_env_risk_gate_contract.json
scripts/generate-trading-env-risk-gate-contract.cjs
scripts/generate-trading-env-risk-gate-contract.test.cjs
npm.cmd run check:trading-env-risk-gate
```

This contract maps the trading env parser output into future risk gate input fields without adding a runtime route, KIS call, order adapter, DB migration, or public UI.

Current state remains:

- `contractOnly=true`
- `envValuesStored=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`

The current Render-style `shadow` fixture is intentionally fail-closed: `FINPLE_TRADING_KILL_SWITCH=true` maps to `runtime.globalTradingDisabled=true`, wildcard symbols are not promoted into `limits.allowedSymbols`, and the resulting risk gate remains blocked while keeping `providerCallsAllowed=false` and `orderSubmissionAllowed=false`.

## Step 116-1J Order Adapter Review Env-Risk Dependency

The KIS order adapter design review now depends on the Step 116-1I env-risk contract. Future order-adapter implementation review stays blocked if the env parser to risk gate mapping stops failing closed, if wildcard symbols become an implicit order allowlist, or if the env-risk contract starts permitting runtime routes, provider calls, or order submission.

## Step 116-1K Trading Dry-Run Replay Contract

The first Trading Dry-Run Replay Contract is:

```text
data/processed/trading_lab_step116_dry_run_replay_contract.json
scripts/generate-trading-dry-run-replay-contract.cjs
scripts/generate-trading-dry-run-replay-contract.test.cjs
npm.cmd run check:trading-dry-run-replay
```

This contract defines the future dry-run replay boundary before any `live_guarded` order adapter implementation review. It is fixture-only and does not implement a replay service, KIS adapter, order submission path, DB migration, or public UI.

Current state remains:

- `contractOnly=true`
- `fixtureOnly=true`
- `dryRunReplayImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`

Future replay review must provide deterministic order-intent fixtures, risk gate fixtures, paper ledger before/after snapshots, market session fixtures, quote/FX fixtures, expected risk events, and expected blocked actions. Replay success is not order approval; it only proves that the future order-intent path can be reproduced without provider calls or order submission.

The KIS order adapter design review now also depends on this dry-run replay contract. Future order-adapter implementation review stays blocked if the dry-run contract is not ready, if it enables replay implementation too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1L Trading Shadow History Review Contract

The first Trading Shadow History Review Contract is:

```text
data/processed/trading_lab_step116_shadow_history_review_contract.json
scripts/generate-trading-shadow-history-review-contract.cjs
scripts/generate-trading-shadow-history-review-contract.test.cjs
npm.cmd run check:trading-shadow-history-review
```

This contract defines the future evidence required before shadow history can be reviewed for `live_guarded` order-adapter implementation. It does not claim that shadow history exists now, and it does not implement read-only shadow runtime, provider calls, order submission, DB migration, or public UI.

Current state remains:

- `contractOnly=true`
- `historyExistsNow=false`
- `shadowHistoryReviewImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`

Future shadow history review must include shadow order-intent logs, risk event logs, quote/FX snapshot hashes, account-state snapshot hashes, fill simulation comparison, operator review notes, blocked-intent review, and dry-run replay summary. Review success is not live approval; `live_guarded` remains blocked until manual operator approval, clear kill switch, clear risk gate, dry-run replay, separate credentials, and audit logging are reviewed together.

The KIS order adapter design review now also depends on this shadow history review contract. Future order-adapter implementation review stays blocked if the shadow history contract is not ready, if it enables history review implementation too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1M Trading Audit Logger Readiness Contract

The first Trading Audit Logger Readiness Contract is:

```text
data/processed/trading_lab_step116_audit_logger_readiness_contract.json
scripts/generate-trading-audit-logger-readiness-contract.cjs
scripts/generate-trading-audit-logger-readiness-contract.test.cjs
npm run check:trading-audit-logger-readiness
```

This is a contract and drift check, not an audit logger implementation. It defines the event and redaction contract required before future `live_guarded` adapter implementation review can proceed.

Current state remains blocked:

- `contractOnly=true`
- `auditLoggerExistsNow=false`
- `auditLoggerImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `liveTradingAllowed=false`

Future audit logger review must cover trading risk gates, order intents, blocked intents, dry-run replay, shadow history review, manual operator approval, and kill-switch state changes. Required records must include event identity, mode, severity, status, symbol, side, risk-gate status, order/provider allow flags, redaction version, and payload hash.

The redaction boundary remains strict: no KIS app secret, access token, full account number, or raw provider payload can be logged. Request and response bodies must be represented by hashes before persistence, and secret checks may record presence only.

The KIS order adapter design review now also depends on this audit logger readiness contract. Future order-adapter implementation review stays blocked if `audit_logger_ready` is not supported by this contract, if the audit logger implementation is enabled too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1N Trading Manual Operator Approval Contract

The first Trading Manual Operator Approval Contract is:

```text
data/processed/trading_lab_step116_manual_operator_approval_contract.json
scripts/generate-trading-manual-operator-approval-contract.cjs
scripts/generate-trading-manual-operator-approval-contract.test.cjs
npm run check:trading-manual-operator-approval
```

This is a contract and drift check, not an approval service, approval UI, KIS adapter, or order route. It defines the future `manual_operator_approval` gate required before `live_guarded` adapter implementation review can proceed.

Current state remains blocked:

- `contractOnly=true`
- `manualApprovalExistsNow=false`
- `manualApprovalImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `liveTradingAllowed=false`

Future manual approval must be scoped to one order intent, time-boxed, tied to the exact payload hash, and revocable. It cannot override a kill switch, failed risk gate, missing dry-run replay, missing shadow history review, missing audit record, or missing separate order-capable credentials.

The KIS order adapter design review now also depends on this manual operator approval contract. Future order-adapter implementation review stays blocked if the manual approval contract is not ready, if it enables approval implementation too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1O Trading Kill Switch Clearance Contract

The first Trading Kill Switch Clearance Contract is:

```text
data/processed/trading_lab_step116_kill_switch_clearance_contract.json
scripts/generate-trading-kill-switch-clearance-contract.cjs
scripts/generate-trading-kill-switch-clearance-contract.test.cjs
npm run check:trading-kill-switch-clearance
```

This is a contract and drift check, not a kill-switch service, runtime route, frontend control, KIS adapter, or order path. It defines the future `kill_switch_clear` gate required before `live_guarded` adapter implementation review can proceed.

Current state remains blocked:

- `contractOnly=true`
- `killSwitchRuntimeImplementationAllowed=false`
- `killSwitchClearNow=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `liveTradingAllowed=false`

The current Render-style fixture remains fail-closed: `FINPLE_TRADING_KILL_SWITCH=true` maps to `runtime.globalTradingDisabled=true`, the risk gate blocks with `kill_switch_global_trading_disabled`, and both provider calls and order submission stay false.

Future kill-switch clearance must be time-boxed, operator-attributed, audited before any order-intent promotion, and unable to override a failed risk gate or missing manual approval. A cleared kill switch alone still cannot permit provider calls or order submission.

The KIS order adapter design review now also depends on this kill switch clearance contract. Future order-adapter implementation review stays blocked if the kill switch clearance contract is not ready, if it enables runtime implementation too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1P Trading Order Credential Boundary Contract

The first Trading Order Credential Boundary Contract is:

```text
data/processed/trading_lab_step116_order_credential_boundary_contract.json
scripts/generate-trading-order-credential-boundary-contract.cjs
scripts/generate-trading-order-credential-boundary-contract.test.cjs
npm run check:trading-order-credential-boundary
```

This is a contract and drift check, not a credential store, KIS adapter, runtime route, or order path. It defines the future `separate_order_capable_credentials_present` gate required before `live_guarded` adapter implementation review can proceed.

Current state remains blocked:

- `contractOnly=true`
- `credentialValuesStored=false`
- `credentialStoreImplementationAllowed=false`
- `orderCapableCredentialsAcceptedNow=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `liveTradingAllowed=false`

The credential boundary remains separated: web data proxy env vars such as `KIS_APP_KEY` and `KIS_APP_SECRET` do not imply trading permission, and future order-capable work must use `KIS_TRADING_APP_KEY`, `KIS_TRADING_APP_SECRET`, `KIS_TRADING_ACCOUNT_ID`, and `KIS_TRADING_BASE_URL`.

The current virtual-trading base URL is not live order permission. A future production-trading base URL requires separate live review, manual operator approval, kill-switch clearance, risk-gate clearance, dry-run replay, shadow history review, and audit logging before any order adapter implementation review can proceed.

The KIS order adapter design review now also depends on this order credential boundary contract. Future order-adapter implementation review stays blocked if credential boundaries are not ready, if credential-store implementation is enabled too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1Q Trading Risk Gate Clearance Contract

The first Trading Risk Gate Clearance Contract is:

```text
data/processed/trading_lab_step116_risk_gate_clearance_contract.json
scripts/generate-trading-risk-gate-clearance-contract.cjs
scripts/generate-trading-risk-gate-clearance-contract.test.cjs
npm run check:trading-risk-gate-clearance
```

This is a contract and drift check, not a runtime risk-gate service, KIS adapter, route, public UI, or order path. It defines the future `risk_gate_clear` gate required before `live_guarded` adapter implementation review can proceed.

Current state remains blocked:

- `contractOnly=true`
- `riskGateClearanceImplementationAllowed=false`
- `riskGateClearNow=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `liveTradingAllowed=false`

For `live_guarded`, a clean risk-gate fixture may only return `live_review_required`; it still keeps `providerCallsAllowed=false` and `orderSubmissionAllowed=false`. Blocked fixtures must emit auditable risk-event reasons such as `kill_switch_global_trading_disabled`.

Future risk-gate clearance must include order intent, risk limits, market session, loss/turnover/order-attempt counters, exposure counters, quote/FX freshness, account-state match, strategy review status, and audit logger readiness. It cannot override a kill switch, manual operator stop, missing audit log, stale data, or risk-limit breach.

The KIS order adapter design review now also depends on this risk gate clearance contract. Future order-adapter implementation review stays blocked if risk gate clearance is not ready, if it enables runtime implementation too early, or if it starts permitting provider calls, order submission, DB migration, or public UI.

## Step 116-1R Trading Private Shadow Runtime Preflight

The first Trading Private Shadow Runtime Preflight is:

```text
data/processed/trading_lab_step116_private_shadow_runtime_preflight.json
scripts/generate-trading-private-shadow-runtime-preflight.cjs
scripts/generate-trading-private-shadow-runtime-preflight.test.cjs
npm run check:trading-private-shadow-runtime-preflight
```

This is a private_shadow_runtime implementation-review contract, not a runtime service. It defines the evidence required before a future private operator-only shadow runtime can be reviewed. It does not add a route, public UI, DB migration, KIS provider call, or order submission path.

Current state remains:

- `contractOnly=true`
- `privateShadowRuntimeImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future private shadow runtime review must prove private operator-only access, shadow/read-only mode, virtual-trading base URL scope, kill switch enabled by default, risk gate evaluation for each intent, audit logger readiness before intent records, dry-run replay references, shadow history review references, quote snapshot hashes, account-state snapshot hashes, order-intent hashes, and no raw provider payload persistence.

The private shadow runtime preflight now also depends on the Trading Read-Only Approval Intake Contract, Trading Read-Only Approval Import Preflight, Trading Read-Only Provider Request Envelope Contract, Trading Read-Only Provider Response Envelope Contract, Trading Read-Only Snapshot Normalization Contract, Trading Read-Only Snapshot Risk Input Contract, Trading Private Shadow Order Intent Contract, Trading Private Shadow Intent Audit Event Contract, and Trading Private Shadow Runtime Review Packet Contract. The KIS order adapter design review depends on this private shadow runtime preflight. Future order-adapter implementation review stays blocked if the private shadow runtime preflight is not ready, if it enables runtime implementation too early, or if it starts permitting provider calls, order submission, DB migration, runtime routes, or public UI.

## Step 116-1S Trading Read-Only Approval Intake Contract

The first Trading Read-Only Approval Intake Contract is:

```text
data/processed/trading_lab_step116_read_only_approval_intake_contract.json
scripts/generate-trading-read-only-approval-intake-contract.cjs
scripts/generate-trading-read-only-approval-intake-contract.test.cjs
npm run check:trading-read-only-approval-intake
```

This is a read_only_approval_intake contract, not an approval importer, KIS reader, provider adapter, runtime route, DB migration, or public UI. It defines the evidence packet required before any future KIS read-only provider call or private shadow runtime implementation review.

Current state remains:

- `contractOnly=true`
- `readOnlyApprovalImportedNow=false`
- `readOnlyApprovalIntakeImplementationAllowed=false`
- `readOnlyRuntimeIntegrationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future read-only approval evidence must include approval identity, approver, approved/expiry timestamps, read-only scope, environment, base URL, account identifier hash, allowed read scopes, forbidden actions, evidence ticket, revocation plan, and redaction version. The contract requires virtual-trading base URL scope, no live endpoint, hashed account identifiers only, no stored secrets, no raw provider payload persistence, and time-boxed revocable approval.

Approval intake validation still does not allow provider calls or read-only runtime by itself. A later implementation review must import and validate the approval evidence before any read-only shadow runtime can be considered.

## Step 116-1T Trading Read-Only Approval Import Preflight

The first Trading Read-Only Approval Import Preflight is:

```text
data/processed/trading_lab_step116_read_only_approval_import_preflight.json
scripts/generate-trading-read-only-approval-import-preflight.cjs
scripts/generate-trading-read-only-approval-import-preflight.test.cjs
npm run check:trading-read-only-approval-import-preflight
```

This is a read_only_approval_import_preflight contract, not an importer and not an approval packet. It does not create `data/private/trading/read_only_approval.redacted.json`, does not validate real KIS credentials, does not call KIS, and does not enable read-only runtime.

Current state remains:

- `contractOnly=true`
- `approvalPacketImportedNow=false`
- `readOnlyApprovalImportImplementationAllowed=false`
- `readOnlyRuntimeIntegrationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future approval import implementation review must reject missing fields, expired approval, live endpoints, order-capable actions, raw account identifiers, secret values, unknown read scopes, missing revocation plan, and missing redaction version. The future packet must be redacted, time-boxed, revocable, hash account identifiers, and stay limited to virtual-trading read-only scope.

Import preflight success still does not import approval evidence, enable provider calls, enable read-only runtime, or approve live order submission. It only makes the future approval import review fail-closed before private shadow runtime can be considered.

## Step 116-1U Trading Read-Only Provider Request Envelope Contract

The first Trading Read-Only Provider Request Envelope Contract is:

```text
data/processed/trading_lab_step116_read_only_provider_request_envelope_contract.json
scripts/generate-trading-read-only-provider-request-envelope-contract.cjs
scripts/generate-trading-read-only-provider-request-envelope-contract.test.cjs
npm run check:trading-read-only-provider-request-envelope
```

This is a read_only_provider_request_envelope contract, not a KIS reader, token flow, provider adapter, runtime route, DB migration, or public UI. It defines the future read-only request envelope, endpoint category, request/response hash, and redaction boundary before any provider call implementation review.

Current state remains:

- `contractOnly=true`
- `requestEnvelopeImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future request envelope review must include request identity, shadow mode, approval identifier hash, virtual-trading base URL, method, path template, query/header/body shape, timestamp, idempotency key, request hash, response hash, redaction version, and explicit provider-call allow flag. Allowed endpoint categories are read-only account, quote, FX, market-session, and provider-rate-limit reads only.

The envelope must forbid order submission, order cancellation, position mutation, live order endpoints, persisted token refresh payloads, raw provider payload persistence, and scenario monthly cache writes. Envelope success still does not perform provider calls, enable read-only runtime, or approve live order submission.

## Step 116-1V Trading Read-Only Provider Response Envelope Contract

The first Trading Read-Only Provider Response Envelope Contract is:

```text
data/processed/trading_lab_step116_read_only_provider_response_envelope_contract.json
scripts/generate-trading-read-only-provider-response-envelope-contract.cjs
scripts/generate-trading-read-only-provider-response-envelope-contract.test.cjs
npm run check:trading-read-only-provider-response-envelope
```

This is a read_only_provider_response_envelope contract, not a KIS reader, response parser implementation, provider adapter, runtime route, DB migration, or public UI. It defines the future read-only response envelope, normalized snapshot hash, raw response hash, and redaction boundary before any provider call implementation review.

Current state remains:

- `contractOnly=true`
- `responseEnvelopeImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future response envelope review must include request identity, endpoint category, provider status, status-code class, latency bucket, rate-limit state, normalized snapshot type, normalized snapshot hash, raw response hash, redaction version, and explicit provider/order allow flags. Allowed snapshot types are read-only account, quote, FX, market-session, and provider-rate-limit snapshots only.

The response envelope must forbid access tokens, app secrets, full account numbers, raw provider payloads, order confirmations, execution identifiers, live order endpoints, unhashed account identifiers, and scenario monthly return rows. Response envelope success still does not perform provider calls, enable read-only runtime, persist raw provider payloads, or approve live order submission.

## Step 116-1W Trading Read-Only Snapshot Normalization Contract

The first Trading Read-Only Snapshot Normalization Contract is:

```text
data/processed/trading_lab_step116_read_only_snapshot_normalization_contract.json
scripts/generate-trading-read-only-snapshot-normalization-contract.cjs
scripts/generate-trading-read-only-snapshot-normalization-contract.test.cjs
npm run check:trading-read-only-snapshot-normalization
```

This is a read_only_snapshot_normalization contract, not a parser implementation, KIS reader, provider adapter, runtime route, storage layer, DB migration, or public UI. It defines future normalized snapshot types, required fields, hash-only values, freshness markers, redaction boundaries, and rejection rules before any snapshot normalizer implementation review.

Current state remains:

- `contractOnly=true`
- `snapshotNormalizationImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future snapshot normalization review must include snapshot identity, source envelope hash, snapshot type, created timestamp, market/symbol/currency fields, hashed account identifier, value hash, freshness status, provider status, redaction version, raw-payload storage flag, and explicit provider/order allow flags. Allowed snapshot types are read-only account cash, account positions, orderable cash, quotes, FX, market-session state, and provider-rate-limit state only.

The normalization boundary must forbid access tokens, app secrets, full account numbers, raw provider payloads, order confirmations, execution identifiers, fill payloads, live order endpoints, and scenario monthly return rows. Snapshot normalization success still does not perform provider calls, enable read-only runtime, persist raw provider payloads, create DB storage, or approve live order submission.

## Step 116-1X Trading Read-Only Snapshot Risk Input Contract

The first Trading Read-Only Snapshot Risk Input Contract is:

```text
data/processed/trading_lab_step116_read_only_snapshot_risk_input_contract.json
scripts/generate-trading-read-only-snapshot-risk-input-contract.cjs
scripts/generate-trading-read-only-snapshot-risk-input-contract.test.cjs
npm run check:trading-read-only-snapshot-risk-input
```

This is a read_only_snapshot_risk_input contract, not a risk-input mapper implementation, KIS reader, provider adapter, runtime route, storage layer, DB migration, or public UI. It defines the future hash-only normalized snapshot inputs that a risk gate must receive before private shadow runtime or live_guarded review can consider order intent promotion.

Current state remains:

- `contractOnly=true`
- `snapshotRiskInputImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future snapshot risk input review must include order-intent hash, mode, market, symbol, side, quantity, estimated-notional hash, quote snapshot hash, account-state snapshot hash, orderable-cash snapshot hash, position snapshot hash, FX snapshot hash, market-session snapshot hash, provider-rate-limit snapshot hash, freshness status, account-match status, kill-switch/manual-approval state hashes, redaction version, and explicit provider/order allow flags.

The risk input boundary must keep account identifiers, cash values, positions, quote values, and notional estimates hash-only. Missing or stale quote, FX, account-state, market-session, or provider-rate-limit snapshots must block live review. Snapshot risk input success still does not perform provider calls, enable read-only runtime, create DB storage, or approve live order submission.

## Step 116-1Y Trading Private Shadow Order Intent Contract

The first Trading Private Shadow Order Intent Contract is:

```text
data/processed/trading_lab_step116_private_shadow_order_intent_contract.json
scripts/generate-trading-private-shadow-order-intent-contract.cjs
scripts/generate-trading-private-shadow-order-intent-contract.test.cjs
npm run check:trading-private-shadow-order-intent
```

This is a private_shadow_order_intent contract, not an order-intent recorder implementation, KIS order adapter, runtime route, storage layer, DB migration, or public UI. It defines the future hash-only shadow order-intent record that can be audited before any private shadow runtime implementation review.

Current state remains:

- `contractOnly=true`
- `privateShadowOrderIntentImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future shadow order-intent review must include intent identity, mode, strategy/operator hashes, market, symbol, side, order type, quantity, limit-price hash, estimated-notional hash, currency, risk input hash, risk-gate status, quote/account/orderable-cash snapshot hashes, dry-run replay hash, shadow-history reference hash, audit-event hash, idempotency key hash, redaction version, and explicit provider/order allow flags.

The order-intent boundary must forbid access tokens, app secrets, full account numbers, raw provider payloads, raw quote/position/cash values, order confirmations, execution identifiers, fill payloads, live order endpoints, and scenario monthly return rows. Shadow order-intent success still does not perform provider calls, submit or cancel orders, create runtime routes, create DB storage, or approve live order submission.

## Step 116-1Z Trading Private Shadow Intent Audit Event Contract

The first Trading Private Shadow Intent Audit Event Contract is:

```text
data/processed/trading_lab_step116_private_shadow_intent_audit_event_contract.json
scripts/generate-trading-private-shadow-intent-audit-event-contract.cjs
scripts/generate-trading-private-shadow-intent-audit-event-contract.test.cjs
npm run check:trading-private-shadow-intent-audit-event
```

This is a private_shadow_intent_audit_event contract, not an audit logger implementation, order-intent recorder, KIS order adapter, runtime route, storage layer, DB migration, or public UI. It defines the future hash-only audit event required around private shadow order intents before any private shadow runtime implementation review.

Current state remains:

- `contractOnly=true`
- `privateShadowIntentAuditEventImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future shadow intent audit event review must include event identity, event type, mode, severity, status, operator/strategy hashes, intent/order-intent hashes, risk input hash, risk-gate status, risk-event hash, market, symbol, side, decision status, snapshot freshness status, kill-switch/manual-approval state hashes, replay/history hashes, payload hash, previous-event hash, redaction version, and explicit provider/order allow flags.

The audit event boundary must forbid access tokens, app secrets, full account numbers, raw provider payloads, raw order payloads, raw quote/position/cash values, order confirmations, execution identifiers, fill payloads, live order endpoints, and scenario monthly return rows. Audit event success still does not perform provider calls, submit or cancel orders, create runtime routes, create DB storage, or approve live order submission.

## Step 116-2A Trading Private Shadow Runtime Review Packet Contract

The first Trading Private Shadow Runtime Review Packet Contract is:

```text
data/processed/trading_lab_step116_private_shadow_runtime_review_packet_contract.json
scripts/generate-trading-private-shadow-runtime-review-packet-contract.cjs
scripts/generate-trading-private-shadow-runtime-review-packet-contract.test.cjs
npm run check:trading-private-shadow-runtime-review-packet
```

This is a private_shadow_runtime_review_packet contract, not a private shadow runtime implementation, audit logger implementation, KIS reader, provider adapter, runtime route, storage layer, DB migration, or public UI. It defines the future hash-only review packet required before any private shadow runtime implementation review.

Current state remains:

- `contractOnly=true`
- `privateShadowRuntimeReviewPacketImplementationAllowed=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `dbMigrationAllowed=false`
- `publicUiAllowed=false`
- `runtimeRouteAllowed=false`
- `liveTradingAllowed=false`

Future runtime review packet review must include private operator scope hash, read-only approval import preflight hash, env risk-gate hash, snapshot risk input hash, order-intent contract hash, intent audit-event contract hash, risk-gate clearance hash, dry-run replay reference hash, shadow-history review reference hash, audit logger readiness hash, kill-switch/manual-approval state hashes, redaction version, and explicit provider/order/runtime/DB/UI allow flags.

The review packet boundary must keep approval, env, risk, snapshot, order-intent, audit, replay, and shadow-history evidence hash-only. Review packet success still does not import approval evidence, perform provider calls, enable read-only runtime, create runtime routes, create DB storage, or approve live order submission.

## Explicit Non-Goals

Do not do these in Step 116-0:

- no KIS provider calls
- no order submission
- no provider adapter implementation
- no database migration
- no public UI
- no FINPLE Signal launch
- no paid user-facing signal delivery
- no scenario monthly data write
- no scenario runtime implementation

## Handoff Prompt

```text
FINPLE 저장소 vip930sw/FINPLE의 main 브랜치에서 이어서 작업해주세요.

현재 Step 114 시나리오 데이터 작업은 KIS written response 대기 상태입니다. provider 호출, provider adapter, scenario_monthly_returns.csv, Bootstrap, Scenario API, Compare chart, calculatePortfolioResult() 변경은 계속 금지입니다.

이번 작업은 Step 116-0 FINPLE AI Trading Lab 아키텍처 및 운영정책 확정입니다.

먼저 local/remote main, Render API/DB health, Vercel 운영 응답을 확인해주세요.

읽을 문서:
- docs/trading/FINPLE_AI_TRADING_SIGNAL_ROADMAP_2026_06_27.md
- docs/trading/FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md
- docs/portfolio-ml/FINPLE_STEP114_DATA_QUALITY_HANDOFF_2026_06_28.md
- docs/portfolio-ml/FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md

이번 단계에서는 실주문, KIS 호출, DB migration, public UI를 구현하지 말고, Trading Worker 분리, paper/shadow/live 모드, kill switch, risk limits, trading store schema draft, PR 분할 계획을 문서/순수 validator 수준으로만 진행해주세요.
```
