# Step 114-2X-N signed single-use live-observation invocation

## Purpose

Step 114-2X-N verifies a future caller-supplied, sanitized, Ed25519-signed single-use live-observation invocation. A successful synthetic verification prepares only an in-memory non-executing receipt candidate. It does not send, consume, or record an invocation, activate live-observation authority, observe an environment, connect to a provider or database, or authorize execution.

## Public states

The exact closed state set is:

1. `awaiting_external_signed_live_observation_invocation`
2. `signed_live_observation_invocation_verified`
3. `blocked`

Zero input and the zero-argument CLI return the awaiting state. CLI arguments, missing fields, ambiguity, binding drift, replay, invalid signatures, and expired material return `blocked` with manual review required.

## Direct upstream validation

The verifier directly invokes all exposed Step M upstream, approval-context, signed-response, authority-package, policy, and summary validators. It also directly invokes the Step L upstream, intake-context, intake-record, request-envelope, and summary validators and the Step H request-context and `validateLiveObservationApprovalRequest` validators.

The invocation directly binds Step M summary/authority/response/approver-allowlist/policy ID/hash pairs and every Step M transitive Step L/K/J/H ID/hash pair. It additionally binds the approver signer key ID, sanitized approver identity hash, approval signature digest, request/intake/response nonce hashes, exact observation window, operation order, observation count, and destination count.

## Signed invocation

The invocation contract is `metrics-cutover-live-observation-invocation-v1-step114-2x-n`. It requires exact keys, canonical JSON, domain-separated ID/hash/signature payloads, the exact observation scope, the `metrics_live_observation_invoker` role, exact three-operation order, counts of one, thirteen exact attestations, canonical timestamps, and canonical Base64 Ed25519 signature.

Only `signatureBase64` is excluded from the signed payload. The invocation ID/hash, all upstream bindings, signer separation evidence, nonces, window, chronology, scope, role, operations, attestations, and non-recording boundaries are signed.

## Invoker allowlist and signer separation

The separate invoker allowlist accepts exactly one active Ed25519 public key with exact scope, role, validity window, safe key ID, and sanitized identity hash. Duplicate, wildcard, revoked, malformed, expired, future-valid, unrelated, wrong-scope, and wrong-role entries fail closed.

The invoker key ID and sanitized identity hash must differ from the Step M approver. The verifier also rejects reuse of the same Ed25519 public-key fingerprint. Public keys are verification material only and are not credentials.

## Pure verifier boundary

The core uses only `node:crypto` SHA-256, Ed25519 public-key parsing, and signature verification. It has no filesystem, environment, stdin, current-clock, network, DNS, TLS, HTTP, database, PostgreSQL, container, child-process, provider SDK, signing, private-key, durable-store, runtime, or deployment capability.
