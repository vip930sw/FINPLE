# Step 114-2X-Q signed operator authorization

## Boundary

Step 114-2X-Q verifies only a caller-supplied, synthetic signed operator
authorization. It does not record or consume an authorization, load an adapter,
acquire a claim, consume an invocation, observe an environment, connect to a
provider or database, use credentials, execute SQL, persist evidence, or dispose
of an environment.

The public states are exactly:

1. `awaiting_external_signed_live_observation_operator_authorization`
2. `signed_live_observation_operator_run_package_verified`
3. `blocked`

Zero input and the zero-argument CLI return the awaiting state. Unknown,
malformed, ambiguous, replayed, expired, or mismatched material returns
`blocked`.

## Signed contract

The authorization is exact-key and binds the complete Step P summary, receipt,
dependency bundle, execution plan, three interface hashes, state trace, Step O
input and adapter policy, and Step N invocation. It also binds the validated
adapter-artifact manifest ID/hash, sanitized artifact ID/SHA-256, source-tree
SHA-256, and capability-manifest SHA-256 directly into the signed payload. The
role and scope are fixed to:

- role: `metrics_live_observation_execution_operator`
- scope: `single_sanitized_disposable_environment_observation_run`

The ordered operations are:

1. `acquire_single_use_claim`
2. `invoke_bound_read_only_adapter_once`
3. `prepare_sanitized_execution_receipt`
4. `require_separate_evidence_finalization`
5. `require_separate_environment_disposal`

Claim acquisition and adapter invocation maxima are one. Destination and
observation counts are one. The signature is canonical Base64 Ed25519 over a
domain-separated canonical JSON payload that excludes only `signatureBase64`.
The caller-supplied manifest must exactly match every signed artifact-binding
field before the authorization can verify.

## Signer, nonce, and time validation

The operator public-key allowlist permits exactly one active matching key. The
operator key ID, sanitized identity hash, and Ed25519 SPKI fingerprint must each
differ from both the Step M approver and Step N invoker.

Request, intake, approval-response, invocation, claim, and operator-authorization
nonce hashes must all be distinct. The prior operator nonce context must be a
sorted, unique array of SHA-256 values, and replay is blocked.

Issued and expiry values are canonical UTC instants. Issuance cannot precede the
completed synthetic Step P package or bound upstream authorization material.
Expiry cannot exceed the earliest claim, executor-input, invocation,
observation-window, or operator-key expiry. Evaluation is explicit, bounded by
the observation window and authorization lifetime, and never reads the ambient
clock.
