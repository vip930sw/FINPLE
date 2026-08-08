# Phase 2C-2B — KIS live account-read approval boundary

## Scope

This phase adds code, tests, and a fail-closed approval contract only. It does not deploy code, change environment variables, request a KIS token, or read a Production account.

The existing paper account-read path remains controlled by `FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED`. A separate default-disabled flag, `FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED`, controls whether the live path may be considered.

## Live authorization contract

The live path requires all of the following:

- a genuine one-time authorization from the token-authenticated admin start boundary;
- `FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED=true`;
- a current approval with version `kis-account-live-read-approval-v1` and scope `trading_read_only_account_state_live`;
- approval environment `production_live`, live KIS REST base URL, and live credential marker;
- an internal account-binding match against the canonical configured KIS account;
- every required read-only prohibition, including order, account/position mutation, Live activation, raw provider response persistence, and financial snapshot persistence.

The approval assessment exposes only structural booleans and safe reason codes. The account ID and binding digest are never returned. A `WeakMap`-backed opaque decision connects the approval assessment to the private REST transport; a plain object, boolean, serialized assessment, missing decision, expired decision, or binding mismatch cannot authorize fetch.

## Provider contract

The generic Phase 2C-0 live provider contract remains unchanged:

- token: `POST /oauth2/tokenP`;
- balance: `GET /uapi/overseas-stock/v1/trading/inquire-balance`;
- live TR ID: `TTTS3012R`;
- fixed query scope: `NASD` and `USD`.

Generic `TTTS3012R` support is not execution approval. The live feature flag alone is also insufficient.

## Safety and later operation

- The paper path continues to use `VTTS3012R` without a live approval.
- No order, account mutation, position mutation, Capture, Shadow, model, lease, WebSocket, DB, or persistence path is added.
- Synthetic tests exercise the live contract with fake fetch only; no real provider call was made.
- A later Production one-shot still requires a separate explicit operator approval after disabled deployment and secure receipt configuration.
- This contract grants no trading or order authority.
