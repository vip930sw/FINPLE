# Phase 2C-1B — KIS account read-only one-shot runner

## Boundary

- Admin-only routes: `POST .../start`, `GET .../status`, `POST .../stop`.
- Start requires the genuine, one-time `requireAdminStartAccess` proof.
- `FINPLE_TRADING_KIS_ACCOUNT_READ_ENABLED` is dedicated to this capability and defaults to disabled.
- Phase 2C-1B runtime execution is fixed to the paper environment; the executable provider contract is `VTTS3012R` only.
- The runner fixes the request to one `USD` / `NASD` read through the Phase 2C-0 builder and normalizer.

## Runtime contract

- Lifecycle: `AUTHORIZED → TOKEN_REQUESTING → TOKEN_READY → ACCOUNT_READING → ACCOUNT_VALIDATED → STOPPED`.
- One active run, one access-token request, at most 10 account pages, zero retry, zero polling, and a hard 30-second timeout.
- Stop and timeout abort supported I/O. A later start stays blocked until prior provider I/O actually settles.
- Status is process-local and exposes only lifecycle, counters, booleans, and safe reason codes. It never exposes the account, credentials, token, request headers, provider body, snapshot, or financial values.
- No snapshot persistence, DB write, WebSocket, Approval Key, order adapter, position mutation, or Live activation path exists.

## Delivery state

Phase 2C-1B adds the disabled boundary and validates it with synthetic network dependencies only. It performs no KIS token or account request and changes no environment or deployment.

The generic Phase 2C-0 builder retains `TTTS3012R` for a future Production phase, but this runner cannot execute it. Production live account access requires a separate approval contract and code change.

Phase 2C-1C — one separately approved Staging paper account read — is not approved by this change.
