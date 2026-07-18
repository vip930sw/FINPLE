# Step 114-2X-M signed live-observation approval response

## Purpose

This package verifies a future, externally supplied, sanitized live-observation approval response without sending an approval request, creating a signature, recording an approval, or performing an observation. The repository contains only a pure verifier and synthetic in-memory test material.

## Public states

The public state set is closed to exactly:

1. `awaiting_external_signed_live_observation_approval_response`
2. `signed_live_observation_approval_response_verified`
3. `blocked`

Zero input and the CLI default return the first state. Unknown, malformed, expired, replayed, unbound, or unverifiable input returns `blocked`.

## Direct upstream validation

Before response verification, the validator directly revalidates the complete Step L packet and summary, including the sanitized intake and non-authorizing approval-request envelope. It also directly calls the Step H request-context validator and `validateLiveObservationApprovalRequest`. ID/hash bindings to the Step L summary, intake, Step H request, and Step K observation-intake template are exact.

## Signed response contract

The response contract is `metrics-cutover-live-observation-approval-response-v1-step114-2x-m`. It requires exact keys, an `approved` decision, the exact scope `single_sanitized_disposable_environment_observation`, the exact role `metrics_live_observation_approver`, the Step H three-operation set, a maximum observation count of one, all eleven attestations, distinct request/intake/response nonce hashes, bounded canonical timestamps, and an Ed25519 signature.

The signature payload is canonical JSON prefixed by the Step M domain separator. Only `signatureBase64` is excluded from the signed payload. The response ID/hash, all upstream bindings, scope, role, operations, nonce hashes, observation window, timestamps, signer key ID, sanitized signer identity hash, decision, attestations, and non-recording boundaries are covered.

## Approver allowlist

The allowlist contract is `metrics-cutover-live-observation-approver-allowlist-v1-step114-2x-m`. Each exact entry contains a safe key ID, sanitized signer identity hash, Ed25519 public-key PEM, exact scope and role arrays, revocation flag, and canonical validity interval. Verification requires exactly one active matching entry. Wildcards, duplicates, invalid keys, non-Ed25519 keys, revoked entries, future entries, expired entries, and scope or role drift fail closed.

No private key, seed, real signer identity, endpoint, credential, certificate, provider material, or raw approval material is stored.

## Non-action boundary

The verifier uses only `node:crypto` SHA-256, Ed25519 public-key parsing, and Ed25519 verification. It has no filesystem, environment, current-clock, network, provider, database, PostgreSQL, SQL, migration, scenario, signing, claim, lock, receipt, runtime, deployment, commit, push, or merge capability.
