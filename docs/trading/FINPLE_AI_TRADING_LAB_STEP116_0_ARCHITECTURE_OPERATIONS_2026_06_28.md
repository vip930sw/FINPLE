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
7. KIS order adapter design review.
8. Live guarded execution only after manual approval.

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
