# Step 114-2X-Y signed production-cutover approval

## Purpose

Step Y verifies one fresh, short-lived, synthetic Ed25519 approval for a later,
separately reviewed production metrics CSV cutover. It does not execute the cutover.

The public states are limited to:

- `awaiting_external_signed_production_cutover_approval`
- `signed_single_use_production_cutover_envelope_verified`
- `blocked`

Zero input and the zero-argument CLI return the awaiting state. CLI arguments,
filesystem discovery, stdin, environment discovery, routes, workers, cron jobs, and
automatic triggers are forbidden.

## Direct validation chain

Before checking an approval, the pure in-memory verifier requires the merged main SHA
`9964a7a5dbabb3dcacd4f3a99d2564480e93b30c` and directly revalidates the complete
Step X packet and result. It calls the merged Step X canonical validators for the Step
W/V/U/T/S chain, observation, nonce context, cutover execution binding, reconciled
evidence manifest, readiness package, and summary. It reconstructs each canonical
object and requires exact equality.

The production-cutover binding remains the existing guarded-executor binding. The
Step Y approval binds its exact ordered US/KR targets, content/schema/dataset/package
identities, row and byte counts, selector preimage and expected postimage, repository
preimage/tree/head, authority and invocation identities, target-absence/no-drift
attestations, and the existing ten-operation future cutover order.

## Approval boundary

The approval role is `metrics_production_cutover_approver`; its scope is
`authorize_exactly_one_bound_production_metrics_csv_cutover`; and its signature
algorithm is Ed25519. The allowlist resolves exactly one active key with an exact role
and scope. Duplicate, wildcard, revoked, future-valid, expired, malformed, unrelated,
or non-Ed25519 material blocks.

The Step Y signer must differ from the Step M approver, Step N invoker, Step Q
operator, Step S execution confirmer/operator, and Step V external-observation
approver by key ID, sanitized identity hash, and public-key fingerprint.

Prior Step Y nonce hashes must be canonical SHA-256 values in sorted unique order.
The fresh nonce cannot be replayed or equal any upstream request, intake, approval,
invocation, claim, operator, ceremony, or reconciliation nonce. Evaluation is valid
only while `issuedAt <= evaluation < effectiveCutoverExpiresAt`. Equality at expiry
blocks. Effective expiry is the earliest still-applicable upstream execution expiry
and signed approval expiry.

Committed tests contain only deterministic synthetic packets, public keys, signatures,
and sanitized identities. No private key is present in production source or documents.

## Failure classifications

Only these sanitized classifications are emitted:

- `blocked_before_step_x_validation`
- `blocked_during_cutover_identity_validation`
- `blocked_during_approval_verification`
- `manual_review_required`

No raw CSV bytes, signature value, credential, endpoint, provider/account/database
identity, source path, private packet, exception, stack, command, hash secret, or
private key is returned.
