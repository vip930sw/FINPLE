# Step 114-2X-S execution confirmation

## Scope

Step 114-2X-S verifies a synthetic, signed execution-time operator confirmation and prepares a non-executing one-run runner launch package. It does not launch a runner or activate observation authority.

The public states are exactly:

- `awaiting_external_signed_live_observation_execution_confirmation`
- `signed_live_observation_runner_launch_package_verified`
- `blocked`

Zero input and CLI default to `awaiting_external_signed_live_observation_execution_confirmation`.

## Direct upstream validation

Before verification can succeed, the complete Step R packet and all six Step R contracts are directly revalidated. Relevant Step Q, P, O, N, M, L, and H validators are also called directly. Any supplied ID, hash, signature, policy, manifest, nonce, chronology, scope, role, sequence, count, or fixed-false authority drift blocks the package.

## Signed confirmation boundary

The confirmation uses Ed25519 over a canonical, domain-separated payload. The signed payload binds the complete Step R handoff, the confirmer allowlist and policy, the immutable sanitized runner manifest, the evaluation clock, the execution-confirmation nonce, exact scope and role, and the seven-step confirmation sequence.

The confirmer must retain the Step Q operator key ID, sanitized identity hash, public-key fingerprint, and public key. It must remain distinct from the Step M approver and Step N invoker. The allowlist is exact, active, non-revoked, scope-bound, role-bound, and fail-closed.

## Replay and chronology

The execution-confirmation nonce must be distinct from all seven preceding request, intake, response, invocation, claim, operator-authorization, and runtime-handoff nonces. Prior nonce hashes must be canonical SHA-256 values in unique sorted order. The evaluation clock must be within the signed confirmation lifetime, Step R handoff chronology, and the inherited earliest expiry.

## Exact confirmation sequence

1. `revalidate_runtime_handoff`
2. `verify_runner_implementation_manifest`
3. `require_runtime_artifact_digest_verification`
4. `require_single_use_claim_acquisition`
5. `require_bound_read_only_observation_once`
6. `require_sanitized_receipt_evidence_and_disposal`
7. `prepare_one_run_runner_launch`

Skip, reorder, duplicate, extension, or count drift blocks verification.
