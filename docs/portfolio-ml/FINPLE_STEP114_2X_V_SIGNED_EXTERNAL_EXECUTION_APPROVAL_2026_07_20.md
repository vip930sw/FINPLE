# Step 114-2X-V signed external execution approval

## Boundary

Step 114-2X-V is a pure, non-executing verifier for one externally supplied Ed25519 approval. It verifies whether that approval is bound to the exact merged Step U handoff and, only after all checks pass, seals a sanitized single-use execution envelope for a later separately triggered step.

The exact public states are:

- `awaiting_external_signed_execution_approval`
- `signed_single_use_external_execution_envelope_verified`
- `blocked`

Zero input and the zero-argument CLI remain `awaiting_external_signed_execution_approval`. A verified envelope is not an execution, invocation, claim, lease, observation, connection, or deployment authority by itself.

## Approval identity

The approval uses:

- role `metrics_live_observation_external_execution_approver`;
- scope `authorize_exactly_one_controlled_read_only_observation_execution`;
- algorithm `Ed25519`;
- a one-entry exact allowlist;
- a sanitized signer identity hash and public-key fingerprint;
- domain-separated approval ID, signature payload, and approval hash.

The signer must differ from the Step N invoker and the Step Q/Step S operator by key ID, sanitized identity hash, and public-key fingerprint. A missing, revoked, wrong-role, wrong-scope, wrong-key, expired, or non-allowlisted signer blocks.

Merge, CI, Vercel, repository ownership, and Step U readiness are not approval sources and cannot appear as true inputs.

## Direct upstream validation

Before signature verification, Step V directly:

1. reruns the merged Step U evaluator;
2. requires canonical equality with the supplied complete Step U result;
3. calls every exposed Step U validator for the merged Step T contract, capability descriptors, runtime material, checklist, inventory, and material manifest;
4. reconstructs the Step U checklist and evidence-handoff manifest canonically;
5. calls the Step T direct Step S package validator;
6. rebuilds the exact 21-entry Step T operation plan and its domain-separated hash;
7. requires the Step U input, inventory, material manifest, and evidence handoff to bind that same plan hash.

No capability method is called during these validations. Every reported capability invocation count remains zero.

## Approval binding

The signed approval binds merged main `d35aa87ff381343ce386609ac3f5a0a81fd4b46f`, the complete 21-entry operation plan and hash, Step S launch ID/hash, Step U runtime-material inventory ID/hash, runtime-material manifest ID/hash, evidence-handoff ID/hash, ceremony nonce, prior nonce context digest, confirmation/authorization/invocation ID/hash pairs, lease and claim request IDs, signer identity, counts one, chronology, and all prohibited authority fields fixed false.

The approval nonce must be SHA-256, fresh, distinct from the ceremony nonce, and absent from a unique canonically sorted prior-approval nonce context. Equality at either approval expiry or upstream effective expiry blocks.

The effective execution expiry is:

```text
min(signed approval expiresAt, Step U and Step S effective expiry)
```

Changing expiry, nonce, signer, operation plan, inventory, material, or evidence bindings changes the signed payload. Recomputing only IDs and hashes while reusing the old signature is rejected.

## Safety result

Only `node:crypto` SHA-256, Ed25519 public-key parsing, and Ed25519 verification are used. The production module has no filesystem, child-process, environment-variable, provider, network, DNS, TLS, HTTP, socket, PostgreSQL, database, SQL, runtime-route, cron, worker, or deployment capability. Tests use only synthetic in-memory keys, signatures, Step U material, and descriptor doubles.
