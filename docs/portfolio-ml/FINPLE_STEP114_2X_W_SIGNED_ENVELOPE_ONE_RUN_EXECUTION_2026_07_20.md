# Step 114-2X-W signed-envelope one-run execution bridge

## Purpose

Step W is the guarded programmatic bridge between the merged Step V single-use
execution envelope and the merged Step T controlled runner. It does not add a
route, worker, cron job, deployment trigger, environment discovery, or packet
transport. The zero-input CLI remains awaiting and cannot infer approval from a
merge, CI result, or deployment status.

## Public states

- `awaiting_explicit_signed_envelope_execution`
- `signed_envelope_controlled_observation_execution_completed`
- `blocked`

The only completed path follows the twelve-state sequence defined by Issue
#321. Before the envelope claim it canonically reconstructs Step V and directly
revalidates the signed approval, allowlist, signer separation, nonce and expiry,
the complete Step U ceremony, the Step S package, the Step T capability bundle,
and the exact twenty-one-entry operation plan.

## Single-use envelope claim

The separately injected `singleUseExternalExecutionEnvelopeStore` exposes only:

1. `acquireExecutionEnvelopeClaim`
2. `reconcileOperationOutcome`
3. `finalizeExecutionEnvelopeClaim`

Its descriptor requires a 5000 ms maximum deadline, `AbortSignal`, deterministic
operation and idempotency identities, cooperative cancellation, read-only
post-timeout reconciliation, and exact atomic namespace mutation. It forbids
retry, fallback, discovery, provider access, production mutation, unbounded
mutation, and raw material.

The claim binds the Step V envelope and approval, approval nonce, Step U
evidence/material/inventory pairs, Step T operation-plan hash, Step S launch
pair, lease/claim request identities, counts of one, and effective expiry. An
ambiguous acquisition never invokes Step T. A reconciled committed acquisition
is still terminalized exactly once.

## Execution boundary

The bridge invokes `runControlledLiveObservation` once with only the exact Step
S package, exact Step U runtime capability bundle, and explicit Step W clock.
The PR tests supply deterministic in-memory capabilities. They perform no real
provider, database, network, DNS, TLS, HTTP, socket, credential, certificate,
endpoint, SQL, migration, scenario, CSV, production, or deployment action.

External exception messages and stacks are never included in results. Failures
use only the four fixed classifications and sanitized issue codes. A blocked,
ambiguous, timed-out, malformed-closure, or disposal-uncertain Step T outcome is
never retried and never produces a completed Step W closeout receipt.
