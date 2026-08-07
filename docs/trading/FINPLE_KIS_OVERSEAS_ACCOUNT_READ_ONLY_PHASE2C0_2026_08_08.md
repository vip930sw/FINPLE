# FINPLE Phase 2C-0: KIS overseas account read-only contract

## Purpose and boundary

Phase 2C-0 adds a backend-only, provider-independent contract for a future KIS overseas-stock account snapshot. It performs no real provider call and adds no route, UI, scheduler, persistence, deployment, or environment change.

The capability is distinct from market data and orders:

```text
trading_read_only_account_state
```

Its current runtime state is fail-closed:

```text
accountReadRuntimeAllowed=false
providerAccountCallsAllowed=false
orderSubmissionAllowed=false
positionMutationAllowed=false
liveActivationAllowed=false
```

## Official KIS contract

Audited source:

- repository: `koreainvestment/open-trading-api`
- audited official `main`: `b093e42ba32d1df5f5ddad7a71cb715cbc800832`
- path: `examples_user/overseas_stock/overseas_stock_functions.py`
- function: `inquire_balance`

Fixed read-only request:

| Item | Value |
| --- | --- |
| Method | `GET` |
| Endpoint | `/uapi/overseas-stock/v1/trading/inquire-balance` |
| Live TR ID | `TTTS3012R` |
| Paper TR ID | `VTTS3012R` |
| Currency | `USD` |
| Query fields | `CANO`, `ACNT_PRDT_CD`, `OVRS_EXCG_CD`, `TR_CRCY_CD`, `CTX_AREA_FK200`, `CTX_AREA_NK200` |

For live accounts, official `NASD` means all US markets; `NAS`, `NYSE`, and `AMEX` are also explicit live choices. For paper accounts, official choices are `NASD` (Nasdaq), `NYSE`, and `AMEX`; paper `NASD` is not documented as an all-US query.

## Account privacy

The existing `KIS_TRADING_ACCOUNT_ID` contract (`XXXXXXXX-XX`) is reused. It is split into `CANO` and `ACNT_PRDT_CD` only inside the fixed provider request builder. Status output contains only `accountConfigured` and `accountFormatValid`; neither account component is logged, returned by status, hashed, or persisted.

App Key, App Secret, access token, Approval Key, admin token, approval receipt, account response, and raw provider payload are outside the normalized result. `rawStored` is always `false`.

## Injected transport and snapshot

There is no default transport. A caller must inject one explicitly, and the builder fixes the method, endpoint, TR ID, and query names before invocation. Phase 2C-0 uses only deterministic fake transports.

```js
{
  provider: "KIS",
  capability: "trading_read_only_account_state",
  environment: "live | paper",
  asOf: "ISO-8601",
  currency: "USD",
  positions: [{
    symbol,
    exchange,
    quantity,
    averageAcquisitionPrice,
    currentPrice,
    evaluationAmount,
    unrealizedProfitLoss,
    unrealizedProfitLossRate,
  }],
  summary: {
    totalPurchaseAmount,
    totalUnrealizedProfitLoss,
    realizedProfitLoss,
    totalProfitLossRate,
    currency: "USD",
  },
  pageCount,
  schemaReasons,
  rawStored: false,
}
```

The official response supports the selected fields through `output1` (`ovrs_pdno`, `ovrs_excg_cd`, `ovrs_cblc_qty`, `pchs_avg_pric`, `now_pric2`, `ovrs_stck_evlu_amt`, `frcr_evlu_pfls_amt`, `evlu_pfls_rt`) and `output2` (`frcr_pchs_amt1`, `tot_evlu_pfls_amt`, `ovrs_rlzt_pfls_amt`, `tot_pftrt`). Cash and total evaluation amount are omitted because this endpoint's audited output does not establish those exact semantics.

Financial strings accept only strict finite decimal syntax. Blank values become `null`; malformed values become `null` with safe schema reason codes. Negative profit/loss is preserved, while negative quantity and negative price/amount fields are rejected to `null`.

Symbols are trimmed and uppercased only. No suffix, substring, or realtime-prefix inference is used. Unknown symbol syntax or exchange codes fail closed.

## Pagination

The first request sends blank continuation values. Further requests occur only for response `tr_cont` values `M` or `F`, use both returned continuation keys, and send continuation mode `N`. The adapter rejects malformed or repeated key pairs, duplicate `(exchange, symbol)` positions, and continuation beyond a hard ten-page ceiling.

## Non-persistence and future phases

No DB, Supabase, filesystem, cache, startup task, polling timer, account-call route, or order endpoint is added.

```text
2C-0  contract and synthetic adapter tests
2C-1  Staging/paper account-read capability review if supported
2C-2  Production configuration/preflight, disabled
2C-3  separately approved one-shot real account read
2D    order risk/preflight
2E    dry-run order generation
Phase 3  limited real-order pilot
```

Later phases are not approved by this document.
