# Step 114-2X-M non-executing observation authority

## Boundary

Successful offline verification prepares a sealed, non-executing observation-authority package. It does not activate authority and cannot perform an observation. The package binds the Step L summary and sanitized intake, Step H request, Step K template, Step M response, approver allowlist, verification policy, sanitized signer identity, signature digest, exact observation scope and role, operation set, observation count, observation window, request/response nonce hashes, and response issue/expiry interval.

`nonExecuting` is fixed `true`. `rawMaterialPresent` is fixed `false`.

## Fixed-false authority

The following fields remain fixed `false` in successful, awaiting, and blocked results, and in the authority package and verification summary:

- selection and human decision recording; real environment class, target, provisioning evidence, intake, approval response, and signer material recording
- live approval request sending, approval recording, signature consumption, and live authority activation
- provider research, provider selection, account access, target selection, environment or credential provisioning
- credential use or injection
- environment observation authorization or execution
- provider, test-database, or production-database connection authorization
- one-time authorization issue, provisioning runbook activation, SQL, migration, or scenario authority
- evidence collection, environment disposal, commit, push, merge, deployment, or production publication authority

The machine-readable list is `FIXED_FALSE_FIELDS` in the Step M core module and is exact-bound into the verification policy.

## Chronology and replay protection

All timestamps are canonical UTC millisecond instants. A response must be issued after the Step H request, remain within the sanitized intake, Step K template, and observation windows, stay within the signer validity interval, and have a maximum lifetime of 60 seconds. Evaluation permits only the declared 30-second clock skew and rejects an expired response.

The response nonce must be a SHA-256 value distinct from both the Step H request nonce and Step L intake nonce. The prior-response nonce context must be an exact sorted, duplicate-free SHA-256 array, and a replay match blocks verification.

## Synthetic fixture rule

Tests generate an Ed25519 key pair and signature only in process memory. The core module cannot generate keys or signatures. Test material is synthetic, sanitized, non-provider-specific, and is never persisted by the implementation.
